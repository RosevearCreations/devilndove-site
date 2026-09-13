// Release 467 Build 150 — compatibility bridge for the retained Build 82 fulfilment page.
// Injects a stable client_action_id into the existing reviewed transition request so a lost
// response can be retried without a duplicate history write. No background replay is performed.
(() => {
  if (!window.DDAuth || typeof window.DDAuth.apiFetch !== 'function') return;
  const ROUTE = '/api/admin/contracts/operations-order-fulfillment-workflow-write';
  const KEY = 'dd_admin_ofw_b150_action_ids_v1';
  const original = window.DDAuth.apiFetch.bind(window.DDAuth);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
  const write = (value) => { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {} };
  const newId = (orderId, status) => { const a = new Uint32Array(2); crypto.getRandomValues(a); return `b150:legacy:${orderId}:${status}:${Date.now().toString(36)}:${Array.from(a).map((n) => n.toString(36)).join('')}`; };
  const stableId = (orderId, status) => { const map = read(), key = `${orderId}:${status}`; if (!map[key]) { map[key] = newId(orderId, status); write(map); } return map[key]; };
  const clear = (orderId, status) => { const map = read(), key = `${orderId}:${status}`; delete map[key]; write(map); };

  window.DDAuth.apiFetch = async function build150FulfilmentReplayBridge(input, init = {}) {
    const url = typeof input === 'string' ? input : String(input?.url || input || '');
    const method = String(init?.method || 'GET').toUpperCase();
    if (!url.includes(ROUTE) || method !== 'POST') return original(input, init);
    let body;
    try { body = JSON.parse(String(init.body || '{}')); } catch { return original(input, init); }
    const orderId = Number(body.order_id || 0), status = String(body.new_status || '').trim().toLowerCase();
    if (!orderId || !status) return original(input, init);
    body.client_action_id = body.client_action_id || stableId(orderId, status);
    try {
      const response = await original(input, { ...init, body: JSON.stringify(body) });
      if (response.ok || (response.status < 500 && ![408, 429].includes(response.status))) clear(orderId, status);
      return response;
    } catch (error) {
      // Preserve the stable ID when transport outcome is uncertain. A later explicit click reuses it.
      throw error;
    }
  };
})();
