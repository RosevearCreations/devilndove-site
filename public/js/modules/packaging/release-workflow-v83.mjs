// Release 467 Build 83 — Labeling & Packaging Studio release workflow.
// Pure derivation only: no network, D1/R2 mutation, printing, export, publication or provider execution.
export const PACKAGING_RELEASE_WORKFLOW_RELEASE = 467;
export const PACKAGING_RELEASE_WORKFLOW_BUILD = 83;

const text = (value) => String(value ?? '').trim();
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const list = (value) => Array.isArray(value) ? value : [];
const unique = (values) => [...new Set(values.map(text).filter(Boolean))];

function hasArtwork(project = {}, template = {}) {
  const artwork = project.artwork && typeof project.artwork === 'object' ? project.artwork : {};
  const fields = [
    project.rose_asset_id,
    artwork.rose_asset_id,
    artwork.artwork_asset,
    artwork.artwork_asset_path,
    artwork.artwork_url,
    artwork.image_url,
    artwork.media_asset_id,
    artwork.candle_primary_text,
    template?.layout?.default_artwork_asset,
  ];
  return fields.some((value) => text(value));
}

function passedPhysicalProof(row = {}) {
  return text(row.test_status) === 'passed'
    && number(row.scale_percent, 0) === 100
    && text(row.wrap_fit_status) === 'passed'
    && text(row.legibility_status) === 'passed'
    && text(row.overlap_status) === 'passed';
}

function approvedVersion(row = {}) {
  return text(row.review_status).toLowerCase() === 'approved';
}

function stage(key, label, status, detail, blockers = [], warnings = []) {
  return Object.freeze({
    key,
    label,
    status,
    detail: text(detail),
    blockers: unique(blockers),
    warnings: unique(warnings),
  });
}

export function buildPackagingReleaseWorkflow(detail = {}) {
  const project = detail?.project || {};
  const template = detail?.template || {};
  const preflight = detail?.preflight || {};
  const components = list(detail?.components);
  const versions = list(detail?.versions);
  const exports = [...list(detail?.exports), ...list(detail?.soap_exports)];
  const printTests = list(detail?.print_tests);
  const packageType = text(project.package_type || template.package_type || 'packaging') || 'packaging';

  const missing = unique(preflight.missing || []);
  const dimensionBlockers = unique(preflight.dimension_blockers || []);
  const dimensionWarnings = unique(preflight.dimension_warnings || []);
  const hasTemplate = Number(project.packaging_template_id || template.packaging_template_id || 0) > 0
    && number(template.page_width_mm, 0) > 0
    && number(template.page_height_mm, 0) > 0;

  const componentCostCents = components.reduce((sum, row) => {
    const quantity = Math.max(0, number(row.quantity_per_finished_unit, 0));
    const unit = Math.max(0, number(row.unit_cost_cents, 0));
    const waste = Math.max(0, number(row.wastage_percent, 0));
    return sum + Math.round(quantity * unit * (1 + waste / 100));
  }, 0);
  const uncostedComponents = components.filter((row) => number(row.unit_cost_cents, 0) <= 0);
  const unlinkedComponents = components.filter((row) => !Number(row.site_item_inventory_id || 0));
  const artworkReady = hasArtwork(project, template);
  const passedProofs = printTests.filter(passedPhysicalProof);
  const approvedVersions = versions.filter(approvedVersion);
  const reusableVersionIds = new Set(
    passedProofs
      .map((row) => Number(row.packaging_project_version_id || 0))
      .filter(Boolean)
  );
  const reusableVersions = approvedVersions.filter((row) => reusableVersionIds.has(Number(row.packaging_project_version_id || 0)));
  const successfulExports = exports.filter((row) => ['generated', 'complete', 'completed', 'success', 'passed'].includes(text(row.export_status).toLowerCase()) || text(row.file_name));
  const hasVersionHistory = versions.length > 0;

  const stages = [
    stage(
      'template',
      'Reusable template',
      hasTemplate ? 'ready' : 'blocked',
      hasTemplate ? `${text(template.template_name || project.project_name || 'Template')} · ${number(template.page_width_mm)} × ${number(template.page_height_mm)} mm` : 'Choose a saved reusable Packaging template with physical dimensions.',
      hasTemplate ? [] : ['Reusable template and physical dimensions are required.'],
      dimensionWarnings
    ),
    stage(
      'content',
      'Label content & compliance',
      missing.length || dimensionBlockers.length ? 'blocked' : 'ready',
      missing.length || dimensionBlockers.length ? 'Resolve saved content / compliance blockers before approval.' : 'Saved label content passes the current Packaging preflight.',
      [...missing, ...dimensionBlockers],
      dimensionWarnings
    ),
    stage(
      'components',
      'Components & unit cost',
      components.length && !uncostedComponents.length ? 'ready' : 'review',
      components.length
        ? `${components.length} active component(s) · estimated ${componentCostCents}¢ per finished unit.`
        : 'No active packaging components are attached yet.',
      [],
      [
        ...(components.length ? [] : ['Confirm whether this format requires tracked packaging components.']),
        ...(uncostedComponents.length ? [`${uncostedComponents.length} component(s) have no positive unit cost.`] : []),
        ...(unlinkedComponents.length ? [`${unlinkedComponents.length} component(s) are not linked to Inventory.`] : []),
      ]
    ),
    stage(
      'artwork',
      'Artwork & media',
      artworkReady ? 'ready' : 'review',
      artworkReady ? 'Saved artwork/media direction is present.' : 'No saved visible artwork/media selection was found.',
      [],
      artworkReady ? [] : ['Choose reviewed artwork or explicitly confirm a text-only packaging format.']
    ),
    stage(
      'proof',
      'Physical proof',
      passedProofs.length ? 'ready' : 'review',
      passedProofs.length ? `${passedProofs.length} passed 100%-scale physical QA record(s).` : 'A passed 100%-scale physical print/wrap proof is still required for production reuse.',
      [],
      passedProofs.length ? [] : ['Record printer, scale, wrap fit, legibility and overlap evidence.']
    ),
    stage(
      'approval',
      'Approval & immutable version',
      reusableVersions.length ? 'ready' : approvedVersions.length ? 'review' : 'review',
      reusableVersions.length
        ? `${reusableVersions.length} approved version(s) have matching passed physical QA.`
        : approvedVersions.length
          ? 'Approved version exists, but it still needs matching passed physical QA for reusable production.'
          : 'No approved saved Packaging version is reusable yet.',
      [],
      reusableVersions.length ? [] : ['Save a review version, approve it explicitly, and keep its immutable SVG artifact/evidence.']
    ),
    stage(
      'export',
      'Export evidence',
      successfulExports.length ? 'ready' : 'review',
      successfulExports.length ? `${successfulExports.length} export-history record(s) are available.` : 'No completed export evidence is recorded yet.',
      [],
      successfulExports.length ? [] : ['Generate/export only after the intended version and proof state are reviewed.']
    ),
    stage(
      'reprint',
      'Reprint / repeat job',
      reusableVersions.length && successfulExports.length ? 'ready' : 'unavailable',
      reusableVersions.length && successfulExports.length
        ? 'Use the existing Label Production & Reuse lane to print an immutable approved version at exact 100% size.'
        : 'Reprint remains unavailable until an approved QA-backed version and export evidence exist.',
      [],
      reusableVersions.length && successfulExports.length ? [] : ['Do not reprint from an unsaved working draft.']
    ),
  ];

  const blocking = stages.flatMap((row) => row.blockers);
  const review = stages.filter((row) => row.status === 'review' || row.status === 'unavailable');
  const overall = blocking.length ? 'blocked' : review.length ? 'review' : 'ready';

  return Object.freeze({
    release: PACKAGING_RELEASE_WORKFLOW_RELEASE,
    build: PACKAGING_RELEASE_WORKFLOW_BUILD,
    project_id: Number(project.packaging_project_id || 0) || null,
    project_key: text(project.project_key) || null,
    project_name: text(project.project_name) || null,
    package_type: packageType,
    overall_status: overall,
    stages: Object.freeze(stages),
    blockers: Object.freeze(unique(blocking)),
    warnings: Object.freeze(unique(stages.flatMap((row) => row.warnings))),
    evidence: Object.freeze({
      component_count: components.length,
      component_cost_cents: componentCostCents,
      version_count: versions.length,
      approved_version_count: approvedVersions.length,
      reusable_version_count: reusableVersions.length,
      print_test_count: printTests.length,
      passed_physical_proof_count: passedProofs.length,
      export_count: exports.length,
      successful_export_count: successfulExports.length,
      version_history_present: hasVersionHistory,
    }),
    boundaries: Object.freeze({
      read_only_projection: true,
      request_time_schema_mutation: false,
      d1_mutation: false,
      r2_mutation: false,
      print_execution: false,
      export_execution: false,
      reprint_execution: false,
      publication_execution: false,
      provider_execution: false,
      existing_packaging_write_authority_preserved: true,
      existing_build44_production_lane_preserved: true,
    }),
  });
}
