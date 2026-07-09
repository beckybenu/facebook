// Stockage JSON persistant sur disque — simple, sans dépendance externe.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.NEURALSTARK_DATA_DIR || path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_STATE = {
  company: {
    name: "Mon Entreprise",
    description: "",
    tone: "professionnel et chaleureux",
    sector: "",
    website: "",
  },
  tasks: [],       // { id, title, notes, status: 'a_faire'|'en_cours'|'terminee', priority, due, assignee, createdAt }
  events: [],      // { id, title, date, time, durationMin, attendees, location, notes, createdAt }
  contacts: [],    // { id, name, email, phone, company, stage, tags, notes, interactions: [{date, summary}], createdAt }
  emails: [],      // { id, to, subject, body, status: 'brouillon'|'pret', agent, createdAt }
  posts: [],       // { id, network, content, hashtags, scheduledFor, status: 'brouillon'|'planifie', createdAt }
  documents: [],   // { id, title, content, tags, createdAt }  → base de connaissances (RAG)
  activity: [],    // journal d'activité des agents
};

let state = null;

function load() {
  if (state) return state;
  try {
    state = { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
  } catch {
    state = structuredClone(DEFAULT_STATE);
  }
  return state;
}

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

export function getState() {
  return load();
}

export function mutate(fn) {
  const s = load();
  const result = fn(s);
  save();
  return result;
}

export function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString("hex")}`;
}

export function logActivity(agent, action, detail) {
  mutate((s) => {
    s.activity.unshift({ agent, action, detail, at: new Date().toISOString() });
    s.activity = s.activity.slice(0, 200);
  });
}
