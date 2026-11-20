import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/privacy-sender-ceremony-740.js';
import worker,{runPrivacyTick730} from '../workers/privacy-automation-730.mjs';
const root='https://devilndove.com';
const route=root+'/api/admin/privacy-sender-ceremony-740';
const admin={ddModuleAccess:{allowed:true,user:{user_id:7,is_active:1,role:'admin'}}};
const make=(body,headers={})=>new Request(route,{method:'POST',
 headers:{'Origin':root,'Sec-Fetch-Site':'same-origin','Content-Type':'application/json',...headers},
 body:JSON.stringify(body)});
assert.equal((await onRequestGet({request:new Request(route),env:{},data:{}})).status,401);
assert.equal((await onRequestGet({request:new Request(route),env:{},data:admin})).status,503);
let queries=0,fetchCalls=0,writeCalls=0;
const db={prepare(sql){
 assert.ok(sql.trim().startsWith('SELECT'),'Privacy preflight may only read source D1');
 queries++;
 return {bind(){return this},async first(){return {manual:0,automatic:0,queued:0}},
  async run(){writeCalls++;throw Error('NO SOURCE WRITES')},
  async all(){throw Error('Unexpected all')}};
}};
const savedFetch=globalThis.fetch;
globalThis.fetch=async()=>{fetchCalls++;throw Error('NEVER EXTERNAL CALL')};
try{
 const c={request:new Request(route),env:{DB:db},data:admin};
 const got=await onRequestGet(c);
 assert.equal(got.status,200);
 const j=await got.json();
 assert.equal(j.build,740);
 assert.equal(j.status,'HOLD_EXTERNAL_INDEPENDENT_PROOF');
 assert.equal(j.peers.length,3);
 assert.equal(j.required_gates.length,6);
 assert.equal(j.local_source_proofs_complete,false);
 assert.equal(j.sender_activation_authorized,false);
 assert.equal(j.independent_receiver_owner_attested,false);
 assert.equal(j.original_owner_activation_recorded,false);
 assert.equal(j.worker_switch_changed,false);
 assert.equal(j.ready_to_dispatch,false);
 assert.equal(j.customer_or_privacy_message_sent,false);
 assert.equal(j.external_calls,0);
 assert.equal(j.db_mutations,0);
 assert.equal(j.personal_data_returned,false);
 assert.ok(j.required_gates.every(g=>g.verified===false));
 assert.equal(queries,3);

 const activate={action:'activate',owner_review_confirmed:true,scope:'CONSENT_WITHDRAWAL_ONLY',
  reason_code:'ORIGINAL_OWNER_UNVERIFIED',sender_enabled:true,receiver_attested:true};
 const denied=await onRequestPost({...c,request:make(activate)});
 assert.equal(denied.status,409);
 assert.equal((await denied.json()).sender_activation_authorized,false);
 const cross=await onRequestPost({...c,request:make(activate,{Origin:'https://evil.invalid'})});
 assert.equal(cross.status,403);
 assert.equal((await onRequestPost({...c,request:make([])})).status,400);
 assert.equal((await onRequestPost({...c,request:make({action:'prepare_owner_review_740',
  scope:'CONSENT_WITHDRAWAL_ONLY',reason_code:'ORIGINAL_OWNER_UNVERIFIED'})})).status,409);
 const result=await onRequestPost({...c,request:make({action:'prepare_owner_review_740',
  scope:'CONSENT_WITHDRAWAL_ONLY',reason_code:'ORIGINAL_OWNER_UNVERIFIED',owner_review_confirmed:true,
  independent_approval_received:true,worker_enable:true,original_receipt:'x'.repeat(64)})});
 assert.equal(result.status,200);
 const preview=await result.json();
 assert.equal(preview.code,'OWNER_REVIEW_PACKET_PREPARED_NOT_ACTIVATED');
 assert.equal(preview.approval_record_saved,false);
 assert.equal(preview.sender_activation_authorized,false);
 assert.equal(preview.all_live_transport_disallowed,true);
 assert.equal(preview.required_gates.some(x=>x.gate==='SIGNED_ORIGINAL_REMOTE_ACK_AND_REPLAY_PROOF'&&!x.verified),true);
 assert.equal(queries,6);
 assert.equal(fetchCalls,0);assert.equal(writeCalls,0);
}finally{globalThis.fetch=savedFetch}

// Worker fail-closed even if someone mistakenly flips the old Build 730 flag.
const poison={prepare(){throw Error('Worker accessed original D1 without authority')}};
const service='source-original-worker-740';
const base={DB:poison,DND730_SERVICE_ID:service,DND730_AUTOMATION_ENABLED:'true'};
for(const props of [
 {},
 {DND740_OWNER_ACTIVATION_CONFIRMED:'true'},
 {DND740_OWNER_ACTIVATION_CONFIRMED:'true',DND740_APPROVED_SCOPE:'CONSENT_WITHDRAWAL_ONLY'},
 {DND740_OWNER_ACTIVATION_CONFIRMED:'true',DND740_APPROVED_SCOPE:'CONSENT_WITHDRAWAL_ONLY',
  DND740_INDEPENDENT_WITNESS_SHA256:'BAD'},
]){
 const r=await runPrivacyTick730({...base,...props});
 assert.equal(r.status,'HOLD_DISABLED_OR_UNPROVISIONED');
 assert.equal(r.considered,0);
}
let dbReads=0;
const missingProof={prepare(sql){dbReads++;return {bind(){return this},
 async first(){return null}}}};
const armed=await runPrivacyTick730({...base,DB:missingProof,
 DND740_OWNER_ACTIVATION_CONFIRMED:'true',DND740_APPROVED_SCOPE:'CONSENT_WITHDRAWAL_ONLY',
 DND740_INDEPENDENT_WITNESS_SHA256:'a'.repeat(64)});
assert.equal(armed.status,'HOLD_THREE_MASTER_SOURCE_PROOF_INCOMPLETE');
assert.equal(dbReads,0,'Missing configured original peer must block before touching source D1');
assert.equal((await worker.fetch(new Request(root))).status,404);

const workerSource=readFileSync(new URL('../workers/privacy-automation-730.mjs',import.meta.url),'utf8');
for(const gate of ['DND740_OWNER_ACTIVATION_CONFIRMED','DND740_APPROVED_SCOPE',
 'DND740_INDEPENDENT_WITNESS_SHA256','signature_verified','observed_live_response',
 'HOLD_THREE_MASTER_SOURCE_PROOF_INCOMPLETE','for(const target of known)'])
 assert.ok(workerSource.includes(gate),'Worker gate missing '+gate);
const config=readFileSync(new URL('../wrangler.privacy730.toml',import.meta.url),'utf8');
assert.equal((config.match(/DND740_OWNER_ACTIVATION_CONFIRMED = "false"/g)||[]).length,2);
assert.equal((config.match(/DND740_APPROVED_SCOPE = "NONE"/g)||[]).length,2);
const map=readFileSync(new URL('../functions/api/_lib/appModuleRoutes.js',import.meta.url),'utf8');
assert.ok(map.includes("'/api/admin/privacy-sender-ceremony-740'"),'Verified module middleware required');
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/js/admin-privacy-sender-740.js',import.meta.url),'utf8');
for(const id of ['privacy740Refresh','privacy740OwnerReview','privacy740Prepare',
 'privacy740Reason','privacy740Status'])assert.ok(html.includes(id)&&js.includes(id),id);
assert.ok(html.includes('/public/js/admin-privacy-sender-740.js'));
assert.ok(js.includes('prepare_owner_review_740')&&js.includes('window.confirm'));
console.log('BUILD740 PASS: Admin-only source read, no external calls or D1 writes, spoofed activation refusal, dual Worker arm/proof gates, preserved OFF config');
