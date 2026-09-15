#!/usr/bin/env node
// Build 156 deterministic Product request-budget scheduler proof.
// No network, D1, R2, provider, or mutation work is performed.
import assert from 'node:assert/strict';

const starts = [];
const releases = new Map();
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

function rawApiFetch(input, options = {}) {
  const key = String(input || '');
  starts.push(key);
  return new Promise((resolve, reject) => {
    const release = () => resolve(new Response(JSON.stringify({ ok: true, key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    releases.set(key, release);
    if (options?.signal?.addEventListener) {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    }
  });
}

globalThis.window = {
  location: { pathname: '/admin/products/', origin: 'https://example.test' },
  DDAuth: { apiFetch: rawApiFetch },
};
globalThis.document = { addEventListener() {} };

await import('../public/js/admin-products-request-budget-v156.js');
assert.equal(window.DDProductsRequestBudgetHealth?.version, 'R467B156_REQUEST_BUDGET_V2');

const lowOne = window.DDAuth.apiFetch('/api/admin/slow-background-a');
await nextTurn();
assert.deepEqual(starts, ['/api/admin/slow-background-a'], 'first background read should start');

const lowTwo = window.DDAuth.apiFetch('/api/admin/slow-background-b');
await nextTurn();
assert.deepEqual(starts, ['/api/admin/slow-background-a'], 'second background read must remain queued to preserve the Product lane');
assert.equal(window.DDProductsRequestBudgetHealth.active_noncore_gets, 1);
assert.equal(window.DDProductsRequestBudgetHealth.queued_gets, 1);

const core = window.DDAuth.apiFetch('/api/admin/products');
await nextTurn();
assert.deepEqual(starts, ['/api/admin/slow-background-a', '/api/admin/products'], 'core Product read must take the reserved second lane');
assert.equal(window.DDProductsRequestBudgetHealth.active_gets, 2);
assert.equal(window.DDProductsRequestBudgetHealth.active_core_gets, 1);
assert.equal(window.DDProductsRequestBudgetHealth.active_noncore_gets, 1);
assert.equal(window.DDProductsRequestBudgetHealth.peak_active_gets, 2);
assert.equal(window.DDProductsRequestBudgetHealth.peak_noncore_gets, 1);

releases.get('/api/admin/products')();
await core;
await nextTurn();
assert.deepEqual(starts, ['/api/admin/slow-background-a', '/api/admin/products'], 'second background read must still wait while one background read is active');

releases.get('/api/admin/slow-background-a')();
await lowOne;
await nextTurn();
assert.deepEqual(starts, ['/api/admin/slow-background-a', '/api/admin/products', '/api/admin/slow-background-b'], 'queued background read should resume after the first background read completes');

releases.get('/api/admin/slow-background-b')();
await lowTwo;
await nextTurn();
assert.equal(window.DDProductsRequestBudgetHealth.active_gets, 0);
assert.equal(window.DDProductsRequestBudgetHealth.active_noncore_gets, 0);
assert.equal(window.DDProductsRequestBudgetHealth.completed_gets, 3);
assert.equal(window.DDProductsRequestBudgetHealth.failed_gets, 0);

console.log('BUILD 156 PRODUCT REQUEST BUDGET SCHEDULER: PASS');
console.log('Concurrent GET ceiling: 2');
console.log('Non-core GET ceiling: 1');
console.log('Core Product bootstrap lane: RESERVED AND PROVEN');
