// Devil n Dove Build 297 post-activation Packaging client transport.
// Layers over the proven Build 296 runtime. Compatibility GETs use the Build 297
// native read transport; compatibility POSTs keep the proven Build 296/289 path.

import { createPackagingNativeReadTransport } from './native-read-transport.mjs?v=297';

const BUILD = 297;
const LEGACY_PACKAGING_PATH = '/api/admin/packaging-studio';
const ACTIVE_EVENT = 'dd:packaging-client-transport-active';

let previousFacade = null;
let nativeRead = null;
let authOwner = null;
let previousApiFetch = null;
let bridgedApiFetch = null;
let installed = false;
let facadeRepairListenersInstalled = false;

function rawRequestUrl(input) {
  return typeof input === 'string' ? input : String(input?.url || '');
}

function requestUrl(input) {
  const raw = rawRequestUrl(input);
  if (!raw) return null;
  try {
    return new URL(raw, globalThis.location?.origin || 'https://devilndove.invalid');
  } catch {
    return null;
  }
}

function requestPath(input) {
  return requestUrl(input)?.pathname || rawRequestUrl(input).split(/[?#]/, 1)[0] || '';
}

function requestMethod(input, init = {}) {
  return String(init?.method || input?.method || 'GET').toUpperCase();
}

function isCompatibilityRequest(input, init = {}) {
  const method = requestMethod(input, init);
  return requestPath(input) === LEGACY_PACKAGING_PATH && (method === 'GET' || method === 'POST');
}

function capturePreviousFacade() {
  const facade = globalThis.DDPackagingContracts || null;
  const status = facade?.getStatus?.() || null;
  if (
    facade
    && typeof facade.transportLegacyRequest === 'function'
    && Number(status?.clientTransportBuild || 0) === 296
  ) {
    previousFacade = facade;
  }
  return previousFacade;
}

function ensureNativeRead() {
  if (nativeRead) return nativeRead;
  const facade = capturePreviousFacade();
  if (!facade) return null;
  nativeRead = createPackagingNativeReadTransport({
    readCatalog: facade.readCatalog,
    readInventory: facade.readInventory,
    readContentMedia: facade.readContentMedia,
  });
  return nativeRead;
}

function previousStatus() {
  try { return capturePreviousFacade()?.getStatus?.() || null; }
  catch { return null; }
}

function getStatus() {
  const prior = previousStatus() || {};
  const reads = ensureNativeRead()?.getStatus?.() || {};
  return Object.freeze({
    ...prior,
    clientTransportBuild: BUILD,
    nativeReadTransportBuild: BUILD,
    legacyGetFallbackRemovalBuild: BUILD,
    legacyGetFallbackRemoved: true,
    legacyServerGetReachable: false,
    postActivationTransportArmed: Boolean(installed && bridgedApiFetch && authOwner?.apiFetch === bridgedApiFetch),
    clientTransportReady: Boolean(
      prior?.state === 'active'
      && prior?.legacyGetGuardArmed === true
      && prior?.writeResponseBridgeArmed === true
      && reads?.transportReady === true
      && installed
    ),
    nativeRead: reads,
  });
}

function installFacade() {
  if (typeof window === 'undefined') return;
  const prior = capturePreviousFacade();
  if (!prior) return;
  window.DDPackagingContracts = Object.freeze({
    ...prior,
    clientTransportBuild: BUILD,
    nativeReadTransportBuild: BUILD,
    legacyGetFallbackRemovalBuild: BUILD,
    legacyGetFallbackRemoved: true,
    legacyServerGetReachable: false,
    transportLegacyRequest,
    getBootstrapStatus: () => ensureNativeRead()?.getBootstrapStatus?.() || null,
    getNativeReadStatus: () => ensureNativeRead()?.getStatus?.() || null,
    getStatus,
  });
}

async function transportLegacyRequest(input, init = {}) {
  if (!isCompatibilityRequest(input, init)) {
    throw new Error('Build 297 Packaging client transport only accepts the compatibility GET/POST path.');
  }
  const method = requestMethod(input, init);
  if (method === 'GET') {
    const reads = ensureNativeRead();
    if (!reads) throw new Error('Build 297 native Packaging read transport is unavailable.');
    return reads.transport(input, init);
  }
  const prior = capturePreviousFacade();
  if (!prior || typeof prior.transportLegacyRequest !== 'function') {
    throw new Error('Build 296 Packaging write transport is unavailable.');
  }
  return prior.transportLegacyRequest(input, init);
}

function installOuterTransport() {
  if (installed) return true;
  const auth = globalThis.DDAuth;
  if (!auth || typeof auth.apiFetch !== 'function') return false;

  authOwner = auth;
  previousApiFetch = auth.apiFetch;
  bridgedApiFetch = async function ddPackagingBuild297ClientTransport(input, init) {
    if (isCompatibilityRequest(input, init)) {
      return transportLegacyRequest(input, init);
    }
    return previousApiFetch.call(authOwner, input, init);
  };
  auth.apiFetch = bridgedApiFetch;
  installed = true;
  return true;
}

function removeOuterTransport() {
  if (authOwner && bridgedApiFetch && authOwner.apiFetch === bridgedApiFetch && previousApiFetch) {
    authOwner.apiFetch = previousApiFetch;
  }
  bridgedApiFetch = null;
  previousApiFetch = null;
  authOwner = null;
  installed = false;
}

function repairFacade() {
  capturePreviousFacade();
  queueMicrotask(installFacade);
}

function installFacadeRepairListeners() {
  if (facadeRepairListenersInstalled || typeof document === 'undefined') return;
  document.addEventListener('dd:packaging-contract-bootstrap', repairFacade);
  document.addEventListener('dd:packaging-write-response', repairFacade);
  facadeRepairListenersInstalled = true;
}

function emitActive() {
  if (typeof document === 'undefined' || typeof CustomEvent === 'undefined') return;
  document.dispatchEvent(new CustomEvent(ACTIVE_EVENT, {
    detail: Object.freeze({
      moduleId: 'packaging',
      build: BUILD,
      clientTransportBuild: BUILD,
      legacyGetFallbackRemoved: true,
      legacyServerGetReachable: false,
    }),
  }));
}

function activateIfReady() {
  const facade = capturePreviousFacade();
  const status = facade?.getStatus?.() || null;
  if (!facade || status?.state !== 'active' || Number(status?.clientTransportBuild || 0) !== 296) return false;
  ensureNativeRead();
  if (!installOuterTransport()) return false;
  installFacadeRepairListeners();
  installFacade();
  emitActive();
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('dd:packaging-runtime-active', () => {
    queueMicrotask(activateIfReady);
  });
  document.addEventListener('dd:auth-rejected', removeOuterTransport, { capture: true });
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', removeOuterTransport, { once: true, capture: true });
}
queueMicrotask(activateIfReady);

export const metadata = Object.freeze({
  build: BUILD,
  legacyGetFallbackRemoved: true,
  legacyServerGetReachable: false,
  behaviorMode: 'post-activation-explicit-client-transport',
});

export { activateIfReady, getStatus, transportLegacyRequest };
