// Release 467 Build 158 — Product Editor Startup Resilience.
// Product Admin must remain immediately editable even when catalog/tax option enrichment is slow.
// This read-only guard canonicalizes desktop editor-option reads to one request, serves a bounded
// browser snapshot/default payload before the older 6s startup guard can fail, and lets the live
// D1-backed authority refresh the controls in the background. Product save/update mutations are untouched.
(() => {
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

  const VERSION = 'R467B158_EDITOR_STARTUP_V1';
  const SNAPSHOT_KEY = 'dd_admin_product_editor_options_v158';
  const FALLBACK_AFTER_MS = 4200;
  const SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const DEFAULT_CATEGORIES = ['Rings','Necklaces','Bracelets','Earrings','Pendants','CNC Components','3D Printed Items','Laser Engraved Items','Polymer Clay Items','Home Decor','Soap','Candles','Accessories','Other'];
  const DEFAULT_COLOURS = ['Silver','Gold','Black','White','Red','Blue','Green','Purple','Pink','Orange','Yellow','Brown','Clear','Multicolor'];
  const DEFAULT_SHIPPING = ['standard-jewelry','small-parcel','oversize','pickup-only','digital'];

  let canonicalInflight = null;
  let installed = false;

  const health = {
    version: VERSION,
    canonicalized_calls: 0,
    shared_hits: 0,
    live_successes: 0,
    fallback_responses: 0,
    snapshot_hits: 0,
    default_fallbacks: 0,
    background_refreshes: 0,
    last_live_at: '',
    last_fallback_reason: '',
    last_error: '',
  };
  window.DDProductsEditorStartupHealth = health;

  function clean(value) { return String(value ?? '').trim(); }
  function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
  function uniqueStrings(values, fallback = []) {
    const rows = Array.isArray(values) ? values : fallback;
    return [...new Set(rows.map(clean).filter(Boolean))];
  }
  function normalizeTaxClasses(rows) {
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      tax_class_id: Number(row?.tax_class_id || 0),
      code: clean(row?.code),
      name: clean(row?.name),
      tax_rate: Number(row?.tax_rate || 0),
      rate_percent: Number(row?.rate_percent ?? row?.tax_rate ?? 0),
      is_active: Number(row?.is_active ?? 1) === 0 ? 0 : 1,
    })).filter((row) => row.tax_class_id > 0 && row.name);
  }
  function normalizedPayload(data = {}, source = 'live') {
    return {
      ok: true,
      degraded: Boolean(data?.degraded),
      reason: clean(data?.reason),
      source,
      options_only: true,
      include_resources: false,
      next_product_number: Number(data?.next_product_number || 1000),
      next_product_number_label: clean(data?.next_product_number_label) || 'DD1000',
      product_number_start: Number(data?.product_number_start || 1000),
      catalog_authority_version: clean(data?.catalog_authority_version),
      catalog_authority_cache: data?.catalog_authority_cache || null,
      category_options: uniqueStrings(data?.category_options, DEFAULT_CATEGORIES),
      color_options: uniqueStrings(data?.color_options, DEFAULT_COLOURS),
      shipping_code_options: uniqueStrings(data?.shipping_code_options, DEFAULT_SHIPPING),
      product_type_options: uniqueStrings(data?.product_type_options, ['physical','digital','service']),
      product_status_options: uniqueStrings(data?.product_status_options, ['draft','active','archived']),
      product_review_status_options: uniqueStrings(data?.product_review_status_options, ['pending_review','approved','needs_changes']),
      merchandise_origin_options: uniqueStrings(data?.merchandise_origin_options, ['handmade','vintage','collectible','antique','oddity','prebuilt']),
      sale_channel_options: uniqueStrings(data?.sale_channel_options, ['onsite','hybrid','external_only']),
      tax_classes: normalizeTaxClasses(data?.tax_classes),
      resources: [],
    };
  }
  function responseFor(payload, source) {
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-DD-Editor-Startup': source,
      },
    });
  }
  function readSnapshot() {
    try {
      const row = safeJson(localStorage.getItem(SNAPSHOT_KEY) || 'null', null);
      const savedAt = Number(row?.saved_at_ms || 0);
      if (!savedAt || Date.now() - savedAt > SNAPSHOT_MAX_AGE_MS || !row?.payload) return null;
      return normalizedPayload(row.payload, 'browser-snapshot');
    } catch { return null; }
  }
  function writeSnapshot(payload) {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
        saved_at_ms: Date.now(),
        saved_at: new Date().toISOString(),
        payload: normalizedPayload(payload, 'live'),
      }));
    } catch {}
  }
  function fallbackPayload(reason = 'editor_options_timeout') {
    const snapshot = readSnapshot();
    if (snapshot) {
      health.snapshot_hits += 1;
      return { ...snapshot, degraded: true, reason, source: 'browser-snapshot' };
    }
    health.default_fallbacks += 1;
    return normalizedPayload({ degraded: true, reason }, 'safe-defaults');
  }
  function setSimpleSelect(id, values, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;
    const current = clean(select.value);
    const rows = uniqueStrings(values);
    select.innerHTML = `<option value="">${placeholder}</option>` + rows.map((value) => `<option value="${value.replace(/"/g, '&quot;')}">${value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</option>`).join('');
    if (current && rows.includes(current)) select.value = current;
  }
  function setTaxSelect(rows) {
    const select = document.getElementById('create_product_tax_class_id');
    if (!select) return;
    const current = clean(select.value);
    const taxes = normalizeTaxClasses(rows);
    select.innerHTML = '<option value="">Select tax class</option>' + taxes.map((row) => {
      const raw = Number(row.rate_percent ?? row.tax_rate ?? 0);
      const pct = raw > 1 ? raw : Number((raw * 100).toFixed(3));
      const name = (row.name || row.code || `Tax ${row.tax_class_id}`).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<option value="${row.tax_class_id}">${name} (${pct}%)</option>`;
    }).join('');
    if (current && taxes.some((row) => String(row.tax_class_id) === current)) select.value = current;
  }
  function applyPayloadToEditor(payload) {
    const data = normalizedPayload(payload, clean(payload?.source) || 'live');
    setSimpleSelect('create_product_category', data.category_options, 'Select category');
    setSimpleSelect('create_product_color_name', data.color_options, 'Select primary colour');
    setSimpleSelect('create_product_shipping_code', data.shipping_code_options, 'Select shipping code');
    if (data.tax_classes.length) setTaxSelect(data.tax_classes);
    document.dispatchEvent(new CustomEvent('dd:catalog-options-recovered', {
      detail: { source: VERSION, degraded: Boolean(data.degraded), reason: clean(data.reason) },
    }));
  }
  function clearLegacyTimeoutMessage() {
    const message = document.getElementById('createProductMessage');
    if (!message) return;
    const text = clean(message.textContent);
    if (!/Product startup request timed out after 6000 ms\.?/i.test(text)) return;
    message.textContent = '';
    message.style.display = 'none';
    message.classList?.remove('is-error');
  }
  function canonicalUrl(input) {
    let url;
    try { url = new URL(String(input || ''), window.location.origin); }
    catch { return null; }
    if (url.origin !== window.location.origin || url.pathname !== '/api/admin/product-mobile-bootstrap') return null;
    url.search = '';
    url.searchParams.set('options_only', '1');
    return `${url.pathname}${url.search}`;
  }
  function install() {
    if (installed || !window.DDAuth?.apiFetch) return installed;
    const original = window.DDAuth.apiFetch.bind(window.DDAuth);
    const wrapped = async (input, options = {}) => {
      const method = String(options?.method || 'GET').toUpperCase();
      const canonical = method === 'GET' ? canonicalUrl(input) : null;
      if (!canonical) return original(input, options);

      health.canonicalized_calls += 1;
      if (!canonicalInflight) {
        const requestOptions = { ...options, method: 'GET' };
        delete requestOptions.signal;
        const livePromise = Promise.resolve()
          .then(() => original(canonical, requestOptions))
          .then(async (response) => {
            const body = await response.clone().json().catch(() => null);
            if (!response.ok || !body?.ok) throw new Error(body?.error || `Editor option authority failed (${response.status}).`);
            const normalized = normalizedPayload(body, 'live');
            writeSnapshot(normalized);
            applyPayloadToEditor(normalized);
            clearLegacyTimeoutMessage();
            health.live_successes += 1;
            health.last_live_at = new Date().toISOString();
            return responseFor(normalized, 'live');
          })
          .catch((error) => {
            health.last_error = clean(error?.message || error);
            throw error;
          })
          .finally(() => { canonicalInflight = null; });
        canonicalInflight = livePromise;
        health.background_refreshes += 1;
      } else {
        health.shared_hits += 1;
      }

      let timer = 0;
      try {
        return await Promise.race([
          canonicalInflight.then((response) => response.clone()),
          new Promise((resolve) => {
            timer = window.setTimeout(() => {
              const reason = 'editor_options_timeout';
              const payload = fallbackPayload(reason);
              applyPayloadToEditor(payload);
              clearLegacyTimeoutMessage();
              health.fallback_responses += 1;
              health.last_fallback_reason = reason;
              resolve(responseFor(payload, payload.source || 'fallback'));
            }, FALLBACK_AFTER_MS);
          }),
        ]);
      } catch (error) {
        const reason = 'editor_options_live_error';
        const payload = fallbackPayload(reason);
        applyPayloadToEditor(payload);
        clearLegacyTimeoutMessage();
        health.fallback_responses += 1;
        health.last_fallback_reason = reason;
        health.last_error = clean(error?.message || error);
        return responseFor(payload, payload.source || 'fallback');
      } finally {
        if (timer) window.clearTimeout(timer);
      }
    };
    wrapped.__ddProductsEditorStartupV158 = true;
    wrapped.__ddProductsOriginal = original;
    window.DDAuth.apiFetch = wrapped;
    installed = true;
    return true;
  }

  function installWhenReady() { install(); }
  if (!install()) {
    document.addEventListener('DOMContentLoaded', installWhenReady, { once: true });
    document.addEventListener('dd:auth-verified', installWhenReady, { once: true });
    document.addEventListener('dd:admin-ready', installWhenReady, { once: true });
  }
})();
