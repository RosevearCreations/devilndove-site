// Devil n Dove Build 391 Operations-owned fulfillment transition authority.
// Build 408 routes the Orders consumer through this narrow fulfilled-only boundary.

import { onRequestPost as implementationPost } from '../update-order-status.js';

export const BUILD = 391;
export const IMPLEMENTATION_BUILD = 408;
export const CONTRACT_ID = 'operations-order-fulfillment-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/update-order-status';

export const metadata = Object.freeze({
  build: BUILD,
  implementationBuild: IMPLEMENTATION_BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  transition: 'fulfilled',
  implementationRoute: IMPLEMENTATION_ROUTE,
  providerBehaviorChanged: false,
  requestTimeSchemaMutation: false,
  mutationConsumerMoved: true,
});

export async function onRequestPost(context) {
  let input = {};
  try { input = await context.request.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const orderId = Number(input.order_id || 0);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return new Response(JSON.stringify({ ok: false, error: 'A valid order_id is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const request = new Request(context.request.url, {
    method: 'POST',
    headers: context.request.headers,
    body: JSON.stringify({ order_id: orderId, new_status: 'fulfilled', note: String(input.note || '').slice(0, 1200) }),
  });
  return implementationPost({ ...context, request });
}
