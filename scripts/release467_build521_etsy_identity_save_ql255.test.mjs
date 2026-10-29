import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {PRODUCT_SAVE_FIELDS_521,compareUncertainProductSave521} from '../public/js/product-save-outcome-521.mjs';
import {assessVisualPhotoPairs521,witnessImageUrl521} from '../public/js/etsy-identity-witness-521.mjs';
import {reconcileQl255OriginCustody521,QL254_OBSERVATION_521} from './ql255_authentic_proof_custodian_521.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ids=[344,345,346];
function receipt(){return {product_id:53,listing_id:'4603838854',
  originals:ids.map(product_image_id=>({product_image_id,image_url:'/images/original-'+product_image_id+'.jpg'})),
  etsy_photos:ids.map((_,i)=>({etsy_image_id:String(8880+i),image_url:'https://i.etsystatic.com/example/'+i+'.jpg'})),
  matched:ids.map((product_image_id,i)=>({product_image_id,etsy_image_id:String(8880+i)})),
  unresolved_upload_attempts:0};}

test('Build 521 uncertain Product #48 Save compares every submitted field, never invents a confirmation',()=>{
  assert.ok(PRODUCT_SAVE_FIELDS_521.length>=38);
  const numeric=/^(?:price_cents|compare_at_price_cents|taxable|tax_class_id|requires_shipping|weight_grams|inventory_tracking|inventory_quantity|sort_order)$/;
  const submitted=Object.fromEntries(PRODUCT_SAVE_FIELDS_521.map(field=>[field,numeric.test(field)?500:'value']));
  const saved={...submitted,product_id:48};
  const equal=compareUncertainProductSave521({productId:48,submitted,saved});
  assert.equal(equal.savedMatch,true);assert.equal(equal.reviewed,true);
  assert.match(equal.next,/Do not repeat/);
  saved.inventory_quantity='another server value';
  const mismatch=compareUncertainProductSave521({productId:48,submitted,saved});
  assert.deepEqual(mismatch.different,['inventory_quantity']);assert.equal(mismatch.savedMatch,false);
  delete saved.sourcing_notes;
  assert.deepEqual(compareUncertainProductSave521({productId:48,submitted,saved}).unavailable,['sourcing_notes']);
  assert.equal(compareUncertainProductSave521({productId:53,submitted,saved}).reviewed,false);
});
test('three real original-to-existing-Etsy photo receipt pairs require live safe preview URLs and a human witness',()=>{
  const good=assessVisualPhotoPairs521(receipt());
  assert.equal(good.readyForHumanVisualReview,true);
  assert.deepEqual(good.pairs.map(pair=>pair.original),ids);
  assert.equal(good.humanVisualWitnessRecorded,false);assert.equal(good.ownerAccepted,false);
  for(const mutation of [
    r=>r.matched.pop(),r=>r.etsy_photos.pop(),r=>r.etsy_photos.push({...r.etsy_photos[0]}),
    r=>r.originals[0].image_url='javascript:alert(1)',
    r=>r.matched[2].etsy_image_id='8880',
    r=>r.unresolved_upload_attempts=1,r=>r.listing_id='different',r=>r.product_id=48
  ]){const data=receipt();mutation(data);assert.equal(assessVisualPhotoPairs521(data).readyForHumanVisualReview,false);}
  assert.equal(witnessImageUrl521('//attacker.example/image.png'),'');
  assert.equal(witnessImageUrl521('javascript:evil()'),'');
});
test('Product save uncertainty and Etsy witness controls do not auto-repeat writes or approve unverified images',()=>{
  const editor=read('public/js/admin-product-editor-v163.js'),etsy=read('public/js/admin-product-etsy-package-v500.mjs'),html=read('admin/product-editor/index.html');
  for(const field of ['dd521SaveReview','dd521ReviewServer','dd521KeepServer','dd521RestoreBrowser',
    'dd521IdentityGallery','dd521VisualConfirmed','dd521WitnessStatus'])assert.match(html,new RegExp(`id="${field}"`));
  assert.match(editor,/compareUncertainProductSave521/);assert.match(editor,/form\.dataset\.productAuthority='review'/);
  assert.match(editor,/state\.review521\?\.reviewed/);
  assert.match(editor,/void load\(\); \/\/ One explicit GET; never repeats the write/);
  assert.match(etsy,/assessVisualPhotoPairs521/);assert.match(etsy,/All six current image previews loaded/);
  assert.match(etsy,/!state\.identityWitness521\?\.readyForHumanVisualReview\|\|!\$\('dd521VisualConfirmed'\)\.checked/);
  assert.match(etsy,/checkOwnerAcceptance520\(\{requestKey:ownerApprovalKey\}\)/);
  assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=523/);
  assert.match(html,/etsy-simple-515\.css\?v=52[12]/);
  assert.match(read('public/js/admin-product-channel-intent-v405.js'),/Review and send/);
  assert.match(read('public/js/admin-product-creation-flow-471.js'),/Marketplace preparation only/);
});
test('QL-255 public proof exception cannot be mislabeled private custody, owner authorization or connection',()=>{
  assert.equal(QL254_OBSERVATION_521.proof_http_status,404);
  const probe={source_sha_A:QL254_OBSERVATION_521.source_sha_A,
    source_ci_run_url:'https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120',
    main_sha:'b'.repeat(40),proof_commit_sha_B:'NOT_AVAILABLE',
    immutable_public_proof_http_status:404,exact_proof_bytes_sha256:'NOT_AVAILABLE'};
  const held=reconcileQl255OriginCustody521({probe,observedAt:'2026-10-29T04:42:01Z'});
  assert.equal(held.prior_exception_age_minutes,60);
  assert.equal(held.immutable_public_proof_http_status,404);
  assert.equal(held.owner_test_decision,'NOT_GIVEN');assert.equal(held.actual_gateway_test,'NOT_RUN');
  assert.equal(held.connection_state,'DISCONNECTED');assert.equal(held.private_24_7_relay_deployed,false);
  const candidate=reconcileQl255OriginCustody521({probe:{...probe,proof_commit_sha_B:'c'.repeat(40),
    immutable_public_proof_http_status:200,proof_ancestry_verified:true,
    proof_source_sha_matches_A:true,source_ci_exact_head_green:true},observedAt:'2026-10-29T05:42:01Z'});
  assert.equal(candidate.proof_origin_candidate,true);assert.equal(candidate.exception_state,'HELD');
  assert.equal(candidate.independently_authenticated_custodian,'NOT_VERIFIED');
  assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
});
