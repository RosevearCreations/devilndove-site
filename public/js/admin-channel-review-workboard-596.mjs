/* Build 596: independent evidence queue and unsigned owner trial sign-off packet.
 * Local documentary review only; no provider authentication, owner consent or closure. */
import {sourceVerification595,KEY_595} from './admin-channel-source-verification-595.mjs?v=595';
import {agingBucket594,KEY_594} from './admin-channel-intake-aging-594.mjs?v=594';
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

export const FORMAT_596='devilndove-independent-evidence-workboard-owner-signoff-596-v1';
export const KEY_596='dd:independent-evidence-workboard-owner-signoff:596:v1';
export const ACTIONS_596=[
  'REQUEST_ORIGINAL_ISSUER_ATTESTATION','RECONCILE_CUSTODY_HANDOFF_RECEIPT',
  'INVESTIGATE_CROSS_CASE_DOCUMENT_DIGEST','ASSIGN_INDEPENDENT_SOURCE_REVIEW',
  'REQUEST_SIGNED_EXACT_OWNER_SCOPE','ESCALATE_OWNER_SIGNER_CONFLICT',
  'ESCALATE_OVERDUE_OWNER_DECISION'];
export const DISPOSITIONS_596=['OPEN_UNVERIFIED','AWAITING_INDEPENDENT_EVIDENCE',
  'REVIEWER_ASSIGNMENT_REQUESTED','CUSTODY_CONFLICT_RECHECK','OWNER_DECISION_PENDING'];
export const FILTERS_596=['ALL','OWNER','PROVIDER','CONFLICTS','OVERDUE','DUPLICATE_DIGEST'];
const ownerAction=x=>ACTIONS_596.slice(4).includes(x);
const safe=(v,max)=>typeof v==='string'&&v.length<=max&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(v);
const validISO=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&
  Number.isFinite(Date.parse(x));
const unique=a=>[...new Set(a.filter(Boolean))];
// Compact *identifier* for the exact recomputed source, not a cryptographic proof.
const caseId=x=>{
  let a=2166136261,b=2246822519;
  for(let i=0;i<x.length;i++){
    const n=x.charCodeAt(i);
    a=Math.imul(a^n,16777619)>>>0;
    b=Math.imul(b^n,1597334677)>>>0;
  }
  return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');
};

export function workboardPin596(c){
  if(!c?.response_pin)throw Error('Missing exact source case.');
  const latest=c.latest_verification;
  const source=JSON.stringify([c.response_pin,c.intake_pin||'',latest?.recorded_at||'',
    latest?.next_action||'',latest?.original_file_sha256||'',
    latest?.custody_file_sha256||'',latest?.owner_decision_ref||'',
    latest?.owner_signer_ref||'',c.review_due_at||'']);
  return 'dd596-case:'+caseId(source)+':'+c.followup_type+':'+c.channel+':'+c.product_ref;
}
export function workboardCandidate596(r){
  if(!r||!safe(r.case_pin,48000)||r.case_pin.length<40||
    !ACTIONS_596.includes(r.next_action)||!DISPOSITIONS_596.includes(r.disposition)||
    !safe(r.independent_reviewer_ref,200)||!safe(r.independent_witness_ref,200)||
    !safe(r.reason,900)||r.reason.trim().length<15||
    !validISO(r.recorded_at)||!validISO(r.next_review_at)||
    Date.parse(r.next_review_at)<Date.parse(r.recorded_at)||
    r.provider_authenticated===true||r.owner_trial_authorized===true||
    r.exception_closed===true||r.approved===true||r.provider_write_authorized===true)
    throw Error('Invalid source-pinned workboard review or unsupported authorization.');
  return {case_pin:r.case_pin,next_action:r.next_action,disposition:r.disposition,
    independent_reviewer_ref:r.independent_reviewer_ref.trim(),
    independent_witness_ref:r.independent_witness_ref.trim(),
    reason:r.reason.trim(),recorded_at:r.recorded_at,next_review_at:r.next_review_at,
    external_review_requested_only:true,provider_authenticated:false,
    owner_trial_authorized:false,exception_closed:false,provider_write_authorized:false};
}
function priority596(c,duplicate,conflicts){
  if(c.superseded_source)return {rank:0,code:'SUPERSEDED_SOURCE_HOLD'};
  if(duplicate)return {rank:1,code:'DOCUMENT_DIGEST_REUSE_CONFLICT'};
  if(conflicts.length)return {rank:2,code:'SOURCE_OR_CUSTODY_CONFLICT'};
  if(c.owner_trial_decision_pending&&c.bucket==='OVERDUE_SEVERE')
    return {rank:3,code:'OWNER_SIGNOFF_SEVERELY_OVERDUE'};
  if(c.owner_trial_decision_pending&&c.bucket==='OVERDUE')
    return {rank:4,code:'OWNER_SIGNOFF_OVERDUE'};
  if(!c.latest_verification)return {rank:5,code:'INDEPENDENT_SOURCE_REVIEW_MISSING'};
  if(c.owner_trial_decision_pending)return {rank:6,code:'EXACT_OWNER_SIGNOFF_PENDING'};
  return {rank:7,code:'EXTERNAL_PROVIDER_AUTHENTICATION_PENDING'};
}

export function evidenceWorkboard596(exact595,sourceArgs,requests=[],asOf=new Date().toISOString()){
  if(!exact595||!Array.isArray(sourceArgs)||sourceArgs.length!==3||
    !Array.isArray(requests)||requests.length>100||!validISO(asOf))
    throw Error('Missing exact Build 595 independent evidence chain.');
  const reproduced=sourceVerification595(...sourceArgs,exact595.as_of);
  if(JSON.stringify(reproduced)!==JSON.stringify(exact595))
    throw Error('Changed, forged or stale Build 595 source packet.');
  const current=asOf===exact595.as_of?reproduced:sourceVerification595(...sourceArgs,asOf);
  const candidates=requests.map(workboardCandidate596);
  const reused=new Set(current.cross_case_provider_document_digests.map(x=>x.sha256));
  const cases=current.cases.map(c=>{
    const pin=workboardPin596(c),owner=c.owner_trial_decision_pending;
    const verification=c.latest_verification;
    const duplicate=!!verification?.original_file_sha256&&reused.has(verification.original_file_sha256);
    const preceding=verification?.open_exceptions||[];
    const followups=candidates.filter(x=>x.case_pin===pin).map(x=>{
      if(ownerAction(x.next_action)!==owner)
        throw Error('Provider source and exact owner sign-off actions cannot be interchanged.');
      const conflicts=[
        x.independent_reviewer_ref&&x.independent_witness_ref&&
          x.independent_reviewer_ref===x.independent_witness_ref?'REVIEWER_AND_WITNESS_NOT_INDEPENDENT':null,
        x.independent_reviewer_ref&&verification?.provider_issuer_ref&&
          x.independent_reviewer_ref===verification.provider_issuer_ref?'REVIEWER_EQUALS_PROVIDER_ISSUER':null,
        x.independent_reviewer_ref&&verification?.custodian_ref&&
          x.independent_reviewer_ref===verification.custodian_ref?'REVIEWER_EQUALS_CUSTODIAN':null,
        x.independent_witness_ref&&verification?.custodian_ref&&
          x.independent_witness_ref===verification.custodian_ref?'WITNESS_EQUALS_CUSTODIAN':null,
        x.independent_reviewer_ref&&verification?.independent_reviewer_ref&&
          x.independent_reviewer_ref!==verification.independent_reviewer_ref?'INDEPENDENT_REVIEWER_ASSIGNMENT_CHANGED':null,
        x.independent_witness_ref&&verification?.independent_witness_ref&&
          x.independent_witness_ref!==verification.independent_witness_ref?'INDEPENDENT_WITNESS_ASSIGNMENT_CHANGED':null,
        !x.independent_reviewer_ref?'REVIEWER_ASSIGNMENT_MISSING':null,
        !x.independent_witness_ref?'WITNESS_ASSIGNMENT_MISSING':null
      ].filter(Boolean);
      const open=unique([...preceding,...conflicts,
        duplicate?'CROSS_CASE_PROVIDER_DOCUMENT_DIGEST_UNRESOLVED':null,
        c.superseded_source?'SUPERSEDED_SOURCE_REQUIRES_RENEWED_ORIGINAL':null,
        owner?'SIGNED_EXACT_OWNER_DECISION_NOT_AUTHENTICATED':null]);
      return {...x,assignment_conflicts:conflicts,open_exceptions:open,
        documentary_review_only:true,independently_authenticated:false,
        owner_signed_authorization_verified:false,trial_eligible:false,exception_closed:false};
    });
    const latest=followups.at(-1)||null;
    const conflicts=unique([...preceding,...(latest?.assignment_conflicts||[])]);
    const due=latest?.next_review_at||c.review_due_at;
    const aging=agingBucket594(due,asOf);
    const materialConflicts=unique([...(verification?.source_conflicts||[]),
      ...(latest?.assignment_conflicts||[])]);
    const priority=priority596({...c,bucket:aging.bucket},duplicate,materialConflicts);
    return {case_pin:pin,response_pin:c.response_pin,intake_pin:c.intake_pin,
      channel:c.channel,account_id:c.account_id,product_ref:c.product_ref,
      action:c.action,followup_type:c.followup_type,owner_trial_decision_pending:owner,
      review_due_at:due,bucket:aging.bucket,overdue_days:aging.overdue_days,
      original_verification:verification,
      superseded_source:c.superseded_source,duplicate_document_digest:duplicate,
      priority:priority.code,priority_rank:priority.rank,
      open_evidence_exceptions:unique([...conflicts,duplicate?'CROSS_CASE_PROVIDER_DOCUMENT_DIGEST_UNRESOLVED':null,
        owner?'SIGNED_EXACT_OWNER_DECISION_NOT_AUTHENTICATED':null]),
      followups,latest_followup:latest,provider_authenticated:false,
      owner_trial_authorized:false,exception_closed:false};
  }).sort((a,b)=>a.priority_rank-b.priority_rank||
    a.channel.localeCompare(b.channel)||a.product_ref.localeCompare(b.product_ref));
  const active=new Set(cases.map(x=>x.case_pin));
  return {format:FORMAT_596,build:596,source_build:595,
    source_pin:current.source_pin,as_of:asOf,cases,
    open_review_cases:cases.length,provider_review_cases:cases.filter(x=>!x.owner_trial_decision_pending).length,
    owner_signoff_packets_required:cases.filter(x=>x.owner_trial_decision_pending).length,
    duplicate_digest_cases:cases.filter(x=>x.duplicate_document_digest).length,
    source_conflict_cases:cases.filter(x=>x.open_evidence_exceptions.length).length,
    severely_overdue_owner_cases:cases.filter(x=>x.owner_trial_decision_pending&&x.bucket==='OVERDUE_SEVERE').length,
    missing_independent_reviews:cases.filter(x=>!x.original_verification).length,
    stale_workboard_candidates:candidates.filter(x=>!active.has(x.case_pin)),
    authenticated_provider_sources:0,verified_owner_signatures:0,
    approved_trials:0,closed_exceptions:0,provider_reads:0,provider_writes:0,d1_operations:0,
    disposition:'HOLD_INDEPENDENT_PROVIDER_SOURCE_AND_SIGNED_OWNER_TRIAL_SCOPE_UNVERIFIED'};
}
export function filterWorkboard596(packet,filter='ALL',search=''){
  if(!packet||packet.format!==FORMAT_596||!FILTERS_596.includes(filter)||
    typeof search!=='string'||search.length>120)throw Error('Invalid evidence queue filter.');
  const q=search.toLocaleLowerCase().trim();
  return packet.cases.filter(c=>{
    const matches=filter==='ALL'||
      (filter==='OWNER'&&c.owner_trial_decision_pending)||
      (filter==='PROVIDER'&&!c.owner_trial_decision_pending)||
      (filter==='CONFLICTS'&&c.open_evidence_exceptions.length>0)||
      (filter==='OVERDUE'&&c.owner_trial_decision_pending&&c.bucket.startsWith('OVERDUE'))||
      (filter==='DUPLICATE_DIGEST'&&c.duplicate_document_digest);
    return matches&&(!q||[c.channel,c.account_id,c.product_ref,c.action,c.priority]
      .some(v=>String(v).toLocaleLowerCase().includes(q)));
  });
}
export function unsignedOwnerPacket596(packet,casePin){
  if(!packet||packet.format!==FORMAT_596||typeof casePin!=='string')
    throw Error('Source workboard required for owner sign-off request.');
  const c=packet.cases.find(x=>x.case_pin===casePin);
  if(!c?.owner_trial_decision_pending)throw Error('Choose an exact owner trial decision case.');
  return {format:'devilndove-unsigned-exact-owner-trial-signoff-596-v1',
    build:596,prepared_at:packet.as_of,source_pin:c.case_pin,parent_source_build:595,
    case_pin:c.case_pin,channel:c.channel,exact_account:c.account_id,
    exact_product:c.product_ref,exact_action:c.action,
    original_response_reference:c.original_verification?.original_response_ref||null,
    original_provider_record_reference:c.original_verification?.original_provider_ref||null,
    custody_receipt_reference:c.original_verification?.custody_receipt_ref||null,
    local_source_sha256:c.original_verification?.original_file_sha256||null,
    local_custody_sha256:c.original_verification?.custody_file_sha256||null,
    original_owner_decision_locator:c.original_verification?.owner_decision_ref||null,
    original_owner_signer_candidate:c.original_verification?.owner_signer_ref||null,
    review_due_at:c.review_due_at,priority:c.priority,
    unresolved_exceptions:c.open_evidence_exceptions,
    owner_decision_required:'SEPARATELY_SIGNED_EXACT_ACCOUNT_PRODUCT_ACTION',
    signed_owner_decision_received:false,owner_signature_authenticated:false,
    provider_source_authenticated:false,trial_approved:false,
    provider_read_or_write_authorized:false,
    status:'UNSIGNED_OWNER_REVIEW_PACKET_ONLY_TRIAL_HOLD'};
}

function init596(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd596Refresh'))return;
  const get=id=>doc.getElementById(id),state=get('dd596State'),output=get('dd596Output');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const saved=()=>read(KEY_596,[]);
  const context=()=>{
    const ids=['dd595Output','dd594Output','dd593Output','dd592Output','dd591Output',
      'dd590Output','dd589Output','dd588Output','dd587Output','dd586Output',
      'dd585Output','dd584Output','dd583Output','dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id)?.value;if(!raw||raw.length>500000)
      throw Error('Recompute exact source sections 5–20.');return JSON.parse(raw);});
    const prior=parsed.slice(2),witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...prior.slice(5),read(KEY_578,trialPacket578([])),
      read(KEY_580,[]),read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),
      witness.witness,witness.owner,read(KEY_585,[]),read(KEY_586,[]),
      read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    const escalationArgs=[prior[3],[prior[4],custodyArgs,read(KEY_590,[])],read(KEY_591,[])];
    const receiptArgs=[prior[2],escalationArgs,read(KEY_592,[])];
    const source594=[prior[0],[prior[1],receiptArgs,read(KEY_593,[])],read(KEY_594,[])];
    const source595=[parsed[1],source594,read(KEY_595,[])];
    return [parsed[0],source595];
  };
  const refresh=()=>{
    const packet=evidenceWorkboard596(...context(),saved());
    output.value=JSON.stringify(packet,null,2);
    const select=get('dd596Case'),selected=select.value;select.replaceChildren();
    packet.cases.forEach(c=>{const opt=doc.createElement('option');opt.value=c.case_pin;
      opt.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;select.append(opt);});
    if([...select.options].some(x=>x.value===selected))select.value=selected;
    const rows=get('dd596Rows');rows.replaceChildren();
    filterWorkboard596(packet,get('dd596Filter').value,get('dd596Search').value)
      .forEach(c=>{const row=doc.createElement('li');
        row.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+' · '+
          c.open_evidence_exceptions.length+' open gaps · '+c.bucket;
        rows.append(row);});
    state.textContent=packet.open_review_cases+' open cases · '+
      packet.duplicate_digest_cases+' duplicate-digest cases · '+
      packet.owner_signoff_packets_required+' unsigned owner packets · trial HOLD.';
    return packet;
  };
  get('dd596Refresh').addEventListener('click',()=>{try{refresh();}catch{
    state.textContent='Recompute sections 5–20. Source authentication and owner sign-off remain HOLD.';}});
  get('dd596Filter').addEventListener('change',()=>{try{refresh();}catch{state.textContent='Recompute source evidence first.';}});
  get('dd596Search').addEventListener('input',()=>{try{refresh();}catch{state.textContent='Recompute source evidence first.';}});
  get('dd596Save').addEventListener('click',()=>{
    if(!get('dd596Ack').checked){state.textContent='Confirm this is an unverified follow-up only.';return;}
    try{
      const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd596Case').value);
      if(!c||c.superseded_source)throw Error('Missing current original source.');
      const due=new Date(get('dd596Due').value).toISOString();
      const row=workboardCandidate596({case_pin:c.case_pin,
        next_action:get('dd596Action').value,disposition:get('dd596Disposition').value,
        independent_reviewer_ref:get('dd596Reviewer').value,
        independent_witness_ref:get('dd596Witness').value,
        reason:get('dd596Reason').value,recorded_at:new Date().toISOString(),next_review_at:due});
      const next=[...saved(),row],checked=evidenceWorkboard596(...context(),next);
      if(!checked.cases.some(x=>x.case_pin===row.case_pin&&
        x.followups.some(y=>y.recorded_at===row.recorded_at)))throw Error('Stale follow-up.');
      win.localStorage.setItem(KEY_596,JSON.stringify(next));
      get('dd596Ack').checked=false;refresh();
    }catch{state.textContent='Invalid/stale review or wrong owner/provider action. No sign-off or closure.';}
  });
  get('dd596Prepare').addEventListener('click',()=>{try{
    const p=refresh(),packet=unsignedOwnerPacket596(p,get('dd596Case').value);
    get('dd596Packet').value=JSON.stringify(packet,null,2);
    state.textContent='Unsigned exact owner trial packet prepared locally. No consent or trial approval.';
  }catch{state.textContent='Select a current owner authorization case for an unsigned packet.';}});
  const copy=async(id,message)=>{try{
    if(id==='dd596Output')refresh();
    const area=get(id);if(!area.value)throw Error('Nothing to copy.');
    try{await win.navigator.clipboard.writeText(area.value);state.textContent=message;}
    catch{area.focus();area.select();state.textContent='Select and copy the packet manually.';}
  }catch{state.textContent='Recompute the exact source evidence before copying.';}};
  get('dd596Copy').addEventListener('click',()=>copy('dd596Output','Open evidence queue copied; trial HOLD.'));
  get('dd596CopyPacket').addEventListener('click',()=>{try{
    const packet=unsignedOwnerPacket596(refresh(),get('dd596Case').value);
    get('dd596Packet').value=JSON.stringify(packet,null,2);
    copy('dd596Packet','Unsigned exact-source owner packet copied; trial HOLD.');
  }catch{state.textContent='Select a current owner case and recompute sources before copying.';}});
}
if(typeof document!=='undefined')init596();
