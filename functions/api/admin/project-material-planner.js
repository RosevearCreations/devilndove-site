// Release 467 Build 380. Canonical project reservations; actual consumption remains Creative Process.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {quantity,money,summarize} from './_lib/projectMaterialMath.js';
const arr=r=>Array.isArray(r?.results)?r.results:[];
const clean=(v,n=280)=>String(v??'').trim().slice(0,n);
const whole=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const reply=(body,status=200)=>jsonResponse(body,status,{'Cache-Control':'no-store'});
const SAFETY={project_allocations:true,canonical_inventory_reserved_quantity:true,canonical_inventory_movements:true,
  supplier_authority:'site_item_inventory / inventory_purchase_lots',actual_use_owner:'creative_process',
  automatic_stock_consumption:false,automatic_accounting_posting:false,automatic_purchase:false,
  financial_cost_estimates_not_booked:true,private_media_exposure:false};
async function authenticate({request,env}){
 const admin=await getAdminUserFromRequest(request,env);
 if(!admin)return {response:reply({ok:false,error:'Admin sign-in required.',code:'AUTH_REQUIRED'},401)};
 const db=getDb(env);
 if(!db)return {response:reply({ok:false,error:'Canonical database unavailable.',code:'DB_MISSING'},503)};
 return {db,admin};
}
const project=(db,id)=>db.prepare("SELECT creative_work_project_id,project_title,project_key,project_status FROM creative_work_projects WHERE creative_work_project_id=? AND COALESCE(project_status,'active')<>'archived' LIMIT 1").bind(id).first();
async function snapshot(db,id,search=''){
 const p=await project(db,id);if(!p)return null;
 const [reservationResult,postingResult,operationsResult]=await Promise.all([
 db.prepare(`SELECT a.creative_project_material_reservation_id,a.creative_work_project_id,a.creative_project_operation_id,a.site_item_inventory_id,
 a.original_stock_quantity,a.released_stock_quantity,(a.original_stock_quantity-a.released_stock_quantity) remaining_stock_quantity,
 a.unit_cost_cents_snapshot,a.supplier_name_snapshot,a.stock_unit_label_snapshot,a.reservation_note,a.release_note,a.created_by_user_id,a.updated_by_user_id,a.created_at,a.updated_at,
 i.item_name,i.on_hand_quantity,i.reserved_quantity,i.stock_unit_label,i.usage_unit_label,i.usage_units_per_stock_unit,i.unit_cost_cents,i.supplier_name
 FROM creative_project_material_reservations a JOIN site_item_inventory i ON i.site_item_inventory_id=a.site_item_inventory_id
 WHERE a.creative_work_project_id=? ORDER BY a.creative_project_material_reservation_id DESC LIMIT 151`).bind(id).all(),
 db.prepare(`SELECT ip.creative_project_inventory_post_id,ip.site_item_inventory_id,ip.creative_work_event_id,ip.stock_quantity_consumed,ip.posting_status,ip.created_at,
 i.item_name,i.stock_unit_label,i.unit_cost_cents,i.supplier_name,
 COALESCE(u.usage_quantity_consumed,ip.stock_quantity_consumed) usage_quantity_consumed,
 COALESCE(u.usage_unit_label,i.usage_unit_label,i.stock_unit_label) usage_unit_label
 FROM creative_project_inventory_posts ip JOIN site_item_inventory i ON i.site_item_inventory_id=ip.site_item_inventory_id
 LEFT JOIN creative_project_inventory_usage_details u ON u.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
 WHERE ip.creative_work_project_id=? AND COALESCE(ip.posting_status,'posted')<>'reversed'
 ORDER BY ip.creative_project_inventory_post_id DESC LIMIT 151`).bind(id).all(),
 db.prepare("SELECT creative_project_operation_id,operation_title,operation_order,plan_status FROM creative_project_operations WHERE creative_work_project_id=? AND plan_status<>'retired' ORDER BY operation_order,creative_project_operation_id LIMIT 101").bind(id).all()
 ]);
 const reservations=arr(reservationResult),rawPosts=arr(postingResult),operations=arr(operationsResult);
 const posts=rawPosts.slice(0,150).map(p=>({...p,estimated_cost_cents:money(Number(p.stock_quantity_consumed||0),p.unit_cost_cents)}));
 const summary=summarize(reservations,posts);
 const q=clean(search,100).toLowerCase().replace(/[%_]/g,'');
 let inventory=[];
 if(q.length>=2){
  const pattern='%'+q+'%';
  inventory=arr(await db.prepare(`SELECT i.site_item_inventory_id,i.item_name,i.source_type,i.external_key,i.on_hand_quantity,i.reserved_quantity,
  i.stock_unit_label,i.usage_unit_label,i.usage_units_per_stock_unit,i.unit_cost_cents,i.supplier_name,i.supplier_sku,
  (SELECT l.lot_code FROM inventory_purchase_lots l WHERE l.site_item_inventory_id=i.site_item_inventory_id ORDER BY l.inventory_purchase_lot_id DESC LIMIT 1) latest_lot_code,
  (SELECT l.unit_cost_cents FROM inventory_purchase_lots l WHERE l.site_item_inventory_id=i.site_item_inventory_id ORDER BY l.inventory_purchase_lot_id DESC LIMIT 1) latest_lot_unit_cost_cents
  FROM site_item_inventory i LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=i.site_item_inventory_id
  WHERE COALESCE(i.is_active,1)=1 AND LOWER(TRIM(COALESCE(i.source_type,'')))='supply'
  AND COALESCE(u.usage_tracking_mode,'exact')='exact'
  AND (LOWER(COALESCE(i.item_name,'')) LIKE ? OR LOWER(COALESCE(i.external_key,'')) LIKE ? OR LOWER(COALESCE(i.supplier_name,'')) LIKE ?)
  ORDER BY LOWER(i.item_name),i.site_item_inventory_id LIMIT 31`).bind(pattern,pattern,pattern).all()).slice(0,30);
 }
 return {project:p,operations:operations.slice(0,100),operation_rows_truncated:operations.length>100,
  reservations:reservations.slice(0,150),reservations_truncated:reservations.length>150,
  inventory_posts:posts,inventory_posts_truncated:rawPosts.length>150,
  inventory_search_results:inventory,summary,
  cost_note:'Stock-unit value uses the current Inventory unit cost. Purchase-lot costs are provenance only until reconciliation. A missing unit price is unknown, not zero.',
  partial_consumption:'Log actual partial use through Creative Process; release the equivalent stock reservation first. No stock is consumed by this planner.',
  safety:SAFETY};
}
export async function onRequestGet(ctx){
 const a=await authenticate(ctx);if(a.response)return a.response;
 const query=new URL(ctx.request.url).searchParams,raw=query.get('project_id')||'';
 try{
  if(!raw){
   const projects=arr(await a.db.prepare("SELECT creative_work_project_id,project_title,project_key FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived' ORDER BY creative_work_project_id LIMIT 101").all());
   return reply({ok:true,build:380,projects:projects.slice(0,100),projects_truncated:projects.length>100,safety:SAFETY});
  }
  if(!whole(raw)||String(whole(raw))!==raw)return reply({ok:false,code:'INVALID_ID',error:'Valid project ID required.'},400);
  const data=await snapshot(a.db,whole(raw),query.get('q')||'');
  return data?reply({ok:true,build:380,...data}):reply({ok:false,error:'Project not found.'},404);
 }catch(e){console.error('PROJECT_MATERIAL_READ_FAILED',e?.name||'Error');return reply({ok:false,code:'READ_FAILED',error:'Material workspace cannot be read.'},503);}
}
export async function onRequestPost(ctx){
 const a=await authenticate(ctx);if(a.response)return a.response;
 const origin=ctx.request.headers.get('Origin');
 if(!origin||origin!==new URL(ctx.request.url).origin)return reply({ok:false,code:'ORIGIN_REQUIRED',error:'Same-origin admin action required.'},403);
 let input;try{input=await ctx.request.json()}catch{return reply({ok:false,error:'Invalid JSON.'},400)}
 const projectId=whole(input.project_id),action=clean(input.action,30),note=clean(input.note,850);
 if(!projectId||note.length<12)return reply({ok:false,error:'Choose a project and provide an operator reason of at least 12 characters.'},400);
 try{
  const p=await project(a.db,projectId);if(!p)return reply({ok:false,error:'Project unavailable.'},404);
  const actor=whole(a.admin.user_id);
  let inventoryId=0,change=0;
  if(action==='reserve'){
   inventoryId=whole(input.site_item_inventory_id);change=quantity(input.stock_units);
   const operationId=input.operation_id?whole(input.operation_id):null,key=clean(input.request_key,80);
   if(!inventoryId||change===null||!key||key.length<16||!/^[-A-Za-z0-9_]{16,80}$/.test(key)||
      (input.operation_id&&!operationId))return reply({ok:false,error:'Select a valid supply, amount, operation and request key.'},400);
   // INSERT SELECT reads the canonical supplier/stock identity; DB triggers guard all cross-project reservations.
   try {
    const done=await a.db.prepare(`INSERT INTO creative_project_material_reservations
      (creative_work_project_id,creative_project_operation_id,site_item_inventory_id,original_stock_quantity,
      unit_cost_cents_snapshot,supplier_name_snapshot,stock_unit_label_snapshot,reservation_note,created_by_user_id,request_key)
      SELECT ?,?,i.site_item_inventory_id,?,CASE WHEN i.unit_cost_cents>0 THEN i.unit_cost_cents ELSE NULL END,
      i.supplier_name,COALESCE(i.stock_unit_label,'unit'),?,?,?
      FROM site_item_inventory i WHERE i.site_item_inventory_id=? AND COALESCE(i.is_active,1)=1
      AND LOWER(TRIM(COALESCE(i.source_type,'')))='supply'`)
      .bind(projectId,operationId,change,note,actor,key,inventoryId).run();
    if(!Number(done.meta?.changes||0))return reply({ok:false,error:'Active canonical supply item not found.'},404);
   }catch(e){
    if(/constraint|UNIQUE|project_material_/i.test(String(e?.message||'')))return reply({ok:false,code:'CAPACITY_OR_IDENTITY_CONFLICT',error:'Reservation rejected: duplicate request, invalid operation or insufficient shared free stock. Refresh Inventory.'},409);
    throw e;
   }
  }else if(action==='release'){
   const allocationId=whole(input.reservation_id);change=quantity(input.stock_units);
   if(!allocationId||change===null)return reply({ok:false,error:'Valid reservation and partial release amount required.'},400);
   const row=await a.db.prepare("SELECT * FROM creative_project_material_reservations WHERE creative_project_material_reservation_id=? AND creative_work_project_id=? LIMIT 1").bind(allocationId,projectId).first();
   if(!row)return reply({ok:false,error:'Reservation not in this project.'},404);
   inventoryId=whole(row.site_item_inventory_id);
   if(change>Number(row.original_stock_quantity)-Number(row.released_stock_quantity)+0.000001)return reply({ok:false,code:'RELEASE_EXCEEDS_REMAINING',error:'Release exceeds remaining reserved quantity.'},409);
   const result=await a.db.prepare(`UPDATE creative_project_material_reservations
     SET released_stock_quantity=released_stock_quantity+?,release_note=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP
     WHERE creative_project_material_reservation_id=? AND creative_work_project_id=?
     AND released_stock_quantity+?<=original_stock_quantity+0.000001`).bind(change,note,actor,allocationId,projectId,change).run();
   if(!Number(result.meta?.changes||0))return reply({ok:false,code:'RELEASE_STALE',error:'Reservation changed; refresh.'},409);
  }else return reply({ok:false,error:'Unsupported material action.'},400);
  await auditAdminAction(ctx.env,ctx.request,a.admin,{action_type:'creative_project_material_'+action,target_type:'site_item_inventory',target_id:inventoryId,target_key:String(projectId),details:{project_id:projectId,quantity_stock_units:change,actor_user_id:actor,note,stock_consumed:false,finance_posted:false}});
  const updated=await snapshot(a.db,projectId,'');
  return reply({ok:true,build:380,message:'Reservation record and canonical reserved stock updated.',...updated});
 }catch(e){console.error('PROJECT_MATERIAL_WRITE_FAILED',e?.name||'Error');return reply({ok:false,error:'Material update could not be confirmed.',code:'MATERIAL_WRITE_FAILED'},503);}
}
