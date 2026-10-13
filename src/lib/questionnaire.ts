// Questionnaire pré-RDV, côté serveur. Dolibarr est l'unique stockage :
// - attributs supplémentaires du tiers : questionnaire_token, questionnaire_url, questionnaire_statut, questionnaire_date ;
// - réponses : document HTML joint au tiers + événement Agenda.
// Token : « <id du tiers>.<32 caractères aléatoires> », comparé en temps constant à la valeur stockée sur le tiers.
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { dolibarr } from './server';
import { QUESTIONS, DETAIL_MAX, type Question } from '../data/questionnaire';

const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://moyoweb.fr').replace(/\/+$/, '');
const TOKEN_RE = /^(\d{1,10})\.([A-Za-z0-9_-]{32})$/;

export type Statut = '' | 'envoye' | 'rempli';

export interface Thirdparty {
  id: number;
  name: string;
  email: string;
  token: string;
  statut: Statut;
}

export const questionnaireUrl = (token: string) => `${SITE_URL}/questionnaire/${token}`;

export function newToken(socid: number) {
  return `${socid}.${randomBytes(24).toString('base64url')}`;
}

export function parseToken(token: string): number | null {
  const m = TOKEN_RE.exec(token);
  return m ? Number(m[1]) : null;
}

export function sameToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

interface RawThirdparty {
  id: string;
  name: string;
  email?: string;
  array_options?: Record<string, unknown>;
}

async function getThirdparty(id: number): Promise<Thirdparty | null> {
  const t = await dolibarr<RawThirdparty>('GET', `/thirdparties/${id}`);
  if (!t) return null;
  const opts = t.array_options ?? {};
  const statut = String(opts.options_questionnaire_statut ?? '');
  return {
    id: Number(t.id),
    name: t.name,
    email: t.email ?? '',
    token: String(opts.options_questionnaire_token ?? ''),
    statut: statut === 'envoye' || statut === 'rempli' ? statut : '',
  };
}

/** Retrouve le tiers associé à un token valide, sinon null (sans distinguer « inexistant » de « invalide »). */
export async function thirdpartyFromToken(token: string): Promise<Thirdparty | null> {
  const id = parseToken(token);
  if (!id) return null;
  const t = await getThirdparty(id);
  if (!t || !t.token || !sameToken(t.token, token)) return null;
  return t;
}

export async function updateQuestionnaireFields(id: number, fields: Record<string, string | number>) {
  const array_options = Object.fromEntries(Object.entries(fields).map(([k, v]) => [`options_questionnaire_${k}`, v]));
  await dolibarr('PUT', `/thirdparties/${id}`, { array_options });
}

/** Garantit un token sur le tiers ; ne le régénère jamais s'il existe déjà (idempotence). */
export async function ensureToken(id: number): Promise<string> {
  const t = await getThirdparty(id);
  if (!t) throw new Error(`Tiers ${id} introuvable`);
  if (t.token && parseToken(t.token) === id) return t.token;
  const token = newToken(id);
  await updateQuestionnaireFields(id, { token, url: questionnaireUrl(token) });
  return token;
}

// --- Réponses ---------------------------------------------------------------
export interface Answer {
  question: Question;
  value: string; // valeur brute (texte ou valeur du choix)
  display: string; // libellé lisible (avec la précision éventuelle)
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, max) : '');

/** Valide les réponses selon src/data/questionnaire.ts. Renvoie null si une réponse obligatoire manque ou est invalide. */
export function validateAnswers(data: Record<string, unknown>): Answer[] | null {
  const answers: Answer[] = [];
  for (const q of QUESTIONS) {
    if (q.type === 'radio') {
      const value = clean(data[q.id], 50);
      const choice = q.choices?.find((c) => c.value === value);
      if (value && !choice) return null;
      if (q.required && !choice) return null;
      if (!choice) {
        answers.push({ question: q, value: '', display: '' });
        continue;
      }
      const detail = choice.detail ? clean(data[`${q.id}__detail`], DETAIL_MAX) : '';
      answers.push({ question: q, value, display: detail ? `${choice.label} — ${detail}` : choice.label });
    } else {
      const value = clean(data[q.id], q.maxLength ?? 1000);
      if (q.required && !value) return null;
      answers.push({ question: q, value, display: value });
    }
  }
  return answers;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function answersText(answers: Answer[]) {
  return answers.map((a) => `${a.question.label}\n→ ${a.display || '—'}`).join('\n\n');
}

export function answersHtml(answers: Answer[], who: { name: string; email: string }, date: string) {
  const rows = answers
    .map((a) => `<tr><th>${esc(a.question.label)}</th><td>${esc(a.display || '—').replace(/\n/g, '<br>')}</td></tr>`)
    .join('\n');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Questionnaire pré-RDV – ${esc(who.name)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:820px;margin:32px auto;padding:0 16px;color:#17131f}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #e4dcee;padding:10px;text-align:left;vertical-align:top}
th{background:#efe6ff;width:40%}</style></head>
<body><h1>Questionnaire pré-rendez-vous</h1>
<p><strong>${esc(who.name)}</strong> &lt;${esc(who.email)}&gt;<br>Rempli le ${esc(date)} sur moyoweb.fr</p>
<table>${rows}</table></body></html>`;
}
