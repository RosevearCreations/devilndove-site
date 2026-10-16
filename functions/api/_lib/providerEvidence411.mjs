// Release 467 Build 411 — immutable provider evidence audit and governed historical snapshots.
// Never infer live Etsy or Facebook status from a stored D1 receipt.
import {outcomeState} from './providerDraftRecovery410.mjs';
import {parseReceipt} from './listingSyncOperator408.mjs';
const uid = r=>Number(r?.admin_action_audit_id||0);
const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return (n>>>0).toString(16).padStart(8,'0');};
export const ACTIONS=Object.freeze({snapshot:'provider_evidence_411_snapshot',escalate:'provider_evidence_411_escalation',resolve:'provider_evidence_411_escalation'});
export const ALLOWED_CHANNELS=Object.freeze(['etsy','facebook']);
export const safeText=(v,max=160)=>String(v??'').trim().slice(0,max);
export const auditId=uid;
export function sourceState({destination,product,draft,claim,verified,caseReceipt,policyReceipt,channelIntent}={}){
 if(!product||!ALLOWED_CHANNELS.includes(destination))return null;
 const isEtsy=destination==='etsy';
 const outcome=isEtsy?outcomeState({claim,verified,draft,latestCase:caseReceipt}):null;
 const opt=parseReceipt(channelIntent);
 const shippingSuspended=true;
 const policyApproved=!!policyReceipt&&parseReceipt(policyReceipt).us_shipping_disabled===true;
 const blockers=[];
 if(opt[destination]!==true)blockers.push('destination_not_opted_in');
 if(!policyApproved)blockers.push('distribution_policy_review_missing_or_stale');
 if(isEtsy){
  if(!draft||Number(draft.product_id)!==Number(product.product_id)||draft.channel_key!=='etsy')
   blockers.push('saved_etsy_draft_missing_or_mismatched');
  if(outcome?.state==='EVIDENCE_CONFLICT_HOLD')blockers.push('provider_reconciliation_conflict');
  if(outcome?.state==='REMOTE_ATTEMPT_OUTCOME_UNKNOWN_HOLD')blockers.push('remote_attempt_outcome_unknown');
 }else blockers.push('facebook_provider_listing_permission_unverified');
 const escalatable=isEtsy?
  ['EVIDENCE_CONFLICT_HOLD','REMOTE_ATTEMPT_OUTCOME_UNKNOWN_HOLD'].includes(outcome?.state):
  true; // Explicit owner review only. Facebook never gains provider-write permission here.
 const closureEligible=isEtsy&&outcome?.state==='VERIFIED_CASE_CLOSED'&&blockers.length===0;
 return {destination,product_id:Number(product.product_id),draft_id:isEtsy?String(draft?.id||''):null,
  outcome:outcome?.state||'PROVIDER_LISTING_PERMISSION_UNVERIFIED_HOLD',
  blockers:[...new Set(blockers)],escalatable,closure_eligible:closureEligible,
  claim_receipt:uid(claim),verified_receipt:uid(verified),case_receipt:uid(caseReceipt),
  policy_receipt:uid(policyReceipt),channel_intent_receipt:uid(channelIntent),
  listing_id:isEtsy?String(draft?.external_reference||'')||null:null,
  no_remote_retry:!!outcome?.no_retry_allowed||!isEtsy,publication_allowed:false,
  provider_live_checked_now:false,shipping_suspended:shippingSuspended};
}
export function snapshotSignature({state,product,draft,escalation}={}){
 return hash(JSON.stringify([state?.destination,state?.product_id,state?.draft_id,state?.outcome,state?.blockers,
  state?.claim_receipt,state?.verified_receipt,state?.case_receipt,state?.policy_receipt,
  state?.channel_intent_receipt,state?.listing_id,product?.name,product?.price_cents,product?.inventory_quantity,
  draft?.status,draft?.updated_at,uid(escalation)]));
}
export function snapshotGovernance({signature,latestSnapshot,now=Date.now()}={}){
 const s=parseReceipt(latestSnapshot),created=String(latestSnapshot?.created_at||'').trim();
 const parsed=Date.parse(/(?:[zZ]|[+-]\d{2}:\d{2})$/.test(created)?created:created.replace(' ','T')+'Z');
 const ageHours=Number.isFinite(parsed)?Math.max(0,Math.floor((now-parsed)/3600000)):null;
 const current=!!latestSnapshot&&s.source_signature===signature&&s.build===411&&s.provider_called===false;
 return {snapshot_receipt:uid(latestSnapshot),source_matches_snapshot:current,
  review_age_hours:ageHours,review_due:!current||ageHours===null||ageHours>=24,
  governance_status:!latestSnapshot?'NOT_CAPTURED':!current?'SOURCE_CHANGED_RECAPTURE':
   ageHours===null||ageHours>=24?'HISTORICAL_SNAPSHOT_REVIEW_DUE':'HISTORICAL_SNAPSHOT_RETAINED',
  live_provider_state_verified:false,retention:'append_only_no_auto_delete'};
}
export function escalationStatus({latestEscalation,state}={}){
 const record=parseReceipt(latestEscalation),exists=uid(latestEscalation)>0;
 const opened=exists&&record.decision==='OPEN_OWNER_REVIEW';
 const resolved=exists&&record.decision==='RESOLVED_WITH_VERIFIED_EVIDENCE';
 return {receipt:uid(latestEscalation),status:!exists?'NONE':opened?'OPEN_OWNER_REVIEW':resolved?
   'RESOLVED_WITH_VERIFIED_EVIDENCE':'INVALID_RECEIPT_HOLD',
  needs_owner_attention:!!state?.escalatable&&!resolved,
  can_resolve:opened&&state?.closure_eligible===true,
  owner_action_only:true,automatic_escalation:false,publication_allowed:false};
}
export function decisionAllowed({action,state,governance,escalation,body}={}){
 if(action==='snapshot')return !!state;
 if(!body||body.no_provider_retry!==true||body.no_publication!==true||
  body.us_shipping_suspended!==true||typeof body.owner_note!=='string'||
  body.owner_note.trim().length<12||body.owner_note.trim().length>600)return false;
 if(action==='escalate')return state?.escalatable===true&&governance?.source_matches_snapshot===true&&
  escalation?.status!=='OPEN_OWNER_REVIEW';
 if(action==='resolve')return state?.closure_eligible===true&&escalation?.status==='OPEN_OWNER_REVIEW'&&
   body.confirm_verified_draft_closure===true&&governance?.source_matches_snapshot===true;
 return false;
}
