/* Build 486: deliberate existing-draft reconciliation and update; never creates/publishes. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),id=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(!$('dd486EtsyExisting')||!window.DDAuth?.apiFetch)return;
 const form=$('productEditorForm'),state={busy:false,linked:null,uncertain:false,inspected:null,titleMatches:false};
 const say=(name,value)=>{if($(name))$(name).textContent=value;};
 const dirty=()=>form?.dataset.productDirty==='1';
 async function api(path,body){const r=await window.DDAuth.apiFetch(path,{method:body?'POST':'GET',cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})}),x=await r.json().catch(()=>({error:'Unreadable server response.'}));if(!r.ok||!x.ok)throw Error(x.error||`HTTP ${r.status}`);return x;}
 function buttons(){const valid=/^[1-9]\d{0,14}$/.test(String($('dd486EtsyListingId').value||''));$('dd486EtsyExistingLoad').disabled=state.busy||!id;
  $('dd486EtsyInspect').disabled=state.busy||!id||Boolean(state.linked)||!valid||!$('dd486EtsyLinkConfirm').checked;
  $('dd486EtsyLink').disabled=state.busy||!id||Boolean(state.linked)||!valid||state.inspected!==String($('dd486EtsyListingId').value)||!$('dd486EtsyLinkConfirm').checked||(!state.titleMatches&&!$('dd486EtsyOlderTitle').checked);
  $('dd486EtsyUpdate').disabled=state.busy||!id||!state.linked||state.uncertain||dirty()||!$('dd486EtsyUpdateConfirm').checked;
 }
 async function load(){if(state.busy||!id)return;state.busy=true;buttons();say('dd486EtsyExistingStatus','Reading only our saved Product-to-Etsy draft receipt…');
  try{const x=await api(`/api/admin/product-etsy-existing-draft?product_id=${id}`);state.linked=x.linked_listing_id||null;
   if(state.linked){$('dd486EtsyListingId').value=String(state.linked);say('dd486EtsyExistingStatus',`Existing Etsy draft #${state.linked} linked (${x.linked_source}). No new draft needed. Confirm current Etsy state before updating.`);}
   else say('dd486EtsyExistingStatus','No Product Editor link found. If you already have this draft in Etsy, enter its exact listing ID here; do not press Create draft again.');
  }catch(e){state.linked=null;say('dd486EtsyExistingStatus','HOLD — '+e.message);}finally{state.busy=false;buttons();}}
 async function action(name){if(state.busy||!id||dirty()){say('dd486EtsyUpdateStatus','Save the Product first, then load its existing Etsy draft. No provider write.');return;}
  state.busy=true;buttons();const link=name==='link_existing',inspect=name==='inspect_listing';const target=link||inspect?'dd486EtsyExistingStatus':'dd486EtsyUpdateStatus';
  say(target,inspect?'Verifying Etsy listing identity, unpublished state and Canada-only shipping without changing anything…':link?'Linking a verified existing Etsy draft to this Product without a provider write…':'Updating saved fields on the linked unpublished Etsy draft once; do not retry if the outcome is uncertain…');
  try{const x=await api('/api/admin/product-etsy-existing-draft',{action:name,product_id:id,listing_id:$('dd486EtsyListingId').value,
   request_key:crypto.randomUUID(),confirm_unpublished_only:true,confirm_canada_only:true,confirm_exact_etsy_listing:(link||inspect)&&$('dd486EtsyLinkConfirm').checked,confirm_prior_title_difference:link&&!state.titleMatches&&$('dd486EtsyOlderTitle').checked,confirm_saved_product_fields:!link&&!inspect&&$('dd486EtsyUpdateConfirm').checked});
   if(inspect){state.inspected=String(x.listing_id);state.titleMatches=x.title_matches===true;
    say('dd486EtsyPreview',`Verified draft #${x.listing_id}; Etsy title: “${x.etsy_title}”; saved Product title: “${x.product_title}”. ${state.titleMatches?'Titles match.':'Titles differ: independently confirm the older title represents this same Product before linking.'} Canada-only shipping confirmed. No Etsy change.`);
    say(target,'Original Etsy draft verified; linking now requires the exact reviewed listing ID.');return;}
   state.linked=String(x.listing_id);$('dd486EtsyListingId').value=state.linked;
   say(target,link?`Verified and linked existing Etsy draft #${state.linked} without creating or changing it. Load approved photos below.`:
    `Etsy confirmed title, description, price and quantity updated on existing unpublished draft #${state.linked}. Photos require separate approval and transfer below.`);
   if(!link)$('dd486EtsyUpdateConfirm').checked=false;
  }catch(e){if(!link&&!inspect)state.uncertain=true;say(target,'HOLD — '+e.message+(link||inspect?' No link created.':' Inspect the real Etsy draft manually before any retry.'));}
  finally{state.busy=false;buttons();}}
 $('dd486EtsyExistingLoad').addEventListener('click',()=>void load());$('dd486EtsyInspect').addEventListener('click',()=>void action('inspect_listing'));$('dd486EtsyLink').addEventListener('click',()=>void action('link_existing'));
 $('dd486EtsyUpdate').addEventListener('click',()=>void action('update_saved_fields'));
 for(const x of ['dd486EtsyListingId','dd486EtsyLinkConfirm','dd486EtsyOlderTitle','dd486EtsyUpdateConfirm'])for(const kind of ['input','change'])$(x).addEventListener(kind,()=>{if(x==='dd486EtsyListingId'||x==='dd486EtsyLinkConfirm'){state.inspected=null;state.titleMatches=false;say('dd486EtsyPreview','Listing choice changed. Verify again before linking.');}buttons();});
 form?.addEventListener('input',buttons);form?.addEventListener('change',buttons);
 document.addEventListener('dd:save-succeeded',()=>{state.linked=null;state.inspected=null;$('dd486EtsyUpdateConfirm').checked=false;say('dd486EtsyExistingStatus','Product saved. Reloading the existing link (read only); reapprove the update afterward.');buttons();if(id)void load();});
 if(id)void load();else say('dd486EtsyExistingStatus','Save Product first to link an existing Etsy draft.');buttons();
})();
