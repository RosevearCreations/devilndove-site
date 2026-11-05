/* Build 595: local document-byte integrity and independent custody cross-check.
 * A matching SHA-256 is NOT provider authentication or owner trial authorization. */
import {intakeAging594,agingBucket594,KEY_594} from './admin-channel-intake-aging-594.mjs?v=594';
import {KEY_593} from './admin-channel-authenticity-matrix-593.mjs?v=594';
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

export const FORMAT_595='devilndove-independent-original-source-custody-owner-review-595-v1';
export const KEY_595='dd:independent-original-source-custody-owner-review:595:v1';
export const ACTIONS_595=[
  'REQUEST_PROVIDER_ORIGINAL_AND_ISSUER_PROOF','RECONCILE_ORIGINAL_RECEIPT_AND_CUSTODY',
  'ESCALATE_PROVIDER_DOCUMENT_DIGEST_CONFLICT',
  'REQUEST_SEPARATELY_SIGNED_OWNER_TRIAL_SCOPE','ESCALATE_OWNER_SIGNER_OR_SCOPE_CONFLICT',
  'ESCALATE_OVERDUE_OWNER_AUTHORIZATION'];
export const OUTCOMES_595=['UNDECIDED','DECISION_REQUESTED','DEFER_REQUESTED','DECLINE_REQUESTED'];
const isOwnerAction=x=>ACTIONS_595.slice(3).includes(x);
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&
  Number.isFinite(Date.parse(x));
const digest=x=>typeof x==='string'&&(!x||/^[a-f\d]{64}$/i.test(x));
const same=(a,b)=>a&&b&&a===b;

export async function fileSha256595(file){
  if(!file||!Number.isFinite(file.size)||file.size<1||file.size>25*1024*1024||
    typeof file.arrayBuffer!=='function'||!globalThis.crypto?.subtle)
    throw Error('Select a nonempty local document up to 25 MB in a secure browser.');
  const bytes=await file.arrayBuffer();
  const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function sourcePin595(c){
  if(!c?.response_pin||!c?.latest_intake?.recorded_at)
    throw Error('Missing exact current Build 594 original-source review.');
  const r=c.latest_intake;
  return JSON.stringify([c.response_pin,r.recorded_at,r.next_action,r.source_response_ref,
    r.original_provider_record_ref,r.provider_issuer_ref,r.custody_chain_ref,
    r.independent_reviewer_ref,r.independent_witness_ref,r.owner_decision_ref,
    r.owner_signer_ref,r.account_id,r.product_ref,r.action_scope,r.next_review_at]);
}
export function sourceCandidate595(r){
  if(!r||!safe(r.intake_pin,48000)||r.intake_pin.length<40||
    !ACTIONS_595.includes(r.next_action)||!OUTCOMES_595.includes(r.owner_outcome)||
    !safe(r.original_response_ref,350)||!safe(r.original_provider_ref,350)||
    !safe(r.provider_issuer_ref,200)||!safe(r.original_receipt_ref,350)||
    !safe(r.custody_receipt_ref,350)||!safe(r.custodian_ref,200)||
    !safe(r.independent_reviewer_ref,200)||!safe(r.independent_witness_ref,200)||
    !safe(r.owner_decision_ref,350)||!safe(r.owner_signer_ref,200)||
    !safe(r.account_id,150)||!safe(r.product_ref,100)||!safe(r.action_scope,100)||
    !safe(r.reason,900)||r.reason.trim().length<15||
    !digest(r.issuer_expected_sha256)||!digest(r.original_file_sha256)||
    !digest(r.custody_logged_sha256)||!digest(r.custody_file_sha256)||
    !iso(r.recorded_at)||!iso(r.next_review_at)||
    (r.receipt_at&&!iso(r.receipt_at))||(r.custody_at&&!iso(r.custody_at))||
    Date.parse(r.next_review_at)<Date.parse(r.recorded_at)||
    r.provider_authenticated===true||r.owner_trial_authorized===true||
    r.exception_closed===true||r.provider_write_authorized===true||r.approved===true)
    throw Error('Invalid or unsafe independent document/custody review candidate.');
  const trim=x=>x.trim();
  return {intake_pin:r.intake_pin,next_action:r.next_action,owner_outcome:r.owner_outcome,
    original_response_ref:trim(r.original_response_ref),
    original_provider_ref:trim(r.original_provider_ref),
    provider_issuer_ref:trim(r.provider_issuer_ref),
    original_receipt_ref:trim(r.original_receipt_ref),
    custody_receipt_ref:trim(r.custody_receipt_ref),custodian_ref:trim(r.custodian_ref),
    independent_reviewer_ref:trim(r.independent_reviewer_ref),
    independent_witness_ref:trim(r.independent_witness_ref),
    issuer_expected_sha256:r.issuer_expected_sha256.toLowerCase(),
    original_file_sha256:r.original_file_sha256.toLowerCase(),
    custody_logged_sha256:r.custody_logged_sha256.toLowerCase(),
    custody_file_sha256:r.custody_file_sha256.toLowerCase(),
    receipt_at:r.receipt_at||'',custody_at:r.custody_at||'',
    owner_decision_ref:trim(r.owner_decision_ref),owner_signer_ref:trim(r.owner_signer_ref),
    account_id:trim(r.account_id),product_ref:trim(r.product_ref),
    action_scope:trim(r.action_scope),reason:trim(r.reason),
    recorded_at:r.recorded_at,next_review_at:r.next_review_at,
    local_file_digest_only:true,external_authentication_performed:false,
    owner_trial_authorized:false,exception_closed:false,provider_write_authorized:false};
}

export function sourceVerification595(exact594,sourceArgs,requests=[],asOf=new Date().toISOString()){
  if(!exact594||!Array.isArray(sourceArgs)||sourceArgs.length!==3||
    !Array.isArray(requests)||requests.length>100||!iso(asOf))
    throw Error('Missing exact Build 594 source/custody packet.');
  const reproduced=intakeAging594(...sourceArgs,exact594.as_of);
  if(JSON.stringify(reproduced)!==JSON.stringify(exact594))
    throw Error('Changed, forged or stale Build 594 source packet.');
  // Build 611: reuse this invocation's already verified identical-time source.
  const current=asOf===exact594.as_of?reproduced:intakeAging594(...sourceArgs,asOf);
  const candidates=requests.map(sourceCandidate595);
  const cases=current.cases.map(c=>{
    const intakePin=c.latest_intake?sourcePin595(c):null;
    const owner=c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION';
    const reviews=candidates.filter(r=>r.intake_pin===intakePin).map(r=>{
      if(isOwnerAction(r.next_action)!==owner||(!owner&&r.owner_outcome!=='UNDECIDED'))
        throw Error('Original provider verification and owner-scope cases cannot be swapped.');
      const prior=c.latest_intake;
      const conflicts=[
        r.original_response_ref&&r.original_response_ref!==c.source_response_ref?'RESPONSE_CORRELATION_CONFLICT':null,
        r.original_provider_ref&&r.original_provider_ref!==prior.original_provider_record_ref?'ORIGINAL_SOURCE_LOCATOR_CONFLICT':null,
        r.provider_issuer_ref&&r.provider_issuer_ref!==prior.provider_issuer_ref?'PROVIDER_ISSUER_CONFLICT':null,
        r.custody_receipt_ref&&r.custody_receipt_ref!==prior.custody_chain_ref?'CUSTODY_RECEIPT_CONFLICT':null,
        r.original_receipt_ref&&c.prior_authenticity_review?.primary_receipt_ref&&
          r.original_receipt_ref!==c.prior_authenticity_review.primary_receipt_ref?'ORIGINAL_RECEIPT_CONFLICT':null,
        r.independent_reviewer_ref&&r.independent_reviewer_ref!==prior.independent_reviewer_ref?'INDEPENDENT_REVIEWER_CONFLICT':null,
        r.independent_witness_ref&&r.independent_witness_ref!==prior.independent_witness_ref?'INDEPENDENT_WITNESS_CONFLICT':null,
        same(r.provider_issuer_ref,r.independent_reviewer_ref)?'ISSUER_IS_REVIEWER':null,
        same(r.custodian_ref,r.independent_reviewer_ref)?'CUSTODIAN_IS_REVIEWER':null,
        same(r.custodian_ref,r.independent_witness_ref)?'CUSTODIAN_IS_WITNESS':null,
        same(r.independent_reviewer_ref,r.independent_witness_ref)?'REVIEWER_IS_WITNESS':null,
        same(r.owner_signer_ref,r.independent_reviewer_ref)?'OWNER_SIGNER_IS_REVIEWER':null,
        r.issuer_expected_sha256&&r.original_file_sha256&&
          r.issuer_expected_sha256!==r.original_file_sha256?'ORIGINAL_BYTES_DIGEST_MISMATCH':null,
        r.custody_logged_sha256&&r.custody_file_sha256&&
          r.custody_logged_sha256!==r.custody_file_sha256?'CUSTODY_BYTES_DIGEST_MISMATCH':null,
        r.receipt_at&&r.custody_at&&Date.parse(r.receipt_at)>Date.parse(r.custody_at)?'CUSTODY_BEFORE_ORIGINAL_RECEIPT':null,
        r.custody_at&&Date.parse(r.custody_at)>Date.parse(r.recorded_at)?'CUSTODY_AFTER_REVIEW':null,
        r.account_id&&r.account_id!==c.account_id?'OWNER_ACCOUNT_CONFLICT':null,
        r.product_ref&&r.product_ref!==c.product_ref?'OWNER_PRODUCT_CONFLICT':null,
        r.action_scope&&r.action_scope!==c.action?'OWNER_EXACT_ACTION_CONFLICT':null,
        owner&&r.owner_decision_ref&&r.owner_decision_ref!==prior.owner_decision_ref?'OWNER_DECISION_DOCUMENT_CONFLICT':null,
        owner&&r.owner_signer_ref&&r.owner_signer_ref!==prior.owner_signer_ref?'OWNER_SIGNER_CONFLICT':null
      ].filter(Boolean);
      const missing=[...(prior.unresolved_evidence_gaps||[]),
        !r.original_response_ref?'ORIGINAL_RESPONSE_REFERENCE_MISSING':null,
        !r.original_provider_ref?'ORIGINAL_PROVIDER_DOCUMENT_MISSING':null,
        !r.provider_issuer_ref?'ORIGINAL_ISSUER_ID_MISSING':null,
        !r.original_receipt_ref?'PROVIDER_RECEIPT_MISSING':null,
        !r.custody_receipt_ref?'CUSTODY_RECEIPT_MISSING':null,
        !r.custodian_ref?'CUSTODIAN_ID_MISSING':null,
        !r.independent_reviewer_ref?'REVIEWER_MISSING':null,
        !r.independent_witness_ref?'WITNESS_MISSING':null,
        !r.issuer_expected_sha256||!r.original_file_sha256?'INDEPENDENT_ORIGINAL_DIGEST_PAIR_MISSING':null,
        !r.custody_logged_sha256||!r.custody_file_sha256?'INDEPENDENT_CUSTODY_DIGEST_PAIR_MISSING':null,
        !r.receipt_at||!r.custody_at?'CUSTODY_TIMELINE_INCOMPLETE':null,
        owner&&!r.owner_decision_ref?'SIGNED_OWNER_DOCUMENT_MISSING':null,
        owner&&!r.owner_signer_ref?'OWNER_SIGNER_MISSING':null,
        owner&&(!r.account_id||!r.product_ref||!r.action_scope)?'EXACT_OWNER_SCOPE_INCOMPLETE':null,
        owner&&r.owner_outcome==='UNDECIDED'?'OWNER_DECISION_NOT_RECORDED':null,
        c.superseded_source?'SUPERSEDED_ORIGINAL_RESPONSE':null
      ].filter(Boolean);
      const exceptions=[...new Set([...conflicts,...missing])];
      return {...r,source_conflicts:conflicts,open_exceptions:exceptions,
        local_document_integrity_consistent:!!r.issuer_expected_sha256&&
          r.issuer_expected_sha256===r.original_file_sha256&&!!r.custody_logged_sha256&&
          r.custody_logged_sha256===r.custody_file_sha256,
        documentary_crosscheck_ready:exceptions.length===0,
        ...agingBucket594(r.next_review_at,asOf),
        externally_authenticated:false,owner_signed_authorization_verified:false,
        trial_eligible:false,exception_closed:false};
    });
    const latest=reviews.at(-1)||null;
    const aging=agingBucket594(latest?.next_review_at||c.review_due_at,asOf);
    return {intake_pin:intakePin,response_pin:c.response_pin,channel:c.channel,
      account_id:c.account_id,product_ref:c.product_ref,action:c.action,
      followup_type:c.followup_type,superseded_source:c.superseded_source,
      original_intake:c.latest_intake,review_due_at:latest?.next_review_at||c.review_due_at,
      reviews,latest_verification:latest,...aging,
      owner_trial_decision_pending:owner,provider_authenticated:false,
      owner_trial_authorized:false,exception_closed:false};
  });
  const active=new Set(cases.map(c=>c.intake_pin).filter(Boolean));
  const crossCaseDigests=new Map();
  for(const c of cases)for(const r of c.reviews){
    if(!r.original_file_sha256)continue;
    const pins=crossCaseDigests.get(r.original_file_sha256)||new Set();
    pins.add(c.intake_pin);crossCaseDigests.set(r.original_file_sha256,pins);
  }
  const reused=[...crossCaseDigests].filter(([,pins])=>pins.size>1).map(([hash,pins])=>
    ({sha256:hash,distinct_source_cases:pins.size}));
  const reusedHashes=new Set(reused.map(x=>x.sha256));
  for(const c of cases)for(const r of c.reviews){
    if(!reusedHashes.has(r.original_file_sha256))continue;
    r.source_conflicts.push('ORIGINAL_FILE_DIGEST_REUSED_ACROSS_CASES');
    r.open_exceptions.push('ORIGINAL_FILE_DIGEST_REUSED_ACROSS_CASES');
    r.documentary_crosscheck_ready=false;
  }
  const owner=cases.filter(c=>c.owner_trial_decision_pending);
  return {format:FORMAT_595,build:595,source_build:594,source_pin:current.source_pin,
    as_of:asOf,cases,open_verification_cases:cases.length,
    missing_original_intake:cases.filter(c=>!c.intake_pin).length,
    missing_independent_verification:cases.filter(c=>!c.reviews.length).length,
    stale_verification_candidates:candidates.filter(r=>!active.has(r.intake_pin)),
    source_and_custody_conflicts:cases.reduce((n,c)=>n+c.reviews.reduce((m,r)=>m+r.source_conflicts.length,0),0),
    unresolved_evidence_exceptions:cases.reduce((n,c)=>n+c.reviews.reduce((m,r)=>m+r.open_exceptions.length,0),0),
    cross_case_provider_document_digests:reused,
    local_document_digest_pairs_consistent:cases.reduce((n,c)=>n+c.reviews.filter(r=>r.local_document_integrity_consistent).length,0),
    pending_owner_authorization:owner.length,
    overdue_owner_decisions:owner.filter(c=>c.bucket.startsWith('OVERDUE')).length,
    unknown_owner_due_dates:owner.filter(c=>c.bucket==='UNKNOWN_DUE_DATE').length,
    independently_authenticated_provider_sources:0,verified_owner_authorizations:0,
    approved_trials:0,closed_exceptions:0,provider_reads:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_ORIGINAL_PROVIDER_AUTHENTICATION_AND_EXACT_OWNER_TRIAL_AUTHORIZATION'};
}

function init595(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd595Review'))return;
  const get=id=>doc.getElementById(id),status=get('dd595State'),output=get('dd595Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_595,[]);
  const context=()=>{
    const ids=['dd594Output','dd593Output','dd592Output','dd591Output','dd590Output',
      'dd589Output','dd588Output','dd587Output','dd586Output','dd585Output',
      'dd584Output','dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id)?.value;if(!raw||raw.length>500000)
      throw Error('Recompute exact source sections 5–19.');return JSON.parse(raw);});
    const prior=parsed.slice(1),witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...prior.slice(5),read(KEY_578,trialPacket578([])),
      read(KEY_580,[]),read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),
      witness.witness,witness.owner,read(KEY_585,[]),read(KEY_586,[]),
      read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    const escalationArgs=[prior[3],[prior[4],custodyArgs,read(KEY_590,[])],read(KEY_591,[])];
    const receiptArgs=[prior[2],escalationArgs,read(KEY_592,[])];
    return [parsed[0],[prior[0],[prior[1],receiptArgs,read(KEY_593,[])],read(KEY_594,[])]];
  };
  const refresh=()=>{
    const packet=sourceVerification595(...context(),saved());
    output.value=JSON.stringify(packet,null,2);
    const select=get('dd595Case'),before=select.value;select.replaceChildren();
    packet.cases.forEach((c,i)=>{const option=doc.createElement('option');option.value=String(i);
      option.textContent=c.channel+' · '+c.product_ref+' · '+c.bucket;
      select.append(option);});
    if([...select.options].some(x=>x.value===before))select.value=before;
    status.textContent=packet.open_verification_cases+' original-source cases · '+
      packet.source_and_custody_conflicts+' source/custody conflicts · '+
      packet.overdue_owner_decisions+' overdue owner decisions · external trial HOLD.';
    return packet;
  };
  get('dd595Review').addEventListener('click',()=>{try{refresh();}catch{
    status.textContent='Recompute exact source sections 5–19. No external verification or approval.';}});
  get('dd595Hash').addEventListener('click',async()=>{
    try{
      const original=get('dd595OriginalFile').files?.[0];
      const custody=get('dd595CustodyFile').files?.[0];
      if(!original||!custody)throw Error('Two source documents required.');
      const [a,b]=await Promise.all([fileSha256595(original),fileSha256595(custody)]);
      get('dd595OriginalHash').value=a;get('dd595CustodyHash').value=b;
      status.textContent='Local SHA-256 calculated. Compare to independently supplied hashes; origin and consent NOT VERIFIED.';
    }catch{status.textContent='Select two local source documents (1 byte–25 MB); no files sent.';}
  });
  get('dd595Save').addEventListener('click',()=>{
    if(!get('dd595Ack').checked){status.textContent='Acknowledge the independent evidence boundary.';return;}
    try{
      const packet=refresh(),item=packet.cases[Number(get('dd595Case').value)];
      if(!item?.intake_pin||item.superseded_source)throw Error('No current original intake.');
      const value=id=>get('dd595'+id).value;
      const at=id=>value(id)?new Date(value(id)).toISOString():'';
      const draft=sourceCandidate595({intake_pin:item.intake_pin,
        next_action:value('Action'),owner_outcome:value('Outcome'),
        original_response_ref:value('Response'),original_provider_ref:value('Original'),
        provider_issuer_ref:value('Issuer'),original_receipt_ref:value('Receipt'),
        custody_receipt_ref:value('Custody'),custodian_ref:value('Custodian'),
        independent_reviewer_ref:value('Reviewer'),independent_witness_ref:value('Witness'),
        issuer_expected_sha256:value('IssuerHash'),original_file_sha256:value('OriginalHash'),
        custody_logged_sha256:value('CustodyLogHash'),custody_file_sha256:value('CustodyHash'),
        receipt_at:at('Received'),custody_at:at('Handoff'),
        owner_decision_ref:value('Owner'),owner_signer_ref:value('Signer'),
        account_id:value('Account'),product_ref:value('Product'),action_scope:value('Scope'),
        reason:value('Reason'),recorded_at:new Date().toISOString(),
        next_review_at:at('Due')});
      const next=[...saved(),draft],checked=sourceVerification595(...context(),next);
      if(!checked.cases.some(c=>c.intake_pin===draft.intake_pin&&
        c.reviews.some(r=>r.recorded_at===draft.recorded_at)))throw Error('Stale source.');
      win.localStorage.setItem(KEY_595,JSON.stringify(next));
      get('dd595Ack').checked=false;refresh();
    }catch{status.textContent='Invalid source, digest, custody sequence or owner scope. Trial remains HOLD.';}
  });
  get('dd595Copy').addEventListener('click',async()=>{try{refresh();
    try{await win.navigator.clipboard.writeText(output.value);
      status.textContent='Unresolved source verification and owner authorization exceptions copied; trial HOLD.';}
    catch{output.focus();output.select();status.textContent='Select and copy exceptions manually.';}}
  catch{status.textContent='Recompute source-pinned review before copying.';}});
}
if(typeof document!=='undefined')init595();
