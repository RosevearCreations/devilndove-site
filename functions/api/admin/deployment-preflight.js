// Release 467 Build 37 compatibility route.
// GET delegates to the current read-only Deployment Preflight. Historical write actions
// are retired; schema and evidence mutations are never performed from this route.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as getCurrentDeploymentPreflight } from './current-deployment-preflight.js';

export async function onRequestGet(context) {
  return getCurrentDeploymentPreflight(context);
}

export async function onRequestPost() {
  return jsonResponse({
    ok: false,
    release: 467,
    build: 37,
    error: 'Deployment Preflight write actions are retired. This route is read-only; use the canonical migration/release process for schema or evidence changes.',
    mutation_capability: 'none',
  }, 405, { 'Cache-Control': 'no-store', Allow: 'GET' });
}
