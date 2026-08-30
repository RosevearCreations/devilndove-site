// Build 200 — review-first public release layer for Content Automation Studio.
// This module prepares and publishes only explicitly approved, public-safe content.
// It never copies, deletes, moves, or overwrites original product/R2 media.

import { requireContentPublicationSchema } from './contentAutomationSchemaReadiness.js';

export const CONTENT_PUBLICATION_BUILD = 'Build 200';

function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max).trim() : clean;
}

function clip(value, max) {
  const clean = text(value).replace(/\s+/g, ' ');
  if (!clean || clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function number(value) { const result = Number(value || 0); return Number.isInteger(result) && result > 0 ? result : 0; }
function safeJson(value, fallback = {}) { try { return JSON.parse(String(value || '')); } catch { return fallback; } }
function asJson(value, fallback = []) { return JSON.stringify(Array.isArray(value) ? value : fallback); }
function slugify(value) { return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96) || 'workshop-story'; }
function normalStatus(value) {
  const key = text(value).toLowerCase();
  return ['draft', 'review', 'approved', 'published', 'archived'].includes(key) ? key : 'draft';
}
function safeDestination(value) {
  const key = text(value).toLowerCase();
  return ['workshop_journal', 'website_gallery'].includes(key) ? key : 'workshop_journal';
}

function mediaAlt(title, index, type = 'image') {
  const label = index === 0 ? 'finished view' : `workshop detail ${index + 1}`;
  return `${title} — ${type === 'video' ? 'video' : label}`;
}

function publicPath(destination, publicationSlug) {
  if (destination === 'website_gallery') return `/gallery/#project-${encodeURIComponent(publicationSlug)}`;
  return `/workshop-journal/story/?story=${encodeURIComponent(publicationSlug)}`;
}

function checklistItem(key, label, pass, detail, required = true) {
  return { key, label, pass: Boolean(pass), detail: text(detail, 260), required: Boolean(required) };
}

async function writeProjectEvent(db, projectId, eventType, actorUserId, details = {}) {
  await db.prepare(`INSERT INTO content_project_events (content_project_id, event_type, actor_user_id, details_json, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(projectId, eventType, actorUserId || null, JSON.stringify(details || {})).run().catch(() => null);
}

async function publicationRow(db, publicationId) {
  return db.prepare(`
    SELECT cpb.*, cp.content_project_key, cp.project_title, cp.factual_summary, cp.product_id,
      p.name AS product_name, p.slug AS product_slug, p.featured_image_url AS product_featured_image_url,
      d.approval_status AS source_approval_status, d.deliverable_status AS source_deliverable_status,
      d.deliverable_key AS source_deliverable_key, d.title AS source_deliverable_title
    FROM content_publications cpb
    INNER JOIN content_projects cp ON cp.content_project_id=cpb.content_project_id
    LEFT JOIN products p ON p.product_id=cp.product_id
    LEFT JOIN content_project_deliverables d ON d.content_project_deliverable_id=cpb.content_project_deliverable_id
    WHERE cpb.content_publication_id=? LIMIT 1
  `).bind(number(publicationId)).first();
}

async function projectContext(db, projectId) {
  const project = await db.prepare(`
    SELECT cp.*, p.name AS product_name, p.slug AS product_slug, p.short_description AS product_short_description,
      p.description AS product_description, p.featured_image_url AS product_featured_image_url
    FROM content_projects cp
    LEFT JOIN products p ON p.product_id=cp.product_id
    WHERE cp.content_project_id=? LIMIT 1
  `).bind(number(projectId)).first();
  if (!project) throw new Error('Content project not found.');
  const deliverables = rows(await db.prepare(`SELECT * FROM content_project_deliverables WHERE content_project_id=? ORDER BY content_project_deliverable_id`).bind(project.content_project_id).all());
  const media = rows(await db.prepare(`SELECT * FROM content_project_media WHERE content_project_id=? AND is_selected=1 AND safety_status='public_allowed' ORDER BY is_featured DESC, selection_score DESC, sort_order ASC, content_project_media_id ASC`).bind(project.content_project_id).all());
  return { project, deliverables, media };
}

function sourceDeliverable(deliverables, key) {
  return deliverables.find((item) => text(item.deliverable_key) === key) || null;
}

function toPublicationSeed(context, destination) {
  const { project, deliverables, media } = context;
  const titleBase = text(project.product_name || project.project_title || 'Workshop story');
  const article = sourceDeliverable(deliverables, 'blog-article');
  const gallery = sourceDeliverable(deliverables, 'website-gallery');
  const source = destination === 'website_gallery' ? gallery : article;
  if (!source) throw new Error(`This content project does not have the ${destination === 'website_gallery' ? 'website gallery' : 'blog article'} deliverable yet. Refresh the project package first.`);
  const hero = media[0]?.source_url || text(project.product_featured_image_url);
  const mediaUrls = media.map((item) => text(item.source_url)).filter(Boolean).slice(0, 12);
  const summary = clip(project.factual_summary || project.product_short_description || project.product_description || source.body_content || '', 360);
  const publicationSlug = destination === 'website_gallery'
    ? `${slugify(titleBase)}-gallery-${project.content_project_id}`
    : `${slugify(titleBase)}-workshop-story-${project.content_project_id}`;
  const publicationTitle = destination === 'website_gallery'
    ? `${titleBase} — finished gallery`
    : (text(source.title, 150) || `From workshop to finished piece: ${titleBase}`);
  const body = destination === 'website_gallery'
    ? `${text(source.body_content)}\n\n${summary ? `About this finished piece: ${summary}` : ''}`.trim()
    : text(source.body_content);
  const description = clip(summary || body || `A workshop story about ${titleBase}.`, 155);
  const productPath = text(project.product_slug) ? `/shop/product/?slug=${encodeURIComponent(project.product_slug)}` : '/shop/';
  const metaTitle = clip(destination === 'website_gallery' ? `${titleBase} gallery | Devil n Dove` : `${publicationTitle} | Devil n Dove`, 60);
  const schema = {
    '@context': 'https://schema.org',
    '@type': destination === 'website_gallery' ? 'ImageGallery' : 'Article',
    headline: publicationTitle,
    description,
    image: hero ? [hero] : [],
    mainEntityOfPage: `https://devilndove.com${publicPath(destination, publicationSlug)}`,
    author: { '@type': 'Organization', name: 'Devil n Dove' },
    about: titleBase,
    isPartOf: { '@type': 'CollectionPage', name: 'Devil n Dove Workshop Journal', url: 'https://devilndove.com/workshop-journal/' }
  };
  return {
    publication_key: `content-project-${project.content_project_id}-${destination}`,
    content_project_id: project.content_project_id,
    content_project_deliverable_id: source.content_project_deliverable_id,
    destination,
    publication_slug: publicationSlug,
    title: publicationTitle,
    summary,
    body_content: body,
    hero_media_url: hero,
    hero_alt_text: hero ? mediaAlt(titleBase, 0) : '',
    media_urls_json: asJson(mediaUrls),
    product_path: productPath,
    canonical_path: publicPath(destination, publicationSlug),
    meta_title: metaTitle,
    meta_description: description,
    schema_json: JSON.stringify(schema),
    source_approval_status: text(source.approval_status),
    source_deliverable_status: text(source.deliverable_status)
  };
}

export async function ensureContentPublicationSchema(db) {
  return requireContentPublicationSchema(db);
}

async function writePublicationEvent(db, publicationId, eventType, actorUserId, details = {}) {
  await db.prepare(`INSERT INTO content_publication_events (content_publication_id, event_type, actor_user_id, details_json, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(number(publicationId), eventType, actorUserId || null, JSON.stringify(details || {})).run().catch(() => null);
}

export function publicationReadiness(row) {
  const media = safeJson(row.media_urls_json, []);
  const destination = safeDestination(row.destination);
  const sourceApproved = text(row.source_approval_status).toLowerCase() === 'approved';
  const bodyMin = destination === 'workshop_journal' ? 160 : 20;
  const checks = [
    checklistItem('source_approved', 'Source deliverable approved', sourceApproved, sourceApproved ? 'The source content package is approved.' : 'Approve the source blog or gallery deliverable in Content Studio.'),
    checklistItem('title', 'Truthful public title', text(row.title).length >= 6, text(row.title).length >= 6 ? 'A reader-facing title is present.' : 'Add a clear factual title.'),
    checklistItem('summary', 'Helpful summary', text(row.summary).length >= 30, text(row.summary).length >= 30 ? 'A visible summary is present.' : 'Add at least one useful factual sentence.'),
    checklistItem('body', destination === 'workshop_journal' ? 'Article body' : 'Gallery explanation', text(row.body_content).length >= bodyMin, text(row.body_content).length >= bodyMin ? 'Visible copy is present.' : `Add ${destination === 'workshop_journal' ? 'a fuller factual article body' : 'a factual gallery explanation'}.`),
    checklistItem('public_media', 'Public-cleared media', Array.isArray(media) && media.length > 0, Array.isArray(media) && media.length ? 'At least one selected media source is public-allowed.' : 'Select at least one public-allowed image in Content Studio.'),
    checklistItem('hero', 'Lead image and alt text', Boolean(text(row.hero_media_url) && text(row.hero_alt_text)), text(row.hero_media_url) && text(row.hero_alt_text) ? 'A lead media URL and descriptive text are present.' : 'Choose a public image and add concise descriptive alt text.'),
    checklistItem('slug', 'Stable public path', /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(row.publication_slug)), /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(row.publication_slug)) ? 'The public path uses a clean slug.' : 'Use lowercase letters, numbers, and hyphens only.'),
    checklistItem('meta', 'Search snippet copy', text(row.meta_title).length >= 10 && text(row.meta_description).length >= 50, text(row.meta_title).length >= 10 && text(row.meta_description).length >= 50 ? 'Title and description are prepared.' : 'Add a useful title and description that match visible content.'),
    checklistItem('meta_title_length', 'Title-length review', text(row.meta_title).length <= 60, text(row.meta_title).length <= 60 ? 'Title stays compact.' : 'Shorten title where possible; this is a quality review, not a hard indexing guarantee.', false),
    checklistItem('meta_description_length', 'Description-length review', text(row.meta_description).length <= 160, text(row.meta_description).length <= 160 ? 'Description stays compact.' : 'Shorten description where possible; this is a quality review, not a hard indexing guarantee.', false)
  ];
  const blockers = checks.filter((item) => item.required && !item.pass);
  return { ready: blockers.length === 0, checks, blockers };
}

function normalizePublication(row) {
  const item = { ...row };
  item.content_publication_id = number(item.content_publication_id);
  item.content_project_id = number(item.content_project_id);
  item.content_project_deliverable_id = number(item.content_project_deliverable_id) || null;
  item.destination = safeDestination(item.destination);
  item.content_status = normalStatus(item.content_status);
  item.media_urls = safeJson(item.media_urls_json, []);
  item.metrics = safeJson(item.metrics_json, {});
  item.readiness = publicationReadiness(item);
  item.public_url = item.content_status === 'published' ? item.canonical_path : '';
  return item;
}

export async function listContentPublications(db, projectId = 0) {
  const where = number(projectId) ? 'WHERE cpb.content_project_id=?' : '';
  const result = await db.prepare(`
    SELECT cpb.*, cp.content_project_key, cp.project_title, cp.factual_summary, cp.product_id,
      p.name AS product_name, p.slug AS product_slug,
      d.approval_status AS source_approval_status, d.deliverable_status AS source_deliverable_status,
      d.deliverable_key AS source_deliverable_key
    FROM content_publications cpb
    INNER JOIN content_projects cp ON cp.content_project_id=cpb.content_project_id
    LEFT JOIN products p ON p.product_id=cp.product_id
    LEFT JOIN content_project_deliverables d ON d.content_project_deliverable_id=cpb.content_project_deliverable_id
    ${where}
    ORDER BY CASE cpb.content_status WHEN 'review' THEN 1 WHEN 'draft' THEN 2 WHEN 'approved' THEN 3 WHEN 'published' THEN 4 ELSE 5 END,
      datetime(cpb.updated_at) DESC, cpb.content_publication_id DESC
    LIMIT 160
  `).bind(...(number(projectId) ? [number(projectId)] : [])).all();
  return rows(result).map(normalizePublication);
}

export async function prepareContentPublications(db, projectId, actorUserId) {
  const context = await projectContext(db, projectId);
  const results = [];
  for (const destination of ['workshop_journal', 'website_gallery']) {
    const seed = toPublicationSeed(context, destination);
    const existing = await db.prepare(`SELECT * FROM content_publications WHERE publication_key=? LIMIT 1`).bind(seed.publication_key).first();
    if (!existing) {
      await db.prepare(`
        INSERT INTO content_publications (
          publication_key, content_project_id, content_project_deliverable_id, destination, publication_slug,
          title, summary, body_content, hero_media_url, hero_alt_text, media_urls_json, product_path,
          canonical_path, meta_title, meta_description, schema_json, content_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'review', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        seed.publication_key, seed.content_project_id, seed.content_project_deliverable_id, seed.destination, seed.publication_slug,
        seed.title, seed.summary || null, seed.body_content || null, seed.hero_media_url || null, seed.hero_alt_text || null,
        seed.media_urls_json, seed.product_path || null, seed.canonical_path, seed.meta_title || null, seed.meta_description || null, seed.schema_json
      ).run();
    } else if (Number(existing.copy_locked || 0) !== 1) {
      await db.prepare(`
        UPDATE content_publications SET content_project_deliverable_id=?, destination=?, publication_slug=?, title=?, summary=?, body_content=?,
          hero_media_url=?, hero_alt_text=?, media_urls_json=?, product_path=?, canonical_path=?, meta_title=?, meta_description=?, schema_json=?,
          content_status=CASE WHEN content_status IN ('published','approved') THEN content_status ELSE 'review' END,
          updated_at=CURRENT_TIMESTAMP
        WHERE content_publication_id=?
      `).bind(
        seed.content_project_deliverable_id, seed.destination, seed.publication_slug, seed.title, seed.summary || null, seed.body_content || null,
        seed.hero_media_url || null, seed.hero_alt_text || null, seed.media_urls_json, seed.product_path || null, seed.canonical_path,
        seed.meta_title || null, seed.meta_description || null, seed.schema_json, existing.content_publication_id
      ).run();
    }
    const current = await db.prepare(`SELECT content_publication_id FROM content_publications WHERE publication_key=? LIMIT 1`).bind(seed.publication_key).first();
    if (current?.content_publication_id) {
      await writePublicationEvent(db, current.content_publication_id, existing ? 'publication_refreshed' : 'publication_prepared', actorUserId, { destination, copy_locked: Number(existing?.copy_locked || 0) === 1 });
      results.push(number(current.content_publication_id));
    }
  }
  await writeProjectEvent(db, context.project.content_project_id, 'publications_prepared', actorUserId, { publication_ids: results, source_media_reference_only: true });
  return (await Promise.all(results.map((id) => publicationRow(db, id)))).filter(Boolean).map(normalizePublication);
}

export async function updateContentPublication(db, publicationId, patch, actorUserId) {
  const current = await publicationRow(db, publicationId);
  if (!current) throw new Error('Publication draft not found.');
  const destination = safeDestination(patch.destination ?? current.destination);
  const title = clip(patch.title ?? current.title, 180) || current.title;
  const publicationSlug = slugify(patch.publication_slug ?? current.publication_slug);
  const summary = clip(patch.summary ?? current.summary, 700) || null;
  const body = text(patch.body_content ?? current.body_content, 30000) || null;
  const heroUrl = text(patch.hero_media_url ?? current.hero_media_url, 1800) || null;
  const heroAlt = clip(patch.hero_alt_text ?? current.hero_alt_text, 300) || null;
  const mediaUrlsRaw = patch.media_urls == null ? safeJson(current.media_urls_json, []) : patch.media_urls;
  const mediaUrls = (Array.isArray(mediaUrlsRaw) ? mediaUrlsRaw : safeJson(mediaUrlsRaw, [])).map((item) => text(item, 1800)).filter(Boolean).slice(0, 16);
  const canonicalPath = publicPath(destination, publicationSlug);
  const metaTitle = clip(patch.meta_title ?? current.meta_title, 120) || clip(`${title} | Devil n Dove`, 60);
  const metaDescription = clip(patch.meta_description ?? current.meta_description, 360) || clip(summary || body || '', 155);
  const status = patch.content_status == null ? normalStatus(current.content_status) : normalStatus(patch.content_status);
  const copyLocked = patch.copy_locked == null ? Number(current.copy_locked || 0) : (Number(patch.copy_locked) === 1 ? 1 : 0);
  const schema = {
    '@context': 'https://schema.org',
    '@type': destination === 'website_gallery' ? 'ImageGallery' : 'Article',
    headline: title,
    description: metaDescription || summary || '',
    image: heroUrl ? [heroUrl] : [],
    mainEntityOfPage: `https://devilndove.com${canonicalPath}`,
    author: { '@type': 'Organization', name: 'Devil n Dove' },
    about: current.product_name || current.project_title || title,
    isPartOf: { '@type': 'CollectionPage', name: 'Devil n Dove Workshop Journal', url: 'https://devilndove.com/workshop-journal/' }
  };
  await db.prepare(`
    UPDATE content_publications SET destination=?, publication_slug=?, title=?, summary=?, body_content=?, hero_media_url=?, hero_alt_text=?,
      media_urls_json=?, canonical_path=?, meta_title=?, meta_description=?, schema_json=?, content_status=?, review_notes=?, copy_locked=?, updated_at=CURRENT_TIMESTAMP
    WHERE content_publication_id=?
  `).bind(
    destination, publicationSlug, title, summary, body, heroUrl, heroAlt, asJson(mediaUrls), canonicalPath, metaTitle, metaDescription,
    JSON.stringify(schema), status, clip(patch.review_notes ?? current.review_notes, 2600) || null, copyLocked, current.content_publication_id
  ).run();
  await writePublicationEvent(db, current.content_publication_id, 'publication_updated', actorUserId, { content_status: status, copy_locked: copyLocked });
  return normalizePublication(await publicationRow(db, current.content_publication_id));
}

export async function approveContentPublication(db, publicationId, actorUserId) {
  const current = await publicationRow(db, publicationId);
  if (!current) throw new Error('Publication draft not found.');
  const readiness = publicationReadiness(current);
  if (!readiness.ready) throw new Error(`Cannot approve this public draft yet: ${readiness.blockers.map((item) => item.label).join(', ')}.`);
  await db.prepare(`UPDATE content_publications SET content_status='approved', approved_by_user_id=?, approved_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE content_publication_id=?`).bind(actorUserId || null, current.content_publication_id).run();
  await writePublicationEvent(db, current.content_publication_id, 'publication_approved', actorUserId, { readiness_passed: true });
  await writeProjectEvent(db, current.content_project_id, 'publication_approved', actorUserId, { content_publication_id: current.content_publication_id, destination: current.destination });
  return normalizePublication(await publicationRow(db, current.content_publication_id));
}

export async function publishContentPublication(db, publicationId, actorUserId) {
  const current = await publicationRow(db, publicationId);
  if (!current) throw new Error('Publication draft not found.');
  if (normalStatus(current.content_status) !== 'approved') throw new Error('Approve the public draft before publishing it.');
  const readiness = publicationReadiness(current);
  if (!readiness.ready) throw new Error(`Cannot publish this public draft yet: ${readiness.blockers.map((item) => item.label).join(', ')}.`);
  await db.prepare(`UPDATE content_publications SET content_status='published', published_by_user_id=?, published_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE content_publication_id=?`).bind(actorUserId || null, current.content_publication_id).run();
  await writePublicationEvent(db, current.content_publication_id, 'publication_published', actorUserId, { public_path: current.canonical_path, destination: current.destination });
  await writeProjectEvent(db, current.content_project_id, 'publication_published', actorUserId, { content_publication_id: current.content_publication_id, destination: current.destination, public_path: current.canonical_path });
  return normalizePublication(await publicationRow(db, current.content_publication_id));
}

export async function unpublishContentPublication(db, publicationId, actorUserId) {
  const current = await publicationRow(db, publicationId);
  if (!current) throw new Error('Publication draft not found.');
  await db.prepare(`UPDATE content_publications SET content_status='approved', unpublished_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE content_publication_id=?`).bind(current.content_publication_id).run();
  await writePublicationEvent(db, current.content_publication_id, 'publication_unpublished', actorUserId, { previous_status: current.content_status });
  await writeProjectEvent(db, current.content_project_id, 'publication_unpublished', actorUserId, { content_publication_id: current.content_publication_id, destination: current.destination });
  return normalizePublication(await publicationRow(db, current.content_publication_id));
}

export async function updatePublicationMetrics(db, publicationId, patch, actorUserId) {
  const current = await publicationRow(db, publicationId);
  if (!current) throw new Error('Publication draft not found.');
  const existing = safeJson(current.metrics_json, {});
  const numericMetric = (value, fallback = 0) => Math.max(0, Math.floor(Number(value == null ? fallback : value) || 0));
  const metrics = {
    ...existing,
    views: numericMetric(patch.views, existing.views),
    clicks: numericMetric(patch.clicks, existing.clicks),
    saves: numericMetric(patch.saves, existing.saves),
    enquiries: numericMetric(patch.enquiries, existing.enquiries),
    source_note: clip(patch.source_note ?? existing.source_note, 280),
    measured_at: new Date().toISOString()
  };
  await db.prepare(`UPDATE content_publications SET metrics_json=?, updated_at=CURRENT_TIMESTAMP WHERE content_publication_id=?`).bind(JSON.stringify(metrics), current.content_publication_id).run();
  await writePublicationEvent(db, current.content_publication_id, 'publication_metrics_recorded', actorUserId, metrics);
  return normalizePublication(await publicationRow(db, current.content_publication_id));
}

function toPublicItem(row) {
  const item = normalizePublication(row);
  return {
    content_publication_id: item.content_publication_id,
    destination: item.destination,
    publication_slug: item.publication_slug,
    title: item.title,
    summary: item.summary || '',
    body_content: item.body_content || '',
    hero_media_url: item.hero_media_url || '',
    hero_alt_text: item.hero_alt_text || '',
    media_urls: item.media_urls,
    product_path: item.product_path || '/shop/',
    canonical_path: item.canonical_path || '',
    meta_title: item.meta_title || item.title,
    meta_description: item.meta_description || item.summary || '',
    schema_json: item.schema_json || '{}',
    related_story_path: item.related_story_path || '',
    published_at: item.published_at || '',
    updated_at: item.updated_at || ''
  };
}

export async function publicContentPublications(db, { destination = 'workshop_journal', slug = '', limit = 12 } = {}) {
  const target = safeDestination(destination);
  const cap = Math.max(1, Math.min(30, Number(limit || 12) || 12));
  const relatedStorySelect = target === 'website_gallery'
    ? `, (SELECT related.canonical_path FROM content_publications related WHERE related.content_project_id=content_publications.content_project_id AND related.destination='workshop_journal' AND related.content_status='published' ORDER BY datetime(related.published_at) DESC, related.content_publication_id DESC LIMIT 1) AS related_story_path`
    : `, '' AS related_story_path`;
  if (text(slug)) {
    const item = await db.prepare(`SELECT content_publications.* ${relatedStorySelect} FROM content_publications WHERE destination=? AND publication_slug=? AND content_status='published' LIMIT 1`).bind(target, slugify(slug)).first();
    return item ? toPublicItem(item) : null;
  }
  const result = await db.prepare(`SELECT content_publications.* ${relatedStorySelect} FROM content_publications WHERE destination=? AND content_status='published' ORDER BY datetime(published_at) DESC, content_publication_id DESC LIMIT ?`).bind(target, cap).all();
  return rows(result).map((item) => toPublicItem(item));
}
