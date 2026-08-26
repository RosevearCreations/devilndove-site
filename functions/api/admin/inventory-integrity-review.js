// Devil n Dove Build 440 — Inventory physical-count and usage-setup review authority.
// Uses existing site_item_inventory, site_inventory_usage_profiles and site_inventory_movements.
// No request-time DDL. Reads are bounded; mutations are explicit Admin actions only.

import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';

const BUILD = 440;
const EPSILON = 1e-9;
const MAX_LIMIT = 80;
const MODES = new Set(['exact', 'estimated', 'log_only', 'reusable']);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function positiveId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
function text(value, max = 500) {
  return normalizeText(value).slice(0, max);
}
function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}
function mode(value, fallback = 'exact') {
  const v = text(value, 40).toLowerCase();
  return MODES.has(v) ? v : fallback;
}
function legacyUsageSetupRequired(row = {}) {
  if (String(row.source_type || '').trim().toLowerCase() !== 'supply') return false;
  if (mode(row.usage_tracking_mode, 'log_only') !== 'log_only') return false;
  const notes = String(row.usage_profile_notes || '').trim().toLowerCase();
  return !notes
    || notes.includes('until unit conversion is reviewed')
    || notes.includes('until unit conversion review')
    || notes.includes('legacy safe')
    || notes.includes('legacy supply')
    || notes.includes('catalog reconciliation');
}
function countState(lastCountedAt, nowMs = Date.now()) {
  if (!lastCountedAt) return 'never_counted';
  const parsed = Date.parse(String(lastCountedAt));
  if (!Number.isFinite(parsed)) return 'never_counted';
  const ageDays = Math.max(0, (nowMs - parsed) / 86400000);
  return ageDays >= 90 ? 'stale_count' : 'current';
}
function shape(row = {}) {
  const count_status = countState(row.last_counted_at);
  const usage_setup_required = legacyUsageSetupRequired(row) ? 1 : 0;
  return {
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    source_type: row.source_type || '',
    external_key: row.external_key || '',
    item_name: row.item_name || '',
    category: row.category || '',
    image_url: row.image_url || '',
    on_hand_quantity: num(row.on_hand_quantity),
    reserved_quantity: num(row.reserved_quantity),
    incoming_quantity: num(row.incoming_quantity),
    stock_unit_label: row.stock_unit_label || 'unit',
    usage_unit_label: row.usage_unit_label || 'unit',
    usage_units_per_stock_unit: Math.max(0.000001, num(row.usage_units_per_stock_unit, 1)),
    usage_tracking_mode: mode(row.usage_tracking_mode, String(row.source_type || '').toLowerCase() === 'tool' ? 'reusable' : 'exact'),
    minimum_usage_increment: Math.max(0.0001, num(row.minimum_usage_increment, 0.001)),
    usage_profile_notes: row.usage_profile_notes || '',
    last_counted_at: row.last_counted_at || null,
    updated_at: row.updated_at || null,
    count_status,
    physical_count_due: count_status === 'current' ? 0 : 1,
    usage_setup_required,
  };
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { response: json({ ok: false, build: BUILD, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { response: json({ ok: false, build: BUILD, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function loadItem(db, id) {
  return db.prepare(`
    SELECT sii.*,
      COALESCE(siup.usage_tracking_mode,
        CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
      ) AS usage_tracking_mode,
      COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment,
      COALESCE(siup.notes,'') AS usage_profile_notes
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id=?
    LIMIT 1
  `).bind(id).first();
}

async function listAttention(db, options = {}) {
  const q = text(options.q, 120).toLowerCase();
  const queue = ['all', 'count_due', 'usage_setup'].includes(String(options.queue || 'all')) ? String(options.queue || 'all') : 'all';
  const limit = Math.max(10, Math.min(MAX_LIMIT, Math.trunc(num(options.limit, 40)) || 40));
  const offset = Math.max(0, Math.trunc(num(options.offset, 0)) || 0);
  const like = `%${q}%`;

  const result = await db.prepare(`
    SELECT sii.*,
      COALESCE(siup.usage_tracking_mode,
        CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
      ) AS usage_tracking_mode,
      COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment,
      COALESCE(siup.notes,'') AS usage_profile_notes
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE COALESCE(sii.is_active,1)=1
      AND (?='' OR LOWER(COALESCE(sii.item_name,'')) LIKE ? OR LOWER(COALESCE(sii.external_key,'')) LIKE ? OR LOWER(COALESCE(sii.category,'')) LIKE ?)
    ORDER BY
      CASE WHEN sii.last_counted_at IS NULL THEN 0 ELSE 1 END,
      COALESCE(sii.last_counted_at,'1970-01-01') ASC,
      LOWER(COALESCE(sii.item_name,'')) ASC,
      sii.site_item_inventory_id ASC
    LIMIT ? OFFSET ?
  `).bind(q, like, like, like, Math.min(240, limit * 3), offset).all();

  const shaped = rows(result).map(shape);
  const filtered = shaped.filter((item) => {
    if (queue === 'count_due') return item.physical_count_due === 1;
    if (queue === 'usage_setup') return item.usage_setup_required === 1;
    return item.physical_count_due === 1 || item.usage_setup_required === 1;
  }).slice(0, limit);

  const summaryRows = rows(await db.prepare(`
    SELECT sii.*,
      COALESCE(siup.usage_tracking_mode,
        CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
      ) AS usage_tracking_mode,
      COALESCE(siup.notes,'') AS usage_profile_notes,
      COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE COALESCE(sii.is_active,1)=1
  `).all()).map(shape);

  const summary = {
    active_items: summaryRows.length,
    count_due: summaryRows.filter((item) => item.physical_count_due === 1).length,
    never_counted: summaryRows.filter((item) => item.count_status === 'never_counted').length,
    stale_count: summaryRows.filter((item) => item.count_status === 'stale_count').length,
    usage_setup_required: summaryRows.filter((item) => item.usage_setup_required === 1).length,
  };

  return {
    items: filtered,
    summary,
    queue,
    limit,
    offset,
    next_offset: filtered.length === limit ? offset + Math.min(240, limit * 3) : null,
  };
}

async function logCountMovement(db, item, countedQuantity, reason, userId) {
  const previous = num(item.on_hand_quantity);
  const next = num(countedQuantity);
  return db.prepare(`
    INSERT INTO site_inventory_movements(
      site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
      previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
      previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
    ) VALUES(?,?,?,?, 'correction', ?,?,?,?,?,?,?,?, ?,?,CURRENT_TIMESTAMP)
  `).bind(
    Number(item.site_item_inventory_id), item.source_type || null, item.external_key || null, item.item_name || null,
    next - previous,
    previous, next,
    num(item.reserved_quantity), num(item.reserved_quantity),
    num(item.incoming_quantity), num(item.incoming_quantity),
    `Physical count. ${reason}`.slice(0, 500), Number(userId || 0) || null,
  );
}

async function recordPhysicalCount(context, granted, body) {
  const id = positiveId(body.site_item_inventory_id);
  const counted = Number(body.counted_quantity);
  const reason = text(body.reason, 300);
  if (!id || !Number.isFinite(counted) || counted < 0) {
    return json({ ok: false, build: BUILD, code: 'inventory_count_invalid', error: 'Choose an Inventory item and enter a physical count of zero or greater.' }, 400);
  }
  if (reason.length < 6) {
    return json({ ok: false, build: BUILD, code: 'inventory_count_reason_required', error: 'Add a short count note/reason of at least 6 characters.' }, 400);
  }

  const item = await loadItem(granted.db, id);
  if (!item || Number(item.is_active ?? 1) !== 1) {
    return json({ ok: false, build: BUILD, code: 'inventory_count_item_missing', error: 'The active Inventory item was not found.' }, 404);
  }

  const previous = num(item.on_hand_quantity);
  const statements = [
    granted.db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity=?,last_counted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?
    `).bind(counted, id, previous, EPSILON),
    await logCountMovement(granted.db, item, counted, reason, granted.adminUser.user_id),
  ];

  let results;
  try {
    results = await granted.db.batch(statements);
  } catch (error) {
    throw Object.assign(new Error('The physical-count transaction failed safely.'), { code: 'inventory_count_transaction_failed', cause: error });
  }
  if (Number(results?.[0]?.meta?.changes || 0) !== 1) {
    throw Object.assign(new Error('Inventory changed while the physical count was being saved. Refresh and count again.'), { status: 409, code: 'inventory_count_concurrent_change' });
  }

  const saved = shape(await loadItem(granted.db, id));
  await auditAdminAction(context.env, context.request, granted.adminUser, {
    action_type: 'inventory_physical_count',
    target_type: 'inventory_item',
    target_id: id,
    target_key: `${item.source_type || ''}:${item.external_key || ''}`,
    details: {
      previous_on_hand_quantity: previous,
      counted_quantity: counted,
      quantity_delta: counted - previous,
      reserved_quantity: num(item.reserved_quantity),
      reason,
    },
  });

  return json({
    ok: true,
    build: BUILD,
    message: counted === previous ? 'Physical count confirmed; on-hand quantity was unchanged.' : 'Physical count saved and an audited correction movement was recorded.',
    item: saved,
    shortage_against_reservations: counted < num(item.reserved_quantity) ? 1 : 0,
  });
}

async function saveUsageSetup(context, granted, body) {
  const id = positiveId(body.site_item_inventory_id);
  const item = id ? await loadItem(granted.db, id) : null;
  if (!item || Number(item.is_active ?? 1) !== 1) {
    return json({ ok: false, build: BUILD, code: 'inventory_usage_setup_item_missing', error: 'The active Inventory item was not found.' }, 404);
  }

  const trackingMode = mode(body.usage_tracking_mode, String(item.source_type || '').toLowerCase() === 'tool' ? 'reusable' : 'exact');
  const stockUnit = text(body.stock_unit_label, 40).toLowerCase() || 'unit';
  const usageUnit = text(body.usage_unit_label, 40).toLowerCase() || 'unit';
  const perStock = Number(body.usage_units_per_stock_unit);
  const minimum = Number(body.minimum_usage_increment);
  const reviewNote = text(body.review_note, 400);

  if (!Number.isFinite(perStock) || perStock <= 0 || !Number.isFinite(minimum) || minimum <= 0) {
    return json({ ok: false, build: BUILD, code: 'inventory_usage_setup_invalid_conversion', error: 'Usage conversion and minimum increment must both be greater than zero.' }, 400);
  }
  if (trackingMode === 'log_only' && reviewNote.length < 8) {
    return json({ ok: false, build: BUILD, code: 'inventory_usage_setup_log_only_review_required', error: 'If this item intentionally remains log-only, add a review note of at least 8 characters.' }, 400);
  }

  const reviewedNote = reviewNote || `Build 440 usage setup reviewed as ${trackingMode}.`;
  const statements = [
    granted.db.prepare(`
      UPDATE site_item_inventory
      SET stock_unit_label=?,usage_unit_label=?,usage_units_per_stock_unit=?,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=?
    `).bind(stockUnit, usageUnit, perStock, id),
    granted.db.prepare(`
      INSERT INTO site_inventory_usage_profiles(
        site_item_inventory_id,usage_tracking_mode,minimum_usage_increment,notes,updated_by_user_id,created_at,updated_at
      ) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(site_item_inventory_id) DO UPDATE SET
        usage_tracking_mode=excluded.usage_tracking_mode,
        minimum_usage_increment=excluded.minimum_usage_increment,
        notes=excluded.notes,
        updated_by_user_id=excluded.updated_by_user_id,
        updated_at=CURRENT_TIMESTAMP
    `).bind(id, trackingMode, minimum, reviewedNote, Number(granted.adminUser.user_id || 0) || null),
  ];
  await granted.db.batch(statements);

  const saved = shape(await loadItem(granted.db, id));
  await auditAdminAction(context.env, context.request, granted.adminUser, {
    action_type: 'inventory_usage_setup_review',
    target_type: 'inventory_item',
    target_id: id,
    target_key: `${item.source_type || ''}:${item.external_key || ''}`,
    details: {
      previous_tracking_mode: item.usage_tracking_mode || null,
      usage_tracking_mode: trackingMode,
      stock_unit_label: stockUnit,
      usage_unit_label: usageUnit,
      usage_units_per_stock_unit: perStock,
      minimum_usage_increment: minimum,
      review_note: reviewedNote,
    },
  });

  return json({ ok: true, build: BUILD, message: 'Usage setup reviewed and saved.', item: saved });
}

export async function onRequestGet(context) {
  const granted = await access(context);
  if (granted.response) return granted.response;
  try {
    const url = new URL(context.request.url);
    const data = await listAttention(granted.db, {
      q: url.searchParams.get('q'),
      queue: url.searchParams.get('queue'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    });
    return json({ ok: true, build: BUILD, mode: 'inventory-integrity-review', schema_mutation: false, ...data });
  } catch (error) {
    return json({ ok: false, build: BUILD, code: 'inventory_integrity_read_failed', error: error?.message || 'Inventory integrity review could not be loaded.' }, 500);
  }
}

export async function onRequestPost(context) {
  const granted = await access(context);
  if (granted.response) return granted.response;
  let body = {};
  try { body = await context.request.json(); }
  catch { return json({ ok: false, build: BUILD, code: 'inventory_integrity_json_required', error: 'A JSON request body is required.' }, 400); }

  const action = text(body.action, 60).toLowerCase();
  try {
    if (action === 'physical_count') return await recordPhysicalCount(context, granted, body);
    if (action === 'save_usage_setup') return await saveUsageSetup(context, granted, body);
    return json({ ok: false, build: BUILD, code: 'inventory_integrity_action_unsupported', error: 'Unsupported Inventory integrity action.' }, 400);
  } catch (error) {
    const status = Number(error?.status || 500);
    const code = String(error?.code || 'inventory_integrity_action_failed');
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'inventory_integrity_review',
      incident_code: code,
      severity: status >= 500 ? 'error' : 'warning',
      message: error?.message || 'Inventory integrity action failed.',
      related_user_id: Number(granted.adminUser.user_id || 0) || null,
      details: { action, site_item_inventory_id: positiveId(body.site_item_inventory_id), diagnostic: String(error?.cause?.message || '').slice(0, 240) },
    }).catch(() => null);
    return json({ ok: false, build: BUILD, code, error: error?.message || 'Inventory integrity action failed safely.' }, status);
  }
}
