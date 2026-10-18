// Build 416 — explicit, read-only Admin closure packet; no writes.
(()=>{
 const init=()=>{
  const root=document.getElementById('provider415')||document.getElementById('provider414');
  if(!root||document.getElementById('provider416'))return;
  const section=document.createElement('section');section.id='provider416';section.className='card';
  section.style.marginTop='18px';section.style.padding='16px';
  const title=document.createElement('h2');title.textContent='Build 416 — Closure evidence packet';
  const note=document.createElement('p');note.className='small';note.textContent='Local immutable receipt references and evidence holds. Read-only: no marketplace calls or automatic closure.';
  const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.textContent='Review current closure evidence';
  const out=document.createElement('pre');out.setAttribute('role','status');out.style.whiteSpace='pre-wrap';out.style.overflowWrap='anywhere';out.textContent='Choose a case in Build 414.';
  btn.addEventListener('click',async()=>{
   const pid=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft=document.getElementById('provider414Draft')?.value?.trim();
   if(!pid||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!draft)){out.textContent='Select an existing case and local Etsy draft when applicable.';return;}
   if(!window.DDAuth||typeof window.DDAuth.apiFetch!=='function'){out.textContent='Verified Admin session unavailable.';return;}
   const params=new URLSearchParams({mode:'detail',product_id:pid,destination});if(destination==='etsy')params.set('draft_id',draft);
   btn.disabled=true;try{
    const r=await window.DDAuth.apiFetch('/api/admin/provider-closure-packet-416?'+params,{method:'GET'});
    const d=await r.json();out.textContent=r.ok?JSON.stringify(d,null,2):'Evidence HOLD: '+String(d.error||r.status);
   }catch{out.textContent='Evidence unavailable; no closure authorized.';}finally{btn.disabled=false;}
  });
  section.append(title,note,btn,out);root.after(section);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
