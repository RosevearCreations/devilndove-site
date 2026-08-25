// Devil n Dove Build 394 Operations-owned Membership assignment mutation authority.
// Delegates assign/remove writes to the mature compatibility implementations.

import { onRequestPost as assignPost } from '../assign-user-access-tier.js';
import { onRequestPost as removePost } from '../remove-user-access-tier.js';

export const BUILD = 394;
export const CONTRACT_ID = 'operations-membership-assignment-write';
export const OWNER = 'operations';
export const ASSIGN_IMPLEMENTATION = '/api/admin/assign-user-access-tier';
export const REMOVE_IMPLEMENTATION = '/api/admin/remove-user-access-tier';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  actions: Object.freeze(['assign', 'remove']),
  assignImplementation: ASSIGN_IMPLEMENTATION,
  removeImplementation: REMOVE_IMPLEMENTATION,
  consumerMoved: true,
  requestTimeSchemaMutation: false,
  providerBehaviorChanged: false,
});

export async function onRequestPost(context) {
  let body = {};
  try {
    body = await context.request.clone().json();
  } catch {
    return new Response(JSON.stringify({ ok: false, build: BUILD, error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const action = String(body?.action || '').trim().toLowerCase();
  if (action === 'assign') return assignPost(context);
  if (action === 'remove') return removePost(context);

  return new Response(JSON.stringify({
    ok: false,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    error: 'action must be assign or remove.',
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
