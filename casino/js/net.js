/* Connexion temps réel au serveur multijoueur NovaSpin (SSE + fetch).
   Hors connexion, tous les jeux restent jouables en mode solo. */
const Net = {
  url: null,
  es: null,
  online: false,
  offset: 0,          // horloge serveur - horloge client
  players: 0,
  pseudo: "",

  init() {
    this.pseudo = localStorage.getItem("nova_pseudo") ||
      "Joueur" + Math.floor(Math.random() * 9000 + 1000);
    localStorage.setItem("nova_pseudo", this.pseudo);

    const param = new URLSearchParams(location.search).get("server");
    if (param) localStorage.setItem("nova_server", param);
    let url = localStorage.getItem("nova_server") || "";
    if (!url && (location.hostname === "localhost" || location.hostname === "127.0.0.1"))
      url = "http://" + location.hostname + ":8902";

    document.getElementById("net-pseudo").value = this.pseudo;
    document.getElementById("net-url").value = url;
    if (url) this.connect(url); else this.renderStatus();
  },

  connect(url) {
    this.disconnect(true);
    this.url = url.replace(/\/+$/, "");
    try {
      this.es = new EventSource(this.url + "/events");
    } catch {
      return this.renderStatus("URL invalide");
    }

    this.es.addEventListener("snapshot", e => {
      const s = JSON.parse(e.data);
      this.online = true;
      this.offset = s.now - Date.now();
      this.players = s.players;
      localStorage.setItem("nova_server", this.url);
      this.renderStatus();
      this.renderLeaderboard(s.leaderboard);
      this.renderChat(s.chat);
      document.getElementById("crash-seedhash").textContent =
        "Hash graine serveur : " + s.seedHash.slice(0, 20) + "…";
      Crash.netSnapshot(s);
      UI.toast("🌐 Connecté au serveur — rounds Crash partagés !");
    });
    this.es.addEventListener("phase", e => Crash.netPhase(JSON.parse(e.data)));
    this.es.addEventListener("bet", e => Crash.netBet(JSON.parse(e.data)));
    this.es.addEventListener("cashout", e => Crash.netCashout(JSON.parse(e.data)));
    this.es.addEventListener("chat", e => this.addChatMsg(JSON.parse(e.data)));
    this.es.addEventListener("leaderboard", e => this.renderLeaderboard(JSON.parse(e.data).leaderboard));
    this.es.addEventListener("players", e => {
      this.players = JSON.parse(e.data).count;
      this.renderStatus();
    });
    this.es.onerror = () => {
      const was = this.online;
      this.online = false;
      this.renderStatus(was ? "reconnexion…" : "serveur injoignable");
      if (was) Crash.netOffline();
    };
  },

  disconnect(silent) {
    if (this.es) { this.es.close(); this.es = null; }
    const was = this.online;
    this.online = false;
    if (!silent) {
      localStorage.removeItem("nova_server");
      this.renderStatus();
      if (was) Crash.netOffline();
    }
  },

  async post(path, data) {
    try {
      const res = await fetch(this.url + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: this.pseudo, ...data })
      });
      return await res.json();
    } catch {
      return { ok: false, error: "Serveur injoignable" };
    }
  },

  renderStatus(err) {
    const top = document.getElementById("net-status");
    const state = document.getElementById("net-state");
    const btn = document.getElementById("net-connect");
    if (this.online) {
      top.textContent = `🟢 En ligne · ${this.players} joueur${this.players > 1 ? "s" : ""}`;
      top.className = "netstatus on";
      state.textContent = `Connecté à ${this.url} — ${this.players} joueur(s) sur les rounds Crash partagés.`;
      btn.textContent = "Se déconnecter";
    } else {
      top.textContent = "🔴 Hors ligne" + (err ? " · " + err : "");
      top.className = "netstatus";
      state.textContent = err ? "⚠️ " + err + " — les jeux restent jouables en solo."
        : "Non connecté — les jeux fonctionnent en mode solo.";
      btn.textContent = "Se connecter";
    }
  },

  renderLeaderboard(rows) {
    document.getElementById("leaderboard").innerHTML = (rows || []).map((r, i) => `
      <tr><td>${["🥇", "🥈", "🥉"][i] || i + 1}</td><td>${this.esc(r.pseudo)}</td>
      <td>×${r.mult.toFixed(2)}</td><td class="win">+${r.win.toFixed(2)} Ⓝ</td></tr>`).join("")
      || `<tr><td colspan="4" style="color:var(--muted)">Aucun gain pour l'instant</td></tr>`;
  },

  renderChat(msgs) {
    document.getElementById("chat-log").innerHTML = "";
    (msgs || []).forEach(m => this.addChatMsg(m));
  },

  addChatMsg(m) {
    const log = document.getElementById("chat-log");
    const div = document.createElement("div");
    div.className = "chat-msg";
    div.innerHTML = `<b>${this.esc(m.pseudo)}</b> ${this.esc(m.text)}`;
    log.appendChild(div);
    while (log.children.length > 30) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  },

  esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  sendChat() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    if (!this.online) return UI.toast("Connectez-vous à un serveur pour discuter", true);
    input.value = "";
    this.post("/api/chat", { text });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Net.init();

  document.getElementById("net-connect").addEventListener("click", () => {
    if (Net.online) return Net.disconnect(false);
    const url = document.getElementById("net-url").value.trim();
    if (!url) return UI.toast("Indiquez l'URL du serveur (ex. http://localhost:8902)", true);
    Net.renderStatus("connexion…");
    Net.connect(url);
  });

  document.getElementById("net-pseudo").addEventListener("change", e => {
    Net.pseudo = e.target.value.trim().slice(0, 24) || Net.pseudo;
    e.target.value = Net.pseudo;
    localStorage.setItem("nova_pseudo", Net.pseudo);
  });

  document.getElementById("chat-send").addEventListener("click", () => Net.sendChat());
  document.getElementById("chat-input").addEventListener("keydown", e => {
    if (e.key === "Enter") Net.sendChat();
  });
});
