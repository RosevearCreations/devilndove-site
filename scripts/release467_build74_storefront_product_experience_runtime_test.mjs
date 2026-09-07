import assert from 'node:assert/strict';

await import('../public/js/storefront-product-experience.js');
const api = globalThis.DDStorefrontProductExperience;
assert.ok(api, 'Build 74 storefront Product experience authority was not exported');

const checks = [];
function check(label, fn) {
  fn();
  checks.push(label);
  console.log(`${String(checks.length).padStart(2, '0')}. PASS — ${label}`);
}

check('Build 74 public authority identity is stable', () => {
  assert.equal(api.BUILD, 74);
  assert.equal(api.CONTRACT, 'buyer-first-product-detail');
});

check('positive listed inventory becomes buyer-facing availability', () => {
  const result = api.availabilityFromFields({ inventory: '5 available', productType: 'physical' });
  assert.equal(result.status, 'in_stock');
  assert.equal(result.label, 'Available');
});

check('zero listed inventory fails closed to out-of-stock', () => {
  const result = api.availabilityFromFields({ inventory: '0 available', productType: 'physical' });
  assert.equal(result.status, 'out_of_stock');
});

check('explicit sold-out text fails closed to out-of-stock', () => {
  const result = api.availabilityFromFields({ inventory: 'Sold out', productType: 'physical' });
  assert.equal(result.status, 'out_of_stock');
});

check('digital items do not pretend physical shipping or stock is required', () => {
  const availability = api.availabilityFromFields({ inventory: '', productType: 'digital' });
  const shipping = api.shippingFromFields({ shipping: 'No', productType: 'digital' });
  assert.equal(availability.status, 'digital');
  assert.equal(shipping.label, 'Digital delivery');
});

check('unknown inventory does not invent a stock promise', () => {
  const result = api.availabilityFromFields({ inventory: 'Inventory tracked', productType: 'physical' });
  assert.equal(result.status, 'check');
  assert.match(result.detail, /confirmed again/i);
});

check('buyer essentials caps attributes and trust points for scannability', () => {
  const snapshot = api.buildBuyerEssentialsSnapshot({
    name: 'Test Piece',
    price: '$42.00',
    inventory: '2 available',
    shipping: 'Yes',
    productType: 'physical',
    photoCount: 7,
    relatedCount: 3,
    attributes: ['A','B','C','D','E','F','G','A'],
    trustPoints: ['One','Two','Three','Four','Five','One'],
  });
  assert.equal(snapshot.attributes.length, 6);
  assert.equal(snapshot.trust_points.length, 4);
  assert.equal(snapshot.photo_count, 7);
  assert.equal(snapshot.related_count, 3);
});

check('buyer essentials performs no automatic commerce or publication action', () => {
  const snapshot = api.buildBuyerEssentialsSnapshot({ name: 'Test Piece' });
  assert.equal(snapshot.no_extra_network_request, true);
  assert.equal(snapshot.automatic_purchase, false);
  assert.equal(snapshot.automatic_publication, false);
});

console.log(`BUILD 74 STOREFRONT PRODUCT EXPERIENCE RUNTIME: PASS (${checks.length} checks)`);
