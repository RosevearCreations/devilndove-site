// Build 421 — manual read-only exception follow-up review, no writes or background polling.
(()=>{
 const init=()=>{
  const anchor=document.getElementById('provider420');
  if(!anchor||document.getElementById('provider421'))return;
  const section=document.createElement('section');section.id='provider421';section.className='card';
  section.style.padding='16px';section.style.marginTop='18px';
  const title=document.createElement('h2');title.textContent='Build 421 — Exception follow-up receipt review';
  const note=document.createElement('p');note.className='small';
  note.textContent='Compare manual exception decisions with later local follow-up receipts. Read-only: no exception resolution, marketplace requests or notifications.';
  const btn=document.createElement('button');btn.type='button';btn.className='btn';
  btn.textContent='Verify exception follow-up evidence';
  const status=document.createElement('pre');status.setAttribute('role','status');
  status.style.whiteSpace='pre-wrap';status.style.overflowWrap='anywhere';
  status.textContent='Select a case in Build 414 first.';
  btn.addEventListener('click',async()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!product_id||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!draft_id)){
    status.textContent='Choose a Product and destination (plus Etsy draft when applicable).';return;
   }
   if(!window.DDAuth?.apiFetch){status.textContent='Verified Admin authentication unavailable.';return;}
   const qs=new URLSearchParams({mode:'detail',product_id,destination});
   if(destination==='etsy')qs.set('draft_id',draft_id);
   btn.disabled=true;
   try{
    const res=await window.DDAuth.apiFetch('/api/admin/provider-exception-followup-421?'+qs,{method:'GET'});
    const data=await res.json();
    status.textContent=res.ok?JSON.stringify({
     decision_continuity:data.decision_continuity,
     exception_followup_review:data.exception_followup_review
    },null,2):'Evidence HOLD: '+String(data.error||res.status);
   }catch{status.textContent='Evidence unavailable. No automatic exception resolution.';}
   finally{btn.disabled=false;}
  });
  section.append(title,note,btn,status);anchor.after(section);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
