// File: /public/js/trust-block-context.js
// Brief description: Loads approved public trust blocks by page/context with safe empty fallback.

(function () {
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }
  function contextFromPath() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/shop') return 'shop';
    if (path === '/creations') return 'creations';
    if (path === '/gift-cards') return 'gift-cards';
    if (path === '/gallery') return 'gallery';
    if (path === '/about') return 'about';
    if (path === '/shop/product') return 'product';
    return path === '/' ? 'sitewide' : path.replace(/^\//, '');
  }
  function ensureMount() {
    let mount = document.querySelector('[data-trust-block-context-mount]');
    if (mount) return mount;
    const container = document.querySelector('.container');
    if (!container) return null;
    mount = document.createElement('section');
    mount.className = 'card public-trust-context-card';
    mount.setAttribute('data-trust-block-context-mount', '');
    const footer = container.querySelector('.footer');
    if (footer) container.insertBefore(mount, footer);
    else container.appendChild(mount);
    return mount;
  }
  async function load() {
    const mount = ensureMount();
    if (!mount) return;
    const context = mount.getAttribute('data-context') || contextFromPath();
    try {
      const res = await fetch(`/api/trust-blocks?context=${encodeURIComponent(context)}&limit=3`, { headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => null);
      const items = Array.isArray(data?.items) ? data.items : [];
      if (!items.length) { mount.style.display = 'none'; return; }
      mount.style.display = '';
      mount.innerHTML = `<h2 style="margin-top:0">Why shoppers can feel safer here</h2><div class="public-trust-context-grid">${items.map((item) => `<article class="public-trust-context-item"><strong>${esc(item.title || 'Trust note')}</strong><p class="small">${esc(item.body || '')}</p>${item.attribution_label ? `<div class="small">— ${esc(item.attribution_label)}${item.rating_label ? ` • ${esc(item.rating_label)}` : ''}</div>` : ''}</article>`).join('')}</div>`;
    } catch {
      mount.style.display = 'none';
    }
  }
  document.addEventListener('DOMContentLoaded', load);
})();
