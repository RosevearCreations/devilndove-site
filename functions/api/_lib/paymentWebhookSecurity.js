// Release 461 Financials webhook security authority.
// Pure verification helpers plus fail-closed replay/schema helpers used by Stripe and PayPal webhooks.

function text(value) {
  return String(value ?? '').trim();
}

function timingSafeEqual(leftValue, rightValue) {
  const left = String(leftValue || '');
  const right = String(rightValue || '');
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function stripeWebhookConfiguration(env = {}) {
  const secret = text(env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SIGNING_SECRET);
  return {
    ready: Boolean(secret),
    code: secret ? 'stripe_webhook_configured' : 'stripe_webhook_not_configured',
    secret,
  };
}

export async function verifyStripeWebhook({
  rawBody,
  signatureHeader,
  env = {},
  nowMs = Date.now(),
  toleranceSeconds = 300,
} = {}) {
  const configuration = stripeWebhookConfiguration(env);
  if (!configuration.ready) {
    return { verified: false, verification_mode: 'stripe', code: configuration.code };
  }

  const header = text(signatureHeader);
  if (!header) {
    return { verified: false, verification_mode: 'stripe', code: 'stripe_signature_missing' };
  }

  const parts = header.split(',').map((part) => part.trim()).filter(Boolean);
  const timestampText = text(parts.find((part) => part.startsWith('t='))?.slice(2));
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => text(part.slice(3)))
    .filter(Boolean);
  const timestampSeconds = Number(timestampText);
  if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0 || signatures.length === 0) {
    return { verified: false, verification_mode: 'stripe', code: 'stripe_signature_invalid' };
  }

  const tolerance = Math.max(1, Math.min(Number(toleranceSeconds) || 300, 900));
  const nowSeconds = Math.floor(Number(nowMs) / 1000);
  if (!Number.isFinite(nowSeconds) || Math.abs(nowSeconds - timestampSeconds) > tolerance) {
    return { verified: false, verification_mode: 'stripe', code: 'stripe_signature_timestamp_outside_tolerance' };
  }

  const expected = await hmacSha256Hex(
    configuration.secret,
    `${timestampText}.${String(rawBody ?? '')}`
  );
  const verified = signatures.some((candidate) => timingSafeEqual(candidate, expected));
  return {
    verified,
    verification_mode: 'stripe',
    code: verified ? 'stripe_signature_verified' : 'stripe_signature_invalid',
  };
}

function headerValue(headers, name) {
  if (!headers || typeof headers.get !== 'function') return '';
  return text(headers.get(name));
}

export function paypalWebhookConfiguration(env = {}, headers = null) {
  const clientId = text(env.PAYPAL_CLIENT_ID);
  const clientSecret = text(env.PAYPAL_SECRET);
  const webhookId = text(env.PAYPAL_WEBHOOK_ID);
  const requiredHeaders = {
    auth_algo: headerValue(headers, 'paypal-auth-algo'),
    cert_url: headerValue(headers, 'paypal-cert-url'),
    transmission_id: headerValue(headers, 'paypal-transmission-id'),
    transmission_sig: headerValue(headers, 'paypal-transmission-sig'),
    transmission_time: headerValue(headers, 'paypal-transmission-time'),
  };
  const missingHeaders = Object.entries(requiredHeaders)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const configured = Boolean(clientId && clientSecret && webhookId);
  return {
    ready: configured && missingHeaders.length === 0,
    configured,
    missing_headers: missingHeaders,
    code: !configured
      ? 'paypal_webhook_not_configured'
      : (missingHeaders.length ? 'paypal_signature_headers_missing' : 'paypal_webhook_configured'),
    clientId,
    clientSecret,
    webhookId,
    requiredHeaders,
  };
}

export async function verifyPayPalWebhook({
  event,
  headers,
  env = {},
  fetchImpl = fetch,
} = {}) {
  const configuration = paypalWebhookConfiguration(env, headers);
  if (!configuration.ready) {
    return { verified: false, verification_mode: 'paypal', code: configuration.code };
  }

  const mode = text(env.PAYPAL_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const basic = btoa(`${configuration.clientId}:${configuration.clientSecret}`);

  let tokenResponse;
  try {
    tokenResponse = await fetchImpl(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
  } catch {
    return { verified: false, verification_mode: 'paypal', code: 'paypal_verification_transport_failed' };
  }

  const tokenJson = await tokenResponse.json().catch(() => ({}));
  const accessToken = text(tokenJson?.access_token);
  if (!tokenResponse.ok || !accessToken) {
    return { verified: false, verification_mode: 'paypal', code: 'paypal_verification_token_failed' };
  }

  let verificationResponse;
  try {
    verificationResponse = await fetchImpl(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: configuration.requiredHeaders.auth_algo,
        cert_url: configuration.requiredHeaders.cert_url,
        transmission_id: configuration.requiredHeaders.transmission_id,
        transmission_sig: configuration.requiredHeaders.transmission_sig,
        transmission_time: configuration.requiredHeaders.transmission_time,
        webhook_id: configuration.webhookId,
        webhook_event: event || {},
      }),
    });
  } catch {
    return { verified: false, verification_mode: 'paypal', code: 'paypal_verification_transport_failed' };
  }

  const verificationJson = await verificationResponse.json().catch(() => ({}));
  const status = text(verificationJson?.verification_status).toUpperCase();
  const verified = verificationResponse.ok && status === 'SUCCESS';
  return {
    verified,
    verification_mode: 'paypal',
    code: verified ? 'paypal_signature_verified' : 'paypal_signature_invalid',
  };
}

export async function registerWebhookEventAtomic(
  db,
  { provider, eventId, eventType, verification, payloadJson } = {}
) {
  if (!db) throw new Error('webhook_event_authority_unavailable');
  const providerKey = text(provider).toLowerCase();
  const providerEventId = text(eventId);
  if (!providerKey || !providerEventId) throw new Error('webhook_event_identity_required');

  const insert = await db.prepare(`
    INSERT INTO webhook_events (
      provider,
      provider_event_id,
      event_type,
      verification_status,
      process_status,
      payload_json,
      received_at,
      updated_at
    )
    SELECT ?, ?, ?, 'verified', 'received', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1
      FROM webhook_events
      WHERE provider = ? AND provider_event_id = ?
    )
  `).bind(
    providerKey,
    providerEventId,
    text(eventType) || null,
    String(payloadJson ?? ''),
    providerKey,
    providerEventId
  ).run();

  const changes = Number(insert?.meta?.changes || 0);
  if (changes > 0) {
    const webhookEventId = Number(insert?.meta?.last_row_id || 0);
    if (!webhookEventId) throw new Error('webhook_event_registration_failed');
    return { duplicate: false, webhook_event_id: webhookEventId, process_status: 'received' };
  }

  const existing = await db.prepare(`
    SELECT webhook_event_id, process_status
    FROM webhook_events
    WHERE provider = ? AND provider_event_id = ?
    LIMIT 1
  `).bind(providerKey, providerEventId).first();
  if (!existing) throw new Error('webhook_event_registration_failed');
  return {
    duplicate: true,
    webhook_event_id: Number(existing.webhook_event_id || 0),
    process_status: existing.process_status || 'processed',
  };
}

// Keep this contract aligned to the explicit Build 384 gift-card migration.
// Request/runtime paths must never require columns that only existed via legacy self-heal ALTERs.
const GIFT_CARD_WEBHOOK_COLUMNS = Object.freeze([
  'gift_card_id',
  'code',
  'currency',
  'initial_amount_cents',
  'remaining_amount_cents',
  'issued_to_email',
  'issued_to_name',
  'note',
  'status',
  'expires_at',
  'recipient_email',
  'recipient_name',
  'recipient_note',
  'purchaser_email',
  'purchaser_name',
  'order_id',
  'purchase_source',
]);

export async function requireGiftCardWebhookSchema(db) {
  if (!db) throw new Error('gift_card_webhook_schema_not_ready');
  const info = await db.prepare('PRAGMA table_info(gift_cards)').all();
  const columns = new Set(
    (Array.isArray(info?.results) ? info.results : [])
      .map((row) => text(row?.name))
      .filter(Boolean)
  );
  const missing = GIFT_CARD_WEBHOOK_COLUMNS.filter((name) => !columns.has(name));
  if (missing.length) throw new Error('gift_card_webhook_schema_not_ready');
  return true;
}
