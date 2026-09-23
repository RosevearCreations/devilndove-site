// Release 467 Build 237 — Mobile, Touch, Keyboard & Dense-Workspace Ergonomics
(() => {
 'use strict';
 if (!location.pathname.startsWith('/admin/')) return;
 const mq=window.matchMedia('(max-width: 720px)');
 const stickySelectors=['.dd-editor-footer','.packaging-save-actions','[data-sticky-actions="1"]'];
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
 function apply(){stickySelectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>el.classList.add('dd-v237-sticky-actions')));document.querySelectorAll('.admin-shell table').forEach(labelTable);document.documentElement.dataset.ddBuild237Ergonomics='ready';}
 function onKey(event){if(event.key!=='Escape')return;const active=document.activeElement;if(active?.matches?.('input,textarea,select'))active.blur();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
 new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('keydown',onKey);
 window.DDAdminErgonomicsV237=Object.freeze({version:'467.237',refresh:apply});
 document.dispatchEvent(new CustomEvent('dd:admin-ergonomics-ready',{detail:{release:467,build:237}}));
})();