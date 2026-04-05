/* /js/main.js — Devil n Dove shared helpers + shared navigation/footer */
(() => {
  "use strict";

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
        <a href="/index.html" data-nav="/">Home</a>
        <a href="/about/index.html" data-nav="/about/">About</a>
        <a href="/gallery/index.html" data-nav="/gallery/">Art</a>
        <a href="/creations/index.html" data-nav="/creations/">Creations</a>
        <a href="/tools/index.html" data-nav="/tools/">Tools</a>
        <a href="/supplies/index.html" data-nav="/supplies/">Supplies</a>
        <a href="/shop/index.html" data-nav="/shop/">Shop</a>
        <a href="/search/index.html" data-nav="/search/">Search</a>
        <a href="/movies/index.html" data-nav="/movies/">Movies</a>
        <a href="/contact/index.html" data-nav="/contact/">Contact</a>
        <a href="/cart/index.html" data-nav="/cart/">Cart</a>
        <a href="/login/index.html" data-nav="/login/" data-show-when-logged-out style="display:none">Login</a>
        <a href="/register/index.html" data-nav="/register/" data-show-when-logged-out style="display:none">Register</a>
        <a href="/members/index.html" data-nav="/members/" data-show-when-logged-in style="display:none">Members</a>
        <a href="/admin/index.html" data-nav="/admin/" data-show-when-admin style="display:none">Admin</a>
      </div>`;
  }

  function buildSharedFooter() {
    const year = new Date().getFullYear();
    return `
      <div class="site-footer-grid">
        <div>
          <h2 class="site-footer-title">Devil n Dove</h2>
          <p class="small">Handmade jewelry, workshop creations, tools, supplies, movies, and maker-life updates from Southern Ontario.</p>
        </div>
        <div>
          <div class="site-footer-heading">Explore</div>
          <div class="site-footer-links">
            <a href="/shop/index.html">Shop</a>
            <a href="/gallery/index.html">Gallery</a>
            <a href="/creations/index.html">Creations</a>
            <a href="/tools/index.html">Tools</a>
            <a href="/supplies/index.html">Supplies</a>
            <a href="/movies/index.html">Movies</a>
          </div>
        </div>
        <div>
          <div class="site-footer-heading">Member account</div>
          <div class="site-footer-links">
            <a href="/login/index.html">Login</a>
            <a href="/register/index.html">Register</a>
            <a href="/members/index.html">Settings</a>
            <a href="/account-help/index.html?mode=password">Forgot password</a>
            <a href="/account-help/index.html?mode=email">Forgot email</a>
          </div>
        </div>
        <div>
          <div class="site-footer-heading">Search the site</div>
          <form action="/search/index.html" class="site-footer-search" method="get" role="search">
            <input aria-label="Search Devil n Dove" name="q" placeholder="Search products, tools, supplies, art..." type="search" />
            <button class="btn" type="submit">Search</button>
          </form>
          <p class="small">Search stays visible in the footer on every public page to improve discovery and crawl paths.</p>
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
    injectSharedNav();
    injectSharedFooter();
    ensureGlobalScript('/public/js/auth.js');
    ensureGlobalScript('/public/js/site-auth-ui.js');
    ensureGlobalScript('/public/js/site-analytics.js');
  });
})();
