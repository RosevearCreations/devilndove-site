// Devil n Dove Build 397 Operations-owned Customer Documents GET-only read contract.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readCustomerDocuments } from '../../_lib/customerDocumentsReadService.js';

export { BUILD, CONTRACT_ID, OWNER };

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: 'Admin access required.' }, 401);

  const url = new URL(context.request.url);
  try {
    return jsonResponse(await readCustomerDocuments(db, {
      orderId: Number(url.searchParams.get('order_id') || 0),
      documentId: Number(url.searchParams.get('document_id') || 0),
    }));
  } catch (error) {
    return jsonResponse({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      error_code: 'customer_documents_read_failed',
      error: String(error?.message || error || 'Customer Documents read failed.'),
    }, 500);
  }
}
