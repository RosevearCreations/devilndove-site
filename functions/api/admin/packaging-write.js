// Devil n Dove Build 290 Packaging write gateway.
// The mature Packaging POST implementation remains authoritative for business writes.
// Build 290 physically removes the retired broad Catalog/Inventory reads from that
// implementation, so this gateway now delegates directly and only keeps the Build 289
// response-shape boundary for contract-owned collections.

import { onRequestPost as legacyPackagingPost } from './packaging-studio.js';

const BUILD = 290;

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
    delegated_legacy_write: true,
    packaging_owned_response: true,
    catalog_collection: 'omitted-owner-contract',
    inventory_collection: 'omitted-owner-contract',
    legacy_broad_reads_removed: true,
    legacy_broad_reads_removed_build: BUILD,
    broad_catalog_queries_skipped: 0,
    broad_inventory_queries_skipped: 0,
    legacy_post_business_logic_preserved: true,
  };
  return next;
}

export async function onRequestPost(context) {
  const response = await legacyPackagingPost(context);
  const payload = await readPayload(response);
  if (!response?.ok || !payload?.ok) return response;
  return rewrittenJsonResponse(response, decouplePackagingWritePayload(payload));
}
