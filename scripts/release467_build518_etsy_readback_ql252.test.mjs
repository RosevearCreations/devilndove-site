import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {summarizeOwnerReads518} from '../public/js/etsy-owner-evidence-518.mjs';
import {canonicalQl246513,QL246_SOURCE_FIELDS_513,QL246_NEGATIVES_513} from '../functions/api/_lib/ql246Proof513.mjs';
import {inspectSourceProof518} from './ql252_source_proof_preflight_518.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Build 518 retains successful reads but never accepts a partial 503',()=>{
  const failed=Error('Devil n Dove server HTTP 503; Cloudflare ref a51');failed.httpStatus=503;
  const results=summarizeOwnerReads518([{status:'rejected',reason:failed},{status:'fulfilled',value:{ok:true,listing_id:'4603838854'}},{status:'fulfilled',value:{ok:true,listing_id:'4603838854'}}]);
  assert.equal(results.complete,false);assert.equal(results.readyForAssessment,false);
  assert.equal(results.unavailable.length,1);assert.equal(results.unavailable[0].status,503);
  assert.equal(results.entries[1].ok,true);assert.equal(results.entries[2].ok,true);
  assert.equal(summarizeOwnerReads518([0,1,2].map(()=>({status:'fulfilled',value:{ok:true}}))).complete,true);
  assert.equal(summarizeOwnerReads518([{status:'fulfilled',value:{ok:false}},{status:'fulfilled',value:{}},{status:'fulfilled',value:{}}]).complete,false);
  assert.equal(summarizeOwnerReads518([{status:'fulfilled',value:{}},{status:'fulfilled',value:{ok:true}},{status:'fulfilled',value:{ok:true}}]).complete,false);
});

test('owner verifier does three independent GETs, no automatic photo/metadata retry or provider write',()=>{
  const ui=read('public/js/admin-product-etsy-package-v500.mjs');
  const html=read('admin/product-editor/index.html');
  const check=ui.match(/async function verifyOwner517\(\)\{([\s\S]*?)\n  \}\n  async function approveOwner517/);
  assert.ok(check);assert.match(check[1],/Promise\.allSettled/);
  assert.match(check[1],/summarizeOwnerReads518/);
  for(const path of ['product-etsy-images?product_id=','product-etsy-owner-signoff-504?product_id=',
    'product-etsy-owner-trial-507?product_id='])assert.ok(check[1].includes(path));
  assert.doesNotMatch(check[1],/action:\s*'transfer_one'|action:\s*'update_saved_fields'|action:\s*'create_draft'/);
  assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=5(?:1[89]|2[0-7])/);
  assert.match(html,/etsy-simple-515\.css\?v=5(?:1[89]|2[0-2])/);
  assert.match(html,/Verify \/ retry live draft/);
  const endpoint=read('functions/api/admin/product-etsy-images.js');
  assert.match(endpoint,/diagnostic_phase:readPhase/);
  assert.match(endpoint,/retry_safe_get:true/);
});

test('QL-252 unsigned or missing proof cannot be published as signed or connected',()=>{
  assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false,
    'Never commit a placeholder or fabricated QL-246 signed proof.');
  const absent=inspectSourceProof518({});
  assert.equal(absent.published,false);assert.equal(absent.accepted,false);
  assert.match(absent.blockers[0],/NOT_AVAILABLE/);
});

test('cryptographically valid synthetic signed data remains rejected without real witness and private custody',()=>{
  const now=Date.now(),a='a'.repeat(40),b='b'.repeat(40);
  const p=Object.fromEntries(QL246_SOURCE_FIELDS_513.map(k=>[k,null]));
  Object.assign(p,{schema_version:'rosevear.integration.v1',source_system:'devilndove',
    repository:'RosevearCreations/devilndove-site',source_revision:a,
    challenge_id:'np-fixture-only',challenge_sha256:'c'.repeat(64),business_id:'devilndove',
    tenant_id:null,environment:'nonproduction',ci_run_url:'https://github.com/RosevearCreations/devilndove-site/actions/runs/1234567',
    allowed_methods:['GET'],allowed_paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
    negative_tests:Object.fromEntries(QL246_NEGATIVES_513.map(k=>[k,false])),
    gateway_audit_receipt_id:null,health_receipt_id:null,capabilities_receipt_id:null,registered_key_id:null,
    owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED',external_gateway_get_verified:false,
    durable_audit_verified:false,owner_identity_verified:false,issued_at:now,expires_at:now+1800000});
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const record={publicKeyPem:publicKey.export({type:'spki',format:'pem'}),payload:p,
    signature:sign(null,Buffer.from(canonicalQl246513(p)),privateKey).toString('base64url')};
  const check=inspectSourceProof518({raw:JSON.stringify(record),sourceShaA:a,proofShaB:b,sourceCiHeadSha:a,
    ancestorConfirmed:true,now});
  assert.equal(check.published,true);assert.equal(check.signature_valid,true);
  assert.equal(check.accepted,false);
  assert.ok(check.blockers.some(x=>/negative denial/.test(x)));
  assert.ok(check.blockers.some(x=>/SPKI pin/.test(x)));
  assert.equal(check.connection_state,'DISCONNECTED');
});
