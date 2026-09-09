// Release 467 Build 84 — read-only Creator / CAIP journey projection.
(() => {
  const RELEASE = 467;
  const BUILD = 84;
  const ENDPOINT = '/api/admin/creator-workflow';
  let lastProjectId = 0;
  let lastWorkflow = null;
  let loadCount = 0;
  let failureCount = 0;
  let loading = false;
  let scheduled = false;
  let observer = null;

  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const human = (value) => text(value || 'review').replaceAll('_', ' ').replace(/^./, (ch) => ch.toUpperCase());
  const host = () => document.getElementById('creatorWorkflow84Mount');

  function selectedProjectId() {
    const selected = document.querySelector('.creative-automation-project.is-selected[data-project]');
    if (selected) return Number(selected.dataset.project || 0) || 0;
    const query = Number(new URLSearchParams(location.search).get('project_id') || 0) || 0;
    if (query) return query;
    return Number(document.querySelector('[data-project]')?.dataset?.project || 0) || 0;
  }

  function pill(status) {
    return `<span class="creator84-pill status-${esc(status)}">${esc(human(status))}</span>`;
  }

  function renderEmpty(message) {
    const node = host();
    if (!node) return;
    node.innerHTML = `<section class="card creator84-shell"><div class="creator84-head"><div><p class="eyebrow">Release ${RELEASE} · Build ${BUILD}</p><h2>Creator journey</h2></div>${pill('review')}</div><p class="small">${esc(message)}</p></section>`;
  }

  function stageMarkup(stage) {
    const required = stage.required === false ? 'Optional / N/A allowed' : 'Required';
    return `<article class="creator84-stage status-${esc(stage.status)}">
      <div class="creator84-stage-head"><div><p class="eyebrow">${esc(stage.owner)}</p><h3>${esc(stage.label)}</h3></div>${pill(stage.status)}</div>
      <p class="creator84-evidence">${esc(stage.evidence)}</p>
      ${stage.note ? `<p class="creator84-note">${esc(stage.note)}</p>` : ''}
      ${stage.status === 'ready' || stage.status === 'not_applicable' ? '' : `<p class="creator84-correction"><strong>Next correction:</strong> ${esc(stage.correction)}</p>`}
      <div class="creator84-stage-foot"><small>${esc(required)}</small><a class="btn" href="${esc(stage.route)}">Open owner workspace</a></div>
    </article>`;
  }

  function render(payload) {
    const node = host();
    if (!node) return;
    const workflow = payload?.workflow;
    if (!workflow?.stages) return renderEmpty('Build 84 did not receive a valid Creator workflow projection.');
    lastWorkflow = workflow;
    const project = payload?.snapshot?.project || {};
    node.innerHTML = `<section class="card creator84-shell" data-build84-creator-workflow>
      <div class="creator84-head">
        <div><p class="eyebrow">Release ${RELEASE} · Build ${BUILD} · read-only convergence</p><h2>Creator journey — ${esc(project.project_title || `Project ${workflow.project_id || ''}`)}</h2><p>One view of the existing Creative Process, CAIP, Inventory, Product, Content Studio and profitability evidence. Correct facts in their owner workspace; this layer never posts, publishes or moves raw media.</p></div>
        <div class="creator84-score">${pill(workflow.overall_status)}<strong>${Number(workflow.ready_count || 0)}/${Number(workflow.stage_count || 8)}</strong><small>ready or N/A</small></div>
      </div>
      <div class="creator84-boundary" role="note"><strong>Private/raw media stays protected.</strong> Build 84 cannot delete or auto-promote CAIP raw files, mutate Inventory/Product/Content, post accounting, run OAuth, call providers, or publish. Social/provider acceptance remains Build 85.</div>
      <div class="creator84-stage-grid">${workflow.stages.map(stageMarkup).join('')}</div>
      <div class="creator84-actions"><button class="btn" type="button" data-build84-refresh>Refresh Creator journey</button><span class="small" data-build84-status>${payload.authoritative_readback ? 'Authoritative D1 read-back.' : 'Read-back not proven.'}</span></div>
    </section>`;
    node.querySelector('[data-build84-refresh]')?.addEventListener('click', () => load(lastProjectId, true));
  }

  async function readJson(response) {
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Creator workflow request failed (${response.status}).`);
    return data;
  }

  async function load(projectId = selectedProjectId(), force = false) {
    const pid = Number(projectId || 0) || 0;
    if (!pid) {
      lastProjectId = 0;
      lastWorkflow = null;
      renderEmpty('Select or create a Creative Project. Build 84 loads only the selected project; it does not scan every Creator record again.');
      return;
    }
    if (loading || (!force && pid === lastProjectId && lastWorkflow)) return;
    loading = true;
    try {
      renderEmpty('Loading the selected project’s Creator / CAIP evidence…');
      const response = await DDAuth.apiFetch(`${ENDPOINT}?project_id=${encodeURIComponent(pid)}`, { cache: 'no-store' });
      const data = await readJson(response);
      lastProjectId = pid;
      loadCount += 1;
      render(data);
    } catch (error) {
      failureCount += 1;
      renderEmpty(text(error?.message) || 'Creator workflow evidence could not be loaded. Existing specialist workspaces remain available.');
    } finally {
      loading = false;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      const pid = selectedProjectId();
      if (pid && pid !== lastProjectId) void load(pid);
    });
  }

  function startObserver() {
    const source = document.getElementById('creativeAutomationMount');
    if (!source || observer) return;
    observer = new MutationObserver(schedule);
    observer.observe(source, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  function snapshot() {
    return Object.freeze({
      release: RELEASE,
      build: BUILD,
      state: lastWorkflow ? 'active' : 'waiting',
      projectId: lastProjectId || null,
      overallStatus: lastWorkflow?.overall_status || null,
      stageCount: Number(lastWorkflow?.stage_count || 0),
      loadCount,
      failureCount,
      readOnlyProjection: true,
      requestTimeSchemaMutation: false,
      d1Mutation: false,
      r2Mutation: false,
      rawMediaDelete: false,
      rawMediaPublicPromotion: false,
      inventoryMutation: false,
      accountingPosting: false,
      oauthExecution: false,
      providerExecution: false,
      publicationExecution: false,
      build85SocialOauthOwnerPreserved: true,
    });
  }

  function start() {
    startObserver();
    const pid = selectedProjectId();
    if (pid) void load(pid);
    else renderEmpty('Select or create a Creative Project to load the Build 84 Creator journey.');
  }

  globalThis.DDCreatorWorkflow84 = Object.freeze({ build: BUILD, release: RELEASE, getStatus: snapshot, refresh: () => load(lastProjectId || selectedProjectId(), true) });
  document.addEventListener('click', (event) => { if (event.target?.closest?.('[data-project]')) setTimeout(schedule, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
