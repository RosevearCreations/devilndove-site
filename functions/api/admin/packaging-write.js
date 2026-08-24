// Devil n Dove Build 289 Packaging write gateway.
// The mature legacy POST implementation remains authoritative for business writes.
// This gateway only decouples its successful response refresh from broad Catalog and
// Inventory enumeration; those collections remain owned by their module contracts.

import { onRequestPost as legacyPackagingPost } from './packaging-studio.js';
import {
  createPackagingResponseFilteredDb,
  decouplePackagingWritePayload,
} from '../_lib/packagingWriteBoundary.mjs';

const BUILD = 289;

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

function scopedEnvironment(env, filteredDb) {
  return new Proxy(env || {}, {
    get(target, property, receiver) {
      if (property === 'DB') return filteredDb;
      return Reflect.get(target, property, receiver);
    },
  });
}

export async function onRequestPost(context) {
  const counters = { catalog: 0, inventory: 0 };
  const filteredDb = createPackagingResponseFilteredDb(context?.env?.DB, counters);
  const delegatedContext = {
    ...context,
    env: scopedEnvironment(context?.env, filteredDb),
  };

  const response = await legacyPackagingPost(delegatedContext);
  const payload = await readPayload(response);
  if (!response?.ok || !payload?.ok) return response;

  const decoupled = decouplePackagingWritePayload(payload, counters);
  decoupled.write_boundary = {
    ...decoupled.write_boundary,
    gateway_build: BUILD,
    gateway_path: '/api/admin/packaging-write',
  };
  return rewrittenJsonResponse(response, decoupled);
}
