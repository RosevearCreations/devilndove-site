// Devil n Dove Build 287 Packaging runtime composition.
// Build 286 remains the proven data/API boundary. Build 287 layers a Content-owned
// artwork picker over the existing Packaging artwork_asset draft field.

import * as base from './index.mjs';
import { createPackagingArtworkPicker, normalizeContentArtworkRows } from './artwork-picker.mjs';

const BUILD = 287;
const REQUIRED_CONTRACTS = Object.freeze(['inventory-read', 'catalog-read', 'content-media']);

let baseFacade = null;
let picker = null;
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
    requiredContracts: REQUIRED_CONTRACTS,
    readCatalog,
    readInventory,
    readContentMedia,
    refreshArtworkMedia,
    getAvailableContentMedia: () => currentArtworkRows(),
    getBootstrapStatus: bootstrapStatus,
    getArtworkPickerStatus: () => picker?.getStatus?.() || Object.freeze({ build: BUILD, started: false, mounted: false, availableCount: currentArtworkRows().length }),
    getStatus,
  });
}

export const metadata = Object.freeze({
  id: 'packaging',
  build: BUILD,
  baseBuild: 286,
  routePrefix: '/admin/packaging-studio',
  bootstrapPath: '/api/admin/packaging-bootstrap',
  requiredContracts: REQUIRED_CONTRACTS,
  behaviorMode: 'content-artwork-picker-runtime',
});

export async function readCatalog(options = {}) { return base.readCatalog(options); }
export async function readInventory(options = {}) { return base.readInventory(options); }
export async function readContentMedia(options = {}) { return base.readContentMedia(options); }

export async function onLoad(context = {}) {
  await base.onLoad(context);
  baseFacade = typeof window !== 'undefined' ? window.DDPackagingContracts || null : null;
  ensurePicker();
  installBrowserFacade();
  emit('dd:packaging-runtime-loaded', {
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: 286,
    contentArtworkPicker: true,
  });
}

export async function onActivate(context = {}) {
  await base.onActivate(context);
  installBootstrapListener();
  ensurePicker().start();
  installBrowserFacade();
  emit('dd:packaging-runtime-active', {
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: 286,
    contentArtworkPicker: true,
    availableArtworkCount: currentArtworkRows().length,
  });
}

export async function onDeactivate(context = {}) {
  removeBootstrapListener();
  picker?.stop?.();
  refreshedArtworkRows = null;
  await base.onDeactivate(context);
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
  return Object.freeze({
    ...baseStatus,
    moduleId: 'packaging',
    build: BUILD,
    baseBuild: Number(baseStatus?.build || 286),
    behaviorMode: metadata.behaviorMode,
    artworkPickerMounted: Boolean(pickerStatus?.mounted),
    artworkPickerStarted: Boolean(pickerStatus?.started),
    contentArtworkCount: currentArtworkRows().length,
    artworkPicker: pickerStatus,
  });
}
