// File: /public/js/admin-product-correction.js
// Visible correction workflow for a loaded product. It shows linked raw inventory,
// lets an admin explicitly release reservations and/or return physically unused raw
// materials before permanently deleting an unused incorrect product.

(() => {
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function money(value) {
    const amount = Number(value || 0) / 100;
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CAD' }).format(amount); }
    catch { return `$${amount.toFixed(2)}`; }
  }

  function toSafeInteger(value, fallback = 0) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : fallback;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createProductForm');
    if (!form || !window.DDAuth) return;

    let currentProduct = null;
    let preview = null;
    let mount = document.getElementById('productCorrectionMount');
    let previewRequestNumber = 0;
    let deleteInFlight = false;

    function ensureMount() {
      if (mount && mount.isConnected) return mount;
      mount = document.createElement('section');
      mount.id = 'productCorrectionMount';
      mount.className = 'card product-correction-card';
      mount.style.marginTop = '16px';
      form.parentNode?.insertBefore(mount, form.nextSibling);
      return mount;
    }

    function selectedProductId() {
      return Number(currentProduct?.product_id || form.dataset.productId || 0);
    }

    function ensureShortcutButton() {
      let button = document.getElementById('productCorrectionJumpButton');
      if (button) return button;
      const submit = form.querySelector('button[type="submit"]');
      if (!submit?.parentNode) return null;
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'productCorrectionJumpButton';
      button.className = 'btn danger';
      button.style.marginLeft = '10px';
      button.style.display = 'none';
      button.textContent = 'Correct / return raw inventory';
      button.addEventListener('click', () => {
        loadPreview();
        window.setTimeout(() => ensureMount().scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      });
      submit.parentNode.appendChild(button);
      return button;
    }

    function renderEmpty() {
      const target = ensureMount();
      target.innerHTML = `
        <h3 style="margin-top:0">Correct or remove a product</h3>
        <p class="small" style="margin:0">Load an existing product into the editor first. This panel then shows the product’s linked raw inventory and gives us a visible, reviewed correction path.</p>
      `;
    }

    function rowMarkup(row, index) {
      const inventoryId = Number(row.site_item_inventory_id || 0);
      const planned = Number(row.quantity_used || 0);
      const reserved = Number(row.reserved_quantity || 0);
      const canRelease = Number(row.can_release_reservation || 0) === 1;
      const canReturn = Number(row.can_return_on_hand || 0) === 1;
      const suggestedRelease = Math.max(0, Number(row.suggested_release_quantity || 0));
      const stockLabel = row.stock_unit_label || 'unit';
      const usageLabel = row.usage_unit_label || 'unit';
      const extra = Number(row.usage_units_per_stock_unit || 1) > 1
        ? `<div class="small">1 ${escapeHtml(stockLabel)} = ${escapeHtml(String(row.usage_units_per_stock_unit))} ${escapeHtml(usageLabel)}. Return physical stock only as whole stock units after checking the real item.</div>`
        : '';
      const blocked = !inventoryId
        ? `<div class="small product-correction-warning">No matching raw-inventory record was found. Leave this line unchanged and review it manually.</div>`
        : '';
      const modeNote = String(row.consumption_mode || 'per_unit') !== 'per_unit'
        ? `<div class="small product-correction-warning">This link is “${escapeHtml(row.consumption_mode || 'story_only')}”. Automatic reservation release is not used for this type; review the real stock count manually.</div>`
        : '';
      return `
        <article class="product-correction-material" data-resource-link-id="${Number(row.product_resource_link_id || 0)}" data-inventory-id="${inventoryId}">
          <div class="product-correction-material-head">
            <div>
              <strong>${escapeHtml(row.item_name || `${row.resource_kind || 'resource'} ${row.source_key || ''}`)}</strong>
              <div class="small">${escapeHtml(row.resource_kind || 'resource')} · planned for product: ${escapeHtml(String(planned))} ${escapeHtml(usageLabel)}</div>
            </div>
            <div class="small">On hand ${escapeHtml(String(row.on_hand_quantity || 0))} · reserved ${escapeHtml(String(reserved))} · ${money(row.unit_cost_cents || 0)} each</div>
          </div>
          ${blocked}${modeNote}${extra}
          <div class="product-correction-fields">
            <label>
              <span class="small">Release reservation</span>
              <input type="number" min="0" max="${Math.max(0, reserved)}" step="1" value="${canRelease ? suggestedRelease : 0}" data-release-quantity />
              <span class="small">Makes already-reserved raw stock available again. It does not change on-hand stock.</span>
            </label>
            <label>
              <span class="small">Return unused physical stock</span>
              <input type="number" min="0" step="1" value="0" ${canReturn ? '' : 'disabled'} data-return-on-hand-quantity />
              <span class="small">Adds whole unused raw stock units back to on-hand. Use only when that material was physically removed and is now truly available again.</span>
            </label>
          </div>
        </article>
      `;
    }

    function renderPreview() {
      const target = ensureMount();
      const product = preview?.product || currentProduct || {};
      const rows = Array.isArray(preview?.materials) ? preview.materials : [];
      const deletionBlocked = Number(preview?.deletion_allowed || 0) !== 1;
      const blocking = Array.isArray(preview?.blocking_references) ? preview.blocking_references : [];
      const blockers = blocking.length
        ? `<div class="product-correction-warning"><strong>Delete unavailable:</strong> this product has saved business/history references: ${blocking.map((item) => `${escapeHtml(String(item.count || 0))} ${escapeHtml(item.table_name || 'records')}`).join(', ')}. Archive it instead.</div>`
        : '';
      target.innerHTML = `
        <div class="product-correction-title-row">
          <div>
            <h3 style="margin:0">Correct or remove: ${escapeHtml(product.name || 'loaded product')}</h3>
            <p class="small" style="margin:6px 0 0">Use this only for an incorrect or unfinished product. We choose each raw-inventory action explicitly; the system never guesses whether material was merely reserved or physically used.</p>
          </div>
          <button class="btn" type="button" id="productCorrectionRefreshButton">Refresh linked materials</button>
        </div>
        ${blockers}
        <div class="product-correction-legend small"><strong>Reservation release:</strong> returns an existing reservation to available raw inventory. <strong>Physical return:</strong> increases on-hand stock only when unused material has actually been put back.</div>
        <div class="product-correction-material-list">${rows.length ? rows.map(rowMarkup).join('') : '<div class="small">No linked tools or supplies were found for this product. We can delete the unused product without an inventory return step.</div>'}</div>
        <label class="product-correction-reason"><span class="small">Correction / deletion reason</span><textarea id="productCorrectionReason" rows="3" maxlength="500" placeholder="Example: entered duplicate product; raw clay and findings were never used.">Incorrect or duplicate product entry</textarea></label>
        <div class="product-correction-actions">
          <button class="btn danger" type="button" id="productCorrectionDeleteButton" ${deletionBlocked ? 'disabled' : ''}>Delete unused product and apply reviewed inventory actions</button>
          <button class="btn" type="button" id="productCorrectionArchiveButton">Archive instead</button>
        </div>
        <div id="productCorrectionMessage" class="small" style="display:none;margin-top:10px"></div>
      `;
      // Click handling is delegated once below. The panel is re-rendered for each product,
      // so direct listeners here used to become stale after the first correction.
    }

    function setMessage(message, isError = false) {
      const node = ensureMount().querySelector('#productCorrectionMessage');
      if (!node) return;
      node.textContent = message || '';
      node.style.display = message ? 'block' : 'none';
      node.style.color = isError ? '#b91c1c' : '#166534';
    }

    async function loadPreview(force = false) {
      const productId = selectedProductId();
      if (!productId) { renderEmpty(); return; }
      const requestNumber = ++previewRequestNumber;
      const target = ensureMount();
      target.innerHTML = `<h3 style="margin-top:0">Correct or remove product</h3><p class="small">Loading linked raw inventory…</p>`;
      try {
        const response = await window.DDAuth.apiFetch(`/api/admin/delete-product?product_id=${encodeURIComponent(productId)}`, { method: 'GET' });
        const data = await response.json().catch(() => null);
        if (requestNumber !== previewRequestNumber || productId !== selectedProductId()) return;
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load product correction details.');
        preview = data;
        renderPreview();
        if (force) setMessage('Linked raw inventory refreshed.');
      } catch (error) {
        if (requestNumber !== previewRequestNumber || productId !== selectedProductId()) return;
        target.innerHTML = `<h3 style="margin-top:0">Correct or remove product</h3><p class="small" style="color:#b91c1c">${escapeHtml(error.message || 'Could not load product correction details.')}</p>`;
      }
    }

    function collectMaterialActions() {
      return Array.from(ensureMount().querySelectorAll('[data-resource-link-id]')).map((node) => ({
        product_resource_link_id: Number(node.getAttribute('data-resource-link-id') || 0),
        site_item_inventory_id: Number(node.getAttribute('data-inventory-id') || 0),
        release_quantity: toSafeInteger(node.querySelector('[data-release-quantity]')?.value, 0),
        return_on_hand_quantity: toSafeInteger(node.querySelector('[data-return-on-hand-quantity]')?.value, 0)
      })).filter((row) => row.product_resource_link_id > 0 && (row.release_quantity > 0 || row.return_on_hand_quantity > 0));
    }

    async function submitCorrectionDelete() {
      const productId = selectedProductId();
      if (!productId || deleteInFlight) return;
      const activePreviewProductId = Number(preview?.product?.product_id || preview?.product_id || productId);
      if (activePreviewProductId !== productId) { setMessage('This correction panel is still loading the selected product. Refresh it, then try again.', true); return; }
      const productName = String((preview?.product || currentProduct || {}).name || 'this product');
      const actions = collectMaterialActions();
      const summary = actions.length
        ? actions.map((item) => `release ${item.release_quantity || 0}, return ${item.return_on_hand_quantity || 0}`).join('; ')
        : 'no inventory changes';
      const proceed = window.confirm(`Delete “${productName}” as an unused/correction product?\n\nReviewed inventory actions: ${summary}\n\nThis cannot be undone automatically. Products with orders or saved history will be blocked and must be archived instead.`);
      if (!proceed) return;
      const phrase = window.prompt('Type DELETE PRODUCT exactly to continue.');
      if (phrase === null) return;
      const reason = String(ensureMount().querySelector('#productCorrectionReason')?.value || '').trim() || 'Incorrect or duplicate product entry';
      const password = window.prompt('Enter your current admin password to confirm this correction and deletion.');
      if (password === null) return;
      const button = ensureMount().querySelector('#productCorrectionDeleteButton');
      const originalText = button?.textContent || '';
      deleteInFlight = true;
      try {
        if (button) { button.disabled = true; button.textContent = 'Applying correction…'; }
        const response = await window.DDAuth.apiFetch('/api/admin/delete-product', {
          method: 'POST',
          body: JSON.stringify({
            product_id: productId,
            confirmation_phrase: phrase,
            deletion_reason: reason,
            confirm_password: password,
            material_review_confirmed: 1,
            material_actions: actions
          })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Product correction/delete failed.');
        const materialSummary = data?.material_summary?.affected_items
          ? ` Raw inventory updated for ${data.material_summary.affected_items} item(s).`
          : '';
        alert(`${data.message || 'Unused product deleted.'}${materialSummary}`);
        document.dispatchEvent(new CustomEvent('dd:product-deleted', { detail: { product: data.product || null, product_id: productId } }));
        currentProduct = null;
        preview = null;
        renderEmpty();
      } catch (error) {
        setMessage(error.message || 'Product correction/delete failed.', true);
      } finally {
        deleteInFlight = false;
        if (button?.isConnected) { button.disabled = false; button.textContent = originalText; }
      }
    }

    ensureMount().addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.id === 'productCorrectionRefreshButton') { loadPreview(true); return; }
      if (button.id === 'productCorrectionDeleteButton') { submitCorrectionDelete(); return; }
      if (button.id === 'productCorrectionArchiveButton') {
        const archiveButton = document.querySelector(`[data-archive-product-id="${selectedProductId()}"]`);
        if (archiveButton) archiveButton.click();
        else setMessage('Archive control was not found. Use status = Archived in the product editor, then save.', true);
      }
    });

    document.addEventListener('dd:product-editor-target', (event) => {
      currentProduct = event?.detail?.product || { product_id: Number(event?.detail?.product_id || 0) };
      preview = null;
      deleteInFlight = false;
      previewRequestNumber += 1;
      const shortcut = ensureShortcutButton();
      if (shortcut) shortcut.style.display = '';
      loadPreview();
    });

    document.addEventListener('dd:product-editor-cleared', () => {
      currentProduct = null;
      preview = null;
      deleteInFlight = false;
      previewRequestNumber += 1;
      const shortcut = document.getElementById('productCorrectionJumpButton');
      if (shortcut) shortcut.style.display = 'none';
      renderEmpty();
    });

    document.addEventListener('click', (event) => {
      const open = event.target.closest('[data-open-product-correction]');
      if (!open) return;
      const productId = Number(open.getAttribute('data-open-product-correction') || 0);
      const edit = document.querySelector(`[data-edit-product-id="${productId}"]`);
      if (edit) edit.click();
      window.setTimeout(() => {
        ensureMount().scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    });

    ensureShortcutButton();
    renderEmpty();
  });
})();
