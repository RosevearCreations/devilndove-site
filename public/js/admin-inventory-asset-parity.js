// Devil n Dove Build 440 — manual Development Tool/Supply R2 parity review.
// User-triggered only; no polling and no mutation controls.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('inventoryAssetParityMount');
  if (!mount) return;

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  let running = false;
  let result = null;
  let errorMessage = '';

  function summaryCard(label, value) {
    return `<div class="card"><span class="small">${esc(label)}</span><div style="font-size:1.35rem;font-weight:800">${esc(value)}</div></div>`;
  }

  function render() {
    const summary = result?.summary || null;
    const missing = Array.isArray(result?.missing) ? result.missing : [];
    mount.innerHTML = `
      <section class="card" aria-labelledby="inventoryAssetParityHeading" style="margin-bottom:18px">
        <div class="section-heading-row">
          <div>
            <p class="inventory-operations-eyebrow">Development storage proof</p>
            <h3 id="inventoryAssetParityHeading" style="margin:0">Tool &amp; Supply R2 Asset Parity</h3>
            <p class="small">Compare canonical D1 Tool/Supply image keys with the currently bound Development <code>PRODUCT_MEDIA_BUCKET</code>. This diagnostic is read-only and runs only when requested.</p>
          </div>
          <button class="btn" type="button" id="runInventoryAssetParity" ${running ? 'disabled' : ''}>${running ? 'Checking…' : 'Run R2 parity check'}</button>
        </div>
        <div id="inventoryAssetParityMessage" class="small ${errorMessage ? 'is-error' : ''}" ${!errorMessage && !result ? 'hidden' : ''}>${esc(errorMessage || (result ? 'Parity check completed against the bound Development bucket.' : ''))}</div>
        ${summary ? `
          <div class="grid cols-4" style="margin-top:12px">
            ${summaryCard('Catalogue rows', summary.catalog_rows)}
            ${summaryCard('Expected image keys', summary.expected_unique_keys)}
            ${summaryCard('Present in Dev R2', summary.present_unique_keys)}
            ${summaryCard('Missing from Dev R2', summary.missing_unique_keys)}
          </div>
          <div class="small" style="margin-top:10px">
            R2 objects: ${esc(summary.r2_unique_keys)} total (${esc(summary.r2_tool_keys)} Tools / ${esc(summary.r2_supply_keys)} Supplies) ·
            blank catalogue image URLs: ${esc(summary.blank_image_url_rows)} · unsupported image URLs: ${esc(summary.unsupported_image_url_rows)} ·
            bucket-only keys: ${esc(summary.bucket_only_keys)} · listing truncated: <strong>${summary.listing_truncated ? 'YES — result incomplete' : 'no'}</strong>
          </div>
          ${missing.length ? `
            <details style="margin-top:12px" open>
              <summary><strong>Missing Development R2 keys (${esc(summary.missing_unique_keys)})</strong> — showing up to ${esc(result.missing_sample_limit)}</summary>
              <div class="admin-table-wrap" style="margin-top:8px">
                <table>
                  <thead><tr><th>R2 key</th><th>Catalogue item</th><th>Kind</th></tr></thead>
                  <tbody>${missing.map((entry) => {
                    const first = Array.isArray(entry.catalog_rows) ? entry.catalog_rows[0] : null;
                    return `<tr><td><code>${esc(entry.key)}</code></td><td>${esc(first?.name || first?.source_key || '—')}</td><td>${esc(first?.item_kind || '—')}</td></tr>`;
                  }).join('')}</tbody>
                </table>
              </div>
            </details>` : '<p class="small is-success" style="margin-top:12px">No canonical Tool/Supply image keys are missing from the bound Development R2 bucket.</p>'}
        ` : ''}
      </section>`;

    document.getElementById('runInventoryAssetParity')?.addEventListener('click', runParity);
  }

  async function runParity() {
    if (running || !window.DDAuth?.isLoggedIn()) return;
    running = true;
    result = null;
    errorMessage = '';
    render();
    try {
      result = await window.DDAuth.apiJson(
        '/api/admin/inventory-asset-parity',
        { method: 'GET' },
        { fallbackMessage: 'Development R2 parity check failed.', dedupe: false, retries: 0, staleOnError: false }
      );
    } catch (error) {
      errorMessage = error?.message || 'Development R2 parity check failed.';
    } finally {
      running = false;
      render();
    }
  }

  render();
});
