// Release 467 Build 127 — Admin Context Breadcrumbs & Workspace Return.
// Admin-only, client-only context over the existing navigation manifest. No saved state or business-data writes.
(() => {
  'use strict';
  const BUILD = 127;
  const MANIFEST_URL = '/data/admin-navigation-modules.json';
  if (!window.location.pathname.startsWith('/admin')) return;

  const normalizePath = (value) => {
    try {
      const url = new URL(String(value || '/admin/'), window.location.origin);
      let path = url.pathname.replace(/\/index\.html$/i, '/').replace(/\/+$/, '');
      return path || '/';
    } catch { return '/admin'; }
  };
  const currentPath = normalizePath(window.location.pathname);
  const clean = (value, fallback = '') => String(value ?? '').trim() || fallback;
  const pageLabel = () => clean(document.querySelector('h1')?.textContent, clean(document.title.split('—')[0], 'Admin'));

  let initialized = false;
  let observer = null;
  let context = null;

  function resolveContext(data) {
    if (currentPath === '/admin') return { module: null, section: null, tool: { label: 'Admin Home', href: '/admin/' }, moduleHub: false, resolved: true };
    const modules = Array.isArray(data?.modules) ? data.modules : [];
    for (const module of modules) {
      const modulePath = normalizePath(module?.href || '/admin/');
      if (modulePath === currentPath) {
        return { module: { key: clean(module?.key), label: clean(module?.label, 'Workspace'), href: module?.href || '/admin/' }, section: null, tool: null, moduleHub: true, resolved: true };
      }
      for (const section of Array.isArray(module?.sections) ? module.sections : []) {
        const match = (Array.isArray(section?.links) ? section.links : []).find((link) => normalizePath(link?.href) === currentPath);
        if (match) {
          return {
            module: { key: clean(module?.key), label: clean(module?.label, 'Workspace'), href: module?.href || '/admin/' },
            section: { label: clean(section?.label, 'Tools') },
            tool: { label: clean(match?.label, pageLabel()), href: match?.href || window.location.pathname },
            moduleHub: false,
            resolved: true,
          };
        }
      }
    }
    return { module: null, section: null, tool: { label: pageLabel(), href: window.location.pathname }, moduleHub: false, resolved: false };
  }

  async function loadManifest() {
    try {
      const response = await fetch(MANIFEST_URL, { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      const data = await response.json();
      return data && typeof data === 'object' ? data : { modules: [] };
    } catch {
      return { modules: [] };
    }
  }

  function ensureStyles() {
    if (document.getElementById('ddAdminContextBreadcrumbStyles')) return;
    const style = document.createElement('style');
    style.id = 'ddAdminContextBreadcrumbStyles';
    style.textContent = `
      .dd-admin-context-breadcrumbs{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:10px 0 0;padding:9px 12px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.018)}
      .dd-admin-context-trail{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0}
      .dd-admin-context-trail a,.dd-admin-context-trail span{font-size:.9rem}
      .dd-admin-context-separator{opacity:.5;user-select:none}
      .dd-admin-context-current{font-weight:800}
      .dd-admin-context-return{white-space:nowrap}
      @media(max-width:700px){.dd-admin-context-breadcrumbs{align-items:stretch}.dd-admin-context-trail{width:100%}.dd-admin-context-return{width:100%;text-align:center}}
    `;
    document.head.appendChild(style);
  }

  function link(label, href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    return a;
  }

  function separator() {
    const span = document.createElement('span');
    span.className = 'dd-admin-context-separator';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = '›';
    return span;
  }

  function currentLabel(label) {
    const span = document.createElement('span');
    span.className = 'dd-admin-context-current';
    span.setAttribute('aria-current', 'page');
    span.textContent = label;
    return span;
  }

  function render() {
    const workspaceNav = document.querySelector('[data-dd-admin-workspace-nav]');
    if (!workspaceNav || !context) return false;
    document.querySelectorAll('[data-dd-admin-context-breadcrumbs]').forEach((node) => node.remove());

    const nav = document.createElement('nav');
    nav.className = 'dd-admin-context-breadcrumbs';
    nav.dataset.ddAdminContextBreadcrumbs = String(BUILD);
    nav.setAttribute('aria-label', 'Admin context');
    const trail = document.createElement('div');
    trail.className = 'dd-admin-context-trail';

    if (currentPath === '/admin') {
      trail.appendChild(currentLabel('Admin'));
    } else {
      trail.appendChild(link('Admin', '/admin/'));
      if (context.module) {
        trail.appendChild(separator());
        if (context.moduleHub) trail.appendChild(currentLabel(context.module.label));
        else trail.appendChild(link(context.module.label, context.module.href));
      }
      if (context.section && !context.moduleHub) {
        trail.appendChild(separator());
        const section = document.createElement('span');
        section.textContent = context.section.label;
        trail.appendChild(section);
      }
      if (context.tool && !context.moduleHub) {
        trail.appendChild(separator());
        trail.appendChild(currentLabel(context.tool.label));
      } else if (!context.module && context.tool) {
        trail.appendChild(separator());
        trail.appendChild(currentLabel(context.tool.label));
      }
    }
    nav.appendChild(trail);

    if (context.module && !context.moduleHub) {
      const back = document.createElement('a');
      back.className = 'btn secondary dd-admin-context-return';
      back.href = context.module.href;
      back.textContent = `Back to ${context.module.label}`;
      back.dataset.ddAdminWorkspaceReturn = String(BUILD);
      nav.appendChild(back);
    }
    workspaceNav.insertAdjacentElement('afterend', nav);
    return true;
  }

  function waitForWorkspaceNav() {
    if (render()) return;
    observer = new MutationObserver(() => {
      if (render()) { observer?.disconnect(); observer = null; }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => { observer?.disconnect(); observer = null; render(); }, 6000);
  }

  async function initialize(user) {
    if (initialized || String(user?.role || '').toLowerCase() !== 'admin') return;
    initialized = true;
    ensureStyles();
    const manifest = await loadManifest();
    context = resolveContext(manifest);
    waitForWorkspaceNav();
    window.DDAdminContextBreadcrumbs = Object.freeze({
      build: BUILD,
      manifest: MANIFEST_URL,
      current_path: currentPath,
      snapshot: () => JSON.parse(JSON.stringify(context)),
      rerender: render,
    });
    document.dispatchEvent(new CustomEvent('dd:admin-context-breadcrumbs-ready', { detail: { build: BUILD, current_path: currentPath, resolved: context.resolved === true } }));
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (event?.detail?.ok === true && event?.detail?.user) void initialize(event.detail.user);
  });
  const existingUser = window.DDAuthUiState?.user || window.DDAuth?.getStoredUser?.();
  if (existingUser && String(existingUser.role || '').toLowerCase() === 'admin') void initialize(existingUser);
})();
