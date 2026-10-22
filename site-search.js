// File: /public/js/site-search.js
// Brief description: public Product + Creations + page discovery only.
// Operational tools, supplies and movie records remain in separately marked reference pages.
// It now degrades more gracefully when one or more live sources are unavailable.

document.addEventListener('DOMContentLoaded', () => {
  const boundary=window.DDSearchBoundary434;
  const inputEl = document.getElementById('siteSearchInput');
  const buttonEl = document.getElementById('siteSearchButton');
  const resetEl = document.getElementById('siteSearchReset');
  const summaryEl = document.getElementById('siteSearchSummary');
  const resultsEl = document.getElementById('siteSearchResults');
  const emptyEl = document.getElementById('siteSearchEmpty');

  const staticPages = [
    { type: 'Page', name: 'Home', summary: 'Handmade jewelry, workshop creations and maker life in Southern Ontario.', url: '/' },
    { type: 'Page', name: 'About Devil n Dove', summary: 'Learn about our workshop, process, and creative projects.', url: '/about/' },
    { type: 'Page', name: 'Shop', summary: 'Shop handmade jewelry, art and digital creations.', url: '/shop/' },
    { type: 'Page', name: 'Gallery', summary: 'Art, jewelry and workshop experiments.', url: '/gallery/' },
    { type: 'Page', name: 'Creations', summary: 'Browse finished creations and featured work.', url: '/creations/' },
    { type: 'Page', name: 'Tools — reference only', summary: 'Workshop equipment we use; not a Devil n Dove checkout listing.', url: '/tools/' },
    { type: 'Page', name: 'Supplies — reference only', summary: 'Materials used in our workshop; not offered for checkout.', url: '/supplies/' },
    { type: 'Page', name: 'Toolshed — reference only', summary: 'Equipment and workroom notes; not a shop listing.', url: '/toolshed/' },
    { type: 'Page', name: 'Movie Shelf', summary: 'Browse our movie collection; this is a reference library, not a shop listing.', url: '/movies/' },
    { type: 'Page', name: 'Contact', summary: 'Questions, custom work and shop help.', url: '/contact/' }
  ];

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function scoreText(query, ...parts) {
    const haystack = parts.join(' ').toLowerCase();
    if (!haystack || !query) return 0;
    let score = 0;
    if (haystack.includes(query)) score += 10;
    for (const token of query.split(/\s+/).filter(Boolean)) {
      if (haystack.includes(token)) score += 3;
    }
    return score;
  }

  async function fetchSearchSource(label, url, extractor, mapper, query) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `${label} search source is unavailable.`);
      if (!boundary?.canShowProduct || !boundary?.canShowResult)
        throw new Error('Search display policy unavailable; no unverified merchandise may be shown.');
      const rows = extractor(data);
      const safeRows = label === 'Products' ? rows.filter(boundary.canShowProduct) :
        label === 'Creations' ? rows : [];
      return { label, items: safeRows.map((row) => mapper(row, query))
        .filter((row) => boundary.canShowResult(row) && (row.score > 0 || !query)), warning: Array.isArray(data?.diagnostics?.warnings) && data.diagnostics.warnings.length ? `${label} is using fallback data.` : '' };
    } catch (error) {
      return { label, items: [], error: error?.message || `${label} search source is unavailable.` };
    }
  }

  function fetchPages(query) {
    return staticPages
      .map((row) => ({ ...row, score: scoreText(query, row.name, row.summary) }))
      .filter((row) => boundary?.canShowResult(row) &&
        (row.score > 0 || (!query && row.url === '/shop/')));
  }

  async function logSearch(term, resultCount) {
    try {
      await fetch('/api/site-search-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_term: term, result_count: resultCount, path: '/search/' })
      });
    } catch {}
  }

  function render(results, query, notice = '') {
    if (!resultsEl || !summaryEl || !emptyEl) return;
    if (!results.length) {
      resultsEl.innerHTML = '';
      emptyEl.style.display = '';
      summaryEl.textContent = query ? `No results found for “${query}”.${notice ? ` ${notice}` : ''}` : 'Enter a search term to begin.';
      return;
    }
    emptyEl.style.display = 'none';
    summaryEl.textContent = `${results.length} result(s) found${query ? ` for “${query}”` : ''}.${notice ? ` ${notice}` : ''}`;
    resultsEl.innerHTML = results.map((row) => `
      <article class="card">
        ${row.image ? `<img src="${escapeHtml(row.image)}" alt="${escapeHtml(row.name)}" style="width:100%;aspect-ratio:16/10;object-fit:contain;border-radius:12px;margin-bottom:12px"/>` : ''}
        <div class="small">${escapeHtml(row.type)}</div>
        <h2 style="font-size:1.05rem;margin:8px 0">${escapeHtml(row.name)}</h2>
        <p class="small" style="min-height:3.2em">${escapeHtml(row.summary || 'No summary available.')}</p>
        ${boundary.resultContext(row) ? `<p class="small" data-search-reference-only="1">${escapeHtml(boundary.resultContext(row))}</p>` : ''}
        <div style="margin-top:12px"><a class="btn" href="${escapeHtml(row.url)}">${escapeHtml(boundary.resultAction(row))}</a></div>
      </article>
    `).join('');
  }

  async function runSearch() {
    const query = String(inputEl?.value || '').trim().toLowerCase();
    if (!query) {
      render([], '');
      return;
    }
    summaryEl.textContent = 'Searching...';

    const sources = await Promise.all([
      fetchSearchSource('Products', `/api/products?q=${encodeURIComponent(query)}`, (data) => Array.isArray(data.products) ? data.products : [], (row, q) => ({
        type: 'Product',
        name: row.name || 'Product',
        summary: row.public_story_snippet || row.short_description || row.meta_description || row.product_type || 'Storefront product',
        url: `/shop/product/?slug=${encodeURIComponent(row.slug || '')}`,
        image: row.featured_image_url || row.og_image_url || '',
        score: scoreText(q, row.name, row.short_description, row.meta_description, row.public_story_heading, row.public_story_summary, row.public_story_snippet, row.keywords, row.product_type)
      }), query),
      fetchSearchSource('Creations', `/api/creations?q=${encodeURIComponent(query)}&limit=250`, (data) => Array.isArray(data.items) ? data.items : [], (row, q) => ({
        type: 'Creation',
        name: row.name || row.title || 'Featured creation',
        summary: [row.section, row.type, row.alt, row.caption, row.description].filter(Boolean).join(' • '),
        url: '/creations/',
        image: row.image || row.image_url || '',
        score: scoreText(q, row.name, row.title, row.section, row.type, row.alt, row.caption, row.description)
      }), query),

    ]);

    const pages = fetchPages(query);
    const results = [...sources.flatMap((source) => source.items), ...pages]
      .filter(row => boundary?.canShowResult(row))
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || String(a.name || '').localeCompare(String(b.name || '')))
      .slice(0, 36);

    const warnings = sources.map((source) => source.warning).filter(Boolean);
    const failures = sources.filter((source) => source.error).map((source) => source.label);
    const noticeParts = [];
    if (warnings.length) noticeParts.push(Array.from(new Set(warnings)).join(' '));
    if (failures.length) noticeParts.push(`Some live sources are unavailable right now: ${Array.from(new Set(failures)).join(', ')}. Static page results are still included.`);

    render(results, query, noticeParts.join(' '));
    logSearch(query, results.length);
  }

  buttonEl?.addEventListener('click', runSearch);
  resetEl?.addEventListener('click', () => {
    if (inputEl) inputEl.value = '';
    render([], '');
  });
  inputEl?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
  });

  const url = new URL(window.location.href);
  const q = String(url.searchParams.get('q') || '').trim();
  if (q && inputEl) {
    inputEl.value = q;
    runSearch();
  }
});
