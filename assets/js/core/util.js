/* Small shared helpers. No dependencies. */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape untrusted text before it goes anywhere near innerHTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Tagged template used purely for readability/syntax-highlighting of
 * multi-line markup — it does NOT escape interpolations, because every
 * call site in this app composes trusted sub-templates (icon(), nested
 * view fragments, .map().join('') lists) through it. Call `esc()`
 * explicitly on any actual untrusted/user-supplied leaf value before
 * interpolating it — the app does this at each such call site.
 */
export function html(strings, ...values) {
  return strings.reduce((out, str, i) => out + str + (i < values.length ? (values[i] ?? '') : ''), '');
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/* ---------------- money & numbers ---------------- */

const bdt = new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 });
const bdt2 = new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ৳ with thousands separators. Amounts are stored as whole taka. */
export const money = (n) => `৳${bdt.format(Math.round(Number(n) || 0))}`;
export const money2 = (n) => `৳${bdt2.format(Number(n) || 0)}`;
export const num = (n, digits = 0) =>
  new Intl.NumberFormat('en-BD', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(n) || 0);

export const pct = (n, digits = 0) => `${num(n, digits)}%`;

/** Compact form for axis ticks: 12500 -> 12.5k */
export function compact(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `${num(v / 1e7, 1)}cr`;
  if (Math.abs(v) >= 1e5) return `${num(v / 1e5, 1)}L`;
  if (Math.abs(v) >= 1000) return `${num(v / 1000, v % 1000 === 0 ? 0 : 1)}k`;
  return num(v);
}

/* ---------------- dates ---------------- */

export const DAY = 86400000;

/** Parse 'YYYY-MM-DD' as a local calendar date (never UTC-shifted). */
export function parseDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!m) return new Date(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function iso(date) {
  const d = date instanceof Date ? date : parseDate(date);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(date, days) {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  const d = parseDate(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  // clamp for short months (31 Jan + 1 month -> 28/29 Feb, not 2/3 Mar)
  d.setDate(Math.min(day, daysInMonth(d.getFullYear(), d.getMonth())));
  return d;
}

export const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

/** Whole calendar days from a to b (b - a). Negative when b is earlier. */
export function daysBetween(a, b) {
  const x = parseDate(a); x.setHours(0, 0, 0, 0);
  const y = parseDate(b); y.setHours(0, 0, 0, 0);
  return Math.round((y - x) / DAY);
}

export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

const dFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dtFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
const mFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' });

export const fmtDate = (v) => (v ? dFmt.format(parseDate(v)) : '—');
export const fmtDateTime = (v) => (v ? dtFmt.format(v instanceof Date ? v : new Date(v)) : '—');
export const fmtMonth = (v) => mFmt.format(parseDate(v));
export const monthKey = (v) => iso(parseDate(v)).slice(0, 7);

export function relativeDays(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

/* ---------------- misc ---------------- */

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const sum = (arr, pick = (x) => x) => arr.reduce((t, x) => t + (Number(pick(x)) || 0), 0);

export function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function uid(prefix = 'id') {
  const rand = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}_${rand[0].toString(36)}${rand[1].toString(36)}`;
}

/** Deterministic PRNG so seeded demo data is stable across reloads. */
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function debounce(fn, wait = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/* ---------------- toasts ---------------- */

let toastWrap;
export function toast(message, kind = '') {
  if (!toastWrap) {
    toastWrap = el('div', { class: 'toast-wrap', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastWrap);
  }
  const node = el('div', { class: `toast ${kind}`.trim() }, message);
  toastWrap.append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    setTimeout(() => node.remove(), 320);
  }, kind === 'bad' ? 6000 : 3800);
}

/* ---------------- icons (inline, currentColor) ---------------- */

export const icon = (name, cls = '') => {
  const paths = {
    check: '<path d="m4 12 6 6L20 6"/>',
    alert: '<path d="M12 8v5"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/><path d="M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    user: '<circle cx="12" cy="7" r="3.2"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>',
    users: '<circle cx="8" cy="8" r="2.6"/><circle cx="17" cy="9" r="2.2"/><path d="M3 20a5 5 0 0 1 10 0M14.5 20a4.4 4.4 0 0 1 6.5-3.8"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    sheet: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9h17M9 3.5v17"/>',
    dumbbell: '<path d="M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8"/>',
    leaf: '<path d="M4 20c8 2 16-4 16-16-8 0-16 4-16 12"/><path d="M4 20c2-6 6-9 10-10.5"/>',
    logout: '<path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/><path d="m17 8 4 4-4 4M21 12H10"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.8"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    home: '<path d="m3 10.5 9-7 9 7V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20Z"/>',
    sparkle: '<path d="m12 3 2.1 5.4L19.5 10l-5.4 1.6L12 17l-2.1-5.4L4.5 10l5.4-1.6Z"/><path d="M19 16.5 19.8 19l2.5.8-2.5.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8Z"/>',
  };
  return `<svg class="${esc(cls)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
};
