#!/usr/bin/env node
// Build 156 deterministic missed-auth-event fallback proof.
// No network, D1, R2, provider, or mutation work is performed.
import assert from 'node:assert/strict';

const listeners = new Map();
let productRefreshClicks = 0;
let cleanupRefreshClicks = 0;
const adminUser = { role: 'admin', user_id: 1 };

const productRefresh = { disabled: false, click() { productRefreshClicks += 1; } };
const cleanupRefresh = { disabled: false, click() { cleanupRefreshClicks += 1; } };
const picker = { options: { length: 1 } };

globalThis.window = {
  location: { pathname: '/admin/products/' },
  DDAuthUiState: { phase: 'provisional', verified: false, user: adminUser },
  DDAuth: { isLoggedIn: () => true, getStoredUser: () => adminUser },
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

await import('../public/js/admin-products-auth-ready-recovery-v156.js');
assert.equal(window.DDProductsAuthReadyRecoveryHealth?.version, 'R467B156_AUTH_READY_RECOVERY_V2');
assert.equal(productRefreshClicks, 0);
assert.equal(cleanupRefreshClicks, 0);

await new Promise((resolve) => setTimeout(resolve, 1650));

assert.equal(window.DDProductsAuthReadyRecoveryHealth.fallback_timer_fired, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.fallback_logged_in, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.recovery_attempted, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.last_reason, 'bounded-post-dom-fallback');
assert.equal(productRefreshClicks, 1, 'Missed auth event must still receive one Product refresh');
assert.equal(cleanupRefreshClicks, 1, 'Missed auth event must still receive one cleanup refresh');

await new Promise((resolve) => setTimeout(resolve, 250));
assert.equal(productRefreshClicks, 1, 'Bounded fallback must remain one-shot');
assert.equal(cleanupRefreshClicks, 1, 'Bounded cleanup fallback must remain one-shot');

console.log('BUILD 156 PRODUCT AUTH FALLBACK: PASS');
console.log('Missed verified-auth event: recovered after one bounded 1500ms check');
console.log('Product refresh: exactly one');
console.log('Cleanup refresh: exactly one');
