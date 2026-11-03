/* Build 588: source-pinned provider disposition and exact owner decision evidence recheck.
 * Browser-local evidence candidates are never authenticated receipts or authorization. */
import {triage587,followupPin587,KEY_587} from './admin-channel-provenance-triage-587.mjs?v=588';
import {KEY_586} from './admin-channel-aging-586.mjs?v=588';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=588';
import {KEY_584} from './admin-channel-witness-584.mjs?v=588';
import {KEY_583} from './admin-channel-intake-583.mjs?v=588';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=588';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=588';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=588';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=588';

export const FORMAT_588='devilndove-provider-disposition-owner-decision-recheck-588-v1';
export const KEY_588='dd:provider-disposition-owner-decision-recheck:588:v1';
export const DISPOSITIONS_588=[
  'REQUEST_INDEPENDENT_RECEIPT_AUTHENTICATION','ESCALATE_SOURCE_ID_MISMATCH',
  'REQUEST_ACCOUNT_LISTING_SCOPE_RECHECK','REQUEST_EXPLICIT_OWNER_SCOPE_DECISION',
  'MAINTAIN_OWNER_TRIAL_HOLD','REQUEST_OWNER_DECLINE_RECORD'];
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const time=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const ownerAction=x=>['REQUEST_EXPLICIT_OWNER_SCOPE_DECISION','MAINTAIN_OWNER_TRIAL_HOLD',
  'REQUEST_OWNER_DECLINE_RECORD'].includes(x);
export function triagePin588(followup,request){
  if(!followup||!request||!request.recorded_at||!request.next_action)
    throw Error('Missing source-pinned triage entry.');
  return JSON.stringify([followup.followup_pin,request.next_action,request.recorded_at,
    request.external_locator,request.reviewer_ref,request.reason]);
}
export function dispositionRequest588(row){
  if(!row||!safe(row.triage_pin,24000)||row.triage_pin.length<30||
    !safe(row.followup_pin,20000)||row.followup_pin.length<20||
    !DISPOSITIONS_588.includes(row.next_disposition)||
    !safe(row.observed_account_id,150)||!safe(row.observed_product_ref,100)||
    !safe(row.observed_action,100)||!safe(row.observed_request_id,150)||
    !safe(row.evidence_locator,350)||!safe(row.independent_witness_ref,200)||
    !safe(row.owner_decision_locator,350)||!safe(row.reason,900)||
    row.reason.trim().length<15||!time(row.next_review_at)||!time(row.recorded_at)||
    Date.parse(row.next_review_at)<Date.parse(row.recorded_at))
    throw Error('Invalid open disposition/evidence recheck request.');
  return {triage_pin:row.triage_pin,followup_pin:row.followup_pin,
    next_disposition:row.next_disposition,observed_account_id:row.observed_account_id.trim(),
    observed_product_ref:row.observed_product_ref.trim(),observed_action:row.observed_action.trim(),
    observed_request_id:row.observed_request_id.trim(),evidence_locator:row.evidence_locator.trim(),
    independent_witness_ref:row.independent_witness_ref.trim(),
    owner_decision_locator:row.owner_decision_locator.trim(),reason:row.reason.trim(),
    next_review_at:row.next_review_at,recorded_at:row.recorded_at,
    source_authentication:'NOT_PERFORMED',owner_authorization:'NOT_GRANTED',
    exception_closed:false};
}
export function disposition588(exactTriage,exactAging,exactReceipt,exactWitness,exactIntake,
  trialGate,ownerReview,notes,ownerFollowups,claims,resolutionRequests,submissions,
  witnessRequests,ownerRequests,receiptFollowups,agingFollowups,triageRequests=[],
  dispositionRequests=[],asOf=new Date().toISOString()){
  if(!exactTriage||!Array.isArray(dispositionRequests)||dispositionRequests.length>100||!time(asOf))
    throw Error('Invalid independent provenance disposition packet.');
  const source=[exactAging,exactReceipt,exactWitness,exactIntake,trialGate,ownerReview,
    notes,ownerFollowups,claims,resolutionRequests,submissions,witnessRequests,
    ownerRequests,receiptFollowups,agingFollowups,triageRequests];
  const pinned=triage587(...source,exactTriage.as_of);
  if(JSON.stringify(pinned)!==JSON.stringify(exactTriage))
    throw Error('Altered or stale exact Build 587 provenance triage source.');
  const current=triage587(...source,asOf),requests=dispositionRequests.map(dispositionRequest588);
  const entries=current.cases.flatMap(c=>c.triage_requests.map(t=>({case:c,triage:t,
    triage_pin:triagePin588(c,t)})));
  const pins=new Set(entries.map(x=>x.triage_pin));
  const stale=requests.filter(x=>!pins.has(x.triage_pin));
  const rechecks=entries.map(({case:c,triage:t,triage_pin})=>{
    const matching=requests.filter(x=>x.triage_pin===triage_pin);
    const isOwner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const reviews=matching.map(row=>{
      if(row.followup_pin!==c.followup_pin||ownerAction(row.next_disposition)!==isOwner)
        throw Error('Disposition kind or exact follow-up identity does not match source.');
      const mismatches=[
        row.observed_account_id&&row.observed_account_id!==c.account_id?'ACCOUNT_ID_CONFLICT':null,
        row.observed_product_ref&&row.observed_product_ref!==c.product_ref?'PRODUCT_ID_CONFLICT':null,
        row.observed_action&&row.observed_action!==c.action?'ACTION_SCOPE_CONFLICT':null,
        row.observed_request_id&&row.observed_request_id!==c.provider_request_id?'PROVIDER_REQUEST_ID_CONFLICT':null
      ].filter(Boolean);
      const missing=isOwner?
        (row.owner_decision_locator?'OWNER_DECISION_REFERENCE_NOT_INDEPENDENTLY_AUTHENTICATED':
          'EXACT_OWNER_DECISION_EVIDENCE_MISSING'):
        (!row.evidence_locator||!row.independent_witness_ref?
          'PRIMARY_PROVIDER_RECEIPT_OR_INDEPENDENT_WITNESS_MISSING':
          'PROVIDER_RECEIPT_REFERENCE_NOT_INDEPENDENTLY_AUTHENTICATED');
      return {...row,source_conflicts:mismatches,evidence_gap:missing,
        review_overdue:Date.parse(row.next_review_at)<Date.parse(asOf),
        decision_readiness:'EXTERNAL_AUTHENTICATION_AND_OWNER_SIGNOFF_REQUIRED',
        trial_authorized:false,provider_receipt_authenticated:false};
    });
    const latest=reviews.length?reviews[reviews.length-1]:null;
    return {triage_pin,followup_pin:c.followup_pin,channel:c.channel,account_id:c.account_id,
      product_ref:c.product_ref,action:c.action,provider_request_id:c.provider_request_id,
      followup_type:c.followup_type,triage_action:t.next_action,age_bucket:c.age_bucket,
      source_priority:c.priority,provenance_gaps:c.provenance_gaps,disposition_reviews:reviews,
      latest_review:latest,open_exceptions:[...c.provenance_gaps,
        ...(latest?.source_conflicts||[]),...(latest?[latest.evidence_gap]:[])],
      next_step:latest?.next_disposition||(isOwner?'REQUEST_EXPLICIT_OWNER_SCOPE_DECISION':
        'REQUEST_INDEPENDENT_RECEIPT_AUTHENTICATION'),
      independent_provider_receipt_verified:false,owner_action_authorized:false,
      provider_write_authorized:false,exception_closed:false};
  });
  return {format:FORMAT_588,build:588,source_build:587,source_pin:current.source_pin,
    as_of:asOf,open_disposition_cases:rechecks.length,cases:rechecks,
    stale_disposition_requests:stale,missing_review_count:rechecks.filter(x=>!x.latest_review).length,
    overdue_rechecks:rechecks.reduce((n,c)=>n+c.disposition_reviews.filter(x=>x.review_overdue).length,0),
    identity_conflicts:rechecks.reduce((n,c)=>n+c.disposition_reviews.reduce((a,r)=>a+r.source_conflicts.length,0),0),
    owner_decision_cases:rechecks.filter(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION').length,
    provider_receipts_authenticated:0,verified_owner_trial_decisions:0,closed_exceptions:0,
    trial_eligible_cases:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_INDEPENDENT_PROVIDER_EVIDENCE_AND_EXACT_OWNER_TRIAL_DECISION_NOT_AUTHENTICATED'};
}
function init588(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd588Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd588State'),output=get('dd588Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_588,[]);
  const context=()=>{
    const ids=['dd587Output','dd586Output','dd585Output','dd584Output','dd583Output',
      'dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id).value;if(!raw||raw.length>400000)
      throw Error('Recompute exact source sections 5–12.');return JSON.parse(raw);});
    const witnesses=read(KEY_584,{witness:[],owner:[]});
    return [...parsed,read(KEY_578,trialPacket578([])),read(KEY_580,[]),read(KEY_581,[]),
      read(KEY_582,[]),read(KEY_583,[]),witnesses.witness,witnesses.owner,
      read(KEY_585,[]),read(KEY_586,[]),read(KEY_587,[])];
  };
  const refresh=()=>{
    const result=disposition588(...context(),saved());output.value=JSON.stringify(result,null,2);
    const select=get('dd588Case'),previous=select.value;select.replaceChildren();
    result.cases.forEach((item,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${item.channel} · ${item.product_ref} · ${item.followup_type} · ${item.source_priority}`;
      select.append(option);});
    if([...select.options].some(x=>x.value===previous))select.value=previous;
    status.textContent=`${result.open_disposition_cases} source-pinned triage(s) · ${result.missing_review_count} missing rechecks · ${result.identity_conflicts} identity conflicts · ${result.stale_disposition_requests.length} stale · provider/owner trial HOLD.`;
    return result;
  };
  get('dd588Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Refresh sections 5–12 before disposition evidence recheck. Trial HOLD.';}});
  get('dd588Save').addEventListener('click',()=>{
    if(!get('dd588Ack').checked){status.textContent='Confirm this is only an unverified disposition request.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd588Case').value)];
      if(!item)throw Error('No exact source triage request.');
      const draft=dispositionRequest588({triage_pin:item.triage_pin,followup_pin:item.followup_pin,
        next_disposition:get('dd588Action').value,observed_account_id:get('dd588Account').value,
        observed_product_ref:get('dd588Product').value,observed_action:get('dd588Scope').value,
        observed_request_id:get('dd588Correlation').value,evidence_locator:get('dd588Evidence').value,
        independent_witness_ref:get('dd588Witness').value,
        owner_decision_locator:get('dd588Owner').value,reason:get('dd588Reason').value,
        recorded_at:new Date().toISOString(),next_review_at:new Date(get('dd588Due').value).toISOString()});
      if(ownerAction(draft.next_disposition)!==
        (item.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'))throw Error('Wrong review kind.');
      const next=[...saved(),draft],checked=disposition588(...context(),next);
      if(!checked.cases.some(c=>c.triage_pin===draft.triage_pin&&
        c.disposition_reviews.some(x=>x.recorded_at===draft.recorded_at)))throw Error('Stale source.');
      win.localStorage.setItem(KEY_588,JSON.stringify(next));get('dd588Ack').checked=false;refresh();
    }catch{status.textContent='Invalid, stale or scope-inconsistent disposition. No approval or closure.';}
  });
  get('dd588Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Unverified disposition and owner decision recheck copied; HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild exact disposition packet before copying.';}});
}
if(typeof document!=='undefined')init588();
