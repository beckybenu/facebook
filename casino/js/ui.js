/* Navigation, toasts, historique des paris et flux simulé du lobby. */
const UI = {
  toastTimer: null,

  toast(msg, bad = false) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = bad ? "show bad" : "show";
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { el.className = ""; }, 2600);
  },

  nav(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-" + name).classList.add("active");
    document.querySelectorAll(".mainnav button").forEach(b =>
      b.classList.toggle("active", b.dataset.nav === name));
    window.scrollTo({ top: 0 });
  },

  /* Historique global des paris du joueur. */
  history: [],
  addBet(game, bet, mult, payout) {
    this.history.unshift({ game, bet, mult, payout });
    if (this.history.length > 25) this.history.pop();
    document.getElementById("history").innerHTML = this.history.map(h => `
      <tr>
        <td>${h.game}</td>
        <td>${h.bet.toFixed(2)} Ⓝ</td>
        <td>×${h.mult.toFixed(2)}</td>
        <td class="${h.payout > 0 ? "win" : "lose"}">${h.payout > 0 ? "+" + h.payout.toFixed(2) : "-" + h.bet.toFixed(2)} Ⓝ</td>
      </tr>`).join("");
  },

  betValue(id) {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? 0 : Math.max(0, Math.round(v * 100) / 100);
  },

  /* Flux de gains simulé sur le lobby. */
  feedNames: ["Lucas", "Emma", "Noah", "Léa", "Hugo", "Chloé", "Nathan", "Manon", "Théo", "Camille", "Enzo", "Sarah"],
  feedGames: ["🎰 Slots", "🚀 Crash", "🎲 Dice", "💣 Mines", "🔻 Plinko"],
  startFeed() {
    const body = document.getElementById("livefeed");
    const push = () => {
      const name = this.feedNames[Math.floor(Math.random() * this.feedNames.length)];
      const game = this.feedGames[Math.floor(Math.random() * this.feedGames.length)];
      const bet = Math.round((Math.random() * 200 + 5) * 100) / 100;
      const mult = Math.round((Math.random() * Math.random() * 30 + 1.1) * 100) / 100;
      const row = document.createElement("tr");
      row.innerHTML = `<td>${name}***</td><td>${game}</td><td>${bet.toFixed(2)} Ⓝ</td>
        <td>×${mult.toFixed(2)}</td><td class="win">+${(bet * mult).toFixed(2)} Ⓝ</td>`;
      body.prepend(row);
      while (body.children.length > 8) body.lastChild.remove();
    };
    for (let i = 0; i < 6; i++) push();
    setInterval(push, 3500);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-nav]").forEach(el =>
    el.addEventListener("click", () => UI.nav(el.dataset.nav)));

  /* Boutons ½ / ×2 sur toutes les mises. */
  document.querySelectorAll("[data-betop]").forEach(btn =>
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.for);
      let v = parseFloat(input.value) || 1;
      v = btn.dataset.betop === "half" ? Math.max(1, v / 2) : v * 2;
      input.value = Math.round(v * 100) / 100;
    }));

  UI.startFeed();
});
