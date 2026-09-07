// Release 467 Build 66 — Product Workspace Split
// Presentation-only organizer for the existing Products authority. No API, D1, R2, or provider calls live here.

(() => {
  const VERSION = 'R467B66_V1';
  const WORKSPACES = Object.freeze([
    { id: 'products', label: 'Products', description: 'Catalog list, QA, pricing, offers, and product-level actions.' },
    { id: 'editor', label: 'Editor', description: 'Create or edit the shared Product record without unrelated panels competing for attention.' },
    { id: 'inventory', label: 'Inventory Links', description: 'Materials, tools, stock links, and finished-stock context for the current Product.' },
    { id: 'media', label: 'Media', description: 'Product photography, image roles, annotations, and the shared media library.' },
    { id: 'seo', label: 'SEO / Publishing', description: 'Search metadata, story notes, catalog synchronization, and publishing readiness.' },
    { id: 'cleanup', label: 'Cleanup / Archive', description: 'Duplicate cleanup, correction, archive guidance, and safe permanent removal review.' },
  ]);
  const IDS = new Set(WORKSPACES.map((row) => row.id));

  function whenReady(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  function addStyles() {
    if (document.getElementById('productWorkspaceStyles')) return;
    const style = document.createElement('style');
    style.id = 'productWorkspaceStyles';
    style.textContent = `
      .product-workspace-nav-card{margin-bottom:18px}
      .product-workspace-heading{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
      .product-workspace-authority{min-width:min(100%,320px);padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.03)}
      .product-workspace-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}
      .product-workspace-tab{width:100%;text-align:left;min-height:44px}
      .product-workspace-tab[aria-selected="true"]{outline:2px solid currentColor;outline-offset:1px}
      .product-workspace-panels{display:block}
      .product-workspace-panel[hidden]{display:none!important}
      .product-workspace-panel-head{margin-bottom:12px}
      .product-workspace-panel-head h2{margin:0 0 4px}
      .product-workspace-panel>.card:first-of-type{margin-top:0}
      .product-workspace-panel>[id$="Mount"]:empty{display:none}
      .product-workspace-panel>[id$="Mount"]:not(:empty){margin-bottom:18px}
      .product-workspace-status{margin-top:8px}
      @media (max-width:760px){
        .product-workspace-tabs{display:flex;overflow-x:auto;padding-bottom:4px;scroll-snap-type:x proximity}
        .product-workspace-tab{min-width:190px;scroll-snap-align:start}
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel(row) {
    const panel = document.createElement('section');
    panel.id = `productWorkspacePanel-${row.id}`;
    panel.className = 'product-workspace-panel';
    panel.dataset.productWorkspacePanel = row.id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `productWorkspaceTab-${row.id}`);
    panel.hidden = true;
    panel.setAttribute('inert', '');
    const head = document.createElement('div');
    head.className = 'card product-workspace-panel-head';
    head.innerHTML = `<p class="eyebrow">Product workspace</p><h2>${row.label}</h2><p class="small" style="margin:0">${row.description}</p>`;
    panel.appendChild(head);
    return panel;
  }

  whenReady(() => {
    if (document.body?.dataset?.adminPage !== 'products') return;
    const shell = document.querySelector('.admin-shell');
    if (!shell || document.getElementById('productWorkspaceNav')) return;

    addStyles();

    const hero = shell.querySelector('.hero.compact-hero, .hero');
    const footer = shell.querySelector('.footer.card, .footer');
    const navCard = document.createElement('section');
    navCard.id = 'productWorkspaceNav';
    navCard.className = 'card product-workspace-nav-card';
    navCard.innerHTML = `
      <div class="product-workspace-heading">
        <div>
          <p class="eyebrow">Release 467 Build 66</p>
          <h2 style="margin:0 0 6px">Focused Product workspaces</h2>
          <p class="small" style="margin:0">One Product authority, six focused views. Moving between views never creates a second Product record or a second data authority.</p>
        </div>
        <div class="product-workspace-authority" aria-live="polite">
          <strong>Current Product authority</strong>
          <div class="small" id="productWorkspaceAuthorityText">No Product is loaded in the editor yet.</div>
        </div>
      </div>
      <div class="product-workspace-tabs" id="productWorkspaceTabs" role="tablist" aria-label="Product workspaces"></div>
      <div class="small product-workspace-status" id="productWorkspaceStatus" aria-live="polite"></div>
    `;

    const tabs = navCard.querySelector('#productWorkspaceTabs');
    const panelsWrap = document.createElement('div');
    panelsWrap.id = 'productWorkspacePanels';
    panelsWrap.className = 'product-workspace-panels';
    const panels = new Map();

    WORKSPACES.forEach((row) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `productWorkspaceTab-${row.id}`;
      button.className = 'btn product-workspace-tab';
      button.dataset.productWorkspaceTab = row.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `productWorkspacePanel-${row.id}`);
      button.setAttribute('aria-selected', 'false');
      button.tabIndex = -1;
      button.innerHTML = `<strong>${row.label}</strong><span class="small" style="display:block;margin-top:2px">${row.description}</span>`;
      tabs.appendChild(button);
      const panel = createPanel(row);
      panels.set(row.id, panel);
      panelsWrap.appendChild(panel);
    });

    if (hero?.parentNode) hero.insertAdjacentElement('afterend', navCard);
    else shell.prepend(navCard);
    if (footer?.parentNode === shell) shell.insertBefore(panelsWrap, footer);
    else shell.appendChild(panelsWrap);

    const panel = (id) => panels.get(id);
    const move = (node, id) => {
      if (!node || !panel(id)) return false;
      panel(id).appendChild(node);
      return true;
    };
    const moveSelector = (selector, id) => move(document.querySelector(selector), id);

    // Cache the two original large cards before moving their child mounts out to focused workspaces.
    const editorCard = document.getElementById('createProductForm')?.closest('.card') || null;
    const catalogCard = document.getElementById('productsTableBody')?.closest('.card') || null;

    moveSelector('#productQualityCommandCenterMount', 'products');
    move(editorCard, 'editor');
    move(catalogCard, 'products');

    // Inventory links remain tied to the same Product id; only their presentation location changes.
    moveSelector('#productResourcesAdminMount', 'inventory');
    moveSelector('#siteInventoryAdminMount', 'inventory');
    moveSelector('#productStockReportMount', 'inventory');

    // Media systems share the existing Product media/event authority.
    moveSelector('#productMediaAdminMount', 'media');
    moveSelector('#adminProductImageAnnotationsMount', 'media');
    moveSelector('#mediaLibraryAdminMount', 'media');

    // SEO/publishing systems continue to react to dd:product-editor-target.
    moveSelector('#productStoryNotesAdminMount', 'seo');
    moveSelector('#productSeoAdminMount', 'seo');
    moveSelector('#catalogSyncAdminMount', 'seo');

    moveSelector('.product-lifecycle-guide', 'cleanup');
    moveSelector('#productCleanupCenter', 'cleanup');

    // Give the existing correction runtime a permanent Cleanup workspace target even if it loads later.
    let correctionMount = document.getElementById('productCorrectionMount');
    if (!correctionMount) {
      correctionMount = document.createElement('section');
      correctionMount.id = 'productCorrectionMount';
      correctionMount.className = 'card product-correction-card';
    }
    move(correctionMount, 'cleanup');

    const authorityText = navCard.querySelector('#productWorkspaceAuthorityText');
    const status = navCard.querySelector('#productWorkspaceStatus');
    let activeWorkspace = '';
    let currentProductId = Number(window.DDCurrentProductEditorId || 0) || 0;
    let currentProductName = '';
    let pendingCorrectionTimer = 0;

    function renderAuthority(detail = null) {
      const product = detail?.product || detail || null;
      const detailId = Number(detail?.product_id || product?.product_id || product?.id || 0) || 0;
      if (detailId) currentProductId = detailId;
      const nextName = String(product?.name || product?.title || '').trim();
      if (nextName) currentProductName = nextName;
      if (!authorityText) return;
      if (!currentProductId) {
        authorityText.textContent = 'No Product is loaded in the editor yet.';
        return;
      }
      authorityText.textContent = `Product #${currentProductId}${currentProductName ? ` — ${currentProductName}` : ''}. This same Product id is shared by Editor, Inventory Links, Media, SEO / Publishing, and Cleanup / Archive.`;
    }

    function normalizeWorkspace(value) {
      const key = String(value || '').trim().toLowerCase();
      return IDS.has(key) ? key : 'products';
    }

    function urlWorkspace() {
      try {
        const url = new URL(window.location.href);
        return normalizeWorkspace(url.searchParams.get('workspace'));
      } catch {
        return 'products';
      }
    }

    function writeWorkspaceToUrl(id, mode) {
      if (!window.history?.replaceState) return;
      const url = new URL(window.location.href);
      if (id === 'products') url.searchParams.delete('workspace');
      else url.searchParams.set('workspace', id);
      const next = `${url.pathname}${url.search}${url.hash}`;
      if (mode === 'push' && window.history.pushState) window.history.pushState({ productWorkspace: id }, '', next);
      else window.history.replaceState({ productWorkspace: id }, '', next);
    }

    function activate(id, { historyMode = 'replace', focus = false, announce = true } = {}) {
      const next = normalizeWorkspace(id);
      const previous = activeWorkspace;
      WORKSPACES.forEach((row) => {
        const target = panels.get(row.id);
        const tab = navCard.querySelector(`[data-product-workspace-tab="${row.id}"]`);
        const selected = row.id === next;
        if (target) {
          target.hidden = !selected;
          if (selected) target.removeAttribute('inert');
          else target.setAttribute('inert', '');
        }
        if (tab) {
          tab.setAttribute('aria-selected', selected ? 'true' : 'false');
          tab.tabIndex = selected ? 0 : -1;
        }
      });
      activeWorkspace = next;
      writeWorkspaceToUrl(next, historyMode);
      const row = WORKSPACES.find((item) => item.id === next);
      if (status && announce) status.textContent = `${row?.label || 'Products'} workspace active.`;
      if (focus) navCard.querySelector(`[data-product-workspace-tab="${next}"]`)?.focus();
      if (previous !== next) {
        document.dispatchEvent(new CustomEvent('dd:product-workspace-changed', {
          detail: { workspace: next, previous_workspace: previous || null, product_id: currentProductId || 0 },
        }));
      }
      return next;
    }

    tabs?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-product-workspace-tab]');
      if (!button) return;
      activate(button.dataset.productWorkspaceTab, { historyMode: 'push', focus: false });
    });

    tabs?.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const buttons = [...tabs.querySelectorAll('[data-product-workspace-tab]')];
      if (!buttons.length) return;
      const current = Math.max(0, buttons.indexOf(document.activeElement));
      let next = current;
      if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      event.preventDefault();
      activate(buttons[next].dataset.productWorkspaceTab, { historyMode: 'push', focus: true });
    });

    window.addEventListener('popstate', () => activate(urlWorkspace(), { historyMode: 'none', announce: true }));

    // Direct table actions route the operator to the workspace that owns the visible follow-through.
    document.addEventListener('click', (event) => {
      const correction = event.target.closest('[data-open-product-correction]');
      if (correction) {
        if (pendingCorrectionTimer) window.clearTimeout(pendingCorrectionTimer);
        pendingCorrectionTimer = window.setTimeout(() => {
          pendingCorrectionTimer = 0;
          activate('cleanup', { historyMode: 'push' });
          document.getElementById('productCorrectionMount')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        return;
      }
      const edit = event.target.closest('[data-edit-product-id]');
      if (edit) activate('editor', { historyMode: 'push' });
    });

    document.addEventListener('dd:product-editor-target', (event) => renderAuthority(event?.detail || null));
    document.addEventListener('dd:product-created', (event) => renderAuthority(event?.detail || null));
    document.addEventListener('dd:product-updated', (event) => renderAuthority(event?.detail || null));
    document.addEventListener('dd:product-autosaved-new', (event) => renderAuthority(event?.detail || null));
    document.addEventListener('dd:product-deleted', (event) => {
      const deleted = Number(event?.detail?.product_id || event?.detail?.product?.product_id || 0) || 0;
      if (deleted && deleted === currentProductId) {
        currentProductId = 0;
        currentProductName = '';
        renderAuthority();
      }
      activate('cleanup', { historyMode: 'replace' });
    });
    document.addEventListener('dd:product-archived', (event) => {
      renderAuthority(event?.detail || null);
      activate('cleanup', { historyMode: 'replace' });
    });

    renderAuthority();
    activate(urlWorkspace(), { historyMode: 'replace', announce: false });

    window.DDProductWorkspaces = Object.freeze({
      version: VERSION,
      workspaces: WORKSPACES.map((row) => Object.freeze({ ...row })),
      open: (id) => activate(id, { historyMode: 'push' }),
      snapshot: () => Object.freeze({
        version: VERSION,
        workspace: activeWorkspace,
        product_id: currentProductId || 0,
        product_name: currentProductName || '',
      }),
    });
  });
})();
