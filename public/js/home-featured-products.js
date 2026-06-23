// File: /public/js/home-featured-products.js
// Brief description: Renders a small featured-creations section from active storefront products with a graceful no-product fallback.
document.addEventListener('DOMContentLoaded', async () => {
  const mount = document.getElementById('homeFeaturedProductsMount');
  if (!mount) return;
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch]));
  const money = (cents, currency) => { try { return new Intl.NumberFormat(undefined,{style:'currency',currency:currency || 'CAD'}).format(Number(cents || 0)/100); } catch { return `${(Number(cents || 0)/100).toFixed(2)} ${currency || 'CAD'}`; } };
  const short = (value, max=150) => { const text=String(value||'').trim(); return text.length > max ? `${text.slice(0,max-1).trim()}…` : text; };
  function render(products, warning='') {
    const rows = Array.isArray(products) ? products : [];
    if (!rows.length) {
      mount.innerHTML = `<section class="card featured-creations-card"><div class="section-heading-row"><div><h2>Featured workshop creations</h2><p class="small">New approved products will appear here as they are photographed, described, and made available.</p></div><a class="btn" href="/shop/">Browse the shop</a></div>${warning ? `<p class="small status-note warning">${esc(warning)}</p>` : ''}</section>`;
      return;
    }
    mount.innerHTML = `<section class="card featured-creations-card"><div class="section-heading-row"><div><h2>Featured workshop creations</h2><p class="small">A changing sample of handmade pieces, workshop experiments, and ready-to-shop finds.</p></div><a class="btn" href="/shop/">Browse all creations</a></div><div class="featured-creations-grid">${rows.map((row) => `<article class="featured-creation"><a href="/shop/product/?slug=${encodeURIComponent(row.slug || '')}" class="featured-creation-media">${row.image_url ? `<img src="${esc(row.image_url)}" alt="${esc(row.alt_text || row.name || 'Devil n Dove product')}" loading="lazy">` : `<img src="/assets/visual-placeholders/product-detail.svg" alt="" aria-hidden="true" loading="lazy">`}</a><div class="featured-creation-copy"><span class="small pill">${esc(row.merchandise_origin || 'handmade')}</span><h3><a href="/shop/product/?slug=${encodeURIComponent(row.slug || '')}">${esc(row.name || 'Product')}</a></h3><p class="small">${esc(short(row.story_summary || row.short_description || 'A Devil n Dove workshop listing.'))}</p><div class="featured-creation-meta"><strong>${esc(money(row.price_cents,row.currency))}</strong><span class="small">${row.in_stock ? 'Available / check listing' : 'Follow for availability'}</span></div><a class="btn secondary" href="/shop/product/?slug=${encodeURIComponent(row.slug || '')}">View piece</a></div></article>`).join('')}</div></section>`;
  }
  try {
    const response = await fetch('/api/featured-products?limit=6');
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Featured items are unavailable.');
    render(data.products, data.warning || '');
  } catch (error) { render([], 'Featured creations will load when the storefront connection is available.'); }
});
