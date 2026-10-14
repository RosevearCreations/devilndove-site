// Release 467 Build 397 — deliberate operator-review UX; no automatic polling or Product/Etsy writes.
(()=>{'use strict';
const get=id=>document.getElementById(id),connect=get('etsy397ConnectionCheck'),load=get('etsy397ProductCheck'),
 pid=get('etsy397ProductId'),message=get('etsy397Message'),conn=get('etsy397ConnectionSummary'),
 product=get('etsy397ProductSummary'),actionMount=get('etsy397OutcomeAction');
if(!connect||!load||!pid||!message||!conn||!product||!actionMount)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cad=v=>Number.isSafeInteger(v)?'CAD $'+(v/100).toFixed(2):'Unknown CAD amount';
let busy=false,last=null;
async function call(url,options={}){
 if(!window.DDAuth?.apiFetch)throw Error('Verified administrator session required.');
 const response=await window.DDAuth.apiFetch(url,{cache:'no-store',...options});
 const d=await response.json().catch(()=>null);
 if(!response.ok||!d?.ok)throw Error(d?.error||'Admin evidence request failed.');
 return d;
}
function wait(value){
 busy=value;connect.disabled=value;load.disabled=value;
 connect.textContent=value?'Reading evidence…':'Refresh stored Etsy connection evidence';
 load.textContent=value?'Reading Product…':"Review one Product's price outcome";
}
function connectionView(x){
 const e=x?.observability;if(!e)return;
 conn.innerHTML='<div class="card"><strong>Stored Etsy evidence</strong><p class="small">Connection: '+
 esc(e.health_status)+' · priority: '+esc(e.priority)+
 ' · shop verification age: '+(Number.isFinite(e.verification_age_days)?Number(e.verification_age_days)+' days':'unknown')+
 '</p><p class="small">Latest callback record: '+esc(e.callback_outcome)+' · '+esc(e.callback_recorded_at||'no recorded timestamp')+
 '. A failed historical callback does not prove the shop is currently disconnected.</p>'+
 '<p class="small">No provider request, token disclosure, automatic reconnect or listing update occurred.</p></div>';
}
async function refreshConnection(){
 if(busy)return;wait(true);message.textContent='Reading stored Etsy evidence…';
 try{const r=await call('/api/admin/etsy-connection-price-outcomes',{method:'GET'});
 connectionView(r);message.textContent='Stored connection evidence loaded; this is not a live Etsy status probe.';}
 catch(e){message.textContent='Connection evidence unavailable: '+e.message+'. Treat status as unknown.';}
 finally{wait(false);}
}
async function refreshProduct(){
 if(busy)return;
 const n=Number(pid.value),text=pid.value.trim();
 if(!/^[1-9]\d{0,9}$/.test(text)||!Number.isSafeInteger(n)||n>2147483647){
  message.textContent='Enter a valid Product ID.';return;}
 wait(true);last=null;product.replaceChildren();actionMount.replaceChildren();
 message.textContent='Reading current Product, approved source and operator receipts…';
 try{const result=await call('/api/admin/etsy-connection-price-outcomes?product_id='+encodeURIComponent(n),{method:'GET'});
  last=result;connectionView(result);render();
 }catch(e){message.textContent='Product evidence unavailable: '+e.message+'. No price was changed.';}
 finally{wait(false);}
}
function render(){
 if(!last?.evidence)return;
 const e=last.evidence,p=last.product,prior=last.last_operator_outcome;
 const status=last.outcome_review_state||'unknown';
 product.innerHTML='<div class="card"><p><strong>Product #'+Number(p.product_id)+': '+esc(p.name)+'</strong></p>'+
 '<p class="small">Current price: '+cad(e.current_price_cents)+' · approved source price: '+cad(e.approved_price_cents)+
 ' · source receipt: '+(e.source_receipt_id?'#'+Number(e.source_receipt_id):'not provided')+'</p>'+
 '<p class="small">Comparison: '+esc(e.outcome)+' · review state: '+esc(status)+'</p>'+
 '<p class="small">Latest outcome receipt: '+(prior?.receipt_id?'#'+Number(prior.receipt_id)+' ('+esc(prior.action)+')':'none')+
 '. Original selling-price evidence is operator-attested, not independently authenticated.</p>'+
 '<p class="small"><a href="/admin/products/#productBrowser390PriceAuditPanel">Open Product price-source entry</a>. Review in Product Editor separately before any price change.</p></div>';
 const choices={approved_source_missing:'record_source_needed',
 approved_source_discrepancy:'record_discrepancy_review',approved_source_matches:'confirm_approved_price_match'};
 const decision=choices[e.outcome]||null;
 if(!decision){
  actionMount.replaceChildren();message.textContent='Comparison needs manual investigation; no supported automatic decision.';return;
 }
 const form=document.createElement('form');form.className='card';
 form.innerHTML='<p><strong>Operator price-review outcome:</strong> '+esc(decision.replaceAll('_',' '))+'</p>'+
 '<p class="small">This records an audit review, not a price correction or confirmation that a source document was independently verified.</p>'+
 '<label>Original source / operator work reference<input class="input" name="reference" required minlength="6" maxlength="120" placeholder="e.g. PRICE-REVIEW-397-001"></label>'+
 '<label><input type="checkbox" name="confirmed" required> I reviewed the current Product and source evidence and authorize only this audit outcome.</label>'+
 '<button class="btn primary" type="submit">Record '+esc(decision.replaceAll('_',' '))+'</button>'+
 '<p class="small" role="status" data-outcome-status>No database write until confirmed.</p>';
 actionMount.replaceChildren(form);
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const reference=form.elements.reference.value.trim(),confirmed=form.elements.confirmed.checked,
   button=form.querySelector('button'),out=form.querySelector('[data-outcome-status]');
  if(!confirmed||reference.length<6){out.textContent='Provide an evidence reference and confirm this decision.';return;}
  if(!globalThis.crypto?.randomUUID){out.textContent='Secure request key unavailable. No write attempted.';return;}
  const requestKey=globalThis.crypto.randomUUID().replaceAll('-'),snapshot=last;
  busy=true;button.disabled=true;connect.disabled=true;load.disabled=true;button.textContent='Recording review…';
  out.textContent='Saving one idempotent operator receipt. Please wait…';
  try{
   const saved=await call('/api/admin/etsy-connection-price-outcomes',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({
     product_id:snapshot.evidence.product_id,action:decision,fingerprint:snapshot.evidence.fingerprint,
     operator_reference:reference,request_key:requestKey,operator_confirmed:true})});
   if(!Number.isSafeInteger(Number(saved.receipt_id))||Number(saved.receipt_id)<1)throw Error('Persisted receipt unconfirmed.');
   const readback=await call('/api/admin/etsy-connection-price-outcomes?product_id='+encodeURIComponent(snapshot.evidence.product_id),{method:'GET'});
   if(Number(readback.last_operator_outcome?.receipt_id)!==Number(saved.receipt_id)){
    out.textContent='Receipt may be saved but another operator changed the current review. Inspect audit records before retrying.';return;}
   last=readback;connectionView(readback);render();
   message.textContent='Operator outcome recorded and read back: receipt #'+Number(saved.receipt_id)+'. No Product price or Etsy listing change.';
  }catch(err){out.textContent='Outcome unknown or rejected: '+err.message+'. Reload evidence and audit before any new submission; no automatic retry.';}
  finally{busy=false;connect.disabled=false;load.disabled=false;button.disabled=false;button.textContent='Record '+decision.replaceAll('_',' ');}
 });
 message.textContent='Price outcome evidence loaded. Operator review is available; no Product writes have occurred.';
}
connect.addEventListener('click',()=>void refreshConnection());
load.addEventListener('click',()=>void refreshProduct());
})();