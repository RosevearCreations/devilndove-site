/* Build 589: independent evidence source-custody follow-up and exact owner trial scope revalidation.
 * Local references are never provider authentication, owner consent or authority to execute. */
import {disposition588,KEY_588} from './admin-channel-disposition-588.mjs?v=589';
import {KEY_587} from './admin-channel-provenance-triage-587.mjs?v=589';
import {KEY_586} from './admin-channel-aging-586.mjs?v=589';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=589';
import {KEY_584} from './admin-channel-witness-584.mjs?v=589';
import {KEY_583} from './admin-channel-intake-583.mjs?v=589';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=589';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=589';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=589';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=589';

export const FORMAT_589='devilndove-provider-source-custody-owner-scope-revalidation-589-v1';
export const KEY_589='dd:provider-source-custody-owner-scope-recheck:589:v1';
export const ACTIONS_589=['REQUEST_ORIGINAL_PROVIDER_CUSTODY_RECORD',
  'RECHECK_INDEPENDENT_CUSTODIAN_AND_WITNESS','ESCALATE_UNBROKEN_CHAIN_NOT_ESTABLISHED',
  'REQUEST_SEPARATELY_SIGNED_EXACT_OWNER_DECISION','RECHECK_OWNER_ACCOUNT_PRODUCT_ACTION_SCOPE',
  'MAINTAIN_OWNER_AUTHORIZATION_HOLD'];
const ownerAction=x=>['REQUEST_SEPARATELY_SIGNED_EXACT_OWNER_DECISION',
  'RECHECK_OWNER_ACCOUNT_PRODUCT_ACTION_SCOPE','MAINTAIN_OWNER_AUTHORIZATION_HOLD'].includes(x);
const safe=(value,max)=>typeof value==='string'&&value.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(value);
const timestamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
export function dispositionPin589(item,review){
  if(!item?.triage_pin||!review?.recorded_at)throw Error('Missing exact Build 588 disposition identity.');
  return JSON.stringify([item.triage_pin,review.recorded_at,review.next_disposition,
    review.observed_account_id,review.observed_product_ref,review.observed_action,
    review.observed_request_id,review.next_review_at,review.reason]);
}
export function custodyRequest589(row){
  if(!row||!safe(row.disposition_pin,26000)||row.disposition_pin.length<40||
    !safe(row.triage_pin,24000)||row.triage_pin.length<30||
    !ACTIONS_589.includes(row.next_action)||!safe(row.receipt_locator,350)||
    !safe(row.custodian_from,160)||!safe(row.custodian_to,160)||
    !safe(row.handoff_reference,350)||!safe(row.independent_witness_ref,200)||
    !safe(row.owner_decision_reference,350)||!safe(row.owner_account_id,150)||
    !safe(row.owner_product_ref,100)||!safe(row.owner_action_scope,100)||
    !safe(row.reason,900)||row.reason.trim().length<15||!timestamp(row.recorded_at)||
    !timestamp(row.next_review_at)||Date.parse(row.next_review_at)<Date.parse(row.recorded_at)||
    (row.handoff_at!==''&&!timestamp(row.handoff_at))||
    (row.owner_scope_expires_at!==''&&!timestamp(row.owner_scope_expires_at))||
    (row.handoff_at!==''&&Date.parse(row.handoff_at)>Date.parse(row.recorded_at)))
    throw Error('Invalid source-custody or owner decision scope recheck.');
  return {disposition_pin:row.disposition_pin,triage_pin:row.triage_pin,
    next_action:row.next_action,receipt_locator:row.receipt_locator.trim(),
    custodian_from:row.custodian_from.trim(),custodian_to:row.custodian_to.trim(),
    handoff_reference:row.handoff_reference.trim(),handoff_at:row.handoff_at,
    independent_witness_ref:row.independent_witness_ref.trim(),
    owner_decision_reference:row.owner_decision_reference.trim(),
    owner_account_id:row.owner_account_id.trim(),owner_product_ref:row.owner_product_ref.trim(),
    owner_action_scope:row.owner_action_scope.trim(),
    owner_scope_expires_at:row.owner_scope_expires_at,
    next_review_at:row.next_review_at,reason:row.reason.trim(),recorded_at:row.recorded_at,
    custody_authenticated:'NOT_PERFORMED',owner_decision_authenticated:'NOT_PERFORMED',
    owner_authorization:'NOT_GRANTED',exception_closed:false};
}
export function custody589(exactDisposition,exactTriage,exactAging,exactReceipt,exactWitness,
  exactIntake,trialGate,ownerReview,notes,ownerFollowups,claims,resolutionRequests,
  submissions,witnessRequests,ownerRequests,receiptFollowups,agingFollowups,
  triageRequests=[],dispositionRequests=[],custodyRequests=[],asOf=new Date().toISOString()){
  if(!exactDisposition||!Array.isArray(custodyRequests)||custodyRequests.length>100||
    !timestamp(asOf))throw Error('Invalid provider custody recheck packet.');
  const source=[exactTriage,exactAging,exactReceipt,exactWitness,exactIntake,trialGate,
    ownerReview,notes,ownerFollowups,claims,resolutionRequests,submissions,
    witnessRequests,ownerRequests,receiptFollowups,agingFollowups,triageRequests,
    dispositionRequests];
  const pinned=disposition588(...source,exactDisposition.as_of);
  if(JSON.stringify(pinned)!==JSON.stringify(exactDisposition))
    throw Error('Altered or stale exact Build 588 disposition source.');
  const current=disposition588(...source,asOf),rows=custodyRequests.map(custodyRequest589);
  const entries=current.cases.flatMap(c=>c.disposition_reviews.map(r=>({case:c,source:r,
    disposition_pin:dispositionPin589(c,r)})));
  const activePins=new Set(entries.map(x=>x.disposition_pin));
  const stale=rows.filter(x=>!activePins.has(x.disposition_pin));
  const cases=entries.map(({case:c,source:r,disposition_pin})=>{
    const isOwner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const matching=rows.filter(x=>x.disposition_pin===disposition_pin);
    const reviews=matching.map(x=>{
      if(x.triage_pin!==c.triage_pin||ownerAction(x.next_action)!==isOwner)
        throw Error('Exact disposition or provider/owner review kind does not match source.');
      const scopeConflicts=[
        x.owner_account_id&&x.owner_account_id!==c.account_id?'OWNER_ACCOUNT_SCOPE_CONFLICT':null,
        x.owner_product_ref&&x.owner_product_ref!==c.product_ref?'OWNER_PRODUCT_SCOPE_CONFLICT':null,
        x.owner_action_scope&&x.owner_action_scope!==c.action?'OWNER_ACTION_SCOPE_CONFLICT':null
      ].filter(Boolean);
      const custodyGaps=[
        !x.receipt_locator?'PRIMARY_PROVIDER_RECEIPT_CUSTODY_MISSING':null,
        !x.custodian_from||!x.custodian_to?'CUSTODIAN_HANDOFF_IDENTITY_INCOMPLETE':null,
        !x.handoff_reference||!x.handoff_at?'CUSTODY_HANDOFF_TIMESTAMP_OR_REFERENCE_MISSING':null,
        !x.independent_witness_ref?'INDEPENDENT_CUSTODY_WITNESS_MISSING':null,
        x.custodian_from&&x.custodian_to&&x.custodian_from===x.custodian_to?
          'INDEPENDENT_CUSTODIAN_NOT_ESTABLISHED':null,
        isOwner&&!x.owner_decision_reference?'EXACT_OWNER_SIGNED_DECISION_REFERENCE_MISSING':null,
        isOwner&&(!x.owner_account_id||!x.owner_product_ref||!x.owner_action_scope)?
          'OWNER_TRIAL_SCOPE_INCOMPLETE':null,
        x.owner_scope_expires_at&&Date.parse(x.owner_scope_expires_at)<=Date.parse(asOf)?
          'CANDIDATE_OWNER_SCOPE_EXPIRED':null
      ].filter(Boolean);
      return {...x,scope_conflicts:scopeConflicts,custody_gaps:custodyGaps,
        next_review_overdue:Date.parse(x.next_review_at)<Date.parse(asOf),
        independent_provider_receipt_authenticated:false,
        independent_custody_verified:false,verified_owner_trial_signoff:false,
        owner_trial_authorized:false};
    });
    return {disposition_pin,triage_pin:c.triage_pin,channel:c.channel,account_id:c.account_id,
      product_ref:c.product_ref,action:c.action,provider_request_id:c.provider_request_id,
      followup_type:c.followup_type,source_priority:c.source_priority,
      prior_provenance_conflicts:r.source_conflicts,prior_evidence_gap:r.evidence_gap,
      custody_reviews:reviews,pending_custody_checks:reviews.flatMap(x=>x.custody_gaps),
      pending_scope_conflicts:reviews.flatMap(x=>x.scope_conflicts),
      independent_source_authenticated:false,owner_trial_authorized:false,
      exception_closed:false,provider_write_authorized:false};
  });
  const duplicateHandoffRefs=new Set();
  const refCounts=new Map();for(const row of rows){if(row.handoff_reference){
    refCounts.set(row.handoff_reference,(refCounts.get(row.handoff_reference)||0)+1);}}
  for(const [ref,n] of refCounts){if(n>1)duplicateHandoffRefs.add(ref);}
  return {format:FORMAT_589,build:589,source_build:588,source_pin:current.source_pin,
    as_of:asOf,open_custody_cases:cases.length,cases,stale_custody_requests:stale,
    missing_custody_reviews:cases.filter(x=>!x.custody_reviews.length).length,
    unresolved_custody_gaps:cases.reduce((n,x)=>n+x.pending_custody_checks.length,0),
    owner_scope_conflicts:cases.reduce((n,x)=>n+x.pending_scope_conflicts.length,0),
    overdue_custody_rechecks:cases.reduce((n,x)=>n+x.custody_reviews.filter(y=>y.next_review_overdue).length,0),
    duplicate_candidate_handoff_references:[...duplicateHandoffRefs],
    owner_decision_cases:cases.filter(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION').length,
    source_custody_authenticated:0,independent_provider_receipts_authenticated:0,
    verified_owner_trial_authorizations:0,closed_exceptions:0,trial_eligible_cases:0,
    provider_writes:0,d1_operations:0,
    disposition:'HOLD_PROVIDER_CUSTODY_AND_EXACT_OWNER_SCOPE_NOT_INDEPENDENTLY_AUTHENTICATED'};
}
function init589(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd589Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd589State'),output=get('dd589Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_589,[]);
  const context=()=>{
    const ids=['dd588Output','dd587Output','dd586Output','dd585Output','dd584Output',
      'dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id).value;if(!raw||raw.length>450000)
      throw Error('Recompute exact source sections 5–13.');return JSON.parse(raw);});
    const witness=read(KEY_584,{witness:[],owner:[]});
    return [...parsed,read(KEY_578,trialPacket578([])),read(KEY_580,[]),read(KEY_581,[]),
      read(KEY_582,[]),read(KEY_583,[]),witness.witness,witness.owner,
      read(KEY_585,[]),read(KEY_586,[]),read(KEY_587,[]),read(KEY_588,[])];
  };
  const refresh=()=>{
    const packet=custody589(...context(),saved());output.value=JSON.stringify(packet,null,2);
    const selector=get('dd589Case'),previous=selector.value;selector.replaceChildren();
    packet.cases.forEach((entry,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${entry.channel} · ${entry.product_ref} · ${entry.followup_type}`;
      selector.append(option);});
    if([...selector.options].some(x=>x.value===previous))selector.value=previous;
    status.textContent=`${packet.open_custody_cases} exact disposition(s) · ${packet.missing_custody_reviews} custody reviews missing · ${packet.unresolved_custody_gaps} custody gaps · ${packet.owner_scope_conflicts} owner scope conflicts · trial HOLD.`;
    return packet;
  };
  get('dd589Review').addEventListener('click',()=>{try{refresh();}catch{
    status.textContent='Refresh sections 5–13 to recheck source custody and owner scope. Trial HOLD.';}});
  get('dd589Save').addEventListener('click',()=>{
    if(!get('dd589Ack').checked){status.textContent='Acknowledge this is an unverified custody follow-up only.';return;}
    try{const packet=refresh(),item=packet.cases[Number(get('dd589Case').value)];
      if(!item)throw Error('No exact disposition selected.');
      const draft=custodyRequest589({disposition_pin:item.disposition_pin,triage_pin:item.triage_pin,
        next_action:get('dd589Action').value,receipt_locator:get('dd589Receipt').value,
        custodian_from:get('dd589From').value,custodian_to:get('dd589To').value,
        handoff_reference:get('dd589Handoff').value,
        handoff_at:get('dd589HandoffAt').value?new Date(get('dd589HandoffAt').value).toISOString():'',
        independent_witness_ref:get('dd589Witness').value,
        owner_decision_reference:get('dd589OwnerDecision').value,
        owner_account_id:get('dd589Account').value,owner_product_ref:get('dd589Product').value,
        owner_action_scope:get('dd589Scope').value,
        owner_scope_expires_at:get('dd589Expiry').value?new Date(get('dd589Expiry').value).toISOString():'',
        reason:get('dd589Reason').value,recorded_at:new Date().toISOString(),
        next_review_at:new Date(get('dd589Due').value).toISOString()});
      if(ownerAction(draft.next_action)!==
        (item.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'))throw Error('Wrong review kind.');
      const next=[...saved(),draft],checked=custody589(...context(),next);
      if(!checked.cases.some(c=>c.disposition_pin===draft.disposition_pin&&
        c.custody_reviews.some(x=>x.recorded_at===draft.recorded_at)))throw Error('Stale source.');
      win.localStorage.setItem(KEY_589,JSON.stringify(next));get('dd589Ack').checked=false;refresh();
    }catch{status.textContent='Invalid, stale or wrong-scope custody recheck. No provider or owner authorization.';}
  });
  get('dd589Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);
      status.textContent='Unverified source custody and owner scope recheck copied; trial HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild exact source-custody packet before copying.';}});
}
if(typeof document!=='undefined')init589();
