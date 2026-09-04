// Release 467 Build 48 — Automated Production Acceptance UI.
// Read-only deterministic acceptance over approved Build 47 planning metadata.
document.addEventListener('DOMContentLoaded', () => {
  const projectEl = document.getElementById('greyHairAcceptanceProject');
  const groupEl = document.getElementById('greyHairAcceptanceGroup');
  const mount = document.getElementById('greyHairProductionAcceptanceMount');
  const summary = document.getElementById('greyHairAcceptanceSummary');
  const message = document.getElementById('greyHairAcceptanceMessage');
  if (!projectEl || !groupEl || !mount) return;

  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const num = (value) => Number(value || 0);
  const clean = (value) => String(value ?? '').trim();
  const good = (value) => String(value || '').toUpperCase() === 'ACCEPTED_FOR_CONTROLLED_PRODUCTION';
  const badge = (value) => `<span class="badge ${good(value) ? 'good' : 'warn'}">${esc(value || 'HOLD')}</span>`;
  let latest = null;

  function option(value, label, selected = false) {
    return `<option value="${esc(value)}" ${selected ? 'selected' : ''}>${esc(label)}</option>`;
  }

  function policyCard(policy = {}) {
    const closed = [
      ['Provider execution', policy.provider_execution_active === false],
      ['Media rendering', policy.media_rendering_active === false],
      ['Publication', policy.publication_active === false],
      ['Social handoff', policy.social_handoff_active === false],
      ['R2 mutation', policy.r2_mutation_active === false],
      ['Production contact', policy.production_contacted === false],
      ['Automatic Production promotion', policy.automatic_production_promotion === false],
    ];
    return `<section class="card" style="margin-top:14px"><h2 style="margin-top:0">Build 48 safety boundary</h2><div class="admin-compact-tool-grid">${closed.map(([label,ok])=>`<div><strong>${esc(label)}</strong><small>${ok ? 'CLOSED' : 'REVIEW'}</small></div>`).join('')}</div><p class="small" style="margin-bottom:0">Acceptance is metadata-only. A PASS authorizes no renderer, provider, publication, R2 write, social handoff or application Production promotion.</p></section>`;
  }

  function checksMarkup(rows = []) {
    return rows.map((row) => `<div class="b48-check"><span class="badge ${row.pass ? 'good' : 'bad'}">${row.pass ? 'PASS' : 'FAIL'}</span><div><strong>${esc(row.label)}</strong><div class="small">${esc(row.detail || '')}</div></div></div>`).join('');
  }

  function acceptanceCard(row) {
    const blockers = row.blockers?.length
      ? `<ul>${row.blockers.map((item)=>`<li><strong>${esc(item.label)}</strong> — ${esc(item.detail)}</li>`).join('')}</ul>`
      : '<p class="small">All deterministic production-acceptance checks passed.</p>';
    const handoff = row.handoff ? `<div class="card" style="margin-top:12px;padding:12px"><strong>Controlled production handoff</strong><div class="small">${esc(row.handoff.next_step || '')}</div><div class="small">Render/provider/publication/R2 authorization: CLOSED / CLOSED / CLOSED / CLOSED</div></div>` : '';
    return `<section class="card" style="margin-top:14px"><div class="b48-head"><div><p class="eyebrow">${esc(row.package_id)}</p><h2 style="margin:0">${esc(row.title)}</h2><p class="small">Story #${num(row.caip_story_builder_draft_id)} • Timeline #${num(row.caip_edit_timeline_draft_id)} • Group #${num(row.caip_capture_group_id)}</p></div>${badge(row.decision)}</div><div class="admin-compact-tool-grid" style="margin-top:12px"><div><strong>Checks passed</strong><small>${num(row.pass_count)} / ${num(row.check_count)}</small></div><div><strong>Blockers</strong><small>${num(row.blockers?.length)}</small></div><div><strong>Decision</strong><small>${esc(row.decision)}</small></div></div><details style="margin-top:12px" ${row.blockers?.length ? 'open' : ''}><summary><strong>Acceptance checks</strong></summary><div class="b48-checks">${checksMarkup(row.checks || [])}</div></details><details style="margin-top:10px"><summary><strong>Blockers</strong></summary>${blockers}</details>${handoff}</section>`;
  }

  function render(data) {
    latest = data;
    const groups = Array.isArray(data.groups) ? data.groups : [];
    const currentGroup = num(data.active_group?.caip_capture_group_id);
    const selectedGroup = num(groupEl.value) || currentGroup;
    groupEl.innerHTML = option('', 'Choose confirmed synchronization group');
    for (const group of groups) {
      const id = num(group.caip_capture_group_id);
      const ready = group.readiness?.ready_for_build47 === true;
      const label = `${group.title || group.capture_group_key || `Group ${id}`} — ${ready ? 'confirmed' : 'not eligible'}`;
      groupEl.insertAdjacentHTML('beforeend', option(id, label, id === selectedGroup));
    }
    if (currentGroup && !groupEl.value) groupEl.value = String(currentGroup);

    const rows = Array.isArray(data.acceptances) ? data.acceptances : [];
    if (summary) {
      summary.innerHTML = `<div class="admin-compact-tool-grid"><div><strong>Accepted</strong><small>${num(data.summary?.accepted)}</small></div><div><strong>Hold</strong><small>${num(data.summary?.hold)}</small></div><div><strong>Eligible timelines</strong><small>${num(data.summary?.eligible_timelines)}</small></div><div><strong>Active sync group</strong><small>${currentGroup || 'none'}</small></div></div>`;
    }
    mount.innerHTML = rows.length ? rows.map(acceptanceCard).join('') : '<section class="card" style="margin-top:14px"><h2>No accepted planning candidate yet</h2><p class="small">Build 48 needs a confirmed Build 46 group plus an approved Build 47 story and approved Build 47 edit timeline. Open Story &amp; Edit Planning to complete the review chain.</p><a class="btn primary" href="/admin/grey-hair-story-edit-planning/">Open Story &amp; Edit Planning</a></section>';
    mount.insertAdjacentHTML('beforeend', policyCard(data.policy || {}));
    if (message) message.textContent = `Build 48 read-only acceptance refreshed ${new Date().toLocaleTimeString()}.`;
  }

  async function loadProjects() {
    if (message) message.textContent = 'Loading Grey Hair production-acceptance authority…';
    const response = await apiFetch('/api/admin/grey-hair-production-acceptance', { cache:'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `Build 48 acceptance failed (${response.status}).`);
    const projects = Array.isArray(data.projects) ? data.projects : [];
    projectEl.innerHTML = option('', 'Choose Grey Hair project');
    for (const project of projects) projectEl.insertAdjacentHTML('beforeend', option(num(project.creative_project_id), project.project_title || project.creative_project_key || `Project ${project.creative_project_id}`));
    if (projects.length === 1) {
      projectEl.value = String(projects[0].creative_project_id);
      await loadAcceptance();
    } else {
      groupEl.innerHTML = option('', 'Choose confirmed synchronization group');
      mount.innerHTML = '<section class="card" style="margin-top:14px"><p class="small">Choose the Grey Hair project to run automated production acceptance.</p></section>';
      mount.insertAdjacentHTML('beforeend', policyCard(data.policy || {}));
    }
  }

  async function loadAcceptance() {
    const projectId = num(projectEl.value);
    if (!projectId) return loadProjects();
    const params = new URLSearchParams({ creative_project_id: String(projectId) });
    if (num(groupEl.value)) params.set('caip_capture_group_id', String(num(groupEl.value)));
    if (message) message.textContent = 'Running deterministic Build 48 acceptance checks…';
    const response = await apiFetch(`/api/admin/grey-hair-production-acceptance?${params.toString()}`, { cache:'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `Build 48 acceptance failed (${response.status}).`);
    render(data);
  }

  projectEl.addEventListener('change', () => { groupEl.value=''; void loadAcceptance().catch(showError); });
  groupEl.addEventListener('change', () => void loadAcceptance().catch(showError));
  document.getElementById('refreshGreyHairAcceptance')?.addEventListener('click', () => void loadAcceptance().catch(showError));
  document.getElementById('copyGreyHairAcceptance')?.addEventListener('click', async () => {
    if (!latest) return;
    const sanitized = { release: latest.release, build: latest.build, title: latest.title, project: latest.project, active_group: latest.active_group, summary: latest.summary, acceptances: latest.acceptances, policy: latest.policy };
    try { await navigator.clipboard.writeText(JSON.stringify(sanitized, null, 2)); if (message) message.textContent='Sanitized Build 48 acceptance package copied.'; } catch { if (message) message.textContent='Clipboard copy was unavailable.'; }
  });

  function showError(error) {
    latest = null;
    if (message) message.textContent = clean(error?.message || error || 'Build 48 acceptance failed.');
    mount.innerHTML = `<section class="card" style="margin-top:14px"><h2>Production acceptance unavailable</h2><p class="small">${esc(error?.message || error || 'Unknown error')}</p><button class="btn" type="button" id="retryGreyHairAcceptance">Retry</button></section>`;
    document.getElementById('retryGreyHairAcceptance')?.addEventListener('click', () => void loadProjects().catch(showError));
  }

  window.DDGreyHairProductionAcceptance = Object.freeze({ release: 467, build: 48, readOnly: true, providerExecution: false, mediaRendering: false, publication: false, r2Mutation: false, productionContacted: false });
  document.dispatchEvent(new CustomEvent('dd:grey-hair-production-acceptance-active', { detail: window.DDGreyHairProductionAcceptance }));
  void loadProjects().catch(showError);
});
