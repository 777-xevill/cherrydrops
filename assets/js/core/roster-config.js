/* ============================================================
   Where the live member roster is read from.

   Staff manage members entirely inside a Google Sheet — this site
   has no database of its own. On every page load the portal fetches
   this published-CSV link and uses it as the current member list.
   See /MEMBER-SHEET-SETUP.md for the one-time setup.

   Until this is filled in with a real "Publish to web" CSV link, the
   site quietly falls back to its built-in demo roster — nothing
   breaks, it just isn't live yet.
   ============================================================ */

export const MEMBERS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTKfgTm2pKa7mJgmlej144_5ttLHYWb8nXX7nh3E6UvGfmXNswqEU3CLpCIxQHkbwk9Y1pRMdjYecCA/pub?output=csv';
