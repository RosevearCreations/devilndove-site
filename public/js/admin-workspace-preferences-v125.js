// Release 467 Build 125 — User Preferences & Workspace Memory.
// Admin-only, user-scoped browser convenience state. No server/business-data persistence.
(() => {
  'use strict';
  const BUILD = 125;
  const PREFS_PREFIX = 'dd_admin_workspace_preferences_v1';
  const MEMORY_PREFIX = 'dd_admin_workspace_memory_v1';
  const DEFAULTS = Object.freeze({ remember_last_workspace: true, show_recent_tools: true, recent_limit: 5 });
  if (!window.location.pathname.startsWith('/admin')) return;

  const normalizePath = (value) => {
    try {
      const url = new URL(String(value || '/admin/'), window.location.origin);
      let path = url.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '');
      return path || '/';
    } catch { return '/admin'; }
  };
  const currentPath = normalizePath(window.location.pathname);
  const isAdminHome = currentPath === '/admin';
  const safeJson = (raw, fallback) => {
    try { const value = JSON.parse(raw); return value && typeof value === 'object' ? value : fallback; } catch { return fallback; }
  };
  const safeRead = (key, fallback) => {
    try { return safeJson(localStorage.getItem(key), fallback); } catch { return fallback; }
  };
  const safeWrite = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };
  const safeRemove = (key) => {
    try { localStorage.removeItem(key); return true; } catch { return false; }
  };
  const clean = (value, fallback = '') => String(value ?? '').trim() || fallback;
  const labelForPage = () => clean(document.querySelector('h1')?.textContent, clean(document.title.split('—')[0], 'Admin'));

  let identity = '';
  let prefsKey = '';
  let memoryKey = '';
  let prefs = { ...DEFAULTS };
  let memory = { last: null, recent: [] };
  let dialog = null;
  let observer = null;
  let initialized = false;

  function identityFor(user) {
    const id = Number(user?.user_id || user?.id || 0);
    return id > 0 ? `user-${id}` : '';
  }
  function normalizePrefs(value = {}) {
    const limit = [3, 5, 8].includes(Number(value.recent_limit)) ? Number(value.recent_limit) : DEFAULTS.recent_limit;
    return {
      remember_last_workspace: value.remember_last_workspace !== false,
      show_recent_tools: value.show_recent_tools !== false,
      recent_limit: limit,
    };
  }
  function normalizeMemory(value = {}) {
    const recent = Array.isArray(value.recent) ? value.recent.filter((row) => row && String(row.path || '').startsWith('/admin')).slice(0, 8) : [];
    const last = value.last && String(value.last.path || '').startsWith('/admin') ? value.last : null;
    return { last, recent };
  }
  function savePrefs() { safeWrite(prefsKey, prefs); }
  function saveMemory() { safeWrite(memoryKey, memory); }
  function rememberCurrentLocation() {
    if (!prefs.remember_last_workspace || isAdminHome) return;
    const row = { path: currentPath, label: labelForPage(), visited_at: new Date().toISOString() };
    memory.last = row;
    memory.recent = [row, ...memory.recent.filter((item) => normalizePath(item.path) !== currentPath)].slice(0, 8);
    saveMemory();
  }
  function clearWorkspaceMemory() {
    memory = { last: null, recent: [] };
    safeRemove(memoryKey);
    renderControls();
    renderDialog();
    document.dispatchEvent(new CustomEvent('dd:workspace-memory-cleared', { detail: { build: BUILD, identity } }));
  }
  function link(label, href, className = 'btn secondary') {
    const a = document.createElement('a');
    a.className = className; a.href = href; a.textContent = label;
    return a;
  }
  function ensureStyles() {
    if (document.getElementById('ddWorkspaceMemoryStyles')) return;
    const style = document.createElement('style');
    style.id = 'ddWorkspaceMemoryStyles';
    style.textContent = `
      .dd-workspace-memory-status{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .dd-workspace-memory-overlay[hidden]{display:none!important}
      .dd-workspace-memory-overlay{position:fixed;inset:0;z-index:99995;background:rgba(8,8,12,.72);display:grid;place-items:center;padding:16px}
      .dd-workspace-memory-dialog{width:min(620px,100%);max-height:88vh;overflow:auto;border:1px solid var(--border);border-radius:18px;background:var(--bg,#111);padding:18px;box-shadow:0 28px 80px rgba(0,0,0,.45)}
      .dd-workspace-memory-dialog h2{margin-top:0}
      .dd-workspace-memory-row{display:flex;gap:10px;align-items:flex-start;margin:12px 0}
      .dd-workspace-memory-recent{display:grid;gap:8px;margin-top:12px}
      .dd-workspace-memory-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
    `;
    document.head.appendChild(style);
  }
  function closeDialog() {
    if (!dialog) return;
    dialog.hidden = true;
  }
  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('div');
    dialog.className = 'dd-workspace-memory-overlay';
    dialog.dataset.ddWorkspaceMemoryDialog = String(BUILD);
    dialog.hidden = true;
    dialog.addEventListener('mousedown', (event) => { if (event.target === dialog) closeDialog(); });
    document.body.appendChild(dialog);
    return dialog;
  }
  function renderDialog() {
    if (!dialog) return;
    const recentRows = prefs.show_recent_tools ? memory.recent.slice(0, prefs.recent_limit) : [];
    dialog.innerHTML = '';
    const panel = document.createElement('section');
    panel.className = 'dd-workspace-memory-dialog';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'ddWorkspaceMemoryTitle');

    const heading = document.createElement('h2');
    heading.id = 'ddWorkspaceMemoryTitle';
    heading.textContent = 'Workspace memory';
    const intro = document.createElement('p');
    intro.className = 'small';
    intro.textContent = 'These preferences stay in this browser and are scoped to the signed-in admin. They do not change Devil n Dove business data.';

    const rememberRow = document.createElement('label');
    rememberRow.className = 'dd-workspace-memory-row';
    const remember = document.createElement('input');
    remember.type = 'checkbox'; remember.checked = prefs.remember_last_workspace;
    remember.addEventListener('change', () => { prefs.remember_last_workspace = remember.checked; savePrefs(); if (!remember.checked) { memory.last = null; saveMemory(); } renderControls(); });
    rememberRow.append(remember, document.createTextNode(' Remember my last non-home Admin workspace'));

    const recentRow = document.createElement('label');
    recentRow.className = 'dd-workspace-memory-row';
    const recent = document.createElement('input');
    recent.type = 'checkbox'; recent.checked = prefs.show_recent_tools;
    recent.addEventListener('change', () => { prefs.show_recent_tools = recent.checked; savePrefs(); renderControls(); renderDialog(); });
    recentRow.append(recent, document.createTextNode(' Show my recent Admin tools'));

    const limitRow = document.createElement('label');
    limitRow.className = 'dd-workspace-memory-row';
    limitRow.append(document.createTextNode('Recent tools to keep visible: '));
    const select = document.createElement('select');
    [3,5,8].forEach((value) => { const option = document.createElement('option'); option.value = String(value); option.textContent = String(value); option.selected = prefs.recent_limit === value; select.appendChild(option); });
    select.addEventListener('change', () => { prefs.recent_limit = Number(select.value) || 5; savePrefs(); renderControls(); renderDialog(); });
    limitRow.appendChild(select);

    const recentMount = document.createElement('div');
    recentMount.className = 'dd-workspace-memory-recent';
    const recentTitle = document.createElement('strong');
    recentTitle.textContent = 'Recent tools';
    recentMount.appendChild(recentTitle);
    if (!recentRows.length) {
      const empty = document.createElement('span'); empty.className = 'small'; empty.textContent = prefs.show_recent_tools ? 'No recent tools recorded yet.' : 'Recent tools are hidden by preference.'; recentMount.appendChild(empty);
    } else recentRows.forEach((row) => recentMount.appendChild(link(clean(row.label, row.path), row.path)));

    const actions = document.createElement('div');
    actions.className = 'dd-workspace-memory-actions';
    const clear = document.createElement('button');
    clear.type = 'button'; clear.className = 'btn secondary'; clear.textContent = 'Clear workspace memory'; clear.addEventListener('click', clearWorkspaceMemory);
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'btn'; close.textContent = 'Close'; close.addEventListener('click', closeDialog);
    actions.append(clear, close);
    panel.append(heading, intro, rememberRow, recentRow, limitRow, recentMount, actions);
    dialog.appendChild(panel);
  }
  function openDialog() {
    ensureDialog(); renderDialog(); dialog.hidden = false;
    dialog.querySelector('input,select,button,a')?.focus();
  }
  function renderControls() {
    const nav = document.querySelector('[data-dd-admin-workspace-nav]');
    if (!nav) return false;
    nav.querySelectorAll('[data-dd-workspace-memory-control]').forEach((node) => node.remove());
    const wrap = document.createElement('span');
    wrap.className = 'dd-workspace-memory-status';
    wrap.dataset.ddWorkspaceMemoryControl = String(BUILD);
    if (isAdminHome && prefs.remember_last_workspace && memory.last?.path && normalizePath(memory.last.path) !== '/admin') {
      wrap.appendChild(link(`Resume: ${clean(memory.last.label, 'last workspace')}`, memory.last.path, 'btn'));
    }
    if (prefs.show_recent_tools && memory.recent.length) {
      const first = memory.recent.find((row) => normalizePath(row.path) !== currentPath);
      if (first && !isAdminHome) wrap.appendChild(link(`Recent: ${clean(first.label, first.path)}`, first.path));
    }
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn secondary'; button.textContent = 'Workspace memory';
    button.dataset.ddWorkspaceMemoryButton = String(BUILD);
    button.addEventListener('click', openDialog);
    wrap.appendChild(button);
    nav.appendChild(wrap);
    return true;
  }
  function waitForWorkspaceNav() {
    if (renderControls()) return;
    observer = new MutationObserver(() => { if (renderControls()) { observer?.disconnect(); observer = null; } });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => { observer?.disconnect(); observer = null; renderControls(); }, 6000);
  }
  function initialize(user) {
    if (initialized) return;
    identity = identityFor(user);
    if (!identity) return;
    prefsKey = `${PREFS_PREFIX}:${identity}`;
    memoryKey = `${MEMORY_PREFIX}:${identity}`;
    prefs = normalizePrefs(safeRead(prefsKey, DEFAULTS));
    memory = normalizeMemory(safeRead(memoryKey, { last: null, recent: [] }));
    savePrefs();
    rememberCurrentLocation();
    ensureStyles();
    waitForWorkspaceNav();
    initialized = true;
    window.DDAdminWorkspaceMemory = Object.freeze({
      build: BUILD,
      storage_scope: identity,
      snapshot: () => ({ preferences: { ...prefs }, memory: { last: memory.last ? { ...memory.last } : null, recent: memory.recent.map((row) => ({ ...row })) } }),
      clear: clearWorkspaceMemory,
      open: openDialog,
    });
    document.dispatchEvent(new CustomEvent('dd:workspace-memory-ready', { detail: { build: BUILD, identity, current_path: currentPath } }));
  }
  document.addEventListener('dd:admin-ready', (event) => {
    if (event?.detail?.ok === true && event?.detail?.user) initialize(event.detail.user);
  });
  const existingUser = window.DDAuthUiState?.user || window.DDAuth?.getStoredUser?.();
  if (existingUser && String(existingUser.role || '').toLowerCase() === 'admin') initialize(existingUser);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dialog && !dialog.hidden) closeDialog();
  });
})();
