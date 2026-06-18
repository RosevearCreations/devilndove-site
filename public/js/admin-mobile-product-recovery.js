// File: /public/js/admin-mobile-product-recovery.js
// Build 191 browser + authenticated D1 recovery for Mobile Quick Product Add.
// File inputs are never serialized; text/select/checkbox fields and image count only.

(function(){
  const LOCAL_KEY = 'dd_mobile_product_recovery_v2';
  const DEVICE_KEY = 'dd_mobile_device_key_v1';
  const DRAFT_KEY = 'dd_mobile_server_draft_key_v1';

  function esc(value){ return String(value ?? '').replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fields(form){ return Array.from(form.querySelectorAll('input, select, textarea')).filter((el)=>el.name && el.type !== 'file' && el.type !== 'password' && el.type !== 'submit'); }
  function read(form){ const data={}; fields(form).forEach((el)=>{ data[el.name]=el.type==='checkbox' ? !!el.checked : el.value; }); return data; }
  function write(form, data){ fields(form).forEach((el)=>{ if (!(el.name in data)) return; if (el.type==='checkbox') el.checked=!!data[el.name]; else if (!String(el.value||'').trim()) el.value=data[el.name] ?? ''; }); }
  function randomKey(prefix){
    try { return `${prefix}_${crypto.randomUUID()}`; }
    catch { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`; }
  }
  function stored(key, fallback=''){
    try { const value=localStorage.getItem(key); if(value)return value; localStorage.setItem(key,fallback); return fallback; } catch { return fallback; }
  }
  const deviceKey = stored(DEVICE_KEY, randomKey('device'));
  const draftKey = stored(DRAFT_KEY, randomKey('mobile_draft'));

  function panelMessage(message, mode=''){
    const note=document.getElementById('mobileRecoveryStatus');
    if(!note)return;
    note.textContent=message;
    note.className=`status-note mobile-recovery-note${mode ? ` ${mode}` : ''}`;
  }
  function payload(form){
    const imageInput=document.getElementById('mobileProductImages');
    return {
      saved_at:new Date().toISOString(),
      route:location.pathname,
      data:read(form),
      image_count:Number(imageInput?.files?.length||0)
    };
  }
  function saveLocal(form){
    try {
      const value=payload(form);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(value));
      panelMessage(`Recovery saved on this device ${new Date(value.saved_at).toLocaleTimeString()}. Server sync pending…`);
      return value;
    } catch { return null; }
  }
  async function saveServer(value){
    if(!value || !window.DDAuth?.apiFetch) return false;
    try {
      const response=await window.DDAuth.apiFetch('/api/admin/value-ops-followthrough',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          action:'save_mobile_draft',
          draft_key:draftKey,
          device_key:deviceKey,
          route_path:location.pathname,
          payload:value.data,
          image_count:value.image_count,
          client_saved_at:value.saved_at,
          notes:'Build 191 phone draft autosave. File bytes are not stored; reselect images after recovery.'
        })
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok || data?.ok===false) throw new Error(data?.error||'Server sync failed.');
      panelMessage(`Recovery saved locally and to D1 ${new Date(value.saved_at).toLocaleTimeString()}. Images must be reselected after recovery.`,'success');
      return true;
    } catch {
      panelMessage('Local recovery is safe, but D1 sync failed. Keep this tab/device until the connection returns.','warning');
      return false;
    }
  }
  async function loadServer(){
    if(!window.DDAuth?.apiFetch)return null;
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/value-ops-followthrough?draft_key=${encodeURIComponent(draftKey)}`);
      const data=await response.json().catch(()=>({}));
      if(!response.ok || data?.ok===false)return null;
      return data.mobile_server_draft || null;
    }catch{return null;}
  }
  function clearLocal(){ try{ localStorage.removeItem(LOCAL_KEY); }catch{} }

  async function install(){
    const form=document.getElementById('mobileProductForm');
    if(!form)return;
    let note=document.getElementById('mobileRecoveryStatus');
    if(!note){
      note=document.createElement('div');
      note.id='mobileRecoveryStatus';
      note.className='status-note mobile-recovery-note';
      note.textContent='Browser and D1 recovery are on. Text fields autosave; image files must be reselected after recovery.';
      form.parentNode?.insertBefore(note,form);
    }

    let local=null;
    try{local=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null');}catch{}
    const server=await loadServer();
    const candidates=[
      local?.data ? {source:'device',saved_at:local.saved_at,data:local.data,image_count:local.image_count||0} : null,
      server?.payload ? {source:'D1',saved_at:server.client_saved_at||server.server_saved_at||server.updated_at,data:server.payload,image_count:server.image_count||0} : null
    ].filter(Boolean).sort((a,b)=>String(b.saved_at||'').localeCompare(String(a.saved_at||'')));

    if(candidates.length){
      const best=candidates[0];
      const hasCurrent=fields(form).some((el)=>String(el.value||'').trim());
      const bar=document.createElement('div');
      bar.className='status-note warning mobile-recovery-restore';
      bar.innerHTML=`A ${esc(best.source)} draft was found from ${esc(best.saved_at||'earlier')} (${Number(best.image_count||0)} image selection(s) recorded; files must be reselected). <button class="btn" type="button" data-restore-mobile-draft>Restore fields</button> <button class="btn secondary" type="button" data-clear-mobile-draft>Hide local recovery</button>`;
      note.after(bar);
      bar.querySelector('[data-restore-mobile-draft]')?.addEventListener('click',()=>{write(form,best.data); const value=saveLocal(form); saveServer(value); bar.remove();});
      bar.querySelector('[data-clear-mobile-draft]')?.addEventListener('click',()=>{clearLocal();bar.remove();panelMessage('Local recovery hidden. The latest authenticated D1 snapshot remains available until overwritten.');});
      if(!hasCurrent)write(form,best.data);
    }

    let localTimer=null, serverTimer=null;
    const schedule=()=>{
      clearTimeout(localTimer); clearTimeout(serverTimer);
      localTimer=setTimeout(()=>{
        const value=saveLocal(form);
        serverTimer=setTimeout(()=>saveServer(value),1200);
      },300);
    };
    fields(form).forEach((el)=>{el.addEventListener('input',schedule);el.addEventListener('change',schedule);el.addEventListener('blur',schedule);});
    document.getElementById('mobileProductImages')?.addEventListener('change',schedule);
    form.addEventListener('submit',()=>{setTimeout(clearLocal,1800);});
  }
  document.addEventListener('DOMContentLoaded',install);
})();
