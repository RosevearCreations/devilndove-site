// Release 467 Build 382 — customer-safe read-only progress. Reuses existing private order_* token authority.
import {getDb,jsonResponse} from './_lib/adminAudit.js';
const reply=(d,status=200)=>jsonResponse(d,status,{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'});
export async function onRequestGet({request,env}){
 const token=new URL(request.url).searchParams.get('token')||'';
 if(!/^order_[A-Za-z0-9_-]{12,170}$/.test(token))return reply({ok:false,error:'A valid private order status link is required.'},400);
 const db=getDb(env);if(!db)return reply({ok:false,error:'Status temporarily unavailable.'},503);
 try{
  const link=await db.prepare(`SELECT l.custom_request_id,l.order_id FROM custom_request_order_status_links l
    JOIN orders o ON o.order_id=l.order_id WHERE l.order_status_token=? AND
    COALESCE(l.link_status,'active') NOT IN ('void','expired') AND l.expired_at IS NULL AND l.voided_at IS NULL LIMIT 1`).bind(token).first();
  if(!link)return reply({ok:false,error:'This order status link is not active.'},404);
  const event=await db.prepare(`SELECT progress_stage,public_progress_message,created_at
   FROM custom_request_commission_events WHERE custom_request_id=? AND event_kind='progress_approval'
   AND customer_visible=1 ORDER BY custom_request_commission_event_id DESC LIMIT 1`).bind(link.custom_request_id).first();
  return reply({ok:true,progress:event?{stage:event.progress_stage,message:event.public_progress_message,approved_at:event.created_at}:null,
    progress_available:!!event,note:event?'This update was explicitly reviewed by the workshop.':'No customer-visible commission update has been approved yet.',
    only_approved_public_text:true,privileged_status_link_required:true});
 }catch(e){console.error('COMMISSION_PUBLIC_READ_FAILED',e?.name||'Error');return reply({ok:false,error:'Commission progress is temporarily unavailable.'},503);}
}
