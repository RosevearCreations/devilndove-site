// Release 467 Build 122 — Admin Workspace Navigation & Command Palette.
// Client-only navigation over the existing admin-navigation-modules.json authority.
(() => {
  'use strict';
  const BUILD = 122;
  const MANIFEST_URL = '/data/admin-navigation-modules.json';
  if (!window.location.pathname.startsWith('/admin')) return;

  const normalizePath = (value) => {
    try {
      const url = new URL(String(value || '/admin/'), window.location.origin);
      let path = url.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '');
      return path || '/';
    } catch {
      return '/admin';
    }
  };
  const currentPath = normalizePath(window.location.pathname);
  const FALLBACK_MODULES = [
    { key: 'storefront', label: 'Storefront', href: '/admin/storefront/', sections: [] },
    { key: 'creator', label: 'Creator', href: '/admin/creator/', sections: [] },
    { key: 'finance', label: 'Finance', href: '/admin/finance/', sections: [] },
    { key: 'it', label: 'I.T.', href: '/admin/it/', sections: [] },
  ];

  let manifest = { modules: FALLBACK_MODULES };
  let entries = [];
  let visible = [];
  let activeIndex = 0;
  let triggerButton = null;
  let overlay = null;
  let searchInput = null;
  let resultsMount = null;
  let lastFocus = null;

  function injectStyles() {
    if (document.getElementById('ddAdminCommandPaletteStyles')) return;
    const style = document.createElement('style');
    style.id = 'ddAdminCommandPaletteStyles';
    style.textContent = `
      .dd-admin-workspace-nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0 0;padding:10px 12px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.025)}
      .dd-admin-workspace-nav a,.dd-admin-workspace-nav button{min-height:38px}
      .dd-admin-workspace-nav a[aria-current="page"]{font-weight:800;box-shadow:inset 0 0 0 1px currentColor}
      .dd-admin-command-trigger{white-space:nowrap}
      .dd-admin-palette-overlay[hidden]{display:none!important}
      .dd-admin-palette-overlay{position:fixed;inset:0;z-index:99990;background:rgba(8,8,12,.72);display:grid;place-items:start center;padding:8vh 16px 24px}
      .dd-admin-palette{width:min(760px,100%);max-height:82vh;overflow:hidden;border:1px solid var(--border);border-radius:18px;background:var(--bg,#111);box-shadow:0 28px 80px rgba(0,0,0,.45);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto}
      .dd-admin-palette-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:16px 18px 10px}
      .dd-admin-palette-head h2{margin:0;font-size:1.15rem}
      .dd-admin-palette-search{padding:0 18px 12px}
      .dd-admin-palette-search input{width:100%;min-height:46px}
      .dd-admin-palette-results{overflow:auto;padding:0 10px 12px}
      .dd-admin-palette-result{width:100%;text-align:left;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:0;border-radius:12px;padding:11px 12px;background:transparent;color:inherit;cursor:pointer}
      .dd-admin-palette-result:hover,.dd-admin-palette-result[aria-selected="true"]{background:rgba(255,255,255,.08)}
      .dd-admin-palette-result small{display:block;opacity:.78;margin-top:3px}
      .dd-admin-palette-kind{font-size:.76rem;opacity:.68;text-transform:uppercase;letter-spacing:.06em}
      .dd-admin-palette-empty{padding:18px;text-align:center}
      .dd-admin-palette-foot{display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap;padding:10px 18px 14px;border-top:1px solid var(--border)}
      body.dd-admin-palette-open{overflow:hidden}
      @media(max-width:700px){.dd-admin-palette-overlay{padding:12px}.dd-admin-palette{max-height:calc(100vh - 24px)}.dd-admin-workspace-nav{position:relative}.dd-admin-workspace-nav .dd-admin-command-trigger{width:100%}.dd-admin-palette-result{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function flattenNavigation(data) {
    const rows = [{ kind: 'home', module: 'Admin', section: 'Admin', label: 'Admin Home', href: '/admin/', keywords: 'admin home dashboard operations today tasks' }];
    const modules = Array.isArray(data?.modules) ? data.modules : FALLBACK_MODULES;
    modules.forEach((module) => {
      rows.push({ kind: 'workspace', module: module.label || module.key || 'Workspace', section: 'Workspace', label: module.label || module.key || 'Workspace', href: module.href || '/admin/', keywords: `${module.label || ''} ${module.summary || ''} workspace` });
      (Array.isArray(module.sections) ? module.sections : []).forEach((section) => {
        (Array.isArray(section?.links) ? section.links : []).forEach((link) => {
          if (!link?.href) return;
          rows.push({ kind: 'tool', module: module.label || module.key || 'Workspace', section: section.label || 'Tools', label: link.label || link.href, href: link.href, keywords: `${module.label || ''} ${section.label || ''} ${link.label || ''} ${link.href || ''}` });
        });
      });
    });
    const seen = new Set();
    return rows.filter((row) => {
      const key = `${normalizePath(row.href)}|${String(row.label).toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function moduleForCurrentPath(data) {
    const modules = Array.isArray(data?.modules) ? data.modules : FALLBACK_MODULES;
    const hubKey = document.body?.dataset?.adminModuleHub || '';
    if (hubKey) {
      const byKey = modules.find((m) => m?.key === hubKey);
      if (byKey) return byKey.key;
    }
    for (const module of modules) {
      if (normalizePath(module?.href) === currentPath) return module?.key || '';
      for (const section of Array.isArray(module?.sections) ? module.sections : []) {
        if ((section?.links || []).some((link) => normalizePath(link?.href) === currentPath)) return module?.key || '';
      }
    }
    return '';
  }

  function markExistingCurrentLinks() {
    document.querySelectorAll('.nav a[href]').forEach((link) => {
      if (normalizePath(link.getAttribute('href')) === currentPath) link.setAttribute('aria-current', 'page');
    });
  }

  function buildWorkspaceNav(data) {
    if (document.querySelector('[data-dd-admin-workspace-nav]')) return;
    const shell = document.querySelector('.container.admin-shell') || document.querySelector('.container');
    const primaryNav = shell?.querySelector('.nav');
    if (!shell || !primaryNav) return;
    const modules = Array.isArray(data?.modules) ? data.modules : FALLBACK_MODULES;
    const activeModule = moduleForCurrentPath(data);
    const nav = document.createElement('nav');
    nav.className = 'dd-admin-workspace-nav';
    nav.dataset.ddAdminWorkspaceNav = '122';
    nav.setAttribute('aria-label', 'Admin workspaces');
    const adminLink = document.createElement('a');
    adminLink.className = 'btn secondary';
    adminLink.href = '/admin/';
    adminLink.textContent = 'Admin';
    if (currentPath === normalizePath('/admin/')) adminLink.setAttribute('aria-current', 'page');
    nav.appendChild(adminLink);
    modules.forEach((module) => {
      const link = document.createElement('a');
      link.className = 'btn secondary';
      link.href = module.href || '/admin/';
      link.textContent = module.label || module.key || 'Workspace';
      if (module.key && module.key === activeModule) link.setAttribute('aria-current', 'page');
      nav.appendChild(link);
    });
    const command = document.createElement('button');
    command.type = 'button';
    command.className = 'btn dd-admin-command-trigger';
    command.dataset.ddAdminCommandTrigger = '122';
    command.textContent = 'Jump to…';
    command.title = 'Open admin command palette (Ctrl/Cmd+K)';
    command.addEventListener('click', openPalette);
    nav.appendChild(command);
    triggerButton = command;
    primaryNav.insertAdjacentElement('afterend', nav);
  }

  function ensureHeaderTrigger() {
    const links = document.querySelector('.nav .links');
    if (!links || links.querySelector('[data-dd-admin-command-trigger]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn secondary dd-admin-command-trigger';
    button.dataset.ddAdminCommandTrigger = '122';
    button.textContent = 'Jump';
    button.title = 'Open admin command palette (Ctrl/Cmd+K)';
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', openPalette);
    const logout = links.querySelector('[data-nav-logout]');
    links.insertBefore(button, logout || null);
    triggerButton = button;
  }

  function createPalette() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'dd-admin-palette-overlay';
    overlay.hidden = true;
    overlay.dataset.ddAdminCommandPalette = '122';
    const dialog = document.createElement('section');
    dialog.className = 'dd-admin-palette';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'ddAdminPaletteTitle');
    const head = document.createElement('div');
    head.className = 'dd-admin-palette-head';
    const titleWrap = document.createElement('div');
    const title = document.createElement('h2');
    title.id = 'ddAdminPaletteTitle';
    title.textContent = 'Go to an admin workspace or tool';
    const note = document.createElement('div');
    note.className = 'small';
    note.textContent = 'Searches the current admin navigation manifest. No preference or history is stored.';
    titleWrap.append(title, note);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn secondary';
    close.textContent = 'Close';
    close.addEventListener('click', closePalette);
    head.append(titleWrap, close);
    const searchWrap = document.createElement('div');
    searchWrap.className = 'dd-admin-palette-search';
    searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.autocomplete = 'off';
    searchInput.placeholder = 'Search Products, Inventory, Accounting, I.T.…';
    searchInput.setAttribute('aria-label', 'Search admin workspaces and tools');
    searchInput.setAttribute('aria-controls', 'ddAdminPaletteResults');
    searchInput.setAttribute('aria-autocomplete', 'list');
    searchInput.addEventListener('input', () => { activeIndex = 0; renderResults(searchInput.value); });
    searchWrap.appendChild(searchInput);
    resultsMount = document.createElement('div');
    resultsMount.id = 'ddAdminPaletteResults';
    resultsMount.className = 'dd-admin-palette-results';
    resultsMount.setAttribute('role', 'listbox');
    resultsMount.setAttribute('aria-label', 'Admin navigation results');
    const foot = document.createElement('div');
    foot.className = 'dd-admin-palette-foot small';
    foot.innerHTML = '<span>↑/↓ select • Enter open • Esc close</span><span>Ctrl/Cmd+K opens from anywhere in Admin</span>';
    dialog.append(head, searchWrap, resultsMount, foot);
    overlay.appendChild(dialog);
    overlay.addEventListener('mousedown', (event) => { if (event.target === overlay) closePalette(); });
    document.body.appendChild(overlay);
  }

  function scoreEntry(entry, query) {
    if (!query) return entry.kind === 'home' ? 0 : entry.kind === 'workspace' ? 1 : 2;
    const label = String(entry.label || '').toLowerCase();
    const hay = `${entry.module} ${entry.section} ${entry.label} ${entry.keywords}`.toLowerCase();
    if (label === query) return 0;
    if (label.startsWith(query)) return 1;
    if (label.includes(query)) return 2;
    const tokens = query.split(/\s+/).filter(Boolean);
    return tokens.every((token) => hay.includes(token)) ? 3 : 99;
  }

  function resultId(index) { return `ddAdminPaletteResult${index}`; }
  function renderResults(rawQuery = '') {
    if (!resultsMount) return;
    const query = String(rawQuery || '').trim().toLowerCase();
    visible = entries.map((entry) => ({ entry, score: scoreEntry(entry, query) })).filter((row) => row.score < 99).sort((a, b) => a.score - b.score || a.entry.label.localeCompare(b.entry.label)).slice(0, 14).map((row) => row.entry);
    if (activeIndex >= visible.length) activeIndex = Math.max(0, visible.length - 1);
    resultsMount.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'dd-admin-palette-empty small';
      empty.textContent = 'No matching admin workspace or tool.';
      resultsMount.appendChild(empty);
      searchInput?.removeAttribute('aria-activedescendant');
      return;
    }
    visible.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = resultId(index);
      button.className = 'dd-admin-palette-result';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', index === activeIndex ? 'true' : 'false');
      const text = document.createElement('span');
      const strong = document.createElement('strong'); strong.textContent = entry.label;
      const meta = document.createElement('small'); meta.textContent = entry.kind === 'workspace' ? `${entry.module} workspace` : `${entry.module} • ${entry.section}`;
      text.append(strong, meta);
      const kind = document.createElement('span'); kind.className = 'dd-admin-palette-kind'; kind.textContent = entry.kind;
      button.append(text, kind);
      button.addEventListener('mouseenter', () => { activeIndex = index; syncActiveResult(); });
      button.addEventListener('click', () => navigate(entry.href));
      resultsMount.appendChild(button);
    });
    syncActiveResult();
  }

  function syncActiveResult() {
    resultsMount?.querySelectorAll('[role="option"]').forEach((row, index) => row.setAttribute('aria-selected', index === activeIndex ? 'true' : 'false'));
    if (visible.length) {
      searchInput?.setAttribute('aria-activedescendant', resultId(activeIndex));
      resultsMount?.querySelector(`#${resultId(activeIndex)}`)?.scrollIntoView({ block: 'nearest' });
    } else searchInput?.removeAttribute('aria-activedescendant');
  }
  function navigate(href) { if (href) window.location.assign(href); }
  function openPalette() {
    createPalette(); lastFocus = document.activeElement; overlay.hidden = false; document.body.classList.add('dd-admin-palette-open'); activeIndex = 0;
    if (searchInput) searchInput.value = '';
    renderResults(''); window.setTimeout(() => searchInput?.focus(), 0);
  }
  function closePalette() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true; document.body.classList.remove('dd-admin-palette-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus(); else triggerButton?.focus();
  }
  function onKeyDown(event) {
    const key = String(event.key || '').toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'k') { event.preventDefault(); openPalette(); return; }
    if (!overlay || overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closePalette(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); if (visible.length) activeIndex = (activeIndex + 1) % visible.length; syncActiveResult(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); if (visible.length) activeIndex = (activeIndex - 1 + visible.length) % visible.length; syncActiveResult(); }
    else if (event.key === 'Enter' && document.activeElement === searchInput && visible[activeIndex]) { event.preventDefault(); navigate(visible[activeIndex].href); }
  }
  async function loadManifest() {
    try {
      const response = await fetch(MANIFEST_URL, { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`Navigation manifest unavailable (${response.status}).`);
      const data = await response.json();
      if (!Array.isArray(data?.modules) || !data.modules.length) throw new Error('Navigation manifest has no modules.');
      manifest = data;
    } catch (error) {
      console.warn('[DD Build 122] admin navigation manifest fallback in use', error);
      manifest = { modules: FALLBACK_MODULES };
    }
    entries = flattenNavigation(manifest); buildWorkspaceNav(manifest); ensureHeaderTrigger(); markExistingCurrentLinks();
    if (overlay && !overlay.hidden) renderResults(searchInput?.value || '');
    window.DDAdminWorkspaceNavigation = Object.freeze({ build: BUILD, manifest_url: MANIFEST_URL, open: openPalette, close: closePalette, item_count: () => entries.length, current_path: currentPath });
    document.dispatchEvent(new CustomEvent('dd:admin-navigation-ready', { detail: { build: BUILD, item_count: entries.length, current_path: currentPath } }));
  }
  injectStyles(); createPalette(); document.addEventListener('keydown', onKeyDown);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void loadManifest(), { once: true }); else void loadManifest();
})();
