// Release 467 Build 96 — Product browser search, focus filters, and current Product context.
document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth) return;
  const mount = document.getElementById('productsAdminMount');
  const tableWrap = document.querySelector('.products-admin-table-wrap');
  const tableBody = document.getElementById('productsTableBody');
  if (!mount || !tableWrap || !tableBody) return;

  const PREF_KEY = 'dd_catalog_table_prefs_v1';
  const FILTER_KEY = 'dd_catalog_table_filter_v1';
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  let dashboardRefreshTimer = 0;
  let currentProductId = Number(window.DDCurrentProductEditorId || 0) || 0;
  let currentProductName = '';
  let snapshotProducts = [];

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadPrefs() {
    try {
      return {
        hideSlug: 0,
        hideSku: 0,
        hideShipping: 0,
        hideTax: 0,
        compactInventory: 1,
        ...(JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {})
      };
    } catch {
      return { hideSlug: 0, hideSku: 0, hideShipping: 0, hideTax: 0, compactInventory: 1 };
    }
  }

  function savePrefs(next) {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(next || {})); } catch {}
  }

  function loadFilterState() {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTER_KEY) || '{}') || {};
      const focus = ['all', 'attention', 'drafts', 'low_stock', 'missing_image'].includes(saved.focus) ? saved.focus : 'all';
      return { query: String(saved.query || '').slice(0, 160), focus };
    } catch {
      return { query: '', focus: 'all' };
    }
  }

  function saveFilterState() {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(filterState)); } catch {}
  }

  function readProductSnapshot() {
    try {
      const payload = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
      return payload && Array.isArray(payload.products) ? payload : null;
    } catch {
      return null;
    }
  }

  let prefs = loadPrefs();
  let filterState = loadFilterState();

  function applyColumnPrefs() {
    const table = document.querySelector('.products-admin-table');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    const hiddenIndexes = new Set();
    if (prefs.hideSlug) hiddenIndexes.add(2);
    if (prefs.hideSku) hiddenIndexes.add(3);
    if (prefs.hideShipping) hiddenIndexes.add(8);
    if (prefs.hideTax) hiddenIndexes.add(9);
    rows.forEach((row) => {
      row.querySelectorAll('th,td').forEach((cell, idx) => {
        const nextDisplay = hiddenIndexes.has(idx) ? 'none' : '';
        if (cell.style.display !== nextDisplay) cell.style.display = nextDisplay;
        if (idx === 7) {
          const smalls = cell.querySelectorAll('.small');
          smalls.forEach((el, sIdx) => {
            const next = prefs.compactInventory && sIdx > 1 ? 'none' : '';
            if (el.style.display !== next) el.style.display = next;
          });
        }
      });
    });
    syncPreferenceControls();
  }

  function syncPreferenceControls() {
    const map = {
      prefHideSlug: prefs.hideSlug,
      prefHideSku: prefs.hideSku,
      prefHideShipping: prefs.hideShipping,
      prefHideTax: prefs.hideTax,
      prefCompactInventory: prefs.compactInventory,
    };
    Object.entries(map).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.checked = !!value;
    });
  }

  function applyPreset(name) {
    if (name === 'essential') {
      prefs = { hideSlug: 1, hideSku: 1, hideShipping: 1, hideTax: 1, compactInventory: 1 };
    } else {
      prefs = { hideSlug: 0, hideSku: 0, hideShipping: 0, hideTax: 0, compactInventory: 0 };
    }
    savePrefs(prefs);
    applyColumnPrefs();
    const message = document.getElementById('catalogTableViewMessage');
    if (message) message.textContent = name === 'essential'
      ? 'Essential view active: identity, type, status, price, inventory, and actions remain visible.'
      : 'Full view active: all Product table columns are visible.';
  }

  function productForRow(row) {
    const id = Number(row?.querySelector?.('[data-edit-product-id]')?.dataset?.editProductId || 0) || 0;
    return snapshotProducts.find((product) => Number(product?.product_id || 0) === id) || { product_id: id };
  }

  function productSearchText(product, row) {
    return [
      product?.product_id,
      product?.product_number,
      product?.name,
      product?.slug,
      product?.sku,
      product?.product_type,
      product?.product_category,
      product?.status,
      product?.review_status,
      product?.color_name,
      product?.color_names_text,
      row?.textContent,
    ].map((value) => String(value || '').toLowerCase()).join(' ');
  }

  function matchesFocus(product) {
    const status = String(product?.status || '').toLowerCase();
    const review = String(product?.review_status || '').toLowerCase();
    const lowStock = Number(product?.low_stock_flag || 0) === 1;
    const missingImage = !String(product?.featured_image_url || '').trim();
    if (filterState.focus === 'drafts') return status === 'draft';
    if (filterState.focus === 'low_stock') return lowStock;
    if (filterState.focus === 'missing_image') return missingImage;
    if (filterState.focus === 'attention') return status === 'draft' || lowStock || missingImage || review === 'needs_changes';
    return true;
  }

  function focusCounts() {
    const counts = { all: snapshotProducts.length, attention: 0, drafts: 0, low_stock: 0, missing_image: 0 };
    snapshotProducts.forEach((product) => {
      const status = String(product?.status || '').toLowerCase();
      const review = String(product?.review_status || '').toLowerCase();
      const lowStock = Number(product?.low_stock_flag || 0) === 1;
      const missingImage = !String(product?.featured_image_url || '').trim();
      if (status === 'draft') counts.drafts += 1;
      if (lowStock) counts.low_stock += 1;
      if (missingImage) counts.missing_image += 1;
      if (status === 'draft' || lowStock || missingImage || review === 'needs_changes') counts.attention += 1;
    });
    return counts;
  }

  function syncFilterControls() {
    const input = document.getElementById('catalogProductSearch');
    if (input && input.value !== filterState.query) input.value = filterState.query;
    const counts = focusCounts();
    const labels = {
      all: 'All products',
      attention: 'Needs attention',
      drafts: 'Drafts',
      low_stock: 'Low stock',
      missing_image: 'Missing lead image',
    };
    document.querySelectorAll('[data-product-focus-filter]').forEach((button) => {
      const key = button.dataset.productFocusFilter || 'all';
      const active = key === filterState.focus;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.textContent = `${labels[key] || key} (${Number(counts[key] || 0)})`;
    });
  }

  function applyProductFilters() {
    const snapshot = readProductSnapshot();
    snapshotProducts = Array.isArray(snapshot?.products) ? snapshot.products : snapshotProducts;
    const query = String(filterState.query || '').trim().toLowerCase();
    let shown = 0;
    let total = 0;
    tableBody.querySelectorAll('tr').forEach((row) => {
      const product = productForRow(row);
      if (!Number(product?.product_id || 0)) return;
      total += 1;
      const visible = matchesFocus(product) && (!query || productSearchText(product, row).includes(query));
      row.hidden = !visible;
      if (visible) shown += 1;
    });
    syncFilterControls();
    const status = document.getElementById('catalogProductFilterStatus');
    if (status) {
      const filterLabel = filterState.focus === 'all' ? 'all products' : String(filterState.focus).replaceAll('_', ' ');
      status.textContent = `${shown} of ${total} rendered Product rows shown${query ? ` for “${filterState.query}”` : ''} · ${filterLabel}. Filters only change this browser view.`;
    }
    renderCurrentContext();
  }

  function setFocusFilter(nextFocus) {
    filterState.focus = ['all', 'attention', 'drafts', 'low_stock', 'missing_image'].includes(nextFocus) ? nextFocus : 'all';
    saveFilterState();
    applyProductFilters();
  }

  function clearFilters() {
    filterState = { query: '', focus: 'all' };
    saveFilterState();
    applyProductFilters();
  }

  function currentRow() {
    if (!currentProductId) return null;
    const editButtons = tableBody.querySelectorAll('[data-edit-product-id]');
    for (const button of editButtons) {
      if (Number(button.dataset.editProductId || 0) === currentProductId) return button.closest('tr');
    }
    return null;
  }

  function renderCurrentContext() {
    tableBody.querySelectorAll('tr[data-current-product-row="1"]').forEach((row) => row.removeAttribute('data-current-product-row'));
    const row = currentRow();
    if (row) row.dataset.currentProductRow = '1';
    const context = document.getElementById('catalogCurrentProductContext');
    const locate = document.getElementById('locateCurrentProduct');
    if (context) {
      const hiddenByFilter = Boolean(row?.hidden);
      context.textContent = currentProductId
        ? `Current Product: #${currentProductId}${currentProductName ? ` — ${currentProductName}` : ''}${row ? hiddenByFilter ? '. Its row is currently hidden by the browser search/focus filter.' : '. The matching table row is highlighted.' : '. This Product is not present in the current rendered table.'}`
        : 'No Product is currently loaded in the editor.';
    }
    if (locate) {
      locate.disabled = !row;
      locate.setAttribute('aria-disabled', row ? 'false' : 'true');
      locate.textContent = row?.hidden ? 'Show current Product' : 'Locate current Product';
    }
  }

  function updateCurrentProduct(detail = null) {
    const product = detail?.product || detail || null;
    const id = Number(detail?.product_id || product?.product_id || product?.id || 0) || 0;
    if (id) currentProductId = id;
    const name = String(product?.name || product?.title || '').trim();
    if (name) currentProductName = name;
    renderCurrentContext();
  }

  function clearCurrentProduct(detail = null) {
    const deleted = Number(detail?.product_id || detail?.product?.product_id || 0) || 0;
    if (!deleted || deleted === currentProductId) {
      currentProductId = 0;
      currentProductName = '';
    }
    renderCurrentContext();
  }

  function ensureMount() {
    if (document.getElementById('catalogEnhancementCard')) return;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'catalogEnhancementCard';
    card.style.marginTop = '16px';
    card.innerHTML = `
      <h3 style="margin-top:0">Product browser</h3>
      <p class="small">Search and focus the Product records already loaded by this page. These controls are browser-local presentation tools and never change Product data or issue another Product database read.</p>
      <div id="catalogCurrentProductContext" class="small product-table-current-context" aria-live="polite">No Product is currently loaded in the editor.</div>
      <div class="product-table-filter-controls" style="margin-top:12px">
        <label class="product-table-search"><span class="small">Search loaded Products</span><input class="input" id="catalogProductSearch" type="search" maxlength="160" placeholder="Name, SKU, slug, type, status or number" autocomplete="off"/></label>
        <div class="product-table-focus-actions" role="group" aria-label="Product focus filters">
          <button class="btn secondary" type="button" data-product-focus-filter="all" aria-pressed="true">All products</button>
          <button class="btn secondary" type="button" data-product-focus-filter="attention" aria-pressed="false">Needs attention</button>
          <button class="btn secondary" type="button" data-product-focus-filter="drafts" aria-pressed="false">Drafts</button>
          <button class="btn secondary" type="button" data-product-focus-filter="low_stock" aria-pressed="false">Low stock</button>
          <button class="btn secondary" type="button" data-product-focus-filter="missing_image" aria-pressed="false">Missing lead image</button>
          <button class="btn secondary" id="catalogClearProductFilters" type="button">Clear search &amp; filters</button>
        </div>
        <div id="catalogProductFilterStatus" class="small" role="status" aria-live="polite"></div>
      </div>
      <div class="product-table-view-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <button class="btn" id="catalogEssentialColumns" type="button">Essential columns</button>
        <button class="btn secondary" id="catalogFullColumns" type="button">Full columns</button>
        <button class="btn secondary" id="locateCurrentProduct" type="button" disabled>Locate current Product</button>
      </div>
      <div id="catalogTableViewMessage" class="small" role="status" aria-live="polite" style="margin-top:8px"></div>
      <div id="catalogDashboardSource" class="small" style="margin:12px 0 10px">Dashboard summaries reuse the Product list snapshot already loaded by this page; this panel does not issue a second Product database read.</div>
      <div class="grid cols-4" id="catalogDashboardStats" style="gap:10px"></div>
      <details style="margin-top:12px">
        <summary>Fine-tune visible columns</summary>
        <div class="grid cols-5" style="gap:8px;margin-top:10px">
          <label class="small"><input type="checkbox" id="prefHideSlug" /> Hide slug</label>
          <label class="small"><input type="checkbox" id="prefHideSku" /> Hide SKU</label>
          <label class="small"><input type="checkbox" id="prefHideShipping" /> Hide shipping</label>
          <label class="small"><input type="checkbox" id="prefHideTax" /> Hide tax</label>
          <label class="small"><input type="checkbox" id="prefCompactInventory" /> Compact inventory details</label>
        </div>
      </details>
    `;
    mount.prepend(card);
    syncPreferenceControls();

    card.addEventListener('change', (event) => {
      if (!event.target.closest('#prefHideSlug,#prefHideSku,#prefHideShipping,#prefHideTax,#prefCompactInventory')) return;
      prefs = {
        hideSlug: document.getElementById('prefHideSlug').checked ? 1 : 0,
        hideSku: document.getElementById('prefHideSku').checked ? 1 : 0,
        hideShipping: document.getElementById('prefHideShipping').checked ? 1 : 0,
        hideTax: document.getElementById('prefHideTax').checked ? 1 : 0,
        compactInventory: document.getElementById('prefCompactInventory').checked ? 1 : 0,
      };
      savePrefs(prefs);
      applyColumnPrefs();
      const message = document.getElementById('catalogTableViewMessage');
      if (message) message.textContent = 'Custom Product table view saved in this browser.';
    });

    document.getElementById('catalogProductSearch')?.addEventListener('input', (event) => {
      filterState.query = String(event.target?.value || '').slice(0, 160);
      saveFilterState();
      applyProductFilters();
    });
    card.addEventListener('click', (event) => {
      const focusButton = event.target.closest('[data-product-focus-filter]');
      if (focusButton) setFocusFilter(focusButton.dataset.productFocusFilter || 'all');
    });
    document.getElementById('catalogClearProductFilters')?.addEventListener('click', clearFilters);
    document.getElementById('catalogEssentialColumns')?.addEventListener('click', () => applyPreset('essential'));
    document.getElementById('catalogFullColumns')?.addEventListener('click', () => applyPreset('full'));
    document.getElementById('locateCurrentProduct')?.addEventListener('click', () => {
      let row = currentRow();
      if (!row) return;
      if (row.hidden) {
        clearFilters();
        row = currentRow();
      }
      row?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      row?.querySelector('[data-edit-product-id]')?.focus({ preventScroll: true });
    });
  }

  function renderDashboardFromSnapshot() {
    const snapshot = readProductSnapshot();
    const statsEl = document.getElementById('catalogDashboardStats');
    const sourceEl = document.getElementById('catalogDashboardSource');
    if (!statsEl) return;

    snapshotProducts = Array.isArray(snapshot?.products) ? snapshot.products : [];
    if (!snapshotProducts.length) {
      statsEl.innerHTML = '<div class="small">Waiting for the primary Product list or a saved browser snapshot.</div>';
      if (sourceEl) sourceEl.textContent = 'Dashboard summaries are waiting for the primary Product list; no extra Product database read is being made.';
      syncFilterControls();
      return;
    }

    const products = snapshotProducts;
    const lowStock = products.filter((row) => Number(row.low_stock_flag || 0) === 1).length;
    const drafts = products.filter((row) => String(row.status || '').toLowerCase() === 'draft').length;
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const staleDrafts = products.filter((row) => String(row.status || '').toLowerCase() === 'draft' && String(row.updated_at || row.created_at || '') < cutoff).length;
    const externalListings = products.filter((row) => ['external_only','hybrid'].includes(String(row.sale_channel || '').toLowerCase())).length;
    const missingImages = products.filter((row) => !String(row.featured_image_url || '').trim()).length;

    statsEl.innerHTML = [
      ['Low stock', lowStock, 'Needs reorder or reserve review'],
      ['Drafts', drafts, 'Still not live'],
      ['Stale drafts', staleDrafts, 'Drafts older than 14 days'],
      ['External / hybrid', externalListings, 'Marketplace-linked products'],
      ['Missing lead image', missingImages, 'Still missing featured media'],
    ].map(([label, value, note]) => `<div class="card" style="margin:0"><strong>${esc(label)}</strong><div style="font-size:1.25rem;font-weight:700;margin-top:6px">${esc(String(value))}</div><div class="small" style="margin-top:6px">${esc(note)}</div></div>`).join('');

    if (sourceEl) sourceEl.textContent = `Dashboard summaries and Product focus filters use ${products.length} Product records from the shared browser snapshot${snapshot.cached_at ? ` saved ${snapshot.cached_at}` : ''}; no duplicate Product API read.`;
  }

  function scheduleDashboardRefresh(delay = 500) {
    if (dashboardRefreshTimer) window.clearTimeout(dashboardRefreshTimer);
    dashboardRefreshTimer = window.setTimeout(() => {
      dashboardRefreshTimer = 0;
      renderDashboardFromSnapshot();
      applyProductFilters();
    }, delay);
  }

  ensureMount();
  applyColumnPrefs();
  renderDashboardFromSnapshot();
  applyProductFilters();
  renderCurrentContext();
  scheduleDashboardRefresh(700);
  scheduleDashboardRefresh(1800);

  const observer = new MutationObserver(() => {
    applyColumnPrefs();
    applyProductFilters();
  });
  observer.observe(tableBody, { childList: true, subtree: true });

  document.addEventListener('dd:product-editor-target', (event) => updateCurrentProduct(event?.detail || null));
  document.addEventListener('dd:product-created', (event) => updateCurrentProduct(event?.detail || null));
  document.addEventListener('dd:product-updated', (event) => updateCurrentProduct(event?.detail || null));
  document.addEventListener('dd:product-autosaved-new', (event) => updateCurrentProduct(event?.detail || null));
  document.addEventListener('dd:product-deleted', (event) => clearCurrentProduct(event?.detail || null));

  ['dd:product-created', 'dd:product-updated', 'dd:product-deleted', 'dd:product-archived'].forEach((eventName) => {
    document.addEventListener(eventName, () => scheduleDashboardRefresh(900));
  });
});
