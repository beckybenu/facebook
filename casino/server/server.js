/* NovaSpin — serveur multijoueur (crédits virtuels uniquement, aucun argent réel).
   Node.js pur, zéro dépendance : SSE pour le temps réel + POST JSON pour les actions.

   Lancement :  node server.js          (port 8902 par défaut, ou PORT=xxxx)
   Le front se connecte via le panneau « Mode en ligne » du lobby. */

const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 8902;
const GROWTH = 0.00025;               // même courbe que le client : mult = e^(GROWTH·ms)
const BETTING_MS = 8000;              // phase de paris
const PAUSE_MS = 4000;                // pause après le crash

const serverSeed = crypto.randomBytes(32).toString("hex");
const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");

/* ---------- État ---------- */
let round = { n: 0, phase: "pause", endsAt: 0, startedAt: 0, crashPoint: 0, bets: {} };
let history = [];                     // derniers points de crash
let chatLog = [];                     // 30 derniers messages
let leaderboard = [];                 // top 10 des gains
const sseClients = new Set();

/* ---------- Provably fair : point de crash du round n ---------- */
function crashPointFor(n) {
  const h = crypto.createHmac("sha256", serverSeed).update(String(n)).digest("hex");
  const r = parseInt(h.slice(0, 8), 16) / 0x100000000;
  return r < 0.01 ? 1.0 : Math.max(1.0, Math.floor((0.99 / (1 - r)) * 100) / 100);
}

const multAt = ms => Math.exp(GROWTH * ms);
const durationFor = cp => Math.max(0, Math.log(cp) / GROWTH);

/* ---------- Diffusion SSE ---------- */
function broadcast(event, data) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) res.write(frame);
}

function broadcastPlayers() {
  broadcast("players", { count: sseClients.size });
}

function snapshot() {
  return {
    pseudoServer: "NovaSpin",
    seedHash: serverSeedHash,
    now: Date.now(),
    round: { n: round.n, phase: round.phase, endsAt: round.endsAt, startedAt: round.startedAt, bets: round.bets,
             /* le point de crash n'est révélé qu'une fois le round terminé */
             crashPoint: round.phase === "crashed" ? round.crashPoint : undefined },
    history, chat: chatLog, leaderboard, players: sseClients.size
  };
}

/* ---------- Bots de démonstration (préfixés 🤖) ---------- */
const BOT_NAMES = ["🤖 SpinBot", "🤖 LuckyBot", "🤖 MoonBot", "🤖 NovaBot", "🤖 TurboBot"];

function botsBet() {
  for (const name of BOT_NAMES) {
    if (Math.random() < 0.75) {
      const amount = Math.round((5 + Math.random() * 120) * 100) / 100;
      round.bets[name] = { amount, status: "in", mult: null };
      broadcast("bet", { pseudo: name, amount });
    }
  }
}

function botsPlanCashouts(durationMs, n) {
  for (const name of BOT_NAMES) {
    const b = round.bets[name];
    if (!b) continue;
    const target = 1.05 + -Math.log(1 - Math.random()) * 0.9;   // la plupart sortent tôt
    const t = durationFor(target);
    if (t >= durationMs) continue;                              // le bot n'y arrive pas
    setTimeout(() => {
      if (round.n !== n || round.phase !== "running") return;
      doCashout(name);
    }, t);
  }
}

/* ---------- Boucle de jeu ---------- */
function startBetting() {
  round = { n: round.n + 1, phase: "betting", endsAt: Date.now() + BETTING_MS, startedAt: 0, crashPoint: 0, bets: {} };
  broadcast("phase", { phase: "betting", n: round.n, endsAt: round.endsAt, now: Date.now() });
  botsBet();
  setTimeout(startRunning, BETTING_MS);
}

function startRunning() {
  round.phase = "running";
  round.crashPoint = crashPointFor(round.n);
  round.startedAt = Date.now();
  const duration = durationFor(round.crashPoint);
  broadcast("phase", { phase: "running", n: round.n, startedAt: round.startedAt, now: Date.now() });
  botsPlanCashouts(duration, round.n);
  setTimeout(doCrash, duration);
}

function doCrash() {
  round.phase = "crashed";
  history.unshift(round.crashPoint);
  history = history.slice(0, 15);
  broadcast("phase", { phase: "crashed", n: round.n, crashPoint: round.crashPoint, history, now: Date.now() });
  setTimeout(startBetting, PAUSE_MS);
}

/* ---------- Actions joueur ---------- */
function doBet(pseudo, amount) {
  if (round.phase !== "betting") return { ok: false, error: "Les paris sont fermés pour ce round" };
  if (!(amount > 0) || amount > 1e9) return { ok: false, error: "Mise invalide" };
  if (round.bets[pseudo]) return { ok: false, error: "Pari déjà placé" };
  round.bets[pseudo] = { amount, status: "in", mult: null };
  broadcast("bet", { pseudo, amount });
  return { ok: true, n: round.n };
}

function doCashout(pseudo) {
  if (round.phase !== "running") return { ok: false, error: "Aucun round en cours" };
  const b = round.bets[pseudo];
  if (!b || b.status !== "in") return { ok: false, error: "Aucun pari actif" };
  const mult = Math.min(multAt(Date.now() - round.startedAt), round.crashPoint);
  if (mult >= round.crashPoint) return { ok: false, error: "Trop tard — crash !" };
  b.status = "out";
  b.mult = Math.floor(mult * 100) / 100;
  const win = Math.round(b.amount * b.mult * 100) / 100;
  if (!pseudo.startsWith("🤖")) {          // les bots de démo ne comptent pas au classement
    leaderboard.push({ pseudo, mult: b.mult, win });
    leaderboard.sort((a, c) => c.win - a.win);
    leaderboard = leaderboard.slice(0, 10);
    broadcast("leaderboard", { leaderboard });
  }
  broadcast("cashout", { pseudo, mult: b.mult, win });
  return { ok: true, mult: b.mult, win };
}

function doChat(pseudo, text) {
  text = String(text || "").slice(0, 200).trim();
  if (!text) return { ok: false, error: "Message vide" };
  const msg = { pseudo: String(pseudo || "?").slice(0, 24), text, at: Date.now() };
  chatLog.push(msg);
  chatLog = chatLog.slice(-30);
  broadcast("chat", msg);
  return { ok: true };
}

/* ---------- HTTP ---------- */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise(resolve => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > 4096) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const path = req.url.split("?")[0];

  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }

  if (req.method === "GET" && path === "/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", ...CORS });
    res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot())}\n\n`);
    sseClients.add(res);
    broadcastPlayers();
    const ping = setInterval(() => res.write(": ping\n\n"), 25000);
    req.on("close", () => { clearInterval(ping); sseClients.delete(res); broadcastPlayers(); });
    return;
  }

  if (req.method === "GET" && (path === "/" || path === "/api/state")) {
    return json(res, 200, path === "/" ? {
      service: "NovaSpin multiplayer server",
      note: "Crédits virtuels uniquement — aucun argent réel.",
      seedHash: serverSeedHash, players: sseClients.size, round: round.n
    } : snapshot());
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const pseudo = String(body.pseudo || "").slice(0, 24).trim();
    if (!pseudo) return json(res, 400, { ok: false, error: "Pseudo requis" });
    if (path === "/api/bet") return json(res, 200, doBet(pseudo, Math.round(parseFloat(body.amount) * 100) / 100));
    if (path === "/api/cashout") return json(res, 200, doCashout(pseudo));
    if (path === "/api/chat") return json(res, 200, doChat(pseudo, body.text));
  }

  json(res, 404, { ok: false, error: "Route inconnue" });
});

server.listen(PORT, () => {
  console.log(`☄️  NovaSpin serveur multijoueur sur le port ${PORT} (crédits virtuels uniquement)`);
  console.log(`   Hash de la graine serveur : ${serverSeedHash}`);
  startBetting();
});
