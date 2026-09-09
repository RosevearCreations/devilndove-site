// Release 467 Build 80 preparation-only PayPal sandbox contract.
// Pure helpers: no provider call, credential read, D1/R2 mutation, or execution switch change.

export const PAYPAL_SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';
export const PAYPAL_REQUEST_ID_MAX_LENGTH = 108;

function text(value) {
  return String(value ?? '').trim();
}

function boundedToken(value, fallback) {
  const token = text(value).replace(/[^A-Za-z0-9_-]/g, '');
  return (token || fallback).slice(0, PAYPAL_REQUEST_ID_MAX_LENGTH);
}

function requestId(prefix, parts) {
  return boundedToken(`${prefix}-${parts.map((part) => boundedToken(part, 'unknown')).join('-')}`, `${prefix}-missing`);
}

export function paypalOrderRequestId(paymentId, orderId) {
  return requestId('dnd-order', [paymentId, orderId]);
}

export function paypalRefundRequestId(refundIdentity) {
  return requestId('dnd-refund', [refundIdentity]);
}

export function paypalJsonHeaders(accessToken, idempotencyKey, { representation = false } = {}) {
  const headers = {
    Authorization: `Bearer ${text(accessToken)}`,
    'Content-Type': 'application/json',
    'PayPal-Request-Id': boundedToken(idempotencyKey, 'dnd-missing-idempotency'),
  };
  if (representation) headers.Prefer = 'return=representation';
  return headers;
}

export function paypalPreparationBoundary() {
  return {
    build: 80,
    mode: 'preparation_only',
    environment: 'sandbox',
    base_url: PAYPAL_SANDBOX_BASE_URL,
    remote_provider_execution: false,
    credentials_changed: false,
    real_acceptance_complete: false,
    required_external_dimensions: [
      'credentials',
      'approval-capture',
      'webhook-verification',
      'refund',
      'reconciliation',
      'idempotent-replay',
    ],
  };
}
