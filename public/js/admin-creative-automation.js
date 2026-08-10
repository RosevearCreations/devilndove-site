// Build 235 — server-computed readiness, overdue/blocker queue, evidence exports, and guarded duplicate cleanup.
(() => {
  const LOCAL_KEY = 'dd_creative_automation_unsynced_v1';
  const FALLBACK_STAGES = [
    ['process', '1. Creative process', '/admin/creative-process/', 'Document the project, timeline, experiments and lessons.'],
    ['materials_cost', '2. Materials, inventory and cost', '/admin/creative-process/', 'Review material use, inventory actions, time and profitability.'],
    ['assets_evidence', '3. Assets, rights and evidence', '/admin/creative-assets/', 'Govern source references, privacy, rights and evidence.'],
    ['content_package', '4. Content package', '/admin/content-studio/', 'Prepare the full video, social, SEO, blog, gallery and archive plan.'],
    ['channel_review', '5. Channel drafts and approvals', '/admin/content-studio/', 'Review channel facts, media, captions, format and tracking.'],
    ['public_release', '6. Public release', '/admin/content-publications/', 'Approve and release factual website or Workshop Journal content.'],
    ['measure_repurpose', '7. Measure, learn and repurpose', '/admin/social-publishing/', 'Record actual outcomes, lessons and the next safe use.']
  ].map(([key, label, route, description], index) => ({
    key,
    label,
    route,
    description,
    order: (index + 1) * 10,
    authority: 'Specialist workspace',
    pass: 'Save factual evidence before marking complete.',
    correction: 'Open the specialist workspace, correct the source record, then retest this stage.'
  }));

  const state = { data: null, selected: 0, search: '', local: readLocal() };
  const id = (name) => document.getElementById(name);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  function readLocal() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocal() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state.local));
  }

  function message(value = '', kind = '') {
    const node = id('creativeAutomationMessage');
    if (!node) return;
    node.hidden = !value;
    node.textContent = value;
    node.className = `card creative-automation-message ${kind ? `is-${kind}` : ''}`;
  }

  function human(value) {
    return String(value || 'not started').replaceAll('_', ' ').replace(/^./, (ch) => ch.toUpperCase());
  }

  async function readResponse(response) {
    const raw = await response.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      const error = new Error('The Creative Automation service returned an invalid response. Specialist stage links remain available.');
      error.status = response.status || 502;
      throw error;
    }
    if (!response.ok || !data?.ok) {
      const error = new Error(data?.error || `Creative Automation request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function api(payload = null, projectId = state.selected) {
    const suffix = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
    return readResponse(await DDAuth.apiFetch(
      `/api/admin/creative-automation${suffix}`,
      payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : undefined
    ));
  }

  function stats(data) {
    const s = data?.stats || {};
    const values = [
      ['Projects', s.projects || 0],
      ['Master tracked', s.tracked || 0],
      ['Untracked', s.untracked || 0],
      ['Blocked', s.blocked || 0],
      ['Overdue', s.overdue || 0],
      ['Unassigned', s.unassigned || 0],
      ['Release ready', s.ready || 0],
      ['Released', s.released || 0]
    ];
    return `<section class="creative-automation-metrics">${values.map(([label, value]) => `<article><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`).join('')}</section>`;
  }

  function workQueue(data) {
    const rows = data.work_queue || [];
    return `<section class="card creative-automation-queue" aria-labelledby="creativeAutomationQueueTitle">
      <div class="section-title-row">
        <div><p class="eyebrow">Server-computed work queue</p><h2 id="creativeAutomationQueueTitle">Blocked, overdue and next-action projects</h2></div>
        <small>Priority is calculated from saved workflow status, blocker, due date and owner. It does not send notifications.</small>
      </div>
      ${rows.length ? `<div class="creative-automation-queue-grid">${rows.map((row) => `<button type="button" class="creative-automation-queue-item priority-${esc(row.priority)}" data-project="${Number(row.creative_work_project_id)}">
        <span class="status-pill">${esc(human(row.priority))}</span>
        <strong>${esc(row.project_title)}</strong>
        <small>${esc(human(row.current_stage_key))}${row.due_date ? ` • Due ${esc(row.due_date)}` : ' • No due date'}</small>
        <p>${esc(row.reason)}</p>
      </button>`).join('')}</div>` : `<div class="creative-automation-queue-empty" role="img" aria-label="No blocked, overdue, due-soon, or unassigned Creative Automation projects"><span aria-hidden="true">✓</span><div><strong>No urgent queue items</strong><small>Tracked projects are released, archived, or do not currently require an exception review.</small></div></div>`}
    </section>`;
  }

  function projectList(data) {
    const q = state.search.toLowerCase();
    const rows = (data.projects || []).filter((row) => !q || `${row.project_title} ${row.project_key} ${row.project_status} ${row.workflow_status || ''}`.toLowerCase().includes(q));
    return `<aside class="card creative-automation-sidebar">
      <h2>Projects</h2>
      <input class="input" id="creativeAutomationSearch" type="search" value="${esc(state.search)}" placeholder="Search project or status"/>
      <a class="btn primary" href="/admin/creative-process/">Create a project</a>
      <div class="creative-automation-project-list">${rows.length ? rows.map((row) => `<button type="button" class="creative-automation-project ${Number(row.creative_work_project_id) === Number(state.selected) ? 'is-selected' : ''}" data-project="${Number(row.creative_work_project_id)}"><strong>${esc(row.project_title)}</strong><small>${esc(human(row.workflow_status || 'not tracked'))} • ${esc(human(row.project_status))}</small></button>`).join('') : '<p class="small">No projects match this search.</p>'}</div>
    </aside>`;
  }

  function factText(stage, detail) {
    const f = detail.facts || {};
    const map = {
      process: `${f.event_count || 0} timeline entries`,
      materials_cost: `${f.reviewed_material_count || 0} of ${f.material_count || 0} material rows reviewed • ${f.profitability_count || 0} cost record`,
      assets_evidence: `${f.evidence_count || 0} evidence selections • CAIP ${f.caip_project_id || 'not linked'}`,
      content_package: `Content project ${f.content_project_id || 'not linked'} • ${f.deliverable_count || 0} deliverables`,
      channel_review: `${f.approved_deliverable_count || 0} of ${f.deliverable_count || 0} deliverables approved`,
      public_release: `${f.released_publication_count || 0} of ${f.publication_count || 0} public records approved/published`,
      measure_repurpose: `${f.result_output_count || 0} result-backed outputs • ${f.approved_knowledge_count || 0} approved learning summaries`
    };
    return map[stage.key] || 'Open the specialist workspace for source facts.';
  }

  function readinessChecks(stage) {
    const checks = stage.readiness?.checks || [];
    if (!checks.length) return '';
    return `<ul class="creative-automation-check-list">${checks.map((item) => `<li class="${item.passed ? 'is-pass' : item.eligible_not_applicable ? 'is-na' : 'is-fail'}">
      <span aria-hidden="true">${item.passed ? '✓' : item.eligible_not_applicable ? '–' : '!'}</span>
      <div><strong>${esc(item.label)}</strong><small>${esc(item.actual)} • Expected: ${esc(item.expected)}</small>${item.passed ? '' : `<p>${esc(item.correction)}</p>`}</div>
    </li>`).join('')}</ul>`;
  }

  function reviewOptions(selected) {
    return ['not_started', 'in_progress', 'blocked', 'needs_review', 'complete', 'not_applicable'].map((value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${human(value)}</option>`).join('');
  }

  function stageCard(stage, detail) {
    const route = `${stage.route}${stage.route.includes('?') ? '&' : '?'}creative_project_id=${encodeURIComponent(detail.project.creative_work_project_id)}`;
    return `<article class="card creative-automation-stage status-${esc(stage.effective_status || stage.review_status)}">
      <header><div><p class="eyebrow">${esc(stage.authority)}</p><h3>${esc(stage.label)}</h3></div><span class="status-pill">${esc(human(stage.effective_status || stage.review_status))}</span></header>
      <p>${esc(stage.description)}</p>
      <div class="creative-automation-source ${stage.source_ready ? 'is-ready' : 'is-missing'}"><strong>Source readiness:</strong> ${esc(factText(stage, detail))}${readinessChecks(stage)}</div>
      <details><summary>Pass and correction instructions</summary><p><strong>Pass:</strong> ${esc(stage.pass)}</p><p><strong>If it fails:</strong> ${esc(stage.correction)}</p></details>
      <form data-stage-form="${esc(stage.key)}">
        <label>Status<select class="input" name="review_status">${reviewOptions(stage.review_status)}</select></label>
        <label>Safe evidence reference<input class="input" name="evidence_reference" value="${esc(stage.evidence_reference || '')}" placeholder="Record ID, approved file reference, or URL"/></label>
        <label>Review notes<textarea class="input" name="review_notes" rows="3" placeholder="Expected result, actual result, correction and retest">${esc(stage.review_notes || '')}</textarea></label>
        <div class="creative-automation-actions"><a class="btn" href="${esc(route)}">Open stage workspace</a><button class="btn primary" type="submit">Save stage review</button></div>
      </form>
    </article>`;
  }

  function deleteControl(project) {
    return `<div class="creative-automation-delete-box"><div><strong>Delete this Creative Project?</strong><small>Build 246 can permanently remove project-owned timeline, material, cost and review rows. Any unreversed raw-inventory consumption is returned first. Downstream Content Studio, CAIP or external/public output references still block deletion until they are removed or preserved.</small></div><button class="btn danger" id="creativeAutomationDelete" type="button" data-project-key="${esc(project.project_key || '')}">Check delete + inventory return</button></div>`;
  }

  function exportControls() {
    return `<div class="creative-automation-export-box"><div><strong>Project evidence packet</strong><small>Exports saved facts, source-readiness checks, reviews, timeline, material/inventory evidence, deliverables, publications and approved learning. It does not invent provider or performance proof.</small></div><div class="creative-automation-actions"><button class="btn" id="creativeAutomationExportHtml" type="button">Open printable packet</button><button class="btn" id="creativeAutomationExportJson" type="button">Download JSON packet</button></div></div>`;
  }

  function detail(data) {
    const d = data.detail;
    if (!d?.project) return `<section class="card creative-automation-empty"><h2>Start with one Creative Project</h2><p>The master process links existing project facts; it does not replace the Creative Process project record.</p><a class="btn primary" href="/admin/creative-process/">Create a Creative Project</a></section>`;
    if (!d.workflow) return `<section class="card creative-automation-empty"><p class="eyebrow">${esc(d.project.project_key)}</p><h2>${esc(d.project.project_title)}</h2><p>This existing project is not yet tracked by the master workflow. Adding it creates only the cross-stage review link.</p><button class="btn primary" id="creativeAutomationTrack" type="button">Add to master workflow</button><a class="btn" href="/admin/creative-process/?project_id=${Number(d.project.creative_work_project_id)}">Open project</a>${deleteControl(d.project)}</section>`;
    const w = d.workflow;
    return `<section class="card creative-automation-overview">
      <div><p class="eyebrow">${esc(d.project.project_key)}</p><h2>${esc(d.project.project_title)}</h2><p>${esc(d.project.summary || 'Add the project summary in Creative Process.')}</p>${exportControls()}${deleteControl(d.project)}</div>
      <form id="creativeAutomationWorkflowForm">
        <div class="creative-automation-form-grid">
          <label>Workflow status<select class="input" name="workflow_status">${['planning', 'in_progress', 'blocked', 'ready_for_release', 'released', 'archived'].map((value) => `<option value="${value}" ${value === w.workflow_status ? 'selected' : ''}>${human(value)}</option>`).join('')}</select></label>
          <label>Current stage<select class="input" name="current_stage_key">${(data.stage_definitions || FALLBACK_STAGES).map((stage) => `<option value="${stage.key}" ${stage.key === w.current_stage_key ? 'selected' : ''}>${esc(stage.label)}</option>`).join('')}</select></label>
          <label>Due date<input class="input" type="date" name="due_date" value="${esc(w.due_date || '')}"/></label>
        </div>
        <label>Exact blocker<input class="input" name="blocked_reason" value="${esc(w.blocked_reason || '')}" placeholder="Required when workflow is blocked"/></label>
        <label>Operator notes<textarea class="input" name="operator_notes" rows="3">${esc(w.operator_notes || '')}</textarea></label>
        <button class="btn primary" type="submit">Save master workflow</button>
      </form>
    </section>
    <section class="creative-automation-stage-grid">${(d.stages || []).map((stage) => stageCard(stage, d)).join('')}</section>
    ${eventHistory(data)}`;
  }

  function eventHistory(data) {
    const rows = data.recent_events || [];
    return `<section class="card"><h2>Recent master-workflow history</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th>Stage</th><th>Event</th><th>Change</th><th>When</th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td>${esc(human(row.stage_key))}</td><td>${esc(human(row.event_type))}</td><td>${esc(human(row.previous_status))} → ${esc(human(row.next_status))}</td><td>${esc(row.created_at || '')}</td></tr>`).join('') : '<tr><td colspan="4">No master-workflow changes yet.</td></tr>'}</tbody></table></div></section>`;
  }

  function fallback(error) {
    const stages = FALLBACK_STAGES.map((stage) => `<article class="card creative-automation-stage"><h3>${esc(stage.label)}</h3><p>${esc(stage.description)}</p><a class="btn" href="${esc(stage.route)}">Open specialist workspace</a></article>`).join('');
    return `<section class="card creative-automation-degraded"><h2>Master status is temporarily unavailable</h2><p>${esc(error || 'D1 could not be reached. No completion status is being inferred.')}</p><button class="btn" id="creativeAutomationRetry" type="button">Retry</button></section><section class="creative-automation-stage-grid">${stages}</section>`;
  }

  function render() {
    const host = id('creativeAutomationMount');
    if (!host) return;
    if (!state.data) {
      host.innerHTML = fallback('The master workflow has not loaded.');
      bind();
      return;
    }
    if (!state.selected && state.data.projects?.length) state.selected = Number(state.data.detail?.project?.creative_work_project_id || state.data.projects[0].creative_work_project_id);
    host.innerHTML = `${stats(state.data)}${workQueue(state.data)}<div class="creative-automation-layout">${projectList(state.data)}<div class="creative-automation-main">${detail(state.data)}</div></div>`;
    bind();
  }

  async function post(payload, localOnFailure = true) {
    try {
      const data = await api({ ...payload, project_id: state.selected });
      state.data = data;
      state.local = state.local.filter((item) => !(item.project_id === state.selected && item.action === payload.action && item.stage_key === payload.stage_key));
      writeLocal();
      render();
      message(data.message || 'Creative Automation workflow saved.', 'success');
    } catch (error) {
      if (localOnFailure && Number(error.status || 0) >= 500) {
        state.local.push({ ...payload, project_id: state.selected, saved_at: new Date().toISOString() });
        writeLocal();
        message('D1 save failed. This review is stored only in this browser and is not completion evidence until synchronized.', 'warning');
        render();
        return;
      }
      message(error.message || 'Could not save the workflow.', 'error');
    }
  }

  async function syncLocal() {
    for (const item of [...state.local]) {
      try {
        await api(item, item.project_id);
        state.local.shift();
        writeLocal();
      } catch (error) {
        message(`Synchronization stopped: ${error.message}`, 'error');
        return;
      }
    }
    await load(state.selected);
    message('Browser-only Creative Automation changes were synchronized.', 'success');
  }

  async function exportPacket(format) {
    const printable = format === 'html';
    const previewWindow = printable ? window.open('', '_blank') : null;
    if (previewWindow) previewWindow.opener = null;
    if (printable && !previewWindow) {
      message('The browser blocked the printable packet window. Allow pop-ups for this admin page and try again.', 'warning');
      return;
    }
    try {
      message(`Preparing the ${printable ? 'printable' : 'JSON'} evidence packet…`);
      const response = await DDAuth.apiFetch(`/api/admin/creative-automation?project_id=${encodeURIComponent(state.selected)}&export=${format}`);
      if (!response.ok) {
        const raw = await response.text();
        let detail = null;
        try { detail = JSON.parse(raw); } catch { detail = null; }
        throw new Error(detail?.error || `Evidence export failed (${response.status}).`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (printable) {
        previewWindow.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${state.data?.detail?.project?.project_key || 'creative-project'}-evidence-packet.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      message('Evidence packet prepared from the current saved records.', 'success');
    } catch (error) {
      if (previewWindow) previewWindow.close();
      message(error.message || 'The evidence packet could not be prepared.', 'error');
    }
  }

  async function deleteProject() {
    try {
      message('Checking whether this project contains work that must be preserved…');
      const preview = await api({ action: 'delete_project_preview', project_id: state.selected }, state.selected);
      if (!preview.deletion?.allowed) {
        message(`Deletion blocked: ${(preview.deletion?.blockers || []).join(' ') || 'The project contains protected work.'}`, 'warning');
        return;
      }
      const cleanup = (preview.deletion.cleanup || []).map((item) => `• ${item}`).join('\n');
      const typed = prompt(`This will permanently remove this Creative Project and its project-owned records. Any unreversed raw-material consumption listed by the server will be returned to inventory first.\n\n${cleanup}\n\nType exactly:\n${preview.deletion.confirmation}`, '');
      if (typed !== preview.deletion.confirmation) {
        message('Deletion cancelled. The confirmation text did not match.', 'warning');
        return;
      }
      const data = await api({ action: 'delete_project', project_id: state.selected, confirmation: typed }, state.selected);
      state.data = data;
      state.selected = Number(data.detail?.project?.creative_work_project_id || data.projects?.[0]?.creative_work_project_id || 0);
      render();
      message(data.message, 'success');
    } catch (error) {
      message(error.message || 'The Creative Project could not be deleted safely.', 'error');
    }
  }

  function bind() {
    id('creativeAutomationRetry')?.addEventListener('click', () => load(state.selected));
    id('creativeAutomationTrack')?.addEventListener('click', () => post({ action: 'ensure_workflow' }));
    id('creativeAutomationDelete')?.addEventListener('click', deleteProject);
    id('creativeAutomationExportHtml')?.addEventListener('click', () => exportPacket('html'));
    id('creativeAutomationExportJson')?.addEventListener('click', () => exportPacket('json'));
    document.querySelectorAll('[data-project]').forEach((button) => { button.onclick = () => load(Number(button.dataset.project)); });
    const search = id('creativeAutomationSearch');
    if (search) search.oninput = () => { state.search = search.value; render(); id('creativeAutomationSearch')?.focus(); };
    id('creativeAutomationWorkflowForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      post({ action: 'save_workflow', ...Object.fromEntries(new FormData(event.currentTarget).entries()) });
    });
    document.querySelectorAll('[data-stage-form]').forEach((form) => {
      form.onsubmit = (event) => {
        event.preventDefault();
        post({ action: 'save_stage_review', stage_key: form.dataset.stageForm, ...Object.fromEntries(new FormData(form).entries()) });
      };
    });
    id('creativeAutomationSync')?.addEventListener('click', syncLocal);
  }

  async function load(projectId = 0) {
    message('Loading the master creative workflow…');
    try {
      const data = await api(null, projectId);
      state.data = data;
      state.selected = Number(data.detail?.project?.creative_work_project_id || projectId || data.projects?.[0]?.creative_work_project_id || 0);
      render();
      if (state.local.length) message(`${state.local.length} browser-only change${state.local.length === 1 ? ' is' : 's are'} waiting to synchronize.`, 'warning');
      else message('Creative Automation Studio loaded.', 'success');
      if (state.local.length) {
        const node = id('creativeAutomationMessage');
        if (node) {
          const button = document.createElement('button');
          button.id = 'creativeAutomationSync';
          button.className = 'btn small';
          button.type = 'button';
          button.textContent = 'Sync browser changes';
          node.append(' ', button);
          button.onclick = syncLocal;
        }
      }
    } catch (error) {
      state.data = null;
      id('creativeAutomationMount').innerHTML = fallback(error.message);
      bind();
      message(error.message, 'warning');
    }
  }

  document.addEventListener('DOMContentLoaded', () => load(Number(new URLSearchParams(location.search).get('project_id') || 0)));
})();
