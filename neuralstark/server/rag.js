// Moteur RAG minimal, sans dépendance externe.
// Découpe les documents en chunks, indexe par TF-IDF, récupère les passages
// les plus pertinents par similarité cosinus. Persistance JSON sur disque.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, "..", "data", "rag-store.json");
const SEED_DIR = join(__dirname, "..", "data", "knowledge");

const STOPWORDS = new Set(
  ("au aux avec ce ces dans de des du elle en et eux il je la le leur lui ma mais me " +
   "meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur " +
   "ta te tes toi ton tu un une vos votre vous c d j l a m n s t y est cet cette sont " +
   "the of to and in is it for on as at by an be or").split(/\s+/)
);

function normalize(text) {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(text) {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function chunkText(text, target = 900, overlap = 150) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= target) return [clean];
  const chunks = [];
  // Découpe par paragraphes, regroupés jusqu'à ~target caractères.
  const paras = clean.split(/\n{2,}/);
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > target && buf) {
      chunks.push(buf.trim());
      buf = buf.slice(Math.max(0, buf.length - overlap)) + "\n\n" + p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  // Sécurité : re-découpe les chunks encore trop longs.
  const out = [];
  for (const c of chunks) {
    if (c.length <= target * 1.6) { out.push(c); continue; }
    for (let i = 0; i < c.length; i += target - overlap) {
      out.push(c.slice(i, i + target));
    }
  }
  return out;
}

export class RagStore {
  constructor() {
    /** @type {{id:string,name:string,createdAt:number,chunks:{text:string,tf:Record<string,number>}[]}[]} */
    this.documents = [];
    this.df = {};          // document-frequency par terme (au niveau chunk)
    this.chunkCount = 0;
    this._load();
    if (this.documents.length === 0) this._seed();
  }

  _load() {
    if (existsSync(STORE_PATH)) {
      try {
        const raw = JSON.parse(readFileSync(STORE_PATH, "utf8"));
        this.documents = raw.documents || [];
        this._reindex();
      } catch { /* store corrompu : on repart à vide */ }
    }
  }

  // Charge les documents de démonstration au tout premier lancement.
  _seed() {
    if (!existsSync(SEED_DIR)) return;
    try {
      const files = readdirSync(SEED_DIR).filter((f) => /\.(md|txt|csv|json)$/i.test(f));
      for (const f of files) {
        const content = readFileSync(join(SEED_DIR, f), "utf8");
        const chunks = chunkText(content).map((text) => ({ text, tf: {} }));
        this.documents.push({ id: "doc_seed_" + slugId(f), name: f, createdAt: Date.now(), chunks });
      }
      if (this.documents.length) { this._reindex(); this._persist(); }
    } catch { /* seed optionnel */ }
  }

  _persist() {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    const slim = {
      documents: this.documents.map((d) => ({
        id: d.id, name: d.name, createdAt: d.createdAt,
        chunks: d.chunks.map((c) => ({ text: c.text })),
      })),
    };
    writeFileSync(STORE_PATH, JSON.stringify(slim, null, 2), "utf8");
  }

  _reindex() {
    this.df = {};
    this.chunkCount = 0;
    for (const doc of this.documents) {
      for (const chunk of doc.chunks) {
        const tf = {};
        for (const tok of tokenize(chunk.text)) tf[tok] = (tf[tok] || 0) + 1;
        chunk.tf = tf;
        this.chunkCount += 1;
        for (const term of Object.keys(tf)) this.df[term] = (this.df[term] || 0) + 1;
      }
    }
  }

  addDocument(name, content) {
    const id = "doc_" + Math.abs(hash(name + content.length + this.documents.length)).toString(36);
    const chunks = chunkText(content).map((text) => ({ text, tf: {} }));
    const doc = { id, name: name || "document", createdAt: Date.now(), chunks };
    this.documents.push(doc);
    this._reindex();
    this._persist();
    return { id: doc.id, name: doc.name, chunks: chunks.length };
  }

  removeDocument(id) {
    const before = this.documents.length;
    this.documents = this.documents.filter((d) => d.id !== id);
    const removed = before !== this.documents.length;
    if (removed) { this._reindex(); this._persist(); }
    return removed;
  }

  list() {
    return this.documents.map((d) => ({
      id: d.id, name: d.name, chunks: d.chunks.length,
    }));
  }

  stats() {
    return { documents: this.documents.length, chunks: this.chunkCount, terms: Object.keys(this.df).length };
  }

  _idf(term) {
    const df = this.df[term] || 0;
    return Math.log((this.chunkCount + 1) / (df + 1)) + 1;
  }

  // Retourne les passages les plus pertinents pour la requête.
  search(query, k = 4) {
    if (this.chunkCount === 0) return [];
    const qtf = {};
    for (const tok of tokenize(query)) qtf[tok] = (qtf[tok] || 0) + 1;
    const qterms = Object.keys(qtf);
    if (qterms.length === 0) return [];

    const qvec = {};
    let qnorm = 0;
    for (const t of qterms) {
      const w = qtf[t] * this._idf(t);
      qvec[t] = w;
      qnorm += w * w;
    }
    qnorm = Math.sqrt(qnorm) || 1;

    const scored = [];
    for (const doc of this.documents) {
      for (let ci = 0; ci < doc.chunks.length; ci++) {
        const chunk = doc.chunks[ci];
        let dot = 0, dnorm = 0;
        for (const [t, f] of Object.entries(chunk.tf)) {
          const w = f * this._idf(t);
          dnorm += w * w;
          if (qvec[t]) dot += qvec[t] * w;
        }
        dnorm = Math.sqrt(dnorm) || 1;
        const score = dot / (qnorm * dnorm);
        if (score > 0) {
          scored.push({ score, text: chunk.text, source: doc.name, docId: doc.id, chunkIndex: ci });
        }
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

function hash(str) {
  str = String(str);
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return h;
}
function slugId(str) { return Math.abs(hash(str)).toString(36); }
