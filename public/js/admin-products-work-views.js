// Release 467 Build 99 — Product Work Views & Browser Sort.
// Release 467 Build 155 — bound row observation so descendant Product enhancements cannot retrigger sorting.
// Browser-local only: reuses the Product snapshot and existing Product/readiness controls.
(() => {
  const WORK_VIEWS_KEY = 'dd_catalog_work_views_v1';
  const SORT_KEY = 'dd_catalog_work_sort_v1';
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const SORT_VALUES = ['source', 'number_asc', 'number_desc', 'name_asc', 'name_desc', 'readiness_low', 'readiness_high', 'stock_low', 'updated_newest'];
  const MAX_VIEWS = 8;
  let sortState = 'source';
  let sortTimer = 0;
  let observer = null;
  let tableBody = null;
  let observerSuppressed = false;

  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function loadJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function snapshotProducts() {
    const payload = loadJson(SNAPSHOT_KEY, null);
    return payload && Array.isArray(payload.products) ? payload.products : [];
  }

  function rowProductId(row) {
    return Number(row?.querySelector?.('[data-edit-product-id]')?.dataset?.editProductId || 0) || 0;
  }

  function productMap() {
    return new Map(snapshotProducts().map((product, index) => [Number(product?.product_id || 0), { product, index }]));
  }

  function readinessScore(row) {
    const text = String(row?.querySelector?.('.product-readiness-inline strong')?.textContent || '');
    const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
    return match ? Number(match[1]) : null;
  }

  function compareText(a, b) {
    return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity: 'base', numeric: true });
  }

  function numberValue(value) {
    const numeric = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
  }

  function dateValue(value) {
    const timestamp = Date.parse(String(value || ''));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function sortRows(rows) {
    const map = productMap();
    const list = rows.map((row) => {
      const id = rowProductId(row);
      const entry = map.get(id) || { product: {}, index: Number.MAX_SAFE_INTEGER };
      return { id, row, product: entry.product || {}, index: entry.index, readiness: readinessScore(row) };
    });
    const byName = (left, right) => compareText(left.product?.name || left.row?.children?.[1]?.textContent, right.product?.name || right.row?.children?.[1]?.textContent);
    const byNumber = (left, right) => {
      const a = left.product?.product_number ?? left.product?.product_id ?? left.id;
      const b = right.product?.product_number ?? right.product?.product_id ?? right.id;
      const numeric = numberValue(a) - numberValue(b);
      return numeric || compareText(a, b) || byName(left, right);
    };
    const nullLast = (value, fallback) => Number.isFinite(value) ? value : fallback;
    list.sort((left, right) => {
      if (sortState === 'number_asc') return byNumber(left, right);
      if (sortState === 'number_desc') return -byNumber(left, right);
      if (sortState === 'name_asc') return byName(left, right) || byNumber(left, right);
      if (sortState === 'name_desc') return -byName(left, right) || byNumber(left, right);
      if (sortState === 'readiness_low') return nullLast(left.readiness, 1000) - nullLast(right.readiness, 1000) || byName(left, right);
      if (sortState === 'readiness_high') return nullLast(right.readiness, -1) - nullLast(left.readiness, -1) || byName(left, right);
      if (sortState === 'stock_low') {
        const a = numberValue(left.product?.inventory_quantity ?? left.product?.on_hand_quantity ?? left.product?.stock_quantity);
        const b = numberValue(right.product?.inventory_quantity ?? right.product?.on_hand_quantity ?? right.product?.stock_quantity);
        return a - b || byName(left, right);
      }
      if (sortState === 'updated_newest') return dateValue(right.product?.updated_at || right.product?.created_at) - dateValue(left.product?.updated_at || left.product?.created_at) || byName(left, right);
      return left.index - right.index || byNumber(left, right);
    });
    return list.map((item) => item.row);
  }

  function connectObserver() {
    if (!observer || !tableBody || observerSuppressed) return;
    // Direct children only. Descendant readiness/marketplace DOM writes must never retrigger row sorting.
    observer.observe(tableBody, { childList: true, subtree: false });
  }

  function applySort() {
    if (!tableBody) tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    const rows = [...tableBody.querySelectorAll(':scope > tr')].filter((row) => rowProductId(row));
    if (rows.length < 2) return;
    const sorted = sortRows(rows);
    if (!sorted.some((row, index) => row !== rows[index])) return;

    observerSuppressed = true;
    observer?.disconnect();
    try {
      const fragment = document.createDocumentFragment();
      sorted.forEach((row) => fragment.appendChild(row));
      tableBody.appendChild(fragment);
    } finally {
      observerSuppressed = false;
      connectObserver();
    }
  }

  function scheduleSort(delay = 40) {
    if (sortTimer) window.clearTimeout(sortTimer);
    sortTimer = window.setTimeout(() => {
      sortTimer = 0;
      applySort();
    }, delay);
  }

  function loadSort() {
    const saved = String(loadJson(SORT_KEY, 'source') || 'source');
    sortState = SORT_VALUES.includes(saved) ? saved : 'source';
  }

  function setSort(next) {
    sortState = SORT_VALUES.includes(next) ? next : 'source';
    saveJson(SORT_KEY, sortState);
    const select = document.getElementById('catalogWorkSort');
    if (select && select.value !== sortState) select.value = sortState;
    scheduleSort(0);
    renderStateSummary();
  }

  function loadViews() {
    const rows = loadJson(WORK_VIEWS_KEY, []);
    return Array.isArray(rows) ? rows.filter((row) => row && typeof row === 'object' && String(row.name || '').trim()).slice(0, MAX_VIEWS) : [];
  }

  function saveViews(rows) {
    saveJson(WORK_VIEWS_KEY, (Array.isArray(rows) ? rows : []).slice(0, MAX_VIEWS));
  }

  function activeDataset(selector, key, fallback) {
    const node = document.querySelector(`${selector}[aria-pressed="true"]`);
    return String(node?.dataset?.[key] || fallback);
  }

  function captureView() {
    const search = document.getElementById('catalogProductSearch');
    return {
      query: String(search?.value || '').slice(0, 160),
      focus: activeDataset('[data-product-focus-filter]', 'productFocusFilter', 'all'),
      triage: activeDataset('[data-readiness-triage]', 'readinessTriage', 'all'),
      sort: sortState,
      prefs: {
        hideSlug: document.getElementById('prefHideSlug')?.checked ? 1 : 0,
        hideSku: document.getElementById('prefHideSku')?.checked ? 1 : 0,
        hideShipping: document.getElementById('prefHideShipping')?.checked ? 1 : 0,
        hideTax: document.getElementById('prefHideTax')?.checked ? 1 : 0,
        compactInventory: document.getElementById('prefCompactInventory')?.checked ? 1 : 0,
      },
    };
  }

  function setMessage(text, isError = false) {
    const node = document.getElementById('catalogWorkViewMessage');
    if (!node) return;
    node.textContent = String(text || '');
    node.dataset.state = isError ? 'error' : 'ok';
  }

  function dispatchInput(node) { node?.dispatchEvent(new Event('input', { bubbles: true })); }
  function dispatchChange(node) { node?.dispatchEvent(new Event('change', { bubbles: true })); }

  function applyView(view) {
    if (!view) return;
    const search = document.getElementById('catalogProductSearch');
    if (search) { search.value = String(view.query || '').slice(0, 160); dispatchInput(search); }
    document.querySelector(`[data-product-focus-filter="${CSS.escape(String(view.focus || 'all'))}"]`)?.click();
    document.querySelector(`[data-readiness-triage="${CSS.escape(String(view.triage || 'all'))}"]`)?.click();
    const prefMap = {
      prefHideSlug: 'hideSlug', prefHideSku: 'hideSku', prefHideShipping: 'hideShipping',
      prefHideTax: 'hideTax', prefCompactInventory: 'compactInventory',
    };
    let changedPref = null;
    Object.entries(prefMap).forEach(([id, key]) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.checked = Boolean(view.prefs?.[key]);
      changedPref ||= input;
    });
    if (changedPref) dispatchChange(changedPref);
    setSort(String(view.sort || 'source'));
    setMessage(`Applied saved Product work view “${view.name}”.`);
  }

  function saveCurrentView() {
    const input = document.getElementById('catalogWorkViewName');
    const name = String(input?.value || '').trim().replace(/\s+/g, ' ').slice(0, 48);
    if (!name) { setMessage('Enter a short name before saving this Product work view.', true); input?.focus(); return; }
    const rows = loadViews();
    const index = rows.findIndex((row) => String(row.name || '').toLowerCase() === name.toLowerCase());
    if (index < 0 && rows.length >= MAX_VIEWS) { setMessage(`This browser already has ${MAX_VIEWS} saved Product work views. Delete one before adding another.`, true); return; }
    const next = { name, ...captureView(), saved_at: new Date().toISOString() };
    if (index >= 0) rows.splice(index, 1, next); else rows.push(next);
    saveViews(rows);
    if (input) input.value = '';
    renderSavedViews();
    setMessage(index >= 0 ? `Updated saved Product work view “${name}”.` : `Saved Product work view “${name}” in this browser.`);
  }

  function deleteView(index) {
    const rows = loadViews();
    if (!rows[index]) return;
    const [removed] = rows.splice(index, 1);
    saveViews(rows);
    renderSavedViews();
    setMessage(`Deleted saved Product work view “${removed.name}” from this browser.`);
  }

  function renderSavedViews() {
    const target = document.getElementById('catalogSavedWorkViews');
    if (!target) return;
    const rows = loadViews();
    target.innerHTML = rows.length ? rows.map((view, index) => `
      <div class="product-work-view-item">
        <div><strong>${esc(view.name)}</strong><div class="small">${esc(String(view.focus || 'all').replaceAll('_', ' '))} · ${esc(String(view.triage || 'all'))} · ${esc(String(view.sort || 'source').replaceAll('_', ' '))}${view.query ? ` · “${esc(view.query)}”` : ''}</div></div>
        <div class="product-work-view-actions"><button class="btn small" type="button" data-apply-work-view="${index}">Apply</button><button class="btn small secondary" type="button" data-delete-work-view="${index}">Delete</button></div>
      </div>`).join('') : '<div class="small">No saved Product work views in this browser yet.</div>';
  }

  function renderStateSummary() {
    const node = document.getElementById('catalogWorkSortStatus');
    if (!node) return;
    const labels = {
      source: 'Original Product order', number_asc: 'System/Product number — ascending', number_desc: 'System/Product number — descending',
      name_asc: 'Name — A to Z', name_desc: 'Name — Z to A', readiness_low: 'Readiness — lowest first', readiness_high: 'Readiness — highest first',
      stock_low: 'Inventory — lowest first', updated_newest: 'Recently updated — newest first',
    };
    node.textContent = `${labels[sortState] || sortState}. Sorting only changes the browser row order.`;
  }

  function injectStyle() {
    if (document.getElementById('build99ProductWorkViewsStyle')) return;
    const style = document.createElement('style');
    style.id = 'build99ProductWorkViewsStyle';
    style.textContent = '.product-work-views{display:grid;gap:10px;margin-top:12px;padding:12px;border:1px solid var(--border,#2b3744);border-radius:12px}.product-work-view-controls{display:grid;grid-template-columns:minmax(180px,1fr) minmax(180px,1fr) auto;gap:8px;align-items:end}.product-work-view-list{display:grid;gap:8px}.product-work-view-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:10px;border:1px solid var(--border,#2b3744);border-radius:10px;align-items:center}.product-work-view-actions{display:flex;gap:6px;flex-wrap:wrap}@media(max-width:720px){.product-work-view-controls,.product-work-view-item{grid-template-columns:minmax(0,1fr)}}';
    document.head.appendChild(style);
  }

  function mountUi() {
    const browser = document.getElementById('catalogEnhancementCard');
    tableBody = document.getElementById('productsTableBody');
    if (!browser || !tableBody) return false;
    if (document.getElementById('catalogProductWorkViews')) return true;
    injectStyle();
    const section = document.createElement('section');
    section.id = 'catalogProductWorkViews';
    section.className = 'product-work-views';
    section.innerHTML = `
      <div><h4>Product work views &amp; sort</h4><div class="small">Save this browser’s current Product search, focus, readiness triage, visible-column preferences and row sort as a reusable view. Saved views never change Product data.</div></div>
      <button class="btn small secondary" id="catalogResetWorkSort" type="button">Reset row order</button>
      <div class="product-work-view-controls">
        <label><span class="small">Browser row order</span><select class="input" id="catalogWorkSort"><option value="source">Original Product order</option><option value="number_asc">System/Product number — ascending</option><option value="number_desc">System/Product number — descending</option><option value="name_asc">Name — A to Z</option><option value="name_desc">Name — Z to A</option><option value="readiness_low">Readiness — lowest first</option><option value="readiness_high">Readiness — highest first</option><option value="stock_low">Inventory — lowest first</option><option value="updated_newest">Recently updated — newest first</option></select></label>
        <label><span class="small">Save current work view</span><input class="input" id="catalogWorkViewName" type="text" maxlength="48" placeholder="e.g. Media blockers" autocomplete="off"/></label>
        <button class="btn" id="catalogSaveWorkView" type="button">Save current view</button>
      </div>
      <div id="catalogWorkSortStatus" class="small" role="status"></div><div id="catalogWorkViewMessage" class="small" role="status"></div><div id="catalogSavedWorkViews" class="product-work-view-list"></div>`;
    const queue = browser.querySelector('.product-readiness-work-queue');
    if (queue) browser.insertBefore(section, queue); else browser.appendChild(section);

    const sortSelect = document.getElementById('catalogWorkSort');
    if (sortSelect) sortSelect.value = sortState;
    sortSelect?.addEventListener('change', (event) => setSort(String(event.target?.value || 'source')));
    document.getElementById('catalogResetWorkSort')?.addEventListener('click', () => setSort('source'));
    document.getElementById('catalogSaveWorkView')?.addEventListener('click', saveCurrentView);
    document.getElementById('catalogWorkViewName')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); saveCurrentView(); } });
    section.addEventListener('click', (event) => {
      const apply = event.target.closest('[data-apply-work-view]');
      if (apply) { applyView(loadViews()[Number(apply.dataset.applyWorkView || -1)]); return; }
      const remove = event.target.closest('[data-delete-work-view]');
      if (remove) deleteView(Number(remove.dataset.deleteWorkView || -1));
    });

    renderSavedViews();
    renderStateSummary();
    scheduleSort(0);

    observer = new MutationObserver((records) => {
      if (observerSuppressed) return;
      // Only direct Product-row additions/removals are relevant. Descendant enhancement writes are ignored.
      if ((records || []).some((record) => record.target === tableBody && (record.addedNodes?.length || record.removedNodes?.length))) scheduleSort(80);
    });
    connectObserver();
    ['dd:product-created', 'dd:product-updated', 'dd:product-deleted', 'dd:product-archived'].forEach((eventName) => document.addEventListener(eventName, () => scheduleSort(250)));
    return true;
  }

  function init(attempt = 0) {
    if (document.body?.dataset?.adminPage !== 'products') return;
    loadSort();
    if (mountUi()) return;
    if (attempt < 12) window.setTimeout(() => init(attempt + 1), 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
})();
