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


// Build 698 continuity: uploaded videos stay in internal review only, not auto-publication.
// Build 699 — interrupted mobile camera draft save and R2 media recovery.
// The server assigns DD numbers; localStorage contains only a random capture
// reference and original Product ID, never media, credentials or source bytes.
// Retry is explicit and same-source; no automatic network loops or publishing.
document.addEventListener('DOMContentLoaded',()=>{
  const panel=document.getElementById('dd698-camera-start');
  if(!panel)return;
  const $=id=>document.getElementById(id);
  const name=$('dd698CameraName'),camera=$('dd698CameraPhoto'),
    library=$('dd698PhotoLibrary'),video=$('dd698CameraVideo'),
    preview=$('dd698CameraPreview'),status=$('dd698CameraStatus'),
    save=$('dd698CameraSave'),clear=$('dd698CameraClear'),
    link=$('dd698CameraSavedLink'),resume=$('dd699Resume'),
    fresh=$('dd699New'),progress=$('dd699Progress');
  const STORE='dd_camera699_active_draft',photos=[];
  const validToken=x=>/^camera699-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(x||''));
  let active=null,saving=false;
  try{
    const stored=JSON.parse(localStorage.getItem(STORE)||'null');
    if(stored&&validToken(stored.token)&&Number.isSafeInteger(stored.product_id)&&stored.product_id>=0)
      active={token:stored.token,product_id:stored.product_id,label:String(stored.label||''),
        product_name:String(stored.product_name||'')};
  }catch{}
  const uniqueKey=file=>[file.name,file.size,file.lastModified].join('|');
  const isPhoto=file=>file&&/^image\/(jpeg|png|webp|gif|avif|heic|heif)$/i.test(file.type||'')&&
    Number(file.size)>0&&Number(file.size)<=10*1024*1024;
  const videoKind=file=>{
    const ext=String(file?.name||'').split('.').pop().toLowerCase();
    const kinds={mp4:'video/mp4',mov:'video/quicktime',webm:'video/webm'};
    return kinds[ext]&&(!file.type||file.type===kinds[ext])?kinds[ext]:null;
  };
  const labelBytes=file=>(file.size/1048576).toFixed(1)+' MB';
  const setMessage=(message,warning=false)=>{
    status.textContent=message;status.style.color=warning?'#b00020':'';
  };
  function persist(){
    try{
      if(active)localStorage.setItem(STORE,JSON.stringify(active));
      else localStorage.removeItem(STORE);
    }catch{}
  }
  function showLinks(product){
    if(!product)return;
    const pid=Number(product.product_id||0);
    if(!Number.isSafeInteger(pid)||pid<1)return;
    const productLabel=String(product.label||('DD'+pid));
    const edit=document.createElement('a');
    edit.className='btn secondary';
    edit.href='/admin/product-editor/?product_id='+encodeURIComponent(pid);
    edit.textContent='Edit '+productLabel+' in Product Editor';
    const drafts=document.createElement('a');
    drafts.className='btn secondary';drafts.href='/admin/mobile-product/';
    drafts.textContent='All saved drafts';
    link.replaceChildren(edit,document.createTextNode(' '),drafts);
  }
  function render(){
    const movie=video.files?.[0]||null;
    const selected=[...photos.map(f=>'Photo '+f.name+' ('+labelBytes(f)+')')];
    if(movie)selected.push('Video '+movie.name+' ('+labelBytes(movie)+')');
    preview.replaceChildren();
    const message=document.createElement('p');
    message.className='small';message.textContent=selected.length?
      selected.join(' · '):'No media selected. Re-select files after a browser reload; files are not kept in localStorage.';
    preview.appendChild(message);
    save.disabled=saving;
    clear.disabled=saving;
    if(fresh)fresh.disabled=saving;
    if(resume){
      resume.hidden=!active;
      resume.textContent=active?
        'Original camera draft '+(active.label||'#'+(active.product_id||'?'))+
        ' · '+(active.product_id?'continue uploads':'recover save receipt'):
        '';
    }
    if(progress)progress.textContent=active?
      'Stable capture reference saved locally. '+(active.product_id?
      'Product #'+active.product_id+' already created; retries attach to it.':
      'Save result unconfirmed; retry checks for existing draft before creating a new one.')+
      ' Pending selected photos: '+photos.length+(movie?' · 1 video':''):
      'New Product: save will allocate one DD number, then attach media.';
  }
  function addPhotos(files){
    for(const f of Array.from(files||[])){
      if(!isPhoto(f)){setMessage('Choose photos of 10 MB or less (JPG/PNG/WebP/GIF/AVIF/HEIC).',true);continue;}
      if(photos.some(x=>uniqueKey(x)===uniqueKey(f)))continue;
      if(photos.length>=7){setMessage('Maximum seven images per capture batch.',true);break;}
      photos.push(f);
    }
    render();
  }
  camera.addEventListener('change',()=>{addPhotos(camera.files);camera.value='';});
  library.addEventListener('change',()=>{addPhotos(library.files);library.value='';});
  video.addEventListener('change',()=>{
    const f=video.files?.[0];
    if(f&&(!videoKind(f)||!f.size||f.size>25*1024*1024)){
      video.value='';setMessage('Video must be MP4, MOV or WebM, maximum 25 MB.',true);
    }
    render();
  });
  clear.addEventListener('click',()=>{
    if(saving)return;
    photos.length=0;video.value='';camera.value='';library.value='';
    render();setMessage('Unsaved media selection cleared. Existing draft preserved.');
  });
  fresh?.addEventListener('click',()=>{
    resetProof700();
    if(saving)return;
    photos.length=0;video.value='';camera.value='';library.value='';
    active=null;persist();link.replaceChildren();name.value='';
    setMessage('New capture selected. Previous drafts remain saved and can be found in Drafts.');
    render();
  });
  resume?.addEventListener('click',()=>{
    if(saving||!active)return;
    setMessage('Original draft '+(active.label||active.product_id||'capture')+
      ' selected. Re-select any missing media and use Save/Retry. Nothing is published.');
    showLinks(active);
  });
  async function responseJson(response,message){
    let data=null;
    try{data=await response.json();}catch{}
    if(!response.ok||data?.ok!==true)throw Error(data?.error||message||'Original media receipt unavailable.');
    return data;
  }
  function ensureCapture(){
    if(!active){
      if(!crypto?.randomUUID)throw Error('Secure camera capture token unavailable; requires HTTPS.');
      active={token:'camera699-'+crypto.randomUUID(),product_id:0,label:'',product_name:name.value.trim()};
      persist();
    }
    if(!validToken(active.token))throw Error('Invalid local capture identity. No write attempted.');
    return active;
  }
  async function createOrRecover(){
    ensureCapture();
    if(active.product_id)return active;
    const f=new FormData();
    f.set('capture_entry_mode','camera');f.set('inventory_quantity','1');
    f.set('price_cents','0');f.set('name',active.product_name||'');
    f.set('capture_reference',active.token);
    const data=await responseJson(await window.DDAuth.apiFetch('/api/admin/mobile-create-product',
      {method:'POST',body:f}),'Unconfirmed original draft save. Retry the SAME capture reference.');
    const id=Number(data.product?.product_id||0);
    if(!Number.isSafeInteger(id)||id<1)
      throw Error('No confirmed original Product ID. Retry SAME capture reference; do not create another.');
    active.product_id=id;active.label=String(data.product_number_label||('DD'+data.product?.product_number||id));
    active.product_name=String(data.product?.name||active.product_name||('Temporary '+active.label));
    persist();showLinks(active);render();
    return active;
  }
  async function uploadPhotos(){
    let done=0,missing=0;
    // One file per request: each original photo has a deterministic SHA-256
    // R2 path and a guarded D1 catalog attachment. Unknown outcomes are safe
    // to retry with the SAME draft and original bytes.
    for(let i=0;i<photos.length;){
      const file=photos[i],f=new FormData();
      f.set('action','camera699_upload_only');
      f.set('product_id',String(active.product_id));
      f.set('capture_reference',active.token);
      f.append('images',file,file.name);
      try{
        const data=await responseJson(await window.DDAuth.apiFetch('/api/admin/mobile-create-product',
          {method:'POST',body:f}),'Original photo upload result unconfirmed.');
        const receipt=data.uploaded_images?.[0];
        if(!data.same_original_draft||!receipt?.ok||!Number(receipt.product_image_id))
          throw Error(receipt?.error||'Original R2 / Product image attachment not confirmed.');
        done++;photos.splice(i,1);
        setMessage('Camera draft '+active.label+': '+done+' photo(s) confirmed; '+photos.length+' awaiting upload.');
      }catch(error){
        missing++;i++;
        setMessage('Draft '+active.label+' preserved. Photo '+file.name+
          ' unconfirmed: '+error.message+' Reuse Save/Retry with same file and draft.',true);
      }
    }
    return{done,missing};
  }
  async function uploadVideo(){
    const movie=video.files?.[0];
    if(!movie)return{done:0,missing:0};
    const kind=videoKind(movie);
    if(!kind||!movie.size||movie.size>25*1024*1024)
      throw Error('Video invalid. MP4, WebM or MOV under 25 MB required.');
    const f=new FormData();
    f.set('product_id',String(active.product_id));
    f.set('capture_reference',active.token);
    f.set('file',movie,movie.name);
    f.set('video_title','Original camera video — internal review required');
    try{
      const data=await responseJson(await window.DDAuth.apiFetch('/api/admin/product-video-attachments',
        {method:'POST',body:f}),'Video registration unconfirmed.');
      if(!Number.isSafeInteger(Number(data.product_video_id))||Number(data.product_video_id)<1||
        data.publication_status!=='internal_review')
        throw Error('Video original review receipt missing or not marked private review.');
      video.value='';
      return{done:1,missing:0};
    }catch(error){
      setMessage('Draft '+active.label+' preserved. Video outcome uncertain: '+error.message+
        ' Check Product video attachments before retrying. Same original video and draft can be retried manually; do not create another Product.',true);
      return{done:0,missing:1};
    }
  }
  // Build 700 — a field proof requires a real original phone session plus
  // an authenticated read-only D1/R2 HEAD readback of the SAME saved draft.
  // Neither a checkbox nor a simulated test asserts that a device was tested.
  let field700=null;
  const proofStatus=$('dd700ReadbackStatus'),proofDetails=$('dd700ReadbackDetails'),
    proofButton=$('dd700Readback'),proofExport=$('dd700Export'),
    proofExportStatus=$('dd700ExportStatus'),deviceNotes=$('dd700DeviceNotes');
  function resetProof700(){
    field700=null;
    if(typeof reset702==='function')reset702();
    if(document.getElementById('dd701AdoptStatus'))document.getElementById('dd701AdoptStatus').textContent='HOLD · Re-read exact original media before adopting a phone receipt.';
    if(proofDetails)proofDetails.replaceChildren();
    if(proofStatus)proofStatus.textContent='HOLD · Original field proof not yet read back.';
    if(proofExportStatus)proofExportStatus.textContent=
      'No owner device acceptance is inferred from selecting files or a successful deployment.';
  }
  function drawProof700(data){
    proofDetails.replaceChildren();
    for(const m of data.media||[]){
      const p=document.createElement('p');
      p.className='small';p.textContent=m.kind+' attachment #'+m.attachment_id+
        ' · '+(m.confirmed?'R2 HEAD CONFIRMED':'HOLD NOT CONFIRMED')+
        ' · '+m.r2_bytes+' R2 bytes · '+m.publication_status;
      proofDetails.appendChild(p);
    }
    const bounded=data.bounded_rows===true,
      complete=data.status==='MEDIA_R2_D1_READBACK_CONFIRMED'&&
        bounded&&data.photo_count>0&&data.confirmed_count>0&&data.unverified_count===0;
    proofStatus.textContent=(complete?'Original D1/R2 attachments confirmed;':'HOLD · Some media or receipt evidence is incomplete;')+
      ' Photo(s): '+data.photo_count+', private video(s): '+data.video_count+
      ', confirmed: '+data.confirmed_count+', unverified: '+data.unverified_count+
      '. This is NOT proof the physical phone trial occurred.';
  }
  proofButton?.addEventListener('click',async()=>{
    if(saving)return;
    proofButton.disabled=true;resetProof700();
    try{
      if(!window.DDAuth?.isLoggedIn?.()||!window.DDAuth.apiFetch)
        throw Error('Admin sign-in required for original camera field proof.');
      if(!active?.product_id||!validToken(active.token))
        throw Error('Select or save an original owner camera draft before readback.');
      const f=new FormData();
      f.set('action','camera700_readback');
      f.set('product_id',String(active.product_id));
      f.set('capture_reference',active.token);
      const result=await responseJson(await window.DDAuth.apiFetch('/api/admin/mobile-create-product',
        {method:'POST',body:f}),'Original Cloudflare D1/R2 media readback unavailable.');
      if(!result.capture_reference_verified||!result.original_owner_verified||
        !result.r2_head_checked||result.product_id!==active.product_id)
        throw Error('Original draft source and R2 HEAD receipt did not match.');
      field700=result;
      drawProof700(result);
    }catch(err){
      proofStatus.textContent='HOLD · '+err.message;
      field700=null;
    }finally{proofButton.disabled=false;}
  });
  proofExport?.addEventListener('click',()=>{
    try{
      if(!field700?.original_owner_verified||!active?.product_id||
        Number(field700.product_id)!==Number(active.product_id))
        throw Error('Read the exact original same-owner D1/R2 evidence first.');
      const checks={};
      for(const checkbox of document.querySelectorAll('[data-dd700-check]')){
        const k=checkbox.getAttribute('data-dd700-check');
        checks[k]=checkbox.checked===true;
      }
      const notes=(deviceNotes?.value||'').trim();
      const actualPhoto=field700.photo_count>0,
        mediaConfirmed=field700.status==='MEDIA_R2_D1_READBACK_CONFIRMED'&&
          field700.unverified_count===0&&field700.bounded_rows===true&&actualPhoto,
        ownerReported=Object.values(checks).length===5&&
          Object.values(checks).every(Boolean)&&notes.length>=25;
      const report={schema:'devilndove_original_phone_field_proof_700',
        exported_at:new Date().toISOString(),
        product_id:active.product_id,product_number_label:active.label,
        evidence_source:'Authenticated same-owner original D1 attachment and R2 HEAD readback',
        cloudflare_media_readback:field700,
        physical_phone_owner_checklist:checks,owner_notes:notes,
        outcome:mediaConfirmed&&ownerReported?
          'OWNER_REPORTED_FIELD_TRIAL_WITH_R2_RECEIPTS':
          'HOLD_INCOMPLETE_PHYSICAL_DEVICE_OR_R2_EVIDENCE',
        authenticated_physical_device_testing_by_assistant:false,
        independent_owner_review_required:true,
        production_deployment_proof_separate:true};
      const blob=new Blob([JSON.stringify(report,null,2)],
        {type:'application/json'}),url=URL.createObjectURL(blob),
        download=document.createElement('a');
      download.href=url;download.download='devilndove-camera-field-700-'+active.product_id+'.json';
      document.body.appendChild(download);download.click();download.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      proofExportStatus.textContent=report.outcome+
        ' · LOCAL evidence exported. No automatic server acceptance, certification or publication.';
    }catch(err){proofExportStatus.textContent='HOLD · '+err.message;}
  });


  // Build 701: an owner-only adoption, server-side fresh media proof, no publication.
  const adopt701=$('dd701Adopt'),status701=$('dd701AdoptStatus');
  adopt701?.addEventListener('click',async()=>{
    if(saving)return;
    adopt701.disabled=true;
    try{
      if(!field700||!active?.product_id||Number(field700.product_id)!==Number(active.product_id))
        throw Error('Read back the original same-owner D1/R2 attachments first.');
      const checks={};
      for(const el of document.querySelectorAll('[data-dd700-check]'))
        checks[el.getAttribute('data-dd700-check')]=el.checked===true;
      const notes=(deviceNotes?.value||'').trim();
      if(!Object.values(checks).every(Boolean)||Object.keys(checks).length!==5||
        notes.length<25||notes.length>600)
        throw Error('Finish all five physical-phone checklist items and meaningful notes.');
      const form=new FormData();
      form.set('action','camera701_adopt_receipt');
      form.set('product_id',String(active.product_id));
      form.set('capture_reference',active.token);
      form.set('owner_checklist_json',JSON.stringify(checks));
      form.set('owner_device_notes',notes);
      form.set('media_snapshot_json',JSON.stringify(field700.media));
      const result=await responseJson(await window.DDAuth.apiFetch('/api/admin/mobile-create-product',
        {method:'POST',body:form}),'Original phone receipt adoption failed.');
      status701.textContent='Owner-reported phone receipt #'+result.receipt_id+
        ' adopted for original DD draft. Linked D1/R2 media recovery reviewed. Independent physical device and unrecorded uploads remain unverified; no publication.';
    }catch(error){status701.textContent='HOLD · '+error.message;}
    finally{adopt701.disabled=false;}
  });

  // Build 702: no unattended retries, no independent phone witness claims.
  let gate702=null;
  const status702=$('dd702Status'),result702=$('dd702Result'),media702=$('dd702Media'),
        issue702=$('dd702Issue'),case702=$('dd702OpenCases');
  function reset702(){
    gate702=null;
    if(status702)status702.textContent='HOLD · Inspect the original Build 701 receipt and D1/R2 links again.';
    if(result702)result702.textContent='No independent device verification or automatic closure recorded.';
    if(media702)media702.replaceChildren();
    if(issue702)issue702.replaceChildren(new Option('Reinspect current original media first',''));
    if(case702)case702.replaceChildren(new Option('Reinspect open original exceptions first',''));
    if($('dd703AgeStatus'))$('dd703AgeStatus').textContent='HOLD · Reinspect the original saved draft before aging review.';
    if($('dd703AgeCase'))$('dd703AgeCase').replaceChildren(new Option('Read original cases first',''));
    if($('dd704FollowupStatus'))$('dd704FollowupStatus').textContent='HOLD · Read original escalated cases first.';
    if($('dd704FollowupSource'))$('dd704FollowupSource').replaceChildren(new Option('Refresh original saved draft',''));
    if($('dd705RecoveryStatus'))$('dd705RecoveryStatus').textContent='HOLD · Reinspect the original owner-linked recovery.';
    if($('dd705RecoverySource'))$('dd705RecoverySource').replaceChildren(new Option('Refresh original recovery first',''));
    if($('dd706SignoffStatus'))$('dd706SignoffStatus').textContent='HOLD · Original owner recovery and explicit closure not inspected.';
    if($('dd706SignoffSource'))$('dd706SignoffSource').replaceChildren(new Option('Refresh original linked closure',''));
    if($('dd706SignoffReviewed'))$('dd706SignoffReviewed').checked=false;
  }
  async function send702(action,fields={}){
    if(!window.DDAuth?.isLoggedIn?.()||!window.DDAuth.apiFetch)
      throw Error('Admin login required for original device evidence.');
    if(!active?.product_id||!validToken(active.token))
      throw Error('Save or resume the same original owner camera draft first.');
    const form=new FormData();
    form.set('action',action);form.set('product_id',String(active.product_id));
    form.set('capture_reference',active.token);
    for(const [k,v] of Object.entries(fields))form.set(k,String(v));
    return responseJson(await window.DDAuth.apiFetch('/api/admin/mobile-create-product',
      {method:'POST',body:form}),'Protected original device evidence unavailable.');
  }
  function draw707(v){
    const status=$('dd707MediaAuditStatus'),list=$('dd707MediaAuditCases');
    if(!status||!list)return;
    const checked=(v.exception_aging_703||[]).filter(x=>x.owner_recovery_signoff_receipt_id>0);
    status.textContent='Signed linked cases '+(v.owner_recovery_signed_count_706||0)+
     ' · stable on this authenticated D1/R2 HEAD recheck '+(v.stable_signed_media_count_707||0)+
     ' · HOLD for current source recheck '+(v.signed_media_recheck_hold_count_707||0)+
     '. Unrecorded uploads and physical-phone witness remain separate HOLD.';
    list.replaceChildren();
    for(const item of checked){
      const li=document.createElement('li');
      li.textContent='Original case #'+item.receipt_id+
        ' / sign-off #'+item.owner_recovery_signoff_receipt_id+
        ' · '+item.media_signoff_drift_707;
      list.appendChild(li);
    }
    if(!checked.length){
      const li=document.createElement('li');
      li.textContent='No original linked Build 706 owner sign-offs to recheck. HOLD.';
      list.appendChild(li);
    }
  }
  function draw706(v){
    const select=$('dd706SignoffSource'),status=$('dd706SignoffStatus');
    if(!select||!status)return;
    select.replaceChildren(new Option('Choose verified original linked case closure',''));
    for(const age of v.exception_aging_703||[]){
      const info=(v.exceptions||[]).find(x=>x.receipt_id===age.receipt_id);
      if(info&&info.closed&&info.kind==='linked'&&
         age.recovery_receipt_id&&age.closure_receipt_id&&
         age.owner_recovery_signoff_ready&&!age.owner_recovery_signoff_receipt_id)
        select.add(new Option('Original '+info.media_kind+' attachment #'+info.attachment_id+
         ' · recovery #'+age.recovery_receipt_id+
         ' · explicit closure #'+age.closure_receipt_id,
         age.receipt_id+'|'+age.recovery_receipt_id+'|'+age.closure_receipt_id));
    }
    status.textContent='Original linked R2 owner sign-offs eligible: '+
      (v.owner_recovery_signoff_ready_706||0)+
      ' · signed linked-media cases '+(v.owner_recovery_signed_count_706||0)+
      '. Unrecorded uploads remain on HOLD; no automatic publication.';
  }
  function draw705(v){
    const select=$('dd705RecoverySource'),status=$('dd705RecoveryStatus');
    if(!select||!status)return;
    select.replaceChildren(new Option('Choose original confirmed linked recovery',''));
    for(const age of v.exception_aging_703||[]){
      const caseInfo=(v.exceptions||[]).find(x=>x.receipt_id===age.receipt_id);
      if(caseInfo&&!caseInfo.closed&&caseInfo.kind==='linked'&&
         age.linked_recovery_reconciliation_ready&&!age.recovery_receipt_id)
        select.add(new Option('Original '+caseInfo.media_kind+' #'+caseInfo.attachment_id+
          ' · case #'+caseInfo.receipt_id+' · follow-up #'+age.followup_receipt_id,
          age.receipt_id+'|'+age.followup_receipt_id));
    }
    status.textContent='Fresh owner re-attested D1/R2 linked recoveries ready: '+
      (v.linked_recovery_ready_705||0)+' · source-matched reconciliation receipts '+
      (v.reconciled_linked_count_705||0)+
      '. Unrecorded uploads are not independently recovered.';
  }
  function draw704(v){
    const select=$('dd704FollowupSource'),status=$('dd704FollowupStatus');
    if(!select||!status)return;
    select.replaceChildren(new Option('Select one escalated unresolved original case',''));
    for(const age of v.exception_aging_703||[]){
      const c=(v.exceptions||[]).find(x=>x.receipt_id===age.receipt_id);
      if(c&&!c.closed&&age.escalated&&age.followup_due&&!age.followup_receipt_id)
        select.add(new Option('Original '+c.kind+' '+c.media_kind+
          ' #'+c.receipt_id+' · escalated receipt #'+age.escalation_receipt_id+
          ' · '+age.age_hours+'h',
          age.receipt_id+'|'+age.escalation_receipt_id));
    }
    status.textContent='Original escalated cases due for owner follow-up: '+
      (v.owner_followup_due_704||0)+'. Escalation follow-up never clears original R2 or unrecorded media.';
  }
  function draw703(v){
    const status=$('dd703AgeStatus'),select=$('dd703AgeCase');
    if(!status||!select)return;
    select.replaceChildren(new Option('Choose an aged original open case',''));
    const aged=v.exception_aging_703||[];
    for(const item of aged){
      const caseInfo=(v.exceptions||[]).find(x=>x.receipt_id===item.receipt_id);
      if(item.escalation_due&&!item.escalated&&caseInfo&&!caseInfo.closed){
        select.add(new Option('Case #'+item.receipt_id+' · '+caseInfo.kind+' '+
          caseInfo.media_kind+' · '+item.age_hours+'h · '+item.status,
          String(item.receipt_id)));
      }
    }
    status.textContent='Original exceptions '+aged.length+
      ' · unresolved '+v.unresolved_count+
      ' · manual escalation due '+v.escalation_due_count+
      ' · critical 48h '+v.critical_aging_count+
      '. Invalid timestamps and unrecorded uploads remain HOLD.';
  }
  function show702(v){
    gate702=v;media702.replaceChildren();
    status702.textContent=v.status+' · original 701 receipt #'+(v.original_701_receipt_id||'missing')+
      ' · owner re-attestation #'+(v.reattest_receipt_id||'none')+
      ' · unresolved '+v.unresolved_count+
      ' · independently authenticated physical device: NO.';
    issue702.replaceChildren(new Option('Choose unresolved original media exception',''));
    issue702.add(new Option('Phone photo upload not recorded — HOLD','unrecorded|photo|0'));
    issue702.add(new Option('Phone video upload not recorded — HOLD','unrecorded|video|0'));
    for(const m of v.media?.media||[]){
      const p=document.createElement('p');
      p.textContent=m.kind+' attachment #'+m.attachment_id+
        ' · '+(m.confirmed?'R2 HEAD VERIFIED':'MISSING/HOLD')+
        ' · '+m.r2_bytes+' bytes · '+m.publication_status;
      media702.appendChild(p);
      if(!m.confirmed)
        issue702.add(new Option((m.r2_key?'Missing linked ':'Invalid linked key ') +m.kind+' #'+m.attachment_id,
          'linked|'+m.kind+'|'+m.attachment_id));
    }
    case702.replaceChildren(new Option('Choose a previously opened linked exception',''));
    for(const x of v.exceptions||[]){
      const p=document.createElement('p');
      p.textContent='Exception #'+x.receipt_id+' · '+x.kind+' '+x.media_kind+
        ' · '+(x.closed?'CLOSED LINKED ATTACHMENT ONLY':'OPEN / HOLD');
      media702.appendChild(p);
      if(!x.closed&&x.kind==='linked')
        case702.add(new Option('Linked '+x.media_kind+' #'+x.attachment_id+
          ' / case #'+x.receipt_id,String(x.receipt_id)));
    }
    draw703(v);
    draw704(v);
    draw705(v);
    draw706(v);
    draw707(v);
  }
  async function inspect702(){
    const data=await send702('camera702_inspect');
    if(!data.ok||Number(data.product_id)!==Number(active?.product_id))
      throw Error('Original draft changed during protected readback. HOLD.');
    show702(data);return data;
  }
  $('dd707MediaAuditRefresh')?.addEventListener('click',async()=>{
     try{
       const data=await send702('camera707_inspect');
       if(!data.ok||Number(data.product_id)!==Number(active?.product_id))
         throw Error('Original camera capture changed during signed-media recheck. HOLD.');
       show702(data);
     }catch(error){$('dd707MediaAuditStatus').textContent='HOLD · '+error.message;}
   });
   $('dd706SignoffRefresh')?.addEventListener('click',async()=>{
    try{await inspect702();}
    catch(error){$('dd706SignoffStatus').textContent='HOLD · '+error.message;}
  });
  $('dd706SignoffRecord')?.addEventListener('click',async()=>{
    const button=$('dd706SignoffRecord');button.disabled=true;
    try{
      const [openText,recoveryText,closeText]=
        String($('dd706SignoffSource').value||'').split('|');
      const caseId=Number(openText),recoveryId=Number(recoveryText),
        closureId=Number(closeText);
      const entry=gate702?.exception_aging_703?.find(x=>x.receipt_id===caseId&&
        x.recovery_receipt_id===recoveryId&&x.closure_receipt_id===closureId&&
        x.owner_recovery_signoff_ready&&!x.owner_recovery_signoff_receipt_id);
      if(!entry||!$('dd706SignoffReviewed').checked)
        throw Error('Select original verified linked D1/R2 recovery, explicit closure, and acknowledge owner review.');
      const result=await action702('camera706_owner_signoff',{
        open_receipt_id:caseId,recovery_receipt_id:recoveryId,
        closure_receipt_id:closureId,owner_reviewed:'true'});
      $('dd706SignoffResult').textContent=result.status+
        ' · original case #'+caseId+' signed. Physical device witness, unrecorded uploads, and publication remain HOLD.';
      $('dd706SignoffReviewed').checked=false;
    }catch(error){$('dd706SignoffResult').textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  });
  $('dd705RecoveryRefresh')?.addEventListener('click',async()=>{
    try{await inspect702();}
    catch(error){$('dd705RecoveryStatus').textContent='HOLD · '+error.message;}
  });
  $('dd705RecoveryRecord')?.addEventListener('click',async()=>{
    const button=$('dd705RecoveryRecord');button.disabled=true;
    try{
      const [openText,followupText]=String($('dd705RecoverySource').value||'').split('|');
      const openId=Number(openText),followupId=Number(followupText);
      const source=gate702?.exception_aging_703?.find(x=>
        x.receipt_id===openId&&x.followup_receipt_id===followupId&&
        x.linked_recovery_reconciliation_ready&&!x.recovery_receipt_id);
      if(!source||!Number.isSafeInteger(openId)||openId<1||
        !Number.isSafeInteger(followupId)||followupId<1)
        throw Error('Choose one original linked-media recovery with a fresh re-attestation.');
      const result=await action702('camera705_reconcile_linked',{
        open_receipt_id:openId,followup_receipt_id:followupId});
      $('dd705RecoveryResult').textContent=result.status+
        ' · original case #'+openId+
        ' remains open until protected Build 702 case closure. Unrecorded uploads HOLD.';
    }catch(error){$('dd705RecoveryResult').textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  });
  $('dd704FollowupRefresh')?.addEventListener('click',async()=>{
    try{await inspect702();}
    catch(error){$('dd704FollowupStatus').textContent='HOLD · '+error.message;}
  });
  $('dd704FollowupRecord')?.addEventListener('click',async()=>{
    const button=$('dd704FollowupRecord');button.disabled=true;
    try{
      const [caseString,escalationString]=String($('dd704FollowupSource').value||'').split('|');
      const openId=Number(caseString),escalationId=Number(escalationString);
      if(!Number.isSafeInteger(openId)||openId<1||
        !Number.isSafeInteger(escalationId)||escalationId<1)
        throw Error('Choose an original escalated case awaiting a first owner follow-up.');
      const source=gate702?.exception_aging_703?.find(x=>x.receipt_id===openId&&
        x.escalation_receipt_id===escalationId&&x.followup_due&&!x.followup_receipt_id);
      if(!source)throw Error('Case no longer eligible; refresh the original source.');
      const disposition=$('dd704FollowupDisposition').value;
      if(!['manual_retry_scheduled','original_phone_recheck_pending',
        'external_media_source_investigation'].includes(disposition))
        throw Error('Choose a pending follow-up disposition.');
      await action702('camera704_followup',{open_receipt_id:openId,
        escalation_receipt_id:escalationId,followup_disposition:disposition});
      $('dd704FollowupResult').textContent='Owner follow-up for original case #'+openId+
        ' recorded. No auto retry, file restoration or physical device acceptance inferred.';
    }catch(error){$('dd704FollowupResult').textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  });
  $('dd703AgeRefresh')?.addEventListener('click',async()=>{
    try{await inspect702();}
    catch(error){$('dd703AgeStatus').textContent='HOLD · '+error.message;}
  });
  $('dd703Escalate')?.addEventListener('click',async()=>{
    const button=$('dd703Escalate');button.disabled=true;
    try{
      const id=Number($('dd703AgeCase').value);
      if(!Number.isSafeInteger(id)||id<1)
        throw Error('Select an original open case aged at least 24 hours.');
      if(!gate702?.exception_aging_703?.some(x=>x.receipt_id===id&&
         x.escalation_due&&!x.escalated))
        throw Error('Original source age no longer eligible; re-inspect.');
      await action702('camera703_escalate',{open_receipt_id:id});
      $('dd703AgeResult').textContent='Source-bound case #'+id+
        ' escalated for owner follow-up. No media recovery or phone acceptance inferred.';
    }catch(error){$('dd703AgeResult').textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  });
  $('dd702Inspect')?.addEventListener('click',async()=>{
    try{status702.textContent='Reading exact original receipt and Cloudflare D1/R2 links…';await inspect702();}
    catch(error){gate702=null;status702.textContent='HOLD · '+error.message;}
  });
  async function action702(action,extra={}){
    if(!gate702?.original_701_receipt_id)throw Error('Inspect one adopted Build 701 owner receipt first.');
    const note=($('dd702Notes')?.value||'').trim();
    if(note.length<25||note.length>600)
      throw Error('Record a meaningful 25–600 character owner observation first.');
    if(!crypto?.randomUUID)throw Error('A secure new operation nonce requires HTTPS.');
    const data=await send702(action,{owner_device_notes:note,
      nonce:'phone702-'+crypto.randomUUID(),...extra});
    result702.textContent=data.status+' · protected receipt #'+data.receipt_id+
      '. Physical device and any unrecorded uploads are not independently verified. No publication or accounting close.';
    await inspect702();
  }
  $('dd702Reattest')?.addEventListener('click',async()=>{
    const button=$('dd702Reattest');button.disabled=true;
    try{
      const checks={};
      for(const input of document.querySelectorAll('[data-dd700-check]'))
        checks[input.getAttribute('data-dd700-check')]=input.checked===true;
      if(Object.keys(checks).length!==5||!Object.values(checks).every(Boolean))
        throw Error('Repeat every real-phone checklist observation before re-attestation.');
      if(!gate702?.media?.media)throw Error('Inspect fresh actual R2/D1 media first.');
      await action702('camera702_reattest',{
        owner_checklist_json:JSON.stringify(checks),
        media_snapshot_json:JSON.stringify(gate702.media.media)});
    }catch(error){result702.textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  });
  $('dd702Open')?.addEventListener('click',async()=>{
    const button=$('dd702Open');button.disabled=true;
    try{
      const [kind,media_kind,attachment_id]=issue702.value.split('|');
      if(!['linked','unrecorded'].includes(kind)||!['photo','video'].includes(media_kind))
        throw Error('Select the exact missing R2 attachment or unrecorded upload.');
      await action702('camera702_triage_open',{exception_kind:kind,media_kind,attachment_id});
    }catch(error){result702.textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  });
  $('dd702Close')?.addEventListener('click',async()=>{
    const button=$('dd702Close');button.disabled=true;
    try{
      const caseId=Number(case702.value);
      if(!Number.isSafeInteger(caseId)||caseId<1)
        throw Error('Select an existing unresolved linked attachment case.');
      await action702('camera702_triage_close',{open_receipt_id:caseId});
    }catch(error){result702.textContent='HOLD · '+error.message;}
    finally{button.disabled=false;}
  });

  save.addEventListener('click',async()=>{
    if(saving)return;
    const movie=video.files?.[0]||null;
    if(!active&&!photos.length&&!movie&&!name.value.trim()){
      setMessage('Take a photo, record a video or enter a quick name first.',true);return;
    }
    if(!window.DDAuth?.isLoggedIn?.()||!window.DDAuth.apiFetch){
      setMessage('Admin login required before saving an original camera draft.',true);return;
    }
    saving=true;render();resetProof700();
    try{
      setMessage('Saving or recovering one original camera draft…');
      await createOrRecover();
      setMessage('Original camera draft '+active.label+' saved; checking selected R2 media one file at a time…');
      const pictures=await uploadPhotos();
      const clip=await uploadVideo();
      const missing=pictures.missing+clip.missing;
      const label=active.label,originalId=active.product_id;
      $('mobileRefreshDraftsButton')?.click();
      $('mobileTodayRefreshButton')?.click();
      if(missing){
        persist();
        setMessage('Draft '+label+' saved as '+(active.product_name||'Temporary '+label)+' (#'+originalId+'). '+
          pictures.done+' photos and '+clip.done+' video confirmed. '+
          missing+' media item(s) unconfirmed; reselect/retry only missing items on this SAME draft.',true);
      }else{
        setMessage('Draft '+label+' saved as '+(active.product_name||'Temporary '+label)+' (#'+originalId+'). '+
          pictures.done+' photos and '+clip.done+
          ' video confirmed; all new media complete. Never published automatically.');
        // Keep one original DD draft identity for immediate R2 HEAD acceptance
        // and later owner field proof. Only Start Another Product clears it.
        persist();name.value='';
      }
    }catch(error){
      persist();
      setMessage('Original camera save not fully confirmed: '+error.message+
        ' Keep the capture identity and retry this SAME draft, not a second Product.',true);
    }finally{saving=false;render();}
  });
  if(active){
    setMessage('Previous camera capture found. Select missing files again and use Save/Retry. The original DD draft will be reused.');
    showLinks(active);
  }
  render();
});
