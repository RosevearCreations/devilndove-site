document.addEventListener('DOMContentLoaded', () => {
  const mounts = [document.getElementById('productPriceSuggestionMount')].filter(Boolean);
  if (!mounts.length) return;
  let rendered = false;

  function money(cents, currency = 'CAD') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(cents || 0) / 100);
  }
  function escapeHtml(v) {
    return String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }
  function setMessage(message, isError = false) {
    const el = document.getElementById('productPriceSuggestionMessage');
    if (!el) return;
    el.textContent = message;
    el.style.display = message ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  function render() {
    if (rendered) return; rendered = true;
    mounts.forEach((mountEl) => {
      mountEl.innerHTML = `
        <div class="card" style="margin-top:18px">
          <h3 style="margin-top:0">Recommended price suggestions</h3>
          <p class="small" style="margin-top:0">Turn linked resource cost, manual unit cost, packaging, shipping pressure, and overhead into a working selling-price target.</p>
          <div id="productPriceSuggestionMessage" class="small" style="display:none;margin-bottom:12px"></div>
          <div class="grid cols-5" style="gap:12px">
            <div><label class="small" for="ppsProductId">Product ID</label><input id="ppsProductId" type="number" min="0" step="1" placeholder="0 = all" /></div>
            <div><label class="small" for="ppsSearch">Search</label><input id="ppsSearch" type="text" placeholder="name or slug" /></div>
            <div><label class="small" for="ppsPackaging">Packaging ($)</label><input id="ppsPackaging" type="number" min="0" step="0.01" value="0.75" /></div>
            <div><label class="small" for="ppsShipping">Shipping pressure ($)</label><input id="ppsShipping" type="number" min="0" step="0.01" value="1.50" /></div>
            <div><label class="small" for="ppsOverhead">Overhead %</label><input id="ppsOverhead" type="number" min="0" step="0.1" value="12" /></div>
          </div>
          <div class="grid cols-3" style="gap:12px;margin-top:12px;align-items:end">
            <div><label class="small" for="ppsMargin">Target margin %</label><input id="ppsMargin" type="number" min="5" max="95" step="1" value="65" /></div>
            <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="button" id="ppsLoadButton">Load Suggestions</button></div>
          </div>
          <div class="admin-table-wrap" style="margin-top:12px"><table><thead><tr><th>Product</th><th>Current</th><th>Known Cost</th><th>Landed Cost</th><th>Suggested</th><th>Range</th><th>Notes</th></tr></thead><tbody id="ppsList"><tr><td colspan="7" style="padding:8px">Load suggestions to begin.</td></tr></tbody></table></div>
        </div>`;
    });
    document.getElementById('ppsLoadButton')?.addEventListener('click', loadSuggestions);
  }
  async function loadSuggestions() {
    try {
      setMessage('Loading price suggestions...');
      const params = new URLSearchParams({
        product_id: String(Number(document.getElementById('ppsProductId')?.value || 0) || 0),
        q: String(document.getElementById('ppsSearch')?.value || '').trim(),
        packaging_cents: String(Math.round(Number(document.getElementById('ppsPackaging')?.value || 0) * 100)),
        shipping_pressure_cents: String(Math.round(Number(document.getElementById('ppsShipping')?.value || 0) * 100)),
        overhead_percent: String(Number(document.getElementById('ppsOverhead')?.value || 0)),
        target_margin_percent: String(Number(document.getElementById('ppsMargin')?.value || 65))
      });
      const response = await window.DDAuth.apiFetch(`/api/admin/product-price-suggestions?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load price suggestions.');
      const rows = Array.isArray(data.items) ? data.items : [];
      const body = document.getElementById('ppsList');
      if (!body) return;
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="7" style="padding:8px">No products matched these assumptions.</td></tr>';
      } else {
        body.innerHTML = rows.map((row) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(row.name || '')}</strong><div class="small">#${escapeHtml(row.product_id)} · ${escapeHtml(row.status || '')} · Review ${escapeHtml(row.review_status || '')}</div></td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(row.price_cents, row.currency))}<div class="small">Margin now ${(Number(row.current_margin_ratio || 0) * 100).toFixed(1)}%</div></td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(row.base_known_cost_cents, row.currency))}<div class="small">Resources ${escapeHtml(money(row.resource_cost_cents, row.currency))} · Manual ${escapeHtml(money(row.manual_cost_cents, row.currency))}</div></td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(row.landed_cost_cents, row.currency))}<div class="small">Packaging ${escapeHtml(money(row.packaging_cents, row.currency))} · Shipping ${escapeHtml(money(row.shipping_pressure_cents, row.currency))} · Overhead ${escapeHtml(money(row.overhead_cents, row.currency))}</div></td>
            <td style="padding:8px;border-bottom:1px solid #ddd"><strong>${escapeHtml(money(row.suggested_price_cents, row.currency))}</strong><div class="small">Compare-at ${escapeHtml(money(row.suggested_compare_at_cents, row.currency))}</div></td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(money(row.conservative_price_cents, row.currency))} → ${escapeHtml(money(row.stretch_price_cents, row.currency))}</td>
            <td style="padding:8px;border-bottom:1px solid #ddd">${row.notes.map((note) => `<div class="small">${escapeHtml(note)}</div>`).join('') || '<div class="small">—</div>'}</td>
          </tr>`).join('');
      }
      setMessage(`Loaded ${rows.length} price suggestion row(s).`);
    } catch (error) {
      setMessage(error.message || 'Failed to load price suggestions.', true);
    }
  }
  document.addEventListener('dd:admin-ready', (event) => { if (!event?.detail?.ok) return; render(); });
  render();
});
