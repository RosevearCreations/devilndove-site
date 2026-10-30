import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {generateKeyPairSync,sign as signBytes,createHash} from 'node:crypto';
import {assessProductDraft523,assessCanonicalGallery523,LEGACY_OWNER_TRIAL_IDS_523} from '../public/js/product-destination-gates-523.mjs';
import {evaluateQl257WitnessIntake523} from './ql257_private_witness_intake_523.mjs';
import {QL256_SOURCE_522} from './ql256_original_signer_preflight_522.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const validImg=(n=101)=>({product_image_id:n,image_url:`https://assets.devilndove.com/products/${n}.webp`,
 alt_text:'Handmade teal rings photographed in natural light',public_use_status:'all_public_ok',width_px:1600,height_px:1200,approved_for_distribution:true});
test('one full Product and all real originals pass conservative shared preparation; no subset is silently discarded',()=>{
 const src={productId:61,product:{name:'Teal ring',description:'Handmade silver ring with measured dimensions',price:'32.00',quantity:2,weight_grams:80},
  images:[validImg(101),validImg(102)],channel:'etsy',authorityReady:true,dirty:false,channelSelected:true};
 assert.equal(assessProductDraft523(src).ready,true);
 assert.equal(assessProductDraft523({...src,images:[validImg(101),{...validImg(102),width_px:400}]}).ready,false);
 assert.match(assessProductDraft523({...src,images:[{...validImg(101),public_use_status:'social_ok'}]}).issues.join(' '),/permission/);
 assert.match(assessProductDraft523({...src,images:[{...validImg(101),alt_text:''}]}).issues.join(' '),/alt text/);
 assert.match(assessProductDraft523({...src,images:[{...validImg(101),image_url:'https:\/\/cdn.invalid\/placeholder.svg'}]}).issues.join(' '),/real secure/);
 assert.match(assessProductDraft523({...src,authorityReady:false}).issues.join(' '),/authoritative/);
 assert.match(assessProductDraft523({...src,product:{...src.product,weight_grams:''}}).issues.join(' '),/weight/);
 assert.match(assessCanonicalGallery523(Array.from({length:11},(_,i)=>validImg(i+10))).issues.join(' '),/at most ten/);
 assert.deepEqual(LEGACY_OWNER_TRIAL_IDS_523,[48,53]);
});
test('Build 523 front screen enforces saved Product, two checkboxes, image review and separate Etsy POST; no Meta API claim',()=>{
 const html=read('admin/product-editor/index.html'),flow=read('public/js/admin-product-destination-flow-523.mjs');
 const pkg=read('public/js/admin-product-etsy-package-v500.mjs'),editor=read('public/js/admin-product-editor-v163.js');
 for(const token of ['dd523Flow','dd523EtsyAcknowledge','dd523EtsyPost','dd523MarketplacePrepare','dd523Identity','dd523EtsySetupMount','dd523MarketplaceCopy'])assert.ok(html.includes(token),token);
 assert.match(html,/Etsy — create or update draft/);
 assert.match(html,/Marketplace.*manual handoff/i);
 assert.match(flow,/window\.DDEtsyDraftFlow523\.post\(\)/);
 assert.match(flow,/window\.confirm\(`/);
 assert.match(flow,/LEGACY_OWNER_TRIAL_IDS_523\.includes\(id\)/);
 assert.match(flow,/dd523MarketplaceDescription/);
 assert.match(pkg,/window\.DDEtsyDraftFlow523=\{/);
 assert.match(pkg,/await send\(\)/);
 assert.doesNotMatch(editor,/sessionStorage\.setItem\(`dnd:etsy:sync-after-create/);
 assert.doesNotMatch(flow,/\/api\/admin\/create-product|\/api\/admin\/product-editor-save/);
});
test('QL-257 fixture key proves only bounded cryptographic possession, never private witness, owner consent or a gateway test',()=>{
 const {privateKey,publicKey}=generateKeyPairSync('ed25519'),pem=publicKey.export({type:'spki',format:'pem'});
 const now=Date.now(),challenge=Buffer.from(JSON.stringify({context:'rosevear.integration.v1.ql256.signer-possession',
  source_sha_A:QL256_SOURCE_522.sourceShaA,nonproduction_tenant_id:'dnd_nonprod_isolated',
  created_at_utc:new Date(now-1000).toISOString(),expires_at_utc:new Date(now+60000).toISOString()}));
 const signature=signBytes(null,challenge,privateKey).toString('base64');
 const pin=createHash('sha256').update(publicKey.export({type:'spki',format:'der'})).digest('hex');
 const receipt={custodian_receipt_id:'opaque_custodian_0912',witness_receipt_id:'opaque_witness_0912',reviewer_receipt_id:'opaque_reviewer_0912',
  source_sha_A:QL256_SOURCE_522.sourceShaA,nonproduction_tenant_id:'dnd_nonprod_isolated',public_spki_sha256:pin};
 const evaluated=evaluateQl257WitnessIntake523({publicSpkiPem:pem,challengeBytes:challenge,signatureBase64:signature,privateReceipt:receipt,now});
 assert.equal(evaluated.genuine_possession_challenge_valid,true);
 assert.equal(evaluated.private_receipt_structure_matches,true);
 assert.equal(evaluated.independent_witness_verified,false);
 assert.equal(evaluated.owner_test_decision,'NOT_GIVEN');
 assert.equal(evaluated.connection_state,'DISCONNECTED / HOLD');
 const wrong=evaluateQl257WitnessIntake523({publicSpkiPem:pem,challengeBytes:challenge,signatureBase64:signature,privateReceipt:{...receipt,witness_receipt_id:receipt.custodian_receipt_id},now});
 assert.equal(wrong.private_receipt_structure_matches,false);
 const expired=evaluateQl257WitnessIntake523({publicSpkiPem:pem,challengeBytes:challenge,signatureBase64:signature,privateReceipt:receipt,now:now+65000});
 assert.equal(expired.genuine_possession_challenge_valid,false);
});
