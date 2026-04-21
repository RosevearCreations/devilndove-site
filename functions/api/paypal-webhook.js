import { processNotificationOutbox, queueNotification } from './_lib/notificationOutbox.js';

// File: /functions/api/paypal-webhook.js
// Brief description: Receives PayPal webhook events, verifies the signature, records idempotent
// webhook history, and reconciles local payment/order state for payment and refund events.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getDb(env) {
  return env.DB || env.DD_DB;
}

async function getPaypalAccessToken(env) {
  const clientId = normalizeText(env.PAYPAL_CLIENT_ID);
  const secret = normalizeText(env.PAYPAL_SECRET);
  const mode = normalizeText(env.PAYPAL_ENV || "sandbox").toLowerCase() || "sandbox";
  if (!clientId || !secret) return null;

  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const basic = btoa(`${clientId}:${secret}`);

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Failed to obtain PayPal access token.");
  }

  return { access_token: data.access_token, base, mode };
}

async function verifyWebhook(request, env, bodyText) {
  const webhookId = normalizeText(env.PAYPAL_WEBHOOK_ID);
  const auth = await getPaypalAccessToken(env);
  if (!auth || !webhookId) {
    return { verified: false, verification_mode: "skipped" };
  }

  const verificationPayload = {
    auth_algo: request.headers.get("paypal-auth-algo") || "",
    cert_url: request.headers.get("paypal-cert-url") || "",
    transmission_id: request.headers.get("paypal-transmission-id") || "",
    transmission_sig: request.headers.get("paypal-transmission-sig") || "",
    transmission_time: request.headers.get("paypal-transmission-time") || "",
    webhook_id: webhookId,
    webhook_event: JSON.parse(bodyText)
  };

  const response = await fetch(`${auth.base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(verificationPayload)
  });
  const data = await response.json().catch(() => null);
  const status = String(data?.verification_status || "").toUpperCase();
  return {
    verified: response.ok && status === "SUCCESS",
    verification_mode: "paypal",
    raw_status: status || "UNKNOWN"
  };
}

async function addHistory(env, orderId, oldStatus, newStatus, note) {
  const db = getDb(env);
  await db.prepare(`
    INSERT INTO order_status_history (
      order_id, old_status, new_status, changed_by_user_id, note, created_at
    ) VALUES (?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)
  `).bind(orderId, oldStatus || null, newStatus, note || null).run();
}

function mapPaymentStatus(eventType, resourceStatus) {
  const type = normalizeText(eventType).toUpperCase();
  const status = normalizeText(resourceStatus).toUpperCase();

  if (type.includes("CAPTURE.COMPLETED") || status === "COMPLETED") return "paid";
  if (type.includes("CAPTURE.PENDING") || status === "PENDING") return "pending";
  if (type.includes("CAPTURE.DENIED") || type.includes("CAPTURE.DECLINED") || status === "DECLINED" || status === "DENIED") return "failed";
  if (type.includes("CAPTURE.REFUNDED") || type.includes("SALE.REFUNDED") || status === "REFUNDED") return "refunded";
  if (type.includes("CAPTURE.REVERSED") || status === "REVERSED") return "refunded";
  return "pending";
}

function deriveOrderStatus(existingOrderStatus, localPaymentStatus) {
  const current = normalizeText(existingOrderStatus).toLowerCase() || "pending";
  if (localPaymentStatus === "paid" && ["pending", "draft"].includes(current)) return "paid";
  if (localPaymentStatus === "refunded" && ["paid", "fulfilled"].includes(current)) return "refunded";
  return current;
}

async function ensureGiftCardWebhookColumns(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_cards (
    gift_card_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'CAD',
    initial_amount_cents INTEGER NOT NULL DEFAULT 0,
    remaining_amount_cents INTEGER NOT NULL DEFAULT 0,
    issued_to_email TEXT,
    issued_to_name TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TEXT,
    last_redeemed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => null);
  const additions = [
    ['recipient_email', 'recipient_email TEXT'],
    ['recipient_name', 'recipient_name TEXT'],
    ['recipient_note', 'recipient_note TEXT'],
    ['purchaser_email', 'purchaser_email TEXT'],
    ['purchaser_name', 'purchaser_name TEXT'],
    ['purchaser_user_id', 'purchaser_user_id INTEGER'],
    ['order_id', 'order_id INTEGER'],
    ['purchase_source', 'purchase_source TEXT']
  ];
  const info = await db.prepare(`PRAGMA table_info(gift_cards)`).all().catch(() => ({ results: [] }));
  const cols = new Set((Array.isArray(info?.results) ? info.results : []).map((row) => String(row?.name || '').trim()));
  for (const [name, ddl] of additions) {
    if (!cols.has(name)) await db.prepare(`ALTER TABLE gift_cards ADD COLUMN ${ddl}`).run().catch(() => null);
  }
}

async function activatePendingGiftCardsForOrder(env, order, payment, providerLabel) {
  const db = getDb(env);
  await ensureGiftCardWebhookColumns(db);
  const pending = (await db.prepare(`
    SELECT gift_card_id, code, currency, initial_amount_cents, remaining_amount_cents,
           COALESCE(recipient_email, issued_to_email) AS recipient_email,
           COALESCE(recipient_name, issued_to_name) AS recipient_name,
           purchaser_email, purchaser_name, recipient_note, note, expires_at, status
    FROM gift_cards
    WHERE order_id = ?
      AND LOWER(COALESCE(status,'')) = 'pending_activation'
    ORDER BY gift_card_id ASC
  `).bind(Number(order?.order_id || 0)).all().catch(() => ({ results: [] }))).results || [];
  let activated_count = 0;
  for (const row of pending) {
    await db.prepare(`UPDATE gift_cards SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE gift_card_id = ?`).bind(Number(row.gift_card_id || 0)).run().catch(() => null);
    activated_count += 1;
    const destination = normalizeText(row.recipient_email || row.issued_to_email).toLowerCase();
    if (destination) {
      await queueNotification(db, {
        notification_kind: 'gift_card_issued',
        destination,
        related_order_id: Number(order?.order_id || 0),
        related_payment_id: Number(payment?.payment_id || 0),
        payload: {
          code: row.code || '',
          currency: row.currency || order?.currency || 'CAD',
          initial_amount_cents: Number(row.initial_amount_cents || 0),
          remaining_amount_cents: Number(row.remaining_amount_cents || 0),
          expires_at: row.expires_at || '',
          note: row.recipient_note || row.note || '',
          purchaser_name: row.purchaser_name || '',
          recipient_name: row.recipient_name || '',
          subject: row.purchaser_name ? `A Devil n Dove gift card from ${row.purchaser_name}` : 'Your Devil n Dove gift card'
        }
      }).catch(() => null);
    }
    const purchaserDestination = normalizeText(row.purchaser_email).toLowerCase();
    if (purchaserDestination) {
      await queueNotification(db, {
        notification_kind: 'gift_card_purchase_confirmation',
        destination: purchaserDestination,
        related_order_id: Number(order?.order_id || 0),
        related_payment_id: Number(payment?.payment_id || 0),
        payload: {
          code: row.code || '',
          currency: row.currency || order?.currency || 'CAD',
          initial_amount_cents: Number(row.initial_amount_cents || 0),
          purchaser_name: row.purchaser_name || '',
          recipient_name: row.recipient_name || '',
          subject: 'Your Devil n Dove gift card purchase is confirmed'
        }
      }).catch(() => null);
    }
  }
  if (activated_count > 0) {
    await processNotificationOutbox(env, { limit: Math.max(activated_count * 2, 3) }).catch(() => ({ ok: false }));
  }
  return activated_count;
}

async function registerWebhookEvent(env, provider, eventId, eventType, verification, payloadJson) {
  const db = getDb(env);
  const existing = await db.prepare(`
    SELECT webhook_event_id, process_status
    FROM webhook_events
    WHERE provider = ? AND provider_event_id = ?
    LIMIT 1
  `).bind(provider, eventId).first().catch(() => null);

  if (existing) {
    return {
      duplicate: true,
      webhook_event_id: Number(existing.webhook_event_id || 0),
      process_status: existing.process_status || "processed"
    };
  }

  const inserted = await db.prepare(`
    INSERT INTO webhook_events (
      provider,
      provider_event_id,
      event_type,
      verification_status,
      process_status,
      payload_json,
      received_at,
      updated_at
    ) VALUES (?, ?, ?, ?, 'received', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    provider,
    eventId,
    eventType || null,
    verification?.verified ? "verified" : (verification?.verification_mode || "skipped"),
    payloadJson
  ).run().catch(() => null);

  return {
    duplicate: false,
    webhook_event_id: Number(inserted?.meta?.last_row_id || 0),
    process_status: "received"
  };
}

async function markWebhookEvent(env, webhookEventId, processStatus, details = {}) {
  const db = getDb(env);
  if (!Number(webhookEventId)) return;
  const shouldCountAttempt = ['processed', 'failed', 'ignored', 'received'].includes(processStatus);
  const nextRetryAt = processStatus === 'failed'
    ? new Date(Date.now() + Number(env.WEBHOOK_RETRY_MINUTES || 15) * 60 * 1000).toISOString()
    : (details.next_retry_at ?? null);
  await db.prepare(`
    UPDATE webhook_events
    SET process_status = ?,
        related_order_id = COALESCE(?, related_order_id),
        related_payment_id = COALESCE(?, related_payment_id),
        error_text = ?,
        attempt_count = CASE WHEN ? THEN COALESCE(attempt_count, 0) + 1 ELSE COALESCE(attempt_count, 0) END,
        last_attempt_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE last_attempt_at END,
        next_retry_at = CASE WHEN ? = 'failed' THEN ? ELSE next_retry_at END,
        processed_at = CASE WHEN ? IN ('processed', 'ignored', 'duplicate') THEN CURRENT_TIMESTAMP ELSE processed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE webhook_event_id = ?
  `).bind(
    processStatus,
    details.related_order_id ?? null,
    details.related_payment_id ?? null,
    details.error_text ?? null,
    shouldCountAttempt ? 1 : 0,
    shouldCountAttempt ? 1 : 0,
    processStatus,
    nextRetryAt,
    processStatus,
    Number(webhookEventId)
  ).run().catch(() => null);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const bodyText = await request.text();
  let body;
  try {
    body = JSON.parse(bodyText || "{}");
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const verification = await verifyWebhook(request, env, bodyText);
  if (verification.verification_mode === "paypal" && !verification.verified) {
    return json({ ok: false, error: "PayPal webhook verification failed.", verification }, 401);
  }

  const eventType = normalizeText(body.event_type).toUpperCase();
  const eventId = normalizeText(body.id || request.headers.get("paypal-transmission-id") || crypto.randomUUID());
  const webhookEvent = await registerWebhookEvent(env, "paypal", eventId, eventType, verification, bodyText);

  if (webhookEvent.duplicate) {
    await markWebhookEvent(env, webhookEvent.webhook_event_id, "duplicate");
    return json({ ok: true, duplicate: true, verification, event_type: eventType || null, provider_event_id: eventId });
  }

  const resource = body.resource || {};
  const providerOrderId = normalizeText(resource.supplementary_data?.related_ids?.order_id || resource.id || "");
  const providerPaymentId = normalizeText(resource.id || "");
  const resourceStatus = normalizeText(resource.status || "");
  const amountValue = Number(resource.amount?.value || resource.seller_receivable_breakdown?.gross_amount?.value || 0);
  const amountCents = Number.isFinite(amountValue) ? Math.round(amountValue * 100) : 0;
  const paidAt = resource.create_time || resource.update_time || new Date().toISOString();
  const localPaymentStatus = mapPaymentStatus(eventType, resourceStatus);

  if (!providerOrderId) {
    await markWebhookEvent(env, webhookEvent.webhook_event_id, "ignored");
    return json({ ok: true, ignored: true, reason: "No provider order id present.", verification });
  }

  const payment = await db.prepare(`
    SELECT payment_id, order_id, provider_order_id, provider_payment_id, payment_status, amount_cents
    FROM payments
    WHERE LOWER(COALESCE(provider, '')) = 'paypal'
      AND provider_order_id = ?
    ORDER BY payment_id DESC
    LIMIT 1
  `).bind(providerOrderId).first();

  if (!payment) {
    await markWebhookEvent(env, webhookEvent.webhook_event_id, "ignored");
    return json({ ok: true, ignored: true, reason: "No local PayPal payment matched this webhook.", provider_order_id: providerOrderId, verification });
  }

  const order = await db.prepare(`
    SELECT order_id, order_number, order_status, payment_status, total_cents, currency
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `).bind(Number(payment.order_id || 0)).first();

  if (!order) {
    await markWebhookEvent(env, webhookEvent.webhook_event_id, "ignored", {
      related_payment_id: Number(payment.payment_id || 0)
    });
    return json({ ok: true, ignored: true, reason: "Local order was not found for matched payment.", verification });
  }

  await db.prepare(`
    UPDATE payments
    SET provider_payment_id = ?,
        payment_status = ?,
        amount_cents = CASE WHEN ? > 0 THEN ? ELSE amount_cents END,
        transaction_reference = ?,
        paid_at = ?,
        updated_at = CURRENT_TIMESTAMP,
        notes = COALESCE(notes, '') || ?
    WHERE payment_id = ?
  `).bind(
    providerPaymentId || null,
    localPaymentStatus,
    amountCents,
    amountCents,
    providerPaymentId || providerOrderId || null,
    paidAt,
    ` PayPal webhook processed: ${eventType || "UNKNOWN"}.`,
    Number(payment.payment_id || 0)
  ).run();

  const nextOrderStatus = deriveOrderStatus(order.order_status, localPaymentStatus);
  const nextPaymentStatus = localPaymentStatus === "paid" ? "paid" : localPaymentStatus;

  await db.prepare(`
    UPDATE orders
    SET payment_status = ?,
        order_status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `).bind(nextPaymentStatus, nextOrderStatus, Number(order.order_id || 0)).run();

  await addHistory(
    env,
    Number(order.order_id || 0),
    normalizeText(order.order_status).toLowerCase() || "pending",
    nextOrderStatus,
    `PayPal webhook reconciled event ${eventType || "UNKNOWN"} for provider order ${providerOrderId}.`
  );

  const giftCardActivationCount = localPaymentStatus === 'paid'
    ? await activatePendingGiftCardsForOrder(env, order, payment, 'paypal')
    : 0;

  await markWebhookEvent(env, webhookEvent.webhook_event_id, "processed", {
    related_order_id: Number(order.order_id || 0),
    related_payment_id: Number(payment.payment_id || 0)
  });

  return json({
    ok: true,
    verification,
    event_type: eventType || null,
    provider_order_id: providerOrderId,
    provider_payment_id: providerPaymentId || null,
    payment_status: localPaymentStatus,
    order: {
      order_id: Number(order.order_id || 0),
      order_number: order.order_number || "",
      order_status: nextOrderStatus,
      payment_status: nextPaymentStatus
    },
    gift_card_activation_count: giftCardActivationCount
  });
}
