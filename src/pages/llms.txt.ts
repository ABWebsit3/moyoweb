// llms.txt (format https://llmstxt.org) : résumé du site pour les assistants IA, généré au build
// à partir des mêmes données que les pages (offres, options, FAQ).
import type { APIRoute } from 'astro';
import { PLANS, OPTS, SETUP_FEE, planFeats } from '../data/devis';
import { faq, clients, CONTACT_EMAIL } from '../data/site';
import { company } from '../data/legal';

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

export const GET: APIRoute = ({ site }) => {
  const url = (p: string) => new URL(p, site).toString();
  const text = `# Moyo

> Moyo crée des sites internet professionnels en location mensuelle pour les professionnels et les associations : site livré clé en main en 3 à 5 jours ouvrés, hébergé, sécurisé et maintenu, dès ${eur(PLANS[0].price)}/mois avec engagement de 24 mois, ou sans engagement. Moyo est un service d'${company.name} (France).

- Clientèle : professionnels (indépendants, entreprises) et associations uniquement, pas les particuliers.
- Inclus dans tous les forfaits : hébergement, nom de domaine au nom du client, maintenance et sécurité, 60 minutes de petites modifications par mois.
- Technologies : sites construits avec Astro, espace d'édition WordPress ou TinaCMS selon le besoin.
- ${company.vatMention}.
- Contact : ${CONTACT_EMAIL}

## Forfaits

${PLANS.map((p) => `- Offre ${p.name} (${p.tag}) : ${eur(p.price)}/mois avec engagement 24 mois, ${eur(p.free)}/mois sans engagement (+ ${eur(SETUP_FEE)} de mise en service). Inclus : ${planFeats(p).map((f) => f.replace(/ inclus$/, '')).join(', ')}.`).join('\n')}

Après 24 mois : formule Gardiennage à 25,99 €/mois, transfert du site à 490 € ou arrêt du service.

## Options (prix mensuels, sauf articles SEO)

${OPTS.map((o) => `- ${o.name} : ${eur(o.price)}${o.unit ? ' par article (paiement unique)' : '/mois'}. ${o.desc}`).join('\n')}

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
