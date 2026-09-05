// Release 467 Build 60 — administrator password reset against the live D1 users/sessions authority.
// No request-time DDL; optional timestamp/token columns are handled compatibly.
import { auditAdminAction } from '../_lib/adminAudit.js';
import { PASSWORD_HASH_SCHEME, formatStoredPasswordHashFromPlaintext } from '../_lib/passwordHash.js';
import { readUserById, resolveSessionUser, updateUserPasswordCompatible } from '../_lib/accountAuthCompat.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}
function compactError(error){return String(error?.message||error||'').trim().replace(/\s+/g,' ').slice(0,300);}

export async function onRequestPost(context){
 const {request,env}=context;
 try{
  const db=env.DB||env.DD_DB;if(!db)return json({ok:false,error:'Password reset is temporarily unavailable.',code:'ADMIN_RESET_PASSWORD_DB_UNAVAILABLE',hint:'Check the Production D1 binding named DB in I.T. readiness.'},503);
  const adminUser=await resolveSessionUser(request,db,{requireAdmin:true});if(!adminUser)return json({ok:false,error:'Unauthorized.'},401);
  let body;try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const user_id=Number(body.user_id);const new_password=String(body.new_password||'');const confirm_password=String(body.confirm_password||'');const clear_sessions=body.clear_sessions!==false;
  if(!Number.isInteger(user_id)||user_id<=0)return json({ok:false,error:'A valid user_id is required.'},400);if(!new_password)return json({ok:false,error:'New password is required.'},400);if(new_password.length<8)return json({ok:false,error:'New password must be at least 8 characters.'},400);if(new_password!==confirm_password)return json({ok:false,error:'Passwords do not match.'},400);
  const targetUser=await readUserById(db,user_id);if(!targetUser)return json({ok:false,error:'User not found.'},404);
  const password_hash=await formatStoredPasswordHashFromPlaintext(new_password);
  await updateUserPasswordCompatible(db,user_id,password_hash);
  let deleted_sessions=0;
  if(clear_sessions){const result=await db.prepare(`SELECT session_id FROM sessions WHERE user_id=?`).bind(user_id).all();let ids=(Array.isArray(result?.results)?result.results:[]).map(r=>Number(r.session_id)).filter(id=>Number.isInteger(id)&&id>0);if(user_id===Number(adminUser.user_id||0))ids=ids.filter(id=>id!==Number(adminUser.session_id||0));if(ids.length){const placeholders=ids.map(()=>'?').join(', ');await db.prepare(`DELETE FROM sessions WHERE session_id IN (${placeholders})`).bind(...ids).run();deleted_sessions=ids.length;}}
  const updatedUser=await readUserById(db,user_id);
  await auditAdminAction(env,request,adminUser,{action_type:'admin_user_password_reset',target_type:'user',target_id:user_id,target_key:updatedUser?.email||targetUser.email||String(user_id),details:{clear_other_sessions:clear_sessions,deleted_sessions,password_value_emitted:false,password_hash_emitted:false,existing_password_required:false,password_hash_scheme:PASSWORD_HASH_SCHEME}});
  return json({ok:true,message:'Password reset successfully.',reset_by:{user_id:Number(adminUser.user_id||0),email:adminUser.email||'',display_name:adminUser.display_name||''},user:{user_id:Number(updatedUser?.user_id||user_id||0),email:updatedUser?.email||'',display_name:updatedUser?.display_name||'',role:updatedUser?.role||'member',is_active:Number(updatedUser?.is_active||0),created_at:updatedUser?.created_at||null,updated_at:updatedUser?.updated_at||null},sessions:{cleared_other_sessions:!!clear_sessions,deleted_sessions},security:{existing_password_required:false,password_value_emitted:false,password_hash_emitted:false,password_hash_scheme:PASSWORD_HASH_SCHEME}});
 }catch(error){
  const detail=compactError(error);console.error('[admin/reset-password]',detail);
  return json({ok:false,error:'Password reset is temporarily unavailable.',code:'ADMIN_RESET_PASSWORD_FAILED',hint:'Production must expose live users/sessions tables through the DB binding; share this detail if the hotfix still fails.',detail},503);
 }
}
