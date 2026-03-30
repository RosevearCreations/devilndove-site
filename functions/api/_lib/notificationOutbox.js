import { getDb, normalizeText } from './adminAudit.js';

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

export async function queueNotification(db, payload = {}) {
  return db.prepare(`
    INSERT INTO notification_outbox (
      notification_kind, channel, destination, related_order_id, related_payment_id,
      payload_json, status, next_attempt_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    normalizeText(payload.notification_kind) || 'generic_notice',
    normalizeText(payload.channel) || 'email',
    normalizeText(payload.destination) || null,
    payload.related_order_id == null ? null : Number(payload.related_order_id || 0),
    payload.related_payment_id == null ? null : Number(payload.related_payment_id || 0),
    JSON.stringify(payload.payload || {}),
    normalizeText(payload.status) || 'queued',
    payload.next_attempt_at || null
  ).run();
}

function buildEmailFromNotification(row) {
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
  const email = buildEmailFromNotification(row);
  const sent = await sendViaResend(env, email);
  return { sent, email };
}

export async function processNotificationOutbox(env, options = {}) {
  const db = getDb(env);
  const limit = Math.max(1, Math.min(Number(options.limit || 10), 50));
  const rows = (await db.prepare(`
    SELECT notification_outbox_id, notification_kind, channel, destination, related_order_id, related_payment_id,
           payload_json, status, attempt_count, next_attempt_at
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
      const { sent, email } = await dispatchNotificationRow(env, row);
      if (sent.ok) {
        await db.prepare(`
          UPDATE notification_outbox
          SET status = 'sent', attempt_count = COALESCE(attempt_count, 0) + 1, last_attempt_at = CURRENT_TIMESTAMP,
              provider_message_id = ?, error_text = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE notification_outbox_id = ?
        `).bind(sent.provider_message_id || null, outboxId).run();
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
      results.push({ notification_outbox_id: outboxId, ok: false, error: error?.message || 'Dispatch error.' });
    }
  }

  return { ok: true, processed_count: results.length, results };
}
