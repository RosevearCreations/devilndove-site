import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { paymentExecutionStatus } from '../_lib/paymentExecution.js';
import { onRequestPost as preparePaymentPost } from '../checkout-prepare-payment.js';
import { onRequestPost as paymentActionPost } from './payment-actions.js';

// Release 466 Build 6 — Development-only Stripe/PayPal acceptance orchestrator.
// GET is observation-only. POST can refresh sanitized readiness evidence, prepare one
// explicit test/sandbox checkout, or issue one explicit provider-synchronized refund.
// It never executes against Production and never emits provider credentials/secrets.

const RELEASE = 466;
const BUILD = 6;
const PROVIDERS = new Set(['stripe', 'paypal']);
const SETTLED_STATUSES = new Set(['paid', 'partially_refunded', 'refunded']);
const ACCEPTANCE_MARKER = 'RELEASE466_EXTERNAL_ACCEPTANCE_TEST';

function json(data, status = 200) {
  return jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' });
}

function text(value) {
  return normalizeText(value);
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function bool(value) {
  return value === true || value === 1 || value === '1';
}

function providerName(value) {
  const provider = text(value).toLowerCase();
  return PROVIDERS.has(provider) ? provider : '';
}

function getOrigin(request) {
  try { return new URL(request.url).origin; }
  catch { return ''; }
}

function stablePreviewOrigin() {
  return 'https://dev.devilndove-site.pages.dev';
}

function webhookPath(provider) {
  return provider === 'stripe' ? '/api/stripe-webhook' : '/api/paypal-webhook';
}

function webhookEvents(provider) {
  if (provider === 'stripe') {
    return [
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
      'checkout.session.async_payment_failed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.refunded',
    ];
  }
  return [
    'PAYMENT.CAPTURE.COMPLETED',
    'PAYMENT.CAPTURE.PENDING',
    'PAYMENT.CAPTURE.DENIED',
    'PAYMENT.CAPTURE.REFUNDED',
    'PAYMENT.CAPTURE.REVERSED',
  ];
}

function configurationState(env, request, provider) {
  const execution = paymentExecutionStatus(request.url, env, provider);
  if (provider === 'stripe') {
    const secret = text(env.STRIPE_SECRET_KEY);
    const publishable = text(env.STRIPE_PUBLISHABLE_KEY);
    const webhookSecret = text(env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SIGNING_SECRET);
    const secretTest = secret.startsWith('sk_test_') || secret.startsWith('rk_test_');
    const publishableTest = publishable.startsWith('pk_test_');
    const liveCredentialDetected = secret.startsWith('sk_live_') || secret.startsWith('rk_live_') || publishable.startsWith('pk_live_');
    const configurationReady = Boolean(secretTest && publishableTest && webhookSecret && !liveCredentialDetected);
    return {
      provider,
      configuration_ready: configurationReady,
      credential_mode: secretTest && publishableTest ? 'test' : (liveCredentialDetected ? 'live_forbidden' : 'missing_or_invalid'),
      secret_key_present: Boolean(secret),
      publishable_key_present: Boolean(publishable),
      webhook_reference_present: Boolean(webhookSecret),
      sandbox_environment_explicit: true,
      live_credential_detected: liveCredentialDetected,
      development_host: Boolean(execution.development_host),
      operator_switch_set: Boolean(execution.operator_switch_set),
      execution_authorized: Boolean(execution.execution_authorized && configurationReady),
      execution_code: configurationReady ? execution.code : 'provider_acceptance_configuration_incomplete',
      secret_values_emitted: false,
    };
  }

  const clientId = text(env.PAYPAL_CLIENT_ID);
  const secret = text(env.PAYPAL_SECRET);
  const webhookId = text(env.PAYPAL_WEBHOOK_ID);
  const paypalEnvironment = text(env.PAYPAL_ENV).toLowerCase();
  const sandboxExplicit = paypalEnvironment === 'sandbox';
  const liveCredentialDetected = paypalEnvironment === 'live';
  const configurationReady = Boolean(clientId && secret && webhookId && sandboxExplicit && !liveCredentialDetected);
  return {
    provider,
    configuration_ready: configurationReady,
    credential_mode: sandboxExplicit ? 'sandbox' : (liveCredentialDetected ? 'live_forbidden' : 'missing_or_invalid'),
    client_id_present: Boolean(clientId),
    client_secret_present: Boolean(secret),
    webhook_reference_present: Boolean(webhookId),
    sandbox_environment_explicit: sandboxExplicit,
    live_credential_detected: liveCredentialDetected,
    development_host: Boolean(execution.development_host),
    operator_switch_set: Boolean(execution.operator_switch_set),
    execution_authorized: Boolean(execution.execution_authorized && configurationReady),
    execution_code: configurationReady ? execution.code : 'provider_acceptance_configuration_incomplete',
    secret_values_emitted: false,
  };
}

function requireDevelopmentBoundary(request, env, provider = 'stripe') {
  const environment = text(env.DND_ENVIRONMENT).toLowerCase();
  const execution = paymentExecutionStatus(request.url, env, provider);
  return {
    ok: environment === 'development' && execution.development_host === true,
    environment,
    development_host: Boolean(execution.development_host),
  };
}

async function tableExists(db, name) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function loadAcceptancePayments(db, provider) {
  const pattern = `${ACCEPTANCE_MARKER} provider=${provider}%`;
  try {
    return rows(await db.prepare(`
      SELECT
        p.payment_id,
        p.order_id,
        p.provider,
        p.provider_payment_id,
        p.provider_order_id,
        p.payment_status,
        p.amount_cents,
        p.currency,
        p.transaction_reference,
        p.created_at AS payment_created_at,
        p.updated_at AS payment_updated_at,
        o.order_number,
        o.order_status,
        o.payment_status AS order_payment_status,
        o.notes AS order_notes,
        o.created_at AS order_created_at
      FROM payments p
      JOIN orders o ON o.order_id = p.order_id
      WHERE LOWER(COALESCE(p.provider,'')) = ?
        AND COALESCE(o.notes,'') LIKE ?
      ORDER BY p.payment_id DESC
      LIMIT 50
    `).bind(provider, pattern).all());
  } catch {
    return [];
  }
}

function chooseEvidencePayment(paymentRows) {
  if (!paymentRows.length) return null;
  const settled = paymentRows.find((row) => SETTLED_STATUSES.has(text(row.payment_status).toLowerCase()));
  return settled || paymentRows.find((row) => text(row.provider_order_id)) || paymentRows[0] || null;
}

async function loadWebhookEvidence(db, provider, paymentId) {
  if (!paymentId || !(await tableExists(db, 'webhook_events'))) {
    return { verified: null, replay: null, rows: [] };
  }
  let events = [];
  try {
    events = rows(await db.prepare(`
      SELECT webhook_event_id,provider_event_id,event_type,verification_status,process_status,
             related_order_id,related_payment_id,received_at,processed_at,updated_at
      FROM webhook_events
      WHERE provider = ? AND related_payment_id = ?
      ORDER BY webhook_event_id DESC
      LIMIT 25
    `).bind(provider, Number(paymentId)).all());
  } catch {
    events = [];
  }
  const verified = events.find((row) => text(row.verification_status).toLowerCase() === 'verified'
    && ['processed', 'duplicate'].includes(text(row.process_status).toLowerCase())) || null;
  const replay = events.find((row) => text(row.verification_status).toLowerCase() === 'verified'
    && text(row.process_status).toLowerCase() === 'duplicate') || null;
  return { verified, replay, rows: events };
}

async function loadRefundEvidence(db, provider, paymentId) {
  if (!paymentId || !(await tableExists(db, 'payment_refunds'))) return null;
  try {
    return await db.prepare(`
      SELECT rowid AS refund_rowid,provider_refund_id,refund_status,provider_sync_status,provider_sync_at,amount_cents,currency
      FROM payment_refunds
      WHERE payment_id = ?
        AND LOWER(COALESCE(provider,'')) = ?
        AND LOWER(COALESCE(provider_sync_status,'')) = 'succeeded'
        AND provider_refund_id IS NOT NULL
        AND TRIM(provider_refund_id) <> ''
      ORDER BY rowid DESC
      LIMIT 1
    `).bind(Number(paymentId), provider).first();
  } catch {
    return null;
  }
}

function stateRow(key, label, state, evidenceReference = null, detail = '') {
  return {
    check_key: key,
    check_label: label,
    check_state: state,
    evidence_reference: evidenceReference || null,
    evidence_present: Boolean(evidenceReference),
    detail: detail || '',
  };
}

function safeProviderReference(value) {
  const raw = text(value);
  if (!raw) return '';
  return raw.slice(0, 180);
}

async function deriveProviderEvidence(db, request, env, provider) {
  const configuration = configurationState(env, request, provider);
  const payments = await loadAcceptancePayments(db, provider);
  const payment = chooseEvidencePayment(payments);
  const webhook = await loadWebhookEvidence(db, provider, Number(payment?.payment_id || 0));
  const refund = await loadRefundEvidence(db, provider, Number(payment?.payment_id || 0));
  const paymentStatus = text(payment?.payment_status).toLowerCase();
  const orderPaymentStatus = text(payment?.order_payment_status).toLowerCase();
  const settled = SETTLED_STATUSES.has(paymentStatus);
  const orderSettled = SETTLED_STATUSES.has(orderPaymentStatus);
  const providerOrderId = safeProviderReference(payment?.provider_order_id);
  const providerPaymentId = safeProviderReference(payment?.provider_payment_id || payment?.transaction_reference);
  const checkoutPrepared = Boolean(payment && providerOrderId);
  const providerCapturePresent = provider === 'stripe'
    ? Boolean(providerOrderId && providerOrderId.startsWith('cs_test_'))
    : Boolean(providerPaymentId);
  const reconciled = Boolean(payment && settled && orderSettled && webhook.verified);

  const credentialState = configuration.live_credential_detected
    ? 'failed'
    : (configuration.configuration_ready ? 'passed' : 'pending');
  const checkoutState = settled && providerCapturePresent ? 'passed' : (checkoutPrepared ? 'ready' : 'pending');
  const webhookState = webhook.verified ? 'passed' : 'pending';
  const reconciliationState = reconciled ? 'passed' : 'pending';
  const replayState = webhook.replay ? 'passed' : 'pending';

  const checks = provider === 'stripe'
    ? [
        stateRow('credentials', 'Development test credentials configured', credentialState,
          credentialState === 'passed' ? 'release466:cloudflare-preview:stripe:test-configuration-present' : null,
          configuration.configuration_ready ? 'Stripe test key, test publishable key and webhook signing reference are present.' : 'Stripe Development test configuration is incomplete.'),
        stateRow('checkout', 'Test checkout completes without live charges', checkoutState,
          checkoutState === 'passed' ? `release466:stripe:payment:${Number(payment?.payment_id || 0)}:session:${providerOrderId}` : null,
          checkoutPrepared ? `Acceptance checkout prepared for local order ${Number(payment?.order_id || 0)}.` : 'No Release 466 Stripe acceptance checkout has been prepared yet.'),
        stateRow('webhook-signature', 'Signed webhook verification passes', webhookState,
          webhook.verified ? `release466:stripe:webhook:${Number(webhook.verified.webhook_event_id || 0)}:verified` : null,
          webhook.verified ? `Verified ${text(webhook.verified.event_type)} event reconciled.` : 'No verified Stripe webhook is attached to the acceptance payment yet.'),
        stateRow('reconciliation', 'Provider transaction reconciles to local commerce/accounting evidence', reconciliationState,
          reconciled ? `release466:stripe:reconciliation:order:${Number(payment?.order_id || 0)}:payment:${Number(payment?.payment_id || 0)}` : null,
          reconciled ? 'Provider payment and local order/payment states agree after a verified webhook.' : 'Waiting for a settled provider payment and verified webhook reconciliation.'),
        stateRow('idempotent-replay', 'Webhook replay is idempotent', replayState,
          webhook.replay ? `release466:stripe:webhook:${Number(webhook.replay.webhook_event_id || 0)}:duplicate` : null,
          webhook.replay ? 'The same verified provider event was replayed and classified duplicate.' : 'Use Stripe test webhook resend after the first processed event to prove duplicate replay.'),
      ]
    : [
        stateRow('credentials', 'Sandbox credentials configured', credentialState,
          credentialState === 'passed' ? 'release466:cloudflare-preview:paypal:sandbox-configuration-present' : null,
          configuration.configuration_ready ? 'PayPal client, secret, webhook id and explicit sandbox environment are present.' : 'PayPal Development sandbox configuration is incomplete.'),
        stateRow('approval-capture', 'Sandbox approval and capture completes', checkoutState,
          checkoutState === 'passed' ? `release466:paypal:payment:${Number(payment?.payment_id || 0)}:capture:${providerPaymentId}` : null,
          checkoutPrepared ? `Acceptance approval flow prepared for local order ${Number(payment?.order_id || 0)}.` : 'No Release 466 PayPal acceptance approval flow has been prepared yet.'),
        stateRow('webhook-verification', 'Verified sandbox webhook passes', webhookState,
          webhook.verified ? `release466:paypal:webhook:${Number(webhook.verified.webhook_event_id || 0)}:verified` : null,
          webhook.verified ? `Verified ${text(webhook.verified.event_type)} event reconciled.` : 'No verified PayPal sandbox webhook is attached to the acceptance payment yet.'),
        stateRow('reconciliation', 'Sandbox transaction reconciles to local commerce/accounting evidence', reconciliationState,
          reconciled ? `release466:paypal:reconciliation:order:${Number(payment?.order_id || 0)}:payment:${Number(payment?.payment_id || 0)}` : null,
          reconciled ? 'Sandbox capture and local order/payment states agree after a verified webhook.' : 'Waiting for a settled sandbox capture and verified webhook reconciliation.'),
        stateRow('idempotent-replay', 'Webhook replay is idempotent', replayState,
          webhook.replay ? `release466:paypal:webhook:${Number(webhook.replay.webhook_event_id || 0)}:duplicate` : null,
          webhook.replay ? 'The same verified sandbox event was replayed and classified duplicate.' : 'Use PayPal sandbox webhook resend/retry after the first processed event to prove duplicate replay.'),
      ];

  return {
    provider,
    configuration,
    checks,
    accepted_check_count: checks.filter((row) => row.check_state === 'passed').length,
    required_check_count: checks.length,
    acceptance_checks_passed: checks.length > 0 && checks.every((row) => row.check_state === 'passed'),
    acceptance_payment: payment ? {
      order_id: Number(payment.order_id || 0),
      order_number: text(payment.order_number),
      payment_id: Number(payment.payment_id || 0),
      payment_status: paymentStatus || 'pending',
      order_status: text(payment.order_status).toLowerCase() || 'pending',
      order_payment_status: orderPaymentStatus || 'pending',
      provider_order_id: providerOrderId || null,
      provider_payment_id: providerPaymentId || null,
      amount_cents: Number(payment.amount_cents || 0),
      currency: text(payment.currency || 'CAD').toUpperCase(),
    } : null,
    verified_webhook: webhook.verified ? {
      webhook_event_id: Number(webhook.verified.webhook_event_id || 0),
      event_type: text(webhook.verified.event_type),
      process_status: text(webhook.verified.process_status),
      provider_event_id: safeProviderReference(webhook.verified.provider_event_id),
    } : null,
    duplicate_replay: webhook.replay ? {
      webhook_event_id: Number(webhook.replay.webhook_event_id || 0),
      event_type: text(webhook.replay.event_type),
      process_status: text(webhook.replay.process_status),
    } : null,
    provider_refund: refund ? {
      refund_rowid: Number(refund.refund_rowid || 0),
      provider_refund_id: safeProviderReference(refund.provider_refund_id),
      refund_status: text(refund.refund_status),
      provider_sync_status: text(refund.provider_sync_status),
      amount_cents: Number(refund.amount_cents || 0),
      currency: text(refund.currency || 'CAD').toUpperCase(),
      provider_sync_at: refund.provider_sync_at || null,
    } : null,
    refund_accepted: Boolean(refund),
    webhook: {
      preferred_stable_url: `${stablePreviewOrigin()}${webhookPath(provider)}`,
      current_exact_url: `${getOrigin(request)}${webhookPath(provider)}`,
      required_events: webhookEvents(provider),
      provider_reachability_proved: false,
      access_policy_note: 'Cloudflare Access must allow provider POST delivery to this webhook path without exposing /admin/ or other Preview routes.',
    },
  };
}

async function persistCheck(db, admin, provider, check) {
  const current = await db.prepare(`
    SELECT it_provider_readiness_check_id,check_state,evidence_reference,last_safe_error
    FROM it_provider_readiness_checks
    WHERE provider_key=? AND environment='development' AND check_key=?
    LIMIT 1
  `).bind(provider, check.check_key).first();
  if (!current) return { updated: false, reason: 'missing_readiness_row' };

  const previousState = text(current.check_state) || 'pending';
  const nextState = text(check.check_state) || 'pending';
  const evidenceReference = text(check.evidence_reference).slice(0, 1500) || null;
  const safeError = nextState === 'failed' ? text(check.detail).slice(0, 1500) : null;
  const stateChanged = previousState !== nextState;
  const evidenceChanged = text(current.evidence_reference) !== text(evidenceReference);

  await db.prepare(`
    UPDATE it_provider_readiness_checks
    SET check_state=?, evidence_reference=?, last_safe_error=?, last_checked_at=CURRENT_TIMESTAMP,
        updated_by_user_id=?, updated_at=CURRENT_TIMESTAMP
    WHERE it_provider_readiness_check_id=?
  `).bind(nextState, evidenceReference, safeError, admin.user_id || null, Number(current.it_provider_readiness_check_id)).run();

  if (stateChanged || evidenceChanged) {
    await db.prepare(`
      INSERT INTO it_provider_readiness_events(
        it_provider_readiness_check_id,provider_key,environment,state_before,state_after,
        event_note,evidence_reference,created_by_user_id,created_at
      ) VALUES(?,?,'development',?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(
      Number(current.it_provider_readiness_check_id),
      provider,
      previousState,
      nextState,
      `Release 466 Build 6 derived provider acceptance evidence: ${text(check.detail).slice(0, 1200)}`,
      evidenceReference,
      admin.user_id || null
    ).run();
  }
  return { updated: true, state_changed: stateChanged, evidence_changed: evidenceChanged };
}

async function persistDerivedEvidence(db, admin, evidence) {
  const updates = [];
  for (const check of evidence.checks) {
    updates.push(await persistCheck(db, admin, evidence.provider, check));
  }
  return updates;
}

function testOrderNumber(provider) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `R466-${provider.toUpperCase()}-${stamp}-${random}`;
}

async function createAcceptanceOrder(db, admin, provider) {
  const orderNumber = testOrderNumber(provider);
  const customerEmail = `release466-${provider}@devilndove.example`;
  const customerName = `Release 466 ${provider === 'stripe' ? 'Stripe' : 'PayPal'} Acceptance`;
  const note = `${ACCEPTANCE_MARKER} provider=${provider} build=${BUILD} created_by_admin_user_id=${Number(admin.user_id || 0)} development_only=true`;
  const amountCents = 100;

  const insert = await db.prepare(`
    INSERT INTO orders (
      order_number,user_id,customer_email,customer_name,order_status,payment_status,payment_method,
      fulfillment_type,currency,subtotal_cents,discount_cents,shipping_cents,tax_cents,total_cents,
      notes,created_at,updated_at
    ) VALUES (?,NULL,?,?,'pending','pending',?,'digital','CAD',?,0,0,0,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `).bind(orderNumber, customerEmail, customerName, provider, amountCents, amountCents, note).run();
  const orderId = Number(insert?.meta?.last_row_id || 0);
  if (!orderId) throw new Error('acceptance_test_order_create_failed');

  await db.prepare(`
    INSERT INTO order_items (
      order_id,product_id,sku,product_name,product_type,unit_price_cents,quantity,line_subtotal_cents,
      taxable,tax_class_code,requires_shipping,digital_file_url,created_at
    ) VALUES (?,NULL,?,?, 'digital',?,1,?,0,NULL,0,NULL,CURRENT_TIMESTAMP)
  `).bind(orderId, `R466-${provider.toUpperCase()}-ACCEPTANCE`, `Release 466 ${provider} sandbox acceptance`, amountCents, amountCents).run();

  await db.prepare(`
    INSERT INTO order_status_history(order_id,old_status,new_status,changed_by_user_id,note,created_at)
    VALUES (?,'draft','pending',?,?,CURRENT_TIMESTAMP)
  `).bind(orderId, admin.user_id || null, 'Release 466 Development provider acceptance test order created.').run();

  return { order_id: orderId, order_number: orderNumber, amount_cents: amountCents, currency: 'CAD' };
}

function forwardedAdminHeaders(request) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const cookie = request.headers.get('cookie');
  const authorization = request.headers.get('authorization');
  if (cookie) headers.set('cookie', cookie);
  if (authorization) headers.set('authorization', authorization);
  return headers;
}

async function markPreparationFailure(db, orderId, provider, message) {
  const safeMessage = text(message).slice(0, 700);
  await db.prepare(`
    UPDATE orders
    SET order_status='cancelled',payment_status='failed',
        notes=COALESCE(notes,'') || ?,updated_at=CURRENT_TIMESTAMP
    WHERE order_id=?
  `).bind(` preparation_failed=${safeMessage}`, Number(orderId)).run().catch(() => null);
  await db.prepare(`
    UPDATE payments SET payment_status='failed',notes=COALESCE(notes,'') || ?,updated_at=CURRENT_TIMESTAMP
    WHERE order_id=? AND LOWER(COALESCE(provider,''))=?
  `).bind(` Release 466 acceptance preparation failed: ${safeMessage}.`, Number(orderId), provider).run().catch(() => null);
}

async function prepareAcceptanceCheckout({ request, env, db, admin, provider }) {
  const configuration = configurationState(env, request, provider);
  if (!configuration.configuration_ready || !configuration.execution_authorized) {
    return json({
      ok: false,
      code: configuration.live_credential_detected ? 'payment_live_credentials_forbidden' : configuration.execution_code,
      error: configuration.live_credential_detected
        ? 'Live payment credentials are forbidden in the Release 466 Development acceptance runner.'
        : 'Development provider configuration or the explicit execution switch is incomplete.',
      provider,
      configuration,
      provider_network_call_performed: false,
      production_mutation: false,
    }, configuration.live_credential_detected ? 423 : 409);
  }

  const order = await createAcceptanceOrder(db, admin, provider);
  const internalUrl = new URL('/api/checkout-prepare-payment', request.url).toString();
  const internalRequest = new Request(internalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: order.order_id, provider }),
  });
  const response = await preparePaymentPost({ request: internalRequest, env });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    await markPreparationFailure(db, order.order_id, provider, data?.error || `Provider preparation failed (${response.status}).`);
    return json({
      ok: false,
      code: data?.code || 'provider_acceptance_checkout_prepare_failed',
      error: data?.error || `Provider preparation failed (${response.status}).`,
      provider,
      acceptance_test_order: order,
      provider_network_call_performed: response.status !== 423,
      production_mutation: false,
    }, response.status >= 400 ? response.status : 502);
  }

  const preparation = data.payment_preparation || {};
  const evidence = await deriveProviderEvidence(db, request, env, provider);
  await persistDerivedEvidence(db, admin, evidence);
  await auditAdminAction(env, request, admin, {
    action_type: 'release466_provider_acceptance_checkout_prepared',
    target_type: 'order',
    target_id: order.order_id,
    target_key: order.order_number,
    details: { provider, build: BUILD, development_only: true, provider_network_call_performed: true, production_mutation: false },
  });

  return json({
    ok: true,
    provider,
    message: `${provider === 'stripe' ? 'Stripe test Checkout' : 'PayPal sandbox approval'} prepared. Provider acceptance is still pending payment completion and verified webhook evidence.`,
    acceptance_test_order: order,
    redirect_url: text(preparation.redirect_url) || null,
    provider_order_id: safeProviderReference(preparation?.payment_stub?.provider_order_id),
    provider_payment_id: safeProviderReference(preparation?.payment_stub?.provider_payment_id),
    requires_human_approval: true,
    acceptance_marked_passed: false,
    provider_network_call_performed: true,
    production_mutation: false,
  });
}

async function refundLatestAcceptance({ request, env, db, admin, provider }) {
  const evidence = await deriveProviderEvidence(db, request, env, provider);
  const payment = evidence.acceptance_payment;
  if (!payment || !SETTLED_STATUSES.has(text(payment.payment_status).toLowerCase())) {
    return json({ ok: false, code: 'acceptance_payment_not_settled', error: 'A settled Development acceptance payment is required before the sandbox refund proof.', provider }, 409);
  }
  if (evidence.refund_accepted) {
    return json({ ok: true, provider, message: 'A provider-synchronized Development refund is already recorded for this acceptance payment.', evidence, provider_network_call_performed: false, production_mutation: false });
  }

  const internalUrl = new URL('/api/admin/payment-actions', request.url).toString();
  const internalRequest = new Request(internalUrl, {
    method: 'POST',
    headers: forwardedAdminHeaders(request),
    body: JSON.stringify({
      action: 'refund',
      payment_id: Number(payment.payment_id),
      amount_cents: Number(payment.amount_cents),
      currency: payment.currency || 'CAD',
      reason: 'Release 466 Development provider acceptance refund proof',
      note: `${ACCEPTANCE_MARKER} provider=${provider} refund-proof`,
      sync_provider: 1,
      provider_sync_confirmed: true,
    }),
  });
  const response = await paymentActionPost({ request: internalRequest, env });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    return json({
      ok: false,
      code: data?.code || 'provider_acceptance_refund_failed',
      error: data?.error || `Provider refund failed (${response.status}).`,
      provider,
      payment_id: Number(payment.payment_id),
      provider_network_call_performed: Boolean(data?.provider_network_call_performed),
      production_mutation: false,
    }, response.status >= 400 ? response.status : 502);
  }

  const refreshed = await deriveProviderEvidence(db, request, env, provider);
  await persistDerivedEvidence(db, admin, refreshed);
  await auditAdminAction(env, request, admin, {
    action_type: 'release466_provider_acceptance_refund_proved',
    target_type: 'payment',
    target_id: Number(payment.payment_id),
    target_key: provider,
    details: { provider, build: BUILD, development_only: true, provider_sync_status: data?.provider_sync?.provider_sync_status || null, production_mutation: false },
  });
  return json({
    ok: true,
    provider,
    message: `${provider === 'stripe' ? 'Stripe test' : 'PayPal sandbox'} provider-synchronized refund proof completed.`,
    payment_id: Number(payment.payment_id),
    provider_sync: data?.provider_sync || null,
    evidence: refreshed,
    provider_network_call_performed: true,
    production_mutation: false,
  });
}

async function buildState(db, request, env) {
  const [stripe, paypal] = await Promise.all([
    deriveProviderEvidence(db, request, env, 'stripe'),
    deriveProviderEvidence(db, request, env, 'paypal'),
  ]);
  return {
    authority: 'release466-provider-acceptance-runner',
    environment: text(env.DND_ENVIRONMENT).toLowerCase() || 'unknown',
    schema_change_required: false,
    default_provider_execution: 'closed_unless_development_explicit',
    production_provider_execution: false,
    production_mutation: false,
    secret_values_emitted: false,
    operator_switches: {
      payment_execution: 'PAYMENT_PROVIDER_EXECUTION_MODE=development-explicit',
      provider_refund: 'PAYMENT_PROVIDER_MUTATIONS_ENABLED=1',
    },
    providers: { stripe, paypal },
  };
}

export async function onRequestGet({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const boundary = requireDevelopmentBoundary(request, env, 'stripe');
  if (!boundary.ok) {
    return json({ ok: false, code: 'provider_acceptance_development_only', error: 'The provider acceptance runner is available only on the canonical Development Preview.', boundary, production_mutation: false }, 403);
  }
  return json({ ok: true, ...(await buildState(db, request, env)) });
}

export async function onRequestPost({ request, env }) {
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  let body = {};
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'Valid JSON is required.' }, 400); }

  const action = text(body.action).toLowerCase();
  const provider = providerName(body.provider);
  const boundary = requireDevelopmentBoundary(request, env, provider || 'stripe');
  if (!boundary.ok) {
    return json({ ok: false, code: 'provider_acceptance_development_only', error: 'Provider acceptance actions are blocked outside the canonical Development Preview.', boundary, provider_network_call_performed: false, production_mutation: false }, 403);
  }

  if (action === 'refresh_evidence') {
    const evidence = provider
      ? [await deriveProviderEvidence(db, request, env, provider)]
      : await Promise.all(['stripe', 'paypal'].map((key) => deriveProviderEvidence(db, request, env, key)));
    for (const item of evidence) await persistDerivedEvidence(db, admin, item);
    await auditAdminAction(env, request, admin, {
      action_type: 'release466_provider_acceptance_evidence_refresh',
      target_type: 'provider_acceptance',
      target_key: provider || 'stripe+paypal',
      details: { build: BUILD, provider: provider || 'all', provider_execution: false, production_mutation: false },
    });
    return json({ ok: true, message: 'Verified Development provider evidence refreshed.', ...(await buildState(db, request, env)), provider_network_call_performed: false });
  }

  if (!provider) return json({ ok: false, error: 'provider must be stripe or paypal.' }, 400);
  if (body.confirm_provider_test !== true) {
    return json({ ok: false, code: 'explicit_provider_test_confirmation_required', error: 'This Development provider action requires explicit confirm_provider_test=true.', provider, provider_network_call_performed: false, production_mutation: false }, 409);
  }

  if (action === 'prepare_checkout') {
    return prepareAcceptanceCheckout({ request, env, db, admin, provider });
  }
  if (action === 'refund_latest') {
    return refundLatestAcceptance({ request, env, db, admin, provider });
  }
  return json({ ok: false, error: 'Unsupported provider acceptance action.' }, 400);
}
