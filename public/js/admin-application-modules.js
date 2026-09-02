// Current canonical five-module operator controls.
(function () {
  'use strict';
  const API = '/api/admin/app-modules';
  const ORDER = ['storefront', 'creators', 'socials', 'financials', 'it-platform'];
  const LABELS = { storefront: 'Storefront', creators: 'Creators', socials: 'Socials', financials: 'Financials', 'it-platform': 'I.T.' };
  const OWNERSHIP = {
    storefront: 'Public storefront, catalog, products, merchandising, inventory, orders and Home Carousel.',
    creators: 'Creative projects, production studios, tools and creative-media ingest/provenance.',
    socials: 'Social publishing, content publications/packages and CAIP media review.',
    financials: 'Accounting, payments, refunds, gift cards, coupons and financial order views.',
    'it-platform': 'Release, configuration, security, diagnostics, schema, incidents and infrastructure.',
  };
  const byId = (id) => document.getElementById(id);
  const text = (value) => String(value == null ? '' : value).trim();
  const esc = (value) => text(value).replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const apiFetch = (url, options = {}) => window.DDAuth?.apiFetch ? window.DDAuth.apiFetch(url, options) : fetch(url, { credentials: 'same-origin', ...options });
  let snapshot = null;

  async function asJson(response) {
    const type = text(response.headers?.get?.('content-type')).toLowerCase();
    if (!response.ok || !type.includes('application/json')) {
      let detail = '';
      try { detail = text((await response.clone().json())?.error); } catch {}
      throw new Error(detail || `HTTP ${response.status || 'error'} did not return JSON`);
    }
    return response.json();
  }

  async function mutate(body) {
    await asJson(await apiFetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    await refresh();
  }

  function moduleCard(row) {
    const key = text(row.module_key).toLowerCase();
    const enabled = Number(row.is_enabled || 0) === 1;
    const background = Number(row.background_activity_enabled || 0) === 1;
    return `<article class="card" data-module-key="${esc(key)}"><h2>${esc(row.display_name || LABELS[key] || key)}</h2><p class="small">${esc(row.description || OWNERSHIP[key])}</p><p class="small"><strong>Owner surface:</strong> ${esc(OWNERSHIP[key] || '')}</p><label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" data-module-enabled="${esc(key)}" ${enabled ? 'checked' : ''}/> Module enabled</label><label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" data-module-background="${esc(key)}" ${background ? 'checked' : ''} ${enabled ? '' : 'disabled'}/> Background activity allowed</label>${key === 'it-platform' ? '<p class="small"><strong>Access:</strong> explicit user grant only.</p>' : ''}</article>`;
  }

  function renderRoles(payload) {
    const rows = Array.isArray(payload.role_access) ? payload.role_access : [];
    const mount = byId('applicationModuleRolesMount');
    if (!mount) return;
    mount.innerHTML = ORDER.filter((key) => key !== 'it-platform').map((key) => `<div class="card" style="margin-top:10px"><h3>${esc(LABELS[key])}</h3>${['admin','member'].map((role) => {
      const row = rows.find((item) => item.module_key === key && item.role_code === role) || { is_allowed:0, access_level:'none' };
      const allowed = Number(row.is_allowed || 0) === 1;
      const level = text(row.access_level) || (allowed ? 'read' : 'none');
      const levels = role === 'admin' ? ['manage','read'] : ['member','read'];
      return `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0"><label><input type="checkbox" data-role-allowed="${esc(key)}:${esc(role)}" ${allowed ? 'checked' : ''}/> ${esc(role)}</label><select data-role-level="${esc(key)}:${esc(role)}" ${allowed ? '' : 'disabled'}>${levels.map((option) => `<option value="${option}" ${level === option ? 'selected' : ''}>${option}</option>`).join('')}</select></div>`;
    }).join('')}</div>`).join('');
  }

  function accessBadge(entry) {
    const allowed = Boolean(entry?.effective_allowed);
    const level = text(entry?.effective_access_level) || 'none';
    const source = text(entry?.effective_source) || 'unknown';
    return `<span class="small"><strong>${allowed ? esc(level) : 'none'}</strong> · ${esc(source)}</span>`;
  }

  function profileAccessControl(profile, entry, canManage) {
    const key = text(entry.module_key).toLowerCase();
    const explicit = entry.explicit || null;
    const current = explicit ? (Number(explicit.is_allowed || 0) === 1 ? text(explicit.access_level) : 'deny') : 'inherit';
    const protectedRootIt = Boolean(profile.is_root_admin && key === 'it-platform');
    const options = [
      ['inherit', 'Use role/default'],
      ['manage', 'Explicit manage'],
      ['read', 'Explicit read'],
      ['member', 'Explicit member'],
      ['deny', 'Explicit deny'],
    ];
    return `<div style="display:grid;grid-template-columns:minmax(120px,1fr) minmax(150px,1fr) minmax(170px,1fr);gap:8px;align-items:center;margin:7px 0"><strong>${esc(LABELS[key] || key)}</strong>${accessBadge(entry)}<select data-user-access="${profile.user_id}:${esc(key)}" ${canManage ? '' : 'disabled'} aria-label="${esc(LABELS[key] || key)} access for ${esc(profile.display_name || profile.email)}">${options.map(([value,label]) => `<option value="${value}" ${current === value ? 'selected' : ''} ${protectedRootIt && value !== 'manage' ? 'disabled' : ''}>${label}</option>`).join('')}</select></div>`;
  }

  function renderProfiles(payload) {
    const profiles = Array.isArray(payload.profiles) ? payload.profiles : [];
    const mount = byId('applicationModuleProfilesMount');
    const status = byId('applicationModuleProfilesStatus');
    if (!mount) return;
    const canManage = payload.can_manage_user_access === true;
    if (status) status.textContent = profiles.length
      ? `${profiles.length} profile${profiles.length === 1 ? '' : 's'} loaded. ${canManage ? 'You can manage explicit user grants.' : 'Read-only: I.T. manage access is required to change explicit user grants.'}`
      : 'No profiles were returned by the module authority.';
    mount.innerHTML = profiles.length ? profiles.map((profile) => {
      const name = profile.display_name || profile.email || `User ${profile.user_id}`;
      const flags = [profile.role || 'member', profile.is_active ? 'active' : 'inactive', profile.is_root_admin ? 'root admin' : '', profile.full_manage ? 'full manage' : ''].filter(Boolean).join(' · ');
      const access = Array.isArray(profile.module_access) ? profile.module_access : [];
      return `<article class="card" style="margin-top:10px" data-profile-id="${Number(profile.user_id || 0)}"><h3 style="margin-bottom:4px">${esc(name)}</h3><p class="small" style="margin-top:0">${esc(profile.email || '')}${profile.email && name !== profile.email ? ' · ' : ''}${esc(flags)}</p>${ORDER.map((key) => profileAccessControl(profile, access.find((entry) => entry.module_key === key) || { module_key:key, effective_allowed:false, effective_access_level:'none', effective_source:'missing' }, canManage)).join('')}</article>`;
    }).join('') : '<p class="small">No account profiles are available.</p>';
  }

  function render(payload) {
    snapshot = payload;
    const rows = Array.isArray(payload.modules) ? [...payload.modules] : [];
    const order = new Map(ORDER.map((key, index) => [key, index]));
    rows.sort((a,b) => (order.get(a.module_key) ?? 99) - (order.get(b.module_key) ?? 99));
    const mount = byId('applicationModulesMount');
    if (mount) mount.innerHTML = `<div class="department-grid">${rows.map(moduleCard).join('')}</div>`;
    const d = payload.diagnostics || {};
    const health = byId('applicationModuleHealthMount');
    if (health) health.innerHTML = `<p><strong>${d.healthy ? 'HEALTHY' : 'HOLD'}</strong> · ${Number(d.module_count || rows.length)}/5 canonical modules · ${Number(d.role_access_count || 0)} role rows · ${Number(d.active_profile_count || 0)} active profiles · root admin ${d.root_admin_full_manage ? 'FULL MANAGE' : 'MISSING ACCESS'} · migration ${payload.migration_required ? 'required' : 'not required'}</p>${d.root_admin_full_manage ? '' : `<p class="small"><strong>Root admin missing:</strong> ${esc((d.root_admin_missing_manage_modules || []).join(', ') || 'unknown')}</p>`}`;
    const status = byId('moduleAuthorityStatus');
    if (status) status.textContent = `Release ${payload.release || 'unknown'} · source ${text(payload.source) || 'unknown'} · schema ${payload.schema_ready ? 'ready' : 'hold'}. ${text(payload.notes)}`;
    renderRoles(payload);
    renderProfiles(payload);
    bindControls();
  }

  function bindControls() {
    document.querySelectorAll('[data-module-enabled]').forEach((node) => node.addEventListener('change', async () => { node.disabled = true; try { await mutate({ action:'set_module_state', module_key:node.dataset.moduleEnabled, is_enabled:node.checked }); } catch (error) { alert(`Module update failed: ${text(error?.message || error)}`); await refresh(); } }));
    document.querySelectorAll('[data-module-background]').forEach((node) => node.addEventListener('change', async () => { node.disabled = true; try { await mutate({ action:'set_background_activity', module_key:node.dataset.moduleBackground, background_activity_enabled:node.checked }); } catch (error) { alert(`Background update failed: ${text(error?.message || error)}`); await refresh(); } }));
    document.querySelectorAll('[data-role-allowed]').forEach((node) => node.addEventListener('change', async () => { const [moduleKey, roleCode] = node.dataset.roleAllowed.split(':'); const levelNode = document.querySelector(`[data-role-level="${CSS.escape(node.dataset.roleAllowed)}"]`); try { await mutate({ action:'set_role_access', module_key:moduleKey, role_code:roleCode, is_allowed:node.checked, access_level:node.checked ? (levelNode?.value || 'read') : 'none' }); } catch (error) { alert(`Role update failed: ${text(error?.message || error)}`); await refresh(); } }));
    document.querySelectorAll('[data-role-level]').forEach((node) => node.addEventListener('change', async () => { const [moduleKey, roleCode] = node.dataset.roleLevel.split(':'); try { await mutate({ action:'set_role_access', module_key:moduleKey, role_code:roleCode, is_allowed:true, access_level:node.value }); } catch (error) { alert(`Role update failed: ${text(error?.message || error)}`); await refresh(); } }));
    document.querySelectorAll('[data-user-access]').forEach((node) => node.addEventListener('change', async () => {
      const [userId, moduleKey] = node.dataset.userAccess.split(':');
      const value = node.value;
      node.disabled = true;
      try {
        if (value === 'inherit') await mutate({ action:'clear_user_access', user_id:Number(userId), module_key:moduleKey });
        else await mutate({ action:'set_user_access', user_id:Number(userId), module_key:moduleKey, is_allowed:value !== 'deny', access_level:value === 'deny' ? 'none' : value });
      } catch (error) {
        alert(`User access update failed: ${text(error?.message || error)}`);
        await refresh();
      }
    }));
  }

  async function refresh() {
    const button = byId('refreshModuleAuthorityButton'); if (button) button.disabled = true;
    try {
      const payload = await asJson(await apiFetch(API, { method:'GET', cache:'no-store' }));
      if (!payload.ok || !Array.isArray(payload.modules) || !Array.isArray(payload.profiles)) throw new Error('module/profile authority response is incomplete');
      render(payload);
    } catch (error) {
      const status = byId('moduleAuthorityStatus'); if (status) status.textContent = `Module authority could not be loaded: ${text(error?.message || error)}`;
      const profileStatus = byId('applicationModuleProfilesStatus'); if (profileStatus) profileStatus.textContent = 'Profiles could not be loaded.';
    } finally { if (button) button.disabled = false; }
  }

  function showOwnership() {
    const mount = byId('applicationModuleRouteProofMount'); if (!mount) return;
    mount.textContent = `Release ${snapshot?.release || 'current'} canonical ownership\n\n${ORDER.map((key) => `${LABELS[key]} (${key})\n  ${OWNERSHIP[key]}`).join('\n\n')}\n\nShared service contracts: ${snapshot?.diagnostics?.shared_service_contract_count ?? 'unknown'}\nRegistry healthy: ${Boolean(snapshot?.diagnostics?.healthy)}\nRoot admin full manage: ${Boolean(snapshot?.diagnostics?.root_admin_full_manage)}`;
  }

  function init() { byId('refreshModuleAuthorityButton')?.addEventListener('click', refresh); byId('runModuleRouteProofButton')?.addEventListener('click', showOwnership); refresh(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
