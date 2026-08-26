// Devil n Dove Build 439 — verified CAIP missing-binary recovery control.
// Explicit Admin action only. Restores a missing Development/private binary under a new immutable R2 key,
// verifies it, then preserves the existing creative_asset_id so evidence/story references remain stable.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  CONTENT_FINGERPRINT_VERSION,
  createSafeReplacementUpload,
  createUploadSession,
  privateBucketAvailable,
  retryUploadedFileRegistration,
  setUploadFileContentFingerprint,
  uploadedPartState,
} from '../_lib/caipMediaIntake.js';

const BUILD = 439;

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
}
function integer(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
function numeric(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max).trim() : clean;
}
function fingerprint(value) {
  const clean = text(value, 180).toLowerCase();
  return /^[a-f0-9]{64}$/.test(clean) ? clean : '';
}
function sameProject(row, projectId) {
  return integer(row?.creative_project_id) === integer(projectId);
}
function safeFile(row) {
  if (!row) return null;
  return {
    caip_media_upload_file_id: integer(row.caip_media_upload_file_id),
    caip_media_upload_session_id: integer(row.caip_media_upload_session_id),
    creative_project_id: integer(row.creative_project_id),
    creative_asset_id: integer(row.creative_asset_id) || null,
    recovery_of_file_id: integer(row.recovery_of_file_id) || null,
    original_filename: row.original_filename || null,
    mime_type: row.mime_type || null,
    media_type: row.media_type || null,
    file_size_bytes: numeric(row.file_size_bytes),
    upload_status: row.upload_status || null,
    part_size_bytes: numeric(row.part_size_bytes),
    expected_parts: integer(row.expected_parts),
    uploaded_parts: integer(row.uploaded_parts),
    uploaded_bytes: numeric(row.uploaded_bytes),
    content_fingerprint: row.content_fingerprint || null,
    content_fingerprint_version: row.content_fingerprint_version || null,
    privacy_state: row.privacy_state || null,
    consent_state: row.consent_state || null,
    rights_status: row.rights_status || null,
    last_error: row.last_error || null,
  };
}
function safeParts(parts) {
  return (parts || []).map((part) => ({
    caip_media_upload_part_id: integer(part.caip_media_upload_part_id),
    caip_media_upload_file_id: integer(part.caip_media_upload_file_id),
    part_number: integer(part.part_number),
    byte_start: numeric(part.byte_start),
    byte_end: numeric(part.byte_end),
    part_size_bytes: numeric(part.part_size_bytes),
    part_status: part.part_status || null,
  }));
}
async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}
async function assetRow(db, projectId, assetId) {
  return db.prepare(`
    SELECT ca.creative_asset_id,ca.creative_project_id,ca.asset_key,ca.original_filename,ca.media_type,ca.mime_type,
           ca.media_asset_id,ca.rights_status,ca.source_safety_status,
           ma.file_size_bytes AS media_file_size_bytes,ma.object_key AS media_object_key
    FROM creative_assets ca
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    WHERE ca.creative_project_id=? AND ca.creative_asset_id=? LIMIT 1
  `).bind(projectId, assetId).first();
}
async function latestUploadForAsset(db, projectId, assetId, requestedFileId = 0) {
  if (requestedFileId) {
    const row = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(requestedFileId).first();
    if (!row || !sameProject(row, projectId) || integer(row.creative_asset_id) !== integer(assetId)) return null;
    return row;
  }
  return db.prepare(`
    SELECT * FROM caip_media_upload_files
    WHERE creative_project_id=? AND creative_asset_id=? AND upload_status<>'archived'
    ORDER BY caip_media_upload_file_id DESC LIMIT 1
  `).bind(projectId, assetId).first();
}
async function reusableRecovery(db, oldFileId) {
  if (!oldFileId) return null;
  return db.prepare(`
    SELECT * FROM caip_media_upload_files
    WHERE recovery_of_file_id=? AND upload_status NOT IN ('archived','aborted')
    ORDER BY caip_media_upload_file_id DESC LIMIT 1
  `).bind(oldFileId).first();
}
async function prepareRecovery(state, context, body) {
  const projectId = integer(body.creative_project_id || body.project_id);
  const assetId = integer(body.creative_asset_id || body.asset_id);
  const requestedUploadId = integer(body.caip_media_upload_file_id || body.upload_file_id);
  const localName = text(body.filename || body.original_filename, 300);
  const localSize = Math.max(0, Math.floor(numeric(body.file_size_bytes || body.size)));
  const localMime = text(body.mime_type || body.type, 180).toLowerCase();
  const localFingerprint = fingerprint(body.content_fingerprint);
  if (!projectId || !assetId) throw new Error('CAIP project and creative asset are required.');
  if (!localName || !localSize || !localFingerprint) throw new Error('Choose the original local file so CAIP can verify filename/size/content fingerprint before recovery.');
  if (!privateBucketAvailable(context.env)) throw new Error('CAIP_PRIVATE_MEDIA_BUCKET is unavailable; missing-binary recovery cannot start.');

  const asset = await assetRow(state.db, projectId, assetId);
  if (!asset) throw new Error('CAIP asset not found for this project.');
  if (!['video','audio'].includes(text(asset.media_type).toLowerCase())) throw new Error('Build 439 missing-binary recovery is limited to temporal video/audio assets.');

  const old = await latestUploadForAsset(state.db, projectId, assetId, requestedUploadId);
  let replacement = null;
  let recoveryMode = 'asset_only_recovery';

  if (old) {
    const expectedSize = numeric(old.file_size_bytes);
    if (expectedSize > 0 && expectedSize !== localSize) throw new Error(`Selected file size does not match the recorded CAIP source (${expectedSize} bytes expected; ${localSize} selected).`);
    const recordedFingerprint = fingerprint(old.content_fingerprint);
    if (recordedFingerprint && recordedFingerprint !== localFingerprint) throw new Error('Selected local file content fingerprint does not match the recorded CAIP source.');
    if (!recordedFingerprint && text(old.original_filename).toLowerCase() !== localName.toLowerCase()) throw new Error(`No strong source fingerprint is recorded, so the original filename must match ${old.original_filename}.`);

    replacement = await reusableRecovery(state.db, old.caip_media_upload_file_id);
    if (!replacement) replacement = (await createSafeReplacementUpload(state.db, context.env, old.caip_media_upload_file_id, state.adminUser.user_id)).file;
    recoveryMode = 'upload_row_recovery';
  } else {
    const expectedSize = numeric(asset.media_file_size_bytes);
    if (expectedSize > 0 && expectedSize !== localSize) throw new Error(`Selected file size does not match the recorded media asset (${expectedSize} bytes expected; ${localSize} selected).`);
    if (text(asset.original_filename) && text(asset.original_filename).toLowerCase() !== localName.toLowerCase()) throw new Error(`The selected filename must match the existing CAIP asset (${asset.original_filename}).`);
    const session = await createUploadSession(state.db, context.env, projectId, [{
      name: localName,
      type: localMime,
      size: localSize,
      lastModified: numeric(body.last_modified_ms),
      content_fingerprint: localFingerprint,
      content_fingerprint_version: CONTENT_FINGERPRINT_VERSION,
    }], state.adminUser.user_id, {
      source_note: `Build 439 missing-binary recovery for creative asset #${assetId}. Existing creative_asset_id must be preserved after R2 verification.`,
      media_role: 'reference',
      privacy_state: 'private',
      consent_state: 'internal_only',
      rights_status: text(asset.rights_status).toLowerCase() === 'blocked' ? 'blocked' : 'internal_only',
      upload_device: text(body.upload_device, 180) || 'browser_missing_binary_recovery',
    });
    replacement = (session.files || [])[0] || null;
    if (replacement?.reused_existing) {
      const existing = await context.env.CAIP_PRIVATE_MEDIA_BUCKET.head(replacement.object_key).catch(() => null);
      if (!existing || numeric(existing.size) !== localSize) {
        replacement = (await createSafeReplacementUpload(state.db, context.env, replacement.caip_media_upload_file_id, state.adminUser.user_id)).file;
        recoveryMode = 'discovered_upload_row_recovery';
      }
    }
  }

  if (!replacement?.caip_media_upload_file_id) throw new Error('CAIP could not prepare a recovery upload row.');
  replacement = await setUploadFileContentFingerprint(state.db, replacement.caip_media_upload_file_id, localFingerprint, CONTENT_FINGERPRINT_VERSION, state.adminUser.user_id);
  const stateRows = await uploadedPartState(state.db, replacement.caip_media_upload_file_id);

  await auditAdminAction(context.env, context.request, state.adminUser, {
    action_type: 'caip_missing_binary_recovery_prepared',
    target_type: 'creative_asset', target_id: assetId, target_key: asset.asset_key || null,
    details: {
      build: BUILD, creative_project_id: projectId, creative_asset_id: assetId,
      original_upload_file_id: integer(old?.caip_media_upload_file_id) || null,
      replacement_upload_file_id: integer(replacement.caip_media_upload_file_id),
      recovery_mode: recoveryMode, selected_size: localSize,
      source_media_unchanged: true, previous_missing_object_not_deleted: true,
      provider_execution_active: false, production_promotion: 'closed',
    }
  }).catch(() => null);

  return {
    ok: true, build: BUILD, action: 'prepare', recovery_mode: recoveryMode,
    creative_project_id: projectId, target_creative_asset_id: assetId,
    original_upload_file_id: integer(old?.caip_media_upload_file_id) || null,
    file: safeFile(stateRows.file), parts: safeParts(stateRows.parts),
    content_fingerprint_version: CONTENT_FINGERPRINT_VERSION,
    source_media_unchanged: true, r2_object_created_yet: false, provider_execution_active: false,
  };
}

async function finalizeRecovery(state, context, body) {
  const replacementId = integer(body.caip_media_upload_file_id || body.replacement_upload_file_id || body.file_id);
  const requestedTargetId = integer(body.creative_asset_id || body.target_creative_asset_id || body.asset_id);
  if (!replacementId) throw new Error('Replacement upload file ID is required.');
  if (!privateBucketAvailable(context.env)) throw new Error('CAIP_PRIVATE_MEDIA_BUCKET is unavailable; recovery finalization cannot verify the object.');

  let replacement = await state.db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(replacementId).first();
  if (!replacement) throw new Error('Recovery upload row was not found.');
  if (replacement.upload_status !== 'uploaded' || !integer(replacement.creative_asset_id)) {
    await retryUploadedFileRegistration(state.db, context.env, replacementId, state.adminUser.user_id);
    replacement = await state.db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(replacementId).first();
  }
  if (replacement.upload_status !== 'uploaded' || !integer(replacement.creative_asset_id)) throw new Error('Recovery binary is not fully uploaded/registered yet. Finish the upload before finalizing recovery.');

  const head = await context.env.CAIP_PRIVATE_MEDIA_BUCKET.head(replacement.object_key).catch(() => null);
  if (!head) throw new Error('Recovery finalization failed closed because the replacement R2 object is missing.');
  if (numeric(head.size) !== numeric(replacement.file_size_bytes)) throw new Error(`Recovery finalization failed closed because R2 size ${numeric(head.size)} does not match ${numeric(replacement.file_size_bytes)} expected bytes.`);

  const old = integer(replacement.recovery_of_file_id)
    ? await state.db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(integer(replacement.recovery_of_file_id)).first()
    : null;
  const targetAssetId = requestedTargetId || integer(old?.creative_asset_id);
  if (!targetAssetId) throw new Error('Existing CAIP asset identity could not be resolved for recovery finalization.');
  const target = await state.db.prepare(`SELECT * FROM creative_assets WHERE creative_asset_id=? LIMIT 1`).bind(targetAssetId).first();
  if (!target || integer(target.creative_project_id) !== integer(replacement.creative_project_id)) throw new Error('Recovery target asset does not belong to the replacement project.');

  const replacementAssetId = integer(replacement.creative_asset_id);
  if (replacementAssetId === targetAssetId) {
    return { ok: true, build: BUILD, action: 'finalize', already_finalized: true, creative_project_id: integer(replacement.creative_project_id), creative_asset_id: targetAssetId, replacement_upload_file_id: replacementId, verified_private_object: true, r2_size: numeric(head.size) };
  }
  const replacementAsset = await state.db.prepare(`SELECT * FROM creative_assets WHERE creative_asset_id=? LIMIT 1`).bind(replacementAssetId).first();
  if (!replacementAsset) throw new Error('Replacement CAIP asset registration is missing; retry registration before finalizing recovery.');

  const statements = [
    state.db.prepare(`UPDATE creative_assets SET
      media_asset_id=?,source_fingerprint=?,logical_archive_path=?,source_safety_status=?,rights_status=?,media_type=?,original_filename=?,mime_type=?,source_metadata_json=?,source_refreshed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE creative_asset_id=? AND creative_project_id=?`).bind(
        replacementAsset.media_asset_id || null, replacementAsset.source_fingerprint || null, replacement.object_key,
        replacementAsset.source_safety_status || target.source_safety_status || 'needs_review', replacementAsset.rights_status || target.rights_status || 'internal_only',
        replacement.media_type || target.media_type, replacement.original_filename || target.original_filename,
        replacement.mime_type || target.mime_type || head.httpMetadata?.contentType || null,
        replacementAsset.source_metadata_json || target.source_metadata_json || '{}', targetAssetId, replacement.creative_project_id
      ),
    state.db.prepare(`UPDATE caip_media_upload_files SET creative_asset_id=?,last_error=NULL,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(targetAssetId, integer(state.adminUser.user_id) || null, replacementId),
    state.db.prepare(`UPDATE caip_media_processing_jobs SET creative_asset_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=? AND creative_asset_id=?`).bind(targetAssetId, replacementId, replacementAssetId),
    state.db.prepare(`UPDATE creative_assets SET asset_status='archived',updated_at=CURRENT_TIMESTAMP WHERE creative_asset_id=? AND creative_asset_id<>?`).bind(replacementAssetId, targetAssetId),
  ];
  if (typeof state.db.batch === 'function') await state.db.batch(statements);
  else for (const statement of statements) await statement.run();

  await state.db.prepare(`INSERT INTO creative_asset_technical_observations(
    creative_project_id,creative_asset_id,observation_key,source_snapshot_fingerprint,storage_provider,bucket_name,object_key,observed_public_url,mime_type,file_size_bytes,etag,uploaded_at,probe_status,probe_scope,evidence_json,observed_at,created_at,updated_at
  ) VALUES(?,?, 'caip_private_upload_v1',?,'r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET',?,NULL,?,?,?,CURRENT_TIMESTAMP,'complete','private_missing_binary_recovery',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  ON CONFLICT(creative_asset_id,observation_key) DO UPDATE SET
    source_snapshot_fingerprint=excluded.source_snapshot_fingerprint,storage_provider='r2_private_caip',bucket_name='CAIP_PRIVATE_MEDIA_BUCKET',object_key=excluded.object_key,
    mime_type=excluded.mime_type,file_size_bytes=excluded.file_size_bytes,etag=excluded.etag,uploaded_at=CURRENT_TIMESTAMP,probe_status='complete',probe_scope='private_missing_binary_recovery',evidence_json=excluded.evidence_json,observed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(
      replacement.creative_project_id, targetAssetId, replacement.content_fingerprint || replacement.file_fingerprint || head.etag || replacement.object_key,
      replacement.object_key, replacement.mime_type || head.httpMetadata?.contentType || null, numeric(head.size), head.etag || null,
      JSON.stringify({ build: BUILD, recovery_upload_file_id: replacementId, recovered_existing_creative_asset_id: targetAssetId, replacement_registration_asset_id: replacementAssetId, verified_r2_head: true, raw_original: true, immutable: true, previous_missing_key_preserved_as_history: true })
    ).run().catch(() => null);

  await state.db.prepare(`INSERT INTO creative_project_events(creative_project_id,event_type,actor_user_id,details_json,created_at) VALUES(?, 'caip_missing_binary_recovered', ?, ?, CURRENT_TIMESTAMP)`).bind(
    replacement.creative_project_id, integer(state.adminUser.user_id) || null,
    JSON.stringify({ build: BUILD, creative_asset_id: targetAssetId, replacement_upload_file_id: replacementId, replacement_registration_asset_id: replacementAssetId, verified_object_key: replacement.object_key, verified_bytes: numeric(head.size), previous_upload_file_id: integer(replacement.recovery_of_file_id) || null, existing_asset_identity_preserved: true, old_object_not_deleted: true, provider_execution_active: false })
  ).run().catch(() => null);

  await auditAdminAction(context.env, context.request, state.adminUser, {
    action_type: 'caip_missing_binary_recovered', target_type: 'creative_asset', target_id: targetAssetId, target_key: target.asset_key || null,
    details: { build: BUILD, creative_project_id: integer(replacement.creative_project_id), replacement_upload_file_id: replacementId, replacement_registration_asset_id: replacementAssetId, r2_head_verified: true, verified_bytes: numeric(head.size), existing_asset_identity_preserved: true, previous_missing_object_not_deleted: true, provider_execution_active: false }
  }).catch(() => null);

  return {
    ok: true, build: BUILD, action: 'finalize', creative_project_id: integer(replacement.creative_project_id),
    creative_asset_id: targetAssetId, replacement_upload_file_id: replacementId,
    replacement_registration_asset_id: replacementAssetId, verified_private_object: true,
    existing_asset_identity_preserved: true, previous_missing_object_not_deleted: true,
    r2_size: numeric(head.size), provider_execution_active: false,
  };
}

export async function onRequestPost(context) {
  const state = await access(context);
  if (state.error) return state.error;
  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'A JSON request body is required.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();
  try {
    if (action === 'prepare') return json(await prepareRecovery(state, context, body));
    if (action === 'finalize') return json(await finalizeRecovery(state, context, body));
    throw new Error('Unsupported CAIP missing-binary recovery action.');
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'caip_missing_binary_recovery', incident_code: 'caip_missing_binary_recovery_failed', severity: 'warning',
      message: error?.message || 'CAIP missing-binary recovery failed.', related_user_id: state.adminUser.user_id,
      details: { build: BUILD, action, creative_project_id: integer(body.creative_project_id) || null, creative_asset_id: integer(body.creative_asset_id) || null, upload_file_id: integer(body.caip_media_upload_file_id || body.file_id) || null, error: String(error?.message || error), provider_execution_active: false }
    }).catch(() => null);
    return json({ ok: false, build: BUILD, error: error?.message || 'CAIP missing-binary recovery failed.', action, provider_execution_active: false, source_media_unchanged: true }, 400);
  }
}
