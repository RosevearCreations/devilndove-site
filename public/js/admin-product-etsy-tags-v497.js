/* Build 497: one deliberate tag-only write to the existing Canada-only Etsy
   draft, using saved Product SEO tags and fresh provider readback. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),form=$('productEditorForm');
 const id=Number(new URLSearchParams(location.search).get('product_id')||0);
 if(!form||!$('dd497NativeTags')||!window.DDAuth?.apiFetch)return;
 let busy=false,local=null,remote=null,needsReview=false;
 const saved=()=>id>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
 const say=message=>{$('dd497TagsStatus').textContent=message;};
 async function api(path,body){
  const response=await window.DDAuth.apiFetch(path,{method:body?'POST':'GET',cache:'no-store',
   ...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.ok)throw Error(data?.error||`HTTP ${response.status}`);
  return data;
 }
 function controls(){
  $('dd497TagsLoad').disabled=busy||!saved();
  $('dd497TagsCompare').disabled=busy||!saved();
  $('dd497TagsSend').disabled=busy||!saved()||needsReview||!local?.ready||local?.unresolved_attempt||
   !remote?.verified_draft||!remote?.verified_canada_only||remote?.unresolved_attempt||
   !remote?.listing_id||remote?.matching_tags||!$('dd497TagsConsent').checked;
 }
 function list(){
  const root=$('dd497TagsList');root.replaceChildren();
  if(!local){return;}
  for(const tag of local.local_tags||[]){const li=document.createElement('li');li.textContent=tag;root.append(li);}
  for(const issue of local.blockers||[]){const li=document.createElement('li');li.textContent='HOLD — '+issue;root.append(li);}
 }
 async function load(){if(busy||!saved())return;busy=true;controls();remote=null;needsReview=false;
  say('Reading saved Product SEO or explicit Etsy channel override tags from D1; nothing sent to Etsy.');
  try{local=await api(`/api/admin/product-etsy-tags?product_id=${id}`);list();
   say(local.unresolved_attempt?'HOLD — a previous Etsy tag update has no confirmed receipt. Inspect Etsy before another attempt.':
    local.ready?`${local.local_tags.length} valid saved search tags (${local.tag_source||'shared Product'}). Compare against the actual Etsy draft before authorizing any replacement.`:
     'HOLD — save valid tags under the Product SEO fields first. No Etsy action.');
  }catch(error){local=null;say('HOLD — '+error.message);}
  finally{busy=false;controls();}
 }
 async function compare(){if(busy||!saved())return;busy=true;controls();
  say('Checking the same unpublished Etsy draft and its actual native tags; read only…');
  try{const data=await api(`/api/admin/product-etsy-tags?product_id=${id}&reconcile=1`);
   local=data;remote=data;needsReview=false;list();$('dd497TagsConsent').checked=false;
   say(data.unresolved_attempt?'HOLD — prior write not fully confirmed. Live comparison is informational; no repeat allowed.':
    data.matching_tags?`Verified ✓ Etsy draft #${data.listing_id} already has all ${data.remote_tags.length} saved native tags. Nothing to send.`:
     `Verified existing Canada-only draft #${data.listing_id}. It currently has ${data.remote_tags?.length??'?'} Etsy tags; our ${data.local_tags.length} saved tags differ. Check the list and explicitly approve replacing just the tags.`);
  }catch(error){remote=null;needsReview=true;say('HOLD — '+error.message+'. No tags were sent.');}
  finally{busy=false;controls();}
 }
 async function send(){if(busy||!saved()||!remote?.listing_id||!local?.ready||needsReview||
   !remote.verified_canada_only||!$('dd497TagsConsent').checked||!globalThis.crypto?.randomUUID)return;
  busy=true;controls();say(`One explicit native-tag update to unpublished Etsy draft #${remote.listing_id} is in progress. Do not retry…`);
  const request={action:'update_native_tags',product_id:id,listing_id:remote.listing_id,
   reviewed_tags:local.local_tags,request_key:globalThis.crypto.randomUUID(),confirm_saved_product_tags:true,
   confirm_replace_existing_tags:true,confirm_unpublished_only:true,confirm_canada_only:true};
  try{const data=await api('/api/admin/product-etsy-tags',request);
   if(data.native_tags_verified!==true)throw Error('Etsy readback was not verified.');
   remote={...remote,matching_tags:true,remote_tags:data.remote_tags};
   $('dd497TagsConsent').checked=false;
   say(`Verified ✓ Etsy draft #${data.listing_id} now has ${data.remote_tags.length} approved search tags, confirmed by a fresh Etsy read. The listing remains unpublished.`);
   document.dispatchEvent(new CustomEvent('dd:etsy-native-tags-verified',{detail:{product_id:id,listing_id:data.listing_id}}));
  }catch(error){needsReview=true;remote=null;
   say('HOLD — '+error.message+' Inspect the actual Etsy draft before attempting any further write. No automatic retry.');}
  finally{busy=false;controls();}
 }
 $('dd497TagsLoad').addEventListener('click',()=>void load());
 $('dd497TagsCompare').addEventListener('click',()=>void compare());
 $('dd497TagsSend').addEventListener('click',()=>void send());
 $('dd497TagsConsent').addEventListener('change',controls);
 function reset(){local=null;remote=null;needsReview=false;$('dd497TagsConsent').checked=false;
  say('Saved Product or draft linkage changed. Review saved tags and compare Etsy again before updating.');controls();}
 form.addEventListener('input',controls);document.addEventListener('dd:save-succeeded',reset);
 document.addEventListener('dd:etsy-existing-draft-updated',reset);
 document.addEventListener('dd:etsy-existing-draft-linked',reset);
 document.addEventListener('dd:product-channel-tags-changed',reset);
 document.addEventListener('dd:product-loaded',controls);
 controls();
})();
