// File: /public/js/admin-product-resources.js
// Brief description: Visual admin picker for linking tools and supplies used to make a product.

document.addEventListener('DOMContentLoaded', () => {
  const mountEl = document.getElementById('productResourcesAdminMount');
  if (!mountEl || !window.DDAuth || !window.DDAuth.isLoggedIn()) return;
  let state = { products: [], resources: [], links: [], selectedProductId: 0 };
  function escapeHtml(v) { return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'", '&#039;'); }
  function setMessage(msg, err=false) { const el=document.getElementById('productResourcesMessage'); if (!el) return; el.textContent=msg; el.style.display=msg?'block':'none'; el.style.color=err?'#b00020':'#0a7a2f'; }
  function render() {
    mountEl.innerHTML = `
      <div class="card" style="margin-top:18px">
        <h3 style="margin-top:0">Product Tools & Supplies Used</h3>
        <p class="small" style="margin-top:0">Visually link the tools and supplies used to create a finished product. This stores a reusable making-story in D1 so each finished piece can explain what materials and tools shaped it.</p>
        <div id="productResourcesMessage" class="small" style="display:none;margin-bottom:12px"></div>
        <div class="grid cols-2" style="gap:12px;margin-bottom:12px">
          <div><label class="small" for="productResourcesProduct">Product</label><select id="productResourcesProduct"></select></div>
          <div><label class="small" for="productResourcesSearch">Search tools/supplies</label><input id="productResourcesSearch" type="search" placeholder="pliers, resin, clay, file..." /></div>
        </div>
        <div class="grid cols-2" style="gap:16px">
          <div><h4 style="margin-top:0">Available Items</h4><div id="productResourcesGrid" class="resource-tile-grid"></div></div>
          <div><h4 style="margin-top:0">Linked To Product</h4><div id="productResourcesLinked" class="resource-linked-list"></div><div style="margin-top:12px"><button class="btn" type="button" id="productResourcesSaveButton">Save Product Links</button></div></div>
        </div>
      </div>`;
    document.getElementById('productResourcesProduct')?.addEventListener('change', onProductChange);
    document.getElementById('productResourcesSearch')?.addEventListener('input', loadData);
    document.getElementById('productResourcesSaveButton')?.addEventListener('click', saveLinks);
    mountEl.addEventListener('click', onClick);
  }
  function renderProducts() {
    const sel = document.getElementById('productResourcesProduct'); if (!sel) return;
    sel.innerHTML = `<option value="">Choose a product...</option>` + state.products.map((p)=>`<option value="${p.product_id}" ${Number(p.product_id)===Number(state.selectedProductId)?'selected':''}>${escapeHtml(p.name)} (${escapeHtml(p.status||'')})</option>`).join('');
  }
  function linkLabel(link) { return `${escapeHtml(link.name || link.source_key)} • qty ${Number(link.quantity_used || 1)}`; }
  function renderResources() {
    const el = document.getElementById('productResourcesGrid'); if (!el) return;
    el.innerHTML = state.resources.map((item) => {
      const linked = state.links.find((x) => x.resource_kind === item.item_kind && x.source_key === item.source_key);
      return `<button type="button" class="resource-tile ${linked?'is-linked':''}" data-add-resource="1" data-kind="${escapeHtml(item.item_kind)}" data-key="${escapeHtml(item.source_key)}"><div class="resource-tile-media">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" loading="lazy"/>` : `<div class="resource-tile-placeholder">${escapeHtml(item.item_kind)}</div>`}</div><div class="resource-tile-body"><strong>${escapeHtml(item.name)}</strong><div class="small">${escapeHtml(item.item_kind)} • ${escapeHtml(item.category || item.subcategory || '')}</div><div class="small">On hand ${Number(item.on_hand_quantity || 0)}${Number(item.is_on_reorder_list||0)===1?' • reorder list':''}${Number(item.do_not_reuse||0)===1?' • do not reuse':''}</div></div></button>`;
    }).join('');
  }
  function renderLinks() {
    const el = document.getElementById('productResourcesLinked'); if (!el) return;
    if (!state.links.length) { el.innerHTML = '<div class="small">No tools or supplies linked yet.</div>'; return; }
    el.innerHTML = state.links.map((link, idx)=>`<div class="resource-linked-card"><div class="resource-linked-summary"><strong>${escapeHtml(link.name || link.source_key)}</strong><div class="small">${escapeHtml(link.resource_kind)}</div><textarea class="input" data-link-note="${idx}" rows="2" placeholder="How was this item used for the story of this product?">${escapeHtml(link.usage_notes || '')}</textarea></div><div class="resource-linked-actions"><input type="number" min="1" step="1" value="${Number(link.quantity_used || 1)}" data-link-qty="${idx}" /><button class="btn" type="button" data-remove-link="${idx}">Remove</button></div></div>`).join('');
  }
  async function loadData() {
    try {
      const q = document.getElementById('productResourcesSearch')?.value || '';
      const url = `/api/admin/product-resources?product_id=${encodeURIComponent(state.selectedProductId || 0)}&q=${encodeURIComponent(q)}`;
      const response = await window.DDAuth.apiFetch(url); const data = await response.json(); if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load product resources.');
      state.products = Array.isArray(data.products) ? data.products : [];
      state.resources = Array.isArray(data.resources) ? data.resources : [];
      const links = Array.isArray(data.links) ? data.links : [];
      state.links = links.map((x) => ({ ...x, name: (state.resources.find((r) => r.item_kind === x.resource_kind && r.source_key === x.source_key) || {}).name || x.source_key }));
      renderProducts(); renderResources(); renderLinks(); setMessage('');
    } catch (err) { setMessage(err.message || 'Failed to load product resources.', true); }
  }
  function onProductChange(event) { state.selectedProductId = Number(event.target.value || 0); loadData(); }
  function onClick(event) {
    const add = event.target.closest('[data-add-resource]'); const remove = event.target.closest('[data-remove-link]');
    if (add) {
      const kind = add.getAttribute('data-kind') || ''; const key = add.getAttribute('data-key') || '';
      const item = state.resources.find((x) => x.item_kind === kind && x.source_key === key); if (!item) return;
      if (!state.links.find((x) => x.resource_kind === kind && x.source_key === key)) state.links.push({ resource_kind: kind, source_key: key, quantity_used: 1, usage_notes: '', sort_order: state.links.length, name: item.name });
      renderResources(); renderLinks(); return;
    }
    if (remove) { const idx = Number(remove.getAttribute('data-remove-link') || -1); if (idx < 0) return; state.links.splice(idx,1); renderResources(); renderLinks(); }
  }
  async function saveLinks() {
    if (!state.selectedProductId) { setMessage('Choose a product first.', true); return; }
    document.querySelectorAll('[data-link-qty]').forEach((input) => { const idx = Number(input.getAttribute('data-link-qty') || -1); if (idx >= 0 && state.links[idx]) state.links[idx].quantity_used = Math.max(1, Number(input.value || 1) || 1); });
    document.querySelectorAll('[data-link-note]').forEach((input) => { const idx = Number(input.getAttribute('data-link-note') || -1); if (idx >= 0 && state.links[idx]) state.links[idx].usage_notes = String(input.value || '').trim(); });
    try { setMessage('Saving product links...'); const response = await window.DDAuth.apiFetch('/api/admin/product-resources', { method:'POST', body: JSON.stringify({ product_id: state.selectedProductId, links: state.links.map((x,i)=>({ resource_kind:x.resource_kind, source_key:x.source_key, quantity_used:x.quantity_used, usage_notes:x.usage_notes || '', sort_order:i })) }) }); const data = await response.json(); if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to save product links.'); setMessage(`Saved ${Number(data.saved_links || 0)} linked items.`); await loadData(); } catch (err) { setMessage(err.message || 'Failed to save product links.', true); }
  }
  document.addEventListener('dd:admin-ready', (event) => { if (!event?.detail?.ok) return; render(); loadData(); });
  render(); loadData();
});
