// File: /functions/api/seo-page-overrides.js
// Brief description: Public read endpoint for reviewed SEO page overrides.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' } });
}
function clean(value) { return String(value || '').trim(); }
function normalizePath(value, fallbackUrl) {
  const raw = clean(value);
  try {
    const url = new URL(raw || fallbackUrl, fallbackUrl);
    let path = url.pathname || '/';
    if (!path.endsWith('/') && !path.includes('.')) path += '/';
    return path || '/';
  } catch {
    return raw.startsWith('/') ? raw : '/';
  }
}

export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  const url = new URL(context.request.url);
  const pagePath = normalizePath(url.searchParams.get('path') || url.searchParams.get('page_url') || '/', context.request.url);
  if (!db) return json({ ok: true, authority: 'fallback_empty', override: null });
  const row = await db.prepare(`
    SELECT seo_page_override_id, page_path, page_url, title, meta_description, h1_suggestion, internal_link_note,
           status, source_action_key, reviewed_by_user_id, applied_at, updated_at
    FROM seo_page_overrides
    WHERE page_path=? AND status IN ('approved','applied')
    ORDER BY CASE status WHEN 'applied' THEN 0 ELSE 1 END, datetime(updated_at) DESC
    LIMIT 1
  `).bind(pagePath).first().catch(() => null);
  if (!row) return json({ ok: true, authority: 'd1_seo_page_overrides', override: null, page_path: pagePath });
  return json({ ok: true, authority: 'd1_seo_page_overrides', page_path: pagePath, override: {
    seo_page_override_id: Number(row.seo_page_override_id || 0),
    page_path: row.page_path || pagePath,
    page_url: row.page_url || '',
    title: row.title || '',
    meta_description: row.meta_description || '',
    h1_suggestion: row.h1_suggestion || '',
    internal_link_note: row.internal_link_note || '',
    status: row.status || 'approved',
    source_action_key: row.source_action_key || '',
    applied_at: row.applied_at || null,
    updated_at: row.updated_at || null
  }});
}
