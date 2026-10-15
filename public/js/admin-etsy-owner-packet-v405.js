// Build 405: operator-driven final packet inspection, no provider mutations.
(()=>{'use strict';const e=id=>document.getElementById(id);
const v={draft:e('etsy405Draft'),prior:e('etsy404Draft'),load:e('etsy405Load'),inspect:e('etsy405Inspect'),
 record:e('etsy405Record'),image:e('etsy405Image'),shipping:e('etsy405Shipping'),consent:e('etsy405Consent'),
 status:e('etsy405Status'),results:e('etsy405Result')};
if(!v.draft||!window.DDAuth?.apiFetch)return;
let busy=false,local=null,packet=null;
function controls(){v.load.disabled=busy;v.inspect.disabled=busy||!local?.listing_id;
 v.record.disabled=busy||!packet||packet.status!=='READY_FOR_SEPARATE_OWNER_ETSY_DECISION'||!v.shipping.checked||!v.consent.checked;}
async function call(path,options){const r=await window.DDAuth.apiFetch(path,{cache:'no-store',...options}),x=await r.json().catch(()=>({error:'Unreadable server response'}));
 v.results.textContent=JSON.stringify(x,null,2);v.status.textContent=x.message||x.error||'Packet checked.';
 if(!r.ok||!x.ok)throw Error(x.error||'Request failed');return x;}
async function run(mode){if(busy)return;busy=true;controls();try{
 const id=v.draft.value.trim();if(!id){v.status.textContent='Choose linked local draft ID.';return;}
 if(mode==='load'){local=await call('/api/admin/etsy-publication-packet?draft_id='+encodeURIComponent(id),{method:'GET'});packet=null;
 }else{
 const data={action:mode==='inspect'?'inspect_final_packet':'record_final_nonpublishing_review',draft_id:id,
 image_id:v.image.value.trim(),owner_checked_shipping:v.shipping.checked,
 owner_checked_product:true,owner_checked_images:true,owner_checked_etsy_policies:true,
 owner_acknowledges_no_publication:true,owner_approves_manual_decision:true,owner_confirmed_correction:true,
 owner_confirmed_packet_nonpublishing:v.consent.checked};
 if(mode==='record'){
 if(!globalThis.crypto?.randomUUID)throw Error('Secure request key unavailable');data.request_key=globalThis.crypto.randomUUID();
 }
 const result=await call('/api/admin/etsy-publication-packet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 if(mode==='inspect'){packet=result.packet;v.image.value=result.packet?.image_id||'';}
 else packet=null;
 }
 }catch(e){v.status.textContent='Packet action withheld: '+e.message+' No Etsy write or publication.';}
 finally{busy=false;controls();}}
v.load.addEventListener('click',()=>void run('load'));v.inspect.addEventListener('click',()=>void run('inspect'));v.record.addEventListener('click',()=>void run('record'));
v.draft.addEventListener('input',()=>{local=null;packet=null;controls();});
v.shipping.addEventListener('change',()=>{packet=null;controls();});
v.consent.addEventListener('change',controls);v.image.addEventListener('input',()=>{packet=null;controls();});
if(v.prior)v.prior.addEventListener('change',()=>{v.draft.value=v.prior.value;local=null;packet=null;controls();});
controls();})();
