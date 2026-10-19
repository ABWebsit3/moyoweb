var e={e24:{label:`Engagement 24 mois`,short:`24 mois`,months:24},e12:{label:`Engagement 12 mois`,short:`12 mois`,months:12},libre:{label:`Sans engagement`,short:`sans engagement`,months:0}};Object.keys(e);var t=t=>typeof t==`string`&&t in e,n=`TVA non applicable, art. 293 B du CGI`,r=[{id:`starter`,name:`Essentielle`,tag:`Site vitrine essentiel`,price:44.99,p12:49.99,free:56.24,color:`#7EE08F`,ink:`#17131F`,rule:`#17131F55`,desc:`Parfait pour te lancer sans exploser ton budget. Un site propre, beau, rapide… bref, un site qui envoie du pixel.`,feats:[`1 site vitrine 1–3 pages`,`Design personnalisé`,`Formulaire de contact`,`Nom de domaine + hébergement inclus`,`Maintenance + sécurité`,`60 min/mois de modifications`,`Support Moyo-friendly`]},{id:`pro`,name:`Standard`,tag:`Site vitrine plus complet`,price:74.99,p12:83.99,free:93.74,color:`#8A4FFF`,ink:`#FFFFFF`,rule:`#FFFFFF77`,popular:!0,desc:`Plus complet, plus impactant, plus “wow”. Idéal pour les indépendants qui veulent un site qui convertit.`,feats:[`1 site 1–6 pages`,`Design premium`,`Formulaire de contact`,`Nom de domaine + hébergement inclus`,`SEO de base`,`Maintenance + sécurité + optimisation`,`60 min/mois de modifications`,`Support Moyo-friendly`]},{id:`elite`,name:`Premium`,tag:`Site avec besoins avancés`,price:144.99,p12:162.99,free:181.24,color:`#F49B2A`,ink:`#17131F`,rule:`#17131F55`,desc:`La version luxe du leasing. Ton site est une machine de guerre et tu n’as rien à gérer.`,feats:[`Site complet 1–10 pages`,`Design sur-mesure`,`Formulaire de contact`,`Intégration API / automatisations`,`Nom de domaine + hébergement inclus`,`SEO premium`,`Maintenance + sécurité + optimisation`,`60 min/mois de modifications`,`Support Moyo-friendly`]}],i=[{id:`ecom`,name:`E-commerce`,desc:`Un module pour vendre tes produits. Création des produits et configuration avec la banque incluses.`,price:66.99,color:`#F49B2A`},{id:`seo`,name:`Articles SEO`,desc:`Articles de blog optimisés pour le référencement naturel. Paiement unique par article.`,price:9.99,unit:!0,color:`#7EE08F`,inc:{starter:0,pro:3,elite:6}},{id:`multi`,name:`Site multilingue`,desc:`Ton site en plusieurs langues (une langue incluse, frais possibles par langue en plus).`,price:16.99,color:`#8A4FFF`,inc:{pro:1,elite:1}},{id:`resa`,name:`Système de réservation`,desc:`Calendrier de réservation en ligne pour tes rendez-vous.`,price:20.99,color:`#8A4FFF`},{id:`chat`,name:`Chat Messenger / WhatsApp`,desc:`Tes visiteurs te contactent en un clic via Messenger ou WhatsApp.`,price:5.99,color:`#7EE08F`},{id:`feed`,name:`Fil d’actualités`,desc:`Affiche tes derniers posts Instagram / Facebook.`,price:15.99,color:`#F49B2A`},{id:`logo`,name:`Création de logo`,desc:`Un logo tout beau tout neuf !`,price:39.99,color:`#F49B2A`},{id:`gmb`,name:`Google My Business`,desc:`Une fiche établissement visible directement dans les recherches Google.`,price:4.99,color:`#7EE08F`,inc:{pro:1,elite:1}},{id:`news`,name:`Newsletter / Emailing`,desc:`Un envoi par mois pour tenir tes clients au courant de tes promos.`,price:34.99,color:`#8A4FFF`},{id:`seag`,name:`SEA (Google)`,desc:`Mise en place de ta visibilité payante sur Google (hors budget publicité).`,price:11.99,color:`#7EE08F`},{id:`seaf`,name:`SEA (Facebook)`,desc:`Mise en place de ta visibilité payante sur Facebook (hors budget publicité).`,price:11.99,color:`#8A4FFF`},{id:`ana`,name:`Rapport Analytics`,desc:`Suis le nombre de visites sur ton site, et plus encore.`,price:3.99,color:`#F49B2A`,inc:{pro:1,elite:1}}],a=(e,t)=>t===`e24`?e.price:t===`e12`?e.p12:e.free;function o(e){let t=i.flatMap(t=>{let n=t.inc?.[e.id]??0;return n<=0?[]:t.id===`seo`?[`${n} article${n>1?`s`:``} SEO inclus`]:[`${t.name} inclus`]});return[...e.feats,...t]}var s=e=>Math.round(e*100)/100,c=e=>r.find(t=>t.id===e),l=(e,t)=>e.inc?.[t]??0,u=(e,t)=>{let n=l(i.find(e=>e.id===`seo`),e);return t==null?n:Math.max(n,t)};function d(e){let t=c(e.plan);if(!t)throw Error(`Forfait inconnu`);let n=a(t,e.formule),r=[],o=n,d=0;for(let n of i){let i=l(n,t.id);if(n.id===`seo`){let a=u(t.id,e.seo);if(a<=0)continue;let o=Math.max(0,a-i),c=s(o*n.price);r.push({id:n.id,name:`Articles SEO ×${a}`,qty:a,billedQty:o,unitPrice:o?n.price:0,total:c,included:c===0,oneTime:!0}),d+=c}else i>0?r.push({id:n.id,name:n.name,qty:1,billedQty:0,unitPrice:0,total:0,included:!0,oneTime:!1}):e.selected.includes(n.id)&&(r.push({id:n.id,name:n.name,qty:1,billedQty:1,unitPrice:n.price,total:n.price,included:!1,oneTime:!1}),o+=n.price)}return{plan:t,planPrice:n,formule:e.formule,lines:r,totalMonthly:s(o),oneTimeTotal:s(d)}}var f=`https://calendly.com/moyoweb/30min`,p=e=>e.toFixed(2).replace(`.`,`,`)+` €`,m=e=>r.map(t=>`${t.name} ${p(t[e])}`).join(`, `);[[`Avec ou sans engagement, quelle différence ?`,`Trois formules : l’engagement 24 mois, au meilleur tarif et sans frais ; l’engagement 12 mois, environ 12 % plus cher mais toujours sans frais, qui continue ensuite au mois ; et le sans engagement, majoré de 25 %, lui aussi sans frais, résiliable à tout moment avec un préavis d’un mois. Tu peux aussi récupérer ton site au moment de la résiliation : transfert à 199 € après un engagement de 12 ou 24 mois, 499 € sans engagement.`],[`Y a-t-il des frais de mise en service ?`,`Non, aucuns frais : quelle que soit la formule (24 mois, 12 mois ou sans engagement), la conception et la mise en ligne de ton site sont comprises dans la mensualité. 0 € au départ.`],[`Combien ça coûte ?`,`Prix TTC par mois. Engagement 24 mois : ${m(`price`)}. Engagement 12 mois : ${m(`p12`)}. Sans engagement : ${m(`free`)}. Aucuns frais de mise en service. ${n} : le prix affiché est le prix payé.`],[`Et la formule 12 mois ?`,`Tu t’engages pour 12 mois seulement, sans frais de départ. À la fin de la première année, ton abonnement continue au mois au même tarif, et tu peux le résilier à tout moment avec un préavis d’un mois (avec le transfert de ton site à 199 € si tu le souhaites).`],[`En combien de temps mon site est-il en ligne ?`,`Notre délai cible est de 3 à 5 jours ouvrés, dès qu’on a reçu tous les contenus nécessaires (textes, images, logo…). Si on dépasse ce délai de notre fait, ta première mensualité est offerte.`],[`Avec quoi est fait mon site ?`,`Ton site est construit avec Astro, et tu disposes d’un espace d’édition WordPress ou TinaCMS selon ton besoin. Hébergement, maintenance et assistance dépendent de la formule choisie.`],[`Les modifications et la maintenance sont-elles incluses ?`,`Oui : maintenance de ton site et de ton espace d’édition (WordPress ou TinaCMS) avec leurs extensions et dépendances, sauvegardes, mises à jour et contrôles de sécurité. Tu as aussi 60 minutes par mois de petites modifications de contenu (non reportées d’un mois à l’autre). Créations de pages, refontes et développements supplémentaires font l’objet d’un devis.`],[`Que se passe-t-il après 24 mois ?`,`Trois options : le Gardiennage à 25,99 €/mois (hébergement, maintenance, 45 min d’assistance par mois, gestion du domaine), sans engagement ; le transfert à 199 € pour récupérer tes fichiers et contenus et partir chez l’hébergeur de ton choix ; ou l’arrêt du service. Si tu ne choisis rien, ton site passe automatiquement en Gardiennage : on te prévient par e-mail avant l’échéance.`],[`Combien coûte la récupération de mon site ?`,`Le transfert (envoi des fichiers du site, de ses contenus et des informations utiles à toi ou à ton nouveau prestataire, avec cession des droits sur le site) coûte 199 € TTC après un engagement de 12 ou 24 mois, ou pendant le Gardiennage, et 499 € TTC avec la formule sans engagement. Il se demande avant la date de fin du service.`],[`À qui appartient le nom de domaine ?`,`Il est enregistré à ton nom. On en assure simplement la gestion technique pendant la durée du service, et on t’accompagne s’il doit être transféré.`]].map(([e,t])=>({q:e,a:t}));function h(e,t={}){let n=window.gtag;typeof n==`function`&&n(`event`,e,t)}var g=[`Forfait`,`Options`,`Tes infos`,`Ton devis`],_=[[`nom`,`Nom`,`text`,`Dupont`,!0],[`prenom`,`Prénom`,`text`,`Camille`,!0],[`societe`,`Société (optionnel)`,`text`,`Ma super boîte`,!1],[`email`,`E-mail`,`email`,`camille@exemple.fr`,!0]],v=70,y=e=>e.toFixed(2).replace(`.`,`,`)+` €`,b=e=>Array.from({length:e},()=>Math.floor(Math.random()*10)).join(``),x=e=>e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]);function S(s){let c=s.querySelector(`[data-stepper]`),l=s.querySelector(`[data-panel]`),p=s.querySelector(`[data-ticket]`),m=s.dataset.endpoint||`/api/devis`,S={step:1,plan:`pro`,formule:`e24`,sel:{},seo:null,form:{nom:``,prenom:``,societe:``,email:``},consent:!1,sending:!1,mailed:!1,qt:``,error:``,ticketNo:`DEVIS#`+b(14),barcode:[b(4),b(4),b(4),b(4),b(2)].join(` `)},C=()=>r.find(e=>e.id===S.plan),w=(e=C())=>a(e,S.formule),T=e=>e.inc?.[S.plan]??0,E=()=>u(S.plan,S.seo),D=e=>e.id===`seo`?E()>0:T(e)>0||!!S.sel[e.id],O=e=>e.id!==`seo`&&T(e)>0,k=()=>({plan:S.plan,formule:S.formule,selected:Object.keys(S.sel).filter(e=>S.sel[e]),seo:S.seo});function A(){let e=d(k());return{lines:e.lines.map(e=>({name:e.name,price:e.included?`INCLUS`:y(e.total)+(e.oneTime?` (1 FOIS)`:``)})),total:e.totalMonthly,oneTime:e.oneTimeTotal}}let j=()=>!!S.form.nom.trim()&&!!S.form.prenom.trim()&&/.+@.+\..+/.test(S.form.email.trim())&&S.consent;function M(e){if(S.step=e,W(),window.moyoLenis)window.moyoLenis.scrollTo(s);else{let e=s.getBoundingClientRect().top+window.scrollY-v;window.scrollTo({top:e,behavior:`smooth`})}}function N(){let e=S.step===4?4:3;c.innerHTML=g.map((t,n)=>{let r=n+1,i=r===S.step,a=r<S.step,o=r>e||r===4&&S.step!==4;return`<button type="button" class="${[`dv-step`,i&&`is-current`,a&&`is-done`,S.step===4&&`is-frozen`].filter(Boolean).join(` `)}" data-go="${r}" ${o?`disabled`:``} ${i?`aria-current="step"`:``}>
        <span class="dv-step__dot">${a?`✓`:r}</span>${t}</button>`}).join(``)}function P(){let e=r.map(e=>{let t=e.id===S.plan,[n,r]=w(e).toFixed(2).split(`.`);return`<button type="button" class="dv-plan ${t?`is-selected`:``}" data-plan="${e.id}" aria-pressed="${t}"
          style="background:${e.color};color:${e.ink};--rule-c:${e.rule}">
        <div class="dv-plan__top">
          <span class="dv-box">${t?`✓`:``}</span>
          ${e.popular?`<span class="dv-pill">Populaire</span>`:``}
        </div>
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="dv-plan__name">Offre ${e.name}</span>
          <span class="dv-plan__tag">${e.tag}</span>
        </div>
        <div style="display:flex;flex-direction:column">
          <span class="dv-plan__from">À partir de</span>
          <span class="dv-plan__price"><span class="dv-plan__int">${n}</span><span class="dv-plan__dec">,${r} € TTC/mois</span></span>
          <span class="dv-plan__setup">0 € de frais</span>
        </div>
        <p class="dv-plan__desc">${e.desc}</p>
        <ul class="dv-plan__feats">${o(e).map(e=>`<li>${e}</li>`).join(``)}</ul>
      </button>`}).join(``);return`
      <div class="dv-toggle-row">
        <div class="dv-toggle" role="group" aria-label="Type d’abonnement">
          <button type="button" data-formule="e24" aria-pressed="${S.formule===`e24`}">24 mois<span class="dv-toggle__badge">Meilleur prix</span></button>
          <button type="button" data-formule="e12" aria-pressed="${S.formule===`e12`}">12 mois</button>
          <button type="button" data-formule="libre" aria-pressed="${S.formule===`libre`}">Sans engagement</button>
        </div>
        <p class="dv-note">${{e24:`Engagement initial de 24 mois : le meilleur tarif et 0 € au départ.`,e12:`Engagement initial de 12 mois, 0 € au départ. Ensuite, ton abonnement continue au mois, résiliable avec un préavis d’un mois.`,libre:`Abonnement majoré de 25 %, 0 € au départ. Résiliable à tout moment avec un préavis d’un mois.`}[S.formule]} Prix TTC : ${n}.</p>
      </div>
      <div class="dv-plans">${e}</div>
      <div class="dv-actions">
        <a href="${f}" class="dv-help" target="_blank" rel="noopener">Allô Houston ! J’ai un besoin spécifique → on en parle autour d’un café virtuel ?</a>
        <button type="button" class="btn-dark" data-next>Continuer : les options →</button>
      </div>`}function F(){let e=C(),t=i.map(t=>{let n=D(t),r=O(t),i=t.id===`seo`,a=n&&t.color===`#8A4FFF`?`#fff`:`#17131F`,o=y(t.price)+` TTC/mois`,s=``;if(i){let e=E(),n=T(t);o=(n?n+` inclus · `:``)+y(t.price)+` TTC/article, 1 fois`,s=`<div class="dv-qty">
          <button type="button" data-seo="-1" aria-label="Retirer un article">−</button>
          <span class="dv-qty__label" aria-live="polite">${e} article${e>1?`s`:``}</span>
          <button type="button" data-seo="1" aria-label="Ajouter un article">+</button>
        </div>`}return r&&(o=`Inclus dans `+e.name),`<div class="${[`dv-opt`,n&&`is-on`,r&&`is-included`,i&&`is-qty`].filter(Boolean).join(` `)}" ${i?``:`role="checkbox" aria-checked="${n}" ${r?`aria-disabled="true"`:``} tabindex="0" data-opt="${t.id}"`} style="background:${n?t.color:`#fff`};color:${a}">
        <div class="dv-opt__top">
          <span class="dv-box">${n?`✓`:``}</span>
          <span class="dv-opt__name">${t.name}</span>
        </div>
        <p class="dv-opt__desc">${t.desc}</p>
        <div class="dv-opt__foot">
          <span class="dv-opt__price">${o}</span>
          ${r?`<span class="dv-pill">Inclus</span>`:``}
        </div>
        ${s}
      </div>`}).join(``);return`
      <p class="dv-text">Ajoute ce qu’il te faut. Certaines options sont déjà incluses dans ton forfait ${e.name}.</p>
      <div class="dv-opts">${t}</div>
      <div class="dv-actions">
        <button type="button" class="btn-ghost" data-prev>← Retour</button>
        <button type="button" class="btn-dark" data-next>Continuer : tes infos →</button>
      </div>`}function I(){return`
      <form class="dv-form" data-form novalidate>
        <div class="dv-form__head">
          <h3 class="dv-h3">Dernière étape avant ton devis !</h3>
          <p>On t’envoie aussi ton ticket par mail pour le garder sous le coude.</p>
          <p>Offre réservée aux professionnels et aux associations.</p>
        </div>
        <div class="dv-fields">${_.map(([e,t,n,r,i])=>`<label class="dv-field">${t}${i?` *`:``}
        <input type="${n}" name="${e}" value="${x(S.form[e])}" placeholder="${r}" ${i?`required`:``}
          autocomplete="${e===`nom`?`family-name`:e===`prenom`?`given-name`:e===`societe`?`organization`:`email`}" data-field="${e}">
      </label>`).join(``)}</div>
        <div class="dv-hp" aria-hidden="true"><label>Site web <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <label class="dv-consent">
          <input type="checkbox" data-consent ${S.consent?`checked`:``} required>
          <span>J’accepte que mes informations soient utilisées pour me recontacter dans le cadre de ma demande. <em>(Promis, pas de spam ni de commande pizza à ton insu.)</em></span>
        </label>
        <p class="dv-error" data-error role="alert" ${S.error?``:`hidden`}>${x(S.error)}</p>
        <div class="dv-actions">
          <button type="button" class="btn-ghost" data-prev>← Modifier</button>
          <button type="submit" class="dv-submit" data-submit>Recevoir mon devis →</button>
        </div>
      </form>`}function L(){let{total:e}=A();return`
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="dv-sent">${S.mailed?`✓ Devis envoyé à ${x(S.form.email.trim())}`:`✓ Demande de devis enregistrée`}</div>
        <h3 class="dv-result-title">Ton site ${C().name} pour ${y(e)} TTC/mois, ${x(S.form.prenom.trim()||`toi`)}.</h3>
        <div class="dv-result-text">
          <p>Le devis que tu vois n’est qu’une première esquisse : il sert à te donner une idée générale.</p>
          <p>Après ton premier café (ou thé !) avec notre équipe, on pourra peaufiner les chiffres, ajouter ou retirer des options, et faire en sorte que tout colle parfaitement à tes besoins.</p>
          <p>Donc, pas de panique : les montants et les services indiqués aujourd’hui ne sont pas gravés dans le marbre.</p>
        </div>
        ${R()}
        <div><button type="button" class="dv-restart" data-restart>Refaire un devis</button></div>
        <div class="dv-reassure">
          <span>✓ Réponse sous 24 h ouvrées</span><span>✓ Contrat clair, sans surprise</span><span>✓ Rien à payer avant validation</span>
        </div>
      </div>`}function R(){return S.qt?`
      <div class="dv-rdv" data-rdv>
        <div class="dv-rdv__intro" data-rdv-intro>
          <button type="button" class="btn btn--violet" data-calendly-load>Choisir mon créneau (30 min)</button>
          <p class="dv-rdv__legal">Le calendrier est fourni par Calendly, qui peut déposer des cookies : il ne se charge qu’après ton clic.
            Tu préfères ? <a href="${f}" target="_blank" rel="noopener">Ouvrir Calendly dans un nouvel onglet</a>.</p>
        </div>
        <div class="dv-rdv__cal" data-calendly-box hidden></div>
        <div class="dv-rdv__done" data-rdv-done hidden role="status"></div>
      </div>`:`<div><a href="${f}" class="btn btn--violet" target="_blank" rel="noopener">Prendre rendez-vous (30 min)</a></div>`}function z(){let e=l.querySelector(`[data-calendly-box]`),t=l.querySelector(`[data-rdv-intro]`);if(!e||!t)return;t.hidden=!0,e.hidden=!1,e.textContent=`Chargement du calendrier…`;let n=()=>{e.textContent=``,window.Calendly.initInlineWidget({url:`${f}?hide_gdpr_banner=1`,parentElement:e,prefill:{name:`${S.form.prenom.trim()} ${S.form.nom.trim()}`.trim(),email:S.form.email.trim()}})};if(window.Calendly)return n();let r=document.createElement(`script`);r.src=`https://assets.calendly.com/assets/external/widget.js`,r.async=!0,r.onload=n,r.onerror=()=>{e.innerHTML=`Le calendrier n’a pas pu se charger. <a href="${f}" target="_blank" rel="noopener">Ouvre Calendly dans un nouvel onglet</a>.`},document.head.appendChild(r)}let B=!1;async function V(e){if(B||!S.qt)return;B=!0,h(`rdv_scheduled`,{plan:S.plan});let t=l.querySelector(`[data-rdv-done]`),n=``,r=!1;try{let t=await fetch(`/api/questionnaire/rdv`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({qt:S.qt,invitee:e})}),i=await t.json().catch(()=>({}));t.ok&&typeof i.url==`string`&&(n=i.url,r=i.mailed===!0)}catch{}t&&(t.hidden=!1,t.innerHTML=n?`<strong>✓ Rendez-vous réservé !</strong>
         <p>Pour qu’on le prépare au mieux, prends 3 à 5 minutes pour répondre à quelques questions${r?` (on t’a aussi envoyé le lien par e-mail)`:``}.</p>
         <a href="${x(n)}" class="btn btn--green">Remplir le questionnaire</a>`:`<strong>✓ Rendez-vous réservé !</strong><p>Tu vas recevoir la confirmation de Calendly par e-mail.</p>`)}window.addEventListener(`message`,e=>{if(e.origin!==`https://calendly.com`||e.data?.event!==`calendly.event_scheduled`)return;let t=e.data?.payload?.invitee?.uri;V(typeof t==`string`?t:``)});function H(){let t=S.step===4;if(p.hidden=!t,!t){p.innerHTML=``;return}let n=C(),{lines:r,total:i,oneTime:a}=A(),o={e24:`Engagement initial de 24 mois. Ensuite : gardiennage 25,99 €/mois ou transfert 199 €.`,e12:`Engagement initial de 12 mois, puis au mois (préavis d’un mois). Transfert du site : 199 €.`,libre:`Sans engagement · résiliable à tout moment, préavis d’un mois. Transfert du site : 499 €.`}[S.formule],s=(e,t,n=``)=>`<div class="dv-ticket__line"><span class="${n}">${e}</span><span>${t}</span></div>`;p.innerHTML=`
      <div class="dv-ticket-shadow">
        <div class="dv-ticket" aria-label="Récapitulatif du devis">
          <div class="dv-ticket__head">
            <span class="dv-ticket__title">DEVIS / MOYO</span>
            <span>${S.ticketNo}</span>
            <span>Servi par : Mo’ · ${new Date().toLocaleDateString(`fr-FR`)}</span>
          </div>
          <div class="dv-ticket__rule"></div>
          <strong>&gt;&gt;&gt; FORFAIT</strong>
          ${s(`FORFAIT ${n.name.toUpperCase()} · ${e[S.formule].short.toUpperCase()}`,y(w()))}
          <strong>&gt;&gt;&gt; OPTIONS</strong>
          ${r.map(e=>s(e.name,e.price,`dv-ticket__upper`)).join(``)}
          ${r.length?``:`<span class="dv-ticket__muted">— aucune option —</span>`}
          <div class="dv-ticket__rule"></div>
          ${s(`SOUS-TOTAL`,y(i))}
          <span style="font-size:11.5px">TVA non applicable, art. 293 B du CGI</span>
          <div class="dv-ticket__total"><span>TOTAL TTC</span><span>${y(i)}/mois</span></div>
          ${a?`<div class="dv-ticket__line" style="font-weight:700"><span>+ 1 FOIS, AVEC LA 1RE MENSUALITÉ</span><span>${y(a)}</span></div>`:``}
          <div class="dv-ticket__barcode" aria-hidden="true"></div>
          <span class="dv-center" style="letter-spacing:.12em">${S.barcode}</span>
          <span class="dv-center" style="font-size:11.5px;line-height:1.5">${o}<br>Hébergement, domaine, maintenance inclus.</span>
          <span class="dv-center"><a href="/cgv/">Voir les CGV</a></span>
          <span class="dv-center" style="font-weight:700;padding-top:4px">MERCI &amp; À BIENTÔT !</span>
        </div>
      </div>`}function U(){let e=l.querySelector(`[data-submit]`);e&&(e.disabled=!j()||S.sending)}function W(){N(),l.innerHTML=[P,F,I,L][S.step-1](),U(),H()}async function G(){if(j()&&!S.sending){if(S.error=``,m){S.sending=!0,U();let e=l.querySelector(`[name="website"]`)?.value??``;try{let t=await fetch(m,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({ticketNo:S.ticketNo,contact:{...S.form},consent:S.consent,website:e,...k()})});if(!t.ok)throw Error(String(t.status));let n=await t.json().catch(()=>({}));S.mailed=n.mailed===!0,S.qt=typeof n.qt==`string`?n.qt:``;let r=d(k());h(`generate_lead`,{value:r.totalMonthly,currency:`EUR`,plan:r.plan.name,formule:r.formule})}catch{S.sending=!1,S.error=`Oups, l’envoi n’a pas fonctionné. Réessaie dans un instant ou écris-nous à hello@moyoweb.fr.`;let e=l.querySelector(`[data-error]`);e&&(e.textContent=S.error,e.hidden=!1),U();return}S.sending=!1}M(4)}}function K(e){let t=i.find(t=>t.id===e);t&&!O(t)&&t.id!==`seo`&&(S.sel[e]=!S.sel[e],W(),s.querySelector(`[data-opt="${e}"]`)?.focus())}let q=!1,J=()=>{q||(q=!0,h(`devis_start`,{plan:S.plan,formule:S.formule}))};s.addEventListener(`click`,e=>{e.target.closest(`a[href*="calendly.com"]`)&&h(`calendly_click`,{location:S.step===4?`devis_resultat`:`devis_besoin_specifique`,plan:S.plan});let n=e.target.closest(`[data-go],[data-formule],[data-plan],[data-next],[data-prev],[data-restart],[data-seo],[data-opt],[data-calendly-load]`);if(!n||!s.contains(n))return;J();let r=n.dataset;`calendlyLoad`in r?(h(`calendly_click`,{location:`devis_calendrier_integre`,plan:S.plan}),z()):r.go?S.step!==4&&M(Number(r.go)):r.formule?(t(r.formule)&&(S.formule=r.formule),W()):r.plan?(S.plan=r.plan,S.seo=null,W(),s.querySelector(`[data-plan="${r.plan}"]`)?.focus()):`next`in r?M(S.step+1):`prev`in r?M(S.step-1):`restart`in r?M(1):r.seo?(S.seo=Math.max(0,E()+Number(r.seo)),W(),s.querySelector(`[data-seo="${r.seo}"]`)?.focus()):r.opt&&K(r.opt)}),s.addEventListener(`keydown`,e=>{let t=e.target;t.dataset.opt&&(e.key===` `||e.key===`Enter`)&&(e.preventDefault(),K(t.dataset.opt))}),s.addEventListener(`input`,e=>{let t=e.target,n=t.dataset.field;n&&J(),n&&(S.form[n]=t.value),U()}),s.addEventListener(`change`,e=>{let t=e.target;`consent`in t.dataset&&(S.consent=t.checked,U())}),s.addEventListener(`submit`,e=>{e.preventDefault(),G()}),W()}var C=document.querySelector(`[data-devis]`);C&&S(C);