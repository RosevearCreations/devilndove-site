// Release 467 Build 382: human-reviewed cross-authority commission lifecycle evidence.
// All quotes, payments, orders, proof approvals and manufacturing projects remain source-owned.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {EVENTS,STAGES,eventGuard,positive} from './_lib/commissionRules.js';
const list=r=>Array.isArray(r?.results)?r.results:[];
const out=(d,s=200)=>jsonResponse({build:382,...d},s,{'Cache-Control':'no-store'});
const clean=(v,n=1200)=>String(v??'').trim().slice(0,n);
async function access(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return {response:out({ok:false,error:'Administrator authentication required.',code:'AUTH_REQUIRED'},401)};
 const db=getDb(ctx.env);
 if(!db)return {response:out({ok:false,error:'Database binding unavailable.',code:'D1_MISSING'},503)};
 return {db,admin};
}
async function commission(db,requestId){
 const req=await db.prepare(`SELECT custom_request_id,request_key,name,email,request_type,product_interest,status,
  quantity,project_intent,deadline_date,budget_cents,created_at,updated_at FROM custom_requests WHERE custom_request_id=? LIMIT 1`).bind(requestId).first();
 if(!req)return null;
 const [q,rv,pay,proof,job,lifecycle,links,history]=await Promise.all([
  db.prepare(`SELECT custom_request_quote_draft_id,quote_key,quote_status,quote_total_cents,updated_at FROM custom_request_quote_drafts WHERE custom_request_id=? LIMIT 1`).bind(requestId).first(),
  db.prepare(`SELECT custom_request_quote_revision_id,quote_draft_id,revision_status,revision_type,revision_notes,created_at FROM custom_request_quote_revisions
   WHERE custom_request_id=? ORDER BY custom_request_quote_revision_id DESC LIMIT 21`).bind(requestId).all(),
  db.prepare(`SELECT custom_request_payment_request_draft_id,quote_draft_id,payment_request_status,request_type,amount_cents,currency,due_date,created_at FROM custom_request_payment_request_drafts
   WHERE custom_request_id=? ORDER BY custom_request_payment_request_draft_id DESC LIMIT 21`).bind(requestId).all(),
  db.prepare(`SELECT custom_request_proof_version_id,version_number,proof_status,internal_production_approval_required,internal_production_approval_status,updated_at
   FROM custom_request_proof_versions WHERE custom_request_id=? ORDER BY version_number DESC LIMIT 21`).bind(requestId).all(),
  db.prepare(`SELECT custom_request_job_draft_id,job_key,job_status,source_quote_draft_id,created_at FROM custom_request_job_drafts WHERE custom_request_id=? LIMIT 1`).bind(requestId).first(),
  db.prepare(`SELECT l.creative_project_manufacturing_lifecycle_id,l.creative_work_project_id,l.current_stage,p.project_title
   FROM creative_project_manufacturing_lifecycles l LEFT JOIN creative_work_projects p ON p.creative_work_project_id=l.creative_work_project_id
   WHERE l.custom_request_id=? LIMIT 1`).bind(requestId).first(),
  db.prepare(`SELECT custom_request_order_status_link_id,link_status,order_id,created_at FROM custom_request_order_status_links
   WHERE custom_request_id=? AND COALESCE(link_status,'active') NOT IN ('void','expired') AND voided_at IS NULL AND expired_at IS NULL
   ORDER BY custom_request_order_status_link_id DESC LIMIT 10`).bind(requestId).all(),
  db.prepare(`SELECT custom_request_commission_event_id,event_kind,source_quote_draft_id,source_quote_revision_id,source_payment_request_draft_id,
    source_proof_version_id,source_job_draft_id,source_creative_project_id,progress_stage,customer_visible,public_progress_message,
    internal_note,actor_user_id,created_at FROM custom_request_commission_events WHERE custom_request_id=?
    ORDER BY custom_request_commission_event_id DESC LIMIT 101`).bind(requestId).all()
 ]);
 let evidenceCount=0;
 if(lifecycle?.creative_work_project_id){
  const id=positive(lifecycle.creative_work_project_id);
  const record=await db.prepare(`SELECT
   (SELECT COUNT(*) FROM creative_work_order_events WHERE creative_work_project_id=? AND event_kind IN ('time','milestone'))+
   (SELECT COUNT(*) FROM creative_project_production_cost_evidence WHERE creative_work_project_id=? AND evidence_status='active') AS count`).bind(id,id).first();
  evidenceCount=Number(record?.count||0);
 }
 return {request:req,quote:q,revisions:list(rv),payment_request_drafts:list(pay),proof_versions:list(proof),job_draft:job,
  manufacturing:lifecycle,existing_customer_order_links:list(links),history:list(history).slice(0,100),
  history_truncated:list(history).length>100,production_evidence_count:evidenceCount,
  public_progress_gate:'EXPLICIT_ADMIN_APPROVAL_WITH_ACTIVE_CUSTOMER_ORDER_LINK',source_payment_status:'SOURCE_ONLY_NO_SETTLEMENT_INFERENCE'};
}
const safety={automatic_quotation:false,automatic_deposit_charge:false,payment_settlement_inferred:false,
 automatic_customer_approval:false,automatic_production_handoff:false,automatic_customer_message:false,
 quote_authority:'custom_request_quote_drafts',customer_proof_authority:'custom_request_proof_versions',
 payment_authority:'custom_request_payment_request_drafts/checkout',job_authority:'custom_request_job_drafts',
 public_progress_only_via_existing_order_link:true,private_media_exposure:false,request_time_ddl:false};
export async function onRequestGet(ctx){
 const auth=await access(ctx);if(auth.response)return auth.response;
 const query=new URL(ctx.request.url).searchParams,raw=query.get('request_id');
 try{
  if(!raw){
   const requests=list(await auth.db.prepare(`SELECT r.custom_request_id,r.request_key,r.name,r.request_type,r.product_interest,r.status,r.updated_at,
    (SELECT quote_status FROM custom_request_quote_drafts q WHERE q.custom_request_id=r.custom_request_id LIMIT 1) quote_status,
    (SELECT MAX(custom_request_commission_event_id) FROM custom_request_commission_events e WHERE e.custom_request_id=r.custom_request_id) latest_commission_event_id
    FROM custom_requests r WHERE COALESCE(r.status,'new')<>'archived'
    ORDER BY r.custom_request_id DESC LIMIT 101`).all());
   return out({ok:true,requests:requests.slice(0,100),requests_truncated:requests.length>100,safety,events:EVENTS,progress_stages:STAGES});
  }
  if(!positive(raw)||String(positive(raw))!==raw)return out({ok:false,error:'A valid request ID is required.'},400);
  const source=await commission(auth.db,positive(raw));
  return source?out({ok:true,...source,safety,events:EVENTS,progress_stages:STAGES}):out({ok:false,error:'Custom request not found.'},404);
 }catch(e){console.error('COMMISSION_READ_FAILED',e?.name||'Error');return out({ok:false,error:'Commission sources unavailable.',code:'COMMISSION_SOURCE_FAILED'},503);}
}
export async function onRequestPost(ctx){
 const auth=await access(ctx);if(auth.response)return auth.response;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return out({ok:false,error:'Same-origin admin request required.',code:'ORIGIN_REQUIRED'},403);
 let b;try{b=await ctx.request.json()}catch{return out({ok:false,error:'Invalid JSON body.'},400)}
 const requestId=positive(b.request_id),kind=clean(b.event_kind,40),note=clean(b.internal_note,1200);
 const key=clean(b.request_key,80),message=clean(b.public_progress_message,240);
 const stage=clean(b.progress_stage,40);
 if(!requestId||!EVENTS.includes(kind)||note.length<12||!/^[-_a-zA-Z0-9]{16,80}$/.test(key))
  return out({ok:false,error:'Select a request and lifecycle event; enter factual operator notes (12+ characters) and a unique request key.'},400);
 if(kind==='progress_approval'&&message.length<12)return out({ok:false,error:'Customer-visible wording requires 12–240 reviewed characters.'},400);
 const sourceIds={quote:positive(b.source_quote_draft_id),revision:positive(b.source_quote_revision_id),payment:positive(b.source_payment_request_draft_id),
  proof:positive(b.source_proof_version_id),job:positive(b.source_job_draft_id),project:positive(b.source_creative_project_id)};
 try{
  const snapshot=await commission(auth.db,requestId);if(!snapshot)return out({ok:false,error:'Custom request not found.'},404);
  const lookup=(arr,field,id)=>arr.find(x=>Number(x[field])===id)||null;
  const source={
   quote:sourceIds.quote&&Number(snapshot.quote?.custom_request_quote_draft_id)===sourceIds.quote?snapshot.quote:null,
   revision:lookup(snapshot.revisions,'custom_request_quote_revision_id',sourceIds.revision),
   paymentRequest:lookup(snapshot.payment_request_drafts,'custom_request_payment_request_draft_id',sourceIds.payment),
   proof:lookup(snapshot.proof_versions,'custom_request_proof_version_id',sourceIds.proof),
   job:sourceIds.job&&Number(snapshot.job_draft?.custom_request_job_draft_id)===sourceIds.job?snapshot.job_draft:null,
   activeOrderLink:snapshot.existing_customer_order_links.length>0,
   actualEvidence:snapshot.production_evidence_count>0,stage,requestStatus:String(snapshot.request.status||'')
  };
  if(sourceIds.project&&sourceIds.project!==Number(snapshot.manufacturing?.creative_work_project_id||0))
   return out({ok:false,error:'Project is not linked to this request via manufacturing authority.',code:'PROJECT_SCOPE_MISMATCH'},409);
  if(sourceIds.quote&&!source.quote||sourceIds.revision&&!source.revision||sourceIds.payment&&!source.paymentRequest||sourceIds.proof&&!source.proof||sourceIds.job&&!source.job)
   return out({ok:false,error:'Selected reference is not part of this custom request.',code:'SOURCE_SCOPE_MISMATCH'},409);
  if(source.revision&&sourceIds.quote&&Number(source.revision.quote_draft_id||0)!==sourceIds.quote)
   return out({ok:false,error:'Quote revision belongs to a different quote.',code:'REVISION_QUOTE_MISMATCH'},409);
  const denial=eventGuard(kind,source);
  if(denial)return out({ok:false,error:denial,code:denial},409);
  let eventId;
  try{
   const result=await auth.db.prepare(`INSERT INTO custom_request_commission_events
   (custom_request_id,event_kind,source_quote_draft_id,source_quote_revision_id,source_payment_request_draft_id,
    source_proof_version_id,source_job_draft_id,source_creative_project_id,progress_stage,customer_visible,
    public_progress_message,internal_note,actor_user_id,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
    requestId,kind,sourceIds.quote||null,sourceIds.revision||null,sourceIds.payment||null,sourceIds.proof||null,
    sourceIds.job||null,sourceIds.project||null,kind==='progress_approval'?stage:null,
    kind==='progress_approval'?1:0,kind==='progress_approval'?message:null,note,positive(auth.admin.user_id),key
   ).run();
   eventId=positive(result.meta?.last_row_id);
  }catch(e){
   if(/UNIQUE|constraint|commission_/i.test(String(e?.message||'')))return out({ok:false,error:'Duplicate request, invalid source, or missing active order status link. Refresh.',code:'COMMISSION_GUARD_REJECTED'},409);
   throw e;
  }
  await auditAdminAction(ctx.env,ctx.request,auth.admin,{action_type:'custom_request_commission_'+kind,target_type:'custom_request',target_id:requestId,target_key:String(eventId),details:{
   event_id:eventId,source_quote_draft_id:sourceIds.quote||null,source_payment_request_draft_id:sourceIds.payment||null,
   customer_visible:kind==='progress_approval',actual_payment_verified:false,customer_contact_sent:false,operator_note:note}});
  return out({ok:true,event_id:eventId,message:'Operator decision appended to commission lifecycle. Source authorities unchanged.',...await commission(auth.db,requestId),safety});
 }catch(e){console.error('COMMISSION_WRITE_FAILED',e?.name||'Error');return out({ok:false,error:'Commission entry could not be verified.',code:'COMMISSION_WRITE_FAILED'},503);}
}
