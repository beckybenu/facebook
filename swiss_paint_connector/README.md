# SwissPaints — Connecteur WD (lecture des fichiers par l'IA)

Petit programme qui tourne **chez toi**, sur le même réseau que ton WD My Cloud.
Il donne à l'assistant IA de SwissPaints un accès **en lecture seule** au contenu
de tes fichiers (PDF, Word, Excel, texte) — pour que l'IA puisse **résumer,
chercher et répondre** à partir de leur contenu.

- **Sécurisé** : jeton d'accès obligatoire, chemins confinés au dossier partagé, aucune écriture.
- **Sans ouvrir de port** : exposé en HTTPS par un « Cloudflare Tunnel » (gratuit).
- **Formats lus** : `.pdf`, `.docx`, `.xlsx/.xls`, `.txt`, `.csv`, `.md`, `.json`, `.html`.

---

## Ce qu'il te faut
- Un **petit appareil toujours allumé** sur ton réseau : Raspberry Pi, mini-PC, ou un vieux PC/Mac.
- Ton **WD My Cloud** accessible sur le même réseau (partage SMB activé — c'est le cas par défaut).

---

## 1. Monter le partage WD sur l'appareil
Le connecteur lit un **dossier local** qui pointe vers ton WD.

**Linux / Raspberry Pi** (partage SMB « Public » du WD, adapte l'IP) :
```bash
sudo mkdir -p /mnt/wd
sudo mount -t cifs //192.168.1.50/Public /mnt/wd -o guest,ro,iocharset=utf8
# (avec identifiants : -o username=TON_USER,password=TON_MDP,ro)
```
**Windows** : connecte le lecteur réseau `\\WDMYCLOUD\Public` (ex : lecteur `W:`), puis utilise `WD_ROOT=W:\`.
**macOS** : Finder → Aller → Se connecter au serveur → `smb://WDMYCLOUD/Public`, puis `WD_ROOT=/Volumes/Public`.

> `ro` = lecture seule (recommandé). Le connecteur n'écrit jamais de toute façon.

---

## 2. Installer et lancer le connecteur
Installe **Node.js 18+** (https://nodejs.org), puis :
```bash
cd swiss_paint_connector
npm install
CONNECTOR_TOKEN="ta-longue-chaine-secrete" WD_ROOT="/mnt/wd" npm start
```
Vérifie : ouvre `http://localhost:8787/api/health` → `{"ok":true,...}`.

> Choisis un `CONNECTOR_TOKEN` long et secret : c'est lui qui protège l'accès à tes fichiers.
> Tu peux aussi copier `.env.example` en `.env` et remplir les valeurs.

---

## 3. Rendre le connecteur accessible en HTTPS (Cloudflare Tunnel)
L'app (github.io) est en HTTPS et ne peut appeler qu'un serveur HTTPS. `cloudflared`
crée un tunnel HTTPS vers ton connecteur, **sans ouvrir de port sur ta box**.

Installe `cloudflared` (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/),
puis, connecteur lancé :
```bash
cloudflared tunnel --url http://localhost:8787
```
Il affiche une URL du type `https://xxxx-xxxx.trycloudflare.com`. **Copie-la.**

> Cette URL « rapide » change à chaque redémarrage. Pour une URL **fixe**, crée un
> *tunnel nommé* Cloudflare (compte gratuit + un domaine) — voir la doc Cloudflare.
> Alternative : **Tailscale Funnel** donne aussi une URL HTTPS stable.

---

## 4. Connecter l'app
Dans SwissPaints : **Documents → « Connecteur IA (lecture des fichiers) »** →
colle l'**URL** (`https://….trycloudflare.com`) et le **jeton** (`CONNECTOR_TOKEN`)
→ **Tester** puis **Enregistrer**.

Ensuite, depuis l'assistant ✨ (n'importe quel écran), tu peux demander :
- « **Résume le contrat de la Villa Cologny** »
- « **Cherche dans les fichiers ce qu'on a facturé à Meyrin** »
- « **Ouvre le dossier Chantiers** » / « **liste les fichiers de Contrats** »

---

## Points d'API (référence)
| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `/api/health` | État (sans jeton) |
| GET | `/api/list?path=...` | Lister un dossier |
| GET | `/api/search?q=...` | Rechercher un fichier par nom |
| GET | `/api/read?path=...` | Extraire le texte d'un fichier |

Tous (sauf `/api/health`) exigent l'en-tête `Authorization: Bearer <CONNECTOR_TOKEN>`.

## Sécurité
- **Lecture seule**, chemins strictement confinés au `WD_ROOT` (anti-traversée).
- Jeton obligatoire en production. Garde l'appareil à jour.
- Ne partage jamais ton `CONNECTOR_TOKEN`. Change-le en cas de doute.
