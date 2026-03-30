// File: /functions/api/supplies.js
// Brief description: Public read endpoint for supplies. It prefers D1 catalog_items rows for
// item_kind='supply' and falls back to the legacy JSON source so outward-facing pages and search share
// one centralized authority path during migration.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' }
  });
}

function normalizeText(value) { return String(value || '').trim(); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
function slugify(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

function normalizeFromCatalog(row) {
  let source = {};
  try { source = row.source_record_json ? JSON.parse(row.source_record_json) : {}; } catch { source = {}; }
  const rawName = row.name || source.item_name_suggested || source.name || source.display_name || source.title || source.example_image_file || 'Supply';
  return Object.assign({}, source, {
    id: source.id || row.source_key || row.catalog_item_id,
    slug: row.slug || source.slug || slugify(rawName),
    item_name_suggested: source.item_name_suggested || rawName,
    name: rawName,
    category: row.category || source.category || source.consumable_type || '',
    notes: row.notes || source.notes || source.notes_public || source.how_we_use || '',
    image_url: row.image_url || source.image_url || source.image || source.src || '',
    source_key: row.source_key || source.source_key || '',
    updated_at: row.updated_at || null,
    source: 'catalog_items'
  });
}

async function loadJsonFallback(request) {
  try {
    const response = await fetch(new URL('/data/supplies/supplies_items_master.json', request.url).toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
    if (!response.ok) return [];
    const data = await response.json().catch(() => null);
    const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
    return items.map((item, index) => Object.assign({}, item, {
      id: item.id || item.item_group_key_strict || item.item_group_key_loose || item.slug || `${slugify(item.item_name_suggested || item.name || 'supply')}-${index + 1}`,
      slug: item.slug || slugify(item.item_name_suggested || item.name || item.example_image_file || 'supply'),
      image_url: item.image_url || item.image || item.src || '',
      source: 'json'
    }));
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
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 500), 1000));

  let items = [];
  if (db) {
    const rows = normalizeResults(await db.prepare(`
      SELECT catalog_item_id, source_key, slug, name, category, subcategory, item_type, short_description,
             notes, image_url, amazon_url, source_record_json, updated_at
      FROM catalog_items
      WHERE item_kind = 'supply'
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
    items = rows.map(normalizeFromCatalog);
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
    filter_groups
  });
}
