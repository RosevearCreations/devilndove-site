// Release 467 Build 419 — explicit local owner reopen/exception decision, never provider action.
(()=>{
 const mount=()=>{
  const anchor=document.getElementById('provider418');
  if(!anchor||document.getElementById('provider419'))return;
  const section=document.createElement('section');section.id='provider419';section.className='card';
  section.style.padding='16px';section.style.marginTop='18px';
  const title=document.createElement('h2');title.textContent='Build 419 — Manual reopen review & exception decision';
  const intro=document.createElement('p');intro.className='small';
  intro.textContent='This creates a LOCAL audit receipt only. No escalation is reopened, provider contacted, listing published, or notification sent.';
  const choice=document.createElement('select');choice.className='input';
  for(const [value,label] of [
    ['REQUEST_MANUAL_REOPEN_REVIEW','Request human reopen review (no reopening)'],
    ['HOLD_FOR_EVIDENCE_RECONCILIATION','Place local evidence review on HOLD'],
    ['ESCALATE_FOR_MANUAL_EXCEPTION','Record local manual exception escalation']
  ]){const opt=document.createElement('option');opt.value=value;opt.textContent=label;choice.append(opt);}
  const note=document.createElement('textarea');note.className='input';note.rows=3;note.maxLength=600;
  note.placeholder='Reason and locally reviewed evidence (20–600 characters)';
  const checks={};
  const labels=[
    ['confirm_manual_review','I explicitly request this manual review decision'],
    ['confirm_local_only','This decision is a local audit receipt only'],
    ['confirm_no_provider_action','No marketplace case will be reopened or contacted'],
    ['confirm_no_publication','No listing publication will take place'],
    ['confirm_us_shipping_suspended','U.S. shipping remains suspended']
  ];
  for(const [key,label] of labels){
   const line=document.createElement('label');line.style.display='block';
   const c=document.createElement('input');c.type='checkbox';checks[key]=c;
   line.append(c,document.createTextNode(' '+label));section.append(line);
  }
  const button=document.createElement('button');button.type='button';button.className='btn';
  button.textContent='Record explicit local decision';
  const output=document.createElement('pre');output.setAttribute('role','status');
  output.style.whiteSpace='pre-wrap';output.style.overflowWrap='anywhere';
  output.textContent='Select and inspect the Build 414 case before recording a decision.';
  button.addEventListener('click',async()=>{
   const product_id=document.getElementById('provider414Product')?.value?.trim();
   const destination=document.getElementById('provider414Destination')?.value;
   const draft_id=document.getElementById('provider414Draft')?.value?.trim();
   if(!product_id||!['etsy','facebook'].includes(destination)||(destination==='etsy'&&!draft_id)){
    output.textContent='Select Product, destination and saved local Etsy draft if applicable.';return;
   }
   if(!window.DDAuth?.apiFetch){output.textContent='Verified Admin session required.';return;}
   if(!window.crypto?.randomUUID){output.textContent='Secure request key unavailable.';return;}
   button.disabled=true;output.textContent='Reloading current local receipts…';
   try{
    const qs=new URLSearchParams({mode:'detail',product_id,destination});
    if(destination==='etsy')qs.set('draft_id',draft_id);
    const [detailRes,historyRes]=await Promise.all([
     window.DDAuth.apiFetch('/api/admin/provider-completion-414?'+qs,{method:'GET'}),
     window.DDAuth.apiFetch('/api/admin/provider-closure-history-418?'+qs,{method:'GET'})
    ]);
    if(!detailRes.ok||!historyRes.ok)throw Error('Unable to verify current Admin evidence.');
    const snapshot=await detailRes.json(),data=await historyRes.json();
    if(!snapshot.ok||!data.ok)throw Error('Current audit evidence is not available.');
    const rows=data.history?.history||[];
    const approval=rows.find(r=>r.action_type==='provider_escalation_417_owner_approval'&&
      r.escalation_receipt===snapshot.evidence_receipts.escalation&&r.safe_local_only&&
      r.source_signature===snapshot.source_signature);
    const previous=rows.find(r=>r.action_type==='provider_escalation_419_reopen_decision');
    if(!approval)throw Error('A matching Build 417 owner approval must be recorded first.');
    const body={action:'record_manual_reopen_decision',decision:choice.value,
      product_id:Number(product_id),destination,draft_id:destination==='etsy'?draft_id:null,
      expected_source_signature:snapshot.source_signature,
      expected_receipts:snapshot.evidence_receipts,
      expected_approval_receipt:approval.receipt,
      expected_previous_decision_receipt:previous?.receipt||0,
      request_key:window.crypto.randomUUID().replaceAll('-',''),
      owner_note:note.value};
    for(const [key,check] of Object.entries(checks))body[key]=check.checked;
    const result=await window.DDAuth.apiFetch('/api/admin/provider-reopen-decision-419',
     {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const x=await result.json();
    output.textContent=result.ok?'Local decision receipt #'+x.receipt+' saved. No provider or escalation state changed.':
      'Decision HOLD: '+JSON.stringify(x.blockers||x.error);
   }catch(e){output.textContent='No local decision confirmed: '+String(e.message||e);}
   finally{button.disabled=false;}
  });
  section.prepend(title,intro,choice,note);section.append(button,output);anchor.after(section);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
