// File: /public/js/shop.js
// Brief description: Loads storefront products with Build 264 filtered-arrival layout, advanced search, pricing filters,
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
  const resultsSection = document.getElementById('shopResultsSection');
  const resultsHomeParent = resultsSection?.parentNode || null;
  const resultsHomeNext = resultsSection?.nextSibling || null;
  let focusedArrivalHandled = false;
  const initialFocusProducts = new URLSearchParams(window.location.search).get('focus')==='products';
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
  function applyFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const map = [
      ['origin', 'shopOriginFilter'], ['merchandise_origin', 'shopOriginFilter'],
      ['channel', 'shopChannelFilter'], ['sale_channel', 'shopChannelFilter'],
      ['type', 'shopTypeFilter'], ['product_type', 'shopTypeFilter'],
      ['color', 'shopColorFilter'], ['color_name', 'shopColorFilter'],
      ['q', 'shopSearchInput'], ['material', 'shopMaterialFilter'], ['process', 'shopProcessFilter'], ['locality', 'shopLocalityFilter'], ['ready_for_social', 'shopSocialReadyFilter'], ['missing_proof_image', 'shopProofImageFilter'], ['min_price_cents', 'shopMinPrice'], ['max_price_cents', 'shopMaxPrice']
    ];
    map.forEach(([param, id]) => {
      const value = params.get(param);
      const el = document.getElementById(id);
      if (value != null && el) el.value = value;
    });
    const shipping = params.get('requires_shipping');
    const shipEl = document.getElementById('shopShippingOnly');
    if (shipEl && shipping) shipEl.checked = shipping === '1' || shipping === 'true';
  }

  function writeFiltersToUrl() {
    const params = new URLSearchParams();
    const filters = readFilters();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', next);
  }

  function readFilters() {
    return {
      q: String(document.getElementById('shopSearchInput')?.value || '').trim(),
      product_type: String(document.getElementById('shopTypeFilter')?.value || '').trim(),
      merchandise_origin: String(document.getElementById('shopOriginFilter')?.value || '').trim(),
      sale_channel: String(document.getElementById('shopChannelFilter')?.value || '').trim(),
      color_name: String(document.getElementById('shopColorFilter')?.value || '').trim(),
      material: String(document.getElementById('shopMaterialFilter')?.value || '').trim(),
      process: String(document.getElementById('shopProcessFilter')?.value || '').trim(),
      locality: String(document.getElementById('shopLocalityFilter')?.value || '').trim(),
      min_price_cents: String(document.getElementById('shopMinPrice')?.value || '').trim(),
      max_price_cents: String(document.getElementById('shopMaxPrice')?.value || '').trim(),
      requires_shipping: document.getElementById('shopShippingOnly')?.checked ? '1' : '',
      ready_for_social: String(document.getElementById('shopSocialReadyFilter')?.value || '').trim(),
      missing_proof_image: String(document.getElementById('shopProofImageFilter')?.value || '').trim()
    };
  }
  function hasActiveShopIntent() { return Object.values(readFilters()).some((value)=>String(value||'').trim()!==''); }
  function placeResultsForIntent() {
    if (!resultsSection) return;
    const hero=document.querySelector('.hero.public-service-hero');
    if (hasActiveShopIntent() && hero?.parentNode) {
      hero.insertAdjacentElement('afterend',resultsSection);
      resultsSection.classList.add('shop-filter-arrival');
    } else if (resultsHomeParent) {
      if (resultsHomeNext && resultsHomeNext.parentNode===resultsHomeParent) resultsHomeParent.insertBefore(resultsSection,resultsHomeNext);
      else resultsHomeParent.appendChild(resultsSection);
      resultsSection.classList.remove('shop-filter-arrival');
    }
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
    const originCards = [
      { key: 'handmade', title: 'Handmade collection', copy: 'Finished jewelry, artwork, and workshop-made pieces that come directly from the Devil n Dove bench.' },
      { key: 'vintage', title: 'Vintage & antique finds', copy: 'Older pieces, found items, and aged stock where provenance, wear, and condition notes matter.' },
      { key: 'collectible', title: 'Collectibles & oddities', copy: 'Curious objects, tools, display pieces, and unusual stock that may also link out to marketplace listings.' },
      { key: 'prebuilt', title: 'Pre-built / found items', copy: 'Not workshop-made, but still part of the Devil n Dove catalog when they fit the shop story.' },
    ];
    collectionsEl.innerHTML = `
      <section class="card">
        <h2 style="margin-top:0" data-content-slot="shop.text.collections.heading">Browse by collection direction</h2>
        <p class="small" style="margin-top:0" data-content-slot="shop.text.collections.body">This helps move the shop toward clearer collection-style landing sections for handmade work, vintage stock, collectibles, oddities, and external-listing inventory instead of making every visit start with a blank search.</p>
        <div class="shop-collection-card-grid">
          ${originCards.map((card) => `<div class="shop-collection-card" data-color-slot="shop.collection.${escapeHtml(card.key)}.color"><strong data-content-slot="shop.collection.${escapeHtml(card.key)}.heading">${escapeHtml(card.title)}</strong><p class="small" data-content-slot="shop.collection.${escapeHtml(card.key)}.body">${escapeHtml(card.copy)}</p><button class="btn" type="button" data-origin-collection="${escapeHtml(card.key)}">Browse ${escapeHtml(card.key)}</button></div>`).join('')}
        </div>
        <div class="shop-filter-pill-groups">
          <div><strong>Categories</strong><div class="small" style="margin-top:8px">${categories.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No categories yet.'}</div></div>
          <div><strong>Colours / themes</strong><div class="small" style="margin-top:8px">${colors.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No colour groups yet.'}</div></div>
          <div><strong>Product types</strong><div class="small" style="margin-top:8px">${types.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No product-type groups yet.'}</div></div>
          <div><strong>Origins</strong><div class="small" style="margin-top:8px">${origins.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No origin groups yet.'}</div></div>
          <div><strong>Sale channels</strong><div class="small" style="margin-top:8px">${channels.map((row) => `<span class="pill">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</span>`).join(' ') || 'No channel groups yet.'}</div></div>
        </div>
      </section>`;
    collectionsEl.querySelectorAll('[data-origin-collection]').forEach((button) => {
      button.addEventListener('click', () => {
        const value = String(button.getAttribute('data-origin-collection') || '');
        const originEl = document.getElementById('shopOriginFilter');
        if (originEl) originEl.value = value;
        loadProducts();
      });
    });
  }
  function renderPolicyFaq() {
    if (!policyEl) return;
    policyEl.innerHTML = `
      <section class="card">
        <h2 style="margin-top:0" data-content-slot="shop.text.policy.heading">Shipping, custom order timing, and quick FAQ</h2>
        <div class="customer-welcome-grid">
          <div><strong data-content-slot="shop.text.policy.1.heading">Shipping clarity</strong><p class="small" data-content-slot="shop.text.policy.1.body">Product pages and the cart now keep shipping-required information visible sooner so shoppers know whether an item is shipped from Devil n Dove directly or linked out to an external marketplace listing.</p></div>
          <div><strong data-content-slot="shop.text.policy.2.heading">Custom timing</strong><p class="small" data-content-slot="shop.text.policy.2.body">Custom, personalized, or made-to-order timing should be confirmed before payment. This is especially important for one-off craft work and workshop-led experiments.</p></div>
          <div><strong data-content-slot="shop.text.policy.3.heading">Returns, pickup & support</strong><p class="small" data-content-slot="shop.text.policy.3.body">Questions about delivery, pickup timing, collectible-condition notes, or custom-order fit should route through the contact flow quickly so shoppers do not need to hunt for help after comparing items.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><a class="btn" href="/contact/">Contact</a><a class="btn" href="/marketplaces/">Marketplace guide</a><a class="btn" href="/pickup/">Local pickup</a></div></div><div><strong data-content-slot="shop.text.policy.4.heading">Process, provenance & workshop story</strong><p class="small" data-content-slot="shop.text.policy.4.body">Gallery, About, Creations, Collections, the marketplace guide, and the events page help buyers move from one listing into the wider maker story, local market context, provenance notes for vintage/collectible stock, and future process-video content.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><a class="btn" href="/gallery/">Gallery</a><a class="btn" href="/about/">About</a><a class="btn" href="/creations/">Creations</a><a class="btn" href="/collections/">Collections</a><a class="btn" href="/events/">Events</a></div></div>
        </div>
      </section>`;
  }
  function swatch(color) {
    const map = { red:'#d22', blue:'#2b6cb0', green:'#2f855a', black:'#111', white:'#f8f8f8', silver:'#c0c0c0', gold:'#d4af37', purple:'#805ad5', pink:'#d53f8c', orange:'#dd6b20', yellow:'#d69e2e', brown:'#8b5e3c', grey:'#718096', gray:'#718096' };
    const key = String(color || '').trim().toLowerCase();
    return map[key] || '#cbd5e1';
  }
  function renderSelectFilter(selectId, rows = []) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const current = select.value || '';
    const safeRows = Array.isArray(rows) ? rows : [];
    select.innerHTML = `<option value="">All</option>${safeRows.map((row) => `<option value="${escapeHtml(row.label)}">${escapeHtml(row.label)} (${escapeHtml(String(row.count || 0))})</option>`).join('')}`;
    select.value = current;
  }

  function renderColorFilter(filterGroups = {}) {
    renderSelectFilter('shopColorFilter', filterGroups.colors);
    renderSelectFilter('shopMaterialFilter', filterGroups.materials);
    renderSelectFilter('shopProcessFilter', filterGroups.processes);
    renderSelectFilter('shopLocalityFilter', filterGroups.localities);
  }
  function productImages(product) {
    const output = [];
    const push = (entry) => {
      const imageUrl = String(typeof entry === 'string' ? entry : entry?.image_url || '').trim();
      if (!imageUrl) return;
      if (output.some((row) => row.image_url.toLowerCase() === imageUrl.toLowerCase())) return;
      output.push({
        image_url: imageUrl,
        alt_text: String(typeof entry === 'object' ? entry.alt_text || '' : '').trim() || product.name || 'Product image'
      });
    };
    push(product.featured_image_url || product.og_image_url || '');
    (Array.isArray(product.images) ? product.images : []).forEach(push);
    (Array.isArray(product.image_urls) ? product.image_urls : []).forEach(push);
    return output.slice(0, 6);
  }

  function renderProducts(products) {
    if (!productsEl) return;
    productsEl.innerHTML = products.map(product => {
      const productId = Number(product.product_id);
      const name = escapeHtml(product.name || '');
      const slug = encodeURIComponent(product.slug || '');
      const shortDescription = escapeHtml(product.short_description || product.meta_description || '');
      const longDescription = escapeHtml(product.description || '');
      const storySnippet = escapeHtml(product.public_story_snippet || product.public_story_summary || '');
      const storyHeading = escapeHtml(product.public_story_heading || 'Story behind this piece');
      const productType = escapeHtml(product.product_type || '');
      const price = escapeHtml(formatMoney(product.price_cents, product.currency));
      const images = productImages(product);
      const imageAlt = escapeHtml(product.seo_h1 || product.h1_override || product.meta_title || product.name || 'Product image');
      const keywordBadge = product.keywords ? `<div class="small shop-card-keywords">${escapeHtml(product.keywords.split(',').slice(0,4).join(' • '))}</div>` : '';
      const origin = escapeHtml(product.merchandise_origin || 'handmade');
      const saleChannel = escapeHtml(product.sale_channel || 'onsite');
      const externalUrl = String(product.external_listing_url || '').trim();
      const externalLabel = escapeHtml(product.external_listing_label || 'External listing');
      const colorNames = Array.isArray(product.color_names) ? product.color_names : [];
      const proofBits = [product.proof_material, product.proof_process, product.proof_locality].map((v) => String(v || '').trim()).filter(Boolean).slice(0, 3);
      const proofMarkup = proofBits.length ? `<div class="shop-card-proof small">${proofBits.map((bit) => `<span class="pill">${escapeHtml(bit.split(',')[0])}</span>`).join('')}</div>` : '';
      const trustBadgeMarkup = Number(product.has_public_trust_block || product.trust_block_count || 0) > 0
        ? `<div class="shop-card-trust-badges small"><span class="pill trust-proof-pill">Approved proof</span><span class="pill">${escapeHtml(String(product.trust_block_count || 1))} trust note(s)</span></div>`
        : (Number(product.ready_for_social || 0) === 1 ? `<div class="shop-card-trust-badges small"><span class="pill trust-proof-pill">Social-ready proof</span></div>` : '');
      const originBadge = `<div class="small shop-card-badges"><span class="pill">${origin}</span><span class="pill">${saleChannel}</span>${product.era_label ? `<span class="pill">${escapeHtml(product.era_label)}</span>` : ''}</div>`;
      const swatchMarkup = colorNames.length ? `<div class="small shop-card-swatches">${colorNames.slice(0,5).map((color) => `<span class="pill" title="${escapeHtml(color)}"><span class="shop-swatch" style="background:${swatch(color)}"></span>${escapeHtml(color)}</span>`).join('')}</div>` : '';
      const mainImage = images[0]?.image_url || '';
      const imageMarkup = mainImage
        ? `<div class="shop-card-gallery" data-shop-card-gallery="${productId}"><button class="shop-card-main-image" type="button" data-main-image-button><img src="${escapeHtml(mainImage)}" alt="${imageAlt}" data-main-image /></button>${images.length > 1 ? `<div class="shop-card-thumbs">${images.map((image, index) => `<button class="shop-card-thumb ${index === 0 ? 'is-active' : ''}" type="button" data-shop-thumb="${escapeHtml(image.image_url)}" aria-label="Show image ${index + 1} for ${name}"><img src="${escapeHtml(image.image_url)}" alt="${escapeHtml(image.alt_text || product.name || 'Product image')}" loading="lazy" /></button>`).join('')}</div>` : ''}</div>`
        : `<div class="shop-card-no-image small">No Image</div>`;
      const originLink = `/shop/?merchandise_origin=${encodeURIComponent(product.merchandise_origin || '')}`;
      const ctaMarkup = externalUrl
        ? `<a class="btn" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">${externalLabel}</a>${product.sale_channel === 'hybrid' ? `<button class="btn" type="button" data-add-shop-cart-id="${productId}">Add to Cart</button>` : ''}`
        : `<button class="btn" type="button" data-add-shop-cart-id="${productId}">Add to Cart</button>`;
      return `
        <article class="card shop-product-card">
          ${imageMarkup}
          <div class="shop-card-content">
            ${originBadge}
            <div class="small shop-card-type">${productType}${product.product_category ? ` • ${escapeHtml(product.product_category)}` : ''}</div>
            <h3>${name}</h3>
            <div class="shop-card-price">${price}</div>
            ${keywordBadge}
            ${swatchMarkup}
            ${proofMarkup}
            ${trustBadgeMarkup}
            <p class="small shop-card-description">${shortDescription || longDescription || 'No description available yet.'}</p>
            ${longDescription && longDescription !== shortDescription ? `<details class="shop-card-details"><summary>More details</summary><p class="small">${longDescription}</p></details>` : ''}
            ${storySnippet ? `<div class="shop-card-story small"><strong>${storyHeading}:</strong> ${storySnippet}</div>` : ''}
            <div class="small shop-card-meta">${product.requires_shipping ? 'Shipping / pickup item' : 'Digital or no-shipping item'}${product.condition_summary ? ` • ${escapeHtml(product.condition_summary)}` : ''}${Number(product.inventory_tracking || 0) === 1 ? ` • Stock: ${escapeHtml(String(product.inventory_quantity ?? 0))}` : ''}</div>
            <div class="shop-card-actions">
              <a class="btn" href="/shop/product/?slug=${slug}">View</a>
              <a class="btn" href="${originLink}">More like this</a>
              ${product.requires_shipping ? `<a class="btn" href="/pickup/">Pickup info</a>` : ``}
              ${ctaMarkup}
            </div>
          </div>
        </article>`;
    }).join('');
    productsEl.querySelectorAll('[data-shop-thumb]').forEach((button) => {
      button.addEventListener('click', () => {
        const gallery = button.closest('[data-shop-card-gallery]');
        const main = gallery?.querySelector('[data-main-image]');
        const imageUrl = String(button.getAttribute('data-shop-thumb') || '').trim();
        if (main && imageUrl) main.src = imageUrl;
        gallery?.querySelectorAll('.shop-card-thumb').forEach((thumb) => thumb.classList.remove('is-active'));
        button.classList.add('is-active');
      });
    });
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
          window.DDAnalytics?.trackCart('add_to_cart', { meta: { source: 'shop', product_id: productId } });
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
    renderColorFilter(data?.filter_groups || {});
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
    placeResultsForIntent();
    const url = buildUrl();
    hide(errorEl); hide(emptyEl); hide(productsEl); show(loadingEl); setStatus('');
    try {
      const response = await fetch(url, { method: 'GET' });
      const rawText = await response.text();
      let data = null;
      try { data = JSON.parse(rawText); } catch { throw new Error('Store data returned invalid JSON.'); }
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to load products.');
      renderPayload(data);
      writeFiltersToUrl();
      placeResultsForIntent();
      if(!focusedArrivalHandled && initialFocusProducts){focusedArrivalHandled=true;setTimeout(()=>resultsSection?.scrollIntoView({behavior:'smooth',block:'start'}),30);}
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
  document.querySelectorAll('[data-shop-quick]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = String(button.getAttribute('data-shop-quick') || '');
      const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
      if (key === 'handmade') { set('shopOriginFilter','handmade'); set('shopSearchInput',''); }
      if (key === 'vintage') { set('shopOriginFilter','vintage'); set('shopSearchInput',''); }
      if (key === 'under25') { set('shopMinPrice',''); set('shopMaxPrice','2500'); }
      if (key === 'gifts') { set('shopSearchInput','gift'); }
      loadProducts();
    });
  });
  try { window.DDRecentlyViewed?.render?.(document.getElementById('shopRecentlyViewedMount'), { limit: 4 }); } catch {}
  document.getElementById('shopSearchButton')?.addEventListener('click', loadProducts);
  document.getElementById('shopResetButton')?.addEventListener('click', () => {
    ['shopSearchInput','shopTypeFilter','shopOriginFilter','shopChannelFilter','shopColorFilter','shopMinPrice','shopMaxPrice'].forEach((id) => { const el=document.getElementById(id); if (el) el.value=''; });
    const ship=document.getElementById('shopShippingOnly'); if (ship) ship.checked=false; loadProducts();
  });
  applyFiltersFromUrl();
  await loadProducts();
});
