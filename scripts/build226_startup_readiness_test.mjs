import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/js/admin-startup-readiness.js', import.meta.url), 'utf8');

async function renderWithResponse(response) {
  let readyHandler = null;
  const nodes = {
    startupReadinessMount: { innerHTML: '' },
    startupReadinessMessage: { hidden: true, textContent: '', className: '' }
  };
  const storage = new Map();
  const context = {
    console,
    Blob,
    FormData,
    Response,
    URL,
    setTimeout,
    clearTimeout,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value))
    },
    document: {
      addEventListener: (name, handler) => { if (name === 'DOMContentLoaded') readyHandler = handler; },
      getElementById: (name) => nodes[name] ?? null,
      querySelectorAll: () => []
    },
    DDAuth: { apiFetch: async () => response.clone() }
  };
  vm.runInNewContext(source, context, { filename: 'admin-startup-readiness.js' });
  assert.equal(typeof readyHandler, 'function');
  await readyHandler();
  return nodes;
}

for (const response of [
  new Response('<!doctype html><title>Fallback page</title>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
  Response.json({ ok: true, build: '226', expected_total: 37, items: [] }),
  Response.json({ ok: true, build: '226', expected_total: 37, items: [{ item_key: 'only_one', item_title: 'Incomplete list' }] })
]) {
  const nodes = await renderWithResponse(response);
  const cards = nodes.startupReadinessMount.innerHTML.match(/data-key=/g) ?? [];
  assert.equal(cards.length, 37, 'degraded mode must retain all 37 readiness gates');
  assert.match(nodes.startupReadinessMount.innerHTML, /Degraded mode/);
  assert.doesNotMatch(nodes.startupReadinessMount.innerHTML, /No readiness items match these filters/);
  assert.match(nodes.startupReadinessMessage.textContent, /startup service/i);
}

console.log('Build 226 Startup Readiness browser recovery: PASS');
