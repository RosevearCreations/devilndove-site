// Build 424 — manually requested Admin priority and closure safety review.
(()=>{
 const mount=()=>{
  const anchor=document.getElementById('provider423');
  if(!anchor||document.getElementById('provider424'))return;
  const card=document.createElement('section');card.className='card';card.id='provider424';
  card.style.padding='16px';card.style.marginTop='18px';
  const title=document.createElement('h2');
  title.textContent='Build 424 — Owner handoff acceptance & exception priorities';
  const hint=document.createElement('p');hint.className='small';
  hint.textContent='Review one case at a time. P0: evidence integrity, P1: handoff, P2: follow-up, P3: manual closure safety. No automatic actions.';
  const button=document.createElement('button');button.type='button';button.className='btn';
  button.textContent='Review owner acceptance and priority queue';
  const status=document.createElement('p');status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  status.textContent='Select the existing Admin Product and destination case first.';
  const list=document.createElement('ol');list.setAttribute('aria-label','Manual exception priority queue');
  button.addEventListener('click',async()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   list.replaceChildren();
   if(!/^[1-9]\d{0,14}$/.test(product_id||'')||!['etsy','facebook'].includes(destination)||
      (destination==='etsy'&&!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(draft_id||''))){
    status.textContent='Choose a valid Product, destination and Etsy draft where required.';return;
   }
   if(!window.DDAuth?.apiFetch){status.textContent='Verified Admin session required.';return;}
   const qs=new URLSearchParams({mode:'detail',product_id,destination});
   if(destination==='etsy')qs.set('draft_id',draft_id);
   button.disabled=true;status.textContent='Checking original local receipts...';
   try{
    const response=await window.DDAuth.apiFetch('/api/admin/provider-handoff-acceptance-424?'+qs,{method:'GET'});
    const data=await response.json();
    if(!response.ok||!data?.review){status.textContent='Manual HOLD: '+String(data?.error||response.status);return;}
    const review=data.review;
    status.textContent=review.handoff_acceptance_review_ready?
     'Eligible for human handoff acceptance review only. Manual closure remains separately gated.':
     'HOLD: reconcile source receipts before handoff acceptance. Closure remains prohibited by this report.';
    (Array.isArray(review.exception_queue)?review.exception_queue:[]).slice(0,102).forEach(x=>{
     const item=document.createElement('li');
     item.textContent=String(x.priority||'P0')+' — '+String(x.code||'EVIDENCE_HOLD')+
       ' (receipt '+String(x.receipt||0)+'): '+String(x.action||'Manual review required.');
     list.appendChild(item);
    });
   }catch{status.textContent='Manual HOLD: evidence unavailable. No automatic closure or handoff.';}
   finally{button.disabled=false;}
  });
  card.append(title,hint,button,status,list);anchor.after(card);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
