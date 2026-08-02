// Build 206: shared product context for the focused catalog-media workspace.
// It turns product_id in the URL into a human-readable working reference and
// keeps the image, annotation, score, story and SEO panels pointed at one product.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('productMediaContextMount');
  if (!mount || !window.DDAuth) return;

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;' }[ch]));
  const num = (value) => { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; };
  const text = (value) => String(value || '').trim();
  const query = new URLSearchParams(window.location.search);
  let productId = num(query.get('product_id'));
  let products = [];
  let current = null;
  let lastError = '';

  function formatRate(product) {
    const raw = Number(product?.rate_percent ?? product?.tax_rate ?? 0);
    const percent = raw > 1 ? raw : Number((raw * 100).toFixed(3));
    return Number.isFinite(percent) ? `${percent}%` : '—';
  }

  function productLabel(product) {
    const id = num(product?.product_id);
    return `#${id} — ${text(product?.name) || `Product ${id}`}`;
  }

  function publicPreviewUrl(product) {
    const slug = text(product?.slug);
    return slug ? `/shop/product/?slug=${encodeURIComponent(slug)}` : '/shop/';
  }

  async function api(url) {
    const response = await window.DDAuth.apiFetch(url, { method: 'GET' });
    if (window.DDAuth?.readApiJson) return window.DDAuth.readApiJson(response, { fallbackMessage: 'Product workspace request failed.' });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Product workspace request failed.');
    return data;
  }

  function matches(value) {
    const needle = text(value).toLowerCase();
    if (!needle) return products.slice(0, 12);
    return products.filter((product) => [product.product_id, product.product_number, product.name, product.slug, product.sku]
      .some((entry) => String(entry || '').toLowerCase().includes(needle))).slice(0, 12);
  }

  function updateUrl(id) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('product_id', String(id));
    else url.searchParams.delete('product_id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash || '#product-media-workflow'}`);
  }

  function synchronizeOtherPanels(detail) {
    const id = num(detail?.product?.product_id || productId);
    ['productImagesProductId', 'annotationProductId', 'productStoryProductSelect', 'seoProductId'].forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) field.value = String(id || '');
    });
    window.DDProductMediaContext = {
      getProductId: () => id,
      getProduct: () => detail?.product || current?.product || null
    };
    document.dispatchEvent(new CustomEvent('dd:product-media-context-changed', { detail: { product_id: id, product: detail?.product || null, images: detail?.images || [] } }));
    document.dispatchEvent(new CustomEvent('dd:product-editor-target', { detail: { product_id: id, product: detail?.product || null } }));
  }

  function render() {
    const selected = current?.product || null;
    const thumbnail = text(selected?.featured_image_url);
    const imageText = thumbnail ? '' : '<span class="product-media-context-placeholder-copy">No public media resolved</span>';
    const displayName = selected ? productLabel(selected) : 'Choose a product';
    const source = text(selected?.featured_image_source_label);
    const workflow = selected ? `${text(selected.status || 'draft').replace(/_/g, ' ')} · ${text(selected.review_status || 'pending_review').replace(/_/g, ' ')}` : '';
    mount.innerHTML = `
      <section class="product-media-context-card" id="product-media-workflow" aria-label="Current product media reference">
        <div class="product-media-context-head">
          <div>
            <p class="eyebrow">Working product reference</p>
            <h2>${esc(displayName)}</h2>
            <p class="small">Search by Product ID, name, SKU, or slug. Every workspace below follows this selection.</p>
          </div>
          ${selected ? `<div class="product-media-context-actions"><a class="btn" href="/admin/catalog/?product_id=${num(selected.product_id)}">Open product editor</a><a class="btn secondary" href="/admin/release-preflight/?product_id=${num(selected.product_id)}">Release preflight</a><a class="btn secondary" href="/admin/creative-assets/?product_id=${num(selected.product_id)}">Open CAIP</a><a class="btn secondary" href="${esc(publicPreviewUrl(selected))}" target="_blank" rel="noopener">Preview storefront</a>${selected.featured_image_needs_sync ? `<button class="btn secondary" type="button" data-sync-featured-image="${num(selected.product_id)}">Sync resolved featured image</button>` : ''}</div>` : ''}
        </div>
        <div class="product-media-context-search-row">
          <label><span class="small">Find product</span><input class="input" id="productMediaContextSearch" type="search" placeholder="Example: 34, pendant, DND-034" value="${esc(document.getElementById('productMediaContextSearch')?.value || '')}" autocomplete="off"/></label>
          <button class="btn" type="button" id="productMediaContextClear">Clear selection</button>
          <div class="small" id="productMediaContextStatus" aria-live="polite">${esc(lastError || (selected ? `Loaded product ID ${num(selected.product_id)}.` : 'No product selected.'))}</div>
        </div>
        <div class="product-media-context-result-list" id="productMediaContextResults">
          ${matches(document.getElementById('productMediaContextSearch')?.value || '').map((product) => `<button class="product-media-context-result" type="button" data-media-context-product="${num(product.product_id)}"><strong>${esc(productLabel(product))}</strong><span>${esc([product.status, product.review_status, product.sku].filter(Boolean).join(' · ').replace(/_/g, ' '))}</span></button>`).join('') || '<span class="small">No matching products found.</span>'}
        </div>
        ${selected ? `<div class="product-media-context-active">
          <div class="product-media-context-thumbnail">${thumbnail ? `<img src="${esc(thumbnail)}" alt="Featured media for ${esc(selected.name || 'this product')}" data-product-context-image/>` : imageText}</div>
          <div class="product-media-context-details">
            <div class="product-media-context-chip-row"><span class="status-note small">Product ID ${num(selected.product_id)}</span><span class="status-note small">${esc(workflow)}</span>${selected.taxable == 0 ? '<span class="status-note small">Non-taxable</span>' : `<span class="status-note small">${esc(selected.tax_class_name || selected.tax_class_code || 'Tax class not assigned')} · ${esc(formatRate(selected))}</span>`}</div>
            <p><strong>${esc(selected.name || '')}</strong>${selected.sku ? ` · SKU ${esc(selected.sku)}` : ''}${selected.slug ? ` · /${esc(selected.slug)}` : ''}</p>
            <p class="small">Featured image source: ${esc(source || 'No image source')}. ${selected.featured_image_needs_sync ? 'This resolved media URL is not yet stored on the product record. Use the explicit sync button only after checking the selected source.' : ''}</p>
            <p class="small">Media library assets: ${num(selected.media_asset_count)} · product-gallery rows: ${num(selected.product_image_count)}. This reference card does not publish or alter media.</p>
          </div>
        </div>` : ''}
      </section>`;

    mount.querySelector('#productMediaContextSearch')?.addEventListener('input', render);
    mount.querySelector('#productMediaContextClear')?.addEventListener('click', () => {
      productId = 0; current = null; lastError = 'Selection cleared.'; updateUrl(0); render(); synchronizeOtherPanels({ product: null, images: [] });
    });
    mount.querySelectorAll('[data-media-context-product]').forEach((button) => button.addEventListener('click', () => loadProduct(num(button.dataset.mediaContextProduct))));
    mount.querySelector('[data-product-context-image]')?.addEventListener('error', (event) => {
      const host = event.currentTarget.parentElement;
      if (host) host.innerHTML = '<span class="product-media-context-placeholder-copy">Featured URL could not be loaded</span>';
    });
    mount.querySelector('[data-sync-featured-image]')?.addEventListener('click', () => syncResolvedFeaturedImage());
  }

  async function syncResolvedFeaturedImage() {
    const selected = current?.product;
    const id = num(selected?.product_id || productId);
    if (!id || !selected?.featured_image_needs_sync) return;
    const url = text(selected.featured_image_url);
    if (!url) { lastError = 'No resolved media URL is available to sync.'; render(); return; }
    if (!window.confirm('Store the currently resolved featured image URL on this product? This does not modify source media, gallery order, image roles, consent records, or publication status.')) return;
    lastError = 'Syncing the resolved featured image URL…'; render();
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/product-featured-image-sync', {
        method: 'POST', body: JSON.stringify({ product_id: id, candidate_url: url })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not sync the featured image URL.');
      current = await api(`/api/admin/product-detail?product_id=${encodeURIComponent(id)}`);
      lastError = data.message || 'Featured image URL synced.';
      synchronizeOtherPanels(current);
    } catch (error) {
      lastError = error?.message || 'Could not sync the featured image URL.';
    }
    render();
  }

  async function loadProduct(id) {
    productId = num(id);
    if (!productId) { current = null; render(); return; }
    lastError = 'Loading product reference…'; render();
    try {
      current = await api(`/api/admin/product-detail?product_id=${encodeURIComponent(productId)}`);
      lastError = `Loaded product ID ${productId}.`;
      updateUrl(productId);
      synchronizeOtherPanels(current);
    } catch (error) {
      current = null;
      lastError = error?.message || 'Could not load this product reference.';
    }
    render();
  }

  async function boot() {
    if (!window.DDAuth?.isLoggedIn()) return;
    try {
      const data = await api('/api/admin/products');
      products = Array.isArray(data.products) ? data.products : [];
      if (productId) await loadProduct(productId);
      else render();
    } catch (error) {
      lastError = error?.message || 'Could not load product choices.';
      render();
    }
  }

  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) boot(); });
  if (window.DDAuth?.isLoggedIn()) boot(); else render();
});
