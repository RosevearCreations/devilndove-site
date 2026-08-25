// Devil n Dove Build 397 passive Customer Documents read service.
// Registration performs no request. list() invokes the Build 397 GET-only contract.

export const BUILD = 397;
export const CONTRACT_BUILD = 397;
export const SERVICE_ID = 'operations-customer-documents-read';
export const OWNER = 'operations';
export const ROUTE = '/api/admin/contracts/operations-customer-documents-read';

async function fetchCustomerDocumentsRead(params = {}) {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');
  const query = new URLSearchParams();
  if (Number(params?.orderId || 0) > 0) query.set('order_id', String(Number(params.orderId)));
  if (Number(params?.documentId || 0) > 0) query.set('document_id', String(Number(params.documentId)));
  const response = await apiFetch(`${ROUTE}${query.size ? `?${query.toString()}` : ''}`);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || `Customer Documents read failed (${response.status}).`);
  return Object.freeze({
    build: Number(data.build || 0),
    contract: data.contract || SERVICE_ID,
    owner: data.owner || OWNER,
    schemaReady: data.schema_ready === true,
    missingTables: Object.freeze(data.missing_tables || []),
    missingColumns: Object.freeze(data.missing_columns || []),
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    data,
  });
}

const SERVICE = Object.freeze({
  id: SERVICE_ID,
  owner: OWNER,
  mode: 'read-only-http',
  build: BUILD,
  contractBuild: CONTRACT_BUILD,
  route: ROUTE,
  list: fetchCustomerDocumentsRead,
});

export function ensureOperationsCustomerDocumentsReadService(registry) {
  if (!registry || typeof registry.service !== 'function' || typeof registry.registerService !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }
  if (!registry.service(SERVICE_ID)) registry.registerService(SERVICE_ID, SERVICE, OWNER);
  return registry.service(SERVICE_ID);
}

export const metadata = Object.freeze({
  id: SERVICE_ID,
  owner: OWNER,
  build: BUILD,
  contractBuild: CONTRACT_BUILD,
  route: ROUTE,
  passiveRegistration: true,
  createsNetworkTransport: false,
  mutationOwnershipMoved: false,
});
