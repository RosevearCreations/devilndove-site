// Devil n Dove Build 300 Packaging save + preview stabilization.
// Save Project is verified by a fresh native read-back before success is shown.
// Soap Product / variant also keeps the rendered English identity synchronized only
// while that identity is still default/derived; explicit owner identity edits win.
(() => {
  const BUILD = 300;
  const baseClient = globalThis.DDPackagingClient;
  if (!baseClient || typeof baseClient.request !== 'function') return;

  const originalRequest = baseClient.request.bind(baseClient);
  const originalGetStatus = typeof baseClient.getStatus === 'function'
    ? baseClient.getStatus.bind(baseClient)
    : () => null;

  let verifiedSaveCount = 0;
  let failedVerificationCount = 0;
  let lastVerification = null;
  let previewBindCount = 0;
  let identitySyncCount = 0;
  let lastPreviewReason = '';

  const text = (value) => String(value ?? '').trim();
  const byId = (name) => document.getElementById(name);

  function normalizeClaims(rows) {
    return (Array.isArray(rows) ? rows : [])
      .map((row, index) => ({
        sort_order: index + 1,
        claim_en: text(row?.claim_en),
        claim_fr: text(row?.claim_fr),
        icon_name: text(row?.icon_name),
        is_approved: Number(row?.is_approved) === 1 || row?.is_approved === true ? 1 : 0,
        compliance_note: text(row?.compliance_note),
      }))
      .filter((row) => row.claim_en || row.claim_fr);
  }

  function claimsEqual(expected, actual) {
    return JSON.stringify(normalizeClaims(expected)) === JSON.stringify(normalizeClaims(actual));
  }

  function coreMismatches(body, project) {
    const checks = [
      ['project_name', body.project_name, project?.project_name],
      ['collection_name', body.collection_name, project?.collection_name],
      ['product_name', body.product_name, project?.product_name],
      ['product_subtitle', body.product_subtitle, project?.product_subtitle],
      ['product_identity_en', body.product_identity_en, project?.product_identity_en],
      ['product_identity_fr', body.product_identity_fr, project?.product_identity_fr],
      ['net_quantity_text', body.net_quantity_text, project?.net_quantity_text],
      ['website_text', body.website_text, project?.website_text],
      ['dealer_name', body.dealer_name, project?.dealer_name],
      ['dealer_address', body.dealer_address, project?.dealer_address],
      ['contact_text', body.contact_text, project?.contact_text],
      ['made_in_canada_text', body.made_in_canada_text, project?.made_in_canada_text],
      ['warnings_en', body.warnings_en, project?.warnings_en],
      ['warnings_fr', body.warnings_fr, project?.warnings_fr],
      ['print_notes', body.print_notes, project?.print_notes],
    ];
    return checks
      .filter(([, expected, actual]) => text(expected) !== text(actual))
      .map(([field, expected, actual]) => ({ field, expected: text(expected), actual: text(actual) }));
  }

  function jsonResponse(payload, status = 200, sourceResponse = null) {
    const headers = new Headers(sourceResponse?.headers || undefined);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.set('content-type', 'application/json; charset=utf-8');
    headers.set('cache-control', 'no-store');
    return new Response(JSON.stringify(payload), {
      status,
      statusText: status === 200 ? 'OK' : 'Conflict',
      headers,
    });
  }

  async function responseJson(response) {
    try { return await response?.clone?.().json(); }
    catch { return null; }
  }

  async function verifiedSave(body, projectId) {
    const writeResponse = await originalRequest(body, projectId);
    const writePayload = await responseJson(writeResponse);
    if (!writeResponse?.ok || !writePayload?.ok) return writeResponse;

    const requestedProjectId = Number(projectId || body?.packaging_project_id || writePayload?.detail?.project?.packaging_project_id || 0);
    if (!requestedProjectId) {
      failedVerificationCount += 1;
      lastVerification = Object.freeze({ ok: false, reason: 'missing-project-id' });
      return jsonResponse({
        ok: false,
        build: BUILD,
        error: 'Packaging Save Project returned success but could not be verified because the project id was missing. Browser draft was retained.',
        error_code: 'packaging_save_verification_project_id_missing',
      }, 409, writeResponse);
    }

    const freshResponse = await originalRequest(null, requestedProjectId);
    const freshPayload = await responseJson(freshResponse);
    if (!freshResponse?.ok || !freshPayload?.ok || !freshPayload?.detail?.project) {
      failedVerificationCount += 1;
      lastVerification = Object.freeze({ ok: false, reason: 'fresh-read-failed', status: Number(freshResponse?.status || 0) });
      return jsonResponse({
        ok: false,
        build: BUILD,
        error: 'Packaging Save Project wrote successfully, but the authoritative read-back failed. Browser draft was retained; do not assume the save is complete.',
        error_code: 'packaging_save_verification_read_failed',
      }, 409, writeResponse);
    }

    const expectedClaims = normalizeClaims(body?.structured_claims);
    const actualClaims = normalizeClaims(freshPayload.detail?.structured_claims);
    const claimsMatch = claimsEqual(expectedClaims, actualClaims);
    const mismatches = coreMismatches(body || {}, freshPayload.detail.project);
    const coreMatch = mismatches.length === 0;

    lastVerification = Object.freeze({
      ok: claimsMatch && coreMatch,
      packaging_project_id: requestedProjectId,
      expected_claim_count: expectedClaims.length,
      actual_claim_count: actualClaims.length,
      claims_match: claimsMatch,
      core_match: coreMatch,
      mismatch_fields: Object.freeze(mismatches.map((row) => row.field)),
    });

    if (!claimsMatch || !coreMatch) {
      failedVerificationCount += 1;
      return jsonResponse({
        ok: false,
        build: BUILD,
        error: `Packaging Save Project did not verify against D1 read-back. ${!claimsMatch ? 'Claims differ. ' : ''}${mismatches.length ? `Fields differ: ${mismatches.map((row) => row.field).join(', ')}.` : ''} Browser draft was retained.`,
        error_code: 'packaging_save_verification_mismatch',
        verification: lastVerification,
      }, 409, writeResponse);
    }

    verifiedSaveCount += 1;
    const verifiedPayload = {
      ...freshPayload,
      message: `${writePayload.message || 'Packaging project saved.'} Verified by fresh D1 read-back.`,
      write_boundary: writePayload.write_boundary || null,
      save_verification: {
        build: BUILD,
        verified: true,
        packaging_project_id: requestedProjectId,
        claim_count: actualClaims.length,
      },
    };
    return jsonResponse(verifiedPayload, 200, writeResponse);
  }

  async function request(body = null, projectId = 0) {
    if (body?.action === 'save_project') return verifiedSave(body, projectId);
    return originalRequest(body, projectId);
  }

  function bindPreviewIdentity() {
    const product = byId('packagingProductName');
    const identity = byId('packagingIdentityEn');
    if (!product || !identity || product.dataset.build300PreviewBound === 'true') return;

    product.dataset.build300PreviewBound = 'true';
    identity.dataset.build300PreviewBound = 'true';
    previewBindCount += 1;

    let previousProduct = text(product.value);
    const initialIdentity = text(identity.value);
    identity.dataset.build300DerivedIdentity = (!initialIdentity || initialIdentity === previousProduct) ? 'true' : 'false';
    let internalSync = false;

    const syncFromProduct = (reason) => {
      const nextProduct = text(product.value);
      const currentIdentity = text(identity.value);
      const derived = identity.dataset.build300DerivedIdentity === 'true' || !currentIdentity || currentIdentity === previousProduct;
      if (derived && currentIdentity !== nextProduct) {
        internalSync = true;
        identity.value = product.value;
        identity.dataset.build300DerivedIdentity = 'true';
        identitySyncCount += 1;
        lastPreviewReason = reason;
        identity.dispatchEvent(new Event('input', { bubbles: true }));
        internalSync = false;
      }
      previousProduct = nextProduct;
    };

    product.addEventListener('input', () => syncFromProduct('product-input'));
    product.addEventListener('change', () => syncFromProduct('product-change'));
    identity.addEventListener('input', () => {
      if (internalSync) return;
      const currentIdentity = text(identity.value);
      const currentProduct = text(product.value);
      identity.dataset.build300DerivedIdentity = (!currentIdentity || currentIdentity === currentProduct) ? 'true' : 'false';
      lastPreviewReason = 'identity-owner-edit';
    });

    if (text(byId('packagingType')?.value) === 'soap_ribbon') {
      const subtitleLabel = byId('packagingSubtitle')?.closest('label')?.querySelector('.small');
      if (subtitleLabel) subtitleLabel.textContent = 'Front tagline (saved metadata; not printed on soap ribbon)';
    }
  }

  function watchEditor() {
    const main = byId('packagingStudioMain');
    if (!main || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => bindPreviewIdentity());
    observer.observe(main, { childList: true, subtree: true });
    bindPreviewIdentity();
  }

  function getStatus() {
    const base = originalGetStatus() || {};
    const product = text(byId('packagingProductName')?.value);
    const identity = text(byId('packagingIdentityEn')?.value);
    const previewText = text(byId('packagingSvgPreview')?.textContent);
    return Object.freeze({
      ...base,
      stabilizationBuild: BUILD,
      saveVerificationActive: true,
      verifiedSaveCount,
      failedVerificationCount,
      lastVerification,
      previewBindCount,
      identitySyncCount,
      identityIsDerived: byId('packagingIdentityEn')?.dataset.build300DerivedIdentity === 'true',
      previewContainsIdentity: Boolean(identity && previewText.includes(identity)),
      productValue: product,
      identityValue: identity,
      lastPreviewReason,
      build298NativeClientPreserved: true,
      build299BrowserControllerLoaded: false,
    });
  }

  globalThis.DDPackagingClient = Object.freeze({
    ...baseClient,
    request,
    getStatus,
  });

  globalThis.DDPackagingSaveStabilizer = Object.freeze({
    build: BUILD,
    getStatus: () => Object.freeze({
      build: BUILD,
      state: 'active',
      verifiedSaveCount,
      failedVerificationCount,
      lastVerification,
      previewBindCount,
      identitySyncCount,
      identityIsDerived: byId('packagingIdentityEn')?.dataset.build300DerivedIdentity === 'true',
      previewContainsIdentity: Boolean(text(byId('packagingIdentityEn')?.value) && text(byId('packagingSvgPreview')?.textContent).includes(text(byId('packagingIdentityEn')?.value))),
      lastPreviewReason,
    }),
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEditor, { once: true });
  else watchEditor();
})();
