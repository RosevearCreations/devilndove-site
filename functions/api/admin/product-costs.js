// File: /functions/api/admin/product-costs.js
// Brief description: Starter product cost capture (unit cost over time) for accounting/COGS.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

async function ensureTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS product_costs (
      product_cost_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      effective_date TEXT NOT NULL,
      unit_cost_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'CAD',
      vendor TEXT,
      notes TEXT,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_product_costs_product ON product_costs(product_id, effective_date DESC, product_cost_id DESC)`).run();
}

function toCents(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = getDb(env);
  await ensureTables(db);

  const adminUser = await getAdminUserFromRequest(env, request);
  if (!adminUser?.ok) return json({ ok: false, error: "Admin authentication required." }, 401);

  const url = new URL(request.url);
  const product_id = Number(url.searchParams.get('product_id') || 0);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 200);

  if (request.method === 'GET') {
    if (!product_id) return json({ ok: false, error: 'product_id is required.' }, 400);
    const rows = await db.prepare(`
      SELECT product_cost_id, product_id, effective_date, unit_cost_cents, currency, vendor, notes, created_at, updated_at
      FROM product_costs
      WHERE product_id = ?
      ORDER BY effective_date DESC, product_cost_id DESC
      LIMIT ?
    `).bind(product_id, limit).all();
    return json({ ok: true, costs: rows.results || [] });
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);

  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const pid = Number(body.product_id || product_id || 0);
  const effective_date = normalizeText(body.effective_date) || new Date().toISOString().slice(0,10);
  const currency = (normalizeText(body.currency) || 'CAD').toUpperCase();
  const unit_cost_cents = Number.isInteger(body.unit_cost_cents) ? Number(body.unit_cost_cents) : toCents(body.unit_cost);
  const vendor = normalizeText(body.vendor) || null;
  const notes = normalizeText(body.notes) || null;

  if (!pid) return json({ ok: false, error: 'product_id is required.' }, 400);

  const insert = await db.prepare(`
    INSERT INTO product_costs (
      product_id, effective_date, unit_cost_cents, currency, vendor, notes, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    pid,
    effective_date,
    Math.max(0, Number(unit_cost_cents || 0)),
    currency,
    vendor,
    notes,
    Number(adminUser.user_id || 0) || null
  ).run();

  await auditAdminAction(env, request, adminUser, {
    action_type: 'product_cost_created',
    action_summary: `Set unit cost for product ${pid} effective ${effective_date}.`,
    action_details: { product_id: pid, effective_date, unit_cost_cents, currency }
  });

  const row = await db.prepare(`
    SELECT product_cost_id, product_id, effective_date, unit_cost_cents, currency, vendor, notes, created_at, updated_at
    FROM product_costs
    WHERE product_cost_id = ?
    LIMIT 1
  `).bind(insert.meta.last_row_id).first();

  return json({ ok: true, cost: row });
}
