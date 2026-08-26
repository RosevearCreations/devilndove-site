// Devil n Dove Build 440 — Development R2 restore click hardening.
// This is a page-scoped fallback for the Inventory Operations restore control.
// It removes stale/accidental disabled state and executes the already-authorized
// Development-only bounded restore directly against the native restore endpoint.
// Production safety remains enforced server-side by inventory-asset-restore.js.

(() => {
  const RESTORE_AUTHORIZATION = 'BUILD440_DEV_R2_RESTORE';
  const BATCH_SIZE = 8;
  const MAX_BATCHES = 150;
  const STATUS_ID = 'inventoryAssetDirectRestoreStatus';
  let inFlight = false;

  function restoreButton() {
    return document.getElementById('restoreInventoryAssets');
  }

  function armRestoreButton() {
    const button = restoreButton();
    if (!button) return;
    if (!inFlight) {
      button.disabled = false;
      button.removeAttribute('disabled');
      button.setAttribute('aria-disabled', 'false');
      button.style.pointerEvents = 'auto';
      button.style.cursor = 'pointer';
      button.style.opacity = '1';
    }
  }

  function statusElement() {
    let status = document.getElementById(STATUS_ID);
    if (status) return status;
    const mount = document.getElementById('inventoryAssetParityMount');
    if (!mount) return null;
    status = document.createElement('div');
    status.id = STATUS_ID;
    status.className = 'card small';
    status.style.marginBottom = '12px';
    status.style.padding = '12px';
    status.style.display = 'none';
    mount.parentElement?.insertBefore(status, mount.nextSibling);
    return status;
  }

  function setStatus(message, isError = false) {
    const status = statusElement();
    if (!status) return;
    status.textContent = message || '';
    status.style.display = message ? 'block' : 'none';
    status.classList.toggle('is-error', Boolean(message && isError));
    status.classList.toggle('is-success', Boolean(message && !isError));
  }

  async function readJson(response, fallbackMessage) {
    if (window.DDAuth?.readApiJson) {
      return window.DDAuth.readApiJson(response, fallbackMessage);
    }
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!response.ok) throw new Error(data?.error || fallbackMessage || `Request failed (${response.status}).`);
    return data || {};
  }

  async function postBatch(cursor) {
    if (!window.DDAuth?.apiFetch) throw new Error('Admin API client is not available. Hard-refresh and sign in again.');
    const response = await window.DDAuth.apiFetch('/api/admin/inventory-asset-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restore_batch',
        authorization: RESTORE_AUTHORIZATION,
        cursor,
        limit: BATCH_SIZE,
      }),
    });
    return readJson(response, 'Development R2 restore batch failed.');
  }

  async function refreshParity() {
    const parityButton = document.getElementById('runInventoryAssetParity');
    if (parityButton) {
      parityButton.disabled = false;
      parityButton.removeAttribute('disabled');
      parityButton.click();
    }
  }

  async function runDirectRestore() {
    if (inFlight) return;
    inFlight = true;
    let cursor = 0;
    let processed = 0;
    let restored = 0;
    let already = 0;
    let failed = 0;
    let batches = 0;

    const button = restoreButton();
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.textContent = 'Restoring Development assets…';
    }

    setStatus('Starting authorized Development R2 restore…');

    try {
      for (let batchNumber = 1; batchNumber <= MAX_BATCHES; batchNumber += 1) {
        const data = await postBatch(cursor);
        const batch = data?.batch || {};
        const nextCursor = Number(data?.next_cursor ?? cursor);

        batches = batchNumber;
        processed += Number(batch.processed || 0);
        restored += Number(batch.restored_verified || 0);
        already += Number(batch.already_verified || 0);
        failed += Number(batch.failed || 0);

        setStatus(`Development R2 restore: ${processed} rows processed · ${restored} restored · ${already} already verified · ${failed} failed safely · batch ${batches}.`);

        if (data?.done) break;
        if (!Number.isFinite(nextCursor) || nextCursor <= cursor) {
          throw new Error('Restore cursor did not advance; restore stopped fail-closed.');
        }
        cursor = nextCursor;

        if (batchNumber === MAX_BATCHES) {
          throw new Error('Restore reached the bounded batch limit before completion.');
        }
      }

      setStatus(`Development R2 restore batches finished: ${restored} restored, ${already} already verified, ${failed} failed safely. Refreshing parity…`, failed > 0);
      await refreshParity();
    } catch (error) {
      setStatus(error?.message || 'Development R2 restore failed.', true);
    } finally {
      inFlight = false;
      setTimeout(armRestoreButton, 0);
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('#restoreInventoryAssets');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    runDirectRestore();
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    armRestoreButton();
    statusElement();
    const mount = document.getElementById('inventoryAssetParityMount');
    if (!mount) return;
    const observer = new MutationObserver(() => armRestoreButton());
    observer.observe(mount, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
  });
})();
