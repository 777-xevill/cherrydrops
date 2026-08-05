/* ============================================================
   Staff Console — member tracking + subscription-ending alerts.
   ============================================================ */

import * as store from './core/store.js';
import * as auth from './core/auth.js';
import { $, $$, html, esc, icon, money, fmtDate, num, toast, debounce } from './core/util.js';
import { barChart } from './core/charts.js';
import { charge } from './core/payments.js';

store.init();
store.refreshLiveMembers();
const app = $('#app');

const ROUTES = [
  { id: 'directory', label: 'Member Directory', icon: 'users' },
  { id: 'alerts', label: 'Expiry Alerts', icon: 'alert' },
];

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  return ROUTES.some((r) => r.id === hash) ? hash : 'directory';
}

// Declared before the first render() call below — a session that's
// already logged in (revisiting this page) renders synchronously on
// module load, so this must be initialized before that can happen.
let branchScope = 'all';

function render() {
  const s = auth.currentStaff();
  if (!s) { renderLogin(); return; }
  renderShell(s, currentRoute());
}
window.addEventListener('hashchange', render);
store.subscribe(() => { if (auth.currentStaff()) render(); });
// Deferred to a microtask so the whole module finishes evaluating first —
// an already-logged-in visit renders synchronously through view functions
// that close over consts/lets declared further down this file.
queueMicrotask(render);

/* ---------------- login ---------------- */

function renderLogin() {
  app.innerHTML = html`
    <div class="min-h-screen flex items-center justify-center px-5 py-12">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <a href="index.html" class="inline-flex items-center gap-3">
            <span class="relative block h-14 w-14 rounded-full overflow-hidden ring-1 ring-bronze/35">
              <img src="brand_assets/brand%20logo.jpg" alt="" class="h-full w-full object-cover scale-[1.06]">
            </span>
          </a>
          <p class="eyebrow mt-5">Internal</p>
          <h1 class="h-sec mt-2 text-white" style="font-size:clamp(1.8rem,4vw,2.4rem)">Staff <span class="foil">Console</span></h1>
          <div class="rule mx-auto mt-4"></div>
        </div>
        <form id="login-form" class="card p-7">
          <label class="label" for="pin">Staff PIN</label>
          <input class="input text-center tracking-[.5em]" id="pin" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" required>
          <p id="login-err" class="err hidden"></p>
          <button type="submit" class="btn btn-primary w-full mt-5">${icon('logout')}Sign In</button>
          <p class="hint mt-4">Demo PINs — Owner <strong class="text-white">2468</strong>, Manager <strong class="text-white">1357</strong>, Front desk <strong class="text-white">1111</strong> / <strong class="text-white">2222</strong>.</p>
        </form>
        <p class="text-center mt-6">
          <a href="index.html" class="text-sm text-bronze-light hover:text-white transition-colors duration-300">&larr; Back to site</a>
          &nbsp;·&nbsp;
          <a href="portal.html" class="text-sm text-bronze-light hover:text-white transition-colors duration-300">Member sign in</a>
        </p>
      </div>
    </div>
  `;
  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const result = auth.staffLogin($('#pin').value);
    const errEl = $('#login-err');
    if (!result.ok) { errEl.textContent = result.error; errEl.classList.remove('hidden'); return; }
    location.hash = '#/directory';
    render();
  });
}

/* ---------------- shell ---------------- */

function renderShell(s, route) {
  if (!auth.canSeeAllBranches(s)) branchScope = s.branchId;

  app.innerHTML = html`
    <div class="shell">
      <aside class="sidebar">
        <a href="index.html" class="flex items-center gap-3 px-2 pb-4 mb-2 border-b border-bronze/12">
          <span class="block h-10 w-10 rounded-full overflow-hidden ring-1 ring-bronze/35 shrink-0">
            <img src="brand_assets/brand%20logo.jpg" alt="" class="h-full w-full object-cover scale-[1.06]">
          </span>
          <span class="leading-none">
            <span class="block font-display text-sm font-extrabold tracking-[.02em] foil">CHERRY DROPS</span>
            <span class="block font-display text-[.55rem] tracking-[.28em] text-bronze mt-1">STAFF CONSOLE</span>
          </span>
        </a>
        <div class="px-2 pb-4 mb-1">
          <p class="font-display text-lg text-white leading-tight">${esc(s.name)}</p>
          <p class="text-xs text-bronze mt-0.5 uppercase tracking-[.14em]">${esc(s.role)}${s.branchId ? ` · ${esc(store.branch(s.branchId)?.short ?? '')}` : ' · all branches'}</p>
        </div>
        <nav class="flex-1" aria-label="Staff console">
          ${ROUTES.map((r) => `
            <button type="button" class="navitem" data-route="${r.id}" aria-current="${r.id === route ? 'page' : 'false'}">
              ${icon(r.icon)}<span>${esc(r.label)}</span>
            </button>
          `).join('')}
          ${auth.canSeeDashboard(s) ? `<a href="dashboard.html" class="navitem">${icon('chart')}<span>Ops Dashboard</span></a>` : ''}
        </nav>
        <button type="button" id="logout-btn" class="navitem mt-2" style="border-top:1px solid rgba(201,169,138,.13); padding-top:.85rem;">
          ${icon('logout')}<span>Sign Out</span>
        </button>
      </aside>
      <main class="view field grain" id="view"></main>
    </div>
  `;

  $$('.navitem[data-route]').forEach((btn) => btn.addEventListener('click', () => { location.hash = `#/${btn.dataset.route}`; }));
  $('#logout-btn').addEventListener('click', () => { auth.staffLogout(); render(); });

  const view = $('#view');
  (route === 'alerts' ? viewAlerts : viewDirectory)(view, s);
}

function branchFilterBar(s, onChange) {
  if (!auth.canSeeAllBranches(s)) return '';
  return html`
    <div class="filters">
      <span class="label !mb-0">Branch</span>
      <div class="seg" id="branch-seg">
        <button type="button" data-b="all" aria-pressed="${branchScope === 'all'}">All</button>
        ${store.branches().map((b) => `<button type="button" data-b="${b.id}" aria-pressed="${branchScope === b.id}">${esc(b.short)}</button>`).join('')}
      </div>
    </div>
  `;
}

function wireBranchFilter(view, repaint) {
  $$('#branch-seg [data-b]', view).forEach((btn) => btn.addEventListener('click', () => {
    branchScope = btn.dataset.b;
    repaint();
  }));
}

/* ---------------- directory ---------------- */

function viewDirectory(view, s) {
  let query = '';
  let statusFilter = 'all';

  function rows() {
    return store.members()
      .filter((m) => branchScope === 'all' || m.branchId === branchScope)
      .map((m) => ({ member: m, status: store.membershipStatus(m) }))
      .filter(({ status }) => statusFilter === 'all' || status.level === statusFilter)
      .filter(({ member: m }) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.phone.includes(q);
      })
      .sort((a, b) => a.status.daysLeft - b.status.daysLeft);
  }

  function paint() {
    const data = rows();
    view.innerHTML = html`
      <div class="view-head">
        <div>
          <p class="eyebrow">Members</p>
          <h2 class="h-sec mt-2 text-white" style="font-size:clamp(1.6rem,3.4vw,2.3rem)">Directory</h2>
          <div class="rule mt-3"></div>
        </div>
      </div>

      ${branchFilterBar(s)}

      <div class="filters">
        <input class="input" id="search" placeholder="Search name, ID or phone…" style="max-width:260px" value="${esc(query)}">
        <span class="label !mb-0 ml-2">Status</span>
        <div class="seg">
          ${['all', 'good', 'warning', 'serious', 'critical'].map((lv) => `<button type="button" data-status="${lv}" aria-pressed="${statusFilter === lv}">${lv === 'all' ? 'All' : lv[0].toUpperCase() + lv.slice(1)}</button>`).join('')}
        </div>
        <span class="text-sm text-white/45 ml-auto">${data.length} member${data.length === 1 ? '' : 's'}</span>
      </div>

      <div class="card p-0">
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Member</th><th>Branch</th><th>Package</th><th>Status</th><th>Expiry</th><th></th></tr></thead>
            <tbody>
              ${data.length ? data.map(({ member: m, status: st }) => `
                <tr>
                  <td><span class="text-white font-semibold">${esc(m.name)}</span><span class="block text-xs text-white/45">${esc(m.id)} · ${esc(m.phone)}</span></td>
                  <td>${esc(store.branch(m.branchId)?.short ?? '')}</td>
                  <td>${esc(store.pkg(m.packageId)?.name ?? '')}</td>
                  <td><span class="badge badge-${st.level}">${esc(st.label)}</span></td>
                  <td>${esc(fmtDate(m.expiry))}${st.daysLeft >= 0 ? `<span class="block text-xs text-white/45">${st.daysLeft}d left</span>` : `<span class="block text-xs text-crimson-lite">${Math.abs(st.daysLeft)}d ago</span>`}</td>
                  <td><button type="button" class="btn btn-ghost btn-sm" data-view="${m.id}">View</button></td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="text-center text-white/45 py-8">No members match.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    wireBranchFilter(view, paint);
    $('#search', view).addEventListener('input', debounce((e) => { query = e.target.value; paint(); }, 180));
    $$('[data-status]', view).forEach((b) => b.addEventListener('click', () => { statusFilter = b.dataset.status; paint(); }));
    $$('[data-view]', view).forEach((b) => b.addEventListener('click', () => openMemberDrawer(b.dataset.view, paint)));
  }

  paint();
}

/* ---------------- alerts ---------------- */

function viewAlerts(view, s) {
  function paint() {
    const cohorts = store.expiryCohorts(branchScope);
    const queue = store.expiringSoon(30, branchScope);

    view.innerHTML = html`
      <div class="view-head">
        <div>
          <p class="eyebrow">Renewals</p>
          <h2 class="h-sec mt-2 text-white" style="font-size:clamp(1.6rem,3.4vw,2.3rem)">Subscription-Ending Alerts</h2>
          <div class="rule mt-3"></div>
        </div>
      </div>

      ${branchFilterBar(s)}

      <div class="card p-6 mb-5">
        <p class="eyebrow !tracking-[.2em] mb-3">Members By Time-To-Expiry</p>
        <div id="cohort-chart"></div>
      </div>

      <div class="card p-0">
        <div class="table-wrap">
          <table class="data">
            <caption>Sorted soonest first — expired members appear at the top.</caption>
            <thead><tr><th>Member</th><th>Branch</th><th>Phone</th><th>Status</th><th>Expiry</th><th></th></tr></thead>
            <tbody>
              ${queue.length ? queue.map(({ member: m, status: st }) => `
                <tr>
                  <td class="text-white font-semibold">${esc(m.name)} <span class="block text-xs text-white/45 font-normal">${esc(m.id)}</span></td>
                  <td>${esc(store.branch(m.branchId)?.short ?? '')}</td>
                  <td><a href="tel:+880${m.phone.replace(/\D/g, '').slice(1)}" class="text-white/70 hover:text-white">${esc(m.phone)}</a></td>
                  <td><span class="badge badge-${st.level}">${esc(st.label)}</span></td>
                  <td>${esc(fmtDate(m.expiry))}</td>
                  <td><button type="button" class="btn btn-ghost btn-sm" data-view="${m.id}">Open</button></td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="text-center text-white/45 py-8">Nothing expiring in the next 30 days.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    wireBranchFilter(view, paint);
    barChart($('#cohort-chart', view), {
      horizontal: true,
      leftLabelWidth: 108,
      categories: cohorts.map((c) => ({ label: c.label })),
      series: [{ id: 'count', label: 'Members', color: 'var(--series-1)', colors: cohorts.map((c) => `var(--${c.level})`), values: cohorts.map((c) => c.count) }],
      legend: false,
      formatValue: (v) => num(v),
    });
    $$('[data-view]', view).forEach((b) => b.addEventListener('click', () => openMemberDrawer(b.dataset.view, paint)));
  }
  paint();
}

/* ---------------- member detail drawer ---------------- */

function openMemberDrawer(memberId, onDone) {
  const m = store.member(memberId);
  if (!m) return;
  const status = store.membershipStatus(m);
  const plan = store.pkg(m.packageId);
  const history = store.paymentsFor(memberId);
  const trainer = m.trainerId ? store.trainer(m.trainerId) : null;

  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.style.width = 'min(96vw, 820px)';
  dlg.innerHTML = html`
    <div class="modal-head">
      <div>
        <h3 class="h-card text-white" style="font-size:1.25rem">${esc(m.name)}</h3>
        <p class="text-xs text-bronze mt-0.5">${esc(m.id)} · ${esc(store.branch(m.branchId)?.name ?? '')}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" data-close aria-label="Close">${icon('x')}</button>
    </div>
    <div class="modal-body">
      <div class="grid sm:grid-cols-4 gap-4 mb-5">
        <div><p class="stat-label">Status</p><span class="badge badge-${status.level} mt-1">${esc(status.label)}</span></div>
        <div><p class="stat-label">Package</p><p class="text-white mt-1">${esc(plan?.name ?? '')}</p></div>
        <div><p class="stat-label">Expiry</p><p class="text-white mt-1">${esc(fmtDate(m.expiry))}</p></div>
        <div><p class="stat-label">Trainer</p><p class="text-white mt-1">${trainer ? esc(trainer.name) : '—'}</p></div>
      </div>
      <div class="grid sm:grid-cols-2 gap-4 mb-5 text-sm">
        <p class="text-white/60">${icon('phone', 'inline w-4 h-4 mr-1.5 -mt-0.5')}<a class="hover:text-white" href="tel:+880${m.phone.replace(/\D/g, '').slice(1)}">${esc(m.phone)}</a></p>
        <p class="text-white/60">${icon('sheet', 'inline w-4 h-4 mr-1.5 -mt-0.5')}${esc(m.email)}</p>
        <p class="text-white/60">Joined ${esc(fmtDate(m.joined))}</p>
        <p class="text-white/60">Goal: ${esc(m.goal)}</p>
      </div>

      <p class="eyebrow !tracking-[.2em] mb-2">Record A Manual Payment</p>
      <div class="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label class="label" for="pkg-select">Package</label>
          <select class="select" id="pkg-select" style="min-width:160px">
            ${store.packages().map((p) => `<option value="${p.id}" ${p.id === m.packageId ? 'selected' : ''}>${esc(p.name)} — ${money(p.price)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="label" for="method-select">Method</label>
          <select class="select" id="method-select" style="min-width:150px">
            ${store.paymentMethods().map((pm) => `<option value="${pm.id}">${esc(pm.name)}</option>`).join('')}
          </select>
        </div>
        <button type="button" class="btn btn-primary" id="record-btn">${icon('card')}Record Payment</button>
      </div>

      <p class="eyebrow !tracking-[.2em] mb-2">Payment History</p>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Date</th><th>Item</th><th>Method</th><th class="num">Amount</th></tr></thead>
          <tbody>
            ${history.length ? history.slice(0, 8).map((p) => `
              <tr><td>${esc(fmtDate(p.date))}</td><td>${p.packageId === 'pt' ? 'Personal Training' : esc(store.pkg(p.packageId)?.name ?? p.packageId)}</td><td>${esc(store.paymentMethod(p.method)?.name ?? p.method)}</td><td class="num text-white">${esc(money(p.amount))}</td></tr>
            `).join('') : '<tr><td colspan="4" class="text-center text-white/45 py-4">No payments recorded.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn btn-ghost" data-close>Close</button>
    </div>
  `;
  document.body.append(dlg);
  dlg.showModal();
  $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('close', () => dlg.remove());

  $('#record-btn', dlg).addEventListener('click', async () => {
    const packageId = $('#pkg-select', dlg).value;
    const methodId = $('#method-select', dlg).value;
    const quote = store.quoteRenewal(m, packageId);
    const btn = $('#record-btn', dlg);
    btn.disabled = true; btn.textContent = 'Processing…';
    const staffMember = auth.currentStaff();
    const result = await charge(methodId, { amount: quote.amount, phone: m.phone, cardNumber: '4111111111111111', expiry: '12/29', cvv: '123' });
    if (!result.ok) { toast(result.error, 'bad'); btn.disabled = false; btn.innerHTML = `${icon('card')}Record Payment`; return; }
    store.recordPayment({ memberId, packageId, quote, method: methodId, gatewayResult: result, recordedBy: staffMember?.name ?? 'staff' });
    toast(`Payment recorded for ${m.name}. New expiry ${fmtDate(quote.newExpiry)}.`, 'good');
    dlg.close();
    onDone();
  });
}
