// File: /public/js/admin-catalog-sync.js
// Brief description: Starts the staged migration of tools, supplies, and featured creations
// from duplicated static JSON into D1 so search, inventory, and admin operations can share a
// cleaner single source of truth.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('catalogSyncAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById('catalogSyncMessage');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function render() {
    if (rendered) return;
    rendered = true;
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Catalog Migration Sync</h3>
        <p class="small" style="margin-top:0">Begin moving high-duplication JSON collections into D1 so search, inventory, and future analytics can share one cleaner source of truth.</p>
        <div id="catalogSyncMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <div class="small" style="display:grid;gap:8px;margin-bottom:12px">
          <label><input type="checkbox" id="catalogSyncTools" checked /> Tools</label>
          <label><input type="checkbox" id="catalogSyncSupplies" checked /> Supplies</label>
          <label><input type="checkbox" id="catalogSyncCreations" checked /> Featured creations</label>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" type="button" id="catalogSyncRunButton">Sync selected collections into D1</button>
        </div>
        <div id="catalogSyncSummary" class="small" style="margin-top:12px">No sync run yet.</div>
      </div>`;

    document.getElementById('catalogSyncRunButton')?.addEventListener('click', runSync);
  }

  function selectedKinds() {
    const kinds = [];
    if (document.getElementById('catalogSyncTools')?.checked) kinds.push('tool');
    if (document.getElementById('catalogSyncSupplies')?.checked) kinds.push('supply');
    if (document.getElementById('catalogSyncCreations')?.checked) kinds.push('creation');
    return kinds;
  }

  async function runSync() {
    try {
      const itemKinds = selectedKinds();
      if (!itemKinds.length) throw new Error('Select at least one collection to sync.');
      setMessage('Syncing catalog collections into D1...');
      const response = await window.DDAuth.apiFetch('/api/admin/catalog-sync', {
        method: 'POST',
        body: JSON.stringify({ item_kinds: itemKinds })
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to sync catalog collections.');
      document.getElementById('catalogSyncSummary').innerHTML = (Array.isArray(data.summary) ? data.summary : [])
        .map((row) => `<div><strong>${row.item_kind}</strong>: fetched ${Number(row.fetched || 0)} • upserted ${Number(row.upserted || 0)}</div>`)
        .join('') || 'Sync complete.';
      setMessage(`Catalog sync complete. Upserted ${Number(data.total_upserted || 0)} row(s).`);
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
