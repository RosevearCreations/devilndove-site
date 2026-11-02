/* Build 574 — source-linked owner device evidence gaps and decision readiness.
 * Documentary coverage is not independent proof or owner approval. */
import {STORAGE_KEY_569,makePacket569} from './admin-device-acceptance-569.mjs?v=574';
import {RETEST_STORAGE_571,retestPacket571} from './admin-device-retest-571.mjs?v=574';
import {NOTES_KEY_572,reviewNotesPacket572,acceptancePacket572} from './admin-device-evidence-572.mjs?v=574';
import {STAGED_KEY_573,DISPOSITION_KEY_573,dispositionPacket573,intakePacket573,validateIntakePacket573} from './admin-device-intake-573.mjs?v=574';

export const READINESS_FORMAT_574='devilndove-admin-device-readiness-574-v1';
export const STAGED_KEY_574='dd:admin-device-readiness-input:574:v1';
const needed={
  AWAITING_DEVICE_RETEST:{gap:'ACTUAL_DEVICE_RETEST_MISSING',action:'Retest this Admin area on the same device; record the observed steps.'},
  OWNER_REPORTS_STILL_FAILING:{gap:'DEFECT_STILL_REPRODUCES',action:'Investigate the real defect and request a new same-device retest after a targeted correction.'},
  APPEARS_FIXED_PROOF_REFERENCE_MISSING:{gap:'SOURCE_REFERENCE_MISSING',action:'Supply a specific, independently checkable source correction reference; the owner retest alone is not proof.'},
  SOURCE_REFERENCE_RECORDED_UNVERIFIED:{gap:'INDEPENDENT_SOURCE_VERIFICATION_MISSING',action:'Have a separate reviewer verify the exact source correction and reconcile the actual owner-device receipt.'},
};

export function reviewReadiness574(input){
  const accepted=validateIntakePacket573(input);
  const review=accepted.review;
  const gaps=review.cases.map(row=>{
    const required=needed[row.source_lane];
    if(!required)throw Error('Unsupported source exception lane.');
    return {device:row.device,check:row.check,device_label:row.device_label,
      check_label:row.check_label,priority:row.priority,route:row.route,
      source_lane:row.source_lane,gap:required.gap,required_action:required.action,
      disposition:row.manual_disposition?.disposition||'UNASSIGNED',
      documentary_reference:row.source_review?.reference||null,
      documentary_status:row.source_review?'REFERENCE_RECORDED_NOT_VERIFIED':'MISSING_OR_NOT_APPLICABLE',
      independently_verified:false,exception_closed:false};
  });
  const count=kind=>gaps.filter(row=>row.gap===kind).length;
  const unreviewed=review.counts.unreviewed_device_checks;
  const staleSource=review.counts.stale_source_retests;
  const staleDrafts=review.counts.stale_disposition_drafts;
  const unassigned=review.counts.awaiting_disposition;
  const counts={
    total_device_checks:27,unreviewed_device_checks:unreviewed,
    open_source_exceptions:gaps.length,
    actual_device_retests_missing:count('ACTUAL_DEVICE_RETEST_MISSING'),
    owner_retests_still_failing:count('DEFECT_STILL_REPRODUCES'),
    source_references_missing:count('SOURCE_REFERENCE_MISSING'),
    references_awaiting_independent_verification:count('INDEPENDENT_SOURCE_VERIFICATION_MISSING'),
    source_references_documented_not_verified:gaps.filter(row=>row.documentary_reference).length,
    open_dispositions_unassigned:unassigned,
    stale_source_evidence:staleSource,stale_disposition_drafts:staleDrafts,
    independently_verified_evidence_gap_closures:0,verified_exception_closures:0,
  };
  const documentaryReady=unreviewed===0&&staleSource===0&&staleDrafts===0&&unassigned===0&&
    counts.actual_device_retests_missing===0&&counts.owner_retests_still_failing===0&&
    counts.source_references_missing===0;
  return {source_intake_build:accepted.build,source_intake_generated_at:accepted.generated_at,
    source_structural_validation:'PASS_NOT_IDENTITY_OR_INDEPENDENT_PROOF',
    counts,gaps,documentary_packet_ready_for_independent_review:documentaryReady,
    independent_source_verification:'NOT_PERFORMED',owner_decision_ready:false,
    owner_decision:'NOT_RECORDED',owner_signoff:'PENDING',
    acceptance_gate:'BLOCKED_PENDING_INDEPENDENT_VERIFICATION_AND_OWNER_APPROVAL',
    external_writes:0,provider_checks:0,d1_queries:0};
}

export function readinessPacket574(input,generatedAt=new Date().toISOString()){
  if(typeof generatedAt!=='string'||!Number.isFinite(Date.parse(generatedAt)))throw Error('Invalid readiness time.');
  const source=validateIntakePacket573(input);
  return {format:READINESS_FORMAT_574,build:574,generated_at:generatedAt,
    owner_signoff:'PENDING',owner_decision:'NOT_RECORDED',
    owner_decision_ready:false,verified_exception_closures:0,
    independent_source_verification:'NOT_PERFORMED',external_writes:0,provider_checks:0,d1_queries:0,
    source_intake:source,readiness:reviewReadiness574(source)};
}

export function validateReadinessPacket574(packet){
  if(!packet||packet.format!==READINESS_FORMAT_574||packet.build!==574||
    packet.owner_signoff!=='PENDING'||packet.owner_decision!=='NOT_RECORDED'||
    packet.owner_decision_ready!==false||packet.verified_exception_closures!==0||
    packet.independent_source_verification!=='NOT_PERFORMED'||
    packet.external_writes!==0||packet.provider_checks!==0||packet.d1_queries!==0)
    throw Error('Unsupported approval or verified closure claim.');
  const expected=readinessPacket574(packet.source_intake,packet.generated_at);
  if(JSON.stringify(packet)!==JSON.stringify(expected))throw Error('Readiness packet conflicts with source evidence.');
  return expected;
}

export function readinessReadback574(result){
  if(!result||result.owner_signoff!=='PENDING'||result.owner_decision_ready!==false||
    result.owner_decision!=='NOT_RECORDED'||result.counts?.verified_exception_closures!==0||
    !Array.isArray(result.gaps))throw Error('Unsafe acceptance-readiness claim.');
  const c=result.counts;
  return [
    'Devil n Dove Build 574 — VERIFIED-BY-STRUCTURE EVIDENCE GAP REVIEW; NOT OWNER ACCEPTANCE',
    `Original Build ${result.source_intake_build} packet: ${result.source_structural_validation}.`,
    `Unreviewed device checks: ${c.unreviewed_device_checks}/27; open source exceptions: ${c.open_source_exceptions}.`,
    `Missing actual-device retests: ${c.actual_device_retests_missing}; retests still failing: ${c.owner_retests_still_failing}; missing source references: ${c.source_references_missing}.`,
    `References needing independent verification: ${c.references_awaiting_independent_verification}; documentary references recorded but unverified: ${c.source_references_documented_not_verified}.`,
    `Unassigned follow-up dispositions: ${c.open_dispositions_unassigned}; stale source evidence: ${c.stale_source_evidence}; stale disposition drafts: ${c.stale_disposition_drafts}.`,
    `Documentary packet ready for independent REVIEW: ${result.documentary_packet_ready_for_independent_review?'YES — not approved':'NO'}.`,
    'Independently verified evidence-gap closures: 0; verified exception closures: 0; owner decision ready: NO; owner decision: NOT RECORDED; owner sign-off: PENDING.',
    ...result.gaps.map(row=>`${row.priority} | ${row.device_label} | ${row.check_label} | ${row.gap} | ${row.disposition} | ${row.required_action} | ${row.route} | OPEN`),
    'No field completion, source reference or Production GREEN release can replace actual device evidence, independent verification or explicit owner approval. No Product, Etsy, provider, D1, Inventory or Finance write.',
  ].join('\n');
}

function startReadiness574(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd574Readiness'))return;
  const get=id=>doc.getElementById(id),list=get('dd574List'),status=get('dd574State'),
    input=get('dd574ImportText'),summary=get('dd574Summary'),exportBox=get('dd574Packet');
  const read=(key,fallback)=>{const raw=win.localStorage.getItem(key);return raw?JSON.parse(raw):fallback;};
  const stored=()=>{const raw=win.localStorage.getItem(STAGED_KEY_574);return raw?validateIntakePacket573(JSON.parse(raw)):null;};
  const local=()=>{
    const feedback=read(STORAGE_KEY_569,makePacket569([]));
    const retests=read(RETEST_STORAGE_571,retestPacket571([]));
    const notes=read(NOTES_KEY_572,reviewNotesPacket572([]));
    const source=read(STAGED_KEY_573,acceptancePacket572(feedback,retests,notes));
    const drafts=read(DISPOSITION_KEY_573,dispositionPacket573([]));
    return intakePacket573(source,drafts);
  };
  const refresh=()=>{
    const packet=stored();if(!packet)throw Error('No staged evidence');
    const result=reviewReadiness574(packet),c=result.counts;
    status.textContent=`${c.unreviewed_device_checks} unreviewed device checks · ${c.open_source_exceptions} OPEN exceptions · ${c.actual_device_retests_missing} missing retests · ${c.owner_retests_still_failing} still failing · ${c.references_awaiting_independent_verification} unverified references · 0 verified closures · owner decision BLOCKED / PENDING.`;
    summary.value=readinessReadback574(result);
    exportBox.value=JSON.stringify(readinessPacket574(packet),null,2);
    return result;
  };
  const render=()=>{
    const result=refresh();list.replaceChildren();
    for(const row of result.gaps){
      const card=doc.createElement('article');card.className='dd570-candidate dd574-gap';
      const h=doc.createElement('h3');h.textContent=`${row.priority} · ${row.device_label} · ${row.check_label}`;
      const gap=doc.createElement('p');gap.textContent=`Gap: ${row.gap}. ${row.required_action}`;
      const review=doc.createElement('p');review.textContent=`Follow-up disposition: ${row.disposition}. Source reference: ${row.documentary_status}. Verified closure: NO.`;
      const link=doc.createElement('a');link.href=row.route;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open the exact Admin workspace for an owner-device check';
      card.append(h,gap,review,link);list.append(card);
    }
    if(result.counts.unreviewed_device_checks){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`${result.counts.unreviewed_device_checks} device checks still need an actual owner observation. This is a review gap, not a passed test.`;list.append(p);}
    if(result.counts.stale_source_evidence||result.counts.stale_disposition_drafts){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`Stale evidence: ${result.counts.stale_source_evidence} source receipts/reviews and ${result.counts.stale_disposition_drafts} disposition drafts. Refresh exact sources before any decision.`;list.append(p);}
    if(!result.gaps.length&&!result.counts.unreviewed_device_checks){const p=doc.createElement('p');p.textContent='No documentary exception gaps found. Independent verification and explicit owner approval are still pending; this is NOT acceptance.';list.append(p);}
  };
  const stage=packet=>{
    const validated=validateIntakePacket573(packet);
    win.localStorage.setItem(STAGED_KEY_574,JSON.stringify(validated));render();
  };
  get('dd574Local').addEventListener('click',()=>{
    try{stage(local());}catch{status.textContent='Saved local evidence is invalid or unavailable. No owner decision was recorded.';}
  });
  get('dd574Import').addEventListener('click',()=>{
    if(!get('dd574Confirm').checked){status.textContent='Check the untrusted evidence review confirmation before staging.';return;}
    try{
      if(!input.value||input.value.length>250000)throw Error('Invalid input size');
      stage(JSON.parse(input.value));get('dd574Confirm').checked=false;
      status.textContent='Build 573 packet structurally validated and staged locally; owner acceptance remains BLOCKED.';
    }catch{status.textContent='Readiness import rejected: malformed, tampered or unsupported evidence. No earlier source notes were changed.';}
  });
  get('dd574Review').addEventListener('click',()=>{
    try{render();}catch{status.textContent='No valid intake packet staged for readiness review.';}
  });
  const copy=async (field,label)=>{
    try{refresh();
      try{await win.navigator.clipboard.writeText(field.value);status.textContent=`${label} copied. Actual owner acceptance still PENDING.`;}
      catch{field.focus();field.select();status.textContent=`Clipboard unavailable; ${label} selected for manual copy. No sign-off.`;}
    }catch{status.textContent='No valid readiness packet to copy.';}
  };
  get('dd574CopySummary').addEventListener('click',()=>copy(summary,'Evidence gap readback'));
  get('dd574CopyPacket').addEventListener('click',()=>copy(exportBox,'Readiness JSON draft'));
}
if(typeof document!=='undefined')startReadiness574();
