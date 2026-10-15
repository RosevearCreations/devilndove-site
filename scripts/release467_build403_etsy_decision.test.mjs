import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessDraftPublicationReadiness,ownerReadyConsent,validRequestKey,validException} from '../functions/api/_lib/etsyDraftDecision403.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const audit=(details,id=21)=>({admin_action_audit_id:id,details_json:JSON.stringify(details)});
const listing={listing_id:111,shop_id:57459161,state:'draft',title:'Soap',
 price:{amount:900,divisor:100,currency_code:'CAD'},quantity:3};
const product={product_id:54};
const draft={product_id:'54',channel_key:'etsy',payload_json:JSON.stringify({title:'Soap',price_cents:900,quantity:3})};
const shop={shop_id:57459161};
const images={results:[{listing_image_id:7001,full_width:1600,full_height:1600,alt_text:'Soap'}]};
const claim={admin_action_audit_id:2},review=audit({image_ids:['7001']},3);
const accepted=audit({listing_id:'111',image_id:'7001',compliance_review_receipt:3},4);
const owner={owner_checked_product:true,owner_checked_images:true,owner_checked_shipping:true,
 owner_checked_etsy_policies:true,owner_acknowledges_no_publication:true,owner_approves_manual_decision:true};
const status=(overrides={})=>assessDraftPublicationReadiness({listing,shop,product,draft,claim,images,review,accepted,
 imageClaim:null,uploaded:null,reconciled:null,shipping_reviewed:true,...overrides});
test('Explicit owner-ready consent and note/request-key constraints',()=>{
 assert.equal(ownerReadyConsent(owner),true);
 for(const k of Object.keys(owner))assert.equal(ownerReadyConsent({...owner,[k]:false}),false,k);
 assert.equal(validException('SHIPPING_DESTINATIONS','Canadian destinations only; US suspended.'),true);
 assert.equal(validException('OTHER','short'),false);
 assert.equal(validException('UNLISTED','This is a sufficiently detailed note.'),false);
 assert.equal(validRequestKey('3648822c-cd9b-4bed-a13b-4a60b9952841'),true);
 assert.equal(validRequestKey('not-a-key'),false);
});
test('Accepted unpublished provider-matched draft is only READY for separate manual decision',()=>{
 const report=status();
 assert.deepEqual(report.blockers,[]);
 assert.equal(report.readiness,'READY_FOR_SEPARATE_MANUAL_ETSY_DECISION');
 assert.equal(report.publication_performed,false);
 assert.equal(report.requires_separate_manual_publish,true);
});
test('Missing Build 402 receipt, wrong image, switched state, and shipping HOLD',()=>{
 assert.ok(status({accepted:null}).blockers.includes('build402_final_owner_acceptance_missing'));
 assert.ok(status({accepted:audit({listing_id:'111',image_id:'999',compliance_review_receipt:3})}).blockers.includes('build402_final_image_identity_conflict'));
 assert.ok(status({listing:{...listing,state:'active'}}).blockers.includes('not_unpublished_draft'));
 assert.ok(status({shipping_reviewed:false}).blockers.includes('shipping_restrictions_owner_review_missing'));
 assert.ok(status({images:{results:[]}}).blockers.includes('provider_images_missing'));
 assert.ok(status({review:null}).blockers.includes('build401_compliance_review_receipt_missing'));
});
test('Etsy shop, title, CAD price and quantity conflicts block owner readiness',()=>{
 assert.ok(status({shop:{shop_id:999}}).blockers.includes('shop_mismatch'));
 assert.ok(status({listing:{...listing,title:'Wrong Soap'}}).blockers.includes('title_mismatch'));
 assert.ok(status({listing:{...listing,quantity:99}}).blockers.includes('quantity_mismatch'));
 assert.ok(status({listing:{...listing,price:{amount:1200,divisor:100,currency_code:'CAD'}}).blockers.includes('cad_price_mismatch'));
});
test('Admin API local GET is read-only; only provider GET allowed; audit receipts idempotent',()=>{
 assert.equal(moduleKeyForPath('/api/admin/etsy-draft-decision'),MODULE_KEYS.STOREFRONT);
 const s=file('functions/api/admin/etsy-draft-decision.js');
 assert.match(s,/verifiedAdminFromModule/);
 assert.match(s,/connectionBlockers/);
 assert.match(s,/etsy_draft_403_owner_decision/);
 assert.match(s,/json_extract\(details_json,'\$\.request_key'\)/);
 assert.match(s,/publication_performed:false/);
 assert.doesNotMatch(s,/method:'PATCH'|method:'PUT'|method:'DELETE'|createDraftListing|updateListing/);
 const get=s.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/fetch\(|getEtsy\(|decryptOAuthSecret|INSERT INTO|UPDATE /);
 const ui=file('public/js/admin-etsy-draft-decision-v403.js');
 assert.match(ui,/addEventListener\('click'/);assert.doesNotMatch(ui,/setTimeout|setInterval|api\.etsy\.com/);
});
