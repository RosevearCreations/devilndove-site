/* /js/main.js — Devil n Dove shared helpers + shared navigation/footer */
(() => {
  "use strict";

  let deferredInstallPrompt = null;

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function amazonSearchUrl(query) {
    const q = String(query ?? "").trim();
    if (!q) return "";
    return `https://www.amazon.ca/s?k=${encodeURIComponent(q)}`;
  }

  function isStandaloneMode() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function buildSharedNav() {
    return `
      <div class="brand">
        <img src="/assets/logo-clear.png" alt="Devil n Dove logo" />
        <div>
          <div style="font-weight:800;letter-spacing:.2px;line-height:1.1">Devil n Dove</div>
          <div class="small">Workshop • Art • Tools • Movies</div>
        </div>
      </div>
      <div class="links" aria-label="Primary navigation">
        <a href="/" data-nav="/">Home</a>
        <a href="/about/" data-nav="/about/">About</a>
        <a href="/gallery/" data-nav="/gallery/">Art</a>
        <a href="/creations/" data-nav="/creations/">Creations</a>
        <a href="/tools/" data-nav="/tools/">Tools</a>
        <a href="/supplies/" data-nav="/supplies/">Supplies</a>
        <a href="/shop/" data-nav="/shop/">Shop</a>
        <a href="/search/" data-nav="/search/">Search</a>
        <a href="/movies/" data-nav="/movies/">Movies</a>
        <a href="/socials/" data-nav="/socials/">Socials</a>
        <a href="/contact/" data-nav="/contact/">Contact</a>
        <a href="/cart/" data-nav="/cart/">Cart</a>
        <a href="/login/" data-nav="/login/" data-show-when-logged-out style="display:none">Login</a>
        <a href="/register/" data-nav="/register/" data-show-when-logged-out style="display:none">Register</a>
        <a href="/members/" data-nav="/members/" data-show-when-logged-in style="display:none">Members</a>
        <a href="/admin/" data-nav="/admin/" data-show-when-admin style="display:none">Admin</a>
      </div>`;
  }

  function buildSharedFooter() {
    const year = new Date().getFullYear();
    const installNote = isStandaloneMode()
      ? '<p class="small" id="ddInstallMessage">Devil n Dove is installed on this device.</p>'
      : '<p class="small" id="ddInstallMessage">Install Devil n Dove on your phone for a cleaner home-screen icon and quicker access.</p>';
    return `
      <div class="site-footer-grid">
        <div>
          <h2 class="site-footer-title">Devil n Dove</h2>
          <p class="small">Handmade jewelry, workshop creations, tools, supplies, movies, and maker-life updates from Southern Ontario.</p>
        </div>
        <div>
          <div class="site-footer-heading">Explore</div>
          <div class="site-footer-links">
            <a href="/shop/">Shop</a>
            <a href="/gallery/">Gallery</a>
            <a href="/creations/">Creations</a>
            <a href="/tools/">Tools</a>
            <a href="/supplies/">Supplies</a>
            <a href="/movies/">Movies</a>
            <a href="/socials/">Socials</a>
          </div>
        </div>
        <div>
          <div class="site-footer-heading">Member account</div>
          <div class="site-footer-links">
            <a href="/login/">Login</a>
            <a href="/register/">Register</a>
            <a href="/members/">Settings</a>
            <a href="/account-help/?mode=password">Forgot password</a>
            <a href="/account-help/?mode=email">Forgot email</a>
          </div>
        </div>
        <div>
          <div class="site-footer-heading">Search the site</div>
          <form action="/search/" class="site-footer-search" method="get" role="search">
            <input aria-label="Search Devil n Dove" name="q" placeholder="Search products, tools, supplies, art..." type="search" />
            <button class="btn" type="submit">Search</button>
          </form>
          ${installNote}
          <div class="dd-install-actions">
            <button class="btn" id="ddInstallAppButton" type="button" ${isStandaloneMode() ? 'style="display:none"' : ''}>Install app</button>
            <a class="btn" href="/socials/">Social hub</a>
          </div>
        </div>
      </div>
      <div class="site-footer-bottom small">© ${year} Devil n Dove. Built for storefront discovery, workshop sharing, and member access.</div>`;
  }

  function setActiveLink(navEl) {
    const path = (location.pathname || "/").toLowerCase();
    const links = Array.from(navEl.querySelectorAll("a[data-nav]"));
    let best = null;
    let bestLen = -1;
    for (const a of links) {
      const prefix = String(a.getAttribute("data-nav") || "").toLowerCase();
      if (!prefix) continue;
      if (path === prefix || path.startsWith(prefix)) {
        if (prefix.length > bestLen) { best = a; bestLen = prefix.length; }
      }
    }
    if (best) best.classList.add("active");
  }

  function injectSharedNav() {
    const nav = document.querySelector('.nav');
    if (!nav || nav.hasAttribute('data-no-shared-nav')) return;
    nav.innerHTML = buildSharedNav();
    setActiveLink(nav);
  }

  function injectSharedFooter() {
    const container = document.querySelector('.container') || document.body;
    let footer = document.querySelector('footer.footer, .footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'footer card';
      container.appendChild(footer);
    } else if (footer.tagName.toLowerCase() !== 'footer') {
      const replacement = document.createElement('footer');
      replacement.className = footer.className || 'footer card';
      footer.replaceWith(replacement);
      footer = replacement;
    }
    if (!footer.classList.contains('card')) footer.classList.add('card');
    footer.setAttribute('role', 'contentinfo');
    footer.innerHTML = buildSharedFooter();
  }

  function ensureHeadTag(tagName, attrs = {}) {
    const selector = Object.entries(attrs).map(([key, value]) => `[${key}="${String(value).replace(/"/g, '\\"')}"]`).join('');
    let el = selector ? document.head.querySelector(`${tagName}${selector}`) : null;
    if (!el) {
      el = document.createElement(tagName);
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function ensurePwaShell() {
    ensureHeadTag('link', { rel: 'manifest', href: '/manifest.webmanifest' });
    ensureHeadTag('meta', { name: 'theme-color', content: '#111827' });
    ensureHeadTag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    ensureHeadTag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
    ensureHeadTag('meta', { name: 'apple-mobile-web-app-title', content: 'Devil n Dove' });
    ensureHeadTag('meta', { name: 'mobile-web-app-capable', content: 'yes' });
    ensureHeadTag('link', { rel: 'apple-touch-icon', href: '/assets/icons/icon-180.png' });
    ensureHeadTag('link', { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/assets/icons/icon-192.png' });
    ensureHeadTag('link', { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/assets/icons/icon-512.png' });
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => null);
      }, { once: true });
    }
  }

  function wireInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      const button = document.getElementById('ddInstallAppButton');
      if (button) button.hidden = false;
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      const button = document.getElementById('ddInstallAppButton');
      const note = document.getElementById('ddInstallMessage');
      if (button) button.style.display = 'none';
      if (note) note.textContent = 'Devil n Dove is installed on this device.';
    });

    document.addEventListener('click', async (event) => {
      const button = event.target instanceof Element ? event.target.closest('#ddInstallAppButton') : null;
      if (!button) return;
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        try { await deferredInstallPrompt.userChoice; } catch (_) {}
        return;
      }
      const note = document.getElementById('ddInstallMessage');
      if (note) {
        note.textContent = /iphone|ipad|ipod/i.test(navigator.userAgent)
          ? 'On iPhone or iPad, open Share and choose Add to Home Screen.'
          : 'Use your browser menu and choose Install app or Add to Home Screen.';
      }
    });
  }

  function ensureGlobalScript(src) {
    if (!src || document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.body.appendChild(script);
  }

  window.DD = window.DD || {};
  window.DD.escapeHtml = escapeHtml;
  window.DD.amazonSearchUrl = amazonSearchUrl;

  document.addEventListener('DOMContentLoaded', () => {
    ensurePwaShell();
    injectSharedNav();
    injectSharedFooter();
    wireInstallPrompt();
    ensureGlobalScript('/public/js/auth.js');
    ensureGlobalScript('/public/js/site-auth-ui.js');
    ensureGlobalScript('/public/js/site-analytics.js');
  });
})();
