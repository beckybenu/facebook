# Solarijia — Institut de beauté

Site vitrine d'une page (HTML / CSS / JS, sans dépendance de build).
En ligne : https://beckybenu.github.io/facebook/solarijia/

## À personnaliser (rapide)

Tout ce qui est à remplacer est marqué « à compléter » dans la page.

1. **Coordonnées** — `app.js`, bloc `CONFIG` en haut :
   - `email` : votre e-mail de réservation
   - `whatsapp` : votre numéro au format international sans `+` (ex. `33612345678`)
   - `instagram` : l'URL de votre compte
2. **Adresse & horaires** — section `#contact` dans `index.html` (et le bloc Schema.org `BeautySalon` dans le `<head>`).
3. **Prestations & tarifs** — sections `#soins` et `#tarifs` : ajustez intitulés, descriptions et prix à votre carte réelle.
4. **Avis** — section `#avis` : remplacez par de vrais témoignages Google / Instagram.
5. **Photos** — section `#galerie` : remplacez les tuiles dégradées par vos images
   (idéalement en `assets/`, format `webp` ou `jpg`, ~1200 px de large).
6. **Image de partage** — `assets/og-cover.svg` (aperçu réseaux sociaux).

## Structure

```
solarijia/
├── index.html      # contenu + SEO + données structurées
├── styles.css      # design (palette ivoire · terracotta · or)
├── app.js          # interactions + scène 3D (three.js, fallback dégradé)
├── assets/         # favicon + image de partage
├── robots.txt
└── sitemap.xml
```

Aucune donnée n'est envoyée : le formulaire ouvre simplement l'e-mail pré-rempli
de la cliente (`mailto:`). Pour recevoir les demandes dans une base, on pourra
plus tard brancher un service de formulaire (Formspree, Netlify Forms…).
