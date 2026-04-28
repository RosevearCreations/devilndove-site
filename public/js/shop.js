// File: /public/js/shop.js
// Brief description: Loads storefront products with advanced search, pricing filters,
// collection landing cards, and client-side snapshot fallback so the shop stays usable when the live endpoint drifts.

document.addEventListener("DOMContentLoaded", async () => {
  const loadingEl = document.getElementById("shopLoading");
  const errorEl = document.getElementById("shopError");
  const emptyEl = document.getElementById("shopEmpty");
  const productsEl = document.getElementById("shopProducts");
  const summaryEl = document.getElementById("shopSummary");
  const statusEl = document.getElementById("shopStatus");
  const collectionsEl = document.getElementById('shopCollectionsMount');
  const policyEl = document.getElementById('shopPolicyFaqMount');
  const SNAPSHOT_KEY = 'dd_shop_snapshot_v3';

  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }
  function escapeHtml(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;').replaceAll("'",'&#039;'); }
  function formatMoney(cents, currency='CAD') {
    const amount = Number(cents || 0) / 100;
    try { return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(amount); }
    catch { return `${amount.toFixed(2)} ${currency}`; }
  }
  function setStatus(message, tone = 'info') {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.style.display = message ? '' : 'none';
    statusEl.className = message ? `status-note ${tone}` : 'status-note';
  }
  function saveSnapshot(key, payload) {
    try {
      const current = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '{}');
      current[key] = { ...payload, cached_at: new Date().toISOString() };
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(current));
    } catch {}
  }
  function loadSnapshot(key) {
    try { return (JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '{}') || {})[key] || null; }
    catch { return null; }
  }
  function readFilters() {
    return {
      q: String(document.getElementById('shopSearchInput')?.value || '').trim(),
      product_type: String(document.getElementById('shopTypeFilter')?.value || '').trim(),
      merchandise_origin: String(document.getElementById('shopOriginFilter')?.value || '').trim(),
      sale_channel: String(document.getElementById('shopChannelFilter')?.value || '').trim(),
      min_price_cents: String(document.getElementById('shopMinPrice')?.value || '').trim(),
      max_price_cents: String(document.getElementById('shopMaxPrice')?.value || '').trim(),
      requires_shipping: document.getElementById('shopShippingOnly')?.checked ? '1' : ''
    };
  }
  function buildUrl() {
    const filters = readFilters();
    const url = new URL('/api/products', window.location.origin);
    Object.entries(filters).forEach(([key, value]) => { if (value !== '') url.searchParams.set(key, value); });
    return url.pathname + url.search;
  }
  function renderCollectionLanding(filterGroups = {}) {
    if (!collectionsEl) return;
    const categories = Array.isArray(filterGroups.categories) ? filterGroups.categories.slice(0, 6) : [];
    const colors = Array.isArray(filterGroups.colors) ? filterGroups.colors.slice(0, 6) : [];
    const types = Array.isArray(filterGroups.product_types) ? filterGroups.product_types.slice(0, 3) : [];
    const origins = Array.isArray(filterGroups.merchandise_origins) ? filterGroups.merchandise_origins.slice(0, 6) : [];
    const channels = Array.isArray(filterGroups.sale_channels) ? filterGroups.sale_channels.slice(0, 3) : [];
    if (!categories.length && !colors.length && !types.length && !origins.length && !channels.length) {
      collectionsEl.innerHTML = '';
      return;
    }
    collectionsEl.innerHTML = `
      <section class="card">
        <h2 style="margin-top:0">Browse by collection direction</h2>
        <p class="small" style="margin-top:0">This helps move the shop toward better collection-style landing sections by material, style, theme, colour, and item type instead of making every visit start with a blank search.</p>
        <div class="customer-welcome-grid" style="margin-top:12px">
          <div><strong>Categories</strong><div class="small" style="margin-top:8px">${categories.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No categories yet.'}</div></div>
          <div><strong>Colours / themes</strong><div class="small" style="margin-top:8px">${colors.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No colour groups yet.'}</div></div>
          <div><strong>Product types</strong><div class="small" style="margin-top:8px">${types.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No product-type groups yet.'}</div></div>
          <div><strong>Origins</strong><div class="small" style="margin-top:8px">${origins.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No origin groups yet.'}</div></div>
          <div><strong>Sale channels</strong><div class="small" style="margin-top:8px">${channels.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No channel groups yet.'}</div></div>
        </div>
      </section>`;
  }
  function renderPolicyFaq() {
    if (!policyEl) return;
    policyEl.innerHTML = `
      <section class="card">
        <h2 style="margin-top:0">Shipping, custom order timing, and quick FAQ</h2>
        <div class="customer-welcome-grid">
          <div><strong>Shipping clarity</strong><p class="small">Product pages and the cart now keep shipping-required information visible sooner so shoppers know whether an item is shipped from Devil n Dove directly or linked out to an external marketplace listing.</p></div>
          <div><strong>Custom timing</strong><p class="small">Custom, personalized, or made-to-order timing should be confirmed before payment. This is especially important for one-off craft work and workshop-led experiments.</p></div>
          <div><strong>Returns & support</strong><p class="small">Questions, delivery issues, collectible-condition questions, or custom-order fit concerns should route through the contact flow quickly so shoppers do not need to hunt for help after comparing items.</p></div><div><strong>Process, provenance & workshop story</strong><p class="small">Gallery, About, and Creations pages help buyers move from a single listing into the broader maker story, workshop context, provenance notes for vintage/collectible stock, and future process-video content.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><a class="btn" href="/gallery/">Gallery</a><a class="btn" href="/about/">About</a><a class="btn" href="/creations/">Creations</a></div></div>
        </div>
      </section>`;
  }
  function renderProducts(products) {
    if (!productsEl) return;
    productsEl.innerHTML = products.map(product => {
      const productId = Number(product.product_id);
      const name = escapeHtml(product.name || '');
      const slug = encodeURIComponent(product.slug || '');
      const shortDescription = escapeHtml(product.short_description || product.meta_description || '');
      const productType = escapeHtml(product.product_type || '');
      const price = escapeHtml(formatMoney(product.price_cents, product.currency));
      const imageUrl = String(product.featured_image_url || product.og_image_url || '').trim();
      const imageAlt = escapeHtml(product.seo_h1 || product.h1_override || product.meta_title || product.name || 'Product image');
      const keywordBadge = product.keywords ? `<div class="small" style="opacity:.8">${escapeHtml(product.keywords.split(',').slice(0,3).join(' • '))}</div>` : '';
      const origin = escapeHtml(product.merchandise_origin || 'handmade');
      const saleChannel = escapeHtml(product.sale_channel || 'onsite');
      const externalUrl = String(product.external_listing_url || '').trim();
      const externalLabel = escapeHtml(product.external_listing_label || 'External listing');
      const originBadge = `<div class="small" style="margin-bottom:6px;display:flex;gap:6px;flex-wrap:wrap"><span class="pill">${origin}</span><span class="pill">${saleChannel}</span>${product.era_label ? `<span class="pill">${escapeHtml(product.era_label)}</span>` : ''}</div>`;
      const imageMarkup = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${imageAlt}" style="width:100%;aspect-ratio:1 / 1;object-fit:cover;border-radius:12px;margin-bottom:12px" />`
        : `<div style="width:100%;aspect-ratio:1 / 1;border-radius:12px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd" class="small">No Image</div>`;
      const ctaMarkup = externalUrl
        ? `<a class="btn" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">${externalLabel}</a>${product.sale_channel === 'hybrid' ? `<button class="btn" type="button" data-add-shop-cart-id="${productId}">Add to Cart</button>` : ''}`
        : `<button class="btn" type="button" data-add-shop-cart-id="${productId}">Add to Cart</button>`;
      return `
        <article class="card">
          ${imageMarkup}
          ${originBadge}
          <div class="small" style="text-transform:capitalize;opacity:.8">${productType}</div>
          <h3 style="margin:8px 0 6px 0">${name}</h3>
          <div style="font-weight:700;margin-bottom:10px">${price}</div>
          ${keywordBadge}
          <p class="small" style="min-height:48px">${shortDescription || 'No description available yet.'}</p>
          <div class="small" style="margin-top:8px">${product.requires_shipping ? 'Shipping / pickup item' : 'Digital or no-shipping item'}${product.product_category ? ` • ${escapeHtml(product.product_category)}` : ''}${product.condition_summary ? ` • ${escapeHtml(product.condition_summary)}` : ''}</div>
          <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn" href="/shop/product/?slug=${slug}">View</a>
            ${ctaMarkup}
          </div>
        </article>`;
    }).join('');
  }
  function bindCartButtons(products) {
    productsEl?.querySelectorAll('[data-add-shop-cart-id]').forEach(button => {
      button.addEventListener('click', () => {
        if (!window.DDCart) return alert('Cart is not available right now.');
        const productId = Number(button.getAttribute('data-add-shop-cart-id'));
        const product = products.find(item => Number(item.product_id) === productId);
        if (!product) return alert('Product could not be added.');
        try {
          window.DDCart.addToCart(product, 1);
          window.DDAnalytics?.trackCart('cart_updated', { meta: { source: 'shop', product_id: productId } });
          alert('Added to cart.');
        } catch (error) { alert(error.message || 'Failed to add item to cart.'); }
      });
    });
  }
  function renderPayload(data, { fromCache = false } = {}) {
    const products = Array.isArray(data?.products) ? data.products : [];
    const categoryCount = Array.isArray(data?.filter_groups?.categories) ? data.filter_groups.categories.length : 0;
    const colorCount = Array.isArray(data?.filter_groups?.colors) ? data.filter_groups.colors.length : 0;
    if (summaryEl) summaryEl.textContent = `${products.length} product(s) found.${categoryCount || colorCount ? ` ${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'} and ${colorCount} colour option${colorCount === 1 ? '' : 's'} in this result set.` : ''}`;
    renderCollectionLanding(data?.filter_groups || {});
    renderPolicyFaq();
    if (!products.length) {
      hide(productsEl);
      show(emptyEl);
    } else {
      hide(emptyEl);
      renderProducts(products);
      show(productsEl);
      bindCartButtons(products);
    }
    if (data?.warning) setStatus(data.warning, fromCache ? 'warning' : 'info');
    else if (!fromCache) setStatus('');
    return products;
  }
  async function loadProducts() {
    const url = buildUrl();
    hide(errorEl); hide(emptyEl); hide(productsEl); show(loadingEl); setStatus('');
    try {
      const response = await fetch(url, { method: 'GET' });
      const rawText = await response.text();
      let data = null;
      try { data = JSON.parse(rawText); } catch { throw new Error('Store data returned invalid JSON.'); }
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to load products.');
      renderPayload(data);
      saveSnapshot(url, { data });
    } catch (error) {
      const cached = loadSnapshot(url);
      if (cached?.data) {
        renderPayload(cached.data, { fromCache: true });
        setStatus(`Live shop data is unavailable. Showing the last saved snapshot from ${cached.cached_at || 'an earlier visit'}.`, 'warning');
      } else {
        if (errorEl) errorEl.textContent = error.message || 'Failed to load products.';
        show(errorEl);
      }
    } finally { hide(loadingEl); }
  }
  document.getElementById('shopSearchButton')?.addEventListener('click', loadProducts);
  document.getElementById('shopResetButton')?.addEventListener('click', () => {
    ['shopSearchInput','shopTypeFilter','shopOriginFilter','shopChannelFilter','shopMinPrice','shopMaxPrice'].forEach((id) => { const el=document.getElementById(id); if (el) el.value=''; });
    const ship=document.getElementById('shopShippingOnly'); if (ship) ship.checked=false; loadProducts();
  });
  await loadProducts();
});
