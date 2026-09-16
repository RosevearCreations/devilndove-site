// Release 467 Build 69 — bounded cleanup with explicit unused-record classification.
// Release 467 Build 160 — settle cleanup from the already-proven core Product handoff while
// the live cleanup refresh runs independently. Permanent removal still requires live preflight.
(() => {
  const BUILD160_CLEANUP_CORE_HANDOFF_VERSION = 'R467B160_CLEANUP_CORE_HANDOFF_V1';
  const PRODUCT_SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const LIVE_REFRESH_TIMEOUT_MS = 7000;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  let products = [];
  let liveLoadPromise = null;

  const health = window.DDProductCleanupBuild160Health = {
    version: BUILD160_CLEANUP_CORE_HANDOFF_VERSION,
    core_handoffs: 0,
    snapshot_handoffs: 0,
    live_refreshes: 0,
    live_refresh_timeouts: 0,
    product_count: 0,
    last_source: '',
    last_error: '',
  };

  function node(id) { return document.getElementById(id); }
  function enforceCanonicalCleanupLane() {
    if (document.getElementById('ddBuild69CanonicalCleanupLane')) return;
    const style = document.createElement('style');
    style.id = 'ddBuild69CanonicalCleanupLane';
    style.textContent = '#productsTableBody [data-draft-cleanup="1"]{display:none!important}';
    document.head.appendChild(style);
  }
  async function readApiJson(response, fallbackMessage) {
    if (window.DDAuth?.readApiJson) return window.DDAuth.readApiJson(response, { fallbackMessage });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage);
    return data;
  }
  function message(text = '', kind = '') {
    const target = node('productCleanupMessage');
    if (!target) return;
    target.hidden = !text;
    target.textContent = text;
    target.className = `small ${kind === 'error' ? 'is-error' : kind === 'success' ? 'is-success' : ''}`;
  }
  function candidateRows() {
    const status = String(node('productCleanupStatus')?.value || 'draft').toLowerCase();
    const search = String(node('productCleanupSearch')?.value || '').trim().toLowerCase();
    return products.filter((product) => {
      const productStatus = String(product.status || 'draft').toLowerCase();
      if (!['draft', 'archived'].includes(productStatus)) return false;
      if (status !== 'all' && productStatus !== status) return false;
      if (!search) return true;
      return [product.product_id, product.product_number, product.name, product.sku, product.slug]
        .map((value) => String(value || '').toLowerCase()).join(' ').includes(search);
    });
  }
  function label(product) {
    return [product.name || `Product ${product.product_id}`, product.product_number ? `DD${product.product_number}` : '', product.sku || '']
      .filter(Boolean).join(' · ');
  }
  function chooseRemovalReason(product) {
    const choice = prompt(
      `Classify why ${label(product || {})} is safe to remove:\n\n` +
      '1 — Unused duplicate\n' +
      '2 — Abandoned draft\n' +
      '3 — Test / acceptance record\n' +
      '4 — Incorrect record replaced by a corrected Product\n' +
      '5 — Other unused record\n\n' +
      'Enter 1, 2, 3, 4, or 5. Cancel leaves the Product unchanged.'
    );
    if (choice === null) return null;
    const key = String(choice || '').trim();
    const standard = {
      '1': '[unused_duplicate] Unused duplicate Product record confirmed during cleanup.',
      '2': '[abandoned_draft] Abandoned draft Product record no longer required.',
      '3': '[test_record] Test or acceptance Product record no longer required.',
      '4': '[replaced_incorrect_record] Incorrect Product record replaced by a corrected Product.'
    };
    if (standard[key]) return standard[key];
    if (key !== '5') throw new Error('Choose a cleanup classification from 1 through 5.');
    const detail = prompt('Describe why this unused Product record can be permanently removed (at least 8 characters).');
    if (detail === null) return null;
    const clean = String(detail || '').trim();
    if (clean.length < 8) throw new Error('The cleanup reason must be at least 8 characters.');
    return `[other_unused] ${clean.slice(0, 400)}`;
  }
  function render() {
    const mount = node('productCleanupList');
    if (!mount) return;
    const rows = candidateRows();
    if (!rows.length) {
      mount.innerHTML = '<p class="small">No matching draft or archived products were found.</p>';
      return;
    }
    mount.innerHTML = rows.map((product) => {
      const status = String(product.status || 'draft').toLowerCase();
      return `<article class="product-cleanup-row" data-cleanup-row="${Number(product.product_id || 0)}">
        <div>
          <strong>${esc(label(product))}</strong>
          <div class="small">Row ID ${Number(product.product_id || 0)} · ${esc(status)} · review ${esc(product.review_status || 'pending_review')}</div>
          <div class="small">${Number(product.image_count || 0)} image row(s) · ${Number(product.linked_resource_count || 0)} linked resource(s)</div>
        </div>
        <div class="product-cleanup-row-actions">
          <button class="btn" type="button" data-cleanup-preflight="${Number(product.product_id || 0)}">Check removal</button>
          ${status === 'draft' ? `<button class="btn" type="button" data-cleanup-archive="${Number(product.product_id || 0)}">Archive</button>` : ''}
          <button class="btn danger" type="button" data-cleanup-delete="${Number(product.product_id || 0)}" disabled>Permanent remove</button>
        </div>
        <div class="product-cleanup-preflight" data-cleanup-result="${Number(product.product_id || 0)}"><span class="small">Run the safety check before permanent removal.</span></div>
      </article>`;
    }).join('');
  }
  function adoptProducts(rows, source, { snapshot = false } = {}) {
    const next = Array.isArray(rows) ? rows : [];
    if (!next.length) return false;
    products = next;
    health.product_count = next.length;
    health.last_source = String(source || 'core Product handoff');
    if (snapshot) health.snapshot_handoffs += 1;
    else health.core_handoffs += 1;
    render();
    const count = candidateRows().length;
    message(`${count} cleanup candidate${count === 1 ? '' : 's'} shown from ${health.last_source}. Live safety preflight is still required before permanent removal.`, 'success');
    return true;
  }
  function readCoreSnapshot() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PRODUCT_SNAPSHOT_KEY) || 'null');
      const rows = Array.isArray(parsed?.products) ? parsed.products : [];
      return { rows, cachedAt: String(parsed?.cached_at || '') };
    } catch {
      return { rows: [], cachedAt: '' };
    }
  }
  async function load(options = {}) {
    if (liveLoadPromise) return liveLoadPromise;
    const announceLoading = options.announceLoading !== false && products.length === 0;
    if (announceLoading) message('Loading draft and archive cleanup candidates…');
    health.live_refreshes += 1;
    liveLoadPromise = (async () => {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      let timeout = 0;
      if (controller) timeout = window.setTimeout(() => controller.abort('build160-cleanup-live-refresh-timeout'), LIVE_REFRESH_TIMEOUT_MS);
      try {
        if (!window.DDAuth?.apiFetch) throw new Error('Authenticated Product API is not ready yet.');
        const response = await window.DDAuth.apiFetch('/api/admin/products', controller ? { signal: controller.signal } : {});
        const data = await readApiJson(response, 'Products could not load.');
        products = Array.isArray(data.products) ? data.products : [];
        health.product_count = products.length;
        health.last_source = String(data.delivery || 'live Product authority');
        health.last_error = '';
        render();
        const count = candidateRows().length;
        message(`${count} cleanup candidate${count === 1 ? '' : 's'} shown.`, 'success');
        return true;
      } catch (error) {
        const reason = String(error?.message || error || 'Cleanup candidates could not load.');
        health.last_error = reason;
        if (error?.name === 'AbortError' || /timeout|aborted/i.test(reason)) health.live_refresh_timeouts += 1;
        if (products.length) {
          const count = candidateRows().length;
          message(`${count} cleanup candidate${count === 1 ? '' : 's'} shown from core Product data. Live cleanup refresh is deferred; permanent removal remains protected by live preflight.`, 'success');
          return false;
        }
        const snapshot = readCoreSnapshot();
        if (adoptProducts(snapshot.rows, snapshot.cachedAt ? `saved Product snapshot ${snapshot.cachedAt}` : 'saved Product snapshot', { snapshot: true })) return false;
        message(reason, 'error');
        const cached = localStorage.getItem('dd_admin_products_cache_v3');
        try {
          const parsed = JSON.parse(cached || '{}');
          products = Array.isArray(parsed.products) ? parsed.products : [];
          if (products.length) {
            render();
            message('Live data is unavailable. Showing the last saved product snapshot; permanent removal remains disabled until live preflight succeeds.', 'error');
          }
        } catch {}
        return false;
      } finally {
        if (timeout) window.clearTimeout(timeout);
      }
    })().finally(() => { liveLoadPromise = null; });
    return liveLoadPromise;
  }
  async function preflight(productId) {
    const result = document.querySelector(`[data-cleanup-result="${productId}"]`);
    const deleteButton = document.querySelector(`[data-cleanup-delete="${productId}"]`);
    if (deleteButton) deleteButton.disabled = true;
    if (result) result.innerHTML = '<span class="small">Checking references…</span>';
    const response = await window.DDAuth.apiFetch(`/api/admin/delete-product?product_id=${encodeURIComponent(productId)}`, { cache: 'no-store' });
    const data = await readApiJson(response, 'Removal preflight failed.');
    const blockers = Array.isArray(data.blocking_references) ? data.blocking_references : [];
    const materials = Array.isArray(data.materials) ? data.materials : [];
    const materialReviewRows = Array.isArray(data.materials_requiring_review) ? data.materials_requiring_review : [];
    const historyAllowsRemoval = Number(data.history_allows_removal || 0) === 1;
    const deletionAllowed = Number(data.deletion_allowed || 0) === 1;
    const allowed = deletionAllowed && materialReviewRows.length === 0;
    if (result) {
      if (!historyAllowsRemoval) {
        result.innerHTML = `<span class="status-pill is-error">Archive only</span><p class="small">${blockers.length} protected reference type${blockers.length === 1 ? '' : 's'} found. Orders, accounting, inventory, content, customer, and other retained history keep this Product identity permanent. Open the reference inspector before changing its lifecycle state.</p><button class="btn" type="button" data-cleanup-inspect="${productId}">Inspect protected references</button>`;
      } else if (materialReviewRows.length) {
        result.innerHTML = `<span class="status-pill is-warning">Inventory review required</span><p class="small">${materialReviewRows.length} linked material row(s) may involve reserved stock. Review the quantities before removal.</p><button class="btn" type="button" data-open-product-correction="${productId}">Review linked materials &amp; remove</button>`;
      } else {
        const recipeNote = materials.length
          ? ` ${materials.length} linked recipe/material row(s) will be discarded with this unused record; main inventory quantities will not change.`
          : '';
        result.innerHTML = `<span class="status-pill is-success">Unused record eligible</span><p class="small">No protected business/history references were found. Classify the record explicitly before permanent removal. Product-owned editor rows will be removed and reusable media will be detached.${recipeNote}</p>`;
      }
    }
    if (deleteButton) deleteButton.disabled = !allowed;
    if (!historyAllowsRemoval && window.DDProductReferenceInspector?.open) {
      const product = products.find((row) => Number(row.product_id) === Number(productId));
      window.DDProductReferenceInspector.open(data, { productId, productName: label(product || data.product || {}) });
    }
    return { data, allowed, materialReviewRows };
  }
  async function remove(productId) {
    const product = products.find((row) => Number(row.product_id) === Number(productId));
    const checked = await preflight(productId);
    if (!checked.allowed) throw new Error((checked.materialReviewRows || []).length ? 'Reserved linked materials require the full Correct / remove panel so inventory actions can be reviewed.' : 'This record has protected history and must remain archived.');
    const deletionReason = chooseRemovalReason(product || checked.data?.product || {});
    if (!deletionReason) return;
    if (!confirm(`Permanently remove ${label(product || {})}?\n\n${deletionReason}\n\nThis removes only the unused record. Product numbers remain retired. Protected history would have blocked this operation.`)) return;
    const phrase = prompt('Type DELETE PRODUCT exactly.');
    if (phrase === null) return;
    const password = prompt('Enter your current administrator password.');
    if (password === null) return;
    const response = await window.DDAuth.apiFetch('/api/admin/delete-product', {
      method: 'POST',
      body: JSON.stringify({
        product_id: Number(productId),
        confirmation_phrase: phrase,
        confirm_password: password,
        deletion_reason: deletionReason
      })
    });
    const data = await readApiJson(response, 'Product could not be removed.');
    message(data.message || 'Product removed.', 'success');
    document.dispatchEvent(new CustomEvent('dd:product-deleted', { detail: { product_id: Number(productId), product: data.product || null } }));
    await load({ announceLoading: false });
  }
  async function archive(productId) {
    const product = products.find((row) => Number(row.product_id) === Number(productId));
    if (!confirm('Archive this draft? It will remain available in the Archived cleanup list and any protected history will remain attached.')) return;
    const response = await window.DDAuth.apiFetch('/api/admin/archive-product', {
      method: 'POST',
      body: JSON.stringify({
        product_id: Number(productId),
        expected_updated_at: String(product?.updated_at || ''),
        archive_reason: 'Archived from Draft & Archive Cleanup during Product correction review.'
      })
    });
    const data = await readApiJson(response, 'Product could not be archived.');
    message(data.message || 'Product archived.', 'success');
    document.dispatchEvent(new CustomEvent('dd:product-archived', { detail: { product_id: Number(productId), product: data.product || null } }));
    await load({ announceLoading: false });
  }
  function bind() {
    node('refreshProductCleanup')?.addEventListener('click', () => { void load({ announceLoading: products.length === 0 }); });
    node('productCleanupSearch')?.addEventListener('input', render);
    node('productCleanupStatus')?.addEventListener('change', render);
    node('productCleanupList')?.addEventListener('click', async (event) => {
      const check = event.target.closest('[data-cleanup-preflight]');
      const inspect = event.target.closest('[data-cleanup-inspect]');
      const removeButton = event.target.closest('[data-cleanup-delete]');
      const archiveButton = event.target.closest('[data-cleanup-archive]');
      try {
        if (check) await preflight(Number(check.dataset.cleanupPreflight || 0));
        if (inspect) await preflight(Number(inspect.dataset.cleanupInspect || 0));
        if (removeButton) await remove(Number(removeButton.dataset.cleanupDelete || 0));
        if (archiveButton) await archive(Number(archiveButton.dataset.cleanupArchive || 0));
      } catch (error) { message(error.message || 'Cleanup action failed.', 'error'); }
    });
    document.addEventListener('dd:products-core-recovered', (event) => {
      const rows = Array.isArray(event?.detail?.products) ? event.detail.products : [];
      if (rows.length) adoptProducts(rows, String(event?.detail?.source || 'live core Product handoff'));
    });
    document.addEventListener('dd:product-created', () => { void load({ announceLoading: false }); });
    document.addEventListener('dd:product-updated', () => { void load({ announceLoading: false }); });
    document.addEventListener('dd:product-archived', () => { void load({ announceLoading: false }); });
    document.addEventListener('dd:product-deleted', () => { void load({ announceLoading: false }); });
  }
  document.addEventListener('DOMContentLoaded', () => {
    enforceCanonicalCleanupLane();
    bind();
    const snapshot = readCoreSnapshot();
    const hydrated = adoptProducts(snapshot.rows, snapshot.cachedAt ? `saved Product snapshot ${snapshot.cachedAt}` : 'saved Product snapshot', { snapshot: true });
    void load({ announceLoading: !hydrated });
  });
})();
