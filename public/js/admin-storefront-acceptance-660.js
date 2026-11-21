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

 // Build 745: user-initiated public buyer-journey integrity proof.
 // Only allowlisted SAME-ORIGIN GETs, never a payment/provider or customer mutation.
 const buyerRoutes745=Object.freeze([
  {name:'Shop and product search',path:'/shop/',selectors:['h1','#shopSearchInput','#shopProducts','#shopResultsSection'],script:'/public/js/shop.js',detail:'Search, results and original shop controller exist'},
  {name:'Shopping cart',path:'/cart/',selectors:['h1','#cartItems','#cartEmpty'],script:'/public/js/cart-page.js',detail:'Cart review and empty state exist'},
  {name:'Checkout form',path:'/checkout/',selectors:['h1','#checkoutForm','#checkoutSubmitButton','#fulfillment_method'],script:'/public/js/checkout.js',detail:'Checkout and fulfilment controls exist; no purchase attempted'},
  {name:'Local pickup',path:'/pickup/',selectors:['h1'],script:null,detail:'Pickup guidance page exists; no pickup promised'},
  {name:'Contact and support',path:'/contact/',selectors:['h1'],script:null,detail:'Contact information page exists; no message sent'},
  {name:'Sale terms',path:'/terms/',selectors:['h1'],script:null,detail:'Sale and return terms page exists; no refund performed'},
  {name:'Customer Help Centre',path:'/help/',selectors:['h1'],script:null,detail:'Customer help page exists; no ticket created'}
 ]);
 let buyerProof745=null,buyerChecking745=false;
 const addBuyer745=(parent,tag,value)=>{const e=document.createElement(tag);e.textContent=String(value??'');parent.append(e);return e;};
 const fetchBuyer745=async path=>{
  if(!/^\/[a-z0-9/_-]+(?:\.[a-z]+)?\/?$/.test(path)||path.includes('/dovlin/'))
   throw Error('Path is not an allowlisted public resource.');
  const controller=typeof AbortController==='function'?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),8000):null;
  try{
   const res=await fetch(path,{method:'GET',credentials:'omit',cache:'no-store',
    redirect:'manual',...(controller?{signal:controller.signal}:{})});
   if(res.status!==200||res.type==='opaqueredirect')
    throw Error('HTTP '+res.status+(res.type==='opaqueredirect'?' redirect':''));
   const ct=String(res.headers.get('content-type')||'').toLowerCase();
   if(path.endsWith('.js')&&ct&&!(ct.includes('javascript')||ct.includes('text/plain')))
    throw Error('Script returned unexpected content type');
   if(!path.endsWith('.js')&&ct&&!ct.includes('html'))
    throw Error('Page returned unexpected content type');
   const body=await res.text();
   if(body.length<100||body.length>1250000)throw Error('Unexpected content length');
   return body;
  }finally{if(timer!==null)clearTimeout(timer);}
 };
 const formatBuyer745=reason=>String(reason?.message||reason||'Unverified')
  .replace(/[\u0000-\u001f]/g,' ').slice(0,160);
 async function checkBuyer745(entry){
  const result={name:entry.name,path:entry.path,checked_at:new Date().toISOString(),
   structure:'HOLD',script:entry.script?'HOLD':'NOT_APPLICABLE',
   details:entry.detail,static_only:true,provider_verified:false,
   customer_device_verified:false,order_created:false};
  try{
   const source=await fetchBuyer745(entry.path);
   const parsed=new DOMParser().parseFromString(source,'text/html');
   if(!parsed.querySelector('title')||!parsed.querySelector('h1'))
    throw Error('Missing title or visible main heading');
   const absent=entry.selectors.filter(selector=>!parsed.querySelector(selector));
   if(absent.length)throw Error('Missing required page elements: '+absent.join(', '));
   result.structure='PASS_STATIC_STRUCTURE';
  }catch(error){result.details='Page structure HOLD: '+formatBuyer745(error);return result;}
  if(entry.script){
   try{
    const source=await fetchBuyer745(entry.script);
    if(!source.trim()||!/(?:function|=>|addEventListener|DOMContentLoaded)/.test(source))
     throw Error('JavaScript source does not resemble an executable controller');
    result.script='PASS_SOURCE_RESPONSE';
   }catch(error){result.script='HOLD';result.details='Essential script HOLD: '+formatBuyer745(error);}
  }
  return result;
 }
 function drawBuyer745(reports){
  const tbody=$('a745Results');tbody.replaceChildren();
  for(const report of reports){
   const tr=addBuyer745(tbody,'tr','');
   addBuyer745(tr,'td',report.name);
   addBuyer745(tr,'td',report.structure);
   addBuyer745(tr,'td',report.script);
   addBuyer745(tr,'td',report.details);
   const cell=addBuyer745(tr,'td',''),link=addBuyer745(cell,'a','Open '+report.name);
   link.href=report.path;
  }
 }
 async function buyerStart745(){
  if(buyerChecking745)return;
  const run=$('a745Run'),exp=$('a745Export'),stat=$('a745Status');
  if(!run||!exp||!stat)return;
  buyerChecking745=true;buyerProof745=null;run.disabled=true;exp.disabled=true;
  const started_at=new Date().toISOString(),reports=[];
  drawBuyer745([]);
  try{
   for(const entry of buyerRoutes745){
    stat.textContent='Checking '+entry.name+'… '+reports.length+' of '+buyerRoutes745.length+' steps checked.';
    const report=await checkBuyer745(entry);
    reports.push(report);drawBuyer745(reports);
   }
   const pass=reports.filter(r=>r.structure==='PASS_STATIC_STRUCTURE'&&
    (r.script==='PASS_SOURCE_RESPONSE'||r.script==='NOT_APPLICABLE')).length;
   buyerProof745={schema:'devilndove-buyer-journey-preflight-745',build:745,
    scope:'public customer route and essential JS responses only',site:location.origin,
    started_at,finished_at:new Date().toISOString(),step_count:reports.length,
    static_pass:pass,static_hold:reports.length-pass,reports,
    payment_processed:false,customer_identity_read:false,provider_settlement_verified:false,
    carrier_verified:false,original_device_acceptance_verified:false,
    dovlin_collection_changed:false};
   stat.textContent='Live preflight: '+pass+'/'+reports.length+
    ' public page/script steps passed static inspection. '+
    (pass===reports.length?'No broken structural paths found.':'At least one HOLD needs investigation.')+
    ' Payments, shipping, refund and real customer-device success remain unverified.';
   exp.disabled=false;
  }catch(e){stat.textContent='Inspection interrupted: '+formatBuyer745(e)+
   '. No business data or provider action was changed.';}
  finally{buyerChecking745=false;run.disabled=false;}
 }
 function exportBuyer745(){
  if(!buyerProof745)return;
  const blob=new Blob([JSON.stringify(buyerProof745,null,2)+'\n'],
   {type:'application/json;charset=utf-8'});
  const href=window.URL.createObjectURL(blob);
  try{const a=document.createElement('a');a.href=href;
   a.download='devilndove-buyer-preflight-745-'+buyerProof745.finished_at.slice(0,10)+'.json';
   a.hidden=true;document.body.append(a);a.click();a.remove();
  }finally{setTimeout(()=>window.URL.revokeObjectURL(href),2500);}
 }
 $('a745Run')?.addEventListener('click',buyerStart745);
 $('a745Export')?.addEventListener('click',exportBuyer745);
})();
