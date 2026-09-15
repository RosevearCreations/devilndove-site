#!/usr/bin/env node
// Build 156 deterministic missed-auth-event bounded local-auth wait proof.
// No network, D1, R2, provider, or mutation work is performed.
import assert from 'node:assert/strict';

const listeners = new Map();
let productRefreshClicks = 0;
let cleanupRefreshClicks = 0;
let loggedIn = false;

const productRefresh = { disabled: false, click() { productRefreshClicks += 1; } };
const cleanupRefresh = { disabled: false, click() { cleanupRefreshClicks += 1; } };
const picker = { options: { length: 1 } };

globalThis.window = {
  location: { pathname: '/admin/products/' },
  DDAuthUiState: { phase: 'checking', verified: false, user: null },
  DDAuth: { isLoggedIn: () => loggedIn, getStoredUser: () => null },
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
assert.equal(window.DDProductsAuthReadyRecoveryHealth?.version, 'R467B156_AUTH_READY_RECOVERY_V3');
assert.equal(productRefreshClicks, 0);
assert.equal(cleanupRefreshClicks, 0);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.auth_wait_started, true);

await new Promise((resolve) => setTimeout(resolve, 600));
assert.equal(productRefreshClicks, 0, 'Product refresh must wait until local login becomes usable');
loggedIn = true;

await new Promise((resolve) => setTimeout(resolve, 500));

assert.equal(window.DDProductsAuthReadyRecoveryHealth.auth_wait_started, true);
assert.ok(Number(window.DDProductsAuthReadyRecoveryHealth.auth_wait_checks || 0) >= 2, 'bounded auth wait must perform multiple local checks');
assert.equal(window.DDProductsAuthReadyRecoveryHealth.auth_wait_logged_in, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.auth_wait_exhausted, false);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.recovery_attempted, true);
assert.equal(window.DDProductsAuthReadyRecoveryHealth.last_reason, 'bounded-local-auth-wait');
assert.equal(productRefreshClicks, 1, 'Delayed local login must receive one Product refresh');
assert.equal(cleanupRefreshClicks, 1, 'Delayed local login must receive one cleanup refresh');

await new Promise((resolve) => setTimeout(resolve, 400));
assert.equal(productRefreshClicks, 1, 'Bounded local-auth recovery must remain one-shot');
assert.equal(cleanupRefreshClicks, 1, 'Bounded cleanup recovery must remain one-shot');

console.log('BUILD 156 PRODUCT AUTH FALLBACK: PASS');
console.log('Missed auth event: recovered when DDAuth.isLoggedIn became true inside bounded wait');
console.log('Product refresh: exactly one');
console.log('Cleanup refresh: exactly one');
