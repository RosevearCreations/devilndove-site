// Release 467 Build 31 — administrator password reset authority.
// Admin may replace a user's password without the user's existing password. Plaintext values are never returned or audited.
import { auditAdminAction } from '../_lib/adminAudit.js';
import { PASSWORD_HASH_SCHEME, formatStoredPasswordHashFromPlaintext } from '../_lib/passwordHash.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});}
function getBearerToken(request){const h=request.headers.get("Authorization")||"";const m=h.match(/^Bearer\s+(.+)$/i);return m?String(m[1]||"").trim():"";}
async function getAdminUserFromRequest(request,env){
 const token=getBearerToken(request);if(!token)return null;
 const s=await env.DB.prepare(`SELECT s.session_id,s.user_id,s.session_token,s.token,s.expires_at,u.user_id AS resolved_user_id,u.email,u.display_name,u.role,u.is_active FROM sessions s INNER JOIN users u ON u.user_id=s.user_id WHERE (s.session_token=? OR s.token=?) AND s.expires_at>datetime('now') LIMIT 1`).bind(token,token).first();
 if(!s||Number(s.is_active||0)!==1||String(s.role||'').toLowerCase()!=='admin')return null;
 return {session_id:Number(s.session_id||0),user_id:Number(s.resolved_user_id||s.user_id||0),email:s.email||'',display_name:s.display_name||'',role:s.role||'admin'};
}

export async function onRequestPost(context){
 const {request,env}=context;const adminUser=await getAdminUserFromRequest(request,env);if(!adminUser)return json({ok:false,error:'Unauthorized.'},401);
 let body;try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
 const user_id=Number(body.user_id);const new_password=String(body.new_password||'');const confirm_password=String(body.confirm_password||'');const clear_sessions=body.clear_sessions!==false;
 if(!Number.isInteger(user_id)||user_id<=0)return json({ok:false,error:'A valid user_id is required.'},400);if(!new_password)return json({ok:false,error:'New password is required.'},400);if(new_password.length<8)return json({ok:false,error:'New password must be at least 8 characters.'},400);if(new_password!==confirm_password)return json({ok:false,error:'Passwords do not match.'},400);
 const targetUser=await env.DB.prepare(`SELECT user_id,email,display_name,role,is_active,created_at,updated_at FROM users WHERE user_id=? LIMIT 1`).bind(user_id).first();if(!targetUser)return json({ok:false,error:'User not found.'},404);
 const password_hash=await formatStoredPasswordHashFromPlaintext(new_password);
 await env.DB.prepare(`UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(password_hash,user_id).run();
 let deleted_sessions=0;
 if(clear_sessions){const result=await env.DB.prepare(`SELECT session_id FROM sessions WHERE user_id=?`).bind(user_id).all();let ids=(Array.isArray(result?.results)?result.results:[]).map(r=>Number(r.session_id)).filter(id=>Number.isInteger(id)&&id>0);if(user_id===adminUser.user_id)ids=ids.filter(id=>id!==adminUser.session_id);if(ids.length){const placeholders=ids.map(()=>'?').join(', ');await env.DB.prepare(`DELETE FROM sessions WHERE session_id IN (${placeholders})`).bind(...ids).run();deleted_sessions=ids.length;}}
 const updatedUser=await env.DB.prepare(`SELECT user_id,email,display_name,role,is_active,created_at,updated_at FROM users WHERE user_id=? LIMIT 1`).bind(user_id).first();
 await auditAdminAction(env,request,adminUser,{action_type:'admin_user_password_reset',target_type:'user',target_id:user_id,target_key:updatedUser?.email||targetUser.email||String(user_id),details:{clear_other_sessions:clear_sessions,deleted_sessions,password_value_emitted:false,password_hash_emitted:false,existing_password_required:false,password_hash_scheme:PASSWORD_HASH_SCHEME}});
 return json({ok:true,message:'Password reset successfully.',reset_by:{user_id:adminUser.user_id,email:adminUser.email,display_name:adminUser.display_name},user:{user_id:Number(updatedUser?.user_id||user_id||0),email:updatedUser?.email||'',display_name:updatedUser?.display_name||'',role:updatedUser?.role||'member',is_active:Number(updatedUser?.is_active||0),created_at:updatedUser?.created_at||null,updated_at:updatedUser?.updated_at||null},sessions:{cleared_other_sessions:!!clear_sessions,deleted_sessions},security:{existing_password_required:false,password_value_emitted:false,password_hash_emitted:false,password_hash_scheme:PASSWORD_HASH_SCHEME}});
}
