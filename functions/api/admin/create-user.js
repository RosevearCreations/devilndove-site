// File: /functions/api/admin/create-user.js
// Release 467 Build 60: administrator-created accounts use the live D1 users/sessions authority
// without assuming optional legacy/current columns. No request-time DDL is permitted.
import { PASSWORD_HASH_SCHEME, formatStoredPasswordHashFromPlaintext } from '../_lib/passwordHash.js';
import { createUserCompatible, readUserById, resolveSessionUser } from '../_lib/accountAuthCompat.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}
function normalizeText(value){return String(value||"").trim();}
function isValidEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||"").trim());}
function normalizeRole(value){const role=normalizeText(value).toLowerCase();return ["member","admin"].includes(role)?role:"";}
function normalizeIsActive(value){if(value===true||value===1||value==="1")return 1;if(value===false||value===0||value==="0")return 0;return 0;}
function compactError(error){return normalizeText(error?.message||error).replace(/\s+/g,' ').slice(0,300);}

export async function onRequestPost(context){
 const {request,env}=context;
 try{
  const db=env.DB||env.DD_DB;if(!db)return json({ok:false,error:"User creation is temporarily unavailable.",code:"ADMIN_CREATE_USER_DB_UNAVAILABLE",hint:"Check the Production D1 binding named DB in I.T. readiness."},503);
  const adminUser=await resolveSessionUser(request,db,{requireAdmin:true});if(!adminUser)return json({ok:false,error:"Unauthorized."},401);
  let body;try{body=await request.json();}catch{return json({ok:false,error:"Invalid JSON body."},400);}
  const email=normalizeText(body.email).toLowerCase();const display_name=normalizeText(body.display_name||body.name);const password=String(body.password||"");const confirm_password=String(body.confirm_password||body.password_confirm||"");const role=normalizeRole(body.role);const is_active=normalizeIsActive(body.is_active);
  if(!email)return json({ok:false,error:"Email is required."},400);if(!isValidEmail(email))return json({ok:false,error:"A valid email is required."},400);if(!password)return json({ok:false,error:"Password is required."},400);if(password.length<8)return json({ok:false,error:"Password must be at least 8 characters."},400);if(password!==confirm_password)return json({ok:false,error:"Passwords do not match."},400);if(!role)return json({ok:false,error:"Role must be member or admin."},400);
  const existing=await db.prepare(`SELECT user_id,email FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1`).bind(email).first();if(existing)return json({ok:false,error:"An account with this email already exists."},409);
  const password_hash=await formatStoredPasswordHashFromPlaintext(password);
  const user_id=await createUserCompatible(db,{email,password_hash,display_name,role,is_active});
  if(!user_id)return json({ok:false,error:"User could not be created.",code:"ADMIN_CREATE_USER_INSERT_NO_ID"},500);
  const user=await readUserById(db,user_id);
  return json({ok:true,message:"User created successfully.",credential_hash_scheme:PASSWORD_HASH_SCHEME,created_by:{user_id:Number(adminUser.user_id||0),email:adminUser.email||"",display_name:adminUser.display_name||""},user:{user_id:Number(user?.user_id||user_id||0),email:user?.email||email,display_name:user?.display_name||"",role:user?.role||role,is_active:Number(user?.is_active??is_active),created_at:user?.created_at||null,updated_at:user?.updated_at||null}},201);
 }catch(error){
  const detail=compactError(error);console.error('[admin/create-user]',detail);
  if(/UNIQUE constraint failed:\s*users\.email/i.test(detail))return json({ok:false,error:"An account with this email already exists.",code:"ADMIN_CREATE_USER_DUPLICATE"},409);
  return json({ok:false,error:"User creation is temporarily unavailable.",code:"ADMIN_CREATE_USER_FAILED",hint:"Production must expose live users/sessions tables through the DB binding; share this detail if the hotfix still fails.",detail},503);
 }
}
