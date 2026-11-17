import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessPrivacyGovernance732} from '../functions/api/admin/_lib/privacyOperations730.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';
const now=Date.parse('2026-11-17T12:00:00Z');
const tick={tick_id:'11111111-1111-4111-8111-111111111111',created_at:'2026-11-17 11:50:00',
 tick_state:'RUN',considered_events:2,signed_ack_count:1,held_events:1};
const rotation={active_key_id:'original-active-key',current_old_key_versions:0,historical_old_key_references:3};
const ev={event_id:'22222222-2222-4222-8222-222222222222',target_app:'ai-data-platform',
 created_at:'2026-11-09 10:00:00',state:'DEAD_LETTER',manual_receipt:0,service_receipt:0,
 consent_withdrawn:1};
const view=assessPrivacyGovernance732({events:[ev],scheduleReceipts:[tick],rotation,now,complete:true});
assert.equal(view.automation_recovery,'ORIGINAL_D1_TICK_EVIDENCE_OBSERVED');
assert.ok(view.privacy_sla_escalations.some(x=>x.code==='CRITICAL_PRIVACY_SLA_ESCALATION'));
assert.equal(view.cross_application_compliance.find(x=>x.peer_app==='ai-data-platform').dead_letter,1);
assert.equal(view.key_custody.status,'HOLD_HISTORICAL_KEY_REFERENCES_RETAINED');
assert.equal(view.key_custody.old_key_retirement_authorized,false);
assert.equal(view.cross_application_delivery_or_remote_erasure_proven,false);
assert.equal(view.cross_application_compliance.length,3);
const stale=assessPrivacyGovernance732({events:[],scheduleReceipts:[],rotation,now,complete:true});
assert.equal(stale.automation_recovery,'HOLD_SCHEDULER_RECOVERY_NOT_VERIFIED');
const impossible=assessPrivacyGovernance732({events:[],scheduleReceipts:[{...tick,
 considered_events:1,signed_ack_count:2,held_events:1}],rotation,now,complete:true});
assert.equal(impossible.automation_recovery,'HOLD_SCHEDULER_RECOVERY_NOT_VERIFIED');
const badReceipt=assessPrivacyGovernance732({events:[{...ev,state:'ACKED',
 manual_receipt:1,manual_signature_verified:1,manual_target:'rosevear-ai-hub'}],
 scheduleReceipts:[tick],rotation,now,complete:true});
assert.equal(badReceipt.cross_application_compliance[0].conflicting_ack,1);
const incomplete=assessPrivacyGovernance732({events:[ev],scheduleReceipts:[tick],
 rotation,now,complete:false});
assert.equal(incomplete.cross_application_compliance[0].compliance_state,'HOLD_QUEUE_SAMPLE_INCOMPLETE');
const noKey=assessPrivacyGovernance732({events:[],scheduleReceipts:[tick],rotation:null,
 now,complete:true});
assert.equal(noKey.key_custody.status,'HOLD_KEY_CUSTODY_PROOF_INCOMPLETE');
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=732'),
 env:{SESSION_SECRET:'sensitive-secret-732'},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}};
const response=await onRequestGet(ctx),body=await response.json();
assert.equal(response.status,200);
assert.equal(body.review732.state,'HOLD_ORIGINAL_D1_UNAVAILABLE');
assert.ok(!JSON.stringify(body).includes('sensitive-secret-732'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
const api=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(api.includes('isReview732?{review732:await review732'));
console.log('Build 732 SLA, recovery, ACK mismatch, rotation key-custody and protected Admin HOLD tests: PASS');
