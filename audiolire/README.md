# 🎧 AudioLire

Lecteur de livres audio qui fonctionne entièrement dans le navigateur : vous
importez un livre, l'application vous le lit à voix haute, se souvient de
l'endroit exact où vous vous êtes arrêté et surligne le texte au fil de la
lecture.

**Aucun serveur, aucun compte, aucun envoi de fichier.** Les livres sont
stockés dans IndexedDB, sur votre appareil, et la voix est celle de votre
système d'exploitation (Web Speech API).

## Fonctionnalités

| | |
|---|---|
| 📖 | Import de **PDF, EPUB, TXT, MD, HTML** (glisser-déposer ou sélecteur de fichier) |
| ▶️ | **Start** — la lecture démarre à voix haute |
| ⏸️ | **Pause** — l'énoncé en cours est suspendu, pas relancé |
| ▶️ | **Reprise** exactement où la lecture s'était arrêtée |
| ⏹️ | **Stop** |
| ⏩ ⏪ | Avancer / reculer d'une phrase (⏮ ⏭) ou de dix phrases (⏪ ⏩), plus une barre de progression pour aller n'importe où |
| 🔊 | Choix de la **voix** et de la **vitesse** (0,5× à 2,5×), plus tonalité et volume |
| 📍 | **Position mémorisée automatiquement** — retrouvée à la réouverture, même après fermeture du navigateur |
| 📚 | **Bibliothèque** de plusieurs livres, avec avancement en pourcentage |
| 🌍 | **Plusieurs langues** : langue du livre détectée automatiquement, voix filtrées par langue, interface en FR / EN / ES / DE |
| 🔎 | **Recherche d'un passage** (accents et casse ignorés) avec saut direct à l'endroit trouvé |
| ✨ | **Surlignage progressif** : la phrase lue est mise en évidence, le mot prononcé est surligné |

Bonus : clic sur n'importe quelle phrase pour lire à partir de là, défilement
automatique suivant la lecture, et raccourcis clavier.

## Raccourcis clavier

| Touche | Action |
|---|---|
| `Espace` | Lecture / Pause |
| `→` / `←` | Phrase suivante / précédente |
| `Maj + →` / `Maj + ←` | Avancer / reculer de 10 phrases |
| `/` | Rechercher un passage |
| `Échap` | Fermer le panneau ouvert |

## Utilisation

Site statique, sans étape de build :

```bash
cd audiolire
python3 -m http.server 8000    # ou n'importe quel serveur statique
# puis ouvrir http://localhost:8000
```

Un serveur est nécessaire (et non l'ouverture directe du fichier) car
l'application utilise des modules ES et un worker.

## Organisation du code

```
audiolire/
├── index.html          structure de l'interface
├── styles.css          thème sombre, mise en page, responsive
├── app.js              état, bibliothèque, rendu du texte, recherche, i18n
├── lib/
│   ├── parse.js        import PDF / EPUB / HTML / texte + détection de langue
│   ├── reader.js       découpage en phrases + moteur de lecture vocale
│   └── db.js           IndexedDB (livres, réglages, sauvegarde de position)
└── vendor/             pdf.js et JSZip embarqués (aucun CDN, fonctionne hors ligne)
```

### Quelques choix techniques

- **La phrase est l'unité de position.** Le texte est découpé avec
  `Intl.Segmenter` (repli sur une expression régulière), et chaque phrase est
  envoyée séparément au moteur vocal. C'est ce qui rend la reprise exacte, le
  saut de phrase instantané et le surlignage fiable.
- **Fragments courts.** Les navigateurs coupent le son sur les énoncés trop
  longs : les phrases dépassant ~220 caractères sont découpées sur une
  ponctuation, sans changer l'unité de position.
- **Fenêtre de rendu.** Un livre peut faire plusieurs millions de caractères ;
  seules 300 phrases sont présentes dans le DOM à la fois, avec une pagination
  qui suit automatiquement la lecture.
- **Nettoyage des PDF.** Les mots coupés en fin de ligne sont recollés, les
  lignes d'un même paragraphe fusionnées, et une phrase à cheval sur deux pages
  n'est pas transformée en nouveau paragraphe.

## Compatibilité

Nécessite la Web Speech API : Chrome, Edge et Safari (bureau et mobile) la
prennent en charge. Firefox ne propose des voix que si le système en installe —
sans voix, l'application prévient et le reste (bibliothèque, texte, recherche)
fonctionne. La qualité et le nombre de voix dépendent entièrement du système :
macOS et iOS offrent des voix « premium » à télécharger dans les réglages
d'accessibilité, Windows dans les paramètres de voix.

Les PDF scannés (images sans couche texte) ne peuvent pas être lus : aucun
texte n'est extractible, l'application le signale à l'import.

## Dépendances embarquées

| Librairie | Version | Licence | Usage |
|---|---|---|---|
| [pdf.js](https://github.com/mozilla/pdf.js) | 4.6.82 | Apache-2.0 | extraction du texte des PDF |
| [JSZip](https://github.com/Stuk/jszip) | 3.10.1 | MIT | lecture des archives EPUB |

Elles sont chargées à la demande, uniquement quand un PDF ou un EPUB est importé.
