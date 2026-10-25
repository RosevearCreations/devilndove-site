/* Build 470 — inventory consistency observations, not another stock movement engine.
 * Canonical consumption and costing writes remain owned by inventoryUnitConversion.js
 * and existing authenticated Inventory endpoints. This module never performs I/O. */

const UNIT_ALIASES=Object.freeze({kg:'kilogram',g:'gram',mg:'milligram',ml:'millilitre',l:'litre',pcs:'piece',pc:'piece',ea:'each'});
const STANDARD_CONVERSIONS=Object.freeze({
 'kilogram:gram':1000,'kilogram:milligram':1_000_000,'gram:milligram':1000,
 'litre:millilitre':1000,'pound:ounce':16,
 'gram:kilogram':0.001,'milligram:gram':0.001,'milligram:kilogram':0.000001,
 'millilitre:litre':0.001,'ounce:pound':1/16
});
const normalizedUnit=value=>{const s=String(value||'').trim().toLowerCase();return UNIT_ALIASES[s]||s;};
const finite=value=>value===null||value===undefined||String(value).trim()===''?null:Number.isFinite(Number(value))?Number(value):null;
const stationIds=item=>{
 const source=Array.isArray(item.workstation_site_item_inventory_ids)?item.workstation_site_item_inventory_ids:
  [item.workstation_site_item_inventory_id].filter(Boolean);
 return source.map(Number).filter(x=>Number.isInteger(x)&&x>0);
};
export function reviewInventoryItems470(items=[],{page=1,totalPages=1}={}){
 const rows=[];
 for(const item of Array.isArray(items)?items:[]){
  const id=Number(item.site_item_inventory_id||0);
  const kind=String(item.source_type||'').toLowerCase();
  const stockUnit=normalizedUnit(item.stock_unit_label),usageUnit=normalizedUnit(item.usage_unit_label);
  const factor=finite(item.usage_units_per_stock_unit),onHand=finite(item.on_hand_quantity),reserved=finite(item.reserved_quantity??0),cost=finite(item.unit_cost_cents);
  const location=Number(item.current_location_site_item_inventory_id||0);
  const memberships=stationIds(item),uniqueIds=[...new Set(memberships)];
  const role=String(item.workstation_role||'associated').toLowerCase();
  const issues=[];
  const add=(code,label,severity='HOLD')=>issues.push({code,label,severity});
  if(!Number.isInteger(id)||id<=0)add('HOLD_ITEM_ID','Inventory identifier is missing.');
  if(!stockUnit||!usageUnit)add('HOLD_UNIT_LABEL','A stock or usage unit is missing.');
  if(factor===null||factor<0.001)add('HOLD_CONVERSION_FACTOR','Conversion factor must be explicitly positive and at least 0.001.');
  const standard=STANDARD_CONVERSIONS[`${stockUnit}:${usageUnit}`];
  if(standard&&factor!==null&&Math.abs(factor-standard)>Math.max(1e-9,standard*1e-8))
   add('REVIEW_STANDARD_CONVERSION',`Recorded ${factor} ${usageUnit}/${stockUnit}; standard unit relation is ${standard}. Verify packaging against the original label.`,'REVIEW');
  if(stockUnit===usageUnit&&factor!==null&&Math.abs(factor-1)>1e-9)
   add('REVIEW_SAME_UNIT_PACKAGE',`Identical unit labels have multiplier ${factor}. Confirm whether this is an intentional package count.`,'REVIEW');
  if(onHand===null||onHand<0||reserved===null||reserved<0)add('HOLD_STOCK_QUANTITIES','On-hand/reserved stock must be finite and nonnegative.');
  else if(reserved>onHand+1e-9)add('HOLD_RESERVATION_GT_STOCK','Reserved stock exceeds on-hand stock. Do not assume it is available for use.');
  if(cost===null||cost<0)add('HOLD_COST_VALUE','Unit cost is unavailable or negative.');
  else if(cost>0)add('HOLD_ORIGINAL_COST_RECEIPT','Recorded unit cost is not an independently verified supplier invoice or purchase receipt.');
  if(memberships.length!==uniqueIds.length)add('HOLD_DUPLICATE_STATION_ID','An item lists duplicate workstation identities.');
  if(uniqueIds.includes(id))add('HOLD_STATION_SELF_REFERENCE','The item references itself as an associated workstation.');
  if(role==='station'&&kind!=='tool')add('HOLD_STATION_MUST_BE_TOOL','Only an actual Tool can be a workstation.');
  if(role==='station'&&uniqueIds.length)add('HOLD_STATION_HAS_PARENTS','A workstation Tool is simultaneously marked as belonging to other stations.');
  if(location===id&&id>0)add('HOLD_LOCATION_SELF_REFERENCE','The item cannot be its own physical location.');
  if(kind==='tool'&&item.usage_tracking_mode&&item.usage_tracking_mode!=='reusable')add('REVIEW_TOOL_TRACKING','Tool use should not deplete reusable equipment. Check the authoritative Tool lifecycle.','REVIEW');
  if(!location&&['tool','supply'].includes(kind))add('HOLD_PHYSICAL_LOCATION','Actual physical location is not recorded; confirm in the workshop.');
  add('HOLD_ACTUAL_USE_EVIDENCE','This page does not load historical usage/lot movements; inspect actual usage receipts before reconciliation.');
  rows.push({id,itemName:String(item.item_name||`Inventory #${id}`).slice(0,150),sourceType:kind,
   stockUnit,usageUnit,unitsPerStock:factor,onHand,reserved,availableStock:onHand===null||reserved===null?null:Math.max(0,onHand-reserved),
   estimatedCostPerUsageCents:factor&&factor>=0.001&&cost!==null&&cost>=0?cost/factor:null,
   currentLocationId:location,stationIds:uniqueIds,hasSupplierSource:Boolean(String(item.source_url||item.amazon_url||'').trim()),
   issues});
 }
 return {document_type:'DEVIL_N_DOVE_BUILD470_VISIBLE_INVENTORY_CONSISTENCY_HOLD',page,totalPages,
  reviewedRows:rows.length,rows,issueCount:rows.reduce((s,r)=>s+r.issues.length,0),
  ownerAccepted:false,sourceReceiptsVerified:false,physicalLocationVerified:false,actualUseReceiptsVerified:false,
  automaticStockAdjustment:false,automaticCostRewrite:false,automaticWorkstationRewrite:false,
  note:'Read-only current page only; original owner-reviewed sources, all pages and historical inventory movements remain separate. Canonical usage posting is server-authoritative.'};
}
