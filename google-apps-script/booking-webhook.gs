/**
 * Cherry Drops — website booking webhook.
 *
 * Receives new bookings from the website's "Book" form, writes each
 * one as a new row in this spreadsheet, and emails the owner so they
 * never have to go looking for it.
 *
 * ONE-TIME SETUP (about 5 minutes) — see /BOOKING-SETUP.md for the
 * full walkthrough with screenshots-style steps. Short version:
 *   1. Change OWNER_EMAIL below to the address that should be
 *      notified of every booking.
 *   2. Deploy > New deployment > type "Web app" > Execute as "Me" >
 *      Who has access "Anyone" > Deploy.
 *   3. Copy the Web app URL and paste it into
 *      assets/js/core/booking-config.js on the website.
 */

const OWNER_EMAIL = 'owner@example.com'; // <-- change this to the gym owner's email

function doPost(e) {
  const sheet = getBookingsSheet();
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.phone || '',
    data.email || '',
    data.branch || '',
    data.package || '',
    'New',
  ]);

  notifyOwner(data);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getBookingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Bookings');
  if (!sheet) {
    sheet = ss.insertSheet('Bookings');
    sheet.appendRow(['Received At', 'Name', 'Phone', 'Email', 'Branch', 'Package', 'Status']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function notifyOwner(data) {
  if (!OWNER_EMAIL || OWNER_EMAIL === 'owner@example.com') return;
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: `New booking: ${data.name || 'Website visitor'}`,
    body:
      'A new booking came in from the website:\n\n' +
      `Name: ${data.name || '-'}\n` +
      `Phone: ${data.phone || '-'}\n` +
      `Email: ${data.email || '-'}\n` +
      `Branch: ${data.branch || '-'}\n` +
      `Package: ${data.package || '-'}\n\n` +
      'Open the "Bookings" sheet to confirm it and update its status.',
  });
}
