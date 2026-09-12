// Release 467 Build 107 — Storefront Discovery & Collection Improvements.
// Uses only the already-loaded /api/products payload. No Product request, mutation, provider call, or publication action is added.
(() => {
  'use strict';

  const BUILD = 107;
  const CONTRACT = 'storefront-discovery-paths';
  const DISCOVERY_LABELS = Object.freeze({
    'one-of-a-kind': 'One-of-a-kind',
    'local-pickup': 'Local pickup',
    'custom-gifts': 'Custom gifts',
    'laser-engraved': 'Laser engraved',
    'workshop-experiments': 'Workshop experiments',
    'proof-rich': 'Proof-rich Products'
  });
  const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const lower = (value) => text(value).toLowerCase();
  const truthy = (value) => value === true || Number(value) === 1 || ['true','yes','enabled','eligible','allowed'].includes(lower(value));
  let sourcePayload = null;
  let activeDiscover = lower(new URLSearchParams(location.search).get('discover'));

  function evidenceText(product = {}) {
    const values = [
      product.name, product.short_description, product.description, product.meta_description,
      product.keywords, product.tags, product.tag_names, product.product_tags,
      product.product_category, product.category, product.product_type, product.merchandise_origin,
      product.primary_material, product.material, product.materials, product.materials_text,
      product.making_process, product.process_notes, product.proof_material, product.proof_process,
      product.proof_locality, product.locality_label, product.fulfilment_notes, product.shipping_notes,
      product.public_story_snippet, product.public_story_summary
    ];
    return lower(values.flatMap((value) => Array.isArray(value) ? value : [value]).map(text).filter(Boolean).join(' | '));
  }

  function matchesDiscovery(product = {}, key = '') {
    const haystack = evidenceText(product);
    if (!key) return true;
    if (key === 'one-of-a-kind') return /\bone[- ]of[- ]a[- ]kind\b|\bone[- ]off\b|\bunique piece\b/.test(haystack);
    if (key === 'local-pickup') {
      return [product.local_pickup_eligible, product.allow_local_pickup, product.pickup_eligible, product.local_pickup_supported].some(truthy)
        || /\blocal pickup\b|\bcurbside pickup\b|\bpickup eligible\b/.test(haystack);
    }
    if (key === 'custom-gifts') {
      return [product.custom_order_available, product.personalization_available, product.made_to_order].some(truthy)
        || /\bcustom\b|\bpersonalized\b|\bpersonalised\b|\bmade[- ]to[- ]order\b|\bbespoke\b/.test(haystack);
    }
    if (key === 'laser-engraved') return /\blaser\b|\bengraved\b|\bengraving\b/.test(haystack);
    if (key === 'workshop-experiments') return /\bworkshop experiment\b|\bexperimental\b|\bprototype\b|\btest piece\b|\bprocess study\b/.test(haystack);
    if (key === 'proof-rich') {
      return [product.proof_material, product.proof_process, product.proof_locality].some((value) => Boolean(text(value)))
        || Number(product.has_public_trust_block || product.trust_block_count || 0) > 0
        || truthy(product.ready_for_social);
    }
    return true;
  }

  function localFilters() {
    return {
      category: text(document.getElementById('shopCategoryFilter')?.value),
      availability: text(document.getElementById('shopAvailabilityFilter')?.value),
      sort: text(document.getElementById('shopSortFilter')?.value) || 'featured'
    };
  }

  function restoreDiscoverInUrl() {
    const params = new URLSearchParams(location.search);
    if (activeDiscover) params.set('discover', activeDiscover);
    else params.delete('discover');
    history.replaceState({}, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function renderDiscoveryState(rows, sourceCount) {
    const label = DISCOVERY_LABELS[activeDiscover] || activeDiscover;
    const active = document.getElementById('shopActiveFilters');
    if (active && activeDiscover) {
      const existing = active.querySelector('[data-build107-discovery-pill]');
      if (existing) existing.remove();
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.dataset.build107DiscoveryPill = '1';
      pill.textContent = `Discovery: ${label}`;
      active.appendChild(pill);
    }
    const summary = document.getElementById('shopSummary');
    if (summary && activeDiscover) summary.textContent = `${rows.length} Product${rows.length === 1 ? '' : 's'} match “${label}” from ${sourceCount} Product${sourceCount === 1 ? '' : 's'} in the current search set.`;
    const zero = document.getElementById('shopZeroAssist');
    if (zero && activeDiscover && !rows.length) {
      zero.style.display = '';
      zero.innerHTML = `<div class="build75-zero-assist"><strong>No Products currently have enough public evidence for “${label}”.</strong><div class="small">This discovery path fails closed rather than guessing. Browse all Products or another collection.</div><div class="build75-zero-actions"><a class="btn secondary" href="/shop/">All Products</a><a class="btn secondary" href="/collections/">Browse Collections</a></div></div>`;
    }
  }

  function applyDiscovery() {
    if (!activeDiscover || !sourcePayload || !window.DDShopRuntime?.present) return;
    const sourceProducts = Array.isArray(sourcePayload.products) ? sourcePayload.products : [];
    const evidenceMatched = sourceProducts.filter((product) => matchesDiscovery(product, activeDiscover));
    const rows = window.DDStorefrontSearchCollections?.filterAndSortProducts
      ? window.DDStorefrontSearchCollections.filterAndSortProducts(evidenceMatched, localFilters())
      : evidenceMatched;
    window.DDShopRuntime.present(rows, { summaryText: `${rows.length} evidence-backed discovery match${rows.length === 1 ? '' : 'es'}.` });
    restoreDiscoverInUrl();
    renderDiscoveryState(rows, sourceProducts.length);
  }

  globalThis.DDStorefrontDiscoveryPaths = Object.freeze({ BUILD, CONTRACT, DISCOVERY_LABELS, evidenceText, matchesDiscovery });

  document.addEventListener('dd:shop:data', (event) => {
    sourcePayload = event.detail?.data || null;
    if (!sourcePayload) return;
    applyDiscovery();
  });

  document.addEventListener('DOMContentLoaded', () => {
    ['shopCategoryFilter','shopAvailabilityFilter','shopSortFilter'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => queueMicrotask(applyDiscovery));
    });
    document.getElementById('shopResetButton')?.addEventListener('click', () => {
      activeDiscover = '';
      restoreDiscoverInUrl();
    });
  }, { once:true });
})();
