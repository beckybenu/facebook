// Page d'accueil : modèle Cinéma, servi depuis la racine du dossier.
// La teinte part du violet et arrive au bleu au fil de la lecture.
import { initVitrine } from "./modeles/commun.js";
import { initTeinte } from "./teinte.js";

const vitrine = initVitrine({
  modele: "accueil",
  dataUrl: "data/agents.json",
  brain: { distScale: 0.92, offsetScale: 0.8 },
});

initTeinte(vitrine);
