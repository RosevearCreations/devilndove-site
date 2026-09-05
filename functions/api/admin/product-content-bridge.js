// Build 207 — product-centered Content Studio / CAIP bridge.
// Read-first, review-first, and source-safe: this route reports the status of a
// product's content package and CAIP project. Explicit admin actions can create
// or refresh the reference-only package and CAIP mirror; it never publishes,
// alters source media, grants rights, or creates derivatives.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  CONTENT_STUDIO_BUILD,
  createOrRefreshContentProjectForProduct
} from '../_lib/contentAutomationStudio.js';
import { requireContentAutomationSchema } from '../_lib/contentAutomationSchemaReadiness.js';
import {
  CAIP_BUILD,
  ensureCreativeAssetIntelligenceSchema,
  syncCreativeProjectFromContentProject
} from '../_lib/creativeAssetIntelligence.js';

function json(data, status = 200) {
  return jsonResponse(data, status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function clean(value, max = 0) {
  const normalized = normalizeText(value);
  return max && normalized.length > max ? normalized.slice(0, max) : normalized;
}


async function tableExists(db, tableName) {
  const found = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first().catch(() => null);
  return Boolean(found);
}

async function requireAdmin(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

function productEligible(product) {
  const review = clean(product?.review_status).toLowerCase();
  return ['approved', 'published'].includes(review);
}

function packageStage(contentProject, creativeProject) {
  if (!contentProject) return 'not_started';
  if (!creativeProject) return 'content_ready';
  return 'caip_ready';
}

async function productSummary(db, productId) {
  const product = await db.prepare(`
    SELECT product_id, product_number, slug, sku, name, product_category, status, review_status,
           featured_image_url, updated_at
    FROM products
    WHERE product_id=?
    LIMIT 1
  `).bind(productId).first();
  if (!product) return null;

  const [imageCount, mediaAssetCount] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS count FROM product_images WHERE product_id=?').bind(productId).first().catch(() => ({ count: 0 })),
    db.prepare("SELECT COUNT(*) AS count FROM media_assets WHERE product_id=? AND COALESCE(deleted_at,'')='' AND TRIM(COALESCE(public_url,''))<>''").bind(productId).first().catch(() => ({ count: 0 }))
  ]);

  return {
    product_id: Number(product.product_id || 0),
    product_number: product.product_number || null,
    slug: clean(product.slug),
    sku: clean(product.sku),
    name: clean(product.name) || `Product ${productId}`,
    product_category: clean(product.product_category),
    status: clean(product.status) || 'draft',
    review_status: clean(product.review_status) || 'needs_review',
    featured_image_url: clean(product.featured_image_url),
    updated_at: product.updated_at || null,
    is_content_eligible: productEligible(product) ? 1 : 0,
    product_image_count: Number(imageCount?.count || 0),
    media_asset_count: Number(mediaAssetCount?.count || 0)
  };
}

async function countRow(db, sql, bindings = []) {
  const row = await db.prepare(sql).bind(...bindings).first().catch(() => null);
  return row || {};
}

async function readBridge(db, productId) {
  const product = await productSummary(db, productId);
  if (!product) return { product: null, stage: 'missing', content: null, caip: null, schema: { content_studio: false, caip: false } };

  const [contentSchemaReady, caipSchemaReady, contentMediaReady, contentDeliverablesReady,
    creativeAssetsReady, creativeEvidenceReady, creativeSegmentsReady] = await Promise.all([
    tableExists(db, 'content_projects'),
    tableExists(db, 'creative_projects'),
    tableExists(db, 'content_project_media'),
    tableExists(db, 'content_project_deliverables'),
    tableExists(db, 'creative_assets'),
    tableExists(db, 'creative_story_evidence'),
    tableExists(db, 'creative_story_segments')
  ]);

  let contentProject = null;
  let creativeProject = null;

  if (contentSchemaReady) {
    contentProject = await db.prepare(`
      SELECT content_project_id, content_project_key, project_title, project_status, review_status,
             public_release_status, updated_at, created_at
      FROM content_projects
      WHERE product_id=? OR (source_type='product' AND source_id=?)
      ORDER BY datetime(COALESCE(updated_at,created_at,CURRENT_TIMESTAMP)) DESC, content_project_id DESC
      LIMIT 1
    `).bind(productId, String(productId)).first().catch(() => null);
  }

  if (contentProject && caipSchemaReady) {
    creativeProject = await db.prepare(`
      SELECT creative_project_id, creative_project_key, project_status, governance_status,
             lifecycle_stage, updated_at, created_at
      FROM creative_projects
      WHERE content_project_id=? OR product_id=?
      ORDER BY datetime(COALESCE(updated_at,created_at,CURRENT_TIMESTAMP)) DESC, creative_project_id DESC
      LIMIT 1
    `).bind(Number(contentProject.content_project_id || 0), productId).first().catch(() => null);
  }

  const contentProjectId = Number(contentProject?.content_project_id || 0);
  const creativeProjectId = Number(creativeProject?.creative_project_id || 0);
  const [contentCounts, contentDeliverableCounts, caipAssetCounts, caipEvidenceCounts, caipSegmentCounts] = await Promise.all([
    contentProjectId && contentMediaReady
      ? countRow(db, `SELECT COUNT(*) AS media_total,
          SUM(CASE WHEN is_selected=1 THEN 1 ELSE 0 END) AS selected_media,
          SUM(CASE WHEN lower(COALESCE(safety_status,''))='public_allowed' THEN 1 ELSE 0 END) AS public_allowed_media,
          SUM(CASE WHEN lower(COALESCE(safety_status,''))='blocked' THEN 1 ELSE 0 END) AS blocked_media
        FROM content_project_media WHERE content_project_id=?`, [contentProjectId])
      : {},
    contentProjectId && contentDeliverablesReady
      ? countRow(db, `SELECT COUNT(*) AS total,
          SUM(CASE WHEN lower(COALESCE(approval_status,''))='approved' THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN lower(COALESCE(deliverable_status,''))='ready_for_review' THEN 1 ELSE 0 END) AS ready_for_review
        FROM content_project_deliverables WHERE content_project_id=?`, [contentProjectId])
      : {},
    creativeProjectId && creativeAssetsReady
      ? countRow(db, `SELECT COUNT(*) AS assets,
          SUM(CASE WHEN lower(COALESCE(rights_status,''))='public_allowed' THEN 1 ELSE 0 END) AS public_allowed,
          SUM(CASE WHEN lower(COALESCE(rights_status,''))='needs_review' THEN 1 ELSE 0 END) AS needs_review,
          SUM(CASE WHEN lower(COALESCE(rights_status,''))='blocked' THEN 1 ELSE 0 END) AS blocked
        FROM creative_assets WHERE creative_project_id=?`, [creativeProjectId])
      : {},
    creativeProjectId && creativeEvidenceReady
      ? countRow(db, `SELECT COUNT(*) AS evidence FROM creative_story_evidence WHERE creative_project_id=?`, [creativeProjectId])
      : {},
    creativeProjectId && creativeSegmentsReady
      ? countRow(db, `SELECT SUM(CASE WHEN lower(COALESCE(segment_status,''))='approved' THEN 1 ELSE 0 END) AS approved_segments
        FROM creative_story_segments WHERE creative_project_id=?`, [creativeProjectId])
      : {}
  ]);

  return {
    product,
    stage: packageStage(contentProject, creativeProject),
    schema: {
      content_studio: contentSchemaReady,
      caip: caipSchemaReady,
      content_media: contentMediaReady,
      content_deliverables: contentDeliverablesReady,
      creative_assets: creativeAssetsReady
    },
    content: contentProject ? {
      content_project_id: contentProjectId,
      content_project_key: clean(contentProject.content_project_key),
      project_title: clean(contentProject.project_title),
      project_status: clean(contentProject.project_status) || 'draft',
      review_status: clean(contentProject.review_status) || 'needs_review',
      public_release_status: clean(contentProject.public_release_status) || 'private',
      updated_at: contentProject.updated_at || null,
      counts: {
        media_total: Number(contentCounts.media_total || 0),
        selected_media: Number(contentCounts.selected_media || 0),
        public_allowed_media: Number(contentCounts.public_allowed_media || 0),
        blocked_media: Number(contentCounts.blocked_media || 0),
        total: Number(contentDeliverableCounts.total || 0),
        approved: Number(contentDeliverableCounts.approved || 0),
        ready_for_review: Number(contentDeliverableCounts.ready_for_review || 0)
      }
    } : null,
    caip: creativeProject ? {
      creative_project_id: creativeProjectId,
      creative_project_key: clean(creativeProject.creative_project_key),
      project_status: clean(creativeProject.project_status) || 'intake',
      governance_status: clean(creativeProject.governance_status) || 'needs_review',
      lifecycle_stage: clean(creativeProject.lifecycle_stage) || 'intake',
      updated_at: creativeProject.updated_at || null,
      counts: {
        assets: Number(caipAssetCounts.assets || 0),
        public_allowed: Number(caipAssetCounts.public_allowed || 0),
        needs_review: Number(caipAssetCounts.needs_review || 0),
        blocked: Number(caipAssetCounts.blocked || 0),
        evidence: Number(caipEvidenceCounts.evidence || 0),
        approved_segments: Number(caipSegmentCounts.approved_segments || 0)
      }
    } : null,
    source_media_unchanged: true,
    public_release_unchanged: true
  };
}
export async function onRequestGet(context) {
  const access = await requireAdmin(context);
  if (access.error) return access.error;
  const productId = number(new URL(context.request.url).searchParams.get('product_id'));
  if (!productId) return json({ ok: false, error: 'A valid product_id is required.' }, 400);

  try {
    const bridge = await readBridge(access.db, productId);
    if (!bridge.product) return json({ ok: false, error: 'Product not found.' }, 404);
    return json({
      ok: true,
      build: 'Build 207',
      content_studio_build: CONTENT_STUDIO_BUILD,
      caip_build: CAIP_BUILD,
      bridge,
      mode: 'explicit_review_first_reference_only'
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'product_content_bridge',
      incident_code: 'product_content_bridge_get_failed',
      severity: 'warning',
      message: error?.message || 'Could not load product Content Studio / CAIP status.',
      related_user_id: access.adminUser.user_id,
      details: { product_id: productId, error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: 'Could not load this product’s Content Studio / CAIP status.' }, 500);
  }
}

export async function onRequestPost(context) {
  const access = await requireAdmin(context);
  if (access.error) return access.error;
  let body = {};
  try { body = await context.request.json(); } catch {}
  const productId = number(body.product_id);
  const action = clean(body.action).toLowerCase();
  if (!productId) return json({ ok: false, error: 'A valid product_id is required.' }, 400);
  if (!['create_or_refresh_package', 'refresh_caip'].includes(action)) {
    return json({ ok: false, error: 'Unsupported product content bridge action.' }, 400);
  }

  try {
    const before = await readBridge(access.db, productId);
    if (!before.product) return json({ ok: false, error: 'Product not found.' }, 404);

    await requireContentAutomationSchema(access.db);
    await ensureCreativeAssetIntelligenceSchema(access.db);
    let contentProjectId = Number(before.content?.content_project_id || 0);
    let result = {};

    if (action === 'create_or_refresh_package') {
      if (!before.product.is_content_eligible) {
        return json({
          ok: false,
          error: 'Only an approved or published product can create or refresh a Content Studio package.',
          code: 'PRODUCT_NOT_CONTENT_ELIGIBLE',
          hint: 'Approve the finished product first. This keeps unfinished listing copy and media out of content planning.'
        }, 409);
      }
      const created = await createOrRefreshContentProjectForProduct(access.db, productId, access.adminUser.user_id, { refresh_copy: Number(body.refresh_copy) === 1 });
      contentProjectId = Number(created?.project?.content_project_id || 0);
      result = {
        content_project_id: contentProjectId,
        archived_count: Number(created?.archived_count || 0),
        deliverables_created: Number(created?.deliverables_created || 0),
        action: 'content_package_created_or_refreshed'
      };
    }

    if (!contentProjectId) {
      return json({
        ok: false,
        error: 'Create the Content Studio package before refreshing CAIP.',
        code: 'CONTENT_PACKAGE_REQUIRED'
      }, 409);
    }

    const caip = await syncCreativeProjectFromContentProject(access.db, contentProjectId, access.adminUser.user_id, {
      trigger: action === 'refresh_caip' ? 'catalog_media_bridge_caip_refresh' : 'catalog_media_bridge_create_or_refresh'
    });
    result = {
      ...result,
      content_project_id: contentProjectId,
      creative_project_id: Number(caip?.project?.creative_project_id || 0) || null,
      caip_asset_count: Number(caip?.asset_count || 0),
      caip_recommendation_count: Number(caip?.recommendation_count || 0),
      source_media_unchanged: true,
      public_release_unchanged: true
    };

    const bridge = await readBridge(access.db, productId);
    await auditAdminAction(context.env, context.request, access.adminUser, {
      action_type: `product_content_bridge_${action}`,
      target_type: 'product',
      target_id: productId,
      target_key: before.product.slug || before.product.sku || String(productId),
      details: result
    });

    return json({
      ok: true,
      message: action === 'refresh_caip'
        ? 'CAIP was refreshed from the existing Content Studio package. Source media and public release remain unchanged.'
        : 'Content Studio package and CAIP reference project were refreshed. Source media and public release remain unchanged.',
      result,
      bridge,
      mode: 'explicit_review_first_reference_only'
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'product_content_bridge',
      incident_code: 'product_content_bridge_post_failed',
      severity: 'warning',
      message: error?.message || 'Could not update product Content Studio / CAIP status.',
      related_user_id: access.adminUser.user_id,
      details: { product_id: productId, action, error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: error?.message || 'Could not update the product content package.' }, 400);
  }
}
