// File: /public/js/shop.js
// Brief description: Loads storefront products with advanced search, pricing filters, and improved SEO-friendly summaries.

document.addEventListener("DOMContentLoaded", async () => {
  const loadingEl = document.getElementById("shopLoading");
  const errorEl = document.getElementById("shopError");
  const emptyEl = document.getElementById("shopEmpty");
  const productsEl = document.getElementById("shopProducts");
  const summaryEl = document.getElementById("shopSummary");

  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }
  function escapeHtml(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function formatMoney(cents, currency='CAD') {
    const amount = Number(cents || 0) / 100;
    try { return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(amount); }
    catch { return `${amount.toFixed(2)} ${currency}`; }
  }
  function readFilters() {
    return {
      q: String(document.getElementById('shopSearchInput')?.value || '').trim(),
      product_type: String(document.getElementById('shopTypeFilter')?.value || '').trim(),
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
      const imageAlt = escapeHtml(product.h1_override || product.meta_title || product.name || 'Product image');
      const keywordBadge = product.keywords ? `<div class="small" style="opacity:.8">${escapeHtml(product.keywords.split(',').slice(0,3).join(' • '))}</div>` : '';
      const imageMarkup = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${imageAlt}" style="width:100%;aspect-ratio:1 / 1;object-fit:cover;border-radius:12px;margin-bottom:12px" />`
        : `<div style="width:100%;aspect-ratio:1 / 1;border-radius:12px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd" class="small">No Image</div>`;
      return `
        <article class="card">
          ${imageMarkup}
          <div class="small" style="text-transform:capitalize;opacity:.8">${productType}</div>
          <h3 style="margin:8px 0 6px 0">${name}</h3>
          <div style="font-weight:700;margin-bottom:10px">${price}</div>
          ${keywordBadge}
          <p class="small" style="min-height:48px">${shortDescription || 'No description available yet.'}</p>
          <div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn" href="/shop/product/?slug=${slug}">View</a>
            <button class="btn" type="button" data-add-shop-cart-id="${productId}">Add to Cart</button>
          </div>
        </article>`;
    }).join('');
  }
  async function loadProducts() {
    hide(errorEl); hide(emptyEl); hide(productsEl); show(loadingEl);
    try {
      const response = await fetch(buildUrl(), { method: 'GET' });
      const rawText = await response.text();
      let data = null;
      try { data = JSON.parse(rawText); } catch { throw new Error('Store data returned invalid JSON.'); }
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to load products.');
      const products = Array.isArray(data.products) ? data.products : [];
      if (summaryEl) summaryEl.textContent = `${products.length} product(s) found.`;
      if (!products.length) { show(emptyEl); return; }
      renderProducts(products); show(productsEl);
      productsEl.querySelectorAll('[data-add-shop-cart-id]').forEach(button => {
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
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message || 'Failed to load products.';
      show(errorEl);
    } finally { hide(loadingEl); }
  }
  document.getElementById('shopSearchButton')?.addEventListener('click', loadProducts);
  document.getElementById('shopResetButton')?.addEventListener('click', () => {
    ['shopSearchInput','shopTypeFilter','shopMinPrice','shopMaxPrice'].forEach((id) => { const el=document.getElementById(id); if (el) el.value=''; });
    const ship=document.getElementById('shopShippingOnly'); if (ship) ship.checked=false; loadProducts();
  });
  await loadProducts();
});
