(() => {
  'use strict';

  const SCHEMA_ID = 'product-breadcrumb-schema';
  const PRODUCT_LABEL_ID = 'productBreadcrumbLabel';
  const PRODUCT_NAME_IDS = ['productName', 'pageH1'];

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function currentProductName() {
    for (const id of PRODUCT_NAME_IDS) {
      const node = document.getElementById(id);
      const value = normalizeText(node && node.textContent);
      if (value && !/^product details$/i.test(value)) return value;
    }
    return 'Product';
  }

  function canonicalUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const value = canonical && canonical.href ? canonical.href : window.location.href;
    try {
      const url = new URL(value, window.location.origin);
      url.hash = '';
      return url.toString();
    } catch (_) {
      return window.location.href.split('#')[0];
    }
  }

  function schemaNode() {
    let node = document.getElementById(SCHEMA_ID);
    if (!node) {
      node = document.createElement('script');
      node.id = SCHEMA_ID;
      node.type = 'application/ld+json';
      document.head.appendChild(node);
    }
    return node;
  }

  function updateBreadcrumbAuthority() {
    const productName = currentProductName();
    const visibleLabel = document.getElementById(PRODUCT_LABEL_ID);
    if (visibleLabel) visibleLabel.textContent = productName;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://devilndove.com/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Shop',
          item: 'https://devilndove.com/shop/'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: productName,
          item: canonicalUrl()
        }
      ]
    };
    schemaNode().textContent = JSON.stringify(schema);
  }

  function observeAuthority() {
    const targets = PRODUCT_NAME_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) targets.push(canonical);
    if (!targets.length || typeof MutationObserver !== 'function') return;

    const observer = new MutationObserver(updateBreadcrumbAuthority);
    targets.forEach((target) => observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: target.tagName === 'LINK',
      attributeFilter: target.tagName === 'LINK' ? ['href'] : undefined
    }));
  }

  function boot() {
    updateBreadcrumbAuthority();
    observeAuthority();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
