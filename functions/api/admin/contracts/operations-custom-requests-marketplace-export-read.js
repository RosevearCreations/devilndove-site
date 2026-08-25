// Devil n Dove Build 374 — read-only Custom Requests marketplace export readiness contract.
// Verifies export-pack/preset tables without creating schema or seeding defaults.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';

export const BUILD = 374;
export const CONTRACT_ID = 'operations-custom-requests-marketplace-export-read';
export const OWNER = 'operations';

const REQUIRED_TABLES = Object.freeze(['custom_request_marketplace_export_packs']);
const OPTIONAL_TABLES = Object.freeze(['marketplace_channel_presets']);
const CHANNELS = Object.freeze(['all', 'etsy', 'facebook', 'pinterest', 'manual']);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableReady(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return rows(result).length > 0;
  } catch {
    return false;
  }
}

async function countRows(db, tableName) {
  try {
    const row = await db.prepare(`SELECT COUNT(*) AS row_count FROM ${tableName}`).first();
    return Number(row?.row_count || 0);
  } catch {
    return null;
  }
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const readinessEntries = [];
  for (const table of [...REQUIRED_TABLES, ...OPTIONAL_TABLES]) {
    readinessEntries.push({ table, ready: await tableReady(db, table) });
  }

  const missingRequired = readinessEntries
    .filter((entry) => REQUIRED_TABLES.includes(entry.table) && !entry.ready)
    .map((entry) => entry.table);

  const missingOptional = readinessEntries
    .filter((entry) => OPTIONAL_TABLES.includes(entry.table) && !entry.ready)
    .map((entry) => entry.table);

  const packCount = missingRequired.length ? null : await countRows(db, 'custom_request_marketplace_export_packs');
  const presetCount = missingOptional.length ? null : await countRows(db, 'marketplace_channel_presets');

  const exportRoutes = Object.fromEntries(
    CHANNELS.map((channel) => [channel, `/api/admin/contracts/operations-custom-requests-marketplace-export?channel=${encodeURIComponent(channel)}`])
  );

  return jsonResponse({
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    schema_ready: missingRequired.length === 0,
    missing_tables: missingRequired,
    optional_schema_ready: missingOptional.length === 0,
    optional_missing_tables: missingOptional,
    checked_tables: readinessEntries,
    export_pack_count: packCount,
    marketplace_preset_count: presetCount,
    channels: CHANNELS,
    export_routes: exportRoutes,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    seeds_marketplace_presets: false,
    legacy_marketplace_csv_get_replacement_available: true,
  }, 200, { 'Cache-Control': 'no-store' });
}
