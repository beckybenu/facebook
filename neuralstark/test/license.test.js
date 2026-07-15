import { test, before } from "node:test";
import assert from "node:assert/strict";
import { initLicense, verifyLicenseKey, PLANS } from "../lib/license.js";
import { signLicense } from "../scripts/generate-license.mjs";

// Paire de clés éphémère pour le test (le vrai couple vendeur n'est pas requis).
let priv;
before(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  priv = pair.privateKey;
  const pubJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  // localStorage factice requis par le module en environnement Node.
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  await initLicense(pubJwk);
});

const in30days = () => Date.now() + 30 * 24 * 3600 * 1000;

test("clé valide : signature + plan + expiration acceptés", async () => {
  const key = await signLicense(priv, { plan: "premium", company: "Test SA", exp: in30days() });
  const res = await verifyLicenseKey(key);
  assert.equal(res.ok, true);
  assert.equal(res.payload.plan, "premium");
  assert.equal(res.payload.company, "Test SA");
});

test("clé expirée : refusée avec raison 'expired'", async () => {
  const key = await signLicense(priv, { plan: "medium", company: "Test SA", exp: Date.now() - 1000 });
  const res = await verifyLicenseKey(key);
  assert.equal(res.ok, false);
  assert.equal(res.reason, "expired");
});

test("clé altérée : signature refusée", async () => {
  const key = await signLicense(priv, { plan: "standard", company: "Test SA", exp: in30days() });
  // On modifie le payload (standard → premium) sans re-signer.
  const [head, sig] = key.slice(5).split(".");
  const payload = JSON.parse(Buffer.from(head, "base64url").toString());
  payload.plan = "premium";
  const forged = "NSK1-" + Buffer.from(JSON.stringify(payload)).toString("base64url") + "." + sig;
  const res = await verifyLicenseKey(forged);
  assert.equal(res.ok, false);
  assert.equal(res.reason, "signature");
});

test("formats invalides refusés", async () => {
  for (const bad of ["", "abc", "NSK1-", "NSK1-xxx", "NSK2-a.b"]) {
    const res = await verifyLicenseKey(bad);
    assert.equal(res.ok, false, `devrait refuser: ${bad}`);
  }
});

test("les 3 plans existent avec leurs capacités", () => {
  assert.deepEqual(Object.keys(PLANS), ["standard", "medium", "premium"]);
  assert.equal(PLANS.standard.caps.cockpit, false);
  assert.equal(PLANS.medium.caps.cockpit, true);
  assert.equal(PLANS.medium.caps.customAutomations, false);
  assert.equal(PLANS.premium.caps.llm, true);
});
