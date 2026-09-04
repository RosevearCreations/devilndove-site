// Devil n Dove Build 301 Packaging compatibility checkpoint.
// Build 301 is the single live browser compatibility identity for the Packaging page.
// Older build numbers remain visible as implementation provenance only; this layer does
// not replace, copy, or mutate the proven Build 297/298/300 runtime authorities.
// Release 467 Build 42 loads its additive Material Template Intelligence layer here.
// Release 467 Build 43 then loads its additive Label Composition & Overrides layer here.
(() => {
  const BUILD = 301;
  const MATERIAL_INTELLIGENCE_BUILD = 42;
  const LABEL_COMPOSITION_BUILD = 43;
  const EXPECTED = Object.freeze({
    startupGateBuild: 297,
    clientTransportBuild: 297,
    nativeClientBuild: 298,
    stabilizationBuild: 300,
    editorImplementationBuild: 298,
    nativeReadGatewayBuild: 293,
    nativeReadImplementationBuild: 286,
    nativeWriteGatewayBuild: 292,
    nativeWriteServiceBuild: 291,
  });

  const safeStatus = (target) => {
    try { return target?.getStatus?.() || null; }
    catch { return null; }
  };

  function snapshot() {
    const gate = safeStatus(globalThis.DDPackagingStartupGate);
    const contracts = safeStatus(globalThis.DDPackagingContracts);
    const client = safeStatus(globalThis.DDPackagingClient);
    const stabilizer = safeStatus(globalThis.DDPackagingSaveStabilizer);
    const materialIntelligence = safeStatus(globalThis.DDPackagingMaterialIntelligence);
    const labelComposition = safeStatus(globalThis.DDPackagingLabelComposition);

    const active = Boolean(
      Number(gate?.build || 0) === EXPECTED.startupGateBuild
      && Number(contracts?.clientTransportBuild || 0) === EXPECTED.clientTransportBuild
      && Number(client?.build || 0) === EXPECTED.nativeClientBuild
      && Number(client?.stabilizationBuild || stabilizer?.build || 0) === EXPECTED.stabilizationBuild
      && client?.nativeClient === true
      && client?.ownerContractsReady === true
      && client?.nativeBootstrapPath === '/api/admin/packaging-bootstrap'
      && client?.nativeWritePath === '/api/admin/packaging-write'
      && client?.legacyRouteNamedByClient === false
      && Number(client?.failedVerificationCount ?? stabilizer?.failedVerificationCount ?? 0) === 0
    );

    return Object.freeze({
      build: BUILD,
      state: active ? 'active' : 'waiting-for-proven-packaging-stack',
      compatibilityCheckpoint: true,
      singleConversationBuild: BUILD,
      implementationProvenance: EXPECTED,
      startupGateReady: Boolean(gate?.runtimeReady),
      clientTransportReady: Boolean(contracts?.clientTransportReady),
      nativeClientReady: Boolean(client?.nativeClient && client?.ownerContractsReady),
      saveVerificationActive: Boolean(client?.saveVerificationActive || stabilizer?.state === 'active'),
      previewStabilizationActive: Boolean(stabilizer?.state === 'active'),
      verifiedSaveCount: Number(client?.verifiedSaveCount ?? stabilizer?.verifiedSaveCount ?? 0),
      failedVerificationCount: Number(client?.failedVerificationCount ?? stabilizer?.failedVerificationCount ?? 0),
      previewMode: client?.previewMode ?? stabilizer?.previewMode ?? null,
      previewAuditCount: Number(client?.previewAuditCount ?? stabilizer?.previewAuditCount ?? 0),
      forcedPreviewRefreshCount: Number(client?.forcedPreviewRefreshCount ?? stabilizer?.forcedPreviewRefreshCount ?? 0),
      nativeReadCount: Number(client?.readCount || 0),
      nativeReadStatus: Number(client?.lastReadStatus || 0),
      nativeWriteCount: Number(client?.writeCount || 0),
      nativeWriteStatus: Number(client?.lastWriteStatus || 0),
      lastWriteBoundary: client?.lastWriteBoundary || null,
      materialIntelligenceBuild: Number(materialIntelligence?.build || client?.materialIntelligenceBuild || 0) || null,
      materialIntelligenceActive: Boolean(materialIntelligence?.state === 'active' || client?.materialIntelligenceActive),
      materialIntelligenceNormalizationFailures: Number(materialIntelligence?.normalizationFailureCount ?? client?.normalizationFailureCount ?? 0),
      labelCompositionBuild: Number(labelComposition?.build || 0) || null,
      labelCompositionActive: Boolean(labelComposition?.state === 'active'),
      labelCompositionAuthoritativeReadback: Boolean(labelComposition?.authoritativeReadback),
      labelCompositionFailures: Number(labelComposition?.failureCount || 0),
      legacyCompatibilityTraffic: Object.freeze({
        delayed: Number(gate?.delayedLegacyRequests || 0),
        replayed: Number(gate?.replayedLegacyRequests || 0),
        blocked: Number(gate?.blockedLegacyRequests || 0),
      }),
      productionContactedByCheckpoint: false,
    });
  }

  function publishState() {
    const status = snapshot();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.ddPackagingCompatibilityBuild = String(BUILD);
      document.documentElement.dataset.ddPackagingCompatibilityState = status.state;
      if (document.body) {
        document.body.dataset.ddPackagingCompatibilityBuild = String(BUILD);
        document.body.dataset.ddPackagingCompatibilityState = status.state;
      }
      if (typeof CustomEvent !== 'undefined') {
        document.dispatchEvent(new CustomEvent('dd:packaging-compatibility-active', {
          detail: status,
        }));
      }
    }
    return status;
  }

  function loadLabelComposition() {
    if (typeof document === 'undefined') return;
    if (!String(globalThis.location?.pathname || '').includes('/admin/packaging-studio')) return;
    if (document.querySelector('script[data-dd-packaging-label-composition]')) return;
    const script = document.createElement('script');
    script.src = '/public/js/admin-packaging-label-composition-v43.js?v=46743';
    script.async = false;
    script.dataset.ddPackagingLabelComposition = String(LABEL_COMPOSITION_BUILD);
    script.addEventListener('load', publishState, { once: true });
    document.head.appendChild(script);
  }

  function loadMaterialIntelligence() {
    if (typeof document === 'undefined') return;
    if (!String(globalThis.location?.pathname || '').includes('/admin/packaging-studio')) return;
    const existing = document.querySelector('script[data-dd-packaging-material-intelligence]');
    if (existing) { loadLabelComposition(); return; }
    const script = document.createElement('script');
    script.src = '/public/js/admin-packaging-material-intelligence-v42.js?v=46742';
    script.async = false;
    script.dataset.ddPackagingMaterialIntelligence = String(MATERIAL_INTELLIGENCE_BUILD);
    script.addEventListener('load', () => { publishState(); loadLabelComposition(); }, { once: true });
    document.head.appendChild(script);
  }

  globalThis.DDPackagingCompatibility = Object.freeze({
    build: BUILD,
    getStatus: snapshot,
    refreshStatus: publishState,
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('dd:packaging-client-transport-active', publishState);
    document.addEventListener('dd:packaging-contract-bootstrap', publishState);
    document.addEventListener('dd:packaging-native-client-write', publishState);
    document.addEventListener('dd:packaging-material-intelligence-active', publishState);
    document.addEventListener('dd:packaging-label-composition-active', publishState);
    document.addEventListener('input', (event) => {
      if (event?.target?.closest?.('#packagingStudioMain')) queueMicrotask(publishState);
    }, { passive: true });
  }

  loadMaterialIntelligence();
  queueMicrotask(publishState);
})();
