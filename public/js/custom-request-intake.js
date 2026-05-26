// File: /public/js/custom-request-intake.js
// Brief description: Handles the public custom request intake form for engraving, personalized gifts, and workshop-made commissions.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customRequestForm');
  const msg = document.getElementById('customRequestMessage');
  if (!form) return;

  function setMsg(text, isError = false) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.style.display = text ? 'block' : 'none';
    msg.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const params = new URLSearchParams(window.location.search || '');
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => { payload[key] = params.get(key) || ''; });
      payload.visitor_token = window.DDAnalytics?.visitor_token || '';
      payload.browser_session_token = window.DDAnalytics?.browser_session_token || '';
    } catch {}
    payload.consent_to_contact = form.querySelector('[name="consent_to_contact"]')?.checked ? 1 : 0;
    payload.attachment_urls = String(payload.attachment_urls || '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    setMsg('Sending custom request...');
    try {
      const response = await fetch('/api/custom-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Custom request could not be sent.');
      try { window.DDAnalytics?.trackVisit('custom_request_submitted', { request_type: payload.request_type || '', custom_request_id: data.custom_request_id || null }); } catch {}
      form.reset();
      setMsg(data.message || 'Custom request received.');
    } catch (error) {
      setMsg(error.message || 'Custom request could not be sent.', true);
    }
  });
});
