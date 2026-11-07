import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {FORMAT_627,DECISION_627,HOLD_627,canonicalDecision627,verifyDecision627}
  from '../functions/api/_lib/trustChannelDecision627.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/trust-channel-decision-627.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now='2026-11-07T09:00:00.000Z';
const H=x=>x.repeat(64);
const b64=x=>Buffer.from(x).toString('base64url');
async function fixture(){
  const ids={ISSUER:'original-meta-issuer-627',WITNESS:'separate-meta-witness-627',
    OWNER:'original-page-owner-627'},keys={},roots={},pins={};
  for(const [role,id] of Object.entries(ids)){
    const key=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',key.publicKey));
    const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
    keys[id]=key.privateKey;pins[id]=fp;
    roots[id]={authority_id:id,role,public_key:b64(raw),key_sha256:fp,
      status:'ACTIVE_EXTERNAL_VERIFIED'};
  }
  const p={format:FORMAT_627,witness_sha256:H('a'),
    authorization_id:'one-actual-verified-original-meta-get-627',
    enrollment_sha256:H('b'),test_nonce:'one-original-meta-provider-get-nonce-627',
    page_id:'112233445566',receipt_sha256:H('c'),window_sha256:H('d'),
    owner_ledger_head_sha256:H('e'),decision:DECISION_627,
    nonce:'fresh-independent-original-decision-627',
    issued_at:'2026-11-07T08:58:00.000Z',expires_at:'2026-11-07T09:04:00.000Z'};
  const signed=canonicalDecision627(p,now);
  const signatures=await Promise.all(['ISSUER','WITNESS','OWNER'].map(async role=>({
    role,authority_id:ids[role],
    signature:b64(await webcrypto.subtle.sign('Ed25519',keys[ids[role]],
      new TextEncoder().encode(signed)))})));
  const receipt={witness_sha256:p.witness_sha256,
    authorization_id:p.authorization_id,enrollment_sha256:p.enrollment_sha256,
    test_nonce:p.test_nonce,page_id:p.page_id,receipt_sha256:p.receipt_sha256,
    window_sha256:p.window_sha256,owner_ledger_head_sha256:p.owner_ledger_head_sha256,
    window_expires_at:'2026-11-07T09:06:00.000Z',
    original_signers:signatures.map(s=>({role:s.role,authority_id:s.authority_id})),
    original_source_verified:true,actual_meta_get_verified:true};
  return {ids,roots,pins,p,receipt,bundle:{payload:p,signatures},
    config:{receipt,roots:async id=>roots[id],pins,now,cryptoApi:webcrypto}};
}

test('627 exact original three-party signatures verify one actual GET receipt without changing connected state',async()=>{
  const f=await fixture();
  const verified=await verifyDecision627(f.bundle,f.config);
  assert.equal(verified.verified_original_three_party_signatures,true);
  assert.equal(verified.original_get_receipt_exact_match,true);
  assert.equal(verified.provider_channel_connected,false);
  assert.equal(verified.provider_get_performed,false);
  assert.equal(verified.decision_not_persisted,true);
  assert.equal(verified.d1_mutation,false);
  assert.equal(verified.release_gate,HOLD_627);
  assert.match(verified.decision_sha256,/^[a-f0-9]{64}$/);
});

test('627 rejects stale, overbroad, impersonated, missing, revoked or changed source evidence',async()=>{
  const f=await fixture(),config=f.config;
  for(const changes of [{page_id:'999'},{receipt_sha256:H('f')},
    {window_sha256:H('f')},{owner_ledger_head_sha256:H('f')},
    {test_nonce:'completely-other-test-nonce-627'},
    {decision:'ACTIVATE_META_CONNECTION'},
    {issued_at:'2026-11-07T09:05:00.000Z'},
    {expires_at:'2026-11-07T09:20:00.000Z'}]){
    await assert.rejects(verifyDecision627({payload:{...f.p,...changes},
      signatures:f.bundle.signatures},config));
  }
  for(const altered of [
    {...config,receipt:{...f.receipt,original_source_verified:false}},
    {...config,receipt:{...f.receipt,actual_meta_get_verified:false}},
    {...config,receipt:{...f.receipt,window_expires_at:'2026-11-07T08:59:59.000Z'}},
    {...config,receipt:{...f.receipt,receipt_sha256:H('f')}},
    {...config,pins:{}},
    {...config,roots:async id=>({...f.roots[id],status:'QUARANTINED'})}
  ])await assert.rejects(verifyDecision627(f.bundle,altered));
  const repeated=f.bundle.signatures.map(s=>({...s}));
  repeated[1].authority_id=repeated[0].authority_id;
  await assert.rejects(verifyDecision627({...f.bundle,signatures:repeated},config));
  await assert.rejects(verifyDecision627({...f.bundle,signatures:repeated.slice(0,2)},config));
  assert.throws(()=>canonicalDecision627({...f.p,extra_action:'publish'},now));
});

test('627 original-owner endpoint requires admin access and cannot silently migrate, connect, refresh or call Meta',async()=>{
  const request=new Request('https://devilndove.com/api/admin/trust-channel-decision-627');
  assert.equal((await onRequestGet({request,env:{}})).status,401);
  assert.equal((await onRequestPost({request,env:{}})).status,401);
  const api=read('functions/api/admin/trust-channel-decision-627.js');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/trustedPins614/);
  assert.match(api,/dd616_key_quarantines/);
  assert.match(api,/dd624_meta_witness_acceptances/);
  assert.match(api,/readOwnerWalkthrough626/);
  assert.doesNotMatch(api,/INSERT INTO|UPDATE\s+|DELETE FROM|CREATE TABLE|decryptOAuthSecret|probeMetaPage620|refreshOAuthToken|fetch\(/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/48\. Original Meta evidence gaps/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=627/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":627/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build627_original_meta_channel_decision\.test\.mjs/);
});
