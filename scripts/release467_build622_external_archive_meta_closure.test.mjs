import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {HOLD_622,ARCHIVE_GRANT_622,ARCHIVE_BYTES_622,META_CLOSE_622,
  canonicalArchiveGrant622,canonicalMetaClosure622,exactArchiveUrl622,
  verifyArchiveGrant622,fetchOriginalArchive622,archiveFailure622,
  verifyMetaClosure622} from '../functions/api/_lib/trustArchive622.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-archive-meta-622.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const now='2026-11-06T19:15:00.000Z',H=x=>x.repeat(64);
const times={issued_at:'2026-11-06T19:10:00.000Z',
  expires_at:'2026-11-06T19:25:00.000Z'};
const b64=x=>Buffer.from(x).toString('base64url');
async function authorities(){
  const ids={ISSUER:'source-original-issuer-622',WITNESS:'separate-external-witness-622',
    OWNER:'original-independent-owner-622'},roots={},pins={},keys={};
  for(const [role,id] of Object.entries(ids)){
    const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const pub=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
    const hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',pub)).toString('hex');
    roots[id]={authority_id:id,role,public_key:b64(pub),key_sha256:hash,
      status:'ACTIVE_EXTERNAL_VERIFIED'};pins[id]=hash;keys[id]=pair.privateKey;
  }
  return {ids,roots,pins,async sign(payload,canonical){const s=canonical(payload,now);
    return {payload,signatures:await Promise.all(['ISSUER','WITNESS','OWNER'].map(
      async role=>({role,authority_id:ids[role],signature:b64(await webcrypto.subtle.sign(
        'Ed25519',keys[ids[role]],new TextEncoder().encode(s)))})))};}};
}

test('622 exact original archive URL denies SSRF and independently signed one-use readback grant',async()=>{
  const f=await authorities(),archiveUrl='https://archive.original-maker.example.net/immutable/history-622.json';
  const p={format:ARCHIVE_GRANT_622,manifest_sha256:H('a'),history_sha256:H('b'),
    checkpoint_sha256:H('c'),archive_url:archiveUrl,
    test_nonce:'single-original-external-read-622',
    decision:'ONE_READ_ONLY_ORIGINAL_ARCHIVE_GET',...times};
  const bundle=await f.sign(p,canonicalArchiveGrant622);
  const history={manifest_sha256:p.manifest_sha256,history_sha256:p.history_sha256,
    checkpoint_sha256:p.checkpoint_sha256,original_source_sha256:H('d'),
    external_custody_ref:p.archive_url,
    status:'ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING'};
  const checkpoint={checkpoint_sha256:p.checkpoint_sha256,
    status:'EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING',
    ledger_head_sha256:H('e'),ledger_sequence:5,
    original_issuer_source_sha256:H('d'),custodian_id:'original-custodian-622'};
  const config={history,checkpoint,ledger:{event_hash:H('e'),sequence:5},
    currentHistory:{history_sha256:p.history_sha256,complete_history_read:true},
    custodian:{custodian_id:'original-custodian-622',
      origin:'https://archive.original-maker.example.net',status:'INDEPENDENTLY_APPROVED'},
    source:{authority_id:f.ids.ISSUER,original_source_sha256:H('d'),
      status:'INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE'},
    roots:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
  const verified=await verifyArchiveGrant622(bundle,config);
  assert.equal(verified.original_custodian_verified,true);
  assert.equal(verified.provider_called,false);
  assert.equal(verified.release_gate,HOLD_622);
  await assert.rejects(verifyArchiveGrant622(bundle,{...config,pins:{}}));
  await assert.rejects(verifyArchiveGrant622(bundle,{...config,
    currentHistory:{history_sha256:H('f'),complete_history_read:true}}));
  await assert.rejects(verifyArchiveGrant622(bundle,{...config,
    custodian:{...config.custodian,origin:'https://different.example.net'}}));
  await assert.rejects(verifyArchiveGrant622(bundle,{...config,
    roots:async id=>({...f.roots[id],status:'QUARANTINED'})}));
  await assert.rejects(verifyArchiveGrant622({...bundle,payload:{...p,
    archive_url:'https://other.example.net/history.json'}},config));
  for(const invalid of ['https://127.0.0.1/internal','http://external.example.net/original',
    'https://archive.example.net/?access_token=secret','https://localhost/receipt',
    'https://internal.local/archive','https://archive.example.net:444/archive'])
    assert.throws(()=>exactArchiveUrl622(invalid,new URL(invalid).origin));
  assert.throws(()=>canonicalArchiveGrant622({...p,decision:'POST_TO_META'},now));
});

test('622 genuine bounded HTTPS external archive readback matches exact complete history bytes',async()=>{
  const history={manifest_sha256:H('a'),history_sha256:H('b'),counts_sha256:H('c'),
    checkpoint_sha256:H('d'),ledger_head_sha256:H('e'),ledger_sequence:'7',
    external_receipt_sha256:H('f')};
  const payload={format:ARCHIVE_BYTES_622,
    history_manifest_sha256:history.manifest_sha256,history_sha256:history.history_sha256,
    counts_sha256:history.counts_sha256,checkpoint_sha256:history.checkpoint_sha256,
    ledger_head_sha256:history.ledger_head_sha256,
    ledger_sequence:history.ledger_sequence,external_receipt_sha256:history.external_receipt_sha256,
    archived_at:'2026-11-06T19:14:00.000Z'};
  let calls=0,method;
  const url='https://archive.original-maker.example.net/immutable/history-622.json';
  const probe=async response=>fetchOriginalArchive622({url,
    origin:'https://archive.original-maker.example.net',history,
    fetchFn:async(_url,opts)=>{calls++;method=opts.method;
      assert.equal(_url,url);assert.equal(opts.redirect,'manual');
      assert.equal(opts.credentials,'omit');assert.equal(opts.headers.Authorization,undefined);
      return response;},cryptoApi:webcrypto});
  const exact=await probe(new Response(JSON.stringify(payload),{status:200,
    headers:{'content-type':'application/json'}}));
  assert.equal(exact.external_archive_bytes_matched,true);
  assert.equal(exact.external_archive_get_performed,true);
  assert.equal(exact.provider_call_performed,false);
  assert.equal(method,'GET');assert.equal(calls,1);
  assert.match(exact.archive_readback_sha256,/^[a-f0-9]{64}$/);
  await assert.rejects(fetchOriginalArchive622({url,
    origin:'https://archive.original-maker.example.net',
    history:{...history,signed_at:'2026-11-06T19:15:00.000Z'},
    fetchFn:async()=>new Response(JSON.stringify(payload),{status:200,
      headers:{'content-type':'application/json'}}),cryptoApi:webcrypto}));
  await assert.rejects(probe(new Response(JSON.stringify({...payload,history_sha256:H('0')}),
    {status:200,headers:{'content-type':'application/json'}})));
  await assert.rejects(probe(new Response(JSON.stringify({...payload,customer:'leak'}),
    {status:200,headers:{'content-type':'application/json'}})));
  await assert.rejects(probe(new Response('',{status:302,headers:{location:'https://elsewhere.example.org'}})));
  await assert.rejects(probe(new Response('x'.repeat(9000),{status:200,
    headers:{'content-type':'application/json'}})));
  assert.equal(archiveFailure622(Object.assign(Error('timed out'),{name:'AbortError'})),'TIMEOUT');
  assert.equal(archiveFailure622(new TypeError('network')),'NETWORK_ERROR');
  assert.equal(archiveFailure622(new Error('mismatch')),'MISMATCHED_EXTERNAL_BYTES');
});

test('622 independently signed real Meta closure needs spent GET, actual witness and genuine external archive',async()=>{
  const f=await authorities();
  const p={format:META_CLOSE_622,grant_id:'original-meta-grant-622',
    test_nonce:'single-original-meta-get-622',meta_approval_sha256:H('a'),
    meta_receipt_sha256:H('b'),witness_acceptance_sha256:H('c'),
    expected_page_id:'123456789',checkpoint_sha256:H('d'),
    history_manifest_sha256:H('e'),archive_readback_sha256:H('f'),
    decision:'CLOSE_ONE_WITNESSED_META_PAGE_ID_GET_NO_CONNECTION_OR_PUBLISH',
    nonce:'single-independent-meta-closure-nonce-622',...times};
  const signed=await f.sign(p,canonicalMetaClosure622);
  const config={grant:{grant_id:p.grant_id,test_nonce:p.test_nonce,
      approval_sha256:p.meta_approval_sha256,expected_page_id:p.expected_page_id,
      checkpoint_sha256:p.checkpoint_sha256,status:'INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ',
      issuer_authority_id:f.ids.ISSUER,original_source_sha256:H('1')},
    attempt:{test_nonce:p.test_nonce,grant_id:p.grant_id,
      status:'CLAIMED_EXACTLY_ONE_META_PAGE_GET'},
    receipt:{test_nonce:p.test_nonce,receipt_sha256:p.meta_receipt_sha256,
      remote_page_id:p.expected_page_id,status:'META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS'},
    failure:null,witnessed:{test_nonce:p.test_nonce,grant_id:p.grant_id,
      acceptance_sha256:p.witness_acceptance_sha256,
      receipt_sha256:p.meta_receipt_sha256,history_manifest_sha256:p.history_manifest_sha256,
      status:'WITNESSED_ONE_META_PAGE_ID_GET_NO_CONNECTED_CLAIM'},
    archive:{manifest_sha256:p.history_manifest_sha256,
      archive_readback_sha256:p.archive_readback_sha256,
      status:'EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY'},
    history:{manifest_sha256:p.history_manifest_sha256,checkpoint_sha256:p.checkpoint_sha256},
    metaSource:{authority_id:f.ids.ISSUER,original_source_sha256:H('1'),
      status:'INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE'},
    roots:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
  const done=await verifyMetaClosure622(signed,config);
  assert.equal(done.genuine_provider_test_receipt_witnessed,true);
  assert.equal(done.original_external_history_verified,true);
  assert.equal(done.connected,false);assert.equal(done.provider_write,false);
  await assert.rejects(verifyMetaClosure622(signed,{...config,archive:null}));
  await assert.rejects(verifyMetaClosure622(signed,{...config,witnessed:null}));
  await assert.rejects(verifyMetaClosure622(signed,{...config,receipt:null}));
  await assert.rejects(verifyMetaClosure622(signed,{...config,failure:{test_nonce:p.test_nonce}}));
  await assert.rejects(verifyMetaClosure622(signed,{...config,pins:{}}));
  await assert.rejects(verifyMetaClosure622(signed,{...config,
    receipt:{...config.receipt,remote_page_id:'0'}}));
  await assert.rejects(verifyMetaClosure622(signed,{...config,
    archive:{...config.archive,archive_readback_sha256:H('0')}}));
  assert.throws(()=>canonicalMetaClosure622({...p,decision:'PUBLISH'},now));
});

test('622 endpoint stays admin+step-up only, proposed D1 schema immutable, no live provider write',async()=>{
  const request=new Request('https://devilndove.com/api/admin/trust-archive-meta-622');
  assert.equal((await onRequestGet({request,env:{}})).status,401);
  assert.equal((await onRequestPost({request,env:{}})).status,401);
  const api=read('functions/api/admin/trust-archive-meta-622.js'),
    sql=read('migrations/proposed/0060_devilndove_build622_external_archive_meta_closure_hold.sql');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/SINGLE_ORIGINAL_ARCHIVE_GET_NONCE_SPENT/);
  assert.match(api,/fetchOriginalArchive622/);
  assert.match(api,/verifyMetaGrant620/);
  assert.match(api,/verifyMetaWitness621/);
  assert.match(sql,/PROPOSED ONLY/);
  assert.doesNotMatch(api,/INSERT INTO dd614_authorities|INSERT INTO dd620_meta_original_source_registrations|UPDATE\s+dd616_key_quarantines|POST \/me\/feed|method:'POST',redirect:'follow'/i);
  for(const name of ['dd622_attempt_no_update','dd622_attempt_no_delete',
    'dd622_archive_no_update','dd622_archive_no_delete',
    'dd622_failure_no_update','dd622_failure_no_delete',
    'dd622_closure_no_update','dd622_closure_no_delete'])
    assert.match(sql,new RegExp(name));
  const files=[
    '0052_devilndove_build614_external_authority_hold.sql',
    '0053_devilndove_build615_custody_ceremony_hold.sql',
    '0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
    '0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql',
    '0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql',
    '0057_devilndove_build619_receipt_failure_meta_preflight_hold.sql',
    '0058_devilndove_build620_meta_original_grants_and_test_hold.sql',
    '0059_devilndove_build621_etsy_history_meta_witness_hold.sql',
    '0060_devilndove_build622_external_archive_meta_closure_hold.sql'];
  const code=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify(files.map(f=>'migrations/proposed/'+f))}: c.executescript(open(f).read())\nfor t in ['dd622_archive_attempts','dd622_archive_readbacks','dd622_archive_failures','dd622_meta_test_closures']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nprint('622_IMMUTABLE_SOURCE_ONLY_IN_MEMORY')`;
  assert.match(execFileSync('python3',['-c',code],{cwd:new URL('..',import.meta.url),
    encoding:'utf8'}),/622_IMMUTABLE_SOURCE_ONLY_IN_MEMORY/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/43\. Verified external original archive/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=623/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":623/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build622_external_archive_meta_closure\.test\.mjs/);
});
