// Devil n Dove Build 438 Application Modules admin UI.
(function () {
  'use strict';

  const BUILD = 438;
  const API = '/api/admin/app-modules';
  const MODULE_ORDER = ['commerce-operations', 'creative-production', 'business-administration'];

  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value ?? '').trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  let state = { schema_ready: false, modules: [], role_access: [] };
  let busy = false;

  function moduleRow(key) {
    return state.modules.find((row) => row.module_key === key) || null;
  }

  function roleRow(moduleKey, roleCode) {
    return state.role_access.find((row) => row.module_key === moduleKey && row.role_code === roleCode) || null;
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

  function moduleCard(module) {
    const enabled = Number(module.is_enabled || 0) === 1;
    const background = Number(module.background_activity_enabled || 0) === 1;
    const disabled = !state.schema_ready || busy;
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
              <div><strong>Background activity permission:</strong> ${background ? 'Allowed' : 'Off'}</div>
            </div>
          </div>
          <div style="display:grid;gap:8px;min-width:190px">
            <button class="btn" type="button" data-module-toggle="${esc(module.module_key)}" data-next="${enabled ? '0' : '1'}" ${disabled ? 'disabled' : ''}>${enabled ? 'Disable module' : 'Enable module'}</button>
            <button class="btn" type="button" data-background-toggle="${esc(module.module_key)}" data-next="${background ? '0' : '1'}" ${disabled ? 'disabled' : ''}>${background ? 'Turn background off' : 'Allow background work'}</button>
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
      setStatus(`Build ${BUILD} D1 module authority is ready. ${enabled}/${state.modules.length} modules enabled. Changes are audited.`, 'ok');
    } else {
      setStatus('Build 438 module tables are not applied yet. Current defaults stay enabled, but this screen will not write or self-create schema. Apply database_build438_application_module_activation.sql through the normal migration process first.', 'warning');
    }
    renderModules();
    renderRoles();
  }

  async function load() {
    setStatus('Loading Build 438 module state…');
    const data = await apiJson(API, { method: 'GET' });
    state = {
      schema_ready: Boolean(data.schema_ready),
      source: data.source || 'unknown',
      modules: Array.isArray(data.modules) ? data.modules : [],
      role_access: Array.isArray(data.role_access) ? data.role_access : [],
    };
    render();
  }

  async function post(payload) {
    if (busy) return;
    busy = true;
    render();
    try {
      await apiJson(API, { method: 'POST', body: JSON.stringify(payload) });
      await load();
      if (window.DDApplicationModules?.refresh) await window.DDApplicationModules.refresh();
    } finally {
      busy = false;
      render();
    }
  }

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-module-toggle]');
    if (toggle) {
      const moduleKey = toggle.dataset.moduleToggle;
      const next = Number(toggle.dataset.next || 0) === 1;
      if (!next && !window.confirm(`Disable ${moduleRow(moduleKey)?.display_name || moduleKey}? Existing business data will remain intact, but routes and runtime activation will be blocked until re-enabled.`)) return;
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
