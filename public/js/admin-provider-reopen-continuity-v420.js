// Build 420 — explicit, read-only case-scoped owner decision timeline.
(()=>{
 const initialize=()=>{
  const anchor=document.getElementById('provider419')||document.getElementById('provider418');
  if(!anchor||document.getElementById('provider420'))return;
  const section=document.createElement('section');section.className='card';section.id='provider420';
  section.style.padding='16px';section.style.marginTop='18px';
  const title=document.createElement('h2');title.textContent='Build 420 — Owner review continuity & local exception history';
  const note=document.createElement('p');note.className='small';
  note.textContent='Read-only owner approval, linked manual decisions and exception history. No automatic case reopening or marketplace actions.';
  const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.textContent='Review current decision continuity';
  const status=document.createElement('pre');status.setAttribute('role','status');
  status.style.whiteSpace='pre-wrap';status.style.overflowWrap='anywhere';
  status.textContent='Select a Product and destination in the existing Admin case review.';
  btn.addEventListener('click',async()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!product_id||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!draft_id)){
    status.textContent='Select a Product, destination and saved Etsy draft if applicable.';return;
   }
   if(!window.DDAuth?.apiFetch){status.textContent='Verified Admin session required.';return;}
   const qs=new URLSearchParams({mode:'detail',product_id,destination});
   if(destination==='etsy')qs.set('draft_id',draft_id);
   btn.disabled=true;
   try{
    const res=await window.DDAuth.apiFetch('/api/admin/provider-reopen-continuity-420?'+qs,{method:'GET'});
    const data=await res.json();
    status.textContent=res.ok?JSON.stringify(data.owner_continuity,null,2):
      'Review HOLD: '+String(data.error||res.status);
   }catch{status.textContent='Continuity evidence unavailable. No reopening authorized.';}
   finally{btn.disabled=false;}
  });
  section.append(title,note,btn,status);anchor.after(section);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
