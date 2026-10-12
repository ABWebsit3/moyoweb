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

## Mise en ligne sur Hostinger (application Node.js)

Le site est pré-généré (pages statiques) avec une seule route serveur, `/api/devis`, qui relaie les demandes de devis vers Dolibarr. Il tourne donc comme **application Node.js** Hostinger :

| Réglage hPanel | Valeur |
| --- | --- |
| Version de Node.js | 22 |
| Commande de build | `npm run build` |
| Commande de démarrage | `npm run start` (lance `dist/server/entry.mjs`) |
| Variables d'environnement | `DOLIBARR_API_KEY` (obligatoire), `DOLIBARR_API_URL` (facultatif), `PUBLIC_GA4_ID` (facultatif) |

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
- Capture à fournir : Lucas Invest Immo (header du site).
- Garantie « Livré en 3 à 5 jours… En retard ? Ton premier mois est offert » : reprise de la maquette, à confirmer.
- Citation « C'est le Netflix du site internet. » du hero : à garder comme slogan ou à retirer.
- Formule sans engagement : à confirmer (prix = prix avec engagement × 1,3).
