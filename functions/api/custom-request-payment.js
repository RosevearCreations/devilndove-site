// File: /functions/api/custom-request-payment.js
// Brief description: Public token endpoint for approved custom request payment links. It exposes reviewed payment details, records readiness notes, and prepares Stripe/PayPal/Square checkout handoffs for connected order records.

import { onRequestPost as prepareCheckoutPayment } from './checkout-prepare-payment.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) {
  const text = String(value || '').trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}
function money(cents, currency = 'CAD') {
  const amount = Number(cents || 0) / 100;
  try { return amount.toLocaleString('en-CA', { style: 'currency', currency }); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}

async function ensureColumn(db, tableName, columnName, definition) {
  const info = await db.prepare(`PRAGMA table_info(${tableName})`).all().catch(() => ({ results: [] }));
  const exists = rows(info).some((row) => String(row.name || '').toLowerCase() === String(columnName).toLowerCase());
  if (!exists) await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`).run().catch(() => null);
}

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_links (
    custom_request_payment_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    payment_request_draft_id INTEGER,
    quote_draft_id INTEGER,
    payment_link_key TEXT NOT NULL UNIQUE,
    link_token TEXT NOT NULL UNIQUE,
    link_status TEXT NOT NULL DEFAULT 'active',
    link_url_path TEXT NOT NULL,
    request_type TEXT NOT NULL DEFAULT 'deposit',
    amount_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'CAD',
    customer_name TEXT,
    customer_email TEXT,
    provider TEXT NOT NULL DEFAULT 'manual_review',
    provider_reference TEXT,
    approval_notes TEXT,
    customer_viewed_at TEXT,
    customer_ready_at TEXT,
    customer_note TEXT,
    approved_by_user_id INTEGER,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await ensureColumn(db, 'custom_request_payment_links', 'provider', "provider TEXT NOT NULL DEFAULT 'manual_review'");
  await ensureColumn(db, 'custom_request_payment_links', 'provider_reference', 'provider_reference TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_viewed_at', 'customer_viewed_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_ready_at', 'customer_ready_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_note', 'customer_note TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'viewed_at', 'viewed_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'ready_to_pay_at', 'ready_to_pay_at TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'customer_ready_note', 'customer_ready_note TEXT');
  await ensureColumn(db, 'custom_request_payment_links', 'order_id', 'order_id INTEGER');
  await ensureColumn(db, 'custom_request_payment_links', 'payment_id', 'payment_id INTEGER');
  await ensureColumn(db, 'custom_request_payment_links', 'external_share_status', "external_share_status TEXT NOT NULL DEFAULT 'gate_pending'");
  await ensureColumn(db, 'custom_request_payment_links', 'gate_status', "gate_status TEXT NOT NULL DEFAULT 'pending'");
  await ensureColumn(db, 'custom_request_payment_links', 'preferred_provider', "preferred_provider TEXT NOT NULL DEFAULT 'manual'");
  await ensureColumn(db, 'custom_request_payment_links', 'checkout_redirect_url', 'checkout_redirect_url TEXT');
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_payment_checkout_records (
    custom_request_payment_checkout_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    payment_link_id INTEGER,
    order_id INTEGER,
    payment_id INTEGER,
    provider TEXT NOT NULL DEFAULT 'manual',
    checkout_status TEXT NOT NULL DEFAULT 'prepared',
    provider_order_id TEXT,
    provider_payment_id TEXT,
    redirect_url TEXT,
    mode TEXT,
    source_payload_json TEXT DEFAULT '{}',
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_checkout_records_request ON custom_request_payment_checkout_records(custom_request_id, provider, checkout_status, updated_at)`).run().catch(() => null);
}


async function loadLink(db, token) {
  await ensureSchema(db);
  const link = await db.prepare(`SELECT * FROM custom_request_payment_links WHERE link_token=? LIMIT 1`).bind(token).first();
  if (!link) return null;
  if (String(link.link_status || '').toLowerCase() === 'void') return null;
  if (String(link.external_share_status || 'share_allowed').toLowerCase() !== 'share_allowed') return null;
  if (String(link.gate_status || 'passed').toLowerCase() !== 'passed') return null;
  await db.prepare(`UPDATE custom_request_payment_links SET link_status=CASE WHEN link_status='active' THEN 'viewed' ELSE link_status END, customer_viewed_at=COALESCE(customer_viewed_at,CURRENT_TIMESTAMP), viewed_at=COALESCE(viewed_at,CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP WHERE custom_request_payment_link_id=?`).bind(Number(link.custom_request_payment_link_id || 0)).run().catch(() => null);
  const quote = await db.prepare(`SELECT title, scope_notes, quote_total_cents FROM custom_request_quote_drafts WHERE custom_request_quote_draft_id=? LIMIT 1`).bind(Number(link.quote_draft_id || 0)).first().catch(() => null);
  const order = Number(link.order_id || 0) ? await db.prepare(`SELECT order_id, order_number, order_status, payment_status, payment_method, total_cents, currency FROM orders WHERE order_id=? LIMIT 1`).bind(Number(link.order_id || 0)).first().catch(() => null) : null;
  const checkoutRecords = rows(await db.prepare(`SELECT provider, checkout_status, provider_order_id, provider_payment_id, redirect_url, mode, updated_at FROM custom_request_payment_checkout_records WHERE payment_link_id=? ORDER BY datetime(updated_at) DESC`).bind(Number(link.custom_request_payment_link_id || 0)).all().catch(() => ({ results: [] })));
  return {
    payment_link_key: link.payment_link_key || '',
    link_status: link.link_status || 'active',
    request_type: link.request_type || 'deposit',
    amount_cents: Number(link.amount_cents || 0),
    amount_label: money(link.amount_cents, link.currency || 'CAD'),
    tax_cents: Number(link.tax_cents || 0),
    tax_label: money(link.tax_cents, link.currency || 'CAD'),
    currency: link.currency || 'CAD',
    customer_name: link.customer_name || '',
    customer_email: link.customer_email || '',
    quote_title: quote?.title || 'Custom Devil n Dove request',
    scope_notes: quote?.scope_notes || '',
    approval_notes: link.approval_notes || '',
    provider: link.provider || 'manual_review',
    provider_reference: link.provider_reference || '',
    ready_at: link.customer_ready_at || link.ready_to_pay_at || '',
    customer_note: link.customer_note || link.customer_ready_note || '',
    order_id: Number(link.order_id || 0) || null,
    order_number: order?.order_number || '',
    order_status: order?.order_status || '',
    payment_status: order?.payment_status || '',
    checkout_records: checkoutRecords,
    provider_options: ['stripe','paypal','square','manual'],
    safety_note: 'This is an approved Devil n Dove payment request page connected to a reviewed order. Stripe or PayPal can redirect when configured; Square/manual records stay pending until confirmed.'
  };
}

export async function onRequestGet(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const token = clean(new URL(context.request.url).searchParams.get('token'), 160);
  if (!token || !token.startsWith('pay_')) return json({ ok: false, error: 'A valid payment token is required.' }, 400);
  const link = await loadLink(db, token);
  if (!link) return json({ ok: false, error: 'Payment link not found or no longer active.' }, 404);
  return json({ ok: true, payment: link });
}

async function prepareProviderCheckout(context, db, link, provider) {
  const safeProvider = ['stripe', 'paypal', 'square', 'manual'].includes(provider) ? provider : 'manual';
  const orderId = Number(link.order_id || 0);
  if (!orderId) throw new Error('This payment link is not connected to a reviewed order yet.');
  let prepData = null;
  if (['stripe','paypal','square','manual'].includes(safeProvider)) {
    const prepRequest = new Request(context.request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, provider: safeProvider })
    });
    const prepResponse = await prepareCheckoutPayment({ request: prepRequest, env: context.env });
    prepData = await prepResponse.json().catch(() => null);
    if (!prepResponse.ok || !prepData?.ok) throw new Error(prepData?.error || `Could not prepare ${safeProvider} checkout.`);
  }
  const prep = prepData?.payment_preparation || {};
  const stub = prep.payment_stub || {};
  const insert = await db.prepare(`INSERT INTO custom_request_payment_checkout_records (custom_request_id, payment_link_id, order_id, payment_id, provider, checkout_status, provider_order_id, provider_payment_id, redirect_url, mode, source_payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    Number(link.custom_request_id || 0),
    Number(link.custom_request_payment_link_id || 0),
    orderId,
    Number(stub.payment_id || link.payment_id || 0) || null,
    safeProvider,
    prep.redirect_url ? 'redirect_created' : (safeProvider === 'manual' ? 'manual_ready' : 'prepared_pending'),
    prep.provider_order_id || stub.provider_order_id || null,
    prep.provider_payment_id || stub.provider_payment_id || null,
    prep.redirect_url || null,
    prep.mode || stub.mode || 'pending',
    JSON.stringify(prepData || {})
  ).run();
  await db.prepare(`UPDATE custom_request_payment_links SET provider=?, preferred_provider=?, payment_id=COALESCE(?, payment_id), checkout_redirect_url=COALESCE(?, checkout_redirect_url), updated_at=CURRENT_TIMESTAMP WHERE custom_request_payment_link_id=?`).bind(
    safeProvider,
    safeProvider,
    Number(stub.payment_id || link.payment_id || 0) || null,
    prep.redirect_url || null,
    Number(link.custom_request_payment_link_id || 0)
  ).run().catch(() => null);
  return {
    checkout_record_id: Number(insert?.meta?.last_row_id || 0) || null,
    provider: safeProvider,
    redirect_url: prep.redirect_url || null,
    mode: prep.mode || 'prepared',
    payment_stub: stub
  };
}


export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const token = clean(body.token, 160);
  if (!token || !token.startsWith('pay_')) return json({ ok: false, error: 'A valid payment token is required.' }, 400);
  await ensureSchema(db);
  const link = await db.prepare(`SELECT * FROM custom_request_payment_links WHERE link_token=? LIMIT 1`).bind(token).first();
  if (!link || String(link.link_status || '').toLowerCase() === 'void') return json({ ok: false, error: 'Payment link not found or no longer active.' }, 404);
  if (String(link.external_share_status || 'share_allowed').toLowerCase() !== 'share_allowed' || String(link.gate_status || 'passed').toLowerCase() !== 'passed') return json({ ok: false, error: 'This payment link has not passed the required admin share gates yet.' }, 403);
  const action = clean(body.action || 'ready_to_pay', 60).toLowerCase();
  if (action === 'prepare_checkout') {
    try {
      const checkout = await prepareProviderCheckout(context, db, link, clean(body.provider || 'manual', 30).toLowerCase());
      return json({ ok: true, message: checkout.redirect_url ? 'Checkout redirect prepared.' : 'Payment checkout record prepared. We will confirm final payment instructions.', checkout });
    } catch (error) {
      return json({ ok: false, error: String(error?.message || error || 'Could not prepare checkout.') }, 502);
    }
  }
  const note = clean(body.customer_note, 1000);
  await db.prepare(`UPDATE custom_request_payment_links SET link_status='ready_to_pay', customer_ready_at=CURRENT_TIMESTAMP, ready_to_pay_at=CURRENT_TIMESTAMP, customer_note=?, customer_ready_note=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_payment_link_id=?`).bind(note || null, note || null, Number(link.custom_request_payment_link_id || 0)).run();
  return json({ ok: true, message: 'Payment readiness note saved. Devil n Dove still needs to send or confirm the final payment method.' });
}
