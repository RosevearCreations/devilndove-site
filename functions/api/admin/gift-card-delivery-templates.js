// Devil n Dove Build 405 — Gift Card delivery template editor and resend queue.
// Schema/default authority is database_gift_card_runtime_parity.sql.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { requireGiftCardSchema } from '../_lib/giftCardSchemaReadiness.js';

const BUILD = 405;
const CONTRACT_ID = 'operations-gift-card-template-write';
function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function clean(value,limit=1200){const text=normalizeText(value);return text.length>limit?text.slice(0,limit).trim():text;}

export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return json({ok:false,build:BUILD,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,build:BUILD,error:'Unauthorized.'},401);
  const schema=await requireGiftCardSchema(db,{requiredTables:['gift_card_delivery_templates','gift_card_delivery_queue']});
  if(!schema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error_code:schema.error_code,error:schema.error,...schema.readiness},503);
  const templates=(await db.prepare(`SELECT * FROM gift_card_delivery_templates ORDER BY template_key ASC`).all()).results||[];
  const queue=(await db.prepare(`SELECT * FROM gift_card_delivery_queue ORDER BY datetime(queued_at) DESC LIMIT 100`).all()).results||[];
  return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',templates,queue,summary:{templates:templates.length,queued:queue.filter((row)=>row.delivery_status==='queued').length},request_time_schema_mutation:false,request_time_default_seeding:false,migration_authority:'database_gift_card_runtime_parity.sql'});
}

export async function onRequestPost(context){
  const db=getDb(context.env); if(!db)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Unauthorized.'},401);
  const schema=await requireGiftCardSchema(db,{requiredTables:['gift_card_delivery_templates','gift_card_delivery_queue']});
  if(!schema.ok)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error_code:schema.error_code,error:schema.error,...schema.readiness},503);
  let body={}; try{body=await context.request.json()}catch{return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Invalid JSON body.'},400)}
  const action=clean(body.action||'save_template',60);
  if(action==='resend'){
    const templateKey=clean(body.template_key||'activation',80);
    const template=await db.prepare(`SELECT * FROM gift_card_delivery_templates WHERE template_key=? LIMIT 1`).bind(templateKey).first().catch(()=>null);
    if(!template)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'Gift-card delivery template was not found. Apply migration-owned defaults or choose an existing template.'},404);
    await db.prepare(`INSERT INTO gift_card_delivery_queue (gift_card_id, recipient_email, delivery_kind, template_key, subject, body, delivery_status, queued_by_user_id, queued_at, notes) VALUES (?,?,?,?,?,?,'queued',?,CURRENT_TIMESTAMP,?)`).bind(Number(body.gift_card_id||0)||null,clean(body.recipient_email||'',240),clean(body.delivery_kind||'resend',80),templateKey,clean(body.subject||template.subject||'',240),clean(body.body||template.body||'',4000),Number(user.user_id||0)||null,clean(body.notes||'Manual resend queued from admin.',800)).run();
    return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:'Gift-card delivery resend queued.',request_time_schema_mutation:false});
  }
  const key=clean(body.template_key||'',80).toLowerCase().replace(/[^a-z0-9_-]+/g,'_'); if(!key)return json({ok:false,build:BUILD,contract:CONTRACT_ID,error:'template_key is required.'},400);
  await db.prepare(`INSERT INTO gift_card_delivery_templates (template_key, subject, body, template_status, created_by_user_id, created_at, updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(template_key) DO UPDATE SET subject=excluded.subject, body=excluded.body, template_status=excluded.template_status, updated_at=CURRENT_TIMESTAMP`).bind(key,clean(body.subject||'',240),clean(body.body||'',4000),clean(body.template_status||'active',40),Number(user.user_id||0)||null).run();
  return json({ok:true,build:BUILD,contract:CONTRACT_ID,owner:'operations',message:'Gift-card delivery template saved.',template_key:key,request_time_schema_mutation:false,request_time_default_seeding:false});
}
