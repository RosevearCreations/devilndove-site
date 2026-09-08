import assert from 'node:assert/strict';

await import('../public/js/checkout-reliability-core.js');
const core = globalThis.DDCheckoutReliabilityCore;
assert.ok(core, 'Build 78 checkout reliability core is exposed');
assert.equal(core.VERSION, 'R467B78_V1');

const normalized = core.normalizeCartItems([
  { product_id: 7, quantity: 2, price_cents: 1000, currency: 'cad', requires_shipping: 1, name: 'Ring' },
  { product_id: 7, quantity: 1, price_cents: 1000, currency: 'CAD', requires_shipping: 1, name: 'Ring' },
  { product_id: 0, quantity: 9 },
  { product_id: 8, quantity: 500, price_cents: 250, requires_shipping: 0, name: 'Download' },
]);
assert.equal(normalized.length, 2, 'invalid cart rows are removed');
assert.equal(normalized.find((row) => row.product_id === 7)?.quantity, 3, 'duplicate Product rows are merged deterministically');
assert.equal(normalized.find((row) => row.product_id === 8)?.quantity, 99, 'cart quantity is bounded');
assert.equal(normalized[0].currency, 'CAD', 'cart currency normalizes to CAD casing');

const signatureA = core.cartSignature(normalized, null);
const signatureB = core.cartSignature([...normalized].reverse(), null);
assert.equal(signatureA, signatureB, 'cart signature is stable regardless of row order');
assert.notEqual(signatureA, core.cartSignature([{ ...normalized[0], quantity: 4 }, normalized[1]], null), 'cart quantity changes invalidate the checkout attempt signature');

assert.equal(core.normalizeFulfillmentChoice('shipping', normalized), 'shipping', 'physical cart supports Canadian shipping');
assert.equal(core.normalizeFulfillmentChoice('pickup', normalized), 'pickup', 'physical cart supports explicit local pickup');
assert.equal(core.shippingCents(normalized, 'shipping'), 1500, 'shipping estimate stays the carried flat CAD 15 amount');
assert.equal(core.shippingCents(normalized, 'pickup'), 0, 'pickup never adds a shipping charge');
assert.equal(core.normalizeFulfillmentChoice('shipping', [{ product_id: 9, quantity: 1, requires_shipping: 0 }]), 'digital', 'digital-only cart bypasses fulfilment shipping');
assert.equal(core.shippingCents([{ product_id: 9, quantity: 1, requires_shipping: 0 }], 'shipping'), 0, 'digital-only cart has no shipping charge');
assert.equal(core.taxEstimateCents(10000, 0, 1500), 1495, 'browser tax estimate mirrors the carried 13 percent server estimate');

console.log('RELEASE 467 BUILD 78 CHECKOUT RELIABILITY RUNTIME: PASS');
console.log('Cart normalization / persistence contract: BOUNDED + DETERMINISTIC');
console.log('Checkout attempt signature: STABLE / CART-SENSITIVE');
console.log('Shipping / pickup / digital fulfilment: EXPLICIT');
console.log('Browser totals: ESTIMATE ONLY / SERVER REVALIDATES');
console.log('Provider execution: NONE');
