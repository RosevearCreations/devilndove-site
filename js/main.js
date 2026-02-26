/* /js/main.js — Devil n Dove shared helpers + shared navigation
   Drop-in replacement. No global "$" to avoid collisions.
*/
(() => {
  "use strict";

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
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

      <div style="display:flex;gap:14px;flex-wrap:wrap">
        <a href="/index.html" data-nav="/">Home</a>
        <a href="/about/index.html" data-nav="/about/">About</a>
        <a href="/gallery/index.html" data-nav="/gallery/">Art</a>
        <a href="/tools/index.html" data-nav="/tools/">Tools</a>
        <a href="/supplies/index.html" data-nav="/supplies/">Supplies</a>
        <a href="/shop/index.html" data-nav="/shop/">Shop</a>
        <a href="/movies/index.html" data-nav="/movies/">Movies</a>
        <a href="/contact/index.html" data-nav="/contact/">Contact</a>
      </div>
    `;
  }

  function setActiveLink(navEl) {
    const path = (location.pathname || "/").toLowerCase();
    const links = Array.from(navEl.querySelectorAll("a[data-nav]"));

    // Pick the longest matching prefix.
    let best = null;
    let bestLen = -1;

    for (const a of links) {
      const prefix = String(a.getAttribute("data-nav") || "").toLowerCase();
      if (!prefix) continue;
      if (path === prefix || path.startsWith(prefix)) {
        if (prefix.length > bestLen) {
          best = a;
          bestLen = prefix.length;
        }
      }
    }

    if (best) best.classList.add("active");
  }

  function injectSharedNav() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    // Allow opt-out on any page: <div class="nav" data-no-shared-nav></div>
    if (nav.hasAttribute("data-no-shared-nav")) return;

    nav.innerHTML = buildSharedNav();
    setActiveLink(nav);
  }

  // Expose a tiny shared namespace (optional use in pages)
  window.DD = window.DD || {};
  window.DD.escapeHtml = escapeHtml;
  window.DD.amazonSearchUrl = amazonSearchUrl;

  document.addEventListener("DOMContentLoaded", () => {
    injectSharedNav();
  });
})();
