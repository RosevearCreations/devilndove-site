// File: /public/js/admin-catalog-option-manager.js
// Release 467 Build 68: canonical Product catalog option authority client/manager.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('catalogOptionManagerMount');
  if (!mountEl) return;

  const state = {
    authority_version: 'R467B68_V1',
    authority_source: 'catalog-option-authority',
    cache: null,
    d1_read_contract: null,
    option_sets: {
      category_options: [],
      color_options: [],
      shipping_code_options: [],
      product_type_options: ['physical', 'digital'],
      product_status_options: ['draft', 'active', 'archived'],
      product_review_status_options: ['pending_review', 'approved', 'needs_changes', 'published'],
      merchandise_origin_options: ['handmade', 'vintage', 'collectible', 'antique', 'oddity', 'prebuilt'],
      sale_channel_options: ['onsite', 'hybrid', 'external_only']
    },
    tax_classes: []
  };

  const labelMaps = {
    product_type: { physical: 'Physical', digital: 'Digital' },
    status: { draft: 'Draft', active: 'Active', archived: 'Archived' },
    review_status: { pending_review: 'Pending review', approved: 'Approved', needs_changes: 'Needs changes', published: 'Published' },
    merchandise_origin: { handmade: 'Handmade', vintage: 'Vintage', collectible: 'Collectible', antique: 'Antique', oddity: 'Oddity / curiosity', prebuilt: 'Pre-built / found item' },
    sale_channel: { onsite: 'Sell on Devil n Dove', hybrid: 'Sell here + external listing', external_only: 'External listing only' }
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[ch]));
  }

  function clean(value) { return String(value ?? '').trim(); }

  function setMessage(message, isError = false) {
    const el = document.getElementById('catalogOptionManagerMessage');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.classList.toggle('is-error', Boolean(message && isError));
    el.classList.toggle('is-success', Boolean(message && !isError));
  }

  function splitLines(value) {
    return Array.from(new Set(String(value || '')
      .split(/\n|,/g)
      .map((entry) => clean(entry).toLowerCase())
      .filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  function taxFraction(value) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return numeric > 1 ? numeric / 100 : numeric;
  }

  function formatPercent(value) {
    return (taxFraction(value) * 100).toFixed(3).replace(/\.0+$|(?<=\.\d*[1-9])0+$/g, '');
  }

  function taxRateFromPercentInput(value) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return numeric / 100;
  }

  async function readJsonResponse(response, fallbackMessage) {
    if (window.DDAuth?.readApiJson) return window.DDAuth.readApiJson(response, fallbackMessage);
    const text = await response.text().catch(() => '');
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!response.ok || !data?.ok) throw new Error(data?.error || fallbackMessage);
      return data;
    }
    throw new Error(text ? `${fallbackMessage} Server returned a non-JSON response.` : fallbackMessage);
  }

  function normalizeOptionRows(values, preferredValue = '') {
    const rows = Array.from(new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean)));
    const preferred = clean(preferredValue);
    if (preferred && !rows.some((value) => value.toLowerCase() === preferred.toLowerCase())) rows.push(preferred);
    return rows;
  }

  function applySimpleSelect(select, values, placeholder, preferredValue = '', labelMap = null) {
    if (!select) return;
    const current = clean(preferredValue || select.value);
    const rows = normalizeOptionRows(values, current);
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + rows.map((value) => {
      const label = labelMap?.[value] || value;
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    }).join('');
    if (current) select.value = current;
  }

  function applyTaxSelect(select, taxClasses, preferredValue = '') {
    if (!select) return;
    const current = clean(preferredValue || select.value);
    const rows = Array.isArray(taxClasses) ? [...taxClasses] : [];
    if (current && !rows.some((row) => String(Number(row?.tax_class_id || 0)) === current)) {
      rows.push({ tax_class_id: Number(current || 0), name: `Existing tax class #${current}`, code: '', tax_rate: 0, is_active: 0 });
    }
    select.innerHTML = '<option value="">Select tax class</option>' + rows.map((row) => {
      const id = Number(row?.tax_class_id || 0);
      const inactive = Number(row?.is_active ?? 1) === 0 ? ' · inactive' : '';
      return `<option value="${id}">${escapeHtml(row?.name || row?.code || `Tax ${id}`)} (${escapeHtml(formatPercent(row?.tax_rate || 0))}%)${inactive}</option>`;
    }).join('');
    if (current) select.value = current;
  }

  function applyAuthorityToProductEditor(product = null) {
    const form = document.getElementById('createProductForm');
    if (!form) return;
    const options = state.option_sets || {};
    const currentProduct = product && typeof product === 'object' ? product : {};

    applySimpleSelect(document.getElementById('create_product_category'), options.category_options, 'Select category', currentProduct.product_category || '');
    applySimpleSelect(document.getElementById('create_product_color_name'), options.color_options, 'Select primary colour', currentProduct.color_name || '');
    applySimpleSelect(document.getElementById('create_product_shipping_code'), options.shipping_code_options, 'Select shipping code', currentProduct.shipping_code || '');
    applySimpleSelect(form.elements.namedItem('product_type'), options.product_type_options, 'Select product type', currentProduct.product_type || '', labelMaps.product_type);
    applySimpleSelect(form.elements.namedItem('status'), options.product_status_options, 'Select status', currentProduct.status || '', labelMaps.status);
    applySimpleSelect(form.elements.namedItem('review_status'), options.product_review_status_options, 'Select review status', currentProduct.review_status || '', labelMaps.review_status);
    applySimpleSelect(form.elements.namedItem('merchandise_origin'), options.merchandise_origin_options, 'Select merchandise origin', currentProduct.merchandise_origin || '', labelMaps.merchandise_origin);
    applySimpleSelect(form.elements.namedItem('sale_channel'), options.sale_channel_options, 'Select sale channel', currentProduct.sale_channel || '', labelMaps.sale_channel);
    applyTaxSelect(document.getElementById('create_product_tax_class_id'), state.tax_classes, currentProduct.tax_class_id == null ? '' : currentProduct.tax_class_id);
  }

  function applyAuthorityPayload(data) {
    state.authority_version = data?.authority_version || state.authority_version;
    state.authority_source = data?.authority_source || state.authority_source;
    state.cache = data?.cache || null;
    state.d1_read_contract = data?.d1_read_contract || null;
    state.option_sets = { ...state.option_sets, ...(data?.option_sets || {}) };
    state.tax_classes = Array.isArray(data?.tax_classes) ? data.tax_classes : state.tax_classes;
  }

  function renderTaxClassRows() {
    const rows = Array.isArray(state.tax_classes) ? state.tax_classes : [];
    if (!rows.length) return '<tr><td colspan="5" style="padding:8px">No tax codes saved yet.</td></tr>';
    return rows.map((row) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(row.code || '')}</strong></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(row.name || '')}<div class="small">${escapeHtml(row.description || '')}</div></td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(formatPercent(row.tax_rate || 0))}%</td>
        <td style="padding:8px;border-bottom:1px solid #ddd">${Number(row.is_active || 0) === 1 ? 'Active' : 'Inactive'}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd"><button class="btn" type="button" data-edit-tax-class="${Number(row.tax_class_id || 0)}">Edit</button> <button class="btn" type="button" data-delete-tax-class="${Number(row.tax_class_id || 0)}">Remove / Disable</button></td>
      </tr>`).join('');
  }

  function authoritySummary() {
    const cacheState = state.cache?.state ? ` · cache ${state.cache.state}` : '';
    const readContract = state.d1_read_contract;
    const reads = readContract ? ` · cold authority read: ${Number(readContract.catalog_setting_queries || 0) + Number(readContract.tax_class_queries || 0)} query groups, 0 Product scans` : '';
    return `${state.authority_version || 'Catalog authority'} · ${state.authority_source || 'shared source'}${cacheState}${reads}`;
  }

  function render() {
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Dropdowns, Tax Codes &amp; Lookup Values</h3>
        <p class="small" style="margin-top:0">Build 68 makes this the shared Product catalog option authority. Categories, colours, and shipping codes are editable app settings. Product types and workflow-state values are validated system semantics. Tax classes remain audited tax records. Product editors, phone capture, and recovery paths consume the same authority.</p>
        <div class="small" style="margin:0 0 12px 0"><strong>Authority:</strong> ${escapeHtml(authoritySummary())}</div>
        <div id="catalogOptionManagerMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <div class="grid cols-3" style="gap:12px">
          <div class="card" style="padding:12px">
            <h4 style="margin-top:0">Categories</h4>
            <textarea id="catalogCategoriesTextarea" class="input" rows="10" placeholder="One category per line">${escapeHtml((state.option_sets.category_options || []).join('\n'))}</textarea>
            <div class="small" style="margin-top:6px">Canonical category choices for Product create/edit and phone capture.</div>
            <div style="margin-top:10px"><button class="btn" type="button" data-save-option-set="categories">Save Categories</button></div>
          </div>
          <div class="card" style="padding:12px">
            <h4 style="margin-top:0">Colours</h4>
            <textarea id="catalogColorsTextarea" class="input" rows="10" placeholder="One colour per line">${escapeHtml((state.option_sets.color_options || []).join('\n'))}</textarea>
            <div class="small" style="margin-top:6px">Keep common finish and colour choices here.</div>
            <div style="margin-top:10px"><button class="btn" type="button" data-save-option-set="colors">Save Colours</button></div>
          </div>
          <div class="card" style="padding:12px">
            <h4 style="margin-top:0">Shipping codes</h4>
            <textarea id="catalogShippingTextarea" class="input" rows="10" placeholder="One shipping code per line">${escapeHtml((state.option_sets.shipping_code_options || []).join('\n'))}</textarea>
            <div class="small" style="margin-top:6px">Examples: standard-jewelry, pickup-only, oversize.</div>
            <div style="margin-top:10px"><button class="btn" type="button" data-save-option-set="shipping_codes">Save Shipping Codes</button></div>
          </div>
          <div class="card" style="padding:12px">
            <h4 style="margin-top:0">Product types &amp; workflow values</h4>
            <div class="small"><strong>Product types:</strong> ${(state.option_sets.product_type_options || []).map((value) => escapeHtml(labelMaps.product_type[value] || value)).join(', ') || '—'}</div>
            <div class="small" style="margin-top:6px"><strong>Statuses:</strong> ${(state.option_sets.product_status_options || []).map((value) => escapeHtml(labelMaps.status[value] || value)).join(', ') || '—'}</div>
            <div class="small" style="margin-top:6px">These values are system-governed because checkout, downloads, publishing, and lifecycle logic depend on their meaning.</div>
          </div>
        </div>
        <div class="card" style="margin-top:16px;padding:12px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
            <div>
              <h4 style="margin:0 0 6px 0">Tax codes</h4>
              <div class="small">Create, update, disable, or remove the tax classes used in Product pricing. Inactive classes remain visible for existing Product history.</div>
            </div>
            <button class="btn" type="button" id="catalogTaxClassNewButton">New Tax Code</button>
          </div>
          <div id="catalogTaxClassFormWrap" style="display:none;margin-top:12px"></div>
          <div class="admin-table-wrap" style="margin-top:12px">
            <table>
              <thead><tr><th>Code</th><th>Name</th><th>Rate</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody id="catalogTaxClassList">${renderTaxClassRows()}</tbody>
            </table>
          </div>
        </div>
      </div>`;

    mountEl.querySelectorAll('[data-save-option-set]').forEach((button) => {
      button.addEventListener('click', () => saveOptionSet(button.getAttribute('data-save-option-set') || ''));
    });
    document.getElementById('catalogTaxClassNewButton')?.addEventListener('click', () => openTaxClassForm());
    mountEl.querySelectorAll('[data-edit-tax-class]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.getAttribute('data-edit-tax-class') || 0);
        openTaxClassForm(state.tax_classes.find((row) => Number(row.tax_class_id || 0) === id) || null);
      });
    });
    mountEl.querySelectorAll('[data-delete-tax-class]').forEach((button) => {
      button.addEventListener('click', () => deleteTaxClass(Number(button.getAttribute('data-delete-tax-class') || 0)));
    });
  }

  function openTaxClassForm(row = null) {
    const wrap = document.getElementById('catalogTaxClassFormWrap');
    if (!wrap) return;
    wrap.style.display = 'block';
    wrap.innerHTML = `
      <form id="catalogTaxClassForm" class="grid cols-4" style="gap:12px;align-items:end">
        <input type="hidden" id="catalogTaxClassId" value="${escapeHtml(row?.tax_class_id || '')}" />
        <div><label class="small" for="catalogTaxClassCode">Code</label><input id="catalogTaxClassCode" class="input" type="text" maxlength="32" value="${escapeHtml(row?.code || '')}" /></div>
        <div><label class="small" for="catalogTaxClassName">Name</label><input id="catalogTaxClassName" class="input" type="text" maxlength="120" value="${escapeHtml(row?.name || '')}" /></div>
        <div><label class="small" for="catalogTaxClassRate">Rate %</label><input id="catalogTaxClassRate" class="input" type="number" min="0" max="100" step="0.001" value="${escapeHtml(formatPercent(row?.tax_rate || 0))}" /></div>
        <div><label class="small" for="catalogTaxClassActive">Active</label><select id="catalogTaxClassActive" class="input"><option value="1" ${Number(row?.is_active ?? 1) === 1 ? 'selected' : ''}>Yes</option><option value="0" ${Number(row?.is_active ?? 1) === 0 ? 'selected' : ''}>No</option></select></div>
        <div class="cols-4" style="grid-column:1/-1"><label class="small" for="catalogTaxClassDescription">Description</label><input id="catalogTaxClassDescription" class="input" type="text" value="${escapeHtml(row?.description || '')}" /></div>
        <div style="grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit">Save Tax Code</button><button class="btn" type="button" id="catalogTaxClassCancelButton">Cancel</button></div>
      </form>`;
    document.getElementById('catalogTaxClassCancelButton')?.addEventListener('click', () => {
      wrap.innerHTML = '';
      wrap.style.display = 'none';
    });
    document.getElementById('catalogTaxClassForm')?.addEventListener('submit', saveTaxClass);
  }

  function broadcastUpdate() {
    applyAuthorityToProductEditor();
    document.dispatchEvent(new CustomEvent('dd:catalog-options-updated', {
      detail: {
        authority_version: state.authority_version,
        option_sets: state.option_sets,
        tax_classes: state.tax_classes
      }
    }));
  }

  async function load() {
    if (!window.DDAuth?.isLoggedIn()) return;
    try {
      setMessage('Loading catalog option authority...');
      const data = window.DDAuth.apiJson
        ? await window.DDAuth.apiJson('/api/admin/catalog-option-sets', {}, { cacheTtlMs: 300000, staleTtlMs: 3600000, retries: 2 })
        : await readJsonResponse(await window.DDAuth.apiFetch('/api/admin/catalog-option-sets'), 'Failed to load catalog option authority.');
      applyAuthorityPayload(data);
      render();
      setMessage('');
      broadcastUpdate();
    } catch (error) {
      render();
      applyAuthorityToProductEditor();
      setMessage(error.message || 'Failed to load catalog option authority.', true);
    }
  }

  async function saveOptionSet(optionSet) {
    const map = { categories: 'catalogCategoriesTextarea', colors: 'catalogColorsTextarea', shipping_codes: 'catalogShippingTextarea' };
    const field = document.getElementById(map[optionSet]);
    if (!field) return;
    try {
      setMessage(`Saving ${optionSet.replace('_', ' ')}...`);
      const response = await window.DDAuth.apiFetch('/api/admin/catalog-option-sets', {
        method: 'POST',
        body: JSON.stringify({ action: 'save_option_set', option_set: optionSet, values: splitLines(field.value) })
      });
      const data = await readJsonResponse(response, 'Failed to save option set.');
      applyAuthorityPayload(data);
      window.DDAuth?.clearApiCache?.('/api/admin/catalog-option-sets');
      render();
      setMessage('Dropdown authority saved.');
      broadcastUpdate();
    } catch (error) {
      setMessage(error.message || 'Failed to save option set.', true);
    }
  }

  async function saveTaxClass(event) {
    event.preventDefault();
    try {
      setMessage('Saving tax code...');
      const payload = {
        action: 'save_tax_class',
        tax_class_id: Number(document.getElementById('catalogTaxClassId')?.value || 0),
        code: document.getElementById('catalogTaxClassCode')?.value || '',
        name: document.getElementById('catalogTaxClassName')?.value || '',
        description: document.getElementById('catalogTaxClassDescription')?.value || '',
        tax_rate: taxRateFromPercentInput(document.getElementById('catalogTaxClassRate')?.value || 0),
        is_active: Number(document.getElementById('catalogTaxClassActive')?.value || 1)
      };
      const response = await window.DDAuth.apiFetch('/api/admin/catalog-option-sets', { method: 'POST', body: JSON.stringify(payload) });
      const data = await readJsonResponse(response, 'Failed to save tax code.');
      applyAuthorityPayload(data);
      window.DDAuth?.clearApiCache?.('/api/admin/catalog-option-sets');
      render();
      setMessage('Tax code saved.');
      broadcastUpdate();
    } catch (error) {
      setMessage(error.message || 'Failed to save tax code.', true);
    }
  }

  async function deleteTaxClass(taxClassId) {
    if (!taxClassId) return;
    if (!window.confirm('Remove this tax code? If products already use it, it will be disabled instead of deleted.')) return;
    try {
      setMessage('Removing tax code...');
      const response = await window.DDAuth.apiFetch('/api/admin/catalog-option-sets', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_tax_class', tax_class_id: taxClassId })
      });
      const data = await readJsonResponse(response, 'Failed to remove tax code.');
      applyAuthorityPayload(data);
      window.DDAuth?.clearApiCache?.('/api/admin/catalog-option-sets');
      render();
      setMessage('Tax code removed or disabled.');
      broadcastUpdate();
    } catch (error) {
      setMessage(error.message || 'Failed to remove tax code.', true);
    }
  }

  document.addEventListener('dd:product-editor-target', (event) => applyAuthorityToProductEditor(event?.detail?.product || null));
  document.addEventListener('dd:product-editor-cleared', () => applyAuthorityToProductEditor());
  document.addEventListener('dd:admin-ready', async (event) => { if (!event?.detail?.ok) return; await load(); });
  render();
  applyAuthorityToProductEditor();
  if (window.DDAuth?.isLoggedIn()) load();
});
