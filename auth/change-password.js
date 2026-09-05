// File: /functions/api/auth/change-password.js
// Release 467 Build 60: verify/write passwords against the live D1 users/sessions authority
// without assuming optional legacy/current token or updated_at columns.
import {
  PASSWORD_HASH_SCHEME,
  formatStoredPasswordHashFromPlaintext,
  verifyStoredPasswordHash
} from '../_lib/passwordHash.js';
import { readUserById, resolveSessionUser, updateUserPasswordCompatible } from '../_lib/accountAuthCompat.js';

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" } }); }
function compactError(error) { return String(error?.message || error || '').trim().replace(/\s+/g, ' ').slice(0, 300); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const db = env.DB || env.DD_DB;
    if (!db) return json({ ok:false,error:"Password change is temporarily unavailable.",code:"AUTH_CHANGE_PASSWORD_DB_UNAVAILABLE",hint:"Check the Production D1 binding named DB in I.T. readiness." },503);
    const sessionUser = await resolveSessionUser(request,db,{includePassword:true});
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
    const userId = Number(sessionUser.user_id || sessionUser.session_user_id || 0);
    await updateUserPasswordCompatible(db,userId,new_password_hash);
    const updatedUser = await readUserById(db,userId);
    return json({ ok:true,message:"Password changed successfully.",credential_hash_scheme:PASSWORD_HASH_SCHEME,user:{ user_id:Number(updatedUser?.user_id || userId || 0),email:updatedUser?.email || sessionUser.email || "",display_name:updatedUser?.display_name || sessionUser.display_name || "",role:updatedUser?.role || sessionUser.role || "member",is_active:Number(updatedUser?.is_active || sessionUser.is_active || 0),created_at:updatedUser?.created_at || null,updated_at:updatedUser?.updated_at || null } });
  } catch (error) {
    const detail = compactError(error);
    console.error('[auth/change-password]', detail);
    return json({ ok:false,error:"Password change is temporarily unavailable.",code:"AUTH_CHANGE_PASSWORD_FAILED",hint:"Production must expose live users/sessions tables through the DB binding; share this detail if the hotfix still fails.",detail },503);
  }
}
