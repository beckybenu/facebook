// Licences NeuralStark — vérification côté app (WebCrypto, ECDSA P-256).
// Une clé = `NSK1-<payload b64url>.<signature b64url>` signée par le vendeur.
// Sans clé valide (signature + date d'expiration), l'application se verrouille.

const LS_LICENSE = "neuralstark:license:v1";

export const PLANS = {
  standard: {
    label: "Standard", price: "99 CHF", period: "/mois",
    tagline: "L'assistant IA de votre entreprise",
    features: [
      "Assistant IA unique (les spécialistes de votre métier en coulisses)",
      "Base de connaissances : l'IA apprend de vos documents",
      "1 domaine d'activité au choix",
      "Réponses avec sources citées",
    ],
    caps: { cockpit: false, automations: false, customAutomations: false, allSectors: false, llm: false },
  },
  medium: {
    label: "Médium", price: "199 CHF", period: "/mois", highlight: true,
    tagline: "L'IA qui pilote votre activité",
    features: [
      "Tout le plan Standard",
      "📊 Cockpit : indicateurs, briefing du jour, plan d'actions",
      "⚡ Automations : vos agents travaillent tout seuls",
      "Journal d'activité de tout ce que l'IA a fait",
    ],
    caps: { cockpit: true, automations: true, customAutomations: false, allSectors: false, llm: false },
  },
  premium: {
    label: "Premium", price: "399 CHF", period: "/mois",
    tagline: "Le cerveau d'entreprise complet",
    features: [
      "Tout le plan Médium",
      "Automations personnalisées illimitées (sans code)",
      "Tous les métiers + accès aux 130 agents",
      "Connexion à votre propre modèle IA (OpenAI, DeepSeek…)",
    ],
    caps: { cockpit: true, automations: true, customAutomations: true, allSectors: true, llm: true },
  },
};

let PUB_KEY = null;   // CryptoKey
let CURRENT = null;   // { plan, company, exp } quand la licence est valide

function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Charge la clé publique embarquée (committée avec l'app).
export async function initLicense(jwk = null) {
  if (!jwk) {
    const res = await fetch("data/license-pub.json");
    jwk = (await res.json()).jwk;
  }
  PUB_KEY = await crypto.subtle.importKey(
    "jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
}

// Vérifie une clé : signature ECDSA + expiration. Pure (utilisable en test).
export async function verifyLicenseKey(keyStr, now = Date.now()) {
  try {
    if (!PUB_KEY) return { ok: false, reason: "init" };
    const raw = String(keyStr || "").trim();
    if (!raw.startsWith("NSK1-")) return { ok: false, reason: "format" };
    const [payloadB64, sigB64] = raw.slice(5).split(".");
    if (!payloadB64 || !sigB64) return { ok: false, reason: "format" };
    const valid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" }, PUB_KEY,
      b64urlToBytes(sigB64), new TextEncoder().encode(payloadB64));
    if (!valid) return { ok: false, reason: "signature" };
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
    if (!PLANS[payload.plan]) return { ok: false, reason: "plan" };
    if (!payload.exp || now > payload.exp) return { ok: false, reason: "expired", payload };
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "format" };
  }
}

export function getStoredKey() { return localStorage.getItem(LS_LICENSE) || ""; }
export function storeKey(key) { localStorage.setItem(LS_LICENSE, key.trim()); }
export function clearKey() { localStorage.removeItem(LS_LICENSE); }

// Vérifie la licence stockée ; renvoie le payload si valide, sinon null.
export async function checkStoredLicense() {
  const key = getStoredKey();
  if (!key) return { license: null, reason: "none" };
  const res = await verifyLicenseKey(key);
  if (!res.ok) return { license: null, reason: res.reason, payload: res.payload };
  CURRENT = res.payload;
  return { license: res.payload, reason: "ok" };
}

export function license() { return CURRENT; }
export function plan() { return CURRENT ? PLANS[CURRENT.plan] : null; }
// Vérifie une capacité du plan actif : can("cockpit"), can("llm")…
export function can(cap) { return !!plan()?.caps[cap]; }
