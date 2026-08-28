// Page d'accueil : modèle Cinéma en violet, servi depuis la racine du dossier.
import { initVitrine } from "./modeles/commun.js";

initVitrine({
  modele: "accueil",
  dataUrl: "data/agents.json",
  brain: { distScale: 0.92, offsetScale: 0.8 },
});
