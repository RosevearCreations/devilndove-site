
import {reconcileSource597,sourceContext597,KEY_597,FORMAT_597} from './admin-channel-source-disposition-597.mjs?v=597';
export const FORMAT_598='devilndove-issuer-response-conflict-closure-owner-witness-598-v1';
export const KEY_598='dd:issuer-response-conflict-witness:598:v1';
export const KINDS_598=['ISSUER_RESPONSE_REVIEW','OWNER_WITNESS_REVIEW'];
export const STATES_598=['RESPONSE_NOT_YET_OBTAINED','RESPONSE_RECEIVED_UNAUTHENTICATED',
'DIGEST_DISPUTE_ESCALATED','INDEPENDENT_CONFLICT_RECHECK',
'OWNER_SIGNATURE_WITNESS_PENDING','PROPOSED_CLOSURE_AWAITING_EXTERNAL_PROOF'];
export const FILTERS_598=['ALL','ISSUER','OWNER','DIGEST','WITNESS','OVERDUE'];
const safe=(v,max=220)=>typeof v==='string'&&v.length<=max&&
!/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=]|private[_ -]?key)/i.test(v);
const iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const digest=x=>x===''||/^[a-f0-9]{64}$/.test(x);
const distinct=xs=>[...new Set(xs.filter(Boolean))];
const ownerKind=k=>k==='OWNER_WITNESS_REVIEW';

export function issuerResponseCandidate598(input){
const fields=['case_pin','exception_code','issuer_response_ref','issuer_identity_ref',
'reply_document_sha256','custody_receipt_ref','original_attestation_ref',
'independent_reviewer_ref','independent_witness_ref','owner_signer_ref',
'owner_signed_receipt_ref','owner_document_sha256','owner_account',
'owner_product','owner_action','reason'];
if(!input||fields.some(f=>!safe(input[f],f==='reason'?900:220))||
!input.case_pin.startsWith('dd596-case:')||input.exception_code.length<4||
!KINDS_598.includes(input.review_kind)||!STATES_598.includes(input.review_state)||
!digest(input.reply_document_sha256)||!digest(input.owner_document_sha256)||
input.reason.trim().length<15||!iso(input.recorded_at)||!iso(input.next_review_at)||
Date.parse(input.next_review_at)<Date.parse(input.recorded_at)||
['issuer_authenticated','signature_authenticated','owner_approved','trial_authorized',
'exception_closed','provider_write_authorized','conflict_resolved',
'independent_witness_verified','original_issuer_verified'].some(k=>input[k]===true)||
Object.entries(input).some(([k,v])=>typeof v==='boolean'&&v===true&&
/(approv|authentic|authoriz|verif|clos|resolv|publish|provider_write)/i.test(k)))
throw Error('Invalid or authorization-claiming Build 598 documentary response.');
return Object.fromEntries([...fields.map(f=>[f,input[f].trim()]),
['review_kind',input.review_kind],['review_state',input.review_state],
['recorded_at',input.recorded_at],['next_review_at',input.next_review_at],
['issuer_authenticated',false],['signature_authenticated',false],
['owner_approved',false],['trial_authorized',false],
['exception_closed',false],['provider_write_authorized',false]]);
}

export function issuerResponseReview598(exact597,source597,local597=[],candidates=[],
asOf=new Date().toISOString()){
if(exact597?.format!==FORMAT_597||!Array.isArray(source597)||source597.length!==3||
!Array.isArray(local597)||!Array.isArray(candidates)||candidates.length>100||!iso(asOf))
throw Error('Exact Build 597 source disposition chain required.');
const reproduced=reconcileSource597(...source597,local597,exact597.as_of);
if(JSON.stringify(reproduced)!==JSON.stringify(exact597))
throw Error('Stale or modified Build 597 source reconciliation.');
const current=asOf===exact597.as_of?reproduced:reconcileSource597(...source597,local597,asOf);
const submitted=candidates.map(issuerResponseCandidate598);
const cases=current.cases.map(c=>{
const rows=submitted.filter(r=>r.case_pin===c.case_pin).map(r=>{
if(ownerKind(r.review_kind)!==c.owner_trial_decision_pending||
!c.unresolved_exceptions.includes(r.exception_code)||
(c.owner_trial_decision_pending&&
(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action))||
(!c.owner_trial_decision_pending&&
[r.owner_signer_ref,r.owner_signed_receipt_ref,r.owner_document_sha256,
r.owner_account,r.owner_product,r.owner_action].some(Boolean)))
throw Error('Wrong issuer case, unresolved exception or exact owner scope.');
const p=c.latest_review||{},conflicts=distinct([
r.issuer_identity_ref&&c.expected_issuer_ref&&
r.issuer_identity_ref!==c.expected_issuer_ref?'ISSUER_IDENTITY_REFERENCE_CONFLICT':null,
r.reply_document_sha256&&c.source_digest&&
r.reply_document_sha256!==c.source_digest?'ISSUER_REPLY_ORIGINAL_DIGEST_CONFLICT':null,
r.custody_receipt_ref&&c.expected_custody_ref&&
r.custody_receipt_ref!==c.expected_custody_ref?'ORIGINAL_CUSTODY_RECEIPT_REFERENCE_CONFLICT':null,
r.issuer_response_ref&&r.issuer_response_ref===p.original_issuer_attestation_ref?
'REUSED_PREVIOUS_ISSUER_ATTESTATION_REFERENCE':null,
r.issuer_response_ref&&r.issuer_response_ref===r.original_attestation_ref?
'SELF_REFERENTIAL_ISSUER_EVIDENCE':null,
r.independent_reviewer_ref&&r.independent_reviewer_ref===r.independent_witness_ref?
'REVIEWER_EQUALS_WITNESS':null,
r.issuer_identity_ref&&r.issuer_identity_ref===r.independent_reviewer_ref?
'REVIEWER_EQUALS_ISSUER':null,
r.issuer_identity_ref&&r.issuer_identity_ref===r.independent_witness_ref?
'WITNESS_EQUALS_ISSUER':null,
c.owner_trial_decision_pending&&r.owner_signer_ref&&r.owner_signer_ref===r.independent_witness_ref?
'OWNER_SIGNER_EQUALS_WITNESS':null,
c.owner_trial_decision_pending&&r.owner_signer_ref&&r.owner_signer_ref===r.independent_reviewer_ref?
'OWNER_SIGNER_EQUALS_REVIEWER':null,
c.owner_trial_decision_pending&&c.expected_owner_signer_ref&&r.owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_REFERENCE_CONFLICT':null,
c.owner_trial_decision_pending&&c.expected_owner_receipt_ref&&r.owner_signed_receipt_ref&&
r.owner_signed_receipt_ref!==c.expected_owner_receipt_ref?'OWNER_SIGNED_RECEIPT_REFERENCE_CONFLICT':null,
c.owner_trial_decision_pending&&(!r.owner_signed_receipt_ref||!r.owner_document_sha256)?
'SIGNED_OWNER_RECEIPT_NOT_INDEPENDENTLY_VERIFIED':null,
!r.independent_reviewer_ref?'INDEPENDENT_REVIEWER_MISSING':null,
!r.independent_witness_ref?'SEPARATE_WITNESS_MISSING':null
]);
return {...r,conflicts,
digest_comparison:r.reply_document_sha256&&c.source_digest?
(r.reply_document_sha256===c.source_digest?'LOCAL_DIGEST_MATCH_UNAUTHENTICATED':'DIGEST_CONFLICT_OPEN'):
'ORIGINAL_REPLY_DIGEST_NOT_DOCUMENTED',
remaining_exceptions:distinct([...c.unresolved_exceptions,...conflicts]),
proposed_closure_only:r.review_state==='PROPOSED_CLOSURE_AWAITING_EXTERNAL_PROOF',
original_issuer_authenticated:false,independent_closure_verified:false,
owner_witness_authenticated:false,signed_exact_owner_permission_verified:false,
provider_reads:0,provider_writes:0,d1_operations:0,trial_authorized:false,
exception_closed:false};
});
const last=rows.at(-1)||null;
return {case_pin:c.case_pin,channel:c.channel,account_id:c.account_id,
product_ref:c.product_ref,exact_action:c.exact_action,
owner_trial_decision_pending:c.owner_trial_decision_pending,
priority:c.priority,aging_bucket:c.aging_bucket,
source_digest:c.source_digest,expected_issuer_ref:c.expected_issuer_ref,
expected_custody_ref:c.expected_custody_ref,
expected_owner_signer_ref:c.expected_owner_signer_ref,
expected_owner_receipt_ref:c.expected_owner_receipt_ref,
original_unresolved_exceptions:c.unresolved_exceptions,
unresolved_exceptions:distinct([...c.unresolved_exceptions,...(last?.conflicts||[])]),
responses:rows,latest_response:last,
independently_verified_issuer:false,conflict_closed:false,
owner_signature_authenticated:false,owner_trial_authorized:false};
});
const ids=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_598,build:598,source_build:597,as_of:asOf,cases,
open_cases:cases.length,
issuer_response_cases:cases.filter(c=>!c.owner_trial_decision_pending).length,
owner_witness_cases:cases.filter(c=>c.owner_trial_decision_pending).length,
conflict_cases:cases.filter(c=>c.unresolved_exceptions.some(x=>/DIGEST|CONFLICT|CUSTODY/.test(x))).length,
proposed_closures_pending_proof:cases.filter(c=>c.latest_response?.proposed_closure_only).length,
overdue_owner_cases:cases.filter(c=>c.owner_trial_decision_pending&&c.aging_bucket.startsWith('OVERDUE')).length,
stale_response_references:submitted.filter(r=>!ids.has(r.case_pin)),
independently_authenticated_issuer_responses:0,
independently_closed_conflicts:0,verified_owner_trial_signatures:0,
authorized_trials:0,provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_ORIGINAL_ISSUER_RESPONSE_AUTHENTICITY_CONFLICT_CLOSURE_AND_OWNER_WITNESS_UNVERIFIED'};
}
export function filterIssuerCases598(packet,kind='ALL',term=''){
if(packet?.format!==FORMAT_598||!FILTERS_598.includes(kind)||!safe(term,120))
throw Error('Invalid Build 598 evidence filter.');
const q=term.trim().toLowerCase();
return packet.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&!c.owner_trial_decision_pending)||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='DIGEST'&&c.unresolved_exceptions.some(x=>x.includes('DIGEST')))||
(kind==='WITNESS'&&c.unresolved_exceptions.some(x=>x.includes('WITNESS')||x.includes('REVIEWER')))||
(kind==='OVERDUE'&&c.owner_trial_decision_pending&&c.aging_bucket.startsWith('OVERDUE'))) &&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedOwnerWitnessReadiness598(packet,pin){
if(packet?.format!==FORMAT_598)throw Error('Source-pinned Build 598 packet required.');
const c=packet.cases.find(x=>x.case_pin===pin&&x.owner_trial_decision_pending);
if(!c)throw Error('Unresolved exact owner witness case required.');
const r=c.latest_response;
return {format:'devilndove-unsigned-owner-witness-readiness-598-v1',
source_build:597,build:598,source_pin:c.case_pin,prepared_at:packet.as_of,
exact_channel:c.channel,exact_account:c.account_id,exact_product:c.product_ref,
exact_action:c.exact_action,expected_original_signer:c.expected_owner_signer_ref,
expected_original_receipt:c.expected_owner_receipt_ref,
candidate_signer:r?.owner_signer_ref||null,candidate_receipt:r?.owner_signed_receipt_ref||null,
candidate_local_sha256:r?.owner_document_sha256||null,
proposed_reviewer:r?.independent_reviewer_ref||null,
proposed_independent_witness:r?.independent_witness_ref||null,
unresolved_exceptions:c.unresolved_exceptions,
authenticated_signature:false,independent_witness_verified:false,
exact_owner_trial_authorized:false,issuer_authenticated:false,
provider_read_or_write_authorized:false,status:'UNSIGNED_UNVERIFIED_OWNER_WITNESS_TRIAL_HOLD'};
}
function init598(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd598Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd598State'),output=get('dd598Output');
const local=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
const saved=()=>local(KEY_598,[]);
let active=null;
const refresh=()=>{
const raw=get('dd597Output')?.value;
if(!raw||raw.length>900000)throw Error('Recompute exact prior disposition.');
const packet=issuerResponseReview598(JSON.parse(raw),sourceContext597(doc,win),
local(KEY_597,[]),saved());
output.value=JSON.stringify(packet,null,2);
const choices=get('dd598Case'),previous=choices.value;choices.replaceChildren();
packet.cases.forEach(c=>{const opt=doc.createElement('option');opt.value=c.case_pin;
opt.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;choices.append(opt);});
if([...choices.options].some(o=>o.value===previous))choices.value=previous;
const c=packet.cases.find(x=>x.case_pin===choices.value);
const ex=get('dd598Exception'),old=ex.value;ex.replaceChildren();
(c?.unresolved_exceptions||[]).forEach(x=>{const opt=doc.createElement('option');opt.value=x;opt.textContent=x.replaceAll('_',' ');ex.append(opt);});
if([...ex.options].some(o=>o.value===old))ex.value=old;
if(c?.case_pin!==active){
active=c?.case_pin||null;
get('dd598Kind').value=c?.owner_trial_decision_pending?'OWNER_WITNESS_REVIEW':'ISSUER_RESPONSE_REVIEW';
for(const [id,val] of [['dd598Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd598Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd598Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=val;
}
const rows=get('dd598Rows');rows.replaceChildren();
filterIssuerCases598(packet,get('dd598Filter').value,get('dd598Search').value).forEach(c=>{
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+
' · '+c.unresolved_exceptions.length+' unresolved · '+c.aging_bucket;rows.append(li);});
status.textContent=packet.open_cases+' open independent issuer/owner cases · '+
packet.proposed_closures_pending_proof+' proposed closures still HOLD.';
return packet;
};
const guard=()=>{try{return refresh();}catch{status.textContent='Recompute exact source sections 5–22; trial HOLD.';return null;}};
get('dd598Refresh').addEventListener('click',guard);
get('dd598Filter').addEventListener('change',guard);
get('dd598Search').addEventListener('input',guard);
get('dd598Case').addEventListener('change',guard);
get('dd598Save').addEventListener('click',()=>{try{
if(!get('dd598Ack').checked)throw Error('HOLD acknowledgement required.');
const packet=refresh(),c=packet.cases.find(x=>x.case_pin===get('dd598Case').value);
if(!c)throw Error('Current case missing.');
const val=id=>get(id).value.trim();
const row=issuerResponseCandidate598({case_pin:c.case_pin,
exception_code:val('dd598Exception'),review_kind:val('dd598Kind'),
review_state:val('dd598Disposition'),issuer_response_ref:val('dd598Response'),
issuer_identity_ref:val('dd598Issuer'),reply_document_sha256:val('dd598ReplyDigest'),
custody_receipt_ref:val('dd598Custody'),original_attestation_ref:val('dd598Attestation'),
independent_reviewer_ref:val('dd598Reviewer'),independent_witness_ref:val('dd598Witness'),
owner_signer_ref:val('dd598Signer'),owner_signed_receipt_ref:val('dd598OwnerReceipt'),
owner_document_sha256:val('dd598OwnerDigest'),
owner_account:val('dd598Account'),owner_product:val('dd598Product'),
owner_action:val('dd598Scope'),reason:val('dd598Reason'),
recorded_at:new Date().toISOString(),next_review_at:new Date(val('dd598Due')).toISOString()});
issuerResponseReview598(JSON.parse(get('dd597Output').value),sourceContext597(doc,win),
local(KEY_597,[]),[...saved(),row]);
win.localStorage.setItem(KEY_598,JSON.stringify([...saved(),row]));
get('dd598Ack').checked=false;refresh();
}catch{status.textContent='Rejected: stale source, wrong scope, unsafe response or missing evidence. HOLD.';}});
const makePacket=()=>{const p=refresh();
get('dd598Packet').value=JSON.stringify(unsignedOwnerWitnessReadiness598(p,get('dd598Case').value),null,2);
status.textContent='Unsigned exact owner witness readiness prepared. Trial HOLD.';};
get('dd598Prepare').addEventListener('click',()=>{try{makePacket();}catch{status.textContent='Select an exact unresolved owner case; HOLD.';}});
const copy=async id=>{try{
if(id==='dd598Output')refresh();else makePacket();
const area=get(id);try{await win.navigator.clipboard.writeText(area.value);
status.textContent='Unverified review JSON copied; trial HOLD.';
}catch{area.focus();area.select();status.textContent='Select and copy the unverified packet manually.';}
}catch{status.textContent='Recompute and choose current source before copying. HOLD.';}};
get('dd598Copy').addEventListener('click',()=>copy('dd598Output'));
get('dd598CopyPacket').addEventListener('click',()=>copy('dd598Packet'));
}
if(typeof document!=='undefined')init598();


export const FORMAT_599='devilndove-issuer-receipt-conflict-witness-consent-599-v1';
export const KEY_599='dd:issuer-receipt-consent-preflight:599:v1';
export const METHODS_599=['PENDING','OFFICIAL_PROVIDER_PORTAL_CLAIM','OFFICIAL_SUPPORT_RECEIPT_CLAIM','SIGNED_ISSUER_ORIGINAL_CLAIM'];
export const STATES_599=['OPEN_UNVERIFIED','ISSUER_REPLY_PENDING','ISSUER_RECEIPT_CLAIM_RECORDED','CONFLICT_WITNESS_PENDING','OWNER_CONSENT_PENDING','OWNER_CONSENT_RECEIPT_CLAIM'];
export const ACTIONS_599=['REQUEST_ORIGINAL_ISSUER_RECEIPT','RECHECK_CUSTODY_AND_DIGEST','ESCALATE_INDEPENDENT_CONFLICT_WITNESS','REQUEST_EXACT_SIGNED_OWNER_CONSENT','RECONCILE_OWNER_SIGNER_AND_WITNESS'];
export const FILTERS_599=['ALL','ISSUER','OWNER','DIGEST','WITNESS','OVERDUE'];
const fields=['case_pin','exception_code','issuer_receipt_ref','issuer_identity_ref','authority_source_ref',
'receipt_sha256','custody_receipt_ref','response_correlation_ref','reviewer_ref','witness_ref',
'owner_signer_ref','owner_signed_receipt_ref','owner_signed_sha256','owner_account',
'owner_product','owner_action','reason'];
const secret=/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=]|private[_ -]?key)/i;
const safe599=(s,n=220)=>typeof s==='string'&&s.length<=n&&!secret.test(s);
const iso599=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const hash=x=>x===''||/^[a-f0-9]{64}$/.test(x);
const uniq=a=>[...new Set(a.filter(Boolean))];
const ownerAction=a=>ACTIONS_599.slice(3).includes(a);
export function receiptCandidate599(r){
const allowed=new Set([...fields,'source_method','state','next_action','received_at','recorded_at','next_review_at']);
if(!r||Array.isArray(r)||Object.keys(r).some(k=>!allowed.has(k))||
fields.some(f=>!safe599(r[f],f==='reason'?900:220))||
!r.case_pin.startsWith('dd596-case:')||r.exception_code.length<4||
!METHODS_599.includes(r.source_method)||!STATES_599.includes(r.state)||
!ACTIONS_599.includes(r.next_action)||!hash(r.receipt_sha256)||!hash(r.owner_signed_sha256)||
r.reason.trim().length<15||(r.received_at!==''&&!iso599(r.received_at))||
!iso599(r.recorded_at)||!iso599(r.next_review_at)||
Date.parse(r.next_review_at)<Date.parse(r.recorded_at)||
(r.received_at!==''&&Date.parse(r.received_at)>Date.parse(r.recorded_at)))
throw Error('Invalid unverified original issuer or exact owner receipt.');
return Object.fromEntries([...fields.map(f=>[f,r[f].trim()]),['source_method',r.source_method],
['state',r.state],['next_action',r.next_action],['received_at',r.received_at],
['recorded_at',r.recorded_at],['next_review_at',r.next_review_at]]);
}
export function receiptIntake599(exact598,source598,local598=[],submitted=[],asOf=new Date().toISOString()){
if(exact598?.format!==FORMAT_598||!Array.isArray(source598)||source598.length!==3||
!Array.isArray(local598)||!Array.isArray(submitted)||submitted.length>100||!iso599(asOf))
throw Error('Exact Build 598 source chain required.');
const reproduced=issuerResponseReview598(...source598,local598,exact598.as_of);
if(JSON.stringify(reproduced)!==JSON.stringify(exact598))
throw Error('Stale or forged Build 598 original issuer packet.');
const current=asOf===exact598.as_of?reproduced:issuerResponseReview598(...source598,local598,asOf);
const requests=submitted.map(receiptCandidate599);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const receipts=requests.filter(r=>r.case_pin===c.case_pin).map(r=>{
if(ownerAction(r.next_action)!==owner||
!c.unresolved_exceptions.includes(r.exception_code)||
(owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action))||
(!owner&&[r.owner_signer_ref,r.owner_signed_receipt_ref,r.owner_signed_sha256,
r.owner_account,r.owner_product,r.owner_action].some(Boolean)))
throw Error('Wrong unresolved issuer exception or exact owner scope.');
const prior=c.latest_response||{},conflicts=uniq([
r.issuer_identity_ref&&c.expected_issuer_ref&&r.issuer_identity_ref!==c.expected_issuer_ref?
'ISSUER_IDENTITY_CONFLICT':null,
r.receipt_sha256&&c.source_digest&&r.receipt_sha256!==c.source_digest?
'ISSUER_ORIGINAL_DIGEST_CONFLICT':null,
r.custody_receipt_ref&&c.expected_custody_ref&&r.custody_receipt_ref!==c.expected_custody_ref?
'CUSTODY_REFERENCE_CONFLICT':null,
r.response_correlation_ref&&prior.issuer_response_ref&&
r.response_correlation_ref!==prior.issuer_response_ref?'ISSUER_REPLY_CORRELATION_CONFLICT':null,
r.issuer_receipt_ref&&r.authority_source_ref&&r.issuer_receipt_ref===r.authority_source_ref?
'SELF_REFERENTIAL_ISSUER_AUTHORITY':null,
!r.authority_source_ref?'INDEPENDENT_ISSUER_AUTHORITY_NOT_VERIFIED':null,
!r.issuer_receipt_ref||!r.receipt_sha256?'ORIGINAL_RECEIPT_BYTES_NOT_VERIFIED':null,
!r.received_at?'ORIGINAL_RECEIPT_TIMESTAMP_MISSING':null,
!r.reviewer_ref?'INDEPENDENT_REVIEWER_MISSING':null,
!r.witness_ref?'INDEPENDENT_WITNESS_MISSING':null,
r.reviewer_ref&&r.witness_ref&&r.reviewer_ref===r.witness_ref?'REVIEWER_EQUALS_WITNESS':null,
r.issuer_identity_ref&&r.issuer_identity_ref===r.reviewer_ref?'ISSUER_EQUALS_REVIEWER':null,
r.issuer_identity_ref&&r.issuer_identity_ref===r.witness_ref?'ISSUER_EQUALS_WITNESS':null,
owner&&r.owner_signer_ref&&r.owner_signer_ref===r.witness_ref?'OWNER_EQUALS_WITNESS':null,
owner&&r.owner_signer_ref&&r.owner_signer_ref===r.reviewer_ref?'OWNER_EQUALS_REVIEWER':null,
owner&&c.expected_owner_signer_ref&&r.owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_REFERENCE_CONFLICT':null,
owner&&c.expected_owner_receipt_ref&&r.owner_signed_receipt_ref&&
r.owner_signed_receipt_ref!==c.expected_owner_receipt_ref?'OWNER_RECEIPT_REFERENCE_CONFLICT':null,
owner&&(!r.owner_signed_receipt_ref||!r.owner_signed_sha256)?
'SIGNED_EXACT_OWNER_CONSENT_UNVERIFIED':null
]);
return {...r,conflicts,open_exceptions:uniq([...c.unresolved_exceptions,...conflicts]),
local_digest_status:r.receipt_sha256&&c.source_digest?
(r.receipt_sha256===c.source_digest?'MATCHED_LOCAL_BYTES_ONLY':'DIGEST_MISMATCH_OPEN'):
'ORIGINAL_BYTES_UNVERIFIED',
issuer_independently_authenticated:false,conflict_independently_closed:false,
independent_witness_verified:false,owner_consent_authenticated:false,
provider_reads:0,provider_writes:0,d1_operations:0,trial_authorized:false};
});
const last=receipts.at(-1)||null;
return {case_pin:c.case_pin,channel:c.channel,account_id:c.account_id,
product_ref:c.product_ref,exact_action:c.exact_action,owner_trial_decision_pending:owner,
expected_issuer_ref:c.expected_issuer_ref,expected_custody_ref:c.expected_custody_ref,
expected_owner_signer_ref:c.expected_owner_signer_ref,
expected_owner_receipt_ref:c.expected_owner_receipt_ref,source_digest:c.source_digest,
priority:c.priority,aging_bucket:c.aging_bucket,
original_open_exceptions:c.unresolved_exceptions,
open_exceptions:uniq([...c.unresolved_exceptions,...(last?.conflicts||[])]),
receipts,latest_receipt:last,independent_issuer_authenticated:false,
conflict_closed:false,owner_consent_verified:false,trial_authorized:false};
});
const pins=new Set(cases.map(c=>c.case_pin)),used=new Map();
for(const c of cases)for(const r of c.receipts)if(r.issuer_receipt_ref){
const set=used.get(r.issuer_receipt_ref)||new Set();set.add(c.case_pin);used.set(r.issuer_receipt_ref,set);
}
for(const c of cases)if(c.latest_receipt?.issuer_receipt_ref&&
used.get(c.latest_receipt.issuer_receipt_ref).size>1)
c.open_exceptions=uniq([...c.open_exceptions,'ISSUER_RECEIPT_REUSED_ACROSS_CASES']);
return {format:FORMAT_599,build:599,source_build:598,as_of:asOf,cases,
open_cases:cases.length,issuer_cases:cases.filter(c=>!c.owner_trial_decision_pending).length,
owner_consent_cases:cases.filter(c=>c.owner_trial_decision_pending).length,
conflict_cases:cases.filter(c=>c.open_exceptions.some(x=>/DIGEST|CONFLICT|CUSTODY|REUSED/.test(x))).length,
overdue_owner_cases:cases.filter(c=>c.owner_trial_decision_pending&&c.aging_bucket.startsWith('OVERDUE')).length,
stale_unmatched_receipts:requests.filter(r=>!pins.has(r.case_pin)),
issuer_receipts_authenticated:0,independent_conflicts_closed:0,
signed_owner_consents_verified:0,approved_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_ISSUER_AUTHENTICITY_CONFLICT_CLOSURE_AND_EXACT_OWNER_CONSENT'};
}
export function filterReceipt599(packet,kind='ALL',term=''){
if(packet?.format!==FORMAT_599||!FILTERS_599.includes(kind)||!safe599(term,120))
throw Error('Invalid original receipt filter.');
const q=term.trim().toLowerCase();
return packet.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&!c.owner_trial_decision_pending)||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='DIGEST'&&c.open_exceptions.some(x=>x.includes('DIGEST')))||
(kind==='WITNESS'&&c.open_exceptions.some(x=>x.includes('WITNESS')||x.includes('REVIEWER')))||
(kind==='OVERDUE'&&c.owner_trial_decision_pending&&c.aging_bucket.startsWith('OVERDUE'))) &&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unresolvedWitnessPacket599(packet,pin){
if(packet?.format!==FORMAT_599)throw Error('Original source packet required.');
const c=packet.cases.find(x=>x.case_pin===pin);if(!c)throw Error('Current case required.');
const r=c.latest_receipt;
return {format:'devilndove-unresolved-conflict-witness-599-v1',build:599,source_build:598,
case_pin:c.case_pin,prepared_at:packet.as_of,channel:c.channel,
exact_account:c.account_id,exact_product:c.product_ref,exact_action:c.exact_action,
original_issuer_receipt:r?.issuer_receipt_ref||null,
issuer_document_sha256:r?.receipt_sha256||null,
proposed_external_authority:r?.authority_source_ref||null,
proposed_reviewer:r?.reviewer_ref||null,proposed_witness:r?.witness_ref||null,
unresolved_exceptions:c.open_exceptions,issuer_authenticated:false,
independent_witness_authenticated:false,exception_closed:false,
status:'UNVERIFIED_INDEPENDENT_CONFLICT_WITNESS_REQUIRED'};
}
export function exactConsentPreflight599(packet,pin){
if(packet?.format!==FORMAT_599)throw Error('Original owner source required.');
const c=packet.cases.find(x=>x.case_pin===pin&&x.owner_trial_decision_pending);
if(!c)throw Error('Exact pending owner case required.');
const r=c.latest_receipt;
return {format:'devilndove-exact-owner-consent-preflight-599-v1',build:599,source_build:598,
case_pin:c.case_pin,prepared_at:packet.as_of,exact_channel:c.channel,
exact_shop_account:c.account_id,exact_product_sku:c.product_ref,
exact_action:c.exact_action,expected_signer:c.expected_owner_signer_ref,
expected_receipt:c.expected_owner_receipt_ref,
proposed_signer:r?.owner_signer_ref||null,
proposed_signed_receipt:r?.owner_signed_receipt_ref||null,
proposed_signed_sha256:r?.owner_signed_sha256||null,
independent_reviewer:r?.reviewer_ref||null,independent_witness:r?.witness_ref||null,
unresolved_exceptions:c.open_exceptions,original_issuer_authenticated:false,
witness_authenticated:false,signed_owner_scope_verified:false,
consent_approved:false,trial_authorized:false,provider_write_authorized:false,
status:'UNSIGNED_UNVERIFIED_EXACT_OWNER_TRIAL_CONSENT_HOLD'};
}
function init599(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd599Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd599Status'),output=get('dd599Output');
const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
const stored=()=>read(KEY_599,[]);let selected=null;
const source=()=>{
const a=get('dd598Output')?.value,b=get('dd597Output')?.value;
if(!a||!b||a.length>900000||b.length>900000)throw Error('Refresh exact source sections 5-23.');
return [JSON.parse(a),[JSON.parse(b),sourceContext597(doc,win),read(KEY_597,[])],read(KEY_598,[])];
};
const refresh=()=>{
const p=receiptIntake599(...source(),stored());output.value=JSON.stringify(p,null,2);
const choices=get('dd599Case'),before=choices.value;choices.replaceChildren();
p.cases.forEach(c=>{const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;choices.append(o);});
if([...choices.options].some(o=>o.value===before))choices.value=before;
const c=p.cases.find(x=>x.case_pin===choices.value),ex=get('dd599Exception'),prev=ex.value;
ex.replaceChildren();(c?.open_exceptions||[]).forEach(x=>{const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');ex.append(o);});
if([...ex.options].some(o=>o.value===prev))ex.value=prev;
if(selected!==c?.case_pin){selected=c?.case_pin||null;
get('dd599Action').value=c?.owner_trial_decision_pending?
'REQUEST_EXACT_SIGNED_OWNER_CONSENT':'REQUEST_ORIGINAL_ISSUER_RECEIPT';
for(const [id,val] of [['dd599Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd599Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd599Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=val;
}
const list=get('dd599Rows');list.replaceChildren();
for(const c of filterReceipt599(p,get('dd599Filter').value,get('dd599Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+
' · '+c.open_exceptions.length+' open · '+c.aging_bucket;list.append(li);
}
status.textContent=p.open_cases+' source-pinned issuer/owner cases · '+
p.conflict_cases+' disputed conflicts · provider trial HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{status.textContent='Refresh exact source sections 5–23; trial HOLD.';return null;}};
for(const [id,event] of [['dd599Refresh','click'],['dd599Filter','change'],
['dd599Search','input'],['dd599Case','change']])
get(id).addEventListener(event,guard);
get('dd599Save').addEventListener('click',()=>{try{
if(!get('dd599Ack').checked)throw Error('Acknowledgement required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd599Case').value);
if(!c)throw Error('Source case missing.');
const val=id=>get(id).value.trim(),received=val('dd599Received');
const item=receiptCandidate599({case_pin:c.case_pin,
exception_code:val('dd599Exception'),source_method:val('dd599Method'),
state:val('dd599State'),next_action:val('dd599Action'),
issuer_receipt_ref:val('dd599Receipt'),issuer_identity_ref:val('dd599Issuer'),
authority_source_ref:val('dd599Authority'),receipt_sha256:val('dd599Digest'),
custody_receipt_ref:val('dd599Custody'),response_correlation_ref:val('dd599Correlation'),
reviewer_ref:val('dd599Reviewer'),witness_ref:val('dd599Witness'),
owner_signer_ref:val('dd599Signer'),owner_signed_receipt_ref:val('dd599OwnerReceipt'),
owner_signed_sha256:val('dd599OwnerDigest'),owner_account:val('dd599Account'),
owner_product:val('dd599Product'),owner_action:val('dd599Scope'),
reason:val('dd599Reason'),received_at:received?new Date(received).toISOString():'',
recorded_at:new Date().toISOString(),next_review_at:new Date(val('dd599Due')).toISOString()});
const next=[...stored(),item];receiptIntake599(...source(),next);
win.localStorage.setItem(KEY_599,JSON.stringify(next));
get('dd599Ack').checked=false;refresh();
}catch{status.textContent='Rejected: stale source, unsafe record or wrong exact consent. Trial HOLD.';}});
const make=kind=>{const p=refresh(),pin=get('dd599Case').value,
id=kind==='owner'?'dd599OwnerPacket':'dd599WitnessPacket';
get(id).value=JSON.stringify(kind==='owner'?exactConsentPreflight599(p,pin):
unresolvedWitnessPacket599(p,pin),null,2);
status.textContent='Unsigned unverified review packet prepared; HOLD.';return id;};
get('dd599PrepareWitness').addEventListener('click',()=>{try{make('witness');}catch{status.textContent='Choose current source case; HOLD.';}});
get('dd599PrepareOwner').addEventListener('click',()=>{try{make('owner');}catch{status.textContent='Choose exact owner case; HOLD.';}});
const copy=async kind=>{try{const id=kind==='queue'?'dd599Output':make(kind);
if(kind==='queue')refresh();
const area=get(id);try{await win.navigator.clipboard.writeText(area.value);
status.textContent='Unverified review packet copied; HOLD.';
}catch{area.focus();area.select();status.textContent='Select and copy the unverified packet manually.';}
}catch{status.textContent='Refresh current original-source packet first; HOLD.';}};
get('dd599Copy').addEventListener('click',()=>copy('queue'));
get('dd599CopyWitness').addEventListener('click',()=>copy('witness'));
get('dd599CopyOwner').addEventListener('click',()=>copy('owner'));
}
if(typeof document!=='undefined')init599();



export const FORMAT_600='devilndove-issuer-authenticity-decision-owner-readiness-600-v1';
export const KEY_600='dd:issuer-authenticity-decision-owner-readiness:600:v1';
export const STATES_600=['ISSUER_AUTHENTICITY_PENDING','ISSUER_SOURCE_DISPUTED',
'DIGEST_CUSTODY_RECHECK','INDEPENDENT_CONFLICT_WITNESS_PENDING',
'CONFLICT_CLOSURE_PROOF_PENDING','EXACT_OWNER_SIGNED_SCOPE_PENDING',
'EXACT_OWNER_SCOPE_DISPUTED','OWNER_AUTHORIZATION_ESCALATED'];
export const ACTIONS_600=['REQUEST_ORIGINAL_ISSUER_AUTHORITY',
'RECONCILE_SOURCE_DIGEST_AND_CUSTODY','ESCALATE_DISTINCT_CONFLICT_WITNESS',
'REQUEST_INDEPENDENT_CONFLICT_CLOSURE_PROOF',
'REQUEST_EXACT_OWNER_SIGNED_AUTHORIZATION','RECONCILE_OWNER_SIGNER_WITNESS',
'ESCALATE_EXACT_OWNER_AUTHORIZATION'];
export const FILTERS_600=['ALL','ISSUER','OWNER','CONFLICT','OVERDUE','NO_RECEIPT','WITNESS'];
const ownerAction600=a=>ACTIONS_600.slice(4).includes(a);
const safe600=(s,n=220)=>typeof s==='string'&&s.length<=n&&
!/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=]|private[_ -]?key)/i.test(s);
const iso600=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s));
const sha600=s=>s===''||/^[a-f0-9]{64}$/.test(s);
const uniq600=a=>[...new Set(a.filter(Boolean))];
const fields600=['case_pin','exception_code','decision_ref','issuer_authority_ref',
'original_issuer_ref','issuer_receipt_ref','receipt_sha256','custody_receipt_ref',
'reviewer_ref','witness_ref','owner_signer_ref','owner_signed_receipt_ref',
'owner_account','owner_product','owner_action','reason'];

export function decisionCandidate600(d){
const allowed=new Set([...fields600,'state','next_action','recorded_at','next_review_at']);
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.has(k))||
fields600.some(k=>!safe600(d[k],k==='reason'?900:220))||
!d.case_pin.startsWith('dd596-case:')||d.exception_code.length<4||
!STATES_600.includes(d.state)||!ACTIONS_600.includes(d.next_action)||
!sha600(d.receipt_sha256)||d.reason.trim().length<15||
!iso600(d.recorded_at)||!iso600(d.next_review_at)||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at))
throw Error('Unverified issuer or owner decision cannot assert approval.');
return Object.fromEntries([...fields600.map(k=>[k,d[k].trim()]),
['state',d.state],['next_action',d.next_action],
['recorded_at',d.recorded_at],['next_review_at',d.next_review_at],
['issuer_authenticated',false],['conflict_closed',false],
['owner_consent_authenticated',false],['trial_authorized',false]]);
}
export function aging600(due,asOf){
if(due!==''&&!iso600(due)||!iso600(asOf))throw Error('Invalid review clock.');
if(!due)return {bucket:'NO_REVIEW_DEADLINE',overdue_days:0};
const delta=Date.parse(asOf)-Date.parse(due);
return {bucket:delta<=-86400000?'ON_TRACK':delta<0?'DUE_WITHIN_24H':
delta<86400000?'OVERDUE_LT_1D':delta<4*86400000?'OVERDUE_1_3D':
delta<8*86400000?'OVERDUE_4_7D':'OVERDUE_8D_PLUS',
overdue_days:Math.max(0,Math.ceil(delta/86400000)),due_at:due};
}
export function decisionRegister600(exact599,source599,local599=[],rows=[],asOf=new Date().toISOString()){
if(exact599?.format!==FORMAT_599||!Array.isArray(source599)||source599.length!==3||
!Array.isArray(local599)||!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact Build 599 receipt chain required.');
const reproduced=receiptIntake599(...source599,local599,exact599.as_of);
if(JSON.stringify(reproduced)!==JSON.stringify(exact599))
throw Error('Stale or modified Build 599 original-source packet.');
const current=asOf===exact599.as_of?reproduced:receiptIntake599(...source599,local599,asOf);
const requested=rows.map(decisionCandidate600);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending,prior=c.latest_receipt||{};
const decisions=requested.filter(r=>r.case_pin===c.case_pin).map(r=>{
if(ownerAction600(r.next_action)!==owner||!c.open_exceptions.includes(r.exception_code)||
(owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action))||
(!owner&&[r.owner_signer_ref,r.owner_signed_receipt_ref,r.owner_account,
r.owner_product,r.owner_action].some(Boolean)))
throw Error('Wrong original issuer exception or exact owner trial scope.');
const conflicts=uniq600([
r.issuer_authority_ref&&r.decision_ref&&r.issuer_authority_ref===r.decision_ref?
'SELF_REFERENTIAL_ISSUER_DECISION':null,
r.issuer_authority_ref&&r.issuer_receipt_ref&&r.issuer_authority_ref===r.issuer_receipt_ref?
'ISSUER_AUTHORITY_NOT_INDEPENDENT_OF_RECEIPT':null,
r.original_issuer_ref&&c.expected_issuer_ref&&r.original_issuer_ref!==c.expected_issuer_ref?
'ISSUER_IDENTITY_SUBSTITUTION_CONFLICT':null,
r.issuer_receipt_ref&&prior.issuer_receipt_ref&&r.issuer_receipt_ref!==prior.issuer_receipt_ref?
'ORIGINAL_RECEIPT_SUBSTITUTION':null,
r.receipt_sha256&&c.source_digest&&r.receipt_sha256!==c.source_digest?
'SOURCE_DIGEST_DISPUTE_OPEN':null,
r.custody_receipt_ref&&c.expected_custody_ref&&r.custody_receipt_ref!==c.expected_custody_ref?
'CUSTODY_RECEIPT_CONFLICT':null,
r.reviewer_ref&&r.witness_ref&&r.reviewer_ref===r.witness_ref?
'REVIEWER_EQUALS_WITNESS':null,
r.original_issuer_ref&&r.reviewer_ref&&r.original_issuer_ref===r.reviewer_ref?
'ISSUER_EQUALS_REVIEWER':null,
r.original_issuer_ref&&r.witness_ref&&r.original_issuer_ref===r.witness_ref?
'ISSUER_EQUALS_WITNESS':null,
owner&&r.owner_signer_ref&&r.owner_signer_ref===r.reviewer_ref?
'OWNER_SIGNER_EQUALS_REVIEWER':null,
owner&&r.owner_signer_ref&&r.owner_signer_ref===r.witness_ref?
'OWNER_SIGNER_EQUALS_WITNESS':null,
owner&&r.owner_signer_ref&&c.expected_owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_CONFLICT':null,
owner&&r.owner_signed_receipt_ref&&c.expected_owner_receipt_ref&&
r.owner_signed_receipt_ref!==c.expected_owner_receipt_ref?
'OWNER_SIGNED_RECEIPT_CONFLICT':null,
!r.issuer_authority_ref?'EXTERNAL_ISSUER_AUTHORITY_UNVERIFIED':null,
!r.reviewer_ref?'INDEPENDENT_REVIEWER_MISSING':null,
!r.witness_ref?'SEPARATE_WITNESS_MISSING':null,
owner&&(!r.owner_signer_ref||!r.owner_signed_receipt_ref)?
'EXACT_OWNER_SIGNED_SCOPE_UNVERIFIED':null
]);
return {...r,conflicts,unresolved_exceptions:uniq600([...c.open_exceptions,...conflicts]),
issuer_authenticated:false,independent_conflict_closed:false,
owner_consent_authenticated:false,provider_reads:0,provider_writes:0,
d1_operations:0,trial_authorized:false};
});
const latest=decisions.at(-1)||null;
const aging=aging600(latest?.next_review_at||prior.next_review_at||'',asOf);
const unresolved=uniq600([...c.open_exceptions,...(latest?.conflicts||[])]);
const blockers=uniq600([
!prior.issuer_receipt_ref?'ORIGINAL_ISSUER_RECEIPT_MISSING':null,
!latest?.issuer_authority_ref?'EXTERNAL_ISSUER_AUTHORITY_UNVERIFIED':null,
!latest?.reviewer_ref?'INDEPENDENT_REVIEWER_MISSING':null,
!latest?.witness_ref?'SEPARATE_WITNESS_MISSING':null,
owner&&!latest?.owner_signed_receipt_ref?'EXACT_OWNER_SIGNED_RECEIPT_UNVERIFIED':null,
...unresolved
]);
return {case_pin:c.case_pin,channel:c.channel,account_id:c.account_id,
product_ref:c.product_ref,exact_action:c.exact_action,priority:c.priority,
owner_trial_decision_pending:owner,expected_issuer_ref:c.expected_issuer_ref,
expected_custody_ref:c.expected_custody_ref,expected_owner_signer_ref:c.expected_owner_signer_ref,
expected_owner_receipt_ref:c.expected_owner_receipt_ref,source_digest:c.source_digest,
prior_receipt:prior,decisions,latest_decision:latest,aging,
open_exceptions:unresolved,readiness_blockers:blockers,
original_issuer_authenticated:false,conflict_closed:false,
exact_owner_consent_verified:false,trial_authorized:false,
readiness_status:'HOLD_ORIGINAL_AUTHORITY_CONFLICT_CLOSURE_AND_SIGNED_OWNER_SCOPE'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_600,build:600,source_build:599,as_of:asOf,cases,
open_cases:cases.length,issuer_cases:cases.filter(c=>!c.owner_trial_decision_pending).length,
owner_cases:cases.filter(c=>c.owner_trial_decision_pending).length,
overdue_cases:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
overdue_owner_cases:cases.filter(c=>c.owner_trial_decision_pending&&c.aging.bucket.startsWith('OVERDUE')).length,
conflict_cases:cases.filter(c=>c.open_exceptions.some(x=>/CONFLICT|DIGEST|CUSTODY|DISPUTE|REUSED/.test(x))).length,
witness_gaps:cases.filter(c=>c.readiness_blockers.some(x=>/WITNESS|REVIEWER/.test(x))).length,
missing_issuer_receipts:cases.filter(c=>!c.prior_receipt.issuer_receipt_ref).length,
stale_unmatched_decisions:requested.filter(r=>!pins.has(r.case_pin)),
issuer_decisions_authenticated:0,independent_conflicts_closed:0,
exact_owner_signatures_verified:0,authorized_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_INDEPENDENT_ISSUER_DECISION_CONFLICT_CLOSURE_AND_EXACT_OWNER_AUTHORIZATION'};
}
export function filterDecision600(packet,kind='ALL',term=''){
if(packet?.format!==FORMAT_600||!FILTERS_600.includes(kind)||!safe600(term,120))
throw Error('Invalid decision dashboard filter.');
const q=term.trim().toLowerCase();
return packet.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&!c.owner_trial_decision_pending)||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='CONFLICT'&&c.open_exceptions.some(x=>/CONFLICT|DIGEST|CUSTODY|DISPUTE|REUSED/.test(x)))||
(kind==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='NO_RECEIPT'&&!c.prior_receipt.issuer_receipt_ref)||
(kind==='WITNESS'&&c.readiness_blockers.some(x=>/WITNESS|REVIEWER/.test(x)))) &&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedOwnerReadiness600(packet,pin){
if(packet?.format!==FORMAT_600)throw Error('Exact Build 600 decision register required.');
const c=packet.cases.find(c=>c.case_pin===pin&&c.owner_trial_decision_pending);
if(!c)throw Error('Exact pending owner case required.');
const d=c.latest_decision||{};
return {format:'devilndove-unsigned-owner-authorization-readiness-600-v1',
build:600,source_build:599,case_pin:c.case_pin,prepared_at:packet.as_of,
exact_channel:c.channel,exact_shop_account:c.account_id,
exact_product_sku:c.product_ref,exact_action:c.exact_action,
expected_signer:c.expected_owner_signer_ref,
expected_signed_receipt:c.expected_owner_receipt_ref,
proposed_signer:d.owner_signer_ref||null,proposed_signed_receipt:d.owner_signed_receipt_ref||null,
reviewer:d.reviewer_ref||null,separate_witness:d.witness_ref||null,
aging_bucket:c.aging.bucket,unresolved_exceptions:c.open_exceptions,
readiness_blockers:c.readiness_blockers,issuer_authenticated:false,
conflict_closed:false,owner_signature_authenticated:false,
trial_authorized:false,provider_read_or_write_authorized:false,
status:'UNSIGNED_UNVERIFIED_EXACT_OWNER_CONSENT_TRIAL_HOLD'};
}
function init600(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd600Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd600Status'),output=get('dd600Output');
const read=(key,fallback)=>{const x=win.localStorage.getItem(key);return x?JSON.parse(x):fallback;};
const stored=()=>read(KEY_600,[]);
let previousPin=null;
const source=()=>{
const a=get('dd599Output')?.value,b=get('dd598Output')?.value,c=get('dd597Output')?.value;
if(!a||!b||!c||[a,b,c].some(x=>x.length>900000))
throw Error('Recompute original source sections 5–24.');
return [JSON.parse(a),[JSON.parse(b),[JSON.parse(c),sourceContext597(doc,win),
read(KEY_597,[])],read(KEY_598,[])],read(KEY_599,[])];
};
const refresh=()=>{
const p=decisionRegister600(...source(),stored());
output.value=JSON.stringify(p,null,2);
get('dd600Metrics').textContent=p.open_cases+' open · '+p.overdue_cases+
' overdue · '+p.conflict_cases+' disputes · '+p.owner_cases+' owner decisions · trial HOLD';
const choices=get('dd600Case'),prior=choices.value;choices.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;choices.append(o);}
if([...choices.options].some(x=>x.value===prior))choices.value=prior;
const c=p.cases.find(x=>x.case_pin===choices.value),ex=get('dd600Exception'),priorEx=ex.value;
ex.replaceChildren();
for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');o.value=x;
o.textContent=x.replaceAll('_',' ');ex.append(o);}
if([...ex.options].some(x=>x.value===priorEx))ex.value=priorEx;
if(previousPin!==c?.case_pin){
previousPin=c?.case_pin||null;
get('dd600Action').value=c?.owner_trial_decision_pending?
'REQUEST_EXACT_OWNER_SIGNED_AUTHORIZATION':'REQUEST_ORIGINAL_ISSUER_AUTHORITY';
get('dd600State').value=c?.owner_trial_decision_pending?
'EXACT_OWNER_SIGNED_SCOPE_PENDING':'ISSUER_AUTHENTICITY_PENDING';
for(const [id,v] of [['dd600Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd600Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd600Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=v;
}
const rows=get('dd600Rows');rows.replaceChildren();
for(const c of filterDecision600(p,get('dd600Filter').value,get('dd600Search').value)){
const li=doc.createElement('li');
li.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+' · '+c.aging.bucket+
' · '+c.readiness_blockers.length+' unresolved readiness blockers';rows.append(li);
}
status.textContent='Independent decision register updated. No issuer authentication or trial consent.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Refresh original source sections 5–24 first; authorization HOLD.';return null;}};
for(const [id,event] of [['dd600Refresh','click'],['dd600Filter','change'],
['dd600Search','input'],['dd600Case','change']])get(id).addEventListener(event,guard);
get('dd600Save').addEventListener('click',()=>{try{
if(!get('dd600Ack').checked)throw Error('Acknowledge HOLD.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd600Case').value);
if(!c)throw Error('No source case.');
const v=id=>get(id).value.trim();
const row=decisionCandidate600({case_pin:c.case_pin,exception_code:v('dd600Exception'),
state:v('dd600State'),next_action:v('dd600Action'),decision_ref:v('dd600DecisionRef'),
issuer_authority_ref:v('dd600Authority'),original_issuer_ref:v('dd600Issuer'),
issuer_receipt_ref:v('dd600Receipt'),receipt_sha256:v('dd600Digest'),
custody_receipt_ref:v('dd600Custody'),reviewer_ref:v('dd600Reviewer'),
witness_ref:v('dd600Witness'),owner_signer_ref:v('dd600Signer'),
owner_signed_receipt_ref:v('dd600OwnerReceipt'),
owner_account:v('dd600Account'),owner_product:v('dd600Product'),
owner_action:v('dd600Scope'),reason:v('dd600Reason'),
recorded_at:new Date().toISOString(),
next_review_at:new Date(v('dd600Due')).toISOString()});
const next=[...stored(),row];decisionRegister600(...source(),next);
win.localStorage.setItem(KEY_600,JSON.stringify(next));
get('dd600Ack').checked=false;refresh();
}catch{status.textContent='Rejected: stale source, wrong scope or unsafe decision. Trial HOLD.';}});
const make=()=>{const p=refresh();
get('dd600OwnerPacket').value=JSON.stringify(unsignedOwnerReadiness600(p,get('dd600Case').value),null,2);
status.textContent='Unsigned exact owner readiness prepared; HOLD.';};
get('dd600Prepare').addEventListener('click',()=>{try{make();}catch{
status.textContent='Select a current owner case. Trial HOLD.';}});
const copy=async(kind)=>{try{
if(kind==='owner')make();else refresh();
const el=get(kind==='owner'?'dd600OwnerPacket':'dd600Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unverified documentary evidence copied; HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy the document manually.';}
}catch{status.textContent='Refresh exact current source before copying. HOLD.';}};
get('dd600Copy').addEventListener('click',()=>copy('queue'));
get('dd600CopyOwner').addEventListener('click',()=>copy('owner'));
}
if(typeof document!=='undefined')init600();


export const FORMAT_601='devilndove-issuer-decision-conflict-escalation-owner-handoff-601-v1';
export const KEY_601='dd:issuer-conflict-owner-handoff:601:v1';
export const STATES_601=['ISSUER_DECISION_EVIDENCE_AWAITED','ISSUER_DECISION_DISPUTED',
'CONFLICT_INDEPENDENT_REVIEW_ESCALATED','EXTERNAL_CLOSURE_PROOF_AWAITED',
'OWNER_SIGNED_SCOPE_AWAITED','OWNER_SCOPE_DISPUTED','OWNER_AUTHORIZATION_HANDOFF_PENDING'];
export const ACTIONS_601=['REQUEST_AUTHENTIC_ORIGINAL_ISSUER_DECISION',
'ESCALATE_DIGEST_CUSTODY_CONFLICT','REQUEST_DISTINCT_CONFLICT_CLOSURE_WITNESS',
'REQUEST_EXACT_OWNER_SIGNED_SCOPE','ESCALATE_OWNER_SIGNER_OR_SCOPE_CONFLICT',
'HANDOFF_UNSIGNED_OWNER_AUTHORIZATION_REVIEW'];
export const FILTERS_601=['ALL','ISSUER','OWNER','CONFLICT','OVERDUE','NO_WITNESS','STALE'];
const FIELDS_601=['case_pin','exception_code','issuer_decision_ref','issuer_identity_ref',
'external_authority_ref','original_digest','custody_receipt_ref','closure_evidence_ref',
'reviewer_ref','witness_ref','owner_signer_ref','owner_signed_receipt_ref',
'owner_account','owner_product','owner_action','reason'];
const ownerAction601=a=>ACTIONS_601.slice(3).includes(a);
export function escalationCandidate601(d){
const allowed=new Set([...FIELDS_601,'state','next_action','recorded_at','next_review_at']);
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.has(k))||
FIELDS_601.some(k=>!safe600(d[k],k==='reason'?900:220))||
!d.case_pin.startsWith('dd596-case:')||d.exception_code.length<4||
!STATES_601.includes(d.state)||!ACTIONS_601.includes(d.next_action)||
!sha600(d.original_digest)||d.reason.trim().length<15||
!iso600(d.recorded_at)||!iso600(d.next_review_at)||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at))
throw Error('Unverified escalation cannot close a conflict or authorize a trial.');
return Object.fromEntries([...FIELDS_601.map(k=>[k,d[k].trim()]),
['state',d.state],['next_action',d.next_action],
['recorded_at',d.recorded_at],['next_review_at',d.next_review_at],
['issuer_authenticated',false],['independent_closure_verified',false],
['owner_signature_verified',false],['trial_authorized',false]]);
}
export function reconcileEscalations601(exact600,source600,local600=[],rows=[],asOf=new Date().toISOString()){
if(exact600?.format!==FORMAT_600||!Array.isArray(source600)||source600.length!==3||
!Array.isArray(local600)||!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact Build 600 original-source decision packet required.');
const reproduced=decisionRegister600(...source600,local600,exact600.as_of);
if(JSON.stringify(reproduced)!==JSON.stringify(exact600))
throw Error('Stale, substituted or modified Build 600 decision register.');
const current=asOf===exact600.as_of?reproduced:decisionRegister600(...source600,local600,asOf);
const submitted=rows.map(escalationCandidate601);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const escalations=submitted.filter(r=>r.case_pin===c.case_pin).map(r=>{
if(ownerAction601(r.next_action)!==owner||
(owner? !STATES_601.slice(4).includes(r.state):STATES_601.slice(4).includes(r.state))||
!c.open_exceptions.includes(r.exception_code)||
(owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action))||
(!owner&&[r.owner_signer_ref,r.owner_signed_receipt_ref,r.owner_account,
r.owner_product,r.owner_action].some(Boolean)))
throw Error('Wrong unresolved issuer exception, escalation action or exact owner scope.');
const prior=c.latest_decision||{};
const conflicts=uniq600([
r.issuer_identity_ref&&c.expected_issuer_ref&&r.issuer_identity_ref!==c.expected_issuer_ref?
'ORIGINAL_ISSUER_IDENTITY_MISMATCH':null,
r.original_digest&&c.source_digest&&r.original_digest!==c.source_digest?
'ORIGINAL_DIGEST_MISMATCH':null,
r.custody_receipt_ref&&c.expected_custody_ref&&r.custody_receipt_ref!==c.expected_custody_ref?
'ORIGINAL_CUSTODY_MISMATCH':null,
r.issuer_decision_ref&&prior.decision_ref&&r.issuer_decision_ref!==prior.decision_ref?
'ISSUER_DECISION_REFERENCE_CHANGED':null,
r.external_authority_ref&&r.external_authority_ref===r.issuer_decision_ref?
'SELF_ATTESTED_ISSUER_AUTHORITY':null,
r.closure_evidence_ref&&r.closure_evidence_ref===r.issuer_decision_ref?
'CLOSURE_REUSES_DISPUTED_ISSUER_DECISION':null,
r.reviewer_ref&&r.reviewer_ref===r.witness_ref?'REVIEWER_EQUALS_WITNESS':null,
r.issuer_identity_ref&&[r.reviewer_ref,r.witness_ref].includes(r.issuer_identity_ref)?
'ISSUER_EQUALS_INDEPENDENT_REVIEWER_OR_WITNESS':null,
owner&&r.owner_signer_ref&&[r.reviewer_ref,r.witness_ref].includes(r.owner_signer_ref)?
'OWNER_SIGNER_NOT_INDEPENDENT':null,
owner&&r.owner_signer_ref&&c.expected_owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_MISMATCH':null,
owner&&r.owner_signed_receipt_ref&&c.expected_owner_receipt_ref&&
r.owner_signed_receipt_ref!==c.expected_owner_receipt_ref?'OWNER_RECEIPT_MISMATCH':null,
!r.external_authority_ref?'INDEPENDENT_ISSUER_AUTHORITY_NOT_DOCUMENTED':null,
!r.closure_evidence_ref?'EXTERNAL_CONFLICT_CLOSURE_PROOF_MISSING':null,
!r.reviewer_ref?'INDEPENDENT_REVIEWER_MISSING':null,
!r.witness_ref?'INDEPENDENT_WITNESS_MISSING':null,
owner&&(!r.owner_signer_ref||!r.owner_signed_receipt_ref)?
'EXACT_OWNER_SIGNED_SCOPE_NOT_DOCUMENTED':null
]);
return {...r,conflicts,
digest_comparison:r.original_digest&&c.source_digest?
(r.original_digest===c.source_digest?'LOCAL_DIGEST_MATCH_NOT_AUTHENTICATED':'DIGEST_CONFLICT_OPEN'):
'ORIGINAL_DIGEST_NOT_DOCUMENTED',
issuer_authenticated:false,independent_conflict_closed:false,
owner_signature_authenticated:false,provider_reads:0,provider_writes:0,
d1_operations:0,trial_authorized:false};
});
const latest=escalations.at(-1)||null;
const aging=aging600(latest?.next_review_at||c.latest_decision?.next_review_at||'',asOf);
const blockers=uniq600([...c.readiness_blockers,...c.open_exceptions,
...(latest?.conflicts||[]),
!latest?'NO_BUILD_601_ESCALATION_RECORDED':null,
!latest?.issuer_decision_ref?'ORIGINAL_ISSUER_DECISION_PROOF_AWAITED':null,
!latest?.closure_evidence_ref?'INDEPENDENT_CONFLICT_CLOSURE_AWAITED':null,
owner&&!latest?.owner_signed_receipt_ref?'EXACT_SIGNED_OWNER_AUTHORIZATION_AWAITED':null]);
return {...c,escalations,latest_escalation:latest,aging,readiness_blockers:blockers,
original_issuer_authenticated:false,independent_conflict_closed:false,
exact_owner_signature_verified:false,trial_authorized:false,
status:'HOLD_UNVERIFIED_EXTERNAL_EVIDENCE_AND_OWNER_AUTHORIZATION'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_601,build:601,source_build:600,as_of:asOf,cases,
open_cases:cases.length,issuer_escalations:cases.filter(c=>!c.owner_trial_decision_pending).length,
owner_handoffs:cases.filter(c=>c.owner_trial_decision_pending).length,
conflict_escalations:cases.filter(c=>c.readiness_blockers.some(x=>/CONFLICT|DIGEST|CUSTODY|DISPUTE|MISMATCH/.test(x))).length,
overdue_cases:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
stale_unmatched_escalations:submitted.filter(r=>!pins.has(r.case_pin)),
issuer_decisions_authenticated:0,independent_conflicts_closed:0,
owner_signatures_verified:0,authorized_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_ORIGINAL_ISSUER_AUTHENTICITY_INDEPENDENT_CLOSURE_AND_EXACT_OWNER_PERMISSION'};
}
export function filterEscalations601(p,kind='ALL',term=''){
if(p?.format!==FORMAT_601||!FILTERS_601.includes(kind)||!safe600(term,120))
throw Error('Invalid source-pinned escalation filter.');
const q=term.trim().toLowerCase();
return p.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&!c.owner_trial_decision_pending)||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='CONFLICT'&&c.readiness_blockers.some(x=>/CONFLICT|DIGEST|CUSTODY|DISPUTE|MISMATCH/.test(x)))||
(kind==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='NO_WITNESS'&&c.readiness_blockers.some(x=>/WITNESS|REVIEWER/.test(x)))||
(kind==='STALE'&&!c.latest_escalation))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedHandoff601(p,pin){
if(p?.format!==FORMAT_601)throw Error('Exact source-pinned Build 601 packet required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Exact unresolved issuer or owner case required.');
const owner=c.owner_trial_decision_pending,r=c.latest_escalation||{};
return {format:owner?'devilndove-unsigned-owner-handoff-601-v1':
'devilndove-unverified-issuer-conflict-escalation-601-v1',
build:601,source_build:600,case_pin:c.case_pin,prepared_at:p.as_of,
kind:owner?'EXACT_OWNER_AUTHORIZATION_HANDOFF':'INDEPENDENT_ISSUER_CONFLICT_ESCALATION',
exact_channel:c.channel,exact_shop_account:c.account_id,
exact_product_sku:c.product_ref,exact_action:c.exact_action,
original_source_digest:c.source_digest,
expected_issuer:c.expected_issuer_ref,expected_custody:c.expected_custody_ref,
expected_owner_signer:owner?c.expected_owner_signer_ref:null,
proposed_owner_signer:owner?r.owner_signer_ref||null:null,
proposed_owner_receipt:owner?r.owner_signed_receipt_ref||null:null,
proposed_review_ref:r.reviewer_ref||null,proposed_witness_ref:r.witness_ref||null,
escalation_action:r.next_action||null,aging_bucket:c.aging.bucket,
independent_external_checks_required:owner?[
'Authenticate original issuer decision and custody',
'Independently resolve every conflict with a distinct witness',
'Verify original owner signature for this exact account, Product and action',
'Obtain separate, explicit owner trial authorization']:[
'Authenticate original issuer via an independently trusted source',
'Reconcile original source digest and custody',
'Verify conflict closure with separate reviewer and witness'],
unresolved_exceptions:c.open_exceptions,readiness_blockers:c.readiness_blockers,
issuer_authenticated:false,conflict_closed:false,owner_signature_verified:false,
owner_authorization_granted:false,trial_authorized:false,
provider_read_or_write_authorized:false,status:'UNSIGNED_UNVERIFIED_EXTERNAL_HANDOFF_HOLD'};
}
function init601(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd601Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd601Status'),output=get('dd601Output');
const read=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
const stored=()=>read(KEY_601,[]);
let previousPin=null;
const source=()=>{
const ids=['dd600Output','dd599Output','dd598Output','dd597Output'];
const v=ids.map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute exact source sections 5–25.');
return [JSON.parse(v[0]),[JSON.parse(v[1]),
[JSON.parse(v[2]),[JSON.parse(v[3]),sourceContext597(doc,win),read(KEY_597,[])],
read(KEY_598,[])],read(KEY_599,[])],read(KEY_600,[])];
};
const refresh=()=>{
const p=reconcileEscalations601(...source(),stored());output.value=JSON.stringify(p,null,2);
get('dd601Metrics').textContent=p.open_cases+' open · '+p.conflict_escalations+
' conflict escalations · '+p.overdue_cases+' overdue · '+p.owner_handoffs+' owner handoffs · HOLD';
const choices=get('dd601Case'),prior=choices.value;choices.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;choices.append(o);}
if([...choices.options].some(o=>o.value===prior))choices.value=prior;
const c=p.cases.find(x=>x.case_pin===choices.value),ex=get('dd601Exception'),prevEx=ex.value;
ex.replaceChildren();for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');ex.append(o);}
if([...ex.options].some(o=>o.value===prevEx))ex.value=prevEx;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd601State').value=c?.owner_trial_decision_pending?'OWNER_SIGNED_SCOPE_AWAITED':'ISSUER_DECISION_EVIDENCE_AWAITED';
get('dd601Action').value=c?.owner_trial_decision_pending?'REQUEST_EXACT_OWNER_SIGNED_SCOPE':
'REQUEST_AUTHENTIC_ORIGINAL_ISSUER_DECISION';
for(const [id,v] of [['dd601Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd601Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd601Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=v;
}
const list=get('dd601Rows');list.replaceChildren();
for(const c of filterEscalations601(p,get('dd601Filter').value,get('dd601Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+
' · '+c.aging.bucket+' · '+c.readiness_blockers.length+' blockers · '+
(c.latest_escalation?'follow-up recorded':'escalation pending');list.append(li);
}
status.textContent='Source-pinned unresolved escalation queue. External proof and owner authorization HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact original source sections 5–25; trial HOLD.';return null;}};
for(const [id,event] of [['dd601Refresh','click'],['dd601Filter','change'],
['dd601Search','input'],['dd601Case','change']])get(id).addEventListener(event,guard);
get('dd601Save').addEventListener('click',()=>{try{
if(!get('dd601Ack').checked)throw Error('Explicit HOLD acknowledgment required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd601Case').value);
if(!c)throw Error('No current unresolved case.');
const v=id=>get(id).value.trim();
const row=escalationCandidate601({case_pin:c.case_pin,exception_code:v('dd601Exception'),
state:v('dd601State'),next_action:v('dd601Action'),issuer_decision_ref:v('dd601Decision'),
issuer_identity_ref:v('dd601Issuer'),external_authority_ref:v('dd601Authority'),
original_digest:v('dd601Digest'),custody_receipt_ref:v('dd601Custody'),
closure_evidence_ref:v('dd601Closure'),reviewer_ref:v('dd601Reviewer'),
witness_ref:v('dd601Witness'),owner_signer_ref:v('dd601Signer'),
owner_signed_receipt_ref:v('dd601OwnerReceipt'),owner_account:v('dd601Account'),
owner_product:v('dd601Product'),owner_action:v('dd601Scope'),reason:v('dd601Reason'),
recorded_at:new Date().toISOString(),next_review_at:new Date(v('dd601Due')).toISOString()});
const next=[...stored(),row];reconcileEscalations601(...source(),next);
win.localStorage.setItem(KEY_601,JSON.stringify(next));get('dd601Ack').checked=false;refresh();
}catch{status.textContent='Rejected: changed source, wrong scope or unverified escalation. HOLD.';}});
const prepare=()=>{const p=refresh();
get('dd601Handoff').value=JSON.stringify(unsignedHandoff601(p,get('dd601Case').value),null,2);
status.textContent='Unsigned issuer/owner handoff prepared; no authorization granted.';};
get('dd601Prepare').addEventListener('click',()=>{try{prepare();}catch{
status.textContent='Select a current unresolved case. HOLD.';}});
const copy=async(kind)=>{try{
if(kind==='handoff')prepare();else refresh();
const el=get(kind==='handoff'?'dd601Handoff':'dd601Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unverified source-pinned JSON copied; HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually; HOLD.';}
}catch{status.textContent='Recompute the exact source first; HOLD.';}};
get('dd601Copy').addEventListener('click',()=>copy('queue'));
get('dd601CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init601();


export const FORMAT_602='devilndove-external-issuer-witness-owner-recheck-602-v1';
export const KEY_602='dd:external-issuer-witness-owner-recheck:602:v1';
export const TYPES_602=['ORIGINAL_ISSUER_EVIDENCE','INDEPENDENT_CONFLICT_WITNESS',
'EXACT_OWNER_SIGNED_SCOPE'];
export const METHODS_602=['NOT_OBTAINED','OFFICIAL_PROVIDER_PORTAL_CLAIM',
'OFFICIAL_SUPPORT_RECEIPT_CLAIM','SIGNED_ORIGINAL_CLAIM','LOCAL_FILE_SHA256_ONLY'];
export const ACTIONS_602=['REQUEST_ORIGINAL_ISSUER_DECISION','RECHECK_ORIGINAL_CUSTODY_DIGEST',
'ESCALATE_SEPARATE_CONFLICT_WITNESS','REQUEST_EXACT_OWNER_SIGNED_RECEIPT',
'RECHECK_OWNER_SIGNATURE_SCOPE','ESCALATE_OWNER_AUTHORIZATION_EXCEPTION'];
export const FILTERS_602=['ALL','ISSUER','WITNESS','OWNER','DIGEST','OVERDUE','MISSING_PROOF'];
const FIELDS_602=['case_pin','exception_code','original_artifact_ref','issuer_identity_ref',
'authority_locator_ref','original_document_sha256','custody_receipt_ref',
'issuer_decision_ref','closure_decision_ref','reviewer_ref','witness_ref',
'witness_attestation_ref','owner_signer_ref','owner_signed_receipt_ref',
'owner_account','owner_product','owner_action','reason'];
const ownerAction602=a=>ACTIONS_602.slice(3).includes(a);
export function evidenceCandidate602(d){
const allowed=new Set([...FIELDS_602,'evidence_type','source_method','next_action',
'observed_at','witness_attested_at','recorded_at','next_review_at']);
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.has(k))||
FIELDS_602.some(k=>!safe600(d[k],k==='reason'?900:220))||
!d.case_pin.startsWith('dd596-case:')||d.exception_code.length<4||
!TYPES_602.includes(d.evidence_type)||!METHODS_602.includes(d.source_method)||
!ACTIONS_602.includes(d.next_action)||!sha600(d.original_document_sha256)||
d.reason.trim().length<15||!iso600(d.recorded_at)||!iso600(d.next_review_at)||
(d.observed_at!==''&&!iso600(d.observed_at))||
(d.witness_attested_at!==''&&!iso600(d.witness_attested_at))||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at)||
(d.observed_at!==''&&Date.parse(d.observed_at)>Date.parse(d.recorded_at))||
(d.witness_attested_at!==''&&
(Date.parse(d.witness_attested_at)>Date.parse(d.recorded_at)||
(d.observed_at!==''&&Date.parse(d.witness_attested_at)<Date.parse(d.observed_at)))))
throw Error('Unverified original evidence or witness note cannot grant authorization.');
return Object.fromEntries([...FIELDS_602.map(k=>[k,d[k].trim()]),
['evidence_type',d.evidence_type],['source_method',d.source_method],
['next_action',d.next_action],['observed_at',d.observed_at],
['witness_attested_at',d.witness_attested_at],['recorded_at',d.recorded_at],
['next_review_at',d.next_review_at],['original_issuer_authenticated',false],
['independent_closure_verified',false],['owner_signature_verified',false],
['owner_authorized',false],['trial_authorized',false]]);
}
export async function localFileDigest602(file,cryptoApi){
if(!file||!Number.isFinite(file.size)||file.size<1||file.size>8*1024*1024||
typeof file.arrayBuffer!=='function'||typeof cryptoApi?.subtle?.digest!=='function')
throw Error('Choose one local evidence file of 1 byte to 8 MB for a SHA-256 only.');
const bytes=await file.arrayBuffer();
if(bytes.byteLength!==file.size||bytes.byteLength>8*1024*1024)
throw Error('Local evidence file size changed during hashing.');
const result=await cryptoApi.subtle.digest('SHA-256',bytes);
return Array.from(new Uint8Array(result),x=>x.toString(16).padStart(2,'0')).join('');
}
export function recheckExternalEvidence602(exact601,source601,local601=[],rows=[],
asOf=new Date().toISOString()){
if(exact601?.format!==FORMAT_601||!Array.isArray(source601)||source601.length!==3||
!Array.isArray(local601)||!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact Build 601 independent escalation source required.');
const reproduced=reconcileEscalations601(...source601,local601,exact601.as_of);
if(JSON.stringify(reproduced)!==JSON.stringify(exact601))
throw Error('Stale or modified Build 601 original issuer and owner handoff packet.');
const current=asOf===exact601.as_of?reproduced:reconcileEscalations601(...source601,local601,asOf);
const entered=rows.map(evidenceCandidate602);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const evidence=entered.filter(r=>r.case_pin===c.case_pin).map(r=>{
if(ownerAction602(r.next_action)!==owner||
(r.evidence_type==='EXACT_OWNER_SIGNED_SCOPE')!==owner||
!c.open_exceptions.includes(r.exception_code)||
(owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action))||
(!owner&&[r.owner_signer_ref,r.owner_signed_receipt_ref,r.owner_account,
r.owner_product,r.owner_action].some(Boolean)))
throw Error('Wrong unresolved issuer/witness case or exact owner action.');
const prior=c.latest_escalation||{};
const conflicts=uniq600([
r.issuer_identity_ref&&c.expected_issuer_ref&&r.issuer_identity_ref!==c.expected_issuer_ref?
'ORIGINAL_ISSUER_IDENTITY_SUBSTITUTION':null,
r.original_document_sha256&&c.source_digest&&
r.original_document_sha256!==c.source_digest?'ORIGINAL_DOCUMENT_DIGEST_MISMATCH':null,
r.custody_receipt_ref&&c.expected_custody_ref&&
r.custody_receipt_ref!==c.expected_custody_ref?'CUSTODY_CHAIN_REFERENCE_MISMATCH':null,
r.issuer_decision_ref&&prior.issuer_decision_ref&&
r.issuer_decision_ref!==prior.issuer_decision_ref?'ORIGINAL_ISSUER_DECISION_SUBSTITUTION':null,
r.authority_locator_ref&&[r.original_artifact_ref,r.issuer_decision_ref]
.includes(r.authority_locator_ref)?'SELF_REFERENTIAL_ISSUER_AUTHORITY':null,
r.closure_decision_ref&&[r.original_artifact_ref,r.issuer_decision_ref,
r.witness_attestation_ref].includes(r.closure_decision_ref)?
'CLOSURE_REUSES_DISPUTED_EVIDENCE':null,
r.witness_attestation_ref&&[r.original_artifact_ref,r.issuer_decision_ref,
r.authority_locator_ref].includes(r.witness_attestation_ref)?
'WITNESS_ATTESTATION_NOT_SEPARATE_EVIDENCE':null,
r.reviewer_ref&&r.reviewer_ref===r.witness_ref?'REVIEWER_EQUALS_WITNESS':null,
r.issuer_identity_ref&&[r.reviewer_ref,r.witness_ref].includes(r.issuer_identity_ref)?
'ISSUER_EQUALS_INDEPENDENT_REVIEW_PARTY':null,
owner&&r.owner_signer_ref&&[r.reviewer_ref,r.witness_ref].includes(r.owner_signer_ref)?
'OWNER_SIGNER_EQUALS_REVIEW_PARTY':null,
owner&&r.owner_signer_ref&&c.expected_owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_REFERENCE_MISMATCH':null,
owner&&r.owner_signed_receipt_ref&&c.expected_owner_receipt_ref&&
r.owner_signed_receipt_ref!==c.expected_owner_receipt_ref?'OWNER_RECEIPT_REFERENCE_MISMATCH':null,
!r.original_artifact_ref?'ORIGINAL_EXTERNAL_ARTIFACT_NOT_LOCATED':null,
!r.authority_locator_ref?'INDEPENDENT_ISSUER_AUTHORITY_NOT_ATTESTED':null,
!r.original_document_sha256?'ORIGINAL_DOCUMENT_SHA256_MISSING':null,
!r.closure_decision_ref?'INDEPENDENT_CONFLICT_CLOSURE_MISSING':null,
!r.reviewer_ref?'SEPARATE_REVIEWER_NOT_IDENTIFIED':null,
!r.witness_ref||!r.witness_attestation_ref||!r.witness_attested_at?
'INDEPENDENT_WITNESS_ATTESTATION_INCOMPLETE':null,
owner&&(!r.owner_signed_receipt_ref||!r.owner_signer_ref)?
'EXACT_OWNER_SIGNATURE_NOT_AUTHENTICATED':null
]);
return {...r,conflicts,
local_digest_comparison:r.original_document_sha256&&c.source_digest?
(r.original_document_sha256===c.source_digest?
'MATCHING_LOCAL_BYTES_NOT_ISSUER_AUTHENTICATION':'ORIGINAL_SOURCE_DIGEST_CONFLICT_OPEN'):
'ORIGINAL_DOCUMENT_DIGEST_NOT_AVAILABLE',
original_issuer_authenticated:false,independent_closure_verified:false,
owner_signature_verified:false,trial_authorized:false,
provider_reads:0,provider_writes:0,d1_operations:0};
});
const latest=evidence.at(-1)||null;
const aging=aging600(latest?.next_review_at||c.latest_escalation?.next_review_at||'',asOf);
const blockers=uniq600([...c.readiness_blockers,...(latest?.conflicts||[]),
!latest?'ORIGINAL_EVIDENCE_INTAKE_NOT_RECORDED':null,
!latest?.issuer_decision_ref?'AUTHENTICATED_ISSUER_DECISION_REQUIRED':null,
!latest?.witness_attestation_ref?'SEPARATE_WITNESS_AUTHENTICATION_REQUIRED':null,
owner&&!latest?.owner_signed_receipt_ref?'EXACT_OWNER_SIGNED_PERMISSION_REQUIRED':null]);
return {...c,evidence_intake:evidence,latest_external_evidence:latest,aging,
remaining_blockers:blockers,original_issuer_authenticated:false,
independent_conflict_closed:false,exact_owner_signature_verified:false,
trial_authorized:false,status:'EXTERNAL_PROOF_UNVERIFIED_EXACT_OWNER_TRIAL_HOLD'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_602,build:602,source_build:601,as_of:asOf,cases,
open_cases:cases.length,issuer_cases:cases.filter(c=>!c.owner_trial_decision_pending).length,
exact_owner_cases:cases.filter(c=>c.owner_trial_decision_pending).length,
witness_gaps:cases.filter(c=>c.remaining_blockers.some(x=>/WITNESS|REVIEWER/.test(x))).length,
digest_or_custody_conflicts:cases.filter(c=>c.remaining_blockers.some(x=>/DIGEST|CUSTODY|SOURCE/.test(x))).length,
overdue_cases:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
stale_unmatched_evidence:entered.filter(r=>!pins.has(r.case_pin)),
independently_authenticated_issuers:0,independently_closed_conflicts:0,
authenticated_owner_signatures:0,authorized_trials:0,provider_reads:0,
provider_writes:0,d1_operations:0,
release_gate:'HOLD_ORIGINAL_ISSUER_PROOF_INDEPENDENT_WITNESS_AND_EXACT_OWNER_AUTHORIZATION'};
}
export function filterExternalEvidence602(p,kind='ALL',term=''){
if(p?.format!==FORMAT_602||!FILTERS_602.includes(kind)||!safe600(term,120))
throw Error('Invalid Build 602 source-pinned external evidence filter.');
const q=term.trim().toLowerCase();
return p.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&!c.owner_trial_decision_pending)||
(kind==='WITNESS'&&c.remaining_blockers.some(x=>/WITNESS|REVIEWER/.test(x)))||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='DIGEST'&&c.remaining_blockers.some(x=>/DIGEST|CUSTODY|SOURCE/.test(x)))||
(kind==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='MISSING_PROOF'&&!c.latest_external_evidence))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedEvidenceHandoff602(p,pin){
if(p?.format!==FORMAT_602)throw Error('Exact Build 602 external evidence packet required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Unresolved source-pinned evidence case required.');
const owner=c.owner_trial_decision_pending,r=c.latest_external_evidence||{};
return {format:'devilndove-unverified-external-evidence-owner-handoff-602-v1',
build:602,source_build:601,source_pin:c.case_pin,prepared_at:p.as_of,
review_kind:owner?'EXACT_OWNER_PERMISSION_EXCEPTION':'ORIGINAL_ISSUER_WITNESS_REVIEW',
exact_channel:c.channel,exact_shop_account:c.account_id,
exact_product_sku:c.product_ref,exact_action:c.exact_action,
original_source_digest:c.source_digest,claimed_original_artifact:r.original_artifact_ref||null,
local_digest_comparison:r.local_digest_comparison||null,
proposed_external_witness:r.witness_ref||null,
proposed_witness_attestation:r.witness_attestation_ref||null,
proposed_owner_signer:owner?r.owner_signer_ref||null:null,
proposed_owner_signed_receipt:owner?r.owner_signed_receipt_ref||null:null,
overdue_bucket:c.aging.bucket,remaining_blockers:c.remaining_blockers,
external_verification_required:[
'Authenticate the original issuer independently of locally entered references',
'Verify source digest and custody against original bytes and issuer authority',
'Witness conflict closure with a separate independently verified reviewer',
...(owner?['Authenticate owner signature for this exact shop, Product and proposed action',
'Obtain an explicit separate owner trial authorization']:[])],
issuer_authenticated:false,conflict_closed:false,owner_signature_verified:false,
trial_authorized:false,provider_read_or_write_authorized:false,
status:'UNSIGNED_EXTERNAL_EVIDENCE_HANDOFF_HOLD'};
}
function init602(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd602Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd602Status'),output=get('dd602Output');
const read=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
const stored=()=>read(KEY_602,[]);
let previousPin=null;
const source=()=>{
const v=['dd601Output','dd600Output','dd599Output','dd598Output','dd597Output']
.map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute exact original sections 5–26.');
const original=[JSON.parse(v[2]),[JSON.parse(v[3]),
[JSON.parse(v[4]),sourceContext597(doc,win),read(KEY_597,[])],read(KEY_598,[])],
read(KEY_599,[])];
return [JSON.parse(v[0]),[JSON.parse(v[1]),original,read(KEY_600,[])],read(KEY_601,[])];
};
const refresh=()=>{
const p=recheckExternalEvidence602(...source(),stored());output.value=JSON.stringify(p,null,2);
get('dd602Metrics').textContent=p.open_cases+' open · '+p.witness_gaps+
' witness gaps · '+p.digest_or_custody_conflicts+' original conflicts · '+
p.exact_owner_cases+' owner exceptions · trial HOLD';
const choices=get('dd602Case'),prior=choices.value;choices.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;choices.append(o);}
if([...choices.options].some(o=>o.value===prior))choices.value=prior;
const c=p.cases.find(x=>x.case_pin===choices.value),ex=get('dd602Exception'),old=ex.value;
ex.replaceChildren();for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');ex.append(o);}
if([...ex.options].some(o=>o.value===old))ex.value=old;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd602Type').value=c?.owner_trial_decision_pending?'EXACT_OWNER_SIGNED_SCOPE':
'ORIGINAL_ISSUER_EVIDENCE';
get('dd602Action').value=c?.owner_trial_decision_pending?'REQUEST_EXACT_OWNER_SIGNED_RECEIPT':
'REQUEST_ORIGINAL_ISSUER_DECISION';
for(const [id,v] of [['dd602Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd602Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd602Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=v;
}
const list=get('dd602Rows');list.replaceChildren();
for(const c of filterExternalEvidence602(p,get('dd602Filter').value,get('dd602Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+
' · '+c.aging.bucket+' · '+c.remaining_blockers.length+' outstanding proof gaps';
list.append(li);
}
status.textContent='External issuer and independent witness claims remain unauthenticated. HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact source sections 5–26 first; provider/owner trial HOLD.';return null;}};
for(const [id,event] of [['dd602Refresh','click'],['dd602Filter','change'],
['dd602Search','input'],['dd602Case','change']])get(id).addEventListener(event,guard);
get('dd602HashFile').addEventListener('click',async()=>{try{
const file=get('dd602File').files?.[0];
get('dd602Digest').value=await localFileDigest602(file,win.crypto);
status.textContent='SHA-256 computed locally; not issuer authentication. File not uploaded or saved.';
}catch{status.textContent='File hash unavailable or exceeds 8 MB. No evidence accepted; HOLD.';}});
get('dd602Save').addEventListener('click',()=>{try{
if(!get('dd602Ack').checked)throw Error('Explicit HOLD acknowledgement required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd602Case').value);
if(!c)throw Error('Missing original-source case.');const v=id=>get(id).value.trim();
const row=evidenceCandidate602({case_pin:c.case_pin,exception_code:v('dd602Exception'),
evidence_type:v('dd602Type'),source_method:v('dd602Method'),next_action:v('dd602Action'),
original_artifact_ref:v('dd602Artifact'),issuer_identity_ref:v('dd602Issuer'),
authority_locator_ref:v('dd602Authority'),original_document_sha256:v('dd602Digest'),
custody_receipt_ref:v('dd602Custody'),issuer_decision_ref:v('dd602Decision'),
closure_decision_ref:v('dd602Closure'),reviewer_ref:v('dd602Reviewer'),
witness_ref:v('dd602Witness'),witness_attestation_ref:v('dd602WitnessProof'),
owner_signer_ref:v('dd602Signer'),owner_signed_receipt_ref:v('dd602OwnerReceipt'),
owner_account:v('dd602Account'),owner_product:v('dd602Product'),
owner_action:v('dd602Scope'),reason:v('dd602Reason'),
observed_at:v('dd602Observed')?new Date(v('dd602Observed')).toISOString():'',
witness_attested_at:v('dd602WitnessAt')?new Date(v('dd602WitnessAt')).toISOString():'',
recorded_at:new Date().toISOString(),next_review_at:new Date(v('dd602Due')).toISOString()});
const next=[...stored(),row];recheckExternalEvidence602(...source(),next);
win.localStorage.setItem(KEY_602,JSON.stringify(next));get('dd602Ack').checked=false;refresh();
}catch{status.textContent='Rejected: stale original evidence, wrong scope or unsafe claim. HOLD.';}});
const make=()=>{const p=refresh();
get('dd602Handoff').value=JSON.stringify(unsignedEvidenceHandoff602(p,get('dd602Case').value),null,2);
status.textContent='Unsigned source-pinned issuer/owner exception handoff prepared; HOLD.';};
get('dd602Prepare').addEventListener('click',()=>{try{make();}catch{
status.textContent='Select a current unresolved case. HOLD.';}});
const copy=async(kind)=>{try{if(kind==='handoff')make();else refresh();
const el=get(kind==='handoff'?'dd602Handoff':'dd602Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unverified evidence packet copied; provider/owner HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually; HOLD.';}
}catch{status.textContent='Recompute current source before copying. HOLD.';}};
get('dd602Copy').addEventListener('click',()=>copy('queue'));
get('dd602CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init602();


export const FORMAT_603='devilndove-custody-witness-owner-expiry-603-v1';
export const KEY_603='dd:custody-witness-owner-expiry:603:v1';
export const KINDS_603=['CUSTODY_HANDOFF','WITNESS_IDENTITY_FOLLOWUP','OWNER_SIGNOFF_EXPIRY'];
export const FILTERS_603=['ALL','CUSTODY','WITNESS','OWNER','EXPIRED','EXPIRING','OVERDUE','CONFLICT'];
const FIELDS_603=['case_pin','exception_code','artifact_ref','issuer_authority_ref',
'original_sha256','custody_origin_receipt_ref','custody_transfer_receipt_ref',
'custodian_from_ref','custodian_to_ref','reviewer_ref','witness_identity_ref',
'witness_independent_authority_ref','witness_followup_receipt_ref',
'owner_signer_ref','owner_signed_receipt_ref','owner_account','owner_product',
'owner_action','reason'];
const DATES_603=['custody_observed_at','custody_transferred_at','witness_contacted_at',
'witness_responded_at','owner_signed_at','owner_expires_at','recorded_at','next_review_at'];
export function custodyFollowupCandidate603(d){
const allowed=new Set([...FIELDS_603,...DATES_603,'kind']);
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.has(k))||
FIELDS_603.some(k=>!safe600(d[k],k==='reason'?900:220))||
DATES_603.some(k=>!safe600(d[k],40))||
!d.case_pin.startsWith('dd596-case:')||d.exception_code.length<4||
!KINDS_603.includes(d.kind)||!sha600(d.original_sha256)||
d.reason.trim().length<15||!iso600(d.recorded_at)||!iso600(d.next_review_at)||
DATES_603.slice(0,-2).some(k=>d[k]!==''&&!iso600(d[k]))||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at)||
DATES_603.slice(0,-2).filter(k=>k!=='owner_expires_at')
.some(k=>d[k]!==''&&Date.parse(d[k])>Date.parse(d.recorded_at))||
[['custody_observed_at','custody_transferred_at'],
['witness_contacted_at','witness_responded_at'],['owner_signed_at','owner_expires_at']]
.some(([a,b])=>d[a]&&d[b]&&Date.parse(d[b])<=Date.parse(d[a])))
throw Error('Unverified custody, witness or owner sign-off cannot grant trial authority.');
return {...Object.fromEntries(FIELDS_603.map(k=>[k,d[k].trim()])),
...Object.fromEntries(DATES_603.map(k=>[k,d[k]])),kind:d.kind,
issuer_authenticated:false,custody_verified:false,witness_authenticated:false,
owner_signature_verified:false,trial_authorized:false};
}
export function signoffExpiry603(signed,expires,asOf){
if(!iso600(asOf)||signed&&!iso600(signed)||expires&&!iso600(expires))
throw Error('Invalid exact owner authorization review clock.');
if(!signed||!expires)return {state:'SIGNOFF_DATE_OR_EXPIRY_MISSING',hours_remaining:null};
if(Date.parse(expires)<=Date.parse(signed))throw Error('Owner expiry must follow signature claim.');
const hours=(Date.parse(expires)-Date.parse(asOf))/3600000;
return {state:Date.parse(asOf)<Date.parse(signed)?'SIGNOFF_NOT_YET_EFFECTIVE':
hours<=0?'SIGNOFF_EXPIRED':hours<=72?'SIGNOFF_EXPIRES_WITHIN_72H':
'SIGNOFF_UNVERIFIED_WITH_FUTURE_EXPIRY',hours_remaining:Math.round(hours*10)/10};
}
export function reconcileCustodyWitnessExpiry603(exact602,source602,local602=[],rows=[],
asOf=new Date().toISOString()){
if(exact602?.format!==FORMAT_602||!Array.isArray(source602)||source602.length!==3||
!Array.isArray(local602)||!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact Build 602 original-evidence source chain required.');
const replay=recheckExternalEvidence602(...source602,local602,exact602.as_of);
if(JSON.stringify(replay)!==JSON.stringify(exact602))
throw Error('Stale or substituted Build 602 original evidence packet.');
const current=recheckExternalEvidence602(...source602,local602,asOf);
return reviewCustodyWitnessExpiry603(current,rows,asOf);
}

export function reviewCustodyWitnessExpiry603(current,rows=[],asOf=new Date().toISOString()){
if(current?.format!==FORMAT_602||!Array.isArray(current.cases)||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Validated current Build 602 external evidence cases required.');
const entered=rows.map(custodyFollowupCandidate603);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const followups=entered.filter(r=>r.case_pin===c.case_pin).map((r,i)=>{
if(!c.open_exceptions.includes(r.exception_code)||
(!owner&&r.kind==='OWNER_SIGNOFF_EXPIRY')||
(!owner&&[r.owner_signer_ref,r.owner_signed_receipt_ref,r.owner_account,
r.owner_product,r.owner_action,r.owner_signed_at,r.owner_expires_at].some(Boolean))||
(owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action)))
throw Error('Wrong exact original evidence exception or owner authorization scope.');
const previous=c.latest_external_evidence||{},prior=i?entered.filter(x=>x.case_pin===c.case_pin)[i-1]:null;
const expiry=owner?signoffExpiry603(r.owner_signed_at,r.owner_expires_at,asOf):null;
const conflicts=uniq600([
r.original_sha256&&c.source_digest&&r.original_sha256!==c.source_digest?
'ORIGINAL_DOCUMENT_DIGEST_CHANGED':null,
r.original_sha256&&previous.original_document_sha256&&
r.original_sha256!==previous.original_document_sha256?'BUILD_602_DIGEST_CONTINUITY_BROKEN':null,
r.custody_origin_receipt_ref&&c.expected_custody_ref&&
r.custody_origin_receipt_ref!==c.expected_custody_ref?'ORIGINAL_CUSTODY_RECEIPT_SUBSTITUTED':null,
r.custody_origin_receipt_ref&&r.custody_origin_receipt_ref===r.custody_transfer_receipt_ref?
'CUSTODY_ORIGIN_REUSED_AS_TRANSFER':null,
r.custodian_from_ref&&r.custodian_from_ref===r.custodian_to_ref?
'CUSTODY_TRANSFER_SELF_ATTESTED':null,
prior&&prior.custody_transfer_receipt_ref&&r.custody_origin_receipt_ref&&
prior.custody_transfer_receipt_ref!==r.custody_origin_receipt_ref?
'CUSTODY_HANDOFF_CHAIN_GAP':null,
prior&&prior.custodian_to_ref&&r.custodian_from_ref&&
prior.custodian_to_ref!==r.custodian_from_ref?'CUSTODIAN_IDENTITY_CHAIN_GAP':null,
prior&&prior.custody_transferred_at&&r.custody_observed_at&&
Date.parse(r.custody_observed_at)<Date.parse(prior.custody_transferred_at)?
'CUSTODY_EVENT_REVERSED':null,
r.witness_identity_ref&&[r.reviewer_ref,r.custodian_from_ref,
r.custodian_to_ref,r.owner_signer_ref,c.expected_issuer_ref].includes(r.witness_identity_ref)?
'WITNESS_NOT_INDEPENDENT_OF_REVIEW_CUSTODY_ISSUER_OWNER':null,
r.witness_independent_authority_ref&&[r.witness_identity_ref,r.witness_followup_receipt_ref,
r.artifact_ref].includes(r.witness_independent_authority_ref)?
'WITNESS_AUTHORITY_SELF_REFERENTIAL':null,
r.witness_followup_receipt_ref&&[r.artifact_ref,r.custody_origin_receipt_ref,
r.custody_transfer_receipt_ref].includes(r.witness_followup_receipt_ref)?
'WITNESS_FOLLOWUP_REUSES_DISPUTED_RECEIPT':null,
owner&&r.owner_signer_ref&&c.expected_owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_CHANGED':null,
owner&&r.owner_signed_receipt_ref&&c.expected_owner_receipt_ref&&
r.owner_signed_receipt_ref!==c.expected_owner_receipt_ref?'OWNER_SIGNED_RECEIPT_CHANGED':null,
owner&&r.owner_signed_receipt_ref&&[r.witness_followup_receipt_ref,r.artifact_ref,
r.custody_transfer_receipt_ref].includes(r.owner_signed_receipt_ref)?
'OWNER_SIGNOFF_REUSES_DISPUTED_RECEIPT':null,
!r.artifact_ref||!r.issuer_authority_ref?'ORIGINAL_ARTIFACT_AUTHORITY_NOT_VERIFIED':null,
r.kind==='CUSTODY_HANDOFF'&&(!r.custody_origin_receipt_ref||
!r.custody_transfer_receipt_ref||!r.custodian_from_ref||!r.custodian_to_ref||
!r.custody_observed_at||!r.custody_transferred_at)?'CUSTODY_EVENT_INCOMPLETE':null,
r.kind==='WITNESS_IDENTITY_FOLLOWUP'&&(!r.witness_identity_ref||
!r.witness_independent_authority_ref||!r.witness_followup_receipt_ref||
!r.witness_contacted_at||!r.witness_responded_at)?'INDEPENDENT_WITNESS_FOLLOWUP_INCOMPLETE':null,
owner&&expiry?.state==='SIGNOFF_EXPIRED'?'EXACT_OWNER_SIGNOFF_EXPIRED':null,
owner&&expiry?.state==='SIGNOFF_EXPIRES_WITHIN_72H'?'EXACT_OWNER_SIGNOFF_EXPIRING':null,
owner&&expiry?.state==='SIGNOFF_NOT_YET_EFFECTIVE'?'OWNER_SIGNOFF_NOT_YET_EFFECTIVE':null,
owner&&expiry?.state==='SIGNOFF_DATE_OR_EXPIRY_MISSING'?'OWNER_SIGNOFF_EXPIRY_PROOF_MISSING':null,
owner&&(!r.owner_signer_ref||!r.owner_signed_receipt_ref)?'EXACT_OWNER_SIGNATURE_UNVERIFIED':null
]);
return {...r,conflicts,signoff_expiry:expiry,issuer_authenticated:false,
custody_verified:false,witness_authenticated:false,owner_signature_verified:false,
trial_authorized:false,provider_reads:0,provider_writes:0,d1_operations:0};
});
const latest=followups.at(-1)||null;
const lastSignoff=followups.filter(r=>r.kind==='OWNER_SIGNOFF_EXPIRY').at(-1);
const signoff=owner?(lastSignoff?.signoff_expiry||signoffExpiry603('','',asOf)):null;
const blockers=uniq600([...c.remaining_blockers,...followups.flatMap(r=>r.conflicts),
!followups.length?'CUSTODY_WITNESS_EXPIRY_FOLLOWUP_NOT_RECORDED':null,
!followups.some(r=>r.kind==='CUSTODY_HANDOFF')?'ORIGINAL_CUSTODY_HANDOFF_UNCONFIRMED':null,
!followups.some(r=>r.kind==='WITNESS_IDENTITY_FOLLOWUP')?'INDEPENDENT_WITNESS_IDENTITY_UNCONFIRMED':null,
owner&&!followups.some(r=>r.kind==='OWNER_SIGNOFF_EXPIRY')?
'EXACT_OWNER_SIGNOFF_EXPIRY_UNCONFIRMED':null]);
return {...c,custody_witness_owner_followups:followups,latest_followup:latest,
signoff_expiry:signoff,aging:aging600(latest?.next_review_at||c.aging.due_at||'',asOf),
remaining_blockers:blockers,issuer_authenticated:false,custody_verified:false,
witness_authenticated:false,owner_signature_verified:false,trial_authorized:false,
status:'ORIGINAL_CUSTODY_WITNESS_AND_EXACT_OWNER_SIGNOFF_HOLD'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_603,build:603,source_build:602,as_of:asOf,cases,
open_cases:cases.length,custody_gaps:cases.filter(c=>c.remaining_blockers.some(x=>/CUSTODY/.test(x))).length,
witness_gaps:cases.filter(c=>c.remaining_blockers.some(x=>/WITNESS/.test(x))).length,
expired_signoffs:cases.filter(c=>c.signoff_expiry?.state==='SIGNOFF_EXPIRED').length,
expiring_signoffs:cases.filter(c=>c.signoff_expiry?.state==='SIGNOFF_EXPIRES_WITHIN_72H').length,
overdue_reviews:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
stale_unmatched_followups:entered.filter(r=>!pins.has(r.case_pin)),
authenticated_issuers:0,verified_custody_chains:0,authenticated_witnesses:0,
verified_owner_signoffs:0,authorized_trials:0,provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_INDEPENDENT_ORIGINAL_CUSTODY_WITNESS_IDENTITY_EXACT_OWNER_SIGNOFF'};
}
export function filterCustodyWitnessExpiry603(p,kind='ALL',term=''){
if(p?.format!==FORMAT_603||!FILTERS_603.includes(kind)||!safe600(term,120))
throw Error('Invalid source-pinned custody and owner expiry filter.');
const q=term.trim().toLowerCase();
return p.cases.filter(c=>(kind==='ALL'||
(kind==='CUSTODY'&&c.remaining_blockers.some(x=>/CUSTODY/.test(x)))||
(kind==='WITNESS'&&c.remaining_blockers.some(x=>/WITNESS/.test(x)))||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='EXPIRED'&&c.signoff_expiry?.state==='SIGNOFF_EXPIRED')||
(kind==='EXPIRING'&&c.signoff_expiry?.state==='SIGNOFF_EXPIRES_WITHIN_72H')||
(kind==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='CONFLICT'&&c.custody_witness_owner_followups.some(r=>r.conflicts.length)))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedCustodyWitnessExpiry603(p,pin){
if(p?.format!==FORMAT_603)throw Error('Exact Build 603 original-chain packet required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Select current original-source case.');
return {format:'devilndove-unsigned-custody-witness-expiry-followup-603-v1',
build:603,source_build:602,source_pin:pin,prepared_at:p.as_of,
channel:c.channel,exact_shop_account:c.account_id,exact_product_sku:c.product_ref,
exact_action:c.exact_action,original_source_digest:c.source_digest,
custody_chain:c.custody_witness_owner_followups.filter(r=>r.kind==='CUSTODY_HANDOFF'),
witness_followups:c.custody_witness_owner_followups.filter(r=>r.kind==='WITNESS_IDENTITY_FOLLOWUP'),
owner_signoff_claims:c.custody_witness_owner_followups.filter(r=>r.kind==='OWNER_SIGNOFF_EXPIRY'),
signoff_expiry:c.signoff_expiry,remaining_blockers:c.remaining_blockers,
independent_external_actions:['Recheck original issuer and each custody transfer with trusted sources',
'Authenticate the separate witness identity and original follow-up receipt',
...(c.owner_trial_decision_pending?['Reconfirm signer, exact scope and unexpired signed owner receipt']:[])],
custody_verified:false,witness_authenticated:false,owner_signature_verified:false,
trial_authorized:false,provider_read_or_write_authorized:false,
status:'UNSIGNED_SOURCE_PINNED_FOLLOWUP_HOLD'};
}
function init603(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd603Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd603Status'),output=get('dd603Output');
const read=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
const stored=()=>read(KEY_603,[]);
let previousPin=null;
const source=()=>{
const v=['dd602Output','dd601Output','dd600Output','dd599Output','dd598Output',
'dd597Output'].map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute original Admin sections 5–27.');
const original=[JSON.parse(v[3]),[JSON.parse(v[4]),
[JSON.parse(v[5]),sourceContext597(doc,win),read(KEY_597,[])],read(KEY_598,[])],
read(KEY_599,[])];
const source601=[JSON.parse(v[2]),original,read(KEY_600,[])];
return [JSON.parse(v[0]),[JSON.parse(v[1]),source601,read(KEY_601,[])],read(KEY_602,[])];
};
const refresh=()=>{
const p=reconcileCustodyWitnessExpiry603(...source(),stored());
output.value=JSON.stringify(p,null,2);
get('dd603Metrics').textContent=p.open_cases+' open · '+p.custody_gaps+
' custody gaps · '+p.witness_gaps+' witness gaps · '+p.expired_signoffs+
' expired sign-offs · '+p.expiring_signoffs+' expiring · HOLD';
const select=get('dd603Case'),old=select.value;select.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;select.append(o);}
if([...select.options].some(o=>o.value===old))select.value=old;
const c=p.cases.find(x=>x.case_pin===select.value),exception=get('dd603Exception');
const selected=exception.value;exception.replaceChildren();
for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');exception.append(o);}
if([...exception.options].some(o=>o.value===selected))exception.value=selected;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd603Kind').value=c?.owner_trial_decision_pending?'OWNER_SIGNOFF_EXPIRY':'CUSTODY_HANDOFF';
for(const [id,v] of [['dd603Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd603Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd603Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=v;
}
const list=get('dd603Rows');list.replaceChildren();
for(const c of filterCustodyWitnessExpiry603(p,get('dd603Filter').value,get('dd603Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+
' · '+(c.signoff_expiry?.state||'issuer/witness')+' · '+c.remaining_blockers.length+' gaps';
list.append(li);
}
status.textContent='Custody, independent witness and exact owner sign-off remain unverified · HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact source sections 5–27; no external approval · HOLD.';return null;}};
for(const [id,event] of [['dd603Refresh','click'],['dd603Filter','change'],
['dd603Search','input'],['dd603Case','change']])get(id).addEventListener(event,guard);
get('dd603Save').addEventListener('click',()=>{try{
if(!get('dd603Ack').checked)throw Error('HOLD acknowledgement required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd603Case').value);
if(!c)throw Error('Exact current case required.');
const v=id=>get(id).value.trim(),date=id=>v(id)?new Date(v(id)).toISOString():'';
const row=custodyFollowupCandidate603({case_pin:c.case_pin,
exception_code:v('dd603Exception'),kind:v('dd603Kind'),
...Object.fromEntries([['artifact_ref','Artifact'],['issuer_authority_ref','IssuerAuthority'],
['original_sha256','Digest'],['custody_origin_receipt_ref','Origin'],
['custody_transfer_receipt_ref','Transfer'],['custodian_from_ref','From'],
['custodian_to_ref','To'],['reviewer_ref','Reviewer'],
['witness_identity_ref','Witness'],['witness_independent_authority_ref','WitnessAuthority'],
['witness_followup_receipt_ref','WitnessReceipt'],['owner_signer_ref','Signer'],
['owner_signed_receipt_ref','OwnerReceipt'],['owner_account','Account'],
['owner_product','Product'],['owner_action','Scope'],['reason','Reason']]
.map(([k,id])=>[k,v('dd603'+id)])),
custody_observed_at:date('dd603Observed'),custody_transferred_at:date('dd603Transferred'),
witness_contacted_at:date('dd603Contacted'),witness_responded_at:date('dd603Responded'),
owner_signed_at:date('dd603Signed'),owner_expires_at:date('dd603Expires'),
recorded_at:new Date().toISOString(),next_review_at:date('dd603Due')});
const next=[...stored(),row];reconcileCustodyWitnessExpiry603(...source(),next);
win.localStorage.setItem(KEY_603,JSON.stringify(next));get('dd603Ack').checked=false;refresh();
}catch{status.textContent='Rejected: original-source, custody, witness or owner expiry conflict · HOLD.';}});
const prepare=()=>{const p=refresh();get('dd603Handoff').value=JSON.stringify(
unsignedCustodyWitnessExpiry603(p,get('dd603Case').value),null,2);
status.textContent='Unsigned external verification packet prepared; provider trial HOLD.';};
get('dd603Prepare').addEventListener('click',()=>{try{prepare();}catch{
status.textContent='Recompute and select a current exact case · HOLD.';}});
const copy=async(kind)=>{try{if(kind==='handoff')prepare();else refresh();
const el=get(kind==='handoff'?'dd603Handoff':'dd603Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unverified source packet copied; trial HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually; HOLD.';}
}catch{status.textContent='Refresh exact-source packet first; HOLD.';}};
get('dd603Copy').addEventListener('click',()=>copy('queue'));
get('dd603CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init603();


export const FORMAT_604='devilndove-original-issuer-witness-owner-renewal-604-v1';
export const KEY_604='dd:original-issuer-witness-owner-renewal:604:v1';
export const KINDS_604=['ISSUER_CONFIRMATION','WITNESS_EXCEPTION_DISPOSITION',
'EXACT_OWNER_RENEWAL'];
export const ISSUER_STATES_604=['NOT_REQUESTED','REQUESTED','REPORTED_CONFIRMATION',
'DISPUTED_ORIGINAL','NO_RESPONSE'];
export const WITNESS_STATES_604=['OPEN','ESCALATED','REPORTED_RESOLUTION','DISPUTED'];
export const FILTERS_604=['ALL','ISSUER','WITNESS','OWNER','RENEWAL_EXPIRED',
'RENEWAL_DUE','OVERDUE','CONFLICT','NO_REPLY'];
const FIELDS_604=['case_pin','exception_code','original_issuer_confirmation_ref',
'issuer_identity_ref','issuer_authority_locator_ref','original_digest',
'reviewer_ref','witness_identity_ref','witness_disposition_ref',
'witness_independent_source_ref','owner_signer_ref','owner_original_receipt_ref',
'owner_renewal_receipt_ref','owner_account','owner_product','owner_action','reason'];
const DATES_604=['issuer_contacted_at','issuer_responded_at','witness_contacted_at',
'witness_disposed_at','owner_original_expires_at','owner_renewal_requested_at',
'owner_renewed_signed_at','owner_renewed_expires_at','recorded_at','next_review_at'];
export function confirmationCandidate604(d){
const allowed=new Set([...FIELDS_604,...DATES_604,'kind','issuer_state','witness_state']);
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.has(k))||
FIELDS_604.some(k=>!safe600(d[k],k==='reason'?900:220))||
DATES_604.some(k=>!safe600(d[k],40))||!d.case_pin.startsWith('dd596-case:')||
d.exception_code.length<4||!KINDS_604.includes(d.kind)||
!ISSUER_STATES_604.includes(d.issuer_state)||
!WITNESS_STATES_604.includes(d.witness_state)||!sha600(d.original_digest)||
d.reason.trim().length<15||!iso600(d.recorded_at)||!iso600(d.next_review_at)||
DATES_604.slice(0,-2).some(k=>d[k]!==''&&!iso600(d[k]))||
DATES_604.slice(0,-2).filter(k=>!['owner_original_expires_at',
'owner_renewed_expires_at'].includes(k)).some(k=>d[k]&&
Date.parse(d[k])>Date.parse(d.recorded_at))||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at)||
[['issuer_contacted_at','issuer_responded_at'],
['witness_contacted_at','witness_disposed_at'],
['owner_renewal_requested_at','owner_renewed_signed_at'],
['owner_renewed_signed_at','owner_renewed_expires_at']]
.some(([a,b])=>d[a]&&d[b]&&Date.parse(d[b])<=Date.parse(d[a])))
throw Error('Unverified issuer, witness or exact owner renewal cannot grant approval.');
return {...Object.fromEntries(FIELDS_604.map(k=>[k,d[k].trim()])),
...Object.fromEntries(DATES_604.map(k=>[k,d[k]])),kind:d.kind,
issuer_state:d.issuer_state,witness_state:d.witness_state,
issuer_authenticated:false,witness_exception_closed:false,
owner_renewal_authenticated:false,trial_authorized:false};
}
export function renewalClock604(signed,expiry,asOf){
const e=signoffExpiry603(signed,expiry,asOf);
return {state:e.state.replace('SIGNOFF_','RENEWAL_'),hours_remaining:e.hours_remaining,
independently_authenticated:false};
}
export function reconcileOriginalConfirmations604(exact603,source603,rows=[],
asOf=new Date().toISOString()){
if(exact603?.format!==FORMAT_603||!Array.isArray(source603)||source603.length!==4||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact Build 603 issuer custody, witness and owner source required.');
const replay=reconcileCustodyWitnessExpiry603(...source603,exact603.as_of);
if(JSON.stringify(replay)!==JSON.stringify(exact603))
throw Error('Stale or substituted Build 603 source-pinned external case packet.');
const current=reconcileCustodyWitnessExpiry603(...source603,asOf);
return reviewOriginalConfirmations604(current,rows,asOf);
}

export function reviewOriginalConfirmations604(current,rows=[],asOf=new Date().toISOString()){
if(current?.format!==FORMAT_603||!Array.isArray(current.cases)||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Current validated Build 603 case register required.');
const entered=rows.map(confirmationCandidate604);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const notes=entered.filter(r=>r.case_pin===c.case_pin).map(r=>{
if(!c.open_exceptions.includes(r.exception_code)||
(r.kind==='EXACT_OWNER_RENEWAL'&&!owner)||
(!owner&&[r.owner_signer_ref,r.owner_original_receipt_ref,r.owner_renewal_receipt_ref,
r.owner_account,r.owner_product,r.owner_action,r.owner_original_expires_at,
r.owner_renewal_requested_at,r.owner_renewed_signed_at,
r.owner_renewed_expires_at].some(Boolean))||
(owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action)))
throw Error('Wrong unresolved original evidence case or exact owner renewal scope.');
const priorWitness=c.custody_witness_owner_followups?.filter(
x=>x.kind==='WITNESS_IDENTITY_FOLLOWUP').at(-1)||{};
const priorOwner=c.custody_witness_owner_followups?.filter(
x=>x.kind==='OWNER_SIGNOFF_EXPIRY').at(-1)||{};
const clock=owner?renewalClock604(r.owner_renewed_signed_at,
r.owner_renewed_expires_at,asOf):null;
const duplicate=key=>r[key]&&entered.some(x=>x.case_pin!==r.case_pin&&
x[key]===r[key]);
const conflicts=uniq600([
r.issuer_identity_ref&&c.expected_issuer_ref&&r.issuer_identity_ref!==c.expected_issuer_ref?
'ISSUER_IDENTITY_SUBSTITUTED':null,
r.original_digest&&c.source_digest&&r.original_digest!==c.source_digest?
'ORIGINAL_ISSUER_DIGEST_CONFLICT':null,
r.original_issuer_confirmation_ref&&[
r.issuer_identity_ref,r.issuer_authority_locator_ref,r.witness_disposition_ref,
r.owner_renewal_receipt_ref].includes(r.original_issuer_confirmation_ref)?
'ISSUER_CONFIRMATION_SELF_REFERENTIAL':null,
r.issuer_authority_locator_ref&&r.issuer_authority_locator_ref===r.issuer_identity_ref?
'ISSUER_AUTHORITY_NOT_INDEPENDENT':null,
duplicate('original_issuer_confirmation_ref')?'ISSUER_RECEIPT_REUSED_ACROSS_CASES':null,
r.kind==='ISSUER_CONFIRMATION'&&(!r.original_issuer_confirmation_ref||
!r.issuer_authority_locator_ref||!r.issuer_responded_at)&&
r.issuer_state==='REPORTED_CONFIRMATION'?'CLAIMED_ISSUER_REPLY_INCOMPLETE':null,
r.witness_identity_ref&&[r.reviewer_ref,r.issuer_identity_ref,r.owner_signer_ref]
.includes(r.witness_identity_ref)?'WITNESS_NOT_INDEPENDENT':null,
r.witness_identity_ref&&priorWitness.witness_identity_ref&&
r.witness_identity_ref!==priorWitness.witness_identity_ref?
'WITNESS_IDENTITY_CHANGED_FROM_CUSTODY_CASE':null,
r.witness_disposition_ref&&[r.original_issuer_confirmation_ref,
r.witness_identity_ref,r.witness_independent_source_ref].includes(r.witness_disposition_ref)?
'WITNESS_DISPOSITION_SELF_REFERENTIAL':null,
duplicate('witness_disposition_ref')?'WITNESS_DISPOSITION_REUSED_ACROSS_CASES':null,
r.kind==='WITNESS_EXCEPTION_DISPOSITION'&&
r.witness_state==='REPORTED_RESOLUTION'&&(!r.witness_disposition_ref||
!r.witness_independent_source_ref||!r.witness_disposed_at)?
'WITNESS_REPORTED_CLOSURE_NOT_EXTERNALLY_CONFIRMED':null,
owner&&r.owner_signer_ref&&c.expected_owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_SUBSTITUTED':null,
owner&&r.owner_original_receipt_ref&&priorOwner.owner_signed_receipt_ref&&
r.owner_original_receipt_ref!==priorOwner.owner_signed_receipt_ref?
'OWNER_ORIGINAL_SIGNOFF_RECEIPT_CHANGED':null,
owner&&r.owner_original_expires_at&&priorOwner.owner_expires_at&&
r.owner_original_expires_at!==priorOwner.owner_expires_at?
'OWNER_ORIGINAL_EXPIRY_REWRITTEN':null,
owner&&r.owner_renewal_receipt_ref&&r.owner_renewal_receipt_ref===r.owner_original_receipt_ref?
'OWNER_OLD_SIGNOFF_REUSED_AS_RENEWAL':null,
duplicate('owner_renewal_receipt_ref')?'OWNER_RENEWAL_RECEIPT_REUSED_ACROSS_CASES':null,
owner&&clock?.state==='RENEWAL_EXPIRED'?'OWNER_RENEWAL_EXPIRED':null,
owner&&clock?.state==='RENEWAL_EXPIRES_WITHIN_72H'?'OWNER_RENEWAL_DUE_WITHIN_72H':null,
owner&&clock?.state==='RENEWAL_NOT_YET_EFFECTIVE'?'OWNER_RENEWAL_NOT_YET_EFFECTIVE':null,
owner&&clock?.state==='RENEWAL_DATE_OR_EXPIRY_MISSING'?'OWNER_RENEWAL_DATES_MISSING':null,
r.kind==='EXACT_OWNER_RENEWAL'&&(!r.owner_renewal_receipt_ref||
!r.owner_signer_ref||!r.owner_renewed_signed_at)?
'EXACT_OWNER_SIGNED_RENEWAL_UNVERIFIED':null
]);
return {...r,conflicts,renewal_clock:clock,issuer_authenticated:false,
witness_exception_closed:false,owner_renewal_authenticated:false,
trial_authorized:false,provider_reads:0,provider_writes:0,d1_operations:0};
});
const latest=notes.at(-1)||null;
const lastOwner=notes.filter(r=>r.kind==='EXACT_OWNER_RENEWAL').at(-1);
const clock=owner?(lastOwner?.renewal_clock||renewalClock604('','',asOf)):null;
const blockers=uniq600([...c.remaining_blockers,...notes.flatMap(r=>r.conflicts),
!notes.some(r=>r.kind==='ISSUER_CONFIRMATION')?'ORIGINAL_ISSUER_CONFIRMATION_UNVERIFIED':null,
!notes.some(r=>r.kind==='WITNESS_EXCEPTION_DISPOSITION')?
'INDEPENDENT_WITNESS_DISPOSITION_UNVERIFIED':null,
owner&&!lastOwner?'EXACT_OWNER_RENEWAL_NOT_RECORDED':null]);
return {...c,issuer_witness_renewal_notes:notes,latest_confirmation:latest,
renewal_clock:clock,remaining_blockers:blockers,
aging:aging600(latest?.next_review_at||c.aging?.due_at||'',asOf),
original_issuer_authenticated:false,witness_exception_closed:false,
owner_renewal_authenticated:false,trial_authorized:false,
status:'ORIGINAL_ISSUER_WITNESS_AND_EXACT_OWNER_RENEWAL_HOLD'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_604,build:604,source_build:603,as_of:asOf,cases,
open_cases:cases.length,issuer_confirmation_gaps:cases.filter(c=>c.remaining_blockers.some(
x=>/ISSUER_CONFIRMATION|ISSUER_REPLY/.test(x))).length,
witness_disposition_gaps:cases.filter(c=>c.remaining_blockers.some(
x=>/WITNESS_DISPOSITION|WITNESS_REPORTED/.test(x))).length,
renewal_expired:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRED').length,
renewal_due_within_72h:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H').length,
overdue_reviews:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
stale_unmatched_notes:entered.filter(r=>!pins.has(r.case_pin)),
original_issuers_confirmed:0,witness_exceptions_closed:0,
exact_owner_renewals_authenticated:0,authorized_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_ORIGINAL_ISSUER_CONFIRMATION_WITNESS_DISPOSITION_AND_SIGNED_OWNER_RENEWAL'};
}
export function filterOriginalConfirmations604(p,kind='ALL',term=''){
if(p?.format!==FORMAT_604||!FILTERS_604.includes(kind)||!safe600(term,120))
throw Error('Invalid original-source receipt and exact owner renewal filter.');
const q=term.trim().toLowerCase();
return p.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&c.remaining_blockers.some(x=>/ISSUER/.test(x)))||
(kind==='WITNESS'&&c.remaining_blockers.some(x=>/WITNESS/.test(x)))||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='RENEWAL_EXPIRED'&&c.renewal_clock?.state==='RENEWAL_EXPIRED')||
(kind==='RENEWAL_DUE'&&c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H')||
(kind==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='CONFLICT'&&c.issuer_witness_renewal_notes.some(r=>r.conflicts.length))||
(kind==='NO_REPLY'&&c.issuer_witness_renewal_notes.some(r=>
r.kind==='ISSUER_CONFIRMATION'&&r.issuer_state==='NO_RESPONSE')))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedOriginalConfirmation604(p,pin){
if(p?.format!==FORMAT_604)throw Error('Exact Build 604 source-pinned packet required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Current issuer, witness or owner case required.');
return {format:'devilndove-unsigned-issuer-witness-owner-renewal-604-v1',
build:604,source_build:603,source_pin:pin,prepared_at:p.as_of,
channel:c.channel,exact_shop_account:c.account_id,exact_product_sku:c.product_ref,
exact_action:c.exact_action,source_digest:c.source_digest,
issuer_confirmation_claims:c.issuer_witness_renewal_notes.filter(r=>
r.kind==='ISSUER_CONFIRMATION'),
witness_disposition_claims:c.issuer_witness_renewal_notes.filter(r=>
r.kind==='WITNESS_EXCEPTION_DISPOSITION'),
owner_renewal_claims:c.issuer_witness_renewal_notes.filter(r=>
r.kind==='EXACT_OWNER_RENEWAL'),
renewal_clock:c.renewal_clock,remaining_blockers:c.remaining_blockers,
independent_followups:['Obtain authenticated original issuer reply from its trusted authority',
'Obtain independent witness identity and external resolution confirmation',
...(c.owner_trial_decision_pending?
['Obtain current unexpired signed owner consent for this exact shop, SKU and action']:[])],
issuer_authenticated:false,witness_exception_closed:false,
owner_renewal_authenticated:false,trial_authorized:false,
provider_read_or_write_authorized:false,status:'UNSIGNED_ORIGINAL_CONFIRMATION_RENEWAL_HOLD'};
}
function init604(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd604Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd604Status'),output=get('dd604Output');
const read=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
const stored=()=>read(KEY_604,[]);
let previousPin=null;
const source=()=>{
const v=['dd603Output','dd602Output','dd601Output','dd600Output','dd599Output',
'dd598Output','dd597Output'].map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute exact original sections 5–28.');
const original=[JSON.parse(v[4]),[JSON.parse(v[5]),
[JSON.parse(v[6]),sourceContext597(doc,win),read(KEY_597,[])],read(KEY_598,[])],
read(KEY_599,[])];
const s601=[JSON.parse(v[3]),original,read(KEY_600,[])];
const s602=[JSON.parse(v[2]),s601,read(KEY_601,[])];
return [JSON.parse(v[0]),[JSON.parse(v[1]),s602,read(KEY_602,[]),read(KEY_603,[])]];
};
const refresh=()=>{
const p=reconcileOriginalConfirmations604(...source(),stored());
output.value=JSON.stringify(p,null,2);
get('dd604Metrics').textContent=p.open_cases+' open · '+p.issuer_confirmation_gaps+
' issuer gaps · '+p.witness_disposition_gaps+' witness gaps · '+p.renewal_expired+
' expired renewals · '+p.renewal_due_within_72h+' due soon · HOLD';
const select=get('dd604Case'),old=select.value;select.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;select.append(o);}
if([...select.options].some(o=>o.value===old))select.value=old;
const c=p.cases.find(x=>x.case_pin===select.value),exception=get('dd604Exception');
const chosen=exception.value;exception.replaceChildren();
for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');exception.append(o);}
if([...exception.options].some(o=>o.value===chosen))exception.value=chosen;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd604Kind').value=c?.owner_trial_decision_pending?'EXACT_OWNER_RENEWAL':'ISSUER_CONFIRMATION';
for(const [id,v] of [['dd604Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd604Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd604Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=v;
}
const list=get('dd604Rows');list.replaceChildren();
for(const c of filterOriginalConfirmations604(p,get('dd604Filter').value,get('dd604Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+c.product_ref+
' · '+(c.renewal_clock?.state||'issuer/witness')+' · '+c.remaining_blockers.length+' gaps';
list.append(li);
}
status.textContent='Original issuer replies, witness dispositions and owner renewals remain unverified · HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact original sections 5–28 first · HOLD.';return null;}};
for(const [id,event] of [['dd604Refresh','click'],['dd604Filter','change'],
['dd604Search','input'],['dd604Case','change']])get(id).addEventListener(event,guard);
get('dd604Save').addEventListener('click',()=>{try{
if(!get('dd604Ack').checked)throw Error('Explicit documentary HOLD required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd604Case').value);
if(!c)throw Error('Current exact case required.');
const v=id=>get(id).value.trim(),date=id=>v(id)?new Date(v(id)).toISOString():'';
const fields=[['original_issuer_confirmation_ref','Receipt'],['issuer_identity_ref','Issuer'],
['issuer_authority_locator_ref','Authority'],['original_digest','Digest'],
['reviewer_ref','Reviewer'],['witness_identity_ref','Witness'],
['witness_disposition_ref','Disposition'],['witness_independent_source_ref','WitnessSource'],
['owner_signer_ref','Signer'],['owner_original_receipt_ref','OwnerOriginal'],
['owner_renewal_receipt_ref','RenewalReceipt'],['owner_account','Account'],
['owner_product','Product'],['owner_action','Scope'],['reason','Reason']];
const row=confirmationCandidate604({case_pin:c.case_pin,exception_code:v('dd604Exception'),
kind:v('dd604Kind'),issuer_state:v('dd604IssuerState'),
witness_state:v('dd604WitnessState'),
...Object.fromEntries(fields.map(([k,id])=>[k,v('dd604'+id)])),
issuer_contacted_at:date('dd604IssuerContact'),issuer_responded_at:date('dd604IssuerReply'),
witness_contacted_at:date('dd604WitnessContact'),witness_disposed_at:date('dd604WitnessAt'),
owner_original_expires_at:date('dd604OriginalExpiry'),
owner_renewal_requested_at:date('dd604RenewalRequested'),
owner_renewed_signed_at:date('dd604RenewedSigned'),
owner_renewed_expires_at:date('dd604RenewalExpiry'),
recorded_at:new Date().toISOString(),next_review_at:date('dd604Due')});
const next=[...stored(),row];reconcileOriginalConfirmations604(...source(),next);
win.localStorage.setItem(KEY_604,JSON.stringify(next));get('dd604Ack').checked=false;refresh();
}catch{status.textContent='Rejected: wrong original issuer, witness or exact owner renewal proof · HOLD.';}});
const prepare=()=>{const p=refresh();get('dd604Handoff').value=JSON.stringify(
unsignedOriginalConfirmation604(p,get('dd604Case').value),null,2);
status.textContent='Unsigned original-source follow-up packet prepared; trial HOLD.';};
get('dd604Prepare').addEventListener('click',()=>{try{prepare();}catch{
status.textContent='Choose a current original source case and retry · HOLD.';}});
const copy=async(kind)=>{try{if(kind==='handoff')prepare();else refresh();
const el=get(kind==='handoff'?'dd604Handoff':'dd604Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unverified issuer/witness/renewal packet copied · HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually · HOLD.';}
}catch{status.textContent='Recompute exact original source before copying · HOLD.';}};
get('dd604Copy').addEventListener('click',()=>copy('queue'));
get('dd604CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init604();


export const FORMAT_605='devilndove-issuer-witness-renewal-handoff-605-v1';
export const KEY_605='dd:issuer-witness-renewal-handoff:605:v1';
export const KINDS_605=['ISSUER_AUTH_FOLLOWUP','WITNESS_DISPOSITION_RECHECK',
'EXACT_OWNER_RENEWAL_HANDOFF'];
export const ISSUER_STATES_605=['AWAITING_ORIGINAL','AUTHORITY_CONTACT_REQUESTED',
'CLAIMED_VERIFIED_UNTRUSTED','ORIGINAL_DISPUTED'];
export const WITNESS_STATES_605=['UNRESOLVED','EXTERNAL_RECHECK_REQUESTED',
'CLAIMED_CLOSED_UNTRUSTED','CONTRADICTORY_RECEIPTS'];
export const FILTERS_605=['ALL','ISSUER','WITNESS','OWNER','EXPIRED','DUE_SOON',
'OVERDUE','CONFLICT','NO_HANDOFF'];
const FIELDS_605=['case_pin','exception_code','issuer_response_ref','issuer_authority_ref',
'issuer_original_receipt_ref','issuer_digest','issuer_verifier_ref',
'issuer_external_callback_ref','witness_disposition_ref','witness_identity_ref',
'witness_reviewer_ref','witness_independent_source_ref','witness_counterevidence_ref',
'owner_original_receipt_ref','owner_renewed_receipt_ref','owner_signer_ref',
'owner_independent_witness_ref','owner_account','owner_product','owner_action',
'owner_handoff_ref','reason'];
const DATES_605=['issuer_callback_at','witness_rechecked_at','owner_renewed_signed_at',
'owner_renewed_expires_at','owner_handoff_due_at','recorded_at','next_review_at'];
export function authenticationFollowupCandidate605(d){
const allowed=new Set([...FIELDS_605,...DATES_605,'kind','issuer_state','witness_state']);
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.has(k))||
FIELDS_605.some(k=>!safe600(d[k],k==='reason'?900:220))||
DATES_605.some(k=>!safe600(d[k],40))||!d.case_pin.startsWith('dd596-case:')||
d.exception_code.length<4||!KINDS_605.includes(d.kind)||
!ISSUER_STATES_605.includes(d.issuer_state)||
!WITNESS_STATES_605.includes(d.witness_state)||!sha600(d.issuer_digest)||
d.reason.trim().length<15||!iso600(d.recorded_at)||!iso600(d.next_review_at)||
DATES_605.slice(0,-2).some(k=>d[k]&&!iso600(d[k]))||
DATES_605.slice(0,-2).filter(k=>!['owner_renewed_expires_at',
'owner_handoff_due_at'].includes(k)).some(k=>d[k]&&
Date.parse(d[k])>Date.parse(d.recorded_at))||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at)||
(d.owner_renewed_signed_at&&d.owner_renewed_expires_at&&
Date.parse(d.owner_renewed_expires_at)<=Date.parse(d.owner_renewed_signed_at)))
throw Error('Unsigned issuer/witness or exact owner evidence cannot authorize provider work.');
return {...Object.fromEntries(FIELDS_605.map(k=>[k,d[k].trim()])),
...Object.fromEntries(DATES_605.map(k=>[k,d[k]])),kind:d.kind,
issuer_state:d.issuer_state,witness_state:d.witness_state,
issuer_authenticated:false,independent_witness_closed:false,
owner_renewal_authenticated:false,trial_authorized:false};
}
export function reconcileAuthenticationHandoff605(exact604,source604,rows=[],
asOf=new Date().toISOString()){
if(exact604?.format!==FORMAT_604||!Array.isArray(source604)||source604.length!==3||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact original-source Build 604 evidence packet required.');
const replay=reconcileOriginalConfirmations604(...source604,exact604.as_of);
if(JSON.stringify(replay)!==JSON.stringify(exact604))
throw Error('Original issuer/witness/renewal source was changed or is stale.');
return reviewAuthenticationHandoff605(
reconcileOriginalConfirmations604(...source604,asOf),rows,asOf);
}

export function reviewAuthenticationHandoff605(current,rows=[],asOf=new Date().toISOString()){
if(current?.format!==FORMAT_604||!Array.isArray(current.cases)||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Validated Build 604 independent receipt cases required.');
const entered=rows.map(authenticationFollowupCandidate605);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const notes=entered.filter(r=>r.case_pin===c.case_pin).map((r,i)=>{
if(!c.open_exceptions.includes(r.exception_code)||
(!owner&&r.kind==='EXACT_OWNER_RENEWAL_HANDOFF')||
(!owner&&[r.owner_original_receipt_ref,r.owner_renewed_receipt_ref,
r.owner_signer_ref,r.owner_independent_witness_ref,r.owner_account,
r.owner_product,r.owner_action,r.owner_handoff_ref,r.owner_renewed_signed_at,
r.owner_renewed_expires_at,r.owner_handoff_due_at].some(Boolean))||
(owner&&(r.owner_account!==c.account_id||r.owner_product!==c.product_ref||
r.owner_action!==c.exact_action)))
throw Error('Wrong exact unresolved issuer/witness case or owner renewal action.');
const priorIssuer=c.issuer_witness_renewal_notes?.filter(
x=>x.kind==='ISSUER_CONFIRMATION').at(-1)||{};
const priorWitness=c.issuer_witness_renewal_notes?.filter(
x=>x.kind==='WITNESS_EXCEPTION_DISPOSITION').at(-1)||{};
const priorOwner=c.issuer_witness_renewal_notes?.filter(
x=>x.kind==='EXACT_OWNER_RENEWAL').at(-1)||{};
const previous=entered.filter(x=>x.case_pin===c.case_pin)[i-1]||null;
const expiry=owner?renewalClock604(r.owner_renewed_signed_at||
priorOwner.owner_renewed_signed_at||'',r.owner_renewed_expires_at||
priorOwner.owner_renewed_expires_at||'',asOf):null;
const reused=key=>r[key]&&entered.some(x=>x.case_pin!==r.case_pin&&
x[key]===r[key]);
const conflicts=uniq600([
r.issuer_response_ref&&priorIssuer.original_issuer_confirmation_ref&&
r.issuer_response_ref!==priorIssuer.original_issuer_confirmation_ref?
'ORIGINAL_ISSUER_RESPONSE_REFERENCE_SUBSTITUTED':null,
r.issuer_original_receipt_ref&&priorIssuer.original_issuer_confirmation_ref&&
r.issuer_original_receipt_ref!==priorIssuer.original_issuer_confirmation_ref?
'ORIGINAL_ISSUER_RECEIPT_CHANGED':null,
r.issuer_digest&&c.source_digest&&r.issuer_digest!==c.source_digest?
'ORIGINAL_ISSUER_DIGEST_CONFLICT':null,
r.issuer_authority_ref&&[r.issuer_response_ref,r.issuer_verifier_ref,
r.issuer_external_callback_ref].includes(r.issuer_authority_ref)?
'ISSUER_AUTHORITY_SELF_REFERENTIAL':null,
r.issuer_verifier_ref&&[r.witness_identity_ref,r.owner_signer_ref,
c.expected_issuer_ref].includes(r.issuer_verifier_ref)?
'ISSUER_VERIFIER_NOT_INDEPENDENT':null,
r.issuer_external_callback_ref&&[r.issuer_response_ref,
r.issuer_original_receipt_ref].includes(r.issuer_external_callback_ref)?
'ISSUER_CALLBACK_REUSES_UNVERIFIED_RECEIPT':null,
reused('issuer_external_callback_ref')?'ISSUER_CALLBACK_REUSED_ACROSS_CASES':null,
r.kind==='ISSUER_AUTH_FOLLOWUP'&&(!r.issuer_response_ref||
!r.issuer_authority_ref||!r.issuer_verifier_ref||
!r.issuer_external_callback_ref||!r.issuer_callback_at)?
'INDEPENDENT_ISSUER_CALLBACK_PROOF_MISSING':null,
r.issuer_state==='CLAIMED_VERIFIED_UNTRUSTED'?
'CLAIMED_ISSUER_AUTHENTICATION_NOT_INDEPENDENTLY_PROVEN':null,
priorIssuer.issuer_state==='DISPUTED_ORIGINAL'&&
r.issuer_state==='CLAIMED_VERIFIED_UNTRUSTED'?
'ISSUER_VERIFICATION_CONFLICTS_WITH_DISPUTED_ORIGINAL':null,
r.witness_identity_ref&&priorWitness.witness_identity_ref&&
r.witness_identity_ref!==priorWitness.witness_identity_ref?
'INDEPENDENT_WITNESS_IDENTITY_SUBSTITUTED':null,
r.witness_identity_ref&&[r.witness_reviewer_ref,r.issuer_verifier_ref,
r.owner_signer_ref].includes(r.witness_identity_ref)?
'WITNESS_NOT_SEPARATE_REVIEW_PARTY':null,
r.witness_disposition_ref&&priorWitness.witness_disposition_ref&&
r.witness_disposition_ref!==priorWitness.witness_disposition_ref?
'WITNESS_DISPOSITION_RECEIPT_CHANGED':null,
r.witness_independent_source_ref&&[r.witness_disposition_ref,
r.witness_identity_ref,r.witness_counterevidence_ref]
.includes(r.witness_independent_source_ref)?
'WITNESS_AUTHORITY_SELF_REFERENTIAL':null,
r.witness_counterevidence_ref&&r.witness_counterevidence_ref===r.witness_disposition_ref?
'WITNESS_COUNTEREVIDENCE_REUSES_DISPOSITION':null,
reused('witness_disposition_ref')?'WITNESS_RECEIPT_REUSED_ACROSS_CASES':null,
previous&&previous.witness_state!==r.witness_state&&
previous.witness_disposition_ref===r.witness_disposition_ref&&
r.witness_disposition_ref?'CONTRADICTORY_WITNESS_STATES_FOR_SAME_RECEIPT':null,
r.kind==='WITNESS_DISPOSITION_RECHECK'&&(!r.witness_disposition_ref||
!r.witness_independent_source_ref||!r.witness_counterevidence_ref||
!r.witness_rechecked_at)?'INDEPENDENT_WITNESS_RECHECK_PROOF_MISSING':null,
r.witness_state==='CLAIMED_CLOSED_UNTRUSTED'?
'CLAIMED_WITNESS_CLOSURE_NOT_INDEPENDENTLY_PROVEN':null,
priorWitness.witness_state==='DISPUTED'&&
r.witness_state==='CLAIMED_CLOSED_UNTRUSTED'?
'WITNESS_CLOSURE_CONTRADICTS_PRIOR_DISPUTE':null,
owner&&r.owner_signer_ref&&c.expected_owner_signer_ref&&
r.owner_signer_ref!==c.expected_owner_signer_ref?'OWNER_SIGNER_IDENTITY_SUBSTITUTED':null,
owner&&r.owner_original_receipt_ref&&priorOwner.owner_original_receipt_ref&&
r.owner_original_receipt_ref!==priorOwner.owner_original_receipt_ref?
'OWNER_ORIGINAL_SIGNOFF_RECEIPT_SUBSTITUTED':null,
owner&&r.owner_renewed_receipt_ref&&priorOwner.owner_renewal_receipt_ref&&
r.owner_renewed_receipt_ref!==priorOwner.owner_renewal_receipt_ref?
'OWNER_RENEWED_RECEIPT_SUBSTITUTED':null,
owner&&r.owner_renewed_signed_at&&priorOwner.owner_renewed_signed_at&&
r.owner_renewed_signed_at!==priorOwner.owner_renewed_signed_at?
'OWNER_RENEWED_SIGNATURE_TIME_CHANGED':null,
owner&&r.owner_renewed_expires_at&&priorOwner.owner_renewed_expires_at&&
r.owner_renewed_expires_at!==priorOwner.owner_renewed_expires_at?
'OWNER_RENEWAL_EXPIRY_REWRITTEN':null,
owner&&r.owner_renewed_receipt_ref&&r.owner_renewed_receipt_ref===r.owner_original_receipt_ref?
'OWNER_OLD_SIGNOFF_REUSED':null,
owner&&r.owner_independent_witness_ref&&[
r.owner_signer_ref,r.witness_reviewer_ref,r.issuer_verifier_ref]
.includes(r.owner_independent_witness_ref)?
'OWNER_SIGNOFF_WITNESS_NOT_INDEPENDENT':null,
owner&&r.owner_handoff_ref&&[r.owner_original_receipt_ref,
r.owner_renewed_receipt_ref,r.witness_disposition_ref].includes(r.owner_handoff_ref)?
'OWNER_HANDOFF_NOT_SEPARATE_RECORD':null,
reused('owner_handoff_ref')?'OWNER_HANDOFF_REUSED_ACROSS_CASES':null,
owner&&expiry?.state==='RENEWAL_EXPIRED'?'OWNER_RENEWED_SIGNOFF_EXPIRED':null,
owner&&expiry?.state==='RENEWAL_EXPIRES_WITHIN_72H'?
'OWNER_RENEWAL_WITNESS_RECHECK_DUE':null,
r.kind==='EXACT_OWNER_RENEWAL_HANDOFF'&&(!r.owner_handoff_ref||
!r.owner_renewed_receipt_ref||!r.owner_independent_witness_ref||
!r.owner_renewed_signed_at||!r.owner_renewed_expires_at)?
'EXACT_OWNER_RENEWAL_HANDOFF_UNSIGNED_OR_INCOMPLETE':null
]);
return {...r,conflicts,renewal_expiry:expiry,issuer_authenticated:false,
independent_witness_closed:false,owner_renewal_authenticated:false,
trial_authorized:false,provider_reads:0,provider_writes:0,d1_operations:0};
});
const latest=notes.at(-1)||null;
const priorOwner=c.issuer_witness_renewal_notes?.filter(
x=>x.kind==='EXACT_OWNER_RENEWAL').at(-1)||{};
const latestOwner=notes.filter(x=>x.kind==='EXACT_OWNER_RENEWAL_HANDOFF').at(-1);
const clock=owner?renewalClock604(latestOwner?.owner_renewed_signed_at||
priorOwner.owner_renewed_signed_at||'',latestOwner?.owner_renewed_expires_at||
priorOwner.owner_renewed_expires_at||'',asOf):null;
const blockers=uniq600([...c.remaining_blockers,...notes.flatMap(n=>n.conflicts),
!notes.some(n=>n.kind==='ISSUER_AUTH_FOLLOWUP')?
'EXTERNAL_ISSUER_AUTHENTICATION_FOLLOWUP_NOT_RECORDED':null,
!notes.some(n=>n.kind==='WITNESS_DISPOSITION_RECHECK')?
'WITNESS_DISPOSITION_INDEPENDENT_RECHECK_NOT_RECORDED':null,
owner&&!latestOwner?'EXACT_OWNER_RENEWAL_HANDOFF_NOT_RECORDED':null]);
return {...c,issuer_auth_witness_owner_handoffs:notes,latest_auth_handoff:latest,
renewal_clock:clock,remaining_blockers:blockers,
aging:aging600(latest?.next_review_at||c.aging?.due_at||'',asOf),
issuer_authenticated:false,independent_witness_closed:false,
owner_renewal_authenticated:false,trial_authorized:false,
status:'ISSUER_WITNESS_AND_EXACT_OWNER_RENEWAL_EXTERNAL_AUTH_HOLD'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_605,build:605,source_build:604,as_of:asOf,cases,
open_cases:cases.length,issuer_authentication_gaps:cases.filter(c=>c.remaining_blockers.some(
x=>/ISSUER_AUTHENTICATION|ISSUER_CALLBACK/.test(x))).length,
witness_disposition_conflicts:cases.filter(c=>c.remaining_blockers.some(
x=>/WITNESS|CONTRADICTORY/.test(x))).length,
owner_renewal_expired:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRED').length,
owner_renewal_due:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H').length,
overdue_reviews:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
stale_unmatched_notes:entered.filter(r=>!pins.has(r.case_pin)),
independently_authenticated_issuers:0,independent_witness_closures:0,
verified_owner_renewals:0,authorized_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_EXTERNAL_ISSUER_CALLBACK_WITNESS_DISPOSITION_EXACT_OWNER_RENEWAL'};
}
export function filterAuthenticationHandoff605(p,kind='ALL',term=''){
if(p?.format!==FORMAT_605||!FILTERS_605.includes(kind)||!safe600(term,120))
throw Error('Invalid Build 605 exact-source authentication handoff filter.');
const q=term.trim().toLowerCase();
return p.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&c.remaining_blockers.some(x=>/ISSUER/.test(x)))||
(kind==='WITNESS'&&c.remaining_blockers.some(x=>/WITNESS|CONTRADICTORY/.test(x)))||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='EXPIRED'&&c.renewal_clock?.state==='RENEWAL_EXPIRED')||
(kind==='DUE_SOON'&&c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H')||
(kind==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='CONFLICT'&&c.issuer_auth_witness_owner_handoffs.some(n=>n.conflicts.length))||
(kind==='NO_HANDOFF'&&!c.issuer_auth_witness_owner_handoffs.length))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedAuthenticationHandoff605(p,pin){
if(p?.format!==FORMAT_605)throw Error('Exact Build 605 source-pinned packet required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Unresolved source-pinned issuer/witness/owner handoff required.');
return {format:'devilndove-unsigned-independent-authentication-handoff-605-v1',
build:605,source_build:604,case_pin:pin,prepared_at:p.as_of,
channel:c.channel,exact_shop_account:c.account_id,exact_product_sku:c.product_ref,
exact_action:c.exact_action,original_source_digest:c.source_digest,
issuer_authentication_followups:c.issuer_auth_witness_owner_handoffs.filter(n=>
n.kind==='ISSUER_AUTH_FOLLOWUP'),
witness_disposition_rechecks:c.issuer_auth_witness_owner_handoffs.filter(n=>
n.kind==='WITNESS_DISPOSITION_RECHECK'),
owner_renewal_handoffs:c.issuer_auth_witness_owner_handoffs.filter(n=>
n.kind==='EXACT_OWNER_RENEWAL_HANDOFF'),
owner_renewal_expiry:c.renewal_clock,remaining_blockers:c.remaining_blockers,
external_requirements:['Authenticate original issuer callback and receipt via a trusted channel',
'Independently reconcile conflicting witness disposition originals',
...(c.owner_trial_decision_pending?
['Obtain exact signed, unexpired owner renewal and a separate witness confirmation']:[])],
issuer_authenticated:false,independent_witness_closed:false,
owner_renewal_authenticated:false,trial_authorized:false,
provider_read_or_write_authorized:false,status:'UNSIGNED_EXTERNAL_AUTH_AND_OWNER_HANDOFF_HOLD'};
}
function init605(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd605Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd605Status'),output=get('dd605Output');
const read=(key,fallback)=>{const v=win.localStorage.getItem(key);return v?JSON.parse(v):fallback;};
const stored=()=>read(KEY_605,[]);
let previousPin=null;
const source=()=>{
const v=['dd604Output','dd603Output','dd602Output','dd601Output',
'dd600Output','dd599Output','dd598Output','dd597Output']
.map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute exact original sections 5–29.');
const s599=[JSON.parse(v[5]),[JSON.parse(v[6]),
[JSON.parse(v[7]),sourceContext597(doc,win),read(KEY_597,[])],read(KEY_598,[])],
read(KEY_599,[])];
const s601=[JSON.parse(v[4]),s599,read(KEY_600,[])];
const s602=[JSON.parse(v[3]),s601,read(KEY_601,[])];
const s603=[JSON.parse(v[2]),s602,read(KEY_602,[]),read(KEY_603,[])];
return [JSON.parse(v[0]),[JSON.parse(v[1]),s603,read(KEY_604,[])]];
};
const refresh=()=>{
const p=reconcileAuthenticationHandoff605(...source(),stored());
output.value=JSON.stringify(p,null,2);
get('dd605Metrics').textContent=p.open_cases+' open · '+p.issuer_authentication_gaps+
' issuer gaps · '+p.witness_disposition_conflicts+' witness conflicts · '+
p.owner_renewal_expired+' expired · '+p.owner_renewal_due+' renewal due · HOLD';
const select=get('dd605Case'),old=select.value;select.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;select.append(o);}
if([...select.options].some(o=>o.value===old))select.value=old;
const c=p.cases.find(x=>x.case_pin===select.value),exception=get('dd605Exception');
const prior=exception.value;exception.replaceChildren();
for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');exception.append(o);}
if([...exception.options].some(o=>o.value===prior))exception.value=prior;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd605Kind').value=c?.owner_trial_decision_pending?
'EXACT_OWNER_RENEWAL_HANDOFF':'ISSUER_AUTH_FOLLOWUP';
for(const [id,v] of [['dd605Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd605Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd605Scope',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=v;
}
const list=get('dd605Rows');list.replaceChildren();
for(const c of filterAuthenticationHandoff605(p,get('dd605Filter').value,
get('dd605Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+
c.product_ref+' · '+(c.renewal_clock?.state||'issuer/witness')+' · '+
c.remaining_blockers.length+' remaining gaps';list.append(li);
}
status.textContent='Original issuer, independent witness and owner renewal still unverified · HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact original sections 5–29 first · HOLD.';return null;}};
for(const [id,event] of [['dd605Refresh','click'],['dd605Filter','change'],
['dd605Search','input'],['dd605Case','change']])get(id).addEventListener(event,guard);
get('dd605Save').addEventListener('click',()=>{try{
if(!get('dd605Ack').checked)throw Error('Unverified HOLD acknowledgment required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd605Case').value);
if(!c)throw Error('Current original-source case required.');
const v=id=>get(id).value.trim(),date=id=>v(id)?new Date(v(id)).toISOString():'';
const fields=[['issuer_response_ref','IssuerResponse'],['issuer_authority_ref','IssuerAuthority'],
['issuer_original_receipt_ref','IssuerOriginal'],['issuer_digest','IssuerDigest'],
['issuer_verifier_ref','IssuerVerifier'],['issuer_external_callback_ref','IssuerCallback'],
['witness_disposition_ref','WitnessDisposition'],['witness_identity_ref','WitnessIdentity'],
['witness_reviewer_ref','WitnessReviewer'],['witness_independent_source_ref','WitnessSource'],
['witness_counterevidence_ref','WitnessCounter'],['owner_original_receipt_ref','OwnerOriginal'],
['owner_renewed_receipt_ref','OwnerRenewed'],['owner_signer_ref','OwnerSigner'],
['owner_independent_witness_ref','OwnerWitness'],['owner_account','Account'],
['owner_product','Product'],['owner_action','Scope'],['owner_handoff_ref','OwnerHandoff'],
['reason','Reason']];
const row=authenticationFollowupCandidate605({case_pin:c.case_pin,
exception_code:v('dd605Exception'),kind:v('dd605Kind'),
issuer_state:v('dd605IssuerState'),witness_state:v('dd605WitnessState'),
...Object.fromEntries(fields.map(([k,id])=>[k,v('dd605'+id)])),
issuer_callback_at:date('dd605IssuerAt'),witness_rechecked_at:date('dd605WitnessAt'),
owner_renewed_signed_at:date('dd605OwnerSigned'),
owner_renewed_expires_at:date('dd605OwnerExpires'),
owner_handoff_due_at:date('dd605OwnerDue'),
recorded_at:new Date().toISOString(),next_review_at:date('dd605Due')});
const next=[...stored(),row];reconcileAuthenticationHandoff605(...source(),next);
win.localStorage.setItem(KEY_605,JSON.stringify(next));get('dd605Ack').checked=false;refresh();
}catch{status.textContent='Rejected: stale, substituted or unsafe original proof · HOLD.';}});
const prepare=()=>{const p=refresh();get('dd605Handoff').value=JSON.stringify(
unsignedAuthenticationHandoff605(p,get('dd605Case').value),null,2);
status.textContent='Unsigned source-pinned external evidence handoff prepared · HOLD.';};
get('dd605Prepare').addEventListener('click',()=>{try{prepare();}catch{
status.textContent='Select current original issuer/witness/owner case · HOLD.';}});
const copy=async(kind)=>{try{if(kind==='handoff')prepare();else refresh();
const el=get(kind==='handoff'?'dd605Handoff':'dd605Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unverified source-pinned handoff copied · HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually · HOLD.';}
}catch{status.textContent='Recompute exact original source before copying · HOLD.';}};
get('dd605Copy').addEventListener('click',()=>copy('queue'));
get('dd605CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init605();


export const FORMAT_606='devilndove-issuer-challenge-witness-consent-606-v1';
export const KEY_606='dd:issuer-challenge-witness-consent:606:v1';
export const KINDS_606=['ISSUER_CALLBACK_CHALLENGE','WITNESS_REVERIFICATION',
'OWNER_CONSENT_READINESS'];
export const CHALLENGE_STATES_606=['NOT_SENT','SENT_AWAITING_REPLY',
'REPORTED_MATCH_UNVERIFIED','DISPUTED'];
export const WITNESS_STATES_606=['PENDING','REPORTED_REVERIFIED_UNTRUSTED','IDENTITY_CONFLICT'];
export const OWNER_STATES_606=['RENEWAL_REQUESTED','REPORTED_SIGNED_UNVERIFIED','EXPIRED'];
export const FILTERS_606=['ALL','CHALLENGE','CHALLENGE_EXPIRED','WITNESS','OWNER',
'OWNER_EXPIRED','OWNER_DUE','OVERDUE','CONFLICT'];
const FIELDS_606=['case_pin','exception_code','challenge_ref','challenge_digest',
'issuer_authority_ref','callback_channel_ref','response_receipt_ref','issuer_verifier_ref',
'witness_identity_ref','witness_authority_ref','witness_reverification_ref',
'witness_reviewer_ref','owner_signer_ref','owner_signed_receipt_ref',
'owner_witness_ref','owner_account','owner_product','owner_action','reason'];
const DATES_606=['challenge_sent_at','response_received_at','challenge_expires_at',
'witness_reverified_at','owner_signed_at','owner_expires_at',
'owner_consent_review_due_at','recorded_at','next_review_at'];
export function challengeReviewCandidate606(d){
if(!d||Array.isArray(d)||Object.keys(d).some(k=>![...FIELDS_606,...DATES_606,
'kind','challenge_state','witness_state','owner_state'].includes(k))||
FIELDS_606.some(k=>!safe600(d[k],k==='reason'?900:220))||
DATES_606.some(k=>!safe600(d[k],40))||!d.case_pin.startsWith('dd596-case:')||
d.exception_code.length<4||!sha600(d.challenge_digest)||
!KINDS_606.includes(d.kind)||!CHALLENGE_STATES_606.includes(d.challenge_state)||
!WITNESS_STATES_606.includes(d.witness_state)||
!OWNER_STATES_606.includes(d.owner_state)||d.reason.trim().length<15||
!iso600(d.recorded_at)||!iso600(d.next_review_at)||
DATES_606.slice(0,-2).some(k=>d[k]&&!iso600(d[k]))||
DATES_606.slice(0,-2).filter(k=>!['challenge_expires_at','owner_expires_at',
'owner_consent_review_due_at'].includes(k)).some(k=>d[k]&&
Date.parse(d[k])>Date.parse(d.recorded_at))||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at)||
(d.challenge_sent_at&&d.response_received_at&&
Date.parse(d.response_received_at)<Date.parse(d.challenge_sent_at))||
(d.challenge_sent_at&&d.challenge_expires_at&&
Date.parse(d.challenge_expires_at)<=Date.parse(d.challenge_sent_at))||
(d.owner_signed_at&&d.owner_expires_at&&
Date.parse(d.owner_expires_at)<=Date.parse(d.owner_signed_at)))
throw Error('Unverified challenge, witness or exact consent cannot authorize provider work.');
return {...Object.fromEntries(FIELDS_606.map(k=>[k,d[k].trim()])),
...Object.fromEntries(DATES_606.map(k=>[k,d[k]])),kind:d.kind,
challenge_state:d.challenge_state,witness_state:d.witness_state,
owner_state:d.owner_state,issuer_authenticated:false,witness_reverified:false,
owner_consent_authenticated:false,trial_authorized:false};
}
export function reconcileChallengeReadiness606(exact605,source605,rows=[],
asOf=new Date().toISOString()){
if(exact605?.format!==FORMAT_605||!Array.isArray(source605)||source605.length!==3||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact source-pinned Build 605 callback/witness chain required.');
const replay=reconcileAuthenticationHandoff605(...source605,exact605.as_of);
if(JSON.stringify(replay)!==JSON.stringify(exact605))
throw Error('Original Build 605 issuer/witness/owner source changed or became stale.');
return reviewChallengeReadiness606(
reconcileAuthenticationHandoff605(...source605,asOf),rows,asOf);
}
export function reviewChallengeReadiness606(current,rows=[],asOf=new Date().toISOString()){
if(current?.format!==FORMAT_605||!Array.isArray(current.cases)||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Validated Build 605 exact original-source cases required.');
const entered=rows.map(challengeReviewCandidate606);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const notes=entered.filter(n=>n.case_pin===c.case_pin).map(n=>{
if(!c.open_exceptions.includes(n.exception_code)||
(!owner&&n.kind==='OWNER_CONSENT_READINESS')||
(!owner&&[n.owner_signer_ref,n.owner_signed_receipt_ref,n.owner_witness_ref,
n.owner_account,n.owner_product,n.owner_action,n.owner_signed_at,
n.owner_expires_at,n.owner_consent_review_due_at].some(Boolean))||
(owner&&(n.owner_account!==c.account_id||n.owner_product!==c.product_ref||
n.owner_action!==c.exact_action)))
throw Error('Wrong unresolved original issuer, witness or exact owner action.');
const priorIssuer=c.issuer_auth_witness_owner_handoffs?.filter(
x=>x.kind==='ISSUER_AUTH_FOLLOWUP').at(-1)||{};
const priorWitness=c.issuer_auth_witness_owner_handoffs?.filter(
x=>x.kind==='WITNESS_DISPOSITION_RECHECK').at(-1)||{};
const priorOwner=c.issuer_auth_witness_owner_handoffs?.filter(
x=>x.kind==='EXACT_OWNER_RENEWAL_HANDOFF').at(-1)||{};
const reused=key=>n[key]&&entered.some(x=>x.case_pin!==n.case_pin&&
x[key]===n[key]);
const expired=n.challenge_expires_at&&
Date.parse(n.challenge_expires_at)<=Date.parse(asOf);
const expiry=owner?renewalClock604(n.owner_signed_at||
priorOwner.owner_renewed_signed_at||'',n.owner_expires_at||
priorOwner.owner_renewed_expires_at||'',asOf):null;
const conflicts=uniq600([
n.kind==='ISSUER_CALLBACK_CHALLENGE'&&(!n.challenge_ref||
!n.challenge_digest||!n.issuer_authority_ref||!n.callback_channel_ref||
!n.issuer_verifier_ref||!n.challenge_sent_at||!n.challenge_expires_at)?
'ISSUER_CALLBACK_CHALLENGE_DETAILS_MISSING':null,
n.challenge_state==='REPORTED_MATCH_UNVERIFIED'&&
(!n.response_receipt_ref||!n.response_received_at)?
'REPORTED_CALLBACK_RESPONSE_MISSING_ORIGINAL_RECEIPT':null,
n.challenge_state==='REPORTED_MATCH_UNVERIFIED'?
'REPORTED_CALLBACK_MATCH_NOT_AUTHENTICATED':null,
expired?'ISSUER_CALLBACK_CHALLENGE_EXPIRED':null,
n.challenge_expires_at&&n.response_received_at&&
Date.parse(n.response_received_at)>Date.parse(n.challenge_expires_at)?
'ISSUER_RESPONSE_AFTER_CHALLENGE_EXPIRY':null,
n.issuer_authority_ref&&[n.challenge_ref,n.response_receipt_ref,
n.callback_channel_ref].includes(n.issuer_authority_ref)?
'ISSUER_CHALLENGE_AUTHORITY_SELF_REFERENTIAL':null,
n.issuer_verifier_ref&&[n.witness_identity_ref,n.witness_reviewer_ref,
n.owner_signer_ref,c.expected_issuer_ref].includes(n.issuer_verifier_ref)?
'ISSUER_CHALLENGE_VERIFIER_NOT_INDEPENDENT':null,
n.response_receipt_ref&&n.response_receipt_ref===priorIssuer.issuer_original_receipt_ref?
'ISSUER_CALLBACK_REUSES_ORIGINAL_RECEIPT':null,
reused('challenge_ref')?'CHALLENGE_IDENTIFIER_REUSED_ACROSS_CASES':null,
reused('response_receipt_ref')?'ISSUER_RESPONSE_REUSED_ACROSS_CASES':null,
n.kind==='WITNESS_REVERIFICATION'&&(!n.witness_identity_ref||
!n.witness_authority_ref||!n.witness_reverification_ref||
!n.witness_reviewer_ref||!n.witness_reverified_at)?
'INDEPENDENT_WITNESS_REVERIFICATION_DETAILS_MISSING':null,
n.witness_identity_ref&&priorWitness.witness_identity_ref&&
n.witness_identity_ref!==priorWitness.witness_identity_ref?
'WITNESS_IDENTITY_CHANGED_SINCE_ORIGINAL':null,
n.witness_identity_ref&&[n.witness_reviewer_ref,n.issuer_verifier_ref,
n.owner_signer_ref].includes(n.witness_identity_ref)?
'WITNESS_REVERIFIER_NOT_SEPARATE':null,
n.witness_authority_ref&&[n.witness_identity_ref,n.witness_reverification_ref]
.includes(n.witness_authority_ref)?'WITNESS_AUTHORITY_SELF_REFERENTIAL':null,
n.witness_state==='REPORTED_REVERIFIED_UNTRUSTED'?
'REPORTED_WITNESS_REVERIFICATION_NOT_AUTHENTICATED':null,
reused('witness_reverification_ref')?'WITNESS_REVERIFICATION_REUSED_ACROSS_CASES':null,
owner&&n.owner_signer_ref&&c.expected_owner_signer_ref&&
n.owner_signer_ref!==c.expected_owner_signer_ref?
'EXACT_OWNER_SIGNER_SUBSTITUTED':null,
owner&&n.owner_signed_receipt_ref&&priorOwner.owner_renewed_receipt_ref&&
n.owner_signed_receipt_ref!==priorOwner.owner_renewed_receipt_ref?
'OWNER_RENEWED_RECEIPT_CHANGED_SINCE_HANDOFF':null,
owner&&n.owner_witness_ref&&[n.owner_signer_ref,n.witness_reviewer_ref,
n.issuer_verifier_ref].includes(n.owner_witness_ref)?
'OWNER_RENEWAL_WITNESS_NOT_INDEPENDENT':null,
owner&&n.owner_signed_receipt_ref&&n.owner_signed_receipt_ref===
priorOwner.owner_original_receipt_ref?'OWNER_ORIGINAL_SIGNOFF_REUSED':null,
owner&&expiry?.state==='RENEWAL_EXPIRED'?'OWNER_RENEWAL_CONSENT_EXPIRED':null,
owner&&expiry?.state==='RENEWAL_EXPIRES_WITHIN_72H'?
'OWNER_RENEWAL_CONSENT_EXPIRING':null,
n.owner_state==='REPORTED_SIGNED_UNVERIFIED'?
'CLAIMED_SIGNED_OWNER_CONSENT_NOT_AUTHENTICATED':null,
n.kind==='OWNER_CONSENT_READINESS'&&(!n.owner_signed_receipt_ref||
!n.owner_signer_ref||!n.owner_witness_ref||!n.owner_signed_at||
!n.owner_expires_at)?'OWNER_RENEWAL_CONSENT_PROOF_MISSING':null
]);
return {...n,conflicts,challenge_expired:Boolean(expired),
renewal_expiry:expiry,issuer_authenticated:false,witness_reverified:false,
owner_consent_authenticated:false,trial_authorized:false,
provider_reads:0,provider_writes:0,d1_operations:0};
});
const latest=notes.at(-1)||null;
const priorOwner=c.issuer_auth_witness_owner_handoffs?.filter(
x=>x.kind==='EXACT_OWNER_RENEWAL_HANDOFF').at(-1)||{};
const latestOwner=notes.filter(x=>x.kind==='OWNER_CONSENT_READINESS').at(-1);
const clock=owner?renewalClock604(latestOwner?.owner_signed_at||
priorOwner.owner_renewed_signed_at||'',latestOwner?.owner_expires_at||
priorOwner.owner_renewed_expires_at||'',asOf):null;
const blockers=uniq600([...c.remaining_blockers,...notes.flatMap(n=>n.conflicts),
!notes.some(n=>n.kind==='ISSUER_CALLBACK_CHALLENGE')?
'ORIGINAL_ISSUER_CALLBACK_CHALLENGE_NOT_RECORDED':null,
!notes.some(n=>n.kind==='WITNESS_REVERIFICATION')?
'INDEPENDENT_WITNESS_REVERIFICATION_NOT_RECORDED':null,
owner&&!latestOwner?'EXACT_OWNER_RENEWAL_CONSENT_REVIEW_NOT_RECORDED':null]);
return {...c,challenge_witness_consent_notes:notes,latest_challenge_review:latest,
renewal_clock:clock,remaining_blockers:blockers,
aging:aging600(latest?.next_review_at||c.aging?.due_at||'',asOf),
issuer_authenticated:false,independent_witness_closed:false,
owner_consent_authenticated:false,trial_authorized:false,
status:'ORIGINAL_ISSUER_CHALLENGE_WITNESS_OWNER_CONSENT_HOLD'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_606,build:606,source_build:605,as_of:asOf,cases,
open_cases:cases.length,expired_challenges:cases.filter(c=>
c.challenge_witness_consent_notes.some(n=>n.challenge_expired)).length,
witness_conflicts:cases.filter(c=>c.remaining_blockers.some(x=>
/WITNESS|REVERIFICATION/.test(x))).length,
consent_expired:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRED').length,
consent_due:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H').length,
overdue_reviews:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
stale_unmatched_notes:entered.filter(n=>!pins.has(n.case_pin)),
issuer_authenticated:0,independent_witness_verified:0,
owner_consent_authenticated:0,authorized_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_ISSUER_CALLBACK_CHALLENGE_WITNESS_AND_EXACT_OWNER_CONSENT'};
}
export function filterChallengeReadiness606(p,kind='ALL',term=''){
if(p?.format!==FORMAT_606||!FILTERS_606.includes(kind)||!safe600(term,120))
throw Error('Invalid Build 606 source-pinned challenge filter.');
const q=term.trim().toLowerCase();
return p.cases.filter(c=>(kind==='ALL'||
(kind==='CHALLENGE'&&c.remaining_blockers.some(x=>/ISSUER|CHALLENGE/.test(x)))||
(kind==='CHALLENGE_EXPIRED'&&c.challenge_witness_consent_notes.some(n=>n.challenge_expired))||
(kind==='WITNESS'&&c.remaining_blockers.some(x=>/WITNESS|REVERIFICATION/.test(x)))||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='OWNER_EXPIRED'&&c.renewal_clock?.state==='RENEWAL_EXPIRED')||
(kind==='OWNER_DUE'&&c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H')||
(kind==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='CONFLICT'&&c.challenge_witness_consent_notes.some(n=>n.conflicts.length)))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedChallengeHandoff606(p,pin){
if(p?.format!==FORMAT_606)throw Error('Validated Build 606 source required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Exact original-source issuer/witness/owner case required.');
return {format:'devilndove-unsigned-issuer-callback-owner-consent-606-v1',
build:606,source_build:605,case_pin:pin,prepared_at:p.as_of,
channel:c.channel,exact_shop_account:c.account_id,
exact_product_sku:c.product_ref,exact_action:c.exact_action,
original_source_digest:c.source_digest,
issuer_callback_challenges:c.challenge_witness_consent_notes.filter(n=>
n.kind==='ISSUER_CALLBACK_CHALLENGE'),
independent_witness_reverification:c.challenge_witness_consent_notes.filter(n=>
n.kind==='WITNESS_REVERIFICATION'),
exact_owner_consent_readiness:c.challenge_witness_consent_notes.filter(n=>
n.kind==='OWNER_CONSENT_READINESS'),
owner_renewal_clock:c.renewal_clock,remaining_blockers:c.remaining_blockers,
external_requirements:['Trusted issuer must independently confirm original callback response',
'Separate witness must independently verify original identity and disposition',
...(c.owner_trial_decision_pending?
['Exact owner must separately authenticate signed, unexpired, scoped consent']:[])],
issuer_authenticated:false,independent_witness_verified:false,
owner_consent_authenticated:false,trial_authorized:false,
provider_read_or_write_authorized:false,status:'UNSIGNED_CHALLENGE_AND_CONSENT_HOLD'};
}
function init606(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd606Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd606Status'),output=get('dd606Output');
const read=(key,defaultValue)=>{const v=win.localStorage.getItem(key);
return v?JSON.parse(v):defaultValue;};
const stored=()=>read(KEY_606,[]);
let previousPin=null;
const source=()=>{
const v=['dd605Output','dd604Output','dd603Output','dd602Output',
'dd601Output','dd600Output','dd599Output','dd598Output','dd597Output']
.map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute original sections 5–30.');
const s599=[JSON.parse(v[6]),[JSON.parse(v[7]),
[JSON.parse(v[8]),sourceContext597(doc,win),read(KEY_597,[])],
read(KEY_598,[])],read(KEY_599,[])];
const s601=[JSON.parse(v[5]),s599,read(KEY_600,[])];
const s602=[JSON.parse(v[4]),s601,read(KEY_601,[])];
const s603=[JSON.parse(v[3]),s602,read(KEY_602,[]),read(KEY_603,[])];
const s604=[JSON.parse(v[1]),[JSON.parse(v[2]),s603,read(KEY_604,[])]];
return [JSON.parse(v[0]),s604.concat([read(KEY_605,[])])];
};
const refresh=()=>{
const [exact,chain]=source();
const p=reconcileChallengeReadiness606(exact,chain,stored());
output.value=JSON.stringify(p,null,2);
get('dd606Metrics').textContent=p.open_cases+' open · '+p.expired_challenges+
' expired challenges · '+p.witness_conflicts+' witness gaps · '+
p.consent_expired+' expired consent · '+p.consent_due+' due soon · HOLD';
const select=get('dd606Case'),old=select.value;select.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;select.append(o);}
if([...select.options].some(o=>o.value===old))select.value=old;
const c=p.cases.find(x=>x.case_pin===select.value),exception=get('dd606Exception');
const prior=exception.value;exception.replaceChildren();
for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');exception.append(o);}
if([...exception.options].some(o=>o.value===prior))exception.value=prior;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd606Kind').value=c?.owner_trial_decision_pending?
'OWNER_CONSENT_READINESS':'ISSUER_CALLBACK_CHALLENGE';
for(const [id,value] of [['dd606Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd606Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd606Action',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=value;
}
const list=get('dd606Rows');list.replaceChildren();
for(const c of filterChallengeReadiness606(p,get('dd606Filter').value,
get('dd606Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+
' · '+c.product_ref+' · '+(c.renewal_clock?.state||'issuer/witness')+
' · '+c.remaining_blockers.length+' unresolved';list.append(li);}
status.textContent='External callback, witness reverification and owner consent HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact original sections 5–30 first · HOLD.';return null;}};
for(const [id,event] of [['dd606Refresh','click'],['dd606Filter','change'],
['dd606Search','input'],['dd606Case','change']])get(id).addEventListener(event,guard);
get('dd606Save').addEventListener('click',()=>{try{
if(!get('dd606Ack').checked)throw Error('Explicit unverified HOLD required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd606Case').value);
if(!c)throw Error('Exact original source-pinned case required.');
const v=id=>get(id).value.trim(),date=id=>v(id)?new Date(v(id)).toISOString():'';
const fields=[['challenge_ref','Challenge'],['challenge_digest','ChallengeHash'],
['issuer_authority_ref','Authority'],['callback_channel_ref','CallbackChannel'],
['response_receipt_ref','Response'],['issuer_verifier_ref','Verifier'],
['witness_identity_ref','Witness'],['witness_authority_ref','WitnessAuthority'],
['witness_reverification_ref','WitnessReceipt'],['witness_reviewer_ref','WitnessReviewer'],
['owner_signer_ref','Signer'],['owner_signed_receipt_ref','OwnerReceipt'],
['owner_witness_ref','OwnerWitness'],['owner_account','Account'],
['owner_product','Product'],['owner_action','Action'],['reason','Reason']];
const candidate=challengeReviewCandidate606({case_pin:c.case_pin,
exception_code:v('dd606Exception'),kind:v('dd606Kind'),
challenge_state:v('dd606ChallengeState'),witness_state:v('dd606WitnessState'),
owner_state:v('dd606OwnerState'),
...Object.fromEntries(fields.map(([key,id])=>[key,v('dd606'+id)])),
challenge_sent_at:date('dd606Sent'),response_received_at:date('dd606Responded'),
challenge_expires_at:date('dd606Expires'),witness_reverified_at:date('dd606WitnessAt'),
owner_signed_at:date('dd606OwnerSigned'),owner_expires_at:date('dd606OwnerExpires'),
owner_consent_review_due_at:date('dd606OwnerDue'),
recorded_at:new Date().toISOString(),next_review_at:date('dd606Due')});
const next=[...stored(),candidate], [exact,chain]=source();
reconcileChallengeReadiness606(exact,chain,next);
win.localStorage.setItem(KEY_606,JSON.stringify(next));get('dd606Ack').checked=false;refresh();
}catch{status.textContent='Rejected: stale original, invalid challenge or consent scope · HOLD.';}});
const prepare=()=>{const p=refresh();get('dd606Handoff').value=JSON.stringify(
unsignedChallengeHandoff606(p,get('dd606Case').value),null,2);
status.textContent='Unsigned exact original-source handoff prepared · HOLD.';};
get('dd606Prepare').addEventListener('click',()=>{try{prepare();}catch{
status.textContent='Choose exact original-source case · HOLD.';}});
const copy=async(kind)=>{try{if(kind==='handoff')prepare();else refresh();
const el=get(kind==='handoff'?'dd606Handoff':'dd606Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unsigned documentary packet copied · HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually · HOLD.';}
}catch{status.textContent='Recompute original-source chain before copying · HOLD.';}};
get('dd606Copy').addEventListener('click',()=>copy('queue'));
get('dd606CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init606();

export const FORMAT_607='devilndove-issuer-outcome-witness-owner-decision-607-v1';
export const KEY_607='dd:issuer-outcome-witness-owner-decision:607:v1';
export const KINDS_607=['ISSUER_CALLBACK_OUTCOME','WITNESS_IDENTITY_CONFLICT',
'EXACT_OWNER_CONSENT_DECISION'];
export const ISSUER_607=['AWAITING_ORIGINAL','REPORTED_MATCH_UNVERIFIED',
'REPORTED_MISMATCH','NO_ORIGINAL_REPLY'];
export const WITNESS_607=['IDENTITY_RECHECK_OPEN','REPORTED_RECONCILED_UNVERIFIED',
'CONFLICT_ESCALATED'];
export const OWNER_607=['RENEWAL_NOT_RECEIVED','REPORTED_SIGNED_UNVERIFIED',
'DECLINED','EXPIRED_OR_REVOKED'];
export const FILTERS_607=['ALL','ISSUER','WITNESS','OWNER','DISPUTED',
'CONSENT_EXPIRED','CONSENT_DUE','OVERDUE','NO_OUTCOME'];
const FIELDS_607=['case_pin','exception_code','challenge_ref','issuer_outcome_ref',
'original_response_ref','original_issuer_authority_ref','issuer_reviewer_ref',
'witness_original_identity_ref','witness_current_identity_ref',
'witness_authority_ref','witness_conflict_receipt_ref','witness_reviewer_ref',
'owner_signer_ref','owner_signed_receipt_ref','owner_independent_witness_ref',
'owner_account','owner_product','owner_action','owner_decision_ref','reason'];
const DATES_607=['issuer_outcome_at','witness_conflict_reviewed_at',
'owner_signed_at','owner_expires_at','recorded_at','next_review_at'];
const safe607=(s,n=220)=>typeof s==='string'&&s.length<=n&&
!/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=]|private[_ -]?key)/i.test(s);
const iso607=s=>typeof s==='string'&&
/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s)&&
Number.isFinite(Date.parse(s));
const uniq607=a=>[...new Set(a.filter(Boolean))];

export function decisionAuditCandidate607(d){
const allowed=[...FIELDS_607,...DATES_607,'kind','issuer_state',
'witness_state','owner_state'];
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.includes(k))||
FIELDS_607.some(k=>!safe607(d[k],k==='reason'?900:220))||
DATES_607.some(k=>!safe607(d[k],40))||
!d.case_pin.startsWith('dd596-case:')||d.exception_code.length<4||
!KINDS_607.includes(d.kind)||!ISSUER_607.includes(d.issuer_state)||
!WITNESS_607.includes(d.witness_state)||!OWNER_607.includes(d.owner_state)||
d.reason.trim().length<15||!iso607(d.recorded_at)||!iso607(d.next_review_at)||
DATES_607.slice(0,-2).some(k=>d[k]&&!iso607(d[k]))||
DATES_607.slice(0,-2).filter(k=>k!=='owner_expires_at').some(k=>
d[k]&&Date.parse(d[k])>Date.parse(d.recorded_at))||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at)||
(d.owner_signed_at&&d.owner_expires_at&&
Date.parse(d.owner_expires_at)<=Date.parse(d.owner_signed_at)))
throw Error('External outcome, separate witness and exact owner decision are unverified.');
return {...Object.fromEntries(FIELDS_607.map(k=>[k,d[k].trim()])),
...Object.fromEntries(DATES_607.map(k=>[k,d[k]])),
kind:d.kind,issuer_state:d.issuer_state,witness_state:d.witness_state,
owner_state:d.owner_state,issuer_authenticated:false,conflict_closed:false,
owner_consent_authenticated:false,trial_authorized:false};
}

export function reconcileDecisionAudit607(exact606,source606,rows=[],
asOf=new Date().toISOString()){
if(exact606?.format!==FORMAT_606||!Array.isArray(source606)||source606.length!==3||
!Array.isArray(rows)||rows.length>100||!iso607(asOf))
throw Error('Exact original Build 606 source chain required.');
const replay=reconcileChallengeReadiness606(...source606,exact606.as_of);
if(JSON.stringify(replay)!==JSON.stringify(exact606))
throw Error('Build 606 original issuer, witness or owner source changed or is stale.');
return reviewDecisionAudit607(reconcileChallengeReadiness606(...source606,asOf),rows,asOf);
}
export function reviewDecisionAudit607(current,rows=[],asOf=new Date().toISOString()){
if(current?.format!==FORMAT_606||!Array.isArray(current.cases)||
!Array.isArray(rows)||rows.length>100||!iso607(asOf))
throw Error('Validated Build 606 source-pinned original cases required.');
const entered=rows.map(decisionAuditCandidate607);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const notes=entered.filter(n=>n.case_pin===c.case_pin).map(n=>{
if(!c.open_exceptions.includes(n.exception_code)||
(!owner&&(n.kind==='EXACT_OWNER_CONSENT_DECISION'||
[n.owner_signer_ref,n.owner_signed_receipt_ref,n.owner_independent_witness_ref,
n.owner_account,n.owner_product,n.owner_action,n.owner_decision_ref,
n.owner_signed_at,n.owner_expires_at].some(Boolean)))||
(owner&&(n.owner_account!==c.account_id||n.owner_product!==c.product_ref||
n.owner_action!==c.exact_action)))
throw Error('Exact original issuer/witness case or owner consent scope mismatch.');
const priorIssuer=c.challenge_witness_consent_notes?.filter(
x=>x.kind==='ISSUER_CALLBACK_CHALLENGE').at(-1)||{};
const priorWitness=c.challenge_witness_consent_notes?.filter(
x=>x.kind==='WITNESS_REVERIFICATION').at(-1)||{};
const priorOwner=c.challenge_witness_consent_notes?.filter(
x=>x.kind==='OWNER_CONSENT_READINESS').at(-1)||{};
const reused=key=>n[key]&&entered.some(x=>x.case_pin!==n.case_pin&&x[key]===n[key]);
const clock=owner?renewalClock604(n.owner_signed_at||priorOwner.owner_signed_at||'',
n.owner_expires_at||priorOwner.owner_expires_at||'',asOf):null;
const conflicts=uniq607([
n.kind==='ISSUER_CALLBACK_OUTCOME'&&(!n.challenge_ref||!n.issuer_outcome_ref||
!n.original_response_ref||!n.original_issuer_authority_ref||
!n.issuer_reviewer_ref||!n.issuer_outcome_at)?
'ORIGINAL_CALLBACK_OUTCOME_EVIDENCE_INCOMPLETE':null,
n.challenge_ref&&priorIssuer.challenge_ref&&n.challenge_ref!==priorIssuer.challenge_ref?
'CALLBACK_CHALLENGE_IDENTIFIER_SUBSTITUTED':null,
n.original_response_ref&&priorIssuer.response_receipt_ref&&
n.original_response_ref!==priorIssuer.response_receipt_ref?
'CALLBACK_ORIGINAL_RESPONSE_RECEIPT_CHANGED':null,
n.issuer_outcome_at&&priorIssuer.challenge_expires_at&&
Date.parse(n.issuer_outcome_at)>Date.parse(priorIssuer.challenge_expires_at)?
'CALLBACK_OUTCOME_AFTER_CHALLENGE_EXPIRY':null,
n.issuer_state==='REPORTED_MATCH_UNVERIFIED'?
'REPORTED_CALLBACK_MATCH_REMAINS_UNAUTHENTICATED':null,
n.issuer_state==='REPORTED_MISMATCH'?'ORIGINAL_ISSUER_CALLBACK_MISMATCH':null,
n.original_issuer_authority_ref&&[n.challenge_ref,n.issuer_outcome_ref,
n.original_response_ref].includes(n.original_issuer_authority_ref)?
'ISSUER_OUTCOME_AUTHORITY_SELF_REFERENTIAL':null,
n.issuer_reviewer_ref&&[c.expected_issuer_ref,n.witness_current_identity_ref,
n.owner_signer_ref].includes(n.issuer_reviewer_ref)?
'ISSUER_OUTCOME_REVIEWER_NOT_INDEPENDENT':null,
reused('issuer_outcome_ref')?'ISSUER_OUTCOME_REUSED_ACROSS_CASES':null,
n.kind==='WITNESS_IDENTITY_CONFLICT'&&(!n.witness_original_identity_ref||
!n.witness_current_identity_ref||!n.witness_authority_ref||
!n.witness_conflict_receipt_ref||!n.witness_reviewer_ref||
!n.witness_conflict_reviewed_at)?'WITNESS_CONFLICT_CLOSURE_PROOF_MISSING':null,
n.witness_original_identity_ref&&priorWitness.witness_identity_ref&&
n.witness_original_identity_ref!==priorWitness.witness_identity_ref?
'WITNESS_ORIGINAL_IDENTITY_SUBSTITUTED':null,
n.witness_current_identity_ref&&priorWitness.witness_identity_ref&&
n.witness_current_identity_ref!==priorWitness.witness_identity_ref?
'WITNESS_CURRENT_IDENTITY_CONFLICT':null,
n.witness_reviewer_ref&&[n.witness_current_identity_ref,
n.witness_original_identity_ref,n.issuer_reviewer_ref].includes(n.witness_reviewer_ref)?
'WITNESS_CONFLICT_REVIEWER_NOT_INDEPENDENT':null,
n.witness_authority_ref&&[n.witness_conflict_receipt_ref,
n.witness_current_identity_ref].includes(n.witness_authority_ref)?
'WITNESS_CONFLICT_AUTHORITY_SELF_REFERENTIAL':null,
reused('witness_conflict_receipt_ref')?'WITNESS_CONFLICT_RECEIPT_REUSED':null,
n.witness_state==='REPORTED_RECONCILED_UNVERIFIED'?
'REPORTED_WITNESS_CLOSURE_NOT_AUTHENTICATED':null,
owner&&n.owner_signer_ref&&c.expected_owner_signer_ref&&
n.owner_signer_ref!==c.expected_owner_signer_ref?'EXACT_OWNER_SIGNER_CONFLICT':null,
owner&&n.owner_signed_receipt_ref&&priorOwner.owner_signed_receipt_ref&&
n.owner_signed_receipt_ref!==priorOwner.owner_signed_receipt_ref?
'OWNER_SIGNED_CONSENT_RECEIPT_SUBSTITUTED':null,
owner&&n.owner_independent_witness_ref&&[n.owner_signer_ref,
n.witness_reviewer_ref,n.issuer_reviewer_ref].includes(n.owner_independent_witness_ref)?
'OWNER_CONSENT_WITNESS_NOT_INDEPENDENT':null,
owner&&n.owner_decision_ref&&[n.owner_signed_receipt_ref,
n.original_response_ref].includes(n.owner_decision_ref)?
'OWNER_CONSENT_AUDIT_REUSES_UNVERIFIED_RECEIPT':null,
reused('owner_decision_ref')?'OWNER_DECISION_REUSED_ACROSS_CASES':null,
owner&&clock?.state==='RENEWAL_EXPIRED'?'EXACT_OWNER_CONSENT_EXPIRED':null,
owner&&clock?.state==='RENEWAL_EXPIRES_WITHIN_72H'?
'EXACT_OWNER_CONSENT_EXPIRY_REVIEW_DUE':null,
n.owner_state==='REPORTED_SIGNED_UNVERIFIED'?
'OWNER_CONSENT_SIGNATURE_NOT_INDEPENDENTLY_AUTHENTICATED':null,
n.owner_state==='DECLINED'||n.owner_state==='EXPIRED_OR_REVOKED'?
'OWNER_CONSENT_EXPLICITLY_NOT_GRANTED':null,
n.kind==='EXACT_OWNER_CONSENT_DECISION'&&(!n.owner_decision_ref||
!n.owner_signer_ref||!n.owner_signed_receipt_ref||
!n.owner_independent_witness_ref||!n.owner_signed_at||!n.owner_expires_at)?
'EXACT_OWNER_CONSENT_DECISION_EVIDENCE_INCOMPLETE':null
]);
return {...n,conflicts,consent_expiry:clock,issuer_authenticated:false,
witness_conflict_closed:false,owner_consent_authenticated:false,
trial_authorized:false,provider_reads:0,provider_writes:0,d1_operations:0};
});
const latest=notes.at(-1)||null;
const priorOwner=c.challenge_witness_consent_notes?.filter(
x=>x.kind==='OWNER_CONSENT_READINESS').at(-1)||{};
const newOwner=notes.filter(x=>x.kind==='EXACT_OWNER_CONSENT_DECISION').at(-1);
const clock=owner?renewalClock604(newOwner?.owner_signed_at||priorOwner.owner_signed_at||'',
newOwner?.owner_expires_at||priorOwner.owner_expires_at||'',asOf):null;
const blockers=uniq607([...c.remaining_blockers,...notes.flatMap(n=>n.conflicts),
!notes.some(n=>n.kind==='ISSUER_CALLBACK_OUTCOME')?
'INDEPENDENT_ORIGINAL_CALLBACK_OUTCOME_NOT_RECORDED':null,
!notes.some(n=>n.kind==='WITNESS_IDENTITY_CONFLICT')?
'INDEPENDENT_WITNESS_IDENTITY_DISPOSITION_NOT_RECORDED':null,
owner&&!newOwner?'EXACT_OWNER_CONSENT_DECISION_NOT_RECORDED':null]);
return {...c,issuer_witness_owner_decision_audits:notes,
latest_decision_audit:latest,renewal_clock:clock,remaining_blockers:blockers,
aging:aging600(latest?.next_review_at||c.aging?.due_at||'',asOf),
issuer_authenticated:false,witness_conflict_closed:false,
owner_consent_authenticated:false,trial_authorized:false,
status:'ISSUER_OUTCOME_WITNESS_CONFLICT_OWNER_DECISION_HOLD'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_607,build:607,source_build:606,as_of:asOf,cases,
open_cases:cases.length,issuer_outcome_conflicts:cases.filter(c=>
c.remaining_blockers.some(x=>/CALLBACK|ISSUER_OUTCOME/.test(x))).length,
witness_identity_conflicts:cases.filter(c=>c.remaining_blockers.some(x=>
/WITNESS/.test(x))).length,
owner_consent_expired:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRED').length,
owner_consent_due:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H').length,
overdue_reviews:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
unmatched_notes:entered.filter(n=>!pins.has(n.case_pin)),
issuer_authenticated:0,witness_conflict_closed:0,
owner_consent_authenticated:0,authorized_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_ORIGINAL_ISSUER_WITNESS_IDENTITY_OWNER_CONSENT_DECISION'};
}

export function filterDecisionAudit607(p,filter='ALL',search=''){
if(p?.format!==FORMAT_607||!FILTERS_607.includes(filter)||!safe607(search,120))
throw Error('Invalid exact-source Build 607 decision filter.');
const q=search.trim().toLowerCase();
return p.cases.filter(c=>(filter==='ALL'||
(filter==='ISSUER'&&c.remaining_blockers.some(x=>/ISSUER|CALLBACK/.test(x)))||
(filter==='WITNESS'&&c.remaining_blockers.some(x=>/WITNESS/.test(x)))||
(filter==='OWNER'&&c.owner_trial_decision_pending)||
(filter==='DISPUTED'&&c.issuer_witness_owner_decision_audits.some(n=>n.conflicts.length))||
(filter==='CONSENT_EXPIRED'&&c.renewal_clock?.state==='RENEWAL_EXPIRED')||
(filter==='CONSENT_DUE'&&c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H')||
(filter==='OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(filter==='NO_OUTCOME'&&!c.issuer_witness_owner_decision_audits.length))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(s=>String(s).toLowerCase().includes(q))));
}

export function unsignedDecisionHandoff607(p,pin){
if(p?.format!==FORMAT_607)throw Error('Build 607 validated source required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Original-source unresolved case is required.');
return {format:'devilndove-unsigned-issuer-witness-owner-decision-607-v1',
build:607,source_build:606,case_pin:pin,prepared_at:p.as_of,
channel:c.channel,exact_shop_account:c.account_id,
exact_product_sku:c.product_ref,exact_action:c.exact_action,
original_source_digest:c.source_digest,
issuer_callback_outcomes:c.issuer_witness_owner_decision_audits.filter(x=>
x.kind==='ISSUER_CALLBACK_OUTCOME'),
witness_identity_conflict_reviews:c.issuer_witness_owner_decision_audits.filter(x=>
x.kind==='WITNESS_IDENTITY_CONFLICT'),
owner_consent_decisions:c.issuer_witness_owner_decision_audits.filter(x=>
x.kind==='EXACT_OWNER_CONSENT_DECISION'),
owner_consent_expiry:c.renewal_clock,remaining_blockers:c.remaining_blockers,
next_external_actions:['Authenticate callback outcome directly against trusted original issuer',
'Obtain an independent witness identity and original conflict disposition',
...(c.owner_trial_decision_pending?['Obtain exact signed, unexpired, independently verified owner consent']:[])],
issuer_authenticated:false,witness_conflict_closed:false,
owner_consent_authenticated:false,trial_authorized:false,
provider_read_or_write_authorized:false,status:'UNSIGNED_DECISION_AUDIT_HOLD'};
}

function init607(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd607Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd607Status'),output=get('dd607Output');
const read=(key,fallback)=>{const v=win.localStorage.getItem(key);
return v?JSON.parse(v):fallback;};
const stored=()=>read(KEY_607,[]);
let previousPin=null;
const source=()=>{
const v=['dd606Output','dd605Output','dd604Output','dd603Output',
'dd602Output','dd601Output','dd600Output','dd599Output','dd598Output',
'dd597Output'].map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute original sections 5–31.');
const s599=[JSON.parse(v[7]),[JSON.parse(v[8]),
[JSON.parse(v[9]),sourceContext597(doc,win),read(KEY_597,[])],
read(KEY_598,[])],read(KEY_599,[])];
const s601=[JSON.parse(v[6]),s599,read(KEY_600,[])];
const s602=[JSON.parse(v[5]),s601,read(KEY_601,[])];
const s603=[JSON.parse(v[4]),s602,read(KEY_602,[]),read(KEY_603,[])];
const s604=[JSON.parse(v[2]),[JSON.parse(v[3]),s603,read(KEY_604,[])]];
const s605=[JSON.parse(v[1]),s604.concat([read(KEY_605,[])])];
return [JSON.parse(v[0]),s605.concat([read(KEY_606,[])])];
};
const refresh=()=>{
const [exact,chain]=source(),p=reconcileDecisionAudit607(exact,chain,stored());
output.value=JSON.stringify(p,null,2);
get('dd607Metrics').textContent=p.open_cases+' open · '+p.issuer_outcome_conflicts+
' issuer gaps · '+p.witness_identity_conflicts+' witness identity gaps · '+
p.owner_consent_expired+' expired consent · '+p.owner_consent_due+' due · HOLD';
const sel=get('dd607Case'),old=sel.value;sel.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;sel.append(o);}
if([...sel.options].some(o=>o.value===old))sel.value=old;
const c=p.cases.find(x=>x.case_pin===sel.value),exception=get('dd607Exception');
const oldException=exception.value;exception.replaceChildren();
for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');exception.append(o);}
if([...exception.options].some(o=>o.value===oldException))exception.value=oldException;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd607Kind').value=c?.owner_trial_decision_pending?
'EXACT_OWNER_CONSENT_DECISION':'ISSUER_CALLBACK_OUTCOME';
for(const [id,value] of [['dd607Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd607Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd607Action',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=value;
}
const list=get('dd607Rows');list.replaceChildren();
for(const c of filterDecisionAudit607(p,get('dd607Filter').value,
get('dd607Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+
c.product_ref+' · '+(c.renewal_clock?.state||'original issuer/witness')+
' · '+c.remaining_blockers.length+' open';list.append(li);}
status.textContent='Original issuer outcomes, witness identity and exact owner consent HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact original sections 5–31 first · HOLD.';return null;}};
for(const [id,event] of [['dd607Refresh','click'],['dd607Filter','change'],
['dd607Search','input'],['dd607Case','change']])get(id).addEventListener(event,guard);
get('dd607Save').addEventListener('click',()=>{try{
if(!get('dd607Ack').checked)throw Error('Documentary HOLD acknowledgment required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd607Case').value);
if(!c)throw Error('Exact original case required.');
const v=id=>get(id).value.trim(),date=id=>v(id)?new Date(v(id)).toISOString():'';
const fields=[['challenge_ref','Challenge'],['issuer_outcome_ref','Outcome'],
['original_response_ref','Response'],['original_issuer_authority_ref','Authority'],
['issuer_reviewer_ref','IssuerReviewer'],['witness_original_identity_ref','WitnessOriginal'],
['witness_current_identity_ref','WitnessCurrent'],
['witness_authority_ref','WitnessAuthority'],
['witness_conflict_receipt_ref','WitnessReceipt'],
['witness_reviewer_ref','WitnessReviewer'],['owner_signer_ref','Signer'],
['owner_signed_receipt_ref','OwnerReceipt'],['owner_independent_witness_ref','OwnerWitness'],
['owner_account','Account'],['owner_product','Product'],['owner_action','Action'],
['owner_decision_ref','OwnerDecision'],['reason','Reason']];
const row=decisionAuditCandidate607({case_pin:c.case_pin,
exception_code:v('dd607Exception'),kind:v('dd607Kind'),
issuer_state:v('dd607IssuerState'),witness_state:v('dd607WitnessState'),
owner_state:v('dd607OwnerState'),
...Object.fromEntries(fields.map(([key,id])=>[key,v('dd607'+id)])),
issuer_outcome_at:date('dd607IssuerAt'),
witness_conflict_reviewed_at:date('dd607WitnessAt'),
owner_signed_at:date('dd607OwnerSigned'),owner_expires_at:date('dd607OwnerExpires'),
recorded_at:new Date().toISOString(),next_review_at:date('dd607Due')});
const next=[...stored(),row],[exact,chain]=source();
reconcileDecisionAudit607(exact,chain,next);
win.localStorage.setItem(KEY_607,JSON.stringify(next));get('dd607Ack').checked=false;refresh();
}catch{status.textContent='Rejected: stale source, identity conflict or wrong owner scope · HOLD.';}});
const prepare=()=>{const p=refresh();get('dd607Handoff').value=JSON.stringify(
unsignedDecisionHandoff607(p,get('dd607Case').value),null,2);
status.textContent='Unsigned source-pinned external decision audit prepared · HOLD.';};
get('dd607Prepare').addEventListener('click',()=>{try{prepare();}catch{
status.textContent='Select unresolved original issuer/witness/owner case · HOLD.';}});
const copy=async(kind)=>{try{if(kind==='handoff')prepare();else refresh();
const el=get(kind==='handoff'?'dd607Handoff':'dd607Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unsigned decision audit copied · HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually · HOLD.';}
}catch{status.textContent='Recompute exact source before copying · HOLD.';}};
get('dd607Copy').addEventListener('click',()=>copy('queue'));
get('dd607CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init607();


export const FORMAT_608='devilndove-original-issuer-witness-renewal-608-v1';
export const KEY_608='dd:original-issuer-witness-renewal:608:v1';
export const KINDS_608=['ISSUER_OUTCOME_ATTESTATION','WITNESS_CONFLICT_ESCALATION',
'EXACT_OWNER_RENEWAL_DECISION_HANDOFF'];
export const ISSUER_608=['AWAITING_ORIGINAL','REPORTED_ATTESTED_UNVERIFIED',
'DISPUTED_ORIGINAL','NO_RESPONSE'];
export const WITNESS_608=['CONFLICT_OPEN','EXTERNALLY_ESCALATED',
'REPORTED_RESOLUTION_UNVERIFIED','NO_REPLY'];
export const OWNER_608=['RENEWAL_REQUESTED','REPORTED_SIGNED_UNVERIFIED',
'DECLINED','EXPIRED_OR_REVOKED'];
export const FILTERS_608=['ALL','ISSUER','WITNESS','OWNER','ESCALATION_OVERDUE',
'CONSENT_EXPIRED','CONSENT_DUE','REVIEW_OVERDUE','CONFLICT','NO_HANDOFF'];
const FIELDS_608=['case_pin','exception_code','issuer_attestation_ref',
'issuer_original_outcome_ref','issuer_original_response_ref','issuer_authority_ref',
'issuer_reviewer_ref','witness_conflict_receipt_ref','witness_escalation_ref',
'witness_authority_ref','witness_reviewer_ref','owner_original_decision_ref',
'owner_renewal_receipt_ref','owner_signer_ref','owner_witness_ref',
'owner_account','owner_product','owner_action','owner_handoff_ref','reason'];
const DATES_608=['issuer_attested_at','witness_escalated_at',
'witness_response_due_at','owner_renewed_signed_at','owner_renewal_expires_at',
'recorded_at','next_review_at'];
export function attestationCandidate608(d){
const allowed=[...FIELDS_608,...DATES_608,'kind','issuer_state',
'witness_state','owner_state'];
if(!d||Array.isArray(d)||Object.keys(d).some(k=>!allowed.includes(k))||
FIELDS_608.some(k=>!safe600(d[k],k==='reason'?900:220))||
DATES_608.some(k=>!safe600(d[k],40))||
!d.case_pin.startsWith('dd596-case:')||d.exception_code.length<4||
!KINDS_608.includes(d.kind)||!ISSUER_608.includes(d.issuer_state)||
!WITNESS_608.includes(d.witness_state)||!OWNER_608.includes(d.owner_state)||
d.reason.trim().length<15||!iso600(d.recorded_at)||!iso600(d.next_review_at)||
DATES_608.slice(0,-2).some(k=>d[k]&&!iso600(d[k]))||
DATES_608.slice(0,-2).filter(k=>!['witness_response_due_at',
'owner_renewal_expires_at'].includes(k)).some(k=>d[k]&&
Date.parse(d[k])>Date.parse(d.recorded_at))||
Date.parse(d.next_review_at)<Date.parse(d.recorded_at)||
(d.witness_escalated_at&&d.witness_response_due_at&&
Date.parse(d.witness_response_due_at)<=Date.parse(d.witness_escalated_at))||
(d.owner_renewed_signed_at&&d.owner_renewal_expires_at&&
Date.parse(d.owner_renewal_expires_at)<=Date.parse(d.owner_renewed_signed_at)))
throw Error('Unsigned original attestation, witness escalation or owner renewal HOLD.');
return {...Object.fromEntries(FIELDS_608.map(k=>[k,d[k].trim()])),
...Object.fromEntries(DATES_608.map(k=>[k,d[k]])),
kind:d.kind,issuer_state:d.issuer_state,witness_state:d.witness_state,
owner_state:d.owner_state};
}
export function reconcileAttestation608(exact607,source607,rows=[],
asOf=new Date().toISOString()){
if(exact607?.format!==FORMAT_607||!Array.isArray(source607)||source607.length!==3||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Exact original source-pinned Build 607 decision packet required.');
const replay=reconcileDecisionAudit607(...source607,exact607.as_of);
if(JSON.stringify(replay)!==JSON.stringify(exact607))
throw Error('Build 607 original issuer/witness/owner decision source changed.');
return reviewAttestation608(reconcileDecisionAudit607(...source607,asOf),rows,asOf);
}
export function reviewAttestation608(current,rows=[],asOf=new Date().toISOString()){
if(current?.format!==FORMAT_607||!Array.isArray(current.cases)||
!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Validated Build 607 exact original-source decisions required.');
const entered=rows.map(attestationCandidate608);
const cases=current.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const notes=entered.filter(n=>n.case_pin===c.case_pin).map(n=>{
if(!c.open_exceptions.includes(n.exception_code)||
(!owner&&(n.kind==='EXACT_OWNER_RENEWAL_DECISION_HANDOFF'||
[n.owner_original_decision_ref,n.owner_renewal_receipt_ref,n.owner_signer_ref,
n.owner_witness_ref,n.owner_account,n.owner_product,n.owner_action,
n.owner_handoff_ref,n.owner_renewed_signed_at,n.owner_renewal_expires_at]
.some(Boolean)))||
(owner&&(n.owner_account!==c.account_id||n.owner_product!==c.product_ref||
n.owner_action!==c.exact_action)))
throw Error('Wrong original case or exact signed owner action scope.');
const prevIssuer=c.issuer_witness_owner_decision_audits?.filter(
x=>x.kind==='ISSUER_CALLBACK_OUTCOME').at(-1)||{};
const prevWitness=c.issuer_witness_owner_decision_audits?.filter(
x=>x.kind==='WITNESS_IDENTITY_CONFLICT').at(-1)||{};
const prevOwner=c.issuer_witness_owner_decision_audits?.filter(
x=>x.kind==='EXACT_OWNER_CONSENT_DECISION').at(-1)||{};
const reused=key=>n[key]&&entered.some(x=>x.case_pin!==n.case_pin&&x[key]===n[key]);
const escalation=aging600(n.witness_response_due_at||'',asOf);
const expiry=owner?renewalClock604(n.owner_renewed_signed_at||
prevOwner.owner_signed_at||'',n.owner_renewal_expires_at||
prevOwner.owner_expires_at||'',asOf):null;
const conflicts=uniq600([
n.kind==='ISSUER_OUTCOME_ATTESTATION'&&(!n.issuer_attestation_ref||
!n.issuer_original_outcome_ref||!n.issuer_authority_ref||
!n.issuer_original_response_ref||!n.issuer_reviewer_ref||
!n.issuer_attested_at)?'ORIGINAL_ISSUER_ATTESTATION_EVIDENCE_MISSING':null,
n.issuer_original_outcome_ref&&prevIssuer.issuer_outcome_ref&&
n.issuer_original_outcome_ref!==prevIssuer.issuer_outcome_ref?
'ORIGINAL_ISSUER_OUTCOME_RECEIPT_SUBSTITUTED':null,
n.issuer_original_response_ref&&prevIssuer.original_response_ref&&
n.issuer_original_response_ref!==prevIssuer.original_response_ref?
'ORIGINAL_ISSUER_RESPONSE_RECEIPT_SUBSTITUTED':null,
n.issuer_authority_ref&&[n.issuer_attestation_ref,n.issuer_original_outcome_ref,
n.issuer_original_response_ref].includes(n.issuer_authority_ref)?
'ISSUER_ATTESTATION_AUTHORITY_SELF_REFERENTIAL':null,
n.issuer_reviewer_ref&&[c.expected_issuer_ref,n.witness_reviewer_ref,
n.owner_signer_ref].includes(n.issuer_reviewer_ref)?
'ISSUER_ATTESTATION_REVIEWER_NOT_INDEPENDENT':null,
reused('issuer_attestation_ref')?'ISSUER_ATTESTATION_REUSED_ACROSS_CASES':null,
n.issuer_state==='REPORTED_ATTESTED_UNVERIFIED'?
'REPORTED_ISSUER_ATTESTATION_NOT_AUTHENTICATED':null,
n.issuer_state==='DISPUTED_ORIGINAL'?'ORIGINAL_ISSUER_ATTESTATION_DISPUTED':null,
n.kind==='WITNESS_CONFLICT_ESCALATION'&&(!n.witness_conflict_receipt_ref||
!n.witness_escalation_ref||!n.witness_authority_ref||
!n.witness_reviewer_ref||!n.witness_escalated_at||
!n.witness_response_due_at)?'WITNESS_ESCALATION_EVIDENCE_MISSING':null,
n.witness_conflict_receipt_ref&&prevWitness.witness_conflict_receipt_ref&&
n.witness_conflict_receipt_ref!==prevWitness.witness_conflict_receipt_ref?
'ORIGINAL_WITNESS_CONFLICT_RECEIPT_CHANGED':null,
n.witness_authority_ref&&[n.witness_escalation_ref,
n.witness_conflict_receipt_ref].includes(n.witness_authority_ref)?
'WITNESS_ESCALATION_AUTHORITY_SELF_REFERENTIAL':null,
n.witness_reviewer_ref&&[n.issuer_reviewer_ref,n.owner_signer_ref,
c.expected_issuer_ref].includes(n.witness_reviewer_ref)?
'WITNESS_ESCALATION_REVIEWER_NOT_INDEPENDENT':null,
reused('witness_escalation_ref')?'WITNESS_ESCALATION_REUSED_ACROSS_CASES':null,
escalation.bucket.startsWith('OVERDUE')?'WITNESS_EXTERNAL_ESCALATION_OVERDUE':null,
n.witness_state==='REPORTED_RESOLUTION_UNVERIFIED'?
'WITNESS_REPORTED_RESOLUTION_NOT_AUTHENTICATED':null,
owner&&n.owner_original_decision_ref&&prevOwner.owner_decision_ref&&
n.owner_original_decision_ref!==prevOwner.owner_decision_ref?
'OWNER_ORIGINAL_DECISION_REFERENCE_SUBSTITUTED':null,
owner&&n.owner_renewal_receipt_ref&&prevOwner.owner_signed_receipt_ref&&
n.owner_renewal_receipt_ref!==prevOwner.owner_signed_receipt_ref?
'EXACT_OWNER_RENEWAL_RECEIPT_SUBSTITUTED':null,
owner&&n.owner_signer_ref&&c.expected_owner_signer_ref&&
n.owner_signer_ref!==c.expected_owner_signer_ref?
'EXACT_OWNER_SIGNER_SUBSTITUTED':null,
owner&&n.owner_witness_ref&&[n.owner_signer_ref,n.witness_reviewer_ref,
n.issuer_reviewer_ref].includes(n.owner_witness_ref)?
'OWNER_RENEWAL_WITNESS_NOT_INDEPENDENT':null,
owner&&n.owner_handoff_ref&&[n.owner_original_decision_ref,
n.owner_renewal_receipt_ref].includes(n.owner_handoff_ref)?
'OWNER_RENEWAL_HANDOFF_REUSES_DECISION_OR_RECEIPT':null,
reused('owner_handoff_ref')?'OWNER_RENEWAL_HANDOFF_REUSED_ACROSS_CASES':null,
owner&&expiry?.state==='RENEWAL_EXPIRED'?'EXACT_OWNER_RENEWAL_EXPIRED':null,
owner&&expiry?.state==='RENEWAL_EXPIRES_WITHIN_72H'?
'EXACT_OWNER_RENEWAL_EXPIRY_DUE':null,
n.owner_state==='REPORTED_SIGNED_UNVERIFIED'?
'OWNER_RENEWED_DECISION_NOT_AUTHENTICATED':null,
n.owner_state==='DECLINED'||n.owner_state==='EXPIRED_OR_REVOKED'?
'OWNER_RENEWAL_NOT_GRANTED':null,
n.kind==='EXACT_OWNER_RENEWAL_DECISION_HANDOFF'&&(!n.owner_original_decision_ref||
!n.owner_renewal_receipt_ref||!n.owner_signer_ref||!n.owner_witness_ref||
!n.owner_handoff_ref||!n.owner_renewed_signed_at||!n.owner_renewal_expires_at)?
'EXACT_OWNER_RENEWAL_HANDOFF_INCOMPLETE':null
]);
return {...n,conflicts,witness_escalation_clock:escalation,
owner_renewal_clock:expiry,issuer_authenticated:false,
witness_conflict_closed:false,owner_consent_authenticated:false,
trial_authorized:false,provider_reads:0,provider_writes:0,d1_operations:0};
});
const latest=notes.at(-1)||null;
const prevOwner=c.issuer_witness_owner_decision_audits?.filter(
x=>x.kind==='EXACT_OWNER_CONSENT_DECISION').at(-1)||{};
const latestOwner=notes.filter(n=>n.kind==='EXACT_OWNER_RENEWAL_DECISION_HANDOFF').at(-1);
const expiry=owner?renewalClock604(latestOwner?.owner_renewed_signed_at||
prevOwner.owner_signed_at||'',latestOwner?.owner_renewal_expires_at||
prevOwner.owner_expires_at||'',asOf):null;
const latestEsc=notes.filter(n=>n.kind==='WITNESS_CONFLICT_ESCALATION').at(-1);
const blockers=uniq600([...c.remaining_blockers,...notes.flatMap(n=>n.conflicts),
!notes.some(n=>n.kind==='ISSUER_OUTCOME_ATTESTATION')?
'ORIGINAL_ISSUER_ATTESTATION_NOT_RECORDED':null,
!latestEsc?'WITNESS_CONFLICT_ESCALATION_NOT_RECORDED':null,
owner&&!latestOwner?'EXACT_OWNER_RENEWAL_HANDOFF_NOT_RECORDED':null]);
return {...c,original_attestation_witness_renewal_notes:notes,
latest_attestation_handoff:latest,renewal_clock:expiry,
witness_escalation_clock:latestEsc?.witness_escalation_clock||aging600('',asOf),
remaining_blockers:blockers,
aging:aging600(latest?.next_review_at||c.aging?.due_at||'',asOf),
issuer_authenticated:false,witness_conflict_closed:false,
owner_consent_authenticated:false,trial_authorized:false,
status:'ORIGINAL_ISSUER_ATTESTATION_WITNESS_ESCALATION_OWNER_RENEWAL_HOLD'};
});
const pins=new Set(cases.map(c=>c.case_pin));
return {format:FORMAT_608,build:608,source_build:607,as_of:asOf,cases,
open_cases:cases.length,issuer_attestation_gaps:cases.filter(c=>
c.remaining_blockers.some(x=>/ISSUER/.test(x))).length,
witness_escalations_overdue:cases.filter(c=>
c.witness_escalation_clock.bucket.startsWith('OVERDUE')).length,
owner_renewal_expired:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRED').length,
owner_renewal_due:cases.filter(c=>c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H').length,
overdue_reviews:cases.filter(c=>c.aging.bucket.startsWith('OVERDUE')).length,
stale_unmatched_notes:entered.filter(n=>!pins.has(n.case_pin)),
issuer_authenticated:0,witness_conflict_closed:0,owner_consent_authenticated:0,
authorized_trials:0,provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_ORIGINAL_ISSUER_WITNESS_ESCALATION_EXACT_OWNER_RENEWAL'};
}
export function filterAttestation608(p,kind='ALL',term=''){
if(p?.format!==FORMAT_608||!FILTERS_608.includes(kind)||!safe600(term,120))
throw Error('Invalid Build 608 original-source review filter.');
const q=term.trim().toLowerCase();
return p.cases.filter(c=>(kind==='ALL'||
(kind==='ISSUER'&&c.remaining_blockers.some(x=>/ISSUER/.test(x)))||
(kind==='WITNESS'&&c.remaining_blockers.some(x=>/WITNESS/.test(x)))||
(kind==='OWNER'&&c.owner_trial_decision_pending)||
(kind==='ESCALATION_OVERDUE'&&c.witness_escalation_clock.bucket.startsWith('OVERDUE'))||
(kind==='CONSENT_EXPIRED'&&c.renewal_clock?.state==='RENEWAL_EXPIRED')||
(kind==='CONSENT_DUE'&&c.renewal_clock?.state==='RENEWAL_EXPIRES_WITHIN_72H')||
(kind==='REVIEW_OVERDUE'&&c.aging.bucket.startsWith('OVERDUE'))||
(kind==='CONFLICT'&&c.original_attestation_witness_renewal_notes.some(n=>n.conflicts.length))||
(kind==='NO_HANDOFF'&&!c.original_attestation_witness_renewal_notes.length))&&
(!q||[c.channel,c.account_id,c.product_ref,c.exact_action,c.priority]
.some(x=>String(x).toLowerCase().includes(q))));
}
export function unsignedAttestationHandoff608(p,pin){
if(p?.format!==FORMAT_608)throw Error('Build 608 verified original source required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Exact unresolved original issuer/witness/owner case required.');
return {format:'devilndove-unsigned-issuer-witness-renewal-608-v1',build:608,
source_build:607,case_pin:pin,prepared_at:p.as_of,
channel:c.channel,exact_shop_account:c.account_id,
exact_product_sku:c.product_ref,exact_action:c.exact_action,
original_source_digest:c.source_digest,
original_issuer_attestations:c.original_attestation_witness_renewal_notes.filter(n=>
n.kind==='ISSUER_OUTCOME_ATTESTATION'),
independent_witness_escalations:c.original_attestation_witness_renewal_notes.filter(n=>
n.kind==='WITNESS_CONFLICT_ESCALATION'),
exact_owner_renewal_handoffs:c.original_attestation_witness_renewal_notes.filter(n=>
n.kind==='EXACT_OWNER_RENEWAL_DECISION_HANDOFF'),
witness_escalation_clock:c.witness_escalation_clock,
exact_owner_renewal_clock:c.renewal_clock,remaining_blockers:c.remaining_blockers,
external_requirements:['Authenticate original issuer outcome through independent authority',
'Obtain independently verified witness conflict closure outcome',
...(c.owner_trial_decision_pending?
['Obtain exact signed, unexpired owner renewal after separate verification']:[])],
issuer_authenticated:false,witness_conflict_closed:false,
owner_consent_authenticated:false,trial_authorized:false,
provider_read_or_write_authorized:false,status:'UNSIGNED_ORIGINAL_RENEWAL_HOLD'};
}
function init608(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd608Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd608Status'),output=get('dd608Output');
const read=(key,fallback)=>{const v=win.localStorage.getItem(key);
return v?JSON.parse(v):fallback;};
const stored=()=>read(KEY_608,[]);
let previousPin=null;
const source=()=>{
const v=['dd607Output','dd606Output','dd605Output','dd604Output',
'dd603Output','dd602Output','dd601Output','dd600Output','dd599Output',
'dd598Output','dd597Output'].map(id=>get(id)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Recompute exact original sections 5–32.');
const s599=[JSON.parse(v[8]),[JSON.parse(v[9]),
[JSON.parse(v[10]),sourceContext597(doc,win),read(KEY_597,[])],
read(KEY_598,[])],read(KEY_599,[])];
const s601=[JSON.parse(v[7]),s599,read(KEY_600,[])];
const s602=[JSON.parse(v[6]),s601,read(KEY_601,[])];
const s603=[JSON.parse(v[5]),s602,read(KEY_602,[]),read(KEY_603,[])];
const s604=[JSON.parse(v[3]),[JSON.parse(v[4]),s603,read(KEY_604,[])]];
const s605=[JSON.parse(v[2]),s604.concat([read(KEY_605,[])])];
const s606=[JSON.parse(v[1]),s605.concat([read(KEY_606,[])])];
return [JSON.parse(v[0]),s606.concat([read(KEY_607,[])])];
};
const refresh=()=>{
const [exact,chain]=source(),p=reconcileAttestation608(exact,chain,stored());
output.value=JSON.stringify(p,null,2);
get('dd608Metrics').textContent=p.open_cases+' open · '+p.issuer_attestation_gaps+
' issuer gaps · '+p.witness_escalations_overdue+' overdue witness escalations · '+
p.owner_renewal_expired+' expired consent · '+p.owner_renewal_due+' due soon · HOLD';
const sel=get('dd608Case'),old=sel.value;sel.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.priority+' · '+c.channel+' · '+c.product_ref;sel.append(o);}
if([...sel.options].some(o=>o.value===old))sel.value=old;
const c=p.cases.find(x=>x.case_pin===sel.value),exception=get('dd608Exception');
const oldException=exception.value;exception.replaceChildren();
for(const x of c?.open_exceptions||[]){const o=doc.createElement('option');
o.value=x;o.textContent=x.replaceAll('_',' ');exception.append(o);}
if([...exception.options].some(o=>o.value===oldException))exception.value=oldException;
if(previousPin!==c?.case_pin){previousPin=c?.case_pin||null;
get('dd608Kind').value=c?.owner_trial_decision_pending?
'EXACT_OWNER_RENEWAL_DECISION_HANDOFF':'ISSUER_OUTCOME_ATTESTATION';
for(const [id,value] of [['dd608Account',c?.owner_trial_decision_pending?c.account_id:''],
['dd608Product',c?.owner_trial_decision_pending?c.product_ref:''],
['dd608Action',c?.owner_trial_decision_pending?c.exact_action:'']])get(id).value=value;
}
const list=get('dd608Rows');list.replaceChildren();
for(const c of filterAttestation608(p,get('dd608Filter').value,
get('dd608Search').value)){
const li=doc.createElement('li');li.textContent=c.priority+' · '+c.channel+' · '+
c.product_ref+' · '+(c.witness_escalation_clock?.bucket||'witness pending')+
' · '+c.remaining_blockers.length+' unresolved';list.append(li);}
status.textContent='External originals, independent witness closure and signed exact owner HOLD.';
return p;
};
const guard=()=>{try{return refresh();}catch{
status.textContent='Recompute exact original sections 5–32 first · HOLD.';return null;}};
for(const [id,event] of [['dd608Refresh','click'],['dd608Filter','change'],
['dd608Search','input'],['dd608Case','change']])get(id).addEventListener(event,guard);
get('dd608Save').addEventListener('click',()=>{try{
if(!get('dd608Ack').checked)throw Error('Unverified documentary acknowledgment required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd608Case').value);
if(!c)throw Error('Exact original source case required.');
const v=id=>get(id).value.trim(),date=id=>v(id)?new Date(v(id)).toISOString():'';
const fields=[['issuer_attestation_ref','IssuerAttestation'],
['issuer_original_outcome_ref','IssuerOutcome'],
['issuer_original_response_ref','IssuerResponse'],['issuer_authority_ref','IssuerAuthority'],
['issuer_reviewer_ref','IssuerReviewer'],['witness_conflict_receipt_ref','WitnessConflict'],
['witness_escalation_ref','WitnessEscalation'],['witness_authority_ref','WitnessAuthority'],
['witness_reviewer_ref','WitnessReviewer'],
['owner_original_decision_ref','OwnerDecision'],['owner_renewal_receipt_ref','OwnerReceipt'],
['owner_signer_ref','OwnerSigner'],['owner_witness_ref','OwnerWitness'],
['owner_account','Account'],['owner_product','Product'],['owner_action','Action'],
['owner_handoff_ref','OwnerHandoff'],['reason','Reason']];
const row=attestationCandidate608({case_pin:c.case_pin,
exception_code:v('dd608Exception'),kind:v('dd608Kind'),
issuer_state:v('dd608IssuerState'),witness_state:v('dd608WitnessState'),
owner_state:v('dd608OwnerState'),
...Object.fromEntries(fields.map(([key,id])=>[key,v('dd608'+id)])),
issuer_attested_at:date('dd608IssuerAt'),
witness_escalated_at:date('dd608WitnessAt'),
witness_response_due_at:date('dd608WitnessDue'),
owner_renewed_signed_at:date('dd608OwnerSigned'),
owner_renewal_expires_at:date('dd608OwnerExpires'),
recorded_at:new Date().toISOString(),next_review_at:date('dd608Due')});
const next=[...stored(),row],[exact,chain]=source();
reconcileAttestation608(exact,chain,next);
win.localStorage.setItem(KEY_608,JSON.stringify(next));get('dd608Ack').checked=false;refresh();
}catch{status.textContent='Rejected: source conflict or unsafe original evidence · HOLD.';}});
const prepare=()=>{const p=refresh();get('dd608Handoff').value=JSON.stringify(
unsignedAttestationHandoff608(p,get('dd608Case').value),null,2);
status.textContent='Unsigned original issuer/witness/owner handoff prepared · HOLD.';};
get('dd608Prepare').addEventListener('click',()=>{try{prepare();}catch{
status.textContent='Select original unresolved case · HOLD.';}});
const copy=async(kind)=>{try{if(kind==='handoff')prepare();else refresh();
const el=get(kind==='handoff'?'dd608Handoff':'dd608Output');
try{await win.navigator.clipboard.writeText(el.value);
status.textContent='Unsigned external review copied · HOLD.';
}catch{el.focus();el.select();status.textContent='Select and copy manually · HOLD.';}
}catch{status.textContent='Recompute original chain before copying · HOLD.';}};
get('dd608Copy').addEventListener('click',()=>copy('queue'));
get('dd608CopyHandoff').addEventListener('click',()=>copy('handoff'));
}
if(typeof document!=='undefined')init608();

/* Build 613 — review-first trusted-source intake; local claims NEVER confer authority. */
export const FORMAT_613='devilndove-independent-issuer-witness-owner-workbench-613-v1';
export const KEY_613='dd:issuer-witness-owner-trust-review:613:v1';
export const KINDS_613=['ORIGINAL_ISSUER','INDEPENDENT_WITNESS','EXACT_OWNER_CONSENT'];
export const DECISIONS_613=['PENDING','APPROVE_CLAIM_UNVERIFIED','DECLINE','REVOKE'];
const FIELDS_613=['case_pin','kind','original_ref','authority_ref','reviewer_ref',
'witness_ref','source_sha256','signed_receipt_ref','owner_signer_ref',
'owner_account','owner_product','owner_action','reason'];
const TIME_613=['signed_at','expires_at','recorded_at'];
export function candidate613(r){
const allow=new Set([...FIELDS_613,...TIME_613,'decision']);
if(!r||Array.isArray(r)||Object.keys(r).some(k=>!allow.has(k))||
FIELDS_613.some(k=>typeof r[k]!=='string'||r[k].length>(k==='reason'?900:220)||
/(?:access[_ -]?token|bearer\s+\S+|client[_ -]?secret|password\s*[:=]|api[_ -]?key\s*[:=]|private[_ -]?key)/i.test(r[k]))||
!KINDS_613.includes(r.kind)||!DECISIONS_613.includes(r.decision)||
!r.case_pin.startsWith('dd596-case:')||
(r.source_sha256!==''&&!/^[a-f0-9]{64}$/.test(r.source_sha256))||
TIME_613.some(k=>r[k]!==''&&!iso600(r[k]))||
!r.recorded_at||r.reason.trim().length<15||
(r.signed_at&&Date.parse(r.signed_at)>Date.parse(r.recorded_at))||
(r.expires_at&&(!r.signed_at||Date.parse(r.expires_at)<=Date.parse(r.signed_at))))
throw Error('Untrusted or invalid source/witness/owner evidence; no approval.');
return {...Object.fromEntries(FIELDS_613.map(k=>[k,r[k].trim()])),
...Object.fromEntries(TIME_613.map(k=>[k,r[k]])),decision:r.decision};
}
export function review613(exact608,rows=[],asOf=new Date().toISOString()){
if(exact608?.format!==FORMAT_608||exact608?.build!==608||
exact608?.release_gate!=='HOLD_ORIGINAL_ISSUER_WITNESS_ESCALATION_EXACT_OWNER_RENEWAL'||
!Array.isArray(exact608.cases)||!Array.isArray(rows)||rows.length>100||!iso600(asOf))
throw Error('Build 608 original source packet required.');
const notes=rows.map(candidate613),used=new Map();
for(const n of notes)for(const key of ['original_ref','signed_receipt_ref']){
if(n[key]){const set=used.get(n[key])||new Set();set.add(n.case_pin);
used.set(n[key],set);}}
const cases=exact608.cases.map(c=>{
const owner=c.owner_trial_decision_pending;
const reviews=notes.filter(n=>n.case_pin===c.case_pin).map(n=>{
if(n.owner_account!==c.account_id||n.owner_product!==c.product_ref||
n.owner_action!==c.exact_action||
(n.kind==='EXACT_OWNER_CONSENT'&&!owner))
throw Error('Exact account, SKU, action or case type conflict.');
const conflicts=uniq600([
!n.original_ref||!n.authority_ref?'ORIGINAL_AUTHORITY_NOT_OBTAINED':null,
!n.source_sha256?'ORIGINAL_DOCUMENT_HASH_MISSING':null,
n.source_sha256&&c.source_digest&&n.source_sha256!==c.source_digest?
'ORIGINAL_SOURCE_DIGEST_CONFLICT':null,
!n.reviewer_ref||!n.witness_ref?'INDEPENDENT_REVIEWER_WITNESS_MISSING':null,
n.reviewer_ref&&n.reviewer_ref===n.witness_ref?'SELF_WITNESSED_REVIEW':null,
n.authority_ref&&[n.original_ref,n.reviewer_ref,n.witness_ref].includes(n.authority_ref)?
'UNTRUSTED_SELF_REFERENTIAL_AUTHORITY':null,
n.witness_ref&&[n.owner_signer_ref,c.expected_issuer_ref].includes(n.witness_ref)?
'WITNESS_NOT_INDEPENDENT':null,
used.get(n.original_ref)?.size>1||used.get(n.signed_receipt_ref)?.size>1?
'EVIDENCE_REUSED_ACROSS_CASES':null,
n.kind==='EXACT_OWNER_CONSENT'&&(!n.signed_receipt_ref||!n.owner_signer_ref||
!n.signed_at||!n.expires_at)?'SIGNED_OWNER_SCOPE_INCOMPLETE':null,
n.kind==='EXACT_OWNER_CONSENT'&&c.expected_owner_signer_ref&&
n.owner_signer_ref!==c.expected_owner_signer_ref?'ORIGINAL_OWNER_SIGNER_CHANGED':null,
n.kind==='EXACT_OWNER_CONSENT'&&n.expires_at&&
Date.parse(n.expires_at)<=Date.parse(asOf)?'SIGNED_OWNER_SCOPE_EXPIRED':null,
n.decision==='DECLINE'||n.decision==='REVOKE'?'OWNER_CONSENT_NOT_GRANTED':null,
n.decision==='APPROVE_CLAIM_UNVERIFIED'?
'CLAIMED_APPROVAL_REQUIRES_TRUSTED_SIGNATURE_VERIFICATION':null,
'TRUSTED_EXTERNAL_VERIFIER_NOT_ENROLLED'
]);
return {...n,conflicts,status:'UNVERIFIED_DOCUMENTARY_INTAKE',
issuer_authenticated:false,witness_authenticated:false,
signed_owner_consent_authenticated:false,trial_authorized:false};
});
return {case_pin:c.case_pin,channel:c.channel,account_id:c.account_id,
product_ref:c.product_ref,exact_action:c.exact_action,owner_trial_decision_pending:owner,
reviews,remaining_blockers:uniq600([...(c.remaining_blockers||[]),
...reviews.flatMap(n=>n.conflicts),'TRUSTED_ORIGINAL_AUTHORITY_PENDING']),
issuer_authenticated:false,witness_authenticated:false,
owner_consent_authenticated:false,trial_authorized:false};
});
return {format:FORMAT_613,build:613,source_build:608,as_of:asOf,cases,
unmatched:notes.filter(n=>!cases.some(c=>c.case_pin===n.case_pin)),
issuer_authenticated:0,independent_witness_authenticated:0,
owner_consents_authenticated:0,authorized_trials:0,
provider_reads:0,provider_writes:0,d1_operations:0,
release_gate:'HOLD_EXTERNAL_ISSUER_WITNESS_SIGNED_OWNER_TRUST'};
}
export function reconcile613(exact608,source608,local608=[],rows=[],
asOf=new Date().toISOString()){
if(!Array.isArray(source608)||source608.length!==2||!Array.isArray(local608))
throw Error('Original Build 608 replay context required.');
const reproduced=reconcileAttestation608(...source608,local608,exact608?.as_of);
if(JSON.stringify(reproduced)!==JSON.stringify(exact608))
throw Error('Forged, outdated or substituted Build 608 packet.');
const current=asOf===exact608.as_of?reproduced:
reconcileAttestation608(...source608,local608,asOf);
return review613(current,rows,asOf);
}
export function unsignedHandoff613(p,pin){
if(p?.format!==FORMAT_613)throw Error('Exact reviewed evidence required.');
const c=p.cases.find(x=>x.case_pin===pin);
if(!c)throw Error('Choose existing case.');
return {format:'devilndove-unsigned-independent-trust-handoff-613-v1',
case_pin:pin,exact_channel:c.channel,shop_account:c.account_id,
product_sku:c.product_ref,permitted_action_requested:c.exact_action,
documentary_reviews:c.reviews,remaining_blockers:c.remaining_blockers,
required_outside_checks:['Validate original issuer through independent official provider channel',
'Authenticate a separate independent reviewer and witness',
'Verify owner identity and original signature for exact account, SKU and action',
'Verify expiry, revocation and explicit scoped owner authorization'],
original_issuer_authenticated:false,independent_witness_authenticated:false,
owner_signature_authenticated:false,provider_action_authorized:false,
status:'UNSIGNED_UNTRUSTED_EXTERNAL_VERIFICATION_REQUIRED'};
}
function init613(doc=globalThis.document,win=globalThis.window){
if(!doc?.getElementById('dd613Refresh'))return;
const get=id=>doc.getElementById(id),status=get('dd613Status');
const stored=()=>{const x=win.localStorage.getItem(KEY_613);return x?JSON.parse(x):[];};
const source=()=>{
const ids=['dd607Output','dd606Output','dd605Output','dd604Output',
'dd603Output','dd602Output','dd601Output','dd600Output',
'dd599Output','dd598Output','dd597Output'];
const v=ids.map(x=>get(x)?.value);
if(v.some(x=>!x||x.length>900000))throw Error('Refresh preceding source sections.');
const rd=(k)=>{const x=win.localStorage.getItem(k);return x?JSON.parse(x):[];};
const s599=[JSON.parse(v[8]),[JSON.parse(v[9]),
[JSON.parse(v[10]),sourceContext597(doc,win),rd(KEY_597)],
rd(KEY_598)],rd(KEY_599)];
const s601=[JSON.parse(v[7]),s599,rd(KEY_600)];
const s602=[JSON.parse(v[6]),s601,rd(KEY_601)];
const s603=[JSON.parse(v[5]),s602,rd(KEY_602),rd(KEY_603)];
const s604=[JSON.parse(v[3]),[JSON.parse(v[4]),s603,rd(KEY_604)]];
const s605=[JSON.parse(v[2]),s604.concat([rd(KEY_605)])];
const s606=[JSON.parse(v[1]),s605.concat([rd(KEY_606)])];
return [JSON.parse(get('dd608Output').value),
[JSON.parse(v[0]),s606.concat([rd(KEY_607)])],rd(KEY_608)];
};
const refresh=()=>{
const [exact,s608,local]=source();
const p=reconcile613(exact,s608,local,stored());
get('dd613Output').value=JSON.stringify(p,null,2);
get('dd613Metrics').textContent=p.cases.length+' original cases · '+
p.cases.reduce((a,c)=>a+c.reviews.length,0)+' local reviews · all external checks HOLD';
const select=get('dd613Case'),prior=select.value;select.replaceChildren();
for(const c of p.cases){const o=doc.createElement('option');o.value=c.case_pin;
o.textContent=c.channel+' · '+c.product_ref+' · '+c.exact_action;select.append(o);}
if([...select.options].some(x=>x.value===prior))select.value=prior;
status.textContent='Browser-local intake; no original issuer, witness or owner authority verified.';
return p;
};
const guard=()=>{try{refresh();}catch{status.textContent='Recompute exact sources 5–33 · HOLD.';}};
get('dd613Refresh').addEventListener('click',guard);
get('dd613Save').addEventListener('click',()=>{try{
if(!get('dd613Ack').checked)throw Error('Acknowledgement required.');
const p=refresh(),c=p.cases.find(x=>x.case_pin===get('dd613Case').value);
if(!c)throw Error('Choose exact source case.');
const v=id=>get('dd613'+id).value.trim();
const date=id=>v(id)?new Date(v(id)).toISOString():'';
const record=candidate613({case_pin:c.case_pin,kind:v('Kind'),
original_ref:v('Original'),authority_ref:v('Authority'),
reviewer_ref:v('Reviewer'),witness_ref:v('Witness'),
source_sha256:v('Digest'),signed_receipt_ref:v('SignedReceipt'),
owner_signer_ref:v('Signer'),owner_account:c.account_id,
owner_product:c.product_ref,owner_action:c.exact_action,
decision:v('Decision'),signed_at:date('Signed'),expires_at:date('Expires'),
recorded_at:new Date().toISOString(),reason:v('Reason')});
const next=[...stored(),record],[exact,chain,local]=source();
reconcile613(exact,chain,local,next);
win.localStorage.setItem(KEY_613,JSON.stringify(next));
get('dd613Ack').checked=false;refresh();
}catch{status.textContent='Evidence rejected, or exact original source unavailable · HOLD.';}});
get('dd613Prepare').addEventListener('click',()=>{
try{const p=refresh();get('dd613Handoff').value=JSON.stringify(
unsignedHandoff613(p,get('dd613Case').value),null,2);
status.textContent='Unsigned review packet prepared · HOLD.';
}catch{status.textContent='Choose current original case · HOLD.';}});
}
if(typeof document!=='undefined')init613();
import './admin-channel-trust-authority-614.mjs?v=620';
