// File: /public/js/admin-product-readiness.js
// Brief description: Admin product readiness dashboard for publish blockers, image-role gaps,
// public-use blockers, and SEO/image requirements before approval or publish actions.

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('productReadinessAdminMount');
    if (!mount || !window.DDAuth) return;

    let showReady = false;

    function esc(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function setMessage(message, isError = false) {
      const el = document.getElementById('productReadinessMessage');
      if (!el) return;
      el.textContent = message || '';
      el.style.display = message ? '' : 'none';
      el.className = isError ? 'small status-note error' : 'small status-note info';
    }

    function renderShell() {
      mount.innerHTML = `
        <section class="card product-readiness-shell">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
            <div>
              <h2 style="margin:0">Product readiness preview</h2>
              <p class="small" style="margin:6px 0 0 0">Review publish blockers before clicking Approve or Publish. This is a preview only; it does not publish anything.</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn" type="button" id="productReadinessToggleButton">Show ready too</button>
              <button class="btn primary" type="button" id="productReadinessRefreshButton">Refresh readiness</button>
            </div>
          </div>
          <div id="productReadinessMessage" class="small" style="display:none;margin-top:10px"></div>
          <div id="productReadinessSummary" class="product-readiness-summary"></div>
          <div id="productReadinessRows" class="product-readiness-rows"></div>
        </section>`;
      document.getElementById('productReadinessRefreshButton')?.addEventListener('click', loadReadiness);
      document.getElementById('productReadinessToggleButton')?.addEventListener('click', () => {
        showReady = !showReady;
        const button = document.getElementById('productReadinessToggleButton');
        if (button) button.textContent = showReady ? 'Hide ready products' : 'Show ready too';
        loadReadiness();
      });
    }

    function renderSummary(summary = {}) {
      const target = document.getElementById('productReadinessSummary');
      if (!target) return;
      const cards = [
        ['Total products', summary.total_products],
        ['Ready', summary.ready_products],
        ['Blocked', summary.blocked_products],
        ['Missing featured', summary.missing_featured_image],
        ['Missing image roles', summary.missing_required_roles],
        ['Alt text gaps', summary.missing_alt_text],
        ['Public-use blockers', summary.blocked_public_use],
        ['Missing SEO', summary.missing_seo],
        ['Missing price', summary.missing_price],
        ['Need 3 images', summary.needs_three_images],
        ['Avg readiness', `${Number(summary.average_score || 0)}%`]
      ];
      target.innerHTML = cards.map(([label, value]) => `
        <div class="admin-stat product-readiness-stat">
          <div class="admin-stat-label">${esc(label)}</div>
          <div class="admin-stat-value">${esc(value ?? 0)}</div>
        </div>`).join('');
    }

    function renderRows(products = []) {
      const target = document.getElementById('productReadinessRows');
      if (!target) return;
      if (!products.length) {
        target.innerHTML = '<p class="small">No blocked products found in this preview.</p>';
        return;
      }
      target.innerHTML = products.map((product) => {
        const readiness = product.readiness || {};
        const blockers = Array.isArray(readiness.blockers) ? readiness.blockers : [];
        const image = readiness.image || {};
        const blockerMarkup = blockers.length
          ? `<ul class="compact-list product-readiness-blockers">${blockers.map((blocker) => `<li><strong>${esc(blocker.label)}</strong>: ${esc(blocker.help)}</li>`).join('')}</ul>`
          : '<p class="small success-text">Ready based on current preview checks.</p>';
        return `
          <article class="card product-readiness-row ${readiness.ready ? 'is-ready' : 'is-blocked'}">
            <div class="product-readiness-row-head">
              <div>
                <div class="small">#${esc(product.product_id)} • ${esc(product.sku || 'No SKU')} • ${esc(product.status || 'status?')} / ${esc(product.review_status || 'review?')}</div>
                <h3>${esc(product.name || 'Unnamed product')}</h3>
                <div class="small">${product.slug ? `<a href="/shop/product/?slug=${encodeURIComponent(product.slug)}" target="_blank" rel="noopener">View product page</a>` : 'No slug yet'} • ${product.featured_image_url ? 'Featured image set' : 'No featured image'}</div>
              </div>
              <div class="product-readiness-score ${readiness.ready ? 'is-good' : 'is-warning'}">${esc(readiness.score || 0)}%</div>
            </div>
            <div class="product-readiness-image-summary small">
              Images: ${esc(image.image_count || 0)} • Alt text: ${esc(image.alt_coverage_count || 0)} • Hero roles: ${esc(image.hero_image_role_count || 0)} • Detail roles: ${esc(image.detail_image_role_count || 0)} • Scale roles: ${esc(image.scale_image_role_count || 0)} • Public blockers: ${esc(image.blocked_public_use_count || 0)}
            </div>
            ${blockerMarkup}
            <div class="product-readiness-actions">
              <a class="btn" href="/admin/catalog/?product_id=${encodeURIComponent(product.product_id)}">Open editor</a>
              <a class="btn" href="/admin/catalog-media/?product_id=${encodeURIComponent(product.product_id)}">Open media</a>
            </div>
          </article>`;
      }).join('');
    }

    async function loadReadiness() {
      try {
        setMessage('Loading product readiness preview...');
        const response = await window.DDAuth.apiFetch(`/api/admin/product-readiness?limit=240&show_ready=${showReady ? '1' : '0'}`);
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load readiness preview.');
        renderSummary(data.summary || {});
        renderRows(Array.isArray(data.products) ? data.products : []);
        setMessage(`Readiness preview updated ${data.generated_at ? `at ${new Date(data.generated_at).toLocaleString()}` : ''}.`);
      } catch (error) {
        renderSummary({});
        renderRows([]);
        setMessage(error.message || 'Failed to load readiness preview.', true);
      }
    }

    document.addEventListener('dd:admin-ready', (event) => {
      if (!event?.detail?.ok) return;
      renderShell();
      loadReadiness();
    });

    renderShell();
  });
})();
