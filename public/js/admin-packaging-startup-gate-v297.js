// Devil n Dove Build 297 Packaging startup gate.
// Waits for the post-activation Build 297 client transport so the mature editor's
// compatibility GET/POST trigger never reaches the retired server route.
(() => {
  const BUILD = 297;
  const LEGACY_PACKAGING_PATH = '/api/admin/packaging-studio';
  const CLIENT_ACTIVE_EVENT = 'dd:packaging-client-transport-active';
  const AUTH_REJECTED_EVENT = 'dd:auth-rejected';
  const AUTH_DEGRADED_EVENT = 'dd:auth-degraded';
  const WAIT_TIMEOUT_MS = 30000;

  const auth = globalThis.DDAuth;
  if (!auth || typeof auth.apiFetch !== 'function') return;

  const originalApiFetch = auth.apiFetch;
  let waitPromise = null;
  let delayedLegacyRequests = 0;
  let replayedLegacyRequests = 0;
  let blockedLegacyRequests = 0;
  let degradedAuthEvents = 0;
  let lastWaitExitReason = 'not-started';
  let lastReplayTransport = 'none';

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

  function contracts() {
    return globalThis.DDPackagingContracts || null;
  }

  function runtimeStatus() {
    try { return contracts()?.getStatus?.() || null; }
    catch { return null; }
  }

  function transportFacade() {
    const facade = contracts();
    return typeof facade?.transportLegacyRequest === 'function' ? facade.transportLegacyRequest : null;
  }

  function runtimeReady() {
    const status = runtimeStatus();
    return Boolean(
      status
      && status.state === 'active'
      && Number(status.clientTransportBuild || 0) === BUILD
      && Number(status.legacyGetFallbackRemovalBuild || 0) === BUILD
      && status.clientTransportReady === true
      && status.postActivationTransportArmed === true
      && status.legacyGetFallbackRemoved === true
      && status.legacyServerGetReachable === false
      && status.writeResponseBridgeArmed === true
      && transportFacade()
    );
  }

  function waitForRuntime() {
    if (runtimeReady()) {
      lastWaitExitReason = 'already-ready';
      return Promise.resolve(true);
    }
    if (waitPromise) return waitPromise;

    waitPromise = new Promise((resolve) => {
      let settled = false;
      let timer = null;
      const finish = (ready, reason) => {
        if (settled) return;
        settled = true;
        lastWaitExitReason = String(reason || (ready ? 'ready' : 'unavailable'));
        if (timer) clearTimeout(timer);
        document.removeEventListener(CLIENT_ACTIVE_EVENT, onClientActive);
        document.removeEventListener(AUTH_REJECTED_EVENT, onAuthRejected);
        document.removeEventListener(AUTH_DEGRADED_EVENT, onAuthDegraded);
        resolve(Boolean(ready));
      };
      const onClientActive = () => {
        if (runtimeReady()) finish(true, 'client-transport-active');
      };
      const onAuthRejected = () => finish(false, 'auth-rejected');
      const onAuthDegraded = () => {
        degradedAuthEvents += 1;
        if (runtimeReady()) finish(true, 'runtime-ready-after-degraded-auth');
      };

      document.addEventListener(CLIENT_ACTIVE_EVENT, onClientActive);
      document.addEventListener(AUTH_REJECTED_EVENT, onAuthRejected);
      document.addEventListener(AUTH_DEGRADED_EVENT, onAuthDegraded);
      timer = setTimeout(() => {
        const ready = runtimeReady();
        finish(ready, ready ? 'timeout-runtime-ready' : 'timeout-runtime-not-ready');
      }, WAIT_TIMEOUT_MS);
      queueMicrotask(() => {
        if (runtimeReady()) finish(true, 'microtask-runtime-ready');
      });
    }).finally(() => { waitPromise = null; });

    return waitPromise;
  }

  function unavailableResponse() {
    return new Response(JSON.stringify({
      ok: false,
      build: BUILD,
      error: 'Packaging Build 297 client transport did not activate. The retired Packaging Studio server route was not contacted.',
      error_code: 'packaging_client_transport_not_ready',
      wait_exit_reason: lastWaitExitReason,
      replay_transport: lastReplayTransport,
      legacy_server_route_contacted: false,
    }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  async function gatedApiFetch(input, init) {
    if (!isCompatibilityRequest(input, init)) {
      return originalApiFetch.call(auth, input, init);
    }

    delayedLegacyRequests += 1;
    const ready = await waitForRuntime();
    if (!ready) {
      blockedLegacyRequests += 1;
      lastReplayTransport = 'runtime-unavailable';
      return unavailableResponse();
    }

    const transport = transportFacade();
    if (typeof transport !== 'function') {
      blockedLegacyRequests += 1;
      lastWaitExitReason = 'runtime-ready-but-client-transport-missing';
      lastReplayTransport = 'none';
      return unavailableResponse();
    }

    replayedLegacyRequests += 1;
    lastReplayTransport = 'packaging-client-transport-v297';
    return transport(input, init);
  }

  auth.apiFetch = gatedApiFetch;

  globalThis.DDPackagingStartupGate = Object.freeze({
    build: BUILD,
    legacyPath: LEGACY_PACKAGING_PATH,
    behaviorMode: 'build297-post-activation-client-transport-gate',
    getStatus: () => Object.freeze({
      build: BUILD,
      runtimeReady: runtimeReady(),
      transportFacadeAvailable: Boolean(transportFacade()),
      waitTimeoutMs: WAIT_TIMEOUT_MS,
      delayedLegacyRequests,
      replayedLegacyRequests,
      blockedLegacyRequests,
      degradedAuthEvents,
      lastWaitExitReason,
      lastReplayTransport,
      legacyServerRouteContactedByGate: false,
    }),
  });
})();
