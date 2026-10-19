// Build 423 — on-demand, read-only Admin governance of owner handoff receipts.
(()=>{
 const mount=()=>{
  const anchor=document.getElementById('provider422')||document.getElementById('provider421');
  if(!anchor||document.getElementById('provider423'))return;
  const card=document.createElement('section');card.className='card';card.id='provider423';
  card.style.padding='16px';card.style.marginTop='18px';
  const title=document.createElement('h2');
  title.textContent='Build 423 — Handoff governance & manual exception follow-up';
  const hint=document.createElement('p');hint.className='small';
  hint.textContent='Read-only: compare original handoff requests, receiver acknowledgements and follow-up decisions. A local receipt never automatically changes owner, closes an exception or contacts a provider.';
  const button=document.createElement('button');button.type='button';button.className='btn';
  button.textContent='Reconcile owner handoff and follow-up receipts';
  const output=document.createElement('pre');output.setAttribute('role','status');
  output.style.whiteSpace='pre-wrap';output.style.overflowWrap='anywhere';
  output.textContent='Select one Product/destination in the existing Admin case first.';
  button.addEventListener('click',async()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!product_id||!['etsy','facebook'].includes(destination)||
    (destination==='etsy'&&!draft_id)){
    output.textContent='Choose a valid Product, destination, and Etsy draft where applicable.';return;
   }
   if(!window.DDAuth?.apiFetch){output.textContent='Verified Admin session required.';return;}
   const qs=new URLSearchParams({mode:'detail',product_id,destination});
   if(destination==='etsy')qs.set('draft_id',draft_id);
   button.disabled=true;
   try{
    const r=await window.DDAuth.apiFetch('/api/admin/provider-handoff-governance-423?'+qs,{method:'GET'});
    const data=await r.json();
    output.textContent=r.ok?JSON.stringify({
     owner_review_status:data.owner_review_status,
     followup_review_status:data.followup_review_status,
     governance:data.governance},null,2):
     'Manual governance HOLD: '+String(data.error||r.status);
   }catch{output.textContent='Governance evidence unavailable. No automatic handoff or closure.';}
   finally{button.disabled=false;}
  });
  card.append(title,hint,button,output);anchor.after(card);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
