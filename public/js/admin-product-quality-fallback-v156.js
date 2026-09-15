// Release 467 Build 156 — fail-soft Product Quality Command Center recovery.
// Uses already recovered core Product data only. It performs no API requests and no
// mutations. The full Build 14–15 quality controller may replace this view when its
// readiness and buyer-fact authorities finish resolving.
(() => {
  const path = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (path !== '/admin/products') return;

  const VERSION = 'R467B156_QUALITY_FALLBACK_V1';
  const health = {
    version: VERSION,
    core_event_seen: false,
    fallback_rendered: false,
    product_count: 0,
    last_reason: '',
  };
  window.DDProductQualityFallbackHealth = health;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function mountNeedsFallback(mount) {
    const text = String(mount?.textContent || '').replace(/\s+/g, ' ').trim();
    return !text || /Loading Product Release Quality Command Center/i.test(text);
  }

  function renderFallback(products, reason = 'core-products-ready') {
    const mount = document.getElementById('productQualityCommandCenterMount');
    if (!mount || !mountNeedsFallback(mount)) return false;
    const rows = Array.isArray(products) ? products : [];
    const active = rows.filter((row) => String(row?.status || '').toLowerCase() === 'active').length;
    const draft = rows.filter((row) => String(row?.status || '').toLowerCase() === 'draft').length;
    const archived = rows.filter((row) => String(row?.status || '').toLowerCase() === 'archived').length;
    health.fallback_rendered = true;
    health.product_count = rows.length;
    health.last_reason = String(reason || 'core-products-ready');
    const data = mount.dataset;
    data.ddQualityFallback = VERSION;
    mount.innerHTML = `<section class="card" style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <p class="eyebrow">Release 467 Builds 14–15</p>
          <h2 style="margin:0">Product Release Quality Command Center</h2>
          <p class="small" style="max-width:900px">Core Product authority is ready. Detailed readiness, buyer-fact, SEO, image, and marketplace checks are resolving independently so they cannot block Product editing.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start">
          <a class="btn" href="/admin/readiness/">Full preflight</a>
          <a class="btn" href="/admin/marketplace-readiness/">Marketplace readiness</a>
        </div>
      </div>
      <div class="grid cols-4" style="gap:10px;margin-top:14px">
        <div class="card" style="padding:12px"><strong style="font-size:1.35rem">${escapeHtml(rows.length)}</strong><div>Products available</div><div class="small">Core Product authority</div></div>
        <div class="card" style="padding:12px"><strong style="font-size:1.35rem">${escapeHtml(active)}</strong><div>Active</div><div class="small">Current Product status</div></div>
        <div class="card" style="padding:12px"><strong style="font-size:1.35rem">${escapeHtml(draft)}</strong><div>Draft</div><div class="small">Current Product status</div></div>
        <div class="card" style="padding:12px"><strong style="font-size:1.35rem">${escapeHtml(archived)}</strong><div>Archived</div><div class="small">Current Product status</div></div>
      </div>
      <div class="status-note info" style="margin-top:12px"><strong>Essential Product work is available.</strong><br>The full quality ranking will replace this fail-soft summary automatically when its secondary evidence finishes. No quality result is invented or marked complete here.</div>
    </section>`;
    return true;
  }

  document.addEventListener('dd:products-core-recovered', (event) => {
    health.core_event_seen = true;
    renderFallback(event?.detail?.products || [], event?.detail?.source || 'core-products-ready');
  });

  // Covers cached/core rows that were recovered before this listener observed the event.
  const reconcile = () => {
    window.setTimeout(() => {
      const count = document.querySelectorAll('#productsTableBody [data-edit-product-id]').length;
      if (!count) return;
      renderFallback([], 'existing-core-rows');
    }, 1500);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  else reconcile();
})();
