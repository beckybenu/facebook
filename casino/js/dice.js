/* Dice : nombre entre 0.00 et 99.99, pari sous/au-dessus de la cible.
   Multiplicateur = 99 / chance (1 % d'avantage maison). */
const Dice = {
  mode: "under",
  rolling: false,

  chance() {
    const t = parseInt(document.getElementById("dice-target").value, 10);
    return this.mode === "under" ? t : 100 - t;
  },

  updateStats() {
    const t = parseInt(document.getElementById("dice-target").value, 10);
    const c = this.chance();
    document.getElementById("dice-target-label").textContent =
      (this.mode === "under" ? "Sous " : "Au-dessus de ") + t;
    document.getElementById("dice-chance").textContent = c.toFixed(2) + " %";
    document.getElementById("dice-payout").textContent = "×" + (99 / c).toFixed(2);
  },

  setMode(mode) {
    this.mode = mode;
    document.getElementById("dice-under").classList.toggle("active", mode === "under");
    document.getElementById("dice-over").classList.toggle("active", mode === "over");
    this.updateStats();
  },

  async roll() {
    if (this.rolling) return;
    const bet = UI.betValue("dice-bet");
    if (!Wallet.debit(bet)) return;
    this.rolling = true;

    const t = parseInt(document.getElementById("dice-target").value, 10);
    const mult = 99 / this.chance();
    const numEl = document.getElementById("dice-number");
    const out = document.getElementById("dice-result");
    numEl.className = "dice-number";
    out.className = "result-line";
    out.textContent = "…";

    /* Petite animation de défilement. */
    const anim = setInterval(() => {
      numEl.textContent = (Math.random() * 100).toFixed(2);
    }, 50);
    const r = await Fair.roll("dice");
    await new Promise(res => setTimeout(res, 600));
    clearInterval(anim);

    const value = Math.floor(r * 10000) / 100;
    numEl.textContent = value.toFixed(2);
    const won = this.mode === "under" ? value < t : value > t;

    if (won) {
      const win = Math.round(bet * mult * 100) / 100;
      Wallet.credit(win);
      numEl.classList.add("win");
      out.textContent = `GAGNÉ +${win.toFixed(2)} Ⓝ (×${mult.toFixed(2)})`;
      out.className = "result-line win";
      UI.addBet("🎲 Dice", bet, mult, win);
    } else {
      numEl.classList.add("lose");
      out.textContent = "Perdu…";
      out.className = "result-line lose";
      UI.addBet("🎲 Dice", bet, 0, 0);
    }
    this.rolling = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("dice-target").addEventListener("input", () => Dice.updateStats());
  document.getElementById("dice-under").addEventListener("click", () => Dice.setMode("under"));
  document.getElementById("dice-over").addEventListener("click", () => Dice.setMode("over"));
  document.getElementById("dice-roll").addEventListener("click", () => Dice.roll());
  Dice.updateStats();
});
