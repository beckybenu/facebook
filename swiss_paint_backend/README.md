# SwissPaints — Backend API

Serveur qui centralise les données de l'app SwissPaints (utilisateurs, chantiers,
**pointages partagés**, devis, documents) pour qu'elles soient **synchronisées entre
tous les appareils** — l'admin voit les pointages des ouvriers en temps réel.

- Node.js + Express
- Authentification par **JWT** (mots de passe hachés bcrypt)
- Filtrage des données **par rôle** (client / ouvrier / admin), équivalent RLS
- Persistance simple par fichier JSON (aucune base à installer)

## Comptes de démonstration

| Rôle    | Email                    | Mot de passe |
| ------- | ------------------------ | ------------ |
| Admin   | `admin@swisspaints.ch`   | `admin`      |
| Ouvrier | `ouvrier@swisspaints.ch` | `ouvrier`    |
| Client  | `client@example.com`     | `client`     |

## Lancer en local

```bash
cd swiss_paint_backend
npm install
npm start          # http://localhost:4000
```

Vérifier : ouvrir http://localhost:4000/api/health → `{"ok":true,...}`.

## Déployer gratuitement (pour tester depuis le téléphone)

Le plus simple : **Render** (https://render.com), offre gratuite.

1. Créer un compte Render (avec GitHub).
2. **New +** → **Blueprint** → sélectionner ce dépôt.
   Render lit `swiss_paint_backend/render.yaml` et configure tout automatiquement
   (build, démarrage, secret JWT, disque persistant).
3. Attendre le déploiement → Render fournit une URL du type
   `https://swisspaints-api.onrender.com`.
4. Dans l'app (**Profil → Connexion serveur**), coller cette URL puis **Connecter**.
   Reconnectez-vous : l'app passe en **mode Cloud**, données partagées entre appareils.

> Alternative sans blueprint : New + → **Web Service** → ce dépôt →
> Root Directory `swiss_paint_backend`, Build `npm install`, Start `npm start`.

## Variables d'environnement

| Variable            | Rôle                                                    | Défaut            |
| ------------------- | ------------------------------------------------------- | ----------------- |
| `PORT`              | Port d'écoute                                            | `4000`            |
| `JWT_SECRET`        | Secret de signature des jetons (à définir en prod)      | valeur de dev     |
| `DATA_FILE`         | Chemin du fichier de données JSON                        | `./data.json`     |
| `ANTHROPIC_API_KEY` | Clé API Claude — **active l'assistant IA** (devis, chat) | *(non défini)*    |
| `ANTHROPIC_MODEL`   | Modèle IA utilisé                                        | `claude-opus-4-8` |

## Assistant IA (optionnel)

Pour activer l'assistant IA (génération de devis, chat écrit/vocal), ajoute une
clé API Claude dans `ANTHROPIC_API_KEY` (obtenue sur https://console.anthropic.com).
Sans cette clé, l'app fonctionne normalement mais les fonctions IA sont désactivées.
Pour réduire les coûts, tu peux passer `ANTHROPIC_MODEL` à `claude-haiku-4-5`.

## Principaux points d'API

| Méthode | Chemin                  | Accès            |
| ------- | ----------------------- | ---------------- |
| POST    | `/api/auth/login`       | public           |
| POST    | `/api/auth/signup`      | public (client/ouvrier) |
| GET     | `/api/me`               | authentifié      |
| GET     | `/api/state`            | authentifié (données filtrées par rôle) |
| POST    | `/api/timeentries`      | propriétaire / admin |
| POST/DEL| `/api/tasks`            | admin (statut : ouvrier assigné) |
| POST/DEL| `/api/users`            | admin            |
| POST/DEL| `/api/devis`            | admin / ouvrier  |
| POST/DEL| `/api/documents`        | admin            |
| POST    | `/api/ai/chat`          | admin / ouvrier (assistant) |
| POST    | `/api/ai/devis`         | admin / ouvrier (génération devis) |

## Sécurité (note)

Version prête à tester. Pour une mise en production réelle, prévoir : `JWT_SECRET`
fort, HTTPS (fourni par Render), restriction CORS à votre domaine, et sauvegardes
du fichier de données (ou passage à PostgreSQL).
