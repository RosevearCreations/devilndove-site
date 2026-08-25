// Devil n Dove Build 344 — Accounting-owned monthly summary export read service.

import { readAccountingSummaryExportRows } from './accountingSummaryExportReadCore.js';

export const BUILD = 344;
export const CONTRACT_ID = 'accounting-monthly-summary-export-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze(['accounting_order_records|orders','accounting_expenses','accounting_writeoffs']);

function monthRange(value) {
  const raw = String(value || '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]); const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return { label: raw, start: `${match[1]}-${match[2]}-01`, end: `${String(nextYear).padStart(4,'0')}-${String(nextMonth).padStart(2,'0')}-01` };
}
function payload(extra={}) { return { ok:true, build:BUILD, contract:CONTRACT_ID, owner:OWNER, mode:'read-only-accounting-monthly-summary-export', authority_tables:AUTHORITY_TABLES, request_time_schema_mutation:false, ...extra }; }

export async function readAccountingMonthlySummaryExport(db, { month = '' } = {}) {
  const range = monthRange(month);
  if (!range) throw new RangeError('Please provide month in YYYY-MM format.');
  const result = await readAccountingSummaryExportRows(db, range);
  return payload({ schema_ready:result.schema_ready, missing_tables:result.missing_tables, missing_columns:result.missing_columns, period:range.label, range:{start:range.start,end:range.end}, rows:result.rows, count:result.rows.length, sources:result.sources });
}
