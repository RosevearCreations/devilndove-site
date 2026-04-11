import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

function json(data, status = 200) { return jsonResponse(data, status); }

function buildReadiness(row = {}) {
  const checks = {
    has_name: normalizeText(row.name).length > 0,
    has_slug: normalizeText(row.slug).length > 0,
    has_price: Number(row.price_cents || 0) > 0,
    has_featured_image: normalizeText(row.featured_image_url).length > 0,
    has_short_description: normalizeText(row.short_description).length >= 40,
    has_meta_title: normalizeText(row.meta_title).length >= 10,
    has_meta_description: normalizeText(row.meta_description).length >= 50,
    has_category: normalizeText(row.product_category).length > 0
  };
  const failedKeys = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  return {
    is_ready_for_storefront: failedKeys.length === 0 ? 1 : 0,
    ready_check_notes: failedKeys.join(", "),
    readiness_checks: checks
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: "Unauthorized." }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const productId = Number(body.product_id || 0);
  const action = normalizeText(body.action).toLowerCase();
  const note = normalizeText(body.note).slice(0, 1000);
  if (!productId) return json({ ok: false, error: "product_id is required." }, 400);
  if (!["approve", "request_changes", "publish", "unpublish"].includes(action)) {
    return json({ ok: false, error: "action must be approve, request_changes, publish, or unpublish." }, 400);
  }

  if (["publish", "unpublish"].includes(action)) {
    const stepUp = await requireAdminStepUp(request, env, adminUser, body, `${action} action`);
    if (!stepUp.ok) return stepUp.response;
  }

  const row = await db.prepare(`
    SELECT p.*, ps.meta_title, ps.meta_description
    FROM products p
    LEFT JOIN product_seo ps ON ps.product_id = p.product_id
    WHERE p.product_id = ?
    LIMIT 1
  `).bind(productId).first();
  if (!row) return json({ ok: false, error: "Product not found." }, 404);

  const readiness = buildReadiness(row);
  let nextReviewStatus = String(row.review_status || "pending_review").toLowerCase();
  let nextStatus = String(row.status || "draft").toLowerCase();
  if (action === "approve") nextReviewStatus = "approved";
  if (action === "request_changes") {
    nextReviewStatus = "needs_changes";
    if (nextStatus === "active") nextStatus = "draft";
  }
  if (action === "publish") {
    if (Number(readiness.is_ready_for_storefront || 0) !== 1) {
      return json({ ok: false, error: `Product is not storefront-ready yet: ${readiness.ready_check_notes || "missing required fields"}.` }, 400);
    }
    if (!["approved", "published"].includes(nextReviewStatus)) {
      return json({ ok: false, error: "Product must be approved before publishing." }, 400);
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
          updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `).bind(nextReviewStatus, nextStatus, Number(readiness.is_ready_for_storefront || 0), readiness.ready_check_notes || null, productId).run();

    await db.prepare(`
      INSERT INTO product_review_actions (
        product_id, action_type, previous_review_status, new_review_status,
        previous_status, new_status, actor_user_id, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      productId,
      action,
      normalizeText(row.review_status) || "pending_review",
      nextReviewStatus,
      normalizeText(row.status) || "draft",
      nextStatus,
      Number(adminUser.user_id || 0),
      note || null
    ).run().catch(() => null);
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: "admin_product_review_actions",
      incident_code: "product_review_update_failed",
      severity: "warning",
      message: "Product review action failed during write.",
      related_user_id: Number(adminUser.user_id || 0),
      details: {
        product_id: productId,
        action,
        error: String(error?.message || error || "Unknown product review write error")
      }
    });
    return json({ ok: false, error: `Failed to ${action.replace(/_/g, " ")} product right now.` }, 500);
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
      ready_check_notes: readiness.ready_check_notes || null
    }
  });

  const updated = await db.prepare(`SELECT product_id, slug, name, review_status, status, is_ready_for_storefront, ready_check_notes, updated_at FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
  return json({ ok: true, message: `Product ${action.replace("_", " ")} complete.`, product: updated });
}
