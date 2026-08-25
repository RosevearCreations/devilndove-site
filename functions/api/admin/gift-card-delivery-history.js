// Devil n Dove Build 387 Gift Card delivery history read.
// GET-only: missing schema is reported and never created during history lookup.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(d,s=200){return jsonResponse(d,s,{ 'Cache-Control':'no-store' });}
function rows(r){return Array.isArray(r?.results)?r.results:[];}
function clean(v,l=240){const t=normalizeText(v);return t.length>l?t.slice(0,l).trim():t;}
async function queueReady(db){try{return rows(await db.prepare(`PRAGMA table_info(gift_card_delivery_queue)`).all()).length>0}catch{return false}}
export async function onRequestGet(context){
  const db=getDb(context.env);if(!db)return json({ok:false,error:'Database binding is missing.'},500);
  const user=await getAdminUserFromRequest(context.request,context.env);if(!user)return json({ok:false,error:'Unauthorized.'},401);
  const url=new URL(context.request.url);const giftCardId=Number(url.searchParams.get('gift_card_id')||0);const email=clean(url.searchParams.get('email')||'',240);
  const ready=await queueReady(db);
  if(!ready)return json({ok:true,build:387,schema_ready:false,missing_tables:['gift_card_delivery_queue'],request_time_schema_mutation:false,history:[],summary:{total:0,queued:0,sent:0,failed:0}});
  const history=rows(await db.prepare(`SELECT * FROM gift_card_delivery_queue WHERE (?<=0 OR gift_card_id=?) AND (?='' OR LOWER(recipient_email)=LOWER(?)) ORDER BY datetime(queued_at) DESC LIMIT 200`).bind(giftCardId,giftCardId,email,email).all().catch(()=>({results:[]})));
  return json({ok:true,build:387,schema_ready:true,missing_tables:[],request_time_schema_mutation:false,history,summary:{total:history.length,queued:history.filter(r=>String(r.delivery_status||'').startsWith('queued')).length,sent:history.filter(r=>r.delivery_status==='sent').length,failed:history.filter(r=>r.delivery_status==='failed').length}})
}
