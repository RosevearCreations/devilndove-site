import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569,CHECKS_569,DEVICES_569} from '../public/js/admin-device-acceptance-569.mjs?v=577';
import {retestPacket571} from '../public/js/admin-device-retest-571.mjs?v=577';
import {reviewNotesPacket572,acceptancePacket572} from '../public/js/admin-device-evidence-572.mjs?v=577';
import {dispositionPacket573,intakePacket573} from '../public/js/admin-device-intake-573.mjs?v=577';
import {reviewReadiness574,readinessPacket574,validateReadinessPacket574,readinessReadback574,
  READINESS_FORMAT_574} from '../public/js/admin-device-readiness-574.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const original={device:'phone',check:'dock',status:'needs-correction',note:'Search overlaps the bottom seller dock on my phone.',observed_at:'2026-11-02T02:00:00.000Z'};
const fresh={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  result:'appears-fixed',detail:'Phone Search no longer overlaps the dock after loading the correction.',retested_at:'2026-11-02T03:00:00.000Z'};
const sourceReview={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:fresh.result,retest_detail:fresh.detail,retested_at:fresh.retested_at,
  reference:'Exact source diff 570-574',review_note:'Manually compared a source reference to the device claim; independent verification pending.',
  compared_at:'2026-11-02T03:10:00.000Z'};
const draft={device:'phone',check:'dock',source_observed_at:original.observed_at,source_note:original.note,
  retest_result:fresh.result,retest_detail:fresh.detail,retested_at:fresh.retested_at,
  source_reference:sourceReview.reference,disposition:'REQUEST_INDEPENDENT_PROOF',
  review_note:'Request a separate source reviewer to check this exact change against the owner retest.',
  reviewed_at:'2026-11-02T03:20:00.000Z'};
const intake=(source=[original],retests=[fresh],notes=[sourceReview],drafts=[draft])=>
  intakePacket573(acceptancePacket572(makePacket569(source),retestPacket571(retests),
    reviewNotesPacket572(notes),'2026-11-02T04:00:00.000Z'),dispositionPacket573(drafts),'2026-11-02T04:30:00.000Z');

test('No actual device observations yields 27 gaps and never a manufactured acceptance',()=>{
  const result=reviewReadiness574(intake([],[],[],[]));
  assert.equal(result.counts.total_device_checks,27);
  assert.equal(result.counts.unreviewed_device_checks,27);
  assert.equal(result.counts.open_source_exceptions,0);
  assert.equal(result.counts.verified_exception_closures,0);
  assert.equal(result.counts.independently_verified_evidence_gap_closures,0);
  assert.equal(result.documentary_packet_ready_for_independent_review,false);
  assert.equal(result.owner_decision_ready,false);
  assert.equal(result.owner_decision,'NOT_RECORDED');
  assert.equal(result.owner_signoff,'PENDING');
  assert.match(readinessReadback574(result),/owner sign-off: PENDING/);
});

test('A source-linked apparently fixed receipt closes no independently verified evidence gap',()=>{
  const result=reviewReadiness574(intake());
  assert.equal(result.counts.open_source_exceptions,1);
  assert.equal(result.counts.unreviewed_device_checks,26);
  assert.equal(result.counts.source_references_documented_not_verified,1);
  assert.equal(result.counts.references_awaiting_independent_verification,1);
  assert.equal(result.counts.open_dispositions_unassigned,0);
  assert.equal(result.gaps[0].gap,'INDEPENDENT_SOURCE_VERIFICATION_MISSING');
  assert.equal(result.gaps[0].documentary_status,'REFERENCE_RECORDED_NOT_VERIFIED');
  assert.equal(result.gaps[0].independently_verified,false);
  assert.equal(result.gaps[0].exception_closed,false);
  assert.equal(result.owner_decision_ready,false);
  assert.equal(result.counts.verified_exception_closures,0);
});

test('Missing retest, still failing and missing source reference remain separate actionable gaps',()=>{
  const without=reviewReadiness574(intake([original],[],[],[]));
  assert.equal(without.gaps[0].gap,'ACTUAL_DEVICE_RETEST_MISSING');
  assert.equal(without.counts.actual_device_retests_missing,1);
  const failing={...fresh,result:'still-failing',retested_at:'2026-11-02T05:00:00.000Z'};
  const still=reviewReadiness574(intake([original],[failing],[],[]));
  assert.equal(still.gaps[0].gap,'DEFECT_STILL_REPRODUCES');
  assert.equal(still.counts.owner_retests_still_failing,1);
  const missingRef=reviewReadiness574(intake([original],[fresh],[],[]));
  assert.equal(missingRef.gaps[0].gap,'SOURCE_REFERENCE_MISSING');
  assert.equal(missingRef.counts.source_references_missing,1);
  for(const result of [without,still,missingRef]){
    assert.equal(result.counts.open_dispositions_unassigned,1);
    assert.equal(result.owner_decision_ready,false);
    assert.equal(result.counts.verified_exception_closures,0);
  }
});

test('A fully filled 27-check worksheet may be review-ready on paper but is NEVER owner-approved',()=>{
  const rows=DEVICES_569.flatMap(device=>CHECKS_569.map(check=>({
    device:device.id,check:check.id,status:'observed-ok',note:'Owner-entered looks right, not independently verified.',
    observed_at:'2026-11-02T03:00:00.000Z',
  })));
  const result=reviewReadiness574(intake(rows,[],[],[]));
  assert.equal(result.counts.unreviewed_device_checks,0);
  assert.equal(result.counts.open_source_exceptions,0);
  assert.equal(result.documentary_packet_ready_for_independent_review,true);
  assert.equal(result.owner_decision_ready,false);
  assert.equal(result.independent_source_verification,'NOT_PERFORMED');
  assert.equal(result.acceptance_gate,'BLOCKED_PENDING_INDEPENDENT_VERIFICATION_AND_OWNER_APPROVAL');
  assert.equal(result.counts.verified_exception_closures,0);
  assert.match(readinessReadback574(result),/YES — not approved/);
});

test('Stale source review or disposition is explicitly counted and cannot clear decision block',()=>{
  const modified={...fresh,detail:'This is a new retest from the same phone with different observed steps.'};
  const stale=reviewReadiness574(intake([original],[modified],[sourceReview],[draft]));
  assert.ok(stale.counts.stale_source_evidence>=1);
  assert.equal(stale.counts.stale_disposition_drafts,1);
  assert.equal(stale.counts.open_dispositions_unassigned,1);
  assert.equal(stale.owner_decision_ready,false);
  assert.equal(stale.counts.verified_exception_closures,0);
});

test('Portable readiness packet round-trips and rejects forged signoff, closure or edited counts',()=>{
  const packet=readinessPacket574(intake(),'2026-11-02T06:00:00.000Z');
  assert.equal(packet.format,READINESS_FORMAT_574);
  assert.equal(packet.build,574);
  assert.equal(packet.owner_signoff,'PENDING');
  assert.equal(packet.owner_decision_ready,false);
  assert.equal(packet.verified_exception_closures,0);
  assert.deepEqual(validateReadinessPacket574(JSON.parse(JSON.stringify(packet))),packet);
  for(const forged of [
    {...packet,owner_signoff:'ACCEPTED'},
    {...packet,owner_decision:'APPROVED'},
    {...packet,owner_decision_ready:true},
    {...packet,verified_exception_closures:1},
    {...packet,independent_source_verification:'PASS'},
    {...packet,readiness:{...packet.readiness,counts:{...packet.readiness.counts,verified_exception_closures:1}}},
    {...packet,source_intake:{...packet.source_intake,owner_signoff:'ACCEPTED'}},
  ])assert.throws(()=>validateReadinessPacket574(forged));
});

test('Live UI handles copied Build 573 packets, exposes blockers and no posting or closure button',()=>{
  const html=read('admin/device-acceptance/index.html');
  const js=read('public/js/admin-device-readiness-574.mjs');
  for(const id of ['dd574Readiness','dd574Title','dd574ImportText','dd574Confirm','dd574Import','dd574Local',
    'dd574Review','dd574State','dd574List','dd574CopySummary','dd574CopyPacket','dd574Summary','dd574Packet'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:574|575|576|577)/);
  assert.match(html,/No automatic evidence gap closure, issue resolution or owner sign-off occurs/);
  assert.match(js,/if\(!get\('dd574Confirm'\)\.checked\)/);
  assert.match(js,/validateIntakePacket573\(JSON\.parse\(raw\)\)/);
  assert.match(js,/win\.localStorage\.setItem\(STAGED_KEY_574/);
  assert.match(js,/gap\.textContent=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/);
});

test('Build 574 revalidates six shared module revisions and Production CI release marker',()=>{
  const html=read('admin/device-acceptance/index.html');
  for(const module of ['admin-device-acceptance-569','admin-device-followup-570','admin-device-retest-571',
    'admin-device-evidence-572','admin-device-intake-573','admin-device-readiness-574'])
    assert.ok(html.includes(`${module}.mjs?v=577`),module);
  assert.match(read('public/js/admin-device-followup-570.mjs'),/admin-device-acceptance-569\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-retest-571.mjs'),/admin-device-followup-570\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-evidence-572.mjs'),/admin-device-retest-571\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-intake-573.mjs'),/admin-device-evidence-572\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-readiness-574.mjs'),/admin-device-intake-573\.mjs\?v=577/);
  assert.match(read('css/admin-device-acceptance-569.css'),/\.dd574-gap/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build574_device_readiness\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:577|578|579|580|581|582)/);
});
