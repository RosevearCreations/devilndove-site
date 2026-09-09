// Release 467 Build 79 preparation-only Stripe contract.
// Pure helpers: no provider call, credential read, D1/R2 mutation, or execution switch change.

export const STRIPE_API_VERSION = '2026-07-29.dahlia';
export const STRIPE_INTEGRATION_PREFIX = 'devilndove_checkout';

function text(value) {
  return String(value ?? '').trim();
}

function boundedToken(value, fallback) {
  const token = text(value).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
  return token || fallback;
}

export function stripeCheckoutIdempotencyKey(paymentId, orderId) {
  return `dnd-checkout-${boundedToken(paymentId, 'pending')}-${boundedToken(orderId, 'unknown')}`;
}

export function stripeRefundIdempotencyKey(requestId) {
  return `dnd-refund-${boundedToken(requestId, 'missing')}`;
}

export function stripeRequestHeaders(secretKey, idempotencyKey) {
  return {
    Authorization: `Bearer ${text(secretKey)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Idempotency-Key': boundedToken(idempotencyKey, 'dnd-missing-idempotency'),
    'Stripe-Version': STRIPE_API_VERSION,
  };
}

export async function stripeIntegrationIdentifier(seedValue) {
  const bytes = new TextEncoder().encode(text(seedValue) || 'devilndove');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const suffix = Array.from(digest.slice(0, 8), (byte) => String.fromCharCode(97 + (byte % 26))).join('');
  return `${STRIPE_INTEGRATION_PREFIX}_${suffix}`;
}

export function stripePreparationBoundary() {
  return {
    build: 79,
    mode: 'preparation_only',
    api_version: STRIPE_API_VERSION,
    remote_provider_execution: false,
    credentials_changed: false,
    real_acceptance_complete: false,
    required_external_dimensions: [
      'credentials',
      'checkout',
      'webhook-signature',
      'refund',
      'reconciliation',
      'idempotent-replay',
    ],
  };
}
