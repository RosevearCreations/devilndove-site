// Current Products admin cold-start recovery.
// Essential editor/picker controls become usable independently of readiness analytics
// and the Product Resource gallery. The recovery path is intentionally D1-light and
// replaces permanent "Loading…" placeholders with a visible degraded state on failure.
(() => {
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

  const PRODUCT_SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const DEFAULT_CATEGORIES = ['Rings','Necklaces','Bracelets','Earrings','Pendants','CNC Components','3D Printed Items','Laser Engraved Items','Polymer Clay Items','Home Decor','Accessories','Other'];
  const DEFAULT_COLOURS = ['Silver','Gold','Black','White','Red','Blue','Green','Purple','Pink','Orange','Yellow','Brown','Clear','Multicolor'];
  const DEFAULT_SHIPPING = ['standard-jewelry','small-parcel','oversize','pickup-only','digital'];
  let running = false;
  let lastRunAt = 0;

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
  function verifiedAdminAvailable() {
    const state = window.DDAuthUiState || {};
    const verifiedUser = state.verified === true ? state.user : null;
    if (verifiedUser && String(verifiedUser.role || '').toLowerCase() === 'admin') return true;
    const stored = window.DDAuth?.getStoredUser?.() || null;
    return Boolean(window.DDAuth?.isLoggedIn?.() && stored && String(stored.role || '').toLowerCase() === 'admin');
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
    if (products.length) renderProductPicker(products, `Cached product list from ${snapshot.cached_at || 'an earlier visit'}`);
    else {
      const picker = document.getElementById('existingProductSelect');
      if (picker && /loading/i.test(picker.textContent || '')) picker.innerHTML = '<option value="">Product list loading independently…</option>';
    }
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
  }

  async function recoverEditorOptions() {
    const data = await readJson('/api/admin/product-mobile-bootstrap?options_only=1', 8000);
    fillSimpleSelect('create_product_category', data.category_options || DEFAULT_CATEGORIES, 'Select category');
    fillSimpleSelect('create_product_color_name', data.color_options || DEFAULT_COLOURS, 'Select primary colour');
    fillSimpleSelect('create_product_shipping_code', data.shipping_code_options || DEFAULT_SHIPPING, 'Select shipping code');
    fillTaxSelect(data.tax_classes || []);
    document.dispatchEvent(new CustomEvent('dd:catalog-options-recovered', { detail: { source: 'products-cold-start' } }));
    return true;
  }

  async function recoverProductPicker() {
    // Reuse the lightweight Product Resource bootstrap instead of the full Product
    // analytics rollup. It performs a simple Product identity query and no readiness
    // aggregation when product_id=0.
    const data = await readJson('/api/admin/product-resource-bootstrap?product_id=0', 8000);
    const products = Array.isArray(data.products) ? data.products : [];
    renderProductPicker(products, 'live lightweight list');
    return true;
  }

  function showRecoveryFailure(results) {
    const failures = results.filter((result) => result.status === 'rejected').map((result) => result.reason?.message || 'startup request failed');
    if (!failures.length) return;
    const target = document.getElementById('createProductMessage') || document.getElementById('productsError');
    if (!target) return;
    target.textContent = `Product startup is in degraded mode. ${failures.join(' ')} Essential controls remain available where cached/default data is safe; saving still requires live database access.`;
    target.style.display = '';
    target.classList?.add('is-error');
    const tax = document.getElementById('create_product_tax_class_id');
    if (tax && /loading/i.test(tax.textContent || '')) fillTaxSelect([], 'Tax classes unavailable — retry after database access returns');
  }

  async function start(force = false) {
    if (running || !verifiedAdminAvailable()) return;
    if (!force && Date.now() - lastRunAt < 1200) return;
    running = true;
    lastRunAt = Date.now();
    try {
      const results = await Promise.allSettled([
        recoverEditorOptions(),
        recoverProductPicker(),
      ]);
      showRecoveryFailure(results);
    } finally {
      running = false;
    }
  }

  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) void start(true); });
  document.addEventListener('dd:auth-verified', () => void start(true));
  document.addEventListener('dd:auth-changed', (event) => { if (event?.detail?.ok) void start(true); });

  const boot = () => {
    installImmediateFallbacks();
    void start();
    window.setTimeout(() => void start(), 350);
    window.setTimeout(() => void start(), 1200);
    window.setTimeout(() => void start(), 3000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();