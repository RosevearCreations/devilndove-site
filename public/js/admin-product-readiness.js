// File: /public/js/admin-product-readiness.js
// Brief description: Admin product readiness dashboard for publish blockers, image-role gaps,
// public-use blockers, and SEO/image requirements before approval or publish actions.

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const mount = document.getElementById('productReadinessAdminMount');
    if (!mount || !window.DDAuth) return;

    let showReady = false;
    let activeFilter = new URLSearchParams(window.location.search).get('filter') || '';
    let activeProductId = Number(new URLSearchParams(window.location.search).get('product_id') || 0);

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


    const FILTER_LABELS = {
      missing_featured: 'Missing featured image',
      missing_image_roles: 'Missing image roles',
      missing_hero_role: 'Missing hero/front role',
      missing_alt_text: 'Missing alt text',
      blocked_public_images: 'Public-use blockers',
      missing_seo: 'Missing SEO',
      missing_price: 'Missing price',
      needs_three_images: 'Needs 3 images'
    };

    function blockerKey(blocker = {}) {
      return String(blocker.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }

    function productMatchesActiveFilter(product = {}) {
      if (activeProductId && Number(product.product_id || 0) !== activeProductId) return false;
      if (!activeFilter) return true;
      const readiness = product.readiness || {};
      const blockers = Array.isArray(readiness.blockers) ? readiness.blockers : [];
      const labels = new Set(blockers.map(blockerKey));
      const image = readiness.image || {};
      if (activeFilter === 'missing_featured') return labels.has('featured_image');
      if (activeFilter === 'missing_image_roles') return labels.has('image_roles') || labels.has('hero_front_role') || labels.has('detail_image_role') || labels.has('scale_context_role');
      if (activeFilter === 'missing_hero_role') return Number(image.hero_image_role_count || 0) <= 0;
      if (activeFilter === 'missing_alt_text') return labels.has('alt_text');
      if (activeFilter === 'blocked_public_images') return labels.has('public_use_clearance');
      if (activeFilter === 'missing_seo') return labels.has('seo_title') || labels.has('seo_meta_description');
      if (activeFilter === 'missing_price') return labels.has('price');
      if (activeFilter === 'needs_three_images') return labels.has('image_count');
      return true;
    }

    function quickFixButtons(product = {}) {
      const readiness = product.readiness || {};
      const blockers = Array.isArray(readiness.blockers) ? readiness.blockers : [];
      const labels = new Set(blockers.map(blockerKey));
      if (!labels.has('hero_front_role') && !labels.has('detail_image_role') && !labels.has('scale_context_role') && !labels.has('image_roles')) return '';
      return `<button class="btn" type="button" data-readiness-quick-roles="${esc(product.product_id)}">Apply recommended image roles</button>`;
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
          <div id="productReadinessActiveFilter" class="small" style="margin-top:10px"></div>
          <div id="productReadinessSummary" class="product-readiness-summary"></div>
          <div id="productReadinessRows" class="product-readiness-rows"></div>
        </section>`;
      document.getElementById('productReadinessRefreshButton')?.addEventListener('click', loadReadiness);
      mount.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-readiness-quick-roles]');
        if (!button) return;
        try {
          button.disabled = true;
          await applyQuickRoles(Number(button.getAttribute('data-readiness-quick-roles') || 0));
        } catch (error) {
          setMessage(error.message || 'Quick role fix failed.', true);
        } finally {
          button.disabled = false;
        }
      });
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
      products = products.filter(productMatchesActiveFilter);
      const filterEl = document.getElementById('productReadinessActiveFilter');
      if (filterEl) filterEl.innerHTML = activeFilter ? `Active drilldown: <strong>${esc(FILTER_LABELS[activeFilter] || activeFilter)}</strong> <a class="btn small" href="/admin/readiness/">Clear filter</a>` : "";
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
              ${quickFixButtons(product)}
            </div>
          </article>`;
      }).join('');
    }


    async function applyQuickRoles(productId) {
      const recommended = ['hero_front', 'detail_texture', 'scale_context', 'back_side', 'process_story', 'packaging_pickup', 'material_tool_proof'];
      setMessage(`Applying recommended image roles for product #${productId}...`);
      const response = await window.DDAuth.apiFetch(`/api/admin/product-images?product_id=${encodeURIComponent(productId)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load product images.');
      const images = (Array.isArray(data.images) ? data.images : []).map((row, index) => ({
        ...row,
        image_role: row.image_role || recommended[index] || 'gallery_support',
        public_use_status: row.public_use_status || (index === 0 ? 'product_page_ok' : 'internal_review'),
        sort_order: index
      }));
      if (!images.length) throw new Error('No product images exist yet. Upload images before applying roles.');
      const save = await window.DDAuth.apiFetch('/api/admin/product-images', { method: 'POST', body: JSON.stringify({ product_id: Number(productId), images }) });
      const saveData = await save.json().catch(() => null);
      if (!save.ok || !saveData?.ok) throw new Error(saveData?.error || 'Could not save image roles.');
      await loadReadiness();
      setMessage(`Recommended roles saved for product #${productId}. Review consent status before publishing.`);
    }

    async function loadReadiness() {
      try {
        setMessage('Loading product readiness preview...');
        const response = await window.DDAuth.apiFetch(`/api/admin/product-readiness?limit=240&show_ready=${showReady ? '1' : '0'}${activeProductId ? `&product_id=${encodeURIComponent(activeProductId)}` : ''}`);
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
