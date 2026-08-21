# Babacar Ndiaye, avocat : identité et trois directions de site

Site vitrine du cabinet de Maître Babacar Ndiaye, avocat au Barreau du Sénégal, Rue Sandinieri
à Dakar. Le dossier contient une identité de marque complète et **trois sites entiers**, tous
fonctionnels, construits sur la même charte et le même contenu.

Point d'entrée : `index.html` (identité, système visuel, comparaison des trois directions).

## Les trois directions

| Direction | Registre | Scène 3D | Typographie de titrage |
| --- | --- | --- | --- |
| `design-sillage/` | Ivoire, éditorial, lumière du jour | Feuille suspendue striée d'or, shader dédié, repli au scroll | Bodoni Moda |
| `design-chambre/` | Nuit, cinématique | Salle d'archives : dalles cerclées d'or, brume, poussière, travelling caméra | Marcellus |
| `design-signal/` | Contemporain, kinétique | 6 400 points GPU qui prennent la forme du monogramme, du continent, de l'arc et du mot « impact » | Syne |

Chaque direction reprend le même contenu : cabinet, sept domaines d'intervention, méthode en
quatre temps, cadre d'honoraires, questions fréquentes, formulaire de contact.

## Identité

- `assets/logo-lockup.svg` : logo complet (monogramme, nom, mention, balance, signature, tissage).
- `assets/logo-monogram.svg` et `assets/logo-wordmark.svg` : versions réduites pour l'en-tête.
- `assets/favicon.svg` : icône d'onglet.
- `assets/brand.css` : les jetons communs (couleurs, échelle typographique, espacements, courbes
  de mouvement, motifs). Les trois sites le chargent avant leur propre feuille de style.

**Signature :** « Le droit. La vision. L'impact. » Le troisième segment passe toujours en or.

**Couleurs :** encre `#101A26`, nuit `#080D14`, or `#B08A3E` (variante lisible sur ivoire
`#8A6420`, variante lisible sur nuit `#D8B86B`), ivoire `#F5F2EC`.

**Motifs récurrents :** l'arc, les stries verticales et le losange tissé, tous repris du logo,
en 2D comme en 3D.

## Voir les sites

Les pages sont statiques mais chargent des polices et des scripts locaux : ouvrir via un petit
serveur plutôt qu'en `file://`.

```bash
cd babacar-ndiaye-avocat
python3 -m http.server 8000
# puis http://localhost:8000/
```

## Technique

- Aucun cadre de développement, aucune dépendance distante à l'exécution.
- Polices auto-hébergées dans `assets/fonts/` (sous-ensembles latin et latin-ext, licence SIL
  Open Font License).
- `vendor/three.min.js` : une seule librairie 3D, partagée par les trois directions.
- Une seule boucle `requestAnimationFrame` par page pilote le scroll, la scène et les
  interpolations. Pas d'écouteur `scroll`.
- `prefers-reduced-motion` désactive les scènes 3D et toutes les animations ; les contenus
  restent complets et lisibles.
- Navigation clavier, lien d'évitement, états de focus visibles, contrastes vérifiés.
- Données structurées `schema.org/Attorney`, métadonnées de partage, indications géographiques
  sur Dakar.

## À confirmer avant mise en ligne

1. **Adresse électronique.** `contact@babacarndiaye-avocat.sn` est un exemple, présent dans les
   trois formulaires et dans les pieds de page. Remplacer par l'adresse réelle du cabinet.
2. **Formulaire.** Faute de serveur, l'envoi prépare le message dans la messagerie du visiteur.
   Brancher un point d'envoi (service de formulaire ou script côté serveur) le moment venu.
3. **Nom de domaine.** Renseigner l'URL retenue dans les balises `og:url` et `canonical`.
4. **Horaires et mentions légales.** Ajouter les horaires d'ouverture et la page de mentions
   légales exigée, avec le numéro d'inscription au Barreau si le cabinet souhaite l'afficher.
5. **Photographies.** Aucune photo n'est utilisée. Un portrait professionnel et une vue du
   cabinet renforceraient la page « cabinet » de la direction retenue.

## Déontologie

Les textes évitent toute promesse de résultat, tout témoignage et tout chiffre invérifiable. Le
secret professionnel et les règles de la profession sont mentionnés dans chaque pied de page.
Une relecture par le cabinet reste nécessaire avant publication.
