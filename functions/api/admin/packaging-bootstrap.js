// Devil n Dove Build 293 Packaging bootstrap adapter.
// The proven Build 286 Packaging-owned read implementation now lives in the shared
// Packaging read service. This endpoint preserves the Build 286 client-facing surface
// while exposing Build 293 read-authority provenance.

import { onRequestGet as executePackagingRead } from '../_lib/packagingReadService.js';

const BUILD = 293;
const READ_IMPLEMENTATION_BUILD = 286;

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

  return rewrittenJsonResponse(response, {
    ...payload,
    read_service_build: BUILD,
    read_implementation_build: READ_IMPLEMENTATION_BUILD,
    read_authority: 'packaging-read-service',
    shared_read_service: true,
    module_boundary: {
      ...(payload.module_boundary || {}),
      read_service_build: BUILD,
      read_implementation_build: READ_IMPLEMENTATION_BUILD,
      read_authority: 'packaging-read-service',
      shared_read_service: true,
    },
  });
}
