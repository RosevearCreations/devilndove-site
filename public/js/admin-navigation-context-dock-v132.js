// Release 467 Build 132 — Admin Navigation Context Dock & Responsive Collapse.
// Client-only composition of existing Admin navigation context components; no new navigation authority.
(() => {
  'use strict';
  const BUILD = 132;
  if (!window.location.pathname.startsWith('/admin')) return;

  const SELECTORS = Object.freeze([
    '[data-dd-admin-related-tools]',
    '[data-dd-admin-section-position]',
    '[data-dd-admin-section-map]'
  ]);

  function injectStyles() {
    if (document.getElementById('ddAdminNavigationContextDockStyles')) return;
    const style = document.createElement('style');
    style.id = 'ddAdminNavigationContextDockStyles';
    style.textContent = `
      .dd-admin-navigation-context-dock{margin-top:12px;padding:0;overflow:hidden}
      .dd-admin-navigation-context-dock>summary{cursor:pointer;list-style:none;padding:12px 14px;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px}
      .dd-admin-navigation-context-dock>summary::-webkit-details-marker{display:none}
      .dd-admin-navigation-context-dock>summary::after{content:'+';font-size:1.15rem;line-height:1}
      .dd-admin-navigation-context-dock[open]>summary::after{content:'−'}
      .dd-admin-navigation-context-body{display:grid;gap:10px;padding:0 12px 12px}
      .dd-admin-navigation-context-body>[data-dd-admin-related-tools],
      .dd-admin-navigation-context-body>[data-dd-admin-section-position],
      .dd-admin-navigation-context-body>[data-dd-admin-section-map]{margin-top:0!important}
      @media(min-width:761px){.dd-admin-navigation-context-body{grid-template-columns:repeat(auto-fit,minmax(260px,1fr));align-items:start}}
      @media(max-width:760px){.dd-admin-navigation-context-dock>summary{min-height:44px}.dd-admin-navigation-context-body{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function availableComponents() {
    return SELECTORS.map((selector) => document.querySelector(selector)).filter(Boolean);
  }

  function setResponsiveDefault(details) {
    if (typeof window.matchMedia !== 'function') {
      details.open = true;
      details.dataset.ddAdminNavigationContextMode = 'expanded';
      return;
    }
    const compact = window.matchMedia('(max-width: 760px)').matches;
    details.open = !compact;
    details.dataset.ddAdminNavigationContextMode = compact ? 'compact' : 'expanded';
  }

  function ensureDock() {
    let dock = document.querySelector('[data-dd-admin-navigation-context-dock]');
    let body = dock?.querySelector('[data-dd-admin-navigation-context-body]') || null;
    const components = availableComponents();
    if (!dock) {
      if (components.length < 2) return false;
      const first = components[0];
      const parent = first.parentElement;
      if (!parent) return false;
      dock = document.createElement('details');
      dock.className = 'card dd-admin-navigation-context-dock';
      dock.dataset.ddAdminNavigationContextDock = String(BUILD);
      const summary = document.createElement('summary');
      summary.textContent = 'Navigation context';
      summary.setAttribute('aria-label', 'Show or hide Admin navigation context');
      body = document.createElement('div');
      body.className = 'dd-admin-navigation-context-body';
      body.dataset.ddAdminNavigationContextBody = String(BUILD);
      dock.append(summary, body);
      parent.insertBefore(dock, first);
      setResponsiveDefault(dock);
    }
    for (const component of components) {
      if (component.parentElement !== body) body.appendChild(component);
    }
    dock.dataset.ddAdminNavigationContextCount = String(body.children.length);
    return body.children.length >= 2;
  }

  function boot() {
    injectStyles();
    ensureDock();
    if (typeof MutationObserver !== 'function') return;
    const observer = new MutationObserver(() => ensureDock());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  for (const eventName of ['dd:admin-related-tools-ready', 'dd:admin-section-position-ready', 'dd:admin-section-map-ready']) {
    document.addEventListener(eventName, ensureDock);
  }
  window.DDAdminNavigationContextDock = Object.freeze({ build: BUILD, selectors: SELECTORS, ensureDock });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
