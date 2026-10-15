// Build 401: operator click only, no page-load provider calls, no automatic publication/retries.
(()=>{'use strict';
const el=id=>document.getElementById(id);
const v={draft:el('etsy401Draft'),load:el('etsy401Load'),inspect:el('etsy401Inspect'),
 file:el('etsy401File'),alt:el('etsy401Alt'),upload:el('etsy401Upload'),complete:el('etsy401Complete'),
 status:el('etsy401Status'),details:el('etsy401Details'),linked:el('etsy400DraftId'),
 flags:['image_rights_confirmed','image_matches_product','description_and_materials_reviewed',
 'ingredients_and_required_labels_reviewed','claims_and_safety_reviewed','shipping_returns_reviewed'].map(k=>[k,el('etsy401_'+k)]),
 unpublished:el('etsy401Unpublished'),retry:el('etsy401NoRetry')};
if(!v.draft||!window.DDAuth?.apiFetch)return;
let locked=false,local=null,lastReview=null;
const consent=()=>v.flags.every(([,node])=>node?.checked)&&v.unpublished.checked&&v.retry.checked;
const draftId=()=>v.draft.value.trim();
const show=r=>{v.details.textContent=JSON.stringify(r,null,2);v.status.textContent=r.message||r.error||'Readiness checked.';};
const buttons=()=>{v.load.disabled=locked;v.inspect.disabled=locked||!local?.linked_listing_id;
 v.upload.disabled=locked||!local?.image_upload_available||!consent()||!v.file.files?.[0]||!v.alt.value.trim();
 v.complete.disabled=locked||!lastReview?.image_evidence?.has_image||!consent();};
async function call(path,init){const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...init});
 const x=await r.json().catch(()=>({error:'Unreadable response'}));show(x);
 if(!r.ok||!x.ok)throw Error(x.error||'Operation rejected');return x;}
async function exec(action){
 if(locked)return;locked=true;buttons();
 try{const id=draftId();if(!id){show({error:'Choose a local draft first.'});return;}
  if(action==='load'){
   local=await call('/api/admin/etsy-draft-completion?draft_id='+encodeURIComponent(id),{method:'GET'});
   lastReview=null;
  }else if(action==='inspect'){
   lastReview=await call('/api/admin/etsy-draft-completion',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'inspect_images',draft_id:id})});
  }else if(action==='upload'){
   if(!consent()||!local?.image_upload_available||!v.file.files[0])return;
   if(!globalThis.crypto?.randomUUID){show({error:'Secure one-time request key unavailable.'});return;}
   const form=new FormData();form.set('action','upload_one_image');form.set('draft_id',id);
   form.set('request_key',globalThis.crypto.randomUUID());form.set('image',v.file.files[0]);
   form.set('alt_text',v.alt.value.trim());
   for(const [k,node] of v.flags)form.set(k,String(node.checked));
   form.set('confirmed_unpublished_only',String(v.unpublished.checked));
   form.set('confirmed_one_attempt_no_retry',String(v.retry.checked));
   local.image_upload_available=false;lastReview=null;buttons();
   try{await call('/api/admin/etsy-draft-completion',{method:'POST',body:form});}
   catch{show({error:'Upload may have reached Etsy. Inspect Etsy images and audit receipt; do NOT retry.'});}
  }else if(action==='complete'){
   if(!consent()||!lastReview?.image_evidence?.has_image)return;
   const data={action:'record_completion_review',draft_id:id,confirmed_unpublished_only:true};
   for(const [k,node] of v.flags)data[k]=node.checked;
   await call('/api/admin/etsy-draft-completion',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
   lastReview=null;
  }
 }catch{}finally{locked=false;buttons();}
}
v.load.addEventListener('click',()=>void exec('load'));v.inspect.addEventListener('click',()=>void exec('inspect'));
v.upload.addEventListener('click',()=>void exec('upload'));v.complete.addEventListener('click',()=>void exec('complete'));
v.draft.addEventListener('input',()=>{local=null;lastReview=null;buttons();});
for(const [,node] of v.flags)node?.addEventListener('change',buttons);
for(const node of [v.file,v.alt,v.unpublished,v.retry])node?.addEventListener('change',buttons);
v.alt.addEventListener('input',buttons);
if(v.linked)v.linked.addEventListener('change',()=>{v.draft.value=v.linked.value;local=null;lastReview=null;buttons();});
buttons();
})();