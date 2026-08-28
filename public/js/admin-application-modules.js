// Release 447 — canonical five-module operator controls.
(function () {
  'use strict';
  const RELEASE = 447;
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
  function render(payload) {
    snapshot = payload;
    const rows = Array.isArray(payload.modules) ? [...payload.modules] : [];
    const order = new Map(ORDER.map((key, index) => [key, index]));
    rows.sort((a,b) => (order.get(a.module_key) ?? 99) - (order.get(b.module_key) ?? 99));
    const mount = byId('applicationModulesMount');
    if (mount) mount.innerHTML = `<div class="department-grid">${rows.map(moduleCard).join('')}</div>`;
    const d = payload.diagnostics || {};
    const health = byId('applicationModuleHealthMount');
    if (health) health.innerHTML = `<p><strong>${d.healthy ? 'HEALTHY' : 'HOLD'}</strong> · ${Number(d.module_count || rows.length)}/5 canonical modules · ${Number(d.role_access_count || 0)} role rows · migration ${payload.migration_required ? 'required' : 'not required'}</p>`;
    const status = byId('moduleAuthorityStatus');
    if (status) status.textContent = `Release ${payload.release || 'unknown'} · source ${text(payload.source) || 'unknown'} · schema ${payload.schema_ready ? 'ready' : 'hold'}. ${text(payload.notes)}`;
    renderRoles(payload);
    bindControls();
  }
  function bindControls() {
    document.querySelectorAll('[data-module-enabled]').forEach((node) => node.addEventListener('change', async () => { node.disabled = true; try { await mutate({ action:'set_module_state', module_key:node.dataset.moduleEnabled, is_enabled:node.checked }); } catch (error) { alert(`Module update failed: ${text(error?.message || error)}`); await refresh(); } }));
    document.querySelectorAll('[data-module-background]').forEach((node) => node.addEventListener('change', async () => { node.disabled = true; try { await mutate({ action:'set_background_activity', module_key:node.dataset.moduleBackground, background_activity_enabled:node.checked }); } catch (error) { alert(`Background update failed: ${text(error?.message || error)}`); await refresh(); } }));
    document.querySelectorAll('[data-role-allowed]').forEach((node) => node.addEventListener('change', async () => { const [moduleKey, roleCode] = node.dataset.roleAllowed.split(':'); const levelNode = document.querySelector(`[data-role-level="${CSS.escape(node.dataset.roleAllowed)}"]`); try { await mutate({ action:'set_role_access', module_key:moduleKey, role_code:roleCode, is_allowed:node.checked, access_level:node.checked ? (levelNode?.value || 'read') : 'none' }); } catch (error) { alert(`Role update failed: ${text(error?.message || error)}`); await refresh(); } }));
    document.querySelectorAll('[data-role-level]').forEach((node) => node.addEventListener('change', async () => { const [moduleKey, roleCode] = node.dataset.roleLevel.split(':'); try { await mutate({ action:'set_role_access', module_key:moduleKey, role_code:roleCode, is_allowed:true, access_level:node.value }); } catch (error) { alert(`Role update failed: ${text(error?.message || error)}`); await refresh(); } }));
  }
  async function refresh() {
    const button = byId('refreshModuleAuthorityButton'); if (button) button.disabled = true;
    try { const payload = await asJson(await apiFetch(API, { method:'GET', cache:'no-store' })); if (Number(payload.release || 0) !== RELEASE) throw new Error(`release mismatch: expected ${RELEASE}, received ${payload.release || 'none'}`); render(payload); }
    catch (error) { const status = byId('moduleAuthorityStatus'); if (status) status.textContent = `Module authority could not be loaded: ${text(error?.message || error)}`; }
    finally { if (button) button.disabled = false; }
  }
  function showOwnership() {
    const mount = byId('applicationModuleRouteProofMount'); if (!mount) return;
    mount.textContent = `Release ${snapshot?.release || RELEASE} canonical ownership\n\n${ORDER.map((key) => `${LABELS[key]} (${key})\n  ${OWNERSHIP[key]}`).join('\n\n')}\n\nShared service contracts: ${snapshot?.diagnostics?.shared_service_contract_count ?? 'unknown'}\nRegistry healthy: ${Boolean(snapshot?.diagnostics?.healthy)}`;
  }
  function init() { byId('refreshModuleAuthorityButton')?.addEventListener('click', refresh); byId('runModuleRouteProofButton')?.addEventListener('click', showOwnership); refresh(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
