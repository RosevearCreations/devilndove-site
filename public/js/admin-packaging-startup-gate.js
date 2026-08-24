// Devil n Dove Build 296 Packaging client transport adapter.
// The mature Packaging editor still emits the retired compatibility path internally.
// Build 296 waits for the modular Packaging runtime, then calls its explicit transport
// facade directly. It never infers bridge ownership from the mutable DDAuth.apiFetch slot.
(() => {
  const BUILD = 296;
  const LEGACY_PACKAGING_PATH = '/api/admin/packaging-studio';
  const RUNTIME_ACTIVE_EVENT = 'dd:packaging-runtime-active';
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

  function isLegacyPackagingRequest(input, init = {}) {
    const method = requestMethod(input, init);
    return requestPath(input) === LEGACY_PACKAGING_PATH && (method === 'GET' || method === 'POST');
  }

  function contracts() {
    return globalThis.DDPackagingContracts || null;
  }

  function runtimeStatus() {
    try {
      return contracts()?.getStatus?.() || null;
    } catch {
      return null;
    }
  }

  function transportFacade() {
    const facade = contracts();
    return typeof facade?.transportLegacyRequest === 'function'
      ? facade.transportLegacyRequest
      : null;
  }

  function runtimeReady() {
    const status = runtimeStatus();
    return Boolean(
      status
      && status.state === 'active'
      && status.clientTransportBuild === BUILD
      && status.clientTransportReady === true
      && status.legacyGetGuardArmed === true
      && status.writeResponseBridgeArmed === true
      && transportFacade()
    );
  }

  function waitForPackagingRuntime() {
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
        document.removeEventListener(RUNTIME_ACTIVE_EVENT, onRuntimeActive);
        document.removeEventListener(AUTH_REJECTED_EVENT, onAuthRejected);
        document.removeEventListener(AUTH_DEGRADED_EVENT, onAuthDegraded);
        resolve(Boolean(ready));
      };

      const onRuntimeActive = () => {
        if (runtimeReady()) finish(true, 'runtime-active');
      };
      const onAuthRejected = () => finish(false, 'auth-rejected');
      const onAuthDegraded = () => {
        degradedAuthEvents += 1;
        if (runtimeReady()) finish(true, 'runtime-ready-after-degraded-auth');
      };

      document.addEventListener(RUNTIME_ACTIVE_EVENT, onRuntimeActive);
      document.addEventListener(AUTH_REJECTED_EVENT, onAuthRejected);
      document.addEventListener(AUTH_DEGRADED_EVENT, onAuthDegraded);
      timer = setTimeout(() => {
        const ready = runtimeReady();
        finish(ready, ready ? 'timeout-runtime-ready' : 'timeout-runtime-not-ready');
      }, WAIT_TIMEOUT_MS);

      queueMicrotask(() => {
        if (runtimeReady()) finish(true, 'microtask-runtime-ready');
      });
    }).finally(() => {
      waitPromise = null;
    });

    return waitPromise;
  }

  function runtimeUnavailableResponse() {
    return new Response(JSON.stringify({
      ok: false,
      build: BUILD,
      error: 'Packaging modular client transport did not activate. The retired Packaging Studio server route was not contacted.',
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
    if (!isLegacyPackagingRequest(input, init)) {
      return originalApiFetch.call(auth, input, init);
    }

    delayedLegacyRequests += 1;
    const ready = await waitForPackagingRuntime();
    if (!ready) {
      blockedLegacyRequests += 1;
      lastReplayTransport = 'runtime-unavailable';
      return runtimeUnavailableResponse();
    }

    const transport = transportFacade();
    if (typeof transport !== 'function') {
      blockedLegacyRequests += 1;
      lastWaitExitReason = 'runtime-ready-but-client-transport-missing';
      lastReplayTransport = 'none';
      return runtimeUnavailableResponse();
    }

    replayedLegacyRequests += 1;
    lastReplayTransport = 'packaging-client-transport-facade';
    return transport(input, init);
  }

  auth.apiFetch = gatedApiFetch;

  globalThis.DDPackagingStartupGate = Object.freeze({
    build: BUILD,
    legacyPath: LEGACY_PACKAGING_PATH,
    behaviorMode: 'explicit-packaging-client-transport-facade',
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
