# Moyo — site moyoweb.fr

Page d'accueil de Moyo construite avec [Astro](https://astro.build), d'après la maquette « Moyo Landing » (handoff design).

## Démarrer

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # génère dist/
npx astro check  # vérification des types
```

## Structure

- `src/pages/index.astro` : assemble les sections de la page.
- `src/components/` : une section par composant (`Hero`, `Concept`, `Devis`, `Faq`…).
- `src/data/site.ts` : textes et listes de la page (comparatif, étapes, garanties, avis, FAQ…).
- `src/data/devis.ts` : forfaits, options et prix du module de devis.
- `src/scripts/devis.ts` : logique du devis en 4 étapes (forfait → options → coordonnées → ticket).
- `src/styles/global.css` : tokens de design (couleurs, typo, ombres, boutons).

## Images

Les images sont dans `src/assets/` et passent par `<Image>` (`astro:assets`) : au build, Astro les convertit en WebP et génère les tailles utiles. Elles sont déclarées dans `IMAGES` (`src/data/site.ts`). `moyo_eating.png` est disponible mais pas encore utilisée.

Placeholders à remplacer : logos clients (`ClientLogos.astro`, wordmarks texte pour l'instant).

## Mise en ligne sur Hostinger (application Node.js)

Le site est pré-généré (pages statiques) avec une seule route serveur, `/api/devis`, qui relaie les demandes de devis vers Dolibarr. Il tourne donc comme **application Node.js** Hostinger :

| Réglage hPanel | Valeur |
| --- | --- |
| Préréglage de framework | Astro |
| Version de Node.js | 22 |
| Commande de build | `npm run build` |
| Répertoire de sortie | `dist` |
| Fichier d'entrée | `server.mjs` |
| Variables d'environnement | `DOLIBARR_API_KEY` et `SMTP_PASSWORD` (obligatoires), `DOLIBARR_API_URL`, `DOLIBARR_USER_ID`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `PUBLIC_GA4_ID` (facultatifs) |

`server.mjs` existe à la racine du projet et dans `dist/` (créé par `scripts/postbuild.mjs`) : Hostinger résout le fichier d'entrée depuis l'un ou l'autre selon le framework. Les deux démarrent le serveur Astro (`dist/server/entry.mjs`). En local : `npm run start`.

`DOLIBARR_API_URL` vaut par défaut `https://doli.agence-abweb.fr/htdocs/api/index.php`. `PUBLIC_GA4_ID` est lu au build : le définir avant de lancer le build.

La GitHub Action (`.github/workflows/deploy.yml`) vérifie que le site compile et publie la partie statique (`dist/client`) sur la branche `deploy`, utilisable seulement pour un hébergement statique (sans envoi des devis).

## Envoi du devis → Dolibarr

`src/pages/api/devis.ts` (côté serveur, la clé API ne quitte jamais le serveur) :

1. Valide la demande (champs, consentement, e-mail), filtre les robots (champ piège) et limite à 5 demandes / 10 min par IP.
2. Recalcule le devis côté serveur (`src/lib/quote.ts`, même calcul que dans le navigateur) : les montants envoyés par le navigateur sont ignorés.
3. Dans Dolibarr : recherche le tiers par e-mail ; sinon le crée en **prospect** (code client automatique) ; ajoute un **contact** si une société est renseignée.
4. Crée une **proposition commerciale en brouillon** : forfait, mise en service (sans engagement), options (incluses à 0 €), articles SEO supplémentaires. TVA à 0 (art. 293 B du CGI). Le détail et le total mensuel sont dans la note privée.

5. Envoie deux **e-mails** (si `SMTP_PASSWORD` est défini) : une notification à `hello@moyoweb.fr` (avec l'état de l'enregistrement Dolibarr, réponse directe au client) et le **ticket au client** avec le lien Calendly.

Rien ne se perd : Dolibarr et les e-mails sont tentés indépendamment. La demande n'échoue que si ni Dolibarr ni la notification e-mail n'ont abouti ; si seul l'e-mail au client échoue, l'écran final affiche « Demande de devis enregistrée » au lieu de « Devis envoyé à… ». Les erreurs sont journalisées côté serveur. L'utilisateur Dolibarr associé à la clé doit avoir les droits de création sur les tiers, contacts et propositions commerciales.

`PUBLIC_DEVIS_ENDPOINT` permet de pointer le formulaire vers une autre URL si besoin.

## Résiliation en ligne (« résilier votre contrat »)

Page `/resiliation/` (lien dans le footer de toutes les pages), conforme au principe de la résiliation « en 3 clics » (art. L215-1-1 et D215-1 s. du Code de la consommation) : 1) identification et contrat, 2) récapitulatif et bouton « Je notifie la résiliation », 3) confirmation.

`src/pages/api/resiliation.ts` envoie un **accusé de réception par e-mail** au client (copie cachée à `hello@moyoweb.fr`) puis crée un **événement d'agenda** dans Dolibarr, rattaché au tiers retrouvé par e-mail (au mieux : un échec Dolibarr ne bloque pas l'accusé). La date de fin du contrat et les effets de la résiliation sont ensuite confirmés à la main par e-mail.

E-mails : SMTP Hostinger (`smtp.hostinger.com`, port 465 SSL) avec la boîte `hello@moyoweb.fr` ; définir `SMTP_PASSWORD` (mot de passe de la boîte). Sans lui, la résiliation en ligne renvoie une erreur et invite à écrire par e-mail. Propriétaire de l'événement Dolibarr : `DOLIBARR_USER_ID`, sinon l'utilisateur lié à la clé API (`GET /users/info`).

## Questionnaire pré-RDV

Envoyé au prospect **une fois son rendez-vous pris** depuis la fin du devis. Questions : `src/data/questionnaire.ts` (modifiables sans toucher au code).

1. **Devis** (`/api/devis`) : le tiers est créé ou retrouvé dans Dolibarr, puis un token est écrit sur sa fiche (`questionnaire_token`, `questionnaire_url`). Un token existant n'est jamais régénéré.
2. **Prise de RDV** : à l'étape 4, « Choisir mon créneau » charge le calendrier **Calendly intégré** (au clic seulement : Calendly dépose ses cookies), pré-rempli avec le nom et l'e-mail. La réservation est détectée via l'événement navigateur `calendly.event_scheduled` (disponible sur tous les plans Calendly, y compris gratuit) → `/api/questionnaire/rdv` : e-mail avec le lien du questionnaire, statut `envoye`, événement Agenda « RDV pris via Calendly ». Idempotent : rien n'est renvoyé si le statut est déjà renseigné. Le lien est aussi affiché à l'écran.
3. **Remplissage** : `/questionnaire/<token>` (rendu serveur, `noindex`, pré-rempli avec le nom de l'entreprise, brouillon local, progression). `/api/questionnaire/<token>` crée un événement Agenda « Questionnaire pré-RDV rempli » lié au tiers (réponses dans la note), y **joint un récapitulatif PDF** (pas de HTML : Dolibarr renomme les `.html` en `.html.noexe` ; `modulepart: agenda` : l'envoi direct sur un tiers, `societe`, n'existe pas dans les versions publiées de Dolibarr jusqu'à la 22), passe le statut à `rempli` (+ `questionnaire_date`) et notifie `hello@moyoweb.fr`. Une seule soumission : ensuite « Déjà reçu, merci ».
4. Token : `<id du tiers>.<32 caractères aléatoires>`, comparé en temps constant à la valeur stockée sur le tiers ; token invalide → 404 neutre.

**Limites (Calendly gratuit)** : pas de webhooks ni de redirection après réservation. Si le visiteur ouvre Calendly dans un nouvel onglet au lieu du calendrier intégré, ou réserve sans passer par le devis, la réservation n'est pas détectée. La date du RDV n'est pas connue du site (elle reste dans Calendly).

**Configuration Dolibarr (manuelle)** : modules API REST, Agenda et GED/Documents activés ; attributs supplémentaires des tiers :

| Code | Libellé | Type |
| --- | --- | --- |
| `questionnaire_token` | Token questionnaire | Chaîne (64), non visible |
| `questionnaire_url` | Questionnaire pré-RDV | Lien (URL) |
| `questionnaire_statut` | Statut questionnaire | Liste : `envoye`, `rempli` |
| `questionnaire_date` | Questionnaire rempli le | Date et heure |

Sans ces attributs, le devis fonctionne normalement mais le calendrier n'est pas proposé en version intégrée (lien Calendly classique) et aucun questionnaire n'est envoyé ; l'erreur est journalisée (`[devis] token questionnaire impossible`).

## Événements Google Analytics 4

Envoyés depuis `src/scripts/devis.ts` via `src/lib/analytics.ts`, **uniquement après consentement** (tarteaucitron) et sans donnée personnelle :

| Événement | Quand | Paramètres |
| --- | --- | --- |
| `devis_start` | première interaction avec le module de devis | `plan`, `engagement` |
| `generate_lead` | renseignements envoyés avec succès | `value` (total mensuel), `currency`, `plan`, `engagement` |
| `calendly_click` | clic vers Calendly | `location` (`devis_besoin_specifique`, `devis_resultat` ou `devis_calendrier_integre`), `plan` |
| `rdv_scheduled` | rendez-vous réservé dans le calendrier intégré | `plan` |

Pour en faire des conversions : GA4 → Administration → Événements → marquer `generate_lead` (et `calendly_click`) comme événements clés.

## SEO et IA

- `/sitemap.xml` : généré au build à partir des pages de `src/pages` (hors 404 et `/api`).
- `/robots.txt` : autorise tout sauf `/api/`, pointe vers le sitemap.
- `/llms.txt` : résumé du site au format [llmstxt.org](https://llmstxt.org), généré à partir des données des offres et de la FAQ (toujours à jour).

## Favicons

Générés depuis la mascotte : `node scripts/make-favicons.mjs` (écrit dans `public/`).

## Cookies (tarteaucitron.js)

- Auto-hébergé : `scripts/copy-tarteaucitron.mjs` copie la librairie de `node_modules` vers `public/tarteaucitron/` avant chaque `dev`/`build`.
- Configuration dans `src/layouts/Layout.astro`, habillage Moyo dans `src/styles/tarteaucitron-moyo.css` (bandeau en bas de page).
- Le bandeau n'apparaît que si un service soumis à consentement est déclaré (aujourd'hui : GA4 via `PUBLIC_GA4_ID`). Aucun script Google n'est chargé avant le consentement (`googleConsentMode: false`).
- Choix conservé 6 mois. Lien « Gestion des cookies » dans le footer.
- Les polices sont auto-hébergées (`@fontsource`) : aucun appel à Google Fonts.

## Animations

`src/scripts/motion.ts` : défilement fluide [Lenis](https://github.com/darkroomengineering/lenis) et effets d'apparition.
- `data-reveal` (valeurs : vide, `pop`, `left`, `right`) sur un élément ; `data-reveal-stagger` sur un conteneur pour faire apparaître ses enfants en cascade.
- Désactivé si l'utilisateur a demandé à réduire les animations.

## Pages légales

`/mentions-legales/`, `/cgv/`, `/confidentialite/`. Les informations de l'entreprise sont dans `src/data/legal.ts` : chaque champ vide s'affiche « À compléter » (surligné). Les CGV reprennent les prix de `src/data/devis.ts`.
⚠ Textes à faire relire par un professionnel du droit avant publication.

## Points restant à valider

- Valeurs `[À COMPLÉTER]` / `[À VÉRIFIER]` : rechercher `TODO [À` dans `src/` (prestataire de paiement dans `src/data/legal.ts`, note 4,9/5 (le slogan « C’est le Netflix du site internet. » reste affiché, sans étoiles), certification DPF de Calendly et Google).

- Avis clients : fictifs, section masquée (`SHOW_REVIEWS` dans `src/data/site.ts`).
- Formule sans engagement : à confirmer (prix = prix avec engagement × 1,3).
