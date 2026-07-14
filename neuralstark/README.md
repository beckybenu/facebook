<div align="center">

# 🧠 NeuralStark

### Le cerveau IA de votre entreprise — 130 agents spécialisés + RAG local

*« Neural power. Stark reality. »*

</div>

NeuralStark est un assistant IA privé, façon « ChatGPT dédié à votre organisation »,
nourri par **vos propres documents**. Il expose **130 agents IA spécialisés**
(finance, RH, marketing, opérations, vente, stratégie, IA avancée, vision,
connaissance, tableaux de bord) branchés sur un moteur **RAG** local qui apprend de
vos fichiers.

## ✨ Fonctionnalités

- **130 agents** catégorisés, chacun avec son rôle et son prompt système.
- **🧩 Packs métiers** : choisissez votre **domaine d'activité** (peinture, avocats,
  médecin, commerce, restauration… 19 métiers) et l'app active automatiquement la
  sélection d'agents adaptée — l'orchestrateur ne route plus que dans ce pack.
  Voir [`docs/SECTEURS.md`](docs/SECTEURS.md).
- **⚡ Neural Automation Engine (façon n8n)** : les agents travaillent **en
  autonomie**. Des workflows « déclencheur → chaîne d'agents » s'exécutent seuls :
  briefing quotidien (KPI → alerte trésorerie), veille documentaire à chaque nouveau
  document, relances commerciales et présence réseaux sociaux hebdomadaires, plus des
  workflows par métier (préparation des chantiers, synthèse de dossiers, surveillance
  des stocks…). Interrupteurs on/off, exécution manuelle, **journal d'activité** de
  tout ce que les agents ont fait, et **créateur d'automations personnalisées**
  (nom + déclencheur + agent + instruction). Le moteur vérifie les échéances toutes
  les 30 s et **rattrape les exécutions manquées** à l'ouverture.
- **📊 Cockpit d'entreprise** : l'IA ne fait pas que répondre, elle **gère**. Le
  cockpit affiche les indicateurs extraits de vos documents (volume d'affaires
  détecté, documents surveillés), un **briefing du jour** généré par l'assistant et
  un **plan d'actions** adapté au métier — chaque action se **délègue à l'IA en un
  clic** (elle bascule dans le chat, mobilise le bon spécialiste et produit le
  livrable). Statuts persistés (à faire / en cours / fait).
- **🧠 Un seul interlocuteur** : le client parle uniquement à l'**assistant NeuralStark**
  (Neural Cerveau Central). La conversation démarre directement — aucun agent à chercher.
  L'assistant **route** automatiquement chaque demande vers le ou les spécialistes
  pertinents, délègue, et **synthétise** la réponse (les agents mobilisés sont affichés).
  La liste latérale n'est qu'une vitrine de l'équipe.
- **Chat multi-agents** avec rendu Markdown et affichage des **sources**.
- **Moteur RAG** local : ingestion, chunking, index TF-IDF, recherche par similarité
  cosinus, citations. **Aucune dépendance externe.**
- **Base de connaissances** : ajout/suppression de documents, import de fichiers,
  persistance (localStorage côté navigateur).
- **100 % navigateur** : RAG, routeur et LLM tournent côté client → **déployable en
  site statique** (GitHub Pages), aucun backend requis.
- **LLM au choix** : fonctionne **hors-ligne** (mode démo extractif) ou, via le bouton
  **⚙️ LLM**, avec n'importe quelle API compatible OpenAI (OpenAI, DeepSeek, Groq,
  Ollama, LM Studio, vLLM…) — la clé reste stockée localement dans le navigateur.

## 🚀 Démarrage rapide

Comme c'est un site **statique**, il suffit de servir le dossier avec n'importe quel
serveur HTTP :

```bash
cd neuralstark
python3 -m http.server 5178      # → http://localhost:5178
# ou : npx serve .   ·   ou : npm start  (serveur Node natif optionnel, + API REST)
```

Node.js ≥ 18 pour les scripts/tests. Zéro dépendance npm. Deux documents de
démonstration (profil SwissPaints + un devis) sont chargés au premier lancement, donc
le RAG marche immédiatement.

> ⚠️ Ouvrir `index.html` via `file://` ne marche pas (les modules ES et `fetch`
> exigent `http://`). Passez par un serveur HTTP local ou GitHub Pages.

### Activer un vrai LLM (optionnel)

Cliquez sur **⚙️ LLM** dans l'en-tête, renseignez votre clé, l'URL de base et le modèle.
Sans clé, l'app reste en **mode démo**. ⚠️ La clé n'est **jamais** committée : elle vit
uniquement dans le `localStorage` de votre navigateur.

> ⚠️ **Important (site statique)** : sans backend, l'appel LLM part **directement du
> navigateur**. Le fournisseur doit donc autoriser les requêtes navigateur (CORS).
> **OpenAI et DeepSeek les bloquent** → vous obtiendrez « Failed to fetch ».
> Fournisseurs qui fonctionnent depuis un site statique :
>
> | Fournisseur | URL de base | Exemple de modèle |
> |---|---|---|
> | **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
> | **OpenRouter** | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
> | **Ollama** (local) | `http://localhost:11434/v1` | `llama3.1` |
> | **LM Studio** (local) | `http://localhost:1234/v1` | (modèle chargé) |
>
> Pour utiliser **OpenAI / DeepSeek** malgré tout, il faut lancer le **serveur Node
> optionnel** (`npm start`), qui relaie les appels côté serveur (pas de blocage CORS).

## 🌐 Déploiement GitHub Pages

Aucune étape de build. Le dossier `neuralstark/` est un site statique auto-suffisant
(chemins **relatifs**, `.nojekyll` inclus). Une fois le dossier présent sur la branche
servie par Pages (par défaut `main`), l'application est disponible à :

```
https://<user>.github.io/<repo>/neuralstark/
```

## 🗂️ Structure

```
neuralstark/
├── index.html · styles.css · app.js   # site statique (0 build), point d'entrée
├── .nojekyll                           # sert le dossier tel quel sur GitHub Pages
├── lib/                                # cœur applicatif côté navigateur (ES modules)
│   ├── rag.js       # moteur RAG (chunk, TF-IDF, cosinus, localStorage, seed)
│   ├── router.js    # routeur d'agents (cœur du Cerveau Central orchestrateur)
│   └── llm.js       # LLM : mode démo ou API compatible OpenAI + orchestration
├── data/
│   ├── agents.json         # catalogue généré des 130 agents
│   └── knowledge/          # documents de démonstration (seed) + manifest.json
├── scripts/generate-agents.mjs  # source de vérité → régénère agents.json
├── server/                 # serveur Node natif OPTIONNEL (mêmes fonctions + API REST)
├── docs/                   # CAHIER_DES_CHARGES.md · MODULES.md (les 130 modules)
└── package.json
```

## 🔌 API (serveur Node optionnel uniquement)

Le site fonctionne sans backend. Si vous lancez `npm start`, un serveur Node natif
expose en plus une API REST (utile pour une base de connaissances partagée/persistée
côté serveur) :

| Méthode | Route | Rôle |
|---------|-------|------|
| `GET` | `/api/health` | état serveur + fournisseur LLM + stats RAG |
| `GET` | `/api/agents` | catalogue des 130 agents |
| `POST` | `/api/route` | classe les agents pertinents pour une demande (`{message, k}`) |
| `GET` | `/api/documents` | liste des documents de la base |
| `POST` | `/api/documents` | ajoute un document (`{name, content}`) |
| `DELETE` | `/api/documents/:id` | supprime un document |
| `POST` | `/api/chat` | RAG + réponse (`{agentId, message, history}`) |

## 🧪 Tests

```bash
npm test        # tests du moteur RAG (node --test)
```

## 🛠️ Régénérer le catalogue

```bash
npm run generate:agents
```

Voir [`docs/CAHIER_DES_CHARGES.md`](docs/CAHIER_DES_CHARGES.md) pour l'architecture
complète et [`docs/MODULES.md`](docs/MODULES.md) pour les 130 modules.
