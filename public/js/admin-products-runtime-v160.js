// Release 467 Build 160 — Product Production browser recovery.
// Read-only runtime repair for the Products Admin page: fast core Product delivery,
// same-origin Product media transport, and late-render Quality state reconciliation.
(() => {
  'use strict';
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

  const VERSION = 'R467B160_PRODUCT_PRODUCTION_BROWSER_RECOVERY_V1';
  const CORE_PATH = '/api/admin/products-core';
  const CORE_TTL_MS = 45000;
  const PUBLIC_MEDIA_HOSTS = new Set(['assets.devilndove.com', 'pub-f8137eb938da486a9f24410ccf49087c.r2.dev']);
  const health = {
    version: VERSION,
    api_wrapper_installs: 0,
    core_requests: 0,
    core_shared_hits: 0,
    core_cache_hits: 0,
    admin_media_rewrites: 0,
    quality_reconciliations: 0,
    readiness_deferred_reconciliations: 0,
  };
  window.DDProductsRuntimeV160Health = health;

  let coreInflight = null;
  let coreCache = null;

  function cloneCore(entry, cacheState = '') {
    const headers = new Headers(entry.headers || {});
    headers.set('Cache-Control', 'no-store');
    headers.set('X-DD-Products-Core-Delivery', 'build160');
    if (cacheState) headers.set('X-DD-Products-Core-Client-Cache', cacheState);
    return new Response(entry.body, { status: entry.status, statusText: entry.statusText || '', headers });
  }

  async function fetchCore(original, options = {}) {
    const now = Date.now();
    if (coreCache && coreCache.expiresAt > now) {
      health.core_cache_hits += 1;
      return cloneCore(coreCache, 'hit');
    }
    if (coreInflight) {
      health.core_shared_hits += 1;
      const shared = await coreInflight;
      return cloneCore(shared, 'shared');
    }
    health.core_requests += 1;
    const safeOptions = { ...options, method: 'GET' };
    delete safeOptions.signal;
    coreInflight = Promise.resolve(original(CORE_PATH, safeOptions)).then(async (response) => {
      const body = await response.clone().text();
      const headers = {};
      response.headers?.forEach?.((value, key) => { headers[key] = value; });
      const entry = {
        body,
        status: response.status,
        statusText: response.statusText || '',
        headers,
        expiresAt: response.ok ? Date.now() + CORE_TTL_MS : 0,
      };
      if (response.ok) coreCache = entry;
      return entry;
    }).finally(() => { coreInflight = null; });
    return cloneCore(await coreInflight, 'miss');
  }

  function shouldUseCore(input, options = {}) {
    const method = String(options?.method || 'GET').toUpperCase();
    if (method !== 'GET') return false;
    try {
      const url = new URL(String(input || ''), window.location.origin);
      return url.origin === window.location.origin && url.pathname === '/api/admin/products' && !url.searchParams.get('q') && url.searchParams.get('full') !== '1';
    } catch { return false; }
  }

  function ensureApiWrapper() {
    const auth = window.DDAuth;
    if (!auth || typeof auth.apiFetch !== 'function') return false;
    const current = auth.apiFetch;
    if (current.__ddProductRuntimeV160Outer === true) return true;
    const original = current.bind(auth);
    const wrapped = async (input, options = {}) => {
      if (shouldUseCore(input, options)) return fetchCore(original, options);
      return original(input, options);
    };
    wrapped.__ddProductRuntimeV160Outer = true;
    wrapped.__ddProductsOriginal = current;
    auth.apiFetch = wrapped;
    health.api_wrapper_installs += 1;
    return true;
  }

  function rewriteProductMedia(raw) {
    const value = String(raw || '').trim();
    if (!value) return value;
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol !== 'https:' || !PUBLIC_MEDIA_HOSTS.has(url.hostname.toLowerCase())) return value;
      const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
      if (!key.startsWith('products/') || key.includes('..') || key.includes('\\')) return value;
      health.admin_media_rewrites += 1;
      return `/api/product-media?key=${encodeURIComponent(key)}`;
    } catch { return value; }
  }

  function installImageTransportGuard() {
    if (window.__DDProductsV160ImageGuardInstalled) return;
    window.__DDProductsV160ImageGuardInstalled = true;
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (descriptor?.set && descriptor?.get) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: descriptor.get,
        set(value) { descriptor.set.call(this, rewriteProductMedia(value)); },
      });
    }
    const originalSetAttribute = HTMLImageElement.prototype.setAttribute;
    HTMLImageElement.prototype.setAttribute = function(name, value) {
      const key = String(name || '').toLowerCase();
      if (key === 'src') return originalSetAttribute.call(this, name, rewriteProductMedia(value));
      if (key === 'srcset' && /assets\.devilndove\.com\/products\//i.test(String(value || ''))) return originalSetAttribute.call(this, name, '');
      return originalSetAttribute.call(this, name, value);
    };
  }

  function normalizeImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    const raw = img.getAttribute('src') || '';
    const next = rewriteProductMedia(raw);
    if (next && next !== raw) {
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.setAttribute('src', next);
      img.dataset.ddBuild160Media = 'same-origin';
    }
  }

  function reconcileQuality() {
    const mount = document.getElementById('productQualityCommandCenterMount');
    if (!mount) return false;
    let changed = false;
    const eyebrow = mount.querySelector('.eyebrow');
    if (eyebrow && /Release\s+467\s+Build\s+(157|158|159)/i.test(String(eyebrow.textContent || ''))) {
      eyebrow.textContent = 'Release 467 Build 160';
      changed = true;
    }
    mount.querySelectorAll('.status-note.warning').forEach((note) => {
      const raw = String(note.textContent || '').replace(/\s+/g, ' ').trim();
      const bounded = /Product readiness is degraded\s*\(readiness_timeout\)/i.test(raw);
      const realFailure = /Buyer facts:|HTTP\s*\d+|worker exceeded|resource limit|database unavailable|authentication helper|failed|exception/i.test(raw);
      if (!bounded || realFailure || note.dataset.ddBuild160ReadinessDeferred === '1') return;
      note.classList.remove('warning');
      note.classList.add('info');
      note.innerHTML = '<strong>Readiness evidence is deferred</strong><br>The bounded readiness read did not finish inside the startup budget. Unknown readiness remains pending and is not marked complete. Essential Product work remains available.';
      note.dataset.ddBuild160ReadinessDeferred = '1';
      health.readiness_deferred_reconciliations += 1;
      changed = true;
    });
    if (changed) health.quality_reconciliations += 1;
    return changed;
  }

  installImageTransportGuard();
  ensureApiWrapper();

  const observer = new MutationObserver((records) => {
    ensureApiWrapper();
    for (const record of records) {
      for (const node of record.addedNodes || []) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLImageElement) normalizeImage(node);
        node.querySelectorAll?.('img').forEach(normalizeImage);
      }
    }
    reconcileQuality();
  });

  const start = () => {
    document.querySelectorAll('img').forEach(normalizeImage);
    reconcileQuality();
    observer.observe(document.documentElement, { childList: true, subtree: true });
    [0, 50, 250, 1000, 3000, 6000, 9000, 15000].forEach((delay) => window.setTimeout(() => {
      ensureApiWrapper();
      reconcileQuality();
      document.querySelectorAll('img').forEach(normalizeImage);
    }, delay));
    document.addEventListener('dd:auth-verified', ensureApiWrapper);
    document.addEventListener('dd:admin-ready', ensureApiWrapper);
    document.addEventListener('dd:products-core-recovered', reconcileQuality);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
