// Devil n Dove Build 367 — passive Operations Today Tasks read service.
// Registration performs no request. list() invokes the Build 366 owned read contract.

export const BUILD = 367;
export const CONTRACT_BUILD = 366;
export const SERVICE_ID = 'operations-today-tasks-read';
export const OWNER = 'operations';
export const ROUTE = '/api/admin/contracts/operations-today-tasks-read';

async function fetchTodayTasksRead(options = {}) {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');

  const params = new URLSearchParams();
  const category = String(options.category || '').trim();
  const minCount = Number(options.minCount ?? 1);
  if (category) params.set('category', category);
  if (Number.isFinite(minCount)) params.set('min_count', String(minCount));
  const route = params.size ? `${ROUTE}?${params.toString()}` : ROUTE;

  const response = await apiFetch(route);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Today Tasks read contract failed (${response.status}).`);
  }

  return Object.freeze({
    build: Number(data.build || 0),
    contract: data.contract || SERVICE_ID,
    owner: data.owner || OWNER,
    schemaReady: data.schema_ready === true,
    missingTables: Object.freeze(data.missing_tables || []),
    queryErrors: Object.freeze(data.query_errors || []),
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    actionAuthority: data.action_authority || '/api/admin/today-task-actions',
    actionMutationOwnershipMoved: data.action_mutation_ownership_moved === true,
    tasks: Object.freeze(data.tasks || []),
    categories: Object.freeze(data.categories || []),
    suppressedCount: Number(data.suppressed_count || 0),
    summary: Object.freeze(data.summary || {}),
  });
}

const SERVICE = Object.freeze({
  id: SERVICE_ID,
  owner: OWNER,
  mode: 'read-only-http',
  list: fetchTodayTasksRead,
});

export function ensureOperationsTodayTasksReadService(registry) {
  if (!registry || typeof registry.service !== 'function' || typeof registry.registerService !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }
  if (!registry.service(SERVICE_ID)) registry.registerService(SERVICE_ID, SERVICE, OWNER);
  return registry.service(SERVICE_ID);
}
