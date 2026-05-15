// File: /functions/api/admin/_inventoryCostHistory.js
// Brief description: Shared helpers for preserving inventory unit-cost history when Amazon imports,
// bulk edits, or manual inventory edits change site_item_inventory.unit_cost_cents.

import { normalizeText } from '../_lib/adminAudit.js';

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(normalizeResults(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function ensureInventoryCostHistoryTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS site_item_inventory_cost_history (
      site_item_inventory_cost_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_item_inventory_id INTEGER,
      source_type TEXT,
      external_key TEXT,
      item_name TEXT,
      previous_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
      new_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'CAD',
      source_kind TEXT NOT NULL DEFAULT 'manual',
      source_id TEXT,
      source_reference TEXT,
      reason_note TEXT,
      changed_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
    )
  `).run();

  const cols = await getTableColumnSet(db, 'site_item_inventory_cost_history');
  const migrations = [
    ['currency', `ALTER TABLE site_item_inventory_cost_history ADD COLUMN currency TEXT NOT NULL DEFAULT 'CAD'`],
    ['source_kind', `ALTER TABLE site_item_inventory_cost_history ADD COLUMN source_kind TEXT NOT NULL DEFAULT 'manual'`],
    ['source_id', `ALTER TABLE site_item_inventory_cost_history ADD COLUMN source_id TEXT`],
    ['source_reference', `ALTER TABLE site_item_inventory_cost_history ADD COLUMN source_reference TEXT`],
    ['reason_note', `ALTER TABLE site_item_inventory_cost_history ADD COLUMN reason_note TEXT`],
    ['changed_by_user_id', `ALTER TABLE site_item_inventory_cost_history ADD COLUMN changed_by_user_id INTEGER`]
  ];
  for (const [name, sql] of migrations) {
    if (!cols.has(name)) await db.prepare(sql).run().catch(() => null);
  }

  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_item ON site_item_inventory_cost_history(site_item_inventory_id, created_at DESC)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_source ON site_item_inventory_cost_history(source_kind, source_id)`).run().catch(() => null);
}

export async function recordInventoryCostHistory(db, payload = {}) {
  await ensureInventoryCostHistoryTable(db);
  const previousCost = Math.max(0, Math.round(Number(payload.previous_unit_cost_cents || 0)) || 0);
  const newCost = Math.max(0, Math.round(Number(payload.new_unit_cost_cents || 0)) || 0);
  if (newCost <= 0 || previousCost === newCost) return null;

  const result = await db.prepare(`
    INSERT INTO site_item_inventory_cost_history (
      site_item_inventory_id, source_type, external_key, item_name,
      previous_unit_cost_cents, new_unit_cost_cents, currency,
      source_kind, source_id, source_reference, reason_note, changed_by_user_id,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    payload.site_item_inventory_id == null ? null : Number(payload.site_item_inventory_id || 0),
    normalizeText(payload.source_type) || null,
    normalizeText(payload.external_key) || null,
    normalizeText(payload.item_name) || null,
    previousCost,
    newCost,
    normalizeText(payload.currency || 'CAD').toUpperCase() || 'CAD',
    normalizeText(payload.source_kind || 'manual') || 'manual',
    normalizeText(payload.source_id) || null,
    normalizeText(payload.source_reference) || null,
    normalizeText(payload.reason_note) || null,
    payload.changed_by_user_id == null ? null : Number(payload.changed_by_user_id || 0)
  ).run();

  return Number(result?.meta?.last_row_id || 0) || null;
}
