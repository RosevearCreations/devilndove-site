import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonicalRotationClaim722,verifyIndependentRotationReceipt722,
 reconcileOwnerReviewDrift722,reviewSevenAppHandoff722} from '../functions/api/admin/_lib/projectFinanceEvidence.js';
const {publicKey,privateKey}=generateKeyPairSync('ed25519'),
 rawKey=publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64url'),
 now=Date.UTC(2026,10,15,3,20,0);
const iso=n=>new Date(n).toISOString();
const c={v:1,purpose:'devilndove_independent_issuer_credential_rotation_722',
 provider:'etsy',issuer_id:'independent-owner-enrolled-issuer-722',
 rotation_event_id:'provider-rotation-20261115',
 provider_origin_ref:'issuer-provenance-20261115',
 credential_kind:'client_secret',environment:'production',audience:'devilndove',
 topology_id:'rosevear-master-shell-seven-apps.v1',
 issued_at:iso(now-60000),rotated_at:iso(now-3600000),
 expires_at:iso(now+86400000),nonce:'12345678-1234-4123-8123-123456789abc'};
const authority={issuer_id:c.issuer_id,public_key:rawKey,provider:c.provider,
 distinct_external_issuer_enrolled:true};
const envelope=claim=>({claim,signature:sign(null,
 Buffer.from(JSON.stringify(canonicalRotationClaim722(claim))),privateKey).toString('base64url')});
const valid=await verifyIndependentRotationReceipt722(envelope(c),authority,now);
assert.equal(valid.independent_issuer_signature_verified,true);
assert.equal(valid.deployed_credential_verified,false);
assert.equal(valid.provider_origin_currently_verified,false);
assert.equal(valid.provider_api_called,false);
assert.equal(valid.rotation_performed,false);
assert.equal(valid.status,'EXTERNAL_ISSUER_SIGNATURE_VERIFIED_PROVIDER_LIVE_VALIDITY_HOLD');
assert.equal(valid.rotation_event_id,c.rotation_event_id);
for(const [altered,pin] of [
 [{...c,provider:'paypal'},authority],
 [{...c,audience:'rosevear-ai-hub'},authority],
 [{...c,topology_id:'wrong-topology'},authority],
 [{...c,issued_at:iso(now-1000000)},authority],
 [{...c,issued_at:iso(now+600000)},authority],
 [{...c,expires_at:iso(now-1)},authority],
 [{...c,provider_origin_ref:'bad'},authority],
 [{...c,rotation_event_id:'bad'},authority],
 [{...c,credential_kind:'private_key'},authority],
 [{...c,secret:'MUST_NOT_BE_ACCEPTED'},authority],
 [c,{...authority,distinct_external_issuer_enrolled:false}],
 [c,{...authority,provider:'paypal'}],
 [c,{...authority,public_key:'garbage'}]
]){
 const envelopeToTest=envelope(altered);
 const r=await verifyIndependentRotationReceipt722(envelopeToTest,pin,now);
 assert.equal(r.independent_issuer_signature_verified,false,'Rejected altered signed source '+r.status);
 assert.equal(r.deployed_credential_verified,false);
}
const tampered=envelope(c);tampered.claim={...c,expires_at:iso(now+86400001)};
assert.equal((await verifyIndependentRotationReceipt722(tampered,authority,now)).independent_issuer_signature_verified,false);
const noSignature={claim:c,signature:'not-a-signature'};
assert.equal((await verifyIndependentRotationReceipt722(noSignature,authority,now)).independent_issuer_signature_verified,false);
const original={ready:true,eligible_items:[{renewal_receipt_id:11}],
 receipts:[{receipt_id:31,renewal_receipt_id:11,recorded_at:iso(now-60000),verified_current:true}]};
const ledger=reconcileOwnerReviewDrift722(original,now);
assert.equal(ledger.status,'OWNER_REVIEW_LEDGER_CURRENT_BOOKS_HOLD');
assert.equal(ledger.current_review_count,1);
assert.equal(ledger.owner_financial_close_allowed,false);
assert.equal(reconcileOwnerReviewDrift722({...original,ready:false},now).status,'HOLD_INDEPENDENT_ORIGINAL_SOURCE');
assert.equal(reconcileOwnerReviewDrift722({...original,receipts:[]},now).status,'HOLD_NO_OWNER_REVIEW_RECEIPT');
assert.equal(reconcileOwnerReviewDrift722({...original,receipts:[original.receipts[0],original.receipts[0]]},now).duplicate_review_count,1);
assert.equal(reconcileOwnerReviewDrift722({...original,receipts:[{...original.receipts[0],verified_current:false}]},now).stale_review_count,1);
assert.equal(reconcileOwnerReviewDrift722({...original,receipts:[{...original.receipts[0],recorded_at:iso(now-300000000)}]},now).stale_review_count,1);
assert.equal(reconcileOwnerReviewDrift722({...original,receipts:[{...original.receipts[0],recorded_at:iso(now+3600000)}]},now).invalid_review_count,1);
const controller='b'.repeat(40),handoff={topology_id:'rosevear-master-shell-seven-apps.v1',
 source_app:'devilndove',previous_hop:'yw',next_hop:'rosiedazzlers',
 authority_transfer:false,payload_class:'PUBLIC_SOURCE_METADATA_ONLY',
 tenant_data_included:false,private_credentials_included:false,
 source_main_sha:'a'.repeat(40),controller_main_sha:controller,
 correlation_id:'DND722-OWNER-ORDER-20261115'};
const m=reviewSevenAppHandoff722(handoff,controller);
assert.equal(m.source_metadata_valid,true);
assert.equal(m.cross_app_connected,false);
assert.equal(m.signed_transport_attested,false);
assert.equal(m.data_transfer_performed,false);
assert.equal(m.application_order.length,7);
for(const change of [{authority_transfer:true},{tenant_data_included:true},
 {private_credentials_included:true},{next_hop:'yw'},{source_app:'rosiedazzlers'},
 {payload_class:'TENANT_DATA'},{controller_main_sha:'c'.repeat(40)},
 {source_main_sha:'bad'},{correlation_id:'short'}]){
 assert.equal(reviewSevenAppHandoff722({...handoff,...change},controller).source_metadata_valid,false);
}
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
const api=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
assert.ok(html.includes('dd722-independent-source'));
assert.ok(client.includes('verify_independent_credential_rotation_722'));
assert.ok(api.includes("verifiedAdminFromModule(c)"));
assert.ok(api.includes("'Cache-Control':'private, no-store'"));
assert.ok(api.includes('reconcileOwnerReviewDrift722'));
assert.ok(api.includes('distinct_external_issuer_enrolled:distinct'));
assert.ok(!JSON.stringify(valid).includes('MUST_NOT_BE_ACCEPTED'));
console.log('Build 722 independent Ed25519 receipt verification, drift/replay/age HOLD, 7-app no-connect trust: PASS');
