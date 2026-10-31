import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marketplaceManualReadiness531,ownerTrialDisposition531} from '../public/js/marketplace-owner-trial-531.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const approved=[1,2,3].map(product_image_id=>({product_image_id,approved_for_distribution:true,hold_reasons:[],
 image_url:`https://devilndove.com/media/${product_image_id}.jpg`,alt_text:`Product image ${product_image_id}`}));
const good={ok:true,product_id:88,channel:'facebook',gallery:approved,selected_image_ids:[1,2],
 current_evidence:{ready_for_local_export:true,blockers:[],external_execution_allowed:false,publication_allowed:false}};
test('Build 531 checks the same saved Product, exact selected approved images and local manual policy',()=>{
 const ready=marketplaceManualReadiness531(good,88);
 assert.equal(ready.state,'MANUAL_DRAFT_READY');
 assert.equal(ready.provider_api_authorized,false);
 assert.equal(ready.provider_called,false);
 assert.equal(ready.publication_allowed,false);
 assert.deepEqual(ready.selected_image_ids,[1,2]);
 for(const [label,response] of [
  ['wrong Product',{...good,product_id:89}],['wrong channel',{...good,channel:'etsy'}],
  ['empty gallery',{...good,gallery:[]}],['missing selection',{...good,selected_image_ids:[]}],
  ['duplicate selection',{...good,selected_image_ids:[1,1]}],
  ['foreign photo',{...good,selected_image_ids:[1,5]}],
  ['public image not approved',{...good,gallery:[{...approved[0],approved_for_distribution:false},...approved.slice(1)]}],
  ['alt/dimensions hold',{...good,gallery:[{...approved[0],hold_reasons:['descriptive alt text missing']},...approved.slice(1)]}],
  ['local owner policy not accepted',{...good,current_evidence:{...good.current_evidence,ready_for_local_export:false,blockers:['owner_us_shipping_review_required']}}],
 ])assert.equal(marketplaceManualReadiness531(response,88).state,'HOLD',label);
});
test('Build 531 never declares a completed real owner trial without current local owner signoff',()=>{
 const market=marketplaceManualReadiness531(good,88),closure={state:'OWNER_RECEIPT_CURRENT'},save={state:'NO_VALID_BROWSER_RECEIPT'};
 const ready=ownerTrialDisposition531({productId:88,closure,save,marketplace:market});
 assert.equal(ready.state,'CURRENT_OWNER_TRIAL_ACCEPTED');
 assert.equal(ready.etsy_owner_state,'ACCEPTED_CURRENT');
 assert.equal(ready.no_etsy_write,true);
 assert.equal(ready.no_facebook_post,true);
 for(const change of [{closure:{state:'READY_FOR_EXPLICIT_OWNER_ACCEPTANCE'}},
  {closure:{state:'HOLD'}},{save:{state:'REVIEW_SAVED_FIELDS'}},
  {marketplace:{state:'HOLD'}},{failedReason:'Etsy connection 409'}])
   assert.equal(ownerTrialDisposition531({productId:88,closure,save,marketplace:market,...change}).state,'FOLLOW_UP_REQUIRED');
});
test('Build 531 attaches an explicit owner trial report and manual Marketplace GET without any Marketplace POST',()=>{
 const html=read('admin/product-editor/index.html'),script=read('public/js/admin-product-owner-trial-531.mjs');
 const etsy=read('public/js/admin-product-etsy-closure-530.mjs');
 const localApi=read('functions/api/admin/product-distribution-406.js');
 const deploy=read('.github/workflows/production-pages-deploy-current.yml');
 assert.match(html,/Devil n Dove • Build (?:53[123456789]|540|541|542|543|544|545|546|547|548|549|550|551|552)/);
 for(const id of ['dd531TrialSummary','dd531TrialRows','dd531TrialStatus','dd531CopyTrial','dd531MarketplaceCheck','dd531MarketplaceResult'])
   assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/admin-product-owner-trial-531\.mjs\?v=531/);
 assert.match(etsy,/dd:owner-trial-product-531/);
 assert.match(etsy,/dd:owner-trial-accepted-531/);
 assert.match(script,/product-distribution-406\?product_id=\$\{id\}&channel=facebook/);
 assert.match(script,/method:'GET',cache:'no-store'/);
 assert.doesNotMatch(script,/method:'POST'|action:'create_|fetch\('https:\/\/graph\.facebook/);
 assert.match(localApi,/provider_called:false/);
 assert.match(localApi,/provider_publication_allowed:false/);
 assert.match(deploy,/"build":(?:5(?:3[123456789]|40|41|42|43|44|45|46|47|48|49)|550|551|552)/);
});
