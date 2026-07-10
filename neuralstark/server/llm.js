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
