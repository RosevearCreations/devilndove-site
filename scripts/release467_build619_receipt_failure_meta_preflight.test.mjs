import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import {onRequestGet,onRequestPost} from '../functions/api/admin/trust-reconciliation-619.js';
import {HOLD_619,FAILURE_619,classifyEtsyFailure619,canonicalFailure619,
  failureFingerprint619,verifyFailureDisposition619,reconcileEtsy619,
  metaReadOnlyPreflight619} from '../functions/api/_lib/trustReconcile619.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now='2026-11-06T15:00:00.000Z';
const nonce='one-time-remote-etsy-identity-get-619';
const grantId='original-issuer-one-get-grant-619';
const hash='a'.repeat(64);

test('Build 619 keeps exact spent nonce and classifies failures without exposing secrets',async()=>{
  assert.equal(classifyEtsyFailure619(Object.assign(Error('secret'),{name:'AbortError'})),'TIMEOUT');
  assert.equal(classifyEtsyFailure619(new TypeError('Bearer private-token')),'NETWORK_ERROR');
  assert.equal(classifyEtsyFailure619(Error('raw response contains private')),'UNVERIFIED_PROVIDER_RESPONSE');
  const sha=await failureFingerprint619({grant_id:grantId,test_nonce:nonce,code:'NETWORK_ERROR'},webcrypto);
  assert.match(sha,/^[0-9a-f]{64}$/);
  assert.equal(sha,await failureFingerprint619({grant_id:grantId,test_nonce:nonce,code:'NETWORK_ERROR'},webcrypto));
  await assert.rejects(failureFingerprint619({grant_id:grantId,test_nonce:nonce,code:'TOKEN_LEAK'},webcrypto));
  assert.equal(sha.includes('secret'),false);
});
test('Build 619 reconciles real immutable attempt, outcome, witness and spent failure rows',()=>{
  const grants=[{grant_id:grantId,test_nonce:nonce,provider:'ETSY',
    status:'INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET'}];
  const attempts=[{grant_id:grantId,test_nonce:nonce,status:'CLAIMED_EXACTLY_ONE_GET'}];
  const success={grants,attempts,outcomes:[{test_nonce:nonce,provider_receipt_sha256:hash,
    remote_subject_id:'12345678',endpoint:'GET /v3/application/users/me',
    status:'ETSY_IDENTITY_GET_VERIFIED_PENDING_WITNESS_ACCEPTANCE'}]};
  assert.equal(reconcileEtsy619({grants}).receipts[0].state,'NOT_EXECUTED');
  assert.equal(reconcileEtsy619({grants,attempts}).receipts[0].state,'SPENT_OUTCOME_MISSING_NO_RETRY');
  assert.equal(reconcileEtsy619(success).receipts[0].state,'GENUINE_GET_PENDING_WITNESS');
  const accepted=reconcileEtsy619({...success,acceptances:[{test_nonce:nonce,
    acceptance_sha256:hash,status:'EXACT_GENUINE_ETSY_GET_WITNESSED_NO_PUBLICATION'}]});
  assert.equal(accepted.receipts[0].state,'GENUINE_GET_WITNESSED');
  assert.equal(accepted.witnessed_get_count,1);
  assert.equal(accepted.production_publish_allowed,false);
  const failures=[{test_nonce:nonce,grant_id:grantId,failure_sha256:hash,
    failure_code:'NETWORK_ERROR',
    status:'SPENT_NONCE_NO_RETRY_PRESERVED'}];
  assert.equal(reconcileEtsy619({grants,attempts,failures}).receipts[0].state,
    'FAILED_NO_RETRY_PENDING_WITNESS');
  assert.equal(reconcileEtsy619({grants,attempts,failures,dispositions:[{
    test_nonce:nonce,failure_sha256:hash,
    status:'WITNESSED_SPENT_NONCE_NO_RETRY'}]}).receipts[0].state,'FAILED_WITNESSED_NO_RETRY');
  const conflict=reconcileEtsy619({...success,failures});
  assert.equal(conflict.receipts[0].state,'CONFLICT_QUARANTINED');
  assert.equal(conflict.integrity_ok,false);
  assert.equal(reconcileEtsy619({grants,attempts:[{...attempts[0],grant_id:'altered'}]}).integrity_ok,false);
  assert.equal(reconcileEtsy619({grants,attempts:[...attempts,{test_nonce:'unlinked'}]}).unlinked_records_detected,true);
});
test('Build 619 needs real distinct pinned witness and owner signatures for failed nonce',async()=>{
  const names={WITNESS:'signed-etsy-failure-witness-619',OWNER:'signed-etsy-failure-owner-619'};
  const roots={},pins={},pairs={};
  for(const [role,id] of Object.entries(names)){
    const pair=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
    const key=new Uint8Array(await webcrypto.subtle.exportKey('raw',pair.publicKey));
    const fp=Buffer.from(await webcrypto.subtle.digest('SHA-256',key)).toString('hex');
    roots[id]={authority_id:id,role,public_key:Buffer.from(key).toString('base64url'),
      key_sha256:fp,status:'ACTIVE_EXTERNAL_VERIFIED'};pins[id]=fp;pairs[id]=pair;
  }
  const payload={format:FAILURE_619,grant_id:grantId,test_nonce:nonce,
    failure_sha256:hash,owner_decision:'ACKNOWLEDGE_SPENT_NONCE_NO_RETRY',
    nonce:'independent-spent-nonce-signature-619',
    issued_at:'2026-11-06T14:50:00.000Z',expires_at:'2026-11-06T15:10:00.000Z'};
  const signed=canonicalFailure619(payload,now);
  const signatures=await Promise.all(Object.entries(names).map(async([role,id])=>({
    role,authority_id:id,signature:Buffer.from(await webcrypto.subtle.sign('Ed25519',
      pairs[id].privateKey,new TextEncoder().encode(signed))).toString('base64url')})));
  const proof={payload,signatures};
  const config={failure:{test_nonce:nonce,failure_sha256:hash,
      status:'SPENT_NONCE_NO_RETRY_PRESERVED'},
    attempt:{test_nonce:nonce,grant_id:grantId},authority:id=>roots[id],pins,now,cryptoApi:webcrypto};
  const accepted=await verifyFailureDisposition619(proof,config);
  assert.equal(accepted.status,'WITNESSED_SPENT_NONCE_NO_RETRY');
  assert.equal(accepted.retry_authorized,false);
  assert.equal(accepted.release_gate,HOLD_619);
  await assert.rejects(verifyFailureDisposition619(proof,{...config,pins:{}}));
  await assert.rejects(verifyFailureDisposition619(proof,{...config,failure:null}));
  await assert.rejects(verifyFailureDisposition619(proof,{...config,
    authority:id=>({...roots[id],status:'QUARANTINED'})}));
  await assert.rejects(verifyFailureDisposition619({...proof,payload:{...payload,
    failure_sha256:'b'.repeat(64)}},config));
  await assert.rejects(verifyFailureDisposition619({...proof,signatures:[signatures[0],signatures[0]]},config));
  assert.throws(()=>canonicalFailure619({...payload,owner_decision:'RETRY'},now));
});
test('Build 619 Meta is local permission inventory only, never Graph verification or posting',()=>{
  const good={provider_key:'meta',connection_status:'connected',remote_subject_id:'12345678',
    access_expires_at:'2026-11-08T15:00:00.000Z',
    scopes_json:JSON.stringify(['pages_show_list','pages_read_engagement','instagram_basic',
      'pages_manage_posts'])};
  const observed=metaReadOnlyPreflight619(good,Date.parse(now));
  assert.equal(observed.facebook_page_read_candidate,true);
  assert.equal(observed.instagram_professional_read_candidate,true);
  assert.equal(observed.provider_api_contacted,false);
  assert.equal(observed.remote_page_identity_verified,false);
  assert.equal(observed.publishing_enabled,false);
  assert.equal(observed.marketplace_api_approved,false);
  assert.equal(metaReadOnlyPreflight619({...good,scopes_json:'["pages_manage_posts"]'},Date.parse(now))
    .facebook_page_read_candidate,false);
  assert.equal(metaReadOnlyPreflight619({...good,access_expires_at:'2026-11-05T15:00:00Z'},Date.parse(now))
    .saved_oauth_candidate,false);
  assert.equal(metaReadOnlyPreflight619(null).saved_oauth_candidate,false);
});
test('Build 619 API stays admin-only, proposed-only, immutable and no Meta remote call',async()=>{
  const req=new Request('https://devilndove.com/api/admin/trust-reconciliation-619');
  assert.equal((await onRequestGet({request:req,env:{}})).status,401);
  assert.equal((await onRequestPost({request:req,env:{}})).status,401);
  const api=read('functions/api/admin/trust-reconciliation-619.js');
  const prior=read('functions/api/admin/trust-issuer-618.js');
  assert.match(api,/requireAdminStepUp/);
  assert.match(api,/SELECT test_nonce FROM dd619_etsy_failure_custody/);
  assert.match(prior,/failure_custody_recorded:recorded/);
  assert.match(prior,/CLAIMED_EXACTLY_ONE_GET/);
  assert.doesNotMatch(api,/fetch\(|method:\s*'GET'\s*,\s*headers:\s*\{Authorization|UPDATE\s+dd614_authorities/i);
  const sql=read('migrations/proposed/0057_devilndove_build619_receipt_failure_meta_preflight_hold.sql');
  assert.match(sql,/PROPOSED ONLY/);
  for(const trigger of ['dd619_failure_no_update','dd619_failure_no_delete',
    'dd619_disposition_no_update','dd619_disposition_no_delete'])assert.match(sql,new RegExp(trigger));
  const files=[52,53,54,55,56,57].map((n,i)=>[
    'migrations/proposed/0052_devilndove_build614_external_authority_hold.sql',
    'migrations/proposed/0053_devilndove_build615_custody_ceremony_hold.sql',
    'migrations/proposed/0054_devilndove_build616_external_checkpoint_revocation_hold.sql',
    'migrations/proposed/0055_devilndove_build617_anchor_readback_recovery_preflight_hold.sql',
    'migrations/proposed/0056_devilndove_build618_original_issuer_backup_etsy_test_hold.sql',
    'migrations/proposed/0057_devilndove_build619_receipt_failure_meta_preflight_hold.sql'][i]);
  const validation=`import sqlite3\nc=sqlite3.connect(':memory:')\nfor f in ${JSON.stringify(files)}: c.executescript(open(f).read())\nfor table in ['dd619_etsy_failure_custody','dd619_etsy_failure_dispositions']: assert c.execute('SELECT name FROM sqlite_master WHERE name=?',(table,)).fetchone()\nprint('BUILD619_MIGRATIONS_TESTED_IN_MEMORY_ONLY')`;
  assert.match(execFileSync('python3',['-c',validation],{cwd:new URL('..',import.meta.url),encoding:'utf8'}),
    /BUILD619_MIGRATIONS_TESTED_IN_MEMORY_ONLY/);
  assert.match(read('public/js/admin-channel-trust-authority-614.mjs'),/40\. Genuine Etsy receipt/);
  assert.match(read('public/js/admin-channel-issuer-response-598.mjs'),/trust-authority-614\.mjs\?v=623/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build619_receipt_failure_meta_preflight\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":623/);
});
