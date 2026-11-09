/* Build 658: explicit, accessible original-source inspection and private count review. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),api='/api/admin/physical-stock-658';
 const ids=['s658Inspect','s658SaveCount','s658SaveReview','s658Check'];
 let inspected=null,selectedId=0,pending=null,busy=false;
 const make=(tag,value)=>{const n=document.createElement(tag);n.textContent=String(value??'');return n;};
 const status=(message)=>{$('s658Status').textContent=message;};
 const lock=()=>{ids.forEach(id=>$(id).disabled=busy||
   (id==='s658Inspect'?!selectedId:id==='s658Check'?!pending:
    id==='s658SaveCount'?!inspected:id==='s658SaveReview'?!inspected?.latest?.count||
       Boolean(inspected?.latest?.review):false));};
 function clear(message='Inspect actual source stock before continuing.'){
   inspected=null;$('s658Facts').textContent=message;$('s658Latest').textContent='No fresh count source loaded.';
   $('s658Marker').textContent='No approved correction reference.';
   $('s658Lots').replaceChildren();$('s658History').replaceChildren();
   $('s658Lot').replaceChildren(new Option('All stock / not lot-specific','0'));lock();}
 async function fetchJson(url,options){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
   const data=await r.json();if(!r.ok||!data.ok)throw Error(data.error||`Request rejected (${r.status})`);return data;}
 const timed=()=>new Date().toISOString();
 async function request(fn){if(busy)return;busy=true;lock();try{await fn();}
   catch(e){status('HOLD — '+(e?.message||'Source unavailable.')+' No automatic retry.');}
   finally{busy=false;lock();}}
 $('s658List').addEventListener('click',()=>request(async()=>{
   clear();selectedId=0;const q=$('s658Search').value.trim(),kind=$('s658Kind').value;
   const data=await fetchJson(api+'?q='+encodeURIComponent(q)+'&kind='+encodeURIComponent(kind));
   const select=$('s658Item');select.replaceChildren(new Option('Choose original Tool or Supply',''));
   for(const item of data.items)select.add(new Option(`${item.item_name} (${item.source_type}, #${item.site_item_inventory_id})`,item.site_item_inventory_id));
   status(`${data.items.length} real items loaded (maximum 80). Select and inspect; none are silently counted.`);
 }));
 $('s658Item').addEventListener('change',()=>{selectedId=Number($('s658Item').value)||0;
   clear('Selected item changed. Current evidence and unsaved review were invalidated.');});
 $('s658Inspect').addEventListener('click',()=>request(async()=>{
   clear();const id=selectedId;
   const data=await fetchJson(api+'?item_id='+id);
   if(selectedId!==id)return;
   inspected=data;const s=data.source,base=s.base;
   $('s658Facts').textContent=`${s.item.item_name} · ${s.item.source_type} · ${base.base_on_hand_quantity} ${base.base_unit_label} usable on hand; ${base.base_reserved_quantity} reserved; ${base.base_incoming_quantity} incoming. Purchase/base balance ${s.base_authority_aligned?'aligned':'DRIFT / HOLD'}. Original last count ${s.item.last_counted_at||'never'}. ${s.lot_count} real lots; source lot total ${s.lot_total_base} base units (${s.lot_total_matches_stock===null?'no lots':s.lot_total_matches_stock?'matches base':'LOT VARIANCE / HOLD'}). ${s.lot_list_truncated?'Older lots outside 25-row review; approval HOLD.':''} ${s.lot_custody_hold?'Remaining stock in non-available or expired lots; approval HOLD.':''}`;
   const list=$('s658Lots'),lot=$('s658Lot');
   for(const row of s.lots){const l=make('li',`Original lot #${row.inventory_purchase_lot_id} ${row.lot_code}: ${row.quantity_remaining} purchase units, status ${row.lot_status||'unknown'}, location ${row.storage_location||'unrecorded'}, expiry ${row.expiry_date||'not recorded'}`);list.append(l);
     lot.add(new Option(`#${row.inventory_purchase_lot_id} · ${row.lot_code}`,row.inventory_purchase_lot_id));}
   const count=data.latest.count,review=data.latest.review;
   $('s658Latest').textContent=!count?'No observed physical count saved yet.':
     `Last count #${count.receipt_id}: observed ${count.counted_base_quantity} ${count.base_unit}, original ${count.recorded_base_quantity}, variance ${count.difference_base}. Counter account #${count.actor_user_id}. ${review?`Independent account #${review.actor_user_id}: ${review.decision}.`:'Different Admin review needed.'} ${data.correction_state}.`;
   $('s658Marker').textContent=review?.decision==='approve'?`Approved private count marker for separate original Inventory movement note: ${review.correction_marker}. No correction posted here.`:'No correction authorized. Never write stock from an unreviewed count.';
   for(const entry of data.history)$('s658History').append(make('li',`${entry.recorded_at} · ${entry.action} · account #${entry.actor_user_id} · ${entry.decision||entry.counted_base_quantity+' '+entry.base_unit} · ${entry.note}`));
   status(`Original source checked. Review journal version ${data.version}. Current source count ${data.count_source_current?'unchanged':'CHANGED / HOLD'}. No stock modified.`);
 }));
 function common(action){return {action,item_id:selectedId,expected_source_revision:inspected.source.source_revision,
   expected_version:inspected.version,request_key:crypto.randomUUID()};}
 async function save(body){const item=selectedId;pending={item,request_key:body.request_key};
   const result=await fetchJson(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(result.saved){status(`Private ${body.action} receipt ${result.receipt.receipt_id} saved. Inventory not modified. Select Inspect again for current history.`);
     clear('Review saved. Reinspect original source before another decision.');}
 }
 $('s658CountForm').addEventListener('submit',e=>{e.preventDefault();request(async()=>{
   if(!inspected||selectedId!==Number(inspected.source.item.site_item_inventory_id))throw Error('Reinspect selected original item.');
   const qty=Number($('s658Qty').value),observed=$('s658Observed').value;
   if(!observed)throw Error('Enter a real observation time.');
   await save({...common('record_count'),counted_base_quantity:qty,observed_at:new Date(observed).toISOString(),
     observed_location:$('s658Location').value,lot_id:Number($('s658Lot').value),
     note:$('s658CountNote').value,personally_counted:$('s658ObservedCheck').checked,
     owner_confirmation:$('s658Confirm').checked});
 });});
 $('s658ReviewForm').addEventListener('submit',e=>{e.preventDefault();request(async()=>{
   if(!inspected?.latest?.count||inspected.latest.review)throw Error('Reinspect the latest unreviewed count.');
   await save({...common('review_count'),count_receipt_id:inspected.latest.count.receipt_id,
     decision:$('s658Decision').value,note:$('s658ReviewNote').value,
     independent_review:$('s658Independent').checked,owner_confirmation:$('s658ReviewConfirm').checked});
 });});
 $('s658Check').addEventListener('click',()=>request(async()=>{
   if(!pending)throw Error('No original uncertain request to inspect.');
   const data=await fetchJson(api+'?item_id='+pending.item+'&request_key='+encodeURIComponent(pending.request_key));
   status(data.found?`Original receipt ${data.receipt.receipt_id} exists for ${data.receipt.action}. Do not resubmit; inspect current original item.`:
     'No original receipt found. Keep this request key; investigate before an intentional new save.');
 }));
 $('s658Observed').value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 lock();
})();
