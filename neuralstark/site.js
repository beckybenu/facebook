// NeuralStark — site vitrine : pilotage de la scène 3D, catalogue réel des agents,
// et démonstration en direct du routeur (le même module que celui du produit).
import { AgentRouter } from "./lib/router.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ————————————————— scène 3D ————————————————— */

let brain = null;
const stage = $("#stage");
const canvas = $("#brain-canvas");

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

function bootBrain() {
  if (!window.NeuralBrain || !supportsWebGL()) {
    document.body.classList.add("no-3d");
    return null;
  }
  try {
    const b = new window.NeuralBrain(canvas, { count: 130, reducedMotion: reduced });
    b.start();
    return b;
  } catch (err) {
    document.body.classList.add("no-3d");
    return null;
  }
}

brain = bootBrain();

if (brain) {
  const onResize = () => brain.resize();
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) brain.stop();
    else brain.start();
  });

  if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      brain.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }
}

/* ————————————————— états de scène liés aux sections ————————————————— */

const sections = $$("section[data-scene]");
let currentScene = "hero";

const sceneObserver = new IntersectionObserver((entries) => {
  let best = null;
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
  }
  if (!best) return;
  const scene = best.target.dataset.scene;
  if (scene === currentScene) return;
  currentScene = scene;
  if (brain) brain.setState(scene);
  markNav(best.target.id);
}, { threshold: [0.25, 0.5, 0.75], rootMargin: "-15% 0px -25% 0px" });

sections.forEach((s) => sceneObserver.observe(s));

/* ————————————————— navigation ————————————————— */

const nav = $("#nav");
const navLinks = $$(".nav-links a");

function markNav(id) {
  navLinks.forEach((a) => a.classList.toggle("current", a.getAttribute("href") === "#" + id));
}

const stickyProbe = document.createElement("div");
stickyProbe.style.cssText = "position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none;";
document.body.appendChild(stickyProbe);
new IntersectionObserver(([e]) => {
  nav.classList.toggle("stuck", !e.isIntersecting);
}, { threshold: 0 }).observe(stickyProbe);

/* ————————————————— apparition des blocs ————————————————— */

const revealSelectors = [
  ".split-main > *", ".scatter-list li", ".flow li", ".router-demo",
  ".band-title", ".band-head > *", ".facts li", ".case", ".compare",
  ".phase", ".price-note", ".faq details", ".final > *", ".cat-grid"
];
const revealTargets = revealSelectors.flatMap((s) => $$(s));
revealTargets.forEach((el) => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    revealObserver.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

revealTargets.forEach((el) => revealObserver.observe(el));

/* ————————————————— catalogue réel des agents ————————————————— */

const catGrid = $("#cat-grid");
const catDetail = $("#cat-detail");
const routerForm = $("#router-form");
const routerInput = $("#router-input");
const routerOut = $("#router-out");

let agents = [];
let catKeys = [];
let indexById = new Map();
let router = null;

function summarize(list) {
  return list.slice(0, 3).map((a) => a.shortName || a.name).join(", ");
}

function buildCatalogue(data) {
  agents = data.agents;
  const categories = data.categories;
  catKeys = Object.keys(categories);
  indexById = new Map(agents.map((a, i) => [a.id, i]));

  if (brain) brain.setAgents(agents, catKeys);

  catGrid.innerHTML = "";
  catKeys.forEach((key, catIndex) => {
    const members = agents.filter((a) => a.category === key);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "cat-detail");
    btn.dataset.cat = key;
    btn.dataset.index = String(catIndex);
    btn.innerHTML =
      '<span class="cat-count">' + String(members.length).padStart(2, "0") + " agents</span>" +
      '<span class="cat-name"></span>' +
      '<span class="cat-hint"></span>';
    btn.querySelector(".cat-name").textContent = categories[key].label;
    btn.querySelector(".cat-hint").textContent = summarize(members);

    btn.addEventListener("pointerenter", () => {
      if (brain && !openCat) brain.highlightCategory(catIndex);
    });
    btn.addEventListener("pointerleave", () => {
      if (brain && !openCat) brain.clearHighlight();
    });
    btn.addEventListener("focus", () => { if (brain && !openCat) brain.highlightCategory(catIndex); });
    btn.addEventListener("click", () => toggleCategory(key, catIndex, categories[key].label, members, btn));

    catGrid.appendChild(btn);
  });
}

let openCat = null;

function toggleCategory(key, catIndex, label, members, btn) {
  const isOpen = openCat === key;
  $$(".cat", catGrid).forEach((b) => b.setAttribute("aria-expanded", "false"));

  if (isOpen) {
    openCat = null;
    catDetail.hidden = true;
    if (brain) brain.clearHighlight();
    return;
  }

  openCat = key;
  btn.setAttribute("aria-expanded", "true");
  catDetail.hidden = false;
  catDetail.innerHTML = "";

  const h = document.createElement("h3");
  h.textContent = label;
  const ul = document.createElement("ul");
  members.forEach((a) => {
    const li = document.createElement("li");
    const num = document.createElement("span");
    num.textContent = String(a.number).padStart(3, "0");
    const name = document.createElement("span");
    name.textContent = a.shortName || a.name;
    name.title = a.description;
    li.append(num, name);
    ul.appendChild(li);
  });
  catDetail.append(h, ul);

  if (brain) brain.highlightCategory(catIndex);
}

/* ————————————————— démonstration du routeur ————————————————— */

function renderRoute(query) {
  if (!router) return;
  const hits = router.route(query, 3);

  if (!hits.length) {
    routerOut.innerHTML = '<p class="router-hint">Aucun agent ne ressort pour cette formulation. Ajoutez un verbe et un objet, par exemple « calculer la marge d\'un chantier ».</p>';
    if (brain) brain.clearHighlight();
    return;
  }

  const ol = document.createElement("ol");
  hits.forEach((hit, i) => {
    const li = document.createElement("li");
    li.className = "route-row";
    const num = document.createElement("span");
    num.className = "route-num";
    num.textContent = String(i + 1).padStart(2, "0");
    const mid = document.createElement("span");
    const name = document.createElement("b");
    name.className = "route-name";
    name.textContent = hit.agent.name;
    const cat = document.createElement("span");
    cat.className = "route-cat";
    cat.textContent = hit.agent.description;
    mid.append(name, cat);
    const score = document.createElement("span");
    score.className = "route-score";
    score.textContent = Math.round(hit.score * 100) + "%";
    li.append(num, mid, score);
    ol.appendChild(li);
  });

  const sum = document.createElement("p");
  sum.className = "router-sum";
  sum.textContent = "Le Cerveau Central mobilise ces agents, puis assemble une réponse unique appuyée sur vos documents.";

  routerOut.innerHTML = "";
  routerOut.append(ol, sum);

  if (brain) {
    brain.setState("route");
    currentScene = "route";
    brain.highlight(hits.map((h) => indexById.get(h.agent.id)).filter((i) => i !== undefined), 1);
  }
}

if (routerForm) {
  routerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = routerInput.value.trim();
    if (q) renderRoute(q);
  });
}

$$("#router-samples .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    routerInput.value = chip.textContent;
    renderRoute(chip.textContent);
  });
});

/* ————————————————— infobulle sur un nœud ————————————————— */

const tip = $("#node-tip");
let tipRaf = 0;

if (brain && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  window.addEventListener("pointermove", (e) => {
    if (tipRaf) return;
    tipRaf = requestAnimationFrame(() => {
      tipRaf = 0;
      const overContent = e.target.closest("a, button, input, label, summary, table, li, p, h1, h2, h3, .router-demo, .cat-detail");
      if (overContent || !agents.length || (currentScene !== "hero" && currentScene !== "clusters")) {
        tip.hidden = true;
        return;
      }
      const idx = brain.hitTest(e.clientX, e.clientY);
      const agent = idx >= 0 ? agents[idx] : null;
      if (!agent) { tip.hidden = true; return; }
      tip.innerHTML = "";
      const n = document.createElement("b");
      n.textContent = String(agent.number).padStart(3, "0") + " ";
      tip.append(n, document.createTextNode(agent.name));
      tip.style.left = e.clientX + "px";
      tip.style.top = e.clientY + "px";
      tip.hidden = false;
    });
  }, { passive: true });
}

/* ————————————————— chargement des données ————————————————— */

(async function load() {
  try {
    const data = await fetch("data/agents.json").then((r) => r.json());
    buildCatalogue(data);
    router = new AgentRouter(agents);
  } catch (err) {
    catGrid.innerHTML = '<p class="loading">Le catalogue ne s\'est pas chargé. Ouvrez la démo pour voir les 130 agents.</p>';
    if (routerOut) {
      routerOut.innerHTML = '<p class="router-hint">Le moteur de routage a besoin du catalogue des agents. Rechargez la page ou ouvrez la démo.</p>';
    }
  }
})();
