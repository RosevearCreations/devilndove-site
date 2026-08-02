// File: /public/js/custom-request-consent.js
// Brief description: Public token page for customer review/photo/media-consent responses after custom request fulfillment.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('customRequestConsentMount');
  if (!mount) return;
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function setMsg(text, isError = false) {
    const el = document.getElementById('consentResponseMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function render(prompt) {
    const already = prompt.public_response_status === 'responded';
    mount.innerHTML = `<div class="quote-preview-card">
      <h2 style="margin-top:0">${esc(prompt.subject || 'Devil n Dove custom work')}</h2>
      <p class="small">For ${esc(prompt.customer_name || 'customer')} • ${esc(prompt.customer_email || '')}</p>
      <pre class="quote-preview-scope">${esc(prompt.body_text || '')}</pre>
      <p>${esc(prompt.consent_question_text || 'Please choose how we may use photos or review text from this custom request.')}</p>
      ${already ? `<div class="status-note">Response recorded: ${esc(prompt.public_use_scope || 'private_only')}</div><p class="small">${esc(prompt.customer_response_note || '')}</p>` : `<form id="consentResponseForm" class="admin-form-grid">
        <label style="grid-column:1/-1">Photo/process use permission<select class="input" name="public_use_scope" required>
          <option value="private_only">Private only — do not use publicly</option>
          <option value="website_gallery">Website/gallery okay</option>
          <option value="social_only">Social post okay</option>
          <option value="all_public_ok">Website/gallery/social okay</option>
        </select></label>
        <label style="grid-column:1/-1">Optional review text<textarea class="input" name="review_text" rows="4" placeholder="A short review or note about the custom piece"></textarea></label>
        <label style="grid-column:1/-1">Anything we should know?<textarea class="input" name="customer_response_note" rows="4" placeholder="Any limits, name preference, photo limits, or private notes"></textarea></label>
        <button class="btn primary" type="submit">Save my response</button>
      </form>`}
      <div id="consentResponseMessage" class="small" style="display:none;margin-top:10px"></div>
    </div>`;
    document.getElementById('consentResponseForm')?.addEventListener('submit', submitResponse);
  }

  async function submitResponse(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target).entries());
    payload.token = token;
    try {
      setMsg('Saving response...');
      const response = await fetch('/api/custom-request-consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Could not save response.');
      setMsg(data.message || 'Response saved. Thank you.');
      await load();
    } catch (error) {
      setMsg(error.message || 'Could not save response.', true);
    }
  }

  async function load() {
    if (!token) { mount.innerHTML = '<p class="small">Missing consent token.</p>'; return; }
    mount.innerHTML = '<p class="small">Loading consent prompt...</p>';
    try {
      const response = await fetch(`/api/custom-request-consent?token=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Consent prompt could not be loaded.');
      render(data.prompt || {});
    } catch (error) {
      mount.innerHTML = `<p class="small" style="color:#b00020">${esc(error.message || 'Consent prompt could not be loaded.')}</p>`;
    }
  }

  load();
});
