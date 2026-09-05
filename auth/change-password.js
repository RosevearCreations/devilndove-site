// File: /functions/api/auth/change-password.js
// Release 467 Build 58: verifies either current or legacy hashes, writes only the current salted format,
// and returns structured JSON for unexpected runtime/D1 failures.
import {
  PASSWORD_HASH_SCHEME,
  formatStoredPasswordHashFromPlaintext,
  verifyStoredPasswordHash
} from '../_lib/passwordHash.js';

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" } }); }
function compactError(error) { return String(error?.message || error || '').trim().replace(/\s+/g, ' ').slice(0, 300); }
function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const db = env.DB || env.DD_DB;
    if (!db) return json({ ok:false,error:"Password change is temporarily unavailable.",code:"AUTH_CHANGE_PASSWORD_DB_UNAVAILABLE",hint:"Check the current D1 binding in I.T. readiness." },503);
    const token = getBearerToken(request);
    if (!token) return json({ ok:false,error:"Unauthorized." },401);

    const sessionUser = await db.prepare(`
      SELECT s.session_id,s.user_id,s.session_token,s.token,s.expires_at,
        u.user_id AS resolved_user_id,u.email,u.password_hash,u.display_name,u.role,u.is_active,u.created_at,u.updated_at
      FROM sessions s INNER JOIN users u ON u.user_id=s.user_id
      WHERE (s.session_token=? OR s.token=?) AND s.expires_at>datetime('now') LIMIT 1
    `).bind(token,token).first();
    if (!sessionUser) return json({ ok:false,error:"Invalid or expired session." },401);
    if (Number(sessionUser.is_active || 0) !== 1) return json({ ok:false,error:"Account is inactive." },403);

    let body; try { body = await request.json(); } catch { return json({ ok:false,error:"Invalid JSON body." },400); }
    const current_password = String(body.current_password || "");
    const new_password = String(body.new_password || "");
    if (!current_password) return json({ ok:false,error:"Current password is required." },400);
    if (!new_password) return json({ ok:false,error:"New password is required." },400);
    if (new_password.length < 8) return json({ ok:false,error:"New password must be at least 8 characters." },400);
    if (!(await verifyStoredPasswordHash(current_password,sessionUser.password_hash))) return json({ ok:false,error:"Current password is incorrect.",code:"AUTH_CURRENT_PASSWORD_INCORRECT" },400);
    if (await verifyStoredPasswordHash(new_password,sessionUser.password_hash)) return json({ ok:false,error:"New password must be different from the current password." },400);

    const new_password_hash = await formatStoredPasswordHashFromPlaintext(new_password);
    const userId = Number(sessionUser.resolved_user_id || sessionUser.user_id || 0);
    await db.prepare(`UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(new_password_hash,userId).run();
    const updatedUser = await db.prepare(`SELECT user_id,email,display_name,role,is_active,created_at,updated_at FROM users WHERE user_id=? LIMIT 1`).bind(userId).first();
    return json({ ok:true,message:"Password changed successfully.",credential_hash_scheme:PASSWORD_HASH_SCHEME,user:{ user_id:Number(updatedUser?.user_id || userId || 0),email:updatedUser?.email || sessionUser.email || "",display_name:updatedUser?.display_name || sessionUser.display_name || "",role:updatedUser?.role || sessionUser.role || "member",is_active:Number(updatedUser?.is_active || sessionUser.is_active || 0),created_at:updatedUser?.created_at || null,updated_at:updatedUser?.updated_at || null } });
  } catch (error) {
    const detail = compactError(error);
    console.error('[auth/change-password]', detail);
    return json({ ok:false,error:"Password change is temporarily unavailable.",code:"AUTH_CHANGE_PASSWORD_FAILED",hint:"Check the current users/session D1 schema and I.T. runtime diagnostics.",detail },503);
  }
}
