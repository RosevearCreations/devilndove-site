// Build 403: operator-requested reads, deliberate local-only decisions; no automatic provider action.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const n={draft:$('etsy403Draft'),linked:$('etsy402Draft'),load:$('etsy403Load'),inspect:$('etsy403Inspect'),
 hold:$('etsy403Hold'),ready:$('etsy403Ready'),category:$('etsy403Category'),notes:$('etsy403Notes'),
 image:$('etsy403Image'),status:$('etsy403Status'),evidence:$('etsy403Evidence'),
 checks:['product','images','shipping','policies','unpublished','decision'].map(k=>$('etsy403_'+k))};
if(!n.draft||!window.DDAuth?.apiFetch)return;
let busy=false,local=null,report=null;
const id=()=>n.draft.value.trim();
const ok=()=>n.checks.every(x=>x?.checked);
function buttons(){n.load.disabled=busy;n.inspect.disabled=busy||!local?.listing_id;
 n.hold.disabled=busy||!local?.listing_id||n.notes.value.trim().length<12||!n.category.value;
 n.ready.disabled=busy||!report||report.readiness!=='HOLD_OWNER_REVIEW'&&report.readiness!=='READY_FOR_SEPARATE_MANUAL_ETSY_DECISION'||
   !ok()||!n.image.value;
}
const show=x=>{n.evidence.textContent=JSON.stringify(x,null,2);n.status.textContent=x.error||x.message||x.decision_readiness||'Evidence shown.';};
async function call(path,opts){const response=await window.DDAuth.apiFetch(path,{cache:'no-store',...opts});
 const x=await response.json().catch(()=>({ok:false,error:'Invalid server response'}));show(x);
 if(!response.ok||!x.ok)throw Error(x.error||'Request rejected');return x;}
const submit=async action=>{
 if(busy)return;busy=true;buttons();
 try{
  if(!id()){show({error:'Choose an existing linked local Etsy draft UUID.'});return;}
  if(action==='load'){
   local=await call('/api/admin/etsy-draft-decision?draft_id='+encodeURIComponent(id()),{method:'GET'});report=null;
  }else{
   const payload={action,draft_id:id(),image_id:n.image.value};
   if(action==='record_owner_hold'){
    payload.category=n.category.value;payload.notes=n.notes.value.trim();
   }else if(action==='record_owner_ready'){
    if(!ok()||!report||report.readiness!=='READY_FOR_SEPARATE_MANUAL_ETSY_DECISION')return;
    [payload.owner_checked_product,payload.owner_checked_images,payload.owner_checked_shipping,
     payload.owner_checked_etsy_policies,payload.owner_acknowledges_no_publication,
     payload.owner_approves_manual_decision]=n.checks.map(x=>x.checked);
   }
   if(action!=='inspect_exceptions'){
    if(!globalThis.crypto?.randomUUID){show({error:'Secure request identifier unavailable.'});return;}
    payload.request_key=globalThis.crypto.randomUUID();
   }
   const x=await call('/api/admin/etsy-draft-decision',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(action==='inspect_exceptions'){
    report=x.report;n.image.replaceChildren(new Option('Choose verified image',''));
    for(const image of (x.report?.image_ids||[]))n.image.add(new Option('Etsy image '+image,image));
    if(x.report?.selected_image_id)n.image.value=x.report.selected_image_id;
   }else{report=null;}
  }
 }catch{/* Server response already rendered; no automatic retry. */}
 finally{busy=false;buttons();}
};
n.load.addEventListener('click',()=>void submit('load'));n.inspect.addEventListener('click',()=>void submit('inspect_exceptions'));
n.hold.addEventListener('click',()=>void submit('record_owner_hold'));n.ready.addEventListener('click',()=>void submit('record_owner_ready'));
n.draft.addEventListener('input',()=>{local=null;report=null;n.image.replaceChildren();buttons();});
n.image.addEventListener('change',buttons);n.notes.addEventListener('input',buttons);n.category.addEventListener('change',buttons);
for(const ch of n.checks)ch?.addEventListener('change',buttons);
if(n.linked)n.linked.addEventListener('change',()=>{n.draft.value=n.linked.value;local=null;report=null;buttons();});
buttons();
})();