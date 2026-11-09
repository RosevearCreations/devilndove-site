/** Build 658: actual Supply/Tool stock and lot reads + private, source-revision-bound
 * physical count/independent review receipts. NO canonical stock mutation. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {POLICY,normalizeCount,normalizeReview,decodeJournal,latestPair} from '../_lib/physicalStock658.mjs';
const PREFIX='site.admin.physical_stock.v658.';
const respond=(body,status=200)=>jsonResponse({build:658,...body,policy:POLICY},status,
  {'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'});
const rows=r=>Array.isArray(r?.results)?r.results:[];
const positive=v=>/^[1-9]\d{0,9}$/.test(String(v??''))?Number(v):0;
const exact4=n=>Math.round(Number(n)*10000)/10000;
async function sha(v){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');}
function access(ctx){const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 return !admin?{error:respond({ok:false,error:'Active Storefront Admin grant required.'},401)}:
   !db?{error:respond({ok:false,error:'Canonical Inventory database unavailable.'},503)}:{admin,db};}
async function source(db,id){
 const item=await db.prepare(`SELECT site_item_inventory_id,source_type,external_key,item_name,category,
  is_active,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,on_hand_quantity,
  reserved_quantity,incoming_quantity,last_counted_at,updated_at
  FROM site_item_inventory WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1
  AND LOWER(TRIM(COALESCE(source_type,''))) IN ('supply','tool') LIMIT 1`).bind(id).first();
 if(!item)return null;
 const base=await db.prepare(`SELECT site_item_inventory_id,purchase_unit_label,base_unit_label,
   base_units_per_purchase_unit,base_on_hand_quantity,base_reserved_quantity,
   base_incoming_quantity,updated_at FROM site_inventory_base_balances
   WHERE site_item_inventory_id=? LIMIT 1`).bind(id).first();
 if(!base)throw Error('Current canonical usable/base-unit Inventory migration is required.');
 const lots=rows(await db.prepare(`SELECT inventory_purchase_lot_id,lot_code,lot_status,
   quantity_remaining,quantity_received,storage_location,expiry_date,updated_at
   FROM inventory_purchase_lots WHERE site_item_inventory_id=?
   ORDER BY inventory_purchase_lot_id DESC LIMIT 26`).bind(id).all());
 const summary=await db.prepare(`SELECT COUNT(*) AS lot_count,
   COALESCE(SUM(COALESCE(quantity_remaining,0)),0) AS lot_remaining_purchase
   FROM inventory_purchase_lots WHERE site_item_inventory_id=?`).bind(id).first();
 const lot_count=Number(summary?.lot_count||0),shown_lots=lots.slice(0,25);
 const per=Number(base.base_units_per_purchase_unit),stock=Number(item.on_hand_quantity);
 const aligned=Number.isFinite(per)&&per>0&&
   Math.abs(exact4(stock*per)-Number(base.base_on_hand_quantity))<0.0001&&
   Math.abs(exact4(Number(item.reserved_quantity)*per)-Number(base.base_reserved_quantity))<0.0001;
 const lot_total_base=exact4(Number(summary?.lot_remaining_purchase||0)*per);
 const lot_custody_hold=shown_lots.some(l=>Number(l.quantity_remaining)>0&&
   (String(l.lot_status||'').toLowerCase()!=='available'||
    (l.expiry_date&&String(l.expiry_date).slice(0,10)<new Date().toISOString().slice(0,10))));
 const facts={item,base,lots:shown_lots,lot_count,lot_total_base,
   lot_list_truncated:lot_count>25,lot_custody_hold,base_authority_aligned:aligned,
   lot_total_matches_stock:lot_count>0?Math.abs(lot_total_base-Number(base.base_on_hand_quantity))<0.0001:null};
 return {...facts,source_revision:await sha(facts),scope:'active original Tool/Supply, base balance and latest 25 source lots'};
}
async function journal(db,id){const row=await db.prepare(`SELECT setting_value,is_public FROM app_settings
  WHERE setting_key=? LIMIT 1`).bind(PREFIX+id).first();return {row,doc:decodeJournal(row)};}
function view(s,doc){const latest=latestPair(doc),count=latest.count,review=latest.review;
 return {ok:true,source:s,version:doc.version,history:doc.receipts.slice(0,50),latest,
  count_source_current:!count||count.source_revision===s.source_revision,
  correction_state:!count?'NOT_COUNTED':count.source_revision!==s.source_revision?'SOURCE_CHANGED_HOLD':
   !review?'SECOND_ADMIN_REVIEW_REQUIRED':review.decision==='approve'?
   (Math.abs(review.counted_base_quantity-Number(s.base.base_on_hand_quantity))<0.0001?
      'OWNER_COUNT_MATCHES_SOURCE':'APPROVED_CORRECTION_PENDING_CANONICAL_POST'):'RECOUNT_OR_HOLD',
  correction_applied_by_build:false,independent_witness_verified:false,
  master_completion_percent:null};}
export async function onRequestGet(ctx){
 const a=access(ctx);if(a.error)return a.error;
 const params=new URL(ctx.request.url).searchParams,raw=params.get('item_id'),key=params.get('request_key');
 try{
  if(raw===null){const q=String(params.get('q')||'').trim().slice(0,90).toLowerCase();
   const kind=['supply','tool'].includes(params.get('kind'))?params.get('kind'):'';
   const items=rows(await a.db.prepare(`SELECT site_item_inventory_id,source_type,item_name,
     category,stock_unit_label,last_counted_at FROM site_item_inventory
     WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,''))) IN ('supply','tool')
     AND (?='' OR LOWER(source_type)=?) AND (?='' OR LOWER(item_name) LIKE ?)
     ORDER BY LOWER(item_name),site_item_inventory_id LIMIT 80`)
    .bind(kind,kind,q,'%'+q+'%').all());
   return respond({ok:true,items,bounded_to:80,no_automatic_source_reads:true});}
  const id=positive(raw);if(!id)return respond({ok:false,error:'Choose a valid original Tool or Supply ID.'},400);
  if(key!==null&&!/^[0-9a-f-]{36}$/i.test(key))return respond({ok:false,error:'Invalid original request key.'},400);
  const {doc}=await journal(a.db,id);
  if(key!==null){const receipt=doc.receipts.find(r=>r.request_key===key.toLowerCase());
   return respond({ok:true,item_id:id,receipt:receipt||null,found:Boolean(receipt),no_automatic_retry:true});}
  const s=await source(a.db,id);if(!s)return respond({ok:false,error:'Original active Tool or Supply missing.'},404);
  return respond(view(s,doc));
 }catch{return respond({ok:false,error:'Original Inventory, base units or private journal unavailable. Approval held.'},503);}
}
export async function onRequestPost(ctx){
 const a=access(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return respond({ok:false,error:'Same-origin Admin action required.'},403);
 if(!ctx.request.headers.get('Content-Type')?.toLowerCase().includes('application/json'))
  return respond({ok:false,error:'JSON review required.'},415);
 let body;try{body=await ctx.request.json();}catch{return respond({ok:false,error:'Invalid JSON.'},400);}
 let input;try{input=body?.action==='record_count'?normalizeCount(body):normalizeReview(body);}
 catch(e){return respond({ok:false,error:e.message},400);}
 try{
  const {row,doc}=await journal(a.db,input.item_id),s=await source(a.db,input.item_id);
  if(!s)return respond({ok:false,error:'Original active Tool or Supply missing.'},404);
  const fingerprint=await sha({actor:a.admin.user_id,input});
  const previous=doc.receipts.find(r=>r.request_key===input.request_key);
  if(previous)return previous.payload_sha256===fingerprint?
   respond({ok:true,replayed:true,receipt:previous,no_automatic_retry:true}):
   respond({ok:false,code:'REQUEST_CONFLICT',error:'Original request key was used for different evidence.'},409);
  if(s.source_revision!==input.expected_source_revision)
   return respond({ok:false,code:'SOURCE_CHANGED',error:'Stock balance/lot source changed. Inspect again before acting.'},409);
  if(doc.version!==input.expected_version)
   return respond({ok:false,code:'STALE_REVIEW',error:'Another Admin changed this review. Reload before acting.'},409);
  if(doc.receipts.length>=70)return respond({ok:false,error:'Private review cap reached; archive requires separate approval.'},409);
  if(!s.base_authority_aligned)return respond({ok:false,code:'BASE_DRIFT',
   error:'Purchase/base stock authority is inconsistent. Reconcile canonical inventory first.'},409);
  const current=latestPair(doc);
  let receipt={receipt_id:crypto.randomUUID(),request_key:input.request_key,
   action:input.action,item_id:input.item_id,item_name:String(s.item.item_name),
   source_type:String(s.item.source_type),source_revision:s.source_revision,
   actor_user_id:a.admin.user_id,recorded_at:new Date().toISOString(),
   payload_sha256:fingerprint,inventory_modified:false,external_verified:false,
   master_event_sent:false,note:input.note};
  if(input.action==='record_count'){
   if(current.count&&(!current.review||current.review.decision==='approve'))
    return respond({ok:false,code:'COUNT_ALREADY_OPEN',error:'Complete or hold the latest count review before starting a new one.'},409);
   if(input.lot_id&&!s.lots.some(l=>Number(l.inventory_purchase_lot_id)===input.lot_id))
    return respond({ok:false,code:'LOT_NOT_IN_SCOPE',error:'The cited original lot is not in the inspected bounded source.'},409);
   receipt={...receipt,counted_base_quantity:input.counted_base_quantity,
    recorded_base_quantity:Number(s.base.base_on_hand_quantity),
    recorded_reserved_base:Number(s.base.base_reserved_quantity),
    difference_base:exact4(input.counted_base_quantity-Number(s.base.base_on_hand_quantity)),
    base_unit:String(s.base.base_unit_label),lot_id:input.lot_id,
    lot_count:s.lot_count,lot_total_matches_stock:s.lot_total_matches_stock,
    lot_list_truncated:s.lot_list_truncated,observed_location:input.observed_location,
    observed_at:input.observed_at};
  }else{
   if(!current.count||current.review||current.count.receipt_id!==input.count_receipt_id)
    return respond({ok:false,code:'COUNT_REVIEW_NOT_CURRENT',error:'Select the latest unreviewed original count.'},409);
   if(current.count.actor_user_id===a.admin.user_id)
    return respond({ok:false,code:'SEPARATE_ADMIN_REQUIRED',error:'Count observer cannot independently review their own count.'},403);
   if(current.count.source_revision!==s.source_revision)
    return respond({ok:false,code:'COUNT_SOURCE_DRIFT',error:'Stock changed after count. Recount required.'},409);
   if(input.decision==='approve'&&(s.lot_list_truncated||s.lot_custody_hold||
     current.count.counted_base_quantity<Number(s.base.base_reserved_quantity)-0.0001||
     (s.lot_count>0&&!s.lot_total_matches_stock)))
     return respond({ok:false,code:'LOT_OR_RESERVATION_HOLD',
      error:'Lot total/truncated history or existing reservations prevent independent approval. Investigate and HOLD.'},409);
   receipt={...receipt,count_receipt_id:current.count.receipt_id,decision:input.decision,
    counted_base_quantity:current.count.counted_base_quantity,
    difference_base:current.count.difference_base,
    correction_marker:'DD-B658:'+current.count.receipt_id,
    correction_requires_original_inventory_authority:true};
  }
  const next={schema:658,version:doc.version+1,receipts:[receipt,...doc.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>64000)return respond({ok:false,error:'Protected private inventory review size cap reached.'},413);
  const mutation=row?await a.db.prepare(`UPDATE app_settings SET setting_value=?,is_public=0,
    updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=?
    AND is_public=0 AND setting_value=?`)
     .bind(packed,a.admin.user_id,PREFIX+input.item_id,row.setting_value).run():
    await a.db.prepare(`INSERT INTO app_settings
     (setting_key,setting_value,is_public,updated_by_user_id,updated_at)
     VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING`)
     .bind(PREFIX+input.item_id,packed,a.admin.user_id).run();
  if(Number(mutation?.meta?.changes)!==1)
   return respond({ok:false,code:'CAS_CONFLICT',error:'Private count version changed; inspect original request key.'},409);
  const persisted=await journal(a.db,input.item_id).catch(()=>null);
  if(!persisted||persisted.doc.version!==next.version||persisted.doc.receipts[0]?.receipt_id!==receipt.receipt_id)
   return respond({ok:false,code:'UNKNOWN_SAVE',error:'Save outcome uncertain. Look up original request key; never auto-retry.'},503);
  let audit_recorded=true;
  try{await a.db.prepare(`INSERT INTO admin_action_audit
   (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at)
   VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(a.admin.user_id,
     'physical_stock_658_'+input.action,'site_item_inventory',String(input.item_id),
     'POST','/api/admin/physical-stock-658',JSON.stringify({receipt_id:receipt.receipt_id,
     source_revision:s.source_revision,correction_applied:false,review_decision:receipt.decision||null})).run();}
  catch{audit_recorded=false;}
  const updated=await source(a.db,input.item_id).catch(()=>null);
  return respond({ok:true,saved:true,receipt,version:next.version,audit_recorded,
    source_current:Boolean(updated&&updated.source_revision===s.source_revision),
    correction_applied:false,warning:audit_recorded?null:'Receipt saved but audit insertion failed; do not duplicate.'});
 }catch{return respond({ok:false,code:'SOURCE_OR_STORAGE_HOLD',
   error:'Inventory or private evidence store unavailable. Inspect original request key before any retry.'},503);}
}
