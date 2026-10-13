import test from 'node:test';import assert from 'node:assert/strict';
import {EVENTS,STAGES,eventGuard,positive} from '../functions/api/admin/_lib/commissionRules.js';
test('all source-owned lifecycle decisions have explicit gated requirements',()=>{
 assert.equal(EVENTS.length,7);assert.equal(STAGES.includes('production_in_progress'),true);
 assert.equal(eventGuard('quote_review',{}),'SOURCE_QUOTE_REQUIRED');
 assert.equal(eventGuard('revision_review',{}),'SOURCE_REVISION_REQUIRED');
 assert.equal(eventGuard('deposit_request_review',{}),'SOURCE_PAYMENT_REQUEST_DRAFT_REQUIRED');
 assert.equal(eventGuard('customer_proof_review',{proof:{proof_status:'sent'}}),'CUSTOMER_PROOF_NOT_APPROVED');
 assert.equal(eventGuard('customer_proof_review',{proof:{proof_status:'approved'}}),null);
 assert.equal(eventGuard('handoff_review',{job:{},requestStatus:'new'}),'ACCEPTANCE_AND_JOB_DRAFT_REQUIRED');
 assert.equal(eventGuard('handoff_review',{job:{},requestStatus:'accepted'}),null);
 assert.equal(eventGuard('progress_approval',{activeOrderLink:false,stage:'design_review'}),'ORDER_LINK_AND_PROGRESS_STAGE_REQUIRED');
 assert.equal(eventGuard('progress_approval',{activeOrderLink:true,stage:'production_in_progress'}),'ACTUAL_PRODUCTION_EVIDENCE_REQUIRED');
 assert.equal(eventGuard('progress_approval',{activeOrderLink:true,stage:'production_in_progress',actualEvidence:true}),null);
 assert.equal(eventGuard('progress_approval',{activeOrderLink:true,stage:'secret_internal_notes'}),'ORDER_LINK_AND_PROGRESS_STAGE_REQUIRED');
 assert.equal(positive(-2),0);
});
