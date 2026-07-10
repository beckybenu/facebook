// Routeur d'agents (navigateur) — cœur du « Neural Cerveau Central ».
// Classe les agents par pertinence face à une demande (TF-IDF + cosinus). Pur ES module.

const STOPWORDS = new Set(
  ("au aux avec ce ces dans de des du elle en et eux il je la le leur lui ma mais me " +
   "meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur " +
   "ta te tes toi ton tu un une vos votre vous c d j l a m n s t y est cet cette sont " +
   "quel quelle quels quelles comment combien pourquoi faire fais peux peut dois " +
   "the of to and in is it for on as at by an be or my your").split(/\s+/)
);

export function tokenize(text) {
  return String(text)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export class AgentRouter {
  constructor(agents) {
    this.agents = agents.filter((a) => a.id !== "cerveau-central");
    this.df = {};
    this.docs = this.agents.map((a) => {
      const text = `${a.shortName} ${a.shortName} ${a.description} ${a.categoryLabel}`;
      const tf = {};
      for (const tok of tokenize(text)) tf[tok] = (tf[tok] || 0) + 1;
      for (const term of Object.keys(tf)) this.df[term] = (this.df[term] || 0) + 1;
      return { agent: a, tf };
    });
    this.N = this.docs.length;
  }

  _idf(term) {
    return Math.log((this.N + 1) / ((this.df[term] || 0) + 1)) + 1;
  }

  route(message, k = 3) {
    const qtf = {};
    for (const tok of tokenize(message)) qtf[tok] = (qtf[tok] || 0) + 1;
    const qterms = Object.keys(qtf);
    if (!qterms.length) return [];

    const qvec = {};
    let qnorm = 0;
    for (const t of qterms) { const w = qtf[t] * this._idf(t); qvec[t] = w; qnorm += w * w; }
    qnorm = Math.sqrt(qnorm) || 1;

    const scored = [];
    for (const { agent, tf } of this.docs) {
      let dot = 0, dnorm = 0;
      for (const [t, f] of Object.entries(tf)) {
        const w = f * this._idf(t);
        dnorm += w * w;
        if (qvec[t]) dot += qvec[t] * w;
      }
      dnorm = Math.sqrt(dnorm) || 1;
      const score = dot / (qnorm * dnorm);
      if (score > 0) scored.push({ agent, score: Number(score.toFixed(3)) });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}
