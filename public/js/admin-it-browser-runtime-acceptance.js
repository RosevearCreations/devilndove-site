// Release 467 Build 3 — authenticated browser runtime acceptance center.
document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('itBrowserRuntimeAcceptanceMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const apiFetch = (...args) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(...args) : fetch(...args);
  const EXPECTED_MODULES = ['creators', 'financials', 'it-platform', 'socials', 'storefront'];
  const STORAGE_KEY = 'dnd.release467.browserRuntimeEvidence';
  const ENDPOINTS = Object.freeze({
    modules: '/api/admin/app-modules',
    it_control_tower: '/api/admin/it-control-tower',
    inventory_base_units: '/api/admin/site-item-inventory',
    product_media_quality: '/api/admin/product-media-score',
    caip_pipeline: '/api/admin/caip-production-pipeline',
  });

  let latestEvidence = null;

  const badgeClass = (state) => state === 'PASS' ? 'good' : state === 'FAIL' ? 'bad' : 'warn';

  async function getJson(path) {
    const response = await apiFetch(path, { method: 'GET', cache: 'no-store' });
    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; }
    catch { throw new Error(`${path} returned non-JSON content (HTTP ${response.status}).`); }
    return { response, payload };
  }

  function checkModules(payload) {
    const modules = Array.isArray(payload?.modules) ? payload.modules : [];
    const profiles = Array.isArray(payload?.profiles) ? payload.profiles : [];
    const keys = modules.map((row) => String(row?.module_key || '').toLowerCase()).filter(Boolean).sort();
    const diagnostics = payload?.diagnostics && typeof payload.diagnostics === 'object' ? payload.diagnostics : {};
    const roots = profiles.filter((row) => row?.is_root_admin === true);
    const passed = payload?.ok === true
      && payload?.schema_ready === true
      && payload?.migration_required === false
      && JSON.stringify(keys) === JSON.stringify(EXPECTED_MODULES)
      && profiles.length > 0
      && diagnostics?.root_admin_full_manage === true
      && roots.some((row) => row?.full_manage === true)
      && diagnostics?.healthy === true;
    return {
      passed,
      detail: `modules=${keys.join(', ') || 'none'}; profiles=${profiles.length}; root_admin_full_manage=${Boolean(diagnostics?.root_admin_full_manage)}; healthy=${Boolean(diagnostics?.healthy)}`,
    };
  }

  function checkControlTower(payload) {
    const readiness = payload?.readiness && typeof payload.readiness === 'object' ? payload.readiness : {};
    const subsystems = payload?.subsystems && typeof payload.subsystems === 'object' ? payload.subsystems : {};
    const database = subsystems?.database && typeof subsystems.database === 'object' ? subsystems.database : {};
    const admin = subsystems?.admin_authority && typeof subsystems.admin_authority === 'object' ? subsystems.admin_authority : {};
    const passed = payload?.ok === true
      && Number(payload?.release || 0) === 467
      && payload?.environment === 'development'
      && payload?.request_time_schema_mutation === false
      && payload?.production_mutation === false
      && payload?.production_provider_execution === false
      && database?.state === 'green'
      && admin?.state === 'green'
      && ['HOLD_EXTERNAL_ACCEPTANCE', 'READY_FOR_SEPARATE_PROMOTION_REVIEW'].includes(String(readiness?.launch_state || ''));
    return {
      passed,
      detail: `database=${database?.state || 'unknown'}; admin=${admin?.state || 'unknown'}; overall=${readiness?.overall || 'unknown'}; launch_state=${readiness?.launch_state || 'unknown'}`,
    };
  }

  function checkInventory(payload) {
    const rows = [];
    for (const key of ['items', 'results']) {
      if (Array.isArray(payload?.[key])) rows.push(...payload[key].filter((row) => row && typeof row === 'object'));
    }
    const authoritativeRows = rows.filter((row) => Number(row?.site_item_inventory_id || 0) > 0);
    const rowsOk = authoritativeRows.every((row) => row?.quantity_authority === 'base');
    const passed = payload?.ok !== false && payload?.quantity_authority === 'base' && rowsOk;
    return {
      passed,
      detail: `quantity_authority=${payload?.quantity_authority || 'unknown'}; inventory_rows=${authoritativeRows.length}; all_rows_base_authority=${rowsOk}`,
    };
  }

  function checkMedia(payload) {
    const thresholds = payload?.primary_image_thresholds && typeof payload.primary_image_thresholds === 'object'
      ? payload.primary_image_thresholds : {};
    const roles = Array.isArray(payload?.roles) ? payload.roles : [];
    const roleKeys = roles.map((row) => String(row?.role_key || '')).filter(Boolean);
    const passed = payload?.ok !== false
      && Number(thresholds?.min_width_px || 0) === 1200
      && Number(thresholds?.min_height_px || 0) === 1200
      && Number(thresholds?.min_alt_characters || 0) === 12
      && Number(thresholds?.min_quality_score || 0) === 70
      && roleKeys.includes('main');
    return {
      passed,
      detail: `primary=${Number(thresholds?.min_width_px || 0)}x${Number(thresholds?.min_height_px || 0)}; alt>=${Number(thresholds?.min_alt_characters || 0)}; quality>=${Number(thresholds?.min_quality_score || 0)}; main_role=${roleKeys.includes('main')}`,
    };
  }

  function checkCaip(payload) {
    const projects = Array.isArray(payload?.projects) ? payload.projects : [];
    const passed = payload?.ok !== false
      && Number(payload?.release || 0) === 461
      && payload?.schema_ready === true
      && payload?.provider_execution_active === false
      && payload?.publication_active === false
      && payload?.r2_delete_active === false;
    return {
      passed,
      detail: `contract_release=${Number(payload?.release || 0)}; schema_ready=${Boolean(payload?.schema_ready)}; projects=${projects.length}; execution=${Boolean(payload?.provider_execution_active)}; publication=${Boolean(payload?.publication_active)}; r2_delete=${Boolean(payload?.r2_delete_active)}`,
    };
  }

  const CHECKERS = Object.freeze({
    modules: checkModules,
    it_control_tower: checkControlTower,
    inventory_base_units: checkInventory,
    product_media_quality: checkMedia,
    caip_pipeline: checkCaip,
  });

  function renderIdle() {
    mount.innerHTML = `
      <section class="card" style="margin-top:18px">
        <p class="eyebrow">Release 467 • Build 3</p>
        <h2 style="margin-top:0">Authenticated Browser Runtime Acceptance</h2>
        <p class="small">Run a same-origin, GET-only acceptance from this already-authenticated I.T. session. This browser lane proves the application runtime without weakening Cloudflare Access and without requiring a CI service token.</p>
        <div class="admin-compact-tool-grid" style="margin-top:14px">
          <div><strong>Target</strong><small>Current authenticated Development origin only</small></div>
          <div><strong>HTTP</strong><small>GET only</small></div>
          <div><strong>D1 / R2 changes</strong><small>NONE</small></div>
          <div><strong>Provider execution</strong><small>CLOSED</small></div>
          <div><strong>Production</strong><small>FORBIDDEN</small></div>
          <div><strong>CI Access lane</strong><small>Independent evidence; browser PASS does not infer CI service-token readiness</small></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
          <button class="btn" id="runBrowserRuntimeAcceptance" type="button">Run browser acceptance</button>
          <button class="btn secondary" id="copyBrowserRuntimeEvidence" type="button" disabled>Copy sanitized evidence</button>
          <a class="btn secondary" href="/admin/deployment-preflight/">Deployment preflight</a>
        </div>
        <p class="small" id="browserRuntimeAcceptanceStatus" style="margin-bottom:0;margin-top:12px">Ready. No checks have run in this browser session.</p>
        <div id="browserRuntimeAcceptanceResults"></div>
      </section>`;
    document.getElementById('runBrowserRuntimeAcceptance')?.addEventListener('click', runAcceptance);
    document.getElementById('copyBrowserRuntimeEvidence')?.addEventListener('click', copyEvidence);
  }

  function renderResults(checks, overall) {
    const results = document.getElementById('browserRuntimeAcceptanceResults');
    const status = document.getElementById('browserRuntimeAcceptanceStatus');
    if (!results || !status) return;
    status.innerHTML = `<strong>Browser runtime:</strong> <span class="badge ${badgeClass(overall)}">${esc(overall)}</span>`;
    results.innerHTML = checks.map((row) => `
      <div class="card" style="margin-top:10px;padding:14px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div><strong>${esc(row.label)}</strong><div class="small">${esc(row.detail)}</div></div>
          <span class="badge ${badgeClass(row.status)}">${esc(row.status)}</span>
        </div>
      </div>`).join('');
  }

  async function runAcceptance() {
    const button = document.getElementById('runBrowserRuntimeAcceptance');
    const copy = document.getElementById('copyBrowserRuntimeEvidence');
    const status = document.getElementById('browserRuntimeAcceptanceStatus');
    if (button) button.disabled = true;
    if (copy) copy.disabled = true;
    if (status) status.textContent = 'Running authenticated Development GET-only runtime checks…';
    latestEvidence = null;

    const checks = [];
    for (const [key, path] of Object.entries(ENDPOINTS)) {
      try {
        const { response, payload } = await getJson(path);
        const contract = CHECKERS[key](payload);
        const passed = response.status === 200 && contract.passed;
        checks.push({
          key,
          label: key.replaceAll('_', ' '),
          status: passed ? 'PASS' : 'FAIL',
          http_status: response.status,
          detail: `HTTP ${response.status}; ${contract.detail}`,
        });
      } catch (error) {
        checks.push({
          key,
          label: key.replaceAll('_', ' '),
          status: 'FAIL',
          http_status: null,
          detail: String(error?.message || 'Unexpected browser acceptance failure.'),
        });
      }
    }

    const overall = checks.every((row) => row.status === 'PASS') ? 'PASS' : 'FAIL';
    latestEvidence = {
      authority: 'release467-build3-browser-runtime-acceptance',
      release: 467,
      build: 3,
      mode: 'authenticated-browser-read-only',
      generated_at: new Date().toISOString(),
      target_origin: window.location.origin,
      http_method: 'GET',
      credentials_emitted: false,
      cloudflare_access_policy_changed: false,
      ci_service_token_readiness_inferred: false,
      d1_mutation: false,
      r2_mutation: false,
      provider_execution: false,
      provider_publication: false,
      production_mutation: false,
      overall,
      checks,
    };

    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(latestEvidence)); }
    catch { /* Same-session evidence persistence is best-effort only. */ }
    window.dispatchEvent(new CustomEvent('dnd:browser-runtime-acceptance', { detail: latestEvidence }));

    renderResults(checks, overall);
    if (button) button.disabled = false;
    if (copy) copy.disabled = false;
  }

  async function copyEvidence() {
    if (!latestEvidence) return;
    const copy = document.getElementById('copyBrowserRuntimeEvidence');
    try {
      await navigator.clipboard.writeText(`${JSON.stringify(latestEvidence, null, 2)}\n`);
      if (copy) copy.textContent = 'Evidence copied';
      window.setTimeout(() => { if (copy) copy.textContent = 'Copy sanitized evidence'; }, 1800);
    } catch {
      if (copy) copy.textContent = 'Copy unavailable';
    }
  }

  renderIdle();
});
