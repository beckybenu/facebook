// NeuralStark — logique frontend (vanilla JS, aucune dépendance).
const state = {
  agents: [],
  categories: {},
  byId: {},
  active: null,
  history: [],       // { role, content }
  sending: false,
};

const $ = (sel) => document.querySelector(sel);
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

// ---------- Chargement ----------
async function boot() {
  const [agentsRes, health] = await Promise.all([
    fetch("/api/agents").then((r) => r.json()),
    fetch("/api/health").then((r) => r.json()).catch(() => null),
  ]);
  state.agents = agentsRes.agents;
  state.categories = agentsRes.categories;
  state.byId = Object.fromEntries(state.agents.map((a) => [a.id, a]));
  $("#agent-count-badge").textContent = `${agentsRes.count} agents`;

  if (health?.provider) {
    const b = $("#provider-badge");
    if (health.provider.mode === "live") {
      b.textContent = `LLM: ${health.provider.model}`;
      b.className = "badge badge-live";
    } else {
      b.textContent = "Mode démo";
    }
  }

  renderAgentList();
  await refreshDocs();
  wireComposer();
  wireDocForm();
  $("#agent-search").addEventListener("input", (e) => renderAgentList(e.target.value));
  $("#clear-chat").addEventListener("click", clearChat);
}

// ---------- Catalogue d'agents ----------
function renderAgentList(filter = "") {
  const list = $("#agent-list");
  list.innerHTML = "";
  const q = filter.trim().toLowerCase();

  // Carte « orchestrateur » épinglée en haut : le Neural Cerveau Central.
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
        type: "button", "data-id": a.id, title: a.description,
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
  if (!list.children.length) {
    list.append(el("div", { class: "doc-empty" }, "Aucun agent ne correspond."));
  }
}

function selectAgent(id) {
  const a = state.byId[id];
  if (!a) return;
  state.active = a;
  state.history = [];
  document.documentElement.style.setProperty("--c", a.color);

  const icon = $("#active-icon");
  icon.textContent = a.icon;
  icon.style.setProperty("--c", a.color);
  $("#active-name").textContent = a.name;
  $("#active-desc").textContent = a.description;

  $("#messages").innerHTML = "";
  $("#composer-input").disabled = false;
  $("#send-btn").disabled = false;
  $("#composer-input").focus();

  pushBotIntro(a);
  renderAgentList($("#agent-search").value);
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

// ---------- Messages ----------
function mdToHtml(md) {
  // Mini-rendu Markdown sûr (échappe le HTML, gère gras / code / listes / paragraphes).
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
    const r = el("div", { class: "routed" },
      el("span", { class: "routed-label" }, "🧠 Agents mobilisés :"));
    routed.forEach((ag, i) => {
      r.append(el("span", {
        class: "routed-chip" + (i === 0 ? " lead" : ""),
        style: `--c:${ag.color}`,
        title: `pertinence ${ag.score}`,
      }, `${ag.icon} ${ag.name}`));
    });
    bubble.append(r);
  }
  if (sources?.length) {
    const s = el("div", { class: "sources" });
    for (const src of sources) s.append(el("span", { class: "source-chip" }, `📄 ${src.source}`));
    bubble.append(s);
  }
  const msg = el("div", { class: `msg ${role}` },
    el("div", { class: "msg-avatar" }, avatar),
    bubble,
  );
  const box = $("#messages");
  box.append(msg);
  box.scrollTop = box.scrollHeight;
  return msg;
}

function addTyping() {
  $("#empty-state")?.remove();
  const msg = el("div", { class: "msg bot", id: "typing" },
    el("div", { class: "msg-avatar" }, state.active?.icon || "🧠"),
    el("div", { class: "msg-bubble typing", html: "<span></span><span></span><span></span>" }),
  );
  const box = $("#messages");
  box.append(msg);
  box.scrollTop = box.scrollHeight;
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
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").requestSubmit(); }
  });
  $("#composer").addEventListener("submit", onSend);
}

async function onSend(e) {
  e.preventDefault();
  const input = $("#composer-input");
  const message = input.value.trim();
  if (!message || !state.active || state.sending) return;

  state.sending = true;
  $("#send-btn").disabled = true;
  input.value = ""; input.style.height = "auto";

  addMessage("user", message);
  state.history.push({ role: "user", content: message });
  addTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: state.active.id, message, history: state.history }),
    });
    const data = await res.json();
    $("#typing")?.remove();
    if (data.error) {
      addMessage("bot", `⚠️ ${data.error}`);
    } else {
      addMessage("bot", data.answer, data.sources || [], state.active, data.routed || []);
      state.history.push({ role: "assistant", content: data.answer });
    }
  } catch (err) {
    $("#typing")?.remove();
    addMessage("bot", `⚠️ Erreur réseau : ${err.message}`);
  } finally {
    state.sending = false;
    $("#send-btn").disabled = false;
    input.focus();
  }
}

// ---------- Base de connaissances (RAG) ----------
function wireDocForm() {
  $("#doc-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#doc-name").value.trim() || "document.txt";
    const content = $("#doc-content").value.trim();
    if (content.length < 3) return;
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });
    $("#doc-name").value = ""; $("#doc-content").value = "";
    await refreshDocs();
  });

  $("#doc-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("#doc-content").value = reader.result;
      if (!$("#doc-name").value.trim()) $("#doc-name").value = file.name;
    };
    reader.readAsText(file);
  });
}

async function refreshDocs() {
  const data = await fetch("/api/documents").then((r) => r.json());
  const list = $("#doc-list");
  list.innerHTML = "";
  $("#rag-stats").textContent = `${data.stats.documents} doc · ${data.stats.chunks} extraits`;
  if (!data.documents.length) {
    list.append(el("div", { class: "doc-empty" }, "Aucun document.\nAjoutez-en pour activer le RAG."));
    return;
  }
  for (const d of data.documents) {
    const card = el("div", { class: "doc-card" },
      el("span", { class: "doc-icon" }, "📄"),
      el("div", { class: "doc-info" },
        el("div", { class: "doc-title", title: d.name }, d.name),
        el("div", { class: "doc-sub" }, `${d.chunks} extrait${d.chunks > 1 ? "s" : ""}`),
      ),
      el("button", { class: "doc-del", title: "Supprimer", onclick: () => removeDoc(d.id) }, "×"),
    );
    list.append(card);
  }
}

async function removeDoc(id) {
  await fetch(`/api/documents/${id}`, { method: "DELETE" });
  await refreshDocs();
}

boot();
