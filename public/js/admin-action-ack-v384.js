/* Build 384: operator-visible write acknowledgements and single-flight duplicate protection.
   Scope: same-origin /api/ writes on Admin pages. Zero D1 reads/writes. */
(() => {
  'use strict';
  if (!location.pathname.startsWith('/admin/') || window.DDAdminActionAck?.installed) return;
  const rawFetch = window.fetch.bind(window), inflight = new Map(), busy = new WeakMap();
  let recent = null, box = null;
  const mutation = new Set(['POST','PUT','PATCH','DELETE']);
  const label = (method,button) => {
    const hint = String(button?.dataset?.waitText || button?.textContent || button?.value || '').toLowerCase();
    if (/delet|remov|void|cancel|archiv/.test(hint) || method === 'DELETE') return 'Deleting…';
    if (/add|creat|new|upload|import/.test(hint)) return 'Adding…';
    if (/sav|apply|commit/.test(hint)) return 'Saving…';
    if (/updat|edit|chang/.test(hint) || method === 'PATCH' || method === 'PUT') return 'Updating…';
    if (/approv|publish|submit|send|confirm/.test(hint)) return 'Processing…';
    return 'Saving…';
  };
  function announce(message,good) {
    if (!box) {
      box = document.createElement('div');
      box.id='dd-action-ack-v384';
      box.setAttribute('role','status');
      box.setAttribute('aria-live','polite');
      box.style.cssText='position:fixed;right:14px;bottom:14px;z-index:2147483000;max-width:min(410px,calc(100vw - 28px));padding:12px 15px;border-radius:9px;background:#202432;color:#fff;box-shadow:0 5px 26px #0008;font:600 14px/1.4 system-ui,sans-serif;white-space:pre-wrap;';
      document.body.appendChild(box);
    }
    box.textContent=message;
    box.style.borderLeft=good?'5px solid #92d1ae':'5px solid #e4ac67';
    box.hidden=false;
  }
  function nearestButton(target) {
    const element=target?.nodeType===1?target:target?.parentElement;
    return element?.closest?.('button,input[type="submit"],input[type="button"]') || null;
  }
  function remember(button) {
    if (!button || button.matches('[data-dd-no-write-feedback]')) return;
    recent={button,at:Date.now()};
  }
  document.addEventListener('click',(event)=>{
    const button=nearestButton(event.target);if (!button) return;
    if (busy.has(button) || button.dataset.ddActionPending==='1') {
      event.preventDefault();event.stopImmediatePropagation();
      announce('Already processing this action. Please check its result before trying again.',false);return;
    }
    remember(button);
  },true);
  document.addEventListener('submit',(event)=>{
    const form=event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const button=nearestButton(event.submitter) || form.querySelector('button[type="submit"],input[type="submit"]');
    if (button && busy.has(button)) {
      event.preventDefault();event.stopImmediatePropagation();
      announce('This request is already in progress.',false);return;
    }
    remember(button);
  },true);
  function busyStart(button,method) {
    if (!button || !button.isConnected) return () => {};
    const existing=busy.get(button);
    if (existing) { existing.count++;return () => busyEnd(button); }
    const old={count:1,text:button.tagName==='INPUT'?button.value:button.textContent,disabled:button.disabled,
      aria:button.getAttribute('aria-busy'),title:button.getAttribute('title')};
    busy.set(button,old);button.dataset.ddActionPending='1';
    button.disabled=true;button.setAttribute('aria-busy','true');
    if (button.tagName==='INPUT')button.value=label(method,button);
    else if (!button.querySelector('svg,img')) button.textContent=label(method,button);
    else {button.dataset.ddWaitingLabel=label(method,button);button.setAttribute('title',label(method,button));}
    return () => busyEnd(button);
  }
  function busyEnd(button) {
    const old=busy.get(button);if (!old)return;
    old.count--;if(old.count>0)return;
    busy.delete(button);delete button.dataset.ddActionPending;delete button.dataset.ddWaitingLabel;
    button.disabled=old.disabled;
    if(old.aria===null)button.removeAttribute('aria-busy');else button.setAttribute('aria-busy',old.aria);
    if(old.title===null)button.removeAttribute('title');else button.setAttribute('title',old.title);
    if(button.tagName==='INPUT')button.value=old.text;
    else if(!button.querySelector('svg,img'))button.textContent=old.text;
  }
  function request(input,options) {
    const method=String(options?.method || input?.method || 'GET').toUpperCase();
    if(!mutation.has(method))return null;
    try {
      const url=new URL(typeof input==='string'?input:input?.url,location.href);
      if(url.origin!==location.origin || !url.pathname.startsWith('/api/'))return null;
      // Auth, health, and telemetry may have their own feedback contracts.
      if(url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/analytics/'))return null;
      const body=options?.body;
      const fingerprint=typeof body==='string'&&body.length<=32768
        ? method+'|'+url.href+'|'+JSON.stringify(options?.headers||{})+'|'+body:null;
      return {method,url,fingerprint};
    }catch{return null;}
  }
  window.fetch=function(input,options){
    const action=request(input,options);
    if(!action)return rawFetch(input,options);
    // Coalesce identical in-flight writes; each caller receives its own cloneable response.
    if(action.fingerprint && inflight.has(action.fingerprint)) {
      announce('This exact request is already being processed; no duplicate request was sent.',false);
      return inflight.get(action.fingerprint).then(r=>r.clone());
    }
    const b=recent && Date.now()-recent.at<5000 ? recent.button:null;
    recent=null;
    const release=busyStart(b,action.method);
    const operation=(async()=>{
      try{
        const response=await rawFetch(input,options);
        const contentType=String(response.headers?.get('content-type')||'');
        let result=null;
        if(contentType.includes('json'))result=await response.clone().json().catch(()=>null);
        const good=response.ok && (result?.ok===true || result?.success===true || response.status===204);
        if(b)announce(good?'OK — action completed successfully.':response.status>=500?
          'Server error; the action may have completed. Refresh and verify before retrying.':
          'Action not confirmed: '+String(result?.error||(response.ok?'server returned no explicit OK acknowledgement':'server rejected this request')).slice(0,150),good);
        return response;
      }catch(error){
        if(b)announce('Connection interrupted. The result is unknown — refresh and verify before repeating this action.',false);
        throw error;
      }finally{release();}
    })();
    if(action.fingerprint){
      inflight.set(action.fingerprint,operation);
      operation.finally(()=>{if(inflight.get(action.fingerprint)===operation)inflight.delete(action.fingerprint);}).catch(()=>{});
    }
    return operation;
  };
  window.DDAdminActionAck={installed:true,pending:()=>inflight.size,show:announce};
})();
