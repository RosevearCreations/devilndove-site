// Release 467 Build 100 — browser-local Product Work Session & Progress.
// Read-only planner over the already-rendered Product table/readiness state.
(() => {
  const SESSION_KEY = 'dd_catalog_work_session_v1';
  const SNAPSHOT_KEY = 'dd_admin_products_snapshot_v2';
  const MAX_ITEMS = 60;
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();

  ready(() => {
    if (document.body?.dataset?.adminPage !== 'products') return;
    const tableBody = document.getElementById('productsTableBody');
    const tableWrap = document.querySelector('.products-admin-table-wrap');
    if (!tableBody || !tableWrap) return;
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    let snapshotProducts = [];
    let renderTimer = 0;

    function readSnapshot() {
      try {
        const value = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
        snapshotProducts = value && Array.isArray(value.products) ? value.products : [];
      } catch { snapshotProducts = []; }
    }
    function loadSession() {
      try {
        const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        const items = Array.isArray(value?.items) ? value.items : [];
        return {items:items.map((item)=>({product_id:Number(item?.product_id||0)||0,added_at:String(item?.added_at||''),completed_at:item?.completed_at?String(item.completed_at):null})).filter((item)=>item.product_id>0).slice(0,MAX_ITEMS)};
      } catch { return {items:[]}; }
    }
    let session = loadSession();
    const saveSession = () => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {} };
    const productIdForRow = (row) => Number(row?.querySelector?.('[data-edit-product-id]')?.dataset?.editProductId || 0) || 0;
    const rowForProduct = (id) => Array.from(tableBody.querySelectorAll('tr')).find((row)=>productIdForRow(row)===Number(id)) || null;
    const sessionItem = (id) => session.items.find((item)=>item.product_id===Number(id)) || null;
    const productForId = (id) => snapshotProducts.find((product)=>Number(product?.product_id||0)===Number(id)) || null;
    const isVisibleRow = (row) => {
      if (!row || row.hidden || row.style.display === 'none') return false;
      try { return getComputedStyle(row).display !== 'none'; } catch { return true; }
    };
    function rowMeta(row,id) {
      const product = productForId(id) || {};
      const cells = row ? Array.from(row.querySelectorAll('td')) : [];
      return {number:product?.product_number || String(cells[0]?.textContent||'').trim().replace(/^DD/i,'') || id,name:product?.name || String(cells[1]?.textContent||'').trim() || `Product #${id}`};
    }
    function readinessForRow(row) {
      const node = row?.querySelector?.('.product-readiness-inline');
      if (!node || node.classList.contains('is-unknown')) return {known:false,ready:false,blocked:false,score:null,blocker:''};
      const strong = String(node.querySelector('strong')?.textContent||'').trim();
      const score = strong.match(/(\d+(?:\.\d+)?)\s*%/);
      const blockerText = String(node.querySelector('span')?.textContent||'').trim();
      const split = blockerText.indexOf(':');
      return {known:/^(ready|blocked)\b/i.test(strong),ready:/^ready\b/i.test(strong),blocked:/^blocked\b/i.test(strong),score:score?Number(score[1]):null,blocker:split>=0?blockerText.slice(0,split).trim():blockerText};
    }
    function addProduct(id) {
      id = Number(id)||0;
      if (!id || sessionItem(id) || session.items.length >= MAX_ITEMS) return false;
      session.items.push({product_id:id,added_at:new Date().toISOString(),completed_at:null}); saveSession(); return true;
    }
    function removeProduct(id) { session.items=session.items.filter((item)=>item.product_id!==Number(id)); saveSession(); }
    function setDone(id,done) { const item=sessionItem(id); if(!item)return; item.completed_at=done?new Date().toISOString():null; saveSession(); }
    function setMessage(text,tone='') { const el=document.getElementById('catalogWorkSessionMessage'); if(el){el.textContent=String(text||'');el.dataset.tone=tone;} }
    function locateProduct(id) {
      const row=rowForProduct(id);
      if(!row){setMessage('That Product is not currently rendered. Refresh Products before locating it.','review');return false;}
      if(!isVisibleRow(row)){setMessage('That Product is hidden by the current Product view. Apply a matching saved view or clear filters explicitly, then try again.','review');return false;}
      row.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'}); row.classList.add('dd-work-session-locate'); setTimeout(()=>row.classList.remove('dd-work-session-locate'),1800); return true;
    }
    function openBlocker(id) {
      const row=rowForProduct(id);
      if(!row){setMessage('That Product is not currently rendered. Refresh Products before opening its blocker.','review');return false;}
      const existing = row.querySelector('[data-open-first-blocker]');
      if(!existing){setMessage('No existing first-blocker action is available for this Product.','review');return false;}
      existing.click(); return true;
    }
    const incompleteItems = () => session.items.filter((item)=>!item.completed_at);
    function nextIncomplete() { return incompleteItems()[0] || null; }
    function nextBlocked() { return incompleteItems().find((item)=>readinessForRow(rowForProduct(item.product_id)).blocked) || null; }
    function addVisibleProducts() {
      let added=0;
      tableBody.querySelectorAll('tr').forEach((row)=>{if(isVisibleRow(row)&&addProduct(productIdForRow(row)))added+=1;});
      render(); setMessage(added?`Added ${added} visible Product${added===1?'':'s'} to this browser's work session.`:'No new visible Products were added.',added?'green':'review');
    }
    function ensureStyle() {
      if(document.getElementById('catalogWorkSessionStyle'))return;
      const style=document.createElement('style');style.id='catalogWorkSessionStyle';style.textContent='.dd-work-session-card{margin:14px 0;padding:16px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.03)}.dd-work-session-head,.dd-work-session-actions{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.dd-work-session-actions{justify-content:flex-start;margin-top:10px}.dd-work-session-progress{font-weight:800}.dd-work-session-list{display:grid;gap:8px;margin-top:12px}.dd-work-session-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:12px}.dd-work-session-item.is-done{opacity:.65}.dd-work-session-item-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dd-work-session-toggle{margin-left:6px}.dd-work-session-locate{outline:3px solid currentColor;outline-offset:-3px}@media(max-width:720px){.dd-work-session-item{grid-template-columns:1fr}.dd-work-session-item-actions{justify-content:flex-start}.dd-work-session-actions .btn{flex:1 1 160px}}';document.head.appendChild(style);
    }
    function ensurePanel() {
      let panel=document.getElementById('catalogWorkSession');
      if(!panel){panel=document.createElement('section');panel.id='catalogWorkSession';panel.className='dd-work-session-card';panel.setAttribute('aria-label','Product work session');tableWrap.parentNode?.insertBefore(panel,tableWrap);} return panel;
    }
    function syncRowButtons() {
      tableBody.querySelectorAll('tr').forEach((row)=>{
        const id=productIdForRow(row);if(!id)return;const cell=row.querySelector('td:last-child');if(!cell)return;
        let button=cell.querySelector('[data-work-session-toggle]');
        if(!button){button=document.createElement('button');button.type='button';button.className='btn small dd-work-session-toggle';button.dataset.workSessionToggle=String(id);cell.appendChild(button);}
        const item=sessionItem(id), label=item?'Remove from work':'Add to work', pressed=item?'true':'false';
        if(button.textContent!==label)button.textContent=label;
        if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
      });
    }
    function render() {
      readSnapshot();ensureStyle();const panel=ensurePanel();const total=session.items.length,complete=session.items.filter((item)=>item.completed_at).length,active=total-complete,next=nextIncomplete(),blocked=nextBlocked();
      const rows=session.items.slice(0,20).map((item)=>{const row=rowForProduct(item.product_id),meta=rowMeta(row,item.product_id),readiness=readinessForRow(row);const state=readiness.known?`${readiness.ready?'Ready':readiness.blocked?'Blocked':'Readiness'}${Number.isFinite(readiness.score)?` ${readiness.score}%`:''}${readiness.blocker?` · ${readiness.blocker}`:''}`:'Readiness unavailable';return `<article class="dd-work-session-item ${item.completed_at?'is-done':''}"><div><strong>DD${esc(meta.number)} — ${esc(meta.name)}</strong><div class="small">${esc(state)}${item.completed_at?' · completed in this browser':''}</div></div><div class="dd-work-session-item-actions"><button class="btn" type="button" data-work-session-action="locate" data-product-id="${item.product_id}">Locate</button><button class="btn" type="button" data-work-session-action="blocker" data-product-id="${item.product_id}" ${readiness.blocked?'':'disabled'}>Open blocker</button><button class="btn" type="button" data-work-session-action="done" data-product-id="${item.product_id}">${item.completed_at?'Undo done':'Mark done'}</button><button class="btn" type="button" data-work-session-action="remove" data-product-id="${item.product_id}">Remove</button></div></article>`;}).join('');
      panel.innerHTML=`<div class="dd-work-session-head"><div><p class="eyebrow">Build 100 · browser-local planning</p><h3 style="margin:0">Product work session</h3><p class="small">Pin Products, track browser-local completion, and jump to an existing readiness blocker. No Product record is changed.</p></div><div class="dd-work-session-progress">${complete}/${total} done · ${active} active</div></div><div class="dd-work-session-actions"><button class="btn" type="button" data-work-session-command="add-visible">Add visible Products</button><button class="btn" type="button" data-work-session-command="next" ${next?'':'disabled'}>Locate next Product</button><button class="btn" type="button" data-work-session-command="next-blocker" ${blocked?'':'disabled'}>Open next blocker</button><button class="btn" type="button" data-work-session-command="clear-completed" ${complete?'':'disabled'}>Clear completed</button><button class="btn" type="button" data-work-session-command="clear" ${total?'':'disabled'}>Clear session</button></div><div id="catalogWorkSessionMessage" class="small" role="status" aria-live="polite"></div><div class="dd-work-session-list">${rows||'<p class="small">No Products are pinned yet. Use Add to work on a Product row or add the currently visible Products.</p>'}${total>20?`<p class="small">Showing the first 20 of ${total} pinned Products.</p>`:''}</div>`;
      syncRowButtons();
    }

    tableBody.addEventListener('click',(event)=>{const toggle=event.target.closest('[data-work-session-toggle]');if(!toggle)return;event.preventDefault();const id=Number(toggle.dataset.workSessionToggle||0)||0;if(sessionItem(id))removeProduct(id);else addProduct(id);render();});
    document.addEventListener('click',(event)=>{
      const command=event.target.closest('[data-work-session-command]');
      if(command){const action=command.dataset.workSessionCommand;if(action==='add-visible')addVisibleProducts();if(action==='next'){const item=nextIncomplete();if(item)locateProduct(item.product_id);}if(action==='next-blocker'){const item=nextBlocked();if(item)openBlocker(item.product_id);}if(action==='clear-completed'){session.items=session.items.filter((item)=>!item.completed_at);saveSession();render();}if(action==='clear'){session={items:[]};saveSession();render();}return;}
      const button=event.target.closest('[data-work-session-action]');if(!button)return;const id=Number(button.dataset.productId||0)||0;const action=button.dataset.workSessionAction;if(action==='locate')locateProduct(id);if(action==='blocker')openBlocker(id);if(action==='done'){const item=sessionItem(id);if(item)setDone(id,!item.completed_at);render();}if(action==='remove'){removeProduct(id);render();}
    });
    const observer=new MutationObserver(()=>{clearTimeout(renderTimer);renderTimer=setTimeout(render,80);});
    observer.observe(tableBody,{childList:true,subtree:true,characterData:true});
    window.addEventListener('storage',(event)=>{if(event.key!==SESSION_KEY)return;session=loadSession();render();});
    render();
  });
})();
