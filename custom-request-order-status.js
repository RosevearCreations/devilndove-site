// File: /public/js/custom-request-order-status.js
// Brief description: Loads a private customer order-status page for converted custom request orders.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('customRequestOrderStatusMount');
  if (!mount) return;
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const money = (cents, currency = 'CAD') => {
    try { return (Number(cents || 0) / 100).toLocaleString('en-CA', { style: 'currency', currency }); }
    catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${currency}`; }
  };

  function render(data) {
    const order = data.order || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const stages = Array.isArray(data.stages) ? data.stages : [];
    const currentStage = data.link?.order_stage || 'planning';
    mount.innerHTML = `<div class="quote-preview-card">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">${esc(order.order_number || 'Custom order')}</h2><p class="small">For ${esc(order.customer_name || 'customer')} • ${esc(order.customer_email || '')}</p></div>
        <span class="status-note">${esc(order.order_status || 'pending')} • ${esc(currentStage)}</span>
      </div>
      <div class="quote-preview-total"><span>Order total</span><strong>${money(order.total_cents, order.currency || 'CAD')}</strong></div>
      <div class="quote-preview-breakdown small"><div>Payment: <strong>${esc(order.payment_status || 'pending')}</strong></div><div>Method: <strong>${esc(order.payment_method || 'manual')}</strong></div><div>Updated: <strong>${esc(order.updated_at || order.created_at || '')}</strong></div></div>
      <h3>Custom work stage</h3>
      <div class="quote-preview-breakdown small"><div>Current stage: <strong>${esc(currentStage)}</strong></div><div>${esc(data.link?.stage_notes || '')}</div><div>Stage updated: <strong>${esc(data.link?.stage_updated_at || '—')}</strong></div></div>
      <div class="small" style="margin-top:8px">${stages.map((stage) => `${esc(stage.created_at || '')} • ${esc(stage.stage_label || stage.stage_key || '')} ${stage.stage_notes ? `— ${esc(stage.stage_notes)}` : ''}`).join('<br>') || 'Stage history will appear here after admin updates.'}</div>
      <h3>Order items</h3>
      <div class="admin-table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${items.map((item) => `<tr><td>${esc(item.product_name || 'Custom item')}<br><span class="small">${esc(item.sku || '')}</span></td><td>${esc(item.quantity || 1)}</td><td>${money(item.line_subtotal_cents || item.unit_price_cents, order.currency || 'CAD')}</td></tr>`).join('') || '<tr><td colspan="3">No item rows are attached yet.</td></tr>'}</tbody></table></div>
      <h3>Notes</h3>
      <pre class="quote-preview-scope">${esc(order.notes || 'No extra order notes yet.')}</pre>
      <p class="small">This page is private and not indexed. Payment and fulfillment updates may still require manual Devil n Dove review.</p>
    </div>`;
  }

  async function load() {
    if (!token) { mount.innerHTML = '<p class="small">Missing order status token.</p>'; return; }
    mount.innerHTML = '<p class="small">Loading order status...</p>';
    try {
      const response = await fetch(`/api/custom-request-order?token=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Order status could not be loaded.');
      render(data);
    } catch (error) {
      mount.innerHTML = `<p class="small" style="color:#b00020">${esc(error.message || 'Order status could not be loaded.')}</p>`;
    }
  }

  load();
});
