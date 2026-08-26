// Devil n Dove Build 439 — verified CAIP missing-binary recovery control.
// Explicit Admin action only. Supports both historical upload-linked recovery and legacy asset-only recovery.
// A new private R2 key is created and verified; the existing creative_asset_id is preserved.
// No old R2 key is deleted and no provider executes.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  CONTENT_FINGERPRINT_VERSION,
  DEFAULT_PART_BYTES,
  DIRECT_UPLOAD_MAX_BYTES,
  choosePartSize,
  createSafeReplacementUpload,
  privateBucketAvailable,
  retryUploadedFileRegistration,
  setUploadFileContentFingerprint,
  uploadedPartState,
} from '../_lib/caipMediaIntake.js';

const BUILD = 439;
const ASSET_ONLY_PREFIX = 'build439-asset-recovery';

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
function safeJson(value, fallback = {}) {
  try { return JSON.parse(String(value || '')); } catch { return fallback; }
}
function sanitizeFilename(value) {
  const clean = text(value, 300)
    .replace(/[\\/]+/g, '-')
    .replace(/[^A-Za-z0-9._ -]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return clean.slice(-160) || 'media.bin';
}
function normalizeRights(value) {
  const key = text(value, 40).toLowerCase();
  return ['needs_review','internal_only','public_allowed','blocked'].includes(key) ? key : 'needs_review';
}
function errorCode(error) {
  const message = text(error?.message || error, 1200).toLowerCase();
  if (message.includes('private_media_bucket') || message.includes('private r2')) return 'CAIP_RECOVERY_PRIVATE_BUCKET_UNAVAILABLE';
  if (message.includes('file size does not match') || message.includes('size ') && message.includes('expected')) return 'CAIP_RECOVERY_SIZE_MISMATCH';
  if (message.includes('fingerprint') && message.includes('does not match')) return 'CAIP_RECOVERY_FINGERPRINT_MISMATCH';
  if (message.includes('filename must match')) return 'CAIP_RECOVERY_FILENAME_MISMATCH';
  if (message.includes('asset not found')) return 'CAIP_RECOVERY_ASSET_NOT_FOUND';
  if (message.includes('not fully uploaded') || message.includes('finish the upload')) return 'CAIP_RECOVERY_UPLOAD_INCOMPLETE';
  if (message.includes('replacement r2 object is missing') || message.includes('failed closed')) return 'CAIP_RECOVERY_R2_VERIFY_FAILED';
  if (message.includes('historical upload authority')) return 'CAIP_RECOVERY_HISTORY_MISMATCH';
  return 'CAIP_RECOVERY_FAILED';
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
           ca.media_asset_id,ca.rights_status,ca.source_safety_status,ca.source_fingerprint,ca.source_metadata_json,
           ma.original_filename AS media_original_filename,ma.file_size_bytes AS media_file_size_bytes,
           ma.mime_type AS media_mime_type,ma.object_key AS previous_media_object_key,
           ma.storage_provider AS previous_storage_provider,ma.bucket_name AS previous_bucket_name
    FROM creative_assets ca
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    WHERE ca.creative_project_id=? AND ca.creative_asset_id=? LIMIT 1
  `).bind(projectId, assetId).first();
}
async function linkedUpload(db, projectId, assetId, requestedFileId = 0) {
  if (requestedFileId) {
    return db.prepare(`
      SELECT * FROM caip_media_upload_files
      WHERE caip_media_upload_file_id=? AND creative_project_id=? AND creative_asset_id=? LIMIT 1
    `).bind(requestedFileId, projectId, assetId).first();
  }
  return db.prepare(`
    SELECT * FROM caip_media_upload_files
    WHERE creative_project_id=? AND creative_asset_id=? AND upload_status<>'archived'
    ORDER BY caip_media_upload_file_id DESC LIMIT 1
  `).bind(projectId, assetId).first();
}
async function reusableRecovery(db, oldFileId) {
  return db.prepare(`
    SELECT * FROM caip_media_upload_files
    WHERE recovery_of_file_id=? AND upload_status NOT IN ('archived','aborted')
    ORDER BY caip_media_upload_file_id DESC LIMIT 1
  `).bind(oldFileId).first();
}
function assetOnlyClientPrefix(assetId) {
  return `${ASSET_ONLY_PREFIX}-${integer(assetId)}-`;
}
function assetOnlyTargetFromRow(row) {
  const match = text(row?.client_file_key, 180).match(/^build439-asset-recovery-(\d+)-/);
  return match ? integer(match[1]) : 0;
}
async function insertPartPlan(db, fileId, fileSize, partBytes, expectedParts) {
  const statements = [];
  const batchRows = 18;
  for (let first = 1; first <= expectedParts; first += batchRows) {
    const last = Math.min(expectedParts, first + batchRows - 1);
    const values = [];
    const binds = [];
    for (let partNumber = first; partNumber <= last; partNumber += 1) {
      const start = (partNumber - 1) * partBytes;
      const end = Math.min(fileSize, start + partBytes);
      values.push(`(?,?,?,?,?,'waiting',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
      binds.push(fileId, partNumber, start, end, end - start);
    }
    statements.push(db.prepare(`INSERT INTO caip_media_upload_parts(
      caip_media_upload_file_id,part_number,byte_start,byte_end,part_size_bytes,part_status,created_at,updated_at
    ) VALUES ${values.join(',')}`).bind(...binds));
  }
  if (typeof db.batch === 'function' && statements.length) await db.batch(statements);
  else for (const statement of statements) await statement.run();
}
async function reusableAssetOnlyRecovery(db, projectId, assetId, fileSize, contentFingerprint) {
  return db.prepare(`
    SELECT * FROM caip_media_upload_files
    WHERE creative_project_id=? AND client_file_key LIKE ? AND file_size_bytes=? AND content_fingerprint=?
      AND upload_status NOT IN ('archived','aborted')
    ORDER BY caip_media_upload_file_id DESC LIMIT 1
  `).bind(projectId, `${assetOnlyClientPrefix(assetId)}%`, fileSize, contentFingerprint).first();
}
async function createAssetOnlyRecoveryUpload(db, asset, body, actorUserId, localFingerprint) {
  const projectId = integer(asset.creative_project_id);
  const assetId = integer(asset.creative_asset_id);
  const localName = text(body.filename || body.original_filename, 300);
  const localSize = Math.max(0, Math.floor(numeric(body.file_size_bytes || body.size)));
  const mime = text(body.mime_type || body.type || asset.mime_type || asset.media_mime_type, 180).toLowerCase() || 'application/octet-stream';

  const existing = await reusableAssetOnlyRecovery(db, projectId, assetId, localSize, localFingerprint);
  if (existing) return existing;

  const project = await db.prepare(`SELECT creative_project_id FROM creative_projects WHERE creative_project_id=? LIMIT 1`).bind(projectId).first();
  if (!project) throw new Error('CAIP project was not found for asset-only recovery.');

  const useDirect = localSize <= DIRECT_UPLOAD_MAX_BYTES;
  const partBytes = useDirect ? localSize : choosePartSize(localSize);
  const expectedParts = useDirect ? 1 : Math.max(1, Math.ceil(localSize / partBytes));
  const sessionKey = `caip-build439-asset-recovery-${projectId}-${crypto.randomUUID()}`;
  const objectPrefix = `projects/${projectId}/raw`;
  const sourceNote = `Build 439 legacy asset-only missing-binary recovery for creative_asset_id=${assetId}.`;
  const userId = integer(actorUserId) || null;

  const sessionResult = await db.prepare(`INSERT INTO caip_media_upload_sessions(
    creative_project_id,session_key,session_status,storage_profile,object_prefix,transport_mode,preferred_direct_transport,
    part_size_bytes,parallel_parts,upload_device,source_note,total_files,total_bytes,uploaded_bytes,created_by_user_id,updated_by_user_id,created_at,updated_at
  ) VALUES(?,?,'ready','private_r2',?,'worker_streamed_multipart_v2_integrity_guard','direct_s3_presigned_multipart_future',?,?,?,?,?,?,0,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
    projectId, sessionKey, objectPrefix, DEFAULT_PART_BYTES, 2, text(body.upload_device, 180) || null,
    sourceNote, 1, localSize, userId, userId
  ).run();
  const sessionId = integer(sessionResult?.meta?.last_row_id);
  if (!sessionId) throw new Error('CAIP could not create the asset-only recovery session.');

  const fileKey = crypto.randomUUID();
  const clientKey = `${assetOnlyClientPrefix(assetId)}${crypto.randomUUID()}`;
  const objectKey = `${objectPrefix}/${text(asset.media_type).toLowerCase() === 'audio' ? 'audio' : 'video'}/${fileKey}-${sanitizeFilename(localName)}`;
  const rightsStatus = normalizeRights(asset.rights_status);
  const insert = await db.prepare(`INSERT INTO caip_media_upload_files(
    caip_media_upload_session_id,creative_project_id,client_file_key,file_key,original_filename,mime_type,media_type,media_role,
    file_size_bytes,last_modified_ms,capture_at,upload_device,upload_status,storage_provider,bucket_alias,object_key,
    part_size_bytes,expected_parts,uploaded_parts,uploaded_bytes,file_fingerprint,content_fingerprint,content_fingerprint_version,recovery_of_file_id,checksum_algorithm,checksum_status,
    privacy_state,consent_state,rights_status,created_by_user_id,updated_by_user_id,created_at,updated_at,last_error
  ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'waiting','r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET',?,?,?,0,0,?,?,?,NULL,'SHA-256','pending','private','not_applicable',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?)`).bind(
    sessionId, projectId, clientKey, fileKey, localName, mime, text(asset.media_type).toLowerCase(), 'reference',
    localSize, Math.floor(numeric(body.last_modified_ms)) || null, null, text(body.upload_device, 180) || null,
    objectKey, partBytes, expectedParts, localFingerprint, localFingerprint, CONTENT_FINGERPRINT_VERSION,
    rightsStatus, userId, userId,
    `Build 439 legacy asset-only recovery prepared for creative asset #${assetId}. Previous missing object metadata remains preserved until verified recovery completes.`
  ).run();
  const fileId = integer(insert?.meta?.last_row_id);
  if (!fileId) throw new Error('CAIP could not create the asset-only recovery upload row.');
  await insertPartPlan(db, fileId, localSize, partBytes, expectedParts);
  return db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(fileId).first();
}

async function prepareRecovery(state, context, body) {
  const projectId = integer(body.creative_project_id || body.project_id);
  const assetId = integer(body.creative_asset_id || body.asset_id);
  const requestedUploadId = integer(body.caip_media_upload_file_id || body.upload_file_id);
  const localName = text(body.filename || body.original_filename, 300);
  const localSize = Math.max(0, Math.floor(numeric(body.file_size_bytes || body.size)));
  const localFingerprint = fingerprint(body.content_fingerprint);
  if (!projectId || !assetId) throw new Error('CAIP project and creative asset are required.');
  if (!localName || !localSize || !localFingerprint) throw new Error('Choose the original local file so CAIP can verify filename, size and content fingerprint before recovery.');
  if (!privateBucketAvailable(context.env)) throw new Error('CAIP_PRIVATE_MEDIA_BUCKET is unavailable; missing-binary recovery cannot start.');

  const asset = await assetRow(state.db, projectId, assetId);
  if (!asset) throw new Error('CAIP asset not found for this project.');
  if (!['video','audio'].includes(text(asset.media_type).toLowerCase())) throw new Error('Build 439 missing-binary recovery is limited to temporal video/audio assets.');

  const old = await linkedUpload(state.db, projectId, assetId, requestedUploadId);
  let replacement = null;
  let recoveryMode = 'linked_history';
  let originalUploadFileId = null;

  if (old) {
    if (numeric(old.file_size_bytes) !== localSize) {
      throw new Error(`Selected file size does not match the recorded CAIP source (${numeric(old.file_size_bytes)} bytes expected; ${localSize} selected).`);
    }
    const recordedFingerprint = fingerprint(old.content_fingerprint);
    if (recordedFingerprint && recordedFingerprint !== localFingerprint) throw new Error('Selected local file content fingerprint does not match the recorded CAIP source.');
    if (!recordedFingerprint && text(old.original_filename).toLowerCase() !== localName.toLowerCase()) {
      throw new Error(`No strong source fingerprint is recorded, so the original filename must match ${old.original_filename}.`);
    }
    originalUploadFileId = integer(old.caip_media_upload_file_id);
    replacement = await reusableRecovery(state.db, originalUploadFileId);
    if (!replacement) replacement = (await createSafeReplacementUpload(state.db, context.env, originalUploadFileId, state.adminUser.user_id)).file;
    if (!replacement?.caip_media_upload_file_id) throw new Error('CAIP could not prepare a recovery upload row.');
    replacement = await setUploadFileContentFingerprint(
      state.db, replacement.caip_media_upload_file_id, localFingerprint, CONTENT_FINGERPRINT_VERSION, state.adminUser.user_id
    );
  } else {
    recoveryMode = 'asset_only_legacy';
    const meta = safeJson(asset.source_metadata_json, {});
    const expectedSize = Math.max(0, Math.floor(numeric(asset.media_file_size_bytes || meta.file_size_bytes)));
    const expectedName = text(asset.media_original_filename || asset.original_filename, 300);
    if (expectedSize && expectedSize !== localSize) {
      throw new Error(`Selected file size does not match the recorded CAIP source (${expectedSize} bytes expected; ${localSize} selected).`);
    }
    if (expectedName && expectedName.toLowerCase() !== localName.toLowerCase()) {
      throw new Error(`Legacy asset recovery has no historical upload fingerprint, so the original filename must match ${expectedName}.`);
    }
    replacement = await createAssetOnlyRecoveryUpload(state.db, asset, body, state.adminUser.user_id, localFingerprint);
  }

  const stateRows = await uploadedPartState(state.db, replacement.caip_media_upload_file_id);
  await auditAdminAction(context.env, context.request, state.adminUser, {
    action_type: recoveryMode === 'asset_only_legacy' ? 'caip_missing_binary_asset_recovery_prepared' : 'caip_missing_binary_recovery_prepared',
    target_type: 'creative_asset', target_id: assetId, target_key: asset.asset_key || null,
    details: {
      build: BUILD, recovery_mode: recoveryMode, creative_project_id: projectId, creative_asset_id: assetId,
      original_upload_file_id: originalUploadFileId,
      replacement_upload_file_id: integer(replacement.caip_media_upload_file_id),
      selected_size: localSize, selected_content_fingerprint: localFingerprint,
      previous_media_object_key: asset.previous_media_object_key || null,
      source_media_unchanged: true, previous_missing_object_not_deleted: true, provider_execution_active: false,
    }
  }).catch(() => null);

  return {
    ok: true, build: BUILD, action: 'prepare', recovery_mode: recoveryMode, creative_project_id: projectId,
    target_creative_asset_id: assetId, original_upload_file_id: originalUploadFileId,
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
  const linkedHistory = integer(replacement.recovery_of_file_id) > 0;
  const legacyTargetId = linkedHistory ? 0 : assetOnlyTargetFromRow(replacement);
  if (!linkedHistory && !legacyTargetId) throw new Error('Recovery finalization requires either a historical upload lineage or a Build 439 asset-only recovery marker.');

  if (replacement.upload_status !== 'uploaded' || !integer(replacement.creative_asset_id)) {
    await retryUploadedFileRegistration(state.db, context.env, replacementId, state.adminUser.user_id);
    replacement = await state.db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(replacementId).first();
  }
  if (replacement.upload_status !== 'uploaded' || !integer(replacement.creative_asset_id)) {
    throw new Error('Recovery binary is not fully uploaded/registered yet. Finish the upload before finalizing recovery.');
  }

  const head = await context.env.CAIP_PRIVATE_MEDIA_BUCKET.head(replacement.object_key).catch(() => null);
  if (!head) throw new Error('Recovery finalization failed closed because the replacement R2 object is missing.');
  if (numeric(head.size) !== numeric(replacement.file_size_bytes)) {
    throw new Error(`Recovery finalization failed closed because R2 size ${numeric(head.size)} does not match ${numeric(replacement.file_size_bytes)} expected bytes.`);
  }

  let targetAssetId = legacyTargetId;
  let old = null;
  if (linkedHistory) {
    old = await state.db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(integer(replacement.recovery_of_file_id)).first();
    if (!old || !integer(old.creative_asset_id)) throw new Error('Historical upload authority no longer resolves to the existing CAIP asset.');
    targetAssetId = integer(old.creative_asset_id);
  }
  if (requestedTargetId && requestedTargetId !== targetAssetId) throw new Error('Requested CAIP asset does not match the recovery authority.');
  const target = await state.db.prepare(`SELECT * FROM creative_assets WHERE creative_asset_id=? LIMIT 1`).bind(targetAssetId).first();
  if (!target || integer(target.creative_project_id) !== integer(replacement.creative_project_id)) throw new Error('Recovery target asset does not belong to the replacement project.');

  const replacementAssetId = integer(replacement.creative_asset_id);
  if (replacementAssetId === targetAssetId) {
    return { ok: true, build: BUILD, action: 'finalize', recovery_mode: linkedHistory ? 'linked_history' : 'asset_only_legacy', already_finalized: true, creative_project_id: integer(replacement.creative_project_id), creative_asset_id: targetAssetId, replacement_upload_file_id: replacementId, verified_private_object: true, r2_size: numeric(head.size) };
  }
  const replacementAsset = await state.db.prepare(`SELECT * FROM creative_assets WHERE creative_asset_id=? LIMIT 1`).bind(replacementAssetId).first();
  if (!replacementAsset) throw new Error('Replacement CAIP asset registration is missing; retry registration before finalizing recovery.');

  const previousMediaAssetId = integer(target.media_asset_id) || null;
  const previousObjectKey = target.logical_archive_path || safeJson(target.source_metadata_json, {}).object_key || null;
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
      JSON.stringify({ build: BUILD, recovery_mode: linkedHistory ? 'linked_history' : 'asset_only_legacy', recovery_upload_file_id: replacementId, recovered_existing_creative_asset_id: targetAssetId, replacement_registration_asset_id: replacementAssetId, previous_media_asset_id: previousMediaAssetId, previous_missing_object_key: previousObjectKey, verified_r2_head: true, raw_original: true, immutable: true, previous_missing_key_preserved_as_history: true })
    ).run().catch(() => null);

  await state.db.prepare(`INSERT INTO creative_project_events(creative_project_id,event_type,actor_user_id,details_json,created_at) VALUES(?, 'caip_missing_binary_recovered', ?, ?, CURRENT_TIMESTAMP)`).bind(
    replacement.creative_project_id, integer(state.adminUser.user_id) || null,
    JSON.stringify({ build: BUILD, recovery_mode: linkedHistory ? 'linked_history' : 'asset_only_legacy', creative_asset_id: targetAssetId, replacement_upload_file_id: replacementId, replacement_registration_asset_id: replacementAssetId, verified_object_key: replacement.object_key, verified_bytes: numeric(head.size), previous_upload_file_id: old ? integer(old.caip_media_upload_file_id) : null, previous_media_asset_id: previousMediaAssetId, previous_missing_object_key: previousObjectKey, existing_asset_identity_preserved: true, old_object_not_deleted: true, provider_execution_active: false })
  ).run().catch(() => null);

  await auditAdminAction(context.env, context.request, state.adminUser, {
    action_type: 'caip_missing_binary_recovered', target_type: 'creative_asset', target_id: targetAssetId, target_key: target.asset_key || null,
    details: { build: BUILD, recovery_mode: linkedHistory ? 'linked_history' : 'asset_only_legacy', creative_project_id: integer(replacement.creative_project_id), replacement_upload_file_id: replacementId, replacement_registration_asset_id: replacementAssetId, previous_media_asset_id: previousMediaAssetId, previous_missing_object_key: previousObjectKey, r2_head_verified: true, verified_bytes: numeric(head.size), existing_asset_identity_preserved: true, previous_missing_object_not_deleted: true, provider_execution_active: false }
  }).catch(() => null);

  return {
    ok: true, build: BUILD, action: 'finalize', recovery_mode: linkedHistory ? 'linked_history' : 'asset_only_legacy',
    creative_project_id: integer(replacement.creative_project_id), creative_asset_id: targetAssetId,
    replacement_upload_file_id: replacementId, replacement_registration_asset_id: replacementAssetId,
    verified_private_object: true, existing_asset_identity_preserved: true,
    previous_missing_object_not_deleted: true, r2_size: numeric(head.size), provider_execution_active: false,
  };
}

export async function onRequestPost(context) {
  const state = await access(context);
  if (state.error) return state.error;
  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'A JSON request body is required.', error_code: 'CAIP_RECOVERY_JSON_REQUIRED' }, 400); }
  const action = normalizeText(body.action).toLowerCase();
  try {
    if (action === 'prepare') return json(await prepareRecovery(state, context, body));
    if (action === 'finalize') return json(await finalizeRecovery(state, context, body));
    throw new Error('Unsupported CAIP missing-binary recovery action.');
  } catch (error) {
    const code = errorCode(error);
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'caip_missing_binary_recovery', incident_code: 'caip_missing_binary_recovery_failed', severity: 'warning',
      message: error?.message || 'CAIP missing-binary recovery failed.', related_user_id: state.adminUser.user_id,
      details: { build: BUILD, action, error_code: code, creative_project_id: integer(body.creative_project_id) || null, creative_asset_id: integer(body.creative_asset_id) || null, upload_file_id: integer(body.caip_media_upload_file_id || body.file_id) || null, error: String(error?.message || error), provider_execution_active: false }
    }).catch(() => null);
    return json({ ok: false, build: BUILD, error: error?.message || 'CAIP missing-binary recovery failed.', error_code: code, action, provider_execution_active: false, source_media_unchanged: true }, 400);
  }
}
