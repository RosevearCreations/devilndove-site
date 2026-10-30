/* Build 530: one explicit owner action, bounded GETs for up to three Products,
 * then a separate, fully informed per-Product LOCAL approval action if ready.
 * Never creates/updates/publishes an Etsy listing or resends a Product Save. */
import {parseProductIds529,assessOwnerReadback529} from './etsy-owner-readback-529.mjs';
import {savedBrowserOutcome530,assessSoapClosure530} from './etsy-three-soap-closure-530.mjs';
const $=id=>document.getElementById(id);
const check=$('dd529Check'),input=$('dd529ProductIds'),status=$('dd529Status'),results=$('dd529Results');
if(check&&input&&status&&results&&window.DDAuth?.apiFetch){
 const selected=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(Number.isSafeInteger(selected)&&selected>0)input.value=String(selected);
 let busy=false;
 const line=(root,content,tag='p')=>{const node=document.createElement(tag);node.textContent=content;root.append(node);return node;};
 const get=async path=>window.DDAuth.readApiJson(await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'}),
  {fallbackMessage:'Saved Product/Etsy readback unavailable.'});
 const post=async(path,payload)=>window.DDAuth.readApiJson(await window.DDAuth.apiFetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),
  {fallbackMessage:'Owner receipt not confirmed.'});
 function browserReceipt(id){try{return JSON.parse(sessionStorage.getItem(`dnd:product:uncertain-save:521:${id}`)||'null');}
  catch{return null;}}
 function resultCard(id){const node=document.createElement('article');node.className='dd529-result dd530-result';
  line(node,`Saved Product #${id}`,'h4');results.append(node);return node;}
 function render(id,card,readback,content,save,closure){
  card.replaceChildren();line(card,`Product #${id} · ${readback.name||'Name unavailable'} · SKU ${readback.sku||'not set'}`,'h4');
  line(card,`Slug ${readback.slug||'not set'} · Etsy draft ${readback.listing_id||'not linked'} · shop ${readback.shop_id||'not verified'}`);
  const saveInfo=line(card,`Saved Product: ${save.message}`);saveInfo.className='dd530-save';
  if(save.state==='REVIEW_SAVED_FIELDS')line(card,`Fields needing comparison: ${[...(save.differences||[]),...(save.unavailable||[])].slice(0,15).join(', ')||'saved Product unavailable'}`);
  line(card,`Etsy content: ${content?.ready===true?'Live draft title, description, CAD price, quantity, category and tags matched':'HOLD — live content or photo evidence did not match'}`);
  if(content?.tag_readback_530){const tag=content.tag_readback_530;
   line(card,`Native Etsy tags (${Array.isArray(tag.saved_tags)?tag.saved_tags.length:0}): saved [${(tag.saved_tags||[]).join(', ')}]`);
   line(card,`Live Etsy tags: [${(tag.etsy_tags||[]).join(', ')}] · ${tag.match?'MATCH':'HOLD'}`);}
  if(readback.pairs?.length){const photos=document.createElement('ul');
   for(const pair of readback.pairs)line(photos,`Original photo #${pair.product_image_id} → live Etsy photo #${pair.etsy_image_id}`,'li');card.append(photos);}
  const decision=line(card,`${closure.state}: ${closure.issues.join(' ')||'All saved Product/Etsy content evidence matches. The Etsy listing stays unpublished.'}`);
  decision.className=closure.state==='HOLD'?'dd530-held':'dd530-ready';
  if(closure.state==='OWNER_RECEIPT_CURRENT'){
   line(card,'Owner acceptance is already recorded for this exact evidence fingerprint. No duplicate approval is needed.');return;}
  if(closure.state!=='READY_FOR_EXPLICIT_OWNER_ACCEPTANCE'){
   line(card,'No owner acceptance action is available. Review the saved Product, connection and Etsy draft first.');return;}
  const label=document.createElement('label');label.className='dd530-consent';
  const box=document.createElement('input');box.type='checkbox';
  label.append(box,document.createTextNode(' I personally reviewed this saved Product and its exact live Etsy draft, original photos, native tags, CAD price, Canada-only shipping and unpublished status. Record my local owner acceptance.'));
  card.append(label);
  const confirm=document.createElement('button');confirm.type='button';confirm.className='btn';confirm.textContent='Record owner acceptance (local only)';confirm.disabled=true;card.append(confirm);
  const feedback=line(card,'Etsy will remain a draft. Only one local owner audit receipt is written when explicitly confirmed.');
  box.addEventListener('change',()=>{confirm.disabled=!box.checked;});
  confirm.addEventListener('click',async()=>{
   if(!box.checked||confirm.disabled)return;
   confirm.disabled=true;box.disabled=true;feedback.textContent='Rechecking this exact live draft and recording the owner receipt…';
   try{
    if(!window.crypto?.randomUUID)throw Error('Secure browser request ID unavailable. No approval attempted.');
    const response=await post('/api/admin/product-etsy-owner-signoff-504',{
     action:'approve_verified_draft_530',product_id:id,listing_id:readback.listing_id,
     expected_evidence_fingerprint_508:content.evidence_fingerprint_508,request_key:window.crypto.randomUUID(),
     confirm_actual_etsy_content:true,confirm_canada_only:true,confirm_unpublished_only:true});
    if(response.owner_approval_recorded!==true||String(response.listing_id)!==String(readback.listing_id))
     throw Error('The exact owner receipt was not confirmed.');
    feedback.textContent=response.already_recorded?'This exact evidence already had an owner receipt. No new write.':
     'Owner receipt recorded for the exact Etsy draft. Product and Etsy listing were not modified or published.';
    label.remove();confirm.remove();
   }catch(error){feedback.textContent=`HOLD — ${String(error.message||'Receipt outcome unknown').slice(0,250)}. Run a fresh read-only check before considering another owner action. No automatic retry.`;}
  });
 }
 check.addEventListener('click',async()=>{
  if(busy)return;const chosen=parseProductIds529(input.value);results.replaceChildren();
  if(chosen.error){status.textContent=chosen.error;return;}
  busy=true;check.disabled=true;status.textContent=`Reading current D1 and Etsy evidence for ${chosen.ids.length} saved Product${chosen.ids.length===1?'':'s'}…`;
  let cleared=0;
  try{
   const oauth=await get('/api/admin/etsy-oauth-acceptance');
   for(const id of chosen.ids){const card=resultCard(id);
    try{
     const [detail,identity]=await Promise.all([get(`/api/admin/product-editor-detail?product_id=${id}`),
      get(`/api/admin/product-etsy-existing-draft?product_id=${id}`)]);
     const unique=Number(identity?.product_id)===id&&identity.saved_link_readback_confirmed===true&&
      /^[1-9]\d{0,14}$/.test(String(identity.linked_listing_id||''));
     const photos=await get(`/api/admin/product-etsy-images?product_id=${id}${unique?'&reconcile=1':''}`);
     const readback=assessOwnerReadback529({productId:id,detail,identity,oauth,photos});
     let content=null;
     if(readback.state==='VERIFIED_READ_ONLY'){
      try{content=await get(`/api/admin/product-etsy-owner-signoff-504?product_id=${id}`);}
      catch(error){content={ready:false,issues:[String(error.message||'Etsy content read unavailable').slice(0,230)]};}}
     const save=savedBrowserOutcome530({productId:id,saved:detail.product,stored:browserReceipt(id)});
     const closure=assessSoapClosure530({productId:id,readback,content,save});
     if(closure.state!=='HOLD')cleared++;
     render(id,card,readback,content,save,closure);
    }catch(error){line(card,`HOLD — ${String(error.message||'Unverified Product/Etsy readback').slice(0,230)}. No Etsy or Product write attempted.`);}
   }
   status.textContent=`Review complete: ${cleared}/${chosen.ids.length} Products have matching current Etsy draft, image and tag evidence. Owner acceptance is separate and explicit. Missing browser Save history never proves a failed POST succeeded.`;
  }catch(error){status.textContent=`HOLD — Etsy OAuth/shop receipt unavailable: ${String(error.message||'connection unavailable').slice(0,250)}. No Product or listing write.`;}
  finally{busy=false;check.disabled=false;}
 });
}
