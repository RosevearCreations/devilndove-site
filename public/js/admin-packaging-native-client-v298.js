// Devil n Dove Build 298 Packaging native client launcher.
// Exposes a synchronous browser facade immediately; native module loading is lazy so
// the mature editor can call DDPackagingClient.request() safely during DOMContentLoaded.
(() => {
  const BUILD = 298;
  let modulePromise = null;

  function loadModule() {
    if (!modulePromise) {
      modulePromise = import('/public/js/modules/packaging/native-client-v298.mjs?v=440');
    }
    return modulePromise;
  }

  async function request(body = null, projectId = 0) {
    const runtime = await loadModule();
    return runtime.request(body, projectId);
  }

  function getStatus() {
    const status = globalThis.DDPackagingNativeClientRuntime?.getStatus?.();
    return status || Object.freeze({
      build: BUILD,
      state: modulePromise ? 'loading' : 'not-loaded',
      nativeClient: true,
      nativeBootstrapPath: '/api/admin/packaging-bootstrap',
      nativeWritePath: '/api/admin/packaging-write',
      legacyRouteNamedByClient: false,
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
    getBootstrapStatus: () => globalThis.DDPackagingNativeClientRuntime?.getBootstrapStatus?.() || null,
  });
})();
