import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {HOLD_623,COMPLETION_623,CONTINUITY_623,ACTIVATION_623,
  canonicalCompletion623,canonicalContinuity623,canonicalActivation623,
  verifyOriginalCompletion623,verifyArchiveContinuity623,verifyReadOnlyWindow623}
  from '../functions/api/_lib/trustActivation623.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-activation-623.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const H=c=>c.repeat(64),now='2026-11-06T21:20:00.000Z';
const issued_at='2026-11-06T21:15:00.000Z';
const expires_at='2026-11-06T21:25:00.000Z';
const b64=x=>Buffer.from(x).toString('base64url');
async function signers(){
  const ids={ISSUER:'original-meta-issuer-623',WITNESS:'independent-witness-623',
    OWNER:'separate-owner-623'},roots={},pins={},keys={};
  for(const [role,id] of Object.entries(ids)){
    const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
    const hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
    roots[id]={authority_id:id,role,public_key:b64(raw),key_sha256:hash,
      status:'ACTIVE_EXTERNAL_VERIFIED'};pins[id]=hash;keys[id]=pair.privateKey;
  }
  return {ids,roots,pins,async sign(payload,canonical){const text=canonical(payload,now);
    return {payload,signatures:await Promise.all(['ISSUER','WITNESS','OWNER'].map(async role=>({
      role,authority_id:ids[role],signature:b64(await webcrypto.subtle.sign('Ed25519',
        keys[ids[role]],new TextEncoder().encode(text)))})))};}};
}
const source={grant_id:'original-meta-grant-623',test_nonce:'one-exact-meta-page-get-623',
  meta_closure_sha256:H('a'),archive_readback_sha256:H('b'),
  original_source_sha256:H('c'),page_id:'123456789',scopes_sha256:H('d'),
  history_manifest_sha256:H('e'),owner_ledger_head_sha256:H('f')};
const fixtures={
  grant:{grant_id:source.grant_id,test_nonce:source.test_nonce,
    issuer_authority_id:'original-meta-issuer-623',
    original_source_sha256:source.original_source_sha256,
    expected_page_id:source.page_id,scopes_sha256:source.scopes_sha256,
    status:'INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'},
  closure:{closure_sha256:source.meta_closure_sha256,test_nonce:source.test_nonce,
    archive_readback_sha256:source.archive_readback_sha256,
    status:'ORIGINAL_META_SINGLE_GET_WITNESSED_READ_ONLY_NO_CONNECTION'},
  archive:{archive_readback_sha256:source.archive_readback_sha256,
    status:'EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY'},
  metaSource:{authority_id:'original-meta-issuer-623',
    original_source_sha256:source.original_source_sha256,
    status:'INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE'}
};

test('623 original Meta issuer/witness/owner completion needs actual prior real GET closure and original source',async()=>{
  const f=await signers(),p={format:COMPLETION_623,grant_id:source.grant_id,
    test_nonce:source.test_nonce,meta_closure_sha256:source.meta_closure_sha256,
    archive_readback_sha256:source.archive_readback_sha256,
    issuer_authority_id:f.ids.ISSUER,original_source_sha256:source.original_source_sha256,
    page_id:source.page_id,scopes_sha256:source.scopes_sha256,
    owner_decision:'COMPLETE_ORIGINAL_META_CUSTODY_FOR_ONE_READ_ONLY_TEST_WINDOW',
    nonce:'unique-external-completion-623',issued_at,expires_at};
  const bundle=await f.sign(p,canonicalCompletion623);
  const conf={...fixtures,roots:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
  const result=await verifyOriginalCompletion623(bundle,conf);
  assert.equal(result.original_authority_evidence_signed,true);
  assert.equal(result.root_enrolled_by_application,false);
  assert.equal(result.provider_connection_activated,false);
  assert.equal(result.release_gate,HOLD_623);
  await assert.rejects(verifyOriginalCompletion623(bundle,{...conf,archive:null}));
  await assert.rejects(verifyOriginalCompletion623(bundle,{...conf,closure:null}));
  await assert.rejects(verifyOriginalCompletion623(bundle,{...conf,metaSource:null}));
  await assert.rejects(verifyOriginalCompletion623(bundle,{...conf,pins:{}}));
  await assert.rejects(verifyOriginalCompletion623(bundle,{...conf,
    roots:async id=>({...f.roots[id],status:'QUARANTINED'})}));
  await assert.rejects(verifyOriginalCompletion623({...bundle,
    payload:{...p,page_id:'999'}},conf));
  assert.throws(()=>canonicalCompletion623({...p,owner_decision:'PUBLISH_TO_META'},now));
});

test('623 archive continuity requires two distinct, chronologically separate genuine original archive GET receipts',async()=>{
  const f=await signers(),p={format:CONTINUITY_623,
    history_manifest_sha256:source.history_manifest_sha256,
    first_archive_nonce:'first-original-archive-read-623',
    first_readback_sha256:source.archive_readback_sha256,
    second_archive_nonce:'second-original-archive-read-623',
    second_readback_sha256:H('9'),original_source_sha256:source.original_source_sha256,
    owner_decision:'WITNESS_TWO_SEPARATE_ORIGINAL_ARCHIVE_READBACKS_NO_PROVIDER_ACTION',
    nonce:'unique-archive-continuity-623',issued_at,expires_at};
  const signed=await f.sign(p,canonicalContinuity623);
  const config={history:{manifest_sha256:p.history_manifest_sha256,
      original_source_sha256:p.original_source_sha256,
      status:'ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING'},
    originalSource:{authority_id:f.ids.ISSUER,
      original_source_sha256:p.original_source_sha256,
      status:'INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE'},
    first:{test_nonce:p.first_archive_nonce,archive_readback_sha256:p.first_readback_sha256,
      manifest_sha256:p.history_manifest_sha256,
      status:'EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY',
      created_at:'2026-11-06 21:12:00'},
    second:{test_nonce:p.second_archive_nonce,archive_readback_sha256:p.second_readback_sha256,
      manifest_sha256:p.history_manifest_sha256,
      status:'EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY',
      created_at:'2026-11-06 21:13:00'},firstFailure:null,secondFailure:null,
    roots:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
  const result=await verifyArchiveContinuity623(signed,config);
  assert.equal(result.two_separate_original_archive_receipts,true);
  assert.equal(result.provider_call_performed,false);
  await assert.rejects(verifyArchiveContinuity623(signed,{...config,secondFailure:{}}));
  await assert.rejects(verifyArchiveContinuity623(signed,{...config,second:{...config.second,
    created_at:'2026-11-06 21:12:10'}}));
  await assert.rejects(verifyArchiveContinuity623(signed,{...config,first:null}));
  await assert.rejects(verifyArchiveContinuity623(signed,{...config,pins:{}}));
  await assert.rejects(verifyArchiveContinuity623(signed,{...config,history:{...config.history,
    manifest_sha256:H('0')}}));
  assert.throws(()=>canonicalContinuity623({...p,
    second_archive_nonce:p.first_archive_nonce},now));
});

test('623 ten-minute stored Meta Page-ID view expires, revokes on drift, and never connects or posts',async()=>{
  const f=await signers(),p={format:ACTIVATION_623,
    completion_sha256:H('1'),continuity_sha256:H('2'),
    meta_closure_sha256:source.meta_closure_sha256,grant_id:source.grant_id,
    test_nonce:source.test_nonce,page_id:source.page_id,
    scopes_sha256:source.scopes_sha256,history_manifest_sha256:source.history_manifest_sha256,
    owner_ledger_head_sha256:source.owner_ledger_head_sha256,
    owner_decision:'ONE_SHORT_LIVED_STORED_META_PAGE_ID_READ_ONLY_VIEW_NO_PROVIDER_CALL',
    nonce:'unique-readonly-meta-page-window-623',issued_at,expires_at};
  const signed=await f.sign(p,canonicalActivation623);
  const config={completion:{completion_sha256:p.completion_sha256,
      meta_closure_sha256:p.meta_closure_sha256,
      archive_readback_sha256:source.archive_readback_sha256,
      issuer_authority_id:f.ids.ISSUER,
      status:'ORIGINAL_META_CUSTODY_SIGNED_PENDING_SEPARATE_ARCHIVE_CONTINUITY'},
    continuity:{continuity_sha256:p.continuity_sha256,
      history_manifest_sha256:p.history_manifest_sha256,
      first_readback_sha256:source.archive_readback_sha256,second_readback_sha256:H('9'),
      status:'TWO_INDEPENDENT_ORIGINAL_ARCHIVE_READBACKS_SIGNED'},
    closure:fixtures.closure,
    history:{manifest_sha256:p.history_manifest_sha256,history_sha256:H('3')},
    liveHistory:{complete_history_read:true,history_sha256:H('3')},
    grant:fixtures.grant,ledger:{event_hash:p.owner_ledger_head_sha256},
    meta:{provider_key:'meta',remote_subject_id:p.page_id,
      scopes_sha256:p.scopes_sha256,page_read_candidate:true},
    roots:async id=>f.roots[id],pins:f.pins,now,cryptoApi:webcrypto};
  const verified=await verifyReadOnlyWindow623(signed,config);
  assert.equal(verified.verified_stored_meta_page_identity_view,true);
  assert.equal(verified.connected,false);assert.equal(verified.provider_get_performed,false);
  assert.equal(verified.publishing_enabled,false);
  await assert.rejects(verifyReadOnlyWindow623(signed,{...config,
    now:'2026-11-06T21:26:00.000Z'}));
  await assert.rejects(verifyReadOnlyWindow623(signed,{...config,
    liveHistory:{complete_history_read:true,history_sha256:H('4')}}));
  await assert.rejects(verifyReadOnlyWindow623(signed,{...config,
    ledger:{event_hash:H('5')}}));
  await assert.rejects(verifyReadOnlyWindow623(signed,{...config,
    meta:{...config.meta,remote_subject_id:'8'}}));
  await assert.rejects(verifyReadOnlyWindow623(signed,{...config,
    meta:{...config.meta,scopes_sha256:H('9')}}));
  await assert.rejects(verifyReadOnlyWindow623(signed,{...config,pins:{}}));
  await assert.rejects(verifyReadOnlyWindow623(signed,{...config,
    continuity:{...config.continuity,first_readback_sha256:H('0')}}));
  assert.throws(()=>canonicalActivation623({...p,expires_at:'2026-11-06T21:27:00.000Z'},now));
});

test('623 UI and endpoint fail closed; 0061 SQLite immutable and migrations always proposed-only',async()=>{
  const request=new Request('https://devilndove.com/api/admin/trust-activation-623');
  assert.equal((await onRequestGet({request,env:{}})).status,401);
  assert.equal((await onRequestPost({request,env:{}})).status,401);
  const api=read('functions/api/admin/trust-activation-623.js');
  const sql=read('migrations/proposed/0061_devilndove_build623_original_meta_activation_hold.sql');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/verifyRecordedCompletion/);
  assert.match(api,/verifyRecordedContinuity/);
  assert.match(api,/verifyReadOnlyWindow623/);
  assert.doesNotMatch(api,/probeMetaPage620|fetchOriginalArchive622|fetch\s*\(|INSERT INTO dd614_authorities|UPDATE\s+oauth_provider_connections/i);
  assert.match(sql,/PROPOSED ONLY/);
  for(const name of ['dd623_completion_no_update','dd623_completion_no_delete',
    'dd623_continuity_no_update','dd623_continuity_no_delete',
    'dd623_window_no_update','dd623_window_no_delete'])
    assert.match(sql,new RegExp(name));
  const migrations=['0052_devilndove_build614_external_authority_hold.sql',
    '0053_devilndove_build615_custody_ceremony_hold.sql',
    '0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
    '0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql',
    '0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql',
    '0057_devilndove_build619_receipt_failure_meta_preflight_hold.sql',
    '0058_devilndove_build620_meta_original_grants_and_test_hold.sql',
    '0059_devilndove_build621_etsy_history_meta_witness_hold.sql',
    '0060_devilndove_build622_external_archive_meta_closure_hold.sql',
    '0061_devilndove_build623_original_meta_activation_hold.sql'];
  const code=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify(migrations.map(f=>'migrations/proposed/'+f))}: c.executescript(open(f).read())\nfor t in ['dd623_original_meta_completions','dd623_archive_continuity_witnesses','dd623_meta_readonly_windows']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nprint('623_PROPOSED_D1_IMMUTABLE_SOURCE_ONLY')`;
  assert.match(execFileSync('python3',['-c',code],{cwd:new URL('..',import.meta.url),
    encoding:'utf8'}),/623_PROPOSED_D1_IMMUTABLE_SOURCE_ONLY/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/44\. Owner-supervised Meta identity/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=625/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":625/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build623_original_meta_readonly_activation\.test\.mjs/);
});
