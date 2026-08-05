/* ============================================================
   Minimal CSV parser for reading a published Google Sheet.
   Handles quoted fields (commas/newlines inside "...") and "" as
   an escaped quote — the only two things Sheets' CSV export uses
   that a naive split(',') would get wrong.
   ============================================================ */

/** Parses CSV text into an array of row objects keyed by the header row. */
export function parseCsv(text) {
  const rows = parseRows(String(text ?? ''));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((key, i) => [key, (r[i] ?? '').trim()])));
}

function parseRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
