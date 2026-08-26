// Devil n Dove Build 438 Application Modules admin UI.
(function () {
  'use strict';

  const BUILD = 438;
  const API = '/api/admin/app-modules';
  const MODULE_ORDER = ['commerce-operations', 'creative-production', 'business-administration'];
  const ROUTE_PROOF_CASES = Object.freeze([
    Object.freeze({ label: 'Shared Core recovery', path: '/admin/application-modules/', module_key: null }),
    Object.freeze({ label: 'Commerce & Operations', path: '/admin/catalog/', module_key: 'commerce-operations' }),
    Object.freeze({ label: 'Creative & Production', path: '/admin/creative-process/', module_key: 'creative-production' }),
    Object.freeze({ label: 'Business & Administration', path: '/admin/accounting/', module_key: 'business-administration' }),
  ]);

  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  let state = { schema_ready: false, source: 'unknown', reason: null, modules: [], role_access: [], diagnostics: null };
  let busy = false;
  let proofBusy = false;

  function moduleRow(key) {
    return state.modules.find((row) => row.module_key === key) || null;
  }

  function roleRow(moduleKey, roleCode) {
    return state.role_access.find((row) => row.module_key === moduleKey && row.role_code === roleCode) || null;
  }

  function adminCanReadModule(moduleKey) {
    const module = moduleRow(moduleKey);
    const role = roleRow(moduleKey, 'admin');
    return Boolean(
      module && Number(module.is_enabled || 0) === 1 &&
      role && Number(role.is_allowed || 0) === 1 &&
      text(role.access_level).toLowerCase() !== 'none'
    );
  }

  function setStatus(message, tone = '') {
    const el = byId('moduleAuthorityStatus');
    if (!el) return;
    el.textContent = message;
    el.dataset.tone = tone;
  }

  async function apiJson(url, options = {}) {
    if (!window.DDAuth) throw new Error('Authentication helper is unavailable.');
    if (typeof window.DDAuth.apiJson === 'function') {
      return window.DDAuth.apiJson(url, options, { retries: 0, staleOnError: false, fallbackMessage: 'Application module request failed.' });
    }
    const response = await window.DDAuth.apiFetch(url, options);
    return window.DDAuth.readApiJson(response, { fallbackMessage: 'Application module request failed.' });
  }

  function renderHealth() {
    const mount = byId('applicationModuleHealthMount');
    if (!mount) return;
    const d = state.diagnostics;
    if (!d) {
      mount.innerHTML = '<div class="small">Module diagnostics are not available yet.</div>';
      return;
    }
    const warnings = [
      ...(d.missing_modules || []).map((value) => `Missing module: ${value}`),
      ...(d.unexpected_modules || []).map((value) => `Unexpected module: ${value}`),
      ...(d.missing_role_rows || []).map((value) => `Missing role row: ${value}`),
      ...(d.unexpected_role_rows || []).map((value) => `Unexpected role row: ${value}`),
      ...(d.invalid_role_rows || []).map((value) => `Invalid role state: ${value}`),
      ...(d.disabled_with_background || []).map((value) => `Disabled module still permits background work: ${value}`),
      ...(d.admin_recovery_risks || []).map((value) => `Admin access risk: ${value}`),
    ];
    mount.innerHTML = `
      <div class="admin-summary-grid">
        <div class="admin-stat"><div class="admin-stat-label">Core health</div><div class="admin-stat-value">${d.healthy ? 'PASS' : 'CHECK'}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Modules</div><div class="admin-stat-value">${Number(d.module_count || 0)}/${Number(d.expected_module_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Role rows</div><div class="admin-stat-value">${Number(d.role_access_count || 0)}/${Number(d.expected_role_access_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Enabled</div><div class="admin-stat-value">${Number(d.enabled_module_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Background enabled</div><div class="admin-stat-value">${Number(d.background_enabled_count || 0)}</div></div>
        <div class="admin-stat"><div class="admin-stat-label">Shared contracts</div><div class="admin-stat-value">${Number(d.shared_service_contract_count || 0)}</div></div>
      </div>
      ${warnings.length ? `<div class="card" style="margin-top:10px;padding:12px"><strong>Review required</strong><ul class="small compact-list">${warnings.map((warning) => `<li>${esc(warning)}</li>`).join('')}</ul></div>` : '<div class="small" style="margin-top:8px">Registry shape, role rows, recovery access, background invariants and shared-service catalog are internally consistent.</div>'}`;
  }

  function moduleCard(module) {
    const enabled = Number(module.is_enabled || 0) === 1;
    const background = Number(module.background_activity_enabled || 0) === 1;
    const controlsDisabled = !state.schema_ready || busy;
    const backgroundDisabled = controlsDisabled || !enabled;
    return `
      <section class="card" data-module-key="${esc(module.module_key)}">
        <div style="display:flex;gap:14px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
          <div style="min-width:240px;flex:1">
            <h2 style="margin:0 0 6px">${esc(module.display_name)}</h2>
            <div class="small"><code>${esc(module.module_key)}</code></div>
            <p class="small">${esc(module.description)}</p>
            <div class="small" style="display:grid;gap:4px">
              <div><strong>Status:</strong> ${enabled ? 'Enabled' : 'Disabled'}</div>
              <div><strong>Default route:</strong> <code>${esc(module.default_route)}</code></div>
              <div><strong>Requires login:</strong> ${Number(module.requires_login || 0) === 1 ? 'Yes' : 'No'}</div>
              <div><strong>Background activity permission:</strong> ${background ? 'Allowed' : 'Off'}${!enabled ? ' (module disabled)' : ''}</div>
            </div>
          </div>
          <div style="display:grid;gap:8px;min-width:190px">
            <button class="btn" type="button" data-module-toggle="${esc(module.module_key)}" data-next="${enabled ? '0' : '1'}" ${controlsDisabled ? 'disabled' : ''}>${enabled ? 'Disable module' : 'Enable module'}</button>
            <button class="btn" type="button" data-background-toggle="${esc(module.module_key)}" data-next="${background ? '0' : '1'}" ${backgroundDisabled ? 'disabled' : ''}>${!enabled ? 'Enable module first' : (background ? 'Turn background off' : 'Allow background work')}</button>
          </div>
        </div>
      </section>`;
  }

  function renderModules() {
    const mount = byId('applicationModulesMount');
    if (!mount) return;
    const rows = MODULE_ORDER.map(moduleRow).filter(Boolean);
    mount.innerHTML = rows.length
      ? `<div style="display:grid;gap:18px">${rows.map(moduleCard).join('')}</div>`
      : '<div class="card"><p class="small">No module rows are available.</p></div>';
  }

  function roleControl(module, roleCode) {
    const row = roleRow(module.module_key, roleCode) || { is_allowed: 0, access_level: 'none' };
    const allowed = Number(row.is_allowed || 0) === 1;
    const disabled = !state.schema_ready || busy;
    const levels = roleCode === 'admin' ? ['manage', 'read', 'none'] : ['member', 'read', 'none'];
    return `
      <div class="card" style="padding:12px">
        <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap">
          <div>
            <strong>${esc(module.display_name)} — ${esc(roleCode)}</strong>
            <div class="small">${allowed ? 'Allowed' : 'Denied'} · ${esc(row.access_level || 'none')}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <label class="small">Access
              <select data-role-level="${esc(module.module_key)}:${esc(roleCode)}" ${disabled ? 'disabled' : ''}>
                ${levels.map((level) => `<option value="${level}" ${level === (row.access_level || 'none') ? 'selected' : ''}>${level}</option>`).join('')}
              </select>
            </label>
            <button class="btn" type="button" data-role-toggle="${esc(module.module_key)}:${esc(roleCode)}" data-next="${allowed ? '0' : '1'}" ${disabled ? 'disabled' : ''}>${allowed ? 'Deny' : 'Allow'}</button>
          </div>
        </div>
      </div>`;
  }

  function renderRoles() {
    const mount = byId('applicationModuleRolesMount');
    if (!mount) return;
    const rows = MODULE_ORDER.map(moduleRow).filter(Boolean);
    mount.innerHTML = `<div style="display:grid;gap:10px;margin-top:12px">${rows.flatMap((module) => ['member', 'admin'].map((role) => roleControl(module, role))).join('')}</div>`;
  }

  function render() {
    if (state.schema_ready) {
      const enabled = state.modules.filter((module) => Number(module.is_enabled || 0) === 1).length;
      const health = state.diagnostics?.healthy ? ' Core health PASS.' : ' Core health requires review.';
      setStatus(`Build ${BUILD} D1 module authority is ready. ${enabled}/${state.modules.length} modules enabled. Changes are audited.${health}`, state.diagnostics?.healthy ? 'ok' : 'warning');
    } else if (state.source === 'fail_closed') {
      setStatus(`Build 438 module authority is temporarily unavailable (${state.reason || 'read failure'}). Module-control writes are blocked and module-owned access fails closed until authority recovers.`, 'error');
    } else {
      setStatus('Build 438 module tables are not applied yet. Current compatibility defaults stay enabled, but this screen will not write or self-create schema. Apply database_build438_application_module_activation.sql through the normal migration process first.', 'warning');
    }
    renderHealth();
    renderModules();
    renderRoles();
  }

  async function load() {
    setStatus('Loading Build 438 module state…');
    const data = await apiJson(API, { method: 'GET' });
    state = {
      schema_ready: Boolean(data.schema_ready),
      source: data.source || 'unknown',
      reason: data.reason || null,
      modules: Array.isArray(data.modules) ? data.modules : [],
      role_access: Array.isArray(data.role_access) ? data.role_access : [],
      diagnostics: data.diagnostics || null,
    };
    render();
  }

  async function runRouteProof() {
    if (proofBusy) return;
    proofBusy = true;
    const button = byId('runModuleRouteProofButton');
    const mount = byId('applicationModuleRouteProofMount');
    if (button) button.disabled = true;
    if (mount) mount.innerHTML = '<div class="small">Checking current route enforcement…</div>';
    try {
      const results = [];
      for (const item of ROUTE_PROOF_CASES) {
        const expectedAllowed = item.module_key ? adminCanReadModule(item.module_key) : true;
        let status = 0;
        let errorMessage = '';
        try {
          const response = await window.DDAuth.apiFetch(item.path, { method: 'HEAD', cache: 'no-store' });
          status = Number(response.status || 0);
        } catch (error) {
          errorMessage = error?.message || 'request failed';
        }
        const actualAllowed = status >= 200 && status < 400;
        const actualDenied = status === 401 || status === 403;
        const pass = expectedAllowed ? actualAllowed : actualDenied;
        results.push({ ...item, expectedAllowed, status, errorMessage, pass });
      }
      const passed = results.filter((row) => row.pass).length;
      if (mount) {
        mount.innerHTML = `
          <div class="card" style="padding:12px">
            <strong>Current-state route proof: ${passed === results.length ? 'PASS' : 'CHECK'} (${passed}/${results.length})</strong>
            <div style="display:grid;gap:6px;margin-top:8px">
              ${results.map((row) => `<div class="small"><strong>${row.pass ? 'PASS' : 'FAIL'}</strong> — ${esc(row.label)} · expected ${row.expectedAllowed ? 'available' : 'blocked'} · HTTP ${row.status || 'error'}${row.errorMessage ? ` · ${esc(row.errorMessage)}` : ''}</div>`).join('')}
            </div>
          </div>`;
      }
    } finally {
      proofBusy = false;
      if (button) button.disabled = false;
    }
  }

  async function post(payload) {
    if (busy) return;
    busy = true;
    render();
    try {
      await apiJson(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await load();
      if (window.DDApplicationModules?.refresh) await window.DDApplicationModules.refresh();
    } finally {
      busy = false;
      render();
    }
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('#runModuleRouteProofButton')) {
      void runRouteProof();
      return;
    }
    if (event.target.closest('#refreshModuleAuthorityButton')) {
      void load();
      return;
    }

    const toggle = event.target.closest('[data-module-toggle]');
    if (toggle) {
      const moduleKey = toggle.dataset.moduleToggle;
      const next = Number(toggle.dataset.next || 0) === 1;
      if (!next && !window.confirm(`Disable ${moduleRow(moduleKey)?.display_name || moduleKey}? Existing business data will remain intact. Module-owned routes/runtime will be blocked and background permission will be cleared until deliberately re-enabled.`)) return;
      void post({ action: 'set_module_state', module_key: moduleKey, is_enabled: next });
      return;
    }

    const background = event.target.closest('[data-background-toggle]');
    if (background) {
      void post({ action: 'set_background_activity', module_key: background.dataset.backgroundToggle, background_activity_enabled: Number(background.dataset.next || 0) === 1 });
      return;
    }

    const role = event.target.closest('[data-role-toggle]');
    if (role) {
      const [moduleKey, roleCode] = String(role.dataset.roleToggle || '').split(':');
      const allowed = Number(role.dataset.next || 0) === 1;
      const select = document.querySelector(`[data-role-level="${CSS.escape(moduleKey)}:${CSS.escape(roleCode)}"]`);
      const accessLevel = allowed ? (select?.value && select.value !== 'none' ? select.value : (roleCode === 'admin' ? 'manage' : 'member')) : 'none';
      void post({ action: 'set_role_access', module_key: moduleKey, role_code: roleCode, is_allowed: allowed, access_level: accessLevel });
    }
  });

  document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-role-level]');
    if (!select) return;
    const [moduleKey, roleCode] = String(select.dataset.roleLevel || '').split(':');
    const level = select.value || 'none';
    void post({ action: 'set_role_access', module_key: moduleKey, role_code: roleCode, is_allowed: level !== 'none', access_level: level });
  });

  document.addEventListener('DOMContentLoaded', () => {
    void load().catch((error) => {
      console.error('[Build 438 modules]', error);
      setStatus(error?.message || 'Could not load application module state.', 'error');
    });
  }, { once: true });
})();
