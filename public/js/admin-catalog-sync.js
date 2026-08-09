// Build 244 maintenance helper. Tools and supplies are migration-owned D1 authorities;
// their legacy JSON masters are emergency read-only fallbacks and cannot overwrite reviewed D1 classifications.
// Movies and featured creations retain the older maintenance import path.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('catalogSyncAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById('catalogSyncMessage');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.classList.toggle('is-error', Boolean(message && isError));
    el.classList.toggle('is-success', Boolean(message && !isError));
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Catalog Authority / Legacy Import</h3>
        <p class="small" style="margin-top:0"><strong>Tools and supplies now live in D1.</strong> Build 244 migrated the legacy masters and prevents runtime JSON re-import from overwriting reviewed classifications. The JSON files remain emergency read-only fallback/reference snapshots. Movies and featured creations can still use this maintenance importer.</p>
        <div id="catalogSyncMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <div class="small" style="display:grid;gap:8px;margin-bottom:12px">
          <label><input type="checkbox" checked disabled /> Tools — D1 authority (managed by migration)</label>
          <label><input type="checkbox" checked disabled /> Supplies — D1 authority (managed by migration)</label>
          <label><input type="checkbox" id="catalogSyncMovies" /> Movies — legacy maintenance import</label>
          <label><input type="checkbox" id="catalogSyncCreations" /> Featured creations — legacy maintenance import</label>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" type="button" id="catalogSyncRunButton">Import selected legacy collections</button>
        </div>
        <div id="catalogSyncSummary" class="small" style="margin-top:12px">No sync run yet.</div>
      </div>`;

    document.getElementById('catalogSyncRunButton')?.addEventListener('click', runSync);
  }

  function selectedKinds() {
    const kinds = [];
    if (document.getElementById('catalogSyncMovies')?.checked) kinds.push('movie');
    if (document.getElementById('catalogSyncCreations')?.checked) kinds.push('creation');
    return kinds;
  }

  function renderSummary(data) {
    const rows = Array.isArray(data?.summary) ? data.summary : Array.isArray(data?.results) ? data.results : [];
    const summaryEl = document.getElementById('catalogSyncSummary');
    if (!summaryEl) return;
    if (!rows.length) {
      summaryEl.textContent = 'Sync finished with no collection rows returned.';
      return;
    }

    summaryEl.innerHTML = rows.map((row) => {
      const warnings = Array.isArray(row.warnings) && row.warnings.length
        ? `<div class="small" style="margin-top:4px;color:#8a5a00">${row.warnings.map((entry) => String(entry)).join(' | ')}</div>`
        : '';
      return `
        <div style="margin-bottom:10px">
          <strong>${row.item_kind || row.collection || 'collection'}</strong>: fetched ${Number(row.fetched || row.row_count || 0)} • upserted ${Number(row.upserted || 0)} • target ${row.target_table || 'n/a'}
          <div class="small">Source: ${row.source_path || 'n/a'}</div>
          ${warnings}
        </div>`;
    }).join('');
  }

  async function runSync() {
    try {
      const itemKinds = selectedKinds();
      if (!itemKinds.length) throw new Error('Select Movies or Featured creations. Tools and supplies are already D1-authoritative.');
      setMessage('Importing selected legacy collections into D1...');
      const response = await window.DDAuth.apiFetch('/api/admin/catalog-sync', {
        method: 'POST',
        body: JSON.stringify({ item_kinds: itemKinds })
      });
      const data = await window.DDAuth.readApiJson(response, 'Failed to sync catalog collections.');
      renderSummary(data);
      setMessage(`Legacy catalog import complete. Upserted ${Number(data.total_upserted || 0)} row(s). Tools/supplies were not re-imported.`);
      document.dispatchEvent(new CustomEvent('dd:catalog-synced', { detail: data }));
    } catch (error) {
      setMessage(error.message || 'Failed to sync catalog collections.', true);
    }
  }

  document.addEventListener('dd:admin-ready', (event) => {
    if (!event?.detail?.ok) return;
    render();
  });

  render();
});
