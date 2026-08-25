// File: /public/js/admin-today-tasks.js
// Build 279: Today tasks defer until admin access and never fire during auth bootstrap.
// Build 368: dedicated /admin/today-tasks/ workspace uses the Build 366 owned read contract;
// existing dashboard compatibility remains supported. Done/Ignore/Snooze stays on retained POST authority.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('todayTasksAdminMount') || document.getElementById('desktopTodayTasksMount');
  if (!mount || !window.DDAuth) return;

  const dedicated = Boolean(document.getElementById('todayTasksAdminMount'));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  let loading = false;
  let lastPayload = null;
  let activeCategory = '';

  function readinessBanner(data) {
    if (data?.schema_ready === true) return '<div class="status-note success">All Today Tasks read dependencies are available.</div>';
    const missing = Array.isArray(data?.missing_tables) ? data.missing_tables : [];
    const errors = Array.isArray(data?.query_errors) ? data.query_errors : [];
    const details = errors.map((row) => `<li><strong>${esc(row.key || 'read')}</strong>: ${esc(row.message || 'Unavailable')}</li>`).join('');
    return `<div class="status-note warning"><strong>Today Tasks is partially available.</strong>${missing.length ? `<div class="small">Missing tables: ${esc(missing.join(', '))}</div>` : ''}${details ? `<details class="small" style="margin-top:8px"><summary>Read diagnostics</summary><ul>${details}</ul></details>` : ''}</div>`;
  }

  function renderDedicated(data) {
    lastPayload = data;
    const allTasks = Array.isArray(data?.tasks) ? data.tasks : [];
    const categories = Array.isArray(data?.categories) ? data.categories : [];
    const tasks = activeCategory ? allTasks.filter((task) => task.category === activeCategory) : allTasks;
    const filters = [''].concat(categories).map((category) => `<button class="btn ${activeCategory === category ? 'primary' : 'secondary'}" type="button" data-task-category="${esc(category)}">${category ? esc(category) : 'all'}</button>`).join(' ');

    mount.innerHTML = `${readinessBanner(data)}<div class="card" style="margin-top:14px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin:0">Daily queue</h2><div class="small">${esc(data?.summary?.total_count || 0)} total item(s) · ${esc(data?.suppressed_count || 0)} suppressed task group(s)</div></div><button class="btn" id="refreshTodayTasksButton" type="button">Refresh</button></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${filters}</div></div><div id="todayTasksList">${tasks.length ? tasks.map((task) => taskCard(task)).join('') : '<div class="card" style="margin-top:12px"><div class="small">No tasks match this view right now.</div></div>'}</div>`;

    mount.querySelector('#refreshTodayTasksButton')?.addEventListener('click', () => load({ force: true }));
    mount.querySelectorAll('[data-task-category]').forEach((button) => button.addEventListener('click', () => {
      activeCategory = button.getAttribute('data-task-category') || '';
      renderDedicated(lastPayload);
    }));
    mount.querySelectorAll('[data-today-action]').forEach((button) => button.addEventListener('click', () => taskAction(button.dataset.taskKey, button.dataset.todayAction)));
  }

  function taskCard(task) {
    const details = Array.isArray(task?.details) && task.details.length
      ? `<details class="small"><summary>Details</summary>${task.details.map((row) => `<div class="status-note warning" style="margin-top:6px"><strong>${esc(row.incident_code || row.incident_scope || 'incident')}</strong><br>${esc(row.message || '')}<br>${esc(row.request_path || '')} · ${esc(row.created_at || '')}</div>`).join('')}</details>`
      : '';
    return `<article class="card" style="margin-top:12px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0">${esc(task.label || task.key || 'Task')}</h3><div class="small">${esc(task.category || 'general')} · ${esc(task.count || 0)} item(s)</div></div><a class="btn" href="${esc(task.href || '/admin/')}">Open work</a></div>${details}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" type="button" data-today-action="completed" data-task-key="${esc(task.key || '')}">Done</button><button class="btn secondary" type="button" data-today-action="ignored" data-task-key="${esc(task.key || '')}">Ignore</button><button class="btn secondary" type="button" data-today-action="snoozed" data-task-key="${esc(task.key || '')}">Snooze 24h</button></div></article>`;
  }

  function renderCompatibility(data, category, min) {
    mount.innerHTML = `<section class="card">${readinessBanner(data)}<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><h2>Today</h2><p class="small">${esc(data.summary?.total_count || 0)} item(s) need attention. ${esc(data.suppressed_count || 0)} suppressed.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end"><label class="small">Category<select id="todayTaskCategory"><option value="">All</option>${(data.categories || []).map((value) => `<option value="${esc(value)}" ${value === category ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label><label class="small">Min count<input id="todayTaskMinCount" type="number" min="1" value="${esc(min)}"></label><label class="small">Snooze<select id="todayTaskSnooze"><option value="1">1 hour</option><option value="4">4 hours</option><option value="24">1 day</option><option value="168">1 week</option></select></label><button class="btn" id="todayTaskApplyFilters" type="button">Apply</button></div></div>${(data.tasks || []).map((task) => `<article class="status-note warning" style="margin-top:8px"><strong>${esc(task.label)}</strong> <span class="small">${esc(task.category || 'general')} · ${esc(task.count || 0)}</span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><a class="btn small" href="${esc(task.href || '#')}">Open</a><button class="btn small" type="button" data-today-snooze="${esc(task.key)}">Snooze</button><button class="btn small" type="button" data-today-complete="${esc(task.key)}">Done</button></div></article>`).join('') || '<p class="small">No active Today tasks for this filter.</p>'}</section>`;
    document.getElementById('todayTaskApplyFilters')?.addEventListener('click', () => load({ force: true }));
    mount.querySelectorAll('[data-today-snooze]').forEach((button) => button.addEventListener('click', () => taskAction(button.dataset.todaySnooze, 'snoozed')));
    mount.querySelectorAll('[data-today-complete]').forEach((button) => button.addEventListener('click', () => taskAction(button.dataset.todayComplete, 'completed')));
  }

  async function load({ force = false } = {}) {
    if (loading && !force) return;
    loading = true;
    const category = dedicated ? activeCategory : (document.getElementById('todayTaskCategory')?.value || '');
    const min = dedicated ? '1' : (document.getElementById('todayTaskMinCount')?.value || '1');
    try {
      const query = new URLSearchParams();
      if (category) query.set('category', category);
      query.set('min_count', min);
      const response = await window.DDAuth.apiFetch(`/api/admin/contracts/operations-today-tasks-read?${query.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || `Today Tasks read failed (${response.status}).`);
      if (dedicated) renderDedicated(data);
      else renderCompatibility(data, category, min);
    } catch (error) {
      mount.innerHTML = `<section class="card"><h2>Today</h2><p class="small">${esc(error?.message || 'Today tasks are temporarily unavailable.')}</p><button class="btn" id="todayTaskRetry" type="button">Retry</button></section>`;
      document.getElementById('todayTaskRetry')?.addEventListener('click', () => load({ force: true }));
    } finally {
      loading = false;
    }
  }

  async function taskAction(key, status) {
    const hours = dedicated ? 24 : Number(document.getElementById('todayTaskSnooze')?.value || 1);
    const payload = { task_key: key, action_status: status, snooze_hours: hours, notes: `${status} from Today Tasks` };
    try {
      const response = await window.DDAuth.apiFetch('/api/admin/today-task-actions', { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Task update failed.');
    } catch (error) {
      if (dedicated) window.alert(error?.message || 'Task update failed.');
    }
    void load({ force: true });
  }

  if (window.DDWhenAdminReady) {
    window.DDWhenAdminReady(() => load(), { delayMs: dedicated ? 0 : 450 });
  } else if (window.DDAuth.isLoggedIn?.()) {
    void load();
  } else {
    document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok) void load(); }, { once: true });
  }
});
