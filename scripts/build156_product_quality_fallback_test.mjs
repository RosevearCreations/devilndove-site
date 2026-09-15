#!/usr/bin/env node
// Build 156 deterministic Product Quality fail-soft proof.
// No network, D1, R2, provider, or mutation work is performed.
import assert from 'node:assert/strict';

const listeners = new Map();
const mount = {
  textContent: 'Loading Product Release Quality Command Center…',
  dataset: {},
  _html: '',
  set innerHTML(value) {
    this._html = String(value || '');
    this.textContent = this._html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  },
  get innerHTML() { return this._html; },
};

globalThis.window = {
  location: { pathname: '/admin/products/' },
  setTimeout,
  DDProductQualityFallbackHealth: null,
};
globalThis.document = {
  readyState: 'complete',
  addEventListener(type, fn) {
    const rows = listeners.get(type) || [];
    rows.push(fn);
    listeners.set(type, rows);
  },
  getElementById(id) {
    return id === 'productQualityCommandCenterMount' ? mount : null;
  },
  querySelectorAll(selector) {
    if (selector === '#productsTableBody [data-edit-product-id]') return [{}, {}];
    return [];
  },
};

await import('../public/js/admin-product-quality-fallback-v156.js');
assert.equal(window.DDProductQualityFallbackHealth?.version, 'R467B156_QUALITY_FALLBACK_V1');
for (const fn of listeners.get('dd:products-core-recovered') || []) {
  fn({ detail: {
    source: 'live core recovery',
    products: [
      { product_id: 1, status: 'active' },
      { product_id: 2, status: 'draft' },
      { product_id: 3, status: 'archived' },
    ],
  } });
}
assert.equal(window.DDProductQualityFallbackHealth.core_event_seen, true);
assert.equal(window.DDProductQualityFallbackHealth.fallback_rendered, true);
assert.equal(window.DDProductQualityFallbackHealth.product_count, 3);
assert.equal(mount.dataset.ddQualityFallback, 'R467B156_QUALITY_FALLBACK_V1');
assert.ok(mount.textContent.includes('Product Release Quality Command Center'));
assert.ok(mount.textContent.includes('Essential Product work is available.'));
assert.ok(!/Loading Product Release Quality Command Center/i.test(mount.textContent));
assert.ok(mount.textContent.includes('No quality result is invented or marked complete here.'));
console.log('BUILD 156 PRODUCT QUALITY FALLBACK: PASS');
console.log('Core Product event: renders truthful fail-soft quality summary');
console.log('Secondary quality evidence: cannot block essential Product work');
console.log('Network/mutation work: NONE');
