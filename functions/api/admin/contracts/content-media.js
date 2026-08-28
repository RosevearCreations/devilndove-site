// Current-release Content-owned implementation of the content-media module contract.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../../_lib/adminAudit.js';

const RELEASE = 448;

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function boundedInt(value, fallback = 48, max = 72) {
  const n = Number(value);
  return Math.max(1, Math.min(max, Number.isFinite(n) ? Math.trunc(n) : fallback));
}
function safeJson(value, fallback = []) { try { const parsed = JSON.parse(String(value || '')); return parsed ?? fallback; } catch { return fallback; } }
function versionUrl(url, updatedAt) {
  const value = String(url || '');
  if (!value) return null;
  const stamp = String(updatedAt || '').replace(/[^0-9]/g, '').slice(0, 14);
  return stamp ? `${value}${value.includes('?') ? '&' : '?'}v=${stamp}` : value;
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, release: RELEASE, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, release: RELEASE, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const mediaType = normalizeText(url.searchParams.get('media_type')).toLowerCase();
  const limit = boundedInt(url.searchParams.get('limit'));
  const like = `%${q}%`;

  try {
    const result = await db.prepare(`
      SELECT ma.media_asset_id,ma.object_key,ma.public_url,ma.original_filename,ma.mime_type,ma.width_px,ma.height_px,ma.updated_at,
             mm.display_name,mm.alt_text,mm.image_title,mm.caption,mm.description,mm.tags_json,mm.media_type,mm.source_type
      FROM media_assets ma
      LEFT JOIN managed_media_metadata mm ON mm.media_asset_id=ma.media_asset_id
      WHERE ma.deleted_at IS NULL
        AND ma.product_id IS NULL
        AND mm.archived_at IS NULL
        AND LOWER(COALESCE(mm.media_type,'photo')) <> 'product'
        AND LOWER(COALESCE(mm.source_type,'')) NOT IN ('product','products','inventory','supply','supplies','tool','tools')
        AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'products/%'
        AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'inventory/%'
        AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'supplies/%'
        AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'tools/%'
        AND LOWER(COALESCE(ma.object_key,'')) NOT LIKE 'toolshed/%'
        AND (?='' OR LOWER(COALESCE(mm.media_type,'photo'))=?)
        AND (?='' OR LOWER(COALESCE(mm.display_name,ma.original_filename,ma.object_key,'')) LIKE ? OR LOWER(COALESCE(mm.alt_text,'')) LIKE ? OR LOWER(COALESCE(mm.tags_json,'')) LIKE ?)
      ORDER BY ma.media_asset_id DESC
      LIMIT ?
    `).bind(mediaType, mediaType, q, like, like, like, limit).all();

    const media = rows(result).map((row) => ({
      media_asset_id: Number(row.media_asset_id || 0),
      object_key: row.object_key || '',
      public_url: versionUrl(row.public_url, row.updated_at),
      original_filename: row.original_filename || '',
      mime_type: row.mime_type || '',
      width_px: row.width_px == null ? null : Number(row.width_px || 0),
      height_px: row.height_px == null ? null : Number(row.height_px || 0),
      display_name: row.display_name || row.original_filename || row.object_key || '',
      alt_text: row.alt_text || '',
      image_title: row.image_title || '',
      caption: row.caption || '',
      description: row.description || '',
      tags: safeJson(row.tags_json, []),
      media_type: row.media_type || 'photo',
      source_type: row.source_type || '',
    }));
    return json({ ok: true, release: RELEASE, contract: 'content-media', owner: 'content', requested_by: adminUser, media, count: media.length });
  } catch (error) {
    return json({ ok: false, release: RELEASE, contract: 'content-media', error: 'Content media contract failed.', error_code: 'content_media_read_failed', detail: String(error?.message || error) }, 500);
  }
}
