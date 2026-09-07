// Release 467 Build 63 — read-only operator projection of D1 application guardrails.
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';
import { buildReadBudgetHeaders, publicReadBudgetSnapshot } from '../_lib/d1ReadBudget.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401, { 'Cache-Control': 'no-store' });

  return jsonResponse({
    ok: true,
    read_only: true,
    provider_usage_metering_available_here: false,
    automatic_query_shutdown: false,
    automatic_d1_mutation: false,
    requested_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    },
    policy: publicReadBudgetSnapshot(),
    operator_guidance: [
      'Treat repeated Product rollup calls as a defect; the browser guard should coalesce and temporarily reuse identical successful GET responses.',
      'Use the Product picker read model for degraded picker recovery rather than Product resource bootstrap.',
      'Do not use blank search parameters to browse large datasets. Search-capable recovery routes must enforce a minimum term length.',
      'Cloudflare provider-side D1 usage remains the authority for actual rows-read totals; this endpoint exposes application-side guardrails only.'
    ]
  }, 200, {
    'Cache-Control': 'no-store',
    ...buildReadBudgetHeaders('admin_products')
  });
}
