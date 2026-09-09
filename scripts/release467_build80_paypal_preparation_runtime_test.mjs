import assert from 'node:assert/strict';
import {
  PAYPAL_REQUEST_ID_MAX_LENGTH,
  PAYPAL_SANDBOX_BASE_URL,
  paypalJsonHeaders,
  paypalOrderRequestId,
  paypalPreparationBoundary,
  paypalRefundRequestId,
} from '../functions/api/_lib/paypalDevelopment.js';

assert.equal(PAYPAL_SANDBOX_BASE_URL, 'https://api-m.sandbox.paypal.com');
assert.equal(PAYPAL_REQUEST_ID_MAX_LENGTH, 108);

const orderKey = paypalOrderRequestId(42, 81);
assert.equal(orderKey, 'dnd-order-42-81');
assert.equal(paypalOrderRequestId(42, 81), orderKey, 'order retries retain one request id');
assert.notEqual(paypalOrderRequestId(43, 81), orderKey, 'another payment gets another request id');

const refundKey = paypalRefundRequestId('refund:42/attempt');
assert.equal(refundKey, 'dnd-refund-refund42attempt');
assert.equal(paypalRefundRequestId('refund:42/attempt'), refundKey, 'refund replay retains one request id');
assert.ok(paypalRefundRequestId('x'.repeat(500)).length <= PAYPAL_REQUEST_ID_MAX_LENGTH);

const headers = paypalJsonHeaders('sandbox-token-not-real', orderKey);
assert.equal(headers['PayPal-Request-Id'], orderKey);
assert.equal(headers['Content-Type'], 'application/json');
assert.equal(headers.Prefer, undefined);

const refundHeaders = paypalJsonHeaders('sandbox-token-not-real', refundKey, { representation: true });
assert.equal(refundHeaders.Prefer, 'return=representation');

const boundary = paypalPreparationBoundary();
assert.equal(boundary.mode, 'preparation_only');
assert.equal(boundary.environment, 'sandbox');
assert.equal(boundary.remote_provider_execution, false);
assert.equal(boundary.credentials_changed, false);
assert.equal(boundary.real_acceptance_complete, false);
assert.deepEqual(boundary.required_external_dimensions, [
  'credentials', 'approval-capture', 'webhook-verification', 'refund', 'reconciliation', 'idempotent-replay',
]);

console.log('RELEASE 467 BUILD 80 PAYPAL PREPARATION RUNTIME: PASS');
console.log('Create-order/refund retries: PAYPAL-REQUEST-ID KEYED');
console.log('PayPal environment: SANDBOX ONLY');
console.log('Provider execution: NONE');
console.log('External acceptance: HOLD / 0 OF 6 CLAIMED');
