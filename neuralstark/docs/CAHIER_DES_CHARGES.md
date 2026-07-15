# NeuralStark — Cahier des charges

> *« Neural power. Stark reality. »* — Le cerveau IA qui agit pour votre entreprise.

## 1. Vision

NeuralStark est un **cerveau d'entreprise** : une IA qu'un entrepreneur **paie pour
gérer sa PME**. Pas un simple chatbot — un directeur des opérations virtuel, nourri
par **les documents de l'entreprise** (devis, factures, emails, rapports, procédures,
photos de chantier…), qui surveille l'activité, briefe le dirigeant chaque jour,
propose les actions à mener et les exécute quand on les lui délègue. Il permet de :

- **Trouver l'information instantanément** — questions en langage naturel, réponses
  contextuelles issues de vos données internes.
- **Accélérer la décision** — analyse rapide de grandes quantités d'informations.
- **Centraliser le savoir** — une source unique, accessible à toute l'équipe.
- **Automatiser les tâches répétitives** — recherche, rédaction, synthèse.
- **Préserver le savoir-faire** — continuité même en cas de départ d'un collaborateur.

Le produit est organisé en **130 agents IA spécialisés** (finance, RH, marketing,
opérations, vente, stratégie, IA avancée, vision, connaissance, tableaux de bord…),
chacun avec son rôle et son prompt système, tous branchés sur un moteur **RAG** commun.

## 2. Périmètre de cette implémentation (MVP)

Cette version livre une **application web fonctionnelle** qui démontre l'architecture
complète, exécutable en une commande, **sans dépendance externe** :

| Brique | Livré |
|--------|-------|
| Catalogue des 130 agents | ✅ `public/data/agents.json` (généré, catégorisé, avec prompts système) |
| **Orchestrateur Neural Cerveau Central** | ✅ routage automatique vers les agents pertinents + synthèse (`server/router.js`) |
| Interface de chat multi-agents | ✅ SPA (sidebar catalogue, chat, panneau connaissances) |
| Moteur RAG local | ✅ ingestion, chunking, index TF-IDF, recherche cosinus, citations |
| Abstraction LLM | ✅ mode démo hors-ligne **ou** API compatible OpenAI (OpenAI/DeepSeek/Groq/Ollama…) |
| Base de connaissances | ✅ ajout/suppression de documents, import de fichiers, persistance disque |
| Documents de démonstration | ✅ profil SwissPaints + devis exemple (seed au 1er lancement) |

Hors périmètre de ce MVP (extensions prévues, voir §6) : synthèse/reconnaissance
vocale, embeddings vectoriels réels, automatisation n8n, analyse d'images, multi-tenant.

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (public/)                        │
│  index.html · styles.css · app.js  (SPA vanilla, 0 build)     │
│  ── Sidebar : 130 agents par catégorie + recherche            │
│  ── Chat    : conversation par agent, rendu Markdown, sources │
│  ── Knowledge : ajout/suppression de documents (RAG)          │
└───────────────┬──────────────────────────────────────────────┘
                │  HTTP JSON (fetch)
┌───────────────▼──────────────────────────────────────────────┐
│                Serveur (server/server.js)                     │
│  HTTP natif Node · statique + API REST                        │
│   GET  /api/agents         → catalogue                        │
│   GET/POST/DELETE /api/documents  → base de connaissances     │
│   POST /api/chat           → RAG + génération                 │
└───────┬───────────────────────────────┬──────────────────────┘
        │                               │
┌───────▼─────────┐            ┌────────▼──────────────────────┐
│  RAG (rag.js)   │            │  LLM (llm.js)                 │
│  chunk + TF-IDF │            │  mode démo (extractif)  OU    │
│  cosinus + cite │            │  API compatible OpenAI        │
│  persistance    │            │  (clé via LLM_API_KEY)        │
└─────────────────┘            └───────────────────────────────┘
```

### 3.1 Pipeline RAG (Retrieval-Augmented Generation)

1. **Ingestion** — un document (collé ou importé) est reçu par `POST /api/documents`.
2. **Chunking** — découpage par paragraphes regroupés (~900 caractères, chevauchement
   150) pour garder des passages cohérents. (`rag.js → chunkText`)
3. **Indexation** — tokenisation (minuscule, sans accents, stop-words FR/EN retirés),
   calcul du **TF** par chunk et du **DF** global. (`_reindex`)
4. **Recherche** — à chaque question : vectorisation TF-IDF de la requête et des chunks,
   **similarité cosinus**, top-K passages. (`search`)
5. **Génération** — les passages + le prompt système de l'agent + l'historique sont
   envoyés au LLM ; en mode démo, une réponse **extractive** est composée à partir des
   passages. Les **sources** sont toujours retournées et affichées.
6. **Persistance** — l'index est sauvegardé dans `data/rag-store.json` (non committé).

### 3.2 Modèle « 130 agents »

Chaque agent = `{ id, number, name, category, icon, color, description, systemPrompt }`.
Le `systemPrompt` cadre le comportement (rôle, réponse en français, appui sur le
contexte RAG, interdiction d'inventer). Le catalogue est **généré** par
`scripts/generate-agents.mjs` (source unique de vérité, 130 entrées, contrôle d'intégrité).

### 3.3 Orchestration — le Neural Cerveau Central

Le `Neural Cerveau Central` n'est pas un agent comme les autres : c'est
l'**orchestrateur** — et **l'unique interlocuteur du client**. La conversation
démarre directement avec lui ; l'utilisateur n'a jamais à chercher quel agent
utiliser (la liste latérale n'est qu'une vitrine informative de l'équipe : un clic
présente le spécialiste sans changer d'interlocuteur). Pour une demande en langage
naturel, il :

1. **Route** — `server/router.js` construit un corpus TF-IDF à partir du nom, de la
   description et de la catégorie des 129 autres agents, puis classe les agents par
   **similarité cosinus** avec la demande. Les top-K (défaut 3) sont retenus.
2. **Récupère** — le moteur RAG remonte les passages documentaires pertinents.
3. **Compose** — `orchestrate()` (dans `llm.js`) délègue au(x) spécialiste(s) retenu(s)
   et produit une réponse coordonnée. En mode démo, la réponse est extractive et affiche
   la décision de routage ; en mode live, le LLM reçoit la liste des spécialistes
   présélectionnés + le contexte RAG et rédige la synthèse.
4. **Trace** — la réponse renvoie `routed[]` (agents mobilisés + score), affichés comme
   puces dans l'interface pour la transparence.

Le endpoint `POST /api/route` expose le routage seul (sans génération), utile pour
prévisualiser ou piloter d'autres intégrations.

### 3.4 Packs métiers (domaines d'activité)

Une étude d'avocats n'a pas besoin des mêmes agents qu'une entreprise de peinture.
Le sélecteur **« Domaine d'activité »** (barre latérale) active un **pack métier** :
une sélection curée des 130 agents adaptée au secteur choisi.

- **19 métiers couverts** (+ « Tous les métiers ») : peinture, construction/BTP,
  menuiserie, plombier/électricien, étude d'avocats/notariat, cabinet médical,
  laboratoire/pharmacie, commerce, hôtellerie/restauration, conseil/expertise
  comptable, immobilier, industrie, transport, agence marketing, éducation,
  bien-être/coaching, tourisme, médias/presse, administration publique.
- Les **7 agents du Cœur IA** sont inclus dans tous les packs.
- Le **catalogue** n'affiche que les agents du pack, et le **routeur de
  l'orchestrateur est restreint au pack** (ex. en mode « avocats », une question
  chantier ne sera jamais routée vers `Neural Calculateur de Matériaux`).
- Le choix est **persisté** (localStorage) et modifiable à tout moment.
- Source de vérité : `scripts/generate-sectors.mjs` → `data/sectors.json` (tous les
  ids sont validés contre le catalogue à la génération). Détail : `docs/SECTEURS.md`.

### 3.5 Cockpit — l'IA gère l'entreprise

Le mode **Cockpit** (onglet 📊 dans l'en-tête, module `lib/cockpit.js`) fait passer
NeuralStark de « répondre » à « gérer » :

- **Indicateurs** extraits automatiquement de la base de connaissances : documents
  surveillés, montants détectés (analyse CHF/EUR des devis et factures), agents
  actifs, actions en attente.
- **Briefing du jour** : l'assistant fait le point (état de la base, volume
  d'affaires repéré, alertes — ex. base vide — et priorités), personnalisé au nom
  de l'entreprise et au métier.
- **Plan d'actions** : liste d'actions adaptée au pack métier (ex. peinture :
  planifier les chantiers, calculer les matériaux, publier un avant/après ;
  avocats : synthèse de dossiers, vérification de contrats…). Chaque action porte
  le nom de l'agent responsable et un bouton **« Déléguer à l'IA »** : l'app
  bascule dans le chat, l'assistant mobilise le spécialiste et produit le
  livrable. Statuts (à faire / en cours / fait) persistés en localStorage.

C'est la brique produit qui concrétise la promesse : *l'entrepreneur paie une IA
qui pilote son entreprise*, au-delà du simple question/réponse.

### 3.6 Neural Automation Engine — les agents travaillent en autonomie

Le mode **⚡ Automations** (`lib/automation.js`) transforme les 130 agents en
main-d'œuvre autonome, sur le modèle de n8n :

- **Workflow = déclencheur → chaîne d'agents.** Déclencheurs : toutes les heures,
  chaque jour, chaque semaine, ou **événement** (nouveau document ajouté à la base).
  La sortie de chaque étape nourrit l'étape suivante (ex. briefing : `Suiveur de
  KPI` analyse → `Gardien de Trésorerie` alerte sur cette analyse).
- **Workflows par défaut** provisionnés selon le pack métier (seuls ceux dont tous
  les agents existent dans le pack sont installés) : briefing quotidien, veille
  documentaire, relances commerciales, présence réseaux sociaux, + spécifiques
  (chantiers pour le BTP, synthèse de dossiers pour les avocats, stocks pour le
  commerce/industrie).
- **Autonomie réelle côté client** : le moteur vérifie les échéances toutes les
  30 s tant que l'app est ouverte et **rattrape au démarrage** les exécutions
  manquées (le briefing du jour tourne seul dès l'ouverture). Chaque exécution est
  consignée au **journal d'activité** (persisté) et notifiée dans le chat.
- **Automations personnalisées** : l'entrepreneur crée les siennes (nom,
  déclencheur, agent, instruction) sans code ; interrupteurs on/off et exécution
  manuelle sur chaque workflow.
- **Limite assumée du statique** : sans backend, le moteur ne tourne que quand
  l'app est ouverte. Le serveur Node optionnel (`server/`) est la cible naturelle
  pour une exécution 24 h/24 (même moteur, mêmes workflows).

## 4. Stack technique & déploiement

- **Architecture client-first** : RAG (`lib/rag.js`), routeur (`lib/router.js`) et LLM
  (`lib/llm.js`) tournent **dans le navigateur** (ES modules, aucune étape de build).
  Persistance de la base de connaissances en `localStorage`.
- **Frontend** : HTML/CSS/JS vanilla, chemins **relatifs** → **site statique** déployable
  tel quel sur **GitHub Pages** (`.nojekyll` inclus), sans backend.
  URL type : `https://<user>.github.io/<repo>/neuralstark/`.
- **Serveur Node optionnel** (`server/`) : HTTP natif, sert les mêmes fichiers et ajoute
  une API REST (base de connaissances partagée côté serveur). Node.js ≥ 18, 0 dépendance.
- **LLM** : mode démo hors-ligne, ou toute API compatible OpenAI `/chat/completions`
  (clé saisie via ⚙️, stockée localement dans le navigateur).
- Cohérent avec l'orientation produit (Rust/Flutter en cible) : ce MVP privilégie une base
  **portable et sans friction** ; le moteur RAG et le routeur sont réimplémentables tels quels.

## 5. Installation & lancement

Site statique — le servir avec n'importe quel serveur HTTP :

```bash
cd neuralstark
python3 -m http.server 5178     # → http://localhost:5178
# ou : npx serve .   ·   ou : npm start (serveur Node natif + API REST)
```

Pour **GitHub Pages** : aucune build, le dossier est auto-suffisant ; une fois sur la
branche servie par Pages, l'app est en ligne à `…/<repo>/neuralstark/`.

Aucune clé n'est requise : par défaut, l'app tourne en **mode démo** (réponses extractives
depuis vos documents). Via ⚙️ LLM, ajoutez une clé pour des réponses rédigées par le LLM.

## 6. Évolutions prévues

- **Embeddings vectoriels** (remplacer TF-IDF par une base vectorielle) pour une
  recherche sémantique plus fine.
- **Vocal** : `Neural Écouteur/Haut-parleur Vocal` (Whisper + TTS).
- **Vision** : agents d'analyse de photos de chantier (avant/après, surfaces, couleurs).
- **Automatisation n8n** : déclencheurs, workflows, connecteurs.
- **Orchestration avancée** : exécution réellement parallèle de plusieurs spécialistes
  puis fusion de leurs réponses (la v1 route + délègue au meilleur ; cf. §3.3).
- **Multi-tenant & droits**, authentification, déploiement serveur.

## 7. Offre commerciale & licences

- **3 abonnements mensuels** : Standard 99 CHF (assistant + documents + 1 métier),
  Médium 199 CHF (+ Cockpit + automations), Premium 399 CHF (+ automations
  personnalisées, tous les métiers, connexion LLM).
- **Clé de licence obligatoire** : format `NSK1-<payload>.<signature>` (ECDSA
  P-256), contenant plan, entreprise et date d'expiration. Sans clé valide ou après
  expiration → **écran de verrouillage** (« l'abonnement s'arrête ») ; les données
  locales du client sont conservées et restaurées à la réactivation.
- **Outil vendeur** `scripts/generate-license.mjs` : la clé privée de signature est
  générée localement (`scripts/.keys/`, gitignorée) et ne quitte jamais le vendeur ;
  seule la clé publique est embarquée dans l'app.
- **Parcours client** : écran d'abonnement (3 cartes tarifs + activation + case CGV)
  → onboarding en 2 étapes (métier, nom d'entreprise) → application. Fonctions non
  incluses = 🔒 visibles avec invitation à passer au plan supérieur.
- **Légal** : `legal.html` — CGV/CGU (expiration = suspension), politique de
  confidentialité (traitement 100 % local), mentions légales à compléter.
- Limite documentée : verrouillage côté client (app statique) — dissuasif mais
  contournable par un utilisateur technique ; la validation serveur est la cible.

## 8. Sécurité & confidentialité

- **100 % local possible** : le RAG fonctionne hors-ligne ; aucune donnée ne sort si
  aucune API LLM n'est configurée. Avec une API distante, seuls la question et les
  passages pertinents sont envoyés au fournisseur choisi.
- **Aucun secret dans le dépôt** : `.env` et `data/rag-store.json` sont ignorés par git.
  Les clés API se configurent uniquement via variables d'environnement.
