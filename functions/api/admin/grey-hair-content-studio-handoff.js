// Release 467 Build 50 — Reviewed CAIP to Content Studio Handoff.
// Explicit Development-only bridge from a Build 48 accepted planning package into the existing
// review-first Content Studio authority. No renderer/provider/publication/social/R2/schema/main/Production execution.
import {
  auditAdminAction,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';
import {
  createOrRefreshContentProjectForCreativeProject,
  getContentProjectDetail,
} from '../_lib/contentAutomationStudio.js';
import { onRequestGet as getBuild48Acceptance } from './grey-hair-production-acceptance.js';

const RELEASE = 467;
const BUILD = 50;
const TITLE = 'Reviewed CAIP to Content Studio Handoff';
const GENERATED_BY = 'build50_reviewed_caip_handoff';

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

function policy() {
  return {
    build48_acceptance_required: true,
    explicit_human_handoff_action_required: true,
    content_studio_review_required_after_handoff: true,
    exact_story_timeline_evidence_provenance_required: true,
    raw_public_r2_urls: false,
    provider_execution_active: false,
    media_rendering_active: false,
    publication_active: false,
    social_queue_active: false,
    r2_mutation_active: false,
    request_time_ddl: false,
    schema_change: false,
    main_mutation: false,
    production_contacted: false,
    automatic_production_promotion: false,
  };
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'Admin access required.', policy: policy() }, 401, { 'Cache-Control': 'no-store' }) };
  const db = getDb(context.env);
  if (!db) return { error: jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'Database binding is not configured.', policy: policy() }, 503, { 'Cache-Control': 'no-store' }) };
  return { adminUser, db };
}

async function readBuild48(context, params = {}) {
  const url = new URL(context.request.url);
  url.pathname = '/api/admin/grey-hair-production-acceptance';
  url.search = '';
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value) !== '') url.searchParams.set(key, String(value));
  }
  const request = new Request(url.toString(), { method: 'GET', headers: context.request.headers });
  const response = await getBuild48Acceptance({ ...context, request });
  const data = await response.json().catch(() => null);
  return { response, data };
}

function chooseDeliverableKey(aspect) {
  if (text(aspect) === '9:16') return 'instagram-reel-1';
  if (text(aspect) === '1:1') return 'facebook-video-1';
  return 'youtube-long-video';
}

function buildScript(story, timeline) {
  const storyItems = Array.isArray(story?.items) ? [...story.items].sort((a, b) => numeric(a.sort_order) - numeric(b.sort_order)) : [];
  const clips = Array.isArray(timeline?.clips) ? [...timeline.clips].sort((a, b) => numeric(a.sort_order) - numeric(b.sort_order)) : [];
  const clipByEvidence = new Map(clips.map((row) => [integer(row.creative_media_evidence_range_id), row]));
  return storyItems.map((item, index) => {
    const evidenceId = integer(item.creative_media_evidence_range_id);
    const clip = clipByEvidence.get(evidenceId);
    const timelineIn = clip ? numeric(clip.timeline_in_seconds) : null;
    const timelineOut = clip ? numeric(clip.timeline_out_seconds) : null;
    const range = clip ? `${timelineIn.toFixed(3)}-${timelineOut.toFixed(3)}s` : 'timecode unavailable';
    const role = text(item.item_role || 'story_beat').replace(/_/g, ' ');
    const title = text(item.item_title, 220) || `Beat ${index + 1}`;
    const body = text(item.item_text, 1800) || 'Reviewed source evidence.';
    return `${range} — ${role}: ${title}\n${body}\nEvidence #${evidenceId}${clip?.camera_label ? ` • ${text(clip.camera_label)}` : ''}`;
  }).join('\n\n');
}

function buildAssetPlan(acceptance, story, timeline) {
  const clips = Array.isArray(timeline?.clips) ? [...timeline.clips].sort((a, b) => numeric(a.sort_order) - numeric(b.sort_order)) : [];
  return {
    authority: 'release467-build50-reviewed-caip-content-studio-handoff',
    source_acceptance_authority: 'release467-build48-automated-production-acceptance',
    build48_package_id: acceptance.package_id,
    creative_project_id: integer(acceptance.creative_project_id),
    caip_capture_group_id: integer(acceptance.caip_capture_group_id),
    caip_story_builder_draft_id: integer(acceptance.caip_story_builder_draft_id),
    caip_edit_timeline_draft_id: integer(acceptance.caip_edit_timeline_draft_id),
    reviewed_evidence_only: true,
    human_content_studio_review_required: true,
    render_execution_authorized: false,
    provider_execution_authorized: false,
    publication_authorized: false,
    social_queue_authorized: false,
    r2_mutation_authorized: false,
    raw_public_r2_urls: false,
    story_evidence_ids: (story?.items || []).map((row) => integer(row.creative_media_evidence_range_id)).filter(Boolean),
    clips: clips.map((clip) => ({
      creative_media_evidence_range_id: integer(clip.creative_media_evidence_range_id),
      creative_asset_id: integer(clip.creative_asset_id),
      camera_label: text(clip.camera_label, 80) || null,
      sync_offset_seconds: numeric(clip.sync_offset_seconds),
      source_in_seconds: numeric(clip.source_in_seconds),
      source_out_seconds: numeric(clip.source_out_seconds),
      timeline_in_seconds: numeric(clip.timeline_in_seconds),
      timeline_out_seconds: numeric(clip.timeline_out_seconds),
    })),
  };
}

async function resolveExistingHandoff(db, caipProjectId) {
  const caip = await db.prepare(`SELECT creative_project_id,creative_project_key,project_title,source_type,source_id,content_project_id FROM creative_projects WHERE creative_project_id=? LIMIT 1`).bind(caipProjectId).first();
  if (!caip) return { caip: null, work: null, content_project_id: null };
  const workId = lower(caip.source_type) === 'creative_work_project' ? integer(caip.source_id) : 0;
  const work = workId ? await db.prepare(`SELECT * FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1`).bind(workId).first() : null;
  return { caip, work, content_project_id: integer(caip.content_project_id) || null };
}

export async function onRequestGet(context) {
  const auth = await access(context);
  if (auth.error) return auth.error;
  const url = new URL(context.request.url);
  const projectId = integer(url.searchParams.get('creative_project_id'));
  const groupId = integer(url.searchParams.get('caip_capture_group_id'));
  const timelineId = integer(url.searchParams.get('caip_edit_timeline_draft_id'));
  const upstream = await readBuild48(context, {
    creative_project_id: projectId || '',
    caip_capture_group_id: groupId || '',
    caip_edit_timeline_draft_id: timelineId || '',
  });
  if (!upstream.response.ok || !upstream.data?.ok) {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: upstream.data?.error || `Build 48 acceptance authority unavailable (${upstream.response.status}).`, upstream: upstream.data || null, policy: policy() }, upstream.response.status || 503, { 'Cache-Control': 'no-store' });
  }
  let existing = null;
  if (projectId) existing = await resolveExistingHandoff(auth.db, projectId);
  return jsonResponse({
    ok: true,
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    projects: upstream.data.projects || [],
    project: upstream.data.project || null,
    groups: upstream.data.groups || [],
    active_group: upstream.data.active_group || null,
    stories: upstream.data.stories || [],
    timelines: upstream.data.timelines || [],
    acceptances: upstream.data.acceptances || [],
    summary: upstream.data.summary || {},
    existing_content_project_id: existing?.content_project_id || null,
    creative_work_project_id: integer(existing?.work?.creative_work_project_id) || null,
    policy: policy(),
  }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const auth = await access(context);
  if (auth.error) return auth.error;
  const { db, adminUser } = auth;
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const projectId = integer(body.creative_project_id);
  const groupId = integer(body.caip_capture_group_id);
  const timelineId = integer(body.caip_edit_timeline_draft_id);
  if (!projectId || !groupId || !timelineId) {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'Creative project, confirmed synchronization group, and accepted edit timeline are required.', policy: policy() }, 400, { 'Cache-Control': 'no-store' });
  }

  const upstream = await readBuild48(context, { creative_project_id: projectId, caip_capture_group_id: groupId, caip_edit_timeline_draft_id: timelineId });
  if (!upstream.response.ok || !upstream.data?.ok) {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: upstream.data?.error || 'Build 48 acceptance could not be re-proven.', policy: policy() }, upstream.response.status || 409, { 'Cache-Control': 'no-store' });
  }
  const acceptance = (upstream.data.acceptances || []).find((row) => integer(row.caip_edit_timeline_draft_id) === timelineId) || null;
  if (!acceptance || acceptance.decision !== 'ACCEPTED_FOR_CONTROLLED_PRODUCTION') {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'Build 50 is blocked until this exact timeline is ACCEPTED_FOR_CONTROLLED_PRODUCTION by Build 48.', acceptance, policy: policy() }, 409, { 'Cache-Control': 'no-store' });
  }

  const timeline = (upstream.data.timelines || []).find((row) => integer(row.caip_edit_timeline_draft_id) === timelineId) || null;
  const story = (upstream.data.stories || []).find((row) => integer(row.caip_story_builder_draft_id) === integer(acceptance.caip_story_builder_draft_id)) || null;
  if (!timeline || !story || lower(story.story_status) !== 'approved' || lower(timeline.timeline_status) !== 'approved') {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'The approved Build 47 story/timeline bundle is no longer current.', policy: policy() }, 409, { 'Cache-Control': 'no-store' });
  }

  const mapping = await resolveExistingHandoff(db, projectId);
  if (!mapping.caip || !mapping.work || lower(mapping.caip.source_type) !== 'creative_work_project') {
    return jsonResponse({ ok: false, release: RELEASE, build: BUILD, title: TITLE, error: 'Grey Hair CAIP must remain linked to its existing Creative Process project before Content Studio handoff.', policy: policy() }, 409, { 'Cache-Control': 'no-store' });
  }

  const evidenceRows = (story.items || []).map((item) => ({
    evidence_role: text(item.item_role, 80),
    event_type: text(item.item_role, 80),
    event_title: text(item.item_title, 300),
    event_notes: text(item.item_text, 2200),
    media_url: null,
    creative_media_evidence_range_id: integer(item.creative_media_evidence_range_id),
  }));
  const created = await createOrRefreshContentProjectForCreativeProject(db, mapping.work, evidenceRows, adminUser.user_id, { refresh_copy: false });
  const contentProjectId = integer(created?.project?.content_project_id);
  if (!contentProjectId) throw new Error('Content Studio package could not be resolved.');

  const deliverableKey = chooseDeliverableKey(timeline.aspect_ratio);
  const deliverable = await db.prepare(`SELECT content_project_deliverable_id,deliverable_key FROM content_project_deliverables WHERE content_project_id=? AND deliverable_key=? LIMIT 1`).bind(contentProjectId, deliverableKey).first();
  if (!deliverable?.content_project_deliverable_id) throw new Error(`Content Studio template ${deliverableKey} was not found.`);

  const script = buildScript(story, timeline);
  const assetPlan = buildAssetPlan(acceptance, story, timeline);
  const bodyContent = [
    `Build 48 package: ${acceptance.package_id}`,
    `Approved story #${integer(acceptance.caip_story_builder_draft_id)} / timeline #${timelineId} / sync group #${groupId}.`,
    `Planned duration ${numeric(timeline.total_planned_seconds).toFixed(3)}s of ${numeric(timeline.target_duration_seconds).toFixed(3)}s target.`,
    'This handoff is review metadata only. Rendering, provider execution, publication, social queueing and R2 mutation remain closed.',
  ].join('\n');

  await db.prepare(`
    UPDATE content_project_deliverables
    SET title=?,script_text=?,body_content=?,asset_plan_json=?,aspect_ratio=?,target_duration_seconds=?,
        deliverable_status='ready_for_review',approval_status='needs_review',generated_by=?,copy_locked=1,
        output_url=NULL,thumbnail_url=NULL,social_post_queue_id=NULL,updated_at=CURRENT_TIMESTAMP
    WHERE content_project_deliverable_id=? AND content_project_id=?
  `).bind(
    `${text(timeline.title, 180) || 'Grey Hair'} — reviewed CAIP edit plan`, script, bodyContent, JSON.stringify(assetPlan),
    text(timeline.aspect_ratio), numeric(timeline.target_duration_seconds), GENERATED_BY,
    integer(deliverable.content_project_deliverable_id), contentProjectId,
  ).run();

  const packageJson = JSON.stringify({
    release: RELEASE,
    build: BUILD,
    generated_by: GENERATED_BY,
    build48_package_id: acceptance.package_id,
    creative_project_id: projectId,
    creative_work_project_id: integer(mapping.work.creative_work_project_id),
    content_project_id: contentProjectId,
    content_project_deliverable_id: integer(deliverable.content_project_deliverable_id),
    deliverable_key: deliverableKey,
    caip_capture_group_id: groupId,
    caip_story_builder_draft_id: integer(acceptance.caip_story_builder_draft_id),
    caip_edit_timeline_draft_id: timelineId,
    evidence_count: evidenceRows.length,
    decision: acceptance.decision,
    content_studio_review_required: true,
    render_execution_authorized: false,
    provider_execution_authorized: false,
    publication_authorized: false,
    social_queue_authorized: false,
    r2_mutation_authorized: false,
  });
  const existing = await db.prepare(`SELECT creative_project_content_handoff_id FROM creative_project_content_handoffs WHERE creative_work_project_id=? AND content_project_id=? ORDER BY creative_project_content_handoff_id DESC LIMIT 1`).bind(integer(mapping.work.creative_work_project_id), contentProjectId).first().catch(() => null);
  if (existing?.creative_project_content_handoff_id) {
    await db.prepare(`UPDATE creative_project_content_handoffs SET handoff_status='ready_for_review',evidence_count=?,package_json=? WHERE creative_project_content_handoff_id=?`).bind(evidenceRows.length, packageJson, integer(existing.creative_project_content_handoff_id)).run();
  } else {
    await db.prepare(`INSERT INTO creative_project_content_handoffs(creative_work_project_id,content_project_id,handoff_status,evidence_count,package_json,created_by,created_at) VALUES(?,?,'ready_for_review',?,?,?,CURRENT_TIMESTAMP)`).bind(integer(mapping.work.creative_work_project_id), contentProjectId, evidenceRows.length, packageJson, adminUser.user_id).run();
  }

  const detail = await getContentProjectDetail(db, contentProjectId);
  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'build50_reviewed_caip_content_studio_handoff',
    target_type: 'content_project',
    target_id: contentProjectId,
    target_key: detail?.project?.content_project_key || null,
    details: {
      release: RELEASE, build: BUILD, build48_package_id: acceptance.package_id,
      creative_project_id: projectId, creative_work_project_id: integer(mapping.work.creative_work_project_id),
      content_project_id: contentProjectId, content_project_deliverable_id: integer(deliverable.content_project_deliverable_id),
      caip_capture_group_id: groupId, caip_story_builder_draft_id: integer(acceptance.caip_story_builder_draft_id),
      caip_edit_timeline_draft_id: timelineId, evidence_count: evidenceRows.length,
      execution_authorized: false,
    },
  });

  return jsonResponse({
    ok: true,
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    message: 'Reviewed Build 48 planning package handed to Content Studio for human review.',
    result: {
      build48_package_id: acceptance.package_id,
      creative_project_id: projectId,
      creative_work_project_id: integer(mapping.work.creative_work_project_id),
      content_project_id: contentProjectId,
      content_project_deliverable_id: integer(deliverable.content_project_deliverable_id),
      deliverable_key: deliverableKey,
      handoff_state: 'ready_for_review',
      content_studio_review_required: true,
    },
    detail,
    policy: policy(),
  }, 200, { 'Cache-Control': 'no-store' });
}
