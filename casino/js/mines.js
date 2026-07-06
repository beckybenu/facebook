/* Mines : grille 5×5, évitez les bombes, encaissez quand vous voulez.
   Multiplicateur = 0.99 × Π (25-i)/(25-m-i) pour i = 0..picks-1. */
const Mines = {
  SIZE: 25,
  state: "idle",          // idle | playing
  bet: 0,
  minesCount: 3,
  mineSet: new Set(),
  picks: 0,

  mult(picks, mines) {
    let m = 0.99;
    for (let i = 0; i < picks; i++) m *= (this.SIZE - i) / (this.SIZE - mines - i);
    return m;
  },

  buildGrid() {
    const grid = document.getElementById("mines-grid");
    grid.innerHTML = "";
    for (let i = 0; i < this.SIZE; i++) {
      const b = document.createElement("button");
      b.dataset.idx = i;
      b.disabled = true;
      b.addEventListener("click", () => this.pick(i, b));
      grid.appendChild(b);
    }
  },

  updateStats() {
    const m = this.picks === 0 ? 1 : this.mult(this.picks, this.minesCount);
    document.getElementById("mines-mult").textContent = "×" + m.toFixed(2);
    document.getElementById("mines-win").textContent =
      this.state === "playing" ? (this.bet * m).toFixed(2) + " Ⓝ" : "0";
  },

  async start() {
    if (this.state === "playing") return this.cashout();
    const bet = UI.betValue("mines-bet");
    if (!Wallet.debit(bet)) return;
    this.bet = bet;
    this.minesCount = parseInt(document.getElementById("mines-count").value, 10);
    this.picks = 0;
    this.state = "playing";

    /* Placement provably fair des mines (tirages successifs sans remise). */
    this.mineSet = new Set();
    const free = Array.from({ length: this.SIZE }, (_, i) => i);
    const rolls = await Fair.rolls("mines", this.minesCount);
    for (const r of rolls) {
      const idx = Math.floor(r * free.length);
      this.mineSet.add(free.splice(idx, 1)[0]);
    }

    this.buildGrid();
    document.querySelectorAll("#mines-grid button").forEach(b => { b.disabled = false; });
    const btn = document.getElementById("mines-action");
    btn.textContent = "ENCAISSER";
    btn.classList.add("danger");
    const out = document.getElementById("mines-result");
    out.textContent = "Cliquez sur les cases 💎";
    out.className = "result-line";
    this.updateStats();
  },

  pick(i, cell) {
    if (this.state !== "playing" || cell.disabled) return;
    cell.disabled = true;
    if (this.mineSet.has(i)) {
      cell.textContent = "💣";
      cell.classList.add("bomb");
      return this.boom();
    }
    cell.textContent = "💎";
    cell.classList.add("gem");
    this.picks++;
    this.updateStats();
    if (this.picks === this.SIZE - this.minesCount) this.cashout(); // tout déminé
  },

  cashout() {
    if (this.state !== "playing" || this.picks === 0) {
      if (this.picks === 0) UI.toast("Révélez au moins une case avant d'encaisser", true);
      return;
    }
    const m = this.mult(this.picks, this.minesCount);
    const win = Math.round(this.bet * m * 100) / 100;
    Wallet.credit(win);
    const out = document.getElementById("mines-result");
    out.textContent = `Encaissé ×${m.toFixed(2)} → +${win.toFixed(2)} Ⓝ`;
    out.className = "result-line win";
    UI.addBet("💣 Mines", this.bet, m, win);
    this.reveal();
    this.end();
  },

  boom() {
    const out = document.getElementById("mines-result");
    out.textContent = "💥 BOUM ! Mise perdue";
    out.className = "result-line lose";
    UI.addBet("💣 Mines", this.bet, 0, 0);
    this.reveal();
    this.end();
  },

  reveal() {
    document.querySelectorAll("#mines-grid button").forEach(b => {
      const i = parseInt(b.dataset.idx, 10);
      if (!b.textContent) {
        b.textContent = this.mineSet.has(i) ? "💣" : "💎";
        b.classList.add("dim");
      }
      b.disabled = true;
    });
  },

  end() {
    this.state = "idle";
    this.picks = 0;
    const btn = document.getElementById("mines-action");
    btn.textContent = "COMMENCER";
    btn.classList.remove("danger");
    document.getElementById("mines-win").textContent = "0";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const sel = document.getElementById("mines-count");
  for (let i = 1; i <= 24; i++) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = i + (i === 1 ? " mine" : " mines");
    if (i === 3) o.selected = true;
    sel.appendChild(o);
  }
  Mines.buildGrid();
  document.getElementById("mines-action").addEventListener("click", () => Mines.start());
});
