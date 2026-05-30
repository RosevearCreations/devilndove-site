// File: /functions/api/custom-request-order.js
// Brief description: Public noindex token endpoint for customer custom-request order status pages.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 200) { const text = String(value || '').trim(); return text.length > limit ? text.slice(0, limit).trim() : text; }

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_order_status_links (
    custom_request_order_status_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    order_status_token TEXT NOT NULL UNIQUE,
    link_status TEXT NOT NULL DEFAULT 'active',
    customer_email TEXT,
    customer_name TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_order_status_links_token ON custom_request_order_status_links(order_status_token, link_status)`).run().catch(() => null);
}

export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const token = clean(new URL(context.request.url).searchParams.get('token'), 180);
  if (!token || !token.startsWith('order_')) return json({ ok: false, error: 'A valid order token is required.' }, 400);
  await ensureSchema(db);
  const link = await db.prepare(`SELECT * FROM custom_request_order_status_links WHERE order_status_token=? AND COALESCE(link_status,'active') <> 'void' LIMIT 1`).bind(token).first().catch(() => null);
  if (!link) return json({ ok: false, error: 'Order status link was not found or is no longer active.' }, 404);
  await db.prepare(`UPDATE custom_request_order_status_links SET link_status=CASE WHEN link_status='active' THEN 'viewed' ELSE link_status END, updated_at=CURRENT_TIMESTAMP WHERE custom_request_order_status_link_id=?`).bind(Number(link.custom_request_order_status_link_id || 0)).run().catch(() => null);
  const order = await db.prepare(`SELECT order_id, order_number, customer_email, customer_name, order_status, payment_status, payment_method, fulfillment_type, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, notes, created_at, updated_at FROM orders WHERE order_id=? LIMIT 1`).bind(Number(link.order_id || 0)).first().catch(() => null);
  if (!order) return json({ ok: false, error: 'The connected order record was not found.' }, 404);
  const items = rows(await db.prepare(`SELECT order_item_id, sku, product_name, product_type, unit_price_cents, quantity, line_subtotal_cents, taxable, requires_shipping, created_at FROM order_items WHERE order_id=? ORDER BY order_item_id ASC`).bind(Number(order.order_id || 0)).all().catch(() => ({ results: [] })));
  return json({ ok: true, order, items, link: { link_status: link.link_status || 'active', custom_request_id: Number(link.custom_request_id || 0) || null } });
}
