// Relais serveur : reçoit une demande de devis, la crée dans Dolibarr et envoie les e-mails
// (notification à Moyo + ticket au client avec le lien de prise de rendez-vous).
// La clé API reste côté serveur (variable d'environnement DOLIBARR_API_KEY), jamais dans le navigateur.
//
// Dans Dolibarr : retrouve le tiers par e-mail (ou le crée en prospect), ajoute un contact si une société
// est renseignée, puis crée une proposition commerciale en brouillon avec les lignes du devis.
import type { APIRoute } from 'astro';
import { OPTS, SEO_OPTION_ID, type PlanId } from '../../data/devis';
import { computeQuote, findPlan, type Quote } from '../../lib/quote';
import { json, str, EMAIL_RE, rateLimiter, dolibarr, dolibarrKey, findThirdpartyByEmail, smtpConfigured, sendMail, MAIL_FROM } from '../../lib/server';
import { CALENDLY_URL } from '../../data/site';
import { ensureToken } from '../../lib/questionnaire';

export const prerender = false;

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

// 5 demandes max par IP sur 10 minutes.
const rateLimited = rateLimiter(5, 10 * 60 * 1000);

interface Contact {
  nom: string;
  prenom: string;
  societe: string;
  email: string;
}

async function findOrCreateThirdparty(c: Contact): Promise<{ id: number; created: boolean }> {
  const existing = await findThirdpartyByEmail(c.email);
  if (existing) return { id: existing, created: false };

  const id = await dolibarr<number>('POST', '/thirdparties', {
    name: c.societe || `${c.prenom} ${c.nom}`,
    email: c.email,
    client: '2', // prospect
    code_client: '-1', // code généré selon la numérotation configurée dans Dolibarr
  });
  return { id: Number(id), created: true };
}

function proposalLines(q: Quote) {
  const engagement = q.engage ? 'engagement 24 mois' : 'sans engagement';
  const service = { product_type: 1, tva_tx: 0 }; // service, TVA non applicable (art. 293 B du CGI)
  const lines = [
    { ...service, desc: `Offre ${q.plan.name} – abonnement mensuel (${engagement})`, qty: 1, subprice: q.planPrice },
  ];
  if (q.setupFee) lines.push({ ...service, desc: 'Mise en service (paiement unique au démarrage)', qty: 1, subprice: q.setupFee });

  for (const l of q.lines) {
    if (l.id === SEO_OPTION_ID) {
      const included = l.qty - l.billedQty;
      const detail = included ? ` (${included} inclus dans le forfait)` : '';
      if (l.billedQty) {
        lines.push({ ...service, desc: `Option – Articles SEO supplémentaires, mensuel${detail}`, qty: l.billedQty, subprice: l.unitPrice });
      } else {
        lines.push({ ...service, desc: `Option – Articles SEO ×${l.qty} (inclus dans le forfait)`, qty: 1, subprice: 0 });
      }
    } else if (l.included) {
      lines.push({ ...service, desc: `Option – ${l.name} (incluse dans le forfait)`, qty: 1, subprice: 0 });
    } else {
      lines.push({ ...service, desc: `Option – ${l.name}, mensuel`, qty: 1, subprice: l.unitPrice });
    }
  }
  return lines;
}

// --- Enregistrement Dolibarr --------------------------------------------------
async function saveInDolibarr(contact: Contact, quote: Quote, ticketNo: string): Promise<number> {
  const thirdparty = await findOrCreateThirdparty(contact);

  if (thirdparty.created && contact.societe) {
    await dolibarr('POST', '/contacts', {
      socid: thirdparty.id,
      lastname: contact.nom,
      firstname: contact.prenom,
      email: contact.email,
    });
  }

  const notes = [
    `Demande de devis en ligne (moyoweb.fr) ${ticketNo}`.trim(),
    `Contact : ${contact.prenom} ${contact.nom}${contact.societe ? ` – ${contact.societe}` : ''} <${contact.email}>`,
    `Formule : ${quote.plan.name}, ${quote.engage ? 'engagement 24 mois' : 'sans engagement'}`,
    `Total mensuel : ${eur(quote.totalMonthly)}/mois${quote.setupFee ? ` + ${eur(quote.setupFee)} de mise en service au démarrage` : ''}`,
    'Attention : le total de la proposition additionne mensualités et frais uniques.',
  ].join('\n');

  const proposalId = await dolibarr<number>('POST', '/proposals', {
    socid: thirdparty.id,
    date: Math.floor(Date.now() / 1000),
    note_private: notes,
  });

  for (const line of proposalLines(quote)) {
    await dolibarr('POST', `/proposals/${proposalId}/line`, line);
  }
  return thirdparty.id;
}

// --- E-mails -----------------------------------------------------------------
function ticketText(quote: Quote, ticketNo: string) {
  const rows = [
    `Devis ${ticketNo} – ${new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}`,
    '',
    `Forfait : Offre ${quote.plan.name} (${quote.engage ? 'engagement 24 mois' : 'sans engagement'}) – ${eur(quote.planPrice)}/mois`,
  ];
  if (quote.setupFee) rows.push(`Mise en service (une fois, au démarrage) : ${eur(quote.setupFee)}`);
  rows.push('', 'Options :');
  if (!quote.lines.length) rows.push('  – aucune option –');
  for (const l of quote.lines) rows.push(`  • ${l.name} : ${l.included ? 'inclus' : `${eur(l.total)}/mois`}`);
  rows.push('', `TOTAL : ${eur(quote.totalMonthly)}/mois`);
  if (quote.setupFee) rows.push(`À payer au démarrage : ${eur(quote.setupFee)}`);
  rows.push(
    'TVA non applicable, art. 293 B du CGI.',
    quote.engage
      ? 'Engagement initial de 24 mois. Ensuite : gardiennage 25,99 €/mois ou transfert 490 €.'
      : 'Sans engagement, résiliable selon les conditions générales de vente.',
    'Hébergement, nom de domaine et maintenance inclus.',
  );
  return rows.join('\n');
}

async function sendQuoteEmails(contact: Contact, quote: Quote, ticketNo: string, crmOk: boolean) {
  const ticket = ticketText(quote, ticketNo);
  let ownerOk = false;
  let clientOk = false;

  try {
    await sendMail({
      to: MAIL_FROM(),
      replyTo: contact.email,
      subject: `Nouveau devis : ${contact.societe || `${contact.prenom} ${contact.nom}`} – ${quote.plan.name} – ${eur(quote.totalMonthly)}/mois`,
      text: [
        crmOk
          ? '✓ Enregistré dans Dolibarr (tiers + proposition commerciale en brouillon).'
          : '⚠ Échec de l’enregistrement dans Dolibarr : à saisir à la main (voir les logs du serveur).',
        '',
        `Contact : ${contact.prenom} ${contact.nom}`,
        `Société / association : ${contact.societe || '—'}`,
        `E-mail : ${contact.email}`,
        '',
        ticket,
        '',
        'Réponds directement à cet e-mail pour écrire au client.',
      ].join('\n'),
    });
    ownerOk = true;
  } catch (err) {
    console.error('[devis] e-mail de notification impossible :', err);
  }

  try {
    await sendMail({
      to: contact.email,
      replyTo: MAIL_FROM(),
      subject: `Ton devis Moyo : Offre ${quote.plan.name} – ${eur(quote.totalMonthly)}/mois`,
      text: [
        `Bonjour ${contact.prenom},`,
        '',
        'Merci pour ta demande ! Voici le récapitulatif de ton devis :',
        '',
        ticket,
        '',
        'Ce devis est une première esquisse : il sert à te donner une idée générale. Après un premier échange',
        'avec notre équipe, on pourra peaufiner les chiffres et ajuster les options à tes besoins.',
        '',
        `On en parle ? Réserve un créneau de 30 minutes : ${CALENDLY_URL}`,
        '',
        'Conditions générales de vente : https://moyoweb.fr/cgv/',
        'Une question ? Réponds simplement à cet e-mail.',
        '',
        'L’équipe Moyo',
      ].join('\n'),
    });
    clientOk = true;
  } catch (err) {
    console.error('[devis] e-mail au client impossible :', err);
  }

  return { ownerOk, clientOk };
}

// --- Route -------------------------------------------------------------------
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!dolibarrKey() && !smtpConfigured()) {
    console.error('[devis] ni DOLIBARR_API_KEY ni SMTP_PASSWORD : la demande ne peut être ni enregistrée ni transmise');
    return json(500, { ok: false, error: 'config' });
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: 'json' });
  }

  // Champ piège invisible : un robot le remplit, un humain non. On répond « ok » sans rien créer.
  if (str(data.website, 200)) return json(200, { ok: true });

  if (rateLimited(clientAddress || 'unknown')) return json(429, { ok: false, error: 'rate' });

  const raw = (data.contact ?? {}) as Record<string, unknown>;
  const contact: Contact = {
    nom: str(raw.nom, 100),
    prenom: str(raw.prenom, 100),
    societe: str(raw.societe, 150),
    email: str(raw.email, 254).toLowerCase(),
  };
  const plan = str(data.plan, 20);
  const seo = data.seo == null ? null : Math.min(100, Math.max(0, Math.floor(Number(data.seo)) || 0));
  const selected = Array.isArray(data.selected)
    ? data.selected.filter((id): id is string => typeof id === 'string' && OPTS.some((o) => o.id === id))
    : [];

  if (!contact.nom || !contact.prenom || !EMAIL_RE.test(contact.email) || data.consent !== true || !findPlan(plan)) {
    return json(400, { ok: false, error: 'invalid' });
  }

  const quote = computeQuote({ plan: plan as PlanId, engage: data.engage !== false, selected, seo });
  const ticketNo = str(data.ticketNo, 40);

  // Rien ne doit se perdre : Dolibarr et e-mails sont tentés indépendamment.
  let crmOk = false;
  let socid = 0;
  if (dolibarrKey()) {
    try {
      socid = await saveInDolibarr(contact, quote, ticketNo);
      crmOk = true;
    } catch (err) {
      console.error('[devis] échec de l’envoi vers Dolibarr :', err);
    }
  }

  // Lien du questionnaire pré-RDV (envoyé seulement une fois le rendez-vous pris, voir /api/questionnaire/rdv).
  let qt = '';
  if (socid) {
    try {
      qt = await ensureToken(socid);
    } catch (err) {
      console.error('[devis] token questionnaire impossible (attributs supplémentaires créés dans Dolibarr ?) :', err);
    }
  }

  const mails = smtpConfigured() ? await sendQuoteEmails(contact, quote, ticketNo, crmOk) : { ownerOk: false, clientOk: false };

  if (!crmOk && !mails.ownerOk) return json(502, { ok: false, error: 'crm' });
  return json(200, { ok: true, mailed: mails.clientOk, qt });
};
