// Release 467 Build 402 — explicit operator-only read-only Etsy evidence and local audit acceptance.
(()=>{'use strict';
const $=id=>document.getElementById(id),e={draft:$('etsy402Draft'),from401:$('etsy401Draft'),
 local:$('etsy402Load'),inspect:$('etsy402Inspect'),reconcile:$('etsy402Reconcile'),accept:$('etsy402Accept'),
 image:$('etsy402Image'),status:$('etsy402Status'),evidence:$('etsy402Evidence'),
 flags:['currentPhoto','compliance','unpublished','localOnly'].map(x=>$('etsy402_'+x))};
if(!e.draft||!window.DDAuth?.apiFetch)return;
let busy=false,local=null,inspected=null;
const approved=()=>e.flags.every(x=>x?.checked),id=()=>e.draft.value.trim();
function update(){e.local.disabled=busy;
 e.inspect.disabled=busy||!local?.listing_id;
 e.reconcile.disabled=busy||!inspected?.outcome?.photo?.has_image||!local?.previous_upload_claim||!approved()||!e.image.value;
 e.accept.disabled=busy||!inspected?.outcome?.photo?.has_image||!approved()||!e.image.value;}
function show(o){e.evidence.textContent=JSON.stringify(o,null,2);e.status.textContent=o?.message||o?.error||'Evidence displayed.';}
async function request(path,options){const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...options});
const body=await r.json().catch(()=>({ok:false,error:'Unreadable response'}));show(body);
if(!r.ok||!body.ok)throw Error(body.error||'Request rejected');return body;}
function ownerPayload(action){return {action,draft_id:id(),image_id:e.image.value,
 owner_confirmed_current_photo:e.flags[0].checked,owner_confirmed_compliance:e.flags[1].checked,
 owner_acknowledges_unpublished:e.flags[2].checked,owner_approves_local_acceptance:e.flags[3].checked};}
async function run(action){if(busy)return;busy=true;update();
try{
 if(!id()){show({error:'Choose local Etsy draft UUID.'});return;}
 if(action==='load'){
  local=await request('/api/admin/etsy-image-reconciliation?draft_id='+encodeURIComponent(id()),{method:'GET'});
  inspected=null;e.image.replaceChildren();
 }else{
  const body=action==='inspect'?{action:'inspect_remote',draft_id:id()}:ownerPayload(action==='reconcile'?'reconcile_image_outcome':'accept_final_draft');
  const result=await request('/api/admin/etsy-image-reconciliation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(action==='inspect'){
   inspected=result;e.image.replaceChildren();
   e.image.add(new Option('Choose verified live image',''));
   for(const item of (result.outcome?.photo?.images||[]))e.image.add(new Option('Image '+item.id+' (rank '+item.rank+')',item.id));
  }else{inspected=null;}
 }
}catch{/* Errors already shown; never retry or auto-publish. */}
finally{busy=false;update();}}
e.local.addEventListener('click',()=>void run('load'));
e.inspect.addEventListener('click',()=>void run('inspect'));
e.reconcile.addEventListener('click',()=>void run('reconcile'));
e.accept.addEventListener('click',()=>void run('accept'));
e.draft.addEventListener('input',()=>{local=null;inspected=null;e.image.replaceChildren();update();});
e.image.addEventListener('change',update);for(const flag of e.flags)flag.addEventListener('change',update);
if(e.from401)e.from401.addEventListener('change',()=>{e.draft.value=e.from401.value;local=null;inspected=null;update();});
update();
})();