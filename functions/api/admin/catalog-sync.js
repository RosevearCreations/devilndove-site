// Build 244: tool/supply catalog authority is migration-owned D1; runtime JSON re-import is disabled.
import {
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status, { "Cache-Control": "no-store" });
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildImageUrl(origin, folder, fileName, rawKey) {
  const key = normalizeText(rawKey) || [folder, normalizeText(fileName)].filter(Boolean).join("/");
  if (!key) return "";
  const encoded = key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return `${origin}/${encoded}`;
}

async function fetchJsonFromSite(request, paths) {
  const tried_paths = [];
  const warnings = [];

  for (const path of paths) {
    const resolved = new URL(path, request.url).toString();
    tried_paths.push(path);
    try {
      const response = await fetch(resolved, { cf: { cacheTtl: 0, cacheEverything: false } });
      if (!response.ok) {
        warnings.push(`Fetch failed for ${path} (${response.status}).`);
        continue;
      }
      const data = await response.json().catch(() => null);
      if (Array.isArray(data)) return { items: data, source_path: path, tried_paths, warnings };
      if (Array.isArray(data?.items)) return { items: data.items, source_path: path, tried_paths, warnings };
      if (Array.isArray(data?.movies)) return { items: data.movies, source_path: path, tried_paths, warnings };
      warnings.push(`No array payload found at ${path}.`);
    } catch (error) {
      warnings.push(`Could not read ${path}: ${String(error?.message || error || 'Unknown error')}`);
    }
  }

  return { items: [], source_path: "", tried_paths, warnings };
}

function mapCreationRow(row, index, sourcePath) {
  const name = normalizeText(row.name || row.title) || `Creation ${index + 1}`;
  const image = normalizeText(row.image || row.image_url || row.src);
  const sourceKey = normalizeText(row.id || row.slug || image || `${slugify(name)}-${index + 1}`);
  return {
    item_kind: "creation",
    source_key: sourceKey,
    slug: slugify(row.slug || name),
    name,
    brand: "",
    category: normalizeText(row.section || "Featured creation"),
    subcategory: normalizeText(row.type || ""),
    item_type: normalizeText(row.type || ""),
    short_description: [normalizeText(row.section), normalizeText(row.type), normalizeText(row.alt)].filter(Boolean).join(" • "),
    notes: normalizeText(row.caption || row.description || row.alt),
    image_url: image,
    r2_object_key: "",
    amazon_url: "",
    storage_location: "",
    quantity_on_hand: 0,
    reorder_point: 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: sourcePath,
  };
}

function mapMovieRow(row, index, sourcePath) {
  const upc = normalizeText(row.upc || row.UPC || row.barcode || row.code || row.alternate_identifier || row.imdb_id || `movie-${index + 1}`);
  const title = normalizeText(row.title || row.name || row.movie_title || `Movie ${index + 1}`);
  const releaseYear = Number(row.release_year || row.year || 0) || null;
  return {
    upc,
    slug: slugify(title || upc),
    title,
    original_title: normalizeText(row.original_title),
    sort_title: normalizeText(row.sort_title || title).toLowerCase(),
    summary: normalizeText(row.summary || row.description || row.plot_summary || row.synopsis),
    release_year: releaseYear,
    media_format: normalizeText(row.media_format || row.format),
    genre: normalizeText(row.genre),
    director_names: normalizeText(row.director_names || row.director),
    actor_names: normalizeText(row.actor_names || row.actors),
    front_image_url: normalizeText(row.front_image_url || row.image_front || row.image || row.cover_front),
    back_image_url: normalizeText(row.back_image_url || row.image_back || row.cover_back),
    runtime_minutes: Number(row.runtime_minutes || row.runtime || 0) || null,
    studio_name: normalizeText(row.studio_name || row.studio),
    trailer_url: normalizeText(row.trailer_url),
    imdb_id: normalizeText(row.imdb_id),
    alternate_identifier: normalizeText(row.alternate_identifier),
    metadata_status: normalizeText(row.metadata_status) || "pending",
    metadata_source: normalizeText(row.metadata_source || "json_sync"),
    estimated_value_low_cents: Number(row.estimated_value_low_cents || 0) || null,
    estimated_value_high_cents: Number(row.estimated_value_high_cents || 0) || null,
    estimated_value_currency: normalizeText(row.estimated_value_currency),
    rarity_notes: normalizeText(row.rarity_notes),
    collection_notes: normalizeText(row.collection_notes || row.notes),
    value_search_url: normalizeText(row.value_search_url),
    status: normalizeText(row.status) || "active",
    featured_rank: Number(row.featured_rank || 0) || null,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: sourcePath,
  };
}

function chunkRows(rows, size = 50) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

async function upsertCatalogRows(db, rows) {
  let upserted = 0;
  for (const chunk of chunkRows(rows, 50)) {
    const statements = chunk.map((row) => db.prepare(`
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
    ));
    await db.batch(statements);
    upserted += chunk.length;
  }
  return upserted;
}

async function upsertMovieRows(db, rows) {
  let upserted = 0;
  for (const chunk of chunkRows(rows, 25)) {
    const statements = chunk.map((row) => db.prepare(`
      INSERT INTO movie_catalog (
        upc, slug, title, original_title, sort_title, summary, release_year,
        media_format, genre, director_names, actor_names, front_image_url,
        back_image_url, runtime_minutes, studio_name, trailer_url, imdb_id,
        alternate_identifier, metadata_status, metadata_source,
        estimated_value_low_cents, estimated_value_high_cents, estimated_value_currency,
        rarity_notes, collection_notes, value_search_url, status, featured_rank,
        source_record_json, source_json_path, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(upc) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        original_title = excluded.original_title,
        sort_title = excluded.sort_title,
        summary = excluded.summary,
        release_year = excluded.release_year,
        media_format = excluded.media_format,
        genre = excluded.genre,
        director_names = excluded.director_names,
        actor_names = excluded.actor_names,
        front_image_url = excluded.front_image_url,
        back_image_url = excluded.back_image_url,
        runtime_minutes = excluded.runtime_minutes,
        studio_name = excluded.studio_name,
        trailer_url = excluded.trailer_url,
        imdb_id = excluded.imdb_id,
        alternate_identifier = excluded.alternate_identifier,
        metadata_status = excluded.metadata_status,
        metadata_source = excluded.metadata_source,
        estimated_value_low_cents = excluded.estimated_value_low_cents,
        estimated_value_high_cents = excluded.estimated_value_high_cents,
        estimated_value_currency = excluded.estimated_value_currency,
        rarity_notes = excluded.rarity_notes,
        collection_notes = excluded.collection_notes,
        value_search_url = excluded.value_search_url,
        status = excluded.status,
        featured_rank = excluded.featured_rank,
        source_record_json = excluded.source_record_json,
        source_json_path = excluded.source_json_path,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      row.upc,
      row.slug || null,
      row.title || null,
      row.original_title || null,
      row.sort_title || null,
      row.summary || null,
      row.release_year,
      row.media_format || null,
      row.genre || null,
      row.director_names || null,
      row.actor_names || null,
      row.front_image_url || null,
      row.back_image_url || null,
      row.runtime_minutes,
      row.studio_name || null,
      row.trailer_url || null,
      row.imdb_id || null,
      row.alternate_identifier || null,
      row.metadata_status || 'pending',
      row.metadata_source || null,
      row.estimated_value_low_cents,
      row.estimated_value_high_cents,
      row.estimated_value_currency || null,
      row.rarity_notes || null,
      row.collection_notes || null,
      row.value_search_url || null,
      row.status || 'active',
      row.featured_rank,
      row.source_record_json || null,
      row.source_json_path || null
    ));
    await db.batch(statements);
    upserted += chunk.length;
  }
  return upserted;
}

function normalizeCollections(body) {
  const aliases = {
    tools: 'tools',
    tool: 'tools',
    supplies: 'supplies',
    supply: 'supplies',
    movies: 'movies',
    movie: 'movies',
    featured: 'featured',
    creations: 'featured',
    creation: 'featured',
    featured_creations: 'featured',
  };

  const raw = [];
  if (Array.isArray(body?.collections)) raw.push(...body.collections);
  if (Array.isArray(body?.item_kinds)) raw.push(...body.item_kinds);
  if (!raw.length) raw.push('tools', 'supplies', 'movies', 'featured');

  const normalized = [];
  for (const value of raw.map((entry) => aliases[normalizeText(entry).toLowerCase()] || '')) {
    if (value && !normalized.includes(value)) normalized.push(value);
  }
  return normalized.length ? normalized : ['tools', 'supplies', 'movies', 'featured'];
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  try {
    const collections = normalizeCollections(body);
    const definitions = {
      tools: { target_table: 'catalog_items', item_kind: 'tool', migration_managed: true },
      supplies: { target_table: 'catalog_items', item_kind: 'supply', migration_managed: true },
      movies: {
        fetch_paths: ['/data/movies/movie_catalog_enriched.v2.json', '/data/movies/movie_catalog_enriched.json'],
        target_table: 'movie_catalog',
        item_kind: 'movie',
        mapper: mapMovieRow,
        upsert: upsertMovieRows,
      },
      featured: {
        fetch_paths: ['/data/site/featured-items.json'],
        target_table: 'catalog_items',
        item_kind: 'creation',
        mapper: mapCreationRow,
        upsert: upsertCatalogRows,
      },
    };

    const summary = [];
    let totalUpserted = 0;

    for (const collection of collections) {
      const definition = definitions[collection];
      if (!definition) continue;

      if (definition.migration_managed) {
        const row = await db.prepare(`SELECT COUNT(*) AS count FROM catalog_items WHERE item_kind=? AND COALESCE(status,'active')!='archived'`).bind(definition.item_kind).first();
        summary.push({
          collection,
          item_kind: definition.item_kind,
          target_table: definition.target_table,
          fetched: Number(row?.count || 0),
          upserted: 0,
          source_path: 'D1 catalog_items (Build 244 authority)',
          tried_paths: [],
          warnings: ['Build 244 migration owns tool/supply catalog authority. Runtime JSON re-import is disabled to prevent D1 from being overwritten by stale legacy classifications.'],
          write_mode: 'd1_authority_no_runtime_json_import'
        });
        continue;
      }

      const fetched = await fetchJsonFromSite(request, definition.fetch_paths);
      const rows = await Promise.all(fetched.items.map((row, index) => definition.mapper(row, index, fetched.source_path || definition.fetch_paths[0])));
      const upserted = rows.length ? await definition.upsert(db, rows) : 0;
      totalUpserted += upserted;

      summary.push({
        collection,
        item_kind: definition.item_kind,
        target_table: definition.target_table,
        fetched: fetched.items.length,
        upserted,
        source_path: fetched.source_path || definition.fetch_paths[0],
        tried_paths: fetched.tried_paths,
        warnings: fetched.warnings,
        write_mode: collection === 'movies' ? 'batched_d1_upsert_25' : 'batched_d1_upsert_50',
      });
    }

    return json({
      ok: true,
      requested_by: adminUser,
      total_upserted: totalUpserted,
      summary,
      results: summary,
    });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'catalog_sync',
      incident_code: 'catalog_sync_failed',
      severity: 'error',
      message: 'Catalog migration sync failed.',
      related_user_id: adminUser.user_id,
      details: {
        error: String(error?.message || error || 'Unknown error'),
      },
    });

    return json({ ok: false, error: String(error?.message || error || 'Catalog sync failed.') }, 500);
  }
}
