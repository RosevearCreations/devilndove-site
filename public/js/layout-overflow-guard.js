// Current shared layout guard: contains wide tables without changing business data or headings.
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

  const wrapTables = (root = document) => {
    root.querySelectorAll?.('table').forEach((table) => {
      if (table.closest('.dd-table-scroll,[data-table-scroll],.table-scroll,.table-responsive')) return;
      const parent = table.parentElement;
      if (!parent || parent.tagName === 'BODY') return;
      const wrap = document.createElement('div');
      wrap.className = 'dd-table-scroll';
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', table.getAttribute('aria-label') || 'Scrollable data table');
      parent.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  };
  const run = () => wrapTables(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes || []) if (node?.nodeType === 1) wrapTables(node);
    }
  });
  const start = () => document.body && observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();