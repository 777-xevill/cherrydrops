# Setting up online bookings (5 minutes, one time)

When someone books a membership on the website, it needs somewhere to
land. This site sends every booking straight into a **Google Sheet you
own** — it looks and works exactly like Excel, and you'll get an email
the moment a new booking comes in. Nobody needs to touch any code
after this one-time setup.

## Step 1 — Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and sign in
   with the Google account you want to own the bookings (e.g. the
   gym's official Gmail).
2. Click **Blank** to create a new spreadsheet.
3. Name it something like "Cherry Drops Bookings" (top-left, click the
   title to rename).

## Step 2 — Paste in the connector script

1. In that Sheet, click **Extensions → Apps Script**.
2. Delete anything in the code box that appears.
3. Open the file `google-apps-script/booking-webhook.gs` from this
   project, copy its entire contents, and paste it into the code box.
4. Find this line near the top:
   ```
   const OWNER_EMAIL = 'owner@example.com';
   ```
   Change `owner@example.com` to the email address that should get a
   message every time someone books — usually the owner's own email.
5. Click the **Save** icon (top-left, looks like a floppy disk).

## Step 3 — Turn it into a web address

1. Click the blue **Deploy** button (top-right) → **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. The first time, Google will ask you to authorize it — click
   **Authorize access**, pick your account, click **Advanced → Go to
   (project name), then Allow**. This is normal for scripts you write
   yourself.
6. You'll now see a **Web app URL** — click the copy icon next to it.

## Step 4 — Connect it to the website

1. Open the file `assets/js/core/booking-config.js` in the website
   project.
2. Replace the placeholder text with the URL you just copied:
   ```js
   export const BOOKING_WEBHOOK_URL = 'PASTE THE URL YOU COPIED HERE';
   ```
3. Save, then re-deploy the website (or ask your developer to).

That's it — bookings now flow straight into your Sheet.

## Day-to-day: how to manage a new booking

You don't need to check anything manually — you'll get an **email**
for every new booking. When one arrives:

1. Open the Sheet (bookmark it, or open the Google Sheets app on your
   phone).
2. Each booking is a row: name, phone, email, branch, package, and a
   **Status** column.
3. Call the customer to confirm, then just type over the Status cell
   — e.g. change `New` to `Confirmed` or `Done`. That's the entire
   "workflow" — editing a cell, same as Excel.

No passwords, no dashboard, no technical steps beyond this one-time
setup.
