import { resolveCaipBucket } from './caipMediaIntake.js';
// Build 202 — CAIP media verification, safe derivative planning, and secure review helpers.
// This module is deliberately provider-neutral. It can inspect catalog/R2 object metadata and
// plan immutable derivative work, but it never copies, transforms, publishes, or deletes source media.

export const CAIP_OPERATIONS_BUILD = 'Build 202';
export const CAIP_PROBE_KEY = 'metadata_r2_head_v1';

function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max).trim() : clean;
}
function numeric(value) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : 0; }
function integer(value) { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function safeJson(value, fallback = {}) { try { return JSON.parse(String(value || '')); } catch { return fallback; } }
function clip(value, max) { const clean = text(value).replace(/\s+/g, ' '); return !clean || clean.length <= max ? clean : `${clean.slice(0, Math.max(1, max - 1)).trim()}…`; }
function nowKey() { return new Date().toISOString().replace(/[-:.TZ]/g, ''); }
function stableHash(value) { let hash = 2166136261; for (const char of String(value || '')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); }
function normalizedMime(value) { const clean = text(value, 180).toLowerCase(); return clean || null; }
function cleanFilename(value) { return text(value || 'review-asset', 180).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'review-asset'; }
function orientation(width, height, source = '') {
  const explicit = text(source).toLowerCase();
  if (['portrait', 'landscape', 'square'].includes(explicit)) return explicit;
  if (width && height) return width === height ? 'square' : width > height ? 'landscape' : 'portrait';
  return 'unknown';
}
function boundedNumber(value, min, max, fallback) {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}
function normalizeRecipeTemplate(value) {
  const key = text(value).toLowerCase();
  return DERIVATIVE_TEMPLATES[key] ? key : 'website_gallery_webp';
}
function normalizeRecipeStatus(value) {
  const key = text(value).toLowerCase();
  return ['draft', 'approved_internal', 'retired'].includes(key) ? key : 'draft';
}
function normalizeDerivativeStatus(value) {
  const key = text(value).toLowerCase();
  return ['planned', 'approved_plan', 'queued_for_provider', 'rendering', 'ready_for_review', 'verified', 'rejected', 'failed', 'archived'].includes(key) ? key : 'planned';
}

export const DERIVATIVE_TEMPLATES = {
  website_gallery_webp: {
    label: 'Website gallery WebP plan', output_role: 'website_gallery', output_format: 'image/webp',
    width: 1600, height: 2000, aspect_ratio: '4:5',
    transformations: ['manual crop review required', 'resize only after approved provider is connected', 'encode WebP after output verification'],
    policy: { public_release_requires_source_rights: true, review_before_render: true, no_source_overwrite: true }
  },
  social_vertical_mp4: {
    label: 'Vertical social video plan', output_role: 'short_video', output_format: 'video/mp4',
    width: 1080, height: 1920, aspect_ratio: '9:16',
    transformations: ['select approved clips only', 'edit with reviewed captions/template', 'render through future verified provider'],
    policy: { public_release_requires_source_rights: true, review_before_render: true, no_source_overwrite: true, disclosure_review: true }
  },
  youtube_thumbnail_webp: {
    label: 'YouTube thumbnail plan', output_role: 'youtube_thumbnail', output_format: 'image/webp',
    width: 1280, height: 720, aspect_ratio: '16:9',
    transformations: ['manual title and visual truth check', 'crop review required', 'encode only through approved provider'],
    policy: { public_release_requires_source_rights: true, review_before_render: true, no_source_overwrite: true, no_unsubstantiated_text: true }
  },
  internal_review_preview_webp: {
    label: 'Internal review preview plan', output_role: 'internal_review_preview', output_format: 'image/webp',
    width: 1200, height: 1200, aspect_ratio: '1:1',
    transformations: ['internal review only', 'no public URL until separately approved', 'encode only through approved provider'],
    policy: { public_release_requires_source_rights: false, review_before_render: true, no_source_overwrite: true, internal_only_default: true }
  }
};

async function writeProjectEvent(db, projectId, eventType, actorUserId, details = {}) {
  await db.prepare(`INSERT INTO creative_project_events (creative_project_id, event_type, actor_user_id, details_json, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(integer(projectId), text(eventType, 120), integer(actorUserId) || null, JSON.stringify(details || {})).run().catch(() => null);
}

async function writeAccessAudit(db, grantId, eventType, actorUserId, outcome, details = {}) {
  await db.prepare(`INSERT INTO creative_asset_access_audit (
    creative_asset_access_grant_id, event_type, actor_user_id, outcome, details_json, created_at
  ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(
    integer(grantId) || null, text(eventType, 120), integer(actorUserId) || null, text(outcome, 60) || 'recorded', JSON.stringify(details || {})
  ).run().catch(() => null);
}

async function sourceForAsset(db, creativeProjectId, creativeAssetId) {
  const base = await db.prepare(`
    SELECT ca.*, cp.product_id AS project_product_id, cp.creative_project_key,
      ma.object_key AS direct_object_key, ma.bucket_name AS direct_bucket_name,
      ma.storage_provider AS direct_storage_provider, ma.file_size_bytes AS direct_file_size_bytes,
      ma.public_url AS direct_public_url, ma.mime_type AS direct_mime_type,
      ma.width_px AS direct_width_px, ma.height_px AS direct_height_px,
      ma.image_orientation AS direct_orientation, ma.original_filename AS direct_original_filename
    FROM creative_assets ca
    INNER JOIN creative_projects cp ON cp.creative_project_id=ca.creative_project_id
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    WHERE ca.creative_project_id=? AND ca.creative_asset_id=? LIMIT 1
  `).bind(integer(creativeProjectId), integer(creativeAssetId)).first();
  if (!base) throw new Error('CAIP asset record not found.');
  let fallback = null;
  if (!text(base.direct_object_key) && integer(base.project_product_id) && text(base.source_url)) {
    fallback = await db.prepare(`
      SELECT media_asset_id, object_key, bucket_name, storage_provider, file_size_bytes, public_url,
        mime_type, width_px, height_px, image_orientation, original_filename
      FROM media_assets
      WHERE product_id=? AND public_url=?
      ORDER BY media_asset_id DESC LIMIT 1
    `).bind(integer(base.project_product_id), text(base.source_url)).first().catch(() => null);
  }
  const source = fallback || {};
  return {
    ...base,
    source_object_key: text(base.direct_object_key || source.object_key),
    source_bucket_name: text(base.direct_bucket_name || source.bucket_name),
    source_storage_provider: text(base.direct_storage_provider || source.storage_provider || 'catalog_reference'),
    source_file_size_bytes: numeric(base.direct_file_size_bytes || source.file_size_bytes),
    source_mime_type: normalizedMime(base.direct_mime_type || source.mime_type || base.mime_type),
    source_width_px: numeric(base.direct_width_px || source.width_px),
    source_height_px: numeric(base.direct_height_px || source.height_px),
    source_orientation: text(base.direct_orientation || source.image_orientation),
    source_original_filename: text(base.direct_original_filename || source.original_filename || base.original_filename)
  };
}

function probeMetadataFromAsset(asset) {
  const sourceMetadata = safeJson(asset.source_metadata_json, {});
  const width = numeric(asset.source_width_px || sourceMetadata.source_width_px || sourceMetadata.width_px);
  const height = numeric(asset.source_height_px || sourceMetadata.source_height_px || sourceMetadata.height_px);
  const knownMime = normalizedMime(asset.source_mime_type || sourceMetadata.mime_type || asset.mime_type);
  return {
    width_px: width || null,
    height_px: height || null,
    orientation: orientation(width, height, asset.source_orientation || sourceMetadata.image_orientation),
    mime_type: knownMime,
    bytes: numeric(asset.source_file_size_bytes || sourceMetadata.file_size_bytes || sourceMetadata.size_bytes) || null,
    duration_seconds: numeric(sourceMetadata.duration_seconds || sourceMetadata.duration) || null,
    codec: text(sourceMetadata.codec || sourceMetadata.video_codec, 120) || null,
    source_metadata: sourceMetadata
  };
}

function safeHeadSummary(head = {}) {
  const http = head?.httpMetadata || {};
  const custom = head?.customMetadata || {};
  return {
    etag: text(head?.etag, 240) || null,
    bytes: numeric(head?.size) || null,
    uploaded_at: head?.uploaded instanceof Date ? head.uploaded.toISOString() : text(head?.uploaded, 80) || null,
    http_metadata: {
      content_type: text(http.contentType, 180) || null,
      cache_control: text(http.cacheControl, 240) || null,
      content_language: text(http.contentLanguage, 80) || null
    },
    custom_metadata: {
      original_name: text(custom.original_name, 500) || null,
      product_id: text(custom.product_id, 80) || null,
      variant_role: text(custom.variant_role, 120) || null,
      upload_scope: text(custom.upload_scope, 120) || null
    }
  };
}

export async function ensureCreativeAssetOperationsSchema(db) {
  // Build 241: schema is migration-owned. Runtime requests verify; they never create tables, indexes, or provider rows.
  try {
    await db.prepare(`SELECT creative_asset_probe_job_id FROM creative_asset_probe_jobs LIMIT 1`).all();
    await db.prepare(`SELECT creative_asset_technical_observation_id FROM creative_asset_technical_observations LIMIT 1`).all();
    await db.prepare(`SELECT creative_derivative_recipe_id FROM creative_derivative_recipes LIMIT 1`).all();
    await db.prepare(`SELECT creative_asset_access_grant_id FROM creative_asset_access_grants LIMIT 1`).all();
    await db.prepare(`SELECT creative_provider_profile_id FROM creative_provider_profiles LIMIT 1`).all();
  } catch {
    throw new Error('CAIP media-operations schema is not installed. Back up D1 and apply the current migration chain through Build 241 before using probes, derivative plans, or secure review.');
  }
}

export async function probeCreativeAsset(db, env, creativeProjectId, creativeAssetId, actorUserId) {
  await ensureCreativeAssetOperationsSchema(db);
  const asset = await sourceForAsset(db, creativeProjectId, creativeAssetId);
  const jobKey = `probe-${asset.creative_asset_id}-${nowKey()}-${stableHash(asset.source_fingerprint)}`;
  const input = {
    asset_key: asset.asset_key, source_url_present: Boolean(text(asset.source_url)),
    r2_object_key_present: Boolean(text(asset.source_object_key)), requested_scope: 'metadata_and_bound_r2_head_only',
    no_binary_read: true, no_transformation: true
  };
  const inserted = await db.prepare(`INSERT INTO creative_asset_probe_jobs (
    creative_project_id, creative_asset_id, job_key, probe_mode, job_status, source_snapshot_fingerprint,
    attempt_count, max_attempts, input_summary_json, requested_by_user_id, started_at, created_at, updated_at
  ) VALUES (?, ?, ?, 'metadata_r2_head', 'running', ?, 1, 3, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    asset.creative_project_id, asset.creative_asset_id, jobKey, asset.source_fingerprint, JSON.stringify(input), integer(actorUserId) || null
  ).run();
  const jobId = integer(inserted?.meta?.last_row_id);
  const base = probeMetadataFromAsset(asset);
  let headSummary = null;
  let probeStatus = 'metadata_only';
  let probeScope = 'catalog_metadata_only';
  let errorText = null;
  const bucket = resolveCaipBucket(env, asset.source_storage_provider, asset.source_bucket_name);
  try {
    if (text(asset.source_object_key) && bucket && typeof bucket.head === 'function') {
      const head = await bucket.head(asset.source_object_key);
      if (head) {
        headSummary = safeHeadSummary(head);
        probeStatus = 'complete';
        probeScope = 'catalog_metadata_and_r2_object_head';
      } else {
        probeStatus = 'missing';
        probeScope = 'catalog_metadata_and_r2_object_head';
        errorText = 'Bound R2 object was not found. Source media was not changed.';
      }
    } else if (text(asset.source_object_key)) {
      probeStatus = 'metadata_only';
      probeScope = 'catalog_metadata_only_r2_binding_unavailable';
      errorText = 'R2 binding is unavailable in this environment; only catalog metadata was recorded.';
    } else {
      probeStatus = 'metadata_only';
      probeScope = 'catalog_metadata_only_no_bound_object';
      errorText = 'No bound R2 object key is recorded for this source; no external URL was fetched.';
    }
  } catch (error) {
    probeStatus = 'partial';
    probeScope = 'catalog_metadata_with_r2_head_error';
    errorText = clip(error?.message || 'R2 metadata probe failed.', 900);
  }
  const observedMime = normalizedMime(headSummary?.http_metadata?.content_type || base.mime_type);
  const observedBytes = numeric(headSummary?.bytes || base.bytes) || null;
  const evidence = {
    build: CAIP_OPERATIONS_BUILD,
    no_binary_read: true,
    no_external_url_fetch: true,
    no_source_mutation: true,
    source_metadata: {
      width_px: base.width_px, height_px: base.height_px, orientation: base.orientation,
      duration_seconds: base.duration_seconds, codec: base.codec
    },
    r2_head: headSummary,
    r2_object_key_present: Boolean(text(asset.source_object_key)),
    r2_binding_available: Boolean(bucket && typeof bucket.head === 'function')
  };
  await db.prepare(`INSERT INTO creative_asset_technical_observations (
    creative_project_id, creative_asset_id, observation_key, creative_asset_probe_job_id, source_snapshot_fingerprint,
    storage_provider, bucket_name, object_key, observed_public_url, mime_type, file_size_bytes, etag, uploaded_at,
    width_px, height_px, orientation, duration_seconds, codec, probe_status, probe_scope, evidence_json, observed_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(creative_asset_id, observation_key) DO UPDATE SET
    creative_asset_probe_job_id=excluded.creative_asset_probe_job_id, source_snapshot_fingerprint=excluded.source_snapshot_fingerprint,
    storage_provider=excluded.storage_provider, bucket_name=excluded.bucket_name, object_key=excluded.object_key,
    observed_public_url=excluded.observed_public_url, mime_type=excluded.mime_type, file_size_bytes=excluded.file_size_bytes,
    etag=excluded.etag, uploaded_at=excluded.uploaded_at, width_px=excluded.width_px, height_px=excluded.height_px,
    orientation=excluded.orientation, duration_seconds=excluded.duration_seconds, codec=excluded.codec,
    probe_status=excluded.probe_status, probe_scope=excluded.probe_scope, evidence_json=excluded.evidence_json,
    observed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP`).bind(
    asset.creative_project_id, asset.creative_asset_id, CAIP_PROBE_KEY, jobId || null, asset.source_fingerprint,
    text(asset.source_storage_provider, 120) || 'catalog_reference', text(asset.source_bucket_name, 180) || null,
    text(asset.source_object_key, 1000) || null, text(asset.source_url, 1600) || null, observedMime,
    observedBytes, headSummary?.etag || null, headSummary?.uploaded_at || null,
    base.width_px, base.height_px, base.orientation, base.duration_seconds, base.codec,
    probeStatus, probeScope, JSON.stringify(evidence)
  ).run();
  const observation = await db.prepare(`SELECT * FROM creative_asset_technical_observations WHERE creative_asset_id=? AND observation_key=? LIMIT 1`).bind(asset.creative_asset_id, CAIP_PROBE_KEY).first();
  await db.prepare(`UPDATE creative_asset_probe_jobs SET job_status=?, output_summary_json=?, error_text=?, completed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE creative_asset_probe_job_id=?`).bind(
    ['complete', 'metadata_only'].includes(probeStatus) ? 'completed' : probeStatus === 'partial' ? 'partial' : 'failed',
    JSON.stringify({ probe_status: probeStatus, probe_scope: probeScope, observation_id: observation?.creative_asset_technical_observation_id || null, no_binary_read: true }),
    errorText, jobId || null
  ).run().catch(() => null);
  await writeProjectEvent(db, asset.creative_project_id, 'caip_asset_technical_probe_completed', actorUserId, {
    creative_asset_id: asset.creative_asset_id, probe_status: probeStatus, probe_scope: probeScope,
    object_key_present: Boolean(text(asset.source_object_key)), no_binary_read: true, no_source_mutation: true
  });
  return { asset, observation, probe_status: probeStatus, probe_scope: probeScope, warning: errorText || null };
}

export async function createDerivativePlan(db, creativeProjectId, creativeAssetId, templateKey, actorUserId) {
  await ensureCreativeAssetOperationsSchema(db);
  const asset = await sourceForAsset(db, creativeProjectId, creativeAssetId);
  if (text(asset.asset_status).toLowerCase() !== 'active') throw new Error('Only active CAIP assets can receive a derivative plan.');
  if (text(asset.rights_status).toLowerCase() === 'blocked') throw new Error('Blocked media cannot receive a derivative plan. Resolve the source restriction first.');
  const template = DERIVATIVE_TEMPLATES[normalizeRecipeTemplate(templateKey)];
  const recipeKey = `${asset.asset_key}-${normalizeRecipeTemplate(templateKey)}-${stableHash(asset.source_fingerprint)}`.slice(0, 180);
  const recipePayload = {
    template_key: normalizeRecipeTemplate(templateKey), template_label: template.label,
    operations: template.transformations, source_asset_key: asset.asset_key,
    source_snapshot_fingerprint: asset.source_fingerprint,
    render_contract: 'plan_only_no_provider_execution_in_build_202',
    no_source_overwrite: true, no_source_delete: true
  };
  const recipeHash = stableHash(JSON.stringify(recipePayload));
  await db.prepare(`INSERT INTO creative_derivative_recipes (
    creative_project_id, creative_asset_id, recipe_key, recipe_name, output_role, output_format,
    target_width_px, target_height_px, aspect_ratio, transformation_json, source_policy_json, recipe_hash,
    recipe_status, is_immutable, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(creative_project_id, recipe_key) DO NOTHING`).bind(
    asset.creative_project_id, asset.creative_asset_id, recipeKey, template.label, template.output_role, template.output_format,
    template.width, template.height, template.aspect_ratio, JSON.stringify(recipePayload), JSON.stringify(template.policy), recipeHash,
    integer(actorUserId) || null
  ).run();
  const recipe = await db.prepare(`SELECT * FROM creative_derivative_recipes WHERE creative_project_id=? AND recipe_key=? LIMIT 1`).bind(asset.creative_project_id, recipeKey).first();
  const derivativeKey = `planned-${recipe.recipe_key}-${stableHash(asset.source_fingerprint)}`.slice(0, 220);
  await db.prepare(`INSERT INTO creative_asset_derivatives (
    creative_project_id, creative_asset_id, creative_derivative_recipe_id, derivative_key, derivative_status,
    source_snapshot_fingerprint, verification_status, verification_evidence_json, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, ?, 'planned', ?, 'not_created', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(derivative_key) DO UPDATE SET updated_at=CURRENT_TIMESTAMP`).bind(
    asset.creative_project_id, asset.creative_asset_id, recipe.creative_derivative_recipe_id, derivativeKey,
    asset.source_fingerprint, JSON.stringify({ plan_only: true, no_output_created: true, no_provider_execution: true }), integer(actorUserId) || null
  ).run();
  const derivative = await db.prepare(`SELECT * FROM creative_asset_derivatives WHERE derivative_key=? LIMIT 1`).bind(derivativeKey).first();
  await writeProjectEvent(db, asset.creative_project_id, 'caip_derivative_plan_created', actorUserId, {
    creative_asset_id: asset.creative_asset_id, creative_derivative_recipe_id: recipe.creative_derivative_recipe_id,
    creative_asset_derivative_id: derivative?.creative_asset_derivative_id || null, template_key: normalizeRecipeTemplate(templateKey),
    no_output_created: true, no_provider_execution: true
  });
  return { recipe, derivative, template_key: normalizeRecipeTemplate(templateKey) };
}

export async function approveDerivativePlan(db, creativeProjectId, derivativeId, actorUserId) {
  await ensureCreativeAssetOperationsSchema(db);
  const derivative = await db.prepare(`
    SELECT cad.*, cdr.recipe_status, cdr.creative_derivative_recipe_id, ca.rights_status, ca.asset_status
    FROM creative_asset_derivatives cad
    INNER JOIN creative_derivative_recipes cdr ON cdr.creative_derivative_recipe_id=cad.creative_derivative_recipe_id
    INNER JOIN creative_assets ca ON ca.creative_asset_id=cad.creative_asset_id
    WHERE cad.creative_project_id=? AND cad.creative_asset_derivative_id=? LIMIT 1
  `).bind(integer(creativeProjectId), integer(derivativeId)).first();
  if (!derivative) throw new Error('Derivative plan not found.');
  if (text(derivative.asset_status) !== 'active') throw new Error('The source asset is not active.');
  if (text(derivative.rights_status) === 'blocked') throw new Error('Blocked media cannot be approved for derivative planning.');
  await db.prepare(`UPDATE creative_derivative_recipes SET recipe_status='approved_internal', approved_by_user_id=?, approved_at=COALESCE(approved_at,CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE creative_derivative_recipe_id=?`).bind(integer(actorUserId) || null, derivative.creative_derivative_recipe_id).run();
  await db.prepare(`UPDATE creative_asset_derivatives SET derivative_status='approved_plan', updated_at=CURRENT_TIMESTAMP WHERE creative_asset_derivative_id=?`).bind(derivative.creative_asset_derivative_id).run();
  await writeProjectEvent(db, creativeProjectId, 'caip_derivative_plan_approved_internal', actorUserId, {
    creative_asset_derivative_id: derivative.creative_asset_derivative_id, output_not_created: true, provider_not_scheduled: true
  });
  return db.prepare(`SELECT * FROM creative_asset_derivatives WHERE creative_asset_derivative_id=?`).bind(derivative.creative_asset_derivative_id).first();
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function opaqueToken() {
  return `caip-rv1.${crypto.randomUUID().replace(/-/g, '')}.${crypto.randomUUID().replace(/-/g, '')}`;
}

export async function createSecureReviewGrant(db, creativeProjectId, creativeAssetId, actorUserId, options = {}) {
  await ensureCreativeAssetOperationsSchema(db);
  const asset = await sourceForAsset(db, creativeProjectId, creativeAssetId);
  if (!text(asset.source_object_key)) throw new Error('A secure proxy link needs a bound R2 object key. This asset currently has a catalog URL only.');
  const minutes = boundedNumber(options.expires_in_minutes, 5, 120, 30);
  const maxAccess = boundedNumber(options.max_access_count, 1, 100, 25);
  const token = opaqueToken();
  const tokenHash = await sha256Hex(token);
  const grantKey = `review-${asset.creative_asset_id}-${nowKey()}-${stableHash(tokenHash)}`;
  await db.prepare(`INSERT INTO creative_asset_access_grants (
    creative_project_id, creative_asset_id, grant_key, token_hash, access_scope, bound_user_id,
    expires_at, max_access_count, access_count, source_snapshot_fingerprint, created_by_user_id, created_at, updated_at
  ) VALUES (?, ?, ?, ?, 'admin_authenticated_review_proxy', ?, datetime('now', ?), ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    asset.creative_project_id, asset.creative_asset_id, grantKey, tokenHash, integer(actorUserId) || null,
    `+${minutes} minutes`, maxAccess, asset.source_fingerprint, integer(actorUserId) || null
  ).run();
  const grant = await db.prepare(`SELECT creative_asset_access_grant_id, grant_key, expires_at, max_access_count, access_count, access_scope FROM creative_asset_access_grants WHERE grant_key=? LIMIT 1`).bind(grantKey).first();
  await writeAccessAudit(db, grant?.creative_asset_access_grant_id, 'review_grant_created', actorUserId, 'granted', {
    creative_project_id: asset.creative_project_id, creative_asset_id: asset.creative_asset_id,
    expires_in_minutes: minutes, max_access_count: maxAccess, raw_token_not_stored: true, admin_bound: true
  });
  await writeProjectEvent(db, asset.creative_project_id, 'caip_secure_review_grant_created', actorUserId, {
    creative_asset_id: asset.creative_asset_id, grant_key: grantKey, expires_in_minutes: minutes,
    raw_token_not_stored: true, proxy_only: true
  });
  return {
    grant,
    review_url: `/api/admin/creative-asset-review?token=${encodeURIComponent(token)}`,
    expires_in_minutes: minutes,
    security: 'same-origin, authenticated-admin proxy; raw token is never stored in D1'
  };
}

export async function revokeSecureReviewGrant(db, creativeProjectId, grantId, actorUserId) {
  await ensureCreativeAssetOperationsSchema(db);
  const grant = await db.prepare(`SELECT * FROM creative_asset_access_grants WHERE creative_project_id=? AND creative_asset_access_grant_id=? LIMIT 1`).bind(integer(creativeProjectId), integer(grantId)).first();
  if (!grant) throw new Error('Secure review grant not found.');
  await db.prepare(`UPDATE creative_asset_access_grants SET revoked_at=COALESCE(revoked_at,CURRENT_TIMESTAMP), revoked_by_user_id=?, updated_at=CURRENT_TIMESTAMP WHERE creative_asset_access_grant_id=?`).bind(integer(actorUserId) || null, grant.creative_asset_access_grant_id).run();
  await writeAccessAudit(db, grant.creative_asset_access_grant_id, 'review_grant_revoked', actorUserId, 'revoked', { creative_project_id: integer(creativeProjectId) });
  await writeProjectEvent(db, creativeProjectId, 'caip_secure_review_grant_revoked', actorUserId, { creative_asset_access_grant_id: grant.creative_asset_access_grant_id });
  return { creative_asset_access_grant_id: grant.creative_asset_access_grant_id, revoked: true };
}

export async function authorizeSecureReviewGrant(db, rawToken, adminUser) {
  await ensureCreativeAssetOperationsSchema(db);
  const token = text(rawToken, 500);
  if (!token.startsWith('caip-rv1.')) throw new Error('Invalid secure review link.');
  const tokenHash = await sha256Hex(token);
  const grant = await db.prepare(`
    SELECT cag.*, ca.asset_key, ca.source_url, ca.source_fingerprint, ca.original_filename,
      cp.creative_project_key, cp.product_id, ma.object_key AS direct_object_key, ma.bucket_name AS direct_bucket_name,
      ma.storage_provider AS direct_storage_provider, ma.mime_type AS direct_mime_type
    FROM creative_asset_access_grants cag
    INNER JOIN creative_assets ca ON ca.creative_asset_id=cag.creative_asset_id
    INNER JOIN creative_projects cp ON cp.creative_project_id=cag.creative_project_id
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    WHERE cag.token_hash=? LIMIT 1
  `).bind(tokenHash).first();
  if (!grant) throw new Error('Secure review link is not recognized.');
  if (grant.revoked_at) {
    await writeAccessAudit(db, grant.creative_asset_access_grant_id, 'review_grant_denied', integer(adminUser?.user_id), 'revoked', {});
    throw new Error('Secure review link has been revoked.');
  }
  if (grant.bound_user_id && integer(grant.bound_user_id) !== integer(adminUser?.user_id)) {
    await writeAccessAudit(db, grant.creative_asset_access_grant_id, 'review_grant_denied', integer(adminUser?.user_id), 'wrong_user', {});
    throw new Error('This secure review link is bound to a different administrator.');
  }
  if (!grant.expires_at || new Date(`${String(grant.expires_at).replace(' ', 'T')}Z`).getTime() <= Date.now()) {
    await writeAccessAudit(db, grant.creative_asset_access_grant_id, 'review_grant_denied', integer(adminUser?.user_id), 'expired', {});
    throw new Error('Secure review link has expired.');
  }
  if (numeric(grant.access_count) >= numeric(grant.max_access_count)) {
    await writeAccessAudit(db, grant.creative_asset_access_grant_id, 'review_grant_denied', integer(adminUser?.user_id), 'access_limit', {});
    throw new Error('Secure review link has reached its access limit.');
  }
  let objectKey = text(grant.direct_object_key);
  let bucketName = text(grant.direct_bucket_name);
  let storageProvider = text(grant.direct_storage_provider || 'r2');
  let mimeType = normalizedMime(grant.direct_mime_type);
  if (!objectKey && integer(grant.product_id) && text(grant.source_url)) {
    const matched = await db.prepare(`SELECT object_key, bucket_name, storage_provider, mime_type FROM media_assets WHERE product_id=? AND public_url=? ORDER BY media_asset_id DESC LIMIT 1`).bind(integer(grant.product_id), text(grant.source_url)).first().catch(() => null);
    objectKey = text(matched?.object_key);
    bucketName = text(matched?.bucket_name);
    storageProvider = text(matched?.storage_provider || storageProvider || 'r2');
    mimeType = normalizedMime(matched?.mime_type || mimeType);
  }
  if (!objectKey) {
    await writeAccessAudit(db, grant.creative_asset_access_grant_id, 'review_grant_denied', integer(adminUser?.user_id), 'no_bound_object', {});
    throw new Error('This asset has no bound R2 object available for secure proxy review.');
  }
  return { grant, object_key: objectKey, bucket_name: bucketName, storage_provider: storageProvider, mime_type: mimeType, filename: cleanFilename(grant.original_filename || grant.asset_key) };
}

export async function recordSecureReviewServed(db, grant, actorUserId, details = {}) {
  await db.prepare(`UPDATE creative_asset_access_grants SET access_count=access_count+1, last_accessed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE creative_asset_access_grant_id=?`).bind(grant.creative_asset_access_grant_id).run();
  await writeAccessAudit(db, grant.creative_asset_access_grant_id, 'review_proxy_served', actorUserId, 'served', details);
}

export async function loadCreativeAssetOperations(db, creativeProjectId) {
  await ensureCreativeAssetOperationsSchema(db);
  const [observations, jobs, recipes, derivatives, grants, providers, budgets] = await Promise.all([
    db.prepare(`SELECT o.*, ca.asset_key, ca.original_filename FROM creative_asset_technical_observations o INNER JOIN creative_assets ca ON ca.creative_asset_id=o.creative_asset_id WHERE o.creative_project_id=? ORDER BY o.observed_at DESC, o.creative_asset_technical_observation_id DESC`).bind(integer(creativeProjectId)).all(),
    db.prepare(`SELECT j.*, ca.asset_key, ca.original_filename FROM creative_asset_probe_jobs j INNER JOIN creative_assets ca ON ca.creative_asset_id=j.creative_asset_id WHERE j.creative_project_id=? ORDER BY j.creative_asset_probe_job_id DESC LIMIT 60`).bind(integer(creativeProjectId)).all(),
    db.prepare(`SELECT r.*, ca.asset_key, ca.original_filename FROM creative_derivative_recipes r INNER JOIN creative_assets ca ON ca.creative_asset_id=r.creative_asset_id WHERE r.creative_project_id=? ORDER BY r.created_at DESC, r.creative_derivative_recipe_id DESC`).bind(integer(creativeProjectId)).all(),
    db.prepare(`SELECT d.*, r.recipe_name, r.output_role, r.output_format, r.target_width_px, r.target_height_px, r.aspect_ratio, r.recipe_status, ca.asset_key, ca.original_filename FROM creative_asset_derivatives d INNER JOIN creative_derivative_recipes r ON r.creative_derivative_recipe_id=d.creative_derivative_recipe_id INNER JOIN creative_assets ca ON ca.creative_asset_id=d.creative_asset_id WHERE d.creative_project_id=? ORDER BY d.created_at DESC, d.creative_asset_derivative_id DESC`).bind(integer(creativeProjectId)).all(),
    db.prepare(`SELECT creative_asset_access_grant_id, creative_project_id, creative_asset_id, grant_key, access_scope, bound_user_id, expires_at, max_access_count, access_count, revoked_at, last_accessed_at, created_at FROM creative_asset_access_grants WHERE creative_project_id=? ORDER BY creative_asset_access_grant_id DESC LIMIT 80`).bind(integer(creativeProjectId)).all(),
    db.prepare(`SELECT provider_key, display_name, capability_key, lifecycle_status, endpoint_policy, consent_required, default_budget_cap_cents, enabled_at, disabled_at, updated_at FROM creative_provider_profiles ORDER BY capability_key, provider_key`).all(),
    db.prepare(`SELECT * FROM creative_execution_budget_controls WHERE creative_project_id=? OR creative_project_id IS NULL ORDER BY creative_project_id DESC, capability_key`).bind(integer(creativeProjectId)).all()
  ]);
  return {
    observations: rows(observations), probe_jobs: rows(jobs), recipes: rows(recipes), derivatives: rows(derivatives),
    access_grants: rows(grants), provider_profiles: rows(providers), budget_controls: rows(budgets),
    templates: Object.entries(DERIVATIVE_TEMPLATES).map(([key, value]) => ({ key, ...value }))
  };
}

export function makeCreativeOperationsManifest(operations = {}) {
  return {
    build: CAIP_OPERATIONS_BUILD,
    source_media_unchanged: true,
    provider_execution_active: false,
    technical_observations: arrayForManifest(operations.observations).map((item) => ({
      asset_key: item.asset_key, probe_status: item.probe_status, probe_scope: item.probe_scope,
      mime_type: item.mime_type, file_size_bytes: item.file_size_bytes, etag: item.etag || null,
      width_px: item.width_px, height_px: item.height_px, orientation: item.orientation,
      duration_seconds: item.duration_seconds, codec: item.codec, observed_at: item.observed_at
    })),
    derivative_plans: arrayForManifest(operations.derivatives).map((item) => ({
      derivative_key: item.derivative_key, asset_key: item.asset_key, recipe_name: item.recipe_name,
      output_role: item.output_role, output_format: item.output_format, target_width_px: item.target_width_px,
      target_height_px: item.target_height_px, aspect_ratio: item.aspect_ratio, derivative_status: item.derivative_status,
      verification_status: item.verification_status, output_created: Boolean(item.output_url || item.output_object_key)
    })),
    secure_review_controls: {
      proxy_only: true, authenticated_admin_required: true, raw_tokens_stored: false,
      grants: arrayForManifest(operations.access_grants).map((item) => ({
        grant_key: item.grant_key, creative_asset_id: item.creative_asset_id, expires_at: item.expires_at,
        max_access_count: item.max_access_count, access_count: item.access_count, revoked_at: item.revoked_at || null
      }))
    },
    provider_registry: arrayForManifest(operations.provider_profiles).map((item) => ({
      provider_key: item.provider_key, capability_key: item.capability_key,
      lifecycle_status: item.lifecycle_status, endpoint_policy: item.endpoint_policy,
      consent_required: Number(item.consent_required) === 1, default_budget_cap_cents: item.default_budget_cap_cents
    }))
  };
}
function arrayForManifest(value) { return Array.isArray(value) ? value : []; }
