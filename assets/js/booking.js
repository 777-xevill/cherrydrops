/* ============================================================
   Public "book a membership" form on the homepage.

   Submits to a Google Sheet (via the Apps Script URL in
   core/booking-config.js) instead of anywhere on this static
   site, since there is no server here to receive or store it.
   fetch is sent with mode:'no-cors' because Apps Script Web Apps
   don't return CORS headers — that also means the response body
   can't be read, so success is assumed once the request doesn't
   throw. See /BOOKING-SETUP.md for the one-time owner setup.
   ============================================================ */

import { $, $$, html, esc, toast, icon } from './core/util.js';
import { BOOKING_WEBHOOK_URL } from './core/booking-config.js';

const BRANCHES = ['BNS Centre — Uttara Sector 7', 'Syed Grand Center — Uttara Model Town'];
const PACKAGES = ['Monthly', 'Quarterly', 'Yearly'];

function openBookingModal(presetPackage) {
  const wrap = document.createElement('div');
  wrap.className = 'fixed inset-0 z-[95] grid place-items-center p-4 bg-ink/90 backdrop-blur-md';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'Book your membership');
  wrap.innerHTML = html`
    <div class="card w-full max-w-md p-7 relative">
      <button type="button" data-close class="absolute top-4 right-4 grid place-items-center h-10 w-10 border border-bronze/30 text-bronze-light hover:bg-bronze/10 transition-colors duration-300" aria-label="Close">${icon('x')}</button>
      <p class="eyebrow">Book Your Spot</p>
      <h3 class="h-card mt-2 text-white">Let's get you started</h3>
      <p class="text-white/60 text-sm mt-2">Fill this in and our front desk will call you to confirm.</p>

      <form id="booking-form" class="mt-6 grid gap-4" novalidate>
        <div>
          <label class="text-xs uppercase tracking-[.14em] text-bronze-light" for="bk-name">Full name</label>
          <input id="bk-name" name="name" required class="mt-1.5 w-full bg-ink border border-bronze/25 focus:border-bronze px-4 py-3 text-white outline-none transition-colors duration-300" placeholder="Your name">
        </div>
        <div>
          <label class="text-xs uppercase tracking-[.14em] text-bronze-light" for="bk-phone">Phone</label>
          <input id="bk-phone" name="phone" required class="mt-1.5 w-full bg-ink border border-bronze/25 focus:border-bronze px-4 py-3 text-white outline-none transition-colors duration-300" placeholder="01XXXXXXXXX">
        </div>
        <div>
          <label class="text-xs uppercase tracking-[.14em] text-bronze-light" for="bk-email">Email (optional)</label>
          <input id="bk-email" name="email" type="email" class="mt-1.5 w-full bg-ink border border-bronze/25 focus:border-bronze px-4 py-3 text-white outline-none transition-colors duration-300" placeholder="you@example.com">
        </div>
        <div>
          <label class="text-xs uppercase tracking-[.14em] text-bronze-light" for="bk-branch">Preferred branch</label>
          <select id="bk-branch" name="branch" class="mt-1.5 w-full bg-ink border border-bronze/25 focus:border-bronze px-4 py-3 text-white outline-none transition-colors duration-300">
            ${BRANCHES.map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs uppercase tracking-[.14em] text-bronze-light" for="bk-package">Package</label>
          <select id="bk-package" name="package" class="mt-1.5 w-full bg-ink border border-bronze/25 focus:border-bronze px-4 py-3 text-white outline-none transition-colors duration-300">
            ${PACKAGES.map((p) => `<option value="${esc(p)}" ${p === presetPackage ? 'selected' : ''}>${esc(p)}</option>`).join('')}
          </select>
        </div>
        <p id="bk-err" class="text-crimson-lite text-sm hidden"></p>
        <button type="submit" class="btn btn-primary w-full">Send Booking Request</button>
      </form>
    </div>
  `;
  document.body.append(wrap);
  document.body.style.overflow = 'hidden';

  const close = () => { wrap.remove(); document.body.style.overflow = ''; };
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  $$('[data-close]', wrap).forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
  });

  const form = $('#booking-form', wrap);
  const err = $('#bk-err', wrap);
  const showError = (msg) => { err.textContent = msg; err.classList.remove('hidden'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('hidden');

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    if (!name || !phone) { showError('Name and phone are required.'); return; }

    if (!BOOKING_WEBHOOK_URL || BOOKING_WEBHOOK_URL.includes('PASTE_YOUR')) {
      showError('Online booking isn’t connected yet — please call 01610-021342 to book.');
      return;
    }

    const payload = {
      name,
      phone,
      email: form.email.value.trim(),
      branch: form.branch.value,
      package: form.package.value,
    };

    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      await fetch(BOOKING_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      toast(`Thanks, ${name.split(' ')[0]}! We'll call you shortly to confirm.`, 'good');
      close();
    } catch {
      showError('Something went wrong sending your request — please call 01610-021342 instead.');
      btn.disabled = false;
      btn.textContent = 'Send Booking Request';
    }
  });
}

$$('[data-book]').forEach((trigger) => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openBookingModal(trigger.dataset.book);
  });
});
