// Relais serveur : reçoit une demande de devis et la crée dans Dolibarr.
// La clé API reste côté serveur (variable d'environnement DOLIBARR_API_KEY), jamais dans le navigateur.
//
// Dans Dolibarr : retrouve le tiers par e-mail (ou le crée en prospect), ajoute un contact si une société
// est renseignée, puis crée une proposition commerciale en brouillon avec les lignes du devis.
import type { APIRoute } from 'astro';
import { OPTS, SEO_OPTION_ID, type PlanId } from '../../data/devis';
import { computeQuote, findPlan, type Quote } from '../../lib/quote';

export const prerender = false;

const API_URL = (process.env.DOLIBARR_API_URL || 'https://doli.agence-abweb.fr/htdocs/api/index.php').replace(/\/+$/, '');
const EMAIL_RE = /^[^\s@'"()\\]+@[^\s@'"()\\]+\.[^\s@'"()\\]+$/;
const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

// --- Anti-abus : 5 demandes max par IP sur 10 minutes (mémoire du processus). ---
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// --- Client Dolibarr ---------------------------------------------------------
async function dolibarr<T>(key: string, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T | null> {
  const res = await fetch(API_URL + path, {
    method,
    headers: { DOLAPIKEY: key, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  // Dolibarr répond 404 quand une recherche ne trouve rien.
  if (method === 'GET' && res.status === 404) return null;
  if (!res.ok) throw new Error(`Dolibarr ${method} ${path} → ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

interface Contact {
  nom: string;
  prenom: string;
  societe: string;
  email: string;
}

async function findOrCreateThirdparty(key: string, c: Contact): Promise<{ id: number; created: boolean }> {
  const filter = encodeURIComponent(`(t.email:=:'${c.email}')`);
  const found = await dolibarr<{ id: string }[]>(key, 'GET', `/thirdparties?limit=1&sqlfilters=${filter}`);
  if (found?.length) return { id: Number(found[0].id), created: false };

  const id = await dolibarr<number>(key, 'POST', '/thirdparties', {
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

// --- Route -------------------------------------------------------------------
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const key = process.env.DOLIBARR_API_KEY;
  if (!key) {
    console.error('[devis] DOLIBARR_API_KEY manquante');
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

  try {
    const thirdparty = await findOrCreateThirdparty(key, contact);

    if (thirdparty.created && contact.societe) {
      await dolibarr(key, 'POST', '/contacts', {
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

    const proposalId = await dolibarr<number>(key, 'POST', '/proposals', {
      socid: thirdparty.id,
      date: Math.floor(Date.now() / 1000),
      note_private: notes,
    });

    for (const line of proposalLines(quote)) {
      await dolibarr(key, 'POST', `/proposals/${proposalId}/line`, line);
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('[devis] échec de l’envoi vers Dolibarr :', err);
    return json(502, { ok: false, error: 'crm' });
  }
};
