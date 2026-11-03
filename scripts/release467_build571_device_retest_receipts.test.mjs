import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569} from '../public/js/admin-device-acceptance-569.mjs?v=571';
import {retestPacket571,validateRetests571,reconcileRetests571,retestSummary571,RETEST_FORMAT_571} from '../public/js/admin-device-retest-571.mjs';

const source=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const sourceRow={device:'phone',check:'dock',status:'needs-correction',note:'Search overlaps the bottom seller dock',observed_at:'2026-11-02T02:00:00.000Z'};
const receipt={device:'phone',check:'dock',source_observed_at:sourceRow.observed_at,source_note:sourceRow.note,
  result:'appears-fixed',detail:'On my phone Search now clears the bottom dock after reload.',retested_at:'2026-11-02T02:10:00.000Z'};

test('Build 571 starts with zero source candidates and no inferred owner sign-off',()=>{
  const result=reconcileRetests571(makePacket569([]),retestPacket571([]));
  assert.equal(result.candidate_count,0);
  assert.equal(result.matched_retest_count,0);
  assert.equal(result.stale_receipt_count,0);
  assert.equal(result.verified_closures,0);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.external_writes,0);
  assert.equal(result.provider_checks,0);
  assert.match(retestSummary571(result),/No candidate is automatically closed/);
});

test('Owner-entered apparent fix matches exact original device report yet never closes an issue',()=>{
  const packet=retestPacket571([receipt]);
  assert.equal(packet.format,RETEST_FORMAT_571);
  assert.equal(packet.owner_signoff,'PENDING');
  const result=reconcileRetests571(makePacket569([sourceRow]),packet);
  assert.equal(result.candidate_count,1);
  assert.equal(result.matched_retest_count,1);
  assert.equal(result.owner_reports_appears_fixed,1);
  assert.equal(result.candidates_awaiting_retest,0);
  assert.equal(result.verified_closures,0);
  assert.match(retestSummary571(result),/Independently verified closures: 0; owner sign-off: PENDING/);
  assert.match(retestSummary571(result),/Independent check and explicit owner review still required/);
});

test('A changed or resolved underlying observation invalidates the previous retest receipt',()=>{
  for(const updated of [{...sourceRow,note:'Search overlap changed'},
    {...sourceRow,observed_at:'2026-11-02T03:00:00.000Z'},
    {...sourceRow,status:'observed-ok'}]){
    const result=reconcileRetests571(makePacket569([updated]),retestPacket571([receipt]));
    assert.equal(result.matched_retest_count,0);
    assert.equal(result.stale_receipt_count,1);
    assert.equal(result.verified_closures,0);
    assert.match(retestSummary571(result),/STALE RETEST/);
  }
});

test('Unsupported sign-off, inadequate detail, duplicate receipts and unrecognized retest results fail closed',()=>{
  const packet=retestPacket571([receipt]);
  for(const invalid of [
    {...packet,owner_signoff:'ACCEPTED'},
    {...packet,receipts:[{...receipt,result:'verified-closed'}]},
    {...packet,receipts:[{...receipt,detail:'ok'}]},
    {...packet,receipts:[{...receipt,retested_at:'not-a-date'}]},
    {...packet,receipts:[receipt,receipt]},
  ])assert.throws(()=>validateRetests571(invalid));
  assert.throws(()=>retestSummary571({...reconcileRetests571(makePacket569([]),retestPacket571([])),verified_closures:1}));
});

test('Visible retest UI requires explicit source-bound decision, 12-character explanation and device confirmation',()=>{
  const html=source('admin/device-acceptance/index.html');
  const js=source('public/js/admin-device-retest-571.mjs');
  for(const id of ['dd571Retests','dd571Title','dd571Load','dd571Copy','dd571State','dd571List','dd571Export'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:571|572|573|574|575|576|577)/);
  assert.match(html,/An “appears fixed” retest is only a personal observation/);
  assert.match(js,/Choose retest outcome/);
  assert.match(js,/!confirm\.checked\|\|!states\.has\(select\.value\)\|\|note\.value\.trim\(\)\.length<12/);
  assert.match(js,/current\.observed_at!==candidate\.observed_at\|\|current\.observation!==candidate\.observation/);
  assert.match(js,/win\.localStorage\.setItem\(RETEST_STORAGE_571/);
  assert.match(js,/source\.textContent=/);
  assert.match(js,/link\.target='_blank';link\.rel='noopener noreferrer'/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/);
});

test('All earlier modules share current cache revision, accessibility is retained and CI/Production marker required',()=>{
  const html=source('admin/device-acceptance/index.html');
  const triage=source('public/js/admin-device-followup-570.mjs');
  const retest=source('public/js/admin-device-retest-571.mjs');
  for(const module of ['admin-device-acceptance-569','admin-device-followup-570','admin-device-retest-571'])assert.ok(html.includes(`${module}.mjs?v=577`),module);
  assert.match(triage,/admin-device-acceptance-569\.mjs\?v=577/);
  assert.match(retest,/admin-device-acceptance-569\.mjs\?v=577/);
  assert.match(retest,/admin-device-followup-570\.mjs\?v=577/);
  assert.match(source('css/admin-device-acceptance-569.css'),/\.dd571-retest/);
  assert.match(source('css/admin-device-acceptance-569.css'),/:focus-visible/);
  assert.match(source('.github/workflows/current-application-quality.yml'),/release467_build571_device_retest_receipts\.test\.mjs/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:577|578|579|580|581|582|583|584|585|586|587)/);
});
