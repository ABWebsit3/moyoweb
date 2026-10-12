// Contenus de la page d'accueil (repris de la maquette « Moyo Landing »).
// Les avis clients sont fictifs (maquette) : la section est masquée tant que SHOW_REVIEWS vaut false.

import logo from '../assets/moyo_logo.png';
import transat from '../assets/moyo_transat.png';
import surprised from '../assets/moyo_surprised.png';
import tkl from '../assets/tkllobster.webp';
import jd from '../assets/jdeventandhomedesign.webp';
import lucas from '../assets/lucasinvestimmo.webp';

// Images optimisées au build via <Image> (astro:assets).
export const IMAGES = { logo, transat, surprised, tkl, jd, lucas };

export const CONTACT_EMAIL = 'hello@moyoweb.fr';

// Prise de rendez-vous après un devis (simple lien : aucun script ni cookie Calendly sur le site).
export const CALENDLY_URL = 'https://calendly.com/moyoweb/30min';

// Clients réels. Jessica Da Veiga (jdeventandhomedesign.fr) est mise en avant : seul site encore en ligne.
export const clients = ['Jessica Da Veiga', 'TKL Miami', 'Lucas Invest Immo'];

export const nav = [
  { href: '/#concept', label: 'Quésako ?' },
  { href: '/#projets', label: 'Nos projets' },
  { href: '/#devis', label: 'Combien ça coûte ?' },
  { href: '/#faq', label: 'FAQ' },
];

export const keyFigures = [
  { value: '3–5 j', label: 'délai moyen de livraison' },
  { value: '4,9/5', label: 'note moyenne clients' },
  { value: '0 €', label: 'au départ avec engagement' },
];

export const compare = [
  { label: 'Pour démarrer', them: '1 500 à 3 000 € d’un coup', us: '0 €, juste une mensualité' },
  { label: 'Hébergement & domaine', them: 'En supplément', us: 'Inclus' },
  { label: 'Mises à jour & sécurité', them: 'Facturées à chaque fois', us: 'Incluses' },
  { label: 'Délai de mise en ligne', them: '4 à 8 semaines', us: '3 à 5 jours' },
  { label: 'Modifications', them: 'Devis à chaque demande', us: '60 min/mois incluses' },
  { label: 'Nom de domaine', them: 'Souvent au nom de l’agence', us: 'Enregistré à ton nom' },
  { label: 'Engagement', them: 'Contrat long imposé', us: '24 mois, ou sans engagement' },
];

export const steps = [
  { n: 1, color: '#F49B2A', title: 'Tu choisis ton style', text: 'On te propose un design sur-mesure ou une base déjà canon.' },
  { n: 2, color: '#8A4FFF', title: 'On crée ton site', text: 'Simple, rapide, efficace. Ton site est construit avec amour (et un peu de café).' },
  { n: 3, color: '#7EE08F', title: 'Tu paies une mensualité', text: 'Pas de stress, pas de surprise. Comme ton abonnement à la salle… sauf que là tu t’en sers vraiment.' },
  { n: 4, color: '#EFE6FF', title: 'On s’occupe de tout', text: 'Sécurité, maintenance, modifications… tu envoies un message, on gère.' },
];

export const tech = [
  { kicker: 'Le site', title: 'Astro', text: 'Un framework moderne qui génère des pages ultra-légères : ton site se charge vite, et Google adore ça.', bg: '#8A4FFF', fg: '#fff' },
  { kicker: 'Ton espace d’édition', title: 'WordPress ou TinaCMS', text: 'Selon ton besoin, un back-office simple pour modifier tes textes et images toi-même… ou nous laisser faire.', bg: '#7EE08F', fg: '#17131F' },
  { kicker: 'En coulisses', title: 'Hébergé & entretenu', text: 'Hébergement, sauvegardes et mises à jour de sécurité : on s’en occupe, selon la formule choisie.', bg: '#F49B2A', fg: '#17131F' },
];

export const timeline = [
  { day: 'J0', text: 'Tu valides ton devis et tu nous envoies tes contenus' },
  { day: 'J1', text: 'On crée la maquette dans ton style' },
  { day: 'J2–4', text: 'On développe et on intègre tes contenus' },
  { day: 'J3–5', text: 'Ton site est en ligne 🎉' },
];

export const guarantees = [
  { icon: '↺', color: '#7EE08F', title: 'Avec ou sans engagement', text: 'Avec engagement, tu profites du meilleur tarif. Sans, tu gardes ta liberté. C’est toi qui choisis.' },
  { icon: '⚡', color: '#F49B2A', title: 'Livré en 3 à 5 jours', text: 'Délai garanti après validation de ton contenu. En retard ? Ton premier mois est offert.' },
  { icon: '🔒', color: '#EFE6FF', title: 'Paiement sécurisé', text: 'Prélèvement SEPA ou carte bancaire, via une plateforme certifiée.' },
];

// ⚠ Avis fictifs (maquette) : à remplacer par de vrais avis avant de passer SHOW_REVIEWS à true.
export const SHOW_REVIEWS = false;

export const reviews = [
  { quote: 'J’avais un devis à 2 400 € ailleurs. Avec Moyo, mon site était en ligne en 4 jours et je paie moins que mon forfait téléphone.', name: 'Lucas M.', role: 'Lucas Invest Immo', initials: 'LM', bg: '#EFE6FF', rot: '-1deg' },
  { quote: 'Je leur envoie un message pour changer mes horaires, c’est fait dans l’heure. Je ne pense plus du tout à mon site.', name: 'Sofia R.', role: 'Atelier Brume, céramiste', initials: 'SR', bg: '#7EE08F', rot: '.8deg' },
  { quote: 'Le site a tout de suite fait la différence sur Google. Et l’équipe est vraiment sympa, ce qui ne gâche rien.', name: 'Karim B.', role: 'TKL Miami', initials: 'KB', bg: '#FFE3BF', rot: '-.5deg' },
];

export const faq = [
  ['Avec ou sans engagement, quelle différence ?', 'Avec engagement, tu bénéficies d’un tarif mensuel préférentiel, avec une durée minimale fixée dans le contrat. Sans engagement, l’abonnement est majoré de 30 % et résiliable selon les modalités du contrat.'],
  ['Y a-t-il des frais de mise en service ?', 'Uniquement pour les offres sans engagement : 600 € fixes, payés au démarrage. Ils financent la conception et la mise en ligne de ton site. Avec engagement, 0 € au départ.'],
  ['Combien ça coûte ?', 'Avec l’engagement de 24 mois : Essentielle 44,99 €/mois, Standard 74,99 €/mois, Premium 144,99 €/mois. Sans engagement : 58,49 €, 97,49 € et 188,49 €/mois, plus 600 € de mise en service.'],
  ['En combien de temps mon site est-il en ligne ?', 'Notre délai cible est de 3 à 5 jours, dès qu’on a reçu tous les contenus nécessaires (textes, images, logo…).'],
  ['Avec quoi est fait mon site ?', 'Ton site est construit avec Astro, et tu disposes d’un espace d’édition WordPress ou TinaCMS selon ton besoin. Hébergement, maintenance et assistance dépendent de la formule choisie.'],
  ['Les modifications et la maintenance sont-elles incluses ?', 'Oui : maintenance de WordPress, du thème et des extensions, sauvegardes, mises à jour et contrôles de sécurité. Tu as aussi 60 minutes par mois de petites modifications de contenu (non reportées d’un mois à l’autre). Créations de pages, refontes et développements supplémentaires font l’objet d’un devis.'],
  ['Que se passe-t-il après 24 mois ?', 'Deux options : le gardiennage à 25,99 €/mois (hébergement, maintenance, 45 min d’assistance par mois, gestion du domaine) pour continuer à faire vivre ton site, ou le transfert à 490 € pour récupérer tes fichiers et contenus et partir chez l’hébergeur de ton choix.'],
  ['À qui appartient le nom de domaine ?', 'Il est enregistré à ton nom. On en assure simplement la gestion technique pendant la durée du service, et on t’accompagne s’il doit être transféré.'],
].map(([q, a]) => ({ q, a }));
