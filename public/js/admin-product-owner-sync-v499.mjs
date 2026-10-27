/* Build 499: owner's explicit local channel tag overrides and one-shot Etsy
 * metadata-only approval. Every external write requires a fresh provider
 * comparison and consent; no automatic retry or photo upload in this module. */
const $=id=>document.getElementById(id);
const form=$('productEditorForm');
const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
if(form&&$('dd499TagsChannel')&&window.DDAuth?.apiFetch){
 const saved=()=>productId>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
 const clean=x=>String(x??'').trim();
 const message=(id,value,hold=false)=>{const el=$(id);if(el){el.textContent=value;el.dataset.tone=hold?'hold':'';}};
 async function api(path,body){
  const response=await window.DDAuth.apiFetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}:{method:'GET',cache:'no-store'});
  const value=await response.json().catch(()=>null);
  if(!response.ok||!value?.ok)throw Error(value?.error||`HTTP ${response.status}`);
  return value;
 }
 const tagState={data:null,busy:false,uncertain:false};
 const channel=()=>$('dd499TagsChannel').value;
 function tagControls(){
  const locked=!saved()||tagState.busy;
  $('dd499TagsLoad').disabled=locked;
  $('dd499TagsSave').disabled=locked||!tagState.data||tagState.uncertain;
  $('dd499TagsValue').disabled=locked||$('dd499TagsMode').value!=='override';
 }
 function channelView(){
  const profile=tagState.data?.overrides?.[channel()]||{mode:'shared',tags:[]};
  $('dd499TagsMode').value=profile.mode;
  $('dd499TagsValue').value=profile.tags.join(', ');
  tagControls();
  const shared=tagState.data?.shared_keywords||'';
  message('dd499TagsStatus',tagState.data?`${channel()} uses ${profile.mode==='override'?'its own explicitly saved phrases':'the shared Product SEO phrases'}. Shared: ${shared||'(none)'}. Etsy override tags must meet its native 13-tag/20-character limits. Local-only until a separate approved provider action.`:'Load saved channel tag settings first.');
 }
 async function loadTags(){
  if(!saved()||tagState.busy)return;
  tagState.busy=true;tagControls();message('dd499TagsStatus','Reading saved Product phrases and channel overrides…');
  try{const data=await api(`/api/admin/product-channel-tags-499?product_id=${productId}`);
   if(Number(data.product_id)!==productId)throw Error('Product identity changed.');
   tagState.data=data;tagState.uncertain=false;channelView();
  }catch(error){tagState.data=null;message('dd499TagsStatus','HOLD — '+error.message,true);}
  finally{tagState.busy=false;tagControls();}
 }
 async function saveTags(){
  if(!saved()||tagState.busy||tagState.uncertain||!tagState.data)return;
  const selected=channel(),mode=$('dd499TagsMode').value,raw=$('dd499TagsValue').value;
  tagState.busy=true;tagControls();message('dd499TagsStatus','Saving the selected destination phrases locally; no provider write…');
  try{const data=await api('/api/admin/product-channel-tags-499',{product_id:productId,channel:selected,mode,tags:mode==='override'?raw.split(',').map(clean).filter(Boolean):[],confirm_local_tags_only:true,request_key:crypto.randomUUID()});
   if(Number(data.product_id)!==productId||data.channel!==selected||data.override?.mode!==mode)throw Error('Saved channel override readback did not match.');
   tagState.data.overrides[selected]=data.override;
   tagState.uncertain=false;
   channelView();message('dd499TagsStatus',`Saved ✓ ${selected} now uses ${mode==='shared'?'shared Product SEO phrases':`${data.override.tags.length} channel-specific phrase(s)`}. Nothing posted to any third party.`);
   document.dispatchEvent(new CustomEvent('dd:product-channel-tags-changed',{detail:{product_id:productId,channel:selected}}));
  }catch(error){tagState.uncertain=true;message('dd499TagsStatus','HOLD — '+error.message+' Reload saved settings before another attempt.',true);}
  finally{tagState.busy=false;tagControls();}
 }
 $('dd499TagsChannel').addEventListener('change',channelView);
 $('dd499TagsMode').addEventListener('change',tagControls);
 $('dd499TagsLoad').addEventListener('click',()=>void loadTags());
 $('dd499TagsSave').addEventListener('click',()=>void saveTags());
 document.addEventListener('dd:product-loaded',()=>{tagControls();if(saved())void loadTags();});
 document.addEventListener('dd:save-succeeded',()=>{tagState.data=null;tagState.uncertain=false;tagControls();if(saved())void loadTags();});
 form.addEventListener('input',tagControls);

 // The photographed Etsy ID is a suggestion, never a silently accepted link.
 const photographed=$('dd499UsePhotoDraftId');
 if(photographed){photographed.hidden=productId!==53;
  const hint=$('dd499ExistingDraftHint'),direct=$('dd499DirectEtsyDraft');
  if(hint)hint.hidden=productId!==53;if(direct)direct.hidden=productId!==53;
  photographed.addEventListener('click',()=>{
   const input=$('dd486EtsyListingId');if(!input||productId!==53)return;
   input.value='4603838854';input.dispatchEvent(new Event('input',{bubbles:true}));
   input.focus();message('dd486EtsyExistingStatus','Photographed Etsy draft #4603838854 entered only. Check the exact listing in Etsy, review its shop/draft/shipping, then tick the consent and press Verify. Nothing linked or uploaded.');
  });
 }

 const advance={preview:null,busy:false,uncertain:false};
 const consent=$('dd499AdvancedConsent'),send=$('dd499AdvancedSend'),compare=$('dd499AdvancedCompare'),list=$('dd499AdvancedChanges');
 const line=text=>{const li=document.createElement('li');li.textContent=text;list.append(li);};
 function advancedControls(){
  compare.disabled=!saved()||advance.busy;
  send.disabled=!saved()||advance.busy||advance.uncertain||!advance.preview?.ready||!advance.preview.changed_fields?.length||!consent.checked;
 }
 function invalidate(reason){advance.preview=null;consent.checked=false;list.replaceChildren();line(reason||'Run a fresh comparison before authorizing any Etsy update.');advancedControls();}
 async function compareDraft(){
  if(!saved()||advance.busy)return;
  advance.busy=true;invalidate('Checking live Etsy draft and saved advanced metadata (read only)…');
  try{const result=await api(`/api/admin/product-etsy-advanced-sync?product_id=${productId}`);
   if(Number(result.product_id)!==productId||!result.verified_unpublished||!result.verified_canada_only)throw Error('Identity, unpublished state or Canada-only evidence incomplete.');
   advance.preview=result;advance.uncertain=!!result.unresolved_attempt;
   list.replaceChildren();line(`Verified saved Product #${productId} ↔ unpublished Canada-only Etsy draft #${result.listing_id}. No provider write. Tag source: ${result.tag_source}.`);
   for(const field of result.changed_fields||[]){
    const before=result.remote_fields?.[field],after=result.desired?.[field];
    const value=x=>Array.isArray(x)?x.join(', '):String(x??'(empty)');
    line(`${field}: current Etsy “${value(before).slice(0,180)}” → proposed “${value(after).slice(0,180)}”${value(after).length>180?'…':''}`);
   }
   for(const issue of result.blockers||[])line('HOLD — '+issue);
   if(result.unresolved_attempt)line('HOLD — prior advanced update has an unconfirmed result. Inspect Etsy manually, do not retry.');
   if(!result.changed_fields?.length)line('All compared fields already match; no advanced sync needed.');
   line(result.photo_notice||'Photos are handled by separate, explicitly approved image controls.');
   message('dd499AdvancedStatus',result.ready?`Comparison ready: ${result.changed_fields.length} changed field(s). Review each and explicitly approve one attempt.`:'HOLD — resolve displayed blockers or previous uncertain attempt before sync.',!result.ready);
  }catch(error){advance.preview=null;message('dd499AdvancedStatus','HOLD — '+error.message+' No Etsy write attempted.',true);line('We must verify/link the exact existing draft before metadata synchronization.');}
  finally{advance.busy=false;advancedControls();}
 }
 async function sendOnce(){
  if(!saved()||advance.busy||advance.uncertain||!advance.preview?.ready||!consent.checked)return;
  const target=advance.preview;
  advance.busy=true;advancedControls();message('dd499AdvancedStatus',`Attempting one owner-approved metadata-only update on Etsy draft #${target.listing_id}; no publish, shipping, inventory or photo changes…`);
  try{const result=await api('/api/admin/product-etsy-advanced-sync',{action:'sync_metadata_once',product_id:productId,listing_id:target.listing_id,
   review_fingerprint:target.review_fingerprint,request_key:crypto.randomUUID(),confirm_reviewed_changes:true,
   confirm_unpublished_only:true,confirm_canada_only:true,confirm_no_photo_or_shipping_change:true});
   if(!result.verified_advanced_metadata||String(result.listing_id)!==String(target.listing_id)||!result.still_unpublished)throw Error('Etsy did not confirm verified advanced metadata.');
   advance.uncertain=false;message('dd499AdvancedStatus',`Verified ✓ Etsy draft #${result.listing_id}: ${result.changed_fields.join(', ')} matched live readback. Nothing published, and no shipping or photos changed.`);
   document.dispatchEvent(new CustomEvent('dd:etsy-advanced-metadata-confirmed',{detail:{product_id:productId,listing_id:result.listing_id}}));
  }catch(error){advance.uncertain=true;message('dd499AdvancedStatus','HOLD — '+error.message+' Inspect the real Etsy draft before another action; this page will not retry.',true);}
  finally{advance.preview=null;consent.checked=false;advance.busy=false;advancedControls();}
 }
 compare.addEventListener('click',()=>void compareDraft());
 send.addEventListener('click',()=>void sendOnce());
 consent.addEventListener('change',advancedControls);
 for(const event of ['dd:product-loaded','dd:save-succeeded','dd:etsy-draft-created','dd:etsy-existing-draft-linked','dd:etsy-existing-draft-updated','dd:product-channel-tags-changed','dd:etsy-advanced-profile-saved'])
  document.addEventListener(event,()=>invalidate('Product, local tags or linked draft changed. Recompare live Etsy before authorizing metadata.'));
 form.addEventListener('input',()=>{if(advance.preview)invalidate('Local Product changed. Save first, then recompare live Etsy.');else advancedControls();});
 tagControls();advancedControls();if(saved())void loadTags();
}
