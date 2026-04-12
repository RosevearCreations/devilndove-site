// File: /public/js/admin-catalog-sync.js
// Brief description: Starts the staged migration of tools, supplies, movies, and featured creations
// from duplicated static JSON into D1 so search, inventory, and admin operations can share a
// cleaner single source of truth.

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("catalogSyncAdminMount");
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;

  let rendered = false;

  function setMessage(message, isError = false) {
    const el = document.getElementById("catalogSyncMessage");
    if (!el) return;
    el.textContent = message || "";
    el.style.display = message ? "block" : "none";
    el.style.color = isError ? "#b00020" : "#0a7a2f";
  }

  function renderSummaryRows(results) {
    return (Array.isArray(results) ? results : [])
      .map((row) => {
        const label = row.collection || row.item_kind || "collection";
        const fetched = Number(row.fetched || row.row_count || 0);
        const upserted = Number(row.upserted || 0);
        const path = row.source_path ? `<div class="small">Source: ${String(row.source_path)}</div>` : "";
        const warning = row.warning ? `<div class="small" style="color:#9a6a00">${String(row.warning)}</div>` : "";
        const error = row.error ? `<div class="small" style="color:#b00020">${String(row.error)}</div>` : "";
        return `<div><strong>${label}</strong>: fetched ${fetched} • upserted ${upserted}${path}${warning}${error}</div>`;
      })
      .join("") || "Sync complete.";
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
          <label><input type="checkbox" id="catalogSyncMovies" checked /> Movies</label>
          <label><input type="checkbox" id="catalogSyncCreations" checked /> Featured creations</label>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" type="button" id="catalogSyncRunButton">Sync selected collections into D1</button>
        </div>
        <div id="catalogSyncSummary" class="small" style="margin-top:12px">No sync run yet.</div>
      </div>`;

    document.getElementById("catalogSyncRunButton")?.addEventListener("click", runSync);
  }

  function selectedCollections() {
    const collections = [];
    if (document.getElementById("catalogSyncTools")?.checked) collections.push("tools");
    if (document.getElementById("catalogSyncSupplies")?.checked) collections.push("supplies");
    if (document.getElementById("catalogSyncMovies")?.checked) collections.push("movies");
    if (document.getElementById("catalogSyncCreations")?.checked) collections.push("featured");
    return collections;
  }

  async function runSync() {
    try {
      const collections = selectedCollections();
      if (!collections.length) throw new Error("Select at least one collection to sync.");
      setMessage("Syncing catalog collections into D1...");
      const response = await window.DDAuth.apiFetch("/api/admin/catalog-sync", {
        method: "POST",
        body: JSON.stringify({ collections, item_kinds: collections.map((value) => value.replace(/s$/, "")) }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Failed to sync catalog collections.");
      document.getElementById("catalogSyncSummary").innerHTML = renderSummaryRows(data.results || data.summary);
      setMessage(`Catalog sync complete. Upserted ${Number(data.total_upserted || 0)} row(s).`);
      document.dispatchEvent(new CustomEvent("dd:catalog-synced", { detail: data }));
    } catch (error) {
      setMessage(error.message || "Failed to sync catalog collections.", true);
    }
  }

  document.addEventListener("dd:admin-ready", (event) => {
    if (!event?.detail?.ok) return;
    render();
  });

  render();
});
