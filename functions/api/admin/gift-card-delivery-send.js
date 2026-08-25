// Devil n Dove Build 406 — Gift Card provider delivery implementation.
// Gift Card + notification schema are migration-owned; request handlers perform no DDL.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { requireGiftCardSchema } from '../_lib/giftCardSchemaReadiness.js';
import { requireNotificationSchema } from '../_lib/notificationSchemaReadiness.js';

const BUILD = 406;
const CONTRACT_ID = 'operations-gift-card-provider-send-write';
function json(d,s=200){return jsonResponse(d,s,{ 'Cache-Control':'no-store' });}
function rows(r){return Array.isArray(r?.results)?r.results:[];}
function clean(v,l=1200){const t=normalizeText(v);return t.length>l?t.slice(0,l).trim():t;}
function provider(env){return clean(env.GIFT_CARD_EMAIL_PROVIDER || env.EMAIL_PROVIDER || 'manual',40).toLowerCase();}

async function requireGiftDeliverySchema(db){
  return requireGiftCardSchema(db,{requiredTables:['gift_card_delivery_queue','gift_card_provider_send_logs']});
}
async function logSend(db,row,prov,user,result){
  await db.prepare(`INSERT INTO gift_card_provider_send_logs (gift_card_delivery_queue_id,gift_card_id,provider,recipient_email,provider_message_id,send_status,request_summary_json,response_summary_json,error_text,created_by_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(row.gift_card_delivery_queue_id,row.gift_card_id,prov,row.recipient_email,result.provider_message_id||'',result.ok?'sent':'failed',JSON.stringify({subject:row.subject,body_length:String(row.body||'').length}),JSON.stringify(result.response||{}),result.error||'',Number(user.user_id||0)||null).run().catch(()=>null);
}
async function sendViaProvider(env,prov,row){
  const to=clean(row.recipient_email,240); const subject=clean(row.subject||'Your Devil n Dove gift card',240); const body=clean(row.body||'',12000); const from=clean(env.GIFT_CARD_FROM_EMAIL||env.NOTIFICATION_FROM_EMAIL||env.RESEND_FROM_EMAIL||'hello@devilndove.com',240);
  if(prov==='manual') return {ok:false,manual:true,error:'Manual provider selected; no external send attempted.',response:{queued_manual:true}};
  if(prov==='resend'){
    if(!env.RESEND_API_KEY) return {ok:false,error:'RESEND_API_KEY is not configured.'};
    const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from,to,subject,text:body})});
    const data=await res.json().catch(()=>({status:res.status})); return {ok:res.ok,provider_message_id:data.id||'',response:data,error:res.ok?'':(data.message||`Resend HTTP ${res.status}`)};
  }
  if(prov==='sendgrid'){
    if(!env.SENDGRID_API_KEY) return {ok:false,error:'SENDGRID_API_KEY is not configured.'};
    const res=await fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{Authorization:`Bearer ${env.SENDGRID_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({personalizations:[{to:[{email:to}]}],from:{email:from},subject,content:[{type:'text/plain',value:body}]})});
    return {ok:res.ok,provider_message_id:res.headers.get('x-message-id')||'',response:{status:res.status},error:res.ok?'':`SendGrid HTTP ${res.status}`};
  }
  if(prov==='postmark'){
    if(!env.POSTMARK_SERVER_TOKEN) return {ok:false,error:'POSTMARK_SERVER_TOKEN is not configured.'};
    const res=await fetch('https://api.postmarkapp.com/email',{method:'POST',headers:{'X-Postmark-Server-Token':env.POSTMARK_SERVER_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({From:from,To:to,Subject:subject,TextBody:body})});
    const data=await res.json().catch(()=>({status:res.status})); return {ok:res.ok,provider_message_id:data.MessageID||'',response:data,error:res.ok?'':(data.Message||`Postmark HTTP ${res.status}`)};
  }
  return {ok:false,error:`Unknown gift-card email provider: ${prov}`};
}

export async function onRequestGet(context){
  const db=getDb(context.env);if(!db)return json({ok:false,build:BUILD,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,build:BUILD,error:'Unauthorized.'},401);
  const schema=await requireGiftDeliverySchema(db);if(!schema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error_code:schema.error_code,error:schema.error,...schema.readiness},503);
  const queue=rows(await db.prepare(`SELECT * FROM gift_card_delivery_queue ORDER BY datetime(queued_at) DESC LIMIT 200`).all().catch(()=>({results:[]})));
  const logs=rows(await db.prepare(`SELECT * FROM gift_card_provider_send_logs ORDER BY datetime(created_at) DESC LIMIT 120`).all().catch(()=>({results:[]})));
  return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',provider:provider(context.env),queue,logs,summary:{queued:queue.filter(r=>r.delivery_status==='queued').length,sent:queue.filter(r=>r.delivery_status==='sent').length,failed:queue.filter(r=>r.delivery_status==='failed').length,provider_logs:logs.length},request_time_schema_mutation:false});
}

export async function onRequestPost(context){
  const db=getDb(context.env);if(!db)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Unauthorized.'},401);
  const schema=await requireGiftDeliverySchema(db);if(!schema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error_code:schema.error_code,error:schema.error,...schema.readiness},503);
  let body={};try{body=await context.request.json()}catch{return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Invalid JSON body.'},400)}
  const action=clean(body.action||'queue_outbox',60);const id=Number(body.gift_card_delivery_queue_id||0);

  if(action==='send_provider'){
    const limit=Math.max(1,Math.min(10,Number(body.limit||1)||1)); const prov=provider(context.env); const queued=rows(await db.prepare(`SELECT * FROM gift_card_delivery_queue WHERE delivery_status IN ('queued','queued_outbox','failed') ORDER BY datetime(queued_at) ASC LIMIT ?`).bind(limit).all().catch(()=>({results:[]}))); let sent=0, failed=0;
    for(const row of queued){const result=await sendViaProvider(context.env,prov,row);await logSend(db,row,prov,user,result);if(result.ok){await db.prepare(`UPDATE gift_card_delivery_queue SET delivery_status='sent', attempt_count=attempt_count+1, sent_at=CURRENT_TIMESTAMP, notes=COALESCE(notes,'') || ? WHERE gift_card_delivery_queue_id=?`).bind(`\nSent through ${prov}.`,row.gift_card_delivery_queue_id).run();sent+=1;}else{await db.prepare(`UPDATE gift_card_delivery_queue SET delivery_status=?, attempt_count=attempt_count+1, notes=COALESCE(notes,'') || ? WHERE gift_card_delivery_queue_id=?`).bind(result.manual?'queued_manual':'failed',`\n${prov}: ${result.error||'not sent'}`,row.gift_card_delivery_queue_id).run();failed+=1;}}
    return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:`Provider send complete: ${sent} sent, ${failed} not sent.`,sent,failed,provider:prov,request_time_schema_mutation:false,provider_behavior_changed:false});
  }

  if(action==='mark_sent'||action==='mark_failed'){
    if(!id)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'gift_card_delivery_queue_id is required.'},400);
    await db.prepare(`UPDATE gift_card_delivery_queue SET delivery_status=?, attempt_count=attempt_count+1, sent_at=CASE WHEN ?='sent' THEN CURRENT_TIMESTAMP ELSE sent_at END, notes=COALESCE(notes,'') || ? WHERE gift_card_delivery_queue_id=?`).bind(action==='mark_sent'?'sent':'failed',action==='mark_sent'?'sent':'failed',`\n${clean(body.notes||action,800)}`,id).run();
    return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:'Gift-card delivery status updated.',request_time_schema_mutation:false});
  }

  const notificationSchema=await requireNotificationSchema(db,{requiredTables:['notification_outbox']});
  if(!notificationSchema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error_code:notificationSchema.error_code,error:notificationSchema.error,...notificationSchema.readiness},503);
  const limit=Math.max(1,Math.min(25,Number(body.limit||10)||10));
  const queued=rows(await db.prepare(`SELECT * FROM gift_card_delivery_queue WHERE delivery_status='queued' ORDER BY datetime(queued_at) ASC LIMIT ?`).bind(limit).all().catch(()=>({results:[]})));
  let moved=0;
  for(const row of queued){
    const payload={
      subject: clean(row.subject||'Your Devil n Dove gift card',240),
      message: clean(row.body||'',12000),
      gift_card_delivery_queue_id:Number(row.gift_card_delivery_queue_id||0),
      gift_card_id:Number(row.gift_card_id||0),
      delivery_kind:row.delivery_kind||'',
      template_key:row.template_key||'',
    };
    await db.prepare(`INSERT INTO notification_outbox (notification_kind,channel,destination,payload_json,metadata_json,status,next_attempt_at,created_at,updated_at) VALUES ('gift_card_delivery','email',?,?,?,'queued',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(clean(row.recipient_email,240),JSON.stringify(payload),JSON.stringify({source:'gift_card_delivery_send',gift_card_delivery_queue_id:Number(row.gift_card_delivery_queue_id||0)})).run();
    await db.prepare(`UPDATE gift_card_delivery_queue SET delivery_status='queued_outbox', attempt_count=attempt_count+1, notes=COALESCE(notes,'') || '\nQueued into canonical notification_outbox.', sent_at=NULL WHERE gift_card_delivery_queue_id=?`).bind(row.gift_card_delivery_queue_id).run();
    moved+=1;
  }
  return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:`Queued ${moved} gift-card delivery message(s) into notification_outbox.`,moved,request_time_schema_mutation:false,notification_schema:'canonical-build-403'});
}
