// Informations légales de Moyo, utilisées par les pages Mentions légales, CGV et Confidentialité.
// Tout champ laissé vide s'affiche « À compléter » (surligné) sur les pages.
// Source : synthèse INPI de la formalité J00273351262 (validée le 19/08/2026).

export const company = {
  name: 'ABweb', // Entreprise qui édite le site et vend les offres
  brand: 'Moyo', // Nom du service proposé par ABweb
  owner: 'Alexandre Bailot', // Entrepreneur individuel (mention « EI » obligatoire à côté du nom)
  legalForm: 'Entrepreneur individuel (micro-entreprise)',
  address: '1 route de Sainte-Valière, 11120 Ventenac-en-Minervois',
  siren: '842 923 658',
  siret: '842 923 658 00053', // Établissement principal actuel (le 00046, à Narbonne, est fermé)
  ape: '6201Z',
  registry: 'Immatriculée au Registre national des entreprises (RNE)',
  phone: '07 67 62 82 88',
  email: 'hello@moyoweb.fr',
  publicationDirector: 'Alexandre Bailot',
  vatMention: 'TVA non applicable, art. 293 B du CGI',
};

// Hostinger : entité et adresse issues de ses conditions générales (contrat avec les clients de l'UE).
export const host = {
  name: 'Hostinger International Ltd',
  address: '61 Lordou Vironos Street, 6023 Larnaca, Chypre',
  phone: '', // Hostinger ne communique pas de numéro de téléphone : la ligne n'est pas affichée
};

// Prestataires techniques cités dans la politique de confidentialité.
export const crm = {
  host: 'Hostinger International Ltd', // CRM Dolibarr (doli.agence-abweb.fr)
};
export const mail = {
  host: 'Hostinger International Ltd', // Messagerie hello@moyoweb.fr
};

// Médiateur de la consommation (obligatoire dès lors que des particuliers peuvent souscrire, art. L612-1 C. conso).
// À choisir parmi les médiateurs référencés par la CECMC, puis à renseigner ici.
export const mediator = {
  name: '',
  address: '',
  url: '',
};

export const legalUpdatedAt = '12 octobre 2026';
