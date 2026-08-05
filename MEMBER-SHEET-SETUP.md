# Setting up the live member list (2 minutes, one time)

This connects the Member Portal to a Google Sheet that staff manage
directly — the website shows whatever is in the Sheet. No code, no
app, no dashboard to learn: adding a member is typing a row into a
spreadsheet.

## Step 1 — Set up the Sheet

Create a Google Sheet (or use the one your developer already gave
you) with exactly these column headers in the first row:

```
Member Name | Member ID | Package | Package Start Date | Package End Date | Package Duration | Trainer | Branch
```

- **Package** should be one of: `Monthly`, `Quarterly`, `Half-Yearly`, `Yearly`
- **Branch** should match a branch name exactly, e.g. `BNS Centre`
- **Trainer** should match a trainer's name exactly, or leave blank
- Dates in `YYYY-MM-DD` format, e.g. `2026-08-15`

Each new row underneath is a new member.

## Step 2 — Publish it (this is the only technical-ish step)

1. In the Sheet, click **File → Share → Publish to web**.
2. In the dialog, make sure it's set to publish the correct sheet/tab,
   and choose **Comma-separated values (.csv)** from the format
   dropdown.
3. Click **Publish**, confirm the warning popup.
4. Copy the link it gives you.

## Step 3 — Connect it to the website

1. Open `assets/js/core/roster-config.js` in the website project.
2. Replace the placeholder with the link you copied:
   ```js
   export const MEMBERS_CSV_URL = 'PASTE THE LINK YOU COPIED HERE';
   ```
3. Save, then re-deploy the website (or ask your developer to).

Done. The portal now reads this Sheet every time someone opens it.

## Day-to-day: adding a new member

1. Open the Sheet.
2. Add a new row: their name, a Member ID you assign them (e.g. the
   next `GC-1011`), their package, start/end dates, trainer, and
   branch.
3. Tell the member their Member ID — that's what they log in with on
   the site. That's it.

To change someone's package or extend their membership, just edit
their row's Package / date cells directly — same as Excel.

## One thing worth knowing

Publishing a sheet "to the web" makes it readable by anyone who has
that exact link (though it's not searchable and Google doesn't list
it anywhere). Don't put anything in this particular sheet you
wouldn't want visible to someone who found the link — for most gyms,
names/IDs/package dates are fine, but avoid adding sensitive personal
data to it beyond what's already in the column list above.
