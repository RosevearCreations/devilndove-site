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
