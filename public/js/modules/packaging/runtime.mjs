// Devil n Dove Build 288 Packaging runtime composition.
// Build 288 retires the legacy broad GET from the active runtime while preserving
// the proven Build 286 narrow-bootstrap bridge, Build 287 Content artwork picker,
// and the mature legacy Packaging POST/write path.

import * as base from './index.mjs';
import { createPackagingArtworkPicker, normalizeContentArtworkRows } from './artwork-picker.mjs';
import { createPackagingLegacyGetRetirementGuard } from './read-retirement.mjs';

const BUILD = 288;
const REQUIRED_CONTRACTS = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);

let baseFacade = null;
let picker = null;
let retirementGuard = null;
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
    build: BUILD,
    state: 'not-created',
    armed: false,
    legacyGetRetired: true,
    activeRuntimeBroadLegacyGetReachable: false,
    blockedLegacyGetCount: 0,
    lastBlockedPath: '',
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
    legacyGetRetirementBuild: BUILD,
    requiredContracts: REQUIRED_CONTRACTS,
    readCatalog,
    readInventory,
    readContentMedia,
    refreshArtworkMedia,
    getAvailableContentMedia: () => currentArtworkRows(),
    getBootstrapStatus: bootstrapStatus,
    getLegacyGetRetirementStatus: retirementStatus,
    getArtworkPickerStatus: () => picker?.getStatus?.() || Object.freeze({ build: 287, started: false, mounted: false, availableCount: currentArtworkRows().length }),
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: 'packaging',
  build: BUILD,
  baseBuild: 286,
  artworkPickerBuild: 287,
  routePrefix: '/admin/packaging-studio',
  bootstrapPath: '/api/admin/packaging-bootstrap',
  writePath: '/api/admin/packaging-studio',
  requiredContracts: REQUIRED_CONTRACTS,
  behaviorMode: 'legacy-get-retired-content-artwork-runtime',
});

export async function readCatalog(options = {}) { return base.readCatalog(options); }
export async function readInventory(options = {}) { return base.readInventory(options); }
export async function readContentMedia(options = {}) { return base.readContentMedia(options); }

export async function onLoad(context = {}) {
  await base.onLoad(context);
  baseFacade = typeof window !== 'undefined' ? window.DDPackagingContracts || null : null;
  ensureRetirementGuard();
  ensurePicker();
  installBrowserFacade();
  emit('dd:packaging-runtime-loaded', {
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: 286,
    artworkPickerBuild: 287,
    legacyGetRetired: true,
  });
}

export async function onActivate(context = {}) {
  const guard = ensureRetirementGuard();

  // Arm before Build 286 activates. Build 286 then captures this guard as its
  // underlying fetch. Healthy legacy-shaped UI GETs are still redirected by the
  // Build 286 bridge to the narrow bootstrap, but any attempted rollback GET is
  // blocked by this guard before it can reach the broad server handler.
  guard.arm();
  try {
    await base.onActivate(context);
  } catch (error) {
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
    legacyGetRetired: true,
    activeRuntimeBroadLegacyGetReachable: false,
    availableArtworkCount: currentArtworkRows().length,
  });
}

export async function onDeactivate(context = {}) {
  removeBootstrapListener();
  picker?.stop?.();
  refreshedArtworkRows = null;

  // Build 286 must deactivate first so it restores the guard that it captured as
  // its underlying fetch. The guard can then safely restore the original DDAuth fetch.
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
  return Object.freeze({
    ...baseStatus,
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: Number(baseStatus?.build || 286),
    artworkPickerBuild: 287,
    legacyGetRetirementBuild: BUILD,
    behaviorMode: metadata.behaviorMode,
    legacyGetRetired: true,
    activeRuntimeBroadLegacyGetReachable: false,
    legacyGetGuardArmed: Boolean(retired.armed),
    blockedLegacyGetCount: Number(retired.blockedLegacyGetCount || 0),
    artworkPickerMounted: Boolean(pickerStatus?.mounted),
    artworkPickerStarted: Boolean(pickerStatus?.started),
    contentArtworkCount: currentArtworkRows().length,
    artworkPicker: pickerStatus,
    legacyGetRetirement: retired,
  });
}
