import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {ledgerHash614} from '../functions/api/_lib/trustAuthority614.js';
import {FORMAT_615,HOLD_615,custodyCandidate615,canonicalCeremony615,
  verifyCeremony615,auditLedger615} from '../functions/api/_lib/trustCeremony615.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-ceremony-615.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now='2026-11-06T15:00:00.000Z',ZERO='0'.repeat(64);
const b64=x=>Buffer.from(x).toString('base64url');
const candidate={
 receipt_id:'receipt-615-source',authority_id:'source-issuer-615',
 original_source_ref:'https://www.etsy.com/your/shops/receipt',
 original_source_sha256:'a'.repeat(64),original_receipt_sha256:'b'.repeat(64),
 witness_authority_id:'independent-witness-615',owner_authority_id:'original-owner-615',
 observed_at:'2026-11-06T14:35:00.000Z'
};
async function ceremonyFixture(){
 const roots={},pins={},pairs={};
 for(const [kind,id] of Object.entries({CANDIDATE:candidate.authority_id,
  WITNESS:candidate.witness_authority_id,OWNER:candidate.owner_authority_id})){
  const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const publicKey=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
  const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',publicKey)).toString('hex');
  roots[id]={authority_id:id,role:kind==='CANDIDATE'?'ISSUER':kind,
    public_key:b64(publicKey),key_sha256:fp,status:kind==='CANDIDATE'?
    'PENDING_EXTERNAL_VERIFICATION':'ACTIVE_EXTERNAL_VERIFIED'};
  pins[id]=fp;pairs[id]=pair;
 }
 const challenge={format:FORMAT_615,authority_id:candidate.authority_id,
  key_sha256:roots[candidate.authority_id].key_sha256,custody_receipt_id:candidate.receipt_id,
  original_source_sha256:candidate.original_source_sha256,
  original_receipt_sha256:candidate.original_receipt_sha256,
  challenge_nonce:'unique-activation-challenge-615',
  issued_at:'2026-11-06T14:50:00.000Z',expires_at:'2026-11-06T15:10:00.000Z'};
 const canonical=canonicalCeremony615(challenge,now);
 const signatures=[];
 for(const [role,id] of Object.entries({CANDIDATE:candidate.authority_id,
  WITNESS:candidate.witness_authority_id,OWNER:candidate.owner_authority_id})){
  const sig=await webcrypto.subtle.sign('Ed25519',pairs[id].privateKey,
    new TextEncoder().encode(canonical));
  signatures.push({role,authority_id:id,signature:b64(sig)});
 }
 return {input:{challenge,signatures},roots,pins,receipt:{...candidate,
  status:'EXTERNALLY_AUTHENTICATED'}};
}
test('Build 615 bounded exact custody input cannot manufacture official authentication',()=>{
 assert.equal(custodyCandidate615(candidate,now),candidate);
 for(const bad of [
  {...candidate,owner_authority_id:candidate.witness_authority_id},
  {...candidate,original_source_ref:'http://example.com/receipt'},
  {...candidate,original_source_ref:'https://user:pass@example.com/receipt'},
  {...candidate,original_source_ref:'https://example.com/receipt?access_token=secret'},
  {...candidate,original_receipt_sha256:'not-a-hash'},
  {...candidate,observed_at:'2026-11-07T14:00:00.000Z'},
  {...candidate,source_verified:true}
 ])assert.throws(()=>custodyCandidate615(bad,now));
});
test('Build 615 real signed three-party ceremony stays unactivated even with independent pins',async()=>{
 const {input,roots,pins,receipt}=await ceremonyFixture();
 const params={authority:async id=>roots[id],readback:async()=>receipt,
  pins,now,cryptoApi:webcrypto};
 const proof=await verifyCeremony615(input,params);
 assert.equal(proof.crypto_verified,true);
 assert.equal(proof.authority_activated,false);
 assert.equal(proof.provider_action_authorized,false);
 assert.equal(proof.status,'READY_FOR_SEPARATE_CONTROLLED_ACTIVATION_APPROVAL');
 assert.equal(proof.release_gate,HOLD_615);
 await assert.rejects(verifyCeremony615(input,{...params,pins:{}}));
 await assert.rejects(verifyCeremony615(input,{...params,readback:async()=>({
  ...receipt,status:'PENDING_EXTERNAL_AUTHENTICATION'})}));
 await assert.rejects(verifyCeremony615({...input,signatures:[
  input.signatures[0],input.signatures[0],input.signatures[2]]},params));
 await assert.rejects(verifyCeremony615({...input,signatures:input.signatures.map((x,i)=>i===1?
  {...x,signature:'A'.repeat(86)}:x)},params));
 await assert.rejects(verifyCeremony615({...input,challenge:{
  ...input.challenge,original_source_sha256:'b'.repeat(64)}},params));
  await assert.rejects(verifyCeremony615({...input,challenge:{
  ...input.challenge,original_receipt_sha256:'c'.repeat(64)}},params));
 assert.throws(()=>canonicalCeremony615({...input.challenge,expires_at:'2026-11-07T15:00:00.000Z'},now));
});
test('Build 615 detects changed event contents, predecessor forks and missing independent anchor',async()=>{
 const event={case_pin:'dd596-case:owner-615',channel:'ETSY',account_id:'shop-615',
  product_ref:'sku-615',action:'CREATE_DRAFT',source_sha256:'a'.repeat(64),
  decision:'APPROVE',owner_nonce:'unique-owner-nonce-615'};
 const first=await ledgerHash614(ZERO,event,webcrypto);
 const row={sequence:1,event_hash:first,previous_hash:ZERO,proof_summary_json:JSON.stringify(event),
  case_pin:event.case_pin,channel:event.channel,account_id:event.account_id,
  product_ref:event.product_ref,exact_action:event.action,source_sha256:event.source_sha256,
  owner_decision:event.decision,owner_nonce:event.owner_nonce};
 const good=await auditLedger615([row],{cryptoApi:webcrypto});
 assert.equal(good.chain_consistent,true);
 assert.equal(good.independently_anchored,false);
 assert.deepEqual(good.findings,['NO_INDEPENDENT_EXTERNAL_ANCHOR']);
 assert.equal(good.provider_action_authorized,false);
 const altered=await auditLedger615([{...row,owner_decision:'DECLINE'}],{cryptoApi:webcrypto});
 assert.equal(altered.chain_consistent,false);
 assert.ok(altered.findings.includes('SIGNED_EVENT_COLUMN_CONFLICT'));
 const tampered=await auditLedger615([{...row,proof_summary_json:JSON.stringify({
  ...event,product_ref:'forged-sku'})}],{cryptoApi:webcrypto});
 assert.equal(tampered.chain_consistent,false);
 assert.ok(tampered.findings.includes('EVENT_HASH_MISMATCH'));
 const broken=await auditLedger615([{...row,previous_hash:'c'.repeat(64)}],
  {cryptoApi:webcrypto,anchor:first});
 assert.equal(broken.chain_consistent,false);
 assert.ok(broken.findings.includes('BROKEN_PREDECESSOR_CHAIN'));
  const absent=await auditLedger615([],{cryptoApi:webcrypto});
  assert.equal(absent.chain_consistent,false);
  const gap=await auditLedger615([{...row,sequence:3}],{cryptoApi:webcrypto});
  assert.ok(gap.findings.includes('MISSING_LEDGER_ORIGIN'));
 await assert.rejects(auditLedger615(Array(501).fill(row),{cryptoApi:webcrypto}));
});
test('Build 615 server is admin-only, migration-gated and has no self-activation or provider access',async()=>{
 const request=new Request('https://devilndove.com/api/admin/trust-ceremony-615');
 assert.equal((await onRequestGet({request,env:{}})).status,401);
 assert.equal((await onRequestPost({request,env:{}})).status,401);
 const api=read('functions/api/admin/trust-ceremony-615.js');
 assert.match(api,/requireAdminStepUp/);
 assert.match(api,/verifyCeremony615/);
 assert.match(api,/auditLedger615/);
 assert.match(api,/PENDING_EXTERNAL_AUTHENTICATION/);
 assert.doesNotMatch(api,/UPDATE\s+dd614_authorities|etsy\.com\/v3|graph\.facebook\.com|provider_action_authorized:\s*true/i);
 const sql=read('migrations/proposed/0053_devilndove_build615_custody_ceremony_hold.sql');
 assert.match(sql,/PROPOSED ONLY/);
 assert.match(sql,/dd615_custody_no_update/);
 assert.match(sql,/dd615_ceremony_no_delete/);
 const ui=read('public/js/admin-channel-trust-authority-614.mjs');
 assert.match(ui,/36\. Independent activation ceremony/);
 assert.match(ui,/trust-ceremony-615/);
 assert.doesNotMatch(ui,/innerHTML|localStorage|sessionStorage/);
 assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=61[5678]/);
 assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build615_custody_ceremony_audit\.test\.mjs/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":61[5678]/);
});
