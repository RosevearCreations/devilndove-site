// Build 638 — on-demand admin stock history and verified physical-count corrections.
// No automatic data read or stock action; a click loads one Product's audit evidence.
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const panel=$('dd638CountPanel'),productLabel=$('dd638CountProduct'),historyStatus=$('dd638HistoryStatus'),
    historyRows=$('dd638HistoryRows'),counted=$('dd638CountedQuantity'),note=$('dd638CountNote'),
    countStatus=$('dd638CountStatus'),comparison=$('dd638CountComparison'),previewButton=$('dd638CountPreview'),
    applyButton=$('dd638CountApply'),confirmed=$('dd638CountOwnerConfirmed'),historyRefresh=$('dd638HistoryRefresh');
  if(!panel||!window.DDAuth)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let selected=null,preview=null,busy=false,blocked=false,historyLoaded=false;
  function say(el,message,tone=''){if(el){el.textContent=message;el.dataset.tone=tone;}}
  function sync(){
    if(previewButton)previewButton.disabled=busy||blocked||!historyLoaded||!selected;
    if(applyButton)applyButton.disabled=busy||blocked||!preview||!confirmed?.checked;
    for(const el of [counted,note])if(el)el.disabled=busy||blocked;
    if(historyRefresh)historyRefresh.disabled=busy||!selected;
  }
  function invalidate(message='Count or note changed. Preview actual saved stock again.'){
    preview=null;if(confirmed){confirmed.checked=false;confirmed.disabled=true;}
    if(comparison)comparison.textContent='No approved count comparison. Press Preview before confirming.';
    if(message)say(countStatus,message,'warn');sync();
  }
  function input(){const text=String(counted?.value??'').trim(),quantity=Number(text),reason=String(note?.value||'').trim();
    return {quantity,reason,valid:text!==''&&Number.isSafeInteger(quantity)&&quantity>=0&&quantity<=1000000&&reason.length>=8&&reason.length<=240};}
  async function readJson(response){const data=await response.json().catch(()=>null);if(!response.ok||data?.ok!==true)throw new Error(data?.error||`Request failed (${response.status}).`);return data;}
  function renderEvents(events,warning,truncated){
    if(!historyRows)return;
    const rows=Array.isArray(events)?events:[];
    historyRows.innerHTML=`<p class="small">${esc(warning||'Only selected audit records are shown; completeness is not verified.')}${truncated?' More old records may exist.':''}</p>`+
      (rows.length?`<table><thead><tr><th>Recorded</th><th>Action / operator</th><th>Stock evidence</th><th>Source note</th></tr></thead><tbody>${rows.map(event=>{
        const before=event.before_quantity==null?'not recorded':String(event.before_quantity),after=event.after_quantity==null?'not recorded':String(event.after_quantity),delta=event.delta==null?'not verified':String(event.delta);
        return `<tr><td>${esc(event.recorded_at||'Unknown')}</td><td>${esc(event.action||'Audit record')}<div class="small">Operator #${event.actor_user_id==null?'unknown':Number(event.actor_user_id)}</div></td>`+
          `<td>${esc(before)} → ${esc(after)}<div class="small">Change: ${esc(delta)}</div></td><td>${esc(event.note||'No source note')}</td></tr>`;
      }).join('')}</tbody></table>`:'<p>No matching recorded stock actions were found. This does <strong>not</strong> prove there were no earlier stock changes.</p>');
  }
  async function loadHistory(){
    if(busy||!selected)return;
    busy=true;blocked=true;historyLoaded=false;invalidate('Reading current Product stock and selected audit history…');
    say(historyStatus,'Reading one Product and up to 40 matching admin audit records…');sync();
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/product-inventory-reconciliation?product_id=${encodeURIComponent(selected.id)}`,{method:'GET',cache:'no-store'});
      const data=await readJson(response);
      if(Number(data.product?.product_id)!==selected.id||!Array.isArray(data.events)||data.history_complete!==false)
        throw new Error('The Product history response was incomplete.');
      historyLoaded=true;blocked=false;
      if(productLabel)productLabel.textContent=`${selected.name} (#${selected.id}) — saved Product stock: ${Number(data.product.inventory_quantity)} unit(s). This is not our physical count.`;
      renderEvents(data.events,data.history_warning,Boolean(data.history_truncated));
      say(historyStatus,`Loaded ${data.events.length} recorded stock-related audit event(s). Historical completeness is not guaranteed.`,'ok');
      if(counted)counted.value='';if(note)note.value='';
      invalidate('Physically count the finished units, then enter the count and a factual note for Preview.');
    }catch(error){
      blocked=true;historyLoaded=false;renderEvents([],'History could not be verified. No absence of prior changes may be inferred.',false);
      say(historyStatus,`${error.message||'History unavailable.'} Count correction remains blocked until a fresh history read succeeds.`,'error');
      invalidate('HOLD — verify the Product history before preparing a correction.');
    }finally{busy=false;sync();}
  }
  async function previewCount(){
    if(busy||blocked||!historyLoaded||!selected)return;
    const value=input();if(!value.valid){invalidate('Enter an actual whole-unit physical count and a factual note (8–240 characters).');return;}
    busy=true;invalidate('Loading a fresh, read-only comparison…');sync();
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/product-inventory-reconciliation',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'preview',product_id:selected.id,counted_quantity:value.quantity,note:value.reason})});
      const data=await readJson(response);
      if(data.action!=='preview'||data.saved!==false||Number(data.product_id)!==selected.id||Number(data.counted_quantity)!==value.quantity)
        throw new Error('The count comparison was incomplete. Nothing changed.');
      if(data.discrepancy===false){
        if(comparison)comparison.textContent=`Saved and counted quantities both equal ${value.quantity}. No correction is needed.`;
        say(countStatus,'Count matches the saved Product. No stock update will be offered.','ok');return;
      }
      if(!data.snapshot||data.note!==value.reason||!Number.isSafeInteger(data.previewed_at))
        throw new Error('Count preview was missing the original stock evidence.');
      preview={id:selected.id,quantity:value.quantity,note:value.reason,snapshot:data.snapshot,previewed_at:data.previewed_at};
      if(comparison)comparison.innerHTML=`<p><strong>${esc(data.product_name||selected.name)}</strong> — saved: <strong>${Number(data.before_quantity)}</strong>, physically counted: <strong>${value.quantity}</strong>, difference: <strong>${Number(data.difference)>0?'+':''}${Number(data.difference)}</strong>.</p>`+
        `<p>Count note: ${esc(value.reason)}</p><p>${data.committed_quantity==null?'Order-commitment proof not required for an increase.':`Existing order commitments: ${Number(data.committed_quantity)} unit(s). A decrease cannot go below these.`}</p>`+
        `<p>${data.storefront_availability_may_change?'Active Product: this correction may immediately change storefront availability.':'Draft Product: no publication is performed.'} No external channel is synchronized.</p>`;
      if(confirmed){confirmed.checked=false;confirmed.disabled=false;}
      say(countStatus,'Comparison verified. Nothing has been saved. Confirm only if the physical count and source note are true.','ok');
    }catch(error){invalidate(`${error.message||'Preview unavailable.'} No stock was changed.`);}
    finally{busy=false;sync();}
  }
  async function applyCount(){
    if(busy||blocked||!preview||!confirmed?.checked)return;
    const value=input(),proposal=preview;
    if(!value.valid||value.quantity!==proposal.quantity||value.reason!==proposal.note||selected?.id!==proposal.id){invalidate('Count proposal changed. Preview again.');return;}
    busy=true;sync();say(countStatus,'Saving the one explicitly confirmed Product correction once…','warn');
    try{
      const response=await window.DDAuth.apiFetch('/api/admin/product-inventory-reconciliation',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'apply',product_id:proposal.id,counted_quantity:proposal.quantity,note:proposal.note,
          snapshot:proposal.snapshot,previewed_at:proposal.previewed_at,owner_confirmed:true,
          acknowledgement:'I VERIFIED PHYSICAL COUNT AND ORDER COMMITMENTS'})});
      const data=await readJson(response);
      if(data.action!=='apply'||data.confirmed!==true||Number(data.counted_quantity)!==proposal.quantity||Number(data.product_id)!==proposal.id)
        throw new Error('The correction outcome could not be confirmed.');
      preview=null;blocked=true;historyLoaded=false;
      if(confirmed){confirmed.checked=false;confirmed.disabled=true;}
      window.DD638InvalidateProductBrowser?.();
      if(comparison)comparison.textContent=`Saved stock count: ${Number(data.before_quantity)} → ${Number(data.counted_quantity)}. Review the current Product and its audit again before any additional correction.`;
      say(countStatus,data.audit_recorded===true?
        'Saved ✓ Count correction and audit record confirmed. Press Refresh actual stock & history and refresh the Product Browser for current numbers.':
        `ATTENTION — stock changed, but audit recording is unconfirmed. Do not repeat Save. ${data.warning||'Inspect stock and audit manually.'}`,
      data.audit_recorded===true?'ok':'error');
    }catch(error){blocked=true;historyLoaded=false;invalidate(`HOLD — ${error.message||'Save result unconfirmed.'} Refresh actual stock/history before another count review. Never automatically repeat Save.`);}
    finally{busy=false;sync();}
  }
  counted?.addEventListener('input',()=>invalidate());note?.addEventListener('input',()=>invalidate());
  confirmed?.addEventListener('change',sync);previewButton?.addEventListener('click',()=>void previewCount());
  applyButton?.addEventListener('click',()=>void applyCount());historyRefresh?.addEventListener('click',()=>void loadHistory());
  $('dd638CountClose')?.addEventListener('click',()=>{
    if(busy)return;panel.hidden=true;selected=null;blocked=false;historyLoaded=false;invalidate('Count review closed. No pending correction.');
  });
  window.DD638CountHistory={open(product){
    if(busy||!product||!Number.isSafeInteger(Number(product.product_id))||Number(product.product_id)<=0)return;
    selected={id:Number(product.product_id),name:String(product.name||'Product')};
    panel.hidden=false;blocked=false;historyLoaded=false;invalidate('Opening a fresh read of this Product and its selected audit records…');
    void loadHistory();
  }};
  sync();
})();
