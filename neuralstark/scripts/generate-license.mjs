// Outil VENDEUR — génération des clés de licence NeuralStark.
// ⚠️ La clé privée de signature (scripts/.keys/) ne doit JAMAIS être committée ni
// partagée : c'est elle qui permet de fabriquer des abonnements.
//
// Usage :
//   node scripts/generate-license.mjs --plan premium --months 12 --company "SwissPaints"
//   node scripts/generate-license.mjs --plan standard --days 30 --company "Client Test"
//
// Premier lancement : génère la paire de clés (privée → scripts/.keys/, publique →
// data/license-pub.json, committée avec l'app).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYS_DIR = join(__dirname, ".keys");
const PRIV_PATH = join(KEYS_DIR, "license-signing-key.json");
const PUB_PATH = join(__dirname, "..", "data", "license-pub.json");
const { subtle } = globalThis.crypto;

const b64url = (buf) => Buffer.from(buf).toString("base64url");

async function ensureKeys() {
  if (existsSync(PRIV_PATH) && existsSync(PUB_PATH)) {
    const priv = JSON.parse(readFileSync(PRIV_PATH, "utf8"));
    return subtle.importKey("jwk", priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  }
  console.log("🔑 Première utilisation : génération de la paire de clés de signature…");
  const pair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const privJwk = await subtle.exportKey("jwk", pair.privateKey);
  const pubJwk = await subtle.exportKey("jwk", pair.publicKey);
  mkdirSync(KEYS_DIR, { recursive: true });
  writeFileSync(PRIV_PATH, JSON.stringify(privJwk, null, 2));
  writeFileSync(PUB_PATH, JSON.stringify({ jwk: pubJwk }, null, 2));
  console.log(`   Clé PRIVÉE  → ${PRIV_PATH}  (gitignorée — à sauvegarder en lieu sûr !)`);
  console.log(`   Clé publique → ${PUB_PATH}  (committée avec l'app)`);
  return pair.privateKey;
}

export async function signLicense(privateKey, { plan, company, exp }) {
  const payload = { v: 1, plan, company, exp, iat: Date.now() };
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = await subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(payloadB64));
  return `NSK1-${payloadB64}.${b64url(sig)}`;
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const isMain = process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href;
if (isMain) {
  const plan = (arg("plan", "") || "").toLowerCase();
  if (!["standard", "medium", "premium"].includes(plan)) {
    console.error("Usage: node scripts/generate-license.mjs --plan standard|medium|premium [--months N | --days N] --company \"Nom\"");
    process.exit(1);
  }
  const company = arg("company", "Client");
  const months = Number(arg("months", 0));
  const days = Number(arg("days", 0));
  const ms = (months * 30 + days || 30) * 24 * 3600 * 1000;
  const exp = Date.now() + ms;

  const priv = await ensureKeys();
  const key = await signLicense(priv, { plan, company, exp });
  console.log("\n════════ CLÉ DE LICENCE NEURALSTARK ════════");
  console.log(`Client     : ${company}`);
  console.log(`Plan       : ${plan.toUpperCase()}`);
  console.log(`Expire le  : ${new Date(exp).toLocaleDateString("fr-CH")}`);
  console.log("─────────────────────────────────────────────");
  console.log(key);
  console.log("═════════════════════════════════════════════\n");
}
