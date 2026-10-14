// Release 467 Build 396 — on-demand internal alert routing only; no background checks.
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const scope=byId('etsyAlertScope'),pid=byId('etsyAlertProductId'),check=byId('etsyAlertCheck'),
 inbox=byId('etsyAlertInbox'),message=byId('etsyAlertMessage'),mount=byId('etsyAlertMount'),
 inboxMount=byId('etsyAlertInboxMount');
if(!scope||!pid||!check||!inbox||!message||!mount||!inboxMount)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=null,busy=false;
function args(){const t=scope.value,n=Number(pid.value);
 return t==='etsy'?{scope:t,product_id:null}:Number.isSafeInteger(n)&&n>0?{scope:t,product_id:n}:null;}
const endpoint=q=>'/api/admin/etsy-monitoring-alerts?scope='+encodeURIComponent(q.scope)+(q.product_id?'&product_id='+encodeURIComponent(q.product_id):'');
async function api(url,opts={}) {
 if(!window.DDAuth?.apiFetch)throw Error('Verified administrator sign-in required.');
 const res=await window.DDAuth.apiFetch(url,{cache:'no-store',...opts});
 const data=await res.json().catch(()=>null);
 if(!res.ok||!data?.ok)throw Error(data?.error||'Request rejected');
 return data;
}
function setBusy(flag){
 busy=flag;check.disabled=flag;inbox.disabled=flag;
 check.textContent=flag?'Checking…':'Check alert evidence';
 inbox.textContent=flag?'Please wait…':'View recent internal routes';
}
async function refresh(){
 if(busy)return;
 const q=args();if(!q){message.textContent='Enter a valid Product ID.';return;}
 current=null;mount.replaceChildren();setBusy(true);
 message.textContent='Checking stored exception evidence and audit receipts; no external provider call…';
 try{const data=await api(endpoint(q),{method:'GET'});current={...q,data};render();}
 catch(error){message.textContent='Evidence unavailable: '+error.message+'. Alert state unknown; no automatic retries.';}
 finally{setBusy(false);}
}
function render(){
 if(!current)return;
 const {exception:e,history:h}=current.data;
 const state=String(h.state||'unavailable'),route=h.route,ack=h.ack,closure=h.closure;
 const stateLabel=state.replaceAll('_',' ');
 mount.innerHTML='<div class="card"><p><strong>Stored exception:</strong> '+esc(e.code)+'</p>'+
 '<p class="small">Condition: '+(e.active?'active':'not active')+' · Internal queue status: '+esc(stateLabel)+'</p>'+
 '<p class="small">'+esc(e.action)+'</p>'+
 '<p class="small">Route receipt: '+(route?'#'+Number(route.receipt_id):'none')+
 '; acknowledgement: '+(ack?'#'+Number(ack.receipt_id):'none')+
 '; closure: '+(closure?'#'+Number(closure.receipt_id):'none')+'</p>'+
 '<p class="small">This view does not prove live Etsy connectivity. Only the stored records are classified.</p></div>';
 let decision=null;
 if(e.active&&(state==='unrouted'||state==='changed_requires_new_route'||state==='closed_by_operator'))decision='route';
 else if(route&&!ack&&!closure&&(state==='routed_pending_ack'||state==='recovered_needs_acknowledgement'))decision='acknowledge_route';
 else if(route&&ack&&!closure&&!e.active&&state==='recovered_pending_operator_closure')decision='close_reviewed';
 if(!decision){message.textContent='No alert action available for '+stateLabel+'. You may refresh the evidence manually.';return;}
 const form=document.createElement('form');form.className='card';form.style.marginTop='12px';
 form.innerHTML='<h3>Explicit internal alert action</h3><p class="small">Decision: '+esc(decision.replaceAll('_',' '))+
 '. No external messages will be sent.</p>'+
 (decision==='route'?'<label>Priority<select class="input" name="severity"><option value="attention">Attention</option><option value="warning">Warning</option><option value="urgent">Urgent</option></select></label>':'')+
 '<label>Operator work reference<input class="input" name="operator_reference" minlength="6" maxlength="120" required placeholder="e.g. ETSY-REVIEW-396"></label>'+
 '<label><input type="checkbox" name="operator_confirmed" required> I reviewed the stored evidence and authorize this internal audit action.</label>'+
 '<button class="btn primary" type="submit">Record '+esc(decision.replaceAll('_',' '))+'</button>'+
 '<p data-outcome class="small" role="status">The button is disabled while the request is processing.</p>';
 mount.appendChild(form);
 form.addEventListener('submit',async(ev)=>{
  ev.preventDefault();if(busy||!current)return;
  const reference=form.elements.operator_reference.value.trim(),
  confirmed=form.elements.operator_confirmed.checked;
  const receipt=form.querySelector('[data-outcome]'),button=form.querySelector('button');
  if(!confirmed||reference.length<6){receipt.textContent='Provide a real work reference and confirm the decision.';return;}
  if(!globalThis.crypto?.randomUUID){receipt.textContent='Secure request key unavailable; no action was sent.';return;}
  const key=globalThis.crypto.randomUUID().replaceAll('-','');
  const snapshot=current;
  const payload={scope:snapshot.scope,product_id:snapshot.product_id,action:decision,
   fingerprint:snapshot.data.exception.fingerprint,route_fingerprint:snapshot.data.history.route?.fingerprint||snapshot.data.exception.fingerprint,
   operator_reference:reference,request_key:key,operator_confirmed:true,
   severity:decision==='route'?form.elements.severity.value:null};
  busy=true;button.disabled=true;check.disabled=true;inbox.disabled=true;
  button.textContent='Saving audit receipt…';receipt.textContent='Recording one operator action. Do not submit twice.';
  try{
   const result=await api('/api/admin/etsy-monitoring-alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!Number.isSafeInteger(Number(result.receipt_id))||Number(result.receipt_id)<1)throw Error('Audit receipt missing; outcome unknown.');
   const stored=await api(endpoint(snapshot),{method:'GET'});
   const receipts=[stored.history.route?.receipt_id,stored.history.ack?.receipt_id,stored.history.closure?.receipt_id];
   if(!receipts.some(id=>Number(id)===Number(result.receipt_id))){
    receipt.textContent='Receipt recorded but no longer latest. Inspect the audit queue before retrying.';return;
   }
   current={...snapshot,data:stored};render();
   message.textContent='Operator action recorded and read back: receipt #'+Number(result.receipt_id)+'.';
  }catch(error){receipt.textContent='Outcome unknown or rejected: '+error.message+'. Read stored receipts before any new submission; no automatic retry.';}
  finally{busy=false;check.disabled=false;inbox.disabled=false;button.disabled=false;button.textContent='Record '+decision.replaceAll('_',' ');}
 });
 message.textContent='Stored evidence loaded; action '+decision+' requires explicit operator confirmation.';
}
async function readInbox(){
 if(busy)return;
 setBusy(true);inboxMount.replaceChildren();
 try{
  const result=await api('/api/admin/etsy-monitoring-alerts?view=inbox',{method:'GET'});
  const items=result.items||[];
  const div=document.createElement('div');div.className='card';
  div.innerHTML='<strong>Recent operator-routed alerts</strong><p class="small">Historical routing receipts only; not a live list of unresolved alerts.</p>'+
  (items.length?'<ul class="small">'+items.map(item=>'<li>Receipt #'+Number(item.receipt_id)+' · '+esc(item.scope)+
   (item.product_id?' Product #'+Number(item.product_id):'')+' · '+esc(item.severity)+' · '+esc(item.created_at)+'</li>').join('')+'</ul>':
   '<p class="small">No internal routing receipts recorded yet.</p>');
  inboxMount.appendChild(div);
 }catch(error){inboxMount.textContent='Internal routes unavailable: '+error.message;}
 finally{setBusy(false);}
}
scope.addEventListener('change',()=>{current=null;mount.replaceChildren();message.textContent='Scope changed. Check evidence again.';});
check.addEventListener('click',()=>void refresh());
inbox.addEventListener('click',()=>void readInbox());
})();