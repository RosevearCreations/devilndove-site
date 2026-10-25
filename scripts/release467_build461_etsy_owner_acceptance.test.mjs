/* Build 461 synthetic-only contract: private main-site Etsy owner acceptance HOLD. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {evaluateEtsyOwner461,OWNER_461_CHECKS} from '../public/js/etsy-owner-acceptance-policy-461.mjs';
import {MAKER_LINKS,workbenchUrl} from '../public/js/maker-workbench-policy-457.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(resolve(root,p),'utf8');
const snapshot={productId:35,localDraftId:'draft-abc-12345-67890',
 oauth:{ok:true,main_site_operator_acceptance:true,connection:{connected:true,status:'connected'},shop:{shop_id:9041,currency_code:'CAD',acceptance_status:'connected_verified'}},
 trial:{ok:true,product_id:35,draft_id:'draft-abc-12345-67890',shop_id:'9041',shippingPolicy:'US_SHIPPING_DISABLED',blockers:[],trial_receipt:445,remote_attempt_claim:452,
   existing_listing_id:'909090',provider_verified_receipt_present:true},
 local:{ok:true,product_id:35,draft_id:'draft-abc-12345-67890',claim_receipt:452,linked_listing_id:'909090',local_status:'needs_review'},
 packet:{ok:true,packet_status:'OPERATOR_LIVE_RECHECK_REQUIRED'}};
const review=data=>evaluateEtsyOwner461(data);

test('even complete synthetic historical receipts never authorize Etsy, Meta or publication',()=>{
 const r=review(snapshot);
 assert.equal(r.state,'HOLD_REAL_OWNER_ETSY_ACCEPTANCE');assert.equal(r.listingId,'909090');
 assert.equal(r.shopId,'9041');assert.equal(r.locallyLinked,true);assert.equal(r.providerVerifiedPreviously,true);
 assert.equal(r.etsyWriteAllowed,false);assert.equal(r.publicationAllowed,false);assert.equal(r.automaticRetryAllowed,false);
 assert.equal(r.meta.state,'HOLD_SUPPORTED_API_PERMISSION_UNVERIFIED');assert.equal(r.meta.providerWritesAllowed,false);
 assert.match(r.holds.join(' '),/Current live authenticated Etsy DRAFT state/);
 assert.equal(OWNER_461_CHECKS.length,5);
});
test('missing source, mismatched shop and U.S.-disabled shipping policy fail closed',()=>{
 const missing=review({productId:0,localDraftId:'oops'});
 assert.match(missing.holds.join(' '),/exact saved Product ID/);
 assert.match(missing.holds.join(' '),/intended connected Etsy shop/);
 const drift=structuredClone(snapshot);drift.trial.shop_id='other';drift.trial.shippingPolicy='US_SHIPPING_ENABLED';
 drift.oauth.shop.currency_code='USD';assert.match(review(drift).holds.join(' '),/shop identity differs/);
 assert.match(review(drift).holds.join(' '),/Canadian-dollar/);
 assert.match(review(drift).holds.join(' '),/US-shipping-disabled/);
});
test('historic attempt, conflicting listing and missing provider GET receipt block silent retry',()=>{
 const drift=structuredClone(snapshot);drift.local.linked_listing_id='898989';
 drift.trial.provider_verified_receipt_present=false;drift.local.claim_receipt=null;drift.trial.remote_attempt_claim=0;
 assert.match(review(drift).holds.join(' '),/listing IDs disagree/);
 assert.match(review(drift).holds.join(' '),/creation claim receipt/);
 assert.match(review(drift).holds.join(' '),/draft-verification receipt is missing/);
 const unknown=structuredClone(snapshot);unknown.local.linked_listing_id=null;unknown.trial.existing_listing_id=null;
 assert.match(review(unknown).holds.join(' '),/No verified remote unpublished listing ID/);
});
test('page is keyboard/phone ready and strictly reads original Admin sources',()=>{
 const html=read('admin/etsy-owner-acceptance/index.html'),script=read('public/js/admin-etsy-owner-acceptance-461.js');
 assert.match(html,/data-admin-module="it-platform"/);assert.match(html,/href="#eaMain"/);assert.match(html,/aria-live="polite"/);
 for(const id of ['eaProduct','eaDraft'])assert.match(html,new RegExp(`for="${id}"`));
 assert.match(html,/:focus-visible/);assert.match(html,/@media\(max-width:600px\)/);
 assert.match(html,/min-height:48px/);assert.match(html,/prefers-reduced-motion/);
 for(const endpoint of ['etsy-oauth-acceptance','etsy-trial-409','etsy-remote-draft-evidence','etsy-publication-packet','etsy-product-syndication'])assert.match(script,new RegExp('/api/admin/'+endpoint));
 assert.match(html,/id="eaLoadDrafts"/);assert.match(html,/id="eaSavedDraft"/);
 assert.match(script,/credentials:'same-origin'/);assert.match(script,/cache:'no-store'/);
 assert.doesNotMatch(script,/localStorage|sessionStorage|method:\s*['"]POST['"]|innerHTML|etsy\.com\/v3\/application|fetch\(['"]https:/);
 assert.ok(existsSync(resolve(root,'admin/etsy-owner-acceptance/index.html')));
 const link=MAKER_LINKS.find(x=>x.key==='etsy-owner');assert.ok(link);
 assert.equal(workbenchUrl(link,35),'/admin/etsy-owner-acceptance/');
});
