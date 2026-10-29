import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {compareUncertainProductSave521,PRODUCT_SAVE_FIELDS_521} from '../public/js/product-save-outcome-521.mjs';
import {inspectPrivateQl256Challenge522,collectQl256PublicEvidence522,QL256_SOURCE_522} from './ql256_original_signer_preflight_522.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Product #48 exact meta description difference presents both prior browser request and saved server fields',()=>{
 const browser=Object.fromEntries(PRODUCT_SAVE_FIELDS_521.map(name=>[name,'']));
 browser.meta_description='Our proposed search description';
 const saved={...browser,product_id:48,meta_description:'Previous description already on server'};
 const result=compareUncertainProductSave521({productId:48,submitted:browser,saved});
 assert.equal(result.reviewed,true);assert.equal(result.savedMatch,false);
 assert.deepEqual(result.different,['meta_description']);
 assert.deepEqual(result.fieldSnapshots,[{field:'meta_description',status:'different',browser:browser.meta_description,server:saved.meta_description}]);
 assert.equal(compareUncertainProductSave521({productId:53,submitted:browser,saved}).reviewed,false);
 const editor=read('public/js/admin-product-editor-v163.js'),html=read('admin/product-editor/index.html');
 assert.match(editor,/verdict\.fieldSnapshots/);
 assert.match(editor,/Previous browser Save request/);
 assert.match(editor,/Saved server value/);
 assert.match(editor,/span\.textContent/);assert.doesNotMatch(editor,/innerHTML=.*fieldSnapshots/);
 assert.match(html,/id="dd521KeepServer"/);assert.match(html,/id="dd521RestoreBrowser"/);
 assert.match(html,/Save Product stores destination preferences only/);
 assert.doesNotMatch(html,/Etsy checked means Save Product also creates/);
 assert.match(html,/etsy-simple-515\.css\?v=522/);
});

test('QL-256 absent signer is UNKNOWN (not falsely established absent from uninspectable private stores)',()=>{
 const unknown=inspectPrivateQl256Challenge522();
 assert.equal(unknown.signer_provisioning_decision,'SIGNER_STATUS_UNKNOWN');
 assert.equal(unknown.public_spki_sha256,'NOT_AVAILABLE');
 assert.equal(unknown.independent_custody_verified,false);
 assert.equal(inspectPrivateQl256Challenge522({publicSpkiPem:'-----BEGIN PRIVATE KEY-----\nTOP SECRET\n-----END PRIVATE KEY-----'}).public_spki_sha256,'NOT_AVAILABLE');
});

test('a test-only Ed25519 possession fixture can never impersonate independently authenticated custody',()=>{
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');
 const publicSpkiPem=publicKey.export({type:'spki',format:'pem'});
 const t=Date.parse('2026-10-29T12:00:00Z');
 const data=Buffer.from(JSON.stringify({context:'rosevear.integration.v1.ql256.signer-possession',
  source_sha_A:QL256_SOURCE_522.sourceShaA,nonproduction_tenant_id:'synthetic_unit_test_only',
  created_at_utc:'2026-10-29T11:59:00Z',expires_at_utc:'2026-10-29T12:04:00Z'}));
 const signature=sign(null,data,privateKey).toString('base64');
 const v=inspectPrivateQl256Challenge522({publicSpkiPem,challengeBytes:data,signatureBase64:signature,now:t});
 assert.equal(v.signer_possession_challenge_valid,true);
 assert.equal(v.signer_provisioning_decision,'SIGNER_EXISTS_CUSTODY_NOT_VERIFIED');
 assert.equal(v.independent_custody_verified,false);
 assert.equal(v.independent_witness_verified,false);
 const expired=inspectPrivateQl256Challenge522({publicSpkiPem,challengeBytes:data,signatureBase64:signature,now:t+360000});
 assert.equal(expired.signer_possession_challenge_valid,false);
 const altered=Buffer.from(data.toString().replace('synthetic_unit_test_only','different_tenant'));
 assert.equal(inspectPrivateQl256Challenge522({publicSpkiPem,challengeBytes:altered,signatureBase64:signature,now:t}).signer_possession_challenge_valid,false);
});

test('a real public-only QL-256 probe cannot change owner or connection status',async()=>{
 const expected=QL256_SOURCE_522;
 const responses=[{status:200,json:async()=>({head_sha:expected.sourceShaA,status:'completed',conclusion:'success'})},
   {status:404}];let calls=0;
 const output=await collectQl256PublicEvidence522({mainSha:expected.baselineMain,
  fetchFn:async(url,options)=>{assert.match(url,/github/);assert.equal(options.method,'GET');return responses[calls++];},
  now:Date.parse('2026-10-29T12:00:00Z')});
 assert.equal(calls,2);assert.equal(output.source_ci_exact_head_green,true);
 assert.equal(output.original_ql246_proof_http_status,404);
 assert.equal(output.signer_provisioning_decision,'SIGNER_STATUS_UNKNOWN');
 assert.equal(output.proof_commit_sha_B,'NOT_AVAILABLE');
 assert.equal(output.owner_test_decision,'NOT_GIVEN');
 assert.equal(output.connection_state,'DISCONNECTED / HOLD');
 assert.equal(output.genuine_gateway_get_and_denial_receipts,'NOT_RUN');
 assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
});
