import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedOwnerPhotoPairs529} from '../functions/api/_lib/etsyOwnerReadback529.mjs';
import {parseProductIds529,assessOwnerReadback529} from '../public/js/etsy-owner-readback-529.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const listingId='4603838854';
const originals=[344,345,346].map(product_image_id=>({product_image_id,alt_text:`Approved photo ${product_image_id}`,image_url:`/product-media/53/photo-${product_image_id}.jpg`,transferable:true}));
const etsyImages=[901,902,903].map(listing_image_id=>({listing_image_id,url_fullxfull:`https://i.etsystatic.com/123/${listing_image_id}.jpg`}));
const receipts=originals.map((row,i)=>({product_image_id:row.product_image_id,listing_id:listingId,etsy_image_id:String(901+i),verified_remote_readback:true}));
const photos=()=>{const result=verifiedOwnerPhotoPairs529({listingId,images:originals,remote:etsyImages,receipts});return {
  provider_contacted:true,listing_id:listingId,remote_reconciliation:{ready:true},
  photo_pair_readback_529:{ready:result.ready,issues:result.issues},verified_photo_pairs_529:result.pairs};};
const oauth={connection:{connected:true},shop:{acceptance_status:'connected_verified',shop_id:123}};
const identity={product_id:53,linked_listing_id:listingId,saved_link_readback_confirmed:true};
const detail={product:{product_id:53,name:'Soap saved Product',sku:'SOAP-53',slug:'soap-53'}};

test('Build 529 requires one to three unique, already-saved Product IDs',()=>{
  assert.deepEqual(parseProductIds529('53, 54  55'),{ids:[53,54,55],error:null});
  for(const bad of ['', '53,53', '53,54,55,56', '53,word', '0','1.5'])
    assert.ok(parseProductIds529(bad).error,`Input should HOLD: ${bad}`);
});

test('Build 529 proves all exact original-to-Etsy images through live inventory and confirmed receipts',()=>{
  const valid=verifiedOwnerPhotoPairs529({listingId,images:originals,remote:etsyImages,receipts});
  assert.equal(valid.ready,true);
  assert.deepEqual(valid.pairs.map(row=>row.product_image_id),[344,345,346]);
  assert.deepEqual(valid.pairs.map(row=>row.etsy_image_id),['901','902','903']);
  assert.ok(valid.pairs.every(row=>row.etsy_image_url?.startsWith('https://i.etsystatic.com/')));
  assert.equal(verifiedOwnerPhotoPairs529({listingId,images:originals,remote:etsyImages,receipts,galleryCount:4}).ready,false);
  const bad=[
    {images:[],remote:[],receipts:[]},
    {images:originals,remote:etsyImages,receipts:[...receipts,{...receipts[0]}]},
    {images:originals,remote:etsyImages,receipts:receipts.map((r,i)=>i===1?{...r,listing_id:'999'}:r)},
    {images:originals,remote:etsyImages,receipts:receipts.slice(0,2)},
    {images:originals.map((row,i)=>i===1?{...row,transferable:false}:row),remote:etsyImages,receipts},
    {images:originals,remote:[etsyImages[0],etsyImages[0],etsyImages[2]],receipts},
    {images:originals,remote:etsyImages,receipts:receipts.map((row,i)=>i===1?{...row,verified_remote_readback:false}:row)},
    {images:Array.from({length:21},(_,i)=>({...originals[0],product_image_id:100+i})),remote:etsyImages,receipts},
  ];
  for(const [i,scenario] of bad.entries())
    assert.equal(verifiedOwnerPhotoPairs529({listingId,...scenario}).ready,false,`Unexpected photo readback success for ${i}`);
});

test('Build 529 never declares product Save or Etsy publication acceptance from read-only receipts',()=>{
  const valid=assessOwnerReadback529({productId:53,detail,identity,oauth,photos:photos()});
  assert.equal(valid.state,'VERIFIED_READ_ONLY');
  assert.equal(valid.owner_approval_created,false);
  assert.equal(valid.no_listing_write,true);
  assert.equal(valid.listing_id,listingId);
  for(const [name,input] of [
    ['wrong Product',{detail:{product:{...detail.product,product_id:54}}}],
    ['no confirmed primary Etsy ID',{identity:{...identity,saved_link_readback_confirmed:false}}],
    ['missing listing',{identity:{...identity,linked_listing_id:null}}],
    ['OAuth not verified',{oauth:{...oauth,shop:{...oauth.shop,acceptance_status:'not_connected'}}}],
    ['no real Etsy GET',{photos:{...photos(),provider_contacted:false}}],
    ['foreign photo listing',{photos:{...photos(),listing_id:'777'}}],
    ['photo pair HOLD',{photos:{...photos(),photo_pair_readback_529:{ready:false,issues:['untracked']}}}],
  ]){
    assert.equal(assessOwnerReadback529({productId:53,detail,identity,oauth,photos:photos(),...input}).state,'HOLD',name);
  }
});

test('Build 529 exposes an owner-triggered three-Product GET-only review without hidden Etsy writes',()=>{
  const html=read('admin/product-editor/index.html');
  const frontend=read('public/js/admin-product-etsy-readback-529.mjs');
  const api=read('functions/api/admin/product-etsy-images.js');
  const deploy=read('.github/workflows/production-pages-deploy-current.yml');
 assert.match(html,/Devil n Dove • Build (?:529|53[0123456789]|540|541|542|543|544|545|546|547|548|549|550|551|552|553)/);
  for(const id of ['dd529Panel','dd529ProductIds','dd529Check','dd529Status','dd529Results'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/admin-product-etsy-(?:readback-529|closure-530)\.mjs\?v=(?:529|530|536)/);
  assert.match(frontend,/button\.addEventListener\('click',async/);
  assert.match(frontend,/method:'GET',cache:'no-store'/);
  assert.doesNotMatch(frontend,/method:\s*['"]POST|setInterval\(|setTimeout\(/);
  assert.match(frontend,/product-etsy-images\?product_id=\$\{id\}/);
  assert.match(api,/verifiedOwnerPhotoPairs529/);
  assert.match(api,/photo_pair_readback_529/);
  assert.match(deploy,/"build":(?:5(?:29|3[0123456789]|40|41|42|43|44|45|46|47|48|49)|550|551|552|553)/);
});
