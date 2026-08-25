// Devil n Dove Build 345 — Accounting-owned quarter/year summary export read service.

import { readAccountingSummaryExportRows } from './accountingSummaryExportReadCore.js';

export const BUILD = 345;
export const CONTRACT_ID = 'accounting-period-summary-export-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze(['accounting_order_records|orders','accounting_expenses','accounting_writeoffs']);

function periodRange(scopeValue, periodValue) {
  const scope = String(scopeValue || '').trim().toLowerCase();
  const raw = String(periodValue || '').trim();
  if (scope === 'year') {
    const match = /^(\d{4})$/.exec(raw);
    if (!match) return null;
    const year = Number(match[1]);
    return { scope, label: match[1], start: `${match[1]}-01-01`, end: `${String(year + 1).padStart(4,'0')}-01-01` };
  }
  if (scope === 'quarter') {
    const match = /^(\d{4})-Q([1-4])$/i.exec(raw);
    if (!match) return null;
    const year = Number(match[1]); const quarter = Number(match[2]);
    const startMonth = (quarter - 1) * 3 + 1; const rawEndMonth = startMonth + 3;
    const endYear = rawEndMonth > 12 ? year + 1 : year; const endMonth = rawEndMonth > 12 ? 1 : rawEndMonth;
    return { scope, label:`${year}-Q${quarter}`, start:`${year}-${String(startMonth).padStart(2,'0')}-01`, end:`${endYear}-${String(endMonth).padStart(2,'0')}-01` };
  }
  return null;
}
function payload(extra={}) { return { ok:true, build:BUILD, contract:CONTRACT_ID, owner:OWNER, mode:'read-only-accounting-period-summary-export', authority_tables:AUTHORITY_TABLES, request_time_schema_mutation:false, ...extra }; }

export async function readAccountingPeriodSummaryExport(db, { scope = '', period = '' } = {}) {
  const range = periodRange(scope, period);
  if (!range) throw new RangeError('Provide a valid quarter like 2026-Q2 or year like 2026.');
  const result = await readAccountingSummaryExportRows(db, range);
  return payload({ schema_ready:result.schema_ready, missing_tables:result.missing_tables, missing_columns:result.missing_columns, scope:range.scope, period:range.label, range:{start:range.start,end:range.end}, rows:result.rows, count:result.rows.length, sources:result.sources });
}
