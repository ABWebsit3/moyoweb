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

## Images à ajouter

Placer ces fichiers dans `public/images/` (repris du site actuel) :

- `moyo_logo.png`
- `moyo_transat.png`
- `moyo_surprised.png`
- `tkllobster.webp`

Placeholders à remplacer : captures Lucas Invest Immo et Atelier Brume (`Projects.astro`), logos clients (`ClientLogos.astro`).

## Envoi du devis

Sans configuration, le formulaire affiche le ticket mais **n'envoie rien**.
Pour brancher un envoi (mail, CRM, webhook…), définir la variable d'environnement :

```sh
PUBLIC_DEVIS_ENDPOINT=https://exemple.fr/api/devis
```

Le devis est alors envoyé en `POST` JSON (`ticketNo`, `contact`, `plan`, `engagement`, `setupFee`, `options`, `totalMonthly`) avant d'afficher l'étape 4. En cas d'erreur, un message s'affiche et l'utilisateur reste sur l'étape 3.

## Points à valider avec le client

- Garder ou non la formule sans engagement (les conditions parlent d'un engagement de 24 mois).
- Prix Premium sans engagement : 175,49 € dans la maquette, alors que 144,99 € × 1,3 = 188,49 €.
- Majoration « sans engagement » appliquée au forfait seulement, pas aux options.
- TVA affichée à 0,00 € sur le ticket : à ajuster selon le régime fiscal.
- Garantie « Satisfait ou remboursé 30 jours » : texte à confirmer ou supprimer.
- Avis, note 4,9/5 (127 avis), « 150+ sites », logos clients : données fictives.
- Liens Mentions légales / CGV / Confidentialité : pages à créer.
