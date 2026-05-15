// File: /public/js/admin-amazon-purchase-review.js
// Brief description: Admin review screen for private Amazon CSV purchase staging rows.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('siteInventoryAdminMount');
  if (!mount || !window.DDAuth) return;

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function money(cents) { return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(Number(cents || 0) / 100); }
  function setMessage(text, isError = false) {
    const el = document.getElementById('amazonPurchaseReviewMessage');
    if (!el) return;
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#14532d';
    el.textContent = text || '';
  }
  async function readJson(response, fallback) {
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || fallback || 'Request failed.');
    return data;
  }

  function ensureCard() {
    if (document.getElementById('amazonPurchaseReviewCard')) return;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'amazonPurchaseReviewCard';
    card.style.marginTop = '16px';
    card.innerHTML = `
      <h4 style="margin-top:0">Amazon purchase review queue</h4>
      <p class="small" style="margin-top:0">Private review-first queue for Amazon CSV rows. Approving a row applies its unit cost to the linked inventory item and records cost history.</p>
      <div id="amazonPurchaseReviewMessage" class="small" style="display:none;margin-bottom:10px"></div>
      <div class="grid cols-4" style="gap:8px;align-items:end">
        <div><label class="small" for="amazonReviewDecisionFilter">Decision</label><select id="amazonReviewDecisionFilter"><option value="pending">Pending</option><option value="hold">Hold</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option></select></div>
        <div><label class="small" for="amazonReviewStatusFilter">Match status</label><input id="amazonReviewStatusFilter" type="text" placeholder="safe, review, weak..." /></div>
        <div><label class="small" for="amazonReviewSearch">Search</label><input id="amazonReviewSearch" type="search" placeholder="title, ASIN, order id" /></div>
        <div><button class="btn" type="button" id="amazonReviewRefreshButton">Refresh Amazon review</button></div>
      </div>
      <div id="amazonPurchaseReviewSummary" class="small" style="margin-top:10px"></div>
      <div class="admin-table-wrap" style="margin-top:10px"><table><thead><tr><th>Amazon row</th><th>Matched inventory</th><th>Cost</th><th>Review</th></tr></thead><tbody id="amazonPurchaseReviewList"><tr><td colspan="4" style="padding:8px">Loading Amazon review rows…</td></tr></tbody></table></div>`;
    const movements = document.getElementById('siteInventoryMovementList')?.closest('.card');
    if (movements) movements.insertAdjacentElement('beforebegin', card);
    else mount.appendChild(card);
  }

  async function loadRows() {
    ensureCard();
    const decision = document.getElementById('amazonReviewDecisionFilter')?.value || 'pending';
    const status = document.getElementById('amazonReviewStatusFilter')?.value || '';
    const q = document.getElementById('amazonReviewSearch')?.value || '';
    const params = new URLSearchParams({ review_decision: decision, match_status: status, q, limit: '100' });
    const data = await readJson(await window.DDAuth.apiFetch(`/api/admin/amazon-purchase-review?${params.toString()}`), 'Amazon review queue is unavailable.');
    const body = document.getElementById('amazonPurchaseReviewList');
    const summary = document.getElementById('amazonPurchaseReviewSummary');
    if (summary) {
      const counts = data.summary || {};
      summary.innerHTML = `Pending <strong>${esc(String(counts.pending || 0))}</strong> • Hold <strong>${esc(String(counts.hold || 0))}</strong> • Approved <strong>${esc(String(counts.approved || 0))}</strong> • Rejected <strong>${esc(String(counts.rejected || 0))}</strong>`;
    }
    if (!body) return;
    const rows = Array.isArray(data.items) ? data.items : [];
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4" style="padding:8px">No Amazon rows found for this filter.</td></tr>';
      return;
    }
    body.innerHTML = rows.map((row) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee"><strong>${esc(row.amazon_title || row.inventory_name || 'Amazon item')}</strong><div class="small">#${esc(String(row.id || ''))} • ${esc(row.asin || 'no ASIN')} • ${esc(row.amazon_order_id || '')}</div><div class="small">${esc(row.match_status || '')} • score ${esc(String(Number(row.match_score || 0).toFixed(2)))}</div></td>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(row.linked_inventory_name || row.inventory_name || 'Not linked')}<div class="small">${esc(row.inventory_type || '')} • ${esc(row.inventory_key || '')}</div></td>
        <td style="padding:8px;border-bottom:1px solid #eee">${esc(money(row.unit_net_cost_cents || row.item_net_total_cents || 0))}<div class="small">Current ${esc(money(row.linked_unit_cost_cents || 0))} • Qty ${esc(String(row.item_quantity || ''))}</div></td>
        <td style="padding:8px;border-bottom:1px solid #eee"><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn primary" type="button" data-amazon-review="approved" data-amazon-row="${esc(String(row.id || 0))}">Approve/apply</button><button class="btn" type="button" data-amazon-review="hold" data-amazon-row="${esc(String(row.id || 0))}">Hold</button><button class="btn" type="button" data-amazon-review="rejected" data-amazon-row="${esc(String(row.id || 0))}">Reject</button></div><input class="small" data-amazon-note="${esc(String(row.id || 0))}" type="text" placeholder="optional review note" style="margin-top:6px;width:100%" /></td>
      </tr>`).join('');
  }

  mount.addEventListener('click', async (event) => {
    if (event.target.id === 'amazonReviewRefreshButton') {
      try { setMessage('Loading Amazon review rows…'); await loadRows(); setMessage('Amazon review rows loaded.'); }
      catch (error) { setMessage(error.message || 'Failed loading Amazon review rows.', true); }
      return;
    }
    const actionButton = event.target.closest('[data-amazon-review]');
    if (actionButton) {
      const id = Number(actionButton.getAttribute('data-amazon-row') || 0);
      const decision = actionButton.getAttribute('data-amazon-review') || 'hold';
      const note = document.querySelector(`[data-amazon-note="${CSS.escape(String(id))}"]`)?.value || '';
      try {
        setMessage(`${decision === 'approved' ? 'Applying' : 'Updating'} Amazon row ${id}…`);
        const data = await readJson(await window.DDAuth.apiFetch('/api/admin/amazon-purchase-review', {
          method: 'POST',
          body: JSON.stringify({ id, review_decision: decision, review_notes: note })
        }), 'Failed updating Amazon review row.');
        setMessage(decision === 'approved' && data.applied ? `Amazon row ${id} approved and applied to inventory #${data.applied.site_item_inventory_id}.` : `Amazon row ${id} marked ${decision}.`);
        await loadRows();
      } catch (error) { setMessage(error.message || 'Failed updating Amazon review row.', true); }
    }
  });

  mount.addEventListener('input', (event) => {
    if (event.target.id === 'amazonReviewSearch' || event.target.id === 'amazonReviewStatusFilter') {
      clearTimeout(window.__amazonReviewSearchTimer);
      window.__amazonReviewSearchTimer = setTimeout(() => loadRows().catch(() => {}), 250);
    }
  });
  mount.addEventListener('change', (event) => {
    if (event.target.id === 'amazonReviewDecisionFilter') loadRows().catch(() => {});
  });

  ensureCard();
  loadRows().catch(() => {});
});
