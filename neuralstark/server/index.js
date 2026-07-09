// NeuralStarK — serveur HTTP : API du cerveau + tableau de bord.
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ask, hasApiKey } from "./brain.js";
import { AGENTS } from "./agents.js";
import { getState } from "./store.js";
import { executeTool } from "./tools.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

// ---- État & données (utilisables même sans clé API) ----

app.get("/api/status", (_req, res) => {
  res.json({
    name: "NeuralStarK",
    ready: hasApiKey(),
    model: process.env.NEURALSTARK_MODEL || "claude-opus-4-8",
    agents: Object.values(AGENTS).map(({ name, label, emoji, description }) => ({ name, label, emoji, description })),
  });
});

app.get("/api/data", (_req, res) => {
  const { company, tasks, events, contacts, emails, posts, documents, activity } = getState();
  res.json({
    company,
    tasks,
    events,
    contacts,
    emails,
    posts,
    documents: documents.map((d) => ({ id: d.id, title: d.title, tags: d.tags, createdAt: d.createdAt, length: (d.content || "").length })),
    activity: activity.slice(0, 50),
  });
});

// Accès direct aux outils (CRUD manuel depuis le tableau de bord, sans IA).
const DIRECT_TOOLS = new Set([
  "create_task", "update_task", "create_event", "upsert_contact", "log_interaction",
  "draft_email", "schedule_post", "kb_add_document", "update_company_profile", "kb_search",
]);

app.post("/api/tools/:name", (req, res) => {
  const { name } = req.params;
  if (!DIRECT_TOOLS.has(name)) return res.status(400).json({ error: `Outil non exposé : ${name}` });
  try {
    res.json(executeTool("utilisateur", name, req.body || {}));
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

// ---- Le cerveau ----

app.post("/api/ask", async (req, res) => {
  const { message, agent = "auto", history = [] } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Le champ « message » est requis." });
  }
  if (!hasApiKey()) {
    return res.status(503).json({
      error: "Clé API manquante : définissez ANTHROPIC_API_KEY pour activer le cerveau. Le tableau de bord et les modules restent utilisables manuellement.",
    });
  }
  try {
    const result = await ask(message, { agentName: agent, history });
    // On renvoie un historique simplifié (texte uniquement) pour les tours suivants.
    res.json({
      agent: result.agent,
      text: result.text,
      steps: result.steps,
      history: [
        ...history,
        { role: "user", content: message },
        { role: "assistant", content: result.text || "(aucune réponse)" },
      ].slice(-12),
    });
  } catch (err) {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
    res.status(status).json({ error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`🧠 NeuralStarK est en ligne : http://localhost:${PORT}`);
  console.log(hasApiKey()
    ? "   Cerveau actif (clé API détectée)."
    : "   ⚠ ANTHROPIC_API_KEY non définie — mode tableau de bord seul (le chat IA est désactivé).");
});
