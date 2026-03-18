// File: /functions/api/admin/orders.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
    SELECT
      users.user_id,
      users.email,
      users.display_name,
      users.role,
      users.is_active
    FROM sessions
    JOIN users ON sessions.user_id = users.user_id
    WHERE sessions.session_token = ?
      AND sessions.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token)
    .first();

  return sessionUser || null;
}

async function requireAdmin(request, env) {
  const auth = request.headers.get("Authorization") || "";

  if (!auth.startsWith("Bearer ")) {
    return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  }

  const token = auth.slice(7).trim();

  if (!token) {
    return { error: json({ ok: false, error: "Missing session token." }, 401) };
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return { error: json({ ok: false, error: "Invalid session." }, 401) };
  }

  if (!sessionUser.is_active) {
    return { error: json({ ok: false, error: "Account is inactive." }, 403) };
  }

  if (String(sessionUser.role || "").toLowerCase() !== "admin") {
    return { error: json({ ok: false, error: "Forbidden." }, 403) };
  }

  return { sessionUser };
}

function normalizeStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return ["draft", "pending", "paid", "fulfilled", "cancelled", "refunded"].includes(status)
    ? status
    : "";
}

function normalizePaymentStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return [
    "pending",
    "authorized",
    "paid",
    "completed",
    "captured",
    "failed",
    "cancelled",
    "refunded",
    "partially_refunded"
  ].includes(status)
    ? status
    : "";
}

function normalizeFulfillment(value) {
  const fulfillment = String(value || "").trim().toLowerCase();
  return ["shipping", "digital", "mixed", "pickup"].includes(fulfillment)
    ? fulfillment
    : "";
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  const url = new URL(request.url);
  const statusFilter = normalizeStatus(url.searchParams.get("status"));
  const paymentFilter = normalizePaymentStatus(url.searchParams.get("payment_status"));
  const fulfillmentFilter = normalizeFulfillment(url.searchParams.get("fulfillment_type"));

  const conditions = [];
  const bindings = [];

  if (statusFilter) {
    conditions.push("o.order_status = ?");
    bindings.push(statusFilter);
  }

  if (fulfillmentFilter) {
    conditions.push("o.fulfillment_type = ?");
    bindings.push(fulfillmentFilter);
  }

  if (paymentFilter) {
    conditions.push(`
      (
        LOWER(COALESCE(o.payment_status, '')) = ?
        OR LOWER(COALESCE(ps.derived_payment_status, '')) = ?
      )
    `);
    bindings.push(paymentFilter, paymentFilter);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const sql = `
    WITH payment_summary AS (
      SELECT
        p.order_id,

        COUNT(*) AS payment_count,

        COALESCE(SUM(
          CASE
            WHEN LOWER(COALESCE(p.payment_status, '')) IN ('paid', 'completed', 'captured')
              THEN COALESCE(p.amount_cents, 0)
            ELSE 0
          END
        ), 0) AS paid_total_cents,

        COALESCE(SUM(
          CASE
            WHEN LOWER(COALESCE(p.payment_status, '')) = 'partially_refunded'
              THEN COALESCE(p.amount_cents, 0)
            WHEN LOWER(COALESCE(p.payment_status, '')) = 'refunded'
              THEN COALESCE(p.amount_cents, 0)
            ELSE 0
          END
        ), 0) AS refunded_total_cents,

        COALESCE(SUM(
          CASE
            WHEN LOWER(COALESCE(p.payment_status, '')) IN ('pending', 'authorized')
              THEN COALESCE(p.amount_cents, 0)
            ELSE 0
          END
        ), 0) AS pending_total_cents,

        MAX(CASE
          WHEN LOWER(COALESCE(p.payment_status, '')) = 'refunded' THEN 1
          ELSE 0
        END) AS has_refunded,

        MAX(CASE
          WHEN LOWER(COALESCE(p.payment_status, '')) = 'partially_refunded' THEN 1
          ELSE 0
        END) AS has_partially_refunded,

        MAX(CASE
          WHEN LOWER(COALESCE(p.payment_status, '')) IN ('paid', 'completed', 'captured') THEN 1
          ELSE 0
        END) AS has_paid_like,

        MAX(CASE
          WHEN LOWER(COALESCE(p.payment_status, '')) = 'authorized' THEN 1
          ELSE 0
        END) AS has_authorized,

        MAX(CASE
          WHEN LOWER(COALESCE(p.payment_status, '')) = 'pending' THEN 1
          ELSE 0
        END) AS has_pending,

        MIN(CASE
          WHEN LOWER(COALESCE(p.payment_status, '')) IN ('failed', 'cancelled') THEN 1
          ELSE 0
        END) AS all_failed_or_cancelled
      FROM payments p
      GROUP BY p.order_id
    )

    SELECT
      o.order_id,
      o.order_number,
      o.customer_email,
      o.customer_name,
      o.order_status,
      o.payment_status,
      o.payment_method,
      o.fulfillment_type,
      o.currency,
      o.subtotal_cents,
      COALESCE(o.discount_cents, 0) AS discount_cents,
      o.shipping_cents,
      o.tax_cents,
      o.total_cents,
      o.shipping_city,
      o.shipping_province,
      o.shipping_country,
      o.created_at,
      o.updated_at,

      COALESCE(ps.payment_count, 0) AS payment_count,
      COALESCE(ps.paid_total_cents, 0) AS paid_total_cents,
      COALESCE(ps.refunded_total_cents, 0) AS refunded_total_cents,
      COALESCE(ps.pending_total_cents, 0) AS pending_total_cents,

      CASE
        WHEN ps.order_id IS NULL THEN 'pending'
        WHEN COALESCE(ps.has_refunded, 0) = 1 THEN 'refunded'
        WHEN COALESCE(ps.has_partially_refunded, 0) = 1 THEN 'partially_refunded'
        WHEN COALESCE(ps.paid_total_cents, 0) >= COALESCE(o.total_cents, 0)
             AND COALESCE(o.total_cents, 0) > 0 THEN 'paid'
        WHEN COALESCE(ps.has_authorized, 0) = 1 THEN 'authorized'
        WHEN COALESCE(ps.has_pending, 0) = 1 THEN 'pending'
        WHEN COALESCE(ps.all_failed_or_cancelled, 0) = 1 THEN 'failed'
        ELSE COALESCE(o.payment_status, 'pending')
      END AS derived_payment_status,

      MAX(COALESCE(o.total_cents, 0) - COALESCE(ps.paid_total_cents, 0), 0) AS outstanding_cents

    FROM orders o
    LEFT JOIN payment_summary ps
      ON ps.order_id = o.order_id

    ${whereClause}

    ORDER BY o.created_at DESC, o.order_id DESC
  `;

  const result = bindings.length
    ? await env.DB.prepare(sql).bind(...bindings).all()
    : await env.DB.prepare(sql).all();

  return json({
    ok: true,
    orders: Array.isArray(result?.results) ? result.results : []
  });
}
