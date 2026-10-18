// Build 417 — explicit human-controlled local closure approval.
(()=>{
 const mount=()=>{
  const base=document.getElementById('provider416');
  if(!base||document.getElementById('provider417'))return;
  const section=document.createElement('section');section.id='provider417';section.className='card';section.style.padding='16px';
  const heading=document.createElement('h2');heading.textContent='Build 417 — Local owner closure approval';
  const intro=document.createElement('p');intro.textContent='Approval records an immutable LOCAL review receipt. It does not close an escalation or publish to Etsy or Meta.';
  const note=document.createElement('textarea');note.className='input';note.rows=3;note.maxLength=600;note.placeholder='Explain the evidence reviewed and why local approval is justified (20–600 characters).';
  const confirmations=[
   ['confirm_local_only','I approve a LOCAL audit-only closure review.'],
   ['confirm_no_provider_closure','I understand this does NOT close a provider case.'],
   ['confirm_no_publication','I confirm no marketplace publication.'],
   ['confirm_us_shipping_suspended','I confirm U.S. shipping stays suspended.']
  ];
  const checks={};
  for(const [key,title] of confirmations){const l=document.createElement('label');const c=document.createElement('input');c.type='checkbox';checks[key]=c;l.append(c,document.createTextNode(' '+title));section.append(l);}
  const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='Approve local evidence review';
  const status=document.createElement('pre');status.setAttribute('role','status');status.style.whiteSpace='pre-wrap';
  button.addEventListener('click',async()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!product_id||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!draft_id)){status.textContent='Choose a case and draft first.';return;}
   if(!window.DDAuth?.apiFetch){status.textContent='Verified Admin authentication unavailable.';return;}
   button.disabled=true;
   try{
    const qs=new URLSearchParams({mode:'detail',product_id,destination});if(destination==='etsy')qs.set('draft_id',draft_id);
    const d=await window.DDAuth.apiFetch('/api/admin/provider-completion-414?'+qs,{method:'GET'});
    if(!d.ok)throw Error('Current evidence unavailable: '+d.status);
    const snapshot=await d.json();
    const body={action:'approve_local_closure',product_id:Number(product_id),destination,draft_id,
     expected_source_signature:snapshot.source_signature,expected_receipts:snapshot.evidence_receipts,
     request_key:crypto.randomUUID().replace(/-/g,''),owner_note:note.value};
    for(const [key,c] of Object.entries(checks))body[key]=c.checked;
    const r=await window.DDAuth.apiFetch('/api/admin/provider-closure-approval-417',{method:'POST',
     headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await r.json();status.textContent=r.ok?'Local approval receipt #'+data.receipt+' saved. No provider state changed.':
     'Approval HOLD: '+JSON.stringify(data.blockers||data.error);
   }catch(e){status.textContent='No approval confirmed: '+String(e.message||e);}finally{button.disabled=false;}
  });
  section.prepend(heading,intro,note);section.append(button,status);base.after(section);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
