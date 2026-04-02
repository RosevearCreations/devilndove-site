// File: /functions/api/movies.js
// Purpose: Public movie catalog API with safe JSON-first fallback and optional D1 overlay merge.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=120",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTrailerSearchUrl(title, upc) {
  const q = encodeURIComponent(
    [normalizeText(title), normalizeText(upc), "official trailer"].filter(Boolean).join(" ")
  );
  return q ? `https://www.youtube.com/results?search_query=${q}` : "";
}

function deriveCoverUrl(row, side) {
  const upc = normalizeText(row.upc || row.UPC || row.barcode || row.code);
  if (!upc) return "";

  const explicit = normalizeText(
    side === "front"
      ? (row.front_image_url || row.image_front || row.front_image || row.image || row.cover_front)
      : (row.back_image_url || row.image_back || row.back_image || row.cover_back)
  );
  if (explicit) return explicit;

  const base = normalizeText(
    row.cover_base_url ||
    row.r2_movie_base_url ||
    "https://pub-f8137eb938da486a9f24410ccf49087c.r2.dev/movies"
  ).replace(/\/$/, "");

  return `${base}/${upc}${side === "front" ? "f" : "b"}.jpg`;
}

async function fetchJsonFromSite(request, path) {
  const url = new URL(path, request.url);
  const response = await fetch(url.toString(), {
    cf: { cacheTtl: 0, cacheEverything: false }
  }).catch(() => null);

  if (!response || !response.ok) return null;
  return response.json().catch(() => null);
}

async function fetchMovieJsonBase(request) {
  const paths = [
    "/data/movies/movie_catalog_enriched.v2.json",
    "/assets/movies/movie_catalog_enriched.v2.json",
    "/data/movies/movie_catalog_enriched.json",
    "/assets/movies/movie_catalog_enriched.json",
    "/data/catalog.json"
  ];

  for (const path of paths) {
    const data = await fetchJsonFromSite(request, path);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.movies)) return data.movies;
    if (Array.isArray(data?.titles)) return data.titles;
  }

  return [];
}

function normalizeMovieRow(row, index = 0) {
  const upc = normalizeText(row.upc || row.UPC || row.barcode || row.code);
  const title = normalizeText(row.title || row.name || row.movie_title);
  const trailerUrl = normalizeText(row.trailer_url || row.trailer || row.youtube_url);

  return {
    movie_catalog_id: Number(row.movie_catalog_id || 0),
    upc,
    slug: normalizeText(row.slug || slugify(title || upc || `movie-${index + 1}`)),
    title: title || "",
    sort_title: normalizeText(row.sort_title || title || upc || `movie-${index + 1}`),
    summary: normalizeText(row.summary || row.description || row.plot_summary || row.synopsis),
    release_year: safeNumber(row.release_year ?? row.year),
    media_format: normalizeText(row.media_format || row.format || "DVD/Blu-ray"),
    genre: normalizeText(row.genre),
    director_names: normalizeText(row.director_names || row.director),
    actor_names: normalizeText(row.actor_names || row.actors),
    front_image_url: normalizeText(row.front_image_url || deriveCoverUrl(row, "front")),
    back_image_url: normalizeText(row.back_image_url || deriveCoverUrl(row, "back")),
    runtime_minutes: safeNumber(row.runtime_minutes),
    studio_name: normalizeText(row.studio_name || row.studio),
    trailer_url: trailerUrl,
    trailer_search_url: trailerUrl || buildTrailerSearchUrl(title, upc),
    imdb_id: normalizeText(row.imdb_id),
    metadata_status: normalizeText(row.metadata_status || (title ? "enriched" : "pending")),
    alternate_identifier: normalizeText(row.alternate_identifier),
    collection_notes: normalizeText(row.collection_notes),
    status: normalizeText(row.status || "active") || "active",
    featured_rank: row.featured_rank == null || row.featured_rank === "" ? null : Number(row.featured_rank),
    updated_at: row.updated_at || null
  };
}

function mergeMovieRows(baseRow, overlayRow) {
  const merged = { ...baseRow };

  for (const [key, value] of Object.entries(overlayRow || {})) {
    if (value == null) continue;
    if (typeof value === "string" && !value.trim()) continue;
    merged[key] = value;
  }

  merged.upc = normalizeText(merged.upc);
  merged.slug = normalizeText(merged.slug || slugify(merged.title || merged.upc));
  merged.front_image_url = normalizeText(merged.front_image_url || deriveCoverUrl(merged, "front"));
  merged.back_image_url = normalizeText(merged.back_image_url || deriveCoverUrl(merged, "back"));
  merged.trailer_search_url = normalizeText(
    merged.trailer_search_url || merged.trailer_url || buildTrailerSearchUrl(merged.title, merged.upc)
  );

  return merged;
}

function matchesQuery(row, q) {
  if (!q) return true;
  const hay = [
    row.upc,
    row.slug,
    row.title,
    row.summary,
    row.release_year,
    row.actor_names,
    row.director_names,
    row.genre,
    row.media_format,
    row.studio_name,
    row.imdb_id,
    row.alternate_identifier
  ].join(" ").toLowerCase();

  return hay.includes(q);
}

async function fetchDbOverlay(env) {
  const db = env.DB || env.DD_DB;
  if (!db) return [];

  const hasTable = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='movie_catalog' LIMIT 1`)
    .first()
    .catch(() => null);

  if (!hasTable?.name) return [];

  const result = await db.prepare(`
    SELECT
      movie_catalog_id,
      upc,
      slug,
      title,
      sort_title,
      summary,
      release_year,
      media_format,
      genre,
      director_names,
      actor_names,
      front_image_url,
      back_image_url,
      runtime_minutes,
      studio_name,
      trailer_url,
      imdb_id,
      status,
      featured_rank,
      updated_at,
      source_record_json
    FROM movie_catalog
    WHERE COALESCE(status, 'active') != 'archived'
    ORDER BY COALESCE(featured_rank, 999999) ASC, LOWER(COALESCE(sort_title, title, upc, '')) ASC
  `).all().catch(() => ({ results: [] }));

  return Array.isArray(result?.results) ? result.results.map(normalizeMovieRow) : [];
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const q = normalizeText(url.searchParams.get("q")).toLowerCase();
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 500);

  const baseItems = (await fetchMovieJsonBase(request)).map(normalizeMovieRow);
  const overlayItems = await fetchDbOverlay(env);

  const byKey = new Map();

  for (const row of baseItems) {
    const key = normalizeText(row.upc || row.slug);
    if (!key) continue;
    byKey.set(key, row);
  }

  for (const row of overlayItems) {
    const key = normalizeText(row.upc || row.slug);
    if (!key) continue;
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeMovieRows(existing, row) : row);
  }

  let items = Array.from(byKey.values());

  items = items.filter((row) => matchesQuery(row, q));

  items.sort((a, b) => {
    const ar = Number.isFinite(a.featured_rank) ? a.featured_rank : 999999;
    const br = Number.isFinite(b.featured_rank) ? b.featured_rank : 999999;
    if (ar !== br) return ar - br;
    return String(a.sort_title || a.title || a.upc || "").localeCompare(
      String(b.sort_title || b.title || b.upc || ""),
      undefined,
      { sensitivity: "base" }
    );
  });

  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const paged = items.slice(offset, offset + limit);

  const years = new Set();
  const formats = new Set();
  const genres = new Set();

  for (const row of items) {
    if (row.release_year) years.add(String(row.release_year));
    if (row.media_format) formats.add(row.media_format);
    if (row.genre) {
      for (const part of String(row.genre).split(",").map((v) => v.trim()).filter(Boolean)) {
        genres.add(part);
      }
    }
  }

  return json({
    ok: true,
    items: paged,
    pagination: {
      page: safePage,
      limit,
      total,
      total_pages: totalPages,
      shown: paged.length,
      from: total ? offset + 1 : 0,
      to: total ? offset + paged.length : 0
    },
    summary: {
      total_movies: total,
      source_of_truth: "movie_catalog_enriched.v2.json with D1 overlay",
      has_db_overlay: overlayItems.length > 0
    },
    filter_groups: {
      years: Array.from(years).sort(),
      formats: Array.from(formats).sort((a, b) => a.localeCompare(b)),
      genres: Array.from(genres).sort((a, b) => a.localeCompare(b))
    }
  });
}
