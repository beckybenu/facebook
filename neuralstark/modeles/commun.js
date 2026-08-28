// NeuralStark — moteur commun aux trois modèles de vitrine.
//
// Chaque modèle fournit son propre HTML et son propre CSS ; ce fichier apporte
// tout ce qui est identique d'un modèle à l'autre :
//   · démarrage de la scène 3D et enchaînement des plans au défilement,
//   · catalogue réel des 130 agents lu dans data/agents.json,
//   · démonstration du routeur (le vrai module lib/router.js),
//   · sélecteur de palette, mémorisé d'une visite à l'autre.
//
// Les couleurs de la scène ne sont pas écrites ici : elles viennent des
// variables CSS --brain-cold et --brain-hot, donc la feuille de style de chaque
// modèle reste la seule source de vérité pour la palette.
// (chemin relatif à ce fichier ; le fetch plus bas est relatif à la page)
import { AgentRouter } from "../lib/router.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

export function initVitrine(config = {}) {
  const opts = {
    modele: "vitrine",
    defaultPalette: null,
    dataUrl: "../../data/agents.json",
    brain: {},
    tooltipScenes: ["hero", "clusters"],
    ...config,
  };

  /* ————— palette ————— */

  const storeKey = `neuralstark:palette:${opts.modele}`;
  const swatches = $$("button[data-palette]");
  let brain = null;

  function applyPalette(key, remember) {
    if (!key) return;
    document.documentElement.dataset.palette = key;
    swatches.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.palette === key)));
    if (brain) brain.setColors(cssVar("--brain-cold"), cssVar("--brain-hot"));
    if (remember) {
      try { localStorage.setItem(storeKey, key); } catch (e) { /* navigation privée */ }
    }
  }

  let stored = null;
  try { stored = localStorage.getItem(storeKey); } catch (e) { /* ignoré */ }
  const known = swatches.map((b) => b.dataset.palette);
  const startPalette = (stored && known.includes(stored) && stored) || opts.defaultPalette || known[0];
  applyPalette(startPalette, false);
  swatches.forEach((b) => b.addEventListener("click", () => applyPalette(b.dataset.palette, true)));

  /* ————— scène 3D ————— */

  const canvas = $("#brain-canvas");
  if (canvas && window.NeuralBrain && supportsWebGL()) {
    try {
      brain = new window.NeuralBrain(canvas, {
        count: 130,
        reducedMotion: reduced,
        cold: cssVar("--brain-cold"),
        hot: cssVar("--brain-hot"),
        ...opts.brain,
      });
      brain.start();
    } catch (err) {
      brain = null;
    }
  }
  if (!brain) document.body.classList.add("no-3d");

  if (brain) {
    const onResize = () => brain.resize();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) brain.stop(); else brain.start();
    });
    if (!reduced && finePointer) {
      window.addEventListener("pointermove", (e) => {
        brain.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      }, { passive: true });
    }
  }

  /* ————— plans liés aux sections ————— */

  const navLinks = $$(".nav-links a, .nav-liens a, .rail a");
  let currentScene = "hero";

  function markNav(id) {
    navLinks.forEach((a) => a.classList.toggle("current", a.getAttribute("href") === "#" + id));
  }

  const sections = $$("[data-scene]");
  if (sections.length) {
    const sceneObserver = new IntersectionObserver((entries) => {
      let best = null;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      }
      if (!best) return;
      const scene = best.target.dataset.scene;
      markNav(best.target.id);
      if (scene === currentScene) return;
      currentScene = scene;
      if (brain) brain.setState(scene);
    }, { threshold: [0.25, 0.5, 0.75], rootMargin: "-15% 0px -25% 0px" });
    sections.forEach((s) => sceneObserver.observe(s));
  }

  /* ————— barre de navigation ————— */

  const nav = $(".nav");
  if (nav) {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none;";
    document.body.appendChild(probe);
    new IntersectionObserver(([e]) => {
      nav.classList.toggle("stuck", !e.isIntersecting);
    }, { threshold: 0 }).observe(probe);
  }

  /* ————— apparition des blocs ————— */

  if (opts.revealSelectors) {
    opts.revealSelectors.forEach((sel) => $$(sel).forEach((el) => el.classList.add("reveal")));
  }
  const revealTargets = $$(".reveal");
  if (revealTargets.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        revealObserver.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* ————— catalogue réel des agents ————— */

  const catGrid = $("#cat-grid");
  const catDetail = $("#cat-detail");
  const routerForm = $("#router-form");
  const routerInput = $("#router-input");
  const routerOut = $("#router-out");
  const tip = $("#node-tip");

  let agents = [];
  let indexById = new Map();
  let router = null;
  let openCat = null;

  const summarize = (list) => list.slice(0, 3).map((a) => a.shortName || a.name).join(", ");

  function buildCatalogue(data) {
    agents = data.agents;
    const categories = data.categories;
    const catKeys = Object.keys(categories);
    indexById = new Map(agents.map((a, i) => [a.id, i]));
    if (brain) brain.setAgents(agents, catKeys);
    if (!catGrid) return;

    catGrid.innerHTML = "";
    catKeys.forEach((key, catIndex) => {
      const members = agents.filter((a) => a.category === key);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "cat-detail");
      btn.innerHTML =
        '<span class="cat-count"></span><span class="cat-name"></span><span class="cat-hint"></span>';
      btn.querySelector(".cat-count").textContent = String(members.length).padStart(2, "0") + " agents";
      btn.querySelector(".cat-name").textContent = categories[key].label;
      btn.querySelector(".cat-hint").textContent = summarize(members);

      const light = () => { if (brain && !openCat) brain.highlightCategory(catIndex); };
      const unlight = () => { if (brain && !openCat) brain.clearHighlight(); };
      btn.addEventListener("pointerenter", light);
      btn.addEventListener("focus", light);
      btn.addEventListener("pointerleave", unlight);
      btn.addEventListener("click", () => toggleCategory(key, catIndex, categories[key].label, members, btn));
      catGrid.appendChild(btn);
    });
  }

  function toggleCategory(key, catIndex, label, members, btn) {
    const isOpen = openCat === key;
    $$(".cat", catGrid).forEach((b) => b.setAttribute("aria-expanded", "false"));
    if (!catDetail) return;

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

  /* ————— démonstration du routeur ————— */

  function renderRoute(query) {
    if (!router || !routerOut) return;
    const hits = router.route(query, 3);

    if (!hits.length) {
      routerOut.innerHTML =
        '<p class="router-hint">Aucun agent ne ressort pour cette formulation. Ajoutez un verbe et un objet, par exemple « calculer la marge d\'un chantier ».</p>';
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
      const desc = document.createElement("span");
      desc.className = "route-cat";
      desc.textContent = hit.agent.description;
      mid.append(name, desc);
      const score = document.createElement("span");
      score.className = "route-score";
      score.textContent = Math.round(hit.score * 100) + "%";
      li.append(num, mid, score);
      ol.appendChild(li);
    });

    const sum = document.createElement("p");
    sum.className = "router-sum";
    sum.textContent =
      "Le Cerveau Central mobilise ces agents, puis assemble une réponse unique appuyée sur vos documents.";

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

  /* ————— infobulle sur un nœud ————— */

  if (brain && tip && finePointer) {
    let raf = 0;
    window.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const overContent = e.target.closest(
          "a, button, input, label, summary, table, li, p, h1, h2, h3, .router-demo, .cat-detail"
        );
        if (overContent || !agents.length || !opts.tooltipScenes.includes(currentScene)) {
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

  /* ————— données ————— */

  (async function load() {
    try {
      const data = await fetch(opts.dataUrl).then((r) => r.json());
      buildCatalogue(data);
      router = new AgentRouter(agents);
    } catch (err) {
      if (catGrid) {
        catGrid.innerHTML =
          '<p class="loading">Le catalogue ne s\'est pas chargé. Ouvrez la démo pour voir les 130 agents.</p>';
      }
      if (routerOut) {
        routerOut.innerHTML =
          '<p class="router-hint">Le moteur de routage a besoin du catalogue des agents. Rechargez la page.</p>';
      }
    }
  })();

  return { get brain() { return brain; }, applyPalette };
}
