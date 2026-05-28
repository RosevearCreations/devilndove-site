// File: /public/js/custom-request-quote-preview.js
// Brief description: Public token-protected custom quote preview with accept/decline response controls.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('customQuotePreviewMount');
  if (!mount) return;
  const params = new URLSearchParams(window.location.search || '');
  const token = params.get('token') || '';
  function esc(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function setMessage(text, isError = false) { const el = document.getElementById('quotePreviewMessage'); if (!el) return; el.textContent = text || ''; el.style.display = text ? 'block' : 'none'; el.style.color = isError ? '#b00020' : '#0a7a2f'; }
  function render(data) {
    const quote = data.quote || {};
    const closed = !['active', 'viewed'].includes(String(quote.share_status || ''));
    mount.innerHTML = `<div class="quote-preview-card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h2 style="margin-top:0">${esc(quote.title || 'Custom quote')}</h2><p class="small">For ${esc(quote.customer_name || 'customer')} • ${esc(quote.request_type || 'custom request')}</p></div><span class="status-note">${esc(quote.share_status || 'active')}</span></div><div class="quote-preview-total"><span>Planning total</span><strong>${esc(quote.quote_total_label || '—')}</strong></div><h3>Scope notes</h3><pre class="quote-preview-scope">${esc(quote.scope_summary || 'No scope notes were added yet.')}</pre><h3>Payment planning</h3>${(quote.payment_candidates || []).length ? `<ul>${quote.payment_candidates.map((row) => `<li><strong>${esc(row.candidate_type || 'payment')}</strong>: ${esc(row.amount_label || '—')} <span class="small">${esc(row.description || '')}</span></li>`).join('')}</ul>` : `<p class="small">No deposit or invoice candidate has been prepared yet.</p>`}<p class="small">Payment values are planning values. Nothing is charged from this page.</p>${closed ? `<div class="status-note">Response recorded: ${esc(quote.accepted_at ? 'accepted' : quote.declined_at ? 'declined' : quote.share_status)}</div>` : `<label>Your note, optional<textarea class="input" id="quotePreviewNote" rows="4" placeholder="Add any changes, questions, pickup/shipping notes, or timing notes."></textarea></label><div class="quote-preview-actions"><button class="btn primary" type="button" data-quote-response="accept">Accept planning quote</button><button class="btn" type="button" data-quote-response="decline">Decline / not now</button></div>`}<div id="quotePreviewMessage" class="status-note" style="display:none;margin-top:12px"></div></div>`;
  }
  async function load() {
    if (!token) { mount.textContent = 'Missing quote token.'; return; }
    try { const response = await fetch(`/api/custom-request-quote?token=${encodeURIComponent(token)}`); const data = await response.json().catch(() => null); if (!response.ok || !data?.ok) throw new Error(data?.error || 'Quote could not be loaded.'); render(data); }
    catch (error) { mount.innerHTML = `<p class="status-note" style="color:#b00020">${esc(error.message || 'Quote could not be loaded.')}</p>`; }
  }
  async function respond(action) {
    try {
      setMessage('Saving your response...');
      const response = await fetch('/api/custom-request-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, action, customer_response_note: document.getElementById('quotePreviewNote')?.value || '' }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Response could not be saved.');
      render(data);
      setMessage(data.message || 'Response saved.');
    } catch (error) { setMessage(error.message || 'Response could not be saved.', true); }
  }
  mount.addEventListener('click', (event) => { const button = event.target.closest('[data-quote-response]'); if (button) respond(button.getAttribute('data-quote-response')); });
  load();
});
