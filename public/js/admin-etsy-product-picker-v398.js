// Build 398 — searchable Product picker and explicit local-only Etsy draft staging.
// No reads on startup. Never makes remote Etsy requests or triggers publishing.
(()=>{'use strict';
const el=id=>document.getElementById(id);
const search=el('etsy398SearchProducts'),query=el('etsy398ProductQuery'),select=el('etsy398ProductSelect'),
 msg=el('etsy398ProductStatus'),title=el('etsy398DraftTitle'),description=el('etsy398DraftDescription'),
 price=el('etsy398DraftPrice'),confirm=el('etsy398DraftConfirmed'),stage=el('etsy398StageDraft'),
 result=el('etsy398DraftStatus');
if(!search||!query||!select||!msg||!stage||!window.DDAuth?.apiFetch)return;
let records=[],selected=null,busy=false;
const cad=n=>Number.isSafeInteger(Number(n))?'CAD $'+(Number(n)/100).toFixed(2):'Invalid CAD price';
async function json(url,options){
 const res=await window.DDAuth.apiFetch(url,{cache:'no-store',...options});
 const body=await res.json().catch(()=>null);
 if(!res.ok||!body?.ok)throw Error(body?.error||'Server declined request');
 return body;
}
function busyButton(button,working,label){button.disabled=working;button.textContent=working?'Please wait…':label;}
function setProduct(id){
 selected=records.find(x=>Number(x.product_id)===Number(id))||null;
 const inputs=[el('etsyExceptionProductId'),el('etsyAlertProductId'),el('etsy397ProductId'),el('etsy399ProductId'),el('productPriceSourceId')];
 for(const input of inputs){if(input)input.value=selected?String(selected.product_id):'';}
 // For a Product test, select Product scope without changing unrelated Etsy connection evidence.
 if(selected){for(const id of ['etsyExceptionScope','etsyAlertScope']){const node=el(id);if(node)node.value='product';}}
 title.value=selected?String(selected.name||'').slice(0,140):'';
 price.textContent=selected?'Selected #'+selected.product_id+' · '+cad(Number(selected.price_cents))+
  ' · available inventory: '+Number(selected.inventory_quantity||0)+
  ' · currency: '+String(selected.currency||'unknown'):'Select a Product first.';
 confirm.checked=false;
 result.textContent='No local draft created. The Product selector does not upload to Etsy.';
 msg.textContent=selected?'Product #'+selected.product_id+' selected and shared with the Etsy review panels.':'Select one returned Product.';
}
async function load(){
 if(busy)return;
 busy=true;busyButton(search,true,'Find Products');select.replaceChildren();records=[];selected=null;
 msg.textContent='Searching real Products by name, SKU or category (max 50, manual request only)…';
 try{
  const q=String(query.value||'').trim().slice(0,100);
  const data=await json('/api/admin/etsy-operator-product-choices'+(q?'?q='+encodeURIComponent(q):''),{method:'GET'});
  records=(Array.isArray(data.products)?data.products:[]).filter(p=>Number.isSafeInteger(Number(p.product_id))&&Number(p.product_id)>0);
  const placeholder=new Option(records.length?'Select a Product…':'No matching Products returned','');select.add(placeholder);
  for(const p of records)select.add(new Option('#'+Number(p.product_id)+' · '+String(p.name||'Unnamed').slice(0,85)+' · '+cad(Number(p.price_cents)),String(p.product_id)));
  if(!records.length)msg.textContent='No matching Products. Try a different search, or leave it blank for the latest 50.';
  else msg.textContent=records.length+' actual Products loaded'+(data.has_more?' (more available; refine search)':'')+'. Choose one below.';
 }catch(e){
  select.add(new Option('Products unavailable',''));
  msg.textContent='Product list could not be read: '+e.message+'. Confirm your admin session; no automatic retry.';
 }finally{busy=false;busyButton(search,false,'Find Products');}
}
search.addEventListener('click',()=>void load());
query.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void load();}});
select.addEventListener('change',()=>setProduct(select.value));
stage.addEventListener('click',async()=>{
 if(busy)return;
 if(!selected){result.textContent='Select a real Product first.';return;}
 const t=String(title.value||'').trim(),d=String(description.value||'').trim();
 const cents=Number(selected.price_cents),currency=String(selected.currency||'').toUpperCase();
 if(!t||!d||!confirm.checked||currency!=='CAD'||!Number.isSafeInteger(cents)||cents<0){
  result.textContent='Confirm Product, title, description, CAD price and local-only consent before staging.';return;
 }
 busy=true;stage.disabled=true;stage.textContent='Saving local draft…';
 result.textContent='Creating one local review draft only; no Etsy provider call…';
 try{
  const key=globalThis.crypto?.randomUUID?.();
  if(!key)throw Error('Secure request identifier unavailable.');
  const data=await json('/api/admin/etsy-product-syndication',{method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({product_id:String(selected.product_id),title:t,description:d,price:cents/100,
    quantity:Number(selected.inventory_quantity||0),request_key:key,local_draft_only:true})});
  result.textContent='Local draft #'+String(data.draft?.id||'created')+' staged in Devil n Dove. No Etsy listing or upload was created.';
 }catch(e){
  result.textContent='Local staging not completed: '+e.message+
   '. The original Product is unchanged. Do not submit again until the draft history is checked.';
 }finally{busy=false;stage.disabled=false;stage.textContent='Create local review draft (not Etsy)';}
});
})();