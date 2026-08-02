/* ============================================================
   Demo session handling.

   No passwords, no server, no real credentials — this is a
   front-end demo. Member "login" is an identity lookup (ID, email
   or phone); staff "login" is a 4-digit PIN check against the
   seeded staff list. Session lives in sessionStorage so it clears
   when the tab closes.
   ============================================================ */

import { findMemberByCredential, staff as staffList } from './store.js';

const MEMBER_KEY = 'cherrydrops.session.member';
const STAFF_KEY = 'cherrydrops.session.staff';

/* ---------------- member session ---------------- */

export function memberLogin(identifier) {
  const m = findMemberByCredential(identifier);
  if (!m) return { ok: false, error: 'No member found with that ID, phone or email. Try CD-1000, or a phone/email from the demo roster.' };
  sessionStorage.setItem(MEMBER_KEY, m.id);
  return { ok: true, memberId: m.id };
}

export function memberLogout() {
  sessionStorage.removeItem(MEMBER_KEY);
}

export function currentMemberId() {
  return sessionStorage.getItem(MEMBER_KEY);
}

/* ---------------- staff session ---------------- */

export function staffLogin(pin) {
  const p = String(pin || '').trim();
  const found = staffList().find((s) => s.pin === p);
  if (!found) return { ok: false, error: 'PIN not recognised. Demo PINs: 2468 (owner), 1357 (manager), 1111 / 2222 (front desk).' };
  sessionStorage.setItem(STAFF_KEY, found.id);
  return { ok: true, staffId: found.id };
}

export function staffLogout() {
  sessionStorage.removeItem(STAFF_KEY);
}

export function currentStaff() {
  const id = sessionStorage.getItem(STAFF_KEY);
  if (!id) return null;
  return staffList().find((s) => s.id === id) ?? null;
}

export const canSeeAllBranches = (s) => !!s && (s.role === 'owner' || s.role === 'manager');
export const canSeeDashboard = (s) => !!s && (s.role === 'owner' || s.role === 'manager');
