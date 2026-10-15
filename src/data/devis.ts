// Données du module de devis.
// Prix sans engagement = prix avec engagement × 1,3 (arrondi au centime).
// ⚠ La majoration « sans engagement » ne s'applique qu'au forfait, pas aux options (à confirmer).

export type PlanId = 'starter' | 'pro' | 'elite';

export interface Plan {
  id: PlanId;
  name: string;
  tag: string;
  price: number; // avec engagement 24 mois
  free: number; // sans engagement
  color: string;
  ink: string;
  rule: string;
  popular?: boolean;
  desc: string;
  feats: string[];
}

export interface Option {
  id: string;
  name: string;
  desc: string;
  price: number;
  color: string;
  unit?: boolean;
  inc?: Partial<Record<PlanId, number>>;
}

export const SETUP_FEE = 600;
export const SEO_OPTION_ID = 'seo';

export const PLANS: Plan[] = [
  { id: 'starter', name: 'Essentielle', tag: 'Site vitrine essentiel', price: 44.99, free: 58.49, color: '#7EE08F', ink: '#17131F', rule: '#17131F55',
    desc: 'Parfait pour te lancer sans exploser ton budget. Un site propre, beau, rapide… bref, un site qui envoie du pixel.',
    feats: ['1 site vitrine 1–3 pages', 'Design personnalisé', 'Formulaire de contact', 'Nom de domaine + hébergement inclus', 'Maintenance + sécurité', '60 min/mois de modifications', 'Support Moyo-friendly'] },
  { id: 'pro', name: 'Standard', tag: 'Site vitrine plus complet', price: 74.99, free: 97.49, color: '#8A4FFF', ink: '#FFFFFF', rule: '#FFFFFF77', popular: true,
    desc: 'Plus complet, plus impactant, plus “wow”. Idéal pour les indépendants qui veulent un site qui convertit.',
    feats: ['1 site 1–6 pages', 'Design premium', 'Formulaire de contact', 'Nom de domaine + hébergement inclus', 'SEO de base', 'Maintenance + sécurité + optimisation', '60 min/mois de modifications', 'Support Moyo-friendly'] },
  { id: 'elite', name: 'Premium', tag: 'Site avec besoins avancés', price: 144.99, free: 188.49, color: '#F49B2A', ink: '#17131F', rule: '#17131F55',
    desc: 'La version luxe du leasing. Ton site est une machine de guerre et tu n’as rien à gérer.',
    feats: ['Site complet 1–10 pages', 'Design sur-mesure', 'Formulaire de contact', 'Intégration API / automatisations', 'Nom de domaine + hébergement inclus', 'SEO premium', 'Maintenance + sécurité + optimisation', '60 min/mois de modifications', 'Support Moyo-friendly'] },
];

export const OPTS: Option[] = [
  { id: 'ecom', name: 'E-commerce', desc: 'Un module pour vendre tes produits. Création des produits et configuration avec la banque incluses.', price: 66.99, color: '#F49B2A' },
  { id: 'seo', name: 'Articles SEO', desc: 'Articles de blog optimisés pour le référencement naturel.', price: 6.99, unit: true, color: '#7EE08F', inc: { starter: 0, pro: 3, elite: 6 } },
  { id: 'multi', name: 'Site multilingue', desc: 'Ton site en plusieurs langues (une langue incluse, frais possibles par langue en plus).', price: 16.99, color: '#8A4FFF', inc: { pro: 1, elite: 1 } },
  { id: 'resa', name: 'Système de réservation', desc: 'Calendrier de réservation en ligne pour tes rendez-vous.', price: 20.99, color: '#8A4FFF' },
  { id: 'chat', name: 'Chat Messenger / WhatsApp', desc: 'Tes visiteurs te contactent en un clic via Messenger ou WhatsApp.', price: 5.99, color: '#7EE08F' },
  { id: 'feed', name: 'Fil d’actualités', desc: 'Affiche tes derniers posts Instagram / Facebook.', price: 15.99, color: '#F49B2A' },
  { id: 'logo', name: 'Création de logo', desc: 'Un logo tout beau tout neuf !', price: 39.99, color: '#F49B2A' },
  { id: 'gmb', name: 'Google My Business', desc: 'Une fiche établissement visible directement dans les recherches Google.', price: 4.99, color: '#7EE08F' },
  { id: 'news', name: 'Newsletter / Emailing', desc: 'Un envoi par mois pour tenir tes clients au courant de tes promos.', price: 34.99, color: '#8A4FFF' },
  { id: 'seag', name: 'SEA (Google)', desc: 'Mise en place de ta visibilité payante sur Google.', price: 11.99, color: '#7EE08F' },
  { id: 'seaf', name: 'SEA (Facebook)', desc: 'Mise en place de ta visibilité payante sur Facebook.', price: 11.99, color: '#8A4FFF' },
  { id: 'ana', name: 'Rapport Analytics', desc: 'Suis le nombre de visites sur ton site, et plus encore.', price: 3.99, color: '#F49B2A', inc: { pro: 1, elite: 1 } },
];

// Contenu affiché d'un forfait : ses caractéristiques + les options incluses (dérivées de OPTS[].inc).
export function planFeats(plan: Plan): string[] {
  const extra = OPTS.flatMap((o) => {
    const n = o.inc?.[plan.id] ?? 0;
    if (n <= 0) return [];
    if (o.id === SEO_OPTION_ID) return [`${n} article${n > 1 ? 's' : ''} SEO inclus`];
    return [`${o.name} inclus`];
  });
  return [...plan.feats, ...extra];
}
