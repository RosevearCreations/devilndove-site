// File: /functions/api/creations.js
// Brief description: Public read endpoint for finished creations. It prefers D1 catalog_items
// records for item_kind=creation and falls back to the current JSON source so public pages and
// site search share one centralized data path during migration.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' }
  });
}

function normalizeText(value) { return String(value || '').trim(); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
function slugify(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

function normalizeMaterials(source) {
  if (Array.isArray(source?.materials)) return source.materials.filter(Boolean).map((value) => normalizeText(value));
  const single = normalizeText(source?.material || source?.materials || '');
  return single ? [single] : [];
}

function normalizeCreationFromCatalog(row) {
  let source = {};
  try { source = row.source_record_json ? JSON.parse(row.source_record_json) : {}; } catch { source = {}; }
  const title = row.name || source.title || source.name || 'Creation';
  const materials = normalizeMaterials(source);
  return Object.assign({}, source, {
    id: source.id || row.source_key || row.catalog_item_id,
    title,
    name: title,
    slug: row.slug || source.slug || slugify(title || 'creation'),
    section: row.category || source.section || 'Featured creation',
    category: row.category || source.category || source.section || 'Featured creation',
    type: row.subcategory || row.item_type || source.type || '',
    subcategory: row.subcategory || source.subcategory || source.type || '',
    item_type: row.item_type || source.item_type || source.type || '',
    image: row.image_url || source.image || source.image_url || source.src || '',
    image_url: row.image_url || source.image || source.image_url || source.src || '',
    description: row.short_description || source.description || source.summary || '',
    summary: source.summary || row.short_description || source.description || '',
    caption: row.notes || source.caption || source.description || source.alt || '',
    notes: row.notes || source.notes || '',
    materials,
    material: materials[0] || '',
    tags: Array.isArray(source.tags) ? source.tags : [],
    status: normalizeText(source.status || 'active') || 'active',
    shop_url: normalizeText(source.shop_url || ''),
    updated_at: row.updated_at || null,
    source: 'catalog_items'
  });
}

async function loadJsonFallback(request) {
  try {
    const response = await fetch(new URL('/data/itemsforsale/itemsforsale_items_master.json', request.url).toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
    if (!response.ok) return [];
    const data = await response.json().catch(() => null);
    const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
    return items.map((item, index) => {
      const title = item.title || item.name || `Creation ${index + 1}`;
      const materials = normalizeMaterials(item);
      return Object.assign({}, item, {
        id: item.id || item.slug || `${slugify(title)}-${index + 1}`,
        title,
        name: title,
        slug: item.slug || slugify(title || `creation-${index + 1}`),
        image: item.image || item.image_url || item.src || '',
        image_url: item.image || item.image_url || item.src || '',
        materials,
        material: materials[0] || '',
        category: item.category || item.section || 'Featured creation',
        status: normalizeText(item.status || 'active') || 'active',
        source: 'json'
      });
    });
  } catch {
    return [];
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB || env.DD_DB;
  const url = new URL(request.url);
  const query = normalizeText(url.searchParams.get('q')).toLowerCase();
  const like = `%${query}%`;
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 250), 500));

  let items = [];
  if (db) {
    const rows = normalizeResults(await db.prepare(`
      SELECT catalog_item_id, source_key, slug, name, category, subcategory, item_type, short_description,
             notes, image_url, source_record_json, updated_at
      FROM catalog_items
      WHERE item_kind = 'creation'
        AND COALESCE(visible_public, 1) = 1
        AND COALESCE(status, 'active') = 'active'
        AND (
          ? = ''
          OR LOWER(COALESCE(name, '')) LIKE ?
          OR LOWER(COALESCE(category, '')) LIKE ?
          OR LOWER(COALESCE(subcategory, '')) LIKE ?
          OR LOWER(COALESCE(item_type, '')) LIKE ?
          OR LOWER(COALESCE(short_description, '')) LIKE ?
          OR LOWER(COALESCE(notes, '')) LIKE ?
        )
      ORDER BY COALESCE(sort_order, 0) ASC, LOWER(COALESCE(name, '')) ASC
      LIMIT ?
    `).bind(query, like, like, like, like, like, like, limit).all().catch(() => ({ results: [] })));
    items = rows.map(normalizeCreationFromCatalog);
  }

  if (!items.length) {
    const fallback = await loadJsonFallback(request);
    items = query
      ? fallback.filter((item) => JSON.stringify(item).toLowerCase().includes(query)).slice(0, limit)
      : fallback.slice(0, limit);
  }

  const filter_groups = {
    categories: Object.entries(items.reduce((acc, item) => {
      const key = normalizeText(item.category || item.section || '').trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label)),
    types: Object.entries(items.reduce((acc, item) => {
      const key = normalizeText(item.subcategory || item.type || item.item_type || '').trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label))
  };

  return json({
    ok: true,
    items,
    summary: {
      total_items: items.length,
      query,
      authority: items[0]?.source === 'catalog_items' ? 'd1' : 'json_fallback'
    },
    asset_origin: 'https://assets.devilndove.com',
    asset_prefix: 'itemsforsale',
    filter_groups
  });
}
