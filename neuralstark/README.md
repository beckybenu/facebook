# 🧠 NeuralStarK — Le cerveau d'entreprise

NeuralStarK est un **cerveau d'entreprise multi-agents** propulsé par l'API Claude (Anthropic).
Il « recrute » une équipe d'agents IA spécialisés qui travaillent avec de vrais outils métier :

| Agent | Rôle | Ce qu'il fait |
|---|---|---|
| 🗂️ **Léa** | Secrétaire de direction | Agenda, rendez-vous, tâches, comptes rendus |
| 📈 **Marc** | Responsable marketing | Campagnes, contenus, positionnement, plans marketing |
| ✉️ **Émilie** | Communication email | Prospection, relances, newsletters, réponses clients |
| 📱 **Sofia** | Community manager | Posts multi-réseaux, calendriers éditoriaux, hashtags |
| 🤝 **Karim** | Relation client (CRM) | Contacts, pipeline commercial, suivi, relances |
| 📚 **Nora** | Gestion des connaissances | Base documentaire RAG, réponses sourcées |
| 🧠 **NeuralStarK** | Cerveau central | Missions transverses, coordination, vue d'ensemble |

## Architecture

```
Demande utilisateur
   │
   ▼
Routeur (Claude, effort bas, sortie structurée) ──► choisit l'agent compétent
   │
   ▼
Boucle agentique (Claude claude-opus-4-8, adaptive thinking + tool use)
   │  L'agent enchaîne les outils jusqu'à accomplir la mission :
   │  tâches · agenda · CRM · emails · posts · RAG (BM25) · profil entreprise
   ▼
Réponse + actions réellement enregistrées (visibles dans le tableau de bord)
```

- **Backend** : Node.js (ESM) + Express + `@anthropic-ai/sdk` — boucle agentique manuelle
  (`tool_use` → exécution → `tool_result`), gestion de `pause_turn`, routage par sortie structurée.
- **RAG** : découpage en chunks + scoring **BM25** local, sans dépendance externe. Les agents
  citent leurs sources.
- **Stockage** : JSON persistant sur disque (`data/store.json`).
- **Sécurité** : les emails et publications ne sont **jamais envoyés** automatiquement — ils sont
  enregistrés en brouillon pour validation humaine.

## Démarrage

```bash
cd neuralstark
npm install
export ANTHROPIC_API_KEY="sk-ant-..."   # requis pour activer le cerveau
npm start
# → http://localhost:3000
```

Sans clé API, le tableau de bord fonctionne en mode manuel (CRUD des modules), mais le chat IA
est désactivé.

Variables optionnelles :

- `PORT` — port HTTP (défaut : 3000)
- `NEURALSTARK_MODEL` — modèle Claude (défaut : `claude-opus-4-8`)
- `NEURALSTARK_DATA_DIR` — dossier de données (défaut : `neuralstark/data`)

## Exemples de missions

- « Prépare 3 posts LinkedIn pour la semaine prochaine sur notre nouvelle offre »
- « Ajoute un rendez-vous vendredi 10h avec M. Dupont et crée une tâche de préparation »
- « Rédige un email de relance pour le client Martin et note l'interaction dans le CRM »
- « Voici notre catalogue produits : … — ajoute-le à la base de connaissances »
- « Quelles sont nos conditions de livraison ? » *(réponse sourcée via le RAG)*
- « Lance la campagne de lancement du produit X : plan marketing, posts, emails et tâches »

## API

| Route | Description |
|---|---|
| `GET /api/status` | État du cerveau + liste des agents |
| `GET /api/data` | Toutes les données (tâches, agenda, CRM, emails, posts, docs, activité) |
| `POST /api/ask` | `{ message, agent?: "auto"\|nom, history? }` → réponse de l'agent + actions |
| `POST /api/tools/:name` | Exécution directe d'un outil métier (mode manuel) |
