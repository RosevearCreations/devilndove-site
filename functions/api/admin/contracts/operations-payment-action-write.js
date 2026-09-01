// Devil n Dove Build 409 Operations-owned payment refund/dispute authority.
// Provider mutations are fail-closed: local-only is the default. Release 466 additionally
// requires the Development-only payment execution boundary before any provider network call.

import { onRequestPost as implementationPost } from '../payment-actions.js';

export const BUILD = 409;
export const CONTRACT_ID = 'operations-payment-action-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/payment-actions';
export const PROVIDER_ENABLE_FLAG = 'PAYMENT_PROVIDER_MUTATIONS_ENABLED';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  actions: Object.freeze(['refund', 'dispute']),
  implementationRoute: IMPLEMENTATION_ROUTE,
  providerMutationDefault: 'local-only',
  providerEnableFlag: PROVIDER_ENABLE_FLAG,
  providerConfirmationField: 'provider_sync_confirmed',
  providerSyncRequiresBothGates: true,
  release466PaymentExecutionBoundaryRequired: true,
  consumerMoved: true,
  createsNetworkTransport: false,
});

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestPost(context) {
  let body = {};
  try { body = await context.request.clone().json(); }
  catch { return json({ ok: false, build: BUILD, contract: CONTRACT_ID, error: 'Invalid JSON body.' }, 400); }

  const action = String(body.action || '').trim().toLowerCase();
  if (!['refund', 'dispute'].includes(action)) {
    return json({ ok: false, build: BUILD, contract: CONTRACT_ID, error: 'Supported actions: refund, dispute.' }, 400);
  }

  const providerEnabled = String(context.env?.[PROVIDER_ENABLE_FLAG] || '').trim() === '1';
  const providerConfirmed = body.provider_sync_confirmed === true;
  const providerRequested = Number(body.sync_provider || 0) === 1 || providerConfirmed;

  if (providerRequested && !(providerEnabled && providerConfirmed)) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      error_code: 'provider_mutation_gate_closed',
      error: 'Provider mutation is disabled. Enable the Development provider gate and explicitly confirm provider sync before retrying.',
      provider_mutation_enabled: providerEnabled,
      provider_sync_confirmed: providerConfirmed,
      provider_mutation_attempted: false,
    }, 409);
  }

  const safeBody = {
    ...body,
    sync_provider: action === 'refund' && providerEnabled && providerConfirmed ? 1 : 0,
    provider_sync_confirmed: action === 'refund' && providerEnabled && providerConfirmed,
  };

  const request = new Request(context.request.url, {
    method: 'POST',
    headers: context.request.headers,
    body: JSON.stringify(safeBody),
  });
  return implementationPost({ ...context, request });
}
