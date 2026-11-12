document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('mobileProductForm');
  const draftSelect = document.getElementById('mobileDraftSelect');
  const refreshDraftsButton = document.getElementById('mobileRefreshDraftsButton');
  const captureModeInput = document.getElementById('mobileCaptureEntryMode');
  const wizardButton = document.getElementById('mobileWizardModeButton');
  const fullButton = document.getElementById('mobileFullModeButton');
  const wizardSummary = document.getElementById('mobileWizardSummary');
  const wizardActions = document.getElementById('mobileWizardActions');
  const prevButton = document.getElementById('mobileWizardPrevButton');
  const nextButton = document.getElementById('mobileWizardNextButton');
  const stepChips = document.getElementById('mobileWizardStepChips');
  const imageInput = document.getElementById('mobileProductImages');
  const todayRefreshButton = document.getElementById('mobileTodayRefreshButton');
  const todaySummary = document.getElementById('mobileTodaySummary');
  const todayMessage = document.getElementById('mobileTodayMessage');
  const todayBody = document.getElementById('mobileTodayTableBody');
  const selectAll = document.getElementById('mobileTodaySelectAll');
  const bulkCategory = document.getElementById('mobileTodayBulkCategory');
  const bulkPrice = document.getElementById('mobileTodayBulkPrice');
  const bulkQty = document.getElementById('mobileTodayBulkQty');
  const bulkStatus = document.getElementById('mobileTodayBulkStatus');
  const bulkApplyButton = document.getElementById('mobileTodayBulkApplyButton');
  const photoHelp = document.getElementById('mobilePhotoHelp');
  if (!form || !window.DDAuth) return;

  let captureMode = captureModeInput?.value === 'full' ? 'full' : 'wizard';
  let wizardStep = 1;
  let todayDrafts = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function formatMoney(cents, currency = 'CAD') {
    const amount = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'CAD' }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }

  function dollarsToCents(value) {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const number = Number(text);
    if (!Number.isFinite(number) || number < 0) return null;
    return Math.round(number * 100);
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'));
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function setTodayMessage(message = '', isError = false) {
    if (!todayMessage) return;
    todayMessage.textContent = message;
    todayMessage.style.display = message ? 'block' : 'none';
    todayMessage.style.color = isError ? '#b00020' : '#0a7a2f';
  }

  function parseApiResponse(response, fallback) {
    return response.text().then((raw) => {
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch {}
      if (!response.ok || !data?.ok) throw new Error(data?.error || fallback || 'Request failed.');
      return data;
    });
  }

  function fieldLabel(name) {
    const field = form.elements?.[name];
    return field ? field.closest('label') : null;
  }

  function basicGroups() {
    return {
      step1: [fieldLabel('name'), fieldLabel('short_description'), fieldLabel('capture_reference')],
      step2: [fieldLabel('price'), fieldLabel('inventory_quantity')],
      step3: [fieldLabel('images'), document.getElementById('mobileImagePreview')]
    };
  }

  function advancedBlocks() {
    return [
      fieldLabel('product_category'),
      fieldLabel('color_name'),
      fieldLabel('compare_at_price'),
      fieldLabel('shipping_code'),
      fieldLabel('tax_class_id'),
      fieldLabel('weight_grams'),
      fieldLabel('sku'),
      fieldLabel('description'),
      fieldLabel('meta_title'),
      fieldLabel('keywords'),
      fieldLabel('meta_description'),
      document.querySelector('.mobile-required-note'),
      document.querySelector('.resource-picker-head'),
      document.getElementById('mobileResourceSummary'),
      document.getElementById('mobileSelectedResources'),
      document.getElementById('mobileResourceGrid')
    ].filter(Boolean);
  }

  function setMode(mode) {
    captureMode = mode === 'full' ? 'full' : 'wizard';
    if (captureModeInput) captureModeInput.value = captureMode;
    if (wizardButton) wizardButton.classList.toggle('primary', captureMode === 'wizard');
    if (fullButton) fullButton.classList.toggle('primary', captureMode === 'full');
    if (wizardActions) wizardActions.style.display = captureMode === 'wizard' ? 'flex' : 'none';
    if (wizardSummary) {
      wizardSummary.textContent = captureMode === 'wizard'
        ? 'Basic wizard keeps the phone entry to name, short description, price, quantity, and 1 to 5 pictures before saving a draft.'
        : 'Full form shows category, SEO, resources, shipping, tax, and deeper listing details.';
    }
    if (photoHelp) {
      photoHelp.textContent = captureMode === 'wizard'
        ? 'Basic wizard expects 1 to 5 pictures. The first picture becomes the featured image.'
        : 'Upload phone photos directly. The first image becomes the featured image.';
    }
    renderWizardStep();
  }

  function renderWizardStep() {
    const groups = basicGroups();
    const advanced = advancedBlocks();
    const chipLabels = ['1. Name + short description', '2. Price + quantity', '3. 1 to 5 pictures'];
    if (stepChips) {
      stepChips.innerHTML = chipLabels.map((label, index) => {
        const step = index + 1;
        const state = captureMode === 'full' ? ' is-optional' : (step < wizardStep ? ' is-done' : step === wizardStep ? ' is-missing' : '');
        return `<span class="mobile-readiness-chip${state}">${escapeHtml(label)}</span>`;
      }).join('');
    }
    if (captureMode === 'full') {
      Object.values(groups).flat().forEach((el) => { if (el) el.style.display = ''; });
      advanced.forEach((el) => { el.style.display = ''; });
      if (nextButton) nextButton.textContent = 'Next step';
      if (prevButton) prevButton.disabled = true;
      return;
    }
    advanced.forEach((el) => { el.style.display = 'none'; });
    Object.entries(groups).forEach(([key, list]) => {
      const visible = key === `step${wizardStep}`;
      list.forEach((el) => { if (el) el.style.display = visible ? '' : 'none'; });
    });
    if (prevButton) prevButton.disabled = wizardStep === 1;
    if (nextButton) nextButton.textContent = wizardStep === 3 ? 'Stay on pictures' : 'Next step';
  }

  function validateWizardBeforeSubmit() {
    const name = String(form.elements?.name?.value || '').trim();
    const shortDescription = String(form.elements?.short_description?.value || '').trim();
    const price = String(form.elements?.price?.value || '').trim();
    const qty = Number(form.elements?.inventory_quantity?.value || 0);
    const newImages = Number(imageInput?.files?.length || 0);
    const existingImages = Number(document.querySelectorAll('#mobileImagePreview .mobile-image-preview-card').length || 0);
    const totalImages = Math.max(newImages, existingImages);
    if (!name) return 'Basic wizard still needs a product name.';
    if (!shortDescription) return 'Basic wizard still needs a short description.';
    if (!price || Number(price) < 0) return 'Basic wizard still needs a valid price.';
    if (!Number.isInteger(qty) || qty < 0) return 'Basic wizard still needs a valid quantity.';
    if (totalImages < 1 || totalImages > 5) return 'Basic wizard requires between 1 and 5 pictures.';
    return '';
  }

  function editDraft(productId) {
    if (!draftSelect) return;
    draftSelect.value = String(productId || '');
    draftSelect.dispatchEvent(new Event('change', { bubbles: true }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function applyBulkUpdate(productIds, updates) {
    const body = { selection_scope: 'ids', product_ids: productIds, updates };
    const response = await window.DDAuth.apiFetch('/api/admin/bulk-update-products', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return parseApiResponse(response, 'Bulk product update failed.');
  }

  function selectedTodayIds() {
    return Array.from(document.querySelectorAll('[data-today-select]:checked')).map((input) => Number(input.value)).filter((id) => Number.isInteger(id) && id > 0);
  }

  function rowPayloadFromInputs(rowId) {
    const row = todayDrafts.find((entry) => Number(entry.product_id) === Number(rowId));
    if (!row) return null;
    const category = document.querySelector(`[data-row-category="${rowId}"]`)?.value ?? row.product_category ?? '';
    const priceText = document.querySelector(`[data-row-price="${rowId}"]`)?.value ?? '';
    const qtyText = document.querySelector(`[data-row-qty="${rowId}"]`)?.value ?? '';
    const status = document.querySelector(`[data-row-status="${rowId}"]`)?.value ?? row.status ?? 'draft';
    const updates = { status, inventory_quantity: Number(qtyText || 0), product_category: String(category || '').trim() };
    const priceCents = dollarsToCents(priceText);
    if (priceText !== '' && priceCents != null) {
      updates.price_action = 'set_price_cents';
      updates.price_value = priceCents;
      updates.compare_at_strategy = 'no_change';
    }
    return updates;
  }

  function renderTodayTable() {
    if (!todayBody) return;
    if (!todayDrafts.length) {
      todayBody.innerHTML = '<tr><td colspan="9" style="padding:12px">No draft products were saved today yet.</td></tr>';
      return;
    }
    todayBody.innerHTML = todayDrafts.map((row) => `
      <tr>
        <td><input type="checkbox" data-today-select value="${Number(row.product_id || 0)}"/></td>
        <td>
          <div><strong>${escapeHtml(`DD${String(Number(row.product_number || row.product_id || 0)).padStart(4, '0')}`)}</strong></div>
          <div class="small">${escapeHtml(row.name || row.capture_reference || 'Unnamed draft')}</div>
        </td>
        <td><input class="input" data-row-category="${Number(row.product_id || 0)}" type="text" value="${escapeHtml(row.product_category || '')}" placeholder="Category"/></td>
        <td><input class="input" data-row-price="${Number(row.product_id || 0)}" type="number" min="0" step="0.01" value="${escapeHtml((Number(row.price_cents || 0) / 100).toFixed(2))}"/></td>
        <td><input class="input" data-row-qty="${Number(row.product_id || 0)}" type="number" min="0" step="1" value="${Number(row.inventory_quantity || 0)}"/></td>
        <td>
          <select class="input" data-row-status="${Number(row.product_id || 0)}">
            <option value="draft" ${String(row.status || 'draft') === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="active" ${String(row.status || '') === 'active' ? 'selected' : ''}>Active</option>
            <option value="archived" ${String(row.status || '') === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </td>
        <td>${Number(row.image_count || 0)}<div class="small">${escapeHtml(row.capture_entry_mode || 'full')}</div></td>
        <td>${escapeHtml(formatDate(row.capture_last_saved_at || row.updated_at || row.created_at))}</td>
        <td>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn" data-edit-row="${Number(row.product_id || 0)}">Edit</button>
            <button type="button" class="btn" data-save-row="${Number(row.product_id || 0)}">Save row</button>
          </div>
        </td>
      </tr>
    `).join('');

    todayBody.querySelectorAll('[data-edit-row]').forEach((button) => button.addEventListener('click', () => editDraft(button.dataset.editRow)));
    todayBody.querySelectorAll('[data-save-row]').forEach((button) => button.addEventListener('click', async () => {
      const rowId = Number(button.dataset.saveRow || 0);
      const updates = rowPayloadFromInputs(rowId);
      if (!updates) return;
      const original = button.textContent;
      setTodayMessage('');
      button.disabled = true;
      button.textContent = 'Saving…';
      try {
        await applyBulkUpdate([rowId], updates);
        setTodayMessage('Draft row updated.');
        if (refreshDraftsButton) refreshDraftsButton.click();
        await loadTodayDrafts();
      } catch (error) {
        setTodayMessage(error.message || 'Could not update the draft row.', true);
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    }));
  }

  async function loadTodayDrafts() {
    if (!window.DDAuth.isLoggedIn()) return;
    try {
      setTodayMessage('');
      const response = await window.DDAuth.apiFetch('/api/admin/mobile-product-drafts?status=draft&scope=today&limit=100');
      const data = await parseApiResponse(response, 'Could not load today\'s draft products.');
      todayDrafts = Array.isArray(data.drafts) ? data.drafts : [];
      const summary = data.day_summary || {};
      if (todaySummary) {
        todaySummary.textContent = todayDrafts.length
          ? `${summary.draft_count || todayDrafts.length} draft entries today • ${summary.image_count || 0} pictures • ${summary.inventory_quantity_total || 0} total quantity • ${summary.wizard_count || 0} saved from the basic wizard.`
          : 'No draft products were saved today yet.';
      }
      renderTodayTable();
    } catch (error) {
      if (todaySummary) todaySummary.textContent = error.message || 'Could not load today\'s draft products.';
      if (todayBody) todayBody.innerHTML = '<tr><td colspan="9" style="padding:12px">Could not load today\'s draft products.</td></tr>';
    }
  }

  if (wizardButton) wizardButton.addEventListener('click', () => { wizardStep = 1; setMode('wizard'); });
  if (fullButton) fullButton.addEventListener('click', () => setMode('full'));
  if (prevButton) prevButton.addEventListener('click', () => { wizardStep = Math.max(1, wizardStep - 1); renderWizardStep(); });
  if (nextButton) nextButton.addEventListener('click', () => { wizardStep = Math.min(3, wizardStep + 1); renderWizardStep(); });
  if (todayRefreshButton) todayRefreshButton.addEventListener('click', loadTodayDrafts);
  if (selectAll) selectAll.addEventListener('change', () => {
    document.querySelectorAll('[data-today-select]').forEach((input) => { input.checked = !!selectAll.checked; });
  });

  if (bulkApplyButton) bulkApplyButton.addEventListener('click', async () => {
    const ids = selectedTodayIds();
    if (!ids.length) return setTodayMessage('Select at least one draft row first.', true);
    const updates = {};
    if (String(bulkStatus?.value || '').trim()) updates.status = String(bulkStatus.value).trim();
    if (String(bulkCategory?.value || '').trim() || bulkCategory?.value === '') updates.product_category = String(bulkCategory.value || '').trim();
    if (String(bulkQty?.value || '').trim()) updates.inventory_quantity = Number(bulkQty.value || 0);
    const priceCents = dollarsToCents(bulkPrice?.value || '');
    if (String(bulkPrice?.value || '').trim()) {
      if (priceCents == null) return setTodayMessage('Bulk price must be a valid amount.', true);
      updates.price_action = 'set_price_cents';
      updates.price_value = priceCents;
      updates.compare_at_strategy = 'no_change';
    }
    if (!Object.keys(updates).length) return setTodayMessage('Choose at least one bulk field to update.', true);
    bulkApplyButton.disabled = true;
    const original = bulkApplyButton.textContent;
    bulkApplyButton.textContent = 'Applying…';
    try {
      await applyBulkUpdate(ids, updates);
      setTodayMessage(`Updated ${ids.length} draft row${ids.length === 1 ? '' : 's'}.`);
      if (refreshDraftsButton) refreshDraftsButton.click();
      await loadTodayDrafts();
    } catch (error) {
      setTodayMessage(error.message || 'Bulk update failed.', true);
    } finally {
      bulkApplyButton.disabled = false;
      bulkApplyButton.textContent = original;
    }
  });

  if (imageInput) imageInput.addEventListener('change', () => {
    if (captureMode !== 'wizard') return;
    const count = Number(imageInput.files?.length || 0);
    if (count > 5) setTodayMessage('Basic wizard should use 1 to 5 pictures. Extra files will stay selected until you remove them manually.', true);
    else setTodayMessage('');
  });

  form.addEventListener('submit', (event) => {
    if (captureModeInput) captureModeInput.value = captureMode;
    if (captureMode !== 'wizard') return;
    const error = validateWizardBeforeSubmit();
    if (error) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setTodayMessage(error, true);
      return;
    }
    setTodayMessage('');
  }, true);

  document.addEventListener('dd:mobile-product-saved', loadTodayDrafts);
  document.addEventListener('dd:auth-changed', () => loadTodayDrafts());

  setMode(captureMode);
  loadTodayDrafts();
});


// Build 698 — opt-in camera-first standalone New Product draft. Uses the existing
// authenticated D1 product creation and R2 image/video endpoints. Never publishes.
document.addEventListener('DOMContentLoaded',()=>{
  const panel=document.getElementById('dd698-camera-start');
  if(!panel)return;
  const $=id=>document.getElementById(id);
  const name=$('dd698CameraName'),camera=$('dd698CameraPhoto'),
    library=$('dd698PhotoLibrary'),video=$('dd698CameraVideo'),
    preview=$('dd698CameraPreview'),status=$('dd698CameraStatus'),
    save=$('dd698CameraSave'),clear=$('dd698CameraClear'),
    link=$('dd698CameraSavedLink');
  const photos=[];
  let saving=false;
  const key=f=>[f.name,f.size,f.lastModified].join('|');
  const validPhoto=f=>f&&/^image\/(jpeg|png|webp|gif|avif|heic|heif)$/i.test(f.type||'')&&
    Number(f.size)>0&&Number(f.size)<=10*1024*1024;
  const videoKind=f=>{
    const ext=String(f?.name||'').split('.').pop().toLowerCase();
    const map={mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm'};
    return map[ext]&&(!f.type||f.type===map[ext])?map[ext]:null;
  };
  const sizeLabel=f=>(f.size/1048576).toFixed(1)+' MB';
  const setMessage=(s,bad=false)=>{status.textContent=s;status.style.color=bad?'#b00020':'';};
  function render(){
    const vids=Array.from(video.files||[]),items=photos.map(f=>f.name+' ('+sizeLabel(f)+')');
    if(vids[0])items.push('Video: '+vids[0].name+' ('+sizeLabel(vids[0])+')');
    preview.replaceChildren();
    const p=document.createElement('p');p.className='small';
    p.textContent=items.length?items.length+' selected media: '+items.join(' · '):
      'Choose a photo or video to start. No photos or video are saved until Save is pressed.';
    preview.appendChild(p);
    save.disabled=saving;
  }
  function addPhotos(files){
    for(const file of Array.from(files||[])){
      if(!validPhoto(file)){setMessage('Use supported photos of 10 MB or less (JPEG, PNG, WebP, GIF, AVIF or HEIC).',true);continue;}
      if(photos.some(x=>key(x)===key(file)))continue;
      if(photos.length>=7){setMessage('This quick draft accepts seven images. Save another batch separately.',true);break;}
      photos.push(file);
    }
    render();
  }
  camera.addEventListener('change',()=>{addPhotos(camera.files);camera.value='';});
  library.addEventListener('change',()=>{addPhotos(library.files);library.value='';});
  video.addEventListener('change',()=>{
    const f=video.files?.[0];
    if(f&&(!videoKind(f)||!f.size||f.size>25*1024*1024)){
      video.value='';setMessage('Video must be MP4, MOV or WebM and 25 MB or smaller.',true);
    }
    render();
  });
  clear.addEventListener('click',()=>{
    if(saving)return;
    photos.length=0;camera.value='';library.value='';video.value='';render();
    setMessage('Unsaved media selection cleared. Existing saved drafts were not changed.');
  });
  async function parseResponse(response,error){
    let data=null;try{data=await response.json();}catch{}
    if(!response.ok||!data?.ok)throw new Error(data?.error||error||'Save failed.');
    return data;
  }
  save.addEventListener('click',async()=>{
    if(saving)return;
    const movie=video.files?.[0]||null,display=name.value.trim();
    if(!photos.length&&!movie&&!display){
      setMessage('Take a photo, record a video, or enter a quick name first.',true);return;
    }
    if(!window.DDAuth?.isLoggedIn?.()||!window.DDAuth.apiFetch){
      setMessage('Sign in as an Admin before saving a camera-first product.',true);return;
    }
    if(movie&&(!videoKind(movie)||movie.size>25*1024*1024)){
      setMessage('Video must be MP4, MOV or WebM and 25 MB or smaller.',true);return;
    }
    saving=true;save.disabled=true;link.replaceChildren();
    const f=new FormData();f.set('capture_entry_mode','camera');f.set('inventory_quantity','1');
    f.set('price_cents','0');f.set('name',display);
    f.set('capture_reference','Camera-first capture '+new Date().toISOString());
    for(const image of photos)f.append('images',image,image.name);
    let created=null;
    try{
      setMessage('Saving the draft and selected photos to existing Cloudflare storage…');
      const response=await window.DDAuth.apiFetch('/api/admin/mobile-create-product',{method:'POST',body:f});
      const data=await parseResponse(response,'Could not save camera-first draft.');
      const product=data.product||{},productId=Number(product.product_id||0);
      if(!Number.isSafeInteger(productId)||productId<1)
        throw Error('Product write outcome unknown. Check drafts before retrying; do not create a duplicate.');
      created=productId;
      const label=data.product_number_label||('DD'+String(product.product_number||productId));
      const savedName=String(product.name||display||('Temporary '+label));
      const uploaded=Array.isArray(data.uploaded_images)?data.uploaded_images:[];
      const successes=uploaded.filter(x=>x.ok===true).length;
      photos.length=0;camera.value='';library.value='';render();
      const a=document.createElement('a');
      a.className='btn secondary';a.href='/admin/product-editor/?product_id='+encodeURIComponent(productId);
      a.textContent='Edit '+label+' in full Product Editor';
      const b=document.createElement('a');
      b.className='btn secondary';b.href='/admin/mobile-product/';
      b.textContent='Open saved draft list';
      link.replaceChildren(a,document.createTextNode(' '),b);
      const notes=[label+' saved as '+savedName+' (draft / not published).'];
      if(uploaded.length!==successes||successes!==Number(data.uploaded_images?.length||0)||
        successes===0&&Number(f.getAll('images').length)>0){
        notes.push('Some photos may not have reached R2. Check attachments before uploading again.');
      }else if(successes) notes.push(successes+' photo(s) uploaded.');
      if(movie){
        setMessage(notes.join(' ')+' Attaching video for internal review…');
        const movieForm=new FormData();
        movieForm.set('product_id',String(productId));
        movieForm.set('file',movie,movie.name);
        movieForm.set('video_title','Unreviewed camera-first product video');
        try{
          const movieResponse=await window.DDAuth.apiFetch('/api/admin/product-video-attachments',{method:'POST',body:movieForm});
          const result=await parseResponse(movieResponse,'Video attachment not confirmed.');
          if(!Number.isSafeInteger(Number(result.product_video_id))||Number(result.product_video_id)<1)
            throw Error('Video attachment receipt missing.');
          notes.push('Video attached for internal review only.');
          video.value='';
        }catch(error){
          notes.push('Video outcome unconfirmed: '+error.message+
            ' Check Product video attachments before retrying to avoid duplicates.');
        }
      }
      setMessage(notes.join(' '),notes.some(x=>/unconfirmed|Some photos|could not/i.test(x)));
      name.value='';render();
      $('mobileRefreshDraftsButton')?.click();
      $('mobileTodayRefreshButton')?.click();
    }catch(error){
      setMessage((created?'Draft #'+created+' saved but later step failed: ':'')+
        (error?.message||'Unable to save. Check existing drafts before retrying.'),true);
    }finally{saving=false;render();}
  });
  render();
});
