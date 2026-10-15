import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseReceipt,reconcileClassification,strictOwnerApproval,finalReviewReady} from '../functions/api/_lib/etsyImageReconciliation402.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const row=details=>({admin_action_audit_id:11,details_json:JSON.stringify(details)});
const listing={listing_id:111,state:'draft'};
const images={results:[{listing_image_id:7001,full_width:1600,full_height:1600,alt_text:'Soap'}]};
const review=row({image_ids:['7001']});
const claim=row({listing_id:'111'});
const accepted=row({listing_id:'111',image_id:'7001'});
const owner={owner_confirmed_current_photo:true,owner_confirmed_compliance:true,
 owner_acknowledges_unpublished:true,owner_approves_local_acceptance:true};
const state=(o={})=>reconcileClassification({listing,images,claim:null,uploaded:null,reconciled:null,review,...o});
test('Only all explicit owner attestations pass; cannot accept read-only inspection',()=>{
 assert.equal(strictOwnerApproval(owner),true);
 for(const k of Object.keys(owner))assert.equal(strictOwnerApproval({...owner,[k]:false}),false,k);
 assert.equal(strictOwnerApproval(null),false);
});
test('Known uploaded image ID verified against fresh Etsy provider images',()=>{
 const r=state({claim,uploaded:accepted});
 assert.equal(r.upload_outcome,'PROVIDER_ID_VERIFIED_LIVE');
 assert.equal(finalReviewReady(r,'7001',true).ready,true);
 assert.equal(finalReviewReady(r,'8000',true).ready,false);
});
test('Unknown upload stays ambiguous and cannot become final without owner reconciliation',()=>{
 const r=state({claim});
 assert.equal(r.upload_outcome,'AMBIGUOUS_PRESENT_NEEDS_OWNER_CORROBORATION');
 assert.equal(finalReviewReady(r,'7001',true).ready,false);
 const reconciled=state({claim,reconciled:row({listing_id:'111',image_id:'7001'})});
 assert.equal(reconciled.upload_outcome,'OWNER_CORROBORATED_PRESENT');
 assert.equal(finalReviewReady(reconciled,'7001',true).ready,true);
});
test('Missing image, live listing state change, missing Build 401 review and mismatched receipts fail closed',()=>{
 assert.equal(state({claim,uploaded:accepted,images:{results:[]}}).upload_outcome,'PROVIDER_ID_MISMATCH_HOLD');
 assert.equal(finalReviewReady(state({claim,uploaded:accepted,images:{results:[]}}),'7001',true).ready,false);
 assert.equal(finalReviewReady(state({listing:{...listing,state:'active'}}),'7001',false).ready,false);
 assert.equal(finalReviewReady(state({review:null}),'7001',false).ready,false);
 assert.equal(finalReviewReady(state({review:row({image_ids:['9999']})}),'7001',false).ready,false);
 assert.ok(state({claim,uploaded:row({listing_id:'999',image_id:'7001'})}).blockers.includes('upload_receipt_listing_mismatch'));
 assert.equal(state({claim,images:{results:[]}}).upload_outcome,'UNKNOWN_AFTER_CLAIM');
});
test('No-claim pre-existing image requires Build 401 review and manual acceptance',()=>{
 const r=state();assert.equal(r.upload_outcome,'PRE_EXISTING_IMAGE_MANUAL_REVIEW');
 assert.equal(finalReviewReady(r,'7001',false).ready,true);
});
test('API route is admin protected, GET is local only, provider operations are GET, audit writes idempotent',()=>{
 assert.equal(moduleKeyForPath('/api/admin/etsy-image-reconciliation'),MODULE_KEYS.STOREFRONT);
 const s=file('functions/api/admin/etsy-image-reconciliation.js');
 assert.match(s,/verifiedAdminFromModule/);assert.match(s,/connectionBlockers/);
 assert.match(s,/decryptOAuthSecret/);assert.match(s,/etsy_image_outcome_402_reconciled/);
 assert.match(s,/etsy_draft_402_final_accepted/);assert.match(s,/WHERE NOT EXISTS/);
 assert.match(s,/method:'GET'/);assert.doesNotMatch(s,/method:'POST'.*api\.etsy/);
 assert.doesNotMatch(s,/\/state\/active|updateListing|createDraftListing|publication_performed:true/);
 const get=s.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/providerRead\(|fetch\(|INSERT INTO|UPDATE /);
 const client=file('public/js/admin-etsy-image-reconciliation-v402.js');
 assert.match(client,/addEventListener\('click'/);
 assert.doesNotMatch(client,/setInterval|setTimeout|api\.etsy\.com|upload_one_image/);
});
