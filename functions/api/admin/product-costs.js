// File: /functions/api/admin/product-costs.js
// Build 440: Accounting-owned product-cost schema is migration-owned. This endpoint never creates/alters schema at request time.
import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction, normalizeText } from "../_lib/adminAudit.js";
import { assertAccountingPeriodOpen, monthFromDateish } from './_accountingPeriods.js';
import { readAccountingProductCosts } from '../_lib/accountingProductCostsReadService.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Admin access required." }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);

  try {
    const result = await readAccountingProductCosts(db);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load product costs.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Admin access required." }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);

  let body = {};
  try { body = await context.request.json(); }
  catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const product_number = normalizeText(body.product_number).toUpperCase();
  const cost_per_unit = Number(body.cost_per_unit);
  const effective_date = normalizeText(body.effective_date);
  const notes = normalizeText(body.notes);

  if (!product_number || !Number.isFinite(cost_per_unit) || cost_per_unit < 0) {
    return jsonResponse({ ok: false, error: "Product number and a non-negative cost are required." }, 400);
  }

  try {
    const readiness = await readAccountingProductCosts(db, { limit: 1 });
    if (!readiness.schema_ready) {
      return jsonResponse({
        ok: false,
        code: 'product_cost_schema_not_ready',
        error: 'Product cost schema is not ready. Apply the migration through the release workflow before saving costs.',
        owner: 'accounting',
        missing_tables: readiness.missing_tables || [],
        missing_columns: readiness.missing_columns || [],
        request_time_schema_mutation: false,
      }, 409);
    }

    await assertAccountingPeriodOpen(
      db,
      monthFromDateish(effective_date || new Date().toISOString().slice(0, 10)),
      'Product costs'
    );

    const result = await db.prepare(`
      INSERT INTO product_costs (
        product_number,cost_per_unit,effective_date,notes,created_at,updated_at
      ) VALUES (?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `).bind(product_number,cost_per_unit,effective_date || null,notes || null).run();

    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: "create_product_cost",
      target_type: "product_cost",
      target_id: Number(result?.meta?.last_row_id || 0) || null,
      target_key: product_number,
      details: { cost_per_unit, effective_date: effective_date || null }
    });

    return jsonResponse({
      ok: true,
      product_cost_id: Number(result?.meta?.last_row_id || 0) || null,
      product_number,
      cost_per_unit,
      effective_date: effective_date || null,
      request_time_schema_mutation: false,
    });
  } catch (error) {
    const status = Number(error?.status || 0) || 500;
    return jsonResponse({ ok: false, error: error?.message || 'Failed to save product cost.' }, status);
  }
}
