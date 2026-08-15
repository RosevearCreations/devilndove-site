// File: /public/js/recently-viewed-products.js
// Brief description: Privacy-friendly, local-browser recently viewed product list. No account or personal data is sent to the server.
(function () {
  const KEY = 'dd_recently_viewed_products_v1';
  const MAX = 8;
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch]));
  const clean = (value) => String(value || '').trim();
  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((row) => row && clean(row.slug)).slice(0, MAX) : [];
    } catch { return []; }
  }
  function write(rows) { try { localStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX))); } catch {} }
  function money(cents, currency) { try { return new Intl.NumberFormat(undefined, { style:'currency', currency:currency || 'CAD' }).format(Number(cents || 0) / 100); } catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${currency || 'CAD'}`; } }
  function add(product) {
    if (!product || !clean(product.slug)) return;
    const entry = {
      product_id: Number(product.product_id || 0) || null,
      slug: clean(product.slug), name: clean(product.name) || 'Product',
      price_cents: Number(product.price_cents || 0), currency: clean(product.currency) || 'CAD',
      image_url: clean(product.featured_image_url || product.image_url),
      alt_text: clean(product.alt_text || product.name) || 'Recently viewed product',
      viewed_at: new Date().toISOString()
    };
    const rows = read().filter((row) => clean(row.slug).toLowerCase() !== entry.slug.toLowerCase());
    rows.unshift(entry); write(rows);
  }
  function render(mount, options = {}) {
    const el = typeof mount === 'string' ? document.querySelector(mount) : mount;
    if (!el) return;
    const exclude = clean(options.excludeSlug).toLowerCase();
    const rows = read().filter((row) => clean(row.slug).toLowerCase() !== exclude).slice(0, Number(options.limit || 4));
    if (!rows.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<section class="card recently-viewed-card" data-color-slot="shop.recent.color" aria-labelledby="recentlyViewedHeading"><div class="section-heading-row"><div><h2 id="recentlyViewedHeading" data-content-slot="shop.recent.heading">Recently viewed</h2><p class="small" data-content-slot="shop.recent.body">Saved only in this browser so we can make it easier to return to pieces we just explored.</p></div><button class="btn secondary" type="button" data-dd-recent-clear>Clear</button></div><div class="recently-viewed-grid">${rows.map((row) => `<a class="recently-viewed-item" href="/shop/product/?slug=${encodeURIComponent(row.slug)}"><div class="recently-viewed-image">${row.image_url ? `<img src="${esc(row.image_url)}" alt="${esc(row.alt_text)}" loading="lazy">` : '<span class="small">Product</span>'}</div><strong>${esc(row.name)}</strong><span class="small">${esc(money(row.price_cents,row.currency))}</span></a>`).join('')}</div></section>`;
    el.querySelector('[data-dd-recent-clear]')?.addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch {} render(el, options); });
  }
  window.DDRecentlyViewed = { add, list: read, render, clear: () => { try { localStorage.removeItem(KEY); } catch {} } };
})();
