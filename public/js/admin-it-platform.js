// Build 443 — safe, read-only I.T. release-obstacle and infrastructure bridge.
// User-triggered reads only. No polling, provider mutation, secret values or premature module enforcement.
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
      detail.textContent = 'The safe readiness endpoint did not return this provider. Keep the Build 443 HOLD open and inspect Public API Health.';
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

  function infrastructureTone(row) {
    if (!row?.configured) return ['NOT CONFIGURED', 'is-fail'];
    if (!row?.reachable) return ['UNREACHABLE', 'is-warning'];
    if (row.kind === 'd1' && !row.schema_ready) return ['SCHEMA HOLD', 'is-warning'];
    if (row.kind === 'r2' && !row.storage_ready) return ['STORAGE HOLD', 'is-warning'];
    return ['READY', 'is-pass'];
  }

  function renderInfrastructureResource(row) {
    const badge = document.querySelector(`[data-infrastructure-state="${clean(row?.binding)}"]`);
    const detail = document.querySelector(`[data-infrastructure-detail="${clean(row?.binding)}"]`);
    if (!badge || !detail) return;
    const [label, tone] = infrastructureTone(row);
    badge.textContent = label;
    badge.className = `it442-state ${tone}`;
    const readiness = row.kind === 'd1'
      ? `schema ready: ${Boolean(row.schema_ready)}${Array.isArray(row.missing_tables) && row.missing_tables.length ? `; missing: ${row.missing_tables.join(', ')}` : ''}`
      : `storage ready: ${Boolean(row.storage_ready)}`;
    detail.textContent = `configured: ${Boolean(row.configured)}; reachable: ${Boolean(row.reachable)}; ${readiness}${row.error ? `; ${clean(row.error)}` : ''}.`;
  }

  function ensureInfrastructureBridge() {
    if (byId('it443InfrastructureBridge')) return;
    const grid = byId('it442ObstacleGrid');
    if (!grid) return;
    const section = document.createElement('section');
    section.id = 'it443InfrastructureBridge';
    section.className = 'it442-obstacle';
    section.setAttribute('aria-labelledby', 'it443InfrastructureHeading');
    section.innerHTML = `
      <div class="it442-card-heading"><div><span class="it442-id">INFRA-443</span><h3 id="it443InfrastructureHeading">Development D1 / R2 authority</h3></div><span class="it442-state is-unknown" id="it443InfrastructureOverall">NOT CHECKED</span></div>
      <p class="small">Every release statically validates <code>wrangler.toml</code>. This browser check adds harmless live D1 read/schema and R2 list evidence. It never returns secret values.</p>
      <p><button class="btn" id="it443RefreshInfrastructure" type="button">Verify D1 / R2 now</button></p>
      <div class="small" id="it443InfrastructureStatus" role="status" aria-live="polite">Live infrastructure has not been checked in this browser session.</div>
      <ul class="small compact-list">
        <li><strong>D1 <code>DB</code>:</strong> <span class="it442-state is-unknown" data-infrastructure-state="DB">NOT CHECKED</span> <span data-infrastructure-detail="DB">configured / reachable / schema-ready evidence pending.</span></li>
        <li><strong>R2 <code>PRODUCT_MEDIA_BUCKET</code>:</strong> <span class="it442-state is-unknown" data-infrastructure-state="PRODUCT_MEDIA_BUCKET">NOT CHECKED</span> <span data-infrastructure-detail="PRODUCT_MEDIA_BUCKET">configured / reachable / storage-ready evidence pending.</span></li>
        <li><strong>R2 <code>CAIP_PRIVATE_MEDIA_BUCKET</code>:</strong> <span class="it442-state is-unknown" data-infrastructure-state="CAIP_PRIVATE_MEDIA_BUCKET">NOT CHECKED</span> <span data-infrastructure-detail="CAIP_PRIVATE_MEDIA_BUCKET">configured / reachable / storage-ready evidence pending.</span></li>
      </ul>`;
    grid.prepend(section);
  }

  async function refreshInfrastructureReadiness() {
    const button = byId('it443RefreshInfrastructure');
    const status = byId('it443InfrastructureStatus');
    const overall = byId('it443InfrastructureOverall');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Running harmless Development D1/R2 probes…';
    try {
      const response = await fetch('/api/admin/infrastructure-readiness', { method: 'GET', cache: 'no-store', credentials: 'same-origin' });
      const contentType = clean(response.headers.get('content-type')).toLowerCase();
      if (!response.ok || !contentType.includes('application/json')) throw new Error(`infrastructure endpoint returned HTTP ${response.status || 'error'} instead of JSON`);
      const payload = await response.json();
      renderInfrastructureResource(payload.d1);
      for (const row of Array.isArray(payload.r2) ? payload.r2 : []) renderInfrastructureResource(row);
      const ready = Boolean(payload.configured && payload.reachable && payload.ready);
      if (overall) {
        overall.textContent = ready ? 'READY' : 'HOLD';
        overall.className = `it442-state ${ready ? 'is-pass' : 'is-warning'}`;
      }
      if (status) status.textContent = ready
        ? 'Development infrastructure passed configured, reachable and schema/storage-ready checks.'
        : 'Development infrastructure returned a HOLD. Use the per-resource status below; do not advance the release until corrected.';
    } catch (error) {
      if (overall) { overall.textContent = 'CHECK FAILED'; overall.className = 'it442-state is-fail'; }
      if (status) status.textContent = `Infrastructure readiness could not be read: ${clean(error?.message || error) || 'unknown error'}. No D1/R2 mutation was attempted.`;
    } finally {
      if (button) button.disabled = false;
    }
  }

  function init() {
    const paymentButton = byId('it442RefreshProviderReadiness');
    if (paymentButton) paymentButton.addEventListener('click', refreshProviderReadiness);
    ensureInfrastructureBridge();
    const infrastructureButton = byId('it443RefreshInfrastructure');
    if (infrastructureButton) infrastructureButton.addEventListener('click', refreshInfrastructureReadiness);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
