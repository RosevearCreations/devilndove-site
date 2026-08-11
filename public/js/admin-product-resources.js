// File: /public/js/admin-product-resources.js
// Brief description: Admin editor for linking tools and supplies to a product as
// a reusable making-story with quantity, cost, and inventory handling notes.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('productResourcesAdminMount');
  if (!mountEl) return;

  const requestedProductId = Number(new URLSearchParams(window.location.search).get('product_id') || 0);
  const state = {
    products: [],
    resources: [],
    links: [],
    selectedProductId: Number.isInteger(requestedProductId) && requestedProductId > 0 ? requestedProductId : 0,
    selectedLinkIndex: -1,
    selectedAvailableKey: '',
    productionPreview: null,
    productionHistory: [],
    productionOutputQuantity: 1,
    productionPosting: false
  };
  let initialLoadStarted = false;
  let rendered = false;
  let searchTimer = null;

  function escapeHtml(v) {
    return String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setMessage(msg, err = false) {
    const el = document.getElementById('productResourcesMessage');
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
    el.classList.toggle('is-error', Boolean(msg && err));
    el.classList.toggle('is-success', Boolean(msg && !err));
  }

  async function readJsonResponse(response, fallbackMessage) {
    return window.DDAuth.readApiJson(response, { fallbackMessage });
  }

  function describeUsageUnit(item) {
    const stockLabel = String(item?.stock_unit_label || 'unit').trim() || 'unit';
    const label = String(item?.usage_unit_label || item?.usage_unit_name || 'unit').trim() || 'unit';
    const perStock = Math.max(0.001, Number(item?.usage_units_per_stock_unit || 1) || 1);
    return { stockLabel, label, perStock };
  }

  function buildUsagePreview(link) {
    const resource = link?.resource || {};
    const usage = describeUsageUnit(resource);
    const onHandStock = Math.max(0, Number(resource?.on_hand_quantity || 0));
    const unitCostCents = Math.max(0, Number(resource?.unit_cost_cents || 0));
    const qtyUsed = Math.max(0.001, Number(link?.quantity_used || 1) || 1);
    const lotSize = Math.max(1, Number(link?.lot_size_units || 1) || 1);
    const mode = String(link?.consumption_mode || 'per_unit').trim() || 'per_unit';
    const totalUsageUnits = onHandStock * usage.perStock;
    const buildable = mode === 'end_of_lot'
      ? Math.floor((totalUsageUnits * lotSize) / qtyUsed)
      : Math.floor(totalUsageUnits / qtyUsed);
    const costPerUseCents = usage.perStock > 0 ? Math.round((unitCostCents * qtyUsed) / usage.perStock) : 0;
    const costPerFinishedCents = mode === 'end_of_lot' ? Math.round(costPerUseCents / lotSize) : costPerUseCents;
    return { usage, onHandStock, totalUsageUnits, buildable, costPerUseCents, costPerFinishedCents, mode, qtyUsed, lotSize };
  }


  function defaultQuantityUsed(item) {
    // A stock breakdown such as “1 tool = 100 uses” describes the inventory unit,
    // not how many uses a finished product consumes. New product links therefore
    // default to one use/batch unless the maker explicitly changes it.
    return 1;
  }

  function syncVisibleLinkEditorToState() {
    const editor = document.getElementById('productResourcesLinkedEditor');
    if (!editor) return;
    const qty = editor.querySelector('[data-link-qty]');
    if (qty) {
      const index = Number(qty.getAttribute('data-link-qty'));
      const row = state.links[index];
      if (row) row.quantity_used = Math.max(0.001, Number(qty.value || 1) || 1);
    }
    const mode = editor.querySelector('[data-link-mode]');
    if (mode) {
      const index = Number(mode.getAttribute('data-link-mode'));
      const row = state.links[index];
      if (row) row.consumption_mode = String(mode.value || 'per_unit').trim() || 'per_unit';
    }
    const lot = editor.querySelector('[data-link-lot]');
    if (lot) {
      const index = Number(lot.getAttribute('data-link-lot'));
      const row = state.links[index];
      if (row) row.lot_size_units = Math.max(1, Number(lot.value || 1) || 1);
    }
    const note = editor.querySelector('[data-link-note]');
    if (note) {
      const index = Number(note.getAttribute('data-link-note'));
      const row = state.links[index];
      if (row) row.usage_notes = String(note.value || '').trim();
    }
  }

  function formatMoney(cents) {
    const amount = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD' }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }

  function ensureValidSelections() {
    if (!state.links.length) {
      state.selectedLinkIndex = -1;
      return;
    }
    if (!Number.isInteger(state.selectedLinkIndex) || state.selectedLinkIndex < 0 || state.selectedLinkIndex >= state.links.length) {
      state.selectedLinkIndex = 0;
    }
  }

  function selectedLink() {
    ensureValidSelections();
    return state.selectedLinkIndex >= 0 ? state.links[state.selectedLinkIndex] : null;
  }

  function resourceOptionLabel(item) {
    const usage = describeUsageUnit(item);
    const cost = Number(item.unit_cost_cents || 0) > 0 ? ` • ${formatMoney(item.unit_cost_cents)}` : '';
    const asin = item.amazon_asin ? ` • ASIN ${item.amazon_asin}` : '';
    return `${item.name || item.source_key} (${item.item_kind || 'item'} • ${Number(item.on_hand_quantity || 0)} ${usage.stockLabel}${cost}${asin})`;
  }

  function render() {
    mountEl.innerHTML = `
      <div class="card resource-editor-dark" style="margin-top:18px">
        <h3 style="margin-top:0">Product Tools &amp; Supplies Used</h3>
        <p class="small" style="margin-top:0">Link the exact supplies and tools used to make a product. Add items from the dropdown, then select one linked item at a time to adjust how much was used.</p>
        <div class="small" id="productResourcesEditorHint" style="margin-bottom:12px">This section follows the current product editor record when you load, create, or update a product.</div>
        <div id="productResourcesMessage" class="small" style="display:none;margin-bottom:12px"></div>

        <div class="grid cols-2" style="gap:12px;margin-bottom:12px">
          <div>
            <label class="small" for="productResourcesProduct">Product</label>
            <select class="input" id="productResourcesProduct"></select>
          </div>
          <div>
            <label class="small" for="productResourcesSearch">Search tools/supplies</label>
            <input class="input" id="productResourcesSearch" type="search" placeholder="wax, pliers, resin, clay, file..." />
          </div>
        </div>

        <div class="grid cols-2" style="gap:16px;align-items:start">
          <div>
            <h4 style="margin-top:0">Available Items</h4>
            <div class="grid cols-2" style="gap:10px;margin-bottom:10px">
              <div>
                <label class="small" for="productResourcesAvailableSelect">Choose item to add</label>
                <select class="input" id="productResourcesAvailableSelect"></select>
              </div>
              <div style="display:flex;align-items:end;gap:8px;flex-wrap:wrap">
                <button class="btn" type="button" id="productResourcesAddSelectedButton">Add selected item</button>
              </div>
            </div>
            <div id="productResourcesGrid" class="resource-tile-grid"></div>
          </div>

          <div>
            <h4 style="margin-top:0">Linked To Product</h4>
            <div class="grid cols-2" style="gap:10px;margin-bottom:10px">
              <div>
                <label class="small" for="productResourcesLinkedSelect">Selected linked item</label>
                <select class="input" id="productResourcesLinkedSelect"></select>
              </div>
              <div style="display:flex;align-items:end;gap:8px;flex-wrap:wrap">
                <button class="btn" type="button" id="productResourcesRemoveSelectedButton">Remove selected item</button>
              </div>
            </div>
            <div id="productResourcesLinkedSummary" class="small" style="margin-bottom:8px"></div>
            <div id="productResourcesLinkedEditor" class="resource-linked-list"></div>
            <div style="margin-top:12px">
              <button class="btn" type="button" id="productResourcesSaveButton">Save Product Links</button>
            </div>
          </div>
        </div>

        <section class="product-production-release" aria-labelledby="productProductionReleaseHeading">
          <div class="product-production-release-head">
            <div>
              <h4 id="productProductionReleaseHeading">Finished Product Production Release</h4>
              <p class="small">After the product's tools and supplies are saved, preview a production run. Exact/estimated consumables are deducted fractionally; reusable/log-only items remain as evidence. The run keeps an immutable ingredient/material snapshot for the finished product.</p>
            </div>
            <img src="/assets/visual-placeholders/product-process.svg" alt="Representative finished-product making process" loading="lazy"/>
          </div>
          <div class="product-production-release-controls">
            <label class="small">Finished units made
              <input class="input" id="productProductionOutputQuantity" type="number" min="1" step="1" value="1"/>
            </label>
            <button class="btn" type="button" id="productProductionPreviewButton">Preview material release</button>
            <button class="btn primary" type="button" id="productProductionPostButton" disabled>Post finished production</button>
          </div>
          <div id="productProductionReleasePreview" class="product-production-release-preview small">Choose a product and preview the production release after saving its product links.</div>
        </section>
      </div>
    `;

    document.getElementById('productResourcesProduct')?.addEventListener('change', onProductChange);
    document.getElementById('productResourcesSearch')?.addEventListener('input', scheduleResourceSearch);
    document.getElementById('productResourcesSaveButton')?.addEventListener('click', saveLinks);
    document.getElementById('productResourcesAvailableSelect')?.addEventListener('change', (event) => {
      state.selectedAvailableKey = String(event.target.value || '');
    });
    document.getElementById('productResourcesLinkedSelect')?.addEventListener('change', (event) => {
      const index = Number(event.target.value || -1);
      state.selectedLinkIndex = Number.isInteger(index) ? index : -1;
      renderLinks();
    });
    document.getElementById('productResourcesAddSelectedButton')?.addEventListener('click', addSelectedAvailableItem);
    document.getElementById('productResourcesRemoveSelectedButton')?.addEventListener('click', removeSelectedLinkedItem);
    document.getElementById('productProductionOutputQuantity')?.addEventListener('input', (event) => {
      state.productionOutputQuantity = Math.max(1, Math.floor(Number(event.target.value || 1) || 1));
      state.productionPreview = null;
      renderProductionPreview();
    });
    document.getElementById('productProductionPreviewButton')?.addEventListener('click', previewProductionRelease);
    document.getElementById('productProductionPostButton')?.addEventListener('click', postProductionRelease);
    mountEl.addEventListener('click', onClick);
    mountEl.addEventListener('change', onInputChange);
    mountEl.addEventListener('input', onInputChange);
  }

  function syncSelectedProduct(productId, { autoLoad = true } = {}) {
    const safeProductId = Number(productId || 0);
    if (!safeProductId) return;
    state.selectedProductId = safeProductId;
    const select = document.getElementById('productResourcesProduct');
    if (select) select.value = String(safeProductId);
    if (autoLoad && window.DDAuth?.isLoggedIn()) loadData();
  }

  function renderProducts() {
    const sel = document.getElementById('productResourcesProduct');
    if (!sel) return;
    sel.innerHTML = `<option value="">Choose a product...</option>` +
      state.products.map((p) => `
        <option value="${p.product_id}" ${Number(p.product_id) === Number(state.selectedProductId) ? 'selected' : ''}>
          ${escapeHtml(p.name)} (${escapeHtml(p.status || '')})
        </option>
      `).join('');
  }

  function renderAvailableSelect() {
    const sel = document.getElementById('productResourcesAvailableSelect');
    if (!sel) return;
    const linkedKeys = new Set(state.links.map((x) => `${x.resource_kind}::${x.source_key}`));
    const available = state.resources.filter((item) => !linkedKeys.has(`${item.item_kind}::${item.source_key}`));
    if (!available.length) {
      sel.innerHTML = `<option value="">No unlinked tools or supplies available</option>`;
      state.selectedAvailableKey = '';
      return;
    }
    if (!state.selectedAvailableKey || !available.find((item) => `${item.item_kind}::${item.source_key}` === state.selectedAvailableKey)) {
      state.selectedAvailableKey = `${available[0].item_kind}::${available[0].source_key}`;
    }
    sel.innerHTML = available.map((item) => {
      const key = `${item.item_kind}::${item.source_key}`;
      return `<option value="${escapeHtml(key)}" ${key === state.selectedAvailableKey ? 'selected' : ''}>${escapeHtml(resourceOptionLabel(item))}</option>`;
    }).join('');
  }

  function renderResources() {
    const el = document.getElementById('productResourcesGrid');
    if (!el) return;
    if (!state.resources.length) {
      el.innerHTML = `<div class="small">No matching tools or supplies were found.</div>`;
      renderAvailableSelect();
      return;
    }
    const linkedKeys = new Set(state.links.map((x) => `${x.resource_kind}::${x.source_key}`));
    el.innerHTML = state.resources.map((item) => {
      const linked = linkedKeys.has(`${item.item_kind}::${item.source_key}`);
      const usageMeta = describeUsageUnit(item);
      return `
        <button type="button" class="resource-tile ${linked ? 'is-linked' : ''}" data-add-resource="1" data-kind="${escapeHtml(item.item_kind)}" data-key="${escapeHtml(item.source_key)}">
          <div class="resource-tile-media">
            ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" loading="lazy" />` : `<div class="resource-tile-placeholder">${escapeHtml(item.item_kind)}</div>`}
          </div>
          <div class="resource-tile-body">
            <strong>${escapeHtml(item.name)}</strong>
            <div class="small">${escapeHtml(item.item_kind)} • ${escapeHtml(item.category || item.subcategory || '')}</div>
            <div class="small">On hand ${Number(item.on_hand_quantity || 0)} ${escapeHtml(usageMeta.stockLabel)} • 1 ${escapeHtml(usageMeta.stockLabel)} = ${usageMeta.perStock} ${escapeHtml(usageMeta.label)}</div>
            <div class="small">Cost ${escapeHtml(formatMoney(item.unit_cost_cents || 0))} per ${escapeHtml(usageMeta.stockLabel)}${item.amazon_asin ? ` • ASIN ${escapeHtml(item.amazon_asin)}` : ''}</div>
            <div class="small">${Number(item.is_on_reorder_list || 0) === 1 ? 'On reorder list' : 'Normal stock'}${Number(item.do_not_reuse || 0) === 1 ? ' • do not reuse' : ''}</div>
          </div>
        </button>`;
    }).join('');
    renderAvailableSelect();
  }

  function renderLinkedSelect() {
    const sel = document.getElementById('productResourcesLinkedSelect');
    const summary = document.getElementById('productResourcesLinkedSummary');
    if (!sel) return;
    if (!state.links.length) {
      sel.innerHTML = `<option value="">No linked items yet</option>`;
      if (summary) summary.textContent = 'Add tools or supplies to build the making-story for this product.';
      state.selectedLinkIndex = -1;
      return;
    }
    ensureValidSelections();
    sel.innerHTML = state.links.map((link, idx) => {
      const usagePreview = buildUsagePreview(link);
      return `<option value="${idx}" ${idx === state.selectedLinkIndex ? 'selected' : ''}>${escapeHtml(link.name || link.source_key)} • ${escapeHtml(link.resource_kind)} • ${escapeHtml(String(usagePreview.qtyUsed))} ${escapeHtml(usagePreview.usage.label)}</option>`;
    }).join('');
    if (summary) summary.textContent = `${state.links.length} linked item(s). Select one to adjust quantity, usage mode, notes, and lot behavior.`;
  }

  function renderLinks() {
    const el = document.getElementById('productResourcesLinkedEditor');
    if (!el) return;
    renderLinkedSelect();
    const link = selectedLink();
    if (!link) {
      el.innerHTML = '<div class="small">No tools or supplies linked yet.</div>';
      return;
    }
    const usagePreview = buildUsagePreview(link);
    const usageMeta = usagePreview.usage;
    const mode = String(link.consumption_mode || 'per_unit');
    el.innerHTML = `
      <div class="resource-linked-card resource-linked-card-dark">
        <div class="resource-linked-summary">
          <strong>${escapeHtml(link.name || link.source_key)}</strong>
          <div class="small">${escapeHtml(link.resource_kind)} • 1 ${escapeHtml(usageMeta.stockLabel)} holds ${escapeHtml(String(usageMeta.perStock))} ${escapeHtml(usageMeta.label)}</div>
          <label class="small" style="display:block;margin-top:6px">How much per use / batch
            <input class="input" data-link-qty="${state.selectedLinkIndex}" type="number" min="0.001" step="0.001" value="${Math.max(0.001, Number(link.quantity_used || 1) || 1)}" />
          </label>
          <div class="small">Enter how many ${escapeHtml(usageMeta.label)} this product uses${mode === 'end_of_lot' ? ' per batch/lot' : ' per finished item'}.</div>
          <div class="small" style="margin-top:4px">Current stock ≈ ${escapeHtml(String(usagePreview.totalUsageUnits))} ${escapeHtml(usageMeta.label)} across ${escapeHtml(String(usagePreview.onHandStock))} ${escapeHtml(usageMeta.stockLabel)}.</div>
          <label class="small" style="display:block;margin-top:6px">Inventory handling
            <select class="input" data-link-mode="${state.selectedLinkIndex}">
              <option value="per_unit" ${mode === 'per_unit' ? 'selected' : ''}>Per product</option>
              <option value="end_of_lot" ${mode === 'end_of_lot' ? 'selected' : ''}>End of lot</option>
              <option value="story_only" ${mode === 'story_only' ? 'selected' : ''}>Story only</option>
            </select>
          </label>
          <label class="small" style="display:${mode === 'end_of_lot' ? 'block' : 'none'};margin-top:6px" data-link-lot-wrap="${state.selectedLinkIndex}">Products per lot / container
            <input class="input" data-link-lot="${state.selectedLinkIndex}" type="number" min="1" step="1" value="${Math.max(1, Number(link.lot_size_units || 1) || 1)}" />
          </label>
          <div class="small" style="margin-top:4px">${mode === 'end_of_lot' ? `End-of-lot spreads ${escapeHtml(usageMeta.label)} usage across multiple finished products without per-item reservation.` : (mode === 'story_only' ? 'Story only keeps this item in the making record without touching cost or stock math.' : `Per product treats the quantity as ${escapeHtml(usageMeta.label)} used on every finished item.`)}</div>
          <div class="small">Estimated cost ${escapeHtml(formatMoney(usagePreview.costPerFinishedCents))} per finished product${mode === 'end_of_lot' ? ` • lot covers about ${escapeHtml(String(usagePreview.lotSize))} finished products` : ''} • buildable now ≈ ${escapeHtml(String(Math.max(0, usagePreview.buildable)))}.</div>
          <textarea class="input" data-link-note="${state.selectedLinkIndex}" rows="2" placeholder="How was this item used for the story of this product?">${escapeHtml(link.usage_notes || '')}</textarea>
          ${String(link.resource_kind || '').toLowerCase() === 'supply' ? `
          <div class="resource-ingredient-profile">
            <label class="small"><input type="checkbox" data-link-ingredient="${state.selectedLinkIndex}" ${Number(link.is_label_ingredient || 0) === 1 ? 'checked' : ''}/> Include this supply in the finished-product ingredient / label snapshot</label>
            <div class="grid cols-3">
              <label class="small">Ingredient name — English<input class="input" data-link-ingredient-en="${state.selectedLinkIndex}" value="${escapeHtml(link.ingredient_name_en || link.name || '')}"/></label>
              <label class="small">Ingredient name — French<input class="input" data-link-ingredient-fr="${state.selectedLinkIndex}" value="${escapeHtml(link.ingredient_name_fr || '')}" placeholder="French draft/review"/></label>
              <label class="small">INCI name<input class="input" data-link-inci="${state.selectedLinkIndex}" value="${escapeHtml(link.inci_name || '')}" placeholder="Required for cosmetic ingredient labels"/></label>
            </div>
            <div class="small">For cosmetics, INCI is the ingredient-list authority. English/French display wording is supporting product/label copy and remains reviewable.</div>
          </div>` : ''}
        </div>
        <div class="resource-linked-actions">
          <button class="btn" type="button" data-remove-link="${state.selectedLinkIndex}">Remove</button>
        </div>
      </div>`;
  }

  function renderProductionPreview() {
    const el = document.getElementById('productProductionReleasePreview');
    const postButton = document.getElementById('productProductionPostButton');
    const qtyInput = document.getElementById('productProductionOutputQuantity');
    if (qtyInput) qtyInput.value = String(Math.max(1, Number(state.productionOutputQuantity || 1) || 1));
    if (!el) return;
    const preview = state.productionPreview;
    if (!state.selectedProductId) {
      el.innerHTML = 'Choose a product first.';
      if (postButton) postButton.disabled = true;
      return;
    }
    if (!preview) {
      el.innerHTML = 'Save Product Links after any edits, then preview the production release. No inventory changes are made by Preview.';
      if (postButton) postButton.disabled = true;
      return;
    }
    const blockers = Array.isArray(preview.blockers) ? preview.blockers : [];
    const materials = Array.isArray(preview.materials) ? preview.materials : [];
    const ingredients = Array.isArray(preview.ingredients) ? preview.ingredients : [];
    const consumables = materials.filter((row) => Number(row.stock_quantity_consumed || 0) > 0);
    const evidenceOnly = materials.filter((row) => !(Number(row.stock_quantity_consumed || 0) > 0));
    el.innerHTML = `
      <div class="product-production-summary ${blockers.length ? 'is-blocked' : 'is-ready'}">
        <strong>${blockers.length ? 'Production blocked — review the items below' : 'Ready to post finished production'}</strong>
        <span>${escapeHtml(String(preview.output_quantity || state.productionOutputQuantity))} finished unit(s) • estimated raw-material cost ${escapeHtml(formatMoney(preview.estimated_material_cost_cents || 0))}</span>
      </div>
      ${blockers.length ? `<ul class="product-production-blockers">${blockers.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
      <div class="product-production-material-grid">
        ${consumables.length ? consumables.map((row) => `<div><strong>${escapeHtml(row.item_name || row.source_key)}</strong><span>Deduct ${escapeHtml(String(row.stock_quantity_consumed))} ${escapeHtml(row.stock_unit_label || 'unit')} (${escapeHtml(String(row.usage_quantity))} ${escapeHtml(row.usage_unit_label || 'unit')})</span></div>`).join('') : '<div><strong>No measured consumables</strong><span>Only reusable/log-only evidence is linked.</span></div>'}
        ${evidenceOnly.slice(0, 8).map((row) => `<div><strong>${escapeHtml(row.item_name || row.source_key)}</strong><span>${escapeHtml(row.resource_kind || 'resource')} • ${escapeHtml(row.tracking_mode || 'log_only')} • no stock deduction</span></div>`).join('')}
      </div>
      <div class="product-production-ingredients"><strong>Ingredient snapshot (${ingredients.length})</strong>${ingredients.length ? `<span>${ingredients.map((row) => escapeHtml(row.inci_name || row.ingredient_name_en || '')).filter(Boolean).join(' • ')}</span>` : '<span>No label ingredients are marked for this product yet.</span>'}</div>
      ${state.productionHistory.length ? `<details><summary>Recent production releases (${state.productionHistory.length})</summary><div class="product-production-history">${state.productionHistory.slice(0, 10).map((row) => `<span>${escapeHtml(row.posted_at || '')} • ${escapeHtml(String(row.output_quantity || 0))} unit(s) • ${escapeHtml(row.run_status || '')}</span>`).join('')}</div></details>` : ''}
    `;
    if (postButton) postButton.disabled = Boolean(blockers.length || state.productionPosting || !Number(preview.ready));
  }

  async function previewProductionRelease() {
    if (!state.selectedProductId) return setMessage('Choose a product first.', true);
    try {
      state.productionOutputQuantity = Math.max(1, Math.floor(Number(document.getElementById('productProductionOutputQuantity')?.value || 1) || 1));
      setMessage('Previewing the finished-product material release…');
      const data = await window.DDAuth.apiJson(
        `/api/admin/product-production-release?product_id=${encodeURIComponent(state.selectedProductId)}&output_quantity=${encodeURIComponent(state.productionOutputQuantity)}`,
        { method: 'GET' },
        { fallbackMessage: 'Production release preview could not be loaded.', cacheKey: `product-production-preview:${state.selectedProductId}:${state.productionOutputQuantity}`, cacheTtlMs: 5000, retries: 1, staleOnError: false }
      );
      state.productionPreview = data.preview || null;
      state.productionHistory = Array.isArray(data.history) ? data.history : [];
      renderProductionPreview();
      setMessage(state.productionPreview?.ready ? 'Production preview is ready. Review the deductions before posting.' : 'Production preview has blockers. No inventory was changed.', !state.productionPreview?.ready);
    } catch (error) {
      state.productionPreview = null;
      renderProductionPreview();
      setMessage(error.message || 'Production release preview failed.', true);
    }
  }

  async function postProductionRelease() {
    const preview = state.productionPreview;
    if (!state.selectedProductId || !preview?.ready || state.productionPosting) return;
    const outputQuantity = Math.max(1, Number(preview.output_quantity || state.productionOutputQuantity || 1));
    if (!window.confirm(`Post ${outputQuantity} finished unit(s)? This will deduct only the reviewed exact/estimated raw materials and add the finished units to product inventory.`)) return;
    state.productionPosting = true;
    renderProductionPreview();
    try {
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await window.DDAuth.apiFetch('/api/admin/product-production-release', {
        method: 'POST',
        body: JSON.stringify({ action: 'post', product_id: state.selectedProductId, output_quantity: outputQuantity, idempotency_key: idempotencyKey })
      });
      const data = await readJsonResponse(response, 'Finished-product production could not be posted.');
      setMessage(data.message || 'Finished production posted.');
      state.productionPreview = data.preview || null;
      await previewProductionRelease();
    } catch (error) {
      setMessage(error.message || 'Finished-product production failed safely. Reload the preview before trying again.', true);
    } finally {
      state.productionPosting = false;
      renderProductionPreview();
    }
  }

  function hydrateLinks() {
    state.links = state.links.map((x) => {
      const resource = state.resources.find((r) => r.item_kind === x.resource_kind && r.source_key === x.source_key) || {};
      return {
        ...x,
        resource,
        name: resource.name || x.source_key,
        consumption_mode: x.consumption_mode || 'per_unit',
        lot_size_units: Math.max(1, Number(x.lot_size_units || 1) || 1),
        quantity_used: Math.max(0.001, Number(x.quantity_used || 1) || 1),
        is_label_ingredient: Number(x.is_label_ingredient || 0) === 1 ? 1 : 0,
        ingredient_name_en: x.ingredient_name_en || resource.name || '',
        ingredient_name_fr: x.ingredient_name_fr || '',
        inci_name: x.inci_name || ''
      };
    });
    ensureValidSelections();
  }

  async function loadBootstrap() {
    const productId = Number(state.selectedProductId || 0);
    const data = await window.DDAuth.apiJson(
      `/api/admin/product-resource-bootstrap?product_id=${encodeURIComponent(productId)}`,
      { method: 'GET' },
      {
        fallbackMessage: 'Failed to load product link information.',
        cacheKey: `product-resource-bootstrap:${productId}`,
        cacheTtlMs: 30000,
        retries: 2,
        staleOnError: true
      }
    );
    state.products = Array.isArray(data.products) ? data.products : [];
    state.links = Array.isArray(data.links) ? data.links : [];
    renderProducts();
    return data;
  }

  async function loadResources() {
    const q = String(document.getElementById('productResourcesSearch')?.value || '').trim();
    const data = await window.DDAuth.apiJson(
      `/api/admin/product-resource-search?q=${encodeURIComponent(q)}&limit=240`,
      { method: 'GET' },
      {
        fallbackMessage: 'Failed to search tools and supplies.',
        cacheKey: `product-resource-search:${q.toLowerCase()}`,
        cacheTtlMs: q ? 30000 : 90000,
        retries: 2,
        staleOnError: true
      }
    );
    state.resources = Array.isArray(data.resources) ? data.resources : [];
    return data;
  }

  async function loadData({ bootstrap = true, resources = true } = {}) {
    if (!window.DDAuth?.isLoggedIn()) return;
    try {
      const results = await Promise.all([
        bootstrap ? loadBootstrap() : Promise.resolve(null),
        resources ? loadResources() : Promise.resolve(null)
      ]);
      hydrateLinks();
      renderResources();
      renderLinks();
      renderProductionPreview();
      const stale = results.some((data) => data?._response_meta?.stale);
      setMessage(stale ? 'The server was temporarily busy. Showing the last saved resource list; retry when convenient.' : '', stale);
    } catch (err) {
      setMessage(err.message || 'Failed to load product resources.', true);
    }
  }

  function scheduleResourceSearch() {
    if (searchTimer) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => loadData({ bootstrap: false, resources: true }), 300);
  }

  function onProductChange(event) {
    state.selectedProductId = Number(event.target.value || 0);
    state.productionPreview = null;
    state.productionHistory = [];
    const url = new URL(window.location.href);
    if (state.selectedProductId > 0) url.searchParams.set('product_id', String(state.selectedProductId));
    else url.searchParams.delete('product_id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    loadData({ bootstrap: true, resources: false });
  }

  function onInputChange(event) {
    const qtyIndex = event.target.getAttribute('data-link-qty');
    if (qtyIndex != null) {
      const row = state.links[Number(qtyIndex)];
      if (row) row.quantity_used = Math.max(0.001, Number(event.target.value || 0.001) || 0.001);
      renderLinkedSelect();
      return;
    }
    const noteIndex = event.target.getAttribute('data-link-note');
    if (noteIndex != null) {
      const row = state.links[Number(noteIndex)];
      if (row) row.usage_notes = String(event.target.value || '').trim();
      return;
    }
    const ingredientIndex = event.target.getAttribute('data-link-ingredient');
    if (ingredientIndex != null) {
      const row = state.links[Number(ingredientIndex)];
      if (row) row.is_label_ingredient = event.target.checked ? 1 : 0;
      return;
    }
    const ingredientEnIndex = event.target.getAttribute('data-link-ingredient-en');
    if (ingredientEnIndex != null) {
      const row = state.links[Number(ingredientEnIndex)];
      if (row) row.ingredient_name_en = String(event.target.value || '').trim();
      return;
    }
    const ingredientFrIndex = event.target.getAttribute('data-link-ingredient-fr');
    if (ingredientFrIndex != null) {
      const row = state.links[Number(ingredientFrIndex)];
      if (row) row.ingredient_name_fr = String(event.target.value || '').trim();
      return;
    }
    const inciIndex = event.target.getAttribute('data-link-inci');
    if (inciIndex != null) {
      const row = state.links[Number(inciIndex)];
      if (row) row.inci_name = String(event.target.value || '').trim();
      return;
    }
    const modeIndex = event.target.getAttribute('data-link-mode');
    if (modeIndex != null) {
      const row = state.links[Number(modeIndex)];
      if (row) {
        row.consumption_mode = String(event.target.value || 'per_unit').trim() || 'per_unit';
        if (row.consumption_mode !== 'end_of_lot') row.lot_size_units = 1;
        renderLinks();
      }
      return;
    }
    const lotIndex = event.target.getAttribute('data-link-lot');
    if (lotIndex != null) {
      const row = state.links[Number(lotIndex)];
      if (row) row.lot_size_units = Math.max(1, Number(event.target.value || 1) || 1);
    }
  }

  function addResourceToLinks(item) {
    if (!item) return;
    const key = `${item.item_kind}::${item.source_key}`;
    const existingIndex = state.links.findIndex((x) => `${x.resource_kind}::${x.source_key}` === key);
    if (existingIndex === -1) {
      state.productionPreview = null;
      state.links.push({
        resource_kind: item.item_kind,
        source_key: item.source_key,
        quantity_used: defaultQuantityUsed(item),
        usage_notes: '',
        sort_order: state.links.length,
        name: item.name,
        resource: item,
        consumption_mode: 'per_unit',
        lot_size_units: 1,
        is_label_ingredient: 0,
        ingredient_name_en: item.name || '',
        ingredient_name_fr: '',
        inci_name: ''
      });
      state.selectedLinkIndex = state.links.length - 1;
    } else {
      state.selectedLinkIndex = existingIndex;
    }
    renderResources();
    renderLinks();
  }

  function addSelectedAvailableItem() {
    const [kind, sourceKey] = String(state.selectedAvailableKey || '').split('::');
    if (!kind || !sourceKey) return;
    const item = state.resources.find((x) => x.item_kind === kind && x.source_key === sourceKey);
    addResourceToLinks(item);
  }

  function removeSelectedLinkedItem() {
    ensureValidSelections();
    if (state.selectedLinkIndex < 0) return;
    state.productionPreview = null;
    state.links.splice(state.selectedLinkIndex, 1);
    if (state.selectedLinkIndex >= state.links.length) state.selectedLinkIndex = state.links.length - 1;
    renderResources();
    renderLinks();
  }

  function onClick(event) {
    const add = event.target.closest('[data-add-resource]');
    const remove = event.target.closest('[data-remove-link]');
    if (add) {
      const kind = add.getAttribute('data-kind') || '';
      const key = add.getAttribute('data-key') || '';
      const item = state.resources.find((x) => x.item_kind === kind && x.source_key === key);
      addResourceToLinks(item);
      return;
    }
    if (remove) {
      const idx = Number(remove.getAttribute('data-remove-link') || -1);
      if (idx >= 0) {
        state.links.splice(idx, 1);
        if (state.selectedLinkIndex >= state.links.length) state.selectedLinkIndex = state.links.length - 1;
        renderResources();
        renderLinks();
      }
    }
  }

  async function saveLinks() {
    if (!state.selectedProductId) {
      setMessage('Choose a product first.', true);
      return;
    }
    try {
      // Capture the live editor value immediately before save. This protects against
      // browser event ordering and makes “How much per use / batch” persist reliably
      // even when Save is clicked directly after typing.
      syncVisibleLinkEditorToState();
      setMessage('Saving product links...');
      const response = await window.DDAuth.apiFetch('/api/admin/product-resources', {
        method: 'POST',
        body: JSON.stringify({
          product_id: state.selectedProductId,
          links: state.links.map((x, i) => ({
            resource_kind: x.resource_kind,
            source_key: x.source_key,
            quantity_used: Math.max(0.001, Number(x.quantity_used || 1) || 1),
            usage_notes: x.usage_notes || '',
            consumption_mode: x.consumption_mode || 'per_unit',
            lot_size_units: Math.max(1, Number(x.lot_size_units || 1) || 1),
            is_label_ingredient: Number(x.is_label_ingredient || 0) === 1 ? 1 : 0,
            ingredient_name_en: x.ingredient_name_en || '',
            ingredient_name_fr: x.ingredient_name_fr || '',
            inci_name: x.inci_name || '',
            label_sort_order: i,
            sort_order: i
          }))
        })
      });
      const data = await readJsonResponse(response, 'Failed to save product links.');
      if (Array.isArray(data.links)) {
        state.links = data.links;
        hydrateLinks();
        renderLinks();
      }
      state.productionPreview = null;
      renderProductionPreview();
      setMessage(`Saved and verified ${Number(data.saved_links || 0)} linked items. Preview production again before posting finished inventory.`);
      await loadData({ bootstrap: true, resources: false });
    } catch (err) {
      setMessage(err.message || 'Failed to save product links.', true);
    }
  }

  function ensureRendered() {
    if (rendered) return;
    render();
    rendered = true;
  }

  function startInitialLoad() {
    ensureRendered();
    if (initialLoadStarted || !window.DDAuth?.isLoggedIn()) return;
    initialLoadStarted = true;
    loadData({ bootstrap: true, resources: true });
  }

  document.addEventListener('dd:catalog-options-updated', () => { if (window.DDAuth?.isLoggedIn()) loadData({ bootstrap: false, resources: true }); });
  document.addEventListener('dd:product-editor-target', (event) => {
    const productId = Number(event?.detail?.product_id || event?.detail?.product?.product_id || 0);
    if (productId) syncSelectedProduct(productId, { autoLoad: true });
  });
  document.addEventListener('dd:product-created', (event) => {
    const productId = Number(event?.detail?.product?.product_id || 0);
    if (productId) syncSelectedProduct(productId, { autoLoad: true });
  });
  document.addEventListener('dd:product-updated', (event) => {
    const productId = Number(event?.detail?.product?.product_id || event?.detail?.product_id || 0);
    if (productId) syncSelectedProduct(productId, { autoLoad: true });
  });
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) startInitialLoad(); });
  ensureRendered();
  if (window.DDAuth?.isLoggedIn()) startInitialLoad();
});
