// File: /functions/api/admin/media-assets.js
// Brief description: Browses and manages uploaded media assets stored in R2 so admin can
// inspect product-linked assets, soft delete them, and reuse uploaded media in product workflows.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function normalizeText(value) { return String(value || '').trim(); }
function getDb(env) { return env.DB || env.DD_DB; }
function getBearerToken(request) { const authHeader = request.headers.get('Authorization') || ''; const match = authHeader.match(/^Bearer\s+(.+)$/i); return match ? String(match[1] || '').trim() : ''; }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
async function getAdminUserFromRequest(request, env) {
  const db = getDb(env); const token = getBearerToken(request); if (!token || !db) return null;
  const session = await db.prepare(`SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active FROM sessions s INNER JOIN users u ON u.user_id = s.user_id WHERE (s.session_token = ? OR s.token = ?) AND s.expires_at > datetime('now') LIMIT 1`).bind(token, token).first();
  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
  return { user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '' };
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const includeDeleted = Number(url.searchParams.get('include_deleted') || 0) === 1 ? 1 : 0;
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 50)));
  const rows = normalizeResults(await db.prepare(`
    SELECT ma.media_asset_id, ma.product_id, ma.storage_provider, ma.bucket_name, ma.object_key, ma.public_url,
           ma.original_filename, ma.mime_type, ma.file_size_bytes, ma.variant_role, ma.sort_order,
           ma.annotation_notes, ma.created_at, ma.updated_at, ma.deleted_at,
           p.name AS product_name
    FROM media_assets ma
    LEFT JOIN products p ON p.product_id = ma.product_id
    WHERE (? = 0 OR ma.product_id = ?)
      AND (? = 1 OR ma.deleted_at IS NULL)
      AND (
        ? = ''
        OR LOWER(COALESCE(ma.original_filename,'')) LIKE ?
        OR LOWER(COALESCE(ma.object_key,'')) LIKE ?
        OR LOWER(COALESCE(ma.annotation_notes,'')) LIKE ?
        OR LOWER(COALESCE(p.name,'')) LIKE ?
      )
    ORDER BY COALESCE(ma.sort_order, 999999) ASC, ma.created_at DESC, ma.media_asset_id DESC
    LIMIT ?
  `).bind(productId, productId, includeDeleted, q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, limit).all());
  return json({ ok: true, requested_by: adminUser, assets: rows.map((row) => ({
    media_asset_id: Number(row.media_asset_id || 0),
    product_id: row.product_id == null ? null : Number(row.product_id),
    product_name: row.product_name || null,
    storage_provider: row.storage_provider || 'r2',
    bucket_name: row.bucket_name || null,
    object_key: row.object_key || '',
    public_url: row.public_url || null,
    original_filename: row.original_filename || '',
    mime_type: row.mime_type || '',
    file_size_bytes: Number(row.file_size_bytes || 0),
    variant_role: row.variant_role || null,
    sort_order: Number(row.sort_order || 0),
    annotation_notes: row.annotation_notes || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    deleted_at: row.deleted_at || null
  })) });
}
export async function onRequestPatch(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const mediaAssetId = Number(body.media_asset_id || 0);
  if (!Number.isInteger(mediaAssetId) || mediaAssetId <= 0) return json({ ok: false, error: 'A valid media_asset_id is required.' }, 400);
  await db.prepare(`UPDATE media_assets SET product_id = ?, variant_role = ?, sort_order = ?, annotation_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE media_asset_id = ?`).bind(
    body.product_id == null || body.product_id === '' ? null : Number(body.product_id),
    normalizeText(body.variant_role) || null,
    Number(body.sort_order || 0),
    normalizeText(body.annotation_notes) || null,
    mediaAssetId
  ).run();
  return json({ ok: true, message: 'Media asset updated.', media_asset_id: mediaAssetId });
}
export async function onRequestDelete(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const mediaAssetId = Number(url.searchParams.get('media_asset_id') || 0);
  if (!Number.isInteger(mediaAssetId) || mediaAssetId <= 0) return json({ ok: false, error: 'A valid media_asset_id is required.' }, 400);
  const asset = await db.prepare(`SELECT media_asset_id, object_key FROM media_assets WHERE media_asset_id = ? LIMIT 1`).bind(mediaAssetId).first();
  if (!asset) return json({ ok: false, error: 'Media asset not found.' }, 404);
  const bucket = env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
  if (bucket && typeof bucket.delete === 'function' && asset.object_key) {
    try { await bucket.delete(asset.object_key); } catch {}
  }
  await db.prepare(`UPDATE media_assets SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE media_asset_id = ?`).bind(mediaAssetId).run();
  return json({ ok: true, message: 'Media asset deleted.', media_asset_id: mediaAssetId });
}
