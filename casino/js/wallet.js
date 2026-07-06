/* Portefeuille en crédits virtuels Ⓝ — persistant en localStorage. */
const Wallet = {
  balance: 0,

  init() {
    const saved = localStorage.getItem("nova_balance");
    this.balance = saved === null ? 1000 : parseFloat(saved);
    this.render();
  },

  render() {
    document.getElementById("balance").textContent =
      this.balance.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  },

  save() {
    localStorage.setItem("nova_balance", String(this.balance));
    this.render();
  },

  /* Débite la mise. Retourne false (avec toast) si fonds insuffisants. */
  debit(amount) {
    if (!(amount > 0)) { UI.toast("Mise invalide", true); return false; }
    if (amount > this.balance) { UI.toast("Solde insuffisant — rechargez avec + 1 000", true); return false; }
    this.balance = Math.round((this.balance - amount) * 100) / 100;
    this.save();
    return true;
  },

  credit(amount) {
    this.balance = Math.round((this.balance + amount) * 100) / 100;
    this.save();
  },

  faucet() {
    this.credit(1000);
    UI.toast("+ 1 000 Ⓝ crédités (virtuels) 🎁");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Wallet.init();
  document.getElementById("faucet").addEventListener("click", () => Wallet.faucet());
});
