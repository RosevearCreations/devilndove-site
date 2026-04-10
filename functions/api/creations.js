// File: /functions/api/creations.js
// Brief description: Public read endpoint for finished creations. It prefers D1 catalog_items
// records for item_kind=creation and falls back to the current JSON source so public pages,
// search, and fallback handling share one centralized data path during migration.

import { captureRuntimeIncident } from "./_lib/adminAudit.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

function normalizeText(value) { return String(value || '').trim(); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
function slugify(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

function normalizeCreationFromCatalog(row) {
  let source = {};
  try { source = row.source_record_json ? JSON.parse(row.source_record_json) : {}; } catch { source = {}; }
  return Object.assign({}, source, {
    id: source.id || row.source_key || row.catalog_item_id,
    name: row.name || source.name || source.title || 'Creation',
    title: row.name || source.title || source.name || 'Creation',
    slug: row.slug || source.slug || slugify(row.name || source.name || source.title || 'creation'),
    section: row.category || source.section || 'Featured creation',
    category: row.category || source.category || source.section || 'Featured creation',
    type: row.subcategory || row.item_type || source.type || source.subcategory || '',
    subcategory: row.subcategory || source.subcategory || row.item_type || source.type || '',
    image: row.image_url || source.image || source.image_url || source.src || '',
    image_url: row.image_url || source.image || source.image_url || source.src || '',
    description: row.short_description || source.description || '',
    caption: row.notes || source.caption || source.description || source.alt || '',
    notes: row.notes || source.notes || '',
    material: source.material || source.materials || '',
    materials: Array.isArray(source.materials) ? source.materials : (normalizeText(source.material) ? [normalizeText(source.material)] : []),
    tags: Array.isArray(source.tags) ? source.tags : [],
    updated_at: row.updated_at || null,
    source: 'catalog_items'
  });
}

async function loadJsonFallback(request) {
  try {
    const response = await fetch(new URL('/data/itemsforsale/itemsforsale_items_master.json', request.url).toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
    if (!response.ok) return { items: [], error: `Fallback responded ${response.status}.` };
    const data = await response.json().catch(() => null);
    const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
    return {
      items: items.map((item, index) => Object.assign({}, item, {
        id: item.id || item.slug || `${slugify(item.name || item.title || 'creation')}-${index + 1}`,
        name: item.name || item.title || `Creation ${index + 1}`,
        title: item.title || item.name || `Creation ${index + 1}`,
        slug: item.slug || slugify(item.name || item.title || `creation-${index + 1}`),
        image: item.image || item.image_url || item.src || '',
        image_url: item.image || item.image_url || item.src || '',
        source: 'json'
      })),
      error: ''
    };
  } catch (error) {
    return { items: [], error: error?.message || 'Fallback load failed.' };
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB || env.DD_DB;
  const url = new URL(request.url);
  const query = normalizeText(url.searchParams.get('q')).toLowerCase();
  const like = `%${query}%`;
  const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 250), 500));
  const warnings = [];
  let items = [];
  let authority = 'empty';

  if (db) {
    try {
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
      `).bind(query, like, like, like, like, like, like, limit).all());
      items = rows.map(normalizeCreationFromCatalog);
      if (items.length) authority = 'd1';
    } catch (error) {
      warnings.push('d1_creation_read_failed');
      await captureRuntimeIncident(env, request, {
        incident_scope: 'public_catalog',
        incident_code: 'creations_d1_read_failed',
        severity: 'warning',
        message: 'Creations D1 read failed. Public JSON fallback was used.',
        details: { error: error?.message || 'Unknown D1 error.', query, limit }
      });
    }
  } else {
    warnings.push('d1_binding_unavailable');
  }

  if (!items.length) {
    const fallback = await loadJsonFallback(request);
    if (fallback.items.length) {
      items = query
        ? fallback.items.filter((item) => JSON.stringify(item).toLowerCase().includes(query)).slice(0, limit)
        : fallback.items.slice(0, limit);
      authority = items.length ? 'json_fallback' : authority;
      if (authority === 'json_fallback') warnings.push('json_fallback_used');
    } else if (fallback.error) {
      warnings.push('json_fallback_unavailable');
      await captureRuntimeIncident(env, request, {
        incident_scope: 'public_catalog',
        incident_code: 'creations_json_fallback_failed',
        severity: 'error',
        message: 'Creations JSON fallback could not be loaded.',
        details: { error: fallback.error, query, limit }
      });
    }
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
    asset_origin: 'https://assets.devilndove.com',
    asset_prefix: 'itemsforsale',
    items,
    fallback_used: authority === 'json_fallback',
    diagnostics: { warnings, query, limit },
    summary: {
      total_items: items.length,
      query,
      authority
    },
    filter_groups
  });
}
