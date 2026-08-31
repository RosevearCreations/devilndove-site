// Release 464 Update 2 — read-only orphaned-storage diagnostics.
// Lists bounded R2 object metadata and compares keys with D1 references. Never deletes or reads object bodies.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const MAX_LIMIT = 100;
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function tableExists(db, table) { try { return Boolean(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(table).first()); } catch { return false; } }
async function referenceSets(db) {
  const product = new Set();
  const caip = new Set();
  if (await tableExists(db, 'media_assets')) {
    for (const row of await safeAll(db, `SELECT object_key,storage_provider,bucket_name FROM media_assets WHERE COALESCE(object_key,'')<>''`)) {
      const key = normalizeText(row.object_key);
      const route = `${normalizeText(row.storage_provider)} ${normalizeText(row.bucket_name)}`.toLowerCase();
      if (!key) continue;
      if (route.includes('caip') || route.includes('private')) caip.add(key); else product.add(key);
    }
  }
  if (await tableExists(db, 'caip_media_upload_files')) {
    for (const row of await safeAll(db, `SELECT object_key FROM caip_media_upload_files WHERE COALESCE(object_key,'')<>'' AND LOWER(COALESCE(upload_status,''))<>'archived'`)) {
      const key = normalizeText(row.object_key); if (key) caip.add(key);
    }
  }
  if (await tableExists(db, 'creative_asset_technical_observations')) {
    for (const row of await safeAll(db, `SELECT object_key,storage_provider,bucket_name FROM creative_asset_technical_observations WHERE COALESCE(object_key,'')<>''`)) {
      const key = normalizeText(row.object_key);
      const route = `${normalizeText(row.storage_provider)} ${normalizeText(row.bucket_name)}`.toLowerCase();
      if (!key) continue;
      if (route.includes('caip') || route.includes('private')) caip.add(key); else product.add(key);
    }
  }
  return { product, caip };
}
function safeObject(object) {
  return { key: normalizeText(object?.key), size: Number(object?.size || 0), etag: normalizeText(object?.etag) || null, uploaded_at: object?.uploaded instanceof Date ? object.uploaded.toISOString() : normalizeText(object?.uploaded) || null };
}
async function scanBucket(bucket, references, label, limit, cursor) {
  if (!bucket || typeof bucket.list !== 'function') return { binding: label, available: false, scanned: 0, referenced_in_page: 0, orphan_candidates: [], orphan_candidate_count: 0, truncated: false, cursor: null, mutation_executed: false };
  const options = { limit }; if (cursor) options.cursor = cursor;
  const listing = await bucket.list(options);
  const objects = Array.isArray(listing?.objects) ? listing.objects : [];
  const orphanCandidates = []; let referenced = 0;
  for (const object of objects) {
    const item = safeObject(object); if (!item.key) continue;
    if (references.has(item.key)) referenced += 1; else orphanCandidates.push(item);
  }
  return { binding: label, available: true, scanned: objects.length, referenced_in_page: referenced, orphan_candidates: orphanCandidates, orphan_candidate_count: orphanCandidates.length, truncated: Boolean(listing?.truncated), cursor: normalizeText(listing?.cursor) || null, mutation_executed: false };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('limit') || 50);
  const limit = Math.max(1, Math.min(Number.isFinite(requested) ? Math.floor(requested) : 50, MAX_LIMIT));
  const productCursor = normalizeText(url.searchParams.get('product_cursor'));
  const caipCursor = normalizeText(url.searchParams.get('caip_cursor'));
  try {
    const refs = await referenceSets(db);
    const [product, caip] = await Promise.all([
      scanBucket(env.PRODUCT_MEDIA_BUCKET, refs.product, 'PRODUCT_MEDIA_BUCKET', limit, productCursor),
      scanBucket(env.CAIP_PRIVATE_MEDIA_BUCKET, refs.caip, 'CAIP_PRIVATE_MEDIA_BUCKET', limit, caipCursor)
    ]);
    return jsonResponse({ ok: true, release: 464, update: 2, generated_at: new Date().toISOString(), diagnostic_only: true, object_body_reads: false, r2_mutation_executed: false, r2_delete_available: false, provider_execution_active: false, reference_counts: { product: refs.product.size, caip: refs.caip.size }, buckets: { product, caip }, note: 'Orphan candidates are objects in this bounded R2 listing page with no known active D1 reference. Review before any future archive workflow; this endpoint cannot delete objects.' }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ ok: false, error: normalizeText(error?.message || error) || 'Storage orphan diagnostic failed.', diagnostic_only: true, r2_mutation_executed: false, r2_delete_available: false }, 500);
  }
}
