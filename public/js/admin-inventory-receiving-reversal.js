// Devil n Dove Build 440 — receiving reversal review.
// Manual and explicit only: review first, reason required, one compensating reversal per completed receipt.

(() => {
  const mount = document.getElementById('inventoryReceivingReversalMount');
  if (!mount || !window.DDAuth) return;
  let busy = false;
  const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  async function readJson(response, fallback) {
    if (window.DDAuth?.readApiJson) return window.DDAuth.readApiJson(response, fallback);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!response.ok) throw new Error(data?.error || fallback || `Request failed (${response.status}).`);
    return data;
  }

  function message(text, error = false) {
    const el = document.getElementById('inventoryReceivingReversalMessage');
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
    el.classList.toggle('is-error', Boolean(text && error));
  }

  async function load() {
    try {
      const data = await window.DDAuth.apiJson('/api/admin/inventory-receiving', { method:'GET' }, { fallbackMessage:'Receiving reversal evidence could not load.', cacheTtlMs:0, staleOnError:false });
      const recent = Array.isArray(data.recent) ? data.recent : [];
      const reversible = recent.filter((row) => String(row.claim_status || '') === 'completed' && !row.reversal).slice(0, 12);
      const reversed = recent.filter((row) => row.reversal).slice(0, 6);
      const list = document.getElementById('inventoryReceivingReversalList');
      if (!list) return;
      list.innerHTML = `
        ${reversible.length ? reversible.map((row) => `
          <div class="inventory-receiving-recent-row">
            <span><strong>${esc(row.item_name || row.external_key || `Inventory #${row.site_item_inventory_id}`)}</strong><small>${esc(row.received_at || '')} · lot ${esc(row.lot_code || '')}</small></span>
            <span>${esc(row.quantity_received)} ${esc(row.stock_unit_label || 'unit')} <button class="btn" type="button" data-reverse-receipt="${Number(row.inventory_receiving_claim_id || 0)}">Review reversal</button></span>
          </div>`).join('') : '<div class="small">No unreversed recent receiving claims.</div>'}
        ${reversed.length ? `<details style="margin-top:10px"><summary>Recently reversed (${reversed.length})</summary>${reversed.map((row) => `<div class="inventory-receiving-recent-row"><span><strong>${esc(row.item_name || row.external_key || '')}</strong><small>${esc(row.reversal?.reversed_at || '')}</small></span><span>${esc(row.reversal?.quantity_reversed || row.quantity_received)} reversed</span></div>`).join('')}</details>` : ''}`;
    } catch (error) {
      message(error.message || 'Receiving reversal evidence could not load.', true);
    }
  }

  async function reviewAndReverse(claimId) {
    if (busy || !claimId) return;
    busy = true;
    try {
      message('Reviewing receipt reversal…');
      const data = await window.DDAuth.apiJson(`/api/admin/inventory-receiving?reversal_claim_id=${encodeURIComponent(claimId)}`, { method:'GET' }, { fallbackMessage:'Receipt reversal review failed.', cacheTtlMs:0, staleOnError:false });
      const preview = data.preview || {};
      const blockers = Array.isArray(preview.blockers) ? preview.blockers : [];
      if (!Number(preview.eligible || 0)) {
        message(blockers.length ? `Reversal blocked: ${blockers.join(' ')}` : 'This receipt cannot be reversed safely.', true);
        return;
      }
      const itemName = preview.item?.item_name || `Inventory #${preview.item?.site_item_inventory_id || ''}`;
      const reason = window.prompt(`Reverse receipt for ${itemName}?\n\nThis will subtract ${preview.quantity_reversed} from on-hand stock and the linked purchase lot${Number(preview.quantity_incoming_restored || 0) > 0 ? `, and restore ${preview.quantity_incoming_restored} to incoming` : ''}.\n\nEnter a clear reason (at least 8 characters):`, 'BUILD440 Development receiving acceptance reversal');
      if (reason == null) { message('Receipt reversal cancelled.'); return; }
      if (String(reason).trim().length < 8) { message('Reversal reason must be at least 8 characters.', true); return; }
      if (!window.confirm(`Confirm reversal of ${preview.quantity_reversed} unit(s) for ${itemName}? This is an audited compensating action.`)) { message('Receipt reversal cancelled.'); return; }
      const response = await window.DDAuth.apiFetch('/api/admin/inventory-receiving', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ action:'reverse', inventory_receiving_claim_id:claimId, reversal_key:`ui-reverse-${uuid()}`, reversal_reason:String(reason).trim() })
      });
      const result = await readJson(response, 'Receipt reversal failed safely.');
      message(result.message || 'Receipt reversed.');
      await load();
      document.dispatchEvent(new CustomEvent('dd:inventory-receipt-reversed', { detail:{ inventory_receiving_claim_id:claimId } }));
    } catch (error) {
      message(error.message || 'Receipt reversal failed safely.', true);
    } finally {
      busy = false;
    }
  }

  mount.innerHTML = `
    <section class="card inventory-receiving-card">
      <div class="inventory-receiving-heading">
        <div>
          <p class="inventory-operations-eyebrow">Receiving correction</p>
          <h3 style="margin:0">Audited Receipt Reversal</h3>
          <p class="small">A receipt can be reversed once only while its exact received quantity is still provably present in the linked purchase lot. Consumed stock fails closed.</p>
        </div>
      </div>
      <div id="inventoryReceivingReversalMessage" class="small inventory-receiving-message" hidden></div>
      <div id="inventoryReceivingReversalList"><div class="small">Loading…</div></div>
    </section>`;
  mount.addEventListener('click', (event) => {
    const button = event.target.closest('[data-reverse-receipt]');
    if (button) reviewAndReverse(Number(button.dataset.reverseReceipt || 0));
  });
  document.addEventListener('dd:inventory-received', load);
  load();
})();
