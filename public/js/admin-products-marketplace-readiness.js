// Release 467 Build 106 — browser-local Marketplace Listing Readiness.
// Review/export preparation only. Reuses the Product snapshot and readiness already loaded on the Products page.
(() => {
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const CHANNELS = Object.freeze({
    etsy: { label: 'Etsy', requirements: ['hero_image','image_quality','title_description','dimensions_materials','price','inventory_state','fulfilment','tags_category','evidence'] },
    facebook_marketplace: { label: 'Facebook Marketplace', requirements: ['hero_image','image_quality','title_description','price','inventory_state','fulfilment','tags_category','evidence'] },
    pinterest: { label: 'Pinterest', requirements: ['hero_image','image_quality','title_description','price','tags_category','evidence'] },
    manual: { label: 'Manual export', requirements: ['hero_image','image_quality','title_description','dimensions_materials','price','inventory_state','fulfilment','tags_category','evidence'] }
  });
  const CHECK_LABELS = Object.freeze({
    hero_image: 'Hero image',
    image_quality: 'Image quality',
    title_description: 'Title & description',
    dimensions_materials: 'Dimensions & materials',
    price: 'Price',
    inventory_state: 'Inventory state',
    fulfilment: 'CA shipping / local pickup',
    tags_category: 'Tags & category',
    evidence: 'Required evidence'
  });
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();

  ready(() => {
    if (document.body?.dataset?.adminPage !== 'products') return;
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    let renderTimer = 0;

    function readSnapshot() {
      try {
        const raw = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
        return Array.isArray(raw?.products) ? raw.products : [];
      } catch { return []; }
    }
    const text = (value) => String(value ?? '').trim();
    const truthy = (value) => value === true || Number(value) === 1 || ['true','yes','enabled','active'].includes(text(value).toLowerCase());
    const firstText = (product, keys) => {
      for (const key of keys) { const value = text(product?.[key]); if (value) return value; }
      return '';
    };
    const productIdForRow = (row) => Number(row?.querySelector?.('[data-edit-product-id]')?.dataset?.editProductId || 0) || 0;
    const rowForProduct = (id) => Array.from(tableBody.querySelectorAll('tr')).find((row) => productIdForRow(row) === Number(id)) || null;

    function renderedReadiness(row) {
      const node = row?.querySelector?.('.product-readiness-inline');
      if (!node || node.classList.contains('is-unknown')) return { known: false, ready: false, score: null, blocker: '' };
      const strong = text(node.querySelector('strong')?.textContent);
      const scoreMatch = strong.match(/(\d+(?:\.\d+)?)\s*%/);
      const blocker = text(node.querySelector('span')?.textContent);
      return { known: true, ready: /^ready\b/i.test(strong), score: scoreMatch ? Number(scoreMatch[1]) : null, blocker };
    }

    function dimensions(product) {
      const direct = firstText(product, ['dimensions_text','dimension_text','dimensions','size_text','measurement_summary','dimensions_summary','measurements']);
      if (direct) return direct;
      const units = firstText(product, ['dimension_unit','dimensions_unit','measurement_unit','size_unit']) || 'unit';
      const parts = [['L','length'],['W','width'],['H','height'],['D','depth']].map(([label,key]) => {
        const value = Number(product?.[key] ?? product?.[`${key}_value`] ?? product?.[`${key}_cm`]);
        return Number.isFinite(value) && value > 0 ? `${label} ${value}${units === 'unit' ? '' : ` ${units}`}` : '';
      }).filter(Boolean);
      return parts.join(' × ');
    }
    function materials(product) {
      return firstText(product, ['materials_text','material_names_text','materials','material','composition','product_materials','material_summary']);
    }
    function tags(product) {
      const raw = firstText(product, ['keywords','tags','tag_names','seo_keywords','product_tags','search_tags']);
      if (!raw) return [];
      if (raw.startsWith('[')) { try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed.map(text).filter(Boolean); } catch {} }
      return raw.split(/[,;|\n]+/).map(text).filter(Boolean);
    }
    function category(product) {
      return firstText(product, ['product_category','category_name','category_label','category','product_type']);
    }
    function description(product) {
      return firstText(product, ['short_description','description','meta_description']);
    }
    function heroImage(product) {
      return firstText(product, ['featured_image_url','og_image_url','hero_image_url']);
    }
    function inventoryLabel(product) {
      const qty = Number(product?.inventory_quantity || 0);
      if (qty > 0) return `${qty} on hand`;
      if (truthy(product?.made_to_order) || truthy(product?.is_made_to_order)) return 'Made to order';
      if (truthy(product?.allow_backorder) || truthy(product?.backorder_allowed)) return 'Backorder allowed';
      return 'No sellable quantity recorded';
    }
    function fulfilmentLabel(product) {
      return Number(product?.requires_shipping || 0) === 1 ? 'Canada shipping + local pickup' : 'Local pickup';
    }

    function evaluate(product, row) {
      const readiness = renderedReadiness(row);
      const hero = heroImage(product);
      const imageScore = Number(product?.image_quality_score || 0);
      const name = text(product?.name);
      const desc = description(product);
      const dim = dimensions(product);
      const mat = materials(product);
      const tagList = tags(product);
      const cat = category(product);
      const priceCents = Number(product?.price_cents || 0);
      const currency = text(product?.currency || 'CAD').toUpperCase();
      const inventoryQty = Number(product?.inventory_quantity || 0);
      const inventorySellable = inventoryQty > 0 || truthy(product?.made_to_order) || truthy(product?.is_made_to_order) || truthy(product?.allow_backorder) || truthy(product?.backorder_allowed);
      const evidenceOk = readiness.known && Boolean(hero) && String(product?.review_status || '').toLowerCase() !== 'request_changes';
      const checks = {
        hero_image: { ok: Boolean(hero), detail: hero ? 'Hero image assigned' : 'Assign a featured/hero image' },
        image_quality: { ok: imageScore >= 70, detail: imageScore ? `Image quality ${imageScore}%` : 'Image-quality evidence unavailable' },
        title_description: { ok: name.length >= 3 && desc.length >= 40, detail: `${name.length ? 'title present' : 'title missing'} · description ${desc.length} chars` },
        dimensions_materials: { ok: Boolean(dim) && Boolean(mat), detail: `${dim ? 'dimensions present' : 'dimensions missing'} · ${mat ? 'materials present' : 'materials missing'}` },
        price: { ok: priceCents > 0 && currency === 'CAD', detail: priceCents > 0 ? `${(priceCents / 100).toFixed(2)} ${currency}` : 'Price missing' },
        inventory_state: { ok: inventorySellable, detail: inventoryLabel(product) },
        fulfilment: { ok: true, detail: `${fulfilmentLabel(product)} · U.S. sales/shipping disabled` },
        tags_category: { ok: Boolean(cat) && tagList.length > 0, detail: `${cat || 'category missing'} · ${tagList.length} tag${tagList.length === 1 ? '' : 's'}` },
        evidence: { ok: evidenceOk, detail: readiness.known ? `Storefront readiness ${readiness.score ?? 'known'}${readiness.blocker ? ` · ${readiness.blocker}` : ''}` : 'Rendered readiness evidence unavailable' }
      };
      const channels = {};
      for (const [key, channel] of Object.entries(CHANNELS)) {
        const missing = channel.requirements.filter((requirement) => !checks[requirement]?.ok);
        channels[key] = { label: channel.label, ready: missing.length === 0, score: Math.round(((channel.requirements.length - missing.length) / channel.requirements.length) * 100), missing };
      }
      return { checks, channels, facts: { hero_image_url: hero, image_quality_score: imageScore, title: name, description: desc, dimensions: dim, materials: mat, price_cents: priceCents, currency, inventory: inventoryLabel(product), fulfilment: fulfilmentLabel(product), tags: tagList, category: cat, storefront_readiness: readiness } };
    }

    function exportPack(product, evaluation) {
      const productId = Number(product?.product_id || 0);
      return {
        release: 467,
        build: 106,
        kind: 'marketplace_listing_readiness_export_pack',
        generated_at: new Date().toISOString(),
        product: {
          product_id: productId,
          product_number: product?.product_number || productId,
          sku: product?.sku || null,
          slug: product?.slug || null,
          status: product?.status || null,
          review_status: product?.review_status || null,
          ...evaluation.facts
        },
        channels: evaluation.channels,
        checks: Object.fromEntries(Object.entries(evaluation.checks).map(([key,value]) => [key,{ ok:value.ok, detail:value.detail }])),
        commerce_policy: { country: 'CA', currency: 'CAD', us_sales_shipping_enabled: false, local_pickup_supported: true },
        safety: { review_required: true, publication_allowed: false, provider_execution: false, marketplace_publication: false, product_inventory_mutation: false }
      };
    }

    function setStatus(row, message, tone = '') {
      const node = row?.querySelector?.('.marketplace-readiness-status');
      if (node) { node.textContent = message; node.dataset.tone = tone; }
    }
    function fallbackCopy(value) {
      const area = document.createElement('textarea'); area.value = value; area.setAttribute('readonly',''); area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} area.remove(); return ok;
    }
    async function copyPack(product, evaluation, row) {
      const value = JSON.stringify(exportPack(product, evaluation), null, 2); let copied = false;
      try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); copied = true; } } catch {}
      if (!copied) copied = fallbackCopy(value);
      setStatus(row, copied ? 'Listing readiness export pack copied for review.' : 'Copy unavailable. Use Download JSON instead.', copied ? 'green' : 'review');
    }
    function downloadPack(product, evaluation, row) {
      const pack = exportPack(product, evaluation);
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      const number = product?.product_number || product?.product_id || 'product';
      anchor.href = url; anchor.download = `devilndove-DD${number}-marketplace-readiness.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus(row, 'Listing readiness JSON downloaded for review. No marketplace publication occurred.', 'green');
    }

    function renderRow(row, product) {
      const productId = Number(product?.product_id || 0); if (!productId) return;
      const nameCell = row.querySelector('td:nth-child(2)'); if (!nameCell) return;
      const evaluation = evaluate(product, row);
      let panel = nameCell.querySelector('.marketplace-readiness-inline');
      if (!panel) { panel = document.createElement('details'); panel.className = 'marketplace-readiness-inline'; nameCell.appendChild(panel); }
      const channelMarkup = Object.entries(evaluation.channels).map(([key, channel]) => `<span class="marketplace-readiness-pill ${channel.ready ? 'is-ready' : 'is-blocked'}" title="${esc(channel.missing.map((item) => CHECK_LABELS[item] || item).join(', '))}">${esc(channel.label)} ${channel.score}%</span>`).join('');
      const checksMarkup = Object.entries(evaluation.checks).map(([key, check]) => `<li class="${check.ok ? 'is-ready' : 'is-blocked'}"><strong>${check.ok ? '✓' : '!'} ${esc(CHECK_LABELS[key] || key)}</strong> — ${esc(check.detail)}</li>`).join('');
      panel.innerHTML = `<summary>Marketplace readiness <span class="small">review/export only</span></summary><div class="marketplace-readiness-pills">${channelMarkup}</div><ul class="small marketplace-readiness-checks">${checksMarkup}</ul><div class="marketplace-readiness-actions"><button class="btn small" type="button" data-marketplace-readiness-command="copy" data-product-id="${productId}">Copy export pack</button><button class="btn small" type="button" data-marketplace-readiness-command="download" data-product-id="${productId}">Download JSON</button><a class="btn small secondary" href="/admin/catalog/?product_id=${productId}">Edit listing facts</a></div><div class="small marketplace-readiness-status" role="status" aria-live="polite">Publication stays closed; review the pack before using any marketplace.</div>`;
    }

    function render() {
      const products = readSnapshot();
      const byId = new Map(products.map((product) => [Number(product?.product_id || 0), product]));
      for (const row of tableBody.querySelectorAll('tr')) {
        const productId = productIdForRow(row), product = byId.get(productId); if (product) renderRow(row, product);
      }
      if (!document.getElementById('marketplaceListingReadinessStyle')) {
        const style = document.createElement('style'); style.id = 'marketplaceListingReadinessStyle'; style.textContent = '.marketplace-readiness-inline{margin-top:8px;padding:8px 10px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.045)}.marketplace-readiness-inline>summary{cursor:pointer;font-weight:800}.marketplace-readiness-pills,.marketplace-readiness-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.marketplace-readiness-pill{display:inline-flex;padding:4px 7px;border:1px solid var(--border);border-radius:999px;font-size:.78rem}.marketplace-readiness-pill.is-ready,.marketplace-readiness-checks .is-ready{opacity:.95}.marketplace-readiness-pill.is-blocked,.marketplace-readiness-checks .is-blocked{font-weight:700}.marketplace-readiness-checks{margin:8px 0;padding-left:20px;display:grid;gap:3px}.marketplace-readiness-status{margin-top:7px}@media(max-width:720px){.marketplace-readiness-actions .btn{flex:1 1 145px}}'; document.head.appendChild(style);
      }
    }

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-marketplace-readiness-command]'); if (!button) return;
      const productId = Number(button.dataset.productId || 0), row = button.closest('tr'), product = readSnapshot().find((item) => Number(item?.product_id || 0) === productId); if (!row || !product) return;
      const evaluation = evaluate(product, row), command = button.dataset.marketplaceReadinessCommand;
      if (command === 'copy') void copyPack(product, evaluation, row);
      if (command === 'download') downloadPack(product, evaluation, row);
    });
    const observer = new MutationObserver(() => { clearTimeout(renderTimer); renderTimer = setTimeout(render, 80); });
    observer.observe(tableBody, { childList: true, subtree: true });
    window.addEventListener('storage', (event) => { if (event.key === SNAPSHOT_KEY) render(); });
    render();
  });
})();
