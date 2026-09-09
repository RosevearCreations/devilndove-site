import assert from 'node:assert/strict';
import { buildPackagingReleaseWorkflow } from '../public/js/modules/packaging/release-workflow-v83.mjs';

const base = {
  project: {
    packaging_project_id: 83,
    project_key: 'soap-health-oatmeal',
    project_name: 'Health Oatmeal & Goat Milk',
    package_type: 'soap_ribbon',
    packaging_template_id: 7,
    artwork: { rose_asset_id: 'rose-oatmeal-v1' },
  },
  template: {
    packaging_template_id: 7,
    template_name: 'Soap reference v3',
    package_type: 'soap_ribbon',
    page_width_mm: 279.4,
    page_height_mm: 50,
    layout: { design_profile: 'soap_reference_v3' },
  },
  preflight: { missing: [], dimension_blockers: [], dimension_warnings: [] },
  components: [
    { site_item_inventory_id: 11, unit_cost_cents: 18, quantity_per_finished_unit: 1, wastage_percent: 5 },
    { site_item_inventory_id: 12, unit_cost_cents: 4, quantity_per_finished_unit: 1, wastage_percent: 0 },
  ],
  versions: [
    { packaging_project_version_id: 90, version_number: 3, review_status: 'approved' },
  ],
  print_tests: [
    { packaging_project_version_id: 90, test_status: 'passed', scale_percent: 100, wrap_fit_status: 'passed', legibility_status: 'passed', overlap_status: 'passed' },
  ],
  exports: [
    { packaging_project_version_id: 90, export_status: 'completed', export_format: 'svg', file_name: 'health-oatmeal-v3.svg' },
  ],
  soap_exports: [],
};

const ready = buildPackagingReleaseWorkflow(base);
assert.equal(ready.build, 83);
assert.equal(ready.overall_status, 'ready');
assert.equal(ready.evidence.reusable_version_count, 1);
assert.equal(ready.stages.find((row) => row.key === 'reprint').status, 'ready');
assert.equal(ready.boundaries.reprint_execution, false);

const missingContent = buildPackagingReleaseWorkflow({
  ...base,
  preflight: { missing: ['French product identity'], dimension_blockers: [], dimension_warnings: [] },
});
assert.equal(missingContent.overall_status, 'blocked');
assert.ok(missingContent.blockers.includes('French product identity'));

const draftOnly = buildPackagingReleaseWorkflow({
  ...base,
  versions: [{ packaging_project_version_id: 91, version_number: 4, review_status: 'needs_review' }],
  print_tests: [],
  exports: [],
});
assert.equal(draftOnly.overall_status, 'review');
assert.equal(draftOnly.stages.find((row) => row.key === 'reprint').status, 'unavailable');

const uncosted = buildPackagingReleaseWorkflow({
  ...base,
  components: [{ site_item_inventory_id: null, unit_cost_cents: 0, quantity_per_finished_unit: 1 }],
});
assert.equal(uncosted.stages.find((row) => row.key === 'components').status, 'review');
assert.ok(uncosted.warnings.some((row) => row.includes('no positive unit cost')));

console.log('RELEASE 467 BUILD 83 LABELING & PACKAGING RUNTIME: PASS');
console.log('Stages: template -> content -> components -> artwork -> proof -> approval -> export -> reprint');
console.log('Reprint: immutable approved + passed physical QA + export evidence');
console.log('Mutation / provider / publication execution: NONE');
