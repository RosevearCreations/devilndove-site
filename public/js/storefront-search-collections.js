// Release 467 Build 75 — Storefront Search & Collections.
// Buyer discovery is derived from the already-loaded /api/products payload. This layer
// adds no Product API request, provider call, polling loop, D1 mutation, or publication action.

(() => {
  'use strict';

  const BUILD = 75;
  const CONTRACT = 'storefront-search-collections';
  const LOCAL_PARAM_KEYS = Object.freeze(['category', 'availability', 'sort']);

  const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const lower = (value) => text(value).toLowerCase();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  function availabilityOfProduct(product = {}) {
    const productType = lower(product.product_type);
    if (productType === 'digital') {
      return { status: 'available', reason: 'digital', label: 'Available now' };
    }
    if (Number(product.inventory_tracking || 0) === 1) {
      const quantity = Math.max(0, number(product.inventory_quantity, 0));
      return quantity > 0
        ? { status: 'available', reason: 'tracked_positive', label: 'Available now' }
        : { status: 'out_of_stock', reason: 'tracked_zero', label: 'Out of stock' };
    }
    return { status: 'check', reason: 'untracked', label: 'Check availability' };
  }

  function compareFeatured(a, b) {
    const sortDelta = number(a?.sort_order, 0) - number(b?.sort_order, 0);
    if (sortDelta) return sortDelta;
    const createdDelta = text(b?.created_at).localeCompare(text(a?.created_at));
    if (createdDelta) return createdDelta;
    return number(b?.product_id, 0) - number(a?.product_id, 0);
  }

  function filterAndSortProducts(products, filters = {}) {
    const category = lower(filters.category);
    const availability = lower(filters.availability);
    const sort = lower(filters.sort) || 'featured';
    const rows = (Array.isArray(products) ? products : []).filter((product) => {
      if (category && lower(product.product_category || product.category) !== category) return false;
      if (availability && availabilityOfProduct(product).status !== availability) return false;
      return true;
    });

    if (sort === 'price_asc') return rows.sort((a, b) => number(a.price_cents) - number(b.price_cents) || compareFeatured(a, b));
    if (sort === 'price_desc') return rows.sort((a, b) => number(b.price_cents) - number(a.price_cents) || compareFeatured(a, b));
    if (sort === 'newest') return rows.sort((a, b) => text(b.created_at).localeCompare(text(a.created_at)) || compareFeatured(a, b));
    if (sort === 'name') return rows.sort((a, b) => text(a.name).localeCompare(text(b.name), undefined, { sensitivity: 'base' }) || compareFeatured(a, b));
    return rows.sort(compareFeatured);
  }

  function buildMerchandisingSummary(products) {
    const rows = Array.isArray(products) ? products : [];
    const categories = new Set();
    const colors = new Set();
    let available = 0;
    let outOfStock = 0;
    let check = 0;
    let under50 = 0;
    let handmade = 0;
    let photoReady = 0;
    for (const product of rows) {
      const category = lower(product.product_category || product.category);
      if (category) categories.add(category);
      const colorValues = Array.isArray(product.color_names) ? product.color_names : [product.color_name];
      colorValues.map(lower).filter(Boolean).forEach((color) => colors.add(color));
      const availability = availabilityOfProduct(product).status;
      if (availability === 'available') available += 1;
      else if (availability === 'out_of_stock') outOfStock += 1;
      else check += 1;
      if (number(product.price_cents, 0) > 0 && number(product.price_cents, 0) <= 5000) under50 += 1;
      if (lower(product.merchandise_origin) === 'handmade') handmade += 1;
      if (text(product.featured_image_url) || number(product.image_count, 0) > 0) photoReady += 1;
    }
    return {
      total: rows.length,
      categories: categories.size,
      colors: colors.size,
      available,
      out_of_stock: outOfStock,
      check,
      under_50: under50,
      handmade,
      photo_ready: photoReady,
      automatic_merchandising_action: false,
      additional_product_request: false,
    };
  }

  function buildRelaxationPlan(filters = {}) {
    const plan = [];
    if (text(filters.category)) plan.push({ key: 'category', label: 'Show all categories' });
    if (text(filters.availability)) plan.push({ key: 'availability', label: 'Show all availability' });
    if (text(filters.q)) plan.push({ key: 'q', label: 'Clear search words' });
    if (text(filters.min_price_cents) || text(filters.max_price_cents)) plan.push({ key: 'price', label: 'Remove price range' });
    if (text(filters.color_name)) plan.push({ key: 'color_name', label: 'Show all colours' });
    if (text(filters.merchandise_origin)) plan.push({ key: 'merchandise_origin', label: 'Show all origins' });
    if (text(filters.product_type)) plan.push({ key: 'product_type', label: 'Show all Product types' });
    if (!plan.length) plan.push({ key: 'all', label: 'Reset all filters' });
    return plan.slice(0, 4);
  }

  globalThis.DDStorefrontSearchCollections = Object.freeze({
    BUILD,
    CONTRACT,
    LOCAL_PARAM_KEYS,
    availabilityOfProduct,
    filterAndSortProducts,
    buildMerchandisingSummary,
    buildRelaxationPlan,
  });

  if (typeof document === 'undefined') return;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[char]));
  let sourcePayload = null;

  function installStyles() {
    if (document.getElementById('dd-build75-storefront-search-style')) return;
    const style = document.createElement('style');
    style.id = 'dd-build75-storefront-search-style';
    style.textContent = `
      .build75-discovery-bar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 14px}
      .build75-discovery-card{padding:10px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:12px;min-width:0}
      .build75-discovery-card strong{display:block;font-size:1.1rem}
      .build75-active-filters{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 12px}
      .build75-zero-assist{padding:14px;margin:10px 0;border:1px dashed color-mix(in srgb,currentColor 30%,transparent);border-radius:12px}
      .build75-zero-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .build75-filter-pill{cursor:pointer}
      @media (max-width:760px){.build75-discovery-bar{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media (max-width:460px){.build75-discovery-bar{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function control(id) { return document.getElementById(id); }
  function localFilters() {
    return {
      category: text(control('shopCategoryFilter')?.value),
      availability: text(control('shopAvailabilityFilter')?.value),
      sort: text(control('shopSortFilter')?.value) || 'featured',
    };
  }

  function serverFilters() {
    return {
      q: text(control('shopSearchInput')?.value),
      product_type: text(control('shopTypeFilter')?.value),
      merchandise_origin: text(control('shopOriginFilter')?.value),
      sale_channel: text(control('shopChannelFilter')?.value),
      color_name: text(control('shopColorFilter')?.value),
      material: text(control('shopMaterialFilter')?.value),
      process: text(control('shopProcessFilter')?.value),
      locality: text(control('shopLocalityFilter')?.value),
      min_price_cents: text(control('shopMinPrice')?.value),
      max_price_cents: text(control('shopMaxPrice')?.value),
      ready_for_social: text(control('shopSocialReadyFilter')?.value),
      missing_proof_image: text(control('shopProofImageFilter')?.value),
      requires_shipping: control('shopShippingOnly')?.checked ? '1' : '',
    };
  }

  function writeLocalFiltersToUrl() {
    const params = new URLSearchParams(location.search);
    const filters = localFilters();
    for (const key of LOCAL_PARAM_KEYS) {
      const value = text(filters[key]);
      if (value && !(key === 'sort' && value === 'featured')) params.set(key, value);
      else params.delete(key);
    }
    history.replaceState({}, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function applyLocalFiltersFromUrl() {
    const params = new URLSearchParams(location.search);
    const category = control('shopCategoryFilter');
    const availability = control('shopAvailabilityFilter');
    const sort = control('shopSortFilter');
    if (category) category.value = params.get('category') || '';
    if (availability) availability.value = params.get('availability') || '';
    if (sort) sort.value = params.get('sort') || 'featured';
  }

  function populateCategories(filterGroups = {}) {
    const select = control('shopCategoryFilter');
    if (!select) return;
    const current = select.value;
    const categories = Array.isArray(filterGroups.categories) ? filterGroups.categories : [];
    select.innerHTML = `<option value="">All categories</option>${categories.map((row) => `<option value="${escapeHtml(row.label)}">${escapeHtml(row.label)} (${Number(row.count || 0)})</option>`).join('')}`;
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function renderDiscoverySummary(products) {
    const mount = control('shopDiscoveryIntelligence');
    if (!mount) return;
    const summary = buildMerchandisingSummary(products);
    mount.innerHTML = `<div class="build75-discovery-bar" aria-label="Shop discovery highlights">
      <button class="build75-discovery-card" type="button" data-build75-quick="available"><strong>${summary.available}</strong><span class="small">Available now</span></button>
      <div class="build75-discovery-card"><strong>${summary.categories}</strong><span class="small">Categories</span></div>
      <button class="build75-discovery-card" type="button" data-build75-quick="under50"><strong>${summary.under_50}</strong><span class="small">Products $50 or less</span></button>
      <button class="build75-discovery-card" type="button" data-build75-quick="handmade"><strong>${summary.handmade}</strong><span class="small">Handmade Products</span></button>
    </div>`;
    mount.querySelector('[data-build75-quick="available"]')?.addEventListener('click', () => {
      const availability = control('shopAvailabilityFilter');
      if (availability) availability.value = 'available';
      applyPresentation();
    });
    mount.querySelector('[data-build75-quick="under50"]')?.addEventListener('click', () => {
      const max = control('shopMaxPrice');
      if (max) max.value = '5000';
      window.DDShopRuntime?.reload?.();
    });
    mount.querySelector('[data-build75-quick="handmade"]')?.addEventListener('click', () => {
      const origin = control('shopOriginFilter');
      if (origin) origin.value = 'handmade';
      window.DDShopRuntime?.reload?.();
    });
  }

  function renderActiveFilters() {
    const mount = control('shopActiveFilters');
    if (!mount) return;
    const local = localFilters();
    const server = serverFilters();
    const labels = [];
    if (server.q) labels.push(`Search: ${server.q}`);
    if (local.category) labels.push(`Category: ${local.category}`);
    if (server.color_name) labels.push(`Colour: ${server.color_name}`);
    if (local.availability) labels.push(`Availability: ${local.availability.replaceAll('_', ' ')}`);
    if (server.merchandise_origin) labels.push(`Origin: ${server.merchandise_origin}`);
    if (server.min_price_cents || server.max_price_cents) labels.push('Price range');
    if (local.sort && local.sort !== 'featured') labels.push(`Sort: ${local.sort.replaceAll('_', ' ')}`);
    mount.className = labels.length ? 'build75-active-filters' : '';
    mount.innerHTML = labels.map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join('');
  }

  function clearServerFilter(key) {
    const map = {
      q: ['shopSearchInput'],
      price: ['shopMinPrice', 'shopMaxPrice'],
      color_name: ['shopColorFilter'],
      merchandise_origin: ['shopOriginFilter'],
      product_type: ['shopTypeFilter'],
    };
    for (const id of map[key] || []) {
      const node = control(id);
      if (node) node.value = '';
    }
  }

  function renderZeroAssist(products) {
    const mount = control('shopZeroAssist');
    if (!mount) return;
    if (products.length) {
      mount.innerHTML = '';
      mount.style.display = 'none';
      return;
    }
    const filters = { ...serverFilters(), ...localFilters() };
    const plan = buildRelaxationPlan(filters);
    mount.style.display = '';
    mount.innerHTML = `<div class="build75-zero-assist"><strong>No exact matches yet.</strong><div class="small">Try relaxing one filter instead of starting over.</div><div class="build75-zero-actions">${plan.map((item) => `<button class="btn secondary" type="button" data-build75-relax="${escapeHtml(item.key)}">${escapeHtml(item.label)}</button>`).join('')}<a class="btn secondary" href="/collections/">Browse Collections</a></div></div>`;
    mount.querySelectorAll('[data-build75-relax]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = text(button.getAttribute('data-build75-relax'));
        if (key === 'category') { const node = control('shopCategoryFilter'); if (node) node.value = ''; applyPresentation(); return; }
        if (key === 'availability') { const node = control('shopAvailabilityFilter'); if (node) node.value = ''; applyPresentation(); return; }
        if (key === 'all') { control('shopResetButton')?.click(); return; }
        clearServerFilter(key);
        window.DDShopRuntime?.reload?.();
      });
    });
  }

  function presentSummary(rows, sourceCount) {
    const local = localFilters();
    const suffix = sourceCount !== rows.length ? ` from ${sourceCount} Product${sourceCount === 1 ? '' : 's'} in the current search set` : '';
    const sortLabel = local.sort && local.sort !== 'featured' ? ` Sorted by ${local.sort.replaceAll('_', ' ')}.` : '';
    return `${rows.length} Product${rows.length === 1 ? '' : 's'} shown${suffix}.${sortLabel}`;
  }

  function applyPresentation() {
    if (!sourcePayload || !window.DDShopRuntime?.present) return;
    const sourceProducts = Array.isArray(sourcePayload.products) ? sourcePayload.products : [];
    const rows = filterAndSortProducts(sourceProducts, localFilters());
    window.DDShopRuntime.present(rows, { summaryText: presentSummary(rows, sourceProducts.length) });
    writeLocalFiltersToUrl();
    renderActiveFilters();
    renderZeroAssist(rows);
  }

  function bindCollectionPills() {
    document.querySelectorAll('[data-build75-collection-filter]').forEach((button) => {
      if (button.dataset.build75Bound === '1') return;
      button.dataset.build75Bound = '1';
      button.addEventListener('click', () => {
        const kind = text(button.dataset.build75CollectionFilter);
        const value = text(button.dataset.build75CollectionValue);
        if (kind === 'category') {
          const category = control('shopCategoryFilter');
          if (category) category.value = value;
          applyPresentation();
        } else if (kind === 'color') {
          const color = control('shopColorFilter');
          if (color) color.value = value;
          window.DDShopRuntime?.reload?.();
        }
      });
    });
  }

  document.addEventListener('dd:shop:data', (event) => {
    sourcePayload = event.detail?.data || null;
    if (!sourcePayload) return;
    populateCategories(sourcePayload.filter_groups || {});
    applyLocalFiltersFromUrl();
    renderDiscoverySummary(sourcePayload.products || []);
    bindCollectionPills();
    applyPresentation();
  });

  document.addEventListener('DOMContentLoaded', () => {
    installStyles();
    applyLocalFiltersFromUrl();
    ['shopCategoryFilter', 'shopAvailabilityFilter', 'shopSortFilter'].forEach((id) => {
      control(id)?.addEventListener('change', applyPresentation);
    });
    control('shopSearchInput')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      control('shopSearchButton')?.click();
    });
    control('shopResetButton')?.addEventListener('click', () => {
      const category = control('shopCategoryFilter');
      const availability = control('shopAvailabilityFilter');
      const sort = control('shopSortFilter');
      if (category) category.value = '';
      if (availability) availability.value = '';
      if (sort) sort.value = 'featured';
      const params = new URLSearchParams(location.search);
      LOCAL_PARAM_KEYS.forEach((key) => params.delete(key));
      history.replaceState({}, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    });
  }, { once: true });
})();
