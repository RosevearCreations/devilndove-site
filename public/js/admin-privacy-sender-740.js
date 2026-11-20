/* Build 740: no browser-side source may activate a sender or set Worker vars. */
document.addEventListener('DOMContentLoaded',()=>{
 'use strict';
 const $=id=>document.getElementById(id),refresh=$('privacy740Refresh'),
  prepare=$('privacy740Prepare'),status=$('privacy740Status'),
  checkbox=$('privacy740OwnerReview'),reason=$('privacy740Reason');
 if(!refresh||!prepare||!status||!checkbox||!reason)return;
 const endpoint='/api/admin/privacy-sender-ceremony-740';
 const read=async()=>{
  refresh.disabled=true;status.textContent='Reading original source-only three-Master and operator gates…';
  try{
   const res=await window.DDAuth.apiFetch(endpoint,{method:'GET',cache:'no-store'});
   const body=await res.json().catch(()=>null);
   if(!res.ok||!body?.ok)throw Error('Verified Admin original-source read failed');
   status.textContent=JSON.stringify({
    status:body.status,send_authorized:body.sender_activation_authorized,
    original_owner_activation_recorded:body.original_owner_activation_recorded,
    worker_enabled:false,
    peers:(body.peers||[]).map(x=>({app:x.peer_app,source:x.source_state,
     independent_owner:x.independent_receiver_owner_attested})),
    required:body.required_gates,next:body.next_step
   },null,2);
  }catch{status.textContent='HOLD — Original private evidence unavailable; sender remains OFF.';}
  finally{refresh.disabled=false;}
 };
 refresh.addEventListener('click',read);
 prepare.addEventListener('click',async()=>{
  const note=reason.value.trim().toUpperCase();
  if(!checkbox.checked||!/^[A-Z][A-Z0-9_]{7,63}$/.test(note)){
   status.textContent='HOLD — consent to review only and a bounded reason code are required.';
   return;
  }
  if(!window.confirm('Prepare a non-binding proof review packet? This will NOT activate the Worker or send external messages.'))return;
  prepare.disabled=true;
  try{
   const res=await window.DDAuth.apiFetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'prepare_owner_review_740',owner_review_confirmed:true,
      scope:'CONSENT_WITHDRAWAL_ONLY',reason_code:note})});
   const body=await res.json().catch(()=>null);
   if(!res.ok||!body?.ok)throw Error('Owner review packet refused');
   status.textContent=JSON.stringify({status:body.status,code:body.code,
    activation_authorized:body.sender_activation_authorized,
    approval_record_saved:body.approval_record_saved,
    all_live_transport_disallowed:body.all_live_transport_disallowed,
    outstanding:body.required_gates,next:body.next_step},null,2);
  }catch{status.textContent='HOLD — No review approval or sending authority recorded.';}
  finally{checkbox.checked=false;reason.value='';prepare.disabled=false;}
 });
});