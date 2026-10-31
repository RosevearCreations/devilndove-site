/* Build 538: put the true one-soap correction path on one Product screen.
 * Copy insertion changes only unsaved editor fields. The separate shared-tag
 * action changes local routing only, never Etsy; external writes still demand
 * the existing explicit Etsy draft/photo/tag owner consent controls. */
import {sweetOrangeListing538} from './etsy-sweet-orange-copy-538.mjs';
const $=id=>document.getElementById(id),form=$('productEditorForm'),root=$('dd538Pilot');
const id=Number(new URLSearchParams(location.search).get('product_id')||0);

if(root&&id===54&&form&&window.DDAuth?.apiFetch){
 root.hidden=false;
 const ingredient=$('dd538Ingredients'),net=$('dd538NetWeight'),owner=$('dd538FactsConfirm');
 const fill=$('dd538Fill'),tags=$('dd538SharedTags'),status=$('dd538PilotStatus');
 let busy=false;
 const say=(message,hold=false)=>{status.textContent=message;status.dataset.tone=hold?'hold':'ok';};
 const saved=()=>form.dataset.productDirty!=='1'&&form.dataset.productAuthority==='ready';
 const field=name=>form.elements.namedItem(name);
 const get=async path=>{
  const response=await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'});
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result?.ok)throw Error(result?.error||`HTTP ${response.status}`);
  return result;
 };
 function copyReady(){
  const prepared=sweetOrangeListing538({ingredients:ingredient.value,netWeightGrams:net.value});
  fill.disabled=busy||!owner.checked||!prepared.ready;
  $('dd538FactsStatus').textContent=prepared.ready?'Soap facts complete. Review and explicitly apply the proposed fields; nothing is posted.':
   'Needed for an accurate sale-ready soap description: '+prepared.blockers.join(' ');
 }
 function recoverFacts(){
  const existing=String(field('description')?.value||'');
  if(!ingredient.value.trim()){
   const match=existing.match(/(?:^|\n)\s*ingredients?\s*:\s*([^\n\[\]]{12,1500})/i);
   if(match)ingredient.value=match[1].trim();
  }
  if(!net.value.trim()){
   // Only use an explicit saved soap NET weight, never parcel/shipping weight.
   const weight=existing.match(/Net weight of soap \(without packaging\)\s*:\s*(\d+(?:\.\d+)?)\s*g\b/i);
   if(weight)net.value=weight[1];
  }
  copyReady();
 }
 fill.addEventListener('click',()=>{
  const proposed=sweetOrangeListing538({ingredients:ingredient.value,netWeightGrams:net.value});
  if(!proposed.ready||!owner.checked)return;
  for(const [name,value] of [['name',proposed.title],['short_description',proposed.short],
   ['description',proposed.description],['keywords',proposed.tags.join(', ')]]){
    const input=field(name);if(!input)return say(`Product Editor field ${name} is missing. Nothing applied.`,true);
    input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  owner.checked=false;copyReady();
  say('Sweet Orange title, accurate owner-confirmed ingredient/weight description and 13 compliant search phrases are now in the editor. Click the existing Save Product button. Etsy has NOT been updated.');
  $('productEditorSave')?.scrollIntoView({block:'center',behavior:'smooth'});
 });
 tags.addEventListener('click',async()=>{
  if(busy||!saved())return say('Save the Product and its new search tags first. Nothing sent to Etsy.',true);
  busy=true;tags.disabled=true;say('Checking saved Product search tags before switching Etsy to this one shared list…');
  try{
   const current=await get(`/api/admin/product-channel-tags-499?product_id=${id}`);
   const shared=String(current.shared_keywords||'').split(',').map(tag=>tag.trim()).filter(Boolean);
   if(Number(current.product_id)!==id||shared.length<1||shared.length>13||
      shared.some(tag=>[...tag].length>20)||new Set(shared.map(tag=>tag.toLowerCase())).size!==shared.length)
    throw Error('Saved Product search tags need 1–13 unique Etsy phrases, each at most 20 characters. Review the SEO field and Save Product.');
   const response=await window.DDAuth.apiFetch('/api/admin/product-channel-tags-499',{
    method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({
     product_id:id,channel:'etsy',mode:'shared',tags:[],confirm_local_tags_only:true,request_key:crypto.randomUUID()
    })});
   const result=await response.json().catch(()=>null);
   if(!response.ok||!result?.ok||result.override?.mode!=='shared'||result.saved_locally!==true)
    throw Error(result?.error||'Shared tag selection was not confirmed.');
   say(`Etsy now selects the SAME saved Product search phrases locally (${result.etsy_effective?.tags?.length||'verified'} phrases). Review and explicitly update the native Etsy tags on draft #4601705477; this action did NOT post to Etsy.`);
   document.dispatchEvent(new CustomEvent('dd:product-channel-tags-changed',{detail:{product_id:id,channel:'etsy'}}));
  }catch(error){say('HOLD — '+String(error.message||'tag readback unavailable')+'. Check the saved tags before retrying. No Etsy write.',true);}
  finally{busy=false;tags.disabled=false;}
 });
 $('dd538Photos').addEventListener('click',()=>{
  $('dd535GoPhotoSync')?.click();
  say('The photo action is bound to the SAME existing Etsy draft. Check its real photo inventory, then explicitly authorize a one-time transfer only if Etsy still has no matching photos.');
 });
 $('dd538NativeTags').addEventListener('click',()=>{$('dd537Tags')?.click();
  say('Review the native Etsy tags on this exact draft; approve the separate update only if the live tags differ.');});
 $('dd538Final').addEventListener('click',()=>{$('dd537Final')?.click();
  say('The final readback will show real Product, Etsy photo, native tag, Canada-only delivery and owner evidence. Publishing is still performed in Etsy after our review.');});
 for(const input of [ingredient,net,owner])for(const event of ['input','change'])input.addEventListener(event,copyReady);
 document.addEventListener('dd:product-loaded',recoverFacts);
 document.addEventListener('dd:save-succeeded',()=>{copyReady();say('Product Save confirmed. Next: select the shared Etsy tags, then check actual missing photos on the same unpublished draft.');});
 copyReady();recoverFacts();
}else if(root)root.hidden=true;
