/* Plinko : 12 rangées de picots, 13 cases. Chaque rebond gauche/droite
   provient d'un tirage provably fair. */
const Plinko = {
  ROWS: 12,
  risk: "mid",
  tables: {
    low:  [10, 3, 1.6, 1.4, 1.2, 1.0, 0.4, 1.0, 1.2, 1.4, 1.6, 3, 10],
    mid:  [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [110, 22, 6, 2.2, 0.9, 0.3, 0.2, 0.3, 0.9, 2.2, 6, 22, 110]
  },
  dropping: false,
  lastBin: -1,

  geometry() {
    const cv = document.getElementById("plinko-canvas");
    const top = 40, bottom = 60;
    const rowGap = (cv.height - top - bottom) / this.ROWS;
    const colGap = cv.width / (this.ROWS + 2);
    return { cv, top, rowGap, colGap };
  },

  /* Position du picot (row 0..11, k 0..row) — pyramide centrée. */
  pegXY(row, k) {
    const { cv, top, rowGap, colGap } = this.geometry();
    return {
      x: cv.width / 2 + (k - row / 2) * colGap,
      y: top + (row + 1) * rowGap
    };
  },

  draw(ball) {
    const { cv, top, rowGap, colGap } = this.geometry();
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);

    /* Picots. */
    ctx.fillStyle = "#4a5578";
    for (let row = 0; row < this.ROWS; row++)
      for (let k = 0; k <= row; k++) {
        const p = this.pegXY(row, k);
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      }

    /* Cases de gain. */
    const table = this.tables[this.risk];
    const y = top + (this.ROWS + 0.6) * rowGap;
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    table.forEach((m, i) => {
      const x = cv.width / 2 + (i - this.ROWS / 2) * colGap;
      ctx.fillStyle = i === this.lastBin ? "#00e5a0"
        : m >= 10 ? "#ff5470" : m >= 2 ? "#ffcf5c" : "#263050";
      const w = colGap - 6;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y, w, 30, 6);
      ctx.fill();
      ctx.fillStyle = i === this.lastBin ? "#04281c" : "#e8ecf7";
      ctx.fillText("×" + m, x, y + 19);
    });

    /* Bille. */
    if (ball) {
      ctx.fillStyle = "#00e5a0";
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,229,160,.4)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  },

  async drop() {
    if (this.dropping) return;
    const bet = UI.betValue("plinko-bet");
    if (!Wallet.debit(bet)) return;
    this.dropping = true;
    this.lastBin = -1;
    document.getElementById("plinko-drop").disabled = true;
    const out = document.getElementById("plinko-result");
    out.textContent = "…";
    out.className = "result-line";

    /* 12 décisions gauche/droite provably fair. */
    const rolls = await Fair.rolls("plinko", this.ROWS);
    const rights = rolls.map(r => (r < 0.5 ? 0 : 1));
    const bin = rights.reduce((a, b) => a + b, 0);

    /* Chemin : du sommet vers chaque picot touché puis la case finale. */
    const { cv, top, rowGap, colGap } = this.geometry();
    const path = [{ x: cv.width / 2, y: top - 20 }];
    let k = 0;
    for (let row = 0; row < this.ROWS; row++) {
      const peg = this.pegXY(row, k);
      path.push({ x: peg.x, y: peg.y - 8 });
      k += rights[row];
    }
    path.push({ x: cv.width / 2 + (bin - this.ROWS / 2) * colGap, y: top + (this.ROWS + 0.6) * rowGap });

    /* Animation segment par segment. */
    for (let s = 0; s < path.length - 1; s++) {
      const a = path[s], b = path[s + 1];
      const steps = 8;
      for (let t = 1; t <= steps; t++) {
        const f = t / steps;
        this.draw({
          x: a.x + (b.x - a.x) * f,
          y: a.y + (b.y - a.y) * f - Math.sin(f * Math.PI) * 10  // petit arc de rebond
        });
        await new Promise(res => setTimeout(res, 14));
      }
    }

    const mult = this.tables[this.risk][bin];
    this.lastBin = bin;
    this.draw(null);
    const win = Math.round(bet * mult * 100) / 100;
    if (win > 0) Wallet.credit(win);
    out.textContent = mult >= 1
      ? `×${mult} → +${win.toFixed(2)} Ⓝ`
      : `×${mult} → ${win.toFixed(2)} Ⓝ récupérés`;
    out.className = "result-line " + (mult >= 1 ? "win" : "lose");
    if (mult >= 10) UI.toast(`🔥 Plinko ×${mult} ! +${win.toFixed(2)} Ⓝ`);
    UI.addBet("🔻 Plinko", bet, mult, win);

    this.dropping = false;
    document.getElementById("plinko-drop").disabled = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".plinko-risk").forEach(btn =>
    btn.addEventListener("click", () => {
      if (Plinko.dropping) return;
      Plinko.risk = btn.dataset.risk;
      document.querySelectorAll(".plinko-risk").forEach(b =>
        b.classList.toggle("active", b === btn));
      Plinko.lastBin = -1;
      Plinko.draw(null);
    }));
  document.getElementById("plinko-drop").addEventListener("click", () => Plinko.drop());
  Plinko.draw(null);
});
