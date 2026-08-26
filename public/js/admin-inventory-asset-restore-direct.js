// Devil n Dove Build 440 — static Development R2 restore control.
// This controller is intentionally independent of the parity widget. The restore
// button lives directly in admin/inventory-operations/index.html and cannot be
// hidden by parity rendering state. Production safety remains enforced server-side.

(() => {
  const RESTORE_AUTHORIZATION = 'BUILD440_DEV_R2_RESTORE';
  const BATCH_SIZE = 8;
  const MAX_BATCHES = 150;
  let inFlight = false;

  const byId = (id) => document.getElementById(id);

  function setStatus(message, tone = '') {
    const el = byId('inventoryAssetRestoreStaticStatus');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.classList.toggle('is-error', tone === 'error');
    el.classList.toggle('is-success', tone === 'success');
  }

  function setButtonState({ disabled = false, label = '' } = {}) {
    const button = byId('inventoryAssetRestoreStatic');
    if (!button) return;
    button.disabled = Boolean(disabled);
    button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    button.style.pointerEvents = disabled ? 'none' : 'auto';
    button.style.cursor = disabled ? 'wait' : 'pointer';
    if (label) button.textContent = label;
  }

  async function apiJson(path, init = {}, fallbackMessage = 'Request failed.') {
    if (!window.DDAuth?.apiFetch || !window.DDAuth?.readApiJson) {
      throw new Error('Admin API client is unavailable. Hard-refresh the page and sign in again.');
    }
    const response = await window.DDAuth.apiFetch(path, init);
    return window.DDAuth.readApiJson(response, fallbackMessage);
  }

  async function parity() {
    if (window.DDAuth?.apiJson) {
      return window.DDAuth.apiJson(
        '/api/admin/inventory-asset-parity',
        { method: 'GET' },
        { fallbackMessage: 'Development R2 parity check failed.', dedupe: false, retries: 0, staleOnError: false }
      );
    }
    return apiJson('/api/admin/inventory-asset-parity', { method: 'GET' }, 'Development R2 parity check failed.');
  }

  async function restoreBatch(cursor) {
    return apiJson('/api/admin/inventory-asset-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restore_batch',
        authorization: RESTORE_AUTHORIZATION,
        cursor,
        limit: BATCH_SIZE,
      }),
    }, 'Development R2 restore batch failed.');
  }

  async function runRestore() {
    if (inFlight) return;
    inFlight = true;
    setButtonState({ disabled: true, label: 'Checking Development R2…' });
    setStatus('Checking current Development R2 parity before restore.');

    let processed = 0;
    let restored = 0;
    let already = 0;
    let failed = 0;
    let cursor = 0;

    try {
      const before = await parity();
      const beforeSummary = before?.summary || {};
      const missingBefore = Number(beforeSummary.missing_unique_keys || 0);
      const expectedBefore = Number(beforeSummary.expected_unique_keys || 0);
      const presentBefore = Number(beforeSummary.present_unique_keys || 0);

      if (beforeSummary.listing_truncated) {
        throw new Error('Development R2 listing is truncated; restore stopped fail-closed.');
      }
      if (missingBefore <= 0) {
        setStatus(`Development R2 is already exact: ${presentBefore}/${expectedBefore} expected image keys present, 0 missing.`, 'success');
        return;
      }

      setButtonState({ disabled: true, label: `Restoring ${missingBefore} Development assets…` });
      setStatus(`Starting authorized Development restore: ${presentBefore}/${expectedBefore} present, ${missingBefore} missing.`);

      for (let batchNumber = 1; batchNumber <= MAX_BATCHES; batchNumber += 1) {
        const data = await restoreBatch(cursor);
        const batch = data?.batch || {};
        const nextCursor = Number(data?.next_cursor ?? cursor);

        processed += Number(batch.processed || 0);
        restored += Number(batch.restored_verified || 0);
        already += Number(batch.already_verified || 0);
        failed += Number(batch.failed || 0);

        setStatus(`Development R2 restore: ${processed} rows processed · ${restored} restored + verified · ${already} already verified · ${failed} failed safely · batch ${batchNumber}.`);

        if (data?.done) break;
        if (!Number.isFinite(nextCursor) || nextCursor <= cursor) {
          throw new Error('Restore cursor did not advance; restore stopped fail-closed.');
        }
        cursor = nextCursor;
        if (batchNumber === MAX_BATCHES) {
          throw new Error('Restore reached the bounded batch limit before completion.');
        }
      }

      setButtonState({ disabled: true, label: 'Verifying final Development parity…' });
      const after = await parity();
      const summary = after?.summary || {};
      const expected = Number(summary.expected_unique_keys || 0);
      const present = Number(summary.present_unique_keys || 0);
      const missing = Number(summary.missing_unique_keys || 0);

      if (missing === 0 && expected === present) {
        setStatus(`Development R2 restore complete: ${present}/${expected} expected image keys present, 0 missing.`, 'success');
      } else {
        setStatus(`Development R2 restore completed with exceptions: ${present}/${expected} present, ${missing} missing; ${failed} object-level failure(s) were left unwritten.`, 'error');
      }

      const parityButton = byId('runInventoryAssetParity');
      if (parityButton && !parityButton.disabled) parityButton.click();
    } catch (error) {
      setStatus(error?.message || 'Development R2 restore failed.', 'error');
    } finally {
      inFlight = false;
      setButtonState({ disabled: false, label: 'Restore Development R2 Assets' });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const button = byId('inventoryAssetRestoreStatic');
    if (!button) return;
    button.disabled = false;
    button.setAttribute('aria-disabled', 'false');
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';
    button.addEventListener('click', runRestore);
  });
})();
