// Release 467 Build 129 — Admin Related Tools & Context Shortcuts.
// Client-only related-tool suggestions from the existing admin-navigation-modules.json authority.
(() => {
  'use strict';
  const BUILD = 129;
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

  function locateContext(data) {
    for (const module of Array.isArray(data?.modules) ? data.modules : []) {
      for (const section of Array.isArray(module?.sections) ? module.sections : []) {
        const links = Array.isArray(section?.links) ? section.links : [];
        if (links.some((link) => normalizePath(link?.href) === currentPath)) return { module, section, links };
      }
    }
    return null;
  }

  function render(context) {
    if (!context || document.querySelector('[data-dd-admin-related-tools]')) return false;
    const related = context.links.filter((link) => link?.href && normalizePath(link.href) !== currentPath).slice(0, 4);
    if (!related.length) return false;
    const anchor = document.querySelector('[data-dd-admin-context-breadcrumbs]') || document.querySelector('[data-dd-admin-workspace-nav]');
    if (!anchor) return false;
    const section = document.createElement('section');
    section.className = 'card dd-admin-related-tools';
    section.dataset.ddAdminRelatedTools = String(BUILD);
    section.setAttribute('aria-labelledby', 'ddAdminRelatedToolsTitle');
    section.style.marginTop = '12px';
    const title = document.createElement('h2');
    title.id = 'ddAdminRelatedToolsTitle';
    title.textContent = 'Related tools';
    title.style.marginBottom = '6px';
    const note = document.createElement('p');
    note.className = 'small';
    note.textContent = `${context.module?.label || 'Admin'} • ${context.section?.label || 'Tools'} — nearby tools from the existing Admin navigation manifest.`;
    const links = document.createElement('div');
    links.className = 'dd-admin-related-tools-links';
    links.style.display = 'flex';
    links.style.flexWrap = 'wrap';
    links.style.gap = '8px';
    related.forEach((item) => {
      const link = document.createElement('a');
      link.className = 'btn secondary';
      link.href = item.href;
      link.textContent = item.label || item.href;
      links.appendChild(link);
    });
    section.append(title, note, links);
    anchor.insertAdjacentElement('afterend', section);
    return true;
  }

  async function init() {
    try {
      const response = await fetch(MANIFEST_URL, { method: 'GET', cache: 'no-store' });
      if (!response.ok) return;
      const context = locateContext(await response.json());
      if (!context) return;
      if (render(context)) return;
      const observer = new MutationObserver(() => { if (render(context)) observer.disconnect(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window.setTimeout(() => observer.disconnect(), 6000);
    } catch {}
  }

  window.DDAdminRelatedTools = Object.freeze({ build: BUILD, manifest: MANIFEST_URL });
  void init().finally(() => document.dispatchEvent(new CustomEvent('dd:admin-related-tools-ready', { detail: { build: BUILD } })));
})();
