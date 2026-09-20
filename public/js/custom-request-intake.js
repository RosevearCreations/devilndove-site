// File: /public/js/custom-request-intake.js
// Release 467 Build 210: Custom Work Intake 2.0 with structured manufacturing intent.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customRequestForm');
  const msg = document.getElementById('customRequestMessage');
  if (!form) return;

  try {
    const params = new URLSearchParams(window.location.search || '');
    const keys = ['request_type','project_intent','quantity','requested_capability_key','product_interest','intended_use','organization_name','event_context_structured','desired_material','desired_finish','personalization_text','tolerance_size_notes','gift_intent','recipient_name','occasion','wrap_preference','fulfillment_preference','event_context','gift_message','deadline_date','scent_profile','wax_or_base','colour_notes','ingredient_notes'];
    keys.forEach((key) => { if (params.get(key) && form.elements[key]) form.elements[key].value = params.get(key); });
  } catch {}

  async function loadCapabilities() {
    const select = form.elements.requested_capability_key;
    if (!select) return;
    try {
      const response = await fetch('/api/capabilities', { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) return;
      const existing = select.value;
      for (const profile of (Array.isArray(data.profiles) ? data.profiles : [])) {
        const option = document.createElement('option');
        option.value = String(profile.capability_key || '');
        option.textContent = String(profile.display_name || profile.capability_key || '');
        if (option.value) select.appendChild(option);
      }
      if (existing && Array.from(select.options).some((o) => o.value === existing)) select.value = existing;
    } catch {}
  }

  function setMsg(text, isError = false) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.style.display = text ? 'block' : 'none';
    msg.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  void loadCapabilities();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const files = Array.from(form.querySelector('[name="reference_images"]')?.files || []).slice(0, 5);
    const payload = Object.fromEntries(formData.entries());
    delete payload.reference_images;
    try {
      const params = new URLSearchParams(window.location.search || '');
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => { payload[key] = params.get(key) || ''; });
      payload.visitor_token = window.DDAnalytics?.visitor_token || '';
      payload.browser_session_token = window.DDAnalytics?.browser_session_token || '';
    } catch {}
    payload.consent_to_contact = form.querySelector('[name="consent_to_contact"]')?.checked ? 1 : 0;
    payload.supplied_item = form.querySelector('[name="supplied_item"]')?.checked ? 1 : 0;
    payload.help_choose_method = form.querySelector('[name="help_choose_method"]')?.checked ? 1 : 0;
    payload.attachment_urls = String(payload.attachment_urls || '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    payload.build151_context = true;
    payload.build210_structured_intake = true;
    setMsg('Sending custom request...');
    try {
      const response = await fetch('/api/custom-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Custom request could not be sent.');
      try { window.DDAnalytics?.trackVisit('custom_request_submitted', { request_type: payload.request_type || '', fulfillment_preference: payload.fulfillment_preference || '', gift_intent: payload.gift_intent || '', custom_request_id: data.custom_request_id || null }); } catch {}
      let uploadMessage = '';
      if (files.length && data.request_key && data.upload_token) {
        const uploaded = [];
        const failed = [];
        for (const file of files) {
          const upload = new FormData();
          upload.append('request_key', data.request_key);
          upload.append('upload_token', data.upload_token);
          upload.append('file', file);
          try {
            const uploadResponse = await fetch('/api/custom-request-reference-upload', { method: 'POST', body: upload });
            const uploadData = await uploadResponse.json().catch(() => null);
            if (!uploadResponse.ok || !uploadData?.ok) throw new Error(uploadData?.error || 'upload failed');
            uploaded.push(file.name || 'image');
          } catch (uploadError) {
            failed.push(`${file.name || 'image'} (${uploadError.message || 'upload failed'})`);
          }
        }
        uploadMessage = uploaded.length ? ` ${uploaded.length} reference image(s) uploaded for private review.` : '';
        if (failed.length) uploadMessage += ` ${failed.length} image upload(s) did not finish; the written request was still saved.`;
      }
      form.reset();
      setMsg(`${data.message || 'Custom request received.'}${uploadMessage}`.trim());
    } catch (error) {
      setMsg(error.message || 'Custom request could not be sent.', true);
    }
  });
});
