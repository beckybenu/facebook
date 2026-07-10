// Serveur NeuralStark — HTTP natif Node (aucune dépendance).
// Sert le frontend statique + une API REST : agents, documents (RAG), chat.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { RagStore } from "./rag.js";
import { AgentRouter } from "./router.js";
import { generate, orchestrate, providerInfo } from "./llm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const PORT = process.env.PORT || 5178;

const rag = new RagStore();
let AGENTS = null;
let ROUTER = null;
async function loadAgents() {
  if (!AGENTS) {
    const raw = await readFile(join(PUBLIC, "data", "agents.json"), "utf8");
    AGENTS = JSON.parse(raw);
    AGENTS.byId = Object.fromEntries(AGENTS.agents.map((a) => [a.id, a]));
    ROUTER = new AgentRouter(AGENTS.agents);
  }
  return AGENTS;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
};

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function readBody(req, limit = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("payload trop volumineux")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error("JSON invalide")); }
    });
    req.on("error", reject);
  });
}

async function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = normalize(join(PUBLIC, urlPath));
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end("Forbidden"); }
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) throw new Error("dir");
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    // SPA fallback
    try {
      const data = await readFile(join(PUBLIC, "index.html"));
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(data);
    } catch { res.writeHead(404); res.end("Not found"); }
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  try {
    // --- API ---
    if (pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, provider: providerInfo(), rag: rag.stats() });
    }

    if (pathname === "/api/agents" && req.method === "GET") {
      const a = await loadAgents();
      return sendJson(res, 200, { count: a.count, categories: a.categories, agents: a.agents });
    }

    if (pathname === "/api/documents" && req.method === "GET") {
      return sendJson(res, 200, { documents: rag.list(), stats: rag.stats() });
    }

    if (pathname === "/api/documents" && req.method === "POST") {
      const body = await readBody(req);
      const name = (body.name || "").toString().slice(0, 200) || "document";
      const content = (body.content || "").toString();
      if (content.trim().length < 3) return sendJson(res, 400, { error: "contenu vide" });
      const doc = rag.addDocument(name, content);
      return sendJson(res, 201, { document: doc, stats: rag.stats() });
    }

    if (pathname.startsWith("/api/documents/") && req.method === "DELETE") {
      const id = pathname.split("/").pop();
      const ok = rag.removeDocument(id);
      return sendJson(res, ok ? 200 : 404, { removed: ok, stats: rag.stats() });
    }

    // Aperçu du routage seul (pour l'UI, sans générer de réponse).
    if (pathname === "/api/route" && req.method === "POST") {
      await loadAgents();
      const body = await readBody(req);
      const message = (body.message || "").toString().trim();
      if (!message) return sendJson(res, 400, { error: "message vide" });
      const routed = ROUTER.route(message, body.k || 3).map((r) => ({
        id: r.agent.id, name: r.agent.name, icon: r.agent.icon, color: r.agent.color, score: r.score,
      }));
      return sendJson(res, 200, { routed });
    }

    if (pathname === "/api/chat" && req.method === "POST") {
      const a = await loadAgents();
      const body = await readBody(req);
      const agent = a.byId[body.agentId];
      const message = (body.message || "").toString().trim();
      if (!agent) return sendJson(res, 400, { error: "agent inconnu" });
      if (!message) return sendJson(res, 400, { error: "message vide" });
      const history = Array.isArray(body.history) ? body.history : [];

      // Le Cerveau Central orchestre : il route vers les agents pertinents et compose.
      if (agent.id === "cerveau-central") {
        const routed = ROUTER.route(message, 3);
        const passages = rag.search(message, 4);
        const result = await orchestrate({ orchestrator: agent, message, history, passages, routed });
        return sendJson(res, 200, { agent: { id: agent.id, name: agent.name }, orchestrated: true, ...result });
      }

      const passages = rag.search(message, 4);
      const result = await generate({ agent, message, history, passages });
      return sendJson(res, 200, { agent: { id: agent.id, name: agent.name }, ...result });
    }

    if (pathname.startsWith("/api/")) {
      return sendJson(res, 404, { error: "route inconnue" });
    }

    // --- Static ---
    return await serveStatic(req, res);
  } catch (err) {
    return sendJson(res, 500, { error: err.message || "erreur serveur" });
  }
});

server.listen(PORT, () => {
  const info = providerInfo();
  console.log(`\n  🧠 NeuralStark — serveur prêt`);
  console.log(`  ➜  http://localhost:${PORT}`);
  console.log(`  ➜  LLM : ${info.mode === "live" ? `live (${info.model} @ ${info.baseUrl})` : "mode démo (aucune clé)"}`);
  console.log(`  ➜  RAG : ${JSON.stringify(rag.stats())}\n`);
});
