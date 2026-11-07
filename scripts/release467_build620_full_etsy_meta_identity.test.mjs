import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {onRequestGet,onRequestPost,FULL_ETSY_SQL_620} from '../functions/api/admin/trust-audit-meta-620.js';
import {HOLD_620,META_620,META_ENDPOINT_620,canonicalMetaGrant620,
  scopesFingerprint620,verifyMetaGrant620,probeMetaPage620,
  classifyMetaFailure620,metaFailureDigest620,
  projectFullEtsyHistory620} from '../functions/api/_lib/trustAuditMeta620.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now='2026-11-06T15:00:00.000Z',pageId='123456789012345';
const scopes=['pages_show_list','pages_read_engagement','pages_manage_posts'];
const hash='a'.repeat(64);
const grantId='independently-meta-page-read-grant-620',nonce='one-exact-meta-page-get-nonce-620';

test('Build 620 original Meta authorization requires 3 distinct, active and externally pinned signatures',async()=>{
  const ids={ISSUER:'original-meta-issuer-620',WITNESS:'independent-meta-witness-620',
    OWNER:'independent-meta-owner-620'},roots={},pins={},keys={};
  for(const [role,id] of Object.entries(ids)){
    const key=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',key.publicKey));
    const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',raw)).toString('hex');
    roots[id]={authority_id:id,role,public_key:Buffer.from(raw).toString('base64url'),
      key_sha256:fp,status:'ACTIVE_EXTERNAL_VERIFIED'};pins[id]=fp;keys[id]=key;
  }
  const payload={format:META_620,provider:'META',grant_id:grantId,
    issuer_authority_id:ids.ISSUER,original_source_sha256:'a'.repeat(64),
    checkpoint_sha256:'b'.repeat(64),expected_page_id:pageId,
    scopes_sha256:await scopesFingerprint620(scopes,webcrypto),test_nonce:nonce,
    endpoint:META_ENDPOINT_620,owner_decision:'ONE_EXACT_META_PAGE_ID_READ_ONLY',
    issued_at:'2026-11-06T14:50:00.000Z',expires_at:'2026-11-06T15:10:00.000Z'};
  const canonical=canonicalMetaGrant620(payload,now);
  const approval_sha256=Buffer.from(await webcrypto.subtle.digest('SHA-256',
    new TextEncoder().encode(canonical))).toString('hex');
  const signatures=await Promise.all(Object.entries(ids).map(async([role,id])=>({
    role,authority_id:id,signature:Buffer.from(await webcrypto.subtle.sign('Ed25519',
      keys[id].privateKey,new TextEncoder().encode(canonical))).toString('base64url')})));
  const input={payload,signatures};
  const grant={...payload,approval_sha256,
    status:'INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'};
  const originalSource={authority_id:ids.ISSUER,original_source_sha256:payload.original_source_sha256,
    status:'INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE'};
  const checkpoint={checkpoint_sha256:payload.checkpoint_sha256,
    original_issuer_source_sha256:payload.original_source_sha256,
    status:'EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'};
  const config={grant,originalSource,checkpoint,roots:id=>roots[id],pins,now,cryptoApi:webcrypto};
  const proof=await verifyMetaGrant620(input,config);
  assert.equal(proof.provider_request_performed,false);
  assert.equal(proof.provider_write,false);
  assert.equal(proof.release_gate,HOLD_620);
  assert.equal(proof.signers.length,3);
  await assert.rejects(verifyMetaGrant620(input,{...config,originalSource:null}));
  await assert.rejects(verifyMetaGrant620(input,{...config,checkpoint:null}));
  await assert.rejects(verifyMetaGrant620(input,{...config,pins:{}}));
  await assert.rejects(verifyMetaGrant620(input,{...config,grant:{...grant,approval_sha256:hash}}));
  await assert.rejects(verifyMetaGrant620(input,{...config,
    roots:id=>({...roots[id],status:'QUARANTINED'})}));
  await assert.rejects(verifyMetaGrant620({...input,signatures:[signatures[0],
    signatures[1],signatures[1]]},config));
  await assert.rejects(verifyMetaGrant620({...input,payload:{...payload,
    expected_page_id:'7654321'}},config));
  assert.throws(()=>canonicalMetaGrant620({...payload,
    owner_decision:'PUBLISH_PAGE_POST'},now));
  assert.throws(()=>canonicalMetaGrant620({...payload,
    endpoint:'POST /me/feed'},now));
  assert.notEqual(await scopesFingerprint620(['pages_show_list'],webcrypto),payload.scopes_sha256);
});
test('Build 620 fixed Meta Graph Page identity GET never posts, redirects, or trusts mismatched account',async()=>{
  let calls=0;
  const good=async(url,opts)=>{calls++;
    assert.equal(url,`https://graph.facebook.com/v26.0/${pageId}?fields=id`);
    assert.equal(opts.method,'GET');assert.equal(opts.redirect,'manual');
    assert.equal(opts.credentials,'omit');assert.equal(opts.cache,'no-store');
    assert.equal(opts.headers.Authorization,'Bearer test-provider-token');
    return new Response(JSON.stringify({id:pageId}),{
      status:200,headers:{'Content-Type':'application/json'}});};
  const a=await probeMetaPage620({token:'test-provider-token',expectedPageId:pageId,
    fetchFn:good,cryptoApi:webcrypto});
  assert.equal(calls,1);assert.equal(a.endpoint,META_ENDPOINT_620);
  assert.match(a.receipt_sha256,/^[a-f0-9]{64}$/);
  assert.equal(a.provider_write,false);assert.equal(a.publication,false);
  await assert.rejects(probeMetaPage620({token:'test-provider-token',expectedPageId:'999',
    fetchFn:good,cryptoApi:webcrypto}));
  await assert.rejects(probeMetaPage620({token:'test-provider-token',expectedPageId:pageId,
    fetchFn:async()=>new Response(null,{status:302,headers:{Location:'https://untrusted.invalid'}}),
    cryptoApi:webcrypto}));
  await assert.rejects(probeMetaPage620({token:'test-provider-token',expectedPageId:pageId,
    fetchFn:async()=>new Response(JSON.stringify({id:pageId,access_token:'secret'}),
      {headers:{'Content-Type':'application/json'}}),cryptoApi:webcrypto}));
  await assert.rejects(probeMetaPage620({token:'',expectedPageId:pageId,fetchFn:good}));
  assert.equal(classifyMetaFailure620(Object.assign(Error('private'),{name:'AbortError'})),'TIMEOUT');
  assert.equal(classifyMetaFailure620(new TypeError('token')),'NETWORK_ERROR');
  assert.match(await metaFailureDigest620({grant_id:grantId,test_nonce:nonce,
    code:'RECEIPT_WRITE_FAILED'},webcrypto),/^[a-f0-9]{64}$/);
  await assert.rejects(metaFailureDigest620({grant_id:grantId,test_nonce:nonce,code:'PUBLISH'},webcrypto));
});
test('Build 620 full source-count audit is not limited to 100 receipts and rejects conflicts',()=>{
  const base={grants:175,attempts:130,outcomes:80,acceptances:60,
    failures:40,dispositions:39,orphan_attempts:0,orphan_outcomes:0,
    orphan_acceptances:0,orphan_failures:0,orphan_dispositions:0,
    dual_outcomes:0,invalid_grants:0,invalid_failure_approvals:0};
  const clean=projectFullEtsyHistory620(base);
  assert.equal(clean.source_record_consistent,true);
  assert.equal(clean.full_history_sql_counts.grants,175);
  assert.equal(clean.externally_witnessed_complete_history,false);
  assert.equal(clean.globally_accepted,false);
  assert.equal(projectFullEtsyHistory620({...base,dual_outcomes:1}).source_record_consistent,false);
  assert.equal(projectFullEtsyHistory620({...base,attempts:176}).source_record_consistent,false);
  assert.equal(projectFullEtsyHistory620({...base,outcomes:120}).source_record_consistent,false);
  assert.throws(()=>projectFullEtsyHistory620({...base,grants:-1}));
  assert.throws(()=>projectFullEtsyHistory620({...base,grants:NaN}));
});
test('Build 620 SQL scans all rows and proposed migration is immutable, never applied to production',()=>{
  const files=[
    'migrations/proposed/0052_devilndove_build614_external_authority_hold.sql',
    'migrations/proposed/0053_devilndove_build615_custody_ceremony_hold.sql',
    'migrations/proposed/0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
    'migrations/proposed/0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql',
    'migrations/proposed/0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql',
    'migrations/proposed/0057_devilndove_build619_receipt_failure_meta_preflight_hold.sql',
    'migrations/proposed/0058_devilndove_build620_meta_original_grants_and_test_hold.sql'];
  const code=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify(files)}: c.executescript(open(f).read())\nfor t in ['dd620_meta_original_source_registrations','dd620_meta_read_grants','dd620_meta_test_attempts','dd620_meta_test_outcomes','dd620_meta_test_failures']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(t,)).fetchone()\nfor i in range(125): c.execute('INSERT INTO dd618_original_test_grants (grant_id,preflight_sha256,attestation_sha256,backup_witness_sha256,checkpoint_sha256,test_nonce,provider,original_approval_sha256,status,approved_by,approved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',(f'g-{i}','a'*64,'b'*64,'c'*64,'d'*64,f'nonce-{i}','ETSY','e'*64,'INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET','independent','2026-11-06T15:00:00Z'))\nr=c.execute(${JSON.stringify(FULL_ETSY_SQL_620)}).fetchone()\nassert r[0]==125 and r[1]==0 and len(r)==14\nc.execute('INSERT INTO dd618_provider_test_attempts(test_nonce,grant_id,status,created_by) VALUES (?,?,?,?)',('orphan-620','not-a-grant','CLAIMED_EXACTLY_ONE_GET',1))\nassert c.execute(${JSON.stringify(FULL_ETSY_SQL_620)}).fetchone()[6]==1\nprint('FULL_HISTORY_125_ROWS_AND_ORPHAN_PROVEN_IN_MEMORY')`;
  assert.match(execFileSync('python3',['-c',code],{encoding:'utf8',cwd:new URL('..',import.meta.url)}),
    /FULL_HISTORY_125_ROWS_AND_ORPHAN_PROVEN_IN_MEMORY/);
  const sql=read(files.at(-1));
  assert.match(sql,/PROPOSED ONLY/);
  for(const part of ['dd620_source_no_delete','dd620_grant_no_update',
    'dd620_attempt_no_delete','dd620_outcome_no_update','dd620_failure_no_update'])
    assert.match(sql,new RegExp(part));
  assert.doesNotMatch(FULL_ETSY_SQL_620,/LIMIT\s+100/i);
});
test('Build 620 API stays admin/step-up only, no grant creation, and new client release marker',async()=>{
  const req=new Request('https://devilndove.com/api/admin/trust-audit-meta-620');
  assert.equal((await onRequestGet({request:req,env:{}})).status,401);
  assert.equal((await onRequestPost({request:req,env:{}})).status,401);
  const api=read('functions/api/admin/trust-audit-meta-620.js');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/decryptOAuthSecret/);
  assert.match(api,/CLAIMED_EXACTLY_ONE_META_PAGE_GET/);
  assert.match(api,/FULL_ETSY_SQL_620/);
  assert.doesNotMatch(api,/INSERT INTO dd620_meta_read_grants|UPDATE dd614_authorities|POST \/me\/feed/i);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/41\. Full-history Etsy/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=629/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build620_full_etsy_meta_identity\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":629/);
});
