// Current public heading guard: an indexable/public document exposes one H1 at a time.
(() => {
  if (window.location.pathname.startsWith('/admin/')) return;
  const demoteExtras = () => {
    const headings = [...document.querySelectorAll('h1')];
    if (headings.length <= 1) return;
    headings.slice(1).forEach((h1) => {
      const h2 = document.createElement('h2');
      for (const attr of [...h1.attributes]) h2.setAttribute(attr.name, attr.value);
      while (h1.firstChild) h2.appendChild(h1.firstChild);
      h1.replaceWith(h2);
    });
    console.warn(`[DD SEO] demoted ${headings.length - 1} unexpected extra H1 element(s).`);
  };
  const run = () => demoteExtras();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  const observer = new MutationObserver(() => demoteExtras());
  const start = () => document.body && observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
