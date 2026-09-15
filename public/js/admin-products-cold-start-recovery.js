// Current Products admin cold-start recovery.
// Build 156 keeps the essential Product list usable even when secondary readiness panels
// start late. Core reads remain bounded/coalesced and never perform a mutation.
(() => {
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

  const VERSION = 'R467B156_CORE_PRODUCT_RECOVERY_V1';
  const PRODUCT_SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const DEFAULT_CATEGORIES = ['Rings','Necklaces','Bracelets','Earrings','Pendants','CNC Components','3D Printed Items','Laser Engraved Items','Polymer Clay Items','Home Decor','Soap','Candles','Accessories','Other'];
  const DEFAULT_COLOURS = ['Silver','Gold','Black','White','Red','Blue','Green','Purple','Pink','Orange','Yellow','Brown','Clear','Multicolor'];
  const DEFAULT_SHIPPING = ['standard-jewelry','small-parcel','oversize','pickup-only','digital'];
  const MAX_CACHE_BODY_CHARS = 6000000;

  let optionsReady = false;
  let optionsRunning = false;
  let pickerReady = false;
  let pickerFallbackAttempted = false;
  let pickerFallbackTimer = 0;
  let optionsRetryTimer = 0;
  let coreProductsRunning = false;
  let coreProductsReady = false;

  const health = {
    version: VERSION,
    core_requests: 0,
    core_recovered: false,
    core_product_count: 0,
    core_table_rendered: false,
    picker_recovered: false,
    cleanup_refresh_requested: false,
    last_error: '',
  };
  window.DDProductsColdStartRecoveryHealth = health;

  function clean(value) { return String(value ?? '').trim(); }
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
  function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
  function locallyAuthenticated() {
    try { return Boolean(window.DDAuth?.isLoggedIn?.()); }
    catch { return false; }
  }
  function verifiedAdminAvailable() {
    // GET recovery can start as soon as a session token exists. Server-side admin
    // authorization remains authoritative; a client-side role object is not required.
    if (locallyAuthenticated()) return true;
    const state = window.DDAuthUiState || {};
    return Boolean(state.verified === true && String(state?.user?.role || '').toLowerCase() === 'admin');
  }

  function jsonFallbackResponse(payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders }
    });
  }

  function installBoundedProductApiGuard() {
    if (!window.DDAuth?.apiFetch || window.DDAuth.apiFetch.__ddProductsBounded === true) return false;
    const original = window.DDAuth.apiFetch.bind(window.DDAuth);
    const inflight = new Map();
    const responseCache = new Map();
    const coalescedPaths = new Set([
      '/api/admin/products',
      '/api/admin/product-picker',
      '/api/admin/product-mobile-bootstrap',
      '/api/admin/product-resource-bootstrap',
      '/api/admin/product-readiness',
      '/api/admin/pending-actions'
    ]);
    const cacheTtlByPath = new Map([
      ['/api/admin/products', 45000],
      ['/api/admin/product-picker', 60000],
      ['/api/admin/product-mobile-bootstrap', 60000],
      ['/api/admin/product-resource-bootstrap', 30000],
      ['/api/admin/product-readiness', 30000],
      ['/api/admin/pending-actions', 20000]
    ]);

    function cloneCachedResponse(entry) {
      return new Response(entry.body, {
        status: entry.status,
        headers: {
          'Content-Type': entry.contentType || 'application/json',
          'Cache-Control': 'no-store',
          'X-DD-Client-Read-Cache': 'hit'
        }
      });
    }

    async function rememberResponse(key, path, response) {
      const ttl = Number(cacheTtlByPath.get(path) || 0);
      if (!ttl || !response?.ok) return response;
      const contentType = String(response.headers?.get?.('content-type') || '');
      if (!/json/i.test(contentType)) return response;
      try {
        const body = await response.clone().text();
        if (body.length > MAX_CACHE_BODY_CHARS) return response;
        responseCache.set(key, {
          body,
          status: response.status,
          contentType,
          expiresAt: Date.now() + ttl
        });
      } catch {}
      return response;
    }

    function cachedResponse(key) {
      const entry = responseCache.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        responseCache.delete(key);
        return null;
      }
      return cloneCachedResponse(entry);
    }

    const executeGet = async (input, options, path) => {
      let timeoutMs = 0;
      let fallbackPayload = null;
      if (path === '/api/admin/product-readiness') {
        timeoutMs = 3500;
        fallbackPayload = { ok: true, products: [], degraded: true, reason: 'readiness_timeout' };
      } else if (path === '/api/admin/products') {
        timeoutMs = 8000;
      } else if (path === '/api/admin/product-picker') {
        timeoutMs = 5000;
        fallbackPayload = { ok: true, products: [], degraded: true, reason: 'product_picker_timeout' };
      } else if (path === '/api/admin/product-mobile-bootstrap') {
        timeoutMs = 6000;
      } else if (path === '/api/admin/product-resource-bootstrap') {
        timeoutMs = 8000;
      } else if (path === '/api/admin/pending-actions') {
        timeoutMs = 5000;
        fallbackPayload = { ok: true, actions: [], degraded: true, reason: 'pending_actions_timeout' };
      }

      if (!timeoutMs) return original(input, options);

      const controller = new AbortController();
      const suppliedSignal = options?.signal || null;
      if (suppliedSignal?.aborted) controller.abort();
      else if (suppliedSignal?.addEventListener) suppliedSignal.addEventListener('abort', () => controller.abort(), { once: true });

      let timer = 0;
      try {
        return await Promise.race([
          original(input, { ...options, signal: controller.signal }),
          new Promise((resolve, reject) => {
            timer = window.setTimeout(() => {
              controller.abort();
              if (fallbackPayload) resolve(jsonFallbackResponse(fallbackPayload));
              else reject(new Error(`Product startup request timed out after ${timeoutMs} ms.`));
            }, timeoutMs);
          })
        ]);
      } finally {
        if (timer) window.clearTimeout(timer);
      }
    };

    const boundedApiFetch = async (input, options = {}) => {
      const method = String(options?.method || 'GET').toUpperCase();
      if (method !== 'GET') return original(input, options);

      let url = null;
      try { url = new URL(String(input || ''), window.location.origin); } catch {}
      const path = url?.pathname || '';
      if (!coalescedPaths.has(path)) return original(input, options);

      const key = `${method} ${url.pathname}${url.search}`;
      const cached = cachedResponse(key);
      if (cached) return cached;

      if (!inflight.has(key)) {
        const task = executeGet(input, options, path)
          .then((response) => rememberResponse(key, path, response))
          .finally(() => inflight.delete(key));
        inflight.set(key, task);
      }
      const response = await inflight.get(key);
      return response.clone();
    };

    function clearReadCache() { responseCache.clear(); }

    boundedApiFetch.__ddProductsBounded = true;
    boundedApiFetch.__ddProductsOriginal = original;
    boundedApiFetch.__ddProductsInflight = inflight;
    boundedApiFetch.__ddProductsResponseCache = responseCache;
    boundedApiFetch.__ddProductsClearReadCache = clearReadCache;
    window.DDAuth.apiFetch = boundedApiFetch;
    window.DDProductsReadBudget = {
      version: 'R467B63_V1',
      clear: clearReadCache,
      inflight,
      responseCache,
      cacheTtlByPath
    };
    return true;
  }

  async function readJson(url, timeoutMs = 10000) {
    if (!window.DDAuth?.apiFetch) throw new Error('Authentication helper is not ready.');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await window.DDAuth.apiFetch(url, { method: 'GET', signal: controller.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Request failed (${response.status}).`);
      return data;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function fillSimpleSelect(id, values, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;
    const current = clean(select.value);
    const rows = Array.isArray(values) ? values : [];
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + rows.map((value) => {
      const safe = clean(value);
      return `<option value="${escapeHtml(safe)}">${escapeHtml(safe)}</option>`;
    }).join('');
    if (current && rows.some((value) => clean(value) === current)) select.value = current;
  }

  function fillTaxSelect(rows, placeholder = 'Select tax class') {
    const select = document.getElementById('create_product_tax_class_id');
    if (!select) return;
    const current = clean(select.value);
    const values = Array.isArray(rows) ? rows : [];
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + values.map((row) => {
      const id = Number(row?.tax_class_id || 0);
      const raw = Number(row?.rate_percent ?? row?.tax_rate ?? 0);
      const pct = raw > 1 ? raw : Number((raw * 100).toFixed(3));
      return `<option value="${id}">${escapeHtml(row?.name || row?.code || `Tax ${id}`)} (${escapeHtml(String(pct))}%)</option>`;
    }).join('');
    if (current && values.some((row) => String(Number(row?.tax_class_id || 0)) === current)) select.value = current;
  }

  function pickerHasRows() {
    const picker = document.getElementById('existingProductSelect');
    if (!picker) return false;
    const text = String(picker.textContent || '');
    return picker.options.length > 1 && !/loading independently|loading products/i.test(text);
  }

  function tableHasRows() {
    return document.querySelectorAll('#productsTableBody [data-edit-product-id]').length > 0;
  }

  function renderProductPicker(products, sourceLabel = '') {
    const select = document.getElementById('existingProductSelect');
    if (!select) return;
    const rows = Array.isArray(products) ? products : [];
    const current = clean(select.value);
    select.innerHTML = '<option value="">Choose an existing product...</option>' + rows.map((product) => {
      const id = Number(product?.product_id || 0);
      const name = clean(product?.name) || `Product #${id}`;
      const suffix = [product?.slug, product?.sku, product?.status].map(clean).filter(Boolean).join(' • ');
      return `<option value="${id}">#${id} — ${escapeHtml(name)}${suffix ? ` — ${escapeHtml(suffix)}` : ''}</option>`;
    }).join('');
    if (current && rows.some((product) => String(Number(product?.product_id || 0)) === current)) select.value = current;
    const count = document.getElementById('existingProductCount');
    if (count) count.textContent = `${rows.length} product${rows.length === 1 ? '' : 's'} available${sourceLabel ? ` · ${sourceLabel}` : ''}.`;
    if (rows.length) {
      pickerReady = true;
      health.picker_recovered = true;
    }
  }

  function money(cents, currency = 'CAD') {
    const amount = Number(cents || 0) / 100;
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'CAD' }).format(amount); }
    catch { return `${amount.toFixed(2)} ${currency || 'CAD'}`; }
  }

  function renderCoreProductTable(products) {
    const body = document.getElementById('productsTableBody');
    const rows = Array.isArray(products) ? products : [];
    if (!body || !rows.length || tableHasRows()) return false;
    body.innerHTML = rows.map((product) => {
      const id = Number(product?.product_id || 0);
      const number = escapeHtml(String(product?.product_number || id));
      const name = escapeHtml(product?.name || `Product #${id}`);
      const slug = escapeHtml(product?.slug || '');
      const sku = escapeHtml(product?.sku || '');
      const type = escapeHtml(product?.product_type || '');
      const status = escapeHtml(product?.status || '');
      const review = escapeHtml(product?.review_status || 'pending_review');
      const inventory = escapeHtml(String(Number(product?.inventory_quantity || 0)));
      const shipping = Number(product?.requires_shipping) === 1 ? 'Yes' : 'No';
      const tax = Number(product?.taxable) === 0 ? 'Non-taxable' : escapeHtml(product?.tax_class_name || product?.tax_class_code || 'Tax class');
      const archived = String(product?.status || '').toLowerCase() === 'archived';
      return `<tr data-dd-core-recovery="1">
        <td style="padding:8px;border-bottom:1px solid #ddd"><strong>DD${number}</strong><div class="small">Row ID ${id}</div></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${name}<div class="small">Core Product data loaded; readiness details continue independently.</div></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${slug}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${sku}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${type}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${status}<div class="small">Review: ${review}</div></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(product?.price_cents, product?.currency))}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${inventory}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${shipping}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${tax}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd"><div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" type="button" data-edit-product-id="${id}">Edit</button>
          <button class="btn danger" type="button" data-open-product-correction="${id}">Correct / remove</button>
          <button class="btn" type="button" data-archive-product-id="${id}" ${archived ? 'disabled' : ''}>Archive</button>
        </div></td>
      </tr>`;
    }).join('');
    document.getElementById('productsLoading')?.style.setProperty('display', 'none');
    document.getElementById('productsEmpty')?.style.setProperty('display', 'none');
    health.core_table_rendered = true;
    return true;
  }

  function publishCoreProducts(products, sourceLabel = 'core recovery') {
    const rows = Array.isArray(products) ? products : [];
    if (!rows.length) return false;
    renderProductPicker(rows, sourceLabel);
    renderCoreProductTable(rows);
    try {
      localStorage.setItem(PRODUCT_SNAPSHOT_KEY, JSON.stringify({ cached_at: new Date().toISOString(), products: rows }));
    } catch {}
    coreProductsReady = true;
    health.core_recovered = true;
    health.core_product_count = rows.length;
    document.dispatchEvent(new CustomEvent('dd:products-core-recovered', { detail: { products: rows, source: sourceLabel } }));
    // Cleanup binds during DOMContentLoaded. By the time this network read resolves, its
    // listener is present; one click reuses the same coalesced/cached Product response.
    window.setTimeout(() => {
      const cleanup = document.getElementById('refreshProductCleanup');
      if (cleanup && !cleanup.disabled) {
        health.cleanup_refresh_requested = true;
        cleanup.click();
      }
    }, 0);
    return true;
  }

  function installImmediateFallbacks() {
    const category = document.getElementById('create_product_category');
    if (category && /loading/i.test(category.textContent || '')) fillSimpleSelect('create_product_category', DEFAULT_CATEGORIES, 'Select category');
    const colour = document.getElementById('create_product_color_name');
    if (colour && /loading/i.test(colour.textContent || '')) fillSimpleSelect('create_product_color_name', DEFAULT_COLOURS, 'Select primary colour');
    const shipping = document.getElementById('create_product_shipping_code');
    if (shipping && /loading/i.test(shipping.textContent || '')) fillSimpleSelect('create_product_shipping_code', DEFAULT_SHIPPING, 'Select shipping code');
    const tax = document.getElementById('create_product_tax_class_id');
    if (tax && /loading/i.test(tax.textContent || '')) fillTaxSelect([], 'Tax classes loading independently…');

    const snapshot = safeJson(localStorage.getItem(PRODUCT_SNAPSHOT_KEY) || 'null', null);
    const products = Array.isArray(snapshot?.products) ? snapshot.products : [];
    if (products.length) {
      publishCoreProducts(products, `cached ${snapshot.cached_at || 'earlier visit'}`);
    } else {
      const picker = document.getElementById('existingProductSelect');
      if (picker && /loading/i.test(picker.textContent || '')) picker.innerHTML = '<option value="">Product list loading independently…</option>';
    }
  }

  async function recoverEditorOptions() {
    if (optionsReady || optionsRunning || !verifiedAdminAvailable()) return optionsReady;
    optionsRunning = true;
    try {
      const data = await readJson('/api/admin/product-mobile-bootstrap?options_only=1', 6000);
      fillSimpleSelect('create_product_category', data.category_options || DEFAULT_CATEGORIES, 'Select category');
      fillSimpleSelect('create_product_color_name', data.color_options || DEFAULT_COLOURS, 'Select primary colour');
      fillSimpleSelect('create_product_shipping_code', data.shipping_code_options || DEFAULT_SHIPPING, 'Select shipping code');
      fillTaxSelect(data.tax_classes || []);
      optionsReady = true;
      document.dispatchEvent(new CustomEvent('dd:catalog-options-recovered', { detail: { source: 'products-cold-start' } }));
      return true;
    } finally {
      optionsRunning = false;
    }
  }

  async function recoverCoreProductList() {
    if (coreProductsRunning || tableHasRows() && pickerHasRows()) {
      coreProductsReady = coreProductsReady || (tableHasRows() && pickerHasRows());
      return coreProductsReady;
    }
    if (!verifiedAdminAvailable()) return false;
    coreProductsRunning = true;
    health.core_requests += 1;
    try {
      const data = await readJson('/api/admin/products', 8000);
      const products = Array.isArray(data.products) ? data.products : [];
      if (!products.length) return false;
      publishCoreProducts(products, 'live core recovery');
      return true;
    } catch (error) {
      health.last_error = String(error?.message || error || 'Core Product recovery failed.');
      return false;
    } finally {
      coreProductsRunning = false;
    }
  }

  async function recoverProductPickerOnce() {
    if (pickerReady || pickerHasRows()) {
      pickerReady = true;
      return true;
    }
    if (!verifiedAdminAvailable() || pickerFallbackAttempted) return false;
    pickerFallbackAttempted = true;
    try {
      const data = await readJson('/api/admin/product-picker?limit=120', 5000);
      const products = Array.isArray(data.products) ? data.products : [];
      if (!products.length) {
        pickerFallbackAttempted = false;
        return false;
      }
      renderProductPicker(products, data?.pagination?.has_more ? 'live lightweight fallback · first 120' : 'live lightweight fallback');
      return true;
    } catch (error) {
      pickerFallbackAttempted = false;
      throw error;
    }
  }

  function showRecoveryFailure(error) {
    if (!error) return;
    health.last_error = String(error?.message || error || 'Startup request failed.');
    const target = document.getElementById('createProductMessage') || document.getElementById('productsError');
    if (!target) return;
    target.textContent = `Product startup is in degraded mode. ${health.last_error} Essential controls remain available where cached/default data is safe; saving still requires live database access.`;
    target.style.display = '';
    target.classList?.add('is-error');
    const tax = document.getElementById('create_product_tax_class_id');
    if (tax && /loading/i.test(tax.textContent || '')) fillTaxSelect([], 'Tax classes unavailable — retry after database access returns');
  }

  function recoverAfterAuth() {
    if (!verifiedAdminAvailable()) return;
    if (!coreProductsReady || !tableHasRows()) void recoverCoreProductList().catch(showRecoveryFailure);
    if (!pickerHasRows()) void recoverProductPickerOnce().catch(showRecoveryFailure);
    if (!optionsReady) void recoverEditorOptions().catch(showRecoveryFailure);
  }

  function scheduleRecovery() {
    if (pickerFallbackTimer) window.clearTimeout(pickerFallbackTimer);
    pickerFallbackTimer = window.setTimeout(() => {
      pickerFallbackTimer = 0;
      recoverAfterAuth();
    }, 2200);

    if (optionsRetryTimer) window.clearTimeout(optionsRetryTimer);
    optionsRetryTimer = window.setTimeout(() => {
      optionsRetryTimer = 0;
      recoverAfterAuth();
    }, 5000);
  }

  function startEssentialRecovery() {
    installBoundedProductApiGuard();
    installImmediateFallbacks();
    recoverAfterAuth();
    scheduleRecovery();
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (event?.detail?.ok) recoverAfterAuth();
  });
  document.addEventListener('dd:auth-verified', (event) => {
    if (event?.detail?.logged_in) recoverAfterAuth();
  });
  document.addEventListener('dd:auth-changed', (event) => {
    if (event?.detail?.logged_in || event?.detail?.ok) recoverAfterAuth();
  });
  ['dd:product-created', 'dd:product-updated', 'dd:product-deleted', 'dd:product-archived'].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      pickerReady = pickerHasRows();
      coreProductsReady = tableHasRows() && pickerHasRows();
      pickerFallbackAttempted = false;
      window.DDProductsReadBudget?.clear?.();
    });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startEssentialRecovery, { once: true });
  else startEssentialRecovery();
})();
