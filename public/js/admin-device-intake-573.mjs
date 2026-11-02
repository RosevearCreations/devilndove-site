/* Build 573 — untrusted owner evidence intake and open-exception disposition drafts.
 * Imported JSON is not owner authentication, independent proof or approval. */
import {STORAGE_KEY_569,makePacket569,CHECKS_569,DEVICES_569} from './admin-device-acceptance-569.mjs?v=576';
import {RETEST_STORAGE_571,retestPacket571} from './admin-device-retest-571.mjs?v=576';
import {NOTES_KEY_572,reviewNotesPacket572,acceptancePacket572,validateAcceptancePacket572} from './admin-device-evidence-572.mjs?v=576';

export const DISPOSITION_FORMAT_573='devilndove-admin-device-disposition-draft-573-v1';
export const INTAKE_FORMAT_573='devilndove-admin-evidence-intake-573-v1';
export const STAGED_KEY_573='dd:admin-evidence-intake:573:v1';
export const DISPOSITION_KEY_573='dd:admin-disposition-draft:573:v1';
export const DISPOSITIONS_573=[
  {id:'KEEP_OPEN',label:'Keep exception open; more evidence needed'},
  {id:'REQUEST_DEVICE_RETEST',label:'Request an actual-device retest'},
  {id:'REQUEST_INDEPENDENT_PROOF',label:'Request independent source verification'},
  {id:'ESCALATE_SOURCE_FIX',label:'Escalate a reproducible source defect'},
];
const devices=new Set(DEVICES_569.map(row=>row.id));
const checks=new Set(CHECKS_569.map(row=>row.id));
const dispositions=new Set(DISPOSITIONS_573.map(row=>row.id));
const keyOf=row=>`${row.device}:${row.check}`;
const pinOf=row=>JSON.stringify([
  row.device,row.check,row.original_observed_at,row.original_observation,
  row.retest?.result||'',row.retest?.detail||'',row.retest?.retested_at||'',
  row.source_review?.reference||'',
]);
const pinOfDraft=row=>JSON.stringify([
  row.device,row.check,row.source_observed_at,row.source_note,
  row.retest_result,row.retest_detail,row.retested_at,row.source_reference,
]);

export function validateDispositions573(packet){
  if(!packet||packet.format!==DISPOSITION_FORMAT_573||packet.build!==573||
    packet.owner_signoff!=='PENDING'||!Array.isArray(packet.entries)||packet.entries.length>27)
    throw Error('Unsupported disposition packet or acceptance claim.');
  const seen=new Set();
  return packet.entries.map(row=>{
    if(!row||!devices.has(row.device)||!checks.has(row.check)||
      typeof row.source_observed_at!=='string'||typeof row.source_note!=='string'||row.source_note.length>600||
      typeof row.retest_result!=='string'||!['','still-failing','appears-fixed'].includes(row.retest_result)||
      typeof row.retest_detail!=='string'||row.retest_detail.length>600||
      typeof row.retested_at!=='string'||typeof row.source_reference!=='string'||row.source_reference.length>240||
      !dispositions.has(row.disposition)||typeof row.review_note!=='string'||
      row.review_note.trim().length<12||row.review_note.length>600||
      typeof row.reviewed_at!=='string'||!Number.isFinite(Date.parse(row.reviewed_at)))
      throw Error('Incomplete, forged or unsupported disposition entry.');
    const key=keyOf(row);if(seen.has(key))throw Error('Duplicate disposition requires manual review.');seen.add(key);
    return {device:row.device,check:row.check,source_observed_at:row.source_observed_at,
      source_note:row.source_note,retest_result:row.retest_result,retest_detail:row.retest_detail,
      retested_at:row.retested_at,source_reference:row.source_reference,
      disposition:row.disposition,review_note:row.review_note.trim(),reviewed_at:row.reviewed_at};
  });
}

export function dispositionPacket573(entries){
  const packet={format:DISPOSITION_FORMAT_573,build:573,owner_signoff:'PENDING',entries};
  packet.entries=validateDispositions573(packet);return packet;
}

export function reconcileIntake573(input,dispositionPacket){
  const source=validateAcceptancePacket572(input);
  const notes=validateDispositions573(dispositionPacket);
  const matches=new Map(notes.map(row=>[pinOfDraft(row),row]));
  const used=new Set();
  const cases=source.cases.map(row=>{
    const pin=pinOf(row),saved=matches.get(pin)||null;
    if(saved)used.add(pin);
    const recommended=row.state==='OWNER_REPORTS_STILL_FAILING'?'ESCALATE_SOURCE_FIX':
      row.state==='AWAITING_DEVICE_RETEST'?'REQUEST_DEVICE_RETEST':'REQUEST_INDEPENDENT_PROOF';
    return {device:row.device,check:row.check,device_label:row.device_label,
      check_label:row.check_label,priority:row.priority,route:row.route,
      original_observation:row.original_observation,original_observed_at:row.original_observed_at,
      retest:row.retest,source_review:row.source_review,source_lane:row.state,
      recommended_disposition:recommended,manual_disposition:saved,
      verified_closed:false,owner_decision:'NOT_RECORDED'};
  });
  const stale=notes.filter(row=>!used.has(pinOfDraft(row)));
  const counts={source_exceptions:cases.length,unreviewed_device_checks:source.counts.unreviewed_device_checks,
    awaiting_disposition:cases.filter(row=>!row.manual_disposition).length,
    open_device_retests:cases.filter(row=>row.source_lane==='AWAITING_DEVICE_RETEST').length,
    owner_reports_still_failing:cases.filter(row=>row.source_lane==='OWNER_REPORTS_STILL_FAILING').length,
    unverified_source_references:cases.filter(row=>row.source_lane==='SOURCE_REFERENCE_RECORDED_UNVERIFIED').length,
    stale_source_retests:source.counts.stale_retests+source.counts.stale_source_notes,
    stale_disposition_drafts:stale.length,verified_closures:0};
  return {source_packet_generated_at:source.generated_at,source_packet_format:source.format,
    structural_validation:'PASS_NOT_OWNER_AUTHENTICATION',cases,stale_dispositions:stale,counts,
    owner_signoff:'PENDING',owner_decision:'NOT_RECORDED',
    independent_source_verification:'NOT_PERFORMED',external_writes:0,provider_checks:0,d1_queries:0};
}

export function intakePacket573(input,dispositions,generatedAt=new Date().toISOString()){
  if(typeof generatedAt!=='string'||!Number.isFinite(Date.parse(generatedAt)))throw Error('Invalid intake time.');
  const source=validateAcceptancePacket572(input);
  const drafts=dispositionPacket573(validateDispositions573(dispositions));
  const review=reconcileIntake573(source,drafts);
  return {format:INTAKE_FORMAT_573,build:573,generated_at:generatedAt,
    intake:'STRUCTURALLY_VALIDATED_UNAUTHENTICATED',owner_signoff:'PENDING',owner_decision:'NOT_RECORDED',
    verified_closures:0,independent_source_verification:'NOT_PERFORMED',
    external_writes:0,provider_checks:0,d1_queries:0,
    source_packet:source,dispositions:drafts,review};
}

export function validateIntakePacket573(packet){
  if(!packet||packet.format!==INTAKE_FORMAT_573||packet.build!==573||
    packet.intake!=='STRUCTURALLY_VALIDATED_UNAUTHENTICATED'||packet.owner_signoff!=='PENDING'||
    packet.owner_decision!=='NOT_RECORDED'||packet.verified_closures!==0||
    packet.independent_source_verification!=='NOT_PERFORMED'||
    packet.external_writes!==0||packet.provider_checks!==0||packet.d1_queries!==0)
    throw Error('Unsupported final decision or acceptance claim.');
  const expected=intakePacket573(packet.source_packet,packet.dispositions,packet.generated_at);
  if(JSON.stringify(packet)!==JSON.stringify(expected))throw Error('Intake packet conflicts with its source evidence.');
  return expected;
}

export function intakeReadback573(result){
  if(!result||result.owner_signoff!=='PENDING'||result.owner_decision!=='NOT_RECORDED'||
    result.counts?.verified_closures!==0||!Array.isArray(result.cases))throw Error('Unsafe acceptance decision claim.');
  const c=result.counts;
  return [
    'Devil n Dove Build 573 — UNAUTHENTICATED EVIDENCE INTAKE & OPEN DISPOSITION DRAFT',
    `Source packet: ${result.source_packet_format}; generated: ${result.source_packet_generated_at}; structural validation: ${result.structural_validation}.`,
    `Open exceptions: ${c.source_exceptions}; unreviewed device checks: ${c.unreviewed_device_checks}; awaiting manual disposition: ${c.awaiting_disposition}.`,
    `Awaiting retest: ${c.open_device_retests}; still failing: ${c.owner_reports_still_failing}; unverified source references: ${c.unverified_source_references}.`,
    `Stale source receipts/reviews: ${c.stale_source_retests}; stale manual dispositions: ${c.stale_disposition_drafts}.`,
    'Verified closures: 0; independent source verification: NOT PERFORMED; owner decision: NOT RECORDED; owner sign-off: PENDING.',
    ...result.cases.map(row=>`${row.priority} | ${row.device_label} | ${row.check_label} | ${row.source_lane} | proposed: ${row.manual_disposition?.disposition||'UNASSIGNED'} | suggested: ${row.recommended_disposition} | ${row.route} | OPEN`),
    ...result.stale_dispositions.map(row=>`STALE DISPOSITION | ${row.device}:${row.check} | original report, retest or source reference changed.`),
    'No decision closes any case. Imported packet integrity is structural, not identity or evidence authentication. Explicit owner-device acceptance and independent proof remain separate.',
  ].join('\n');
}

function startIntake573(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd573Intake'))return;
  const get=id=>doc.getElementById(id),list=get('dd573List'),status=get('dd573State'),
    sourceBox=get('dd573ImportText'),summary=get('dd573Summary'),exportBox=get('dd573Packet');
  const savedSource=()=>{const raw=win.localStorage.getItem(STAGED_KEY_573);return raw?validateAcceptancePacket572(JSON.parse(raw)):null;};
  const savedDispositions=()=>{const raw=win.localStorage.getItem(DISPOSITION_KEY_573);return raw?JSON.parse(raw):dispositionPacket573([]);};
  const sourceLocal=()=>{
    const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
    return acceptancePacket572(read(STORAGE_KEY_569,makePacket569([])),
      read(RETEST_STORAGE_571,retestPacket571([])),read(NOTES_KEY_572,reviewNotesPacket572([])));
  };
  const refresh=()=>{
    const packet=savedSource();if(!packet)throw Error('No staged packet');
    const entries=savedDispositions(),review=reconcileIntake573(packet,entries);
    const c=review.counts;
    status.textContent=`${c.source_exceptions} OPEN exceptions · ${c.unreviewed_device_checks} unreviewed device checks · ${c.awaiting_disposition} awaiting disposition · ${c.stale_disposition_drafts} stale drafts · 0 verified closures · owner decision NOT RECORDED · sign-off PENDING.`;
    summary.value=intakeReadback573(review);
    exportBox.value=JSON.stringify(intakePacket573(packet,entries),null,2);
    return review;
  };
  const render=()=>{
    const review=refresh();list.replaceChildren();
    for(const row of review.cases){
      const card=doc.createElement('article');card.className='dd570-candidate dd573-case';
      const h=doc.createElement('h3');h.textContent=`${row.priority} · ${row.device_label} · ${row.check_label}`;
      const original=doc.createElement('p');original.textContent=`Original report: ${row.original_observation||'No detail supplied'}`;
      const retest=doc.createElement('p');retest.textContent=row.retest?`Device retest: ${row.retest.result} · ${row.retest.detail}`:'Device retest: missing.';
      const proof=doc.createElement('p');proof.textContent=`Source reference: ${row.source_review?.reference||'Not supplied'} — UNVERIFIED.`;
      const lane=doc.createElement('p');lane.textContent=`Open exception lane: ${row.source_lane}. Suggested follow-up: ${row.recommended_disposition}.`;
      const label=doc.createElement('label');label.textContent='Proposed open-case disposition (cannot approve or close)';
      const select=doc.createElement('select');select.id=`dd573-disposition-${row.device}-${row.check}`;
      const choose=doc.createElement('option');choose.value='';choose.textContent='Choose an open-case action…';select.append(choose);
      for(const action of DISPOSITIONS_573){const opt=doc.createElement('option');opt.value=action.id;opt.textContent=action.label;select.append(opt);}
      if(row.manual_disposition)select.value=row.manual_disposition.disposition;label.htmlFor=select.id;
      const noteLabel=doc.createElement('label');noteLabel.textContent='Review rationale (minimum 12 characters; no private data)';
      const note=doc.createElement('textarea');note.id=`dd573-note-${row.device}-${row.check}`;note.rows=3;note.maxLength=600;note.value=row.manual_disposition?.review_note||'';noteLabel.htmlFor=note.id;
      const confirmLabel=doc.createElement('label');confirmLabel.className='dd569-checkbox';
      const confirm=doc.createElement('input');confirm.type='checkbox';confirmLabel.append(confirm,doc.createTextNode(' I reviewed this imported source case. This is only a follow-up draft, not verified closure or owner sign-off.'));
      const save=doc.createElement('button');save.type='button';save.className='dd569-button';save.textContent='Save open-case disposition draft';
      const message=doc.createElement('p');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
      save.addEventListener('click',()=>{
        if(!confirm.checked||!dispositions.has(select.value)||note.value.trim().length<12){message.textContent='Choose an open-case action, explain the rationale and confirm manual review. No final approval option is available.';return;}
        try{
          const packet=savedSource(),current=reconcileIntake573(packet,savedDispositions()).cases.find(x=>keyOf(x)===keyOf(row));
          if(!current||pinOf(current)!==pinOf(row))throw Error('Evidence changed');
          const entry={device:row.device,check:row.check,source_observed_at:row.original_observed_at,
            source_note:row.original_observation,retest_result:row.retest?.result||'',
            retest_detail:row.retest?.detail||'',retested_at:row.retest?.retested_at||'',
            source_reference:row.source_review?.reference||'',disposition:select.value,
            review_note:note.value.trim(),reviewed_at:new Date().toISOString()};
          const entries=validateDispositions573(savedDispositions()).filter(x=>keyOf(x)!==keyOf(entry));entries.push(entry);
          win.localStorage.setItem(DISPOSITION_KEY_573,JSON.stringify(dispositionPacket573(entries)));
          refresh();confirm.checked=false;message.textContent='Saved on this browser only. Exception OPEN, proof unverified, owner sign-off PENDING.';
        }catch{message.textContent='Disposition not saved: staged evidence changed or browser storage unavailable. Reconcile the packet again.';}
      });
      card.append(h,original,retest,proof,lane,label,select,noteLabel,note,confirmLabel,save,message);list.append(card);
    }
    for(const row of review.stale_dispositions){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`STALE DISPOSITION · ${row.device}:${row.check} · imported source, retest or reference changed.`;list.append(p);}
    if(!review.cases.length){const p=doc.createElement('p');p.textContent='No reported exceptions in this packet. Unreviewed device checks still require authentic owner testing; this is NOT acceptance.';list.append(p);}
  };
  const stage=packet=>{
    const valid=validateAcceptancePacket572(packet);
    win.localStorage.setItem(STAGED_KEY_573,JSON.stringify(valid));
    render();
  };
  get('dd573Local').addEventListener('click',()=>{
    try{stage(sourceLocal());}catch{status.textContent='Local source packet unavailable or invalid. No existing observations changed.';}
  });
  get('dd573Import').addEventListener('click',()=>{
    if(!get('dd573Confirm').checked){status.textContent='Review the contents and check the untrusted-import confirmation first.';return;}
    try{
      const input=sourceBox.value;if(!input||input.length>180000)throw Error('Unsupported size');
      stage(JSON.parse(input));get('dd573Confirm').checked=false;
      status.textContent='Structurally valid copied packet staged on this browser. No identity or independent proof verified; owner sign-off PENDING.';
    }catch{status.textContent='Import refused: malformed, conflicting or unsupported packet. Original Build 569–572 observations remain untouched.';}
  });
  get('dd573Review').addEventListener('click',()=>{
    try{render();}catch{status.textContent='No valid staged evidence packet to review. No decision recorded.';}
  });
  const copy=async (field,label)=>{
    try{refresh();
      try{await win.navigator.clipboard.writeText(field.value);status.textContent=`${label} copied for deliberate manual review. Exceptions remain OPEN.`;}
      catch{field.focus();field.select();status.textContent=`Clipboard unavailable; ${label} selected for manual copy. No approval.`;}
    }catch{status.textContent='No valid evidence staged; nothing copied.';}
  };
  get('dd573CopySummary').addEventListener('click',()=>copy(summary,'Open-case readback'));
  get('dd573CopyPacket').addEventListener('click',()=>copy(exportBox,'Intake draft packet'));
}
if(typeof document!=='undefined')startIntake573();
