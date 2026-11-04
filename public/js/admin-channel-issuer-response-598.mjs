/* Build 598: original issuer response, independent conflict closure and owner witness readiness.
 * Local documentary review is NEVER issuer authentication, exception closure or trial authority. */
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
  const current=reconcileSource597(...source597,local597,asOf);
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

/* Build 599 consolidated review implementation: one existing runtime module, no extra runtime file. */
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
  const current=issuerResponseReview598(...source598,local598,asOf);
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


/* Build 600 — independent issuer decision register, open exception aging and owner readiness.
   Local dispositions are NOT source authentication, closure or trial authority. */
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
  if(JSON.stringify(receiptIntake599(...source599,local599,exact599.as_of))!==JSON.stringify(exact599))
    throw Error('Stale or modified Build 599 original-source packet.');
  const current=receiptIntake599(...source599,local599,asOf);
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

/* Build 601 — exact-source issuer evidence reconciliation, unresolved conflict escalation,
 * and unsigned owner authorization handoff. This local queue cannot verify external proof. */
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
  if(JSON.stringify(decisionRegister600(...source600,local600,exact600.as_of))!==JSON.stringify(exact600))
    throw Error('Stale, substituted or modified Build 600 decision register.');
  const current=decisionRegister600(...source600,local600,asOf);
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

/* Build 602 — external original-issuer evidence intake, independent witness cross-check,
 * and exact owner authorization exception recheck. Everything remains documentary HOLD. */
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
  if(JSON.stringify(reconcileEscalations601(...source601,local601,exact601.as_of))!==JSON.stringify(exact601))
    throw Error('Stale or modified Build 601 original issuer and owner handoff packet.');
  const current=reconcileEscalations601(...source601,local601,asOf);
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

/* Build 603 — source-pinned custody continuity, independent witness identity follow-up
 * and exact owner signed-scope expiry. All records are unauthenticated local claims. */
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
/* Pure documentary audit is testable without repeating the expensive original-source
 * replay; the browser entrypoint above always verifies that exact chain first. */
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
