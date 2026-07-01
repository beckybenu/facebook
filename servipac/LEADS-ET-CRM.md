# SERVIPAC — Générer des leads légalement + brancher le CRM

## 1. Pourquoi pas de « scraping » du site d'un concurrent
Récupérer automatiquement des coordonnées de particuliers (noms, e-mails, téléphones)
sur le site d'un concurrent pour les démarcher est **interdit** :
- **nLPD** (Suisse) — traitement de données personnelles sans base légale ni information.
- **RGPD** (clients UE / frontaliers) — mêmes principes, amendes lourdes.
- Viole aussi presque toujours les **CGU** du site cible et expose à des plaintes.

Le risque juridique et réputationnel dépasse largement le gain. Les 4 sites livrés
misent donc sur une acquisition **entrante** (inbound), bien plus rentable et durable.

## 2. Sources de leads 100 % conformes
- **Vos propres formulaires** (déjà intégrés aux 4 sites) → la meilleure source.
- **Google Ads / Google Business Profile** — recherche locale « pompe à chaleur Genève ».
- **Meta Lead Ads** (Facebook/Instagram) → le repo contient déjà les modules Odoo
  `pragtech_crm_facebook_leads` et `odoo_lead_forms_ad_integration_hub_crm` pour les
  importer directement dans le CRM.
- **Annuaires / places de marché B2B** où l'inscription est ouverte (local.ch, houzz,
  plateformes de mise en relation devis, appels d'offres publics simap.ch).
- **Partenariats** : régies immobilières, architectes, bureaux d'ingénieurs.

## 3. Brancher les formulaires au CRM (au choix)
Chaque site contient un `<script>` avec un point d'intégration commenté
(`=== INTÉGRATION CRM ===`). Trois options :

1. **Odoo directement** — exposer un webhook créant un `crm.lead`, puis :
   ```js
   fetch('https://VOTRE-ODOO/web/hook/servipac-lead', {
     method:'POST', headers:{'Content-Type':'application/json'},
     body: JSON.stringify(data)
   });
   ```
2. **Formspree / Formcarry** (sans backend) — remplacer par l'endpoint fourni.
3. **Make / Zapier** — webhook → Odoo, e-mail, Google Sheet, SMS…

Pensez à ajouter une case de consentement si vous réutilisez l'e-mail pour du marketing.

## 4. Suivi & conversion (recommandé une fois le design choisi)
- Installer **Google Analytics 4** + **Google Tag Manager** + le **pixel Meta**.
- Déclarer un « conversion event » à la soumission du formulaire.
- Créer la fiche **Google Business Profile** et collecter des avis (levier SEO local n°1).
