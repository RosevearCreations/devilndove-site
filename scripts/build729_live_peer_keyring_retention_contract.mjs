import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {BUILD729_PEERS,peerConfig729,verifyPeerChallenge729,digest728,b64url728,
 resolveKeyring728,vaultEncrypt728,vaultDecryptForRotation728} from '../functions/api/_lib/appModuleRoutes.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/production-variable-audit-406.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const random=()=>webcrypto.getRandomValues(new Uint8Array(32));
const secret=random(),hmac=random();
const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=b64url728(new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey)));
const env={DND728_PEER_AI_DATA_PLATFORM_URL:'https://operator.example.com/api/original-peer-challenge',
 DND728_PEER_AI_DATA_PLATFORM_PUBLIC_KEY_B64URL:pub,
 DND728_PEER_AI_DATA_PLATFORM_HMAC_KEY_B64URL:b64url728(hmac),
 DND728_PEER_AI_DATA_PLATFORM_ENROLLMENT_RECEIPT:'signed-source-witness-2026'};
assert.equal(BUILD729_PEERS.length,3);
assert.equal(peerConfig729(env,'ai-data-platform').ready,true);
assert.equal(peerConfig729(env,'rosevear-ai-hub').ready,false);
assert.equal(peerConfig729(env,'arbitrary').ready,false);
assert.equal(peerConfig729({...env,DND728_PEER_AI_DATA_PLATFORM_URL:'http://example.com/internal'},'ai-data-platform').ready,false);
assert.equal(peerConfig729({...env,DND728_PEER_AI_DATA_PLATFORM_URL:'https://127.0.0.1/secret'},'ai-data-platform').ready,false);
assert.equal(peerConfig729({...env,DND728_PEER_AI_DATA_PLATFORM_HMAC_KEY_B64URL:'AA'},'ai-data-platform').ready,false);
assert.equal(peerConfig729({...env,DND728_PEER_AI_DATA_PLATFORM_ENROLLMENT_RECEIPT:'fake'},'ai-data-platform').ready,false);
const now=Date.now(),challenge={schema_id:'rosevear.dnd.peer.enrollment.challenge.v1',
 from_app:'devilndove',to_app:'ai-data-platform',nonce:'a'.repeat(32),
 issued_at:new Date(now-3000).toISOString(),expires_at:new Date(now+120000).toISOString()};
const keys=['schema_id','peer_app','challenge_nonce','challenge_sha256','outcome','issued_at','expires_at'];
const ack={schema_id:'rosevear.dnd.peer.enrollment.ack.v1',peer_app:challenge.to_app,
 challenge_nonce:challenge.nonce,challenge_sha256:await digest728(JSON.stringify(challenge)),
 outcome:'ENROLLED',issued_at:new Date(now-1500).toISOString(),expires_at:new Date(now+60000).toISOString()};
const signature=b64url728(new Uint8Array(await webcrypto.subtle.sign('Ed25519',pair.privateKey,
 new TextEncoder().encode(JSON.stringify(Object.fromEntries(keys.map(k=>[k,ack[k]])))))));
assert.equal((await verifyPeerChallenge729({ack,signature},challenge,pub,now)).verified,true);
for(const changed of [{peer_app:'rosevear-comms-hub'},{challenge_nonce:'b'.repeat(32)},
 {challenge_sha256:'f'.repeat(64)},{outcome:'CONNECTED'},{issued_at:new Date(now-600000).toISOString()},
 {expires_at:new Date(now-1000).toISOString()},{plaintext_customer:'not allowed'}]){
 assert.equal((await verifyPeerChallenge729({ack:{...ack,...changed},signature},challenge,pub,now)).verified,false);
}
assert.equal((await verifyPeerChallenge729({ack,signature:'AA'},challenge,pub,now)).verified,false);
assert.equal((await verifyPeerChallenge729({ack,signature},challenge,b64url728(random()),now)).verified,false);
assert.equal(resolveKeyring728({}).ready,false);
const ring=resolveKeyring728({DND728_ACTIVE_KEY_ID:'b729main',DND728_ACTIVE_KEY_B64URL:b64url728(secret)});
assert.equal(ring.ready,true);
const vaultId='11111111-1111-4111-8111-111111111111',tenant='0'.repeat(64);
const canary=await vaultEncrypt728({verify:'in_memory_only'},secret,'b729main',tenant,'security_evidence',vaultId);
assert.deepEqual(await vaultDecryptForRotation728(canary,secret,tenant,'security_evidence',vaultId),{verify:'in_memory_only'});
const source=readFileSync(new URL('../functions/api/admin/production-variable-audit-406.js',import.meta.url),'utf8');
const page=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
const client=readFileSync(new URL('../public/js/admin-production-variable-audit-v406.js',import.meta.url),'utf8');
for(const n of ['probe_peer_729','verify_keyring_729','dnd_peer_enrollment_proofs_729',
 'HOLD_LIVE_PEER_OFFLINE_OR_PROOF_NOT_RECORDED','CURRENT_LIVE_SIGNED_CHALLENGE_PROOF',
 'signed_withdrawal_acks','retention_reviews','isReview729'])assert.ok(source.includes(n),n);
for(const n of ['privacyOperations729','privacy729Probe','privacy729Submit'])assert.ok(page.includes(n),n);
for(const n of ['review=729','verify_keyring_729','probe_peer_729','retention_execute_728'])assert.ok(client.includes(n),n);
assert.ok(!page.includes('admin-privacy-operations-729.js'));
const ctx={request:new Request('https://devilndove.com/api/admin/production-variable-audit-406?review=729'),
 env:{SESSION_SECRET:'never-echo-729'},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}};
const result=await onRequestGet(ctx),out=await result.json();
assert.equal(result.status,200);assert.equal(out.review729.build,729);
assert.equal(out.review729.schema_ready,false);
assert.equal(out.review729.peers.length,3);
assert.equal(out.review729.keyring.configured,false);
assert.ok(!JSON.stringify(out).includes('never-echo-729'));
assert.equal((await onRequestGet({...ctx,data:{}})).status,401);
assert.equal((await onRequestPost({...ctx,request:new Request(ctx.request.url,{
 method:'POST',headers:{'Origin':'https://evil.example','Content-Type':'application/json'},
 body:JSON.stringify({action:'probe_peer_729',owner_review_confirmed:true,target_app:'ai-data-platform'})})})).status,503);
console.log('Build729 keyring canary, original signed peer challenge forgery/replay/expiry negatives, Admin UI and HOLD boundaries: PASS');
