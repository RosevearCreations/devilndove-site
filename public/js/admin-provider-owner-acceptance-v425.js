// Build 425 — explicit owner click records local acceptance, NOT provider closure.
(()=>{
 const init=()=>{
  const anchor=document.getElementById('provider424');
  if(!anchor||document.getElementById('provider425'))return;
  const card=document.createElement('section');card.className='card';card.id='provider425';
  card.style.padding='16px';card.style.marginTop='18px';
  const heading=document.createElement('h2');
  heading.textContent='Build 425 — Explicit owner acceptance & manual closure readiness';
  const hint=document.createElement('p');hint.className='small';
  hint.textContent='Audit only. Current assigned owner may record acceptance for human review. A local receipt never resolves an exception, confirms provider closure or authorizes publication.';
  const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';
  refresh.textContent='Inspect current acceptance and closure HOLD';
  const note=document.createElement('textarea');note.className='input';note.rows=3;
  note.maxLength=600;note.placeholder='Owner reason for accepting the handoff for manual review (20–600 characters)';
  const confirm=[
   ['confirm_local_only','Only record an internal owner-review receipt'],
   ['confirm_no_provider_action','No provider account or case is contacted'],
   ['confirm_no_publication','No listing or content is published'],
   ['confirm_no_auto_closure','No exception is resolved or closed automatically'],
   ['confirm_separate_manual_closure','Any later closure requires separate human authorization and independent provider evidence'],
   ['confirm_us_shipping_suspended','U.S. shipping remains suspended']
  ];
  const checks={},checkBox=document.createElement('div');
  for(const [key,label] of confirm){
   const row=document.createElement('label');row.style.display='block';
   const input=document.createElement('input');input.type='checkbox';checks[key]=input;
   row.append(input,document.createTextNode(' '+label));checkBox.append(row);
  }
  const save=document.createElement('button');save.type='button';save.className='btn';
  save.textContent='Record explicit local owner acceptance';
  const status=document.createElement('pre');status.setAttribute('role','status');
  status.style.whiteSpace='pre-wrap';status.style.overflowWrap='anywhere';
  status.textContent='Choose the exact Product and destination in the existing Admin case first.';
  const getCase=()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!/^[1-9]\d{0,14}$/.test(product_id||'')||!['etsy','facebook'].includes(destination)||
    (destination==='etsy'&&!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(draft_id||'')))
    throw Error('Select a valid Product, destination and Etsy draft where required.');
   const qs=new URLSearchParams({mode:'detail',product_id,destination});
   if(destination==='etsy')qs.set('draft_id',draft_id);
   return {product_id:Number(product_id),destination,
    draft_id:destination==='etsy'?draft_id:null,qs};
  };
  let pending=null;
  async function inspect(){
   if(!window.DDAuth?.apiFetch)throw Error('Verified Admin session required.');
   const chosen=getCase();
   const response=await window.DDAuth.apiFetch('/api/admin/provider-owner-acceptance-425?'+chosen.qs,{method:'GET'});
   const data=await response.json();
   if(!response.ok||!data.ok)throw Error(String(data.error||response.status));
   return {chosen,data};
  }
  refresh.addEventListener('click',async()=>{
   refresh.disabled=true;pending=null;
   try{
    const {data}=await inspect();
    status.textContent=JSON.stringify({status:data.review?.status,
     holds:data.review?.holds,latest_acceptance_receipt:data.review?.latest_acceptance_receipt,
     acceptance_record_current:data.review?.acceptance_record_current,
     manual_closure_audit:data.review?.manual_closure_audit},null,2);
   }catch(e){status.textContent='HOLD: '+String(e.message||e);}
   finally{refresh.disabled=false;}
  });
  save.addEventListener('click',async()=>{
   save.disabled=true;
   try{
    const {chosen,data}=pending?pending.snapshot:await inspect();
    if(!data.review?.accept_enabled){
     pending=null;status.textContent='Owner acceptance HOLD: '+JSON.stringify(data.review?.holds||[]);
     return;
    }
    if(!pending){
     const state=data.review;
     const body={product_id:chosen.product_id,destination:chosen.destination,draft_id:chosen.draft_id,
      action:'accept_owner_handoff_review',choice:'ACCEPT_HANDOFF_FOR_MANUAL_REVIEW',
      owner_note:note.value,request_key:crypto.randomUUID().replaceAll('-',''),
      expected_source_signature:state.source_signature,expected_receipts:state.current_receipts,
      expected_decision_receipt:state.source_decision_receipt,
      expected_owner_ack_receipt:state.source_owner_ack_receipt,
      expected_handoff_receipt:state.source_handoff_receipt,
      expected_previous_acceptance_receipt:state.latest_acceptance_receipt};
     for(const [key,input] of Object.entries(checks))body[key]=input.checked;
     pending={snapshot:{chosen,data},body};
    }
    const response=await window.DDAuth.apiFetch('/api/admin/provider-owner-acceptance-425',
     {method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(pending.body)});
    const result=await response.json();
    if(response.ok&&result.ok){
     status.textContent='Owner acceptance #'+String(result.receipt)+
      ' recorded. Manual closure stays on HOLD pending independent provider evidence and separate approval.';
     pending=null;
    }else{
     status.textContent='Owner acceptance HOLD: '+JSON.stringify(result.blockers||result.error);
     if(response.status===409||response.status===400)pending=null;
    }
   }catch(e){status.textContent='No receipt confirmed: '+String(e.message||e)+
     '. An unchanged retry uses the original request key.';}
   finally{save.disabled=false;}
  });
  card.append(heading,hint,refresh,note,checkBox,save,status);anchor.after(card);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
