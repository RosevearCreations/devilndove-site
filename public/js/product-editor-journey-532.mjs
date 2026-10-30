/* Build 532: short, local-only guidance for one EXISTING Product. This module
 * performs no network requests and no Product/Etsy/Marketplace writes. */
export function existingEtsyJourney532({productId,loaded,dirty,etsyChecked,channelLoaded,
 name,description,price,quantity,weightGrams,listingId}={}){
 const id=Number(productId);
 if(!Number.isSafeInteger(id)||id<1)return {step:'OPEN_PRODUCT',tab:'basics',
  message:'Start in Products and choose Edit on an existing item. Its saved Product number must appear here.'};
 if(!loaded)return {step:'LOAD_PRODUCT',tab:'basics',
  message:`Product #${id}: wait for its saved details, then review the fields. Do not save from an incomplete load.`};
 const p=Number(price),q=Number(quantity),w=Number(weightGrams);
 if(!String(name||'').trim())return {step:'NAME',tab:'basics',message:'Enter the item name under Basics.'};
 if(!Number.isFinite(p)||p<=0||!Number.isSafeInteger(q)||q<1)
  return {step:'PRICE_STOCK',tab:'pricing',message:'Enter a positive CAD price and at least one item in stock.'};
 if(!String(description||'').trim())return {step:'DESCRIPTION',tab:'description',
  message:'Enter the item description. The Etsy draft uses the saved Product description.'};
 if(!Number.isFinite(w)||w<=0)return {step:'WEIGHT',tab:'pricing',
  message:'Enter the item weight in grams. Packaged shipping measurements are a separate Etsy setup field.'};
 if(!etsyChecked)return {step:'SELECT_ETSY',tab:'basics',
  message:'Check “Etsy — create or update draft” under the main Save Product button.'};
 if(dirty||!channelLoaded)return {step:'SAVE_PRODUCT',tab:'basics',
  message:'Press Save Product once. Wait for Saved ✓ and saved destination choices before touching Etsy.'};
 const draft=/^[1-9]\d{0,14}$/.test(String(listingId||''))?String(listingId):'';
 return {step:'REVIEW_DRAFT',tab:'basics',message:draft?
  `Product #${id} is linked to Etsy draft #${draft}. Use “Check images & Etsy settings”, then confirm one UPDATE of this draft.`:
  `Product #${id} has no verified linked Etsy ID in this screen. Check Etsy Drafts for an older copy first, then use “Check images & Etsy settings” to prepare one unpublished draft.`};
}

const $=id=>typeof document==='undefined'?null:document.getElementById(id);
const root=$('dd532Journey'),form=$('productEditorForm');
if(root&&form){
 const id=Number(new URLSearchParams(location.search).get('product_id')||0),status=$('dd532Next');
 let listingId='';
 const field=name=>String(form.elements.namedItem(name)?.value||'').trim();
 const render=()=>{const verdict=existingEtsyJourney532({productId:id,
  loaded:form.dataset.productAuthority==='ready',dirty:form.dataset.productDirty==='1'||window.DDProductChannels405?.isDirty?.(),
  channelLoaded:window.DDProductChannels405?.isLoaded?.(),etsyChecked:!!$('productChannel405Etsy')?.checked,
  name:field('name'),description:field('description')||field('short_description'),price:field('price'),
  quantity:field('inventory_quantity'),weightGrams:field('weight_grams'),listingId});
  status.textContent=verdict.message;
  root.dataset.step=verdict.step;
  const quick=$('dd532NextButton');if(quick){quick.dataset.tab=verdict.tab;
   quick.textContent=verdict.step==='REVIEW_DRAFT'?'Check original photos and Etsy setup':
    verdict.step==='SAVE_PRODUCT'?'Go to Save Product':verdict.step==='SELECT_ETSY'?'Go to Etsy checkbox':
    verdict.step==='OPEN_PRODUCT'?'Open Products':'Go to '+verdict.tab.replace(/\b\w/g,x=>x.toUpperCase());}
 };
 root.addEventListener('click',event=>{const button=event.target.closest('[data-dd532-jump]');if(!button)return;
  const target=button.dataset.dd532Jump;
  if(target==='products'){location.assign('/admin/products/');return;}
  if(target==='save'){ $('productEditorSave')?.scrollIntoView({behavior:'smooth',block:'center'});$('productEditorSave')?.focus({preventScroll:true});return;}
  if(target==='channels'){ $('productChannel405')?.scrollIntoView({behavior:'smooth',block:'center'});$('productChannel405Etsy')?.focus({preventScroll:true});return;}
  if(target==='review'){ $('dd523Review')?.scrollIntoView({behavior:'smooth',block:'center'});$('dd523Review')?.focus({preventScroll:true});return;}
  const tab=document.querySelector(`[data-editor-tab="${target}"]`);tab?.click();tab?.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 $('dd532NextButton')?.addEventListener('click',()=>{const step=root.dataset.step;
  const target=step==='OPEN_PRODUCT'?'products':step==='SAVE_PRODUCT'?'save':
   step==='SELECT_ETSY'?'channels':step==='REVIEW_DRAFT'?'review':
   $('dd532NextButton')?.dataset.tab||'basics';
  const shortcut=root.querySelector(`[data-dd532-jump="${target}"]`);
  if(shortcut)shortcut.click();else document.querySelector(`[data-editor-tab="${target}"]`)?.click();
  if(target==='review')$('dd523Review')?.focus({preventScroll:true});
 });
 document.addEventListener('dd:etsy-draft-flow-523-complete',event=>{
  if(Number(event.detail?.product_id)===id){listingId=String(event.detail.listing_id||'');render();}
 });
 document.addEventListener('dd:etsy-saved-receipt-532',event=>{
  if(Number(event.detail?.product_id)===id){listingId=event.detail.verified?String(event.detail.listing_id||''):'';render();}
 });
 $('dd498IdentityRefresh')?.addEventListener('click',()=>{listingId='';render();});
 document.addEventListener('dd:product-loaded',render);
 document.addEventListener('dd:product-channel-loaded',render);
 document.addEventListener('dd:save-succeeded',render);
 form.addEventListener('input',render);form.addEventListener('change',render);
 render();
}
