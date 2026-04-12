import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status, { "Cache-Control": "no-store" });
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  try {
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1")
      .bind(tableName)
      .first();
    return !!row;
  } catch {
    return false;
  }
}

async function ensureCatalogSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS catalog_items (
      catalog_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_kind TEXT NOT NULL,
      source_key TEXT NOT NULL,
      slug TEXT,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      subcategory TEXT,
      item_type TEXT,
      short_description TEXT,
      notes TEXT,
      image_url TEXT,
      r2_object_key TEXT,
      amazon_url TEXT,
      storage_location TEXT,
      quantity_on_hand INTEGER NOT NULL DEFAULT 0,
      reorder_point INTEGER NOT NULL DEFAULT 0,
      visible_public INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      sort_order INTEGER NOT NULL DEFAULT 0,
      source_record_json TEXT,
      source_json_path TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(item_kind, source_key)
    )
  `).run();
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
  const encoded = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${origin}/${encoded}`;
}

function unwrapItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.movies)) return data.movies;
  if (Array.isArray(data?.featured_items)) return data.featured_items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function fetchJsonFromSite(request, candidatePaths) {
  const paths = Array.isArray(candidatePaths) ? candidatePaths : [candidatePaths];
  const attempts = [];

  for (const path of paths) {
    try {
      const url = new URL(path, request.url);
      const response = await fetch(url.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
      if (!response.ok) {
        attempts.push({ path, ok: false, status: response.status, status_text: response.statusText || "Fetch failed" });
        continue;
      }

      const data = await response.json().catch(() => null);
      const items = unwrapItems(data);
      attempts.push({ path, ok: true, row_count: items.length });
      if (items.length) return { items, source_path: path, attempts };
    } catch (error) {
      attempts.push({ path, ok: false, error: String(error?.message || error || "Fetch failed") });
    }
  }

  return { items: [], source_path: paths[0] || "", attempts };
}

function mapToolRow(row, index) {
  const name = normalizeText(row.item_name_suggested || row.name || row.example_image_file) || `Tool ${index + 1}`;
  const area = normalizeText(row.primary_area || row.area || "Workshop Basics");
  const category = normalizeText(row.category || row.tool_category || "Uncategorized");
  const sourceKey = normalizeText(row.item_group_key_strict || row.r2_object_key || row.example_image_file || `${slugify(name)}-${index + 1}`);
  return {
    item_kind: "tool",
    source_key: sourceKey,
    slug: slugify(name),
    name,
    brand: normalizeText(row.brand_guess || row.brand),
    category,
    subcategory: area,
    item_type: normalizeText(row.tool_type || ""),
    short_description: [area, category].filter(Boolean).join(" • "),
    notes: normalizeText(row.how_we_use || row.notes_public || row.notes),
    image_url: buildImageUrl("https://assets.devilndove.com", "Toolshed", row.example_image_file || row.image_file, row.r2_object_key),
    r2_object_key: normalizeText(row.r2_object_key || ["Toolshed", normalizeText(row.example_image_file)].filter(Boolean).join("/")),
    amazon_url: normalizeText(row.amazon_url || row.amazon_search_url || row.amazon_search),
    storage_location: [row.location_zone, row.location_shelf, row.location_bin].map(normalizeText).filter(Boolean).join(" / "),
    quantity_on_hand: Number(row.quantity_owned || 0) || 0,
    reorder_point: 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: "/data/toolshed/toolshed_items_master.json",
  };
}

function mapSupplyRow(row, index) {
  const name = normalizeText(row.item_name_suggested || row.example_image_file) || `Supply ${index + 1}`;
  const type = normalizeText(row.consumable_type || "Workshop supply");
  const sourceKey = normalizeText(row.item_group_key_strict || row.r2_object_key || row.example_image_file || `${slugify(name)}-${index + 1}`);
  return {
    item_kind: "supply",
    source_key: sourceKey,
    slug: slugify(name),
    name,
    brand: normalizeText(row.brand_guess || row.brand),
    category: type,
    subcategory: normalizeText(row.primary_area || ""),
    item_type: type,
    short_description: [type, normalizeText(row.primary_area)].filter(Boolean).join(" • "),
    notes: normalizeText(row.notes),
    image_url: buildImageUrl("https://assets.devilndove.com", "Supplies", row.example_image_file || row.image_file, row.r2_object_key),
    r2_object_key: normalizeText(row.r2_object_key || ["Supplies", normalizeText(row.example_image_file)].filter(Boolean).join("/")),
    amazon_url: normalizeText(row.amazon_url || row.amazon_search_url),
    storage_location: normalizeText(row.storage_location),
    quantity_on_hand: Number(row.on_hand_qty || 0) || 0,
    reorder_point: Number(row.reorder_point || 0) || 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: "/data/supplies/supplies_items_master.json",
  };
}

function mapMovieRow(row, index) {
  const upc = normalizeText(row.upc || row.UPC || row.barcode || row.code);
  const title = normalizeText(row.title || row.name || row.movie_title || "");
  const sourceKey = upc || normalizeText(row.slug || `${slugify(title || "movie")}-${index + 1}`);
  return {
    item_kind: "movie",
    source_key: sourceKey,
    slug: slugify(title || upc || `movie-${index + 1}`),
    name: title || `UPC ${upc || index + 1}`,
    brand: normalizeText(row.studio_name || row.studio),
    category: normalizeText(row.genre || "Movie"),
    subcategory: normalizeText(row.media_format || row.format || ""),
    item_type: "movie",
    short_description: normalizeText(row.summary || row.description || row.plot_summary || row.synopsis || ""),
    notes: normalizeText(row.director_names || row.actor_names || row.director || row.actors || row.notes),
    image_url: normalizeText(row.front_image_url || row.image_front || row.image || row.cover_front),
    r2_object_key: normalizeText(row.front_r2_object_key || row.r2_object_key),
    amazon_url: normalizeText(row.amazon_url),
    storage_location: normalizeText(row.storage_location),
    quantity_on_hand: Number(row.quantity_on_hand || 1) || 1,
    reorder_point: 0,
    sort_order: index,
    source_record_json: JSON.stringify(row || {}),
    source_json_path: "/data/movies/movie_catalog_enriched.v2.json",
  };
}

function mapCreationRow(row, index) {
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
    source_json_path: "/data/site/featured-items.json",
  };
}

async function upsertCatalogRows(db, rows) {
  let upserted = 0;
  for (const row of rows) {
    await db.prepare(`
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

function parseCollections(body = {}) {
  const fromCollections = Array.isArray(body.collections) ? body.collections : [];
  const fromKinds = Array.isArray(body.item_kinds) ? body.item_kinds : [];
  const merged = [...fromCollections, ...fromKinds].map((value) => normalizeText(value).toLowerCase());
  const mapped = merged.map((value) => {
    if (value === "tool" || value === "tools") return "tools";
    if (value === "supply" || value === "supplies") return "supplies";
    if (value === "movie" || value === "movies") return "movies";
    if (value === "creation" || value === "creations" || value === "featured") return "featured";
    return "";
  }).filter(Boolean);
  return mapped.length ? [...new Set(mapped)] : ["tools", "supplies", "movies", "featured"];
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  await ensureCatalogSchema(db);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const collections = parseCollections(body);
  const defs = {
    tools: [["/data/toolshed/toolshed_items_master.json", "/data/data/toolshed/toolshed_items_master.json"], mapToolRow],
    supplies: [["/data/supplies/supplies_items_master.json", "/data/data/supplies/supplies_items_master.json"], mapSupplyRow],
    movies: [["/data/movies/movie_catalog_enriched.v2.json", "/data/movies/movie_catalog_enriched.json"], mapMovieRow],
    featured: [["/data/site/featured-items.json", "/data/data/site/featured-items.json"], mapCreationRow],
  };

  const results = [];
  let totalUpserted = 0;

  for (const collection of collections) {
    const def = defs[collection];
    if (!def) continue;
    const [candidatePaths, mapper] = def;

    try {
      const fetched = await fetchJsonFromSite(request, candidatePaths);
      const rows = fetched.items.map((row, index) => mapper(row, index)).filter((row) => normalizeText(row.name) && normalizeText(row.source_key));
      const upserted = rows.length ? await upsertCatalogRows(db, rows) : 0;
      totalUpserted += upserted;

      const warning = !rows.length
        ? "No rows were fetched from the candidate source paths."
        : fetched.attempts.some((attempt) => !attempt.ok)
          ? "One or more fallback source paths failed before a working source responded."
          : "";

      results.push({
        collection,
        item_kind: mapper === mapCreationRow ? "creation" : collection.slice(0, -1),
        ok: rows.length > 0,
        source_path: fetched.source_path,
        candidate_paths: candidatePaths,
        fetched: fetched.items.length,
        row_count: fetched.items.length,
        upserted,
        warning: warning || null,
        attempts: fetched.attempts,
      });
    } catch (error) {
      await captureRuntimeIncident(env, request, {
        incident_scope: "catalog_sync",
        incident_code: "collection_sync_failed",
        severity: "error",
        related_user_id: adminUser.user_id,
        message: `Catalog sync failed for ${collection}.`,
        details: { collection, error: String(error?.message || error || "Unknown error") },
      });

      results.push({
        collection,
        item_kind: collection.slice(0, -1),
        ok: false,
        source_path: Array.isArray(candidatePaths) ? candidatePaths[0] : String(candidatePaths || ""),
        fetched: 0,
        row_count: 0,
        upserted: 0,
        error: String(error?.message || error || "Sync failed."),
      });
    }
  }

  await auditAdminAction(env, request, adminUser, {
    action_type: "catalog_sync",
    target_type: "catalog_items",
    target_key: collections.join(","),
    details: { total_upserted: totalUpserted, results },
  });

  const catalogCount = (await safeAll(db, "SELECT COUNT(*) AS count FROM catalog_items", [])).at(0)?.count || 0;

  return json({
    ok: true,
    requested_by: adminUser,
    total_upserted: totalUpserted,
    catalog_count: Number(catalogCount || 0),
    results,
    summary: results,
  });
}
