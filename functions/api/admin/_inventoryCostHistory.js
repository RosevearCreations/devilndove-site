// File: /functions/api/admin/_inventoryCostHistory.js
// Brief description: Shared helpers for preserving inventory unit-cost history when Amazon imports,
// bulk edits, or manual inventory edits change site_item_inventory.unit_cost_cents.

import { normalizeText } from '../_lib/adminAudit.js';

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function ensureInventoryCostHistoryTable(db) {
  // Build 243: compatibility shim only. Numbered D1 migrations own this schema now.
  await db.prepare(`SELECT site_item_inventory_cost_history_id FROM site_item_inventory_cost_history LIMIT 1`).first();
  return true;
}

export async function recordInventoryCostHistory(db, payload = {}) {
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
