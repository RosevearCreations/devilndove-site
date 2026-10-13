// Build 388: zero-read initial Inventory tax evidence view; explicit bounded request only.
(()=>{'use strict';
const button=document.getElementById('inventoryTaxReview388Load'),
 status=document.getElementById('inventoryTaxReview388Status'),host=document.getElementById('inventoryTaxReview388Rows');
if(!button||!status||!host)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format((Number(x)||0)/100);
button.addEventListener('click',async()=>{
 if(button.disabled)return;button.disabled=true;button.textContent='Loading…';status.textContent='Reading up to 25 recent confirmed corrections…';
 try{
  const r=await window.DDAuth.apiFetch('/api/admin/inventory-purchase-tax-review?limit=25',{method:'GET',cache:'no-store'});
  const data=await r.json().catch(()=>null);
  if(!r.ok||!data?.ok)throw Error(data?.error||'Review request failed');
  const items=Array.isArray(data.items)?data.items:[];
  if(!items.length){host.textContent='No Build 387 quick-edit tax receipts found yet.';status.textContent='No recent correction receipts.';return;}
  host.innerHTML='<table style="width:100%;border-collapse:collapse;min-width:860px"><thead><tr>'+
  '<th>Inventory / Source</th><th>Count &amp; unit</th><th>Purchase cost</th><th>Estimated HST</th><th>Reconciliation</th></tr></thead><tbody>'+
  items.map(row=>{
   const flags=[!row.source_confirmed?'Missing movement source':null,
    row.count_changed_since_receipt?'Count changed since receipt':null,
    row.cost_changed_since_receipt?'Cost changed since receipt':null,
    row.unit_changed_since_receipt?'Units changed since receipt':null].filter(Boolean);
   return '<tr><td><strong>'+esc(row.item_name)+'</strong><div class="small">#'+Number(row.inventory_id)+
    ' · '+esc(row.committed_at)+' · receipt #'+Number(row.receipt_id)+
    '</div><div class="small">'+esc(row.note)+'</div></td><td>'+esc(row.prior_on_hand_quantity)+
    ' → '+esc(row.new_on_hand_quantity)+' '+esc(row.stock_unit_label)+
    '<div class="small">1 '+esc(row.stock_unit_label)+' = '+esc(row.usage_units_per_stock_unit)+' '+esc(row.usage_unit_label)+'</div></td>'+
    '<td>'+money(row.purchase_cost_entered_cents)+' entered<div class="small">'+
    (row.tax_included?'Tax included':'Tax extra')+' · net '+money(row.net_unit_cost_cents)+'</div></td>'+
    '<td>'+money(row.tax_estimate_cents)+' ('+(Number(row.tax_rate_basis_points)/100).toFixed(2)+'%)'+
    '<div class="small">Gross '+money(row.gross_unit_cost_cents)+'</div></td>'+
    '<td>'+esc(flags.length?flags.join(' · '):'Source linked; recorded count/cost still current')+
    '<div class="small">Supplier invoice not verified. No tax credit booked.</div></td></tr>';
  }).join('')+'</tbody></table>';
  status.textContent='Operator decision: supplier purchase invoice, tax-paid amount and eligibility remain UNVERIFIED. No invoice attachment has been approved; no HST input tax credit is posted here. Showing '+items.length+' recent correction receipts'+(data.has_more?' (additional older records exist)':'')+
   '. Read-only reconciliation; compare each tax estimate with your actual purchase receipt.';
 }catch(e){status.textContent='Review could not load: '+e.message;}
 finally{button.disabled=false;button.textContent='Refresh recent corrections';}
});
})();
