// Release 467 Build 67 — Product Editor Recovery & Autosave
// Product-scoped browser recovery, stale-copy preflight, unsaved-change protection,
// and edit-authority priming before optional Product services finish.

(() => {
  const VERSION = 'R467B67_V1';
  const RECOVERY_PREFIX = 'dd_admin_product_editor_recovery_v2:';
  const PREFLIGHT_PATH = '/api/admin/product-save-preflight';
  const VERSION_KEYS = Object.freeze([
    'product_id',
    'updated_at',
    'name',
    'slug',
    'sku',
    'short_description',
    'description',
    'product_category',
    'color_name',
    'color_names_json',
    'shipping_code',
    'review_status',
    'product_type',
    'status',
    'price_cents',
    'compare_at_price_cents',
    'currency',
    'taxable',
    'tax_class_id',
    'requires_shipping',
    'weight_grams',
    'inventory_tracking',
    'inventory_quantity',
    'digital_file_url',
    'featured_image_url',
    'sort_order',
    'merchandise_origin',
    'sale_channel',
    'external_listing_url',
    'external_listing_label',
    'condition_summary',
    'era_label',
    'sourcing_notes',
  ]);

  const form = document.getElementById('createProductForm');
  if (document.body?.dataset?.adminPage !== 'products' || !form || !window.DDAuth?.apiFetch) return;

  const originalApiFetch = window.DDAuth.apiFetch.bind(window.DDAuth);
  let baselineFingerprint = '';
  let baselineVersion = null;
  let baselineVersionToken = '';
  let dirty = false;
  let stale = false;
  let currentProductId = Number(form.dataset.productId || window.DDCurrentProductEditorId || 0) || 0;
  let persistTimer = 0;
  let panel = null;
  let statusEl = null;
  let recoverButton = null;
  let discardButton = null;
  let reloadButton = null;
  let preflightPromise = null;
  let apiGuardInstalled = false;

  function clean(value) {
    return value == null ? '' : String(value);
  }

  function currentEditorId() {
    return Number(form.dataset.productId || window.DDCurrentProductEditorId || currentProductId || 0) || 0;
  }

  function recoveryKey(productId = currentEditorId()) {
    return `${RECOVERY_PREFIX}${Number(productId || 0) > 0 ? Number(productId) : 'new'}`;
  }

  function versionObject(product = {}) {
    const output = {};
    VERSION_KEYS.forEach((key) => {
      const value = product?.[key];
      output[key] = value == null ? null : value;
    });
    return output;
  }

  function versionToken(product = {}) {
    return JSON.stringify(versionObject(product));
  }

  function serializableEntries() {
    const rows = [];
    for (const element of Array.from(form.elements || [])) {
      const name = clean(element?.name).trim();
      if (!name || ['file', 'button', 'submit', 'reset'].includes(clean(element?.type).toLowerCase())) continue;
      if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) continue;
      rows.push([name, clean(element.value)]);
    }
    rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    return rows;
  }

  function editorFingerprint() {
    return JSON.stringify({
      product_id: currentEditorId(),
      mode: clean(form.dataset.mode || 'create'),
      entries: serializableEntries(),
    });
  }

  function readRecovery(productId = currentEditorId()) {
    try {
      const parsed = JSON.parse(localStorage.getItem(recoveryKey(productId)) || 'null');
      return parsed?.version === 2 && Array.isArray(parsed.entries) ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeRecovery(reason = 'change') {
    const productId = currentEditorId();
    const payload = {
      version: 2,
      build: VERSION,
      product_id: productId || 0,
      baseline_version: baselineVersion,
      baseline_version_token: baselineVersionToken || '',
      saved_at: new Date().toISOString(),
      reason,
      entries: serializableEntries(),
    };
    try {
      localStorage.setItem(recoveryKey(productId), JSON.stringify(payload));
      renderState();
      return true;
    } catch {
      return false;
    }
  }

  function clearRecovery(productId = currentEditorId()) {
    try { localStorage.removeItem(recoveryKey(productId)); } catch {}
    renderState();
  }

  function scheduleRecovery(reason = 'change') {
    if (persistTimer) window.clearTimeout(persistTimer);
    persistTimer = window.setTimeout(() => {
      persistTimer = 0;
      if (dirty || stale) writeRecovery(reason);
    }, 350);
  }

  function setFieldValue(name, value) {
    const field = form.elements.namedItem(name);
    if (!field) return;
    if (typeof RadioNodeList !== 'undefined' && field instanceof RadioNodeList) {
      field.value = clean(value);
      return;
    }
    if (field.type === 'checkbox' || field.type === 'radio') {
      field.checked = clean(field.value) === clean(value);
      return;
    }
    field.value = clean(value);
  }

  function restoreRecovery() {
    const recovery = readRecovery();
    if (!recovery) {
      renderState('No Product recovery copy is available in this browser.');
      return;
    }
    const previousPause = form.dataset.autosavePaused;
    form.dataset.autosavePaused = '1';
    try {
      recovery.entries.forEach(([name, value]) => setFieldValue(name, value));
      const recoveredProductId = Number(recovery.product_id || 0);
      if (recoveredProductId > 0) {
        currentProductId = recoveredProductId;
        form.dataset.productId = String(recoveredProductId);
        window.DDCurrentProductEditorId = recoveredProductId;
        form.dataset.mode = 'edit';
        const submit = form.querySelector('button[type="submit"]');
        if (submit) submit.textContent = 'Update Product';
      }
      baselineVersion = recovery.baseline_version || baselineVersion;
      baselineVersionToken = clean(recovery.baseline_version_token || baselineVersionToken);
    } finally {
      if (previousPause) form.dataset.autosavePaused = previousPause;
      else delete form.dataset.autosavePaused;
    }
    dirty = true;
    stale = false;
    document.dispatchEvent(new CustomEvent('dd:product-image-fields-updated', {
      detail: { product_id: currentEditorId(), recovered: true },
    }));
    window.DDProductDraftMedia?.render?.();
    window.DDProductEditorRequiredState?.sync?.();
    renderState('Recovered the browser copy. Review it before saving.');
  }

  function setBaseline(product, fingerprint = editorFingerprint()) {
    if (product && Number(product.product_id || 0) > 0) {
      currentProductId = Number(product.product_id);
      baselineVersion = versionObject(product);
      baselineVersionToken = versionToken(product);
    }
    baselineFingerprint = fingerprint;
    dirty = false;
    stale = false;
    form.dataset.productDirty = '0';
    form.dataset.productStale = '0';
    renderState();
  }

  function setDirtyFromForm(reason = 'change') {
    if (form.dataset.autosavePaused === '1') return;
    const next = editorFingerprint();
    dirty = Boolean(baselineFingerprint && next !== baselineFingerprint);
    if (!baselineFingerprint) dirty = true;
    form.dataset.productDirty = dirty ? '1' : '0';
    if (dirty) scheduleRecovery(reason);
    renderState();
  }

  function markStale(message) {
    stale = true;
    dirty = true;
    form.dataset.productDirty = '1';
    form.dataset.productStale = '1';
    writeRecovery('stale-copy');
    renderState(message || 'This Product changed after it was loaded. Your browser copy was preserved; reload the live Product before reconciling and saving.');
    document.dispatchEvent(new CustomEvent('dd:product-editor-stale', {
      detail: { product_id: currentEditorId(), baseline_version_token: baselineVersionToken || null },
    }));
  }

  function renderState(override = '') {
    if (!panel) return;
    const recovery = readRecovery();
    if (recoverButton) recoverButton.hidden = !recovery;
    if (discardButton) discardButton.hidden = !recovery;
    if (reloadButton) reloadButton.hidden = !(stale && currentEditorId() > 0);
    if (!statusEl) return;
    if (override) {
      statusEl.textContent = override;
      return;
    }
    if (stale) {
      statusEl.textContent = 'Stale copy detected. Browser recovery is preserved; reload the live Product before saving.';
      return;
    }
    if (dirty) {
      statusEl.textContent = recovery
        ? 'Unsaved Product edits are protected in this browser.'
        : 'Unsaved Product edits detected; browser recovery will be written shortly.';
      return;
    }
    if (recovery) {
      const when = recovery.saved_at ? new Date(recovery.saved_at).toLocaleString() : 'an earlier edit';
      statusEl.textContent = `A browser recovery copy is available from ${when}.`;
      return;
    }
    statusEl.textContent = currentEditorId() > 0
      ? 'Editor copy matches the last accepted Product version.'
      : 'New Product editor ready. Unsaved changes will be protected locally.';
  }

  function ensurePanel() {
    if (document.getElementById('productBuild67RecoveryPanel')) {
      panel = document.getElementById('productBuild67RecoveryPanel');
    } else {
      panel = document.createElement('div');
      panel.id = 'productBuild67RecoveryPanel';
      panel.className = 'dd-product-autosave-panel small';
      panel.innerHTML = `
        <strong>Editor recovery:</strong>
        <span id="productBuild67RecoveryStatus">Checking Product recovery state…</span>
        <button class="btn" type="button" id="productBuild67RecoverButton" hidden>Recover local edits</button>
        <button class="btn" type="button" id="productBuild67DiscardButton" hidden>Discard local recovery</button>
        <button class="btn" type="button" id="productBuild67ReloadButton" hidden>Reload live Product</button>
      `;
      const autosavePanel = document.getElementById('productAutosavePanel');
      if (autosavePanel?.parentNode === form) autosavePanel.insertAdjacentElement('afterend', panel);
      else form.insertBefore(panel, form.firstElementChild || null);
    }
    statusEl = panel.querySelector('#productBuild67RecoveryStatus');
    recoverButton = panel.querySelector('#productBuild67RecoverButton');
    discardButton = panel.querySelector('#productBuild67DiscardButton');
    reloadButton = panel.querySelector('#productBuild67ReloadButton');

    recoverButton?.addEventListener('click', restoreRecovery);
    discardButton?.addEventListener('click', () => {
      clearRecovery();
      if (!dirty) renderState('Local recovery discarded.');
    });
    reloadButton?.addEventListener('click', () => {
      writeRecovery('stale-reload');
      const productId = currentEditorId();
      const url = new URL(window.location.href);
      url.searchParams.set('product_id', String(productId));
      url.searchParams.set('workspace', 'editor');
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    });
  }

  async function fetchPreflight(productId = currentEditorId(), { force = false } = {}) {
    const id = Number(productId || 0);
    if (!id) return null;
    if (preflightPromise && !force) return preflightPromise;
    const task = (async () => {
      const response = await originalApiFetch(`${PREFLIGHT_PATH}?product_id=${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok || !data?.product) {
        throw new Error(data?.error || 'Could not verify the current Product version.');
      }
      return data.product;
    })();
    preflightPromise = task;
    try {
      return await task;
    } finally {
      if (preflightPromise === task) preflightPromise = null;
    }
  }

  async function verifyNotStale(productId = currentEditorId()) {
    const id = Number(productId || 0);
    if (!id) return { ok: true, product: null };
    const liveProduct = await fetchPreflight(id, { force: true });
    const liveToken = versionToken(liveProduct);
    if (!baselineVersionToken) {
      baselineVersion = versionObject(liveProduct);
      baselineVersionToken = liveToken;
      return { ok: true, product: liveProduct };
    }
    if (liveToken !== baselineVersionToken) {
      markStale();
      return { ok: false, stale: true, product: liveProduct };
    }
    return { ok: true, product: liveProduct };
  }

  function staleResponse() {
    return new Response(JSON.stringify({
      ok: false,
      code: 'stale_product_copy',
      error: 'This Product changed after your editor copy was loaded. Your browser recovery copy was preserved. Reload the live Product before saving.',
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  function asUrl(input) {
    try {
      if (input instanceof Request) return new URL(input.url, window.location.origin);
      return new URL(String(input || ''), window.location.origin);
    } catch {
      return null;
    }
  }

  function parseJsonBody(options = {}) {
    if (typeof options?.body !== 'string') return null;
    try { return JSON.parse(options.body); } catch { return null; }
  }


  function observeSaveResponse(response, requestEntriesFingerprint, productIdHint = 0) {
    if (!response?.ok) return;
    response.clone().json().then((data) => {
      if (!data?.ok || !data?.product) return;
      const savedProductId = Number(data.product.product_id || productIdHint || currentEditorId() || 0);
      if (savedProductId > 0) {
        currentProductId = savedProductId;
        form.dataset.productId = String(savedProductId);
        window.DDCurrentProductEditorId = savedProductId;
      }
      baselineVersion = versionObject(data.product);
      baselineVersionToken = versionToken(data.product);
      const savedEntries = (() => {
        try { return JSON.parse(requestEntriesFingerprint || '[]'); } catch { return []; }
      })();
      baselineFingerprint = JSON.stringify({
        product_id: savedProductId || currentEditorId(),
        mode: clean(form.dataset.mode || 'create'),
        entries: savedEntries,
      });
      const unchangedSinceRequest = JSON.stringify(serializableEntries()) === requestEntriesFingerprint;
      dirty = !unchangedSinceRequest;
      stale = false;
      form.dataset.productDirty = dirty ? '1' : '0';
      form.dataset.productStale = '0';
      if (unchangedSinceRequest) {
        clearRecovery(savedProductId);
        try { localStorage.removeItem(`${RECOVERY_PREFIX}new`); } catch {}
      } else {
        writeRecovery('changed-during-save');
      }
      renderState(unchangedSinceRequest ? 'Product save accepted. Browser recovery is clear.' : 'Product save completed, but newer edits remain protected in this browser.');
    }).catch(() => null);
  }

  async function guardedApiFetch(input, options = {}) {
    const url = asUrl(input);
    const method = clean(options?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    if (url?.pathname === '/api/admin/product-detail' && method === 'GET') {
      const response = await originalApiFetch(input, options);
      if (response.ok) {
        response.clone().json().then((data) => {
          const product = data?.product || null;
          const productId = Number(product?.product_id || url.searchParams.get('product_id') || 0);
          if (!productId) return;
          currentProductId = productId;
          form.dataset.productId = String(productId);
          window.DDCurrentProductEditorId = productId;
          form.dataset.mode = 'edit';
          const submit = form.querySelector('button[type="submit"]');
          if (submit) submit.textContent = 'Update Product';
          if (product) {
            baselineVersion = versionObject(product);
            baselineVersionToken = versionToken(product);
          }
          renderState('Primary Product data loaded. Optional pricing and secondary services may continue without blocking editing.');
        }).catch(() => null);
      }
      return response;
    }

    if (url?.pathname === '/api/admin/create-product' && method === 'POST') {
      const requestEntriesFingerprint = JSON.stringify(serializableEntries());
      const response = await originalApiFetch(input, options);
      observeSaveResponse(response, requestEntriesFingerprint, 0);
      return response;
    }

    if (url?.pathname === '/api/admin/update-product' && method === 'POST') {
      const payload = parseJsonBody(options) || {};
      const productId = Number(payload.product_id || currentEditorId() || 0);
      if (productId > 0) {
        try {
          const check = await verifyNotStale(productId);
          if (!check.ok) return staleResponse();
        } catch (error) {
          writeRecovery('preflight-unavailable');
          return new Response(JSON.stringify({
            ok: false,
            code: 'product_preflight_unavailable',
            error: `${error?.message || 'Could not verify the live Product version.'} Your browser recovery copy was preserved; retry when the Product preflight is available.`,
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }
      }

      const requestEntriesFingerprint = JSON.stringify(serializableEntries());
      const response = await originalApiFetch(input, options);
      observeSaveResponse(response, requestEntriesFingerprint, productId);
      return response;
    }

    return originalApiFetch(input, options);
  }

  function installApiGuard() {
    if (apiGuardInstalled) return;
    apiGuardInstalled = true;
    window.DDAuth.apiFetch = guardedApiFetch;
  }

  function baselineFromEvent(event) {
    const detail = event?.detail || {};
    const product = detail.product || detail;
    const productId = Number(detail.product_id || product?.product_id || product?.id || 0);
    if (!productId) return;
    const editorId = currentEditorId();
    if (editorId && editorId !== productId) return;
    currentProductId = productId;
    window.setTimeout(() => {
      if (currentEditorId() !== productId) return;
      setBaseline(product, editorFingerprint());
      renderState();
    }, 0);
  }

  function protectProductSwitch(event) {
    const target = event.target?.closest?.('[data-edit-product-id], #loadExistingProductButton, #clearExistingProductButton, #cancelProductEdit');
    if (!target || !dirty) return;
    const targetProductId = Number(target.getAttribute?.('data-edit-product-id') || document.getElementById('existingProductSelect')?.value || 0);
    if (targetProductId && targetProductId === currentEditorId()) return;
    writeRecovery('product-switch');
    const proceed = window.confirm('You have unsaved Product edits. A browser recovery copy has been saved. Continue and switch away from this editor copy?');
    if (!proceed) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderState('Product switch cancelled. Your unsaved edits remain in the editor and browser recovery.');
    }
  }

  ensurePanel();
  installApiGuard();

  baselineFingerprint = editorFingerprint();
  form.dataset.productDirty = '0';
  form.dataset.productStale = '0';

  form.addEventListener('input', () => setDirtyFromForm('input'));
  form.addEventListener('change', () => setDirtyFromForm('change'));
  document.addEventListener('click', protectProductSwitch, true);

  window.addEventListener('beforeunload', (event) => {
    if (!dirty) return;
    writeRecovery('beforeunload');
    event.preventDefault();
    event.returnValue = '';
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !dirty || stale || currentEditorId() <= 0) return;
    verifyNotStale().then((result) => {
      if (result?.ok) renderState();
    }).catch(() => {
      writeRecovery('visibility-preflight-unavailable');
      renderState('Live Product version could not be rechecked. Your browser recovery copy remains protected.');
    });
  });

  document.addEventListener('dd:product-editor-target', baselineFromEvent);
  window.addEventListener('dd:product-editor-target', baselineFromEvent);
  document.addEventListener('dd:product-created', baselineFromEvent);
  document.addEventListener('dd:product-autosaved-new', (event) => {
    const productId = Number(event?.detail?.product_id || event?.detail?.product?.product_id || 0);
    if (!productId) return;
    const oldRecovery = readRecovery(0);
    currentProductId = productId;
    form.dataset.productId = String(productId);
    window.DDCurrentProductEditorId = productId;
    if (oldRecovery) {
      try {
        localStorage.setItem(recoveryKey(productId), JSON.stringify({ ...oldRecovery, product_id: productId, saved_at: new Date().toISOString() }));
        localStorage.removeItem(`${RECOVERY_PREFIX}new`);
      } catch {}
    }
    renderState();
  });

  document.addEventListener('dd:product-updated', (event) => {
    const productId = Number(event?.detail?.product?.product_id || event?.detail?.product_id || currentProductId || 0);
    if (productId) clearRecovery(productId);
    if (form.dataset.mode !== 'edit') {
      currentProductId = 0;
      baselineVersion = null;
      baselineVersionToken = '';
      baselineFingerprint = editorFingerprint();
      dirty = false;
      stale = false;
      form.dataset.productDirty = '0';
      form.dataset.productStale = '0';
      renderState();
    }
  });

  document.addEventListener('dd:product-deleted', (event) => {
    const productId = Number(event?.detail?.product_id || 0);
    if (productId) clearRecovery(productId);
  });

  renderState();

  window.DDProductEditorRecovery = Object.freeze({
    version: VERSION,
    recovery_prefix: RECOVERY_PREFIX,
    preflight_path: PREFLIGHT_PATH,
    snapshot: () => Object.freeze({
      product_id: currentEditorId(),
      dirty,
      stale,
      baseline_version_token: baselineVersionToken || null,
      recovery_available: Boolean(readRecovery()),
    }),
    persist: (reason = 'manual') => writeRecovery(reason),
    recover: restoreRecovery,
    verify: () => verifyNotStale(currentEditorId()),
  });
})();