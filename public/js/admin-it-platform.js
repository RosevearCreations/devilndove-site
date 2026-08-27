// Build 442 — safe, read-only I.T. release-obstacle bridge.
// This script performs one user-triggered/public readiness read. It never polls, mutates
// provider state, receives secret values or activates Build 442 Phase B enforcement.
(function () {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const clean = (value) => String(value == null ? '' : value).trim();

  function setStatus(message, tone = '') {
    const mount = byId('it442ProviderReadinessStatus');
    if (!mount) return;
    mount.textContent = message;
    mount.dataset.tone = tone;
  }

  function providerRow(rows, code) {
    return rows.find((row) => clean(row?.code).toLowerCase() === code) || null;
  }

  function renderProvider(code, row) {
    const badge = document.querySelector(`[data-provider-state="${code}"]`);
    const detail = document.querySelector(`[data-provider-detail="${code}"]`);
    if (!badge || !detail) return false;

    if (!row) {
      badge.textContent = 'CHECK FAILED';
      badge.className = 'it442-state is-fail';
      detail.textContent = 'The safe readiness endpoint did not return this provider. Keep the Build 442 HOLD open and inspect Public API Health.';
      return false;
    }

    const ready = Boolean(row.ready);
    const webhookReady = Boolean(row.webhook_ready);
    const mode = clean(row.environment || row.mode).toLowerCase() || 'unknown';
    const expectedMode = code === 'paypal' ? mode === 'sandbox' : ['test', 'sandbox'].includes(mode);
    const configured = ready && webhookReady && expectedMode;

    badge.textContent = configured ? 'CONFIG READY' : 'CONFIG HOLD';
    badge.className = `it442-state ${configured ? 'is-pass' : 'is-warning'}`;
    detail.textContent = `${ready ? 'credentials present' : 'credentials missing'}; ${webhookReady ? 'webhook secret/ID present' : 'webhook secret/ID missing'}; reported environment: ${mode}. Configuration readiness is not end-to-end payment acceptance.`;
    return configured;
  }

  async function refreshProviderReadiness() {
    const button = byId('it442RefreshProviderReadiness');
    if (button) button.disabled = true;
    setStatus('Checking safe provider readiness…');
    try {
      const response = await fetch('/api/payment-providers', { method: 'GET', cache: 'no-store', credentials: 'same-origin' });
      const contentType = clean(response.headers.get('content-type')).toLowerCase();
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(`readiness endpoint returned HTTP ${response.status || 'error'} instead of JSON`);
      }
      const payload = await response.json();
      const rows = Array.isArray(payload?.providers) ? payload.providers : [];
      const stripeReady = renderProvider('stripe', providerRow(rows, 'stripe'));
      const paypalReady = renderProvider('paypal', providerRow(rows, 'paypal'));
      const readyCount = Number(stripeReady) + Number(paypalReady);
      setStatus(
        `Safe configuration check complete: ${readyCount}/2 payment providers report credentials, webhook configuration and the expected Development mode. End-to-end checkout/replay evidence remains required.`,
        readyCount === 2 ? 'ok' : 'warning'
      );
    } catch (error) {
      renderProvider('stripe', null);
      renderProvider('paypal', null);
      setStatus(`Safe payment readiness could not be read: ${clean(error?.message || error) || 'unknown error'}. No provider mutation was attempted.`, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function init() {
    const button = byId('it442RefreshProviderReadiness');
    if (button) button.addEventListener('click', refreshProviderReadiness);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
