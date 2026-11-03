/* Build 594: source-verified *references*, not authenticated provider records or owner consent.
 * Local review-only worksheet; fail closed on every real provider action. */
import {authenticityMatrix593,KEY_593} from './admin-channel-authenticity-matrix-593.mjs?v=594';
import {KEY_592} from './admin-channel-receipt-reconciliation-592.mjs?v=594';
import {KEY_591} from './admin-channel-escalation-591.mjs?v=594';
import {KEY_590} from './admin-channel-witness-continuity-590.mjs?v=594';
import {KEY_589} from './admin-channel-custody-589.mjs?v=594';
import {KEY_588} from './admin-channel-disposition-588.mjs?v=594';
import {KEY_587} from './admin-channel-provenance-triage-587.mjs?v=594';
import {KEY_586} from './admin-channel-aging-586.mjs?v=594';
import {KEY_585} from './admin-channel-receipt-followup-585.mjs?v=594';
import {KEY_584} from './admin-channel-witness-584.mjs?v=594';
import {KEY_583} from './admin-channel-intake-583.mjs?v=594';
import {KEY_582} from './admin-channel-handoff-582.mjs?v=594';
import {KEY_581} from './admin-channel-trial-gate-581.mjs?v=594';
import {KEY_580} from './admin-channel-owner-review-580.mjs?v=594';
import {trialPacket578,KEY_578} from './admin-channel-trials-578.mjs?v=594';

export const FORMAT_594='devilndove-source-verified-provider-intake-owner-aging-594-v1';
export const KEY_594='dd:source-verified-provider-intake-owner-aging:594:v1';
export const ACTIONS_594=['REQUEST_ORIGINAL_PROVIDER_SOURCE','RECHECK_PROVIDER_ISSUER_AND_CUSTODY',
  'ESCALATE_INDEPENDENT_REVIEW_CONFLICT','REQUEST_EXACT_OWNER_DECISION',
  'ESCALATE_OVERDUE_OWNER_DECISION','RECHECK_OWNER_ACCOUNT_PRODUCT_ACTION'];
const isOwnerAction=v=>ACTIONS_594.slice(3).includes(v);
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function agingBucket594(due,asOf){
  if(!validDate(due)||!validDate(asOf))return {bucket:'UNKNOWN_DUE_DATE',overdue_days:0};
  const delta=Date.parse(asOf)-Date.parse(due);
  if(delta>7*86400000)return {bucket:'OVERDUE_SEVERE',overdue_days:Math.ceil(delta/86400000)};
  if(delta>0)return {bucket:'OVERDUE',overdue_days:Math.ceil(delta/86400000)};
  if(delta>=-2*86400000)return {bucket:'DUE_SOON',overdue_days:0};
  return {bucket:'NOT_DUE',overdue_days:0};
}
export function intakeCandidate594(row){
  if(!row||!safe(row.response_pin,48000)||row.response_pin.length<40||
    !ACTIONS_594.includes(row.next_action)||!safe(row.source_response_ref,350)||
    !safe(row.original_provider_record_ref,350)||!safe(row.provider_issuer_ref,200)||
    !safe(row.custody_chain_ref,350)||!safe(row.independent_reviewer_ref,200)||
    !safe(row.independent_witness_ref,200)||!safe(row.owner_decision_ref,350)||
    !safe(row.owner_signer_ref,200)||!safe(row.account_id,150)||
    !safe(row.product_ref,100)||!safe(row.action_scope,100)||
    !safe(row.reason,900)||row.reason.trim().length<15||
    !validDate(row.recorded_at)||!validDate(row.next_review_at)||
    Date.parse(row.next_review_at)<Date.parse(row.recorded_at)||
    row.provider_authenticated===true||row.owner_trial_authorized===true||
    row.exception_closed===true||row.provider_write_authorized===true)
    throw Error('Invalid source-verified intake or owner decision aging candidate.');
  return {response_pin:row.response_pin,next_action:row.next_action,
    source_response_ref:row.source_response_ref.trim(),
    original_provider_record_ref:row.original_provider_record_ref.trim(),
    provider_issuer_ref:row.provider_issuer_ref.trim(),
    custody_chain_ref:row.custody_chain_ref.trim(),
    independent_reviewer_ref:row.independent_reviewer_ref.trim(),
    independent_witness_ref:row.independent_witness_ref.trim(),
    owner_decision_ref:row.owner_decision_ref.trim(),owner_signer_ref:row.owner_signer_ref.trim(),
    account_id:row.account_id.trim(),product_ref:row.product_ref.trim(),
    action_scope:row.action_scope.trim(),reason:row.reason.trim(),
    recorded_at:row.recorded_at,next_review_at:row.next_review_at,
    source_reference_checked_only:true,provider_authenticated:false,
    owner_trial_authorized:false,exception_closed:false,provider_write_authorized:false};
}
export function intakeAging594(exact593,sourceArgs,requests=[],asOf=new Date().toISOString()){
  if(!exact593||!Array.isArray(sourceArgs)||sourceArgs.length!==3||
    !Array.isArray(requests)||requests.length>100||!validDate(asOf))
    throw Error('Missing exact Build 593 source and owner decision readiness chain.');
  const original=authenticityMatrix593(...sourceArgs,exact593.as_of);
  if(JSON.stringify(original)!==JSON.stringify(exact593))
    throw Error('Changed, forged or stale exact Build 593 source packet.');
  const current=authenticityMatrix593(...sourceArgs,asOf);
  const candidates=requests.map(intakeCandidate594);
  const pins=new Set(current.cases.map(x=>x.response_pin));
  const cases=current.cases.map(c=>{
    const owner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const reviews=candidates.filter(x=>x.response_pin===c.response_pin).map(r=>{
      if(isOwnerAction(r.next_action)!==owner)
        throw Error('Provider authenticity and exact owner decision cases cannot be swapped.');
      const previous=c.latest_review;
      const conflicts=[
        !previous?'PRECEDING_AUTHENTICITY_REVIEW_MISSING':null,
        r.source_response_ref&&r.source_response_ref!==c.source_response_ref?
          'ORIGINAL_PROVIDER_RESPONSE_CHANGED':null,
        previous&&r.independent_reviewer_ref&&r.independent_reviewer_ref!==previous.independent_reviewer_ref?
          'INDEPENDENT_REVIEWER_CONFLICT':null,
        previous&&r.independent_witness_ref&&r.independent_witness_ref!==previous.independent_witness_ref?
          'INDEPENDENT_WITNESS_CONFLICT':null,
        r.provider_issuer_ref&&r.provider_issuer_ref===r.independent_reviewer_ref?
          'PROVIDER_ISSUER_IS_OWN_REVIEWER':null,
        r.independent_reviewer_ref&&r.independent_reviewer_ref===r.independent_witness_ref?
          'REVIEWER_WITNESS_NOT_INDEPENDENT':null,
        r.account_id&&r.account_id!==c.account_id?'ACCOUNT_SCOPE_CONFLICT':null,
        r.product_ref&&r.product_ref!==c.product_ref?'PRODUCT_SCOPE_CONFLICT':null,
        r.action_scope&&r.action_scope!==c.action?'EXACT_ACTION_SCOPE_CONFLICT':null
      ].filter(Boolean);
      const gaps=[
        ...c.source_exceptions,...(previous?.authenticity_exceptions||[]),
        !r.source_response_ref?'ORIGINAL_PROVIDER_RESPONSE_MISSING':null,
        !r.original_provider_record_ref?'ORIGINAL_PROVIDER_SOURCE_LOCATOR_MISSING':null,
        !r.provider_issuer_ref?'PROVIDER_ISSUER_SOURCE_MISSING':null,
        !r.custody_chain_ref?'PRIMARY_CUSTODY_CHAIN_MISSING':null,
        !r.independent_reviewer_ref?'SEPARATE_REVIEWER_MISSING':null,
        !r.independent_witness_ref?'SEPARATE_WITNESS_MISSING':null,
        owner&&!r.owner_decision_ref?'EXACT_OWNER_DECISION_SOURCE_MISSING':null,
        owner&&!r.owner_signer_ref?'EXACT_OWNER_SIGNER_MISSING':null,
        owner&&(!r.account_id||!r.product_ref||!r.action_scope)?
          'OWNER_SCOPE_INCOMPLETE':null,
        c.superseded_source?'SUPERSEDED_RESPONSE_NOT_CURRENT':null
      ].filter(Boolean);
      const exceptions=[...new Set([...conflicts,...gaps])];
      return {...r,source_conflicts:conflicts,unresolved_evidence_gaps:exceptions,
        documentary_intake_ready:exceptions.length===0,
        ...agingBucket594(r.next_review_at,asOf),
        externally_verified:false,independently_authenticated:false,
        owner_signed_decision_verified:false,trial_eligible:false,exception_closed:false};
    });
    const latest=reviews.at(-1)||null;
    const due=latest?.next_review_at||c.latest_review?.next_review_at||null;
    const aging=agingBucket594(due,asOf);
    return {response_pin:c.response_pin,channel:c.channel,account_id:c.account_id,
      product_ref:c.product_ref,action:c.action,followup_type:c.followup_type,
      source_response_ref:c.source_response_ref,source_exceptions:c.source_exceptions,
      superseded_source:c.superseded_source,prior_authenticity_review:c.latest_review,
      intake_reviews:reviews,latest_intake:latest,review_due_at:due,
      ...aging,owner_trial_decision_pending:owner,provider_authenticated:false,
      owner_decision_verified:false,trial_eligible:false,exception_closed:false};
  });
  const ownerCases=cases.filter(x=>x.owner_trial_decision_pending);
  return {format:FORMAT_594,build:594,source_build:593,
    source_pin:current.source_pin,as_of:asOf,cases,
    open_intake_cases:cases.length,missing_intake_reviews:cases.filter(x=>!x.intake_reviews.length).length,
    stale_intake_candidates:candidates.filter(x=>!pins.has(x.response_pin)),
    source_reference_conflicts:cases.reduce((n,c)=>n+c.intake_reviews.reduce((m,r)=>m+r.source_conflicts.length,0),0),
    unresolved_provenance_gaps:cases.reduce((n,c)=>n+c.intake_reviews.reduce((m,r)=>m+r.unresolved_evidence_gaps.length,0),0),
    pending_owner_trial_decisions:ownerCases.length,
    overdue_owner_trial_decisions:ownerCases.filter(x=>x.bucket.startsWith('OVERDUE')).length,
    severe_owner_trial_decisions:ownerCases.filter(x=>x.bucket==='OVERDUE_SEVERE').length,
    unknown_owner_due_dates:ownerCases.filter(x=>x.bucket==='UNKNOWN_DUE_DATE').length,
    externally_verified_provider_responses:0,independently_authenticated_responses:0,
    verified_owner_trial_decisions:0,approved_trials:0,closed_exceptions:0,
    provider_writes:0,d1_operations:0,
    disposition:'HOLD_ORIGINAL_PROVIDER_AUTHENTICITY_AND_OWNER_EXACT_TRIAL_DECISION_UNVERIFIED'};
}

function init594(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd594Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd594State'),output=get('dd594Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_594,[]);
  const context=()=>{
    const ids=['dd593Output','dd592Output','dd591Output','dd590Output','dd589Output',
      'dd588Output','dd587Output','dd586Output','dd585Output','dd584Output',
      'dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id)?.value;if(!raw||raw.length>500000)
      throw Error('Recompute exact source sections 5–18.');return JSON.parse(raw);});
    const witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...parsed.slice(5),
      read(KEY_578,trialPacket578([])),read(KEY_580,[]),read(KEY_581,[]),
      read(KEY_582,[]),read(KEY_583,[]),witness.witness,witness.owner,
      read(KEY_585,[]),read(KEY_586,[]),read(KEY_587,[]),
      read(KEY_588,[]),read(KEY_589,[])];
    const escalationArgs=[parsed[3],[parsed[4],custodyArgs,read(KEY_590,[])],read(KEY_591,[])];
    const receiptArgs=[parsed[2],escalationArgs,read(KEY_592,[])];
    return [parsed[0],[parsed[1],receiptArgs,read(KEY_593,[])]];
  };
  const refresh=()=>{
    const packet=intakeAging594(...context(),saved());
    output.value=JSON.stringify(packet,null,2);
    const select=get('dd594Case'),before=select.value;select.replaceChildren();
    packet.cases.forEach((c,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=c.channel+' · '+c.product_ref+' · '+c.bucket;
      select.append(option);});
    if([...select.options].some(x=>x.value===before))select.value=before;
    status.textContent=packet.open_intake_cases+' source-review cases · '+
      packet.unresolved_provenance_gaps+' provenance gaps · '+
      packet.overdue_owner_trial_decisions+' overdue owner scope decisions · trial HOLD.';
    return packet;
  };
  get('dd594Review').addEventListener('click',()=>{try{refresh();}catch{
    status.textContent='Recompute exact source sections 5–18. Provider authenticity and owner permission HOLD.';}});
  get('dd594Save').addEventListener('click',()=>{
    if(!get('dd594Ack').checked){status.textContent='Acknowledge that this is not authenticated evidence.';return;}
    try{
      const packet=refresh(),item=packet.cases[Number(get('dd594Case').value)];
      if(!item||item.superseded_source)throw Error('Missing current pinned case.');
      const draft=intakeCandidate594({response_pin:item.response_pin,
        next_action:get('dd594Action').value,
        source_response_ref:get('dd594Response').value,
        original_provider_record_ref:get('dd594Original').value,
        provider_issuer_ref:get('dd594Issuer').value,
        custody_chain_ref:get('dd594Custody').value,
        independent_reviewer_ref:get('dd594Reviewer').value,
        independent_witness_ref:get('dd594Witness').value,
        owner_decision_ref:get('dd594Owner').value,
        owner_signer_ref:get('dd594Signer').value,
        account_id:get('dd594Account').value,product_ref:get('dd594Product').value,
        action_scope:get('dd594Scope').value,reason:get('dd594Reason').value,
        recorded_at:new Date().toISOString(),
        next_review_at:new Date(get('dd594Due').value).toISOString()});
      const next=[...saved(),draft],checked=intakeAging594(...context(),next);
      if(!checked.cases.some(c=>c.response_pin===draft.response_pin&&
        c.intake_reviews.some(r=>r.recorded_at===draft.recorded_at)))throw Error('Stale source.');
      win.localStorage.setItem(KEY_594,JSON.stringify(next));
      get('dd594Ack').checked=false;refresh();
    }catch{status.textContent='Invalid or stale original provider source/owner scope. No approval or closure.';}
  });
  get('dd594Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);
      status.textContent='Unverified source and overdue owner decision packet copied · trial HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy packet manually.';}}
  catch{status.textContent='Recompute exact sources before copying.';}});
}
if(typeof document!=='undefined')init594();
