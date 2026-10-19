// Build 425 — explicit local owner acceptance receipt; closure never authorized here.
import {RECEIPT_KEYS} from './providerExceptionAck422.mjs';
import {validKey} from './providerClosureApproval417.mjs';
export const ACCEPT_TYPE='provider_escalation_425_owner_acceptance';
export const ACCEPT_CHOICE='ACCEPT_HANDOFF_FOR_MANUAL_REVIEW';
const pos=v=>Number.isSafeInteger(v)&&v>0;
const nonneg=v=>Number.isSafeInteger(v)&&v>=0;
const sourceSafe=s=>s?.ok===true&&s?.build===424&&s?.read_only===true&&
 s?.manual_review_only===true&&s?.review?.build===424&&
 s.review.read_only===true&&s.review.local_only===true&&
 s.review.provider_called===false&&s.review.automatic_closure===false&&
 s.review.publication_performed===false&&s.review.us_shipping_suspended===true;
export function reviewOwnerAcceptance425({source,rows=[],scanComplete=false,viewer=0}={}){
 const holds=[];
 if(!sourceSafe(source))holds.push('SOURCE_424_UNTRUSTED');
 if(!Array.isArray(rows)||!scanComplete||rows.length>100)holds.push('ACCEPTANCE_SCAN_INCOMPLETE');
 if(!pos(Number(source?.current_owner_user_id))||Number(viewer)!==Number(source?.current_owner_user_id))
  holds.push('CURRENT_ASSIGNED_OWNER_REQUIRED');
 if(!source?.review?.handoff_acceptance_review_ready)
  holds.push('SOURCE_HANDOFF_ACCEPTANCE_HOLD');
 if(!RECEIPT_KEYS.every(k=>nonneg(source?.current_receipts?.[k])))
  holds.push('SOURCE_RECEIPTS_UNAVAILABLE');
 if(!/^[0-9a-f]{8}$/.test(String(source?.current_source_signature||'')))
  holds.push('SOURCE_SIGNATURE_UNAVAILABLE');
 const history=[];
 for(const row of (Array.isArray(rows)?rows:[]).slice().reverse()){
  let d;try{d=JSON.parse(row.details_json||'null');}catch{d=null;}
  const receipt=Number(row.admin_action_audit_id);
  const safe=pos(receipt)&&pos(Number(row.actor_user_id))&&
   row.action_type===ACCEPT_TYPE&&d?.action==='accept_owner_handoff_review'&&
   d?.choice===ACCEPT_CHOICE&&d?.local_only===true&&
   d?.provider_called===false&&d?.publication_performed===false&&
   d?.notifications_sent===false&&d?.automatic_closure===false&&
   d?.automatic_reopen===false&&d?.us_shipping_suspended===true&&
   d?.owner_reassignment_performed===false&&d?.external_provider_verified===false&&
   d?.closure_permitted===false&&validKey(d?.request_key)&&
   d?.actor_user_id===Number(row.actor_user_id)&&
   typeof d?.owner_note==='string'&&d.owner_note.length>=20&&d.owner_note.length<=600;
  if(!safe)holds.push('INVALID_LOCAL_ACCEPTANCE_RECEIPT');
  history.push({receipt,created_at:row.created_at||null,
   actor_user_id:Number(row.actor_user_id)||0,choice:safe?d.choice:null,
   source_signature:d?.source_signature||null,
   decision_receipt:Number(d?.expected_decision_receipt)||0,
   previous_receipt:Number(d?.previous_acceptance_receipt)||0,
   owner_ack_receipt:Number(d?.expected_owner_ack_receipt)||0,
   handoff_receipt:Number(d?.expected_handoff_receipt)||0,
   expected_receipts:d?.expected_receipts||{},valid:safe});
 }
 for(let i=0;i<history.length;i++){
  const rec=history[i], prior=i===0?0:history[i-1].receipt;
  if(!pos(rec.receipt)||(i>0&&rec.receipt<=prior)||
     (i===0&&rec.previous_receipt!==0)||
     (i>0&&rec.previous_receipt!==prior))
    holds.push('ACCEPTANCE_CHAIN_BROKEN');
 }
 const latest=history.at(-1)||null,expected=source?.current_receipts||{},review=source?.review||{};
 if(latest&&(!latest.valid||latest.actor_user_id!==Number(source?.current_owner_user_id)||
  latest.source_signature!==source?.current_source_signature||
  latest.decision_receipt!==review.source_decision_receipt||
  latest.owner_ack_receipt!==review.source_owner_ack_receipt||
  latest.handoff_receipt!==review.source_handoff_receipt||
  !RECEIPT_KEYS.every(k=>latest.expected_receipts?.[k]===expected[k])))
  holds.push('ACCEPTANCE_RECEIPT_STALE');
 const current=holds.length===0&&Boolean(latest);
 return {build:425,status:holds.length?'HOLD_FOR_MANUAL_OWNER_REVIEW':
  current?'LOCAL_OWNER_ACCEPTANCE_RECORDED':'AWAITING_EXPLICIT_OWNER_ACCEPTANCE',
  holds:[...new Set(holds)],scan_complete:scanComplete===true&&Array.isArray(rows)&&rows.length<=100,
  owner_user_id:Number(source?.current_owner_user_id)||0,viewer_user_id:Number(viewer)||0,
  source_signature:source?.current_source_signature||null,
  current_receipts:source?.current_receipts||{},
  source_decision_receipt:review.source_decision_receipt||0,
  source_owner_ack_receipt:review.source_owner_ack_receipt||0,
  source_handoff_receipt:review.source_handoff_receipt||0,
  latest_acceptance_receipt:latest?.receipt||0,
  acceptance_record_current:current,
  accept_enabled:holds.length===0,
  history:history.map(({expected_receipts,...safe})=>safe),
  manual_closure_audit:{status:'HOLD_EXTERNAL_PROVIDER_EVIDENCE_AND_SEPARATE_DECISION',
   current_owner_acceptance_observed:current,
   independent_provider_evidence_verified:false,
   closure_authorized:false,separate_human_closure_decision_required:true,
   local_receipt_does_not_resolve_exception:true},
  owner_reassignment_performed:false,automatic_closure:false,automatic_reopen:false,
  provider_called:false,publication_performed:false,notifications_sent:false,
  us_shipping_suspended:true,local_only:true};
}
export function canRecordAcceptance425({source,state,body,viewer}={}){
 const holds=[];
 if(!state?.accept_enabled||state?.holds?.length)holds.push('OWNER_REVIEW_HOLD');
 if(!pos(Number(viewer))||Number(viewer)!==Number(source?.current_owner_user_id))
  holds.push('ASSIGNED_OWNER_ONLY');
 if(body?.action!=='accept_owner_handoff_review'||body?.choice!==ACCEPT_CHOICE||
   body?.confirm_local_only!==true||body?.confirm_no_provider_action!==true||
   body?.confirm_no_publication!==true||body?.confirm_no_auto_closure!==true||
   body?.confirm_separate_manual_closure!==true||body?.confirm_us_shipping_suspended!==true)
  holds.push('EXPLICIT_OWNER_CONFIRMATIONS_REQUIRED');
 if(!validKey(body?.request_key))holds.push('REQUEST_KEY_INVALID');
 if(typeof body?.owner_note!=='string'||body.owner_note.trim().length<20||
    body.owner_note.trim().length>600)holds.push('SUBSTANTIVE_OWNER_NOTE_REQUIRED');
 if(body?.expected_source_signature!==source?.current_source_signature||
    !RECEIPT_KEYS.every(k=>nonneg(body?.expected_receipts?.[k])&&
      body.expected_receipts[k]===source?.current_receipts?.[k]))
  holds.push('SOURCE_RECEIPTS_STALE');
 for(const [key,actual] of [
   ['expected_decision_receipt',state?.source_decision_receipt],
   ['expected_owner_ack_receipt',state?.source_owner_ack_receipt],
   ['expected_handoff_receipt',state?.source_handoff_receipt],
   ['expected_previous_acceptance_receipt',state?.latest_acceptance_receipt]])
  if(!nonneg(body?.[key])||body[key]!==actual)holds.push('ACCEPTANCE_PROVENANCE_STALE');
 return {allowed:holds.length===0,holds:[...new Set(holds)]};
}
