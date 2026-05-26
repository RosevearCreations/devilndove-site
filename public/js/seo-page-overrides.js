// File: /public/js/seo-page-overrides.js
// Brief description: Applies reviewed SEO page overrides from D1 as a graceful client-side enhancement.

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
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch(`/api/seo-page-overrides?path=${encodeURIComponent(location.pathname)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      const override = data?.override || null;
      if (!response.ok || !data?.ok || !override) return;
      if (override.title) document.title = override.title;
      if (override.meta_description) ensureMetaDescription(override.meta_description);
      if (override.internal_link_note) insertInternalLinkNote(override.internal_link_note);
    } catch (_error) {}
  });
})();
