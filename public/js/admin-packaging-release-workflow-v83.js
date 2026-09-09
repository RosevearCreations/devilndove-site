// Release 467 Build 83 — Labeling & Packaging Studio release workflow browser layer.
// Read-only convergence over the mature Packaging Studio. Existing Packaging writes and
// Build 44 Production & Reuse remain authoritative.
(() => {
  const RELEASE = 467;
  const BUILD = 83;
  const MODULE_URL = '/public/js/modules/packaging/release-workflow-v83.mjs?v=46783';
  const CSS_URL = '/css/admin-packaging-release-workflow-v83.css?v=46783';
  let deriveWorkflow = null;
  let lastProjectId = 0;
  let lastWorkflow = null;
  let loadCount = 0;
  let failureCount = 0;
  let loading = false;
  let observer = null;
  let scheduled = false;

  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const byId = (name) => document.getElementById(name);
  const activeProjectId = () => Number(byId('packagingProjectId')?.value || 0) || 0;

  function installCss() {
    if (document.querySelector('link[data-dd-packaging-release-workflow]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    link.dataset.ddPackagingReleaseWorkflow = String(BUILD);
    document.head.appendChild(link);
  }

  async function ensureModule() {
    if (deriveWorkflow) return deriveWorkflow;
    const mod = await import(MODULE_URL);
    if (typeof mod.buildPackagingReleaseWorkflow !== 'function') throw new Error('Build 83 Packaging workflow module did not expose its derivation authority.');
    deriveWorkflow = mod.buildPackagingReleaseWorkflow;
    return deriveWorkflow;
  }

  function mountPoint() {
    const main = byId('packagingStudioMain');
    if (!main) return null;
    let panel = main.querySelector('[data-build83-packaging-release-workflow]');
    if (panel) return panel;
    panel = document.createElement('section');
    panel.dataset.build83PackagingReleaseWorkflow = 'true';
    panel.className = 'card packaging-release-workflow-v83';
    main.prepend(panel);
    return panel;
  }

  function stageIcon(status) {
    if (status === 'ready') return '✓';
    if (status === 'blocked') return '!';
    if (status === 'review') return '•';
    return '—';
  }

  function stageMarkup(row) {
    const status = text(row?.status || 'unavailable');
    const blockers = Array.isArray(row?.blockers) ? row.blockers : [];
    const warnings = Array.isArray(row?.warnings) ? row.warnings : [];
    return `<article class="packaging-release-stage is-${esc(status)}">
      <div class="packaging-release-stage-head"><span class="packaging-release-stage-icon" aria-hidden="true">${stageIcon(status)}</span><div><strong>${esc(row?.label || row?.key || 'Stage')}</strong><small>${esc(status.toUpperCase())}</small></div></div>
      <p class="small">${esc(row?.detail || '')}</p>
      ${blockers.length ? `<ul class="packaging-release-blockers">${blockers.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
      ${warnings.length ? `<ul class="packaging-release-warnings">${warnings.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    </article>`;
  }

  function evidenceMarkup(evidence = {}) {
    return `<div class="packaging-release-evidence" aria-label="Packaging release evidence summary">
      <div><strong>${Number(evidence.component_count || 0)}</strong><small>components</small></div>
      <div><strong>${Number(evidence.component_cost_cents || 0)}¢</strong><small>estimated unit cost</small></div>
      <div><strong>${Number(evidence.version_count || 0)}</strong><small>saved versions</small></div>
      <div><strong>${Number(evidence.reusable_version_count || 0)}</strong><small>reusable approved</small></div>
      <div><strong>${Number(evidence.passed_physical_proof_count || 0)}</strong><small>passed physical proofs</small></div>
      <div><strong>${Number(evidence.successful_export_count || 0)}</strong><small>export evidence</small></div>
    </div>`;
  }

  function render(workflow) {
    const panel = mountPoint();
    if (!panel) return;
    lastWorkflow = workflow;
    const overall = text(workflow?.overall_status || 'review');
    const blockers = Array.isArray(workflow?.blockers) ? workflow.blockers : [];
    const warnings = Array.isArray(workflow?.warnings) ? workflow.warnings : [];
    panel.innerHTML = `
      <div class="section-heading-row"><div><p class="eyebrow">Release ${RELEASE} · Build ${BUILD}</p><h2>Packaging release workflow</h2><p class="small">One view from reusable template through reviewed reprint. This is a read-only release projection; Packaging Studio keeps its existing save/write authority and Build 44 remains the only production-print/reuse lane.</p></div><span class="status-pill packaging-release-overall is-${esc(overall)}">${esc(overall.toUpperCase())}</span></div>
      ${evidenceMarkup(workflow?.evidence || {})}
      <div class="packaging-release-stage-grid">${(workflow?.stages || []).map(stageMarkup).join('')}</div>
      ${blockers.length ? `<div class="packaging-warning-list packaging-release-summary"><strong>Blocking release issues</strong><ul>${blockers.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : ''}
      ${warnings.length ? `<details class="packaging-release-summary"><summary>${warnings.length} review note(s)</summary><ul>${warnings.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></details>` : ''}
      <div class="packaging-release-actions"><button class="btn" type="button" data-build83-refresh>Refresh release workflow</button><button class="btn primary" type="button" data-build83-production ${Number(workflow?.project_id || 0) ? '' : 'disabled'}>Open Production &amp; Reuse</button><span class="small" data-build83-status aria-live="polite">Read-only workflow projection. Nothing printed, exported, published or sent.</span></div>`;
  }

  function renderWaiting(message) {
    const panel = mountPoint();
    if (!panel) return;
    panel.innerHTML = `<div class="section-heading-row"><div><p class="eyebrow">Release ${RELEASE} · Build ${BUILD}</p><h2>Packaging release workflow</h2></div><span class="status-pill">WAITING</span></div><p class="small">${esc(message)}</p>`;
  }

  async function load(force = false) {
    if (loading) return;
    const projectId = activeProjectId();
    if (!projectId) {
      lastProjectId = 0;
      lastWorkflow = null;
      renderWaiting('Open or create a Packaging project to review template, content, components, artwork, proof, approval, export and reprint readiness.');
      return;
    }
    if (!force && lastProjectId === projectId && lastWorkflow) return;
    const client = globalThis.DDPackagingClient;
    if (!client || typeof client.request !== 'function') {
      renderWaiting('Packaging native client is not ready yet. Existing Packaging startup protection remains authoritative.');
      return;
    }
    loading = true;
    try {
      renderWaiting('Loading current Packaging evidence…');
      const [derive, response] = await Promise.all([ensureModule(), client.request(null, projectId)]);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !payload?.detail) throw new Error(payload?.error || 'Packaging project evidence could not be loaded.');
      const workflow = derive(payload.detail);
      lastProjectId = projectId;
      loadCount += 1;
      render(workflow);
    } catch (error) {
      failureCount += 1;
      renderWaiting(text(error?.message) || 'Packaging release workflow could not be loaded.');
    } finally {
      loading = false;
    }
  }

  function schedule(force = false) {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      void load(force);
    });
  }

  function openProductionLane() {
    const status = document.querySelector('[data-build83-status]');
    const production = document.querySelector('[data-build44-label-production]');
    try { globalThis.DDPackagingLabelProduction?.refresh?.(); } catch {}
    if (production) {
      production.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (status) status.textContent = 'Production & Reuse is below. Build 44 remains the print/reuse authority.';
    } else if (status) {
      status.textContent = 'Build 44 Production & Reuse is still loading. No print action was executed.';
    }
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('[data-build83-refresh]')) { event.preventDefault(); void load(true); return; }
      if (event.target?.closest?.('[data-build83-production]')) { event.preventDefault(); openProductionLane(); return; }
      if (event.target?.closest?.('[data-open-packaging], #newPackagingProject, #refreshPackagingStudio')) setTimeout(() => schedule(true), 0);
    });
    [
      'dd:packaging-client-transport-active',
      'dd:packaging-contract-bootstrap',
      'dd:packaging-native-client-write',
      'dd:packaging-material-intelligence-active',
      'dd:packaging-label-composition-active',
      'dd:packaging-label-production-active',
    ].forEach((name) => document.addEventListener(name, () => schedule(true)));
  }

  function startObserver() {
    const main = byId('packagingStudioMain');
    if (observer || !main) return;
    observer = new MutationObserver(() => {
      const projectId = activeProjectId();
      if (projectId !== lastProjectId) schedule(true);
    });
    observer.observe(main, { childList: true, subtree: true });
  }

  function snapshot() {
    return Object.freeze({
      release: RELEASE,
      build: BUILD,
      state: 'active',
      projectId: lastProjectId || activeProjectId() || null,
      loadCount,
      failureCount,
      overallStatus: lastWorkflow?.overall_status || null,
      readOnlyProjection: true,
      schemaChange: false,
      requestTimeDdl: false,
      d1Mutation: false,
      r2Mutation: false,
      printExecution: false,
      exportExecution: false,
      reprintExecution: false,
      publicationExecution: false,
      providerExecution: false,
      build44ProductionOwnerPreserved: true,
    });
  }

  function start() {
    installCss();
    bindEvents();
    startObserver();
    void load(true);
  }

  globalThis.DDPackagingReleaseWorkflow = Object.freeze({ release: RELEASE, build: BUILD, getStatus: snapshot, refresh: () => load(true) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  document.dispatchEvent(new CustomEvent('dd:packaging-release-workflow-active', { detail: snapshot() }));
})();
