// Current shared layout guard: centers application shells and contains wide data without changing business data or headings.
(() => {
  // The Products page has several independent admin panels. On a cold Ctrl+F5 the
  // analytics/resource panels must never hold the essential product picker/editor
  // option controls in a permanent Loading state. Load the small recovery bootstrap
  // only on that route; it remains inert everywhere else.
  const path = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (path === '/admin/products' && !document.querySelector('script[data-dd-products-cold-start]')) {
    const script = document.createElement('script');
    script.src = '/public/js/admin-products-cold-start-recovery.js?v=1';
    script.dataset.ddProductsColdStart = '1';
    document.head.appendChild(script);
  }
  if (path === '/admin/products' && !document.querySelector('script[data-dd-products-auth-ready-recovery]')) {
    const script = document.createElement('script');
    script.src = '/public/js/admin-products-auth-ready-recovery-v156.js?v=467b156-auth-ready-v2';
    script.dataset.ddProductsAuthReadyRecovery = '1';
    document.head.appendChild(script);
  }

  const TARGET_SELECTOR = 'table,.container,.admin-shell';
  const SCROLL_SELECTOR = '.dd-table-scroll,.admin-table-wrap,[data-table-scroll],.table-scroll,.table-responsive,.dd-horizontal-scroll-region';

  const normalizeScrollRegion = (region, table) => {
    if (!region) return;
    if (!region.classList.contains('dd-horizontal-scroll-region')) region.classList.add('dd-horizontal-scroll-region');
    if (!region.hasAttribute('role')) region.setAttribute('role', 'region');
    if (!region.hasAttribute('tabindex')) region.setAttribute('tabindex', '0');
    if (!region.hasAttribute('aria-label')) {
      region.setAttribute('aria-label', table?.getAttribute?.('aria-label') || 'Scrollable data region');
    }
  };

  const centerShells = (root = document) => {
    if (root?.nodeType === 1 && root.matches?.('.container,.admin-shell')) {
      if (!root.classList.contains('dd-centered-shell')) root.classList.add('dd-centered-shell');
    }
    root.querySelectorAll?.('.container,.admin-shell').forEach((shell) => {
      if (!shell.classList.contains('dd-centered-shell')) shell.classList.add('dd-centered-shell');
    });
  };

  const wrapTable = (table) => {
    if (!table?.isConnected) return;
    const existing = table.closest(SCROLL_SELECTOR);
    if (existing) {
      normalizeScrollRegion(existing, table);
      return;
    }
    const parent = table.parentElement;
    if (!parent || parent.tagName === 'BODY') return;
    const wrap = document.createElement('div');
    wrap.className = 'dd-table-scroll dd-horizontal-scroll-region';
    normalizeScrollRegion(wrap, table);
    parent.insertBefore(wrap, table);
    wrap.appendChild(table);
  };

  const wrapTables = (root = document) => {
    if (root?.nodeType === 1 && root.matches?.('table')) wrapTable(root);
    root.querySelectorAll?.('table').forEach(wrapTable);
  };

  const run = () => {
    centerShells(document);
    wrapTables(document);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  const pendingRoots = new Set();
  let scheduled = false;
  let observer = null;

  const observe = () => {
    if (document.body && observer) observer.observe(document.body, { childList: true, subtree: true });
  };

  const flush = () => {
    scheduled = false;
    const roots = Array.from(pendingRoots).filter((node) => node?.isConnected);
    pendingRoots.clear();
    if (!roots.length) return;

    // If both an ancestor and one of its descendants were added in the same render,
    // scan only the ancestor. This prevents repeated O(n) subtree scans during large
    // admin renders and keeps the observer callback below long-script thresholds.
    const rootSet = new Set(roots);
    const deduped = roots.filter((node) => {
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (rootSet.has(parent)) return false;
      }
      return true;
    });

    // Wrapping a table changes childList itself. Disconnect while applying our own
    // structural changes so the guard never schedules follow-up work caused by itself.
    observer?.disconnect();
    try {
      for (const node of deduped) {
        centerShells(node);
        wrapTables(node);
      }
    } finally {
      observe();
    }
  };

  const schedule = (node) => {
    if (!node?.matches?.(TARGET_SELECTOR) && !node?.querySelector?.(TARGET_SELECTOR)) return;
    pendingRoots.add(node);
    if (scheduled) return;
    scheduled = true;
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(flush);
    else window.setTimeout(flush, 16);
  };

  observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes || []) {
        if (node?.nodeType === 1) schedule(node);
      }
    }
  });

  const start = () => observe();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
