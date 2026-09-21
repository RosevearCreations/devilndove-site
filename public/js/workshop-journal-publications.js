// Release 467 Build 223 — progressive enhancement for published Workshop Journal case-study richness.
(() => {
  'use strict';
  const mount = document.querySelector('[data-workshop-journal-publications]');
  if (!mount) return;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const short = (value, max = 180) => { const text = String(value || '').replace(/\s+/g, ' ').trim(); return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text; };
  async function load() {
    try {
      const response = await fetch('/api/capability-case-studies?limit=6', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      const items = Array.isArray(data?.items) ? data.items : [];
      if (!items.length) return;
      mount.hidden = false;
      mount.innerHTML = `<div class="section-heading-row"><div><h2>From recently finished projects</h2><p class="small">Real workshop stories appear here only after source media, public-use status, copy, and release checks are reviewed.</p></div></div><div class="workshop-journal-grid workshop-journal-live-grid">${items.map((item) => `<article class="card journal-card journal-live-card"><a class="journal-live-media" href="/workshop-journal/story/?story=${encodeURIComponent(item.publication_slug || '')}">${item.hero_media_url ? `<img src="${esc(item.hero_media_url)}" alt="${esc(item.hero_alt_text || item.title || 'Devil n Dove workshop story')}" loading="lazy"/>` : `<span aria-hidden="true">✦</span>`}</a><div><span class="small content-publication-kind">Published workshop case study</span><h3><a href="/workshop-journal/story/?story=${encodeURIComponent(item.publication_slug || '')}">${esc(item.title || 'Workshop story')}</a></h3><p class="small">${esc(short(item.summary || 'A reviewed Devil n Dove workshop story.'))}</p>${Array.isArray(item.capabilities)&&item.capabilities.length?`<p class="small"><strong>Capabilities:</strong> ${item.capabilities.map((c)=>`<a href="${esc(c.profile_path||'/capabilities/')}">${esc(c.display_name||c.capability_key)}</a>`).join(' · ')}</p>`:''}<div class="journal-live-actions"><a class="btn" href="/workshop-journal/story/?story=${encodeURIComponent(item.publication_slug || '')}">Read story</a>${item.product_path ? `<a class="btn secondary" href="${esc(item.product_path)}">View piece</a>` : ''}</div></div></article>`).join('')}</div><p class="small" style="margin-top:12px"><a href="/case-studies/">Browse all workshop case studies and capability examples</a></p>`;
    } catch { /* keep the static evergreen journal cards */ }
  }
  load();
})();
