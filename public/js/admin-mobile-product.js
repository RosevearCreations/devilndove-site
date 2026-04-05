document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('mobileProductForm');
  const messageEl = document.getElementById('mobileProductMessage');
  const accessEl = document.getElementById('mobileProductAccessMessage');
  const nextNumberEl = document.getElementById('mobileNextProductNumber');
  const categorySelect = document.getElementById('mobileProductCategory');
  const colorSelect = document.getElementById('mobileColorName');
  const shippingSelect = document.getElementById('mobileShippingCode');
  const taxSelect = document.getElementById('mobileTaxClassId');
  const imageInput = document.getElementById('mobileProductImages');
  const imagePreviewEl = document.getElementById('mobileImagePreview');
  const resourceGrid = document.getElementById('mobileResourceGrid');
  const selectedResourcesEl = document.getElementById('mobileSelectedResources');
  const resourceSearch = document.getElementById('mobileResourceSearch');
  const resourceKindFilter = document.getElementById('mobileResourceKindFilter');
  const inStockOnly = document.getElementById('mobileInStockOnly');
  const resourceSummary = document.getElementById('mobileResourceSummary');
  const refreshButton = document.getElementById('mobileRefreshBootstrapButton');
  const resetButton = document.getElementById('mobileResetForNextButton');

  let bootstrap = null;
  let selectedMap = new Map();

  function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message || '';
    messageEl.style.display = message ? 'block' : 'none';
    messageEl.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  function setAccess(message, isError = false) {
    if (!accessEl) return;
    accessEl.textContent = message || '';
    accessEl.style.display = message ? 'block' : 'none';
    accessEl.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  function dollarsToCents(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return 0;
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount < 0) return NaN;
    return Math.round(amount * 100);
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function fillSelect(select, options, placeholder) {
    if (!select) return;
    const rows = Array.isArray(options) ? options : [];
    select.innerHTML = `<option value="">${placeholder || 'Select'}</option>` + rows.map((row) => {
      if (typeof row === 'string') return `<option value="${escapeHtml(row)}">${escapeHtml(row)}</option>`;
      const value = row.value ?? row.tax_class_id ?? row.code ?? row.name ?? '';
      const label = row.label ?? (row.name ? `${row.name}${row.code ? ` (${row.code})` : ''}` : value);
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    }).join('');
  }
  function renderImages() {
    if (!imagePreviewEl || !imageInput) return;
    const files = Array.from(imageInput.files || []);
    imagePreviewEl.innerHTML = files.map((file) => {
      const url = URL.createObjectURL(file);
      return `<div class="mobile-image-preview-card"><img src="${url}" alt="${escapeHtml(file.name)}"/><div class="small">${escapeHtml(file.name)}</div></div>`;
    }).join('');
  }
  function getResources() { return Array.isArray(bootstrap?.resources) ? bootstrap.resources : []; }
  function selectedList() { return Array.from(selectedMap.values()).sort((a, b) => a.sort_order - b.sort_order); }

  function renderSelectedResources() {
    if (!selectedResourcesEl) return;
    const rows = selectedList();
    if (!rows.length) {
      selectedResourcesEl.innerHTML = '<div class="small">No tools or supplies selected yet.</div>';
      return;
    }
    selectedResourcesEl.innerHTML = rows.map((row) => `
      <div class="resource-linked-card">
        <div class="resource-linked-summary">
          <div><strong>${escapeHtml(row.name)}</strong> <span class="small">(${escapeHtml(row.resource_kind)})</span></div>
          <label class="small">Quantity used <input class="input mobile-inline-input" data-resource-qty="${escapeHtml(row.key)}" type="number" min="1" step="1" value="${Number(row.quantity_used || 1)}"/></label>
          <label class="small">Usage notes <input class="input" data-resource-notes="${escapeHtml(row.key)}" type="text" maxlength="180" value="${escapeHtml(row.usage_notes || '')}" placeholder="Optional note for story or workflow"/></label>
        </div>
        <div class="resource-linked-actions"><button class="btn" type="button" data-resource-remove="${escapeHtml(row.key)}">Remove</button></div>
      </div>
    `).join('');
    selectedResourcesEl.querySelectorAll('[data-resource-remove]').forEach((button) => button.addEventListener('click', () => {
      selectedMap.delete(button.dataset.resourceRemove);
      renderSelectedResources();
      renderResourceGrid();
    }));
    selectedResourcesEl.querySelectorAll('[data-resource-qty]').forEach((input) => input.addEventListener('input', () => {
      const row = selectedMap.get(input.dataset.resourceQty);
      if (row) row.quantity_used = Math.max(1, Number(input.value || 1) || 1);
    }));
    selectedResourcesEl.querySelectorAll('[data-resource-notes]').forEach((input) => input.addEventListener('input', () => {
      const row = selectedMap.get(input.dataset.resourceNotes);
      if (row) row.usage_notes = input.value || '';
    }));
  }

  function renderResourceGrid() {
    if (!resourceGrid) return;
    const q = String(resourceSearch?.value || '').trim().toLowerCase();
    const kind = String(resourceKindFilter?.value || 'all').trim().toLowerCase();
    const onlyInStock = !!inStockOnly?.checked;
    const allRows = getResources();
    const rows = allRows
      .filter((row) => kind === 'all' || row.item_kind === kind)
      .filter((row) => !onlyInStock || Number(row.on_hand_quantity || 0) > 0)
      .filter((row) => !q || [row.name, row.category, row.subcategory, row.item_kind].join(' ').toLowerCase().includes(q))
      .sort((a, b) => {
        const qtyDiff = Number(b.on_hand_quantity || 0) - Number(a.on_hand_quantity || 0);
        return qtyDiff || String(a.name || '').localeCompare(String(b.name || ''));
      });
    if (resourceSummary) {
      const inStockCount = allRows.filter((row) => Number(row.on_hand_quantity || 0) > 0).length;
      resourceSummary.textContent = `Showing ${rows.length} of ${allRows.length} resources. ${inStockCount} currently have stock on hand.`;
    }
    resourceGrid.innerHTML = rows.map((row) => {
      const key = `${row.item_kind}:${row.source_key}`;
      const selected = selectedMap.has(key);
      const qty = Number(row.on_hand_quantity || 0);
      const reorderPoint = Number(row.reorder_point || 0);
      const statusBits = [qty > 0 ? `On hand: ${qty}` : 'Out of stock'];
      if (reorderPoint > 0) statusBits.push(`Reorder at ${reorderPoint}`);
      if (Number(row.is_on_reorder_list || 0) === 1) statusBits.push('On reorder list');
      if (Number(row.do_not_reuse || 0) === 1) statusBits.push('Do not reuse');
      return `<button type="button" class="resource-tile${selected ? ' is-linked' : ''}" data-resource-key="${escapeHtml(key)}"><div class="resource-tile-media">${row.image_url ? `<img src="${escapeHtml(row.image_url)}" alt="${escapeHtml(row.name)}"/>` : `<div class="resource-tile-placeholder">${escapeHtml(row.item_kind)}</div>`}</div><div class="resource-tile-body"><div><strong>${escapeHtml(row.name)}</strong></div><div class="small">${escapeHtml(row.item_kind)} · ${escapeHtml(row.category || row.subcategory || '')}</div><div class="small">${escapeHtml(statusBits.join(' • '))}</div></div></button>`;
    }).join('');
    resourceGrid.querySelectorAll('[data-resource-key]').forEach((button) => button.addEventListener('click', () => {
      const [resourceKind, sourceKey] = String(button.dataset.resourceKey || '').split(':');
      const row = getResources().find((entry) => entry.item_kind === resourceKind && entry.source_key === sourceKey);
      if (!row) return;
      const key = `${resourceKind}:${sourceKey}`;
      if (selectedMap.has(key)) selectedMap.delete(key);
      else selectedMap.set(key, { key, resource_kind: resourceKind, source_key: sourceKey, name: row.name, quantity_used: 1, usage_notes: '', sort_order: selectedMap.size });
      renderSelectedResources();
      renderResourceGrid();
    }));
  }

  async function loadBootstrap() {
    setMessage('');
    setAccess('');
    try {
      if (!window.DDAuth?.isLoggedIn()) {
        setAccess('Please log in with an admin account first.', true);
        return;
      }
      const response = await window.DDAuth.apiFetch('/api/admin/product-mobile-bootstrap');
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to load mobile product tools.');
      bootstrap = data;
      nextNumberEl.textContent = String(data.next_product_number || '—');
      fillSelect(categorySelect, data.category_options || [], 'Select a category');
      fillSelect(colorSelect, data.color_options || [], 'Choose a colour');
      fillSelect(shippingSelect, data.shipping_code_options || [], 'Select shipping code');
      fillSelect(taxSelect, (data.tax_classes || []).map((row) => ({ value: row.tax_class_id, label: `${row.name}${row.code ? ` (${row.code})` : ''}` })), 'No tax class');
      renderSelectedResources();
      renderResourceGrid();
    } catch (error) {
      setAccess(error.message || 'Could not load admin mobile product tools.', true);
    }
  }

  if (imageInput) imageInput.addEventListener('change', renderImages);
  if (resourceSearch) resourceSearch.addEventListener('input', renderResourceGrid);
  if (resourceKindFilter) resourceKindFilter.addEventListener('change', renderResourceGrid);
  if (inStockOnly) inStockOnly.addEventListener('change', renderResourceGrid);
  if (refreshButton) refreshButton.addEventListener('click', loadBootstrap);
  if (resetButton) resetButton.addEventListener('click', () => {
    form.reset();
    selectedMap = new Map();
    renderImages();
    renderSelectedResources();
    renderResourceGrid();
    setMessage('Ready for the next product.');
    loadBootstrap();
  });

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage('');
      const priceCents = dollarsToCents(form.elements.price.value);
      const compareAtPriceCents = String(form.elements.compare_at_price.value || '').trim() ? dollarsToCents(form.elements.compare_at_price.value) : '';
      if (Number.isNaN(priceCents)) return setMessage('Price must be a valid amount.', true);
      if (compareAtPriceCents !== '' && Number.isNaN(compareAtPriceCents)) return setMessage('Compare-at price must be a valid amount.', true);
      const formData = new FormData(form);
      formData.set('price_cents', String(priceCents));
      if (compareAtPriceCents !== '') formData.set('compare_at_price_cents', String(compareAtPriceCents));
      formData.set('resource_links_json', JSON.stringify(selectedList().map((row, index) => ({ resource_kind: row.resource_kind, source_key: row.source_key, quantity_used: row.quantity_used || 1, usage_notes: row.usage_notes || '', sort_order: index }))));
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent || 'Save draft for review';
      try {
        if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Saving...'; }
        const response = await window.DDAuth.apiFetch('/api/admin/mobile-create-product', { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to save product.');
        setMessage(`Saved product #${data.product?.product_number || '—'} for review.`);
        form.reset();
        selectedMap = new Map();
        renderImages();
        renderSelectedResources();
        await loadBootstrap();
      } catch (error) {
        setMessage(error.message || 'Failed to save product.', true);
      } finally {
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
      }
    });
  }

  loadBootstrap();
});
