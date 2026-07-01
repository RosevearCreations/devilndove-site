import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";
import { createOrRefreshContentProjectForProduct } from "../_lib/contentAutomationStudio.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function nr(result) { return Array.isArray(result?.results) ? result.results : []; }
async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(nr(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch { return new Set(); }
}
async function ensureProductReviewSupportTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_seo (
    product_id INTEGER PRIMARY KEY,
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT,
    h1_override TEXT,
    canonical_url TEXT,
    schema_type TEXT DEFAULT 'Product',
    og_title TEXT,
    og_description TEXT,
    og_image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_images (
    product_image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_image_annotations (
    product_image_annotation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_image_id INTEGER,
    image_url TEXT,
    alt_text TEXT,
    image_role TEXT,
    public_use_status TEXT DEFAULT 'internal_review',
    width_px INTEGER,
    height_px INTEGER,
    image_orientation TEXT,
    merchandising_score INTEGER,
    first_image_score INTEGER,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_review_actions (
    product_review_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    previous_review_status TEXT,
    new_review_status TEXT,
    previous_status TEXT,
    new_status TEXT,
    actor_user_id INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}

async function ensurePublishOverrideTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_publish_overrides (
    product_publish_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    actor_user_id INTEGER,
    override_note TEXT,
    publish_readiness_score INTEGER,
    image_quality_score INTEGER,
    ready_check_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
}

async function ensureProductReadinessColumns(db) {
  const cols = await getTableColumnSet(db, "products");
  if (!cols.has('publish_readiness_score')) await db.prepare(`ALTER TABLE products ADD COLUMN publish_readiness_score INTEGER`).run().catch(() => null);
  if (!cols.has('image_quality_score')) await db.prepare(`ALTER TABLE products ADD COLUMN image_quality_score INTEGER`).run().catch(() => null);
  if (!cols.has('is_ready_for_storefront')) await db.prepare(`ALTER TABLE products ADD COLUMN is_ready_for_storefront INTEGER NOT NULL DEFAULT 0`).run().catch(() => null);
  if (!cols.has('ready_check_notes')) await db.prepare(`ALTER TABLE products ADD COLUMN ready_check_notes TEXT`).run().catch(() => null);
}

function buildReadiness(row = {}) {
  const imageCount = Number(row.image_count || 0);
  const altCoverage = Number(row.alt_coverage_count || 0);
  const firstOrientation = String(row.first_image_orientation || '').toLowerCase();
  const firstWidth = Number(row.first_width_px || 0);
  const firstHeight = Number(row.first_height_px || 0);
  const firstMerchandisingScore = Number(row.first_merchandising_score ?? row.first_image_score ?? 0);
  const averageMerchandisingScore = Number(row.average_merchandising_score || 0);
  const missingImageRoleCount = Number(row.missing_image_role_count || 0);
  const heroImageRoleCount = Number(row.hero_image_role_count || 0);
  const blockedPublicUseCount = Number(row.blocked_public_use_count || 0);
  const knowsDims = firstWidth > 0 && firstHeight > 0;
  const checks = {
    has_name: normalizeText(row.name).length > 0,
    has_slug: normalizeText(row.slug).length > 0,
    has_price: Number(row.price_cents || 0) > 0,
    has_featured_image: normalizeText(row.featured_image_url).length > 0,
    has_image_count: imageCount >= 3,
    has_image_alt: imageCount > 0 && altCoverage >= Math.min(3, imageCount),
    has_short_description: normalizeText(row.short_description).length >= 40,
    has_meta_title: normalizeText(row.meta_title).length >= 10,
    has_meta_description: normalizeText(row.meta_description).length >= 50,
    has_category: normalizeText(row.product_category).length > 0,
    first_image_shape: !knowsDims || ['square', 'landscape'].includes(firstOrientation),
    first_image_size: !knowsDims || (firstWidth >= 800 && firstHeight >= 800),
    first_image_merchandising: !normalizeText(row.featured_image_url) || firstMerchandisingScore >= 72,
    gallery_merchandising: imageCount === 0 || averageMerchandisingScore >= 64,
    image_roles_documented: imageCount === 0 || missingImageRoleCount === 0,
    hero_role_present: imageCount === 0 || heroImageRoleCount > 0,
    public_use_allowed: blockedPublicUseCount === 0
  };
  const weights = { has_name:10, has_slug:8, has_price:12, has_featured_image:12, has_image_count:12, has_image_alt:8, has_short_description:10, has_meta_title:8, has_meta_description:8, has_category:4, first_image_shape:4, first_image_size:4, first_image_merchandising:6, gallery_merchandising:4, image_roles_documented:8, hero_role_present:6, public_use_allowed:8 };
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const earned = Object.entries(checks).reduce((sum, [key, ok]) => sum + (ok ? Number(weights[key] || 0) : 0), 0);
  const labelMap = {
    has_name: 'product name',
    has_slug: 'slug',
    has_price: 'price greater than $0',
    has_featured_image: 'featured image',
    has_image_count: 'at least 3 product images',
    has_image_alt: 'usable alt text on images',
    has_short_description: 'short description of at least 40 characters',
    has_meta_title: 'SEO title',
    has_meta_description: 'SEO meta description',
    has_category: 'product category',
    first_image_shape: 'first image must be square or landscape',
    first_image_size: 'first image should be at least 800×800',
    first_image_merchandising: 'lead image merchandising score of at least 72%',
    gallery_merchandising: 'gallery merchandising score of at least 64%',
    image_roles_documented: 'image roles documented for each image',
    hero_role_present: 'one image marked Hero/front',
    public_use_allowed: 'all public images cleared for public use or consent'
  };
  const failedKeys = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  const failedLabels = failedKeys.map((key) => labelMap[key] || key);
  const publishScore = total > 0 ? Math.round((earned / total) * 100) : 0;
  const imageScore = Math.round(([
    normalizeText(row.featured_image_url).length > 0 ? 1 : 0,
    Math.min(imageCount, 5) / 5,
    imageCount > 0 ? Math.min(altCoverage / imageCount, 1) : 0,
    firstMerchandisingScore / 100,
    averageMerchandisingScore / 100
  ].reduce((sum, v) => sum + v, 0) / 5) * 100);
  return {
    is_ready_for_storefront: failedKeys.length === 0 ? 1 : 0,
    ready_check_notes: failedLabels.join(", "),
    missing_image_role_count: missingImageRoleCount,
    hero_image_role_count: heroImageRoleCount,
    blocked_public_use_count: blockedPublicUseCount,
    publish_readiness_score: publishScore,
    image_quality_score: imageScore,
    merchandising_score: averageMerchandisingScore,
    lead_image_merchandising_score: firstMerchandisingScore,
    readiness_checks: checks
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);
  await ensureProductReviewSupportTables(db);
  await ensurePublishOverrideTable(db);
  await ensureProductReadinessColumns(db);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON body." }, 400); }

  const productId = Number(body.product_id || 0);
  const action = normalizeText(body.action).toLowerCase();
  const note = normalizeText(body.note).slice(0, 1000);
  if (!productId) return json({ ok: false, error: "product_id is required." }, 400);
  if (!["approve", "request_changes", "publish", "publish_override", "unpublish"].includes(action)) {
    return json({ ok: false, error: "action must be approve, request_changes, publish, publish_override, or unpublish." }, 400);
  }

  if (["publish", "publish_override", "unpublish"].includes(action)) {
    const stepUp = await requireAdminStepUp(request, env, adminUser, body, `${action} action`);
    if (!stepUp.ok) return stepUp.response;
  }

  // Approval must not leave an otherwise retained gallery without its storefront lead image.
  // This is a repair only: it fills a blank product field from sort_order zero and never deletes media.
  await db.prepare(`
    UPDATE products
    SET featured_image_url = (
      SELECT pi.image_url
      FROM product_images pi
      WHERE pi.product_id = products.product_id
        AND TRIM(COALESCE(pi.image_url, '')) <> ''
      ORDER BY COALESCE(pi.sort_order, 0) ASC, pi.product_image_id ASC
      LIMIT 1
    ), updated_at = CURRENT_TIMESTAMP
    WHERE product_id = ?
      AND TRIM(COALESCE(featured_image_url, '')) = ''
      AND EXISTS (
        SELECT 1 FROM product_images pi
        WHERE pi.product_id = products.product_id
          AND TRIM(COALESCE(pi.image_url, '')) <> ''
      )
  `).bind(productId).run().catch(() => null);

  const annotationCols = await getTableColumnSet(db, 'product_image_annotations');
  const row = await db.prepare(`
    SELECT p.*, ps.meta_title, ps.meta_description,
           COUNT(DISTINCT pi.product_image_id) AS image_count,
           COUNT(DISTINCT CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,''))) >= 5 THEN pi.product_image_id ELSE NULL END) AS alt_coverage_count,
           MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has('image_orientation') ? 'pia.image_orientation' : 'NULL'} ELSE NULL END) AS first_image_orientation,
           MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has('width_px') ? 'pia.width_px' : 'NULL'} ELSE NULL END) AS first_width_px,
           MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has('height_px') ? 'pia.height_px' : 'NULL'} ELSE NULL END) AS first_height_px,
           MIN(CASE WHEN pi.sort_order = 0 THEN ${annotationCols.has('merchandising_score') ? 'pia.merchandising_score' : (annotationCols.has('first_image_score') ? 'pia.first_image_score' : 'NULL')} ELSE NULL END) AS first_merchandising_score,
           AVG(COALESCE(${annotationCols.has('merchandising_score') ? 'pia.merchandising_score' : (annotationCols.has('first_image_score') ? 'pia.first_image_score' : 'NULL')}, 0)) AS average_merchandising_score,
           SUM(CASE WHEN pi.product_image_id IS NOT NULL AND COALESCE(${annotationCols.has('image_role') ? 'pia.image_role' : "''"}, '') = '' THEN 1 ELSE 0 END) AS missing_image_role_count,
           SUM(CASE WHEN LOWER(COALESCE(${annotationCols.has('image_role') ? 'pia.image_role' : "''"}, '')) = 'hero_front' THEN 1 ELSE 0 END) AS hero_image_role_count,
           SUM(CASE WHEN LOWER(COALESCE(${annotationCols.has('public_use_status') ? 'pia.public_use_status' : "''"}, '')) IN ('consent_needed','blocked') THEN 1 ELSE 0 END) AS blocked_public_use_count
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    LEFT JOIN product_images pi ON pi.product_id = p.product_id
    LEFT JOIN product_image_annotations pia ON pia.product_image_id = pi.product_image_id
    WHERE p.product_id = ?
    GROUP BY p.product_id
    LIMIT 1
  `).bind(productId).first();
  if (!row) return json({ ok: false, error: "Product not found." }, 404);

  const readiness = buildReadiness(row);
  let nextReviewStatus = String(row.review_status || "pending_review").toLowerCase();
  let nextStatus = String(row.status || "draft").toLowerCase();
  const lowScorePublish = Number(readiness.publish_readiness_score || 0) < 85 || Number(readiness.image_quality_score || 0) < 70 || Number(readiness.is_ready_for_storefront || 0) !== 1;

  if (action === "approve") {
    if (Number(readiness.is_ready_for_storefront || 0) !== 1) {
      return json({ ok: false, error: `Product is not ready to approve yet: ${readiness.ready_check_notes || "missing required fields"}.` }, 400);
    }
    nextReviewStatus = "approved";
  }
  if (action === "request_changes") {
    nextReviewStatus = "needs_changes";
    if (nextStatus === "active") nextStatus = "draft";
    if (note) readiness.ready_check_notes = note;
  }
  if (action === "publish") {
    if (Number(readiness.is_ready_for_storefront || 0) !== 1) {
      return json({ ok: false, error: `Product is not storefront-ready yet: ${readiness.ready_check_notes || "missing required fields"}.` }, 400);
    }
    if (lowScorePublish) {
      return json({ ok: false, error: `Publish blocked by listing-quality gate. Publish score ${readiness.publish_readiness_score}% • image score ${readiness.image_quality_score}%. Use Override Publish with an explicit note if you still need to go live.` }, 400);
    }
    if (!["approved", "published"].includes(nextReviewStatus)) {
      return json({ ok: false, error: "Product must be approved before publishing." }, 400);
    }
    nextReviewStatus = "published";
    nextStatus = "active";
  }
  if (action === "publish_override") {
    if (!["approved", "published"].includes(nextReviewStatus)) {
      return json({ ok: false, error: "Product must be approved before override publishing." }, 400);
    }
    if (!note) {
      return json({ ok: false, error: "Override Publish requires an explicit note explaining why the low-score listing is being published." }, 400);
    }
    nextReviewStatus = "published";
    nextStatus = "active";
  }
  if (action === "unpublish") {
    nextStatus = "draft";
    if (nextReviewStatus === "published") nextReviewStatus = "approved";
  }

  try {
    await db.prepare(`
      UPDATE products
      SET review_status = ?,
          status = ?,
          is_ready_for_storefront = ?,
          ready_check_notes = ?,
          publish_readiness_score = ?,
          image_quality_score = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `).bind(nextReviewStatus, nextStatus, Number(readiness.is_ready_for_storefront || 0), readiness.ready_check_notes || null, Number(readiness.publish_readiness_score || 0), Number(readiness.image_quality_score || 0), productId).run();

    await db.prepare(`
      INSERT INTO product_review_actions (
        product_id, action_type, previous_review_status, new_review_status,
        previous_status, new_status, actor_user_id, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(productId, action, normalizeText(row.review_status) || "pending_review", nextReviewStatus, normalizeText(row.status) || "draft", nextStatus, Number(adminUser.user_id || 0), note || null).run().catch(() => null);

    if (action === 'publish_override') {
      await db.prepare(`
        INSERT INTO product_publish_overrides (
          product_id, actor_user_id, override_note, publish_readiness_score, image_quality_score, ready_check_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(productId, Number(adminUser.user_id || 0), note, Number(readiness.publish_readiness_score || 0), Number(readiness.image_quality_score || 0), readiness.ready_check_notes || null).run().catch(() => null);
    }
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: "admin_product_review_actions",
      incident_code: "product_review_update_failed",
      severity: "warning",
      message: "Product review action failed during write.",
      related_user_id: Number(adminUser.user_id || 0),
      details: { product_id: productId, action, error: String(error?.message || error || "Unknown product review write error") }
    });
    return json({ ok: false, error: `Failed to ${action.replace(/_/g, " ")} product right now.` }, 500);
  }

  // Approval starts a source-linked Content Automation Studio package automatically.
  // This preparation is non-destructive and review-first; it does not change public status.
  let contentProject = null;
  if (['approve', 'publish', 'publish_override'].includes(action)) {
    try {
      contentProject = await createOrRefreshContentProjectForProduct(db, productId, Number(adminUser.user_id || 0));
    } catch (contentError) {
      await captureRuntimeIncident(env, request, {
        incident_scope: 'content_automation_studio',
        incident_code: 'approval_content_package_prepare_failed',
        severity: 'warning',
        message: 'Product approval succeeded, but its content package could not be prepared automatically.',
        related_user_id: Number(adminUser.user_id || 0),
        details: { product_id: productId, action, error: String(contentError?.message || contentError || 'Unknown content package error') }
      });
    }
  }

  await auditAdminAction(env, request, adminUser, {
    action_type: `product_${action}`,
    target_type: "product",
    target_id: productId,
    target_key: normalizeText(row.slug),
    details: {
      previous_review_status: normalizeText(row.review_status) || "pending_review",
      new_review_status: nextReviewStatus,
      previous_status: normalizeText(row.status) || "draft",
      new_status: nextStatus,
      note: note || null,
      ready_check_notes: readiness.ready_check_notes || null,
      publish_readiness_score: Number(readiness.publish_readiness_score || 0),
      image_quality_score: Number(readiness.image_quality_score || 0),
      content_project_id: contentProject?.project?.content_project_id || null
    }
  });

  const updated = await db.prepare(`SELECT product_id, slug, name, review_status, status, is_ready_for_storefront, ready_check_notes, publish_readiness_score, image_quality_score, updated_at FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
  return json({
    ok: true,
    message: `Product ${action.replace("_", " ")} complete.${contentProject ? ' Content package prepared for review.' : ''}`,
    product: updated,
    content_project: contentProject ? {
      content_project_id: contentProject.project?.content_project_id || null,
      content_project_key: contentProject.project?.content_project_key || null,
      archived_count: Number(contentProject.archived_count || 0),
      deliverables_created: Number(contentProject.deliverables_created || 0),
      review_first: true
    } : null
  });
}
