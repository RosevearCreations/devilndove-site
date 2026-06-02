// File: /functions/api/trust-blocks.js
// Brief description: Public approved testimonial/trust block API with safe empty fallback.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120'
    }
  });
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function clean(value) {
  return String(value || '').trim();
}

function contextAliases(context) {
  const base = clean(context).toLowerCase() || 'sitewide';
  const aliases = new Set(['sitewide', base]);

  if (base.startsWith('/shop') || base === 'shop') aliases.add('shop');
  if (base.startsWith('/gallery') || base === 'gallery') aliases.add('gallery');
  if (base.startsWith('/collections') || base === 'collections') aliases.add('collections');
  if (base.startsWith('/marketplaces') || base === 'marketplaces') aliases.add('marketplaces');
  if (base.startsWith('/contact') || base === 'contact') aliases.add('contact');
  if (base.startsWith('/about') || base === 'about') aliases.add('about');

  return Array.from(aliases).slice(0, 8);
}

async function tableExists(db, tableName) {
  try {
    return !!(await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1")
      .bind(tableName)
      .first());
  } catch {
    return false;
  }
}

export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  const url = new URL(context.request.url);

  const limit = Math.max(1, Math.min(12, Number(url.searchParams.get('limit') || 4) || 4));
  const contextKey = clean(url.searchParams.get('context') || 'sitewide').toLowerCase() || 'sitewide';
  const itemKind = clean(url.searchParams.get('item_kind') || '').toLowerCase();
  const locality = clean(url.searchParams.get('locality') || '').toLowerCase();
  const productSlug = clean(url.searchParams.get('product_slug') || '').toLowerCase();

  if (!db || !(await tableExists(db, 'trust_block_items'))) {
    return json({
      ok: true,
      authority: 'fallback_empty',
      items: [],
      summary: { item_count: 0 }
    });
  }

  const aliases = contextAliases(contextKey);
  const placeholders = aliases.map(() => '?').join(',');
  const extraWhere = [];
  const extraBindings = [];

  if (itemKind) {
    extraWhere.push("LOWER(COALESCE(item_kind,'')) = ?");
    extraBindings.push(itemKind);
  }

  if (locality) {
    extraWhere.push("LOWER(COALESCE(locality_label,'')) LIKE ?");
    extraBindings.push(`%${locality}%`);
  }

  if (productSlug) {
    extraWhere.push("LOWER(COALESCE(related_product_slug,'')) = ?");
    extraBindings.push(productSlug);
  }

  const itemRows = rows(await db.prepare(`
    SELECT trust_block_item_id, source_product_review_id, item_kind, display_context, title, body, attribution_label,
           rating_label, related_product_slug, related_product_name, locality_label, is_featured, sort_order, updated_at
    FROM trust_block_items
    WHERE status IN ('approved','published')
      AND approved_for_public_use=1
      AND privacy_review_status='cleared'
      AND (display_context IN (${placeholders}) OR display_context='sitewide')
      ${extraWhere.length ? `AND ${extraWhere.join(' AND ')}` : ''}
    ORDER BY is_featured DESC, sort_order ASC, datetime(updated_at) DESC, trust_block_item_id DESC
    LIMIT ?
  `).bind(...aliases, ...extraBindings, limit).all().catch(() => ({ results: [] })));

  return json({
    ok: true,
    authority: 'd1_trust_block_items',
    items: itemRows.map((row) => ({
      trust_block_item_id: Number(row.trust_block_item_id || 0),
      item_kind: row.item_kind || 'testimonial',
      display_context: row.display_context || 'sitewide',
      title: row.title || 'Devil n Dove trust note',
      body: row.body || '',
      attribution_label: row.attribution_label || '',
      rating_label: row.rating_label || '',
      locality_label: row.locality_label || '',
      related_product_slug: row.related_product_slug || '',
      related_product_name: row.related_product_name || '',
      is_featured: Number(row.is_featured || 0)
    })),
    summary: {
      item_count: itemRows.length,
      context: contextKey,
      item_kind: itemKind,
      locality,
      product_slug: productSlug
    }
  });
}
