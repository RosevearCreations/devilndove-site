import { resolveSessionUser } from "../_lib/accountAuthCompat.js";
import { auditAdminAction } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

// File: /functions/api/admin/delete-user.js

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


function normalizeAction(value) {
  const action = normalizeText(value).toLowerCase();
  return ["deactivate", "delete"].includes(action) ? action : "";
}

async function deleteSessionsForUser(env, userId, keepSessionId = null) {
  const sessionsResult = await env.DB.prepare(`
    SELECT
      session_id
    FROM sessions
    WHERE user_id = ?
  `)
    .bind(userId)
    .all();

  let sessionIds = (Array.isArray(sessionsResult?.results) ? sessionsResult.results : [])
    .map((row) => Number(row.session_id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (keepSessionId) {
    sessionIds = sessionIds.filter((id) => id !== keepSessionId);
  }

  if (!sessionIds.length) {
    return 0;
  }

  const placeholders = sessionIds.map(() => "?").join(", ");

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE session_id IN (${placeholders})
  `)
    .bind(...sessionIds)
    .run();

  return sessionIds.length;
}

async function countActiveAdmins(env) {
  const row = await env.DB.prepare(`
    SELECT
      SUM(CASE
        WHEN LOWER(COALESCE(role, '')) = 'admin'
         AND COALESCE(is_active, 0) = 1
        THEN 1 ELSE 0
      END) AS active_admin_users
    FROM users
  `).first();

  return Number(row?.active_admin_users || 0);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const adminUser = await resolveSessionUser(request, env.DB || env.DD_DB, { requireAdmin: true });

  if (!adminUser) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const user_id = Number(body.user_id);
  const action = normalizeAction(body.action);
  const clear_sessions = body.clear_sessions !== false;
  const permanent_confirm = !!body.permanent_confirm;

  if (!Number.isInteger(user_id) || user_id <= 0) {
    return json({ ok: false, error: "A valid user_id is required." }, 400);
  }

  if (!action) {
    return json({ ok: false, error: "Action must be deactivate or delete." }, 400);
  }

  if (action === "delete" && !permanent_confirm) {
    return json({ ok: false, error: "Permanent delete confirmation is required." }, 400);
  }

  const stepUp = await requireAdminStepUp(request, env, adminUser, body, `user ${action}`);
  if (!stepUp.ok) return stepUp.response;

  const targetUser = await env.DB.prepare(`
    SELECT
      user_id,
      email,
      display_name,
      role,
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE user_id = ?
    LIMIT 1
  `)
    .bind(user_id)
    .first();

  if (!targetUser) {
    return json({ ok: false, error: "User not found." }, 404);
  }

  const targetRole = String(targetUser.role || "").toLowerCase();
  const targetIsActive = Number(targetUser.is_active || 0) === 1;
  const isSelf = user_id === adminUser.user_id;

  if (isSelf && action === "delete") {
    return json({ ok: false, error: "You cannot permanently delete your own account." }, 400);
  }

  if (isSelf && action === "deactivate") {
    return json({ ok: false, error: "You cannot deactivate your own account." }, 400);
  }

  const activeAdminUsers = await countActiveAdmins(env);

  if (targetRole === "admin" && targetIsActive) {
    if (activeAdminUsers <= 1 && (action === "deactivate" || action === "delete")) {
      return json({
        ok: false,
        error: "You cannot remove the last active admin account."
      }, 400);
    }
  }

  let deleted_sessions = 0;

  if (action === "deactivate") {
    await env.DB.prepare(`
      UPDATE users
      SET
        is_active = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `)
      .bind(user_id)
      .run();

    if (clear_sessions) {
      deleted_sessions = await deleteSessionsForUser(env, user_id, null);
    }

    const updatedUser = await env.DB.prepare(`
      SELECT
        user_id,
        email,
        display_name,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE user_id = ?
      LIMIT 1
    `)
      .bind(user_id)
      .first();

    await auditAdminAction(env, request, adminUser, { action_type: 'user_deactivate', target_type: 'user', target_id: user_id, target_key: targetUser.email || String(user_id), details: { clear_sessions, deleted_sessions } });

    return json({
      ok: true,
      message: "User deactivated successfully.",
      action: "deactivate",
      deleted_sessions,
      user: {
        user_id: Number(updatedUser?.user_id || user_id || 0),
        email: updatedUser?.email || "",
        display_name: updatedUser?.display_name || "",
        role: updatedUser?.role || targetRole || "member",
        is_active: Number(updatedUser?.is_active || 0),
        created_at: updatedUser?.created_at || null,
        updated_at: updatedUser?.updated_at || null
      },
      performed_by: {
        user_id: adminUser.user_id,
        email: adminUser.email,
        display_name: adminUser.display_name
      }
    });
  }

  if (clear_sessions) {
    deleted_sessions = await deleteSessionsForUser(env, user_id, null);
  }

  await env.DB.prepare(`
    DELETE FROM user_access_tiers
    WHERE user_id = ?
  `)
    .bind(user_id)
    .run();

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE user_id = ?
  `)
    .bind(user_id)
    .run();

  await env.DB.prepare(`
    DELETE FROM users
    WHERE user_id = ?
  `)
    .bind(user_id)
    .run();

  await auditAdminAction(env, request, adminUser, { action_type: 'user_delete', target_type: 'user', target_id: user_id, target_key: targetUser.email || String(user_id), details: { clear_sessions, deleted_sessions } });

  return json({
    ok: true,
    message: "User deleted successfully.",
    action: "delete",
    deleted_sessions,
    user: {
      user_id: Number(targetUser.user_id || user_id || 0),
      email: targetUser.email || "",
      display_name: targetUser.display_name || "",
      role: targetUser.role || "member",
      is_active: Number(targetUser.is_active || 0),
      created_at: targetUser.created_at || null,
      updated_at: targetUser.updated_at || null
    },
    performed_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    }
  });
}
