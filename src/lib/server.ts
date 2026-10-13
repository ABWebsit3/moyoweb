// Outils côté serveur partagés par les routes /api/* (jamais importés dans le navigateur).
import nodemailer from 'nodemailer';

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Texte saisi par un visiteur : tronqué et sans chevrons (les notes Dolibarr acceptent du HTML).
export const str = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, max) : '';

export const EMAIL_RE = /^[^\s@'"()\\<>]+@[^\s@'"()\\<>]+\.[^\s@'"()\\<>]+$/;

// --- Anti-abus : N demandes max par IP sur une fenêtre glissante (mémoire du processus). ---
export function rateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (ip: string) => {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > max;
  };
}

// --- Dolibarr (API REST) ---
const DOLIBARR_URL = (process.env.DOLIBARR_API_URL || 'https://doli.agence-abweb.fr/htdocs/api/index.php').replace(/\/+$/, '');

export function dolibarrKey() {
  return process.env.DOLIBARR_API_KEY || '';
}

export async function dolibarr<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T | null> {
  const res = await fetch(DOLIBARR_URL + path, {
    method,
    headers: { DOLAPIKEY: dolibarrKey(), Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  // Dolibarr répond 404 quand une recherche ne trouve rien.
  if (method === 'GET' && res.status === 404) return null;
  if (!res.ok) throw new Error(`Dolibarr ${method} ${path} → ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

export async function findThirdpartyByEmail(email: string): Promise<number | null> {
  const filter = encodeURIComponent(`(t.email:=:'${email}')`);
  const found = await dolibarr<{ id: string }[]>('GET', `/thirdparties?limit=1&sqlfilters=${filter}`);
  return found?.length ? Number(found[0].id) : null;
}

// --- E-mails (SMTP Hostinger : smtp.hostinger.com, port 465 SSL) ---
export function smtpConfigured() {
  return !!process.env.SMTP_PASSWORD;
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function mailer() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER || 'hello@moyoweb.fr', pass: process.env.SMTP_PASSWORD },
    });
  }
  return transport;
}

export const MAIL_FROM = () => process.env.SMTP_USER || 'hello@moyoweb.fr';

export async function sendMail(opts: { to: string; subject: string; text: string; bcc?: string; replyTo?: string }) {
  await mailer().sendMail({ from: `Moyo <${MAIL_FROM()}>`, ...opts });
}

// --- Agenda Dolibarr ---
/** Crée un événement Agenda (lié au tiers si socid). Propriétaire : DOLIBARR_USER_ID, sinon l'utilisateur de la clé API. */
export async function addAgendaEvent(label: string, note: string, socid?: number | null) {
  const owner =
    Number(process.env.DOLIBARR_USER_ID) || Number((await dolibarr<{ id: string }>('GET', '/users/info'))?.id);
  const now = Math.floor(Date.now() / 1000);
  await dolibarr('POST', '/agendaevents', {
    userownerid: owner,
    type_code: 'AC_OTH',
    label,
    note_private: note,
    datep: now,
    datef: now,
    percentage: -1,
    ...(socid ? { socid } : {}),
  });
}
