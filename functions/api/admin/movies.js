import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function safeInt(value) { if (value == null || value === "") return null; const num = Number(value); return Number.isInteger(num) ? num : null; }
function slugify(value) { return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function asMovie(row) { return {
  movie_catalog_id: Number(row.movie_catalog_id || 0),
  upc: normalizeText(row.upc),
  slug: normalizeText(row.slug),
  title: normalizeText(row.title),
  sort_title: normalizeText(row.sort_title),
  summary: normalizeText(row.summary),
  release_year: safeInt(row.release_year),
  media_format: normalizeText(row.media_format),
  genre: normalizeText(row.genre),
  director_names: normalizeText(row.director_names),
  actor_names: normalizeText(row.actor_names),
  front_image_url: normalizeText(row.front_image_url),
  back_image_url: normalizeText(row.back_image_url),
  runtime_minutes: safeInt(row.runtime_minutes),
  studio_name: normalizeText(row.studio_name),
  trailer_url: normalizeText(row.trailer_url),
  imdb_id: normalizeText(row.imdb_id),
  alternate_identifier: normalizeText(row.alternate_identifier),
  metadata_status: normalizeText(row.metadata_status || 'pending'),
  collection_notes: normalizeText(row.collection_notes),
  status: normalizeText(row.status || 'draft'),
  featured_rank: row.featured_rank == null || row.featured_rank === '' ? null : Number(row.featured_rank),
  updated_at: row.updated_at || null
}; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 200);
  const like = `%${q}%`;
  const rows = await db.prepare(`SELECT movie_catalog_id, upc, slug, title, sort_title, summary, release_year, media_format, genre, director_names, actor_names, front_image_url, back_image_url, runtime_minutes, studio_name, trailer_url, imdb_id, alternate_identifier, metadata_status, collection_notes, status, featured_rank, updated_at FROM movie_catalog WHERE (? = '' OR LOWER(COALESCE(title,'')) LIKE ? OR LOWER(COALESCE(upc,'')) LIKE ? OR LOWER(COALESCE(imdb_id,'')) LIKE ? OR LOWER(COALESCE(actor_names,'')) LIKE ? OR LOWER(COALESCE(alternate_identifier,'')) LIKE ?) ORDER BY LOWER(COALESCE(sort_title,title,upc,'')) ASC LIMIT ?`).bind(q, like, like, like, like, like, limit).all().catch(() => ({ results: [] }));
  return json({ ok: true, items: (rows.results || []).map(asMovie), summary: { count: (rows.results || []).length, query: q } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const movieCatalogId = safeInt(body.movie_catalog_id);
  const currentRow = movieCatalogId ? await db.prepare(`SELECT upc, slug FROM movie_catalog WHERE movie_catalog_id=? LIMIT 1`).bind(movieCatalogId).first().catch(() => null) : null;
  const upc = normalizeText(body.upc) || normalizeText(currentRow?.upc);
  const title = normalizeText(body.title);
  const imdbId = normalizeText(body.imdb_id);
  const alternateIdentifier = normalizeText(body.alternate_identifier);
  if (!upc && !imdbId && !alternateIdentifier && !title) return json({ ok: false, error: 'Add at least a title, UPC, IMDb id, or alternate identifier.' }, 400);
  const slug = normalizeText(body.slug) || normalizeText(currentRow?.slug) || slugify(title || upc || imdbId || alternateIdentifier || 'movie');
  const resolvedUpc = upc || alternateIdentifier || imdbId || `draft-${Date.now()}`;
  const values = [resolvedUpc, slug, title || null, normalizeText(body.sort_title) || title || resolvedUpc || null, normalizeText(body.summary) || null, safeInt(body.release_year), normalizeText(body.media_format) || null, normalizeText(body.genre) || null, normalizeText(body.director_names) || null, normalizeText(body.actor_names) || null, normalizeText(body.front_image_url) || null, normalizeText(body.back_image_url) || null, safeInt(body.runtime_minutes), normalizeText(body.studio_name) || null, normalizeText(body.trailer_url) || null, imdbId || null, alternateIdentifier || null, normalizeText(body.metadata_status || 'contributed') || 'contributed', normalizeText(body.collection_notes) || null, ['active','draft','archived'].includes(normalizeText(body.status).toLowerCase()) ? normalizeText(body.status).toLowerCase() : 'draft', body.featured_rank == null || body.featured_rank === '' ? null : Number(body.featured_rank)];
  let resultId = movieCatalogId || 0;
  if (movieCatalogId) {
    await db.prepare(`UPDATE movie_catalog SET upc=?, slug=?, title=?, sort_title=?, summary=?, release_year=?, media_format=?, genre=?, director_names=?, actor_names=?, front_image_url=?, back_image_url=?, runtime_minutes=?, studio_name=?, trailer_url=?, imdb_id=?, alternate_identifier=?, metadata_status=?, collection_notes=?, status=?, featured_rank=?, updated_at=CURRENT_TIMESTAMP WHERE movie_catalog_id=?`).bind(...values, movieCatalogId).run();
  } else {
    const insert = await db.prepare(`INSERT INTO movie_catalog (upc, slug, title, sort_title, summary, release_year, media_format, genre, director_names, actor_names, front_image_url, back_image_url, runtime_minutes, studio_name, trailer_url, imdb_id, alternate_identifier, metadata_status, collection_notes, status, featured_rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(...values).run();
    resultId = Number(insert?.meta?.last_row_id || 0);
  }
  const saved = await db.prepare(`SELECT movie_catalog_id, upc, slug, title, sort_title, summary, release_year, media_format, genre, director_names, actor_names, front_image_url, back_image_url, runtime_minutes, studio_name, trailer_url, imdb_id, alternate_identifier, metadata_status, collection_notes, status, featured_rank, updated_at FROM movie_catalog WHERE movie_catalog_id=? LIMIT 1`).bind(resultId).first();
  await auditAdminAction(env, request, adminUser, { action_type: movieCatalogId ? 'movie_update' : 'movie_create', target_type: 'movie_catalog', target_id: resultId, target_key: upc || imdbId || alternateIdentifier || title, details: { title, upc, imdb_id: imdbId, metadata_status: normalizeText(body.metadata_status || 'contributed') || 'contributed' } });
  return json({ ok: true, item: asMovie(saved), message: movieCatalogId ? 'Movie details updated.' : 'Movie draft saved.' });
}
