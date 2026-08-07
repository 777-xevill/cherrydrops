/* ============================================================
   Member Portal — single-page app, hash-routed.
   ============================================================ */

import * as store from './core/store.js';
import * as auth from './core/auth.js';
import { $, $$, html, esc, icon, money, fmtDate, fmtDateTime, pct, num, toast, clamp } from './core/util.js';
import { sparkline, lineChart, stackedBar100 } from './core/charts.js';
import { renderMuscleMap } from './core/muscle-map.js';
import { analyzeDiet, ACTIVITY_LEVELS, GOALS, bmiCategory } from './core/nutrition.js';
import { GYM_PROFILE, MUSCLE_GROUPS, FOODS } from './core/seed.js';

store.init();
store.refreshLiveMembers();

const WHATSAPP_NUMBER = '8801610021342';
const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

const app = $('#app');

const ROUTES = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'gym', label: 'Gym & History', icon: 'sparkle' },
  { id: 'location', label: 'Location & Contact', icon: 'pin' },
  { id: 'packages', label: 'Packages & Renew', icon: 'card' },
  { id: 'trainer', label: 'Trainer', icon: 'dumbbell' },
  { id: 'diet', label: 'Diet Analysis', icon: 'leaf' },
  { id: 'payments', label: 'Payments', icon: 'chart' },
];

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  return ROUTES.some((r) => r.id === hash) ? hash : 'overview';
}

/* ---------------- boot / router ---------------- */

function render() {
  const memberId = auth.currentMemberId();
  if (!memberId || !store.member(memberId)) { renderLogin(); return; }
  renderShell(store.member(memberId), currentRoute());
}

window.addEventListener('hashchange', render);
store.subscribe(() => { if (auth.currentMemberId()) render(); });
// Deferred to a microtask so the whole module finishes evaluating first —
// an already-logged-in visit renders synchronously through view functions
// that close over consts/lets declared further down this file.
queueMicrotask(render);

/* ---------------- login ---------------- */

function renderLogin() {
  app.innerHTML = html`
    <div class="min-h-screen flex items-center justify-center px-5 py-12">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <a href="index.html" class="inline-flex items-center gap-3 group">
            <span class="relative block h-14 w-14 rounded-full overflow-hidden ring-1 ring-bronze/35">
              <img src="brand_assets/brand%20logo.jpg" alt="" class="h-full w-full object-cover scale-[1.06]">
            </span>
          </a>
          <p class="eyebrow mt-5">Member Portal</p>
          <h1 class="h-sec mt-2 text-white" style="font-size:clamp(1.8rem,4vw,2.6rem)">Welcome <span class="foil">back</span></h1>
          <div class="rule mx-auto mt-4"></div>
        </div>

        <form id="login-form" class="card p-7">
          <label class="label" for="identifier">Member ID, phone or email</label>
          <input class="input" id="identifier" name="identifier" placeholder="Enter Member id" autocomplete="username" required>
          <p id="login-err" class="err hidden"></p>
          <button type="submit" class="btn btn-primary w-full mt-5">Sign In</button>
          <p class="hint mt-4">Enter your Member ID, phone number, or email to access your account.</p>
        </form>

        <p class="text-center mt-6">
          <a href="index.html" class="text-sm text-bronze-light hover:text-white transition-colors duration-300">&larr; Back to site</a>
          &nbsp;·&nbsp;
          <a href="staff.html" class="text-sm text-bronze-light hover:text-white transition-colors duration-300">Staff sign in</a>
        </p>
      </div>
    </div>
  `;

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const result = auth.memberLogin($('#identifier').value);
    const errEl = $('#login-err');
    if (!result.ok) { errEl.textContent = result.error; errEl.classList.remove('hidden'); return; }
    location.hash = '#/overview';
    render();
  });
}

/* ---------------- shell ---------------- */

function renderShell(member, route) {
  const status = store.membershipStatus(member);
  const branch = store.branch(member.branchId);

  app.innerHTML = html`
    <div class="shell">
      <aside class="sidebar">
        <a href="index.html" class="flex items-center gap-3 px-2 pb-4 mb-2 border-b border-bronze/12">
          <span class="block h-10 w-10 rounded-full overflow-hidden ring-1 ring-bronze/35 shrink-0">
            <img src="brand_assets/brand%20logo.jpg" alt="" class="h-full w-full object-cover scale-[1.06]">
          </span>
          <span class="leading-none">
            <span class="block font-display text-sm font-extrabold tracking-[.02em] foil">CHERRY DROPS</span>
            <span class="block font-display text-[.55rem] tracking-[.28em] text-bronze mt-1">MEMBER PORTAL</span>
          </span>
        </a>

        <div class="px-2 pb-4 mb-1">
          <p class="font-display text-lg text-white leading-tight">${member.name}</p>
          <p class="text-xs text-bronze mt-0.5">${member.id} · ${esc(branch?.short ?? '')}</p>
          <span class="badge badge-${status.level} mt-2">${icon(status.level === 'good' ? 'check' : 'alert')}${esc(status.label)}</span>
        </div>

        <nav class="flex-1" aria-label="Portal">
          ${ROUTES.map((r) => `
            <button type="button" class="navitem" data-route="${r.id}" aria-current="${r.id === route ? 'page' : 'false'}">
              ${icon(r.icon)}<span>${esc(r.label)}</span>
            </button>
          `).join('')}
        </nav>

        <button type="button" id="logout-btn" class="navitem mt-2" style="border-top:1px solid rgba(201,169,138,.13); padding-top:.85rem;">
          ${icon('logout')}<span>Sign Out</span>
        </button>
      </aside>

      <main class="view field grain" id="view"></main>
    </div>
  `;

  $$('.navitem[data-route]').forEach((btn) => btn.addEventListener('click', () => { location.hash = `#/${btn.dataset.route}`; }));
  $('#logout-btn').addEventListener('click', () => { auth.memberLogout(); location.hash = '#/overview'; render(); });

  const view = $('#view');
  const renderers = {
    overview: viewOverview, gym: viewGym, location: viewLocation,
    packages: viewPackages, trainer: viewTrainer, diet: viewDiet, payments: viewPayments,
  };
  (renderers[route] || viewOverview)(view, member);
}

/* ---------------- shared bits ---------------- */

function viewHead(eyebrow, title, sub) {
  return html`
    <div class="view-head">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h2 class="h-sec mt-2 text-white" style="font-size:clamp(1.6rem,3.4vw,2.3rem)">${title}</h2>
        <div class="rule mt-3"></div>
        ${sub ? `<p class="lede mt-3 max-w-xl">${sub}</p>` : ''}
      </div>
    </div>
  `;
}

const methodSwatch = (id) => store.paymentMethod(id)?.color ?? 'var(--bronze)';

/* ---------------- overview ---------------- */

function viewOverview(view, member) {
  const status = store.membershipStatus(member);
  const branch = store.branch(member.branchId);
  const plan = store.pkg(member.packageId);
  const recentPayments = store.paymentsFor(member.id).slice(0, 5);
  const trainerBooking = store.activeBooking(member.id);
  const trainer = trainerBooking ? store.trainer(trainerBooking.trainerId) : null;

  view.innerHTML = html`
    ${viewHead('Your Account', `Hi, ${member.name.split(' ')[0]}`, `Everything about your membership at ${branch?.name ?? 'Cherry Drops'} in one place.`)}

    <div class="card p-6 mb-5">
      <p class="eyebrow !tracking-[.2em] mb-1">Target Muscle Guide</p>
      <p class="lede mb-4" style="font-size:.95rem">Pick a muscle group to see where it sits and how to train it.</p>
      <div class="grid md:grid-cols-[220px_minmax(0,1fr)] gap-6">
        <div id="muscle-canvas" class="flex justify-center"></div>
        <div>
          <div class="flex flex-wrap gap-2 mb-4" id="muscle-tabs">
            ${MUSCLE_GROUPS.map((g, i) => `<button type="button" class="btn btn-ghost btn-sm" data-muscle="${g.id}" data-i="${i}">${esc(g.name)}</button>`).join('')}
          </div>
          <div id="muscle-detail"></div>
        </div>
      </div>
    </div>

    <div class="grid-auto mb-5">
      <div class="card stat">
        <p class="stat-label">Status</p>
        <p class="stat-value" style="font-size:1.5rem">
          <span class="badge badge-${status.level}">${icon(status.level === 'good' ? 'check' : 'alert')}${esc(status.label)}</span>
        </p>
        <p class="stat-sub">${status.daysLeft >= 0 ? `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} remaining` : `Expired ${Math.abs(status.daysLeft)} day${Math.abs(status.daysLeft) === 1 ? '' : 's'} ago`}</p>
      </div>
      <div class="card stat">
        <p class="stat-label">Current Package</p>
        <p class="stat-value" style="font-size:1.5rem">${esc(plan?.name ?? '—')}</p>
        <p class="stat-sub">${plan ? money(plan.price) + ` / ${plan.months === 1 ? 'month' : plan.months + ' months'}` : ''} · renews ${esc(fmtDate(member.expiry))}</p>
      </div>
      <div class="card stat">
        <p class="stat-label">Check-ins (last 6 periods)</p>
        <p class="stat-value" style="font-size:1.5rem">${member.attendance[member.attendance.length - 1]}<span class="text-base text-bronze font-normal"> visits</span></p>
        <div class="spark-holder"></div>
      </div>
      <div class="card stat">
        <p class="stat-label">Your Trainer</p>
        <p class="stat-value" style="font-size:1.35rem">${trainer ? esc(trainer.name) : 'Not selected'}</p>
        <p class="stat-sub">${trainer ? esc(trainer.title) : 'Choose a coach for hands-on programming'}</p>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div class="card p-6">
        <p class="eyebrow !tracking-[.2em]">Quick Actions</p>
        <div class="grid sm:grid-cols-2 gap-3 mt-4">
          <button type="button" class="btn btn-primary" data-go="packages">${icon('card')}Renew Membership</button>
          <button type="button" class="btn btn-ghost" data-go="trainer">${icon('dumbbell')}${trainer ? 'Manage Trainer' : 'Book a Trainer'}</button>
          <button type="button" class="btn btn-ghost" data-go="diet">${icon('leaf')}Diet Analysis</button>
          <button type="button" class="btn btn-ghost" data-go="payments">${icon('chart')}Payment History</button>
        </div>
      </div>

      <div class="card p-6">
        <p class="eyebrow !tracking-[.2em]">Recent Payments</p>
        ${recentPayments.length ? html`
          <ul class="mt-4 grid gap-3">
            ${recentPayments.map((p) => `
              <li class="flex items-center justify-between gap-3 text-sm">
                <span class="flex items-center gap-2 text-white/75">
                  <span class="swatch inline-block w-2.5 h-2.5 rounded-sm" style="background:${methodSwatch(p.method)}"></span>
                  ${esc(fmtDate(p.date))}
                </span>
                <span class="text-white font-semibold">${esc(money(p.amount))}</span>
              </li>
            `).join('')}
          </ul>
        ` : '<p class="text-white/50 mt-4 text-sm">No payments recorded yet.</p>'}
        <button type="button" class="btn btn-ghost btn-sm w-full mt-4" data-go="payments">View all</button>
      </div>
    </div>
  `;

  sparkline($('.spark-holder', view), member.attendance, { color: 'var(--series-2)' });
  $$('[data-go]', view).forEach((b) => b.addEventListener('click', () => { location.hash = `#/${b.dataset.go}`; }));

  let activeMuscle = MUSCLE_GROUPS[0];
  function paintMuscle() {
    renderMuscleMap($('#muscle-canvas', view), { region: activeMuscle.region, activeId: activeMuscle.id });
    $$('[data-muscle]', view).forEach((b) => b.classList.toggle('!border-crimson', b.dataset.muscle === activeMuscle.id));
    $('#muscle-detail', view).innerHTML = html`
      <h4 class="h-card text-white" style="font-size:1.1rem">${esc(activeMuscle.name)}</h4>
      <p class="text-white/60 text-sm mt-1.5 leading-relaxed">${esc(activeMuscle.summary)}</p>
      <div class="table-wrap mt-4">
        <table class="data">
          <thead><tr><th>Exercise</th><th>Sets × Reps</th><th>Cue</th></tr></thead>
          <tbody>
            ${activeMuscle.exercises.map((ex) => `<tr><td class="text-white">${esc(ex.name)}</td><td>${esc(ex.sets)}</td><td>${esc(ex.cue)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  $$('[data-muscle]', view).forEach((b) => b.addEventListener('click', () => {
    activeMuscle = MUSCLE_GROUPS[Number(b.dataset.i)];
    paintMuscle();
  }));
  paintMuscle();
}

/* ---------------- gym info & history ---------------- */

function viewGym(view) {
  view.innerHTML = html`
    ${viewHead('The Gym', 'Info & History', 'How Cherry Drops got here, and what the standard actually means.')}

    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5">
      <div class="card p-6">
        <p class="eyebrow !tracking-[.2em]">Founder</p>
        <h3 class="h-card mt-2 text-white" style="font-size:1.4rem">${esc(GYM_PROFILE.founder)}</h3>
        <p class="lede mt-3">Cherry Drops was built around one standard — equipment that works, rooms that are genuinely clean, and members treated like people rather than subscriptions.</p>
        <p class="mt-5 font-display text-lg tracking-[.14em] uppercase ember">${esc(GYM_PROFILE.tagline)}</p>

        <p class="eyebrow !tracking-[.2em] mt-7">Amenities</p>
        <ul class="mt-3 grid gap-2">
          ${GYM_PROFILE.amenities.map((a) => `<li class="flex gap-2.5 text-sm text-white/75"><span class="text-crimson-lite mt-0.5">${icon('check', 'w-4 h-4 shrink-0')}</span>${esc(a)}</li>`).join('')}
        </ul>
      </div>

      <div class="card p-6">
        <p class="eyebrow !tracking-[.2em]">Timeline</p>
        <ol class="mt-4 grid gap-5">
          ${GYM_PROFILE.history.map((h) => `
            <li class="flex gap-4">
              <span class="font-display text-2xl font-extrabold text-bronze w-16 shrink-0">${esc(h.year)}</span>
              <span>
                <span class="block text-white font-semibold">${esc(h.title)}</span>
                <span class="block text-sm text-white/60 mt-1 leading-relaxed">${esc(h.body)}</span>
              </span>
            </li>
          `).join('')}
        </ol>
      </div>
    </div>
  `;
}

/* ---------------- location & contacts ---------------- */

function viewLocation(view, member) {
  view.innerHTML = html`
    ${viewHead('Visit Us', 'Location & Contacts', 'Both branches share one membership, one standard.')}
    <div class="grid md:grid-cols-2 gap-5">
      ${store.branches().map((b) => `
        <div class="card p-6 ${b.id === member.branchId ? '!border-crimson/40' : ''}">
          <div class="flex items-center justify-between gap-3">
            <p class="eyebrow !tracking-[.2em] ${b.id === member.branchId ? '!text-crimson-lite' : ''}">${esc(b.role)}</p>
            ${b.id === member.branchId ? '<span class="badge badge-neutral">Your Branch</span>' : ''}
          </div>
          <h3 class="h-card mt-2 text-white" style="font-size:1.4rem">${esc(b.name)}</h3>
          <p class="mt-2 text-white/70 leading-relaxed text-sm">${esc(b.address)}</p>
          <div class="mt-4 grid gap-2 text-sm">
            ${b.hours.map((h) => `<p class="text-white/60"><span class="text-bronze">${esc(h.days)}:</span> ${esc(h.open)}</p>`).join('')}
          </div>
          <div class="mt-5 flex flex-wrap gap-2.5">
            <a href="tel:+880${b.phone.replace(/\D/g, '').slice(1)}" class="btn btn-ghost btn-sm">${icon('phone')}${esc(b.phone)}</a>
            <a href="${esc(b.maps)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">${icon('pin')}Open in Maps</a>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="card p-6 mt-5">
      <p class="eyebrow !tracking-[.2em]">Head Office</p>
      <p class="mt-2 text-white/70 text-sm">${icon('phone', 'inline w-4 h-4 mr-1.5 -mt-0.5')}<a href="tel:+8801610021342" class="hover:text-white">${esc(GYM_PROFILE.phone)}</a></p>
      <p class="mt-1 text-white/70 text-sm">${icon('sheet', 'inline w-4 h-4 mr-1.5 -mt-0.5')}<a href="mailto:${esc(GYM_PROFILE.email)}" class="hover:text-white">${esc(GYM_PROFILE.email)}</a></p>
    </div>
  `;
}

/* ---------------- packages & renew ---------------- */

function viewPackages(view, member) {
  const status = store.membershipStatus(member);
  const offers = store.offersFor(member);

  view.innerHTML = html`
    ${viewHead('Membership', 'Packages & Renew', 'Pick a plan and message the front desk on WhatsApp to confirm and pay.')}

    ${offers.length ? html`
      <div class="card p-5 mb-5 !border-crimson/35">
        <p class="eyebrow !tracking-[.2em] !text-crimson-lite">Offers Available To You</p>
        <div class="grid sm:grid-cols-2 gap-3 mt-3">
          ${offers.map((o) => `
            <div class="flex items-start gap-3">
              <span class="badge badge-good shrink-0">-${o.discountPct}%</span>
              <span class="text-sm text-white/70"><strong class="text-white">${esc(o.label)}.</strong> ${esc(o.blurb)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      ${store.packages().map((p) => {
        const current = p.id === member.packageId;
        return html`
        <article class="card p-6 ${p.popular ? '!border-crimson/45' : ''}">
          <div class="flex items-center justify-between gap-3 min-h-[28px]">
            <p class="eyebrow !tracking-[.2em] ${p.popular ? '!text-crimson-lite' : ''}">${esc(p.name)}</p>
            ${p.popular ? '<span class="font-display text-[.6rem] uppercase tracking-[.18em] bg-crimson text-white px-2 py-0.5">Popular</span>' : ''}
            ${current ? '<span class="badge badge-neutral">Current</span>' : ''}
          </div>
          <p class="mt-4 font-display text-4xl font-extrabold text-white leading-none">${money(p.price)}<span class="text-sm font-500 text-white/60"> / ${p.months === 1 ? 'mo' : `${p.months} mo`}</span></p>
          <p class="mt-2 text-white/55 text-sm">${esc(p.blurb)}</p>
          <ul class="mt-5 grid gap-2 text-sm text-white/70">
            ${p.perks.map((perk) => `<li class="flex gap-2"><span class="text-crimson-lite">—</span>${esc(perk)}</li>`).join('')}
          </ul>
          <button type="button" class="btn ${current ? 'btn-ghost' : 'btn-primary'} w-full mt-6" data-renew="${p.id}">
            ${current ? 'Renew via WhatsApp' : 'Switch via WhatsApp'}
          </button>
        </article>
      `;}).join('')}
    </div>
  `;

  $$('[data-renew]', view).forEach((btn) => btn.addEventListener('click', () => openRenewModal(member.id, btn.dataset.renew)));
}

function openRenewModal(memberId, packageId) {
  const member = store.member(memberId);
  const quote = store.quoteRenewal(member, packageId);
  if (!quote) return;

  const message = [
    "Hi! I'd like to renew my Cherry Drops membership.",
    `Member ID: ${member.id}`,
    `Name: ${member.name}`,
    `Plan: ${quote.packageName}`,
    `Amount: ${money(quote.amount)}`,
  ].join('\n');

  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.innerHTML = html`
    <div class="modal-head">
      <h3 class="h-card text-white" style="font-size:1.2rem">Confirm Renewal</h3>
      <button type="button" class="btn btn-ghost btn-sm" data-close aria-label="Close">${icon('x')}</button>
    </div>
    <div class="modal-body">
      <div class="card p-4 mb-5">
        <div class="flex justify-between text-sm text-white/70"><span>Plan</span><span class="text-white">${esc(quote.packageName)}</span></div>
        <div class="flex justify-between text-sm text-white/70 mt-1.5"><span>Price</span><span class="text-white">${esc(money(quote.gross))}</span></div>
        ${quote.offer ? `<div class="flex justify-between text-sm mt-1.5"><span class="text-good">${esc(quote.offer.label)} (-${quote.discountPct}%)</span><span class="text-good">-${esc(money(quote.saving))}</span></div>` : ''}
        <div class="flex justify-between text-base mt-3 pt-3 border-t border-bronze/15"><span class="text-bronze font-semibold">Total</span><span class="text-white font-bold">${esc(money(quote.amount))}</span></div>
        <p class="hint mt-2">New expiry: ${esc(fmtDate(quote.newExpiry))}</p>
      </div>
      <p class="hint">Message the front desk on WhatsApp to confirm and pay — they'll update your membership right away.</p>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-ghost" data-close>Cancel</button>
      <a href="${waLink(message)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" id="wa-btn">${icon('phone')}Message on WhatsApp</a>
    </div>
  `;
  document.body.append(dlg);
  dlg.showModal();

  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('close', () => dlg.remove());
  $('#wa-btn', dlg).addEventListener('click', () => dlg.close());
}

/* ---------------- trainer ---------------- */

function viewTrainer(view, member) {
  const active = store.activeBooking(member.id);
  const activeTrainer = active ? store.trainer(active.trainerId) : null;

  function paint(branchFilter) {
    const pool = store.trainers().filter((t) => branchFilter === 'all' || t.branchId === branchFilter);
    view.innerHTML = html`
      ${viewHead('Coaching', 'Trainer Selection', 'Every member trains alongside floor coaches. One-to-one personal training is an optional add-on.')}

      ${activeTrainer ? html`
        <div class="card p-6 mb-5 !border-crimson/35">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="eyebrow !tracking-[.2em] !text-crimson-lite">Your Trainer</p>
              <h3 class="h-card mt-1 text-white" style="font-size:1.35rem">${esc(activeTrainer.name)}</h3>
              <p class="text-white/60 text-sm mt-1">${esc(activeTrainer.title)} · ${money(activeTrainer.ratePerMonth)}/mo · slot ${esc(active.slot)}</p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" id="cancel-trainer">Cancel Booking</button>
          </div>
        </div>
      ` : ''}

      <div class="filters">
        <span class="label !mb-0">Branch</span>
        <div class="seg" id="branch-seg">
          <button type="button" data-b="${member.branchId}" aria-pressed="${branchFilter === member.branchId}">Your Branch</button>
          <button type="button" data-b="all" aria-pressed="${branchFilter === 'all'}">All Branches</button>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-5">
        ${pool.map((t) => {
          const full = t.booked >= t.capacity;
          const isMine = active?.trainerId === t.id;
          const branch = store.branch(t.branchId);
          return html`
          <article class="card p-6 ${isMine ? '!border-crimson/40' : ''}">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="h-card text-white" style="font-size:1.2rem">${esc(t.name)}</h3>
                <p class="text-bronze text-sm mt-0.5">${esc(t.title)} · ${esc(branch?.short)}</p>
              </div>
              <span class="badge badge-neutral shrink-0">★ ${t.rating}</span>
            </div>
            <p class="text-white/60 text-sm mt-3 leading-relaxed">${esc(t.bio)}</p>
            <div class="flex flex-wrap gap-1.5 mt-3">
              ${t.specialities.map((s) => `<span class="badge badge-neutral">${esc(s)}</span>`).join('')}
            </div>
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-bronze/12">
              <div class="text-sm">
                <span class="text-white font-semibold">${money(t.ratePerMonth)}</span><span class="text-white/50">/mo</span>
                <span class="block text-xs text-white/45 mt-0.5">${t.experience} yrs experience · ${t.booked}/${t.capacity} slots booked</span>
              </div>
              <button type="button" class="btn btn-sm ${isMine ? 'btn-ghost' : 'btn-primary'}" data-book="${t.id}" ${full && !isMine ? 'disabled' : ''}>
                ${isMine ? 'Selected' : full ? 'Full' : 'Book'}
              </button>
            </div>
          </article>
        `;}).join('')}
      </div>
    `;

    $$('[data-b]', view).forEach((b) => b.addEventListener('click', () => paint(b.dataset.b)));
    $('#cancel-trainer', view)?.addEventListener('click', () => {
      store.cancelBooking(member.id);
      toast('Trainer booking cancelled.');
      paint(branchFilter);
    });
    $$('[data-book]', view).forEach((b) => b.addEventListener('click', () => openBookModal(member.id, b.dataset.book, () => paint(branchFilter))));
  }

  paint(member.branchId);
}

function openBookModal(memberId, trainerId, onDone) {
  const t = store.trainer(trainerId);
  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.innerHTML = html`
    <div class="modal-head">
      <h3 class="h-card text-white" style="font-size:1.2rem">Book ${esc(t.name)}</h3>
      <button type="button" class="btn btn-ghost btn-sm" data-close aria-label="Close">${icon('x')}</button>
    </div>
    <div class="modal-body">
      <p class="label">Choose a weekly slot</p>
      <div class="grid grid-cols-3 gap-2">
        ${t.slots.map((s) => `<button type="button" class="btn btn-ghost btn-sm" data-slot="${s}">${esc(s)}</button>`).join('')}
      </div>
      <p class="hint mt-4">Billed at ${esc(money(t.ratePerMonth))}/month, recorded separately from your membership package.</p>
    </div>
  `;
  document.body.append(dlg);
  dlg.showModal();
  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('close', () => dlg.remove());
  $$('[data-slot]', dlg).forEach((btn) => btn.addEventListener('click', () => {
    try {
      store.bookTrainer(memberId, trainerId, btn.dataset.slot);
      toast(`Booked with ${t.name} at ${btn.dataset.slot}.`, 'good');
      dlg.close();
      onDone();
    } catch (err) {
      toast(err.message, 'bad');
    }
  }));
}

/* ---------------- diet analysis ---------------- */

function viewDiet(view, member) {
  // Prefer the inputs from the last analysis over the member's base
  // profile, since saving a plan triggers a full re-render of this view
  // — without this, the form would snap back to the profile defaults
  // right after a successful Analyze instead of keeping what was typed.
  const profile = { ...member, ...(member.dietPlan?.inputs ?? {}) };

  view.innerHTML = html`
    ${viewHead('Optional', 'AI Diet Chart Analysis', 'A calorie and macro plan computed from your height, weight and goal — plus a target-muscle guide for your next session.')}

    <div class="grid lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] gap-5">
      <form id="diet-form" class="card p-6 h-fit">
        <p class="eyebrow !tracking-[.2em] mb-4">Your Details</p>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label" for="d-height">Height (cm)</label><input class="input" id="d-height" type="number" min="120" max="230" value="${profile.heightCm}" required></div>
          <div><label class="label" for="d-weight">Weight (kg)</label><input class="input" id="d-weight" type="number" min="30" max="220" step="0.1" value="${profile.weightKg}" required></div>
          <div><label class="label" for="d-age">Age</label><input class="input" id="d-age" type="number" min="14" max="80" value="${profile.age}" required></div>
          <div>
            <label class="label" for="d-gender">Gender</label>
            <select class="select" id="d-gender">
              <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>Female</option>
            </select>
          </div>
        </div>
        <label class="label mt-3" for="d-activity">Activity level</label>
        <select class="select" id="d-activity">
          ${Object.entries(ACTIVITY_LEVELS).map(([id, a]) => `<option value="${id}" ${profile.activity === id ? 'selected' : ''}>${esc(a.label)} — ${esc(a.hint)}</option>`).join('')}
        </select>
        <label class="label mt-3" for="d-goal">Goal</label>
        <select class="select" id="d-goal">
          ${GOALS.map((g) => `<option value="${esc(g)}" ${profile.goal === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}
        </select>
        <button type="submit" class="btn btn-primary w-full mt-5">${icon('sparkle')}Analyze</button>
        <p class="hint mt-3">Computed instantly in your browser from standard nutrition formulas (Mifflin-St Jeor BMR, activity-scaled TDEE). No data leaves this device.</p>
      </form>

      <div id="diet-result"></div>
    </div>
  `;

  $('#diet-form', view).addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = {
      heightCm: Number($('#d-height', view).value),
      weightKg: Number($('#d-weight', view).value),
      age: Number($('#d-age', view).value),
      gender: $('#d-gender', view).value,
      activity: $('#d-activity', view).value,
      goal: $('#d-goal', view).value,
    };
    const result = analyzeDiet(inputs);
    store.saveDietPlan(member.id, { inputs, result });
    renderDietResult($('#diet-result', view), result);
  });

  if (member.dietPlan) renderDietResult($('#diet-result', view), member.dietPlan.result);
  else $('#diet-result', view).innerHTML = '<div class="card p-6 h-full flex items-center justify-center text-white/45 text-sm">Fill in your details and press Analyze.</div>';
}

function renderDietResult(container, result) {
  const cat = result.bmiCategory;
  container.innerHTML = html`
    <div class="card p-6">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p class="stat-label">BMI</p>
          <p class="stat-value" style="font-size:1.7rem">${result.bmi}</p>
          <span class="badge badge-${cat.level} mt-1">${esc(cat.label)}</span>
        </div>
        <div><p class="stat-label">BMR</p><p class="stat-value" style="font-size:1.7rem">${num(result.bmr)}</p><p class="stat-sub">kcal at rest</p></div>
        <div><p class="stat-label">TDEE</p><p class="stat-value" style="font-size:1.7rem">${num(result.tdee)}</p><p class="stat-sub">${esc(result.activityInfo.label)}</p></div>
        <div><p class="stat-label">Daily Target</p><p class="stat-value" style="font-size:1.7rem; color:var(--crimson-lift)">${num(result.targetCalories)}</p><p class="stat-sub">kcal / day</p></div>
      </div>

      <p class="eyebrow !tracking-[.2em] mt-6 mb-3">Macro Split</p>
      <div id="macro-bar"></div>
      <div class="grid grid-cols-3 gap-3 mt-3 text-sm">
        <div><span class="text-white font-semibold">${result.macros.protein.grams}g</span> <span class="text-white/50">protein</span></div>
        <div><span class="text-white font-semibold">${result.macros.carb.grams}g</span> <span class="text-white/50">carbs</span></div>
        <div><span class="text-white font-semibold">${result.macros.fat.grams}g</span> <span class="text-white/50">fat</span></div>
      </div>
      <p class="hint mt-2">Suggested water intake: ~${num(result.waterMl)} ml / day.</p>

      <p class="eyebrow !tracking-[.2em] mt-6 mb-3">Sample Day — ${esc(result.sampleDay.label)}</p>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Meal</th><th>Items</th><th class="num">kcal</th><th class="num">P / C / F</th></tr></thead>
          <tbody>
            ${result.sampleDay.meals.map((m) => `
              <tr>
                <td class="text-white">${esc(m.name)}</td>
                <td>${esc(m.items.join(', '))}</td>
                <td class="num">${Math.round(m.totals.kcal)}</td>
                <td class="num">${Math.round(m.totals.p)}g / ${Math.round(m.totals.c)}g / ${Math.round(m.totals.f)}g</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="hint mt-2">Day total ${Math.round(result.sampleDay.totals.kcal)} kcal — ${result.sampleDay.vsTargetCalories >= 0 ? '+' : ''}${result.sampleDay.vsTargetCalories} kcal vs. your target. Adjust portions to close the gap.</p>
    </div>
  `;

  stackedBar100($('#macro-bar', container), {
    segments: [
      { label: 'Protein', value: result.macros.protein.kcal, color: 'var(--series-1)' },
      { label: 'Carbs', value: result.macros.carb.kcal, color: 'var(--series-2)' },
      { label: 'Fat', value: result.macros.fat.kcal, color: 'var(--series-3)' },
    ],
  });
}

/* ---------------- payments ---------------- */

function viewPayments(view, member) {
  const rows = store.paymentsFor(member.id);
  view.innerHTML = html`
    ${viewHead('History', 'Payment History', `${rows.length} payment${rows.length === 1 ? '' : 's'} on record.`)}
    <div class="card p-0">
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Date</th><th>Item</th><th>Method</th><th>Reference</th><th class="num">Amount</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map((p) => `
              <tr>
                <td>${esc(fmtDate(p.date))}</td>
                <td class="text-white">${p.packageId === 'pt' ? 'Personal Training' : esc(store.pkg(p.packageId)?.name ?? p.packageId)}</td>
                <td><span class="swatch inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style="background:${methodSwatch(p.method)}"></span>${esc(store.paymentMethod(p.method)?.name ?? p.method)}</td>
                <td class="text-white/50">${esc(p.reference)}</td>
                <td class="num text-white">${esc(money(p.amount))}${p.discountPct ? `<span class="block text-xs text-good">-${p.discountPct}% applied</span>` : ''}</td>
              </tr>
            `).join('') : '<tr><td colspan="5" class="text-center text-white/45 py-8">No payments yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
