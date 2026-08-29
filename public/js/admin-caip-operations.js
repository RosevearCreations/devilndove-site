// Devil n Dove Release 458 — read-only CAIP private-media/evidence/handoff operations intelligence.
(() => {
  'use strict';
  const mount = document.getElementById('caipOperationsMount');
  if (!mount || !window.DDAuth?.apiFetch) return;
  const RELEASE = 458;
  const OUTPUT_TYPES = new Set(['proxy_video','thumbnail','frame_extract','audio_extract','transcript']);
  const text = (v) => String(v ?? '').trim();
  const num = (v) => Number(v || 0) || 0;
  const arr = (v) => Array.isArray(v) ? v : [];
  const esc = (v) => text(v).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const human = (v) => text(v).replaceAll('_',' ') || 'not set';
  const queryProject = () => num(new URLSearchParams(location.search).get('creative_project_id') || new URLSearchParams(location.search).get('project_id'));

  async function read(url) {
    const response = await window.DDAuth.apiFetch(url, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `CAIP read failed (${response.status}).`);
    return data;
  }

  function issue(priority, title, detail, href, owner) { return { priority, title, detail, href, owner }; }

  function summarize(bundle, handoff) {
    const issues = [];
    const project = bundle?.project || {};
    const assets = arr(bundle?.assets);
    const temporal = assets.filter((x) => x.can_temporal_review);
    const privateObjects = temporal.filter((x) => x.private_object);
    const markers = arr(bundle?.markers).filter((x) => x.marker_status !== 'archived');
    const approved = markers.filter((x) => x.review_status === 'approved');
    const needsReview = markers.filter((x) => x.review_status !== 'approved' && x.review_status !== 'rejected');
    const approvedUnlinked = approved.filter((x) => !num(x.linked_story_evidence_id));
    const linkedNeedsReview = markers.filter((x) => num(x.linked_story_evidence_id) && x.linked_evidence_review_status !== 'approved');
    const jobs = arr(bundle?.processing?.jobs).filter((x) => OUTPUT_TYPES.has(text(x.job_type)));
    const artifacts = arr(bundle?.processing?.artifacts);
    const verifiedArtifacts = artifacts.filter((x) => text(x.verification_status) === 'verified' || num(x.is_verified) === 1);
    const pendingJobs = jobs.filter((x) => !['complete','completed'].includes(text(x.job_status).toLowerCase()));
    const contentProjectId = num(project.content_project_id || handoff?.project?.content_project_id);
    const eligibleEvidence = arr(handoff?.evidence);
    const stored = handoff?.handoff || null;
    const packageStale = Boolean(handoff?.package_stale);

    if (!bundle?.schema_ready) issues.push(issue('high','Temporal-evidence authority unavailable',`Missing: ${arr(bundle?.missing_tables).join(', ') || 'required CAIP tables'}.`,'#caipEvidenceReviewMount','CAIP'));
    if (!temporal.length) issues.push(issue('medium','No temporal media to review','Add or link video/audio source media before timecode evidence can be captured.','#caipMediaIntakeMount','Media intake'));
    if (needsReview.length) issues.push(issue('medium','Temporal markers need review',`${needsReview.length} active marker${needsReview.length === 1 ? '' : 's'} still require an approval/rejection decision.`,'#caipEvidenceReviewMount','Evidence review'));
    if (approvedUnlinked.length) issues.push(issue('medium','Approved markers are not story-linked',`${approvedUnlinked.length} approved marker${approvedUnlinked.length === 1 ? '' : 's'} still need promotion to story evidence.`,'#caipEvidenceReviewMount','Story evidence'));
    if (linkedNeedsReview.length) issues.push(issue('medium','Linked story evidence needs review',`${linkedNeedsReview.length} linked evidence record${linkedNeedsReview.length === 1 ? '' : 's'} are not approved yet.`,'#caipEvidenceReviewMount','Story evidence'));
    if (pendingJobs.length) issues.push(issue('low','Processing outputs remain pending',`${pendingJobs.length} output job${pendingJobs.length === 1 ? '' : 's'} remain incomplete; completion still requires verified artifacts.`,'#caipEvidenceReviewMount','Processing'));
    if (!contentProjectId) issues.push(issue('high','Content Studio project is not linked','The CAIP project cannot create a reviewed handoff package until a Content Studio project link exists.','/admin/content-studio/','Content Studio'));
    if (contentProjectId && !eligibleEvidence.length) issues.push(issue('medium','No approved evidence is handoff-eligible','Approve temporal evidence and linked story evidence before reviewing a Content Studio handoff package.','#caipEvidenceReviewMount','Evidence review'));
    if (contentProjectId && eligibleEvidence.length && !stored) issues.push(issue('low','Content handoff package not prepared',`${eligibleEvidence.length} approved marker${eligibleEvidence.length === 1 ? '' : 's'} are eligible for a reference-only package.`,'/admin/caip-content-handoff/?creative_project_id=' + num(project.creative_project_id),'Handoff'));
    if (stored && packageStale) issues.push(issue('high','Prepared Content Studio package is stale','Approved evidence or segment counts changed after the package was prepared. Refresh it before review.','/admin/caip-content-handoff/?creative_project_id=' + num(project.creative_project_id),'Handoff'));
    if (stored && !packageStale && stored.handoff_status !== 'reviewed' && eligibleEvidence.length) issues.push(issue('low','Content handoff awaits review','The prepared package matches current approved evidence and is ready for a human review decision.','/admin/caip-content-handoff/?creative_project_id=' + num(project.creative_project_id),'Handoff'));

    return {
      issues,
      metrics: {
        temporal: temporal.length,
        privateObjects: privateObjects.length,
        markers: markers.length,
        approved: approved.length,
        approvedStory: eligibleEvidence.length,
        verifiedArtifacts: verifiedArtifacts.length,
        handoff: stored ? human(stored.handoff_status) : 'not prepared',
      },
      contentProjectId,
      packageStale,
      eligibleEvidenceCount: eligibleEvidence.length,
    };
  }

  function renderProjectList(projects, selected) {
    const rows = projects.slice(0, 24);
    return `<div class="caip-ops-projects">${rows.map((p) => {
      const id = num(p.creative_project_id);
      const label = p.product_name || p.project_title || p.creative_project_key || `CAIP ${id}`;
      return `<a class="caip-ops-project ${id === selected ? 'is-selected' : ''}" href="/admin/creative-assets/?creative_project_id=${id}#caipOperationsMount"><strong>${esc(label)}</strong><small>${num(p.temporal_asset_count)} temporal • ${num(p.asset_count)} total assets</small></a>`;
    }).join('') || '<p class="small">No CAIP projects are available.</p>'}</div>`;
  }

  function render(data) {
    const { projects, selected, bundle, handoff, failures } = data;
    const project = bundle?.project || projects.find((p) => num(p.creative_project_id) === selected) || {};
    const summary = bundle ? summarize(bundle, handoff) : { issues: [], metrics: {}, contentProjectId: 0, packageStale: false, eligibleEvidenceCount: 0 };
    const order = { high: 0, medium: 1, low: 2 };
    summary.issues.sort((a,b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9) || a.title.localeCompare(b.title));
    const metrics = summary.metrics;
    const handoffHref = selected ? `/admin/caip-content-handoff/?creative_project_id=${selected}` : '/admin/caip-content-handoff/';
    const contentHref = summary.contentProjectId ? `/admin/content-studio/?content_project_id=${summary.contentProjectId}` : '/admin/content-studio/';
    mount.innerHTML = `<section class="card caip-ops" aria-labelledby="caipOperationsHeading">
      <div class="caip-ops-head"><div><p class="eyebrow">Release ${RELEASE} • Creators / CAIP operations</p><h2 id="caipOperationsHeading">Private media, evidence & handoff readiness</h2><p class="small">A read-only exception cockpit over existing CAIP authorities. It does not copy originals, execute providers, publish content, or create another evidence ledger.</p></div><div class="caip-ops-actions"><a class="btn" href="#caipEvidenceReviewMount">Review evidence</a><a class="btn secondary" href="${esc(handoffHref)}">Open handoff</a><a class="btn secondary" href="${esc(contentHref)}">Content Studio</a></div></div>
      <p class="small" role="status" aria-live="polite" data-admin-workspace-status data-state="${failures.length ? 'warning' : 'ready'}">${failures.length ? `${failures.length} CAIP read source${failures.length === 1 ? '' : 's'} unavailable; readiness is partial.` : 'CAIP readiness loaded from current Development authorities.'}</p>
      <div class="caip-ops-layout"><div><h3>Current project</h3><p><strong>${esc(project.product_name || project.project_title || project.creative_project_key || 'No project selected')}</strong></p>
        <div class="caip-ops-metrics">
          <div><span>Temporal media</span><strong>${esc(metrics.temporal ?? '—')}</strong></div><div><span>Private R2 media</span><strong>${esc(metrics.privateObjects ?? '—')}</strong></div><div><span>Active markers</span><strong>${esc(metrics.markers ?? '—')}</strong></div><div><span>Approved markers</span><strong>${esc(metrics.approved ?? '—')}</strong></div><div><span>Handoff-eligible</span><strong>${esc(summary.eligibleEvidenceCount ?? '—')}</strong></div><div><span>Handoff</span><strong>${esc(metrics.handoff ?? '—')}</strong></div>
        </div>
        <div class="caip-ops-queue">${summary.issues.map((x) => `<a class="caip-ops-issue priority-${esc(x.priority)}" href="${esc(x.href)}"><span>${esc(x.priority)}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.detail)}</small></div><em>${esc(x.owner)}</em></a>`).join('') || '<div class="caip-ops-clear"><strong>No current CAIP exception is derived for this project.</strong><span>Continue normal evidence review and Content Studio work.</span></div>'}</div>
      </div><aside><h3>Projects</h3>${renderProjectList(projects, selected)}</aside></div>
    </section>`;
  }

  async function init() {
    mount.innerHTML = '<section class="card"><p class="small" role="status" aria-live="polite">Loading Release 458 CAIP readiness…</p></section>';
    const root = await read('/api/admin/caip-evidence-review');
    const projects = arr(root.projects);
    const selected = queryProject() || num(projects.find((p) => num(p.temporal_asset_count) > 0)?.creative_project_id) || num(projects[0]?.creative_project_id);
    if (!selected) { render({ projects, selected: 0, bundle: null, handoff: null, failures: [] }); return; }
    const calls = await Promise.allSettled([
      read(`/api/admin/caip-evidence-review?creative_project_id=${selected}`),
      read(`/api/admin/caip-content-handoff?creative_project_id=${selected}`),
    ]);
    const failures = calls.filter((x) => x.status === 'rejected');
    const bundle = calls[0].status === 'fulfilled' ? calls[0].value : null;
    const handoff = calls[1].status === 'fulfilled' ? calls[1].value : null;
    render({ projects, selected, bundle, handoff, failures });
  }

  document.addEventListener('DOMContentLoaded', () => { void init().catch((error) => {
    mount.innerHTML = `<section class="card"><p role="status" aria-live="polite" data-admin-workspace-status data-state="error"><strong>CAIP readiness could not load.</strong> ${esc(error.message || error)}</p></section>`;
  }); }, { once: true });
})();
