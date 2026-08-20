import { initVitrine } from "../commun.js";

// Plans plein écran : la scène est plus proche et mieux centrée que dans le
// modèle Atelier, où elle devait céder la place à une colonne de texte.
initVitrine({
  modele: "cinema",
  defaultPalette: "glacier",
  brain: { distScale: 0.92, offsetScale: 0.8 },
});
