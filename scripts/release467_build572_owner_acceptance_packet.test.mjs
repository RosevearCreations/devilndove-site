import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569} from '../public/js/admin-device-acceptance-569.mjs?v=572';
import {retestPacket571} from '../public/js/admin-device-retest-571.mjs?v=572';
import {reviewNotesPacket572,validateReviewNotes572,reconcileEvidence572,acceptancePacket572,
  validateAcceptancePacket572,acceptanceReadback572,EVIDENCE_FORMAT_572} from '../public/js/admin-device-evidence-572.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const source={device:'phone',check:'dock',status:'needs-correction',note:'Search overlaps the bottom seller dock',observed_at:'2026-11-02T02:00:00.000Z'};
const retest={device:'phone',check:'dock',source_observed_at:source.observed_at,source_note:source.note,
  result:'appears-fixed',detail:'On this phone I opened Search and the dock no longer overlaps after reload.',retested_at:'2026-11-02T03:00:00.000Z'};
const review={device:'phone',check:'dock',source_observed_at:source.observed_at,source_note:source.note,
  retest_result:retest.result,retest_detail:retest.detail,retested_at:retest.retested_at,
  reference:'Build 570 dock navigation source diff',review_note:'I compared the source change and the owner-provided retest claim; independent confirmation is pending.',
  compared_at:'2026-11-02T03:15:00.000Z'};
const original=()=>makePacket569([source]);
const retests=()=>retestPacket571([retest]);
const notes=()=>reviewNotesPacket572([review]);

test('No user-supplied evidence means no acceptance, even with zero reported exceptions',()=>{
  const result=reconcileEvidence572(makePacket569([]),retestPacket571([]),reviewNotesPacket572([]));
  assert.equal(result.counts.source_exceptions,0);
  assert.equal(result.counts.unreviewed_device_checks,27);
  assert.equal(result.counts.independently_verified_closures,0);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.independent_source_verification,'NOT_PERFORMED');
  assert.equal(result.external_writes,0);
  assert.equal(result.provider_checks,0);
  assert.equal(result.d1_queries,0);
  assert.match(acceptanceReadback572(result),/owner sign-off: PENDING/);
});

test('Exact original plus fresh appears-fixed retest remains open without source reference',()=>{
  const result=reconcileEvidence572(original(),retests(),reviewNotesPacket572([]));
  assert.equal(result.counts.source_exceptions,1);
  assert.equal(result.counts.apparently_fixed_without_reference,1);
  assert.equal(result.cases[0].state,'APPEARS_FIXED_PROOF_REFERENCE_MISSING');
  assert.equal(result.cases[0].verified_closed,false);
  assert.equal(result.counts.independently_verified_closures,0);
});

test('Exact source-review note is recorded as unverified, never as acceptance or independent proof',()=>{
  const result=reconcileEvidence572(original(),retests(),notes());
  assert.equal(result.counts.source_references_unverified,1);
  assert.equal(result.counts.stale_source_notes,0);
  assert.equal(result.cases[0].state,'SOURCE_REFERENCE_RECORDED_UNVERIFIED');
  assert.equal(result.cases[0].source_review.reference,review.reference);
  assert.equal(result.cases[0].decision,'OWNER_ACCEPTANCE_PENDING_INDEPENDENT_VERIFICATION');
  assert.equal(result.counts.independently_verified_closures,0);
  assert.match(acceptanceReadback572(result),/NOT independently verified/);
});

test('Changed original report or changed retest stales the source review and cannot close the exception',()=>{
  for(const changed of [
    {source:{...source,note:'Owner source report was revised'},retest},
    {source,retest:{...retest,detail:'New retest detail entered on the original phone'}},
    {source,retest:{...retest,retested_at:'2026-11-02T05:00:00.000Z'}},
    {source:{...source,status:'observed-ok'},retest},
  ]){
    const result=reconcileEvidence572(makePacket569([changed.source]),retestPacket571([changed.retest]),notes());
    assert.equal(result.counts.source_references_unverified,0);
    assert.equal(result.counts.stale_source_notes,1);
    assert.equal(result.counts.independently_verified_closures,0);
    assert.match(acceptanceReadback572(result),/STALE SOURCE REVIEW/);
  }
});

test('A still-failing retest remains open and a past appears-fixed source review becomes stale',()=>{
  const fail={...retest,result:'still-failing',retested_at:'2026-11-02T04:30:00.000Z'};
  const result=reconcileEvidence572(original(),retestPacket571([fail]),notes());
  assert.equal(result.cases[0].state,'OWNER_REPORTS_STILL_FAILING');
  assert.equal(result.counts.still_failing,1);
  assert.equal(result.counts.stale_source_notes,1);
  assert.equal(result.counts.independently_verified_closures,0);
});

test('Forgeries, duplicates, missing review fields and unsupported reviewer decisions fail closed',()=>{
  const legitimate=notes();
  for(const invalid of [
    {...legitimate,owner_signoff:'ACCEPTED'},
    {...legitimate,entries:[review,review]},
    {...legitimate,entries:[{...review,reference:'short'}]},
    {...legitimate,entries:[{...review,review_note:'not enough'}]},
    {...legitimate,entries:[{...review,retest_result:'verified-fixed'}]},
    {...legitimate,entries:[{...review,compared_at:'yesterday'}]},
  ])assert.throws(()=>validateReviewNotes572(invalid));
  const result=reconcileEvidence572(original(),retests(),notes());
  assert.throws(()=>acceptanceReadback572({...result,owner_signoff:'ACCEPTED'}));
  assert.throws(()=>acceptanceReadback572({...result,counts:{...result.counts,independently_verified_closures:1}}));
});

test('Source-linked portable JSON packet round-trips; changed counts or false approval are rejected',()=>{
  const packet=acceptancePacket572(original(),retests(),notes(),'2026-11-02T04:00:00.000Z');
  assert.equal(packet.format,EVIDENCE_FORMAT_572);
  assert.equal(packet.build,572);
  assert.equal(packet.acceptance,'DRAFT_FOR_INDEPENDENT_REVIEW');
  assert.equal(packet.owner_signoff,'PENDING');
  assert.equal(packet.verified_closures,0);
  assert.equal(packet.source.records[0].note,source.note);
  assert.equal(packet.retests.receipts[0].retested_at,retest.retested_at);
  assert.equal(packet.source_review.entries[0].reference,review.reference);
  assert.deepEqual(validateAcceptancePacket572(JSON.parse(JSON.stringify(packet))),packet);
  for(const bad of [
    {...packet,owner_signoff:'ACCEPTED'},
    {...packet,verified_closures:1},
    {...packet,independent_source_verification:'VERIFIED'},
    {...packet,counts:{...packet.counts,source_references_unverified:99}},
    {...packet,cases:[{...packet.cases[0],verified_closed:true}]},
  ])assert.throws(()=>validateAcceptancePacket572(bad));
});

test('Live review surface has all controls, safe DOM text, no external mutation or automatic closure',()=>{
  const html=read('admin/device-acceptance/index.html');
  const js=read('public/js/admin-device-evidence-572.mjs');
  for(const id of ['dd572Evidence','dd572Title','dd572Load','dd572CopySummary','dd572CopyPacket','dd572State','dd572List','dd572Summary','dd572Packet'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:572|573|574|575|576|577)/);
  assert.match(html,/owner acceptance packet — Build 572/);
  assert.match(html,/No automatic closure, final acceptance/);
  assert.match(js,/win\.localStorage\.setItem\(NOTES_KEY_572/);
  assert.match(js,/consent\.checked/);
  assert.match(js,/pinOf\(\{device:current\.device/);
  assert.match(js,/original\.textContent=/);
  assert.match(js,/retest\.textContent=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/);
});

test('All four modules share Build 572 cache revision; CI and immutable Production marker are current',()=>{
  const html=read('admin/device-acceptance/index.html');
  for(const module of ['admin-device-acceptance-569','admin-device-followup-570','admin-device-retest-571','admin-device-evidence-572'])
    assert.ok(html.includes(`${module}.mjs?v=577`),module);
  assert.match(read('public/js/admin-device-followup-570.mjs'),/admin-device-acceptance-569\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-retest-571.mjs'),/admin-device-followup-570\.mjs\?v=577/);
  assert.match(read('public/js/admin-device-evidence-572.mjs'),/admin-device-retest-571\.mjs\?v=577/);
  assert.match(read('css/admin-device-acceptance-569.css'),/\.dd572-case/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build572_owner_acceptance_packet\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:577|578|579|580|581|582|583|584|585|586|587|588)/);
});
