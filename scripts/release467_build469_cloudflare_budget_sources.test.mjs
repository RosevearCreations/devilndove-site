import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FREE_PLAN_REFERENCE_469,PROVENANCE_DOCS_469,reviewSourceReceipts469} from '../public/js/maker-budget-source-policy-469.mjs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const fixture=()=>({
 day:'2026-10-25',month:'2026-10',
 planConfirmations:{d1:true,workers:true,r2:true},
 evidence:{
  d1:{url:'https://dash.cloudflare.com/account/d1?token=remove-me#hash',reference:'D1 source screenshot #12',windowStart:'2026-10-25T00:00:00Z',windowEnd:'2026-10-25T13:00:00Z'},
  workers:{url:'https://dash.cloudflare.com/account/workers',reference:'Workers source screenshot #13',windowStart:'2026-10-25T00:00:00Z',windowEnd:'2026-10-26T00:00:00Z'},
  r2:{url:'https://dash.cloudflare.com/account/r2',reference:'R2 billing screenshot #14',windowStart:'2026-10-01T00:00:00Z',windowEnd:'2026-10-25T13:00:00Z'}
 },
 values:{d1_reads:'3',d1_writes:'0',worker_requests:'75000',r2_class_a:'1000000',r2_class_b:'13'}
});

test('No provider readings, plan confirmations or source refs is always HOLD',()=>{
 const review=reviewSourceReceipts469();
 assert.equal(review.providerVerified,false);
 assert.equal(review.state,'HOLD_SOURCE_EVIDENCE_INCOMPLETE');
 assert.equal(review.hotspots.length,0);
 assert.ok(review.metrics.every(m=>m.ratio===null));
 assert.equal(review.automaticCodeChange,false);
 assert.equal(review.automaticR2Delete,false);
 assert.equal(review.paidMonitoringEnabled,false);
});

test('Free-plan reference windows and allowances are exact with monthly R2 inclusion semantics',()=>{
 assert.deepEqual(FREE_PLAN_REFERENCE_469.map(m=>[m.key,m.allowance,m.window,m.kind]),[
  ['d1_reads',5000000,'day','daily_limit'],['d1_writes',100000,'day','daily_limit'],
  ['worker_requests',100000,'day','daily_limit'],['r2_class_a',1000000,'month','monthly_free_inclusion'],
  ['r2_class_b',10000000,'month','monthly_free_inclusion']
 ]);
 assert.ok(Object.values(PROVENANCE_DOCS_469).every(v=>v.startsWith('https://developers.cloudflare.com/')));
 const result=reviewSourceReceipts469(fixture());
 assert.equal(result.state,'HOLD_OWNER_PROVIDER_VERIFICATION');
 assert.equal(result.metrics.length,5);
 assert.deepEqual(result.hotspots.map(h=>h.key),['worker_requests','r2_class_a']);
 assert.equal(result.metrics.find(m=>m.key==='d1_writes').status,'BELOW_REFERENCE_SO_FAR');
 assert.equal(result.metrics.find(m=>m.key==='worker_requests').ratio,.75);
 assert.equal(result.metrics.find(m=>m.key==='r2_class_a').status,'REVIEW_ABOVE_REFERENCE');
 assert.equal(result.groups.d1.partialPeriod,true);
 assert.equal(result.groups.workers.partialPeriod,false);
 assert.equal(result.groups.r2.partialPeriod,true);
 assert.equal(result.groups.d1.source,'https://dash.cloudflare.com/account/d1');
 assert.ok(!JSON.stringify(result).includes('remove-me'));
 assert.equal(result.providerVerified,false);
 assert.equal(result.routeAttributionVerified,false);
 assert.ok(result.hotspots.every(h=>!h.automaticFixAuthorized));
});

test('An unconfirmed plan cannot borrow the Free-plan allowance',()=>{
 const f=fixture();f.planConfirmations.workers=false;
 const r=reviewSourceReceipts469(f);
 assert.equal(r.metrics.find(m=>m.key==='worker_requests').ratio,null);
 assert.equal(r.groups.workers.status,'HOLD_SOURCE_OR_WINDOW');
});

test('Mismatched UTC boundaries and off-month periods block group comparison',()=>{
 const f=fixture();f.evidence.d1.windowStart='2026-10-25T01:00:00Z';f.evidence.r2.windowEnd='2026-11-01T00:00:01Z';
 const r=reviewSourceReceipts469(f);
 assert.equal(r.groups.d1.status,'HOLD_SOURCE_OR_WINDOW');
 assert.equal(r.groups.r2.status,'HOLD_SOURCE_OR_WINDOW');
 assert.equal(r.metrics.find(m=>m.key==='d1_reads').ratio,null);
 assert.equal(r.metrics.find(m=>m.key==='r2_class_a').ratio,null);
});

test('Reject malformed calendar dates, timestamps, fabricated numbers and credential URLs',()=>{
 const f=fixture();f.day='2026-02-30';f.month='2026-13';
 f.values.r2_class_b='2.1';f.values.worker_requests='1e6';
 f.evidence.d1.url='https://dash.cloudflare.com.evil.example/path';
 f.evidence.r2.reference='secret\nscript';
 f.evidence.workers.url='https://user:password@dash.cloudflare.com/path';
 const r=reviewSourceReceipts469(f);
 assert.ok(r.metrics.every(m=>m.ratio===null));
 assert.equal(r.groups.workers.source,null);
 assert.equal(r.groups.d1.source,null);
 assert.equal(r.groups.r2.receiptReference,null);
});

test('Source capture is UI-only; existing Build 463 provider worksheet remains available',()=>{
 const html=read('admin/maker-resource-budget/index.html');
 const adapter=read('public/js/admin-maker-budget-source-469.js');
 const policy=read('public/js/maker-budget-source-policy-469.mjs');
 for(const id of ['rb469Day','rb469Month','rb469Review','rb469Export','rb469Results',
  ...['d1','workers','r2'].flatMap(g=>[`rb469${g}Reference`,`rb469${g}Start`,`rb469${g}End`,`rb469${g}Free`])]){
  assert.ok(html.includes(`id="${id}"`),id);
 }
 assert.match(html,/admin-maker-resource-budget-463\.js/);
 assert.match(html,/admin-maker-budget-source-469\.js/);
 for(const existing of ['rbD1Source','rbWorkersSource','rbR2Source','rbMetrics','rbContracts'])assert.ok(html.includes(`id="${existing}"`));
 assert.doesNotMatch(policy,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/);
 assert.doesNotMatch(adapter,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB/);
 assert.match(adapter,/new Blob\(/);
 assert.match(html,/ⓘ/);
});
