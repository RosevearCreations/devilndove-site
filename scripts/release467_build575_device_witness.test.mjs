import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569,CHECKS_569,DEVICES_569} from '../public/js/admin-device-acceptance-569.mjs?v=577';
import {retestPacket571} from '../public/js/admin-device-retest-571.mjs?v=577';
import {reviewNotesPacket572,acceptancePacket572} from '../public/js/admin-device-evidence-572.mjs?v=577';
import {dispositionPacket573,intakePacket573} from '../public/js/admin-device-intake-573.mjs?v=577';
import {readinessPacket574} from '../public/js/admin-device-readiness-574.mjs?v=577';
import {reconcileWitnesses575,witnessDraftPacket575,witnessPacket575,validateWitnessPacket575,
  witnessReadback575,WITNESS_FORMAT_575,WITNESS_KEY_575,WITNESS_SOURCE_KEY_575} from '../public/js/admin-device-witness-575.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const original={device:'phone',check:'dock',status:'needs-correction',note:'Search overlaps the bottom dock on this phone.',observed_at:'2026-11-02T02:00:00.000Z'};
const retest={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  result:'appears-fixed',detail:'On the same phone Search now clears the dock after loading.',retested_at:'2026-11-02T03:00:00.000Z'};
const source={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  reference:'Diff on commit abc123 for the dock',review_note:'Manually noted the source reference against this owner retest, not independently verified.',
  compared_at:'2026-11-02T03:20:00.000Z'};
const draft={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  source_reference:source.reference,disposition:'REQUEST_INDEPENDENT_PROOF',
  review_note:'Ask for an independent source reference witness and same-device evidence.',reviewed_at:'2026-11-02T04:00:00.000Z'};
const readiness=(feedback=[original],receipts=[retest],notes=[source],dispositions=[draft])=>
  readinessPacket574(intakePacket573(acceptancePacket572(makePacket569(feedback),retestPacket571(receipts),
    reviewNotesPacket572(notes),'2026-11-02T04:30:00.000Z'),dispositionPacket573(dispositions),
    '2026-11-02T05:00:00.000Z'),'2026-11-02T05:30:00.000Z');
const witness=(outcome='SOURCE_MATCH_CLAIMED')=>({
  device:original.device,check:original.check,source_observed_at:original.observed_at,
  source_note:original.note,retest_result:retest.result,retest_detail:retest.detail,
  retested_at:retest.retested_at,source_reference:source.reference,
  reviewer_reference:'Separate reviewer ticket 183',witness_reference:'Independent source review link 575',
  outcome,review_note:'I compared the exact source locator to the source note, pending external authentication.',
  reviewed_at:'2026-11-02T06:00:00.000Z',
});

test('No real owner-device observations or source exception cannot become a witnessed acceptance',()=>{
  const result=reconcileWitnesses575(readiness([],[],[],[]),witnessDraftPacket575([]));
  assert.equal(result.counts.unreviewed_device_checks,27);
  assert.equal(result.counts.open_source_exceptions,0);
  assert.equal(result.documentary_witness_review_ready,false);
  assert.equal(result.owner_decision_ready,false);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.counts.verified_exception_closures,0);
  assert.match(witnessReadback575(result),/owner sign-off: PENDING/);
});

test('Actual-device appears-fixed + source reference still needs a specific independent witness draft',()=>{
  const result=reconcileWitnesses575(readiness(),witnessDraftPacket575([]));
  assert.equal(result.counts.open_source_exceptions,1);
  assert.equal(result.counts.eligible_for_witness_review,1);
  assert.equal(result.counts.awaiting_witness_draft,1);
  assert.equal(result.cases[0].witness_status,'WITNESS_DRAFT_MISSING');
  assert.equal(result.cases[0].exception_closed,false);
  assert.equal(result.owner_decision_ready,false);
});

test('Recorded exact-source match claim is NOT independent source verification or defect closure',()=>{
  const result=reconcileWitnesses575(readiness(),witnessDraftPacket575([witness()]));
  assert.equal(result.counts.awaiting_witness_draft,0);
  assert.equal(result.counts.unauthenticated_source_match_claims,1);
  assert.equal(result.cases[0].witness_status,'SOURCE_MATCH_CLAIM_UNAUTHENTICATED');
  assert.equal(result.cases[0].independent_source_verified,false);
  assert.equal(result.cases[0].exception_closed,false);
  assert.equal(result.documentary_witness_review_ready,false); // 26 unreviewed device checks
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.counts.verified_exception_closures,0);
});

test('Conflicting and insufficient witness reviews retain distinct OPEN lanes',()=>{
  const conflict=reconcileWitnesses575(readiness(),witnessDraftPacket575([witness('SOURCE_CONFLICT')]));
  assert.equal(conflict.counts.source_conflicts,1);
  assert.equal(conflict.cases[0].witness_status,'SOURCE_CONFLICT_OPEN');
  const insufficient=reconcileWitnesses575(readiness(),witnessDraftPacket575([witness('INSUFFICIENT_EVIDENCE')]));
  assert.equal(insufficient.counts.insufficient_witness_evidence,1);
  assert.equal(insufficient.cases[0].witness_status,'WITNESS_EVIDENCE_INSUFFICIENT');
  for(const result of [conflict,insufficient]){
    assert.equal(result.counts.verified_exception_closures,0);
    assert.equal(result.owner_decision_ready,false);
  }
});

test('Changed source reference invalidates the old witness pin without silently carrying proof',()=>{
  const changed={...source,reference:'New corrected source reference 575'};
  const reDisposition={...draft,source_reference:changed.reference};
  const result=reconcileWitnesses575(readiness([original],[retest],[changed],[reDisposition]),witnessDraftPacket575([witness()]));
  assert.equal(result.counts.eligible_for_witness_review,1);
  assert.equal(result.counts.awaiting_witness_draft,1);
  assert.equal(result.counts.stale_witness_drafts,1);
  assert.equal(result.cases[0].witness_draft,null);
  assert.equal(result.owner_decision_ready,false);
  assert.match(witnessReadback575(result),/STALE WITNESS/);
});

test('Still-failing and missing-device-retest exceptions cannot receive a qualifying witness draft',()=>{
  const missing=reconcileWitnesses575(readiness([original],[],[],[]),witnessDraftPacket575([witness()]));
  assert.equal(missing.counts.device_or_source_evidence_incomplete,1);
  assert.equal(missing.counts.stale_witness_drafts,1);
  const failure={...retest,result:'still-failing'};
  const failed=reconcileWitnesses575(readiness([original],[failure],[],[]),witnessDraftPacket575([witness()]));
  assert.equal(failed.counts.eligible_for_witness_review,0);
  assert.equal(failed.cases[0].witness_status,'SOURCE_OR_DEVICE_EVIDENCE_INCOMPLETE');
  assert.equal(failed.counts.verified_exception_closures,0);
});

test('Even a fully completed manual worksheet can only be documentary-ready, never owner-approved',()=>{
  const all=DEVICES_569.flatMap(device=>CHECKS_569.map(check=>({device:device.id,check:check.id,
    status:check.id==='dock'&&device.id==='phone'?'needs-correction':'observed-ok',
    note:'Owner-entered observation, not an authenticated device check.',observed_at:original.observed_at})));
  // Exact source and witness pins must match the actual owner note, not a copied demonstration note.
  const amended=all.map(row=>row.device==='phone'&&row.check==='dock'?original:row);
  const result=reconcileWitnesses575(readiness(amended),witnessDraftPacket575([witness()]));
  assert.equal(result.counts.unreviewed_device_checks,0);
  assert.equal(result.documentary_witness_review_ready,true);
  assert.equal(result.independent_witness_verification,'NOT_PERFORMED');
  assert.equal(result.owner_decision_ready,false);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.counts.verified_exception_closures,0);
});

test('Portable witness packet validates exact sources and rejects forged approval, independent proof and counts',()=>{
  const packet=witnessPacket575(readiness(),witnessDraftPacket575([witness()]),'2026-11-02T07:00:00.000Z');
  assert.equal(packet.format,WITNESS_FORMAT_575);
  assert.deepEqual(validateWitnessPacket575(JSON.parse(JSON.stringify(packet))),packet);
  for(const bad of [
    {...packet,owner_signoff:'ACCEPTED'},
    {...packet,owner_decision:'APPROVED'},
    {...packet,owner_decision_ready:true},
    {...packet,independent_witness_verification:'PASS'},
    {...packet,verified_exception_closures:1},
    {...packet,review:{...packet.review,counts:{...packet.review.counts,verified_exception_closures:1}}},
    {...packet,witness_drafts:{...packet.witness_drafts,owner_signoff:'APPROVED'}},
    {...packet,source_readiness:{...packet.source_readiness,owner_signoff:'ACCEPTED'}},
  ])assert.throws(()=>validateWitnessPacket575(bad));
  assert.throws(()=>witnessDraftPacket575([witness(),witness()]));
  assert.throws(()=>witnessDraftPacket575([{...witness(),outcome:'VERIFIED_CLOSED'}]));
  assert.throws(()=>witnessDraftPacket575([{...witness(),witness_reference:'x'}]));
});

test('Live UI gives manual, bounded and browser-local witness review with no closure or network actions',()=>{
  const html=read('admin/device-acceptance/index.html');
  const js=read('public/js/admin-device-witness-575.mjs');
  for(const id of ['dd575Witness','dd575Title','dd575ImportText','dd575Confirm','dd575Import',
    'dd575Local','dd575Review','dd575State','dd575List','dd575CopySummary','dd575CopyPacket',
    'dd575Summary','dd575Packet'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:575|576|577)/);
  assert.match(html,/No independent witness identity or external source evidence is verified/);
  assert.match(js,/win\.localStorage\.setItem\(WITNESS_SOURCE_KEY_575/);
  assert.match(js,/win\.localStorage\.setItem\(WITNESS_KEY_575/);
  assert.match(js,/if\(!get\('dd575Confirm'\)\.checked\)/);
  assert.match(js,/ack\.checked/);
  assert.match(js,/validateReadinessPacket574\(JSON\.parse\(raw\)\)/);
  assert.match(js,/intakePacket573\(JSON\.parse\(prior\),/);
  assert.match(WITNESS_KEY_575,/575/);assert.match(WITNESS_SOURCE_KEY_575,/575/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
});

test('Versioned Admin modules, CI and immutable Production build marker track Build 575',()=>{
  const html=read('admin/device-acceptance/index.html');
  for(const module of ['admin-device-acceptance-569','admin-device-followup-570','admin-device-retest-571',
    'admin-device-evidence-572','admin-device-intake-573','admin-device-readiness-574','admin-device-witness-575'])
    assert.ok(html.includes(`${module}.mjs?v=577`),module);
  assert.match(read('public/js/admin-device-readiness-574.mjs'),/admin-device-intake-573\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-witness-575.mjs'),/admin-device-readiness-574\.mjs\?v=577/);
  assert.match(read('css/admin-device-acceptance-569.css'),/\.dd575-witness/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build575_device_witness\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:577|578|579|580|581|582|583)/);
});
