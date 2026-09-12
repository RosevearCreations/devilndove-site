// Release 467 Build 128 — Admin Navigation Help & Keyboard Shortcut Reference.
// Client-only discoverability layer over existing Admin navigation contracts. No saved state or network write.
(() => {
  'use strict';
  const BUILD = 128;
  if (!window.location.pathname.startsWith('/admin')) return;

  let overlay = null;
  let lastFocus = null;
  let observer = null;

  function ensureStyles() {
    if (document.getElementById('ddAdminNavigationHelpStyles')) return;
    const style = document.createElement('style');
    style.id = 'ddAdminNavigationHelpStyles';
    style.textContent = `
      .dd-admin-nav-help-trigger{white-space:nowrap}
      .dd-admin-nav-help-overlay[hidden]{display:none!important}
      .dd-admin-nav-help-overlay{position:fixed;inset:0;z-index:99998;background:rgba(8,8,12,.74);display:grid;place-items:center;padding:16px}
      .dd-admin-nav-help-dialog{width:min(720px,100%);max-height:88vh;overflow:auto;border:1px solid var(--border);border-radius:18px;background:var(--bg,#111);padding:20px;box-shadow:0 28px 80px rgba(0,0,0,.45)}
      .dd-admin-nav-help-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
      .dd-admin-nav-help-head h2{margin:0}
      .dd-admin-nav-help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}
      .dd-admin-nav-help-item{border:1px solid var(--border);border-radius:14px;padding:14px;background:rgba(255,255,255,.025)}
      .dd-admin-nav-help-item strong{display:block;margin-bottom:5px}
      .dd-admin-nav-help-key{display:inline-block;font:inherit;font-weight:800;border:1px solid var(--border);border-radius:8px;padding:2px 7px;margin-right:5px;background:rgba(255,255,255,.06)}
      .dd-admin-nav-help-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}
      body.dd-admin-nav-help-open{overflow:hidden}
      @media(max-width:700px){.dd-admin-nav-help-grid{grid-template-columns:1fr}.dd-admin-nav-help-head{display:grid}.dd-admin-nav-help-dialog{max-height:calc(100vh - 24px)}}
    `;
    document.head.appendChild(style);
  }

  function keyBadge(text) {
    const span = document.createElement('span');
    span.className = 'dd-admin-nav-help-key';
    span.textContent = text;
    return span;
  }

  function helpItem(title, description, keys = []) {
    const item = document.createElement('div');
    item.className = 'dd-admin-nav-help-item';
    const strong = document.createElement('strong');
    strong.textContent = title;
    item.appendChild(strong);
    if (keys.length) {
      const keyRow = document.createElement('div');
      keyRow.style.marginBottom = '7px';
      keys.forEach((key) => keyRow.appendChild(keyBadge(key)));
      item.appendChild(keyRow);
    }
    const note = document.createElement('div');
    note.className = 'small';
    note.textContent = description;
    item.appendChild(note);
    return item;
  }

  function focusable() {
    if (!overlay || overlay.hidden) return [];
    return [...overlay.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
      .filter((node) => !node.disabled && node.getAttribute('aria-hidden') !== 'true');
  }

  function closeHelp() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('dd-admin-nav-help-open');
    const restore = lastFocus;
    lastFocus = null;
    if (restore && typeof restore.focus === 'function') restore.focus();
  }

  function createDialog() {
    if (overlay) return overlay;
    ensureStyles();
    overlay = document.createElement('div');
    overlay.className = 'dd-admin-nav-help-overlay';
    overlay.dataset.ddAdminNavigationHelp = String(BUILD);
    overlay.hidden = true;
    overlay.addEventListener('mousedown', (event) => { if (event.target === overlay) closeHelp(); });

    const dialog = document.createElement('section');
    dialog.className = 'dd-admin-nav-help-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'ddAdminNavigationHelpTitle');
    dialog.setAttribute('aria-describedby', 'ddAdminNavigationHelpIntro');

    const head = document.createElement('div');
    head.className = 'dd-admin-nav-help-head';
    const titleWrap = document.createElement('div');
    const title = document.createElement('h2');
    title.id = 'ddAdminNavigationHelpTitle';
    title.textContent = 'Admin navigation help';
    const intro = document.createElement('p');
    intro.id = 'ddAdminNavigationHelpIntro';
    intro.className = 'small';
    intro.textContent = 'These controls reuse the existing Admin navigation features. This help panel does not change business data or create a new navigation authority.';
    titleWrap.append(title, intro);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn secondary';
    close.textContent = 'Close';
    close.addEventListener('click', closeHelp);
    head.append(titleWrap, close);

    const grid = document.createElement('div');
    grid.className = 'dd-admin-nav-help-grid';
    grid.append(
      helpItem('Jump to any Admin tool', 'Open the Build 122 command palette, then type a workspace, section, or tool name. Use arrow keys to choose a result and Enter to open it.', ['Ctrl/Cmd + K']),
      helpItem('Favorite the current tool', 'On a non-home Admin page, toggle the current tool in your Build 126 browser favorites. The Favorites button in the workspace navigation opens the quick-launch list.', ['Alt + Shift + F']),
      helpItem('Workspace memory', 'Build 125 can remember the most recent Admin workspace for the signed-in Admin in this browser. Its resume shortcut appears from Admin home when workspace memory is enabled.'),
      helpItem('Context breadcrumbs', 'Build 127 shows Admin → workspace → section → current tool when the route is in the shared Admin navigation manifest. Nested tools also receive a direct workspace-return link.'),
      helpItem('Open this navigation help', 'Use the Help button in the shared Admin workspace navigation or the keyboard shortcut from any Admin route.', ['Alt + Shift + H']),
      helpItem('Close dialogs safely', 'Escape closes this help dialog and the existing Admin navigation dialogs. Focus returns to the control that opened this panel.', ['Esc'])
    );

    const foot = document.createElement('div');
    foot.className = 'dd-admin-nav-help-foot small';
    const note = document.createElement('span');
    note.textContent = 'Navigation help is read-only and keeps the existing Admin navigation layers independent.';
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'btn';
    done.textContent = 'Done';
    done.addEventListener('click', closeHelp);
    foot.append(note, done);

    dialog.append(head, grid, foot);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    return overlay;
  }

  function openHelp(opener = document.activeElement) {
    createDialog();
    lastFocus = opener && typeof opener.focus === 'function' ? opener : document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('dd-admin-nav-help-open');
    window.setTimeout(() => overlay.querySelector('button')?.focus(), 0);
  }

  function ensureTrigger() {
    const nav = document.querySelector('[data-dd-admin-workspace-nav]');
    if (!nav) return false;
    if (nav.querySelector('[data-dd-admin-navigation-help-trigger]')) return true;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn secondary dd-admin-nav-help-trigger';
    button.dataset.ddAdminNavigationHelpTrigger = String(BUILD);
    button.textContent = 'Navigation help';
    button.title = 'Admin navigation help (Alt+Shift+H)';
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => openHelp(button));
    nav.appendChild(button);
    return true;
  }

  function installTrigger() {
    if (ensureTrigger()) return;
    observer = new MutationObserver(() => {
      if (ensureTrigger()) {
        observer?.disconnect();
        observer = null;
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => { observer?.disconnect(); observer = null; ensureTrigger(); }, 6000);
  }

  document.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();
    if (event.altKey && event.shiftKey && key === 'h') {
      event.preventDefault();
      openHelp(document.activeElement);
      return;
    }
    if (!overlay || overlay.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeHelp();
      return;
    }
    if (event.key === 'Tab') {
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  createDialog();
  installTrigger();
  window.DDAdminNavigationHelp = Object.freeze({ build: BUILD, open: openHelp, close: closeHelp });
  document.dispatchEvent(new CustomEvent('dd:admin-navigation-help-ready', { detail: { build: BUILD } }));
})();
