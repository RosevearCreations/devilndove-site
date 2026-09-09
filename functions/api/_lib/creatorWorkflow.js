// Release 467 Build 84 — pure Creators / CAIP workflow projection.
// This module derives readiness only. It performs no I/O, mutation, publication or provider work.

export const CREATOR_WORKFLOW_BUILD = 84;

export const CREATOR_WORKFLOW_BOUNDARY = Object.freeze({
  read_only_projection: true,
  request_time_schema_mutation: false,
  d1_mutation: false,
  r2_mutation: false,
  raw_media_delete: false,
  raw_media_public_promotion: false,
  source_file_move: false,
  inventory_mutation: false,
  accounting_posting: false,
  product_mutation: false,
  content_mutation: false,
  publication_execution: false,
  provider_execution: false,
  oauth_execution: false,
  automatic_relationship_write: false,
  creative_process_authority_preserved: true,
  caip_private_media_authority_preserved: true,
  inventory_authority_preserved: true,
  content_studio_authority_preserved: true,
  finance_profitability_read_authority_preserved: true,
  build85_social_oauth_owner_preserved: true,
});

const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const text = (value) => String(value ?? '').trim();

function stage({ key, label, owner, route, required = true, status, evidence, correction, note = '' }) {
  return Object.freeze({ key, label, owner, route, required, status, evidence, correction, note });
}

function projectRoute(path, projectId) {
  return `${path}?creative_project_id=${encodeURIComponent(projectId)}`;
}

export function deriveCreatorWorkflow(snapshot = {}) {
  const project = snapshot.project || {};
  const projectId = num(project.creative_work_project_id);
  const facts = snapshot.facts || {};
  const materialCount = num(facts.material_count);
  const reviewedMaterials = num(facts.reviewed_material_count);
  const evidenceCount = num(facts.evidence_count);
  const caipId = num(facts.caip_project_id);
  const caipEvidenceCount = num(facts.caip_evidence_count);
  const profitabilityCount = num(facts.profitability_count);
  const costAllocationCount = num(facts.cost_allocation_count);
  const profitabilityExtensionCount = num(facts.profitability_extension_count);
  const inventoryPostCount = num(facts.inventory_post_count);
  const contentId = num(facts.content_project_id);
  const deliverableCount = num(facts.deliverable_count);
  const approvedDeliverables = num(facts.approved_deliverable_count);
  const productId = num(project.product_id);
  const eventCount = num(facts.event_count);
  const summaryReady = text(project.summary).length >= 10;
  const rights = text(project.rights_status || 'needs_review').toLowerCase();
  const rightsCleared = rights === 'cleared';
  const rightsBlocked = ['blocked', 'restricted', 'denied'].includes(rights);
  const projectReady = projectId > 0 && summaryReady && eventCount > 0;
  const evidenceReady = evidenceCount > 0 && rightsCleared && caipId > 0 && caipEvidenceCount > 0;
  const materialsReady = materialCount > 0 && reviewedMaterials >= materialCount;
  const materialStatus = materialCount === 0 ? 'not_applicable' : materialsReady ? 'ready' : 'review';
  const costEvidenceCount = profitabilityCount + costAllocationCount + profitabilityExtensionCount + inventoryPostCount;
  const costReady = costEvidenceCount > 0;
  const contentReady = contentId > 0 && deliverableCount > 0;
  const socialReady = deliverableCount > 0 && approvedDeliverables >= deliverableCount;
  const profitabilityReady = profitabilityCount > 0;

  const stages = [
    stage({
      key: 'project',
      label: '1. Creative Project',
      owner: 'Creative Process',
      route: projectRoute('/admin/creative-process/', projectId),
      status: projectReady ? 'ready' : 'review',
      evidence: `${summaryReady ? 'Summary saved' : 'Summary needs review'} · ${eventCount} timeline event${eventCount === 1 ? '' : 's'}`,
      correction: 'Save a factual project summary and at least one timeline/process event in Creative Process.',
    }),
    stage({
      key: 'evidence',
      label: '2. Evidence, rights & CAIP',
      owner: 'Creative Asset Intelligence Platform',
      route: projectRoute('/admin/creative-assets/', projectId),
      status: evidenceReady ? 'ready' : rightsBlocked ? 'blocked' : 'review',
      evidence: `${evidenceCount} selected evidence · rights ${rights || 'needs review'} · CAIP ${caipId || 'not linked'}${caipId ? ` / ${caipEvidenceCount} mirrored evidence` : ''}`,
      correction: 'Select source evidence, clear ownership/privacy/consent, and mirror reviewed references into CAIP. Keep private/raw originals internal.',
      note: 'Private/raw media remains immutable/internal until a separate reviewed promotion path explicitly clears it.',
    }),
    stage({
      key: 'materials',
      label: '3. Materials & inventory evidence',
      owner: 'Creative Process + Inventory',
      route: projectRoute('/admin/creative-process/', projectId),
      required: materialCount > 0,
      status: materialStatus,
      evidence: materialCount ? `${reviewedMaterials} of ${materialCount} material rows approved` : 'No material rows recorded; valid for content-only, education, archive or other productless work.',
      correction: materialCount ? 'Review quantities, units, waste/reuse and any explicit audited Inventory post/reversal.' : 'No correction required unless this project actually consumes materials.',
    }),
    stage({
      key: 'costs',
      label: '4. Cost basis',
      owner: 'Creative Process + Finance read authority',
      route: projectRoute('/admin/creative-process/', projectId),
      status: costReady ? 'ready' : 'review',
      evidence: `${profitabilityCount} profitability record · ${costAllocationCount} allocation · ${profitabilityExtensionCount} extension · ${inventoryPostCount} inventory post`,
      correction: 'Document the factual labour, material, packaging, overhead, fee and other applicable cost assumptions. Do not post accounting from this workflow.',
    }),
    stage({
      key: 'product',
      label: '5. Product bridge',
      owner: 'Catalog / Product',
      route: productId ? `/admin/products/?product_id=${encodeURIComponent(productId)}` : '/admin/products/',
      required: false,
      status: productId ? 'ready' : 'not_applicable',
      evidence: productId ? `Linked Product ${productId}` : 'No Product linked. Productless Creative Projects remain valid.',
      correction: 'Link the finished Product only when this project actually produces or maintains a sellable Product. Never create one automatically.',
    }),
    stage({
      key: 'content',
      label: '6. Content Studio handoff',
      owner: 'Content Studio',
      route: contentId ? `/admin/content-studio/?content_project_id=${encodeURIComponent(contentId)}` : projectRoute('/admin/content-studio/', projectId),
      status: contentReady ? 'ready' : 'review',
      evidence: `Content project ${contentId || 'not linked'} · ${deliverableCount} planned deliverable${deliverableCount === 1 ? '' : 's'}`,
      correction: 'Create or refresh the reviewed Creative Project → Content Studio handoff and restore the intended deliverable plan.',
    }),
    stage({
      key: 'social_assets',
      label: '7. Social/channel assets',
      owner: 'Content Studio; provider execution deferred to Build 85',
      route: contentId ? `/admin/content-studio/?content_project_id=${encodeURIComponent(contentId)}` : '/admin/content-studio/',
      status: !contentReady ? 'blocked' : socialReady ? 'ready' : 'review',
      evidence: `${approvedDeliverables} of ${deliverableCount} deliverables human-approved`,
      correction: 'Review channel facts, media, captions, privacy, format and tracking. Approval is draft readiness only; it is not publication proof.',
      note: 'No OAuth, provider queue submission or publication is executed in Build 84.',
    }),
    stage({
      key: 'profitability',
      label: '8. Profitability',
      owner: 'Creative Process facts + Finance read intelligence',
      route: projectRoute('/admin/creative-process/', projectId),
      status: profitabilityReady ? 'ready' : 'review',
      evidence: profitabilityReady ? `${profitabilityCount} saved profitability record${profitabilityCount === 1 ? '' : 's'}` : 'No saved profitability record.',
      correction: 'Save factual cost/revenue assumptions and review profitability. Accounting posting remains outside the Creator workflow.',
    }),
  ];

  const requiredStages = stages.filter((item) => item.required !== false);
  const blocked = requiredStages.filter((item) => item.status === 'blocked');
  const review = requiredStages.filter((item) => !['ready', 'not_applicable'].includes(item.status));
  const readyCount = stages.filter((item) => ['ready', 'not_applicable'].includes(item.status)).length;
  const overall_status = blocked.length ? 'blocked' : review.length ? 'review' : 'ready';

  return Object.freeze({
    release: 467,
    build: CREATOR_WORKFLOW_BUILD,
    project_id: projectId || null,
    project_title: text(project.project_title) || null,
    overall_status,
    ready_count: readyCount,
    stage_count: stages.length,
    required_stage_count: requiredStages.length,
    stages,
    boundaries: CREATOR_WORKFLOW_BOUNDARY,
  });
}
