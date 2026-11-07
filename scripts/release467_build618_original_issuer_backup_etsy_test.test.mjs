import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {ISSUER_618,BACKUP_618,ACCEPT_618,HOLD_618,
  canonicalIssuer618,canonicalBackup618,canonicalAcceptance618,
  verifyIssuerCustody618,verifyBackupWitness618,verifyProviderAcceptance618,
  probeEtsyIdentity618} from '../functions/api/_lib/trustIssuer618.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-issuer-618.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now='2026-11-06T15:00:00.000Z';
const window={issued_at:'2026-11-06T14:50:00.000Z',
 expires_at:'2026-11-06T15:10:00.000Z'};
const b64=x=>Buffer.from(x).toString('base64url');
async function setup(){
 const names={CANDIDATE:'original-etsy-issuer-618',WITNESS:'independent-etsy-witness-618',
  OWNER:'independent-original-owner-618'};
 const roots={},pins={},pairs={};
 for(const [role,id] of Object.entries(names)){
  const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
  const key_sha256=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
  roots[id]={authority_id:id,role:role==='CANDIDATE'?'ISSUER':role,
   public_key:b64(raw),key_sha256,status:role==='CANDIDATE'?
   'PENDING_EXTERNAL_VERIFICATION':'ACTIVE_EXTERNAL_VERIFIED'};
  pairs[id]=pair;pins[id]=key_sha256;
 }
 const sign=async(payload,roles,formatter)=>({payload,signatures:await Promise.all(roles.map(
  async role=>({role,authority_id:names[role],signature:b64(await webcrypto.subtle.sign(
   'Ed25519',pairs[names[role]].privateKey,
   new TextEncoder().encode(formatter(payload,now))))})))});
 const issuerPayload={format:ISSUER_618,provider:'ETSY',authority_id:names.CANDIDATE,
  custody_receipt_id:'original-issuer-receipt-618',checkpoint_sha256:'a'.repeat(64),
  original_source_sha256:'b'.repeat(64),original_receipt_sha256:'c'.repeat(64),
  nonce:'signed-original-issuer-nonce-618',...window};
 const custody={receipt_id:issuerPayload.custody_receipt_id,authority_id:names.CANDIDATE,
  original_source_sha256:issuerPayload.original_source_sha256,
  original_receipt_sha256:issuerPayload.original_receipt_sha256,
  status:'PENDING_EXTERNAL_AUTHENTICATION'};
 const readback={checkpoint_sha256:issuerPayload.checkpoint_sha256,
  original_issuer_source_sha256:issuerPayload.original_source_sha256,
  status:'EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'};
 const registry={authority_id:names.CANDIDATE,provider:'ETSY',
  original_source_sha256:issuerPayload.original_source_sha256,
  status:'INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE'};
 const params={candidate:roots[names.CANDIDATE],custody,readback,registry,
  authority:async id=>roots[id],pins,now,cryptoApi:webcrypto};
 return {names,roots,pins,sign,issuerPayload,custody,readback,registry,params};
}
test('Build 618 requires real candidate, independent witness and owner Ed25519 signatures',async()=>{
 const f=await setup();
 const input=await f.sign(f.issuerPayload,['CANDIDATE','WITNESS','OWNER'],canonicalIssuer618);
 const verified=await verifyIssuerCustody618(input,f.params);
 assert.equal(verified.original_issuer_activated,false);
 assert.equal(verified.provider_test_executed,false);
 assert.equal(verified.status,'CRYPTO_ATTESTED_PENDING_SEPARATE_ORIGINAL_CUSTODY_DECISION');
 assert.equal(verified.release_gate,HOLD_618);
 await assert.rejects(verifyIssuerCustody618(input,{...f.params,pins:{}}));
 await assert.rejects(verifyIssuerCustody618(input,{...f.params,registry:null}));
 await assert.rejects(verifyIssuerCustody618(input,{...f.params,readback:null}));
 await assert.rejects(verifyIssuerCustody618(input,{...f.params,
  candidate:{...f.params.candidate,status:'QUARANTINED'}}));
 await assert.rejects(verifyIssuerCustody618({...input,signatures:[
  input.signatures[0],input.signatures[1],input.signatures[1]]},f.params));
 await assert.rejects(verifyIssuerCustody618({...input,payload:{...f.issuerPayload,
  original_source_sha256:'d'.repeat(64)}},f.params));
 assert.throws(()=>canonicalIssuer618({...f.issuerPayload,provider:'META'},now));
});
test('Build 618 witnessed backup signed packet cannot apply D1 or claim independent restore',async()=>{
 const f=await setup(),payload={format:BACKUP_618,backup_id:'witnessed-backup-618',
  backup_sha256:'a'.repeat(64),migration_manifest_sha256:'b'.repeat(64),
  source_database_id:'devilndove-prod-r462',checkpoint_sha256:f.issuerPayload.checkpoint_sha256,
  owner_decision:'AUTHORIZE_INDEPENDENT_REVIEW_ONLY',
  nonce:'backup-witnessed-original-618',...window};
 const input=await f.sign(payload,['WITNESS','OWNER'],canonicalBackup618);
 const config={readback:f.readback,authority:f.params.authority,pins:f.pins,
  now,cryptoApi:webcrypto};
 const verified=await verifyBackupWitness618(input,config);
 assert.equal(verified.backup_restored_verified,false);
 assert.equal(verified.d1_migration_authorized,false);
 assert.equal(verified.d1_migration_performed,false);
 await assert.rejects(verifyBackupWitness618(input,{...config,readback:null}));
 await assert.rejects(verifyBackupWitness618(input,{...config,pins:{}}));
 assert.throws(()=>canonicalBackup618({...payload,owner_decision:'APPLY_PRODUCTION_D1'},now));
});
test('Build 618 real Etsy identity GET is one fixed endpoint, authenticated, read-only and exact identity',async()=>{
 let request;
 const fake=async (url,options)=>{
  request={url,method:options.method,redirect:options.redirect,
   authorizationPresent:!!options.headers.Authorization};
  return new Response(JSON.stringify({user_id:12345,first_name:'Never persisted'}),
   {status:200,headers:{'content-type':'application/json'}});
 };
 const config={apiKey:'test-key',secret:'test-secret',token:'test-bearer',
  expectedUserId:'12345',fetchFn:fake,cryptoApi:webcrypto};
 const result=await probeEtsyIdentity618(config);
 assert.deepEqual(request,{url:'https://api.etsy.com/v3/application/users/me',
  method:'GET',redirect:'manual',authorizationPresent:true});
 assert.equal(result.remote_subject_id,'12345');
 assert.equal(result.provider_write,false);
 assert.equal(result.provider_action_authorized,false);
 assert.match(result.provider_receipt_sha256,/^[a-f0-9]{64}$/);
 assert.equal('first_name' in result,false);
 await assert.rejects(probeEtsyIdentity618({...config,expectedUserId:'9999'}));
 await assert.rejects(probeEtsyIdentity618({...config,token:''}));
 await assert.rejects(probeEtsyIdentity618({...config,fetchFn:async()=>new Response(null,
  {status:302,headers:{location:'https://evil.invalid'}})}));
 await assert.rejects(probeEtsyIdentity618({...config,fetchFn:async()=>new Response(
  'x'.repeat(8193),{status:200,headers:{'content-type':'application/json'}})}));
});
test('Build 618 accepts only genuine previously recorded GET receipt with independent signed exact scope',async()=>{
 const f=await setup(),payload={format:ACCEPT_618,grant_id:'original-allow-one-get-618',
  test_nonce:'original-single-test-nonce-618',preflight_sha256:'d'.repeat(64),
  checkpoint_sha256:f.issuerPayload.checkpoint_sha256,
  provider_receipt_sha256:'e'.repeat(64),remote_subject_id:'12345',
  owner_decision:'ACCEPT_EXACT_ETSY_READ_ONLY_TEST_RECEIPT',
  nonce:'accept-real-etsy-test-618',...window};
 const input=await f.sign(payload,['WITNESS','OWNER'],canonicalAcceptance618);
 const attempt={grant_id:payload.grant_id,test_nonce:payload.test_nonce};
 const outcome={test_nonce:payload.test_nonce,
  provider_receipt_sha256:payload.provider_receipt_sha256,
  remote_subject_id:payload.remote_subject_id,
  status:'ETSY_IDENTITY_GET_VERIFIED_PENDING_WITNESS_ACCEPTANCE'};
 const grant={grant_id:payload.grant_id,preflight_sha256:payload.preflight_sha256,
  checkpoint_sha256:payload.checkpoint_sha256};
 const config={attempt,outcome,grant,authority:f.params.authority,pins:f.pins,
  now,cryptoApi:webcrypto};
 const verified=await verifyProviderAcceptance618(input,config);
 assert.equal(verified.provider_get_verified,true);
 assert.equal(verified.provider_write,false);
 assert.equal(verified.authority_activated,false);
 await assert.rejects(verifyProviderAcceptance618(input,{...config,outcome:null}));
 await assert.rejects(verifyProviderAcceptance618(input,{...config,
  outcome:{...outcome,provider_receipt_sha256:'f'.repeat(64)}}));
 await assert.rejects(verifyProviderAcceptance618(input,{...config,pins:{}}));
 assert.throws(()=>canonicalAcceptance618({...payload,owner_decision:'PUBLISH'},now));
});
test('Build 618 proposed migration remains immutable, admin-only, and actual GET separately granted',async()=>{
 const req=new Request('https://devilndove.com/api/admin/trust-issuer-618');
 assert.equal((await onRequestGet({request:req,env:{}})).status,401);
 assert.equal((await onRequestPost({request:req,env:{}})).status,401);
 const api=read('functions/api/admin/trust-issuer-618.js');
 assert.match(api,/requireAdminStepUp/);
 assert.match(api,/CLAIMED_EXACTLY_ONE_GET/);
 assert.match(api,/INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET/);
 assert.match(api,/decryptOAuthSecret/);
 assert.doesNotMatch(api,/UPDATE\s+dd614_authorities|UPDATE\s+dd616_key_quarantines|method:\s*'POST'\s*,\s*redirect:\s*'follow'|provider_action_authorized:\s*true/i);
 const sql=read('migrations/proposed/0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql');
 assert.match(sql,/PROPOSED ONLY/);
 for(const trigger of ['dd618_source_no_update','dd618_attestation_no_delete',
  'dd618_backup_no_update','dd618_grant_no_delete',
  'dd618_original_decision_no_update','dd618_restore_no_delete',
  'dd618_attempt_no_update','dd618_outcome_no_delete','dd618_accept_no_update'])
  assert.match(sql,new RegExp(trigger));
 const validation=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify([
  'migrations/proposed/0052_devilndove_build614_external_authority_hold.sql',
  'migrations/proposed/0053_devilndove_build615_custody_ceremony_hold.sql',
  'migrations/proposed/0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
  'migrations/proposed/0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql',
  'migrations/proposed/0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql'])}: c.executescript(open(f).read())\nfor t in ['dd618_original_source_registrations','dd618_original_issuer_attestations','dd618_backup_witness_packets','dd618_original_custody_decisions','dd618_backup_restore_verifications','dd618_original_test_grants','dd618_provider_test_attempts','dd618_provider_test_outcomes','dd618_provider_test_acceptances']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nprint('PROPOSED_MIGRATIONS_ONLY_IN_MEMORY')`;
 assert.match(execFileSync('python3',['-c',validation],{cwd:new URL('..',import.meta.url),encoding:'utf8'}),
  /PROPOSED_MIGRATIONS_ONLY_IN_MEMORY/);
 assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/39\. Original issuer/);
 assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=621/);
 assert.match(read('.github/workflows/current-application-quality.yml'),
  /release467_build618_original_issuer_backup_etsy_test\.test\.mjs/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":621/);
});
