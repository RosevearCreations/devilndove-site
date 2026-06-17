// File: /public/js/admin-mobile-product-recovery.js
// Brief description: Build 189 browser-side recovery for Mobile Quick Product Add. Keeps phone drafts from being lost if upload/network/admin session fails.

(function(){
  const KEY = 'dd_mobile_product_recovery_v1';
  function esc(value){ return String(value ?? '').replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fields(form){ return Array.from(form.querySelectorAll('input, select, textarea')).filter((el)=>el.name && el.type !== 'file' && el.type !== 'password'); }
  function read(form){ const data={}; fields(form).forEach((el)=>{ data[el.name]=el.type==='checkbox' ? !!el.checked : el.value; }); return data; }
  function write(form, data){ fields(form).forEach((el)=>{ if (!(el.name in data)) return; if (el.type==='checkbox') el.checked=!!data[el.name]; else if (!el.value) el.value=data[el.name] ?? ''; }); }
  function save(form){
    try {
      const imageInput=document.getElementById('mobileProductImages');
      const payload={ saved_at:new Date().toISOString(), route:location.pathname, data:read(form), image_count:Number(imageInput?.files?.length||0) };
      localStorage.setItem(KEY, JSON.stringify(payload));
      const note=document.getElementById('mobileRecoveryStatus');
      if(note) note.textContent=`Browser recovery saved ${new Date(payload.saved_at).toLocaleTimeString()}.`;
    } catch {}
  }
  function clear(){ try{ localStorage.removeItem(KEY); }catch{} }
  function install(){
    const form=document.getElementById('mobileProductForm');
    if(!form) return;
    let panel=document.getElementById('mobileRecoveryStatus');
    if(!panel){
      panel=document.createElement('div');
      panel.id='mobileRecoveryStatus';
      panel.className='status-note mobile-recovery-note';
      panel.textContent='Browser recovery is on. Draft text is saved locally on this device until a product draft is saved.';
      form.parentNode?.insertBefore(panel, form);
    }
    let timer=null;
    const schedule=()=>{ clearTimeout(timer); timer=setTimeout(()=>save(form), 250); };
    fields(form).forEach((el)=>{ el.addEventListener('input', schedule); el.addEventListener('change', schedule); el.addEventListener('blur', schedule); });
    const imageInput=document.getElementById('mobileProductImages');
    imageInput?.addEventListener('change', schedule);
    try{
      const cached=JSON.parse(localStorage.getItem(KEY)||'null');
      if(cached?.data && Object.keys(cached.data).length){
        const hasCurrent=fields(form).some((el)=>String(el.value||'').trim());
        const bar=document.createElement('div');
        bar.className='status-note warning mobile-recovery-restore';
        bar.innerHTML=`Unsaved phone draft found from ${esc(cached.saved_at || 'earlier')}. <button class="btn" type="button" data-restore-mobile-draft>Restore fields</button> <button class="btn secondary" type="button" data-clear-mobile-draft>Discard recovery</button>`;
        panel.after(bar);
        bar.querySelector('[data-restore-mobile-draft]')?.addEventListener('click',()=>{ write(form, cached.data); save(form); bar.remove(); });
        bar.querySelector('[data-clear-mobile-draft]')?.addEventListener('click',()=>{ clear(); bar.remove(); panel.textContent='Browser recovery cleared for this device.'; });
        if(!hasCurrent) write(form, cached.data);
      }
    }catch{}
    form.addEventListener('submit',()=>{ setTimeout(clear, 1500); });
  }
  document.addEventListener('DOMContentLoaded', install);
})();
