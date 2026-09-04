// Release 467 Build 43 — Label Composition & Overrides browser layer.
// Adds reviewed per-label ingredient overrides and a live "What Will Print" inspector.
// Reuses existing Packaging project JSON and ingredient authorities; no schema mutation.
(() => {
  const RELEASE = 467;
  const BUILD = 43;
  const ENDPOINT = '/api/admin/packaging-label-composition';
  const DECISIONS = Object.freeze([
    ['inherit', 'Inherit material policy'],
    ['print', 'Print on this label'],
    ['omit', 'Omit from this label'],
  ]);

  let lastProjectId = 0;
  let lastPayload = null;
  let loadCount = 0;
  let saveCount = 0;
  let failureCount = 0;
  let observer = null;
  let renderScheduled = false;
  let loading = false;

  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
  const canonical = (value) => text(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const byId = (name) => document.getElementById(name);

  function authFetch(url, options = {}) {
    if (globalThis.DDAuth && typeof globalThis.DDAuth.apiFetch === 'function') return globalThis.DDAuth.apiFetch(url, options);
    return fetch(url, { credentials: 'same-origin', ...options });
  }

  async function responseJson(response) {
    try { return await response?.clone?.().json(); }
    catch { return null; }
  }

  function activeProjectId() { return Number(byId('packagingProjectId')?.value || 0); }

  function policyLabel(policy) {
    return ({ required: 'Required', print_default: 'Print by Default', optional: 'Optional', internal_only: 'Internal Only' })[policy] || 'Project row';
  }

  function allowedDecisions(row = {}) {
    const allowed = Array.isArray(row.override_allowed) ? row.override_allowed : ['inherit', 'print', 'omit'];
    return DECISIONS.filter(([value]) => allowed.includes(value));
  }

  function effectiveFor(row, decision) {
    if (decision === 'print') return 1;
    if (decision === 'omit') return 0;
    return Number(row.inherited_print) === 1 ? 1 : 0;
  }

  function optionMarkup(row, selected) {
    return allowedDecisions(row).map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
  }

  function mountPoint() {
    const tbody = byId('soapIngredientRows');
    const panel = document.querySelector('[data-build43-label-composition]');
    if (panel) return panel;
    if (!tbody) return null;
    const wrap = tbody.closest('.admin-table-wrap') || tbody.closest('table') || tbody.parentElement;
    const section = document.createElement('section');
    section.dataset.build43LabelComposition = 'true';
    section.className = 'card packaging-label-composition';
    section.style.cssText = 'margin-top:14px;padding:14px;border:1px solid rgba(95,67,145,.38);border-radius:12px;background:rgba(95,67,145,.06)';
    wrap.insertAdjacentElement('afterend', section);
    return section;
  }

  function statusMarkup(message) {
    return `<div class="section-heading-row"><div><p class="eyebrow">Build 43 · Label Composition &amp; Overrides</p><h4>What Will Print</h4></div><span class="status-pill">Release ${RELEASE}</span></div><p class="small">${esc(message)}</p>`;
  }

  function currentDecision(key, fallback = 'inherit') {
    const selector = document.querySelector(`[data-build43-key="${CSS.escape(key)}"] [data-build43-decision]`);
    return selector?.value || fallback;
  }

  function rowMarkup(row, index) {
    const key = row.canonical_key || canonical(row.inci_name || row.display_name_en || row.display_name_fr);
    const decision = row.override_decision || 'inherit';
    const effective = effectiveFor(row, decision);
    const policy = row.inherited_policy || '';
    const constraint = policy === 'required' ? 'Required cannot be omitted.' : policy === 'internal_only' ? 'Internal Only cannot be forced to print.' : '';
    return `<tr data-build43-key="${esc(key)}">
      <td>${index + 1}</td>
      <td><strong>${esc(row.inci_name || row.display_name_en || 'Unnamed ingredient')}</strong><div class="small">EN: ${esc(row.display_name_en || '—')}<br/>FR: ${esc(row.display_name_fr || '—')}</div></td>
      <td><span class="status-pill">${esc(policyLabel(policy))}</span>${constraint ? `<div class="small">${esc(constraint)}</div>` : ''}</td>
      <td><select class="input" data-build43-decision>${optionMarkup(row, decision)}</select></td>
      <td><strong data-build43-result>${effective ? 'PRINT' : 'OMIT'}</strong></td>
    </tr>`;
  }

  function visibleText(value) { return text(value) || '—'; }

  function renderSummary(payload) {
    const rows = Array.isArray(payload?.ingredients) ? payload.ingredients : [];
    const printable = rows.filter((row) => effectiveFor(row, currentDecision(row.canonical_key, row.override_decision || 'inherit')) === 1);
    const omitted = rows.filter((row) => !printable.includes(row));
    const claims = Array.isArray(payload?.claims) ? payload.claims : [];
    const project = payload?.project || {};
    const identityEn = text(byId('packagingIdentityEn')?.value) || project.product_identity_en;
    const identityFr = text(byId('packagingIdentityFr')?.value) || project.product_identity_fr;
    const net = text(byId('packagingNetQuantity')?.value) || project.net_quantity_text;
    const warningsEn = text(byId('packagingWarningsEn')?.value) || project.warnings_en;
    const warningsFr = text(byId('packagingWarningsFr')?.value) || project.warnings_fr;
    const dealer = text(byId('packagingDealerName')?.value) || project.dealer_name;
    const address = text(byId('packagingDealerAddress')?.value) || project.dealer_address;
    const contact = text(byId('packagingContact')?.value) || project.contact_text;
    const website = text(byId('packagingWebsite')?.value) || project.website_text;
    const claimText = claims.length ? claims.map((row) => `${row.claim_en || row.claim_fr || 'Unnamed claim'}${Number(row.is_approved) === 1 ? '' : ' · REVIEW'}`).join(' · ') : 'No label claims saved.';
    const artwork = payload?.artwork?.has_visible_artwork ? `${payload.artwork.rose_asset_id || payload.artwork.artwork_asset || 'Artwork selected'}` : 'No saved artwork selection';
    const blockers = Array.isArray(payload?.blockers) ? payload.blockers : [];
    return `<div class="grid cols-2" data-build43-summary>
      <div><strong>Identity</strong><p class="small">EN: ${esc(visibleText(identityEn))}<br/>FR: ${esc(visibleText(identityFr))}</p></div>
      <div><strong>Net quantity</strong><p class="small">${esc(visibleText(net))}</p></div>
      <div><strong>Ingredients that print (${printable.length})</strong><p class="small">${esc(printable.map((row) => row.inci_name || row.display_name_en).filter(Boolean).join(', ') || 'None')}</p></div>
      <div><strong>Ingredients omitted (${omitted.length})</strong><p class="small">${esc(omitted.map((row) => row.inci_name || row.display_name_en).filter(Boolean).join(', ') || 'None')}</p></div>
      <div><strong>Dealer / contact</strong><p class="small">${esc(visibleText(dealer))}<br/>${esc(visibleText(address))}<br/>${esc(visibleText(contact))}<br/>${esc(visibleText(website))}</p></div>
      <div><strong>Warnings</strong><p class="small">EN: ${esc(visibleText(warningsEn))}<br/>FR: ${esc(visibleText(warningsFr))}</p></div>
      <div><strong>Claims</strong><p class="small">${esc(claimText)}</p></div>
      <div><strong>Artwork</strong><p class="small">${esc(artwork)}</p></div>
    </div>
    ${blockers.length ? `<div class="packaging-warning-list" data-build43-blockers><strong>Review before production</strong><ul>${blockers.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '<div class="small" data-build43-blockers>No Build 43 composition blockers reported by the saved D1 read-back.</div>'}`;
  }

  function render(payload) {
    const panel = mountPoint();
    if (!panel) return;
    lastPayload = payload;
    const ingredients = Array.isArray(payload?.ingredients) ? payload.ingredients : [];
    panel.innerHTML = `
      <div class="section-heading-row"><div><p class="eyebrow">Build 43 · Label Composition &amp; Overrides</p><h4>What Will Print</h4><p class="small">Material Template Intelligence supplies the reusable default. This label may explicitly print or omit eligible rows without changing the reusable template. Required rows cannot be omitted and Internal Only rows cannot be forced to print.</p></div><span class="status-pill">Release ${RELEASE}</span></div>
      <div class="admin-table-wrap"><table><thead><tr><th>#</th><th>Ingredient</th><th>Inherited policy</th><th>This label</th><th>Result</th></tr></thead><tbody>${ingredients.map(rowMarkup).join('') || '<tr><td colspan="5">No saved structured ingredient rows exist for this project.</td></tr>'}</tbody></table></div>
      <div data-build43-summary-mount>${renderSummary(payload)}</div>
      <div class="packaging-save-actions" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="button" data-build43-save ${ingredients.length ? '' : 'disabled'}>Save label composition</button><button class="btn" type="button" data-build43-refresh>Refresh from D1</button><span class="small" data-build43-status aria-live="polite">${Number(payload?.explicit_override_count || 0)} explicit override(s) saved.</span></div>`;
  }

  function setStatus(message, error = false) {
    const node = document.querySelector('[data-build43-status]');
    if (!node) return;
    node.textContent = message;
    node.style.fontWeight = '700';
    node.dataset.state = error ? 'error' : 'ok';
  }

  function refreshSummary() {
    if (!lastPayload) return;
    const mount = document.querySelector('[data-build43-summary-mount]');
    if (mount) mount.innerHTML = renderSummary(lastPayload);
    document.querySelectorAll('[data-build43-key]').forEach((row) => {
      const key = row.dataset.build43Key || '';
      const source = (lastPayload.ingredients || []).find((item) => item.canonical_key === key);
      const decision = row.querySelector('[data-build43-decision]')?.value || 'inherit';
      const result = row.querySelector('[data-build43-result]');
      if (result && source) result.textContent = effectiveFor(source, decision) ? 'PRINT' : 'OMIT';
    });
  }

  async function loadComposition(force = false) {
    if (loading) return;
    const panel = mountPoint();
    if (!panel) return;
    const projectId = activeProjectId();
    if (!projectId) {
      lastProjectId = 0;
      lastPayload = null;
      panel.innerHTML = statusMarkup('Open or create a Packaging project to review its label composition.');
      return;
    }
    if (!force && projectId === lastProjectId && lastPayload) return;
    loading = true;
    try {
      panel.innerHTML = statusMarkup('Loading authoritative saved label composition…');
      const response = await authFetch(`${ENDPOINT}?project_id=${encodeURIComponent(projectId)}`);
      const payload = await responseJson(response);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Label composition could not be loaded.');
      if (!payload.authoritative_readback) throw new Error('Label composition response did not prove authoritative read-back.');
      lastProjectId = projectId;
      loadCount += 1;
      render(payload);
    } catch (error) {
      failureCount += 1;
      panel.innerHTML = statusMarkup(text(error?.message) || 'Label composition could not be loaded.');
    } finally {
      loading = false;
    }
  }

  function overridesFromDom() {
    if (!lastPayload) return [];
    return [...document.querySelectorAll('[data-build43-key]')].map((row) => {
      const key = row.dataset.build43Key || '';
      const source = (lastPayload.ingredients || []).find((item) => item.canonical_key === key) || {};
      return { key, inci_name: source.inci_name || source.display_name_en || key, decision: row.querySelector('[data-build43-decision]')?.value || 'inherit' };
    });
  }

  function syncNativeIngredientCheckboxes(payload) {
    const map = new Map((payload?.ingredients || []).map((row) => [row.canonical_key, Number(row.effective_print) === 1]));
    document.querySelectorAll('[data-soap-ingredient-row]').forEach((row) => {
      const key = canonical(row.querySelector('[data-field="inci_name"]')?.value || row.querySelector('[data-field="display_name_en"]')?.value || row.querySelector('[data-field="display_name_fr"]')?.value || '');
      const checkbox = row.querySelector('[data-field="required_on_label"]');
      if (!key || !checkbox || !map.has(key)) return;
      checkbox.checked = map.get(key);
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  async function saveComposition() {
    const projectId = activeProjectId();
    if (!projectId) return setStatus('Open a Packaging project first.', true);
    try {
      setStatus('Saving and verifying label composition…');
      const response = await authFetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'save_label_composition', packaging_project_id: projectId, ingredient_overrides: overridesFromDom() }),
      });
      const payload = await responseJson(response);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Label composition could not be saved.');
      if (!payload.authoritative_readback) throw new Error('Label composition save did not return authoritative D1 read-back.');
      saveCount += 1;
      lastProjectId = projectId;
      syncNativeIngredientCheckboxes(payload);
      render(payload);
      setStatus(`Saved and verified from D1: ${Number(payload.printable_ingredient_count || 0)} ingredient(s) print; ${Number(payload.omitted_ingredient_count || 0)} omitted; ${Number(payload.explicit_override_count || 0)} explicit override(s).`);
    } catch (error) {
      failureCount += 1;
      setStatus(text(error?.message) || 'Label composition could not be saved.', true);
    }
  }

  function scheduleRender(force = false) {
    if (renderScheduled) return;
    renderScheduled = true;
    queueMicrotask(() => {
      renderScheduled = false;
      loadComposition(force);
    });
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('[data-build43-save]')) { event.preventDefault(); saveComposition(); return; }
      if (event.target?.closest?.('[data-build43-refresh]')) { event.preventDefault(); loadComposition(true); return; }
      if (event.target?.closest?.('[data-open-packaging], #newPackagingProject, #refreshPackagingStudio')) setTimeout(() => scheduleRender(true), 0);
    });
    document.addEventListener('change', (event) => {
      if (event.target?.matches?.('[data-build43-decision]')) { refreshSummary(); setStatus('Composition changed locally. Save label composition to persist and verify it.'); return; }
      if (event.target?.matches?.('[data-soap-ingredient-row] [data-field="required_on_label"]')) {
        const row = event.target.closest('[data-soap-ingredient-row]');
        const key = canonical(row?.querySelector('[data-field="inci_name"]')?.value || row?.querySelector('[data-field="display_name_en"]')?.value || '');
        const selector = key ? document.querySelector(`[data-build43-key="${CSS.escape(key)}"] [data-build43-decision]`) : null;
        if (selector) {
          const desired = event.target.checked ? 'print' : 'omit';
          if ([...selector.options].some((option) => option.value === desired)) selector.value = desired;
          refreshSummary();
          setStatus('Ingredient label checkbox changed locally. Save label composition to persist the explicit override.');
        }
      }
    });
    document.addEventListener('input', (event) => {
      if (event.target?.closest?.('#packagingStudioMain') && !event.target?.matches?.('[data-build43-decision]')) refreshSummary();
    }, { passive: true });
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
      projectId: lastProjectId || activeProjectId() || null,
      loadCount,
      saveCount,
      failureCount,
      explicitOverrideCount: Number(lastPayload?.explicit_override_count || 0),
      authoritativeReadback: Boolean(lastPayload?.authoritative_readback),
      schemaChange: false,
      requestTimeDdl: false,
      productionContacted: false,
    });
  }

  globalThis.DDPackagingLabelComposition = Object.freeze({ build: BUILD, release: RELEASE, getStatus: snapshot, refresh: () => loadComposition(true) });

  bindEvents();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { startObserver(); scheduleRender(true); }, { once: true });
  else { startObserver(); scheduleRender(true); }
  document.dispatchEvent(new CustomEvent('dd:packaging-label-composition-active', { detail: snapshot() }));
})();
