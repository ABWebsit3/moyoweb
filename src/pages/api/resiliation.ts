// Résiliation en ligne (« résiliation en 3 clics », art. L215-1-1 et D215-1 s. du Code de la consommation).
// Reçoit la notification, envoie un accusé de réception par e-mail (support durable) au client avec copie à Moyo,
// puis trace la demande dans l'agenda Dolibarr du tiers (au mieux : un échec Dolibarr ne bloque pas l'accusé).
import type { APIRoute } from 'astro';
import { json, str, EMAIL_RE, rateLimiter, dolibarrKey, findThirdpartyByEmail, smtpConfigured, sendMail, MAIL_FROM, addAgendaEvent } from '../../lib/server';

export const prerender = false;

const rateLimited = rateLimiter(5, 10 * 60 * 1000);

const FORMULES: Record<string, string> = {
  engagement: 'Formule avec engagement (24 mois)',
  'engagement-12': 'Formule avec engagement (12 mois)',
  'sans-engagement': 'Formule sans engagement',
  gardiennage: 'Formule Gardiennage',
  inconnue: 'Je ne sais pas',
};

const dateFr = (d: Date) =>
  d.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' });

async function logInDolibarr(email: string, label: string, note: string) {
  if (!dolibarrKey()) return;
  try {
    await addAgendaEvent(label, note, await findThirdpartyByEmail(email));
  } catch (err) {
    console.error('[resiliation] trace Dolibarr impossible :', err);
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!smtpConfigured()) {
    console.error('[resiliation] SMTP_PASSWORD manquant : impossible d’envoyer l’accusé de réception');
    return json(500, { ok: false, error: 'config' });
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: 'json' });
  }

  if (str(data.website, 200)) return json(200, { ok: true, notifiedAt: dateFr(new Date()) });
  if (rateLimited(clientAddress || 'unknown')) return json(429, { ok: false, error: 'rate' });

  const r = {
    nom: str(data.nom, 100),
    prenom: str(data.prenom, 100),
    structure: str(data.structure, 150),
    email: str(data.email, 254).toLowerCase(),
    site: str(data.site, 200),
    formule: FORMULES[str(data.formule, 30)] ?? FORMULES.inconnue,
    motif: str(data.motif, 2000),
  };
  if (!r.nom || !r.prenom || !r.structure || !r.site || !EMAIL_RE.test(r.email)) {
    return json(400, { ok: false, error: 'invalid' });
  }

  const notifiedAt = new Date();
  const recap = [
    `Date et heure de la notification : ${dateFr(notifiedAt)}`,
    `Nom : ${r.prenom} ${r.nom}`,
    `Entreprise ou association : ${r.structure}`,
    `E-mail : ${r.email}`,
    `Site concerné : ${r.site}`,
    `Formule : ${r.formule}`,
    `Motif (facultatif) : ${r.motif || '—'}`,
  ].join('\n');

  try {
    await sendMail({
      to: r.email,
      bcc: MAIL_FROM(),
      replyTo: MAIL_FROM(),
      subject: 'Moyo – Accusé de réception de ta demande de résiliation',
      text: [
        `Bonjour ${r.prenom},`,
        '',
        'Nous accusons réception de ta demande de résiliation, notifiée en ligne sur moyoweb.fr :',
        '',
        recap,
        '',
        'Nous te confirmerons par e-mail, dans les meilleurs délais, la date à laquelle ton contrat prendra fin',
        'et les effets de la résiliation (site désactivé et fichiers supprimés, ou, si tu le demandes avant cette date, transfert à 490 €),',
        'conformément aux conditions générales de vente : https://moyoweb.fr/cgv/',
        '',
        'Une question ? Réponds simplement à cet e-mail.',
        '',
        'L’équipe Moyo',
      ].join('\n'),
    });
  } catch (err) {
    console.error('[resiliation] envoi de l’accusé de réception impossible :', err);
    return json(502, { ok: false, error: 'mail' });
  }

  await logInDolibarr(r.email, `Demande de résiliation en ligne – ${r.structure}`, recap);

  return json(200, { ok: true, notifiedAt: dateFr(notifiedAt) });
};
