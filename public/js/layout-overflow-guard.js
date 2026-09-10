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

  const normalizeScrollRegion = (region, table) => {
    if (!region) return;
    region.classList.add('dd-horizontal-scroll-region');
    if (!region.hasAttribute('role')) region.setAttribute('role', 'region');
    if (!region.hasAttribute('tabindex')) region.setAttribute('tabindex', '0');
    if (!region.hasAttribute('aria-label')) {
      region.setAttribute('aria-label', table?.getAttribute?.('aria-label') || 'Scrollable data region');
    }
  };

  const centerShells = (root = document) => {
    root.querySelectorAll?.('.container,.admin-shell').forEach((shell) => {
      shell.classList.add('dd-centered-shell');
    });
  };

  const wrapTables = (root = document) => {
    root.querySelectorAll?.('table').forEach((table) => {
      // Existing responsive wrappers already provide bounded horizontal scrolling.
      // Normalize those wrappers so keyboard users can reach right-side columns too.
      const existing = table.closest('.dd-table-scroll,.admin-table-wrap,[data-table-scroll],.table-scroll,.table-responsive,.dd-horizontal-scroll-region');
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
    });
  };

  const run = () => {
    centerShells(document);
    wrapTables(document);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes || []) {
        if (node?.nodeType !== 1) continue;
        if (node.matches?.('.container,.admin-shell')) node.classList.add('dd-centered-shell');
        centerShells(node);
        wrapTables(node);
      }
    }
  });
  const start = () => document.body && observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
