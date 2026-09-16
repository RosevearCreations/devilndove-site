// Release 467 Build 161 — Universal Search, Recent Work & Command Centre QoL.
// Browser-local recents/favourites are navigation aids only; live records remain owned by their existing authorities.
(() => {
  'use strict';
  if (!String(window.location.pathname || '').startsWith('/admin/')) return;

  const VERSION = 'R467B161_UNIVERSAL_SEARCH_QOL_V1';
  const MANIFEST_URL = '/data/admin-navigation-modules.json';
  const SEARCH_URL = '/api/admin/universal-search';
  const RECENT_KEY = 'dd_admin_recent_work_v161';
  const FAV_KEY = 'dd_admin_favourites_v161';
  const MAX_RECENT = 12;
  const MAX_FAV = 16;
  const state = { manifest: null, nav: [], recent: [], favourites: [], dynamic: [], query: '', open: false, active: 0, seq: 0 };
  window.DDAdminUniversalSearchV161 = { version: VERSION, state };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeAdminPath = (value) => {
    try {
      const url = new URL(String(value || ''), window.location.origin);
      return url.origin === window.location.origin && url.pathname.startsWith('/admin/') ? `${url.pathname}${url.search}${url.hash}` : '';
    } catch { return ''; }
  };
  const readStore = (key) => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
  };
  const writeStore = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const pageLabel = () => String(document.querySelector('h1')?.textContent || document.title || 'Admin').replace(/\s*[—|]\s*Devil n Dove.*$/i, '').trim().slice(0, 100) || 'Admin';
  const currentPath = () => `${window.location.pathname}${window.location.search}`;

  function rememberCurrent() {
    const href = safeAdminPath(currentPath());
    if (!href || /(?:^|[?&])dd_return=/.test(href)) {
      const clean = `${window.location.pathname}${new URLSearchParams([...new URLSearchParams(window.location.search)].filter(([key]) => !key.startsWith('dd_'))).toString() ? `?${new URLSearchParams([...new URLSearchParams(window.location.search)].filter(([key]) => !key.startsWith('dd_'))).toString()}` : ''}`;
      if (safeAdminPath(clean)) remember(clean);
      return;
    }
    remember(href);
  }
  function remember(href) {
    const safe = safeAdminPath(href);
    if (!safe) return;
    const key = new URL(safe, window.location.origin).pathname;
    const next = [{ href: safe, key, label: pageLabel(), at: new Date().toISOString() }, ...readStore(RECENT_KEY).filter((row) => String(row?.key || '') !== key)].slice(0, MAX_RECENT);
    state.recent = next;
    writeStore(RECENT_KEY, next);
  }

  function loadSaved() {
    state.recent = readStore(RECENT_KEY).filter((row) => safeAdminPath(row?.href)).slice(0, MAX_RECENT);
    state.favourites = readStore(FAV_KEY).filter((row) => safeAdminPath(row?.href)).slice(0, MAX_FAV);
  }
  function favouriteKey(href) { try { return new URL(href, window.location.origin).pathname; } catch { return ''; } }
  function isFavourite(href) { const key = favouriteKey(href); return state.favourites.some((row) => row.key === key); }
  function toggleFavourite(href, label = '') {
    const safe = safeAdminPath(href);
    if (!safe) return;
    const key = favouriteKey(safe);
    const existing = state.favourites.find((row) => row.key === key);
    state.favourites = existing
      ? state.favourites.filter((row) => row.key !== key)
      : [{ href: safe, key, label: String(label || key).trim().slice(0, 100), at: new Date().toISOString() }, ...state.favourites].slice(0, MAX_FAV);
    writeStore(FAV_KEY, state.favourites);
    renderSaved();
    renderResults();
    renderCommandCentre();
  }

  function returnWrapped(href) {
    const safe = safeAdminPath(href);
    if (!safe) return href;
    try {
      const target = new URL(safe, window.location.origin);
      const current = `${window.location.pathname}${window.location.search}`;
      if (target.pathname !== window.location.pathname) {
        target.searchParams.set('dd_return', current);
        target.searchParams.set('dd_return_label', pageLabel());
      }
      return `${target.pathname}${target.search}${target.hash}`;
    } catch { return safe; }
  }

  function flattenManifest(data) {
    const items = [];
    for (const module of Array.isArray(data?.modules) ? data.modules : []) {
      if (module?.href) items.push({ type:'Workspace', area:module.label || module.key || 'Workspace', label:module.label || module.key || 'Workspace', detail:module.summary || '', href:module.href });
      for (const section of Array.isArray(module?.sections) ? module.sections : []) {
        for (const link of Array.isArray(section?.links) ? section.links : []) {
          if (!link?.href) continue;
          items.push({ type:'Navigation', area:module.label || module.key || 'Admin', label:link.label || link.href, detail:section.label || '', href:link.href });
        }
      }
    }
    const seen = new Set();
    return items.filter((item) => { const key = safeAdminPath(item.href); if (!key || seen.has(key)) return false; seen.add(key); return true; });
  }

  function ensureUI() {
    if (document.getElementById('ddAdminUniversalSearch161')) return;
    const root = document.createElement('div');
    root.id = 'ddAdminUniversalSearch161';
    root.innerHTML = `
      <button class="dd-v161-launcher" type="button" aria-haspopup="dialog" aria-controls="ddV161Palette"><span>⌕</span><span>Search</span><kbd>Ctrl K</kbd></button>
      <div id="ddV161Return"></div>
      <div class="dd-v161-overlay" id="ddV161Palette" role="dialog" aria-modal="true" aria-labelledby="ddV161Title" hidden>
        <div class="dd-v161-panel">
          <div class="dd-v161-head"><div><strong id="ddV161Title">Universal Admin Search</strong><div class="small">Products, SKU, references, workspaces, recent work and favourites</div></div><button type="button" class="dd-v161-close" aria-label="Close search">×</button></div>
          <label class="dd-v161-search-label" for="ddV161Input">Search</label>
          <input id="ddV161Input" class="dd-v161-input" type="search" autocomplete="off" placeholder="Name, SKU, order/reference, tool, project, page…"/>
          <div class="dd-v161-current"><button id="ddV161FavouriteCurrent" type="button" class="btn secondary"></button><a class="btn secondary" href="/admin/command-center/">Command Centre</a></div>
          <div id="ddV161Saved"></div>
          <div id="ddV161Results" class="dd-v161-results" role="listbox" aria-live="polite"></div>
          <div class="dd-v161-foot"><span>↑↓ move</span><span>Enter open</span><span>Esc close</span><span>/ or Ctrl/⌘ K search</span></div>
        </div>
      </div>`;
    document.body.appendChild(root);
    root.querySelector('.dd-v161-launcher')?.addEventListener('click', openPalette);
    root.querySelector('.dd-v161-close')?.addEventListener('click', closePalette);
    root.querySelector('.dd-v161-overlay')?.addEventListener('click', (event) => { if (event.target === event.currentTarget) closePalette(); });
    document.getElementById('ddV161FavouriteCurrent')?.addEventListener('click', () => toggleFavourite(window.location.pathname, pageLabel()));
    document.getElementById('ddV161Input')?.addEventListener('input', onInput);
    renderReturn();
    renderSaved();
    renderResults();
  }

  function renderReturn() {
    const mount = document.getElementById('ddV161Return');
    if (!mount) return;
    const params = new URLSearchParams(window.location.search);
    const back = safeAdminPath(params.get('dd_return') || '');
    if (!back || new URL(back, window.location.origin).pathname === window.location.pathname) { mount.innerHTML = ''; return; }
    const label = String(params.get('dd_return_label') || 'previous workspace').slice(0, 80);
    mount.innerHTML = `<a class="dd-v161-return" href="${esc(back)}">← Return to ${esc(label)}</a>`;
  }

  function renderSaved() {
    const mount = document.getElementById('ddV161Saved');
    const favButton = document.getElementById('ddV161FavouriteCurrent');
    if (favButton) favButton.textContent = isFavourite(window.location.pathname) ? '★ Remove current favourite' : '☆ Favourite current page';
    if (!mount) return;
    const fav = state.favourites.slice(0, 5);
    const recent = state.recent.filter((row) => favouriteKey(row.href) !== window.location.pathname).slice(0, 5);
    const chips = (rows, kind) => rows.map((row) => `<a class="dd-v161-chip" data-dd-v161-open="1" href="${esc(returnWrapped(row.href))}" title="${esc(kind)}">${kind === 'Favourite' ? '★' : '↺'} ${esc(row.label || row.key)}</a>`).join('');
    mount.innerHTML = `<div class="dd-v161-saved"><div><strong>Favourites</strong><div class="dd-v161-chips">${fav.length ? chips(fav,'Favourite') : '<span class="small">No favourites yet.</span>'}</div></div><div><strong>Recent work</strong><div class="dd-v161-chips">${recent.length ? chips(recent,'Recent') : '<span class="small">Recent admin pages appear here.</span>'}</div></div></div>`;
  }

  function localMatches(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return state.nav.slice(0, 12);
    return state.nav.filter((item) => `${item.label} ${item.area} ${item.detail}`.toLowerCase().includes(q)).slice(0, 14);
  }
  function combinedResults() {
    const rows = [];
    for (const item of localMatches(state.query)) rows.push({ ...item, source:'navigation' });
    for (const item of state.dynamic) rows.push({ ...item, type:item.kind || 'Record', source:'live' });
    const seen = new Set();
    return rows.filter((item) => { const key = `${item.source}:${item.href}:${item.label}`; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 28);
  }

  function renderResults() {
    const mount = document.getElementById('ddV161Results');
    if (!mount) return;
    const rows = combinedResults();
    state.active = Math.max(0, Math.min(state.active, Math.max(0, rows.length - 1)));
    if (!rows.length) {
      mount.innerHTML = `<div class="dd-v161-empty">${state.query ? 'No matching workspaces or live records.' : 'Type to search all admin workspaces and current records.'}</div>`;
      return;
    }
    mount.innerHTML = rows.map((item, index) => {
      const favourite = isFavourite(item.href);
      const href = returnWrapped(item.href);
      return `<div class="dd-v161-row${index === state.active ? ' is-active' : ''}" data-index="${index}"><a data-dd-v161-open="1" class="dd-v161-row-main" href="${esc(href)}"><span class="dd-v161-kind">${esc(item.type || item.kind || item.area || 'Admin')}</span><span><strong>${esc(item.label || 'Open')}</strong><small>${esc(item.detail || item.area || '')}</small></span></a><button type="button" class="dd-v161-star" data-fav-href="${esc(item.href)}" data-fav-label="${esc(item.label || '')}" aria-label="${favourite ? 'Remove favourite' : 'Add favourite'}">${favourite ? '★' : '☆'}</button></div>`;
    }).join('');
    mount.querySelectorAll('[data-index]').forEach((row) => row.addEventListener('mouseenter', () => { state.active = Number(row.dataset.index || 0); renderResults(); }));
    mount.querySelectorAll('[data-fav-href]').forEach((button) => button.addEventListener('click', () => toggleFavourite(button.dataset.favHref, button.dataset.favLabel)));
  }

  async function liveSearch(query, seq) {
    if (query.trim().length < 2) { state.dynamic = []; renderResults(); return; }
    try {
      const url = `${SEARCH_URL}?q=${encodeURIComponent(query.trim())}&limit=30`;
      const response = window.DDAuth?.apiFetch ? await window.DDAuth.apiFetch(url, { method:'GET', cache:'no-store' }) : await fetch(url, { credentials:'same-origin', cache:'no-store' });
      const data = await response.json().catch(() => ({}));
      if (seq !== state.seq) return;
      state.dynamic = response.ok && data?.ok && Array.isArray(data.results) ? data.results : [];
    } catch { if (seq === state.seq) state.dynamic = []; }
    if (seq === state.seq) renderResults();
  }

  let searchTimer = 0;
  function onInput(event) {
    state.query = String(event.target.value || '');
    state.active = 0;
    state.dynamic = [];
    renderResults();
    window.clearTimeout(searchTimer);
    const seq = ++state.seq;
    searchTimer = window.setTimeout(() => void liveSearch(state.query, seq), 180);
  }

  function openPalette(prefill = '') {
    const overlay = document.getElementById('ddV161Palette');
    const input = document.getElementById('ddV161Input');
    if (!overlay || !input) return;
    overlay.hidden = false;
    state.open = true;
    if (prefill !== undefined) { input.value = String(prefill || ''); state.query = input.value; state.dynamic = []; state.active = 0; }
    renderSaved(); renderResults(); renderCommandCentre();
    window.setTimeout(() => { input.focus(); input.select(); }, 0);
  }
  function closePalette() {
    const overlay = document.getElementById('ddV161Palette');
    if (overlay) overlay.hidden = true;
    state.open = false;
  }
  function openActive() {
    const rows = combinedResults();
    const row = rows[state.active];
    if (row?.href) window.location.assign(returnWrapped(row.href));
  }

  function renderCommandCentre() {
    const mount = document.getElementById('universalCommandCentreMount');
    if (!mount) return;
    const fav = state.favourites.slice(0, 6);
    const recent = state.recent.slice(0, 6);
    const links = (rows, empty) => rows.length ? rows.map((row) => `<a data-dd-v161-open="1" class="btn secondary" href="${esc(returnWrapped(row.href))}">${esc(row.label || row.key)}</a>`).join('') : `<span class="small">${esc(empty)}</span>`;
    mount.innerHTML = `<section class="card dd-v161-command-card"><div class="dd-v161-command-title"><div><p class="eyebrow">Release 467 Build 161</p><h2>Universal Search, Recent Work & Favourites</h2><p class="small">The navigation manifest remains the route authority. Live record search is read-only and bounded; recent work and favourites stay in this browser.</p></div><button class="btn" id="ddV161CommandOpen" type="button">Open universal search</button></div><div class="dd-v161-command-grid"><div><strong>Favourites</strong><div class="dd-v161-command-links">${links(fav,'Favourite a workspace to pin it here.')}</div></div><div><strong>Recent work</strong><div class="dd-v161-command-links">${links(recent,'Open admin workspaces and they will appear here.')}</div></div></div></section>`;
    document.getElementById('ddV161CommandOpen')?.addEventListener('click', () => openPalette(''));
  }

  async function loadManifest() {
    try {
      const response = await fetch(MANIFEST_URL, { cache:'no-store', credentials:'same-origin' });
      const data = await response.json();
      if (!response.ok || !data) throw new Error('Navigation unavailable');
      state.manifest = data;
      state.nav = flattenManifest(data);
    } catch { state.nav = [{ type:'Workspace', area:'Admin', label:'Admin Dashboard', detail:'Main administration home', href:'/admin/' }, { type:'Workspace', area:'I.T.', label:'Command Centre', detail:'Admin command centre', href:'/admin/command-center/' }]; }
    renderResults(); renderCommandCentre();
  }

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'k') { event.preventDefault(); state.open ? closePalette() : openPalette(''); return; }
    if (!typing && event.key === '/') { event.preventDefault(); openPalette(''); return; }
    if (!state.open) return;
    if (event.key === 'Escape') { event.preventDefault(); closePalette(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); state.active = Math.min(state.active + 1, Math.max(0, combinedResults().length - 1)); renderResults(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); state.active = Math.max(0, state.active - 1); renderResults(); }
    else if (event.key === 'Enter' && document.activeElement?.id === 'ddV161Input') { event.preventDefault(); openActive(); }
  });

  const start = () => {
    loadSaved();
    rememberCurrent();
    ensureUI();
    renderCommandCentre();
    void loadManifest();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
