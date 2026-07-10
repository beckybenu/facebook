// NeuralStark — application 100 % navigateur (aucun backend).
// RAG, routeur et LLM tournent côté client ; déployable en site statique (GitHub Pages).
import { RagStore } from "./lib/rag.js";
import { AgentRouter } from "./lib/router.js";
import { generate, orchestrate, providerInfo, getConfig, setConfig } from "./lib/llm.js";

const state = {
  agents: [], categories: {}, byId: {}, active: null, history: [], sending: false,
  rag: null, router: null,
};

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "style") n.setAttribute("style", v);
    else n.setAttribute(k, v);
  });
  kids.flat().forEach((c) => n.append(c?.nodeType ? c : document.createTextNode(c ?? "")));
  return n;
};

// ---------- Boot ----------
async function boot() {
  const agentsRes = await fetch("data/agents.json").then((r) => r.json());
  state.agents = agentsRes.agents;
  state.categories = agentsRes.categories;
  state.byId = Object.fromEntries(state.agents.map((a) => [a.id, a]));
  $("#agent-count-badge").textContent = `${agentsRes.count} agents`;

  state.router = new AgentRouter(state.agents);
  state.rag = new RagStore();
  try {
    const man = await fetch("data/knowledge/manifest.json").then((r) => r.json());
    await state.rag.seedIfEmpty(man.files || []);
  } catch { /* pas de seed : la base démarre vide */ }

  updateProviderBadge();
  renderAgentList();
  refreshDocs();
  wireComposer();
  wireDocForm();
  wireSettings();
  wireMobileNav();
  $("#agent-search").addEventListener("input", (e) => renderAgentList(e.target.value));
  $("#clear-chat").addEventListener("click", clearChat);
}

// ---------- Navigation mobile (menu ☰) ----------
function setSidebar(open) {
  $(".sidebar")?.classList.toggle("open", open);
  $("#sidebar-backdrop")?.classList.toggle("show", open);
}
function wireMobileNav() {
  $("#menu-btn")?.addEventListener("click", () => {
    const sb = $(".sidebar");
    setSidebar(!sb.classList.contains("open"));
  });
  $("#sidebar-backdrop")?.addEventListener("click", () => setSidebar(false));
}

function updateProviderBadge() {
  const b = $("#provider-badge");
  const p = providerInfo();
  if (p.mode === "live") { b.textContent = `LLM: ${p.model}`; b.className = "badge badge-live"; }
  else { b.textContent = "Mode démo"; b.className = "badge badge-muted"; }
}

// ---------- Catalogue ----------
function renderAgentList(filter = "") {
  const list = $("#agent-list");
  list.innerHTML = "";
  const q = filter.trim().toLowerCase();

  const brain = state.byId["cerveau-central"];
  if (brain && (!q || brain.name.toLowerCase().includes(q) || "orchestrateur".includes(q))) {
    const card = el("button", {
      class: "orchestrator-card" + (state.active?.id === brain.id ? " active" : ""),
      type: "button", title: "Orchestre automatiquement les 130 agents",
    },
      el("span", { class: "orch-icon" }, brain.icon),
      el("div", { class: "orch-text" },
        el("strong", {}, brain.name),
        el("span", {}, "Orchestrateur — route vers les 130 agents"),
      ),
    );
    card.addEventListener("click", () => selectAgent(brain.id));
    list.append(card);
  }

  for (const [key, cat] of Object.entries(state.categories)) {
    const agents = state.agents.filter(
      (a) => a.category === key && a.id !== "cerveau-central" &&
      (!q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    );
    if (!agents.length) continue;

    const group = el("div", { class: "cat-group" + (q ? "" : (key === "core" ? "" : " collapsed")) });
    const header = el("button", { class: "cat-header", type: "button" },
      el("span", { class: "cat-icon" }, cat.icon),
      el("span", {}, cat.label),
      el("span", { class: "cat-count" }, String(agents.length)),
      el("span", { class: "chevron" }, "▼"),
    );
    header.addEventListener("click", () => group.classList.toggle("collapsed"));
    const wrap = el("div", { class: "cat-agents" });
    for (const a of agents) {
      const item = el("button", {
        class: "agent-item" + (state.active?.id === a.id ? " active" : ""),
        type: "button", title: a.description,
      },
        el("span", { class: "agent-dot", style: `background:${a.color}` }),
        el("span", { class: "a-name" }, a.name),
        el("span", { class: "a-num" }, `#${a.number}`),
      );
      item.addEventListener("click", () => selectAgent(a.id));
      wrap.append(item);
    }
    group.append(header, wrap);
    list.append(group);
  }
  if (!list.children.length) list.append(el("div", { class: "doc-empty" }, "Aucun agent ne correspond."));
}

function selectAgent(id) {
  const a = state.byId[id];
  if (!a) return;
  state.active = a; state.history = [];
  document.documentElement.style.setProperty("--c", a.color);
  const icon = $("#active-icon");
  icon.textContent = a.icon; icon.style.setProperty("--c", a.color);
  $("#active-name").textContent = a.name;
  $("#active-desc").textContent = a.description;
  $("#messages").innerHTML = "";
  $("#composer-input").disabled = false;
  $("#send-btn").disabled = false;
  $("#composer-input").focus();
  pushBotIntro(a);
  renderAgentList($("#agent-search").value);
  setSidebar(false); // referme le menu mobile après sélection
}

function pushBotIntro(a) {
  if (a.id === "cerveau-central") {
    addMessage("bot",
      `Bonjour 👋 Je suis **${a.name}**, l'orchestrateur de NeuralStark.\n\n` +
      `Décrivez votre besoin en langage naturel — j'**analyse** votre demande, je la **route** ` +
      `automatiquement vers le ou les agents les plus pertinents parmi les 130, et je **synthétise** ` +
      `une réponse à partir de votre base de connaissances.\n\n` +
      `_Exemples : « ce devis est-il rentable ? », « rédige un post pour Instagram », ` +
      `« quel est le tarif façade ? », « prépare l'onboarding d'un nouveau peintre »._`, [], a);
    return;
  }
  addMessage("bot", `Bonjour 👋 Je suis **${a.name}**. ${a.description}\n\nPosez-moi votre question — je m'appuierai sur les documents de votre base de connaissances.`, [], a);
}

// ---------- Rendu messages ----------
function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = esc(md).split("\n");
  let html = "", inList = false;
  const inline = (s) => s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-•]\s+/.test(line)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(line.replace(/^\s*[-•]\s+/, ""))}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      if (line.trim()) html += `<p>${inline(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function addMessage(role, content, sources = [], agent = state.active, routed = []) {
  $("#empty-state")?.remove();
  const avatar = role === "user" ? "🧑" : (agent?.icon || "🧠");
  const bubble = el("div", { class: "msg-bubble", html: mdToHtml(content) });
  if (routed?.length) {
    const r = el("div", { class: "routed" }, el("span", { class: "routed-label" }, "🧠 Agents mobilisés :"));
    routed.forEach((ag, i) => r.append(el("span", {
      class: "routed-chip" + (i === 0 ? " lead" : ""), style: `--c:${ag.color}`, title: `pertinence ${ag.score}`,
    }, `${ag.icon} ${ag.name}`)));
    bubble.append(r);
  }
  if (sources?.length) {
    const s = el("div", { class: "sources" });
    for (const src of sources) s.append(el("span", { class: "source-chip" }, `📄 ${src.source}`));
    bubble.append(s);
  }
  const msg = el("div", { class: `msg ${role}` }, el("div", { class: "msg-avatar" }, avatar), bubble);
  const box = $("#messages");
  box.append(msg); box.scrollTop = box.scrollHeight;
  return msg;
}

function addTyping() {
  $("#empty-state")?.remove();
  const msg = el("div", { class: "msg bot", id: "typing" },
    el("div", { class: "msg-avatar" }, state.active?.icon || "🧠"),
    el("div", { class: "msg-bubble typing", html: "<span></span><span></span><span></span>" }));
  const box = $("#messages");
  box.append(msg); box.scrollTop = box.scrollHeight;
}

function clearChat() {
  if (!state.active) return;
  state.history = [];
  $("#messages").innerHTML = "";
  pushBotIntro(state.active);
}

// ---------- Composer ----------
function wireComposer() {
  const input = $("#composer-input");
  input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 160) + "px"; });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").requestSubmit(); } });
  $("#composer").addEventListener("submit", onSend);
}

async function onSend(e) {
  e.preventDefault();
  const input = $("#composer-input");
  const message = input.value.trim();
  if (!message || !state.active || state.sending) return;
  state.sending = true; $("#send-btn").disabled = true;
  input.value = ""; input.style.height = "auto";
  addMessage("user", message);
  state.history.push({ role: "user", content: message });
  addTyping();

  try {
    const passages = state.rag.search(message, 4);
    let data;
    if (state.active.id === "cerveau-central") {
      const routed = state.router.route(message, 3);
      data = await orchestrate({ orchestrator: state.active, message, history: state.history, passages, routed });
    } else {
      data = await generate({ agent: state.active, message, history: state.history, passages });
    }
    $("#typing")?.remove();
    addMessage("bot", data.answer, data.sources || [], state.active, data.routed || []);
    state.history.push({ role: "assistant", content: data.answer });
  } catch (err) {
    $("#typing")?.remove();
    addMessage("bot", `⚠️ Erreur : ${err.message}. Vérifiez votre clé/URL dans ⚙️ ou repassez en mode démo.`);
  } finally {
    state.sending = false; $("#send-btn").disabled = false; input.focus();
  }
}

// ---------- Base de connaissances ----------
function wireDocForm() {
  $("#doc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#doc-name").value.trim() || "document.txt";
    const content = $("#doc-content").value.trim();
    if (content.length < 3) return;
    state.rag.addDocument(name, content);
    $("#doc-name").value = ""; $("#doc-content").value = "";
    refreshDocs();
  });
  $("#doc-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { $("#doc-content").value = reader.result; if (!$("#doc-name").value.trim()) $("#doc-name").value = file.name; };
    reader.readAsText(file);
  });
}

function refreshDocs() {
  const docs = state.rag.list();
  const stats = state.rag.stats();
  const list = $("#doc-list");
  list.innerHTML = "";
  $("#rag-stats").textContent = `${stats.documents} doc · ${stats.chunks} extraits`;
  if (!docs.length) { list.append(el("div", { class: "doc-empty" }, "Aucun document.\nAjoutez-en pour activer le RAG.")); return; }
  for (const d of docs) {
    list.append(el("div", { class: "doc-card" },
      el("span", { class: "doc-icon" }, "📄"),
      el("div", { class: "doc-info" },
        el("div", { class: "doc-title", title: d.name }, d.name),
        el("div", { class: "doc-sub" }, `${d.chunks} extrait${d.chunks > 1 ? "s" : ""}`)),
      el("button", { class: "doc-del", title: "Supprimer", onclick: () => { state.rag.removeDocument(d.id); refreshDocs(); } }, "×"),
    ));
  }
}

// ---------- Réglages LLM (⚙️) ----------
function wireSettings() {
  const modal = $("#settings-modal");
  const open = () => {
    const c = getConfig();
    $("#cfg-key").value = c.apiKey || "";
    $("#cfg-base").value = c.baseUrl || "https://api.openai.com/v1";
    $("#cfg-model").value = c.model || "gpt-4o-mini";
    modal.classList.add("open");
  };
  const close = () => modal.classList.remove("open");
  $("#settings-btn").addEventListener("click", open);
  $("#cfg-cancel").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  $("#cfg-save").addEventListener("click", () => {
    setConfig({
      apiKey: $("#cfg-key").value.trim(),
      baseUrl: $("#cfg-base").value.trim() || "https://api.openai.com/v1",
      model: $("#cfg-model").value.trim() || "gpt-4o-mini",
    });
    updateProviderBadge(); close();
  });
  $("#cfg-clear").addEventListener("click", () => { setConfig({}); updateProviderBadge(); close(); });
}

boot();
