// Release 467 Build 48 — Automated Production Acceptance.
// Read-only deterministic acceptance over the reviewed Build 47 story/edit bundle.
// This endpoint does not render media, call providers, publish, mutate R2, change schema,
// promote main, or contact Production. It only proves whether one reviewed edit package
// is safe to hand to a separately governed controlled production/rendering step.
import { jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { onRequestGet as getBuild47Planning } from './grey-hair-story-edit-planning.js';

const RELEASE = 467;
const BUILD = 48;
const TITLE = 'Automated Production Acceptance';
const STORY_PLANNER = 'build47_reviewed_story_planner';
const ALLOWED_ASPECTS = new Set(['16:9', '9:16', '1:1']);
const TOLERANCE = 0.002;

const text = (value) => normalizeText(value);
const lower = (value) => text(value).toLowerCase();
const integer = (value) => {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};
const numeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const closeEnough = (a, b, tolerance = TOLERANCE) => Math.abs(numeric(a) - numeric(b)) <= tolerance;
const unique = (values) => [...new Set(values)];
function isGreyHair(row) {
  const value = `${row?.creative_project_key || ''} ${row?.project_title || ''}`.toLowerCase();
  return /\bgr[ae]y\b/.test(value) && /\bhair\b/.test(value);
}

function policy() {
  return {
    read_only_acceptance: true,
    confirmed_build46_group_required: true,
    approved_build47_story_required: true,
    approved_build47_timeline_required: true,
    approved_active_source_evidence_required: true,
    exact_story_clip_evidence_coverage_required: true,
    clip_source_bounds_required: true,
    contiguous_timeline_required: true,
    synchronized_camera_offsets_required: true,
    target_duration_compliance_required: true,
    provider_execution_active: false,
    media_rendering_active: false,
    publication_active: false,
    social_handoff_active: false,
    r2_mutation_active: false,
    raw_public_r2_urls: false,
    request_time_ddl: false,
    schema_change: false,
    main_mutation: false,
    production_contacted: false,
    automatic_production_promotion: false,
  };
}

async function readBuild47(context, params = {}) {
  const url = new URL(context.request.url);
  url.pathname = '/api/admin/grey-hair-story-edit-planning';
  url.search = '';
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value) !== '') url.searchParams.set(key, String(value));
  }
  const request = new Request(url.toString(), { method: 'GET', headers: context.request.headers });
  const response = await getBuild47Planning({ ...context, request });
  const data = await response.json().catch(() => null);
  return { response, data };
}

function checkList(bundle, timeline) {
  const checks = [];
  const add = (code, pass, label, detail) => checks.push({ code, pass: Boolean(pass), status: pass ? 'pass' : 'fail', label, detail });
  const group = bundle.active_group || null;
  const groupId = integer(group?.caip_capture_group_id);
  const storyId = integer(timeline?.caip_story_builder_draft_id);
  const story = (bundle.stories || []).find((row) => integer(row.caip_story_builder_draft_id) === storyId) || null;
  const plan = timeline?.plan && typeof timeline.plan === 'object' ? timeline.plan : {};
  const evidence = Array.isArray(bundle.evidence) ? bundle.evidence : [];
  const evidenceById = new Map(evidence.map((row) => [integer(row.creative_media_evidence_range_id), row]));
  const tracks = Array.isArray(group?.tracks) ? group.tracks : [];
  const cameras = tracks.filter((row) => lower(row.source_role) === 'camera');
  const audio = tracks.filter((row) => lower(row.source_role) === 'audio');
  const trackByAsset = new Map(tracks.map((row) => [integer(row.creative_asset_id), row]));
  const storyItems = Array.isArray(story?.items) ? [...story.items].sort((a, b) => numeric(a.sort_order) - numeric(b.sort_order)) : [];
  const clips = Array.isArray(timeline?.clips) ? [...timeline.clips].sort((a, b) => numeric(a.sort_order) - numeric(b.sort_order)) : [];

  add('grey_hair_project', isGreyHair(bundle.project), 'Grey Hair project identity', 'The accepted package must belong to the dedicated Grey Hair CAIP project.');
  add('confirmed_build46_group', group?.readiness?.ready_for_build47 === true && lower(group?.sync_status) === 'confirmed', 'Confirmed Build 46 synchronization', 'A confirmed Build 46 synchronization group is required.');
  add('exact_four_cameras', cameras.length === 4 && unique(cameras.map((row) => lower(row.camera_label))).length === 4, 'Exactly four distinct cameras', `Found ${cameras.length} camera tracks.`);
  add('optional_audio_limit', audio.length <= 1, 'Dedicated audio limit', `Found ${audio.length} dedicated audio tracks.`);
  add('all_tracks_confirmed', tracks.length >= 4 && tracks.every((row) => lower(row.review_status) === 'confirmed'), 'All synchronization tracks reviewed', 'Every included camera/audio track must remain confirmed.');

  add('build47_story_exists', Boolean(story), 'Build 47 story authority', story ? `Story #${storyId} resolved.` : 'Timeline does not resolve to a Build 47 story.');
  add('story_planner_identity', text(story?.generated_by) === STORY_PLANNER, 'Build 47 planner provenance', `generated_by=${text(story?.generated_by) || 'missing'}`);
  add('story_approved', lower(story?.story_status) === 'approved', 'Human-approved story', `story_status=${text(story?.story_status) || 'missing'}`);
  add('story_review_identity', integer(story?.reviewed_by_user_id) > 0 && Boolean(text(story?.reviewed_at)), 'Story reviewer evidence', 'Approved story must retain reviewer identity and reviewed_at.');
  add('story_minimum_beats', storyItems.length >= 3, 'Minimum story coverage', `Found ${storyItems.length} story beats.`);

  const storyEvidenceIds = storyItems.map((row) => integer(row.creative_media_evidence_range_id)).filter(Boolean);
  add('story_evidence_unique', storyEvidenceIds.length === unique(storyEvidenceIds).length, 'Unique story evidence', 'Each reviewed evidence range may appear only once in the accepted story.');
  add('story_evidence_current', storyEvidenceIds.length >= 3 && storyEvidenceIds.every((id) => evidenceById.has(id)), 'Story evidence still approved/current', 'Every story beat must still resolve to approved active evidence from this confirmed group.');

  add('timeline_approved', lower(timeline?.timeline_status) === 'approved', 'Human-approved edit timeline', `timeline_status=${text(timeline?.timeline_status) || 'missing'}`);
  add('timeline_review_identity', integer(timeline?.reviewed_by_user_id) > 0 && Boolean(text(timeline?.reviewed_at)), 'Timeline reviewer evidence', 'Approved timeline must retain reviewer identity and reviewed_at.');
  add('timeline_provider_closed', lower(timeline?.provider_execution_status) === 'closed', 'Provider execution remains closed', `provider_execution_status=${text(timeline?.provider_execution_status) || 'missing'}`);
  add('timeline_aspect_ratio', ALLOWED_ASPECTS.has(text(timeline?.aspect_ratio)), 'Supported aspect ratio', `aspect_ratio=${text(timeline?.aspect_ratio) || 'missing'}`);
  add('plan_group_provenance', integer(plan.source_group_id) === groupId && groupId > 0, 'Edit plan source-group provenance', `plan source_group_id=${integer(plan.source_group_id)}; active group=${groupId}`);
  add('plan_story_provenance', integer(plan.story_id) === storyId && storyId > 0, 'Edit plan story provenance', `plan story_id=${integer(plan.story_id)}; timeline story=${storyId}`);
  add('plan_review_boundary', plan.reviewed_evidence_only === true && plan.confirmed_sync_required === true, 'Reviewed evidence/sync contract', 'Plan must explicitly retain reviewed_evidence_only and confirmed_sync_required.');
  add('plan_execution_boundary', plan.provider_execution_active === false && plan.media_rendering_active === false && plan.publication_active === false && plan.r2_mutation_active === false, 'Execution boundary remains closed', 'Provider, rendering, publication and R2 flags must all remain false.');

  const clipEvidenceIds = clips.map((row) => integer(row.creative_media_evidence_range_id)).filter(Boolean);
  add('clips_present', clips.length > 0 && clipEvidenceIds.length === clips.length, 'Source-linked edit clips', `Found ${clips.length} clips.`);
  add('clip_evidence_unique', clipEvidenceIds.length === unique(clipEvidenceIds).length, 'Unique clip evidence', 'Each accepted evidence range may appear only once in the timeline.');
  const sameCoverage = storyEvidenceIds.length === clipEvidenceIds.length
    && unique(storyEvidenceIds).every((id) => clipEvidenceIds.includes(id))
    && unique(clipEvidenceIds).every((id) => storyEvidenceIds.includes(id));
  add('exact_story_clip_coverage', sameCoverage, 'Exact story-to-clip evidence coverage', 'The accepted timeline must cover exactly the human-approved story evidence set—no silent additions or omissions.');

  let cursor = 0;
  let clipBoundariesPass = clips.length > 0;
  let continuityPass = clips.length > 0;
  let syncPass = clips.length > 0;
  for (const clip of clips) {
    const evidenceRow = evidenceById.get(integer(clip.creative_media_evidence_range_id));
    const track = evidenceRow ? trackByAsset.get(integer(evidenceRow.creative_asset_id)) : null;
    if (!evidenceRow || !track) {
      clipBoundariesPass = false;
      syncPass = false;
      continue;
    }
    const sourceIn = numeric(clip.source_in_seconds, -1);
    const sourceOut = numeric(clip.source_out_seconds, -1);
    const evidenceIn = Math.max(0, numeric(evidenceRow.start_seconds, 0));
    const evidenceOut = Math.max(evidenceIn, numeric(evidenceRow.end_seconds, evidenceIn));
    if (integer(clip.creative_asset_id) !== integer(evidenceRow.creative_asset_id)
      || sourceIn < evidenceIn - TOLERANCE || sourceOut > evidenceOut + TOLERANCE || sourceOut <= sourceIn) clipBoundariesPass = false;
    const timelineIn = numeric(clip.timeline_in_seconds, -1);
    const timelineOut = numeric(clip.timeline_out_seconds, -1);
    if (!closeEnough(timelineIn, cursor) || timelineOut <= timelineIn || !closeEnough(timelineOut - timelineIn, sourceOut - sourceIn)) continuityPass = false;
    cursor = timelineOut;
    if (lower(track.review_status) !== 'confirmed'
      || lower(track.source_role) !== 'camera'
      || text(clip.camera_label) !== text(track.camera_label)
      || !closeEnough(clip.sync_offset_seconds, track.sync_offset_seconds)) syncPass = false;
  }
  add('clip_source_bounds', clipBoundariesPass, 'Clip source bounds/provenance', 'Every clip must remain inside its approved evidence range and on the same source asset.');
  add('timeline_contiguous', continuityPass && closeEnough(cursor, timeline?.total_planned_seconds), 'Contiguous deterministic timeline', `Computed end=${cursor}; stored total=${numeric(timeline?.total_planned_seconds)}`);
  add('camera_sync_preserved', syncPass, 'Confirmed camera synchronization preserved', 'Every clip must retain its confirmed camera label and millisecond synchronization offset.');

  const target = numeric(timeline?.target_duration_seconds, 0);
  const total = numeric(timeline?.total_planned_seconds, 0);
  add('target_duration', target > 0 && total > 0 && total <= target + TOLERANCE, 'Target duration compliance', `planned=${total}s; target=${target}s`);
  add('plan_total_matches', closeEnough(plan.total_planned_seconds, total), 'Plan/draft duration agreement', `plan=${numeric(plan.total_planned_seconds)}s; draft=${total}s`);

  return checks;
}

function acceptance(bundle, timeline) {
  const checks = checkList(bundle, timeline);
  const blockers = checks.filter((row) => !row.pass).map((row) => ({ code: row.code, label: row.label, detail: row.detail }));
  const timelineId = integer(timeline?.caip_edit_timeline_draft_id);
  const storyId = integer(timeline?.caip_story_builder_draft_id);
  const groupId = integer(bundle.active_group?.caip_capture_group_id);
  return {
    package_id: `b48-p${integer(bundle.project?.creative_project_id)}-g${groupId}-s${storyId}-t${timelineId}`,
    creative_project_id: integer(bundle.project?.creative_project_id),
    caip_capture_group_id: groupId,
    caip_story_builder_draft_id: storyId,
    caip_edit_timeline_draft_id: timelineId,
    title: text(timeline?.title) || `Timeline ${timelineId}`,
    decision: blockers.length ? 'HOLD' : 'ACCEPTED_FOR_CONTROLLED_PRODUCTION',
    pass_count: checks.filter((row) => row.pass).length,
    check_count: checks.length,
    blockers,
    checks,
    handoff: blockers.length ? null : {
      state: 'ACCEPTED_FOR_CONTROLLED_PRODUCTION',
      render_execution_authorized: false,
      provider_execution_authorized: false,
      publication_authorized: false,
      r2_mutation_authorized: false,
      next_step: 'A separately governed controlled production/rendering build may consume this accepted immutable planning package after its own explicit authorization.',
    },
  };
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const projectId = integer(url.searchParams.get('creative_project_id'));
  const requestedGroupId = integer(url.searchParams.get('caip_capture_group_id'));
  const requestedTimelineId = integer(url.searchParams.get('caip_edit_timeline_draft_id'));

  const base = await readBuild47(context);
  if (!base.response.ok || !base.data?.ok) {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: base.data?.error || `Build 47 planning authority unavailable (${base.response.status}).`, policy: policy() }, base.response.status || 503, { 'Cache-Control': 'no-store' });
  }
  const projects = (base.data.projects || []).filter(isGreyHair);
  if (!projectId) {
    return jsonResponse({ ok: true, release: RELEASE, build: BUILD, title: TITLE, projects, summary: { grey_hair_projects: projects.length }, policy: policy() }, 200, { 'Cache-Control': 'no-store' });
  }
  if (!projects.some((row) => integer(row.creative_project_id) === projectId)) {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'Build 48 accepts only the dedicated Grey Hair CAIP project.', projects, policy: policy() }, 400, { 'Cache-Control': 'no-store' });
  }

  const loaded = await readBuild47(context, { creative_project_id: projectId, caip_capture_group_id: requestedGroupId || '' });
  if (!loaded.response.ok || !loaded.data?.ok) {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: loaded.data?.error || `Build 47 planning bundle unavailable (${loaded.response.status}).`, policy: policy() }, loaded.response.status || 503, { 'Cache-Control': 'no-store' });
  }
  const bundle = loaded.data;
  const activeGroupId = integer(bundle.active_group?.caip_capture_group_id);
  if (requestedGroupId && activeGroupId !== requestedGroupId) {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'The requested synchronization group is not currently confirmed/eligible under Build 46.', projects, project: bundle.project, groups: bundle.groups || [], policy: policy() }, 409, { 'Cache-Control': 'no-store' });
  }
  if (!activeGroupId) {
    return jsonResponse({ ok: true, release: RELEASE, build: BUILD, title: TITLE, projects, project: bundle.project, groups: bundle.groups || [], acceptances: [], summary: { accepted: 0, hold: 0, eligible_timelines: 0 }, policy: policy() }, 200, { 'Cache-Control': 'no-store' });
  }

  const eligible = (bundle.timelines || []).filter((row) => integer(row?.plan?.source_group_id) === activeGroupId);
  const selected = requestedTimelineId ? eligible.filter((row) => integer(row.caip_edit_timeline_draft_id) === requestedTimelineId) : eligible;
  const acceptances = selected.map((timeline) => acceptance(bundle, timeline));
  const accepted = acceptances.filter((row) => row.decision === 'ACCEPTED_FOR_CONTROLLED_PRODUCTION').length;
  return jsonResponse({
    ok: true,
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    projects,
    project: bundle.project,
    groups: bundle.groups || [],
    active_group: bundle.active_group || null,
    stories: bundle.stories || [],
    timelines: eligible,
    acceptances,
    summary: { accepted, hold: acceptances.length - accepted, eligible_timelines: eligible.length, selected_timelines: acceptances.length },
    policy: policy(),
  }, 200, { 'Cache-Control': 'no-store' });
}
