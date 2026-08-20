import { initVitrine } from "../commun.js";

// Fond clair : fusion alpha au lieu d'additive, liaisons renforcées pour rester
// lisibles sur le papier, et cadrage resserré parce que le canevas est encadré.
initVitrine({
  modele: "studio",
  defaultPalette: "rouge",
  brain: { additive: false, distScale: 0.86, lineBoost: 2.6, offsetScale: 0.25 },
});
