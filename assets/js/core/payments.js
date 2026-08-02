/* ============================================================
   Payment gateway adapters — DEMO ONLY.

   Each adapter simulates the shape a real integration would
   return (a gateway name + transaction reference) after a short
   artificial delay, so the UI can build real request/response
   flows against it. No network call is made and no money moves.
   Swapping in real bKash/Nagad/Rocket/SSLCOMMERZ integrations
   later means replacing the body of each `charge()` — every
   caller only depends on the `{ ok, gateway, reference }` shape.
   ============================================================ */

import { uid } from './util.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function reference(prefix) {
  return `${prefix}${Math.floor(1e9 + Math.random() * 9e9)}`;
}

const adapters = {
  bkash: {
    label: 'bKash',
    async charge({ amount, phone }) {
      if (!/^01\d{9}$/.test(phone || '')) return { ok: false, error: 'Enter a valid 11-digit bKash number (01XXXXXXXXX).' };
      await wait(1100);
      return { ok: true, gateway: 'bKash', reference: reference('BKS'), amount, payerPhone: phone };
    },
  },
  nagad: {
    label: 'Nagad',
    async charge({ amount, phone }) {
      if (!/^01\d{9}$/.test(phone || '')) return { ok: false, error: 'Enter a valid 11-digit Nagad number (01XXXXXXXXX).' };
      await wait(1000);
      return { ok: true, gateway: 'Nagad', reference: reference('NGD'), amount, payerPhone: phone };
    },
  },
  rocket: {
    label: 'Rocket',
    async charge({ amount, phone }) {
      if (!/^01\d{9}$/.test(phone || '')) return { ok: false, error: 'Enter a valid 11-digit Rocket number (01XXXXXXXXX).' };
      await wait(1200);
      return { ok: true, gateway: 'Rocket', reference: reference('RKT'), amount, payerPhone: phone };
    },
  },
  card: {
    label: 'Card',
    async charge({ amount, cardNumber, expiry, cvv }) {
      const digits = String(cardNumber || '').replace(/\s+/g, '');
      if (digits.length < 12) return { ok: false, error: 'Enter a valid card number.' };
      if (!/^\d{2}\/\d{2}$/.test(expiry || '')) return { ok: false, error: 'Expiry must be MM/YY.' };
      if (!/^\d{3,4}$/.test(cvv || '')) return { ok: false, error: 'Enter a valid CVV.' };
      await wait(1400);
      return { ok: true, gateway: 'Card · SSLCOMMERZ', reference: reference('CRD'), amount, last4: digits.slice(-4) };
    },
  },
  cash: {
    label: 'Cash at desk',
    async charge({ amount }) {
      await wait(400);
      return { ok: true, gateway: 'Front desk', reference: reference('CSH'), amount };
    },
  },
};

/** Run the charge for a given method id. Always resolves — check `.ok`. */
export async function charge(methodId, ctx) {
  const adapter = adapters[methodId];
  if (!adapter) return { ok: false, error: `No payment adapter registered for "${methodId}".` };
  try {
    return await adapter.charge(ctx);
  } catch (err) {
    return { ok: false, error: err?.message || 'Payment failed. Please try again.' };
  }
}

export const paymentRequestId = () => uid('req');
