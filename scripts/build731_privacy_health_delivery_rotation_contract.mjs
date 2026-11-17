import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessPrivacyHealth731} from '../functions/api/admin/_lib/privacyOperations730.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';
const now=Date.parse('2026-11-16T20:00:00Z');
const tick={created_at:'2026-11-16 19:50:00',tick_state:'RUN'};
const rotation={keyring_ready:true,active_key_id:'active731',old_key_latest_versions:0,old_key_history_versions:2};
const ev={event_id:'11111111-1111-4111-8111-111111111111',target_app:'ai-data-platform',
 created_at:'2026-11-14 19:00:00',state:'READY',manual_receipt:0,service_receipt:0,
 consent_withdrawn:1};
const good=assessPrivacyHealth731({tick,events:[ev],rotation,schema_ready:true,now});
assert.equal(good.scheduler_health,'SCHEDULE_HEARTBEAT_OBSERVED');
assert.equal(good.counters.overdue_24h,1);
assert.equal(good.rotation.state,'CURRENT_VERSIONS_ROTATED_OLD_KEYS_STILL_REFERENCED');
assert.equal(good.rotation.old_key_retirement_authorized,false);
assert.equal(good.full_queue_sla_certified,false);
const stale=assessPrivacyHealth731({tick:{...tick,created_at:'2026-11-16 18:00:00'},events:[],rotation,schema_ready:true,now});
assert.equal(stale.scheduler_health,'HOLD_HEARTBEAT_MISSING_OR_STALE');
assert.equal(assessPrivacyHealth731({schema_ready:false}).scheduler_health,'HOLD_SCHEMA_MISSING');
assert.equal(assessPrivacyHealth731({tick,events:[],rotation:{},schema_ready:true,now}).rotation.state,'HOLD_ROTATION_EVIDENCE_INCOMPLETE');
const duplicate=assessPrivacyHealth731({tick,events:[{...ev,state:'ACKED',manual_receipt:1,service_receipt:1,
 manual_signature_verified:1,service_signature_verified:1,ack_target:ev.target_app}],rotation,schema_ready:true,now});
assert.equal(duplicate.counters.unverified_receipts,1);
assert.ok(duplicate.alerts.some(x=>x.code==='HOLD_SIGNED_DELIVERY_CONSISTENCY'));
const wrongConsent=assessPrivacyHealth731({tick,events:[{...ev,manual_receipt:1,
 manual_signature_verified:1,ack_target:ev.target_app,consent_withdrawn:0}],rotation,schema_ready:true,now});
assert.equal(wrongConsent.counters.unverified_receipts,1);
const genuine=assessPrivacyHealth731({tick,events:[{...ev,state:'ACKED',service_receipt:1,
 service_signature_verified:1,ack_target:ev.target_app}],rotation,schema_ready:true,now});
assert.equal(genuine.counters.signed_receipts,1);
assert.equal(genuine.external_data_removed_verified,false);
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=731'),
 env:{SESSION_SECRET:'private-731'},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}};
const r=await onRequestGet(ctx),body=await r.json();
assert.equal(r.status,200);
assert.equal(body.review731.state,'HOLD_ORIGINAL_D1_UNAVAILABLE');
assert.ok(!JSON.stringify(body).includes('private-731'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
const api=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(api.includes('isReview731?{review731:await review731'));
console.log('Build 731 health SLA signed ACK consistency, rotation key-retirement HOLD and protected readback: PASS');
