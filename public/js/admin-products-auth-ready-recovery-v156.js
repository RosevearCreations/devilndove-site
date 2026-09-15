// Release 467 Build 156 — one-shot Product Admin verified-auth startup recovery.
// Repairs the race where Product controllers bind at DOMContentLoaded before the
// administrator session has finished verification. This file never performs a
// mutation itself; it reuses existing Product/cleanup refresh controls after the
// verified admin-ready event and runs at most once per page load.
(() => {
  const path = String(window.location.pathname || '').replace(/\/+$/, '') || '/';
  if (path !== '/admin/products') return;

  const VERSION = 'R467B156_AUTH_READY_RECOVERY_V1';
  const health = {
    version: VERSION,
    verified_event_seen: false,
    recovery_scheduled: false,
    recovery_attempted: false,
    product_refresh_clicked: false,
    cleanup_refresh_clicked: false,
    skipped_already_ready: false,
    last_reason: '',
  };
  window.DDProductsAuthReadyRecoveryHealth = health;

  let finished = false;
  let timer = 0;

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

  function runRecovery(reason) {
    if (finished) return;
    finished = true;
    health.recovery_attempted = true;
    health.last_reason = String(reason || 'verified-admin');

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

  document.addEventListener('dd:admin-ready', (event) => {
    if (!verifiedAdmin(event?.detail || null)) return;
    health.verified_event_seen = true;
    schedule('dd:admin-ready');
  });

  document.addEventListener('dd:auth-verified', (event) => {
    const detail = event?.detail || {};
    if (!detail?.logged_in || String(detail?.user?.role || '').toLowerCase() !== 'admin') return;
    health.verified_event_seen = true;
    schedule('dd:auth-verified');
  });

  const reconcile = () => {
    if (verifiedAdmin()) schedule('retained-verified-state');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reconcile, { once: true });
  else reconcile();
})();
