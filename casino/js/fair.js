/* Système "provably fair" : HMAC-SHA256(serverSeed, clientSeed:nonce)
   → 8 premiers hex / 2^32 → nombre dans [0,1). */
const Fair = {
  serverSeed: "",
  serverSeedHash: "",
  clientSeed: "",
  nonce: 0,
  log: [],

  randHex(len) {
    const bytes = new Uint8Array(len / 2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  },

  async sha256Hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
  },

  async hmacHex(key, msg) {
    const k = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(key),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, "0")).join("");
  },

  async init() {
    const saved = JSON.parse(localStorage.getItem("nova_fair") || "null");
    if (saved) {
      Object.assign(this, saved);
    } else {
      this.serverSeed = this.randHex(64);
      this.clientSeed = this.randHex(16);
      this.nonce = 0;
    }
    this.serverSeedHash = await this.sha256Hex(this.serverSeed);
    this.save();
    this.render();
  },

  save() {
    localStorage.setItem("nova_fair", JSON.stringify({
      serverSeed: this.serverSeed, clientSeed: this.clientSeed, nonce: this.nonce
    }));
  },

  /* Un tirage uniforme dans [0,1). */
  async roll(game) {
    const nonce = this.nonce++;
    const digest = await this.hmacHex(this.serverSeed, `${this.clientSeed}:${nonce}`);
    const value = parseInt(digest.slice(0, 8), 16) / 0x100000000;
    this.log.unshift({ game, nonce, value });
    if (this.log.length > 40) this.log.pop();
    this.save();
    this.render();
    return value;
  },

  /* n tirages successifs. */
  async rolls(game, n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(await this.roll(game));
    return out;
  },

  async rotate() {
    const old = this.serverSeed;
    this.serverSeed = this.randHex(64);
    this.serverSeedHash = await this.sha256Hex(this.serverSeed);
    this.nonce = 0;
    this.save();
    this.render();
    document.getElementById("fair-revealed").value = old;
  },

  render() {
    const $ = id => document.getElementById(id);
    if (!$("fair-hash")) return;
    $("fair-hash").value = this.serverSeedHash;
    $("fair-client").value = this.clientSeed;
    $("fair-nonce").value = this.nonce;
    $("fair-log").innerHTML = this.log.map((r, i) =>
      `<tr><td>${i + 1}</td><td>${r.game}</td><td>${r.nonce}</td><td>${r.value.toFixed(8)}</td></tr>`
    ).join("");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Fair.init();
  document.getElementById("fair-rotate").addEventListener("click", () => Fair.rotate());
  document.getElementById("fair-client").addEventListener("change", e => {
    Fair.clientSeed = e.target.value.trim() || Fair.randHex(16);
    Fair.nonce = 0;
    Fair.save();
    Fair.render();
  });
});
