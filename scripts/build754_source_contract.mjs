// Build 754 — original production marker, two-Admin witness and retention closure test fixture.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessCareWitness754,productionMarker754} from '../functions/api/admin/customer-care-retention-ops-752.js';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('functions/api/admin/customer-care-retention-ops-752.js');
const client=read('public/js/admin-customer-care-sla-751.js');
const html=read('admin/storefront-acceptance/index.html');
assert.equal(moduleKeyForPath('/api/admin/customer-care-retention-ops-752'),MODULE_KEYS.STOREFRONT);
for(const id of ['a754Workflow','a754Heading','a754Load','a754Sha','a754Status','a754Summary',
 'a754Rows','a754Selected','a754Task','a754Code','a754Subject','a754Note','a754Open','a754Confirm',
 'a754Close','a754History'])assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('admin-customer-care-sla-751.js?v=751-752-753-754'));
assert.ok(client.includes("credentials:'same-origin'")&&client.includes("cache:'no-store'"));
assert.ok(!client.includes('innerHTML')&&!client.includes('localStorage')&&!client.includes('setInterval('));
for(const marker of ['site.admin.customerjourney.production-witness.v754',
 'INDEPENDENT_ORIGINAL_753_REVIEW_REQUIRED','SECOND_ORIGINAL_ADMIN_OR_FRESH_SOURCE_REQUIRED',
 'ORIGINAL_RETENTION_CLOSURE_HOLD','ORIGINAL_SOURCE_CHANGED_RELOAD',
 'ORIGINAL_PRODUCTION_BINDING_REQUIRED','SERVER_BOUND_PRODUCTION_RELEASE_ASSET',
 'REQUIRES_ORIGINAL_TWO_ADMIN_RECEIPTS','legal_retention_determination:false',
 'no_provider_write:true','no_purge:true'])assert.ok(api.includes(marker),marker);
assert.ok(!api.includes('DELETE FROM')&&!api.includes('setInterval('));
const sha='a'.repeat(40),marker={ok:true,source_sha:sha,workflow_run_id:'45255069299'};
const taskId='16b147a8-d11f-47e9-8fb5-c0fbc3949de0',code='RETENTION_REVIEW_ESCALATION';
const task={id:taskId,kind:'task_open',order_id:25};
const plan={id:'plan',kind:'retention_plan',task_id:taskId,review_on:'2026-11-22'};
const ack={id:'ack',kind:'review_ack',task_id:taskId,plan_id:plan.id,actor_user_id:2};
const confirmedAck={id:'ack2',kind:'review_confirm',subject_id:ack.id,actor_user_id:3};
const raised={id:'raised',kind:'exception_raise',task_id:taskId,exception_code:code,actor_user_id:1};
const review={id:'review',kind:'exception_review',subject_id:raised.id,decision:'pass',actor_user_id:2};
const s={
 work:{version:1,receipts:[task]},
 custody:{version:2,receipts:[{id:'archive',kind:'archive_review',task_id:taskId,decision:'approve'}]},
 sla:{version:3,receipts:[{id:'check',kind:'retention_check',subject_id:plan.id,decision:'reviewed'},
 {id:'approve',kind:'retention_review',subject_id:plan.id,decision:'approve'},plan]},
 ops:{version:4,receipts:[confirmedAck,ack]}
};
const e={version:5,receipts:[review,raised]};
const versions={work:1,custody:2,sla:3,retention_ops:4,exceptions:5};
const opened={id:'open',kind:'witness_open',task_id:taskId,exception_code:code,actor_user_id:3,
 source_sha:sha,source_versions:versions};
const second={id:'second',kind:'witness_confirm',subject_id:opened.id,actor_user_id:4,
 source_sha:sha,source_versions:versions};
let assess=(ss=s,ee=e,ww={receipts:[second,opened]},mm=marker)=>assessCareWitness754(ss,ee,ww,taskId,code,mm);
let result=assess();
assert.equal(result.two_admin_live_certified,true);
assert.equal(result.retention_review_closure_ready,true);
assert.equal(result.original_internal_retention_closure_id,null);
const closure={id:'closure',kind:'retention_closure',task_id:taskId,subject_id:second.id,
 source_sha:sha,source_versions:versions};
assert.equal(assess(s,e,{receipts:[closure,second,opened]}).original_internal_retention_closure_id,'closure');
assert.equal(assess(s,e,{receipts:[{...second,actor_user_id:3},opened]}).two_admin_live_certified,false);
assert.equal(assess(s,e,{receipts:[{...second,source_sha:'b'.repeat(40)},opened]}).retention_review_closure_ready,false);
assert.equal(assess(s,e,{receipts:[{...second,source_versions:{...versions,exceptions:6}},opened]}).retention_review_closure_ready,false);
assert.equal(assess(s,{...e,receipts:[{...review,actor_user_id:1},raised]}).retention_review_closure_ready,false);
assert.equal(assess({...s,custody:{...s.custody,receipts:[{kind:'retention_hold',task_id:taskId,id:'hold'},...s.custody.receipts]}}).retention_review_closure_ready,false);
assert.equal(assess({...s,ops:{...s.ops,receipts:[ack]}}).retention_review_closure_ready,false);
assert.equal(assess({...s,sla:{...s.sla,receipts:[plan,...s.sla.receipts.filter(x=>x.kind!=='retention_check')]}}).retention_review_closure_ready,false);
assert.equal(assess(s,e,{receipts:[second,opened]},{ok:false}).two_admin_live_certified,false);
const fakeAssets=content=>({fetch:async()=>new Response(content,{status:200})});
const ctx={request:new Request('https://devilndove.com/api/admin/customer-care-retention-ops-752?witness754=1'),
 env:{DND_ENVIRONMENT:'production',ASSETS:fakeAssets(JSON.stringify({branch:'main',source_sha:sha,workflow_run_id:'45255069299'}))}};
assert.equal((await productionMarker754(ctx)).ok,true);
assert.equal((await productionMarker754({...ctx,env:{...ctx.env,DND_ENVIRONMENT:'development'}})).ok,false);
assert.equal((await productionMarker754({...ctx,env:{...ctx.env,ASSETS:fakeAssets(JSON.stringify({branch:'dev',source_sha:sha,workflow_run_id:'45255069299'}))}})).ok,false);
assert.equal((await productionMarker754({...ctx,env:{...ctx.env,ASSETS:fakeAssets(JSON.stringify({branch:'main',source_sha:'bad',workflow_run_id:'1'}))}})).ok,false);
console.log('BUILD754 SOURCE PASS: true main-source proof, same-Admin and stale-source refusals, original independent escalation and no-purge internal retention closure gates.');
