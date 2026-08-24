// Devil n Dove Build 300 Packaging save + preview stabilization.
// Save Project is verified by a fresh native read-back before success is shown.
// The live soap preview is fitted to the editor width by default so the far-right
// claims panel remains visible after rerenders; print/export dimensions are unchanged.
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
  let lastVerifiedClaims = Object.freeze([]);
  let hasVerifiedSave = false;

  let previewBindCount = 0;
  let identitySyncCount = 0;
  let previewAuditCount = 0;
  let forcedPreviewRefreshCount = 0;
  let previewFitCount = 0;
  let lastPreviewReason = '';
  let lastPreviewAudit = null;
  let previewMode = 'fit';
  let previewAuditScheduled = false;

  const text = (value) => String(value ?? '').trim();
  const byId = (name) => document.getElementById(name);
  const canonical = (value) => text(value).toLowerCase().replace(/\s+/g, '');

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

  function claimsFromDom() {
    return normalizeClaims([...document.querySelectorAll('[data-soap-claim-row]')].map((row, index) => ({
      sort_order: index + 1,
      claim_en: row.querySelector('[data-field="claim_en"]')?.value || '',
      claim_fr: row.querySelector('[data-field="claim_fr"]')?.value || '',
      icon_name: row.querySelector('[data-field="icon_name"]')?.value || '',
      is_approved: row.querySelector('[data-field="is_approved"]')?.checked ? 1 : 0,
      compliance_note: row.querySelector('[data-field="compliance_note"]')?.value || '',
    })));
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

    hasVerifiedSave = true;
    lastVerifiedClaims = Object.freeze(actualClaims.map((row) => Object.freeze({ ...row })));
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
  }

  function claimAppearsInPreview(claim, previewCanonical) {
    const source = text(claim?.claim_en) || text(claim?.claim_fr);
    const needle = canonical(source).slice(0, 28);
    return !needle || previewCanonical.includes(needle);
  }

  function ensurePreviewControls() {
    const mount = byId('packagingSvgPreview');
    if (!mount) return null;

    let controls = document.querySelector('[data-build300-preview-controls]');
    if (!controls) {
      controls = document.createElement('div');
      controls.dataset.build300PreviewControls = 'true';
      controls.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 10px;padding:9px 10px;border:1px solid rgba(184,138,47,.38);border-radius:10px;background:rgba(184,138,47,.07)';
      controls.innerHTML = '<strong>Live preview</strong><span data-build300-preview-status class="small" style="flex:1 1 280px">Checking rendered label…</span><button class="btn" type="button" data-build300-preview-fit>Fit full label</button><button class="btn" type="button" data-build300-preview-detail>Detail / scroll</button>';
      mount.insertAdjacentElement('beforebegin', controls);

      controls.querySelector('[data-build300-preview-fit]')?.addEventListener('click', () => {
        previewMode = 'fit';
        applyPreviewMode();
        schedulePreviewAudit('fit-button', false);
      });
      controls.querySelector('[data-build300-preview-detail]')?.addEventListener('click', () => {
        previewMode = 'detail';
        applyPreviewMode();
        schedulePreviewAudit('detail-button', false);
      });
    }

    return controls;
  }

  function applyPreviewMode() {
    const mount = byId('packagingSvgPreview');
    const svg = mount?.querySelector('svg');
    if (!mount || !svg) return;

    const isSoap = svg.dataset.soapLayout === 'reference-v3';
    if (!isSoap) return;

    if (previewMode === 'fit') {
      mount.style.setProperty('overflow-x', 'hidden');
      svg.style.setProperty('width', '100%', 'important');
      svg.style.setProperty('min-width', '0', 'important');
      svg.style.setProperty('max-width', '100%', 'important');
      svg.style.setProperty('height', 'auto', 'important');
      if (svg.dataset.build300PreviewMode !== 'fit') previewFitCount += 1;
      svg.dataset.build300PreviewMode = 'fit';
      mount.scrollLeft = 0;
    } else {
      mount.style.removeProperty('overflow-x');
      svg.style.removeProperty('width');
      svg.style.removeProperty('min-width');
      svg.style.removeProperty('max-width');
      svg.style.removeProperty('height');
      svg.dataset.build300PreviewMode = 'detail';
    }
  }

  function updatePreviewStatus(audit) {
    const controls = ensurePreviewControls();
    const status = controls?.querySelector('[data-build300-preview-status]');
    if (!status || !audit) return;

    const savePart = audit.dom_matches_verified === null
      ? 'No verified Save Project in this page session yet.'
      : audit.dom_matches_verified
        ? 'Editor matches verified D1 save.'
        : 'Editor differs from the last verified D1 save.';
    const claimPart = audit.preview_claims_match_dom
      ? `${audit.rendered_claim_count}/${audit.preview_claim_target_count} printable claim(s) rendered.`
      : `${audit.rendered_claim_count}/${audit.preview_claim_target_count} printable claim(s) found in SVG.`;
    const modePart = previewMode === 'fit' ? 'Full ribbon fitted to view.' : 'Detail view may require horizontal scrolling.';

    status.textContent = `${savePart} ${claimPart} ${modePart}`;
    controls.style.borderColor = audit.preview_claims_match_dom ? 'rgba(85,190,126,.48)' : 'rgba(220,103,103,.6)';
    controls.style.background = audit.preview_claims_match_dom ? 'rgba(85,190,126,.07)' : 'rgba(220,103,103,.08)';
  }

  function auditPreview(reason = 'audit', allowForce = true) {
    previewAuditCount += 1;
    lastPreviewReason = reason;

    ensurePreviewControls();
    applyPreviewMode();

    const mount = byId('packagingSvgPreview');
    const svg = mount?.querySelector('svg');
    const domClaims = claimsFromDom();
    const printableClaims = domClaims.slice(0, 4);
    const previewCanonical = canonical(mount?.textContent);
    const renderedClaimCount = printableClaims.filter((claim) => claimAppearsInPreview(claim, previewCanonical)).length;
    const previewClaimsMatchDom = Boolean(svg) && renderedClaimCount === printableClaims.length;
    const domMatchesVerified = hasVerifiedSave ? claimsEqual(lastVerifiedClaims, domClaims) : null;

    lastPreviewAudit = Object.freeze({
      reason,
      preview_svg_present: Boolean(svg),
      preview_mode: previewMode,
      dom_claim_count: domClaims.length,
      verified_claim_count: hasVerifiedSave ? lastVerifiedClaims.length : null,
      preview_claim_target_count: printableClaims.length,
      rendered_claim_count: renderedClaimCount,
      preview_claims_match_dom: previewClaimsMatchDom,
      dom_matches_verified: domMatchesVerified,
    });

    updatePreviewStatus(lastPreviewAudit);

    if (!previewClaimsMatchDom && printableClaims.length && allowForce) {
      const field = document.querySelector('[data-soap-claim-row] [data-field="claim_en"], [data-soap-claim-row] [data-field="claim_fr"]');
      if (field) {
        forcedPreviewRefreshCount += 1;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        schedulePreviewAudit('forced-claim-render', false);
      }
    }

    return lastPreviewAudit;
  }

  function schedulePreviewAudit(reason = 'scheduled', allowForce = true) {
    if (previewAuditScheduled) return;
    previewAuditScheduled = true;
    const run = () => {
      previewAuditScheduled = false;
      auditPreview(reason, allowForce);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(run));
    else setTimeout(run, 0);
  }

  function bindPreviewAuditEvents() {
    const main = byId('packagingStudioMain');
    if (!main || main.dataset.build300PreviewAuditBound === 'true') return;
    main.dataset.build300PreviewAuditBound = 'true';

    const relevant = (target) => Boolean(target?.closest?.(
      '[data-soap-claim-row], #packagingProductName, #packagingIdentityEn, #packagingIdentityFr, #packagingSubtitle, #packagingNetQuantity, #packagingWebsite, #packagingRoseColour, #packagingRoseAsset'
    ));
    main.addEventListener('input', (event) => {
      if (relevant(event.target)) schedulePreviewAudit('editor-input');
    });
    main.addEventListener('change', (event) => {
      if (relevant(event.target)) schedulePreviewAudit('editor-change');
    });
  }

  function watchEditor() {
    const main = byId('packagingStudioMain');
    if (!main || typeof MutationObserver === 'undefined') return;

    bindPreviewAuditEvents();
    const observer = new MutationObserver(() => {
      bindPreviewIdentity();
      ensurePreviewControls();
      schedulePreviewAudit('editor-render');
    });
    observer.observe(main, { childList: true, subtree: true });

    bindPreviewIdentity();
    ensurePreviewControls();
    schedulePreviewAudit('initial');
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
      previewMode,
      previewAuditCount,
      forcedPreviewRefreshCount,
      previewFitCount,
      lastPreviewAudit,
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
    auditPreview: () => auditPreview('manual', true),
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
      previewMode,
      previewAuditCount,
      forcedPreviewRefreshCount,
      previewFitCount,
      lastPreviewAudit,
      lastPreviewReason,
    }),
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchEditor, { once: true });
  else watchEditor();
})();
