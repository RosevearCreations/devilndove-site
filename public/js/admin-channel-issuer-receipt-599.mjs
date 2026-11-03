/* Build 599: original issuer receipt claims, conflict witness and exact owner consent preflight.
 * Local documentary evidence never authenticates the issuer or authorizes a provider trial. */
import {issuerResponseReview598,KEY_598,FORMAT_598} from './admin-channel-issuer-response-598.mjs?v=598';
import {sourceContext597,KEY_597} from './admin-channel-source-disposition-597.mjs?v=597';
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
const safe=(s,n=220)=>typeof s==='string'&&s.length<=n&&!secret.test(s);
const iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const hash=x=>x===''||/^[a-f0-9]{64}$/.test(x);
const uniq=a=>[...new Set(a.filter(Boolean))];
const ownerAction=a=>ACTIONS_599.slice(3).includes(a);
export function receiptCandidate599(r){
  const allowed=new Set([...fields,'source_method','state','next_action','received_at','recorded_at','next_review_at']);
  if(!r||Array.isArray(r)||Object.keys(r).some(k=>!allowed.has(k))||
    fields.some(f=>!safe(r[f],f==='reason'?900:220))||
    !r.case_pin.startsWith('dd596-case:')||r.exception_code.length<4||
    !METHODS_599.includes(r.source_method)||!STATES_599.includes(r.state)||
    !ACTIONS_599.includes(r.next_action)||!hash(r.receipt_sha256)||!hash(r.owner_signed_sha256)||
    r.reason.trim().length<15||(r.received_at!==''&&!iso(r.received_at))||
    !iso(r.recorded_at)||!iso(r.next_review_at)||
    Date.parse(r.next_review_at)<Date.parse(r.recorded_at)||
    (r.received_at!==''&&Date.parse(r.received_at)>Date.parse(r.recorded_at)))
    throw Error('Invalid unverified original issuer or exact owner receipt.');
  return Object.fromEntries([...fields.map(f=>[f,r[f].trim()]),['source_method',r.source_method],
    ['state',r.state],['next_action',r.next_action],['received_at',r.received_at],
    ['recorded_at',r.recorded_at],['next_review_at',r.next_review_at]]);
}
export function receiptIntake599(exact598,source598,local598=[],submitted=[],asOf=new Date().toISOString()){
  if(exact598?.format!==FORMAT_598||!Array.isArray(source598)||source598.length!==3||
    !Array.isArray(local598)||!Array.isArray(submitted)||submitted.length>100||!iso(asOf))
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
  if(packet?.format!==FORMAT_599||!FILTERS_599.includes(kind)||!safe(term,120))
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
