// Release 467 Build 14 — Product Release Quality Command Center.
// Read-only aggregation of existing Product and Product Readiness authorities.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('productQualityCommandCenterMount');
  if (!mount || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let state = { products: [], readiness: new Map(), filter: 'needs_attention', search: '' };

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const text = (value) => String(value ?? '').trim();
  const money = (cents, currency = 'CAD') => {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'CAD' }).format(Number(cents || 0) / 100); }
    catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${currency || 'CAD'}`; }
  };
  const bool = (value) => value === true || Number(value || 0) === 1;

  function productUrls(productId) {
    const q = `product_id=${encodeURIComponent(productId)}`;
    return {
      edit: `/admin/products/?${q}#createProductForm`,
      media: `/admin/catalog-media/?${q}#product-media-workflow`,
      seo: `/admin/catalog/?${q}#product-seo-fields`,
      readiness: `/admin/readiness/?${q}`,
      marketplace: `/admin/marketplace-readiness/?${q}`,
    };
  }

  function makeCheck(key, label, ok, category, severity, help, href) {
    return { key, label, ok: Boolean(ok), category, severity, help, href };
  }

  function buildQuality(product) {
    const productId = Number(product.product_id || 0);
    const r = state.readiness.get(productId)?.readiness || {};
    const image = r.image || {};
    const market = r.marketplace_image_readiness || {};
    const urls = productUrls(productId);
    const price = Number(product.price_cents || 0);
    const cost = Number(product.linked_resource_cost_cents || 0);
    const margin = Number(product.gross_margin_cents ?? (price - cost));
    const inventoryTracking = bool(product.inventory_tracking);
    const inventoryQty = Number(product.inventory_quantity || 0);
    const buildable = product.buildable_units_from_resources == null ? null : Number(product.buildable_units_from_resources || 0);
    const shortages = Number(product.resource_shortage_links || 0);
    const shippingRequired = bool(product.requires_shipping);
    const hasCostAuthority = Number(product.linked_resource_count || 0) > 0 || cost > 0;
    const canonical = text(product.canonical_url) || (text(product.slug) ? `/shop/product/?slug=${encodeURIComponent(product.slug)}` : '');

    const checks = [
      makeCheck('name', 'Product title', text(product.name).length > 0, 'catalog', 'blocker', 'Add a clear buyer-facing product title.', urls.edit),
      makeCheck('description', 'Descriptions', text(product.short_description).length >= 40 && text(product.description).length >= 120, 'catalog', 'attention', 'Add useful short and long product descriptions.', urls.edit),
      makeCheck('category', 'Category', text(product.product_category).length > 0, 'catalog', 'blocker', 'Assign the correct product category.', urls.edit),
      makeCheck('price', 'Price', price > 0, 'commerce', 'blocker', 'Set a positive selling price.', urls.edit),
      makeCheck('cost', 'Cost coverage', hasCostAuthority && Number(product.missing_cost_links || 0) === 0, 'commerce', 'attention', 'Link real supply/tool costs and resolve missing cost links.', urls.edit),
      makeCheck('margin', 'Positive margin', !hasCostAuthority || margin > 0, 'commerce', 'blocker', 'Review price or linked costs because the current gross margin is not positive.', urls.edit),
      makeCheck('inventory', 'Inventory', !inventoryTracking || inventoryQty > 0 || (buildable != null && buildable > 0), 'inventory', 'attention', 'Restock, link buildable resources, or correct inventory tracking.', urls.edit),
      makeCheck('shortages', 'Resource shortages', shortages === 0, 'inventory', 'attention', 'Resolve linked resource shortages before promising availability.', urls.edit),
      makeCheck('hero', 'Hero image', text(product.featured_image_url).length > 0 && Number(image.first_merchandising_score || 0) >= 70, 'image', 'blocker', 'Choose or improve the hero/front image.', urls.media),
      makeCheck('gallery', 'Gallery depth', Number(image.image_count || product.image_count || 0) >= 3, 'image', 'attention', 'Add at least three distinct buyer-useful product views.', urls.media),
      makeCheck('alt', 'Image alt text', Number(image.image_count || 0) > 0 && Number(image.alt_coverage_count || 0) >= Math.min(3, Number(image.image_count || 0)), 'image', 'blocker', 'Add useful alt text to the lead gallery images.', urls.media),
      makeCheck('public_use', 'Public-use clearance', Number(image.blocked_public_use_count || 0) === 0, 'image', 'blocker', 'Resolve consent-needed or blocked images before public reuse.', urls.media),
      makeCheck('seo', 'SEO title/meta', text(product.meta_title).length >= 10 && text(product.meta_description).length >= 50, 'seo', 'attention', 'Complete the product SEO title and meta description.', urls.seo),
      makeCheck('canonical', 'Canonical/slug', text(product.slug).length > 0 && canonical.length > 0, 'seo', 'attention', 'Ensure the product has a stable slug/canonical destination.', urls.seo),
      makeCheck('structured', 'Structured facts', text(product.name) && text(product.slug) && price > 0 && text(product.featured_image_url) && text(product.currency || 'CAD'), 'seo', 'attention', 'Complete visible facts needed for Product/Offer structured-data parity.', urls.seo),
      makeCheck('shipping', 'Shipping eligibility', !shippingRequired || text(product.shipping_code).length > 0, 'commerce', 'blocker', 'Assign the shipping code required by this physical product.', urls.edit),
      makeCheck('marketplace_image', 'Marketplace image set', market.ready === true, 'marketplace', 'attention', (market.blockers || market.warnings || [])[0] || 'Review marketplace image readiness.', urls.marketplace),
    ];

    const failed = checks.filter((check) => !check.ok);
    const blockerCount = failed.filter((check) => check.severity === 'blocker').length;
    const attentionCount = failed.length - blockerCount;
    const priority = blockerCount * 20 + attentionCount * 8 + Math.max(0, 100 - Number(r.score || product.publish_readiness_score || 0));
    const score = checks.length ? Math.round((checks.filter((check) => check.ok).length / checks.length) * 100) : 0;
    return { checks, failed, blockerCount, attentionCount, priority, score, readiness: r, marketplace: market };
  }

  function badge(label, ok, title = '') {
    return `<span class="product-qa-badge ${ok ? 'ok' : 'fail'}" title="${esc(title)}">${ok ? '✓' : '!'} ${esc(label)}</span>`;
  }

  function summaryCard(label, value, detail) {
    return `<div class="card" style="padding:12px"><strong style="font-size:1.35rem">${esc(value)}</strong><div>${esc(label)}</div><div class="small">${esc(detail)}</div></div>`;
  }

  function matchesFilter(row) {
    const query = state.search.toLowerCase();
    if (query && !`${row.product_id} ${row.name || ''} ${row.sku || ''} ${row.slug || ''} ${row.product_category || ''}`.toLowerCase().includes(query)) return false;
    const q = row._quality;
    if (state.filter === 'all') return true;
    if (state.filter === 'ready') return q.failed.length === 0;
    if (state.filter === 'needs_attention') return q.failed.length > 0;
    return q.failed.some((check) => check.category === state.filter);
  }

  function render() {
    const enriched = state.products.map((product) => ({ ...product, _quality: buildQuality(product) }));
    const filtered = enriched.filter(matchesFilter).sort((a, b) => b._quality.priority - a._quality.priority || Number(a._quality.score || 0) - Number(b._quality.score || 0) || Number(a.product_id || 0) - Number(b.product_id || 0));
    const needs = enriched.filter((row) => row._quality.failed.length > 0).length;
    const blockers = enriched.reduce((sum, row) => sum + row._quality.blockerCount, 0);
    const marketplaceBlocked = enriched.filter((row) => row._quality.marketplace.ready !== true).length;
    const ready = enriched.length - needs;

    mount.innerHTML = `
      <section class="card" style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
          <div>
            <p class="eyebrow">Release 467 Build 14</p>
            <h2 style="margin:0">Product Release Quality Command Center</h2>
            <p class="small" style="max-width:900px">Ranked product remediation across catalog facts, price/cost/margin, stock, hero/gallery media, alt text, SEO/canonical facts, shipping, structured-data inputs, and marketplace image readiness. This view is read-only: fixes remain explicit in their owning workspaces and nothing is published automatically.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" type="button" data-quality-refresh>Refresh quality</button>
            <a class="btn" href="/admin/marketplace-readiness/">Marketplace readiness</a>
            <a class="btn" href="/admin/release-preflight/">Release preflight</a>
          </div>
        </div>
        <div class="grid cols-4" style="gap:10px;margin-top:14px">
          ${summaryCard('Products assessed', enriched.length, 'Existing Catalog authority')}
          ${summaryCard('Fix next', needs, `${blockers} blocking issue(s) across products`)}
          ${summaryCard('Quality complete', ready, 'No current Build 14 quality gaps')}
          ${summaryCard('Marketplace image attention', marketplaceBlocked, 'Image-only preparation; no provider execution')}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;align-items:end">
          <label style="min-width:240px;flex:1"><span class="small">Search products</span><input class="input" type="search" data-quality-search value="${esc(state.search)}" placeholder="Name, SKU, slug, category or ID"/></label>
          <label><span class="small">Show</span><select class="input" data-quality-filter>
            ${[['needs_attention','Fix next'],['all','All'],['ready','Quality complete'],['catalog','Catalog facts'],['commerce','Commerce'],['inventory','Inventory'],['image','Images'],['seo','SEO / structured facts'],['marketplace','Marketplace images']].map(([value,label]) => `<option value="${value}" ${state.filter === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select></label>
        </div>
        <div class="small" style="margin-top:10px">Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}, ranked by unresolved blockers first. Original R2 media is preserved; crop/focal edits use the existing Product Media derivative workflow.</div>
        <div data-quality-list style="display:grid;gap:12px;margin-top:14px">
          ${filtered.length ? filtered.slice(0, 100).map((product) => {
            const q = product._quality;
            const first = q.failed[0] || null;
            const urls = productUrls(product.product_id);
            const recs = Array.isArray(q.readiness.image_recommendations) ? q.readiness.image_recommendations : [];
            const marketBlockers = Array.isArray(q.marketplace.blockers) ? q.marketplace.blockers : [];
            const marketWarnings = Array.isArray(q.marketplace.warnings) ? q.marketplace.warnings : [];
            const hero = text(product.featured_image_url);
            return `<article class="card" style="padding:14px">
              <div style="display:grid;grid-template-columns:minmax(90px,130px) 1fr;gap:14px;align-items:start">
                <div>${hero ? `<img src="${esc(hero)}" alt="Current hero image for ${esc(product.name || `Product ${product.product_id}`)}" style="display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px"/>` : `<div class="small" style="aspect-ratio:1/1;display:grid;place-items:center;border:1px dashed var(--border);border-radius:10px">No hero</div>`}<a class="btn small" style="margin-top:8px;width:100%;box-sizing:border-box;text-align:center" href="${esc(urls.media)}">Crop / focal</a></div>
                <div>
                  <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><strong>${esc(product.name || `Product #${product.product_id}`)}</strong><div class="small">#${esc(product.product_id)}${product.sku ? ` • ${esc(product.sku)}` : ''}${product.product_category ? ` • ${esc(product.product_category)}` : ''}</div></div><div><strong>${esc(q.score)}%</strong> quality</div></div>
                  <div class="product-qa-badges" style="margin-top:8px">${q.checks.map((check) => badge(check.label, check.ok, check.help)).join('')}</div>
                  <div class="small" style="margin-top:8px">Price ${esc(money(product.price_cents, product.currency))} • linked cost ${esc(money(product.linked_resource_cost_cents, product.currency))} • gross margin ${esc(money(product.gross_margin_cents, product.currency))}</div>
                  ${first ? `<div class="status-note ${first.severity === 'blocker' ? 'warning' : 'info'}" style="margin-top:10px"><strong>Fix next: ${esc(first.label)}</strong><br>${esc(first.help)} <a href="${esc(first.href)}">Open owning workspace</a></div>` : `<div class="status-note success" style="margin-top:10px"><strong>Quality complete</strong><br>No Build 14 remediation item is currently open for this product.</div>`}
                  ${recs.length ? `<details style="margin-top:8px"><summary>Proof-image recommendations (${recs.length})</summary><ul>${recs.map((rec) => `<li><strong>${esc(rec.label)}</strong> — ${esc(rec.reason)}</li>`).join('')}</ul></details>` : ''}
                  ${(marketBlockers.length || marketWarnings.length) ? `<details style="margin-top:8px"><summary>Marketplace image checks</summary>${marketBlockers.length ? `<div class="small"><strong>Blockers:</strong> ${marketBlockers.map(esc).join(' • ')}</div>` : ''}${marketWarnings.length ? `<div class="small"><strong>Warnings:</strong> ${marketWarnings.map(esc).join(' • ')}</div>` : ''}</details>` : ''}
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn small" href="${esc(urls.edit)}">Edit product</a><a class="btn small" href="${esc(urls.media)}">Media / crop</a><a class="btn small" href="${esc(urls.seo)}">SEO</a><a class="btn small" href="${esc(urls.marketplace)}">Marketplace</a><a class="btn small" href="${esc(urls.readiness)}">Full preflight</a></div>
                </div>
              </div>
            </article>`;
          }).join('') : '<p class="small">No products match this quality filter.</p>'}
        </div>
      </section>`;

    mount.querySelector('[data-quality-refresh]')?.addEventListener('click', load);
    mount.querySelector('[data-quality-filter]')?.addEventListener('change', (event) => { state.filter = event.target.value; render(); });
    mount.querySelector('[data-quality-search]')?.addEventListener('input', (event) => { state.search = event.target.value || ''; render(); });
  }

  async function load() {
    mount.innerHTML = '<section class="card" style="margin-bottom:18px"><p class="small">Loading Product Release Quality Command Center…</p></section>';
    try {
      const [productsResponse, readinessResponse] = await Promise.all([
        window.DDAuth.apiFetch('/api/admin/products'),
        window.DDAuth.apiFetch('/api/admin/product-readiness?limit=300&show_ready=1'),
      ]);
      const [productsData, readinessData] = await Promise.all([
        productsResponse.json().catch(() => null),
        readinessResponse.json().catch(() => null),
      ]);
      if (!productsResponse.ok || !productsData?.ok) throw new Error(productsData?.error || 'Product authority failed to load.');
      if (!readinessResponse.ok || !readinessData?.ok) throw new Error(readinessData?.error || 'Product readiness authority failed to load.');
      state.products = Array.isArray(productsData.products) ? productsData.products : [];
      state.readiness = new Map((Array.isArray(readinessData.products) ? readinessData.products : []).map((row) => [Number(row.product_id || 0), row]));
      render();
    } catch (error) {
      mount.innerHTML = `<section class="card" style="margin-bottom:18px"><div class="status-note warning"><strong>Product quality view unavailable</strong><br>${esc(error?.message || 'Unknown error')}</div><button class="btn" type="button" data-quality-retry>Retry</button></section>`;
      mount.querySelector('[data-quality-retry]')?.addEventListener('click', load);
    }
  }

  load();
});
