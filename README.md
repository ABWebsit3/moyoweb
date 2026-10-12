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

En cas d'erreur Dolibarr, le visiteur voit un message et reste sur le formulaire ; l'erreur est journalisée côté serveur. L'utilisateur Dolibarr associé à la clé doit avoir les droits de création sur les tiers, contacts et propositions commerciales.

`PUBLIC_DEVIS_ENDPOINT` permet de pointer le formulaire vers une autre URL si besoin.

## Résiliation en ligne (« résilier votre contrat »)

Page `/resiliation/` (lien dans le footer de toutes les pages), conforme au principe de la résiliation « en 3 clics » (art. L215-1-1 et D215-1 s. du Code de la consommation) : 1) identification et contrat, 2) récapitulatif et bouton « Je notifie la résiliation », 3) confirmation.

`src/pages/api/resiliation.ts` envoie un **accusé de réception par e-mail** au client (copie cachée à `hello@moyoweb.fr`) puis crée un **événement d'agenda** dans Dolibarr, rattaché au tiers retrouvé par e-mail (au mieux : un échec Dolibarr ne bloque pas l'accusé). La date de fin du contrat et les effets de la résiliation sont ensuite confirmés à la main par e-mail.

E-mails : SMTP Hostinger (`smtp.hostinger.com`, port 465 SSL) avec la boîte `hello@moyoweb.fr` ; définir `SMTP_PASSWORD` (mot de passe de la boîte). Sans lui, la résiliation en ligne renvoie une erreur et invite à écrire par e-mail. Propriétaire de l'événement Dolibarr : `DOLIBARR_USER_ID`, sinon l'utilisateur lié à la clé API (`GET /users/info`).

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

- Avis clients : fictifs, section masquée (`SHOW_REVIEWS` dans `src/data/site.ts`).
- Garantie « Livré en 3 à 5 jours… En retard ? Ton premier mois est offert » : reprise de la maquette, à confirmer.
- Citation « C'est le Netflix du site internet. » du hero : à garder comme slogan ou à retirer.
- Formule sans engagement : à confirmer (prix = prix avec engagement × 1,3).
