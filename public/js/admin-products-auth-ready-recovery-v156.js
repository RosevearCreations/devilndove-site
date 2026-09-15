// Release 467 Build 156 — one-shot Product Admin authenticated startup recovery.
// Repairs the race where Product controllers bind at DOMContentLoaded before the
// administrator session has finished verification. This file performs no API call
// and no mutation itself; it waits only on local auth state, then reuses the already
// bound Product/cleanup refresh controls exactly once.
(() => {
  const path = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (path !== '/admin/products') return;

  const VERSION = 'R467B156_AUTH_READY_RECOVERY_V3';
  const AUTH_WAIT_TIMEOUT_MS = 8000;
  const AUTH_WAIT_STEP_MS = 250;
  const health = {
    version: VERSION,
    verified_event_seen: false,
    recovery_scheduled: false,
    recovery_attempted: false,
    product_refresh_clicked: false,
    cleanup_refresh_clicked: false,
    skipped_already_ready: false,
    auth_wait_started: false,
    auth_wait_checks: 0,
    auth_wait_logged_in: false,
    auth_wait_exhausted: false,
    last_reason: '',
  };
  window.DDProductsAuthReadyRecoveryHealth = health;

  let finished = false;
  let timer = 0;
  let authWaitTimer = 0;

  function productReady() {
    const picker = document.getElementById('existingProductSelect');
    const rows = document.querySelectorAll('#productsTableBody [data-edit-product-id]').length;
    return rows > 0 || Number(picker?.options?.length || 0) > 1;
  }

  function verifiedAdmin(detail = null) {
    if (detail?.ok === true && detail?.verified === true) {
      return String(detail?.user?.role || '').toLowerCase() === 'admin';
    }
    const state = window.DDAuthUiState || {};
    if (state.verified !== true) return false;
    return String(state?.user?.role || '').toLowerCase() === 'admin';
  }

  function locallyLoggedIn() {
    try {
      return Boolean(window.DDAuth?.isLoggedIn?.());
    } catch {
      return false;
    }
  }

  function clearTimers() {
    if (timer) window.clearTimeout(timer);
    if (authWaitTimer) window.clearTimeout(authWaitTimer);
    timer = 0;
    authWaitTimer = 0;
  }

  function runRecovery(reason) {
    if (finished) return;
    finished = true;
    clearTimers();
    health.recovery_scheduled = false;
    health.recovery_attempted = true;
    health.last_reason = String(reason || 'authenticated');

    if (productReady()) {
      health.skipped_already_ready = true;
      return;
    }

    const refresh = document.querySelector('[data-refresh-products]');
    if (refresh && !refresh.disabled) {
      health.product_refresh_clicked = true;
      refresh.click();
    }

    const cleanup = document.getElementById('refreshProductCleanup');
    if (cleanup && !cleanup.disabled) {
      health.cleanup_refresh_clicked = true;
      cleanup.click();
    }
  }

  function schedule(reason) {
    if (finished || health.recovery_scheduled) return;
    health.recovery_scheduled = true;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      health.recovery_scheduled = false;
      runRecovery(reason);
    }, 100);
  }

  function startBoundedAuthWait() {
    if (finished || health.auth_wait_started) return;
    health.auth_wait_started = true;
    const startedAt = Date.now();

    const check = () => {
      authWaitTimer = 0;
      if (finished) return;
      health.auth_wait_checks += 1;

      if (productReady()) {
        runRecovery('products-already-ready');
        return;
      }

      if (locallyLoggedIn()) {
        health.auth_wait_logged_in = true;
        schedule('bounded-local-auth-wait');
        return;
      }

      if ((Date.now() - startedAt) >= AUTH_WAIT_TIMEOUT_MS) {
        health.auth_wait_exhausted = true;
        health.last_reason = 'bounded-local-auth-wait-exhausted';
        return;
      }

      authWaitTimer = window.setTimeout(check, AUTH_WAIT_STEP_MS);
    };

    authWaitTimer = window.setTimeout(check, AUTH_WAIT_STEP_MS);
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!verifiedAdmin(event?.detail || null)) return;
    health.verified_event_seen = true;
    schedule('dd:admin-ready');
  });

  document.addEventListener('dd:auth-verified', (event) => {
    const detail = event?.detail || {};
    if (!detail?.logged_in) return;
    health.verified_event_seen = true;
    schedule('dd:auth-verified');
  });

  const reconcile = () => {
    if (verifiedAdmin()) schedule('retained-verified-state');
    else if (locallyLoggedIn()) schedule('retained-local-auth-state');
    startBoundedAuthWait();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  else reconcile();
})();
