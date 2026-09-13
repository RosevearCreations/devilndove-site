// Release 467 Build 131 — Admin Section Switcher & Module Map.
// Client-only module/section navigation derived from the existing Admin navigation manifest.
(() => {
  'use strict';
  const BUILD = 131;
  const MANIFEST_URL = '/data/admin-navigation-modules.json';
  const normalizePath = (value) => {
    try {
      const path = new URL(String(value || ''), window.location.origin).pathname || '/';
      return path.endsWith('/') ? path : `${path}/`;
    } catch {
      const path = String(value || '/').split('?')[0].split('#')[0] || '/';
      return path.endsWith('/') ? path : `${path}/`;
    }
  };
  const currentPath = () => normalizePath(window.location.pathname);
  async function loadManifest() {
    const response = await fetch(MANIFEST_URL, { method: 'GET', cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Admin navigation manifest unavailable (${response.status})`);
    return response.json();
  }
  function resolveContext(manifest) {
    const path = currentPath();
    for (const module of Array.isArray(manifest?.modules) ? manifest.modules : []) {
      const sections = Array.isArray(module?.sections) ? module.sections : [];
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const section = sections[sectionIndex];
        const links = Array.isArray(section?.links) ? section.links : [];
        const linkIndex = links.findIndex((link) => normalizePath(link?.href) === path);
        if (linkIndex >= 0) return { module, sections, section, sectionIndex, links, linkIndex, path };
      }
    }
    return null;
  }
  function targetForSection(section, currentPathValue) {
    const links = Array.isArray(section?.links) ? section.links : [];
    return links.find((link) => normalizePath(link?.href) !== currentPathValue) || null;
  }
  function anchor() {
    return document.querySelector('[data-dd-admin-section-position]') ||
      document.querySelector('[data-dd-admin-related-tools]') ||
      document.querySelector('[data-dd-admin-context-breadcrumbs]') ||
      document.querySelector('.admin-workspace-return') ||
      document.querySelector('.hero');
  }
  function render(context) {
    if (!context || context.sections.length < 2) return false;
    const host = anchor();
    if (!host || document.querySelector('[data-dd-admin-section-map]')) return false;
    const nav = document.createElement('nav');
    nav.className = 'card';
    nav.dataset.ddAdminSectionMap = String(BUILD);
    nav.setAttribute('aria-label', `${context.module?.label || 'Admin'} section map`);
    nav.style.marginTop = '12px';
    const heading = document.createElement('strong');
    heading.textContent = 'Section map';
    nav.appendChild(heading);
    const summary = document.createElement('p');
    summary.className = 'small';
    summary.textContent = `${context.module?.label || 'Admin'} · ${context.section?.label || 'Current section'} · Section ${context.sectionIndex + 1} of ${context.sections.length}`;
    nav.appendChild(summary);
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexWrap = 'wrap';
    wrap.style.gap = '8px';
    context.sections.forEach((section, index) => {
      const isCurrent = index === context.sectionIndex;
      if (isCurrent) {
        const current = document.createElement('span');
        current.className = 'btn secondary';
        current.setAttribute('aria-current', 'true');
        current.textContent = `${section.label || `Section ${index + 1}`} · Current`;
        wrap.appendChild(current);
        return;
      }
      const target = targetForSection(section, context.path);
      if (!target?.href) return;
      const link = document.createElement('a');
      link.className = 'btn secondary';
      link.href = target.href;
      link.textContent = section.label || target.label || `Section ${index + 1}`;
      link.title = `Open ${target.label || section.label || 'section'}`;
      wrap.appendChild(link);
    });
    if (wrap.children.length < 2) return false;
    nav.appendChild(wrap);
    host.insertAdjacentElement('afterend', nav);
    document.dispatchEvent(new CustomEvent('dd:admin-section-map-ready', { detail: { build: BUILD, module: context.module?.key || '', sectionIndex: context.sectionIndex, sectionCount: context.sections.length } }));
    return true;
  }
  async function boot() {
    try {
      const manifest = await loadManifest();
      const context = resolveContext(manifest);
      if (!context) return;
      if (render(context)) return;
      if (typeof MutationObserver !== 'function') return;
      const observer = new MutationObserver(() => {
        if (render(context)) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      window.setTimeout(() => observer.disconnect(), 15000);
    } catch (error) {
      console.warn('[DD Build 131] admin section map unavailable', error);
    }
  }
  window.DDAdminSectionMap = Object.freeze({ build: BUILD, resolveContext, targetForSection });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else void boot();
})();
