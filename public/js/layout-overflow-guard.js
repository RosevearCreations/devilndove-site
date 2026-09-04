// Current shared layout guard: contains wide tables without changing business data or headings.
(() => {
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
