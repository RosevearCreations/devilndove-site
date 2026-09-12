// Release 467 Build 123 — Admin Home Dashboard Refresh.
// Read-only client overview over existing Today Tasks, I.T. and navigation authorities.
(() => {
  'use strict';
  const BUILD = 123;
  const MANIFEST_URL = '/data/admin-navigation-modules.json';
  const TODAY_URL = '/api/admin/contracts/operations-today-tasks-read?min_count=1';
  const IT_URL = '/api/admin/it-operations-control-tower';
  if (!/^\/admin\/?(?:index\.html)?$/i.test(window.location.pathname)) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const mounts = {
    summary: document.getElementById('adminHomeDashboardSummary'),
    today: document.getElementById('adminHomeDashboardToday'),
    workspaces: document.getElementById('adminHomeDashboardWorkspaces'),
    quick: document.getElementById('adminHomeDashboardQuickLinks'),
    health: document.getElementById('adminHomeDashboardHealth'),
    status: document.getElementById('adminHomeDashboardStatus'),
  };
  if (!mounts.summary || !mounts.today || !mounts.workspaces || !mounts.quick || !mounts.health) return;

  const MODULE_BY_CATEGORY = Object.freeze({
    catalog: { label: 'Creator', href: '/admin/creator/' },
    customers: { label: 'Storefront', href: '/admin/storefront/' },
    orders: { label: 'Finance', href: '/admin/finance/' },
    inventory: { label: 'Creator', href: '/admin/creator/' },
    accounting: { label: 'Finance', href: '/admin/finance/' },
    health: { label: 'I.T.', href: '/admin/it/' },
  });
  const QUICK_LABELS = ['Products','Catalog & Inventory','Orders','Accounting','Business Health','Application Sanity Check','Today Tasks'];

  function injectStyles() {
    if (document.getElementById('ddAdminHomeDashboardStyles')) return;
    const style = document.createElement('style');
    style.id = 'ddAdminHomeDashboardStyles';
    style.textContent = `
      .dd-admin-dashboard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
      .dd-admin-dashboard-metric strong{display:block;font-size:1.55rem;margin-top:4px}
      .dd-admin-dashboard-section{margin-top:18px}
      .dd-admin-dashboard-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)}
      .dd-admin-dashboard-row:last-child{border-bottom:0}
      .dd-admin-dashboard-actions{display:flex;gap:8px;flex-wrap:wrap}
      .dd-admin-dashboard-workspace-links{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
      .dd-admin-dashboard-workspace-links a{font-size:.86rem}
      .dd-admin-dashboard-status{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      @media(max-width:680px){.dd-admin-dashboard-row{display:block}.dd-admin-dashboard-actions{margin-top:9px}.dd-admin-dashboard-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  async function getJson(url, { auth = true } = {}) {
    const response = auth && window.DDAuth?.apiFetch
      ? await window.DDAuth.apiFetch(url, { method: 'GET', cache: 'no-store' })
      : await fetch(url, { method: 'GET', cache: 'no-store', credentials: 'same-origin' });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw new Error(data?.error || `${url} unavailable (${response.status}).`);
    if (auth && data?.ok === false) throw new Error(data?.error || `${url} returned an invalid payload.`);
    return data;
  }

  const valueOr = (value, fallback = '—') => value === null || value === undefined || value === '' ? fallback : value;
  function metric(label, value, detail = '') {
    return `<article class="card dd-admin-dashboard-metric"><span class="small">${esc(label)}</span><strong>${esc(valueOr(value))}</strong>${detail ? `<div class="small">${esc(detail)}</div>` : ''}</article>`;
  }

  function renderSummary(today, it) {
    const summary = today?.summary || {};
    const metrics = it?.headline_metrics || {};
    const taskGroups = Array.isArray(today?.tasks) ? today.tasks.length : null;
    mounts.summary.innerHTML = [
      metric('Actionable items', summary.total_count, today ? `${valueOr(taskGroups, 0)} active task group(s)` : 'Today Tasks unavailable'),
      metric('Readiness score', metrics.readiness_score !== undefined ? `${metrics.readiness_score}/100` : null, metrics.readiness_state || 'I.T. summary unavailable'),
      metric('Technical blockers', metrics.technical_blockers, 'Current I.T. diagnostics'),
      metric('Attention actions', metrics.attention_actions, 'Current I.T. recovery queue'),
    ].join('');
  }

  function renderToday(today, error = '') {
    if (!today) {
      mounts.today.innerHTML = `<section class="card"><h2>Today</h2><p class="small">${esc(error || 'Today Tasks summary is unavailable.')}</p><a class="btn" href="/admin/today-tasks/">Open full Today Tasks</a></section>`;
      return;
    }
    const tasks = (Array.isArray(today.tasks) ? today.tasks : []).slice(0, 5);
    const rows = tasks.map((task) => {
      const owner = MODULE_BY_CATEGORY[String(task?.category || '').trim()] || { label: 'Admin', href: '/admin/' };
      return `<div class="dd-admin-dashboard-row"><div><strong>${esc(task.label || task.key || 'Task')}</strong><div class="small">${esc(task.count || 0)} item(s) • ${esc(owner.label)}</div></div><div class="dd-admin-dashboard-actions"><a class="btn secondary" href="${esc(owner.href)}">${esc(owner.label)}</a><a class="btn" href="${esc(task.href || '/admin/today-tasks/')}">Open work</a></div></div>`;
    }).join('');
    mounts.today.innerHTML = `<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin:0">Start with today</h2><p class="small" style="margin:6px 0 0">Read-only summary of the existing Today Tasks authority. Complete, Ignore and Snooze remain in the full workspace.</p></div><a class="btn" href="/admin/today-tasks/">Open full Today Tasks</a></div>${rows || '<p class="small">No active task groups right now.</p>'}</section>`;
  }

  function manifestModules(manifest) { return Array.isArray(manifest?.modules) ? manifest.modules : []; }
  function moduleLinks(module) { return (module?.sections || []).flatMap((section) => Array.isArray(section?.links) ? section.links : []); }
  function renderWorkspaces(manifest, error = '') {
    const modules = manifestModules(manifest);
    if (!modules.length) {
      mounts.workspaces.innerHTML = `<section class="card"><h2>Workspaces</h2><p class="small">${esc(error || 'Navigation manifest unavailable.')}</p><div class="dd-admin-dashboard-actions"><a class="btn secondary" href="/admin/storefront/">Storefront</a><a class="btn secondary" href="/admin/creator/">Creator</a><a class="btn secondary" href="/admin/finance/">Finance</a><a class="btn secondary" href="/admin/it/">I.T.</a></div></section>`;
      return;
    }
    mounts.workspaces.innerHTML = `<div class="dd-admin-dashboard-grid">${modules.map((module) => {
      const links = moduleLinks(module);
      const featured = links.slice(0, 3);
      return `<article class="card"><h2 style="margin-top:0">${esc(module.label || module.key || 'Workspace')}</h2><p class="small">${esc(module.summary || '')}</p><div class="small"><strong>${links.length}</strong> current tool(s)</div><div class="dd-admin-dashboard-workspace-links">${featured.map((link) => `<a href="${esc(link.href || '/admin/')}">${esc(link.label || 'Open')}</a>`).join('')}</div><div style="margin-top:12px"><a class="btn" href="${esc(module.href || '/admin/')}">Open workspace</a></div></article>`;
    }).join('')}</div>`;
  }

  function renderQuickLinks(manifest) {
    const all = manifestModules(manifest).flatMap(moduleLinks);
    const selected = QUICK_LABELS.map((label) => all.find((link) => String(link?.label || '') === label)).filter(Boolean);
    mounts.quick.innerHTML = `<section class="card"><h2 style="margin-top:0">Quick destinations</h2><p class="small">Shortcuts resolve from the current navigation manifest; this dashboard does not maintain a second route list or recent-history store.</p><div class="dd-admin-dashboard-actions">${selected.length ? selected.map((link) => `<a class="btn secondary" href="${esc(link.href)}">${esc(link.label)}</a>`).join('') : '<a class="btn secondary" href="/admin/">Use Jump / Ctrl+K</a>'}</div></section>`;
  }

  function renderHealth(it, error = '') {
    if (!it) {
      mounts.health.innerHTML = `<section class="card"><h2>System health</h2><p class="small">${esc(error || 'I.T. summary is unavailable.')}</p><a class="btn" href="/admin/it/">Open I.T.</a></section>`;
      return;
    }
    const metrics = it.headline_metrics || {};
    const verified = it.release_authority?.verified_development || {};
    const production = it.release_authority?.production || {};
    mounts.health.innerHTML = `<section class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin:0">System health</h2><p class="small" style="margin:6px 0 0">Read-only snapshot from the current I.T. control tower.</p></div><div class="dd-admin-dashboard-actions"><a class="btn secondary" href="/admin/reliability/">Reliability</a><a class="btn secondary" href="/admin/deployment-preflight/">Preflight</a><a class="btn" href="/admin/it/">Open I.T.</a></div></div><div class="dd-admin-dashboard-grid" style="margin-top:12px">${metric('Verified Development', verified.build ? `Build ${verified.build}` : null, verified.dev_sha ? String(verified.dev_sha).slice(0, 12) : '')}${metric('Production', production.build ? `Build ${production.build}` : null, production.state || '')}${metric('Admin profiles', metrics.active_profiles, 'Active profiles')}${metric('Foreign-key violations', metrics.foreign_key_violations, 'Target: 0')}</div></section>`;
  }

  function setBusy(busy) {
    Object.values(mounts).forEach((mount) => { if (mount) mount.setAttribute('aria-busy', busy ? 'true' : 'false'); });
  }

  async function load() {
    injectStyles();
    setBusy(true);
    if (mounts.status) mounts.status.innerHTML = '<span class="small">Refreshing dashboard…</span>';
    const [manifestResult, todayResult, itResult] = await Promise.allSettled([
      getJson(MANIFEST_URL, { auth: false }),
      getJson(TODAY_URL),
      getJson(IT_URL),
    ]);
    const manifest = manifestResult.status === 'fulfilled' ? manifestResult.value : null;
    const today = todayResult.status === 'fulfilled' ? todayResult.value : null;
    const it = itResult.status === 'fulfilled' ? itResult.value : null;
    renderSummary(today, it);
    renderToday(today, todayResult.status === 'rejected' ? todayResult.reason?.message : '');
    renderWorkspaces(manifest, manifestResult.status === 'rejected' ? manifestResult.reason?.message : '');
    renderQuickLinks(manifest || {});
    renderHealth(it, itResult.status === 'rejected' ? itResult.reason?.message : '');
    const failures = [manifestResult, todayResult, itResult].filter((row) => row.status === 'rejected').length;
    if (mounts.status) mounts.status.innerHTML = `<div class="dd-admin-dashboard-status"><span class="small">Release 467 Build ${BUILD} dashboard refreshed${failures ? ` with ${failures} partial read failure(s)` : ''}.</span><button class="btn secondary" id="adminHomeDashboardRetry" type="button">Refresh</button></div>`;
    document.getElementById('adminHomeDashboardRetry')?.addEventListener('click', () => void load());
    setBusy(false);
  }

  const start = () => void load();
  if (window.DDWhenAdminReady) window.DDWhenAdminReady(start, { delayMs: 120 });
  else if (window.DDAuth?.isLoggedIn?.()) start();
  else document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) start(); }, { once: true });
})();
