// Release 467 Build 419 — local manual owner reopen-review/exception decision only.
// Reuses verified active Admin gate and immutable Build 411-418 audit receipts; never changes provider/draft/escalation state.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {productIdValid} from '../_lib/productDistribution406.mjs';
import {uuidDraft} from '../_lib/etsyTrialGate409.mjs';
import {onRequestGet as read414} from './provider-completion-414.js';
import {reconcileHistory418,REOPEN_TYPE,REOPEN_DECISION_419_TYPE} from '../_lib/providerClosureHistory418.mjs';
import {TYPE as APPROVAL_TYPE} from '../_lib/providerClosureApproval417.mjs';
import {DECISION_TYPE,validateManualReopen419,immutableDecision419} from '../_lib/providerReopenDecision419.mjs';
const reply=(o,status=200)=>Response.json({ok:status<400,build:419,local_only:true,
 provider_called:false,publication_performed:false,automatic_reopen:false,automatic_closure:false,
 notifications_sent:false,us_shipping_suspended:true,...o},{status,headers:{'Cache-Control':'no-store'}});
const latest='SELECT admin_action_audit_id,details_json,actor_user_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,\'$.request_key\')=? ORDER BY admin_action_audit_id DESC LIMIT 1';
const sourceTypes=['provider_evidence_411_escalation','provider_escalation_412_assignment',
 'provider_escalation_413_handoff','provider_escalation_413_followup','provider_escalation_414_completion',
 'provider_escalation_414_sla_exception','provider_escalation_414_handoff_governance'];
const sourceKeys=['escalation','assignment','handoff','followup','completion','route','governance'];
async function currentSnapshot(c,body){
 const qs=new URLSearchParams({mode:'detail',destination:body.destination,product_id:String(body.product_id)});
 if(body.destination==='etsy')qs.set('draft_id',body.draft_id);
 const request=new Request(new URL('/api/admin/provider-completion-414?'+qs,c.request.url),{method:'GET',headers:c.request.headers});
 const res=await read414({...c,request});
 if(!res.ok)return {error:res};
 return {snapshot:await res.json()};
}
export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return reply({error:'Verified active Admin required.'},401);
 if(!db)return reply({error:'D1 local audit ledger unavailable.'},503);
 let body;try{body=await c.request.json();}catch{return reply({error:'JSON object required.'},400);}
 if(!body||!productIdValid(body.product_id)||!['etsy','facebook'].includes(body.destination)||
 (body.destination==='etsy'&&!uuidDraft(body.draft_id))||
 !Number.isSafeInteger(body.expected_previous_decision_receipt)||body.expected_previous_decision_receipt<0)
 return reply({error:'Valid case, saved Etsy draft and last known decision receipt required.'},400);
 const targetType=body.destination==='etsy'?'marketplace_draft':'product';
 const targetKey=body.destination==='etsy'?String(body.draft_id):String(body.product_id);
 try{
  const old=await db.prepare(latest).bind(DECISION_TYPE,targetType,targetKey,body.request_key||'').first();
  if(old){
   const d=JSON.parse(old.details_json||'{}');
   const same=d.action==='record_manual_reopen_decision'&&d.actor_user_id===admin.user_id&&
    d.product_id===Number(body.product_id)&&d.destination===body.destination&&
    d.draft_id===(body.destination==='etsy'?body.draft_id:null)&&d.decision===body.decision&&
    d.source_signature===body.expected_source_signature&&d.owner_note===String(body.owner_note||'').trim()&&
    d.approval_receipt===body.expected_approval_receipt&&d.previous_review_receipt===body.expected_previous_decision_receipt;
   return same?reply({receipt:old.admin_action_audit_id,idempotent:true,
    message:'Previously saved local review decision; no escalation or provider state was changed.'}):
    reply({error:'Conflicting idempotency key reuse.'},409);
  }
  const loaded=await currentSnapshot(c,body);
  if(loaded.error)return loaded.error;
  const snapshot=loaded.snapshot;
  if(!snapshot?.ok||snapshot.destination!==body.destination||Number(snapshot.product_id)!==Number(body.product_id))
   return reply({error:'Verified current case unavailable.'},409);
  const rows=(await db.prepare('SELECT admin_action_audit_id,actor_user_id,action_type,created_at,details_json FROM admin_action_audit WHERE target_type=? AND target_key=? AND action_type IN (?,?,?) ORDER BY admin_action_audit_id DESC LIMIT 101')
   .bind(targetType,targetKey,APPROVAL_TYPE,REOPEN_TYPE,REOPEN_DECISION_419_TYPE).all())?.results||[];
  const history=reconcileHistory418({rows:rows.slice(0,100),snapshot,scanComplete:rows.length<101});
  const verification=validateManualReopen419({snapshot,history,viewer:admin.user_id,body});
  if(!verification.allowed)return reply({error:'Local decision blocked. Reload and inspect audit evidence.',blockers:verification.blockers},409);
  const previous=rows.find(r=>r.action_type===DECISION_TYPE);
  if(Number(previous?.admin_action_audit_id||0)!==body.expected_previous_decision_receipt)
   return reply({error:'A newer local decision exists. Reload decision history.'},409);
  const record=immutableDecision419({snapshot,body,actorId:admin.user_id,
   approvalReceipt:body.expected_approval_receipt,previousReviewReceipt:body.expected_previous_decision_receipt});
  // Atomic compare-and-swap on all source evidence + latest exact 417 approval + latest 419 decision.
  const checks=sourceTypes.map(()=>"COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  checks.push("COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  checks.push("COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  checks.push("NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)");
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE "+checks.join(' AND ');
  const args=[admin.user_id,DECISION_TYPE,targetType,targetKey,new URL(c.request.url).pathname,JSON.stringify(record)];
  for(let i=0;i<sourceTypes.length;i++)args.push(sourceTypes[i],targetType,targetKey,snapshot.evidence_receipts[sourceKeys[i]]||0);
  args.push(APPROVAL_TYPE,targetType,targetKey,body.expected_approval_receipt);
  args.push(DECISION_TYPE,targetType,targetKey,body.expected_previous_decision_receipt);
  args.push(DECISION_TYPE,targetType,targetKey,body.request_key);
  const saved=await db.prepare(sql).bind(...args).run();
  if(Number(saved?.meta?.changes||0)!==1)return reply({error:'Concurrent evidence or decision change; reload before recording another review.'},409);
  const confirmed=await db.prepare(latest).bind(DECISION_TYPE,targetType,targetKey,body.request_key).first();
  if(!confirmed||JSON.parse(confirmed.details_json||'{}').decision!==body.decision)
   return reply({error:'Local receipt persistence unconfirmed. Inspect audit before retry.'},503);
  return reply({receipt:confirmed.admin_action_audit_id,decision:body.decision,
    message:'Explicit local manual decision recorded. No reopening, publication, provider contact or notification occurred.'});
 }catch{return reply({error:'Local audit unavailable or result uncertain; reload. No provider action was attempted.'},503);}
}
