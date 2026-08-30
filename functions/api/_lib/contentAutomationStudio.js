// Build 273 — Content Automation Studio shared helpers with Creative Process/CAIP bridge clarity.
// The studio is deliberately review-first: it creates a structured archive and
// rendering/copy plans from factual product data, but never auto-publishes or
// deletes original media.

import { requireContentAutomationSchema } from './contentAutomationSchemaReadiness.js';

export const CONTENT_STUDIO_BUILD = 'Build 273';

function text(value, max = 0) {
  const cleaned = String(value ?? '').trim();
  return max > 0 ? cleaned.slice(0, max).trim() : cleaned;
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function clip(value, max) {
  const clean = text(value).replace(/\s+/g, ' ');
  if (!clean || clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function slug(value) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'project';
}

function stableHash(value) {
  let hash = 2166136261;
  const source = String(value || '');
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function safeJson(value, fallback = {}) {
  try { return JSON.parse(value || ''); } catch { return fallback; }
}

function numeric(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProjectStatus(value) {
  const key = text(value).toLowerCase();
  return ['draft', 'review', 'approved', 'published', 'archived'].includes(key) ? key : 'draft';
}

function normalizeMediaSafety(value) {
  const key = text(value).toLowerCase();
  return ['needs_review', 'public_allowed', 'internal_only', 'blocked'].includes(key) ? key : 'needs_review';
}

function normalizeDeliverableStatus(value) {
  const key = text(value).toLowerCase();
  return ['planned', 'needs_media_review', 'ready_for_render', 'rendering', 'ready_for_review', 'approved', 'published', 'archived'].includes(key) ? key : 'planned';
}

function normalizeApprovalStatus(value) {
  const key = text(value).toLowerCase();
  return ['needs_review', 'approved', 'changes_requested', 'blocked'].includes(key) ? key : 'needs_review';
}

function inferredMediaType(row = {}) {
  const declared = text(row.media_type).toLowerCase();
  const mime = text(row.mime_type).toLowerCase();
  const source = text(row.source_url || row.image_url || row.public_url || row.original_filename).toLowerCase();
  if (declared === 'video' || mime.startsWith('video/') || /\.(mp4|m4v|mov|webm|avi)(?:[?#]|$)/.test(source)) return 'video';
  if (declared === 'audio' || mime.startsWith('audio/')) return 'audio';
  return 'image';
}

function publicSafetyFromSource(row = {}) {
  const usage = text(row.public_use_status).toLowerCase();
  const consent = text(row.consent_status).toLowerCase();
  const scope = text(row.consent_scope).toLowerCase();
  const flag = numeric(row.public_use_allowed);
  if (usage === 'blocked' || usage === 'consent_needed' || ['blocked', 'revoked'].includes(consent)) return 'blocked';
  if (usage === 'internal_review' || !usage) return 'needs_review';
  if (['product_page_ok', 'social_ok', 'all_public_ok'].includes(usage)) return 'public_allowed';
  if (flag === 1 || ['granted', 'not_required'].includes(consent) && ['product_page', 'website_gallery', 'all_public'].includes(scope)) return 'public_allowed';
  return 'needs_review';
}

function mediaScore(row = {}, index = 0) {
  const type = inferredMediaType(row);
  const merchandising = numeric(row.merchandising_score || row.first_image_score);
  const sharpness = numeric(row.sharpness_score);
  const brightness = numeric(row.brightness_score);
  const contrast = numeric(row.contrast_score);
  const role = text(row.image_role || row.variant_role).toLowerCase();
  let score = type === 'video' ? 55 : 42;
  if (index === 0) score += 18;
  else if (index < 3) score += 10;
  if (merchandising > 0) score += Math.min(28, merchandising * 0.28);
  if (sharpness > 0) score += Math.min(10, sharpness * 0.10);
  if (brightness > 0) score += Math.min(5, brightness * 0.05);
  if (contrast > 0) score += Math.min(5, contrast * 0.05);
  if (['hero_front', 'hero', 'finished_product', 'detail', 'before_after', 'process'].includes(role)) score += 9;
  if (publicSafetyFromSource(row) === 'public_allowed') score += 4;
  return Math.max(1, Math.min(100, Math.round(score)));
}

function scoreReason(row = {}, index = 0) {
  const parts = [];
  if (index === 0) parts.push('lead media order');
  if (numeric(row.merchandising_score || row.first_image_score) > 0) parts.push('existing merchandising score');
  if (text(row.image_role || row.variant_role)) parts.push(`role: ${text(row.image_role || row.variant_role)}`);
  if (inferredMediaType(row) === 'video') parts.push('video source');
  if (!parts.length) parts.push('source order and available metadata');
  return parts.join(' • ');
}

function mediaArchiveKey(row = {}, index = 0) {
  if (numeric(row.creative_asset_id)) return `caip-asset-${numeric(row.creative_asset_id)}`;
  if (numeric(row.product_image_id)) return `product-image-${numeric(row.product_image_id)}`;
  if (numeric(row.media_asset_id)) return `media-asset-${numeric(row.media_asset_id)}`;
  return `url-${stableHash(`${row.source_url || row.public_url || row.image_url || row.original_filename || ''}-${index}`)}`;
}

function filenameFromUrl(url, fallback) {
  const clean = text(url);
  if (!clean) return fallback;
  try {
    const pathname = new URL(clean).pathname;
    const name = pathname.split('/').pop();
    return text(name) || fallback;
  } catch {
    return clean.split('/').pop() || fallback;
  }
}

function buildArchivePath(projectKey, row, index) {
  const type = inferredMediaType(row);
  const filename = (text(row.original_filename) || filenameFromUrl(row.source_url || row.public_url || row.image_url, `${type}-${index + 1}`))
    .replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `content-projects/${projectKey}/source/${type}s/${String(index + 1).padStart(3, '0')}-${filename}`;
}

function getProductFacts(product = {}) {
  const name = text(product.name) || 'Untitled creation';
  const category = text(product.product_category) || 'handmade creation';
  const shortDescription = text(product.short_description) || clip(product.description, 420);
  const description = text(product.description) || shortDescription;
  const materials = text(product.materials || product.material_summary || product.materials_summary);
  const origin = text(product.merchandise_origin || product.origin_label || 'handmade');
  const storySummary = text(product.story_summary || product.story_body || product.process_notes);
  const location = 'Southern Ontario';
  const factualBits = [shortDescription, materials ? `Materials noted: ${materials}.` : '', storySummary]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ');
  return {
    name,
    category,
    shortDescription: shortDescription || `${name} is a ${category} recorded in the Devil n Dove catalog.`,
    description: description || `${name} is a ${category} recorded in the Devil n Dove catalog.`,
    materials,
    origin,
    storySummary,
    location,
    factualSummary: clip(factualBits || `${name} is a ${category}.`, 1200)
  };
}

function captionFor(facts, variation, channel) {
  const hooks = [
    `A closer look at ${facts.name}.`,
    `${facts.name}, from workshop to finished piece.`,
    `The finished details of ${facts.name}.`,
    `A small making moment from the Devil n Dove workshop.`,
    `One finished ${facts.category} and the story behind it.`
  ];
  const hook = hooks[variation % hooks.length];
  const body = clip(facts.shortDescription, 260);
  const CTA = channel === 'youtube'
    ? 'See the full making story and the finished details in this video.'
    : 'See the finished piece and follow along for more workshop projects.';
  return `${hook}\n\n${body}\n\n${CTA}\n\n#DevilNDove #HandmadeInOntario #${slug(facts.category).replace(/-/g, '') || 'Handmade'}`;
}

function longVideoScript(facts) {
  return [
    `0:00–0:10 — Opening: show the strongest finished view of ${facts.name}. On-screen title: “${facts.name}”.`,
    `0:10–0:35 — Context: “This ${facts.category} was finished in our ${facts.location} workshop.” Use only approved process media.`,
    `0:35–1:30 — Process story: ${clip(facts.storySummary || facts.description, 600)}`,
    `1:30–2:10 — Finished details: use close-ups and factual material/care details only.${facts.materials ? ` Materials noted in the catalog: ${facts.materials}.` : ''}`,
    `2:10–2:30 — Closing: show the completed piece and a truthful next step such as viewing the listing, requesting a custom piece, or following the workshop.`
  ].join('\n\n');
}

function shortVideoScript(facts, variation, channel) {
  const starts = [
    `Start with the strongest final view of ${facts.name}.`,
    `Open on one recognisable detail, then cut to the completed piece.`,
    `Show a quick before/process/after sequence only when the source media supports it.`,
    `Use a tight detail shot, then reveal the full ${facts.category}.`,
    `Lead with the finished result, followed by one truthful process moment.`
  ];
  return [
    `0:00–0:03 — ${starts[variation % starts.length]}`,
    `0:03–0:14 — Add a concise factual overlay: “${clip(facts.shortDescription, 100)}”`,
    `0:14–0:24 — Show two to four selected approved clips or photo motion crops.`,
    `0:24–0:30 — Close with a soft ${channel} call to action; do not promise availability, shipping, or a result that the listing does not support.`
  ].join('\n');
}

function standaloneCaptionFor(facts, variation, channel) {
  const hooks = [
    `A documented moment from ${facts.name}.`,
    `${facts.name}: the process, choices, and result.`,
    `One part of the ${facts.name} story.`,
    `What happened during ${facts.name}.`,
    `A reviewed project moment from Devil n Dove.`
  ];
  const hook = hooks[variation % hooks.length];
  const body = clip(facts.shortDescription, 300);
  const cta = channel === 'youtube' ? 'Watch the reviewed project story for the full context.' : 'Follow the reviewed project story for the full context.';
  return `${hook}\n\n${body}\n\n${cta}\n\n#DevilNDove #ProjectJournal`;
}

function standaloneLongVideoScript(facts) {
  return [
    `0:00–0:10 — Opening: use the strongest reviewed result or context shot from ${facts.name}.`,
    `0:10–0:35 — Why this project exists: ${clip(facts.shortDescription, 320)}`,
    `0:35–1:30 — Process: use only reviewed CAIP evidence and source moments that directly support the narration.`,
    `1:30–2:10 — Result / lesson: ${clip(facts.storySummary || facts.description, 520)}`,
    `2:10–2:30 — Closing: state the reviewed lesson, next step, or project conclusion without inventing a product, medical claim, or outcome not supported by the evidence.`
  ].join('\n\n');
}

function standaloneShortVideoScript(facts, variation, channel) {
  const starts = [
    `Open on the clearest reviewed result or context shot from ${facts.name}.`,
    `Start with one reviewed process moment, then reveal its context.`,
    `Use a factual before/process/after sequence only when CAIP evidence supports all three stages.`,
    `Lead with the project question, then show one evidence-backed answer.`,
    `Lead with a reviewed lesson and show the source moment that supports it.`
  ];
  return [
    `0:00–0:03 — ${starts[variation % starts.length]}`,
    `0:03–0:14 — Factual overlay: “${clip(facts.shortDescription, 110)}”`,
    `0:14–0:24 — Use two to four reviewed source moments; do not treat an immutable derivative plan as proof of what the media shows.`,
    `0:24–0:30 — Close with a soft ${channel} call to action and keep the project private until human approval.`
  ].join('\n\n');
}

function makeAssetPlan(projectKey, preferredMedia, format, limit = 6) {
  const assets = preferredMedia.slice(0, limit).map((item, index) => ({
    archive_key: item.archive_key,
    media_type: item.media_type,
    source_url: item.source_url,
    sequence: index + 1,
    crop_target: format,
    safety_status: item.safety_status
  }));
  return { project_key: projectKey, format, assets, requires_human_media_review: assets.some((asset) => asset.safety_status !== 'public_allowed') };
}

function deliverableSpecs(project, facts, assets) {
  const projectKey = project.content_project_key;
  const standalone = project.source_type === 'creative_project';
  const channelCaption = (variation, channel) => standalone ? standaloneCaptionFor(facts, variation, channel) : captionFor(facts, variation, channel);
  const longScript = standalone ? standaloneLongVideoScript(facts) : longVideoScript(facts);
  const shortScript = (variation, channel) => standalone ? standaloneShortVideoScript(facts, variation, channel) : shortVideoScript(facts, variation, channel);
  const approved = assets.filter((asset) => asset.is_selected && asset.safety_status !== 'blocked');
  const usable = approved.length ? approved : assets.filter((asset) => asset.safety_status !== 'blocked');
  const hasPublicCleared = usable.some((asset) => asset.safety_status === 'public_allowed');
  const baseStatus = usable.length ? (hasPublicCleared ? 'ready_for_render' : 'needs_media_review') : 'needs_media_review';
  const items = [];

  items.push({
    key: 'youtube-long-video', channel: 'youtube', type: 'long_video', title: standalone ? `${facts.name}: project story` : `Making ${facts.name}: workshop to finished piece`,
    caption: channelCaption(0, 'youtube'), script: longScript, body: '', aspect: '16:9', duration: 150,
    assetPlan: makeAssetPlan(projectKey, usable, '16:9', 12), status: baseStatus
  });

  for (let index = 1; index <= 3; index += 1) {
    items.push({
      key: `facebook-video-${index}`, channel: 'facebook', type: 'short_video', title: `${facts.name} — Facebook cut ${index}`,
      caption: channelCaption(index, 'facebook'), script: shortScript(index, 'Facebook'), body: '', aspect: '9:16', duration: 30,
      assetPlan: makeAssetPlan(projectKey, usable.slice(index - 1), '9:16', 6), status: baseStatus
    });
  }
  for (let index = 1; index <= 5; index += 1) {
    items.push({
      key: `instagram-reel-${index}`, channel: 'instagram', type: 'short_video', title: `${facts.name} — Reel ${index}`,
      caption: channelCaption(index + 3, 'instagram'), script: shortScript(index + 3, 'Instagram Reel'), body: '', aspect: '9:16', duration: 25,
      assetPlan: makeAssetPlan(projectKey, usable.slice(index - 1), '9:16', 6), status: baseStatus
    });
  }
  for (let index = 1; index <= 5; index += 1) {
    items.push({
      key: `tiktok-${index}`, channel: 'tiktok', type: 'short_video', title: `${facts.name} — TikTok ${index}`,
      caption: channelCaption(index + 8, 'tiktok'), script: shortScript(index + 8, 'TikTok'), body: '', aspect: '9:16', duration: 25,
      assetPlan: makeAssetPlan(projectKey, usable.slice(index - 1), '9:16', 6), status: baseStatus
    });
  }

  const title = clip(standalone ? `${facts.name} | Project Journal | Devil n Dove` : `${facts.name} | ${facts.category} | Devil n Dove`, 60);
  const meta = clip(standalone ? `${facts.shortDescription} A reviewed Devil n Dove project journal built from source evidence.` : `${facts.shortDescription} Explore this ${facts.category} from Devil n Dove in ${facts.location}.`, 155);
  const imageAlt = usable.slice(0, 8).map((asset, index) => standalone ? `${facts.name} — reviewed project media ${index + 1}` : `${facts.name} — ${index === 0 ? 'finished front view' : `workshop detail ${index + 1}`}`);
  const blogBody = standalone ? [
    `# Project journal: ${facts.name}`, '', facts.shortDescription, '',
    facts.storySummary || `This draft is based on the Creative Process project record and should be expanded only with reviewed CAIP evidence.`, '',
    `## Evidence-backed process\n\nUse approved CAIP evidence and reviewed source moments to explain what happened.`, '',
    `## Result and lessons\n\nState only conclusions supported by the reviewed project record. Do not invent a product listing or unsupported claim.`
  ].join('\n') : [
    `# From workshop to finished piece: ${facts.name}`,
    '',
    facts.shortDescription,
    '',
    facts.storySummary || `This article was prepared from the approved product record and selected workshop media. It should be edited to reflect only what the final media and catalog entry show.`,
    '',
    facts.materials ? `## Materials and details\n\n${facts.materials}` : '',
    '',
    `## The finished piece\n\nUse the selected gallery media to show the finished result, then link only to the verified product listing or custom-request page.`
  ].filter(Boolean).join('\n');

  items.push({
    key: 'website-gallery', channel: 'website', type: 'gallery', title: `${facts.name} — website gallery set`,
    caption: '', script: '', body: standalone ? `Selected reviewed project media prepared for a Project Journal/gallery. Keep factual captions and approved public-use media only.` : `Selected project media prepared for the product gallery and Workshop Journal. Keep only factual captions and approved public-use media.`, aspect: '1:1 / 4:3', duration: 0,
    assetPlan: makeAssetPlan(projectKey, usable, 'website-gallery', 10), status: hasPublicCleared ? 'ready_for_review' : 'needs_media_review'
  });
  if (!standalone) {
  items.push({
    key: 'google-business-profile-photos', channel: 'google_business_profile', type: 'photo_pack', title: `${facts.name} — Google Business Profile photo set`,
    caption: `${facts.name} from the Devil n Dove workshop in ${facts.location}.`, script: '', body: `Prepare five truthful photos with factual filenames and captions. Manual upload and final Google Business Profile review are required.`, aspect: '1:1 / 4:3', duration: 0,
    assetPlan: makeAssetPlan(projectKey, usable, 'google-business-profile', 5), status: hasPublicCleared ? 'ready_for_review' : 'needs_media_review'
  });
  }
  items.push({
    key: 'seo-assets', channel: 'seo', type: 'seo_pack', title: `${facts.name} — SEO page assets`, caption: '', script: '', body: JSON.stringify({ meta_title: title, meta_description: meta, suggested_image_alt_text: imageAlt, suggested_slug: slug(facts.name), canonical_rule: standalone ? 'Use one reviewed Project Journal/story URL if this project is ever published; do not create thin duplicate pages for each social output.' : 'Use the existing canonical product URL; do not create a duplicate page for the same item.' }, null, 2), aspect: 'text', duration: 0,
    assetPlan: makeAssetPlan(projectKey, usable, 'seo-image', 8), status: hasPublicCleared ? 'ready_for_review' : 'needs_media_review'
  });
  items.push({
    key: 'blog-article', channel: 'blog', type: 'blog_article', title: standalone ? `Project journal: ${facts.name}` : `From workshop to finished piece: ${facts.name}`,
    caption: '', script: '', body: blogBody, aspect: 'article', duration: 0,
    assetPlan: makeAssetPlan(projectKey, usable, 'article-hero', 6), status: hasPublicCleared ? 'ready_for_review' : 'needs_media_review'
  });
  items.push({
    key: 'youtube-thumbnail', channel: 'youtube', type: 'thumbnail', title: `${facts.name} — YouTube thumbnail plan`,
    caption: '', script: '', body: `Use the strongest finished image, a short truthful title (“${clip(facts.name, 38)}”), and sufficient contrast. Do not imply a transformation or outcome the source media cannot show.`, aspect: '16:9', duration: 0,
    assetPlan: makeAssetPlan(projectKey, usable, '16:9-thumbnail', 1), status: hasPublicCleared ? 'ready_for_review' : 'needs_media_review'
  });
  items.push({
    key: 'caption-bundle', channel: 'social', type: 'caption_bundle', title: `${facts.name} — caption bundle`,
    caption: channelCaption(1, 'social'), script: '', body: `Generated captions for the planned social pieces are stored on each individual deliverable. Edit each one before approval.`, aspect: 'text', duration: 0,
    assetPlan: makeAssetPlan(projectKey, usable, 'caption-reference', 5), status: 'ready_for_review'
  });
  return items;
}

export async function ensureContentAutomationSchema(db) {
  return requireContentAutomationSchema(db);
}

async function getProductWithSources(db, productId) {
  const product = await db.prepare(`
    SELECT p.*, ps.meta_title, ps.meta_description, ps.keywords, ps.canonical_url, ps.og_image_url,
      ps.h1_override, pn.story_summary, pn.story_body, pn.process_notes, pn.care_notes
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    LEFT JOIN product_story_public_notes pn ON pn.product_id = p.product_id
      AND pn.product_story_public_note_id = (
        SELECT inner_pn.product_story_public_note_id
        FROM product_story_public_notes inner_pn
        WHERE inner_pn.product_id = p.product_id
        ORDER BY CASE lower(COALESCE(inner_pn.display_status,'')) WHEN 'published' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
          inner_pn.updated_at DESC, inner_pn.product_story_public_note_id DESC
        LIMIT 1
      )
    WHERE p.product_id = ?
    LIMIT 1
  `).bind(productId).first().catch(async () => db.prepare(`SELECT * FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first());
  if (!product) return null;

  const productImageRows = rows(await db.prepare(`
    SELECT pi.product_image_id, pi.image_url AS source_url, pi.alt_text, pi.sort_order,
      pia.image_role, pia.public_use_status, pia.consent_record_id, pia.merchandising_score,
      pia.first_image_score, pia.sharpness_score, pia.brightness_score, pia.contrast_score,
      pia.width_px, pia.height_px, pia.image_orientation,
      mcr.consent_status, mcr.consent_scope, mcr.public_use_allowed,
      ma.media_asset_id, ma.object_key, ma.original_filename, ma.mime_type,
      ma.file_size_bytes, ma.variant_role, ma.shot_style
    FROM product_images pi
    LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
    LEFT JOIN media_consent_records mcr ON mcr.consent_record_id = pia.consent_record_id
    LEFT JOIN media_assets ma ON ma.product_id = pi.product_id AND ma.public_url = pi.image_url AND ma.deleted_at IS NULL
    WHERE pi.product_id = ? AND COALESCE(pi.image_url,'') <> ''
    ORDER BY COALESCE(pi.sort_order,0), pi.product_image_id
  `).bind(productId).all().catch(() => ({ results: [] })));

  const assetRows = rows(await db.prepare(`
    SELECT ma.media_asset_id, ma.public_url AS source_url, ma.object_key, ma.original_filename, ma.mime_type,
      ma.file_size_bytes, ma.variant_role, ma.sort_order, ma.annotation_notes, ma.width_px, ma.height_px,
      ma.image_orientation, ma.background_consistency_score, ma.subject_fill_score, ma.sharpness_score,
      ma.brightness_score, ma.contrast_score, ma.angle_group, ma.shot_style, ma.merchandising_score
    FROM media_assets ma
    WHERE ma.product_id = ? AND ma.deleted_at IS NULL AND COALESCE(ma.public_url,'') <> ''
    ORDER BY COALESCE(ma.sort_order,0), ma.media_asset_id
  `).bind(productId).all().catch(() => ({ results: [] })));

  const seen = new Set();
  const combined = [];
  productImageRows.forEach((row) => {
    const key = text(row.source_url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    combined.push(row);
  });
  assetRows.forEach((row) => {
    const key = text(row.source_url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    combined.push(row);
  });
  return { product, media: combined };
}

async function writeProjectEvent(db, projectId, eventType, actorUserId, details = {}) {
  await db.prepare(`INSERT INTO content_project_events (content_project_id, event_type, actor_user_id, details_json, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(projectId, eventType, actorUserId || null, JSON.stringify(details || {})).run().catch(() => null);
}

async function archiveSourceMedia(db, project, mediaRows, actorUserId) {
  let archived = 0;
  for (let index = 0; index < mediaRows.length; index += 1) {
    const source = mediaRows[index];
    const archiveKey = mediaArchiveKey(source, index);
    const score = mediaScore(source, index);
    const safety = publicSafetyFromSource(source);
    const mediaType = inferredMediaType(source);
    const isSelected = score >= 55 && safety !== 'blocked' ? 1 : 0;
    const isFeatured = index === 0 ? 1 : 0;
    await db.prepare(`
      INSERT INTO content_project_media (
        content_project_id, media_asset_id, product_image_id, archive_key, archive_path, source_url,
        media_type, original_filename, mime_type, sort_order, selection_score, selection_reason,
        safety_status, consent_record_id, is_selected, is_featured, source_metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(content_project_id, archive_key) DO UPDATE SET
        media_asset_id=excluded.media_asset_id,
        product_image_id=excluded.product_image_id,
        archive_path=excluded.archive_path,
        source_url=excluded.source_url,
        media_type=excluded.media_type,
        original_filename=excluded.original_filename,
        mime_type=excluded.mime_type,
        sort_order=excluded.sort_order,
        selection_score=excluded.selection_score,
        selection_reason=excluded.selection_reason,
        consent_record_id=excluded.consent_record_id,
        source_metadata_json=excluded.source_metadata_json,
        updated_at=CURRENT_TIMESTAMP
    `).bind(
      project.content_project_id,
      numeric(source.media_asset_id) || null,
      numeric(source.product_image_id) || null,
      archiveKey,
      buildArchivePath(project.content_project_key, source, index),
      text(source.source_url),
      mediaType,
      text(source.original_filename) || filenameFromUrl(source.source_url, `${mediaType}-${index + 1}`),
      text(source.mime_type) || null,
      index,
      score,
      scoreReason(source, index),
      safety,
      numeric(source.consent_record_id) || null,
      isSelected,
      isFeatured,
      JSON.stringify({
        image_role: text(source.image_role || source.variant_role),
        public_use_status: text(source.public_use_status),
        consent_status: text(source.consent_status),
        source_width_px: numeric(source.width_px),
        source_height_px: numeric(source.height_px),
        merchandising_score: numeric(source.merchandising_score || source.first_image_score),
        caip_creative_asset_id: numeric(source.creative_asset_id) || null,
        caip_creative_project_id: numeric(source.creative_project_id) || null,
        private_object_key: text(source.private_object_key) || null,
        raw_private_source: numeric(source.creative_asset_id) ? true : false,
        manual_caption: text(source.manual_caption, 1800) || null,
        manual_tags: Array.isArray(source.manual_tags) ? source.manual_tags : safeJson(source.manual_tags_json, []),
        build: CONTENT_STUDIO_BUILD
      })
    ).run();
    archived += 1;
  }
  await writeProjectEvent(db, project.content_project_id, 'source_media_archived', actorUserId, { archived_count: archived, source_reference_only: true });
  return archived;
}

async function getProjectMedia(db, projectId) {
  return rows(await db.prepare(`SELECT * FROM content_project_media WHERE content_project_id = ? ORDER BY is_featured DESC, is_selected DESC, selection_score DESC, sort_order ASC, content_project_media_id ASC`).bind(projectId).all());
}

async function writeDeliverables(db, project, facts, assets, actorUserId, refreshCopy = false) {
  const specs = deliverableSpecs(project, facts, assets);
  let created = 0;
  for (const spec of specs) {
    const current = await db.prepare(`SELECT content_project_deliverable_id, copy_locked FROM content_project_deliverables WHERE content_project_id = ? AND deliverable_key = ? LIMIT 1`).bind(project.content_project_id, spec.key).first();
    if (current && (!refreshCopy || numeric(current.copy_locked) === 1)) continue;
    const assetPlanJson = JSON.stringify(spec.assetPlan);
    if (!current) {
      await db.prepare(`
        INSERT INTO content_project_deliverables (
          content_project_id, deliverable_key, channel_key, deliverable_type, title, caption,
          script_text, body_content, asset_plan_json, aspect_ratio, target_duration_seconds,
          deliverable_status, approval_status, generated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'needs_review', 'factual_template', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(project.content_project_id, spec.key, spec.channel, spec.type, spec.title, spec.caption, spec.script, spec.body,
        assetPlanJson, spec.aspect, spec.duration, spec.status).run();
      created += 1;
    } else {
      await db.prepare(`
        UPDATE content_project_deliverables
        SET title=?, caption=?, script_text=?, body_content=?, asset_plan_json=?, aspect_ratio=?, target_duration_seconds=?,
          deliverable_status=CASE WHEN deliverable_status IN ('published','approved') THEN deliverable_status ELSE ? END,
          generated_by='factual_template', updated_at=CURRENT_TIMESTAMP
        WHERE content_project_deliverable_id=?
      `).bind(spec.title, spec.caption, spec.script, spec.body, assetPlanJson, spec.aspect, spec.duration, spec.status, current.content_project_deliverable_id).run();
    }
  }
  await writeProjectEvent(db, project.content_project_id, refreshCopy ? 'deliverables_refreshed' : 'deliverables_prepared', actorUserId, { created_count: created, target_counts: { youtube: 1, facebook: 3, instagram: 5, tiktok: 5 } });
  return created;
}

export async function createOrRefreshContentProjectForProduct(db, productId, actorUserId, options = {}) {
  await ensureContentAutomationSchema(db);
  const source = await getProductWithSources(db, Number(productId));
  if (!source?.product) throw new Error('Product not found for Content Automation Studio.');
  const reviewStatus = text(source.product.review_status).toLowerCase();
  if (!['approved', 'published'].includes(reviewStatus)) {
    throw new Error('Only an approved finished product can create a content package. Approve the product first.');
  }
  const facts = getProductFacts(source.product);
  const sourceId = String(source.product.product_id);
  const key = `product-${source.product.product_id}-${slug(source.product.slug || source.product.name)}`;
  const contentPolicy = {
    review_first: true,
    no_auto_publish: true,
    source_media_is_reference_only: true,
    factual_copy_only: true,
    require_public_media_review_before_publish: true,
    build: CONTENT_STUDIO_BUILD
  };
  await db.prepare(`
    INSERT INTO content_projects (
      content_project_key, source_type, source_id, product_id, project_title, project_status, review_status,
      public_release_status, story_angle, factual_summary, source_snapshot_json, content_policy_json, created_by_user_id,
      created_at, updated_at
    ) VALUES (?, 'product', ?, ?, ?, 'draft', 'needs_review', 'private', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(source_type, source_id) DO UPDATE SET
      project_title=excluded.project_title,
      factual_summary=excluded.factual_summary,
      source_snapshot_json=excluded.source_snapshot_json,
      content_policy_json=excluded.content_policy_json,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    key,
    sourceId,
    source.product.product_id,
    `${facts.name} content package`,
    `Finished ${facts.category} story`,
    facts.factualSummary,
    JSON.stringify({ product: source.product, media_count: source.media.length, archived_at: new Date().toISOString(), build: CONTENT_STUDIO_BUILD }),
    JSON.stringify(contentPolicy),
    actorUserId || null
  ).run();
  const project = await db.prepare(`SELECT * FROM content_projects WHERE source_type='product' AND source_id=? LIMIT 1`).bind(sourceId).first();
  const archivedCount = await archiveSourceMedia(db, project, source.media, actorUserId);
  const assets = await getProjectMedia(db, project.content_project_id);
  const deliverablesCreated = await writeDeliverables(db, project, facts, assets, actorUserId, Boolean(options.refresh_copy));
  await db.prepare(`UPDATE content_projects SET updated_at=CURRENT_TIMESTAMP WHERE content_project_id=?`).bind(project.content_project_id).run();
  return { project, facts, archived_count: archivedCount, deliverables_created: deliverablesCreated };
}

async function caipMediaForCreativeWorkProject(db, creativeWorkProjectId) {
  try {
    const result = await db.prepare(`
      SELECT cp.creative_project_id, ca.creative_asset_id, ca.media_asset_id, ca.source_url,
        ca.logical_archive_path, ca.source_safety_status, ca.rights_status, ca.asset_status,
        ca.media_type, ca.original_filename, ca.mime_type, ca.sort_order, ca.is_source_selected,
        ca.is_source_featured, ca.manual_tags_json, ca.manual_caption, ca.source_metadata_json
      FROM creative_projects cp
      JOIN creative_assets ca ON ca.creative_project_id=cp.creative_project_id
      WHERE cp.source_type='creative_work_project' AND cp.source_id=? AND ca.asset_status<>'archived'
      ORDER BY ca.is_source_featured DESC, ca.is_source_selected DESC, ca.sort_order, ca.creative_asset_id
    `).bind(String(creativeWorkProjectId)).all();
    return rows(result).map((row, index) => {
      const metadata = safeJson(row.source_metadata_json, {});
      const safety = text(row.source_safety_status).toLowerCase();
      const consent = text(metadata.consent_state).toLowerCase();
      return {
        creative_project_id: numeric(row.creative_project_id),
        creative_asset_id: numeric(row.creative_asset_id),
        media_asset_id: numeric(row.media_asset_id) || null,
        source_url: text(row.source_url) || null,
        original_filename: text(row.original_filename) || `caip-asset-${numeric(row.creative_asset_id)}`,
        mime_type: text(row.mime_type) || null,
        media_type: text(row.media_type) || 'image',
        image_role: text(metadata.media_role) || 'project_evidence',
        public_use_status: safety === 'public_allowed' ? 'all_public_ok' : safety === 'blocked' ? 'blocked' : 'internal_review',
        consent_status: consent || 'needs_review',
        consent_scope: safety === 'public_allowed' ? 'all_public' : 'internal',
        public_use_allowed: safety === 'public_allowed' ? 1 : 0,
        merchandising_score: numeric(row.is_source_selected) ? 72 : 55,
        sort_order: numeric(row.sort_order) || index,
        private_object_key: text(metadata.object_key || row.logical_archive_path),
        manual_caption: text(row.manual_caption, 1800) || null,
        manual_tags_json: row.manual_tags_json || '[]'
      };
    });
  } catch {
    return [];
  }
}

async function attachContentProjectToExistingCreativeWorkCaip(db, creativeWorkProjectId, contentProjectId) {
  try {
    await db.prepare(`UPDATE creative_projects SET content_project_id=?, updated_at=CURRENT_TIMESTAMP WHERE source_type='creative_work_project' AND source_id=?`).bind(Number(contentProjectId), String(creativeWorkProjectId)).run();
    return await db.prepare(`SELECT creative_project_id FROM creative_projects WHERE source_type='creative_work_project' AND source_id=? LIMIT 1`).bind(String(creativeWorkProjectId)).first();
  } catch {
    return null;
  }
}

export async function createOrRefreshContentProjectForCreativeProject(db, creativeProject, evidenceRows = [], actorUserId, options = {}) {
  await ensureContentAutomationSchema(db);
  const sourceId = String(creativeProject?.creative_work_project_id || creativeProject?.project_id || '');
  if (!sourceId) throw new Error('Creative Project is required for Content Automation Studio.');
  const name = text(creativeProject?.project_title) || `Creative Project ${sourceId}`;
  const category = text(creativeProject?.project_type).replace(/_/g, ' ') || 'content project';
  const summary = text(creativeProject?.summary || creativeProject?.objective || creativeProject?.story_angle) || `${name} is a content-only creative project documented in the Creative Process Engine.`;
  const key = `creative-project-${sourceId}-${slug(name)}`;
  const policy = {
    review_first: true,
    no_auto_publish: true,
    source_media_is_reference_only: true,
    factual_copy_only: true,
    content_only_project: true,
    require_public_media_review_before_publish: true,
    build: CONTENT_STUDIO_BUILD
  };
  await db.prepare(`
    INSERT INTO content_projects (
      content_project_key, source_type, source_id, product_id, project_title, project_status, review_status,
      public_release_status, story_angle, factual_summary, source_snapshot_json, content_policy_json, created_by_user_id,
      created_at, updated_at
    ) VALUES (?, 'creative_project', ?, NULL, ?, 'draft', 'needs_review', 'private', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(source_type, source_id) DO UPDATE SET
      project_title=excluded.project_title, story_angle=excluded.story_angle, factual_summary=excluded.factual_summary,
      source_snapshot_json=excluded.source_snapshot_json, content_policy_json=excluded.content_policy_json,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    key, sourceId, `${name} content package`, text(creativeProject?.story_angle) || `${category} story`, summary,
    JSON.stringify({ creative_project: creativeProject, evidence_count: Array.isArray(evidenceRows) ? evidenceRows.length : 0, archived_at: new Date().toISOString(), build: CONTENT_STUDIO_BUILD }),
    JSON.stringify(policy), actorUserId || null
  ).run();
  const project = await db.prepare(`SELECT * FROM content_projects WHERE source_type='creative_project' AND source_id=? LIMIT 1`).bind(sourceId).first();
  const caipRows = await caipMediaForCreativeWorkProject(db, sourceId);
  const evidenceMedia = (Array.isArray(evidenceRows) ? evidenceRows : []).filter((row) => text(row?.media_url)).map((row, index) => ({
    source_url: text(row.media_url),
    original_filename: filenameFromUrl(row.media_url, `creative-evidence-${index + 1}`),
    mime_type: null,
    image_role: text(row.evidence_role || row.event_type || 'process'),
    public_use_status: 'internal_review',
    consent_status: 'needs_review',
    sort_order: caipRows.length + index,
    merchandising_score: 55
  }));
  const mediaRows = [...caipRows, ...evidenceMedia];
  const archivedCount = await archiveSourceMedia(db, project, mediaRows, actorUserId);
  const caipLink = await attachContentProjectToExistingCreativeWorkCaip(db, sourceId, project.content_project_id);
  const assets = await getProjectMedia(db, project.content_project_id);
  const facts = {
    name, category, shortDescription: clip(summary, 420), description: summary, materials: '',
    origin: 'creative project', storySummary: text(creativeProject?.story_angle || creativeProject?.objective || summary),
    location: '', factualSummary: clip(summary, 1200)
  };
  const deliverablesCreated = await writeDeliverables(db, project, facts, assets, actorUserId, Boolean(options.refresh_copy));
  await writeProjectEvent(db, project.content_project_id, 'creative_project_linked', actorUserId, { creative_work_project_id: Number(sourceId), content_only_project: true, caip_creative_project_id: numeric(caipLink?.creative_project_id) || null, caip_media_count: caipRows.length });
  return { project, facts, archived_count: archivedCount, deliverables_created: deliverablesCreated, caip_creative_project_id: numeric(caipLink?.creative_project_id) || null, caip_media_count: caipRows.length };
}

export async function getContentProjectDetail(db, projectId) {
  await ensureContentAutomationSchema(db);
  const project = await db.prepare(`SELECT * FROM content_projects WHERE content_project_id = ? LIMIT 1`).bind(Number(projectId)).first();
  if (!project) return null;
  const media = await getProjectMedia(db, project.content_project_id);
  const deliverables = rows(await db.prepare(`SELECT * FROM content_project_deliverables WHERE content_project_id = ? ORDER BY CASE channel_key WHEN 'youtube' THEN 1 WHEN 'facebook' THEN 2 WHEN 'instagram' THEN 3 WHEN 'tiktok' THEN 4 WHEN 'website' THEN 5 WHEN 'google_business_profile' THEN 6 WHEN 'seo' THEN 7 WHEN 'blog' THEN 8 ELSE 9 END, content_project_deliverable_id`).bind(project.content_project_id).all());
  const events = rows(await db.prepare(`SELECT * FROM content_project_events WHERE content_project_id = ? ORDER BY content_project_event_id DESC LIMIT 30`).bind(project.content_project_id).all());
  const counts = deliverables.reduce((acc, item) => {
    acc[item.channel_key] = (acc[item.channel_key] || 0) + 1;
    return acc;
  }, {});
  let creativeProcessProject = null;
  let caipProject = null;
  if (project.source_type === 'creative_project' && numeric(project.source_id)) {
    creativeProcessProject = await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1`).bind(numeric(project.source_id)).first().catch(()=>null);
    caipProject = await db.prepare(`SELECT creative_project_id,project_title,governance_status,lifecycle_stage FROM creative_projects WHERE source_type='creative_work_project' AND source_id=? LIMIT 1`).bind(String(project.source_id)).first().catch(()=>null);
  }
  return { project, media, deliverables, events, counts, creative_process_project: creativeProcessProject, caip_project: caipProject };
}

export async function listContentStudioProjects(db) {
  await ensureContentAutomationSchema(db);
  const projects = rows(await db.prepare(`
    SELECT cp.*, p.name AS product_name, p.slug AS product_slug, p.review_status AS product_review_status,
      COUNT(DISTINCT cpm.content_project_media_id) AS media_count,
      SUM(CASE WHEN cpm.is_selected = 1 THEN 1 ELSE 0 END) AS selected_media_count,
      SUM(CASE WHEN cpm.safety_status = 'public_allowed' THEN 1 ELSE 0 END) AS public_media_count,
      SUM(CASE WHEN cpm.safety_status = 'blocked' THEN 1 ELSE 0 END) AS blocked_media_count,
      COUNT(DISTINCT cpd.content_project_deliverable_id) AS deliverable_count,
      SUM(CASE WHEN cpd.approval_status = 'approved' THEN 1 ELSE 0 END) AS approved_deliverable_count,
      SUM(CASE WHEN cpd.deliverable_status = 'published' THEN 1 ELSE 0 END) AS published_deliverable_count
    FROM content_projects cp
    LEFT JOIN products p ON p.product_id = cp.product_id
    LEFT JOIN content_project_media cpm ON cpm.content_project_id = cp.content_project_id
    LEFT JOIN content_project_deliverables cpd ON cpd.content_project_id = cp.content_project_id
    GROUP BY cp.content_project_id
    ORDER BY cp.updated_at DESC, cp.content_project_id DESC
    LIMIT 80
  `).all());
  const approvedProducts = rows(await db.prepare(`
    SELECT product_id, name, slug, product_category, featured_image_url, review_status, status, updated_at
    FROM products
    WHERE lower(COALESCE(review_status,'')) IN ('approved','published')
    ORDER BY updated_at DESC, product_id DESC
    LIMIT 160
  `).all().catch(() => ({ results: [] })));
  const creativeProjects = rows(await db.prepare(`
    SELECT cwp.creative_work_project_id,cwp.project_key,cwp.project_title,cwp.project_type,cwp.project_status,cwp.updated_at,
      cp.content_project_id,cp.review_status AS content_review_status,cp.public_release_status,
      caip.creative_project_id AS caip_creative_project_id,
      (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=caip.creative_project_id AND a.asset_status<>'archived') AS caip_asset_count,
      (SELECT COUNT(*) FROM creative_project_evidence_selections es WHERE es.creative_work_project_id=cwp.creative_work_project_id AND es.selected=1) AS selected_evidence_count
    FROM creative_work_projects cwp
    LEFT JOIN content_projects cp ON cp.source_type='creative_project' AND cp.source_id=CAST(cwp.creative_work_project_id AS TEXT)
    LEFT JOIN creative_projects caip ON caip.source_type='creative_work_project' AND caip.source_id=CAST(cwp.creative_work_project_id AS TEXT)
    WHERE cwp.project_status<>'archived'
    ORDER BY cwp.updated_at DESC,cwp.creative_work_project_id DESC
    LIMIT 120
  `).all().catch(() => ({ results: [] })));
  return { projects, approved_products: approvedProducts, creative_projects: creativeProjects };
}

export async function updateContentProject(db, projectId, patch, actorUserId) {
  const project = await db.prepare(`SELECT * FROM content_projects WHERE content_project_id=? LIMIT 1`).bind(Number(projectId)).first();
  if (!project) throw new Error('Content project not found.');
  const projectStatus = patch.project_status == null ? project.project_status : normalizeProjectStatus(patch.project_status);
  const reviewStatus = patch.review_status == null ? project.review_status : normalizeApprovalStatus(patch.review_status);
  const publicRelease = patch.public_release_status == null ? text(project.public_release_status) : ['private','review_ready','approved_for_publish','published'].includes(text(patch.public_release_status).toLowerCase()) ? text(patch.public_release_status).toLowerCase() : 'private';
  await db.prepare(`UPDATE content_projects SET project_title=?, project_status=?, review_status=?, public_release_status=?, story_angle=?, internal_notes=?, updated_at=CURRENT_TIMESTAMP WHERE content_project_id=?`).bind(
    clip(patch.project_title ?? project.project_title, 180) || project.project_title,
    projectStatus, reviewStatus, publicRelease,
    clip(patch.story_angle ?? project.story_angle, 320) || null,
    clip(patch.internal_notes ?? project.internal_notes, 4000) || null,
    project.content_project_id
  ).run();
  if (reviewStatus === 'approved' && project.review_status !== 'approved') {
    await db.prepare(`UPDATE content_projects SET approved_by_user_id=?, approved_at=CURRENT_TIMESTAMP WHERE content_project_id=?`).bind(actorUserId || null, project.content_project_id).run();
  }
  await writeProjectEvent(db, project.content_project_id, 'project_updated', actorUserId, { project_status: projectStatus, review_status: reviewStatus, public_release_status: publicRelease });
  return getContentProjectDetail(db, project.content_project_id);
}

export async function updateContentProjectMedia(db, projectId, mediaId, patch, actorUserId) {
  const current = await db.prepare(`SELECT * FROM content_project_media WHERE content_project_id=? AND content_project_media_id=? LIMIT 1`).bind(Number(projectId), Number(mediaId)).first();
  if (!current) throw new Error('Archived media item not found.');
  const safety = patch.safety_status == null ? current.safety_status : normalizeMediaSafety(patch.safety_status);
  const selected = patch.is_selected == null ? numeric(current.is_selected) : (Number(patch.is_selected) === 1 ? 1 : 0);
  const featured = patch.is_featured == null ? numeric(current.is_featured) : (Number(patch.is_featured) === 1 ? 1 : 0);
  if (featured) await db.prepare(`UPDATE content_project_media SET is_featured=0, updated_at=CURRENT_TIMESTAMP WHERE content_project_id=?`).bind(Number(projectId)).run();
  await db.prepare(`UPDATE content_project_media SET is_selected=?, is_featured=?, safety_status=?, selection_reason=?, updated_at=CURRENT_TIMESTAMP WHERE content_project_media_id=?`).bind(
    selected, featured, safety, clip(patch.selection_reason ?? current.selection_reason, 600) || null, current.content_project_media_id
  ).run();
  await writeProjectEvent(db, Number(projectId), 'archive_media_updated', actorUserId, { content_project_media_id: Number(mediaId), is_selected: selected, is_featured: featured, safety_status: safety });
  return getContentProjectDetail(db, projectId);
}

export async function updateContentDeliverable(db, projectId, deliverableId, patch, actorUserId) {
  const current = await db.prepare(`SELECT * FROM content_project_deliverables WHERE content_project_id=? AND content_project_deliverable_id=? LIMIT 1`).bind(Number(projectId), Number(deliverableId)).first();
  if (!current) throw new Error('Content deliverable not found.');
  const approvalStatus = patch.approval_status == null ? current.approval_status : normalizeApprovalStatus(patch.approval_status);
  const deliverableStatus = patch.deliverable_status == null ? current.deliverable_status : normalizeDeliverableStatus(patch.deliverable_status);
  const outputUrl = patch.output_url == null ? current.output_url : text(patch.output_url, 1600) || null;
  const thumbnailUrl = patch.thumbnail_url == null ? current.thumbnail_url : text(patch.thumbnail_url, 1600) || null;
  await db.prepare(`
    UPDATE content_project_deliverables
    SET title=?, caption=?, script_text=?, body_content=?, output_url=?, thumbnail_url=?, deliverable_status=?, approval_status=?,
      review_notes=?, copy_locked=CASE WHEN ?=1 THEN 1 ELSE copy_locked END,
      approved_by_user_id=CASE WHEN ?='approved' THEN ? ELSE approved_by_user_id END,
      approved_at=CASE WHEN ?='approved' THEN COALESCE(approved_at,CURRENT_TIMESTAMP) ELSE approved_at END,
      published_at=CASE WHEN ?='published' THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE published_at END,
      updated_at=CURRENT_TIMESTAMP
    WHERE content_project_deliverable_id=?
  `).bind(
    clip(patch.title ?? current.title, 220) || current.title,
    clip(patch.caption ?? current.caption, 5000) || null,
    clip(patch.script_text ?? current.script_text, 12000) || null,
    clip(patch.body_content ?? current.body_content, 24000) || null,
    outputUrl, thumbnailUrl, deliverableStatus, approvalStatus,
    clip(patch.review_notes ?? current.review_notes, 2400) || null,
    patch.copy_locked ? 1 : 0,
    approvalStatus, actorUserId || null, deliverableStatus,
    current.content_project_deliverable_id
  ).run();
  if (deliverableStatus === 'ready_for_render') {
    await db.prepare(`INSERT INTO content_render_jobs (content_project_deliverable_id, render_provider, render_status, render_payload_json, requested_by_user_id, created_at, updated_at)
      SELECT ?, 'manual_export', 'planned', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (SELECT 1 FROM content_render_jobs WHERE content_project_deliverable_id=? AND render_status IN ('planned','rendering'))
    `).bind(current.content_project_deliverable_id, current.asset_plan_json || '{}', actorUserId || null, current.content_project_deliverable_id).run().catch(() => null);
  }
  await writeProjectEvent(db, Number(projectId), 'deliverable_updated', actorUserId, { content_project_deliverable_id: Number(deliverableId), approval_status: approvalStatus, deliverable_status: deliverableStatus, has_output_url: Boolean(outputUrl) });
  return getContentProjectDetail(db, projectId);
}

export async function queueSocialDeliverable(db, projectId, deliverableId, actorUserId) {
  const item = await db.prepare(`SELECT d.*, p.content_project_key, p.project_title FROM content_project_deliverables d INNER JOIN content_projects p ON p.content_project_id=d.content_project_id WHERE d.content_project_id=? AND d.content_project_deliverable_id=? LIMIT 1`).bind(Number(projectId), Number(deliverableId)).first();
  if (!item) throw new Error('Content deliverable not found.');
  if (!['facebook','instagram','tiktok','youtube'].includes(text(item.channel_key))) throw new Error('Only social/video deliverables can be added to the social review queue.');
  if (text(item.approval_status) !== 'approved') throw new Error('Approve this deliverable before adding it to the social review queue.');
  if (!text(item.output_url)) throw new Error('Add the finished video or image URL before adding this item to the social review queue.');
  const socialKey = `content-${item.content_project_id}-${item.content_project_deliverable_id}`;
  await db.prepare(`
    INSERT INTO social_post_queue (
      social_post_key, source_type, source_id, title, summary, caption, hashtags, target_platforms_json,
      image_urls_json, video_url, link_url, approval_status, post_status, created_by_user_id,
      updated_by_user_id, created_at, updated_at, notes, api_publish_mode
    ) VALUES (?, 'content_project_deliverable', ?, ?, ?, ?, '', ?, '[]', ?, NULL, 'approved', 'draft', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 'review_first')
    ON CONFLICT(social_post_key) DO UPDATE SET
      title=excluded.title, summary=excluded.summary, caption=excluded.caption, video_url=excluded.video_url,
      approval_status='approved', post_status=CASE WHEN social_post_queue.post_status='posted' THEN 'posted' ELSE 'draft' END,
      updated_by_user_id=excluded.updated_by_user_id, updated_at=CURRENT_TIMESTAMP, notes=excluded.notes
  `).bind(
    socialKey,
    String(item.content_project_deliverable_id),
    item.title,
    `${item.project_title} • ${item.deliverable_type}`,
    item.caption || '',
    JSON.stringify([item.channel_key]),
    item.output_url,
    actorUserId || null,
    actorUserId || null,
    `Created by ${CONTENT_STUDIO_BUILD}. Video/image file remains review-first; do not publish until platform preview is checked.`
  ).run();
  const queued = await db.prepare(`SELECT social_post_queue_id FROM social_post_queue WHERE social_post_key=? LIMIT 1`).bind(socialKey).first();
  await db.prepare(`UPDATE content_project_deliverables SET social_post_queue_id=?, updated_at=CURRENT_TIMESTAMP WHERE content_project_deliverable_id=?`).bind(queued?.social_post_queue_id || null, item.content_project_deliverable_id).run();
  await writeProjectEvent(db, Number(projectId), 'deliverable_sent_to_social_queue', actorUserId, { content_project_deliverable_id: Number(deliverableId), social_post_queue_id: queued?.social_post_queue_id || null, channel: item.channel_key });
  return { social_post_queue_id: queued?.social_post_queue_id || null, social_post_key: socialKey };
}

export function makeContentManifest(detail) {
  if (!detail?.project) return {};
  return {
    manifest_version: '1.0',
    generated_by: CONTENT_STUDIO_BUILD,
    generated_at: new Date().toISOString(),
    review_first: true,
    no_auto_publish: true,
    source_media_reference_only: true,
    project: detail.project,
    source_media: detail.media.map((item) => ({
      archive_key: item.archive_key,
      archive_path: item.archive_path,
      source_url: item.source_url,
      media_type: item.media_type,
      selection_score: item.selection_score,
      safety_status: item.safety_status,
      is_selected: Boolean(item.is_selected),
      is_featured: Boolean(item.is_featured)
    })),
    deliverables: detail.deliverables.map((item) => ({
      deliverable_key: item.deliverable_key,
      channel_key: item.channel_key,
      deliverable_type: item.deliverable_type,
      title: item.title,
      aspect_ratio: item.aspect_ratio,
      target_duration_seconds: item.target_duration_seconds,
      asset_plan: safeJson(item.asset_plan_json, {}),
      deliverable_status: item.deliverable_status,
      approval_status: item.approval_status,
      output_url: item.output_url || null
    }))
  };
}
