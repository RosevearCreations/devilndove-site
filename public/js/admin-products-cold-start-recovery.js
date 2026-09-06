// Current Products admin cold-start recovery.
// This is deliberately lightweight: essential editor/picker controls become usable
// independently of readiness analytics and the larger Product Resource gallery.
(() => {
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

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

  function fillTaxSelect(rows) {
    const select = document.getElementById('create_product_tax_class_id');
    if (!select) return;
    const current = clean(select.value);
    const values = Array.isArray(rows) ? rows : [];
    select.innerHTML = '<option value="">Select tax class</option>' + values.map((row) => {
      const id = Number(row?.tax_class_id || 0);
      const raw = Number(row?.rate_percent ?? row?.tax_rate ?? 0);
      const pct = raw > 1 ? raw : Number((raw * 100).toFixed(3));
      return `<option value="${id}">${escapeHtml(row?.name || row?.code || `Tax ${id}`)} (${escapeHtml(String(pct))}%)</option>`;
    }).join('');
    if (current && values.some((row) => String(Number(row?.tax_class_id || 0)) === current)) select.value = current;
  }

  async function recoverEditorOptions() {
    const data = await readJson('/api/admin/product-mobile-bootstrap?options_only=1', 8000);
    fillSimpleSelect('create_product_category', data.category_options || [], 'Select category');
    fillSimpleSelect('create_product_color_name', data.color_options || [], 'Select primary colour');
    fillSimpleSelect('create_product_shipping_code', data.shipping_code_options || [], 'Select shipping code');
    fillTaxSelect(data.tax_classes || []);
    document.dispatchEvent(new CustomEvent('dd:catalog-options-recovered', { detail: { source: 'products-cold-start' } }));
    return true;
  }

  async function recoverProductPicker() {
    const select = document.getElementById('existingProductSelect');
    if (!select) return true;
    const data = await readJson('/api/admin/products', 12000);
    const products = Array.isArray(data.products) ? data.products : [];
    const current = clean(select.value);
    select.innerHTML = '<option value="">Choose an existing product...</option>' + products.map((product) => {
      const id = Number(product?.product_id || 0);
      const name = clean(product?.name) || `Product #${id}`;
      const suffix = [product?.slug, product?.sku, product?.status].map(clean).filter(Boolean).join(' • ');
      return `<option value="${id}">#${id} — ${escapeHtml(name)}${suffix ? ` — ${escapeHtml(suffix)}` : ''}</option>`;
    }).join('');
    if (current && products.some((product) => String(Number(product?.product_id || 0)) === current)) select.value = current;
    const count = document.getElementById('existingProductCount');
    if (count) count.textContent = `${products.length} product${products.length === 1 ? '' : 's'} available.`;
    return true;
  }

  function showRecoveryFailure(results) {
    const failures = results.filter((result) => result.status === 'rejected').map((result) => result.reason?.message || 'startup request failed');
    if (!failures.length) return;
    const target = document.getElementById('createProductMessage') || document.getElementById('productsError');
    if (!target) return;
    target.textContent = `Product startup recovered partially. ${failures.join(' ')}`;
    target.style.display = '';
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
    void start();
    window.setTimeout(() => void start(), 350);
    window.setTimeout(() => void start(), 1200);
    window.setTimeout(() => void start(), 3000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();