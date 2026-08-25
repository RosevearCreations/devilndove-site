// Devil n Dove Build 363 — passive Operations Membership startup read service.
// Registration performs no request. list() invokes the Build 362 owned read contract.

export const BUILD = 363;
export const CONTRACT_BUILD = 362;
export const SERVICE_ID = 'operations-membership-read';
export const OWNER = 'operations';
export const ROUTE = '/api/admin/contracts/operations-membership-read';

async function fetchMembershipRead() {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');

  const response = await apiFetch(ROUTE);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Membership read contract failed (${response.status}).`);
  }

  return Object.freeze({
    build: Number(data.build || 0),
    contract: data.contract || SERVICE_ID,
    owner: data.owner || OWNER,
    schemaReady: data.schema_ready === true,
    missingTables: Object.freeze(data.missing_tables || []),
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    tierPolicySource: data.tier_policy_source || null,
    tierPolicyDefaultsMaterialized: data.tier_policy_defaults_materialized === true,
    users: Object.freeze(data.users || []),
    accessTiers: Object.freeze(data.access_tiers || []),
    tierPolicies: Object.freeze(data.tier_policies || []),
  });
}

const SERVICE = Object.freeze({
  id: SERVICE_ID,
  owner: OWNER,
  mode: 'read-only-http',
  list: fetchMembershipRead,
});

export function ensureOperationsMembershipReadService(registry) {
  if (!registry || typeof registry.service !== 'function' || typeof registry.registerService !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }
  if (!registry.service(SERVICE_ID)) registry.registerService(SERVICE_ID, SERVICE, OWNER);
  return registry.service(SERVICE_ID);
}
