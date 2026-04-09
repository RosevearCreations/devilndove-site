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
  const draftProductIdInput = document.getElementById('mobileDraftProductId');
  const draftSearchInput = document.getElementById('mobileDraftSearch');
  const draftSelect = document.getElementById('mobileDraftSelect');
  const draftSummary = document.getElementById('mobileDraftSummary');
  const draftReadiness = document.getElementById('mobileDraftReadiness');
  const refreshDraftsButton = document.getElementById('mobileRefreshDraftsButton');

  let bootstrap = null;
  let drafts = [];
  let selectedMap = new Map();
  let loadedDraft = null;

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
  function centsToDollars(value) {
    const cents = Number(value || 0);
    if (!Number.isFinite(cents) || cents <= 0) return '';
    return (cents / 100).toFixed(2);
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
  function getResources() { return Array.isArray(bootstrap?.resources) ? bootstrap.resources : []; }
  function selectedList() { return Array.from(selectedMap.values()).sort((a, b) => a.sort_order - b.sort_order); }
  function setField(name, value) {
    const field = form?.elements?.[name];
    if (!field) return;
    field.value = value == null ? '' : String(value);
  }

  function renderImages() {
    if (!imagePreviewEl || !imageInput) return;
    const files = Array.from(imageInput.files || []);
    const existing = loadedDraft?.images || [];
    const fileHtml = files.map((file) => {
      const url = URL.createObjectURL(file);
      return `<div class="mobile-image-preview-card"><img src="${url}" alt="${escapeHtml(file.name)}"/><div class="small">${escapeHtml(file.name)}</div></div>`;
    }).join('');
    const existingHtml = files.length ? '' : existing.map((image) => `<div class="mobile-image-preview-card"><img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.alt_text || loadedDraft?.name || 'Draft image')}"/><div class="small">Saved draft image</div></div>`).join('');
    imagePreviewEl.innerHTML = fileHtml || existingHtml;
  }

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
      renderDraftReadiness(loadedDraft);
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
      renderDraftReadiness(loadedDraft);
    }));
  }

  function draftChecklist(draft) {
    const liveDraft = draft || {};
    const imageCount = Number(liveDraft.image_count || (liveDraft.images || []).length || 0);
    const checks = [
      { label: 'Name', done: !!String(liveDraft.name || '').trim() },
      { label: 'Category', done: !!String(liveDraft.product_category || '').trim() },
      { label: 'Price', done: Number(liveDraft.price_cents || 0) > 0 },
      { label: 'Photo', done: imageCount > 0 || !!String(liveDraft.featured_image_url || '').trim() },
      { label: 'Story', done: !!String(liveDraft.short_description || liveDraft.description || '').trim() },
      { label: 'SEO basics', done: !!String(liveDraft.meta_title || '').trim() && !!String(liveDraft.meta_description || '').trim() },
      { label: 'Linked resources', done: selectedList().length > 0 }
    ];
    return { checks, imageCount };
  }

  function renderDraftReadiness(draft) {
    if (!draftReadiness) return;
    if (!draft) {
      draftReadiness.innerHTML = '<div class="small">Select a saved draft to see what is still missing before it is ready for fuller review.</div>';
      return;
    }
    const { checks, imageCount } = draftChecklist(draft);
    const missing = checks.filter((row) => !row.done);
    const ready = checks.filter((row) => row.done).length;
    draftReadiness.innerHTML = `
      <div class="mobile-draft-status-head">
        <div>
          <strong>${escapeHtml(draft.name || draft.capture_reference || `DD${draft.product_number || draft.product_id}`)}</strong>
          <div class="small">DD${String(draft.product_number || '').padStart(4,'0')} · ${escapeHtml(draft.status || 'draft')} · ${escapeHtml(draft.review_status || 'pending_review')} · ${imageCount} images · ${selectedList().length} linked resources</div>
        </div>
        <div class="small">Last updated: ${escapeHtml(draft.updated_at || '—')}</div>
      </div>
      <div class="mobile-readiness-chip-row">${checks.map((row) => `<span class="mobile-readiness-chip${row.done ? ' is-done' : ' is-missing'}">${escapeHtml(row.label)}</span>`).join('')}</div>
      <div class="small" style="margin-top:8px">${missing.length ? `Still missing: ${escapeHtml(missing.map((row) => row.label).join(', '))}.` : 'This draft now has the main basics filled in for later review and refinement.'}</div>
      <div class="small">${ready} of ${checks.length} quick mobile checks complete.</div>
    `;
  }

  function resetFormState(message = 'Ready for the next product.') {
    if (form) form.reset();
    if (draftProductIdInput) draftProductIdInput.value = '';
    loadedDraft = null;
    selectedMap = new Map();
    renderImages();
    renderSelectedResources();
    renderResourceGrid();
    renderDraftReadiness(null);
    if (draftSummary) draftSummary.textContent = 'Choose a draft to load it into the form.';
    setMessage(message);
  }

  function applyDraft(draft) {
    if (!draft || !form) return;
    loadedDraft = draft;
    if (draftProductIdInput) draftProductIdInput.value = String(draft.product_id || '');
    if (draftSelect) draftSelect.value = String(draft.product_id || '');
    setField('name', draft.name);
    setField('product_category', draft.product_category);
    setField('color_name', draft.color_name);
    setField('price', centsToDollars(draft.price_cents));
    setField('compare_at_price', centsToDollars(draft.compare_at_price_cents));
    setField('inventory_quantity', draft.inventory_quantity || 1);
    setField('shipping_code', draft.shipping_code);
    setField('tax_class_id', draft.tax_class_id || '');
    setField('weight_grams', draft.weight_grams || '');
    setField('capture_reference', draft.capture_reference);
    setField('sku', draft.sku);
    setField('short_description', draft.short_description);
    setField('description', draft.description);
    setField('meta_title', draft.meta_title || '');
    setField('keywords', draft.keywords || '');
    setField('meta_description', draft.meta_description || '');
    imageInput.value = '';
    selectedMap = new Map((draft.resource_links || []).map((row, index) => {
      const resource = getResources().find((entry) => entry.item_kind === row.resource_kind && entry.source_key === row.source_key);
      const key = `${row.resource_kind}:${row.source_key}`;
      return [key, {
        key,
        resource_kind: row.resource_kind,
        source_key: row.source_key,
        name: resource?.name || row.source_key,
        quantity_used: Number(row.quantity_used || 1),
        usage_notes: row.usage_notes || '',
        sort_order: index
      }];
    }));
    renderImages();
    renderSelectedResources();
    renderResourceGrid();
    renderDraftReadiness(draft);
    if (draftSummary) draftSummary.textContent = `Editing draft DD${String(draft.product_number || '').padStart(4, '0')} · ${draft.name || draft.capture_reference || 'Unnamed draft'} · ${draft.image_count || 0} images · ${draft.linked_resource_count || 0} linked resources.`;
    setMessage(`Loaded draft #${draft.product_number || draft.product_id}. Continue working without leaving this screen.`);
  }

  function renderDraftOptions(selectedId = null) {
    if (!draftSelect) return;
    const query = String(draftSearchInput?.value || '').trim().toLowerCase();
    let filtered = drafts.filter((row) => !query || [row.name, row.capture_reference, row.slug, row.sku, `dd${row.product_number}`].join(' ').toLowerCase().includes(query));
    const keepId = String(selectedId || loadedDraft?.product_id || '');
    if (keepId && !filtered.some((row) => String(row.product_id) === keepId)) {
      const current = drafts.find((row) => String(row.product_id) === keepId);
      if (current) filtered = [current, ...filtered];
    }
    draftSelect.innerHTML = '<option value="">Start a new draft</option>' + filtered.map((row) => `<option value="${row.product_id}">DD${String(row.product_number || '').padStart(4,'0')} · ${escapeHtml(row.name || row.capture_reference || row.slug || 'Draft')} · ${escapeHtml(row.updated_at || '')}</option>`).join('');
    if (keepId && filtered.some((row) => String(row.product_id) === keepId)) draftSelect.value = keepId;
    if (draftSummary && !loadedDraft) draftSummary.textContent = filtered.length ? `${filtered.length} draft products ready to continue in this screen.` : 'No draft products matched that search yet.';
  }

  async function loadDrafts(selectedId = null) {
    if (!window.DDAuth?.isLoggedIn()) return;
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/mobile-product-drafts?status=draft&limit=50');
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to load draft products.');
      drafts = Array.isArray(data.drafts) ? data.drafts : [];
      renderDraftOptions(selectedId);
      if (selectedId) {
        const selected = drafts.find((row) => String(row.product_id) === String(selectedId));
        if (selected) applyDraft(selected);
      }
    } catch (error) {
      if (draftSummary) draftSummary.textContent = error.message || 'Could not load draft products.';
    }
  }

  async function loadBootstrap(selectedDraftId = null) {
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
      await loadDrafts(selectedDraftId);
    } catch (error) {
      setAccess(error.message || 'Could not load admin mobile product tools.', true);
    }
  }

  if (imageInput) imageInput.addEventListener('change', () => { renderImages(); renderDraftReadiness(loadedDraft); });
  if (resourceSearch) resourceSearch.addEventListener('input', renderResourceGrid);
  if (resourceKindFilter) resourceKindFilter.addEventListener('change', renderResourceGrid);
  if (inStockOnly) inStockOnly.addEventListener('change', renderResourceGrid);
  if (refreshButton) refreshButton.addEventListener('click', () => loadBootstrap(draftProductIdInput?.value || null));
  if (refreshDraftsButton) refreshDraftsButton.addEventListener('click', () => loadDrafts(draftProductIdInput?.value || null));
  if (draftSearchInput) draftSearchInput.addEventListener('input', () => renderDraftOptions(draftProductIdInput?.value || null));
  if (draftSelect) draftSelect.addEventListener('change', () => {
    const draft = drafts.find((row) => String(row.product_id) === String(draftSelect.value || ''));
    if (!draft) return resetFormState('Ready for a new draft.');
    applyDraft(draft);
  });
  if (resetButton) resetButton.addEventListener('click', async () => {
    resetFormState();
    await loadBootstrap();
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
      const originalText = submitButton?.textContent || 'Save partial draft';
      const existingProductId = draftProductIdInput?.value || '';
      try {
        if (submitButton) { submitButton.disabled = true; submitButton.textContent = existingProductId ? 'Updating…' : 'Saving…'; }
        const response = await window.DDAuth.apiFetch('/api/admin/mobile-create-product', { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to save product.');
        const savedProductId = String(data.product?.product_id || existingProductId || '');
        if (existingProductId) {
          setMessage(`Updated draft product #${data.product?.product_number || '—'} and kept it open for continued editing.`);
          await loadBootstrap(savedProductId);
        } else {
          setMessage(`Saved product #${data.product?.product_number || '—'} for review. Ready for the next product.`);
          resetFormState('Ready for the next product.');
          if (draftSearchInput) draftSearchInput.value = '';
          await loadBootstrap();
        }
      } catch (error) {
        setMessage(error.message || 'Failed to save product.', true);
      } finally {
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalText; }
      }
    });
  }

  loadBootstrap();
});
