// Build 418 — read-only Admin decision history.
(()=>{
 const init=()=>{
  const anchor=document.getElementById('provider417')||document.getElementById('provider416');
  if(!anchor||document.getElementById('provider418'))return;
  const section=document.createElement('section');section.className='card';section.id='provider418';section.style.padding='16px';
  const title=document.createElement('h2');title.textContent='Build 418 — Closure decision history & reopen safeguards';
  const intro=document.createElement('p');intro.textContent='Review immutable local approvals and HOLD flags. Reopen is review-only, never automatic.';
  const button=document.createElement('button');button.className='btn';button.type='button';button.textContent='Inspect local closure history';
  const out=document.createElement('pre');out.setAttribute('role','status');out.style.whiteSpace='pre-wrap';out.style.overflowWrap='anywhere';out.textContent='Select an existing case above.';
  button.addEventListener('click',async()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!product_id||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!draft_id)){out.textContent='Select a product, destination and Etsy draft where required.';return;}
   if(!window.DDAuth?.apiFetch){out.textContent='Verified Admin session required.';return;}
   const qs=new URLSearchParams({mode:'detail',product_id,destination});if(destination==='etsy')qs.set('draft_id',draft_id);
   button.disabled=true;
   try{const res=await window.DDAuth.apiFetch('/api/admin/provider-closure-history-418?'+qs,{method:'GET'});const data=await res.json();
    out.textContent=res.ok?JSON.stringify(data.history,null,2):'Review HOLD: '+String(data.error||res.status);
   }catch{out.textContent='History unavailable; no reopening authorized.';}finally{button.disabled=false;}
  });
  section.append(title,intro,button,out);anchor.after(section);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
