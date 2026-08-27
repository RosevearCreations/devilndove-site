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

  function getDefaultFooterSocialRows() {
    return [
      { key: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@devilndove345', handle: '@devilndove345' },
      { key: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/devilndove', handle: '@devilndove' },
      { key: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@devilanddove', handle: '@devilanddove' },
      { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/DevilnDoveOnline', handle: 'DevilnDoveOnline' },
      { key: 'x', label: 'X', url: 'https://x.com/DevilnDove', handle: '@DevilnDove' },
      { key: 'patreon', label: 'Patreon', url: 'https://patreon.com/DevilnDove', handle: 'patreon.com/DevilnDove' },
      { key: 'buymeacoffee', label: 'Buy Me a Coffee', url: 'https://buymeacoffee.com/devilndovel', handle: 'buymeacoffee.com/devilndovel' }
    ];
  }

  function socialLinksMarkup(rows, { includeHub = true, includeStatus = false } = {}) {
    const safeRows = Array.isArray(rows) ? rows.filter((row) => row && row.url) : [];
    const parts = [];
    if (includeHub) parts.push('<a href="/socials/index.html">Social hub</a>');
    parts.push(...safeRows.map((row) => `<a href="${escapeHtml(row.url || '/socials/index.html')}" rel="noopener" target="_blank">${escapeHtml(row.label || row.handle || 'Social')}</a>`));
    if (includeStatus && !safeRows.length) parts.push('<span class="small">Profile links are temporarily unavailable here.</span>');
    return parts.join('');
  }

  async function fetchFooterSocialRows() {
    const preferredOrder = ['youtube', 'instagram', 'tiktok', 'facebook', 'x', 'patreon', 'buymeacoffee'];
    try {
      const response = await fetch('/api/social-feed', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok && data?.profiles && typeof data.profiles === 'object') {
        const rows = preferredOrder.map((key) => data.profiles[key]).filter(Boolean);
        if (rows.length) return rows;
      }
    } catch {}
    try {
      const response = await fetch('/data/site/social-feed.json', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.profiles && typeof data.profiles === 'object') {
        const rows = preferredOrder.map((key) => data.profiles[key]).filter(Boolean);
        if (rows.length) return rows;
      }
    } catch {}
    return getDefaultFooterSocialRows();
  }

  const NAV_LINKS = [
    { href: "/index.html", nav: "/", label: "Home", desktop: true, group: "Essentials" },
    { href: "/shop/index.html", nav: "/shop/", label: "Shop", desktop: true, group: "Shop & Browse" },
    { href: "/collections/index.html", nav: "/collections/", label: "Collections", desktop: true, group: "Shop & Browse" },
    { href: "/marketplaces/index.html", nav: "/marketplaces/", label: "Marketplaces", desktop: true, group: "Shop & Browse" },
    { href: "/cart/index.html", nav: "/cart/", label: "Cart", desktop: true, group: "Shop & Browse" },
    { href: "/gallery/index.html", nav: "/gallery/", label: "Art", desktop: true, group: "Workshop" },
    { href: "/creations/index.html", nav: "/creations/", label: "Creations", desktop: true, group: "Workshop" },
    { href: "/workshop-journal/index.html", nav: "/workshop-journal/", label: "Workshop Journal", desktop: false, group: "Workshop" },
    { href: "/tools/index.html", nav: "/tools/", label: "Tools", desktop: true, group: "Workshop" },
    { href: "/supplies/index.html", nav: "/supplies/", label: "Supplies", desktop: true, group: "Workshop" },
    { href: "/movies/index.html", nav: "/movies/", label: "Movies", desktop: true, group: "Workshop" },
    { href: "/events/index.html", nav: "/events/", label: "Events", desktop: true, group: "Community" },
    { href: "/pickup/index.html", nav: "/pickup/", label: "Pickup", desktop: true, group: "Community" },
    { href: "/socials/index.html", nav: "/socials/", label: "Socials", desktop: true, group: "Community" },
    { href: "/contact/index.html", nav: "/contact/", label: "Contact", desktop: true, group: "Community" },
    { href: "/custom-request/index.html", nav: "/custom-request/", label: "Request custom work", desktop: false, group: "Community" },
    { href: "/about/index.html", nav: "/about/", label: "About", desktop: true, group: "Essentials" },
    { href: "/search/index.html", nav: "/search/", label: "Search", desktop: true, group: "Essentials" },
    { href: "/handmade-jewelry-ontario/index.html", nav: "/handmade-jewelry-ontario/", label: "Handmade jewelry Ontario", desktop: false, group: "Local pages" },
    { href: "/polymer-clay-earrings-ontario/index.html", nav: "/polymer-clay-earrings-ontario/", label: "Polymer clay earrings", desktop: false, group: "Local pages" },
    { href: "/custom-gifts-southern-ontario/index.html", nav: "/custom-gifts-southern-ontario/", label: "Custom gifts", desktop: false, group: "Local pages" },
    { href: "/laser-engraving-ontario/index.html", nav: "/laser-engraving-ontario/", label: "Laser engraving", desktop: false, group: "Local pages" },
    { href: "/vintage-finds-ontario/index.html", nav: "/vintage-finds-ontario/", label: "Vintage finds", desktop: false, group: "Local pages" },
    { href: "/workshop-made-gifts-ontario/index.html", nav: "/workshop-made-gifts-ontario/", label: "Workshop-made gifts", desktop: false, group: "Local pages" },
    { href: "/login/index.html", nav: "/login/", label: "Login", desktop: true, group: "Account", attrs: 'data-show-when-logged-out style="display:none"' },
    { href: "/register/index.html", nav: "/register/", label: "Register", desktop: false, group: "Account", attrs: 'data-show-when-logged-out style="display:none"' },
    { href: "/members/index.html", nav: "/members/", label: "Members", desktop: true, group: "Account", attrs: 'data-show-when-logged-in style="display:none"' },
    { href: "/admin/index.html", nav: "/admin/", label: "Admin", desktop: true, group: "Account", attrs: 'data-show-when-admin style="display:none"' }
  ];

  function navAnchorMarkup(link) {
    const attrs = link.attrs ? ` ${link.attrs}` : "";
    return `<a href="${escapeHtml(link.href)}" data-nav="${escapeHtml(link.nav)}"${attrs}>${escapeHtml(link.label)}</a>`;
  }

  function navLinksMarkup({ desktopOnly = false } = {}) {
    const rows = desktopOnly ? NAV_LINKS.filter((link) => link.desktop) : NAV_LINKS;
    return rows.map(navAnchorMarkup).join('');
  }

  function mobileNavGroupsMarkup() {
    const groupOrder = ["Essentials", "Shop & Browse", "Workshop", "Community", "Account", "Local pages"];
    return groupOrder.map((group) => {
      const rows = NAV_LINKS.filter((link) => link.group === group);
      if (!rows.length) return "";
      return `
        <details class="nav-mobile-group">
          <summary>${escapeHtml(group)} <span>${rows.length}</span></summary>
          <div class="nav-mobile-group-links">${rows.map(navAnchorMarkup).join('')}</div>
        </details>`;
    }).join('');
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
      <button class="nav-mobile-toggle" type="button" aria-expanded="false" aria-controls="siteNavPanel">
        <span class="nav-mobile-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>Menu</span>
      </button>
      <div class="links nav-links-desktop" aria-label="Primary navigation">
        ${navLinksMarkup({ desktopOnly: true })}
      </div>
      <div class="nav-mobile-panel" id="siteNavPanel" hidden>
        <div class="nav-mobile-panel-head">
          <div>
            <div style="font-weight:800;letter-spacing:.2px;line-height:1.1">Browse Devil n Dove</div>
            <div class="small">Shop, creations, tools, supplies, movies, and more</div>
          </div>
          <button class="btn nav-mobile-close" type="button">Close</button>
        </div>
        <div class="nav-mobile-quick-row" aria-label="Quick mobile navigation">
          <a class="btn primary" href="/shop/index.html" data-nav="/shop/">Shop</a>
          <a class="btn" href="/search/index.html" data-nav="/search/">Search</a>
          <a class="btn" href="/cart/index.html" data-nav="/cart/">Cart</a>
        </div>
        <div class="nav-mobile-groups" aria-label="Mobile navigation">
          ${mobileNavGroupsMarkup()}
        </div>
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
            <a href="/collections/index.html">Collections</a>
            <a href="/marketplaces/index.html">Marketplaces</a>
            <a href="/events/index.html">Events</a>
            <a href="/pickup/index.html">Pickup</a>
            <a href="/gallery/index.html">Gallery</a>
            <a href="/creations/index.html">Creations</a>
            <a href="/workshop-journal/index.html">Workshop Journal</a>
            <a href="/tools/index.html">Tools</a>
            <a href="/supplies/index.html">Supplies</a>
            <a href="/movies/index.html">Movies</a>
            <a href="/socials/index.html">Socials</a>
          </div>
        </div>
        <div>
          <div class="site-footer-heading">Local searches</div>
          <div class="site-footer-links">
            <a href="/handmade-jewelry-ontario/index.html">Handmade jewelry Ontario</a>
            <a href="/polymer-clay-earrings-ontario/index.html">Polymer clay earrings</a>
            <a href="/custom-gifts-southern-ontario/index.html">Custom gifts Southern Ontario</a>
            <a href="/custom-request/index.html">Request custom work</a>
            <a href="/laser-engraving-ontario/index.html">Laser engraving projects</a>
            <a href="/vintage-finds-ontario/index.html">Vintage finds Ontario</a>
            <a href="/workshop-made-gifts-ontario/index.html">Workshop-made gifts</a>
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
          <div class="site-footer-heading">Follow & support</div>
          <div class="site-footer-links" id="siteFooterSocialLinks">
            ${socialLinksMarkup(getDefaultFooterSocialRows())}
          </div>
        </div>
        <div>
          <div class="site-footer-heading">Support our work</div>
          <div class="site-footer-links">
            <a href="https://buymeacoffee.com/devilndovel" rel="noopener" target="_blank">Buy Me a Coffee</a>
            <a href="/socials/index.html">More ways to follow</a>
          </div>
          <p class="small">Support helps keep the workshop, videos, and storefront experiments moving.</p>
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

  function wireMobileNav(nav) {
    const toggle = nav.querySelector('.nav-mobile-toggle');
    const panel = nav.querySelector('.nav-mobile-panel');
    const closeBtn = nav.querySelector('.nav-mobile-close');
    if (!toggle || !panel) return;

    const open = () => {
      panel.hidden = false;
      nav.classList.add('nav-mobile-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-mobile-open');
      const activeDetails = panel.querySelector('a.active')?.closest('details');
      if (activeDetails) activeDetails.open = true;
      requestAnimationFrame(() => closeBtn?.focus?.());
    };
    const close = ({ restoreFocus = false } = {}) => {
      if (panel.hidden) return;
      panel.hidden = true;
      nav.classList.remove('nav-mobile-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-mobile-open');
      if (restoreFocus) toggle.focus?.();
    };

    toggle.addEventListener('click', () => {
      if (panel.hidden) open();
      else close({ restoreFocus: true });
    });
    closeBtn?.addEventListener('click', () => close({ restoreFocus: true }));
    panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => close()));
    // Keep mobile navigation as a compact dropdown/accordion, never a fully expanded link list.
    panel.querySelectorAll('details.nav-mobile-group').forEach((group) => {
      group.addEventListener('toggle', () => {
        if (!group.open) return;
        panel.querySelectorAll('details.nav-mobile-group[open]').forEach((other) => {
          if (other !== group) other.open = false;
        });
      });
    });
    // Keep this a compact popup rather than a long scrolling page of links.
    panel.querySelectorAll('details.nav-mobile-group').forEach((group) => {
      group.addEventListener('toggle', () => {
        if (!group.open) return;
        panel.querySelectorAll('details.nav-mobile-group').forEach((other) => {
          if (other !== group) other.open = false;
        });
      });
    });
    document.addEventListener('click', (event) => {
      if (panel.hidden) return;
      if (nav.contains(event.target)) return;
      close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close({ restoreFocus: true });
    });
  }

  function injectSharedNav() {
    const nav = document.querySelector('.nav');
    if (!nav || nav.hasAttribute('data-no-shared-nav')) return;
    nav.classList.add('nav-enhanced');
    nav.innerHTML = buildSharedNav();
    setActiveLink(nav);
    wireMobileNav(nav);
  }

  async function hydrateFooterSocials() {
    const socialWrap = document.getElementById('siteFooterSocialLinks');
    if (!socialWrap) return;
    socialWrap.innerHTML = socialLinksMarkup(getDefaultFooterSocialRows());
    if (String(window.location.pathname || '').startsWith('/admin/')) return;
    try {
      const rows = await fetchFooterSocialRows();
      socialWrap.innerHTML = socialLinksMarkup(rows, { includeHub: true, includeStatus: true });
    } catch (_error) {
      socialWrap.innerHTML = socialLinksMarkup(getDefaultFooterSocialRows(), { includeHub: true, includeStatus: true });
    }
  }

  function shouldShowFeaturedTestimonials(pathname) {
    const path = String(pathname || location.pathname || '/').toLowerCase();
    return ['/', '/index.html', '/about/', '/about/index.html', '/gallery/', '/gallery/index.html', '/creations/', '/creations/index.html', '/shop/', '/shop/index.html', '/collections/', '/collections/index.html', '/marketplaces/', '/marketplaces/index.html', '/events/', '/events/index.html', '/pickup/', '/pickup/index.html', '/tools/', '/tools/index.html', '/supplies/', '/supplies/index.html', '/contact/', '/contact/index.html', '/movies/', '/movies/index.html', '/search/', '/search/index.html', '/socials/', '/socials/index.html'].includes(path);
  }

  function featuredTestimonialMeta(pathname) {
    const path = String(pathname || location.pathname || '/').toLowerCase();
    if (path.startsWith('/shop/')) return { heading: 'Shopper feedback', intro: 'Featured testimonials and approved buyer feedback to support purchase decisions.', limit: 4, insertAfterSelector: '#shopGiftCardStorefrontMount, .customer-welcome, .hero' };
    if (path.startsWith('/collections/')) return { heading: 'Collection trust signals', intro: 'Featured testimonials and buyer notes that help explain how people browse handmade work, vintage stock, and collectible finds across Devil n Dove.', limit: 3, insertAfterSelector: '.hero, .card, .customer-welcome' };
    if (path.startsWith('/marketplaces/')) return { heading: 'Marketplace trust signals', intro: 'Feedback and support notes that help explain external listing links, pickup conversations, and condition-first buying decisions.', limit: 3, insertAfterSelector: '.hero, .card, .customer-welcome' };
    if (path.startsWith('/tools/')) return { heading: 'Workshop notes from buyers', intro: 'Feedback from people following the tools, supplies, and maker side of Devil n Dove.', limit: 3, insertAfterSelector: '.hero' };
    if (path.startsWith('/supplies/')) return { heading: 'Maker feedback', intro: 'Testimonials that help show how people use and enjoy the shop and workshop content.', limit: 3, insertAfterSelector: '.hero' };
    if (path.startsWith('/gallery/') || path.startsWith('/creations/')) return { heading: 'What people say about our creations', intro: 'Featured testimonials and approved buyer feedback from the Devil n Dove storefront.', limit: 3, insertAfterSelector: '.hero, .collections, .cards' };
    if (path.startsWith('/movies/')) return { heading: 'Supporter feedback', intro: 'Featured testimonials and supporter notes from people following Devil n Dove across the storefront, media, and workshop projects.', limit: 3, insertAfterSelector: '.hero' };
    if (path.startsWith('/search/')) return { heading: 'Trust signals while you browse', intro: 'Featured buyer feedback and supporter notes to help while you compare products and creative work.', limit: 3, insertAfterSelector: '.hero, .card, .cards' };
    if (path.startsWith('/socials/')) return { heading: 'Supporter trust', intro: 'A quick look at the feedback and support behind the Devil n Dove storefront, workshop, and content projects.', limit: 3, insertAfterSelector: '.hero, .card' };
    return { heading: 'What buyers say', intro: 'Featured testimonials and approved buyer feedback from the Devil n Dove storefront.', limit: 3, insertAfterSelector: '.hero, .cards, .card-grid' };
  }




  function visualPolishMeta(pathname) {
    const path = String(pathname || location.pathname || '/').toLowerCase();
    if (path.includes('custom-gifts')) return { heading:'Custom gifts with clearer workshop context', kicker:'Southern Ontario gift ideas', bullets:['Handmade, engraved, candle, soap, and vintage paths stay separated for easier browsing.','Visual review rows now track where better approved product photos or process images can go.','The layout remains phone-first while desktop cards keep a sharper professional look.'] };
    if (path.includes('handmade-jewelry')) return { heading:'Handmade jewelry details at a glance', kicker:'Jewelry and maker story', bullets:['Cards can highlight material, process, local pickup, and gift-fit signals without crowding the H1.','Visual candidates now track image slots and alt text hints before new photos go live.','Motion stays subtle and respects reduced-motion settings.'] };
    if (path.includes('laser-engraving')) return { heading:'Engraving process clarity', kicker:'Laser engraving Ontario', bullets:['Future image slots can show before/after examples, approved materials, and finished gift details.','Schema and fallback rows help keep service pages readable even when live admin data is unavailable.','Mobile touch targets stay large enough for phone browsing.'] };
    if (path.includes('candle')) return { heading:'Candle colour and scent story', kicker:'Custom candles Ontario', bullets:['Visual candidates can reserve spots for bright colour photos and raised-detail closeups.','Recall and evidence controls stay separate in admin while public copy remains simple.','One clear H1 is preserved for title-link clarity.'] };
    if (path.includes('soap')) return { heading:'Soap colour, scent, and gift clarity', kicker:'Custom soap Ontario', bullets:['Future approved photos can show texture, bars, packaging, and gift sets.','Structured-data queue rows help verify page markup after content changes.','Desktop and mobile review rows keep both versions aligned.'] };
    if (path.includes('vintage')) return { heading:'Vintage finds with better visual proof', kicker:'Ontario vintage finds', bullets:['Candidate rows can track detail photos, condition images, and provenance hints.','Image budgets keep visual polish sharp without slowing the page.','Fallback notes help prevent blank states if listing data is unavailable.'] };
    if (path.includes('workshop-made')) return { heading:'Workshop-made gifts with more visual polish', kicker:'Maker gifts Southern Ontario', bullets:['Visual enrichment keeps the making process and finished result easier to understand.','Local phrases stay in body copy and headings without adding extra H1 tags.','Mobile and desktop parity rows keep the site usable for both browsing styles.'] };
    if (path === '/' || path === '/index.html') return { heading:'Sharper browsing on desktop and phone', kicker:'Build 182 visual polish', bullets:['Desktop cards get a cleaner, more professional visual rhythm.','Mobile review rows keep menus, buttons, and product paths easy to tap.','Visual enrichment is queued before photos/effects go live so pages stay polished, fast, and accessible.'] };
    return null;
  }

  function injectVisualPolishStrip() {
    const meta = visualPolishMeta(location.pathname);
    if (!meta || document.getElementById('visualPolishStrip')) return;
    const container = document.querySelector('.container') || document.body;
    const anchor = container.querySelector('.customer-welcome, .hero');
    if (!container || !anchor) return;
    const section = document.createElement('section');
    section.id = 'visualPolishStrip';
    section.className = 'visual-polish-strip';
    section.setAttribute('aria-label', meta.kicker || 'Visual polish notes');
    section.innerHTML = meta.bullets.map((bullet, index) => { const key=`home.visual-polish.${index+1}`; return `<article class="visual-tile" data-color-slot="${key}.color" data-visual-polish-card="${index+1}"><div class="visual-kicker" data-content-slot="${key}.kicker">${escapeHtml(index === 0 ? meta.kicker : (index === 1 ? 'Mobile friendly' : 'Polished fallback'))}</div><h2 data-content-slot="${key}.heading">${escapeHtml(index === 0 ? meta.heading : (index === 1 ? 'Phone and desktop ready' : 'Fast, clear, accessible'))}</h2><p class="small" data-content-slot="${key}.body">${escapeHtml(bullet)}</p></article>`; }).join('');
    anchor.parentNode.insertBefore(section, anchor.nextSibling);
  }


  function injectLowBandwidthToggle() {
    const eligible = document.querySelector('.visual-polish-strip, .hero, .product-grid, .cards, .collection-grid');
    if (!eligible || document.getElementById('lowBandwidthToggle')) return;
    const saved = localStorage.getItem('dd_low_bandwidth') || 'auto';
    const apply = (mode) => {
      const enabled = mode === 'on' || (mode === 'auto' && window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches);
      document.documentElement.classList.toggle('low-bandwidth', enabled);
      localStorage.setItem('dd_low_bandwidth', mode);
      const label = document.querySelector('#lowBandwidthToggle button');
      if (label) label.textContent = enabled ? 'Lighter visuals: on' : 'Lighter visuals: auto/off';
    };
    const wrap = document.createElement('div');
    wrap.id = 'lowBandwidthToggle';
    wrap.className = 'low-bandwidth-toggle';
    wrap.innerHTML = '<button type="button" aria-pressed="false">Lighter visuals: auto/off</button>';
    wrap.querySelector('button').addEventListener('click', () => {
      const current = localStorage.getItem('dd_low_bandwidth') || 'auto';
      apply(current === 'on' ? 'off' : 'on');
      wrap.querySelector('button').setAttribute('aria-pressed', document.documentElement.classList.contains('low-bandwidth') ? 'true' : 'false');
    });
    document.body.appendChild(wrap);
    apply(saved);
    wrap.querySelector('button').setAttribute('aria-pressed', document.documentElement.classList.contains('low-bandwidth') ? 'true' : 'false');
  }

  function shouldShowTrustSupportBlock(pathname) {
    const path = String(pathname || location.pathname || '/').toLowerCase();
    return ['/', '/index.html', '/shop/', '/shop/index.html', '/collections/', '/collections/index.html', '/marketplaces/', '/marketplaces/index.html', '/events/', '/events/index.html', '/pickup/', '/pickup/index.html', '/gallery/', '/gallery/index.html', '/creations/', '/creations/index.html', '/tools/', '/tools/index.html', '/supplies/', '/supplies/index.html', '/search/', '/search/index.html'].includes(path);
  }

  function trustSupportMeta(pathname) {
    const path = String(pathname || location.pathname || '/').toLowerCase();
    if (path.startsWith('/shop/')) return { heading: 'Shop with more confidence', bullets: ['Saved wishlists and member tools help shoppers come back later.', 'Gift cards, buyer feedback, and clearer product details reduce guesswork.', 'Support links help people back the workshop even when they are not buying a product today.'] };
    if (path.startsWith('/collections/')) return { heading: 'Collections with clearer context', bullets: ['Collection landing pages help shoppers separate handmade work from vintage, collectible, antique, and found-item stock.', 'Origin, condition, era, and sale-channel wording stay visible sooner so buyers know what they are opening.', 'Local Southern Ontario wording keeps the browsing path clearer for nearby shoppers and pickup conversations.'] };
    if (path.startsWith('/marketplaces/')) return { heading: 'External marketplace clarity', bullets: ['Marketplace pages explain when an item is sold on Devil n Dove, hybrid-listed, or external-only.', 'Condition, provenance, and pickup/support questions stay visible before a shopper follows an outside link.', 'Local and regional buyer questions can move to contact quickly without leaving uncertainty around channel or availability.'] };
    if (path.startsWith('/gallery/') || path.startsWith('/creations/')) return { heading: 'Trust behind the creations', bullets: ['Featured buyer feedback supports the story behind the work.', 'Support links and member tools help visitors follow along beyond a single purchase.', 'Maker-story and product detail links help connect gallery pieces back to the storefront.'] };
    if (path.startsWith('/search/')) return { heading: 'Browse with stronger trust signals', bullets: ['Featured testimonials stay visible while people compare products.', 'Gift cards and member tools make it easier to save, return, and buy later.', 'Support links help followers back the workshop beyond a single order.'] };
    return { heading: 'Support, trust, and shopper clarity', bullets: ['Member tools, wishlists, and order history keep the storefront easier to use over time.', 'Featured testimonials and product detail blocks help new visitors trust what they see.', 'Support links make it easy for followers to back the workshop, videos, and storefront experiments.'] };
  }

  function injectTrustSupportBlock() {
    if (!shouldShowTrustSupportBlock(location.pathname)) return;
    const container = document.querySelector('.container') || document.body;
    const footer = container.querySelector('footer.footer, .footer');
    if (!container || !footer || document.getElementById('siteTrustSupportBlock')) return;
    const meta = trustSupportMeta(location.pathname);
    const section = document.createElement('section');
    section.id = 'siteTrustSupportBlock';
    section.className = 'card site-trust-support-block';
    section.style.marginTop = '18px';
    section.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin:0">${escapeHtml(meta.heading)}</h2><p class="small" style="margin:6px 0 0 0">We keep trust signals visible across the storefront so shoppers can browse, save, support, and come back later with more confidence.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="/members/">Members</a><a class="btn" href="/shop/">Shop</a><a class="btn" href="https://buymeacoffee.com/devilndovel" rel="noopener" target="_blank">Support our work</a></div></div><ul class="small" style="margin-top:10px;padding-left:18px">${meta.bullets.map((row) => `<li>${escapeHtml(row)}</li>`).join('')}</ul>`;
    footer.parentNode.insertBefore(section, footer);
  }

  function trustContextFromPath(pathname) {
    const path = String(pathname || location.pathname || '/').toLowerCase();
    if (path === '/' || path === '/index.html') return 'home';
    const part = path.split('/').filter(Boolean)[0] || 'sitewide';
    return part.replace(/[^a-z0-9_-]+/g, '_') || 'sitewide';
  }

  async function loadFeaturedTrustItems(meta) {
    try {
      const response = await fetch(`/api/trust-blocks?context=${encodeURIComponent(trustContextFromPath(location.pathname))}&limit=${encodeURIComponent(meta.limit)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load approved trust blocks.');
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length) {
        return items.map((row) => ({
          rating: String(row.rating_label || '').match(/\d/) ? Number(String(row.rating_label).match(/\d/)[0]) : 5,
          review_text: row.body || '',
          reviewer_name: row.attribution_label || row.locality_label || 'Devil n Dove customer',
          product_slug: row.related_product_slug || '',
          product_name: row.related_product_name || '',
          review_kind: row.item_kind || 'testimonial',
          trust_title: row.title || '',
        }));
      }
    } catch (_error) {}
    try {
      const response = await fetch(`/api/product-reviews?featured_only=1&limit=${meta.limit}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not load testimonials.');
      return Array.isArray(data.reviews) ? data.reviews : [];
    } catch (_error) {
      return [];
    }
  }

  async function injectFeaturedTestimonials() {
    if (!shouldShowFeaturedTestimonials(location.pathname)) return;
    const container = document.querySelector('.container') || document.body;
    const footer = container.querySelector('footer.footer, .footer');
    if (!container || !footer || document.getElementById('featuredTestimonialsBlock')) return;
    try {
      const meta = featuredTestimonialMeta(location.pathname);
      const reviews = await loadFeaturedTrustItems(meta);
      if (!reviews.length) return;
      const section = document.createElement('section');
      section.id = 'featuredTestimonialsBlock';
      section.className = 'card featured-testimonials-block';
      section.style.marginTop = '18px';
      section.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <h2 style="margin:0">${escapeHtml(meta.heading)}</h2>
            <p class="small" style="margin:6px 0 0 0">${escapeHtml(meta.intro)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="/members/">Leave feedback</a><a class="btn" href="https://buymeacoffee.com/devilndovel" rel="noopener" target="_blank">Support our work</a></div>
        </div>
        <div class="featured-testimonials-grid" style="margin-top:12px">
          ${reviews.map((row) => `
            <article class="featured-testimonial-card">
              ${row.trust_title ? `<div class="small"><strong>${escapeHtml(row.trust_title)}</strong></div>` : ''}
              <div class="small">${escapeHtml('★'.repeat(Math.max(1, Number(row.rating || 0))))}</div>
              <p style="margin:10px 0">${escapeHtml(row.review_text || '')}</p>
              <div class="small"><strong>${escapeHtml(row.reviewer_name || 'Devil n Dove customer')}</strong>${row.product_slug ? ` • <a href="/shop/product/?slug=${encodeURIComponent(row.product_slug)}">${escapeHtml(row.product_name || 'Product')}</a>` : ''}</div><div class="small" style="margin-top:4px">${escapeHtml(row.review_kind || 'testimonial')}</div>
            </article>`).join('')}
        </div><div class="small" style="margin-top:10px">Approved trust blocks and featured reviews are used across the shop and public sections to build trust, show real buyer reactions, and support local discovery.</div>`;
      const anchor = container.querySelector(meta.insertAfterSelector);
      if (anchor && anchor.parentNode === container) container.insertBefore(section, anchor.nextSibling);
      else container.insertBefore(section, footer);
    } catch (_error) {}
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
    hydrateFooterSocials();
    injectFeaturedTestimonials();
    injectTrustSupportBlock();
    injectVisualPolishStrip();
    injectLowBandwidthToggle();
    ensureGlobalScript('/public/js/auth.js');
    ensureGlobalScript('/public/js/site-auth-ui.js');
    ensureGlobalScript('/public/js/site-analytics.js?v=440');
  });
})();


// Build 212 policy-link footer enhancement
(() => {
  const addPolicyLinks = () => {
    const hrefs = new Set(Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')));
    const footer = document.querySelector('.footer') || document.querySelector('footer');
    if (!footer || hrefs.has('/privacy/')) return;
    const nav = document.createElement('nav');
    nav.className = 'dd-policy-footer-links';
    nav.setAttribute('aria-label', 'Legal and social connection policies');
    nav.innerHTML = '<a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/data-deletion/">Data deletion</a><a href="/social-connections/">Social connections</a>';
    footer.appendChild(nav);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPolicyLinks, { once: true });
  else addPolicyLinks();
})();
