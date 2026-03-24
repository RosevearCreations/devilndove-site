// File: /functions/api/stripe-webhook.js
// Brief description: Receives Stripe webhook events, verifies the signature, records idempotent
// webhook history, and reconciles local payment/order state for Checkout Session and refund events.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getDb(env) {
  return env.DB || env.DD_DB;
}

function secureCompare(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret, payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(request, env, bodyText) {
  const secret = normalizeText(env.STRIPE_WEBHOOK_SECRET);
  const signatureHeader = normalizeText(request.headers.get("stripe-signature"));

  if (!secret || !signatureHeader) {
    return { verified: false, verification_mode: secret ? "missing_header" : "skipped" };
  }

  const parts = signatureHeader.split(",").map((part) => part.trim()).filter(Boolean);
  const timestamp = normalizeText(parts.find((part) => part.startsWith("t="))?.slice(2));
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => normalizeText(part.slice(3)));

  if (!timestamp || !signatures.length) {
    return { verified: false, verification_mode: "invalid_header" };
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${bodyText}`);
  const verified = signatures.some((value) => secureCompare(value, expected));
  return {
    verified,
    verification_mode: "stripe",
    raw_status: verified ? "SUCCESS" : "FAILED"
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

function deriveOrderStatus(existingOrderStatus, localPaymentStatus) {
  const current = normalizeText(existingOrderStatus).toLowerCase() || "pending";
  if (localPaymentStatus === "paid" && ["pending", "draft"].includes(current)) return "paid";
  if (["refunded", "partially_refunded"].includes(localPaymentStatus) && ["paid", "fulfilled"].includes(current)) return "refunded";
  return current;
}

function mapStripePaymentStatus(eventType, object) {
  const type = normalizeText(eventType).toLowerCase();
  const paymentStatus = normalizeText(object?.payment_status || object?.status).toLowerCase();
  const refundStatus = Number(object?.amount_refunded || 0) > 0 || Number(object?.refunds?.data?.length || 0) > 0;

  if (type === "checkout.session.completed" && paymentStatus === "paid") return "paid";
  if (type === "checkout.session.async_payment_succeeded") return "paid";
  if (type === "payment_intent.succeeded") return "paid";
  if (type === "charge.refunded" && refundStatus) {
    const amountRefunded = Number(object?.amount_refunded || 0);
    const amountCaptured = Number(object?.amount || 0);
    return amountRefunded > 0 && amountRefunded < amountCaptured ? "partially_refunded" : "refunded";
  }
  if (type === "checkout.session.async_payment_failed" || type === "payment_intent.payment_failed") return "failed";
  if (paymentStatus === "paid") return "paid";
  if (["open", "unpaid", "pending", "processing", "requires_payment_method"].includes(paymentStatus)) return "pending";
  return "pending";
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
  await db.prepare(`
    UPDATE webhook_events
    SET process_status = ?,
        related_order_id = COALESCE(?, related_order_id),
        related_payment_id = COALESCE(?, related_payment_id),
        error_text = ?,
        processed_at = CASE WHEN ? IN ('processed', 'ignored', 'duplicate') THEN CURRENT_TIMESTAMP ELSE processed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE webhook_event_id = ?
  `).bind(
    processStatus,
    details.related_order_id ?? null,
    details.related_payment_id ?? null,
    details.error_text ?? null,
    processStatus,
    Number(webhookEventId)
  ).run().catch(() => null);
}

async function findPaymentForStripeEvent(env, object) {
  const db = getDb(env);
  const sessionId = normalizeText(object?.id);
  const paymentIntentId = normalizeText(object?.payment_intent || object?.payment_intent?.id || object?.id);
  const metadataOrderId = Number(object?.metadata?.order_id || object?.payment_intent?.metadata?.order_id || 0);

  if (sessionId) {
    const paymentBySession = await db.prepare(`
      SELECT payment_id, order_id, provider_order_id, provider_payment_id, payment_status, amount_cents
      FROM payments
      WHERE LOWER(COALESCE(provider, '')) = 'stripe'
        AND provider_order_id = ?
      ORDER BY payment_id DESC
      LIMIT 1
    `).bind(sessionId).first();
    if (paymentBySession) return paymentBySession;
  }

  if (paymentIntentId) {
    const paymentByIntent = await db.prepare(`
      SELECT payment_id, order_id, provider_order_id, provider_payment_id, payment_status, amount_cents
      FROM payments
      WHERE LOWER(COALESCE(provider, '')) = 'stripe'
        AND provider_payment_id = ?
      ORDER BY payment_id DESC
      LIMIT 1
    `).bind(paymentIntentId).first();
    if (paymentByIntent) return paymentByIntent;
  }

  if (metadataOrderId > 0) {
    const paymentByOrder = await db.prepare(`
      SELECT payment_id, order_id, provider_order_id, provider_payment_id, payment_status, amount_cents
      FROM payments
      WHERE LOWER(COALESCE(provider, '')) = 'stripe'
        AND order_id = ?
      ORDER BY payment_id DESC
      LIMIT 1
    `).bind(metadataOrderId).first();
    if (paymentByOrder) return paymentByOrder;
  }

  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const bodyText = await request.text();

  const verification = await verifyStripeSignature(request, env, bodyText);
  if (verification.verification_mode === "stripe" && !verification.verified) {
    return json({ ok: false, error: "Stripe webhook verification failed.", verification }, 401);
  }

  let body;
  try {
    body = JSON.parse(bodyText || "{}");
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const eventType = normalizeText(body.type).toLowerCase();
  const eventId = normalizeText(body.id || crypto.randomUUID());
  const webhookEvent = await registerWebhookEvent(env, "stripe", eventId, eventType, verification, bodyText);

  if (webhookEvent.duplicate) {
    await markWebhookEvent(env, webhookEvent.webhook_event_id, "duplicate");
    return json({ ok: true, duplicate: true, provider_event_id: eventId, event_type: eventType || null });
  }

  const object = body?.data?.object || {};
  const payment = await findPaymentForStripeEvent(env, object);

  if (!payment) {
    await markWebhookEvent(env, webhookEvent.webhook_event_id, "ignored");
    return json({ ok: true, ignored: true, reason: "No local Stripe payment matched this webhook.", event_type: eventType || null });
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
    return json({ ok: true, ignored: true, reason: "Local order was not found for matched payment." });
  }

  const sessionId = normalizeText(object?.object === "checkout.session" ? object.id : payment.provider_order_id || "");
  const paymentIntentId = normalizeText(object?.payment_intent || object?.id || payment.provider_payment_id || "");
  const amountCents = Number(object?.amount_total || object?.amount_received || object?.amount || payment.amount_cents || 0);
  const paidAt = object?.created ? new Date(Number(object.created) * 1000).toISOString() : new Date().toISOString();
  const localPaymentStatus = mapStripePaymentStatus(eventType, object);

  await db.prepare(`
    UPDATE payments
    SET provider_order_id = COALESCE(?, provider_order_id),
        provider_payment_id = CASE
          WHEN ? IS NOT NULL AND ? != '' THEN ?
          ELSE provider_payment_id
        END,
        payment_status = ?,
        amount_cents = CASE WHEN ? > 0 THEN ? ELSE amount_cents END,
        transaction_reference = COALESCE(?, transaction_reference),
        paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, ?) ELSE paid_at END,
        updated_at = CURRENT_TIMESTAMP,
        notes = COALESCE(notes, '') || ?
    WHERE payment_id = ?
  `).bind(
    sessionId || null,
    paymentIntentId || null,
    paymentIntentId || null,
    paymentIntentId || null,
    localPaymentStatus,
    amountCents,
    amountCents,
    paymentIntentId || sessionId || null,
    localPaymentStatus,
    paidAt,
    ` Stripe webhook processed: ${eventType || 'unknown'}.`,
    Number(payment.payment_id || 0)
  ).run();

  const nextOrderStatus = deriveOrderStatus(order.order_status, localPaymentStatus);
  const nextPaymentStatus = localPaymentStatus === "paid" ? "paid" : localPaymentStatus;

  await db.prepare(`
    UPDATE orders
    SET payment_status = ?,
        order_status = ?,
        payment_method = 'stripe',
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `).bind(nextPaymentStatus, nextOrderStatus, Number(order.order_id || 0)).run();

  await addHistory(
    env,
    Number(order.order_id || 0),
    normalizeText(order.order_status).toLowerCase() || "pending",
    nextOrderStatus,
    `Stripe webhook reconciled event ${eventType || "UNKNOWN"} for payment ${paymentIntentId || sessionId || "unknown"}.`
  );

  await markWebhookEvent(env, webhookEvent.webhook_event_id, "processed", {
    related_order_id: Number(order.order_id || 0),
    related_payment_id: Number(payment.payment_id || 0)
  });

  return json({
    ok: true,
    event_type: eventType || null,
    payment_status: localPaymentStatus,
    order: {
      order_id: Number(order.order_id || 0),
      order_number: order.order_number || "",
      order_status: nextOrderStatus,
      payment_status: nextPaymentStatus
    }
  });
}
