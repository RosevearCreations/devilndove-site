// File: /functions/api/member/orders.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
      s.session_token,
      s.token,
      s.expires_at,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_active
    FROM sessions s
    INNER JOIN users u
      ON u.user_id = s.user_id
    WHERE (
      s.session_token = ?
      OR s.token = ?
    )
      AND s.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token, token)
    .first();

  return sessionUser || null;
}

async function requireMember(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return { error: json({ ok: false, error: "Invalid or expired session." }, 401) };
  }

  if (Number(sessionUser.is_active || 0) !== 1) {
    return { error: json({ ok: false, error: "Account is inactive." }, 403) };
  }

  const role = String(sessionUser.role || "").trim().toLowerCase();

  if (!["member", "admin"].includes(role)) {
    return { error: json({ ok: false, error: "Forbidden." }, 403) };
  }

  return {
    sessionUser: {
      user_id: Number(sessionUser.resolved_user_id || sessionUser.user_id || 0),
      email: sessionUser.email || "",
      display_name: sessionUser.display_name || "",
      role
    }
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireMember(request, env);
  if (authCheck.error) return authCheck.error;

  const sessionUser = authCheck.sessionUser;

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
      o.user_id,
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
      o.created_at,
      o.updated_at,

      COALESCE(ps.payment_count, 0) AS payment_count,
      COALESCE(ps.paid_total_cents, 0) AS paid_total_cents,
      COALESCE(ps.pending_total_cents, 0) AS pending_total_cents,

      CASE
        WHEN ps.order_id IS NULL THEN COALESCE(o.payment_status, 'pending')
        WHEN COALESCE(ps.has_refunded, 0) = 1 THEN 'refunded'
        WHEN COALESCE(ps.has_partially_refunded, 0) = 1 THEN 'partially_refunded'
        WHEN COALESCE(ps.paid_total_cents, 0) >= COALESCE(o.total_cents, 0)
             AND COALESCE(o.total_cents, 0) > 0 THEN 'paid'
        WHEN COALESCE(ps.has_authorized, 0) = 1 THEN 'authorized'
        WHEN COALESCE(ps.has_pending, 0) = 1 THEN 'pending'
        WHEN COALESCE(ps.all_failed_or_cancelled, 0) = 1 THEN 'failed'
        ELSE COALESCE(o.payment_status, 'pending')
      END AS derived_payment_status

    FROM orders o
    LEFT JOIN payment_summary ps
      ON ps.order_id = o.order_id

    WHERE (
      o.user_id = ?
      OR LOWER(COALESCE(o.customer_email, '')) = LOWER(?)
    )

    ORDER BY o.created_at DESC, o.order_id DESC
  `;

  const result = await env.DB.prepare(sql)
    .bind(sessionUser.user_id, sessionUser.email)
    .all();

  return json({
    ok: true,
    user: {
      user_id: sessionUser.user_id,
      email: sessionUser.email,
      display_name: sessionUser.display_name,
      role: sessionUser.role
    },
    orders: normalizeResults(result)
  });
}
