// Release 467 Build 42 — Material Template Intelligence browser layer.
// Adds reusable ingredient policy/provenance controls and normalizes inherited project rows.
// It is additive to the proven Packaging 297/298/300/301 stack and does not change schema.
(() => {
  const RELEASE = 467;
  const BUILD = 42;
  const ENDPOINT = '/api/admin/packaging-material-intelligence';
  const POLICIES = Object.freeze([
    ['required', 'Required'],
    ['print_default', 'Print by Default'],
    ['optional', 'Optional'],
    ['internal_only', 'Internal Only'],
  ]);
  const PROVENANCE = Object.freeze([
    ['needs_review', 'Needs Review'],
    ['supplier_declared', 'Supplier Declared'],
    ['supplier_verified', 'Supplier Verified'],
    ['owner_verified', 'Owner Verified'],
    ['internal_note', 'Internal Note'],
  ]);

  const baseClient = globalThis.DDPackagingClient;
  if (!baseClient || typeof baseClient.request !== 'function') return;

  const originalRequest = baseClient.request.bind(baseClient);
  const originalGetStatus = typeof baseClient.getStatus === 'function'
    ? baseClient.getStatus.bind(baseClient)
    : () => null;

  let normalizationCount = 0;
  let normalizationFailureCount = 0;
  let lastNormalization = null;
  let intelligenceLoadCount = 0;
  let intelligenceSaveCount = 0;
  let lastSourceId = 0;
  let observer = null;
  let renderScheduled = false;
  let loading = false;

  const text = (value) => String(value ?? '').trim();
  const byId = (name) => document.getElementById(name);
  const esc = (value) => text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  function authFetch(url, options = {}) {
    if (globalThis.DDAuth && typeof globalThis.DDAuth.apiFetch === 'function') {
      return globalThis.DDAuth.apiFetch(url, options);
    }
    return fetch(url, { credentials: 'same-origin', ...options });
  }

  async function responseJson(response) {
    try { return await response?.clone?.().json(); }
    catch { return null; }
  }

  function jsonResponse(payload, status = 200, sourceResponse = null) {
    const headers = new Headers(sourceResponse?.headers || undefined);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.set('content-type', 'application/json; charset=utf-8');
    headers.set('cache-control', 'no-store');
    return new Response(JSON.stringify(payload), { status, headers });
  }

  async function normalizeProject(projectId) {
    const pid = Number(projectId || 0);
    if (!pid) return null;
    const response = await authFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'normalize_project_inheritance', packaging_project_id: pid }),
    });
    const payload = await responseJson(response);
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Material inheritance normalization failed.');
    normalizationCount += 1;
    lastNormalization = Object.freeze({
      ok: true,
      packaging_project_id: pid,
      ingredient_count: Number(payload.ingredient_count || 0),
      duplicates_removed: Number(payload.duplicates_removed || 0),
      policies_applied: Number(payload.policies_applied || 0),
    });
    return payload;
  }

  async function request(body = null, projectId = 0) {
    if (body?.action !== 'apply_source_material_template') return originalRequest(body, projectId);

    const writeResponse = await originalRequest(body, projectId);
    const writePayload = await responseJson(writeResponse);
    if (!writeResponse?.ok || !writePayload?.ok) return writeResponse;

    const pid = Number(projectId || body?.packaging_project_id || writePayload?.detail?.project?.packaging_project_id || 0);
    if (!pid) return writeResponse;

    try {
      const normalized = await normalizeProject(pid);
      const freshResponse = await originalRequest(null, pid);
      const freshPayload = await responseJson(freshResponse);
      if (!freshResponse?.ok || !freshPayload?.ok) {
        normalizationFailureCount += 1;
        lastNormalization = Object.freeze({ ok: false, packaging_project_id: pid, reason: 'fresh-read-failed' });
        return jsonResponse({
          ok: false,
          release: RELEASE,
          build: BUILD,
          error: 'Source material was attached and normalized, but the authoritative Packaging read-back failed. Re-open the project before continuing.',
          error_code: 'packaging_material_intelligence_readback_failed',
        }, 409, writeResponse);
      }
      return jsonResponse({
        ...freshPayload,
        message: `${writePayload.message || 'Source material applied.'} Build 42 inheritance normalized: ${Number(normalized?.duplicates_removed || 0)} duplicate row(s) removed; ${Number(normalized?.policies_applied || 0)} inherited print policy row(s) applied.`,
        material_intelligence: {
          release: RELEASE,
          build: BUILD,
          normalized: true,
          ...lastNormalization,
        },
      }, 200, writeResponse);
    } catch (error) {
      normalizationFailureCount += 1;
      lastNormalization = Object.freeze({ ok: false, packaging_project_id: pid, reason: text(error?.message) || 'normalization-failed' });
      return jsonResponse({
        ok: false,
        release: RELEASE,
        build: BUILD,
        error: `${text(error?.message) || 'Material inheritance normalization failed.'} The source attachment must be reviewed before continuing.`,
        error_code: 'packaging_material_intelligence_normalization_failed',
      }, 409, writeResponse);
    }
  }

  function getStatus() {
    const base = originalGetStatus() || {};
    return Object.freeze({
      ...base,
      build: base.build,
      materialIntelligenceBuild: BUILD,
      materialIntelligenceRelease: RELEASE,
      materialIntelligenceActive: true,
      materialIntelligenceEndpoint: ENDPOINT,
      normalizationCount,
      normalizationFailureCount,
      lastNormalization,
      intelligenceLoadCount,
      intelligenceSaveCount,
      lastSourceId,
      schemaChange: false,
      requestTimeDdl: false,
    });
  }

  globalThis.DDPackagingClient = Object.freeze({
    ...baseClient,
    request,
    getStatus,
    materialIntelligenceBuild: BUILD,
    materialIntelligenceRelease: RELEASE,
    materialIntelligenceActive: true,
  });

  function activeSourceId() {
    return Number(byId('packagingSourceMaterialEditId')?.value || byId('packagingSourceMaterialTemplateId')?.value || 0);
  }

  function activeProjectId() {
    return Number(byId('packagingProjectId')?.value || 0);
  }

  function options(values, selected) {
    return values.map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
  }

  function mountPoint() {
    const editor = document.querySelector('.packaging-source-editor-body');
    if (!editor) return null;
    let panel = editor.querySelector('[data-build42-material-intelligence]');
    if (panel) return panel;
    panel = document.createElement('section');
    panel.dataset.build42MaterialIntelligence = 'true';
    panel.className = 'card packaging-material-intelligence';
    panel.style.cssText = 'margin-top:14px;padding:14px;border:1px solid rgba(184,138,47,.38);border-radius:12px;background:rgba(184,138,47,.06)';
    const table = editor.querySelector('.packaging-source-inci-table');
    if (table) table.insertAdjacentElement('afterend', panel);
    else editor.appendChild(panel);
    return panel;
  }

  function renderEmpty(panel, message) {
    panel.innerHTML = `<div class="section-heading-row"><div><p class="eyebrow">Build 42 · Material Template Intelligence</p><h4>Reusable ingredient print policy &amp; provenance</h4></div><span class="status-pill">Release ${RELEASE}</span></div><p class="small">${esc(message)}</p>`;
  }

  function renderTemplate(panel, template) {
    const ingredients = Array.isArray(template?.ingredients) ? template.ingredients : [];
    const rows = ingredients.map((row, index) => `
      <tr data-build42-intelligence-row>
        <td>${index + 1}</td>
        <td><strong>${esc(row.inci_name || '—')}</strong><div class="small">EN: ${esc(row.display_name_en || '—')}<br/>FR: ${esc(row.display_name_fr || '—')}</div><input type="hidden" data-build42-inci value="${esc(row.inci_name || '')}"/></td>
        <td><select class="input" data-build42-policy>${options(POLICIES, row.print_policy || 'required')}</select></td>
        <td><select class="input" data-build42-provenance>${options(PROVENANCE, row.provenance_status || 'needs_review')}</select></td>
        <td><input class="input" data-build42-note value="${esc(row.provenance_note || '')}" placeholder="Supplier document, owner review, or internal note"/></td>
      </tr>`).join('');

    panel.innerHTML = `
      <div class="section-heading-row"><div><p class="eyebrow">Build 42 · Material Template Intelligence</p><h4>Reusable ingredient print policy &amp; provenance</h4><p class="small">Classify inherited ingredient behavior once on the purchased material template. Build 43 will own per-label overrides; this panel does not silently change legal or regulatory review status.</p></div><span class="status-pill">Release ${RELEASE}</span></div>
      <div class="packaging-warning-list" style="margin:10px 0"><strong>${esc(template.material_name || 'Source material')}</strong><p class="small">${esc(template.supplier_name || 'Supplier not recorded')}${template.verification_status ? ` · ${esc(template.verification_status)}` : ''}. Required / Print by Default rows inherit as printable. Optional / Internal Only rows inherit as non-printing defaults until a later reviewed label override.</p></div>
      <div class="admin-table-wrap"><table><thead><tr><th>#</th><th>Ingredient identity</th><th>Inheritance policy</th><th>Provenance</th><th>Evidence / note</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No structured ingredient rows exist on this saved template.</td></tr>'}</tbody></table></div>
      <div class="packaging-save-actions" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="button" data-build42-save-intelligence ${rows ? '' : 'disabled'}>Save reusable intelligence</button><button class="btn" type="button" data-build42-normalize-project ${activeProjectId() ? '' : 'disabled'}>Normalize inherited ingredients on open label</button><span class="small" data-build42-status aria-live="polite"></span></div>`;
  }

  function setStatus(message, kind = '') {
    const status = document.querySelector('[data-build42-status]');
    if (!status) return;
    status.textContent = message;
    status.style.fontWeight = kind ? '700' : '';
  }

  async function loadIntelligence(force = false) {
    if (loading) return;
    const panel = mountPoint();
    if (!panel) return;
    const sourceId = activeSourceId();
    if (!sourceId) {
      lastSourceId = 0;
      renderEmpty(panel, 'Save or choose a Material Library template to classify its reusable ingredient inheritance.');
      return;
    }
    if (!force && sourceId === lastSourceId && panel.querySelector('[data-build42-intelligence-row]')) return;
    loading = true;
    try {
      renderEmpty(panel, 'Loading saved template intelligence…');
      const response = await authFetch(`${ENDPOINT}?source_id=${encodeURIComponent(sourceId)}`);
      const payload = await responseJson(response);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Material intelligence could not be loaded.');
      lastSourceId = sourceId;
      intelligenceLoadCount += 1;
      renderTemplate(panel, payload.template);
    } catch (error) {
      renderEmpty(panel, text(error?.message) || 'Material intelligence could not be loaded.');
    } finally {
      loading = false;
    }
  }

  function intelligenceRowsFromDom() {
    return [...document.querySelectorAll('[data-build42-intelligence-row]')].map((row) => ({
      inci_name: row.querySelector('[data-build42-inci]')?.value || '',
      print_policy: row.querySelector('[data-build42-policy]')?.value || 'required',
      provenance_status: row.querySelector('[data-build42-provenance]')?.value || 'needs_review',
      provenance_note: row.querySelector('[data-build42-note]')?.value || '',
    }));
  }

  async function saveIntelligence() {
    const sourceId = activeSourceId();
    if (!sourceId) return setStatus('Choose a saved source-material template first.', 'error');
    try {
      setStatus('Saving reusable intelligence…');
      const response = await authFetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template_intelligence',
          packaging_source_material_template_id: sourceId,
          ingredients: intelligenceRowsFromDom(),
        }),
      });
      const payload = await responseJson(response);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Material template intelligence could not be saved.');
      intelligenceSaveCount += 1;
      setStatus(`Saved ${Number(payload.ingredient_count || 0)} reusable ingredient policy row(s).`, 'success');
      await loadIntelligence(true);
    } catch (error) {
      setStatus(text(error?.message) || 'Material template intelligence could not be saved.', 'error');
    }
  }

  async function normalizeOpenProject() {
    const projectId = activeProjectId();
    if (!projectId) return setStatus('Open a Packaging project first.', 'error');
    try {
      setStatus('Normalizing inherited ingredient rows…');
      const payload = await normalizeProject(projectId);
      setStatus(`Normalized ${Number(payload?.ingredient_count || 0)} ingredient row(s); removed ${Number(payload?.duplicates_removed || 0)} duplicate(s); applied ${Number(payload?.policies_applied || 0)} policy row(s). Re-open/reload the project view to inspect the authoritative result.`, 'success');
    } catch (error) {
      normalizationFailureCount += 1;
      setStatus(text(error?.message) || 'Material inheritance normalization failed.', 'error');
    }
  }

  function scheduleRender(force = false) {
    if (renderScheduled) return;
    renderScheduled = true;
    queueMicrotask(() => {
      renderScheduled = false;
      loadIntelligence(force);
    });
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('[data-build42-save-intelligence]')) {
        event.preventDefault();
        saveIntelligence();
        return;
      }
      if (event.target?.closest?.('[data-build42-normalize-project]')) {
        event.preventDefault();
        normalizeOpenProject();
        return;
      }
      if (event.target?.closest?.('[data-load-source-material], [data-use-source-material]')) {
        setTimeout(() => scheduleRender(true), 0);
      }
    });
    document.addEventListener('change', (event) => {
      if (event.target?.id === 'packagingSourceMaterialTemplateId') setTimeout(() => scheduleRender(true), 0);
    });
  }

  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => scheduleRender(false));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function snapshot() {
    return Object.freeze({
      release: RELEASE,
      build: BUILD,
      state: 'active',
      endpoint: ENDPOINT,
      clientWrapped: globalThis.DDPackagingClient?.materialIntelligenceBuild === BUILD,
      normalizationCount,
      normalizationFailureCount,
      lastNormalization,
      intelligenceLoadCount,
      intelligenceSaveCount,
      lastSourceId,
      schemaChange: false,
      requestTimeDdl: false,
      productionContacted: false,
    });
  }

  globalThis.DDPackagingMaterialIntelligence = Object.freeze({
    release: RELEASE,
    build: BUILD,
    getStatus: snapshot,
    refresh: () => loadIntelligence(true),
    normalizeOpenProject,
  });

  const boot = () => {
    bindEvents();
    startObserver();
    scheduleRender(true);
    document.documentElement.dataset.ddPackagingMaterialIntelligenceBuild = String(BUILD);
    if (document.body) document.body.dataset.ddPackagingMaterialIntelligenceBuild = String(BUILD);
    document.dispatchEvent(new CustomEvent('dd:packaging-material-intelligence-active', { detail: snapshot() }));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
