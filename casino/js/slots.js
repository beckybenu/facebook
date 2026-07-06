/* Machine à sous 3×3, 5 lignes (3 horizontales + 2 diagonales). */
const Slots = {
  /* Bande de 23 symboles par rouleau (pondération). */
  strip: ["🍒","🍒","🍒","🍒","🍒","🍋","🍋","🍋","🍋","🍋","🔔","🔔","🔔","🔔","🍀","🍀","🍀","⭐","⭐","⭐","💎","💎","7️⃣"],
  pay3: { "🍒": 12, "🍋": 15, "🔔": 25, "🍀": 40, "⭐": 60, "💎": 150, "7️⃣": 500 },
  pay2: { "💎": 3, "7️⃣": 5 },
  lines: [
    [0, 0, 0], [1, 1, 1], [2, 2, 2],   // horizontales (ligne par rouleau)
    [0, 1, 2], [2, 1, 0]               // diagonales
  ],
  spinning: false,

  cellAt(reel, row) {
    return document.querySelectorAll("#reels .reel")[reel].children[row];
  },

  setColumn(reel, symbols) {
    for (let row = 0; row < 3; row++) this.cellAt(reel, row).textContent = symbols[row];
  },

  randomColumn() {
    const s = this.strip;
    return [0, 0, 0].map(() => s[Math.floor(Math.random() * s.length)]);
  },

  async spin() {
    if (this.spinning) return;
    const bet = UI.betValue("slots-bet");
    if (!Wallet.debit(bet)) return;
    this.spinning = true;

    const btn = document.getElementById("slots-spin");
    const out = document.getElementById("slots-result");
    btn.disabled = true;
    out.textContent = "…";
    out.className = "result-line";
    document.querySelectorAll("#reels .cell").forEach(c => c.classList.remove("hit"));

    /* Positions d'arrêt provably fair (une par rouleau). */
    const rollsP = Fair.rolls("slots", 3);

    /* Animation : défilement flou, arrêt échelonné des rouleaux. */
    const reels = document.querySelectorAll("#reels .reel");
    reels.forEach(r => r.classList.add("spinning"));
    const shuffler = setInterval(() => {
      for (let i = 0; i < 3; i++)
        if (reels[i].classList.contains("spinning")) this.setColumn(i, this.randomColumn());
    }, 70);

    const rolls = await rollsP;
    const grid = [];   // grid[reel][row]
    for (let i = 0; i < 3; i++) {
      const stop = Math.floor(rolls[i] * this.strip.length);
      grid.push([0, 1, 2].map(r => this.strip[(stop + r) % this.strip.length]));
      await new Promise(res => setTimeout(res, 350 + i * 250));
      reels[i].classList.remove("spinning");
      this.setColumn(i, grid[i]);
    }
    clearInterval(shuffler);

    /* Évaluation des 5 lignes. */
    const lineBet = bet / this.lines.length;
    let totalWin = 0, bestMult = 0;
    this.lines.forEach(rows => {
      const syms = rows.map((row, reel) => grid[reel][row]);
      let mult = 0;
      if (syms[0] === syms[1] && syms[1] === syms[2]) mult = this.pay3[syms[0]] || 0;
      else {
        for (const s of ["7️⃣", "💎"]) {
          const n = syms.filter(x => x === s).length;
          if (n === 2) { mult = this.pay2[s]; break; }
        }
      }
      if (mult > 0) {
        totalWin += lineBet * mult;
        bestMult = Math.max(bestMult, mult);
        rows.forEach((row, reel) => this.cellAt(reel, row).classList.add("hit"));
      }
    });

    totalWin = Math.round(totalWin * 100) / 100;
    if (totalWin > 0) {
      Wallet.credit(totalWin);
      out.textContent = `GAGNÉ +${totalWin.toFixed(2)} Ⓝ (meilleure ligne ×${bestMult})`;
      out.className = "result-line win";
      if (bestMult >= 150) UI.toast(`💎 GROS GAIN ! +${totalWin.toFixed(2)} Ⓝ`);
    } else {
      out.textContent = "Perdu… retentez votre chance";
      out.className = "result-line lose";
    }
    UI.addBet("🎰 Slots", bet, totalWin / bet, totalWin);

    this.spinning = false;
    btn.disabled = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("slots-spin").addEventListener("click", () => Slots.spin());
});
