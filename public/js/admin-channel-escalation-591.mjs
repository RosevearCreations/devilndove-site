/* Build 591: exact-source witness continuity exception escalation and owner trial decision handoff.
 * Escalations are browser-local REVIEW REQUESTS, never source attestation, approval or provider writes. */
import {witnessContinuity590,KEY_590} from './admin-channel-witness-continuity-590.mjs?v=591';
import {KEY_589} from './admin-channel-custody-589.mjs?v=591';
import {KEY_588} from './admin-channel-disposition-588.mjs?v=591';
import {KEY_587} from './admin-channel-provenance-triage-587.mjs?v=591';
import {KEY_586} from './admin-channel-aging-586.mjs?v=591';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=591';
import {KEY_584} from './admin-channel-witness-584.mjs?v=591';
import {KEY_583} from './admin-channel-intake-583.mjs?v=591';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=591';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=591';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=591';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=591';

export const FORMAT_591='devilndove-witness-continuity-owner-gate-escalation-591-v1';
export const KEY_591='dd:witness-owner-gate-escalation:591:v1';
export const ACTIONS_591=[
  'ESCALATE_INDEPENDENT_WITNESS_CHAIN_BREAK','REQUEST_PRIMARY_PROVIDER_CUSTODY_ATTESTATION',
  'RECHECK_ORIGINAL_WITNESS_SOURCE_CHAIN','REQUEST_EXACT_OWNER_GATE_DECISION',
  'ESCALATE_OWNER_ACTION_SCOPE_CONFLICT','REQUEST_OWNER_TRIAL_DEFER_OR_DECLINE'];
const ownerAction=v=>['REQUEST_EXACT_OWNER_GATE_DECISION','ESCALATE_OWNER_ACTION_SCOPE_CONFLICT',
  'REQUEST_OWNER_TRIAL_DEFER_OR_DECLINE'].includes(v);
const safe=(value,max)=>typeof value==='string'&&value.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(value);
const timestamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

export function witnessPin591(item,review){
  if(!item?.custody_pin||!review?.recorded_at)throw Error('Missing exact Build 590 witness identity.');
  return JSON.stringify([item.custody_pin,review.recorded_at,review.next_action,
    review.previous_witness_ref,review.current_witness_ref,
    review.independent_reviewer_ref,review.owner_account_id,
    review.owner_product_ref,review.owner_action_scope,review.reason]);
}
export function escalationRequest591(row){
  if(!row||!safe(row.witness_pin,32000)||row.witness_pin.length<40||
    !safe(row.custody_pin,30000)||row.custody_pin.length<40||
    !ACTIONS_591.includes(row.next_action)||!safe(row.independent_case_ref,350)||
    !safe(row.escalation_owner_ref,200)||!safe(row.primary_receipt_ref,350)||
    !safe(row.owner_handoff_ref,350)||!safe(row.provider_account_id,150)||
    !safe(row.product_ref,100)||!safe(row.action_scope,100)||
    !safe(row.reason,900)||row.reason.trim().length<15||
    !timestamp(row.recorded_at)||!timestamp(row.next_review_at)||
    Date.parse(row.next_review_at)<Date.parse(row.recorded_at))
    throw Error('Invalid independent witness escalation or exact owner decision handoff.');
  return {witness_pin:row.witness_pin,custody_pin:row.custody_pin,
    next_action:row.next_action,independent_case_ref:row.independent_case_ref.trim(),
    escalation_owner_ref:row.escalation_owner_ref.trim(),
    primary_receipt_ref:row.primary_receipt_ref.trim(),owner_handoff_ref:row.owner_handoff_ref.trim(),
    provider_account_id:row.provider_account_id.trim(),product_ref:row.product_ref.trim(),
    action_scope:row.action_scope.trim(),reason:row.reason.trim(),
    recorded_at:row.recorded_at,next_review_at:row.next_review_at,
    independent_attestation:'NOT_PERFORMED',owner_trial_authorization:'NOT_GRANTED',
    provider_request_sent:false,exception_closed:false};
}
export function escalation591(exactWitness,sourceArgs,requests=[],asOf=new Date().toISOString()){
  if(!exactWitness||!Array.isArray(sourceArgs)||sourceArgs.length!==3||
    !Array.isArray(requests)||requests.length>100||!timestamp(asOf))
    throw Error('Invalid exact witness escalation packet.');
  const pinned=witnessContinuity590(...sourceArgs,exactWitness.as_of);
  if(JSON.stringify(pinned)!==JSON.stringify(exactWitness))
    throw Error('Altered or stale exact Build 590 witness continuity source.');
  const current=witnessContinuity590(...sourceArgs,asOf),rows=requests.map(escalationRequest591);
  const entries=current.cases.flatMap(c=>c.witness_continuity_reviews.map(r=>({case:c,source:r,
    witness_pin:witnessPin591(c,r)})));
  const activePins=new Set(entries.map(x=>x.witness_pin));
  const stale=rows.filter(x=>!activePins.has(x.witness_pin));
  const cases=entries.map(({case:c,source:r,witness_pin})=>{
    const isOwner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const matching=rows.filter(x=>x.witness_pin===witness_pin);
    const followups=matching.map(x=>{
      if(x.custody_pin!==c.custody_pin||ownerAction(x.next_action)!==isOwner)
        throw Error('Escalation does not match exact witness or owner decision source.');
      const scopeConflicts=[
        x.provider_account_id&&x.provider_account_id!==c.account_id?'EXACT_OWNER_ACCOUNT_MISMATCH':null,
        x.product_ref&&x.product_ref!==c.product_ref?'EXACT_PRODUCT_MISMATCH':null,
        x.action_scope&&x.action_scope!==c.action?'EXACT_TRIAL_ACTION_MISMATCH':null
      ].filter(Boolean);
      const missing=[
        !x.independent_case_ref?'INDEPENDENT_EXTERNAL_CASE_REFERENCE_MISSING':null,
        !x.escalation_owner_ref?'ASSIGNED_INDEPENDENT_REVIEWER_MISSING':null,
        !x.primary_receipt_ref?'ORIGINAL_PROVIDER_RECEIPT_REFERENCE_MISSING':null,
        isOwner&&!x.owner_handoff_ref?'EXACT_OWNER_DECISION_HANDOFF_REFERENCE_MISSING':null,
        isOwner&&(!x.provider_account_id||!x.product_ref||!x.action_scope)?
          'OWNER_HANDOFF_SCOPE_INCOMPLETE':null
      ].filter(Boolean);
      return {...x,scope_conflicts:scopeConflicts,missing_external_evidence:missing,
        source_witness_gaps:r.continuity_gaps,
        review_overdue:Date.parse(x.next_review_at)<Date.parse(asOf),
        documentary_handoff_packet_complete:!scopeConflicts.length&&!missing.length&&
          !r.continuity_gaps.length,
        independent_witness_verified:false,owner_action_approved:false,
        case_closed:false,trial_eligible:false};
    });
    const latest=followups.at(-1)||null;
    return {witness_pin,custody_pin:c.custody_pin,channel:c.channel,
      account_id:c.account_id,product_ref:c.product_ref,action:c.action,
      followup_type:c.followup_type,original_witness_gaps:r.continuity_gaps,
      escalation_followups:followups,latest_followup:latest,
      priority:r.continuity_gaps.includes('PREVIOUS_WITNESS_CONTINUITY_BREAK')?
        'WITNESS_CONTINUITY_BREAK':r.continuity_gaps.length?'UNVERIFIED_SOURCE_EXCEPTION':
        isOwner?'OWNER_TRIAL_GATE_DECISION_PENDING':'INDEPENDENT_ATTESTATION_PENDING',
      next_external_action:latest?.next_action||(isOwner?'REQUEST_EXACT_OWNER_GATE_DECISION':
        'REQUEST_PRIMARY_PROVIDER_CUSTODY_ATTESTATION'),
      witnessed_source_authenticated:false,owner_trial_authorized:false,
      closure_approved:false,provider_write_authorized:false};
  });
  const correlationCount=new Map();for(const row of rows){if(row.independent_case_ref)
    correlationCount.set(row.independent_case_ref,(correlationCount.get(row.independent_case_ref)||0)+1);}
  return {format:FORMAT_591,build:591,source_build:590,source_pin:current.source_pin,
    as_of:asOf,open_escalation_cases:cases.length,cases,stale_escalation_requests:stale,
    missing_handoffs:cases.filter(c=>!c.escalation_followups.length).length,
    unverified_source_gaps:cases.reduce((n,c)=>n+c.original_witness_gaps.length,0),
    owner_scope_conflicts:cases.reduce((n,c)=>n+c.escalation_followups.reduce((m,x)=>m+x.scope_conflicts.length,0),0),
    overdue_escalations:cases.reduce((n,c)=>n+c.escalation_followups.filter(x=>x.review_overdue).length,0),
    duplicate_external_case_refs:[...correlationCount].filter(([,n])=>n>1).map(([ref])=>ref),
    owner_decision_handoffs:cases.filter(c=>c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'&&
      c.escalation_followups.length).length,
    authenticated_provider_witnesses:0,verified_owner_trial_signoffs:0,
    verified_exception_closures:0,trial_eligible_cases:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_INDEPENDENT_WITNESS_CONTINUITY_AND_EXACT_OWNER_DECISION_HANDOFF_NOT_VERIFIED'};
}
function init591(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd591Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd591State'),output=get('dd591Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_591,[]);
  const context=()=>{
    const ids=['dd590Output','dd589Output','dd588Output','dd587Output','dd586Output',
      'dd585Output','dd584Output','dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id).value;if(!raw||raw.length>500000)
      throw Error('Recompute exact source sections 5–15.');return JSON.parse(raw);});
    const witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...parsed.slice(2),read(KEY_578,trialPacket578([])),read(KEY_580,[]),
      read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),witness.witness,witness.owner,
      read(KEY_585,[]),read(KEY_586,[]),read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    return [parsed[0],[parsed[1],custodyArgs,read(KEY_590,[])]];
  };
  const refresh=()=>{
    const packet=escalation591(...context(),saved());output.value=JSON.stringify(packet,null,2);
    const select=get('dd591Case'),previous=select.value;select.replaceChildren();
    packet.cases.forEach((c,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${c.channel} · ${c.product_ref} · ${c.priority}`;select.append(option);});
    if([...select.options].some(x=>x.value===previous))select.value=previous;
    status.textContent=`${packet.open_escalation_cases} source-pinned escalation(s) · ${packet.missing_handoffs} missing handoffs · ${packet.unverified_source_gaps} open witness gaps · ${packet.owner_scope_conflicts} scope conflicts · trial HOLD.`;
    return packet;
  };
  get('dd591Review').addEventListener('click',()=>{try{refresh();}catch{
    status.textContent='Refresh sections 5–15 before exact witness escalation or owner handoff. Trial HOLD.';}});
  get('dd591Save').addEventListener('click',()=>{
    if(!get('dd591Ack').checked){status.textContent='Confirm this is only an unverified external escalation request.';return;}
    try{const result=refresh(),item=result.cases[Number(get('dd591Case').value)];
      if(!item)throw Error('No exact witness source.');
      const draft=escalationRequest591({witness_pin:item.witness_pin,custody_pin:item.custody_pin,
        next_action:get('dd591Action').value,independent_case_ref:get('dd591External').value,
        escalation_owner_ref:get('dd591Reviewer').value,primary_receipt_ref:get('dd591Receipt').value,
        owner_handoff_ref:get('dd591Owner').value,provider_account_id:get('dd591Account').value,
        product_ref:get('dd591Product').value,action_scope:get('dd591Scope').value,
        reason:get('dd591Reason').value,recorded_at:new Date().toISOString(),
        next_review_at:new Date(get('dd591Due').value).toISOString()});
      if(ownerAction(draft.next_action)!==
        (item.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'))throw Error('Wrong escalation kind.');
      const next=[...saved(),draft],checked=escalation591(...context(),next);
      if(!checked.cases.some(c=>c.witness_pin===draft.witness_pin&&
        c.escalation_followups.some(x=>x.recorded_at===draft.recorded_at)))throw Error('Stale source.');
      win.localStorage.setItem(KEY_591,JSON.stringify(next));get('dd591Ack').checked=false;refresh();
    }catch{status.textContent='Invalid, stale or wrong-scope escalation. No owner approval or closure.';}
  });
  get('dd591Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);
      status.textContent='Open witness escalation/owner gate handoff copied; no provider trial authorized.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild exact witness escalation packet before copying.';}});
}
if(typeof document!=='undefined')init591();
