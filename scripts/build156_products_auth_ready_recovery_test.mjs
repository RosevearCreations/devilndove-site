#!/usr/bin/env node
// Build 156 deterministic verified-auth Product startup recovery proof.
// No network, D1, R2, provider, or mutation work is performed.
import assert from 'node:assert/strict';

const listeners = new Map();
let productRefreshClicks = 0;
let cleanupRefreshClicks = 0;

const productRefresh = {
  disabled: false,
  click() { productRefreshClicks += 1; },
};
const cleanupRefresh = {
  disabled: false,
  click() { cleanupRefreshClicks += 1; },
};
const picker = { options: { length: 1 } };

globalThis.window = {
  location: { pathname: '/admin/products/' },
  DDAuthUiState: { phase: 'checking', verified: false, user: null },
  DDAuth: { isLoggedIn: () => false, getStoredUser: () => null },
  setTimeout,
  clearTimeout,
};
globalThis.document = {
  readyState: 'complete',
  addEventListener(type, fn) {
    const rows = listeners.get(type) || [];
    rows.push(fn);
    listeners.set(type, rows);
  },
  querySelector(selector) {
    if (selector === '[data-refresh-products]') return productRefresh;
    return null;
  },
  querySelectorAll(selector) {
    if (selector === '#productsTableBody [data-edit-product-id]') return [];
    return [];
  },
  getElementById(id) {
    if (id === 'existingProductSelect') return picker;
    if (id === 'refreshProductCleanup') return cleanupRefresh;
    return null;
  },
};

function emit(type, detail) {
  for (const fn of listeners.get(type) || []) fn({ detail });
}

await import('../public/js/admin-products-auth-ready-recovery-v156.js');
assert.equal(window.DDProductsAuthReadyRecoveryHealth?.version, 'R467B156_AUTH_READY_RECOVERY_V2');
assert.equal(productRefreshClicks, 0, 'Product refresh must not run before verified admin readiness');
assert.equal(cleanupRefreshClicks, 0, 'Cleanup refresh must not run before verified admin readiness');

emit('dd:admin-ready', {
  ok: true,
  verified: false,
  user: { role: 'admin' },
});
await new Promise((resolve) => setTimeout(resolve, 130));
assert.equal(productRefreshClicks, 0, 'Provisional admin readiness must not trigger recovery');
assert.equal(cleanupRefreshClicks, 0, 'Provisional admin readiness must not trigger cleanup recovery');

emit('dd:admin-ready', {
  ok: true,
  verified: true,
  user: { role: 'admin' },
});
await new Promise((resolve) => setTimeout(resolve, 130));
assert.equal(productRefreshClicks, 1, 'Verified admin readiness must trigger one Product refresh');
assert.equal(cleanupRefreshClicks, 1, 'Verified admin readiness must trigger one cleanup refresh');
assert.equal(window.DDProductsAuthReadyRecoveryHealth.verified_event_seen, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.recovery_attempted, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.product_refresh_clicked, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.cleanup_refresh_clicked, true);

emit('dd:auth-verified', {
  ok: true,
  logged_in: true,
  user: { role: 'admin' },
});
await new Promise((resolve) => setTimeout(resolve, 130));
assert.equal(productRefreshClicks, 1, 'Recovery must remain one-shot after duplicate auth verification');
assert.equal(cleanupRefreshClicks, 1, 'Cleanup recovery must remain one-shot after duplicate auth verification');

console.log('BUILD 156 PRODUCT AUTH-READY RECOVERY: PASS');
console.log('Provisional admin event: ignored');
console.log('Verified admin event: one Product refresh + one cleanup refresh');
console.log('Duplicate verified event: no second recovery');
