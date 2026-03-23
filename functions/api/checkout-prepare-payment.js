// File: /functions/api/checkout-prepare-payment.js
// Brief description: Prepares a payment handoff for an existing order. It validates the order,
// creates or reuses a pending payment record, and returns either a live PayPal approval URL
// when credentials are configured or a safe stub payload for other providers and fallback flows.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeProvider(value) {
  const provider = normalizeText(value).toLowerCase();
  return ["paypal", "stripe", "square", "manual", "other"].includes(provider)
    ? provider
    : "";
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function getBaseUrl(request, env) {
  return normalizeText(env.PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

async function getOrCreatePendingPayment(env, order_id, provider, order) {
  const existingPendingPaymentsResult = await env.DB.prepare(`
    SELECT
      payment_id,
      order_id,
      provider,
      provider_payment_id,
      provider_order_id,
      payment_status,
      amount_cents,
      currency,
      payment_method_label,
      transaction_reference,
      paid_at,
      created_at,
      updated_at,
      notes
    FROM payments
    WHERE order_id = ?
      AND LOWER(COALESCE(provider, '')) = ?
      AND LOWER(COALESCE(payment_status, '')) IN ('pending', 'authorized')
    ORDER BY payment_id DESC
  `)
    .bind(order_id, provider)
    .all();

  const existingPendingPayments = normalizeResults(existingPendingPaymentsResult);
  let paymentRecord = existingPendingPayments[0] || null;

  if (!paymentRecord) {
    const insertResult = await env.DB.prepare(`
      INSERT INTO payments (
        order_id,
        provider,
        payment_status,
        amount_cents,
        currency,
        payment_method_label,
        created_at,
        updated_at,
        notes
      )
      VALUES (?, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    `)
      .bind(
        order_id,
        provider,
        Number(order.total_cents || 0),
        order.currency || "CAD",
        provider,
        `Prepared for ${provider} checkout handoff.`
      )
      .run();

    const payment_id = Number(insertResult?.meta?.last_row_id || 0);

    if (payment_id > 0) {
      paymentRecord = await env.DB.prepare(`
        SELECT
          payment_id,
          order_id,
          provider,
          provider_payment_id,
          provider_order_id,
          payment_status,
          amount_cents,
          currency,
          payment_method_label,
          transaction_reference,
          paid_at,
          created_at,
          updated_at,
          notes
        FROM payments
        WHERE payment_id = ?
        LIMIT 1
      `)
        .bind(payment_id)
        .first();
    }
  }

  return paymentRecord;
}

async function getPaypalAccessToken(env) {
  const clientId = normalizeText(env.PAYPAL_CLIENT_ID);
  const secret = normalizeText(env.PAYPAL_SECRET);
  const mode = normalizeText(env.PAYPAL_ENV || "sandbox").toLowerCase() || "sandbox";

  if (!clientId || !secret) {
    return null;
  }

  const base = mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  const basic = btoa(`${clientId}:${secret}`);

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Failed to obtain PayPal access token.");
  }

  return {
    access_token: data.access_token,
    base,
    mode
  };
}

async function createPaypalOrder(request, env, order, paymentRecord) {
  const auth = await getPaypalAccessToken(env);
  if (!auth) return null;

  const baseUrl = getBaseUrl(request, env);
  const returnUrl = `${baseUrl}/checkout/confirmation/?order_id=${encodeURIComponent(String(order.order_id || ""))}&provider=paypal`;
  const cancelUrl = `${baseUrl}/checkout/?order_id=${encodeURIComponent(String(order.order_id || ""))}`;

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: String(order.order_number || order.order_id || "order"),
        description: `Devil n Dove order ${String(order.order_number || order.order_id || "")}`,
        amount: {
          currency_code: String(order.currency || "CAD").toUpperCase(),
          value: (Number(order.total_cents || 0) / 100).toFixed(2)
        }
      }
    ],
    payer: {
      email_address: order.customer_email || undefined,
      name: order.customer_name ? { given_name: order.customer_name } : undefined
    },
    application_context: {
      brand_name: "Devil n Dove",
      user_action: "PAY_NOW",
      return_url: returnUrl,
      cancel_url: cancelUrl
    }
  };

  const response = await fetch(`${auth.base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${auth.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.id) {
    throw new Error(data?.message || data?.details?.[0]?.description || "Failed to create PayPal order.");
  }

  const approveLink = Array.isArray(data.links)
    ? data.links.find((link) => String(link.rel || "").toLowerCase() === "approve")
    : null;

  await env.DB.prepare(`
    UPDATE payments
    SET
      provider_order_id = ?,
      notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE payment_id = ?
  `)
    .bind(
      String(data.id || ""),
      `Prepared for paypal checkout handoff.${approveLink?.href ? ` Approval URL created.` : ""}`,
      Number(paymentRecord.payment_id || 0)
    )
    .run();

  return {
    provider: "paypal",
    provider_mode: auth.mode,
    redirect_url: approveLink?.href || null,
    provider_order_id: String(data.id || ""),
    return_url: returnUrl,
    cancel_url: cancelUrl
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const order_id = Number(body.order_id);
  const provider = normalizeProvider(body.provider || "paypal");

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  if (!provider) {
    return json({ ok: false, error: "A valid payment provider is required." }, 400);
  }

  const order = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      user_id,
      customer_email,
      customer_name,
      order_status,
      payment_status,
      payment_method,
      fulfillment_type,
      currency,
      total_cents,
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  if (!order) {
    return json({ ok: false, error: "Order not found." }, 404);
  }

  const orderStatus = String(order.order_status || "").toLowerCase();
  const paymentStatus = String(order.payment_status || "").toLowerCase();

  if (["cancelled", "refunded"].includes(orderStatus)) {
    return json({ ok: false, error: "This order cannot accept a new payment in its current state." }, 400);
  }

  if (["paid", "completed"].includes(paymentStatus)) {
    return json({
      ok: true,
      message: "Order is already paid.",
      already_paid: true,
      payment_preparation: {
        provider,
        provider_mode: "already_paid",
        order_id: Number(order.order_id || 0),
        order_number: order.order_number || "",
        currency: order.currency || "CAD",
        total_cents: Number(order.total_cents || 0),
        customer_email: order.customer_email || "",
        customer_name: order.customer_name || ""
      }
    });
  }

  const paymentRecord = await getOrCreatePendingPayment(env, order_id, provider, order);

  if (paymentStatus !== "pending") {
    await env.DB.prepare(`
      UPDATE orders
      SET
        payment_status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `)
      .bind(order_id)
      .run();
  }

  const baseUrl = getBaseUrl(request, env);
  let providerLivePayload = null;

  try {
    if (provider === "paypal") {
      providerLivePayload = await createPaypalOrder(request, env, order, paymentRecord);
    }
  } catch (error) {
    providerLivePayload = {
      provider,
      provider_mode: "stub",
      live_error: error.message || "Provider handoff failed."
    };
  }

  const payment_preparation = {
    provider,
    provider_mode: providerLivePayload?.provider_mode || "stub",
    order_id: Number(order.order_id || 0),
    order_number: order.order_number || "",
    currency: order.currency || "CAD",
    total_cents: Number(order.total_cents || 0),
    customer_email: order.customer_email || "",
    customer_name: order.customer_name || "",
    return_url: providerLivePayload?.return_url || `${baseUrl}/checkout/confirmation/?order_id=${encodeURIComponent(String(order.order_id || order_id))}`,
    cancel_url: providerLivePayload?.cancel_url || `${baseUrl}/checkout/?order_id=${encodeURIComponent(String(order.order_id || order_id))}`,
    redirect_url: providerLivePayload?.redirect_url || null,
    live_error: providerLivePayload?.live_error || null,
    payment_stub: paymentRecord
      ? {
          payment_id: Number(paymentRecord.payment_id || 0),
          provider: paymentRecord.provider || provider,
          payment_status: paymentRecord.payment_status || "pending",
          amount_cents: Number(paymentRecord.amount_cents || order.total_cents || 0),
          currency: paymentRecord.currency || order.currency || "CAD",
          payment_method_label: paymentRecord.payment_method_label || provider,
          provider_order_id: providerLivePayload?.provider_order_id || paymentRecord.provider_order_id || null,
          created_at: paymentRecord.created_at || null,
          updated_at: paymentRecord.updated_at || null
        }
      : null
  };

  return json({
    ok: true,
    message: "Payment preparation ready.",
    already_paid: false,
    payment_preparation
  });
}
