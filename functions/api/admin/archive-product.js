// Build 221 — audited product archiving with DB/DD_DB compatibility and safe failures.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse
} from '../_lib/adminAudit.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

async function requireAdmin(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

export async function onRequestPost(context) {
  const access = await requireAdmin(context);
  if (access.error) return access.error;

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const productId = Number(body.product_id || 0);
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: 'A valid product_id is required.' }, 400);
  }

  try {
    const existingProduct = await access.db.prepare(`
      SELECT product_id, product_number, slug, sku, name, product_type, status,
             price_cents, currency, updated_at
      FROM products
      WHERE product_id = ?
      LIMIT 1
    `).bind(productId).first();

    if (!existingProduct) return json({ ok: false, error: 'Product not found.' }, 404);

    if (String(existingProduct.status || '').toLowerCase() !== 'archived') {
      const result = await access.db.prepare(`
        UPDATE products
        SET status = 'archived', updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `).bind(productId).run();
      if (Number(result?.meta?.changes || 0) < 1) {
        throw new Error('The product status did not change. Refresh and try again.');
      }
    }

    const archivedProduct = await access.db.prepare(`
      SELECT product_id, product_number, slug, sku, name, short_description,
             description, product_type, status, price_cents,
             compare_at_price_cents, currency, taxable, tax_class_id,
             requires_shipping, weight_grams, inventory_tracking,
             inventory_quantity, digital_file_url, featured_image_url,
             sort_order, created_at, updated_at
      FROM products
      WHERE product_id = ?
      LIMIT 1
    `).bind(productId).first();

    await auditAdminAction(context.env, context.request, access.adminUser, {
      action_type: 'product_archive',
      target_type: 'product',
      target_id: productId,
      target_key: existingProduct.slug || existingProduct.sku || String(productId),
      details: {
        previous_status: existingProduct.status || null,
        new_status: 'archived',
        product_number: existingProduct.product_number || null,
        cleanup_centre_available: true
      }
    });

    return json({
      ok: true,
      message: String(existingProduct.status || '').toLowerCase() === 'archived'
        ? 'Product is already archived. It can now be reviewed in Draft & Archive Cleanup.'
        : 'Product archived. Open the Archived filter in Draft & Archive Cleanup to check whether permanent removal is safe.',
      product: archivedProduct || { ...existingProduct, status: 'archived' }
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'product_cleanup',
      incident_code: 'product_archive_failed',
      severity: 'warning',
      message: error?.message || 'Product archive failed.',
      related_user_id: access.adminUser.user_id,
      details: { product_id: productId, error: String(error?.stack || error) }
    }).catch(() => null);
    return json({ ok: false, error: error?.message || 'Product could not be archived safely.' }, 500);
  }
}
