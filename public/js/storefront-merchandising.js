// Devil n Dove Release 448 — shared public Collections / Collages renderer.
(() => {
  'use strict';
  if (window.DDStorefrontMerchandising) return;

  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const money = (cents, currency = 'CAD') => {
    try { return new Intl.NumberFormat(undefined, { style:'currency', currency:text(currency) || 'CAD' }).format(Number(cents || 0) / 100); }
    catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${text(currency) || 'CAD'}`; }
  };

  async function fetchManifest(options = {}) {
    const url = new URL('/api/storefront-merchandising', location.origin);
    if (options.collection) url.searchParams.set('collection', options.collection);
    if (options.collage) url.searchParams.set('collage', options.collage);
    const response = await fetch(url.pathname + url.search, { headers:{ Accept:'application/json' }, credentials:'same-origin' });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Storefront merchandising unavailable (${response.status}).`);
    return payload;
  }

  function imageGrid(images = []) {
    const list = (Array.isArray(images) ? images : []).filter((row) => text(row?.image_url)).slice(0, 4);
    if (!list.length) return '<div class="storefront-collection-images"><div class="media-managed-placeholder" style="grid-column:1/-1;display:grid;place-items:center">Product images are being prepared.</div></div>';
    return `<div class="storefront-collection-images">${list.map((row) => `<img src="${esc(row.image_url)}" alt="${esc(row.alt_text || 'Collection Product')}" loading="lazy" decoding="async">`).join('')}</div>`;
  }

  function collectionCard(collection) {
    return `<article class="card storefront-collection-card">
      ${imageGrid(collection.images)}
      <div class="storefront-collection-meta"><span class="pill">${esc(String(collection.product_count || 0))} Product${Number(collection.product_count || 0) === 1 ? '' : 's'}</span><span class="pill">${esc(collection.collection_kind || 'curated')}</span></div>
      <h2 style="margin:0">${esc(collection.public_heading || collection.name)}</h2>
      <p class="small" style="margin:0">${esc(collection.public_body || collection.short_description || '')}</p>
      <div><a class="btn" href="${esc(collection.href || `/collections/?collection=${encodeURIComponent(collection.slug || '')}`)}">Browse collection</a></div>
    </article>`;
  }

  function productCard(product) {
    const image = text(product.image_url);
    return `<article class="card storefront-collection-card">
      ${image ? `<a href="${esc(product.href || '/shop/')}"><img src="${esc(image)}" alt="${esc(product.name || 'Product')}" loading="lazy" decoding="async" style="width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:12px;background:rgba(0,0,0,.1)"></a>` : '<div class="media-managed-placeholder" style="aspect-ratio:1/1;display:grid;place-items:center">Product image pending.</div>'}
      <div class="storefront-collection-meta"><span class="pill">${esc(product.merchandise_origin || 'Product')}</span>${product.product_category ? `<span class="pill">${esc(product.product_category)}</span>` : ''}</div>
      <h2 style="margin:0;font-size:1.12rem">${esc(product.name || 'Product')}</h2>
      ${product.short_description ? `<p class="small" style="margin:0">${esc(product.short_description)}</p>` : ''}
      <div><strong>${esc(money(product.price_cents, product.currency))}</strong></div>
      <div><a class="btn" href="${esc(product.href || '/shop/')}">View Product</a></div>
    </article>`;
  }

  function renderCollections(target, collections = [], options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) return false;
    const rows = Array.isArray(collections) ? collections : [];
    if (!rows.length) {
      if (options.keepFallback !== false) return false;
      node.innerHTML = '<p class="small">No published collections are available yet.</p>';
      return true;
    }
    node.innerHTML = `<div class="storefront-collection-grid">${rows.map(collectionCard).join('')}</div>`;
    node.dataset.storefrontMerchandising = 'collections';
    return true;
  }

  function renderCollectionDetail(target, collection, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node || !collection) return false;
    const products = Array.isArray(collection.products) ? collection.products : [];
    if (!products.length && options.keepFallback !== false) return false;
    node.innerHTML = products.length
      ? `<div class="storefront-collection-grid">${products.map(productCard).join('')}</div>`
      : '<p class="small">No public Products are currently assigned to this collection.</p>';
    node.dataset.storefrontMerchandising = 'collection-detail';
    return true;
  }

  function collageClass(kind) {
    return kind === 'feature_grid' ? ' is-feature-grid' : kind === 'story_strip' ? ' is-story-strip' : '';
  }

  function renderCollage(target, collage, options = {}) {
    const node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node || !collage || !Array.isArray(collage.items) || collage.items.length < 3) return false;
    const showHeading = options.showHeading !== false;
    node.innerHTML = `<section class="storefront-collage${collageClass(collage.layout_kind)}" aria-label="${esc(collage.heading || collage.name || 'Product collage')}">
      ${showHeading ? `<div><h2 style="margin:0 0 6px">${esc(collage.heading || collage.name || 'Explore visually')}</h2>${collage.body_text ? `<p class="small" style="margin:0">${esc(collage.body_text)}</p>` : ''}</div>` : ''}
      <div class="storefront-collage-grid">${collage.items.map((item) => `<div class="storefront-collage-item"><a href="${esc(item.href || '/shop/')}" aria-label="View ${esc(item.name || 'Product')}"><img src="${esc(item.image_url)}" alt="${esc(item.alt_text || item.name || 'Product image')}" loading="lazy" decoding="async"><span>${esc(item.name || 'View Product')}</span></a></div>`).join('')}</div>
      ${collage.collection_slug ? `<div><a class="btn" href="/collections/?collection=${encodeURIComponent(collage.collection_slug)}">Browse ${esc(collage.collection_name || 'collection')}</a></div>` : ''}
    </section>`;
    node.dataset.storefrontMerchandising = 'collage';
    return true;
  }

  async function hydratePage() {
    const collectionMount = document.querySelector('[data-storefront-collections-mount]');
    const collageMounts = [...document.querySelectorAll('[data-storefront-collage-mount]')];
    if (!collectionMount && !collageMounts.length) return;
    const requestedCollection = text(new URLSearchParams(location.search).get('collection'));
    try {
      const payload = await fetchManifest({ collection: collectionMount && requestedCollection ? requestedCollection : '' });
      if (collectionMount) {
        const heading = document.querySelector('[data-storefront-collection-result-heading]');
        const intro = document.querySelector('[data-storefront-collection-result-intro]');
        const rows = Array.isArray(payload.collections) ? payload.collections : [];
        if (requestedCollection && rows.length === 1) {
          if (heading) heading.textContent = rows[0].public_heading || rows[0].name || 'Collection';
          if (intro) intro.textContent = rows[0].public_body || rows[0].short_description || '';
          renderCollectionDetail(collectionMount, rows[0], { keepFallback:true });
          document.title = `${rows[0].name || 'Collection'} | Devil n Dove Collections`;
        } else {
          renderCollections(collectionMount, rows, { keepFallback:true });
        }
      }
      for (const mount of collageMounts) {
        const wanted = text(mount.dataset.storefrontCollageMount);
        let collage = (Array.isArray(payload.collages) ? payload.collages : []).find((row) => !wanted || row.slug === wanted);
        if (!collage && wanted) {
          const separate = await fetchManifest({ collage:wanted });
          collage = Array.isArray(separate.collages) ? separate.collages[0] : null;
        }
        if (!renderCollage(mount, collage, { showHeading: mount.dataset.showHeading !== 'false' })) mount.dataset.storefrontMerchandising = 'static-fallback';
      }
      document.documentElement.dataset.storefrontMerchandisingSchema = payload.schema_ready ? 'd1' : 'fallback';
    } catch {
      if (collectionMount) collectionMount.dataset.storefrontMerchandising = 'static-fallback';
      collageMounts.forEach((mount) => { mount.dataset.storefrontMerchandising = 'static-fallback'; });
    }
  }

  window.DDStorefrontMerchandising = Object.freeze({ fetchManifest, renderCollections, renderCollectionDetail, renderCollage });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hydratePage, { once:true });
  else hydratePage();
})();
