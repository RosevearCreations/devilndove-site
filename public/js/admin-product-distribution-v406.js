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
 const firstMapping=!chosen.size;
 for(const img of x.gallery||[]){
  const lab=document.createElement('article');lab.className='dd495-image-card';
  const chk=document.createElement('input');chk.type='checkbox';chk.dataset.imageId=String(img.product_image_id);
  chk.checked=img.approved_for_distribution&&(chosen.has(Number(img.product_image_id))||firstMapping);chk.disabled=!img.approved_for_distribution;
  chk.setAttribute('aria-label',`Include image #${img.product_image_id} in ${e.channel.value} local media preparation`);
  chk.addEventListener('change',update);
  const photo=document.createElement('img');photo.src=img.image_url;photo.alt=img.alt_text||'Product image';
  photo.loading='lazy';photo.className='dd495-image-thumb';
  const desc=document.createElement('div');desc.className='dd495-image-content';
  const heading=document.createElement('strong');heading.textContent=`Image #${img.product_image_id} • ${img.width_px||'?'}×${img.height_px||'?'} • ${img.image_role||'gallery'}`;
  const status=document.createElement('p');status.className='small';status.textContent=(img.approved_for_distribution?
   'Attached to Product ✓ • Etsy/Marketplace preparation ✓':'Attached to Product ✓ • Channel preparation incomplete')+
   ` • Image quality: ${img.quality_score==null?'not scored':img.quality_score+'/100'} (${img.acceptance_status||'not reviewed'})`;
  const requirements=document.createElement('ul');requirements.className='dd495-requirements';
  const holds=Array.isArray(img.hold_reasons)?img.hold_reasons:[];
  for(const [label,ready] of [['Original photograph and public-use permission',!holds.some(h=>/original|public-use/i.test(h))],
    ['Alt description (Etsy / Marketplace / accessible store)',!holds.some(h=>/alt text/i.test(h))],
    ['Verified image dimensions ≥800×800',!holds.some(h=>/dimensions/i.test(h))]]){
   const row=document.createElement('li');row.className=ready?'dd495-ready':'dd495-hold';
   const chip=document.createElement('span');chip.className='dd489-both';chip.textContent='Both channels';
   row.append(chip,document.createTextNode(` ${ready?'✓':'Required —'} ${label}`));requirements.append(row);
  }
  if(holds.length){const warning=document.createElement('p');warning.className='dd495-hold';warning.textContent='Needs attention: '+holds.join('; ');desc.append(warning);}
  const edit=document.createElement('button');edit.type='button';edit.className='btn';edit.dataset.dd495Edit=String(img.product_image_id);edit.textContent='Edit image requirements here';
  const mount=document.createElement('div');mount.dataset.dd495Inline=String(img.product_image_id);
  desc.append(heading,status,requirements,edit,mount);lab.append(chk,photo,desc);e.gallery.append(lab);
 }
 say('Same canonical Product gallery for Store / Etsy / Marketplace. Channel: '+x.channel+'. Saved mapping: '+chosen.size+
  '. Readiness: '+(x.current_evidence?.ready_for_local_export?'LOCAL EXPORT READY':'HOLD — '+(x.current_evidence?.blockers||[]).join(', '))+
  '. Correct image requirements directly beside each photo. Local destination review still requires consent; no provider publication or image transfer happens here.');
 document.dispatchEvent(new CustomEvent('dd:shared-product-gallery-loaded',{detail:{product_id:id,channel:e.channel.value,images:x.gallery||[]}}));
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
e.channel.addEventListener('change',()=>{loaded=false;e.gallery.replaceChildren();e.shipping.checked=false;e.local.checked=false;receipt=0;update();void load();});
e.shipping.addEventListener('change',update);e.local.addEventListener('change',update);
function activeForImages(){return ['media','etsy'].some(name=>document.querySelector(`[data-editor-panel="${name}"]`)?.hidden===false);}
function loadWhenReady(){if(id&&document.getElementById('productEditorForm')?.dataset.productAuthority==='ready'&&!busy&&!loaded&&activeForImages())void load();}
document.addEventListener('dd:product-loaded',loadWhenReady);
document.addEventListener('dd:editor-tab-opened',loadWhenReady);
document.addEventListener('dd:save-succeeded',()=>{loaded=false;loadWhenReady();});
document.addEventListener('dd:media-inline-updated',()=>{loaded=false;loadWhenReady();});
say(id?'Waiting for saved Product authority; its gallery then appears automatically.':'Save Product first to see its shared gallery.');
loadWhenReady();
update();
})();
