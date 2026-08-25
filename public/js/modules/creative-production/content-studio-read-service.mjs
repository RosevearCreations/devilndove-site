// Devil n Dove Build 356 — passive Content Studio read-service registration.
// Registration performs no HTTP request; list() is the only network boundary.

export const BUILD = 356;
export const SERVICE_ID = 'content-studio-read';
export const OWNER = 'content';
export const ROUTE = '/api/admin/contracts/content-studio-read';

function positiveInt(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function fetchRead(options = {}) {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');

  const query = new URLSearchParams();
  const projectId = positiveInt(options.projectId || options.contentProjectId);
  const creativeProjectId = positiveInt(options.creativeProjectId || options.creativeWorkProjectId);
  if (projectId) query.set('project_id', String(projectId));
  else if (creativeProjectId) query.set('creative_project_id', String(creativeProjectId));

  const response = await apiFetch(`${ROUTE}${query.size ? `?${query.toString()}` : ''}`);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || `Content Studio read failed (${response.status}).`);

  return Object.freeze({
    build: Number(data.build || 0),
    legacyBuild: Number(data.legacy_build || 0),
    contract: data.contract || SERVICE_ID,
    owner: data.owner || OWNER,
    schemaReady: data.schema_ready === true,
    missingTables: Object.freeze(data.missing_tables || []),
    missingColumns: Object.freeze(data.missing_columns || []),
    optionalTables: Object.freeze(data.optional_tables || {}),
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    projects: Object.freeze(data.projects || []),
    approvedProducts: Object.freeze(data.approved_products || []),
    creativeProjects: Object.freeze(data.creative_projects || []),
    detail: data.detail || null,
    requestedCreativeProjectId: Number(data.requested_creative_project_id || 0) || null,
    resolvedProjectId: Number(data.resolved_project_id || 0) || null,
    mode: data.mode || null,
  });
}

const SERVICE = Object.freeze({
  id: SERVICE_ID,
  owner: OWNER,
  mode: 'read-only-http',
  list: fetchRead,
});

export function ensureContentStudioReadService(registry) {
  if (!registry || typeof registry.service !== 'function' || typeof registry.registerService !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }
  if (!registry.service(SERVICE_ID)) registry.registerService(SERVICE_ID, SERVICE, OWNER);
  return registry.service(SERVICE_ID);
}
