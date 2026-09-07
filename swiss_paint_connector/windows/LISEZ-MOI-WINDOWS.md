# Connecteur SwissPaints — Guide Windows (pas à pas)

Objectif : permettre à l'IA de **lire le contenu** de tes fichiers WD.
Tu fais ça **une seule fois** sur **un** de tes 3 PC (celui qui reste allumé).

---

## Étape 1 — Installer Node.js (2 min)
1. Va sur **https://nodejs.org**
2. Télécharge la version **LTS** (bouton de gauche), installe-la (Suivant → Suivant → Terminer).

## Étape 2 — Récupérer le dossier du connecteur
Le dossier **`swiss_paint_connector`** est dans ton dépôt GitHub `beckybenu/facebook`.
- Le plus simple : sur GitHub, bouton vert **Code → Download ZIP**, puis **extrais** le ZIP.
- Repère le sous-dossier **`swiss_paint_connector`** (celui qui contient un dossier `windows`).

## Étape 3 — Trouver le chemin de ton WD
1. Ouvre l'**Explorateur de fichiers** → **Réseau** → double-clique sur ton **WDMYCLOUD**.
2. Ouvre le dossier qui contient tes fichiers d'entreprise (souvent **Public**, ou le nom de ton partage).
3. Clique dans la **barre d'adresse** en haut : tu vois un chemin comme
   `\\WDMYCLOUD\Public`. **Note-le** (c'est ton `WD_ROOT`).

## Étape 4 — Régler le fichier de démarrage
1. Dans `swiss_paint_connector\windows`, **clic droit** sur **`demarrer-connecteur.bat`** → **Modifier** (avec le Bloc-notes).
2. Remplace les 2 valeurs :
   - `set WD_ROOT=\\WDMYCLOUD\Public` → mets **ton** chemin de l'étape 3.
   - `set CONNECTOR_TOKEN=...` → invente une **longue phrase secrète sans espaces**
     (ex : `SwissPaints-2024-motdepasse-tres-long-841`). **Retiens-la**, tu la colleras dans l'app.
3. **Enregistre** et ferme.

## Étape 5 — Démarrer le connecteur
- **Double-clique** sur **`demarrer-connecteur.bat`**.
- La 1re fois, il installe des composants (1–2 min). Ensuite il affiche
  « Connecteur DEMARRE ». **Laisse cette fenêtre ouverte.**

> ✅ Test rapide sur ce PC : ouvre `http://localhost:8787/api/health` dans le navigateur →
> tu dois voir `{"ok":true,...}`.

## Étape 6 — Rendre l'accès disponible depuis ton téléphone (HTTPS)
1. Installe **cloudflared** : ouvre **PowerShell** et tape
   `winget install --id Cloudflare.cloudflared` (Entrée).
2. **Double-clique** sur **`ouvrir-acces-https.bat`**.
3. Repère la ligne **`https://xxxx-xxxx.trycloudflare.com`** → **copie cette adresse**.
   **Laisse cette fenêtre ouverte** aussi.

## Étape 7 — Connecter l'application
Dans SwissPaints : **Documents → 🤖 Connecteur IA** →
- **Adresse** : colle `https://xxxx-xxxx.trycloudflare.com`
- **Jeton** : ta phrase secrète de l'étape 4
- **Tester et enregistrer**.

C'est fini ! Demande à l'assistant ✨ :
« **Résume le contrat de la Villa Cologny** » ou « **que dit le fichier de suivi des chantiers ?** »

---

## Bon à savoir
- **Les 2 fenêtres noires doivent rester ouvertes** quand tu veux que l'IA lise les fichiers.
  Si tu éteins le PC, l'IA n'a plus accès (c'est normal).
- **L'adresse `trycloudflare.com` change à chaque redémarrage** du fichier HTTPS.
  Si tu relances, recopie la nouvelle adresse dans l'app. *(Pour une adresse fixe, on peut
  configurer un tunnel Cloudflare nommé ou Tailscale — demande-moi.)*
- **Depuis CE PC uniquement**, tu peux même sauter l'étape 6 et mettre `http://localhost:8787`
  dans l'app (le téléphone, lui, a besoin de l'adresse HTTPS).
- **Sécurité** : lecture seule, jeton obligatoire, aucun fichier modifié. Ne partage jamais ton jeton.

Bloqué à une étape ? Dis-moi le numéro de l'étape et ce que tu vois, je te débloque.
