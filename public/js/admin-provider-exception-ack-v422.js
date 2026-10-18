// Build 422 — human local acknowledgement, explicit owner click only.
(()=>{
 function init(){
  const anchor=document.getElementById('provider421');
  if(!anchor||document.getElementById('provider422'))return;
  const section=document.createElement('section');section.className='card';section.id='provider422';section.style.padding='16px';section.style.marginTop='18px';
  const title=document.createElement('h2');title.textContent='Build 422 — Owner acknowledgement & handoff holds';
  const intro=document.createElement('p');intro.className='small';intro.textContent='This acknowledges local evidence review only. It never resolves exceptions, reopens cases, contacts marketplaces or enables US shipping.';
  const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';refresh.textContent='Check current acknowledgement holds';
  const choice=document.createElement('select');choice.className='input';
  for(const [key,label] of [
   ['EVIDENCE_REVIEWED_FOLLOWUP_PENDING','I reviewed follow-up evidence; exception remains unresolved'],
   ['EXCEPTION_HANDOFF_REQUIRED','Manual owner handoff is required (no handoff performed)'],
   ['EVIDENCE_MISMATCH_HOLD','Hold pending manual evidence reconciliation']
  ]){const o=document.createElement('option');o.value=key;o.textContent=label;choice.append(o);}
  const note=document.createElement('textarea');note.className='input';note.rows=3;note.maxLength=600;note.placeholder='Explain your review (20–600 characters)';
  const confirmations=[
   ['confirm_local_only','This is an audit-only acknowledgement'],
   ['confirm_no_provider_action','No marketplace account or case is contacted'],
   ['confirm_no_publication','No listing is published'],
   ['confirm_no_auto_resolution','No exception, reopening or handoff is automatically completed'],
   ['confirm_us_shipping_suspended','U.S. shipping remains suspended']
  ],checks={};
  const checkGroup=document.createElement('div');
  for(const [key,label] of confirmations){const wrapper=document.createElement('label');wrapper.style.display='block';const c=document.createElement('input');c.type='checkbox';checks[key]=c;wrapper.append(c,document.createTextNode(' '+label));checkGroup.append(wrapper);}
  const submit=document.createElement('button');submit.type='button';submit.className='btn';submit.textContent='Record explicit local acknowledgement';
  const output=document.createElement('pre');output.setAttribute('role','status');output.style.whiteSpace='pre-wrap';output.style.overflowWrap='anywhere';output.textContent='Choose Product/destination first, then check current holds.';
  const caseQuery=()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!product_id||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!draft_id))throw Error('Choose Product, destination and saved Etsy draft if applicable.');
   const qs=new URLSearchParams({mode:'detail',product_id,destination});
   if(destination==='etsy')qs.set('draft_id',draft_id);
   return {product_id:Number(product_id),destination,draft_id:destination==='etsy'?draft_id:null,qs};
  };
  let last=null;
  async function getCurrent(){
   if(!window.DDAuth?.apiFetch)throw Error('Verified Admin authentication required.');
   const input=caseQuery();
   const res=await window.DDAuth.apiFetch('/api/admin/provider-exception-ack-422?'+input.qs,{method:'GET'});
   const data=await res.json();
   if(!res.ok||!data.ok)throw Error(String(data.error||res.status));
   last={input,data};
   return last;
  }
  refresh.addEventListener('click',async()=>{
   refresh.disabled=true;last=null;
   try{const {data}=await getCurrent();output.textContent=JSON.stringify({
    review:data.review,continuity_status:data.continuity_status,
    followup_status:data.followup_status,owner_user_id:data.owner_user_id
   },null,2);}catch(e){output.textContent='HOLD: '+String(e.message||e);}finally{refresh.disabled=false;}
  });
  submit.addEventListener('click',async()=>{
   submit.disabled=true;
   try{
    const {data,input}=await getCurrent();
    if(!data.review?.review_ready){output.textContent='Review HOLD: '+JSON.stringify(data.review?.holds||[]);return;}
    const body={product_id:input.product_id,destination:input.destination,draft_id:input.draft_id,
     action:'ack_exception_followup',choice:choice.value,owner_note:note.value,
     request_key:crypto.randomUUID().replaceAll('-',''),
     expected_source_signature:data.source_signature,expected_receipts:data.current_receipts,
     expected_exception_decision_receipt:data.latest_decision_receipt,
     expected_previous_ack_receipt:data.review.latest_ack_receipt};
    for(const [k,c] of Object.entries(checks))body[k]=c.checked;
    const r=await window.DDAuth.apiFetch('/api/admin/provider-exception-ack-422',{method:'POST',
     headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const value=await r.json();
    output.textContent=r.ok?'Local acknowledgement #'+value.receipt+' saved. No provider state changed.':
     'Acknowledgement HOLD: '+JSON.stringify(value.blockers||value.error);
   }catch(e){output.textContent='No acknowledgement confirmed: '+String(e.message||e);}
   finally{submit.disabled=false;}
  });
  section.append(title,intro,refresh,choice,note,checkGroup,submit,output);anchor.after(section);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
