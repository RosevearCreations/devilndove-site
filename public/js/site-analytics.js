// Build 279 — lightweight public analytics with admin exclusion, page-view throttling, and bounded exit tracking.
(function () {
  const VISITOR_KEY = 'dd_visitor_token';
  const SESSION_KEY = 'dd_browser_session_token';
  const CART_KEY = 'dd_cart';
  const PAGE_VIEW_WINDOW_MS = 15 * 60 * 1000;
  const path = String(window.location.pathname || '/');
  const isAdmin = path === '/admin' || path.startsWith('/admin/');

  function uuid() { try { return crypto.randomUUID(); } catch { try { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''); } catch { return `visitor-${Date.now()}`; } } }
  function getVisitorToken() { try { let token = localStorage.getItem(VISITOR_KEY); if (!token) { token = uuid(); localStorage.setItem(VISITOR_KEY, token); } return token; } catch { return uuid(); } }
  function getBrowserSessionToken() { try { let token = sessionStorage.getItem(SESSION_KEY); if (!token) { token = uuid(); sessionStorage.setItem(SESSION_KEY, token); } return token; } catch { return uuid(); } }
  function safeCartSummary() { try { const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); const items = Array.isArray(parsed) ? parsed : []; return { cart_count: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), cart_value_cents: items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price_cents || 0)), 0) }; } catch { return { cart_count: 0, cart_value_cents: 0 }; } }
  function firstH1() { const el = document.querySelector('h1'); return el ? String(el.textContent || '').trim().slice(0, 320) : ''; }
  function shouldTrackPageView() {
    if (isAdmin) return false;
    const key = `dd_page_view_v279:${path}`;
    try {
      const now = Date.now();
      const last = Number(sessionStorage.getItem(key) || 0);
      if (last && now - last < PAGE_VIEW_WINDOW_MS) return false;
      sessionStorage.setItem(key, String(now));
    } catch {}
    return true;
  }
  async function post(url, body) {
    if (isAdmin) return { ok: true, skipped: true };
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        keepalive: true,
        body: JSON.stringify(body)
      });
    } catch {}
    return { ok: true };
  }

  const visitor_token = getVisitorToken();
  const browser_session_token = getBrowserSessionToken();
  const query_string = window.location.search || '';

  window.DDAnalytics = {
    visitor_token,
    browser_session_token,
    trackVisit(event_type = 'page_view', meta = null) {
      return post('/api/track/visit', {
        visitor_token, browser_session_token, path, query_string,
        referrer: document.referrer || '', page_title: document.title || '', page_h1: firstH1(),
        event_type, meta
      });
    },
    trackCart(event_type, extra = {}) {
      const cart = safeCartSummary();
      return post('/api/track/cart', { visitor_token, browser_session_token, event_type, path, ...cart, ...extra });
    },
    trackSearch(search_term, result_count = 0) {
      return post('/api/track/visit', {
        visitor_token, browser_session_token, path, query_string,
        page_title: document.title || '', page_h1: firstH1(), event_type: 'search',
        meta: { search_term, result_count }
      });
    },
    trackFunnel(event_type, meta = {}) {
      return post('/api/track/visit', {
        visitor_token, browser_session_token, path, query_string,
        referrer: document.referrer || '', page_title: document.title || '', page_h1: firstH1(),
        event_type, meta
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (shouldTrackPageView()) window.DDAnalytics.trackVisit('page_view');
  });

  // Checkout state matters; ordinary cart-bearing page exits do not need a Worker invocation.
  if (!isAdmin && path.includes('/checkout/')) {
    const key = `dd_checkout_started_v279:${path}`;
    let shouldRecord = true;
    try { if (sessionStorage.getItem(key)) shouldRecord = false; else sessionStorage.setItem(key, '1'); } catch {}
    if (shouldRecord) window.DDAnalytics.trackCart('checkout_started', { meta: { source: 'checkout_page_load' } });
  }

  window.addEventListener('beforeunload', () => {
    if (isAdmin || !path.includes('/checkout/') || /\/checkout\/confirmation\//.test(path)) return;
    const cart = safeCartSummary();
    if (cart.cart_count <= 0) return;
    try {
      navigator.sendBeacon('/api/track/cart', new Blob([JSON.stringify({
        visitor_token, browser_session_token, event_type: 'cart_abandoned', path, ...cart
      })], { type: 'application/json' }));
    } catch {}
  });
})();
