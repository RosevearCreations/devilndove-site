// File: /functions/api/admin/catalog-sync.js
// Brief description: Seeds D1 catalog_items records from existing JSON collections for tools,
// supplies, and featured creations, and movies. This begins the staged migration away from duplicated static
// JSON-only search and inventory sources.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(`
    SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();

  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') {
    return null;
  }

  return {
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || '',
    display_name: session.display_name || ''
  };
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildImageUrl(origin, folder, fileName, rawKey) {
  const key = normalizeText(rawKey) || [folder, normalizeText(fileName)].filter(Boolean).join('/');
  if (!key) return '';
  const encoded = key.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${origin}/${encoded}`;
}

async function fetchJsonFromSite(request, path, strict = true) {
  const url = new URL(path, request.url);
  const response = await fetch(url.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
  if (!response.ok) { if (strict) throw new Error(`Failed to fetch ${path}.`); return null; }
  return response.json().catch(() => (strict ? Promise.reject(new Error(`Invalid JSON at ${path}.`)) : null));
}

function mapToolRow(row, index) {
  const name = normalizeText(row.item_name_suggested || row.name || row.example_image_file) || `Tool ${index + 1}`;
  const area = normalizeText(row.primary_area || row.area || 'Workshop Basics');
  const category = normalizeText(row.category || row.tool_category || 'Uncategorized');
  const sourceKey = normalizeText(row.item_group_key_strict || row.r2_object_key || row.example_image_file || `${slugify(name)}-${index + 1}`);
  return {
    item_kind: 'tool',
    source_key: sourceKey,
    slug: slugify(name),
    name,
    brand: normalizeText(row.brand_guess || row.brand),
    category,
    subcategory: area,
    item_type: normalizeText(row.tool_type || ''),
    short_description: [area, category].filter(Boolean).join(' • '),
    notes: normalizeText(row.how_we_use || row.notes_public || row.notes),
    image_url: buildImageUrl('https://assets.devilndove.com', 'Toolshed', row.example_image_file || row.image_file, row.r2_object_key),
    r2_object_key: normalizeText(row.r2_object_key || ['Toolshed', normalizeText(row.example_image_file)].filter(Boolean).join('/')),
    amazon_url: normalizeText(row.amazon_url || row.amazon_search_url || row.amazon_search),
    storage_location: [row.location_zone, row.location_shelf, row.location_bin].map(normalizeText).filter(Boolean).join(' / '),
    quantity_on_hand: Number(row.quantity_owned || 0) || 0,
    reorder_point: 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: '/data/toolshed/toolshed_items_master.json'
  };
}

function mapSupplyRow(row, index) {
  const name = normalizeText(row.item_name_suggested || row.example_image_file) || `Supply ${index + 1}`;
  const type = normalizeText(row.consumable_type || 'Workshop supply');
  const sourceKey = normalizeText(row.item_group_key_strict || row.r2_object_key || row.example_image_file || `${slugify(name)}-${index + 1}`);
  return {
    item_kind: 'supply',
    source_key: sourceKey,
    slug: slugify(name),
    name,
    brand: normalizeText(row.brand_guess || row.brand),
    category: type,
    subcategory: normalizeText(row.primary_area || ''),
    item_type: type,
    short_description: [type, normalizeText(row.primary_area)].filter(Boolean).join(' • '),
    notes: normalizeText(row.notes),
    image_url: buildImageUrl('https://assets.devilndove.com', 'Supplies', row.example_image_file || row.image_file, row.r2_object_key),
    r2_object_key: normalizeText(row.r2_object_key || ['Supplies', normalizeText(row.example_image_file)].filter(Boolean).join('/')),
    amazon_url: normalizeText(row.amazon_url || row.amazon_search_url),
    storage_location: normalizeText(row.storage_location),
    quantity_on_hand: Number(row.on_hand_qty || 0) || 0,
    reorder_point: Number(row.reorder_point || 0) || 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: '/data/supplies/supplies_items_master.json'
  };
}


function mapMovieRow(row, index) {
  const upc = normalizeText(row.upc || row.UPC || row.barcode || row.code);
  const title = normalizeText(row.title || row.name || row.movie_title || (upc ? `Movie ${upc}` : `Movie ${index + 1}`));
  const sourceKey = upc || normalizeText(row.slug || `${slugify(title)}-${index + 1}`);
  return {
    item_kind: 'movie',
    source_key: sourceKey,
    slug: slugify(title || upc),
    name: title || upc || `Movie ${index + 1}`,
    brand: normalizeText(row.studio_name || row.studio),
    category: normalizeText(row.genre || 'Movie'),
    subcategory: normalizeText(row.media_format || row.format || ''),
    item_type: 'movie',
    short_description: normalizeText(row.summary || row.description || row.plot_summary || row.synopsis || (upc ? `UPC ${upc}` : 'Movie catalog item')),
    notes: normalizeText(row.director_names || row.actor_names || row.director || row.actors || row.notes),
    image_url: normalizeText(row.front_image_url || row.image_front || row.image || row.cover_front),
    r2_object_key: normalizeText(row.front_r2_object_key || row.r2_object_key),
    amazon_url: normalizeText(row.amazon_url),
    storage_location: normalizeText(row.storage_location),
    quantity_on_hand: Number(row.quantity_on_hand || 1) || 1,
    reorder_point: 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: '/data/catalog.json'
  };
}

function mapCreationRow(row, index) {
  const name = normalizeText(row.name || row.title) || `Creation ${index + 1}`;
  const image = normalizeText(row.image || row.image_url || row.src);
  const sourceKey = normalizeText(row.id || row.slug || image || `${slugify(name)}-${index + 1}`);
  return {
    item_kind: 'creation',
    source_key: sourceKey,
    slug: slugify(row.slug || name),
    name,
    brand: '',
    category: normalizeText(row.section || 'Featured creation'),
    subcategory: normalizeText(row.type || ''),
    item_type: normalizeText(row.type || ''),
    short_description: [normalizeText(row.section), normalizeText(row.type), normalizeText(row.alt)].filter(Boolean).join(' • '),
    notes: normalizeText(row.caption || row.description || row.alt),
    image_url: image,
    r2_object_key: '',
    amazon_url: '',
    storage_location: '',
    quantity_on_hand: 0,
    reorder_point: 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: '/data/site/featured-items.json'
  };
}

async function upsertCatalogRows(env, rows) {
  let upserted = 0;
  for (const row of rows) {
    await env.DB.prepare(`
      INSERT INTO catalog_items (
        item_kind, source_key, slug, name, brand, category, subcategory, item_type,
        short_description, notes, image_url, r2_object_key, amazon_url, storage_location,
        quantity_on_hand, reorder_point, visible_public, status, sort_order,
        source_record_json, source_json_path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(item_kind, source_key) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        brand = excluded.brand,
        category = excluded.category,
        subcategory = excluded.subcategory,
        item_type = excluded.item_type,
        short_description = excluded.short_description,
        notes = excluded.notes,
        image_url = excluded.image_url,
        r2_object_key = excluded.r2_object_key,
        amazon_url = excluded.amazon_url,
        storage_location = excluded.storage_location,
        quantity_on_hand = excluded.quantity_on_hand,
        reorder_point = excluded.reorder_point,
        sort_order = excluded.sort_order,
        source_record_json = excluded.source_record_json,
        source_json_path = excluded.source_json_path,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      row.item_kind,
      row.source_key,
      row.slug || null,
      row.name,
      row.brand || null,
      row.category || null,
      row.subcategory || null,
      row.item_type || null,
      row.short_description || null,
      row.notes || null,
      row.image_url || null,
      row.r2_object_key || null,
      row.amazon_url || null,
      row.storage_location || null,
      Number(row.quantity_on_hand || 0),
      Number(row.reorder_point || 0),
      Number(row.sort_order || 0),
      row.source_record_json || null,
      row.source_json_path || null
    ).run();
    upserted += 1;
  }
  return upserted;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body = {};
  try { body = await request.json(); } catch {}
  const selectedKinds = Array.isArray(body.item_kinds) && body.item_kinds.length
    ? body.item_kinds.map((value) => normalizeText(value).toLowerCase()).filter(Boolean)
    : ['tool', 'supply', 'creation', 'movie'];

  const summary = [];
  let totalUpserted = 0;

  if (selectedKinds.includes('tool')) {
    const rows = await fetchJsonFromSite(request, '/data/toolshed/toolshed_items_master.json');
    const mapped = (Array.isArray(rows) ? rows : []).map(mapToolRow);
    const upserted = await upsertCatalogRows(env, mapped);
    totalUpserted += upserted;
    summary.push({ item_kind: 'tool', fetched: mapped.length, upserted });
  }

  if (selectedKinds.includes('supply')) {
    const rows = await fetchJsonFromSite(request, '/data/supplies/supplies_items_master.json');
    const mapped = (Array.isArray(rows) ? rows : []).map(mapSupplyRow);
    const upserted = await upsertCatalogRows(env, mapped);
    totalUpserted += upserted;
    summary.push({ item_kind: 'supply', fetched: mapped.length, upserted });
  }


  if (selectedKinds.includes('movie')) {
    const rows = await fetchJsonFromSite(request, '/data/catalog.json');
    const enriched = await fetchJsonFromSite(request, '/data/movies/movie_catalog_enriched.json', false);
    const enrichedItems = Array.isArray(enriched?.items) ? enriched.items : [];
    const mergedByKey = new Map();
    for (const row of (Array.isArray(rows?.items) ? rows.items : [])) {
      const key = normalizeText(row.upc || row.UPC || row.barcode || row.code || row.slug);
      mergedByKey.set(key || String(mergedByKey.size + 1), { ...row });
    }
    for (const row of enrichedItems) {
      const key = normalizeText(row.upc || row.UPC || row.barcode || row.code || row.slug);
      const existing = mergedByKey.get(key || '') || {};
      mergedByKey.set(key || String(mergedByKey.size + 1), { ...existing, ...row, upc: key || existing.upc || '' });
    }
    const mapped = Array.from(mergedByKey.values()).map(mapMovieRow);
    const upserted = await upsertCatalogRows(env, mapped);
    totalUpserted += upserted;
    summary.push({ item_kind: 'movie', fetched: mapped.length, upserted });

    for (const [index, row] of mapped.entries()) {
      const source = JSON.parse(row.source_record_json || '{}');
      await env.DB.prepare(`
        INSERT INTO movie_catalog (
          upc, slug, title, sort_title, summary, media_format, genre, director_names, actor_names,
          front_image_url, back_image_url, release_year, runtime_minutes, studio_name, status,
          featured_rank, source_record_json, source_json_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(upc) DO UPDATE SET
          slug = excluded.slug,
          title = excluded.title,
          sort_title = excluded.sort_title,
          summary = excluded.summary,
          media_format = excluded.media_format,
          genre = excluded.genre,
          director_names = excluded.director_names,
          actor_names = excluded.actor_names,
          front_image_url = excluded.front_image_url,
          back_image_url = excluded.back_image_url,
          release_year = excluded.release_year,
          runtime_minutes = excluded.runtime_minutes,
          studio_name = excluded.studio_name,
          source_record_json = excluded.source_record_json,
          source_json_path = excluded.source_json_path,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        normalizeText(source.upc || row.source_key),
        row.slug || null,
        row.name,
        row.name,
        row.short_description || null,
        row.subcategory || null,
        row.category || null,
        normalizeText(source.director_names || source.director),
        normalizeText(source.actor_names || source.actors),
        row.image_url || null,
        normalizeText(source.back_image_url || source.image_back || source.cover_back),
        Number(source.release_year || 0) || null,
        Number(source.runtime_minutes || 0) || null,
        row.brand || null,
        index,
        row.source_record_json || null,
        row.source_json_path || null
      ).run();
    }
  }

  if (selectedKinds.includes('creation')) {
    const featured = await fetchJsonFromSite(request, '/data/site/featured-items.json');
    const rows = Array.isArray(featured?.items) ? featured.items : [];
    const mapped = rows.map(mapCreationRow);
    const upserted = await upsertCatalogRows(env, mapped);
    totalUpserted += upserted;
    summary.push({ item_kind: 'creation', fetched: mapped.length, upserted });
  }

  return json({
    ok: true,
    migrated_by: adminUser,
    total_upserted: totalUpserted,
    summary
  });
}
