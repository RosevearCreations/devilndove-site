import { processNotificationOutbox, queueNotification } from './_lib/notificationOutbox.js';
import {
  registerWebhookEventAtomic,
  requireGiftCardWebhookSchema,
  verifyStripeWebhook,
} from './_lib/paymentWebhookSecurity.js';

// File: /functions/api/stripe-webhook.js
// Brief description: Receives Stripe webhook events, requires verified signatures, records atomic
// webhook replay authority, and reconciles local payment/order state without request-time schema DDL.

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

async function activatePendingGiftCardsForOrder(env, order, payment, providerLabel) {
  const db = getDb(env);
  await requireGiftCardWebhookSchema(db);
  const pending = (await db.prepare(`
    SELECT gift_card_id, code, currency, initial_amount_cents, remaining_amount_cents,
           COALESCE(recipient_email, issued_to_email) AS recipient_email,
           COALESCE(recipient_name, issued_to_name) AS recipient_name,
           purchaser_email, purchaser_name, recipient_note, note, expires_at, status
    FROM gift_cards
    WHERE order_id = ?
      AND LOWER(COALESCE(status,'')) = 'pending_activation'
    ORDER BY gift_card_id ASC
  `).bind(Number(order?.order_id || 0)).all()).results || [];
  let activated_count = 0;
  for (const row of pending) {
    await db.prepare(`UPDATE gift_cards SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE gift_card_id = ?`).bind(Number(row.gift_card_id || 0)).run();
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
    await processNotificationOutbox(env, { limit: Math.max(activated_count, 3) }).catch(() => ({ ok: false }));
  }
  return activated_count;
}

function mapStripeDisputeStatus(eventType, object) {
  const type = normalizeText(eventType).toLowerCase();
  const providerStatus = normalizeText(object?.status).toLowerCase();
  if (type === 'charge.dispute.closed') {
    if (normalizeText(object?.reason).toLowerCase() === 'won' || providerStatus === 'won') return 'won';
    if (providerStatus === 'lost') return 'lost';
    return 'closed';
  }
  if (type === 'charge.dispute.funds_reinstated') return 'won';
  if (type === 'charge.dispute.funds_withdrawn') return 'under_review';
  if (['warning_needs_response', 'warning_under_review', 'needs_response', 'under_review'].includes(providerStatus)) return 'under_review';
  if (providerStatus === 'won') return 'won';
  if (providerStatus === 'lost') return 'lost';
  if (providerStatus === 'closed') return 'closed';
  return 'open';
}

async function queueProviderNotification(env, payload) {
  const db = getDb(env);
  await queueNotification(db, payload).catch(() => null);
}

async function dispatchQueuedNotifications(env, limit = 5) {
  return processNotificationOutbox(env, { limit }).catch(() => ({ ok: false }));
}

async function upsertStripeDispute(env, payment, order, object, eventType) {
  const db = getDb(env);
  const providerDisputeId = normalizeText(object?.id);
  if (!providerDisputeId) return null;
  const disputeStatus = mapStripeDisputeStatus(eventType, object);
  const amountCents = Number(object?.amount || payment.amount_cents || 0);
  const currency = normalizeText(object?.currency || order.currency || 'CAD').toUpperCase() || 'CAD';
  const existing = await db.prepare(`
    SELECT dispute_id
    FROM payment_disputes
    WHERE provider = 'stripe' AND provider_dispute_id = ?
    LIMIT 1
  `).bind(providerDisputeId).first().catch(() => null);
  if (existing) {
    await db.prepare(`
      UPDATE payment_disputes
      SET dispute_status = ?, amount_cents = ?, currency = ?, reason = ?, evidence_due_at = ?,
          note = ?, provider_sync_status = 'confirmed', provider_sync_note = ?, provider_sync_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE dispute_id = ?
    `).bind(
      disputeStatus,
      amountCents,
      currency,
      normalizeText(object?.reason) || null,
      object?.evidence_details?.due_by ? new Date(Number(object.evidence_details.due_by) * 1000).toISOString() : null,
      normalizeText(object?.reason_details?.network_reason_code || object?.reason) || null,
      `Stripe webhook confirmed ${normalizeText(eventType) || 'dispute event'}.`,
      Number(existing.dispute_id || 0)
    ).run();
    return { dispute_id: Number(existing.dispute_id || 0), dispute_status: disputeStatus, provider_dispute_id: providerDisputeId };
  }
  const inserted = await db.prepare(`
    INSERT INTO payment_disputes (
      payment_id, order_id, provider, provider_dispute_id, dispute_status, amount_cents, currency,
      reason, evidence_due_at, note, provider_sync_status, provider_sync_note, provider_sync_at,
      created_by_user_id, created_at, updated_at
    ) VALUES (?, ?, 'stripe', ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    Number(payment.payment_id || 0),
    Number(order.order_id || 0),
    providerDisputeId,
    disputeStatus,
    amountCents,
    currency,
    normalizeText(object?.reason) || null,
    object?.evidence_details?.due_by ? new Date(Number(object.evidence_details.due_by) * 1000).toISOString() : null,
    normalizeText(object?.reason_details?.network_reason_code || object?.reason) || null,
    `Stripe webhook confirmed ${normalizeText(eventType) || 'dispute event'}.`
  ).run();
  return { dispute_id: Number(inserted?.meta?.last_row_id || 0), dispute_status: disputeStatus, provider_dispute_id: providerDisputeId };
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
  return registerWebhookEventAtomic(getDb(env), {
    provider,
    eventId,
    eventType,
    verification,
    payloadJson,
  });
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
  ).run();
}

async function findPaymentForStripeEvent(env, object) {
  const db = getDb(env);
  const sessionId = normalizeText(object?.object === 'checkout.session' ? object?.id : '');
  const paymentIntentId = normalizeText(object?.payment_intent || object?.payment_intent?.id || object?.latest_charge?.payment_intent || '');
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
  if (!db) return json({ ok: false, error: "Database is not configured." }, 503);

  const bodyText = await request.text();
  const verification = await verifyStripeWebhook({
    rawBody: bodyText,
    signatureHeader: request.headers.get('stripe-signature') || '',
    env,
  });
  if (!verification.verified) {
    const status = verification.code === 'stripe_webhook_not_configured' ? 503 : 401;
    return json({ ok: false, error: "Stripe webhook verification failed.", code: verification.code }, status);
  }

  let body;
  try {
    body = JSON.parse(bodyText || "{}");
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const eventType = normalizeText(body.type).toLowerCase();
  const eventId = normalizeText(body.id);
  if (!eventType || !eventId) {
    return json({ ok: false, error: "Stripe webhook event is missing id or type." }, 400);
  }

  let webhookEvent;
  try {
    webhookEvent = await registerWebhookEvent(env, "stripe", eventId, eventType, verification, bodyText);
  } catch (error) {
    console.error('Stripe webhook replay authority unavailable', error);
    return json({ ok: false, error: "Stripe webhook replay authority is unavailable." }, 503);
  }

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
    SELECT order_id, order_number, order_status, payment_status, total_cents, currency, customer_email, customer_name
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

  if (eventType.startsWith('charge.dispute.')) {
    const dispute = await upsertStripeDispute(env, payment, order, object, eventType);
    if (dispute && normalizeText(order.customer_email)) {
      await queueProviderNotification(env, {
        notification_kind: 'dispute_notice',
        channel: 'email',
        destination: normalizeText(order.customer_email),
        related_order_id: Number(order.order_id || 0),
        related_payment_id: Number(payment.payment_id || 0),
        payload: {
          order_number: order.order_number || '',
          amount_cents: Number(object?.amount || payment.amount_cents || 0),
          currency: normalizeText(object?.currency || order.currency || 'CAD').toUpperCase() || 'CAD',
          customer_name: normalizeText(order.customer_name),
          reason: normalizeText(object?.reason) || '',
          dispute_status: dispute.dispute_status || 'open',
          provider: 'stripe'
        }
      });
      await dispatchQueuedNotifications(env, 5);
    }
    await markWebhookEvent(env, webhookEvent.webhook_event_id, 'processed', {
      related_order_id: Number(order.order_id || 0),
      related_payment_id: Number(payment.payment_id || 0)
    });
    return json({
      ok: true,
      event_type: eventType || null,
      dispute: dispute || null,
      order: {
        order_id: Number(order.order_id || 0),
        order_number: order.order_number || '',
        order_status: order.order_status || 'pending',
        payment_status: order.payment_status || 'pending'
      }
    });
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

  let giftCardActivationCount = 0;
  if (localPaymentStatus === 'paid') {
    try {
      giftCardActivationCount = await activatePendingGiftCardsForOrder(env, order, payment, 'stripe');
    } catch (error) {
      await markWebhookEvent(env, webhookEvent.webhook_event_id, 'failed', {
        related_order_id: Number(order.order_id || 0),
        related_payment_id: Number(payment.payment_id || 0),
        error_text: 'gift_card_webhook_schema_not_ready',
      });
      console.error('Stripe gift-card webhook schema is not ready', error);
      return json({ ok: false, error: 'Webhook reconciliation schema is not ready.' }, 503);
    }
  }

  if (['refunded', 'partially_refunded'].includes(localPaymentStatus) && normalizeText(order.customer_email)) {
    await queueProviderNotification(env, {
      notification_kind: 'refund_receipt',
      channel: 'email',
      destination: normalizeText(order.customer_email),
      related_order_id: Number(order.order_id || 0),
      related_payment_id: Number(payment.payment_id || 0),
      payload: {
        order_number: order.order_number || '',
        amount_cents: Number(object?.amount_refunded || object?.amount || payment.amount_cents || 0),
        currency: normalizeText(object?.currency || order.currency || 'CAD').toUpperCase() || 'CAD',
        customer_name: normalizeText(order.customer_name),
        reason: normalizeText(object?.reason || 'Provider-confirmed Stripe refund'),
        refund_status: localPaymentStatus,
        provider: 'stripe'
      }
    });
    await dispatchQueuedNotifications(env, 5);
  }

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
    },
    gift_card_activation_count: giftCardActivationCount
  });
}
