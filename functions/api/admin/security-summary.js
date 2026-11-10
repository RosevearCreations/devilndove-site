import { resolveSessionUser } from "../_lib/accountAuthCompat.js";
// File: /functions/api/admin/security-summary.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}

async function getAdminUserFromRequest(request, env) {
  const db = env.DB || env.DD_DB;
  if (!db) return null;
  const user = await resolveSessionUser(request, db, { requireAdmin: true });
  if (!user) return null;
  return {
    session_id: Number(user.session_id || 0),
    user_id: Number(user.user_id || user.session_user_id || 0),
    email: user.email || "",
    display_name: user.display_name || "",
    role: user.role || "admin"
  };
}

async function getSingleRow(db, sql) {
  const row = await db.prepare(sql).first();
  return row || {};
}

export async function onRequestGet(context) {
  try { return await readAdminSecuritySummary(context); }
  catch { return json({ok:false,error:"Security verification unavailable."},503); }
}

async function readAdminSecuritySummary(context) {
  const { request, env } = context;

  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const db = env.DB || env.DD_DB;
  const userSummary = await getSingleRow(db, `
    SELECT
      COUNT(*) AS total_users,
      SUM(CASE WHEN COALESCE(is_active, 0) = 1 THEN 1 ELSE 0 END) AS active_users,
      SUM(CASE WHEN COALESCE(is_active, 0) = 0 THEN 1 ELSE 0 END) AS inactive_users,
      SUM(CASE WHEN LOWER(COALESCE(role, '')) = 'admin' THEN 1 ELSE 0 END) AS admin_users,
      SUM(CASE
        WHEN LOWER(COALESCE(role, '')) = 'admin'
         AND COALESCE(is_active, 0) = 1
        THEN 1 ELSE 0
      END) AS active_admin_users
    FROM users
  `);

  const sessionSummary = await getSingleRow(db, `
    SELECT
      COUNT(*) AS total_sessions,
      SUM(CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END) AS active_sessions,
      SUM(CASE WHEN expires_at <= datetime('now') THEN 1 ELSE 0 END) AS expired_sessions,
      SUM(CASE WHEN expires_at > datetime('now') AND expires_at <= datetime('now','+7 days') THEN 1 ELSE 0 END) AS expiring_soon_sessions,
      SUM(CASE WHEN expires_at <= datetime('now','-7 days') THEN 1 ELSE 0 END) AS stale_expired_sessions
    FROM sessions
  `);

  const bootstrap_required = Number(userSummary.active_admin_users || 0) === 0;

  return json({
    ok: true,
    checked_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    },
    summary: {
      total_users: Number(userSummary.total_users || 0),
      active_users: Number(userSummary.active_users || 0),
      inactive_users: Number(userSummary.inactive_users || 0),
      admin_users: Number(userSummary.admin_users || 0),
      active_admin_users: Number(userSummary.active_admin_users || 0),
      total_sessions: Number(sessionSummary.total_sessions || 0),
      active_sessions: Number(sessionSummary.active_sessions || 0),
      expired_sessions: Number(sessionSummary.expired_sessions || 0),
      expiring_soon_sessions: Number(sessionSummary.expiring_soon_sessions || 0),
      stale_expired_sessions: Number(sessionSummary.stale_expired_sessions || 0),
      bootstrap_required,
      cleanup_recommended: Number(sessionSummary.stale_expired_sessions || 0) > 0
    },
    security_controls: {
      session_mode: "http_only_cookie",
      mutation_origin_guard: true,
      runtime_script_nonce_csp: true,
      login_throttle: { enabled: true, attempts: 8, window_minutes: 15 },
      password_change_throttle: { enabled: true, attempts: 6, window_minutes: 15 },
      account_recovery_throttle: { enabled: true, contact_email_per_hour: 3, ip_per_hour: 6 },
      admin_session_cleanup_step_up: true,
      revoke_other_sessions_available: true,
      secret_values_logged: false
    },
    security_readiness: {
      evidence_scope: "CODE_AND_CURRENT_ADMIN_COUNTS_NOT_FIELD_ACCEPTANCE",
      tenant_isolation: "SOURCE_GATE_ONLY_FIELD_HOLD",
      privacy_export: "HOLD_OWNER_REVIEW",
      backup_snapshot: "UNKNOWN_NO_ORIGINAL_RECEIPT",
      restore_witness: "HOLD_NO_INDEPENDENT_RESTORE",
      production_restore_executed: false,
      master_connection: "DISCONNECTED / HOLD"
    }
  });
}
