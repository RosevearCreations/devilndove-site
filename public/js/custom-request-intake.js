// File: /public/js/custom-request-intake.js
// Release 467 Build 296: progressive Custom Work intake over the existing Build 210/216 authority.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customRequestForm');
  const msg = document.getElementById('customRequestMessage');
  if (!form) return;

  const DRAFT_KEY = 'dd_custom_request_draft_v296';
  const DRAFT_MAX_AGE_MS = 8 * 60 * 60 * 1000;
  const draftStatus = document.getElementById('customDraftStatus');
  const technicalDetails = document.getElementById('customTechnicalDetails');
  const giftDetails = document.getElementById('customGiftDetails');
  const giftIntent = form.elements.gift_intent;
  const requestType = form.elements.request_type;
  const suppliedToggle = form.querySelector('[name="supplied_item"]');
  const suppliedDetails = document.getElementById('customSuppliedItemDetails');
  let startedTracked = false;
  let saveTimer = 0;

  const track = (event, data = {}) => {
    try { window.DDAnalytics?.trackVisit(event, data); } catch {}
  };
  function setMsg(text, isError = false) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.style.display = text ? 'block' : 'none';
    msg.style.color = isError ? '#b00020' : '#0a7a2f';
  }
  function syncGiftDetails() {
    if (!giftDetails) return;
    const show = ['gift', 'memorial', 'event'].includes(String(giftIntent?.value || ''));
    giftDetails.hidden = !show;
  }
  function syncSuppliedDetails() {
    const active = Boolean(suppliedToggle?.checked);
    if (suppliedDetails) suppliedDetails.style.display = active ? 'block' : 'none';
    suppliedDetails?.querySelectorAll('input,select,textarea').forEach((el) => { el.disabled = !active; });
    if (active && technicalDetails) technicalDetails.open = true;
  }
  function syncTechnicalDisclosure() {
    const type = String(requestType?.value || '');
    const shouldOpen = Boolean(
      suppliedToggle?.checked ||
      ['prototype', 'batch_event', 'repair_or_remake', 'customer_supplied_item'].includes(type) ||
      form.elements.requested_capability_key?.value ||
      form.elements.help_choose_method?.checked
    );
    if (shouldOpen && technicalDetails) technicalDetails.open = true;
  }
  function serializableDraft() {
    const values = {};
    form.querySelectorAll('input,select,textarea').forEach((el) => {
      if (!el.name || el.type === 'file' || el.name === 'consent_to_contact') return;
      values[el.name] = (el.type === 'checkbox' || el.type === 'radio') ? Boolean(el.checked) : el.value;
    });
    return { saved_at: Date.now(), values };
  }
  function saveDraft() {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(serializableDraft()));
      if (draftStatus) draftStatus.textContent = 'Draft saved in this browser tab. File selections are never saved.';
    } catch {}
  }
  function queueDraftSave() {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveDraft, 250);
  }
  function clearDraft(updateMessage = true) {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    if (updateMessage && draftStatus) draftStatus.textContent = 'Saved draft cleared. File selections were never stored.';
  }
  function restoreDraft() {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft?.saved_at || Date.now() - Number(draft.saved_at) > DRAFT_MAX_AGE_MS || !draft.values) {
        clearDraft(false);
        return false;
      }
      Object.entries(draft.values).forEach(([name, value]) => {
        const el = form.elements[name];
        if (!el || el.type === 'file' || name === 'consent_to_contact') return;
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = Boolean(value);
        else if (!el.value) el.value = String(value ?? '');
      });
      if (draftStatus) draftStatus.textContent = 'Draft restored from this browser tab. Review it before sending.';
      track('custom_intake_draft_restored', { age_minutes: Math.max(0, Math.round((Date.now() - Number(draft.saved_at)) / 60000)) });
      return true;
    } catch {
      clearDraft(false);
      return false;
    }
  }

  try {
    const params = new URLSearchParams(window.location.search || '');
    const keys = ['request_type','project_intent','quantity','requested_capability_key','product_interest','intended_use','organization_name','event_context_structured','desired_material','desired_finish','personalization_text','tolerance_size_notes','gift_intent','recipient_name','occasion','wrap_preference','fulfillment_preference','event_context','gift_message','deadline_date','scent_profile','wax_or_base','colour_notes','ingredient_notes'];
    keys.forEach((key) => { if (params.get(key) && form.elements[key]) form.elements[key].value = params.get(key); });
  } catch {}

  restoreDraft();

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
        if (option.value && !Array.from(select.options).some((o) => o.value === option.value)) select.appendChild(option);
      }
      if (existing && Array.from(select.options).some((o) => o.value === existing)) select.value = existing;
    } catch {}
  }

  form.addEventListener('input', (event) => {
    if (!startedTracked) {
      startedTracked = true;
      track('custom_intake_started', { first_field: String(event.target?.name || '') });
    }
    queueDraftSave();
  });
  form.addEventListener('change', () => {
    syncGiftDetails();
    syncSuppliedDetails();
    syncTechnicalDisclosure();
    queueDraftSave();
  });
  technicalDetails?.addEventListener('toggle', () => {
    if (technicalDetails.open) track('custom_intake_advanced_opened', { request_type: String(requestType?.value || '') });
  });
  document.getElementById('clearCustomRequestDraft')?.addEventListener('click', () => clearDraft(true));

  syncGiftDetails();
  syncSuppliedDetails();
  syncTechnicalDisclosure();
  void loadCapabilities();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const referenceFiles = Array.from(form.querySelector('[name="reference_images"]')?.files || []);
    const conditionFiles = Array.from(form.querySelector('[name="supplied_item_condition_images"]')?.files || []);
    if (referenceFiles.length + conditionFiles.length > 5) {
      setMsg('Please choose no more than 5 images total for this request.', true);
      return;
    }
    const payload = Object.fromEntries(formData.entries());
    delete payload.reference_images;
    delete payload.supplied_item_condition_images;
    try {
      const params = new URLSearchParams(window.location.search || '');
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => { payload[key] = params.get(key) || ''; });
      payload.visitor_token = window.DDAnalytics?.visitor_token || '';
      payload.browser_session_token = window.DDAnalytics?.browser_session_token || '';
    } catch {}
    payload.consent_to_contact = form.querySelector('[name="consent_to_contact"]')?.checked ? 1 : 0;
    payload.supplied_item = suppliedToggle?.checked ? 1 : 0;
    payload.help_choose_method = form.querySelector('[name="help_choose_method"]')?.checked ? 1 : 0;
    payload.attachment_urls = String(payload.attachment_urls || '').split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    payload.build151_context = true;
    payload.build210_structured_intake = true;
    payload.build296_progressive_intake = true;
    setMsg('Sending custom request…');
    try {
      const response = await fetch('/api/custom-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Custom request could not be sent.');
      try { window.DDAnalytics?.trackVisit('custom_request_submitted', { request_type: payload.request_type || '', fulfillment_preference: payload.fulfillment_preference || '', gift_intent: payload.gift_intent || '', custom_request_id: data.custom_request_id || null, progressive_intake: true }); } catch {}
      let uploadMessage = '';
      const uploadPlans = [
        ...conditionFiles.map((file) => ({ file, evidence_role: 'intake_condition' })),
        ...referenceFiles.map((file) => ({ file, evidence_role: '' }))
      ];
      if (uploadPlans.length && data.request_key && data.upload_token) {
        const uploaded = [], failed = [];
        for (const plan of uploadPlans) {
          const upload = new FormData();
          upload.append('request_key', data.request_key);
          upload.append('upload_token', data.upload_token);
          upload.append('file', plan.file);
          if (plan.evidence_role) upload.append('evidence_role', plan.evidence_role);
          try {
            const uploadResponse = await fetch('/api/custom-request-reference-upload', { method: 'POST', body: upload });
            const uploadData = await uploadResponse.json().catch(() => null);
            if (!uploadResponse.ok || !uploadData?.ok) throw new Error(uploadData?.error || 'upload failed');
            uploaded.push({ name: plan.file.name || 'image', role: plan.evidence_role || 'reference' });
          } catch (uploadError) {
            failed.push(`${plan.file.name || 'image'} (${uploadError.message || 'upload failed'})`);
          }
        }
        const conditionCount = uploaded.filter((x) => x.role === 'intake_condition').length;
        const referenceCount = uploaded.filter((x) => x.role !== 'intake_condition').length;
        if (conditionCount) uploadMessage += ` ${conditionCount} condition photo(s) linked as private intake evidence.`;
        if (referenceCount) uploadMessage += ` ${referenceCount} reference image(s) uploaded for private review.`;
        if (failed.length) uploadMessage += ` ${failed.length} image upload(s) did not finish; the written request was still saved.`;
      }
      form.reset();
      clearDraft(false);
      syncGiftDetails();
      syncSuppliedDetails();
      if (technicalDetails) technicalDetails.open = false;
      setMsg(`${data.message || 'Custom request received.'}${uploadMessage}`.trim());
    } catch (error) {
      setMsg(error.message || 'Custom request could not be sent.', true);
      saveDraft();
    }
  });
});
