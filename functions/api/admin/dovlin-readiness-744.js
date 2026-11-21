/** Build 744 — Dovlin private original art, real sample, materials BOM and owner-readiness journal.
 * Real owner actions only. No SKU, inventory, checkout, publication, migrations,
 * R2 writes, provider calls or accounting postings. Unverified values stay HOLD.
 */
import {getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {DOVLIN_SOURCE_744,DOVLIN_SOURCE_744_BY_ID} from '../_lib/dovlinSource744.mjs';

const PREFIX='site.admin.dovlin.readiness.v744.';
const VERSION=744;
const reply=(data,status=200)=>jsonResponse({release:467,build:VERSION,...data},status,{
 'Cache-Control':'private, no-store, max-age=0',
 'X-Robots-Tag':'noindex, nofollow, noarchive',
 'Vary':'Cookie',
 'X-Content-Type-Options':'nosniff'
});
const clean=(v,n=300)=>String(v??'').trim().slice(0,n);
const sha40=x=>/^[0-9a-f]{40}$/.test(String(x||''));
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(x||''));
const int=v=>Number.isSafeInteger(Number(v))&&Number(v)>=0?Number(v):null;
const money=v=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=100000000?v:null;
const rows=x=>Array.isArray(x?.results)?x.results:[];

function owner(ctx) {
 const admin=verifiedAdminFromModule(ctx);
 if(!admin)return {error:reply({ok:false,code:'VERIFIED_ADMIN_REQUIRED',error:'An active original Creator Admin grant is required.'},403)};
 const db=getDb(ctx.env);
 if(!db)return {error:reply({ok:false,code:'CANONICAL_DB_UNAVAILABLE',error:'Canonical database not available. No source facts changed.'},503)};
 return {admin,db};
}
function blank(){return {schema:744,version:0,current:null,receipts:[]};}
function decode(row){
 if(!row)return blank();
 if(Number(row.is_public)!==0)throw Error('Dovlin journal unexpectedly public');
 const doc=JSON.parse(row.setting_value);
 if(doc?.schema!==744||!Number.isSafeInteger(doc.version)||doc.version<0||
 !Array.isArray(doc.receipts)||doc.receipts.length>24||doc.current===undefined)
  throw Error('Dovlin journal schema invalid');
 return doc;
}
async function one(db,id){
 const row=await db.prepare('SELECT setting_value,is_public FROM app_settings WHERE setting_key=? LIMIT 1')
  .bind(PREFIX+id).first();
 return {row,doc:decode(row)};
}
async function all(db){
 const records=rows(await db.prepare('SELECT setting_key,setting_value,is_public FROM app_settings WHERE setting_key LIKE ? ORDER BY setting_key LIMIT 80').bind(PREFIX+'%').all());
 if(records.length>68)throw Error('Unexpected journal count');
 const keyed=new Map();
 for(const row of records){
  if(Number(row.is_public)!==0)throw Error('Private Dovlin journal is unexpectedly public');
  const id=String(row.setting_key||'').slice(PREFIX.length);
  if(!DOVLIN_SOURCE_744_BY_ID.has(id)||keyed.has(id))throw Error('Unexpected journal identity');
  keyed.set(id,decode(row));
 }
 return keyed;
}
function evaluate(source,doc) {
 const data=doc?.current;
 if(!data)return {stage:'NOT_REVIEWED',holds:['ARTWORK_NOT_COMPARED','NO_PHYSICAL_SAMPLE','BOM_NOT_VERIFIED','SAFETY_CARE_NOT_REVIEWED'],planning_cost_cents:null,external_approval:false,commercial_release:false};
 const e=data.evidence;
 const art=e.art_decision==='owner_compared'&&sha40(e.art_git_sha)&&e.art_git_sha===source.sha&&
  e.original_png_ref.length>=8&&e.art_comparison_ref.length>=8&&e.geometry_note.length>=20;
 const artHold=source.provisional||!art;
 const sample=e.sample_observed===true&&e.sample_ref.length>=8&&
  ['height_mm','width_mm','depth_mm'].every(k=>Number.isFinite(e[k])&&e[k]>0&&e[k]<=2000);
 const materials=e.bom_revision.length>=3&&e.components.length>0&&e.components.every(x=>
  x.component.length>=2&&x.material.length>=2&&x.supplier.length>=2&&x.lot.length>=2&&
  x.evidence_ref.length>=8&&x.unit.length>=1&&x.quantity>0&&Number.isInteger(x.unit_cost_cents)&&x.unit_cost_cents>=0);
 const safety=e.safety_state==='documents_recorded'&&e.safety_evidence_ref.length>=8&&
  e.care_note.length>=20&&e.age_basis.length>=4;
 const holds=[...(artHold?[source.provisional?'PROVISIONAL_CHARACTER_ART_NEEDS_APPROVED_SOURCE':'ARTWORK_OWNER_COMPARISON_MISSING']:[]),
  ...(!sample?['PHYSICAL_SAMPLE_NOT_VERIFIED']:[]),...(!materials?['MATERIAL_BOM_INCOMPLETE']:[]),
  ...(!safety?['SAFETY_AND_CARE_REVIEW_UNVERIFIED']:[]),
  ...(e.decision!=='submit_for_independent_review'?['OWNER_SUBMISSION_HOLD']:[])];
 const subtotal=materials?e.components.reduce((a,x)=>a+x.quantity*x.unit_cost_cents,0):null;
 const planning_cost_cents=subtotal===null?null:
  Math.round(subtotal*(1+e.waste_percent/100)+(e.labour_minutes/60)*e.labour_rate_cents);
 // The review can be submitted for another human's independent review, never for sale.
 const stage=holds.length?'HOLD_NEEDS_EVIDENCE':'OWNER_PACKET_READY_FOR_INDEPENDENT_REVIEW';
 return {stage,holds,planning_cost_cents,
  material_subtotal_cents:subtotal,
  owner_attestation_only:art,
  independently_verified:false,
  external_approval:false,
  commercial_release:false,
  product_published:false,
  inventory_created:false,
  financial_posting:false};
}
function validate(raw,source){
 const version=int(raw.expected_version),key=clean(raw.request_key,36).toLowerCase();
 if(version===null||!uuid(key))throw Error('Load a current record before submitting; a unique request key is required.');
 if(clean(raw.expected_source_sha,40)!==source.sha)throw Error('Original source art changed; review the new image before recording evidence.');
 const e=raw.evidence;
 if(!e||typeof e!=='object'||Array.isArray(e))throw Error('Artwork, actual sample and BOM evidence object is required.');
 const art_decision=clean(e.art_decision,30);
 const safety_state=clean(e.safety_state,30);
 const decision=clean(e.decision,40);
 if(!['hold','owner_compared'].includes(art_decision)||
    !['not_verified','documents_recorded'].includes(safety_state)||
    !['hold','submit_for_independent_review'].includes(decision)||
    typeof e.sample_observed!=='boolean')throw Error('One or more evidence decisions is invalid.');
 const bom=Array.isArray(e.components)?e.components:[];
 if(bom.length>16)throw Error('A maximum of 16 BOM components may be recorded per concept revision.');
 const components=bom.map(x=>{
  if(!x||typeof x!=='object')throw Error('Invalid BOM line.');
  const unit_cost_cents=money(x.unit_cost_cents),quantity=Number(x.quantity);
  if(!Number.isFinite(quantity)||quantity<0||quantity>100000||Math.round(quantity*1000)!==quantity*1000||
     unit_cost_cents===null)throw Error('BOM quantities must be 0–100,000 with up to 3 decimals; CAD cents must be nonnegative integers.');
  return {component:clean(x.component,90),material:clean(x.material,130),supplier:clean(x.supplier,120),
   lot:clean(x.lot,110),unit:clean(x.unit,32),quantity,unit_cost_cents,
   evidence_ref:clean(x.evidence_ref,220)};
 });
 const dimensions={};
 for(const k of ['height_mm','width_mm','depth_mm']){
  const v=e[k]===null||e[k]===''||e[k]===undefined?null:Number(e[k]);
  if(v!==null&&(!Number.isFinite(v)||v<0||v>2000))throw Error('Physical dimensions must be actual measurements in mm.');
  dimensions[k]=v;
 }
 const waste_percent=Number(e.waste_percent??0),labour_minutes=Number(e.labour_minutes??0),
   labour_rate_cents=money(e.labour_rate_cents??0);
 if(!Number.isFinite(waste_percent)||waste_percent<0||waste_percent>100||
 !Number.isFinite(labour_minutes)||labour_minutes<0||labour_minutes>100000||
 labour_rate_cents===null)throw Error('CAD labour rate, waste percentage and minutes must be factual nonnegative planning values.');
 const out={art_decision,art_git_sha:clean(e.art_git_sha,40).toLowerCase(),
  original_png_ref:clean(e.original_png_ref,220),art_comparison_ref:clean(e.art_comparison_ref,220),
  geometry_note:clean(e.geometry_note,800),
  sample_observed:e.sample_observed,sample_ref:clean(e.sample_ref,220),...dimensions,
  bom_revision:clean(e.bom_revision,80),components,waste_percent,labour_minutes,labour_rate_cents,
  safety_state,safety_evidence_ref:clean(e.safety_evidence_ref,220),
  age_basis:clean(e.age_basis,100),care_note:clean(e.care_note,700),
  independent_review_ref:clean(e.independent_review_ref,220),
  decision,note:clean(e.note,900)};
 if(out.note.length<20)throw Error('Record a factual review note of at least 20 characters.');
 if(art_decision==='owner_compared'&&
 (out.art_git_sha!==source.sha||out.original_png_ref.length<8||
 out.art_comparison_ref.length<8||out.geometry_note.length<20))
  throw Error('Owner comparison requires exact current Git image hash, original PNG reference and written geometry evidence.');
 if(e.sample_observed&&!(out.sample_ref.length>=8&&Object.values(dimensions).every(v=>v>0)))
  throw Error('A real sample needs a source reference and actual height, width and depth in millimetres.');
 if(safety_state==='documents_recorded'&&
 (out.safety_evidence_ref.length<8||out.age_basis.length<4||out.care_note.length<20))
  throw Error('Safety review needs an original supporting document, age basis and care explanation.');
 if(decision==='submit_for_independent_review'&&source.provisional)
  throw Error('The three provisional art matches cannot advance without approved original replacement imagery.');
 return {expected_version:version,request_key:key,evidence:out};
}
async function digest(v){
 const bytes=new TextEncoder().encode(JSON.stringify(v));
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function item(source,doc){
 const latest=doc.receipts?.[0]||null;
 return {id:source.id,name:source.name,kind:source.kind,category:source.category,
  art:source.art,source_sha:source.sha,original_filename:source.original,
  provisional_art_match:source.provisional,version:doc.version,
  current:doc.current,latest_receipt:latest,history:doc.receipts.slice(0,20),
  readiness:evaluate(source,doc),
  no_sale_without_separate_approval:true};
}
export async function onRequestGet(ctx){
 const {admin,db,error}=owner(ctx);if(error)return error;
 const id=new URL(ctx.request.url).searchParams.get('id');
 if(id!==null&&!DOVLIN_SOURCE_744_BY_ID.has(id))return reply({ok:false,error:'Unknown Dovlin source ID.'},404);
 try{
  if(id){const record=DOVLIN_SOURCE_744_BY_ID.get(id);
   const {doc}=await one(db,id);
   return reply({ok:true,record:item(record,doc),record_count:68,authenticated_admin_user_id:admin.user_id});}
  const docs=await all(db);
  const list=DOVLIN_SOURCE_744.map(source=>item(source,docs.get(source.id)||blank()))
   .map(({id,name,kind,category,art,source_sha,original_filename,provisional_art_match,version,readiness})=>
    ({id,name,kind,category,art,source_sha,original_filename,provisional_art_match,version,readiness}));
  return reply({ok:true,records:list,record_count:list.length,
   kinds:{plush:10,workshop:38,colour:20},
   default_status:'HOLD',authenticated_admin_user_id:admin.user_id,
   rights_and_safety_not_certified:true,no_sale_without_separate_approval:true});
 }catch{return reply({ok:false,code:'PRIVATE_EVIDENCE_READ_FAILED',
   error:'Private evidence unavailable or inconsistent. No concept released.'},503);}
}
export async function onRequestPost(ctx){
 const {admin,db,error}=owner(ctx);if(error)return error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
  return reply({ok:false,code:'SAME_ORIGIN_REQUIRED',error:'Same-origin Admin action required.'},403);
 if(!ctx.request.headers.get('Content-Type')?.toLowerCase().includes('application/json'))
  return reply({ok:false,error:'JSON review required.'},415);
 let body,payload,source;
 try{
  const raw=await ctx.request.text();
  if(raw.length>14000)throw Error('Evidence payload too large');
  body=JSON.parse(raw);
  source=DOVLIN_SOURCE_744_BY_ID.get(String(body?.id||''));
  if(!source)throw Error('Choose an original Dovlin source record.');
  payload=validate(body,source);
 }catch(e){return reply({ok:false,code:'INVALID_EVIDENCE',error:clean(e.message,220)},400);}
 try{
  const {row,doc}=await one(db,source.id);
  const payload_sha256=await digest({actor:admin.user_id,id:source.id,payload});
  const old=doc.receipts.find(x=>x.request_key===payload.request_key);
  if(old)return old.payload_sha256===payload_sha256?
   reply({ok:true,replayed:true,receipt:old,version:doc.version,no_automatic_retry:true}):
   reply({ok:false,code:'REQUEST_KEY_CONFLICT',error:'A different review already owns this request key.'},409);
  if(doc.version!==payload.expected_version)return reply({ok:false,code:'STALE_REVIEW',
    error:'This evidence record changed. Reload before trying a new review.'},409);
  if(doc.receipts.length>=24)return reply({ok:false,code:'JOURNAL_FULL',
    error:'The private receipt history is full. Archive it before recording another review.'},409);
  const data={evidence:payload.evidence,source_sha:source.sha,
   original_filename:source.original,recorded_by_user_id:admin.user_id,
   recorded_at:new Date().toISOString()};
  const computed=evaluate(source,{current:data});
  if(payload.evidence.decision==='submit_for_independent_review'&&computed.stage!=='OWNER_PACKET_READY_FOR_INDEPENDENT_REVIEW')
   return reply({ok:false,code:'EVIDENCE_HOLD',
    error:'Missing required original artwork, sample, BOM or safety facts.',
    holds:computed.holds},409);
  const receipt={receipt_id:crypto.randomUUID(),request_key:payload.request_key,
   payload_sha256,source_sha:source.sha,user_id:admin.user_id,
   recorded_at:data.recorded_at,stage:computed.stage,holds:computed.holds,
   planning_cost_cents:computed.planning_cost_cents,
   product_published:false,inventory_mutated:false,provider_used:false,
   accounting_posted:false,independent_approval:false};
  const next={schema:744,version:doc.version+1,current:data,receipts:[receipt,...doc.receipts]};
  const packed=JSON.stringify(next);
  if(packed.length>64000)return reply({ok:false,code:'STORAGE_CAP',error:'Review exceeds 64KB private storage limit.'},413);
  const result=row?
   await db.prepare('UPDATE app_settings SET setting_value=?,is_public=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=? AND is_public=0 AND setting_value=?')
    .bind(packed,admin.user_id,PREFIX+source.id,row.setting_value).run():
   await db.prepare('INSERT INTO app_settings(setting_key,setting_value,is_public,updated_by_user_id,updated_at) VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING')
    .bind(PREFIX+source.id,packed,admin.user_id).run();
  if(Number(result?.meta?.changes)!==1)return reply({ok:false,code:'CONCURRENT_REVIEW',error:'Another review won the save; reload before editing.'},409);
  const confirmed=await one(db,source.id).catch(()=>null);
  if(confirmed?.doc?.receipts?.[0]?.receipt_id!==receipt.receipt_id)
   return reply({ok:false,code:'UNKNOWN_SAVE',error:'Storage result unclear. Look up your request key; do not resubmit blindly.'},503);
  const auditOk=await auditAdminAction(ctx.env,ctx.request,admin,{
    action_type:'dovlin_original_art_sample_bom_review_744',
    target_type:'dovlin_concept',target_key:source.id,
    details:{receipt_id:receipt.receipt_id,stage:computed.stage,source_sha:source.sha}
  }).then(()=>true,()=>false);
  return reply({ok:true,saved:true,version:next.version,receipt,
   readiness:computed,audit_attempted:auditOk,
   original_source_changed:false,product_published:false,inventory_mutated:false,
   accounting_posted:false,independent_external_approval:false,no_automatic_retry:true});
 }catch{return reply({ok:false,code:'PRIVATE_EVIDENCE_STORAGE_HOLD',
   error:'Source or private evidence store unavailable. Check the request key before retrying.'},503);}
}
