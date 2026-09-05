// Release 467 Build 52 — fail-closed, read-only Content Studio render readiness.
// This authority never creates render jobs, invokes providers, writes R2, publishes, or changes schema.
import { requireContentAutomationSchema } from './contentAutomationSchemaReadiness.js';

const text = (value, max = 0) => {
  const cleaned = String(value ?? '').trim();
  return max > 0 ? cleaned.slice(0, max).trim() : cleaned;
};
const number = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const rows = (result) => Array.isArray(result?.results) ? result.results : [];
const safeJson = (value, fallback = {}) => { try { return JSON.parse(value || ''); } catch { return fallback; } };

function blocker(code, message, evidence = {}) {
  return { code, message, evidence };
}

export async function assessContentRenderReadiness(db, projectId, deliverableId, overrides = {}) {
  await requireContentAutomationSchema(db);
  const id = number(projectId);
  const deliverableKey = number(deliverableId);
  if (!id || !deliverableKey) {
    return { ready: false, state: 'blocked', blockers: [blocker('IDENTITY_REQUIRED', 'A valid content project and deliverable are required.')], warnings: [], safety: safetyBoundary() };
  }

  const project = await db.prepare(`SELECT content_project_id,content_project_key,project_title,project_status,review_status,public_release_status,content_policy_json FROM content_projects WHERE content_project_id=? LIMIT 1`).bind(id).first();
  const deliverable = await db.prepare(`SELECT content_project_deliverable_id,content_project_id,deliverable_key,channel_key,deliverable_type,title,script_text,body_content,asset_plan_json,aspect_ratio,target_duration_seconds,deliverable_status,approval_status,output_url FROM content_project_deliverables WHERE content_project_id=? AND content_project_deliverable_id=? LIMIT 1`).bind(id, deliverableKey).first();
  if (!project || !deliverable) {
    return { ready: false, state: 'blocked', blockers: [blocker('CONTENT_DELIVERABLE_NOT_FOUND', 'The Content Studio project or deliverable was not found.')], warnings: [], safety: safetyBoundary() };
  }

  const media = rows(await db.prepare(`SELECT content_project_media_id,archive_key,source_url,media_type,safety_status,is_selected,is_featured FROM content_project_media WHERE content_project_id=? ORDER BY is_featured DESC,is_selected DESC,selection_score DESC,content_project_media_id`).bind(id).all());
  const activeRenderJobs = rows(await db.prepare(`SELECT content_render_job_id,render_provider,render_status,created_at FROM content_render_jobs WHERE content_project_deliverable_id=? AND render_status IN ('planned','rendering') ORDER BY content_render_job_id DESC`).bind(deliverableKey).all().catch(() => ({ results: [] })));

  const candidate = {
    approval_status: text(overrides.approval_status ?? deliverable.approval_status).toLowerCase(),
    title: text(overrides.title ?? deliverable.title, 220),
    script_text: text(overrides.script_text ?? deliverable.script_text, 12000),
    body_content: text(overrides.body_content ?? deliverable.body_content, 24000),
    output_url: text(overrides.output_url ?? deliverable.output_url, 1600),
  };
  const policy = safeJson(project.content_policy_json, {});
  const assetPlan = safeJson(deliverable.asset_plan_json, {});
  const plannedAssets = Array.isArray(assetPlan.assets) ? assetPlan.assets : [];
  const referencedKeys = [...new Set(plannedAssets.map((asset) => text(asset?.archive_key)).filter(Boolean))];
  const selectedByKey = new Map(media.filter((item) => number(item.is_selected) === 1).map((item) => [text(item.archive_key), item]));
  const referencedMedia = referencedKeys.map((key) => selectedByKey.get(key)).filter(Boolean);
  const missingKeys = referencedKeys.filter((key) => !selectedByKey.has(key));
  const uncleared = referencedMedia.filter((item) => text(item.safety_status).toLowerCase() !== 'public_allowed');
  const blockers = [];
  const warnings = [];

  if (text(project.review_status).toLowerCase() !== 'approved') blockers.push(blocker('PROJECT_APPROVAL_REQUIRED', 'Approve the Content Studio project before marking a deliverable ready for render.', { review_status: project.review_status }));
  if (candidate.approval_status !== 'approved') blockers.push(blocker('DELIVERABLE_APPROVAL_REQUIRED', 'Approve the deliverable before marking it ready for render.', { approval_status: candidate.approval_status }));
  if (!candidate.title) blockers.push(blocker('TITLE_REQUIRED', 'A reviewed deliverable title is required.'));
  if (text(deliverable.deliverable_status).toLowerCase() === 'archived') blockers.push(blocker('DELIVERABLE_ARCHIVED', 'Archived deliverables cannot become render-ready.'));
  if (candidate.output_url) blockers.push(blocker('OUTPUT_ALREADY_EXISTS', 'This deliverable already has an output URL; do not create another render request implicitly.', { output_url_present: true }));
  if (!referencedKeys.length) blockers.push(blocker('ASSET_PLAN_REQUIRED', 'The deliverable must reference at least one reviewed source asset before render readiness can pass.'));
  if (missingKeys.length) blockers.push(blocker('SELECTED_SOURCE_REQUIRED', 'Every asset-plan reference must resolve to a currently selected Content Studio source.', { missing_archive_keys: missingKeys }));
  if (uncleared.length) blockers.push(blocker('PUBLIC_MEDIA_CLEARANCE_REQUIRED', 'Every selected source used by this deliverable must be marked public allowed before render readiness can pass.', { archive_keys: uncleared.map((item) => item.archive_key), safety_statuses: uncleared.map((item) => item.safety_status) }));
  if (activeRenderJobs.length) blockers.push(blocker('ACTIVE_RENDER_JOB_EXISTS', 'A planned or rendering job already exists for this deliverable. Build 52 will not create or duplicate one.', { active_render_job_ids: activeRenderJobs.map((item) => item.content_render_job_id) }));
  if (policy.review_first !== true || policy.no_auto_publish !== true) blockers.push(blocker('REVIEW_POLICY_REQUIRED', 'The project must retain review-first and no-auto-publish policy before render readiness can pass.', { review_first: policy.review_first === true, no_auto_publish: policy.no_auto_publish === true }));

  const type = text(deliverable.deliverable_type).toLowerCase();
  if (['long_video','short_video'].includes(type)) {
    if (!candidate.script_text) blockers.push(blocker('SCRIPT_REQUIRED', 'Video deliverables require reviewed script / production directions.'));
    if (number(deliverable.target_duration_seconds) <= 0) blockers.push(blocker('TARGET_DURATION_REQUIRED', 'Video deliverables require a positive target duration.'));
  }
  if (!referencedMedia.length && referencedKeys.length) warnings.push({ code: 'NO_SELECTED_REFERENCED_MEDIA', message: 'The asset plan currently resolves to no selected media.' });
  if (text(project.public_release_status).toLowerCase() === 'published') warnings.push({ code: 'PROJECT_ALREADY_PUBLISHED', message: 'The project public-release state is already published; render readiness does not authorize another publication.' });

  return {
    ready: blockers.length === 0,
    state: blockers.length === 0 ? 'ready_for_render' : 'blocked',
    project: {
      content_project_id: number(project.content_project_id),
      content_project_key: project.content_project_key || null,
      project_title: project.project_title || null,
      project_status: project.project_status || null,
      review_status: project.review_status || null,
      public_release_status: project.public_release_status || null,
    },
    deliverable: {
      content_project_deliverable_id: number(deliverable.content_project_deliverable_id),
      deliverable_key: deliverable.deliverable_key || null,
      channel_key: deliverable.channel_key || null,
      deliverable_type: deliverable.deliverable_type || null,
      deliverable_status: deliverable.deliverable_status || null,
      approval_status: candidate.approval_status,
      aspect_ratio: deliverable.aspect_ratio || null,
      target_duration_seconds: number(deliverable.target_duration_seconds),
      referenced_asset_count: referencedKeys.length,
      selected_referenced_asset_count: referencedMedia.length,
      active_render_job_count: activeRenderJobs.length,
    },
    blockers,
    warnings,
    safety: safetyBoundary(),
  };
}

export async function requireContentRenderReadiness(db, projectId, deliverableId, overrides = {}) {
  const result = await assessContentRenderReadiness(db, projectId, deliverableId, overrides);
  if (!result.ready) {
    const error = new Error(result.blockers.map((item) => item.message).join(' '));
    error.code = 'CONTENT_RENDER_READINESS_BLOCKED';
    error.readiness = result;
    throw error;
  }
  return result;
}

function safetyBoundary() {
  return {
    read_only_readiness: true,
    render_job_creation: false,
    renderer_execution: false,
    provider_execution: false,
    publication: false,
    social_queue_mutation: false,
    r2_mutation: false,
    schema_mutation: false,
    production_mutation: false,
  };
}
