// Informations légales de Moyo, utilisées par les pages Mentions légales, CGV et Confidentialité.
// Tout champ laissé vide s'affiche « À compléter » (surligné) sur les pages.

export const company = {
  name: '', // Nom commercial / raison sociale, ou nom et prénom de l'entrepreneur
  legalForm: '', // ex. Entrepreneur individuel (micro-entreprise), SASU, EURL…
  address: '', // Adresse du siège / domicile professionnel
  siren: '',
  siret: '',
  registry: '', // ex. Immatriculé au RNE / RCS de … (si applicable)
  phone: '',
  email: 'hello@moyoweb.fr',
  publicationDirector: '', // Directeur ou directrice de la publication
  vatMention: 'TVA non applicable, art. 293 B du CGI',
};

export const host = {
  name: '', // Hébergeur du site (ex. o2switch, OVH, Netlify…)
  address: '',
  phone: '',
};

export const crm = {
  // Le CRM Dolibarr reçoit les demandes de devis : où est-il hébergé ?
  host: '',
};

export const legalUpdatedAt = '12 octobre 2026';
