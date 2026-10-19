// Build 424 — read-only acceptance review, never an authorization to close or publish.
const urgent = new Set([
 'HANDOFF_HISTORY_INCOMPLETE','OWNER_ACK_HISTORY_INCOMPLETE','CURRENT_SOURCE_REVIEW_REQUIRED',
 'OWNER_DECISION_CONTINUITY_HOLD','FOLLOWUP_CONTINUITY_HOLD','OWNER_ACKNOWLEDGEMENT_REVIEW_HOLD',
 'ACTIVE_ASSIGNED_OWNER_REQUIRED','INVALID_OR_NONLOCAL_AUDIT_RECORD',
 'LATEST_HANDOFF_RECEIPT_CHANGED','LATEST_OWNER_ACK_RECEIPT_CHANGED',
 'HANDOFF_REQUEST_ACK_CHAIN_HOLD','ACKNOWLEDGEMENT_CONTINUITY_REVIEW_HOLD',
 'OWNER_EVIDENCE_RECONCILIATION_HOLD'
]);
const handoff = new Set([
 'HANDOFF_ACKNOWLEDGEMENT_PENDING','OWNER_REQUIRES_MANUAL_HANDOFF',
 'EXPLICIT_OWNER_ACKNOWLEDGEMENT_REQUIRED'
]);
const actions = {
 OWNER_REQUIRES_MANUAL_HANDOFF:'Review the explicit owner handoff request; do not transfer automatically.',
 HANDOFF_ACKNOWLEDGEMENT_PENDING:'Verify the original handoff request and receiver acknowledgement.',
 EXPLICIT_OWNER_ACKNOWLEDGEMENT_REQUIRED:'Obtain a current explicit owner acknowledgement.',
 MANUAL_EXCEPTION_FOLLOWUP:'Inspect linked follow-up receipts and independently check provider status.',
 MANUAL_CLOSURE_SAFETY_REVIEW:'Require external evidence and a separate authorized manual closure decision.'
};
const entry=(code,priority,receipt=0)=>({code,priority,receipt,
 action:actions[code]||'Review the original scoped local evidence before further action.'});
const pos=n=>Number.isSafeInteger(n)&&n>0;
export function reviewHandoffAcceptance424(source){
 const g=source?.governance, defects=[];
 if(source?.ok!==true||source?.build!==423||source?.read_only!==true||
    source?.manual_review_only!==true||!pos(Number(source?.product_id))||
    !['etsy','facebook'].includes(source?.destination)||g?.build!==423)
   defects.push('REVIEW_CONTRACT_UNVERIFIED');
 if(!g||g.read_only!==true||g.manual_followup_required!==true||
    g.us_shipping_suspended!==true||g.provider_status_verified_now!==false||
    ['provider_called','publication_performed','notifications_sent','automatic_reopen',
     'automatic_closure','exception_resolved','owner_reassignment_performed']
       .some(k=>g[k]!==false))
   defects.push('REVIEW_CONTRACT_UNVERIFIED');
 const holds=Array.isArray(g?.holds)?g.holds:[];
 const history=Array.isArray(g?.owner_review_history)?g.owner_review_history:[];
 if(!Array.isArray(g?.holds)||holds.length>100||holds.some(h=>typeof h!=='string'||!h||h.length>90)||
    !Array.isArray(g?.owner_review_history)||history.length>100||
    history.some((r,i)=>!pos(r?.receipt)||!pos(Number(r?.actor_user_id))||
      !Array.isArray(r?.review_flags)||(i>0&&r.receipt<=history[i-1].receipt))||
    !Number.isSafeInteger(g?.latest_handoff_receipt)||g.latest_handoff_receipt<0||
    !Number.isSafeInteger(g?.latest_owner_ack_receipt)||g.latest_owner_ack_receipt<0||
    !Number.isSafeInteger(g?.decision_receipt)||g.decision_receipt<0||
    g.latest_owner_ack_receipt!==(history.at(-1)?.receipt||0)||
    !['NOT_REQUIRED','LOCAL_REQUEST_ACK_OBSERVED','INVALID_REVIEW_HOLD'].includes(g?.handoff_chain?.status)||
    (holds.length===0&&g?.status!=='LOCAL_RECEIPTS_RECONCILED_FOR_MANUAL_REVIEW')||
    (holds.length>0&&g?.status!=='HOLD_MANUAL_OWNER_GOVERNANCE'))
   defects.push('REVIEW_CONTRACT_UNVERIFIED');
 if(g?.handoff_chain?.status==='LOCAL_REQUEST_ACK_OBSERVED'&&
    (!pos(g.handoff_chain.request_receipt)||!pos(g.handoff_chain.ack_receipt)||
     g.handoff_chain.request_receipt>=g.handoff_chain.ack_receipt||
     g.handoff_chain.ack_receipt!==g.latest_handoff_receipt))
   defects.push('REVIEW_CONTRACT_UNVERIFIED');
 const queue=[...new Set([...defects,...holds])].map(code=>
  entry(code,urgent.has(code)||(!handoff.has(code)&&code!=='MANUAL_EXCEPTION_FOLLOWUP')?'P0':'P1',
   code.includes('HANDOFF')?(g?.latest_handoff_receipt||0):(g?.latest_owner_ack_receipt||0)));
 const ready=queue.length===0&&pos(g.decision_receipt)&&pos(g.latest_owner_ack_receipt)&&
   history.at(-1)?.review_flags?.length===0&&
   ['NOT_REQUIRED','LOCAL_REQUEST_ACK_OBSERVED'].includes(g.handoff_chain.status);
 if(queue.length===0&&!ready)queue.push(entry('REVIEW_CONTRACT_UNVERIFIED','P0'));
 if(ready)queue.push(entry('MANUAL_EXCEPTION_FOLLOWUP','P2',g.decision_receipt),
                    entry('MANUAL_CLOSURE_SAFETY_REVIEW','P3',g.latest_owner_ack_receipt));
 const order={P0:0,P1:1,P2:2,P3:3};
 queue.sort((a,b)=>order[a.priority]-order[b.priority]||b.receipt-a.receipt||a.code.localeCompare(b.code));
 return {build:424,status:ready?'READY_FOR_MANUAL_HANDOFF_ACCEPTANCE_REVIEW':'HOLD_FOR_MANUAL_OWNER_REVIEW',
  handoff_acceptance_review_ready:ready,handoff_accepted_automatically:false,
  exception_queue:queue.slice(0,102),queue_bounded:true,
  source_handoff_receipt:g?.latest_handoff_receipt||0,
  source_owner_ack_receipt:g?.latest_owner_ack_receipt||0,
  source_decision_receipt:g?.decision_receipt||0,
  manual_closure_safety:{closure_allowed_by_this_review:false,external_provider_state_verified:false,
    requires_current_authorized_owner:true,requires_independent_provider_evidence:true,
    requires_separate_explicit_manual_closure_decision:true,local_receipt_is_not_provider_confirmation:true},
  local_only:true,read_only:true,provider_called:false,publication_performed:false,
  notifications_sent:false,automatic_reopen:false,automatic_closure:false,us_shipping_suspended:true};
}
