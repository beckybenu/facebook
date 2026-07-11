// Neural Automation Engine — le moteur qui fait travailler les agents en autonomie.
// Des workflows (déclencheur → chaîne d'agents) s'exécutent automatiquement, comme n8n :
// planifiés (quotidien/hebdo/horaire), déclenchés par événement (nouveau document),
// ou lancés manuellement. Journal d'exécution persisté. 100 % côté client :
// le moteur tourne tant que l'app est ouverte et rattrape les exécutions manquées
// à l'ouverture (le serveur Node optionnel pourra l'exécuter 24h/24).

const LS_WF = "neuralstark:workflows:v1";
const LS_JOURNAL = "neuralstark:journal:v1";
const HOUR = 3600 * 1000;

export const TRIGGERS = {
  hourly:   { label: "Toutes les heures", ms: HOUR },
  daily:    { label: "Chaque jour",       ms: 24 * HOUR },
  weekly:   { label: "Chaque semaine",    ms: 7 * 24 * HOUR },
  docAdded: { label: "Nouveau document",  ms: null },
};

// --- Workflows par défaut ---
// Chaque étape = { agentId, task }. La sortie d'une étape nourrit la suivante.
// Un workflow n'est provisionné que si TOUS ses agents existent dans le pack métier.
const DEFAULT_WORKFLOWS = [
  {
    id: "briefing-quotidien", icon: "🌅", name: "Briefing quotidien",
    trigger: "daily",
    steps: [
      { agentId: "suiveur-de-kpi", task: "Analyse les indicateurs et montants présents dans mes documents et fais le point du jour." },
      { agentId: "gardien-de-tresorerie", task: "À partir de ce point du jour, signale tout risque ou point d'attention sur la trésorerie." },
    ],
  },
  {
    id: "veille-documentaire", icon: "📥", name: "Veille documentaire",
    trigger: "docAdded",
    steps: [
      { agentId: "moteur-de-synthese", task: "Un nouveau document vient d'être ajouté à la base de connaissances. Résume ses points clés pour le dirigeant." },
    ],
  },
  {
    id: "relance-hebdo", icon: "📨", name: "Relances commerciales",
    trigger: "weekly",
    steps: [
      { agentId: "assistant-email", task: "Rédige un email de relance courtois pour les devis restés sans réponse cette semaine, d'après mes documents." },
    ],
  },
  {
    id: "presence-sociale", icon: "📱", name: "Présence réseaux sociaux",
    trigger: "weekly",
    steps: [
      { agentId: "pilote-des-reseaux-sociaux", task: "Propose le post de la semaine pour mettre en valeur mon activité sur les réseaux sociaux." },
    ],
  },
  // Métiers
  {
    id: "chantiers-semaine", icon: "🎨", name: "Préparation des chantiers", sectors: ["peinture", "batiment", "menuiserie", "technique"],
    trigger: "weekly",
    steps: [
      { agentId: "pilote-de-planning", task: "Prépare l'organisation des chantiers de la semaine d'après mes documents." },
      { agentId: "calculateur-de-materiaux", task: "À partir de ce planning, estime les matériaux à prévoir." },
    ],
  },
  {
    id: "synthese-dossiers", icon: "⚖️", name: "Synthèse des dossiers", sectors: ["avocats"],
    trigger: "weekly",
    steps: [
      { agentId: "moteur-de-synthese", task: "Fais une synthèse des dossiers présents dans la base de connaissances." },
      { agentId: "redacteur-de-contrats", task: "À partir de cette synthèse, liste les points contractuels à vérifier." },
    ],
  },
  {
    id: "stocks-reappro", icon: "📦", name: "Surveillance des stocks", sectors: ["commerce", "restauration", "laboratoire", "industrie"],
    trigger: "daily",
    steps: [
      { agentId: "surveillant-de-stock", task: "Vérifie dans mes documents les stocks ou produits qui semblent à réapprovisionner et alerte-moi." },
    ],
  },
];

function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_WF)) || {}; } catch { return {}; }
}
function saveState(s) { localStorage.setItem(LS_WF, JSON.stringify(s)); }

export function loadJournal() {
  try { return JSON.parse(localStorage.getItem(LS_JOURNAL)) || []; } catch { return []; }
}
function pushJournal(entry) {
  const j = loadJournal();
  j.unshift(entry);
  localStorage.setItem(LS_JOURNAL, JSON.stringify(j.slice(0, 40)));
}

export class AutomationEngine {
  /**
   * @param {{ sectorId:string, allowed:Set<string>|null, byId:Record<string,object>,
   *           runAgent:(agent:object, message:string)=>Promise<{answer:string}>,
   *           onRun:(wf:object, results:{agentId:string, answer:string}[], reason:string)=>void }} opts
   */
  constructor({ sectorId, allowed, byId, runAgent, onRun }) {
    this.sectorId = sectorId || "tous";
    this.allowed = allowed;
    this.byId = byId;
    this.runAgent = runAgent;
    this.onRun = onRun;
    this.running = false;
    this._timer = null;
    this.workflows = this._provision();
  }

  _agentOk(id) { return !!this.byId[id] && (!this.allowed || this.allowed.has(id)); }

  _provision() {
    const state = loadState();
    const sectorState = state[this.sectorId] || {};
    const list = [];
    for (const def of DEFAULT_WORKFLOWS) {
      if (def.sectors && !def.sectors.includes(this.sectorId)) continue;
      if (!def.steps.every((s) => this._agentOk(s.agentId))) continue;
      const st = sectorState[def.id] || {};
      // Première installation : seuls les workflows quotidiens tournent tout de suite,
      // les hebdomadaires attendent leur échéance (évite une rafale au premier lancement).
      const seed = def.trigger === "daily" ? 0 : Date.now();
      list.push({ ...def, custom: false, enabled: st.enabled !== false, lastRun: st.lastRun ?? seed });
    }
    for (const c of sectorState.__custom || []) {
      if (!c.steps.every((s) => this._agentOk(s.agentId))) continue;
      const st = sectorState[c.id] || {};
      list.push({ ...c, custom: true, enabled: st.enabled !== false, lastRun: st.lastRun ?? Date.now() });
    }
    return list;
  }

  _persist(wf) {
    const state = loadState();
    state[this.sectorId] = state[this.sectorId] || {};
    state[this.sectorId][wf.id] = { enabled: wf.enabled, lastRun: wf.lastRun };
    saveState(state);
  }

  addCustom({ name, trigger, agentId, task }) {
    const id = "custom-" + Date.now().toString(36);
    const wf = { id, icon: "🧩", name: name || "Automation", trigger, custom: true,
      steps: [{ agentId, task }], enabled: true, lastRun: 0 };
    const state = loadState();
    state[this.sectorId] = state[this.sectorId] || {};
    state[this.sectorId].__custom = [...(state[this.sectorId].__custom || []),
      { id, icon: wf.icon, name: wf.name, trigger, steps: wf.steps }];
    saveState(state);
    this.workflows.push(wf);
    return wf;
  }

  removeCustom(id) {
    const state = loadState();
    const sec = state[this.sectorId] || {};
    sec.__custom = (sec.__custom || []).filter((c) => c.id !== id);
    delete sec[id];
    saveState(state);
    this.workflows = this.workflows.filter((w) => w.id !== id);
  }

  toggle(id, enabled) {
    const wf = this.workflows.find((w) => w.id === id);
    if (!wf) return;
    wf.enabled = enabled;
    this._persist(wf);
  }

  start(intervalMs = 30_000) {
    this.stop();
    this._timer = setInterval(() => { this.tick(); }, intervalMs);
    // Rattrapage au démarrage : exécute ce qui aurait dû tourner pendant l'absence.
    this.tick();
  }
  stop() { if (this._timer) { clearInterval(this._timer); this._timer = null; } }

  due(wf, now = Date.now()) {
    const t = TRIGGERS[wf.trigger];
    if (!t || !t.ms || !wf.enabled) return false;
    return now - (wf.lastRun || 0) >= t.ms;
  }

  async tick(now = Date.now()) {
    if (this.running) return;
    for (const wf of this.workflows) {
      if (this.due(wf, now)) await this.run(wf, "planifié");
    }
  }

  // Déclenché quand un document est ajouté à la base.
  async notifyDocAdded(docName) {
    for (const wf of this.workflows) {
      if (wf.enabled && wf.trigger === "docAdded") {
        await this.run(wf, `nouveau document : ${docName}`);
      }
    }
  }

  // Exécute la chaîne d'agents ; la sortie de chaque étape nourrit la suivante.
  async run(wf, reason = "manuel") {
    if (this.running) return null;
    this.running = true;
    try {
      const results = [];
      let context = "";
      for (const step of wf.steps) {
        const agent = this.byId[step.agentId];
        if (!agent) continue;
        const message = step.task + (context
          ? `\n\n[Résultat de l'étape précédente]\n${context.slice(0, 900)}`
          : "");
        const res = await this.runAgent(agent, message);
        results.push({ agentId: step.agentId, agentName: agent.name, icon: agent.icon, answer: res.answer });
        context = res.answer;
      }
      wf.lastRun = Date.now();
      this._persist(wf);
      pushJournal({
        ts: wf.lastRun, sectorId: this.sectorId, workflowId: wf.id,
        name: wf.name, icon: wf.icon, reason,
        results: results.map((r) => ({ agentName: r.agentName, icon: r.icon, answer: r.answer.slice(0, 1500) })),
      });
      this.onRun?.(wf, results, reason);
      return results;
    } finally {
      this.running = false;
    }
  }
}
