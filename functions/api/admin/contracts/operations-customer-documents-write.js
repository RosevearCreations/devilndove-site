// Devil n Dove Build 414 Operations-owned Customer Documents mutation authority.

import { onRequestPost as implementationPost } from '../customer-documents.js';

export const BUILD = 414;
export const CONTRACT_ID = 'operations-customer-documents-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/customer-documents';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  actions: Object.freeze(['issue_document', 'void_document']),
  implementationRoute: IMPLEMENTATION_ROUTE,
  migrationAuthority: 'database_customer_documents_runtime_parity.sql',
  requestTimeSchemaMutation: false,
  immutableSnapshotSemanticsChanged: false,
  consumerMoved: false,
});

export async function onRequestPost(context) {
  return implementationPost(context);
}
