// LLM (navigateur) — mode démo hors-ligne OU appel direct à une API compatible OpenAI
// avec une clé fournie par l'utilisateur (stockée en localStorage, jamais committée).

const LS_CFG = "neuralstark:llm:v1";

export function getConfig() {
  try { return JSON.parse(localStorage.getItem(LS_CFG)) || {}; } catch { return {}; }
}
export function setConfig(cfg) {
  localStorage.setItem(LS_CFG, JSON.stringify(cfg || {}));
}
export function providerInfo() {
  const c = getConfig();
  return c.apiKey
    ? { mode: "live", model: c.model || "gpt-4o-mini", baseUrl: (c.baseUrl || "https://api.openai.com/v1") }
    : { mode: "demo", model: "démo-extractif", baseUrl: null };
}

function buildContextBlock(passages) {
  if (!passages.length) return "";
  return passages.map((p, i) => `[Source ${i + 1} — ${p.source}]\n${p.text}`).join("\n\n");
}

// Fournisseurs qui autorisent l'appel direct depuis un navigateur (en-têtes CORS).
// OpenAI/DeepSeek NE les envoient PAS : un site statique ne peut pas les appeler
// directement — le navigateur bloque la requête avant même l'envoi.
const BROWSER_FRIENDLY = "Groq (https://api.groq.com/openai/v1), OpenRouter " +
  "(https://openrouter.ai/api/v1) ou un modèle local (Ollama / LM Studio)";

async function callOpenAICompatible(messages) {
  const c = getConfig();
  const baseUrl = (c.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  let res;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.apiKey}` },
      body: JSON.stringify({ model: c.model || "gpt-4o-mini", messages, temperature: 0.3, max_tokens: 900 }),
      signal: ctrl.signal,
    });
  } catch (e) {
    // fetch() rejette (TypeError) quand la requête n'a jamais abouti : blocage CORS
    // du navigateur, DNS/URL invalide, hors-ligne, ou délai dépassé (abort).
    if (e.name === "AbortError") throw new Error("délai dépassé (45 s). Le fournisseur n'a pas répondu.");
    const blocksBrowser = /\/\/(api\.openai\.com|api\.deepseek\.com)\//.test(baseUrl + "/");
    throw new Error(
      (blocksBrowser
        ? "ce fournisseur (OpenAI/DeepSeek) bloque les appels directs depuis un navigateur (CORS). "
        : "impossible de joindre le fournisseur (blocage CORS, URL invalide ou hors-ligne). ") +
      `Utilisez un fournisseur compatible navigateur — ${BROWSER_FRIENDLY} — ou laissez le champ clé vide pour le mode démo.`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    if (res.status === 401) throw new Error("clé API refusée (401). Vérifiez votre clé dans ⚙️.");
    if (res.status === 402) throw new Error("crédit insuffisant (402). Vérifiez le solde de votre compte.");
    if (res.status === 404) throw new Error(`modèle ou URL introuvable (404). Vérifiez « ${c.model} » et l'URL de base.`);
    if (res.status === 429) throw new Error("quota ou limite de débit atteinte (429). Réessayez plus tard.");
    throw new Error(`LLM ${res.status}: ${detail}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "(réponse vide)";
}

function sourcesOf(passages) {
  return passages.map((p, i) => ({ n: i + 1, source: p.source, score: Number(p.score.toFixed(3)) }));
}

// ---------- Agent unique ----------
function demoAnswer(agent, message, passages) {
  const intro = `**${agent.name}** — ${agent.description}`;
  if (!passages.length) {
    return `${intro}\n\nJe n'ai trouvé aucun document interne pertinent pour « ${message} ».\n\n` +
      `➡️ Ajoutez des documents dans la base de connaissances (à droite) pour une réponse fondée sur vos données.\n\n` +
      `_Mode démo : aucune clé LLM. Ouvrez ⚙️ pour connecter un modèle et obtenir des réponses génératives._`;
  }
  const bullets = passages.map((p) => {
    const s = p.text.replace(/\s+/g, " ").slice(0, 240).trim();
    return `- **${p.source}** : ${s}${p.text.length > 240 ? "…" : ""}`;
  }).join("\n");
  return `${intro}\n\nVoici ce que j'ai trouvé dans votre base de connaissances au sujet de « ${message} » :\n\n` +
    `${bullets}\n\n_Réponse en mode démo (extraction). Ouvrez ⚙️ pour une synthèse rédigée par un LLM._`;
}

export async function generate({ agent, message, history = [], passages = [] }) {
  const sources = sourcesOf(passages);
  if (!getConfig().apiKey) return { answer: demoAnswer(agent, message, passages), sources, mode: "demo" };

  const context = buildContextBlock(passages);
  const system = agent.systemPrompt +
    (context ? `\n\n--- CONTEXTE (RAG) ---\n${context}\n--- FIN ---` : `\n\n(Aucun document interne pertinent trouvé.)`);
  const messages = [
    { role: "system", content: system },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];
  return { answer: await callOpenAICompatible(messages), sources, mode: "live" };
}

// ---------- Orchestration (Neural Cerveau Central) ----------
function demoOrchestration(orchestrator, message, routed, passages) {
  const header = `**${orchestrator.name}** 🧠 — j'ai analysé votre demande et je la route vers les agents les plus pertinents.`;
  if (!routed.length) {
    return `${header}\n\nAucun agent spécialisé clairement adapté à « ${message} ». Précisez le domaine (finance, RH, marketing, chantier…).`;
  }
  const pick = routed.map((r, i) =>
    `- ${i === 0 ? "→ " : ""}${r.agent.icon} **${r.agent.name}** — ${r.agent.description} _(pertinence ${r.score})_`).join("\n");
  const lead = routed[0].agent;
  let delegation;
  if (passages.length) {
    const bullets = passages.slice(0, 3).map((p) => {
      const s = p.text.replace(/\s+/g, " ").slice(0, 200).trim();
      return `- **${p.source}** : ${s}${p.text.length > 200 ? "…" : ""}`;
    }).join("\n");
    delegation = `\n\n**Réponse coordonnée** (via ${lead.name}, depuis votre base de connaissances) :\n\n${bullets}`;
  } else {
    delegation = `\n\n**${lead.name}** prend le relais, mais aucun document interne pertinent n'a été trouvé. Ajoutez des documents pour une réponse fondée sur vos données.`;
  }
  return `${header}\n\n**Agents sélectionnés :**\n${pick}${delegation}\n\n_Mode démo : routage + extraction. Ouvrez ⚙️ pour une synthèse LLM._`;
}

export async function orchestrate({ orchestrator, message, history = [], passages = [], routed = [] }) {
  const sources = sourcesOf(passages);
  const routedOut = routed.map((r) => ({ id: r.agent.id, name: r.agent.name, icon: r.agent.icon, color: r.agent.color, score: r.score }));
  if (!getConfig().apiKey) return { answer: demoOrchestration(orchestrator, message, routed, passages), sources, routed: routedOut, mode: "demo" };

  const roster = routed.length
    ? routed.map((r, i) => `${i + 1}. ${r.agent.name} — ${r.agent.description}`).join("\n")
    : "(aucun agent présélectionné)";
  const context = buildContextBlock(passages);
  const system =
    `Tu es « Neural Cerveau Central », l'orchestrateur en chef de NeuralStark qui coordonne 130 agents IA spécialisés. ` +
    `Le routeur a présélectionné ces spécialistes :\n${roster}\n\n` +
    `Produis UNE réponse coordonnée en français : indique brièvement à qui tu délègues et pourquoi, puis réponds en t'appuyant sur le contexte ci-dessous. N'invente rien qui n'y figure pas.` +
    (context ? `\n\n--- CONTEXTE (RAG) ---\n${context}\n--- FIN ---` : `\n\n(Aucun document interne pertinent trouvé.)`);
  const messages = [
    { role: "system", content: system },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];
  return { answer: await callOpenAICompatible(messages), sources, routed: routedOut, mode: "live" };
}
