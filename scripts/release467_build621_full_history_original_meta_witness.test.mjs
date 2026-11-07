import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {sha256} from '../functions/api/_lib/trustAuthority614.js';
import {HOLD_621,HISTORY_621,META_ACCEPT_621,canonicalHistory621,
  canonicalMetaAcceptance621,digestFullHistory621,verifyHistoryCheckpoint621,
  verifyMetaWitness621} from '../functions/api/_lib/trustHistory621.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-history-meta-621.js';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const now='2026-11-06T19:10:00.000Z';
const window={issued_at:'2026-11-06T19:00:00.000Z',
  expires_at:'2026-11-06T19:20:00.000Z'};
const H=x=>x.repeat(64),b64=x=>Buffer.from(x).toString('base64url');
const TABLES=['dd618_original_test_grants','dd618_provider_test_attempts',
  'dd618_provider_test_outcomes','dd618_provider_test_acceptances',
  'dd619_etsy_failure_custody','dd619_etsy_failure_dispositions'];

function memoryDb(records){
  return {prepare(sql){const table=TABLES.find(t=>sql.includes('FROM '+t));
    if(!table)throw Error('Unexpected database access in full scan.');
    return {async first(){const rows=records[table]||[];
      return {n:rows.length,last_id:rows.length?rows.at(-1).source_rowid:null};},
    bind(after){return {async all(){return {results:(records[table]||[])
      .filter(r=>r.source_rowid>after).slice(0,128)};}};}};}};
}
async function signerFixture(){
  const ids={ISSUER:'original-independent-issuer-621',WITNESS:'external-witness-621',
    OWNER:'original-owner-621'},roots={},pins={},privateKeys={};
  for(const [role,id] of Object.entries(ids)){
    const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const pub=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
    const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',pub)).toString('hex');
    roots[id]={authority_id:id,role,public_key:b64(pub),key_sha256:fp,
      status:'ACTIVE_EXTERNAL_VERIFIED'};pins[id]=fp;privateKeys[id]=pair.privateKey;
  }
  return {ids,roots,pins,async sign(payload,canonical){const message=new TextEncoder().encode(
    canonical(payload,now));return {payload,signatures:await Promise.all(
    ['ISSUER','WITNESS','OWNER'].map(async role=>({role,authority_id:ids[role],
      signature:b64(await webcrypto.subtle.sign('Ed25519',privateKeys[ids[role]],message))})))};}};
}

test('621 exact full history hashes all 281 rows with keyset pagination and rejects mutation, bounds, incomplete scan',async()=>{
  const rows=Array.from({length:281},(_,i)=>({source_rowid:i+1,
    grant_id:'exact-original-grant-'+i,provider:'ETSY',status:'INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET'}));
  const data=Object.fromEntries(TABLES.map(t=>[t,t===TABLES[0]?rows:[]]));
  const original=await digestFullHistory621(memoryDb(data),{cryptoApi:webcrypto});
  assert.equal(original.complete_history_read,true);
  assert.equal(original.tables[0].rows,281);
  assert.equal(original.tables[1].rows,0);
  assert.equal(original.provider_contacted,false);
  assert.match(original.history_sha256,/^[a-f0-9]{64}$/);
  data[TABLES[0]]=rows.map(r=>({...r}));data[TABLES[0]][200].grant_id='altered-old-receipt';
  const changed=await digestFullHistory621(memoryDb(data),{cryptoApi:webcrypto});
  assert.notEqual(changed.history_sha256,original.history_sha256);
  await assert.rejects(digestFullHistory621(memoryDb(data),{maxPages:1,cryptoApi:webcrypto}),
    /bounded full-scan/);
  const unstable=memoryDb(data),old=unstable.prepare;
  let reads=0;unstable.prepare=sql=>{const stmt=old(sql);
    if(sql.includes('COUNT(*)')&&++reads===2)return {first:async()=>({n:0,last_id:null})};
    return stmt;};
  await assert.rejects(digestFullHistory621(unstable,{cryptoApi:webcrypto}),
    /Concurrent, incomplete/);
});

test('621 independent 3-signature complete-history anchor requires original source and external custodian',async()=>{
  const f=await signerFixture(),counts={grants:1,attempts:0,outcomes:0,acceptances:0,
    failures:0,dispositions:0,orphan_attempts:0,orphan_outcomes:0,
    orphan_acceptances:0,orphan_failures:0,orphan_dispositions:0,
    dual_outcomes:0,invalid_grants:0,invalid_failure_approvals:0};
  const snapshot={complete_history_read:true,history_sha256:H('a'),
    tables:TABLES.map((table,i)=>({table,rows:i===0?1:0,root_sha256:H('b')}))};
  const p={format:HISTORY_621,history_sha256:snapshot.history_sha256,
    counts_sha256:await sha256(JSON.stringify(counts),webcrypto),
    ledger_head_sha256:H('c'),ledger_sequence:'5',checkpoint_sha256:H('d'),
    original_source_sha256:H('e'),external_receipt_sha256:H('f'),
    external_custody_ref:'https://trusted-original.example.net/immutable/receipt',
    decision:'ATTEST_COMPLETE_IMMUTABLE_ETSY_HISTORY_NO_PROVIDER_ACTION',
    nonce:'independent-history-621-signature-nonce',...window};
  const signed=await f.sign(p,canonicalHistory621);
  const config={snapshot,counts,ledger:{event_hash:p.ledger_head_sha256,sequence:5},
    checkpoint:{checkpoint_sha256:p.checkpoint_sha256,
      ledger_head_sha256:p.ledger_head_sha256,ledger_sequence:5,
      original_issuer_source_sha256:p.original_source_sha256,
      readback_sha256:p.external_receipt_sha256,
      custodian_id:'independent-original-custodian-621',
      status:'EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'},
    custodian:{custodian_id:'independent-original-custodian-621',
      origin:'https://trusted-original.example.net',status:'INDEPENDENTLY_APPROVED'},
    originalSource:{authority_id:f.ids.ISSUER,original_source_sha256:p.original_source_sha256,
      status:'INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE'},
    roots:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
  const result=await verifyHistoryCheckpoint621(signed,config);
  assert.equal(result.independent_signatures_verified,true);
  assert.equal(result.external_archive_readback_verified,false);
  assert.equal(result.provider_action_authorized,false);
  assert.equal(result.release_gate,HOLD_621);
  await assert.rejects(verifyHistoryCheckpoint621(signed,{...config,pins:{}}));
  await assert.rejects(verifyHistoryCheckpoint621(signed,{...config,custodian:null}));
  await assert.rejects(verifyHistoryCheckpoint621(signed,{...config,
    counts:{...counts,grants:2}}));
  await assert.rejects(verifyHistoryCheckpoint621(signed,{...config,
    snapshot:{...snapshot,history_sha256:H('0')}}));
  await assert.rejects(verifyHistoryCheckpoint621(signed,{...config,
    originalSource:{...config.originalSource,authority_id:'different-issuer-621'}}));
  await assert.rejects(verifyHistoryCheckpoint621({...signed,payload:{...p,nonce:'tampered-history-nonce-621'}},config));
  assert.throws(()=>canonicalHistory621({...p,external_custody_ref:
    'https://trusted-original.example.net/?access_token=exposed'},now));
});

test('621 genuine Meta Page GET witness denies absent/replayed/failing receipt and rotated keys',async()=>{
  const f=await signerFixture(),p={format:META_ACCEPT_621,
    grant_id:'original-meta-grant-621',test_nonce:'original-meta-one-test-621',
    meta_approval_sha256:H('a'),receipt_sha256:H('b'),expected_page_id:'123456789',
    checkpoint_sha256:H('c'),etsy_history_sha256:H('d'),
    decision:'WITNESS_ONE_ACTUAL_META_PAGE_ID_GET_ONLY_NO_PUBLICATION',
    nonce:'meta-actual-get-witness-621',...window};
  const signed=await f.sign(p,canonicalMetaAcceptance621);
  const config={grant:{grant_id:p.grant_id,test_nonce:p.test_nonce,
      approval_sha256:p.meta_approval_sha256,checkpoint_sha256:p.checkpoint_sha256,
      expected_page_id:p.expected_page_id,status:'INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ',
      issuer_authority_id:f.ids.ISSUER,original_source_sha256:H('e')},
    attempt:{grant_id:p.grant_id,test_nonce:p.test_nonce,status:'CLAIMED_EXACTLY_ONE_META_PAGE_GET'},
    receipt:{test_nonce:p.test_nonce,receipt_sha256:p.receipt_sha256,
      remote_page_id:p.expected_page_id,status:'META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS'},
    failure:null,history:{history_sha256:p.etsy_history_sha256,
      checkpoint_sha256:p.checkpoint_sha256,
      status:'ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING'},
    metaSource:{authority_id:f.ids.ISSUER,original_source_sha256:H('e'),
      status:'INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE'},
    roots:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
  const verified=await verifyMetaWitness621(signed,config);
  assert.equal(verified.witnessed_actual_meta_page_get,true);
  assert.equal(verified.connected,false);
  assert.equal(verified.meta_publishing,false);
  await assert.rejects(verifyMetaWitness621(signed,{...config,receipt:null}));
  await assert.rejects(verifyMetaWitness621(signed,{...config,failure:{test_nonce:p.test_nonce}}));
  await assert.rejects(verifyMetaWitness621(signed,{...config,pins:{}}));
  await assert.rejects(verifyMetaWitness621(signed,{...config,
    receipt:{...config.receipt,remote_page_id:'111'}}));
  await assert.rejects(verifyMetaWitness621(signed,{...config,
    attempt:{...config.attempt,status:'UNSPENT'}}));
  await assert.rejects(verifyMetaWitness621(signed,{...config,
    history:{...config.history,checkpoint_sha256:H('1')}}));
  await assert.rejects(verifyMetaWitness621(signed,{...config,
    roots:async id=>({...f.roots[id],status:id===f.ids.WITNESS?'QUARANTINED':'ACTIVE_EXTERNAL_VERIFIED'})}));
  assert.throws(()=>canonicalMetaAcceptance621({...p,decision:'PUBLISH'},now));
});

test('621 proposed D1 migration remains immutable and no automatic source enrollment/provider call',async()=>{
  const req=new Request('https://devilndove.com/api/admin/trust-history-meta-621');
  assert.equal((await onRequestGet({request:req,env:{}})).status,401);
  assert.equal((await onRequestPost({request:req,env:{}})).status,401);
  const api=read('functions/api/admin/trust-history-meta-621.js');
  const ui=read('public/js/admin-channel-trust-authority-614.mjs');
  const sql=read('migrations/proposed/0059_devilndove_build621_etsy_history_meta_witness_hold.sql');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/digestFullHistory621/);
  assert.match(api,/verifyMetaGrant620/);
  assert.match(api,/dd621_meta_get_witness_acceptances/);
  assert.match(ui,/42\. Original Etsy audit checkpoint/);
  assert.doesNotMatch(api,/INSERT INTO dd620_meta_original_source_registrations|UPDATE dd614_authorities|POST \/me\/feed|method:'POST',redirect:'follow'/i);
  assert.match(sql,/PROPOSED ONLY/);
  for(const trigger of ['dd621_history_no_update','dd621_history_no_delete',
    'dd621_witness_no_update','dd621_witness_no_delete'])assert.match(sql,new RegExp(trigger));
  const files=[52,53,54,55,56,57,58,59].map(n=>({52:'0052_devilndove_build614_external_authority_hold.sql',
    53:'0053_devilndove_build615_custody_ceremony_hold.sql',
    54:'0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
    55:'0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql',
    56:'0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql',
    57:'0057_devilndove_build619_receipt_failure_meta_preflight_hold.sql',
    58:'0058_devilndove_build620_meta_original_grants_and_test_hold.sql',
    59:'0059_devilndove_build621_etsy_history_meta_witness_hold.sql'}[n]));
  const code=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify(files.map(f=>'migrations/proposed/'+f))}: c.executescript(open(f).read())\nfor t in ['dd621_etsy_history_checkpoints','dd621_meta_get_witness_acceptances']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nprint('621_MIGRATION_IN_MEMORY_ONLY')`;
  assert.match(execFileSync('python3',['-c',code],{cwd:new URL('..',import.meta.url),
    encoding:'utf8'}),/621_MIGRATION_IN_MEMORY_ONLY/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=624/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build621_full_history_original_meta_witness\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":624/);
});
