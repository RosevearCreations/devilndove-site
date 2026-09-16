// Release 467 Build 156 — Product Admin request burst limiter.
// Build 159 rotates the loader/runtime cache identity so returning browsers cannot keep the
// pre-Build-158 helper graph. Request concurrency semantics remain unchanged.
// Product Admin intentionally mounts many independent workspaces. This guard keeps those
// read-only startup lanes from issuing an unbounded burst of D1-heavy GETs at once.
(() => {
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

  const VERSION = 'R467B159_REQUEST_BUDGET_V3';
  const MAX_CONCURRENT_GETS = 2;
  // Keep one of the two lanes available for the Product list/picker/bootstrap family.
  // Readiness and secondary work are deliberately serialized so they cannot occupy both
  // lanes before the core Product startup request arrives.
  const MAX_NONCORE_GETS = 1;
  const queue = [];
  const sharedRequests = new Map();
  let sequence = 0;

  const health = {
    version: VERSION,
    max_concurrent_gets: MAX_CONCURRENT_GETS,
    max_noncore_gets: MAX_NONCORE_GETS,
    reserved_core_slots: 1,
    active_gets: 0,
    active_core_gets: 0,
    active_noncore_gets: 0,
    queued_gets: 0,
    peak_active_gets: 0,
    peak_noncore_gets: 0,
    peak_queued_gets: 0,
    started_gets: 0,
    completed_gets: 0,
    failed_gets: 0,
    shared_hits: 0,
    canonical_readiness_requests: 0,
  };
  window.DDProductsRequestBudgetHealth = health;

  function abortError() {
    try { return new DOMException('The operation was aborted.', 'AbortError'); }
    catch {
      const error = new Error('The operation was aborted.');
      error.name = 'AbortError';
      return error;
    }
  }

  function wrapperChainHasBudget(fn) {
    let current = fn;
    for (let depth = 0; current && depth < 6; depth += 1) {
      if (current.__ddProductsRequestBudget === true) return true;
      current = current.__ddProductsOriginal || null;
    }
    return false;
  }

  function canonicalRequest(input, options = {}) {
    const method = String(options?.method || 'GET').toUpperCase();
    if (method !== 'GET') return null;

    let url;
    try { url = new URL(String(input || ''), window.location.origin); }
    catch { return null; }
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/admin/')) return null;

    // Product Admin historically had separate 300-row and 500-row readiness startup calls.
    // The Build 157 delivery guard rewrites the actual deep read to 80 rows after this
    // compatibility canonicalization, so older workspace consumers can continue to coalesce.
    if (url.pathname === '/api/admin/product-readiness' && !url.searchParams.get('product_id')) {
      url.searchParams.set('limit', '500');
      url.searchParams.set('show_ready', '1');
      health.canonical_readiness_requests += 1;
    }

    const normalizedInput = `${url.pathname}${url.search}`;
    const key = `${method} ${normalizedInput}`;
    return {
      input: normalizedInput,
      key,
      path: url.pathname,
      priority: requestPriority(url.pathname),
      ttlMs: responseTtlMs(url.pathname),
    };
  }

  function requestPriority(path) {
    if (path === '/api/admin/products' || path === '/api/admin/product-picker' || path === '/api/admin/product-mobile-bootstrap') return 0;
    if (path === '/api/admin/product-readiness' || path === '/api/admin/pending-actions') return 1;
    return 2;
  }

  function responseTtlMs(path) {
    if (path === '/api/admin/products') return 45000;
    if (path === '/api/admin/product-readiness') return 15000;
    if (path === '/api/admin/product-picker' || path === '/api/admin/product-mobile-bootstrap') return 15000;
    return 2500;
  }

  function updateQueueHealth() {
    health.queued_gets = queue.length;
    health.peak_queued_gets = Math.max(health.peak_queued_gets, queue.length);
  }

  function nextRunnableJobIndex() {
    // Queue is sorted by priority before this is called. Core Product work may always
    // consume any free lane. Non-core work can consume only one lane at a time so a
    // late-arriving Product bootstrap request is never trapped behind two secondary reads.
    const coreIndex = queue.findIndex((job) => job.priority === 0);
    if (coreIndex >= 0) return coreIndex;
    if (health.active_noncore_gets < MAX_NONCORE_GETS) return queue.length ? 0 : -1;
    return -1;
  }

  function pump() {
    queue.sort((a, b) => a.priority - b.priority || a.sequence - b.sequence);
    while (health.active_gets < MAX_CONCURRENT_GETS && queue.length) {
      const runnableIndex = nextRunnableJobIndex();
      if (runnableIndex < 0) break;
      const [job] = queue.splice(runnableIndex, 1);
      updateQueueHealth();
      if (job.signal?.aborted) {
        job.reject(abortError());
        continue;
      }

      const isCore = job.priority === 0;
      health.active_gets += 1;
      if (isCore) health.active_core_gets += 1;
      else health.active_noncore_gets += 1;
      health.started_gets += 1;
      health.peak_active_gets = Math.max(health.peak_active_gets, health.active_gets);
      health.peak_noncore_gets = Math.max(health.peak_noncore_gets, health.active_noncore_gets);

      Promise.resolve()
        .then(() => job.run())
        .then((response) => {
          health.completed_gets += 1;
          job.resolve(response);
        }, (error) => {
          health.failed_gets += 1;
          job.reject(error);
        })
        .finally(() => {
          health.active_gets = Math.max(0, health.active_gets - 1);
          if (isCore) health.active_core_gets = Math.max(0, health.active_core_gets - 1);
          else health.active_noncore_gets = Math.max(0, health.active_noncore_gets - 1);
          pump();
        });
    }
  }

  function schedule(run, { priority = 2, signal = null } = {}) {
    return new Promise((resolve, reject) => {
      const job = { run, priority, signal, sequence: sequence += 1, resolve, reject };
      queue.push(job);
      updateQueueHealth();
      pump();
    });
  }

  function install() {
    if (!window.DDAuth?.apiFetch) return false;
    if (wrapperChainHasBudget(window.DDAuth.apiFetch)) return true;

    const original = window.DDAuth.apiFetch.bind(window.DDAuth);
    const boundedApiFetch = async (input, options = {}) => {
      const info = canonicalRequest(input, options);
      if (!info) return original(input, options);
      if (options?.signal?.aborted) throw abortError();

      const now = Date.now();
      const existing = sharedRequests.get(info.key);
      if (existing && (existing.expiresAt === Infinity || existing.expiresAt > now)) {
        health.shared_hits += 1;
        const response = await existing.promise;
        return response.clone();
      }
      if (existing) sharedRequests.delete(info.key);

      const entry = { promise: null, expiresAt: Infinity };
      entry.promise = schedule(
        () => original(info.input, { ...options, method: 'GET' }),
        { priority: info.priority, signal: options?.signal || null },
      );
      sharedRequests.set(info.key, entry);
      entry.promise.then((response) => {
        if (response?.ok) entry.expiresAt = Date.now() + info.ttlMs;
        else sharedRequests.delete(info.key);
      }, () => sharedRequests.delete(info.key));

      const response = await entry.promise;
      return response.clone();
    };

    boundedApiFetch.__ddProductsRequestBudget = true;
    boundedApiFetch.__ddProductsOriginal = original;
    boundedApiFetch.__ddProductsSharedRequests = sharedRequests;
    boundedApiFetch.__ddProductsQueue = queue;
    window.DDAuth.apiFetch = boundedApiFetch;
    return true;
  }

  function loadBuild158Helper(src, marker) {
    // The scheduler has a deliberately minimal Node test DOM. Helper injection is
    // browser-only; absence of DOM script APIs must remain a safe no-op for that proof harness.
    if (typeof document?.createElement !== 'function' || !document?.head || typeof document.head.appendChild !== 'function') return;
    if (typeof document.querySelector === 'function' && document.querySelector(`script[${marker}="1"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute(marker, '1');
    script.async = false;
    document.head.appendChild(script);
  }

  // Build 159 forces fresh helper URLs for returning browsers; helper semantics remain the
  // already-proven Build 158 editor fallback and pending/unknown quality behavior.
  loadBuild158Helper('/public/js/admin-products-editor-startup-v158.js?v=467b159-editor-startup-cache-v2', 'data-dd-products-editor-startup-v158');
  loadBuild158Helper('/public/js/admin-product-quality-pending-v158.js?v=467b159-quality-pending-cache-v2', 'data-dd-product-quality-pending-v158');

  const installWhenReady = () => { install(); };
  if (!install()) {
    document.addEventListener('DOMContentLoaded', installWhenReady, { once: true });
    document.addEventListener('dd:auth-verified', installWhenReady, { once: true });
    document.addEventListener('dd:admin-ready', installWhenReady, { once: true });
  }
})();