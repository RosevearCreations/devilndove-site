// Build 200 — public, read-only Workshop Journal / Gallery publication API.
import { getDb, jsonResponse } from './_lib/adminAudit.js';
import { publicContentPublications } from './_lib/contentPublications.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': status === 200 ? 'public, max-age=300, stale-while-revalidate=900' : 'no-store' });
}

async function hasTable(db) {
  try { return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='content_publications' LIMIT 1").first()); } catch { return false; }
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db || !(await hasTable(db))) return json({ ok: true, source: 'fallback', items: [], message: 'Published workshop stories will appear after the Build 200 migration and review.' });
  const url = new URL(context.request.url);
  const destination = String(url.searchParams.get('destination') || 'workshop_journal').toLowerCase();
  const slug = String(url.searchParams.get('story') || url.searchParams.get('slug') || '').trim();
  const limit = Math.max(1, Math.min(18, Number(url.searchParams.get('limit') || 9) || 9));
  try {
    const result = await publicContentPublications(db, { destination, slug, limit });
    if (slug && !result) return json({ ok: false, error: 'Published workshop story not found.' }, 404);
    return json({ ok: true, source: 'd1_content_publications', destination, item: slug ? result : null, items: slug ? [] : result, generated_at: new Date().toISOString() });
  } catch {
    return json({ ok: true, source: 'fallback', items: [], message: 'Published workshop stories are temporarily unavailable.' });
  }
}
