/* Build 387 — a focused same-page correction drawer; all changes are operator-confirmed. */
(()=>{'use strict';
let active=null,dialog=null,busy=false,unknown=false,operationKey='';
const byId=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(n/100);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const cents=s=>{const n=Number(s);return Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100))?Math.round(n*100):NaN};
function estimate(cost,rate,included){
 const amount=cents(cost),bps=Math.round(Number(rate)*100);
 if(!Number.isSafeInteger(amount)||!Number.isInteger(bps)||bps<0||bps>3000)return null;
 const tax=included?Math.round(amount*bps/(10000+bps)):Math.round(amount*bps/10000);
 return {net:included?amount-tax:amount,tax,gross:included?amount:amount+tax};
}
function calc(form,out){
 const p=estimate(form.querySelector('[name=cost]').value,form.querySelector('[name=rate]').value,form.querySelector('[name=included]').checked);
 out.textContent=p?('Before tax '+money(p.net)+' · estimated HST '+money(p.tax)+' · total '+money(p.gross)+' per stock unit.'):'Enter a valid price and tax rate.';
 return p;
}
function ensure(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='dd387-inventory-quick-edit';dialog.setAttribute('aria-label','Inventory quick edit');
 dialog.innerHTML=`<form method="dialog" id="dd387EditForm"><header><h2 id="dd387Title">Quick edit Inventory</h2><button type="button" data-dd387-close aria-label="Close">×</button></header>
 <p class="small">Count corrections are recorded as movements. Purchase HST is an estimate until confirmed against the supplier invoice; it is not automatically a tax credit.</p>
 <div class="dd387-grid">
 <label>On hand (stock units)<input name="qty" type="number" min="0" step="any" required></label>
 <label>Stock unit<input name="stock" maxlength="40" required placeholder="package"></label>
 <label>Usage unit<input name="usage" maxlength="40" required placeholder="gram"></label>
 <label>Usage units per stock unit<input name="ratio" type="number" step="any" min="0.000001" required></label>
 <label>Purchase price per stock unit (CAD)<input name="cost" type="number" min="0" step="0.01" required></label>
 <label>Purchase tax rate (%)<input name="rate" type="number" min="0" max="30" step="0.01" value="13" required></label>
 </div>
 <label class="dd387-check"><input name="included" type="checkbox"> Entered price already includes tax</label>
 <p id="dd387Tax" role="status" aria-live="polite"></p>
 <label>Reason for correction<input name="reason" maxlength="500" minlength="12" required placeholder="Count verified against workshop supplies"></label>
 <p id="dd387Result" role="status" aria-live="polite"></p><footer><button type="button" data-dd387-close>Cancel</button><button type="button" id="dd387Verify" hidden>Verify original receipt</button><button type="submit" id="dd387Save">Save correction</button></footer>
 </form>`;
 document.body.appendChild(dialog);
 dialog.addEventListener('click',e=>{if(e.target.matches('[data-dd387-close]')&&!busy)dialog.close();});
 const form=byId('dd387EditForm');form.addEventListener('input',()=>calc(form,byId('dd387Tax')));
 form.addEventListener('submit',save);
 byId('dd387Verify').addEventListener('click',verify);
 return dialog;
}
async function readResponse(r){const j=await r.json().catch(()=>({ok:false,error:'Unexpected server response'}));if(!r.ok||!j.ok)throw Object.assign(new Error(j.error||'Request failed'),{code:j.code,status:r.status});return j;}
const request=(url,opts)=>window.DDAuth?.apiFetch?window.DDAuth.apiFetch(url,opts):fetch(url,{credentials:'same-origin',...opts});
async function open(id){
 if(!Number.isSafeInteger(Number(id))||Number(id)<=0)return;
 ensure(); if(busy)return;
 active=null;unknown=false;operationKey='';const form=byId('dd387EditForm');form.reset();
 byId('dd387Result').textContent='Reading current Inventory source…';byId('dd387Save').disabled=true;
 byId('dd387Verify').hidden=true;if(!dialog.open)dialog.showModal();
 try{
  const data=await readResponse(await request('/api/admin/inventory-quick-edit?inventory_id='+encodeURIComponent(id),{method:'GET',cache:'no-store'}));
  active=data.item;byId('dd387Title').textContent='Quick edit • '+active.item_name+' (#'+id+')';
  form.elements.qty.value=String(active.on_hand_quantity);form.elements.stock.value=active.stock_unit_label;
  form.elements.usage.value=active.usage_unit_label;form.elements.ratio.value=active.usage_units_per_stock_unit;
  form.elements.cost.value=(Number(active.unit_cost_cents||0)/100).toFixed(2);form.elements.rate.value=13;
  form.elements.reason.value='Workshop inventory count and unit-cost verification';
  byId('dd387Save').disabled=false;byId('dd387Result').textContent='Review the actual count and cost before saving. No stock is deducted by this edit.';
  calc(form,byId('dd387Tax'));
 }catch(e){byId('dd387Result').textContent=e.message;}
}
async function verify(){
 if(!operationKey)return;
 byId('dd387Verify').disabled=true;byId('dd387Result').textContent='Checking original receipt…';
 try{
  const r=await request('/api/admin/inventory-quick-edit?request_key='+encodeURIComponent(operationKey),{method:'GET',cache:'no-store'});
  const data=await readResponse(r);
  if(data.found){unknown=false;byId('dd387Result').textContent='OK — original correction was committed. Receipt #'+data.receipt_id+'. Reload the item before a separate edit.';}
  else byId('dd387Result').textContent='No receipt found. This does not prove the write failed; review the source item before starting a new correction.';
 }catch(e){byId('dd387Result').textContent='Outcome remains unknown: '+e.message;}
 finally{byId('dd387Verify').disabled=false;}
}
async function save(e){
 e.preventDefault();if(!active||busy||unknown)return;
 const form=byId('dd387EditForm');if(!form.reportValidity())return;
 const t=calc(form,byId('dd387Tax'));if(!t)return;
 const expected=active;
 const data={inventory_id:Number(active.site_item_inventory_id),on_hand_quantity:Number(form.elements.qty.value),
  stock_unit_label:form.elements.stock.value,usage_unit_label:form.elements.usage.value,
  usage_units_per_stock_unit:Number(form.elements.ratio.value),cost_dollars:form.elements.cost.value,
  tax_rate_percent:Number(form.elements.rate.value),tax_included:form.elements.included.checked,
  note:form.elements.reason.value,request_key:operationKey||crypto.randomUUID(),
  expected:{on_hand_quantity:Number(expected.on_hand_quantity),unit_cost_cents:Number(expected.unit_cost_cents),
    stock_unit_label:expected.stock_unit_label,usage_unit_label:expected.usage_unit_label,
    usage_units_per_stock_unit:Number(expected.usage_units_per_stock_unit)}};
 if(data.on_hand_quantity<Number(expected.reserved_quantity||0)){byId('dd387Result').textContent='Cannot reduce below reserved stock. Review reservations first.';return;}
 if(!confirm('Save the reviewed Inventory count, unit and cost correction? This does not automatically post a finished Product.'))return;
 operationKey=data.request_key;busy=true;byId('dd387Save').disabled=true;byId('dd387Save').textContent='Saving…';
 byId('dd387Result').textContent='Writing one source-linked correction…';
 try{
  const reply=await request('/api/admin/inventory-quick-edit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const saved=await readResponse(reply);unknown=false;
  byId('dd387Result').textContent='OK — saved, receipt #'+saved.receipt_id+'. Estimated tax '+money(saved.tax_estimate_cents)+'. Refresh production preview before any finished-product post.';
  document.dispatchEvent(new CustomEvent('dd:inventory-quick-edit-saved',{detail:{inventory_id:data.inventory_id,receipt_id:saved.receipt_id}}));
  byId('dd387Save').textContent='Saved ✓';byId('dd387Verify').hidden=true;
 }catch(err){
  unknown=!err.status||err.status>=500||err.status===409;
  byId('dd387Result').textContent=unknown?'Outcome not confirmed. Verify original receipt; never blindly re-submit.':err.message;
  byId('dd387Verify').hidden=!unknown;byId('dd387Save').disabled=unknown;
 }finally{busy=false;if(!unknown&&byId('dd387Save').textContent!=='Saved ✓')byId('dd387Save').disabled=false;
  if(byId('dd387Save').textContent==='Saving…')byId('dd387Save').textContent='Save correction';}
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-dd387-edit-id]');if(el){e.preventDefault();e.stopPropagation();open(Number(el.getAttribute('data-dd387-edit-id')));}
},true);
document.addEventListener('DOMContentLoaded',()=>{
 // Optional live tax estimator on the existing full Inventory edit form, without changing its established save semantics.
 const mount=byId('siteInventoryUnitCost');if(!mount)return;
 const wrapper=document.createElement('div');wrapper.className='dd387-tax-inline';
 wrapper.innerHTML='<label>Purchase HST rate (%) <input id="dd387InlineRate" type="number" min="0" max="30" step="0.01" value="13"></label><label><input id="dd387InlineIncluded" type="checkbox"> Price includes tax</label><p id="dd387InlineTotal" role="status">Enter cost to estimate purchase tax.</p>';
 mount.closest('label')?.insertAdjacentElement('afterend',wrapper);
 function calcInline(){const t=estimate(mount.value,byId('dd387InlineRate').value,byId('dd387InlineIncluded').checked);
  byId('dd387InlineTotal').textContent=t?('Estimated purchase HST '+money(t.tax)+' · total '+money(t.gross)+' per stock unit. Tax estimate is not saved by the older Inventory form; use Quick Edit to record it.'):'Enter a valid cost.';}
 mount.addEventListener('input',calcInline);wrapper.addEventListener('input',calcInline);calcInline();
});
window.DDInventoryQuickEdit=Object.freeze({open,estimate});
})();
