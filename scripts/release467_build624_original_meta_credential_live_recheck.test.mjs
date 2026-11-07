import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {META_ENDPOINT_620,probeMetaPage620} from '../functions/api/_lib/trustAuditMeta620.js';
import {HOLD_624,ENROLL_624,RECHECK_624,ACCEPT_624,
  canonicalEnrollment624,canonicalRecheck624,canonicalAcceptance624,
  verifyEnrollment624,verifyRecheckGrant624,verifyWitness624}
  from '../functions/api/_lib/trustEnrollment624.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-meta-live-624.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const H=x=>x.repeat(64),now='2026-11-06T21:20:00.000Z';
const issued_at='2026-11-06T21:15:00.000Z';
const b64=v=>Buffer.from(v).toString('base64url');
async function originalSigners(){
  const ids={ISSUER:'original-meta-issuer-624',WITNESS:'separate-meta-witness-624',
    OWNER:'original-page-owner-624'},roots={},pins={},keys={};
  for(const [role,id] of Object.entries(ids)){
    const key=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',key.publicKey));
    const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
    keys[id]=key.privateKey;pins[id]=fp;
    roots[id]={authority_id:id,role,public_key:b64(raw),key_sha256:fp,
      status:'ACTIVE_EXTERNAL_VERIFIED'};
  }
  return {ids,roots,pins,async sign(payload,canonical){const message=canonical(payload,now);
    return {payload,signatures:await Promise.all(['ISSUER','WITNESS','OWNER'].map(async role=>({
      role,authority_id:ids[role],signature:b64(await webcrypto.subtle.sign('Ed25519',
        keys[ids[role]],new TextEncoder().encode(message)))})))};}};
}
async function fixture(){
  const f=await originalSigners(),p={format:ENROLL_624,window_sha256:H('a'),
    meta_closure_sha256:H('b'),page_id:'112233445566',scopes_sha256:H('c'),
    encrypted_credential_sha256:H('d'),owner_ledger_head_sha256:H('e'),
    owner_decision:'ENROLL_ONLY_EXISTING_ENCRYPTED_META_PAGE_READ_CREDENTIAL',
    nonce:'original-encrypted-credential-enroll-624',issued_at,
    expires_at:'2026-11-06T21:25:00.000Z'};
  const scopes={window:{verified:true,window_sha256:p.window_sha256,
      expires_at:'2026-11-06T21:25:00.000Z'},
    meta:{page_id:p.page_id,scopes_sha256:p.scopes_sha256,
      encrypted_credential_sha256:p.encrypted_credential_sha256,
      access_expires_at:'2026-11-06T22:00:00.000Z',page_read_candidate:true,
      token_present:true},ledger:{event_hash:p.owner_ledger_head_sha256},
    issuer:{issuer_authority_id:f.ids.ISSUER,meta_closure_sha256:p.meta_closure_sha256,
      page_id:p.page_id},roots:async id=>f.roots[id],pins:f.pins,
    cryptoApi:webcrypto,now};
  const signed=await f.sign(p,canonicalEnrollment624);
  return {f,p,scopes,signed};
}

test('624 original three-signature enrollment binds existing ciphertext fingerprint; no token upload or refresh',async()=>{
  const {p,scopes,signed}=await fixture();
  const result=await verifyEnrollment624(signed,scopes);
  assert.equal(result.encrypted_credential_attested,true);
  assert.equal(result.token_values_emitted,false);
  assert.equal(result.token_refreshed,false);
  assert.equal(result.connected,false);
  assert.equal(result.release_gate,HOLD_624);
  await assert.rejects(verifyEnrollment624(signed,{...scopes,meta:{...scopes.meta,
    encrypted_credential_sha256:H('f')}}));
  await assert.rejects(verifyEnrollment624(signed,{...scopes,meta:{...scopes.meta,
    access_expires_at:'2026-11-06T21:25:00.000Z'}}));
  await assert.rejects(verifyEnrollment624(signed,{...scopes,pins:{}}));
  await assert.rejects(verifyEnrollment624(signed,{...scopes,
    roots:async id=>({...await scopes.roots(id),status:'QUARANTINED'})}));
  await assert.rejects(verifyEnrollment624({...signed,payload:{...p,page_id:'999'}},scopes));
  assert.throws(()=>canonicalEnrollment624({...p,owner_decision:'POST_TO_PAGE'},now));
});

test('624 exact live GET grant is one-use, ten-minute and cannot outlast original encrypted credential',async()=>{
  const {f,p,scopes,signed}=await fixture();
  const proof=await verifyEnrollment624(signed,scopes);
  const enrollment={enrollment_sha256:proof.enrollment_sha256,window_sha256:p.window_sha256,
    page_id:p.page_id,scopes_sha256:p.scopes_sha256,
    encrypted_credential_sha256:p.encrypted_credential_sha256,
    owner_ledger_head_sha256:p.owner_ledger_head_sha256,
    signed_bundle_json:JSON.stringify(signed),
    status:'ORIGINAL_META_EXISTING_ENCRYPTED_READ_CREDENTIAL_ATTESTED'};
  const q={format:RECHECK_624,authorization_id:'unique-original-meta-authorization-624',
    enrollment_sha256:proof.enrollment_sha256,window_sha256:p.window_sha256,
    page_id:p.page_id,scopes_sha256:p.scopes_sha256,
    encrypted_credential_sha256:p.encrypted_credential_sha256,
    owner_ledger_head_sha256:p.owner_ledger_head_sha256,
    test_nonce:'original-one-use-meta-get-nonce-624',endpoint:META_ENDPOINT_620,
    owner_decision:'ONE_EXACT_LIVE_META_PAGE_ID_GET_NO_RETRY_NO_PUBLISH',
    nonce:'original-one-use-page-id-grant-624',issued_at,
    expires_at:'2026-11-06T21:24:00.000Z'};
  const live=await f.sign(q,canonicalRecheck624),config={...scopes,enrollment};
  const result=await verifyRecheckGrant624(live,config);
  assert.equal(result.one_nonce_only,true);
  assert.equal(result.connected,false);assert.equal(result.provider_write,false);
  await assert.rejects(verifyRecheckGrant624(live,{...config,
    enrollment:{...enrollment,encrypted_credential_sha256:H('f')}}));
  await assert.rejects(verifyRecheckGrant624(live,{...config,meta:{...scopes.meta,
    token_present:false}}));
  await assert.rejects(verifyRecheckGrant624(live,{...config,pins:{}}));
  await assert.rejects(verifyRecheckGrant624(live,{...config,
    window:{...scopes.window,verified:false}}));
  assert.throws(()=>canonicalRecheck624({...q,endpoint:'POST /feed'},now));
  const tooLong={...q,issued_at:'2026-11-06T21:20:00.000Z',
    expires_at:'2026-11-06T21:26:00.000Z'};
  const tooLongSigned=await f.sign(tooLong,canonicalRecheck624);
  await assert.rejects(verifyRecheckGrant624(tooLongSigned,config));
});

test('624 actual live GET uses only authenticated Page-ID read endpoint, then independent witness must match real receipt',async()=>{
  let calls=0,method,actualUrl;
  const observed=await probeMetaPage620({token:'original-saved-token-TEST',
    expectedPageId:'112233445566',cryptoApi:webcrypto,
    fetchFn:async(url,options)=>{calls++;actualUrl=url;method=options.method;
      assert.equal(options.redirect,'manual');assert.equal(options.credentials,'omit');
      return new Response('{"id":"112233445566"}',{status:200,
        headers:{'content-type':'application/json'}});}});
  assert.equal(calls,1);assert.equal(method,'GET');
  assert.equal(actualUrl,'https://graph.facebook.com/v26.0/112233445566?fields=id');
  assert.equal(observed.provider_write,false);
  const {f,p,scopes,signed}=await fixture();
  const enrolled=await verifyEnrollment624(signed,scopes);
  const enrollment={enrollment_sha256:enrolled.enrollment_sha256};
  const grant={authorization_id:'unique-original-meta-authorization-624',
    enrollment_sha256:enrolled.enrollment_sha256,test_nonce:'original-meta-test-nonce-624',
    page_id:p.page_id,status:'ORIGINAL_META_ONE_USE_LIVE_PAGE_ID_RECHECK_APPROVED'};
  const witnessPayload={format:ACCEPT_624,authorization_id:grant.authorization_id,
    enrollment_sha256:grant.enrollment_sha256,test_nonce:grant.test_nonce,
    page_id:p.page_id,receipt_sha256:observed.receipt_sha256,
    owner_decision:'ACCEPT_ONE_ACTUAL_META_PAGE_GET_RECEIPT_NO_CONNECTION',
    nonce:'independent-genuine-get-witness-624',issued_at,
    expires_at:'2026-11-06T21:25:00.000Z'};
  const witness=await f.sign(witnessPayload,canonicalAcceptance624);
  const context={grant,enrollment,attempt:{test_nonce:grant.test_nonce,
      authorization_id:grant.authorization_id,
      status:'CLAIMED_ONE_ORIGINAL_META_PAGE_ID_GET_NO_RETRY'},
    outcome:{test_nonce:grant.test_nonce,remote_page_id:p.page_id,
      receipt_sha256:observed.receipt_sha256,
      status:'GENUINE_META_PAGE_ID_GET_PENDING_INDEPENDENT_WITNESS'},failure:null,
    issuer:scopes.issuer,roots:scopes.roots,pins:scopes.pins,now,cryptoApi:webcrypto};
  const verified=await verifyWitness624(witness,context);
  assert.equal(verified.actual_single_provider_get_receipt_verified,true);
  assert.equal(verified.provider_get_replayed,false);
  assert.equal(verified.connected,false);
  await assert.rejects(verifyWitness624(witness,{...context,outcome:null}));
  await assert.rejects(verifyWitness624(witness,{...context,failure:{test_nonce:grant.test_nonce}}));
  await assert.rejects(verifyWitness624(witness,{...context,outcome:{...context.outcome,
    remote_page_id:'7'}}));
  await assert.rejects(verifyWitness624(witness,{...context,pins:{}}));
});

test('624 gate keeps original DB proposed-only, single-use receipt immutable and protected UI server authorization',async()=>{
  const request=new Request('https://devilndove.com/api/admin/trust-meta-live-624');
  assert.equal((await onRequestGet({request,env:{}})).status,401);
  assert.equal((await onRequestPost({request,env:{}})).status,401);
  const api=read('functions/api/admin/trust-meta-live-624.js');
  const sql=read('migrations/proposed/0062_devilndove_build624_meta_original_enrollment_recheck_hold.sql');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/decryptOAuthSecret/);
  assert.match(api,/probeMetaPage620/);
  assert.match(api,/CLAIMED_ONE_ORIGINAL_META_PAGE_ID_GET_NO_RETRY/);
  assert.match(api,/verifySavedGrant/);
  assert.match(api,/readOnlyWindow/);
  assert.doesNotMatch(api,/encryptOAuthSecret|refreshOAuthToken|UPDATE\s+oauth_provider_connections|POST \/me\/feed|INSERT INTO dd614_authorities/i);
  assert.match(sql,/PROPOSED ONLY/);
  for(const name of ['dd624_enroll_no_update','dd624_enroll_no_delete',
    'dd624_grant_no_update','dd624_grant_no_delete',
    'dd624_attempt_no_update','dd624_attempt_no_delete',
    'dd624_outcome_no_update','dd624_outcome_no_delete',
    'dd624_failure_no_update','dd624_failure_no_delete',
    'dd624_witness_no_update','dd624_witness_no_delete'])
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
    '0061_devilndove_build623_original_meta_activation_hold.sql',
    '0062_devilndove_build624_meta_original_enrollment_recheck_hold.sql'];
  const code=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify(migrations.map(f=>'migrations/proposed/'+f))}: c.executescript(open(f).read())\nfor t in ['dd624_meta_credential_enrollments','dd624_meta_one_use_grants','dd624_meta_live_attempts','dd624_meta_live_outcomes','dd624_meta_live_failures','dd624_meta_witness_acceptances']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nprint('624_D1_SOURCE_PROPOSED_ONLY')`;
  assert.match(execFileSync('python3',['-c',code],{cwd:new URL('..',import.meta.url),
    encoding:'utf8'}),/624_D1_SOURCE_PROPOSED_ONLY/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/45\. Original Meta encrypted credential/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=630/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":630/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build624_original_meta_credential_live_recheck\.test\.mjs/);
});
