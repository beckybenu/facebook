import { test } from "node:test";
import assert from "node:assert/strict";
import { RagStore } from "../server/rag.js";

// Store isolé (ne charge pas le seed disque puisqu'on ajoute nos propres docs).
function freshStore() {
  const s = new RagStore();
  // On repart d'une base propre pour un test déterministe.
  s.documents = [];
  s._reindex();
  return s;
}

test("ingestion : ajoute un document et l'indexe", () => {
  const s = freshStore();
  const res = s.addDocument("facade.txt", "Le tarif façade est de 45 CHF par mètre carré.");
  assert.equal(res.name, "facade.txt");
  assert.ok(res.chunks >= 1);
  assert.equal(s.stats().documents, 1);
  assert.ok(s.stats().chunks >= 1);
});

test("recherche : retrouve le bon document par pertinence", () => {
  const s = freshStore();
  s.addDocument("facade.txt", "Le tarif façade extérieure est de 45 CHF par mètre carré en 2026.");
  s.addDocument("rh.txt", "La procédure d'onboarding dure deux semaines pour un nouveau peintre.");
  const hits = s.search("Quel est le prix d'une façade ?", 3);
  assert.ok(hits.length >= 1);
  assert.equal(hits[0].source, "facade.txt");
  assert.ok(hits[0].score > 0);
});

test("recherche : base vide renvoie un tableau vide", () => {
  const s = freshStore();
  assert.deepEqual(s.search("quoi que ce soit"), []);
});

test("suppression : retire le document de l'index", () => {
  const s = freshStore();
  const { id } = s.addDocument("temp.txt", "Contenu temporaire à supprimer ensuite.");
  assert.equal(s.stats().documents, 1);
  assert.equal(s.removeDocument(id), true);
  assert.equal(s.stats().documents, 0);
  assert.equal(s.removeDocument("inexistant"), false);
});

test("chunking : un long document produit plusieurs extraits", () => {
  const s = freshStore();
  const para = "Ceci est un paragraphe de test assez long pour le découpage. ".repeat(20);
  const doc = "# Titre\n\n" + Array.from({ length: 6 }, () => para).join("\n\n");
  const res = s.addDocument("long.md", doc);
  assert.ok(res.chunks >= 2, `attendu >= 2 chunks, obtenu ${res.chunks}`);
});
