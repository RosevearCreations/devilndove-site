// File: /public/js/custom-request-payment.js
// Brief description: Loads a private approved custom request payment link and lets the customer mark that they are ready for final payment instructions.

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

  function render(payment) {
    mount.innerHTML = `<div class="quote-preview-card">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h2 style="margin-top:0">${esc(payment.quote_title || 'Custom request payment')}</h2><p class="small">For ${esc(payment.customer_name || 'customer')} • ${esc(payment.request_type || 'payment')}</p></div>
        <span class="status-note">${esc(payment.link_status || 'active')}</span>
      </div>
      <div class="quote-preview-total"><span>Approved payment request</span><strong>${esc(payment.amount_label || '—')}</strong></div>
      <div class="quote-preview-breakdown small"><div>Tax included/allocated: <strong>${esc(payment.tax_label || '—')}</strong></div><div>Provider route: <strong>${esc(payment.provider || 'manual review')}</strong></div></div>
      <h3>Scope note</h3>
      <pre class="quote-preview-scope">${esc(payment.scope_notes || 'No scope note is attached.')}</pre>
      <p class="small">${esc(payment.safety_note || '')}</p>
      ${payment.ready_at ? `<div class="status-note">Readiness already recorded: ${esc(payment.ready_at)}</div><p class="small">${esc(payment.customer_note || '')}</p>` : `<label class="small">Optional note before payment<textarea id="paymentCustomerNote" class="input" rows="4" placeholder="Pickup, shipping, timing, or payment question"></textarea></label><button class="btn primary" type="button" id="paymentReadyButton">I am ready for final payment instructions</button>`}
      <div id="paymentLinkMessage" class="small" style="display:none;margin-top:10px"></div>
    </div>`;
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
