/* Build 590: independent custody witness continuity and exact owner trial closure-readiness.
 * A browser-local witness chain is documentary only; it cannot authenticate or close a case. */
import {custody589,KEY_589} from './admin-channel-custody-589.mjs?v=590';
import {KEY_588} from './admin-channel-disposition-588.mjs?v=590';
import {KEY_587} from './admin-channel-provenance-triage-587.mjs?v=590';
import {KEY_586} from './admin-channel-aging-586.mjs?v=590';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=590';
import {KEY_584} from './admin-channel-witness-584.mjs?v=590';
import {KEY_583} from './admin-channel-intake-583.mjs?v=590';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=590';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=590';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=590';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=590';

export const FORMAT_590='devilndove-custody-witness-owner-closure-readiness-590-v1';
export const KEY_590='dd:custody-witness-owner-closure-readiness:590:v1';
export const ACTIONS_590=[
  'REQUEST_INDEPENDENT_WITNESS_CONTINUITY_ATTESTATION',
  'RECHECK_ORIGINAL_CUSTODY_HANDOFF_SEQUENCE','ESCALATE_WITNESS_CHAIN_BREAK',
  'REQUEST_EXPLICIT_OWNER_CLOSURE_DECISION',
  'RECHECK_EXACT_OWNER_SIGNOFF_SCOPE','MAINTAIN_OWNER_CLOSURE_HOLD'];
const ownerAction=x=>['REQUEST_EXPLICIT_OWNER_CLOSURE_DECISION',
  'RECHECK_EXACT_OWNER_SIGNOFF_SCOPE','MAINTAIN_OWNER_CLOSURE_HOLD'].includes(x);
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));

export function custodyPin590(item,review){
  if(!item?.disposition_pin||!review?.recorded_at)throw Error('Missing exact Build 589 custody identity.');
  return JSON.stringify([item.disposition_pin,review.recorded_at,review.handoff_reference,
    review.handoff_at,review.independent_witness_ref,review.owner_account_id,
    review.owner_product_ref,review.owner_action_scope,review.next_action]);
}
export function witnessRequest590(row){
  if(!row||!safe(row.custody_pin,30000)||row.custody_pin.length<40||
    !safe(row.disposition_pin,26000)||row.disposition_pin.length<40||
    !ACTIONS_590.includes(row.next_action)||!safe(row.previous_witness_ref,220)||
    !safe(row.current_witness_ref,220)||!safe(row.independent_reviewer_ref,200)||
    !safe(row.provider_custody_locator,350)||!safe(row.owner_decision_locator,350)||
    !safe(row.owner_account_id,150)||!safe(row.owner_product_ref,100)||
    !safe(row.owner_action_scope,100)||!safe(row.reason,900)||row.reason.trim().length<15||
    !date(row.recorded_at)||!date(row.next_review_at)||
    Date.parse(row.next_review_at)<Date.parse(row.recorded_at))
    throw Error('Invalid custody witness continuity or owner closure readiness follow-up.');
  return {custody_pin:row.custody_pin,disposition_pin:row.disposition_pin,
    next_action:row.next_action,previous_witness_ref:row.previous_witness_ref.trim(),
    current_witness_ref:row.current_witness_ref.trim(),
    independent_reviewer_ref:row.independent_reviewer_ref.trim(),
    provider_custody_locator:row.provider_custody_locator.trim(),
    owner_decision_locator:row.owner_decision_locator.trim(),
    owner_account_id:row.owner_account_id.trim(),owner_product_ref:row.owner_product_ref.trim(),
    owner_action_scope:row.owner_action_scope.trim(),reason:row.reason.trim(),
    recorded_at:row.recorded_at,next_review_at:row.next_review_at,
    witness_authentication:'NOT_PERFORMED',owner_decision_authentication:'NOT_PERFORMED',
    actual_exception_closed:false,provider_write_authorized:false};
}
export function witnessContinuity590(exactCustody,sourceArgs,requests=[],asOf=new Date().toISOString()){
  if(!exactCustody||!Array.isArray(sourceArgs)||sourceArgs.length!==20||
    !Array.isArray(requests)||requests.length>100||!date(asOf))
    throw Error('Invalid exact custody witness continuity packet.');
  const original=custody589(...sourceArgs,exactCustody.as_of);
  if(JSON.stringify(original)!==JSON.stringify(exactCustody))
    throw Error('Altered or stale exact Build 589 source-custody packet.');
  const current=custody589(...sourceArgs,asOf),rows=requests.map(witnessRequest590);
  const entries=current.cases.flatMap(c=>c.custody_reviews.map(r=>({case:c,source:r,
    custody_pin:custodyPin590(c,r)})));
  const activePins=new Set(entries.map(x=>x.custody_pin));
  const stale=rows.filter(x=>!activePins.has(x.custody_pin));
  const cases=entries.map(({case:c,source:s,custody_pin})=>{
    const isOwner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const matching=rows.filter(x=>x.custody_pin===custody_pin);
    let previous='';
    const reviews=matching.map(x=>{
      if(x.disposition_pin!==c.disposition_pin||ownerAction(x.next_action)!==isOwner)
        throw Error('Witness or owner action is inconsistent with exact custody case.');
      const gaps=[
        ...s.custody_gaps,...s.scope_conflicts,
        !x.provider_custody_locator?'PRIMARY_PROVIDER_CUSTODY_RECORD_NOT_PROVIDED':null,
        !x.current_witness_ref?'CURRENT_INDEPENDENT_WITNESS_REFERENCE_MISSING':null,
        !x.independent_reviewer_ref?'INDEPENDENT_REVIEWER_REFERENCE_MISSING':null,
        x.current_witness_ref&&x.current_witness_ref!==s.independent_witness_ref?
          'WITNESS_REFERENCE_DIFFERS_FROM_CUSTODY_SOURCE':null,
        x.independent_reviewer_ref&&x.independent_reviewer_ref===s.custodian_from?
          'WITNESS_INDEPENDENCE_CONFLICT':null,
        x.previous_witness_ref!==previous?'PREVIOUS_WITNESS_CONTINUITY_BREAK':null,
        isOwner&&!x.owner_decision_locator?'EXACT_OWNER_DECISION_REFERENCE_MISSING':null,
        isOwner&&(!x.owner_account_id||!x.owner_product_ref||!x.owner_action_scope)?
          'OWNER_SIGNOFF_SCOPE_INCOMPLETE':null,
        x.owner_account_id&&x.owner_account_id!==c.account_id?'OWNER_ACCOUNT_CHANGED':null,
        x.owner_product_ref&&x.owner_product_ref!==c.product_ref?'OWNER_PRODUCT_CHANGED':null,
        x.owner_action_scope&&x.owner_action_scope!==c.action?'OWNER_ACTION_CHANGED':null
      ].filter(Boolean);
      previous=x.current_witness_ref;
      return {...x,continuity_gaps:gaps,review_overdue:Date.parse(x.next_review_at)<Date.parse(asOf),
        documentary_recheck_complete:gaps.length===0,
        verified_closure_ready:false,independent_witness_authenticated:false,
        signed_owner_decision_verified:false,trial_eligible:false};
    });
    return {custody_pin,disposition_pin:c.disposition_pin,channel:c.channel,
      account_id:c.account_id,product_ref:c.product_ref,action:c.action,
      followup_type:c.followup_type,provider_request_id:c.provider_request_id,
      witness_continuity_reviews:reviews,latest_review:reviews.at(-1)||null,
      source_custody_gaps:s.custody_gaps,source_owner_scope_conflicts:s.scope_conflicts,
      unresolved_continuity_gaps:reviews.flatMap(x=>x.continuity_gaps),
      independent_witness_verified:false,owner_decision_verified:false,
      closure_ready:false,exception_closed:false};
  });
  const witnessRefCounts=new Map();for(const r of rows){if(r.current_witness_ref)
    witnessRefCounts.set(r.current_witness_ref,(witnessRefCounts.get(r.current_witness_ref)||0)+1);}
  return {format:FORMAT_590,build:590,source_build:589,source_pin:current.source_pin,
    as_of:asOf,open_closure_review_cases:cases.length,cases,stale_witness_requests:stale,
    pending_witness_reviews:cases.filter(x=>!x.witness_continuity_reviews.length).length,
    unresolved_continuity_gaps:cases.reduce((n,x)=>n+x.unresolved_continuity_gaps.length,0),
    overdue_witness_rechecks:cases.reduce((n,x)=>n+x.witness_continuity_reviews.filter(y=>y.review_overdue).length,0),
    repeated_candidate_witness_refs:[...witnessRefCounts].filter(([,n])=>n>1).map(([ref])=>ref),
    owner_trial_decision_cases:cases.filter(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION').length,
    independently_authenticated_custody_witnesses:0,verified_owner_trial_decisions:0,
    verified_closure_ready_cases:0,closed_exceptions:0,trial_eligible_cases:0,
    provider_writes:0,d1_operations:0,
    disposition:'HOLD_INDEPENDENT_CUSTODY_WITNESS_AND_EXACT_OWNER_CLOSURE_DECISION_NOT_VERIFIED'};
}
function init590(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd590Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd590State'),output=get('dd590Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_590,[]);
  const context=()=>{
    const ids=['dd589Output','dd588Output','dd587Output','dd586Output','dd585Output',
      'dd584Output','dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id).value;if(!raw||raw.length>500000)
      throw Error('Recompute exact source sections 5–14.');return JSON.parse(raw);});
    const witness=read(KEY_584,{witness:[],owner:[]});
    const sourceArgs=[...parsed.slice(1),read(KEY_578,trialPacket578([])),read(KEY_580,[]),
      read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),witness.witness,witness.owner,
      read(KEY_585,[]),read(KEY_586,[]),read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    return [parsed[0],sourceArgs];
  };
  const refresh=()=>{
    const packet=witnessContinuity590(...context(),saved());output.value=JSON.stringify(packet,null,2);
    const select=get('dd590Case'),previous=select.value;select.replaceChildren();
    packet.cases.forEach((c,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${c.channel} · ${c.product_ref} · ${c.followup_type}`;select.append(option);});
    if([...select.options].some(x=>x.value===previous))select.value=previous;
    status.textContent=`${packet.open_closure_review_cases} exact custody review(s) · ${packet.pending_witness_reviews} missing witness follow-up(s) · ${packet.unresolved_continuity_gaps} continuity gaps · ${packet.stale_witness_requests.length} stale · no verified owner closure.`;
    return packet;
  };
  get('dd590Review').addEventListener('click',()=>{try{refresh();}catch{
    status.textContent='Refresh exact source sections 5–14. Independent witness and owner trial HOLD.';}});
  get('dd590Save').addEventListener('click',()=>{
    if(!get('dd590Ack').checked){status.textContent='Acknowledge this is an unverified closure-readiness follow-up.';return;}
    try{const packet=refresh(),item=packet.cases[Number(get('dd590Case').value)];
      if(!item)throw Error('No current source-pinned custody review.');
      const draft=witnessRequest590({custody_pin:item.custody_pin,disposition_pin:item.disposition_pin,
        next_action:get('dd590Action').value,previous_witness_ref:get('dd590Previous').value,
        current_witness_ref:get('dd590Current').value,
        independent_reviewer_ref:get('dd590Reviewer').value,
        provider_custody_locator:get('dd590Custody').value,
        owner_decision_locator:get('dd590Owner').value,
        owner_account_id:get('dd590Account').value,owner_product_ref:get('dd590Product').value,
        owner_action_scope:get('dd590Scope').value,reason:get('dd590Reason').value,
        recorded_at:new Date().toISOString(),next_review_at:new Date(get('dd590Due').value).toISOString()});
      if(ownerAction(draft.next_action)!==
        (item.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'))throw Error('Wrong review kind.');
      const next=[...saved(),draft],checked=witnessContinuity590(...context(),next);
      if(!checked.cases.some(c=>c.custody_pin===draft.custody_pin&&
        c.witness_continuity_reviews.some(x=>x.recorded_at===draft.recorded_at)))throw Error('Stale source.');
      win.localStorage.setItem(KEY_590,JSON.stringify(next));get('dd590Ack').checked=false;refresh();
    }catch{status.textContent='Invalid, stale or wrong-scope witness follow-up. No approval or closure.';}
  });
  get('dd590Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);
      status.textContent='Unverified witness continuity/owner closure-readiness packet copied; HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild exact witness continuity packet before copying.';}});
}
if(typeof document!=='undefined')init590();
