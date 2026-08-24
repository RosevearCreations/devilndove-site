// Devil n Dove Build 299 Packaging native client launcher.
// Exposes the same mature-editor facade as Build 298 while loading the Build 299
// runtime-native client that no longer depends on Build 297 readiness machinery.
(() => {
  const BUILD = 299;
  let modulePromise = null;

  function loadModule() {
    if (!modulePromise) {
      modulePromise = import('/public/js/modules/packaging/native-client-v299.mjs?v=299');
    }
    return modulePromise;
  }

  async function request(body = null, projectId = 0) {
    const runtime = await loadModule();
    return runtime.request(body, projectId);
  }

  function getStatus() {
    const status = globalThis.DDPackagingNativeClientRuntimeV299?.getStatus?.();
    return status || Object.freeze({
      build: BUILD,
      state: modulePromise ? 'loading' : 'not-loaded',
      nativeClient: true,
      runtimeDependencyEvent: 'dd:packaging-runtime-active',
      runtimeBuild: 0,
      runtimeState: 'not-ready',
      build297ReadinessDependency: false,
      legacyCompatibilityScriptsRequired: false,
      nativeBootstrapPath: '/api/admin/packaging-bootstrap',
      nativeWritePath: '/api/admin/packaging-write',
      legacyRouteNamedByClient: false,
      ownerContractsReady: false,
      readCount: 0,
      writeCount: 0,
      lastReadStatus: 0,
      lastWriteStatus: 0,
      lastReadError: '',
      lastWriteError: '',
      lastWriteBoundary: null,
    });
  }

  globalThis.DDPackagingClient = Object.freeze({
    build: BUILD,
    request,
    getStatus,
    getBootstrapStatus: () => globalThis.DDPackagingNativeClientRuntimeV299?.getBootstrapStatus?.() || null,
  });
})();
