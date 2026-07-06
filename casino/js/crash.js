/* Crash : le multiplicateur monte, encaissez avant l'explosion.
   Point de crash provably fair avec 1 % d'avantage maison :
   r < 0.01 → crash instantané à 1.00, sinon 0.99 / (1 - r). */
const Crash = {
  state: "idle",          // idle | running
  bet: 0,
  crashPoint: 1,
  startTime: 0,
  points: [],
  history: [],
  raf: null,

  multAt(ms) { return Math.exp(ms * 0.00025); },

  async start() {
    if (this.state === "running") return this.cashout();
    const bet = UI.betValue("crash-bet");
    if (!Wallet.debit(bet)) return;
    this.bet = bet;

    const r = await Fair.roll("crash");
    this.crashPoint = r < 0.01 ? 1.0 : Math.max(1.0, Math.floor((0.99 / (1 - r)) * 100) / 100);

    this.state = "running";
    this.points = [];
    this.startTime = performance.now();
    const btn = document.getElementById("crash-action");
    btn.textContent = "ENCAISSER";
    btn.classList.add("danger");
    const out = document.getElementById("crash-result");
    out.textContent = "En vol…";
    out.className = "result-line";
    document.getElementById("crash-mult").classList.remove("crashed");
    this.tick();
  },

  tick() {
    const ms = performance.now() - this.startTime;
    const mult = this.multAt(ms);
    if (mult >= this.crashPoint) return this.explode();
    this.points.push(mult);
    document.getElementById("crash-mult").textContent = "×" + mult.toFixed(2);
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
    const out = document.getElementById("crash-result");
    out.textContent = `Encaissé à ×${mult.toFixed(2)} → +${win.toFixed(2)} Ⓝ`;
    out.className = "result-line win";
    UI.addBet("🚀 Crash", this.bet, mult, win);
    this.finish(mult, false);
  },

  explode() {
    cancelAnimationFrame(this.raf);
    const out = document.getElementById("crash-result");
    out.textContent = `💥 Crash à ×${this.crashPoint.toFixed(2)} — mise perdue`;
    out.className = "result-line lose";
    const multEl = document.getElementById("crash-mult");
    multEl.textContent = "×" + this.crashPoint.toFixed(2);
    multEl.classList.add("crashed");
    UI.addBet("🚀 Crash", this.bet, 0, 0);
    this.finish(this.crashPoint, true);
  },

  finish(mult, crashed) {
    this.state = "idle";
    const btn = document.getElementById("crash-action");
    btn.textContent = "DÉCOLLER";
    btn.classList.remove("danger");
    this.draw(mult, crashed);
    this.history.unshift(this.crashPoint);
    if (this.history.length > 12) this.history.pop();
    document.getElementById("crash-history").innerHTML = this.history.map(c =>
      `<span class="${c >= 2 ? "hi" : "lo"}">×${c.toFixed(2)}</span>`).join("");
  },

  draw(currentMult, crashed) {
    const cv = document.getElementById("crash-canvas");
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);

    const maxMult = Math.max(2, currentMult * 1.15);
    const n = Math.max(this.points.length, 2);

    /* Grille horizontale. */
    ctx.strokeStyle = "rgba(38,48,80,.6)";
    ctx.fillStyle = "#8b94ad";
    ctx.font = "11px sans-serif";
    for (let m = 1; m <= maxMult; m += Math.max(1, Math.floor(maxMult / 5))) {
      const y = cv.height - ((m - 1) / (maxMult - 1)) * (cv.height - 24) - 12;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke();
      ctx.fillText("×" + m, 6, y - 4);
    }

    /* Courbe. */
    ctx.beginPath();
    this.points.forEach((m, i) => {
      const x = (i / (n - 1)) * (cv.width - 20) + 10;
      const y = cv.height - ((m - 1) / (maxMult - 1)) * (cv.height - 24) - 12;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = crashed ? "#ff5470" : "#00e5a0";
    ctx.lineWidth = 3;
    ctx.stroke();

    /* Fusée / explosion en tête de courbe. */
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
  document.getElementById("crash-action").addEventListener("click", () => Crash.start());
  Crash.draw(1, false);
});
