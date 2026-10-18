// Build 417 — explicit verified Admin approval of LOCAL evidence, not provider closure.
import {getDb} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as detail} from './provider-completion-414.js';
import {closurePacket416} from '../_lib/providerClosurePacket416.mjs';
import {TYPE,mayApprove} from '../_lib/providerClosureApproval417.mjs';
const reply=(x,s=200)=>Response.json({ok:s<400,build:417,provider_called:false,publication_performed:false,
 automatic_closure_performed:false,us_shipping_suspended:true,...x},{status:s,headers:{'Cache-Control':'no-store'}});
export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return reply({error:'Verified active Admin required.'},401);
 if(!db)return reply({error:'Local audit database unavailable.'},503);
 let body;try{body=await c.request.json();}catch{return reply({error:'JSON required.'},400);}
 if(!body||!Number.isSafeInteger(Number(body.product_id))||Number(body.product_id)<1||
 !['etsy','facebook'].includes(body.destination))return reply({error:'Valid selected case required.'},400);
 const qs=new URLSearchParams({mode:'detail',product_id:String(body.product_id),destination:body.destination});
 if(body.destination==='etsy')qs.set('draft_id',String(body.draft_id||''));
 const sourceRequest=new Request(new URL('/api/admin/provider-completion-414?'+qs.toString(),c.request.url),{method:'GET',headers:c.request.headers});
 try{
  const response=await detail({...c,request:sourceRequest});
  if(!response.ok)return response;
  const snapshot=await response.json(),packet=closurePacket416(snapshot);
  const validation=mayApprove({packet,viewer:admin.user_id,assignee:snapshot.assigned_user_id,body});
  if(!validation.approved)return reply({error:'Approval blocked; reload and review current evidence.',blockers:validation.reasons},409);
  if(snapshot.source_signature!==body.expected_source_signature)return reply({error:'Source facts changed; reload.'},409);
  const targetType=body.destination==='etsy'?'marketplace_draft':'product';
  const targetKey=body.destination==='etsy'?String(body.draft_id):String(body.product_id);
  // Cross-action idempotency is scoped to this immutable approval ledger; no schema or provider changes.
  const find="SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=? ORDER BY admin_action_audit_id DESC LIMIT 1";
  const existing=await db.prepare(find).bind(TYPE,targetType,targetKey,body.request_key).first();
  if(existing){const old=JSON.parse(existing.details_json||'{}');return old.action==='approve_local_closure'&&old.source_signature===body.expected_source_signature&&old.approved_by_user_id===admin.user_id?reply({receipt:existing.admin_action_audit_id,idempotent:true,local_only:true}):reply({error:'Conflicting approval request key.'},409);}
  const previous=await db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? ORDER BY admin_action_audit_id DESC LIMIT 1").bind(TYPE,targetType,targetKey).first();
  if(previous){const prior=JSON.parse(previous.details_json||'{}');if(prior.expected_receipts?.escalation===packet.evidence_receipts.escalation)return reply({error:'This escalation already has a local approval receipt.',receipt:previous.admin_action_audit_id},409);}
  const record={build:417,action:'approve_local_closure',request_key:body.request_key,product_id:Number(body.product_id),
   destination:body.destination,draft_id:body.destination==='etsy'?targetKey:null,
   source_signature:snapshot.source_signature,expected_receipts:packet.evidence_receipts,
   approved_by_user_id:admin.user_id,owner_note:body.owner_note.trim(),local_only:true,
   provider_called:false,publication_performed:false,automatic_closure_performed:false,us_shipping_suspended:true};
  const types=['provider_evidence_411_escalation','provider_escalation_412_assignment',
   'provider_escalation_413_handoff','provider_escalation_413_followup',
   'provider_escalation_414_completion','provider_escalation_414_sla_exception','provider_escalation_414_handoff_governance'];
  const fields=['escalation','assignment','handoff','followup','completion','route','governance'];
  const predicate=types.map(()=>"(SELECT COALESCE(MAX(admin_action_audit_id),0) FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=?)=?").join(' AND ');
  const sql="INSERT INTO admin_action_audit (actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,?,?,?,'POST',?,?,CURRENT_TIMESTAMP WHERE "+predicate+
   " AND NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.request_key')=?)"+
   " AND NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE action_type=? AND target_type=? AND target_key=? AND json_extract(details_json,'$.expected_receipts.escalation')=?)";
  const values=[admin.user_id,TYPE,targetType,targetKey,new URL(c.request.url).pathname,JSON.stringify(record)];
  for(let i=0;i<types.length;i++)values.push(types[i],targetType,targetKey,Number(packet.evidence_receipts[fields[i]]||0));
  values.push(TYPE,targetType,targetKey,body.request_key,TYPE,targetType,targetKey,packet.evidence_receipts.escalation);
  const saved=await db.prepare(sql).bind(...values).run();
  if(Number(saved?.meta?.changes)!==1)return reply({error:'Concurrent audit change or duplicate approval; reload receipts.'},409);
  const verified=await db.prepare(find).bind(TYPE,targetType,targetKey,body.request_key).first();
  if(!verified)return reply({error:'Approval persistence unconfirmed; inspect audit.'},503);
  return reply({receipt:verified.admin_action_audit_id,local_only:true,approval_recorded:true,
   message:'Local owner review approval saved. Escalation and provider status remain unchanged.'});
 }catch{return reply({error:'Local audit result uncertain. Reload; no provider writes.'},503);}
}
