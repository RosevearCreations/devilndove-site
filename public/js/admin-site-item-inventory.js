// File: /public/js/admin-site-item-inventory.js
// Brief description: Admin editor for tools and supplies inventory, reorder queues,
// do-not-reuse flags, supplier/source details, packaging-source capture, movement history, and bulk cost updates.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('siteInventoryAdminMount');
  if (!mountEl) return;

  let rendered = false;
  let catalogSeedOptions = [];
  let categorySeedOptions = [];
  let processOptions = [];
  let stationToolOptions = [];
  // Render must be safe before the async inventory bootstrap returns. Keep the
  // same defaults as /api/admin/inventory-bootstrap, then allow the API to
  // replace/extend them after authentication.
  let unitPresetOptions = [
    'unit','each','piece','gram','kilogram','milligram','millilitre','litre',
    'ounce','pound','inch','foot','metre','centimetre','jar','bottle','bag','box',
    'package','pack','roll','spool','sheet','pair','set','kit','cartridge','tube',
    'can','pail','tool','machine','use'
  ];
  let seedSearchText = '';
  let editingSiteInventoryId = 0;
  let selectedCatalogItemId = 0;
  let lastAmazonPackagingSourceDraft = null;
  let inventoryTableEditMode = true;
  let initialLoadStarted = false;
  let seedLoadPromise = null;
  let listLoadPromise = null;
  let inventoryPage = 1;
  const inventoryPageSize = 40;
  const INVENTORY_DRAFT_KEY = 'dd_inventory_form_draft_v244';


  function setMessage(message, isError = false) {
    const el = document.getElementById('siteInventoryMessage');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.classList.toggle('is-error', Boolean(message && isError));
    el.classList.toggle('is-success', Boolean(message && !isError));
  }

  async function readApiPayload(response, fallbackMessage = 'The server returned an unreadable response.') {
    return window.DDAuth.readApiJson(response, { fallbackMessage });
  }

  function fmtMoney(cents) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD' }).format(Number(cents || 0) / 100);
  }

  function centsToDollarInput(cents) {
    const value = Number(cents || 0);
    if (!Number.isFinite(value) || value <= 0) return '0.00';
    return (value / 100).toFixed(2);
  }

  function costPerUsageCents(item = {}) {
    const costCents = Math.max(0, Number(item.unit_cost_cents || 0) || 0);
    const usagePerStock = Math.max(0.001, Number(item.usage_units_per_stock_unit || 1) || 1);
    return costCents / usagePerStock;
  }

  function updateRowUsageCost(row) {
    if (!row) return;
    const costInput = row.querySelector('[data-field="unit_cost_dollars"]');
    const perStockInput = row.querySelector('[data-field="usage_units_per_stock_unit"]');
    const usageInput = row.querySelector('[data-field="usage_unit_label"]');
    const output = row.querySelector('[data-cost-per-usage]');
    const label = row.querySelector('[data-cost-per-usage-label]');
    if (!output) return;
    const costDollars = Math.max(0, Number(costInput?.value || 0) || 0);
    const perStock = Math.max(0.001, Number(perStockInput?.value || 1) || 1);
    output.textContent = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(costDollars / perStock);
    if (label) label.textContent = String(usageInput?.value || 'unit').trim() || 'unit';
  }

  function describeStockUsage(item = {}) {
    const stockLabel = String(item?.stock_unit_label || 'unit').trim() || 'unit';
    const usageLabel = String(item?.usage_unit_label || 'unit').trim() || 'unit';
    const perStock = Math.max(0.001, Number(item?.usage_units_per_stock_unit || 1) || 1);
    return { stockLabel, usageLabel, perStock };
  }

  function unitOptionsMarkup(selected = 'unit') {
    const current = String(selected || 'unit').trim().toLowerCase() || 'unit';
    const options = [...new Set([current, ...unitPresetOptions.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean)])];
    return options.map((value) => `<option value="${escapeHtml(value)}" ${value === current ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
  }

  function processOptionsMarkup(selectedId = 0, legacyCategory = '') {
    const selected = Number(selectedId || 0);
    const legacy = String(legacyCategory || '').trim().toLowerCase();
    let html = '<option value="">Unassigned workshop category</option>';
    html += processOptions.map((p) => {
      const id = Number(p.inventory_process_id || 0);
      const label = String(p.process_name || p.process_key || '').trim();
      const chosen = selected ? id === selected : (!selected && legacy && label.toLowerCase() === legacy);
      return `<option value="${id}" data-process-name="${escapeHtml(label)}" ${chosen ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');
    return html;
  }

  function stationOptionsMarkup(processId = 0, selectedId = 0, currentItemId = 0) {
    const process = Number(processId || 0);
    const selected = Number(selectedId || 0);
    let html = '<option value="">No specific station tool</option>';
    html += stationToolOptions
      .filter((row) => !process || Number(row.inventory_process_id || 0) === process)
      .filter((row) => Number(row.site_item_inventory_id || 0) !== Number(currentItemId || 0))
      .map((row) => {
        const id = Number(row.site_item_inventory_id || 0);
        return `<option value="${id}" ${id === selected ? 'selected' : ''}>${escapeHtml(row.item_name || ('Inventory #' + id))}</option>`;
      }).join('');
    return html;
  }

  function syncRowReorderState(row) {
    if (!row) return;
    const mode = row.querySelector('[data-field="do_not_reorder"]');
    const threshold = row.querySelector('[data-field="reorder_level"]');
    const na = Number(mode?.value || 0) === 1;
    if (threshold) {
      threshold.disabled = na;
      threshold.setAttribute('aria-label', na ? 'Reorder not applicable' : 'Reorder threshold');
    }
  }

  function syncRowStationState(row) {
    if (!row) return;
    const process = row.querySelector('[data-field="inventory_process_id"]');
    const role = row.querySelector('[data-field="workstation_role"]');
    const parent = row.querySelector('[data-field="workstation_site_item_inventory_id"]');
    const source = String(row.querySelector('[data-field="source_type"]')?.value || row.dataset.sourceType || '').toLowerCase();
    if (!role || !parent) return;
    const stationOption = Array.from(role.options).find((option) => option.value === 'station');
    if (stationOption) stationOption.disabled = source !== 'tool';
    if (source !== 'tool' && role.value === 'station') role.value = 'associated';
    const current = Number(parent.value || 0);
    parent.innerHTML = stationOptionsMarkup(Number(process?.value || 0), current, Number(row.dataset.inventoryRow || 0));
    if (role.value === 'station') {
      parent.value = '';
      parent.disabled = true;
    } else {
      parent.disabled = false;
      if (current && Array.from(parent.options).some((option) => Number(option.value || 0) === current)) parent.value = String(current);
    }
  }

  function syncFormReorderState() {
    const threshold = document.getElementById('siteInventoryReorder');
    const noReorder = document.getElementById('siteInventoryDoNotReorder');
    if (!threshold || !noReorder) return;
    threshold.disabled = Boolean(noReorder.checked);
    threshold.placeholder = noReorder.checked ? 'N/A' : '0';
  }

  function syncFormStationState() {
    const type = String(document.getElementById('siteInventorySourceType')?.value || '').toLowerCase();
    const processSelect = document.getElementById('siteInventoryCategoryPreset');
    const role = document.getElementById('siteInventoryWorkstationRole');
    const parent = document.getElementById('siteInventoryParentStation');
    if (!role || !parent) return;
    const stationOption = Array.from(role.options).find((option) => option.value === 'station');
    if (stationOption) stationOption.disabled = type !== 'tool';
    if (type !== 'tool' && role.value === 'station') role.value = 'associated';
    if (role.value === 'station') {
      parent.value = '';
      parent.disabled = true;
    } else {
      parent.disabled = false;
      parent.innerHTML = stationOptionsMarkup(Number(processSelect?.value || 0), Number(parent.value || 0), editingSiteInventoryId);
    }
  }

  function escapeHtml(v) {
    return String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function debounce(fn, wait) {
    let t = null;
    return () => {
      clearTimeout(t);
      t = setTimeout(() => fn(), wait);
    };
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value ?? '—');
  }

  function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value == null ? '' : String(value);
  }


  function setAmazonLinkPreviewStatus(message = '', isError = false) {
    const el = document.getElementById('siteInventoryAmazonPreviewStatus');
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
    el.classList.toggle('is-error', Boolean(message && isError));
    el.classList.toggle('is-success', Boolean(message && !isError));
  }

  function applyAmazonDraft(draft = {}, warnings = [], packagingSourceDraft = null) {
    if (!draft || typeof draft !== 'object') return;
    resetInventoryForm();
    lastAmazonPackagingSourceDraft = packagingSourceDraft && typeof packagingSourceDraft === 'object' ? packagingSourceDraft : null;
    setInputValue('siteInventorySourceType', draft.source_type || 'supply');
    setInputValue('siteInventoryExternalKey', draft.external_key || '');
    setInputValue('siteInventoryItemName', draft.item_name || '');
    setInputValue('siteInventoryItemDescription', draft.item_description || '');
    setInputValue('siteInventoryCategory', draft.category || '');
    syncCategoryPresetSelection(draft.category || '');
    setInputValue('siteInventorySourceUrl', draft.source_url || draft.amazon_url || '');
    setInputValue('siteInventoryAmazonUrl', draft.amazon_url || draft.source_url || '');
    setInputValue('siteInventoryImageUrl', draft.image_url || '');
    setInputValue('siteInventoryOnHand', Math.max(1, Number(draft.on_hand_quantity || 1)));
    setInputValue('siteInventorySupplierName', draft.supplier_name || 'Amazon.ca');
    setInputValue('siteInventorySupplierSku', draft.supplier_sku || '');
    setInputValue('siteInventorySupplierContact', draft.supplier_contact || 'Amazon.ca');
    setInputValue('siteInventoryStockUnitLabel', draft.stock_unit_label || 'package');
    setInputValue('siteInventoryUsageUnitLabel', draft.usage_unit_label || 'unit');
    setInputValue('siteInventoryUsageUnitsPerStock', Math.max(0.001, Number(draft.usage_units_per_stock_unit || 1)));
    const currentCostEl = document.getElementById('siteInventoryUnitCost');
    const currentCost = Math.max(0, Number(currentCostEl?.value || 0) || 0);
    if (currentCost <= 0 && Number(draft.current_price_cents || 0) > 0) {
      setInputValue('siteInventoryUnitCost', centsToDollarInput(draft.current_price_cents));
    }
    setInputValue('siteInventoryUsageTrackingMode', draft.usage_tracking_mode || (String(draft.source_type || 'supply').toLowerCase() === 'tool' ? 'reusable' : 'exact'));
    setInputValue('siteInventoryMinimumUsageIncrement', Math.max(0.0001, Number(draft.minimum_usage_increment || 0.001) || 0.001));
    const sourceMaterialEl = document.getElementById('siteInventorySourceMaterialRecommended');
    if (sourceMaterialEl && lastAmazonPackagingSourceDraft && String(lastAmazonPackagingSourceDraft.material_subtype || 'other') !== 'other') sourceMaterialEl.checked = true;
    setInputValue('siteInventoryNotes', draft.reorder_notes || '');
    setInputValue('siteInventoryMovementNote', 'Created from reviewed Amazon link metadata.');
    updateSiteInventoryImagePreview();
    const warningText = Array.isArray(warnings) && warnings.length ? ` ${warnings.join(' ')}` : '';
    setAmazonLinkPreviewStatus(`Amazon draft loaded. Review every field before saving. A current Amazon CAD price is used only when Inventory has no existing cost.${warningText}`);
    document.getElementById('siteInventoryForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function previewAmazonLink() {
    const amazonUrl = String(document.getElementById('siteInventoryAmazonImportUrl')?.value || '').trim();
    const sourceType = String(document.getElementById('siteInventoryAmazonImportType')?.value || 'supply').trim();
    if (!amazonUrl) {
      setAmazonLinkPreviewStatus('Paste the Amazon product link first.', true);
      return;
    }
    const button = document.getElementById('siteInventoryAmazonPreviewButton');
    if (button) button.disabled = true;
    setAmazonLinkPreviewStatus('Reading available Amazon product metadata…');
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/amazon-link-preview', {
        method: 'POST',
        body: JSON.stringify({ amazon_url: amazonUrl, source_type: sourceType })
      });
      const data = await readApiPayload(response, 'Amazon metadata could not be loaded.');
      applyAmazonDraft(data.draft || {}, data.warnings || [], data.packaging_source_draft || null);
    } catch (error) {
      setAmazonLinkPreviewStatus(`${error.message || 'Amazon metadata could not be loaded.'} You may still paste the link into the manual form.`, true);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function updateSiteInventoryImagePreview() {
    const imageUrl = String(document.getElementById('siteInventoryImageUrl')?.value || '').trim();
    const preview = document.getElementById('siteInventoryImagePreview');
    if (!preview) return;
    if (!imageUrl) {
      preview.innerHTML = '<div class="site-inventory-image-placeholder small">No image URL yet.</div>';
      return;
    }
    preview.innerHTML = `
      <div class="site-inventory-image-preview-card">
        <img src="${escapeHtml(imageUrl)}" alt="Inventory item preview" loading="lazy" onerror="this.closest('.site-inventory-image-preview-card').classList.add('is-broken')"/>
        <a class="small" href="${escapeHtml(imageUrl)}" target="_blank" rel="noopener noreferrer">Open image URL</a>
      </div>`;
  }

  function syncCategoryPresetSelection(value, processId = 0) {
    const select = document.getElementById('siteInventoryCategoryPreset');
    if (!select) return;
    const id = Number(processId || 0);
    const normalized = String(value || '').trim().toLowerCase();
    const match = id
      ? Array.from(select.options).find((option) => Number(option.value || 0) === id)
      : Array.from(select.options).find((option) => String(option.dataset?.processName || option.textContent || '').trim().toLowerCase() === normalized);
    select.value = match ? match.value : '';
    const hidden = document.getElementById('siteInventoryCategory');
    if (hidden) hidden.value = match ? String(match.dataset?.processName || match.textContent || '').trim().toLowerCase() : normalized;
    syncFormStationState();
  }

  function resourceSeedLabel(item = {}) {
    const stockLabel = String(item.stock_unit_label || 'unit').trim() || 'unit';
    const cost = Number(item.unit_cost_cents || 0) > 0 ? ` • ${fmtMoney(item.unit_cost_cents)}` : '';
    const asin = item.amazon_asin ? ` • ASIN ${item.amazon_asin}` : '';
    const status = item.amazon_match_status ? ` • ${item.amazon_match_status}` : '';
    return `${item.item_name || item.name || item.external_key || 'Item'} [${String(item.source_type || 'other').toUpperCase()}] (${Number(item.on_hand_quantity || 0)} ${stockLabel}${cost}${asin}${status})`;
  }

  function renderSeedDropdowns() {
    const typeSelect = document.getElementById('siteInventorySourceType');
    const itemSelect = document.getElementById('siteInventorySeedItem');
    const categorySelect = document.getElementById('siteInventoryCategoryPreset');
    if (categorySelect) {
      const current = Number(categorySelect.value || 0);
      categorySelect.innerHTML = processOptionsMarkup(current, document.getElementById('siteInventoryCategory')?.value || '');
    }
    const stockUnitSelect = document.getElementById('siteInventoryStockUnitLabel');
    if (stockUnitSelect) stockUnitSelect.innerHTML = unitOptionsMarkup(stockUnitSelect.value || 'unit');
    const usageUnitSelect = document.getElementById('siteInventoryUsageUnitLabel');
    if (usageUnitSelect) usageUnitSelect.innerHTML = unitOptionsMarkup(usageUnitSelect.value || 'unit');
    const parentStation = document.getElementById('siteInventoryParentStation');
    if (parentStation) parentStation.innerHTML = stationOptionsMarkup(Number(categorySelect?.value || 0), Number(parentStation.value || 0), editingSiteInventoryId);
    syncFormStationState();
    if (!itemSelect) return;
    const sourceType = String(typeSelect?.value || 'tool').trim();
    const query = String(seedSearchText || '').trim().toLowerCase();
    const filtered = catalogSeedOptions
      .filter((item) => query ? true : (!sourceType || item.source_type === sourceType))
      .filter((item) => {
        if (!query) return true;
        const haystack = [
          item.item_name,
          item.external_key,
          item.category,
          item.amazon_asin,
          item.amazon_title,
          item.amazon_match_status,
          item.supplier_name
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    if (!filtered.length) {
      itemSelect.innerHTML = '<option value="">No matching tool/supply records found. Try a shorter search.</option>';
      return;
    }
    itemSelect.innerHTML = '<option value="">Choose an existing tool or supply…</option>' + filtered.map((item) => `<option value="${escapeHtml(item.external_key)}">${escapeHtml(resourceSeedLabel(item))}</option>`).join('');
  }

  function applySeedItemByKey(externalKey) {
    const key = String(externalKey || '').trim();
    if (!key) return;
    const type = String(document.getElementById('siteInventorySourceType')?.value || '').trim();
    const item = catalogSeedOptions.find((entry) => entry.external_key === key && (!type || entry.source_type === type)) || catalogSeedOptions.find((entry) => entry.external_key === key);
    if (!item) return;
    setInputValue('siteInventoryExternalKey', item.external_key || '');
    setInputValue('siteInventoryItemName', item.item_name || '');
    setInputValue('siteInventoryItemDescription', item.item_description || item.notes || '');
    setInputValue('siteInventoryCategory', item.category || '');
    setInputValue('siteInventoryImageUrl', item.image_url || '');
    updateSiteInventoryImagePreview();
    selectedCatalogItemId = Number(item.catalog_item_id || 0) || 0;
    setInputValue('siteInventorySourceType', item.source_type || type || 'supply');
    setInputValue('siteInventoryOnHand', Math.max(0, Number(item.on_hand_quantity || 0) || 0));
    setInputValue('siteInventorySourceUrl', item.amazon_url || '');
    setInputValue('siteInventoryAmazonUrl', item.amazon_url || '');
    setInputValue('siteInventoryUnitCost', centsToDollarInput(item.unit_cost_cents || 0));
    setInputValue('siteInventoryStockUnitLabel', item.stock_unit_label || 'unit');
    setInputValue('siteInventoryUsageUnitLabel', item.usage_unit_label || 'unit');
    setInputValue('siteInventoryUsageUnitsPerStock', Math.max(0.001, Number(item.usage_units_per_stock_unit || 1) || 1));
    setInputValue('siteInventoryUsageTrackingMode', item.usage_tracking_mode || (item.source_type === 'tool' ? 'reusable' : 'exact'));
    setInputValue('siteInventoryMinimumUsageIncrement', Math.max(0.0001, Number(item.minimum_usage_increment || 0.001) || 0.001));
    setInputValue('siteInventorySupplierName', item.supplier_name || (item.amazon_url ? 'Amazon.ca' : ''));
    setInputValue('siteInventorySupplierSku', item.amazon_asin || '');
    setInputValue('siteInventorySupplierContact', item.amazon_url ? 'Amazon.ca' : '');
    const noteBits = [];
    if (item.amazon_match_status) noteBits.push(`Amazon CSV ${item.amazon_match_status}`);
    if (item.amazon_title) noteBits.push(`Amazon title: ${item.amazon_title}`);
    if (item.latest_order_id) noteBits.push(`Latest order: ${item.latest_order_id}`);
    if (item.latest_purchase_date) noteBits.push(`Latest purchase: ${item.latest_purchase_date}`);
    if (noteBits.length) setInputValue('siteInventoryNotes', noteBits.join(' | '));
    const seedSelect = document.getElementById('siteInventorySeedItem');
    if (seedSelect) seedSelect.value = item.external_key || '';
    syncCategoryPresetSelection(item.category || '');
  }

  async function readSeedJson(response) {
    return window.DDAuth.readApiJson(response, { fallbackMessage: 'Failed to load inventory source dropdowns.' });
  }

  async function loadSeedOptions({ query = '' } = {}) {
    if (!window.DDAuth?.isLoggedIn()) return null;
    const normalizedQuery = String(query || '').trim();
    if (seedLoadPromise && !normalizedQuery) return seedLoadPromise;
    const work = (async () => {
      try {
        if (!normalizedQuery) {
          const data = await window.DDAuth.apiJson(
            '/api/admin/inventory-bootstrap',
            { method: 'GET' },
            { fallbackMessage: 'Failed to load inventory setup choices.', cacheKey: 'inventory-bootstrap-v289', cacheTtlMs: 300000, retries: 0, staleOnError: true }
          );
          categorySeedOptions = Array.isArray(data?.categories) ? data.categories.map((v)=>String(v||'').trim().toLowerCase()).filter(Boolean) : [];
          processOptions = Array.isArray(data?.processes) ? data.processes : [];
          stationToolOptions = Array.isArray(data?.station_tools) ? data.station_tools : [];
          unitPresetOptions = Array.isArray(data?.unit_presets) && data.unit_presets.length ? data.unit_presets : unitPresetOptions;
          catalogSeedOptions = [];
          renderSeedDropdowns();
          if (data?._response_meta?.stale) setMessage('The server is temporarily busy. Inventory setup choices are using the last saved browser copy.', true);
          return data;
        }

        // Typed search only: query the D1 catalog on demand rather than loading hundreds of rows on page startup.
        const data = await window.DDAuth.apiJson(
          `/api/admin/product-resource-search?q=${encodeURIComponent(normalizedQuery)}&limit=120`,
          { method: 'GET' },
          { fallbackMessage: 'Failed to search inventory source records.', cacheKey: `inventory-seed-resources:${normalizedQuery.toLowerCase()}`, cacheTtlMs: 120000, retries: 0, staleOnError: true }
        );
        const rawResources = Array.isArray(data?.resources) ? data.resources : [];
        catalogSeedOptions = rawResources.map((item) => ({
          source_type: String(item.item_kind || item.source_type || 'other').trim().toLowerCase() || 'other',
          external_key: String(item.source_key || item.external_key || '').trim(), item_name: String(item.name || item.item_name || '').trim(),
          category: String(item.category || item.subcategory || '').trim().toLowerCase(), image_url: String(item.image_url || '').trim(),
          on_hand_quantity: Number(item.on_hand_quantity || 0), unit_cost_cents: Number(item.unit_cost_cents || 0),
          stock_unit_label: String(item.stock_unit_label || 'unit').trim().toLowerCase() || 'unit', usage_unit_label: String(item.usage_unit_label || 'unit').trim().toLowerCase() || 'unit',
          usage_units_per_stock_unit: Math.max(0.001, Number(item.usage_units_per_stock_unit || 1) || 1),
          usage_tracking_mode: String(item.usage_tracking_mode || (String(item.item_kind || item.source_type || '').toLowerCase() === 'tool' ? 'reusable' : 'exact')).trim().toLowerCase(),
          minimum_usage_increment: Math.max(0.0001, Number(item.minimum_usage_increment || 0.001) || 0.001), catalog_item_id: Number(item.catalog_item_id || 0) || 0,
          amazon_url: String(item.amazon_url || '').trim(), amazon_asin: String(item.amazon_asin || '').trim(), amazon_title: String(item.amazon_title || '').trim(), amazon_match_status: String(item.amazon_match_status || '').trim(),
          supplier_name: String(item.supplier_name || '').trim(), latest_order_id: String(item.latest_order_id || '').trim(), latest_purchase_date: String(item.latest_purchase_date || '').trim()
        })).filter((item) => item.external_key && item.item_name);
        // Preserve bootstrap categories while adding any categories discovered by the typed search.
        categorySeedOptions = [...new Set([...categorySeedOptions, ...catalogSeedOptions.map((item)=>item.category).filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
        renderSeedDropdowns();
        if (data?._response_meta?.stale) setMessage('The server was temporarily busy. Inventory search is using the last saved browser copy.', true);
        return data;
      } catch (error) {
        setMessage(error.message || 'Failed to load inventory source choices.', true);
        return null;
      } finally { if (!normalizedQuery) seedLoadPromise = null; }
    })();
    if (!normalizedQuery) seedLoadPromise = work;
    return work;
  }

  function parseInventoryIds(text) {
    return String(text || '')
      .split(',')
      .map((part) => Number(String(part).trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  function dollarsToCents(value) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const number = Number(text);
    if (!Number.isFinite(number) || number < 0) return null;
    return Math.round(number * 100);
  }

  function setInventorySyncResult(data = {}) {
    const el = document.getElementById('siteInventorySyncResult');
    if (!el) return;
    if (!data || !data.ok) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }
    const errors = Array.isArray(data.errors) && data.errors.length
      ? `<details style="margin-top:8px"><summary>${escapeHtml(String(data.errors.length))} sync error(s)</summary><pre class="small" style="white-space:pre-wrap">${escapeHtml(JSON.stringify(data.errors.slice(0, 20), null, 2))}</pre></details>`
      : '';
    const statusCounts = data.match_status_counts && typeof data.match_status_counts === 'object'
      ? Object.entries(data.match_status_counts).map(([key, value]) => `${escapeHtml(key)} ${escapeHtml(String(value))}`).join(' • ')
      : '';
    el.innerHTML = `
      <strong>Last D1 reconciliation result</strong>
      <div class="small">Scanned ${escapeHtml(String(Number(data.scanned || 0)))} • synced ${escapeHtml(String(Number(data.synced || 0)))} • inserted ${escapeHtml(String(Number(data.inserted || 0)))} • updated ${escapeHtml(String(Number(data.updated || 0)))} • failed ${escapeHtml(String(Number(data.failed || 0)))}</div>
      <div class="small">This reconciliation copies missing D1 catalog rows into inventory in small batches and fills safe descriptive fields. It does not run Amazon matching or overwrite reviewed quantities, unit conversions, or costs.</div>
      ${statusCounts ? `<div class="small">Statuses: ${statusCounts}</div>` : ''}
      ${errors}`;
    el.style.display = 'block';
  }

  function setBulkPreview(html) {
    const el = document.getElementById('siteInventoryBulkCostPreview');
    if (!el) return;
    el.innerHTML = html || '';
    el.style.display = html ? 'block' : 'none';
  }

  function updateBulkCostScopeHelpers() {
    const scope = String(document.getElementById('siteInventoryBulkScope')?.value || 'ids');
    const idsEl = document.getElementById('siteInventoryBulkIds');
    const categoryEl = document.getElementById('siteInventoryBulkCategory');
    const sourceTypeEl = document.getElementById('siteInventoryBulkSourceType');
    if (idsEl) idsEl.disabled = scope !== 'ids';
    if (categoryEl) categoryEl.disabled = scope !== 'category';
    if (sourceTypeEl) sourceTypeEl.disabled = scope !== 'source_type';
  }

  function updateBulkCostPlaceholder() {
    const action = String(document.getElementById('siteInventoryBulkCostAction')?.value || '');
    const valueEl = document.getElementById('siteInventoryBulkCostValue');
    if (!valueEl) return;
    if (action === 'set_cost_cents') {
      valueEl.placeholder = 'Exact unit cost in dollars, e.g. 4.95';
    } else if (action === 'increase_percent' || action === 'decrease_percent') {
      valueEl.placeholder = 'Percent, e.g. 12';
    } else if (action === 'increase_cents' || action === 'decrease_cents') {
      valueEl.placeholder = 'Amount in dollars, e.g. 0.40';
    } else {
      valueEl.placeholder = 'e.g. 10 or 1.25';
    }
  }

  function buildBulkCostPayload(includePreview = false) {
    const scope = String(document.getElementById('siteInventoryBulkScope')?.value || 'ids').trim();
    const ids = parseInventoryIds(document.getElementById('siteInventoryBulkIds')?.value || '');
    const category = String(document.getElementById('siteInventoryBulkCategory')?.value || '').trim();
    const sourceType = String(document.getElementById('siteInventoryBulkSourceType')?.value || '').trim();
    const action = String(document.getElementById('siteInventoryBulkCostAction')?.value || '').trim();
    const valueRaw = String(document.getElementById('siteInventoryBulkCostValue')?.value || '').trim();
    const reasonNote = String(document.getElementById('siteInventoryBulkReason')?.value || '').trim();

    if (scope === 'ids' && !ids.length) {
      throw new Error('Please enter at least one valid inventory item ID.');
    }
    if (scope === 'category' && !category) {
      throw new Error('Please enter a category for category-wide cost updates.');
    }
    if (scope === 'source_type' && !sourceType) {
      throw new Error('Please choose a source type for source-type cost updates.');
    }
    if (!action) {
      throw new Error('Please choose a cost change before running the bulk update.');
    }

    let normalizedValue = null;
    if (action === 'set_cost_cents' || action === 'increase_cents' || action === 'decrease_cents') {
      normalizedValue = dollarsToCents(valueRaw);
      if (normalizedValue == null) {
        throw new Error('Please enter a valid dollar amount for the selected cost change.');
      }
    } else {
      const percentValue = Number(valueRaw);
      if (!Number.isFinite(percentValue) || percentValue <= 0) {
        throw new Error('Please enter a valid percentage greater than zero.');
      }
      normalizedValue = percentValue;
    }

    return {
      selection_scope: scope,
      inventory_ids: ids,
      category,
      source_type: sourceType,
      reason_note: reasonNote,
      preview: includePreview ? 1 : 0,
      updates: {
        cost_action: action,
        cost_value: normalizedValue
      }
    };
  }

  function renderBulkCostPreview(data) {
    const rows = Array.isArray(data?.preview_items) ? data.preview_items : [];
    const selectionLabel = escapeHtml(data?.selection?.label || 'Selected inventory');
    const requested = Array.isArray(data?.requested_changes)
      ? data.requested_changes.map((row) => `<li>${escapeHtml(row)}</li>`).join('')
      : '';

    const table = rows.length ? `
      <div class="table-wrap" style="margin-top:10px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Item</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Type</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Current Cost</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Preview Cost</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(row.item_name || '')}</strong><div class="small">#${escapeHtml(row.site_item_inventory_id)} · ${escapeHtml(row.category || '—')}</div></td>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.source_type || '—')}<div class="small">${escapeHtml(row.supplier_name || '')}</div></td>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(fmtMoney(row.current_unit_cost_cents || 0))}</td>
                <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(fmtMoney(row.preview_unit_cost_cents || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<div class="small" style="margin-top:10px">No preview rows were returned.</div>';

    setBulkPreview(`
      <div><strong>Preview</strong> · ${selectionLabel} · ${escapeHtml(String(Number(data?.matched_count || 0)))} matched inventory item(s)</div>
      ${requested ? `<ul style="margin:8px 0 0 18px">${requested}</ul>` : ''}
      ${table}
    `);
  }

  async function sendBulkCostRequest(payload, button, actionLabel) {
    const original = button ? button.textContent : '';
    try {
      if (button) {
        button.disabled = true;
        button.textContent = actionLabel;
      }
      const response = await window.DDAuth.apiFetch('/api/admin/bulk-update-site-inventory', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return readApiPayload(response, 'Bulk inventory cost update failed.');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  }

  async function onBulkCostPreview() {
    try {
      const button = document.getElementById('siteInventoryBulkPreviewButton');
      setMessage('Building inventory cost preview...');
      const payload = buildBulkCostPayload(true);
      const data = await sendBulkCostRequest(payload, button, 'Previewing...');
      renderBulkCostPreview(data);
      setMessage(`Inventory cost preview ready for ${Number(data?.matched_count || 0)} item(s).`);
    } catch (error) {
      setBulkPreview('');
      setMessage(error.message || 'Bulk inventory cost preview failed.', true);
    }
  }

  async function onBulkCostApply(event) {
    event.preventDefault();
    try {
      const button = document.getElementById('siteInventoryBulkApplyButton');
      const payload = buildBulkCostPayload(false);
      const scope = String(payload.selection_scope || 'ids');
      if (scope === 'all' && !window.confirm('Apply this unit-cost update to the entire site inventory?')) return;
      if (scope === 'category' && !window.confirm(`Apply this unit-cost update to category "${payload.category}"?`)) return;
      if (scope === 'source_type' && !window.confirm(`Apply this unit-cost update to source type "${payload.source_type}"?`)) return;
      setMessage('Running bulk inventory cost update...');
      const data = await sendBulkCostRequest(payload, button, 'Updating...');
      renderBulkCostPreview(data);
      setMessage(`Bulk inventory cost update completed for ${Number(data?.updated_count || 0)} item(s).`);
      await loadList({ force: true });
    } catch (error) {
      setMessage(error.message || 'Bulk inventory cost update failed.', true);
    }
  }

  function setInventoryEditMode(item = {}) {
    editingSiteInventoryId = Number(item.site_item_inventory_id || 0) || 0;
    const status = document.getElementById('siteInventoryEditState');
    const saveButton = document.getElementById('siteInventorySaveButton');
    const resetButton = document.getElementById('siteInventoryResetButton');
    const clearButton = document.getElementById('siteInventoryClearFieldsButton');
    if (editingSiteInventoryId) {
      if (status) {
        status.hidden = false;
        status.textContent = `Editing #${editingSiteInventoryId}: ${item.item_name || 'inventory item'}. Save changes updates this record; it does not create another item.`;
      }
      if (saveButton) saveButton.textContent = 'Save Changes to This Item';
      if (resetButton) resetButton.textContent = 'Start New Item';
      if (clearButton) clearButton.textContent = 'Clear / Reset Fields';
    } else {
      if (status) { status.hidden = true; status.textContent = ''; }
      if (saveButton) saveButton.textContent = 'Add Inventory Item';
      if (resetButton) resetButton.textContent = 'Start New Item';
      if (clearButton) clearButton.textContent = 'Clear / Reset Fields';
    }
  }

  function resetInventoryForm() {
    clearInventoryDraft();
    const form = document.getElementById('siteInventoryForm');
    form?.reset();
    editingSiteInventoryId = 0;
    selectedCatalogItemId = 0;
    lastAmazonPackagingSourceDraft = null;
    const seedEl = document.getElementById('siteInventorySeedItem'); if (seedEl) seedEl.value = '';
    const categoryPresetEl = document.getElementById('siteInventoryCategoryPreset'); if (categoryPresetEl) categoryPresetEl.value = '';
    setInputValue('siteInventoryCategory', '');
    const roleEl = document.getElementById('siteInventoryWorkstationRole'); if (roleEl) roleEl.value = 'associated';
    const parentStationEl = document.getElementById('siteInventoryParentStation'); if (parentStationEl) { parentStationEl.value = ''; parentStationEl.innerHTML = stationOptionsMarkup(); }
    const onHandEl = document.getElementById('siteInventoryOnHand'); if (onHandEl) onHandEl.value = '1';
    const unitCostEl = document.getElementById('siteInventoryUnitCost'); if (unitCostEl) unitCostEl.value = '0.00';
    const stockUnitEl = document.getElementById('siteInventoryStockUnitLabel'); if (stockUnitEl) stockUnitEl.value = 'unit';
    const usageUnitEl = document.getElementById('siteInventoryUsageUnitLabel'); if (usageUnitEl) usageUnitEl.value = 'unit';
    const usageUnitsEl = document.getElementById('siteInventoryUsageUnitsPerStock'); if (usageUnitsEl) usageUnitsEl.value = '1';
    const trackingEl = document.getElementById('siteInventoryUsageTrackingMode'); if (trackingEl) trackingEl.value = 'exact';
    const incrementEl = document.getElementById('siteInventoryMinimumUsageIncrement'); if (incrementEl) incrementEl.value = '0.001';
    const classEl=document.getElementById('siteInventoryClass');if(classEl)classEl.value='consumable';
    const lifeEl=document.getElementById('siteInventoryLifecycleMode');if(lifeEl)lifeEl.value='consumable';
    ['siteInventoryLotRecommended','siteInventoryExpiryRecommended','siteInventorySourceMaterialRecommended'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false;});
    setInventoryEditMode({});
    const sourceTypeEl = document.getElementById('siteInventorySourceType'); if (sourceTypeEl) sourceTypeEl.disabled = false;
    const externalKeyEl = document.getElementById('siteInventoryExternalKey'); if (externalKeyEl) externalKeyEl.readOnly = false;
    syncFormReorderState();
    syncFormStationState();
    updateSiteInventoryImagePreview();
  }

  function clearInventoryWorkspaceFields() {
    // A deliberately explicit full clear. Start New Item resets the inventory
    // editor; this also clears the helper/search/import fields around it so a
    // prior Amazon URL or catalog search cannot accidentally seed the next item.
    resetInventoryForm();
    seedSearchText = '';
    setInputValue('siteInventorySeedSearch', '');
    setInputValue('siteInventoryAmazonImportUrl', '');
    setInputValue('siteInventoryAmazonImportType', 'supply');
    setAmazonLinkPreviewStatus('');
    setMessage('Inventory entry fields cleared. Ready for a new item.');
    catalogSeedOptions = [];
    renderSeedDropdowns();
    if (window.DDAuth?.isLoggedIn()) loadSeedOptions().then(() => renderSeedDropdowns()).catch(() => {});
    document.getElementById('siteInventoryItemName')?.focus();
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Tools &amp; Supplies Inventory Operations</h3>
        <p class="small" style="margin-top:0">Track quantities, reorder lists, do-not-reuse flags, supplier details, item images, movement history, and bulk unit-cost changes for tariffs, shipping, or packaging increases.</p>
        <div id="siteInventoryMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <section class="card site-inventory-amazon-import" aria-labelledby="siteInventoryAmazonImportHeading">
          <div>
            <p class="inventory-operations-eyebrow">New review-first shortcut</p>
            <h4 id="siteInventoryAmazonImportHeading">Add an item from an Amazon link</h4>
            <p class="small">Paste the purchased product link. The system will try to fill the title, image, description, ASIN, supplier, and a suggested category. Nothing is added until you review the draft and press <strong>Add Inventory Item</strong>.</p>
          </div>
          <div class="grid cols-3 site-inventory-amazon-import-controls">
            <div><label class="small" for="siteInventoryAmazonImportUrl">Amazon product URL</label><input id="siteInventoryAmazonImportUrl" type="url" inputmode="url" placeholder="https://www.amazon.ca/dp/..." /></div>
            <div><label class="small" for="siteInventoryAmazonImportType">Inventory type</label><select id="siteInventoryAmazonImportType"><option value="supply">Consumable / supply</option><option value="tool">Tool / equipment</option></select></div>
            <div class="site-inventory-amazon-import-action"><button class="btn primary" type="button" id="siteInventoryAmazonPreviewButton">Build Review Draft</button></div>
          </div>
          <div id="siteInventoryAmazonPreviewStatus" class="small inventory-feedback-panel" hidden aria-live="polite"></div>
        </section>
        <div class="grid cols-6" style="gap:12px;margin-bottom:12px">
          <div class="card"><div class="small">Items</div><div id="siteInventoryTotalItems" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card inventory-summary-card"><div class="small">Active</div><div id="siteInventoryActiveItems" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card inventory-summary-card"><div class="small">Low Stock</div><div id="siteInventoryLowStock" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card inventory-summary-card"><div class="small">Reserved</div><div id="siteInventoryReserved" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card inventory-summary-card"><div class="small">Incoming</div><div id="siteInventoryIncoming" style="font-size:1.15rem;font-weight:800">—</div></div>
          <div class="card inventory-summary-card"><div class="small">Reorder List</div><div id="siteInventoryReorderListCount" style="font-size:1.15rem;font-weight:800">—</div></div>
        </div>

        <form id="siteInventoryForm" class="grid inventory-form-grid" style="gap:12px">
          <div id="siteInventoryEditState" class="site-inventory-edit-state small" hidden aria-live="polite"></div>
          <div class="grid cols-5" style="gap:12px">
            <div><label class="small" for="siteInventorySourceType">Source Type</label><select id="siteInventorySourceType"><option value="tool">Tool</option><option value="supply">Supply</option><option value="product">Product</option><option value="other">Other</option></select></div>
            <div><label class="small" for="siteInventorySeedSearch">Search existing tool / supply</label><input id="siteInventorySeedSearch" type="search" placeholder="type name, category, ASIN, Amazon title" /></div>
            <div><label class="small" for="siteInventorySeedItem">Existing tool / supply</label><select id="siteInventorySeedItem"><option value="">Loading existing tool &amp; supply records…</option></select></div>
            <div><label class="small" for="siteInventoryExternalKey">External Key</label><input id="siteInventoryExternalKey" type="text" placeholder="sku, source key, item id" /></div>
            <div><label class="small" for="siteInventoryItemName">Item Name</label><input id="siteInventoryItemName" type="text" /></div>
          </div>
          <div class="grid cols-5" style="gap:12px">
            <div><label class="small" for="siteInventoryCategoryPreset">Workstation / Category</label><select id="siteInventoryCategoryPreset"><option value="">Loading workshop categories…</option></select><input id="siteInventoryCategory" type="hidden" /><div class="small">Uses our canonical workshop categories such as Laser Engraving &amp; Cutting, 3D Printing, CNC, Resin and General Workshop.</div></div>
            <div><label class="small" for="siteInventoryWorkstationRole">Tool role</label><select id="siteInventoryWorkstationRole"><option value="associated">Associated tool / supply</option><option value="station">This tool is the workstation</option></select><div class="small">Mark machines such as a laser engraver or 3D printer as the workstation itself.</div></div>
            <div><label class="small" for="siteInventoryParentStation">Specific station tool</label><select id="siteInventoryParentStation"><option value="">No specific station tool</option></select><div class="small">Optional for accessories/tools that belong to one particular workstation.</div></div>
            <div class="site-inventory-image-field"><label class="small" for="siteInventoryImageUrl">Image URL</label><input id="siteInventoryImageUrl" type="url" placeholder="https://..." /><div id="siteInventoryImagePreview" class="site-inventory-image-preview"><div class="site-inventory-image-placeholder small">No image URL yet.</div></div><div class="small">Amazon fill can supply this only when the image is currently missing.</div></div>
            <div><label class="small" for="siteInventoryIsActive">Status</label><select id="siteInventoryIsActive"><option value="1">Active</option><option value="0">Inactive</option></select></div>
          </div>
          <div class="grid cols-3" style="gap:12px">
            <div><label class="small" for="siteInventorySourceUrl">Source URL</label><input id="siteInventorySourceUrl" type="url" placeholder="https://..." /></div>
            <div><label class="small" for="siteInventoryAmazonUrl">Amazon URL</label><input id="siteInventoryAmazonUrl" type="url" placeholder="https://..." /></div>
            <div class="small" style="align-self:end">Choose an existing tool or supply above to prefill the form, then adjust stock, supplier, and cost details.</div>
          </div>
          <div class="grid cols-5" style="gap:12px">
            <div><label class="small" for="siteInventoryOnHand">On Hand (stock units)</label><input id="siteInventoryOnHand" type="number" min="0" step="0.001" value="1" /></div>
            <div><label class="small" for="siteInventoryReservedInput">Reserved</label><input id="siteInventoryReservedInput" type="number" min="0" step="0.001" value="0" /></div>
            <div><label class="small" for="siteInventoryIncomingInput">Incoming</label><input id="siteInventoryIncomingInput" type="number" min="0" step="0.001" value="0" /></div>
            <div><label class="small" for="siteInventoryReorder">Reorder At</label><input id="siteInventoryReorder" type="number" min="0" step="0.001" value="0" /><div class="small">Choose “Reorder N/A” below for items we do not plan to replace.</div></div>
            <div><label class="small" for="siteInventoryPreferredReorderQty">Preferred Reorder Qty</label><input id="siteInventoryPreferredReorderQty" type="number" min="0" step="0.001" value="0" /></div>
          </div>
          <div class="grid cols-6" style="gap:12px">
            <div><label class="small" for="siteInventoryUnitCost">Unit Cost (CAD)</label><input id="siteInventoryUnitCost" type="number" min="0" step="0.01" value="0.00" placeholder="33.99" /></div>
            <div><label class="small" for="siteInventoryStockUnitLabel">Stock Unit</label><select id="siteInventoryStockUnitLabel">${unitOptionsMarkup('unit')}</select></div>
            <div><label class="small" for="siteInventoryUsageUnitLabel">Usage Unit</label><select id="siteInventoryUsageUnitLabel">${unitOptionsMarkup('unit')}</select></div>
            <div><label class="small" for="siteInventoryUsageUnitsPerStock">Usage Units Per Stock Unit</label><input id="siteInventoryUsageUnitsPerStock" type="number" min="0.001" step="0.001" value="1" /></div>
            <div><label class="small" for="siteInventorySupplierName">Supplier</label><input id="siteInventorySupplierName" type="text" /></div>
            <div><label class="small" for="siteInventorySupplierSku">Supplier SKU</label><input id="siteInventorySupplierSku" type="text" /></div>
          </div>
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventorySupplierContact">Supplier Contact</label><input id="siteInventorySupplierContact" type="text" placeholder="email or phone" /></div>
            <div><label class="small" for="siteInventoryReuseStatus">Reuse Status</label><input id="siteInventoryReuseStatus" type="text" placeholder="wash, refill, one-time use" /></div>
            <div><label class="small" for="siteInventoryUsageTrackingMode">Usage Tracking</label><select id="siteInventoryUsageTrackingMode"><option value="exact">Exact measured — reduce stock</option><option value="estimated">Estimated amount — reduce stock</option><option value="log_only">Log use only — do not reduce stock</option><option value="reusable">Reusable tool/equipment — do not reduce stock</option></select></div>
            <div><label class="small" for="siteInventoryMinimumUsageIncrement">Smallest usage increment</label><input id="siteInventoryMinimumUsageIncrement" type="number" min="0.0001" step="0.0001" value="0.001" /></div>
          </div>
          <div class="grid cols-4" style="gap:12px">
            <div><label class="small" for="siteInventoryClass">Inventory class</label><select id="siteInventoryClass"><option value="raw_material">Raw material</option><option value="consumable">Consumable</option><option value="packaging">Packaging</option><option value="reusable_equipment">Reusable equipment</option><option value="kit">Purchased kit / bundle</option><option value="component">Component / part</option><option value="finished_good">Finished good</option><option value="sample">Sample / test material</option><option value="waste">Waste / scrap</option><option value="other">Other</option></select></div>
            <div><label class="small" for="siteInventoryLifecycleMode">Lifecycle</label><select id="siteInventoryLifecycleMode"><option value="consumable">Consumable</option><option value="reusable">Reusable</option><option value="kit">Kit — open into components</option><option value="stocked">Stocked</option><option value="nonstock">Non-stock / reference</option><option value="retired">Retired</option></select></div>
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryLotRecommended" type="checkbox"/> Track by purchase lot / batch</label>
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryExpiryRecommended" type="checkbox"/> Track expiry / best-before</label>
          </div>
          <div class="grid cols-2" style="gap:12px"><label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventorySourceMaterialRecommended" type="checkbox"/> This item should have supplier ingredient / INCI / allergen source-material data</label><div class="small">Use this for soap bases, fragrance/essential-oil blends, colourants and other materials whose supplier composition affects a finished product or label.</div></div>
          <div class="small inventory-usage-help">Examples: a 500 g mica jar can be <strong>stock unit = jar</strong>, <strong>usage unit = gram</strong>, <strong>500 usage units per stock unit</strong>. If a few sprinkles cannot be weighed reliably, choose <strong>Log use only</strong>; the use is recorded without pretending the jar is empty. Exact or estimated usage can also be fractional.</div>
          <div class="grid cols-4" style="gap:12px">
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryOnReorderList" type="checkbox" /> On reorder list</label>
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryDoNotReorder" type="checkbox" /> Reorder N/A / do not reorder</label>
            <label class="small" style="display:flex;gap:8px;align-items:center"><input id="siteInventoryDoNotReuse" type="checkbox" /> Do not reuse</label>
            <div></div>
          </div>
          <div class="grid cols-2" style="gap:12px">
            <div><label class="small" for="siteInventoryItemDescription">Item Description</label><textarea id="siteInventoryItemDescription" rows="3" placeholder="Purpose, material, size, or safe-use details..."></textarea></div>
            <div><label class="small" for="siteInventoryNotes">Reorder / Usage Notes</label><input id="siteInventoryNotes" type="text" /></div>
          </div>
          <div class="grid cols-2" style="gap:12px">
            <div><label class="small" for="siteInventoryMovementNote">Movement Note</label><input id="siteInventoryMovementNote" type="text" placeholder="restock, count correction, incoming order..." /></div>
            <div class="small" style="align-self:end">Full editing is available for every record. The external key stays fixed after creation. Tool ↔ supply classification can be corrected here and linked catalog/product-resource rows are updated with it.</div>
          </div>
          <div class="site-inventory-form-actions"><button class="btn primary" type="submit" id="siteInventorySaveButton">Add Inventory Item</button><button class="btn" type="button" id="siteInventoryResetButton">Start New Item</button><button class="btn" type="button" id="siteInventoryClearFieldsButton">Clear / Reset Fields</button></div>
        </form>

        <datalist id="siteInventoryUnitPresets">${unitPresetOptions.map((value)=>`<option value="${escapeHtml(value)}"></option>`).join('')}</datalist>
        <div id="siteInventorySyncResult" class="small card inventory-feedback-panel" style="display:none;margin-top:12px"></div>
        <div class="grid cols-4 site-inventory-toolbar" style="gap:12px;align-items:end;margin-top:16px">
          <div><label class="small" for="siteInventorySearch">Search</label><input id="siteInventorySearch" type="text" placeholder="name, category, supplier" /></div>
          <div><label class="small" for="siteInventoryStockView">Stock view</label><select id="siteInventoryStockView"><option value="">All items</option><option value="low">Low stock</option><option value="reorder">Reorder list</option><option value="no_reuse">Do not reuse</option><option value="inactive">Inactive</option><option value="tool">Tools only</option><option value="supply">Supplies only</option></select></div>
          <div class="site-inventory-toolbar-actions"><button class="btn" type="button" id="siteInventoryRefreshButton">Refresh</button><button class="btn" type="button" id="siteInventorySyncToolsButton">Reconcile D1 tools</button><button class="btn" type="button" id="siteInventorySyncSuppliesButton">Reconcile D1 supplies</button><button class="btn primary" type="button" id="siteInventorySyncAllButton">Reconcile D1 tools + supplies</button></div>
          <div class="small" style="grid-column:1/-1">Maintenance only: this copies missing rows from the D1 catalog authority into working inventory in small batches. It is not required after ordinary Amazon/manual entry and does not re-import the legacy JSON masters.</div>
        </div>

        <div class="card" style="margin-top:16px">
          <h4 style="margin-top:0">Bulk unit-cost updates</h4>
          <p class="small" style="margin-top:0">Use this for supplier increases, tariff changes, shipping and packaging cost shifts, or one-time cost corrections before repricing finished products.</p>
          <form id="siteInventoryBulkCostForm" class="grid" style="gap:12px">
            <div class="grid cols-4" style="gap:12px">
              <div>
                <label class="small" for="siteInventoryBulkScope">Selection Scope</label>
                <select id="siteInventoryBulkScope">
                  <option value="ids">Selected inventory IDs</option>
                  <option value="category">Entire category</option>
                  <option value="source_type">Entire source type</option>
                  <option value="all">Entire site inventory</option>
                </select>
              </div>
              <div>
                <label class="small" for="siteInventoryBulkIds">Inventory IDs</label>
                <input id="siteInventoryBulkIds" type="text" placeholder="12, 15, 18" />
              </div>
              <div>
                <label class="small" for="siteInventoryBulkCategory">Category</label>
                <input id="siteInventoryBulkCategory" type="text" placeholder="packaging, resin, cleaning..." />
              </div>
              <div>
                <label class="small" for="siteInventoryBulkSourceType">Source Type</label>
                <select id="siteInventoryBulkSourceType">
                  <option value="">Choose type</option>
                  <option value="tool">Tool</option>
                  <option value="supply">Supply</option>
                  <option value="product">Product</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div class="grid cols-3" style="gap:12px">
              <div>
                <label class="small" for="siteInventoryBulkCostAction">Cost Change</label>
                <select id="siteInventoryBulkCostAction">
                  <option value="">No change selected</option>
                  <option value="set_cost_cents">Set exact unit cost</option>
                  <option value="increase_percent">Increase by percent</option>
                  <option value="decrease_percent">Decrease by percent</option>
                  <option value="increase_cents">Increase by fixed amount</option>
                  <option value="decrease_cents">Decrease by fixed amount</option>
                </select>
              </div>
              <div>
                <label class="small" for="siteInventoryBulkCostValue">Cost Value</label>
                <input id="siteInventoryBulkCostValue" type="number" min="0" step="0.01" placeholder="e.g. 10 or 1.25" />
              </div>
              <div>
                <label class="small" for="siteInventoryBulkReason">Reason / note</label>
                <input id="siteInventoryBulkReason" type="text" maxlength="180" placeholder="Tariff increase, vendor shipping surcharge, packaging correction" />
              </div>
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn" type="button" id="siteInventoryBulkPreviewButton">Preview Cost Update</button>
              <button class="btn primary" type="submit" id="siteInventoryBulkApplyButton">Apply Cost Update</button>
            </div>
          </form>
          <div id="siteInventoryBulkCostPreview" class="small" style="display:none;margin-top:12px"></div>
        </div>

        <div class="site-inventory-view-toolbar" style="margin-top:12px">
          <div><strong>Inventory table editor</strong><div class="small">Edit quantity, stock unit, usage unit, usage-per-stock conversion and cost directly in the table. Cost per usage unit is calculated automatically. On desktop, scroll the table sideways so every field stays wide enough to read.</div></div>
          <button class="btn" type="button" id="siteInventoryTableModeButton" aria-pressed="true">Table editing: On</button>
        </div>
        <div class="admin-table-wrap site-inventory-table-wrap"><table class="site-inventory-admin-table"><thead><tr><th>Image / item</th><th>Category / supplier</th><th>On hand</th><th>Stock &amp; usage</th><th>Unit cost</th><th>Reorder at</th><th>Status</th><th>Actions</th></tr></thead><tbody id="siteInventoryList"><tr><td colspan="8" style="padding:8px">Loading inventory...</td></tr></tbody></table></div>
        <div class="site-inventory-pagination" id="siteInventoryPagination" aria-live="polite"><button class="btn" type="button" id="siteInventoryPreviousPage">Previous</button><span class="small" id="siteInventoryPageStatus">Page 1</span><button class="btn" type="button" id="siteInventoryNextPage">Next</button></div>
        <div class="card site-inventory-movements-card" style="margin-top:16px"><div class="section-heading-row"><div><h4 style="margin:0">Recent Inventory Movements</h4><div class="small">Not loaded during page startup so routine editing does not spend D1 reads on history.</div></div><button class="btn" type="button" id="siteInventoryLoadMovementsButton">Load recent movements</button></div><div class="admin-table-wrap site-inventory-movements-wrap"><table class="site-inventory-movements-table"><thead><tr><th>When</th><th>Item</th><th>Type</th><th>On Hand</th><th>Note</th></tr></thead><tbody id="siteInventoryMovementList"><tr><td colspan="5" style="padding:8px">Movement history is paused until requested.</td></tr></tbody></table></div></div>
      </div>`;

    document.getElementById('siteInventoryAmazonPreviewButton')?.addEventListener('click', previewAmazonLink);
    document.getElementById('siteInventoryAmazonImportUrl')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); previewAmazonLink(); }
    });
    document.getElementById('siteInventoryForm')?.addEventListener('submit', saveItem);
    document.getElementById('siteInventoryForm')?.addEventListener('input', debounce(saveInventoryDraft, 250));
    document.getElementById('siteInventoryForm')?.addEventListener('change', saveInventoryDraft);
    document.getElementById('siteInventoryImageUrl')?.addEventListener('input', updateSiteInventoryImagePreview);
    updateSiteInventoryImagePreview();
    document.getElementById('siteInventoryRefreshButton')?.addEventListener('click', () => loadList({ force: true }));
    document.getElementById('siteInventoryLoadMovementsButton')?.addEventListener('click', () => loadRecentMovements({ force: true }));
    document.getElementById('siteInventoryStockView')?.addEventListener('change', () => { inventoryPage = 1; loadList({ force: true }); });
    document.getElementById('siteInventorySourceType')?.addEventListener('change', () => { renderSeedDropdowns(); syncFormStationState(); });
    document.getElementById('siteInventorySeedSearch')?.addEventListener('focus', () => { if (!categorySeedOptions.length) loadSeedOptions(); }, { once: true });
    document.getElementById('siteInventorySeedSearch')?.addEventListener('input', debounce(async () => {
      seedSearchText = document.getElementById('siteInventorySeedSearch')?.value || '';
      await loadSeedOptions({ query: seedSearchText });
      renderSeedDropdowns();
    }, 250));
    document.getElementById('siteInventorySeedItem')?.addEventListener('change', (event) => { applySeedItemByKey(event.target.value || ''); });
    document.getElementById('siteInventoryCategoryPreset')?.addEventListener('change', (event) => {
      const option = event.target.selectedOptions?.[0];
      setInputValue('siteInventoryCategory', event.target.value ? String(option?.dataset?.processName || option?.textContent || '').trim().toLowerCase() : '');
      syncFormStationState();
    });
    document.getElementById('siteInventoryWorkstationRole')?.addEventListener('change', syncFormStationState);
    document.getElementById('siteInventoryDoNotReorder')?.addEventListener('change', syncFormReorderState);
    document.getElementById('siteInventorySyncToolsButton')?.addEventListener('click', () => syncCatalog(['tool']));
    document.getElementById('siteInventorySyncSuppliesButton')?.addEventListener('click', () => syncCatalog(['supply']));
    document.getElementById('siteInventorySyncAllButton')?.addEventListener('click', () => syncCatalog(['tool', 'supply']));
    document.getElementById('siteInventorySearch')?.addEventListener('input', debounce(() => { inventoryPage = 1; loadList({ force: true }); }, 500));
    document.getElementById('siteInventoryPreviousPage')?.addEventListener('click', () => { if (inventoryPage > 1) { inventoryPage -= 1; loadList({ force: true }); } });
    document.getElementById('siteInventoryNextPage')?.addEventListener('click', () => { inventoryPage += 1; loadList({ force: true }); });
    document.getElementById('siteInventoryResetButton')?.addEventListener('click', resetInventoryForm);
    document.getElementById('siteInventoryClearFieldsButton')?.addEventListener('click', clearInventoryWorkspaceFields);
    document.getElementById('siteInventoryBulkCostForm')?.addEventListener('submit', onBulkCostApply);
    document.getElementById('siteInventoryBulkPreviewButton')?.addEventListener('click', onBulkCostPreview);
    document.getElementById('siteInventoryBulkScope')?.addEventListener('change', updateBulkCostScopeHelpers);
    document.getElementById('siteInventoryBulkCostAction')?.addEventListener('change', updateBulkCostPlaceholder);
    document.getElementById('siteInventoryTableModeButton')?.addEventListener('click', () => {
      inventoryTableEditMode = !inventoryTableEditMode;
      const button = document.getElementById('siteInventoryTableModeButton');
      if (button) { button.textContent = `Table editing: ${inventoryTableEditMode ? 'On' : 'Off'}`; button.setAttribute('aria-pressed', inventoryTableEditMode ? 'true' : 'false'); }
      loadList();
    });
    updateBulkCostScopeHelpers();
    updateBulkCostPlaceholder();
    mountEl.addEventListener('click', onTableClick);
    mountEl.addEventListener('change', (event) => {
      const row = event.target?.closest?.('[data-inventory-row]');
      if (!row) return;
      if (event.target.matches('[data-field="do_not_reorder"]')) syncRowReorderState(row);
      if (event.target.matches('[data-field="inventory_process_id"],[data-field="workstation_role"],[data-field="source_type"]')) syncRowStationState(row);
    });
    mountEl.addEventListener('input', (event) => {
      if (!event.target?.matches?.('[data-field="unit_cost_dollars"],[data-field="usage_units_per_stock_unit"],[data-field="usage_unit_label"]')) return;
      updateRowUsageCost(event.target.closest('[data-inventory-row]'));
    });
  }

  function readForm() {
    return {
      site_item_inventory_id: editingSiteInventoryId || undefined,
      source_type: String(document.getElementById('siteInventorySourceType')?.value || 'other').trim().toLowerCase(),
      external_key: document.getElementById('siteInventoryExternalKey')?.value || '',
      item_name: document.getElementById('siteInventoryItemName')?.value || '',
      item_description: document.getElementById('siteInventoryItemDescription')?.value || '',
      inventory_process_id: Number(document.getElementById('siteInventoryCategoryPreset')?.value || 0),
      category: String(document.getElementById('siteInventoryCategory')?.value || '').trim().toLowerCase(),
      workstation_role: String(document.getElementById('siteInventoryWorkstationRole')?.value || 'associated').trim().toLowerCase(),
      workstation_site_item_inventory_id: Number(document.getElementById('siteInventoryParentStation')?.value || 0),
      image_url: document.getElementById('siteInventoryImageUrl')?.value || '',
      source_url: document.getElementById('siteInventorySourceUrl')?.value || '',
      amazon_url: document.getElementById('siteInventoryAmazonUrl')?.value || '',
      is_active: document.getElementById('siteInventoryIsActive')?.value || '1',
      on_hand_quantity: Number(document.getElementById('siteInventoryOnHand')?.value || 0),
      reserved_quantity: Number(document.getElementById('siteInventoryReservedInput')?.value || 0),
      incoming_quantity: Number(document.getElementById('siteInventoryIncomingInput')?.value || 0),
      reorder_level: Number(document.getElementById('siteInventoryReorder')?.value || 0),
      preferred_reorder_quantity: Number(document.getElementById('siteInventoryPreferredReorderQty')?.value || 0),
      unit_cost_cents: dollarsToCents(document.getElementById('siteInventoryUnitCost')?.value || '0') || 0,
      stock_unit_label: String(document.getElementById('siteInventoryStockUnitLabel')?.value || 'unit').trim().toLowerCase() || 'unit',
      usage_unit_label: String(document.getElementById('siteInventoryUsageUnitLabel')?.value || 'unit').trim().toLowerCase() || 'unit',
      usage_units_per_stock_unit: Math.max(0.001, Number(document.getElementById('siteInventoryUsageUnitsPerStock')?.value || 1) || 1),
      usage_tracking_mode: String(document.getElementById('siteInventoryUsageTrackingMode')?.value || 'exact').trim().toLowerCase(),
      minimum_usage_increment: Math.max(0.0001, Number(document.getElementById('siteInventoryMinimumUsageIncrement')?.value || 0.001) || 0.001),
      inventory_class: String(document.getElementById('siteInventoryClass')?.value || 'other').trim().toLowerCase(),
      lifecycle_mode: String(document.getElementById('siteInventoryLifecycleMode')?.value || 'stocked').trim().toLowerCase(),
      lot_tracking_recommended: document.getElementById('siteInventoryLotRecommended')?.checked ? 1 : 0,
      expiry_tracking_recommended: document.getElementById('siteInventoryExpiryRecommended')?.checked ? 1 : 0,
      source_material_recommended: document.getElementById('siteInventorySourceMaterialRecommended')?.checked ? 1 : 0,
      packaging_source_draft: lastAmazonPackagingSourceDraft,
      catalog_item_id: selectedCatalogItemId || undefined,
      supplier_name: document.getElementById('siteInventorySupplierName')?.value || '',
      supplier_sku: document.getElementById('siteInventorySupplierSku')?.value || '',
      supplier_contact: document.getElementById('siteInventorySupplierContact')?.value || '',
      reuse_status: String(document.getElementById('siteInventoryReuseStatus')?.value || '').trim().toLowerCase(),
      is_on_reorder_list: document.getElementById('siteInventoryOnReorderList')?.checked ? 1 : 0,
      do_not_reorder: document.getElementById('siteInventoryDoNotReorder')?.checked ? 1 : 0,
      do_not_reuse: document.getElementById('siteInventoryDoNotReuse')?.checked ? 1 : 0,
      reorder_notes: document.getElementById('siteInventoryNotes')?.value || '',
      movement_note: document.getElementById('siteInventoryMovementNote')?.value || ''
    };
  }

  function saveInventoryDraft() {
    try {
      const payload = readForm();
      if (!payload.item_name && !payload.external_key && !payload.amazon_url && !payload.source_url) return;
      localStorage.setItem(INVENTORY_DRAFT_KEY, JSON.stringify({ saved_at: new Date().toISOString(), payload }));
    } catch {}
  }

  function clearInventoryDraft() {
    try { localStorage.removeItem(INVENTORY_DRAFT_KEY); } catch {}
  }

  function restoreInventoryDraft() {
    try {
      const parsed = JSON.parse(localStorage.getItem(INVENTORY_DRAFT_KEY) || 'null');
      const payload = parsed?.payload;
      if (!payload || typeof payload !== 'object') return false;
      if (!payload.item_name && !payload.external_key && !payload.amazon_url && !payload.source_url) return false;
      populateFormFromItem(payload);
      setMessage('Recovered your unsaved inventory form from this browser. Review it before saving.');
      return true;
    } catch {
      return false;
    }
  }

  function renderMovements(movements) {
    const body = document.getElementById('siteInventoryMovementList');
    if (!body) return;
    if (!Array.isArray(movements) || !movements.length) {
      body.innerHTML = '<tr><td colspan="5" class="site-inventory-empty-row">No inventory movements recorded yet.</td></tr>';
      return;
    }
    body.innerHTML = movements.map((row) => `<tr>
      <td data-label="When">${escapeHtml(row.created_at || '—')}</td>
      <td data-label="Item"><strong>${escapeHtml(row.item_name || 'Item')}</strong><div class="small">${escapeHtml(row.source_type || '—')} • ${escapeHtml(row.external_key || '—')}</div></td>
      <td data-label="Type">${escapeHtml(row.movement_type || 'adjustment')}<div class="small">Δ ${row.quantity_delta || 0}</div></td>
      <td data-label="On hand">${row.previous_on_hand_quantity || 0} → ${row.new_on_hand_quantity || 0}<div class="small">Reserved ${row.previous_reserved_quantity || 0} → ${row.new_reserved_quantity || 0} • Incoming ${row.previous_incoming_quantity || 0} → ${row.new_incoming_quantity || 0}</div></td>
      <td data-label="Note">${escapeHtml(row.note || '—')}</td>
    </tr>`).join('');
  }

  async function loadRecentMovements({ force = false } = {}) {
    const body = document.getElementById('siteInventoryMovementList');
    if (body) body.innerHTML = '<tr><td colspan="5" style="padding:8px">Loading recent movement history…</td></tr>';
    try {
      const data = await window.DDAuth.apiJson(
        '/api/admin/site-item-inventory?history_only=1&limit=30',
        { method: 'GET' },
        {
          fallbackMessage: 'Failed to load recent inventory movements.',
          cacheKey: 'site-inventory:recent-movements',
          cacheTtlMs: 30000,
          preferCache: !force,
          retries: 0,
          staleOnError: true
        }
      );
    } catch (error) {
      if (body) body.innerHTML = `<tr><td colspan="5" class="site-inventory-empty-row">${escapeHtml(error.message || 'Movement history is temporarily unavailable.')}</td></tr>`;
    }
  }

  async function syncCatalog(sourceTypes) {
    const totals = { ok: true, requested_types: sourceTypes, scanned: 0, synced: 0, inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
    let cursor = 0;
    let batch = 0;
    try {
      setMessage(`Reconciling ${sourceTypes.join(', ')} from the D1 catalog authority into inventory in small batches...`);
      while (true) {
        batch += 1;
        const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', {
          method: 'POST',
          body: JSON.stringify({ action: 'sync_catalog', source_types: sourceTypes, cursor, limit: 50 })
        });
        const data = await readApiPayload(response, 'Inventory reconciliation failed.');
        if (!response.ok || !data?.ok) throw new Error([data?.error, data?.diagnostic].filter(Boolean).join(' — ') || 'Failed to reconcile catalog items.');
        ['scanned','synced','inserted','updated','skipped','failed'].forEach((key) => { totals[key] += Number(data[key] || 0); });
        if (Array.isArray(data.errors)) totals.errors.push(...data.errors);
        setMessage(`D1 reconciliation batch ${batch}: ${totals.synced} processed so far...`);
        if (data.done || data.next_cursor == null) break;
        cursor = Number(data.next_cursor || 0);
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      setInventorySyncResult(totals);
      setMessage(`D1 reconciliation complete. Processed ${totals.synced}; inserted ${totals.inserted}, safely updated ${totals.updated}, skipped ${totals.skipped}, failed ${totals.failed}.`);
      await Promise.allSettled([loadSeedOptions(), loadList({ force: true })]);
    } catch (err) {
      setMessage(err.message || 'Failed to reconcile D1 catalog items.', true);
    }
  }

  async function saveItem(event) {
    event.preventDefault();
    const saveButton = document.getElementById('siteInventorySaveButton');
    const originalLabel = saveButton?.textContent || 'Save Inventory Item';
    try {
      const payload = readForm();
      saveInventoryDraft();
      const isEditing = Number(payload.site_item_inventory_id || 0) > 0;
      if (saveButton) { saveButton.disabled = true; saveButton.textContent = isEditing ? 'Saving changes…' : 'Adding item…'; }
      setMessage(isEditing ? 'Saving changes to this inventory item...' : 'Adding inventory item...');
      const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });
      const data = await readApiPayload(response, 'Inventory save failed.');
      if (data?.item) populateFormFromItem(data.item);
      clearInventoryDraft();
      if (data?.classification_merge) {
        setMessage(`Classification corrected and duplicate inventory #${Number(data.classification_merge.archived_inventory_id || 0)} was consolidated into #${Number(data.classification_merge.canonical_inventory_id || 0)} without double-counting legacy default stock.`);
      } else {
        setMessage(isEditing ? 'Inventory item changes saved.' : 'Inventory item added. It remains open here for full editing.');
      }
      await loadList({ force: true });
    } catch (err) {
      saveInventoryDraft();
      const retryNote = err?.isRetryable ? ' Your form is saved in this browser; wait a moment and press Save again.' : '';
      setMessage(`${err.message || 'Failed to save inventory item.'}${retryNote}`, true);
    } finally {
      if (saveButton) { saveButton.disabled = false; saveButton.textContent = editingSiteInventoryId ? 'Save Changes to This Item' : originalLabel; }
    }
  }

  function populateFormFromItem(item = {}) {
    lastAmazonPackagingSourceDraft = null;
    selectedCatalogItemId = Number(item.catalog_item_id || 0) || 0;
    const mapping = {
      siteInventorySourceType: item.source_type || 'other',
      siteInventoryExternalKey: item.external_key || '',
      siteInventoryItemName: item.item_name || '',
      siteInventoryItemDescription: item.item_description || '',
      siteInventoryCategory: item.category || '',
      siteInventoryImageUrl: item.image_url || '',
      siteInventorySourceUrl: item.source_url || '',
      siteInventoryAmazonUrl: item.amazon_url || '',
      siteInventoryOnHand: Math.max(0, Number(item.on_hand_quantity || 0) || 0),
      siteInventoryReservedInput: item.reserved_quantity || 0,
      siteInventoryIncomingInput: item.incoming_quantity || 0,
      siteInventoryReorder: item.reorder_level || 0,
      siteInventoryPreferredReorderQty: item.preferred_reorder_quantity || 0,
      siteInventoryUnitCost: centsToDollarInput(item.unit_cost_cents || 0),
      siteInventoryStockUnitLabel: item.stock_unit_label || 'unit',
      siteInventoryUsageUnitLabel: item.usage_unit_label || 'unit',
      siteInventoryUsageUnitsPerStock: Math.max(0.001, Number(item.usage_units_per_stock_unit || 1) || 1),
      siteInventoryUsageTrackingMode: item.usage_tracking_mode || (String(item.source_type || '').toLowerCase() === 'tool' ? 'reusable' : 'exact'),
      siteInventoryMinimumUsageIncrement: Math.max(0.0001, Number(item.minimum_usage_increment || 0.001) || 0.001),
      siteInventoryClass: item.inventory_class || (String(item.source_type||'').toLowerCase()==='tool'?'reusable_equipment':'consumable'),
      siteInventoryLifecycleMode: item.lifecycle_mode || (String(item.source_type||'').toLowerCase()==='tool'?'reusable':'consumable'),
      siteInventorySupplierName: item.supplier_name || '',
      siteInventorySupplierSku: item.supplier_sku || '',
      siteInventorySupplierContact: item.supplier_contact || '',
      siteInventoryReuseStatus: item.reuse_status || '',
      siteInventoryNotes: item.reorder_notes || '',
      siteInventoryMovementNote: ''
    };
    Object.entries(mapping).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = value; });
    const isActiveEl = document.getElementById('siteInventoryIsActive'); if (isActiveEl) isActiveEl.value = String(Number(item.is_active) === 0 ? 0 : 1);
    const reorderEl = document.getElementById('siteInventoryOnReorderList'); if (reorderEl) reorderEl.checked = Number(item.is_on_reorder_list || 0) === 1;
    const dnrEl = document.getElementById('siteInventoryDoNotReorder'); if (dnrEl) dnrEl.checked = Number(item.do_not_reorder || 0) === 1;
    const dnuEl = document.getElementById('siteInventoryDoNotReuse'); if (dnuEl) dnuEl.checked = Number(item.do_not_reuse || 0) === 1;
    const lotEl=document.getElementById('siteInventoryLotRecommended');if(lotEl)lotEl.checked=Number(item.lot_tracking_recommended||0)===1;
    const expEl=document.getElementById('siteInventoryExpiryRecommended');if(expEl)expEl.checked=Number(item.expiry_tracking_recommended||0)===1;
    const srcEl=document.getElementById('siteInventorySourceMaterialRecommended');if(srcEl)srcEl.checked=Number(item.source_material_recommended||0)===1;
    syncCategoryPresetSelection(item.category || '', Number(item.inventory_process_id || 0));
    const roleEl = document.getElementById('siteInventoryWorkstationRole'); if (roleEl) roleEl.value = item.workstation_role || 'associated';
    const parentStationEl = document.getElementById('siteInventoryParentStation');
    if (parentStationEl) {
      parentStationEl.innerHTML = stationOptionsMarkup(Number(item.inventory_process_id || 0), Number(item.workstation_site_item_inventory_id || 0), Number(item.site_item_inventory_id || 0));
      parentStationEl.value = String(Number(item.workstation_site_item_inventory_id || 0) || '');
    }
    syncFormReorderState();
    syncFormStationState();
    const seedEl = document.getElementById('siteInventorySeedItem');
    if (seedEl) seedEl.value = item.external_key || '';
    updateSiteInventoryImagePreview();
    setInventoryEditMode(item);
    const sourceTypeEl = document.getElementById('siteInventorySourceType');
    const externalKeyEl = document.getElementById('siteInventoryExternalKey');
    if (sourceTypeEl) sourceTypeEl.disabled = false;
    if (externalKeyEl) externalKeyEl.readOnly = editingSiteInventoryId > 0;
  }

  async function loadList({ force = false } = {}) {
    if (listLoadPromise && !force) return listLoadPromise;
    const task = (async () => {
      try {
        setMessage('Loading inventory list...');
        const q = document.getElementById('siteInventorySearch')?.value || '';
        const stockView = document.getElementById('siteInventoryStockView')?.value || '';
        const cacheKey = `site-inventory:${String(q).trim().toLowerCase()}:${String(stockView).trim().toLowerCase()}:${inventoryPage}`;
        const data = await window.DDAuth.apiJson(
          `/api/admin/site-item-inventory?q=${encodeURIComponent(q)}&include_history=0&include_link_stats=0&stock_view=${encodeURIComponent(stockView)}&page=${inventoryPage}&page_size=${inventoryPageSize}`,
          { method: 'GET' },
          {
            fallbackMessage: 'Failed to load inventory list.',
            cacheKey,
            cacheTtlMs: 45000,
            preferCache: !force,
            retries: 0,
            staleOnError: true
          }
        );
      const summary = data.summary || {};
      setValue('siteInventoryTotalItems', summary.total_items || 0);
      setValue('siteInventoryActiveItems', summary.active_items || 0);
      setValue('siteInventoryLowStock', summary.low_stock_items || 0);
      setValue('siteInventoryReserved', summary.total_reserved || 0);
      setValue('siteInventoryIncoming', summary.total_incoming || 0);
      setValue('siteInventoryReorderListCount', summary.reorder_list_items || 0);

      const items = Array.isArray(data.items) ? data.items : [];
      const pagination = data.pagination || {};
      inventoryPage = Math.max(1, Number(pagination.page || inventoryPage || 1));
      const pageStatus = document.getElementById('siteInventoryPageStatus');
      if (pageStatus) pageStatus.textContent = `Page ${inventoryPage} of ${Math.max(1, Number(pagination.total_pages || 1))} • ${Number(pagination.total_items ?? summary.total_items ?? items.length)} matching item(s)`;
      const prevPage = document.getElementById('siteInventoryPreviousPage'); if (prevPage) prevPage.disabled = !pagination.has_previous;
      const nextPage = document.getElementById('siteInventoryNextPage'); if (nextPage) nextPage.disabled = !pagination.has_next;
      renderSeedDropdowns();
      const body = document.getElementById('siteInventoryList');
      if (!body) return;

      if (!items.length) {
        body.innerHTML = '<tr><td colspan="8" class="site-inventory-empty-row">No site inventory items matched the current view.</td></tr>';
      } else {
        body.innerHTML = items.map((x) => {
          const edit = inventoryTableEditMode;
          return `
          <tr data-inventory-row="${x.site_item_inventory_id}" data-source-type="${escapeHtml(x.source_type || '')}">
            <td data-label="Image / item">
              <div class="site-inventory-grid-identity">
                ${x.image_url ? `<a class="site-inventory-list-thumb" href="${escapeHtml(x.image_url)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(x.image_url)}" alt="${escapeHtml(x.item_name)}" loading="lazy"/></a>` : '<div class="site-inventory-list-thumb is-empty small">No image</div>'}
                <div>${edit ? `<input class="site-inventory-row-input" data-field="item_name" value="${escapeHtml(x.item_name)}" aria-label="Item name"/>${['tool','supply'].includes(String(x.source_type||'').toLowerCase()) ? `<select class="site-inventory-row-input" data-field="source_type" aria-label="Tool or supply classification"><option value="tool" ${String(x.source_type)==='tool'?'selected':''}>tool</option><option value="supply" ${String(x.source_type)==='supply'?'selected':''}>supply</option></select>` : `<span class="small">${escapeHtml(x.source_type||'other')}</span>`}` : `<strong>${escapeHtml(x.item_name)}</strong>`}<div class="small">#${x.site_item_inventory_id} · ${escapeHtml(x.external_key)}</div></div>
              </div>
            </td>
            <td data-label="Category / supplier">
              ${edit ? `
                <label class="small">Workstation / category<select class="site-inventory-row-input" data-field="inventory_process_id" aria-label="Workstation category">${processOptionsMarkup(x.inventory_process_id, x.category)}</select></label>
                <label class="small">Role<select class="site-inventory-row-input" data-field="workstation_role" aria-label="Workstation role"><option value="associated" ${String(x.workstation_role||'associated')!=='station'?'selected':''}>Associated tool / supply</option><option value="station" ${String(x.workstation_role||'')==='station'?'selected':''} ${String(x.source_type||'').toLowerCase()!=='tool'?'disabled':''}>This tool is the workstation</option></select></label>
                <label class="small">Specific station<select class="site-inventory-row-input" data-field="workstation_site_item_inventory_id" aria-label="Specific station tool">${stationOptionsMarkup(x.inventory_process_id, x.workstation_site_item_inventory_id, x.site_item_inventory_id)}</select></label>
                <label class="small">Supplier<input class="site-inventory-row-input" data-field="supplier_name" value="${escapeHtml(x.supplier_name || '')}" aria-label="Supplier" placeholder="Supplier"/></label>
                <label class="small">Amazon link<input class="site-inventory-row-input" data-field="amazon_url" type="url" value="${escapeHtml(x.amazon_url || '')}" placeholder="https://www.amazon.ca/dp/..." aria-label="Amazon product URL"/></label>
                <button class="btn" type="button" data-amazon-fill-id="${x.site_item_inventory_id}" data-item='${escapeHtml(JSON.stringify(x))}'>Fill missing from Amazon</button>
              ` : `<strong>${escapeHtml(x.process_name || x.category || 'Unassigned')}</strong><div class="small">${escapeHtml(x.workstation_role === 'station' ? 'Workstation itself' : (x.workstation_item_name ? 'Associated with ' + x.workstation_item_name : 'Associated item'))}</div><div class="small">${escapeHtml(x.supplier_name || '—')}</div>`}
            </td>
            <td data-label="On hand">${edit ? `<input class="site-inventory-row-number" data-field="on_hand_quantity" type="number" min="0" step="0.001" value="${Number(x.on_hand_quantity || 0)}"/>` : Number(x.on_hand_quantity || 0)}<div class="small">${escapeHtml(x.stock_unit_label || 'unit')}</div></td>
            <td data-label="Stock & usage">
              ${edit ? `<div class="site-inventory-inline-units">
                <label><span class="small">Stock unit</span><select class="site-inventory-row-input" data-field="stock_unit_label">${unitOptionsMarkup(x.stock_unit_label || 'unit')}</select></label>
                <label><span class="small">Usage unit</span><select class="site-inventory-row-input" data-field="usage_unit_label">${unitOptionsMarkup(x.usage_unit_label || 'unit')}</select></label>
                <label style="grid-column:1/-1"><span class="small">Usage units / stock unit</span><input class="site-inventory-row-number" data-field="usage_units_per_stock_unit" type="number" min="0.001" step="0.001" value="${Number(x.usage_units_per_stock_unit || 1)}" /></label>
              </div>` : `<strong>${escapeHtml(x.stock_unit_label || 'unit')}</strong> → ${Number(x.usage_units_per_stock_unit || 1)} ${escapeHtml(x.usage_unit_label || 'unit')}`}
              <div class="small">Cost / usage: <strong data-cost-per-usage>${fmtMoney(Number(x.cost_per_usage_unit_cents ?? costPerUsageCents(x)))}</strong> / <span data-cost-per-usage-label>${escapeHtml(x.usage_unit_label || 'unit')}</span></div>
            </td>
            <td data-label="Unit cost">${edit ? `<input class="site-inventory-row-money" data-field="unit_cost_dollars" type="number" min="0" step="0.01" value="${escapeHtml(centsToDollarInput(x.unit_cost_cents || 0))}"/>` : fmtMoney(x.unit_cost_cents || 0)}<div class="small">CAD / ${escapeHtml(x.stock_unit_label || 'unit')}</div></td>
            <td data-label="Reorder at">${edit ? `<select class="site-inventory-row-input" data-field="do_not_reorder" aria-label="Reorder mode"><option value="0" ${Number(x.do_not_reorder||0)!==1?'selected':''}>Use reorder threshold</option><option value="1" ${Number(x.do_not_reorder||0)===1?'selected':''}>N/A — do not reorder</option></select><input class="site-inventory-row-number" data-field="reorder_level" type="number" min="0" step="0.001" value="${Number(x.reorder_level || 0)}" ${Number(x.do_not_reorder||0)===1?'disabled':''}/>` : (Number(x.do_not_reorder||0)===1 ? 'N/A' : Number(x.reorder_level || 0))}<div class="small">${Number(x.do_not_reorder||0)===1 ? 'Not reordered' : (x.needs_reorder ? 'Needs reorder' : 'Stock okay')}</div></td>
            <td data-label="Status">${edit ? `<select class="site-inventory-row-input" data-field="is_active"><option value="1" ${Number(x.is_active)!==0?'selected':''}>Active</option><option value="0" ${Number(x.is_active)===0?'selected':''}>Inactive</option></select>` : (Number(x.is_active)===0?'Inactive':'Active')}<div class="small">${escapeHtml(x.usage_tracking_mode || (String(x.source_type||'').toLowerCase()==='tool'?'reusable':'exact'))} usage tracking</div></td>
            <td class="site-inventory-row-actions" data-label="Actions"><div class="site-inventory-action-buttons">
              ${edit ? `<button class="btn primary" type="button" data-save-row-id="${x.site_item_inventory_id}" data-item='${escapeHtml(JSON.stringify(x))}'>Save row</button>` : ''}
              <button class="btn" type="button" data-load-form-id="${x.site_item_inventory_id}" data-item='${escapeHtml(JSON.stringify(x))}'>Full edit</button>
              <button class="btn" type="button" data-open-inventory-lots="${x.site_item_inventory_id}">Lots</button>
              <button class="btn" type="button" data-adjust-action="receive" data-id="${x.site_item_inventory_id}">Receive</button>
              <button class="btn" type="button" data-adjust-action="consume_usage" data-id="${x.site_item_inventory_id}" data-item='${escapeHtml(JSON.stringify(x))}'>Record use</button>
              <button class="btn danger" type="button" data-delete-id="${x.site_item_inventory_id}">Delete</button>
            </div></td>
          </tr>`;
        }).join('');
        body.querySelectorAll('[data-inventory-row]').forEach((row) => {
          syncRowReorderState(row);
          syncRowStationState(row);
        });
      }

      renderMovements(data.movements || []);
      setMessage(data?._response_meta?.stale ? 'The server is temporarily busy. Showing the last saved inventory view; edits remain available and can be retried.' : '', Boolean(data?._response_meta?.stale));
      } catch (err) {
        setMessage(err.message || 'Failed to load inventory list.', true);
      }
    })();
    listLoadPromise = task;
    try { return await task; }
    finally { if (listLoadPromise === task) listLoadPromise = null; }
  }


  function readEditableRowPayload(row, original = {}) {
    const value = (field) => row.querySelector(\`[data-field="\${field}"]\`)?.value;
    const processSelect = row.querySelector('[data-field="inventory_process_id"]');
    const processName = String(processSelect?.selectedOptions?.[0]?.dataset?.processName || processSelect?.selectedOptions?.[0]?.textContent || '').trim();
    return {
      ...original,
      site_item_inventory_id: Number(row.dataset.inventoryRow || original.site_item_inventory_id || 0),
      source_type: String(value('source_type') || original.source_type || 'other').trim().toLowerCase(),
      item_name: value('item_name') || original.item_name,
      inventory_process_id: Number(value('inventory_process_id') || 0),
      category: processName && !/^unassigned/i.test(processName) ? processName.toLowerCase() : '',
      workstation_role: String(value('workstation_role') || original.workstation_role || 'associated').trim().toLowerCase(),
      workstation_site_item_inventory_id: Number(value('workstation_site_item_inventory_id') || 0),
      supplier_name: value('supplier_name') || '',
      amazon_url: String(value('amazon_url') || original.amazon_url || '').trim(),
      on_hand_quantity: Math.max(0, Number(value('on_hand_quantity') || 0)),
      stock_unit_label: String(value('stock_unit_label') || original.stock_unit_label || 'unit').trim().toLowerCase(),
      usage_unit_label: String(value('usage_unit_label') || original.usage_unit_label || 'unit').trim().toLowerCase(),
      usage_units_per_stock_unit: Math.max(0.001, Number(value('usage_units_per_stock_unit') || original.usage_units_per_stock_unit || 1) || 1),
      usage_tracking_mode: String(value('usage_tracking_mode') || original.usage_tracking_mode || (String(value('source_type') || original.source_type || '').toLowerCase()==='tool'?'reusable':'exact')).trim().toLowerCase(),
      reorder_level: Math.max(0, Number(value('reorder_level') || original.reorder_level || 0)),
      do_not_reorder: Number(value('do_not_reorder')) === 1 ? 1 : 0,
      unit_cost_cents: Math.max(0, Math.round(Number(value('unit_cost_dollars') || 0) * 100)),
      is_active: Number(value('is_active')) === 0 ? 0 : 1,
      movement_note: 'Saved from inventory card/table editor.'
    };
  }

  async function fillMissingFromAmazon(row, original = {}, button) {
    const payload = readEditableRowPayload(row, original);
    const url = String(payload.amazon_url || '').trim();
    if (!url) throw new Error('Paste the proper Amazon product link into this card first.');
    const originalLabel = button?.textContent || 'Fill missing from Amazon';
    if (button) { button.disabled = true; button.textContent = 'Checking Amazon…'; }
    try {
      const previewResponse = await window.DDAuth.apiFetch('/api/admin/amazon-link-preview', {
        method: 'POST',
        body: JSON.stringify({ amazon_url: url, source_type: payload.source_type })
      });
      const preview = await readApiPayload(previewResponse, 'Amazon metadata could not be loaded.');
      const draft = preview?.draft || {};
      const filled = [];
      payload.amazon_url = draft.amazon_url || draft.source_url || url;
      if (!String(payload.source_url || '').trim() && draft.source_url) { payload.source_url = draft.source_url; filled.push('source link'); }
      if (!String(payload.image_url || '').trim() && draft.image_url) { payload.image_url = draft.image_url; filled.push('image'); }
      if (!String(payload.supplier_name || '').trim() && draft.supplier_name) { payload.supplier_name = draft.supplier_name; filled.push('supplier'); }
      if (!String(payload.supplier_sku || '').trim() && draft.supplier_sku) { payload.supplier_sku = draft.supplier_sku; filled.push('supplier SKU'); }
      if (!String(payload.item_description || '').trim() && draft.item_description) { payload.item_description = draft.item_description; filled.push('description'); }
      if (Number(payload.unit_cost_cents || 0) <= 0 && Number(draft.current_price_cents || 0) > 0) {
        payload.unit_cost_cents = Number(draft.current_price_cents);
        filled.push('current CAD price');
      }
      if (Number(payload.usage_units_per_stock_unit || 1) <= 1 && Number(draft.package_units || 0) > 1) {
        payload.usage_units_per_stock_unit = Number(draft.package_units);
        if (['unit','each','piece'].includes(String(payload.usage_unit_label || 'unit')) && draft.usage_unit_label) payload.usage_unit_label = draft.usage_unit_label;
        if (String(payload.stock_unit_label || 'unit') === 'unit' && draft.stock_unit_label) payload.stock_unit_label = draft.stock_unit_label;
        filled.push('units per package');
      }
      payload.movement_note = 'Filled missing Inventory facts from reviewed Amazon metadata; existing values were preserved.';
      const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', { method: 'PATCH', body: JSON.stringify(payload) });
      await readApiPayload(response, 'Amazon Inventory fill failed.');
      const warnings = Array.isArray(preview?.warnings) && preview.warnings.length ? ' ' + preview.warnings.join(' ') : '';
      setMessage(filled.length ? 'Filled missing ' + filled.join(', ') + '. Existing values were not overwritten.' + warnings : 'Amazon was checked, but there were no missing supported fields to fill.' + warnings);
      await loadList({ force: true });
    } finally {
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  }

  async function onTableClick(event) {
    const saveRowBtn = event.target.closest('[data-save-row-id]');
    if (saveRowBtn) {
      const id = Number(saveRowBtn.getAttribute('data-save-row-id') || 0);
      const row = saveRowBtn.closest('[data-inventory-row]');
      let original = {};
      try { original = JSON.parse(saveRowBtn.getAttribute('data-item') || '{}'); } catch {}
      if (!id || !row) return;
      const payload = readEditableRowPayload(row, original);
      try {
        saveRowBtn.disabled = true; saveRowBtn.textContent = 'Saving…';
        const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', { method: 'PATCH', body: JSON.stringify(payload) });
        const data = await readApiPayload(response, 'Row update failed.');
        const savedItem = data?.item || payload;
        stationToolOptions = stationToolOptions.filter((entry) => Number(entry.site_item_inventory_id || 0) !== id);
        if (String(savedItem.workstation_role || payload.workstation_role || '') === 'station' && String(savedItem.source_type || payload.source_type || '').toLowerCase() === 'tool') {
          stationToolOptions.push({
            site_item_inventory_id: id,
            item_name: savedItem.item_name || payload.item_name,
            inventory_process_id: Number(savedItem.inventory_process_id || payload.inventory_process_id || 0),
            process_key: savedItem.process_key || '',
            process_name: savedItem.process_name || ''
          });
        }
        setMessage(`${payload.item_name} updated.`);
        await loadList({ force: true });
      } catch (error) {
        setMessage(error.message || 'Row update failed.', true);
        saveRowBtn.disabled = false; saveRowBtn.textContent = 'Save row';
      }
      return;
    }
    const amazonFillBtn = event.target.closest('[data-amazon-fill-id]');
    const editBtn = event.target.closest('[data-edit-id]');
    const deleteBtn = event.target.closest('[data-delete-id]');
    const loadFormBtn = event.target.closest('[data-load-form-id]');

    if (amazonFillBtn) {
      const row = amazonFillBtn.closest('[data-inventory-row]');
      let original = {};
      try { original = JSON.parse(amazonFillBtn.getAttribute('data-item') || '{}'); } catch {}
      if (!row) return;
      try {
        await fillMissingFromAmazon(row, original, amazonFillBtn);
      } catch (error) {
        setMessage(error.message || 'Amazon Inventory fill failed.', true);
      }
      return;
    }

    if (loadFormBtn) {
      let item = null;
      try { item = JSON.parse(loadFormBtn.getAttribute('data-item') || '{}'); } catch { item = null; }
      if (item) {
        populateFormFromItem(item);
        setMessage(`Loaded ${item.item_name || 'inventory item'} into the form.`);
        document.getElementById('siteInventoryForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (editBtn) {
      let item = null;
      try {
        item = JSON.parse(editBtn.getAttribute('data-item') || '{}');
      } catch {
        item = null;
      }
      const id = Number(item?.site_item_inventory_id || editBtn.getAttribute('data-edit-id') || 0);
      if (!id) return;

      const onHandRaw = window.prompt('New on-hand quantity?', String(item?.on_hand_quantity ?? 0));
      if (onHandRaw === null) return;
      const onHand = Number(onHandRaw);
      if (!Number.isFinite(onHand) || onHand < 0) return;
      const unitCostRaw = window.prompt('New unit cost in dollars?', String((Number(item?.unit_cost_cents || 0) / 100).toFixed(2)));
      if (unitCostRaw === null) return;
      const unitCostDollars = Number(unitCostRaw);
      if (!Number.isFinite(unitCostDollars) || unitCostDollars < 0) return;
      const stockLabel = String(window.prompt('Stock unit label?', String(item?.stock_unit_label || 'unit')) || '').trim() || 'unit';
      const usageLabel = String(window.prompt('Usage unit label?', String(item?.usage_unit_label || 'unit')) || '').trim() || 'unit';
      const usageUnitsRaw = window.prompt(`How many ${usageLabel} are in one ${stockLabel}?`, String(Number(item?.usage_units_per_stock_unit || 1)));
      if (usageUnitsRaw === null) return;
      const usageUnitsPerStock = Math.max(0.001, Number(usageUnitsRaw || 1) || 1);
      const reorderList = window.confirm('Put this item on the reorder list? Click Cancel to leave it off.');
      const doNotReuse = window.confirm('Mark this item as DO NOT REUSE? Click Cancel to leave reusable/normal.');
      const movementNote = String(window.prompt('Movement note?', 'Manual stock / cost correction') || '').trim();

      try {
        setMessage('Updating inventory item...');
        const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', {
          method: 'PATCH',
          body: JSON.stringify({
            site_item_inventory_id: id,
            item_name: item?.item_name || '',
            on_hand_quantity: onHand,
            unit_cost_cents: Math.round(unitCostDollars * 100),
            stock_unit_label: stockLabel,
            usage_unit_label: usageLabel,
            usage_units_per_stock_unit: usageUnitsPerStock,
            is_on_reorder_list: reorderList ? 1 : 0,
            do_not_reuse: doNotReuse ? 1 : 0,
            movement_note: movementNote || 'Inventory quantity / cost updated.'
          })
        });
        const data = await readApiPayload(response, 'Failed to update inventory item.');
        await loadList({ force: true });
      } catch (error) {
        setMessage(error.message || 'Failed to update inventory item.', true);
      }
      return;
    }

    const adjustBtn = event.target.closest('[data-adjust-action]');
    if (adjustBtn) {
      const id = Number(adjustBtn.getAttribute('data-id') || 0);
      const action = String(adjustBtn.getAttribute('data-adjust-action') || '').trim();
      if (!id || !action) return;
      let actionItem = {};
      try { actionItem = JSON.parse(adjustBtn.getAttribute('data-item') || '{}'); } catch {}
      const usageLabel = String(actionItem.usage_unit_label || 'unit').trim() || 'unit';
      const minIncrement = Math.max(0.0001, Number(actionItem.minimum_usage_increment || 0.001) || 0.001);
      const qtyPrompt = action === 'consume_usage'
        ? `How many ${usageLabel} were used? Decimals are allowed (smallest configured increment ${minIncrement}).`
        : 'Quantity?';
      const qtyRaw = window.prompt(qtyPrompt, action === 'consume_usage' ? String(minIncrement) : '1');
      if (qtyRaw === null) return;
      const qty = Number(qtyRaw);
      if (!Number.isFinite(qty) || qty <= 0) return;
      const defaultNotes = { reserve: 'Manual reservation', release: 'Manual reservation release', receive: 'Received stock', consume: 'Consumed in production', consume_usage: 'Recorded material use', reorder_request: 'Manual reorder request' };
      const note = String(window.prompt('Note?', defaultNotes[action] || `Inventory ${action}`) || '').trim();
      try {
        setMessage(`Running ${action}...`);
        const response = await window.DDAuth.apiFetch('/api/admin/site-item-inventory', {
          method: 'POST',
          body: JSON.stringify({ action, site_item_inventory_id: id, quantity: qty, note })
        });
        const data = await readApiPayload(response, `Failed to ${action}.`);
        await loadList({ force: true });
      } catch (error) {
        setMessage(error.message || `Failed to ${action}.`, true);
      }
      return;
    }

    if (deleteBtn) {
      const id = Number(deleteBtn.getAttribute('data-delete-id') || 0);
      if (!id || !window.confirm('Delete this inventory item?')) return;
      try {
        setMessage('Deleting inventory item...');
        const response = await window.DDAuth.apiFetch(`/api/admin/site-item-inventory?site_item_inventory_id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        const data = await readApiPayload(response, 'Failed to delete inventory item.');
        await loadList({ force: true });
      } catch (error) {
        setMessage(error.message || 'Failed to delete inventory item.', true);
      }
    }
  }

  function startInitialLoad() {
    render();
    if (initialLoadStarted || !window.DDAuth?.isLoggedIn()) return;
    initialLoadStarted = true;
    restoreInventoryDraft();
    // Build 184: Catalog Health may route a reviewed Tool/Supply image issue here.
    // Prefill only the normal bounded Inventory search; no mutation or extra authority is introduced.
    const deepSearch = String(new URLSearchParams(window.location.search).get('q') || '').trim().slice(0, 160);
    if (deepSearch) {
      const search = document.getElementById('siteInventorySearch');
      if (search) search.value = deepSearch;
    }
    loadList();
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (event?.detail?.ok) startInitialLoad();
  });

  render();
  if (window.DDAuth?.isLoggedIn()) startInitialLoad();
});
