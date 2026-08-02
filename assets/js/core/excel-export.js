/* ============================================================
   Branch-wise ledger export — DEMO scope.

   Produces a real, downloadable CSV file (Excel/Sheets open CSV
   natively, formulas and all, without any library) formatted to
   look like a ledger sheet: one header block per branch, columns
   matching what a front-desk bookkeeper already tracks. This is
   a genuine client-side file generation — nothing about it is
   faked — but it is a fresh download each time, not a write into
   a specific existing workbook on disk. A production version would
   run this same row-building logic on a server and append to the
   real .xlsx via a library that can edit existing workbooks (e.g.
   a Node service using ExcelJS against a shared network path or
   cloud drive), which the front end has no access to from the
   browser sandbox.
   ============================================================ */

import { branch, pkg, paymentMethod } from './store.js';
import { money, fmtDate, esc } from './util.js';

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(cells) { return cells.map(csvCell).join(','); }

/** Build ledger rows for one branch (or all), newest first. */
export function buildLedgerRows(payments, branchId = 'all') {
  return payments
    .filter((p) => branchId === 'all' || p.branchId === branchId)
    .map((p) => ({
      date: p.date,
      branch: branch(p.branchId)?.name ?? p.branchId,
      member: p.memberName,
      memberId: p.memberId,
      package: p.packageId === 'pt' ? 'Personal Training' : (pkg(p.packageId)?.name ?? p.packageId),
      method: paymentMethod(p.method)?.name ?? p.method,
      reference: p.reference,
      gross: p.gross,
      discountPct: p.discountPct,
      amount: p.amount,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      exportedBefore: p.exported,
    }));
}

/**
 * Build and download a CSV ledger, grouped into one block per
 * branch (or a single block when a specific branch is requested).
 */
export function exportLedgerCsv(payments, { branchId = 'all', label = 'ledger' } = {}) {
  const rows = buildLedgerRows(payments, branchId);
  const branches = branchId === 'all' ? [...new Set(rows.map((r) => r.branch))] : [branch(branchId)?.name ?? branchId];

  const lines = [];
  lines.push(row(['Cherry Drops Fitness & Life Style 3.0 — Payment Ledger']));
  lines.push(row([`Generated`, new Date().toLocaleString('en-GB')]));
  lines.push('');

  const header = ['Date', 'Branch', 'Member', 'Member ID', 'Package', 'Method', 'Reference', 'Gross (BDT)', 'Discount %', 'Net Amount (BDT)', 'Period Start', 'Period End'];

  for (const b of branches) {
    lines.push(row([`Branch: ${b}`]));
    lines.push(row(header));
    const branchRows = rows.filter((r) => r.branch === b);
    let subtotal = 0;
    for (const r of branchRows) {
      subtotal += r.amount;
      lines.push(row([r.date, r.branch, r.member, r.memberId, r.package, r.method, r.reference, r.gross, r.discountPct, r.amount, r.periodStart, r.periodEnd]));
    }
    lines.push(row(['', '', '', '', '', '', '', '', 'Subtotal', subtotal]));
    lines.push('');
  }

  const grandTotal = rows.reduce((t, r) => t + r.amount, 0);
  lines.push(row(['', '', '', '', '', '', '', '', 'Grand total', grandTotal]));

  const csv = `﻿${lines.join('\r\n')}`; // BOM so Excel renders ৳/UTF-8 correctly
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `cherrydrops-${label}-${stamp}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { rowCount: rows.length, grandTotal };
}

export const renderPreviewTable = (payments, branchId = 'all') => buildLedgerRows(payments, branchId)
  .slice(0, 12)
  .map((r) => `<tr>
    <td>${esc(fmtDate(r.date))}</td>
    <td>${esc(r.branch)}</td>
    <td>${esc(r.member)}</td>
    <td>${esc(r.package)}</td>
    <td>${esc(r.method)}</td>
    <td class="num">${esc(money(r.amount))}</td>
  </tr>`).join('');
