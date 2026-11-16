import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolveKeyring728,vaultEncrypt728,vaultDecryptForRotation728,
 hmacScope728,retentionEligibility728,verifyLiveWithdrawalAck728,BUILD728_POLICY,b64url728}
 from '../functions/api/_lib/appModuleRoutes.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/production-variable-audit-406.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const key1=webcrypto.getRandomValues(new Uint8Array(32)),key2=webcrypto.getRandomValues(new Uint8Array(32));
const b1=b64url728(key1),b2=b64url728(key2);
assert.equal(resolveKeyring728({}).ready,false);
assert.equal(resolveKeyring728({DND728_ACTIVE_KEY_ID:'k728old',DND728_ACTIVE_KEY_B64URL:b1}).ready,true);
assert.equal(resolveKeyring728({DND728_ACTIVE_KEY_ID:'k728old',DND728_ACTIVE_KEY_B64URL:'AA'}).ready,false);
assert.equal(resolveKeyring728({DND728_ACTIVE_KEY_ID:'k728old',DND728_ACTIVE_KEY_B64URL:b1,
 DND728_PREVIOUS_KEY_ID:'k728old',DND728_PREVIOUS_KEY_B64URL:b1}).ready,false);
const ring=resolveKeyring728({DND728_ACTIVE_KEY_ID:'k728new',DND728_ACTIVE_KEY_B64URL:b2,
 DND728_PREVIOUS_KEY_ID:'k728old',DND728_PREVIOUS_KEY_B64URL:b1});
assert.equal(ring.ready,true);
const id='11111111-1111-4111-8111-111111111111',tenant='f'.repeat(64);
const secret={review:'private original',status:'withdrawn'};
const old=await vaultEncrypt728(secret,key1,'k728old',tenant,'consent_withdrawal',id,1);
assert.equal(old.ciphertext_sha256.length,64);
assert.ok(!JSON.stringify(old).includes('private original'));
const opened=await vaultDecryptForRotation728(old,key1,tenant,'consent_withdrawal',id);
assert.deepEqual(opened,secret);
const rotated=await vaultEncrypt728(opened,key2,'k728new',tenant,'consent_withdrawal',id,2);
assert.notEqual(rotated.ciphertext_sha256,old.ciphertext_sha256);
await assert.rejects(vaultDecryptForRotation728(old,key1,'a'.repeat(64),'consent_withdrawal',id));
await assert.rejects(vaultDecryptForRotation728({...old,ciphertext_sha256:'0'.repeat(64)},key1,tenant,'consent_withdrawal',id));
await assert.rejects(vaultDecryptForRotation728(old,key2,tenant,'consent_withdrawal',id));
await assert.rejects(vaultEncrypt728({card:'private'},new Uint8Array(6),'k728old',tenant,'consent_withdrawal',id));
const scope1=await hmacScope728(b1,'devilndove:consent-120:peer1');
const scope2=await hmacScope728(b1,'devilndove:consent-121:peer1');
assert.equal(scope1.length,64);
assert.notEqual(scope1,scope2);
await assert.rejects(hmacScope728('AA','original consent'));
const eligible={created_at:'2026-08-01 12:00:00',retention_days:30,legal_hold:0};
const latest={ciphertext_sha256:old.ciphertext_sha256};
const now=Date.UTC(2026,10,16);
assert.equal(retentionEligibility728(eligible,null,latest,now),'ELIGIBLE_FOR_INDEPENDENT_REVIEW');
assert.equal(retentionEligibility728({...eligible,legal_hold:1},null,latest,now),'HOLD_LEGAL_HOLD');
assert.equal(retentionEligibility728({...eligible,retention_days:300},null,latest,now),'HOLD_RETENTION_NOT_ELAPSED');
assert.equal(retentionEligibility728(eligible,{source_ciphertext_sha256:'0'.repeat(64)},latest,now),'HOLD_CIPHER_VERSION_DRIFT');
const kp=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=b64url728(new Uint8Array(await webcrypto.subtle.exportKey('raw',kp.publicKey)));
const event={event_id:id,target_app:'ai-data-platform',request_nonce:'0'.repeat(32),scope_hmac_sha256:scope1};
const ack={schema_id:'rosevear.dnd.consent.withdrawal.ack.v1',event_id:id,target_app:'ai-data-platform',
 request_nonce:event.request_nonce,scope_hmac_sha256:scope1,outcome:'RECEIVED',
 issued_at:new Date(now-1000).toISOString(),expires_at:new Date(now+30000).toISOString()};
const signed=b64url728(new Uint8Array(await webcrypto.subtle.sign('Ed25519',kp.privateKey,new TextEncoder().encode(JSON.stringify(ack)))));
assert.equal((await verifyLiveWithdrawalAck728({ack,signature:signed},event,pub,now)).verified,true);
for(const change of [{target_app:'rosevear-ai-hub'},{scope_hmac_sha256:'f'.repeat(64)},
 {outcome:'DELETED'},{issued_at:new Date(now-400000).toISOString()},
 {expires_at:new Date(now-1000).toISOString()},{raw_customer:'not allowed'}]){
 assert.equal((await verifyLiveWithdrawalAck728({ack:{...ack,...change},signature:signed},event,pub,now)).verified,false);
}
assert.equal((await verifyLiveWithdrawalAck728({ack,signature:b64url728(new Uint8Array(64))},event,pub,now)).verified,false);
assert.equal(BUILD728_POLICY.automated_purge,false);
const admin=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
const consent=readFileSync(new URL('../functions/api/admin/media-consent-records.js',import.meta.url),'utf8');
for(const action of ['vault_store_728','vault_rotate_728','retention_prepare_728',
 'retention_approve_728','retention_execute_728','dispatch_withdrawal_728'])assert.ok(admin.includes(action));
for(const name of ['dnd_evidence_vault_728','dnd_evidence_purge_receipts_728','dnd_withdrawal_acks_728',
 'owner_review_confirmed','HOLD_THIRD_DISTINCT_EXECUTOR','verifyLiveWithdrawalAck728'])assert.ok(admin.includes(name));
assert.ok(consent.includes('enqueue_withdrawal_728'));
assert.ok(consent.includes('LOCAL_D1_WITHDRAWAL_OUTBOX_HELD'));
assert.ok(!admin.includes("DND728_ACTIVE_KEY_B64URL='+"));
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=728'),
 env:{SESSION_SECRET:'do-not-echo-build728'},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}};
const result=await onRequestGet(ctx);const out=await result.json();
assert.equal(result.status,200);
assert.equal(out.review728.policy.build,728);
assert.equal(out.review728.schema_ready,false);
assert.equal(out.review728.active_key_present,false);
assert.equal(out.review728.live_signed_peer_receipts,null);
assert.ok(!JSON.stringify(out).includes('do-not-echo-build728'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
const posted=await onRequestPost({...ctx,request:new Request(ctx.request.url,{method:'POST',
 headers:{'Origin':'https://evil.example'},body:JSON.stringify({action:'vault_store_728',owner_review_confirmed:true})})});
assert.equal(posted.status,503); // missing D1 blocks before any write
console.log('Build728 encrypted vault, rotation, signed ACK, retention, admin and negative source policy: PASS');
