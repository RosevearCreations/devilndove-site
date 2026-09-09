import assert from 'node:assert/strict';
import {
  STRIPE_API_VERSION,
  stripeCheckoutIdempotencyKey,
  stripeIntegrationIdentifier,
  stripePreparationBoundary,
  stripeRefundIdempotencyKey,
  stripeRequestHeaders,
} from '../functions/api/_lib/stripeDevelopment.js';

assert.equal(STRIPE_API_VERSION, '2026-07-29.dahlia');

const checkoutKey = stripeCheckoutIdempotencyKey(42, 81);
assert.equal(checkoutKey, 'dnd-checkout-42-81');
assert.equal(stripeCheckoutIdempotencyKey(42, 81), checkoutKey, 'checkout retries retain one key');
assert.notEqual(stripeCheckoutIdempotencyKey(43, 81), checkoutKey, 'another payment gets another key');

const refundKey = stripeRefundIdempotencyKey('refund:42/attempt');
assert.equal(refundKey, 'dnd-refund-refund42attempt');
assert.equal(stripeRefundIdempotencyKey('refund:42/attempt'), refundKey, 'refund replay retains one key');

const headers = stripeRequestHeaders('rk_test_not-a-real-key', checkoutKey);
assert.equal(headers['Stripe-Version'], STRIPE_API_VERSION);
assert.equal(headers['Idempotency-Key'], checkoutKey);
assert.equal(headers['Content-Type'], 'application/x-www-form-urlencoded');

const identifier = await stripeIntegrationIdentifier('42:81');
assert.match(identifier, /^devilndove_checkout_[a-z]{8}$/);
assert.equal(await stripeIntegrationIdentifier('42:81'), identifier, 'retry keeps the same integration identifier');

const boundary = stripePreparationBoundary();
assert.equal(boundary.mode, 'preparation_only');
assert.equal(boundary.remote_provider_execution, false);
assert.equal(boundary.credentials_changed, false);
assert.equal(boundary.real_acceptance_complete, false);
assert.deepEqual(boundary.required_external_dimensions, [
  'credentials', 'checkout', 'webhook-signature', 'refund', 'reconciliation', 'idempotent-replay',
]);

console.log('RELEASE 467 BUILD 79 STRIPE PREPARATION RUNTIME: PASS');
console.log('Stripe API version: PINNED');
console.log('Checkout/refund retries: IDEMPOTENCY-KEYED');
console.log('Integration identifier: STABLE + BUILD-SCOPED');
console.log('Provider execution: NONE');
console.log('External acceptance: HOLD / 0 OF 6 CLAIMED');
