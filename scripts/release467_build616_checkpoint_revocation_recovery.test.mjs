import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ledgerHash614} from '../functions/api/_lib/trustAuthority614.js';
import {FORMAT_616,ROTATION_616,HOLD_616,canonicalCheckpoint616,
  canonicalRotation616,verifyCheckpoint616,verifyRotation616,quarantineCandidate616,
  recoveryDrill616} from '../functions/api/_lib/trustCheckpoint616.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-checkpoint-616.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now='2026-11-06T15:00:00.000Z',ZERO='0'.repeat(64);
const b64=x=>Buffer.from(x).toString('base64url');
async function fixture(){
 const names={ISSUER_OLD:'issuer-old-616',ISSUER_NEW:'issuer-new-616',
  WITNESS:'witness-separate-616',OWNER:'owner-separate-616'};
 const roots={},pairs={},pins={};
 for(const [role,id] of Object.entries(names)){
  const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
  const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
  roots[id]={authority_id:id,role:role.startsWith('ISSUER')?'ISSUER':role,
   public_key:b64(raw),key_sha256:fp,
   status:role==='ISSUER_NEW'?'PENDING_EXTERNAL_VERIFICATION':'ACTIVE_EXTERNAL_VERIFIED'};
  if(role!=='ISSUER_NEW')pins[id]=fp;
  pairs[id]=pair;
 }
 const event={case_pin:'case-checkpoint-616',channel:'ETSY',account_id:'shop-616',
  product_ref:'sku-616',action:'CREATE_DRAFT',source_sha256:'a'.repeat(64),
  decision:'APPROVE',owner_nonce:'owner-scope-nonce-616'};
 const hash=await ledgerHash614(ZERO,event,webcrypto);
 const row={sequence:1,previous_hash:ZERO,event_hash:hash,
  proof_summary_json:JSON.stringify(event),case_pin:event.case_pin,channel:event.channel,
  account_id:event.account_id,product_ref:event.product_ref,exact_action:event.action,
  source_sha256:event.source_sha256,owner_decision:event.decision,owner_nonce:event.owner_nonce};
 const checkpoint={format:FORMAT_616,ledger_head_sha256:hash,ledger_sequence:'1',
  external_custody_ref:'https://evidence.example.org/ledger/616',
  external_receipt_sha256:'b'.repeat(64),nonce:'external-ledger-nonce-616',
  issued_at:'2026-11-06T14:50:00.000Z',expires_at:'2026-11-06T15:10:00.000Z'};
 const rotation={format:ROTATION_616,old_authority_id:names.ISSUER_OLD,
  new_authority_id:names.ISSUER_NEW,old_key_sha256:roots[names.ISSUER_OLD].key_sha256,
  new_key_sha256:roots[names.ISSUER_NEW].key_sha256,
  original_source_sha256:'c'.repeat(64),nonce:'new-issuer-key-nonce-616',
  issued_at:'2026-11-06T14:50:00.000Z',expires_at:'2026-11-06T15:10:00.000Z'};
 const sign=async (payload,roles,canonicalizer)=>Promise.all(roles.map(async role=>{
  const id=names[role];return {role,authority_id:id,
   signature:b64(await webcrypto.subtle.sign('Ed25519',pairs[id].privateKey,
    new TextEncoder().encode(canonicalizer(payload,now))))};
 }));
 return {roots,pins,row,checkpoint,rotation,sign};
}
test('Build 616 exact signed checkpoint stays pending independent external readback',async()=>{
 const f=await fixture(),signed={payload:f.checkpoint,
  signatures:await f.sign(f.checkpoint,['WITNESS','OWNER'],canonicalCheckpoint616)};
 const config={ledgerRows:[f.row],authority:async id=>f.roots[id],
  pins:f.pins,now,cryptoApi:webcrypto};
 const result=await verifyCheckpoint616(signed,config);
 assert.equal(result.crypto_verified,true);
 assert.equal(result.independently_anchored,false);
 assert.equal(result.external_readback_verified,false);
 assert.equal(result.provider_action_authorized,false);
 assert.equal(result.release_gate,HOLD_616);
 await assert.rejects(verifyCheckpoint616({...signed,payload:{
  ...f.checkpoint,ledger_head_sha256:'c'.repeat(64)}},config));
 await assert.rejects(verifyCheckpoint616(signed,{...config,ledgerRows:[{
  ...f.row,owner_decision:'DECLINE'}]}));
 await assert.rejects(verifyCheckpoint616(signed,{...config,pins:{}}));
 await assert.rejects(verifyCheckpoint616(signed,{...config,authority:async id=>({
  ...f.roots[id],status:'QUARANTINED'})}));
 await assert.rejects(verifyCheckpoint616({...signed,signatures:[signed.signatures[0],
  signed.signatures[0]]},config));
 await assert.rejects(verifyCheckpoint616({...signed,payload:{...f.checkpoint,
  external_receipt_sha256:'d'.repeat(64)}},config));
 assert.throws(()=>canonicalCheckpoint616({...f.checkpoint,
  external_custody_ref:'https://evidence.example.org/a?token=secret'},now));
 assert.throws(()=>canonicalCheckpoint616({...f.checkpoint,
  expires_at:'2026-11-06T14:30:00.000Z'},now));
});
test('Build 616 rotation requires 4 distinct signatures and never activates a new key',async()=>{
 const f=await fixture(),signed={payload:f.rotation,
  signatures:await f.sign(f.rotation,
    ['ISSUER_OLD','ISSUER_NEW','WITNESS','OWNER'],canonicalRotation616)};
 const config={authority:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
 const result=await verifyRotation616(signed,config);
 assert.equal(result.new_key_activated,false);
 assert.equal(result.old_key_revoked,false);
 assert.equal(result.provider_action_authorized,false);
 assert.equal(result.status,'ROTATION_PENDING_INDEPENDENT_EXTERNAL_APPROVAL');
 await assert.rejects(verifyRotation616(signed,{...config,authority:async id=>({
  ...f.roots[id],status:'QUARANTINED'})}));
 await assert.rejects(verifyRotation616(signed,{...config,pins:{}}));
 await assert.rejects(verifyRotation616({...signed,signatures:[signed.signatures[0],
  signed.signatures[0],...signed.signatures.slice(2)]},config));
 await assert.rejects(verifyRotation616({...signed,payload:{...f.rotation,
  original_source_sha256:'d'.repeat(64)}},config));
 assert.throws(()=>canonicalRotation616({...f.rotation,
  new_authority_id:f.rotation.old_authority_id},now));
});
test('Build 616 immutable quarantine and read-only recovery drill deny provider activation',()=>{
 const data={authority_id:'issuer-old-616',key_sha256:'a'.repeat(64),
  reason:'KEY_COMPROMISE',evidence_ref:'https://external.example.org/verified/custody',
  evidence_sha256:'b'.repeat(64)};
 assert.deepEqual(quarantineCandidate616(data),data);
 assert.throws(()=>quarantineCandidate616({...data,reason:'ACTIVATE'}));
 assert.throws(()=>quarantineCandidate616({...data,private_key:'secret'}));
 assert.throws(()=>quarantineCandidate616({...data,evidence_ref:'https://example.com/?secret=123'}));
 const drill=recoveryDrill616({chain_consistent:true,checkpoint_verified:false,
  any_key_quarantined:true,original_custody_verified:false});
 assert.equal(drill.status,'SIMULATED_FAIL_CLOSED_RECOVERY_ONLY');
 assert.equal(drill.provider_action_authorized,false);
 assert.equal(drill.live_recovery_attempted,false);
 assert.ok(Object.values(drill.scenarios).every(x=>x==='EXPECTED_DENY_NOT_EXECUTED_LIVE'));
});
test('Build 616 D1 migration is proposed, immutable, and denies older verifier paths',async()=>{
 const req=new Request('https://devilndove.com/api/admin/trust-checkpoint-616');
 assert.equal((await onRequestGet({request:req,env:{}})).status,401);
 assert.equal((await onRequestPost({request:req,env:{}})).status,401);
 const sql=read('migrations/proposed/0054_devilndove_build616_external_checkpoint_revocation_hold.sql');
 assert.match(sql,/PROPOSED ONLY/);
 for(const name of ['dd616_quarantine_no_update','dd616_quarantine_no_delete',
  'dd616_checkpoint_no_update','dd616_rotation_no_delete'])assert.match(sql,new RegExp(name));
 const api=read('functions/api/admin/trust-checkpoint-616.js');
 assert.match(api,/requireAdminStepUp/);
 assert.match(api,/verifyCheckpoint616/);
 assert.match(api,/quarantine_key/);
 assert.doesNotMatch(api,/UPDATE\s+dd614_authorities|etsy\.com\/v3|graph\.facebook\.com|provider_action_authorized:\s*true/i);
 for(const older of ['trust-authority-614.js','trust-ceremony-615.js']){
  const file=read('functions/api/admin/'+older);
  assert.match(file,/dd616_key_quarantines/);
  assert.match(file,/QUARANTINED/);
 }
 const ui=read('public/js/admin-channel-trust-authority-614.mjs');
 assert.match(ui,/37\. Independent checkpoint/);
 assert.match(ui,/run_recovery_drill/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|innerHTML/);
 assert.match(read('.github/workflows/current-application-quality.yml'),
  /release467_build616_checkpoint_revocation_recovery\.test\.mjs/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:61[6789]|620|621)/);
 // Apply the three proposed migrations only in ephemeral SQLite memory; never touch real D1.
 const validation=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify([
  'migrations/proposed/0052_devilndove_build614_external_authority_hold.sql',
  'migrations/proposed/0053_devilndove_build615_custody_ceremony_hold.sql',
  'migrations/proposed/0054_devilndove_build616_external_checkpoint_revocation_hold.sql'])}: c.executescript(open(f).read())\nfor t in ['dd616_key_quarantines','dd616_checkpoint_receipts','dd616_rotation_candidates']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nprint('PROPOSED_MIGRATION_EPHEMERAL_ONLY')`;
 assert.match(execFileSync('python3',['-c',validation],{cwd:new URL('..',import.meta.url),encoding:'utf8'}),
  /PROPOSED_MIGRATION_EPHEMERAL_ONLY/);
});
