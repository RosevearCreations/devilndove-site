(() => {
 const mount=document.getElementById('makerFulfillmentEvidenceMount');if(!mount)return;
 const api=window.DDAuth?.apiFetch||fetch;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const options=[['packing_review','Packaging review'],['shipping_receipt','Canadian shipment receipt'],['pickup_receipt','Local pickup receipt'],['damage_hold','Damage follow-up HOLD'],['return_hold','Return follow-up HOLD'],['repair_followup','Repair follow-up'],['aftercare_followup','Aftercare follow-up']];
 let orderId=0;
 mount.innerHTML=`<details><summary><strong>ⓘ Build 454 — Packaging, Canadian fulfillment & aftercare</strong></summary><p>Private evidence against a real order. This never buys postage, marks delivery, contacts a customer or issues a refund. US shipping remains suspended.</p><form id="mfeLookup"><label>Order ID <input name="order_id" type="number" min="1" required></label> <button class="btn">Review order</button></form><div id="mfeResult" aria-live="polite"></div></details>`;
 const result=mount.querySelector('#mfeResult');
 async function load(id){
  result.textContent='Loading order and receipts…';
  try{const r=await api(`/api/admin/maker-fulfillment-evidence?order_id=${id}`,{headers:{Accept:'application/json'}});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Evidence unavailable');orderId=id;
   const o=d.order,ship=String(o.fulfillment_type).toLowerCase()==='shipping'&&String(o.shipping_country).toUpperCase()==='CA'&&o.currency==='CAD',pickup=String(o.fulfillment_type).toLowerCase()==='pickup'&&o.currency==='CAD';
   const eligible=!['cancelled','canceled','refunded'].includes(String(o.order_status).toLowerCase());
   result.innerHTML=`<p><strong>${esc(o.order_number||o.order_id)}</strong> · ${esc(o.order_status)} · payment ${esc(o.payment_status)} · ${esc(o.fulfillment_type)} · ${esc(o.shipping_country||'pickup')}</p><p><strong>Policy:</strong> ${ship?'Canadian shipment candidate':pickup?'Local pickup candidate':'Shipping/pickup HOLD'}. Confirm the actual payment, carrier and customer receipt separately.</p>
    <form id="mfeRecord"><label>Evidence type <select name="event_kind">${options.map(([v,l])=>`<option value="${v}" ${(!eligible&&['shipping_receipt','packing_review','pickup_receipt'].includes(v)||!ship&&['shipping_receipt','packing_review'].includes(v)||!pickup&&v==='pickup_receipt')?'disabled':''}>${l}</option>`).join('')}</select></label>
    <label>Protective package instructions <textarea name="package_instructions" maxlength="1200"></textarea></label><label>Carrier (shipping only) <input name="carrier" maxlength="120"></label><label>Tracking reference (shipping only) <input name="tracking_reference" maxlength="160"></label><label>Actual postage/pickup receipt reference <input name="receipt_reference" maxlength="160"></label><label>Private evidence note (16+ characters) <textarea name="review_note" minlength="16" maxlength="1200" required></textarea></label><button class="btn">Record reviewed evidence</button></form>
    <h3>History ${d.history_truncated?'(last 50; older records exist)':''}</h3>${d.evidence.length?`<ul>${d.evidence.map(e=>`<li><strong>${esc(e.event_kind)}</strong> · ${esc(e.created_at)} · receipt #${Number(e.evidence_id)}<p>${esc(e.review_note)}</p>${e.receipt_reference?`<small>Reference: ${esc(e.receipt_reference)}</small>`:''}</li>`).join('')}</ul>`:'<p>No receipts recorded. Delivery is not established.</p>'}<p id="mfeFeedback" role="status"></p>`;
   result.querySelector('#mfeRecord').addEventListener('submit',save);
  }catch(e){result.textContent=`HOLD: ${e.message}`;}
 }
 async function save(event){event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;
  const data=Object.fromEntries(new FormData(form));data.order_id=orderId;data.request_key=form.dataset.requestKey||(form.dataset.requestKey=crypto.randomUUID().replaceAll('-',''));const feedback=result.querySelector('#mfeFeedback');feedback.textContent='Recording…';
  try{const r=await api('/api/admin/maker-fulfillment-evidence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Review not saved');await load(orderId);}
  catch(e){feedback.textContent=`HOLD: ${e.message}. Verify before retrying.`;button.disabled=false;}
 }
 mount.querySelector('#mfeLookup').addEventListener('submit',e=>{e.preventDefault();const id=Number(new FormData(e.currentTarget).get('order_id'));if(Number.isSafeInteger(id)&&id>0)load(id);});
 const initial=new URLSearchParams(location.search).get('order_id');if(initial&&Number.isSafeInteger(Number(initial))&&Number(initial)>0){mount.querySelector('[name="order_id"]').value=initial;load(Number(initial));}
})();
