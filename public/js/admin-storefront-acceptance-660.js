/* Build 660: no automatic reads or writes. Original orders/receipts stay private. */
(()=>{'use strict';const $=id=>document.getElementById(id),URL='/api/admin/storefront-acceptance-660';
 if(!$('a660Load'))return;let busy=false;
 const add=(p,t,v)=>{const el=document.createElement(t);el.textContent=String(v??'');p.append(el);return el;};
 const update=(id,value)=>{$(id).textContent=value;};
 async function get(query=''){const r=await fetch(URL+query,{credentials:'same-origin',cache:'no-store'});
  const d=await r.json().catch(()=>({ok:false,error:'Original source response unreadable.'}));
  if(!r.ok||d.ok!==true)throw Error(d.error||'Source acceptance unavailable.');return d;}
 function matrix(owner){const place=$('a660Matrix');place.replaceChildren();
  const table=add(place,'table',''),head=add(table,'thead',''),hr=add(head,'tr','');
  ['Acceptance checkpoint','Latest owner decision','Observed','Evidence'].forEach(t=>add(hr,'th',t));
  const body=add(table,'tbody','');
  for(const c of owner.checkpoints||[]){const tr=add(body,'tr','');
   add(tr,'td',c.id);add(tr,'td',c.decision.toUpperCase()+' · NOT independently verified');
   add(tr,'td',c.observed_at||'Not observed');add(tr,'td',c.evidence_reference||'No source reference');}
  update('a660OwnerStatus','Current private owner record version '+owner.version+
   '. Owner choices above do not prove real provider, carrier, customer role or device acceptance. Official completion: UNKNOWN / HOLD.');}
 function group(place,label,list,make){const details=add(place,'details','');
  add(details,'summary',label+' · '+list.length+' original rows shown');
  const ul=add(details,'ul','');for(const x of list)add(ul,'li',make(x));}
 function showOrder(d){const container=$('a660Order');container.replaceChildren();const s=d.original_order;
  if(!s){update('a660OrderStatus','No original Order in this source response.');return;}
  const o=s.facts.order;
  add(container,'h3','Original Order #'+o.order_id+' · '+o.order_number);
  add(container,'p','Order '+o.order_status+' · payment '+o.payment_status+' ('+o.payment_method+
   ') · fulfillment '+o.fulfillment_type+' · CAD source currency '+o.currency);
  add(container,'p','Saved source amounts (cents): subtotal '+o.subtotal_cents+', discount '+o.discount_cents+
   ', shipping '+o.shipping_cents+', tax '+o.tax_cents+', total '+o.total_cents+'.');
  add(container,'p','Shipping country: '+(o.shipping_country||'(not saved)')+
   ' · billing country: '+(o.billing_country||'(not saved)'));
  add(container,'p','Original revision SHA-256: '+s.source_revision+' · updated '+o.updated_at);
  add(container,'p','Source HOLDs: '+(s.hold.length?s.hold.join(' · '):
   'No known local source mismatch; external provider/carrier/customer/returns proof still HOLD.'));
  add(container,'p','Evidence bounds: '+s.facts.totals.items+' line items, '+s.facts.totals.payments+
   ' payment rows, '+s.facts.totals.refunds+' refund rows.'+(s.truncated?' BOUNDED/TRUNCATED — HOLD':''));
  group(container,'Order items',s.facts.items,x=>x.product_name+' · quantity '+x.quantity+
   ' · price '+x.unit_price_cents+' cents · requires shipping '+Boolean(x.requires_shipping));
  group(container,'Saved payment states',s.facts.payments,x=>x.provider+' · '+x.payment_status+
   ' · '+x.amount_cents+' '+x.currency+' cents · '+(x.paid_at||'paid time unverified'));
  group(container,'Saved refund states',s.facts.refunds,x=>x.provider+' · '+x.refund_status+
   ' · provider sync '+(x.provider_sync_status||'not verified')+' · '+x.amount_cents+' cents');
  add(container,'p','A saved order is not proof a payment settled with the provider, a carrier accepted shipment, a refund cleared or a customer successfully used the UI.');
  const a=add(container,'a','Review this order in its original owner workspace');
  a.href='/admin/orders/?order_id='+encodeURIComponent(o.order_id);
  update('a660OrderStatus','Original Order inspected read-only. No checkout, payment, shipping or refund action was made.');}
 $('a660Load').addEventListener('click',async()=>{if(busy)return;busy=true;$('a660Load').disabled=true;
  update('a660OwnerStatus','Loading private owner device receipts…');
  try{const d=await get();matrix(d.owner);}catch(e){$('a660Matrix').replaceChildren();
   update('a660OwnerStatus','HOLD: '+e.message);}finally{busy=false;$('a660Load').disabled=false;}});
 $('a660Inspect').addEventListener('click',async()=>{if(busy)return;
  const id=String($('a660Id').value).trim();
  if(!/^[1-9]\d{0,9}$/.test(id)){update('a660OrderStatus','Enter an existing positive original Order ID.');return;}
  busy=true;$('a660Inspect').disabled=true;$('a660Order').replaceChildren();
  update('a660OrderStatus','Inspecting one actual saved order and bounded payment/refund rows…');
  try{const d=await get('?order_id='+encodeURIComponent(id));showOrder(d);matrix(d.owner);}
  catch(e){update('a660OrderStatus','HOLD: '+e.message+' No cached order will be shown.');}
  finally{busy=false;$('a660Inspect').disabled=false;}});
})();
