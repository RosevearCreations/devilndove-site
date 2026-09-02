// Release 467 Build 16 — phone-first Made Today capture.
// Reuses existing Custom Requests read authority and stage-photo moderation upload authority.
// Nothing from this client publishes automatically.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('madeTodayForm');
  const requestSelect = document.getElementById('madeTodayRequest');
  const filesInput = document.getElementById('madeTodayFiles');
  const preview = document.getElementById('madeTodayPreview');
  const message = document.getElementById('madeTodayMessage');
  if (!form || !requestSelect || !window.DDAuth) return;

  let data = { requests: [], order_status_links: [] };
  const clean = (value, limit = 160) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, limit);
  function setMessage(text, error = false) {
    message.textContent = text || '';
    message.style.display = text ? 'block' : 'none';
    message.style.color = error ? '#ff9a9a' : '';
  }
  async function readJson(response) {
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Request failed (${response.status})`);
    return payload;
  }
  function orderForRequest(id) {
    const row = (data.order_status_links || []).find((item) => Number(item.custom_request_id || 0) === Number(id || 0));
    return Number(row?.order_id || 0) || null;
  }
  function fillRequests() {
    const rows = Array.isArray(data.requests) ? data.requests : [];
    const useful = rows.filter((row) => !['declined','archived'].includes(String(row.status || '').toLowerCase()));
    requestSelect.innerHTML = '<option value="">Choose a custom request…</option>' + useful.map((row) => {
      const label = clean(row.product_interest || row.request_type || 'Custom request', 80);
      const customer = clean(row.name || row.email || '', 70);
      const status = clean(row.status || 'new', 30);
      return `<option value="${Number(row.custom_request_id || 0)}">#${Number(row.custom_request_id || 0)} • ${label} • ${customer} • ${status}</option>`;
    }).join('');
  }
  function previewFiles() {
    preview.innerHTML = '';
    const files = Array.from(filesInput?.files || []).slice(0, 8);
    files.forEach((file) => {
      const img = document.createElement('img');
      img.alt = `Selected review photo: ${file.name || 'image'}`;
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      preview.appendChild(img);
    });
  }
  function buildCaption(fd) {
    const parts = [
      ['Result', fd.get('caption')],
      ['Process', fd.get('process_notes')],
      ['Batch/material', fd.get('batch_material_facts')],
      ['Story candidate — review only', fd.get('story_candidate')]
    ].map(([label, value]) => [label, clean(value, 140)]).filter(([, value]) => value);
    return clean(parts.map(([label, value]) => `${label}: ${value}`).join(' | '), 490) || 'Made Today capture — review required.';
  }
  async function load() {
    setMessage('Loading current custom requests…');
    try {
      data = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-requests', { headers: { Accept: 'application/json' } }));
      fillRequests();
      setMessage('Ready. Captures remain private/review-only.');
    } catch (error) {
      requestSelect.innerHTML = '<option value="">Custom Requests unavailable</option>';
      setMessage(error.message || 'Could not load Custom Requests.', true);
    }
  }

  filesInput?.addEventListener('change', previewFiles);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const requestId = Number(fd.get('custom_request_id') || 0);
    const files = Array.from(filesInput?.files || []);
    if (!requestId) { setMessage('Choose a custom request first.', true); return; }
    if (!files.length) { setMessage('Choose at least one finished-work photo.', true); return; }
    const orderId = orderForRequest(requestId);
    const caption = buildCaption(fd);
    const stage = clean(fd.get('stage_key') || 'making', 80);
    setMessage(`Uploading ${files.length} review photo${files.length === 1 ? '' : 's'}…`);
    try {
      const saved = [];
      for (const file of files) {
        const upload = new FormData();
        upload.set('file', file);
        upload.set('custom_request_id', String(requestId));
        if (orderId) upload.set('order_id', String(orderId));
        upload.set('stage_key', stage);
        upload.set('image_caption', caption);
        upload.set('public_use_status', 'customer_private');
        const result = await readJson(await window.DDAuth.apiFetch('/api/admin/custom-order-stage-photos', { method: 'POST', body: upload }));
        saved.push(result.custom_order_stage_photo_id);
      }
      form.reset();
      preview.innerHTML = '';
      setMessage(`Captured ${saved.length} photo${saved.length === 1 ? '' : 's'} for review. No publication occurred. Open Photo Moderation when ready.`);
    } catch (error) {
      setMessage(error.message || 'Made Today capture failed.', true);
    }
  });

  load();
});
