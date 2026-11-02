/* Build 576 — witness provenance authentication preflight and owner-device follow-up.
 * Prepared links/methods are not authenticated signatures, verified fixes or owner consent. */
import {WITNESS_SOURCE_KEY_575,WITNESS_KEY_575,witnessDraftPacket575,witnessPacket575,
  validateWitnessPacket575} from './admin-device-witness-575.mjs?v=577';

export const PROVENANCE_FORMAT_576='devilndove-admin-device-provenance-followup-576-v1';
export const FOLLOWUP_FORMAT_576='devilndove-admin-device-provenance-followup-drafts-576-v1';
export const STAGED_KEY_576='dd:admin-device-provenance-source:576:v1';
export const FOLLOWUP_KEY_576='dd:admin-device-provenance-followup:576:v1';
export const ACTIONS_576=[
  {id:'REQUEST_ACTUAL_DEVICE_RETEST',label:'Request a same-device owner retest'},
  {id:'REQUEST_SOURCE_CORRECTION',label:'Request an actual source fix and new retest'},
  {id:'REQUEST_INDEPENDENT_WITNESS',label:'Request independent source witness evidence'},
  {id:'REQUEST_AUTHENTICATED_WITNESS',label:'Prepare external witness authentication (NOT verified)'},
  {id:'ESCALATE_CONFLICT',label:'Escalate a conflicting or stale source record'},
];
export const AUTH_METHODS_576=[
  {id:'SIGNED_INDEPENDENT_REPORT',label:'Independently signed reviewer report (to be verified externally)'},
  {id:'SOURCE_CONTROL_AUDIT',label:'Independent source-control audit trail (to be verified externally)'},
  {id:'SIGNED_DEVICE_WITNESS',label:'Signed witness/actual-device cross-check (to be verified externally)'},
];
const actions=new Set(ACTIONS_576.map(x=>x.id));
const methods=new Set(AUTH_METHODS_576.map(x=>x.id));
const keyOf=row=>`${row.device}:${row.check}`;

export function sourcePin576(row){
  const w=row.witness_draft;
  return JSON.stringify([
    row.device,row.check,row.original_observed_at,row.original_observation,
    row.retest?.result||'',row.retest?.detail||'',row.retest?.retested_at||'',
    row.source_review?.reference||'',row.witness_status,
    w?.reviewer_reference||'',w?.witness_reference||'',w?.outcome||'',
    w?.review_note||'',w?.reviewed_at||'',
  ]);
}

export function validateFollowups576(packet){
  if(!packet||packet.format!==FOLLOWUP_FORMAT_576||packet.build!==576||
    packet.owner_signoff!=='PENDING'||!Array.isArray(packet.entries)||packet.entries.length>27)
    throw Error('Invalid follow-up packet or unsupported owner decision.');
  const seen=new Set();
  return packet.entries.map(row=>{
    if(!row||!['desktop','phone','tablet'].includes(row.device)||
      typeof row.check!=='string'||!(/^[a-z][a-z0-9-]{0,35}$/).test(row.check)||
      typeof row.source_pin!=='string'||row.source_pin.length<20||row.source_pin.length>3600||
      !actions.has(row.next_action)||typeof row.request_note!=='string'||
      row.request_note.trim().length<12||row.request_note.length>600||
      typeof row.authentication_method!=='string'||
      typeof row.proof_locator!=='string'||row.proof_locator.length>240||
      typeof row.reviewer_independence_basis!=='string'||row.reviewer_independence_basis.length>600||
      typeof row.owner_device_receipt_locator!=='string'||row.owner_device_receipt_locator.length>240||
      typeof row.recorded_at!=='string'||!Number.isFinite(Date.parse(row.recorded_at)))
      throw Error('Incomplete follow-up draft or unsupported provenance claim.');
    const requesting=row.next_action==='REQUEST_AUTHENTICATED_WITNESS';
    if(requesting&&(!methods.has(row.authentication_method)||
      row.proof_locator.trim().length<8||row.reviewer_independence_basis.trim().length<12||
      row.owner_device_receipt_locator.trim().length<8))
      throw Error('Authentication preflight must name external method, witness proof and actual-device receipt.');
    if(!requesting&&(row.authentication_method!=='NOT_SELECTED'||row.proof_locator!==''||
      row.reviewer_independence_basis!==''||row.owner_device_receipt_locator!==''))
      throw Error('Unrequested external authentication is not an approved verification claim.');
    const key=keyOf(row);if(seen.has(key))throw Error('Duplicate provenance draft needs manual reconciliation.');seen.add(key);
    return {device:row.device,check:row.check,source_pin:row.source_pin,
      next_action:row.next_action,request_note:row.request_note.trim(),
      authentication_method:row.authentication_method,
      proof_locator:row.proof_locator.trim(),
      reviewer_independence_basis:row.reviewer_independence_basis.trim(),
      owner_device_receipt_locator:row.owner_device_receipt_locator.trim(),
      recorded_at:row.recorded_at};
  });
}

export function followupPacket576(entries){
  const packet={format:FOLLOWUP_FORMAT_576,build:576,owner_signoff:'PENDING',entries};
  packet.entries=validateFollowups576(packet);return packet;
}

export function reviewProvenance576(witnessSource,followups){
  const accepted=validateWitnessPacket575(witnessSource);
  const entries=validateFollowups576(followups);
  const pins=new Map(entries.map(row=>[row.source_pin,row]));
  const used=new Set();
  const cases=accepted.review.cases.map(row=>{
    const exactPin=sourcePin576(row),draft=pins.get(exactPin)||null;
    if(draft)used.add(exactPin);
    const claimed=row.witness_status==='SOURCE_MATCH_CLAIM_UNAUTHENTICATED'&&Boolean(row.witness_draft);
    const status=!claimed?(row.witness_status==='SOURCE_CONFLICT_OPEN'?'SOURCE_CONFLICT_NOT_CLOSED':
      row.witness_status==='WITNESS_EVIDENCE_INSUFFICIENT'?'WITNESS_EVIDENCE_INSUFFICIENT':
      row.witness_status==='WITNESS_DRAFT_MISSING'?'AUTHENTIC_WITNESS_MISSING':'ACTUAL_DEVICE_OR_SOURCE_EVIDENCE_MISSING'):
      !draft?'AUTHENTICATION_PREP_MISSING':draft.next_action==='REQUEST_AUTHENTICATED_WITNESS'?
      'PREPARED_FOR_EXTERNAL_AUTHENTICATION_NOT_VERIFIED':'FOLLOWUP_REQUESTED_NOT_VERIFIED';
    return {device:row.device,check:row.check,device_label:row.device_label,
      check_label:row.check_label,priority:row.priority,route:row.route,
      original_observed_at:row.original_observed_at,original_observation:row.original_observation,
      source_lane:row.source_lane,retest:row.retest,source_review:row.source_review,
      witness_status:row.witness_status,witness_draft:row.witness_draft,
      source_pin:exactPin,followup:draft,provenance_status:status,
      authenticated_witness:false,verified_exception_closed:false,
      owner_decision:'NOT_RECORDED'};
  });
  const stale_followups=entries.filter(row=>!used.has(row.source_pin));
  const count=x=>cases.filter(row=>row.provenance_status===x).length;
  const counts={
    total_device_checks:27,unreviewed_device_checks:accepted.review.counts.unreviewed_device_checks,
    open_source_exceptions:cases.length,
    source_conflicts:count('SOURCE_CONFLICT_NOT_CLOSED'),
    witness_evidence_insufficient:count('WITNESS_EVIDENCE_INSUFFICIENT'),
    witness_missing:count('AUTHENTIC_WITNESS_MISSING'),
    device_or_source_evidence_missing:count('ACTUAL_DEVICE_OR_SOURCE_EVIDENCE_MISSING'),
    authentication_preflight_missing:count('AUTHENTICATION_PREP_MISSING'),
    external_authentication_plans_prepared_not_verified:count('PREPARED_FOR_EXTERNAL_AUTHENTICATION_NOT_VERIFIED'),
    other_followups_drafted_not_verified:count('FOLLOWUP_REQUESTED_NOT_VERIFIED'),
    stale_followups:stale_followups.length,
    stale_witnesses:accepted.review.counts.stale_witness_drafts,
    stale_source_evidence:accepted.review.counts.stale_source_evidence,
    stale_disposition_drafts:accepted.review.counts.stale_disposition_drafts,
    authenticated_witnesses:0,verified_exception_closures:0,
  };
  const documentaryReady=counts.unreviewed_device_checks===0&&
    counts.source_conflicts===0&&counts.witness_evidence_insufficient===0&&
    counts.witness_missing===0&&counts.device_or_source_evidence_missing===0&&
    counts.authentication_preflight_missing===0&&counts.other_followups_drafted_not_verified===0&&
    counts.stale_followups===0&&counts.stale_witnesses===0&&
    counts.stale_source_evidence===0&&counts.stale_disposition_drafts===0&&
    accepted.source_readiness.readiness.counts.open_dispositions_unassigned===0;
  return {source_witness_build:575,
    structural_validation:'PASS_NOT_EXTERNAL_AUTHENTICATION',counts,cases,stale_followups,
    documentary_authentication_preflight_ready:documentaryReady,
    independent_witness_authentication:'NOT_PERFORMED',
    acceptance_gate:'BLOCKED_PENDING_INDEPENDENT_AUTHENTICATION_AND_EXPLICIT_OWNER_DECISION',
    owner_decision_ready:false,owner_decision:'NOT_RECORDED',owner_signoff:'PENDING',
    external_writes:0,provider_checks:0,d1_queries:0};
}

export function provenancePacket576(witnessSource,followups,generatedAt=new Date().toISOString()){
  if(typeof generatedAt!=='string'||!Number.isFinite(Date.parse(generatedAt)))throw Error('Invalid provenance follow-up time.');
  const source=validateWitnessPacket575(witnessSource);
  const drafts=followupPacket576(validateFollowups576(followups));
  return {format:PROVENANCE_FORMAT_576,build:576,generated_at:generatedAt,
    owner_signoff:'PENDING',owner_decision:'NOT_RECORDED',owner_decision_ready:false,
    authenticated_witnesses:0,verified_exception_closures:0,
    independent_witness_authentication:'NOT_PERFORMED',
    external_writes:0,provider_checks:0,d1_queries:0,
    source_witness:source,followups:drafts,review:reviewProvenance576(source,drafts)};
}

export function validateProvenancePacket576(packet){
  if(!packet||packet.format!==PROVENANCE_FORMAT_576||packet.build!==576||
    packet.owner_signoff!=='PENDING'||packet.owner_decision!=='NOT_RECORDED'||
    packet.owner_decision_ready!==false||packet.authenticated_witnesses!==0||
    packet.verified_exception_closures!==0||
    packet.independent_witness_authentication!=='NOT_PERFORMED'||
    packet.external_writes!==0||packet.provider_checks!==0||packet.d1_queries!==0)
    throw Error('Unsupported witness authentication or owner approval claim.');
  const expected=provenancePacket576(packet.source_witness,packet.followups,packet.generated_at);
  if(JSON.stringify(packet)!==JSON.stringify(expected))throw Error('Provenance follow-up conflicts with its exact source receipts.');
  return expected;
}

export function provenanceReadback576(result){
  if(!result||result.owner_signoff!=='PENDING'||result.owner_decision_ready!==false||
    result.counts?.authenticated_witnesses!==0||result.counts?.verified_exception_closures!==0||
    !Array.isArray(result.cases))throw Error('Unsafe authentication or acceptance readback.');
  const c=result.counts;
  return [
    'Devil n Dove Build 576 — AUTHENTICATION PREFLIGHT DRAFT; NOT AUTHENTICATED WITNESS OR OWNER ACCEPTANCE',
    `Actual-device checks still unreviewed: ${c.unreviewed_device_checks}/27; open source exceptions: ${c.open_source_exceptions}.`,
    `Missing witnesses: ${c.witness_missing}; missing actual-device/source evidence: ${c.device_or_source_evidence_missing}; insufficient evidence: ${c.witness_evidence_insufficient}; conflicts: ${c.source_conflicts}.`,
    `External authentication plans prepared but NOT verified: ${c.external_authentication_plans_prepared_not_verified}; preflight plans missing: ${c.authentication_preflight_missing}; other follow-ups: ${c.other_followups_drafted_not_verified}.`,
    `Stale follow-up pins: ${c.stale_followups}; stale witness drafts: ${c.stale_witnesses}; stale source receipts: ${c.stale_source_evidence}; stale disposition drafts: ${c.stale_disposition_drafts}.`,
    `Documentary authentication PREFLIGHT ready: ${result.documentary_authentication_preflight_ready?'YES — external checks and approval still required':'NO'}.`,
    'Authenticated witnesses: 0; verified exception closures: 0; owner decision ready: NO; owner decision: NOT RECORDED; owner sign-off: PENDING.',
    ...result.cases.map(row=>`${row.priority} | ${row.device_label} | ${row.check_label} | ${row.provenance_status} | ${row.followup?.next_action||'NO_FOLLOWUP'} | ${row.route} | OPEN`),
    ...result.stale_followups.map(row=>`STALE FOLLOW-UP | ${row.device}:${row.check} | source or witness changed; do not reuse authentication claim.`),
    'Manual reference completeness cannot prove reviewer independence, signature validity, source integrity, actual owner-device testing or owner approval. Perform those checks externally; no remote Product, Etsy, provider, Inventory, Finance or D1 write.',
  ].join('\n');
}

function startProvenance576(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd576Provenance'))return;
  const get=id=>doc.getElementById(id),list=get('dd576List'),status=get('dd576State'),
    summary=get('dd576Summary'),packetBox=get('dd576Packet'),importBox=get('dd576ImportText');
  const staged=()=>{const raw=win.localStorage.getItem(STAGED_KEY_576);return raw?validateWitnessPacket575(JSON.parse(raw)):null;};
  const drafts=()=>{const raw=win.localStorage.getItem(FOLLOWUP_KEY_576);return raw?JSON.parse(raw):followupPacket576([]);};
  const refresh=()=>{
    const source=staged();if(!source)throw Error('No staged Build 575 source evidence.');
    const result=reviewProvenance576(source,drafts()),c=result.counts;
    status.textContent=`${c.unreviewed_device_checks} owner-device checks unreviewed · ${c.open_source_exceptions} OPEN exceptions · ${c.authentication_preflight_missing} authentication plans missing · ${c.external_authentication_plans_prepared_not_verified} plans prepared NOT verified · ${c.stale_followups} stale follow-ups · 0 authenticated witnesses · owner sign-off PENDING.`;
    summary.value=provenanceReadback576(result);
    packetBox.value=JSON.stringify(provenancePacket576(source,drafts()),null,2);
    return result;
  };
  const render=()=>{
    const result=refresh();list.replaceChildren();
    for(const row of result.cases){
      const card=doc.createElement('article');card.className='dd570-candidate dd576-provenance';
      const h=doc.createElement('h3');h.textContent=`${row.priority} · ${row.device_label} · ${row.check_label}`;
      const s=doc.createElement('p');s.textContent=`${row.provenance_status} · owner acceptance PENDING · case OPEN`;
      const ref=doc.createElement('p');ref.textContent=`Device retest: ${row.retest?.result||'missing'} · source: ${row.source_review?.reference||'missing'} · witness: ${row.witness_draft?.witness_reference||'missing'}`;
      const link=doc.createElement('a');link.href=row.route;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open exact Admin workspace for a real device check';
      card.append(h,s,ref,link);
      const addField=(labelText,max,existing='')=>{
        const label=doc.createElement('label'),field=doc.createElement('textarea');
        label.textContent=labelText;field.rows=2;field.maxLength=max;field.value=existing;
        label.append(field);card.append(label);return field;
      };
      const prev=row.followup;
      const actionLabel=doc.createElement('label'),action=doc.createElement('select');
      actionLabel.textContent='Manual next action (no automatic closure)';
      for(const x of [{id:'',label:'Choose a follow-up'},...ACTIONS_576]){
        const option=doc.createElement('option');option.value=x.id;option.textContent=x.label;action.append(option);
      }action.value=prev?.next_action||'';actionLabel.append(action);card.append(actionLabel);
      const note=addField('Specific evidence gap and next-step request (minimum 12 characters)',600,prev?.request_note||'');
      const methodLabel=doc.createElement('label'),method=doc.createElement('select');
      methodLabel.textContent='External authentication method to request (plan only)';
      for(const x of [{id:'NOT_SELECTED',label:'Not selected — only required for authentication plan'},...AUTH_METHODS_576]){
        const option=doc.createElement('option');option.value=x.id;option.textContent=x.label;method.append(option);
      }method.value=prev?.authentication_method||'NOT_SELECTED';methodLabel.append(method);card.append(methodLabel);
      const proof=addField('External witness proof locator (commit/report/ticket; unverified)',240,prev?.proof_locator||'');
      const basis=addField('Why the reviewer is independent (must be authenticated elsewhere)',600,prev?.reviewer_independence_basis||'');
      const receipt=addField('Exact owner-device retest receipt locator to cross-check',240,prev?.owner_device_receipt_locator||'');
      const setVisibility=()=>{
        const open=action.value==='REQUEST_AUTHENTICATED_WITNESS';
        for(const el of [methodLabel,proof.parentElement,basis.parentElement,receipt.parentElement])el.hidden=!open;
      };action.addEventListener('change',setVisibility);setVisibility();
      const ackLabel=doc.createElement('label'),ack=doc.createElement('input');ack.type='checkbox';ackLabel.className='dd569-checkbox';
      ackLabel.append(ack,doc.createTextNode(' I understand the reviewer, signatures, source and owner-device evidence are NOT authenticated or accepted by this draft.'));card.append(ackLabel);
      const save=doc.createElement('button');save.type='button';save.className='dd569-button';save.textContent='Save local authentication FOLLOW-UP DRAFT — no approval';
      save.addEventListener('click',()=>{
        if(!ack.checked){status.textContent='Explicit safety acknowledgement required; no follow-up saved.';return;}
        try{
          const auth=action.value==='REQUEST_AUTHENTICATED_WITNESS';
          const rowDraft={device:row.device,check:row.check,source_pin:row.source_pin,
            next_action:action.value,request_note:note.value,
            authentication_method:auth?method.value:'NOT_SELECTED',
            proof_locator:auth?proof.value:'',
            reviewer_independence_basis:auth?basis.value:'',
            owner_device_receipt_locator:auth?receipt.value:'',
            recorded_at:new Date().toISOString()};
          const others=validateFollowups576(drafts()).filter(x=>keyOf(x)!==keyOf(rowDraft));
          win.localStorage.setItem(FOLLOWUP_KEY_576,JSON.stringify(followupPacket576([...others,rowDraft])));
          render();
        }catch{status.textContent='Follow-up rejected: select an action and supply specific notes; authentication plans also require method, proof locator, independence basis and device receipt. No closure.';}
      });card.append(save);list.append(card);
    }
    if(result.counts.unreviewed_device_checks){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`${result.counts.unreviewed_device_checks} device checks have no actual owner observation. A witness plan cannot replace these physical checks.`;list.append(p);}
    if(result.stale_followups.length){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`${result.stale_followups.length} follow-up drafts are STALE because their exact source or witness changed. Reconcile again before external review.`;list.append(p);}
    if(!result.cases.length){const p=doc.createElement('p');p.textContent='No exception-specific source authentication plans are applicable; owner-device observations and explicit approval are still independent requirements.';list.append(p);}
  };
  const stage=source=>{const valid=validateWitnessPacket575(source);win.localStorage.setItem(STAGED_KEY_576,JSON.stringify(valid));render();};
  get('dd576Local').addEventListener('click',()=>{
    try{
      const raw=win.localStorage.getItem(WITNESS_SOURCE_KEY_575);
      if(!raw)throw Error('Missing source');
      const drafts=win.localStorage.getItem(WITNESS_KEY_575);
      stage(witnessPacket575(JSON.parse(raw),drafts?JSON.parse(drafts):witnessDraftPacket575([])));
    }catch{status.textContent='No valid saved Build 575 witness source. Prepare sections 8–9, or import its complete witness JSON. No approval recorded.';}
  });
  get('dd576Import').addEventListener('click',()=>{
    if(!get('dd576Confirm').checked){status.textContent='Review and acknowledge untrusted Build 575 evidence before staging.';return;}
    try{if(!importBox.value||importBox.value.length>550000)throw Error('Invalid input size');
      stage(JSON.parse(importBox.value));get('dd576Confirm').checked=false;
      status.textContent='Build 575 witness packet structurally validated; external authentication NOT PERFORMED; owner sign-off PENDING.';
    }catch{status.textContent='Imported packet rejected: malformed, tampered or unsupported source. No prior observations or sign-off changed.';}
  });
  get('dd576Review').addEventListener('click',()=>{try{render();}catch{status.textContent='No valid staged provenance source or follow-up drafts.';}});
  const copy=async(field,label)=>{
    try{refresh();try{await win.navigator.clipboard.writeText(field.value);status.textContent=`${label} copied; independent verification and owner acceptance PENDING.`;}
      catch{field.focus();field.select();status.textContent=`Clipboard unavailable; ${label} selected for manual copy. No approval.`;}}
    catch{status.textContent='No valid follow-up packet to copy.';}
  };
  get('dd576CopySummary').addEventListener('click',()=>copy(summary,'Owner-device authentication follow-up'));
  get('dd576CopyPacket').addEventListener('click',()=>copy(packetBox,'Provenance readiness JSON draft'));
}
if(typeof document!=='undefined')startProvenance576();
