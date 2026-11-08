// Build 639 — explicit admin click reads one Product's saved stock and commitment proofs.
// This is never a live stock mutation or an automatic refresh/background sync.
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const panel=$('dd639StockPanel'),status=$('dd639StockStatus'),results=$('dd639StockResults'),
    reload=$('dd639StockReload'),close=$('dd639StockClose'),editorButton=$('dd639EditorReview');
  if(!panel||!status||!results||!window.DDAuth)return;
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let selected=null,busy=false;
  function message(value,tone=''){status.textContent=value;status.dataset.tone=tone;}
  function sync(){if(reload)reload.disabled=busy||!selected;if(close)close.disabled=busy;if(editorButton)editorButton.disabled=busy;}
  const number=value=>Number.isSafeInteger(value)&&value>=0?String(value):'unverified';
  function summary(label,value,explanation){return `<div class="dd639-metric"><div class="small">${escapeHtml(label)}</div><strong>${escapeHtml(value)}</strong><p class="small">${escapeHtml(explanation)}</p></div>`;}
  function render(data){
    if(!data?.product||!data.stock||!data.commitments||!data.lots||!data.serialized_pieces||data.read_only!==true||
      data.commitments.verified!==true||Number(data.product.product_id)!==selected?.id)
      throw new Error('The availability response was incomplete. Nothing can be inferred.');
    const product=data.product,stock=data.stock,serial=data.serialized_pieces,lots=data.lots;
    let output=`<p><strong>${escapeHtml(product.name)}</strong> · Product #${Number(product.product_id)} · ${escapeHtml(product.sku||'No SKU')} · ${escapeHtml(product.status||'Unknown status')}</p>`;
    output+='<div class="dd639-stock-metrics">'+
      summary('Saved Product on hand',number(stock.on_hand_quantity),'Canonical Product record; this is not a new physical count.')+
      summary('Qualifying order commitments',number(stock.order_committed_quantity),'Post-cutover order commitments, including refunded orders until a return is verified.')+
      summary('Remaining after recorded orders',stock.remaining_after_recorded_orders==null?'Not verified':number(stock.remaining_after_recorded_orders),'Upper bound only, not guaranteed sellable inventory.')+'</div>';
    if(stock.status==='below_commitments')output+='<p class="dd639-alert">HOLD: qualifying commitments exceed recorded stock. Review source orders before changing availability.</p>';
    if(stock.status==='untracked_or_nonphysical'||stock.status==='invalid_recorded_stock')
      output+='<p class="dd639-alert">The Product is not a tracked physical item with verified stock. No remaining-saleable quantity is inferred.</p>';
    if(!stock.sale_eligible_product)output+='<p class="small">This Product is not an active tracked physical listing; these numbers do not authorize a sale.</p>';
    output+=`<p class="small"><strong>Order scope:</strong> ${escapeHtml(data.commitments.scope)} ${escapeHtml(data.commitments.zero_note||'')}</p>`;
    output+=`<p class="dd639-caution">${escapeHtml(data.availability_warning)}</p>`;
    if(serial.state==='verified'){
      output+='<h4>Serialized finished pieces (separate authority)</h4><div class="dd639-stock-metrics">'+
        summary('Registered serials',number(serial.registered_quantity),'Serials recorded for this Product.')+
        summary('Serialized pieces unavailable',number(serial.unavailable_quantity),'Reserved, sold or quality-restricted; these categories can overlap orders.')+
        summary('Serialized view availability',number(serial.view_available_quantity),'Conservative source view, not an extra addition to stock.')+'</div>';
    }else output+=`<p class="small"><strong>Serialized-piece source:</strong> ${escapeHtml(serial.state)} — ${escapeHtml(serial.description)}</p>`;
    output+=`<p class="small">${escapeHtml(serial.description||'')}</p>`;
    output+='<h4>Finished-lot source links (not remaining stock)</h4>';
    if(lots.state!=='verified')output+='<p class="dd639-alert">Lot-source authority was unavailable. Do not infer that no lots exist.</p>';
    else if(!Array.isArray(lots.records)||!lots.records.length)output+='<p class="small">No finished-lot sources appear in the current lookup. This does not reconstruct historical stock.</p>';
    else{
      output+='<ul class="dd639-lots">'+lots.records.map(row=>`<li><strong>${escapeHtml(row.lot_key||`Lot #${row.id}`)}</strong> — ${escapeHtml(row.lot_status)} · ${escapeHtml(row.source_kind)} · originally ${escapeHtml(number(row.units_originally_created))} unit(s)</li>`).join('')+'</ul>';
      if(lots.more_records)output+='<p class="small">Showing only six newest lot records. Older lot records also exist.</p>';
    }
    output+=`<p class="small">${escapeHtml(lots.description)} Checked ${escapeHtml(data.checked_at||'on request')}. Nothing was saved.</p>`;
    const form=document.getElementById('productEditorForm'),unsaved=form?.querySelector('[name="inventory_quantity"]');
    if(unsaved&&stock.on_hand_quantity!==null&&String(unsaved.value)!==String(stock.on_hand_quantity))
      output+='<p class="dd639-alert">The number currently entered in the editor differs from the saved Product stock. This read does not validate or save the unsaved entry.</p>';
    results.innerHTML=output;
    message('Fresh source read completed. Review quantities and restrictions before editing. No stock was changed.','ok');
  }
  async function load(){
    if(busy||!selected)return;
    busy=true;results.textContent='';message('Reading one saved Product and its qualifying order commitment authority…');sync();
    try{
      const response=await window.DDAuth.apiFetch(`/api/admin/product-stock-visibility?product_id=${encodeURIComponent(selected.id)}`,{method:'GET',cache:'no-store'});
      const data=await response.json().catch(()=>null);
      if(!response.ok||data?.ok!==true)throw new Error(data?.error||`Availability check failed (${response.status}).`);
      render(data);
    }catch(error){results.textContent='';message(`HOLD — ${error.message||'Stock authority unavailable.'} No quantities are inferred. Use Review again after checking the source.`, 'error');}
    finally{busy=false;sync();}
  }
  function open(product){
    const id=Number(product?.product_id);
    if(busy||!Number.isSafeInteger(id)||id<=0)return;
    selected={id};panel.hidden=false;panel.scrollIntoView?.({block:'nearest'});
    void load();
  }
  window.DD639StockVisibility={open};
  reload?.addEventListener('click',()=>void load());
  close?.addEventListener('click',()=>{if(busy)return;panel.hidden=true;selected=null;results.textContent='';message('No Product selected.');sync();});
  editorButton?.addEventListener('click',()=>{
    const id=new URLSearchParams(window.location.search).get('product_id');
    if(!id||!/^[1-9]\d*$/.test(id)){message('Save the Product first, then review its live commitments.');panel.hidden=false;return;}
    open({product_id:Number(id)});
  });
  sync();
})();
