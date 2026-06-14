// File: /functions/api/admin/gift-card-delivery-templates.js
// Brief description: Admin gift-card delivery template editor and resend queue.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data,status=200){return jsonResponse(data,status,{ 'Cache-Control':'no-store' });}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function clean(value,limit=1200){const text=normalizeText(value);return text.length>limit?text.slice(0,limit).trim():text;}
async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_delivery_templates (gift_card_delivery_template_id INTEGER PRIMARY KEY AUTOINCREMENT, template_key TEXT NOT NULL UNIQUE, subject TEXT, body TEXT, template_status TEXT NOT NULL DEFAULT 'active', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_delivery_queue (gift_card_delivery_queue_id INTEGER PRIMARY KEY AUTOINCREMENT, gift_card_id INTEGER, recipient_email TEXT, delivery_kind TEXT NOT NULL DEFAULT 'activation', template_key TEXT, subject TEXT, body TEXT, delivery_status TEXT NOT NULL DEFAULT 'queued', attempt_count INTEGER NOT NULL DEFAULT 0, queued_by_user_id INTEGER, queued_at TEXT DEFAULT CURRENT_TIMESTAMP, sent_at TEXT, notes TEXT)`).run();
}
async function seed(db,userId){
  await db.prepare(`INSERT OR IGNORE INTO gift_card_delivery_templates (template_key, subject, body, created_by_user_id, created_at, updated_at) VALUES ('activation','Your Devil n Dove gift card is ready','Hi {{recipient_name}},\n\nYour Devil n Dove gift card {{gift_card_code}} is ready. Balance: {{balance}}.\n\nThank you for supporting handmade work.\nDevil n Dove', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(userId||null).run();
  await db.prepare(`INSERT OR IGNORE INTO gift_card_delivery_templates (template_key, subject, body, created_by_user_id, created_at, updated_at) VALUES ('reissue','Your Devil n Dove gift card was reissued','Hi {{recipient_name}},\n\nWe reissued your Devil n Dove gift card. New code: {{gift_card_code}}. Balance: {{balance}}.\n\nDevil n Dove', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(userId||null).run();
}
export async function onRequestGet(context){
  const db=getDb(context.env); if(!db)return json({ok:false,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,error:'Unauthorized.'},401);
  await ensure(db); await seed(db,Number(user.user_id||0)||null);
  const templates=rows(await db.prepare(`SELECT * FROM gift_card_delivery_templates ORDER BY template_key ASC`).all().catch(()=>({results:[]})));
  const queue=rows(await db.prepare(`SELECT * FROM gift_card_delivery_queue ORDER BY datetime(queued_at) DESC LIMIT 100`).all().catch(()=>({results:[]})));
  return json({ok:true,templates,queue,summary:{templates:templates.length,queued:queue.filter((row)=>row.delivery_status==='queued').length}});
}
export async function onRequestPost(context){
  const db=getDb(context.env); if(!db)return json({ok:false,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env); if(!user)return json({ok:false,error:'Unauthorized.'},401);
  await ensure(db); let body={}; try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON body.'},400)}
  const action=clean(body.action||'save_template',60);
  if(action==='resend'){
    const templateKey=clean(body.template_key||'activation',80);
    const template=await db.prepare(`SELECT * FROM gift_card_delivery_templates WHERE template_key=? LIMIT 1`).bind(templateKey).first().catch(()=>null);
    await db.prepare(`INSERT INTO gift_card_delivery_queue (gift_card_id, recipient_email, delivery_kind, template_key, subject, body, delivery_status, queued_by_user_id, queued_at, notes) VALUES (?,?,?,?,? ,?, 'queued', ?, CURRENT_TIMESTAMP, ?)`).bind(Number(body.gift_card_id||0)||null,clean(body.recipient_email||'',240),clean(body.delivery_kind||'resend',80),templateKey,clean(body.subject||template?.subject||'',240),clean(body.body||template?.body||'',4000),Number(user.user_id||0)||null,clean(body.notes||'Manual resend queued from admin.',800)).run();
    return json({ok:true,message:'Gift-card delivery resend queued.'});
  }
  const key=clean(body.template_key||'',80).toLowerCase().replace(/[^a-z0-9_-]+/g,'_'); if(!key)return json({ok:false,error:'template_key is required.'},400);
  await db.prepare(`INSERT INTO gift_card_delivery_templates (template_key, subject, body, template_status, created_by_user_id, created_at, updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(template_key) DO UPDATE SET subject=excluded.subject, body=excluded.body, template_status=excluded.template_status, updated_at=CURRENT_TIMESTAMP`).bind(key,clean(body.subject||'',240),clean(body.body||'',4000),clean(body.template_status||'active',40),Number(user.user_id||0)||null).run();
  return json({ok:true,message:'Gift-card delivery template saved.',template_key:key});
}
