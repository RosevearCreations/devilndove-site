// Build 200 / Release 467 Build 76 — renders one published Workshop Journal article safely from the public API.
(() => {
  'use strict';
  const mount = document.querySelector('[data-workshop-journal-story]');
  if (!mount) return;
  const params = new URLSearchParams(location.search);
  const story = String(params.get('story') || '').trim();
  const PRODUCTION_ORIGIN = 'https://devilndove.com';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const md = (value) => {
    const raw = esc(value || '').trim();
    if (!raw) return '<p>Published workshop story copy will appear here after review.</p>';
    return raw.split(/\n{2,}/).map((block) => {
      if (/^###\s+/.test(block)) return `<h3>${block.replace(/^###\s+/, '')}</h3>`;
      if (/^##\s+/.test(block)) return `<h2>${block.replace(/^##\s+/, '')}</h2>`;
      if (/^#\s+/.test(block)) return `<p>${block.replace(/^#\s+/, '')}</p>`;
      if (/^(?:[-*]\s+)/m.test(block)) return `<ul>${block.split('\n').filter(Boolean).map((line) => `<li>${line.replace(/^(?:[-*]\s+)/, '')}</li>`).join('')}</ul>`;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  };
  const setMeta = (selector, value) => {
    if (!value) return;
    document.querySelector(selector)?.setAttribute('content', String(value));
  };
  function safeCanonicalPath(item) {
    const raw = String(item?.canonical_path || '').trim();
    if (!raw.startsWith('/workshop-journal/') || raw.startsWith('//')) return '';
    try {
      const parsed = new URL(raw, PRODUCTION_ORIGIN);
      if (parsed.origin !== PRODUCTION_ORIGIN || !parsed.pathname.startsWith('/workshop-journal/')) return '';
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return '';
    }
  }
  function setMetaForPublishedStory(item) {
    const title = item.meta_title || item.title || 'Workshop Journal story | Devil n Dove';
    const description = item.meta_description || item.summary || '';
    const canonicalPath = safeCanonicalPath(item);
    if (!canonicalPath) return false;
    const canonical = `${PRODUCTION_ORIGIN}${canonicalPath}`;
    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', 'index,follow');
    setMeta('meta[property="og:site_name"]', 'Devil n Dove');
    setMeta('meta[property="og:type"]', 'article');
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[name="twitter:card"]', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    if (item.hero_media_url) {
      setMeta('meta[property="og:image"]', item.hero_media_url);
      setMeta('meta[name="twitter:image"]', item.hero_media_url);
    }
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    const data = document.getElementById('journalStoryStructuredData');
    if (data && item.schema_json) data.textContent = item.schema_json;
    return true;
  }
  async function load() {
    if (!story) { mount.innerHTML = `<div class="content-empty-state"><h2>Choose a workshop story</h2><p>Published finished-project stories are collected in the <a href="/workshop-journal/">Workshop Journal</a>.</p></div>`; return; }
    try {
      const response = await fetch(`/api/workshop-journal?destination=workshop_journal&story=${encodeURIComponent(story)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.item) throw new Error(data?.error || 'This workshop story is not available.');
      const item = data.item;
      if (!setMetaForPublishedStory(item)) throw new Error('This workshop story does not have a valid public canonical path.');
      mount.innerHTML = `<article class="journal-story-card"><header><span class="badge">Finished workshop story</span><h1>${esc(item.title || 'Workshop story')}</h1><p class="journal-story-summary">${esc(item.summary || '')}</p></header>${item.hero_media_url ? `<figure class="journal-story-hero"><img src="${esc(item.hero_media_url)}" alt="${esc(item.hero_alt_text || item.title || 'Devil n Dove workshop story')}"/><figcaption>${esc(item.hero_alt_text || '')}</figcaption></figure>` : `<div class="content-publication-placeholder journal-story-placeholder" aria-hidden="true"><span>✦</span><small>Approved lead image pending</small></div>`}<div class="journal-story-body">${md(item.body_content)}</div><footer class="journal-story-actions">${item.product_path ? `<a class="btn primary" href="${esc(item.product_path)}">View related piece</a>` : ''}<a class="btn secondary" href="/workshop-journal/">More workshop notes</a></footer></article>`;
    } catch (error) { mount.innerHTML = `<div class="content-empty-state"><h2>Story not available</h2><p>${esc(error.message)}</p><a class="btn" href="/workshop-journal/">Back to Workshop Journal</a></div>`; }
  }
  load();
})();