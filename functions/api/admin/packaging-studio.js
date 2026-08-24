// Devil n Dove Build 293 Packaging Studio legacy-route adapter.
// GET now delegates to the shared Packaging read service while preserving the legacy
// response surface. Direct POST authority remains retired by Build 292.

import { onRequestGet as executePackagingRead } from '../_lib/packagingReadService.js';
import { getAdminUserFromRequest, jsonResponse } from '../_lib/adminAudit.js';

const BUILD = 293;
const LEGACY_SURFACE_BUILD = '277';
const READ_IMPLEMENTATION_BUILD = 286;
const REPLACEMENT_WRITE_PATH = '/api/admin/packaging-write';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function rewrittenJsonResponse(response, payload) {
  if (typeof Response === 'undefined' || typeof Headers === 'undefined') return response;
  const headers = new Headers(response?.headers || undefined);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(payload), {
    status: response?.status || 200,
    statusText: response?.statusText || '',
    headers,
  });
}

async function readPayload(response) {
  try { return await response?.clone?.().json(); }
  catch { return null; }
}

export async function onRequestGet(context) {
  const response = await executePackagingRead(context);
  const payload = await readPayload(response);
  if (!response?.ok || !payload?.ok) return response;

  const next = { ...payload };
  next.build = LEGACY_SURFACE_BUILD;
  next.mode = 'material_library_all_packaging_structured_content_truth_reference_review_first';
  delete next.module_boundary;
  next.read_boundary = {
    build: BUILD,
    read_service_build: BUILD,
    read_implementation_build: READ_IMPLEMENTATION_BUILD,
    read_authority: 'packaging-read-service',
    shared_read_service: true,
    legacy_get_compatibility: true,
  };
  return rewrittenJsonResponse(response, next);
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  return json({
    ok: false,
    error: 'The legacy Packaging Studio POST endpoint is retired. Use the native Packaging write endpoint.',
    error_code: 'packaging_legacy_post_retired',
    build: 292,
    legacy_post_retired: true,
    replacement_path: REPLACEMENT_WRITE_PATH,
  }, 410);
}
