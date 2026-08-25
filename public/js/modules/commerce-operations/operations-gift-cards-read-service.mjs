// Devil n Dove Build 386 passive Gift Cards read service.

export const BUILD = 386;
export const CONTRACT_BUILD = 385;
export const SERVICE_ID = 'operations-gift-cards-read';
export const OWNER = 'operations';
export const ROUTE = '/api/admin/contracts/operations-gift-cards-read';

function service() {
  return Object.freeze({
    id: SERVICE_ID,
    owner: OWNER,
    build: BUILD,
    contractBuild: CONTRACT_BUILD,
    route: ROUTE,
    passiveRegistration: true,
    createsNetworkTransport: false,
    mutationOwnershipMoved: false,
    async list() {
      if (!window.DDAuth?.apiFetch) throw new Error('DDAuth.apiFetch is unavailable.');
      const response = await window.DDAuth.apiFetch(ROUTE);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Gift Cards read failed (${response.status}).`);
      return Object.freeze({
        build: Number(data.build || 0),
        schemaReady: data.schema_ready === true,
        missingTables: Object.freeze([...(data.missing_tables || [])]),
        queryErrors: Object.freeze([...(data.query_errors || [])]),
        requestTimeSchemaMutation: data.request_time_schema_mutation === true,
        mutationOwnershipMoved: data.mutation_ownership_moved === true,
        data,
      });
    },
  });
}

export function ensureOperationsGiftCardsReadService(registry = window.DDModuleRuntime) {
  const existing = registry?.service?.(SERVICE_ID);
  if (existing) return existing;
  const next = service();
  registry?.registerService?.(SERVICE_ID, next);
  return registry?.service?.(SERVICE_ID) || next;
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
