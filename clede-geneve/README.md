# Clé de Genève — Site de recherche d'appartement à Genève

Site vitrine premium (design 3D + motion design) pour un service de mise en
relation immobilière : négociation avec les **régies genevoises** pour obtenir
un logement, contre une **commission d'un mois de loyer**, facturée
**uniquement en cas de succès**.

## Ce qui est inclus

- **Scène 3D WebGL** (Three.js) : skyline stylisée de tours de verre, clé dorée
  flottante et particules, avec parallaxe souris + scroll. Dégradé animé en
  repli si WebGL indisponible ou si l'utilisateur préfère les mouvements réduits.
- **Motion design** : préloader, révélations au scroll, compteurs animés, cartes
  avec effet tilt 3D, boutons magnétiques, barre de progression, marquee des
  quartiers, dégradés animés.
- **SEO Genève poussé** : balises title/description optimisées, Open Graph,
  données structurées Schema.org (`RealEstateAgent`, `Service`, `FAQPage`),
  balises géo (`geo.region CH-GE`), `robots.txt`, `sitemap.xml`, contenu riche
  en mots-clés locaux et liste des quartiers/communes du canton.
- **Responsive** complet + accessibilité (respect de `prefers-reduced-motion`).
- **100 % statique** — aucun backend requis, déployable sur GitHub Pages.

## Structure

```
clede-geneve/
├── index.html      # page unique + données structurées SEO
├── styles.css      # design system
├── app.js          # interactions + scène 3D (Three.js via CDN)
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── favicon.svg
│   └── og-cover.svg
└── .nojekyll
```

## À personnaliser avant mise en ligne

Dans **`app.js`**, en haut du fichier (`CONFIG`) :

```js
const CONFIG = {
  email:    "contact@clede-geneve.ch", // ← votre e-mail de réception des demandes
  whatsapp: "41225010000",             // ← votre numéro WhatsApp (format international, sans +)
};
```

Puis, pour un référencement optimal, remplacez le domaine `clede-geneve.ch` par
votre domaine réel dans : `index.html` (balises canonical / Open Graph /
Schema.org), `robots.txt` et `sitemap.xml`. Mettez aussi à jour le téléphone
`+41 22 501 00 00` et l'adresse dans les données structurées.

Le formulaire de contact fonctionne sans serveur : il ouvre la messagerie du
visiteur (`mailto:`) avec la demande pré-remplie. Pour recevoir les demandes
directement (sans ouvrir la messagerie), branchez le `<form>` sur un service
comme Formspree, Getform ou Web3Forms.

## Lancer en local

```bash
cd clede-geneve
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Conseils référencement Genève

1. Créez une fiche **Google Business Profile** « Clé de Genève » (catégorie
   agence immobilière) avec adresse à Genève — c'est le levier n°1 du SEO local.
2. Récoltez des **avis Google** (les témoignages du site les reflètent).
3. Reliez le domaine dans **Google Search Console** et soumettez `sitemap.xml`.
4. Ajoutez des pages de quartier dédiées (Eaux-Vives, Champel, Carouge…) si vous
   voulez dominer chaque requête locale.
