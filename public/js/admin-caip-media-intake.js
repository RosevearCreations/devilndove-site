// Build 264 — CAIP private large-media intake UI; accepts productless Creative Process project workspaces.
(() => {
  const mount = document.getElementById('caipMediaIntakeMount');
  if (!mount) return;
  const LS_PROJECT = 'dd_caip_media_project_v1';
  const LS_SESSION = 'dd_caip_media_session_v1';
  const state = { data: null, pendingFiles: [], localFileMap: new Map(), paused: new Set(), busy: false, online: navigator.onLine };
  const URL_PROJECT = Number(new URLSearchParams(location.search).get('creative_project_id') || 0);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const fmtBytes = (value) => { const bytes = Math.max(0,num(value)); if (!bytes) return '0 B'; const units=['B','KB','MB','GB','TB']; const i=Math.min(units.length-1,Math.floor(Math.log(bytes)/Math.log(1024))); return `${(bytes/(1024**i)).toFixed(i?1:0)} ${units[i]}`; };
  const pct = (a,b) => b > 0 ? Math.min(100,Math.round((a/b)*100)) : 0;
  const human = (value) => String(value || '').replace(/_/g,' ').replace(/\b\w/g,(m)=>m.toUpperCase());
  const projectId = () => Number(document.getElementById('caipMediaProject')?.value || state.data?.selected_project_id || URL_PROJECT || localStorage.getItem(LS_PROJECT) || 0);
  const api = async (body=null, project=projectId()) => {
    const url = `/api/admin/caip-media-intake${project ? `?creative_project_id=${encodeURIComponent(project)}` : ''}`;
    const response = await DDAuth.apiFetch(url, body ? {method:'POST',body:JSON.stringify(body)} : undefined);
    const data = await response.json().catch(()=>null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || `CAIP media intake failed (${response.status}).`);
    return data;
  };
  const setMsg = (text='',error=false) => { const el=document.getElementById('caipMediaMessage'); if(!el)return; el.hidden=!text; el.textContent=text; el.className=`content-studio-message ${error?'error':'success'}`; };

  function fallback(error) {
    mount.innerHTML = `<section class="card caip-media-intake-card caip-media-degraded"><div class="section-title-row"><div><p class="eyebrow">Build 241 • Private raw media intake</p><h2>Large media intake is unavailable</h2></div><span class="status-pill">Status unknown</span></div><p>${esc(error || 'The CAIP media-intake API could not be reached.')}</p><p class="small">No upload is assumed successful. Existing CAIP assets remain unchanged. Apply Build 241 and configure the optional <code>CAIP_PRIVATE_MEDIA_BUCKET</code> binding before binary uploads.</p><div class="caip-media-actions"><button class="btn" id="caipMediaRetry" type="button">Retry</button><a class="btn secondary" href="/CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md">Open Cloudflare checklist</a></div></section>`;
    document.getElementById('caipMediaRetry')?.addEventListener('click',load);
  }

  function selectedParts(fileId) { return (state.data?.parts || []).filter((p)=>Number(p.caip_media_upload_file_id)===Number(fileId)); }
  function uploadStatus(file) {
    const done = num(file.uploaded_bytes); const total = num(file.file_size_bytes); const percent = pct(done,total);
    return `<div class="caip-upload-progress"><div><strong>${percent}%</strong><span>${fmtBytes(done)} / ${fmtBytes(total)}</span></div><progress max="100" value="${percent}">${percent}%</progress></div>`;
  }
  function fileRow(file) {
    const parts=selectedParts(file.caip_media_upload_file_id); const uploaded=parts.filter((p)=>p.part_status==='uploaded').length;
    const binding=state.data?.binding?.private_bucket_available;
    const canUpload=['waiting','initiating','uploading','paused','failed'].includes(file.upload_status) && binding;
    const uploadedFile=file.upload_status==='uploaded';
    const disabled = state.busy ? 'disabled' : '';
    return `<article class="caip-upload-file" data-file-row="${num(file.caip_media_upload_file_id)}">
      <div class="caip-upload-file-head"><div><strong>${esc(file.original_filename)}</strong><span class="small">${esc(human(file.media_role))} • ${esc(file.media_type)} • ${fmtBytes(file.file_size_bytes)}</span></div><span class="status-pill">${esc(human(file.upload_status))}</span></div>
      ${uploadStatus(file)}
      <div class="caip-upload-meta"><span>${uploaded}/${num(file.expected_parts)} parts</span><span>${esc(file.privacy_state)}</span><span>${esc(file.rights_status)}</span>${file.creative_asset_id?`<span>CAIP asset #${num(file.creative_asset_id)}</span>`:''}</div>
      ${file.last_error?`<p class="small caip-upload-error">${esc(file.last_error)}</p>`:''}
      <div class="caip-media-actions">
        ${canUpload?`<button class="btn primary" data-resume-file="${num(file.caip_media_upload_file_id)}" ${disabled}>${file.upload_status==='waiting'?'Select & upload':'Resume upload'}</button>`:''}
        ${['uploading','failed'].includes(file.upload_status)?`<button class="btn" data-pause-file="${num(file.caip_media_upload_file_id)}" ${disabled}>Pause locally</button>`:''}
        ${!uploadedFile && file.upload_status!=='aborted'?`<button class="btn danger" data-abort-file="${num(file.caip_media_upload_file_id)}" ${disabled}>Abort multipart</button>`:''}
        ${uploadedFile?`<button class="btn" data-save-governance="${num(file.caip_media_upload_file_id)}" ${disabled}>Review privacy / rights</button><button class="btn secondary" data-promotion-file="${num(file.caip_media_upload_file_id)}" ${disabled}>Request public promotion</button>`:''}
      </div>
      ${uploadedFile?`<details class="caip-media-governance" id="governance-${num(file.caip_media_upload_file_id)}"><summary>Media governance</summary><div class="caip-form-grid"><label>Role<select class="input" data-g-role="${num(file.caip_media_upload_file_id)}">${roleOptions(file.media_role)}</select></label><label>Privacy<select class="input" data-g-privacy="${num(file.caip_media_upload_file_id)}">${optionList(['private','internal_review','public_candidate','public_approved','blocked'],file.privacy_state)}</select></label><label>Consent<select class="input" data-g-consent="${num(file.caip_media_upload_file_id)}">${optionList(['not_applicable','unknown','internal_only','public_allowed','revoked','blocked'],file.consent_state)}</select></label><label>Rights<select class="input" data-g-rights="${num(file.caip_media_upload_file_id)}">${optionList(['needs_review','internal_only','public_allowed','blocked'],file.rights_status)}</select></label></div></details>`:''}
    </article>`;
  }
  function optionList(values,selected){return values.map((v)=>`<option value="${v}" ${v===selected?'selected':''}>${human(v)}</option>`).join('');}
  function roleOptions(selected){return optionList(['before','during','after','material','tool','process','mistake','repair','finished_product','packaging','narration','b_roll','reference','miscellaneous'],selected);}
  function pendingRows(){return state.pendingFiles.length?state.pendingFiles.map((item)=>`<div class="caip-pending-file"><span><strong>${esc(item.file.name)}</strong><small>${fmtBytes(item.file.size)} • ${esc(item.file.type||'unknown type')}</small></span><button class="btn" type="button" data-remove-pending="${esc(item.clientKey)}">Remove</button></div>`).join(''):'<p class="small">Drop or choose project photos, video, or narration files.</p>';}

  function render() {
    const data=state.data||{}; const projects=data.projects||[]; const project=projectId()||num(data.selected_project_id); const files=(data.files||[]).filter((f)=>num(f.creative_project_id)===project); const sessions=(data.sessions||[]).filter((s)=>num(s.creative_project_id)===project); const jobs=(data.processing_jobs||[]).filter((j)=>num(j.creative_project_id)===project); const promotions=(data.promotion_requests||[]).filter((p)=>num(p.creative_project_id)===project); const binding=data.binding||{};
    mount.innerHTML = `<section class="card caip-media-intake-card">
      <div class="section-title-row"><div><p class="eyebrow">Build 241 • DAIP design rewritten for Devil n Dove CAIP</p><h2>Private large media intake</h2><p class="small">Raw project photos, videos and narration live in private R2. D1 stores metadata and resumable state. Completed originals become internal CAIP assets; public copies require a separate rights/consent review.</p></div><span class="status-pill ${binding.private_bucket_available?'status-approved':'status-missing'}">${binding.private_bucket_available?'Private R2 ready':'Private R2 binding needed'}</span></div>
      <div id="caipMediaMessage" class="content-studio-message" hidden></div>
      <div class="caip-media-summary"><article><strong>${sessions.length}</strong><span>upload sessions</span></article><article><strong>${files.filter((f)=>f.upload_status==='uploaded').length}</strong><span>private originals</span></article><article><strong>${files.filter((f)=>['uploading','failed','paused'].includes(f.upload_status)).length}</strong><span>recoverable</span></article><article><strong>${jobs.filter((j)=>j.job_status==='planned').length}</strong><span>processing plans</span></article><article><strong>${promotions.filter((p)=>p.request_status==='needs_review').length}</strong><span>public reviews</span></article></div>
      <div class="caip-media-binding-note ${binding.private_bucket_available?'is-ready':'is-warning'}"><strong>${binding.private_bucket_available?'Private raw-media binding is available.':'Uploads are intentionally blocked until CAIP_PRIVATE_MEDIA_BUCKET is bound.'}</strong><span class="small">Transport: ${esc(binding.transport_mode||'worker_streamed_multipart_v1')} • 32 MiB default parts • 2-way parallelism • raw originals immutable • no public bucket exposure.</span></div>
      <div class="caip-media-intake-grid">
        <div class="caip-media-create">
          <label>Creative Project<select class="input" id="caipMediaProject"><option value="">Choose project</option>${projects.map((p)=>`<option value="${num(p.creative_project_id)}" ${num(p.creative_project_id)===project?'selected':''}>${esc(p.project_title||p.creative_project_key)}</option>`).join('')}</select></label>
          <div class="caip-drop-zone" id="caipDropZone" tabindex="0" role="button" aria-label="Choose or drop private CAIP media"><strong>Drop raw project media here</strong><span>JPG, PNG, WebP, HEIC, AVIF, MP4, MOV, M4V, WebM, WAV, M4A, MP3 or AAC</span><button class="btn" type="button" id="caipChooseFiles">Choose files</button><input id="caipMediaFiles" type="file" hidden multiple accept="image/*,video/*,audio/*,.heic,.heif,.avif,.m4v"/></div>
          <div id="caipPendingFiles" class="caip-pending-list">${pendingRows()}</div>
          <div class="caip-form-grid"><label>Default role<select class="input" id="caipDefaultRole">${roleOptions('process')}</select></label><label>Privacy<select class="input" id="caipDefaultPrivacy">${optionList(['private','internal_review','public_candidate'],'private')}</select></label><label>Consent<select class="input" id="caipDefaultConsent">${optionList(['not_applicable','unknown','internal_only','public_allowed'],'not_applicable')}</select></label><label>Rights<select class="input" id="caipDefaultRights">${optionList(['needs_review','internal_only','public_allowed'],'needs_review')}</select></label></div>
          <label>Source note<input class="input" id="caipSourceNote" placeholder="Workshop project, imported archive, phone capture…"/></label>
          <div class="caip-media-actions"><button class="btn primary" id="caipCreateUploadSession" type="button" ${binding.private_bucket_available?'':'disabled'}>Create session & upload selected files</button><button class="btn" id="caipMediaRefresh" type="button">Refresh</button></div>
        </div>
        <aside class="caip-media-architecture"><h3>Devil n Dove CAIP storage path</h3><pre>projects/{project_id}/
  raw/photos | video | audio
  proxy/video
  extracted/frames | audio | transcripts
  derived/photos | thumbnails | video | shorts | reels | social
  exports/youtube | facebook | instagram | tiktok | pinterest | website
  manifests
  archive</pre><p class="small">The current build implements private <code>raw/</code> multipart intake plus D1 processing plans. Proxy/extracted/derived/export providers remain explicit future adapters and cannot show false completion.</p></aside>
      </div>
    </section>
    <section class="card caip-media-files-card"><div class="section-title-row"><div><h2>Project upload recovery</h2><p class="small">Server state survives refreshes and connection loss. Browser security may require reselecting the same local file after a full browser restart; uploaded R2 parts are not repeated.</p></div><span class="status-pill">${state.online?'Online':'Offline'}</span></div><div class="caip-upload-file-list">${files.length?files.map(fileRow).join(''):'<div class="content-empty-state">No private media has been queued for this CAIP project.</div>'}</div></section>
    <section class="card caip-media-queue-card"><div class="section-title-row"><div><h2>Processing and public-promotion queue</h2><p class="small">These are governed plans, not completed AI/rendering jobs. Public promotion requests create review evidence only.</p></div></div><div class="caip-media-queue-grid"><div><h3>Processing plans</h3>${jobs.length?jobs.slice(0,20).map((j)=>`<div class="caip-queue-row"><span><strong>${esc(human(j.job_type))}</strong><small>${esc(j.provider_key)}</small></span><span class="status-pill">${esc(j.job_status)}</span></div>`).join(''):'<p class="small">No processing plans yet.</p>'}</div><div><h3>Public promotion review</h3>${promotions.length?promotions.slice(0,20).map((p)=>`<div class="caip-queue-row"><span><strong>${esc(human(p.destination_role))}</strong><small>${esc(p.request_key)}</small></span><span class="status-pill">${esc(p.request_status)}</span></div>`).join(''):'<p class="small">No public promotion requests.</p>'}</div></div></section>`;
    bind();
  }

  function addFiles(fileList) {
    for (const file of Array.from(fileList||[])) {
      const clientKey=crypto.randomUUID(); state.pendingFiles.push({clientKey,file}); state.localFileMap.set(clientKey,file);
    }
    const target=document.getElementById('caipPendingFiles'); if(target)target.innerHTML=pendingRows(); bindPending();
  }
  function bindPending(){document.querySelectorAll('[data-remove-pending]').forEach((button)=>button.onclick=()=>{const key=button.dataset.removePending;state.pendingFiles=state.pendingFiles.filter((x)=>x.clientKey!==key);state.localFileMap.delete(key);const target=document.getElementById('caipPendingFiles');if(target)target.innerHTML=pendingRows();bindPending();});}
  async function refresh(project=projectId()) { const data=await api(null,project); state.data=data; if(data.selected_project_id)localStorage.setItem(LS_PROJECT,String(data.selected_project_id)); render(); }
  async function load(){try{state.data=await api(null,URL_PROJECT||Number(localStorage.getItem(LS_PROJECT)||0));render();}catch(error){fallback(error.message);}}

  async function createSessionAndUpload() {
    if(state.busy)return; const project=projectId(); if(!project)return setMsg('Choose a Creative Project first.',true); if(!state.pendingFiles.length)return setMsg('Choose one or more media files first.',true);
    state.busy=true; render();
    try {
      const defaultRole=document.getElementById('caipDefaultRole')?.value||'process'; const defaultPrivacy=document.getElementById('caipDefaultPrivacy')?.value||'private'; const defaultConsent=document.getElementById('caipDefaultConsent')?.value||'not_applicable'; const defaultRights=document.getElementById('caipDefaultRights')?.value||'needs_review';
      const payload={action:'create_session',creative_project_id:project,upload_device:`${navigator.platform||'browser'} / ${navigator.userAgent.slice(0,160)}`,source_note:document.getElementById('caipSourceNote')?.value||'',media_role:defaultRole,privacy_state:defaultPrivacy,consent_state:defaultConsent,rights_status:defaultRights,files:state.pendingFiles.map(({clientKey,file})=>({client_key:clientKey,name:file.name,type:file.type,size:file.size,lastModified:file.lastModified,media_role:defaultRole,privacy_state:defaultPrivacy,consent_state:defaultConsent,rights_status:defaultRights}))};
      const data=await api(payload,project); state.data=data; const created=(data.result?.files||[]); const byClient=new Map(created.map((f)=>[f.client_file_key,f])); if(data.result?.session?.session_key)localStorage.setItem(LS_SESSION,data.result.session.session_key);
      const pending=[...state.pendingFiles]; state.pendingFiles=[]; render();
      for(const item of pending){const serverFile=byClient.get(item.clientKey);if(serverFile)await uploadFile(serverFile,item.file);}
      await refresh(project); setMsg('Private upload session completed as far as possible. Review any failed/recoverable file rows.',false);
    } catch(error){setMsg(error.message||'Upload session failed.',true);}
    finally{state.busy=false; await refresh(project).catch(()=>{});}
  }

  async function initiate(fileId){const data=await api({action:'initiate_file',caip_media_upload_file_id:fileId});state.data=data;return (data.files||[]).find((f)=>num(f.caip_media_upload_file_id)===num(fileId))||data.result?.file;}
  async function uploadFile(serverFile,file){
    const fileId=num(serverFile.caip_media_upload_file_id); if(!fileId||!file)return;
    if(file.name!==serverFile.original_filename||file.size!==num(serverFile.file_size_bytes))throw new Error(`Selected file does not match ${serverFile.original_filename} (${fmtBytes(serverFile.file_size_bytes)}).`);
    state.paused.delete(fileId); const initiated=await initiate(fileId); const parts=(state.data?.parts||[]).filter((p)=>num(p.caip_media_upload_file_id)===fileId).sort((a,b)=>num(a.part_number)-num(b.part_number)); const queue=parts.filter((p)=>p.part_status!=='uploaded');
    const concurrency=Math.min(2,queue.length||1); let next=0; let failed=null;
    const worker=async()=>{while(next<queue.length&&!failed&&!state.paused.has(fileId)){const part=queue[next++];const blob=file.slice(num(part.byte_start),num(part.byte_end));try{const response=await DDAuth.apiFetch(`/api/admin/caip-media-upload-part?file_id=${encodeURIComponent(fileId)}&part_number=${encodeURIComponent(part.part_number)}`,{method:'PUT',headers:{'Content-Type':'application/octet-stream','Content-Length':String(blob.size)},body:blob});const result=await response.json().catch(()=>null);if(!response.ok||!result?.ok)throw new Error(result?.error||`Part ${part.part_number} failed.`);const row=document.querySelector(`[data-file-row="${fileId}"]`);if(row){const progress=row.querySelector('progress');const strong=row.querySelector('.caip-upload-progress strong');const span=row.querySelector('.caip-upload-progress span');const bytes=Math.min(file.size,(num(result.uploaded_parts))*num(serverFile.part_size_bytes));const percent=pct(bytes,file.size);if(progress)progress.value=percent;if(strong)strong.textContent=`${percent}%`;if(span)span.textContent=`${fmtBytes(bytes)} / ${fmtBytes(file.size)}`;}}catch(error){failed=error;}}};
    await Promise.all(Array.from({length:concurrency},worker)); if(state.paused.has(fileId)){await refresh();return;} if(failed)throw failed;
    const completed=await api({action:'complete_file',caip_media_upload_file_id:fileId});state.data=completed;render();
  }
  function pickForExisting(fileId){const file=(state.data?.files||[]).find((f)=>num(f.caip_media_upload_file_id)===num(fileId));if(!file)return;const input=document.createElement('input');input.type='file';input.accept=file.media_type==='image'?'image/*':file.media_type==='video'?'video/*':file.media_type==='audio'?'audio/*':'*/*';input.onchange=async()=>{const selected=input.files?.[0];if(!selected)return;state.busy=true;render();try{await uploadFile(file,selected);setMsg(`${file.original_filename} resumed.`,false);}catch(error){setMsg(error.message,true);}finally{state.busy=false;await refresh().catch(()=>{});}};input.click();}
  async function abortFile(fileId){if(!confirm('Abort this in-progress multipart upload? Completed raw originals cannot be deleted here.'))return;try{state.paused.add(fileId);state.data=await api({action:'abort_file',caip_media_upload_file_id:fileId});render();setMsg('Multipart upload aborted. No raw original was created.',false);}catch(error){setMsg(error.message,true);}}
  async function saveGovernance(fileId){const details=document.getElementById(`governance-${fileId}`);if(details)details.open=true;const get=(sel)=>document.querySelector(`[${sel}="${fileId}"]`)?.value;try{state.data=await api({action:'update_governance',caip_media_upload_file_id:fileId,media_role:get('data-g-role'),privacy_state:get('data-g-privacy'),consent_state:get('data-g-consent'),rights_status:get('data-g-rights')});render();setMsg('Media privacy, consent and rights review saved.',false);}catch(error){setMsg(error.message,true);}}
  async function requestPromotion(fileId){const destination=prompt('Public destination role:', 'website_gallery');if(!destination)return;try{state.data=await api({action:'request_public_promotion',caip_media_upload_file_id:fileId,destination_role:destination});render();setMsg('Public promotion review requested. No public copy was created.',false);}catch(error){setMsg(error.message,true);}}

  function bind(){
    const project=document.getElementById('caipMediaProject');if(project)project.onchange=()=>{localStorage.setItem(LS_PROJECT,project.value);refresh(Number(project.value)).catch((e)=>setMsg(e.message,true));};
    document.getElementById('caipChooseFiles')?.addEventListener('click',()=>document.getElementById('caipMediaFiles')?.click()); document.getElementById('caipMediaFiles')?.addEventListener('change',(e)=>addFiles(e.target.files));
    const zone=document.getElementById('caipDropZone'); if(zone){zone.ondragover=(e)=>{e.preventDefault();zone.classList.add('is-dragging');};zone.ondragleave=()=>zone.classList.remove('is-dragging');zone.ondrop=(e)=>{e.preventDefault();zone.classList.remove('is-dragging');addFiles(e.dataTransfer.files);};zone.onkeydown=(e)=>{if(['Enter',' '].includes(e.key)){e.preventDefault();document.getElementById('caipMediaFiles')?.click();}};}
    document.getElementById('caipCreateUploadSession')?.addEventListener('click',createSessionAndUpload);document.getElementById('caipMediaRefresh')?.addEventListener('click',()=>refresh().catch((e)=>setMsg(e.message,true)));bindPending();
    document.querySelectorAll('[data-resume-file]').forEach((b)=>b.onclick=()=>pickForExisting(b.dataset.resumeFile));document.querySelectorAll('[data-pause-file]').forEach((b)=>b.onclick=()=>{state.paused.add(num(b.dataset.pauseFile));setMsg('Upload will pause after currently active parts finish. Completed parts remain in R2.',false);});document.querySelectorAll('[data-abort-file]').forEach((b)=>b.onclick=()=>abortFile(b.dataset.abortFile));document.querySelectorAll('[data-save-governance]').forEach((b)=>b.onclick=()=>saveGovernance(b.dataset.saveGovernance));document.querySelectorAll('[data-promotion-file]').forEach((b)=>b.onclick=()=>requestPromotion(b.dataset.promotionFile));
  }
  window.addEventListener('online',()=>{state.online=true;render();});window.addEventListener('offline',()=>{state.online=false;render();setMsg('Connection lost. Completed multipart parts remain recorded; reselect the same file and resume after reconnecting.',true);});
  load();
})();
