// Build 207 — status and explicit review-first handoff between Product Media,
// Content Automation Studio, and CAIP. No automatic publication or media changes.
(() => {
  const mount = document.getElementById('productContentBridgeMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const text = (value) => String(value ?? '').trim();
  const num = (value) => Number(value || 0) || 0;
  const statusText = (value) => text(value).replace(/_/g, ' ') || 'not started';
  const statusClass = (value) => `status ${text(value).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'pending'}`;
  const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '—';
  };

  const state = {
    productId: 0,
    product: null,
    bridge: null,
    busy: false,
    message: ''
  };

  function currentProductId() {
    const context = window.DDProductMediaContext?.getProductId?.();
    const query = new URLSearchParams(window.location.search).get('product_id');
    return num(context || query || state.productId);
  }

  async function request(method = 'GET', body = null) {
    const id = currentProductId();
    if (!id) throw new Error('Choose a product first.');
    const url = `/api/admin/product-content-bridge?product_id=${encodeURIComponent(id)}`;
    const response = await window.DDAuth.apiFetch(url, body ? { method, body: JSON.stringify({ ...body, product_id: id }) } : { method });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const parts = [data.error || 'Content package request failed.', data.code ? `[${data.code}]` : '', data.hint || ''].filter(Boolean);
      throw new Error(parts.join(' '));
    }
    return data;
  }

  function placeholder() {
    return `<div class="product-content-bridge-placeholder" aria-hidden="true"><img src="/assets/caip-package-placeholder.svg" alt=""/><span>Review-first content package</span></div>`;
  }

  function countChip(label, value, tone = '') {
    return `<span class="product-content-bridge-chip ${esc(tone)}"><b>${num(value)}</b> ${esc(label)}</span>`;
  }

  function stateLabel(stage) {
    return ({ not_started: 'Not started', content_ready: 'Content package ready', caip_ready: 'CAIP connected', missing: 'Product unavailable' })[text(stage)] || statusText(stage);
  }

  function render() {
    const bridge = state.bridge;
    const product = bridge?.product || state.product;
    const content = bridge?.content;
    const caip = bridge?.caip;
    const stage = bridge?.stage || (product ? 'not_started' : 'missing');
    const eligible = Number(product?.is_content_eligible || 0) === 1;
    const disabled = state.busy || !product;

    mount.innerHTML = `
      <section class="card product-content-bridge-card" aria-label="Content Studio and CAIP product status">
        <div class="product-content-bridge-topline">
          <div class="product-content-bridge-art">${placeholder()}</div>
          <div>
            <p class="eyebrow">Content Studio → CAIP handoff</p>
            <h2>Reference-only package status</h2>
            <p class="small">This is a status and review tool. Creating or refreshing a package preserves source media and does not publish content, grant public rights, create a derivative, or change gallery order.</p>
          </div>
          <span class="${statusClass(stage)}">${esc(stateLabel(stage))}</span>
        </div>
        ${product ? `
          <div class="product-content-bridge-product"><strong>#${num(product.product_id)} · ${esc(product.name || 'Selected product')}</strong><span>${esc(statusText(product.status))} · ${esc(statusText(product.review_status))} · ${num(product.product_image_count)} product images · ${num(product.media_asset_count)} media assets</span></div>
          <div class="product-content-bridge-grid">
            <article class="product-content-bridge-stage ${content ? 'is-ready' : ''}">
              <div class="section-title-row"><div><h3>Content Studio</h3><p class="small">Source-linked media archive and factual deliverable planner.</p></div><span class="${statusClass(content?.review_status || 'not_started')}">${esc(statusText(content?.review_status || 'not_started'))}</span></div>
              ${content ? `<p><strong>${esc(content.project_title || content.content_project_key)}</strong><br><span class="small">Updated ${esc(formatDate(content.updated_at))}</span></p><div class="product-content-bridge-chip-row">${countChip('media', content.counts?.media_total)}${countChip('selected', content.counts?.selected_media)}${countChip('public cleared', content.counts?.public_allowed_media)}${countChip('deliverables', content.counts?.total)}${countChip('approved', content.counts?.approved)}</div><a class="btn secondary" href="/admin/content-studio/?project_id=${num(content.content_project_id)}">Open Content Studio</a>` : `<p class="small">No package exists yet. ${eligible ? 'Use the explicit action below when the product facts and source media are ready for review.' : 'The product must be Approved or Published before a package can be created.'}</p>`}
            </article>
            <article class="product-content-bridge-stage ${caip ? 'is-ready' : ''}">
              <div class="section-title-row"><div><h3>CAIP</h3><p class="small">Evidence, rights-aware asset references, recommendations, and story review.</p></div><span class="${statusClass(caip?.governance_status || 'not_started')}">${esc(statusText(caip?.governance_status || 'not_started'))}</span></div>
              ${caip ? `<p><strong>${esc(caip.creative_project_key || `CAIP #${num(caip.creative_project_id)}`)}</strong><br><span class="small">Updated ${esc(formatDate(caip.updated_at))}</span></p><div class="product-content-bridge-chip-row">${countChip('assets', caip.counts?.assets)}${countChip('rights cleared', caip.counts?.public_allowed)}${countChip('need review', caip.counts?.needs_review)}${countChip('evidence', caip.counts?.evidence)}${countChip('segments approved', caip.counts?.approved_segments)}</div><a class="btn secondary" href="/admin/creative-assets/?creative_project_id=${num(caip.creative_project_id)}&product_id=${num(product.product_id)}">Open CAIP</a>` : `<p class="small">CAIP will be synchronized only after a Content Studio package exists. It remains a reference-only review record.</p>`}
            </article>
          </div>
          <div class="product-content-bridge-actions">
            <button class="btn" type="button" data-content-bridge-action="create_or_refresh_package" ${disabled || !eligible ? 'disabled' : ''}>${content ? 'Refresh content package + CAIP' : 'Create content package + CAIP'}</button>
            <button class="btn secondary" type="button" data-content-bridge-action="refresh_caip" ${disabled || !content ? 'disabled' : ''}>Refresh CAIP only</button>
            ${!eligible ? `<span class="small">Package action is locked until the product review status is Approved or Published.</span>` : '<span class="small">Actions are explicit and are recorded in admin audit history.</span>'}
          </div>
        ` : `<div class="content-empty-state">Choose a product in the media workspace to see its Content Studio and CAIP status.</div>`}
        <div class="content-studio-message ${state.message ? 'info' : ''}" ${state.message ? '' : 'hidden'} id="productContentBridgeMessage" aria-live="polite">${esc(state.message)}</div>
      </section>`;

    mount.querySelectorAll('[data-content-bridge-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.dataset.contentBridgeAction;
        if (!action || state.busy) return;
        const label = action === 'refresh_caip' ? 'Refreshing CAIP from the existing Content Studio package…' : 'Creating or refreshing the review-first package…';
        state.busy = true;
        state.message = label;
        render();
        try {
          const data = await request('POST', { action, refresh_copy: 0 });
          state.bridge = data.bridge || state.bridge;
          state.product = state.bridge?.product || state.product;
          state.message = data.message || 'Product content status updated.';
          document.dispatchEvent(new CustomEvent('dd:product-content-bridge-changed', { detail: { product_id: currentProductId(), bridge: state.bridge } }));
        } catch (error) {
          state.message = error?.message || 'Could not update the content package.';
        } finally {
          state.busy = false;
          render();
        }
      });
    });
  }

  async function load(product = null) {
    const id = num(product?.product_id || currentProductId());
    state.productId = id;
    state.product = product || window.DDProductMediaContext?.getProduct?.() || null;
    state.bridge = null;
    state.message = id ? 'Loading Content Studio / CAIP status…' : '';
    render();
    if (!id || !window.DDAuth?.isLoggedIn()) return;
    try {
      const data = await request('GET');
      state.bridge = data.bridge || null;
      state.product = state.bridge?.product || state.product;
      state.message = '';
    } catch (error) {
      state.message = error?.message || 'Could not load Content Studio / CAIP status.';
    }
    render();
  }

  document.addEventListener('dd:product-media-context-changed', (event) => load(event?.detail?.product || null));
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) load(); });
  if (window.DDAuth?.isLoggedIn()) load(); else render();
})();
