// Build 640 — explicit bounded stock exception pages and browser-only draft planning.
// No automatic scan, storage, inventory update, order, supplier or provider action.
(() => {
  'use strict';
  const $=id=>document.getElementById(id),root=$('dd640ExceptionPanel'),scan=$('dd640Scan'),next=$('dd640Next'),
    status=$('dd640Status'),rows=$('dd640Rows'),scanScope=$('dd640Scope'),draft=$('dd640Draft'),
    draftStatus=$('dd640DraftStatus'),preview=$('dd640Preview'),previewButton=$('dd640Prepare'),
    copy=$('dd640Copy'),reset=$('dd640Reset');
  if(!root||!window.DDAuth)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const priority={source_hold:0,overcommitted:1,unavailable:2,low:3};
  let found=new Map(),plans=new Map(),busy=false,nextCursor=null,totalScanned=0,scanComplete=false,verified=false;
  const say=(node,text,tone='')=>{if(node){node.textContent=text;node.dataset.tone=tone;}};
  function sync(){scan.disabled=busy;next.disabled=busy||!verified||nextCursor===null;previewButton.disabled=busy||!plans.size;
    copy.disabled=busy||!preview?.value?.trim();reset.disabled=busy||!plans.size;}
  function display(){
    const list=[...found.values()].sort((a,b)=>(priority[a.kind]??99)-(priority[b.kind]??99)||b.product_id-a.product_id);
    rows.innerHTML=list.length?`<div class="dd640-scroll"><table><thead><tr><th>Priority</th><th>Product</th><th>Saved / Orders / Remaining</th><th>Review target</th><th>Actions</th></tr></thead><tbody>${list.map(p=>
      `<tr><td><strong>${esc(p.kind.replaceAll('_',' '))}</strong></td><td>${esc(p.name)} (#${p.product_id})<div class="small">${esc(p.sku||'No SKU')} · ${esc(p.status)}</div></td>`+
      `<td>${p.saved_on_hand==null?'unverified':p.saved_on_hand} / ${p.qualifying_order_committed} / ${p.remaining_after_orders==null?'unverified':p.remaining_after_orders}</td>`+
      `<td>${p.suggested_units_to_review==null?'HOLD: verify source':`${p.suggested_units_to_review} extra unit(s) to reach 3 remaining, before independent checks`}</td>`+
      `<td><div class="dd640-actions"><a class="btn" href="/admin/product-editor/?product_id=${p.product_id}">Open Product</a>${p.kind==='source_hold'?'':`<button type="button" class="btn" data-dd640-plan-id="${p.product_id}">${plans.has(p.product_id)?'In draft':'Add to draft'}</button>`}</div></td></tr>`).join('')}</tbody></table></div>`:
      '<p class="small">No stock exceptions on the Products scanned so far. That does not prove the whole catalog is clear.</p>';
    rows.querySelectorAll('[data-dd640-plan-id]').forEach(button=>button.addEventListener('click',()=>{
      const id=Number(button.dataset.dd640PlanId),product=found.get(id);if(!product||busy)return;
      if(plans.has(id))plans.delete(id);else plans.set(id,{...product,units:product.suggested_units_to_review||1,method:'make',note:''});
      invalidateDraft();display();renderDraft();
    }));
    say(scanScope,`${totalScanned} Product(s) scanned in explicit pages; ${found.size} exception(s) in this partial inbox. ${scanComplete?'All eligible Products in this scan have been visited.':'More eligible Product pages may remain; an unscanned Product could be more urgent.'}`);
  }
  function invalidateDraft(){if(preview)preview.value='';say(draftStatus,'Draft was changed. Prepare and review the complete text again before copying. Not saved.','warn');sync();}
  function renderDraft(){
    draft.innerHTML=plans.size?[...plans.values()].map(p=>`<div class="dd640-plan" data-plan-row="${p.product_id}"><strong>${esc(p.name)} (#${p.product_id})</strong>
      <p class="small">Saved ${p.saved_on_hand}, qualifying committed ${p.qualifying_order_committed}; suggested ${p.suggested_units_to_review} extra units as an unapproved planning prompt.</p>
      <div class="dd640-plan-fields"><label>Planned finished units (1–100000)<input class="input" type="number" min="1" max="100000" step="1" inputmode="numeric" data-dd640-units="${p.product_id}" value="${p.units}"></label>
      <label>Possible source<select class="input" data-dd640-method="${p.product_id}"><option value="make"${p.method==='make'?' selected':''}>Make in workshop</option><option value="buy"${p.method==='buy'?' selected':''}>Review supplier purchase</option><option value="review"${p.method==='review'?' selected':''}>Investigate source first</option></select></label>
      <label class="dd640-note">Factual planning note (8–240 characters)<input class="input" type="text" maxlength="240" data-dd640-note="${p.product_id}" value="${esc(p.note)}" placeholder="e.g. Check bench pieces and current orders"></label></div></div>`).join(''):
      '<p class="small">Select Add to draft on an exception. This worksheet is temporary and never updates inventory.</p>';
    for(const field of ['units','method','note'])draft.querySelectorAll(`[data-dd640-${field}]`).forEach(node=>node.addEventListener('input',()=>{
      const p=plans.get(Number(node.dataset[`dd640${field[0].toUpperCase()+field.slice(1)}`]));if(!p)return;
      p[field]=field==='units'?String(node.value):String(node.value);invalidateDraft();
    }));
    sync();
  }
  async function load(resetFirst){
    if(busy)return;
    if(resetFirst){found.clear();plans.clear();totalScanned=0;nextCursor=null;scanComplete=false;verified=false;invalidateDraft();renderDraft();}
    const before=nextCursor;
    if(!resetFirst&&(before===null||!verified))return;
    busy=true;say(status,`Reading one ${resetFirst?'first':'next'} bounded Product page and qualifying commitments…`);sync();
    try{
      const url='/api/admin/product-stock-exceptions'+(resetFirst?'':`?cursor=${encodeURIComponent(before)}`);
      const response=await window.DDAuth.apiFetch(url,{method:'GET',cache:'no-store'});
      const data=await response.json().catch(()=>null);
      if(!response.ok||data?.ok!==true)throw Error(data?.error||`Scan failed (${response.status}).`);
      if(data.read_only!==true||data.automatic!==false||!Array.isArray(data.exceptions)||!Number.isSafeInteger(data.scanned_count)||
        data.scanned_count<0||data.scanned_count>20||data.page_size!==20||typeof data.has_more!=='boolean'||
        (data.has_more&&data.scanned_count===0)||
        (data.has_more&&(!Number.isSafeInteger(data.next_cursor)||data.next_cursor<=0||(!resetFirst&&data.next_cursor>=before))))
        throw Error('Scan evidence was incomplete or the cursor did not advance.');
      for(const item of data.exceptions){
        if(!Number.isSafeInteger(item.product_id)||item.product_id<=0||(!resetFirst&&item.product_id>=before)||!Object.hasOwn(priority,item.kind)||
          !Number.isSafeInteger(item.qualifying_order_committed)||item.qualifying_order_committed<0||
          (item.saved_on_hand!==null&&(!Number.isSafeInteger(item.saved_on_hand)||item.saved_on_hand<0))||
          (item.remaining_after_orders!==null&&!Number.isSafeInteger(item.remaining_after_orders))||
          (item.kind!=='source_hold'&&(!Number.isSafeInteger(item.suggested_units_to_review)||item.suggested_units_to_review<0)))
          throw Error('Unverified Product exception encountered.');
        found.set(item.product_id,item);
      }
      totalScanned+=data.scanned_count;nextCursor=data.has_more?data.next_cursor:null;scanComplete=!data.has_more;verified=true;
      display();say(status,`Verified this page: ${data.scanned_count} Products scanned; ${data.exceptions.length} exception(s). ${data.has_more?'Choose Scan next 20 to continue.':'No more eligible Products in this scan.'}`,'ok');
    }catch(error){found.clear();plans.clear();totalScanned=0;nextCursor=null;scanComplete=false;verified=false;
      rows.textContent='';if(scanScope)scanScope.textContent='No current verified inbox. Refresh the source before planning.';
      invalidateDraft();renderDraft();say(status,`HOLD — ${error.message||'Scan authority unavailable.'} No automatic retry or guessed restock quantities.`, 'error');
    }finally{busy=false;sync();}
  }
  function prepare(){
    if(busy||!plans.size||!verified)return;
    const entries=[...plans.values()],lines=['DEVIL N DOVE — UNSAVED OWNER RESTOCK PLAN (BUILD 640)',
      `Explicitly scanned ${totalScanned} tracked physical Products. ${scanComplete?'No additional eligible pages remain.':'Other pages may have unreviewed exceptions.'}`,
      'This is NOT a purchase order, stock update, shipment, manufacturing authorization or external channel sync.',
      'Qualifying commitments exclude historical pre-cutover orders and separate offsite holds. Physically verify before action.',''];
    for(const p of entries){const units=Number(p.units),note=String(p.note||'').trim();
      if(!Number.isSafeInteger(units)||units<1||units>100000||note.length<8||note.length>240||!['make','buy','review'].includes(p.method)){
        say(draftStatus,`Fix ${p.name}: enter 1–100000 whole planned units, choose a source and give a factual 8–240 character note. Nothing was copied.`, 'error');
        preview.value='';sync();return;
      }
      lines.push(`Product #${p.product_id} ${p.name} (${p.sku||'no SKU'})`,
        `  saved=${p.saved_on_hand}, post-cutover committed=${p.qualifying_order_committed}, remaining=${p.remaining_after_orders}, planning prompt=${p.suggested_units_to_review}`,
        `  owner draft: ${units} unit(s), source=${p.method}, note=${note}`,'');
    }
    lines.push('NEXT: Recheck live Product, actual physical count, orders and source. Apply only through a separately approved stock correction.');
    preview.value=lines.join('\n');say(draftStatus,'Draft text ready for review or copying. It remains unsaved in this browser session.','ok');sync();
  }
  scan?.addEventListener('click',()=>void load(true));next?.addEventListener('click',()=>void load(false));
  previewButton?.addEventListener('click',prepare);
  copy?.addEventListener('click',async()=>{
    if(busy||!preview.value.trim())return;
    try{if(!window.navigator?.clipboard?.writeText)throw Error('Clipboard unavailable');await window.navigator.clipboard.writeText(preview.value);
      say(draftStatus,'Copied reviewed draft text. No Product or purchase records were saved.','ok');
    }catch{say(draftStatus,'Clipboard permission was unavailable. Select and copy the prepared text manually; nothing was saved.','warn');preview.focus();preview.select?.();}
  });
  reset?.addEventListener('click',()=>{plans.clear();invalidateDraft();renderDraft();display();});
  renderDraft();sync();
})();
