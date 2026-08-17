// Build 241 — Devil n Dove CAIP private raw-media intake helpers.
// D1 stores metadata/state only. Binary originals remain in a dedicated private R2 binding.

export const CAIP_MEDIA_INTAKE_BUILD = 'Build 265';
export const CAIP_PRIVATE_BUCKET_BINDING = 'CAIP_PRIVATE_MEDIA_BUCKET';
export const CAIP_PUBLIC_BUCKET_BINDING = 'PRODUCT_MEDIA_BUCKET';
export const DEFAULT_PART_BYTES = 32 * 1024 * 1024;
export const DIRECT_UPLOAD_MAX_BYTES = 90 * 1024 * 1024;
export const MIN_PART_BYTES = 5 * 1024 * 1024;
export const MAX_PART_BYTES = 5 * 1024 * 1024 * 1024;
export const MAX_PARTS = 10000;
export const MAX_OBJECT_BYTES = 5 * 1024 * 1024 * 1024 * 1024;

function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max).trim() : clean;
}
function integer(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
function numeric(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function safeJson(value, fallback = {}) { try { return JSON.parse(String(value || '')); } catch { return fallback; } }
function sanitizeFilename(value) {
  const raw = text(value, 300).replace(/[\\/]+/g, '-').replace(/[^A-Za-z0-9._ -]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
  return raw.slice(-160) || 'media.bin';
}
function normalizeMediaType(mime, filename) {
  const type = text(mime, 180).toLowerCase();
  const lower = text(filename, 300).toLowerCase();
  if (type.startsWith('image/') || /\.(jpe?g|jfif|png|webp|heic|heif|avif|gif|bmp|tiff?)$/i.test(lower)) return 'image';
  if (type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mpeg|mpg|avi|mkv|mts|m2ts|3gp)$/i.test(lower)) return 'video';
  if (type.startsWith('audio/') || /\.(wav|m4a|mp3|aac|flac|ogg)$/i.test(lower)) return 'audio';
  return 'other';
}
function role(value) {
  const key = text(value, 80).toLowerCase();
  const allowed = ['before','during','after','material','tool','process','mistake','repair','finished_product','packaging','narration','b_roll','reference','miscellaneous'];
  return allowed.includes(key) ? key : 'miscellaneous';
}
function privacy(value) {
  const key = text(value, 40).toLowerCase();
  return ['private','internal_review','public_candidate','public_approved','blocked'].includes(key) ? key : 'private';
}
function consent(value) {
  const key = text(value, 40).toLowerCase();
  return ['not_applicable','unknown','internal_only','public_allowed','revoked','blocked'].includes(key) ? key : 'not_applicable';
}
function rights(value) {
  const key = text(value, 40).toLowerCase();
  return ['needs_review','internal_only','public_allowed','blocked'].includes(key) ? key : 'needs_review';
}
function mimeAllowed(mime, filename) {
  return normalizeMediaType(mime, filename) !== 'other';
}
function objectCategory(mediaType) {
  return mediaType === 'image' ? 'photos' : mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'audio' : 'other';
}
function roundUpMiB(value) {
  const mib = 1024 * 1024;
  return Math.ceil(value / mib) * mib;
}
export function choosePartSize(fileBytes) {
  const bytes = Math.max(0, numeric(fileBytes));
  if (!bytes) return DEFAULT_PART_BYTES;
  const minimumForPartCount = roundUpMiB(Math.ceil(bytes / MAX_PARTS));
  return Math.min(MAX_PART_BYTES, Math.max(DEFAULT_PART_BYTES, MIN_PART_BYTES, minimumForPartCount));
}
function safePartCount(fileBytes, partBytes) {
  return Math.max(1, Math.ceil(Math.max(1, numeric(fileBytes)) / Math.max(MIN_PART_BYTES, numeric(partBytes))));
}
async function hashText(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
function bucketBinding(env) {
  return env?.CAIP_PRIVATE_MEDIA_BUCKET || null;
}
export function privateBucketAvailable(env) {
  const bucket = bucketBinding(env);
  return Boolean(bucket && typeof bucket.createMultipartUpload === 'function' && typeof bucket.resumeMultipartUpload === 'function');
}
export function resolveCaipBucket(env, storageProvider = '', bucketAlias = '') {
  const provider = text(storageProvider).toLowerCase();
  const alias = text(bucketAlias).toUpperCase();
  if (provider === 'r2_private_caip' || alias === CAIP_PRIVATE_BUCKET_BINDING) return env?.CAIP_PRIVATE_MEDIA_BUCKET || null;
  return env?.PRODUCT_MEDIA_BUCKET || env?.MEDIA_BUCKET || env?.R2_PRODUCT_MEDIA || null;
}

export async function assertCaipMediaIntakeSchema(db) {
  try {
    await db.prepare(`SELECT caip_media_upload_session_id FROM caip_media_upload_sessions LIMIT 1`).all();
    await db.prepare(`SELECT caip_media_upload_file_id FROM caip_media_upload_files LIMIT 1`).all();
    await db.prepare(`SELECT caip_media_upload_part_id FROM caip_media_upload_parts LIMIT 1`).all();
  } catch {
    throw new Error('Build 241 CAIP media schema is not installed. Back up D1 and apply database_build241_caip_large_media_intake.sql before using private media intake.');
  }
}

async function projectRow(db, creativeProjectId) {
  const project = await db.prepare(`SELECT creative_project_id,creative_project_key,product_id,project_title,project_status,governance_status FROM creative_projects WHERE creative_project_id=? LIMIT 1`).bind(integer(creativeProjectId)).first();
  if (!project) throw new Error('Choose a valid CAIP Creative Project first.');
  return project;
}

export async function listCaipMediaIntake(db, creativeProjectId = 0, env = {}) {
  await assertCaipMediaIntakeSchema(db);
  const projects = rows(await db.prepare(`SELECT creative_project_id,creative_project_key,product_id,project_title,project_status,governance_status,updated_at FROM creative_projects WHERE project_status<>'archived' ORDER BY updated_at DESC,creative_project_id DESC LIMIT 120`).all());
  const projectId = integer(creativeProjectId) || integer(projects[0]?.creative_project_id);
  const settings = rows(await db.prepare(`SELECT setting_key,setting_value,value_kind,notes,updated_at FROM caip_media_intake_settings WHERE is_secret=0 ORDER BY caip_media_intake_setting_id`).all());
  if (!projectId) return { projects, settings, selected_project_id: null, sessions: [], files: [], parts: [], processing_jobs: [], promotion_requests: [], binding: bindingSummary(env) };
  const [sessions, files, parts, jobs, promotions] = await Promise.all([
    db.prepare(`SELECT * FROM caip_media_upload_sessions WHERE creative_project_id=? ORDER BY caip_media_upload_session_id DESC LIMIT 30`).bind(projectId).all(),
    db.prepare(`SELECT f.*,s.session_key FROM caip_media_upload_files f JOIN caip_media_upload_sessions s ON s.caip_media_upload_session_id=f.caip_media_upload_session_id WHERE f.creative_project_id=? ORDER BY f.caip_media_upload_file_id DESC LIMIT 180`).bind(projectId).all(),
    db.prepare(`SELECT p.* FROM caip_media_upload_parts p JOIN caip_media_upload_files f ON f.caip_media_upload_file_id=p.caip_media_upload_file_id WHERE f.creative_project_id=? ORDER BY p.caip_media_upload_file_id DESC,p.part_number ASC LIMIT 1200`).bind(projectId).all(),
    db.prepare(`SELECT * FROM caip_media_processing_jobs WHERE creative_project_id=? ORDER BY caip_media_processing_job_id DESC LIMIT 120`).bind(projectId).all(),
    db.prepare(`SELECT * FROM caip_media_public_promotion_requests WHERE creative_project_id=? ORDER BY caip_media_public_promotion_request_id DESC LIMIT 120`).bind(projectId).all()
  ]);
  return {
    projects, settings, selected_project_id: projectId,
    sessions: rows(sessions), files: rows(files), parts: rows(parts), processing_jobs: rows(jobs), promotion_requests: rows(promotions),
    binding: bindingSummary(env)
  };
}

function bindingSummary(env) {
  const available = privateBucketAvailable(env);
  return {
    private_bucket_binding: CAIP_PRIVATE_BUCKET_BINDING,
    private_bucket_available: available,
    public_bucket_binding: CAIP_PUBLIC_BUCKET_BINDING,
    transport_mode: 'worker_streamed_multipart_v1',
    preferred_future_transport: 'direct_s3_presigned_multipart',
    default_part_size_bytes: DEFAULT_PART_BYTES,
    default_parallel_parts: 2,
    raw_original_policy: 'immutable',
    public_access: false
  };
}

export async function createUploadSession(db, env, creativeProjectId, filesInput, actorUserId, options = {}) {
  await assertCaipMediaIntakeSchema(db);
  const project = await projectRow(db, creativeProjectId);
  const files = Array.isArray(filesInput) ? filesInput.slice(0, 200) : [];
  if (!files.length) throw new Error('Choose at least one image, video, or audio file.');
  const accepted = [];
  let totalBytes = 0;
  for (const item of files) {
    const filename = sanitizeFilename(item?.name || item?.original_filename);
    const mime = text(item?.type || item?.mime_type, 180).toLowerCase();
    const size = Math.max(0, Math.floor(numeric(item?.size || item?.file_size_bytes)));
    if (!filename || !size) throw new Error('Every upload file needs a filename and non-zero size.');
    if (size > MAX_OBJECT_BYTES) throw new Error(`${filename} exceeds the 5 TiB R2 multipart object limit.`);
    if (!mimeAllowed(mime, filename)) throw new Error(`${filename} is not an accepted image, video, or audio type.`);
    totalBytes += size;
    accepted.push({ ...item, filename, mime, size, mediaType: normalizeMediaType(mime, filename) });
  }
  const sessionKey = `caip-upload-${project.creative_project_id}-${crypto.randomUUID()}`;
  const objectPrefix = `projects/${project.creative_project_id}/raw`;
  const sessionResult = await db.prepare(`INSERT INTO caip_media_upload_sessions(
    creative_project_id,session_key,session_status,storage_profile,object_prefix,transport_mode,preferred_direct_transport,
    part_size_bytes,parallel_parts,upload_device,source_note,total_files,total_bytes,uploaded_bytes,created_by_user_id,updated_by_user_id,created_at,updated_at
  ) VALUES(?,?,'ready','private_r2',?,'worker_streamed_multipart_v1','direct_s3_presigned_multipart_future',?,?,?,?,?,?,0,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
    project.creative_project_id, sessionKey, objectPrefix, DEFAULT_PART_BYTES, 2, text(options.upload_device, 180) || null,
    text(options.source_note, 1000) || null, accepted.length, totalBytes, integer(actorUserId) || null, integer(actorUserId) || null
  ).run();
  const sessionId = integer(sessionResult?.meta?.last_row_id);
  const created = [];
  const duplicates = [];
  for (const item of accepted) {
    const clientKey = text(item.client_key, 120) || crypto.randomUUID();
    const fileKey = crypto.randomUUID();
    const useDirectUpload = item.size <= DIRECT_UPLOAD_MAX_BYTES;
    const partBytes = useDirectUpload ? item.size : choosePartSize(item.size);
    const expectedParts = useDirectUpload ? 1 : safePartCount(item.size, partBytes);
    if (expectedParts > MAX_PARTS) throw new Error(`${item.filename} would exceed the 10,000-part multipart limit.`);
    const fingerprint = text(item.file_fingerprint, 180) || await hashText([item.filename,item.size,item.lastModified || item.last_modified_ms || 0,item.mime].join('|'));
    const duplicate = await db.prepare(`SELECT caip_media_upload_file_id,creative_project_id,original_filename,object_key,uploaded_at FROM caip_media_upload_files WHERE file_fingerprint=? AND file_size_bytes=? AND upload_status='uploaded' ORDER BY caip_media_upload_file_id DESC LIMIT 1`).bind(fingerprint,item.size).first().catch(()=>null);
    // Build 246: an exact uploaded fingerprint already owned by this CAIP project is not ingested twice.
    // Cross-project matches remain warnings because the same source file can legitimately support separate projects.
    if (duplicate && Number(duplicate.creative_project_id || 0) === Number(project.creative_project_id || 0)) {
      duplicates.push({ client_file_key: clientKey, current_file_id: null, possible_duplicate: duplicate, skipped_duplicate: true, duplicate_scope: 'same_project' });
      continue;
    }
    const objectKey = `${objectPrefix}/${objectCategory(item.mediaType)}/${fileKey}-${sanitizeFilename(item.filename)}`;
    const insert = await db.prepare(`INSERT INTO caip_media_upload_files(
      caip_media_upload_session_id,creative_project_id,client_file_key,file_key,original_filename,mime_type,media_type,media_role,
      file_size_bytes,last_modified_ms,capture_at,upload_device,upload_status,storage_provider,bucket_alias,object_key,
      part_size_bytes,expected_parts,uploaded_parts,uploaded_bytes,file_fingerprint,checksum_algorithm,checksum_status,
      privacy_state,consent_state,rights_status,created_by_user_id,updated_by_user_id,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'waiting','r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET',?,?,?,0,0,?,'SHA-256','pending',?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
      sessionId, project.creative_project_id, clientKey, fileKey, item.filename, item.mime || null, item.mediaType,
      role(item.media_role || options.media_role), item.size, Math.floor(numeric(item.lastModified || item.last_modified_ms)) || null,
      text(item.capture_at, 80) || null, text(options.upload_device || item.upload_device,180) || null,
      objectKey, partBytes, expectedParts, fingerprint,
      privacy(item.privacy_state || options.privacy_state), consent(item.consent_state || options.consent_state), rights(item.rights_status || options.rights_status),
      integer(actorUserId) || null, integer(actorUserId) || null
    ).run();
    const fileId = integer(insert?.meta?.last_row_id);
    for (let partNumber=1; partNumber<=expectedParts; partNumber += 1) {
      const start = (partNumber - 1) * partBytes;
      const end = Math.min(item.size, start + partBytes);
      await db.prepare(`INSERT INTO caip_media_upload_parts(caip_media_upload_file_id,part_number,byte_start,byte_end,part_size_bytes,part_status,created_at,updated_at) VALUES(?,?,?,?,?,'waiting',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(fileId,partNumber,start,end,end-start).run();
    }
    const row = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(fileId).first();
    created.push(row);
    if (duplicate) duplicates.push({ client_file_key: clientKey, current_file_id: fileId, possible_duplicate: duplicate });
  }
  const createdBytes = created.reduce((sum, row) => sum + Math.max(0, numeric(row?.file_size_bytes)), 0);
  await db.prepare(`UPDATE caip_media_upload_sessions SET total_files=?,total_bytes=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_session_id=?`).bind(created.length,createdBytes,sessionId).run();
  await db.prepare(`INSERT INTO creative_project_events(creative_project_id,event_type,actor_user_id,details_json,created_at) VALUES(?, 'caip_private_media_session_created', ?, ?, CURRENT_TIMESTAMP)`).bind(project.creative_project_id,integer(actorUserId)||null,JSON.stringify({session_key:sessionKey,file_count:created.length,total_bytes:createdBytes,duplicates_skipped:duplicates.filter((row)=>row.skipped_duplicate).length,private_r2:true,raw_immutable:true})).run().catch(()=>null);
  return { session: await db.prepare(`SELECT * FROM caip_media_upload_sessions WHERE caip_media_upload_session_id=?`).bind(sessionId).first(), files: created, possible_duplicates: duplicates, skipped_duplicate_count: duplicates.filter((row)=>row.skipped_duplicate).length, binding: bindingSummary(env) };
}

export async function initiateUploadFile(db, env, fileId, actorUserId) {
  await assertCaipMediaIntakeSchema(db);
  const row = await db.prepare(`SELECT f.*,s.session_status FROM caip_media_upload_files f JOIN caip_media_upload_sessions s ON s.caip_media_upload_session_id=f.caip_media_upload_session_id WHERE f.caip_media_upload_file_id=? LIMIT 1`).bind(integer(fileId)).first();
  if (!row) throw new Error('CAIP upload file was not found.');
  if (row.upload_status === 'uploaded') return { file: row, already_uploaded: true };
  if (row.upload_status === 'aborted') throw new Error('This upload was aborted and cannot be resumed. Create a new upload session for the file.');
  if (numeric(row.file_size_bytes) <= DIRECT_UPLOAD_MAX_BYTES && !text(row.r2_upload_id)) {
    if (!privateBucketAvailable(env)) throw new Error('Private CAIP R2 binding is not configured. Add CAIP_PRIVATE_MEDIA_BUCKET before starting binary uploads. D1 metadata remains unchanged.');
    await db.prepare(`UPDATE caip_media_upload_files SET upload_status='uploading',initiated_at=COALESCE(initiated_at,CURRENT_TIMESTAMP),updated_by_user_id=?,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(integer(actorUserId)||null,row.caip_media_upload_file_id).run();
    await db.prepare(`UPDATE caip_media_upload_sessions SET session_status='uploading',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_session_id=?`).bind(integer(actorUserId)||null,row.caip_media_upload_session_id).run();
    return { file: await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(row.caip_media_upload_file_id).first(), direct_upload: true, direct_upload_max_bytes: DIRECT_UPLOAD_MAX_BYTES };
  }
  if (text(row.r2_upload_id)) return { file: row, resumed_existing_upload: true, direct_upload:false };
  const bucket = bucketBinding(env);
  if (!privateBucketAvailable(env)) throw new Error('Private CAIP R2 binding is not configured. Add CAIP_PRIVATE_MEDIA_BUCKET before starting binary uploads. D1 metadata remains unchanged.');
  let upload;
  try {
    upload = await bucket.createMultipartUpload(row.object_key, {
      httpMetadata: { contentType: row.mime_type || 'application/octet-stream' },
      customMetadata: {
        caip_project_id: String(row.creative_project_id),
        caip_file_id: String(row.caip_media_upload_file_id),
        media_role: String(row.media_role || 'miscellaneous'),
        privacy_state: String(row.privacy_state || 'private'),
        original_name: sanitizeFilename(row.original_filename)
      }
    });
  } catch (error) {
    const detail = text(error?.message || error, 900) || 'Unknown R2 multipart initialization error.';
    await db.prepare(`UPDATE caip_media_upload_files SET upload_status='failed',last_error=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(`R2 multipart initialization failed: ${detail}`,integer(actorUserId)||null,row.caip_media_upload_file_id).run().catch(()=>null);
    throw new Error(`Private R2 multipart initialization failed for ${row.original_filename}: ${detail}`);
  }
  await db.prepare(`UPDATE caip_media_upload_files SET r2_upload_id=?,upload_status='uploading',initiated_at=COALESCE(initiated_at,CURRENT_TIMESTAMP),updated_by_user_id=?,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(upload.uploadId,integer(actorUserId)||null,row.caip_media_upload_file_id).run();
  await db.prepare(`UPDATE caip_media_upload_sessions SET session_status='uploading',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_session_id=?`).bind(integer(actorUserId)||null,row.caip_media_upload_session_id).run();
  return { file: await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(row.caip_media_upload_file_id).first(), upload_id_recorded: true, raw_original_policy: 'immutable' };
}

export async function uploadedPartState(db, fileId) {
  const file = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(integer(fileId)).first();
  if (!file) throw new Error('CAIP upload file was not found.');
  const parts = rows(await db.prepare(`SELECT * FROM caip_media_upload_parts WHERE caip_media_upload_file_id=? ORDER BY part_number`).bind(file.caip_media_upload_file_id).all());
  return { file, parts };
}

export async function recordUploadedPart(db, fileId, partNumber, uploadedPart, actorUserId) {
  const part = await db.prepare(`SELECT p.*,f.caip_media_upload_session_id FROM caip_media_upload_parts p JOIN caip_media_upload_files f ON f.caip_media_upload_file_id=p.caip_media_upload_file_id WHERE p.caip_media_upload_file_id=? AND p.part_number=? LIMIT 1`).bind(integer(fileId),integer(partNumber)).first();
  if (!part) throw new Error('Multipart part record was not found.');
  await db.prepare(`UPDATE caip_media_upload_parts SET part_status='uploaded',etag=?,attempt_count=attempt_count+1,last_error=NULL,uploaded_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_part_id=?`).bind(text(uploadedPart?.etag,300)||null,part.caip_media_upload_part_id).run();
  const totals = await db.prepare(`SELECT COUNT(*) uploaded_parts,COALESCE(SUM(part_size_bytes),0) uploaded_bytes FROM caip_media_upload_parts WHERE caip_media_upload_file_id=? AND part_status='uploaded'`).bind(integer(fileId)).first();
  await db.prepare(`UPDATE caip_media_upload_files SET upload_status='uploading',uploaded_parts=?,uploaded_bytes=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(numeric(totals?.uploaded_parts),numeric(totals?.uploaded_bytes),integer(actorUserId)||null,integer(fileId)).run();
  await refreshSessionProgress(db, part.caip_media_upload_session_id, actorUserId);
  return uploadedPartState(db,fileId);
}

export async function recordPartFailure(db, fileId, partNumber, message) {
  await db.prepare(`UPDATE caip_media_upload_parts SET part_status='failed',attempt_count=attempt_count+1,last_error=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=? AND part_number=?`).bind(text(message,900)||'Part upload failed.',integer(fileId),integer(partNumber)).run().catch(()=>null);
  await db.prepare(`UPDATE caip_media_upload_files SET upload_status='failed',last_error=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=? AND upload_status<>'uploaded'`).bind(text(message,900)||'Part upload failed.',integer(fileId)).run().catch(()=>null);
}

async function refreshSessionProgress(db, sessionId, actorUserId = null) {
  const stats = await db.prepare(`SELECT COUNT(*) total_files,COALESCE(SUM(file_size_bytes),0) total_bytes,COALESCE(SUM(uploaded_bytes),0) uploaded_bytes,SUM(CASE WHEN upload_status='uploaded' THEN 1 ELSE 0 END) uploaded_files,SUM(CASE WHEN upload_status='failed' THEN 1 ELSE 0 END) failed_files,SUM(CASE WHEN upload_status='aborted' THEN 1 ELSE 0 END) aborted_files FROM caip_media_upload_files WHERE caip_media_upload_session_id=?`).bind(integer(sessionId)).first();
  let status = 'ready';
  if (numeric(stats?.uploaded_files) === numeric(stats?.total_files) && numeric(stats?.total_files) > 0) status = 'complete';
  else if (numeric(stats?.failed_files) > 0) status = 'failed';
  else if (numeric(stats?.aborted_files) === numeric(stats?.total_files) && numeric(stats?.total_files) > 0) status = 'aborted';
  else if (numeric(stats?.uploaded_bytes) > 0) status = 'uploading';
  await db.prepare(`UPDATE caip_media_upload_sessions SET session_status=?,total_files=?,total_bytes=?,uploaded_bytes=?,updated_by_user_id=COALESCE(?,updated_by_user_id),updated_at=CURRENT_TIMESTAMP,completed_at=CASE WHEN ?='complete' THEN COALESCE(completed_at,CURRENT_TIMESTAMP) ELSE completed_at END WHERE caip_media_upload_session_id=?`).bind(status,numeric(stats?.total_files),numeric(stats?.total_bytes),numeric(stats?.uploaded_bytes),integer(actorUserId)||null,status,integer(sessionId)).run();
}

async function createCanonicalPrivateAsset(db, file, head, actorUserId) {
  const existingMedia = await db.prepare(`SELECT * FROM media_assets WHERE object_key=? LIMIT 1`).bind(file.object_key).first();
  let mediaAssetId = integer(existingMedia?.media_asset_id);
  if (!mediaAssetId) {
    const project = await db.prepare(`SELECT product_id FROM creative_projects WHERE creative_project_id=? LIMIT 1`).bind(file.creative_project_id).first();
    const inserted = await db.prepare(`INSERT INTO media_assets(product_id,storage_provider,bucket_name,object_key,public_url,original_filename,mime_type,file_size_bytes,created_by_user_id,created_at,updated_at,variant_role,annotation_notes) VALUES(?, 'r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET',?,NULL,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?,?)`).bind(
      integer(project?.product_id)||null,file.object_key,file.original_filename,file.mime_type||head?.httpMetadata?.contentType||null,numeric(head?.size||file.file_size_bytes),integer(actorUserId)||null,file.media_role||'miscellaneous','Private CAIP raw original. No public URL. Raw object is immutable.'
    ).run();
    mediaAssetId = integer(inserted?.meta?.last_row_id);
  }
  const assetKey = `private-upload-${file.file_key}`;
  const sourceFingerprint = file.checksum_value || file.file_fingerprint || text(head?.etag,300) || assetKey;
  const sourceSafety = file.consent_state === 'public_allowed' && file.rights_status === 'public_allowed' ? 'public_allowed' : file.rights_status === 'blocked' ? 'blocked' : file.rights_status === 'internal_only' ? 'internal_only' : 'needs_review';
  await db.prepare(`INSERT INTO creative_assets(
    creative_project_id,media_asset_id,asset_key,source_url,source_fingerprint,logical_archive_path,source_safety_status,rights_status,asset_status,media_type,original_filename,mime_type,sort_order,is_source_selected,is_source_featured,manual_tags_json,manual_caption,source_metadata_json,first_seen_at,source_refreshed_at,created_at,updated_at
  ) VALUES(?,?,?,NULL,?,?,?,?,'active',?,?,?,0,1,0,'[]',NULL,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  ON CONFLICT(creative_project_id,asset_key) DO UPDATE SET media_asset_id=excluded.media_asset_id,source_fingerprint=excluded.source_fingerprint,logical_archive_path=excluded.logical_archive_path,source_safety_status=excluded.source_safety_status,rights_status=excluded.rights_status,media_type=excluded.media_type,original_filename=excluded.original_filename,mime_type=excluded.mime_type,source_metadata_json=excluded.source_metadata_json,source_refreshed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(
    file.creative_project_id,mediaAssetId,assetKey,sourceFingerprint,file.object_key,sourceSafety,file.rights_status,file.media_type,file.original_filename,file.mime_type||head?.httpMetadata?.contentType||null,
    JSON.stringify({build:CAIP_MEDIA_INTAKE_BUILD,storage_provider:'r2_private_caip',bucket_alias:'CAIP_PRIVATE_MEDIA_BUCKET',object_key:file.object_key,file_size_bytes:numeric(head?.size||file.file_size_bytes),etag:text(head?.etag,300)||null,media_role:file.media_role,privacy_state:file.privacy_state,consent_state:file.consent_state,rights_status:file.rights_status,capture_at:file.capture_at||null,upload_session_id:file.caip_media_upload_session_id,raw_original:true,immutable:true,public_url:null})
  ).run();
  const asset = await db.prepare(`SELECT * FROM creative_assets WHERE creative_project_id=? AND asset_key=? LIMIT 1`).bind(file.creative_project_id,assetKey).first();
  await db.prepare(`UPDATE caip_media_upload_files SET creative_asset_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(asset?.creative_asset_id||null,file.caip_media_upload_file_id).run();
  if (asset?.creative_asset_id) {
    await db.prepare(`INSERT INTO creative_asset_technical_observations(
      creative_project_id,creative_asset_id,observation_key,source_snapshot_fingerprint,storage_provider,bucket_name,object_key,observed_public_url,mime_type,file_size_bytes,etag,uploaded_at,probe_status,probe_scope,evidence_json,observed_at,created_at,updated_at
    ) VALUES(?,?, 'caip_private_upload_v1',?,'r2_private_caip','CAIP_PRIVATE_MEDIA_BUCKET',?,NULL,?,?,?,CURRENT_TIMESTAMP,'complete','private_upload_completion',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(creative_asset_id,observation_key) DO UPDATE SET source_snapshot_fingerprint=excluded.source_snapshot_fingerprint,storage_provider=excluded.storage_provider,bucket_name=excluded.bucket_name,object_key=excluded.object_key,mime_type=excluded.mime_type,file_size_bytes=excluded.file_size_bytes,etag=excluded.etag,uploaded_at=CURRENT_TIMESTAMP,probe_status='complete',probe_scope='private_upload_completion',evidence_json=excluded.evidence_json,observed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).bind(
      file.creative_project_id,asset.creative_asset_id,sourceFingerprint,file.object_key,file.mime_type||head?.httpMetadata?.contentType||null,numeric(head?.size||file.file_size_bytes),text(head?.etag,300)||null,
      JSON.stringify({raw_original:true,immutable:true,public_url:null,private_binding:'CAIP_PRIVATE_MEDIA_BUCKET',upload_file_id:file.caip_media_upload_file_id,verification:'r2_multipart_complete_and_head'})
    ).run();
  }
  return asset;
}

export async function completeUploadFile(db, env, fileId, actorUserId) {
  await assertCaipMediaIntakeSchema(db);
  const { file, parts } = await uploadedPartState(db,fileId);
  if (file.upload_status === 'uploaded' && file.creative_asset_id) return { file, already_complete: true };
  if (!text(file.r2_upload_id)) throw new Error('Multipart upload has not been initiated.');
  const missing = parts.filter((part) => part.part_status !== 'uploaded' || !text(part.etag));
  if (missing.length) throw new Error(`${missing.length} multipart part(s) are still incomplete.`);
  if (!privateBucketAvailable(env)) throw new Error('Private CAIP R2 binding is unavailable; completion cannot be verified.');
  const bucket = bucketBinding(env);
  const upload = bucket.resumeMultipartUpload(file.object_key,file.r2_upload_id);
  const object = await upload.complete(parts.map((part)=>({partNumber:Number(part.part_number),etag:String(part.etag)})));
  const head = await bucket.head(file.object_key);
  if (!head) throw new Error('R2 multipart completion returned but the private raw object could not be verified with HEAD.');
  await db.prepare(`UPDATE caip_media_upload_files SET upload_status='uploaded',uploaded_parts=expected_parts,uploaded_bytes=file_size_bytes,etag=?,last_error=NULL,uploaded_at=CURRENT_TIMESTAMP,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(text(object?.etag||head?.etag,300)||null,integer(actorUserId)||null,file.caip_media_upload_file_id).run();
  const refreshed = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(file.caip_media_upload_file_id).first();
  const asset = await createCanonicalPrivateAsset(db,refreshed,head,actorUserId);
  await queueDefaultProcessingPlans(db,refreshed,asset,actorUserId);
  await refreshSessionProgress(db,refreshed.caip_media_upload_session_id,actorUserId);
  await db.prepare(`INSERT INTO creative_project_events(creative_project_id,event_type,actor_user_id,details_json,created_at) VALUES(?, 'caip_private_media_uploaded', ?, ?, CURRENT_TIMESTAMP)`).bind(refreshed.creative_project_id,integer(actorUserId)||null,JSON.stringify({upload_file_id:refreshed.caip_media_upload_file_id,creative_asset_id:asset?.creative_asset_id||null,object_key:refreshed.object_key,raw_immutable:true,public_url:null})).run().catch(()=>null);
  return { file: await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(file.caip_media_upload_file_id).first(), creative_asset: asset, verified_private_object: true, public_url: null };
}


export async function completeDirectUploadFile(db, env, fileId, actorUserId, head = null) {
  await assertCaipMediaIntakeSchema(db);
  const file = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(integer(fileId)).first();
  if (!file) throw new Error('CAIP upload file was not found.');
  if (file.upload_status === 'uploaded' && file.creative_asset_id) return { file, already_complete:true };
  if (numeric(file.file_size_bytes) > DIRECT_UPLOAD_MAX_BYTES) throw new Error('This file is too large for the direct private-R2 upload route; use multipart upload.');
  if (!privateBucketAvailable(env)) throw new Error('Private CAIP R2 binding is unavailable; direct upload cannot be verified.');
  const bucket = bucketBinding(env);
  const verified = head || await bucket.head(file.object_key);
  if (!verified) throw new Error('Direct R2 upload returned but the private raw object could not be verified with HEAD.');
  if (numeric(verified.size) !== numeric(file.file_size_bytes)) throw new Error(`Direct R2 upload size mismatch: expected ${numeric(file.file_size_bytes)} bytes but R2 reports ${numeric(verified.size)}.`);
  await db.prepare(`UPDATE caip_media_upload_parts SET part_status='uploaded',etag=?,attempt_count=attempt_count+1,last_error=NULL,uploaded_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(text(verified.etag,300)||null,file.caip_media_upload_file_id).run();
  await db.prepare(`UPDATE caip_media_upload_files SET upload_status='uploaded',uploaded_parts=expected_parts,uploaded_bytes=file_size_bytes,etag=?,last_error=NULL,uploaded_at=CURRENT_TIMESTAMP,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(text(verified.etag,300)||null,integer(actorUserId)||null,file.caip_media_upload_file_id).run();
  const refreshed = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(file.caip_media_upload_file_id).first();
  const asset = await createCanonicalPrivateAsset(db,refreshed,verified,actorUserId);
  await queueDefaultProcessingPlans(db,refreshed,asset,actorUserId);
  await refreshSessionProgress(db,refreshed.caip_media_upload_session_id,actorUserId);
  await db.prepare(`INSERT INTO creative_project_events(creative_project_id,event_type,actor_user_id,details_json,created_at) VALUES(?, 'caip_private_media_uploaded', ?, ?, CURRENT_TIMESTAMP)`).bind(refreshed.creative_project_id,integer(actorUserId)||null,JSON.stringify({upload_file_id:refreshed.caip_media_upload_file_id,creative_asset_id:asset?.creative_asset_id||null,object_key:refreshed.object_key,transport:'worker_streamed_single_put_v1',raw_immutable:true,public_url:null})).run().catch(()=>null);
  return { file: await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(file.caip_media_upload_file_id).first(), creative_asset:asset, verified_private_object:true, direct_upload:true, public_url:null };
}

export async function abortUploadFile(db, env, fileId, actorUserId) {
  await assertCaipMediaIntakeSchema(db);
  const file = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(integer(fileId)).first();
  if (!file) throw new Error('CAIP upload file was not found.');
  if (file.upload_status === 'uploaded') throw new Error('Uploaded raw originals are immutable and cannot be deleted from this control. Archive or supersede downstream references instead.');
  if (text(file.r2_upload_id)) {
    if (!privateBucketAvailable(env)) throw new Error('Private CAIP R2 binding is unavailable, so the active multipart upload cannot be aborted safely.');
    const upload = bucketBinding(env).resumeMultipartUpload(file.object_key,file.r2_upload_id);
    await upload.abort();
  }
  await db.prepare(`UPDATE caip_media_upload_parts SET part_status=CASE WHEN part_status='uploaded' THEN 'uploaded' ELSE 'aborted' END,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(file.caip_media_upload_file_id).run();
  await db.prepare(`UPDATE caip_media_upload_files SET upload_status='aborted',aborted_at=CURRENT_TIMESTAMP,last_error=NULL,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(integer(actorUserId)||null,file.caip_media_upload_file_id).run();
  await refreshSessionProgress(db,file.caip_media_upload_session_id,actorUserId);
  return { file_id:file.caip_media_upload_file_id,aborted:true,raw_object_created:false };
}

export async function updateUploadFileGovernance(db,fileId,patch,actorUserId) {
  await assertCaipMediaIntakeSchema(db);
  const file = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(integer(fileId)).first();
  if (!file) throw new Error('CAIP upload file was not found.');
  const nextPrivacy = privacy(patch.privacy_state ?? file.privacy_state);
  const nextConsent = consent(patch.consent_state ?? file.consent_state);
  const nextRights = rights(patch.rights_status ?? file.rights_status);
  if (nextPrivacy === 'public_approved' && nextRights !== 'public_allowed') throw new Error('Public-approved privacy state requires public_allowed rights.');
  if (nextPrivacy === 'public_approved' && !['public_allowed','not_applicable'].includes(nextConsent)) throw new Error('Public-approved privacy state requires public-allowed or not-applicable consent.');
  await db.prepare(`UPDATE caip_media_upload_files SET privacy_state=?,consent_state=?,rights_status=?,media_role=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE caip_media_upload_file_id=?`).bind(nextPrivacy,nextConsent,nextRights,role(patch.media_role??file.media_role),integer(actorUserId)||null,file.caip_media_upload_file_id).run();
  if (integer(file.creative_asset_id)) {
    const sourceSafety = nextConsent === 'public_allowed' && nextRights === 'public_allowed' ? 'public_allowed' : nextRights === 'blocked' ? 'blocked' : nextRights === 'internal_only' ? 'internal_only' : 'needs_review';
    await db.prepare(`UPDATE creative_assets SET source_safety_status=?,rights_status=?,updated_at=CURRENT_TIMESTAMP WHERE creative_asset_id=?`).bind(sourceSafety,nextRights,file.creative_asset_id).run();
  }
  return db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=?`).bind(file.caip_media_upload_file_id).first();
}

export async function queueDefaultProcessingPlans(db,file,asset,actorUserId) {
  if (!asset?.creative_asset_id) return [];
  const jobs = ['metadata','thumbnail'];
  if (file.media_type === 'video') jobs.push('proxy_video','frame_extract','audio_extract','transcript');
  if (file.media_type === 'audio') jobs.push('transcript');
  const outputRoot = `projects/${file.creative_project_id}`;
  for (const type of jobs) {
    const key = `caip-${file.file_key}-${type}`;
    const outputPrefix = type === 'proxy_video' ? `${outputRoot}/proxy/video/` : type === 'thumbnail' ? `${outputRoot}/derived/thumbnails/` : type === 'frame_extract' ? `${outputRoot}/extracted/frames/${file.file_key}/` : type === 'audio_extract' ? `${outputRoot}/extracted/audio/` : type === 'transcript' ? `${outputRoot}/extracted/transcripts/` : `${outputRoot}/manifests/`;
    await db.prepare(`INSERT INTO caip_media_processing_jobs(creative_project_id,creative_asset_id,caip_media_upload_file_id,job_key,job_type,job_status,provider_key,input_object_key,output_prefix,requested_by_user_id,created_at,updated_at) VALUES(?,?,?,?,?,'planned','not_configured',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(job_key) DO NOTHING`).bind(file.creative_project_id,asset.creative_asset_id,file.caip_media_upload_file_id,key,type,file.object_key,outputPrefix,integer(actorUserId)||null).run();
  }
  return rows(await db.prepare(`SELECT * FROM caip_media_processing_jobs WHERE caip_media_upload_file_id=? ORDER BY caip_media_processing_job_id`).bind(file.caip_media_upload_file_id).all());
}

export async function requestPublicPromotion(db,fileId,destinationRole,actorUserId) {
  await assertCaipMediaIntakeSchema(db);
  const file = await db.prepare(`SELECT * FROM caip_media_upload_files WHERE caip_media_upload_file_id=? LIMIT 1`).bind(integer(fileId)).first();
  if (!file || file.upload_status !== 'uploaded' || !integer(file.creative_asset_id)) throw new Error('Only a completed private CAIP asset can request public promotion.');
  if (file.rights_status === 'blocked' || file.consent_state === 'blocked' || file.consent_state === 'revoked' || file.privacy_state === 'blocked') throw new Error('Blocked or revoked media cannot enter public promotion review.');
  const requestKey = `promotion-${file.file_key}-${crypto.randomUUID()}`;
  const roleName = text(destinationRole,80).toLowerCase() || 'website_gallery';
  await db.prepare(`INSERT INTO caip_media_public_promotion_requests(creative_project_id,creative_asset_id,caip_media_upload_file_id,request_key,destination_role,request_status,private_object_key,target_public_bucket_alias,rights_status_snapshot,consent_state_snapshot,privacy_state_snapshot,evidence_json,requested_by_user_id,requested_at,updated_at) VALUES(?,?,?,?,?,'needs_review',?,'PRODUCT_MEDIA_BUCKET',?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(
    file.creative_project_id,file.creative_asset_id,file.caip_media_upload_file_id,requestKey,roleName,file.object_key,file.rights_status,file.consent_state,file.privacy_state,
    JSON.stringify({private_raw_unchanged:true,no_public_copy_created:true,requires_human_review:true,requested_destination:roleName}),integer(actorUserId)||null
  ).run();
  await db.prepare(`INSERT INTO creative_project_events(creative_project_id,event_type,actor_user_id,details_json,created_at) VALUES(?, 'caip_public_promotion_requested', ?, ?, CURRENT_TIMESTAMP)`).bind(file.creative_project_id,integer(actorUserId)||null,JSON.stringify({upload_file_id:file.caip_media_upload_file_id,creative_asset_id:file.creative_asset_id,request_key:requestKey,no_copy_created:true})).run().catch(()=>null);
  return db.prepare(`SELECT * FROM caip_media_public_promotion_requests WHERE request_key=?`).bind(requestKey).first();
}

export function safeUploadFileForClient(file) {
  if (!file) return null;
  const copy = { ...file };
  delete copy.r2_upload_id;
  return copy;
}


export function makeCaipMediaIntakeManifest(data = {}) {
  const cleanFile = (file) => {
    const copy = safeUploadFileForClient(file) || {};
    return {
      caip_media_upload_file_id: copy.caip_media_upload_file_id || null,
      creative_asset_id: copy.creative_asset_id || null,
      file_key: copy.file_key || null,
      original_filename: copy.original_filename || null,
      mime_type: copy.mime_type || null,
      media_type: copy.media_type || null,
      media_role: copy.media_role || null,
      file_size_bytes: Number(copy.file_size_bytes || 0),
      capture_at: copy.capture_at || null,
      upload_status: copy.upload_status || null,
      storage_provider: copy.storage_provider || null,
      bucket_alias: copy.bucket_alias || null,
      object_key: copy.object_key || null,
      checksum_algorithm: copy.checksum_algorithm || null,
      checksum_value: copy.checksum_value || null,
      checksum_status: copy.checksum_status || null,
      privacy_state: copy.privacy_state || null,
      consent_state: copy.consent_state || null,
      rights_status: copy.rights_status || null,
      raw_original: true,
      immutable: true,
      public_url: null
    };
  };
  return {
    build: CAIP_MEDIA_INTAKE_BUILD,
    private_bucket_binding: data?.binding?.private_bucket_binding || CAIP_PRIVATE_BUCKET_BINDING,
    public_bucket_binding: data?.binding?.public_bucket_binding || CAIP_PUBLIC_BUCKET_BINDING,
    raw_original_policy: 'immutable',
    selected_project_id: data?.selected_project_id || null,
    sessions: (data?.sessions || []).map((row) => ({
      caip_media_upload_session_id: row.caip_media_upload_session_id,
      session_key: row.session_key,
      session_status: row.session_status,
      object_prefix: row.object_prefix,
      transport_mode: row.transport_mode,
      part_size_bytes: Number(row.part_size_bytes || 0),
      parallel_parts: Number(row.parallel_parts || 0),
      total_files: Number(row.total_files || 0),
      total_bytes: Number(row.total_bytes || 0),
      uploaded_bytes: Number(row.uploaded_bytes || 0),
      created_at: row.created_at || null,
      completed_at: row.completed_at || null
    })),
    files: (data?.files || []).map(cleanFile),
    processing_jobs: (data?.processing_jobs || []).map((row) => ({
      job_key: row.job_key, job_type: row.job_type, job_status: row.job_status, provider_key: row.provider_key,
      input_object_key: row.input_object_key || null, output_prefix: row.output_prefix || null,
      attempt_count: Number(row.attempt_count || 0), last_error: row.last_error || null
    })),
    public_promotion_requests: (data?.promotion_requests || []).map((row) => ({
      request_key: row.request_key, destination_role: row.destination_role, request_status: row.request_status,
      private_object_key: row.private_object_key, target_public_bucket_alias: row.target_public_bucket_alias,
      target_public_object_key: row.target_public_object_key || null, target_public_url: row.target_public_url || null,
      rights_status_snapshot: row.rights_status_snapshot, consent_state_snapshot: row.consent_state_snapshot,
      privacy_state_snapshot: row.privacy_state_snapshot, requested_at: row.requested_at || null, promoted_at: row.promoted_at || null
    }))
  };
}
