// Release 467 Build 44 — Label Production & Reuse browser layer.
// Converges existing printer profiles, immutable versions, physical QA history and true-size output.
(() => {
  const RELEASE = 467;
  const BUILD = 44;
  const ENDPOINT = '/api/admin/packaging-label-production';
  const COMPOSITION_ENDPOINT = '/api/admin/packaging-label-composition';
  let lastProjectId = 0;
  let lastPayload = null;
  let lastComposition = null;
  let loadCount = 0;
  let productionPrintCount = 0;
  let blockedPrintCount = 0;
  let failureCount = 0;
  let loading = false;
  let observer = null;
  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId = (id) => document.getElementById(id);
  const apiFetch = (url, options = {}) => globalThis.DDAuth?.apiFetch ? globalThis.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  const activeProjectId = () => Number(byId('packagingProjectId')?.value || 0) || 0;

  async function asJson(response) { try { return await response.clone().json(); } catch { return null; } }
  function safeAreaReady() { return globalThis.DDPackagingSafeArea?.lastResult?.ready === true; }
  function compositionReady() { return Boolean(lastComposition?.authoritative_readback) && !(lastComposition?.blockers || []).length; }

  function mountPoint() {
    let panel = document.querySelector('[data-build44-label-production]');
    if (panel) return panel;
    const anchor = byId('printTestVersion')?.closest('label') || byId('printOptimizedSheet')?.parentElement || byId('packagingStudioMain');
    if (!anchor) return null;
    panel = document.createElement('section');
    panel.dataset.build44LabelProduction = 'true';
    panel.className = 'card packaging-label-production';
    panel.style.cssText = 'margin-top:14px;padding:14px;border:1px solid rgba(95,67,145,.38);border-radius:12px;background:rgba(95,67,145,.06)';
    anchor.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function statusPill(ok, yes, no) { return `<span class="status-pill">${esc(ok ? yes : no)}</span>`; }
  function versionLabel(row) { return `Version ${Number(row.version_number || 0)}${row.version_label ? ` — ${row.version_label}` : ''}`; }

  function render(payload, composition) {
    const panel = mountPoint(); if (!panel) return;
    lastPayload = payload; lastComposition = composition;
    const profiles = payload?.exact_size_printer_profiles || [];
    const reusable = payload?.reusable_versions || [];
    const allVersions = payload?.versions || [];
    const qa = payload?.qa_history || [];
    const blockers = [...(payload?.blockers || [])];
    if (!safeAreaReady()) blockers.push('Build 41 printable safe-area validation is not currently GREEN.');
    if (!compositionReady()) blockers.push(...((composition?.blockers || []).length ? composition.blockers : ['Build 43 saved label composition has not been authoritatively verified.']));
    const ready = Boolean(payload?.production_ready) && safeAreaReady() && compositionReady();
    panel.innerHTML = `
      <div class="section-heading-row"><div><p class="eyebrow">Build 44 · Label Production &amp; Reuse</p><h4>Production Library</h4><p class="small">Production printing is a separate fail-closed lane. It requires an approved immutable version, a matching passed physical QA record, an exact 100% printer profile, Build 43 composition readiness, and Build 41 safe-area proof.</p></div>${statusPill(ready, 'PRODUCTION READY', 'NOT READY')}</div>
      <div class="grid cols-2" style="gap:10px;margin-top:10px">
        <label><span class="small">Exact-size printer profile</span><select class="input" data-build44-printer>${profiles.map((p) => `<option value="${p.packaging_printer_profile_id}" data-name="${esc(p.profile_name)}" data-margin="${p.margin_mm}" data-gap="${p.gap_mm}" data-auto="${p.auto_rotate ? '1':'0'}">${esc(p.profile_name)} · ${esc(p.paper_stock)} · 100%</option>`).join('') || '<option value="">No 100% printer profile available</option>'}</select></label>
        <label><span class="small">Reusable approved version</span><select class="input" data-build44-version>${reusable.map((v) => `<option value="${v.packaging_project_version_id}">${esc(versionLabel(v))}</option>`).join('') || '<option value="">No QA-approved reusable version available</option>'}</select></label>
      </div>
      <div class="admin-compact-tool-grid" style="margin-top:10px">
        <div><strong>Printer profiles</strong><small>${profiles.length} exact-size / ${(payload?.printer_profiles || []).length} active</small></div>
        <div><strong>Version library</strong><small>${reusable.length} reusable / ${allVersions.length} saved</small></div>
        <div><strong>Physical QA history</strong><small>${qa.filter((q)=>q.production_qa_passed).length} passed / ${qa.length} records</small></div>
        <div><strong>Safe area</strong><small>${safeAreaReady() ? 'Build 41 GREEN' : 'BLOCKED'}</small></div>
        <div><strong>Composition</strong><small>${compositionReady() ? 'Build 43 GREEN' : 'BLOCKED'}</small></div>
      </div>
      ${blockers.length ? `<div class="packaging-warning-list" data-build44-blockers style="margin-top:10px"><strong>Production blockers</strong><ul>${[...new Set(blockers)].map((b)=>`<li>${esc(b)}</li>`).join('')}</ul></div>` : '<p class="small" data-build44-blockers>All current production/reuse gates are GREEN.</p>'}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn primary" type="button" data-build44-print ${ready ? '' : 'disabled'}>Print approved version at true size</button><button class="btn" type="button" data-build44-refresh>Refresh production authority</button><span class="small" data-build44-status aria-live="polite">${ready ? 'Ready for exact-size production print.' : 'Resolve blockers before production print.'}</span></div>
      <details style="margin-top:10px"><summary>Versioned library &amp; QA history</summary><div class="admin-table-wrap" style="margin-top:8px"><table><thead><tr><th>Version</th><th>Review</th><th>Immutable SVG</th><th>QA</th><th>Reusable</th></tr></thead><tbody>${allVersions.map((v)=>`<tr><td>${esc(versionLabel(v))}</td><td>${esc(v.review_status)}</td><td>${v.immutable_svg_artifact?'Yes':'No'}</td><td>${v.passed_qa?'Passed':'Pending'}</td><td>${v.reusable_production_version?'YES':'No'}</td></tr>`).join('') || '<tr><td colspan="5">No saved versions.</td></tr>'}</tbody></table></div></details>`;
  }

  function setStatus(message, error = false) {
    const node = document.querySelector('[data-build44-status]'); if (!node) return;
    node.textContent = message; node.dataset.state = error ? 'error' : 'ok'; node.style.fontWeight = '700';
  }

  async function load(force = false) {
    if (loading) return;
    const panel = mountPoint(); if (!panel) return;
    const projectId = activeProjectId();
    if (!projectId) { lastProjectId = 0; lastPayload = null; lastComposition = null; panel.innerHTML = '<p class="small">Open a Packaging project to load Label Production &amp; Reuse.</p>'; return; }
    if (!force && projectId === lastProjectId && lastPayload) return;
    loading = true;
    try {
      panel.innerHTML = '<p class="small">Loading authoritative production/reuse evidence…</p>';
      const [productionResponse, compositionResponse] = await Promise.all([
        apiFetch(`${ENDPOINT}?project_id=${encodeURIComponent(projectId)}`, { cache: 'no-store' }),
        apiFetch(`${COMPOSITION_ENDPOINT}?project_id=${encodeURIComponent(projectId)}`, { cache: 'no-store' }),
      ]);
      const production = await asJson(productionResponse); const composition = await asJson(compositionResponse);
      if (!productionResponse.ok || !production?.ok || !production.authoritative_readback) throw new Error(production?.error || 'Production authority read-back failed.');
      if (!compositionResponse.ok || !composition?.ok || !composition.authoritative_readback) throw new Error(composition?.error || 'Build 43 composition read-back failed.');
      lastProjectId = projectId; loadCount += 1; render(production, composition);
    } catch (error) {
      failureCount += 1; panel.innerHTML = `<p class="small">${esc(error?.message || 'Label Production & Reuse could not be loaded.')}</p>`;
    } finally { loading = false; }
  }

  function applyPrinterProfile() {
    const select = document.querySelector('[data-build44-printer]'); const option = select?.selectedOptions?.[0];
    if (!select?.value || !option) return false;
    if (byId('printTestPrinterName')) byId('printTestPrinterName').value = option.dataset.name || option.textContent || '';
    if (byId('printProfileMargin')) byId('printProfileMargin').value = option.dataset.margin || '0';
    if (byId('printProfileGap')) byId('printProfileGap').value = option.dataset.gap || '0';
    if (byId('printTestScale')) byId('printTestScale').value = '100';
    if (byId('printProfileAutoRotate')) byId('printProfileAutoRotate').checked = option.dataset.auto !== '0';
    return true;
  }

  function currentReadyVersion() { return Number(document.querySelector('[data-build44-version]')?.value || 0) || 0; }

  async function productionPrint() {
    try {
      const projectId = activeProjectId(); if (!projectId) throw new Error('Open a Packaging project first.');
      await load(true);
      if (!lastPayload?.production_ready) throw new Error((lastPayload?.blockers || []).join(' ') || 'Production authority is not GREEN.');
      if (!safeAreaReady()) throw new Error('Build 41 printable safe area is not GREEN.');
      if (!compositionReady()) throw new Error((lastComposition?.blockers || []).join(' ') || 'Build 43 label composition is not GREEN.');
      const versionId = currentReadyVersion(); if (!versionId) throw new Error('Select a reusable approved version with passed physical QA.');
      if (!applyPrinterProfile()) throw new Error('Select an exact-size 100% printer profile.');
      const versionSelect = byId('printTestVersion'); if (!versionSelect) throw new Error('Packaging print-source selector is unavailable.');
      versionSelect.value = String(versionId); versionSelect.dispatchEvent(new Event('change', { bubbles: true }));
      const button = byId('printOptimizedSheet'); if (!button) throw new Error('Optimized print control is unavailable.');
      productionPrintCount += 1; setStatus('Opening immutable approved version at exact 100% size…'); button.click();
    } catch (error) { blockedPrintCount += 1; setStatus(error?.message || 'Production print was blocked.', true); }
  }

  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-build44-print]')) { event.preventDefault(); void productionPrint(); }
    else if (event.target?.closest?.('[data-build44-refresh]')) { event.preventDefault(); void load(true); }
  });
  document.addEventListener('dd:packaging-label-composition-active', () => setTimeout(() => load(true), 0));
  document.addEventListener('dd:packaging-material-intelligence-active', () => setTimeout(() => load(true), 0));

  function startObserver() {
    if (observer || !byId('packagingStudioMain')) return;
    observer = new MutationObserver(() => { const projectId = activeProjectId(); if (projectId !== lastProjectId) queueMicrotask(() => load(true)); });
    observer.observe(byId('packagingStudioMain'), { childList: true, subtree: true });
  }
  function start() { startObserver(); void load(true); }
  function snapshot() { return Object.freeze({ release: RELEASE, build: BUILD, state: 'active', endpoint: ENDPOINT, projectId: lastProjectId || activeProjectId() || null, loadCount, productionPrintCount, blockedPrintCount, failureCount, productionReady: Boolean(lastPayload?.production_ready) && safeAreaReady() && compositionReady(), trueSizePercent: 100, schemaChange: false, requestTimeDdl: false, productionContacted: false }); }
  globalThis.DDPackagingLabelProduction = Object.freeze({ release: RELEASE, build: BUILD, getStatus: snapshot, refresh: () => load(true) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  document.dispatchEvent(new CustomEvent('dd:packaging-label-production-active', { detail: snapshot() }));
})();
