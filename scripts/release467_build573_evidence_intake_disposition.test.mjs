import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569} from '../public/js/admin-device-acceptance-569.mjs?v=577';
import {retestPacket571} from '../public/js/admin-device-retest-571.mjs?v=577';
import {reviewNotesPacket572,acceptancePacket572} from '../public/js/admin-device-evidence-572.mjs?v=577';
import {DISPOSITIONS_573,dispositionPacket573,validateDispositions573,reconcileIntake573,
  intakePacket573,validateIntakePacket573,intakeReadback573,INTAKE_FORMAT_573} from '../public/js/admin-device-intake-573.mjs';

const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const source={device:'phone',check:'dock',status:'needs-correction',note:'On the phone Search overlaps the bottom seller dock',observed_at:'2026-11-02T02:00:00.000Z'};
const retest={device:'phone',check:'dock',source_observed_at:source.observed_at,source_note:source.note,
  result:'appears-fixed',detail:'I retested the Search overlay on my phone after refreshing.',retested_at:'2026-11-02T03:00:00.000Z'};
const review={device:'phone',check:'dock',source_observed_at:source.observed_at,source_note:source.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  reference:'Build 570 exact source reference',review_note:'Manually compared the source change with the device retest claim; not independently verified.',
  compared_at:'2026-11-02T03:10:00.000Z'};
const sourcePacket=()=>acceptancePacket572(makePacket569([source]),retestPacket571([retest]),reviewNotesPacket572([review]),'2026-11-02T04:00:00.000Z');
const draft={device:'phone',check:'dock',source_observed_at:source.observed_at,source_note:source.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,source_reference:review.reference,
  disposition:'REQUEST_INDEPENDENT_PROOF',review_note:'This reference requires a separate independent verification of the actual fix.',
  reviewed_at:'2026-11-02T04:05:00.000Z'};

test('Empty imported Build 572 evidence cannot imply acceptance or close 27 unreviewed checks',()=>{
  const input=acceptancePacket572(makePacket569([]),retestPacket571([]),reviewNotesPacket572([]),'2026-11-02T04:00:00.000Z');
  const result=reconcileIntake573(input,dispositionPacket573([]));
  assert.equal(result.counts.source_exceptions,0);
  assert.equal(result.counts.unreviewed_device_checks,27);
  assert.equal(result.counts.verified_closures,0);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.owner_decision,'NOT_RECORDED');
  assert.equal(result.structural_validation,'PASS_NOT_OWNER_AUTHENTICATION');
  assert.match(intakeReadback573(result),/NOT RECORDED/);
});

test('Exact imported retest and source reference still require independent proof; follow-up draft stays OPEN',()=>{
  const result=reconcileIntake573(sourcePacket(),dispositionPacket573([draft]));
  assert.equal(result.counts.source_exceptions,1);
  assert.equal(result.counts.awaiting_disposition,0);
  assert.equal(result.counts.unverified_source_references,1);
  assert.equal(result.cases[0].recommended_disposition,'REQUEST_INDEPENDENT_PROOF');
  assert.equal(result.cases[0].manual_disposition.disposition,'REQUEST_INDEPENDENT_PROOF');
  assert.equal(result.cases[0].verified_closed,false);
  assert.equal(result.cases[0].owner_decision,'NOT_RECORDED');
  assert.match(intakeReadback573(result),/OPEN/);
});

test('Missing retest recommends actual-device action, still-failing recommends source fix escalation',()=>{
  const without=acceptancePacket572(makePacket569([source]),retestPacket571([]),reviewNotesPacket572([]),'2026-11-02T04:00:00.000Z');
  const failing={...retest,result:'still-failing',retested_at:'2026-11-02T05:00:00.000Z'};
  const withFailure=acceptancePacket572(makePacket569([source]),retestPacket571([failing]),reviewNotesPacket572([]),'2026-11-02T04:00:00.000Z');
  assert.equal(reconcileIntake573(without,dispositionPacket573([])).cases[0].recommended_disposition,'REQUEST_DEVICE_RETEST');
  assert.equal(reconcileIntake573(withFailure,dispositionPacket573([])).cases[0].recommended_disposition,'ESCALATE_SOURCE_FIX');
  assert.equal(reconcileIntake573(withFailure,dispositionPacket573([])).counts.owner_reports_still_failing,1);
});

test('Changed original note, fresh device retest or source-reference change stales prior dispositions',()=>{
  for(const changed of [
    {source:{...source,note:'Search overlap now appears in a different width'},retest,review},
    {source,retest:{...retest,detail:'The corrected Search overlay works on a new phone viewport.'},review},
    {source,retest,review:{...review,reference:'New source evidence identifier for recheck'}},
  ]){
    const input=acceptancePacket572(makePacket569([changed.source]),retestPacket571([changed.retest]),
      reviewNotesPacket572([changed.review]),'2026-11-02T06:00:00.000Z');
    const result=reconcileIntake573(input,dispositionPacket573([draft]));
    assert.equal(result.counts.stale_disposition_drafts,1);
    assert.equal(result.cases[0]?.manual_disposition??null,null);
    assert.equal(result.counts.verified_closures,0);
  }
});

test('No ACCEPT, CLOSE, RESOLVE or external publication disposition is supported',()=>{
  assert.deepEqual(DISPOSITIONS_573.map(row=>row.id),[
    'KEEP_OPEN','REQUEST_DEVICE_RETEST','REQUEST_INDEPENDENT_PROOF','ESCALATE_SOURCE_FIX']);
  for(const invalid of [
    {...dispositionPacket573([draft]),owner_signoff:'ACCEPTED'},
    {...dispositionPacket573([draft]),entries:[draft,draft]},
    {...dispositionPacket573([draft]),entries:[{...draft,disposition:'CLOSE_VERIFIED'}]},
    {...dispositionPacket573([draft]),entries:[{...draft,review_note:'too short'}]},
    {...dispositionPacket573([draft]),entries:[{...draft,reviewed_at:'not-a-date'}]},
  ])assert.throws(()=>validateDispositions573(invalid));
  const result=reconcileIntake573(sourcePacket(),dispositionPacket573([draft]));
  assert.throws(()=>intakeReadback573({...result,owner_decision:'APPROVED'}));
});

test('Portable intake draft is structurally coherent and rejects tampered approval, evidence and closure counts',()=>{
  const packet=intakePacket573(sourcePacket(),dispositionPacket573([draft]),'2026-11-02T05:00:00.000Z');
  assert.equal(packet.format,INTAKE_FORMAT_573);
  assert.equal(packet.intake,'STRUCTURALLY_VALIDATED_UNAUTHENTICATED');
  assert.equal(packet.owner_signoff,'PENDING');
  assert.equal(packet.verified_closures,0);
  assert.deepEqual(validateIntakePacket573(JSON.parse(JSON.stringify(packet))),packet);
  for(const fake of [
    {...packet,owner_signoff:'ACCEPTED'},
    {...packet,owner_decision:'APPROVED'},
    {...packet,verified_closures:1},
    {...packet,review:{...packet.review,counts:{...packet.review.counts,verified_closures:1}}},
    {...packet,source_packet:{...packet.source_packet,owner_signoff:'ACCEPTED'}},
    {...packet,dispositions:{...packet.dispositions,entries:[{...draft,disposition:'CLOSE'}]}},
  ])assert.throws(()=>validateIntakePacket573(fake));
});

test('UI stages imported copy separately, requires explicit confirmation, compares source pins and has no remote writes',()=>{
  const html=file('admin/device-acceptance/index.html');
  const js=file('public/js/admin-device-intake-573.mjs');
  for(const id of ['dd573Intake','dd573Title','dd573ImportText','dd573Confirm','dd573Import','dd573Local',
    'dd573Review','dd573State','dd573List','dd573CopySummary','dd573CopyPacket','dd573Summary','dd573Packet'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:573|574|575|576|577)/);
  assert.match(html,/No ACCEPT, RESOLVE, APPROVE or CLOSE action exists/);
  assert.match(js,/if\(!get\('dd573Confirm'\)\.checked\)/);
  assert.match(js,/validateAcceptancePacket572\(JSON\.parse\(raw\)\)/);
  assert.match(js,/pinOf\(current\)!==pinOf\(row\)/);
  assert.match(js,/win\.localStorage\.setItem\(STAGED_KEY_573/);
  assert.match(js,/win\.localStorage\.setItem\(DISPOSITION_KEY_573/);
  assert.match(js,/original\.textContent=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/);
});

test('Build 573 cache, CI and immutable Production version marker are current',()=>{
  const html=file('admin/device-acceptance/index.html');
  for(const module of ['admin-device-acceptance-569','admin-device-followup-570','admin-device-retest-571','admin-device-evidence-572','admin-device-intake-573'])
    assert.ok(html.includes(`${module}.mjs?v=577`),module);
  assert.match(file('public/js/admin-device-followup-570.mjs'),/admin-device-acceptance-569\.mjs\?v=577/);
  assert.match(file('public/js/admin-device-retest-571.mjs'),/admin-device-followup-570\.mjs\?v=577/);
  assert.match(file('public/js/admin-device-evidence-572.mjs'),/admin-device-retest-571\.mjs\?v=577/);
  assert.match(file('public/js/admin-device-intake-573.mjs'),/admin-device-evidence-572\.mjs\?v=577/);
  assert.match(file('css/admin-device-acceptance-569.css'),/\.dd573-case/);
  assert.match(file('.github/workflows/current-application-quality.yml'),/release467_build573_evidence_intake_disposition\.test\.mjs/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:577|578|579|580|581|582|583|584|585|586|587)/);
});
