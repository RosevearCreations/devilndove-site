/* Build 584: independently sourced witness REVIEW REQUESTS and explicit owner trial decision gate.
 * Typed, browser-local assertions are never authenticated provider evidence or owner sign-off. */
import {intake583,KEY_583} from './admin-channel-intake-583.mjs?v=584';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=584';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=584';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=584';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=584';

export const FORMAT_584='devilndove-provider-witness-owner-trial-gate-584-v1';
export const KEY_584='dd:provider-witness-owner-trial-gate:584:v1';
export const OUTCOMES_584=['AWAITING_INDEPENDENT_REVIEW','REFER_BACK_FOR_ACCOUNT_CONFLICT',
  'REFER_BACK_FOR_SCOPE_CONFLICT','REFER_BACK_FOR_UNKNOWN_PROVIDER_RESULT'];
export const OWNER_REQUESTS_584=['REQUEST_SEPARATE_OWNER_SIGNOFF','DEFER_TRIAL','DECLINE_TRIAL'];
const safe=(value,max)=>typeof value==='string'&&value.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(value);
export function witnessRequest584(row){
  if(!row||typeof row.claim_pin!=='string'||row.claim_pin.length<15||row.claim_pin.length>16000||
    !safe(row.evidence_locator,350)||row.evidence_locator.trim().length<8||
    !safe(row.reviewer_reference,200)||row.reviewer_reference.trim().length<4||
    !safe(row.provider_account,150)||!safe(row.claimed_scope,250)||
    !OUTCOMES_584.includes(row.review_outcome)||!safe(row.review_reason,800)||
    row.review_reason.trim().length<15||typeof row.recorded_at!=='string'||
    !Number.isFinite(Date.parse(row.recorded_at)))throw Error('Invalid witness review request.');
  return {claim_pin:row.claim_pin,evidence_locator:row.evidence_locator.trim(),
    reviewer_reference:row.reviewer_reference.trim(),provider_account:row.provider_account.trim(),
    claimed_scope:row.claimed_scope.trim(),review_outcome:row.review_outcome,
    review_reason:row.review_reason.trim(),recorded_at:row.recorded_at,
    authentication:'NOT_INDEPENDENTLY_AUTHENTICATED'};
}
export function ownerDecisionRequest584(row){
  if(!row||typeof row.claim_pin!=='string'||row.claim_pin.length<15||row.claim_pin.length>16000||
    !safe(row.channel,40)||!safe(row.account_id,150)||!safe(row.product_ref,100)||
    !safe(row.action,70)||!OWNER_REQUESTS_584.includes(row.owner_request)||
    !safe(row.reason,800)||row.reason.trim().length<15||
    typeof row.recorded_at!=='string'||!Number.isFinite(Date.parse(row.recorded_at)))
    throw Error('Invalid owner authorization decision request.');
  return {claim_pin:row.claim_pin,channel:row.channel,account_id:row.account_id,
    product_ref:row.product_ref,action:row.action,owner_request:row.owner_request,
    reason:row.reason.trim(),recorded_at:row.recorded_at,owner_authorization:'NOT_GRANTED'};
}
export function gate584(exactIntake,trialGate,ownerReview,notes,ownerFollowups,claims,
  resolutionRequests,submissions,witnessRequests=[],ownerRequests=[]){
  if(!Array.isArray(witnessRequests)||witnessRequests.length>100||
    !Array.isArray(ownerRequests)||ownerRequests.length>100)throw Error('Invalid witness/owner review list.');
  const checked=intake583(trialGate,ownerReview,notes,ownerFollowups,claims,resolutionRequests,submissions);
  if(JSON.stringify(exactIntake)!==JSON.stringify(checked))throw Error('Stale or altered exact intake source.');
  const witness=witnessRequests.map(witnessRequest584),owners=ownerRequests.map(ownerDecisionRequest584);
  const cases=checked.cases.map(item=>{
    const activeLocators=new Set(item.submitted_evidence.map(x=>x.source_locator));
    const reviews=witness.filter(x=>x.claim_pin===item.claim_pin&&activeLocators.has(x.evidence_locator));
    const decisions=owners.filter(x=>x.claim_pin===item.claim_pin&&x.channel===item.channel&&
      x.account_id===item.expected_account&&x.product_ref===item.product_ref&&x.action===item.action);
    const mismatchedAccounts=reviews.filter(x=>x.provider_account&&x.provider_account!==item.expected_account);
    const scopesToReview=reviews.filter(x=>x.claimed_scope&&
      !item.submitted_evidence.some(e=>e.source_locator===x.evidence_locator&&e.permission_scope===x.claimed_scope));
    return {claim_pin:item.claim_pin,channel:item.channel,account_id:item.expected_account,
      product_ref:item.product_ref,action:item.action,evidence_status:item.evidence_status,
      witness_review_requests:reviews,owner_decision_requests:decisions,
      account_disagreements:mismatchedAccounts.length,scope_disagreements:scopesToReview.length,
      independently_authenticated_receipt:false,owner_action_specific_signoff:false,
      trial_eligible:false,exception_closed:false,
      next_required_step:item.conflicting_account_references||mismatchedAccounts.length||scopesToReview.length?
        'RESOLVE_PROVENANCE_OR_SCOPE_CONFLICT_WITH_PROVIDER':
        'INDEPENDENTLY_AUTHENTICATE_PROVIDER_AND_OBTAIN_EXPLICIT_OWNER_SIGNOFF'};
  });
  const currentPins=new Set(checked.cases.map(x=>x.claim_pin));
  const activeLocators=new Set(checked.cases.flatMap(x=>x.submitted_evidence.map(e=>JSON.stringify([e.claim_pin,e.source_locator]))));
  const staleWitness=witness.filter(x=>!activeLocators.has(JSON.stringify([x.claim_pin,x.evidence_locator])));
  const staleOwner=owners.filter(x=>!currentPins.has(x.claim_pin)||
    !cases.some(c=>c.claim_pin===x.claim_pin&&c.channel===x.channel&&c.account_id===x.account_id&&
      c.product_ref===x.product_ref&&c.action===x.action));
  return {format:FORMAT_584,build:584,source_build:583,source_pin:checked.source_pin,
    open_exception_count:cases.length,cases,stale_witness_requests:staleWitness,
    stale_owner_requests:staleOwner,unverified_evidence_count:checked.documentary_submissions,
    current_witness_review_requests:cases.reduce((n,x)=>n+x.witness_review_requests.length,0),
    current_owner_decision_requests:cases.reduce((n,x)=>n+x.owner_decision_requests.length,0),
    authenticated_provider_receipts:0,verified_identity_and_scopes:0,
    verified_owner_action_authorizations:0,trial_eligible_cases:0,closed_exceptions:0,
    owner_decision:'NOT_AUTHENTICATED',owner_signoff:'PENDING',provider_writes:0,d1_operations:0,
    disposition:'HOLD_NO_AUTHENTICATED_PROVIDER_WITNESS_OR_EXPLICIT_OWNER_TRIAL_APPROVAL'};
}
function init584(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd584Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd584State'),output=get('dd584Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const requests=()=>read(KEY_584,{witness:[],owner:[]});
  const context=()=>{
    const source=get('dd583Output').value,trial=get('dd581Output').value,owner=get('dd580Output').value;
    if(!source||!trial||!owner||source.length>200000||trial.length>150000||owner.length>150000)
      throw Error('Recompute all source handoffs before witness review.');
    return [JSON.parse(source),JSON.parse(trial),JSON.parse(owner),read(KEY_578,trialPacket578([])),
      read(KEY_580,[]),read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[])];
  };
  const refresh=()=>{
    const saved=requests(),result=gate584(...context(),saved.witness,saved.owner);
    output.value=JSON.stringify(result,null,2);
    const selector=get('dd584Case'),previous=selector.value;selector.replaceChildren();
    result.cases.forEach((item,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${item.channel} · ${item.action} · ${item.product_ref} · HOLD`;selector.append(option);});
    if([...selector.options].some(x=>x.value===previous))selector.value=previous;
    status.textContent=`${result.open_exception_count} open case(s) · ${result.current_witness_review_requests} witness request(s) · ${result.current_owner_decision_requests} owner request(s) · ${result.stale_witness_requests.length+result.stale_owner_requests.length} stale · provider/auth trial HOLD.`;
    return result;
  };
  get('dd584Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Recompute sections 5–8. No authenticated trial exists.';}});
  get('dd584SaveWitness').addEventListener('click',()=>{
    if(!get('dd584Ack').checked){status.textContent='Confirm review requests do not authenticate provider evidence.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd584Case').value)];
      if(!item)throw Error('No current case.');
      const draft=witnessRequest584({claim_pin:item.claim_pin,evidence_locator:get('dd584Evidence').value,
        reviewer_reference:get('dd584Reviewer').value,provider_account:get('dd584Account').value,
        claimed_scope:get('dd584Scope').value,review_outcome:get('dd584Outcome').value,
        review_reason:get('dd584Reason').value,recorded_at:new Date().toISOString()});
      const source=context()[0].cases.find(c=>c.claim_pin===item.claim_pin);
      if(!source?.submitted_evidence.some(x=>x.source_locator===draft.evidence_locator))
        throw Error('Evidence locator is not pinned to this case.');
      const current=requests(),next={...current,witness:[...current.witness,draft]};
      gate584(...context(),next.witness,next.owner);win.localStorage.setItem(KEY_584,JSON.stringify(next));
      get('dd584Ack').checked=false;refresh();
    }catch{status.textContent='Witness request rejected: invalid or nonmatching evidence. No provider authentication.';}
  });
  get('dd584SaveOwner').addEventListener('click',()=>{
    if(!get('dd584OwnerAck').checked){status.textContent='Confirm this is only a separate owner decision request.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd584Case').value)];
      if(!item)throw Error('No current case.');
      const draft=ownerDecisionRequest584({claim_pin:item.claim_pin,channel:item.channel,
        account_id:item.account_id,product_ref:item.product_ref,action:item.action,
        owner_request:get('dd584OwnerRequest').value,reason:get('dd584OwnerReason').value,
        recorded_at:new Date().toISOString()});
      const current=requests(),next={...current,owner:[...current.owner,draft]};
      gate584(...context(),next.witness,next.owner);win.localStorage.setItem(KEY_584,JSON.stringify(next));
      get('dd584OwnerAck').checked=false;refresh();
    }catch{status.textContent='Owner decision request rejected. No provider trial authorized.';}
  });
  get('dd584Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Unverified witness and owner trial gate packet copied; HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild exact source before copying.';}});
}
if(typeof document!=='undefined')init584();
