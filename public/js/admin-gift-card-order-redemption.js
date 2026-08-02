// File: /public/js/admin-gift-card-order-redemption.js
// Brief description: Adds gift-card redemption controls to admin order detail modals.
document.addEventListener('DOMContentLoaded', () => {
  if (!window.DDAuth) return;
  let currentOrderId = 0;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view-order-id]');
    if (button) currentOrderId = Number(button.getAttribute('data-view-order-id') || 0);
    setTimeout(injectPanel, 250);
  });
  function injectPanel() {
    const content = document.getElementById('adminOrderDetailContent');
    if (!content || document.getElementById('adminGiftCardRedemptionPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'adminGiftCardRedemptionPanel';
    panel.className = 'card gift-card-redemption-panel';
    panel.style.marginTop = '18px';
    panel.innerHTML = `<h3 style="margin-top:0">Gift-card redemption</h3><p class="small">Apply an active Devil n Dove gift card against this order. This records an internal redemption and reduces the gift-card balance.</p><form id="adminGiftCardRedemptionForm" class="grid cols-4" style="gap:10px;align-items:end"><label><span class="small">Order ID</span><input name="order_id" type="number" min="1" value="${esc(currentOrderId || '')}"></label><label><span class="small">Gift-card code</span><input name="code" placeholder="DND-XXXX-XXXX-XXXX"></label><label><span class="small">Amount cents</span><input name="amount_cents" type="number" min="0" step="1" placeholder="blank = remaining balance"></label><label><span class="small">Note</span><input name="notes" placeholder="Admin note"></label><button class="btn primary" type="submit">Redeem gift card</button></form><div id="adminGiftCardRedemptionMessage" class="small" style="margin-top:10px"></div>`;
    content.appendChild(panel);
    panel.querySelector('form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const msg = document.getElementById('adminGiftCardRedemptionMessage');
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      payload.order_id = Number(payload.order_id || currentOrderId || 0) || null;
      payload.amount_cents = Number(payload.amount_cents || 0) || 0;
      try {
        if (msg) msg.textContent = 'Redeeming gift card...';
        const response = await window.DDAuth.apiFetch('/api/admin/gift-card-redemptions', { method: 'POST', body: JSON.stringify(payload) });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Gift-card redemption failed.');
        if (msg) msg.textContent = `${data.message || 'Gift card redeemed.'} Remaining ${(Number(data.remaining_amount_cents || 0) / 100).toFixed(2)}.`;
      } catch (error) { if (msg) msg.textContent = error.message || 'Gift-card redemption failed.'; }
    });
  }
  new MutationObserver(injectPanel).observe(document.body, { childList: true, subtree: true });
});
