/* Build 607 — unverified original issuer callback outcomes, independent witness
 * identity conflicts and exact owner consent decision evidence. NO provider I/O. */
import {FORMAT_606,KEY_598,KEY_599,KEY_600,KEY_601,KEY_602,KEY_603,
  KEY_604,KEY_605,KEY_606,reconcileChallengeReadiness606,renewalClock604,aging600}
  from './admin-channel-issuer-response-598.mjs?v=606';
import {KEY_597,sourceContext597} from './admin-channel-source-disposition-597.mjs?v=597';

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
