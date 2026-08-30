import {
  auditAdminAction,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from "../_lib/adminAudit.js";
import { assertAccountingPeriodOpen } from './_accountingPeriods.js';
import { readAccountingOverheadProductAllocations } from '../_lib/accountingOverheadProductAllocationsReadService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { "Cache-Control": "no-store" });
}

async function tableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set((Array.isArray(result?.results) ? result.results : []).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableIndexSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    return new Set((Array.isArray(result?.results) ? result.results : []).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureTable(db) {
  const columns = await tableColumnSet(db, 'accounting_overhead_product_allocations');
  const requiredColumns = ['overhead_product_allocation_id','period_month','ledger_code','product_id','amount_cents','notes','created_at','updated_at'];
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Accounting overhead product schema is not ready: accounting_overhead_product_allocations is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  const indexes = await tableIndexSet(db, 'accounting_overhead_product_allocations');
  const requiredIndexes = ['idx_accounting_overhead_product_allocations_month','idx_accounting_overhead_product_allocations_product'];
  const missingIndexes = requiredIndexes.filter((name) => !indexes.has(name));
  if (missingIndexes.length) {
    throw new Error(`Accounting overhead product schema is not ready: accounting_overhead_product_allocations is missing index ${missingIndexes.join(', ')}. Apply the current Development migration authority.`);
  }
  return true;
}

function mapRow(row) {
  return {
    overhead_product_allocation_id: Number(row?.overhead_product_allocation_id || 0),
    period_month: row?.period_month || "",
    ledger_code: row?.ledger_code || "",
    product_id: Number(row?.product_id || 0),
    product_number: row?.product_number == null ? null : Number(row.product_number || 0),
    product_name: row?.product_name || "",
    product_status: row?.product_status || "",
    review_status: row?.review_status || "",
    amount_cents: Number(row?.amount_cents || 0),
    notes: row?.notes || "",
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: "Admin access required." }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  const url = new URL(context.request.url);
  const periodMonth = normalizeText(url.searchParams.get("month"));
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 150), 1), 500);

  try {
    const result = await readAccountingOverheadProductAllocations(db, {
      month: periodMonth,
      limit,
    });
    return json(result);
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to load overhead product allocations.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: "Admin access required." }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: "Database binding is not configured." }, 500);

  await ensureTable(db);

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const periodMonth = normalizeText(body.period_month || body.month);
  const ledgerCode = normalizeText(body.ledger_code).toUpperCase();
  const productId = Number(body.product_id || 0);
  const amountCents = Number(body.amount_cents ?? body.allocated_cents ?? 0);
  const notes = normalizeText(body.notes || "");
  const mode = normalizeText(body.mode || "upsert").toLowerCase();

  if (!/^\d{4}-\d{2}$/.test(periodMonth)) {
    return json({ ok: false, error: "period_month must be YYYY-MM." }, 400);
  }

  if (!ledgerCode) {
    return json({ ok: false, error: "ledger_code is required." }, 400);
  }

  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "product_id is required." }, 400);
  }

  if (!Number.isInteger(amountCents) || amountCents < 0) {
    return json({ ok: false, error: "amount_cents must be a whole number of cents." }, 400);
  }

  try {
    await assertAccountingPeriodOpen(db, periodMonth, 'Accounting overhead product allocations');

    const product = await db.prepare(`
      SELECT product_id, product_number, name, status, review_status
      FROM products
      WHERE product_id = ?
      LIMIT 1
    `).bind(productId).first();

    if (!product) {
      return json({ ok: false, error: "Product not found." }, 404);
    }

    if (mode === "delete" || amountCents === 0) {
      await db.prepare(`
        DELETE FROM accounting_overhead_product_allocations
        WHERE period_month = ? AND ledger_code = ? AND product_id = ?
      `).bind(periodMonth, ledgerCode, productId).run();

      await auditAdminAction(context.env, context.request, adminUser, {
        action_type: "delete_overhead_product_allocation",
        target_type: "accounting_overhead_product_allocation",
        target_id: productId,
        target_key: `${periodMonth}:${ledgerCode}:${productId}`,
        details: {
          period_month: periodMonth,
          ledger_code: ledgerCode,
          product_id: productId,
        },
      });

      return json({ ok: true, deleted: true });
    }

    await db.prepare(`
      INSERT INTO accounting_overhead_product_allocations (
        period_month,
        ledger_code,
        product_id,
        amount_cents,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(period_month, ledger_code, product_id) DO UPDATE SET
        amount_cents = excluded.amount_cents,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      periodMonth,
      ledgerCode,
      productId,
      amountCents,
      notes || null
    ).run();

    const saved = await db.prepare(`
      SELECT
        opa.overhead_product_allocation_id,
        opa.period_month,
        opa.ledger_code,
        opa.product_id,
        opa.amount_cents,
        opa.notes,
        opa.created_at,
        opa.updated_at,
        p.product_number,
        p.name AS product_name,
        p.status AS product_status,
        p.review_status
      FROM accounting_overhead_product_allocations opa
      LEFT JOIN products p ON p.product_id = opa.product_id
      WHERE opa.period_month = ? AND opa.ledger_code = ? AND opa.product_id = ?
      LIMIT 1
    `).bind(periodMonth, ledgerCode, productId).first();

    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: "save_overhead_product_allocation",
      target_type: "accounting_overhead_product_allocation",
      target_id: productId,
      target_key: `${periodMonth}:${ledgerCode}:${productId}`,
      details: {
        period_month: periodMonth,
        ledger_code: ledgerCode,
        product_id: productId,
        amount_cents: amountCents,
      },
    });

    return json({ ok: true, allocation: mapRow(saved) });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to save overhead product allocation.' }, 500);
  }
}