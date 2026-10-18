// Build 415 — read-only, bounded closure decision support over Build 414's verified Admin evidence.
import {onRequestGet as evidenceGet} from './provider-completion-414.js';
import {closureDecision} from '../_lib/providerClosureDecision415.mjs';
export async function onRequestGet(context){
 const upstream=await evidenceGet(context);
 if(!upstream.ok)return upstream;
 let snapshot;
 try{snapshot=await upstream.json();}catch{return Response.json({ok:false,error:'Evidence decoding failed; closure denied.'},{status:503,headers:{'Cache-Control':'no-store'}});}
 if(!snapshot.ok||!snapshot.evidence_receipts||!snapshot.completion)
  return Response.json({ok:false,error:'Complete Build 414 detail evidence required; closure denied.'},{status:409,headers:{'Cache-Control':'no-store'}});
 const receipts=snapshot.evidence_receipts;
 const result=closureDecision({
  escalation:{receipt:receipts.escalation,status:snapshot.escalation_status},
  assignment:{receipt:receipts.assignment,assignee_user_id:snapshot.assigned_user_id},
  followup:snapshot.followup,completion:snapshot.completion,
  handoff:snapshot.handoff,governance:snapshot.governance,
  sourceCurrent:snapshot.source_snapshot_current===true,
  assignedActive:Array.isArray(snapshot.admins)&&snapshot.admins.some(u=>Number(u.user_id)===Number(snapshot.assigned_user_id)),
  exceptionReasons:snapshot.exception_reasons,exceptionRoute:snapshot.route,
  olderEvidenceOutsideScan:snapshot.evidence_scan_exhausted!==true // Require proof the 160-receipt scan was exhaustive
 });
 return Response.json({ok:true,build:415,product_id:snapshot.product_id,
  destination:snapshot.destination,evidence_receipts:receipts,closure_decision:result,
  evidence_scan_limit:snapshot.scan_limit,read_only:true,
  no_provider_contact:true,explicit_human_review_required:true
 },{headers:{'Cache-Control':'no-store'}});
}
