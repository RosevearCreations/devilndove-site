import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validHoldId,evidenceDescription,fullConsent,holdIsOriginal,evidenceForHold,resolutionForHold,
 gateFreshDraft,lastDecisionIsReady,finalRevalidation} from '../functions/api/_lib/etsyExceptionResolution404.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const row=(id,detail)=>({admin_action_audit_id:id,details_json:JSON.stringify(detail)});
const original=row(51,{decision:'HOLD_OWNER_REVIEW',listing_id:'789',category:'PHOTO_REVIEW'});
const evidence=row(60,{hold_receipt:51,listing_id:'789',operator_correction:'Replaced a confusing photo and checked listing.'});
const resolved=row(66,{hold_receipt:51,listing_id:'789',resolution:'RESOLVED_BY_FRESH_PROVIDER_GET'});
const decision=row(67,{decision:'READY_FOR_SEPARATE_MANUAL_ETSY_DECISION'});
const consent={owner_checked_product:true,owner_checked_images:true,owner_checked_shipping:true,
 owner_checked_etsy_policies:true,owner_acknowledges_no_publication:true,owner_approves_manual_decision:true,owner_confirmed_correction:true};
test('Exact HOLD and owner-correction evidence cannot attach to another listing',()=>{
 assert.equal(validHoldId(51),true);assert.equal(validHoldId('0'),false);
 assert.equal(evidenceDescription('X'.repeat(20)),true);assert.equal(evidenceDescription('too short'),false);
 assert.equal(holdIsOriginal(original,51,'789'),true);assert.equal(holdIsOriginal(original,51,'999'),false);
 assert.equal(evidenceForHold(evidence,51,'789'),true);assert.equal(evidenceForHold(evidence,56,'789'),false);
 assert.equal(resolutionForHold(resolved,51,'789'),true);assert.equal(resolutionForHold(resolved,51,'999'),false);
});
test('Full owner consent is required for closure and revalidation',()=>{
 assert.equal(fullConsent(consent),true);
 for(const key of Object.keys(consent))assert.equal(fullConsent({...consent,[key]:false}),false,key);
});
test('No unresolved HOLD, newest 403 READY, fresh selected image and Build 402 acceptance needed',()=>{
 const snapshot={blockers:[],selected_image_id:'7001',listing_id:'789',draft_state:'draft'};
 const source={snapshot,activeHolds:[],lastDecision:decision,lastHold:original,selectedImage:'7001',acceptance:row(40,{})};
 assert.equal(finalRevalidation(source).status,'REVALIDATED_FOR_SEPARATE_MANUAL_ETSY_DECISION');
 assert.equal(finalRevalidation({...source,activeHolds:[original]}).status,'HOLD_REVALIDATION');
 assert.equal(finalRevalidation({...source,lastDecision:original}).status,'HOLD_REVALIDATION');
 assert.equal(finalRevalidation({...source,lastHold:row(70,{})}).status,'HOLD_REVALIDATION');
 assert.equal(finalRevalidation({...source,selectedImage:'7002'}).status,'HOLD_REVALIDATION');
 assert.equal(finalRevalidation({...source,acceptance:null}).status,'HOLD_REVALIDATION');
 assert.equal(finalRevalidation({...source,snapshot:{...snapshot,blockers:['not_unpublished_draft']}}).status,'HOLD_REVALIDATION');
 assert.equal(lastDecisionIsReady(decision),true);
});
test('Provider draft mismatch fails fresh snapshot: no publication or provider writes',()=>{
 const listing={listing_id:789,shop_id:57459161,state:'active',title:'Soap',quantity:3,
 price:{amount:900,divisor:100,currency_code:'CAD'}};
 const data={listing,shop:{shop_id:57459161},product:{product_id:54},
 draft:{product_id:'54',channel_key:'etsy',payload_json:JSON.stringify({title:'Soap',price_cents:900,quantity:3})},
 claim:{admin_action_audit_id:19},images:{results:[{listing_image_id:7001,full_width:1200}]},
 imageClaim:null,uploaded:null,reconciled:null,review:row(35,{image_ids:['7001']}),
 accepted:row(40,{listing_id:'789',image_id:'7001',compliance_review_receipt:35}),
 selected_image_id:'7001',shipping_reviewed:true};
 const x=gateFreshDraft(data);assert.equal(x.can_close_exception,false);
 assert.ok(x.unresolved_blockers.includes('not_unpublished_draft'));
 assert.equal(x.publication_performed,false);
});
test('Route: verified admin, local GET only, provider GET only, atomic audit writes',()=>{
 assert.equal(moduleKeyForPath('/api/admin/etsy-exception-resolution'),MODULE_KEYS.STOREFRONT);
 const api=f('functions/api/admin/etsy-exception-resolution.js'),ui=f('public/js/admin-etsy-exception-resolution-v404.js');
 assert.match(api,/verifiedAdminFromModule/);assert.match(api,/connectionBlockers/);
 assert.match(api,/etsy_exception_404_evidence/);assert.match(api,/etsy_exception_404_resolved/);
 assert.match(api,/etsy_decision_404_revalidated/);assert.match(api,/NOT EXISTS/);
 assert.match(api,/method:'GET'/);
 assert.doesNotMatch(api,/method:'PUT'|method:'PATCH'|createDraftListing|publishListing/);
 const get=api.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/providerGet\(|fetch\(|decryptOAuthSecret|INSERT INTO/);
 assert.match(ui,/addEventListener\('click'/);assert.doesNotMatch(ui,/setTimeout|setInterval|api\.etsy\.com/);
});
