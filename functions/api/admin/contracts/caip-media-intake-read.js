// Devil n Dove Build 359 — CAIP private-media intake GET-only contract.
// The retained intake GET verifies migration readiness and reads governed state only;
// upload/session/governance/promotion mutations remain on the existing POST authority.

import { onRequestGet as legacyGet } from '../caip-media-intake.js';

export const BUILD = 359;
export const CONTRACT_ID = 'caip-media-intake-read';
export const OWNER = 'caip';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  const response = await legacyGet(context);
  const data = await response.json().catch(() => null);
  if (!data) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      schema_verification_only: true,
      error: 'CAIP media-intake read returned a non-JSON response.',
    }, response.status || 500);
  }

  return json({
    ...data,
    build: BUILD,
    legacy_build: data.build || null,
    contract: CONTRACT_ID,
    owner: OWNER,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    schema_verification_only: true,
    r2_mutation: false,
    binary_mutation: false,
  }, response.status);
}
