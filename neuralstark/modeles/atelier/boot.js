import { initVitrine } from "../commun.js";

initVitrine({
  modele: "atelier",
  defaultPalette: "cuivre",
  revealSelectors: [
    ".split-main > *", ".scatter-list li", ".flow li", ".router-demo",
    ".band-title", ".band-head > *", ".facts li", ".case", ".compare",
    ".phase", ".price-note", ".faq details", ".final > *", ".cat-grid",
  ],
});
