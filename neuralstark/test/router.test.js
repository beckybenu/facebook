import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AgentRouter } from "../server/router.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS = JSON.parse(readFileSync(join(__dirname, "..", "public", "data", "agents.json"), "utf8")).agents;

test("le routeur exclut le Cerveau Central de ses cibles", () => {
  const router = new AgentRouter(AGENTS);
  const ids = router.route("gérer la trésorerie", 130).map((r) => r.agent.id);
  assert.ok(!ids.includes("cerveau-central"));
});

test("routage : demande de devis → agent lié aux devis en tête", () => {
  const router = new AgentRouter(AGENTS);
  const top = router.route("ce devis est-il rentable avant de l'envoyer ?", 3);
  assert.ok(top.length >= 1);
  // Le meilleur candidat doit concerner le devis / la rentabilité.
  assert.match(top[0].agent.name.toLowerCase(), /devis|prix|rentab|financ/);
});

test("routage : réseaux sociaux → agent marketing", () => {
  const router = new AgentRouter(AGENTS);
  const top = router.route("publie un post sur Instagram et LinkedIn", 3);
  assert.ok(top.length >= 1);
  assert.equal(top[0].agent.category, "marketing");
});

test("routage : requête vide → aucune cible", () => {
  const router = new AgentRouter(AGENTS);
  assert.deepEqual(router.route("   "), []);
});

test("routage : les scores sont triés par ordre décroissant", () => {
  const router = new AgentRouter(AGENTS);
  const r = router.route("recruter un nouveau collaborateur et l'intégrer", 5);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});
