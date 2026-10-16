// llms.txt (format https://llmstxt.org) : résumé du site pour les assistants IA, généré au build
// à partir des mêmes données que les pages (offres, options, FAQ).
import type { APIRoute } from 'astro';
import { PLANS, OPTS, PRICE_SUFFIX, VAT_MENTION, planFeats } from '../data/devis';
import { faq, clients, CONTACT_EMAIL } from '../data/site';
import { company } from '../data/legal';

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

export const GET: APIRoute = ({ site }) => {
  const url = (p: string) => new URL(p, site).toString();
  const text = `# Moyo

> Moyo crée des sites internet professionnels en location mensuelle pour les professionnels et les associations : site livré clé en main en 3 à 5 jours ouvrés, hébergé, sécurisé et maintenu, dès ${eur(PLANS[0].price)} ${PRICE_SUFFIX}/mois avec engagement de 24 mois, avec un engagement de 12 mois ou sans engagement. Moyo est un service d'${company.name} (France).

- Clientèle : professionnels (indépendants, entreprises) et associations uniquement, pas les particuliers.
- Inclus dans tous les forfaits : hébergement, nom de domaine au nom du client, maintenance et sécurité, 60 minutes de petites modifications par mois.
- Technologies : sites construits avec Astro, espace d'édition WordPress ou TinaCMS selon le besoin.
- Prix ${PRICE_SUFFIX} : ${VAT_MENTION} (le prix affiché est le prix payé).
- Contact : ${CONTACT_EMAIL}

## Forfaits

${PLANS.map((p) => `- Offre ${p.name} (${p.tag}) : ${eur(p.price)} ${PRICE_SUFFIX}/mois avec engagement 24 mois (0 € de frais), ${eur(p.p12)} ${PRICE_SUFFIX}/mois avec engagement 12 mois (0 € de frais), ${eur(p.free)} ${PRICE_SUFFIX}/mois sans engagement (0 € de frais). Inclus : ${planFeats(p).map((f) => f.replace(/ inclus$/, '')).join(', ')}.`).join('\n')}

- Après l'engagement de 24 mois : formule Gardiennage à 25,99 € ${PRICE_SUFFIX}/mois, transfert du site à 199 € ou arrêt du service.
- Après l'engagement de 12 mois : l'abonnement continue au mois au même tarif, résiliable avec un préavis d'un mois (transfert du site possible à 199 €).
- Sans engagement : résiliable à tout moment avec un préavis d'un mois (transfert du site possible à 499 €).

## Options (prix mensuels TTC, sauf articles SEO)

${OPTS.map((o) => {
  const inc = PLANS.filter((p) => (o.inc?.[p.id] ?? 0) > 0);
  const incTxt = inc.length ? ` Inclus en ${inc.map((p) => (o.unit ? `${p.name} (${o.inc?.[p.id]})` : p.name)).join(' et ')}.` : '';
  return `- ${o.name} : ${eur(o.price)}${o.unit ? ' par article (paiement unique)' : '/mois'}. ${o.desc}${incTxt}`;
}).join('\n')}

## Questions fréquentes

${faq.map((q) => `- ${q.q} ${q.a}`).join('\n')}

## Pages

- [Accueil et calcul de devis](${url('/')}): présentation de l'offre, comparatif, réalisations (${clients.join(', ')}) et calculateur de devis en ligne.
- [Conditions générales de vente](${url('/cgv/')}): durée, engagement, résiliation, paiement, propriété du site.
- [Mentions légales](${url('/mentions-legales/')}): éditeur et hébergeur.
- [Politique de confidentialité](${url('/confidentialite/')}): données personnelles et cookies.

## Optional

- [Résilier ton contrat](${url('/resiliation/')}): résiliation en ligne.
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
