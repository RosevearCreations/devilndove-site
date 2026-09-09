import assert from 'node:assert/strict';
import { CREATOR_WORKFLOW_BUILD, CREATOR_WORKFLOW_BOUNDARY, deriveCreatorWorkflow } from '../functions/api/_lib/creatorWorkflow.js';

const ready = deriveCreatorWorkflow({
  project: { creative_work_project_id: 12, project_title: 'Soap story', summary: 'A factual project summary.', rights_status: 'cleared', product_id: 44 },
  facts: {
    event_count: 3, material_count: 2, reviewed_material_count: 2, evidence_count: 4,
    caip_project_id: 8, caip_evidence_count: 4, profitability_count: 1,
    cost_allocation_count: 1, profitability_extension_count: 1, inventory_post_count: 2,
    content_project_id: 19, deliverable_count: 5, approved_deliverable_count: 5,
  },
});
assert.equal(CREATOR_WORKFLOW_BUILD, 84);
assert.equal(ready.stage_count, 8);
assert.equal(ready.overall_status, 'ready');
assert.equal(ready.stages.find((s) => s.key === 'product').status, 'ready');
assert.equal(ready.stages.find((s) => s.key === 'social_assets').status, 'ready');

const productless = deriveCreatorWorkflow({
  project: { creative_work_project_id: 13, project_title: 'Education clip', summary: 'Document a productless education clip.', rights_status: 'cleared', product_id: null },
  facts: {
    event_count: 1, material_count: 0, reviewed_material_count: 0, evidence_count: 1,
    caip_project_id: 9, caip_evidence_count: 1, profitability_count: 1,
    content_project_id: 20, deliverable_count: 2, approved_deliverable_count: 2,
  },
});
assert.equal(productless.stages.find((s) => s.key === 'materials').status, 'not_applicable');
assert.equal(productless.stages.find((s) => s.key === 'product').status, 'not_applicable');
assert.equal(productless.overall_status, 'ready');

const review = deriveCreatorWorkflow({
  project: { creative_work_project_id: 14, project_title: 'Needs review', summary: 'short', rights_status: 'needs_review' },
  facts: { event_count: 0, material_count: 1, reviewed_material_count: 0, evidence_count: 0, profitability_count: 0, content_project_id: 0, deliverable_count: 0, approved_deliverable_count: 0 },
});
assert.equal(review.overall_status, 'blocked');
assert.equal(review.stages.find((s) => s.key === 'social_assets').status, 'blocked');
assert.equal(review.stages.find((s) => s.key === 'evidence').status, 'review');

const rightsBlocked = deriveCreatorWorkflow({
  project: { creative_work_project_id: 15, project_title: 'Restricted evidence', summary: 'A complete factual project summary.', rights_status: 'restricted' },
  facts: { event_count: 1, evidence_count: 2, caip_project_id: 3, caip_evidence_count: 2, profitability_count: 1, content_project_id: 5, deliverable_count: 1, approved_deliverable_count: 1 },
});
assert.equal(rightsBlocked.stages.find((s) => s.key === 'evidence').status, 'blocked');
assert.equal(rightsBlocked.overall_status, 'blocked');

for (const key of ['raw_media_delete','raw_media_public_promotion','publication_execution','provider_execution','oauth_execution','inventory_mutation','accounting_posting','automatic_relationship_write','request_time_schema_mutation']) {
  assert.equal(CREATOR_WORKFLOW_BOUNDARY[key], false, `${key} must remain false`);
}
assert.equal(CREATOR_WORKFLOW_BOUNDARY.read_only_projection, true);
assert.equal(CREATOR_WORKFLOW_BOUNDARY.caip_private_media_authority_preserved, true);
assert.equal(CREATOR_WORKFLOW_BOUNDARY.build85_social_oauth_owner_preserved, true);

console.log('RELEASE 467 BUILD 84 CREATORS / CAIP WORKFLOW RUNTIME: PASS');
console.log('Workflow stages: 8 / PROJECT-TO-PROFITABILITY');
console.log('Productless projects: SUPPORTED');
console.log('Private/raw CAIP media: PRESERVED / NO DELETE OR AUTO-PROMOTION');
console.log('OAuth/provider/publication execution: NONE / BUILD 85 OWNER PRESERVED');
