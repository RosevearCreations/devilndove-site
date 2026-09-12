// Release 467 Build 126 — Admin Favorites & Quick Launch.
// Admin-only, user-scoped browser convenience state. No server/business-data persistence.
(() => {
  'use strict';
  const BUILD = 126;
  const FAVORITES_PREFIX = 'dd_admin_favorites_v1';
  const MAX_FAVORITES = 8;
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
  const clean = (value, fallback = '') => String(value ?? '').trim() || fallback;
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
  const labelForPage = () => clean(document.querySelector('h1')?.textContent, clean(document.title.split('—')[0], 'Admin tool'));

  let identity = '';
  let storageKey = '';
  let favorites = [];
  let dialog = null;
  let observer = null;
  let initialized = false;

  function identityFor(user) {
    const id = Number(user?.user_id || user?.id || 0);
    return id > 0 ? `user-${id}` : '';
  }
  function normalizeFavorites(value) {
    const rows = Array.isArray(value?.favorites) ? value.favorites : Array.isArray(value) ? value : [];
    const seen = new Set();
    return rows.filter((row) => {
      const path = normalizePath(row?.path);
      if (!path.startsWith('/admin') || path === '/admin' || seen.has(path)) return false;
      seen.add(path);
      return true;
    }).slice(0, MAX_FAVORITES).map((row) => ({
      path: normalizePath(row.path),
      label: clean(row.label, normalizePath(row.path)),
      pinned_at: clean(row.pinned_at, new Date(0).toISOString()),
    }));
  }
  function saveFavorites() {
    if (!favorites.length) return safeRemove(storageKey);
    return safeWrite(storageKey, { version: 1, favorites });
  }
  function isFavorite(path = currentPath) {
    const target = normalizePath(path);
    return favorites.some((row) => normalizePath(row.path) === target);
  }
  function dispatchChanged() {
    document.dispatchEvent(new CustomEvent('dd:admin-favorites-changed', { detail: { build: BUILD, identity, count: favorites.length } }));
  }
  function addFavorite(path = currentPath, label = labelForPage()) {
    const target = normalizePath(path);
    if (!target.startsWith('/admin') || target === '/admin') return false;
    const row = { path: target, label: clean(label, target), pinned_at: new Date().toISOString() };
    favorites = [row, ...favorites.filter((item) => normalizePath(item.path) !== target)].slice(0, MAX_FAVORITES);
    saveFavorites(); renderControls(); renderDialog(); dispatchChanged(); return true;
  }
  function removeFavorite(path = currentPath) {
    const target = normalizePath(path);
    const next = favorites.filter((item) => normalizePath(item.path) !== target);
    if (next.length === favorites.length) return false;
    favorites = next; saveFavorites(); renderControls(); renderDialog(); dispatchChanged(); return true;
  }
  function toggleCurrent() {
    if (isAdminHome) return false;
    return isFavorite(currentPath) ? removeFavorite(currentPath) : addFavorite(currentPath, labelForPage());
  }
  function clearFavorites() {
    favorites = [];
    safeRemove(storageKey);
    renderControls(); renderDialog(); dispatchChanged();
  }
  function link(label, href, className = 'btn secondary') {
    const a = document.createElement('a'); a.className = className; a.href = href; a.textContent = label; return a;
  }
  function ensureStyles() {
    if (document.getElementById('ddAdminFavoritesStyles')) return;
    const style = document.createElement('style');
    style.id = 'ddAdminFavoritesStyles';
    style.textContent = `
      .dd-admin-favorites-control{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .dd-admin-favorites-overlay[hidden]{display:none!important}
      .dd-admin-favorites-overlay{position:fixed;inset:0;z-index:99996;background:rgba(8,8,12,.72);display:grid;place-items:center;padding:16px}
      .dd-admin-favorites-dialog{width:min(620px,100%);max-height:88vh;overflow:auto;border:1px solid var(--border);border-radius:18px;background:var(--bg,#111);padding:18px;box-shadow:0 28px 80px rgba(0,0,0,.45)}
      .dd-admin-favorites-dialog h2{margin-top:0}
      .dd-admin-favorites-list{display:grid;gap:8px;margin-top:12px}
      .dd-admin-favorite-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}
      .dd-admin-favorites-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
      @media(max-width:700px){.dd-admin-favorite-row{grid-template-columns:1fr}.dd-admin-favorites-control{width:100%}}
    `;
    document.head.appendChild(style);
  }
  function closeDialog() { if (dialog) dialog.hidden = true; }
  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('div');
    dialog.className = 'dd-admin-favorites-overlay';
    dialog.dataset.ddAdminFavoritesDialog = String(BUILD);
    dialog.hidden = true;
    dialog.addEventListener('mousedown', (event) => { if (event.target === dialog) closeDialog(); });
    document.body.appendChild(dialog);
    return dialog;
  }
  function renderDialog() {
    if (!dialog) return;
    dialog.replaceChildren();
    const panel = document.createElement('section');
    panel.className = 'dd-admin-favorites-dialog';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'ddAdminFavoritesTitle');
    const heading = document.createElement('h2'); heading.id = 'ddAdminFavoritesTitle'; heading.textContent = 'Favorite Admin tools';
    const intro = document.createElement('p'); intro.className = 'small'; intro.textContent = `Keep up to ${MAX_FAVORITES} quick-launch links in this browser. Favorites are scoped to the signed-in Admin and never change Devil n Dove business data.`;
    const list = document.createElement('div'); list.className = 'dd-admin-favorites-list';
    if (!favorites.length) {
      const empty = document.createElement('span'); empty.className = 'small'; empty.textContent = 'No favorite Admin tools yet. Open a tool and choose ☆ Favorite.'; list.appendChild(empty);
    } else {
      favorites.forEach((row) => {
        const item = document.createElement('div'); item.className = 'dd-admin-favorite-row';
        const open = link(clean(row.label, row.path), row.path, 'btn secondary');
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn secondary'; remove.textContent = 'Remove'; remove.addEventListener('click', () => removeFavorite(row.path));
        item.append(open, remove); list.appendChild(item);
      });
    }
    const actions = document.createElement('div'); actions.className = 'dd-admin-favorites-actions';
    const clear = document.createElement('button'); clear.type = 'button'; clear.className = 'btn secondary'; clear.textContent = 'Clear favorites'; clear.disabled = favorites.length === 0; clear.addEventListener('click', clearFavorites);
    const close = document.createElement('button'); close.type = 'button'; close.className = 'btn'; close.textContent = 'Close'; close.addEventListener('click', closeDialog);
    actions.append(clear, close); panel.append(heading, intro, list, actions); dialog.appendChild(panel);
  }
  function openDialog() { ensureDialog(); renderDialog(); dialog.hidden = false; dialog.querySelector('a,button')?.focus(); }
  function renderControls() {
    const nav = document.querySelector('[data-dd-admin-workspace-nav]');
    if (!nav) return false;
    nav.querySelectorAll('[data-dd-admin-favorites-control]').forEach((node) => node.remove());
    const wrap = document.createElement('span'); wrap.className = 'dd-admin-favorites-control'; wrap.dataset.ddAdminFavoritesControl = String(BUILD);
    if (!isAdminHome) {
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'btn secondary'; toggle.dataset.ddAdminFavoriteToggle = String(BUILD); toggle.textContent = isFavorite(currentPath) ? '★ Favorited' : '☆ Favorite'; toggle.setAttribute('aria-pressed', isFavorite(currentPath) ? 'true' : 'false'); toggle.addEventListener('click', toggleCurrent); wrap.appendChild(toggle);
    }
    const open = document.createElement('button'); open.type = 'button'; open.className = 'btn secondary'; open.dataset.ddAdminFavoritesButton = String(BUILD); open.textContent = `Favorites (${favorites.length})`; open.addEventListener('click', openDialog); wrap.appendChild(open);
    if (isAdminHome) favorites.slice(0, 3).forEach((row) => wrap.appendChild(link(`★ ${clean(row.label, row.path)}`, row.path)));
    nav.appendChild(wrap); return true;
  }
  function waitForWorkspaceNav() {
    if (renderControls()) return;
    observer = new MutationObserver(() => { if (renderControls()) { observer?.disconnect(); observer = null; } });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => { observer?.disconnect(); observer = null; renderControls(); }, 6000);
  }
  function initialize(user) {
    if (initialized) return;
    identity = identityFor(user); if (!identity) return;
    storageKey = `${FAVORITES_PREFIX}:${identity}`;
    favorites = normalizeFavorites(safeRead(storageKey, { favorites: [] }));
    ensureStyles(); waitForWorkspaceNav(); initialized = true;
    window.DDAdminFavorites = Object.freeze({ build: BUILD, storage_scope: identity, max_favorites: MAX_FAVORITES, snapshot: () => favorites.map((row) => ({ ...row })), isFavorite, add: addFavorite, remove: removeFavorite, toggleCurrent, clear: clearFavorites, open: openDialog });
    document.dispatchEvent(new CustomEvent('dd:admin-favorites-ready', { detail: { build: BUILD, identity, count: favorites.length, current_path: currentPath } }));
  }
  document.addEventListener('dd:admin-ready', (event) => { if (event?.detail?.ok === true && event?.detail?.user) initialize(event.detail.user); });
  const existingUser = window.DDAuthUiState?.user || window.DDAuth?.getStoredUser?.();
  if (existingUser && String(existingUser.role || '').toLowerCase() === 'admin') initialize(existingUser);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dialog && !dialog.hidden) closeDialog();
    if (event.altKey && event.shiftKey && String(event.key || '').toLowerCase() === 'f' && !isAdminHome) { event.preventDefault(); toggleCurrent(); }
  });
})();
