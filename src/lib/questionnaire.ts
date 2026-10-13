// Questionnaire pré-RDV, côté serveur. Dolibarr est l'unique stockage :
// - attributs supplémentaires du tiers : questionnaire_token, questionnaire_url, questionnaire_statut, questionnaire_date ;
// - réponses : événement Agenda lié au tiers + récapitulatif PDF joint à cet événement.
//   (Pas de HTML : Dolibarr renomme les .html en .html.noexe, illisibles.)
// Token : « <id du tiers>.<32 caractères aléatoires> », comparé en temps constant à la valeur stockée sur le tiers.
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
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

export function answersText(answers: Answer[]) {
  return answers.map((a) => `${a.question.label}\n→ ${a.display || '—'}`).join('\n\n');
}

// --- Récapitulatif PDF ---------------------------------------------------------
const INK = rgb(0.09, 0.075, 0.12);
const MUTED = rgb(0.42, 0.39, 0.47);
const VIOLET = rgb(0.54, 0.31, 1);

/** Remplace les caractères que la police standard (WinAnsi) ne sait pas encoder. */
function pdfSafe(font: PDFFont, text: string) {
  const replaced = text.replace(/→/g, '->').replace(/…/g, '...').replace(/\r/g, '');
  let out = '';
  for (const ch of replaced) {
    if (ch === '\n') {
      out += ch;
      continue;
    }
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      // Caractère non encodable (emoji…) : ignoré.
    }
  }
  return out;
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test;
        continue;
      }
      if (line) lines.push(line);
      // Mot plus long que la ligne (ex. URL) : on le coupe.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth) {
        let i = rest.length;
        while (i > 1 && font.widthOfTextAtSize(rest.slice(0, i), size) > maxWidth) i--;
        lines.push(rest.slice(0, i));
        rest = rest.slice(i);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

export async function answersPdf(answers: Answer[], who: { name: string; email: string }, date: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Questionnaire pré-RDV – ${who.name}`);
  doc.setAuthor('Moyo (moyoweb.fr)');
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [W, H, M] = [595.28, 841.89, 50];
  const width = W - 2 * M;
  let page = doc.addPage([W, H]);
  let y = H - M;

  const draw = (text: string, font: PDFFont, size: number, color = INK, gap = 4) => {
    for (const line of wrap(font, pdfSafe(font, text), size, width)) {
      if (y - size < M) {
        page = doc.addPage([W, H]);
        y = H - M;
      }
      page.drawText(line, { x: M, y: y - size, size, font, color });
      y -= size + gap;
    }
  };

  draw('Questionnaire pré-rendez-vous', bold, 20, VIOLET, 8);
  draw(`${who.name}${who.email ? ` <${who.email}>` : ''}`, bold, 12);
  draw(`Rempli le ${date} sur moyoweb.fr`, regular, 10, MUTED);
  y -= 14;
  for (const a of answers) {
    draw(a.question.label, bold, 11, INK, 3);
    draw(a.display || '—', regular, 11, a.display ? INK : MUTED, 3);
    y -= 12;
  }
  return Buffer.from(await doc.save());
}
