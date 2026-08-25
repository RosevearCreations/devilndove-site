// Devil n Dove Build 353 — passive Creative Process read-service adapter.
// Registration performs no request. list() calls the Build 352 owned read contract only when invoked.

export const BUILD = 353;
export const SERVICE_ID = 'creative-process-read';
export const OWNER = 'creative';
export const ROUTE = '/api/admin/contracts/creative-process-read';

function positiveInt(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

async function fetchCreativeProcess(options = {}) {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');
  const query = new URLSearchParams();
  const projectId = positiveInt(options.projectId || options.creativeWorkProjectId);
  const productId = positiveInt(options.productId);
  if (projectId) query.set('project_id', String(projectId));
  if (productId) query.set('product_id', String(productId));
  const response = await apiFetch(`${ROUTE}${query.size ? `?${query.toString()}` : ''}`);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || 'Creative Process read contract failed.');
  return Object.freeze({
    build: Number(data.build || 0),
    legacyBuild: Number(data.legacy_build || 0) || null,
    contract: data.contract || SERVICE_ID,
    owner: data.owner || OWNER,
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    inventoryPostAuthority: data.inventory_post_authority || null,
    inventoryReversalAuthority: data.inventory_reversal_authority || null,
    projects: Object.freeze(data.projects || []),
    detail: data.detail || null,
    productProjectIds: Object.freeze(data.product_project_ids || []),
    outputBlueprint: Object.freeze(data.output_blueprint || []),
    mode: data.mode || null,
  });
}

export function createCreativeProcessReadService() {
  return Object.freeze({
    id: SERVICE_ID,
    owner: OWNER,
    mode: 'read-only-http',
    list: fetchCreativeProcess,
  });
}

export function ensureCreativeProcessReadService(registry) {
  if (!registry || typeof registry.service !== 'function' || typeof registry.registerService !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }
  const existing = registry.service(SERVICE_ID);
  if (existing) return existing;
  return registry.registerService(SERVICE_ID, createCreativeProcessReadService(), OWNER);
}
