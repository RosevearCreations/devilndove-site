// Devil n Dove Build 300 Packaging live-preview derived-field synchronization.
// Keeps the rendered soap identity aligned with Product / variant only while the
// identity is still an automatic/default value. Explicit owner edits remain authoritative.
(() => {
  const BUILD = 300;

  let bindCount = 0;
  let identitySyncCount = 0;
  let forcedPreviewRefreshCount = 0;
  let lastProductBefore = '';
  let lastProductAfter = '';
  let lastIdentityBefore = '';
  let lastIdentityAfter = '';
  let lastSyncReason = '';

  const byId = (name) => document.getElementById(name);
  const clean = (value) => String(value ?? '').trim();

  function dispatchPreviewRefresh(reason = 'manual') {
    const field = byId('packagingIdentityEn') || byId('packagingCollection') || byId('packagingProductName');
    if (!field) return false;
    forcedPreviewRefreshCount += 1;
    lastSyncReason = reason;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }

  function updateSoapFieldNotes() {
    const type = clean(byId('packagingType')?.value);
    if (type !== 'soap_ribbon') return;

    const subtitle = byId('packagingSubtitle');
    const subtitleLabel = subtitle?.closest('label')?.querySelector('.small');
    if (subtitleLabel) subtitleLabel.textContent = 'Front tagline (saved metadata; not printed on soap ribbon)';

    const product = byId('packagingProductName');
    const productLabel = product?.closest('label')?.querySelector('.small');
    if (productLabel) productLabel.textContent = 'Product / variant (drives English identity while identity remains derived)';
  }

  function bindDerivedIdentity() {
    const product = byId('packagingProductName');
    const identity = byId('packagingIdentityEn');
    if (!product || !identity || product.dataset.build300PreviewSyncBound === 'true') return;

    product.dataset.build300PreviewSyncBound = 'true';
    identity.dataset.build300PreviewSyncBound = 'true';
    bindCount += 1;

    let previousProduct = clean(product.value);
    const initialIdentity = clean(identity.value);
    identity.dataset.build300DerivedIdentity = (!initialIdentity || initialIdentity === previousProduct) ? 'true' : 'false';

    let internalSync = false;

    const syncFromProduct = (reason) => {
      const nextProduct = clean(product.value);
      const currentIdentity = clean(identity.value);
      const stillDerived = identity.dataset.build300DerivedIdentity === 'true' || !currentIdentity || currentIdentity === previousProduct;

      lastProductBefore = previousProduct;
      lastProductAfter = nextProduct;
      lastIdentityBefore = currentIdentity;

      if (stillDerived && currentIdentity !== nextProduct) {
        internalSync = true;
        identity.value = product.value;
        identity.dataset.build300DerivedIdentity = 'true';
        identitySyncCount += 1;
        lastIdentityAfter = clean(identity.value);
        lastSyncReason = reason;
        identity.dispatchEvent(new Event('input', { bubbles: true }));
        internalSync = false;
      } else {
        lastIdentityAfter = currentIdentity;
      }

      previousProduct = nextProduct;
    };

    product.addEventListener('input', () => syncFromProduct('product-input'));
    product.addEventListener('change', () => syncFromProduct('product-change'));

    identity.addEventListener('input', () => {
      if (internalSync) return;
      const currentIdentity = clean(identity.value);
      const currentProduct = clean(product.value);
      identity.dataset.build300DerivedIdentity = (!currentIdentity || currentIdentity === currentProduct) ? 'true' : 'false';
      lastIdentityBefore = currentIdentity;
      lastIdentityAfter = currentIdentity;
      lastSyncReason = 'identity-owner-edit';
    });

    updateSoapFieldNotes();
  }

  function bindCurrentEditor() {
    bindDerivedIdentity();
    updateSoapFieldNotes();
  }

  function watchEditorRenders() {
    const main = byId('packagingStudioMain');
    if (!main || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => bindCurrentEditor());
    observer.observe(main, { childList: true, subtree: true });
    bindCurrentEditor();
  }

  function previewText() {
    return clean(byId('packagingSvgPreview')?.textContent);
  }

  function getStatus() {
    const product = clean(byId('packagingProductName')?.value);
    const identity = clean(byId('packagingIdentityEn')?.value);
    const text = previewText();
    return {
      build: BUILD,
      state: 'active',
      bindCount,
      identitySyncCount,
      forcedPreviewRefreshCount,
      productValue: product,
      identityValue: identity,
      identityIsDerived: byId('packagingIdentityEn')?.dataset.build300DerivedIdentity === 'true',
      previewContainsProduct: Boolean(product && text.includes(product)),
      previewContainsIdentity: Boolean(identity && text.includes(identity)),
      lastProductBefore,
      lastProductAfter,
      lastIdentityBefore,
      lastIdentityAfter,
      lastSyncReason,
      matureEditorPreserved: true,
      saveTransportPreserved: true,
    };
  }

  globalThis.DDPackagingPreviewSync = Object.freeze({
    getStatus,
    refresh: () => dispatchPreviewRefresh('public-refresh'),
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEditorRenders, { once: true });
  else watchEditorRenders();
})();
