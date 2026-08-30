import { getDb, normalizeText } from './adminAudit.js';

const NOTIFICATION_SCHEMA = Object.freeze({
  notification_outbox: [
    'notification_outbox_id', 'notification_kind', 'channel', 'destination',
    'related_order_id', 'related_payment_id', 'related_product_id', 'payload_json',
    'metadata_json', 'status', 'attempt_count', 'last_attempt_at', 'next_attempt_at',
    'provider_message_id', 'error_text', 'created_at', 'updated_at'
  ],
  notification_dispatch_log: [
    'notification_dispatch_log_id', 'notification_outbox_id', 'notification_kind',
    'destination', 'status', 'provider_message_id', 'error_text', 'created_at'
  ],
  notification_exclusions: [
    'notification_exclusion_id', 'notification_kind', 'destination', 'product_id',
    'order_id', 'reason', 'is_active', 'created_at', 'updated_at'
  ],
  notification_cooldown_rules: [
    'notification_cooldown_rule_id', 'notification_kind', 'cooldown_hours',
    'is_enabled', 'created_at', 'updated_at'
  ],
  customer_engagement_runs: [
    'customer_engagement_run_id', 'run_type', 'actor_user_id', 'summary_json', 'created_at'
  ]
});

function jsonHtmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function centsToMoney(cents, currency = 'CAD') {
  return `${(Number(cents || 0) / 100).toFixed(2)} ${normalizeText(currency).toUpperCase() || 'CAD'}`;
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

async function tableColumns(db, tableName) {
  try {
    const info = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set((Array.isArray(info?.results) ? info.results : []).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function getNotificationRuntimeSchemaReadiness(db) {
  if (!db) {
    return { ready: false, missing_tables: Object.keys(NOTIFICATION_SCHEMA), missing_columns: [] };
  }
  const missingTables = [];
  const missingColumns = [];
  for (const [tableName, requiredColumns] of Object.entries(NOTIFICATION_SCHEMA)) {
    if (!(await tableExists(db, tableName))) {
      missingTables.push(tableName);
      continue;
    }
    const columns = await tableColumns(db, tableName);
    for (const columnName of requiredColumns) {
      if (!columns.has(columnName)) missingColumns.push(`${tableName}.${columnName}`);
    }
  }
  return { ready: missingTables.length === 0 && missingColumns.length === 0, missing_tables: missingTables, missing_columns: missingColumns };
}

async function requireNotificationRuntimeSchema(db) {
  const readiness = await getNotificationRuntimeSchemaReadiness(db);
  if (readiness.ready) return readiness;
  const error = new Error('Notification schema is unavailable. Apply the explicit Release 461 Development notification migration or a later forward repair after read-only drift review.');
  error.code = 'notification_schema_unavailable';
  error.readiness = readiness;
  throw error;
}

async function recordDispatchLog(db, row, status, providerMessageId = null, errorText = null) {
  if (!db) return;
  await db.prepare(`INSERT INTO notification_dispatch_log (
    notification_outbox_id, notification_kind, destination, status, provider_message_id, error_text, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(
    Number(row?.notification_outbox_id || 0) || null,
    normalizeText(row?.notification_kind) || null,
    normalizeText(row?.destination) || null,
    normalizeText(status) || 'queued',
    providerMessageId || null,
    errorText || null
  ).run().catch(() => null);
}

function buildAbsoluteUrl(payloadUrl, env) {
  const raw = normalizeText(payloadUrl);
  if (!raw) return normalizeText(env.SITE_ORIGIN || 'https://devilndove.com');
  if (/^https?:\/\//i.test(raw)) return raw;
  const origin = normalizeText(env.SITE_ORIGIN || 'https://devilndove.com').replace(/\/$/, '');
  return `${origin}/${raw.replace(/^\/+/, '')}`;
}

async function getCooldownRule(db, notificationKind) {
  if (!(await tableExists(db, 'notification_cooldown_rules'))) return null;
  return db.prepare(`
    SELECT notification_kind, cooldown_hours, is_enabled
    FROM notification_cooldown_rules
    WHERE notification_kind = ?
    LIMIT 1
  `).bind(normalizeText(notificationKind)).first().catch(() => null);
}

async function getActiveExclusion(db, payload = {}) {
  if (!(await tableExists(db, 'notification_exclusions'))) return null;
  const kind = normalizeText(payload.notification_kind);
  const destination = normalizeText(payload.destination).toLowerCase();
  const productId = payload.related_product_id == null ? null : Number(payload.related_product_id || 0);
  const orderId = payload.related_order_id == null ? null : Number(payload.related_order_id || 0);
  return db.prepare(`
    SELECT notification_exclusion_id, reason
    FROM notification_exclusions
    WHERE is_active = 1
      AND notification_kind = ?
      AND (destination IS NULL OR destination = '' OR LOWER(destination) = ?)
      AND (product_id IS NULL OR product_id = ?)
      AND (order_id IS NULL OR order_id = ?)
    ORDER BY notification_exclusion_id DESC
    LIMIT 1
  `).bind(kind, destination, productId, orderId).first().catch(() => null);
}

async function isInCooldown(db, payload = {}) {
  const kind = normalizeText(payload.notification_kind);
  const destination = normalizeText(payload.destination).toLowerCase();
  if (!kind || !destination) return null;
  const rule = await getCooldownRule(db, kind);
  if (!rule || Number(rule.is_enabled || 0) !== 1 || Number(rule.cooldown_hours || 0) <= 0) return null;
  const hours = Math.max(1, Number(rule.cooldown_hours || 0));
  const row = await db.prepare(`
    SELECT notification_outbox_id, created_at, status
    FROM notification_outbox
    WHERE notification_kind = ?
      AND LOWER(COALESCE(destination,'')) = ?
      AND status IN ('queued','retry','sent','suppressed')
      AND created_at >= datetime('now', ?)
    ORDER BY notification_outbox_id DESC
    LIMIT 1
  `).bind(kind, destination, `-${hours} hours`).first().catch(() => null);
  return row ? { hours, row } : null;
}

async function evaluateSuppression(db, payload = {}) {
  const exclusion = await getActiveExclusion(db, payload);
  if (exclusion) {
    return { suppressed: true, status: 'suppressed', reason: exclusion.reason || 'Excluded by notification rule.' };
  }
  const cooldown = await isInCooldown(db, payload);
  if (cooldown) {
    return { suppressed: true, status: 'suppressed', reason: `Cooling down for ${cooldown.hours} hour(s).` };
  }
  return { suppressed: false, status: 'queued', reason: '' };
}

export async function queueNotification(db, payload = {}) {
  await requireNotificationRuntimeSchema(db);
  const suppression = await evaluateSuppression(db, payload);
  const insert = await db.prepare(`
    INSERT INTO notification_outbox (
      notification_kind, channel, destination, related_order_id, related_payment_id, related_product_id,
      payload_json, metadata_json, status, next_attempt_at, error_text, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    normalizeText(payload.notification_kind) || 'generic_notice',
    normalizeText(payload.channel) || 'email',
    normalizeText(payload.destination) || null,
    payload.related_order_id == null ? null : Number(payload.related_order_id || 0),
    payload.related_payment_id == null ? null : Number(payload.related_payment_id || 0),
    payload.related_product_id == null ? null : Number(payload.related_product_id || 0),
    JSON.stringify(payload.payload || {}),
    JSON.stringify(payload.metadata || {}),
    suppression.status,
    suppression.suppressed ? null : (payload.next_attempt_at || null),
    suppression.suppressed ? suppression.reason : null
  ).run();

  const row = {
    notification_outbox_id: Number(insert?.meta?.last_row_id || 0),
    notification_kind: normalizeText(payload.notification_kind),
    destination: normalizeText(payload.destination),
  };
  if (suppression.suppressed) {
    await recordDispatchLog(db, row, 'suppressed', null, suppression.reason);
  }
  return { ok: true, queued: !suppression.suppressed, suppressed: suppression.suppressed, reason: suppression.reason, notification_outbox_id: row.notification_outbox_id };
}

function buildEmailFromNotification(row, env) {
  let payload = {};
  try { payload = row.payload_json ? JSON.parse(row.payload_json) : {}; } catch { payload = {}; }
  const kind = normalizeText(row.notification_kind).toLowerCase();
  const orderNumber = normalizeText(payload.order_number || payload.order?.order_number);
  const provider = normalizeText(payload.provider || payload.payment_provider).toUpperCase();
  const destination = normalizeText(row.destination || payload.contact_email || payload.email);
  const subjectBase = orderNumber ? `Order ${orderNumber}` : 'Devil n Dove notification';

  if (kind === 'refund_receipt') {
    return {
      to: destination,
      subject: `${subjectBase} refund update`,
      html: `<p>Your refund update has been recorded.</p><p><strong>Order:</strong> ${jsonHtmlEscape(orderNumber || 'Unknown')}</p><p><strong>Amount:</strong> ${jsonHtmlEscape(centsToMoney(payload.amount_cents, payload.currency))}</p><p><strong>Provider:</strong> ${jsonHtmlEscape(provider || 'Local record')}</p><p><strong>Reason:</strong> ${jsonHtmlEscape(payload.reason || 'Not provided')}</p><p><strong>Status:</strong> ${jsonHtmlEscape(payload.refund_status || 'recorded')}</p>`
    };
  }
  if (kind === 'dispute_notice') {
    return {
      to: destination,
      subject: `${subjectBase} payment dispute update`,
      html: `<p>A payment dispute record was added to your order.</p><p><strong>Order:</strong> ${jsonHtmlEscape(orderNumber || 'Unknown')}</p><p><strong>Amount:</strong> ${jsonHtmlEscape(centsToMoney(payload.amount_cents, payload.currency))}</p><p><strong>Status:</strong> ${jsonHtmlEscape(payload.dispute_status || 'open')}</p><p><strong>Reason:</strong> ${jsonHtmlEscape(payload.reason || 'Not provided')}</p>`
    };
  }
  if (kind === 'account_recovery_request') {
    return {
      to: destination,
      subject: `Account recovery request received`,
      html: `<p>A new account recovery request was submitted.</p><p><strong>Type:</strong> ${jsonHtmlEscape(payload.request_type || 'unknown')}</p><p><strong>Contact email:</strong> ${jsonHtmlEscape(payload.contact_email || '')}</p><p><strong>Possible account email:</strong> ${jsonHtmlEscape(payload.possible_email || '')}</p><p><strong>Name:</strong> ${jsonHtmlEscape(payload.display_name || '')}</p><p><strong>Note:</strong> ${jsonHtmlEscape(payload.note || '')}</p>`
    };
  }
  if (kind === 'account_recovery_received') {
    return {
      to: destination,
      subject: `We received your account help request`,
      html: `<p>We received your request and logged it for review.</p><p><strong>Request type:</strong> ${jsonHtmlEscape(payload.request_type || 'account help')}</p><p>If a matching account can be safely reviewed, a follow-up will be handled by the site team.</p>`
    };
  }
  if (kind === 'checkout_recovery') {
    const cartSummary = `${Number(payload.cart_count || 0)} item(s) • ${centsToMoney(payload.cart_value_cents, payload.currency || 'CAD')}`;
    const checkoutUrl = buildAbsoluteUrl(payload.checkout_url || '/checkout/', env);
    return {
      to: destination,
      subject: payload.subject || 'Complete your Devil n Dove checkout',
      html: `<p>You left something in your Devil n Dove cart, and we saved your checkout details for you.</p><p><strong>Cart summary:</strong> ${jsonHtmlEscape(cartSummary)}</p><p><strong>Name:</strong> ${jsonHtmlEscape(payload.customer_name || '')}</p><p><a href="${jsonHtmlEscape(checkoutUrl)}">Return to checkout</a></p><p>If you had any trouble finishing your order, just reply and we can help.</p>`
    };
  }
  if (kind === 'gift_card_issued') {
    const code = jsonHtmlEscape(payload.code || '');
    const balance = jsonHtmlEscape(centsToMoney(payload.remaining_amount_cents ?? payload.initial_amount_cents, payload.currency || 'CAD'));
    const expires = jsonHtmlEscape(payload.expires_at || 'No expiry listed');
    const shopUrl = buildAbsoluteUrl('/shop/', env);
    const purchaserName = jsonHtmlEscape(payload.purchaser_name || 'Someone');
    const recipientName = jsonHtmlEscape(payload.recipient_name || 'there');
    return {
      to: destination,
      subject: payload.subject || 'Your Devil n Dove gift card',
      html: `<p>Hello ${recipientName},</p><p>${purchaserName} sent you a Devil n Dove gift card.</p><p><strong>Code:</strong> ${code}</p><p><strong>Value:</strong> ${balance}</p><p><strong>Expires:</strong> ${expires}</p><p>Use the code during checkout.</p><p><a href="${jsonHtmlEscape(shopUrl)}">Browse the shop</a></p>${payload.note ? `<p><strong>Message:</strong> ${jsonHtmlEscape(payload.note)}</p>` : ''}`
    };
  }
  if (kind === 'gift_card_purchase_confirmation') {
    const recipientName = jsonHtmlEscape(payload.recipient_name || 'your recipient');
    const purchaserName = jsonHtmlEscape(payload.purchaser_name || 'there');
    const code = jsonHtmlEscape(payload.code || '');
    const balance = jsonHtmlEscape(centsToMoney(payload.initial_amount_cents, payload.currency || 'CAD'));
    return {
      to: destination,
      subject: payload.subject || 'Your Devil n Dove gift card purchase is confirmed',
      html: `<p>Hello ${purchaserName},</p><p>Your gift card purchase has been confirmed.</p><p><strong>Recipient:</strong> ${recipientName}</p><p><strong>Code:</strong> ${code}</p><p><strong>Value:</strong> ${balance}</p><p>We have now delivered the gift card to the recipient email on file.</p>`
    };
  }
  if (kind === 'back_in_stock') {
    const shopUrl = buildAbsoluteUrl(payload.product_slug ? `/shop/product/?slug=${payload.product_slug}` : '/shop/', env);
    return {
      to: destination,
      subject: payload.subject || 'A Devil n Dove item is back in stock',
      html: `<p>Good news — an item you asked about is back in stock.</p><p><strong>Item:</strong> ${jsonHtmlEscape(payload.product_name || 'Devil n Dove item')}</p><p><a href="${jsonHtmlEscape(shopUrl)}">View the item now</a></p>`
    };
  }
  if (kind === 'review_request') {
    const membersUrl = buildAbsoluteUrl('/members/', env);
    const productNames = Array.isArray(payload.product_names) ? payload.product_names.filter(Boolean).join(', ') : '';
    return {
      to: destination,
      subject: payload.subject || `${subjectBase} review request`,
      html: `<p>Thank you for your order from Devil n Dove.</p><p>${productNames ? `<strong>Items:</strong> ${jsonHtmlEscape(productNames)}<br>` : ''}${orderNumber ? `<strong>Order:</strong> ${jsonHtmlEscape(orderNumber)}` : ''}</p><p>If you have a moment, we'd love a quick review or testimonial.</p><p><a href="${jsonHtmlEscape(membersUrl)}">Open the members area to leave your feedback</a></p>`
    };
  }
  return {
    to: destination,
    subject: payload.subject || 'Devil n Dove update',
    html: `<p>${jsonHtmlEscape(payload.message || 'A new notification was queued.')}</p>`
  };
}

async function sendViaResend(env, email) {
  const apiKey = normalizeText(env.RESEND_API_KEY);
  const fromEmail = normalizeText(env.NOTIFICATION_FROM_EMAIL || env.RESEND_FROM_EMAIL || env.SUPPORT_FROM_EMAIL);
  if (!apiKey || !fromEmail || !normalizeText(email.to)) {
    return { ok: false, error: 'Notification email provider is not configured.' };
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email.to],
      subject: email.subject,
      html: email.html
    })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.id) {
    return { ok: false, error: data?.message || data?.error || 'Email send failed.' };
  }
  return { ok: true, provider_message_id: data.id };
}

export async function dispatchNotificationRow(env, row) {
  const email = buildEmailFromNotification(row, env);
  const sent = await sendViaResend(env, email);
  return { sent, email };
}

export async function processNotificationOutbox(env, options = {}) {
  const db = getDb(env);
  await requireNotificationRuntimeSchema(db);
  const limit = Math.max(1, Math.min(Number(options.limit || 10), 50));
  const rows = (await db.prepare(`
    SELECT notification_outbox_id, notification_kind, channel, destination, related_order_id, related_payment_id,
           related_product_id, payload_json, status, attempt_count, next_attempt_at
    FROM notification_outbox
    WHERE status IN ('queued','retry')
      AND (next_attempt_at IS NULL OR next_attempt_at <= CURRENT_TIMESTAMP)
    ORDER BY created_at ASC, notification_outbox_id ASC
    LIMIT ?
  `).bind(limit).all().catch(() => ({ results: [] }))).results || [];

  const results = [];
  for (const row of rows) {
    const outboxId = Number(row.notification_outbox_id || 0);
    try {
      const suppression = await evaluateSuppression(db, {
        notification_kind: row.notification_kind,
        destination: row.destination,
        related_order_id: row.related_order_id,
        related_product_id: row.related_product_id
      });
      if (suppression.suppressed) {
        await db.prepare(`
          UPDATE notification_outbox
          SET status = 'suppressed', error_text = ?, updated_at = CURRENT_TIMESTAMP
          WHERE notification_outbox_id = ?
        `).bind(suppression.reason || 'Suppressed.', outboxId).run();
        await recordDispatchLog(db, row, 'suppressed', null, suppression.reason || 'Suppressed.');
        results.push({ notification_outbox_id: outboxId, ok: false, suppressed: true, error: suppression.reason || 'Suppressed.' });
        continue;
      }
      const { sent, email } = await dispatchNotificationRow(env, row);
      if (sent.ok) {
        await db.prepare(`
          UPDATE notification_outbox
          SET status = 'sent', attempt_count = COALESCE(attempt_count, 0) + 1, last_attempt_at = CURRENT_TIMESTAMP,
              provider_message_id = ?, error_text = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE notification_outbox_id = ?
        `).bind(sent.provider_message_id || null, outboxId).run();
        await recordDispatchLog(db, row, 'sent', sent.provider_message_id || null, null);
        results.push({ notification_outbox_id: outboxId, ok: true, destination: email.to || '', subject: email.subject || '', provider_message_id: sent.provider_message_id || null });
      } else {
        const attempts = Number(row.attempt_count || 0) + 1;
        const retryMinutes = Math.min(240, attempts * 15);
        const nextRetryAt = new Date(Date.now() + retryMinutes * 60 * 1000).toISOString();
        await db.prepare(`
          UPDATE notification_outbox
          SET status = CASE WHEN ? >= 5 THEN 'failed' ELSE 'retry' END,
              attempt_count = ?, last_attempt_at = CURRENT_TIMESTAMP, next_attempt_at = ?, error_text = ?, updated_at = CURRENT_TIMESTAMP
          WHERE notification_outbox_id = ?
        `).bind(attempts, attempts, nextRetryAt, sent.error || 'Send failed.', outboxId).run();
        await recordDispatchLog(db, row, attempts >= 5 ? 'failed' : 'retry', null, sent.error || 'Send failed.');
        results.push({ notification_outbox_id: outboxId, ok: false, error: sent.error || 'Send failed.' });
      }
    } catch (error) {
      const attempts = Number(row.attempt_count || 0) + 1;
      const nextRetryAt = new Date(Date.now() + Math.min(240, attempts * 15) * 60 * 1000).toISOString();
      await db.prepare(`
        UPDATE notification_outbox
        SET status = CASE WHEN ? >= 5 THEN 'failed' ELSE 'retry' END,
            attempt_count = ?, last_attempt_at = CURRENT_TIMESTAMP, next_attempt_at = ?, error_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE notification_outbox_id = ?
      `).bind(attempts, attempts, nextRetryAt, error?.message || 'Dispatch error.', outboxId).run().catch(() => null);
      await recordDispatchLog(db, row, attempts >= 5 ? 'failed' : 'retry', null, error?.message || 'Dispatch error.');
      results.push({ notification_outbox_id: outboxId, ok: false, error: error?.message || 'Dispatch error.' });
    }
  }

  return { ok: true, processed_count: results.length, results };
}
