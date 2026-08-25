// Devil n Dove Build 360 — passive CAIP read-service registrations.
// Registration performs no HTTP request. list() methods are the only network boundaries.

export const BUILD = 360;
export const OWNER = 'caip';
export const CAIP_READ_SERVICE_ID = 'caip-read';
export const CAIP_MEDIA_INTAKE_READ_SERVICE_ID = 'caip-media-intake-read';
export const CAIP_READ_ROUTE = '/api/admin/contracts/caip-read';
export const CAIP_MEDIA_INTAKE_READ_ROUTE = '/api/admin/contracts/caip-media-intake-read';

function positiveInt(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function fetchJson(route, params = {}) {
  const apiFetch = globalThis.DDAuth?.apiFetch;
  if (typeof apiFetch !== 'function') throw new Error('Authenticated API client is unavailable.');
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '' || value === 0) continue;
    query.set(key, String(value));
  }
  const response = await apiFetch(`${route}${query.size ? `?${query.toString()}` : ''}`);
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || `CAIP read failed (${response.status}).`);
  return data;
}

async function fetchCaip(options = {}) {
  const data = await fetchJson(CAIP_READ_ROUTE, {
    creative_project_id: positiveInt(options.creativeProjectId || options.projectId),
    product_id: positiveInt(options.productId),
  });
  return Object.freeze({
    build: Number(data.build || 0),
    legacyBuild: data.legacy_build || null,
    contract: data.contract || CAIP_READ_SERVICE_ID,
    owner: data.owner || OWNER,
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    schemaVerificationOnly: data.schema_verification_only === true,
    r2Mutation: data.r2_mutation === true,
    sourceMediaMutation: data.source_media_mutation === true,
    projects: Object.freeze(data.projects || []),
    contentProjects: Object.freeze(data.content_projects || []),
    detail: data.detail || null,
    operations: data.operations || null,
    requestedProductId: Number(data.requested_product_id || 0) || null,
    resolvedCreativeProjectId: Number(data.resolved_creative_project_id || 0) || null,
    mode: data.mode || null,
  });
}

async function fetchMediaIntake(options = {}) {
  const data = await fetchJson(CAIP_MEDIA_INTAKE_READ_ROUTE, {
    creative_project_id: positiveInt(options.creativeProjectId || options.projectId),
  });
  return Object.freeze({
    build: Number(data.build || 0),
    legacyBuild: data.legacy_build || null,
    contract: data.contract || CAIP_MEDIA_INTAKE_READ_SERVICE_ID,
    owner: data.owner || OWNER,
    requestTimeSchemaMutation: data.request_time_schema_mutation === true,
    mutationOwnershipMoved: data.mutation_ownership_moved === true,
    schemaVerificationOnly: data.schema_verification_only === true,
    r2Mutation: data.r2_mutation === true,
    binaryMutation: data.binary_mutation === true,
    projects: Object.freeze(data.projects || []),
    settings: Object.freeze(data.settings || []),
    selectedProjectId: Number(data.selected_project_id || 0) || null,
    sessions: Object.freeze(data.sessions || []),
    files: Object.freeze(data.files || []),
    parts: Object.freeze(data.parts || []),
    processingJobs: Object.freeze(data.processing_jobs || []),
    promotionRequests: Object.freeze(data.promotion_requests || []),
    readiness: Object.freeze(data.readiness || {}),
    duplicateAudit: data.duplicate_audit || null,
    binding: Object.freeze(data.binding || {}),
    stageSummary: data.stage_summary || null,
  });
}

const CAIP_READ_SERVICE = Object.freeze({
  id: CAIP_READ_SERVICE_ID,
  owner: OWNER,
  mode: 'read-only-http',
  list: fetchCaip,
});

const CAIP_MEDIA_INTAKE_READ_SERVICE = Object.freeze({
  id: CAIP_MEDIA_INTAKE_READ_SERVICE_ID,
  owner: OWNER,
  mode: 'read-only-http',
  list: fetchMediaIntake,
});

export function ensureCaipReadServices(registry) {
  if (!registry || typeof registry.service !== 'function' || typeof registry.registerService !== 'function') {
    throw new TypeError('A Devil n Dove module registry is required.');
  }
  if (!registry.service(CAIP_READ_SERVICE_ID)) {
    registry.registerService(CAIP_READ_SERVICE_ID, CAIP_READ_SERVICE, OWNER);
  }
  if (!registry.service(CAIP_MEDIA_INTAKE_READ_SERVICE_ID)) {
    registry.registerService(CAIP_MEDIA_INTAKE_READ_SERVICE_ID, CAIP_MEDIA_INTAKE_READ_SERVICE, OWNER);
  }
  return Object.freeze({
    caipRead: registry.service(CAIP_READ_SERVICE_ID),
    caipMediaIntakeRead: registry.service(CAIP_MEDIA_INTAKE_READ_SERVICE_ID),
  });
}
