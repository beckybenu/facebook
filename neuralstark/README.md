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
- **🧠 Neural Cerveau Central — orchestrateur** : décrivez votre besoin en langage
  naturel, il **route** automatiquement vers le ou les agents pertinents parmi les 130,
  délègue, et **synthétise** la réponse (les agents mobilisés sont affichés).
- **Chat multi-agents** avec rendu Markdown et affichage des **sources**.
- **Moteur RAG** local : ingestion, chunking, index TF-IDF, recherche par similarité
  cosinus, citations. **Aucune dépendance externe.**
- **Base de connaissances** : ajout/suppression de documents, import de fichiers,
  persistance sur disque.
- **LLM au choix** : fonctionne **hors-ligne** (mode démo extractif) ou avec n'importe
  quelle API compatible OpenAI (OpenAI, DeepSeek, Groq, Ollama, LM Studio, vLLM…).

## 🚀 Démarrage rapide

```bash
cd neuralstark
npm start          # → http://localhost:5178
```

Node.js ≥ 18 requis. Rien à installer (zéro dépendance npm). Deux documents de
démonstration (profil SwissPaints + un devis) sont chargés au premier lancement, donc
le RAG marche immédiatement.

### Activer un vrai LLM (optionnel)

```bash
cp .env.example .env
# puis, dans .env :
#   LLM_API_KEY=sk-...
#   LLM_BASE_URL=https://api.deepseek.com/v1   (ou OpenAI, Groq, Ollama…)
#   LLM_MODEL=deepseek-chat
npm start
```

Sans clé, l'app reste en **mode démo** (réponses construites par extraction depuis vos
documents). ⚠️ Ne mettez jamais de clé API en clair dans le code ou dans un commit.

## 🗂️ Structure

```
neuralstark/
├── server/
│   ├── server.js        # HTTP natif : statique + API REST
│   ├── rag.js           # moteur RAG (chunk, TF-IDF, cosinus, persistance, seed)
│   ├── router.js        # routeur d'agents (cœur du Cerveau Central orchestrateur)
│   └── llm.js           # abstraction LLM + orchestration (démo / API compatible OpenAI)
├── public/
│   ├── index.html · styles.css · app.js   # SPA (0 build)
│   └── data/agents.json # catalogue généré des 130 agents
├── scripts/
│   └── generate-agents.mjs  # source de vérité → régénère agents.json
├── data/knowledge/      # documents de démonstration (seed)
├── docs/
│   ├── CAHIER_DES_CHARGES.md
│   └── MODULES.md       # les 130 modules détaillés
└── package.json
```

## 🔌 API

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
