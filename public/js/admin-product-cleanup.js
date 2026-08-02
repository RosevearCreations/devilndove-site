// Build 221 — visible draft/archive cleanup centre.
(() => {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  let products = [];

  function node(id) { return document.getElementById(id); }
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
  async function load() {
    try {
      message('Loading draft and archive cleanup candidates…');
      const response = await window.DDAuth.apiFetch('/api/admin/products');
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Products could not load.');
      products = Array.isArray(data.products) ? data.products : [];
      render();
      message(`${candidateRows().length} cleanup candidate${candidateRows().length === 1 ? '' : 's'} shown.`, 'success');
    } catch (error) {
      message(error.message || 'Cleanup candidates could not load.', 'error');
      const cached = localStorage.getItem('dd_admin_products_cache_v3');
      try {
        const parsed = JSON.parse(cached || '{}');
        products = Array.isArray(parsed.products) ? parsed.products : [];
        if (products.length) {
          render();
          message('Live data is unavailable. Showing the last saved product snapshot; permanent removal remains disabled until live preflight succeeds.', 'error');
        }
      } catch {}
    }
  }
  async function preflight(productId) {
    const result = document.querySelector(`[data-cleanup-result="${productId}"]`);
    const deleteButton = document.querySelector(`[data-cleanup-delete="${productId}"]`);
    if (deleteButton) deleteButton.disabled = true;
    if (result) result.innerHTML = '<span class="small">Checking references…</span>';
    const response = await window.DDAuth.apiFetch(`/api/admin/delete-product?product_id=${encodeURIComponent(productId)}`);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Removal preflight failed.');
    const blockers = Array.isArray(data.blocking_references) ? data.blocking_references : [];
    const safeRows = Array.isArray(data.references) ? data.references.filter((row) => Number(row.automatically_safe || 0) === 1) : [];
    const materials = Array.isArray(data.materials) ? data.materials : [];
    const materialReviewRows = Array.isArray(data.materials_requiring_review) ? data.materials_requiring_review : [];
    const historyAllowsRemoval = Number(data.deletion_allowed || 0) === 1;
    const allowed = historyAllowsRemoval && materialReviewRows.length === 0;
    if (result) {
      if (!historyAllowsRemoval) {
        result.innerHTML = `<span class="status-pill is-error">Archive only</span><p class="small">Protected history: ${blockers.map((row) => `${Number(row.count || 0)} ${esc(row.table_name || 'record')}`).join(', ') || 'one or more business records'}.</p>`;
      } else if (materialReviewRows.length) {
        result.innerHTML = `<span class="status-pill is-warning">Inventory review required</span><p class="small">${materialReviewRows.length} linked material row(s) may involve reserved stock. Review the quantities before removal.</p><button class="btn" type="button" data-open-product-correction="${productId}">Review linked materials &amp; remove</button>`;
      } else {
        const recipeNote = materials.length
          ? ` ${materials.length} linked recipe/material row(s) will be discarded with the duplicate; main inventory quantities will not change.`
          : '';
        result.innerHTML = `<span class="status-pill is-success">Removal allowed</span><p class="small">${safeRows.length} product-owned, detachable or automatic reference group(s) can be cleaned safely.${recipeNote}</p>`;
      }
    }
    if (deleteButton) deleteButton.disabled = !allowed;
    return { data, allowed, materialReviewRows };
  }
  async function remove(productId) {
    const product = products.find((row) => Number(row.product_id) === Number(productId));
    const checked = await preflight(productId);
    if (!checked.allowed) throw new Error((checked.materialReviewRows || []).length ? 'Reserved linked materials require the full Correct / remove panel so inventory actions can be reviewed.' : 'This record has protected history and must remain archived.');
    if (!confirm(`Permanently remove ${label(product || {})}?\n\nThis removes only the unused record. Product numbers remain retired.`)) return;
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
        deletion_reason: String(product?.status || '').toLowerCase() === 'archived'
          ? 'Unused archived duplicate removed from cleanup centre.'
          : 'Duplicate draft removed from cleanup centre.'
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Product could not be removed.');
    message(data.message || 'Product removed.', 'success');
    document.dispatchEvent(new CustomEvent('dd:product-deleted', { detail: { product_id: Number(productId), product: data.product || null } }));
    await load();
  }
  async function archive(productId) {
    if (!confirm('Archive this draft? It will remain available in the Archived cleanup list.')) return;
    const response = await window.DDAuth.apiFetch('/api/admin/archive-product', { method: 'POST', body: JSON.stringify({ product_id: Number(productId) }) });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Product could not be archived.');
    message(data.message || 'Product archived.', 'success');
    document.dispatchEvent(new CustomEvent('dd:product-archived', { detail: { product_id: Number(productId), product: data.product || null } }));
    await load();
  }
  function bind() {
    node('refreshProductCleanup')?.addEventListener('click', load);
    node('productCleanupSearch')?.addEventListener('input', render);
    node('productCleanupStatus')?.addEventListener('change', render);
    node('productCleanupList')?.addEventListener('click', async (event) => {
      const check = event.target.closest('[data-cleanup-preflight]');
      const removeButton = event.target.closest('[data-cleanup-delete]');
      const archiveButton = event.target.closest('[data-cleanup-archive]');
      try {
        if (check) await preflight(Number(check.dataset.cleanupPreflight || 0));
        if (removeButton) await remove(Number(removeButton.dataset.cleanupDelete || 0));
        if (archiveButton) await archive(Number(archiveButton.dataset.cleanupArchive || 0));
      } catch (error) { message(error.message || 'Cleanup action failed.', 'error'); }
    });
    document.addEventListener('dd:product-created', load);
    document.addEventListener('dd:product-updated', load);
  }
  document.addEventListener('DOMContentLoaded', () => { bind(); load(); });
})();
