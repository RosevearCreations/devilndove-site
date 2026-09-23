// Release 467 Build 236 — Save Confidence, Unsaved-Work Protection & Safe Batch Review
(() => {
  'use strict';
  if (!location.pathname.startsWith('/admin/')) return;

  const STATE = Object.freeze({
    SAVED: 'Saved',
    DIRTY: 'Unsaved changes',
    SAVING: 'Saving…',
    FAILED: 'Save failed',
    STALE: 'Stale data'
  });
  const tracked = new Map();
  let activeForm = null;

  function eligible(form) {
    if (!(form instanceof HTMLFormElement)) return false;
    if (form.dataset.ddUnsavedIgnore === '1') return false;
    const method = String(form.getAttribute('method') || '').toUpperCase();
    if (method === 'GET') return false;
    return Boolean(form.querySelector('input:not([type="hidden"]):not([type="search"]), textarea, select'));
  }
  function formLabel(form) {
    return String(form.dataset.ddSaveLabel || form.getAttribute('aria-label') || form.querySelector('h1,h2,legend')?.textContent || 'This workspace').trim();
  }
  function setState(form, state, detail='') {
    if (!eligible(form)) return;
    const row = tracked.get(form) || { state: STATE.SAVED, detail: '', dirty: false };
    row.state = state; row.detail = detail;
    row.dirty = state === STATE.DIRTY || state === STATE.FAILED || state === STATE.STALE;
    tracked.set(form,row);
    activeForm=form;
    render();
    document.dispatchEvent(new CustomEvent('dd:save-confidence-state',{detail:{state,detail,label:formLabel(form)}}));
  }
  function dirtyCount() {
    return [...tracked.values()].filter(x => x.dirty).length;
  }
  function ensureUi() {
    let root=document.getElementById('ddSaveConfidenceV236');
    if(root) return root;
    root=document.createElement('aside');
    root.id='ddSaveConfidenceV236';
    root.setAttribute('aria-live','polite');
    root.style.cssText='position:fixed;right:14px;bottom:14px;z-index:2147482500;max-width:min(430px,calc(100vw - 28px));background:#111827;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 12px;box-shadow:0 12px 36px rgba(0,0,0,.28);font:14px/1.35 system-ui,sans-serif;display:none';
    root.innerHTML='<div style="display:flex;gap:10px;align-items:center;justify-content:space-between"><strong data-dd-save-state>Saved</strong><button type="button" data-dd-save-review style="border:1px solid currentColor;background:transparent;color:inherit;border-radius:8px;padding:5px 8px;cursor:pointer">Review changes</button></div><div data-dd-save-detail style="opacity:.82;margin-top:4px"></div><div data-dd-batch-review style="display:none;margin-top:8px;border-top:1px solid rgba(255,255,255,.18);padding-top:8px"></div>';
    root.querySelector('[data-dd-save-review]').addEventListener('click',()=>{
      const form=activeForm || [...tracked.keys()].find(f=>tracked.get(f)?.dirty);
      if(!form) return;
      form.scrollIntoView({behavior:'smooth',block:'center'});
      const target=form.querySelector(':invalid, input:not([type="hidden"]), textarea, select, button[type="submit"]');
      target?.focus?.({preventScroll:true});
    });
    document.body.appendChild(root);
    return root;
  }
  function render() {
    if(!document.body) return;
    const root=ensureUi();
    const rows=[...tracked.entries()];
    const dirty=dirtyCount();
    const current=activeForm && tracked.get(activeForm);
    root.style.display=rows.length ? 'block' : 'none';
    root.querySelector('[data-dd-save-state]').textContent=current?.state || STATE.SAVED;
    const parts=[];
    if(current?.detail) parts.push(current.detail);
    if(dirty) parts.push(dirty===1?'1 workspace has unsaved work.':dirty+' workspaces have unsaved work.');
    else parts.push('No unsaved changes detected on this page.');
    root.querySelector('[data-dd-save-detail]').textContent=parts.join(' ');
    root.querySelector('[data-dd-save-review]').hidden=!dirty;
    renderBatchReview(root);
  }
  function track(form) {
    if(!eligible(form) || tracked.has(form)) return;
    tracked.set(form,{state:STATE.SAVED,detail:'',dirty:false});
    form.addEventListener('input',()=>setState(form,STATE.DIRTY,'Review and save before leaving.'));
    form.addEventListener('change',()=>setState(form,STATE.DIRTY,'Review and save before leaving.'));
    form.addEventListener('reset',()=>queueMicrotask(()=>setState(form,STATE.SAVED,'Form reset to its loaded values.')));
    form.addEventListener('submit',()=>setState(form,STATE.SAVING,'Waiting for the existing save action to finish.'));
  }
  function selectedBatchItems() {
    return [...document.querySelectorAll('[data-dd-safe-batch-review="1"] input[type="checkbox"][data-item-id]:checked')]
      .map(x=>({id:String(x.dataset.itemId||'').trim(),label:String(x.dataset.itemLabel||x.closest('tr,li,[data-item-label]')?.querySelector('[data-item-label]')?.textContent||x.value||'Selected item').trim()}))
      .filter(x=>x.id);
  }
  function renderBatchReview(root=ensureUi()) {
    const mount=root.querySelector('[data-dd-batch-review]');
    const items=selectedBatchItems();
    if(!items.length){mount.style.display='none';mount.textContent='';return;}
    mount.style.display='block';
    mount.textContent='Safe batch review: '+items.length+' selected. '+items.slice(0,5).map(x=>x.label+' ['+x.id+']').join(' • ')+(items.length>5?' • +'+(items.length-5)+' more':'')+'. Review only; Build 236 does not execute a batch mutation.';
  }

  document.addEventListener('change',(event)=>{
    if(event.target?.matches?.('[data-dd-safe-batch-review="1"] input[type="checkbox"][data-item-id]')) render();
  },true);
  document.addEventListener('dd:save-started',(e)=>e.detail?.form&&setState(e.detail.form,STATE.SAVING,e.detail.message||'Saving with the existing API…'));
  document.addEventListener('dd:save-succeeded',(e)=>e.detail?.form&&setState(e.detail.form,STATE.SAVED,e.detail.message||'Saved successfully.'));
  document.addEventListener('dd:save-failed',(e)=>e.detail?.form&&setState(e.detail.form,STATE.FAILED,e.detail.message||'Save failed. Review the form and use its existing save action to retry.'));
  document.addEventListener('dd:save-stale',(e)=>e.detail?.form&&setState(e.detail.form,STATE.STALE,e.detail.message||'The loaded copy is stale. Review current data before saving again.'));
  window.addEventListener('beforeunload',(event)=>{
    if(!dirtyCount()) return;
    event.preventDefault();
    event.returnValue='';
  });

  function scan(){ document.querySelectorAll('form').forEach(track); render(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scan,{once:true}); else scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});

  window.DDAdminSaveConfidenceV236=Object.freeze({
    version:'467.236',
    states:STATE,
    markSaved:(form,message='Saved successfully.')=>setState(form,STATE.SAVED,message),
    markSaving:(form,message='Saving with the existing API…')=>setState(form,STATE.SAVING,message),
    markFailed:(form,message='Save failed. Review the form and use its existing save action to retry.')=>setState(form,STATE.FAILED,message),
    markStale:(form,message='The loaded copy is stale. Review current data before saving again.')=>setState(form,STATE.STALE,message),
    registerForm:track,
    snapshot:()=>({tracked:tracked.size,dirty:dirtyCount(),selected_batch_items:selectedBatchItems()})
  });
  document.dispatchEvent(new CustomEvent('dd:admin-save-confidence-ready',{detail:{release:467,build:236}}));
})();