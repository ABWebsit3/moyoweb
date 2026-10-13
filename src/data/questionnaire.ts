// Questionnaire pré-rendez-vous Moyo (3–5 min), envoyé après la prise de RDV.
// Modifier ici les questions sans toucher au code : id (unique, stable), libellé, type, obligatoire, choix.
// Un choix avec `detail` affiche un champ texte pour préciser quand il est sélectionné.

export type QuestionType = 'text' | 'textarea' | 'radio';

export interface Choice {
  value: string;
  label: string;
  detail?: string; // libellé du champ de précision
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  placeholder?: string;
  choices?: Choice[];
  prefill?: 'company'; // pré-rempli avec les infos du tiers Dolibarr
  maxLength?: number;
}

export const QUESTIONNAIRE_TITLE = 'Parlons de ton futur site !';
export const QUESTIONNAIRE_INTRO =
  'Un petit questionnaire (3 à 5 minutes) pour préparer notre rendez-vous et mieux comprendre ton projet. Pas besoin d’avoir toutes les réponses : on affinera tout ensemble !';
export const QUESTIONNAIRE_NOTE =
  'Ce questionnaire sert à préparer l’échange, pas à figer le cahier des charges.';

export const QUESTIONS: Question[] = [
  { id: 'entreprise', label: 'Quel est le nom de ton entreprise ?', type: 'text', required: true, prefill: 'company', maxLength: 150 },
  { id: 'activite', label: 'Que fait ton entreprise ?', type: 'textarea', required: true, maxLength: 1500 },
  {
    id: 'site_existant',
    label: 'As-tu déjà un site internet ?',
    type: 'radio',
    choices: [
      { value: 'non', label: 'Non, je pars de zéro' },
      { value: 'moderniser', label: 'Oui, je souhaite le moderniser', detail: 'Adresse du site actuel' },
      { value: 'ameliorer', label: 'Oui, je souhaite l’améliorer', detail: 'Adresse du site actuel' },
      { value: 'particulier', label: 'J’ai un projet particulier', detail: 'Lequel ?' },
    ],
  },
  {
    id: 'objectif',
    label: 'Quel est l’objectif principal de ton futur site ?',
    type: 'radio',
    required: true,
    choices: [
      { value: 'contacts', label: 'Recevoir plus de demandes de contact ou de devis' },
      { value: 'vendre', label: 'Vendre mes produits ou services' },
      { value: 'reserver', label: 'Permettre aux clients de réserver ou prendre rendez-vous' },
      { value: 'visibilite', label: 'Présenter mon activité et gagner en visibilité' },
      { value: 'autre', label: 'Autre objectif', detail: 'Lequel ?' },
    ],
  },
  {
    id: 'public',
    label: 'À qui t’adresses-tu principalement ?',
    type: 'radio',
    choices: [
      { value: 'particuliers', label: 'Aux particuliers' },
      { value: 'professionnels', label: 'Aux professionnels' },
      { value: 'les_deux', label: 'Aux deux' },
      { value: 'autre', label: 'Autre public', detail: 'Lequel ?' },
    ],
  },
  { id: 'offre', label: 'Quels services ou produits souhaites-tu mettre en avant ?', type: 'textarea', maxLength: 1500 },
  {
    id: 'style',
    label: 'Quel style te correspond le mieux ?',
    type: 'radio',
    choices: [
      { value: 'epure', label: 'Moderne et épuré' },
      { value: 'haut_de_gamme', label: 'Élégant et haut de gamme' },
      { value: 'chaleureux', label: 'Chaleureux et humain' },
      { value: 'audacieux', label: 'Audacieux et créatif' },
      { value: 'naturel', label: 'Naturel et authentique' },
      { value: 'ouvert', label: 'Je ne sais pas encore, je suis ouvert aux propositions' },
    ],
  },
  { id: 'inspiration', label: 'As-tu un site ou une marque qui t’inspire ?', type: 'textarea', placeholder: 'Une adresse, un nom… et ce qui te plaît', maxLength: 1000 },
  {
    id: 'delai',
    label: 'Quand aimerais-tu que ton site soit en ligne ?',
    type: 'radio',
    choices: [
      { value: 'vite', label: 'Dès que possible' },
      { value: 'mois', label: 'Dans le mois à venir' },
      { value: 'libre', label: 'Je n’ai pas de date précise' },
      { value: 'date', label: 'J’ai une date importante à respecter', detail: 'Laquelle ?' },
    ],
  },
  { id: 'autre', label: 'Y a-t-il une chose importante que nous devrions savoir avant notre rendez-vous ?', type: 'textarea', maxLength: 2000 },
];

export const DETAIL_MAX = 300;
