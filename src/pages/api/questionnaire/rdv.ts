// Appelée par la page de devis quand le calendrier Calendly intégré signale une réservation
// (événement navigateur « calendly.event_scheduled », disponible sur tous les plans Calendly).
// Envoie au prospect le lien de son questionnaire pré-RDV, passe le statut à « envoye » et trace le RDV dans l'agenda.
// Idempotent : si le questionnaire a déjà été envoyé ou rempli, rien n'est renvoyé.
import type { APIRoute } from 'astro';
import { json, str, rateLimiter, dolibarrKey, smtpConfigured, sendMail, MAIL_FROM, addAgendaEvent } from '../../../lib/server';
import { thirdpartyFromToken, updateQuestionnaireFields, questionnaireUrl } from '../../../lib/questionnaire';

export const prerender = false;

const rateLimited = rateLimiter(10, 10 * 60 * 1000);
const CALENDLY_URI_RE = /^https:\/\/api\.calendly\.com\/scheduled_events\/[A-Za-z0-9-]+(\/invitees\/[A-Za-z0-9-]+)?$/;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!dolibarrKey()) return json(500, { ok: false, error: 'config' });
  if (rateLimited(clientAddress || 'unknown')) return json(429, { ok: false, error: 'rate' });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: 'json' });
  }

  const token = str(data.qt, 80);
  const inviteeUri = str(data.invitee, 200);

  let t;
  try {
    t = await thirdpartyFromToken(token);
  } catch (err) {
    console.error('[questionnaire/rdv] lecture Dolibarr impossible :', err);
    return json(502, { ok: false, error: 'crm' });
  }
  if (!t) return json(404, { ok: false, error: 'not_found' });

  const url = questionnaireUrl(token);
  if (t.statut) return json(200, { ok: true, url, alreadySent: true });

  let mailed = false;
  if (smtpConfigured() && t.email) {
    try {
      await sendMail({
        to: t.email,
        replyTo: MAIL_FROM(),
        subject: 'Ton rendez-vous Moyo est pris – 3 minutes pour le préparer',
        text: [
          'Bonjour,',
          '',
          'Merci, ton rendez-vous avec Moyo est bien réservé ! Tu recevras la confirmation de Calendly avec la date et le lien.',
          '',
          'Pour qu’on prépare au mieux notre échange, prends 3 à 5 minutes pour répondre à ce petit questionnaire :',
          url,
          '',
          'Pas besoin d’avoir toutes les réponses : on affinera tout ensemble pendant le rendez-vous.',
          '',
          'À très vite,',
          'L’équipe Moyo',
        ].join('\n'),
      });
      mailed = true;
    } catch (err) {
      console.error('[questionnaire/rdv] e-mail impossible :', err);
    }
  }

  try {
    await updateQuestionnaireFields(t.id, { statut: 'envoye' });
    await addAgendaEvent(
      'RDV pris via Calendly (depuis le devis en ligne)',
      [
        'Rendez-vous réservé depuis le calendrier intégré au devis sur moyoweb.fr.',
        'Date et heure : voir Calendly.',
        CALENDLY_URI_RE.test(inviteeUri) ? `Référence Calendly : ${inviteeUri}` : '',
        `Questionnaire pré-RDV ${mailed ? 'envoyé par e-mail' : 'affiché à l’écran (e-mail non envoyé)'} : ${url}`,
      ]
        .filter(Boolean)
        .join('\n'),
      t.id,
    );
  } catch (err) {
    console.error('[questionnaire/rdv] mise à jour Dolibarr impossible :', err);
  }

  return json(200, { ok: true, url, mailed });
};
