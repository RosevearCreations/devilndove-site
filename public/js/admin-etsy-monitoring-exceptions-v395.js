// Build 395 — deliberate on-demand review only. No polling, provider call, automatic retries or price changes.
(()=>{'use strict';
const id=x=>document.getElementById(x);
const scope=id('etsyExceptionScope'),pid=id('etsyExceptionProductId'),read=id('etsyExceptionRead'),
 status=id('etsyExceptionMessage'),summary=id('etsyExceptionSummary'),action=id('etsyExceptionAction');
if(!scope||!pid||!read||!status||!summary||!action)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const call=async(url,options)=>{if(!window.DDAuth?.apiFetch)throw Error('Verified admin session required.');
 const response=await window.DDAuth.apiFetch(url,options),body=await response.json().catch(()=>null);
 if(!response.ok||!body?.ok)throw Error(body?.error||('HTTP '+response.status));
 return body;};
let current=null,busy=false;
const message=s=>{status.textContent=s;};
const setBusy=(flag)=>{busy=flag;read.disabled=flag;read.textContent=flag?'Checking evidence…':'Check stored evidence';};
const args=()=>{const type=scope.value;const n=Number(pid.value);
 return type==='etsy'?{scope:'etsy',product_id:null}:
 Number.isSafeInteger(n)&&n>0?{scope:'product',product_id:n}:null;};
const urlFor=q=>'/api/admin/etsy-monitoring-exceptions?scope='+encodeURIComponent(q.scope)+(q.product_id?'&product_id='+encodeURIComponent(q.product_id):'');
async function check(){
 if(busy)return;
 const query=args();if(!query){message('Enter a valid Product ID.');return;}
 current=null;summary.replaceChildren();action.replaceChildren();setBusy(true);message('Checking stored evidence; no provider call…');
 try{
  const data=await call(urlFor(query),{method:'GET',cache:'no-store'});
  current={...query,data};render();
 }catch(err){message('Evidence unavailable or status unknown: '+err.message+' No automatic retry or resolution.');}
 finally{setBusy(false);}
}
function render(){
 if(!current)return;
 const e=current.data.exception,previous=current.data.last_operator_decision;
 summary.innerHTML='<div class="card"><p><strong>Exception:</strong> '+esc(e.code)+'</p>'+
 '<p class="small">Status: '+(e.active?'Active — operator attention required':'No currently active exception based on stored evidence')+
 '. '+esc(e.action)+'</p>'+
 '<p class="small">Stored evidence: '+esc(e.health_status||e.review_outcome||'unknown')+
 ' · Previous operator decision: '+esc(previous?.decision||'none')+
 (previous?.receipt_id?' (receipt #'+Number(previous.receipt_id)+')':'')+'</p>'+
 '<p class="small">A previously acknowledged problem is not automatically resolved. Even after a verified recovery, an authorized operator must record its resolution.</p></div>';
 message('Read-only evidence loaded. '+(e.active?'This condition needs review.':'No currently active condition; historical issues may need explicit closure.'));
 const allowed=e.active?'acknowledge':'resolution_reviewed';
 if(!e.active&&previous?.decision==='resolution_reviewed'){
  action.replaceChildren();message('Latest operator resolution already reviewed. No new automatic action is needed.');return;
 }
 action.innerHTML='<form id="etsyExceptionForm" class="card" style="margin-top:12px">'+
 '<label>Operator evidence / work ticket reference<input class="input" name="operator_reference" minlength="6" maxlength="120" required placeholder="e.g. REVIEW-395-001"></label>'+
 '<p class="small">Decision: <strong>'+esc(allowed)+'</strong>. '+(e.active?'This will NOT resolve the underlying issue.':'Resolution requires a prior acknowledgement and currently healthy evidence.')+'</p>'+
 '<label><input type="checkbox" name="confirmed" required> I reviewed the evidence and authorize this audit-only decision.</label>'+
 '<button type="submit" class="btn primary">Record '+esc(allowed.replace('_',' '))+'</button>'+
 '<p class="small" data-result role="status">No changes to Etsy listings, Product prices or connection credentials.</p></form>';
 const form=id('etsyExceptionForm');
 form.addEventListener('submit',async(ev)=>{
  ev.preventDefault();if(!current||busy)return;
  const confirm=form.elements.confirmed.checked,ref=form.elements.operator_reference.value.trim();
  const button=form.querySelector('button'),receipt=form.querySelector('[data-result]');
  if(!confirm||ref.length<6){receipt.textContent='Enter a real operator work reference and confirm the decision.';return;}
  if(!globalThis.crypto?.randomUUID){receipt.textContent='Secure idempotency key unavailable. No action submitted.';return;}
  const requestKey=globalThis.crypto.randomUUID().replaceAll('-','');
  busy=true;button.disabled=true;button.textContent='Saving decision…';read.disabled=true;
  receipt.textContent='Recording one audit decision; do not click again.';
  try{
   const q=current;
   const result=await call('/api/admin/etsy-monitoring-exceptions',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({scope:q.scope,product_id:q.product_id,decision:allowed,fingerprint:q.data.exception.fingerprint,
    operator_reference:ref,request_key:requestKey,operator_confirmed:true})});
   if(!Number.isSafeInteger(Number(result.receipt_id))||Number(result.receipt_id)<=0)throw Error('Audit receipt not confirmed.');
   receipt.textContent='Audit receipt #'+Number(result.receipt_id)+' confirmed. Refreshing stored status…';
   const fresh=await call(urlFor(q),{method:'GET',cache:'no-store'});
   if(Number(fresh.last_operator_decision?.receipt_id)!==Number(result.receipt_id)){
    receipt.textContent='Receipt recorded but latest evidence differs. Check audit history before any retry.';
    return;
   }
   current={...q,data:fresh};render();
   message('Operator decision confirmed with persisted receipt #'+Number(result.receipt_id)+'.');
  }catch(err){receipt.textContent='Outcome unknown or rejected: '+err.message+' Reload the evidence and audit before any new submission. No automatic retry.';}
  finally{busy=false;button.disabled=false;button.textContent='Record '+allowed.replace('_',' ');read.disabled=false;}
 });
}
scope.addEventListener('change',()=>{current=null;summary.replaceChildren();action.replaceChildren();message('Scope changed. Check stored evidence to continue.');});
read.addEventListener('click',()=>void check());
})();