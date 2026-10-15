// Release 467 Build 404: no automatic Etsy calls; explicit local evidence, resolution and revalidation.
(()=>{'use strict';
const $=x=>document.getElementById(x);
const e={draft:$('etsy404Draft'),from403:$('etsy403Draft'),load:$('etsy404Load'),inspect:$('etsy404Inspect'),
 evidence:$('etsy404Evidence'),resolve:$('etsy404Resolve'),revalidate:$('etsy404Revalidate'),
 hold:$('etsy404Hold'),evidenceId:$('etsy404EvidenceId'),correction:$('etsy404Correction'),image:$('etsy404Image'),
 status:$('etsy404Status'),result:$('etsy404Result'),checks:['product','images','shipping','policies','unpublished','decision','corrected']
 .map(x=>$('etsy404_'+x))};
if(!e.draft||!window.DDAuth?.apiFetch)return;
let busy=false,local=null,report=null;
const id=()=>e.draft.value.trim(),approved=()=>e.checks.every(x=>x?.checked);
function update(){
 e.load.disabled=busy;
 e.inspect.disabled=busy||!local?.listing_id;
 e.evidence.disabled=busy||!local?.listing_id||!e.hold.value||e.correction.value.trim().length<20;
 e.resolve.disabled=busy||!local?.listing_id||!e.hold.value||!e.evidenceId.value||!e.image.value||!approved()||!report?.can_close_exception;
 e.revalidate.disabled=busy||!local?.listing_id||!e.image.value||!approved()||!report?.can_close_exception;
}
const show=o=>{e.result.textContent=JSON.stringify(o,null,2);e.status.textContent=o.error||o.message||'Evidence loaded.';};
async function call(path,options){
 const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...options}),v=await r.json().catch(()=>({ok:false,error:'Invalid response'}));
 show(v);if(!r.ok||!v.ok)throw Error(v.error||'Request rejected');return v;
}
function approval(action){const body={action,draft_id:id(),image_id:e.image.value,hold_receipt:e.hold.value,evidence_receipt:e.evidenceId.value};
 [body.owner_checked_product,body.owner_checked_images,body.owner_checked_shipping,body.owner_checked_etsy_policies,
  body.owner_acknowledges_no_publication,body.owner_approves_manual_decision,body.owner_confirmed_correction]=e.checks.map(x=>x.checked);
 return body;
}
async function run(action){
 if(busy)return;busy=true;update();
 try{
  if(!id()){show({error:'Select linked local draft UUID.'});return;}
  if(action==='load'){
   local=await call('/api/admin/etsy-exception-resolution?draft_id='+encodeURIComponent(id()),{method:'GET'});
   e.hold.replaceChildren(new Option('Select unresolved HOLD',''));
   for(const h of (local.active_holds||[]))e.hold.add(new Option('HOLD #'+h.receipt+' — '+h.category,h.receipt));
   e.image.replaceChildren();report=null;
  }else{
   const body=approval(action),isWrite=action!=='inspect_resolution';
   if(action==='record_remediation_evidence')body.operator_correction=e.correction.value.trim();
   if(isWrite){
    if(!globalThis.crypto?.randomUUID){show({error:'Secure request key unavailable.'});return;}
    body.request_key=globalThis.crypto.randomUUID();
   }
   const value=await call('/api/admin/etsy-exception-resolution',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(action==='inspect_resolution'){
    report=value.snapshot;
    e.image.replaceChildren(new Option('Choose current Etsy image',''));
    for(const image of (value.snapshot?.image_ids||[]))e.image.add(new Option('Image '+image,image));
    if(value.snapshot?.selected_image_id)e.image.value=value.snapshot.selected_image_id;
   }else if(action==='record_remediation_evidence'){
    e.evidenceId.value=String(value.evidence_receipt||'');
   }else{report=null;local=null;}
  }
 }catch{/* Never auto-retry an unknown result. */}
 finally{busy=false;update();}
}
e.load.addEventListener('click',()=>void run('load'));e.inspect.addEventListener('click',()=>void run('inspect_resolution'));
e.evidence.addEventListener('click',()=>void run('record_remediation_evidence'));
e.resolve.addEventListener('click',()=>void run('resolve_exception'));e.revalidate.addEventListener('click',()=>void run('revalidate_decision'));
e.draft.addEventListener('input',()=>{local=null;report=null;update();});
for(const node of [...e.checks,e.hold,e.evidenceId,e.correction,e.image])node.addEventListener('change',update);
e.correction.addEventListener('input',update);e.evidenceId.addEventListener('input',update);
if(e.from403)e.from403.addEventListener('change',()=>{e.draft.value=e.from403.value;local=null;report=null;update();});
update();
})();