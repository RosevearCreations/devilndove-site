// Devil n Dove Build 290 Packaging runtime composition.
// Build 290 keeps the proven Build 286 narrow-bootstrap bridge, Build 287 Content
// artwork picker, Build 288 legacy-GET retirement and Build 289 write bridge while
// physically removing the retired broad Catalog/Inventory reads from server source.

import * as base from './index.mjs';
import { createPackagingArtworkPicker, normalizeContentArtworkRows } from './artwork-picker.mjs';
import { createPackagingLegacyGetRetirementGuard } from './read-retirement.mjs';
import { createPackagingWriteResponseBridge } from './write-response.mjs';

const BUILD = 290;
const WRITE_RESPONSE_BUILD = 289;
const REQUIRED_CONTRACTS = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);

let baseFacade = null;
let picker = null;
let retirementGuard = null;
let writeBridge = null;
let refreshedArtworkRows = null;
let bootstrapListenerInstalled = false;

function emit(name, detail = {}) {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent(name, { detail: Object.freeze({ ...detail }) }));
}

function currentArtworkRows() {
  const rows = refreshedArtworkRows ?? baseFacade?.getAvailableContentMedia?.() ?? [];
  return normalizeContentArtworkRows(rows);
}

function bootstrapStatus() {
  return baseFacade?.getBootstrapStatus?.() || null;
}

function retirementStatus() {
  return retirementGuard?.getStatus?.() || Object.freeze({
    build: 288,
    state: 'not-created',
    armed: false,
    legacyGetRetired: true,
    activeRuntimeBroadLegacyGetReachable: false,
    blockedLegacyGetCount: 0,
    lastBlockedPath: '',
  });
}

function writeStatus() {
  return writeBridge?.getStatus?.() || Object.freeze({
    build: WRITE_RESPONSE_BUILD,
    state: 'not-created',
    armed: false,
    writeResponseDecoupled: true,
    legacyWritePath: '/api/admin/packaging-studio',
    gatewayPath: '/api/admin/packaging-write',
    interceptedWriteCount: 0,
    lastStatus: 0,
    lastBoundary: null,
  });
}

async function refreshArtworkMedia() {
  const result = await base.readContentMedia({ mediaType: 'artwork', limit: 72 });
  refreshedArtworkRows = normalizeContentArtworkRows(result?.rows || []);
  picker?.sync?.();
  installBrowserFacade();
  emit('dd:packaging-artwork-library-refreshed', {
    moduleId: 'packaging',
    build: BUILD,
    count: refreshedArtworkRows.length,
    contract: result?.contract || 'content-media',
  });
  return Object.freeze({
    rows: refreshedArtworkRows,
    count: refreshedArtworkRows.length,
    contract: result?.contract || 'content-media',
  });
}

function handlePackagingBootstrap() {
  refreshedArtworkRows = null;
  picker?.sync?.();
  installBrowserFacade();
}

function installBootstrapListener() {
  if (bootstrapListenerInstalled || typeof document === 'undefined') return;
  document.addEventListener('dd:packaging-contract-bootstrap', handlePackagingBootstrap);
  bootstrapListenerInstalled = true;
}

function removeBootstrapListener() {
  if (!bootstrapListenerInstalled || typeof document === 'undefined') return;
  document.removeEventListener('dd:packaging-contract-bootstrap', handlePackagingBootstrap);
  bootstrapListenerInstalled = false;
}

function ensureRetirementGuard() {
  if (retirementGuard) return retirementGuard;
  retirementGuard = createPackagingLegacyGetRetirementGuard({
    onBlocked: (detail) => {
      emit('dd:packaging-legacy-get-blocked', {
        moduleId: 'packaging',
        build: BUILD,
        ...detail,
      });
    },
  });
  return retirementGuard;
}

function ensureWriteBridge() {
  if (writeBridge) return writeBridge;
  writeBridge = createPackagingWriteResponseBridge({
    onWrite: (detail) => {
      installBrowserFacade();
      emit('dd:packaging-write-response', {
        moduleId: 'packaging',
        build: BUILD,
        ...detail,
      });
    },
  });
  return writeBridge;
}

function ensurePicker() {
  if (picker) return picker;
  picker = createPackagingArtworkPicker({
    getRows: currentArtworkRows,
    refreshRows: refreshArtworkMedia,
    onSelect: (row) => emit('dd:packaging-artwork-selected', {
      moduleId: 'packaging',
      build: BUILD,
      mediaAssetId: Number(row?.media_asset_id || 0) || null,
      artworkUrl: row?.stable_url || '',
    }),
    onClear: () => emit('dd:packaging-artwork-cleared', { moduleId: 'packaging', build: BUILD }),
  });
  return picker;
}

function installBrowserFacade() {
  if (typeof window === 'undefined') return;
  window.DDPackagingContracts = Object.freeze({
    build: BUILD,
    baseBuild: 286,
    artworkPickerBuild: 287,
    legacyGetRetirementBuild: 288,
    writeResponseBuild: WRITE_RESPONSE_BUILD,
    writeGatewayBuild: BUILD,
    legacyBroadReadRemovalBuild: BUILD,
    legacyBroadReadsRemoved: true,
    requiredContracts: REQUIRED_CONTRACTS,
    readCatalog,
    readInventory,
    readContentMedia,
    refreshArtworkMedia,
    getAvailableContentMedia: () => currentArtworkRows(),
    getBootstrapStatus: bootstrapStatus,
    getLegacyGetRetirementStatus: retirementStatus,
    getWriteResponseStatus: writeStatus,
    getArtworkPickerStatus: () => picker?.getStatus?.() || Object.freeze({ build: 287, started: false, mounted: false, availableCount: currentArtworkRows().length }),
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: 'packaging',
  build: BUILD,
  baseBuild: 286,
  artworkPickerBuild: 287,
  legacyGetRetirementBuild: 288,
  writeResponseBuild: WRITE_RESPONSE_BUILD,
  writeGatewayBuild: BUILD,
  legacyBroadReadRemovalBuild: BUILD,
  routePrefix: '/admin/packaging-studio',
  bootstrapPath: '/api/admin/packaging-bootstrap',
  legacyWritePath: '/api/admin/packaging-studio',
  writePath: '/api/admin/packaging-write',
  requiredContracts: REQUIRED_CONTRACTS,
  behaviorMode: 'legacy-broad-read-source-removed-write-response-decoupled-runtime',
});

export async function readCatalog(options = {}) { return base.readCatalog(options); }
export async function readInventory(options = {}) { return base.readInventory(options); }
export async function readContentMedia(options = {}) { return base.readContentMedia(options); }

export async function onLoad(context = {}) {
  await base.onLoad(context);
  baseFacade = typeof window !== 'undefined' ? window.DDPackagingContracts || null : null;
  ensureRetirementGuard();
  ensureWriteBridge();
  ensurePicker();
  installBrowserFacade();
  emit('dd:packaging-runtime-loaded', {
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: 286,
    artworkPickerBuild: 287,
    legacyGetRetirementBuild: 288,
    writeResponseBuild: WRITE_RESPONSE_BUILD,
    legacyBroadReadsRemoved: true,
    writeResponseDecoupled: true,
  });
}

export async function onActivate(context = {}) {
  const guard = ensureRetirementGuard();
  const writes = ensureWriteBridge();

  // Build 288 guard is innermost, Build 286 bootstrap bridge sits above it, and
  // the Build 289 write bridge remains outermost. Build 290 changes server source,
  // not this proven transport order.
  guard.arm();
  try {
    await base.onActivate(context);
    writes.arm();
  } catch (error) {
    writes.disarm();
    try { await base.onDeactivate({ reason: 'build290-activation-failed' }); } catch {}
    guard.disarm();
    throw error;
  }

  installBootstrapListener();
  ensurePicker().start();
  installBrowserFacade();
  emit('dd:packaging-runtime-active', {
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: 286,
    artworkPickerBuild: 287,
    legacyGetRetirementBuild: 288,
    writeResponseBuild: WRITE_RESPONSE_BUILD,
    legacyBroadReadsRemoved: true,
    writeResponseDecoupled: true,
    legacyGetRetired: true,
    activeRuntimeBroadLegacyGetReachable: false,
    availableArtworkCount: currentArtworkRows().length,
  });
}

export async function onDeactivate(context = {}) {
  removeBootstrapListener();
  picker?.stop?.();
  refreshedArtworkRows = null;

  // Unwind in reverse order: Build 289 restores Build 286, Build 286 restores the
  // Build 288 guard, and the guard finally restores the original DDAuth transport.
  writeBridge?.disarm?.();
  await base.onDeactivate(context);
  retirementGuard?.disarm?.();

  installBrowserFacade();
  emit('dd:packaging-runtime-inactive', {
    moduleId: 'packaging',
    build: BUILD,
    reason: String(context?.reason || 'route-lifecycle'),
  });
}

export function getStatus() {
  const baseStatus = base.getStatus();
  const pickerStatus = picker?.getStatus?.() || null;
  const retired = retirementStatus();
  const writes = writeStatus();
  return Object.freeze({
    ...baseStatus,
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: Number(baseStatus?.build || 286),
    artworkPickerBuild: 287,
    legacyGetRetirementBuild: 288,
    writeResponseBuild: WRITE_RESPONSE_BUILD,
    writeGatewayBuild: BUILD,
    legacyBroadReadRemovalBuild: BUILD,
    behaviorMode: metadata.behaviorMode,
    legacyBroadReadsRemoved: true,
    legacyGetRetired: true,
    activeRuntimeBroadLegacyGetReachable: false,
    legacyGetGuardArmed: Boolean(retired.armed),
    blockedLegacyGetCount: Number(retired.blockedLegacyGetCount || 0),
    writeResponseDecoupled: true,
    writeResponseBridgeArmed: Boolean(writes.armed),
    interceptedWriteCount: Number(writes.interceptedWriteCount || 0),
    lastWriteBoundary: writes.lastBoundary || null,
    artworkPickerMounted: Boolean(pickerStatus?.mounted),
    artworkPickerStarted: Boolean(pickerStatus?.started),
    contentArtworkCount: currentArtworkRows().length,
    artworkPicker: pickerStatus,
    legacyGetRetirement: retired,
    writeResponse: writes,
  });
}
