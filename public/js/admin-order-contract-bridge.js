// Devil n Dove Build 408 — Orders mutation transport bridge.
// Keeps the mature admin-order-detail.js UI intact while routing reviewed mutations
// through Operations-owned contracts. Non-matching requests pass through unchanged.
(() => {
  if (!window.DDAuth || typeof window.DDAuth.apiFetch !== 'function') return;
  if (window.DDOrderContractBridge?.installed) return;

  const originalApiFetch = window.DDAuth.apiFetch.bind(window.DDAuth);
  const STATUS_CONTRACT = '/api/admin/contracts/operations-order-status-write';
  const FULFILLMENT_CONTRACT = '/api/admin/contracts/operations-order-fulfillment-write';
  const PAYMENT_CONTRACT = '/api/admin/contracts/operations-payment-action-write';

  function normalizedPath(input) {
    try { return new URL(String(input), window.location.origin).pathname; }
    catch { return String(input || '').split('?')[0]; }
  }
  function methodOf(options) {
    return String(options?.method || 'GET').trim().toUpperCase();
  }
  function parseBody(options) {
    try {
      if (!options?.body) return null;
      if (typeof options.body === 'string') return JSON.parse(options.body);
    } catch {}
    return null;
  }

  async function routedApiFetch(input, options = {}) {
    const path = normalizedPath(input);
    const method = methodOf(options);

    if (method === 'POST' && path === '/api/admin/update-order-status') {
      const body = parseBody(options) || {};
      const destination = String(body.new_status || '').toLowerCase() === 'fulfilled'
        ? FULFILLMENT_CONTRACT
        : STATUS_CONTRACT;
      return originalApiFetch(destination, options);
    }

    if (method === 'POST' && path === '/api/admin/payment-actions') {
      return originalApiFetch(PAYMENT_CONTRACT, options);
    }

    return originalApiFetch(input, options);
  }

  window.DDAuth.apiFetch = routedApiFetch;
  window.DDOrderContractBridge = Object.freeze({
    build: 408,
    installed: true,
    statusContract: STATUS_CONTRACT,
    fulfillmentContract: FULFILLMENT_CONTRACT,
    paymentContract: PAYMENT_CONTRACT,
    createsNetworkTransport: false,
  });
  document.documentElement.dataset.ddOrderContractBridgeBuild = '408';
})();
