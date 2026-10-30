/* On-demand, up-to-three exact Product owner readback. No POSTs, no provider
 * modifications, no storage of IDs or prior unsaved field values. */
import {parseProductIds529,assessOwnerReadback529} from './etsy-owner-readback-529.mjs';
const $=id=>document.getElementById(id);
const button=$('dd529Check'),input=$('dd529ProductIds'),status=$('dd529Status'),results=$('dd529Results');
if(button&&input&&status&&results&&window.DDAuth?.apiFetch){
 const selected=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(Number.isSafeInteger(selected)&&selected>0)input.value=String(selected);
 let busy=false;
 const line=(parent,value,tag='p')=>{const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;};
 async function get(path){const response=await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'});
  return window.DDAuth.readApiJson(response,{fallbackMessage:'Owner readback unavailable.'});}
 function show(value){const card=document.createElement('article');card.className='dd529-result';
  line(card,`Product #${value.product_id} · ${value.name||'Name unavailable'} · SKU ${value.sku||'not set'}`,'h4');
  line(card,`Slug ${value.slug||'not set'} · Etsy ID ${value.listing_id||'not linked'} · Shop ${value.shop_id||'not verified'}`);
  line(card,value.state==='VERIFIED_READ_ONLY'?`VERIFIED (read-only): ${value.pairs.length} original-to-Etsy photo pairs match the live unpublished draft. No listing or Product write.`:
   `HOLD: ${value.issues.join(' ')} No new Etsy draft or save was attempted.`);
  if(value.pairs.length){const ul=document.createElement('ul');for(const pair of value.pairs)
   line(ul,`Original #${pair.product_image_id} → Etsy photo #${pair.etsy_image_id}${pair.etsy_image_url?' · live Etsy preview available':''}`,'li');card.append(ul);}
  results.append(card);
 }
 button.addEventListener('click',async()=>{
  if(busy)return;const parsed=parseProductIds529(input.value);results.replaceChildren();
  if(parsed.error){status.textContent=parsed.error;return;}
  busy=true;button.disabled=true;status.textContent=`Checking ${parsed.ids.length} saved Product${parsed.ids.length===1?'':'s'} with authenticated read-only requests…`;
  try{
   const oauth=await get('/api/admin/etsy-oauth-acceptance');let checked=0,verified=0;
   for(const id of parsed.ids){
    try{
     const [detail,identity]=await Promise.all([
      get(`/api/admin/product-editor-detail?product_id=${id}`),
      get(`/api/admin/product-etsy-existing-draft?product_id=${id}`)]);
     const unique=Number(identity?.product_id)===id&&identity?.saved_link_readback_confirmed===true&&
      /^[1-9]\d{0,14}$/.test(String(identity?.linked_listing_id||''));
     const photos=await get(`/api/admin/product-etsy-images?product_id=${id}${unique?'&reconcile=1':''}`);
     const verdict=assessOwnerReadback529({productId:id,detail,identity,oauth,photos});
     show(verdict);if(verdict.state==='VERIFIED_READ_ONLY')verified++;
    }catch(error){show({product_id:id,name:'Readback unavailable',sku:'',slug:'',listing_id:null,shop_id:null,
      pairs:[],state:'HOLD',issues:[String(error.message||'Request unavailable').slice(0,250)]});}
    checked++;
   }
   status.textContent=`Read-only review complete: ${verified}/${checked} Products have exact saved IDs and live photo-pair evidence. A green readback does not approve publication or prove an earlier failed browser Save matched every field.`;
  }catch(error){status.textContent=`HOLD — Could not verify Etsy OAuth receipt: ${String(error.message||'unavailable').slice(0,240)}. No Product or Etsy write.`;}
  finally{busy=false;button.disabled=false;}
 });
}
