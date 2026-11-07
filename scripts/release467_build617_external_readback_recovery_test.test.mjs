import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {ledgerHash614,sha256} from '../functions/api/_lib/trustAuthority614.js';
import {FORMAT_616,canonicalCheckpoint616} from '../functions/api/_lib/trustCheckpoint616.js';
import {ANCHOR_617,RECOVERY_617,PREFLIGHT_617,HOLD_617,canonicalAnchor617,
  canonicalRecovery617,canonicalTest617,approvedAnchorUrl617,
  fetchExternalReadback617,verifyRecoveryPacket617,verifyTestPreflight617}
  from '../functions/api/_lib/trustReadback617.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-readback-617.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now='2026-11-06T15:00:00.000Z',ZERO='0'.repeat(64);
const b64=x=>Buffer.from(x).toString('base64url');
const signWindow={issued_at:'2026-11-06T14:50:00.000Z',
 expires_at:'2026-11-06T15:10:00.000Z'};
async function setup(){
 const names={WITNESS:'independent-witness-617',OWNER:'original-owner-617',
  ISSUER:'original-issuer-617',REPLACEMENT:'replacement-issuer-617'};
 const roots={},pins={},pairs={};
 for(const [role,id] of Object.entries(names)){
  const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
  const key_sha256=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
  roots[id]={authority_id:id,role:role==='REPLACEMENT'?'ISSUER':role,
   public_key:b64(raw),key_sha256,status:role==='REPLACEMENT'?
   'PENDING_EXTERNAL_VERIFICATION':'ACTIVE_EXTERNAL_VERIFIED'};
  if(role!=='REPLACEMENT')pins[id]=key_sha256;
  pairs[id]=pair;
 }
 const signed=async(payload,formatter)=>({payload,signatures:await Promise.all(
  ['WITNESS','OWNER'].map(async role=>({role,authority_id:names[role],
   signature:b64(await webcrypto.subtle.sign('Ed25519',pairs[names[role]].privateKey,
    new TextEncoder().encode(formatter(payload,now))))})))});
 const event={case_pin:'case-anchor-617',channel:'ETSY',account_id:'shop-617',
  product_ref:'sku-617',action:'CONNECTION_READBACK',source_sha256:'a'.repeat(64),
  decision:'APPROVE',owner_nonce:'original-owner-nonce-617'};
 const head=await ledgerHash614(ZERO,event,webcrypto);
 const anchorPayload={format:ANCHOR_617,checkpoint_nonce:'original-anchor-nonce-617',
  ledger_head_sha256:head,ledger_sequence:'1',custodian_id:'external-custodian-617',
  original_issuer_source_sha256:'c'.repeat(64),
  nonce:'original-external-receipt-617',...signWindow};
 const external=await signed(anchorPayload,canonicalAnchor617);
 const raw=JSON.stringify(external),rawSha=await sha256(raw,webcrypto);
 const checkpointScope={format:FORMAT_616,ledger_head_sha256:head,ledger_sequence:'1',
  external_custody_ref:'https://custody.example.org/receipts/617.json',
  external_receipt_sha256:rawSha,nonce:anchorPayload.checkpoint_nonce,...signWindow};
 const checkpointHash=await sha256(canonicalCheckpoint616(checkpointScope,now),webcrypto);
 const checkpoint={checkpoint_sha256:checkpointHash,ledger_head_sha256:head,
  ledger_sequence:1,status:'SIGNED_PENDING_EXTERNAL_READBACK',
  signed_bundle_json:JSON.stringify({payload:checkpointScope,signatures:[]})};
 const custodian={custodian_id:'external-custodian-617',origin:'https://custody.example.org',
  status:'INDEPENDENTLY_APPROVED',approval_sha256:'d'.repeat(64)};
 const response=(body=raw,status=200,contentType='application/json')=>
  new Response(body,{status,headers:{'content-type':contentType}});
 const config={checkpoint,custodian,authority:async id=>roots[id],pins,
  fetchFn:async()=>response(),now,cryptoApi:webcrypto};
 const readback={checkpoint_sha256:checkpointHash,
  original_issuer_source_sha256:anchorPayload.original_issuer_source_sha256,
  ledger_head_sha256:head,ledger_sequence:1,
  status:'EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'};
 return {names,roots,pins,signed,checkpoint,custodian,anchorPayload,external,raw,rawSha,
  checkpointHash,config,readback,head,response};
}
test('Build 617 retrieves exact external bytes, verifies signed witness/owner, preserves original HOLD',async()=>{
 const f=await setup();
 const observed=await fetchExternalReadback617(f.config);
 assert.equal(observed.readback_sha256,f.rawSha);
 assert.equal(observed.external_bytes_retrieved,true);
 assert.equal(observed.independent_signatures_verified,true);
 assert.equal(observed.original_issuer_custody_authenticated,false);
 assert.equal(observed.provider_action_authorized,false);
 assert.equal(observed.release_gate,HOLD_617);
 await assert.rejects(fetchExternalReadback617({...f.config,custodian:null}));
 await assert.rejects(fetchExternalReadback617({...f.config,pins:{}}));
 await assert.rejects(fetchExternalReadback617({...f.config,fetchFn:async()=>f.response('',302)}));
 await assert.rejects(fetchExternalReadback617({...f.config,fetchFn:async()=>f.response(
  'X'.repeat(16385))}));
 await assert.rejects(fetchExternalReadback617({...f.config,fetchFn:async()=>f.response(
  f.raw.replace('original-external-receipt','changed-external-receipt'))}));
 await assert.rejects(fetchExternalReadback617({...f.config,authority:async id=>({
  ...f.roots[id],status:'QUARANTINED'})}));
 const altered={...f.checkpoint,ledger_head_sha256:'f'.repeat(64)};
 await assert.rejects(fetchExternalReadback617({...f.config,checkpoint:altered}));
});
test('Build 617 approved HTTPS source cannot redirect, inject credentials or query tokens',()=>{
 const origin='https://custody.example.org';
 assert.equal(approvedAnchorUrl617(origin+'/receipts/617.json',origin),origin+'/receipts/617.json');
 for(const ref of ['http://custody.example.org/receipt','https://localhost/receipt',
  'https://127.0.0.1/receipt','https://custody.example.org.evil.com/receipt',
  origin+'/receipt?token=abc',origin+'/receipt#test',
  'https://user:secret@custody.example.org/receipt',
  'https://custody.example.org:8443/receipt'])
  assert.throws(()=>approvedAnchorUrl617(ref,origin));
});
test('Build 617 signed quarantine recovery packet remains pending and cannot unquarantine',async()=>{
 const f=await setup(),quarantine={authority_id:f.names.ISSUER,
  key_sha256:f.roots[f.names.ISSUER].key_sha256};
 const replacement=f.roots[f.names.REPLACEMENT];
 const payload={format:RECOVERY_617,quarantined_authority_id:f.names.ISSUER,
  quarantined_key_sha256:quarantine.key_sha256,
  replacement_authority_id:f.names.REPLACEMENT,
  replacement_key_sha256:replacement.key_sha256,
  checkpoint_sha256:f.checkpointHash,
  original_issuer_source_sha256:f.readback.original_issuer_source_sha256,
  nonce:'recovery-authorization-nonce-617',...signWindow};
 const input=await f.signed(payload,canonicalRecovery617);
 const config={quarantine,replacement,readback:f.readback,
  authority:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
 const proof=await verifyRecoveryPacket617(input,config);
 assert.equal(proof.quarantine_removed,false);
 assert.equal(proof.replacement_activated,false);
 assert.equal(proof.provider_action_authorized,false);
 await assert.rejects(verifyRecoveryPacket617(input,{...config,quarantine:null}));
 await assert.rejects(verifyRecoveryPacket617(input,{...config,readback:null}));
 await assert.rejects(verifyRecoveryPacket617(input,{...config,pins:{}}));
 await assert.rejects(verifyRecoveryPacket617({...input,payload:{...payload,
  original_issuer_source_sha256:'e'.repeat(64)}},config));
 assert.throws(()=>canonicalRecovery617({...payload,
  replacement_authority_id:payload.quarantined_authority_id},now));
});
test('Build 617 witnessed TEST preflight never calls provider, refuses missing custody or publication',async()=>{
 const f=await setup(),issuer=f.roots[f.names.ISSUER];
 const payload={format:PREFLIGHT_617,case_pin:'test-617-exact',channel:'ETSY',
  account_id:'shop-617',product_ref:'sku-617',action:'TEST_CONNECTION_READBACK',
  source_sha256:'a'.repeat(64),issuer_authority_id:f.names.ISSUER,
  checkpoint_sha256:f.checkpointHash,nonce:'witnessed-test-nonce-617',...signWindow};
 const input=await f.signed(payload,canonicalTest617);
 const config={issuer,readback:f.readback,ledgerHead:f.head,ledgerSequence:1,
  originalCustodyAuthenticated:true,authority:async id=>f.roots[id],
  pins:f.pins,now,cryptoApi:webcrypto};
 const result=await verifyTestPreflight617(input,config);
 assert.equal(result.provider_test_executed,false);
 assert.equal(result.provider_action_authorized,false);
 assert.equal(result.authority_activated,false);
 await assert.rejects(verifyTestPreflight617(input,{...config,
  originalCustodyAuthenticated:false}));
 await assert.rejects(verifyTestPreflight617(input,{...config,
  issuer:{...issuer,status:'QUARANTINED'}}));
 await assert.rejects(verifyTestPreflight617(input,{...config,
  ledgerHead:'f'.repeat(64)}));
 await assert.rejects(verifyTestPreflight617(input,{...config,pins:{}}));
 assert.throws(()=>canonicalTest617({...payload,action:'PUBLISH'},now));
 assert.throws(()=>canonicalTest617({...payload,channel:'UNKNOWN'},now));
});
test('Build 617 server, immutable proposed D1 and UI remain release-gated',async()=>{
 const req=new Request('https://devilndove.com/api/admin/trust-readback-617');
 assert.equal((await onRequestGet({request:req,env:{}})).status,401);
 assert.equal((await onRequestPost({request:req,env:{}})).status,401);
 const api=read('functions/api/admin/trust-readback-617.js');
 assert.match(api,/requireAdminStepUp/);
 assert.match(api,/EXTERNALLY_AUTHENTICATED/);
 assert.match(api,/INDEPENDENTLY_APPROVED/);
 assert.doesNotMatch(api,/UPDATE\s+dd614_authorities|UPDATE\s+dd616_key_quarantines|etsy\.com\/v3|graph\.facebook\.com|provider_action_authorized:\s*true/i);
 const sql=read('migrations/proposed/0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql');
 assert.match(sql,/PROPOSED ONLY/);
 for(const trigger of ['dd617_custodian_no_update','dd617_custodian_no_delete',
  'dd617_readback_no_update','dd617_readback_no_delete',
  'dd617_recovery_no_update','dd617_test_no_delete'])
  assert.match(sql,new RegExp(trigger));
 const validation=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify([
  'migrations/proposed/0052_devilndove_build614_external_authority_hold.sql',
  'migrations/proposed/0053_devilndove_build615_custody_ceremony_hold.sql',
  'migrations/proposed/0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
  'migrations/proposed/0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql'])}: c.executescript(open(f).read())\nfor t in ['dd617_anchor_custodians','dd617_external_readbacks','dd617_quarantine_recovery_packets','dd617_witnessed_test_preflights']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nprint('PROPOSED_MIGRATION_EPHEMERAL_ONLY')`;
 assert.match(execFileSync('python3',['-c',validation],{cwd:new URL('..',import.meta.url),encoding:'utf8'}),
  /PROPOSED_MIGRATION_EPHEMERAL_ONLY/);
 assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/38\. Original external anchor/);
 assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=61[789]/);
 assert.match(read('.github/workflows/current-application-quality.yml'),
  /release467_build617_external_readback_recovery_test\.test\.mjs/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":61[789]/);
});
