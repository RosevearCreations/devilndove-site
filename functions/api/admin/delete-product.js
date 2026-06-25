// File: /functions/api/admin/delete-product.js
// Permanent deletion is intentionally limited to unused products. Ordered or referenced
// products stay in history and must be archived instead.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

function json(data, status = 200) { return jsonResponse(data, status); }

async function requireAdmin(request, env) {
  const sessionUser = await getAdminUserFromRequest(request, env);
  if (!sessionUser) return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  return { sessionUser };
}

function quoteIdentifier(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || "").trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
      LIMIT 1
    `).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function discoverProductReferences(db, productId) {
  const tablesResult = await db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all().catch(() => ({ results: [] }));
  const tables = Array.isArray(tablesResult?.results) ? tablesResult.results.map((row) => String(row?.name || "")).filter(Boolean) : [];
  const references = [];

  for (const tableName of tables) {
    if (tableName === 'products' || tableName === 'product_deletion_audit') continue;
    let foreignKeys = [];
    try {
      const result = await db.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`).all();
      foreignKeys = Array.isArray(result?.results) ? result.results : [];
    } catch {
      foreignKeys = [];
    }

    for (const foreignKey of foreignKeys) {
      if (String(foreignKey?.table || '').toLowerCase() !== 'products') continue;
      const childColumn = String(foreignKey?.from || '').trim();
      if (!childColumn) continue;
      let count = 0;
      try {
        const row = await db.prepare(`
          SELECT COUNT(*) AS count
          FROM ${quoteIdentifier(tableName)}
          WHERE ${quoteIdentifier(childColumn)} = ?
        `).bind(productId).first();
        count = Number(row?.count || 0);
      } catch {
        count = 0;
      }
      if (count > 0) {
        references.push({
          table_name: tableName,
          column_name: childColumn,
          count,
          on_delete: String(foreignKey?.on_delete || 'NO ACTION').toUpperCase()
        });
      }
    }
  }

  return references.sort((a, b) => a.table_name.localeCompare(b.table_name));
}

async function safeProductImages(db, productId) {
  if (!(await tableExists(db, 'product_images'))) return [];
  try {
    const result = await db.prepare(`
      SELECT product_image_id, image_url, alt_text, caption, display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY display_order ASC, product_image_id ASC
    `).bind(productId).all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}

async function runCleanup(db, productId) {
  // These are product-owned working records; removing an unused incorrect draft should
  // remove their D1 rows too. Other non-cascading business references block deletion.
  const cleanupTables = [
    'product_images',
    'product_tags',
    'product_seo',
    'product_resource_links',
    'product_listing_profiles',
    'product_media_role_assignments',
    'product_image_annotations',
    'product_media_score_history',
    'product_image_derivatives',
    'product_publish_qa_results',
    'product_qa_panel_states',
    'product_story_public_notes'
  ];

  const statements = [];
  for (const tableName of cleanupTables) {
    if (!(await tableExists(db, tableName))) continue;
    const columns = await getTableColumnSet(db, tableName);
    if (!columns.has('product_id')) continue;
    statements.push(db.prepare(`DELETE FROM ${quoteIdentifier(tableName)} WHERE product_id = ?`).bind(productId));
  }
  statements.push(db.prepare(`DELETE FROM products WHERE product_id = ?`).bind(productId));

  if (typeof db.batch === 'function') {
    await db.batch(statements);
  } else {
    for (const statement of statements) await statement.run();
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const stepUp = await requireAdminStepUp(request, env, authCheck.sessionUser, body, 'product deletion');
  if (!stepUp.ok) return stepUp.response;

  const confirmationPhrase = String(body.confirmation_phrase || '').trim().toUpperCase();
  if (confirmationPhrase !== 'DELETE PRODUCT') {
    return json({
      ok: false,
      error: 'Type DELETE PRODUCT exactly to permanently delete an unused product.',
      requires_typed_confirmation: true
    }, 400);
  }

  const productId = Number(body.product_id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  const existingProduct = await db.prepare(`
    SELECT *
    FROM products
    WHERE product_id = ?
    LIMIT 1
  `).bind(productId).first();

  if (!existingProduct) {
    return json({ ok: false, error: "Product not found." }, 404);
  }

  const references = await discoverProductReferences(db, productId);
  const blockingReferences = references.filter((row) => row.on_delete !== 'CASCADE');
  if (blockingReferences.length) {
    const summary = blockingReferences.map((row) => `${row.count} ${row.table_name}`).join(', ');
    return json({
      ok: false,
      error: `This product has saved business/history references (${summary}) and cannot be permanently deleted. Archive it instead.`,
      requires_archive: true,
      references: blockingReferences
    }, 409);
  }

  const images = await safeProductImages(db, productId);
  const deletionReason = String(body.deletion_reason || '').trim().slice(0, 500) || 'Incorrect or unused product entry.';
  const snapshot = {
    product: existingProduct,
    images,
    deleted_from_storefront: true,
    r2_cleanup_note: images.length
      ? 'Image database rows were removed. Review any R2 objects separately before deleting files because media may be reused outside this product.'
      : 'No product image rows were attached.'
  };

  await runCleanup(db, productId);

  if (await tableExists(db, 'product_deletion_audit')) {
    await db.prepare(`
      INSERT INTO product_deletion_audit (
        product_id_deleted, product_number, sku, product_name, product_slug,
        deletion_reason, deleted_by_user_id, product_snapshot_json,
        orphan_media_urls_json, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      productId,
      existingProduct.product_number || null,
      existingProduct.sku || null,
      existingProduct.name || null,
      existingProduct.slug || null,
      deletionReason,
      Number(authCheck.sessionUser?.user_id || 0) || null,
      JSON.stringify(snapshot),
      JSON.stringify(images.map((row) => row.image_url).filter(Boolean))
    ).run().catch(() => null);
  }

  await auditAdminAction(env, request, authCheck.sessionUser, {
    action_type: "product_delete",
    target_type: "product",
    target_id: productId,
    target_key: existingProduct?.slug || existingProduct?.sku || String(productId),
    details: {
      product_number: existingProduct.product_number || null,
      sku: existingProduct.sku || null,
      name: existingProduct.name || null,
      deletion_reason: deletionReason,
      image_row_count: images.length,
      product_snapshot: snapshot
    }
  });

  return json({
    ok: true,
    message: "Unused product deleted. Its product number stays retired and will not be reused.",
    product: existingProduct,
    deleted_media_rows: images.length,
    r2_cleanup_note: snapshot.r2_cleanup_note
  });
}
