// Abstraction du fournisseur LLM.
// - Si LLM_API_KEY est défini : appelle une API compatible OpenAI (OpenAI, DeepSeek,
//   Groq, Ollama, LM Studio, vLLM…) via /chat/completions.
// - Sinon : mode DÉMO 100 % hors-ligne — réponse extractive construite à partir
//   des passages RAG récupérés et du rôle de l'agent.

const API_KEY   = process.env.LLM_API_KEY || "";
const BASE_URL  = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const MODEL     = process.env.LLM_MODEL || "gpt-4o-mini";

export function providerInfo() {
  return {
    mode: API_KEY ? "live" : "demo",
    baseUrl: API_KEY ? BASE_URL : null,
    model: API_KEY ? MODEL : "démo-extractif",
  };
}

function buildContextBlock(passages) {
  if (!passages.length) return "";
  return passages
    .map((p, i) => `[Source ${i + 1} — ${p.source}]\n${p.text}`)
    .join("\n\n");
}

// Réponse en mode démo : pas de LLM, on synthétise à partir du contexte.
function demoAnswer(agent, message, passages) {
  const intro = `**${agent.name}** — ${agent.description}`;
  if (!passages.length) {
    return (
      `${intro}\n\n` +
      `Je n'ai trouvé aucun document interne pertinent pour « ${message} ».\n\n` +
      `➡️ Ajoutez des documents dans la base de connaissances (panneau de droite) ` +
      `pour que je puisse répondre à partir de vos données réelles.\n\n` +
      `_Mode démo actif : aucune clé LLM configurée. Définissez \`LLM_API_KEY\` ` +
      `pour activer des réponses génératives complètes._`
    );
  }
  const bullets = passages
    .map((p) => {
      const snippet = p.text.replace(/\s+/g, " ").slice(0, 240).trim();
      return `- **${p.source}** : ${snippet}${p.text.length > 240 ? "…" : ""}`;
    })
    .join("\n");
  return (
    `${intro}\n\n` +
    `Voici ce que j'ai trouvé dans votre base de connaissances au sujet de « ${message} » :\n\n` +
    `${bullets}\n\n` +
    `_Réponse générée en mode démo (extraction depuis vos documents). ` +
    `Configurez \`LLM_API_KEY\` pour une synthèse rédigée par un LLM._`
  );
}

async function callOpenAICompatible(messages) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 900,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "(réponse vide)";
}

// Point d'entrée : renvoie { answer, sources, mode }.
export async function generate({ agent, message, history = [], passages = [] }) {
  const sources = passages.map((p, i) => ({ n: i + 1, source: p.source, score: Number(p.score.toFixed(3)) }));

  if (!API_KEY) {
    return { answer: demoAnswer(agent, message, passages), sources, mode: "demo" };
  }

  const context = buildContextBlock(passages);
  const system =
    agent.systemPrompt +
    (context
      ? `\n\n--- CONTEXTE (documents internes récupérés par RAG) ---\n${context}\n--- FIN DU CONTEXTE ---`
      : `\n\n(Aucun document interne pertinent n'a été trouvé pour cette question.)`);

  const messages = [
    { role: "system", content: system },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const answer = await callOpenAICompatible(messages);
  return { answer, sources, mode: "live" };
}

// ---------- Orchestration (Neural Cerveau Central) ----------
// L'orchestrateur analyse la demande, s'appuie sur les agents pré-sélectionnés par
// le routeur, puis produit une réponse coordonnée (+ contexte RAG).
function demoOrchestration(orchestrator, message, routed, passages) {
  const header = `**${orchestrator.name}** 🧠 — j'ai analysé votre demande et je la route vers les agents les plus pertinents.`;
  if (!routed.length) {
    return (
      `${header}\n\n` +
      `Je n'ai pas identifié d'agent spécialisé clairement adapté à « ${message} ». ` +
      `Reformulez votre demande ou précisez le domaine (finance, RH, marketing, chantier…).`
    );
  }
  const pick = routed
    .map((r, i) => `- ${i === 0 ? "→ " : ""}${r.agent.icon} **${r.agent.name}** — ${r.agent.description} _(pertinence ${r.score})_`)
    .join("\n");
  const lead = routed[0].agent;

  let delegation;
  if (passages.length) {
    const bullets = passages.slice(0, 3).map((p) => {
      const snip = p.text.replace(/\s+/g, " ").slice(0, 200).trim();
      return `- **${p.source}** : ${snip}${p.text.length > 200 ? "…" : ""}`;
    }).join("\n");
    delegation =
      `\n\n**Réponse coordonnée** (via ${lead.name}, à partir de votre base de connaissances) :\n\n${bullets}`;
  } else {
    delegation =
      `\n\n**${lead.name}** prend le relais, mais aucun document interne pertinent n'a été trouvé. ` +
      `Ajoutez des documents dans la base de connaissances pour une réponse fondée sur vos données.`;
  }

  return (
    `${header}\n\n**Agents sélectionnés :**\n${pick}${delegation}\n\n` +
    `_Mode démo : routage + extraction. Configurez \`LLM_API_KEY\` pour une synthèse rédigée par le LLM._`
  );
}

export async function orchestrate({ orchestrator, message, history = [], passages = [], routed = [] }) {
  const sources = passages.map((p, i) => ({ n: i + 1, source: p.source, score: Number(p.score.toFixed(3)) }));
  const routedOut = routed.map((r) => ({
    id: r.agent.id, name: r.agent.name, icon: r.agent.icon, color: r.agent.color, score: r.score,
  }));

  if (!API_KEY) {
    return { answer: demoOrchestration(orchestrator, message, routed, passages), sources, routed: routedOut, mode: "demo" };
  }

  const roster = routed.length
    ? routed.map((r, i) => `${i + 1}. ${r.agent.name} — ${r.agent.description}`).join("\n")
    : "(aucun agent spécialisé n'a été présélectionné)";
  const context = buildContextBlock(passages);

  const system =
    `Tu es « Neural Cerveau Central », l'orchestrateur en chef de la plateforme NeuralStark, ` +
    `qui coordonne 130 agents IA spécialisés. Pour la demande de l'utilisateur, le routeur a ` +
    `présélectionné ces agents spécialisés :\n${roster}\n\n` +
    `Ta mission : produire UNE réponse coordonnée en français. Commence par indiquer brièvement ` +
    `à quel(s) agent(s) tu délègues et pourquoi, puis donne la réponse en t'appuyant en priorité ` +
    `sur le contexte documentaire ci-dessous. N'invente rien qui n'y figure pas.` +
    (context ? `\n\n--- CONTEXTE (RAG) ---\n${context}\n--- FIN ---` : `\n\n(Aucun document interne pertinent trouvé.)`);

  const messages = [
    { role: "system", content: system },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];
  const answer = await callOpenAICompatible(messages);
  return { answer, sources, routed: routedOut, mode: "live" };
}
