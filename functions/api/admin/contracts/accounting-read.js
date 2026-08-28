// Current-release Accounting-owned bounded read contract for Operations.
// Authority is the existing accounting_order_records projection. This route is GET-only,
// performs no request-time schema creation/repair, and exposes no journal/bank/close mutation surface.

import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../../_lib/adminAudit.js';
import { currentReleaseMetadata } from '../../_lib/releaseAuthority.js';

export const CONTRACT_ID = 'accounting-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_order_records';

const REQUIRED_COLUMNS = Object.freeze([
  'accounting_order_record_id',
  'order_id',
  'order_number',
  'entry_status',
  'currency',
  'total_cents',
  'amount_paid_cents',
  'amount_outstanding_cents',
  'tax_liability_cents',
  'source_order_status',
  'source_payment_status',
  'created_at',
  'updated_at',
]);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function boundedInt(value, fallback = 25, min = 1, max = 100) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.max(min, Math.min(max, n));
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`
    ).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => normalizeText(row?.name)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function emptySummary() {
  return Object.freeze({
    records_count: 0,
    total_booked_cents: 0,
    total_paid_cents: 0,
    total_outstanding_cents: 0,
    total_tax_cents: 0,
    open_records_count: 0,
  });
}

function shapeSummary(row = {}) {
  return Object.freeze({
    records_count: Number(row.records_count || 0),
    total_booked_cents: Number(row.total_booked_cents || 0),
    total_paid_cents: Number(row.total_paid_cents || 0),
    total_outstanding_cents: Number(row.total_outstanding_cents || 0),
    total_tax_cents: Number(row.total_tax_cents || 0),
    open_records_count: Number(row.open_records_count || 0),
  });
}

function shapeRecord(row = {}) {
  return Object.freeze({
    accounting_order_record_id: Number(row.accounting_order_record_id || 0),
    order_id: Number(row.order_id || 0),
    order_number: normalizeText(row.order_number),
    entry_status: normalizeText(row.entry_status) || 'open',
    currency: normalizeText(row.currency || 'CAD').toUpperCase() || 'CAD',
    total_cents: Number(row.total_cents || 0),
    amount_paid_cents: Number(row.amount_paid_cents || 0),
    amount_outstanding_cents: Number(row.amount_outstanding_cents || 0),
    tax_liability_cents: Number(row.tax_liability_cents || 0),
    source_order_status: normalizeText(row.source_order_status),
    source_payment_status: normalizeText(row.source_payment_status),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  });
}

function readinessPayload(adminUser, extra = {}) {
  return {
    ok: true,
    ...currentReleaseMetadata(),
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-order-financial-state',
    authority_table: AUTHORITY_TABLE,
    request_time_schema_mutation: false,
    requested_by: adminUser,
    ...extra,
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, ...currentReleaseMetadata(), error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, ...currentReleaseMetadata(), error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const limit = boundedInt(url.searchParams.get('limit'));
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();

  try {
    const exists = await tableExists(db, AUTHORITY_TABLE);
    if (!exists) {
      return json(readinessPayload(adminUser, {
        schema_ready: false,
        missing_tables: [AUTHORITY_TABLE],
        missing_columns: [],
        summary: emptySummary(),
        records: [],
        count: 0,
      }));
    }

    const columns = await tableColumns(db, AUTHORITY_TABLE);
    const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
    if (missingColumns.length) {
      return json(readinessPayload(adminUser, {
        schema_ready: false,
        missing_tables: [],
        missing_columns: missingColumns,
        summary: emptySummary(),
        records: [],
        count: 0,
      }));
    }

    const summaryRow = await db.prepare(`
      SELECT
        COUNT(*) AS records_count,
        COALESCE(SUM(total_cents),0) AS total_booked_cents,
        COALESCE(SUM(amount_paid_cents),0) AS total_paid_cents,
        COALESCE(SUM(amount_outstanding_cents),0) AS total_outstanding_cents,
        COALESCE(SUM(tax_liability_cents),0) AS total_tax_cents,
        COALESCE(SUM(CASE WHEN entry_status IN ('open','partially_paid') THEN 1 ELSE 0 END),0) AS open_records_count
      FROM accounting_order_records
    `).first();

    const recent = await db.prepare(`
      SELECT
        accounting_order_record_id,
        order_id,
        order_number,
        entry_status,
        currency,
        total_cents,
        amount_paid_cents,
        amount_outstanding_cents,
        tax_liability_cents,
        source_order_status,
        source_payment_status,
        created_at,
        updated_at
      FROM accounting_order_records
      WHERE (?='' OR LOWER(COALESCE(entry_status,''))=?)
      ORDER BY created_at DESC, accounting_order_record_id DESC
      LIMIT ?
    `).bind(status, status, limit).all();

    const records = rows(recent).map(shapeRecord);
    return json(readinessPayload(adminUser, {
      schema_ready: true,
      missing_tables: [],
      missing_columns: [],
      summary: shapeSummary(summaryRow),
      records,
      count: records.length,
    }));
  } catch (error) {
    return json({
      ok: false,
      ...currentReleaseMetadata(),
      contract: CONTRACT_ID,
      owner: OWNER,
      error: 'Accounting read contract failed.',
      error_code: 'accounting_read_failed',
      detail: String(error?.message || error),
    }, 500);
  }
}
