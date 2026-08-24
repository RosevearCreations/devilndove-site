// Devil n Dove Build 295 Packaging startup transport gate.
// The mature Packaging editor still emits the legacy-shaped GET/POST request as its
// internal compatibility trigger. Build 295 prevents that trigger from reaching the
// retired server route until the modular read/write bridges are fully active.
(() => {
  const BUILD = 295;
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

  function runtimeStatus() {
    try {
      return globalThis.DDPackagingContracts?.getStatus?.() || null;
    } catch {
      return null;
    }
  }

  function runtimeReady() {
    const status = runtimeStatus();
    return Boolean(
      status
      && status.state === 'active'
      && status.legacyGetGuardArmed === true
      && status.writeResponseBridgeArmed === true
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
      error: 'Packaging modular runtime did not activate. The retired Packaging Studio server route was not contacted.',
      error_code: 'packaging_runtime_not_ready',
      wait_exit_reason: lastWaitExitReason,
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
      return runtimeUnavailableResponse();
    }

    const currentFetch = auth.apiFetch;
    if (currentFetch !== gatedApiFetch && typeof currentFetch === 'function') {
      replayedLegacyRequests += 1;
      return currentFetch.call(auth, input, init);
    }

    blockedLegacyRequests += 1;
    lastWaitExitReason = 'runtime-ready-but-transport-not-replaced';
    return runtimeUnavailableResponse();
  }

  auth.apiFetch = gatedApiFetch;

  globalThis.DDPackagingStartupGate = Object.freeze({
    build: BUILD,
    legacyPath: LEGACY_PACKAGING_PATH,
    behaviorMode: 'wait-for-modular-packaging-transport',
    getStatus: () => Object.freeze({
      build: BUILD,
      runtimeReady: runtimeReady(),
      waitTimeoutMs: WAIT_TIMEOUT_MS,
      delayedLegacyRequests,
      replayedLegacyRequests,
      blockedLegacyRequests,
      degradedAuthEvents,
      lastWaitExitReason,
      legacyServerRouteContactedByGate: false,
    }),
  });
})();
