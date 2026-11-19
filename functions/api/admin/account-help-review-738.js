// Build 738. Original D1, verified Admin-only, privacy-safe account-help review.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const allowed=['open','reviewed','resolved','closed'];
const transitions={mark_reviewed:['open','reviewed'],close_request:['reviewed','closed']};
const reply=(code,status=200,rest={})=>jsonResponse({ok:status===200,build:738,code,
 account_identity_verified:false,alternate_email_credential_delivery:false,
 automatic_email_sent:false,customer_password_changed:false,...rest},status,
 {'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
const valid=id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&Number(id)<=2147483647;
const privateContext=c=>({admin:verifiedAdminFromModule(c),db:getDb(c.env||{})});
const masked=s=>{const v=String(s||''),at=v.lastIndexOf('@');
 return at>0?v[0]+'***'+v.slice(at):'[not supplied]';};
export async function onRequestGet(c){
 const {admin,db}=privateContext(c);
 if(!admin)return reply('VERIFIED_ADMIN_REQUIRED',401);
 if(!db)return reply('ORIGINAL_D1_UNAVAILABLE',503);
 const url=new URL(c.request.url),id=url.searchParams.get('id');
 try{
  if(id!==null){
   if(!valid(id))return reply('INVALID_CASE_ID',400);
   const row=await db.prepare(`SELECT auth_recovery_request_id,request_type,contact_email,
    possible_email,display_name,note,status,created_at,updated_at
    FROM auth_recovery_requests WHERE auth_recovery_request_id=? LIMIT 1`)
    .bind(Number(id)).first();
   if(!row)return reply('CASE_NOT_FOUND',404);
   return reply('PRIVATE_SELECTED_CASE',200,{case:{
    id:Number(row.auth_recovery_request_id),type:row.request_type,
    contact_email:row.contact_email,possible_email:row.possible_email||'',
    display_name:row.display_name||'',note:row.note||'',
    status:row.status,created_at:row.created_at,updated_at:row.updated_at},
    visibility:'VERIFIED_ADMIN_ONLY',registered_account_matched:false});
  }
  const status=url.searchParams.get('status')||'open';
  const limit=Math.min(25,Math.max(1,Number(url.searchParams.get('limit'))||20));
  if(!allowed.includes(status))return reply('INVALID_FILTER',400);
  const rows=(await db.prepare(`SELECT auth_recovery_request_id,request_type,contact_email,
    status,created_at,updated_at FROM auth_recovery_requests
    WHERE status=? ORDER BY created_at DESC,auth_recovery_request_id DESC LIMIT ?`)
    .bind(status,limit).all())?.results||[];
  const totals=(await db.prepare(
    'SELECT status,COUNT(*) AS total FROM auth_recovery_requests GROUP BY status').all())?.results||[];
  return reply('ORIGINAL_PRIVATE_SUPPORT_QUEUE',200,{status,limit,
   counts:Object.fromEntries(totals.filter(x=>allowed.includes(x.status))
    .map(x=>[x.status,Number(x.total||0)])),
   cases:rows.map(x=>({id:Number(x.auth_recovery_request_id),type:x.request_type,
    contact_masked:masked(x.contact_email),status:x.status,
    created_at:x.created_at,updated_at:x.updated_at})),
   raw_contact_email_in_list:false,unverified_account_identity_disclosed:false});
 }catch{return reply('ORIGINAL_CASE_READ_FAILED',503);}
}
export async function onRequestPost(c){
 const {admin,db}=privateContext(c);
 if(!admin)return reply('VERIFIED_ADMIN_REQUIRED',401);
 if(!db||typeof db.batch!=='function')return reply('ORIGINAL_D1_UNAVAILABLE',503);
 const req=c.request,origin=new URL(req.url).origin,site=req.headers.get('Sec-Fetch-Site');
 if(req.headers.get('Origin')!==origin||(site&&site!=='same-origin'&&site!=='none'))
  return reply('SAME_ORIGIN_REQUIRED',403);
 if(Number(req.headers.get('Content-Length')||0)>1400)return reply('BODY_TOO_LARGE',413);
 let body;try{body=await req.json();}catch{return reply('INVALID_JSON',400);}
 if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>1200)
  return reply('INVALID_BODY',400);
 const action=String(body.action||''),flow=transitions[action],id=Number(body.case_id),
  reason=String(body.reason_code||'').trim().toUpperCase();
 if(!flow||!valid(id)||!/^[A-Z][A-Z0-9_]{3,39}$/.test(reason)||body.owner_review_confirmed!==true)
  return reply('EXPLICIT_REVIEW_AND_REASON_REQUIRED',400);
 try{
  const results=await db.batch([
   db.prepare(`UPDATE auth_recovery_requests SET status=?,updated_at=CURRENT_TIMESTAMP
    WHERE auth_recovery_request_id=? AND status=?`).bind(flow[1],id,flow[0]),
   db.prepare(`INSERT INTO admin_action_audit
    (actor_user_id,action_type,target_type,target_id,request_method,request_path,
     details_json,created_at)
    SELECT ?,'ACCOUNT_HELP_REVIEW_738','auth_recovery_request',?,
    'POST','/api/admin/account-help-review-738',?,CURRENT_TIMESTAMP
    WHERE changes()=1`).bind(Number(admin.user_id),id,JSON.stringify({
      action,reason_code:reason,from:flow[0],to:flow[1],
      account_identity_verified:false,alternate_email_authorized:false}))
  ]);
  if(Number(results?.[0]?.meta?.changes)!==1||Number(results?.[1]?.meta?.changes)!==1)
   return reply('CASE_STATE_CHANGED_OR_AUDIT_MISSING',409);
  return reply('STAFF_TRIAGE_RECORDED',200,{case_id:id,prior_status:flow[0],
   status:flow[1],original_audit_recorded:true,identity_confirmation_pending:true});
 }catch{return reply('TRIAGE_NOT_RECORDED',503);}
}
