/* Build 593: independent provider response authenticity exception matrix and owner decision readiness.
 * This worksheet does NOT independently authenticate any provider or approve any external trial. */
import {receiptReconciliation592,KEY_592} from './admin-channel-receipt-reconciliation-592.mjs?v=593';
import {KEY_591} from './admin-channel-escalation-591.mjs?v=593';
import {KEY_590} from './admin-channel-witness-continuity-590.mjs?v=593';
import {KEY_589} from './admin-channel-custody-589.mjs?v=593';
import {KEY_588} from './admin-channel-disposition-588.mjs?v=593';
import {KEY_587} from './admin-channel-provenance-triage-587.mjs?v=593';
import {KEY_586} from './admin-channel-aging-586.mjs?v=593';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=593';
import {KEY_584} from './admin-channel-witness-584.mjs?v=593';
import {KEY_583} from './admin-channel-intake-583.mjs?v=593';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=593';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=593';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=593';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=593';

export const FORMAT_593='devilndove-independent-response-owner-scope-readiness-593-v1';
export const KEY_593='dd:independent-response-owner-scope-readiness:593:v1';
export const ACTIONS_593=[
  'REQUEST_PROVIDER_ORIGIN_AUTHENTICATION','ESCALATE_RESPONSE_SOURCE_MISMATCH',
  'RECHECK_INDEPENDENT_PROVIDER_WITNESS',
  'REQUEST_SEPARATELY_SIGNED_OWNER_SCOPE_DECISION','RECHECK_EXACT_OWNER_SCOPE',
  'REQUEST_OWNER_DEFER_OR_DECLINE_EVIDENCE'];
export const DECISIONS_593=['UNDECIDED','APPROVAL_REQUESTED','DECLINE_REQUESTED','DEFER_REQUESTED'];
const ownerAction=v=>ACTIONS_593.slice(3).includes(v);
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));

export function responsePin593(c,followup){
  if(!c?.escalation_pin||!followup?.recorded_at)throw Error('Missing exact Build 592 receipt review.');
  return JSON.stringify([c.escalation_pin,followup.recorded_at,followup.next_action,
    followup.external_case_ref,followup.original_provider_receipt_ref,
    followup.external_response_ref,followup.independent_reviewer_ref,
    followup.independent_witness_ref,followup.owner_decision_ref,
    followup.owner_signer_ref,followup.provider_account_id,followup.product_ref,
    followup.action_scope,followup.next_review_at]);
}
export function authenticityCandidate593(row){
  if(!row||!safe(row.response_pin,48000)||row.response_pin.length<40||
    !ACTIONS_593.includes(row.next_action)||!DECISIONS_593.includes(row.owner_decision_outcome)||
    !safe(row.external_case_ref,350)||!safe(row.primary_receipt_ref,350)||
    !safe(row.provider_response_ref,350)||!safe(row.provider_origin_ref,200)||
    !safe(row.independent_reviewer_ref,200)||!safe(row.independent_witness_ref,200)||
    !safe(row.owner_decision_ref,350)||!safe(row.owner_signer_ref,200)||
    !safe(row.provider_account_id,150)||!safe(row.product_ref,100)||
    !safe(row.action_scope,100)||!safe(row.reason,900)||row.reason.trim().length<15||
    !validDate(row.recorded_at)||!validDate(row.next_review_at)||
    Date.parse(row.next_review_at)<Date.parse(row.recorded_at)||
    row.provider_authenticated===true||row.owner_trial_authorized===true||
    row.exception_closed===true||row.provider_write_authorized===true)
    throw Error('Invalid independent authenticity or owner scope decision candidate.');
  return {response_pin:row.response_pin,next_action:row.next_action,
    owner_decision_outcome:row.owner_decision_outcome,
    external_case_ref:row.external_case_ref.trim(),primary_receipt_ref:row.primary_receipt_ref.trim(),
    provider_response_ref:row.provider_response_ref.trim(),provider_origin_ref:row.provider_origin_ref.trim(),
    independent_reviewer_ref:row.independent_reviewer_ref.trim(),
    independent_witness_ref:row.independent_witness_ref.trim(),
    owner_decision_ref:row.owner_decision_ref.trim(),owner_signer_ref:row.owner_signer_ref.trim(),
    provider_account_id:row.provider_account_id.trim(),product_ref:row.product_ref.trim(),
    action_scope:row.action_scope.trim(),reason:row.reason.trim(),
    recorded_at:row.recorded_at,next_review_at:row.next_review_at,
    provider_authentication:'NOT_PERFORMED',owner_decision_authentication:'NOT_PERFORMED',
    request_sent:false,trial_authorized:false,exception_closed:false};
}
export function authenticityMatrix593(exactReceipt,sourceArgs,requests=[],asOf=new Date().toISOString()){
  if(!exactReceipt||!Array.isArray(sourceArgs)||sourceArgs.length!==3||
    !Array.isArray(requests)||requests.length>100||!validDate(asOf))
    throw Error('Invalid exact Build 592 authenticity source.');
  const original=receiptReconciliation592(...sourceArgs,exactReceipt.as_of);
  if(JSON.stringify(original)!==JSON.stringify(exactReceipt))
    throw Error('Altered or stale exact Build 592 receipt source.');
  const current=receiptReconciliation592(...sourceArgs,asOf);
  const rows=requests.map(authenticityCandidate593);
  const entries=current.cases.flatMap(c=>c.reconciliations.map((r,i)=>({
    case:c,receipt:r,response_pin:responsePin593(c,r),
    superseded:c.superseded_source_escalation||i<c.reconciliations.length-1})));
  const active=new Set(entries.map(e=>e.response_pin));
  const stale=rows.filter(x=>!active.has(x.response_pin));
  const cases=entries.map(({case:c,receipt:r,response_pin,superseded})=>{
    const isOwner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const reviews=rows.filter(x=>x.response_pin===response_pin).map(x=>{
      if(ownerAction(x.next_action)!==isOwner||
        (!isOwner&&x.owner_decision_outcome!=='UNDECIDED'))
        throw Error('Response or owner-decision request differs from exact case type.');
      const conflicts=[
        x.external_case_ref&&x.external_case_ref!==r.external_case_ref?
          'EXTERNAL_CASE_SOURCE_CONFLICT':null,
        x.primary_receipt_ref&&x.primary_receipt_ref!==r.original_provider_receipt_ref?
          'ORIGINAL_PROVIDER_RECEIPT_CONFLICT':null,
        x.provider_response_ref&&x.provider_response_ref!==r.external_response_ref?
          'EXTERNAL_RESPONSE_ID_CONFLICT':null,
        x.independent_reviewer_ref&&x.independent_reviewer_ref!==r.independent_reviewer_ref?
          'INDEPENDENT_REVIEWER_SOURCE_CONFLICT':null,
        x.independent_witness_ref&&x.independent_witness_ref!==r.independent_witness_ref?
          'INDEPENDENT_WITNESS_SOURCE_CONFLICT':null,
        x.provider_origin_ref&&x.provider_origin_ref===x.independent_reviewer_ref?
          'PROVIDER_ORIGIN_REVIEWER_NOT_INDEPENDENT':null,
        x.independent_witness_ref&&x.independent_witness_ref===x.independent_reviewer_ref?
          'INDEPENDENT_WITNESS_EQUALS_REVIEWER':null,
        x.provider_account_id&&x.provider_account_id!==c.account_id?'OWNER_ACCOUNT_SCOPE_CONFLICT':null,
        x.product_ref&&x.product_ref!==c.product_ref?'OWNER_PRODUCT_SCOPE_CONFLICT':null,
        x.action_scope&&x.action_scope!==c.action?'OWNER_EXACT_ACTION_SCOPE_CONFLICT':null
      ].filter(Boolean);
      const missing=[
        ...r.source_conflicts,...r.unverified_evidence_gaps,
        !x.external_case_ref?'PRIMARY_EXTERNAL_CASE_ID_MISSING':null,
        !x.primary_receipt_ref?'PRIMARY_PROVIDER_RECEIPT_ID_MISSING':null,
        !x.provider_response_ref?'ORIGINAL_PROVIDER_RESPONSE_ID_MISSING':null,
        !x.provider_origin_ref?'INDEPENDENT_PROVIDER_ORIGIN_CUSTODY_MISSING':null,
        !x.independent_reviewer_ref?'SEPARATE_REVIEWER_ID_MISSING':null,
        !x.independent_witness_ref?'ORIGINAL_WITNESS_ID_MISSING':null,
        isOwner&&!x.owner_decision_ref?'SEPARATELY_SIGNED_OWNER_DECISION_LOCATOR_MISSING':null,
        isOwner&&!x.owner_signer_ref?'INDEPENDENT_OWNER_SIGNER_ID_MISSING':null,
        isOwner&&(!x.provider_account_id||!x.product_ref||!x.action_scope)?
          'EXACT_OWNER_ACCOUNT_PRODUCT_ACTION_INCOMPLETE':null,
        isOwner&&x.owner_decision_outcome==='UNDECIDED'?'EXPLICIT_OWNER_DECISION_NOT_RECORDED':null,
        superseded?'RECEIPT_SOURCE_SUPERSEDED':null
      ].filter(Boolean);
      const exceptions=[...new Set([...conflicts,...missing])];
      return {...x,source_conflicts:conflicts,authenticity_exceptions:exceptions,
        review_overdue:Date.parse(x.next_review_at)<Date.parse(asOf),
        documentary_scope_aligned:!exceptions.length,
        independently_authenticated:false,owner_signed_decision_verified:false,
        trial_eligible:false,exception_closed:false};
    });
    return {response_pin,escalation_pin:c.escalation_pin,channel:c.channel,
      account_id:c.account_id,product_ref:c.product_ref,action:c.action,
      followup_type:c.followup_type,source_receipt_ref:r.original_provider_receipt_ref,
      source_response_ref:r.external_response_ref,superseded_source:superseded,
      source_exceptions:[...new Set([...r.source_conflicts,...r.unverified_evidence_gaps])],
      authenticity_reviews:reviews,latest_review:reviews.at(-1)||null,
      priority:superseded?'SUPERSEDED_SOURCE_HOLD':
        r.source_conflicts.length?'SOURCE_IDENTITY_CONFLICT':
        isOwner?'EXACT_OWNER_SCOPE_DECISION_PENDING':'INDEPENDENT_PROVIDER_ORIGIN_PENDING',
      provider_authenticated:false,owner_decision_verified:false,
      trial_eligible:false,exception_closed:false};
  });
  const repeated=new Map();
  for(const row of rows){if(row.provider_response_ref)
    repeated.set(row.provider_response_ref,(repeated.get(row.provider_response_ref)||0)+1);}
  return {format:FORMAT_593,build:593,source_build:592,source_pin:current.source_pin,
    as_of:asOf,open_authenticity_cases:cases.length,cases,
    source_cases_without_receipt:current.cases.filter(x=>!x.reconciliations.length).length,
    stale_authenticity_requests:stale,
    missing_authenticity_reviews:cases.filter(x=>!x.authenticity_reviews.length).length,
    identity_scope_conflicts:cases.reduce((n,c)=>n+c.authenticity_reviews.reduce((m,x)=>m+x.source_conflicts.length,0),0),
    open_authenticity_exceptions:cases.reduce((n,c)=>n+c.authenticity_reviews.reduce((m,x)=>m+x.authenticity_exceptions.length,0),0),
    overdue_authenticity_rechecks:cases.reduce((n,c)=>n+c.authenticity_reviews.filter(x=>x.review_overdue).length,0),
    duplicate_candidate_provider_responses:[...repeated].filter(([,n])=>n>1).map(([ref])=>ref),
    pending_owner_scope_decisions:cases.filter(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION').length,
    independently_verified_provider_responses:0,verified_owner_scope_decisions:0,
    approved_trials:0,closed_exceptions:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_PROVIDER_ORIGIN_AUTHENTICITY_AND_EXACT_OWNER_DECISION_NOT_VERIFIED'};
}
function init593(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd593Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd593State'),output=get('dd593Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_593,[]);
  const context=()=>{
    const ids=['dd592Output','dd591Output','dd590Output','dd589Output','dd588Output',
      'dd587Output','dd586Output','dd585Output','dd584Output','dd583Output',
      'dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id)?.value;if(!raw||raw.length>500000)
      throw Error('Recompute exact source sections 5–17.');return JSON.parse(raw);});
    const witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...parsed.slice(4),read(KEY_578,trialPacket578([])),read(KEY_580,[]),
      read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),witness.witness,witness.owner,
      read(KEY_585,[]),read(KEY_586,[]),read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    const escalationArgs=[parsed[2],[parsed[3],custodyArgs,read(KEY_590,[])],read(KEY_591,[])];
    return [parsed[0],[parsed[1],escalationArgs,read(KEY_592,[])]];
  };
  const refresh=()=>{
    const packet=authenticityMatrix593(...context(),saved());
    output.value=JSON.stringify(packet,null,2);
    const select=get('dd593Case'),before=select.value;select.replaceChildren();
    packet.cases.forEach((c,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=c.channel+' · '+c.product_ref+' · '+c.priority;
      select.append(option);});
    if([...select.options].some(x=>x.value===before))select.value=before;
    status.textContent=packet.open_authenticity_cases+' response authenticity case(s) · '+
      packet.missing_authenticity_reviews+' missing follow-ups · '+
      packet.identity_scope_conflicts+' source conflicts · '+
      packet.overdue_authenticity_rechecks+' overdue · trial HOLD.';
    return packet;
  };
  get('dd593Review').addEventListener('click',()=>{try{refresh();}catch{
    status.textContent='Recompute exact sections 5–17. Provider and owner authentication remain HOLD.';}});
  get('dd593Save').addEventListener('click',()=>{
    if(!get('dd593Ack').checked){status.textContent='Confirm this remains an unverified request.';return;}
    try{
      const packet=refresh(),item=packet.cases[Number(get('dd593Case').value)];
      if(!item||item.superseded_source)throw Error('Missing current provider response source.');
      const draft=authenticityCandidate593({response_pin:item.response_pin,
        next_action:get('dd593Action').value,
        owner_decision_outcome:get('dd593Decision').value,
        external_case_ref:get('dd593External').value,
        primary_receipt_ref:get('dd593Receipt').value,
        provider_response_ref:get('dd593Response').value,
        provider_origin_ref:get('dd593Origin').value,
        independent_reviewer_ref:get('dd593Reviewer').value,
        independent_witness_ref:get('dd593Witness').value,
        owner_decision_ref:get('dd593Owner').value,
        owner_signer_ref:get('dd593Signer').value,
        provider_account_id:get('dd593Account').value,
        product_ref:get('dd593Product').value,
        action_scope:get('dd593Scope').value,
        reason:get('dd593Reason').value,
        recorded_at:new Date().toISOString(),
        next_review_at:new Date(get('dd593Due').value).toISOString()});
      if(ownerAction(draft.next_action)!==
        (item.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'))throw Error('Wrong follow-up type.');
      const next=[...saved(),draft],checked=authenticityMatrix593(...context(),next);
      if(!checked.cases.some(c=>c.response_pin===draft.response_pin&&
        c.authenticity_reviews.some(x=>x.recorded_at===draft.recorded_at)))throw Error('Stale case.');
      win.localStorage.setItem(KEY_593,JSON.stringify(next));
      get('dd593Ack').checked=false;refresh();
    }catch{status.textContent='Invalid, stale, wrong-scope or unverified source. No approval, provider write or closure.';}
  });
  get('dd593Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);
      status.textContent='Open authenticity exception/owner decision packet copied; trial HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild source-pinned authenticity review before copying.';}});
}
if(typeof document!=='undefined')init593();
