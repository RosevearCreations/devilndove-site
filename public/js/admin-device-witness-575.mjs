/* Build 575 — exact-source independent witness review drafts and acceptance gates.
 * A browser-local witness claim is not authenticated independent proof or owner sign-off. */
import {STAGED_KEY_574,readinessPacket574,validateReadinessPacket574} from './admin-device-readiness-574.mjs?v=577';
import {STAGED_KEY_573,DISPOSITION_KEY_573,dispositionPacket573,intakePacket573,validateIntakePacket573} from './admin-device-intake-573.mjs?v=577';

export const WITNESS_FORMAT_575='devilndove-admin-device-witness-review-575-v1';
export const WITNESS_DRAFT_FORMAT_575='devilndove-admin-device-witness-drafts-575-v1';
export const WITNESS_KEY_575='dd:admin-device-witness-drafts:575:v1';
export const WITNESS_SOURCE_KEY_575='dd:admin-device-witness-source:575:v1';
export const WITNESS_OUTCOMES_575=[
  {id:'SOURCE_MATCH_CLAIMED',label:'Source appears to match — requires independent corroboration'},
  {id:'SOURCE_CONFLICT',label:'Witness found a source conflict — keep open'},
  {id:'INSUFFICIENT_EVIDENCE',label:'Insufficient evidence — request more proof'},
];
const outcomes=new Set(WITNESS_OUTCOMES_575.map(x=>x.id));
const keyOf=row=>`${row.device}:${row.check}`;
const pinOf=row=>JSON.stringify([
  row.device,row.check,row.source_observed_at,row.source_note,
  row.retest_result,row.retest_detail,row.retested_at,row.source_reference,
]);
const pinOfCase=row=>JSON.stringify([
  row.device,row.check,row.original_observed_at,row.original_observation,
  row.retest?.result||'',row.retest?.detail||'',row.retest?.retested_at||'',
  row.source_review?.reference||'',
]);

export function validateWitnessDrafts575(packet){
  if(!packet||packet.format!==WITNESS_DRAFT_FORMAT_575||packet.build!==575||
    packet.owner_signoff!=='PENDING'||!Array.isArray(packet.entries)||packet.entries.length>27)
    throw Error('Invalid witness draft packet or owner approval claim.');
  const seen=new Set();
  return packet.entries.map(row=>{
    if(!row||!['desktop','phone','tablet'].includes(row.device)||
      typeof row.check!=='string'||!(/^[a-z][a-z0-9-]{0,35}$/).test(row.check)||
      typeof row.source_observed_at!=='string'||!Number.isFinite(Date.parse(row.source_observed_at))||
      typeof row.source_note!=='string'||row.source_note.length>600||
      row.retest_result!=='appears-fixed'||typeof row.retest_detail!=='string'||row.retest_detail.length>600||
      typeof row.retested_at!=='string'||!Number.isFinite(Date.parse(row.retested_at))||
      typeof row.source_reference!=='string'||row.source_reference.trim().length<8||row.source_reference.length>240||
      typeof row.witness_reference!=='string'||row.witness_reference.trim().length<8||row.witness_reference.length>240||
      typeof row.reviewer_reference!=='string'||row.reviewer_reference.trim().length<5||row.reviewer_reference.length>120||
      !outcomes.has(row.outcome)||typeof row.review_note!=='string'||
      row.review_note.trim().length<12||row.review_note.length>600||
      typeof row.reviewed_at!=='string'||!Number.isFinite(Date.parse(row.reviewed_at)))
      throw Error('Incomplete or unsupported witness draft.');
    const key=keyOf(row);if(seen.has(key))throw Error('Duplicate witness draft needs separate manual reconciliation.');seen.add(key);
    return {device:row.device,check:row.check,source_observed_at:row.source_observed_at,
      source_note:row.source_note,retest_result:row.retest_result,
      retest_detail:row.retest_detail,retested_at:row.retested_at,
      source_reference:row.source_reference,witness_reference:row.witness_reference.trim(),
      reviewer_reference:row.reviewer_reference.trim(),outcome:row.outcome,
      review_note:row.review_note.trim(),reviewed_at:row.reviewed_at};
  });
}

export function witnessDraftPacket575(entries){
  const packet={format:WITNESS_DRAFT_FORMAT_575,build:575,owner_signoff:'PENDING',entries};
  packet.entries=validateWitnessDrafts575(packet);return packet;
}

export function reconcileWitnesses575(readiness,witnesses){
  const accepted=validateReadinessPacket574(readiness);
  const entries=validateWitnessDrafts575(witnesses);
  const byPin=new Map(entries.map(row=>[pinOf(row),row]));
  const used=new Set();
  const cases=accepted.source_intake.review.cases.map(row=>{
    const eligible=row.source_lane==='SOURCE_REFERENCE_RECORDED_UNVERIFIED'&&
      row.retest?.result==='appears-fixed'&&Boolean(row.source_review?.reference);
    const pin=pinOfCase(row);
    const witness=eligible?byPin.get(pin)||null:null;
    if(witness)used.add(pin);
    const status=!eligible?'SOURCE_OR_DEVICE_EVIDENCE_INCOMPLETE':!witness?'WITNESS_DRAFT_MISSING':
      witness.outcome==='SOURCE_MATCH_CLAIMED'?'SOURCE_MATCH_CLAIM_UNAUTHENTICATED':
      witness.outcome==='SOURCE_CONFLICT'?'SOURCE_CONFLICT_OPEN':'WITNESS_EVIDENCE_INSUFFICIENT';
    return {device:row.device,check:row.check,device_label:row.device_label,
      check_label:row.check_label,priority:row.priority,route:row.route,
      source_lane:row.source_lane,original_observation:row.original_observation,
      original_observed_at:row.original_observed_at,retest:row.retest,
      source_review:row.source_review,disposition:row.manual_disposition?.disposition||'UNASSIGNED',
      witness_review_eligible:eligible,witness_draft:witness,
      witness_status:status,independent_source_verified:false,exception_closed:false,
      owner_decision:'NOT_RECORDED'};
  });
  const stale_witnesses=entries.filter(row=>!used.has(pinOf(row)));
  const counts={
    total_device_checks:accepted.readiness.counts.total_device_checks,
    unreviewed_device_checks:accepted.readiness.counts.unreviewed_device_checks,
    open_source_exceptions:cases.length,
    device_or_source_evidence_incomplete:cases.filter(x=>!x.witness_review_eligible).length,
    eligible_for_witness_review:cases.filter(x=>x.witness_review_eligible).length,
    awaiting_witness_draft:cases.filter(x=>x.witness_status==='WITNESS_DRAFT_MISSING').length,
    unauthenticated_source_match_claims:cases.filter(x=>x.witness_status==='SOURCE_MATCH_CLAIM_UNAUTHENTICATED').length,
    source_conflicts:cases.filter(x=>x.witness_status==='SOURCE_CONFLICT_OPEN').length,
    insufficient_witness_evidence:cases.filter(x=>x.witness_status==='WITNESS_EVIDENCE_INSUFFICIENT').length,
    stale_witness_drafts:stale_witnesses.length,
    stale_source_evidence:accepted.readiness.counts.stale_source_evidence,
    stale_disposition_drafts:accepted.readiness.counts.stale_disposition_drafts,
    independently_verified_witness_receipts:0,verified_exception_closures:0,
  };
  const allReviewDraftsPresent=counts.unreviewed_device_checks===0&&
    counts.device_or_source_evidence_incomplete===0&&counts.awaiting_witness_draft===0&&
    counts.source_conflicts===0&&counts.insufficient_witness_evidence===0&&
    counts.stale_witness_drafts===0&&counts.stale_source_evidence===0&&
    counts.stale_disposition_drafts===0&&
    accepted.readiness.counts.open_dispositions_unassigned===0;
  return {source_readiness_build:574,source_structural_validation:'PASS_NOT_IDENTITY_OR_INDEPENDENT_PROOF',
    counts,cases,stale_witnesses,
    documentary_witness_review_ready:allReviewDraftsPresent,
    independent_witness_verification:'NOT_PERFORMED',
    acceptance_gate:'BLOCKED_PENDING_AUTHENTIC_WITNESS_VERIFICATION_AND_OWNER_DECISION',
    owner_decision_ready:false,owner_decision:'NOT_RECORDED',owner_signoff:'PENDING',
    external_writes:0,provider_checks:0,d1_queries:0};
}

export function witnessPacket575(readiness,witnesses,generatedAt=new Date().toISOString()){
  if(typeof generatedAt!=='string'||!Number.isFinite(Date.parse(generatedAt)))throw Error('Invalid witness review time.');
  const source=validateReadinessPacket574(readiness);
  const drafts=witnessDraftPacket575(validateWitnessDrafts575(witnesses));
  return {format:WITNESS_FORMAT_575,build:575,generated_at:generatedAt,
    owner_signoff:'PENDING',owner_decision:'NOT_RECORDED',owner_decision_ready:false,
    verified_exception_closures:0,independent_witness_verification:'NOT_PERFORMED',
    external_writes:0,provider_checks:0,d1_queries:0,
    source_readiness:source,witness_drafts:drafts,
    review:reconcileWitnesses575(source,drafts)};
}

export function validateWitnessPacket575(packet){
  if(!packet||packet.format!==WITNESS_FORMAT_575||packet.build!==575||
    packet.owner_signoff!=='PENDING'||packet.owner_decision!=='NOT_RECORDED'||
    packet.owner_decision_ready!==false||packet.verified_exception_closures!==0||
    packet.independent_witness_verification!=='NOT_PERFORMED'||
    packet.external_writes!==0||packet.provider_checks!==0||packet.d1_queries!==0)
    throw Error('Unsupported witness proof or acceptance claim.');
  const expected=witnessPacket575(packet.source_readiness,packet.witness_drafts,packet.generated_at);
  if(JSON.stringify(packet)!==JSON.stringify(expected))throw Error('Witness packet conflicts with exact source evidence.');
  return expected;
}

export function witnessReadback575(result){
  if(!result||result.owner_signoff!=='PENDING'||result.owner_decision_ready!==false||
    result.counts?.verified_exception_closures!==0||!Array.isArray(result.cases))
    throw Error('Unsafe witness decision readback.');
  const c=result.counts;
  return [
    'Devil n Dove Build 575 — SOURCE-PINNED WITNESS DRAFTS; NOT INDEPENDENT VERIFICATION OR OWNER ACCEPTANCE',
    `Unreviewed actual-device checks: ${c.unreviewed_device_checks}/27; open exceptions: ${c.open_source_exceptions}.`,
    `Incomplete retest/source evidence: ${c.device_or_source_evidence_incomplete}; eligible for witness review: ${c.eligible_for_witness_review}; witness drafts missing: ${c.awaiting_witness_draft}.`,
    `Source match claims not independently authenticated: ${c.unauthenticated_source_match_claims}; source conflicts: ${c.source_conflicts}; insufficient evidence: ${c.insufficient_witness_evidence}.`,
    `Stale witness drafts: ${c.stale_witness_drafts}; stale source evidence: ${c.stale_source_evidence}; stale disposition drafts: ${c.stale_disposition_drafts}.`,
    `Documentary witness review ready for independent follow-up: ${result.documentary_witness_review_ready?'YES — no independent proof or approval':'NO'}.`,
    'Independently verified witness corroborations: 0; verified exception closures: 0; owner decision ready: NO; owner decision: NOT RECORDED; owner sign-off: PENDING.',
    ...result.cases.map(row=>`${row.priority} | ${row.device_label} | ${row.check_label} | ${row.witness_status} | ${row.disposition} | ${row.route} | OPEN`),
    ...result.stale_witnesses.map(row=>`STALE WITNESS | ${row.device}:${row.check} | old source/retest/reference no longer matches; no transfer of evidence or closure.`),
    'A typed reviewer identifier, copied reference, or source match claim cannot independently establish identity, physical-device retest, external source truth, resolved defect, or owner approval. No remote write or D1 read.',
  ].join('\n');
}

function startWitness575(doc=globalThis.document,win=globalThis.window){
  if(!doc?.getElementById('dd575Witness'))return;
  const get=id=>doc.getElementById(id),list=get('dd575List'),status=get('dd575State'),
    summary=get('dd575Summary'),packetBox=get('dd575Packet'),importBox=get('dd575ImportText');
  const staged=()=>{const raw=win.localStorage.getItem(WITNESS_SOURCE_KEY_575);return raw?validateReadinessPacket574(JSON.parse(raw)):null;};
  const drafts=()=>{const raw=win.localStorage.getItem(WITNESS_KEY_575);return raw?JSON.parse(raw):witnessDraftPacket575([]);};
  const refresh=()=>{
    const source=staged();if(!source)throw Error('No staged Build 574 source packet.');
    const result=reconcileWitnesses575(source,drafts()),c=result.counts;
    status.textContent=`${c.unreviewed_device_checks} device checks unreviewed · ${c.open_source_exceptions} OPEN exceptions · ${c.awaiting_witness_draft} witness drafts missing · ${c.source_conflicts} source conflicts · ${c.stale_witness_drafts} stale witness drafts · 0 verified closures · owner decision BLOCKED / PENDING.`;
    summary.value=witnessReadback575(result);
    packetBox.value=JSON.stringify(witnessPacket575(source,drafts()),null,2);
    return result;
  };
  const render=()=>{
    const result=refresh();list.replaceChildren();
    for(const row of result.cases){
      const card=doc.createElement('article');card.className='dd570-candidate dd575-witness';
      const heading=doc.createElement('h3');heading.textContent=`${row.priority} · ${row.device_label} · ${row.check_label}`;
      const state=doc.createElement('p');state.textContent=`${row.witness_status} · case OPEN · owner decision PENDING`;
      const ref=doc.createElement('p');ref.textContent=`Device retest: ${row.retest?.result||'missing'} · source reference: ${row.source_review?.reference||'missing'} · disposition: ${row.disposition}`;
      const link=doc.createElement('a');link.href=row.route;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open exact Admin workspace (no automatic device proof)';
      card.append(heading,state,ref,link);
      if(row.witness_review_eligible){
        const addField=(labelText,max,existing='')=>{
          const label=doc.createElement('label'),field=doc.createElement('textarea');
          label.textContent=labelText;field.rows=2;field.maxLength=max;field.value=existing;
          label.append(field);card.append(label);return field;
        };
        const prev=row.witness_draft;
        const reviewer=addField('Reviewer reference (typed identifier only; identity NOT authenticated)',120,prev?.reviewer_reference||'');
        const evidence=addField('Independent witness evidence locator (commit, document or case ID; no secrets)',240,prev?.witness_reference||'');
        const note=addField('Comparison notes: specific source evidence vs exact owner retest',600,prev?.review_note||'');
        const label=doc.createElement('label'),select=doc.createElement('select');
        label.textContent='Manual witness review conclusion (NOT a verified closure)';
        for(const x of [{id:'',label:'Choose a review outcome'},...WITNESS_OUTCOMES_575]){
          const option=doc.createElement('option');option.value=x.id;option.textContent=x.label;select.append(option);
        }select.value=prev?.outcome||'';label.append(select);card.append(label);
        const ackLabel=doc.createElement('label'),ack=doc.createElement('input');ack.type='checkbox';
        ackLabel.className='dd569-checkbox';ackLabel.append(ack,doc.createTextNode(' I compared the exact source and device receipt manually; this is NOT identity verification, closure or owner approval.'));card.append(ackLabel);
        const save=doc.createElement('button');save.type='button';save.className='dd569-button';save.textContent='Save local witness review DRAFT (case stays OPEN)';
        save.addEventListener('click',()=>{
          if(!ack.checked){status.textContent='Explicit review confirmation required; no witness draft saved.';return;}
          try{
            const rowDraft={device:row.device,check:row.check,source_observed_at:row.original_observed_at,
              source_note:row.original_observation,retest_result:row.retest.result,
              retest_detail:row.retest.detail,retested_at:row.retest.retested_at,
              source_reference:row.source_review.reference,reviewer_reference:reviewer.value,
              witness_reference:evidence.value,review_note:note.value,
              outcome:select.value,reviewed_at:new Date().toISOString()};
            const others=validateWitnessDrafts575(drafts()).filter(x=>keyOf(x)!==keyOf(rowDraft));
            const next=witnessDraftPacket575([...others,rowDraft]);
            win.localStorage.setItem(WITNESS_KEY_575,JSON.stringify(next));render();
          }catch{status.textContent='Witness draft rejected: complete specific references, an outcome and at least 12 characters of comparison detail. No closure.';}
        });card.append(save);
      }
      list.append(card);
    }
    if(result.counts.unreviewed_device_checks){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`${result.counts.unreviewed_device_checks} actual-device checks remain unobserved. Source witness text cannot supply these observations.`;list.append(p);}
    if(result.stale_witnesses.length){const p=doc.createElement('p');p.className='dd572-stale';p.textContent=`${result.stale_witnesses.length} old witness drafts are STALE (source/retest/reference changed). Compare them manually; they cannot be reused.`;list.append(p);}
    if(!result.cases.length){const p=doc.createElement('p');p.textContent='No source exception witness cases recorded. Owner-device evidence and independent approval remain separate requirements. No acceptance inferred.';list.append(p);}
  };
  const stage=source=>{const valid=validateReadinessPacket574(source);win.localStorage.setItem(WITNESS_SOURCE_KEY_575,JSON.stringify(valid));render();};
  get('dd575Local').addEventListener('click',()=>{
    try{
      const raw=win.localStorage.getItem(STAGED_KEY_574);
      if(raw)stage(readinessPacket574(validateIntakePacket573(JSON.parse(raw))));
      else{
        const prior=win.localStorage.getItem(STAGED_KEY_573);
        if(!prior)throw Error('No staged evidence');
        const savedDrafts=win.localStorage.getItem(DISPOSITION_KEY_573);
        stage(readinessPacket574(intakePacket573(JSON.parse(prior),
          savedDrafts?JSON.parse(savedDrafts):dispositionPacket573([]))));
      }
    }catch{status.textContent='No valid staged Build 574/573 evidence found. Prepare sections 7–8 or paste a complete Build 574 JSON packet; no approval recorded.';}
  });
  get('dd575Import').addEventListener('click',()=>{
    if(!get('dd575Confirm').checked){status.textContent='Review and confirm untrusted witness input before staging.';return;}
    try{if(!importBox.value||importBox.value.length>400000)throw Error('Invalid packet size');
      stage(JSON.parse(importBox.value));get('dd575Confirm').checked=false;
      status.textContent='Build 574 source structurally validated and staged locally; witness claims unverified, owner decision BLOCKED.';
    }catch{status.textContent='Source packet rejected: invalid, tampered or unsupported Build 574 evidence; no previous owner observations changed.';}
  });
  get('dd575Review').addEventListener('click',()=>{try{render();}catch{status.textContent='No valid source or witness drafts staged.';}});
  const copy=async(field,label)=>{
    try{refresh();try{await win.navigator.clipboard.writeText(field.value);status.textContent=`${label} copied; owner acceptance PENDING.`;}
      catch{field.focus();field.select();status.textContent=`Clipboard unavailable; ${label} selected for manual copy. No sign-off.`;}}
    catch{status.textContent='No valid witness review packet to copy.';}
  };
  get('dd575CopySummary').addEventListener('click',()=>copy(summary,'Witness reconciliation readback'));
  get('dd575CopyPacket').addEventListener('click',()=>copy(packetBox,'Witness review JSON draft'));
}
if(typeof document!=='undefined')startWitness575();
