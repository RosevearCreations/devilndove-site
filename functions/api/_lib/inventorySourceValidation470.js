/* Build 470: guard new Inventory source edits before legacy fallback coercion.
 * The canonical inventoryUnitConversion engine still owns posted usage math. */
export function validateInventoryMutationSource470(body={}){
 if(!body||typeof body!=='object'||Array.isArray(body))return {ok:false,code:'inventory_source_payload_invalid',error:'Inventory edit must be an object.'};
 const constraints=[
  ['usage_units_per_stock_unit',0.001,false],
  ['minimum_usage_increment',0.0001,false],
  ['on_hand_quantity',0,true],
  ['reserved_quantity',0,true],
  ['incoming_quantity',0,true],
  ['unit_cost_cents',0,true]
 ];
 for(const [key,min,allowZero] of constraints){
  if(!Object.prototype.hasOwnProperty.call(body,key))continue;
  const raw=body[key];
  const n=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()?Number(raw):NaN;
  if(!Number.isFinite(n)||(allowZero?n<0:n<min)||(key==='unit_cost_cents'&&!Number.isSafeInteger(n))){
   return {ok:false,code:'inventory_source_quantity_invalid',field:key,
    error:`${key} must be a finite ${allowZero?'nonnegative':'positive'} number${key==='unit_cost_cents'?' of whole cents':''}; existing values were not changed.`};
  }
 }
 for(const key of ['stock_unit_label','usage_unit_label']){
  if(Object.prototype.hasOwnProperty.call(body,key)&&!String(body[key]??'').trim())
   return {ok:false,code:'inventory_source_unit_missing',field:key,error:`${key} is required for a stock/usage conversion change.`};
 }
 if(Object.prototype.hasOwnProperty.call(body,'workstation_site_item_inventory_ids')){
  const ids=body.workstation_site_item_inventory_ids;
  if(!Array.isArray(ids)||ids.some(x=>!Number.isSafeInteger(Number(x))||Number(x)<=0)||new Set(ids.map(Number)).size!==ids.length)
   return {ok:false,code:'inventory_station_ids_invalid',field:'workstation_site_item_inventory_ids',error:'Workstation memberships must be unique positive inventory IDs, or an explicit empty array to remove all.'};
 }
 return {ok:true};
}
