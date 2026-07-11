// NeuralStark — application 100 % navigateur (aucun backend).
// RAG, routeur et LLM tournent côté client ; déployable en site statique (GitHub Pages).
import { RagStore } from "./lib/rag.js";
import { AgentRouter } from "./lib/router.js";
import { generate, orchestrate, providerInfo, getConfig, setConfig } from "./lib/llm.js";
import {
  extractInsights, buildBriefing, getActionPlan,
  actionStatus, setActionStatus, pendingCount,
  getCompanyName, setCompanyName,
} from "./lib/cockpit.js";
import { AutomationEngine, TRIGGERS, loadJournal } from "./lib/automation.js";

const state = {
  agents: [], categories: {}, byId: {}, active: null, history: [], sending: false,
  rag: null, router: null,
  sectors: [], sector: null, allowed: null, // allowed = Set d'ids d'agents du pack métier (null = tous)
  engine: null, // Neural Automation Engine
};
const LS_SECTOR = "neuralstark:sector:v1";

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

  try {
    const sec = await fetch("data/sectors.json").then((r) => r.json());
    state.sectors = sec.sectors || [];
  } catch { state.sectors = []; }
  wireSectorPicker();
  applySector(localStorage.getItem(LS_SECTOR) || "tous", { silent: true });

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

  // Le client ne parle qu'à UN assistant : la conversation démarre directement
  // avec le Cerveau Central, qui mobilise les spécialistes en coulisses.
  selectAgent("cerveau-central");
  wireCockpit();
  wireAutomations();
  startEngine(); // les agents commencent à travailler en autonomie
}

// ---------- Cockpit (l'IA pilote l'entreprise) ----------
function setView(view) {
  const views = { chat: ["#messages", "#composer"], cockpit: ["#cockpit"], autom: ["#autom"] };
  for (const [name, sels] of Object.entries(views)) {
    for (const sel of sels) { const n = $(sel); if (n) n.hidden = name !== view; }
  }
  $("#tab-chat").classList.toggle("active", view === "chat");
  $("#tab-cockpit").classList.toggle("active", view === "cockpit");
  $("#tab-autom").classList.toggle("active", view === "autom");
  if (view === "cockpit") renderCockpit();
  if (view === "autom") renderAutomations();
}

function wireCockpit() {
  $("#tab-chat").addEventListener("click", () => setView("chat"));
  $("#tab-cockpit").addEventListener("click", () => setView("cockpit"));
  $("#tab-autom").addEventListener("click", () => setView("autom"));
  $("#refresh-briefing").addEventListener("click", renderCockpit);
  const company = $("#company-name");
  company.value = getCompanyName();
  company.addEventListener("change", () => { setCompanyName(company.value.trim()); renderCockpit(); });
}

function renderCockpit() {
  const s = currentSector();
  const insights = extractInsights(state.rag);
  const plan = getActionPlan(state.sector, state.allowed);
  const pending = pendingCount(state.sector || "tous", plan);

  // KPIs
  const fmt = (n) => n.toLocaleString("fr-CH", { maximumFractionDigits: 0 });
  const kpis = [
    { value: String(insights.documents), label: "Documents surveillés" },
    { value: insights.amounts ? `${fmt(insights.total)} ${insights.currency}` : "—", label: "Volume détecté" },
    { value: String(s ? s.count : state.agents.length), label: "Agents actifs" },
    { value: String(pending), label: "Actions en attente" },
  ];
  const row = $("#kpi-row");
  row.innerHTML = "";
  for (const k of kpis) {
    row.append(el("div", { class: "kpi-tile" },
      el("div", { class: "kpi-value" }, k.value),
      el("div", { class: "kpi-label" }, k.label)));
  }

  // Briefing
  const company = getCompanyName();
  let briefing = buildBriefing({ sector: s, insights, actionsPending: pending });
  if (company) briefing = briefing.replace("**Briefing du", `**${company} — briefing du`);
  $("#briefing").innerHTML = mdToHtml(briefing);

  // Plan d'actions
  const list = $("#action-list");
  list.innerHTML = "";
  for (const a of plan) {
    const agent = state.byId[a.agentId];
    const status = actionStatus(state.sector || "tous", a.id);
    const item = el("div", { class: "action-item " + status },
      el("span", { class: "act-icon" }, agent?.icon || "🤖"),
      el("div", { class: "act-info" },
        el("div", { class: "act-title" }, a.title),
        el("div", { class: "act-agent" }, `Confié à ${agent?.name || "l'assistant"}`)),
      status === "todo"
        ? el("button", { class: "act-btn", onclick: () => delegateAction(a) }, "Déléguer à l'IA")
        : el("span", { class: "act-agent" }, status === "delegated" ? "✔ En cours" : "✔ Fait"),
      status !== "done"
        ? el("button", { class: "act-done", title: "Marquer comme fait", onclick: () => { setActionStatus(state.sector || "tous", a.id, "done"); renderCockpit(); } }, "Fait")
        : el("button", { class: "act-done", title: "Remettre à faire", onclick: () => { setActionStatus(state.sector || "tous", a.id, "todo"); renderCockpit(); } }, "↺"),
    );
    list.append(item);
  }
  if (!plan.length) list.append(el("div", { class: "doc-empty" }, "Aucune action proposée pour ce domaine."));
}

// Délègue une action : bascule sur le chat et envoie la demande à l'assistant.
function delegateAction(a) {
  setActionStatus(state.sector || "tous", a.id, "delegated");
  setView("chat");
  const input = $("#composer-input");
  input.value = a.prompt;
  $("#composer").requestSubmit();
}

// ---------- Neural Automation Engine (les agents travaillent seuls) ----------
function startEngine() {
  state.engine?.stop();
  state.engine = new AutomationEngine({
    sectorId: state.sector || "tous",
    allowed: state.allowed,
    byId: state.byId,
    runAgent: async (agent, message) =>
      generate({ agent, message, passages: state.rag.search(message, 3) }),
    onRun: (wf, results, reason) => {
      // Notification dans le chat : le travail s'est fait tout seul.
      const head = results[0];
      addMessage("bot",
        `⚡ **Automation « ${wf.icon} ${wf.name} » exécutée** _(${reason})_\n\n` +
        (head ? head.answer.split("\n").slice(0, 6).join("\n") : "") +
        (results.length > 1 ? `\n\n_(+ ${results.length - 1} étape(s) — détail dans le journal ⚡)_` : ""));
      if (!$("#autom")?.hidden) renderAutomations();
      if (!$("#cockpit")?.hidden) renderCockpit();
    },
  });
  state.engine.start(30_000); // vérifie les déclencheurs toutes les 30 s + rattrapage
}

function fmtLastRun(ts) {
  if (!ts) return "jamais exécutée";
  const d = new Date(ts);
  return "dernière exécution : " + d.toLocaleDateString("fr-CH") + " " +
    d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}

function renderAutomations() {
  const list = $("#workflow-list");
  if (!list || !state.engine) return;
  list.innerHTML = "";
  for (const wf of state.engine.workflows) {
    const chain = el("div", { class: "wf-chain" });
    wf.steps.forEach((s, i) => {
      const agent = state.byId[s.agentId];
      if (i > 0) chain.append(el("span", { class: "wf-arrow" }, "→"));
      chain.append(el("span", { class: "wf-step", title: s.task }, `${agent?.icon || "🤖"} ${agent?.name || s.agentId}`));
    });
    const toggle = el("label", { class: "switch", title: wf.enabled ? "Désactiver" : "Activer" });
    const cb = el("input", { type: "checkbox" });
    cb.checked = wf.enabled;
    cb.addEventListener("change", () => { state.engine.toggle(wf.id, cb.checked); renderAutomations(); });
    toggle.append(cb, el("span", { class: "slider" }));

    const card = el("div", { class: "wf-card" + (wf.enabled ? "" : " off") },
      el("div", { class: "wf-top" },
        el("span", { class: "wf-icon" }, wf.icon),
        el("span", { class: "wf-name" }, wf.name),
        el("span", { class: "wf-trigger" }, `⏱ ${TRIGGERS[wf.trigger]?.label || wf.trigger}`),
        toggle,
      ),
      chain,
      el("div", { class: "wf-bottom" },
        el("span", { class: "wf-last" }, fmtLastRun(wf.lastRun)),
        wf.custom ? el("button", { class: "wf-del", title: "Supprimer", onclick: () => { state.engine.removeCustom(wf.id); renderAutomations(); } }, "🗑") : "",
        el("button", { class: "wf-run", onclick: async (e) => {
          e.target.disabled = true; e.target.textContent = "Exécution…";
          await state.engine.run(wf, "manuel");
          renderAutomations();
        } }, "▶ Exécuter maintenant"),
      ),
    );
    list.append(card);
  }
  if (!state.engine.workflows.length) {
    list.append(el("div", { class: "journal-empty" }, "Aucune automation pour ce domaine — créez-en une !"));
  }
  renderJournal();
}

function renderJournal() {
  const box = $("#journal");
  if (!box) return;
  box.innerHTML = "";
  const entries = loadJournal().filter((e) => e.sectorId === (state.sector || "tous")).slice(0, 15);
  if (!entries.length) {
    box.append(el("div", { class: "journal-empty" }, "Rien pour l'instant — vos agents consigneront ici chaque tâche accomplie."));
    return;
  }
  for (const e of entries) {
    const d = new Date(e.ts);
    const det = el("details", {},
      el("summary", {},
        `${e.icon} ${e.name}`,
        el("span", { class: "wf-trigger" }, e.reason),
        el("span", { class: "j-time" }, d.toLocaleDateString("fr-CH") + " " + d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" })),
      ),
    );
    for (const r of e.results) {
      det.append(el("div", { class: "j-step" },
        el("span", { class: "j-agent" }, `${r.icon} ${r.agentName}`),
        el("div", { html: mdToHtml(r.answer) }),
      ));
    }
    box.append(det);
  }
}

function wireAutomations() {
  const form = $("#autom-form");
  $("#new-autom-btn").addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) {
      const trig = $("#af-trigger");
      trig.innerHTML = "";
      for (const [k, t] of Object.entries(TRIGGERS)) {
        trig.append(el("option", { value: k }, t.label));
      }
      const ag = $("#af-agent");
      ag.innerHTML = "";
      const pool = state.allowed ? state.agents.filter((a) => state.allowed.has(a.id)) : state.agents;
      for (const a of pool.filter((a) => a.id !== "cerveau-central")) {
        ag.append(el("option", { value: a.id }, `${a.icon} ${a.name}`));
      }
    }
  });
  $("#af-cancel").addEventListener("click", () => { form.hidden = true; });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#af-name").value.trim();
    const task = $("#af-task").value.trim();
    if (!name || !task) return;
    state.engine.addCustom({ name, trigger: $("#af-trigger").value, agentId: $("#af-agent").value, task });
    $("#af-name").value = ""; $("#af-task").value = "";
    form.hidden = true;
    renderAutomations();
  });
}

// ---------- Domaines d'activité (packs métiers) ----------
function currentSector() {
  return state.sectors.find((s) => s.id === state.sector) || null;
}

function wireSectorPicker() {
  const sel = $("#sector-select");
  if (!sel || !state.sectors.length) { $(".sector")?.remove(); return; }
  sel.innerHTML = "";
  for (const s of state.sectors) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.icon} ${s.label} (${s.count})`;
    sel.append(opt);
  }
  sel.addEventListener("change", () => applySector(sel.value));
}

function applySector(id, { silent = false } = {}) {
  const s = state.sectors.find((x) => x.id === id) || state.sectors[0];
  if (!s) { // pas de sectors.json : app non filtrée
    state.sector = null; state.allowed = null;
    state.router = new AgentRouter(state.agents);
    return;
  }
  state.sector = s.id;
  localStorage.setItem(LS_SECTOR, s.id);
  state.allowed = s.id === "tous" ? null : new Set(s.agents);

  // Le routeur de l'orchestrateur ne considère que les agents du pack.
  const pool = state.allowed ? state.agents.filter((a) => state.allowed.has(a.id)) : state.agents;
  state.router = new AgentRouter(pool);

  const sel = $("#sector-select");
  if (sel && sel.value !== s.id) sel.value = s.id;
  const desc = $("#sector-desc");
  if (desc) desc.textContent = s.description;
  $("#agent-count-badge").textContent = `${s.count} agents`;

  // Si l'agent actif n'est plus dans le pack, on repasse sur l'orchestrateur.
  if (state.active && state.allowed && !state.allowed.has(state.active.id)) {
    selectAgent("cerveau-central");
  } else {
    renderAgentList($("#agent-search")?.value || "");
  }
  if (!silent && state.active?.id === "cerveau-central") {
    addMessage("bot",
      `🧩 Pack métier activé : **${s.icon} ${s.label}** — ${s.count} agents sélectionnés pour ce domaine. ` +
      `Je ne mobilise plus que les spécialistes utiles à votre activité.`);
  }
  const cockpit = $("#cockpit");
  if (cockpit && !cockpit.hidden) renderCockpit();
  // Reconstruit le moteur d'automation sur le nouveau pack métier.
  if (state.engine) {
    startEngine();
    if (!$("#autom")?.hidden) renderAutomations();
  }
}

function agentVisible(a) {
  return !state.allowed || state.allowed.has(a.id);
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

  // Bandeau : le client parle à UN assistant, l'équipe travaille en coulisses.
  const brain = state.byId["cerveau-central"];
  if (brain) {
    list.append(el("div", { class: "orchestrator-card static" },
      el("span", { class: "orch-icon" }, brain.icon),
      el("div", { class: "orch-text" },
        el("strong", {}, "Votre assistant unique"),
        el("span", {}, "Il mobilise l'équipe ci-dessous pour vous"),
      ),
    ));
  }

  for (const [key, cat] of Object.entries(state.categories)) {
    const agents = state.agents.filter(
      (a) => a.category === key && a.id !== "cerveau-central" && agentVisible(a) &&
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
        class: "agent-item", type: "button",
        title: `${a.description} — Cliquez pour une présentation, posez simplement votre question dans le chat.`,
      },
        el("span", { class: "agent-dot", style: `background:${a.color}` }),
        el("span", { class: "a-name" }, a.name),
        el("span", { class: "a-num" }, `#${a.number}`),
      );
      // Le client ne change pas d'interlocuteur : un clic présente le spécialiste.
      item.addEventListener("click", () => introSpecialist(a));
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
  if (a.id === "cerveau-central") {
    $("#active-name").textContent = "Assistant NeuralStark";
    $("#active-desc").textContent = "Un seul interlocuteur — il mobilise automatiquement vos agents spécialisés.";
  } else {
    $("#active-name").textContent = a.name;
    $("#active-desc").textContent = a.description;
  }
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
    const s = currentSector();
    const sectorLine = s && s.id !== "tous"
      ? `Votre espace est configuré pour **${s.icon} ${s.label}** : une équipe de **${s.count} agents spécialisés** travaille pour vous en coulisses.`
      : `Une équipe de **130 agents spécialisés** travaille pour vous en coulisses.`;
    addMessage("bot",
      `Bonjour 👋 Je suis votre **assistant NeuralStark**.\n\n` +
      `${sectorLine}\n\n` +
      `**Vous n'avez rien à chercher** : décrivez simplement votre besoin, ` +
      `je mobilise automatiquement les bons spécialistes et je vous réponds à partir de vos documents.\n\n` +
      `📊 Le **Cockpit** vous donne l'état de votre activité en un coup d'œil. ` +
      `⚡ Dans **Automations**, mes agents travaillent **tout seuls** : briefing quotidien, veille ` +
      `documentaire, relances hebdomadaires… Chaque tâche accomplie est consignée au journal.\n\n` +
      `_Exemples : « ce devis est-il rentable ? », « rédige un post pour Instagram », ` +
      `« quel est le tarif façade ? », « prépare l'arrivée d'un nouvel employé »._`, [], a);
    return;
  }
  addMessage("bot", `Bonjour 👋 Je suis **${a.name}**. ${a.description}\n\nPosez-moi votre question — je m'appuierai sur les documents de votre base de connaissances.`, [], a);
}

// Présente un spécialiste dans le chat sans changer d'interlocuteur.
function introSpecialist(a) {
  addMessage("bot",
    `${a.icon} **${a.name}** fait partie de votre équipe (${a.categoryLabel}).\n\n` +
    `${a.description}\n\n` +
    `_Inutile de le sélectionner : posez simplement votre question, ` +
    `je le mobiliserai automatiquement s'il est le plus compétent._`);
  setSidebar(false);
  $("#composer-input")?.focus();
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
    // Déclenche les automations « nouveau document » (veille documentaire…).
    state.engine?.notifyDocAdded(name);
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
