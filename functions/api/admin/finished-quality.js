// Release 467 Build 447: private maker-quality attempt history and human release decisions.
// Never posts stock, publishes a Product, activates Etsy or overwrites Creative/QA source evidence.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';

const rows=result=>Array.isArray(result?.results)?result.results:[];
const id=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
const clean=(value,max=1800)=>String(value??'').trim().slice(0,max);
const safeKey=value=>/^[A-Za-z0-9_-]{16,80}$/.test(value);
const statuses=new Set(['first_quality','second_quality','reject','scrap','salvage','abandoned','learning_only']);
const safetyStates=new Set(['safe','unsafe','unreviewed']);
const decisions=new Set(['hold','internal_only','approved_for_sale']);
const reply=(data,status=200)=>jsonResponse({release:467,build:447,...data},status,{'Cache-Control':'no-store'});
const boundary=Object.freeze({private_evidence:true,inventory_mutation:false,product_activation:false,provider_listing:false,automatic_quality_approval:false,manual_release_gate:true});
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)))),b=>b.toString(16).padStart(2,'0')).join('');

async function access(context){
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin)return {error:reply({ok:false,error:'Administrator sign-in required.'},401)};
 const db=getDb(context.env);if(!db)return {error:reply({ok:false,error:'D1 is unavailable.'},503)};
 const ready=await db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name IN ('maker_quality_attempts','maker_quality_release_reviews','maker_quality_product_links','maker_quality_recovery_links')").first().catch(()=>null);
 if(Number(ready?.n)!==4)return {error:reply({ok:false,error:'Build 447 canonical migration 0043 must be applied before quality decisions can be recorded.',code:'MIGRATION_REQUIRED'},503)};
 return {admin,db};
}
async function projectView(db,projectId){
 if(!projectId)return {project:null,attempts:[],evidence_events:[],traveler_runs:[],historical_runs:[],reversal_receipts:[]};
 const project=await db.prepare('SELECT creative_work_project_id,project_title,project_status FROM creative_work_projects WHERE creative_work_project_id=?').bind(projectId).first();
 if(!project)return null;
 const [attempts,evidence,runs,historical,reversals]=await Promise.all([
  db.prepare(`SELECT a.*,(SELECT r.decision FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=a.maker_quality_attempt_id ORDER BY r.maker_quality_release_review_id DESC LIMIT 1) current_release_decision,
   (SELECT COUNT(*) FROM maker_quality_release_reviews r WHERE r.maker_quality_attempt_id=a.maker_quality_attempt_id) review_count,
   (SELECT product_id FROM maker_quality_product_links l WHERE l.maker_quality_attempt_id=a.maker_quality_attempt_id LIMIT 1) linked_product_id,
   (SELECT COUNT(*) FROM maker_quality_recovery_links l WHERE l.maker_quality_attempt_id=a.maker_quality_attempt_id) linked_recoveries,
   CASE WHEN e.media_url IS NOT NULL AND length(trim(e.media_url))>0 THEN 1 ELSE 0 END photo_attached
   FROM maker_quality_attempts a LEFT JOIN creative_work_events e ON e.creative_work_event_id=a.creative_work_event_id
   WHERE a.creative_work_project_id=? ORDER BY a.maker_quality_attempt_id DESC LIMIT 100`).bind(projectId).all(),
  db.prepare(`SELECT creative_work_event_id,event_title,entry_status,CASE WHEN media_url IS NULL OR trim(media_url)='' THEN 0 ELSE 1 END has_media
    FROM creative_work_events WHERE creative_work_project_id=? AND entry_status='active' ORDER BY creative_work_event_id DESC LIMIT 80`).bind(projectId).all(),
  db.prepare('SELECT maker_traveler_run_id,creative_project_job_traveler_id,created_at FROM maker_traveler_runs WHERE creative_work_project_id=? ORDER BY maker_traveler_run_id DESC LIMIT 40').bind(projectId).all(),
  db.prepare('SELECT creative_project_production_run_id,run_identifier,run_status,accepted_quantity,actual_quantity FROM creative_project_production_runs WHERE creative_work_project_id=? ORDER BY creative_project_production_run_id DESC LIMIT 40').bind(projectId).all(),
  db.prepare(`SELECT v.creative_project_inventory_reversal_id,v.creative_project_inventory_post_id,v.stock_quantity_restored,v.authorized_at,i.item_name
   FROM creative_project_inventory_reversals v JOIN creative_project_inventory_posts p ON p.creative_project_inventory_post_id=v.creative_project_inventory_post_id
   JOIN site_item_inventory i ON i.site_item_inventory_id=p.site_item_inventory_id
   WHERE p.creative_work_project_id=? AND NOT EXISTS(SELECT 1 FROM maker_quality_recovery_links l WHERE l.creative_project_inventory_reversal_id=v.creative_project_inventory_reversal_id)
   ORDER BY v.creative_project_inventory_reversal_id DESC LIMIT 60`).bind(projectId).all()
 ]);
 return {project,attempts:rows(attempts),evidence_events:rows(evidence),traveler_runs:rows(runs),historical_runs:rows(historical),reversal_receipts:rows(reversals)};
}
async function getData(db,projectId){
 const projects=rows(await db.prepare('SELECT creative_work_project_id,project_title,project_status FROM creative_work_projects ORDER BY creative_work_project_id DESC LIMIT 100').all());
 return {ok:true,projects,selected:await projectView(db,projectId),boundary};
}
async function insert(a,action,body,actor,key,hash){
 const projectId=id(body.project_id),attemptId=id(body.attempt_id);
 if(action==='record_attempt'){
  const label=clean(body.attempt_key,100),outcome=clean(body.outcome,30),safety=clean(body.safety_state,30),qty=Number(body.attempted_quantity),unit=clean(body.quantity_unit,50),reason=clean(body.failure_cause)||null,repair=clean(body.repair_notes)||null,lesson=clean(body.lessons_learned),eventId=id(body.creative_work_event_id)||null,traveler=id(body.maker_traveler_run_id)||null,historical=id(body.creative_project_production_run_id)||null,parent=id(body.parent_attempt_id)||null;
  if(!projectId||!label||!statuses.has(outcome)||!safetyStates.has(safety)||!Number.isFinite(qty)||qty<=0||!unit||lesson.length<12)return reply({ok:false,error:'Choose a project, outcome, safety state, positive quantity, unit and a lesson of at least 12 characters.'},400);
  if(['reject','scrap','salvage','abandoned'].includes(outcome)&&(!reason||reason.length<12))return reply({ok:false,error:'A 12-character cause is required for failed, scrapped, salvaged and abandoned attempts.'},400);
  if(parent&&(!repair||repair.length<12))return reply({ok:false,error:'Rework must explain the repair and reference an earlier failed or second-quality attempt.'},400);
  if(['reject','scrap','abandoned','learning_only'].includes(outcome)&&safety==='safe')return reply({ok:false,error:'Rejected, scrapped, abandoned and learning-only attempts cannot be declared sale-safe.'},400);
  const result=await a.db.prepare(`INSERT INTO maker_quality_attempts(creative_work_project_id,attempt_key,maker_traveler_run_id,creative_project_production_run_id,parent_attempt_id,outcome,safety_state,attempted_quantity,quantity_unit,failure_cause,repair_notes,lessons_learned,creative_work_event_id,reviewed_by_user_id,request_key,payload_sha256)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(projectId,label,traveler,historical,parent,outcome,safety,qty,unit,reason,repair,lesson,eventId,actor,key,hash).run();
  return {entity:'maker_quality_attempt',id:id(result.meta?.last_row_id),projectId};
 }
 if(!attemptId)return reply({ok:false,error:'Choose a saved attempt to review or link evidence.'},400);
 const attempt=await a.db.prepare('SELECT maker_quality_attempt_id,creative_work_project_id FROM maker_quality_attempts WHERE maker_quality_attempt_id=?').bind(attemptId).first();
 if(!attempt)return reply({ok:false,error:'Attempt was not found.'},404);
 if(action==='review_release'){
  const decision=clean(body.decision,40),note=clean(body.review_note);
  if(!decisions.has(decision)||note.length<12)return reply({ok:false,error:'Choose a release decision and a factual review note of 12+ characters.'},400);
  // Never put an already-public linked Product on HOLD without the operator first unpublishing it.
  if(decision!=='approved_for_sale'){
   const active=await a.db.prepare(`SELECT p.product_id FROM maker_quality_product_links l JOIN products p ON p.product_id=l.product_id
    WHERE l.maker_quality_attempt_id=? AND (p.status='active' OR p.review_status IN ('approved','published')) LIMIT 1`).bind(attemptId).first();
   if(active)return reply({ok:false,error:'Product #'+active.product_id+' is approved/active. Unpublish and return it to review in the Product Editor before applying HOLD here.'},409);
  }
  const result=await a.db.prepare('INSERT INTO maker_quality_release_reviews(maker_quality_attempt_id,decision,review_note,reviewed_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)').bind(attemptId,decision,note,actor,key,hash).run();
  return {entity:'maker_quality_review',id:id(result.meta?.last_row_id),projectId:id(attempt.creative_work_project_id)};
 }
 if(action==='link_product'){
  const productId=id(body.product_id),note=clean(body.link_note);
  if(!productId||note.length<12)return reply({ok:false,error:'Choose an existing Product ID and a factual source-link note.'},400);
  const result=await a.db.prepare('INSERT INTO maker_quality_product_links(maker_quality_attempt_id,product_id,link_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)').bind(attemptId,productId,note,actor,key,hash).run();
  return {entity:'maker_quality_product_link',id:id(result.meta?.last_row_id),projectId:id(attempt.creative_work_project_id)};
 }
 if(action==='link_recovery'){
  const reversalId=id(body.creative_project_inventory_reversal_id),note=clean(body.recovery_note);
  if(!reversalId||note.length<12)return reply({ok:false,error:'Choose an existing confirmed Inventory reversal receipt and explain the material recovery.'},400);
  const result=await a.db.prepare('INSERT INTO maker_quality_recovery_links(maker_quality_attempt_id,creative_project_inventory_reversal_id,recovery_note,linked_by_user_id,request_key,payload_sha256) VALUES(?,?,?,?,?,?)').bind(attemptId,reversalId,note,actor,key,hash).run();
  return {entity:'maker_quality_recovery_link',id:id(result.meta?.last_row_id),projectId:id(attempt.creative_work_project_id)};
 }
 return reply({ok:false,error:'Unsupported quality action.'},400);
}

export async function onRequestGet(context){
 const a=await access(context);if(a.error)return a.error;
 try{return reply(await getData(a.db,id(new URL(context.request.url).searchParams.get('project_id'))))}
 catch(error){console.error('BUILD447_READ_FAILED',error?.name);return reply({ok:false,error:'Quality evidence could not be read. Refresh safely.'},503)}
}
export async function onRequestPost(context){
 const a=await access(context);if(a.error)return a.error;
 if(context.request.headers.get('Origin')!==new URL(context.request.url).origin)return reply({ok:false,error:'Same-origin quality review required.'},403);
 let body;try{body=await context.request.json()}catch{return reply({ok:false,error:'Valid JSON is required.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return reply({ok:false,error:'Operator action object required.'},400);
 const action=clean(body.action,40),key=clean(body.request_key,80),actor=id(a.admin.user_id);
 if(!['record_attempt','review_release','link_product','link_recovery'].includes(action)||!safeKey(key)||!actor)return reply({ok:false,error:'Supported operator action, signed-in reviewer and unique request key required.'},400);
 const hash=await digest({action,actor,values:Object.fromEntries(Object.entries(body).filter(([field])=>field!=='request_key').sort(([a],[b])=>a.localeCompare(b)))});
 const table={record_attempt:['maker_quality_attempts','maker_quality_attempt_id'],review_release:['maker_quality_release_reviews','maker_quality_release_review_id'],link_product:['maker_quality_product_links','maker_quality_product_link_id'],link_recovery:['maker_quality_recovery_links','maker_quality_recovery_link_id']}[action];
 const prior=await a.db.prepare('SELECT '+table[1]+' receipt_id,'+(action==='link_product'||action==='link_recovery'?'linked_by_user_id':'reviewed_by_user_id')+' actor_id,payload_sha256 FROM '+table[0]+' WHERE request_key=?').bind(key).first().catch(()=>null);
 if(prior)return Number(prior.actor_id)===actor&&prior.payload_sha256===hash
  ?reply({ok:true,replayed:true,receipt_id:prior.receipt_id,boundary})
  :reply({ok:false,error:'This request key was used for another review. Refresh before retrying.',code:'REQUEST_KEY_REUSED'},409);
 try{
  const result=await insert(a,action,body,actor,key,hash);
  if(result?.status&&result?.body)return result;
  if(result?.entity){
   await auditAdminAction(context.env,context.request,a.admin,{action_type:'build447_'+action,target_type:result.entity,target_id:result.id,details:{project_id:result.projectId,receipt_id:result.id,boundary}});
   return reply({ok:true,receipt_id:result.id,project_id:result.projectId,selected:await projectView(a.db,result.projectId),boundary});
  }
  return result;
 }catch(error){
  console.error('BUILD447_WRITE_FAILED',error?.name);
  const retried=await a.db.prepare('SELECT '+table[1]+' receipt_id,payload_sha256 FROM '+table[0]+' WHERE request_key=?').bind(key).first().catch(()=>null);
  if(retried&&retried.payload_sha256===hash)return reply({ok:true,receipt_id:retried.receipt_id,replayed:true,boundary});
  const reason=String(error?.message||'');
  const known={quality_unfit_for_sale:'The piece is not sale-ready. First/second quality, safe inspection, a real active photo and passing linked QA are required.',
   quality_unpublish_product_before_hold:'Deactivate and unapprove the already-linked Product in Product Editor before recording HOLD.',
   quality_recovery_wrong_project_or_unconfirmed:'The selected Inventory return is not a posted, confirmed reversal from this same Creative Project.',
   quality_product_requires_safe_approved:'This Product may only link to a piece whose latest quality review explicitly approves its sale.',
   quality_repair_parent_invalid:'A repaired piece needs a valid earlier failed/second-quality attempt from this same project.',
   quality_photo_evidence_wrong_project_or_void:'Choose an active Creative Process event belonging to this same project.'};
  const code=Object.keys(known).find(k=>reason.includes(k))||'QUALITY_VALIDATION_OR_STALE';
  return reply({ok:false,code,error:known[code]||'This outcome was not confirmed. Check source project, QA, evidence, stock receipt and sale gate; refresh before retrying.'},409);
 }
}
