// File: /public/js/seo-page-overrides.js
// Brief description: Applies reviewed SEO page overrides from D1, with a static JSON fallback for deploy-baked review flows.

(function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function ensureMetaDescription(text) {
    if (!text) return;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', text);
  }
  function insertInternalLinkNote(note) {
    if (!note || document.getElementById('seoPageOverrideNote')) return;
    const container = document.querySelector('.container') || document.body;
    const footer = container.querySelector('footer.footer, .footer');
    if (!container || !footer) return;
    const section = document.createElement('section');
    section.id = 'seoPageOverrideNote';
    section.className = 'card seo-page-override-note';
    section.style.marginTop = '18px';
    section.innerHTML = `<h2 style="margin-top:0">Helpful links and browsing notes</h2><p class="small">${esc(note)}</p>`;
    container.insertBefore(section, footer);
  }
  function findStaticOverride(data) {
    const path = location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`;
    const list = Array.isArray(data?.overrides) ? data.overrides : [];
    return list.find((row) => {
      const rowPath = String(row.path || row.page_path || '').trim();
      const normalized = rowPath.endsWith('/') ? rowPath : `${rowPath}/`;
      const status = String(row.status || row.review_status || 'approved').toLowerCase();
      return normalized === path && ['approved', 'applied', 'published'].includes(status);
    }) || null;
  }
  function applyOverride(override) {
    if (!override) return false;
    const title = override.title || override.approved_title || '';
    const meta = override.meta_description || override.approved_meta_description || '';
    const note = override.internal_link_note || override.approved_internal_link_note || '';
    if (title) document.title = title;
    if (meta) ensureMetaDescription(meta);
    if (note) insertInternalLinkNote(note);
    return Boolean(title || meta || note);
  }
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch(`/api/seo-page-overrides?path=${encodeURIComponent(location.pathname)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok && applyOverride(data.override || null)) return;
    } catch (_error) {}
    try {
      const fallback = await fetch('/data/site/seo-page-overrides.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null));
      applyOverride(findStaticOverride(fallback));
    } catch (_error) {}
  });
})();
