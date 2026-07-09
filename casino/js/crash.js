/* Crash : le multiplicateur monte, encaissez avant l'explosion.
   Deux modes :
   - Solo (hors ligne) : point de crash provably fair local, 1 % d'avantage maison.
   - En ligne (Net.online) : rounds partagés orchestrés par le serveur — tous les
     joueurs connectés parient sur le même round et voient les paris des autres. */
const Crash = {
  /* ----- état solo ----- */
  state: "idle",          // idle | running
  bet: 0,
  crashPoint: 1,
  startTime: 0,
  points: [],
  history: [],
  raf: null,

  /* ----- état en ligne ----- */
  net: {
    phase: null,          // betting | running | crashed
    roundN: 0,
    startedAt: 0,
    endsAt: 0,
    myBet: 0,
    cashed: false,
    countdown: null,
    raf: null
  },

  multAt(ms) { return Math.exp(ms * 0.00025); },

  btn() { return document.getElementById("crash-action"); },
  out() { return document.getElementById("crash-result"); },
  multEl() { return document.getElementById("crash-mult"); },

  /* ================= ACTION PRINCIPALE ================= */
  action() {
    if (Net.online) return this.onlineAction();
    if (this.state === "running") return this.cashout();
    return this.start();
  },

  /* ================= MODE SOLO ================= */
  async start() {
    const bet = UI.betValue("crash-bet");
    if (!Wallet.debit(bet)) return;
    this.bet = bet;

    const r = await Fair.roll("crash");
    this.crashPoint = r < 0.01 ? 1.0 : Math.max(1.0, Math.floor((0.99 / (1 - r)) * 100) / 100);

    this.state = "running";
    this.points = [];
    this.startTime = performance.now();
    this.btn().textContent = "ENCAISSER";
    this.btn().classList.add("danger");
    this.out().textContent = "En vol…";
    this.out().className = "result-line";
    this.multEl().classList.remove("crashed");
    this.tick();
  },

  tick() {
    const ms = performance.now() - this.startTime;
    const mult = this.multAt(ms);
    if (mult >= this.crashPoint) return this.explode();
    this.points.push(mult);
    this.multEl().textContent = "×" + mult.toFixed(2);
    this.draw(mult, false);
    this.raf = requestAnimationFrame(() => this.tick());
  },

  cashout() {
    if (this.state !== "running") return;
    cancelAnimationFrame(this.raf);
    const ms = performance.now() - this.startTime;
    const mult = Math.min(this.multAt(ms), this.crashPoint - 0.01);
    const win = Math.round(this.bet * mult * 100) / 100;
    Wallet.credit(win);
    this.out().textContent = `Encaissé à ×${mult.toFixed(2)} → +${win.toFixed(2)} Ⓝ`;
    this.out().className = "result-line win";
    UI.addBet("🚀 Crash", this.bet, mult, win);
    this.finishSolo(mult);
  },

  explode() {
    cancelAnimationFrame(this.raf);
    this.out().textContent = `💥 Crash à ×${this.crashPoint.toFixed(2)} — mise perdue`;
    this.out().className = "result-line lose";
    this.multEl().textContent = "×" + this.crashPoint.toFixed(2);
    this.multEl().classList.add("crashed");
    UI.addBet("🚀 Crash", this.bet, 0, 0);
    this.finishSolo(this.crashPoint, true);
  },

  finishSolo(mult, crashed) {
    this.state = "idle";
    this.btn().textContent = "DÉCOLLER";
    this.btn().classList.remove("danger");
    this.draw(mult, crashed);
    this.history.unshift(this.crashPoint);
    if (this.history.length > 12) this.history.pop();
    this.renderHistory(this.history);
  },

  /* ================= MODE EN LIGNE ================= */
  async onlineAction() {
    const n = this.net;
    if (n.phase === "betting" && !n.myBet) {
      const bet = UI.betValue("crash-bet");
      if (!Wallet.debit(bet)) return;
      const res = await Net.post("/api/bet", { amount: bet });
      if (!res.ok) {
        Wallet.credit(bet);                      // remboursement si refus serveur
        return UI.toast(res.error || "Pari refusé", true);
      }
      n.myBet = bet;
      n.cashed = false;
      this.btn().textContent = "PARI PLACÉ…";
      this.btn().disabled = true;
    } else if (n.phase === "running" && n.myBet && !n.cashed) {
      const res = await Net.post("/api/cashout", {});
      if (!res.ok) return UI.toast(res.error || "Trop tard !", true);
      n.cashed = true;
      Wallet.credit(res.win);
      this.out().textContent = `Encaissé à ×${res.mult.toFixed(2)} → +${res.win.toFixed(2)} Ⓝ`;
      this.out().className = "result-line win";
      UI.addBet("🚀 Crash", n.myBet, res.mult, res.win);
      this.btn().textContent = "ENCAISSÉ ✔";
      this.btn().disabled = true;
      this.btn().classList.remove("danger");
    }
  },

  netSnapshot(s) {
    this.stopSolo();
    this.renderHistory(s.history);
    /* Appliquer la phase d'abord (elle vide la table), puis rejouer les paris du round. */
    this.netPhase({ phase: s.round.phase, n: s.round.n, endsAt: s.round.endsAt,
                    startedAt: s.round.startedAt, crashPoint: s.round.crashPoint,
                    now: s.now, history: s.history });
    this.clearPlayers();
    Object.entries(s.round.bets || {}).forEach(([pseudo, b]) => {
      this.netBet({ pseudo, amount: b.amount });
      if (b.status === "out")
        this.netCashout({ pseudo, mult: b.mult, win: Math.round(b.amount * b.mult * 100) / 100 });
    });
  },

  netPhase(msg) {
    const n = this.net;
    Net.offset = msg.now - Date.now();
    n.phase = msg.phase;
    n.roundN = msg.n;
    cancelAnimationFrame(n.raf);
    clearInterval(n.countdown);

    if (msg.phase === "betting") {
      n.myBet = 0;
      n.cashed = false;
      n.endsAt = msg.endsAt;
      this.points = [];
      this.clearPlayers();
      this.multEl().classList.remove("crashed");
      this.multEl().textContent = "×1.00";
      this.draw(1, false);
      this.btn().disabled = false;
      this.btn().classList.remove("danger");
      this.out().className = "result-line";
      n.countdown = setInterval(() => {
        const s = Math.max(0, (n.endsAt - Date.now() - Net.offset) / 1000);
        this.out().textContent = `Round #${n.roundN} — départ dans ${s.toFixed(1)} s`;
        if (!n.myBet) this.btn().textContent = `PARIER (${s.toFixed(0)} s)`;
      }, 150);
    }

    if (msg.phase === "running") {
      n.startedAt = msg.startedAt;
      this.points = [];
      this.out().textContent = n.myBet ? "En vol — encaissez avant le crash !" : "Round en cours…";
      if (n.myBet && !n.cashed) {
        this.btn().textContent = "ENCAISSER";
        this.btn().disabled = false;
        this.btn().classList.add("danger");
      } else if (!n.cashed) {
        this.btn().textContent = "ROUND EN COURS…";
        this.btn().disabled = true;
      }
      this.netTick();
    }

    if (msg.phase === "crashed") {
      const cp = msg.crashPoint;   // absent si on rejoint entre deux rounds
      if (cp !== undefined) {
        this.multEl().textContent = "×" + cp.toFixed(2);
        this.multEl().classList.add("crashed");
        this.draw(cp, true);
      }
      if (msg.history) this.renderHistory(msg.history);
      if (n.myBet && !n.cashed && cp !== undefined) {
        this.out().textContent = `💥 Crash à ×${cp.toFixed(2)} — mise perdue`;
        this.out().className = "result-line lose";
        UI.addBet("🚀 Crash", n.myBet, 0, 0);
      } else if (!n.myBet) {
        this.out().textContent = cp !== undefined ? `💥 Crash à ×${cp.toFixed(2)}` : "En attente du prochain round…";
      }
      this.btn().textContent = "PROCHAIN ROUND…";
      this.btn().disabled = true;
      this.btn().classList.remove("danger");
    }
  },

  netTick() {
    const n = this.net;
    if (n.phase !== "running") return;
    const ms = Math.max(0, Date.now() + Net.offset - n.startedAt);
    const mult = this.multAt(ms);
    this.points.push(mult);
    if (this.points.length > 900) this.points.shift();
    this.multEl().textContent = "×" + mult.toFixed(2);
    this.draw(mult, false);
    n.raf = requestAnimationFrame(() => this.netTick());
  },

  netBet(b) {
    const tbody = document.getElementById("crash-players");
    const row = document.createElement("tr");
    row.dataset.pseudo = b.pseudo;
    row.innerHTML = `<td>${Net.esc(b.pseudo)}${b.pseudo === Net.pseudo ? " (vous)" : ""}</td>
      <td>${b.amount.toFixed(2)} Ⓝ</td><td class="crash-bet-status">en jeu…</td>`;
    tbody.appendChild(row);
  },

  netCashout(c) {
    const row = document.querySelector(`#crash-players tr[data-pseudo="${CSS.escape(c.pseudo)}"]`);
    if (!row) return;
    row.querySelector(".crash-bet-status").innerHTML =
      `<span class="win">×${c.mult.toFixed(2)} → +${c.win.toFixed(2)} Ⓝ</span>`;
  },

  clearPlayers() {
    document.getElementById("crash-players").innerHTML = "";
  },

  netOffline() {
    const n = this.net;
    cancelAnimationFrame(n.raf);
    clearInterval(n.countdown);
    n.phase = null;
    if (n.myBet && !n.cashed) {
      Wallet.credit(n.myBet);          // connexion perdue avant résolution : remboursé
      UI.toast("Connexion perdue — mise remboursée", true);
    }
    n.myBet = 0;
    this.clearPlayers();
    this.btn().textContent = "DÉCOLLER";
    this.btn().disabled = false;
    this.btn().classList.remove("danger");
    this.out().textContent = "Mode solo (hors ligne)";
    this.out().className = "result-line";
    document.getElementById("crash-seedhash").textContent = "";
  },

  stopSolo() {
    cancelAnimationFrame(this.raf);
    if (this.state === "running") {
      Wallet.credit(this.bet);         // round solo interrompu par la connexion
      this.state = "idle";
    }
  },

  /* ================= RENDU ================= */
  renderHistory(list) {
    document.getElementById("crash-history").innerHTML = (list || []).map(c =>
      `<span class="${c >= 2 ? "hi" : "lo"}">×${c.toFixed(2)}</span>`).join("");
  },

  draw(currentMult, crashed) {
    const cv = document.getElementById("crash-canvas");
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);

    const maxMult = Math.max(2, currentMult * 1.15);
    const n = Math.max(this.points.length, 2);

    ctx.strokeStyle = "rgba(38,48,80,.6)";
    ctx.fillStyle = "#8b94ad";
    ctx.font = "11px sans-serif";
    for (let m = 1; m <= maxMult; m += Math.max(1, Math.floor(maxMult / 5))) {
      const y = cv.height - ((m - 1) / (maxMult - 1)) * (cv.height - 24) - 12;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke();
      ctx.fillText("×" + m, 6, y - 4);
    }

    ctx.beginPath();
    this.points.forEach((m, i) => {
      const x = (i / (n - 1)) * (cv.width - 20) + 10;
      const y = cv.height - ((m - 1) / (maxMult - 1)) * (cv.height - 24) - 12;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = crashed ? "#ff5470" : "#00e5a0";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (this.points.length) {
      const m = this.points[this.points.length - 1];
      const x = cv.width - 10;
      const y = cv.height - ((m - 1) / (maxMult - 1)) * (cv.height - 24) - 12;
      ctx.font = "22px sans-serif";
      ctx.fillText(crashed ? "💥" : "🚀", x - 22, y + 6);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("crash-action").addEventListener("click", () => Crash.action());
  Crash.draw(1, false);
});
