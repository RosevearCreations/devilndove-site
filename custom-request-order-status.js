// File: /public/js/custom-request-order-status.js
// Release 467 Build 16: private customer-safe custom request journey/status rendering.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('customRequestOrderStatusMount');
  if (!mount) return;
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const human = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  const money = (cents, currency = 'CAD') => {
    try { return (Number(cents || 0) / 100).toLocaleString('en-CA', { style: 'currency', currency }); }
    catch { return `${(Number(cents || 0) / 100).toFixed(2)} ${currency}`; }
  };

  function renderJourney(journey) {
    const steps = Array.isArray(journey) ? journey : [];
    if (!steps.length) return '';
    return `<ol class="custom-request-journey" aria-label="Custom request progress">${steps.map((step) => `<li class="custom-request-journey-step is-${esc(step.state || 'upcoming')}"><span aria-hidden="true">${step.state === 'complete' ? '✓' : step.state === 'current' ? '●' : '○'}</span><strong>${esc(step.label || '')}</strong></li>`).join('')}</ol>`;
  }

  function renderSpecs(specs) {
    const list = Array.isArray(specs) ? specs : [];
    if (!list.length) return '';
    return `<section class="card" style="margin-top:14px"><h3 style="margin-top:0">Reviewed candle / soap facts</h3><p class="small">Only facts already attached to this custom request are shown here.</p>${list.map((row) => {
      const facts = [
        ['Type', human(row.product_family)],
        ['Scent', row.scent_profile],
        ['Wax / base', row.wax_or_base],
        ['Colour', row.colour_notes],
        ['Batch', row.batch_number],
        ['Ingredients', row.ingredient_notes],
        ['Safety', row.allergen_safety_notes],
        ['Ready date', row.cure_ready_date]
      ].filter(([, value]) => String(value || '').trim());
      return `<div class="quote-preview-breakdown small" style="margin-top:8px">${facts.map(([label, value]) => `<div><strong>${esc(label)}:</strong> ${esc(value)}</div>`).join('')}</div>`;
    }).join('')}</section>`;
  }

  function renderPhotos(photos) {
    const list = Array.isArray(photos) ? photos : [];
    if (!list.length) return '';
    return `<section style="margin-top:14px"><h3>Reviewed progress photos</h3><div class="grid cols-3">${list.slice(0, 9).map((photo) => `<figure class="card" style="margin:0"><img src="${esc(photo.image_url || '')}" alt="Reviewed ${esc(human(photo.stage_key || 'custom work'))} progress photo" loading="lazy"/><figcaption class="small">${esc(photo.image_caption || human(photo.stage_key || 'Custom work'))}</figcaption></figure>`).join('')}</div></section>`;
  }

  function render(data) {
    const order = data.order || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const stages = Array.isArray(data.stages) ? data.stages : [];
    const currentStage = data.customer_stage || { key: data.link?.order_stage || 'planning', label: human(data.link?.order_stage || 'planning'), message: '' };
    mount.innerHTML = `<div class="quote-preview-card">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">${esc(order.order_number || 'Custom order')}</h2><p class="small">For ${esc(order.customer_name || 'customer')} • ${esc(order.customer_email || '')}</p></div>
        <span class="status-note">${esc(order.order_status || 'pending')} • ${esc(currentStage.label || human(currentStage.key))}</span>
      </div>
      <section class="card" style="margin:12px 0"><h3 style="margin-top:0">Your custom-request journey</h3>${renderJourney(data.journey)}<p style="margin-bottom:0"><strong>${esc(currentStage.label || '')}:</strong> ${esc(currentStage.message || '')}</p><p class="small" style="margin-bottom:0">${esc(data.fulfillment_message || '')}</p></section>
      <div class="quote-preview-total"><span>Order total</span><strong>${money(order.total_cents, order.currency || 'CAD')}</strong></div>
      <div class="quote-preview-breakdown small"><div>Payment: <strong>${esc(order.payment_status || 'pending')}</strong></div><div>Method: <strong>${esc(order.payment_method || 'manual')}</strong></div><div>Updated: <strong>${esc(order.updated_at || order.created_at || '')}</strong></div></div>
      <h3>Reviewed stage history</h3>
      <div class="small">${stages.map((stage) => `${esc(stage.created_at || '')} • ${esc(stage.stage_label || human(stage.stage_key || ''))}`).join('<br>') || 'Stage history will appear here after reviewed updates.'}</div>
      ${renderPhotos(data.photos)}
      ${renderSpecs(data.specs)}
      <h3>Order items</h3>
      <div class="admin-table-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${items.map((item) => `<tr><td>${esc(item.product_name || 'Custom item')}<br><span class="small">${esc(item.sku || '')}</span></td><td>${esc(item.quantity || 1)}</td><td>${money(item.line_subtotal_cents || item.unit_price_cents, order.currency || 'CAD')}</td></tr>`).join('') || '<tr><td colspan="3">No item rows are attached yet.</td></tr>'}</tbody></table></div>
      <p class="small">This page is private and not indexed. internal production notes are deliberately not included here; only customer-safe reviewed progress is shown.</p>
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
