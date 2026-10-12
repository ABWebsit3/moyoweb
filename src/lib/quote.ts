// Calcul du devis, partagé entre le navigateur (affichage) et le serveur (/api/devis).
// Le serveur recalcule toujours à partir des identifiants : les montants envoyés par le navigateur sont ignorés.
import { PLANS, OPTS, SETUP_FEE, SEO_OPTION_ID, type Option, type Plan, type PlanId } from '../data/devis';

export interface QuoteInput {
  plan: PlanId;
  engage: boolean;
  selected: string[]; // options cochées (hors options incluses et hors articles SEO)
  seo: number | null; // nombre d'articles SEO, null = quantité incluse dans le forfait
}

export interface QuoteLine {
  id: string;
  name: string;
  qty: number; // quantité affichée (ex. nombre total d'articles SEO)
  billedQty: number; // quantité facturée
  unitPrice: number; // prix mensuel unitaire facturé (0 si inclus)
  total: number;
  included: boolean;
}

export interface Quote {
  plan: Plan;
  planPrice: number;
  engage: boolean;
  setupFee: number; // à payer au démarrage (0 avec engagement)
  lines: QuoteLine[];
  totalMonthly: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export const findPlan = (id: string) => PLANS.find((p) => p.id === id);
export const includedQty = (o: Option, plan: PlanId) => o.inc?.[plan] ?? 0;
export const seoQty = (plan: PlanId, seo: number | null) => {
  const inc = includedQty(OPTS.find((o) => o.id === SEO_OPTION_ID)!, plan);
  return seo == null ? inc : Math.max(inc, seo);
};

export function computeQuote(input: QuoteInput): Quote {
  const plan = findPlan(input.plan);
  if (!plan) throw new Error('Forfait inconnu');
  const planPrice = input.engage ? plan.price : plan.free;
  const lines: QuoteLine[] = [];
  let total = planPrice;

  for (const o of OPTS) {
    const inc = includedQty(o, plan.id);
    if (o.id === SEO_OPTION_ID) {
      const q = seoQty(plan.id, input.seo);
      if (q <= 0) continue;
      const billed = Math.max(0, q - inc);
      const cost = round(billed * o.price);
      lines.push({ id: o.id, name: `Articles SEO ×${q}`, qty: q, billedQty: billed, unitPrice: billed ? o.price : 0, total: cost, included: cost === 0 });
      total += cost;
    } else if (inc > 0) {
      lines.push({ id: o.id, name: o.name, qty: 1, billedQty: 0, unitPrice: 0, total: 0, included: true });
    } else if (input.selected.includes(o.id)) {
      lines.push({ id: o.id, name: o.name, qty: 1, billedQty: 1, unitPrice: o.price, total: o.price, included: false });
      total += o.price;
    }
  }

  return {
    plan,
    planPrice,
    engage: input.engage,
    setupFee: input.engage ? 0 : SETUP_FEE,
    lines,
    totalMonthly: round(total),
  };
}
