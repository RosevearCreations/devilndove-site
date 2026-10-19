// Build 425 — Admin-only explicit local receipt; no marketplace, provider or closure writes.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as read424} from './provider-handoff-acceptance-424.js';
import {ACK_TYPE,RECEIPT_KEYS} from '../_lib/providerExceptionAck422.mjs';
import {DECISION_TYPE} from '../_lib/providerReopenDecision419.mjs';
import {validKey} from '../_lib/providerClosureApproval417.mjs';
import {ACCEPT_TYPE,ACCEPT_CHOICE,reviewOwnerAcceptance425,canRecordAcceptance425} from '../_lib/providerOwnerAcceptance425.mjs';
const sources=['provider_evidence_411_escalation','provider_escalation_412_assignment',
 'provider_escalation_413_handoff','provider_escalation_413_followup',
 'provider_escalation_414_completion','provider_escalation_414_sla_exception',
 'provider_escalation_414_handoff_governance'];
const reply=(data,status=200)=>Response.json({ok:status<400,build:425,local_only:true,
 provider_called:false,publication_performed:false,notifications_sent:false,
 automatic_reopen:false,automatic_closure:false,us_shipping_suspended:true,...data},
 {status,headers:{'Cache-Control':'no-store'}});
function caseArgs(data){
 if(!['etsy','facebook'].includes(data?.destination)||
 !/^[1-9]\d{0,14}$/.test(String(data?.product_id||''))||
 (data.destination==='etsy'&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(data?.draft_id||''))))
 return null;
 return {product_id:Number(data.product_id),destination:data.destination,
  draft_id:data.destination==='etsy'?String(data.draft_id):null,
  type:data.destination==='etsy'?'marketplace_draft':'product',
  key:data.destination==='etsy'?String(data.draft_id):String(data.product_id)};
}
async function load(context,db,admin,args){
 const qs=new URLSearchParams({mode:'detail',product_id:String(args.product_id),destination:args.destination});
 if(args.draft_id)qs.set('draft_id',args.draft_id);
 const request=new Request(new URL('/api/admin/provider-handoff-acceptance-424?'+qs,context.request.url),
  {method:'GET',headers:context.request.headers});
 const upstream=await read424({...context,request});
 if(!upstream.ok)return {error:reply({error:'Current bounded owner governance unavailable.'},upstream.status)};
 const source=await upstream.json();
 if(!source?.ok||source?.build!==424||source.destination!==args.destination||
  Number(source.product_id)!==args.product_id||
  (args.destination==='etsy'&&source.draft_id!==args.draft_id))
  return {error:reply({error:'Selected case provenance mismatch.'},409)};
 const query='SELECT admin_action_audit_id,actor_user_id,action_type,created_at,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 101';
 const result=await db.prepare(query).bind(ACCEPT_TYPE,args.type,args.key).all();
 if(!Array.isArray(result?.results))return {error:reply({error:'Bounded acceptance history unavailable.'},503)};
 const state=reviewOwnerAcceptance425({source,rows:result.results.slice(0,100),
  scanComplete:result.results.length<101,viewer:admin.user_id});
 return {source,state};
}
export async function onRequestGet(context){
 const admin=verifiedAdminFromModule(context),db=getDb(context.env);
 if(!admin)return reply({error:'Verified active Admin required.'},401);
 if(!db)return reply({error:'Local audit database unavailable.'},503);
 const params=new URL(context.request.url).searchParams;
 if(params.get('mode')!=='detail')return reply({error:'Explicit detail case required.'},400);
 const args=caseArgs(Object.fromEntries(params));
 if(!args)return reply({error:'Invalid case selection.'},400);
 try{
  const data=await load(context,db,admin,args);
  if(data.error)return data.error;
  return reply({product_id:args.product_id,destination:args.destination,draft_id:args.draft_id,
   review:data.state,read_only:true,
   operator_action:'A local owner acceptance receipt is NOT proof of external closure. Complete a separate authorized manual decision only after independently verifying provider evidence.'});
 }catch{return reply({error:'Owner acceptance audit unavailable. No action taken.'},503);}
}
export async function onRequestPost(context){
 const admin=verifiedAdminFromModule(context),db=getDb(context.env);
 if(!admin)return reply({error:'Verified active Admin required.'},401);
 if(!db)return reply({error:'Local audit database unavailable.'},503);
 let body;try{body=await context.request.json();}catch{return reply({error:'JSON required.'},400);}
 const args=caseArgs(body);
 if(!args)return reply({error:'Invalid case selection.'},400);
 try{
  // Immutable retries: verify the entire original request BEFORE scanning current evidence.
  if(validKey(body?.request_key)){
   const previous=await db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1")
    .bind(ACCEPT_TYPE,args.type,args.key,body.request_key).first();
   if(previous){
    let d;try{d=JSON.parse(previous.details_json||'null');}catch{d=null;}
    const match=d&&d.actor_user_id===admin.user_id&&Number(previous.actor_user_id)===admin.user_id&&
     d.action===body.action&&d.choice===body.choice&&d.owner_note===String(body.owner_note||'').trim()&&
     d.source_signature===body.expected_source_signature&&
     d.expected_decision_receipt===body.expected_decision_receipt&&
     d.expected_owner_ack_receipt===body.expected_owner_ack_receipt&&
     d.expected_handoff_receipt===body.expected_handoff_receipt&&
     d.previous_acceptance_receipt===body.expected_previous_acceptance_receipt&&
     RECEIPT_KEYS.every(k=>d.expected_receipts?.[k]===body.expected_receipts?.[k])&&
     [body.confirm_local_only,body.confirm_no_provider_action,body.confirm_no_publication,
      body.confirm_no_auto_closure,body.confirm_separate_manual_closure,
      body.confirm_us_shipping_suspended].every(v=>v===true);
    return match?reply({receipt:previous.admin_action_audit_id,idempotent:true,
     closure_permitted:false}):reply({error:'Conflicting acceptance request key.'},409);
   }
  }
  const data=await load(context,db,admin,args);
  if(data.error)return data.error;
  const check=canRecordAcceptance425({source:data.source,state:data.state,body,viewer:admin.user_id});
  if(!check.allowed)return reply({error:'Owner acceptance HOLD.',blockers:check.holds},409);
  const record={build:425,action:'accept_owner_handoff_review',choice:ACCEPT_CHOICE,
   request_key:body.request_key,actor_user_id:admin.user_id,owner_note:body.owner_note.trim(),
   product_id:args.product_id,destination:args.destination,draft_id:args.draft_id,
   source_signature:data.source.current_source_signature,
   expected_receipts:data.source.current_receipts,
   expected_decision_receipt:data.state.source_decision_receipt,
   expected_owner_ack_receipt:data.state.source_owner_ack_receipt,
   expected_handoff_receipt:data.state.source_handoff_receipt,
   previous_acceptance_receipt:data.state.latest_acceptance_receipt,
   local_only:true,provider_called:false,publication_performed:false,
   notifications_sent:false,automatic_closure:false,automatic_reopen:false,
   owner_reassignment_performed:false,external_provider_verified:false,
   closure_permitted:false,us_shipping_suspended:true};
  const guards=sources.map(()=>"COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  for(let i=0;i<3;i++)guards.push("COALESCE((SELECT MAX(admin_action_audit_id) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?),0)=?");
  guards.push("NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)");
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE "+guards.join(' AND ');
  const bind=[admin.user_id,ACCEPT_TYPE,args.type,args.key,
   new URL(context.request.url).pathname,JSON.stringify(record)];
  for(let i=0;i<sources.length;i++)bind.push(sources[i],args.type,args.key,data.source.current_receipts[RECEIPT_KEYS[i]]||0);
  bind.push(DECISION_TYPE,args.type,args.key,data.state.source_decision_receipt);
  bind.push(ACK_TYPE,args.type,args.key,data.state.source_owner_ack_receipt);
  bind.push(ACCEPT_TYPE,args.type,args.key,data.state.latest_acceptance_receipt);
  bind.push(ACCEPT_TYPE,args.type,args.key,body.request_key);
  const result=await db.prepare(sql).bind(...bind).run();
  if(Number(result?.meta?.changes||0)!==1)
   return reply({error:'Concurrent evidence or owner acceptance changed. Reload.'},409);
  const saved=await db.prepare("SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1")
   .bind(ACCEPT_TYPE,args.type,args.key,body.request_key).first();
  if(!saved)return reply({error:'Acceptance persistence unconfirmed. Inspect audit.'},503);
  return reply({receipt:saved.admin_action_audit_id,idempotent:false,closure_permitted:false,
   message:'Explicit local owner acceptance receipt recorded; provider and exception remain unchanged.'});
 }catch{return reply({error:'Local acceptance state uncertain; no provider action attempted.'},503);}
}
