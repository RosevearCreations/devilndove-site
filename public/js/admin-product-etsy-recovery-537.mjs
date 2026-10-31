/* Build 537: one owner-readable recovery path for the EXISTING Sweet Orange
 * Etsy draft. GETs only. Never create a draft, sync a photo, change tags,
 * accept owner evidence or call a provider write on page load. */
import {ownerDraftHistory534} from './etsy-owner-draft-history-534.mjs';
import {assessOwnerFinalReadback536} from './etsy-owner-final-readback-536.mjs';

const $=id=>document.getElementById(id);
const root=typeof document==='undefined'?null:$('dd537OwnerRecovery');
const productId=typeof location==='undefined'?0:Number(new URLSearchParams(location.search).get('product_id')||0);

export function recoveryNextAction537(progress,photoInventory){
 if(!progress?.stages?.[0]?.ready)return 'link';
 if(!progress.photosReady){
  const uncertain=Number(photoInventory?.hold_unconfirmed_claims||0)>0;
  const remoteCount=progress.remotePhotoCount;
  return uncertain||remoteCount===null||remoteCount>0?'compare':'transfer';
 }
 if(!progress.tagsReady)return 'tags';
 return 'final';
}

if(root&&productId===54&&window.DDAuth?.apiFetch){
 const history=ownerDraftHistory534(productId),form=$('productEditorForm');
 const read=$('dd537Read'),status=$('dd537Status'),stages=$('dd537Stages');
 let busy=false,progress=null,photos=null;
 root.hidden=false;

 const get=async path=>{
  const response=await window.DDAuth.apiFetch(path,{method:'GET',cache:'no-store'});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data?.ok)throw Error(data?.error||`HTTP ${response.status}`);
  return data;
 };
 const say=(value,tone='')=>{status.textContent=value;status.dataset.tone=tone;};
 const render=({progress:readback,errors=[]})=>{
  stages.replaceChildren();
  for(const stage of readback.stages){
   const item=document.createElement('li'),title=document.createElement('strong'),body=document.createElement('span');
   item.className=stage.ready?'dd537-ready':'dd537-held';
   title.textContent=`${stage.ready?'Verified':'Needs review'} · ${stage.key==='identity'?'Etsy draft link':stage.key==='photos'?'Exact original photo pairs':stage.key==='tags'?'Native Etsy tags':'Final owner evidence'}`;
   body.textContent=stage.message+(stage.ready?'':` Next: ${stage.next}`);
   item.append(title,body);stages.append(item);
  }
  for(const error of errors){const item=document.createElement('li');item.className='dd537-held';item.textContent=`Readback unavailable: ${error}`;stages.append(item);}
  const next=recoveryNextAction537(readback,photos);
  $('dd537Photos').textContent=next==='compare'?'2. Match photos already on Etsy':
   next==='transfer'?'2. Review missing-photo transfer':'2. Resolve exact photo pairs';
  if(readback.ready)say(readback.ownerRecordedCurrent?
   `All four stages verified for Etsy draft #${readback.listingId}; current owner evidence is recorded. The listing remains unpublished.`:
   `All four stages verified for Etsy draft #${readback.listingId}. Open Final owner readback to explicitly record acceptance; nothing has been published.`,'ok');
  else say(`HOLD — ${readback.stages.filter(s=>!s.ready).length} stage(s) need real evidence. Recommended next step: ${next==='link'?'verify and link existing draft':next==='compare'?'compare exact existing photo pairs':next==='transfer'?'review safe missing-photo transfer':next==='tags'?'review live Etsy tags':'final live content check'}. No Etsy write was made.`,'hold');
 };

 async function check(){
  if(busy)return;
  if(form?.dataset.productDirty==='1'){say('Save or discard unsaved Product changes before checking the authoritative saved Product and Etsy draft.','hold');return;}
  busy=true;read.disabled=true;progress=null;photos=null;
  say('Checking the saved primary link and actual Etsy photo/tag evidence. No provider write…');
  stages.replaceChildren();
  const errors=[];
  try{
   const candidate=history.listingId;
   const identity=await get(`/api/admin/product-etsy-existing-draft?product_id=${productId}&candidate_listing_id=${encodeURIComponent(candidate)}`);
   const exact=identity.saved_link_readback_confirmed===true&&Number(identity.product_id)===productId&&
    String(identity.linked_listing_id||'')===candidate&&Boolean(String(identity.receipt_id||'').trim());
   const paths=[`/api/admin/product-etsy-images?product_id=${productId}&candidate_listing_id=${encodeURIComponent(candidate)}${exact?'&reconcile=1':''}`];
   if(exact)paths.push(`/api/admin/product-etsy-tags?product_id=${productId}&reconcile=1`,
    `/api/admin/product-etsy-owner-signoff-504?product_id=${productId}`);
   const replies=await Promise.allSettled(paths.map(get));
   const values=replies.map((result,index)=>{
    if(result.status==='fulfilled')return result.value;
    errors.push(`${['Photos','Tags','Final content'][index]}: ${String(result.reason?.message||'unavailable').slice(0,180)}`);
    return null;
   });
   photos=values[0]||null;
   progress=assessOwnerFinalReadback536({productId,candidateListingId:candidate,identity,photos,tags:values[1]||null,content:values[2]||null});
   render({progress,errors});
  }catch(error){say(`HOLD — primary Etsy listing readback unavailable: ${String(error.message||'Unknown error')}. No link, photo or tag was changed.`,'hold');}
  finally{busy=false;read.disabled=false;}
 }
 const chooseEtsyTab=()=>document.querySelector('[data-editor-tab="etsy"]')?.click();
 $('dd537Link').addEventListener('click',()=>{
  $('dd534InspectHistorical')?.click();
  $('dd486EtsyListingId')?.scrollIntoView({block:'center',behavior:'smooth'});
 });
 $('dd537Photos').addEventListener('click',()=>{
  if(!progress?.stages?.[0]?.ready){$('dd537Link').click();return;}
  chooseEtsyTab();
  const next=recoveryNextAction537(progress,photos);
  if(next==='compare'){
   const older=$('dd500Package')?.closest('details');if(older)older.open=true;
   const pane=$('dd505PhotoReview');for(let parent=pane?.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
   if(pane&&!pane.hidden){pane.scrollIntoView({block:'center',behavior:'smooth'});$('dd505LoadPhotos')?.click();}
   else {$('dd535GoPhotoSync')?.click();say('Open the existing photo-comparison controls after the saved draft and image inventory finish loading. Never resend an uncertain upload.','hold');}
  }else $('dd535GoPhotoSync')?.click();
 });
 $('dd537Tags').addEventListener('click',()=>{chooseEtsyTab();$('dd535GoTagSync')?.click();});
 $('dd537Final').addEventListener('click',()=>{
  const final=$('dd529Panel');if(final){final.open=true;final.scrollIntoView({block:'start',behavior:'smooth'});}
  $('dd529ProductIds').value=String(productId);$('dd529Check')?.click();
 });
 read.addEventListener('click',()=>void check());
 document.addEventListener('dd:etsy-existing-draft-linked',event=>{if(Number(event.detail?.product_id)===productId)void check();});
 document.addEventListener('dd:save-succeeded',()=>{progress=null;photos=null;stages.replaceChildren();say('Product saved. Run the fresh read-only Etsy check again before owner acceptance.');});
}
