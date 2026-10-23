// Build 449: transparent CAD estimates only. Pure functions, no financial or stock writes.
const cents=x=>x===null||x===undefined||!Number.isFinite(Number(x))?null:Math.round(Number(x));
const money=(x)=>x===null?null:Math.max(0,cents(x));
const amount=(source,field)=>source&&source[field]!==undefined?money(source[field]):null;
const selected=(source,override)=>source!==null?source:override;
const component=(label,value,source,detail)=>({label,amount_cents:value,known:value!==null,source,detail});

/** Price is optional and per unit. Unknown input never becomes zero by default. */
export function projectCostProjection({review={},planned={},actual={},time={},production={},quality={}}={}){
 const knownPosts=Number(actual.valued_posts||0),postCount=Number(actual.post_count||0),
   materialKnown=postCount>0&&knownPosts===postCount&&actual.actual_cents!=null,
   plannedCount=Number(planned.line_count||0),plannedKnown=plannedCount>0&&Number(planned.valued_lines||0)===plannedCount,
   material=materialKnown?money(actual.actual_cents):postCount===0&&review.no_material_use_confirmed===1?0:null;
 const workMinutes=Number(time.actual_minutes||0),timeEntries=Number(time.time_rows||0),
   labourMinutes=timeEntries>0?workMinutes:review.no_labour_confirmed===1?0:null;
 const labourRate=money(review.labour_rate_cents_per_hour),machineRate=money(review.machine_rate_cents_per_hour);
 const labour=labourMinutes!==null&&labourRate!==null?Math.round(labourMinutes*labourRate/60):null;
 const machineMinutes=production.machine_minutes!==null&&production.machine_minutes!==undefined?
   Number(production.machine_minutes):review.machine_minutes===null||review.machine_minutes===undefined?null:Number(review.machine_minutes);
 const machine=machineMinutes!==null&&machineRate!==null?Math.round(machineMinutes*machineRate/60):null;
 const extras=[
  ['Packaging','packaging_cents'],['Consumables','consumables_cents'],['Rework (excluding material already posted)','rework_cents'],
  ['Finishing','finishing_cents'],['Outside services','outside_service_cents']
 ].map(([label,field])=>{
  const productionAmount=amount(production,field),manual=amount(review,field);
  return component(label,selected(productionAmount,manual),productionAmount!==null?'Production cost evidence':manual!==null?'Reviewed fallback':'Missing',
   productionAmount!==null&&manual!==null?'Production source takes precedence; fallback is not added.':null);
 });
 const components=[
  component('Actual Inventory materials',material,postCount?'Canonical posted Inventory receipts':review.no_material_use_confirmed===1?'Reviewed no-use':'Missing',
   'Reversed/returned posts excluded. Current Inventory unit cost is an estimate, not an immutable purchase price.'),
  component('Hands-on labour',labour,timeEntries?'Work Order time × reviewed hourly rate':'Reviewed no-work × hourly rate / missing time',null),
  component('Machine runtime',machine,production.machine_minutes!=null?'Production machine minutes × reviewed hourly rate':'Reviewed machine minutes × hourly rate',null),
  ...extras,component('Overhead allocation',amount(review,'overhead_cents'),review.overhead_cents!=null?'Reviewed project allocation':'Missing',null)
 ];
 const missing=components.filter(x=>!x.known).map(x=>x.label),knownSubtotal=components.reduce((n,x)=>n+(x.amount_cents??0),0),
   total=missing.length?null:knownSubtotal,quantity=Number.isSafeInteger(Number(review.pricing_quantity))&&Number(review.pricing_quantity)>0?Number(review.pricing_quantity):1,
   unitCost=total===null?null:Math.round(total/quantity),price=amount(review,'proposed_price_cents'),
   proposedRevenue=price===null?null:price*quantity,profit=total===null||proposedRevenue===null?null:proposedRevenue-total,
   margin=profit===null||proposedRevenue===0?null:Math.round(profit/proposedRevenue*10000)/100;
 const flags=[];
 if(postCount>knownPosts)flags.push(`${postCount-knownPosts} actual Inventory posting(s) have no known unit cost.`);
 if(plannedCount>Number(planned.valued_lines||0))flags.push('Some planned BOM supplies have no current unit cost.');
 if(postCount&&review.no_material_use_confirmed===1)flags.push('Material posts now exist; the old no-material assertion is overridden.');
 if(timeEntries&&review.no_labour_confirmed===1)flags.push('Recorded labour now exists; the old no-labour assertion is overridden.');
 if(Number(quality.failed_attempts||0)>0)flags.push('Failed/reworked attempts require owner allocation review; scrap is within consumed materials, never an extra charge.');
 if(Number(production.prototype_waste_cents||0)>0)flags.push('Prototype waste evidence is shown separately and excluded from the additive total to avoid double charging posted materials.');
 return {currency:'CAD',components,missing_categories:missing,complete:missing.length===0,known_subtotal_cents:knownSubtotal,
  total_cost_cents:total,planned_bom_estimate_cents:plannedKnown?money(planned.estimated_cents):null,actual_inventory_estimate_cents:material,
  planned_line_count:plannedCount,actual_post_count:postCount,unit_cost_cents:unitCost,pricing_quantity:quantity,
  proposed_unit_price_cents:price,proposed_total_price_cents:proposedRevenue,project_profit_estimate_cents:profit,
  gross_margin_percent:margin,prototype_waste_evidence_cents:amount(production,'prototype_waste_cents'),
  classified_scrap_cost_cents:amount(actual,'scrap_cents'),failed_attempts:Number(quality.failed_attempts||0),
  sale_eligibility:'Not assessed: quality/commerce approval remains separate',warnings:flags,
  pricing_does_not_book_revenue:true,no_journal_no_payroll_no_inventory_no_provider_actions:true,
  overlapping_work_order_and_creative_time_not_added:true,scrap_is_in_materials_not_additive:true};
}
