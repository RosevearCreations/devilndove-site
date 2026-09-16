// Release 467 Build 157 — fail-soft Product Release Quality Command Center.
// Uses the already-recovered Product list and never starts a duplicate /api/admin/products read.
// Secondary readiness and buyer-fact evidence are bounded and may degrade without blocking Product work.
(() => {
  'use strict';
  const pathname = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (pathname !== '/admin/products') return;

  const VERSION = 'R467B157_PRODUCT_QUALITY_RECOVERY_V1';
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const MAX_EVIDENCE_PRODUCTS = 80;
  const health = {
    version: VERSION,
    core_source: 'waiting',
    product_count: 0,
    evidence_state: 'waiting',
    readiness_count: 0,
    buyer_fact_count: 0,
    last_error: '',
    duplicate_product_read: false,
  };
  window.DDProductQualityV157Health = health;

  const state = {
    products: [],
    readiness: new Map(),
    buyerFacts: new Map(),
    source: 'waiting for Product core',
    evidenceState: 'waiting',
    evidenceMessage: 'Quality will start when the Product list is ready.',
    filter: 'needs_attention',
    search: '',
    run: 0,
  };

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const text = (value) => String(value ?? '').trim();
  const bool = (value) => value === true || Number(value || 0) === 1;
  const money = (cents, currency = 'CAD') => {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'CAD' }).format(Number(cents || 0) / 100); }
    catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${currency || 'CAD'}`; }
  };

  function mount() { return document.getElementById('productQualityCommandCenterMount'); }
  function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
  function snapshotProducts() {
    try {
      const payload = safeJson(localStorage.getItem(SNAPSHOT_KEY) || 'null', null);
      return Array.isArray(payload?.products) ? payload.products : [];
    } catch { return []; }
  }

  function urls(id) {
    const q = `product_id=${encodeURIComponent(id)}`;
    return {
      edit: `/admin/products/?${q}#createProductForm`,
      media: `/admin/catalog-media/?${q}#product-media-workflow`,
      seo: `/admin/catalog/?${q}#product-seo-fields`,
      readiness: `/admin/readiness/?${q}`,
      marketplace: `/admin/marketplace-readiness/?${q}`,
    };
  }

  function approvedFacts(product) {
    const entry = state.buyerFacts.get(Number(product?.product_id || 0)) || {};
    const p = { ...product, ...(entry.product || {}) };
    const profile = entry.listing_profile || {};
    const story = entry.story_notes || {};
    const first = (...values) => values.map(text).find(Boolean) || '';
    return {
      materials: first(profile.materials_text, p.proof_material, p.material_tags, p.primary_material, p.material),
      finish: first(profile.finish_text, p.condition_summary),
      dimensions: first(profile.dimensions_text, Number(p.weight_grams || 0) > 0 ? `${Number(p.weight_grams)} g` : ''),
      care: first(profile.care_summary, story.care_notes),
      personalization: first(profile.personalization_limits, p.personalization_limits, p.personalization_note, p.customization_note),
      availability: first(profile.availability_note, Number(p.inventory_tracking || 0) === 1 ? (Number(p.inventory_quantity || 0) > 0 ? 'Current stock is available.' : 'Currently out of stock.') : 'Availability confirmed on the listing.'),
    };
  }

  function check(label, ok, category, severity, help, href, known = true) {
    return { label, ok: Boolean(ok), category, severity, help, href, known };
  }

  function qualityFor(product) {
    const id = Number(product?.product_id || 0);
    const readinessEntry = state.readiness.get(id) || null;
    const r = readinessEntry?.readiness || {};
    const image = r.image || {};
    const market = r.marketplace_image_readiness || {};
    const facts = approvedFacts(product);
    const u = urls(id);
    const price = Number(product?.price_cents || 0);
    const shipping = bool(product?.requires_shipping);
    const imageCount = Number(image.image_count || product?.image_count || 0);
    const readinessKnown = Boolean(readinessEntry);
    const buyerFactsKnown = state.buyerFacts.has(id);
    const checks = [
      check('Product title', text(product?.name).length > 0, 'catalog', 'blocker', 'Add a clear buyer-facing product title.', u.edit),
      check('Descriptions', text(product?.short_description).length >= 40 && text(product?.description).length >= 120, 'catalog', 'attention', 'Add useful short and long product descriptions.', u.edit),
      check('Category', text(product?.product_category).length > 0, 'catalog', 'blocker', 'Assign the correct product category.', u.edit),
      check('Price', price > 0, 'commerce', 'blocker', 'Set a positive selling price.', u.edit),
      check('Inventory', !bool(product?.inventory_tracking) || Number(product?.inventory_quantity || 0) > 0 || Number(product?.buildable_units_from_resources || 0) > 0, 'inventory', 'attention', 'Restock, link buildable resources, or correct inventory tracking.', u.edit),
      check('Hero image', text(product?.featured_image_url).length > 0 && (!readinessKnown || Number(image.first_merchandising_score || 0) >= 70), 'image', 'blocker', 'Choose or improve the hero/front image.', u.media, readinessKnown),
      check('Gallery depth', imageCount >= 3, 'image', 'attention', 'Add at least three distinct buyer-useful product views.', u.media, readinessKnown || imageCount > 0),
      check('SEO title/meta', text(product?.meta_title).length >= 10 && text(product?.meta_description).length >= 50, 'seo', 'attention', 'Complete the Product SEO title and meta description.', u.seo),
      check('Canonical/slug', text(product?.slug).length > 0, 'seo', 'attention', 'Ensure the Product has a stable slug/canonical destination.', u.seo),
      check('Shipping eligibility', !shipping || text(product?.shipping_code).length > 0, 'commerce', 'blocker', 'Assign the shipping code required by this physical product. Storefront shipping remains Canada-only.', u.edit),
      check('Marketplace image set', market.ready === true, 'marketplace', 'attention', (market.blockers || market.warnings || [])[0] || 'Review marketplace image readiness.', u.marketplace, readinessKnown),
      check('Buyer fact: materials', text(facts.materials).length > 0, 'buyer_facts', 'attention', 'Add approved material facts; never invent them for public display.', u.edit, buyerFactsKnown),
      check('Buyer fact: finish / condition', text(facts.finish).length > 0, 'buyer_facts', 'attention', 'Add an approved finish or condition fact.', u.edit, buyerFactsKnown),
      check('Buyer fact: size / dimensions', text(facts.dimensions).length > 0, 'buyer_facts', 'attention', 'Add approved dimensions or a truthful size/weight fact.', u.edit, buyerFactsKnown),
      check('Buyer fact: care', text(facts.care).length > 0, 'buyer_facts', 'attention', 'Add approved care guidance when applicable.', u.edit, buyerFactsKnown),
      check('Buyer fact: personalization limits', text(facts.personalization).length > 0, 'buyer_facts', 'attention', 'Record personalization limits or an explicit not-personalized fact.', u.edit, buyerFactsKnown),
      check('Buyer fact: availability', text(facts.availability).length > 0, 'buyer_facts', 'blocker', 'Resolve the buyer-facing availability fact before publication.', u.edit, buyerFactsKnown),
    ];
    const knownChecks = checks.filter((row) => row.known !== false);
    const failed = knownChecks.filter((row) => !row.ok);
    const blockers = failed.filter((row) => row.severity === 'blocker').length;
    const score = knownChecks.length ? Math.round((knownChecks.filter((row) => row.ok).length / knownChecks.length) * 100) : 0;
    return { checks, failed, blockers, score, readinessKnown, buyerFactsKnown, r, market };
  }

  function matches(product) {
    const q = state.search.toLowerCase();
    if (q && !`${product?.product_id || ''} ${product?.name || ''} ${product?.sku || ''} ${product?.slug || ''} ${product?.product_category || ''}`.toLowerCase().includes(q)) return false;
    const quality = product._quality;
    if (state.filter === 'all') return true;
    if (state.filter === 'ready') return quality.failed.length === 0;
    if (state.filter === 'needs_attention') return quality.failed.length > 0;
    return quality.failed.some((row) => row.category === state.filter);
  }

  function summary(label, value, detail) {
    return `<div class="card" style="padding:12px"><strong style="font-size:1.35rem">${esc(value)}</strong><div>${esc(label)}</div><div class="small">${esc(detail)}</div></div>`;
  }

  function render() {
    const target = mount();
    if (!target) return;
    if (!state.products.length) {
      target.innerHTML = `<section class="card" style="margin-bottom:18px"><div><p class="eyebrow">Release 467 Build 157</p><h2 style="margin:0">Product Release Quality Command Center</h2><p class="small">Waiting for the core Product list. Quality no longer starts a second Product database read, so the editor remains responsive while core Products recover.</p></div><div class="status-note info" style="margin-top:12px"><strong>Product quality is preparing</strong><br>${esc(state.evidenceMessage)}</div></section>`;
      return;
    }

    const rows = state.products.map((product) => ({ ...product, _quality: qualityFor(product) }));
    const filtered = rows.filter(matches).sort((a, b) => b._quality.blockers - a._quality.blockers || a._quality.score - b._quality.score);
    const needs = rows.filter((row) => row._quality.failed.length > 0).length;
    const blockers = rows.reduce((total, row) => total + row._quality.blockers, 0);
    const unknownReadiness = rows.filter((row) => !row._quality.readinessKnown).length;
    const unknownFacts = rows.filter((row) => !row._quality.buyerFactsKnown).length;
    const degraded = state.evidenceState !== 'ready';

    target.innerHTML = `<section class="card" style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><p class="eyebrow">Release 467 Build 157</p><h2 style="margin:0">Product Release Quality Command Center</h2><p class="small" style="max-width:900px">Read-only Product quality uses the already-loaded Product list. Readiness and buyer-fact evidence load afterward and fail soft; nothing is published automatically and no Product mutation is performed.</p></div><div><button class="btn" data-quality-refresh type="button">Refresh quality evidence</button> <a class="btn" href="/admin/marketplace-readiness/">Marketplace readiness</a></div></div>${degraded ? `<div class="status-note warning" style="margin-top:12px"><strong>Secondary quality evidence ${state.evidenceState === 'loading' ? 'is loading' : 'is partially unavailable'}</strong><br>${esc(state.evidenceMessage)} Essential Product work remains available.</div>` : `<div class="status-note success" style="margin-top:12px"><strong>Quality evidence loaded</strong><br>${esc(state.evidenceMessage)}</div>`}<div class="grid cols-4" style="gap:10px;margin-top:14px">${summary('Products assessed', rows.length, state.source)}${summary('Fix next', needs, `${blockers} blocking issue(s)`)}${summary('Readiness pending', unknownReadiness, 'Unknown evidence is not marked complete')}${summary('Buyer facts pending', unknownFacts, 'Unknown evidence is not invented')}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;align-items:end"><label style="min-width:240px;flex:1"><span class="small">Search products</span><input class="input" data-quality-search type="search" value="${esc(state.search)}" placeholder="Name, SKU, slug, category or ID"></label><label><span class="small">Show</span><select class="input" data-quality-filter>${[['needs_attention','Fix next'],['all','All'],['ready','Quality complete'],['catalog','Catalog facts'],['commerce','Commerce'],['inventory','Inventory'],['image','Images'],['seo','SEO / structured facts'],['buyer_facts','Buyer facts'],['marketplace','Marketplace images']].map(([value, label]) => `<option value="${value}" ${state.filter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><div style="display:grid;gap:12px;margin-top:14px">${filtered.slice(0, 100).map((product) => {
      const quality = product._quality;
      const first = quality.failed[0] || null;
      const u = urls(product.product_id);
      return `<article class="card" style="padding:14px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><strong>${esc(product.name || `Product #${product.product_id}`)}</strong><div class="small">#${esc(product.product_id)}${product.sku ? ` • ${esc(product.sku)}` : ''}${product.product_category ? ` • ${esc(product.product_category)}` : ''}</div></div><strong>${quality.score}% known-quality checks</strong></div><div class="small" style="margin-top:8px">Price ${esc(money(product.price_cents, product.currency))} • readiness ${quality.readinessKnown ? esc(String(quality.r.score ?? 'known')) : 'pending'} • buyer facts ${quality.buyerFactsKnown ? 'loaded' : 'pending'}</div>${first ? `<div class="status-note ${first.severity === 'blocker' ? 'warning' : 'info'}" style="margin-top:10px"><strong>Fix next: ${esc(first.label)}</strong><br>${esc(first.help)} <a href="${esc(first.href)}">Open owning workspace</a></div>` : `<div class="status-note success" style="margin-top:10px"><strong>No known quality blocker</strong><br>Unknown evidence remains pending and is not counted as complete.</div>`}<details style="margin-top:8px"><summary>Quality checks</summary><ul>${quality.checks.map((row) => `<li>${row.known === false ? '…' : row.ok ? '✓' : '!'} <strong>${esc(row.label)}</strong>${row.known === false ? ' — evidence pending' : row.ok ? '' : ` — ${esc(row.help)}`}</li>`).join('')}</ul></details><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn small" href="${esc(u.edit)}">Edit product</a><a class="btn small" href="${esc(u.media)}">Crop / focal</a><a class="btn small" href="${esc(u.seo)}">SEO</a><a class="btn small" href="${esc(u.marketplace)}">Marketplace</a><a class="btn small" href="${esc(u.readiness)}">Full preflight</a></div></article>`;
    }).join('') || '<p class="small">No Products match this quality filter.</p>'}</div></section>`;

    target.querySelector('[data-quality-refresh]')?.addEventListener('click', () => loadEvidence(true));
    target.querySelector('[data-quality-filter]')?.addEventListener('change', (event) => { state.filter = event.target.value; render(); });
    target.querySelector('[data-quality-search]')?.addEventListener('input', (event) => { state.search = event.target.value || ''; render(); });
  }

  async function authJson(url, timeoutMs) {
    if (!window.DDAuth?.apiFetch) throw new Error('Admin authentication helper is not ready.');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await window.DDAuth.apiFetch(url, { method: 'GET', signal: controller.signal, cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      return data;
    } finally { window.clearTimeout(timer); }
  }

  async function publicJson(url, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal, cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      return data;
    } finally { window.clearTimeout(timer); }
  }

  async function loadEvidence(manual = false) {
    if (!state.products.length) {
      state.evidenceMessage = 'Waiting for the core Product list; no duplicate Product request was started.';
      render();
      return;
    }
    const run = ++state.run;
    state.evidenceState = 'loading';
    state.evidenceMessage = manual ? 'Refreshing bounded readiness and buyer-fact evidence…' : 'Loading bounded readiness and buyer-fact evidence…';
    health.evidence_state = 'loading';
    render();

    const ids = state.products.map((row) => Number(row?.product_id || 0)).filter(Boolean).slice(0, MAX_EVIDENCE_PRODUCTS);
    const results = await Promise.allSettled([
      authJson('/api/admin/product-readiness?limit=80&show_ready=1', 4500),
      ids.length ? publicJson(`/api/product-buyer-facts?ids=${encodeURIComponent(ids.join(','))}`, 3500) : Promise.resolve({ ok: true, products: {} }),
    ]);
    if (run !== state.run) return;

    const errors = [];
    const readinessResult = results[0];
    if (readinessResult.status === 'fulfilled') {
      const rows = Array.isArray(readinessResult.value?.products) ? readinessResult.value.products : [];
      state.readiness = new Map(rows.map((row) => [Number(row?.product_id || 0), row]));
      if (readinessResult.value?.degraded) errors.push(`Product readiness is degraded (${text(readinessResult.value.reason) || 'bounded timeout'}).`);
    } else {
      state.readiness = new Map();
      errors.push(`Product readiness: ${readinessResult.reason?.message || 'unavailable'}`);
    }

    const factsResult = results[1];
    state.buyerFacts = new Map();
    if (factsResult.status === 'fulfilled') {
      Object.entries(factsResult.value?.products || {}).forEach(([id, row]) => state.buyerFacts.set(Number(id), row));
    } else {
      errors.push(`Buyer facts: ${factsResult.reason?.message || 'unavailable'}`);
    }

    health.readiness_count = state.readiness.size;
    health.buyer_fact_count = state.buyerFacts.size;
    health.last_error = errors.join(' ');
    state.evidenceState = errors.length ? 'degraded' : 'ready';
    health.evidence_state = state.evidenceState;
    state.evidenceMessage = errors.length ? errors.join(' ') : `Readiness loaded for ${state.readiness.size} Product(s); buyer facts loaded for ${state.buyerFacts.size}.`;
    render();
  }

  function acceptProducts(products, source) {
    const rows = Array.isArray(products) ? products.filter((row) => Number(row?.product_id || 0) > 0) : [];
    if (!rows.length) return false;
    state.products = rows;
    state.source = source;
    state.evidenceMessage = 'Core Product list is ready; loading secondary quality evidence.';
    health.core_source = source;
    health.product_count = rows.length;
    render();
    window.setTimeout(() => loadEvidence(false), 40);
    return true;
  }

  function start() {
    const cached = snapshotProducts();
    if (cached.length) acceptProducts(cached, 'recent Product snapshot');
    else render();

    document.addEventListener('dd:products-core-recovered', (event) => {
      acceptProducts(event?.detail?.products || [], `live core recovery${event?.detail?.source ? ` · ${event.detail.source}` : ''}`);
    });

    window.setTimeout(() => {
      if (!state.products.length) {
        const retrySnapshot = snapshotProducts();
        if (retrySnapshot.length) acceptProducts(retrySnapshot, 'Product snapshot after core wait');
        else {
          state.evidenceMessage = 'The core Product list is still loading. Quality remains idle and does not create another Product database request.';
          render();
        }
      }
    }, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
