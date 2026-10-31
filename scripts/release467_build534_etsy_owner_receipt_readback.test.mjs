import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerDraftHistory534,ownerDraftDecision534} from '../public/js/etsy-owner-draft-history-534.mjs';
import {photoSizeAdvice533} from '../public/js/product-photo-framing-policy-533.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 534 recognizes the owner-reported historical Sweet Orange draft but never treats it as a verified saved receipt',()=>{
 assert.deepEqual(ownerDraftHistory534(54),{listingId:'4601705477',productName:'Bar Soap Sweet Orange',sku:'DND-01131'});
 assert.deepEqual(ownerDraftDecision534(54,''),{report:ownerDraftHistory534(54),requiresExistingDraftCheck:true,action:'verify_existing'});
 assert.equal(ownerDraftDecision534(54,'4601705477').action,'update');
 assert.equal(ownerDraftDecision534(54,'4601705477').requiresExistingDraftCheck,false);
 assert.equal(ownerDraftDecision534(53,'').action,'create'); // historical #53 handled separately by established owner trial policy
 assert.equal(ownerDraftDecision534(70,'').action,'create');
});
test('Build 534 UI cannot create a second soap draft without linking a verified earlier draft',()=>{
 const html=read('admin/product-editor/index.html'),flow=read('public/js/admin-product-destination-flow-523.mjs');
 assert.match(html,/Devil n Dove • Build (?:53[456789]|540|541|542)/);
 assert.match(html,/id="dd534HistoricalDraft"/);
 assert.match(html,/id="dd534InspectHistorical"/);
 assert.match(html,/id="dd534GoTags"/);
 assert.match(html,/id="dd534GoProcessing"/);
 assert.match(html,/admin-product-editor-534\.css\?v=534/);
 assert.match(html,/admin-product-destination-flow-523\.mjs\?v=53[457]/);
 assert.match(flow,/post\.disabled=.*prior\.requiresExistingDraftCheck/);
 assert.match(flow,/if\(ownerDraftDecision534\(id,(?:state\.lastListingId|confirmedListing\(\))\)\.requiresExistingDraftCheck\)/);
 assert.match(flow,/const proof=verifySavedEtsyReceipt524/);
 assert.match(flow,/dd:etsy-existing-draft-linked/);
 assert.match(flow,/dd486EtsyListingId/); // Real existing-link controls, not package-preparation input.
 assert.match(flow,/dd500Processing/);
 assert.match(flow,/label\('Category'\)/);
 assert.match(flow,/label\('Shipping'\)/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":5(?:3[456789]|40|41|42)/);
});
test('Build 534 keeps the source images shared and makes the owner accept verified draft-only writes',()=>{
 const flow=read('public/js/admin-product-destination-flow-523.mjs');
 const html=read('admin/product-editor/index.html');
 for(const [w,h] of [[1209,907],[1853,1391]])assert.equal(photoSizeAdvice533(w,h).meetsLocalMinimum,true);
 assert.match(html,/800 × 800 is our minimum, not a required crop/);
 assert.match(flow,/ids\(etsySource\)!==ids\(facebookSource\)/);
 assert.match(flow,/!window\.confirm\(`/);
 assert.match(flow,/verifySavedEtsyReceipt524/);
 assert.doesNotMatch(flow,/graph\.facebook\.com|automatic.*publish/i);
});
