import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePacket569} from '../public/js/admin-device-acceptance-569.mjs?v=570';
import {TRIAGE_FORMAT_570,triagePacket570,triageText570} from '../public/js/admin-device-followup-570.mjs';

const source=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const sample=[
  {device:'desktop',check:'art',status:'needs-correction',note:'Banner clipped on wide window',observed_at:'2026-11-02T01:00:00Z'},
  {device:'phone',check:'dock',status:'needs-correction',note:'Search touches the dock on my phone',observed_at:'2026-11-02T01:01:00Z'},
  {device:'phone',check:'tabs',status:'observed-ok',note:'All four tabs reachable',observed_at:'2026-11-02T01:02:00Z'},
  {device:'tablet',check:'etsy',status:'needs-correction',note:'Listing ID readback was unclear',observed_at:'2026-11-02T01:03:00Z'},
];

test('Empty owner feedback remains 27 pending; never reports acceptance or verified fixes',()=>{
  const result=triagePacket570(makePacket569([]));
  assert.equal(result.format,TRIAGE_FORMAT_570);
  assert.equal(result.build,570);
  assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.total_checks,27);
  assert.equal(result.pending_device_observations,27);
  assert.equal(result.observed_without_signoff,0);
  assert.equal(result.candidates.length,0);
  assert.equal(result.verified_fixes_closed,0);
  assert.equal(result.external_writes,0);
  assert.equal(result.remote_provider_checks,0);
  assert.match(triageText570(result),/Owner sign-off: PENDING/);
  assert.match(triageText570(result),/No issue is closed/);
});

test('Owner reports are suggested priority candidates, not source-verified defects',()=>{
  const result=triagePacket570(makePacket569(sample));
  assert.equal(result.candidates.length,3);
  assert.equal(result.observed_without_signoff,1);
  assert.equal(result.pending_device_observations,23);
  assert.deepEqual(result.candidates.map(x=>[x.priority,x.device,x.check]),[
    ['P1','phone','dock'],['P1','tablet','etsy'],['P2','desktop','art'],
  ]);
  assert.ok(result.candidates.every(x=>x.resolution==='AWAITING_SOURCE_CHECK_AND_OWNER_RETEST'));
  assert.ok(result.candidates.every(x=>x.evidence==='OWNER_NOTE_RECORDED_NOT_VERIFIED'));
  assert.ok(result.candidates.every(x=>x.route.startsWith('/admin/')));
  assert.match(triageText570(result),/Retest seller dock, Search and Resume/);
  assert.match(triageText570(result),/No Product, provider, inventory, finance or D1 write occurs/);
});

test('Missing details stay open and malformed acceptance packets fail closed',()=>{
  const missing={device:'desktop',check:'commerce',status:'needs-correction',note:'',observed_at:'2026-11-02T01:04:00Z'};
  const triage=triagePacket570(makePacket569([missing]));
  assert.equal(triage.candidates[0].evidence,'DETAILS_REQUIRED');
  assert.equal(triage.candidates[0].resolution,'AWAITING_SOURCE_CHECK_AND_OWNER_RETEST');
  assert.throws(()=>triagePacket570({...makePacket569([]),owner_signoff:'APPROVED'}));
  assert.throws(()=>triagePacket570({...makePacket569([]),records:[{...missing,device:'unknown'}]}));
  assert.throws(()=>triageText570({...triage,owner_signoff:'COMPLETE'}));
});

test('Build 569 navigation correction opens the source workspace in another tab to preserve unsaved notes',()=>{
  const source569=source('public/js/admin-device-acceptance-569.mjs');
  assert.match(source569,/link\.href=check\.href;link\.target='_blank';link\.rel='noopener noreferrer'/);
  assert.match(source569,/Open Admin workspace in a new tab/);
  assert.match(source569,/let dirty=false/);
  assert.match(source569,/Unsaved browser changes/);
});

test('Follow-up panel loads the exact same versioned worksheet module once and copies only a local summary',()=>{
  const html=source('admin/device-acceptance/index.html');
  const js=source('public/js/admin-device-followup-570.mjs');
  assert.match(html,/Devil n Dove • Build 570/);
  assert.match(html,/admin-device-acceptance-569\.mjs\?v=570/);
  assert.match(html,/admin-device-followup-570\.mjs\?v=570/);
  assert.match(js,/from '\.\/admin-device-acceptance-569\.mjs\?v=570'/);
  for(const id of ['dd570Followup','dd570Title','dd570Build','dd570Copy','dd570State','dd570List','dd570Export'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/source correction or a Production GREEN build does not prove/);
  assert.match(html,/No Product save, Etsy update, remote write, automatic issue closure/);
  assert.match(js,/win\.localStorage\.getItem\(STORAGE_KEY_569\)/);
  assert.match(js,/copyButton\.disabled=false/);
  assert.match(js,/item\.resolution|Candidate only/);
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\.localStorage\.setItem/);
});

test('Scoped responsive styling and production gate are required in CI',()=>{
  const css=source('css/admin-device-acceptance-569.css');
  assert.match(css,/\.dd570-candidate/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(max-width:750px\)/);
  assert.match(source('.github/workflows/current-application-quality.yml'),/release467_build570_device_triage_followup\.test\.mjs/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'),/"build":570/);
});
