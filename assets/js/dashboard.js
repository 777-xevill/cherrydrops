/* ============================================================
   Ops Dashboard — branch-wise revenue, stock visuals, and the
   ledger export panel. Gated to manager / owner staff accounts.
   ============================================================ */

import * as store from './core/store.js';
import * as auth from './core/auth.js';
import { $, $$, html, esc, icon, money, compact, fmtDate, fmtDateTime, num, monthKey, toast } from './core/util.js';
import { lineChart, barChart } from './core/charts.js';
import { exportLedgerCsv, renderPreviewTable } from './core/excel-export.js';

store.init();
const app = $('#app');

const ROUTES = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'stock', label: 'Stock Visuals', icon: 'box' },
  { id: 'ledger', label: 'Ledger & Export', icon: 'sheet' },
];

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  return ROUTES.some((r) => r.id === hash) ? hash : 'overview';
}

// Declared before the first render() call below — every view reads this
// synchronously, so it must be initialized before that call can happen.
let branchScope = 'all';

function render() {
  const s = auth.currentStaff();
  if (!s) { renderGate('You need to sign in first.', true); return; }
  if (!auth.canSeeDashboard(s)) { renderGate(`${s.name}'s account (${s.role}) doesn't have dashboard access. Owner and manager accounts only.`, false); return; }
  renderShell(s, currentRoute());
}
window.addEventListener('hashchange', render);
store.subscribe(() => { if (auth.currentStaff()) render(); });
// Deferred to a microtask so the whole module finishes evaluating first —
// an already-logged-in visit renders synchronously through view functions
// that close over consts/lets declared further down this file.
queueMicrotask(render);

function renderGate(message, isLoginPrompt) {
  app.innerHTML = html`
    <div class="min-h-screen flex items-center justify-center px-5 py-12">
      <div class="w-full max-w-sm text-center">
        <p class="eyebrow">Ops Dashboard</p>
        <h1 class="h-sec mt-2 text-white" style="font-size:clamp(1.6rem,3.6vw,2.2rem)">${isLoginPrompt ? 'Staff Sign-In Required' : 'Restricted'}</h1>
        <div class="rule mx-auto mt-4"></div>
        <p class="lede mt-4">${esc(message)}</p>
        <a href="staff.html" class="btn btn-primary mt-6">${icon('logout')}Go to Staff Sign-In</a>
      </div>
    </div>
  `;
}

/* ---------------- shell ---------------- */

function renderShell(s, route) {
  app.innerHTML = html`
    <div class="shell">
      <aside class="sidebar">
        <a href="index.html" class="flex items-center gap-3 px-2 pb-4 mb-2 border-b border-bronze/12">
          <span class="block h-10 w-10 rounded-full overflow-hidden ring-1 ring-bronze/35 shrink-0">
            <img src="brand_assets/brand%20logo.jpg" alt="" class="h-full w-full object-cover scale-[1.06]">
          </span>
          <span class="leading-none">
            <span class="block font-display text-sm font-extrabold tracking-[.02em] foil">CHERRY DROPS</span>
            <span class="block font-display text-[.55rem] tracking-[.28em] text-bronze mt-1">OPS DASHBOARD</span>
          </span>
        </a>
        <div class="px-2 pb-4 mb-1">
          <p class="font-display text-lg text-white leading-tight">${esc(s.name)}</p>
          <p class="text-xs text-bronze mt-0.5 uppercase tracking-[.14em]">${esc(s.role)} · all branches</p>
        </div>
        <nav class="flex-1" aria-label="Dashboard">
          ${ROUTES.map((r) => `
            <button type="button" class="navitem" data-route="${r.id}" aria-current="${r.id === route ? 'page' : 'false'}">
              ${icon(r.icon)}<span>${esc(r.label)}</span>
            </button>
          `).join('')}
          <a href="staff.html" class="navitem">${icon('users')}<span>Staff Console</span></a>
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
  ({ overview: viewOverview, stock: viewStock, ledger: viewLedger })[route](view);
}

function branchSeg(onChange) {
  return html`
    <div class="filters">
      <span class="label !mb-0">Branch</span>
      <div class="seg" id="branch-seg">
        <button type="button" data-b="all" aria-pressed="${branchScope === 'all'}">All Branches</button>
        ${store.branches().map((b) => `<button type="button" data-b="${b.id}" aria-pressed="${branchScope === b.id}">${esc(b.short)}</button>`).join('')}
      </div>
    </div>
  `;
}
function wireBranchSeg(view, repaint) {
  $$('#branch-seg [data-b]', view).forEach((btn) => btn.addEventListener('click', () => { branchScope = btn.dataset.b; repaint(); }));
}

/* ---------------- overview ---------------- */

const branchColor = (id) => (id === store.branches()[0]?.id ? 'var(--series-1)' : 'var(--series-2)');

function viewOverview(view) {
  function paint() {
    const totals = store.dashboardTotals(branchScope);
    const monthly = store.revenueByMonth(8, branchScope);
    const byMethod = store.revenueByMethod(90, branchScope);
    const cohorts = store.expiryCohorts(branchScope);

    view.innerHTML = html`
      <div class="view-head">
        <div>
          <p class="eyebrow">Operations</p>
          <h2 class="h-sec mt-2 text-white" style="font-size:clamp(1.6rem,3.4vw,2.3rem)">Dashboard Overview</h2>
          <div class="rule mt-3"></div>
        </div>
      </div>
      ${branchSeg()}

      <div class="grid-auto mb-5">
        <div class="card stat"><p class="stat-label">Active Members</p><p class="stat-value">${num(totals.activeMembers)}</p><p class="stat-sub">of ${num(totals.totalMembers)} total</p></div>
        <div class="card stat"><p class="stat-label">Revenue (30d)</p><p class="stat-value" style="color:var(--crimson-lift)">${money(totals.revenue30)}</p><p class="stat-sub">${num(totals.transactions30)} transactions</p></div>
        <div class="card stat"><p class="stat-label">Stock Value</p><p class="stat-value">${money(totals.stockValue)}</p><p class="stat-sub">${totals.lowStock} item${totals.lowStock === 1 ? '' : 's'} low</p></div>
        <div class="card stat"><p class="stat-label">Pending Excel Export</p><p class="stat-value" style="color:${totals.pendingExport ? 'var(--warning)' : 'var(--good)'}">${num(totals.pendingExport)}</p><p class="stat-sub">payment${totals.pendingExport === 1 ? '' : 's'} unrecorded</p></div>
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div class="card p-6">
          <p class="eyebrow !tracking-[.2em] mb-3">Branch-Wise Revenue — Last 8 Months</p>
          <div id="rev-chart"></div>
        </div>
        <div class="card p-6">
          <p class="eyebrow !tracking-[.2em] mb-3">Revenue By Payment Channel — 90d</p>
          <div id="method-chart"></div>
        </div>
      </div>

      <div class="card p-6 mt-5">
        <p class="eyebrow !tracking-[.2em] mb-3">Renewal Pressure — Members By Time-To-Expiry</p>
        <div id="cohort-chart"></div>
      </div>
    `;

    wireBranchSeg(view, paint);

    const branchSeries = branchScope === 'all'
      ? store.branches().map((b) => ({ id: b.id, label: b.name, color: branchColor(b.id), values: monthly.map((row) => row[b.id] || 0) }))
      : [{ id: branchScope, label: store.branch(branchScope)?.name ?? branchScope, color: 'var(--series-1)', values: monthly.map((row) => row.total) }];

    lineChart($('#rev-chart', view), {
      series: branchSeries,
      xLabels: monthly.map((row) => row.key),
      formatX: (k) => new Date(`${k}-01`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      formatY: (v) => compact(v),
      unit: 'BDT',
      height: 260,
    });

    barChart($('#method-chart', view), {
      horizontal: true,
      leftLabelWidth: 88,
      categories: byMethod.map((m) => ({ label: m.name })),
      series: [{ id: 'total', label: 'Revenue', color: 'var(--series-3)', values: byMethod.map((m) => m.total) }],
      legend: false,
      formatValue: (v) => money(v),
      height: Math.max(160, byMethod.length * 40 + 32),
    });

    barChart($('#cohort-chart', view), {
      horizontal: true,
      leftLabelWidth: 108,
      categories: cohorts.map((c) => ({ label: c.label })),
      series: [{ id: 'count', label: 'Members', color: 'var(--series-1)', colors: cohorts.map((c) => `var(--${c.level})`), values: cohorts.map((c) => c.count) }],
      legend: false,
      formatValue: (v) => num(v),
    });
  }
  paint();
}

/* ---------------- stock visuals ---------------- */

function viewStock(view) {
  const items = store.inventory();
  let selected = items[0]?.id;

  function paint() {
    const item = items.find((i) => i.id === selected) ?? items[0];
    view.innerHTML = html`
      <div class="view-head">
        <div>
          <p class="eyebrow">Retail Counter</p>
          <h2 class="h-sec mt-2 text-white" style="font-size:clamp(1.6rem,3.4vw,2.3rem)">Stock Visuals</h2>
          <div class="rule mt-3"></div>
        </div>
      </div>

      <div class="card p-0 mb-5">
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Item</th><th>Category</th><th class="num">Price</th><th class="num">Stock</th><th class="num">Value</th><th></th></tr></thead>
            <tbody>
              ${items.map((i) => `
                <tr class="${i.id === item.id ? 'bg-crimson/5' : ''}">
                  <td class="text-white">${esc(i.name)}</td>
                  <td>${esc(i.category)}</td>
                  <td class="num">${esc(money(i.price))}</td>
                  <td class="num">${i.stock}${i.stock <= i.reorderAt ? ` <span class="badge badge-warning">Low</span>` : ''}</td>
                  <td class="num text-white">${esc(money(i.value))}</td>
                  <td><button type="button" class="btn btn-ghost btn-sm" data-select="${i.id}">Chart</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-5">
        <div class="card p-6">
          <p class="eyebrow !tracking-[.2em] mb-1">Price Trend — ${esc(item.name)}</p>
          <p class="lede mb-3" style="font-size:.9rem">Last ${item.history.length} weeks, ৳ per unit.</p>
          <div id="price-chart"></div>
        </div>
        <div class="card p-6">
          <p class="eyebrow !tracking-[.2em] mb-1">Stock Level — ${esc(item.name)}</p>
          <p class="lede mb-3" style="font-size:.9rem">Units on hand, reorder line at ${item.reorderAt}.</p>
          <div id="stock-chart"></div>
        </div>
      </div>

      <div class="card p-6 mt-5">
        <p class="eyebrow !tracking-[.2em] mb-3">Stock Value By Item</p>
        <div id="value-chart"></div>
      </div>
    `;

    $$('[data-select]', view).forEach((b) => b.addEventListener('click', () => { selected = b.dataset.select; paint(); }));

    lineChart($('#price-chart', view), {
      series: [{ id: 'price', label: 'Price', color: 'var(--series-1)', values: item.history.map((h) => h.price) }],
      xLabels: item.history.map((h) => h.week),
      formatX: (v) => fmtDate(v).slice(0, 6),
      formatY: (v) => compact(v),
      unit: 'BDT',
      legend: false,
      height: 200,
    });
    lineChart($('#stock-chart', view), {
      series: [{ id: 'stock', label: 'Units', color: 'var(--series-5)', values: item.history.map((h) => h.stock) }],
      xLabels: item.history.map((h) => h.week),
      formatX: (v) => fmtDate(v).slice(0, 6),
      formatY: (v) => num(v),
      unit: 'units',
      legend: false,
      height: 200,
    });

    const ranked = [...items].sort((a, b) => b.value - a.value);
    barChart($('#value-chart', view), {
      horizontal: true,
      leftLabelWidth: 150,
      categories: ranked.map((i) => ({ label: i.name })),
      series: [{ id: 'value', label: 'Stock value', color: 'var(--series-3)', values: ranked.map((i) => i.value) }],
      legend: false,
      formatValue: (v) => money(v),
      height: Math.max(200, ranked.length * 34 + 32),
    });
  }
  paint();
}

/* ---------------- ledger & export ---------------- */

function viewLedger(view) {
  function paint() {
    const all = store.payments().filter((p) => branchScope === 'all' || p.branchId === branchScope);
    const pending = store.pendingExports().filter((p) => branchScope === 'all' || p.branchId === branchScope);
    const log = store.exportLog();

    view.innerHTML = html`
      <div class="view-head">
        <div>
          <p class="eyebrow">Bookkeeping</p>
          <h2 class="h-sec mt-2 text-white" style="font-size:clamp(1.6rem,3.4vw,2.3rem)">Ledger &amp; Excel Export</h2>
          <div class="rule mt-3"></div>
        </div>
      </div>
      ${branchSeg()}

      <div class="card p-6 mb-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="eyebrow !tracking-[.2em]">Export Queue</p>
            <p class="text-white mt-1">${pending.length ? `${num(pending.length)} payment${pending.length === 1 ? '' : 's'} not yet in the workbook` : 'Everything is up to date'}</p>
            <p class="hint mt-1">${log.lastRunAt ? `Last export: ${esc(fmtDateTime(log.lastRunAt))}` : 'No export has been run yet.'}</p>
          </div>
          <div class="flex gap-2.5">
            <button type="button" class="btn btn-ghost" id="export-pending" ${pending.length ? '' : 'disabled'}>${icon('download')}Export Pending Only</button>
            <button type="button" class="btn btn-primary" id="export-all">${icon('download')}Export Full Ledger</button>
          </div>
        </div>
        <p class="hint mt-4">Downloads a CSV formatted as a branch-wise ledger — opens directly in Excel or Sheets. This demo generates a fresh file each time rather than writing into an existing workbook on disk (that requires a server-side process with file-system access, which a static site cannot do).</p>
      </div>

      <div class="card p-0">
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Date</th><th>Branch</th><th>Member</th><th>Method</th><th class="num">Amount</th><th>Export</th></tr></thead>
            <tbody>
              ${all.slice(0, 60).map((p) => `
                <tr>
                  <td>${esc(fmtDate(p.date))}</td>
                  <td>${esc(store.branch(p.branchId)?.short ?? '')}</td>
                  <td class="text-white">${esc(p.memberName)}</td>
                  <td>${esc(store.paymentMethod(p.method)?.name ?? p.method)}</td>
                  <td class="num text-white">${esc(money(p.amount))}</td>
                  <td>${p.exported ? '<span class="badge badge-good">In workbook</span>' : '<span class="badge badge-warning">Pending</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${all.length > 60 ? `<p class="hint p-4">Showing 60 of ${num(all.length)} rows. Export includes every row.</p>` : ''}
      </div>
    `;

    wireBranchSeg(view, paint);

    $('#export-all', view).addEventListener('click', () => {
      const { rowCount, grandTotal } = exportLedgerCsv(store.payments(), { branchId: branchScope, label: branchScope === 'all' ? 'full-ledger' : `${branchScope}-ledger` });
      store.markExported(store.payments().map((p) => p.id));
      toast(`Exported ${rowCount} rows (${money(grandTotal)}) to CSV.`, 'good');
      paint();
    });
    $('#export-pending', view).addEventListener('click', () => {
      const ids = pending.map((p) => p.id);
      if (!ids.length) return;
      const { rowCount, grandTotal } = exportLedgerCsv(pending, { branchId: branchScope, label: 'pending-export' });
      store.markExported(ids);
      toast(`Exported ${rowCount} pending row${rowCount === 1 ? '' : 's'} (${money(grandTotal)}).`, 'good');
      paint();
    });
  }
  paint();
}
