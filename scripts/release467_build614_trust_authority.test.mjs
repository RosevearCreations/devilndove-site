import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {FORMAT_614,HOLD_614,canonical614,authorityCandidate614,sha256,
  verifyProofs614,ledgerHash614,trustedPins614} from '../functions/api/_lib/trustAuthority614.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-authority-614.js';

const now='2026-11-06T12:00:00.000Z';
const base={format:FORMAT_614,case_pin:'dd596-case:original-614',channel:'ETSY',
  account_id:'shop-614',product_ref:'sku-614',action:'CREATE_DRAFT',
  source_sha256:'a'.repeat(64),issued_at:'2026-11-06T11:55:00.000Z',
  expires_at:'2026-11-06T13:00:00.000Z'};
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const b64=buffer=>Buffer.from(buffer).toString('base64url');
async function fixtures() {
  const roots={},pins={},pairs={},proofMap={};
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const id='original-'+role.toLowerCase()+'-614';
    const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const key=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
    const public_key=b64(key);
    const key_sha256=Buffer.from(await webcrypto.subtle.digest('SHA-256',key)).toString('hex');
    roots[id]={authority_id:id,role,public_key,key_sha256,status:'ACTIVE_EXTERNAL_VERIFIED'};
    pins[id]=key_sha256;
    pairs[role]=pair;
  }
  for(const role of ['OWNER','ISSUER','WITNESS']){
    const id='original-'+role.toLowerCase()+'-614';
    const payload={...base,role,decision:role==='OWNER'?'APPROVE':'ATTEST',
      owner_proof_sha256:role==='WITNESS'?await sha256(
        canonical614(proofMap.OWNER.payload)+'.'+proofMap.OWNER.signature,webcrypto):'',
      nonce:'unique-'+role.toLowerCase()+'-nonce-614001'};
    const sig=await webcrypto.subtle.sign('Ed25519',pairs[role].privateKey,
      new TextEncoder().encode(canonical614(payload)));
    proofMap[role]={authority_id:id,payload,signature:b64(sig)};
  }
  return {roots,pins,proofs:['ISSUER','WITNESS','OWNER'].map(r=>proofMap[r])};
}
test('Build 614 verifies actual Ed25519 issuer, independent witness and exact owner signatures',async()=>{
  const {roots,pins,proofs}=await fixtures();
  const checked=await verifyProofs614(proofs,id=>roots[id],pins,now,webcrypto);
  assert.equal(checked.cryptographic_signatures_verified,true);
  assert.equal(checked.owner_decision,'APPROVE');
  assert.equal(checked.scope.account_id,'shop-614');
  assert.equal(checked.original_provider_readback_verified,false);
  assert.equal(checked.provider_action_authorized,false);
  assert.equal(checked.release_gate,HOLD_614);
  const hash=await ledgerHash614('0'.repeat(64),{...checked.scope,owner_decision:'APPROVE'},webcrypto);
  assert.match(hash,/^[0-9a-f]{64}$/);
  assert.notEqual(hash,await ledgerHash614('0'.repeat(64),
    {...checked.scope,owner_decision:'DECLINE'},webcrypto));
});
test('Build 614 forbids arbitrary key enrollment as authority and fails on tampering or replay',async()=>{
  const {roots,pins,proofs}=await fixtures();
  const check=p=>verifyProofs614(p,id=>roots[id],pins,now,webcrypto);
  await assert.rejects(check(proofs.map((p,i)=>i===0?{
    ...p,payload:{...p.payload,product_ref:'another-sku'}}:p)));
  await assert.rejects(check(proofs.map((p,i)=>i===1?{
    ...p,signature:'A'.repeat(86)}:p)));
  await assert.rejects(check(proofs.map((p,i)=>i===1?{
    ...p,payload:{...p.payload,owner_proof_sha256:'b'.repeat(64)}}:p)));
  await assert.rejects(check([proofs[0],proofs[0],proofs[2]]));
  await assert.rejects(verifyProofs614(proofs,id=>({...roots[id],status:'PENDING_EXTERNAL_VERIFICATION'}),
    pins,now,webcrypto));
  await assert.rejects(verifyProofs614(proofs,id=>roots[id],{},now,webcrypto));
  await assert.rejects(verifyProofs614(proofs,id=>roots[id],pins,
    '2026-11-06T14:00:00.000Z',webcrypto));
  assert.throws(()=>canonical614({...proofs[2].payload,provider_write_authorized:true}));
  assert.throws(()=>authorityCandidate614({authority_id:'attacker-id',role:'ISSUER',
    public_key:roots[proofs[0].authority_id].public_key,
    original_source_ref:'http://untrusted.invalid',
    independent_review_ref:'reviewer-614'}));
  assert.deepEqual(trustedPins614({}),{});
  assert.throws(()=>trustedPins614({DND_614_VERIFIED_PUBLIC_KEY_PINS:'{"bad":"yes"}'}));
});
test('Build 614 endpoint is authenticated, migration-gated, no provider execution',async()=>{
  const request=new Request('https://devilndove.com/api/admin/trust-authority-614');
  assert.equal((await onRequestGet({request,env:{}})).status,401);
  assert.equal((await onRequestPost({request,env:{}})).status,401);
  const api=read('functions/api/admin/trust-authority-614.js');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/ACTIVE_EXTERNAL_VERIFIED|verifyProofs614/);
  assert.match(api,/PENDING_EXTERNAL_VERIFICATION/);
  assert.match(api,/origin/);
  assert.doesNotMatch(api,/etsy\.com\/v3|graph\.facebook\.com|provider_write\s*=\s*true/i);
  const migration=read('migrations/proposed/0052_devilndove_build614_external_authority_hold.sql');
  assert.match(migration,/PROPOSED ONLY/);
  assert.match(migration,/dd614_decisions_no_delete/);
  assert.match(migration,/dd614_decisions_no_update/);
  assert.match(migration,/previous_hash TEXT NOT NULL UNIQUE/);
});
test('Build 614 UI and protected release cadence keep old verification and HOLD',()=>{
  const ui=read('public/js/admin-channel-trust-authority-614.mjs');
  assert.match(ui,/35\. Trusted authority enrollment/);
  assert.match(ui,/verify_and_record/);
  assert.match(ui,/enroll_pending/);
  assert.match(ui,/provider still HOLD/);
  assert.doesNotMatch(ui,/localStorage|sessionStorage|innerHTML/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),
    /admin-channel-trust-authority-614\.mjs\?v=(?:614|615|616|617|618|619|620|621|622|623)/);
  const workflow=read('.github/workflows/current-application-quality.yml');
  assert.match(workflow,/release467_build614_trust_authority\.test\.mjs/);
  assert.match(workflow,/release467_build613_trust_workbench\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:614|615|616|617|618|619|620|621|622|623)/);
});
