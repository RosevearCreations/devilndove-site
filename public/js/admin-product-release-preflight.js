// Build 208 — read-only operator decision panel for Product Release Preflight.
// It consumes the protected preflight API and provides links to the owning workflow.

(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('productReleasePreflightMount');
    if (!mount || !window.DDAuth) return;

    const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[ch]));
    const text = (value) => String(value ?? '').trim();
    const num = (value) => { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; };
    const qs = new URLSearchParams(location.search);
    const state = {
      productId: num(qs.get('product_id')),
      destination: ['both', 'workshop_journal', 'website_gallery'].includes(qs.get('destination')) ? qs.get('destination') : 'both',
      products: [],
      data: null,
      query: '',
      message: '',
      booted: false
    };

    function api(url) {
      return window.DDAuth.apiFetch(url).then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Release preflight request failed.');
        return data;
      });
    }

    function updateUrl() {
      const url = new URL(location.href);
      if (state.productId) url.searchParams.set('product_id', String(state.productId)); else url.searchParams.delete('product_id');
      url.searchParams.set('destination', state.destination);
      history.replaceState({}, '', `${url.pathname}${url.search}`);
    }

    function productLabel(product) {
      const id = num(product?.product_id);
      return `#${id} — ${text(product?.name) || `Product ${id}`}`;
    }

    function results() {
      const needle = state.query.toLowerCase();
      const list = state.products.filter((product) => !needle || [product.product_id, product.product_number, product.name, product.sku, product.slug]
        .some((value) => String(value || '').toLowerCase().includes(needle)));
      return list.slice(0, 12);
    }

    function statusClass(ready) { return ready ? 'is-ready' : 'is-blocked'; }
    function statusLabel(ready) { return ready ? 'Ready' : 'Needs attention'; }

    function checkItem(item) {
      const kind = item.pass ? 'pass' : (item.required ? 'block' : 'warn');
      return `<li class="release-preflight-check ${kind}">
        <span class="release-preflight-check-mark" aria-hidden="true">${item.pass ? '✓' : item.required ? '!' : '•'}</span>
        <div><strong>${esc(item.label)}</strong><p>${esc(item.detail)}</p>${item.href ? `<a href="${esc(item.href)}" class="btn small">Open owning step</a>` : ''}</div>
      </li>`;
    }

    function stageCard(item) {
      return `<article class="release-preflight-stage ${statusClass(item.ready)}">
        <div class="release-preflight-stage-head"><div><p class="eyebrow">${esc(item.key.replace(/_/g, ' '))}</p><h3>${esc(item.label)}</h3><p>${esc(item.description)}</p></div><span class="release-preflight-badge ${statusClass(item.ready)}">${esc(statusLabel(item.ready))}</span></div>
        <div class="release-preflight-counts"><span>${Number(item.blocker_count || 0)} blocker${Number(item.blocker_count || 0) === 1 ? '' : 's'}</span><span>${Number(item.warning_count || 0)} note${Number(item.warning_count || 0) === 1 ? '' : 's'}</span></div>
        <ul class="release-preflight-check-list">${(item.checks || []).map(checkItem).join('')}</ul>
      </article>`;
    }

    function decisionCard(summary, type) {
      const action = summary.first_next_action;
      return `<section class="release-preflight-decision ${statusClass(summary.ready)}">
        <div><p class="eyebrow">${type === 'handoff' ? 'Package handoff' : 'Publication decision'}</p><h2>${esc(summary.label)}</h2><p>${summary.ready ? 'All required checks in this decision pass. Continue with a deliberate human review; nothing is published automatically.' : `${Number(summary.blocker_count || 0)} required check${Number(summary.blocker_count || 0) === 1 ? '' : 's'} still needs attention.`}</p></div>
        <div class="release-preflight-score"><strong>${Number(summary.score || 0)}%</strong><span>required checks passing</span></div>
        ${action ? `<div class="release-preflight-next"><strong>Next action: ${esc(action.label)}</strong><span>${esc(action.detail)}</span>${action.href ? `<a class="btn" href="${esc(action.href)}">Open next step</a>` : ''}</div>` : `<div class="release-preflight-next"><strong>${summary.ready ? 'Decision is clear' : 'No next step recorded'}</strong><span>${summary.ready ? 'Use the linked workflow to perform the next deliberate review.' : 'Refresh the preflight after correcting the issue.'}</span></div>`}
      </section>`;
    }

    function renderShell() {
      const selected = state.data?.product;
      const featured = text(selected?.featured_image_url);
      mount.innerHTML = `<div class="release-preflight-message" ${state.message ? '' : 'hidden'}>${esc(state.message)}</div>
        <section class="card release-preflight-controls">
          <div><h2>Choose a product release package</h2><p class="small">This is a read-only checklist. It does not approve, publish, change media, alter consent, run CAIP, or contact any platform.</p></div>
          <div class="release-preflight-toolbar">
            <label>Find product<input id="releasePreflightSearch" class="input" type="search" placeholder="Product ID, product number, name, SKU, or slug" value="${esc(state.query)}" autocomplete="off"></label>
            <label>Publish destination<select id="releasePreflightDestination" class="input"><option value="both" ${state.destination === 'both' ? 'selected' : ''}>Both website destinations</option><option value="workshop_journal" ${state.destination === 'workshop_journal' ? 'selected' : ''}>Workshop Journal</option><option value="website_gallery" ${state.destination === 'website_gallery' ? 'selected' : ''}>Website gallery</option></select></label>
            <button class="btn secondary" type="button" id="releasePreflightRefresh">Refresh checklist</button>
          </div>
          <div class="release-preflight-results" id="releasePreflightResults">${results().map((product) => `<button type="button" class="release-preflight-result ${num(product.product_id) === state.productId ? 'selected' : ''}" data-release-product="${num(product.product_id)}"><strong>${esc(productLabel(product))}</strong><span>${esc([product.status, product.review_status, product.sku].filter(Boolean).join(' · ').replace(/_/g, ' '))}</span></button>`).join('') || '<span class="small">No matching products found.</span>'}</div>
        </section>
        ${state.data ? `<section class="card release-preflight-product-summary">
          <div class="release-preflight-product-art">${featured ? `<img src="${esc(featured)}" alt="Current featured media for ${esc(selected.name || 'selected product')}">` : `<img src="/assets/release-preflight-placeholder.svg" alt="Admin-only product release preflight placeholder">`}</div>
          <div><p class="eyebrow">Selected product</p><h2>${esc(productLabel(selected))}</h2><p class="small">${esc([selected.status, selected.review_status, selected.sku, selected.product_category].filter(Boolean).join(' · ').replace(/_/g, ' '))}</p><div class="release-preflight-product-links"><a class="btn" href="/admin/catalog/?product_id=${num(selected.product_id)}">Product Editor</a><a class="btn" href="/admin/catalog-media/?product_id=${num(selected.product_id)}#product-media-workflow">Catalog Media</a><a class="btn" href="/admin/content-studio/">Content Studio</a><a class="btn" href="/admin/creative-assets/?product_id=${num(selected.product_id)}">CAIP</a><a class="btn" href="/admin/content-publications/">Release Board</a></div></div>
          <div class="release-preflight-mini-stats"><span><b>${Number(state.data.media?.total || 0)}</b> product media</span><span><b>${Number(state.data.content?.media?.selected_public_allowed || 0)}</b> selected public sources</span><span><b>${Number(state.data.caip?.evidence_count || 0)}</b> CAIP evidence rows</span></div>
        </section>
        ${decisionCard(state.data.handoff || {}, 'handoff')}
        ${decisionCard(state.data.publish || {}, 'publish')}
        <section class="release-preflight-stage-grid">${Object.values(state.data.stages || {}).map(stageCard).join('')}</section>
        <section class="card release-preflight-boundary"><h2>What this checklist does not do</h2><p>It only reports existing records. A passing result does not create consent, transform a source image, render an output, change public copy, approve a Release Board draft, publish a page, update a marketplace, or prove a live platform result. Use each linked owner screen for those deliberate actions.</p></section>` : `<section class="card release-preflight-empty"><img src="/assets/release-preflight-placeholder.svg" alt="Admin-only release preflight visual"><div><h2>Choose a product to review</h2><p>Search by Product ID, product number, name, SKU, or slug. The preflight will then combine the source-safe checks before a release handoff.</p></div></section>`}`;
      wire();
    }

    function wire() {
      mount.querySelector('#releasePreflightSearch')?.addEventListener('input', (event) => {
        state.query = event.target.value;
        const resultMount = mount.querySelector('#releasePreflightResults');
        if (!resultMount) return;
        resultMount.innerHTML = results().map((product) => `<button type="button" class="release-preflight-result ${num(product.product_id) === state.productId ? 'selected' : ''}" data-release-product="${num(product.product_id)}"><strong>${esc(productLabel(product))}</strong><span>${esc([product.status, product.review_status, product.sku].filter(Boolean).join(' · ').replace(/_/g, ' '))}</span></button>`).join('') || '<span class="small">No matching products found.</span>';
        resultMount.querySelectorAll('[data-release-product]').forEach((button) => button.addEventListener('click', () => {
          state.productId = num(button.dataset.releaseProduct); state.data = null; state.message = 'Loading selected product preflight…'; updateUrl(); loadPreflight();
        }));
      });
      mount.querySelector('#releasePreflightDestination')?.addEventListener('change', (event) => { state.destination = event.target.value; updateUrl(); if (state.productId) loadPreflight(); else renderShell(); });
      mount.querySelector('#releasePreflightRefresh')?.addEventListener('click', () => { if (state.productId) loadPreflight(); else { state.message = 'Choose a product before refreshing the checklist.'; renderShell(); } });
      mount.querySelectorAll('[data-release-product]').forEach((button) => button.addEventListener('click', () => {
        state.productId = num(button.dataset.releaseProduct); state.data = null; state.message = 'Loading selected product preflight…'; updateUrl(); loadPreflight();
      }));
    }

    async function loadPreflight() {
      if (!state.productId) return;
      try {
        state.message = 'Loading release preflight…'; renderShell();
        state.data = await api(`/api/admin/product-release-preflight?product_id=${encodeURIComponent(state.productId)}&destination=${encodeURIComponent(state.destination)}`);
        state.message = `Preflight updated ${state.data.generated_at ? new Date(state.data.generated_at).toLocaleString() : ''}.`;
      } catch (error) {
        state.data = null;
        state.message = error.message || 'Could not load release preflight.';
      }
      renderShell();
    }

    async function boot() {
      if (state.booted) return;
      state.booted = true;
      try {
        const data = await api('/api/admin/products');
        state.products = Array.isArray(data.products) ? data.products : [];
      } catch (error) {
        state.message = error.message || 'Could not load products.';
      }
      renderShell();
      if (state.productId) loadPreflight();
    }

    document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) boot(); });
    if (window.DDAuth?.isLoggedIn()) boot(); else renderShell();
  });
})();
