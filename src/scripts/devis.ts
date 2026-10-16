import { PLANS, OPTS, SEO_OPTION_ID, FORMULES, PRICE_SUFFIX, VAT_MENTION, planFeats, planPrice as priceFor, isFormule, type Formule, type Option, type PlanId } from '../data/devis';
import { computeQuote, seoQty as sharedSeoQty, type QuoteInput } from '../lib/quote';
import { CALENDLY_URL } from '../data/site';
import { track } from '../lib/analytics';

type Step = 1 | 2 | 3 | 4;
type FormKey = 'nom' | 'prenom' | 'societe' | 'email';

interface State {
  step: Step;
  plan: PlanId;
  formule: Formule;
  sel: Record<string, boolean>;
  seo: number | null; // null = quantité incluse dans le forfait
  form: Record<FormKey, string>;
  consent: boolean;
  sending: boolean;
  mailed: boolean; // le ticket a bien été envoyé par e-mail au client
  qt: string; // token du questionnaire pré-RDV (vide si Dolibarr indisponible)
  error: string;
  ticketNo: string;
  barcode: string;
}

const STEP_LABELS = ['Forfait', 'Options', 'Tes infos', 'Ton devis'];
const FIELDS: [FormKey, string, string, string, boolean][] = [
  ['nom', 'Nom', 'text', 'Dupont', true],
  ['prenom', 'Prénom', 'text', 'Camille', true],
  ['societe', 'Société (optionnel)', 'text', 'Ma super boîte', false],
  ['email', 'E-mail', 'email', 'camille@exemple.fr', true],
];
const HEADER_OFFSET = 70;

const eur = (n: number) => n.toFixed(2).replace('.', ',') + ' €';
const rand = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function initDevis(root: HTMLElement) {
  const stepperEl = root.querySelector<HTMLElement>('[data-stepper]')!;
  const panelEl = root.querySelector<HTMLElement>('[data-panel]')!;
  const ticketEl = root.querySelector<HTMLElement>('[data-ticket]')!;
  const endpoint = root.dataset.endpoint || '/api/devis';

  const s: State = {
    step: 1,
    plan: 'pro',
    formule: 'e24',
    sel: {},
    seo: null,
    form: { nom: '', prenom: '', societe: '', email: '' },
    consent: false,
    sending: false,
    mailed: false,
    qt: '',
    error: '',
    ticketNo: 'DEVIS#' + rand(14),
    barcode: [rand(4), rand(4), rand(4), rand(4), rand(2)].join(' '),
  };

  // --- Calculs ---------------------------------------------------------------
  const plan = () => PLANS.find((p) => p.id === s.plan)!;
  const planPrice = (p = plan()) => priceFor(p, s.formule);
  const included = (o: Option) => o.inc?.[s.plan] ?? 0;
  const seoQty = () => sharedSeoQty(s.plan, s.seo);
  const isOn = (o: Option) => (o.id === SEO_OPTION_ID ? seoQty() > 0 : included(o) > 0 || !!s.sel[o.id]);
  const isIncluded = (o: Option) => o.id !== SEO_OPTION_ID && included(o) > 0;

  const quoteInput = (): QuoteInput => ({
    plan: s.plan,
    formule: s.formule,
    selected: Object.keys(s.sel).filter((id) => s.sel[id]),
    seo: s.seo,
  });

  function quote() {
    const q = computeQuote(quoteInput());
    const lines = q.lines.map((l) => ({ name: l.name, price: l.included ? 'INCLUS' : eur(l.total) + (l.oneTime ? ' (1 FOIS)' : '') }));
    return { lines, total: q.totalMonthly, oneTime: q.oneTimeTotal };
  }

  const formValid = () =>
    !!s.form.nom.trim() && !!s.form.prenom.trim() && /.+@.+\..+/.test(s.form.email.trim()) && s.consent;

  // --- Navigation ------------------------------------------------------------
  function go(step: Step) {
    s.step = step;
    render();
    if (window.moyoLenis) {
      window.moyoLenis.scrollTo(root); // Lenis applique le scroll-margin-top de #devis
    } else {
      const top = root.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // --- Rendu -----------------------------------------------------------------
  function renderStepper() {
    const maxStep = s.step === 4 ? 4 : 3;
    stepperEl.innerHTML = STEP_LABELS.map((label, i) => {
      const n = i + 1;
      const cur = n === s.step;
      const done = n < s.step;
      const locked = n > maxStep || (n === 4 && s.step !== 4);
      const cls = ['dv-step', cur && 'is-current', done && 'is-done', s.step === 4 && 'is-frozen'].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-go="${n}" ${locked ? 'disabled' : ''} ${cur ? 'aria-current="step"' : ''}>
        <span class="dv-step__dot">${done ? '✓' : n}</span>${label}</button>`;
    }).join('');
  }

  function renderStep1() {
    const plans = PLANS.map((p) => {
      const on = p.id === s.plan;
      const [int, dec] = planPrice(p).toFixed(2).split('.');
      return `<button type="button" class="dv-plan ${on ? 'is-selected' : ''}" data-plan="${p.id}" aria-pressed="${on}"
          style="background:${p.color};color:${p.ink};--rule-c:${p.rule}">
        <div class="dv-plan__top">
          <span class="dv-box">${on ? '✓' : ''}</span>
          ${p.popular ? '<span class="dv-pill">Populaire</span>' : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="dv-plan__name">Offre ${p.name}</span>
          <span class="dv-plan__tag">${p.tag}</span>
        </div>
        <div style="display:flex;flex-direction:column">
          <span class="dv-plan__from">À partir de</span>
          <span class="dv-plan__price"><span class="dv-plan__int">${int}</span><span class="dv-plan__dec">,${dec} € ${PRICE_SUFFIX}/mois</span></span>
          <span class="dv-plan__setup">0 € de frais</span>
        </div>
        <p class="dv-plan__desc">${p.desc}</p>
        <ul class="dv-plan__feats">${planFeats(p).map((f) => `<li>${f}</li>`).join('')}</ul>
      </button>`;
    }).join('');

    return `
      <div class="dv-toggle-row">
        <div class="dv-toggle" role="group" aria-label="Type d’abonnement">
          <button type="button" data-formule="e24" aria-pressed="${s.formule === 'e24'}">24 mois<span class="dv-toggle__badge">Meilleur prix</span></button>
          <button type="button" data-formule="e12" aria-pressed="${s.formule === 'e12'}">12 mois</button>
          <button type="button" data-formule="libre" aria-pressed="${s.formule === 'libre'}">Sans engagement</button>
        </div>
        <p class="dv-note">${
          {
            e24: 'Engagement initial de 24 mois : le meilleur tarif et 0 € au départ.',
            e12: 'Engagement initial de 12 mois, 0 € au départ. Ensuite, ton abonnement continue au mois, résiliable avec un préavis d’un mois.',
            libre: 'Abonnement majoré de 25 %, 0 € au départ. Résiliable à tout moment avec un préavis d’un mois.',
          }[s.formule]
        } Prix ${PRICE_SUFFIX} : ${VAT_MENTION}.</p>
      </div>
      <div class="dv-plans">${plans}</div>
      <div class="dv-actions">
        <a href="${CALENDLY_URL}" class="dv-help" target="_blank" rel="noopener">Allô Houston ! J’ai un besoin spécifique → on en parle autour d’un café virtuel ?</a>
        <button type="button" class="btn-dark" data-next>Continuer : les options →</button>
      </div>`;
  }

  function renderStep2() {
    const p = plan();
    const cards = OPTS.map((o) => {
      const on = isOn(o);
      const incl = isIncluded(o);
      const isSeo = o.id === SEO_OPTION_ID;
      const fg = on && o.color === '#8A4FFF' ? '#fff' : '#17131F';
      let priceLabel = eur(o.price) + ` ${PRICE_SUFFIX}/mois`;
      let qty = '';
      if (isSeo) {
        const q = seoQty();
        const i = included(o);
        priceLabel = (i ? i + ' inclus · ' : '') + eur(o.price) + ` ${PRICE_SUFFIX}/article, 1 fois`;
        qty = `<div class="dv-qty">
          <button type="button" data-seo="-1" aria-label="Retirer un article">−</button>
          <span class="dv-qty__label" aria-live="polite">${q} article${q > 1 ? 's' : ''}</span>
          <button type="button" data-seo="1" aria-label="Ajouter un article">+</button>
        </div>`;
      }
      if (incl) priceLabel = 'Inclus dans ' + p.name;
      const cls = ['dv-opt', on && 'is-on', incl && 'is-included', isSeo && 'is-qty'].filter(Boolean).join(' ');
      const toggleAttrs = isSeo
        ? ''
        : `role="checkbox" aria-checked="${on}" ${incl ? 'aria-disabled="true"' : ''} tabindex="0" data-opt="${o.id}"`;
      return `<div class="${cls}" ${toggleAttrs} style="background:${on ? o.color : '#fff'};color:${fg}">
        <div class="dv-opt__top">
          <span class="dv-box">${on ? '✓' : ''}</span>
          <span class="dv-opt__name">${o.name}</span>
        </div>
        <p class="dv-opt__desc">${o.desc}</p>
        <div class="dv-opt__foot">
          <span class="dv-opt__price">${priceLabel}</span>
          ${incl ? '<span class="dv-pill">Inclus</span>' : ''}
        </div>
        ${qty}
      </div>`;
    }).join('');

    return `
      <p class="dv-text">Ajoute ce qu’il te faut. Certaines options sont déjà incluses dans ton forfait ${p.name}.</p>
      <div class="dv-opts">${cards}</div>
      <div class="dv-actions">
        <button type="button" class="btn-ghost" data-prev>← Retour</button>
        <button type="button" class="btn-dark" data-next>Continuer : tes infos →</button>
      </div>`;
  }

  function renderStep3() {
    const fields = FIELDS.map(
      ([k, label, type, ph, req]) => `<label class="dv-field">${label}${req ? ' *' : ''}
        <input type="${type}" name="${k}" value="${esc(s.form[k])}" placeholder="${ph}" ${req ? 'required' : ''}
          autocomplete="${k === 'nom' ? 'family-name' : k === 'prenom' ? 'given-name' : k === 'societe' ? 'organization' : 'email'}" data-field="${k}">
      </label>`,
    ).join('');

    return `
      <form class="dv-form" data-form novalidate>
        <div class="dv-form__head">
          <h3 class="dv-h3">Dernière étape avant ton devis !</h3>
          <p>On t’envoie aussi ton ticket par mail pour le garder sous le coude.</p>
          <p>Offre réservée aux professionnels et aux associations.</p>
        </div>
        <div class="dv-fields">${fields}</div>
        <div class="dv-hp" aria-hidden="true"><label>Site web <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <label class="dv-consent">
          <input type="checkbox" data-consent ${s.consent ? 'checked' : ''} required>
          <span>J’accepte que mes informations soient utilisées pour me recontacter dans le cadre de ma demande. <em>(Promis, pas de spam ni de commande pizza à ton insu.)</em></span>
        </label>
        <p class="dv-error" data-error role="alert" ${s.error ? '' : 'hidden'}>${esc(s.error)}</p>
        <div class="dv-actions">
          <button type="button" class="btn-ghost" data-prev>← Modifier</button>
          <button type="submit" class="dv-submit" data-submit>Recevoir mon devis →</button>
        </div>
      </form>`;
  }

  function renderStep4() {
    const { total } = quote();
    return `
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="dv-sent">${s.mailed ? `✓ Devis envoyé à ${esc(s.form.email.trim())}` : '✓ Demande de devis enregistrée'}</div>
        <h3 class="dv-result-title">Ton site ${plan().name} pour ${eur(total)} ${PRICE_SUFFIX}/mois, ${esc(s.form.prenom.trim() || 'toi')}.</h3>
        <div class="dv-result-text">
          <p>Le devis que tu vois n’est qu’une première esquisse : il sert à te donner une idée générale.</p>
          <p>Après ton premier café (ou thé !) avec notre équipe, on pourra peaufiner les chiffres, ajouter ou retirer des options, et faire en sorte que tout colle parfaitement à tes besoins.</p>
          <p>Donc, pas de panique : les montants et les services indiqués aujourd’hui ne sont pas gravés dans le marbre.</p>
        </div>
        ${renderRdv()}
        <div><button type="button" class="dv-restart" data-restart>Refaire un devis</button></div>
        <div class="dv-reassure">
          <span>✓ Réponse sous 24 h ouvrées</span><span>✓ Contrat clair, sans surprise</span><span>✓ Rien à payer avant validation</span>
        </div>
      </div>`;
  }

  // Prise de RDV : calendrier Calendly intégré (chargé au clic seulement : Calendly peut déposer des cookies).
  // La réservation est détectée via l'événement « calendly.event_scheduled » pour envoyer le questionnaire.
  function renderRdv() {
    if (!s.qt) {
      return `<div><a href="${CALENDLY_URL}" class="btn btn--violet" target="_blank" rel="noopener">Prendre rendez-vous (30 min)</a></div>`;
    }
    return `
      <div class="dv-rdv" data-rdv>
        <div class="dv-rdv__intro" data-rdv-intro>
          <button type="button" class="btn btn--violet" data-calendly-load>Choisir mon créneau (30 min)</button>
          <p class="dv-rdv__legal">Le calendrier est fourni par Calendly, qui peut déposer des cookies : il ne se charge qu’après ton clic.
            Tu préfères ? <a href="${CALENDLY_URL}" target="_blank" rel="noopener">Ouvrir Calendly dans un nouvel onglet</a>.</p>
        </div>
        <div class="dv-rdv__cal" data-calendly-box hidden></div>
        <div class="dv-rdv__done" data-rdv-done hidden role="status"></div>
      </div>`;
  }

  function loadCalendly() {
    const box = panelEl.querySelector<HTMLElement>('[data-calendly-box]');
    const intro = panelEl.querySelector<HTMLElement>('[data-rdv-intro]');
    if (!box || !intro) return;
    intro.hidden = true;
    box.hidden = false;
    box.textContent = 'Chargement du calendrier…';
    const init = () => {
      box.textContent = '';
      (window as any).Calendly.initInlineWidget({
        url: `${CALENDLY_URL}?hide_gdpr_banner=1`,
        parentElement: box,
        prefill: { name: `${s.form.prenom.trim()} ${s.form.nom.trim()}`.trim(), email: s.form.email.trim() },
      });
    };
    if ((window as any).Calendly) return init();
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = init;
    script.onerror = () => {
      box.innerHTML = `Le calendrier n’a pas pu se charger. <a href="${CALENDLY_URL}" target="_blank" rel="noopener">Ouvre Calendly dans un nouvel onglet</a>.`;
    };
    document.head.appendChild(script);
  }

  let rdvNotified = false;
  async function onScheduled(inviteeUri: string) {
    if (rdvNotified || !s.qt) return;
    rdvNotified = true;
    track('rdv_scheduled', { plan: s.plan });
    const done = panelEl.querySelector<HTMLElement>('[data-rdv-done]');
    let url = '';
    let mailed = false;
    try {
      const res = await fetch('/api/questionnaire/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qt: s.qt, invitee: inviteeUri }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && typeof body.url === 'string') {
        url = body.url;
        mailed = body.mailed === true;
      }
    } catch {}
    if (!done) return;
    done.hidden = false;
    done.innerHTML = url
      ? `<strong>✓ Rendez-vous réservé !</strong>
         <p>Pour qu’on le prépare au mieux, prends 3 à 5 minutes pour répondre à quelques questions${mailed ? ' (on t’a aussi envoyé le lien par e-mail)' : ''}.</p>
         <a href="${esc(url)}" class="btn btn--green">Remplir le questionnaire</a>`
      : `<strong>✓ Rendez-vous réservé !</strong><p>Tu vas recevoir la confirmation de Calendly par e-mail.</p>`;
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://calendly.com' || e.data?.event !== 'calendly.event_scheduled') return;
    const uri = e.data?.payload?.invitee?.uri;
    void onScheduled(typeof uri === 'string' ? uri : '');
  });

  function renderTicket() {
    const show = s.step === 4;
    ticketEl.hidden = !show;
    if (!show) {
      ticketEl.innerHTML = '';
      return;
    }
    const p = plan();
    const { lines, total, oneTime } = quote();
    const terms = {
      e24: 'Engagement initial de 24 mois. Ensuite : gardiennage 25,99 €/mois ou transfert 490 €.',
      e12: 'Engagement initial de 12 mois, puis au mois (préavis d’un mois).',
      libre: 'Sans engagement · résiliable à tout moment, préavis d’un mois.',
    }[s.formule];
    const line = (a: string, b: string, cls = '') =>
      `<div class="dv-ticket__line"><span class="${cls}">${a}</span><span>${b}</span></div>`;

    ticketEl.innerHTML = `
      <div class="dv-ticket-shadow">
        <div class="dv-ticket" aria-label="Récapitulatif du devis">
          <div class="dv-ticket__head">
            <span class="dv-ticket__title">DEVIS / MOYO</span>
            <span>${s.ticketNo}</span>
            <span>Servi par : Mo’ · ${new Date().toLocaleDateString('fr-FR')}</span>
          </div>
          <div class="dv-ticket__rule"></div>
          <strong>&gt;&gt;&gt; FORFAIT</strong>
          ${line(`FORFAIT ${p.name.toUpperCase()} · ${FORMULES[s.formule].short.toUpperCase()}`, eur(planPrice()))}
          <strong>&gt;&gt;&gt; OPTIONS</strong>
          ${lines.map((l) => line(l.name, l.price, 'dv-ticket__upper')).join('')}
          ${lines.length ? '' : '<span class="dv-ticket__muted">— aucune option —</span>'}
          <div class="dv-ticket__rule"></div>
          ${line('SOUS-TOTAL', eur(total))}
          <span style="font-size:11.5px">TVA non applicable, art. 293 B du CGI</span>
          <div class="dv-ticket__total"><span>TOTAL ${PRICE_SUFFIX}</span><span>${eur(total)}/mois</span></div>
          ${oneTime ? `<div class="dv-ticket__line" style="font-weight:700"><span>+ 1 FOIS, AVEC LA 1RE MENSUALITÉ</span><span>${eur(oneTime)}</span></div>` : ''}
          <div class="dv-ticket__barcode" aria-hidden="true"></div>
          <span class="dv-center" style="letter-spacing:.12em">${s.barcode}</span>
          <span class="dv-center" style="font-size:11.5px;line-height:1.5">${terms}<br>Hébergement, domaine, maintenance inclus.</span>
          <span class="dv-center"><a href="/cgv/">Voir les CGV</a></span>
          <span class="dv-center" style="font-weight:700;padding-top:4px">MERCI &amp; À BIENTÔT !</span>
        </div>
      </div>`;
  }

  function updateSubmit() {
    const btn = panelEl.querySelector<HTMLButtonElement>('[data-submit]');
    if (btn) btn.disabled = !formValid() || s.sending;
  }

  function render() {
    renderStepper();
    panelEl.innerHTML = [renderStep1, renderStep2, renderStep3, renderStep4][s.step - 1]();
    updateSubmit();
    renderTicket();
  }

  // --- Envoi -----------------------------------------------------------------
  async function submit() {
    if (!formValid() || s.sending) return;
    s.error = '';
    if (endpoint) {
      s.sending = true;
      updateSubmit();
      const honeypot = panelEl.querySelector<HTMLInputElement>('[name="website"]')?.value ?? '';
      try {
        // Le serveur recalcule les montants à partir de ces choix.
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketNo: s.ticketNo, contact: { ...s.form }, consent: s.consent, website: honeypot, ...quoteInput() }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = await res.json().catch(() => ({}));
        s.mailed = body.mailed === true;
        s.qt = typeof body.qt === 'string' ? body.qt : '';
        const q = computeQuote(quoteInput());
        // GA4 : renseignements envoyés (événement recommandé « generate_lead »).
        track('generate_lead', { value: q.totalMonthly, currency: 'EUR', plan: q.plan.name, formule: q.formule });
      } catch {
        s.sending = false;
        s.error = 'Oups, l’envoi n’a pas fonctionné. Réessaie dans un instant ou écris-nous à hello@moyoweb.fr.';
        const err = panelEl.querySelector<HTMLElement>('[data-error]');
        if (err) {
          err.textContent = s.error;
          err.hidden = false;
        }
        updateSubmit();
        return;
      }
      s.sending = false;
    }
    go(4);
  }

  // --- Événements (délégués) -------------------------------------------------
  function toggleOption(id: string) {
    const o = OPTS.find((x) => x.id === id);
    if (!o || isIncluded(o) || o.id === SEO_OPTION_ID) return;
    s.sel[id] = !s.sel[id];
    render();
    root.querySelector<HTMLElement>(`[data-opt="${id}"]`)?.focus();
  }

  // GA4 : « devis_start » à la première interaction avec le module, une seule fois par visite de page.
  let started = false;
  const markStarted = () => {
    if (started) return;
    started = true;
    track('devis_start', { plan: s.plan, formule: s.formule });
  };

  root.addEventListener('click', (e) => {
    // GA4 : clic vers Calendly (étape 1 « Allô Houston » ou étape 4 « Prendre rendez-vous »).
    const cal = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="calendly.com"]');
    if (cal) track('calendly_click', { location: s.step === 4 ? 'devis_resultat' : 'devis_besoin_specifique', plan: s.plan });
    const t = (e.target as HTMLElement).closest<HTMLElement>(
      '[data-go],[data-formule],[data-plan],[data-next],[data-prev],[data-restart],[data-seo],[data-opt],[data-calendly-load]',
    );
    if (!t || !root.contains(t)) return;
    markStarted();
    const d = t.dataset;

    if ('calendlyLoad' in d) {
      track('calendly_click', { location: 'devis_calendrier_integre', plan: s.plan });
      loadCalendly();
    } else if (d.go) {
      if (s.step !== 4) go(Number(d.go) as Step);
    } else if (d.formule) {
      if (isFormule(d.formule)) s.formule = d.formule;
      render();
    } else if (d.plan) {
      s.plan = d.plan as PlanId;
      s.seo = null;
      render();
      root.querySelector<HTMLElement>(`[data-plan="${d.plan}"]`)?.focus();
    } else if ('next' in d) {
      go((s.step + 1) as Step);
    } else if ('prev' in d) {
      go((s.step - 1) as Step);
    } else if ('restart' in d) {
      go(1);
    } else if (d.seo) {
      s.seo = Math.max(0, seoQty() + Number(d.seo));
      render();
      root.querySelector<HTMLElement>(`[data-seo="${d.seo}"]`)?.focus();
    } else if (d.opt) {
      toggleOption(d.opt);
    }
  });

  root.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.dataset.opt && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      toggleOption(t.dataset.opt);
    }
  });

  root.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    const key = t.dataset.field as FormKey | undefined;
    if (key) markStarted();
    if (key) s.form[key] = t.value;
    updateSubmit();
  });

  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if ('consent' in t.dataset) {
      s.consent = t.checked;
      updateSubmit();
    }
  });

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    void submit();
  });

  render();
}
