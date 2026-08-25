// Devil n Dove Build 397 — Operations-owned Customer Documents read authority.
// Build 414 exports the same schema readiness for mutation preconditions.
// Performs readiness checks and bounded SELECTs only. No DDL or mutation.

export const BUILD = 397;
export const READINESS_EXPORT_BUILD = 414;
export const CONTRACT_ID = 'operations-customer-documents-read';
export const OWNER = 'operations';
export const MIGRATION_AUTHORITY = 'database_customer_documents_runtime_parity.sql';

const REQUIRED = Object.freeze({
  customer_document_sequences: Object.freeze(['document_type', 'sequence_year', 'next_number', 'updated_at']),
  customer_documents: Object.freeze([
    'customer_document_id', 'document_number', 'document_type', 'order_id', 'refund_id',
    'document_status', 'currency', 'document_amount_cents', 'tax_adjustment_cents',
    'issue_reason', 'customer_email', 'business_name', 'business_registration_number',
    'source_snapshot_json', 'issued_by_user_id', 'issued_at', 'voided_by_user_id',
    'voided_at', 'void_reason', 'created_at', 'updated_at',
  ]),
  orders: Object.freeze([
    'order_id', 'order_number', 'customer_name', 'customer_email', 'order_status',
    'payment_status', 'fulfillment_type', 'currency', 'total_cents', 'tax_cents', 'created_at',
  ]),
  order_items: Object.freeze([
    'order_item_id', 'order_id', 'product_id', 'sku', 'product_name', 'product_type',
    'unit_price_cents', 'quantity', 'line_subtotal_cents', 'taxable', 'tax_class_code', 'requires_shipping',
  ]),
  payments: Object.freeze([
    'payment_id', 'order_id', 'provider', 'provider_payment_id', 'payment_status',
    'amount_cents', 'currency', 'payment_method_label', 'transaction_reference', 'paid_at', 'created_at',
  ]),
  payment_refunds: Object.freeze([
    'refund_id', 'order_id', 'payment_id', 'provider', 'provider_refund_id', 'amount_cents',
    'currency', 'refund_status', 'reason', 'note', 'created_at', 'updated_at',
  ]),
});

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function positiveId(value) { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; }
async function columnsFor(db, table) {
  try {
    return new Set(rows(await db.prepare(`PRAGMA table_info(${table})`).all())
      .map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch { return new Set(); }
}

export async function readCustomerDocumentsSchemaReadiness(db) {
  const missingTables = [];
  const missingColumns = [];
  const ready = {};
  for (const [table, required] of Object.entries(REQUIRED)) {
    const columns = await columnsFor(db, table);
    if (!columns.size) {
      missingTables.push(table);
      ready[table] = false;
      continue;
    }
    const misses = required.filter((name) => !columns.has(name));
    missingColumns.push(...misses.map((name) => `${table}.${name}`));
    ready[table] = misses.length === 0;
  }
  return Object.freeze({
    build: READINESS_EXPORT_BUILD,
    owner: OWNER,
    migration_authority: MIGRATION_AUTHORITY,
    schema_ready: missingTables.length === 0 && missingColumns.length === 0,
    missing_tables: Object.freeze(missingTables),
    missing_columns: Object.freeze(missingColumns),
    ready: Object.freeze(ready),
    request_time_schema_mutation: false,
  });
}

async function loadOrderDetail(db, orderId, ready) {
  const id = positiveId(orderId);
  if (!id || !ready.orders) return null;
  const order = await db.prepare('SELECT * FROM orders WHERE order_id=? LIMIT 1').bind(id).first().catch(() => null);
  if (!order) return null;
  const items = ready.order_items ? rows(await db.prepare(`SELECT order_item_id,product_id,sku,product_name,product_type,unit_price_cents,quantity,line_subtotal_cents,taxable,tax_class_code,requires_shipping FROM order_items WHERE order_id=? ORDER BY order_item_id`).bind(id).all().catch(() => ({ results: [] }))) : [];
  const payments = ready.payments ? rows(await db.prepare(`SELECT payment_id,provider,provider_payment_id,payment_status,amount_cents,currency,payment_method_label,transaction_reference,paid_at,created_at FROM payments WHERE order_id=? ORDER BY created_at,payment_id`).bind(id).all().catch(() => ({ results: [] }))) : [];
  const refunds = ready.payment_refunds ? rows(await db.prepare(`SELECT refund_id,payment_id,provider,provider_refund_id,amount_cents,currency,refund_status,reason,note,created_at,updated_at FROM payment_refunds WHERE order_id=? ORDER BY created_at,refund_id`).bind(id).all().catch(() => ({ results: [] }))) : [];
  return Object.freeze({ order, items: Object.freeze(items), payments: Object.freeze(payments), refunds: Object.freeze(refunds) });
}

export async function readCustomerDocuments(db, { orderId = 0, documentId = 0 } = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const check = await readCustomerDocumentsSchemaReadiness(db);

  const orders = check.ready.orders ? rows(await db.prepare(`
    SELECT o.order_id,o.order_number,o.customer_name,o.customer_email,o.order_status,o.payment_status,
           o.fulfillment_type,o.currency,o.total_cents,o.tax_cents,o.created_at,
           ${check.ready.payment_refunds ? "COALESCE((SELECT SUM(pr.amount_cents) FROM payment_refunds pr WHERE pr.order_id=o.order_id AND COALESCE(pr.refund_status,'recorded') NOT IN ('failed','cancelled')),0)" : '0'} AS refunded_cents
    FROM orders o ORDER BY o.created_at DESC,o.order_id DESC LIMIT 300
  `).all().catch(() => ({ results: [] }))) : [];

  const documents = check.ready.customer_documents ? rows(await db.prepare(`SELECT customer_document_id,document_number,document_type,order_id,refund_id,document_status,currency,document_amount_cents,tax_adjustment_cents,issue_reason,customer_email,business_name,business_registration_number,issued_at,voided_at,void_reason FROM customer_documents ORDER BY issued_at DESC,customer_document_id DESC LIMIT 300`).all().catch(() => ({ results: [] }))) : [];

  let documentDetail = null;
  const docId = positiveId(documentId);
  if (docId && check.ready.customer_documents) {
    const row = await db.prepare('SELECT * FROM customer_documents WHERE customer_document_id=? LIMIT 1').bind(docId).first().catch(() => null);
    if (row) {
      let sourceSnapshot = {};
      try { sourceSnapshot = JSON.parse(row.source_snapshot_json || '{}'); } catch {}
      documentDetail = Object.freeze({ ...row, source_snapshot: sourceSnapshot });
    }
  }

  return Object.freeze({
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    schema_ready: check.schema_ready,
    missing_tables: check.missing_tables,
    missing_columns: check.missing_columns,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    migration_authority: MIGRATION_AUTHORITY,
    compatibility_post_authority: '/api/admin/customer-documents',
    orders: Object.freeze(orders),
    documents: Object.freeze(documents),
    detail: await loadOrderDetail(db, orderId, check.ready),
    document_detail: documentDetail,
  });
}
