/** Release 467 Build 657: additive, private workshop lifecycle REVIEW ledger.
 * Reads actual Creative Process projects/events/outputs. Never mutates those
 * canonical sources, inventory, Products, customers or Master Shell contracts. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {POLICY,STAGES,QA,PURPOSES,normalizeWorkshopReview,assertSourceEvent,
  decodeJournal,currentReview} from '../_lib/workshopLifecycle657.mjs';

const PREFIX='site.admin.workshop_production.v657.';
const respond=(x,status=200)=>jsonResponse({build:657,...x,policy:POLICY},status,
  {'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'});
const rows=r=>Array.isArray(r?.results)?r.results:[];
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
async function hash(value){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))));}
function permitted(ctx){const admin=verifiedAdminFromModule(ctx),db=getDb(ctx.env);
  if(!admin)return {response:respond({ok:false,error:'Verified active Creators Admin required.'},401)};
  if(!db)return {response:respond({ok:false,error:'Original workshop source database unavailable.'},503)};
  return {admin,db};}
function projectId(value){const s=String(value??'');if(!/^[1-9]\d{0,9}$/.test(s))return 0;
  const n=Number(s);return Number.isSafeInteger(n)&&n<=1e9?n:0;}
async function loadSource(db,id){
 const project=await db.prepare(`SELECT creative_work_project_id,project_key,project_title,
   project_type,project_status,privacy_status,rights_status,product_id,
   summary,started_at,completed_at,updated_at FROM creative_work_projects
   WHERE creative_work_project_id=? AND COALESCE(project_status,'')<>'archived' LIMIT 1`).bind(id).first();
 if(!project)return null;
 const events=rows(await db.prepare(`SELECT creative_work_event_id,event_type,event_title,event_notes,
   occurred_at,entry_status FROM creative_work_events
   WHERE creative_work_project_id=? AND COALESCE(entry_status,'active')='active'
   ORDER BY creative_work_event_id DESC LIMIT 40`).bind(id).all());
 const outputs=rows(await db.prepare(`SELECT creative_work_output_id,output_key,output_label,
   output_status,approval_status,updated_at FROM creative_work_outputs
   WHERE creative_work_project_id=? ORDER BY creative_work_output_id DESC LIMIT 40`).bind(id).all());
 const counts=await db.prepare(`SELECT COUNT(*) AS event_count FROM creative_work_events
   WHERE creative_work_project_id=? AND COALESCE(entry_status,'active')='active'`).bind(id).first();
 const total_events=Math.max(0,Number(counts?.event_count??0));
 const source_revision=await hash({project,events,outputs,total_events,review_scope:'latest_40_active_source_events_and_outputs'});
 return {project,events,outputs,total_events,source_revision,event_list_truncated:total_events>40,
   authoritative_project_status:project.project_status,
   source_note:'Project and timeline remain canonical Creative Process records. Review decisions do not change them.'};
}
async function readJournal(db,id){const row=await db.prepare(`SELECT setting_value,is_public FROM app_settings
  WHERE setting_key=? LIMIT 1`).bind(PREFIX+id).first();return {row,doc:decodeJournal(row)};}
function clientView(source,doc){return {ok:true,...source,version:doc.version,
  review_history:doc.receipts.slice(0,60),current_owner_review:currentReview(doc),
  allowed_stages:STAGES,allowed_qa:QA,allowed_purposes:PURPOSES,
  independently_verified:false,master_completion_percent:null,
  no_auto_product_or_stock_write:true};}

export async function onRequestGet(ctx){
 const access=permitted(ctx);if(access.response)return access.response;
 const params=new URL(ctx.request.url).searchParams,requested=params.get('project_id');
 const receiptKey=params.get('request_key');
 if(requested===null){
   try{const projects=rows(await access.db.prepare(`SELECT creative_work_project_id,project_key,
       project_title,project_type,project_status,privacy_status,rights_status,updated_at
       FROM creative_work_projects WHERE COALESCE(project_status,'')<>'archived'
       ORDER BY datetime(updated_at) DESC,creative_work_project_id DESC LIMIT 80`).all());
     return respond({ok:true,projects,private:true,records_auto_loaded:false});}
   catch{return respond({ok:false,error:'Unable to inspect the original Creative Project list.'},503);}
 }
 const id=projectId(requested);
 if(!id)return respond({ok:false,error:'Choose a real positive Creative Project ID.'},400);
 if(receiptKey!==null&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receiptKey))
   return respond({ok:false,error:'Invalid original review request key.'},400);
 try{
   if(receiptKey!==null){const {doc}=await readJournal(access.db,id);
     const receipt=doc.receipts.find(r=>r.request_key===receiptKey.toLowerCase());
     return respond({ok:true,project_id:id,found:Boolean(receipt),receipt:receipt||null,
       no_automatic_retry:true});}
   const source=await loadSource(access.db,id);
   if(!source)return respond({ok:false,error:'Creative Project not found or archived.'},404);
   const {doc}=await readJournal(access.db,id);
   return respond(clientView(source,doc));
 }catch{return respond({ok:false,error:'Original source or private workshop review unavailable. No cached approval returned.'},503);}
}

export async function onRequestPost(ctx){
 const access=permitted(ctx);if(access.response)return access.response;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)
   return respond({ok:false,error:'Same-origin owner submission required.'},403);
 if(!ctx.request.headers.get('Content-Type')?.toLowerCase().includes('application/json'))
   return respond({ok:false,error:'JSON content type required.'},415);
 let body;try{body=await ctx.request.json();}catch{return respond({ok:false,error:'Valid exact JSON review required.'},400);}
 let review;try{review=normalizeWorkshopReview(body);}catch(e){return respond({ok:false,error:e.message},400);}
 try{
   const source=await loadSource(access.db,review.project_id);
   if(!source)return respond({ok:false,error:'Canonical project no longer exists or is archived.'},404);
   const {row,doc}=await readJournal(access.db,review.project_id);
   const fingerprint=await hash({actor_user_id:access.admin.user_id,...review});
   const prior=doc.receipts.find(r=>r.request_key===review.request_key);
   if(prior)return prior.payload_sha256===fingerprint
     ?respond({ok:true,replayed:true,receipt:prior,version:doc.version,no_automatic_retry:true})
     :respond({ok:false,code:'IDEMPOTENCY_CONFLICT',error:'Original request key belongs to different evidence.'},409);
   if(source.source_revision!==review.expected_source_revision)
     return respond({ok:false,code:'SOURCE_DRIFT',error:'Original project, timeline or output source changed. Reload before reviewing.'},409);
   if(review.expected_version!==doc.version)
     return respond({ok:false,code:'STALE_WORKSHOP_REVIEW',error:'Another owner saved a decision. Reload the source before review.'},409);
   if(['completed','finished_private'].includes(review.stage)&&
      ['idea','planning'].includes(String(source.project.project_status).toLowerCase()))
     return respond({ok:false,code:'CANONICAL_STAGE_HOLD',
       error:'Original project is still idea/planning. Advance the canonical project through its authorized workflow before a terminal owner review.'},409);
   if(doc.receipts.length>=120)
     return respond({ok:false,code:'REVIEW_HISTORY_FULL',error:'Private review history cap reached. Require approved archive, not overwritten facts.'},409);
   let sourceEvent;try{sourceEvent=assertSourceEvent(review,source.events);}catch(e){return respond({ok:false,error:e.message},400);}
   const receipt={receipt_id:crypto.randomUUID(),request_key:review.request_key,
     project_id:review.project_id,project_key:String(source.project.project_key),
     canonical_project_status:String(source.project.project_status),
     source_revision:source.source_revision,
     source_event_id:review.source_event_id,
     source_event_type:sourceEvent?String(sourceEvent.event_type):null,
     stage:review.stage,progress_percent:review.progress_percent,purpose:review.purpose,
     qa_decision:review.qa_decision,observed_at:review.observed_at,
     review_note:review.review_note,actor_user_id:access.admin.user_id,
     recorded_at:new Date().toISOString(),payload_sha256:fingerprint,
     independently_verified:false,product_or_stock_changed:false,master_event_sent:false};
   const next={schema:657,version:doc.version+1,receipts:[receipt,...doc.receipts]};
   const packed=JSON.stringify(next);
   if(packed.length>63000)return respond({ok:false,error:'Private workshop history has reached the protected size cap.'},413);
   const write=row?await access.db.prepare(`UPDATE app_settings SET setting_value=?,is_public=0,
      updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=?
      AND is_public=0 AND setting_value=?`)
       .bind(packed,access.admin.user_id,PREFIX+review.project_id,row.setting_value).run():
       await access.db.prepare(`INSERT INTO app_settings
      (setting_key,setting_value,is_public,updated_by_user_id,updated_at)
      VALUES(?,?,0,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO NOTHING`)
       .bind(PREFIX+review.project_id,packed,access.admin.user_id).run();
   if(Number(write?.meta?.changes)!==1)
     return respond({ok:false,code:'STALE_WORKSHOP_REVIEW',error:'Concurrent review changed private history. Inspect original request key before retry.'},409);
   const persisted=await readJournal(access.db,review.project_id).catch(()=>null);
   if(!persisted||persisted.doc.version!==next.version||persisted.doc.receipts[0]?.receipt_id!==receipt.receipt_id)
     return respond({ok:false,code:'SAVE_OUTCOME_UNKNOWN',error:'Source write outcome unknown; check original receipt key. No automatic retry.'},503);
   let audit_recorded=true;
   try{await access.db.prepare(`INSERT INTO admin_action_audit
     (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at)
     VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
     .bind(access.admin.user_id,'workshop_657_review_'+review.qa_decision,
       'creative_work_project',String(review.project_id),'POST','/api/admin/workshop-production-657',
       JSON.stringify({receipt_id:receipt.receipt_id,source_revision:source.source_revision,
         owner_attested:true,independently_verified:false,product_or_stock_changed:false})).run();}
   catch{audit_recorded=false;}
   const refreshed=await loadSource(access.db,review.project_id).catch(()=>null);
   const source_current=Boolean(refreshed&&refreshed.source_revision===source.source_revision);
   return respond({ok:true,saved:true,version:next.version,receipt,audit_recorded,source_current,
     warning:!source_current?'Review saved, but the original source may have changed. Reload before further decisions.':
       !audit_recorded?'Private review saved but audit insertion failed; preserve original receipt and do not repeat.':null,
     original_project_status_updated:false,master_completion_percent:null});
 }catch{return respond({ok:false,code:'SOURCE_STORAGE_HOLD',
   error:'Source or private evidence storage unavailable. Check original receipt key; do not retry automatically.'},503);}
}
