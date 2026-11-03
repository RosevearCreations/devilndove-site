import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569,CHECKS_569,DEVICES_569} from '../public/js/admin-device-acceptance-569.mjs?v=577';
import {retestPacket571} from '../public/js/admin-device-retest-571.mjs?v=577';
import {reviewNotesPacket572,acceptancePacket572} from '../public/js/admin-device-evidence-572.mjs?v=577';
import {dispositionPacket573,intakePacket573} from '../public/js/admin-device-intake-573.mjs?v=577';
import {readinessPacket574} from '../public/js/admin-device-readiness-574.mjs?v=577';
import {witnessDraftPacket575,witnessPacket575} from '../public/js/admin-device-witness-575.mjs?v=577';
import {reviewProvenance576,followupPacket576,provenancePacket576,validateProvenancePacket576,
  provenanceReadback576,sourcePin576,PROVENANCE_FORMAT_576} from '../public/js/admin-device-provenance-576.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const original={device:'phone',check:'dock',status:'needs-correction',note:'Phone Search covers the lower seller dock.',observed_at:'2026-11-02T02:00:00.000Z'};
const retest={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  result:'appears-fixed',detail:'Retested on the same phone after a correction; Search clears the dock.',retested_at:'2026-11-02T03:00:00.000Z'};
const reference={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  reference:'Source correction commit abc1234',review_note:'The source reference was compared manually but independently verified by nobody.',
  compared_at:'2026-11-02T03:20:00.000Z'};
const disposition={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  source_reference:reference.reference,disposition:'REQUEST_INDEPENDENT_PROOF',
  review_note:'Independent source review still needed before owner acceptance.',reviewed_at:'2026-11-02T04:00:00.000Z'};
const witness=(outcome='SOURCE_MATCH_CLAIMED')=>({device:'phone',check:'dock',source_observed_at:original.observed_at,
  source_note:original.note,retest_result:retest.result,retest_detail:retest.detail,
  retested_at:retest.retested_at,source_reference:reference.reference,
  reviewer_reference:'Independent reviewer record 576',witness_reference:'Independent source witness report 576',
  outcome,review_note:'Manually checked witness source against the retest; authentication remains pending.',
  reviewed_at:'2026-11-02T05:00:00.000Z'});
const source=(feedback=[original],receipts=[retest],notes=[reference],dispositions=[disposition],witnesses=[witness()])=>{
  const evidence=acceptancePacket572(makePacket569(feedback),retestPacket571(receipts),reviewNotesPacket572(notes),'2026-11-02T06:00:00.000Z');
  const intake=intakePacket573(evidence,dispositionPacket573(dispositions),'2026-11-02T06:10:00.000Z');
  return witnessPacket575(readinessPacket574(intake,'2026-11-02T06:20:00.000Z'),
    witnessDraftPacket575(witnesses),'2026-11-02T06:30:00.000Z');
};
const plan=(packet=source())=>({device:'phone',check:'dock',
  source_pin:sourcePin576(packet.review.cases[0]),
  next_action:'REQUEST_AUTHENTICATED_WITNESS',
  request_note:'Verify the independent reviewer and compare the exact source with the real phone retest.',
  authentication_method:'SOURCE_CONTROL_AUDIT',proof_locator:'Immutable source review ticket 576',
  reviewer_independence_basis:'A distinct reviewer must attest source diff independently of the correction author.',
  owner_device_receipt_locator:'Same-phone retest receipt reference 576',
  recorded_at:'2026-11-02T07:00:00.000Z'});

test('Empty real owner-device records retain 27 missing checks and cannot authenticate or approve',()=>{
  const result=reviewProvenance576(source([],[],[],[],[]),followupPacket576([]));
  assert.equal(result.counts.unreviewed_device_checks,27);
  assert.equal(result.counts.open_source_exceptions,0);
  assert.equal(result.counts.authenticated_witnesses,0);
  assert.equal(result.counts.verified_exception_closures,0);
  assert.equal(result.documentary_authentication_preflight_ready,false);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.owner_decision_ready,false);
  assert.match(provenanceReadback576(result),/owner sign-off: PENDING/);
});

test('An exact source witness match CLAIM still requires external authentication plan',()=>{
  const result=reviewProvenance576(source(),followupPacket576([]));
  assert.equal(result.counts.open_source_exceptions,1);
  assert.equal(result.counts.authentication_preflight_missing,1);
  assert.equal(result.cases[0].provenance_status,'AUTHENTICATION_PREP_MISSING');
  assert.equal(result.cases[0].authenticated_witness,false);
  assert.equal(result.cases[0].verified_exception_closed,false);
  assert.equal(result.owner_signoff,'PENDING');
});

test('A complete independent-identity plan is only READY FOR EXTERNAL CHECK, not verified',()=>{
  const packet=source(),result=reviewProvenance576(packet,followupPacket576([plan(packet)]));
  assert.equal(result.counts.external_authentication_plans_prepared_not_verified,1);
  assert.equal(result.counts.authentication_preflight_missing,0);
  assert.equal(result.cases[0].provenance_status,'PREPARED_FOR_EXTERNAL_AUTHENTICATION_NOT_VERIFIED');
  assert.equal(result.counts.authenticated_witnesses,0);
  assert.equal(result.owner_decision_ready,false);
  assert.equal(result.acceptance_gate,'BLOCKED_PENDING_INDEPENDENT_AUTHENTICATION_AND_EXPLICIT_OWNER_DECISION');
});

test('Conflicting, insufficient and missing witness evidence all remain separately blocked',()=>{
  for(const [testSource,want] of [
    [source([original],[retest],[reference],[disposition],[witness('SOURCE_CONFLICT')]),'SOURCE_CONFLICT_NOT_CLOSED'],
    [source([original],[retest],[reference],[disposition],[witness('INSUFFICIENT_EVIDENCE')]),'WITNESS_EVIDENCE_INSUFFICIENT'],
    [source([original],[retest],[reference],[disposition],[]),'AUTHENTIC_WITNESS_MISSING'],
  ]){
    const result=reviewProvenance576(testSource,followupPacket576([]));
    assert.equal(result.cases[0].provenance_status,want);
    assert.equal(result.cases[0].verified_exception_closed,false);
    assert.equal(result.owner_decision_ready,false);
  }
});

test('Missing same-device retest prevents source-based witness authentication even with a submitted plan',()=>{
  const missing=source([original],[],[],[],[witness()]);
  const result=reviewProvenance576(missing,followupPacket576([]));
  assert.equal(result.counts.device_or_source_evidence_missing,1);
  assert.equal(result.cases[0].provenance_status,'ACTUAL_DEVICE_OR_SOURCE_EVIDENCE_MISSING');
  assert.equal(result.counts.authenticated_witnesses,0);
});

test('A changed witness note invalidates the old provenance plan pin and is explicitly STALE',()=>{
  const first=source(),p=plan(first);
  const changed=source([original],[retest],[reference],[disposition],[{...witness(),review_note:'A different source check review, still unauthenticated.'}]);
  const result=reviewProvenance576(changed,followupPacket576([p]));
  assert.equal(result.counts.stale_followups,1);
  assert.equal(result.counts.authentication_preflight_missing,1);
  assert.equal(result.cases[0].followup,null);
  assert.match(provenanceReadback576(result),/STALE FOLLOW-UP/);
});

test('Every physical-device check plus complete documentary plan can still never imply authentication or owner acceptance',()=>{
  const feedback=DEVICES_569.flatMap(device=>CHECKS_569.map(check=>({
    device:device.id,check:check.id,status:'observed-ok',
    note:'Manually entered owner observation, not signed independent evidence.',
    observed_at:original.observed_at,
  }))).map(row=>row.device==='phone'&&row.check==='dock'?original:row);
  const packet=source(feedback),result=reviewProvenance576(packet,followupPacket576([plan(packet)]));
  assert.equal(result.counts.unreviewed_device_checks,0);
  assert.equal(result.documentary_authentication_preflight_ready,true);
  assert.equal(result.independent_witness_authentication,'NOT_PERFORMED');
  assert.equal(result.counts.authenticated_witnesses,0);
  assert.equal(result.counts.verified_exception_closures,0);
  assert.equal(result.owner_signoff,'PENDING');
  assert.match(provenanceReadback576(result),/YES — external checks and approval still required/);
});

test('Strict follow-up validation rejects empty proof, fabricated authentication and duplicate case drafts',()=>{
  const p=plan();
  for(const bad of [
    {...p,proof_locator:'x'},
    {...p,reviewer_independence_basis:'short'},
    {...p,owner_device_receipt_locator:'x'},
    {...p,authentication_method:'ALREADY_AUTHENTICATED'},
    {...p,next_action:'APPROVE_OWNER'},
    {...p,request_note:'short'},
  ])assert.throws(()=>followupPacket576([bad]));
  assert.throws(()=>followupPacket576([p,p]));
  assert.throws(()=>followupPacket576([{...p,next_action:'REQUEST_ACTUAL_DEVICE_RETEST'}]));
  assert.equal(followupPacket576([{...p,next_action:'REQUEST_ACTUAL_DEVICE_RETEST',
    authentication_method:'NOT_SELECTED',proof_locator:'',reviewer_independence_basis:'',
    owner_device_receipt_locator:''}]).entries.length,1);
});

test('Portable provenance packet round-trips and rejects forged owner approval or altered witness counts',()=>{
  const src=source(),packet=provenancePacket576(src,followupPacket576([plan(src)]),'2026-11-02T08:00:00.000Z');
  assert.equal(packet.format,PROVENANCE_FORMAT_576);
  assert.deepEqual(validateProvenancePacket576(JSON.parse(JSON.stringify(packet))),packet);
  for(const bad of [
    {...packet,owner_signoff:'APPROVED'},
    {...packet,owner_decision:'ACCEPTED'},
    {...packet,owner_decision_ready:true},
    {...packet,authenticated_witnesses:1},
    {...packet,verified_exception_closures:1},
    {...packet,independent_witness_authentication:'PASS'},
    {...packet,review:{...packet.review,counts:{...packet.review.counts,authenticated_witnesses:1}}},
    {...packet,source_witness:{...packet.source_witness,owner_signoff:'APPROVED'}},
  ])assert.throws(()=>validateProvenancePacket576(bad));
});

test('Live UI is browser-local with explicit acknowledgment, exact source validation, no network writes or acceptance button',()=>{
  const html=read('admin/device-acceptance/index.html');
  const js=read('public/js/admin-device-provenance-576.mjs');
  for(const id of ['dd576Provenance','dd576Title','dd576ImportText','dd576Confirm','dd576Import',
    'dd576Local','dd576Review','dd576State','dd576List','dd576CopySummary',
    'dd576CopyPacket','dd576Summary','dd576Packet'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build 577/);
  assert.match(html,/External reviewer credentials, signed reports, source-control attestations and actual-device receipts are NOT checked/);
  assert.match(js,/if\(!get\('dd576Confirm'\)\.checked\)/);
  assert.match(js,/if\(!ack\.checked\)/);
  assert.match(js,/validateWitnessPacket575\(JSON\.parse\(raw\)\)/);
  assert.match(js,/win\.localStorage\.setItem\(FOLLOWUP_KEY_576/);
  assert.match(js,/win\.localStorage\.setItem\(STAGED_KEY_576/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
});

test('Seven prior Admin modules, CI and immutable Production marker use Build 576 version',()=>{
  const html=read('admin/device-acceptance/index.html');
  for(const module of ['admin-device-acceptance-569','admin-device-followup-570','admin-device-retest-571',
    'admin-device-evidence-572','admin-device-intake-573','admin-device-readiness-574',
    'admin-device-witness-575','admin-device-provenance-576'])
    assert.ok(html.includes(`${module}.mjs?v=577`),module);
  assert.match(read('public/js/admin-device-witness-575.mjs'),/admin-device-readiness-574\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-provenance-576.mjs'),/admin-device-witness-575\.mjs\?v=577/);
  assert.match(read('css/admin-device-acceptance-569.css'),/\.dd576-provenance/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build576_provenance_followup\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:577|578|579|580|581|582)/);
});
