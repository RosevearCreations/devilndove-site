// Build 738: non-enumerating account support intake. No account lookup or automatic email.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
const generic='Your request has been recorded for private staff review. For privacy, we do not confirm whether a matching account exists.';
const reply=(status,code,extra={})=>jsonResponse({ok:status===202,code,
 message:status===202?generic:undefined,...extra},status,
 {'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
const email=s=>String(s||'').trim().toLowerCase();
const validEmail=s=>s.length<=254&&/^[^\\s@]{1,64}@[^\\s@]+\\.[^\\s@]+$/.test(s);
const safeText=(s,max)=>String(s||'').trim().slice(0,max);
export async function onRequestPost({request,env}){
 const origin=new URL(request.url).origin,site=request.headers.get('Sec-Fetch-Site');
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==origin)
  return reply(403,'ORIGIN_DENIED');
 if(site&&site!=='same-origin'&&site!=='none')return reply(403,'SITE_DENIED');
 if(Number(request.headers.get('Content-Length')||0)>2200)
  return reply(413,'REQUEST_TOO_LARGE');
 let body;try{body=await request.json();}catch{return reply(400,'INVALID_JSON');}
 if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>2000)
  return reply(400,'INVALID_BODY');
 if(body.request_type!=='forgot_email')return reply(400,'UNSUPPORTED_REQUEST');
 const contact=email(body.contact_email),possible=email(body.possible_email),
  name=safeText(body.display_name,120),note=safeText(body.note,900);
 if(!validEmail(contact)||(possible&&!validEmail(possible)))
  return reply(400,'INVALID_CONTACT_EMAIL');
 // Only the trusted Cloudflare-provided client address determines the source-IP quota.
 // Empty/invalid IP shares a conservative "unknown" bucket; user headers cannot spoof it.
 const ip=safeText(request.headers.get('CF-Connecting-IP')||'unknown',90);
 const db=getDb(env||{});
 if(!db)return reply(503,'ORIGINAL_D1_UNAVAILABLE');
 try{
  // One atomic D1 gate prevents concurrent requests from bypassing limits.
  // No arbitrary submitted email is contacted, even when it looks registered.
  const result=await db.prepare(`INSERT INTO auth_recovery_requests
   (request_type,contact_email,possible_email,display_name,note,
    ip_address,user_agent,status,created_at,updated_at)
   SELECT 'forgot_email',?,?,?,?,?,?,'open',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
   WHERE (SELECT COUNT(*) FROM auth_recovery_requests
    WHERE contact_email=? AND created_at>=datetime('now','-1 hour'))<3
   AND (SELECT COUNT(*) FROM auth_recovery_requests
    WHERE COALESCE(ip_address,'')=? AND created_at>=datetime('now','-1 hour'))<6`)
   .bind(contact,possible||null,name||null,note||null,ip,
    safeText(request.headers.get('User-Agent'),160)||null,contact,ip).run();
  // Rate-limited requests intentionally get the same generic public response.
  if(Number(result?.meta?.changes)===0)return reply(202,'PRIVATE_REVIEW_INTAKE');
  if(Number(result?.meta?.changes)!==1)return reply(503,'ORIGINAL_WRITE_UNCONFIRMED');
  return reply(202,'PRIVATE_REVIEW_INTAKE');
 }catch{return reply(503,'ORIGINAL_D1_WRITE_FAILED');}
}
