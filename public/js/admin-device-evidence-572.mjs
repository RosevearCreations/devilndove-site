/* Build 572 — source-matched exception reconciliation and owner-safe evidence.
 * Browser-local review references are not independent proof or owner approval. */
import {STORAGE_KEY_569,makePacket569,validatePacket569} from './admin-device-acceptance-569.mjs?v=575';
import {triagePacket570} from './admin-device-followup-570.mjs?v=575';
import {RETEST_STORAGE_571,retestPacket571,validateRetests571,reconcileRetests571} from './admin-device-retest-571.mjs?v=575';

export const EVIDENCE_FORMAT_572='devilndove-admin-acceptance-evidence-572-v1';
export const NOTES_FORMAT_572='devilndove-admin-source-review-notes-572-v1';
export const NOTES_KEY_572='dd:admin-source-review:572:v1';
const keyOf=row=>`${row.device}:${row.check}`;
const pinOf=(candidate,receipt)=>JSON.stringify([
  candidate.device,candidate.check,candidate.observed_at,candidate.observation,
  receipt.result,receipt.detail,receipt.retested_at,
]);
const pinOfNote=row=>JSON.stringify([
  row.device,row.check,row.source_observed_at,row.source_note,
  row.retest_result,row.retest_detail,row.retested_at,
]);

export function validateReviewNotes572(packet){
  if(!packet||packet.format!==NOTES_FORMAT_572||packet.build!==572||packet.owner_signoff!=='PENDING'||
    !Array.isArray(packet.entries)||packet.entries.length>27)throw Error('Unsupported source-review packet or approval claim.');
  const seen=new Set();
  return packet.entries.map(row=>{
    if(!row||!['desktop','phone','tablet'].includes(row.device)||typeof row.check!=='string'||
      typeof row.source_observed_at!=='string'||typeof row.source_note!=='string'||row.source_note.length>600||
      row.retest_result!=='appears-fixed'||typeof row.retest_detail!=='string'||row.retest_detail.length>600||
      typeof row.retested_at!=='string'||!Number.isFinite(Date.parse(row.retested_at))||
      typeof row.reference!=='string'||row.reference.trim().length<8||row.reference.length>240||
      typeof row.review_note!=='string'||row.review_note.trim().length<12||row.review_note.length>600||
      typeof row.compared_at!=='string'||!Number.isFinite(Date.parse(row.compared_at)))
      throw Error('Incomplete or unsupported source review note.');
    const key=keyOf(row);if(seen.has(key))throw Error('Duplicate source-review note requires manual comparison.');seen.add(key);
    return {device:row.device,check:row.check,source_observed_at:row.source_observed_at,
      source_note:row.source_note,retest_result:row.retest_result,retest_detail:row.retest_detail,
      retested_at:row.retested_at,reference:row.reference.trim(),review_note:row.review_note.trim(),
      compared_at:row.compared_at};
  });
}

export function reviewNotesPacket572(entries){
  const packet={format:NOTES_FORMAT_572,build:572,owner_signoff:'PENDING',entries};
  packet.entries=validateReviewNotes572(packet);return packet;
}

export function reconcileEvidence572(feedback,retests,notes){
  const triage=triagePacket570(feedback);
  const retest=reconcileRetests571(feedback,retests);
  const entries=validateReviewNotes572(notes);
  const matchedRetests=new Map(retest.matched.map(row=>[keyOf(row.candidate),row.receipt]));
  const exactNotes=new Map(entries.map(row=>[pinOfNote(row),row]));
  const consumed=new Set();
  const cases=triage.candidates.map(candidate=>{
    const receipt=matchedRetests.get(keyOf(candidate));
    let state='AWAITING_DEVICE_RETEST',review=null;
    if(receipt?.result==='still-failing')state='OWNER_REPORTS_STILL_FAILING';
    if(receipt?.result==='appears-fixed'){
      state='APPEARS_FIXED_PROOF_REFERENCE_MISSING';
      const pin=pinOf(candidate,receipt);
      if(exactNotes.has(pin)){
        review=exactNotes.get(pin);consumed.add(pin);
        state='SOURCE_REFERENCE_RECORDED_UNVERIFIED';
      }
    }
    return {device:candidate.device,check:candidate.check,device_label:candidate.device_label,
      check_label:candidate.check_label,priority:candidate.priority,route:candidate.route,
      original_observation:candidate.observation,original_observed_at:candidate.observed_at,
      retest:receipt||null,source_review:review,state,verified_closed:false,
      decision:'OWNER_ACCEPTANCE_PENDING_INDEPENDENT_VERIFICATION'};
  });
  const staleNotes=entries.filter(row=>!consumed.has(pinOfNote(row)));
  const counts={
    source_exceptions:cases.length,unreviewed_device_checks:triage.pending_device_observations,
    awaiting_retest:cases.filter(x=>x.state==='AWAITING_DEVICE_RETEST').length,
    still_failing:cases.filter(x=>x.state==='OWNER_REPORTS_STILL_FAILING').length,
    apparently_fixed_without_reference:cases.filter(x=>x.state==='APPEARS_FIXED_PROOF_REFERENCE_MISSING').length,
    source_references_unverified:cases.filter(x=>x.state==='SOURCE_REFERENCE_RECORDED_UNVERIFIED').length,
    stale_retests:retest.stale.length,stale_source_notes:staleNotes.length,
    independently_verified_closures:0,
  };
  return {cases,stale_retests:retest.stale,stale_source_notes:staleNotes,counts,
    owner_signoff:'PENDING',independent_source_verification:'NOT_PERFORMED',
    external_writes:0,provider_checks:0,d1_queries:0};
}

export function acceptancePacket572(feedback,retests,notes,generatedAt=new Date().toISOString()){
  if(typeof generatedAt!=='string'||!Number.isFinite(Date.parse(generatedAt)))throw Error('Invalid evidence packet time.');
  const sourceRecords=validatePacket569(feedback);
  const retestRows=validateRetests571(retests);
  const reviewRows=validateReviewNotes572(notes);
  const reconciled=reconcileEvidence572(feedback,retests,notes);
  return {format:EVIDENCE_FORMAT_572,build:572,generated_at:generatedAt,
    acceptance:'DRAFT_FOR_INDEPENDENT_REVIEW',owner_signoff:'PENDING',verified_closures:0,
    independent_source_verification:'NOT_PERFORMED',external_writes:0,provider_checks:0,d1_queries:0,
    source:makePacket569(sourceRecords,feedback.created_at||generatedAt),
    retests:retestPacket571(retestRows),source_review:reviewNotesPacket572(reviewRows),
    counts:reconciled.counts,cases:reconciled.cases,
    stale_retests:reconciled.stale_retests,stale_source_notes:reconciled.stale_source_notes};
}

export function validateAcceptancePacket572(packet){
  if(!packet||packet.format!==EVIDENCE_FORMAT_572||packet.build!==572||
    packet.acceptance!=='DRAFT_FOR_INDEPENDENT_REVIEW'||packet.owner_signoff!=='PENDING'||
    packet.verified_closures!==0||packet.independent_source_verification!=='NOT_PERFORMED'||
    packet.external_writes!==0||packet.provider_checks!==0||packet.d1_queries!==0)
    throw Error('Unsupported acceptance or proof claim.');
  const expected=acceptancePacket572(packet.source,packet.retests,packet.source_review,packet.generated_at);
  if(JSON.stringify(packet)!==JSON.stringify(expected))throw Error('Evidence packet conflicts with original sources.');
  return expected;
}

export function acceptanceReadback572(result){
  if(!result||result.owner_signoff!=='PENDING'||result.counts?.independently_verified_closures!==0||
    !Array.isArray(result.cases))throw Error('Unsafe owner acceptance readback.');
  const c=result.counts;
  return [
    'Devil n Dove Build 572 — source-matched owner acceptance EVIDENCE DRAFT',
    `Original correction candidates: ${c.source_exceptions}; unreviewed device checks: ${c.unreviewed_device_checks}.`,
    `Awaiting retest: ${c.awaiting_retest}; owner reports still failing: ${c.still_failing}; apparently fixed without reference: ${c.apparently_fixed_without_reference}.`,
    `Source references recorded, NOT independently verified: ${c.source_references_unverified}; stale retests: ${c.stale_retests}; stale review notes: ${c.stale_source_notes}.`,
    'Verified closures: 0; independent source verification: NOT PERFORMED; owner sign-off: PENDING.',
    ...result.cases.map(row=>`${row.priority} | ${row.device_label} | ${row.check_label} | ${row.state} | ${row.route} | ${row.source_review?.reference||'No matching source reference'} | DO NOT AUTO-CLOSE`),
    ...result.stale_retests.map(row=>`STALE RETEST | ${row.device}:${row.check} | original report has changed; compare source before review.`),
    ...result.stale_source_notes.map(row=>`STALE SOURCE REVIEW | ${row.device}:${row.check} | retest or original report has changed; evidence reference no longer matches.`),
    'Owner decision requires authentic device evidence, separate independent verification and explicit approval. This packet does not authenticate anyone or execute Product, Etsy, provider, D1, Inventory or Finance actions.',
  ].join('\n');
}

function startEvidence572(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd572Evidence'))return;
  const get=id=>doc.getElementById(id),list=get('dd572List'),status=get('dd572State'),summary=get('dd572Summary'),packetBox=get('dd572Packet');
  const savedFeedback=()=>{const value=win.localStorage.getItem(STORAGE_KEY_569);return value?JSON.parse(value):makePacket569([]);};
  const savedRetests=()=>{const value=win.localStorage.getItem(RETEST_STORAGE_571);return value?JSON.parse(value):retestPacket571([]);};
  const savedNotes=()=>{const value=win.localStorage.getItem(NOTES_KEY_572);return value?JSON.parse(value):reviewNotesPacket572([]);};
  const refresh=()=>{
    const source=savedFeedback(),retests=savedRetests(),notes=savedNotes();
    const result=reconcileEvidence572(source,retests,notes);
    const c=result.counts;
    status.textContent=`${c.source_exceptions} source exceptions · ${c.awaiting_retest} awaiting retest · ${c.still_failing} still failing · ${c.apparently_fixed_without_reference} need source reference · ${c.source_references_unverified} unverified references · ${c.stale_retests+c.stale_source_notes} stale entries · 0 verified closures · owner sign-off PENDING.`;
    summary.value=acceptanceReadback572(result);
    packetBox.value=JSON.stringify(acceptancePacket572(source,retests,notes),null,2);
    return result;
  };
  get('dd572Load').addEventListener('click',()=>{
    try{
      const result=refresh();list.replaceChildren();
      for(const row of result.cases){
        const card=doc.createElement('article');card.className='dd570-candidate dd572-case';
        const h=doc.createElement('h3');h.textContent=`${row.priority} · ${row.device_label} · ${row.check_label}`;
        const original=doc.createElement('p');original.textContent=`Original: ${row.original_observation||'No detail supplied'} (${row.original_observed_at||'time unknown'})`;
        const retest=doc.createElement('p');retest.textContent=row.retest?`Retest: ${row.retest.result} · ${row.retest.detail} (${row.retest.retested_at})`:'Retest: not supplied on this browser.';
        const decision=doc.createElement('p');decision.textContent=`Review lane: ${row.state}. Closure and owner acceptance still PENDING.`;
        card.append(h,original,retest,decision);
        if(row.retest?.result==='appears-fixed'){
          const referenceLabel=doc.createElement('label');referenceLabel.textContent='Independent-source reference to be reviewed (commit, ticket, or evidence identifier; no secrets)';
          const reference=doc.createElement('textarea');reference.rows=2;reference.maxLength=240;reference.id=`dd572-ref-${row.device}-${row.check}`;reference.value=row.source_review?.reference||'';referenceLabel.htmlFor=reference.id;
          const noteLabel=doc.createElement('label');noteLabel.textContent='Manual comparison notes (what the reference shows; not proof of authenticity)';
          const note=doc.createElement('textarea');note.rows=3;note.maxLength=600;note.id=`dd572-note-${row.device}-${row.check}`;note.value=row.source_review?.review_note||'';noteLabel.htmlFor=note.id;
          const consentLabel=doc.createElement('label');consentLabel.className='dd569-checkbox';
          const consent=doc.createElement('input');consent.type='checkbox';consentLabel.append(consent,doc.createTextNode(' I manually compared the source reference with this exact original report and retest.'));
          const save=doc.createElement('button');save.type='button';save.className='dd569-button';save.textContent='Save unverified source review note';
          const message=doc.createElement('p');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
          save.addEventListener('click',()=>{
            if(!consent.checked||reference.value.trim().length<8||note.value.trim().length<12){message.textContent='Confirm manual comparison; enter a source identifier (8+ characters) and comparison notes (12+ characters).';return;}
            try{
              const source=savedFeedback(),retests=savedRetests(),notes=savedNotes();
              const current=reconcileEvidence572(source,retests,notes).cases.find(x=>x.device===row.device&&x.check===row.check);
              if(!current?.retest||current.retest.result!=='appears-fixed'||
                pinOf({device:current.device,check:current.check,observed_at:current.original_observed_at,observation:current.original_observation},current.retest)!==
                pinOf({device:row.device,check:row.check,observed_at:row.original_observed_at,observation:row.original_observation},row.retest))
                throw Error('Original evidence changed');
              const entry={device:row.device,check:row.check,source_observed_at:row.original_observed_at,
                source_note:row.original_observation,retest_result:row.retest.result,
                retest_detail:row.retest.detail,retested_at:row.retest.retested_at,
                reference:reference.value.trim(),review_note:note.value.trim(),compared_at:new Date().toISOString()};
              const entries=validateReviewNotes572(notes).filter(x=>keyOf(x)!==keyOf(entry));entries.push(entry);
              win.localStorage.setItem(NOTES_KEY_572,JSON.stringify(reviewNotesPacket572(entries)));
              refresh();consent.checked=false;message.textContent='Source reference saved on this browser only, UNVERIFIED. No closure or sign-off.';
            }catch{message.textContent='Review note not saved: source changed or local storage unavailable. Reconcile again.';}
          });
          card.append(referenceLabel,reference,noteLabel,note,consentLabel,save,message);
        }
        list.append(card);
      }
      for(const row of result.stale_retests){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`STALE RETEST · ${row.device}:${row.check} · source report changed; do not rely on this receipt.`;list.append(p);}
      for(const row of result.stale_source_notes){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`STALE SOURCE REVIEW · ${row.device}:${row.check} · source or retest changed; evidence cannot support a decision.`;list.append(p);}
      if(!result.cases.length){const p=doc.createElement('p');p.textContent='No source exceptions saved here. Unreviewed device checks are still pending; absence of reports is not acceptance.';list.append(p);}
    }catch{list.replaceChildren();summary.value='';packetBox.value='';status.textContent='Invalid source, retest or review notes; no acceptance packet generated. Recheck browser-local evidence.';}
  });
  const copy=async (field,kind)=>{
    try{refresh();const value=field.value;
      try{await win.navigator.clipboard.writeText(value);status.textContent=`${kind} copied for deliberate manual review. Owner sign-off PENDING; verified closures 0.`;}
      catch{field.focus();field.select();status.textContent=`Clipboard unavailable; ${kind} selected for manual copy. No approval or closure.`;}
    }catch{status.textContent='Evidence is invalid or unavailable; nothing copied.';}
  };
  get('dd572CopySummary').addEventListener('click',()=>copy(summary,'Readback'));
  get('dd572CopyPacket').addEventListener('click',()=>copy(packetBox,'Source-linked JSON packet'));
}
if(typeof document!=='undefined')startEvidence572();
