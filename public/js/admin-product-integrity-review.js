// Devil n Dove Build 440 — read-only Product ingredient/media integrity queues.
// Explicit Admin review only: no polling, no provider execution, no automatic mutation.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('productIntegrityReviewMount');
  if (!mount || !window.DDAuth) return;

  const state = { queue: 'all', q: '', offset: 0, limit: 30, data: null, loading: false, error: '' };
  let booted = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[ch]));
  const num = (value) => Number(value || 0) || 0;

  function issueBadges(issues = []) {
    return Array.isArray(issues) && issues.length
      ? `<div class="product-integrity-badges">${issues.map((item) => `<span>${esc(item.label || item.code || 'Review')}</span>`).join('')}</div>`
      : '';
  }

  function renderIngredientRows(rows = []) {
    if (!rows.length) return '<p class="small">No label-ingredient review rows are in this page.</p>';
    return `<div class="product-integrity-list">${rows.map((row) => `
      <article class="product-integrity-item">
        <div class="product-integrity-row-head">
          <div>
            <p class="eyebrow">Ingredient review</p>
            <h4>${esc(row.product_name || `Product ${row.product_id}`)}</h4>
            <p class="small">${esc(row.supply_name || row.source_key || 'Supply')} · Product #${esc(row.product_id)} · link #${esc(row.product_resource_link_id)}</p>
          </div>
          <a class="btn" href="${esc(row.owner_url)}">Open Product Resources</a>
        </div>
        ${issueBadges(row.issues)}
        <div class="product-integrity-facts">
          <span><strong>English:</strong> ${esc(row.ingredient_name_en || '—')}</span>
          <span><strong>French:</strong> ${esc(row.ingredient_name_fr || '—')}</span>
          <span><strong>INCI:</strong> ${esc(row.inci_name || '—')}</span>
          <span><strong>Review:</strong> ${esc(String(row.translation_review_status || 'needs_review').replaceAll('_',' '))}</span>
        </div>
      </article>`).join('')}</div>`;
  }

  function renderMediaRows(rows = []) {
    if (!rows.length) return '<p class="small">No Product media-integrity rows are in this page.</p>';
    return `<div class="product-integrity-list">${rows.map((row) => `
      <article class="product-integrity-item">
        <div class="product-integrity-row-head">
          <div>
            <p class="eyebrow">Product media integrity</p>
            <h4>${esc(row.product_name || `Product ${row.product_id}`)}</h4>
            <p class="small">Product #${esc(row.product_id)} · ${esc(row.product_status || 'unknown status')}</p>
          </div>
          <a class="btn" href="${esc(row.owner_url)}">Open Media workspace</a>
        </div>
        ${issueBadges(row.issues)}
        <div class="product-integrity-facts">
          <span><strong>Gallery:</strong> ${esc(row.gallery_count)} row(s), ${esc(row.unique_gallery_count)} unique</span>
          <span><strong>Latest snapshot gallery:</strong> ${esc(row.snapshot_product_image_count)}</span>
          <span><strong>Recoverable unique:</strong> ${esc(row.recoverable_unique_image_count)}</span>
          <span><strong>Media assets:</strong> ${esc(row.media_asset_count)}</span>
        </div>
      </article>`).join('')}</div>`;
  }

  function render() {
    const data = state.data || {};
    const ingredient = data.summary?.ingredient || {};
    const media = data.summary?.media || {};
    const mediaSignals = num(media.recoverable_gap) + num(media.gallery_over_limit) + num(media.duplicate_gallery_url) + num(media.featured_missing);
    mount.innerHTML = `
      <section class="card product-integrity-review" aria-labelledby="productIntegrityReviewHeading">
        <div class="product-integrity-heading">
          <div>
            <p class="inventory-operations-eyebrow">Build 440 review queues</p>
            <h3 id="productIntegrityReviewHeading">Ingredient &amp; Product Media Integrity</h3>
            <p class="small">Read-only triage. This desk identifies Product facts/media that need review, then opens the owning Product or Media workspace. It never auto-approves ingredients or rewrites Product media.</p>
          </div>
          <button class="btn" type="button" id="productIntegrityRefresh" ${state.loading ? 'disabled' : ''}>${state.loading ? 'Loading…' : 'Refresh queues'}</button>
        </div>

        <div class="grid cols-4 product-integrity-summary">
          <div class="card"><span class="small">Ingredient rows</span><strong>${esc(num(ingredient.review_rows))}</strong></div>
          <div class="card"><span class="small">Missing INCI</span><strong>${esc(num(ingredient.missing_inci))}</strong></div>
          <div class="card"><span class="small">Translation/review due</span><strong>${esc(num(ingredient.translation_review_due))}</strong></div>
          <div class="card"><span class="small">Media issue signals</span><strong>${esc(mediaSignals)}</strong></div>
        </div>

        <div class="product-integrity-controls">
          <label><span class="small">Queue</span><select class="input" id="productIntegrityQueue">
            <option value="all" ${state.queue === 'all' ? 'selected' : ''}>Ingredients + media</option>
            <option value="ingredient" ${state.queue === 'ingredient' ? 'selected' : ''}>Ingredient review</option>
            <option value="media" ${state.queue === 'media' ? 'selected' : ''}>Product media integrity</option>
          </select></label>
          <label><span class="small">Search Product / supply</span><input class="input" id="productIntegritySearch" type="search" value="${esc(state.q)}" placeholder="product name, ID, supply, INCI"/></label>
          <button class="btn" type="button" id="productIntegritySearchButton">Apply</button>
        </div>
        <div id="productIntegrityMessage" class="small ${state.error ? 'is-error' : ''}" ${state.error ? '' : 'hidden'}>${esc(state.error)}</div>

        ${state.queue !== 'media' ? `<details class="product-integrity-section" open><summary><strong>Ingredient review</strong> · ${esc(num(ingredient.review_rows))} row(s)</summary>${renderIngredientRows(data.ingredient || [])}</details>` : ''}
        ${state.queue !== 'ingredient' ? `<details class="product-integrity-section" open><summary><strong>Product media integrity</strong> · existing Build 245 checks</summary>${renderMediaRows(data.media || [])}</details>` : ''}

        <div class="product-integrity-pager">
          <button class="btn" type="button" id="productIntegrityPrevious" ${state.offset <= 0 || state.loading ? 'disabled' : ''}>Previous</button>
          <span class="small">Offset ${esc(state.offset)}</span>
          <button class="btn" type="button" id="productIntegrityNext" ${(Math.max((data.ingredient || []).length, (data.media || []).length) < state.limit) || state.loading ? 'disabled' : ''}>Next</button>
        </div>
      </section>`;

    mount.querySelector('#productIntegrityRefresh')?.addEventListener('click', () => load({ reset: true }));
    mount.querySelector('#productIntegrityQueue')?.addEventListener('change', (event) => { state.queue = String(event.target.value || 'all'); state.offset = 0; load(); });
    mount.querySelector('#productIntegritySearchButton')?.addEventListener('click', () => { state.q = String(mount.querySelector('#productIntegritySearch')?.value || '').trim(); state.offset = 0; load(); });
    mount.querySelector('#productIntegritySearch')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); state.q = String(event.currentTarget.value || '').trim(); state.offset = 0; load(); } });
    mount.querySelector('#productIntegrityPrevious')?.addEventListener('click', () => { state.offset = Math.max(0, state.offset - state.limit); load(); });
    mount.querySelector('#productIntegrityNext')?.addEventListener('click', () => { state.offset += state.limit; load(); });
  }

  async function load({ reset = false } = {}) {
    if (!window.DDAuth?.isLoggedIn() || state.loading) return;
    if (reset) state.offset = 0;
    state.loading = true;
    state.error = '';
    render();
    try {
      const params = new URLSearchParams({ queue: state.queue, q: state.q, limit: String(state.limit), offset: String(state.offset) });
      const data = await window.DDAuth.apiJson(`/api/admin/product-integrity-review?${params.toString()}`, { method: 'GET' }, {
        fallbackMessage: 'Product integrity queues could not be loaded.',
        cacheKey: `product-integrity-review:${state.queue}:${state.q.toLowerCase()}:${state.offset}`,
        cacheTtlMs: 15000,
        retries: 1,
        staleOnError: false,
      });
      state.data = data;
    } catch (error) {
      state.error = error?.message || 'Product integrity queues could not be loaded.';
    } finally {
      state.loading = false;
      render();
    }
  }

  function boot() {
    if (booted || !window.DDAuth?.isLoggedIn()) return;
    booted = true;
    render();
    load();
  }

  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) boot(); });
  if (window.DDAuth?.isLoggedIn()) boot(); else render();
});
