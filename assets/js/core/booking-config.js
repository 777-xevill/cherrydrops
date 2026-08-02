/* ============================================================
   Where new website bookings get sent.

   This site has no server of its own, so bookings are POSTed
   straight to a Google Apps Script "Web App" URL that writes each
   one into the owner's own Google Sheet and emails them a
   notification. See /BOOKING-SETUP.md for the one-time setup.

   Until this is filled in with a real deployed script URL, the
   booking form will show a friendly "call us instead" message
   rather than silently pretending a submission succeeded.
   ============================================================ */

export const BOOKING_WEBHOOK_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
