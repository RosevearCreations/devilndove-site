/* Build 585: source-authentication readiness for provider receipts, with exact owner trial exception follow-up.
 * No browser-entered value or reviewer assertion authenticates a provider or authorizes a write. */
import {gate584,KEY_584} from './admin-channel-witness-584.mjs?v=585';
import {KEY_583} from './admin-channel-intake-583.mjs?v=585';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=585';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=585';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=585';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=585';

export const FORMAT_585='devilndove-source-authenticated-receipt-followup-585-v1';
export const KEY_585='dd:provider-receipt-exception-followups:585:v1';
export const ACTIONS_585=['REQUEST_INDEPENDENT_AUTHENTICATED_PROVIDER_READBACK',
  'ESCALATE_UNKNOWN_OR_DUPLICATE_PROVIDER_RESULT','REQUEST_EXACT_LISTING_IMAGE_RECONCILIATION',
  'REQUEST_EXPLICIT_OWNER_ACTION_DECISION'];
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const ids=v=>Array.isArray(v)&&v.length<=20&&v.every(x=>safe(x,120)&&x.trim().length>0);
export function receiptFollowup585(row){
  if(!row||typeof row.claim_pin!=='string'||row.claim_pin.length<15||row.claim_pin.length>16000||
    !safe(row.witness_locator,350)||row.witness_locator.trim().length<8||
    !safe(row.provider_request_id,150)||!safe(row.account_id,150)||!safe(row.listing_id,150)||
    !ids(row.image_ids)||!safe(row.permission_scope,250)||!safe(row.reviewer_reference,200)||
    !ACTIONS_585.includes(row.followup_action)||!safe(row.reason,900)||row.reason.trim().length<15||
    typeof row.recorded_at!=='string'||!Number.isFinite(Date.parse(row.recorded_at)))
    throw Error('Invalid external receipt follow-up claim.');
  return {claim_pin:row.claim_pin,witness_locator:row.witness_locator.trim(),
    provider_request_id:row.provider_request_id.trim(),account_id:row.account_id.trim(),
    listing_id:row.listing_id.trim(),image_ids:row.image_ids.map(x=>x.trim()),
    permission_scope:row.permission_scope.trim(),reviewer_reference:row.reviewer_reference.trim(),
    followup_action:row.followup_action,reason:row.reason.trim(),recorded_at:row.recorded_at,
    source_authentication:'INDEPENDENT_PROVIDER_READBACK_NOT_PERFORMED'};
}
export function reconcile585(exactWitnessGate,exactIntake,trialGate,ownerReview,notes,ownerFollowups,
  claims,resolutionRequests,submissions,witnessRequests,ownerRequests,followups=[]){
  if(!Array.isArray(followups)||followups.length>100)throw Error('Invalid provider receipt follow-up list.');
  const checked=gate584(exactIntake,trialGate,ownerReview,notes,ownerFollowups,claims,
    resolutionRequests,submissions,witnessRequests,ownerRequests);
  if(JSON.stringify(exactWitnessGate)!==JSON.stringify(checked))throw Error('Stale or altered witness review source.');
  const rows=followups.map(receiptFollowup585),expected=ownerReview?.exact_comparison?.expected;
  if(!expected||!ids(expected.image_ids))throw Error('Missing original source-matched listing and image identifiers.');
  const cases=checked.cases.map(item=>{
    const validWitness=new Set(item.witness_review_requests.map(x=>x.evidence_locator));
    const matching=rows.filter(x=>x.claim_pin===item.claim_pin&&validWitness.has(x.witness_locator));
    const conflicts=matching.map(x=>({
      provider_request_id:x.provider_request_id,
      account_mismatch:Boolean(x.account_id&&x.account_id!==item.account_id),
      listing_mismatch:Boolean(x.listing_id&&x.listing_id!==expected.listing_id),
      missing_or_mismatched_images:!x.image_ids.length||
        x.image_ids.length!==expected.image_ids.length||
        new Set(x.image_ids).size!==x.image_ids.length||
        !expected.image_ids.every(id=>x.image_ids.includes(id)),
      scope_mismatch:Boolean(x.permission_scope&&!item.witness_review_requests.some(w=>
        w.evidence_locator===x.witness_locator&&w.claimed_scope===x.permission_scope)),
      independent_source_authentication:'NOT_PERFORMED'
    }));
    return {claim_pin:item.claim_pin,channel:item.channel,account_id:item.account_id,
      product_ref:item.product_ref,action:item.action,expected_listing_id:expected.listing_id,
      expected_image_ids:[...expected.image_ids],receipt_followups:matching,receipt_comparisons:conflicts,
      open_conflicts:conflicts.reduce((n,x)=>n+Number(x.account_mismatch)+Number(x.listing_mismatch)+
        Number(x.missing_or_mismatched_images)+Number(x.scope_mismatch),0),
      receipt_authenticated:false,exact_owner_decision_authenticated:false,
      exception_closed:false,write_authorized:false};
  });
  const matchingKeys=new Set(cases.flatMap(item=>item.receipt_followups.map(x=>
    JSON.stringify([x.claim_pin,x.witness_locator,x.provider_request_id,x.recorded_at]))));
  const stale=rows.filter(x=>!matchingKeys.has(JSON.stringify([
    x.claim_pin,x.witness_locator,x.provider_request_id,x.recorded_at])));
  const correlationCount=new Map();
  for(const x of rows){if(x.provider_request_id){const key=x.provider_request_id;
    correlationCount.set(key,(correlationCount.get(key)||0)+1);}}
  const duplicateProviderRequestIds=[...correlationCount].filter(([,count])=>count>1).map(([id])=>id);
  return {format:FORMAT_585,build:585,source_build:584,source_pin:checked.source_pin,
    cases,stale_followups:stale,duplicate_provider_request_ids:duplicateProviderRequestIds,
    open_exception_count:cases.length,source_mismatch_count:cases.reduce((n,x)=>n+x.open_conflicts,0),
    matching_followups:cases.reduce((n,x)=>n+x.receipt_followups.length,0),
    authenticated_provider_receipts:0,verified_remote_images:0,verified_permissions:0,
    verified_owner_trial_authorizations:0,trial_eligible_cases:0,closed_exceptions:0,
    owner_decision:'NOT_AUTHENTICATED',owner_signoff:'PENDING',provider_writes:0,d1_operations:0,
    disposition:'HOLD_PENDING_SOURCE_AUTHENTICATED_PROVIDER_RECEIPT_AND_EXPLICIT_OWNER_ACTION_SIGNOFF'};
}
function init585(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd585Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd585State'),output=get('dd585Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const notes=()=>read(KEY_578,trialPacket578([]));
  const saved585=()=>read(KEY_585,[]);
  const context=()=>{
    const witness=get('dd584Output').value,intake=get('dd583Output').value,
      trial=get('dd581Output').value,owner=get('dd580Output').value;
    if(!witness||!intake||!trial||!owner||witness.length>250000||intake.length>200000||
      trial.length>150000||owner.length>150000)throw Error('Recompute exact-source sections 5–9 first.');
    const review=read(KEY_584,{witness:[],owner:[]});
    return [JSON.parse(witness),JSON.parse(intake),JSON.parse(trial),JSON.parse(owner),
      notes(),read(KEY_580,[]),read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),
      review.witness,review.owner];
  };
  const refresh=()=>{
    const result=reconcile585(...context(),saved585());output.value=JSON.stringify(result,null,2);
    const select=get('dd585Case'),previous=select.value;select.replaceChildren();
    result.cases.forEach((item,i)=>{const opt=doc.createElement('option');opt.value=String(i);
      opt.textContent=`${item.channel} · ${item.action} · ${item.product_ref} · ${item.open_conflicts} mismatch(es)`;select.append(opt);});
    if([...select.options].some(x=>x.value===previous))select.value=previous;
    status.textContent=`${result.open_exception_count} open case(s) · ${result.matching_followups} pending receipt follow-up(s) · ${result.stale_followups.length} stale · ${result.source_mismatch_count} mismatches · authenticated receipts 0 · HOLD.`;
    return result;
  };
  get('dd585Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Recompute sections 5–9 before source-authentication reconciliation; trial HOLD.';}});
  get('dd585Save').addEventListener('click',()=>{
    if(!get('dd585Ack').checked){status.textContent='Confirm that external source authentication and owner approval remain outstanding.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd585Case').value)];
      if(!item)throw Error('No current case.');
      const draft=receiptFollowup585({claim_pin:item.claim_pin,witness_locator:get('dd585Witness').value,
        provider_request_id:get('dd585Correlation').value,account_id:get('dd585Account').value,
        listing_id:get('dd585Listing').value,image_ids:get('dd585Images').value.split(/[\s,]+/).filter(Boolean),
        permission_scope:get('dd585Scope').value,reviewer_reference:get('dd585Reviewer').value,
        followup_action:get('dd585Action').value,reason:get('dd585Reason').value,
        recorded_at:new Date().toISOString()});
      const witness=context()[0].cases.find(x=>x.claim_pin===draft.claim_pin);
      if(!witness?.witness_review_requests.some(x=>x.evidence_locator===draft.witness_locator))
        throw Error('Witness evidence source does not match exact current case.');
      const next=[...saved585(),draft];reconcile585(...context(),next);
      win.localStorage.setItem(KEY_585,JSON.stringify(next));get('dd585Ack').checked=false;refresh();
    }catch{status.textContent='Invalid or stale provider receipt follow-up. No source authentication or approval occurred.';}
  });
  get('dd585Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Pending receipt/owner exception packet copied; no write authorized.';}
    catch{output.focus();output.select();status.textContent='Select packet and copy manually.';}}
  catch{status.textContent='Recheck the exact current source before copying.';}});
}
if(typeof document!=='undefined')init585();
