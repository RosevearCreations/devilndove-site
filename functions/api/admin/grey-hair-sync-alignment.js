// Release 467 Build 46 — Four-Camera Synchronization & Audio Alignment.
// Reuses existing CAIP capture-group/track authorities. No request-time DDL, provider execution,
// publication, R2 mutation, waveform processing or source-original mutation occurs here.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 46;
const TITLE = 'Four-Camera Synchronization & Audio Alignment';
const REQUIRED_TABLES = Object.freeze([
  'creative_projects', 'creative_assets', 'media_assets', 'caip_media_upload_files',
  'caip_asset_ingest_contexts', 'caip_capture_groups', 'caip_capture_tracks',
  'creative_media_evidence_ranges', 'caip_media_processing_artifacts', 'caip_pipeline_events',
]);
const TRACK_REVIEW = new Set(['needs_review', 'confirmed', 'rejected']);
const GROUP_REVIEW = new Set(['needs_review', 'suggested', 'confirmed', 'rejected']);
const METHODS = new Set(['capture_timestamp', 'source_timecode', 'manual_review', 'manual_required']);

const text = (value, max = 0) => {
  const clean = normalizeText(value);
  return max > 0 ? clean.slice(0, max).trim() : clean;
};
const lower = (value) => text(value).toLowerCase();
const integer = (value) => {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};
const numeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const clamp = (value) => Math.max(0, Math.min(100, Math.round(numeric(value, 0))));
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const uniqueIds = (value, max = 12) => [...new Set((Array.isArray(value) ? value : []).map(integer).filter(Boolean))].slice(0, max);
function safeJson(value, fallback = {}) { try { return JSON.parse(String(value || '')); } catch { return fallback; } }
function syncKey() { return `grey-hair-sync-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`; }
function normalizeOffset(value) {
  const parsed = numeric(value, 0);
  if (Math.abs(parsed) > 86400) throw new Error('Synchronization offset must be within 24 hours.');
  return Math.round(parsed * 1000) / 1000;
}
function parseTimecode(value) {
  const raw = text(value, 80);
  if (!raw) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return numeric(raw, 0);
  const match = raw.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const fraction = Number(`0.${String(match[4] || '0').padEnd(3, '0')}`);
  return hours * 3600 + minutes * 60 + seconds + fraction;
}
function captureMillis(row) {
  const meta = safeJson(row?.source_metadata_json, {});
  const raw = row?.ingest_capture_at || row?.upload_capture_at || meta.capture_at || meta.captured_at || meta.created_at || '';
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}
function sourceTimecode(row) {
  const meta = safeJson(row?.source_metadata_json, {});
  return parseTimecode(row?.source_timecode || meta.source_timecode || meta.timecode || '');
}
function isGreyHair(row) {
  return /\bgr[ae]y\b/.test(`${row?.creative_project_key || ''} ${row?.project_title || ''}`.toLowerCase()) && /\bhair\b/.test(`${row?.creative_project_key || ''} ${row?.project_title || ''}`.toLowerCase());
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Admin access required.' }, 401, { 'Cache-Control': 'no-store' }) };
  const db = getDb(context.env);
  if (!db) return { error: jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Database binding is not configured.' }, 503, { 'Cache-Control': 'no-store' }) };
  return { adminUser, db };
}

async function readiness(db) {
  const missing_tables = [];
  for (const table of REQUIRED_TABLES) {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(table).first().catch(() => null);
    if (!row?.name) missing_tables.push(table);
  }
  return { schema_ready: missing_tables.length === 0, missing_tables, canonical_migration_added: false, request_time_ddl: false };
}

async function projectOptions(db) {
  const all = rows(await db.prepare(`
    SELECT creative_project_id,creative_project_key,project_title,project_status,governance_status,updated_at
    FROM creative_projects
    ORDER BY updated_at DESC,creative_project_id DESC LIMIT 200
  `).all());
  const grey = all.filter(isGreyHair);
  return grey.length ? grey : all.filter((row) => lower(row.project_status) !== 'archived').slice(0, 40);
}

async function assetRows(db, projectId) {
  const result = await db.prepare(`
    SELECT ca.creative_asset_id,ca.asset_key,ca.media_type,ca.original_filename,ca.mime_type,ca.source_metadata_json,
           ma.object_key,ma.file_size_bytes,ma.storage_provider,ma.bucket_name,
           uf.capture_at AS upload_capture_at,uf.upload_device,uf.media_role AS upload_media_role,uf.privacy_state,uf.consent_state,uf.upload_status,
           ic.capture_session_key,ic.camera_label,ic.device_label,ic.capture_at AS ingest_capture_at,ic.source_timecode,ic.recognition_status,ic.recognition_confidence,
           COALESCE(obs.duration_seconds,0) AS duration_seconds,COALESCE(obs.width_px,0) AS width_px,COALESCE(obs.height_px,0) AS height_px,
           (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_asset_id=ca.creative_asset_id AND r.marker_status='active') AS marker_count,
           (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_asset_id=ca.creative_asset_id AND r.marker_status='active' AND r.review_status='approved') AS approved_marker_count,
           (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_asset_id=ca.creative_asset_id AND r.marker_status='active' AND COALESCE(r.transcript_excerpt,'')<>'') AS transcript_marker_count,
           (SELECT COUNT(*) FROM caip_media_processing_artifacts a WHERE a.creative_asset_id=ca.creative_asset_id AND a.verification_status IN ('head_verified','checksum_verified')) AS verified_artifact_count
    FROM creative_assets ca
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    LEFT JOIN caip_media_upload_files uf ON uf.caip_media_upload_file_id=(
      SELECT f.caip_media_upload_file_id FROM caip_media_upload_files f
      WHERE f.creative_asset_id=ca.creative_asset_id ORDER BY f.caip_media_upload_file_id DESC LIMIT 1
    )
    LEFT JOIN caip_asset_ingest_contexts ic ON ic.creative_asset_id=ca.creative_asset_id
    LEFT JOIN creative_asset_technical_observations obs ON obs.creative_asset_technical_observation_id=(
      SELECT o.creative_asset_technical_observation_id FROM creative_asset_technical_observations o
      WHERE o.creative_asset_id=ca.creative_asset_id ORDER BY o.observed_at DESC,o.creative_asset_technical_observation_id DESC LIMIT 1
    )
    WHERE ca.creative_project_id=? AND ca.asset_status<>'archived' AND ca.media_type IN ('video','audio')
    ORDER BY CASE ca.media_type WHEN 'video' THEN 1 ELSE 2 END,ca.sort_order,ca.creative_asset_id
  `).bind(projectId).all();
  return rows(result).map((row) => {
    const privateOriginal = Boolean(text(row.object_key) && lower(row.privacy_state || 'private') !== 'public');
    let score = 0;
    if (privateOriginal) score += 20;
    if (numeric(row.duration_seconds) > 0) score += 15;
    if (numeric(row.width_px) > 0 || lower(row.media_type) === 'audio') score += 10;
    if (integer(row.marker_count)) score += 20;
    if (integer(row.transcript_marker_count)) score += 10;
    if (integer(row.approved_marker_count)) score += 15;
    if (integer(row.verified_artifact_count)) score += 10;
    const build45Ready = privateOriginal && integer(row.marker_count) > 0 && integer(row.approved_marker_count) > 0 && Math.min(100, score) >= 70;
    return {
      ...row,
      private_original: privateOriginal,
      build45_coverage_score: Math.min(100, score),
      build45_sync_ready_input: build45Ready,
      capture_timestamp_available: captureMillis(row) !== null,
      source_timecode_seconds: sourceTimecode(row),
    };
  });
}

async function groupRows(db, projectId) {
  const groups = rows(await db.prepare(`
    SELECT * FROM caip_capture_groups WHERE creative_project_id=?
    ORDER BY updated_at DESC,caip_capture_group_id DESC
  `).bind(projectId).all());
  if (!groups.length) return [];
  const tracks = rows(await db.prepare(`
    SELECT t.*,ca.media_type,ca.original_filename,ca.asset_key,ic.capture_at AS ingest_capture_at,ic.source_timecode,
           ic.recognition_status,ic.camera_label AS ingest_camera_label
    FROM caip_capture_tracks t
    INNER JOIN caip_capture_groups g ON g.caip_capture_group_id=t.caip_capture_group_id
    INNER JOIN creative_assets ca ON ca.creative_asset_id=t.creative_asset_id
    LEFT JOIN caip_asset_ingest_contexts ic ON ic.creative_asset_id=t.creative_asset_id
    WHERE g.creative_project_id=?
    ORDER BY g.caip_capture_group_id DESC,t.sort_order,t.caip_capture_track_id
  `).bind(projectId).all());
  return groups.map((group) => ({
    ...group,
    tracks: tracks.filter((track) => integer(track.caip_capture_group_id) === integer(group.caip_capture_group_id)),
  }));
}

function readinessForGroup(group) {
  const tracks = Array.isArray(group?.tracks) ? group.tracks : [];
  const cameras = tracks.filter((row) => lower(row.source_role) === 'camera');
  const audio = tracks.filter((row) => lower(row.source_role) === 'audio');
  const labels = cameras.map((row) => lower(row.camera_label)).filter(Boolean);
  const anchorId = integer(group?.anchor_creative_asset_id);
  const blockers = [];
  if (cameras.length !== 4) blockers.push('Exactly four camera tracks are required.');
  if (new Set(labels).size !== cameras.length) blockers.push('Each camera track needs a unique camera label.');
  if (!anchorId || !cameras.some((row) => integer(row.creative_asset_id) === anchorId)) blockers.push('The anchor must be one of the four camera tracks.');
  if (audio.length > 1) blockers.push('At most one dedicated audio track is allowed.');
  if (tracks.some((row) => lower(row.review_status) === 'rejected')) blockers.push('Rejected tracks must be removed before confirmation.');
  if (cameras.some((row) => lower(row.review_status) !== 'confirmed')) blockers.push('All four camera tracks require confirmed offsets.');
  if (audio.some((row) => lower(row.review_status) !== 'confirmed')) blockers.push('The dedicated audio track requires a confirmed offset.');
  if (tracks.some((row) => lower(row.sync_method) === 'manual_required')) blockers.push('Manual-required tracks need an explicit reviewed offset.');
  return {
    camera_count: cameras.length,
    audio_count: audio.length,
    confirmed_track_count: tracks.filter((row) => lower(row.review_status) === 'confirmed').length,
    ready_for_build47: blockers.length === 0 && lower(group?.sync_status) === 'confirmed',
    confirmation_ready: blockers.length === 0,
    blockers,
  };
}

async function bundle(db, projectId) {
  const projects = await projectOptions(db);
  const project = projects.find((row) => integer(row.creative_project_id) === integer(projectId)) || null;
  if (!project) return { projects, project: null, assets: [], groups: [] };
  const [assets, rawGroups] = await Promise.all([assetRows(db, projectId), groupRows(db, projectId)]);
  const groups = rawGroups.map((group) => ({ ...group, readiness: readinessForGroup(group) }));
  return {
    projects,
    project,
    assets,
    groups,
    summary: {
      private_media_assets: assets.filter((row) => row.private_original).length,
      build45_ready_assets: assets.filter((row) => row.build45_sync_ready_input).length,
      video_assets: assets.filter((row) => lower(row.media_type) === 'video').length,
      audio_assets: assets.filter((row) => lower(row.media_type) === 'audio').length,
      sync_groups: groups.length,
      confirmed_groups: groups.filter((row) => lower(row.sync_status) === 'confirmed' && row.readiness?.ready_for_build47).length,
    },
  };
}

async function ownedAssets(db, projectId, ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  return assetRows(db, projectId).then((all) => all.filter((row) => ids.includes(integer(row.creative_asset_id))));
}

function initialAlignment(anchor, asset) {
  const anchorCapture = captureMillis(anchor);
  const assetCapture = captureMillis(asset);
  if (anchorCapture !== null && assetCapture !== null) {
    return { offset: Math.round(((assetCapture - anchorCapture) / 1000) * 1000) / 1000, confidence: 85, method: 'capture_timestamp', note: 'Suggested from recorded capture timestamp.' };
  }
  const anchorTc = sourceTimecode(anchor);
  const assetTc = sourceTimecode(asset);
  if (anchorTc !== null && assetTc !== null) {
    return { offset: Math.round((assetTc - anchorTc) * 1000) / 1000, confidence: 75, method: 'source_timecode', note: 'Suggested from source timecode.' };
  }
  return { offset: 0, confidence: 20, method: 'manual_required', note: 'No comparable capture timestamp or source timecode; manual reviewed alignment required.' };
}

async function createGroup(db, projectId, body, userId) {
  const cameraIds = uniqueIds(body.camera_asset_ids, 4);
  const audioId = integer(body.audio_asset_id);
  if (cameraIds.length !== 4) throw new Error('Choose exactly four distinct camera assets.');
  if (audioId && cameraIds.includes(audioId)) throw new Error('Dedicated audio must be separate from the four camera assets.');
  const requested = [...cameraIds, ...(audioId ? [audioId] : [])];
  const assets = await ownedAssets(db, projectId, requested);
  if (assets.length !== requested.length) throw new Error('Every selected source must belong to this CAIP project.');
  const cameras = cameraIds.map((id) => assets.find((row) => integer(row.creative_asset_id) === id));
  if (cameras.some((row) => lower(row?.media_type) !== 'video')) throw new Error('All four camera slots require video assets.');
  if (cameras.some((row) => !row.private_original)) throw new Error('All four cameras must resolve to private CAIP originals.');
  if (cameras.some((row) => !row.build45_sync_ready_input)) throw new Error('All four cameras must pass Build 45 media-intelligence readiness before synchronization.');
  const audio = audioId ? assets.find((row) => integer(row.creative_asset_id) === audioId) : null;
  if (audio && lower(audio.media_type) !== 'audio') throw new Error('Dedicated audio selection must be an audio asset.');
  if (audio && !audio.private_original) throw new Error('Dedicated audio must resolve to a private CAIP original.');
  const anchorId = integer(body.anchor_creative_asset_id) || cameraIds[0];
  if (!cameraIds.includes(anchorId)) throw new Error('Anchor must be one of the four selected cameras.');
  const anchor = cameras.find((row) => integer(row.creative_asset_id) === anchorId);
  const groupKey = text(body.capture_group_key, 120) || syncKey();
  const title = text(body.title, 180) || 'Grey Hair four-camera alignment';
  await db.prepare(`
    INSERT INTO caip_capture_groups(creative_project_id,capture_group_key,title,sync_status,anchor_creative_asset_id,sync_method,notes,created_by_user_id,created_at,updated_at)
    VALUES(?,?,?,'suggested',?,'build46_reviewed_alignment',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(creative_project_id,capture_group_key) DO UPDATE SET
      title=excluded.title,sync_status='suggested',anchor_creative_asset_id=excluded.anchor_creative_asset_id,
      sync_method='build46_reviewed_alignment',notes=excluded.notes,reviewed_by_user_id=NULL,reviewed_at=NULL,updated_at=CURRENT_TIMESTAMP
  `).bind(projectId, groupKey, title, anchorId, text(body.notes, 1200) || null, integer(userId) || null).run();
  const group = await db.prepare(`SELECT * FROM caip_capture_groups WHERE creative_project_id=? AND capture_group_key=? LIMIT 1`).bind(projectId, groupKey).first();
  const groupId = integer(group?.caip_capture_group_id);
  await db.prepare(`DELETE FROM caip_capture_tracks WHERE caip_capture_group_id=?`).bind(groupId).run();
  const labels = Array.isArray(body.camera_labels) ? body.camera_labels : [];
  for (let index = 0; index < cameras.length; index += 1) {
    const asset = cameras[index];
    const alignment = initialAlignment(anchor, asset);
    const label = text(labels[index], 120) || text(asset.camera_label || asset.device_label || asset.upload_device, 120) || `Camera ${String.fromCharCode(65 + index)}`;
    const isAnchor = integer(asset.creative_asset_id) === anchorId;
    await db.prepare(`
      INSERT INTO caip_capture_tracks(caip_capture_group_id,creative_asset_id,camera_label,source_role,sync_offset_seconds,sync_confidence,sync_method,review_status,notes,sort_order,created_at,updated_at)
      VALUES(?,?,?,'camera',?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `).bind(groupId, asset.creative_asset_id, label, isAnchor ? 0 : alignment.offset, isAnchor ? 100 : alignment.confidence, isAnchor ? 'capture_timestamp' : alignment.method, isAnchor ? 'confirmed' : 'needs_review', isAnchor ? 'Anchor camera; offset fixed at 0.000 seconds.' : alignment.note, index).run();
  }
  if (audio) {
    const alignment = initialAlignment(anchor, audio);
    await db.prepare(`
      INSERT INTO caip_capture_tracks(caip_capture_group_id,creative_asset_id,camera_label,source_role,sync_offset_seconds,sync_confidence,sync_method,review_status,notes,sort_order,created_at,updated_at)
      VALUES(?,?,?,'audio',?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `).bind(groupId, audio.creative_asset_id, text(body.audio_label, 120) || text(audio.device_label || audio.upload_device, 120) || 'Master audio', alignment.offset, alignment.confidence, alignment.method, alignment.method === 'manual_required' ? 'needs_review' : 'needs_review', alignment.note, 4).run();
  }
  return { caip_capture_group_id: groupId, capture_group_key: groupKey, camera_count: 4, audio_count: audio ? 1 : 0, anchor_creative_asset_id: anchorId };
}

async function requireGroup(db, projectId, groupId) {
  const group = await db.prepare(`SELECT * FROM caip_capture_groups WHERE creative_project_id=? AND caip_capture_group_id=? LIMIT 1`).bind(projectId, groupId).first();
  if (!group) throw new Error('Synchronization group was not found in this project.');
  return group;
}

async function adjustTrack(db, projectId, body, userId) {
  const groupId = integer(body.caip_capture_group_id);
  const trackId = integer(body.caip_capture_track_id);
  const group = await requireGroup(db, projectId, groupId);
  const track = await db.prepare(`SELECT * FROM caip_capture_tracks WHERE caip_capture_group_id=? AND caip_capture_track_id=? LIMIT 1`).bind(groupId, trackId).first();
  if (!track) throw new Error('Synchronization track was not found.');
  const isAnchor = integer(track.creative_asset_id) === integer(group.anchor_creative_asset_id);
  const review = TRACK_REVIEW.has(lower(body.review_status)) ? lower(body.review_status) : 'needs_review';
  const method = METHODS.has(lower(body.sync_method)) ? lower(body.sync_method) : 'manual_review';
  const offset = isAnchor ? 0 : normalizeOffset(body.sync_offset_seconds ?? track.sync_offset_seconds);
  const confidence = isAnchor ? 100 : clamp(body.sync_confidence ?? track.sync_confidence);
  const label = text(body.camera_label, 120) || text(track.camera_label, 120) || (lower(track.source_role) === 'audio' ? 'Master audio' : 'Camera');
  await db.prepare(`
    UPDATE caip_capture_tracks
    SET camera_label=?,sync_offset_seconds=?,sync_confidence=?,sync_method=?,review_status=?,notes=?,updated_at=CURRENT_TIMESTAMP
    WHERE caip_capture_track_id=? AND caip_capture_group_id=?
  `).bind(label, offset, confidence, isAnchor ? 'capture_timestamp' : method, isAnchor ? 'confirmed' : review, text(body.notes, 1200) || text(track.notes, 1200) || null, trackId, groupId).run();
  await db.prepare(`UPDATE caip_capture_groups SET sync_status='needs_review',reviewed_by_user_id=NULL,reviewed_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE caip_capture_group_id=?`).bind(groupId).run();
  return { caip_capture_group_id: groupId, caip_capture_track_id: trackId, sync_offset_seconds: offset, sync_confidence: confidence, review_status: isAnchor ? 'confirmed' : review, actor_user_id: integer(userId) || null };
}

async function confirmGroup(db, projectId, groupId, userId) {
  const group = await requireGroup(db, projectId, groupId);
  const tracks = rows(await db.prepare(`SELECT * FROM caip_capture_tracks WHERE caip_capture_group_id=? ORDER BY sort_order,caip_capture_track_id`).bind(groupId).all());
  const assessed = readinessForGroup({ ...group, tracks });
  if (!assessed.confirmation_ready) throw new Error(`Alignment cannot be confirmed: ${assessed.blockers.join(' ')}`);
  await db.prepare(`
    UPDATE caip_capture_groups SET sync_status='confirmed',sync_method='build46_reviewed_alignment',reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE caip_capture_group_id=?
  `).bind(integer(userId) || null, groupId).run();
  return { caip_capture_group_id: groupId, sync_status: 'confirmed', camera_count: 4, audio_count: assessed.audio_count, ready_for_build47: true };
}

async function rejectGroup(db, projectId, groupId, body, userId) {
  await requireGroup(db, projectId, groupId);
  await db.prepare(`UPDATE caip_capture_groups SET sync_status='rejected',notes=?,reviewed_by_user_id=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE caip_capture_group_id=?`).bind(text(body.notes, 1200) || 'Rejected during Build 46 alignment review.', integer(userId) || null, groupId).run();
  return { caip_capture_group_id: groupId, sync_status: 'rejected', ready_for_build47: false };
}

async function recordEvent(db, projectId, action, userId, result) {
  await db.prepare(`
    INSERT INTO caip_pipeline_events(creative_project_id,creative_asset_id,event_type,actor_user_id,details_json,created_at)
    VALUES(?,NULL,?,?,?,CURRENT_TIMESTAMP)
  `).bind(projectId, `build46_${action}`, integer(userId) || null, JSON.stringify({ release: RELEASE, build: BUILD, ...result, source_originals_immutable: true, provider_execution: false, provider_publication: false, r2_mutation: false })).run();
}

function response(data, status = 200) {
  return jsonResponse({
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    source_originals_immutable: true,
    raw_public_r2_urls: false,
    r2_mutation: false,
    provider_execution: false,
    provider_publication: false,
    waveform_processing: false,
    story_editing: false,
    request_time_ddl: false,
    canonical_migration_added: false,
    ...data,
  }, status, { 'Cache-Control': 'no-store' });
}

export async function onRequestGet(context) {
  const state = await access(context);
  if (state.error) return state.error;
  try {
    const ready = await readiness(state.db);
    const projects = await projectOptions(state.db);
    const url = new URL(context.request.url);
    const requestedId = integer(url.searchParams.get('creative_project_id') || url.searchParams.get('project_id'));
    const selected = requestedId ? projects.find((row) => integer(row.creative_project_id) === requestedId) : projects[0];
    if (!ready.schema_ready) return response({ ok: false, ...ready, projects, error: 'Existing CAIP synchronization authority is incomplete. Build 46 fails closed and does not create schema during a request.' }, 409);
    if (!selected) return response({ ok: true, ...ready, projects: [], creative_project_id: null, assets: [], groups: [], summary: { private_media_assets: 0, build45_ready_assets: 0, video_assets: 0, audio_assets: 0, sync_groups: 0, confirmed_groups: 0 } });
    return response({ ok: true, ...ready, creative_project_id: integer(selected.creative_project_id), ...(await bundle(state.db, integer(selected.creative_project_id))), downstream_contract: { build47_requires_confirmed_group: true, required_camera_tracks: 4, maximum_dedicated_audio_tracks: 1 } });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'grey_hair_sync_alignment', incident_code: 'build46_sync_get_failed', severity: 'warning', message: error?.message || 'Build 46 synchronization workspace could not load.', related_user_id: state.adminUser.user_id, details: { release: RELEASE, build: BUILD, error: String(error?.stack || error) } }).catch(() => null);
    return response({ ok: false, error: error?.message || 'Build 46 synchronization workspace could not load.' }, 503);
  }
}

export async function onRequestPost(context) {
  const state = await access(context);
  if (state.error) return state.error;
  let body = {};
  try { body = await context.request.json(); } catch { return response({ ok: false, error: 'Expected a JSON request body.' }, 400); }
  const action = lower(body.action);
  const projectId = integer(body.creative_project_id || body.project_id);
  if (!projectId) return response({ ok: false, error: 'Choose a CAIP project first.' }, 400);
  try {
    const ready = await readiness(state.db);
    if (!ready.schema_ready) return response({ ok: false, ...ready, error: 'Existing CAIP synchronization authority is incomplete. Build 46 cannot write until the authority is restored through the approved migration process.' }, 409);
    const projects = await projectOptions(state.db);
    if (!projects.some((row) => integer(row.creative_project_id) === projectId)) return response({ ok: false, error: 'CAIP project was not found.' }, 404);
    let result;
    if (action === 'create_or_refresh_group') result = await createGroup(state.db, projectId, body, state.adminUser.user_id);
    else if (action === 'save_track_adjustment') result = await adjustTrack(state.db, projectId, body, state.adminUser.user_id);
    else if (action === 'confirm_group') result = await confirmGroup(state.db, projectId, integer(body.caip_capture_group_id), state.adminUser.user_id);
    else if (action === 'reject_group') result = await rejectGroup(state.db, projectId, integer(body.caip_capture_group_id), body, state.adminUser.user_id);
    else return response({ ok: false, error: 'Unsupported Build 46 synchronization action.' }, 400);
    await recordEvent(state.db, projectId, action, state.adminUser.user_id, result);
    await auditAdminAction(context.env, context.request, state.adminUser, { action_type: `grey_hair_sync_${action}`, target_type: 'creative_project', target_id: projectId, target_key: null, details: { release: RELEASE, build: BUILD, ...result, source_originals_immutable: true, provider_execution: false, provider_publication: false, r2_mutation: false } }).catch(() => null);
    return response({ ok: true, message: 'Build 46 synchronization review saved. Source originals remain unchanged and nothing was published.', result, creative_project_id: projectId, ...(await bundle(state.db, projectId)) });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'grey_hair_sync_alignment', incident_code: 'build46_sync_post_failed', severity: 'warning', message: error?.message || 'Build 46 synchronization action failed.', related_user_id: state.adminUser.user_id, details: { release: RELEASE, build: BUILD, action, creative_project_id: projectId, error: String(error?.stack || error) } }).catch(() => null);
    return response({ ok: false, action, creative_project_id: projectId, error: error?.message || 'Build 46 synchronization action failed.' }, 400);
  }
}
