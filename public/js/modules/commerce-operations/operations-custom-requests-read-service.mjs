// Devil n Dove Build 371 — passive Operations Custom Requests startup read service.
// Registration performs no request. list() invokes the Build 370 GET-only contract.

export const BUILD = 371;
export const CONTRACT_BUILD = 370;
export const SERVICE_ID = 'operations-custom-requests-read';
export const OWNER = 'operations';
export const ROUTE = '/api/admin/contracts/operations-custom-requests-read';

async function fetchCustomRequestsRead() {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');

  const response = await apiFetch(ROUTE);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Custom Requests read contract failed (${response.status}).`);
  }

  return Object.freeze({
    build: Number(data.build || 0),
    contract: data.contract || SERVICE_ID,
    owner: data.owner || OWNER,
    schemaReady: data.schema_ready === true,
    missingTables: Object.freeze(data.missing_tables || []),
    checkedTables: Object.freeze(data.checked_tables || []),
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    compatibilityPostAuthority: data.compatibility_post_authority || '/api/admin/custom-requests',
    compatibilityPostMutationOwnershipMoved: data.compatibility_post_mutation_ownership_moved === true,
    marketplaceCsvLegacyGetOutsideContract: data.marketplace_csv_legacy_get_outside_contract === true,
    requests: Object.freeze(data.requests || []),
    summary: Object.freeze(data.summary || {}),
  });
}

const SERVICE = Object.freeze({
  id: SERVICE_ID,
  owner: OWNER,
  mode: 'read-only-http',
  list: fetchCustomRequestsRead,
});

export function ensureOperationsCustomRequestsReadService(registry) {
  if (!registry || typeof registry.service !== 'function' || typeof registry.registerService !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }
  if (!registry.service(SERVICE_ID)) registry.registerService(SERVICE_ID, SERVICE, OWNER);
  return registry.service(SERVICE_ID);
}
