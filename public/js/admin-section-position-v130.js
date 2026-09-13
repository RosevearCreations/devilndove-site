// Release 467 Build 130 — Admin Section Position & Previous/Next Tool Navigation.
// Client-only position and adjacent-tool navigation from the existing Admin navigation manifest.
(() => {
  'use strict';
  const BUILD = 130;
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
        const links = (Array.isArray(section?.links) ? section.links : []).filter((link) => link?.href);
        const index = links.findIndex((link) => normalizePath(link.href) === currentPath);
        if (index >= 0) return { module, section, links, index };
      }
    }
    return null;
  }

  function toolLink(item, direction) {
    if (!item?.href) return null;
    const link = document.createElement('a');
    link.className = 'btn secondary';
    link.href = item.href;
    link.textContent = `${direction}: ${item.label || item.href}`;
    link.setAttribute('aria-label', `${direction} tool: ${item.label || item.href}`);
    return link;
  }

  function render(context) {
    if (!context || document.querySelector('[data-dd-admin-section-position]')) return false;
    const total = context.links.length;
    if (!total || context.index < 0 || context.index >= total) return false;
    const previous = context.index > 0 ? context.links[context.index - 1] : null;
    const next = context.index + 1 < total ? context.links[context.index + 1] : null;
    const anchor = document.querySelector('[data-dd-admin-related-tools]') || document.querySelector('[data-dd-admin-context-breadcrumbs]') || document.querySelector('[data-dd-admin-workspace-nav]');
    if (!anchor) return false;

    const section = document.createElement('section');
    section.className = 'card dd-admin-section-position';
    section.dataset.ddAdminSectionPosition = String(BUILD);
    section.setAttribute('aria-labelledby', 'ddAdminSectionPositionTitle');
    section.style.marginTop = '12px';

    const title = document.createElement('h2');
    title.id = 'ddAdminSectionPositionTitle';
    title.textContent = 'Section position';
    title.style.marginBottom = '6px';

    const note = document.createElement('p');
    note.className = 'small';
    note.textContent = `${context.module?.label || 'Admin'} • ${context.section?.label || 'Tools'} • Tool ${context.index + 1} of ${total}`;

    const actions = document.createElement('div');
    actions.className = 'dd-admin-section-position-actions';
    actions.style.display = 'flex';
    actions.style.flexWrap = 'wrap';
    actions.style.gap = '8px';
    const previousLink = toolLink(previous, 'Previous');
    const nextLink = toolLink(next, 'Next');
    if (previousLink) actions.appendChild(previousLink);
    if (nextLink) actions.appendChild(nextLink);
    if (!previousLink && !nextLink) {
      const only = document.createElement('span');
      only.className = 'small';
      only.textContent = 'This is the only tool in this section.';
      actions.appendChild(only);
    }

    section.append(title, note, actions);
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

  window.DDAdminSectionPosition = Object.freeze({ build: BUILD, manifest: MANIFEST_URL });
  void init().finally(() => document.dispatchEvent(new CustomEvent('dd:admin-section-position-ready', { detail: { build: BUILD } })));
})();

// Release 467 Build 131: once section position is available, layer the same-manifest module section map.
void import('/public/js/admin-section-map-v131.js?v=467b131')
  .catch((error) => console.warn('[DD Build 131] admin section map unavailable', error));

// Release 467 Build 132: compose existing Admin navigation context into one responsive dock.
void import('/public/js/admin-navigation-context-dock-v132.js?v=467b132')
  .catch((error) => console.warn('[DD Build 132] admin navigation context dock unavailable', error));
