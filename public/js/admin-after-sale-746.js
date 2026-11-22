/* Build 746. Manual original-order after-sale evidence; no payment, carrier, product
 * mutation, customer notification, shipping, refund or case automation.
 */
(()=>{'use strict';
 const $=id=>document.getElementById(id),API='/api/admin/after-sale-746';
 if(!$('a746Load'))return;
 let active=null,busy=false,pendingRequestKey=null;
 const set=(id,v)=>{$(id).textContent=String(v??'');};
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);return node;};
 const money=c=>Number.isSafeInteger(c)?new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(c/100):'Amount not verified';
 const safeError=e=>String(e?.message||'No original evidence available').slice(0,240);
 function stateBusy(v){busy=v;for(const id of ['a746Load','a746Save','a746Reset'])$(id).disabled=v;}
 function orderId(){
  const id=String($('a660Id')?.value||'').trim();
  return /^[1-9][0-9]{0,9}$/.test(id)?id:null;
 }
 function render(data){
  active=data;
  $('a746CaseForm').hidden=false;
  const dest=$('a746Order');dest.replaceChildren();
  const o=data.order,j=data.case_journal;
  const p=el('p');
  p.append(el('strong','Order '+o.order_number+' (#'+o.order_id+')'));
  p.append(el('span',' · '+o.order_status+' · payment '+o.payment_status+' · '+o.fulfillment_type+
   ' · '+money(o.total_cents)+' CAD'));
  dest.append(p);
  const q=el('p','Private case version '+j.version+' · '+j.history.length+
    ' local evidence receipts. Original order updated '+(o.updated_at||'unknown')+'.');
  dest.append(q);
  const history=$('a746History');history.replaceChildren();
  if(!j.history.length)history.append(el('li','No private cases recorded. All external evidence remains HOLD.'));
  for(const receipt of j.history){
   const item=el('li');
   item.append(el('strong',receipt.case_type+' / '+receipt.stage));
   item.append(el('p',(receipt.recorded_at||'Unknown date')+' · '+receipt.notes));
   if(receipt.evidence_reference)item.append(el('p','Source reference: '+receipt.evidence_reference));
   item.append(el('p','Provider, refund, pickup completion and customer reply not verified by this receipt.'));
   history.append(item);
  }
  set('a746Status','Original saved Order loaded. One manual case note may be recorded; no refund, delivery or customer communication will occur.');
 }
 async function getOne(id){
  const signal=typeof AbortSignal?.timeout==='function'?AbortSignal.timeout(9000):undefined;
  const res=await fetch(API+'?order_id='+encodeURIComponent(id),{
   method:'GET',cache:'no-store',credentials:'same-origin',
   headers:{Accept:'application/json'},...(signal?{signal}:{})});
  const data=await res.json().catch(()=>({error:'Original Order response could not be read.'}));
  if(!res.ok||!data.ok)throw Error(data.error||'HTTP '+res.status);
  return data;
 }
 async function refresh(){
  if(busy)return;const id=orderId();
  if(!id){set('a746Status','Enter an existing numeric Order ID in section 3 first.');return;}
  stateBusy(true);set('a746Status','Checking original order and private after-sale receipts…');
  $('a746CaseForm').hidden=true;active=null;
  try{
   const data=await getOne(id);pendingRequestKey=null;render(data);
  }catch(e){set('a746Status','HOLD: '+safeError(e)+'. No case or order was changed.');}
  finally{stateBusy(false);}
 }
 async function postOne(payload){
  const signal=typeof AbortSignal?.timeout==='function'?AbortSignal.timeout(10000):undefined;
  const res=await fetch(API,{method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),
   ...(signal?{signal}:{})});
  const data=await res.json().catch(()=>({error:'Server response unreadable; do not resubmit without checking history.'}));
  if(!res.ok||!data.ok)throw Error((data.code?data.code+': ':'')+(data.error||'HTTP '+res.status));
  return data;
 }
 async function save(event){
  event.preventDefault();if(busy||!active)return;
  const id=orderId();
  if(!id||Number(id)!==active.order.order_id){
   set('a746SaveStatus','Original Order ID changed. Reload before saving.');return;
  }
  const notes=$('a746Notes').value.trim(),ref=$('a746EvidenceRef').value.trim(),
   stage=$('a746Stage').value,case_type=$('a746CaseType').value;
  if(notes.length<20){set('a746SaveStatus','Enter at least 20 characters describing actual work.');return;}
  if(stage==='handoff_recorded'&&ref.length<8){
   set('a746SaveStatus','A recorded handoff needs a real original source reference.');return;}
  const key=pendingRequestKey||crypto.randomUUID();pendingRequestKey=key;
  stateBusy(true);set('a746SaveStatus','Saving one private note. No refund, customer notification or pickup action is being executed.');
  try{
   const result=await postOne({order_id:id,expected_version:active.case_journal.version,
    request_key:key,case_type,stage,notes,evidence_reference:ref});
   pendingRequestKey=null;
   const current=await getOne(id);
   render(current);
   set('a746SaveStatus',result.replayed?'Existing matching receipt verified.':
    'Private case receipt saved. This is not a customer reply, refund, pickup confirmation or accounting entry.');
   $('a746CaseForm').reset();
  }catch(e){
   set('a746SaveStatus','HOLD: '+safeError(e)+'. Check the original receipt history before retrying. No provider or financial action was attempted.');
  }finally{stateBusy(false);}
 }
 $('a746Load').addEventListener('click',refresh);
 $('a746Reset').addEventListener('click',()=>{pendingRequestKey=null;refresh()});
 $('a746CaseForm').addEventListener('submit',save);
})();