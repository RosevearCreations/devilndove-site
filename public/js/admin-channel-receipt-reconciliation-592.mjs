/* Build 592: external witness receipt and exact owner decision evidence reconciliation.
 * Browser-local candidate references are not authenticated provider receipts or signed consent. */
import {escalation591,KEY_591} from './admin-channel-escalation-591.mjs?v=592';
import {KEY_590} from './admin-channel-witness-continuity-590.mjs?v=592';
import {KEY_589} from './admin-channel-custody-589.mjs?v=592';
import {KEY_588} from './admin-channel-disposition-588.mjs?v=592';
import {KEY_587} from './admin-channel-provenance-triage-587.mjs?v=592';
import {KEY_586} from './admin-channel-aging-586.mjs?v=592';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=592';
import {KEY_584} from './admin-channel-witness-584.mjs?v=592';
import {KEY_583} from './admin-channel-intake-583.mjs?v=592';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=592';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=592';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=592';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=592';

export const FORMAT_592='devilndove-external-witness-owner-decision-reconciliation-592-v1';
export const KEY_592='dd:external-witness-owner-decision-reconciliation:592:v1';
export const ACTIONS_592=[
  'REQUEST_ORIGINAL_PROVIDER_RECEIPT_READBACK','RECHECK_INDEPENDENT_WITNESS_ATTESTATION_CHAIN',
  'ESCALATE_EXTERNAL_RECEIPT_CORRELATION_CONFLICT',
  'RECONCILE_EXACT_OWNER_DECISION_LOCATOR','REQUEST_SEPARATE_OWNER_APPROVAL_OR_DECLINE',
  'ESCALATE_OWNER_DECISION_SCOPE_EXCEPTION'];
const isOwnerAction=x=>ACTIONS_592.slice(3).includes(x);
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));

export function escalationPin592(c,followup){
  if(!c?.witness_pin||!followup?.recorded_at)throw Error('Missing exact Build 591 escalation.');
  return JSON.stringify([c.witness_pin,followup.recorded_at,followup.next_action,
    followup.independent_case_ref,followup.escalation_owner_ref,followup.primary_receipt_ref,
    followup.owner_handoff_ref,followup.provider_account_id,followup.product_ref,
    followup.action_scope,followup.next_review_at]);
}
export function receiptCandidate592(row){
  if(!row||!safe(row.escalation_pin,38000)||row.escalation_pin.length<40||
    !ACTIONS_592.includes(row.next_action)||!safe(row.external_case_ref,350)||
    !safe(row.original_provider_receipt_ref,350)||!safe(row.external_response_ref,350)||
    !safe(row.independent_reviewer_ref,200)||!safe(row.independent_witness_ref,200)||
    !safe(row.owner_decision_ref,350)||!safe(row.owner_signer_ref,200)||
    !safe(row.provider_account_id,150)||!safe(row.product_ref,100)||
    !safe(row.action_scope,100)||!safe(row.reason,900)||row.reason.trim().length<15||
    !validDate(row.recorded_at)||!validDate(row.next_review_at)||
    Date.parse(row.next_review_at)<Date.parse(row.recorded_at)||
    row.provider_authenticated===true||row.owner_trial_authorized===true||
    row.exception_closed===true||row.provider_write_authorized===true)
    throw Error('Invalid external receipt or exact owner decision candidate.');
  return {escalation_pin:row.escalation_pin,next_action:row.next_action,
    external_case_ref:row.external_case_ref.trim(),
    original_provider_receipt_ref:row.original_provider_receipt_ref.trim(),
    external_response_ref:row.external_response_ref.trim(),
    independent_reviewer_ref:row.independent_reviewer_ref.trim(),
    independent_witness_ref:row.independent_witness_ref.trim(),
    owner_decision_ref:row.owner_decision_ref.trim(),owner_signer_ref:row.owner_signer_ref.trim(),
    provider_account_id:row.provider_account_id.trim(),product_ref:row.product_ref.trim(),
    action_scope:row.action_scope.trim(),reason:row.reason.trim(),
    recorded_at:row.recorded_at,next_review_at:row.next_review_at,
    receipt_authentication:'NOT_PERFORMED',owner_decision_authentication:'NOT_PERFORMED',
    external_request_sent:false,owner_trial_authorized:false,exception_closed:false};
}
export function receiptReconciliation592(exactEscalation,sourceArgs,requests=[],asOf=new Date().toISOString()){
  if(!exactEscalation||!Array.isArray(sourceArgs)||sourceArgs.length!==3||
    !Array.isArray(requests)||requests.length>100||!validDate(asOf))
    throw Error('Invalid exact Build 591 receipt reconciliation source.');
  const original=escalation591(...sourceArgs,exactEscalation.as_of);
  if(JSON.stringify(original)!==JSON.stringify(exactEscalation))
    throw Error('Altered or stale Build 591 escalation evidence.');
  const current=escalation591(...sourceArgs,asOf),rows=requests.map(receiptCandidate592);
  const entries=current.cases.flatMap(c=>c.escalation_followups.map((r,i)=>({case:c,followup:r,
    escalation_pin:escalationPin592(c,r),superseded:i<c.escalation_followups.length-1})));
  const active=new Set(entries.map(e=>e.escalation_pin));
  const stale=rows.filter(r=>!active.has(r.escalation_pin));
  const cases=entries.map(({case:c,followup:r,escalation_pin,superseded})=>{
    const owner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const reconciliations=rows.filter(x=>x.escalation_pin===escalation_pin).map(x=>{
      if(isOwnerAction(x.next_action)!==owner)
        throw Error('Provider/owner follow-up type differs from exact escalation source.');
      const conflicts=[
        x.external_case_ref&&x.external_case_ref!==r.independent_case_ref?
          'EXTERNAL_CASE_REFERENCE_DIFFERS_FROM_ESCALATION':null,
        x.original_provider_receipt_ref&&x.original_provider_receipt_ref!==r.primary_receipt_ref?
          'PRIMARY_PROVIDER_RECEIPT_DIFFERS_FROM_ESCALATION':null,
        x.independent_reviewer_ref&&x.independent_reviewer_ref!==r.escalation_owner_ref?
          'ASSIGNED_INDEPENDENT_REVIEWER_DIFFERS_FROM_ESCALATION':null,
        x.provider_account_id&&x.provider_account_id!==c.account_id?'EXACT_ACCOUNT_CONFLICT':null,
        x.product_ref&&x.product_ref!==c.product_ref?'EXACT_PRODUCT_CONFLICT':null,
        x.action_scope&&x.action_scope!==c.action?'EXACT_ACTION_CONFLICT':null,
        x.independent_reviewer_ref&&x.independent_reviewer_ref===x.independent_witness_ref?
          'WITNESS_REVIEWER_INDEPENDENCE_CONFLICT':null
      ].filter(Boolean);
      const gaps=[...r.scope_conflicts,...r.missing_external_evidence,...r.source_witness_gaps,
        !x.external_case_ref?'ORIGINAL_EXTERNAL_CASE_REFERENCE_MISSING':null,
        !x.original_provider_receipt_ref?'ORIGINAL_PROVIDER_RECEIPT_REFERENCE_MISSING':null,
        !x.external_response_ref?'SOURCE_EXTERNAL_RESPONSE_REFERENCE_MISSING':null,
        !x.independent_reviewer_ref?'INDEPENDENT_REVIEWER_REFERENCE_MISSING':null,
        !x.independent_witness_ref?'INDEPENDENT_WITNESS_REFERENCE_MISSING':null,
        owner&&!x.owner_decision_ref?'EXACT_OWNER_DECISION_REFERENCE_MISSING':null,
        owner&&!x.owner_signer_ref?'SEPARATE_OWNER_SIGNER_REFERENCE_MISSING':null,
        owner&&(!x.provider_account_id||!x.product_ref||!x.action_scope)?
          'EXACT_OWNER_DECISION_SCOPE_INCOMPLETE':null,
        superseded?'SOURCE_ESCALATION_SUPERSEDED':null].filter(Boolean);
      return {...x,source_conflicts:conflicts,unverified_evidence_gaps:[...new Set(gaps)],
        review_overdue:Date.parse(x.next_review_at)<Date.parse(asOf),
        documentary_reconciliation_complete:!conflicts.length&&!gaps.length,
        provider_receipt_authenticated:false,owner_action_decision_verified:false,
        exception_closed:false,trial_eligible:false};
    });
    return {escalation_pin,witness_pin:c.witness_pin,channel:c.channel,
      account_id:c.account_id,product_ref:c.product_ref,action:c.action,
      followup_type:c.followup_type,external_case_ref:r.independent_case_ref,
      primary_receipt_ref:r.primary_receipt_ref,owner_handoff_ref:r.owner_handoff_ref,
      original_witness_gaps:r.source_witness_gaps,
      source_scope_conflicts:r.scope_conflicts,source_missing_evidence:r.missing_external_evidence,
      superseded_source_escalation:superseded,reconciliations,
      latest_reconciliation:reconciliations.at(-1)||null,
      next_external_action:owner?'REQUEST_SEPARATE_OWNER_APPROVAL_OR_DECLINE':
        'REQUEST_ORIGINAL_PROVIDER_RECEIPT_READBACK',
      provider_receipt_authenticated:false,owner_action_approved:false,
      exception_closed:false,trial_eligible:false};
  });
  const repeated=new Map();for(const r of rows){if(r.external_response_ref)
    repeated.set(r.external_response_ref,(repeated.get(r.external_response_ref)||0)+1);}
  return {format:FORMAT_592,build:592,source_build:591,source_pin:current.source_pin,
    as_of:asOf,open_reconciliation_cases:cases.length,cases,
    source_cases_without_escalation:current.cases.filter(x=>!x.escalation_followups.length).length,
    stale_external_receipt_followups:stale,
    missing_receipt_reconciliations:cases.filter(x=>!x.reconciliations.length).length,
    source_conflicts:cases.reduce((n,c)=>n+c.reconciliations.reduce((m,r)=>m+r.source_conflicts.length,0),0),
    unverified_evidence_gaps:cases.reduce((n,c)=>n+c.reconciliations.reduce((m,r)=>m+r.unverified_evidence_gaps.length,0),0),
    overdue_rechecks:cases.reduce((n,c)=>n+c.reconciliations.filter(x=>x.review_overdue).length,0),
    repeated_external_response_refs:[...repeated].filter(([,count])=>count>1).map(([ref])=>ref),
    owner_decision_followups:cases.filter(c=>c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'&&
      c.reconciliations.length).length,
    authenticated_external_receipts:0,verified_owner_decisions:0,
    closed_exceptions:0,trial_eligible_cases:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_EXTERNAL_RECEIPT_AND_EXACT_OWNER_ACTION_DECISION_NOT_AUTHENTICATED'};
}
function init592(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd592Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd592State'),output=get('dd592Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_592,[]);
  const context=()=>{
    const ids=['dd591Output','dd590Output','dd589Output','dd588Output','dd587Output',
      'dd586Output','dd585Output','dd584Output','dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id)?.value;if(!raw||raw.length>500000)
      throw Error('Refresh exact sections 5–16.');return JSON.parse(raw);});
    const witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...parsed.slice(3),read(KEY_578,trialPacket578([])),read(KEY_580,[]),
      read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),witness.witness,witness.owner,
      read(KEY_585,[]),read(KEY_586,[]),read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    return [parsed[0],[parsed[1],[parsed[2],custodyArgs,read(KEY_590,[])],read(KEY_591,[])]];
  };
  const refresh=()=>{
    const packet=receiptReconciliation592(...context(),saved());
    output.value=JSON.stringify(packet,null,2);
    const select=get('dd592Case'),before=select.value;select.replaceChildren();
    packet.cases.forEach((c,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=`${c.channel} · ${c.product_ref} · ${c.followup_type}${c.superseded_source_escalation?' · superseded':''}`;
      select.append(option);});
    if([...select.options].some(x=>x.value===before))select.value=before;
    status.textContent=`${packet.open_reconciliation_cases} source-pinned receipt/owner recheck(s) · ${packet.missing_receipt_reconciliations} without follow-ups · ${packet.source_conflicts} scope/source conflicts · ${packet.overdue_rechecks} overdue · trial HOLD.`;
    return packet;
  };
  get('dd592Review').addEventListener('click',()=>{try{refresh();}catch{
    status.textContent='Refresh sections 5–16 first. External receipt and owner decision remain unverified; HOLD.';}});
  get('dd592Save').addEventListener('click',()=>{
    if(!get('dd592Ack').checked){status.textContent='Acknowledge this is only a pending external evidence recheck.';return;}
    try{const packet=refresh(),item=packet.cases[Number(get('dd592Case').value)];
      if(!item||item.superseded_source_escalation)throw Error('Missing current escalation.');
      const draft=receiptCandidate592({escalation_pin:item.escalation_pin,
        next_action:get('dd592Action').value,external_case_ref:get('dd592External').value,
        original_provider_receipt_ref:get('dd592Receipt').value,
        external_response_ref:get('dd592Response').value,
        independent_reviewer_ref:get('dd592Reviewer').value,
        independent_witness_ref:get('dd592Witness').value,
        owner_decision_ref:get('dd592Owner').value,owner_signer_ref:get('dd592Signer').value,
        provider_account_id:get('dd592Account').value,product_ref:get('dd592Product').value,
        action_scope:get('dd592Scope').value,reason:get('dd592Reason').value,
        recorded_at:new Date().toISOString(),next_review_at:new Date(get('dd592Due').value).toISOString()});
      if(isOwnerAction(draft.next_action)!==
        (item.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'))throw Error('Wrong case type.');
      const next=[...saved(),draft],checked=receiptReconciliation592(...context(),next);
      if(!checked.cases.some(c=>c.escalation_pin===draft.escalation_pin&&
        c.reconciliations.some(r=>r.recorded_at===draft.recorded_at)))throw Error('Stale exact source.');
      win.localStorage.setItem(KEY_592,JSON.stringify(next));get('dd592Ack').checked=false;refresh();
    }catch{status.textContent='Invalid or stale evidence, owner scope conflict, or wrong case type. No approval or closure.';}
  });
  get('dd592Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);
      status.textContent='Unverified external receipt/owner decision follow-up copied. Trial HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy the packet manually.';}}
  catch{status.textContent='Rebuild exact source reconciliation packet before copying.';}});
}
if(typeof document!=='undefined')init592();
