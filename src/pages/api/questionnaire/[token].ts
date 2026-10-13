// Réception du questionnaire pré-RDV : valide les réponses, joint un récapitulatif HTML aux Documents du tiers,
// passe le statut à « rempli », ajoute un événement Agenda et notifie Moyo par e-mail.
// Une seule soumission : si le statut est déjà « rempli », la demande est refusée (409).
import type { APIRoute } from 'astro';
import { json, str, rateLimiter, dolibarr, dolibarrKey, smtpConfigured, sendMail, MAIL_FROM, addAgendaEvent } from '../../../lib/server';
import { thirdpartyFromToken, updateQuestionnaireFields, validateAnswers, answersHtml, answersText } from '../../../lib/questionnaire';

export const prerender = false;

const rateLimited = rateLimiter(5, 10 * 60 * 1000);

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  if (!dolibarrKey()) return json(500, { ok: false, error: 'config' });
  if (rateLimited(clientAddress || 'unknown')) return json(429, { ok: false, error: 'rate' });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: 'json' });
  }
  if (str(data.website, 200)) return json(200, { ok: true });

  let t;
  try {
    t = await thirdpartyFromToken(String(params.token ?? ''));
  } catch (err) {
    console.error('[questionnaire] lecture Dolibarr impossible :', err);
    return json(502, { ok: false, error: 'crm' });
  }
  if (!t) return json(404, { ok: false, error: 'not_found' });
  if (t.statut === 'rempli') return json(409, { ok: false, error: 'already' });

  const answers = validateAnswers(data);
  if (!answers) return json(400, { ok: false, error: 'invalid' });

  const now = new Date();
  const dateFr = now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short' });
  const stamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const text = answersText(answers);

  // Le document joint est la trace principale : s'il échoue, la soumission échoue (rien n'est perdu côté visiteur).
  try {
    await dolibarr('POST', '/documents/upload', {
      filename: `questionnaire-pre-rdv-${stamp}.html`,
      modulepart: 'societe',
      ref: String(t.id),
      filecontent: Buffer.from(answersHtml(answers, { name: t.name, email: t.email }, dateFr)).toString('base64'),
      fileencoding: 'base64',
      overwriteifexists: 1,
    });
    await updateQuestionnaireFields(t.id, { statut: 'rempli', date: Math.floor(now.getTime() / 1000) });
  } catch (err) {
    console.error('[questionnaire] enregistrement Dolibarr impossible :', err);
    return json(502, { ok: false, error: 'crm' });
  }

  try {
    await addAgendaEvent('Questionnaire pré-RDV rempli', text.slice(0, 5000), t.id);
  } catch (err) {
    console.error('[questionnaire] événement Agenda impossible :', err);
  }

  if (smtpConfigured()) {
    try {
      await sendMail({
        to: MAIL_FROM(),
        replyTo: t.email || undefined,
        subject: `Questionnaire pré-RDV rempli : ${t.name}`,
        text: [`${t.name} <${t.email}> a rempli son questionnaire le ${dateFr}.`, 'Le récapitulatif est joint à sa fiche tiers dans Dolibarr.', '', text].join('\n'),
      });
    } catch (err) {
      console.error('[questionnaire] e-mail de notification impossible :', err);
    }
  }

  return json(200, { ok: true });
};
