// Build 422 — verified Admin owner-only local evidence acknowledgement and handoff HOLD.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read414} from './provider-completion-414.js';
import {TYPE as APPROVAL_TYPE} from '../_lib/providerClosureApproval417.mjs';
import {DECISION_TYPE} from '../_lib/providerReopenDecision419.mjs';
import {FOLLOWUP_TYPE} from '../_lib/providerFollowup413.mjs';
import {COMPLETION_TYPE} from '../_lib/providerCompletion414.mjs';
import {reconcileContinuity420} from '../_lib/providerReopenContinuity420.mjs';
import {reviewExceptionFollowup421} from '../_lib/providerExceptionFollowup421.mjs';
import {ACK_TYPE,RECEIPT_KEYS,review422,canAck422} from '../_lib/providerExceptionAck422.mjs';
const sourceTypes=['provider_evidence_411_escalation','provider_escalation_412_assignment',
 'provider_escalation_413_handoff','provider_escalation_413_followup',
 'provider_escalation_414_completion','provider_escalation_414_sla_exception',
 'provider_escalation_414_handoff_governance'];
const respond=(x,status=200)=>Response.json({ok:status<400,build:422,
 provider_called:false,publication_performed:false,automatic_reopen:false,
 automatic_closure:false,notifications_sent:false,us_shipping_suspended:true,...x},
 {status,headers:{'Cache-Control':'no-store'}});
const auditSql='SELECT admin_action_audit_id,actor_user_id,created_at,action_type,details_json FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN (?,?) ORDER BY admin_action_audit_id DESC LIMIT 101';
const ackSql='SELECT admin_action_audit_id,actor_user_id,created_at,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 101';
async function load(c,db,caseArgs){
 const qs=new URLSearchParams({mode:'detail',product_id:String(caseArgs.product_id),destination:caseArgs.destination});
 if(caseArgs.destination==='etsy')qs.set('draft_id',String(caseArgs.draft_id||''));
 const request=new Request(new URL('/api/admin/provider-completion-414?'+qs,c.request.url),
  {method:'GET',headers:c.request.headers});
 const source=await read414({...c,request});
 if(!source.ok)return {error:source};
 const snapshot=await source.json();
 if(!snapshot?.ok||String(snapshot.product_id)!==String(caseArgs.product_id)||
  snapshot.destination!==caseArgs.destination||
  (caseArgs.destination==='etsy'&&snapshot.draft_id!==caseArgs.draft_id))
  return {error:respond({error:'Verified current case unavailable.'},409)};
 const type=caseArgs.destination==='etsy'?'marketplace_draft':'product';
 const key=caseArgs.destination==='etsy'?caseArgs.draft_id:String(caseArgs.product_id);
 const [decisionResponse,followupResponse,ackResponse]=await Promise.all([
  db.prepare(auditSql).bind(type,key,APPROVAL_TYPE,DECISION_TYPE).all(),
  db.prepare(auditSql).bind(type,key,FOLLOWUP_TYPE,COMPLETION_TYPE).all(),
  db.prepare(ackSql).bind(ACK_TYPE,type,key).all()
 ]);
 if(!Array.isArray(decisionResponse?.results)||!Array.isArray(followupResponse?.results)||
  !Array.isArray(ackResponse?.results))return {error:respond({error:'Local audit scan unavailable.'},503)};
 const decisions=decisionResponse.results,followups=followupResponse.results,acks=ackResponse.results;
 const continuity=reconcileContinuity420({snapshot,rows:decisions.slice(0,100),scanComplete:decisions.length<101});
 const review=reviewExceptionFollowup421({snapshot,continuity,sourceRows:followups.slice(0,100),
  scanComplete:followups.length<101});
 const state=review422({snapshot,continuity,review,ackRows:acks.slice(0,100),complete:acks.length<101});
 return {type,key,snapshot,continuity,review,state};
}
function caseDetails(v){
 const dest=v?.destination;
 if(!['etsy','facebook'].includes(dest)||!/^[1-9]\d{0,14}$/.test(String(v?.product_id||''))||
 (dest==='etsy'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v?.draft_id||''))))return null;
 return {destination:dest,product_id:Number(v.product_id),draft_id:dest==='etsy'?String(v.draft_id):null};
}
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return respond({error:'Verified active Admin required.'},401);
 if(!db)return respond({error:'Local audit database unavailable.'},503);
 const u=new URL(c.request.url);
 if(u.searchParams.get('mode')!=='detail')return respond({error:'Select one exact case in detail mode.'},400);
 const args=caseDetails(Object.fromEntries(u.searchParams));
 if(!args)return respond({error:'Invalid Product/draft selection.'},400);
 try{
  const data=await load(c,db,args);
  if(data.error)return data.error;
  return respond({review:data.state,continuity_status:data.continuity.status,
   followup_status:data.review.status,
   current_receipts:data.snapshot.evidence_receipts,source_signature:data.snapshot.source_signature,
   latest_decision_receipt:data.continuity.latest_decision_receipt,
   owner_user_id:data.snapshot.assigned_user_id,viewer_user_id:admin.user_id,read_only:true});
 }catch{return respond({error:'Bounded review unavailable. No provider contact.'},503);}
}
export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return respond({error:'Verified active Admin required.'},401);
 if(!db)return respond({error:'Local audit database unavailable.'},503);
 let body;try{body=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 const args=caseDetails(body);
 if(!args)return respond({error:'Invalid Product/draft selection.'},400);
 try{
  const data=await load(c,db,args);
  if(data.error)return data.error;
  const check=canAck422({snapshot:data.snapshot,continuity:data.continuity,review:data.review,
   state:data.state,body,viewer:admin.user_id});
  if(!check.allowed)return respond({error:'Explicit owner acknowledgement HOLD.',blockers:check.blockers},409);
  const prior=await db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1")
   .bind(ACK_TYPE,data.type,data.key,body.request_key).first();
  if(prior){
   let p;try{p=JSON.parse(prior.details_json||'null');}catch{p=null;}
   const match=p&&p.actor_user_id===admin.user_id&&p.choice===body.choice&&
    p.owner_note===body.owner_note.trim()&&p.exception_decision_receipt===body.expected_exception_decision_receipt&&
    p.previous_ack_receipt===body.expected_previous_ack_receipt&&
    RECEIPT_KEYS.every(k=>p.expected_receipts?.[k]===body.expected_receipts[k]);
   return match?respond({receipt:prior.admin_action_audit_id,idempotent:true,local_only:true}):
    respond({error:'Conflicting acknowledgement request key.'},409);
  }
  const record={build:422,action:'ack_exception_followup',choice:body.choice,
   actor_user_id:admin.user_id,owner_note:body.owner_note.trim(),request_key:body.request_key,
   product_id:args.product_id,destination:args.destination,draft_id:args.draft_id,
   exception_decision_receipt:data.continuity.latest_decision_receipt,
   previous_ack_receipt:data.state.latest_ack_receipt,
   expected_receipts:data.snapshot.evidence_receipts,source_signature:data.snapshot.source_signature,
   local_only:true,provider_called:false,publication_performed:false,automatic_reopen:false,
   automatic_closure:false,notifications_sent:false,us_shipping_suspended:true,
   owner_handoff_performed:false,exception_resolved:false};
  const checks=sourceTypes.map(()=>
   "COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  checks.push("COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  checks.push("COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  checks.push("NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)");
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE "+checks.join(' AND ');
  const bind=[admin.user_id,ACK_TYPE,data.type,data.key,new URL(c.request.url).pathname,JSON.stringify(record)];
  for(let i=0;i<sourceTypes.length;i++)bind.push(sourceTypes[i],data.type,data.key,data.snapshot.evidence_receipts[RECEIPT_KEYS[i]]||0);
  bind.push(DECISION_TYPE,data.type,data.key,data.continuity.latest_decision_receipt);
  bind.push(ACK_TYPE,data.type,data.key,data.state.latest_ack_receipt);
  bind.push(ACK_TYPE,data.type,data.key,body.request_key);
  const result=await db.prepare(sql).bind(...bind).run();
  if(Number(result?.meta?.changes||0)!==1)return respond({error:'Concurrent owner or audit evidence change; reload.'},409);
  const saved=await db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? LIMIT 1")
   .bind(ACK_TYPE,data.type,data.key,body.request_key).first();
  if(!saved)return respond({error:'Local acknowledgement persistence unconfirmed; inspect audit.'},503);
  return respond({receipt:saved.admin_action_audit_id,choice:body.choice,local_only:true,
   message:'Manual local acknowledgement saved. No provider or escalation state changed.'});
 }catch{return respond({error:'Local audit state uncertain. No provider action was attempted.'},503);}
}
