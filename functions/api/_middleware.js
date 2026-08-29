import { paymentExecutionBoundary, paymentExecutionStatus } from './_lib/paymentExecution.js';

// Devil n Dove Release 460 — API safety middleware.
// Keeps carried Product/Inventory conflict mapping and closes remote payment execution unless
// an explicit Development-only sandbox/test operator switch is deliberately opened.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function errorText(error) {
  return String(error?.message || error || '');
}

function normalizePaymentProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  return ['paypal', 'stripe', 'square', 'manual', 'other'].includes(provider) ? provider : '';
}

async function guardPaymentProviderExecution(context) {
  const request = context.request;
  let url;
  try { url = new URL(request.url); } catch { return null; }
  if (request.method !== 'POST' || url.pathname !== '/api/checkout-prepare-payment') return null;

  let body = {};
  try { body = await request.clone().json(); } catch { return null; }
  const provider = normalizePaymentProvider(body?.provider || body?.payment_method || 'paypal') || 'paypal';
  if (!['paypal', 'stripe'].includes(provider)) return null;

  const status = paymentExecutionStatus(request.url, context.env || {}, provider);
  if (status.execution_authorized) return null;

  return json({
    ok: false,
    code: status.code,
    error: 'Remote payment-provider execution is closed. Development test/sandbox execution requires an explicit operator switch and test-only provider credentials.',
    provider,
    payment_execution: {
      configured: status.configured,
      test_mode: status.test_mode,
      environment: status.environment,
      live_credential_detected: status.live_credential_detected,
      development_host: status.development_host,
      operator_switch_set: status.operator_switch_set,
      execution_authorized: false,
    },
    boundary: paymentExecutionBoundary(context.env || {}),
    local_payment_mutation_performed: false,
    provider_network_call_performed: false,
  }, 423);
}

export async function onRequest(context) {
  const paymentGuard = await guardPaymentProviderExecution(context);
  if (paymentGuard) return paymentGuard;

  try {
    return await context.next();
  } catch (error) {
    const raw = errorText(error);
    if (raw.includes('build440_finished_inventory_commitment_exceeds_available')) {
      return json({
        ok: false,
        build: 440,
        code: 'finished_inventory_commitment_conflict',
        error: 'Available finished inventory changed while this request was being committed. The incomplete order was cancelled safely; refresh availability and try again.',
        retry_safe_after_refresh: true,
      }, 409);
    }
    if (raw.includes('build440_finished_inventory_below_active_commitments')) {
      return json({
        ok: false,
        build: 440,
        code: 'finished_inventory_below_active_commitments',
        error: 'Finished inventory cannot be reduced below quantities already committed to active orders. Release or resolve the downstream commitments first.',
        retry_safe_after_refresh: false,
      }, 409);
    }
    throw error;
  }
}
