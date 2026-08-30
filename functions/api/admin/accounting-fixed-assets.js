import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingFixedAssets } from '../_lib/accountingFixedAssetsReadService.js';

async function ensureFixedAssetsTable(db) {
  let columns = new Set();
  try {
    const result = await db.prepare('PRAGMA table_info(accounting_fixed_assets)').all();
    columns = new Set((Array.isArray(result?.results) ? result.results : []).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {}
  const requiredColumns = [
    'accounting_fixed_asset_id', 'asset_label', 'asset_category', 'cca_class', 'acquisition_date', 'cost_cents',
    'salvage_cents', 'business_use_percent', 'location_note', 'vendor_name', 'notes', 'created_at', 'updated_at'
  ];
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Accounting fixed-asset schema is not ready: accounting_fixed_assets is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  return true;
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try { return jsonResponse(await readAccountingFixedAssets(db)); }
  catch (error) { return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to read fixed assets.' }, 500); }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env); if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureFixedAssetsTable(db);
  let body={}; try { body = await request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const assetLabel = normalizeText(body.asset_label);
  if (!assetLabel) return jsonResponse({ ok: false, error: 'asset_label is required.' }, 400);
  const result = await db.prepare(`INSERT INTO accounting_fixed_assets (asset_label, asset_category, cca_class, acquisition_date, cost_cents, salvage_cents, business_use_percent, location_note, vendor_name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(assetLabel, normalizeText(body.asset_category) || 'equipment', normalizeText(body.cca_class) || null, normalizeText(body.acquisition_date) || null, Math.max(0, Math.round(Number(body.cost_cents || 0))), Math.max(0, Math.round(Number(body.salvage_cents || 0))), Math.max(0, Math.min(100, Math.round(Number(body.business_use_percent || 100)))), normalizeText(body.location_note) || null, normalizeText(body.vendor_name) || null, normalizeText(body.notes) || null).run();
  const id = Number(result?.meta?.last_row_id || 0);
  await auditAdminAction(env, request, adminUser, { action_type: 'create_fixed_asset', target_type: 'accounting_fixed_asset', target_id: id, details: { asset_label: assetLabel } });
  return jsonResponse({ ok: true, accounting_fixed_asset_id: id });
}
