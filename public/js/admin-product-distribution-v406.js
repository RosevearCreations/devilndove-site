// Build 406 — opt-in, click-only canonical Product image mapping and US shipping exclusion review.
(()=>{'use strict';
const $=id=>document.getElementById(id),e={root:$('productDistribution406'),channel:$('productDistribution406Channel'),
 load:$('productDistribution406Load'),save:$('productDistribution406Save'),gallery:$('productDistribution406Gallery'),
 shipping:$('productDistribution406UsOff'),local:$('productDistribution406Local'),status:$('productDistribution406Status')};
if(!e.root||!window.DDAuth?.apiFetch)return;
const id=Number(new URLSearchParams(location.search).get('product_id')||0);
let busy=false,loaded=false,receipt=0,data=null;
const say=s=>{e.status.textContent=s;};
function selected(){return [...e.gallery.querySelectorAll('input[data-image-id]:checked')].map(n=>Number(n.dataset.imageId));}
function update(){e.load.disabled=busy||!id;e.save.disabled=busy||!id||!loaded||!e.shipping.checked||!e.local.checked||selected().length===0;}
async function call(path,opts){const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...opts}),x=await r.json().catch(()=>null);if(!r.ok||!x?.ok)throw Error(x?.error||'Request failed');return x;}
async function load(){if(busy||!id)return;busy=true;update();e.gallery.replaceChildren();say('Reading canonical Product media and saved local review…');
try{const x=await call('/api/admin/product-distribution-406?product_id='+encodeURIComponent(id)+'&channel='+encodeURIComponent(e.channel.value),{method:'GET'});
 data=x;receipt=Number(x.review_receipt||0);loaded=true;e.shipping.checked=false;e.local.checked=false;
 const chosen=new Set((x.selected_image_ids||[]).map(Number));
 for(const img of x.gallery||[]){
  const lab=document.createElement('label');lab.style.cssText='display:flex;gap:12px;align-items:center;margin:8px 0;';
  const chk=document.createElement('input');chk.type='checkbox';chk.dataset.imageId=String(img.product_image_id);
  chk.checked=chosen.has(Number(img.product_image_id));chk.disabled=!img.approved_for_distribution;
  chk.addEventListener('change',update);
  const photo=document.createElement('img');photo.src=img.image_url;photo.alt=img.alt_text||'Product image';
  photo.loading='lazy';photo.style.cssText='width:90px;height:90px;object-fit:contain;background:#151924;border-radius:6px;';
  const desc=document.createElement('span');
  desc.textContent='Image #'+img.product_image_id+' · '+img.width_px+'×'+img.height_px+' · '+(img.image_role||'gallery')+
   (img.approved_for_distribution?' · approved':' · BLOCKED: '+(Array.isArray(img.hold_reasons)&&img.hold_reasons.length?img.hold_reasons.join('; '):'approval unavailable'));
  lab.append(chk,photo,desc);e.gallery.append(lab);
 }
 say('Channel source: '+x.channel+'. Saved selection: '+chosen.size+
  '. Readiness: '+(x.current_evidence?.ready_for_local_export?'LOCAL EXPORT READY':'HOLD — '+(x.current_evidence?.blockers||[]).join(', '))+
  '. Blocked checkboxes need correction in Product Media: original photograph, public-use approval, valid dimensions and descriptive alt text. Then reload this gallery. Check US shipping exclusion and save explicit owner review after changing images.');
}catch(err){loaded=false;say('Cannot verify image source: '+err.message+'. No changes made.');}
finally{busy=false;update();}}
async function save(){if(busy||!loaded||!id||!e.shipping.checked||!e.local.checked)return;
if(!globalThis.crypto?.randomUUID){say('Secure request key unavailable.');return;}
busy=true;update();try{
 const x=await call('/api/admin/product-distribution-406',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
 product_id:id,channel:e.channel.value,image_ids:selected(),expected_receipt:receipt,request_key:globalThis.crypto.randomUUID(),
 owner_verified_destinations:true,us_shipping_disabled:true,confirmed_local_only:true})});
 receipt=Number(x.review_receipt||0);say('Saved verified Product gallery mapping and US shipping exclusion review. Receipt #'+receipt+
  '. No Etsy or Marketplace listing was published.');
}catch(err){say('Local review not confirmed: '+err.message+'. Reload before retrying.');}
finally{busy=false;update();}}
e.load.addEventListener('click',()=>void load());e.save.addEventListener('click',()=>void save());
e.channel.addEventListener('change',()=>{loaded=false;e.gallery.replaceChildren();e.shipping.checked=false;e.local.checked=false;receipt=0;update();});
e.shipping.addEventListener('change',update);e.local.addEventListener('change',update);
say(id?'Choose a destination and load canonical images after saving this Product.':'Save Product first to select canonical gallery images.');
update();
})();
