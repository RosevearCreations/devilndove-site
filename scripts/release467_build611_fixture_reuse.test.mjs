import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture595} from './release467_build595_source_verification.test.mjs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {evidenceWorkboard596} from '../public/js/admin-channel-review-workboard-596.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const source595=[exact594,upstream594,[providerRow,ownerRow]];

test('Build 611 same-time fixture reuse preserves identical verified output and HOLD',()=>{
 const exact595=sourceVerification595(...source595,asOf);
 const repeated=sourceVerification595(...source595,asOf);
 assert.deepEqual(repeated,exact595);
 assert.equal(repeated.approved_trials,0);
 assert.equal(repeated.provider_reads,0);
 assert.equal(repeated.d1_operations,0);
 const atNext='2026-11-13T15:00:00Z';
 const aged=sourceVerification595(...source595,atNext);
 assert.equal(aged.as_of,atNext);
 assert.notDeepEqual(aged,exact595);
 const work=evidenceWorkboard596(exact595,source595,[],asOf);
 const identical=evidenceWorkboard596(exact595,source595,[],asOf);
 assert.deepEqual(work,identical);
 assert.equal(work.authorized_trials||0,0);
});

test('Build 611 stale or forged original issuer source still fails closed',()=>{
 const e595=sourceVerification595(...source595,asOf);
 assert.throws(()=>sourceVerification595({...exact594,source_pin:'forged'},upstream594,
   [providerRow,ownerRow],asOf));
 assert.throws(()=>evidenceWorkboard596({...e595,build:0},source595,[],asOf));
 const altered=[...source595];
 altered[2]=[...source595[2],{...providerRow,intake_pin:'synthetic-new-case'}];
 assert.throws(()=>evidenceWorkboard596(e595,altered,[],asOf));
});

test('Build 611 exact-time replay optimization is local, never persistent, at every stage',()=>{
 const stages=[
 ['public/js/admin-channel-source-verification-595.mjs','594'],
 ['public/js/admin-channel-review-workboard-596.mjs','595'],
 ['public/js/admin-channel-source-disposition-597.mjs','596'],
 ['public/js/admin-channel-issuer-response-598.mjs','597'],
 ['public/js/admin-channel-issuer-response-598.mjs','598'],
 ['public/js/admin-channel-issuer-response-598.mjs','599'],
 ['public/js/admin-channel-issuer-response-598.mjs','600'],
 ['public/js/admin-channel-issuer-response-598.mjs','601']
 ];
 for(const [file,stage] of stages){
  const s=read(file);
  assert.ok(s.includes('asOf===exact'+stage+'.as_of?reproduced:'),
   'No current-invocation verified fixture reuse at Build '+stage);
  assert.match(s,new RegExp('JSON\\.stringify\\(reproduced\\)!==JSON\\.stringify\\(exact'+stage+'\\)'),
   'Exact prior-source comparison must precede reuse '+stage);
 }
 const scripts=read('.github/workflows/current-application-quality.yml');
 for(let n=595;n<=608;n++)
  assert.match(scripts,new RegExp('release467_build'+n+'_.*\\.test\\.mjs'));
 assert.match(scripts,/node scripts\/release467_build609_ci_bundle.mjs/);
 assert.match(scripts,/node scripts\/release467_build610_evidence_budget.mjs/);
 assert.match(scripts,/node --test scripts\/release467_build611_fixture_reuse.test.mjs/);
 const deployment=read('.github/workflows/production-pages-deploy-current.yml');
 assert.match(deployment,/"build":6\d{2}/);
 assert.match(read('admin/channel-trials/index.html'),/Devil n Dove • Build 6\d{2}/);
 assert.match(read('admin/channel-trials/index.html'),
  /admin-channel-issuer-response-598\.mjs\?v=6\d{2}/);
});
