import { paymentExecutionBoundary, paymentExecutionStatus } from './_lib/paymentExecution.js';

// File: /functions/api/payment-providers.js
// Brief description: Returns public, non-secret payment-provider readiness information.
// Configuration presence, webhook configuration, and remote execution authorization are separate states.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function isConfigured(value) {
  return String(value || "").trim().length > 0;
}

function stripeEnvironment(publishableKey, secretKey) {
  const publishable = String(publishableKey || "").trim().toLowerCase();
  const secret = String(secretKey || "").trim().toLowerCase();
  if (publishable.startsWith("pk_test_") && (secret.startsWith("sk_test_") || secret.startsWith("rk_test_"))) return "test";
  if (publishable.startsWith("pk_live_") && (secret.startsWith("sk_live_") || secret.startsWith("rk_live_"))) return "live";
  return "unknown";
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const paypalConfigured = isConfigured(env.PAYPAL_CLIENT_ID) && isConfigured(env.PAYPAL_SECRET);
  const paypalWebhookConfigured = paypalConfigured && isConfigured(env.PAYPAL_WEBHOOK_ID);
  const stripeConfigured = isConfigured(env.STRIPE_PUBLISHABLE_KEY) && isConfigured(env.STRIPE_SECRET_KEY);
  const stripeWebhookConfigured = isConfigured(env.STRIPE_WEBHOOK_SECRET) || isConfigured(env.STRIPE_WEBHOOK_SIGNING_SECRET);
  const stripeMode = stripeConfigured ? stripeEnvironment(env.STRIPE_PUBLISHABLE_KEY, env.STRIPE_SECRET_KEY) : "stub";
  const squareConfigured = isConfigured(env.SQUARE_APPLICATION_ID) && isConfigured(env.SQUARE_ACCESS_TOKEN);
  const paypalExecution = paymentExecutionStatus(request.url, env, 'paypal');
  const stripeExecution = paymentExecutionStatus(request.url, env, 'stripe');
  const boundary = paymentExecutionBoundary(env);

  return json({
    ok: true,
    payment_execution_boundary: boundary,
    providers: [
      {
        code: "paypal",
        label: "PayPal",
        configured: paypalConfigured,
        ready: paypalExecution.execution_authorized,
        execution_authorized: paypalExecution.execution_authorized,
        execution_code: paypalExecution.code,
        mode: paypalConfigured ? (String(env.PAYPAL_ENV || "sandbox").trim().toLowerCase() || "sandbox") : "stub",
        test_mode: paypalExecution.test_mode,
        checkout_kind: "redirect",
        webhook_configured: paypalWebhookConfigured,
        webhook_ready: paypalWebhookConfigured
      },
      {
        code: "stripe",
        label: "Card / Stripe",
        configured: stripeConfigured,
        ready: stripeExecution.execution_authorized,
        execution_authorized: stripeExecution.execution_authorized,
        execution_code: stripeExecution.code,
        mode: stripeConfigured ? "hosted_checkout" : "stub",
        environment: stripeMode,
        test_mode: stripeExecution.test_mode,
        checkout_kind: "hosted_checkout",
        webhook_configured: stripeWebhookConfigured,
        webhook_ready: stripeWebhookConfigured
      },
      {
        code: "square",
        label: "Square",
        configured: squareConfigured,
        ready: false,
        execution_authorized: false,
        execution_code: "payment_provider_execution_not_implemented",
        mode: "stub",
        checkout_kind: "hosted_or_sdk",
        webhook_configured: false,
        webhook_ready: false
      },
      {
        code: "manual",
        label: "Manual / Invoice",
        configured: true,
        ready: true,
        execution_authorized: true,
        execution_code: "local_manual_payment",
        mode: "manual",
        checkout_kind: "offline",
        webhook_configured: false,
        webhook_ready: false
      },
      {
        code: "other",
        label: "Other",
        configured: true,
        ready: true,
        execution_authorized: true,
        execution_code: "local_manual_payment",
        mode: "manual",
        checkout_kind: "offline",
        webhook_configured: false,
        webhook_ready: false
      }
    ]
  });
}
