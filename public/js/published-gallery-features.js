// Build 200 — progressive enhancement for review-approved website gallery features.
(() => {
  'use strict';
  const mount = document.querySelector('[data-published-gallery-features]');
  if (!mount) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const short = (value, max = 155) => { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text; };
  async function load() {
    try {
      const response = await fetch('/api/workshop-journal?destination=website_gallery&limit=6', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      const items = Array.isArray(data?.items) ? data.items : [];
      if (!items.length) return;
      mount.hidden = false;
      mount.innerHTML = `<div class="section-head"><div><h2>Approved finished-project gallery</h2><p class="small">These are public only after media, title, description, source approval, and release checks pass.</p></div><a class="btn secondary" href="/workshop-journal/">Workshop stories</a></div><div class="published-gallery-grid">${items.map((item) => `<article class="published-gallery-card" id="project-${esc(item.publication_slug || '')}">${item.hero_media_url ? `<img src="${esc(item.hero_media_url)}" alt="${esc(item.hero_alt_text || item.title || 'Devil n Dove finished project')}" loading="lazy"/>` : `<div class="content-publication-placeholder" aria-hidden="true"><span>✦</span><small>Approved visual pending</small></div>`}<div><h3>${esc(item.title || 'Finished project')}</h3><p>${esc(short(item.summary || item.meta_description || 'A reviewed workshop project.'))}</p><div class="published-gallery-actions">${item.product_path ? `<a class="btn" href="${esc(item.product_path)}">View piece</a>` : ''}<a class="btn secondary" href="${esc(item.related_story_path || '/workshop-journal/')}">${item.related_story_path ? 'Read workshop story' : 'Workshop Journal'}</a></div></div></article>`).join('')}</div>`;
    } catch { /* preserve existing gallery content if public endpoint is unavailable */ }
  }
  load();
})();
