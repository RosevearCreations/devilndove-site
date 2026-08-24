// Devil n Dove Build 292 Packaging write gateway.
// The native write endpoint calls the unchanged Build 291 shared Packaging domain service directly.
// Build 292 retires direct POST authority on /api/admin/packaging-studio.

import { onRequestPost as executePackagingWrite } from '../_lib/packagingDomainService.js';

const BUILD = 292;
const WRITE_SERVICE_BUILD = 291;
const BROAD_READ_REMOVAL_BUILD = 290;
const LEGACY_POST_RETIREMENT_BUILD = 292;

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

function decouplePackagingWritePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const next = { ...payload };
  delete next.products;
  delete next.inventory;
  next.write_boundary = {
    build: BUILD,
    gateway_build: BUILD,
    gateway_path: '/api/admin/packaging-write',
    write_service_build: WRITE_SERVICE_BUILD,
    write_authority: 'packaging-domain-service',
    shared_write_service: true,
    legacy_post_route_is_adapter: false,
    legacy_post_route_retired: true,
    legacy_post_retirement_build: LEGACY_POST_RETIREMENT_BUILD,
    legacy_post_error_code: 'packaging_legacy_post_retired',
    packaging_owned_response: true,
    catalog_collection: 'omitted-owner-contract',
    inventory_collection: 'omitted-owner-contract',
    legacy_broad_reads_removed: true,
    legacy_broad_reads_removed_build: BROAD_READ_REMOVAL_BUILD,
    broad_catalog_queries_skipped: 0,
    broad_inventory_queries_skipped: 0,
    legacy_post_business_logic_preserved: true,
  };
  return next;
}

export async function onRequestPost(context) {
  const response = await executePackagingWrite(context);
  const payload = await readPayload(response);
  if (!response?.ok || !payload?.ok) return response;
  return rewrittenJsonResponse(response, decouplePackagingWritePayload(payload));
}
