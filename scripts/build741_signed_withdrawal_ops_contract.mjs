import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet as audit} from '../functions/api/admin/privacy-retry-audit-741.js';
import {onRequestPost as requeue} from '../functions/api/admin/privacy-retry-730.js';
const url='https://devilndove.com/api/admin/privacy-retry-audit-741';
const admin={ddModuleAccess:{allowed:true,user:{user_id:1,role:'admin',is_active:1}}};
assert.equal((await audit({request:new Request(url),env:{},data:{}})).status,401);
assert.equal((await audit({request:new Request(url),env:{},data:admin})).status,503);
const e='11111111-1111-4111-8111-111111111111';
let calls=0;
const groups=[{target_app:'ai-data-platform',total:3,manual_ack:1,worker_ack:1,
 conflicting_ack:0,dead_letter:1,lease_expired:1,retry_due:0,not_in_retry_ledger:0,
 consent_not_withdrawn:0,local_sla_resolution:1}];
const cases=[{event_id:e,target_app:'ai-data-platform',state:'DEAD_LETTER',attempt_count:6,
 retry_cycle:0,retry_after:'2026-11-19 00:00:00',manual_ack:0,worker_ack:0,
 consent_withdrawn:1,last_outcome:'UNAVAILABLE'}];
const db={prepare(sql){
 assert.ok(sql.trim().startsWith('SELECT'),'Audit must never write original D1');
 calls++;
 return {async all(){return {results:sql.includes('GROUP BY')?groups:cases}},
  async first(){return {tick_state:'RUN',created_at:'2026-11-18 13:00:00',
   considered_events:3,signed_ack_count:1,held_events:1}}};
}};
let network=0;const old=globalThis.fetch;
globalThis.fetch=async()=>{network++;throw Error('No outbound network required')};
try{
 const res=await audit({request:new Request(url),env:{DB:db,SESSION_SECRET:'dont-leak'},
  data:admin});
 assert.equal(res.status,200);
 const body=await res.json();
 assert.equal(body.build,741);
 assert.equal(body.peers.length,3);
 assert.equal(body.peers[0].dead_letter,1);
 assert.equal(body.peers[0].local_sla_resolution,1);
 assert.equal(body.peers[0].original_worker_ack,1);
 assert.equal(body.cases.length,1);
 assert.equal(body.cases[0].requeue_eligible_source_only,true);
 assert.equal(body.external_delivery_authorized,false);
 assert.equal(body.external_erasure_proven,false);
 assert.equal(body.independent_receiver_ack_verified,false);
 assert.equal(body.original_owner_activation_recorded,false);
 assert.equal(body.db_mutations,0);
 assert.equal(calls,3);
 assert.equal(network,0);
 assert.ok(!JSON.stringify(body).includes('dont-leak'));
}finally{globalThis.fetch=old;}

// Original dead-letter handler must HOLD when Worker signed ACK already exists,
// before issuing a review ID or any new audit write.
const post='https://devilndove.com/api/admin/privacy-retry-730';
const req=new Request(post,{method:'POST',headers:{Origin:'https://devilndove.com',
 'Content-Type':'application/json','Sec-Fetch-Site':'same-origin'},
 body:JSON.stringify({action:'review_dead_letter_730',event_id:e,owner_review_confirmed:true,
 reason_code:'REVIEWED_OWNER'})});
let writes=0;
const proofDb={prepare(sql){assert.ok(sql.trim().startsWith('SELECT'));return {
 bind(){return this},async first(){return {state:'DEAD_LETTER',retry_cycle:0,
  attempt_count:6,event_id:e,consent_status:'revoked',admin_ack_count:0,worker_ack_count:1}}
 };},async batch(){writes++;throw Error('Unwanted D1 write')}};
const denied=await requeue({request:req,env:{DB:proofDb},data:admin});
assert.equal(denied.status,409);
assert.equal(writes,0);
const source=readFileSync(new URL('../functions/api/admin/privacy-retry-730.js',import.meta.url),'utf8');
assert.ok(source.includes('worker_ack_count')&&source.includes('admin_ack_count'));
assert.ok(source.includes('dnd_withdrawal_auto_acks_730 a WHERE a.event_id=?'));
const c=readFileSync(new URL('../migrations/canonical/0058_release467_signed_withdrawal_retry_ack_guard.sql',import.meta.url),'utf8');
for(const term of ['trg_dnd_requeue_requires_no_ack_741','trg_dnd_retry_requeue_no_ack_741',
 'dnd_withdrawal_auto_acks_730','dnd_withdrawal_acks_728'])
 assert.ok(c.includes(term),'Missing original D1 atomic guard: '+term);
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
assert.ok(html.includes('privacy741Refresh')&&html.includes('privacy741Results'));
assert.ok(js.includes('/api/admin/privacy-retry-audit-741'));
const routes=readFileSync(new URL('../functions/api/_lib/appModuleRoutes.js',import.meta.url),'utf8');
assert.ok(routes.includes("'/api/admin/privacy-retry-audit-741'"));
console.log('BUILD741 PASS: source-only read, signed Admin/Worker counts, no PII/remote proof, worker-ACK requeue hold and protected I.T. route');
