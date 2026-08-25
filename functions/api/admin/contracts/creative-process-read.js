// Devil n Dove Build 352 — Creative Process read contract.
// The retained Creative Process GET is already non-mutating; this contract formalizes
// Creative ownership without moving any POST/action authority.

import { onRequestGet as legacyGet } from '../creative-process.js';

export const BUILD = 352;
export const CONTRACT_ID = 'creative-process-read';
export const OWNER = 'creative';

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
      error: 'Creative Process read returned a non-JSON response.',
    }, response.status || 500);
  }

  return json({
    ...data,
    build: BUILD,
    legacy_build: Number(data.build || 0) || null,
    contract: CONTRACT_ID,
    owner: OWNER,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    inventory_post_authority: data.inventory_post_authority || 'inventory-post',
    inventory_reversal_authority: data.inventory_reversal_authority || 'inventory-reverse',
  }, response.status);
}
