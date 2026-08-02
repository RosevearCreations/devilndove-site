// File: /public/js/custom-request-payment.js
// Brief description: Loads a private approved custom request payment link, shows the connected order, and prepares Stripe/PayPal/Square/manual checkout handoffs when available.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('customRequestPaymentMount');
  if (!mount) return;
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function showMessage(text, isError = false) {
    const el = document.getElementById('paymentLinkMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  async function prepareCheckout(provider) {
    try {
      showMessage(`Preparing ${provider} checkout...`);
      const response = await fetch('/api/custom-request-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'prepare_checkout', provider })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not prepare checkout.');
      if (data.checkout?.redirect_url) {
        showMessage('Checkout is ready. Opening the secure provider page...');
        window.location.href = data.checkout.redirect_url;
        return;
      }
      showMessage(data.message || 'Payment checkout record prepared for manual follow-up.');
    } catch (error) {
      showMessage(error.message || 'Could not prepare checkout.', true);
    }
  }

  function providerButtons(payment) {
    const providers = Array.isArray(payment.provider_options) && payment.provider_options.length ? payment.provider_options : ['stripe', 'paypal', 'square', 'manual'];
    return `<div class="custom-request-actions" style="margin-top:12px">${providers.map((provider) => `<button class="btn small" type="button" data-prepare-provider="${esc(provider)}">Prepare ${esc(provider).replace(/^./, (letter) => letter.toUpperCase())}</button>`).join('')}</div>`;
  }

  function checkoutHistory(payment) {
    const records = Array.isArray(payment.checkout_records) ? payment.checkout_records : [];
    if (!records.length) return '<p class="small">No checkout handoff has been prepared yet.</p>';
    return `<div class="small" style="margin-top:10px">${records.slice(0, 6).map((row) => `${esc(row.updated_at || '')} • ${esc(row.provider || '')} • ${esc(row.checkout_status || '')}${row.redirect_url ? ' • redirect ready' : ''}`).join('<br>')}</div>`;
  }

  function render(payment) {
    mount.innerHTML = `<div class="quote-preview-card">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">${esc(payment.quote_title || 'Custom request payment')}</h2><p class="small">For ${esc(payment.customer_name || 'customer')} • ${esc(payment.request_type || 'payment')}</p></div>
        <span class="status-note">${esc(payment.link_status || 'active')}</span>
      </div>
      <div class="quote-preview-total"><span>Approved payment request</span><strong>${esc(payment.amount_label || '—')}</strong></div>
      <div class="quote-preview-breakdown small"><div>Tax included/allocated: <strong>${esc(payment.tax_label || '—')}</strong></div><div>Provider route: <strong>${esc(payment.provider || 'manual review')}</strong></div><div>Order: <strong>${esc(payment.order_number || 'reviewed custom order')}</strong></div><div>Order status: <strong>${esc(payment.order_status || 'pending')}</strong> / payment <strong>${esc(payment.payment_status || 'pending')}</strong></div></div>
      <h3>Scope note</h3>
      <pre class="quote-preview-scope">${esc(payment.scope_notes || 'No scope note is attached.')}</pre>
      <p class="small">${esc(payment.safety_note || '')}</p>
      <h3>Checkout options</h3>
      <p class="small">Choose a payment handoff only after the quote/order details look right. Stripe and PayPal redirect when configured; Square/manual records are kept for review and follow-up.</p>
      ${providerButtons(payment)}
      ${checkoutHistory(payment)}
      ${payment.ready_at ? `<div class="status-note">Readiness already recorded: ${esc(payment.ready_at)}</div><p class="small">${esc(payment.customer_note || '')}</p>` : `<label class="small">Optional note before payment<textarea id="paymentCustomerNote" class="input" rows="4" placeholder="Pickup, shipping, timing, or payment question"></textarea></label><button class="btn primary" type="button" id="paymentReadyButton">I am ready for final payment instructions</button>`}
      <div id="paymentLinkMessage" class="small" style="display:none;margin-top:10px"></div>
    </div>`;
    mount.querySelectorAll('[data-prepare-provider]').forEach((button) => button.addEventListener('click', () => prepareCheckout(button.getAttribute('data-prepare-provider') || 'manual')));
    document.getElementById('paymentReadyButton')?.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/custom-request-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, customer_note: document.getElementById('paymentCustomerNote')?.value || '' })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not save readiness note.');
        showMessage(data.message || 'Payment readiness note saved.');
      } catch (error) {
        showMessage(error.message || 'Could not save readiness note.', true);
      }
    });
  }

  async function load() {
    if (!token) {
      mount.innerHTML = '<p class="small">Missing payment token.</p>';
      return;
    }
    mount.innerHTML = '<p class="small">Loading payment link...</p>';
    try {
      const response = await fetch(`/api/custom-request-payment?token=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Payment link could not be loaded.');
      render(data.payment || {});
    } catch (error) {
      mount.innerHTML = `<p class="small" style="color:#b00020">${esc(error.message || 'Payment link could not be loaded.')}</p>`;
    }
  }

  load();
});
