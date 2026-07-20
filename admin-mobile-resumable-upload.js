// File: /public/js/admin-mobile-resumable-upload.js
// Build 193: client for R2 multipart mobile image upload. The browser must re-select a file after reload,
// but completed R2 parts are discovered and skipped so the upload can continue.

document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('mobileResumableUploadMount');
  const fileInput = document.getElementById('mobileProductImages');
  const productIdInput = document.getElementById('mobileDraftProductId');
  const draftReference = document.querySelector('input[name="capture_reference"]');
  const productName = document.querySelector('input[name="name"]');
  if (!mount || !fileInput || !window.DDAuth) return;

  const CHUNK_BYTES = 5 * 1024 * 1024;
  const MAX_BYTES = 50 * 1024 * 1024;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state = { sessions: [], busy: false };

  async function parse(response) {
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Resumable image upload request failed.');
    return data;
  }
  async function get(url) {
    return parse(await window.DDAuth.apiFetch(url));
  }
  async function postForm(form) {
    return parse(await window.DDAuth.apiFetch('/api/admin/mobile-resumable-upload', { method:'POST', body:form }));
  }
  async function postJson(payload) {
    return parse(await window.DDAuth.apiFetch('/api/admin/mobile-resumable-upload', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) }));
  }
  function currentProductId() { return Number(productIdInput?.value || 0) || 0; }
  function currentFiles() { return Array.from(fileInput.files || []).filter((file) => /^image\//i.test(file.type || '')); }
  function sessionForFile(file) {
    return state.sessions.find((session) => Number(session.product_id || 0) === currentProductId()
      && String(session.file_name || '') === String(file.name || '')
      && Number(session.expected_bytes || 0) === Number(file.size || 0)
      && !['completed','aborted'].includes(String(session.upload_status || '').toLowerCase()));
  }
  function statusPill(status) {
    const normalized = String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    return `<span class="status-pill status-${esc(normalized)}">${esc(String(status || 'unknown').replace(/_/g,' '))}</span>`;
  }
  function render(message = '', error = false) {
    const productId = currentProductId();
    const files = currentFiles();
    const active = state.sessions.filter((item) => Number(item.product_id || 0) === productId);
    mount.innerHTML = `<section class="mobile-resumable-upload-card" aria-live="polite">
      <div class="mobile-resumable-heading">
        <img class="mobile-resumable-art" src="/assets/visual-placeholders/mobile-upload-safety.svg" alt="Mobile photo upload and recovery placeholder"/>
        <div>
          <h2>Safer large-photo upload</h2>
          <p>Use this for larger files or an unreliable connection. Save and reopen a text-only product draft first. If a connection drops, re-select the same image and resume; finished parts are not sent again.</p>
        </div>
        ${productId ? `<span class="status-pill status-configured">Draft #${esc(productId)} selected</span>` : `<span class="status-pill status-needs-review">Save then reopen a draft first</span>`}
      </div>
      <div class="mobile-resumable-actions">
        <button class="btn secondary" type="button" id="mobileResumableRefresh">Check resumable uploads</button>
        <button class="btn primary" type="button" id="mobileResumableStart" ${(!productId || !files.length || state.busy) ? 'disabled' : ''}>${state.busy ? 'Uploading…' : 'Start or resume selected images'}</button>
      </div>
      <div class="small mobile-resumable-guidance">Do not use the normal Save partial draft button again with the same selected file after this safe uploader starts, or it may create a duplicate upload. Image files are never stored in the form draft; browser security requires re-selecting a file after a full reload.</div>
      ${message ? `<p class="status-note ${error ? 'danger' : 'success'}">${esc(message)}</p>` : ''}
      <div class="mobile-resumable-file-list">${files.length ? files.map((file) => `<div><strong>${esc(file.name)}</strong><span>${Math.round(file.size / 1024)} KB</span>${file.size > MAX_BYTES ? '<em> Over 50 MB limit</em>' : ''}</div>`).join('') : '<div class="small">Choose one or more images in the Photos field above, then start/resume here.</div>'}</div>
      <div class="mobile-resumable-session-list">${active.length ? active.map((session) => `<div class="mobile-resumable-session"><div><strong>${esc(session.file_name)}</strong><span>${Number(session.uploaded_bytes || 0)} / ${Number(session.expected_bytes || 0)} bytes · ${Number(session.chunk_count || 0)} parts</span></div>${statusPill(session.upload_status)}</div>`).join('') : '<div class="small">No resumable sessions for the selected draft yet.</div>'}</div>
    </section>`;
    document.getElementById('mobileResumableRefresh')?.addEventListener('click', () => refresh());
    document.getElementById('mobileResumableStart')?.addEventListener('click', () => startSelected());
  }
  async function refresh(message = '', error = false) {
    try {
      const data = await get('/api/admin/mobile-resumable-upload');
      state.sessions = Array.isArray(data.sessions) ? data.sessions : [];
      render(message, error);
    } catch (err) {
      render(err.message || 'Could not check resumable uploads.', true);
    }
  }
  async function sessionDetails(uploadKey) {
    const data = await get(`/api/admin/mobile-resumable-upload?upload_key=${encodeURIComponent(uploadKey)}`);
    return data.session;
  }
  async function createSession(file) {
    const data = await postJson({
      action:'create',
      product_id:currentProductId(),
      draft_key:(draftReference?.value || productName?.value || '').trim(),
      device_key:navigator.userAgent.slice(0,180),
      file_name:file.name,
      mime_type:file.type || 'application/octet-stream',
      expected_bytes:file.size,
      alt_text:`${(productName?.value || 'Devil n Dove product').trim()} product photo`
    });
    return data.session;
  }
  async function uploadFile(file, initialSession) {
    let session = initialSession;
    const detailed = await sessionDetails(session.upload_key);
    const completed = new Set((detailed.parts || []).map((part) => Number(part.part_number || 0)));
    const totalParts = Math.ceil(file.size / CHUNK_BYTES);
    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      if (completed.has(partNumber)) continue;
      const start = (partNumber - 1) * CHUNK_BYTES;
      const chunk = file.slice(start, Math.min(file.size, start + CHUNK_BYTES), file.type || 'application/octet-stream');
      const form = new FormData();
      form.set('action','upload_part');
      form.set('upload_key',session.upload_key);
      form.set('part_number',String(partNumber));
      form.set('file',chunk,file.name);
      const result = await postForm(form);
      session = result.session || session;
      const progress = `Uploaded ${partNumber} of ${totalParts} parts for ${file.name}.`;
      await refresh(progress, false);
    }
    const completedResult = await postJson({action:'complete',upload_key:session.upload_key});
    return completedResult;
  }
  async function startSelected() {
    const productId = currentProductId();
    const files = currentFiles();
    if (!productId) return render('Save a text-only product draft, then select it from the draft list before using resumable upload.', true);
    if (!files.length) return render('Choose at least one image in the Photos field first.', true);
    const oversize = files.find((file) => file.size > MAX_BYTES);
    if (oversize) return render(`${oversize.name} is larger than the 50 MB safe limit. Resize it before uploading.`, true);
    state.busy = true; render('Preparing upload…');
    try {
      for (const file of files) {
        let session = sessionForFile(file);
        if (!session) session = await createSession(file);
        await uploadFile(file, session);
      }
      fileInput.value = '';
      document.dispatchEvent(new CustomEvent('dd:mobile-resumable-upload-completed', { detail:{ product_id:productId } }));
      await refresh('Resumable image upload completed and attached to the selected draft.');
    } catch (err) {
      await refresh(`${err.message || 'Upload paused.'} Re-select the same file and choose Start or resume to continue.`, true);
    } finally {
      state.busy = false;
      render();
    }
  }
  fileInput.addEventListener('change', () => render());
  document.addEventListener('dd:mobile-product-saved', () => setTimeout(() => refresh(), 200));
  document.addEventListener('dd:mobile-resumable-upload-completed', () => setTimeout(() => refresh(), 200));
  refresh();
});
