// Devil n Dove Build 440 — Development Tool/Supply R2 parity + bounded restore.
// No startup execution or polling. Restore runs only from the explicit Development button.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('inventoryAssetParityMount');
  if (!mount) return;

  const RESTORE_AUTHORIZATION = 'BUILD440_DEV_R2_RESTORE';
  const RESTORE_BATCH_SIZE = 8;
  const MAX_RESTORE_BATCHES = 150;

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  let running = false;
  let restoring = false;
  let result = null;
  let errorMessage = '';
  let restoreMessage = '';
  let restoreStats = { processed: 0, restored: 0, already: 0, bytes: 0, batches: 0 };

  function summaryCard(label, value) {
    return `<div class="card"><span class="small">${esc(label)}</span><div style="font-size:1.35rem;font-weight:800">${esc(value)}</div></div>`;
  }

  function restoreStatusHtml() {
    if (!restoring && !restoreMessage) return '';
    return `
      <div class="card" style="margin-top:12px;padding:12px">
        <strong>${restoring ? 'Development R2 restore in progress' : 'Development R2 restore'}</strong>
        <div class="small" style="margin-top:6px">${esc(restoreMessage || 'Preparing bounded restore…')}</div>
        <div class="small" style="margin-top:6px">
          processed: ${esc(restoreStats.processed)} · restored + verified: ${esc(restoreStats.restored)} ·
          already verified: ${esc(restoreStats.already)} · batches: ${esc(restoreStats.batches)}
        </div>
      </div>`;
  }

  function render() {
    const summary = result?.summary || null;
    const missing = Array.isArray(result?.missing) ? result.missing : [];
    const canRestore = Boolean(summary)
      && Number(summary.missing_unique_keys || 0) > 0
      && Number(summary.unsupported_image_url_rows || 0) === 0
      && !summary.listing_truncated;

    mount.innerHTML = `
      <section class="card" aria-labelledby="inventoryAssetParityHeading" style="margin-bottom:18px">
        <div class="section-heading-row">
          <div>
            <p class="inventory-operations-eyebrow">Development storage proof</p>
            <h3 id="inventoryAssetParityHeading" style="margin:0">Tool &amp; Supply R2 Asset Parity</h3>
            <p class="small">Compare the operational Tool/Supply image authority in <code>site_item_inventory</code> with the bound Development <code>PRODUCT_MEDIA_BUCKET</code>. <code>catalog_items</code> is shown only as drift evidence.</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" type="button" id="runInventoryAssetParity" ${running || restoring ? 'disabled' : ''}>${running ? 'Checking…' : 'Run R2 parity check'}</button>
            ${canRestore ? `<button class="btn primary" type="button" id="restoreInventoryAssets" ${running || restoring ? 'disabled' : ''}>${restoring ? 'Restoring…' : `Restore ${esc(summary.missing_unique_keys)} missing Dev assets`}</button>` : ''}
          </div>
        </div>
        <div id="inventoryAssetParityMessage" class="small ${errorMessage ? 'is-error' : ''}" ${!errorMessage && !result ? 'hidden' : ''}>${esc(errorMessage || (result ? 'Parity check completed against the bound Development bucket.' : ''))}</div>
        ${summary ? `
          <div class="grid cols-4" style="margin-top:12px">
            ${summaryCard('Operational Inventory rows', summary.authority_rows ?? summary.inventory_rows ?? summary.catalog_rows)}
            ${summaryCard('Expected image keys', summary.expected_unique_keys)}
            ${summaryCard('Present in Dev R2', summary.present_unique_keys)}
            ${summaryCard('Missing from Dev R2', summary.missing_unique_keys)}
          </div>
          <div class="small" style="margin-top:10px">
            R2 objects: ${esc(summary.r2_unique_keys)} total (${esc(summary.r2_tool_keys)} Tool / ${esc(summary.r2_supply_keys)} Supply) ·
            canonical Tool namespace: Toolshed ${esc(summary.r2_toolshed_keys ?? 0)} + legacy Tools ${esc(summary.r2_legacy_tool_keys ?? 0)} ·
            blank operational image URLs: ${esc(summary.blank_image_url_rows)} · unsupported operational URLs: ${esc(summary.unsupported_image_url_rows)} ·
            bucket-only keys: ${esc(summary.bucket_only_keys)} · listing truncated: <strong>${summary.listing_truncated ? 'YES — result incomplete' : 'no'}</strong>
          </div>
          <div class="small" style="margin-top:8px">
            <strong>Authority drift:</strong> Catalog rows ${esc(summary.catalog_rows ?? '—')} · Catalog blank image URLs ${esc(summary.catalog_blank_image_url_rows ?? '—')} ·
            Inventory image / Catalog blank ${esc(summary.inventory_only_image_rows ?? '—')} · Catalog image / Inventory blank ${esc(summary.catalog_only_image_rows ?? '—')} ·
            different canonical image keys ${esc(summary.image_authority_mismatch_rows ?? '—')}.
          </div>
          ${canRestore ? '<p class="small" style="margin-top:10px"><strong>Development repair:</strong> restore reads the same active Inventory rows used by Product Tools & Supplies Used, accepts the canonical <code>Toolshed/</code> and <code>Supplies/</code> namespaces, fetches the public source read-only, hashes each image, refuses overwrites, writes only missing objects to the bound Development R2 bucket, and verifies each write.</p>' : ''}
          ${missing.length ? `
            <details style="margin-top:12px" open>
              <summary><strong>Missing Development R2 keys (${esc(summary.missing_unique_keys)})</strong> — showing up to ${esc(result.missing_sample_limit)}</summary>
              <div class="admin-table-wrap" style="margin-top:8px">
                <table>
                  <thead><tr><th>R2 key</th><th>Inventory item</th><th>Kind</th></tr></thead>
                  <tbody>${missing.map((entry) => {
                    const authorityRows = Array.isArray(entry.authority_rows) ? entry.authority_rows : (Array.isArray(entry.catalog_rows) ? entry.catalog_rows : []);
                    const first = authorityRows[0] || null;
                    return `<tr><td><code>${esc(entry.key)}</code></td><td>${esc(first?.name || first?.source_key || '—')}</td><td>${esc(first?.item_kind || '—')}</td></tr>`;
                  }).join('')}</tbody>
                </table>
              </div>
            </details>` : '<p class="small is-success" style="margin-top:12px">No canonical Tool/Supply image keys are missing from the bound Development R2 bucket.</p>'}
        ` : ''}
        ${restoreStatusHtml()}
      </section>`;

    document.getElementById('runInventoryAssetParity')?.addEventListener('click', runParity);
    document.getElementById('restoreInventoryAssets')?.addEventListener('click', runRestore);
  }

  async function fetchParity() {
    return window.DDAuth.apiJson(
      '/api/admin/inventory-asset-parity',
      { method: 'GET' },
      { fallbackMessage: 'Development R2 parity check failed.', dedupe: false, retries: 0, staleOnError: false }
    );
  }

  async function runParity() {
    if (running || restoring || !window.DDAuth?.isLoggedIn()) return;
    running = true;
    errorMessage = '';
    render();
    try {
      result = await fetchParity();
    } catch (error) {
      errorMessage = error?.message || 'Development R2 parity check failed.';
    } finally {
      running = false;
      render();
    }
  }

  async function postRestoreBatch(cursor) {
    const response = await window.DDAuth.apiFetch('/api/admin/inventory-asset-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restore_batch',
        authorization: RESTORE_AUTHORIZATION,
        cursor,
        limit: RESTORE_BATCH_SIZE,
      }),
    });
    return window.DDAuth.readApiJson(response, 'Development R2 restore batch failed.');
  }

  async function runRestore() {
    if (running || restoring || !window.DDAuth?.isLoggedIn()) return;
    if (!result?.summary || Number(result.summary.missing_unique_keys || 0) <= 0) return;
    if (result.summary.listing_truncated) {
      errorMessage = 'Parity listing is truncated; restore is blocked until the complete Development R2 state can be measured.';
      render();
      return;
    }
    if (Number(result.summary.unsupported_image_url_rows || 0) > 0) {
      errorMessage = 'Operational Inventory contains unsupported image URLs; restore is blocked until those rows are reviewed.';
      render();
      return;
    }

    restoring = true;
    errorMessage = '';
    restoreMessage = 'Starting native Development restore from operational Inventory authority.';
    restoreStats = { processed: 0, restored: 0, already: 0, bytes: 0, batches: 0 };
    render();

    let cursor = 0;
    try {
      for (let batchNumber = 1; batchNumber <= MAX_RESTORE_BATCHES; batchNumber += 1) {
        const data = await postRestoreBatch(cursor);
        const batch = data?.batch || {};
        const nextCursor = Number(data?.next_cursor || cursor);

        restoreStats.processed += Number(batch.processed || 0);
        restoreStats.restored += Number(batch.restored_verified || 0);
        restoreStats.already += Number(batch.already_verified || 0);
        restoreStats.bytes += Number(batch.bytes_restored || 0);
        restoreStats.batches = batchNumber;
        restoreMessage = `Verified ${restoreStats.restored + restoreStats.already} operational image objects in Development R2.`;
        render();

        if (data?.done) break;
        if (nextCursor <= cursor) throw new Error('Development restore cursor did not advance; restore stopped fail-closed.');
        cursor = nextCursor;

        if (batchNumber === MAX_RESTORE_BATCHES) {
          throw new Error('Development restore exceeded the bounded batch limit; restore stopped fail-closed.');
        }
      }

      restoreMessage = 'Restore batches completed. Running final bound-bucket parity proof…';
      render();
      result = await fetchParity();
      const remaining = Number(result?.summary?.missing_unique_keys || 0);
      const expected = Number(result?.summary?.expected_unique_keys || 0);
      const present = Number(result?.summary?.present_unique_keys || 0);
      if (remaining !== 0 || expected !== present) {
        throw new Error(`Final Development R2 parity is not exact: ${present}/${expected} present, ${remaining} missing.`);
      }
      restoreMessage = `Development R2 restore complete: ${present}/${expected} expected image keys present, 0 missing.`;
    } catch (error) {
      errorMessage = error?.message || 'Development R2 restore failed.';
      restoreMessage = `Restore stopped after ${restoreStats.processed} processed row(s). Existing Development objects were not overwritten.`;
    } finally {
      restoring = false;
      render();
    }
  }

  render();
});
