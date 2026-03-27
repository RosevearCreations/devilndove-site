// File: /functions/api/movies.js
// Brief description: Public movie catalog endpoint with pagination. It blends D1 movie rows,
// enriched JSON, and legacy fallback rows, then returns a stable paged payload for the public shelf.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120'
    }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildTrailerSearchUrl(title, upc) {
  const q = encodeURIComponent([normalizeText(title), normalizeText(upc), 'official trailer'].filter(Boolean).join(' '));
  return q ? `https://www.youtube.com/results?search_query=${q}` : '';
}

function deriveCoverUrl(row, side) {
  const upc = normalizeText(row.upc || row.UPC || row.barcode || row.code);
  if (!upc) return '';
  const explicit = normalizeText(
    side === 'front'
      ? (row.front_image_url || row.image_front || row.front_image || row.image || row.cover_front)
      : (row.back_image_url || row.image_back || row.back_image || row.cover_back)
  );
  if (explicit) return explicit;
  const prefix = normalizeText(row.cover_base_url || row.r2_movie_base_url || 'https://pub-f8137eb938da486a9f24410ccf49087c.r2.dev/movies');
  return `${prefix.replace(/\/$/, '')}/${upc}${side === 'front' ? 'f' : 'b'}.jpg`;
}

async function fetchJsonFromSite(request, path) {
  const url = new URL(path, request.url);
  const response = await fetch(url.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}

async function fetchLegacyCatalog(request) {
  const data = await fetchJsonFromSite(request, '/data/catalog.json');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.movies)) return data.movies;
  return [];
}

async function fetchEnrichedCatalog(request) {
  const data = await fetchJsonFromSite(request, '/data/movies/movie_catalog_enriched.json');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.movies)) return data.movies;
  return [];
}

function normalizeMovieRow(row, index = 0) {
  const upc = normalizeText(row.upc || row.UPC || row.barcode || row.code);
  const explicitTitle = normalizeText(row.title || row.name || row.movie_title);
  const title = explicitTitle || '';
  const trailerUrl = normalizeText(row.trailer_url || row.trailer || row.youtube_url || row.trailer_search_url);
  return {
    movie_catalog_id: Number(row.movie_catalog_id || 0),
    upc,
    slug: normalizeText(row.slug || slugify(explicitTitle || upc || `movie-${index + 1}`)),
    title,
    sort_title: normalizeText(row.sort_title || explicitTitle || upc || `movie-${index + 1}`),
    summary: normalizeText(row.summary || row.description || row.plot_summary || row.synopsis),
    release_year: safeNumber(row.release_year),
    media_format: normalizeText(row.media_format || row.format || ''),
    genre: normalizeText(row.genre),
    director_names: normalizeText(row.director_names || row.director),
    actor_names: normalizeText(row.actor_names || row.actors),
    front_image_url: deriveCoverUrl(row, 'front'),
    back_image_url: deriveCoverUrl(row, 'back'),
    runtime_minutes: safeNumber(row.runtime_minutes),
    studio_name: normalizeText(row.studio_name || row.studio),
    trailer_url: trailerUrl,
    trailer_search_url: trailerUrl || buildTrailerSearchUrl(explicitTitle || upc, upc),
    status: normalizeText(row.status || 'active') || 'active',
    featured_rank: row.featured_rank == null || row.featured_rank === '' ? null : Number(row.featured_rank),
    updated_at: row.updated_at || null,
    metadata_ready: Boolean(
      explicitTitle || row.summary || row.release_year || row.genre || row.director_names || row.director || row.actor_names || row.actors || row.runtime_minutes || row.studio_name
    ),
    source_record: row?.source_record || row || null
  };
}

function mergeMovieRows(primary, overlay) {
  const merged = {
    ...primary,
    ...Object.fromEntries(Object.entries(overlay || {}).filter(([_, value]) => !(value == null || value === '')))
  };
  merged.movie_catalog_id = primary.movie_catalog_id || Number(overlay?.movie_catalog_id || 0) || 0;
  merged.upc = primary.upc || overlay?.upc || '';
  merged.title = primary.title || overlay?.title || '';
  merged.sort_title = primary.sort_title || overlay?.sort_title || primary.title || overlay?.title || primary.upc || '';
  merged.front_image_url = primary.front_image_url || overlay?.front_image_url || deriveCoverUrl(primary, 'front') || deriveCoverUrl(overlay || {}, 'front');
  merged.back_image_url = primary.back_image_url || overlay?.back_image_url || deriveCoverUrl(primary, 'back') || deriveCoverUrl(overlay || {}, 'back');
  merged.trailer_search_url = primary.trailer_search_url || overlay?.trailer_search_url || buildTrailerSearchUrl(overlay?.title || primary.title, primary.upc || overlay?.upc);
  merged.metadata_ready = Boolean(merged.title || merged.summary || merged.release_year || merged.genre || merged.director_names || merged.actor_names || merged.runtime_minutes || merged.studio_name);
  merged.display_title = merged.title || 'Metadata pending';
  merged.source_record = overlay?.source_record || primary.source_record || null;
  return merged;
}

function matchesQuery(row, q) {
  if (!q) return true;
  const haystack = [
    row.upc,
    row.title,
    row.summary,
    row.director_names,
    row.actor_names,
    row.genre,
    row.studio_name,
    row.media_format,
    String(row.release_year || ''),
    row.trailer_url
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

async function fetchDbMovies(env) {
  if (!env || !env.DB || typeof env.DB.prepare !== 'function') return [];
  const hasTable = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movie_catalog' LIMIT 1").first().catch(() => null);
  if (hasTable?.name !== 'movie_catalog') return [];
  const rows = normalizeResults(await env.DB.prepare(`
    SELECT movie_catalog_id, upc, slug, title, sort_title, summary, release_year, media_format, genre,
           director_names, actor_names, front_image_url, back_image_url, runtime_minutes,
           studio_name, trailer_url, status, featured_rank, source_record_json, updated_at
    FROM movie_catalog
    WHERE COALESCE(status,'active') != 'archived'
    ORDER BY COALESCE(featured_rank, 999999) ASC, LOWER(COALESCE(sort_title, title, upc, '')) ASC
  `).all().catch(() => ({ results: [] })));
  return rows.map((row, index) => {
    let source_record = null;
    try {
      source_record = row.source_record_json ? JSON.parse(row.source_record_json) : null;
    } catch {}
    return normalizeMovieRow({ ...row, source_record }, index);
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const year = normalizeText(url.searchParams.get('year')).toLowerCase();
  const actor = normalizeText(url.searchParams.get('actor')).toLowerCase();
  const director = normalizeText(url.searchParams.get('director')).toLowerCase();
  const genre = normalizeText(url.searchParams.get('genre')).toLowerCase();
  const studio = normalizeText(url.searchParams.get('studio')).toLowerCase();
  const format = normalizeText(url.searchParams.get('format')).toLowerCase();
  const upc = normalizeText(url.searchParams.get('upc')).toLowerCase();
  const hasTrailer = normalizeText(url.searchParams.get('has_trailer')).toLowerCase();
  const page = Math.max(Number(url.searchParams.get('page') || 1), 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 60), 1), 250);

  const [dbItems, enrichedRaw, legacyRaw] = await Promise.all([
    fetchDbMovies(env),
    fetchEnrichedCatalog(request),
    fetchLegacyCatalog(request)
  ]);

  const enriched = (enrichedRaw || []).map(normalizeMovieRow);
  const legacy = (legacyRaw || []).map(normalizeMovieRow);
  const map = new Map();

  const addRow = (row, priority = 1) => {
    const key = row.upc || row.slug;
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, { row, priority });
      return;
    }
    const existing = map.get(key);
    if (priority <= existing.priority) {
      existing.row = mergeMovieRows(row, existing.row);
      existing.priority = priority;
    } else {
      existing.row = mergeMovieRows(existing.row, row);
    }
  };

  enriched.forEach((row) => addRow(row, 1));
  dbItems.forEach((row) => addRow(row, 0));
  legacy.forEach((row) => addRow(row, 2));

  let items = Array.from(map.values()).map((entry) => entry.row)
    .filter((row) => !q || matchesQuery(row, q))
    .filter((row) => !year || String(row.release_year || '').toLowerCase().includes(year))
    .filter((row) => !actor || String(row.actor_names || '').toLowerCase().includes(actor))
    .filter((row) => !director || String(row.director_names || '').toLowerCase().includes(director))
    .filter((row) => !genre || String(row.genre || '').toLowerCase().includes(genre))
    .filter((row) => !studio || String(row.studio_name || '').toLowerCase().includes(studio))
    .filter((row) => !format || String(row.media_format || '').toLowerCase().includes(format))
    .filter((row) => !upc || String(row.upc || '').toLowerCase().includes(upc))
    .filter((row) => {
      if (!hasTrailer) return true;
      const present = Boolean(normalizeText(row.trailer_url));
      if (['1', 'true', 'yes'].includes(hasTrailer)) return present;
      if (['0', 'false', 'no'].includes(hasTrailer)) return !present;
      return true;
    })
    .sort((a, b) => {
      const aRank = a.featured_rank == null ? 999999 : Number(a.featured_rank);
      const bRank = b.featured_rank == null ? 999999 : Number(b.featured_rank);
      if (aRank !== bRank) return aRank - bRank;
      const aTitle = normalizeText(a.sort_title || a.title || a.upc).toLowerCase();
      const bTitle = normalizeText(b.sort_title || b.title || b.upc).toLowerCase();
      return aTitle.localeCompare(bTitle);
    });

  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  const end = Math.min(start + limit, total);
  items = items.slice(start, end);

  return json({
    ok: true,
    items,
    page: currentPage,
    limit,
    total,
    total_pages: totalPages,
    has_more: end < total,
    shown_from: total ? start + 1 : 0,
    shown_to: end,
    filters: { q, year, actor, director, genre, studio, format, upc, has_trailer: hasTrailer }
  });
}
