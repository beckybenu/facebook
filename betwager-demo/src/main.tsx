import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { StoreProvider } from "./store";
import "./index.css";

// HashRouter : l'app est servie depuis un sous-dossier GitHub Pages
// (beckybenu.github.io/facebook/betwager/) sans réécriture serveur —
// le routage par hash garantit que les liens profonds fonctionnent.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>
);
