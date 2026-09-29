// Release 467 Build 237 — Mobile, Touch, Keyboard & Dense-Workspace Ergonomics
// Build 292 — observer scope and long-session churn hardening.
(() => {
 'use strict';
 if (!location.pathname.startsWith('/admin/')) return;
 const mq=window.matchMedia('(max-width: 720px)');
 const stickySelectors=['.dd-editor-footer','.packaging-save-actions','[data-sticky-actions="1"]'];
 let observer=null;
 let scheduled=false;
 const pendingRoots=new Set();

 function labelTable(table){
  if(!(table instanceof HTMLTableElement)||table.dataset.ddV237Ready==='1')return;
  const headers=[...table.querySelectorAll('thead th')].map(th=>String(th.textContent||'').trim());
  if(!headers.length||headers.length>8)return;
  table.dataset.ddV237Ready='1';table.classList.add('dd-v237-dense-table');
  [...table.tBodies].flatMap(tb=>[...tb.rows]).forEach(row=>[...row.cells].forEach((cell,index)=>cell.dataset.ddColumn=headers[index]||''));
  const tools=document.createElement('div');tools.className='dd-v237-table-tools';
  const button=document.createElement('button');button.type='button';button.className='btn secondary dd-v237-table-toggle';button.textContent='Card view';button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>{const on=!table.classList.contains('dd-v237-card-mode');table.classList.toggle('dd-v237-card-mode',on);button.setAttribute('aria-pressed',String(on));button.textContent=on?'Table view':'Card view';});
  tools.appendChild(button);table.parentNode?.insertBefore(tools,table);
  if(mq.matches)table.classList.add('dd-v237-card-mode');
  button.setAttribute('aria-pressed',String(table.classList.contains('dd-v237-card-mode')));button.textContent=table.classList.contains('dd-v237-card-mode')?'Table view':'Card view';
 }

 function applyRoot(root=document){
  if(root?.nodeType===1){
   for(const sel of stickySelectors) if(root.matches?.(sel)) root.classList.add('dd-v237-sticky-actions');
   if(root.matches?.('.admin-shell table')) labelTable(root);
  }
  for(const sel of stickySelectors) root.querySelectorAll?.(sel).forEach(el=>el.classList.add('dd-v237-sticky-actions'));
  root.querySelectorAll?.('.admin-shell table').forEach(labelTable);
  document.documentElement.dataset.ddBuild237Ergonomics='ready';
 }

 function flush(){
  scheduled=false;
  const roots=[...pendingRoots].filter(node=>node?.isConnected);
  pendingRoots.clear();
  const rootSet=new Set(roots);
  for(const root of roots){
   let nested=false;
   for(let parent=root.parentElement;parent;parent=parent.parentElement){if(rootSet.has(parent)){nested=true;break;}}
   if(!nested) applyRoot(root);
  }
 }

 function schedule(root){
  if(!(root instanceof Element))return;
  const relevant=stickySelectors.some(sel=>root.matches?.(sel)||root.querySelector?.(sel))||root.matches?.('table,.admin-shell')||root.querySelector?.('.admin-shell table');
  if(!relevant)return;
  pendingRoots.add(root);
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(flush);
 }

 function onKey(event){if(event.key!=='Escape')return;const active=document.activeElement;if(active?.matches?.('input,textarea,select'))active.blur();}
 function onViewport(){document.querySelectorAll('.admin-shell table[data-dd-v237-ready="1"]').forEach(table=>{if(mq.matches)table.classList.add('dd-v237-card-mode');});}

 function start(){
  applyRoot(document);
  observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[])if(node?.nodeType===1)schedule(node);});
  observer.observe(document.body||document.documentElement,{childList:true,subtree:true});
  document.addEventListener('keydown',onKey);
  mq.addEventListener?.('change',onViewport);
  window.addEventListener('pagehide',()=>{
   observer?.disconnect();observer=null;pendingRoots.clear();scheduled=false;
   document.removeEventListener('keydown',onKey);
   mq.removeEventListener?.('change',onViewport);
  },{once:true});
 }

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.DDAdminErgonomicsV237=Object.freeze({version:'467.292',refresh:()=>applyRoot(document)});
 document.dispatchEvent(new CustomEvent('dd:admin-ergonomics-ready',{detail:{release:467,build:292}}));
})();
