// Devil n Dove Release 455 — shared Storefront discovery, media fallback, accessibility and SEO protection.
(() => {
  'use strict';
  if (window.DDStorefrontDiscovery) return;

  const RELEASE = 455;
  const FALLBACK_IMAGE = '/assets/visual-placeholders/storefront-media-fallback.svg';
  const TARGETS = new Set(['/shop/', '/shop/product/', '/collections/', '/collages/']);
  const text = (value) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();

  function normalizedPath() {
    let path = String(location.pathname || '/');
    if (!path.endsWith('/')) path += '/';
    return path;
  }

  function isTargetPage() {
    return TARGETS.has(normalizedPath());
  }

  function currentProductSlug() {
    return text(new URLSearchParams(location.search).get('slug'));
  }

  function productionUrlFromCurrent() {
    const path = normalizedPath();
    const url = new URL(`https://devilndove.com${path}`);
    if (path === '/shop/product/') {
      const slug = currentProductSlug();
      if (slug) url.searchParams.set('slug', slug);
    }
    return url.toString();
  }

  function ensureMeta(selector, attrs) {
    let node = document.querySelector(selector);
    if (!node) {
      node = document.createElement('meta');
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      document.head.appendChild(node);
    }
    return node;
  }

  function normalizeCanonical() {
    if (normalizedPath() !== '/shop/product/') return;
    const canonical = document.querySelector('link[rel="canonical"]');
    const fallback = productionUrlFromCurrent();
    const expectedSlug = currentProductSlug();
    if (!canonical) {
      const node = document.createElement('link');
      node.rel = 'canonical';
      node.href = fallback;
      document.head.appendChild(node);
      return;
    }
    try {
      const current = new URL(canonical.href, location.origin);
      const canonicalSlug = text(current.searchParams.get('slug'));
      const needsProductSlug = !!expectedSlug && canonicalSlug !== expectedSlug;
      if (current.hostname.endsWith('.pages.dev') || current.hostname === location.hostname || !current.hostname || needsProductSlug) {
        canonical.href = fallback;
      }
    } catch {
      canonical.href = fallback;
    }
  }

  function syncSocialSeo() {
    if (normalizedPath() !== '/shop/product/') return;
    normalizeCanonical();
    const canonical = document.querySelector('link[rel="canonical"]')?.href || productionUrlFromCurrent();
    const title = text(document.title) || 'Product Details | Devil n Dove Shop';
    const description = text(document.querySelector('meta[name="description"]')?.content) || 'View current Devil n Dove product details, images, pricing, shipping and availability.';
    const ogImage = text(document.querySelector('meta[property="og:image"]')?.content) || 'https://devilndove.com/assets/images/site/shop-item-specific-collage.webp';
    const h1 = text(document.querySelector('h1')?.textContent) || 'Devil n Dove product';

    const pairs = [
      ['meta[property="og:title"]', { property:'og:title' }, title],
      ['meta[property="og:description"]', { property:'og:description' }, description],
      ['meta[property="og:url"]', { property:'og:url' }, canonical],
      ['meta[property="og:image"]', { property:'og:image' }, ogImage],
      ['meta[property="og:image:alt"]', { property:'og:image:alt' }, `${h1} — Devil n Dove product image`],
      ['meta[name="twitter:card"]', { name:'twitter:card' }, 'summary_large_image'],
      ['meta[name="twitter:title"]', { name:'twitter:title' }, title],
      ['meta[name="twitter:description"]', { name:'twitter:description' }, description],
      ['meta[name="twitter:image"]', { name:'twitter:image' }, ogImage],
      ['meta[name="twitter:image:alt"]', { name:'twitter:image:alt' }, `${h1} — Devil n Dove product image`],
    ];
    pairs.forEach(([selector, attrs, value]) => {
      const node = ensureMeta(selector, attrs);
      if (text(node.content) !== text(value)) node.content = value;
    });
  }

  function derivedAlt(img) {
    const existing = text(img.getAttribute('alt'));
    if (existing) return existing;
    const linkLabel = text(img.closest('a')?.getAttribute('aria-label'));
    if (linkLabel) return linkLabel;
    const card = img.closest('article,.card,figure');
    const heading = text(card?.querySelector('h2,h3,h4')?.textContent);
    if (heading) return `${heading} image`;
    const caption = text(card?.querySelector('figcaption')?.textContent);
    if (caption) return caption;
    const pageHeading = text(document.querySelector('h1')?.textContent);
    return pageHeading ? `${pageHeading} image` : 'Devil n Dove product image';
  }

  function isDecorative(img) {
    return img.getAttribute('aria-hidden') === 'true' || img.getAttribute('role') === 'presentation';
  }

  function applyFallback(img) {
    if (!img || img.dataset.storefrontFallbackTried === '1') return;
    img.dataset.storefrontFallbackTried = '1';
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = FALLBACK_IMAGE;
    img.dataset.storefrontMediaFallback = 'true';
    img.classList.add('storefront-resilient-media');
    if (!isDecorative(img) && !text(img.getAttribute('alt'))) img.alt = derivedAlt(img);
  }

  function prepareImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.closest('.nav .brand')) return;
    img.classList.add('storefront-resilient-media');
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    const priority = img.getAttribute('fetchpriority') === 'high' || img.loading === 'eager' || !!img.closest('.hero,#productMainImageWrap,.product-detail-main-image');
    if (!priority && !img.hasAttribute('loading')) img.loading = 'lazy';
    if (!isDecorative(img) && !text(img.getAttribute('alt'))) img.alt = derivedAlt(img);
    if (img.dataset.storefrontErrorBound !== '1') {
      img.dataset.storefrontErrorBound = '1';
      img.addEventListener('error', () => applyFallback(img));
    }
    if (img.complete && img.naturalWidth === 0 && text(img.currentSrc || img.src)) applyFallback(img);
  }

  function preparePlaceholders(root = document) {
    root.querySelectorAll?.('.shop-card-no-image,.product-detail-no-image,.media-managed-placeholder').forEach((node) => {
      node.classList.add('storefront-media-fallback');
      if (!node.hasAttribute('role')) node.setAttribute('role', 'img');
      if (!node.hasAttribute('aria-label')) {
        const heading = text(node.closest('article,.card')?.querySelector('h2,h3,h4')?.textContent);
        node.setAttribute('aria-label', heading ? `${heading} product image unavailable` : 'Product image unavailable');
      }
    });
  }

  function prepareStatuses(root = document) {
    root.querySelectorAll?.('#shopLoading,#shopStatus,#shopSummary,#shopEmpty,#productLoading,[data-storefront-merchandising]').forEach((node) => {
      if (!node.hasAttribute('role')) node.setAttribute('role', 'status');
      if (!node.hasAttribute('aria-live')) node.setAttribute('aria-live', 'polite');
    });
    root.querySelectorAll?.('#shopError,#productError').forEach((node) => {
      node.setAttribute('role', 'alert');
      node.setAttribute('aria-live', 'assertive');
    });
  }

  function prepareThumbState(root = document) {
    root.querySelectorAll?.('.shop-card-thumb,.product-detail-thumb').forEach((button) => {
      const pressed = button.classList.contains('is-active') ? 'true' : 'false';
      button.setAttribute('aria-pressed', pressed);
      if (button.dataset.storefrontPressedBound !== '1') {
        button.dataset.storefrontPressedBound = '1';
        button.addEventListener('click', () => {
          const group = button.parentElement;
          group?.querySelectorAll('.shop-card-thumb,.product-detail-thumb').forEach((peer) => peer.setAttribute('aria-pressed', peer === button ? 'true' : 'false'));
        });
      }
    });
  }

  function protectSingleH1() {
    const headings = [...document.querySelectorAll('h1')];
    if (headings.length <= 1) return;
    headings.slice(1).forEach((heading) => {
      const replacement = document.createElement('h2');
      [...heading.attributes].forEach((attr) => replacement.setAttribute(attr.name, attr.value));
      replacement.dataset.demotedDuplicateH1 = 'release455';
      replacement.innerHTML = heading.innerHTML;
      heading.replaceWith(replacement);
    });
    document.documentElement.dataset.storefrontH1Protection = 'duplicate-demoted';
  }

  function prepareRoot(root = document) {
    root.querySelectorAll?.('img').forEach(prepareImage);
    preparePlaceholders(root);
    prepareStatuses(root);
    prepareThumbState(root);
    protectSingleH1();
    syncSocialSeo();
  }

  function observe() {
    if (typeof MutationObserver !== 'function') return;
    const bodyObserver = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('img')) prepareImage(node);
          prepareRoot(node);
        });
      }
      protectSingleH1();
      prepareStatuses();
      prepareThumbState();
    });
    bodyObserver.observe(document.body, { childList:true, subtree:true });

    const headObserver = new MutationObserver(() => syncSocialSeo());
    headObserver.observe(document.head, { childList:true, subtree:true, attributes:true, attributeFilter:['content','href'] });
  }

  function boot() {
    if (!isTargetPage()) return;
    document.body.dataset.storefrontDiscoveryRuntime = String(RELEASE);
    prepareRoot(document);
    observe();
    document.dispatchEvent(new CustomEvent('dd:storefront-discovery-ready', { detail:{ release:RELEASE } }));
  }

  window.DDStorefrontDiscovery = Object.freeze({ release:RELEASE, fallbackImage:FALLBACK_IMAGE, prepareRoot, syncSocialSeo });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
