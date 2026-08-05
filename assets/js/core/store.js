/* ============================================================
   Store — the single data-access boundary for the whole system.

   Everything the UI reads or writes goes through here. Today it is
   backed by localStorage and seeded with demo data; to move to a real
   backend, replace `load()` / `persist()` with fetch calls and leave
   every feature module untouched.

   Nothing here is a security boundary: the browser owns this data.
   Anything that must be authoritative (money, entitlements, member
   records) has to be re-validated server-side.
   ============================================================ */

import { buildSeed, PACKAGES, BRANCHES, TRAINERS, RENEW_OFFERS, PAYMENT_METHODS } from './seed.js';
import { iso, addMonths, addDays, today, daysBetween, monthKey, sum, groupBy, uid } from './util.js';
import { parseCsv } from './csv.js';
import { MEMBERS_CSV_URL } from './roster-config.js';

// Bump BOTH the key suffix and the `version` check below whenever
// buildSeed()'s shape or content changes — otherwise a returning
// visitor's stale localStorage silently wins over the new seed data
// (this bit us once: the member roster changed but the version didn't,
// so existing visitors kept seeing the old members and every "new"
// login failed).
const KEY = 'cherrydrops.system.v4';

let state = null;
const listeners = new Set();

/* ---------------- persistence ---------------- */

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 4) return parsed;
    }
  } catch {
    /* corrupt or unavailable storage — fall through to a fresh seed */
  }
  return buildSeed();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[store] could not persist to localStorage', err);
  }
}

function emit() {
  persist();
  for (const fn of listeners) {
    try { fn(state); } catch (err) { console.error('[store] listener failed', err); }
  }
}

export function init() {
  if (!state) state = load();
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetToSeed() {
  state = buildSeed();
  emit();
}

export const raw = () => (state ??= load());

/* ---------------- reference selectors ---------------- */

export const branches = () => raw().branches;
export const branch = (id) => raw().branches.find((b) => b.id === id) ?? null;
export const packages = () => raw().packages;
export const pkg = (id) => raw().packages.find((p) => p.id === id) ?? PACKAGES.find((p) => p.id === id) ?? null;
export const trainers = () => raw().trainers;
export const trainer = (id) => raw().trainers.find((t) => t.id === id) ?? null;
export const staff = () => raw().staff;
export const inventory = () => raw().inventory;
export const paymentMethods = () => PAYMENT_METHODS;
export const paymentMethod = (id) => PAYMENT_METHODS.find((m) => m.id === id) ?? null;

/* ---------------- members ---------------- */

export const members = () => raw().members;
export const member = (id) => raw().members.find((m) => m.id === id) ?? null;

/* ---------------- live roster (Google Sheet) ---------------- */

function findByName(list, name) {
  const q = String(name || '').trim().toLowerCase();
  if (!q) return null;
  return list.find((x) => x.name.toLowerCase() === q) ?? null;
}

function parseFlexibleDate(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : iso(d);
}

/**
 * Merges one sheet row onto the previous version of that member (if any
 * existed from local seed data or an earlier live fetch). The sheet is
 * authoritative for what staff actually maintain there — name, package,
 * dates, branch, trainer — everything else (diet profile, attendance,
 * notes, trainer bookings made in-app) survives across refreshes instead
 * of being wiped out every time the sheet is re-read.
 */
function rowToMember(row, prev) {
  const id = (row['Member ID'] || '').trim();
  if (!id) return null;
  const plan = findByName(PACKAGES, row['Package']);
  const br = findByName(BRANCHES, row['Branch']);
  const trFromSheet = findByName(TRAINERS, row['Trainer']);
  const start = parseFlexibleDate(row['Package Start Date']) ?? prev?.startDate ?? iso(today());
  const end = parseFlexibleDate(row['Package End Date']) ?? prev?.expiry ?? iso(addMonths(today(), plan?.months ?? 1));

  return {
    id,
    name: row['Member Name'] || prev?.name || id,
    gender: prev?.gender ?? 'male',
    email: prev?.email ?? '',
    phone: prev?.phone ?? '',
    branchId: br?.id ?? prev?.branchId ?? BRANCHES[0]?.id ?? null,
    packageId: plan?.id ?? prev?.packageId ?? PACKAGES[0]?.id ?? null,
    joined: start,
    startDate: start,
    expiry: end,
    autoRenew: prev?.autoRenew ?? false,
    goal: prev?.goal ?? 'General fitness',
    heightCm: prev?.heightCm ?? 170,
    weightKg: prev?.weightKg ?? 70,
    age: prev?.age ?? 25,
    activity: prev?.activity ?? 'moderate',
    trainerId: trFromSheet?.id ?? prev?.trainerId ?? null,
    attendance: prev?.attendance ?? [],
    notes: prev?.notes ?? '',
    dietPlan: prev?.dietPlan,
  };
}

/**
 * Re-reads the published member Sheet and swaps it in as the current
 * roster. Safe to call anytime — no-ops until roster-config.js has a
 * real URL, and any fetch/parse failure just leaves the existing data
 * in place (logged, never thrown) so a network hiccup can't blank the
 * portal out from under someone.
 */
export async function refreshLiveMembers() {
  if (!MEMBERS_CSV_URL || MEMBERS_CSV_URL.includes('PASTE_YOUR')) return;
  try {
    const res = await fetch(MEMBERS_CSV_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`sheet responded ${res.status}`);
    const rows = parseCsv(await res.text());
    if (rows.length === 0) return;

    const existing = new Map(raw().members.map((m) => [m.id, m]));
    const liveMembers = rows
      .map((row) => rowToMember(row, existing.get((row['Member ID'] || '').trim())))
      .filter(Boolean);
    if (liveMembers.length === 0) return;

    raw().members = liveMembers;
    emit();
  } catch (err) {
    console.warn('[store] could not load the live member sheet — staying on last known data', err);
  }
}

export function findMemberByCredential(identifier) {
  const q = String(identifier || '').trim().toLowerCase();
  if (!q) return null;
  return raw().members.find((m) =>
    m.id.toLowerCase() === q ||
    m.email.toLowerCase() === q ||
    m.phone.replace(/\D/g, '') === q.replace(/\D/g, '')) ?? null;
}

/** Everything the UI needs about where a membership stands. */
export function membershipStatus(m) {
  const daysLeft = daysBetween(today(), m.expiry);
  const tenureMonths = Math.max(0, Math.round(-daysBetween(today(), m.joined) / 30.44));
  let level, label;
  if (daysLeft < 0) { level = 'critical'; label = 'Expired'; }
  else if (daysLeft <= 7) { level = 'critical'; label = 'Expires this week'; }
  else if (daysLeft <= 14) { level = 'serious'; label = 'Expires in 2 weeks'; }
  else if (daysLeft <= 30) { level = 'warning'; label = 'Renewal due'; }
  else { level = 'good'; label = 'Active'; }
  return { daysLeft, tenureMonths, level, label, expired: daysLeft < 0 };
}

/** Renewal offers this member actually qualifies for, best discount first. */
export function offersFor(m) {
  const status = membershipStatus(m);
  const ctx = { ...status, packageId: m.packageId, memberId: m.id };
  return RENEW_OFFERS.filter((o) => o.applies(ctx)).sort((a, b) => b.discountPct - a.discountPct);
}

/** Quote a renewal, applying at most one (the best) qualifying offer. */
export function quoteRenewal(m, packageId, offerId = null) {
  const plan = pkg(packageId);
  if (!plan) return null;
  const eligible = offersFor(m);
  const offer = offerId ? eligible.find((o) => o.id === offerId) ?? null : eligible[0] ?? null;
  const discountPct = offer ? offer.discountPct : 0;
  const amount = Math.round(plan.price * (1 - discountPct / 100));
  // A renewal extends from the later of today and the current expiry, so
  // renewing early never costs the member the days they already paid for.
  const base = membershipStatus(m).expired ? today() : new Date(m.expiry);
  return {
    packageId: plan.id,
    packageName: plan.name,
    months: plan.months,
    gross: plan.price,
    offer,
    discountPct,
    saving: plan.price - amount,
    amount,
    newExpiry: iso(addMonths(base, plan.months)),
  };
}

export function updateMember(id, patch) {
  const m = member(id);
  if (!m) return null;
  Object.assign(m, patch);
  emit();
  return m;
}

/* ---------------- payments ---------------- */

export const payments = () => raw().payments;

export function paymentsFor(memberId) {
  return raw().payments.filter((p) => p.memberId === memberId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Record a settled payment and advance the member's expiry.
 * `gatewayResult` comes from the payments adapter — never trust it for
 * anything beyond display until a server has verified it.
 */
export function recordPayment({ memberId, packageId, quote, method, gatewayResult, recordedBy = 'portal' }) {
  const m = member(memberId);
  if (!m) throw new Error(`unknown member ${memberId}`);
  const plan = pkg(packageId);
  if (!plan) throw new Error(`unknown package ${packageId}`);

  const start = membershipStatus(m).expired ? today() : new Date(m.expiry);
  const end = addMonths(start, plan.months);

  const entry = {
    id: uid('PAY'),
    memberId,
    memberName: m.name,
    branchId: m.branchId,
    packageId,
    method,
    gross: quote?.gross ?? plan.price,
    discountPct: quote?.discountPct ?? 0,
    amount: quote?.amount ?? plan.price,
    offerId: quote?.offer?.id ?? null,
    date: iso(today()),
    periodStart: iso(start),
    periodEnd: iso(end),
    status: 'settled',
    reference: gatewayResult?.reference ?? '—',
    gateway: gatewayResult?.gateway ?? method,
    recordedBy,
    exported: false,
    createdAt: new Date().toISOString(),
  };

  raw().payments.unshift(entry);
  m.packageId = packageId;
  m.expiry = iso(end);
  m.startDate = iso(start);
  emit();
  return entry;
}

/** Payments not yet written into the official workbook. */
export const pendingExports = () =>
  raw().payments.filter((p) => !raw().exportLog.exportedIds.includes(p.id));

export function markExported(ids, meta = {}) {
  const log = raw().exportLog;
  const set = new Set(log.exportedIds);
  for (const id of ids) set.add(id);
  log.exportedIds = [...set];
  log.lastRunAt = new Date().toISOString();
  Object.assign(log, meta);
  for (const p of raw().payments) if (set.has(p.id)) p.exported = true;
  emit();
  return log;
}

export const exportLog = () => raw().exportLog;

/* ---------------- bookings ---------------- */

export const bookings = () => raw().bookings;

export function bookTrainer(memberId, trainerId, slot) {
  const m = member(memberId);
  const t = trainer(trainerId);
  if (!m || !t) throw new Error('unknown member or trainer');
  if (t.booked >= t.capacity) throw new Error(`${t.name} has no open slots this cycle.`);

  const previous = raw().bookings.find((b) => b.memberId === memberId && b.status === 'active');
  if (previous) {
    previous.status = 'ended';
    const old = trainer(previous.trainerId);
    if (old) old.booked = Math.max(0, old.booked - 1);
  }

  const entry = {
    id: uid('BK'),
    memberId,
    trainerId,
    slot,
    startedOn: iso(today()),
    status: 'active',
  };
  raw().bookings.push(entry);
  t.booked += 1;
  m.trainerId = trainerId;
  emit();
  return entry;
}

export function cancelBooking(memberId) {
  const active = raw().bookings.find((b) => b.memberId === memberId && b.status === 'active');
  if (!active) return null;
  active.status = 'cancelled';
  const t = trainer(active.trainerId);
  if (t) t.booked = Math.max(0, t.booked - 1);
  const m = member(memberId);
  if (m) m.trainerId = null;
  emit();
  return active;
}

export const activeBooking = (memberId) =>
  raw().bookings.find((b) => b.memberId === memberId && b.status === 'active') ?? null;

/* ---------------- diet plans ---------------- */

export function saveDietPlan(memberId, plan) {
  const m = member(memberId);
  if (!m) return null;
  m.dietPlan = { ...plan, savedAt: new Date().toISOString() };
  emit();
  return m.dietPlan;
}

/* ---------------- inventory ---------------- */

export function restock(itemId, qty) {
  const item = inventory().find((i) => i.id === itemId);
  if (!item) return null;
  item.stock += Number(qty) || 0;
  item.value = item.price * item.stock;
  const last = item.history[item.history.length - 1];
  if (last) last.stock = item.stock;
  emit();
  return item;
}

/* ---------------- aggregate selectors (dashboard) ---------------- */

/** Revenue per month per branch, for the last `n` months. */
export function revenueByMonth(n = 8, branchId = 'all') {
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) keys.push(monthKey(addMonths(today(), -i)));
  const rows = raw().payments.filter((p) => branchId === 'all' || p.branchId === branchId);
  const byMonth = groupBy(rows, (p) => monthKey(p.date));

  return keys.map((key) => {
    const monthRows = byMonth.get(key) ?? [];
    const perBranch = Object.fromEntries(
      branches().map((b) => [b.id, sum(monthRows.filter((r) => r.branchId === b.id), (r) => r.amount)]),
    );
    return { key, total: sum(monthRows, (r) => r.amount), count: monthRows.length, ...perBranch };
  });
}

/** Split of collected money by payment channel over a window of days. */
export function revenueByMethod(days = 90, branchId = 'all') {
  const from = iso(addDays(today(), -days));
  const rows = raw().payments.filter(
    (p) => p.date >= from && (branchId === 'all' || p.branchId === branchId),
  );
  return PAYMENT_METHODS.map((m) => ({
    id: m.id,
    name: m.name,
    total: sum(rows.filter((r) => r.method === m.id), (r) => r.amount),
    count: rows.filter((r) => r.method === m.id).length,
  })).sort((a, b) => b.total - a.total);
}

/** Members bucketed by how soon their subscription ends. */
export function expiryCohorts(branchId = 'all') {
  const rows = members().filter((m) => branchId === 'all' || m.branchId === branchId);
  const buckets = [
    { id: 'expired', label: 'Expired', level: 'critical', test: (d) => d < 0 },
    { id: 'd7', label: '0–7 days', level: 'critical', test: (d) => d >= 0 && d <= 7 },
    { id: 'd14', label: '8–14 days', level: 'serious', test: (d) => d > 7 && d <= 14 },
    { id: 'd30', label: '15–30 days', level: 'warning', test: (d) => d > 14 && d <= 30 },
    { id: 'safe', label: '30+ days', level: 'good', test: (d) => d > 30 },
  ];
  return buckets.map((b) => {
    const list = rows.filter((m) => b.test(membershipStatus(m).daysLeft));
    return { ...b, count: list.length, members: list, value: sum(list, (m) => pkg(m.packageId)?.price ?? 0) };
  });
}

/** Members whose subscription ends within `days` — the alert queue. */
export function expiringSoon(days = 30, branchId = 'all') {
  return members()
    .filter((m) => branchId === 'all' || m.branchId === branchId)
    .map((m) => ({ member: m, status: membershipStatus(m) }))
    .filter(({ status }) => status.daysLeft <= days)
    .sort((a, b) => a.status.daysLeft - b.status.daysLeft);
}

export function dashboardTotals(branchId = 'all') {
  const mem = members().filter((m) => branchId === 'all' || m.branchId === branchId);
  const active = mem.filter((m) => !membershipStatus(m).expired);
  const from = iso(addMonths(today(), -1));
  const recent = raw().payments.filter(
    (p) => p.date >= from && (branchId === 'all' || p.branchId === branchId),
  );
  const stock = inventory();

  return {
    activeMembers: active.length,
    totalMembers: mem.length,
    lapsed: mem.length - active.length,
    revenue30: sum(recent, (r) => r.amount),
    transactions30: recent.length,
    stockValue: sum(stock, (i) => i.price * i.stock),
    lowStock: stock.filter((i) => i.stock <= i.reorderAt).length,
    pendingExport: pendingExports().length,
    renewalsDue: mem.filter((m) => {
      const d = membershipStatus(m).daysLeft;
      return d >= 0 && d <= 30;
    }).length,
  };
}
