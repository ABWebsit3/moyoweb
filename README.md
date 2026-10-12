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

Placeholders à remplacer : capture Lucas Invest Immo (`Projects.astro`), logos clients (`ClientLogos.astro`).

## Mise en ligne sur Hostinger

Le déploiement Git de Hostinger copie les fichiers du dépôt **sans lancer de build**. Le build est donc fait par GitHub Actions (`.github/workflows/deploy.yml`) :

1. À chaque push sur `main` (ou sur la branche de travail), l'action lance `npm ci` puis `npm run build`.
2. Le contenu de `dist/` est publié sur la branche **`deploy`** (le site compilé, prêt à servir).
3. Dans hPanel → **Avancé → Git** : dépôt `https://github.com/ABWebsit3/moyoweb.git`, branche **`deploy`**, répertoire vide (= `public_html`). Activer le **déploiement automatique** (webhook GitHub fourni par Hostinger).

Variables optionnelles, dans GitHub → Settings → Secrets and variables → Actions → **Variables** :

| Variable | Rôle |
| --- | --- |
| `PUBLIC_DEVIS_ENDPOINT` | URL qui reçoit les demandes de devis (POST JSON) |
| `PUBLIC_GA4_ID` | Identifiant Google Analytics 4 (`G-…`) ; active le bandeau cookies |

`public/.htaccess` gère la page 404 et le cache des fichiers statiques.

## Envoi du devis

Sans configuration, le formulaire affiche le ticket mais **n'envoie rien**.
Pour brancher un envoi (Dolibarr, mail, webhook…), définir `PUBLIC_DEVIS_ENDPOINT`.
Le devis est envoyé en `POST` JSON (`ticketNo`, `contact`, `plan`, `engagement`, `setupFee`, `options`, `totalMonthly`) avant d'afficher l'étape 4. En cas d'erreur, un message s'affiche et l'utilisateur reste sur l'étape 3.
⚠ Ne jamais mettre la clé API Dolibarr côté navigateur : passer par un relais côté serveur.

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
- Capture à fournir : Lucas Invest Immo.
- Garantie « Livré en 3 à 5 jours… En retard ? Ton premier mois est offert » : reprise de la maquette, à confirmer.
- Citation « C'est le Netflix du site internet. » du hero : à garder comme slogan ou à retirer.
- Formule sans engagement : à confirmer (prix = prix avec engagement × 1,3).
