// Build 736 — original owner-consented inbox receipt, provider acceptance != delivered.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {providerReady734} from '../auth/recovery-734.js';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validCode=/^[0-9A-F]{32}$/;
const htmlEscape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function reply(status,body){return jsonResponse({build:736,ok:status===200,
  no_auto_send:true,customer_recovery_email_pilot:false,external_customer_inbox_verified:false,
  master_privacy_sending_authorized:false,...body},status,headers);}
const hash=async value=>{
 const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
};
const newCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),
 n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
const cleanEmail=s=>String(s||'').trim().toLowerCase();
const adminSource=c=>{
 const user=verifiedAdminFromModule(c),db=getDb(c.env||{});
 return {user,db};
};
const sameOrigin=request=>{
 const origin=request.headers.get('Origin'),site=request.headers.get('Sec-Fetch-Site');
 return origin===new URL(request.url).origin&&(!site||site==='same-origin');
};
const validAdminEmail=user=>/^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(cleanEmail(user?.email))&&cleanEmail(user.email).length<=254;
function selectedFrom(env={}){
 return String(env.NOTIFICATION_FROM_EMAIL||env.RESEND_FROM_EMAIL||env.SUPPORT_FROM_EMAIL||'').trim();
}
async function sendOwnerChallenge(env,to,code,pilotId){
 if(!providerReady734(env))return null;
 const html='<p>Devil n Dove recovery email inbox pilot</p>'+
  '<p>An administrator explicitly requested this verification for their own registered email.</p>'+
  '<p>Copy the following code into the protected Admin screen within 15 minutes:</p>'+
  '<p style="font-family:monospace;font-size:18px"><strong>'+htmlEscape(code)+'</strong></p>'+
  '<p>Do not share the code. It does not reset a password, authorize customer email or activate privacy delivery.</p>';
 try{
  const res=await fetch('https://api.resend.com/emails',{method:'POST',
   headers:{Authorization:'Bearer '+String(env.RESEND_API_KEY),'Content-Type':'application/json',
    'Idempotency-Key':'dnd-owner-inbox-'+pilotId},
   body:JSON.stringify({from:selectedFrom(env),to:[to],
    subject:'Devil n Dove — owner inbox verification code',html}),
   signal:AbortSignal.timeout(8500)});
  if(!res.ok)return null;
  const d=await res.json().catch(()=>null);
  return typeof d?.id==='string'&&d.id.length>=8&&d.id.length<=256?d.id:null;
 }catch{return null;}
}
export async function onRequestGet(c){
 const {user,db}=adminSource(c);
 if(!user)return reply(401,{status:'HOLD_VERIFIED_ADMIN_REQUIRED'});
 if(!db)return reply(503,{status:'HOLD_ORIGINAL_D1_UNAVAILABLE'});
 try{
  const row=await db.prepare(`SELECT pilot_id,created_at,expires_at,provider_accepted_at,
    inbox_confirmed_at,invalidated_at,failed_attempts
    FROM dnd_recovery_inbox_pilots_736 WHERE admin_user_id=?
    ORDER BY created_at DESC,pilot_id DESC LIMIT 1`).bind(user.user_id).first();
  const configured=providerReady734(c.env||{});
  const status=!row?'HOLD_NOT_YET_OWNER_REQUESTED':
   row.inbox_confirmed_at?'ORIGINAL_OWNER_INBOX_CODE_CONFIRMED':
   row.invalidated_at?'HOLD_PROVIDER_NOT_CONFIRMED':
   !row.provider_accepted_at?'HOLD_PROVIDER_ACCEPTANCE_PENDING':
   Date.parse(String(row.expires_at||'').replace(' ','T')+'Z')<=Date.now()?
     'HOLD_OWNER_PILOT_EXPIRED':'AWAITING_OWNER_INBOX_CODE';
  return reply(200,{status,provider_configuration_present:configured,
   provider_api_acceptance_observed:!!row?.provider_accepted_at,
   provider_delivered_webhook_verified:false,owner_inbox_code_confirmed:!!row?.inbox_confirmed_at,
   original_pilot_id:row?.pilot_id||null,
   original_created_at:row?.created_at||null,
   original_expires_at:row?.expires_at||null,
   wrong_code_attempts:row?.failed_attempts??0,
   recipient_is_current_authenticated_admin_only:true,
   manual_owner_consent_required:true,no_email_sent_by_status_read:true,
   actual_customer_reset_delivery_verified:false,
   scope:'ORIGINAL_CONSENTED_ADMIN_INBOX_ONLY'});
 }catch{return reply(503,{status:'HOLD_ORIGINAL_PILOT_SCHEMA_OR_READBACK'});}
}
export async function onRequestPost(c){
 const {user,db}=adminSource(c);
 if(!user)return reply(401,{status:'HOLD_VERIFIED_ADMIN_REQUIRED'});
 if(!db)return reply(503,{status:'HOLD_ORIGINAL_D1_UNAVAILABLE'});
 if(!sameOrigin(c.request))return reply(403,{status:'HOLD_CROSS_ORIGIN_OR_CSRF'});
 if(!String(c.request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))
  return reply(415,{status:'HOLD_JSON_REQUIRED'});
 if(Number(c.request.headers.get('Content-Length')||0)>1024)
  return reply(413,{status:'HOLD_BODY_TOO_LARGE'});
 let body;try{body=await c.request.json();}catch{return reply(400,{status:'HOLD_INVALID_BODY'});}
 if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>950)
  return reply(400,{status:'HOLD_BODY_TOO_LARGE'});
 const action=String(body.action||'');
 if(action==='start'){
  if(body.consent_confirmed!==true||body.purpose!=='OWNER_REGISTERED_INBOX_PILOT')
   return reply(403,{status:'HOLD_EXPLICIT_OWNER_INBOX_CONSENT_REQUIRED'});
  if(!validAdminEmail(user))return reply(409,{status:'HOLD_ORIGINAL_ADMIN_EMAIL_REQUIRED'});
  if(!providerReady734(c.env||{}))return reply(503,{status:'HOLD_RESEND_CONFIG_NOT_VERIFIED'});
  const pilot=crypto.randomUUID(),code=newCode(),address=cleanEmail(user.email);
  const digest=await hash('dnd-736-inbox-code:'+code);
  const destination=await hash('dnd-736-owner-mail:'+address);
  try{
   const created=await db.prepare(`INSERT INTO dnd_recovery_inbox_pilots_736
    (pilot_id,admin_user_id,recipient_sha256,code_sha256,expires_at)
    SELECT ?,?,?,?,datetime('now','+15 minutes')
    WHERE (SELECT COUNT(*) FROM dnd_recovery_inbox_pilots_736
     WHERE admin_user_id=? AND created_at>=datetime('now','-1 day'))<2`)
    .bind(pilot,user.user_id,destination,digest,user.user_id).run();
   if(Number(created?.meta?.changes)!==1)
    return reply(429,{status:'HOLD_OWNER_PILOT_DAILY_LIMIT'});
   // The only mail operation is this explicitly requested, consented POST.
   const receipt=await sendOwnerChallenge(c.env,address,code,pilot);
   if(!receipt){
    await db.prepare(`UPDATE dnd_recovery_inbox_pilots_736
     SET invalidated_at=CURRENT_TIMESTAMP WHERE pilot_id=?
     AND admin_user_id=? AND provider_accepted_at IS NULL AND invalidated_at IS NULL`)
     .bind(pilot,user.user_id).run();
    return reply(503,{status:'HOLD_RESEND_PROVIDER_ACCEPTANCE_UNCONFIRMED'});
   }
   const receiptSha=await hash('dnd-736-resend-receipt:'+receipt);
   const accepted=await db.prepare(`UPDATE dnd_recovery_inbox_pilots_736
    SET provider_accepted_at=CURRENT_TIMESTAMP,provider_message_sha256=?
    WHERE pilot_id=? AND admin_user_id=? AND invalidated_at IS NULL
    AND provider_accepted_at IS NULL AND expires_at>datetime('now')`)
    .bind(receiptSha,pilot,user.user_id).run();
   if(Number(accepted?.meta?.changes)!==1)return reply(503,{status:'HOLD_PROVIDER_D1_CUSTODY_READBACK'});
   return reply(200,{status:'PROVIDER_ACCEPTED_AWAITING_OWNER_INBOX_CODE',
    original_pilot_id:pilot,original_expires_in_minutes:15,
    provider_api_acceptance_observed:true,provider_delivered_webhook_verified:false,
    owner_inbox_code_confirmed:false,recipient_is_current_authenticated_admin_only:true});
  }catch{return reply(503,{status:'HOLD_ORIGINAL_PILOT_D1_OR_PROVIDER_FAILURE'});}
 }
 if(action==='confirm'){
  const id=String(body.pilot_id||''),code=String(body.code||'').trim().toUpperCase();
  if(!uuid.test(id)||!validCode.test(code))return reply(400,{status:'HOLD_INVALID_PILOT_CODE'});
  const digest=await hash('dnd-736-inbox-code:'+code);
  try{
   // Confirmation requires actual emailed code, explicit Admin identity, original
   // provider acceptance and an unexpired single-use source receipt.
   const matched=await db.prepare(`UPDATE dnd_recovery_inbox_pilots_736
    SET inbox_confirmed_at=CURRENT_TIMESTAMP
    WHERE pilot_id=? AND admin_user_id=? AND code_sha256=?
    AND provider_accepted_at IS NOT NULL AND inbox_confirmed_at IS NULL
    AND invalidated_at IS NULL AND expires_at>datetime('now')
    AND failed_attempts<5`).bind(id,user.user_id,digest).run();
   if(Number(matched?.meta?.changes)===1){
    const read=await db.prepare(`SELECT pilot_id,inbox_confirmed_at
     FROM dnd_recovery_inbox_pilots_736 WHERE pilot_id=? AND admin_user_id=?`)
     .bind(id,user.user_id).first();
    if(read?.inbox_confirmed_at)return reply(200,{
     status:'ORIGINAL_OWNER_INBOX_CODE_CONFIRMED',
     owner_inbox_code_confirmed:true,provider_api_acceptance_observed:true,
     provider_delivered_webhook_verified:false,
     actual_customer_reset_delivery_verified:false,
     customer_recovery_email_pilot:false});
   }
   await db.prepare(`UPDATE dnd_recovery_inbox_pilots_736
    SET failed_attempts=failed_attempts+1
    WHERE pilot_id=? AND admin_user_id=? AND inbox_confirmed_at IS NULL
    AND invalidated_at IS NULL AND expires_at>datetime('now')
    AND failed_attempts<5`).bind(id,user.user_id).run();
   return reply(409,{status:'HOLD_CODE_INVALID_USED_EXPIRED_OR_NOT_ACCEPTED'});
  }catch{return reply(503,{status:'HOLD_ORIGINAL_INBOX_CONFIRMATION_D1_FAILURE'});}
 }
 return reply(400,{status:'HOLD_UNKNOWN_PILOT_ACTION'});
}
