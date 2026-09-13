// Release 467 Build 146 — Resilient Cart, Guest Checkout & Payment Recovery.
// UX/failsafe layer only. Build 78 remains the transaction/idempotency authority.
(function () {
  'use strict';

  const BUILD = 146;
  const ATTEMPT_KEY = 'dd_checkout_attempt_v78';
  const CHECKOUT_PATHS = new Set(['/checkout', '/checkout/']);

  if (!CHECKOUT_PATHS.has(window.location.pathname)) return;

  const text = (value) => String(value ?? '').trim();

  function readAttempt() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function ensureStatusCard() {
    let card = document.getElementById('ddCheckoutResilience146');
    if (card) return card;
    card = document.createElement('section');
    card.id = 'ddCheckoutResilience146';
    card.className = 'card';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.style.marginBottom = '18px';
    const anchor = document.getElementById('checkoutRecoveryStatus') || document.getElementById('checkoutMessage');
    if (anchor?.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling);
    else document.querySelector('.container')?.prepend(card);
    return card;
  }

  function describeAttempt(attempt) {
    if (!attempt) return '';
    const orderId = Number(attempt.order_id || 0);
    const stage = text(attempt.stage || attempt.status || '').replaceAll('_', ' ');
    if (orderId > 0) {
      return ` An existing order (${orderId}) is recorded for this checkout attempt. Retry/resume uses the retained Build 78 order-reuse authority instead of starting a second order.`;
    }
    if (attempt.request_key) {
      return ` A previous checkout attempt is saved${stage ? ` at “${stage}”` : ''} and can be resumed after live validation returns.`;
    }
    return '';
  }

  function renderConnectivity(reason = '') {
    const card = ensureStatusCard();
    const submit = document.getElementById('checkoutSubmitButton');
    const attempt = readAttempt();
    const online = navigator.onLine !== false;

    if (!online) {
      if (submit && !submit.disabled) {
        submit.disabled = true;
        submit.dataset.build146OfflineDisabled = '1';
      }
      card.innerHTML = `<strong>Disconnected — checkout is safely paused.</strong><div class="small" style="margin-top:6px">Your cart, guest-checkout form and any existing checkout attempt remain in this browser. Placing an order or preparing payment is locked until a live connection returns. Payment is never queued offline.${describeAttempt(attempt)}</div>`;
      return;
    }

    if (submit?.dataset.build146OfflineDisabled === '1') {
      submit.disabled = false;
      delete submit.dataset.build146OfflineDisabled;
    }

    const restored = reason === 'online'
      ? 'Connection restored. Review the order and press Place Order manually; nothing was submitted automatically.'
      : 'Live validation is available.';
    const guest = window.DDAuth?.isLoggedIn?.()
      ? 'You can continue with the verified account context shown above.'
      : 'Guest checkout is available; creating an account is not required to place an order.';
    card.innerHTML = `<strong>${restored}</strong><div class="small" style="margin-top:6px">${guest} Price, stock, shipping, tax, discounts and Canada-only rules are revalidated by the server when the order is created.${describeAttempt(attempt)}</div>`;
  }

  function blockOfflineSubmit(event) {
    if (navigator.onLine !== false) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const message = document.getElementById('checkoutMessage');
    if (message) {
      message.textContent = 'Checkout is disconnected. Your details are still saved, but an order or payment cannot be submitted until live validation returns.';
      message.style.display = 'block';
      message.style.color = '#b00020';
    }
    renderConnectivity('offline');
  }

  function init() {
    const form = document.getElementById('checkoutForm');
    form?.addEventListener('submit', blockOfflineSubmit, true);
    window.addEventListener('offline', () => renderConnectivity('offline'));
    window.addEventListener('online', () => renderConnectivity('online'));
    document.addEventListener('dd:auth-ready', () => renderConnectivity('auth'));
    renderConnectivity('load');
    document.documentElement.dataset.checkoutResilienceBuild = String(BUILD);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
