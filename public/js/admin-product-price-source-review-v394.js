// Build 394: operator-driven durable source review, never automatic Product/Etsy mutations.
(()=>{'use strict';
const id=document.getElementById('productPriceSourceId'), load=document.getElementById('productPriceSourceLoad'),
 message=document.getElementById('productPriceSourceMessage'), mount=document.getElementById('productPriceSourceMount');
if(!id||!load||!message||!mount||!window.DDAuth)return;
const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cad=(n)=>Number.isSafeInteger(Number(n))?'CAD $'+(Number(n)/100).toFixed(2):'Unverified amount';
const parse=(s)=>{const m=/^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(String(s||'').trim());
 if(!m)return null;const cents=Number(m[1])*100+Number((m[2]||'').padEnd(2,'0'));return Number.isSafeInteger(cents)&&cents<=999999999?cents:null;};
const fetchJson=async(url,opts)=>{const res=await window.DDAuth.apiFetch(url,opts);
 const body=await res.json().catch(()=>null);if(!res.ok||!body?.ok)throw Error(body?.error||'Request failed');
 return body;};
const status=(text)=>message.textContent=text;
const setBusy=(busy)=>{load.disabled=busy;load.textContent=busy?'Loading…':'Read current price & source approval';};
const productID=()=>{const n=Number(id.value);return Number.isSafeInteger(n)&&n>0?n:null;};
let snapshot=null;
async function refresh(){
 const n=productID();if(!n){status('Enter a valid Product ID.');return;}
 setBusy(true);mount.replaceChildren();status('Reading current Product and latest operator approval…');
 try{
  const result=await fetchJson('/api/admin/product-price-source-review?product_id='+encodeURIComponent(n),{method:'GET',cache:'no-store'});
  snapshot=result;render();
 }catch(err){snapshot=null;status('Source review unavailable: '+err.message+' No price was changed.');}
 finally{setBusy(false);}
}
function render(){
 if(!snapshot)return;
 const p=snapshot.product,r=snapshot.receipt;
 const diff=r&&r.approved_price_cents!==p.price_cents;
 const summary=r
  ?'Latest operator-approved source: '+esc(r.source_type)+' · '+esc(r.source_reference)+' · '+cad(r.approved_price_cents)+' · receipt #'+Number(r.receipt_id)+' (recorded '+esc(r.reviewed_at)+').'
  :'No approved source receipt recorded yet. A zero-priced Product may legitimately be free.';
 const outcome=diff?'Discrepancy: current '+cad(p.price_cents)+' versus approved source '+cad(r.approved_price_cents)+'. Review manually; not proof of an accidental change.':
  r?'Current Product price matches the recorded approved source.':'No source-backed comparison can be made yet.';
 status('Product #'+p.product_id+' · '+p.name+' · current '+cad(p.price_cents)+' · '+snapshot.review_outcome);
 const section=document.createElement('section');section.className='card';
 section.innerHTML='<p class="small">'+summary+'</p><p class="small">'+outcome+'</p>'+
  '<p class="small"><a href="/admin/product-editor/?product_id='+Number(p.product_id)+'&tab=pricing">Open Product Editor for manual review</a>. Any Product Save requires its own confirmed database readback.</p>'+
  '<form id="priceSource394Form" style="display:grid;gap:10px;max-width:530px">'+
  '<label>Approved source type<select name="source_type" class="input" required><option value="">Select original source</option>'+
  '<option value="prior_approved_catalog">Previously approved catalog price</option>'+
  '<option value="approved_pricing_decision">Documented pricing decision</option>'+
  '<option value="prior_price_export">Previous approved Product price export</option>'+
  '<option value="customer_approved_quote">Customer-approved quote</option></select></label>'+
  '<label>Source document / decision reference<input class="input" name="source_reference" minlength="6" maxlength="160" required placeholder="Original record ID or file reference"></label>'+
  '<label>Approved original price (CAD, e.g. 8.00)<input class="input" name="approved_price" inputmode="decimal" required placeholder="0.00"></label>'+
  '<label><input type="checkbox" name="operator_confirmed_source" required> I inspected the original approved selling-price evidence; this is not an estimated cost or guessed value.</label>'+
  '<button class="btn" type="submit">Record source approval only</button>'+
  '<p class="small" data-source-result role="status">This creates an audit receipt. It will not change price, tax, inventory or Etsy listings.</p></form>';
 mount.replaceChildren(section);
 const form=section.querySelector('form');
 form.addEventListener('submit',async(event)=>{
  event.preventDefault();const submit=form.querySelector('button[type="submit"]'),msg=form.querySelector('[data-source-result]');
  if(submit.disabled)return;
  const approved=parse(form.elements.approved_price.value),reference=form.elements.source_reference.value.trim();
  if(approved===null||reference.length<6||!form.elements.operator_confirmed_source.checked){
   msg.textContent='Enter exact CAD cents, a valid source reference, and confirm the original evidence.';return;
  }
  if(!globalThis.crypto?.randomUUID){msg.textContent='Secure request ID unavailable. No review submitted.';return;}
  const requestKey=globalThis.crypto.randomUUID().replaceAll('-','');
  submit.disabled=true;submit.textContent='Saving source approval…';
  msg.textContent='Recording one explicit source approval; please wait…';
  try{
   const result=await fetchJson('/api/admin/product-price-source-review',{method:'POST',
    headers:{'Content-Type':'application/json'},credentials:'same-origin',
    body:JSON.stringify({product_id:p.product_id,observed_price_cents:p.price_cents,approved_price_cents:approved,
     source_type:form.elements.source_type.value,source_reference:reference,
     operator_confirmed_source:true,request_key:requestKey})});
   if(!result.receipt_id)throw Error('Approval receipt was not returned; inspect audit before retrying.');
   msg.textContent='Receipt #'+result.receipt_id+' saved; refreshing persisted source review. Product price unchanged.';
   const check=await fetchJson('/api/admin/product-price-source-review?product_id='+encodeURIComponent(p.product_id),{method:'GET',cache:'no-store'});
   if(Number(check.receipt?.receipt_id)!==Number(result.receipt_id)){
    msg.textContent='Source write succeeded, but the latest receipt differed. Check the audit ledger before retrying.';
    return;
   }
   snapshot=check;render();status('Source receipt #'+result.receipt_id+' verified; Product price unchanged. '+check.review_outcome);
  }catch(err){msg.textContent='Outcome unknown or rejected: '+err.message+' Reload current source review before another submission. No automatic retry.';}
  finally{submit.disabled=false;submit.textContent='Record source approval only';}
 });
}
load.addEventListener('click',refresh);
const reviewList=document.getElementById('productBrowser390PriceAuditRows');
reviewList?.addEventListener('click',event=>{
 const target=event.target.closest('[data-price-source-product]');if(!target)return;
 id.value=target.dataset.priceSourceProduct;refresh();
});
})();