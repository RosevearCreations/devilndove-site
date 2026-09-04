// Release 467 Build 47 — AI Story & Edit Planning.
// Review-first deterministic assistance over existing CAIP story/timeline authorities.
// Requires a confirmed Build 46 four-camera synchronization group and approved source evidence.
// No external AI/provider execution, media rendering, publication, R2 mutation, raw public R2 URL,
// source-original mutation or request-time schema DDL exists in this endpoint.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 47;
const TITLE = 'AI Story & Edit Planning';
const GENERATED_BY = 'build47_reviewed_story_planner';
const REQUIRED_TABLES = Object.freeze([
  'creative_projects', 'creative_assets', 'creative_media_evidence_ranges',
  'caip_semantic_evidence_annotations', 'caip_asset_quality_reviews', 'caip_asset_lifecycle_states',
  'caip_capture_groups', 'caip_capture_tracks', 'caip_story_builder_drafts', 'caip_story_builder_items',
  'caip_edit_timeline_drafts', 'caip_edit_timeline_clips', 'caip_pipeline_events',
]);
const STORY_STATES = new Set(['draft', 'review', 'approved']);
const TIMELINE_STATES = new Set(['draft', 'review', 'approved']);
const ITEM_ROLES = new Set(['opening', 'story_beat', 'lesson', 'result', 'closing']);
const ASPECTS = new Set(['16:9', '9:16', '1:1']);

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
const uniqueIds = (value, max = 40) => [...new Set((Array.isArray(value) ? value : []).map(integer).filter(Boolean))].slice(0, max);
function safeJson(value, fallback = {}) { try { return JSON.parse(String(value || '')); } catch { return fallback; } }
function plannerKey(prefix) { return `grey-hair-b47-${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`; }
function isGreyHair(row) { return /\bgr[ae]y\b/.test(`${row?.creative_project_key || ''} ${row?.project_title || ''}`.toLowerCase()) && /\bhair\b/.test(`${row?.creative_project_key || ''} ${row?.project_title || ''}`.toLowerCase()); }

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Admin access required.' }, 401, { 'Cache-Control': 'no-store' }) };
  const db = getDb(context.env);
  if (!db) return { error: jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Database binding is not configured.' }, 503, { 'Cache-Control': 'no-store' }) };
  return { adminUser, db };
}

async function schemaReadiness(db) {
  const missing_tables = [];
  for (const table of REQUIRED_TABLES) {
    const found = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(table).first().catch(() => null);
    if (!found?.name) missing_tables.push(table);
  }
  return { schema_ready: missing_tables.length === 0, missing_tables, canonical_migration_added: false, request_time_ddl: false };
}

async function projectOptions(db) {
  const all = rows(await db.prepare(`
    SELECT creative_project_id,creative_project_key,project_title,project_status,governance_status,updated_at
    FROM creative_projects ORDER BY updated_at DESC,creative_project_id DESC LIMIT 200
  `).all());
  const grey = all.filter(isGreyHair);
  return grey.length ? grey : all.filter((row) => lower(row.project_status) !== 'archived').slice(0, 40);
}

async function requireProject(db, projectId) {
  const row = await db.prepare(`SELECT creative_project_id,creative_project_key,project_title,project_status,governance_status FROM creative_projects WHERE creative_project_id=? LIMIT 1`).bind(projectId).first();
  if (!row) throw new Error('Grey Hair CAIP project was not found.');
  return row;
}

async function groupRows(db, projectId) {
  const groups = rows(await db.prepare(`
    SELECT * FROM caip_capture_groups WHERE creative_project_id=? ORDER BY updated_at DESC,caip_capture_group_id DESC
  `).bind(projectId).all());
  if (!groups.length) return [];
  const tracks = rows(await db.prepare(`
    SELECT t.*,ca.media_type,ca.original_filename,ca.asset_key
    FROM caip_capture_tracks t
    INNER JOIN caip_capture_groups g ON g.caip_capture_group_id=t.caip_capture_group_id
    INNER JOIN creative_assets ca ON ca.creative_asset_id=t.creative_asset_id
    WHERE g.creative_project_id=?
    ORDER BY g.caip_capture_group_id DESC,t.sort_order,t.caip_capture_track_id
  `).bind(projectId).all());
  return groups.map((group) => ({ ...group, tracks: tracks.filter((track) => integer(track.caip_capture_group_id) === integer(group.caip_capture_group_id)) }));
}

function groupReadiness(group) {
  const tracks = Array.isArray(group?.tracks) ? group.tracks : [];
  const cameras = tracks.filter((row) => lower(row.source_role) === 'camera');
  const audio = tracks.filter((row) => lower(row.source_role) === 'audio');
  const labels = cameras.map((row) => lower(row.camera_label)).filter(Boolean);
  const anchorId = integer(group?.anchor_creative_asset_id);
  const blockers = [];
  if (lower(group?.sync_status) !== 'confirmed') blockers.push('Build 46 synchronization group is not confirmed.');
  if (cameras.length !== 4) blockers.push('Exactly four confirmed camera tracks are required.');
  if (new Set(labels).size !== cameras.length) blockers.push('Camera labels must remain unique.');
  if (!anchorId || !cameras.some((row) => integer(row.creative_asset_id) === anchorId)) blockers.push('The synchronization anchor must be one of the four cameras.');
  if (audio.length > 1) blockers.push('At most one dedicated audio track may be attached.');
  if (tracks.some((row) => lower(row.review_status) !== 'confirmed')) blockers.push('Every included Build 46 track must be confirmed.');
  return {
    ready_for_build47: blockers.length === 0,
    camera_count: cameras.length,
    audio_count: audio.length,
    confirmed_track_count: tracks.filter((row) => lower(row.review_status) === 'confirmed').length,
    blockers,
  };
}

async function requireConfirmedGroup(db, projectId, groupId) {
  const groups = await groupRows(db, projectId);
  const group = groups.find((row) => integer(row.caip_capture_group_id) === integer(groupId));
  if (!group) throw new Error('Choose an existing Build 46 synchronization group.');
  const readiness = groupReadiness(group);
  if (!readiness.ready_for_build47) throw new Error(`Build 47 is blocked: ${readiness.blockers.join(' ')}`);
  return { ...group, readiness };
}

function categoryWeight(category) {
  const key = lower(category).replace(/[^a-z0-9]+/g, '_');
  return ({
    problem: 96, result: 95, technique: 92, process: 91, process_proof: 90,
    lesson: 89, material_proof: 87, safety_quality: 86, material: 84,
  })[key] || 72;
}

function roleFor(category, index, total) {
  const key = lower(category).replace(/[^a-z0-9]+/g, '_');
  if (index === 0) return 'opening';
  if (key === 'lesson') return 'lesson';
  if (key === 'result') return 'result';
  if (index === total - 1) return 'closing';
  return 'story_beat';
}

function evidenceText(row) {
  const semantic = lower(row.semantic_review_status) === 'approved' ? text(row.semantic_summary, 2200) : '';
  return semantic || text(row.transcript_excerpt, 2200) || text(row.note_text, 2200) || text(row.title, 2200) || text(row.evidence_category, 2200) || 'Reviewed source evidence.';
}

async function evidenceCandidates(db, projectId, groupId) {
  const raw = rows(await db.prepare(`
    SELECT r.creative_media_evidence_range_id,r.creative_asset_id,r.marker_key,r.evidence_category,r.title,r.note_text,r.transcript_excerpt,
           r.start_seconds,r.end_seconds,r.visibility,r.confidence_score,r.marker_status,r.review_status,
           a.semantic_tags_json,a.entities_json,a.semantic_summary,a.confidence_score AS semantic_confidence_score,a.review_status AS semantic_review_status,
           q.overall_quality_score,q.review_status AS quality_review_status,
           ct.caip_capture_track_id,ct.camera_label,ct.source_role,ct.sync_offset_seconds,ct.sync_confidence,ct.sync_method,ct.review_status AS track_review_status,
           ca.original_filename,ca.asset_key
    FROM caip_capture_tracks ct
    INNER JOIN creative_assets ca ON ca.creative_asset_id=ct.creative_asset_id
    INNER JOIN creative_media_evidence_ranges r ON r.creative_asset_id=ca.creative_asset_id AND r.creative_project_id=?
    LEFT JOIN caip_semantic_evidence_annotations a ON a.creative_media_evidence_range_id=r.creative_media_evidence_range_id
    LEFT JOIN caip_asset_quality_reviews q ON q.creative_asset_id=ca.creative_asset_id
    LEFT JOIN caip_asset_lifecycle_states ls ON ls.creative_asset_id=ca.creative_asset_id
    WHERE ct.caip_capture_group_id=?
      AND ct.source_role='camera' AND ct.review_status='confirmed'
      AND r.marker_status='active' AND r.review_status='approved'
      AND COALESCE(ls.lifecycle_status,'active') NOT IN ('rejected','purge_requested')
      AND COALESCE(q.review_status,'accepted')<>'rejected'
    ORDER BY r.start_seconds,r.creative_media_evidence_range_id
  `).bind(projectId, groupId).all().catch(() => ({ results: [] })));

  return raw.map((row) => {
    const sourceConfidence = clamp(row.confidence_score);
    const semanticConfidence = lower(row.semantic_review_status) === 'approved' ? clamp(row.semantic_confidence_score) : 0;
    const quality = clamp(row.overall_quality_score || 70);
    const transcriptBonus = text(row.transcript_excerpt) ? 8 : 0;
    const semanticBonus = lower(row.semantic_review_status) === 'approved' ? 8 : 0;
    const score = Math.min(100, Math.round(
      categoryWeight(row.evidence_category) * 0.46 +
      sourceConfidence * 0.18 +
      quality * 0.18 +
      semanticConfidence * 0.10 + transcriptBonus + semanticBonus
    ));
    return {
      ...row,
      planner_score: score,
      planner_text: evidenceText(row),
      semantic_tags: safeJson(row.semantic_tags_json, []),
      entities: safeJson(row.entities_json, []),
      source_backed: true,
      approved_for_story_planning: true,
    };
  }).sort((a, b) => b.planner_score - a.planner_score || numeric(a.start_seconds) - numeric(b.start_seconds));
}

function chooseStoryEvidence(candidates, targetCount) {
  const target = Math.max(3, Math.min(12, Math.floor(numeric(targetCount, 7))));
  const selected = [];
  const used = new Set();
  const take = (predicate, count = 1) => {
    for (const row of candidates.filter(predicate)) {
      if (selected.length >= target || count <= 0) break;
      const id = integer(row.creative_media_evidence_range_id);
      if (used.has(id)) continue;
      selected.push(row); used.add(id); count -= 1;
    }
  };
  const cat = (row) => lower(row.evidence_category).replace(/[^a-z0-9]+/g, '_');
  take((row) => cat(row) === 'problem', 1);
  take((row) => ['technique', 'process', 'process_proof', 'material_proof', 'material', 'safety_quality'].includes(cat(row)), 3);
  take((row) => cat(row) === 'lesson', 1);
  take((row) => cat(row) === 'result', 1);
  take(() => true, target - selected.length);
  return selected.slice(0, target);
}

async function loadBuild47Stories(db, projectId) {
  const stories = rows(await db.prepare(`
    SELECT d.*,(SELECT COUNT(*) FROM caip_story_builder_items i WHERE i.caip_story_builder_draft_id=d.caip_story_builder_draft_id) AS item_count
    FROM caip_story_builder_drafts d
    WHERE d.creative_project_id=? AND d.generated_by=? AND d.story_status<>'archived'
    ORDER BY d.updated_at DESC,d.caip_story_builder_draft_id DESC
  `).bind(projectId, GENERATED_BY).all());
  if (!stories.length) return [];
  const ids = stories.map((row) => integer(row.caip_story_builder_draft_id));
  const placeholders = ids.map(() => '?').join(',');
  const items = rows(await db.prepare(`
    SELECT i.*,r.creative_asset_id,r.evidence_category,r.start_seconds,r.end_seconds,r.review_status AS evidence_review_status,r.marker_status,
           ca.original_filename
    FROM caip_story_builder_items i
    LEFT JOIN creative_media_evidence_ranges r ON r.creative_media_evidence_range_id=i.creative_media_evidence_range_id
    LEFT JOIN creative_assets ca ON ca.creative_asset_id=r.creative_asset_id
    WHERE i.caip_story_builder_draft_id IN (${placeholders})
    ORDER BY i.caip_story_builder_draft_id DESC,i.sort_order,i.caip_story_builder_item_id
  `).bind(...ids).all());
  return stories.map((story) => ({ ...story, items: items.filter((item) => integer(item.caip_story_builder_draft_id) === integer(story.caip_story_builder_draft_id)) }));
}

async function loadBuild47Timelines(db, projectId, stories) {
  const storyIds = (stories || []).map((row) => integer(row.caip_story_builder_draft_id)).filter(Boolean);
  if (!storyIds.length) return [];
  const placeholders = storyIds.map(() => '?').join(',');
  const timelines = rows(await db.prepare(`
    SELECT * FROM caip_edit_timeline_drafts
    WHERE creative_project_id=? AND caip_story_builder_draft_id IN (${placeholders}) AND timeline_status<>'archived'
    ORDER BY updated_at DESC,caip_edit_timeline_draft_id DESC
  `).bind(projectId, ...storyIds).all());
  if (!timelines.length) return [];
  const ids = timelines.map((row) => integer(row.caip_edit_timeline_draft_id));
  const clipPlaceholders = ids.map(() => '?').join(',');
  const clips = rows(await db.prepare(`
    SELECT c.*,ca.original_filename,r.evidence_category,r.review_status AS evidence_review_status,r.marker_status
    FROM caip_edit_timeline_clips c
    LEFT JOIN creative_assets ca ON ca.creative_asset_id=c.creative_asset_id
    LEFT JOIN creative_media_evidence_ranges r ON r.creative_media_evidence_range_id=c.creative_media_evidence_range_id
    WHERE c.caip_edit_timeline_draft_id IN (${clipPlaceholders})
    ORDER BY c.caip_edit_timeline_draft_id DESC,c.sort_order,c.caip_edit_timeline_clip_id
  `).bind(...ids).all());
  return timelines.map((timeline) => ({ ...timeline, plan: safeJson(timeline.timeline_json, {}), clips: clips.filter((clip) => integer(clip.caip_edit_timeline_draft_id) === integer(timeline.caip_edit_timeline_draft_id)) }));
}

async function bundle(db, projectId, requestedGroupId = 0) {
  const projects = await projectOptions(db);
  const project = projects.find((row) => integer(row.creative_project_id) === integer(projectId)) || null;
  if (!project) return { projects, project: null, groups: [], evidence: [], stories: [], timelines: [] };
  const rawGroups = await groupRows(db, projectId);
  const groups = rawGroups.map((group) => ({ ...group, readiness: groupReadiness(group) }));
  const readyGroups = groups.filter((group) => group.readiness.ready_for_build47);
  const activeGroup = readyGroups.find((group) => integer(group.caip_capture_group_id) === integer(requestedGroupId)) || readyGroups[0] || null;
  const evidence = activeGroup ? await evidenceCandidates(db, projectId, integer(activeGroup.caip_capture_group_id)) : [];
  const stories = await loadBuild47Stories(db, projectId);
  const timelines = await loadBuild47Timelines(db, projectId, stories);
  return {
    projects, project, groups, active_group: activeGroup, evidence, stories, timelines,
    summary: {
      confirmed_build46_groups: readyGroups.length,
      approved_source_evidence: evidence.length,
      semantic_approved_evidence: evidence.filter((row) => lower(row.semantic_review_status) === 'approved').length,
      transcript_backed_evidence: evidence.filter((row) => text(row.transcript_excerpt)).length,
      build47_story_plans: stories.length,
      reviewed_story_plans: stories.filter((row) => ['review', 'approved'].includes(lower(row.story_status))).length,
      build47_edit_plans: timelines.length,
      approved_edit_plans: timelines.filter((row) => lower(row.timeline_status) === 'approved').length,
    },
  };
}

async function insertStoryItems(db, draftId, beats) {
  await db.prepare('DELETE FROM caip_story_builder_items WHERE caip_story_builder_draft_id=?').bind(draftId).run();
  for (let index = 0; index < beats.length; index += 1) {
    const beat = beats[index];
    await db.prepare(`
      INSERT INTO caip_story_builder_items(
        caip_story_builder_draft_id,creative_media_evidence_range_id,item_role,item_title,item_text,sort_order,created_at
      ) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(draftId, integer(beat.creative_media_evidence_range_id), beat.item_role, text(beat.item_title, 300) || null, text(beat.item_text, 2400) || null, index).run();
  }
}

async function generateStoryPlan(db, projectId, groupId, body, userId) {
  const group = await requireConfirmedGroup(db, projectId, groupId);
  const candidates = await evidenceCandidates(db, projectId, groupId);
  if (candidates.length < 3) throw new Error('Build 47 requires at least three approved source-backed evidence ranges from the confirmed Build 46 camera group.');
  const chosen = chooseStoryEvidence(candidates, body.target_beats);
  if (chosen.length < 3) throw new Error('Not enough reviewed evidence is available to create a story plan.');
  const beats = chosen.map((row, index) => ({
    creative_media_evidence_range_id: integer(row.creative_media_evidence_range_id),
    item_role: roleFor(row.evidence_category, index, chosen.length),
    item_title: text(row.title || row.evidence_category, 300) || `Reviewed evidence ${index + 1}`,
    item_text: evidenceText(row),
  }));
  const storyKey = text(body.story_key, 120) || plannerKey(`story-g${groupId}`);
  const title = text(body.title, 180) || `Grey Hair reviewed story plan — ${group.title || group.capture_group_key}`;
  const opening = text(body.opening_summary, 1200) || text(beats[0].item_text, 1200);
  const lessonBeat = beats.find((beat) => beat.item_role === 'lesson');
  const resultBeat = beats.find((beat) => beat.item_role === 'result');
  const lesson = text(body.lesson_summary, 1600) || text(lessonBeat?.item_text, 1600) || null;
  const recommendation = text(body.recommendation_summary, 1600) || text(resultBeat?.item_text, 1600) || null;
  const notes = text(body.private_storyboard_notes, 3500);
  const boundaryNote = `Build 47 source group #${groupId}; four-camera synchronization confirmed; deterministic reviewed-evidence assistance only; provider execution closed.`;
  const privateNotes = text(notes ? `${notes}\n\n${boundaryNote}` : boundaryNote, 4000);

  await db.prepare(`
    INSERT INTO caip_story_builder_drafts(
      creative_project_id,story_key,title,story_status,opening_summary,lesson_summary,recommendation_summary,
      private_storyboard_notes,source_segment_count,source_evidence_count,generated_by,created_by_user_id,created_at,updated_at
    ) VALUES(?,?,?,'draft',?,?,?,?,0,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `).bind(projectId, storyKey, title, opening, lesson, recommendation, privateNotes, chosen.length, GENERATED_BY, integer(userId) || null).run();
  const draft = await db.prepare('SELECT caip_story_builder_draft_id FROM caip_story_builder_drafts WHERE creative_project_id=? AND story_key=? LIMIT 1').bind(projectId, storyKey).first();
  const draftId = integer(draft?.caip_story_builder_draft_id);
  await insertStoryItems(db, draftId, beats);
  return { caip_story_builder_draft_id: draftId, story_key: storyKey, source_group_id: groupId, evidence_count: chosen.length, story_status: 'draft' };
}

async function requireBuild47Story(db, projectId, storyId) {
  const story = await db.prepare(`SELECT * FROM caip_story_builder_drafts WHERE creative_project_id=? AND caip_story_builder_draft_id=? AND generated_by=? LIMIT 1`).bind(projectId, storyId, GENERATED_BY).first();
  if (!story) throw new Error('Build 47 story plan was not found.');
  return story;
}

async function saveStoryReview(db, projectId, groupId, storyId, body, userId) {
  const story = await requireBuild47Story(db, projectId, storyId);
  await requireConfirmedGroup(db, projectId, groupId);
  const candidates = await evidenceCandidates(db, projectId, groupId);
  const allowed = new Map(candidates.map((row) => [integer(row.creative_media_evidence_range_id), row]));
  const requested = Array.isArray(body.beats) ? body.beats.slice(0, 20) : [];
  if (requested.length < 3) throw new Error('Keep at least three source-backed story beats.');
  const seen = new Set();
  const beats = requested.map((beat, index) => {
    const evidenceId = integer(beat.creative_media_evidence_range_id);
    const source = allowed.get(evidenceId);
    if (!source) throw new Error(`Story beat ${index + 1} does not resolve to approved evidence in the confirmed Build 46 group.`);
    if (seen.has(evidenceId)) throw new Error('A source evidence range may appear only once in the reviewed story plan.');
    seen.add(evidenceId);
    const role = ITEM_ROLES.has(lower(beat.item_role)) ? lower(beat.item_role) : roleFor(source.evidence_category, index, requested.length);
    return {
      creative_media_evidence_range_id: evidenceId,
      item_role: role,
      item_title: text(beat.item_title, 300) || text(source.title || source.evidence_category, 300),
      item_text: text(beat.item_text, 2400) || evidenceText(source),
    };
  });
  const status = STORY_STATES.has(lower(body.story_status)) ? lower(body.story_status) : 'review';
  await db.prepare(`
    UPDATE caip_story_builder_drafts SET title=?,story_status=?,opening_summary=?,lesson_summary=?,recommendation_summary=?,
      private_storyboard_notes=?,source_segment_count=0,source_evidence_count=?,
      reviewed_by_user_id=CASE WHEN ? IN ('review','approved') THEN ? ELSE reviewed_by_user_id END,
      reviewed_at=CASE WHEN ? IN ('review','approved') THEN CURRENT_TIMESTAMP ELSE reviewed_at END,updated_at=CURRENT_TIMESTAMP
    WHERE caip_story_builder_draft_id=?
  `).bind(
    text(body.title, 180) || story.title, status,
    text(body.opening_summary, 1200) || story.opening_summary,
    text(body.lesson_summary, 1600) || story.lesson_summary,
    text(body.recommendation_summary, 1600) || story.recommendation_summary,
    text(body.private_storyboard_notes, 4000) || story.private_storyboard_notes,
    beats.length, status, integer(userId) || null, status, storyId,
  ).run();
  await insertStoryItems(db, storyId, beats);
  return { caip_story_builder_draft_id: storyId, story_status: status, source_group_id: groupId, evidence_count: beats.length };
}

async function generateEditPlan(db, projectId, groupId, storyId, body, userId) {
  const story = await requireBuild47Story(db, projectId, storyId);
  if (!['review', 'approved'].includes(lower(story.story_status))) throw new Error('Review the Build 47 story plan before generating an edit plan.');
  const group = await requireConfirmedGroup(db, projectId, groupId);
  const candidates = await evidenceCandidates(db, projectId, groupId);
  const allowed = new Map(candidates.map((row) => [integer(row.creative_media_evidence_range_id), row]));
  const storyItems = rows(await db.prepare(`SELECT * FROM caip_story_builder_items WHERE caip_story_builder_draft_id=? ORDER BY sort_order,caip_story_builder_item_id`).bind(storyId).all());
  if (!storyItems.length) throw new Error('The reviewed story plan has no source-linked beats.');
  const invalid = storyItems.filter((item) => !allowed.has(integer(item.creative_media_evidence_range_id)));
  if (invalid.length) throw new Error('The story contains evidence outside the confirmed Build 46 group or evidence that is no longer approved. Re-review the story before generating an edit plan.');

  const target = Math.max(15, Math.min(900, Math.floor(numeric(body.target_duration_seconds, 90))));
  const aspect = ASPECTS.has(text(body.aspect_ratio, 20)) ? text(body.aspect_ratio, 20) : '16:9';
  let cursor = 0;
  const clips = storyItems.map((item, index) => {
    const source = allowed.get(integer(item.creative_media_evidence_range_id));
    const sourceIn = Math.max(0, numeric(source.start_seconds, 0));
    const sourceEnd = numeric(source.end_seconds, sourceIn + 6);
    const sourceOut = Math.max(sourceIn + 0.25, sourceEnd > sourceIn ? sourceEnd : sourceIn + 6);
    const duration = sourceOut - sourceIn;
    const clip = {
      creative_asset_id: integer(source.creative_asset_id),
      creative_media_evidence_range_id: integer(source.creative_media_evidence_range_id),
      source_in_seconds: Math.round(sourceIn * 1000) / 1000,
      source_out_seconds: Math.round(sourceOut * 1000) / 1000,
      timeline_in_seconds: Math.round(cursor * 1000) / 1000,
      timeline_out_seconds: Math.round((cursor + duration) * 1000) / 1000,
      camera_label: text(source.camera_label, 120) || null,
      sync_offset_seconds: Math.round(numeric(source.sync_offset_seconds, 0) * 1000) / 1000,
      caption_text: text(item.item_text, 500) || text(source.transcript_excerpt || source.note_text || source.title, 500) || null,
      story_role: text(item.item_role, 40),
      sort_order: index,
    };
    cursor += duration;
    return clip;
  });
  const timelineKey = text(body.timeline_key, 120) || plannerKey(`timeline-g${groupId}`);
  const title = text(body.title, 180) || `Grey Hair reviewed edit plan — ${story.title}`;
  const plan = {
    release: RELEASE, build: BUILD, planner: GENERATED_BY,
    source_group_id: groupId, source_group_key: group.capture_group_key,
    story_id: storyId, story_status: story.story_status,
    reviewed_evidence_only: true, confirmed_sync_required: true,
    provider_execution_active: false, media_rendering_active: false, publication_active: false, r2_mutation_active: false,
    target_duration_seconds: target, total_planned_seconds: Math.round(cursor * 1000) / 1000,
    target_exceeded: cursor > target,
    script_sections: storyItems.map((item) => ({ role: item.item_role, title: item.item_title, text: item.item_text, evidence_id: integer(item.creative_media_evidence_range_id) })),
    clips,
  };

  await db.prepare(`
    INSERT INTO caip_edit_timeline_drafts(
      creative_project_id,caip_story_builder_draft_id,timeline_key,title,timeline_status,aspect_ratio,target_duration_seconds,total_planned_seconds,
      timeline_json,provider_execution_status,created_by_user_id,created_at,updated_at
    ) VALUES(?,?,?,?,'draft',?,?,?,?, 'closed',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `).bind(projectId, storyId, timelineKey, title, aspect, target, cursor, JSON.stringify(plan), integer(userId) || null).run();
  const draft = await db.prepare('SELECT caip_edit_timeline_draft_id FROM caip_edit_timeline_drafts WHERE creative_project_id=? AND timeline_key=? LIMIT 1').bind(projectId, timelineKey).first();
  const draftId = integer(draft?.caip_edit_timeline_draft_id);
  await db.prepare('DELETE FROM caip_edit_timeline_clips WHERE caip_edit_timeline_draft_id=?').bind(draftId).run();
  for (const clip of clips) {
    await db.prepare(`
      INSERT INTO caip_edit_timeline_clips(
        caip_edit_timeline_draft_id,creative_asset_id,creative_media_evidence_range_id,clip_role,source_in_seconds,source_out_seconds,
        timeline_in_seconds,timeline_out_seconds,camera_label,sync_offset_seconds,caption_text,sort_order,created_at
      ) VALUES(?,?,?,'evidence',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(draftId, clip.creative_asset_id, clip.creative_media_evidence_range_id, clip.source_in_seconds, clip.source_out_seconds,
      clip.timeline_in_seconds, clip.timeline_out_seconds, clip.camera_label, clip.sync_offset_seconds, clip.caption_text, clip.sort_order).run();
  }
  return { caip_edit_timeline_draft_id: draftId, timeline_key: timelineKey, source_group_id: groupId, story_id: storyId, clip_count: clips.length, total_planned_seconds: cursor, target_duration_seconds: target, target_exceeded: cursor > target };
}

async function saveEditReview(db, projectId, groupId, timelineId, body, userId) {
  await requireConfirmedGroup(db, projectId, groupId);
  const timeline = await db.prepare(`
    SELECT d.*,s.generated_by,s.story_status FROM caip_edit_timeline_drafts d
    INNER JOIN caip_story_builder_drafts s ON s.caip_story_builder_draft_id=d.caip_story_builder_draft_id
    WHERE d.creative_project_id=? AND d.caip_edit_timeline_draft_id=? LIMIT 1
  `).bind(projectId, timelineId).first();
  if (!timeline || timeline.generated_by !== GENERATED_BY) throw new Error('Build 47 edit plan was not found.');
  const candidates = await evidenceCandidates(db, projectId, groupId);
  const allowed = new Map(candidates.map((row) => [integer(row.creative_media_evidence_range_id), row]));
  const requested = Array.isArray(body.clips) ? body.clips.slice(0, 40) : [];
  if (!requested.length) throw new Error('Keep at least one approved source clip in the edit plan.');
  let cursor = 0;
  const seen = new Set();
  const clips = requested.map((clip, index) => {
    const evidenceId = integer(clip.creative_media_evidence_range_id);
    const source = allowed.get(evidenceId);
    if (!source) throw new Error(`Edit clip ${index + 1} no longer resolves to approved evidence in the confirmed Build 46 group.`);
    if (seen.has(evidenceId)) throw new Error('A source evidence range may appear only once in the reviewed Build 47 edit plan.');
    seen.add(evidenceId);
    const minIn = Math.max(0, numeric(source.start_seconds, 0));
    const maxOut = Math.max(minIn + 0.25, numeric(source.end_seconds, minIn + 6));
    const sourceIn = Math.max(minIn, Math.min(maxOut - 0.25, numeric(clip.source_in_seconds, minIn)));
    const sourceOut = Math.max(sourceIn + 0.25, Math.min(maxOut, numeric(clip.source_out_seconds, maxOut)));
    const duration = sourceOut - sourceIn;
    const out = {
      creative_asset_id: integer(source.creative_asset_id), creative_media_evidence_range_id: evidenceId,
      source_in_seconds: Math.round(sourceIn * 1000) / 1000, source_out_seconds: Math.round(sourceOut * 1000) / 1000,
      timeline_in_seconds: Math.round(cursor * 1000) / 1000, timeline_out_seconds: Math.round((cursor + duration) * 1000) / 1000,
      camera_label: text(source.camera_label, 120) || null, sync_offset_seconds: Math.round(numeric(source.sync_offset_seconds, 0) * 1000) / 1000,
      caption_text: text(clip.caption_text, 500) || text(source.transcript_excerpt || source.note_text || source.title, 500) || null, sort_order: index,
    };
    cursor += duration;
    return out;
  });
  const status = TIMELINE_STATES.has(lower(body.timeline_status)) ? lower(body.timeline_status) : 'review';
  const oldPlan = safeJson(timeline.timeline_json, {});
  const plan = {
    ...oldPlan, release: RELEASE, build: BUILD, planner: GENERATED_BY, source_group_id: groupId,
    reviewed_evidence_only: true, confirmed_sync_required: true,
    provider_execution_active: false, media_rendering_active: false, publication_active: false, r2_mutation_active: false,
    total_planned_seconds: Math.round(cursor * 1000) / 1000,
    clips,
    human_review_status: status,
  };
  await db.prepare(`
    UPDATE caip_edit_timeline_drafts SET title=?,timeline_status=?,total_planned_seconds=?,timeline_json=?,provider_execution_status='closed',
      reviewed_by_user_id=CASE WHEN ? IN ('review','approved') THEN ? ELSE reviewed_by_user_id END,
      reviewed_at=CASE WHEN ? IN ('review','approved') THEN CURRENT_TIMESTAMP ELSE reviewed_at END,updated_at=CURRENT_TIMESTAMP
    WHERE caip_edit_timeline_draft_id=?
  `).bind(text(body.title, 180) || timeline.title, status, cursor, JSON.stringify(plan), status, integer(userId) || null, status, timelineId).run();
  await db.prepare('DELETE FROM caip_edit_timeline_clips WHERE caip_edit_timeline_draft_id=?').bind(timelineId).run();
  for (const clip of clips) {
    await db.prepare(`
      INSERT INTO caip_edit_timeline_clips(
        caip_edit_timeline_draft_id,creative_asset_id,creative_media_evidence_range_id,clip_role,source_in_seconds,source_out_seconds,
        timeline_in_seconds,timeline_out_seconds,camera_label,sync_offset_seconds,caption_text,sort_order,created_at
      ) VALUES(?,?,?,'evidence',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(timelineId, clip.creative_asset_id, clip.creative_media_evidence_range_id, clip.source_in_seconds, clip.source_out_seconds,
      clip.timeline_in_seconds, clip.timeline_out_seconds, clip.camera_label, clip.sync_offset_seconds, clip.caption_text, clip.sort_order).run();
  }
  return { caip_edit_timeline_draft_id: timelineId, timeline_status: status, source_group_id: groupId, clip_count: clips.length, total_planned_seconds: cursor, provider_execution_active: false };
}

async function pipelineEvent(db, projectId, type, actorUserId, details = {}) {
  await db.prepare(`INSERT INTO caip_pipeline_events(creative_project_id,event_type,actor_user_id,details_json,created_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)`).bind(projectId, type, integer(actorUserId) || null, JSON.stringify(details || {})).run();
}

export async function onRequestGet(context) {
  const state = await access(context); if (state.error) return state.error;
  try {
    const ready = await schemaReadiness(state.db);
    if (!ready.schema_ready) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, ...ready, error: 'Existing CAIP story/edit authority is incomplete. Build 47 does not repair schema during a request.' }, 503, { 'Cache-Control': 'no-store' });
    const url = new URL(context.request.url);
    const projectId = integer(url.searchParams.get('creative_project_id'));
    const groupId = integer(url.searchParams.get('caip_capture_group_id'));
    if (!projectId) return jsonResponse({ ok: true, release: RELEASE, build: BUILD, title: TITLE, ...ready, projects: await projectOptions(state.db), policy: { review_first: true, external_ai_provider_active: false, provider_execution_active: false, media_rendering_active: false, publication_active: false, r2_mutation_active: false } }, 200, { 'Cache-Control': 'no-store' });
    await requireProject(state.db, projectId);
    return jsonResponse({ ok: true, release: RELEASE, build: BUILD, title: TITLE, ...ready, ...(await bundle(state.db, projectId, groupId)), policy: { review_first: true, confirmed_build46_group_required: true, approved_source_evidence_only: true, external_ai_provider_active: false, provider_execution_active: false, media_rendering_active: false, publication_active: false, r2_mutation_active: false, raw_public_r2_urls: false } }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'grey_hair_story_edit_planning', incident_code: 'build47_story_edit_get_failed', severity: 'warning', message: error?.message || 'Build 47 story/edit planning could not load.', related_user_id: state.adminUser.user_id, details: { release: RELEASE, build: BUILD, error: String(error?.stack || error) } }).catch(() => null);
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: error?.message || 'Build 47 story/edit planning could not load.' }, 503, { 'Cache-Control': 'no-store' });
  }
}

export async function onRequestPost(context) {
  const state = await access(context); if (state.error) return state.error;
  let body = {}; try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'A JSON request body is required.' }, 400, { 'Cache-Control': 'no-store' }); }
  const action = lower(body.action).slice(0, 80);
  const projectId = integer(body.creative_project_id || body.project_id);
  const groupId = integer(body.caip_capture_group_id || body.capture_group_id);
  if (!projectId) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Choose a Grey Hair CAIP project first.' }, 400, { 'Cache-Control': 'no-store' });
  if (!groupId) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Choose a confirmed Build 46 synchronization group first.' }, 400, { 'Cache-Control': 'no-store' });
  try {
    const ready = await schemaReadiness(state.db);
    if (!ready.schema_ready) throw new Error('Existing CAIP story/edit authority is incomplete; Build 47 performs no request-time schema repair.');
    await requireProject(state.db, projectId);
    let result;
    if (action === 'generate_story_plan') result = await generateStoryPlan(state.db, projectId, groupId, body, state.adminUser.user_id);
    else if (action === 'save_story_review') result = await saveStoryReview(state.db, projectId, groupId, integer(body.caip_story_builder_draft_id), body, state.adminUser.user_id);
    else if (action === 'generate_edit_plan') result = await generateEditPlan(state.db, projectId, groupId, integer(body.caip_story_builder_draft_id), body, state.adminUser.user_id);
    else if (action === 'save_edit_review') result = await saveEditReview(state.db, projectId, groupId, integer(body.caip_edit_timeline_draft_id), body, state.adminUser.user_id);
    else throw new Error('Unsupported Build 47 story/edit planning action.');
    await pipelineEvent(state.db, projectId, `build47_${action}`, state.adminUser.user_id, { ...result, external_ai_provider_active: false, provider_execution_active: false, media_rendering_active: false, publication_active: false, r2_mutation_active: false });
    await auditAdminAction(context.env, context.request, state.adminUser, { action_type: `grey_hair_build47_${action}`, target_type: 'creative_project', target_id: projectId, target_key: null, details: { release: RELEASE, build: BUILD, action, ...result, confirmed_build46_group_required: true, approved_source_evidence_only: true, external_ai_provider_active: false, provider_execution_active: false, media_rendering_active: false, publication_active: false, r2_mutation_active: false } }).catch(() => null);
    return jsonResponse({ ok: true, release: RELEASE, build: BUILD, title: TITLE, message: 'Build 47 reviewed story/edit planning saved.', result, ...(await bundle(state.db, projectId, groupId)), policy: { review_first: true, confirmed_build46_group_required: true, approved_source_evidence_only: true, external_ai_provider_active: false, provider_execution_active: false, media_rendering_active: false, publication_active: false, r2_mutation_active: false } }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'grey_hair_story_edit_planning', incident_code: 'build47_story_edit_post_failed', severity: 'warning', message: error?.message || 'Build 47 story/edit planning action failed.', related_user_id: state.adminUser.user_id, details: { release: RELEASE, build: BUILD, action, creative_project_id: projectId, caip_capture_group_id: groupId, error: String(error?.stack || error) } }).catch(() => null);
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: error?.message || 'Build 47 story/edit planning action failed.' }, 400, { 'Cache-Control': 'no-store' });
  }
}
