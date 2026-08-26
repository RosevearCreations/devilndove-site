// Devil n Dove Build 439 — CAIP temporal media evidence review service.
// Migration-owned schema; request handlers verify and fail closed rather than creating DDL.
// Source originals remain immutable/private. No provider execution or publication occurs here.

import { resolveCaipBucket } from './caipMediaIntake.js';

export const CAIP_EVIDENCE_REVIEW_BUILD = 439;
export const EVIDENCE_CATEGORIES = Object.freeze([
  'technique', 'problem', 'result', 'lesson', 'material_proof', 'process_proof',
  'safety_quality', 'context', 'other',
]);

const REVIEW_STATUSES = new Set(['needs_review', 'approved', 'rejected']);
const VERIFICATION_STATUSES = new Set(['unverified', 'source_observed', 'confirmed', 'rejected']);
const VISIBILITIES = new Set(['internal', 'public_candidate']);
const MARKER_STATUSES = new Set(['active', 'archived']);
const LINK_ROLES = new Set(['primary', 'supporting', 'context']);
const VERIFIED_ARTIFACT_STATUSES = new Set(['head_verified', 'checksum_verified']);
const MEDIA_OUTPUT_JOB_TYPES = new Set(['proxy_video', 'thumbnail', 'frame_extract', 'audio_extract', 'transcript']);
let schemaVerified = false;

function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max).trim() : clean;
}
function integer(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function safeJson(value, fallback = {}) { try { return JSON.parse(String(value || '')); } catch { return fallback; } }
function clip(value, max) {
  const clean = text(value).replace(/\s+/g, ' ');
  return !clean || clean.length <= max ? clean : `${clean.slice(0, Math.max(1, max - 1)).trim()}…`;
}
function normalizeSet(value, allowed, fallback) {
  const key = text(value).toLowerCase();
  return allowed.has(key) ? key : fallback;
}
function normalizeCategory(value) {
  const key = text(value).toLowerCase();
  return EVIDENCE_CATEGORIES.includes(key) ? key : 'process_proof';
}
function uniqueIntegers(value, max = 30) {
  const source = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(source.map(integer).filter(Boolean))].slice(0, max);
}
function markerKey(projectId, assetId) {
  return `temporal-${integer(projectId)}-${integer(assetId)}-${crypto.randomUUID()}`;
}
function segmentKey(projectId) {
  return `reviewed-evidence-${integer(projectId)}-${crypto.randomUUID()}`;
}
function evidenceKey(marker) {
  return `temporal-${text(marker.marker_key, 160)}`;
}
function secondsLabel(value) {
  const total = Math.max(0, numeric(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  const fraction = Math.round((total - Math.floor(total)) * 10);
  const base = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
  return fraction ? `${base}.${fraction}` : base;
}
function rangeLabel(marker) {
  const start = secondsLabel(marker.start_seconds);
  const end = marker.end_seconds == null ? '' : secondsLabel(marker.end_seconds);
  return end && numeric(marker.end_seconds) > numeric(marker.start_seconds) ? `${start}–${end}` : start;
}

async function writeProjectEvent(db, projectId, eventType, actorUserId, details = {}) {
  await db.prepare(`
    INSERT INTO creative_project_events(creative_project_id,event_type,actor_user_id,details_json,created_at)
    VALUES(?,?,?,?,CURRENT_TIMESTAMP)
  `).bind(integer(projectId), text(eventType, 120), integer(actorUserId) || null, JSON.stringify(details || {})).run().catch(() => null);
}

export async function getCaipEvidenceReviewReadiness(db) {
  if (schemaVerified) return { schema_ready: true, build: CAIP_EVIDENCE_REVIEW_BUILD, missing_tables: [] };
  const required = [
    'creative_media_evidence_ranges',
    'creative_story_segment_evidence_links',
    'caip_media_processing_artifacts',
  ];
  const missing = [];
  for (const table of required) {
    try {
      const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(table).first();
      if (!row?.name) missing.push(table);
    } catch {
      missing.push(table);
    }
  }
  if (!missing.length) schemaVerified = true;
  return { schema_ready: missing.length === 0, build: CAIP_EVIDENCE_REVIEW_BUILD, missing_tables: missing };
}

export async function assertCaipEvidenceReviewSchema(db) {
  const readiness = await getCaipEvidenceReviewReadiness(db);
  if (!readiness.schema_ready) {
    throw new Error(`Build 439 CAIP evidence-review schema is not installed. Missing: ${readiness.missing_tables.join(', ') || 'unknown authority'}.`);
  }
  return true;
}

async function projectRow(db, projectId) {
  return db.prepare(`
    SELECT cp.creative_project_id,cp.creative_project_key,cp.project_title,cp.project_status,cp.governance_status,
           cp.content_project_id,cp.product_id,csp.factual_summary,p.name AS product_name
    FROM creative_projects cp
    LEFT JOIN content_projects csp ON csp.content_project_id=cp.content_project_id
    LEFT JOIN products p ON p.product_id=cp.product_id
    WHERE cp.creative_project_id=? LIMIT 1
  `).bind(integer(projectId)).first();
}

async function assetRows(db, projectId) {
  const result = await db.prepare(`
    SELECT ca.creative_asset_id,ca.creative_project_id,ca.asset_key,ca.media_type,ca.original_filename,ca.mime_type,
           ca.source_url,ca.source_fingerprint,ca.rights_status,ca.asset_status,ca.manual_caption,ca.source_metadata_json,
           ma.storage_provider,ma.bucket_name,ma.object_key,ma.file_size_bytes,
           COALESCE(obs.duration_seconds,0) AS observed_duration_seconds,
           COALESCE(obs.width_px,0) AS observed_width_px,COALESCE(obs.height_px,0) AS observed_height_px,
           f.caip_media_upload_file_id,f.media_role,f.privacy_state,f.consent_state,f.upload_status
    FROM creative_assets ca
    LEFT JOIN media_assets ma ON ma.media_asset_id=ca.media_asset_id
    LEFT JOIN creative_asset_technical_observations obs
      ON obs.creative_asset_technical_observation_id=(
        SELECT o.creative_asset_technical_observation_id
        FROM creative_asset_technical_observations o
        WHERE o.creative_asset_id=ca.creative_asset_id
        ORDER BY o.observed_at DESC,o.creative_asset_technical_observation_id DESC LIMIT 1
      )
    LEFT JOIN caip_media_upload_files f ON f.creative_asset_id=ca.creative_asset_id
    WHERE ca.creative_project_id=? AND ca.asset_status<>'archived'
    ORDER BY CASE ca.media_type WHEN 'video' THEN 1 WHEN 'audio' THEN 2 ELSE 3 END,
             ca.is_source_featured DESC,ca.is_source_selected DESC,ca.sort_order,ca.creative_asset_id
  `).bind(integer(projectId)).all();
  return rows(result).map((row) => {
    const meta = safeJson(row.source_metadata_json, {});
    const duration = numeric(row.observed_duration_seconds || meta.duration_seconds || meta.duration);
    return {
      ...row,
      duration_seconds: duration || null,
      private_object: Boolean(text(row.object_key) && !text(row.source_url)),
      can_temporal_review: ['video', 'audio'].includes(text(row.media_type).toLowerCase()),
    };
  });
}

async function markerRows(db, projectId) {
  const result = await db.prepare(`
    SELECT r.*,ca.asset_key,ca.original_filename,ca.media_type,
           e.evidence_key AS linked_evidence_key,e.review_status AS linked_evidence_review_status,
           e.verification_status AS linked_evidence_verification_status
    FROM creative_media_evidence_ranges r
    INNER JOIN creative_assets ca ON ca.creative_asset_id=r.creative_asset_id
    LEFT JOIN creative_story_evidence e ON e.creative_story_evidence_id=r.linked_story_evidence_id
    WHERE r.creative_project_id=?
    ORDER BY r.marker_status='archived',r.start_seconds,r.creative_media_evidence_range_id
  `).bind(integer(projectId)).all();
  return rows(result);
}

async function segmentRows(db, projectId) {
  const result = await db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM creative_story_segment_evidence_links l WHERE l.creative_story_segment_id=s.creative_story_segment_id) AS temporal_link_count
    FROM creative_story_segments s
    WHERE s.creative_project_id=?
    ORDER BY s.sort_order,s.creative_story_segment_id
  `).bind(integer(projectId)).all();
  return rows(result);
}

async function processingRows(db, projectId) {
  const jobs = rows(await db.prepare(`
    SELECT j.*,ca.asset_key,ca.original_filename,
      (SELECT COUNT(*) FROM caip_media_processing_artifacts a WHERE a.caip_media_processing_job_id=j.caip_media_processing_job_id) AS artifact_count,
      (SELECT COUNT(*) FROM caip_media_processing_artifacts a WHERE a.caip_media_processing_job_id=j.caip_media_processing_job_id AND a.verification_status IN ('head_verified','checksum_verified')) AS verified_artifact_count
    FROM caip_media_processing_jobs j
    INNER JOIN creative_assets ca ON ca.creative_asset_id=j.creative_asset_id
    WHERE j.creative_project_id=?
    ORDER BY CASE j.job_status WHEN 'failed' THEN 1 WHEN 'blocked' THEN 2 WHEN 'running' THEN 3 WHEN 'queued' THEN 4 WHEN 'planned' THEN 5 ELSE 6 END,
             j.caip_media_processing_job_id DESC
    LIMIT 160
  `).bind(integer(projectId)).all());
  const artifacts = rows(await db.prepare(`
    SELECT a.*,j.job_type,j.job_status,ca.asset_key,ca.original_filename
    FROM caip_media_processing_artifacts a
    INNER JOIN caip_media_processing_jobs j ON j.caip_media_processing_job_id=a.caip_media_processing_job_id
    INNER JOIN creative_assets ca ON ca.creative_asset_id=a.creative_asset_id
    WHERE a.creative_project_id=?
    ORDER BY a.caip_media_processing_artifact_id DESC LIMIT 160
  `).bind(integer(projectId)).all());
  return { jobs, artifacts };
}

export async function loadCaipEvidenceReviewBundle(db, projectId) {
  const readiness = await getCaipEvidenceReviewReadiness(db);
  const project = await projectRow(db, projectId);
  if (!project) return { build: CAIP_EVIDENCE_REVIEW_BUILD, schema_ready: readiness.schema_ready, project: null, assets: [], markers: [], segments: [], processing: { jobs: [], artifacts: [] }, missing_tables: readiness.missing_tables };
  if (!readiness.schema_ready) {
    return { build: CAIP_EVIDENCE_REVIEW_BUILD, schema_ready: false, project, assets: await assetRows(db, projectId), markers: [], segments: await segmentRows(db, projectId), processing: { jobs: [], artifacts: [] }, missing_tables: readiness.missing_tables };
  }
  const [assets, markers, segments, processing] = await Promise.all([
    assetRows(db, projectId), markerRows(db, projectId), segmentRows(db, projectId), processingRows(db, projectId),
  ]);
  return {
    build: CAIP_EVIDENCE_REVIEW_BUILD,
    schema_ready: true,
    missing_tables: [],
    project,
    assets,
    markers,
    segments,
    processing,
    counts: {
      assets: assets.length,
      temporal_assets: assets.filter((item) => item.can_temporal_review).length,
      markers: markers.filter((item) => item.marker_status === 'active').length,
      approved_markers: markers.filter((item) => item.marker_status === 'active' && item.review_status === 'approved').length,
      linked_story_evidence: markers.filter((item) => integer(item.linked_story_evidence_id)).length,
      processing_jobs: processing.jobs.length,
      verified_artifacts: processing.artifacts.filter((item) => VERIFIED_ARTIFACT_STATUSES.has(text(item.verification_status))).length,
    },
    policy: {
      source_originals_immutable: true,
      public_claims_automatic: false,
      provider_execution_active: false,
      reviewed_evidence_required_for_story_draft: true,
      verified_artifact_required_for_media_job_completion: true,
    },
  };
}

async function ownedAsset(db, projectId, assetId) {
  return db.prepare(`SELECT * FROM creative_assets WHERE creative_project_id=? AND creative_asset_id=? LIMIT 1`).bind(integer(projectId), integer(assetId)).first();
}

export async function saveTemporalEvidenceMarker(db, projectId, patch, actorUserId) {
  await assertCaipEvidenceReviewSchema(db);
  const assetId = integer(patch.creative_asset_id);
  const asset = await ownedAsset(db, projectId, assetId);
  if (!asset) throw new Error('Choose an asset that belongs to this CAIP project.');
  if (!['video', 'audio'].includes(text(asset.media_type).toLowerCase())) throw new Error('Timecode evidence requires a video or audio asset.');

  const markerId = integer(patch.creative_media_evidence_range_id);
  const current = markerId
    ? await db.prepare(`SELECT * FROM creative_media_evidence_ranges WHERE creative_project_id=? AND creative_media_evidence_range_id=? LIMIT 1`).bind(integer(projectId), markerId).first()
    : null;
  if (markerId && !current) throw new Error('Temporal evidence marker was not found.');

  const start = Math.max(0, numeric(patch.start_seconds ?? current?.start_seconds));
  let end = patch.end_seconds == null || patch.end_seconds === '' ? (current?.end_seconds == null ? null : numeric(current.end_seconds)) : Math.max(0, numeric(patch.end_seconds));
  if (end != null && end < start) throw new Error('Evidence range end must be at or after its start.');
  const duration = Math.max(0, numeric(patch.source_duration_seconds ?? current?.source_duration_seconds));
  if (duration && start > duration + 0.25) throw new Error('Evidence start is beyond the recorded media duration.');
  if (duration && end != null && end > duration + 0.25) throw new Error('Evidence end is beyond the recorded media duration.');
  const markerType = end != null && end > start ? 'range' : 'point';
  if (markerType === 'point') end = null;
  const category = normalizeCategory(patch.evidence_category ?? current?.evidence_category);
  const title = clip(patch.title ?? current?.title, 240);
  if (!title) throw new Error('Add a short evidence title.');
  const note = clip(patch.note_text ?? current?.note_text, 5000) || null;
  const transcript = clip(patch.transcript_excerpt ?? current?.transcript_excerpt, 5000) || null;
  const confidence = Math.max(0, Math.min(100, Math.round(numeric(patch.confidence_score ?? current?.confidence_score ?? 100))));
  const verification = normalizeSet(patch.verification_status ?? current?.verification_status, VERIFICATION_STATUSES, 'source_observed');
  const review = normalizeSet(patch.review_status ?? current?.review_status, REVIEW_STATUSES, 'needs_review');
  const visibility = normalizeSet(patch.visibility ?? current?.visibility, VISIBILITIES, 'internal');
  const status = normalizeSet(patch.marker_status ?? current?.marker_status, MARKER_STATUSES, 'active');
  const storyCandidate = Number(patch.story_candidate ?? current?.story_candidate ?? 1) === 1 ? 1 : 0;
  const uploadFileId = integer(patch.caip_media_upload_file_id ?? current?.caip_media_upload_file_id) || null;
  const key = current?.marker_key || markerKey(projectId, assetId);

  if (current) {
    await db.prepare(`
      UPDATE creative_media_evidence_ranges
      SET creative_asset_id=?,caip_media_upload_file_id=?,marker_type=?,evidence_category=?,start_seconds=?,end_seconds=?,source_duration_seconds=?,
          title=?,note_text=?,transcript_excerpt=?,confidence_score=?,verification_status=?,review_status=?,visibility=?,story_candidate=?,marker_status=?,
          reviewed_by_user_id=CASE WHEN ? IN ('approved','rejected') THEN ? ELSE reviewed_by_user_id END,
          reviewed_at=CASE WHEN ? IN ('approved','rejected') THEN CURRENT_TIMESTAMP ELSE reviewed_at END,
          updated_at=CURRENT_TIMESTAMP
      WHERE creative_media_evidence_range_id=?
    `).bind(assetId, uploadFileId, markerType, category, start, end, duration || null, title, note, transcript, confidence,
      verification, review, visibility, storyCandidate, status, review, integer(actorUserId) || null, review, current.creative_media_evidence_range_id).run();
  } else {
    await db.prepare(`
      INSERT INTO creative_media_evidence_ranges(
        creative_project_id,creative_asset_id,caip_media_upload_file_id,marker_key,marker_type,evidence_category,start_seconds,end_seconds,source_duration_seconds,
        title,note_text,transcript_excerpt,confidence_score,verification_status,review_status,visibility,story_candidate,marker_status,
        reviewed_by_user_id,reviewed_at,created_by_user_id,created_at,updated_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,CASE WHEN ? IN ('approved','rejected') THEN ? ELSE NULL END,
        CASE WHEN ? IN ('approved','rejected') THEN CURRENT_TIMESTAMP ELSE NULL END,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `).bind(integer(projectId), assetId, uploadFileId, key, markerType, category, start, end, duration || null, title, note, transcript,
      confidence, verification, review, visibility, storyCandidate, status, review, integer(actorUserId) || null, review, integer(actorUserId) || null).run();
  }
  const saved = await db.prepare(`SELECT * FROM creative_media_evidence_ranges WHERE marker_key=? LIMIT 1`).bind(key).first();
  await writeProjectEvent(db, projectId, 'caip_temporal_evidence_saved', actorUserId, {
    creative_media_evidence_range_id: saved?.creative_media_evidence_range_id || null,
    creative_asset_id: assetId, marker_type: markerType, evidence_category: category,
    start_seconds: start, end_seconds: end, review_status: review, source_media_unchanged: true,
  });
  return saved;
}

export async function archiveTemporalEvidenceMarker(db, projectId, markerId, actorUserId) {
  await assertCaipEvidenceReviewSchema(db);
  const marker = await db.prepare(`SELECT * FROM creative_media_evidence_ranges WHERE creative_project_id=? AND creative_media_evidence_range_id=? LIMIT 1`).bind(integer(projectId), integer(markerId)).first();
  if (!marker) throw new Error('Temporal evidence marker was not found.');
  await db.prepare(`UPDATE creative_media_evidence_ranges SET marker_status='archived',updated_at=CURRENT_TIMESTAMP WHERE creative_media_evidence_range_id=?`).bind(marker.creative_media_evidence_range_id).run();
  await writeProjectEvent(db, projectId, 'caip_temporal_evidence_archived', actorUserId, { creative_media_evidence_range_id: marker.creative_media_evidence_range_id, marker_key: marker.marker_key });
  return { creative_media_evidence_range_id: marker.creative_media_evidence_range_id, archived: true };
}

export async function promoteMarkerToStoryEvidence(db, projectId, markerId, actorUserId) {
  await assertCaipEvidenceReviewSchema(db);
  const marker = await db.prepare(`
    SELECT r.*,ca.asset_key,ca.original_filename
    FROM creative_media_evidence_ranges r
    INNER JOIN creative_assets ca ON ca.creative_asset_id=r.creative_asset_id
    WHERE r.creative_project_id=? AND r.creative_media_evidence_range_id=? LIMIT 1
  `).bind(integer(projectId), integer(markerId)).first();
  if (!marker) throw new Error('Temporal evidence marker was not found.');
  if (marker.marker_status !== 'active') throw new Error('Archived evidence cannot be promoted.');
  if (marker.review_status !== 'approved') throw new Error('Approve the temporal evidence marker before promoting it to the story evidence ledger.');
  if (marker.verification_status === 'rejected') throw new Error('Rejected source verification cannot become story evidence.');

  const key = evidenceKey(marker);
  const sourceReference = `${text(marker.asset_key, 120)} @ ${rangeLabel(marker)}`;
  const claim = clip(marker.note_text || marker.title, 4000) || marker.title;
  const packed = {
    build: CAIP_EVIDENCE_REVIEW_BUILD,
    temporal_marker_key: marker.marker_key,
    temporal_marker_id: marker.creative_media_evidence_range_id,
    creative_asset_id: marker.creative_asset_id,
    evidence_category: marker.evidence_category,
    start_seconds: numeric(marker.start_seconds),
    end_seconds: marker.end_seconds == null ? null : numeric(marker.end_seconds),
    source_duration_seconds: marker.source_duration_seconds == null ? null : numeric(marker.source_duration_seconds),
    transcript_excerpt: marker.transcript_excerpt || null,
    source_media_unchanged: true,
    public_claim_approval_not_implied: true,
  };
  await db.prepare(`
    INSERT INTO creative_story_evidence(
      creative_project_id,creative_asset_id,evidence_key,evidence_type,source_reference,claim_text,visibility,
      verification_status,review_status,evidence_json,copy_locked,created_at,updated_at
    ) VALUES(?,?,?,'temporal_source',?,?,?,?, 'needs_review',?,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(creative_project_id,evidence_key) DO UPDATE SET
      creative_asset_id=excluded.creative_asset_id,source_reference=excluded.source_reference,
      claim_text=CASE WHEN creative_story_evidence.copy_locked=1 THEN creative_story_evidence.claim_text ELSE excluded.claim_text END,
      visibility=excluded.visibility,verification_status=excluded.verification_status,evidence_json=excluded.evidence_json,updated_at=CURRENT_TIMESTAMP
  `).bind(integer(projectId), integer(marker.creative_asset_id), key, sourceReference, claim,
    marker.visibility === 'public_candidate' ? 'public_candidate' : 'internal',
    marker.verification_status === 'confirmed' ? 'confirmed' : 'source_record', JSON.stringify(packed)).run();
  const storyEvidence = await db.prepare(`SELECT * FROM creative_story_evidence WHERE creative_project_id=? AND evidence_key=? LIMIT 1`).bind(integer(projectId), key).first();
  await db.prepare(`UPDATE creative_media_evidence_ranges SET linked_story_evidence_id=?,updated_at=CURRENT_TIMESTAMP WHERE creative_media_evidence_range_id=?`).bind(storyEvidence.creative_story_evidence_id, marker.creative_media_evidence_range_id).run();
  await writeProjectEvent(db, projectId, 'caip_temporal_evidence_promoted', actorUserId, {
    temporal_marker_id: marker.creative_media_evidence_range_id,
    creative_story_evidence_id: storyEvidence.creative_story_evidence_id,
    evidence_review_status: 'needs_review', public_release_automatic: false,
  });
  return storyEvidence;
}

export async function draftStorySegmentFromMarkers(db, projectId, markerIds, patch, actorUserId) {
  await assertCaipEvidenceReviewSchema(db);
  const ids = uniqueIntegers(markerIds, 20);
  if (!ids.length) throw new Error('Choose at least one reviewed temporal evidence marker.');
  const placeholders = ids.map(() => '?').join(',');
  const selected = rows(await db.prepare(`
    SELECT r.*,e.creative_story_evidence_id,e.evidence_key,e.review_status AS evidence_review_status,e.verification_status AS evidence_verification_status
    FROM creative_media_evidence_ranges r
    LEFT JOIN creative_story_evidence e ON e.creative_story_evidence_id=r.linked_story_evidence_id
    WHERE r.creative_project_id=? AND r.creative_media_evidence_range_id IN (${placeholders})
    ORDER BY r.start_seconds,r.creative_media_evidence_range_id
  `).bind(integer(projectId), ...ids).all());
  if (selected.length !== ids.length) throw new Error('One or more selected temporal markers no longer exist.');
  for (const marker of selected) {
    if (marker.marker_status !== 'active' || marker.review_status !== 'approved') throw new Error('Every selected temporal marker must be active and approved.');
    if (!integer(marker.creative_story_evidence_id) || marker.evidence_review_status !== 'approved') throw new Error('Promote and approve each selected marker in the story evidence ledger before drafting a story segment.');
    if (marker.evidence_verification_status === 'rejected') throw new Error('Rejected story evidence cannot support a segment.');
  }

  const title = clip(patch?.title, 200) || `Reviewed evidence — ${selected[0].evidence_category.replace(/_/g, ' ')}`;
  const narrative = clip(patch?.narrative_text, 7000) || selected.map((marker) => {
    const observation = clip(marker.note_text || marker.title, 800) || marker.title;
    return `${observation} (${rangeLabel(marker)})`;
  }).join(' ');
  const key = segmentKey(projectId);
  const evidenceKeys = selected.map((marker) => marker.evidence_key);
  const maxSort = await db.prepare(`SELECT COALESCE(MAX(sort_order),0) AS max_sort FROM creative_story_segments WHERE creative_project_id=?`).bind(integer(projectId)).first();
  const sortOrder = Math.max(0, Math.round(numeric(maxSort?.max_sort))) + 10;
  const inserted = await db.prepare(`
    INSERT INTO creative_story_segments(
      creative_project_id,segment_key,segment_type,sort_order,title,narrative_text,evidence_keys_json,segment_status,copy_locked,reviewer_notes,created_at,updated_at
    ) VALUES(?,?,'reviewed_evidence',?,?,?,?, 'draft',0,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `).bind(integer(projectId), key, sortOrder, title, narrative, JSON.stringify(evidenceKeys),
    'Build 439 deterministic draft from approved temporal/story evidence. Human review required before approval or Content Studio use.').run();
  const segmentId = integer(inserted?.meta?.last_row_id);
  for (let index = 0; index < selected.length; index += 1) {
    await db.prepare(`
      INSERT INTO creative_story_segment_evidence_links(
        creative_project_id,creative_story_segment_id,creative_media_evidence_range_id,link_role,sort_order,created_by_user_id,created_at
      ) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(creative_story_segment_id,creative_media_evidence_range_id) DO UPDATE SET link_role=excluded.link_role,sort_order=excluded.sort_order
    `).bind(integer(projectId), segmentId, selected[index].creative_media_evidence_range_id, index === 0 ? 'primary' : 'supporting', index, integer(actorUserId) || null).run();
  }
  await writeProjectEvent(db, projectId, 'caip_story_segment_drafted_from_temporal_evidence', actorUserId, {
    creative_story_segment_id: segmentId, marker_ids: selected.map((item) => item.creative_media_evidence_range_id),
    evidence_keys: evidenceKeys, deterministic_draft: true, human_approval_required: true, content_studio_updated: false,
  });
  return db.prepare(`SELECT * FROM creative_story_segments WHERE creative_story_segment_id=? LIMIT 1`).bind(segmentId).first();
}

export async function registerProcessingArtifact(db, projectId, patch, actorUserId) {
  await assertCaipEvidenceReviewSchema(db);
  const jobId = integer(patch.caip_media_processing_job_id);
  const job = await db.prepare(`SELECT * FROM caip_media_processing_jobs WHERE creative_project_id=? AND caip_media_processing_job_id=? LIMIT 1`).bind(integer(projectId), jobId).first();
  if (!job) throw new Error('CAIP processing job was not found.');
  const roleMap = { proxy_video: 'proxy_video', thumbnail: 'thumbnail', frame_extract: 'frame', audio_extract: 'audio', transcript: 'transcript', metadata: 'metadata' };
  const role = text(patch.artifact_role).toLowerCase() || roleMap[job.job_type] || 'other';
  const allowedRoles = new Set(['proxy_video','thumbnail','frame','audio','transcript','metadata','other']);
  if (!allowedRoles.has(role)) throw new Error('Unsupported processing artifact role.');
  const objectKey = text(patch.object_key, 1000);
  if (!objectKey) throw new Error('A processing artifact object key is required.');
  const key = text(patch.artifact_key, 220) || `artifact-${job.job_key}-${crypto.randomUUID()}`;
  await db.prepare(`
    INSERT INTO caip_media_processing_artifacts(
      caip_media_processing_job_id,creative_project_id,creative_asset_id,artifact_key,artifact_role,storage_provider,bucket_alias,object_key,mime_type,
      file_size_bytes,checksum_algorithm,checksum_value,source_start_seconds,source_end_seconds,duration_seconds,verification_status,
      verification_evidence_json,created_by_user_id,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','{}',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(artifact_key) DO UPDATE SET
      object_key=excluded.object_key,mime_type=excluded.mime_type,file_size_bytes=excluded.file_size_bytes,
      checksum_algorithm=excluded.checksum_algorithm,checksum_value=excluded.checksum_value,
      source_start_seconds=excluded.source_start_seconds,source_end_seconds=excluded.source_end_seconds,duration_seconds=excluded.duration_seconds,
      verification_status='pending',verification_evidence_json='{}',verified_by_user_id=NULL,verified_at=NULL,updated_at=CURRENT_TIMESTAMP
  `).bind(job.caip_media_processing_job_id, integer(projectId), job.creative_asset_id, key, role,
    text(patch.storage_provider, 120) || 'r2_private_caip', text(patch.bucket_alias, 120) || 'CAIP_PRIVATE_MEDIA_BUCKET', objectKey,
    text(patch.mime_type, 180) || null, patch.file_size_bytes == null ? null : Math.max(0, Math.round(numeric(patch.file_size_bytes))),
    text(patch.checksum_algorithm, 40) || null, text(patch.checksum_value, 300) || null,
    patch.source_start_seconds == null ? null : Math.max(0, numeric(patch.source_start_seconds)),
    patch.source_end_seconds == null ? null : Math.max(0, numeric(patch.source_end_seconds)),
    patch.duration_seconds == null ? null : Math.max(0, numeric(patch.duration_seconds)), integer(actorUserId) || null).run();
  const artifact = await db.prepare(`SELECT * FROM caip_media_processing_artifacts WHERE artifact_key=? LIMIT 1`).bind(key).first();
  await writeProjectEvent(db, projectId, 'caip_processing_artifact_registered', actorUserId, {
    caip_media_processing_job_id: jobId, caip_media_processing_artifact_id: artifact?.caip_media_processing_artifact_id || null,
    artifact_role: role, output_not_verified_yet: true, source_media_unchanged: true,
  });
  return artifact;
}

export async function verifyProcessingArtifact(db, env, projectId, artifactId, actorUserId) {
  await assertCaipEvidenceReviewSchema(db);
  const artifact = await db.prepare(`
    SELECT a.*,j.job_type,j.job_status,j.input_object_key
    FROM caip_media_processing_artifacts a
    INNER JOIN caip_media_processing_jobs j ON j.caip_media_processing_job_id=a.caip_media_processing_job_id
    WHERE a.creative_project_id=? AND a.caip_media_processing_artifact_id=? LIMIT 1
  `).bind(integer(projectId), integer(artifactId)).first();
  if (!artifact) throw new Error('CAIP processing artifact was not found.');
  const bucket = resolveCaipBucket(env, artifact.storage_provider, artifact.bucket_alias);
  if (!bucket || typeof bucket.head !== 'function') throw new Error('The processing artifact bucket binding is unavailable.');
  const head = await bucket.head(artifact.object_key);
  let status = 'missing';
  const evidence = {
    checked_at: new Date().toISOString(),
    object_key_present: Boolean(text(artifact.object_key)),
    source_object_unchanged: true,
    provider_job_type: artifact.job_type,
  };
  if (head) {
    const observedSize = Number(head.size || 0);
    const expectedSize = artifact.file_size_bytes == null ? 0 : Number(artifact.file_size_bytes || 0);
    const sizeMatches = !expectedSize || expectedSize === observedSize;
    status = sizeMatches ? 'head_verified' : 'mismatch';
    Object.assign(evidence, {
      observed_size_bytes: observedSize,
      expected_size_bytes: expectedSize || null,
      size_matches: sizeMatches,
      etag: head.httpEtag || head.etag || null,
      uploaded_at: head.uploaded instanceof Date ? head.uploaded.toISOString() : head.uploaded || null,
      content_type: head.httpMetadata?.contentType || null,
    });
  }
  await db.prepare(`
    UPDATE caip_media_processing_artifacts
    SET verification_status=?,verification_evidence_json=?,verified_by_user_id=?,verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE caip_media_processing_artifact_id=?
  `).bind(status, JSON.stringify(evidence), integer(actorUserId) || null, artifact.caip_media_processing_artifact_id).run();
  await writeProjectEvent(db, projectId, 'caip_processing_artifact_verified', actorUserId, {
    caip_media_processing_artifact_id: artifact.caip_media_processing_artifact_id,
    caip_media_processing_job_id: artifact.caip_media_processing_job_id,
    verification_status: status, job_complete_automatic: false,
  });
  return db.prepare(`SELECT * FROM caip_media_processing_artifacts WHERE caip_media_processing_artifact_id=? LIMIT 1`).bind(artifact.caip_media_processing_artifact_id).first();
}

export async function completeVerifiedProcessingJob(db, projectId, jobId, actorUserId) {
  await assertCaipEvidenceReviewSchema(db);
  const job = await db.prepare(`SELECT * FROM caip_media_processing_jobs WHERE creative_project_id=? AND caip_media_processing_job_id=? LIMIT 1`).bind(integer(projectId), integer(jobId)).first();
  if (!job) throw new Error('CAIP processing job was not found.');
  if (!MEDIA_OUTPUT_JOB_TYPES.has(text(job.job_type))) throw new Error('Only media-output processing jobs use the Build 439 verified-artifact completion gate.');
  const artifact = await db.prepare(`
    SELECT * FROM caip_media_processing_artifacts
    WHERE caip_media_processing_job_id=? AND verification_status IN ('head_verified','checksum_verified')
    ORDER BY verification_status='checksum_verified' DESC,caip_media_processing_artifact_id DESC LIMIT 1
  `).bind(job.caip_media_processing_job_id).first();
  if (!artifact) throw new Error('Verify at least one processing artifact before completing this job.');
  const result = safeJson(job.result_json, {});
  result.verified_artifact_id = artifact.caip_media_processing_artifact_id;
  result.verified_artifact_key = artifact.artifact_key;
  result.verification_status = artifact.verification_status;
  result.build = CAIP_EVIDENCE_REVIEW_BUILD;
  await db.prepare(`
    UPDATE caip_media_processing_jobs
    SET job_status='complete',result_json=?,last_error=NULL,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE caip_media_processing_job_id=?
  `).bind(JSON.stringify(result), job.caip_media_processing_job_id).run();
  await writeProjectEvent(db, projectId, 'caip_processing_job_completed_verified', actorUserId, {
    caip_media_processing_job_id: job.caip_media_processing_job_id,
    caip_media_processing_artifact_id: artifact.caip_media_processing_artifact_id,
    verification_status: artifact.verification_status,
  });
  return db.prepare(`SELECT * FROM caip_media_processing_jobs WHERE caip_media_processing_job_id=? LIMIT 1`).bind(job.caip_media_processing_job_id).first();
}

export function buildEvidenceReviewManifest(bundle = {}) {
  return {
    build: CAIP_EVIDENCE_REVIEW_BUILD,
    project: bundle.project ? { creative_project_id: bundle.project.creative_project_id, creative_project_key: bundle.project.creative_project_key, project_title: bundle.project.project_title } : null,
    source_media_unchanged: true,
    automatic_publication: false,
    temporal_evidence: (bundle.markers || []).map((item) => ({
      marker_key: item.marker_key, asset_key: item.asset_key, evidence_category: item.evidence_category,
      marker_type: item.marker_type, start_seconds: item.start_seconds, end_seconds: item.end_seconds,
      title: item.title, review_status: item.review_status, verification_status: item.verification_status,
      linked_evidence_key: item.linked_evidence_key || null,
    })),
    processing_artifacts: (bundle.processing?.artifacts || []).map((item) => ({
      artifact_key: item.artifact_key, job_type: item.job_type, artifact_role: item.artifact_role,
      verification_status: item.verification_status, object_key_present: Boolean(item.object_key),
    })),
  };
}
