// Mini-moteur RAG : découpage en chunks + recherche BM25 sur la base de connaissances.
import { getState } from "./store.js";

const CHUNK_SIZE = 700;   // caractères par chunk
const CHUNK_OVERLAP = 120;

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

export function chunkDocument(doc) {
  const chunks = [];
  const text = doc.content || "";
  for (let start = 0; start < text.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    const body = text.slice(start, start + CHUNK_SIZE);
    if (body.trim()) chunks.push({ docId: doc.id, title: doc.title, body });
    if (start + CHUNK_SIZE >= text.length) break;
  }
  if (chunks.length === 0) chunks.push({ docId: doc.id, title: doc.title, body: doc.title });
  return chunks;
}

// BM25 classique calculé à la volée (la base reste petite : pas besoin d'index persistant).
export function searchKnowledge(query, topK = 4) {
  const docs = getState().documents;
  const chunks = docs.flatMap(chunkDocument);
  if (chunks.length === 0) return [];

  const k1 = 1.5;
  const b = 0.75;
  const chunkTokens = chunks.map((c) => tokenize(c.title + " " + c.body));
  const avgLen = chunkTokens.reduce((a, t) => a + t.length, 0) / chunkTokens.length;

  const df = new Map();
  for (const tokens of chunkTokens) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) || 0) + 1);
  }

  const queryTerms = tokenize(query);
  const N = chunks.length;

  const scored = chunks.map((chunk, i) => {
    const tokens = chunkTokens[i];
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    let score = 0;
    for (const term of queryTerms) {
      const f = tf.get(term) || 0;
      if (!f) continue;
      const idf = Math.log(1 + (N - df.get(term) + 0.5) / (df.get(term) + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (tokens.length / avgLen))));
    }
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, topK);
}
