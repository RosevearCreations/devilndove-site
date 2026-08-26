// Devil n Dove Build 439 — read-only CAIP secure-review storage linkage diagnostic.
// Admin-only. Performs D1 reads and R2 HEAD requests only; never reads object bodies or mutates D1/R2/provider state.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { resolveCaipBucket } from '../_lib/caipMediaIntake.js';

const BUILD = 439;
function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
}
function integer(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max).trim() : clean;
}
function safeJson(value, fallback = {}) {
  try { return JSON.parse(String(value || '')); } catch { return fallback; }
}
function candidateKey(candidate) {
  return [candidate.storage_provider, candidate.bucket_alias, candidate.object_key].map((value) => text(value)).join('|');
}
function privateRoute(storageProvider, bucketAlias) {
  return text(storageProvider).toLowerCase() === 'r2_private_caip' || text(bucketAlias).toUpperCase() === 'CAIP_PRIVATE_MEDIA_BUCKET';
}
function headSummary(head) {
  if (!head) return null;
  return {
    key: text(head.key, 1200) || null,
    size: Number(head.size || 0) || 0,
    etag: text(head.etag, 300) || null,
    uploaded_at: head.uploaded instanceof Date ? head.uploaded.toISOString() : text(head.uploaded, 100) || null,
    content_type: text(head.httpMetadata?.contentType, 180) || null,
  };
}

async function diagnosticRows(db, projectId, assetId) {
  const asset = await db.prepare(`
    SELECT ca.creative_asset_id,ca.creative_project_id,ca.asset_key,ca.original_filename,ca.media_type,
           ca.source_url,ca.source_metadata_json,ca.media_asset_id,
           ma.storage_provider AS media_storage_provider,ma.bucket_name AS media_bucket_name,
           ma.object_key AS media_object_key,ma.file_size_bytes AS media_file_size_bytes,ma.mime_type AS media_mime_type
    FROM creative_assets ca
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    WHERE ca.creative_project_id=? AND ca.creative_asset_id=? LIMIT 1
  `).bind(projectId, assetId).first();
  if (!asset) throw new Error('CAIP asset not found for this project.');

  const upload = await db.prepare(`
    SELECT caip_media_upload_file_id,creative_asset_id,upload_status,storage_provider,bucket_alias,object_key,
           original_filename,mime_type,file_size_bytes,checksum_status,last_error,updated_at
    FROM caip_media_upload_files
    WHERE creative_project_id=? AND creative_asset_id=?
    ORDER BY caip_media_upload_file_id DESC LIMIT 1
  `).bind(projectId, assetId).first().catch(() => null);

  const observation = await db.prepare(`
    SELECT creative_asset_technical_observation_id,storage_provider,bucket_name,object_key,mime_type,file_size_bytes,
           probe_status,probe_scope,observed_at
    FROM creative_asset_technical_observations
    WHERE creative_project_id=? AND creative_asset_id=?
    ORDER BY observed_at DESC,creative_asset_technical_observation_id DESC LIMIT 1
  `).bind(projectId, assetId).first().catch(() => null);

  return { asset, upload, observation };
}

async function testCandidates(env, rows) {
  const meta = safeJson(rows.asset?.source_metadata_json, {});
  const candidates = [
    {
      source: 'media_assets',
      storage_provider: rows.asset?.media_storage_provider,
      bucket_alias: rows.asset?.media_bucket_name,
      object_key: rows.asset?.media_object_key,
    },
    {
      source: 'caip_media_upload_files',
      storage_provider: rows.upload?.storage_provider,
      bucket_alias: rows.upload?.bucket_alias,
      object_key: rows.upload?.object_key,
    },
    {
      source: 'creative_asset_source_metadata',
      storage_provider: meta.storage_provider,
      bucket_alias: meta.bucket_alias || meta.bucket_name,
      object_key: meta.object_key,
    },
    {
      source: 'creative_asset_technical_observations',
      storage_provider: rows.observation?.storage_provider,
      bucket_alias: rows.observation?.bucket_name,
      object_key: rows.observation?.object_key,
    },
  ].filter((candidate) => text(candidate.object_key));

  const seen = new Set();
  const results = [];
  for (const candidate of candidates) {
    const identity = candidateKey(candidate);
    if (seen.has(identity)) continue;
    seen.add(identity);
    const bucket = resolveCaipBucket(env, candidate.storage_provider, candidate.bucket_alias);
    const result = {
      ...candidate,
      binding_route: privateRoute(candidate.storage_provider, candidate.bucket_alias) ? 'CAIP_PRIVATE_MEDIA_BUCKET' : 'PRODUCT_MEDIA_BUCKET',
      binding_available: Boolean(bucket && typeof bucket.head === 'function'),
      exists: false,
      head: null,
      error: null,
    };
    if (result.binding_available) {
      try {
        const head = await bucket.head(candidate.object_key);
        result.exists = Boolean(head);
        result.head = headSummary(head);
      } catch (error) {
        result.error = text(error?.message || error, 900) || 'R2 HEAD failed.';
      }
    }
    results.push(result);
  }
  return results;
}

function classification(results) {
  if (!results.length) return 'no_recorded_r2_key';
  const media = results.find((item) => item.source === 'media_assets');
  if (media?.exists) return 'healthy_media_asset_binding';
  if (results.some((item) => item.exists)) return 'recoverable_metadata_drift';
  if (results.some((item) => item.binding_available)) return 'recorded_keys_missing_from_dev_r2';
  return 'r2_binding_unavailable';
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(request.url);
  const projectId = integer(url.searchParams.get('creative_project_id') || url.searchParams.get('project_id'));
  const assetId = integer(url.searchParams.get('creative_asset_id') || url.searchParams.get('asset_id'));
  if (!projectId || !assetId) return json({ ok: false, error: 'creative_project_id and creative_asset_id are required.' }, 400);

  try {
    const rows = await diagnosticRows(db, projectId, assetId);
    const candidates = await testCandidates(env, rows);
    return json({
      ok: true,
      build: BUILD,
      creative_project_id: projectId,
      creative_asset_id: assetId,
      classification: classification(candidates),
      source_media_unchanged: true,
      d1_mutation_executed: false,
      r2_body_read_executed: false,
      r2_mutation_executed: false,
      provider_execution_active: false,
      asset: {
        asset_key: rows.asset.asset_key,
        original_filename: rows.asset.original_filename,
        media_type: rows.asset.media_type,
        source_url_present: Boolean(text(rows.asset.source_url)),
        media_asset_id: integer(rows.asset.media_asset_id) || null,
      },
      upload: rows.upload ? {
        caip_media_upload_file_id: integer(rows.upload.caip_media_upload_file_id) || null,
        upload_status: rows.upload.upload_status,
        checksum_status: rows.upload.checksum_status,
        last_error: rows.upload.last_error || null,
      } : null,
      observation: rows.observation ? {
        creative_asset_technical_observation_id: integer(rows.observation.creative_asset_technical_observation_id) || null,
        probe_status: rows.observation.probe_status,
        probe_scope: rows.observation.probe_scope,
        observed_at: rows.observation.observed_at,
      } : null,
      candidates,
    });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'caip_evidence_storage_diagnostic',
      incident_code: 'caip_evidence_storage_diagnostic_failed',
      severity: 'warning',
      message: error?.message || 'CAIP storage diagnostic failed.',
      related_user_id: adminUser.user_id,
      details: { creative_project_id: projectId, creative_asset_id: assetId, read_only: true, error: String(error?.message || error) },
    });
    return json({ ok: false, error: error?.message || 'CAIP storage diagnostic failed.' }, 400);
  }
}
