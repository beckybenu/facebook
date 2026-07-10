// Moteur RAG (navigateur) — chunking + TF-IDF + cosinus, persistance localStorage.
// 100 % côté client : aucun backend requis (compatible GitHub Pages).
import { tokenize } from "./router.js";

const LS_KEY = "neuralstark:rag:v1";

function chunkText(text, target = 900, overlap = 150) {
  const clean = String(text).replace(/\r\n/g, "\n").trim();
  if (clean.length <= target) return [clean];
  const chunks = [];
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
  const out = [];
  for (const c of chunks) {
    if (c.length <= target * 1.6) { out.push(c); continue; }
    for (let i = 0; i < c.length; i += target - overlap) out.push(c.slice(i, i + target));
  }
  return out;
}

function hash(str) {
  str = String(str); let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return h;
}

export class RagStore {
  constructor() {
    this.documents = [];
    this.df = {};
    this.chunkCount = 0;
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { this.documents = JSON.parse(raw).documents || []; this._reindex(); }
    } catch { this.documents = []; }
  }

  _persist() {
    try {
      const slim = {
        documents: this.documents.map((d) => ({
          id: d.id, name: d.name, createdAt: d.createdAt,
          chunks: d.chunks.map((c) => ({ text: c.text })),
        })),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(slim));
    } catch { /* quota dépassé : on garde l'index en mémoire */ }
  }

  _reindex() {
    this.df = {}; this.chunkCount = 0;
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

  // Charge des documents de démonstration au 1er lancement (liste fournie).
  async seedIfEmpty(files = [], baseDir = "data/knowledge/") {
    if (this.documents.length || !files.length) return;
    for (const f of files) {
      try {
        const res = await fetch(baseDir + f);
        if (!res.ok) continue;
        const content = await res.text();
        const chunks = chunkText(content).map((text) => ({ text, tf: {} }));
        this.documents.push({ id: "doc_seed_" + Math.abs(hash(f)).toString(36), name: f, createdAt: Date.now(), chunks });
      } catch { /* seed optionnel */ }
    }
    if (this.documents.length) { this._reindex(); this._persist(); }
  }

  addDocument(name, content) {
    const id = "doc_" + Math.abs(hash(name + content.length + this.documents.length + Date.now())).toString(36);
    const chunks = chunkText(content).map((text) => ({ text, tf: {} }));
    this.documents.push({ id, name: name || "document", createdAt: Date.now(), chunks });
    this._reindex(); this._persist();
    return { id, name: name || "document", chunks: chunks.length };
  }

  removeDocument(id) {
    const before = this.documents.length;
    this.documents = this.documents.filter((d) => d.id !== id);
    const removed = before !== this.documents.length;
    if (removed) { this._reindex(); this._persist(); }
    return removed;
  }

  list() { return this.documents.map((d) => ({ id: d.id, name: d.name, chunks: d.chunks.length })); }
  stats() { return { documents: this.documents.length, chunks: this.chunkCount, terms: Object.keys(this.df).length }; }

  _idf(term) { return Math.log((this.chunkCount + 1) / ((this.df[term] || 0) + 1)) + 1; }

  search(query, k = 4) {
    if (this.chunkCount === 0) return [];
    const qtf = {};
    for (const tok of tokenize(query)) qtf[tok] = (qtf[tok] || 0) + 1;
    const qterms = Object.keys(qtf);
    if (!qterms.length) return [];

    const qvec = {}; let qnorm = 0;
    for (const t of qterms) { const w = qtf[t] * this._idf(t); qvec[t] = w; qnorm += w * w; }
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
        if (score > 0) scored.push({ score, text: chunk.text, source: doc.name, docId: doc.id, chunkIndex: ci });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}
