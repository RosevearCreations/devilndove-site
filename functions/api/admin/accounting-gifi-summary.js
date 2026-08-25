import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingGifiSummary } from '../_lib/accountingGifiSummaryReadService.js';

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  try {
    const result = await readAccountingGifiSummary(db, { year: url.searchParams.get('year') || String(new Date().getFullYear()) });
    if ((url.searchParams.get('format') || '').toLowerCase() === 'csv') {
      const lines = ['gifi_section,gifi_code,gifi_label,ledger_codes,debit_cents,credit_cents,net_cents,deductible_cents,source_count'];
      for (const row of result.gifi_rows || []) {
        lines.push([row.gifi_section, row.gifi_code, row.gifi_label, row.ledger_codes, row.debit_cents, row.credit_cents, row.net_cents, row.deductible_cents, row.source_count].map(csvEscape).join(','));
      }
      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="devilndove-gifi-staging-${result.year}.csv"`,
        },
      });
    }
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof RangeError || error?.code === 'invalid_accounting_year') return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Please provide year in YYYY format.' }, 400);
    return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to build GIFI staging summary.' }, 500);
  }
}
