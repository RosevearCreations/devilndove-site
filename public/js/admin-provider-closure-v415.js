// Build 415 read-only operator decision panel. Never invokes a provider or closure write.
(() => {
 const render=()=>{
  const parent=document.getElementById('provider414');
  if(!parent||document.getElementById('provider415'))return;
  const section=document.createElement('section'); section.id='provider415';
  section.className='card';section.style.marginTop='18px';section.style.padding='16px';
  const title=document.createElement('h2');title.textContent='Build 415 — Escalation closure decision support';
  const info=document.createElement('p');info.className='small';
  info.textContent='Read-only local evidence review. Does not close an escalation, confirm provider completion, publish to Etsy/Meta, send notifications or change US shipping.';
  const button=document.createElement('button');button.type='button';button.className='btn';
  button.textContent='Review closure readiness (read-only)';
  const status=document.createElement('pre');status.id='provider415Status';status.style.whiteSpace='pre-wrap';status.style.overflowWrap='anywhere';
  status.setAttribute('role','status');status.textContent='Select and inspect a Build 414 case first.';
  button.addEventListener('click',async()=>{
   const pid=document.getElementById('provider414Product')?.value?.trim();
   const dest=document.getElementById('provider414Destination')?.value;
   const draft=document.getElementById('provider414Draft')?.value?.trim();
   if(!pid||!['etsy','facebook'].includes(dest)||(dest==='etsy'&&!draft)){
    status.textContent='Select Product, destination and the existing Etsy local draft (when applicable).';return;
   }
   if(!window.DDAuth||typeof window.DDAuth.apiFetch!=='function'){
    status.textContent='Verified Admin session unavailable.';return;
   }
   button.disabled=true;status.textContent='Reading existing local evidence only…';
   try{
    const qs=new URLSearchParams({mode:'detail',product_id:pid,destination:dest});
    if(dest==='etsy')qs.set('draft_id',draft);
    const res=await window.DDAuth.apiFetch('/api/admin/provider-closure-415?'+qs.toString(),{method:'GET'});
    const data=await res.json();
    status.textContent=res.ok?JSON.stringify(data.closure_decision,null,2):
      'Closure decision unavailable ('+res.status+'): '+String(data.error||'Evidence HOLD');
   }catch{status.textContent='Evidence unavailable. No closure authorized.';}
   finally{button.disabled=false;}
  });
  section.append(title,info,button,status);parent.after(section);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
 else render();
})();
