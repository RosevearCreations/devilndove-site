/* Build 577 — exact-source independent attestation exception triage and owner-safe handoff.
 * Local references are review requests, never authenticated signatures or owner acceptance. */
import {STAGED_KEY_576,FOLLOWUP_KEY_576,followupPacket576,provenancePacket576,
  validateProvenancePacket576} from './admin-device-provenance-576.mjs?v=577';

export const ATTESTATION_FORMAT_577='devilndove-admin-device-attestation-exceptions-577-v1';
export const HANDOFF_FORMAT_577='devilndove-admin-owner-evidence-handoff-577-v1';
export const SOURCE_KEY_577='dd:admin-device-attestation-source:577:v1';
export const EXCEPTION_KEY_577='dd:admin-device-attestation-exceptions:577:v1';
export const DISPOSITIONS_577=[
  {id:'REQUEST_OWNER_DEVICE_RECEIPT',label:'Request actual owner-device evidence'},
  {id:'REQUEST_SOURCE_ATTESTATION',label:'Request independent signed source attestation'},
  {id:'REQUEST_REVIEWER_IDENTITY',label:'Request externally verifiable reviewer identity'},
  {id:'REQUEST_SIGNATURE_CHAIN_CHECK',label:'Request external signature/source-chain verification'},
  {id:'ESCALATE_CONFLICT',label:'Escalate conflicting or stale source evidence'},
];
const decisions=new Set(DISPOSITIONS_577.map(x=>x.id));
const caseKey=row=>`${row.device}:${row.check}`;
export function attestationPin577(row){
  const p=row.followup;
  return JSON.stringify([row.source_pin,p?.next_action||'',p?.authentication_method||'',
    p?.proof_locator||'',p?.reviewer_independence_basis||'',
    p?.owner_device_receipt_locator||'',p?.request_note||'',p?.recorded_at||'']);
}
export function validateExceptions577(packet){
  if(!packet||packet.format!==ATTESTATION_FORMAT_577||packet.build!==577||
    packet.owner_signoff!=='PENDING'||!Array.isArray(packet.entries)||packet.entries.length>27)
    throw Error('Invalid attestation exception packet or owner decision.');
  const seen=new Set();
  return packet.entries.map(row=>{
    if(!row||!['desktop','phone','tablet'].includes(row.device)||
      typeof row.check!=='string'||!/^[a-z][a-z0-9-]{0,35}$/.test(row.check)||
      typeof row.source_pin!=='string'||row.source_pin.length<20||row.source_pin.length>5300||
      !decisions.has(row.disposition)||typeof row.review_request!=='string'||
      row.review_request.trim().length<12||row.review_request.length>700||
      typeof row.external_attestation_locator!=='string'||row.external_attestation_locator.length>260||
      typeof row.reviewer_identity_locator!=='string'||row.reviewer_identity_locator.length>260||
      typeof row.same_device_receipt_locator!=='string'||row.same_device_receipt_locator.length>260||
      typeof row.recorded_at!=='string'||!Number.isFinite(Date.parse(row.recorded_at)))
      throw Error('Invalid or incomplete independent attestation review request.');
    const key=caseKey(row);if(seen.has(key))throw Error('Duplicate device exception.');seen.add(key);
    return {device:row.device,check:row.check,source_pin:row.source_pin,
      disposition:row.disposition,review_request:row.review_request.trim(),
      external_attestation_locator:row.external_attestation_locator.trim(),
      reviewer_identity_locator:row.reviewer_identity_locator.trim(),
      same_device_receipt_locator:row.same_device_receipt_locator.trim(),
      recorded_at:row.recorded_at};
  });
}
export function exceptionPacket577(entries){
  const packet={format:ATTESTATION_FORMAT_577,build:577,owner_signoff:'PENDING',entries};
  packet.entries=validateExceptions577(packet);return packet;
}
export function reviewAttestation577(source,exceptions){
  const provenance=validateProvenancePacket576(source),entries=validateExceptions577(exceptions);
  const lookup=new Map(entries.map(row=>[row.source_pin,row])),used=new Set();
  const cases=provenance.review.cases.map(row=>{
    const pin=attestationPin577(row),request=lookup.get(pin)||null;
    if(request)used.add(pin);
    // A supplied URL or typed independent reviewer is documentary-only.
    const state=row.provenance_status==='SOURCE_CONFLICT_NOT_CLOSED'?'SOURCE_CONFLICT_OPEN':
      row.provenance_status==='WITNESS_EVIDENCE_INSUFFICIENT'?'WITNESS_EVIDENCE_INSUFFICIENT':
      row.provenance_status==='ACTUAL_DEVICE_OR_SOURCE_EVIDENCE_MISSING'?'DEVICE_OR_SOURCE_RECEIPT_MISSING':
      row.provenance_status==='AUTHENTIC_WITNESS_MISSING'?'WITNESS_SOURCE_MISSING':
      !row.followup?'AUTHENTICATION_PLAN_MISSING':
      row.followup.next_action!=='REQUEST_AUTHENTICATED_WITNESS'?'NON_AUTHENTICATION_FOLLOWUP_OPEN':
      !request?'ATTESTATION_REVIEW_REQUEST_MISSING':
      !request.external_attestation_locator||!request.reviewer_identity_locator||!request.same_device_receipt_locator?
        'ATTESTATION_SOURCE_LOCATORS_INCOMPLETE':'EXTERNAL_ATTESTATION_CHECK_REQUESTED_NOT_VERIFIED';
    return {device:row.device,check:row.check,device_label:row.device_label,
      check_label:row.check_label,priority:row.priority,route:row.route,
      source_pin:pin,provenance_status:row.provenance_status,attestation_status:state,
      request,source_retest:row.retest?.result||'MISSING',
      witness_reference:row.witness_draft?.witness_reference||'',
      planned_method:row.followup?.authentication_method||'NOT_SELECTED',
      authenticated_attestation:false,exception_closed:false,owner_approved:false};
  });
  const stale_exceptions=entries.filter(row=>!used.has(row.source_pin));
  const statuses=Object.fromEntries([...new Set(cases.map(c=>c.attestation_status))]
    .sort().map(status=>[status,cases.filter(c=>c.attestation_status===status).length]));
  const outstandingDeviceChecks=provenance.review.counts.unreviewed_device_checks;
  const requestsToVerify=cases.filter(c=>c.attestation_status==='EXTERNAL_ATTESTATION_CHECK_REQUESTED_NOT_VERIFIED').length;
  return {source_provenance_build:576,structural_validation:'PASS_NOT_EXTERNAL_ATTESTATION',
    counts:{total_device_checks:27,unreviewed_device_checks:outstandingDeviceChecks,
      open_source_exceptions:cases.length,external_attestation_requests_prepared:requestsToVerify,
      stale_exception_requests:stale_exceptions.length,authenticated_attestations:0,
      independently_verified_closures:0},status_counts:statuses,cases,stale_exceptions,
    handoff_prepared_for_external_review:true,independent_source_attestation:'NOT_PERFORMED',
    owner_decision_ready:false,owner_decision:'NOT_RECORDED',owner_signoff:'PENDING',
    acceptance_gate:'BLOCKED_PENDING_INDEPENDENT_SOURCE_ATTESTATION_AND_OWNER_DEVICE_ACCEPTANCE',
    external_writes:0,provider_checks:0,d1_queries:0};
}
export function ownerHandoffPacket577(source,exceptions,generatedAt=new Date().toISOString()){
  if(typeof generatedAt!=='string'||!Number.isFinite(Date.parse(generatedAt)))throw Error('Invalid handoff date.');
  const validated=validateProvenancePacket576(source),requests=exceptionPacket577(validateExceptions577(exceptions));
  const review=reviewAttestation577(validated,requests);
  return {format:HANDOFF_FORMAT_577,build:577,generated_at:generatedAt,
    owner_signoff:'PENDING',owner_decision:'NOT_RECORDED',owner_decision_ready:false,
    authenticated_attestations:0,verified_exception_closures:0,
    independent_source_attestation:'NOT_PERFORMED',external_writes:0,provider_checks:0,d1_queries:0,
    source_provenance:validated,attestation_exception_requests:requests,review};
}
export function validateOwnerHandoff577(packet){
  if(!packet||packet.format!==HANDOFF_FORMAT_577||packet.build!==577||
    packet.owner_signoff!=='PENDING'||packet.owner_decision!=='NOT_RECORDED'||
    packet.owner_decision_ready!==false||packet.authenticated_attestations!==0||
    packet.verified_exception_closures!==0||packet.independent_source_attestation!=='NOT_PERFORMED'||
    packet.external_writes!==0||packet.provider_checks!==0||packet.d1_queries!==0)
    throw Error('Unsupported source attestation or owner acceptance claim.');
  const expected=ownerHandoffPacket577(packet.source_provenance,packet.attestation_exception_requests,packet.generated_at);
  if(JSON.stringify(packet)!==JSON.stringify(expected))throw Error('Handoff conflicts with its exact source records.');
  return expected;
}
export function ownerHandoffReadback577(review){
  if(!review||review.owner_signoff!=='PENDING'||review.owner_decision_ready!==false||
    review.counts?.authenticated_attestations!==0||review.counts?.independently_verified_closures!==0)
    throw Error('Unsafe owner acceptance readback.');
  const c=review.counts;
  return [
    'Devil n Dove Build 577 — INDEPENDENT SOURCE ATTESTATION EXCEPTION REVIEW AND OWNER EVIDENCE HANDOFF',
    `Actual owner-device checks unreviewed: ${c.unreviewed_device_checks} / ${c.total_device_checks}.`,
    `Open source exceptions: ${c.open_source_exceptions}; external attestation requests prepared, NOT VERIFIED: ${c.external_attestation_requests_prepared}.`,
    `Stale request pins: ${c.stale_exception_requests}; authenticated attestations: 0; independently verified closures: 0.`,
    'Owner decision: NOT RECORDED; sign-off: PENDING; decision ready: NO.',
    ...review.cases.map(row=>`${row.priority} | ${row.device_label} | ${row.check_label} | ${row.attestation_status} | ${row.request?.disposition||'NO_REQUEST'} | ${row.route} | OPEN`),
    ...review.stale_exceptions.map(row=>`STALE ATTESTATION REQUEST | ${row.device}:${row.check} | source/witness/provenance plan changed; recheck exact evidence.`),
    'Owner handoff is a copyable packet for independent verification, NOT a signature, closure or publishing permission. The real owner must retest, compare source and explicitly decide outside this worksheet.',
    'No Product, Etsy, Meta, Inventory, Finance, D1 or provider write.',
  ].join('\n');
}

function startAttestation577(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd577Attestation'))return;
  const get=id=>doc.getElementById(id),list=get('dd577List'),status=get('dd577State'),
    summary=get('dd577Summary'),packetBox=get('dd577Packet'),input=get('dd577ImportText');
  const staged=()=>{const raw=win.localStorage.getItem(SOURCE_KEY_577);return raw?validateProvenancePacket576(JSON.parse(raw)):null;};
  const drafts=()=>{const raw=win.localStorage.getItem(EXCEPTION_KEY_577);return raw?JSON.parse(raw):exceptionPacket577([]);};
  const refresh=()=>{
    const source=staged();if(!source)throw Error('No staged Build 576 provenance source.');
    const review=reviewAttestation577(source,drafts()),c=review.counts;
    status.textContent=`${c.unreviewed_device_checks} unreviewed device checks · ${c.open_source_exceptions} OPEN source exceptions · ${c.external_attestation_requests_prepared} external check requests NOT verified · ${c.stale_exception_requests} stale requests · owner sign-off PENDING.`;
    summary.value=ownerHandoffReadback577(review);
    packetBox.value=JSON.stringify(ownerHandoffPacket577(source,drafts()),null,2);
    return review;
  };
  const render=()=>{
    const review=refresh();list.replaceChildren();
    for(const row of review.cases){
      const card=doc.createElement('article');card.className='dd570-candidate dd577-attestation';
      const heading=doc.createElement('h3');heading.textContent=`${row.priority} · ${row.device_label} · ${row.check_label}`;
      const state=doc.createElement('p');state.textContent=`${row.attestation_status} · unresolved, not authenticated`;
      const refs=doc.createElement('p');refs.textContent=`Same-device retest: ${row.source_retest} · witness reference: ${row.witness_reference||'missing'} · preflight method: ${row.planned_method}`;
      const link=doc.createElement('a');link.href=row.route;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Inspect original Admin device workspace';
      card.append(heading,state,refs,link);
      const field=(labelText,max,current='')=>{const label=doc.createElement('label'),textarea=doc.createElement('textarea');
        label.textContent=labelText;textarea.rows=2;textarea.maxLength=max;textarea.value=current;
        label.append(textarea);card.append(label);return textarea;};
      const label=doc.createElement('label'),select=doc.createElement('select');label.textContent='Independent verification follow-up (request only)';
      for(const opt of [{id:'',label:'Choose required external follow-up'},...DISPOSITIONS_577]){
        const option=doc.createElement('option');option.value=opt.id;option.textContent=opt.label;select.append(option);
      }select.value=row.request?.disposition||'';label.append(select);card.append(label);
      const note=field('Specific source/witness gap and action required',700,row.request?.review_request||'');
      const proof=field('Attestation proof locator for independent inspection (unverified)',260,row.request?.external_attestation_locator||'');
      const reviewer=field('Reviewer identity proof locator (unverified)',260,row.request?.reviewer_identity_locator||'');
      const device=field('Exact owner-device receipt locator (unverified)',260,row.request?.same_device_receipt_locator||'');
      const ackLabel=doc.createElement('label'),ack=doc.createElement('input');ack.type='checkbox';ackLabel.className='dd569-checkbox';
      ackLabel.append(ack,doc.createTextNode(' This records a request for review only. No signature, reviewer, source, device retest or owner approval is independently verified.'));
      card.append(ackLabel);
      const save=doc.createElement('button');save.type='button';save.className='dd569-button';save.textContent='Save local attestation EXCEPTION REQUEST — keep case OPEN';
      save.addEventListener('click',()=>{
        if(!ack.checked){status.textContent='Confirm that the evidence is unverified before saving a follow-up request.';return;}
        try{const draft={device:row.device,check:row.check,source_pin:row.source_pin,
          disposition:select.value,review_request:note.value,
          external_attestation_locator:proof.value,reviewer_identity_locator:reviewer.value,
          same_device_receipt_locator:device.value,recorded_at:new Date().toISOString()};
          const others=validateExceptions577(drafts()).filter(x=>caseKey(x)!==caseKey(draft));
          win.localStorage.setItem(EXCEPTION_KEY_577,JSON.stringify(exceptionPacket577([...others,draft])));render();
        }catch{status.textContent='Select an external verification action and provide a specific request of at least 12 characters. No case was closed.';}
      });card.append(save);list.append(card);
    }
    if(review.counts.unreviewed_device_checks){const p=doc.createElement('p');p.className='dd572-stale';
      p.textContent=`${review.counts.unreviewed_device_checks} actual-device checks still need our personal observation. An external attestation request cannot replace those checks.`;list.append(p);}
    if(review.stale_exceptions.length){const p=doc.createElement('p');p.className='dd572-stale';
      p.textContent=`${review.stale_exceptions.length} attestation request(s) are STALE because exact source/provenance changed. They cannot be reused as proof.`;list.append(p);}
    if(!review.cases.length){const p=doc.createElement('p');p.textContent='No exception-specific requests to record. Device observations, independent verification and owner approval remain separate pending requirements.';list.append(p);}
  };
  const stage=source=>{const checked=validateProvenancePacket576(source);win.localStorage.setItem(SOURCE_KEY_577,JSON.stringify(checked));render();};
  get('dd577Local').addEventListener('click',()=>{
    try{const raw=win.localStorage.getItem(STAGED_KEY_576);if(!raw)throw Error('Missing source');
      const f=win.localStorage.getItem(FOLLOWUP_KEY_576);
      stage(provenancePacket576(JSON.parse(raw),f?JSON.parse(f):followupPacket576([])));
    }catch{status.textContent='No valid Build 576 source saved here. Complete section 10 or import its exact provenance JSON; no approval recorded.';}
  });
  get('dd577Import').addEventListener('click',()=>{
    if(!get('dd577Confirm').checked){status.textContent='Review untrusted source and confirm import limitations first.';return;}
    try{if(!input.value||input.value.length>900000)throw Error('Oversize or empty packet');
      stage(JSON.parse(input.value));get('dd577Confirm').checked=false;
      status.textContent='Build 576 packet structurally validated and staged. Attestations and owner approval remain UNVERIFIED.';
    }catch{status.textContent='Build 576 packet invalid, conflicting or unsupported. No earlier evidence or owner decision changed.';}
  });
  get('dd577Review').addEventListener('click',()=>{try{render();}catch{status.textContent='No valid source or exception drafts staged.';}});
  const copy=async(field,label)=>{
    try{refresh();try{await win.navigator.clipboard.writeText(field.value);status.textContent=`${label} copied for outside review; sign-off PENDING.`;}
      catch{field.focus();field.select();status.textContent=`Clipboard unavailable; ${label} selected to copy manually. No acceptance.`;}}
    catch{status.textContent='No valid attestation exception handoff to copy.';}
  };
  get('dd577CopySummary').addEventListener('click',()=>copy(summary,'Owner-safe exception readback'));
  get('dd577CopyPacket').addEventListener('click',()=>copy(packetBox,'Full owner evidence handoff'));
}
if(typeof document!=='undefined')startAttestation577();
