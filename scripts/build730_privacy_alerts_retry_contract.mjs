import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retryWindow730,privacyAlerts730,BUILD730_POLICY} from '../functions/api/admin/_lib/privacyOperations730.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';
import {onRequestPost as recover730} from '../functions/api/admin/privacy-retry-730.js';
assert.equal(BUILD730_POLICY.automatic_external_delivery_enabled,false);
const now=Date.parse('2026-11-16T19:00:00Z');
const base={created_at:'2026-11-16 18:00:00',now};
assert.equal(retryWindow730({...base,acknowledged:true}).state,'ACKNOWLEDGED');
assert.equal(retryWindow730({...base,attempts:6}).state,'DEAD_LETTER_REVIEW');
assert.equal(retryWindow730({...base,attempts:-1}).due,false);
assert.equal(retryWindow730({...base,attempts:0}).due,true);
assert.equal(retryWindow730({...base,attempts:0,now:Date.parse('2026-11-16T18:01:00Z')}).state,'BACKOFF');
assert.equal(retryWindow730({...base,attempts:2}).state,'DUE_REQUIRES_AUTHORIZED_DELIVERY');
const view={peers:[{peer_app:'ai-data-platform',held:3,aged_one_day:2,aged_seven_days:1,
 state:'HOLD_FRESH_LIVE_SIGNED_PROOF_REQUIRED'},{peer_app:'rosevear-comms-hub',held:1,
 aged_one_day:1,state:'CURRENT_LIVE_SIGNED_CHALLENGE_PROOF'}],
 keyring:{configured:true,latest_ciphertexts_needing_rotation:4}};
const alerts=privacyAlerts730(view,now);
assert.ok(alerts.alerts.some(a=>a.code==='WITHDRAWAL_OVERDUE_7D'));
assert.ok(alerts.alerts.some(a=>a.code==='WITHDRAWAL_RECEIVER_PROOF_HOLD'));
assert.ok(alerts.alerts.some(a=>a.code==='KEY_ROTATION_BACKLOG'));
assert.equal(alerts.external_recall_verified,false);
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=730'),
 env:{SESSION_SECRET:'private-test-secret'},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}};
const res=await onRequestGet(ctx),json=await res.json();
assert.equal(res.status,200);assert.equal(json.review730.build,730);
assert.equal(json.review730.scheduler,'NOT_VERIFIED');
assert.equal(json.review730.retry_attempt_ledger,'NOT_DEPLOYED');
assert.equal(json.review730.policy.automatic_external_delivery_enabled,false);
assert.ok(!JSON.stringify(json).includes('private-test-secret'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
const source=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(source.includes('review730:await review730'));
const recoveryUrl='https://devilndove.com/api/admin/privacy-retry-730';
const recoveryCtx={request:new Request(recoveryUrl,{method:'POST',
 headers:{'Origin':'https://devilndove.com','Content-Type':'application/json'},
 body:JSON.stringify({action:'approve_dead_letter_730',owner_review_confirmed:true,
 event_id:'11111111-1111-4111-8111-111111111111',reason_code:'REVIEWED',review_id:'22222222-2222-4222-8222-222222222222'})}),
 env:{},data:ctx.data};
assert.equal((await recover730({...recoveryCtx,data:{}})).status,401);
assert.equal((await recover730(recoveryCtx)).status,503);
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
for(const id of ['privacyOperations730','privacy730Refresh','privacy730Record','privacy730Approve'])
 assert.ok(html.includes(id),id);
for(const guard of ['review=730','review_dead_letter_730','approve_dead_letter_730'])
 assert.ok(client.includes(guard),guard);
const recoverySrc=readFileSync(new URL('../functions/api/admin/privacy-retry-730.js',import.meta.url),'utf8');
for(const guard of ["HOLD_DISTINCT_ORIGINAL_REVIEW_REQUIRED","HOLD_ORIGINAL_DEAD_LETTER_AND_WITHDRAWAL_REQUIRED",
 "TWO_ADMIN_RECOVERY_REQUEUED_NO_SEND","NOT EXISTS (SELECT 1 FROM dnd_withdrawal_acks_728"])
 assert.ok(recoverySrc.includes(guard),guard);
console.log('Build 730 source-only alerts, retry policy, bounded Admin HOLD and authorization negatives: PASS');
