import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileEtsyPhotoInventory487} from '../functions/api/admin/product-etsy-images.js';
import {assessIndependentRetest487} from '../public/js/maker-aftercare-retest-policy-487.mjs';
const src=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('Build487 existing photos are held, not replaced or silently duplicated',()=>{
 assert.deepEqual(reconcileEtsyPhotoInventory487([{listing_image_id:12}],[]).reason,'existing_etsy_photos_need_manual_reconciliation');
 assert.equal(reconcileEtsyPhotoInventory487([{listing_image_id:12}],[{etsy_image_id:'12'}]).ready,true);
 assert.equal(reconcileEtsyPhotoInventory487([],[{etsy_image_id:'12'}]).reason,'tracked_photo_missing_from_etsy');
 assert.equal(reconcileEtsyPhotoInventory487(null,[]).ready,false);
});
test('Build487 UI exposes explicit read-only comparison and Product Media approval',()=>{
 assert.match(src('../admin/product-editor/index.html'),/dd487EtsyReconcile/);
 assert.match(src('../public/js/admin-product-unified-publishing-v443.js'),/reconcile=1/);
 assert.match(src('../public/js/admin-product-unified-publishing-v443.js'),/will not overwrite or duplicate/);
});
test('Build487 independent aftercare retest fails closed and never executes case action',()=>{
 const row={evidence_id:1,priority_receipt_id:2,handoff_receipt_id:3,reassessment_receipt_id:4,decision_receipt_id:5,independent_decision_handoff_receipt_id:6,outcome_receipt_id:7};
 const note='Build 486 independent handoff outcome; source follow-up #1; priority receipt #2; handoff receipt #3; reassessment receipt #4; decision receipt #5; independent receipt #6; outcome=owner_reconciliation_pending; evidence=private123; owner independently reconciled; case remains open; no external action.';
 assert.deepEqual(assessIndependentRetest487({caseRow:row,outcomeNote:note,independentReviewerConfirmed:true}).holds,[]);
 const invalid=assessIndependentRetest487({caseRow:row,outcomeNote:note.replace('receipt #6','receipt #66'),independentReviewerConfirmed:true});
 assert.equal(invalid.ready,false);assert.equal(invalid.case_closed,false);assert.equal(invalid.external_action,false);
});
