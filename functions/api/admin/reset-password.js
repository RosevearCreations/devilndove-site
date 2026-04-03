// File: /functions/api/admin/reset-password.js

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";
import { formatStoredPasswordHashFromPlaintext } from "../_lib/passwordHash.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Unauthorized." }, 401);

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400); }

  const stepUp = await requireAdminStepUp(request, env, adminUser, { confirm_password: body.admin_confirm_password || body.confirm_password }, 'password reset');
  if (!stepUp.ok) return stepUp.response;

  const targetEmail = normalizeText(body.target_email).toLowerCase();
  let userId = Number(body.user_id || 0);
  const new_password = String(body.new_password || "");
  const confirm_password = String(body.password_confirm || body.confirm_password_new || body.new_password_confirm || "");
  const clear_sessions = body.clear_sessions !== false;

  if (!userId && !targetEmail) return jsonResponse({ ok:false, error:'A valid user_id or target_email is required.' }, 400);
  if (!new_password) return jsonResponse({ ok:false, error:'New password is required.' }, 400);
  if (new_password.length < 8) return jsonResponse({ ok:false, error:'New password must be at least 8 characters.' }, 400);
  if (new_password !== confirm_password) return jsonResponse({ ok:false, error:'Passwords do not match.' }, 400);

  let targetUser = null;
  if (userId > 0) {
    targetUser = await db.prepare(`SELECT user_id, email, display_name, role, is_active, created_at, updated_at FROM users WHERE user_id = ? LIMIT 1`).bind(userId).first();
  }
  if (!targetUser && targetEmail) {
    targetUser = await db.prepare(`SELECT user_id, email, display_name, role, is_active, created_at, updated_at FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`).bind(targetEmail).first();
    userId = Number(targetUser?.user_id || 0);
  }
  if (!targetUser || userId <= 0) return jsonResponse({ ok:false, error:'User not found.' }, 404);

  const password_hash = await formatStoredPasswordHashFromPlaintext(new_password);
  await db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).bind(password_hash, userId).run();

  let deleted_sessions = 0;
  if (clear_sessions) {
    const sessionsResult = await db.prepare(`SELECT session_id FROM sessions WHERE user_id = ?`).bind(userId).all();
    let sessionIds = (Array.isArray(sessionsResult?.results) ? sessionsResult.results : []).map((row) => Number(row.session_id)).filter((id) => Number.isInteger(id) && id > 0);
    if (userId === Number(adminUser.user_id || 0)) sessionIds = sessionIds.filter((id) => id !== Number(adminUser.session_id || 0));
    if (sessionIds.length) {
      const placeholders = sessionIds.map(() => '?').join(', ');
      await db.prepare(`DELETE FROM sessions WHERE session_id IN (${placeholders})`).bind(...sessionIds).run();
      deleted_sessions = sessionIds.length;
    }
  }

  await auditAdminAction(env, request, adminUser, {
    action_type:'admin_password_reset',
    target_type:'user',
    target_id:userId,
    target_key: targetUser.email || String(userId),
    details:{ clear_sessions, target_role: targetUser.role || 'member' }
  });

  const updatedUser = await db.prepare(`SELECT user_id, email, display_name, role, is_active, created_at, updated_at FROM users WHERE user_id = ? LIMIT 1`).bind(userId).first();
  return jsonResponse({ ok:true, message:'Password reset successfully.', user:{ user_id:Number(updatedUser?.user_id||userId||0), email:updatedUser?.email||'', display_name:updatedUser?.display_name||'', role:updatedUser?.role||'member', is_active:Number(updatedUser?.is_active||0), created_at:updatedUser?.created_at||null, updated_at:updatedUser?.updated_at||null }, sessions:{ cleared_other_sessions: Boolean(clear_sessions), deleted_sessions } });
}
