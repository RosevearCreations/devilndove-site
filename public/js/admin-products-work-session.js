// Release 467 Build 103 — browser-local Product Work Session Paging & Full Coverage.
// Read-only planner over the already-rendered Product table/readiness state.
(() => {
  const SESSION_KEY = 'dd_catalog_work_session_v1';
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const MAX_ITEMS = 60;
  const PAGE_SIZE = 20;
  const PRIORITIES = ['urgent','high','normal','low'];
  const SORT_MODES = ['priority','blockers','readiness','recent','manual'];
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();

  ready(() => {
    if (document.body?.dataset?.adminPage !== 'products') return;
    const tableBody = document.getElementById('productsTableBody');
    const tableWrap = document.querySelector('.products-admin-table-wrap');
    if (!tableBody || !tableWrap) return;
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    let snapshotProducts = [];
    let renderTimer = 0;
    let sessionPage = 0;

    function readSnapshot() {
      try { const value = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null'); snapshotProducts = value && Array.isArray(value.products) ? value.products : []; }
      catch { snapshotProducts = []; }
    }
    function loadSession() {
      try {
        const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        const items = Array.isArray(value?.items) ? value.items : [];
        const sortMode = SORT_MODES.includes(String(value?.sort_mode || '')) ? String(value.sort_mode) : 'priority';
        return {sort_mode:sortMode,items:items.map((item)=>({product_id:Number(item?.product_id||0)||0,added_at:String(item?.added_at||''),completed_at:item?.completed_at?String(item.completed_at):null,priority:PRIORITIES.includes(String(item?.priority||''))?String(item.priority):'normal'})).filter((item)=>item.product_id>0).slice(0,MAX_ITEMS)};
      } catch { return {sort_mode:'priority',items:[]}; }
    }
    let session = loadSession();
    const saveSession = () => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {} };
    const productIdForRow = (row) => Number(row?.querySelector?.('[data-edit-product-id]')?.dataset?.editProductId || 0) || 0;
    const rowForProduct = (id) => Array.from(tableBody.querySelectorAll('tr')).find((row)=>productIdForRow(row)===Number(id)) || null;
    const sessionItem = (id) => session.items.find((item)=>item.product_id===Number(id)) || null;
    const productForId = (id) => snapshotProducts.find((product)=>Number(product?.product_id||0)===Number(id)) || null;
    const priorityRank = (value) => ({urgent:0,high:1,normal:2,low:3}[value] ?? 2);
    const isVisibleRow = (row) => { if (!row || row.hidden || row.style.display === 'none') return false; try { return getComputedStyle(row).display !== 'none'; } catch { return true; } };
    const pageCountFor = (total) => Math.max(1, Math.ceil(Math.max(0,Number(total)||0) / PAGE_SIZE));
    const clampPage = (total) => { sessionPage = Math.max(0, Math.min(sessionPage, pageCountFor(total)-1)); return sessionPage; };
    function rowMeta(row,id) {
      const product = productForId(id) || {}, cells = row ? Array.from(row.querySelectorAll('td')) : [];
      return {number:product?.product_number || String(cells[0]?.textContent||'').trim().replace(/^DD/i,'') || id,name:product?.name || String(cells[1]?.textContent||'').trim() || `Product #${id}`};
    }
    function readinessForRow(row) {
      const node = row?.querySelector?.('.product-readiness-inline');
      if (!node || node.classList.contains('is-unknown')) return {known:false,ready:false,blocked:false,score:null,blocker:''};
      const strong = String(node.querySelector('strong')?.textContent||'').trim(), score = strong.match(/(\d+(?:\.\d+)?)\s*%/), blockerText = String(node.querySelector('span')?.textContent||'').trim(), split = blockerText.indexOf(':');
      return {known:/^(ready|blocked)\b/i.test(strong),ready:/^ready\b/i.test(strong),blocked:/^blocked\b/i.test(strong),score:score?Number(score[1]):null,blocker:split>=0?blockerText.slice(0,split).trim():blockerText};
    }
    function addProduct(id) {
      id = Number(id)||0; if (!id || sessionItem(id) || session.items.length >= MAX_ITEMS) return false;
      session.items.push({product_id:id,added_at:new Date().toISOString(),completed_at:null,priority:'normal'}); saveSession(); return true;
    }
    function removeProduct(id) { session.items=session.items.filter((item)=>item.product_id!==Number(id)); saveSession(); }
    function setDone(id,done) { const item=sessionItem(id); if(!item)return; item.completed_at=done?new Date().toISOString():null; saveSession(); }
    function setPriority(id,priority) { const item=sessionItem(id); if(!item||!PRIORITIES.includes(priority))return; item.priority=priority; saveSession(); }
    function setSortMode(mode) { if(!SORT_MODES.includes(mode))return; session.sort_mode=mode; sessionPage=0; saveSession(); }
    function moveItem(id, delta) {
      if (session.sort_mode !== 'manual') return -1;
      const index = session.items.findIndex((item)=>item.product_id===Number(id));
      const target = index + Number(delta||0);
      if (index < 0 || target < 0 || target >= session.items.length || target === index) return -1;
      const [item] = session.items.splice(index,1);
      session.items.splice(target,0,item);
      saveSession();
      return target;
    }
    function setMessage(text,tone='') { const el=document.getElementById('catalogWorkSessionMessage'); if(el){el.textContent=String(text||'');el.dataset.tone=tone;} }
    function locateProduct(id) {
      const row=rowForProduct(id); if(!row){setMessage('That Product is not currently rendered. Refresh Products before locating it.','review');return false;}
      if(!isVisibleRow(row)){setMessage('That Product is hidden by the current Product view. Apply a matching saved view or clear filters explicitly, then try again.','review');return false;}
      row.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}); row.classList.add('dd-work-session-locate'); setTimeout(()=>row.classList.remove('dd-work-session-locate'),1800); return true;
    }
    function openBlocker(id) {
      const row=rowForProduct(id); if(!row){setMessage('That Product is not currently rendered. Refresh Products before opening its blocker.','review');return false;}
      const existing=row.querySelector('[data-open-first-blocker]'); if(!existing){setMessage('No existing first-blocker action is available for this Product.','review');return false;} existing.click(); return true;
    }
    function orderedItems() {
      const items=[...session.items]; if(session.sort_mode==='manual') return items;
      const enriched=items.map((item,index)=>({item,index,readiness:readinessForRow(rowForProduct(item.product_id))}));
      enriched.sort((a,b)=>{
        if(Boolean(a.item.completed_at)!==Boolean(b.item.completed_at)) return a.item.completed_at?1:-1;
        if(session.sort_mode==='priority') return priorityRank(a.item.priority)-priorityRank(b.item.priority) || a.index-b.index;
        if(session.sort_mode==='blockers') return Number(b.readiness.blocked)-Number(a.readiness.blocked) || priorityRank(a.item.priority)-priorityRank(b.item.priority) || a.index-b.index;
        if(session.sort_mode==='readiness') return (Number.isFinite(a.readiness.score)?a.readiness.score:101)-(Number.isFinite(b.readiness.score)?b.readiness.score:101) || priorityRank(a.item.priority)-priorityRank(b.item.priority) || a.index-b.index;
        if(session.sort_mode==='recent') return String(b.item.added_at||'').localeCompare(String(a.item.added_at||'')) || a.index-b.index;
        return a.index-b.index;
      });
      return enriched.map((row)=>row.item);
    }
    const incompleteItems = () => orderedItems().filter((item)=>!item.completed_at);
    const nextIncomplete = () => incompleteItems()[0] || null;
    const nextBlocked = () => incompleteItems().find((item)=>readinessForRow(rowForProduct(item.product_id)).blocked) || null;
    function addVisibleProducts() { let added=0; tableBody.querySelectorAll('tr').forEach((row)=>{if(isVisibleRow(row)&&addProduct(productIdForRow(row)))added+=1;}); render(); setMessage(added?`Added ${added} visible Product${added===1?'':'s'} to this browser's work session.`:'No new visible Products were added.',added?'green':'review'); }
    function ensureStyle() {
      if(document.getElementById('catalogWorkSessionStyle'))return; const style=document.createElement('style'); style.id='catalogWorkSessionStyle';
      style.textContent='.dd-work-session-card{margin:14px 0;padding:16px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.03)}.dd-work-session-head,.dd-work-session-actions,.dd-work-session-pager{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.dd-work-session-actions{justify-content:flex-start;margin-top:10px}.dd-work-session-pager{margin-top:10px;padding:8px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}.dd-work-session-progress{font-weight:800}.dd-work-session-page-summary{font-weight:700}.dd-work-session-list{display:grid;gap:8px;margin-top:12px}.dd-work-session-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:12px}.dd-work-session-item.is-done{opacity:.65}.dd-work-session-item-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dd-work-session-toggle{margin-left:6px}.dd-work-session-locate{outline:3px solid currentColor;outline-offset:-3px}.dd-work-session-priority,.dd-work-session-sort{min-height:36px;border-radius:8px;padding:4px 8px;background:var(--panel);color:inherit;border:1px solid var(--border)}.dd-work-session-reorder{display:inline-flex;gap:4px}.dd-work-session-reorder .btn[disabled],.dd-work-session-pager .btn[disabled]{opacity:.45}@media(max-width:720px){.dd-work-session-item{grid-template-columns:1fr}.dd-work-session-item-actions{justify-content:flex-start}.dd-work-session-actions .btn,.dd-work-session-pager .btn{flex:1 1 140px}}'; document.head.appendChild(style);
    }
    function ensurePanel() { let panel=document.getElementById('catalogWorkSession'); if(!panel){panel=document.createElement('section');panel.id='catalogWorkSession';panel.className='dd-work-session-card';panel.setAttribute('aria-label','Product work session');tableWrap.parentNode?.insertBefore(panel,tableWrap);} return panel; }
    function syncRowButtons() { tableBody.querySelectorAll('tr').forEach((row)=>{const id=productIdForRow(row);if(!id)return;const cell=row.querySelector('td:last-child');if(!cell)return;let button=cell.querySelector('[data-work-session-toggle]');if(!button){button=document.createElement('button');button.type='button';button.className='btn small dd-work-session-toggle';button.dataset.workSessionToggle=String(id);cell.appendChild(button);}const item=sessionItem(id),label=item?'Remove from work':'Add to work',pressed=item?'true':'false';if(button.textContent!==label)button.textContent=label;if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);}); }
    function render() {
      readSnapshot(); ensureStyle(); const panel=ensurePanel(), ordered=orderedItems(), total=session.items.length, complete=session.items.filter((item)=>item.completed_at).length, active=total-complete, next=nextIncomplete(), blocked=nextBlocked(), manual=session.sort_mode==='manual';
      clampPage(total); const pageCount=pageCountFor(total), pageStart=sessionPage*PAGE_SIZE, pageEnd=Math.min(total,pageStart+PAGE_SIZE), pageItems=ordered.slice(pageStart,pageEnd);
      const rows=pageItems.map((item)=>{const row=rowForProduct(item.product_id),meta=rowMeta(row,item.product_id),readiness=readinessForRow(row),state=readiness.known?`${readiness.ready?'Ready':readiness.blocked?'Blocked':'Readiness'}${Number.isFinite(readiness.score)?` ${readiness.score}%`:''}${readiness.blocker?` · ${readiness.blocker}`:''}`:'Readiness unavailable',storedIndex=session.items.findIndex((row)=>row.product_id===item.product_id),moveUpDisabled=!manual||storedIndex<=0,moveDownDisabled=!manual||storedIndex<0||storedIndex>=session.items.length-1;return `<article class="dd-work-session-item ${item.completed_at?'is-done':''}"><div><strong>DD${esc(meta.number)} — ${esc(meta.name)}</strong><div class="small">${esc(state)} · ${esc(item.priority)} priority${item.completed_at?' · completed in this browser':''}${manual?` · manual position ${storedIndex+1} of ${session.items.length}`:''}</div></div><div class="dd-work-session-item-actions"><span class="dd-work-session-reorder" aria-label="Manual order controls"><button class="btn" type="button" data-work-session-action="move-up" data-product-id="${item.product_id}" ${moveUpDisabled?'disabled':''} aria-label="Move ${esc(meta.name)} up in manual order">↑ Up</button><button class="btn" type="button" data-work-session-action="move-down" data-product-id="${item.product_id}" ${moveDownDisabled?'disabled':''} aria-label="Move ${esc(meta.name)} down in manual order">↓ Down</button></span><label class="small">Priority <select class="dd-work-session-priority" data-work-session-priority="${item.product_id}">${PRIORITIES.map((p)=>`<option value="${p}" ${p===item.priority?'selected':''}>${p[0].toUpperCase()+p.slice(1)}</option>`).join('')}</select></label><button class="btn" type="button" data-work-session-action="locate" data-product-id="${item.product_id}">Locate</button><button class="btn" type="button" data-work-session-action="blocker" data-product-id="${item.product_id}" ${readiness.blocked?'':'disabled'}>Open blocker</button><button class="btn" type="button" data-work-session-action="done" data-product-id="${item.product_id}">${item.completed_at?'Undo done':'Mark done'}</button><button class="btn" type="button" data-work-session-action="remove" data-product-id="${item.product_id}">Remove</button></div></article>`;}).join('');
      const pageSummary=total?`Page ${sessionPage+1} of ${pageCount} · Products ${pageStart+1}-${pageEnd} of ${total}`:'No pinned Products';
      const pager=total?`<nav class="dd-work-session-pager" aria-label="Product work session pages"><button class="btn" type="button" data-work-session-command="page-prev" ${sessionPage<=0?'disabled':''} aria-label="Previous Product work session page">← Previous 20</button><span class="dd-work-session-page-summary small" aria-live="polite">${esc(pageSummary)}</span><button class="btn" type="button" data-work-session-command="page-next" ${sessionPage>=pageCount-1?'disabled':''} aria-label="Next Product work session page">Next 20 →</button></nav>`:'';
      panel.innerHTML=`<div class="dd-work-session-head"><div><p class="eyebrow">Build 103 · browser-local planning</p><h3 style="margin:0">Product work session</h3><p class="small">Prioritize up to ${MAX_ITEMS} pinned Products and reach every item through ${PAGE_SIZE}-Product pages. Priority, blocker, readiness, recent and accessible manual ordering remain browser-local and never change a Product record.</p></div><div class="dd-work-session-progress">${complete}/${total} done · ${active} active</div></div><div class="dd-work-session-actions"><label class="small">Session order <select class="dd-work-session-sort" data-work-session-sort>${SORT_MODES.map((mode)=>`<option value="${mode}" ${mode===session.sort_mode?'selected':''}>${mode[0].toUpperCase()+mode.slice(1)}</option>`).join('')}</select></label><button class="btn" type="button" data-work-session-command="add-visible">Add visible Products</button><button class="btn" type="button" data-work-session-command="next" ${next?'':'disabled'}>Locate next Product</button><button class="btn" type="button" data-work-session-command="next-blocker" ${blocked?'':'disabled'}>Open next blocker</button><button class="btn" type="button" data-work-session-command="clear-completed" ${complete?'':'disabled'}>Clear completed</button><button class="btn" type="button" data-work-session-command="clear" ${total?'':'disabled'}>Clear session</button></div>${pager}<div id="catalogWorkSessionMessage" class="small" role="status" aria-live="polite"></div><div class="dd-work-session-list">${rows||'<p class="small">No Products are pinned yet. Use Add to work on a Product row or add the currently visible Products.</p>'}</div>`; syncRowButtons();
    }
    tableBody.addEventListener('click',(event)=>{const toggle=event.target.closest('[data-work-session-toggle]');if(!toggle)return;event.preventDefault();const id=Number(toggle.dataset.workSessionToggle||0)||0;if(sessionItem(id))removeProduct(id);else addProduct(id);render();});
    document.addEventListener('change',(event)=>{const priority=event.target.closest('[data-work-session-priority]');if(priority){setPriority(Number(priority.dataset.workSessionPriority||0),String(priority.value||''));render();return;}const sort=event.target.closest('[data-work-session-sort]');if(sort){setSortMode(String(sort.value||''));render();setMessage(sort.value==='manual'?'Manual order is active. Use Move Up/Down on any session page to change the sequence.':'Session order updated and paging returned to page 1.','green');}});
    document.addEventListener('click',(event)=>{const command=event.target.closest('[data-work-session-command]');if(command){const action=command.dataset.workSessionCommand;if(action==='add-visible')addVisibleProducts();if(action==='next'){const item=nextIncomplete();if(item)locateProduct(item.product_id);}if(action==='next-blocker'){const item=nextBlocked();if(item)openBlocker(item.product_id);}if(action==='page-prev'){sessionPage=Math.max(0,sessionPage-1);render();setMessage(`Showing Product work-session page ${sessionPage+1}.`,'green');}if(action==='page-next'){sessionPage=Math.min(pageCountFor(session.items.length)-1,sessionPage+1);render();setMessage(`Showing Product work-session page ${sessionPage+1}.`,'green');}if(action==='clear-completed'){session.items=session.items.filter((item)=>!item.completed_at);saveSession();render();}if(action==='clear'){session={sort_mode:session.sort_mode,items:[]};sessionPage=0;saveSession();render();}return;}const button=event.target.closest('[data-work-session-action]');if(!button)return;const id=Number(button.dataset.productId||0)||0,action=button.dataset.workSessionAction;if(action==='locate')locateProduct(id);if(action==='blocker')openBlocker(id);if(action==='done'){const item=sessionItem(id);if(item)setDone(id,!item.completed_at);render();}if(action==='remove'){removeProduct(id);render();}if(action==='move-up'){const target=moveItem(id,-1);if(target>=0)sessionPage=Math.floor(target/PAGE_SIZE);render();setMessage(target>=0?'Moved Product up in the browser-local manual order and kept it visible.':'Product could not be moved up. Manual order must be selected. ',target>=0?'green':'review');}if(action==='move-down'){const target=moveItem(id,1);if(target>=0)sessionPage=Math.floor(target/PAGE_SIZE);render();setMessage(target>=0?'Moved Product down in the browser-local manual order and kept it visible.':'Product could not be moved down. Manual order must be selected. ',target>=0?'green':'review');}});
    const observer=new MutationObserver(()=>{clearTimeout(renderTimer);renderTimer=setTimeout(render,80);}); observer.observe(tableBody,{childList:true,subtree:true,characterData:true});
    window.addEventListener('storage',(event)=>{if(event.key!==SESSION_KEY)return;session=loadSession();render();}); render();
  });
})();
