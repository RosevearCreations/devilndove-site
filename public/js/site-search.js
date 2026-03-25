// File: /public/js/site-search.js
// Brief description: Public site search across storefront products, tools, supplies,
// featured creations, and key landing pages with lightweight analytics logging.

document.addEventListener('DOMContentLoaded', () => {
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
    { type: 'Page', name: 'Tools', summary: 'Workshop tools we use at Devil n Dove.', url: '/tools/' },
    { type: 'Page', name: 'Supplies', summary: 'Workshop supplies and consumables we use.', url: '/supplies/' },
    { type: 'Page', name: 'Toolshed', summary: 'Workshop gear, notes, and duplicate tool references.', url: '/toolshed/' },
    { type: 'Page', name: 'Movies', summary: 'Movies, nostalgia and favourite picks.', url: '/movies/' },
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

  async function fetchProducts(query) {
    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) return [];
      return (Array.isArray(data.products) ? data.products : []).map((row) => ({
        type: 'Product',
        name: row.name || 'Product',
        summary: row.short_description || row.meta_description || row.product_type || 'Storefront product',
        url: `/shop/product/?slug=${encodeURIComponent(row.slug || '')}`,
        image: row.featured_image_url || row.og_image_url || '',
        score: scoreText(query, row.name, row.short_description, row.meta_description, row.keywords, row.product_type)
      })).filter((row) => row.score > 0 || !query);
    } catch {
      return [];
    }
  }

  async function fetchJson(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  async function fetchCatalogItems(itemKind, typeLabel, urlPath, query) {
    try {
      const response = await fetch(`/api/catalog-items?item_kind=${encodeURIComponent(itemKind)}&q=${encodeURIComponent(query)}&limit=250`);
      const data = await response.json();
      if (!response.ok || !data?.ok) return [];
      const rows = Array.isArray(data.items) ? data.items : [];
      return rows.map((row) => ({
        type: typeLabel,
        name: row.name || `${typeLabel} item`,
        summary: [row.category, row.subcategory, row.short_description, row.notes].filter(Boolean).join(' • '),
        url: urlPath,
        image: row.image_url || '',
        score: scoreText(query, row.name, row.brand, row.category, row.subcategory, row.item_type, row.short_description, row.notes)
      })).filter((row) => row.score > 0 || !query);
    } catch {
      return [];
    }
  }

  async function fetchTools(query) {
    const migrated = await fetchCatalogItems('tool', 'Tool', '/tools/', query);
    if (migrated.length) return migrated;
    const rows = await fetchJson('/data/toolshed/toolshed_items_master.json');
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      type: 'Tool',
      name: row.item_name_suggested || row.brand_guess || 'Workshop tool',
      summary: [row.category, row.notes, row.location_zone, row.location_shelf].filter(Boolean).join(' • '),
      url: '/tools/',
      score: scoreText(query, row.item_name_suggested, row.brand_guess, row.category, row.notes, row.location_zone, row.location_shelf)
    })).filter((row) => row.score > 0);
  }

  async function fetchSupplies(query) {
    const migrated = await fetchCatalogItems('supply', 'Supply', '/supplies/', query);
    if (migrated.length) return migrated;
    const rows = await fetchJson('/data/supplies/supplies_items_master.json');
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      type: 'Supply',
      name: row.item_name_suggested || row.consumable_type || 'Workshop supply',
      summary: [row.consumable_type, row.process_tags, row.notes, row.storage_location].filter(Boolean).join(' • '),
      url: '/supplies/',
      score: scoreText(query, row.item_name_suggested, row.consumable_type, row.process_tags, row.notes, row.storage_location)
    })).filter((row) => row.score > 0);
  }

  async function fetchCreations(query) {
    const migrated = await fetchCatalogItems('creation', 'Creation', '/creations/', query);
    if (migrated.length) return migrated;
    const data = await fetchJson('/data/site/featured-items.json');
    const rows = Array.isArray(data?.items) ? data.items : [];
    return rows.map((row) => ({
      type: 'Creation',
      name: row.name || 'Featured creation',
      summary: [row.section, row.type, row.alt].filter(Boolean).join(' • '),
      url: '/creations/',
      image: row.image || '',
      score: scoreText(query, row.name, row.section, row.type, row.alt)
    })).filter((row) => row.score > 0);
  }

  function fetchPages(query) {
    return staticPages.map((row) => ({ ...row, score: scoreText(query, row.name, row.summary) }))
      .filter((row) => row.score > 0 || (!query && row.url === '/shop/'));
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

  function render(results, query) {
    if (!resultsEl || !summaryEl || !emptyEl) return;
    if (!results.length) {
      resultsEl.innerHTML = '';
      emptyEl.style.display = '';
      summaryEl.textContent = query ? `No results found for “${query}”.` : 'Enter a search term to begin.';
      return;
    }
    emptyEl.style.display = 'none';
    summaryEl.textContent = `${results.length} result(s) found${query ? ` for “${query}”` : ''}.`;
    resultsEl.innerHTML = results.map((row) => `
      <article class="card">
        ${row.image ? `<img src="${escapeHtml(row.image)}" alt="${escapeHtml(row.name)}" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:12px;margin-bottom:12px"/>` : ''}
        <div class="small">${escapeHtml(row.type)}</div>
        <h2 style="font-size:1.05rem;margin:8px 0">${escapeHtml(row.name)}</h2>
        <p class="small" style="min-height:3.2em">${escapeHtml(row.summary || 'No summary available.')}</p>
        <div style="margin-top:12px"><a class="btn" href="${escapeHtml(row.url)}">Open</a></div>
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
    const [products, tools, supplies, creations] = await Promise.all([
      fetchProducts(query),
      fetchTools(query),
      fetchSupplies(query),
      fetchCreations(query)
    ]);
    const pages = fetchPages(query);
    const results = [...products, ...tools, ...supplies, ...creations, ...pages]
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || String(a.name || '').localeCompare(String(b.name || '')))
      .slice(0, 36);
    render(results, query);
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
