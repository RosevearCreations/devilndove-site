// Devil n Dove Release 454 — shared Admin loading/empty/error/recovery presentation.
(()=>{
'use strict';
const ERROR_RE=/(could not|failed|failure|error|unavailable|unable to|not available)/i;
const LOADING_RE=/(loading|reading|refreshing|preparing|recording|saving|checking|fetching|working)/i;
const EMPTY_RE=/^(no |choose |select |not prepared|nothing )/i;
function classify(value){const t=String(value||'').trim();if(!t)return 'ready';if(ERROR_RE.test(t))return 'error';if(LOADING_RE.test(t))return 'loading';if(EMPTY_RE.test(t))return 'empty';return 'ready';}
function retryFor(el){
  const selector=el.dataset.adminRetryClick;
  const action=el.dataset.adminRetryAction;
  let button=el.parentElement?.querySelector(`.dd-workspace-retry[data-for="${el.id||'status'}"]`);
  if(el.dataset.state!=='error'){button?.remove();return;}
  if(!selector&&!action)return;
  if(button)return;
  button=document.createElement('button');button.type='button';button.className='btn secondary dd-workspace-retry';button.dataset.for=el.id||'status';button.textContent='Try again';
  button.addEventListener('click',()=>{if(selector){document.querySelector(selector)?.click();}else if(action==='reload'){location.reload();}});
  el.insertAdjacentElement('afterend',button);
}
function enhance(el,state){if(!el)return;const s=state||classify(el.textContent);el.classList.add('dd-workspace-status');el.dataset.state=s;el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','true');retryFor(el);}
function set(target,state,message){const el=typeof target==='string'?document.querySelector(target):target;if(!el)return null;if(message!==undefined)el.textContent=message;enhance(el,state);return el;}
function scan(root=document){root.querySelectorAll?.('[role="status"],[data-admin-workspace-status]').forEach(el=>enhance(el));}
function init(){scan();const observer=new MutationObserver(records=>{for(const r of records){const el=r.target.nodeType===1?r.target:r.target.parentElement;const status=el?.closest?.('[role="status"],[data-admin-workspace-status]');if(status)enhance(status);}});observer.observe(document.body,{subtree:true,childList:true,characterData:true});}
window.DDAdminWorkspaceState={classify,set,scan};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
