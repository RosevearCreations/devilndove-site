// Devil n Dove Build 440 — bounded Admin API for purchased-kit component usage.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';
import { consumeKitComponent, loadKitComponentUsage } from '../_lib/inventoryKitService.js';

const BUILD=440;
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const text=(value,max=500)=>normalizeText(value).slice(0,max);

async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser) return {response:json({ok:false,build:BUILD,error:'Admin access required.'},401)};
  const db=getDb(context.env);
  if(!db) return {response:json({ok:false,build:BUILD,error:'Database binding is not configured.'},500)};
  return {adminUser,db};
}

function failure(error){
  const status=Number(error?.status||0);
  const safeStatus=[400,401,403,404,409].includes(status)?status:500;
  return json({
    ok:false,
    build:BUILD,
    code:error?.code||'inventory_kit_component_usage_failed',
    error:String(error?.message||'Kit component usage failed.'),
    details:error?.details||undefined,
  },safeStatus);
}

export async function onRequestGet(context){
  const granted=await access(context); if(granted.response)return granted.response;
  try{
    const components=await loadKitComponentUsage(granted.db);
    return json({
      ok:true,
      build:BUILD,
      owner:'inventory',
      mutation_capability:'explicit_admin_component_use_only',
      background_polling:false,
      request_time_schema_repair:false,
      components,
      summary:{
        component_count:components.length,
        ready_count:components.filter(row=>Number(row.ready)===1).length,
        unlinked_count:components.filter(row=>Number(row.ready)!==1).length,
        do_not_reuse_count:components.filter(row=>Number(row.do_not_reuse||0)===1).length,
      },
    });
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,error,{area:'inventory_kit_component_usage',operation:'get'}).catch(()=>{});
    return failure(error);
  }
}

export async function onRequestPost(context){
  const granted=await access(context); if(granted.response)return granted.response;
  let body={};
  try{ body=await context.request.json(); }
  catch{ return json({ok:false,build:BUILD,code:'invalid_json',error:'Invalid JSON body.'},400); }
  const action=text(body.action,60).toLowerCase();
  if(action!=='consume_component') return json({ok:false,build:BUILD,code:'unsupported_action',error:'Unsupported kit component action.'},400);
  try{
    const result=await consumeKitComponent(granted.db,granted.adminUser,body);
    await auditAdminAction(context.env,context.request,granted.adminUser,{
      action_type:'inventory_kit_component_use',
      target_type:'inventory_kit_template_component',
      target_id:Number(body.inventory_kit_template_component_id||0)||null,
      target_key:String(result?.component?.linked_item_name||result?.component?.item_name||result?.component?.component_name||''),
      details:{
        inventory_kit_template_id:Number(result?.component?.inventory_kit_template_id||0)||null,
        site_item_inventory_id:Number(result?.component?.site_item_inventory_id||0)||null,
        source_type:result?.component?.source_type||null,
        usage_quantity:Number(result?.plan?.quantity||0),
        usage_unit_label:result?.plan?.usage_unit_label||null,
        stock_quantity_delta:-Number(result?.plan?.stock_quantity||0),
        tracking_mode:result?.plan?.tracking_mode||null,
        lot_allocation_count:Array.isArray(result?.lot_allocations)?result.lot_allocations.length:0,
        note:text(body.note,800),
      },
    });
    const components=await loadKitComponentUsage(granted.db);
    return json({ok:true,build:BUILD,...result,components});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,error,{area:'inventory_kit_component_usage',operation:'consume_component',component_id:Number(body.inventory_kit_template_component_id||0)||null}).catch(()=>{});
    return failure(error);
  }
}
