/* Build 493: explain real, live owner-facing gate conditions. No Etsy writes/retries. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),box=$('dd493EtsyBlockers'),form=$('productEditorForm');
 if(!box||!form)return;
 const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
 let loaded=form.dataset.productAuthority==='ready',failed=form.dataset.productAuthority==='failed',mode='';
 const val=id=>String($(id)?.value||'').trim(),field=name=>String(form.elements.namedItem(name)?.value||'').trim();
 const checked=id=>Boolean($(id)?.checked);
 function issues(){const errors=[];
  if(!productId)errors.push('Save the new Product once before creating or updating an Etsy draft.');
  else if(!loaded)errors.push(failed?'Product details did not load from Cloudflare. Press Retry load at the bottom; do not re-create this Product.':'Wait for the saved Product to finish loading.');
  if(form.dataset.productDirty==='1')errors.push('Save Product edits first. Etsy only reads saved Product fields.');
  if(!field('name'))errors.push('Enter the Product name in Basics.');
  if(!field('description')&&!field('short_description'))errors.push('Enter a short OR long Product description, then Save Product.');
  if(!(Number(field('price'))>0))errors.push('Enter a CAD price above $0 in Pricing & Stock, then Save Product.');
  if(!(Number(field('inventory_quantity'))>0))errors.push('Set available inventory to at least 1, then Save Product.');
  if(!mode){errors.push('Choose Create a NEW Etsy draft or UPDATE my existing Etsy draft above.');return errors;}
  if(mode==='new'){
   if(!val('dd438EtsyCategory'))errors.push('Choose a verified Etsy category. If empty, press Test connection to load Etsy dropdowns.');
   if(!val('dd439EtsyShipping'))errors.push('Choose an Etsy shipping profile and verify Canada-only destinations.');
   if(!val('dd439EtsyReadiness'))errors.push('Choose an Etsy processing profile.');
   if(!['dd442EtsyWeight','dd442EtsyLength','dd442EtsyWidth','dd442EtsyHeight'].every(id=>Number(val(id))>0))errors.push('Enter measured packed weight, length, width and height.');
   if(!checked('dd439EtsyCanadaConfirm'))errors.push('Confirm the chosen shipping profile is Canada-only.');
   if(!checked('dd438EtsyConfirm'))errors.push('Confirm one unpublished draft attempt.');
   if($('dd438EtsyCreate')?.disabled)errors.push('The provider preflight is not ready. Read the Etsy connection/product/shipping status above; press Test connection after correcting saved fields.');
  }else{
   if(!val('dd486EtsyListingId'))errors.push('Enter the exact listing ID from Etsy Drafts or press Check linked Etsy draft.');
   if(!checked('dd486EtsyUpdateConfirm'))errors.push('Approve updating the verified existing unpublished draft.');
   if($('dd486EtsyUpdate')?.disabled)errors.push('Existing draft is not yet verified and linked, or an earlier update is uncertain. Use the existing-draft verify/link controls and read their status; never blindly retry.');
  }
  if(!checked('dd490Authorize'))errors.push('Finally check the one-attempt owner authorization box immediately above Send.');
  return errors;
 }
 function render(){const problems=issues();box.replaceChildren();for(const problem of problems){const li=document.createElement('li');li.textContent=problem;box.append(li);}
  $('dd493EtsyRepairStatus').textContent=problems.length?`${problems.length} item(s) to check. These are live browser checks; the server still verifies Etsy authorization and draft state.`:
   'Local checklist complete. Press Send only if the button is enabled after the server/provider preflight. No Etsy operation ran during this check.';
 }
 document.addEventListener('dd:product-loaded',()=>{loaded=true;failed=false;render();});
 document.addEventListener('dd:product-load-failed',()=>{loaded=false;failed=true;render();});
 document.addEventListener('dd:etsy-draft-mode-changed',event=>{mode=event.detail?.mode||'';render();});
 document.addEventListener('dd:save-succeeded',()=>{loaded=form.dataset.productAuthority==='ready';render();});
 for(const type of ['input','change'])form.addEventListener(type,render);
 for(const id of ['dd438EtsyCreate','dd486EtsyUpdate','dd490Dispatch']){const button=$(id);if(button)new MutationObserver(render).observe(button,{attributes:true,attributeFilter:['disabled']});}
 if($('dd488ChooseNew')?.getAttribute('aria-pressed')==='true')mode='new';
 else if($('dd488ChooseExisting')?.getAttribute('aria-pressed')==='true')mode='existing';
 render();
})();
