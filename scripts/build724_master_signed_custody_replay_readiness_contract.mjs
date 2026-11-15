import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {masterEnvelopeFields724,custodyRotationFields724,
 canonicalMasterEnvelope724,canonicalCustodyRotation724,
 verifyMasterEnvelope724,verifyKeyCustodyRotation724,
 recordMasterReplayReview724,masterTrustStatus724} from '../functions/api/admin/_lib/projectFinanceEvidence.js';
import {onRequestGet} from '../functions/api/admin/production-variable-audit-406.js';
const make=()=>{const {publicKey,privateKey}=generateKeyPairSync('ed25519');
 return {privateKey,publicKey:publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64url')}};
const old=make(),reviewer=make(),next=make();
const fixed=Date.UTC(2026,10,15,20,0,0),iso=n=>new Date(n).toISOString();
const sourceSha='a'.repeat(40);
const pin={source_app:'ai-data-platform',issuer_id:'original-ai-master-724',
 key_id:'master-key-2026-11',source_main_sha:sourceSha,public_key:old.publicKey,
 reviewer_id:'independent-reviewer-724',reviewer_public_key:reviewer.publicKey,
 owner_independent_signer_enrolled:true,independent_reviewer_enrolled:true,revoked:false};
const claim={v:1,schema:'rosevear.dnd.master.readonly-envelope.v1',
 topology_id:'rosevear-master-shell-seven-apps.v1',source_app:'ai-data-platform',
 destination_app:'devilndove',audience:'devilndove:health-security:source-only',
 environment:'TEST',method:'GET',path:'/api/integration/v1/health',
 channel:'HEALTH_EVIDENCE',issuer_id:pin.issuer_id,key_id:pin.key_id,
 issued_at:iso(fixed-30000),expires_at:iso(fixed+60000),
 nonce:'a'.repeat(32),body_sha256:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 source_main_sha:sourceSha};
const signed=(c,keys=old)=>({claim:c,signature:sign(null,
 Buffer.from(JSON.stringify(canonicalMasterEnvelope724(c))),keys.privateKey).toString('base64url')});
const envelope=signed(claim);
assert.deepEqual(Object.keys(canonicalMasterEnvelope724(claim)),masterEnvelopeFields724);
const source=await verifyMasterEnvelope724(envelope,pin,fixed);
assert.equal(source.signature_verified,true);
assert.equal(source.service_to_service_accepted,false);
assert.equal(source.cryptographic_transport_connected,false);
assert.equal(source.master_t4_authorized,false);
assert.equal(source.receiver_t5_activated,false);
for(const change of [
 {source_app:'rosiedazzlers'},{destination_app:'rosiedazzlers'},
 {audience:'devilndove:owner-command'},{environment:'production'},
 {method:'POST'},{path:'/api/admin/social-post-queue'},
 {channel:'OWNER_GATED_COMMAND'},{body_sha256:'f'.repeat(64)},
 {topology_id:'other-topology'},{issued_at:iso(fixed-400000)},
 {issued_at:iso(fixed+60000)},{expires_at:iso(fixed-1)},
 {source_main_sha:'b'.repeat(40)},{nonce:'bad'},
 {body:'sensitive-full-payload-forbidden'}
]){
 const result=await verifyMasterEnvelope724(signed({...claim,...change}),pin,fixed);
 assert.equal(result.signature_verified,false,'Must reject changed scope '+JSON.stringify(change)+' '+result.status);
 assert.equal(result.service_to_service_accepted,false);
}
assert.equal((await verifyMasterEnvelope724(signed(claim,next),pin,fixed)).signature_verified,false);
for(const changedPin of [
 {...pin,revoked:true},{...pin,source_app:'rosevear-ai-hub'},
 {...pin,owner_independent_signer_enrolled:false},
 {...pin,key_id:'old-key'},{...pin,source_main_sha:'b'.repeat(40)},
 {...pin,public_key:reviewer.publicKey}
])assert.equal((await verifyMasterEnvelope724(envelope,changedPin,fixed)).signature_verified,false);
const rot={v:1,schema:'rosevear.dnd.master.key-rotation.v1',
 topology_id:'rosevear-master-shell-seven-apps.v1',source_app:pin.source_app,
 destination_app:'devilndove',old_issuer_id:pin.issuer_id,old_key_id:pin.key_id,
 new_key_id:'master-key-2026-12',new_public_key:next.publicKey,
 rotation_event_ref:'master-independent-custody-rotation-20261115',
 reviewer_id:pin.reviewer_id,issued_at:iso(fixed-30000),
 expires_at:iso(fixed+60000),nonce:'b'.repeat(32)};
const signRotation=(value,keyA=old,keyB=reviewer)=>({
 claim:value,
 old_signature:sign(null,Buffer.from(JSON.stringify(canonicalCustodyRotation724(value))),keyA.privateKey).toString('base64url'),
 reviewer_signature:sign(null,Buffer.from(JSON.stringify(canonicalCustodyRotation724(value))),keyB.privateKey).toString('base64url')
});
const rotation=signRotation(rot);
assert.deepEqual(Object.keys(canonicalCustodyRotation724(rot)),custodyRotationFields724);
const rr=await verifyKeyCustodyRotation724(rotation,pin,fixed);
assert.equal(rr.signature_verified,true);
assert.equal(rr.dual_independent_signatures_verified,true);
assert.equal(rr.new_key_automatically_enrolled,false);
assert.equal(rr.receiver_t5_activated,false);
for(const change of [
 {source_app:'yw'},{new_public_key:old.publicKey},
 {new_key_id:pin.key_id},{reviewer_id:pin.issuer_id},
 {rotation_event_ref:'short'},{issued_at:iso(fixed-400000)},
 {expires_at:iso(fixed-1)},{destination_app:'rosiedazzlers'},
 {extra_secret:'DO_NOT_ADMIT'}
]){
 const r=await verifyKeyCustodyRotation724(signRotation({...rot,...change}),pin,fixed);
 assert.equal(r.signature_verified,false,'Invalid custody change '+JSON.stringify(change));
}
assert.equal((await verifyKeyCustodyRotation724(signRotation(rot,old,next),pin,fixed)).signature_verified,false);
assert.equal((await verifyKeyCustodyRotation724(rotation,{...pin,reviewer_public_key:old.publicKey},fixed)).signature_verified,false);
assert.equal((await verifyKeyCustodyRotation724(rotation,{...pin,independent_reviewer_enrolled:false},fixed)).signature_verified,false);
assert.equal((await verifyKeyCustodyRotation724(rotation,{...pin,revoked:true},fixed)).signature_verified,false);
const ledger=new Map();
const fakeDb={prepare(sql){
 return {bind(...args){
  return {
   async run(){
    assert.ok(sql.includes("WHERE NOT EXISTS"));
    assert.ok(sql.includes("admin_action_audit"));
    const digest=args[1];
    if(ledger.has(digest))return {success:true,meta:{changes:0}};
    ledger.set(digest,{id:ledger.size+1,digest,details:JSON.parse(args[2])});
    return {success:true,meta:{changes:1}};
   },
   async first(){
    const match=ledger.get(args[0]);return match?{n:1,first_id:match.id}:{n:0,first_id:null};
   }
  };
 }};
}};
const actor={user_id:77};
const first=await recordMasterReplayReview724(fakeDb,actor,source,rr);
assert.equal(first.durable_review_receipt,true);
assert.equal(first.receipt_id,1);
assert.equal(first.db_unique_replay_constraint,false);
assert.equal(first.service_to_service_accepted,false);
assert.equal(first.master_t4_authorized,false);
assert.equal(first.receiver_t5_activated,false);
const second=await recordMasterReplayReview724(fakeDb,actor,source,rr);
assert.equal(second.durable_review_receipt,false);
assert.equal(second.receipt_id,null);
assert.match(second.status,/REPLAY/);
assert.equal(ledger.size,1);
assert.equal(ledger.values().next().value.details.runtime_handshake,false);
assert.equal((await recordMasterReplayReview724(null,actor,source,rr)).durable_review_receipt,false);
assert.equal((await recordMasterReplayReview724(fakeDb,actor,{signature_verified:false},rr)).durable_review_receipt,false);
assert.equal((await recordMasterReplayReview724(fakeDb,actor,source,{...rr,old_key_id:'wrong'})).durable_review_receipt,false);
const ready=masterTrustStatus724({DND724_MASTER_SOURCE_APP:'ai-data-platform',
 DND724_MASTER_PUBLIC_KEY:'do-not-echo-raw-source-key-724',
 DND724_CUSTODY_REVIEWER_PUBLIC_KEY:'do-not-echo-raw-custody-key-724'});
assert.equal(ready.actual_seven_app_connected,false);
assert.equal(ready.d1_replay_receipt_uniqueness_enforced,false);
assert.equal(ready.zero_trust_service_route_enabled,false);
assert.equal(ready.source_pin_names_present.includes('DND724_MASTER_PUBLIC_KEY'),true);
assert.ok(!JSON.stringify(ready).includes('do-not-echo-raw-source-key-724'));
const admin={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=724'),
 env:{SESSION_SECRET:'NEVER_REVEAL_A_REAL_SECRET_724',DND724_MASTER_SOURCE_APP:'ai-data-platform'},
 data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:77}}}};
const response=await onRequestGet(admin);
assert.equal(response.status,200);
assert.equal(response.headers.get('Cache-Control'),'no-store');
const j=await response.json();assert.equal(j.review724.trust.build,724);
assert.equal(j.review724.external_vercel_deploy_triggered,false);
assert.equal(j.review724.master_connected,false);
assert.equal(j.review724.unique_d1_replay_constraint_verified,false);
assert.equal(j.review724.shell_iCamp_or_YW_modified,false);
assert.ok(!JSON.stringify(j).includes('NEVER_REVEAL_A_REAL_SECRET_724'));
assert.equal((await onRequestGet({...admin,data:{}})).status,401);
assert.equal((await onRequestGet({...admin,data:{ddModuleAccess:{allowed:true,user:{role:'customer',is_active:1,user_id:77}}}})).status,401);
const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
const api=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
const contract=JSON.parse(readFileSync(new URL('../.github/rosevear-master-communications.v1.json',import.meta.url),'utf8'));
assert.equal(contract.appId,'devilndove');
assert.equal(contract.authentication.signedRequestsRequired,true);
assert.equal(contract.transport.rawSecretsAllowed,false);
assert.equal(contract.transport.directPeerDatabaseWrites,false);
assert.equal(contract.transport.t5Allowed,false);
assert.equal(contract.runtimeConnectedNotInferred,true);
assert.ok(html.includes('dd724-master-trust-readiness'));
assert.ok(client.includes('review=724'));
assert.ok(api.includes("action==='review_signed_master_source_724'"));
assert.ok(api.includes('verifiedAdminFromModule(c)'));
assert.ok(api.includes("source_signature_verified:source.signature_verified===true"));
console.log('Build 724 dual Ed25519 issuer/custody, wrong Master/tenant scope, sequential D1 replay HOLD, no live transport: PASS');
