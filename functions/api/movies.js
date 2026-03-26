// File: /functions/api/movies.js
// Brief description: Public read endpoint for the movie shelf. It prefers D1-backed movie records,
// then blends in any enriched JSON metadata so the public page can show cover images, summaries,
// actors, directors, and year data while legacy UPC-only rows continue to work.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } });
}

function normalizeText(value) { return String(value || '').trim(); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
function slugify(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
  const title = normalizeText(row.title || row.name || row.movie_title || (upc ? `Movie ${upc}` : `Movie ${index + 1}`));
  return {
    movie_catalog_id: Number(row.movie_catalog_id || 0),
    upc,
    slug: normalizeText(row.slug || slugify(title || upc)),
    title: title || upc || 'Untitled movie',
    sort_title: normalizeText(row.sort_title || title || upc),
    summary: normalizeText(row.summary || row.description || row.plot_summary || row.synopsis),
    release_year: row.release_year ? Number(row.release_year) : null,
    media_format: normalizeText(row.media_format || row.format || 'DVD/Blu-ray'),
    genre: normalizeText(row.genre),
    director_names: normalizeText(row.director_names || row.director),
    actor_names: normalizeText(row.actor_names || row.actors),
    front_image_url: normalizeText(row.front_image_url || row.image_front || row.image || row.cover_front),
    back_image_url: normalizeText(row.back_image_url || row.image_back || row.cover_back),
    runtime_minutes: row.runtime_minutes ? Number(row.runtime_minutes) : null,
    studio_name: normalizeText(row.studio_name || row.studio),
    trailer_url: normalizeText(row.trailer_url || row.trailer || row.youtube_url || row.trailer_search_url),
    status: normalizeText(row.status || 'active') || 'active',
    featured_rank: row.featured_rank == null || row.featured_rank === '' ? null : Number(row.featured_rank),
    updated_at: row.updated_at || null,
    source_record: row?.source_record || row || null
  };
}

function mergeMovieRows(primary, overlay) {
  return {
    ...primary,
    ...Object.fromEntries(Object.entries(overlay || {}).filter(([_, v]) => !(v == null || v === ''))),
    movie_catalog_id: primary.movie_catalog_id || Number(overlay?.movie_catalog_id || 0) || 0,
    upc: primary.upc || overlay?.upc || '',
    title: primary.title || overlay?.title || primary.upc || 'Untitled movie',
    sort_title: primary.sort_title || overlay?.sort_title || primary.title || overlay?.title || primary.upc || '',
    source_record: overlay?.source_record || primary.source_record || null
  };
}

function matchesQuery(row, q) {
  if (!q) return true;
  const hay = [
    row.upc, row.title, row.summary, row.director_names, row.actor_names, row.genre,
    row.studio_name, row.media_format, String(row.release_year || ''), row.trailer_url
  ].join(' ').toLowerCase();
  return hay.includes(q);
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
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 150), 1), 300);
  const likeQ = `%${q}%`;
  const likeYear = `%${year}%`;
  const likeActor = `%${actor}%`;
  const likeDirector = `%${director}%`;
  const likeGenre = `%${genre}%`;
  const likeStudio = `%${studio}%`;
  const likeFormat = `%${format}%`;
  const likeUpc = `%${upc}%`;

  let dbItems = [];
  const hasTable = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='movie_catalog' LIMIT 1`).first().catch(() => null);
  if (hasTable?.name === 'movie_catalog') {
    dbItems = normalizeResults(await env.DB.prepare(`
      SELECT movie_catalog_id, upc, slug, title, sort_title, summary, release_year, media_format, genre,
             director_names, actor_names, front_image_url, back_image_url, runtime_minutes,
             studio_name, trailer_url, status, featured_rank, source_record_json, updated_at
      FROM movie_catalog
      WHERE COALESCE(status,'active') != 'archived'
        AND (? = '' OR LOWER(COALESCE(title,'')) LIKE ? OR LOWER(COALESCE(upc,'')) LIKE ? OR LOWER(COALESCE(summary,'')) LIKE ? OR LOWER(COALESCE(genre,'')) LIKE ?)
        AND (? = '' OR LOWER(COALESCE(CAST(release_year AS TEXT),'')) LIKE ?)
        AND (? = '' OR LOWER(COALESCE(actor_names,'')) LIKE ?)
        AND (? = '' OR LOWER(COALESCE(director_names,'')) LIKE ?)
        AND (? = '' OR LOWER(COALESCE(genre,'')) LIKE ?)
        AND (? = '' OR LOWER(COALESCE(studio_name,'')) LIKE ?)
        AND (? = '' OR LOWER(COALESCE(media_format,'')) LIKE ?)
        AND (? = '' OR LOWER(COALESCE(upc,'')) LIKE ?)
        AND (? = '' OR ((? = '1' OR ? = 'true' OR ? = 'yes') AND TRIM(COALESCE(trailer_url,'')) != '') OR ((? = '0' OR ? = 'false' OR ? = 'no') AND TRIM(COALESCE(trailer_url,'')) = ''))
      ORDER BY COALESCE(featured_rank,999999) ASC, LOWER(COALESCE(sort_title,title,upc,'')) ASC
      LIMIT ?
    `).bind(q, likeQ, likeQ, likeQ, likeQ, year, likeYear, actor, likeActor, director, likeDirector, genre, likeGenre, studio, likeStudio, format, likeFormat, upc, likeUpc, hasTrailer, hasTrailer, hasTrailer, hasTrailer, hasTrailer, hasTrailer, hasTrailer, limit).all()).map((row, index) => {
      let source_record = null;
      try { source_record = row.source_record_json ? JSON.parse(row.source_record_json) : null; } catch {}
      return normalizeMovieRow({ ...row, source_record }, index);
    });
  }

  const enriched = (await fetchEnrichedCatalog(request) || []).map(normalizeMovieRow);
  const enrichedByUpc = new Map(enriched.map((row) => [row.upc || row.slug, row]));

  let items = dbItems.map((row) => mergeMovieRows(row, enrichedByUpc.get(row.upc || row.slug)));

  if (!items.length) {
    const fallback = (await fetchLegacyCatalog(request)).map(normalizeMovieRow);
    items = fallback.map((row) => mergeMovieRows(row, enrichedByUpc.get(row.upc || row.slug)));
  }

  if (!dbItems.length && enriched.length) {
    const existing = new Set(items.map((row) => row.upc || row.slug));
    for (const row of enriched) {
      const key = row.upc || row.slug;
      if (!existing.has(key)) items.push(row);
    }
  }

  items = items.filter((row) => matchesQuery(row, q))
    .filter((row) => !year || String(row.release_year || '').toLowerCase().includes(year))
    .filter((row) => !actor || String(row.actor_names || '').toLowerCase().includes(actor))
    .filter((row) => !director || String(row.director_names || '').toLowerCase().includes(director))
    .filter((row) => !genre || String(row.genre || '').toLowerCase().includes(genre))
    .filter((row) => !studio || String(row.studio_name || '').toLowerCase().includes(studio))
    .filter((row) => !format || String(row.media_format || '').toLowerCase().includes(format))
    .filter((row) => !upc || String(row.upc || '').toLowerCase().includes(upc))
    .filter((row) => !hasTrailer || (((hasTrailer === '1' || hasTrailer === 'true' || hasTrailer === 'yes')) ? Boolean(String(row.trailer_url || '').trim()) : !String(row.trailer_url || '').trim()))
    .sort((a, b) => {
      const ar = a.featured_rank == null ? 999999 : Number(a.featured_rank);
      const br = b.featured_rank == null ? 999999 : Number(b.featured_rank);
      if (ar !== br) return ar - br;
      return String(a.sort_title || a.title || a.upc).localeCompare(String(b.sort_title || b.title || b.upc));
    })
    .slice(0, limit);

  const availableGenres = [...new Set(items.map((row) => normalizeText(row.genre)).filter(Boolean))].sort();
  const availableFormats = [...new Set(items.map((row) => normalizeText(row.media_format)).filter(Boolean))].sort();
  const availableStudios = [...new Set(items.map((row) => normalizeText(row.studio_name)).filter(Boolean))].sort();
  return json({ ok: true, items, summary: { total_items: items.length, query: q, has_enriched_json: enriched.length > 0, source: dbItems.length ? 'd1-blended' : 'json-blended', with_front_image: items.filter((row) => row.front_image_url).length, with_back_image: items.filter((row) => row.back_image_url).length, with_trailer: items.filter((row) => row.trailer_url).length }, filters: { genres: availableGenres, formats: availableFormats, studios: availableStudios } });
}
