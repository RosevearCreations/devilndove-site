// Devil n Dove Build 386 passive Gift Cards read service.
// Registration performs no request. list() invokes the Build 385 GET-only contract.

export const BUILD = 386;
export const CONTRACT_BUILD = 385;
export const SERVICE_ID = 'operations-gift-cards-read';
export const OWNER = 'operations';
export const ROUTE = '/api/admin/contracts/operations-gift-cards-read';

async function fetchGiftCardsRead() {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');
  const response = await apiFetch(ROUTE);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || `Gift Cards read failed (${response.status}).`);
  return Object.freeze({
    build: Number(data.build || 0),
    contract: data.contract || SERVICE_ID,
    owner: data.owner || OWNER,
    schemaReady: data.schema_ready === true,
    missingTables: Object.freeze(data.missing_tables || []),
    queryErrors: Object.freeze(data.query_errors || []),
    checkedTables: Object.freeze(data.checked_tables || []),
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    requestTimeDefaultSeeding: data.request_time_default_seeding === true,
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
  list: fetchGiftCardsRead,
});

export function ensureOperationsGiftCardsReadService(registry) {
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
