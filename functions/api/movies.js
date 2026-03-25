// File: /functions/api/movies.js
// Brief description: Public read endpoint for the movie shelf. It prefers D1-backed movie records
// and falls back to the legacy UPC-only JSON file so the public page keeps working while enrichment continues.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } });
}

function normalizeText(value) { return String(value || '').trim(); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

async function fetchLegacyCatalog(request) {
  const url = new URL('/data/catalog.json', request.url);
  const response = await fetch(url.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data?.items) ? data.items : [];
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 150), 1), 300);
  const like = `%${q}%`;

  const hasTable = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='movie_catalog' LIMIT 1`).first().catch(() => null);
  let items = [];

  if (hasTable?.name === 'movie_catalog') {
    items = normalizeResults(await env.DB.prepare(`
      SELECT movie_catalog_id, upc, slug, title, sort_title, summary, release_year, media_format, genre,
             director_names, actor_names, front_image_url, back_image_url, runtime_minutes,
             studio_name, status, featured_rank, source_record_json, updated_at
      FROM movie_catalog
      WHERE COALESCE(status,'active') != 'archived'
        AND (
          ? = '' OR LOWER(COALESCE(title,'')) LIKE ? OR LOWER(COALESCE(upc,'')) LIKE ? OR LOWER(COALESCE(summary,'')) LIKE ?
          OR LOWER(COALESCE(director_names,'')) LIKE ? OR LOWER(COALESCE(actor_names,'')) LIKE ?
          OR LOWER(COALESCE(CAST(release_year AS TEXT),'')) LIKE ?
        )
      ORDER BY COALESCE(featured_rank,999999) ASC, LOWER(COALESCE(sort_title,title,upc,'')) ASC
      LIMIT ?
    `).bind(q, like, like, like, like, like, like, limit).all()).map((row) => {
      let source_record = null;
      try { source_record = row.source_record_json ? JSON.parse(row.source_record_json) : null; } catch {}
      return {
        movie_catalog_id: Number(row.movie_catalog_id || 0),
        upc: row.upc || '', slug: row.slug || '', title: row.title || row.upc || 'Untitled movie',
        sort_title: row.sort_title || row.title || row.upc || '', summary: row.summary || '',
        release_year: Number(row.release_year || 0) || null, media_format: row.media_format || '', genre: row.genre || '',
        director_names: row.director_names || '', actor_names: row.actor_names || '',
        front_image_url: row.front_image_url || '', back_image_url: row.back_image_url || '',
        runtime_minutes: Number(row.runtime_minutes || 0) || null, studio_name: row.studio_name || '',
        status: row.status || 'active', featured_rank: Number(row.featured_rank || 0) || null,
        updated_at: row.updated_at || null, source_record
      };
    });
  }

  if (!items.length) {
    const fallback = await fetchLegacyCatalog(request);
    items = fallback.map((row, index) => ({
      movie_catalog_id: 0,
      upc: normalizeText(row.upc),
      slug: normalizeText(row.upc),
      title: normalizeText(row.title || row.name || `UPC ${row.upc || index + 1}`),
      sort_title: normalizeText(row.title || row.name || row.upc),
      summary: normalizeText(row.summary || row.description),
      release_year: row.release_year ? Number(row.release_year) : null,
      media_format: normalizeText(row.media_format || row.format || 'DVD/Blu-ray'),
      genre: normalizeText(row.genre),
      director_names: normalizeText(row.director_names || row.director),
      actor_names: normalizeText(row.actor_names || row.actors),
      front_image_url: normalizeText(row.front_image_url || row.image_front || row.image || row.cover_front),
      back_image_url: normalizeText(row.back_image_url || row.image_back || row.cover_back),
      runtime_minutes: row.runtime_minutes ? Number(row.runtime_minutes) : null,
      studio_name: normalizeText(row.studio_name || row.studio),
      status: 'active', featured_rank: null, updated_at: null, source_record: row
    })).filter((row) => {
      if (!q) return true;
      const hay = [row.upc, row.title, row.summary, row.director_names, row.actor_names, row.genre, String(row.release_year || '')].join(' ').toLowerCase();
      return hay.includes(q);
    }).slice(0, limit);
  }

  return json({ ok: true, items, summary: { total_items: items.length, query: q, source: hasTable?.name === 'movie_catalog' ? 'd1-or-fallback' : 'legacy-json-fallback' } });
}
