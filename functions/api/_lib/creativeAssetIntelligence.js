// Build 201 — Creative Asset Intelligence Platform (CAIP) shared helpers.
// CAIP extends Content Automation Studio without becoming another file store.
// It records canonical references, deterministic metadata evidence, review decisions,
// and narrative scaffolding. It never copies, moves, deletes, publishes, or grants
// public rights to source media.

export const CAIP_BUILD = 'Build 201';
export const CAIP_ANALYSIS_KEY = 'metadata_heuristic_v1';

function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max).trim() : clean;
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function numeric(value) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : 0; }
function integer(value) { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; }
function safeJson(value, fallback = {}) { try { return JSON.parse(String(value || '')); } catch { return fallback; } }
function arrayJson(value, fallback = []) { const parsed = safeJson(value, fallback); return Array.isArray(parsed) ? parsed : fallback; }
function clip(value, max) { const clean = text(value).replace(/\s+/g, ' '); return !clean || clean.length <= max ? clean : `${clean.slice(0, Math.max(1, max - 1)).trim()}…`; }
function nowKey() { return new Date().toISOString().replace(/[-:.TZ]/g, ''); }
function stableHash(value) { let hash = 2166136261; for (const char of String(value || '')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); }
function slug(value) { return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 88) || 'creative-project'; }
function urlFilename(value, fallback) { const source = text(value); if (!source) return fallback; try { return text(new URL(source).pathname.split('/').pop()) || fallback; } catch { return text(source.split('/').pop()) || fallback; } }
function normalizeRights(value) { const key = text(value).toLowerCase(); return ['needs_review', 'public_allowed', 'internal_only', 'blocked'].includes(key) ? key : 'needs_review'; }
function normalizeAssetStatus(value) { const key = text(value).toLowerCase(); return ['active', 'held', 'missing', 'archived'].includes(key) ? key : 'active'; }
function normalizeProjectStatus(value) { const key = text(value).toLowerCase(); return ['intake', 'active', 'review', 'approved', 'archived'].includes(key) ? key : 'intake'; }
function normalizeSegmentStatus(value) { const key = text(value).toLowerCase(); return ['draft', 'review', 'approved', 'rejected'].includes(key) ? key : 'draft'; }
function normalizeVisibility(value) { const key = text(value).toLowerCase(); return ['internal', 'public_candidate'].includes(key) ? key : 'internal'; }
function normalizeEvidenceVerification(value) { const key = text(value).toLowerCase(); return ['unverified', 'source_record', 'confirmed', 'rejected'].includes(key) ? key : 'source_record'; }
function normalizeEvidenceReview(value) { const key = text(value).toLowerCase(); return ['needs_review', 'approved', 'rejected'].includes(key) ? key : 'needs_review'; }
function rightsFromSource(value) { const key = normalizeRights(value); return key === 'public_allowed' ? 'needs_review' : key; }
function hasPublicAuthority(sourceSafety) { return normalizeRights(sourceSafety) === 'public_allowed'; }

function analysisFromAsset(asset) {
  const metadata = safeJson(asset.source_metadata_json, {});
  const score = Math.max(0, Math.min(100, Math.round(numeric(metadata.selection_score || metadata.merchandising_score || asset.selection_score || 0))));
  const width = numeric(metadata.source_width_px || metadata.width_px);
  const height = numeric(metadata.source_height_px || metadata.height_px);
  const role = text(metadata.image_role || metadata.variant_role || '').toLowerCase();
  const video = text(asset.media_type).toLowerCase() === 'video';
  const selected = numeric(asset.is_source_selected) === 1;
  const featured = numeric(asset.is_source_featured) === 1;
  const sourceSafety = normalizeRights(asset.source_safety_status);
  let technical = 30 + Math.round(score * 0.45);
  if (width >= 1200 || height >= 1200) technical += 14;
  else if (width >= 800 || height >= 800) technical += 7;
  if (video) technical += 5;
  let story = 32 + (selected ? 15 : 0) + (featured ? 16 : 0) + (video ? 8 : 0);
  if (['hero', 'hero_front', 'finished_product', 'before_after', 'process', 'detail'].includes(role)) story += 12;
  let reuse = 25 + (selected ? 15 : 0) + (featured ? 12 : 0);
  if (sourceSafety === 'public_allowed') reuse += 30;
  if (normalizeRights(asset.rights_status) === 'blocked') reuse = 0;
  if (normalizeRights(asset.rights_status) === 'internal_only') reuse = Math.min(reuse, 30);
  technical = Math.max(1, Math.min(100, technical));
  story = Math.max(1, Math.min(100, story));
  reuse = Math.max(0, Math.min(100, reuse));
  const total = Math.round(technical * 0.42 + story * 0.38 + reuse * 0.20);
  const confidence = Math.min(90, 45 + (score ? 15 : 0) + (width || height ? 12 : 0) + (role ? 8 : 0) + (asset.source_url ? 8 : 0));
  const reasons = [];
  if (featured) reasons.push('featured source reference');
  if (selected) reasons.push('selected in Content Studio');
  if (score) reasons.push(`recorded source score ${score}`);
  if (role) reasons.push(`recorded role: ${role}`);
  if (width || height) reasons.push(`recorded dimensions: ${width || '?'}×${height || '?'}`);
  if (video) reasons.push('video source');
  if (!reasons.length) reasons.push('source order and available metadata only');
  return { technical, story, reuse, total, confidence, reasons, requiresReview: 1 };
}

async function writeEvent(db, projectId, type, actorUserId, details = {}) {
  await db.prepare(`INSERT INTO creative_project_events (creative_project_id, event_type, actor_user_id, details_json, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(integer(projectId), text(type, 120), integer(actorUserId) || null, JSON.stringify(details || {})).run().catch(() => null);
}

async function latestContentContext(db, contentProjectId) {
  const project = await db.prepare(`
    SELECT cp.*, p.name AS product_name, p.slug AS product_slug, p.product_category, p.short_description,
      p.description AS product_description, p.featured_image_url, p.merchandise_origin, p.condition_summary,
      p.era_label, p.external_listing_url
    FROM content_projects cp
    LEFT JOIN products p ON p.product_id=cp.product_id
    WHERE cp.content_project_id=? LIMIT 1
  `).bind(integer(contentProjectId)).first();
  if (!project) throw new Error('Content Studio project not found. Create the approved-product content package first.');
  const media = rows(await db.prepare(`SELECT * FROM content_project_media WHERE content_project_id=? ORDER BY is_featured DESC, is_selected DESC, selection_score DESC, sort_order ASC, content_project_media_id ASC`).bind(project.content_project_id).all());
  return { project, media };
}

function sourceAssetKey(media) {
  return text(media.archive_key) || (integer(media.content_project_media_id) ? `content-media-${integer(media.content_project_media_id)}` : `source-${stableHash(`${media.source_url || ''}:${media.sort_order || 0}`)}`);
}

function sourceFingerprint(media) {
  return stableHash([media.source_url, media.media_asset_id, media.product_image_id, media.mime_type, media.original_filename].join('|'));
}

function logicalPath(projectKey, media, index) {
  const type = text(media.media_type).toLowerCase() === 'video' ? 'videos' : 'images';
  const filename = urlFilename(media.source_url, `${type.slice(0, -1)}-${index + 1}`).replace(/[^A-Za-z0-9._-]+/g, '-');
  return `caip/${projectKey}/references/${type}/${String(index + 1).padStart(3, '0')}-${filename}`;
}

async function ensureProject(db, content, actorUserId) {
  const source = content.project;
  const key = `caip-${source.content_project_key || `content-${source.content_project_id}`}`;
  const title = `${text(source.product_name || source.project_title, 160) || 'Creative project'} intelligence record`;
  const snapshot = {
    content_project_id: source.content_project_id,
    content_project_key: source.content_project_key,
    product_id: source.product_id || null,
    source_type: source.source_type,
    source_id: source.source_id,
    project_title: source.project_title,
    factual_summary: source.factual_summary,
    product_name: source.product_name,
    product_slug: source.product_slug,
    product_category: source.product_category,
    source_media_count: content.media.length,
    synced_at: new Date().toISOString(),
    build: CAIP_BUILD
  };
  const policy = {
    reference_only_sources: true,
    no_auto_publish: true,
    no_implicit_rights: true,
    factual_evidence_required: true,
    human_review_required: true,
    current_implementation: 'metadata_heuristic_v1',
    future_provider_execution_requires_explicit_configuration: true
  };
  await db.prepare(`
    INSERT INTO creative_projects (
      creative_project_key, content_project_id, source_type, source_id, product_id, project_title,
      project_status, governance_status, lifecycle_stage, source_snapshot_json, policy_profile_json,
      created_by_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'intake', 'needs_review', 'intake', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(content_project_id) DO UPDATE SET
      creative_project_key=excluded.creative_project_key,
      source_type=excluded.source_type, source_id=excluded.source_id, product_id=excluded.product_id,
      project_title=excluded.project_title, source_snapshot_json=excluded.source_snapshot_json,
      policy_profile_json=excluded.policy_profile_json, updated_at=CURRENT_TIMESTAMP
  `).bind(key, source.content_project_id, text(source.source_type) || 'product', text(source.source_id), integer(source.product_id) || null,
    title, JSON.stringify(snapshot), JSON.stringify(policy), integer(actorUserId) || null).run();
  return db.prepare(`SELECT * FROM creative_projects WHERE content_project_id=? LIMIT 1`).bind(source.content_project_id).first();
}

async function syncAssets(db, project, content) {
  let count = 0;
  for (let index = 0; index < content.media.length; index += 1) {
    const source = content.media[index];
    const metadata = safeJson(source.source_metadata_json, {});
    const key = sourceAssetKey(source);
    const fingerprint = sourceFingerprint(source);
    const sourceSafety = normalizeRights(source.safety_status);
    const initialRights = rightsFromSource(sourceSafety);
    const assetStatus = text(source.source_url) ? 'active' : 'missing';
    const packedMetadata = {
      ...metadata,
      selection_score: numeric(source.selection_score),
      selection_reason: text(source.selection_reason, 800),
      archive_key: text(source.archive_key),
      archive_path: text(source.archive_path),
      content_project_media_id: integer(source.content_project_media_id) || null,
      synced_by: CAIP_BUILD
    };
    await db.prepare(`
      INSERT INTO creative_assets (
        creative_project_id, content_project_media_id, media_asset_id, product_image_id, asset_key, source_url,
        source_fingerprint, logical_archive_path, source_safety_status, rights_status, asset_status,
        media_type, original_filename, mime_type, sort_order, is_source_selected, is_source_featured,
        source_metadata_json, first_seen_at, source_refreshed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(creative_project_id, asset_key) DO UPDATE SET
        content_project_media_id=excluded.content_project_media_id, media_asset_id=excluded.media_asset_id,
        product_image_id=excluded.product_image_id, source_url=excluded.source_url,
        source_fingerprint=excluded.source_fingerprint, logical_archive_path=excluded.logical_archive_path,
        source_safety_status=excluded.source_safety_status,
        rights_status=CASE
          WHEN excluded.source_safety_status='blocked' THEN 'blocked'
          WHEN creative_assets.rights_status='blocked' THEN 'blocked'
          WHEN excluded.source_safety_status <> 'public_allowed' AND creative_assets.rights_status='public_allowed' THEN 'needs_review'
          WHEN creative_assets.rights_status IN ('internal_only','public_allowed') THEN creative_assets.rights_status
          ELSE excluded.rights_status END,
        asset_status=CASE WHEN creative_assets.asset_status='archived' THEN 'archived' ELSE excluded.asset_status END,
        media_type=excluded.media_type, original_filename=excluded.original_filename, mime_type=excluded.mime_type,
        sort_order=excluded.sort_order, is_source_selected=excluded.is_source_selected,
        is_source_featured=excluded.is_source_featured, source_metadata_json=excluded.source_metadata_json,
        source_refreshed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
    `).bind(
      project.creative_project_id, integer(source.content_project_media_id) || null, integer(source.media_asset_id) || null,
      integer(source.product_image_id) || null, key, text(source.source_url) || null, fingerprint,
      logicalPath(project.creative_project_key, source, index), sourceSafety, initialRights, assetStatus,
      text(source.media_type).toLowerCase() === 'video' ? 'video' : 'image',
      text(source.original_filename, 500) || urlFilename(source.source_url, `${source.media_type || 'asset'}-${index + 1}`),
      text(source.mime_type, 180) || null, numeric(source.sort_order), numeric(source.is_selected) === 1 ? 1 : 0,
      numeric(source.is_featured) === 1 ? 1 : 0, JSON.stringify(packedMetadata)
    ).run();
    count += 1;
  }
  return count;
}

async function syncAnalyses(db, project) {
  const assets = rows(await db.prepare(`SELECT * FROM creative_assets WHERE creative_project_id=? ORDER BY is_source_featured DESC, is_source_selected DESC, sort_order ASC, creative_asset_id`).bind(project.creative_project_id).all());
  for (const asset of assets) {
    const output = analysisFromAsset(asset);
    await db.prepare(`
      INSERT INTO creative_asset_analyses (
        creative_asset_id, analysis_key, analysis_provider, provider_version, analysis_status,
        technical_score, story_score, reuse_score, total_score, confidence_score, requires_human_review,
        evidence_json, source_snapshot_fingerprint, completed_at, created_at, updated_at
      ) VALUES (?, ?, 'metadata_heuristic', 'v1', 'complete', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(creative_asset_id, analysis_key) DO UPDATE SET
        technical_score=excluded.technical_score, story_score=excluded.story_score, reuse_score=excluded.reuse_score,
        total_score=excluded.total_score, confidence_score=excluded.confidence_score,
        requires_human_review=excluded.requires_human_review, evidence_json=excluded.evidence_json,
        source_snapshot_fingerprint=excluded.source_snapshot_fingerprint, completed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
    `).bind(asset.creative_asset_id, CAIP_ANALYSIS_KEY, output.technical, output.story, output.reuse, output.total,
      output.confidence, output.requiresReview, JSON.stringify({ reasons: output.reasons, score_type: 'deterministic_review_aid', no_content_inference: true }), asset.source_fingerprint).run();
  }
  return assets;
}

async function syncRecommendations(db, project, assets) {
  const ranked = rows(await db.prepare(`
    SELECT ca.*, COALESCE(caa.total_score,0) AS total_score, COALESCE(caa.story_score,0) AS story_score,
      COALESCE(caa.technical_score,0) AS technical_score
    FROM creative_assets ca
    LEFT JOIN creative_asset_analyses caa ON caa.creative_asset_id=ca.creative_asset_id AND caa.analysis_key=?
    WHERE ca.creative_project_id=? AND ca.asset_status='active' AND ca.rights_status <> 'blocked'
    ORDER BY ca.is_source_featured DESC, ca.is_source_selected DESC, COALESCE(caa.total_score,0) DESC, ca.sort_order ASC
  `).bind(CAIP_ANALYSIS_KEY, project.creative_project_id).all());
  const candidates = ranked.length ? ranked : assets;
  const plans = [];
  const firstImage = candidates.find((item) => text(item.media_type) !== 'video') || candidates[0];
  if (firstImage) {
    plans.push({ key: 'website-hero', asset: firstImage, destination: 'website', role: 'hero_image', score: numeric(firstImage.total_score) || 50 });
    plans.push({ key: 'youtube-thumbnail', asset: firstImage, destination: 'youtube', role: 'thumbnail_candidate', score: numeric(firstImage.total_score) || 50 });
  }
  candidates.filter((item) => text(item.media_type) !== 'video').slice(0, 8).forEach((asset, index) => plans.push({ key: `gallery-${index + 1}`, asset, destination: 'website_gallery', role: index === 0 ? 'lead_gallery' : 'gallery_detail', score: numeric(asset.total_score) || 45 }));
  candidates.filter((item) => text(item.media_type) === 'video').slice(0, 4).forEach((asset, index) => plans.push({ key: `shorts-video-${index + 1}`, asset, destination: 'short_video', role: index === 0 ? 'opening_clip_candidate' : 'supporting_clip_candidate', score: numeric(asset.total_score) || 45 }));
  for (const plan of plans) {
    const sourceAllowed = hasPublicAuthority(plan.asset.source_safety_status);
    await db.prepare(`
      INSERT INTO creative_asset_recommendations (
        creative_project_id, creative_asset_id, recommendation_key, destination_key, intended_role,
        fit_score, rationale_json, recommendation_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'needs_review', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(creative_project_id, recommendation_key) DO UPDATE SET
        creative_asset_id=excluded.creative_asset_id, destination_key=excluded.destination_key,
        intended_role=excluded.intended_role, fit_score=excluded.fit_score, rationale_json=excluded.rationale_json,
        recommendation_status=CASE WHEN creative_asset_recommendations.recommendation_status IN ('accepted','rejected') THEN creative_asset_recommendations.recommendation_status ELSE 'needs_review' END,
        updated_at=CURRENT_TIMESTAMP
    `).bind(project.creative_project_id, plan.asset.creative_asset_id, plan.key, plan.destination, plan.role,
      Math.max(1, Math.min(100, Math.round(plan.score))), JSON.stringify({
        score_type: 'deterministic_metadata_review_aid', source_allowed_for_public_review: sourceAllowed,
        source_rights_status: plan.asset.rights_status, source_safety_status: plan.asset.source_safety_status,
        caution: sourceAllowed ? 'Still requires destination-specific owner review.' : 'Not a public-use recommendation until source consent is cleared.'
      })).run();
  }
  return plans.length;
}

async function upsertEvidence(db, projectId, evidenceKey, type, sourceReference, claim, evidenceJson = {}) {
  await db.prepare(`
    INSERT INTO creative_story_evidence (
      creative_project_id, evidence_key, evidence_type, source_reference, claim_text,
      visibility, verification_status, review_status, evidence_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'internal', 'source_record', 'needs_review', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(creative_project_id, evidence_key) DO UPDATE SET
      evidence_type=excluded.evidence_type, source_reference=excluded.source_reference,
      claim_text=CASE WHEN creative_story_evidence.copy_locked=1 THEN creative_story_evidence.claim_text ELSE excluded.claim_text END,
      evidence_json=excluded.evidence_json, updated_at=CURRENT_TIMESTAMP
  `).bind(projectId, evidenceKey, type, sourceReference, clip(claim, 4000) || 'No source text recorded.', JSON.stringify(evidenceJson || {})).run();
}

async function syncEvidenceAndSegments(db, project, content) {
  const cp = content.project;
  const name = text(cp.product_name || cp.project_title, 180) || 'This creative project';
  const category = text(cp.product_category, 160);
  const description = text(cp.short_description || cp.product_description || cp.factual_summary, 3000);
  const summary = text(cp.factual_summary || description, 3000);
  const origin = text(cp.merchandise_origin, 120);
  const condition = text(cp.condition_summary || cp.era_label, 500);
  await upsertEvidence(db, project.creative_project_id, 'product-name', 'product_fact', `products:${cp.product_id || cp.source_id}`, name, { field: 'name' });
  if (category) await upsertEvidence(db, project.creative_project_id, 'product-category', 'product_fact', `products:${cp.product_id || cp.source_id}`, category, { field: 'product_category' });
  if (description) await upsertEvidence(db, project.creative_project_id, 'product-description', 'product_fact', `products:${cp.product_id || cp.source_id}`, description, { field: 'short_description_or_description' });
  if (summary) await upsertEvidence(db, project.creative_project_id, 'content-summary', 'content_project_fact', `content_projects:${cp.content_project_id}`, summary, { field: 'factual_summary' });
  if (origin) await upsertEvidence(db, project.creative_project_id, 'merchandise-origin', 'product_fact', `products:${cp.product_id || cp.source_id}`, origin, { field: 'merchandise_origin' });
  if (condition) await upsertEvidence(db, project.creative_project_id, 'condition-or-era', 'product_fact', `products:${cp.product_id || cp.source_id}`, condition, { field: 'condition_summary_or_era_label' });
  const segments = [
    { key: 'hook', type: 'hook', order: 10, title: 'Opening finished view', body: `Open on the finished view of ${name}. Use only source media that has been selected and reviewed.`, evidence: ['product-name'] },
    { key: 'context', type: 'context', order: 20, title: 'Project context', body: `${name}${category ? ` is recorded in the catalog as ${category}` : ''}. ${clip(summary || description || 'Add a verified project summary before public use.', 700)}`, evidence: ['product-name', 'product-category', 'content-summary'] },
    { key: 'details', type: 'detail', order: 30, title: 'Finished details', body: `Show details that are visibly supported by the selected media and source record. ${description ? `Catalog description: ${clip(description, 650)}` : 'Add precise details from the finished piece before approval.'}`, evidence: ['product-description', 'content-summary'] },
    { key: 'next-step', type: 'call_to_action', order: 40, title: 'Truthful next step', body: 'End with a verified action only: view the live listing, request a custom project, or follow the workshop. Do not promise availability, timing, price, shipping, or a result not shown in the source record.', evidence: ['product-name'] }
  ];
  for (const segment of segments) {
    await db.prepare(`
      INSERT INTO creative_story_segments (
        creative_project_id, segment_key, segment_type, sort_order, title, narrative_text,
        evidence_keys_json, segment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(creative_project_id, segment_key) DO UPDATE SET
        segment_type=excluded.segment_type, sort_order=excluded.sort_order,
        title=CASE WHEN creative_story_segments.copy_locked=1 THEN creative_story_segments.title ELSE excluded.title END,
        narrative_text=CASE WHEN creative_story_segments.copy_locked=1 THEN creative_story_segments.narrative_text ELSE excluded.narrative_text END,
        evidence_keys_json=excluded.evidence_keys_json, updated_at=CURRENT_TIMESTAMP
    `).bind(project.creative_project_id, segment.key, segment.type, segment.order, segment.title, segment.body, JSON.stringify(segment.evidence)).run();
  }
}

async function updatePolicies(db, project) {
  const assets = rows(await db.prepare(`SELECT * FROM creative_assets WHERE creative_project_id=?`).bind(project.creative_project_id).all());
  const evidence = rows(await db.prepare(`SELECT * FROM creative_story_evidence WHERE creative_project_id=?`).bind(project.creative_project_id).all());
  const active = assets.filter((item) => item.asset_status === 'active');
  const publicAllowed = assets.filter((item) => item.rights_status === 'public_allowed' && item.asset_status === 'active');
  const sourceBlocked = assets.filter((item) => item.source_safety_status === 'blocked');
  const policyRows = [
    {
      key: 'source_reference_integrity',
      status: active.length ? 'pass' : 'blocked', severity: active.length ? 'info' : 'blocker',
      rationale: active.length ? `${active.length} active reference-only asset${active.length === 1 ? '' : 's'} are recorded.` : 'No active source references are available for this project.',
      evidence: { active_assets: active.length, no_source_media_mutation: true }
    },
    {
      key: 'rights_and_consent',
      status: publicAllowed.length ? 'review' : 'needs_review', severity: sourceBlocked.length ? 'warning' : 'info',
      rationale: publicAllowed.length ? `${publicAllowed.length} asset${publicAllowed.length === 1 ? '' : 's'} may be reviewed for public destinations; owner review remains required.` : 'No asset has both source public clearance and CAIP public approval.',
      evidence: { public_allowed_assets: publicAllowed.length, source_blocked_assets: sourceBlocked.length, no_implicit_rights: true }
    },
    {
      key: 'story_claim_provenance',
      status: evidence.length >= 2 ? 'review' : 'needs_review', severity: evidence.length >= 2 ? 'info' : 'warning',
      rationale: evidence.length >= 2 ? `${evidence.length} source-backed evidence record${evidence.length === 1 ? '' : 's'} are available for editorial review.` : 'Add or verify source-backed evidence before using CAIP story text publicly.',
      evidence: { evidence_count: evidence.length, requires_human_claim_review: true }
    },
    {
      key: 'public_search_readiness',
      status: 'needs_review', severity: 'info',
      rationale: 'CAIP prepares evidence and candidates only. Public pages still require visible factual copy, descriptive alt text, crawlable final media URLs, and release-board approval.',
      evidence: { requires_content_release_board: true, requires_final_public_media_validation: true }
    }
  ];
  for (const item of policyRows) {
    await db.prepare(`
      INSERT INTO creative_policy_decisions (
        creative_project_id, policy_key, decision_status, severity, rationale, evidence_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(creative_project_id, policy_key) DO UPDATE SET
        decision_status=excluded.decision_status, severity=excluded.severity, rationale=excluded.rationale,
        evidence_json=excluded.evidence_json, updated_at=CURRENT_TIMESTAMP
    `).bind(project.creative_project_id, item.key, item.status, item.severity, item.rationale, JSON.stringify(item.evidence)).run();
  }
  const governance = active.length && evidence.length >= 2 ? 'review_ready' : 'needs_review';
  await db.prepare(`UPDATE creative_projects SET governance_status=?, lifecycle_stage=?, updated_at=CURRENT_TIMESTAMP WHERE creative_project_id=?`).bind(
    governance, governance === 'review_ready' ? 'analysis_complete' : 'intake', project.creative_project_id
  ).run();
}

export async function ensureCreativeAssetIntelligenceSchema(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS creative_projects (creative_project_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_key TEXT NOT NULL UNIQUE, content_project_id INTEGER UNIQUE, source_type TEXT NOT NULL, source_id TEXT NOT NULL, product_id INTEGER, project_title TEXT NOT NULL, project_status TEXT NOT NULL DEFAULT 'intake', governance_status TEXT NOT NULL DEFAULT 'needs_review', lifecycle_stage TEXT NOT NULL DEFAULT 'intake', source_snapshot_json TEXT NOT NULL DEFAULT '{}', policy_profile_json TEXT NOT NULL DEFAULT '{}', latest_manifest_version INTEGER NOT NULL DEFAULT 1, approved_by_user_id INTEGER, approved_at TEXT, created_by_user_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(source_type, source_id))`,
    `CREATE TABLE IF NOT EXISTS creative_assets (creative_asset_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_id INTEGER NOT NULL, content_project_media_id INTEGER, media_asset_id INTEGER, product_image_id INTEGER, asset_key TEXT NOT NULL, source_url TEXT, source_fingerprint TEXT NOT NULL, logical_archive_path TEXT, source_safety_status TEXT NOT NULL DEFAULT 'needs_review', rights_status TEXT NOT NULL DEFAULT 'needs_review', asset_status TEXT NOT NULL DEFAULT 'active', media_type TEXT NOT NULL DEFAULT 'image', original_filename TEXT, mime_type TEXT, sort_order INTEGER NOT NULL DEFAULT 0, is_source_selected INTEGER NOT NULL DEFAULT 0, is_source_featured INTEGER NOT NULL DEFAULT 0, manual_tags_json TEXT NOT NULL DEFAULT '[]', manual_caption TEXT, source_metadata_json TEXT NOT NULL DEFAULT '{}', first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, source_refreshed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(creative_project_id, asset_key))`,
    `CREATE TABLE IF NOT EXISTS creative_asset_analyses (creative_asset_analysis_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_asset_id INTEGER NOT NULL, analysis_key TEXT NOT NULL, analysis_provider TEXT NOT NULL DEFAULT 'metadata_heuristic', provider_version TEXT NOT NULL DEFAULT 'v1', analysis_status TEXT NOT NULL DEFAULT 'complete', technical_score INTEGER NOT NULL DEFAULT 0, story_score INTEGER NOT NULL DEFAULT 0, reuse_score INTEGER NOT NULL DEFAULT 0, total_score INTEGER NOT NULL DEFAULT 0, confidence_score INTEGER NOT NULL DEFAULT 0, requires_human_review INTEGER NOT NULL DEFAULT 1, evidence_json TEXT NOT NULL DEFAULT '{}', source_snapshot_fingerprint TEXT, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(creative_asset_id, analysis_key))`,
    `CREATE TABLE IF NOT EXISTS creative_asset_recommendations (creative_asset_recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_id INTEGER NOT NULL, creative_asset_id INTEGER, recommendation_key TEXT NOT NULL, destination_key TEXT NOT NULL, intended_role TEXT NOT NULL, fit_score INTEGER NOT NULL DEFAULT 0, rationale_json TEXT NOT NULL DEFAULT '{}', recommendation_status TEXT NOT NULL DEFAULT 'needs_review', reviewed_by_user_id INTEGER, reviewed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(creative_project_id, recommendation_key))`,
    `CREATE TABLE IF NOT EXISTS creative_story_evidence (creative_story_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_id INTEGER NOT NULL, creative_asset_id INTEGER, evidence_key TEXT NOT NULL, evidence_type TEXT NOT NULL DEFAULT 'source_fact', source_reference TEXT, claim_text TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'internal', verification_status TEXT NOT NULL DEFAULT 'source_record', review_status TEXT NOT NULL DEFAULT 'needs_review', evidence_json TEXT NOT NULL DEFAULT '{}', copy_locked INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(creative_project_id, evidence_key))`,
    `CREATE TABLE IF NOT EXISTS creative_story_segments (creative_story_segment_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_id INTEGER NOT NULL, segment_key TEXT NOT NULL, segment_type TEXT NOT NULL DEFAULT 'context', sort_order INTEGER NOT NULL DEFAULT 0, title TEXT NOT NULL, narrative_text TEXT NOT NULL, evidence_keys_json TEXT NOT NULL DEFAULT '[]', segment_status TEXT NOT NULL DEFAULT 'draft', copy_locked INTEGER NOT NULL DEFAULT 0, reviewer_notes TEXT, approved_by_user_id INTEGER, approved_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(creative_project_id, segment_key))`,
    `CREATE TABLE IF NOT EXISTS creative_policy_decisions (creative_policy_decision_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_id INTEGER NOT NULL, policy_key TEXT NOT NULL, decision_status TEXT NOT NULL DEFAULT 'needs_review', severity TEXT NOT NULL DEFAULT 'info', rationale TEXT, evidence_json TEXT NOT NULL DEFAULT '{}', decided_by_user_id INTEGER, decided_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(creative_project_id, policy_key))`,
    `CREATE TABLE IF NOT EXISTS creative_intelligence_runs (creative_intelligence_run_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_id INTEGER NOT NULL, run_key TEXT NOT NULL UNIQUE, run_type TEXT NOT NULL DEFAULT 'ingestion_sync', provider_key TEXT NOT NULL DEFAULT 'local_metadata_v1', run_status TEXT NOT NULL DEFAULT 'completed', input_summary_json TEXT NOT NULL DEFAULT '{}', output_summary_json TEXT NOT NULL DEFAULT '{}', error_text TEXT, requested_by_user_id INTEGER, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS creative_project_events (creative_project_event_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_project_id INTEGER NOT NULL, event_type TEXT NOT NULL, actor_user_id INTEGER, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_projects_content_project ON creative_projects(content_project_id, project_status, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_assets_project ON creative_assets(creative_project_id, rights_status, asset_status, sort_order, creative_asset_id)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_asset_analyses_asset ON creative_asset_analyses(creative_asset_id, total_score DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_recommendations_project ON creative_asset_recommendations(creative_project_id, destination_key, recommendation_status, fit_score DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_evidence_project ON creative_story_evidence(creative_project_id, review_status, verification_status, creative_story_evidence_id)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_segments_project ON creative_story_segments(creative_project_id, sort_order, creative_story_segment_id)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_policy_project ON creative_policy_decisions(creative_project_id, decision_status, severity)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_runs_project ON creative_intelligence_runs(creative_project_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_creative_events_project ON creative_project_events(creative_project_id, created_at DESC)`
  ];
  for (const statement of statements) await db.prepare(statement).run();
}

export async function syncCreativeProjectFromContentProject(db, contentProjectId, actorUserId = null, options = {}) {
  await ensureCreativeAssetIntelligenceSchema(db);
  const content = await latestContentContext(db, contentProjectId);
  const project = await ensureProject(db, content, actorUserId);
  const assetCount = await syncAssets(db, project, content);
  const assets = await syncAnalyses(db, project);
  const recommendationCount = await syncRecommendations(db, project, assets);
  await syncEvidenceAndSegments(db, project, content);
  await updatePolicies(db, project);
  const refreshed = await db.prepare(`SELECT * FROM creative_projects WHERE creative_project_id=? LIMIT 1`).bind(project.creative_project_id).first();
  const runKey = `caip-sync-${project.creative_project_id}-${nowKey()}-${stableHash(`${assetCount}:${recommendationCount}:${options.trigger || 'manual'}`)}`;
  await db.prepare(`INSERT INTO creative_intelligence_runs (creative_project_id, run_key, run_type, provider_key, run_status, input_summary_json, output_summary_json, requested_by_user_id, completed_at, created_at)
    VALUES (?, ?, 'ingestion_sync', 'local_metadata_v1', 'completed', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    project.creative_project_id, runKey,
    JSON.stringify({ content_project_id: content.project.content_project_id, source_media_count: content.media.length, trigger: options.trigger || 'manual' }),
    JSON.stringify({ asset_count: assetCount, recommendation_count: recommendationCount, evidence_mode: 'source_record', analysis: CAIP_ANALYSIS_KEY }),
    integer(actorUserId) || null
  ).run();
  await writeEvent(db, project.creative_project_id, 'caip_project_synchronized', actorUserId, { content_project_id: content.project.content_project_id, asset_count: assetCount, recommendation_count: recommendationCount, trigger: options.trigger || 'manual', reference_only: true });
  return { project: refreshed, asset_count: assetCount, recommendation_count: recommendationCount, content_project_id: content.project.content_project_id };
}

export async function listCreativeAssetProjects(db) {
  await ensureCreativeAssetIntelligenceSchema(db);
  const projects = rows(await db.prepare(`
    SELECT cp.*, csp.project_title AS content_project_title, csp.content_project_key,
      p.name AS product_name, p.slug AS product_slug,
      (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=cp.creative_project_id) AS asset_count,
      (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=cp.creative_project_id AND ca.rights_status='public_allowed') AS public_allowed_asset_count,
      (SELECT COUNT(*) FROM creative_story_evidence ce WHERE ce.creative_project_id=cp.creative_project_id) AS evidence_count,
      (SELECT COUNT(*) FROM creative_story_segments cs WHERE cs.creative_project_id=cp.creative_project_id AND cs.segment_status='approved') AS approved_segment_count
    FROM creative_projects cp
    LEFT JOIN content_projects csp ON csp.content_project_id=cp.content_project_id
    LEFT JOIN products p ON p.product_id=cp.product_id
    ORDER BY cp.updated_at DESC, cp.creative_project_id DESC LIMIT 100
  `).all());
  const available = rows(await db.prepare(`
    SELECT csp.content_project_id, csp.content_project_key, csp.project_title, csp.product_id, csp.updated_at,
      p.name AS product_name, p.review_status AS product_review_status,
      caip.creative_project_id AS creative_project_id
    FROM content_projects csp
    LEFT JOIN products p ON p.product_id=csp.product_id
    LEFT JOIN creative_projects caip ON caip.content_project_id=csp.content_project_id
    ORDER BY csp.updated_at DESC, csp.content_project_id DESC LIMIT 120
  `).all());
  return { projects, content_projects: available };
}

export async function getCreativeProjectDetail(db, creativeProjectId) {
  await ensureCreativeAssetIntelligenceSchema(db);
  const project = await db.prepare(`
    SELECT cp.*, csp.content_project_key, csp.project_title AS content_project_title, csp.factual_summary,
      p.name AS product_name, p.slug AS product_slug, p.featured_image_url, p.product_category
    FROM creative_projects cp
    LEFT JOIN content_projects csp ON csp.content_project_id=cp.content_project_id
    LEFT JOIN products p ON p.product_id=cp.product_id
    WHERE cp.creative_project_id=? LIMIT 1
  `).bind(integer(creativeProjectId)).first();
  if (!project) return null;
  const [assets, recommendations, evidence, segments, policies, runs, events] = await Promise.all([
    db.prepare(`SELECT ca.*, aa.technical_score, aa.story_score, aa.reuse_score, aa.total_score, aa.confidence_score, aa.evidence_json AS analysis_evidence_json FROM creative_assets ca LEFT JOIN creative_asset_analyses aa ON aa.creative_asset_id=ca.creative_asset_id AND aa.analysis_key=? WHERE ca.creative_project_id=? ORDER BY ca.is_source_featured DESC, ca.is_source_selected DESC, COALESCE(aa.total_score,0) DESC, ca.sort_order ASC, ca.creative_asset_id`).bind(CAIP_ANALYSIS_KEY, project.creative_project_id).all(),
    db.prepare(`SELECT car.*, ca.asset_key, ca.source_url, ca.media_type, ca.rights_status FROM creative_asset_recommendations car LEFT JOIN creative_assets ca ON ca.creative_asset_id=car.creative_asset_id WHERE car.creative_project_id=? ORDER BY car.destination_key, car.fit_score DESC, car.creative_asset_recommendation_id`).bind(project.creative_project_id).all(),
    db.prepare(`SELECT * FROM creative_story_evidence WHERE creative_project_id=? ORDER BY creative_story_evidence_id`).bind(project.creative_project_id).all(),
    db.prepare(`SELECT * FROM creative_story_segments WHERE creative_project_id=? ORDER BY sort_order, creative_story_segment_id`).bind(project.creative_project_id).all(),
    db.prepare(`SELECT * FROM creative_policy_decisions WHERE creative_project_id=? ORDER BY CASE severity WHEN 'blocker' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, policy_key`).bind(project.creative_project_id).all(),
    db.prepare(`SELECT * FROM creative_intelligence_runs WHERE creative_project_id=? ORDER BY creative_intelligence_run_id DESC LIMIT 12`).bind(project.creative_project_id).all(),
    db.prepare(`SELECT * FROM creative_project_events WHERE creative_project_id=? ORDER BY creative_project_event_id DESC LIMIT 36`).bind(project.creative_project_id).all()
  ]);
  const assetRows = rows(assets);
  const counts = {
    assets: assetRows.length,
    public_allowed: assetRows.filter((item) => item.rights_status === 'public_allowed').length,
    needs_review: assetRows.filter((item) => item.rights_status === 'needs_review').length,
    blocked: assetRows.filter((item) => item.rights_status === 'blocked').length,
    evidence: rows(evidence).length,
    approved_segments: rows(segments).filter((item) => item.segment_status === 'approved').length
  };
  return { project, assets: assetRows, recommendations: rows(recommendations), evidence: rows(evidence), segments: rows(segments), policies: rows(policies), runs: rows(runs), events: rows(events), counts };
}

export async function updateCreativeAsset(db, creativeProjectId, assetId, patch, actorUserId) {
  const asset = await db.prepare(`SELECT * FROM creative_assets WHERE creative_project_id=? AND creative_asset_id=? LIMIT 1`).bind(integer(creativeProjectId), integer(assetId)).first();
  if (!asset) throw new Error('CAIP asset record not found.');
  const requestedRights = patch.rights_status == null ? asset.rights_status : normalizeRights(patch.rights_status);
  if (requestedRights === 'public_allowed' && !hasPublicAuthority(asset.source_safety_status)) {
    throw new Error('CAIP cannot grant public rights. First clear the source media in Content Studio with a real consent/public-use record.');
  }
  const tags = Array.from(new Set(String(patch.manual_tags ?? arrayJson(asset.manual_tags_json, []).join(',')).split(',').map((tag) => text(tag, 40)).filter(Boolean))).slice(0, 24);
  const status = patch.asset_status == null ? asset.asset_status : normalizeAssetStatus(patch.asset_status);
  await db.prepare(`UPDATE creative_assets SET rights_status=?, asset_status=?, manual_tags_json=?, manual_caption=?, updated_at=CURRENT_TIMESTAMP WHERE creative_asset_id=?`).bind(
    requestedRights, status, JSON.stringify(tags), clip(patch.manual_caption ?? asset.manual_caption, 1800) || null, asset.creative_asset_id
  ).run();
  await writeEvent(db, creativeProjectId, 'creative_asset_reviewed', actorUserId, { creative_asset_id: asset.creative_asset_id, rights_status: requestedRights, asset_status: status, tag_count: tags.length });
  const project = await db.prepare(`SELECT * FROM creative_projects WHERE creative_project_id=?`).bind(integer(creativeProjectId)).first();
  if (project) await updatePolicies(db, project);
  return getCreativeProjectDetail(db, creativeProjectId);
}

export async function updateCreativeStoryEvidence(db, creativeProjectId, evidenceId, patch, actorUserId) {
  const evidence = await db.prepare(`SELECT * FROM creative_story_evidence WHERE creative_project_id=? AND creative_story_evidence_id=? LIMIT 1`).bind(integer(creativeProjectId), integer(evidenceId)).first();
  if (!evidence) throw new Error('Story evidence record not found.');
  const visibility = normalizeVisibility(patch.visibility ?? evidence.visibility);
  const verification = normalizeEvidenceVerification(patch.verification_status ?? evidence.verification_status);
  const review = normalizeEvidenceReview(patch.review_status ?? evidence.review_status);
  const copyLocked = patch.copy_locked == null ? Number(evidence.copy_locked || 0) : (Number(patch.copy_locked) === 1 ? 1 : 0);
  await db.prepare(`UPDATE creative_story_evidence SET claim_text=?, visibility=?, verification_status=?, review_status=?, copy_locked=?, updated_at=CURRENT_TIMESTAMP WHERE creative_story_evidence_id=?`).bind(
    clip(patch.claim_text ?? evidence.claim_text, 4000) || evidence.claim_text, visibility, verification, review, copyLocked, evidence.creative_story_evidence_id
  ).run();
  await writeEvent(db, creativeProjectId, 'story_evidence_reviewed', actorUserId, { creative_story_evidence_id: evidence.creative_story_evidence_id, visibility, verification_status: verification, review_status: review });
  const project = await db.prepare(`SELECT * FROM creative_projects WHERE creative_project_id=?`).bind(integer(creativeProjectId)).first();
  if (project) await updatePolicies(db, project);
  return getCreativeProjectDetail(db, creativeProjectId);
}

export async function updateCreativeStorySegment(db, creativeProjectId, segmentId, patch, actorUserId) {
  const segment = await db.prepare(`SELECT * FROM creative_story_segments WHERE creative_project_id=? AND creative_story_segment_id=? LIMIT 1`).bind(integer(creativeProjectId), integer(segmentId)).first();
  if (!segment) throw new Error('Story segment not found.');
  const evidenceKeys = Array.from(new Set(String(patch.evidence_keys ?? arrayJson(segment.evidence_keys_json, []).join(',')).split(',').map((item) => text(item, 120)).filter(Boolean))).slice(0, 20);
  const status = normalizeSegmentStatus(patch.segment_status ?? segment.segment_status);
  const copyLocked = patch.copy_locked == null ? Number(segment.copy_locked || 0) : (Number(patch.copy_locked) === 1 ? 1 : 0);
  await db.prepare(`UPDATE creative_story_segments SET title=?, narrative_text=?, evidence_keys_json=?, segment_status=?, reviewer_notes=?, copy_locked=?, approved_by_user_id=CASE WHEN ?='approved' THEN ? ELSE approved_by_user_id END, approved_at=CASE WHEN ?='approved' THEN COALESCE(approved_at,CURRENT_TIMESTAMP) ELSE approved_at END, updated_at=CURRENT_TIMESTAMP WHERE creative_story_segment_id=?`).bind(
    clip(patch.title ?? segment.title, 200) || segment.title, clip(patch.narrative_text ?? segment.narrative_text, 7000) || segment.narrative_text,
    JSON.stringify(evidenceKeys), status, clip(patch.reviewer_notes ?? segment.reviewer_notes, 1800) || null,
    copyLocked, status, integer(actorUserId) || null, status, segment.creative_story_segment_id
  ).run();
  await writeEvent(db, creativeProjectId, 'story_segment_reviewed', actorUserId, { creative_story_segment_id: segment.creative_story_segment_id, segment_status: status });
  return getCreativeProjectDetail(db, creativeProjectId);
}

export async function approveCreativeProject(db, creativeProjectId, actorUserId) {
  const project = await db.prepare(`SELECT * FROM creative_projects WHERE creative_project_id=? LIMIT 1`).bind(integer(creativeProjectId)).first();
  if (!project) throw new Error('CAIP project not found.');
  const policies = rows(await db.prepare(`SELECT * FROM creative_policy_decisions WHERE creative_project_id=?`).bind(project.creative_project_id).all());
  const blockers = policies.filter((item) => item.decision_status === 'blocked' || item.severity === 'blocker');
  if (blockers.length) throw new Error(`Resolve ${blockers.length} CAIP blocker${blockers.length === 1 ? '' : 's'} before approving the internal intelligence record.`);
  await db.prepare(`UPDATE creative_projects SET project_status='approved', governance_status='approved_internal', lifecycle_stage='reviewed', approved_by_user_id=?, approved_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE creative_project_id=?`).bind(integer(actorUserId) || null, project.creative_project_id).run();
  await writeEvent(db, project.creative_project_id, 'caip_internal_project_approved', actorUserId, { public_release_unchanged: true, no_auto_publish: true });
  return getCreativeProjectDetail(db, creativeProjectId);
}

export function makeCreativeAssetManifest(detail) {
  if (!detail?.project) return {};
  return {
    manifest_version: '1.0', generated_by: CAIP_BUILD, generated_at: new Date().toISOString(),
    reference_only: true, no_auto_publish: true, no_implicit_rights: true, deterministic_metadata_analysis_only: true,
    project: detail.project,
    policies: detail.policies.map((item) => ({ policy_key: item.policy_key, decision_status: item.decision_status, severity: item.severity, rationale: item.rationale, evidence: safeJson(item.evidence_json, {}) })),
    assets: detail.assets.map((item) => ({ asset_key: item.asset_key, source_url: item.source_url, logical_archive_path: item.logical_archive_path, media_type: item.media_type, source_safety_status: item.source_safety_status, rights_status: item.rights_status, asset_status: item.asset_status, tags: arrayJson(item.manual_tags_json, []), analysis: { technical: item.technical_score, story: item.story_score, reuse: item.reuse_score, total: item.total_score, confidence: item.confidence_score } })),
    story_evidence: detail.evidence.map((item) => ({ evidence_key: item.evidence_key, source_reference: item.source_reference, claim_text: item.claim_text, visibility: item.visibility, verification_status: item.verification_status, review_status: item.review_status })),
    story_segments: detail.segments.map((item) => ({ segment_key: item.segment_key, segment_type: item.segment_type, title: item.title, narrative_text: item.narrative_text, evidence_keys: arrayJson(item.evidence_keys_json, []), segment_status: item.segment_status })),
    recommendations: detail.recommendations.map((item) => ({ recommendation_key: item.recommendation_key, destination_key: item.destination_key, intended_role: item.intended_role, asset_key: item.asset_key, fit_score: item.fit_score, recommendation_status: item.recommendation_status }))
  };
}
