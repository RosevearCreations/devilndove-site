/* Build 597: local source conflict disposition and exact owner witness reconciliation.
 * Documentary records are not original issuer authentication or signed owner approval. */
import {evidenceWorkboard596,KEY_596} from './admin-channel-review-workboard-596.mjs?v=596';
import {agingBucket594} from './admin-channel-intake-aging-594.mjs?v=594';
import {KEY_595} from './admin-channel-source-verification-595.mjs?v=595';
import {KEY_594} from './admin-channel-intake-aging-594.mjs?v=594';
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

export const FORMAT_597='devilndove-source-disposition-issuer-owner-witness-597-v1';
export const KEY_597='dd:source-disposition-issuer-owner-witness:597:v1';
export const ACTIONS_597=[
  'REQUEST_ORIGINAL_ISSUER_ATTESTATION','RECHECK_CUSTODY_DOCUMENT_DIGEST',
  'ASSIGN_DISTINCT_SOURCE_WITNESS','ESCALATE_DISPUTED_SOURCE_CONFLICT',
  'REQUEST_EXACT_OWNER_SIGNED_RECEIPT','RECONCILE_OWNER_SIGNER_AND_WITNESS',
  'ESCALATE_EXACT_OWNER_SCOPE_CONFLICT'];
export const STATES_597=['OPEN_UNVERIFIED','ORIGINAL_ISSUER_REPLY_PENDING',
  'CUSTODY_CONFLICT_UNRESOLVED','INDEPENDENT_WITNESS_PENDING',
  'OWNER_SIGNED_RECEIPT_PENDING','PROPOSED_DISPOSITION_NEEDS_VERIFICATION'];
export const FILTERS_597=['ALL','ISSUER','DIGEST','OWNER','WITNESS','OVERDUE'];
const ownerAction=a=>ACTIONS_597.slice(4).includes(a);
const safe=(x,n)=>typeof x==='string'&&x.length<=n&&
  !/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(x);
const iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const sha=x=>!x||/^[a-f0-9]{64}$/.test(x);
const unique=x=>[...new Set(x.filter(Boolean))];

export function dispositionCandidate597(r){
  const fields=['case_pin','exception_code','issuer_authority_ref','original_issuer_attestation_ref',
    'issuer_attested_sha256','custody_receipt_ref','custody_document_sha256',
    'reviewer_ref','witness_ref','owner_signer_ref','owner_signed_receipt_ref',
    'owner_signed_sha256','owner_account','owner_product','owner_action','reason'];
  if(!r||fields.some(f=>!safe(r[f],f==='reason'?900:220))||
    !r.case_pin.startsWith('dd596-case:')||r.exception_code.length<4||
    !ACTIONS_597.includes(r.next_action)||!STATES_597.includes(r.disposition)||
    !sha(r.issuer_attested_sha256)||!sha(r.custody_document_sha256)||
    !sha(r.owner_signed_sha256)||r.reason.trim().length<15||
    !iso(r.recorded_at)||!iso(r.next_review_at)||
    Date.parse(r.next_review_at)<Date.parse(r.recorded_at)||
    r.issuer_authenticated===true||r.owner_signed_authorization_verified===true||
    r.trial_authorized===true||r.exception_closed===true||r.provider_write_authorized===true)
    throw Error('Invalid unverified issuer or exact owner witness disposition.');
  return Object.fromEntries([...fields.map(f=>[f,r[f].trim()]),
    ['next_action',r.next_action],['disposition',r.disposition],
    ['recorded_at',r.recorded_at],['next_review_at',r.next_review_at],
    ['documentary_followup_only',true],['issuer_authenticated',false],
    ['owner_signed_authorization_verified',false],['trial_authorized',false],
    ['exception_closed',false],['provider_write_authorized',false]]);
}

function contradictions597(r,c){
  const v=c.original_verification||{},owner=c.owner_trial_decision_pending;
  return unique([
    r.reviewer_ref&&r.witness_ref&&r.reviewer_ref===r.witness_ref?'REVIEWER_EQUALS_WITNESS':null,
    r.reviewer_ref&&v.provider_issuer_ref&&r.reviewer_ref===v.provider_issuer_ref?'REVIEWER_EQUALS_ISSUER':null,
    r.reviewer_ref&&v.custodian_ref&&r.reviewer_ref===v.custodian_ref?'REVIEWER_EQUALS_CUSTODIAN':null,
    r.witness_ref&&v.custodian_ref&&r.witness_ref===v.custodian_ref?'WITNESS_EQUALS_CUSTODIAN':null,
    r.issuer_authority_ref&&v.provider_issuer_ref&&r.issuer_authority_ref!==v.provider_issuer_ref?'ORIGINAL_ISSUER_AUTHORITY_CONFLICT':null,
    r.original_issuer_attestation_ref&&v.original_provider_ref&&r.original_issuer_attestation_ref===v.original_provider_ref?'ISSUER_REPLY_NOT_INDEPENDENT_OF_ORIGINAL_RECORD':null,
    r.issuer_attested_sha256&&v.original_file_sha256&&r.issuer_attested_sha256!==v.original_file_sha256?'ORIGINAL_ISSUER_DIGEST_CONFLICT':null,
    r.custody_document_sha256&&v.custody_file_sha256&&r.custody_document_sha256!==v.custody_file_sha256?'CUSTODY_DIGEST_CONFLICT':null,
    r.custody_receipt_ref&&v.custody_receipt_ref&&r.custody_receipt_ref!==v.custody_receipt_ref?'CUSTODY_RECEIPT_REFERENCE_CONFLICT':null,
    owner&&r.owner_signer_ref&&r.owner_signer_ref===r.witness_ref?'OWNER_SIGNER_EQUALS_WITNESS':null,
    owner&&r.owner_signer_ref&&r.owner_signer_ref===r.reviewer_ref?'OWNER_SIGNER_EQUALS_REVIEWER':null,
    owner&&r.owner_signer_ref&&v.owner_signer_ref&&r.owner_signer_ref!==v.owner_signer_ref?'OWNER_SIGNER_REFERENCE_CONFLICT':null,
    owner&&r.owner_signed_receipt_ref&&v.owner_decision_ref&&r.owner_signed_receipt_ref!==v.owner_decision_ref?'OWNER_SIGNED_RECEIPT_REFERENCE_CONFLICT':null,
    owner&&r.owner_account!==c.account_id?'OWNER_ACCOUNT_NOT_EXACT':null,
    owner&&r.owner_product!==c.product_ref?'OWNER_PRODUCT_NOT_EXACT':null,
    owner&&r.owner_action!==c.action?'OWNER_ACTION_NOT_EXACT':null,
    owner&&(!r.owner_signed_receipt_ref||!r.owner_signed_sha256)?'SIGNED_OWNER_RECEIPT_DIGEST_NOT_INDEPENDENTLY_VERIFIED':null,
    !r.reviewer_ref?'DISTINCT_REVIEWER_MISSING':null,
    !r.witness_ref?'DISTINCT_WITNESS_MISSING':null
  ]);
}

export function reconcileSource597(exact596,sourceArgs,local596=[],requests=[],asOf=new Date().toISOString()){
  if(!exact596||!Array.isArray(sourceArgs)||sourceArgs.length!==2||
    !Array.isArray(local596)||!Array.isArray(requests)||requests.length>100||!iso(asOf))
    throw Error('Exact Build 596 evidence workboard required.');
  const reproduced=evidenceWorkboard596(...sourceArgs,local596,exact596.as_of);
  if(JSON.stringify(reproduced)!==JSON.stringify(exact596))
    throw Error('Forged or stale Build 596 source workboard.');
  const current=asOf===exact596.as_of?reproduced:evidenceWorkboard596(...sourceArgs,local596,asOf);
  const submitted=requests.map(dispositionCandidate597);
  const cases=current.cases.map(c=>{
    const owner=c.owner_trial_decision_pending;
    const reviews=submitted.filter(r=>r.case_pin===c.case_pin).map(r=>{
      if(ownerAction(r.next_action)!==owner||!c.open_evidence_exceptions.includes(r.exception_code)||
        (owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
          r.owner_action!==c.action))||
        (!owner&&[r.owner_signer_ref,r.owner_signed_receipt_ref,r.owner_signed_sha256,
          r.owner_account,r.owner_product,r.owner_action].some(Boolean)))
        throw Error('Wrong original-source conflict or owner scope.');
      const contradictions=contradictions597(r,c);
      return {...r,contradictions,remaining_exceptions:unique([...c.open_evidence_exceptions,...contradictions]),
        independent_issuer_attestation_verified:false,owner_witness_authenticated:false,
        signed_owner_trial_authorization_verified:false,trial_authorized:false,
        exception_closed:false,external_provider_reads:0,external_provider_writes:0};
    });
    const latest=reviews.at(-1)||null;
    const outstanding=unique([...c.open_evidence_exceptions,...(latest?.contradictions||[])]);
    const due=latest?.next_review_at||c.review_due_at;
    const age=agingBucket594(due,asOf);
    return {case_pin:c.case_pin,channel:c.channel,account_id:c.account_id,
      product_ref:c.product_ref,exact_action:c.action,owner_trial_decision_pending:owner,
      priority:c.priority,source_digest_reused:c.duplicate_document_digest,
      source_digest:c.original_verification?.original_file_sha256||null,
      custody_digest:c.original_verification?.custody_file_sha256||null,
      expected_issuer_ref:c.original_verification?.provider_issuer_ref||null,
      expected_custody_ref:c.original_verification?.custody_receipt_ref||null,
      expected_owner_signer_ref:c.original_verification?.owner_signer_ref||null,
      expected_owner_receipt_ref:c.original_verification?.owner_decision_ref||null,
      review_due_at:due,aging_bucket:age.bucket,overdue_days:age.overdue_days,
      unresolved_exceptions:outstanding,reviews,latest_review:latest,
      original_issuer_authenticated:false,independent_witness_verified:false,
      exact_owner_signed_scope_verified:false,provider_authorized:false,
      trial_approved:false,exception_closed:false};
  });
  const pins=new Set(cases.map(c=>c.case_pin));
  return {format:FORMAT_597,build:597,source_build:596,as_of:asOf,
    cases,open_cases:cases.length,
    issuer_followup_cases:cases.filter(c=>!c.owner_trial_decision_pending).length,
    owner_witness_cases:cases.filter(c=>c.owner_trial_decision_pending).length,
    digest_conflict_cases:cases.filter(c=>c.source_digest_reused||c.unresolved_exceptions.some(x=>x.includes('DIGEST'))).length,
    witness_conflict_cases:cases.filter(c=>c.unresolved_exceptions.some(x=>x.includes('WITNESS')||x.includes('REVIEWER'))).length,
    overdue_owner_signoffs:cases.filter(c=>c.owner_trial_decision_pending&&c.aging_bucket.startsWith('OVERDUE')).length,
    unmatched_stale_dispositions:submitted.filter(r=>!pins.has(r.case_pin)),
    issuer_attestations_authenticated:0,owner_signatures_authenticated:0,
    trials_authorized:0,exceptions_closed:0,provider_reads:0,provider_writes:0,d1_operations:0,
    release_gate:'HOLD_ORIGINAL_ISSUER_AUTHORITY_AND_SIGNED_OWNER_SCOPE_UNVERIFIED'};
}

export function filterSourceCases597(packet,kind='ALL',text=''){
  if(packet?.format!==FORMAT_597||!FILTERS_597.includes(kind)||!safe(text,120))
    throw Error('Invalid independent evidence case filter.');
  const q=text.trim().toLocaleLowerCase();
  return packet.cases.filter(c=>{
    const match=kind==='ALL'||(kind==='ISSUER'&&!c.owner_trial_decision_pending)||
      (kind==='OWNER'&&c.owner_trial_decision_pending)||
      (kind==='DIGEST'&&(c.source_digest_reused||c.unresolved_exceptions.some(x=>x.includes('DIGEST'))))||
      (kind==='WITNESS'&&c.unresolved_exceptions.some(x=>x.includes('WITNESS')||x.includes('REVIEWER')))||
      (kind==='OVERDUE'&&c.owner_trial_decision_pending&&c.aging_bucket.startsWith('OVERDUE'));
    return match&&(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority].some(x=>String(x).toLowerCase().includes(q)));
  });
}

export function unsignedWitnessPacket597(packet,pin){
  if(packet?.format!==FORMAT_597)throw Error('Exact independent source reconciliation required.');
  const c=packet.cases.find(x=>x.case_pin===pin&&x.owner_trial_decision_pending);
  if(!c)throw Error('Exact pending owner sign-off case required.');
  const r=c.latest_review;
  return {format:'devilndove-owner-signoff-witness-reconciliation-597-v1',
    build:597,source_build:596,case_pin:c.case_pin,prepared_at:packet.as_of,
    exact_channel:c.channel,exact_account:c.account_id,exact_product:c.product_ref,
    exact_action:c.exact_action,original_owner_signer_reference:c.expected_owner_signer_ref,
    original_owner_receipt_reference:c.expected_owner_receipt_ref,
    proposed_signer:r?.owner_signer_ref||null,proposed_signed_receipt:r?.owner_signed_receipt_ref||null,
    local_signature_digest:r?.owner_signed_sha256||null,
    proposed_independent_reviewer:r?.reviewer_ref||null,proposed_separate_witness:r?.witness_ref||null,
    unresolved_exceptions:c.unresolved_exceptions,signature_verified:false,
    issuer_authenticated:false,independent_witness_authenticated:false,
    owner_trial_authorized:false,provider_read_or_write_authorized:false,
    status:'UNSIGNED_UNVERIFIED_WITNESS_RECONCILIATION_TRIAL_HOLD'};
}

export function sourceContext597(doc=globalThis.document,win=globalThis.window){
  const get=id=>doc.getElementById(id);
  const read=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
    const ids=['dd596Output','dd595Output','dd594Output','dd593Output',
      'dd592Output','dd591Output','dd590Output','dd589Output','dd588Output',
      'dd587Output','dd586Output','dd585Output','dd584Output','dd583Output',
      'dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id)?.value;
      if(!raw||raw.length>850000)throw Error('Recompute exact source sections 5–21.');
      return JSON.parse(raw);});
    const prior=parsed.slice(3),witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...prior.slice(5),read(KEY_578,trialPacket578([])),
      read(KEY_580,[]),read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),
      witness.witness,witness.owner,read(KEY_585,[]),read(KEY_586,[]),
      read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    const escalationArgs=[prior[3],[prior[4],custodyArgs,read(KEY_590,[])],read(KEY_591,[])];
    const receiptArgs=[prior[2],escalationArgs,read(KEY_592,[])];
    const source594=[prior[0],[prior[1],receiptArgs,read(KEY_593,[])],read(KEY_594,[])];
    const source595=[parsed[2],source594,read(KEY_595,[])];
    return [parsed[0],[parsed[1],source595],read(KEY_596,[])];
}

function init597(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd597Refresh'))return;
  const get=id=>doc.getElementById(id),status=get('dd597State'),output=get('dd597Output');
  const read=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
  const saved=()=>read(KEY_597,[]);
  let selectedCasePin=null;
  const context=()=>{
    const ids=['dd596Output','dd595Output','dd594Output','dd593Output',
      'dd592Output','dd591Output','dd590Output','dd589Output','dd588Output',
      'dd587Output','dd586Output','dd585Output','dd584Output','dd583Output',
      'dd581Output','dd580Output'];
    const parsed=ids.map(id=>{const raw=get(id)?.value;
      if(!raw||raw.length>850000)throw Error('Recompute exact source sections 5–21.');
      return JSON.parse(raw);});
    const prior=parsed.slice(3),witness=read(KEY_584,{witness:[],owner:[]});
    const custodyArgs=[...prior.slice(5),read(KEY_578,trialPacket578([])),
      read(KEY_580,[]),read(KEY_581,[]),read(KEY_582,[]),read(KEY_583,[]),
      witness.witness,witness.owner,read(KEY_585,[]),read(KEY_586,[]),
      read(KEY_587,[]),read(KEY_588,[]),read(KEY_589,[])];
    const escalationArgs=[prior[3],[prior[4],custodyArgs,read(KEY_590,[])],read(KEY_591,[])];
    const receiptArgs=[prior[2],escalationArgs,read(KEY_592,[])];
    const source594=[prior[0],[prior[1],receiptArgs,read(KEY_593,[])],read(KEY_594,[])];
    const source595=[parsed[2],source594,read(KEY_595,[])];
    return [parsed[0],[parsed[1],source595],read(KEY_596,[])];
  };
  const refresh=()=>{
    const packet=reconcileSource597(...context(),saved());output.value=JSON.stringify(packet,null,2);
    const choices=get('dd597Case'),before=choices.value;choices.replaceChildren();
    packet.cases.forEach(c=>{const option=doc.createElement('option');option.value=c.case_pin;
      option.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;choices.append(option);});
    if([...choices.options].some(x=>x.value===before))choices.value=before;
    const c=packet.cases.find(x=>x.case_pin===choices.value);
    if(c?.case_pin!==selectedCasePin){
      selectedCasePin=c?.case_pin||null;
      get('dd597Account').value=c?.owner_trial_decision_pending?c.account_id:'';
      get('dd597Product').value=c?.owner_trial_decision_pending?c.product_ref:'';
      get('dd597Scope').value=c?.owner_trial_decision_pending?c.exact_action:'';
      get('dd597Action').value=c?.owner_trial_decision_pending?
        'REQUEST_EXACT_OWNER_SIGNED_RECEIPT':'REQUEST_ORIGINAL_ISSUER_ATTESTATION';
      get('dd597Disposition').value='OPEN_UNVERIFIED';
    }
    const exception=get('dd597Exception'),previous=exception.value;exception.replaceChildren();
    (c?.unresolved_exceptions||[]).forEach(e=>{const option=doc.createElement('option');option.value=e;
      option.textContent=e.replaceAll('_',' ');exception.append(option);});
    if([...exception.options].some(x=>x.value===previous))exception.value=previous;
    const rows=get('dd597Rows');rows.replaceChildren();
    filterSourceCases597(packet,get('dd597Filter').value,get('dd597Search').value).forEach(c=>{
      const row=doc.createElement('li');row.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+
        ' · '+c.unresolved_exceptions.length+' open conflicts · '+c.aging_bucket;rows.append(row);});
    status.textContent=packet.open_cases+' unverified cases · '+packet.digest_conflict_cases+
      ' digest reviews · '+packet.owner_witness_cases+' owner witness cases · trial HOLD.';
    return packet;
  };
  const guard=()=>{try{return refresh();}catch{status.textContent='Recompute exact source sections 5–21; trial HOLD.';return null;}};
  get('dd597Refresh').addEventListener('click',guard);
  get('dd597Filter').addEventListener('change',guard);
  get('dd597Search').addEventListener('input',guard);
  get('dd597Case').addEventListener('change',guard);
  get('dd597Save').addEventListener('click',()=>{
    if(!get('dd597Ack').checked){status.textContent='Confirm review-only HOLD first.';return;}
    try{
      const packet=refresh(),c=packet.cases.find(x=>x.case_pin===get('dd597Case').value);
      if(!c)throw Error('No case.');
      const value=id=>get(id).value.trim();
      const draft=dispositionCandidate597({case_pin:c.case_pin,
        exception_code:value('dd597Exception'),next_action:value('dd597Action'),
        disposition:value('dd597Disposition'),issuer_authority_ref:value('dd597Issuer'),
        original_issuer_attestation_ref:value('dd597Attestation'),
        issuer_attested_sha256:value('dd597IssuerDigest'),
        custody_receipt_ref:value('dd597Custody'),custody_document_sha256:value('dd597CustodyDigest'),
        reviewer_ref:value('dd597Reviewer'),witness_ref:value('dd597Witness'),
        owner_signer_ref:value('dd597Signer'),owner_signed_receipt_ref:value('dd597OwnerReceipt'),
        owner_signed_sha256:value('dd597OwnerDigest'),owner_account:value('dd597Account'),
        owner_product:value('dd597Product'),owner_action:value('dd597Scope'),
        reason:value('dd597Reason'),recorded_at:new Date().toISOString(),
        next_review_at:new Date(value('dd597Due')).toISOString()});
      const rows=[...saved(),draft],verified=reconcileSource597(...context(),rows);
      if(!verified.cases.some(x=>x.case_pin===draft.case_pin&&x.reviews.some(y=>y.recorded_at===draft.recorded_at)))
        throw Error('Stale source.');
      win.localStorage.setItem(KEY_597,JSON.stringify(rows));get('dd597Ack').checked=false;refresh();
    }catch{status.textContent='Rejected: stale source, wrong conflict, unsafe reference or owner scope. Trial HOLD.';}
  });
  get('dd597Prepare').addEventListener('click',()=>{try{
    get('dd597Packet').value=JSON.stringify(unsignedWitnessPacket597(refresh(),get('dd597Case').value),null,2);
    status.textContent='Unsigned independent owner witness review packet prepared. Trial HOLD.';
  }catch{status.textContent='Select an exact owner case; no owner approval implied.';}});
  const copy=async(id,message)=>{try{
    if(id==='dd597Output')refresh();
    const area=get(id);if(!area.value)throw Error('Empty.');
    try{await win.navigator.clipboard.writeText(area.value);status.textContent=message;}
    catch{area.focus();area.select();status.textContent='Select and copy the review packet manually.';}
  }catch{status.textContent='Recompute current original source before copying.';}};
  get('dd597Copy').addEventListener('click',()=>copy('dd597Output','Open source conflicts copied; trial HOLD.'));
  get('dd597CopyPacket').addEventListener('click',()=>{try{
    get('dd597Packet').value=JSON.stringify(unsignedWitnessPacket597(refresh(),get('dd597Case').value),null,2);
    copy('dd597Packet','Unsigned exact owner witness packet copied; trial HOLD.');
  }catch{status.textContent='Recompute exact pending owner case first.';}});
}
if(typeof document!=='undefined')init597();
