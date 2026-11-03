/* Build 587: exact-source provider receipt provenance aging and owner decision exception triage.
 * Browser-local triage cannot authenticate provider records or authorize any trial. */
import {aging586,KEY_586} from './admin-channel-aging-586.mjs?v=587';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=587';
import {KEY_584} from './admin-channel-witness-584.mjs?v=587';
import {KEY_583} from './admin-channel-intake-583.mjs?v=587';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=587';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=587';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=587';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=587';

export const FORMAT_587='devilndove-provider-provenance-owner-triage-587-v1';
export const KEY_587='dd:provider-provenance-owner-triage:587:v1';
export const ACTIONS_587=[
  'REQUEST_PRIMARY_PROVIDER_RECEIPT','ESCALATE_PROVENANCE_OR_SCOPE_CONFLICT',
  'RECHECK_DUPLICATE_OR_UNKNOWN_RESULT','REQUEST_EXACT_OWNER_TRIAL_SIGNOFF',
  'DEFER_OWNER_TRIAL','DECLINE_OWNER_TRIAL'];
const safe=(value,max)=>typeof value==='string'&&value.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(value);
export function followupPin587(row){
  if(!row||!row.claim_pin||!row.followup_type||!row.recorded_at)throw Error('Missing source follow-up identity.');
  return JSON.stringify([row.claim_pin,row.channel,row.account_id,row.product_ref,row.action,
    row.provider_request_id,row.followup_type,row.recorded_at]);
}
const ownerAction=action=>['REQUEST_EXACT_OWNER_TRIAL_SIGNOFF','DEFER_OWNER_TRIAL','DECLINE_OWNER_TRIAL'].includes(action);
export function triageRequest587(row){
  if(!row||!safe(row.followup_pin,20000)||row.followup_pin.length<20||
    !ACTIONS_587.includes(row.next_action)||!safe(row.external_locator,350)||
    !safe(row.reviewer_ref,200)||!safe(row.reason,900)||row.reason.trim().length<15||
    typeof row.recorded_at!=='string'||!Number.isFinite(Date.parse(row.recorded_at)))
    throw Error('Invalid open provenance/owner triage request.');
  return {followup_pin:row.followup_pin,next_action:row.next_action,
    external_locator:row.external_locator.trim(),reviewer_ref:row.reviewer_ref.trim(),
    reason:row.reason.trim(),recorded_at:row.recorded_at,
    evidence_authentication:'NOT_PERFORMED',owner_authorization:'NOT_GRANTED'};
}
export function triage587(exactAging,exactReceipt,exactWitness,exactIntake,trialGate,ownerReview,
  notes,ownerFollowups,claims,resolutionRequests,submissions,witnessRequests,ownerRequests,
  receiptFollowups,agingFollowups,triageRequests=[],asOf=new Date().toISOString()){
  if(!exactAging||!Array.isArray(triageRequests)||triageRequests.length>100||
    !Number.isFinite(Date.parse(asOf)))throw Error('Invalid provenance triage packet.');
  const source=[exactReceipt,exactWitness,exactIntake,trialGate,ownerReview,notes,
    ownerFollowups,claims,resolutionRequests,submissions,witnessRequests,ownerRequests,
    receiptFollowups,agingFollowups];
  const pinned=aging586(...source,exactAging.as_of);
  if(JSON.stringify(exactAging)!==JSON.stringify(pinned))throw Error('Altered or stale exact aging source.');
  const current=aging586(...source,asOf),rows=triageRequests.map(triageRequest587),
    pins=new Set(current.priority_queue.map(followupPin587));
  const active=rows.filter(x=>pins.has(x.followup_pin)),stale=rows.filter(x=>!pins.has(x.followup_pin));
  const cases=current.priority_queue.map(entry=>{
    const pin=followupPin587(entry),matches=active.filter(x=>x.followup_pin===pin);
    const sourceCase=exactReceipt.cases.find(x=>x.claim_pin===entry.claim_pin);
    const duplicate=Boolean(entry.provider_request_id&&
      exactReceipt.duplicate_provider_request_ids.includes(entry.provider_request_id));
    const gaps=['INDEPENDENT_PRIMARY_PROVIDER_RECEIPT_NOT_AUTHENTICATED',
      'EXACT_OWNER_ACTION_SIGNOFF_NOT_VERIFIED'];
    if(entry.followup_type==='INDEPENDENT_RECEIPT_WITNESS')gaps.push('INDEPENDENT_WITNESS_PROVENANCE_NOT_VERIFIED');
    if(sourceCase?.open_conflicts)gaps.push('EXACT_ACCOUNT_LISTING_IMAGE_OR_SCOPE_CONFLICT');
    if(duplicate)gaps.push('DUPLICATE_PROVIDER_CORRELATION_REQUIRES_READBACK');
    if(!entry.provider_request_id)gaps.push('PROVIDER_REQUEST_CORRELATION_MISSING');
    return {followup_pin:pin,claim_pin:entry.claim_pin,channel:entry.channel,
      account_id:entry.account_id,product_ref:entry.product_ref,action:entry.action,
      provider_request_id:entry.provider_request_id,followup_type:entry.followup_type,
      source_recorded_at:entry.recorded_at,due_at:entry.due_at,overdue_days:entry.overdue_days,
      age_bucket:entry.bucket,provenance_gaps:gaps,triage_requests:matches,
      priority:sourceCase?.open_conflicts||duplicate?'SOURCE_CONFLICT_REVIEW':
        entry.overdue_days>7?'OVERDUE_OWNER_ATTENTION':entry.overdue_days>0?'OVERDUE_FOLLOWUP':'AWAITING_EXTERNAL_EVIDENCE',
      provider_receipt_verified:false,owner_trial_signoff_verified:false,
      exception_closed:false,provider_write_authorized:false};
  });
  const invalidAction=cases.flatMap(c=>c.triage_requests.filter(x=>
    ownerAction(x.next_action)!==(c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION')));
  if(invalidAction.length)throw Error('Owner action triage does not match exact source follow-up kind.');
  return {format:FORMAT_587,build:587,source_build:586,source_pin:current.source_pin,
    as_of:asOf,open_followup_count:cases.length,cases,stale_triage_requests:stale,
    stale_prior_followups:current.stale_followups.length,
    source_conflict_cases:cases.filter(x=>x.priority==='SOURCE_CONFLICT_REVIEW').length,
    overdue_cases:cases.filter(x=>x.overdue_days>0).length,
    owner_decision_followups:cases.filter(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION').length,
    authenticated_provider_receipts:0,verified_owner_trial_signoffs:0,closed_exceptions:0,
    trial_eligible_cases:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_INDEPENDENT_PROVENANCE_AND_EXACT_OWNER_AUTHORIZATION_NOT_ESTABLISHED'};
}
function init587(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd587Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd587State'),output=get('dd587Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_587,[]);
  const context=()=>{
    const ids=['dd586Output','dd585Output','dd584Output','dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id).value;if(!raw||raw.length>350000)
      throw Error('Recompute exact source sections 5–11.');return JSON.parse(raw);});
    const witness=read(KEY_584,{witness:[],owner:[]});
    return [...parsed,read(KEY_578,trialPacket578([])),read(KEY_580,[]),read(KEY_581,[]),
      read(KEY_582,[]),read(KEY_583,[]),witness.witness,witness.owner,
      read(KEY_585,[]),read(KEY_586,[])];
  };
  const refresh=()=>{
    const result=triage587(...context(),saved());output.value=JSON.stringify(result,null,2);
    const selector=get('dd587Case'),previous=selector.value;selector.replaceChildren();
    result.cases.forEach((item,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${item.channel} · ${item.product_ref} · ${item.followup_type} · ${item.priority}`;selector.append(option);});
    if([...selector.options].some(x=>x.value===previous))selector.value=previous;
    status.textContent=`${result.open_followup_count} open source-pinned follow-up(s) · ${result.overdue_cases} overdue · ${result.source_conflict_cases} provenance conflicts · ${result.stale_triage_requests.length} stale triage(s) · no provider or owner approval.`;
    return result;
  };
  get('dd587Review').addEventListener('click',()=>{try{refresh();}catch{status.textContent='Refresh sections 5–11 before source-authentication triage. Trial HOLD.';}});
  get('dd587Save').addEventListener('click',()=>{
    if(!get('dd587Ack').checked){status.textContent='Acknowledge this is an unresolved triage request only.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd587Case').value)];
      if(!item)throw Error('No exact-source follow-up selected.');
      const draft=triageRequest587({followup_pin:item.followup_pin,next_action:get('dd587Action').value,
        external_locator:get('dd587Locator').value,reviewer_ref:get('dd587Reviewer').value,
        reason:get('dd587Reason').value,recorded_at:new Date().toISOString()});
      if(ownerAction(draft.next_action)!==(item.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'))
        throw Error('Wrong owner/provider review action.');
      const next=[...saved(),draft],checked=triage587(...context(),next);
      if(!checked.cases.some(c=>c.followup_pin===draft.followup_pin&&
        c.triage_requests.some(t=>t.recorded_at===draft.recorded_at)))throw Error('Stale source.');
      win.localStorage.setItem(KEY_587,JSON.stringify(next));get('dd587Ack').checked=false;refresh();
    }catch{status.textContent='Invalid, stale or scope-inconsistent triage. No exception closed or trial authorized.';}
  });
  get('dd587Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);status.textContent='Open provenance and owner triage copied; HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild exact provenance triage before copying.';}});
}
if(typeof document!=='undefined')init587();
