import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retryWindow730,privacyAlerts730,BUILD730_POLICY} from '../functions/api/admin/_lib/privacyOperations730.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';
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
assert.equal(json.review730.scheduler,'NOT_DEPLOYED');
assert.equal(json.review730.retry_attempt_ledger,'NOT_DEPLOYED');
assert.equal(json.review730.policy.automatic_external_delivery_enabled,false);
assert.ok(!JSON.stringify(json).includes('private-test-secret'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
const source=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(source.includes('review730:await review730'));
console.log('Build 730 source-only alerts, retry policy, bounded Admin HOLD and authorization negatives: PASS');
