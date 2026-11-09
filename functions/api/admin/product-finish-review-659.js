/** Build 659: bounded original Product/media/finished-lot review and private owner
 * evidence receipt. Never authorizes production, stock, publication or safety. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const PREFIX='site.admin.product_finish.v659.';
const reply=(data,status=200)=>jsonResponse({release:467,build:659,...data},status,
  {'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'});
const rows=v=>Array.isArray(v?.results)?v.results:[];
const validId=v=>/^[1-9]\d{0,9}$/.test(String(v??''))?Number(v):0;
const clean=(v,n=500)=>String(v??'').trim().slice(0,n);
const own=ctx=>{const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
 return !admin?{error:reply({ok:false,error:'Active Storefront Admin grant required.'},401)}:
 !db?{error:reply({ok:false,error:'Canonical Product database unavailable.'},503)}:{admin,db};};
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(value));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');}
async function source(db,id){
 const product=await db.prepare(`SELECT product_id,name,sku,slug,status,review_status,
  product_type,product_category,price_cents,inventory_tracking,inventory_quantity,
  featured_image_url,updated_at FROM products WHERE product_id=? LIMIT 1`).bind(id).first();
 if(!product)return null;
 const images=rows(await db.prepare(`SELECT product_image_id,image_url,alt_text,sort_order
  FROM product_images WHERE product_id=? ORDER BY sort_order,product_image_id LIMIT 20`).bind(id).all());
 const imageTotal=await db.prepare(`SELECT COUNT(*) AS total FROM product_images WHERE product_id=?`).bind(id).first();
 const annotations=rows(await db.prepare(`SELECT product_image_id,image_role,public_use_status,
  consent_record_id,width_px,height_px,updated_at FROM product_image_annotations
  WHERE product_id=? ORDER BY updated_at DESC,product_image_annotation_id DESC LIMIT 20`).bind(id).all());
 const annotationTotal=await db.prepare(`SELECT COUNT(*) AS total FROM product_image_annotations WHERE product_id=?`).bind(id).first();
 const runs=rows(await db.prepare(`SELECT product_production_run_id,run_key,output_quantity,
  run_status,posted_at,updated_at FROM product_production_runs WHERE product_id=?
  ORDER BY product_production_run_id DESC LIMIT 20`).bind(id).all());
 const runTotal=await db.prepare(`SELECT COUNT(*) AS total FROM product_production_runs WHERE product_id=?`).bind(id).first();
 const lots=rows(await db.prepare(`SELECT product_finished_inventory_lot_id,lot_key,
  product_production_run_id,source_kind,quantity_created,lot_status,updated_at
  FROM product_finished_inventory_lots WHERE product_id=?
  ORDER BY product_finished_inventory_lot_id DESC LIMIT 20`).bind(id).all());
 const lotTotal=await db.prepare(`SELECT COUNT(*) AS total FROM product_finished_inventory_lots WHERE product_id=?`).bind(id).first();
 const facts={product,images,annotations,runs,lots,totals:{images:Number(imageTotal?.total||0),
  annotations:Number(annotationTotal?.total||0),runs:Number(runTotal?.total||0),
  lots:Number(lotTotal?.total||0)}};
 const truncated=Object.values(facts.totals).some(v=>v>20);
 const blockedMedia=annotations.some(a=>['blocked','consent_needed'].includes(clean(a.public_use_status).toLowerCase()));
 const hasMedia=images.some(i=>clean(i.image_url));
 const missingAlt=images.some(i=>clean(i.image_url)&&!clean(i.alt_text));
 const posted=runs.some(r=>r.run_status==='posted');
 const available=lots.some(l=>l.lot_status==='available'&&Number(l.quantity_created)>0);
 const dovlin=/dovlin/i.test([product.name,product.sku,product.product_category].join(' '));
 const holds=[...(!hasMedia?['NO_ORIGINAL_GALLERY_MEDIA']:[]),...(missingAlt?['GALLERY_ALT_TEXT_MISSING']:[]),
  ...(blockedMedia?['MEDIA_BLOCKED_OR_CONSENT_NEEDED']:[]),
  ...(truncated?['BOUNDED_SOURCE_INCOMPLETE']:[]),
  ...(!posted?['NO_POSTED_PRODUCTION_RUN_IN_BOUND']:[]),
  ...(!available?['NO_AVAILABLE_FINISHED_LOT_IN_BOUND']:[]),
  ...(dovlin?['DOVLIN_ORIGINAL_ARTWORK_AND_SAFETY_PROOF_NOT_IN_SOURCE']:[])];
 return {facts,source_revision:await digest(facts),truncated,holds,dovlin,
  source_scope:'one canonical Product, at most 20 per media/annotation/run/finished-lot layer',
  source_complete:!truncated,independent_rights_verified:false,
  original_dovlin_artwork_verified:false,product_safety_certified:false,
  actual_physical_sample_verified:false,external_sale_authorized:false};
}
function decode(row){if(!row)return {schema:659,version:0,receipts:[]};
 if(Number(row.is_public)!==0)throw Error('Private Product review unexpectedly public');
 const data=JSON.parse(row.setting_value);
 if(data?.schema!==659||!Number.isSafeInteger(data.version)||data.version<0||
 !Array.isArray(data.receipts)||data.receipts.length>40)throw Error('Invalid private review journal');
 return data;}
async function journal(db,id){const row=await db.prepare(`SELECT setting_value,is_public FROM app_settings
 WHERE setting_key=? LIMIT 1`).bind(PREFIX+id).first();return {row,doc:decode(row)};}
function inputReview(v){const id=validId(v?.product_id),version=Number(v?.expected_version),
   rev=clean(v?.expected_source_revision),key=clean(v?.request_key),note=clean(v?.note,501);
 if(!id||!Number.isSafeInteger(version)||version<0||!/^[0-9a-f]{64}$/.test(rev)||
   !/^[0-9a-f-]{36}$/i.test(key)||note.length<20||note.length>500)
  throw Error('Choose an original Product and provide current source/version, request key and a factual 20–500 character note.');
 const sample=clean(v.sample_evidence),rights=clean(v.rights_evidence),safety=clean(v.safety_evidence),
  art=clean(v.dovlin_design_evidence),decision=clean(v.decision);
 if(!['observed_real_sample','not_verified'].includes(sample)||
   !['original_permission_seen','not_verified'].includes(rights)||
   !['original_document_seen','not_verified'].includes(safety)||
   !['approved_original_compared','not_verified'].includes(art)||
   !['hold','owner_review_only'].includes(decision)||typeof v.declares_dovlin!=='boolean')
  throw Error('Choose each factual evidence state; no implied approvals.');
 return {product_id:id,expected_version:version,expected_source_revision:rev,
  request_key:key.toLowerCase(),sample_evidence:sample,rights_evidence:rights,
  safety_evidence:safety,dovlin_design_evidence:art,decision,
  declares_dovlin:v.declares_dovlin,note};}
function view(s,doc){const latest=doc.receipts[0]||null;
 return {ok:true,source:s,version:doc.version,latest_receipt:latest,
  history:doc.receipts.slice(0,20),source_current:!latest||latest.source_revision===s.source_revision,
  review_state:!latest?'UNREVIEWED':latest.source_revision!==s.source_revision?'STALE_SOURCE_HOLD':
    latest.review_state,read_only_original_sources:true,master_completion_percent:null};}
export async function onRequestGet(ctx){const a=own(ctx);if(a.error)return a.error;
 const p=new URL(ctx.request.url).searchParams,id=validId(p.get('product_id')),
 key=p.get('request_key');if(!id)return reply({ok:false,error:'Original positive Product ID required.'},400);
 if(key!==null&&!/^[0-9a-f-]{36}$/i.test(key))return reply({ok:false,error:'Invalid request key.'},400);
 try{const {doc}=await journal(a.db,id);
  if(key!==null){const receipt=doc.receipts.find(r=>r.request_key===key.toLowerCase());
   return reply({ok:true,receipt:receipt||null,found:Boolean(receipt),no_automatic_retry:true});}
  const s=await source(a.db,id);return s?reply(view(s,doc)):
    reply({ok:false,error:'Original Product not found.'},404);
 }catch{return reply({ok:false,error:'Original Product/media/lots or private review store unavailable. Review held.'},503);}}
export async function onRequestPost(ctx){const a=own(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return reply({ok:false,error:'Same-origin Admin action required.'},403);
 if(!ctx.request.headers.get('Content-Type')?.toLowerCase().includes('application/json'))
  return reply({ok:false,error:'JSON review required.'},415);
 let v;try{v=inputReview(await ctx.request.json());}catch(e){return reply({ok:false,error:e.message},400);}
 try{const {row,doc}=await journal(a.db,v.product_id),s=await source(a.db,v.product_id);
  if(!s)return reply({ok:false,error:'Original Product missing.'},404);
  const payload_sha256=await digest({actor:a.admin.user_id,v});
  const old=doc.receipts.find(r=>r.request_key===v.request_key);
  if(old)return old.payload_sha256===payload_sha256?
   reply({ok:true,replayed:true,receipt:old,no_automatic_retry:true}):
   reply({ok:false,code:'KEY_CONFLICT',error:'Request key belongs to different evidence.'},409);
  if(doc.version!==v.expected_version||s.source_revision!==v.expected_source_revision)
   return reply({ok:false,code:'SOURCE_OR_JOURNAL_CHANGED',
    error:'Original Product/media/lot facts or owner review changed. Reload before recording.'},409);
  if(doc.receipts.length>=40)return reply({ok:false,error:'Journal limit reached; separate archive decision needed.'},409);
  if(s.dovlin&&!v.declares_dovlin)return reply({ok:false,code:'DOVLIN_MUST_BE_DECLARED',
   error:'This Product identifies as Dovlin; preserve the approved original design requirements.'},409);
  const complete=v.sample_evidence==='observed_real_sample'&&
   v.rights_evidence==='original_permission_seen'&&v.safety_evidence==='original_document_seen'&&
   (!s.dovlin&&!v.declares_dovlin||v.dovlin_design_evidence==='approved_original_compared')&&
   !s.holds.some(h=>h!=='DOVLIN_ORIGINAL_ARTWORK_AND_SAFETY_PROOF_NOT_IN_SOURCE');
  const review_state=v.decision==='owner_review_only'&&complete?
   'OWNER_ATTESTED_EXTERNAL_ACCEPTANCE_PENDING':'OWNER_HOLD';
  const receipt={receipt_id:crypto.randomUUID(),recorded_at:new Date().toISOString(),
   actor_user_id:a.admin.user_id,request_key:v.request_key,payload_sha256,
   product_id:v.product_id,product_name:clean(s.facts.product.name,150),
   source_revision:s.source_revision,source_holds:s.holds,review_state,
   sample_evidence:v.sample_evidence,rights_evidence:v.rights_evidence,
   safety_evidence:v.safety_evidence,dovlin_design_evidence:v.dovlin_design_evidence,
   applies_to_dovlin:s.dovlin||v.declares_dovlin,note:v.note,
   owner_attestation_only:true,external_verification:false,product_published:false,
   inventory_mutated:false,safety_certified:false,master_event_sent:false};
  const next={schema:659,version:doc.version+1,receipts:[receipt,...doc.receipts]};
  const packed=JSON.stringify(next);if(packed.length>64000)
   return reply({ok:false,error:'Private review storage cap reached.'},413);
  const mutation=row?await a.db.prepare(`UPDATE app_settings SET setting_value=?,is_public=0,
   updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=?
   AND is_public=0 AND setting_value=?`).bind(packed,a.admin.user_id,PREFIX+v.product_id,row.setting_value).run():
   await a.db.prepare(`INSERT INTO app_settings(setting_key,setting_value,is_public,
   updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP)
   ON CONFLICT(setting_key) DO NOTHING`).bind(PREFIX+v.product_id,packed,a.admin.user_id).run();
  if(Number(mutation?.meta?.changes)!==1)return reply({ok:false,code:'CONCURRENT_REVIEW',
   error:'Private review changed. Inspect original key before another action.'},409);
  const persisted=await journal(a.db,v.product_id).catch(()=>null);
  if(persisted?.doc.receipts[0]?.receipt_id!==receipt.receipt_id)
   return reply({ok:false,code:'UNKNOWN_SAVE',error:'Save outcome uncertain. Look up the request key; do not automatically retry.'},503);
  let audited=true;try{await a.db.prepare(`INSERT INTO admin_action_audit
   (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at)
   VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(a.admin.user_id,'product_finish_review_659',
   'product',String(v.product_id),'POST','/api/admin/product-finish-review-659',
   JSON.stringify({receipt_id:receipt.receipt_id,review_state,source_revision:s.source_revision})).run();}
  catch{audited=false;}
  return reply({ok:true,saved:true,receipt,version:next.version,audit_recorded:audited,
   warning:audited?null:'Receipt saved, separate audit failed; do not duplicate.',
   canonical_product_changed:false,no_automatic_retry:true});
 }catch{return reply({ok:false,code:'SOURCE_OR_STORAGE_HOLD',
  error:'Original Product/media/finished-lot source or private journal failed. Inspect original request key first.'},503);}}
