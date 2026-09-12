// Release 467 Build 108 — Mobile Workshop Assistant.
// Review-first browser-local capture. No upload, Product/Inventory mutation, D1/R2 write or provider publication.
(() => {
  'use strict';

  const BUILD = 108;
  const CONTRACT = 'mobile-workshop-assistant';
  const STORAGE_KEY = 'dd_mobile_workshop_assistant_v1';
  const PUBLICATION_AUTHORIZED = false;
  const PRODUCT_READ_PATH = '/api/products?limit=100';
  const $ = (id) => document.getElementById(id);
  const text = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const nowIso = () => new Date().toISOString();
  let photoUrl = '';
  let products = [];

  const defaults = () => ({
    build: BUILD,
    contract: CONTRACT,
    product_id: '',
    product_name: '',
    product_reference: '',
    privacy: 'private',
    consent: 'unknown',
    image_role: 'process',
    story_note: '',
    caption_draft: '',
    photo_name: '',
    photo_type: '',
    photo_size: 0,
    photo_last_modified: 0,
    captured_at: '',
    updated_at: nowIso(),
    publication_authorized: false
  });

  function loadState() {
    try { return {...defaults(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {})}; }
    catch { return defaults(); }
  }
  let state = loadState();

  function saveState() {
    state.updated_at = nowIso();
    state.publication_authorized = false;
    // Image bytes/object URLs are deliberately excluded from browser persistence.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setMessage(message, tone='') {
    const el = $('mobileWorkshopMessage');
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || '';
    el.dataset.tone = tone;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function consentStatus() {
    const publicCandidate = state.privacy === 'public_candidate';
    const positive = ['owner_no_people','explicit_release'].includes(state.consent);
    const explicitHold = state.consent === 'third_party_hold';
    if (publicCandidate && !positive) {
      return {state:'blocked', label:'PUBLIC HOLD', detail: explicitHold
        ? 'Third-party/customer media stays private until explicit consent evidence is verified.'
        : 'Public-use candidates require owner/no-people evidence or an explicit release before downstream public review.'};
    }
    if (state.privacy === 'private') return {state:'private', label:'PRIVATE', detail:'Private workshop reference. No public-use authority is implied.'};
    if (state.privacy === 'internal_review') return {state:'review', label:'INTERNAL REVIEW', detail:'Internal review is allowed; public publication remains closed.'};
    return {state:'review', label:'PUBLIC CANDIDATE', detail:'Consent evidence is recorded, but specialist moderation/review is still required before any public use.'};
  }

  function renderConsent() {
    const status = consentStatus();
    const el = $('mobileWorkshopConsentState');
    if (el) {
      el.className = `mwa-state small is-${status.state}`;
      el.innerHTML = `<strong>${esc(status.label)}</strong> — ${esc(status.detail)}`;
    }
  }

  function selectedProduct() {
    return products.find((row) => String(row.id ?? row.product_id ?? '') === String(state.product_id || '')) || null;
  }

  function productLabel(row) {
    const id = row.id ?? row.product_id ?? '';
    const name = text(row.name || row.product_name || 'Unnamed Product');
    const ref = text(row.sku || row.product_number || row.dd_number || row.slug || '');
    return `${name}${ref ? ` — ${ref}` : ''}${id ? ` (#${id})` : ''}`;
  }

  function renderProducts(filter='') {
    const select = $('mobileWorkshopProduct');
    if (!select) return;
    const q = text(filter).toLowerCase();
    const rows = products.filter((row) => !q || productLabel(row).toLowerCase().includes(q));
    select.innerHTML = '<option value="">No Product — general workshop capture</option>' + rows.map((row) => {
      const id = String(row.id ?? row.product_id ?? '');
      return `<option value="${esc(id)}">${esc(productLabel(row))}</option>`;
    }).join('');
    select.value = String(state.product_id || '');
    if (state.product_id && !select.value) {
      const option = document.createElement('option');
      option.value = state.product_id;
      option.textContent = state.product_name || `Saved Product #${state.product_id}`;
      select.appendChild(option);
      select.value = state.product_id;
    }
  }

  async function loadProducts() {
    const stateEl = $('mobileWorkshopProductState');
    if (stateEl) stateEl.textContent = 'Loading existing Products read-only…';
    try {
      const response = await fetch(PRODUCT_READ_PATH, {method:'GET', cache:'no-store', headers:{'Accept':'application/json'}});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Product lookup failed (${response.status}).`);
      products = Array.isArray(data.products) ? data.products : [];
      renderProducts($('mobileWorkshopProductSearch')?.value || '');
      if (stateEl) stateEl.textContent = `${products.length} Product${products.length === 1 ? '' : 's'} available for optional read-only association.`;
    } catch (error) {
      products = [];
      renderProducts('');
      if (stateEl) stateEl.textContent = `Product lookup unavailable. General workshop capture still works. ${text(error?.message)}`;
    }
  }

  function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (!n) return '0 B';
    if (n < 1024) return `${n} B`;
    if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
    return `${(n/(1024*1024)).toFixed(1)} MB`;
  }

  function handlePhoto(file) {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = '';
    const wrap = $('mobileWorkshopPreviewWrap');
    const img = $('mobileWorkshopPreview');
    if (!file || !file.type?.startsWith('image/')) {
      state.photo_name = '';
      state.photo_type = '';
      state.photo_size = 0;
      state.photo_last_modified = 0;
      state.captured_at = '';
      saveState();
      if (wrap) wrap.hidden = true;
      return;
    }
    photoUrl = URL.createObjectURL(file);
    if (img) img.src = photoUrl;
    state.photo_name = file.name || 'camera-capture';
    state.photo_type = file.type || 'image/*';
    state.photo_size = Number(file.size || 0);
    state.photo_last_modified = Number(file.lastModified || 0);
    state.captured_at = nowIso();
    saveState();
    if (wrap) wrap.hidden = false;
    const meta = $('mobileWorkshopPhotoMeta');
    if (meta) meta.textContent = `${state.photo_name} • ${state.photo_type} • ${formatBytes(state.photo_size)} • local tab preview only`;
    renderReadiness();
  }

  function generatedCaption() {
    const product = text(state.product_name);
    const story = text(state.story_note);
    const roleMap = {
      process:'Workshop process', technique:'Technique detail', materials:'Materials in the workshop',
      product_gallery:'Product detail', product_hero:'Finished Product candidate', proof:'Workshop proof/evidence',
      packaging:'Packaging detail', social_candidate:'Workshop moment'
    };
    const lead = product ? `${product} — ${roleMap[state.image_role] || 'Workshop note'}.` : `${roleMap[state.image_role] || 'Workshop note'}.`;
    const body = story || 'Add the workshop story before using this draft.';
    return `${lead} ${body}\n\nDraft for review only — not published.`;
  }

  function reviewPackage() {
    const status = consentStatus();
    return {
      release: 467,
      build: BUILD,
      contract: CONTRACT,
      created_at: nowIso(),
      source: 'admin/mobile-workshop-assistant',
      product: {
        id: state.product_id || null,
        name: state.product_name || null,
        reference: state.product_reference || null
      },
      media: {
        file_name: state.photo_name || null,
        mime_type: state.photo_type || null,
        byte_size: state.photo_size || 0,
        last_modified: state.photo_last_modified || 0,
        captured_at: state.captured_at || null,
        binary_included: false,
        upload_performed: false
      },
      privacy: state.privacy,
      consent: state.consent,
      consent_review: status,
      image_role: state.image_role,
      story_note: state.story_note,
      caption_draft: state.caption_draft,
      publication_authorized: PUBLICATION_AUTHORIZED,
      downstream_review_required: true,
      specialist_authorities: {
        media_studio: '/admin/media-content-studio/',
        product_capture: '/admin/mobile-product/',
        content_studio: '/admin/content-studio/',
        caip_handoff: '/admin/caip-content-handoff/',
        photo_moderation: '/admin/stage-photo-moderation/'
      },
      safety: {
        d1_mutation: false,
        r2_mutation: false,
        product_mutation: false,
        inventory_mutation: false,
        provider_execution: false,
        provider_publication: false
      }
    };
  }

  function renderReadiness() {
    const status = consentStatus();
    const missing = [];
    if (!state.photo_name) missing.push('capture a photo');
    if (!text(state.story_note)) missing.push('add a story note');
    if (!text(state.caption_draft)) missing.push('prepare a caption/content draft');
    if (state.privacy === 'public_candidate' && !['owner_no_people','explicit_release'].includes(state.consent)) missing.push('resolve public-use consent evidence');
    const el = $('mobileWorkshopReadiness');
    if (!el) return;
    const blocked = status.state === 'blocked';
    const complete = missing.length === 0;
    el.className = `mwa-state ${blocked ? 'is-blocked' : complete ? 'is-ready' : 'is-review'}`;
    el.innerHTML = `<strong>${blocked ? 'HOLD' : complete ? 'READY FOR SPECIALIST REVIEW' : 'WORKING DRAFT'}</strong><div class="small">${missing.length ? `Still needed: ${esc(missing.join('; '))}.` : 'The handoff package is complete enough for specialist review. Publication is still disabled.'}</div>`;
  }

  function hydrate() {
    $('mobileWorkshopPrivacy').value = state.privacy;
    $('mobileWorkshopConsent').value = state.consent;
    $('mobileWorkshopRole').value = state.image_role;
    $('mobileWorkshopStory').value = state.story_note;
    $('mobileWorkshopCaption').value = state.caption_draft;
    $('mobileWorkshopStoryCount').textContent = String(state.story_note.length);
    renderConsent();
    renderReadiness();
    if (state.photo_name) {
      const meta = $('mobileWorkshopPhotoMeta');
      if (meta) meta.textContent = `${state.photo_name} • ${state.photo_type || 'image'} • ${formatBytes(state.photo_size)} • file must be reselected after reload`;
    }
  }

  async function copySummary() {
    const p = reviewPackage();
    const lines = [
      `Mobile Workshop Assistant — Build ${BUILD}`,
      `Product: ${p.product.name || 'General workshop capture'}${p.product.reference ? ` (${p.product.reference})` : ''}`,
      `Privacy: ${p.privacy}`,
      `Consent: ${p.consent} — ${p.consent_review.label}`,
      `Image role: ${p.image_role}`,
      `Photo: ${p.media.file_name || 'not selected'} (binary not included)`,
      `Story: ${text(p.story_note) || '—'}`,
      `Caption draft: ${text(p.caption_draft) || '—'}`,
      'Publication authorized: NO — specialist review required.'
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setMessage('Review summary copied. No photo bytes or publication authority were copied.', 'success');
    } catch {
      setMessage('Clipboard access was unavailable. Use Download handoff JSON instead.', 'review');
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(reviewPackage(), null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devilndove-workshop-handoff-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Review handoff JSON prepared. It contains metadata and draft text only, not the captured photo.', 'success');
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    state = defaults();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = '';
    $('mobileWorkshopPhoto').value = '';
    $('mobileWorkshopPreviewWrap').hidden = true;
    $('mobileWorkshopProductSearch').value = '';
    hydrate();
    renderProducts('');
    $('mobileWorkshopProduct').value = '';
    setMessage('Local workshop session cleared. No server-side record was changed.', 'success');
  }

  document.addEventListener('DOMContentLoaded', () => {
    hydrate();
    void loadProducts();

    $('mobileWorkshopPhoto')?.addEventListener('change', (event) => handlePhoto(event.target.files?.[0] || null));
    $('mobileWorkshopPrivacy')?.addEventListener('change', (event) => { state.privacy = event.target.value; saveState(); renderConsent(); renderReadiness(); });
    $('mobileWorkshopConsent')?.addEventListener('change', (event) => { state.consent = event.target.value; saveState(); renderConsent(); renderReadiness(); });
    $('mobileWorkshopRole')?.addEventListener('change', (event) => { state.image_role = event.target.value; saveState(); renderReadiness(); });
    $('mobileWorkshopProductSearch')?.addEventListener('input', (event) => renderProducts(event.target.value));
    $('mobileWorkshopRefreshProducts')?.addEventListener('click', () => void loadProducts());
    $('mobileWorkshopProduct')?.addEventListener('change', (event) => {
      state.product_id = event.target.value;
      const row = selectedProduct();
      state.product_name = row ? text(row.name || row.product_name) : '';
      state.product_reference = row ? text(row.sku || row.product_number || row.dd_number || row.slug) : '';
      saveState(); renderReadiness();
    });
    $('mobileWorkshopStory')?.addEventListener('input', (event) => {
      state.story_note = event.target.value;
      $('mobileWorkshopStoryCount').textContent = String(state.story_note.length);
      saveState(); renderReadiness();
    });
    $('mobileWorkshopCaption')?.addEventListener('input', (event) => { state.caption_draft = event.target.value; saveState(); renderReadiness(); });
    $('mobileWorkshopGenerateCaption')?.addEventListener('click', () => {
      state.caption_draft = generatedCaption();
      $('mobileWorkshopCaption').value = state.caption_draft;
      saveState(); renderReadiness();
      setMessage('Caption draft prepared locally for review. Nothing was published.', 'success');
    });
    $('mobileWorkshopCopySummary')?.addEventListener('click', () => void copySummary());
    $('mobileWorkshopDownloadJson')?.addEventListener('click', downloadJson);
    $('mobileWorkshopClear')?.addEventListener('click', clearSession);
  }, {once:true});

  globalThis.DDMobileWorkshopAssistant = Object.freeze({BUILD, CONTRACT, STORAGE_KEY, PRODUCT_READ_PATH, PUBLICATION_AUTHORIZED, reviewPackage});
})();
