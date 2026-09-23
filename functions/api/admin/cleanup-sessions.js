import { auditAdminAction } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";
import { resolveSessionUser } from "../_lib/accountAuthCompat.js";
// File: /functions/api/admin/cleanup-sessions.js

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

export async function onRequestPost(context) {
  const { request, env } = context;

  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const mode = normalizeText(body.mode || "expired_only").toLowerCase();
  const target_user_id = Number(body.target_user_id || 0);
  const preserve_current_session = body.preserve_current_session !== false;

  if (!["expired_only", "user_all_sessions", "all_expired_and_user"].includes(mode)) {
    return json({ ok: false, error: "Invalid cleanup mode." }, 400);
  }

  const stepUp = await requireAdminStepUp(request, env, adminUser, body, "session cleanup");
  if (!stepUp.ok) return stepUp.response;

  let expired_deleted = 0;
  let user_deleted = 0;
  let target_user = null;

  if (mode === "expired_only" || mode === "all_expired_and_user") {
    const expiredRows = await env.DB.prepare(`
      SELECT
        session_id
      FROM sessions
      WHERE expires_at <= datetime('now')
    `).all();

    const expiredSessionIds = (Array.isArray(expiredRows?.results) ? expiredRows.results : [])
      .map((row) => Number(row.session_id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (expiredSessionIds.length) {
      const placeholders = expiredSessionIds.map(() => "?").join(", ");

      await env.DB.prepare(`
        DELETE FROM sessions
        WHERE session_id IN (${placeholders})
      `)
        .bind(...expiredSessionIds)
        .run();

      expired_deleted = expiredSessionIds.length;
    }
  }

  if (mode === "user_all_sessions" || mode === "all_expired_and_user") {
    if (!Number.isInteger(target_user_id) || target_user_id <= 0) {
      return json({ ok: false, error: "A valid target_user_id is required for this cleanup mode." }, 400);
    }

    target_user = await env.DB.prepare(`
      SELECT
        user_id,
        email,
        display_name,
        role,
        is_active
      FROM users
      WHERE user_id = ?
      LIMIT 1
    `)
      .bind(target_user_id)
      .first();

    if (!target_user) {
      return json({ ok: false, error: "Target user not found." }, 404);
    }

    const userSessionsResult = await env.DB.prepare(`
      SELECT
        session_id
      FROM sessions
      WHERE user_id = ?
    `)
      .bind(target_user_id)
      .all();

    let userSessionIds = (Array.isArray(userSessionsResult?.results) ? userSessionsResult.results : [])
      .map((row) => Number(row.session_id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (preserve_current_session && target_user_id === adminUser.user_id) {
      userSessionIds = userSessionIds.filter((id) => id !== adminUser.session_id);
    }

    if (userSessionIds.length) {
      const placeholders = userSessionIds.map(() => "?").join(", ");

      await env.DB.prepare(`
        DELETE FROM sessions
        WHERE session_id IN (${placeholders})
      `)
        .bind(...userSessionIds)
        .run();

      user_deleted = userSessionIds.length;
    }
  }

  await auditAdminAction(env, request, adminUser, {
    action_type: "session_cleanup",
    target_type: "sessions",
    target_id: target_user_id || null,
    target_key: mode,
    details: {
      mode,
      expired_deleted,
      user_deleted,
      total_deleted: expired_deleted + user_deleted,
      preserve_current_session,
      step_up_verified: true,
      secret_values_emitted: false
    }
  });

  return json({
    ok: true,
    message: "Session cleanup completed.",
    cleaned_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    },
    mode,
    summary: {
      expired_deleted,
      user_deleted,
      total_deleted: expired_deleted + user_deleted,
      preserve_current_session
    },
    target_user: target_user
      ? {
          user_id: Number(target_user.user_id || 0),
          email: target_user.email || "",
          display_name: target_user.display_name || "",
          role: target_user.role || "",
          is_active: Number(target_user.is_active || 0)
        }
      : null
  });
}
