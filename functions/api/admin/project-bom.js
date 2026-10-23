// Release 467 Build 445. Inventory owns stock, lots, reservations, postings and reversals.
// This API plans usage and links ALREADY POSTED Creative Process movement evidence.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {isUsageIncrementAligned,roundInventoryQuantity,normalizeUnitsPerPurchase} from '../_lib/inventoryUnitConversion.js';
const rows=x=>Array.isArray(x?.results)?x.results:[];
const id=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0;
const clean=(x,max=500)=>String(x??'').trim().slice(0,max);
const positive=x=>Number.isFinite(Number(x))&&Number(x)>0&&Number(x)<=1e8?Number(x):0;
const answer=(x,status=200)=>jsonResponse(x,status,{'Cache-Control':'no-store'});
const safety=Object.freeze({physical_stock_owner:'site_item_inventory',reservation_owner:'creative_project_material_reservations',
  actual_usage_owner:'creative_project_inventory_posts',reversal_owner:'creative_project_inventory_reversals',
  supplier_lot_authority:'inventory_purchase_lots',bom_does_not_consume_stock:true,bom_does_not_reserve_stock:true,
  no_automatic_stock_or_finance_or_publication:true,unknown_cost_is_not_zero:true});
async function access(ctx){
 const admin=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!admin)return {response:answer({ok:false,error:'Admin sign-in required.'},401)};
 const db=getDb(ctx.env);if(!db)return {response:answer({ok:false,error:'Canonical Inventory database unavailable.'},503)};
 return {admin,db};
}
async function project(db,projectId){return db.prepare(`SELECT creative_work_project_id,project_title,project_key,project_status
 FROM creative_work_projects WHERE creative_work_project_id=? AND COALESCE(project_status,'active')<>'archived'`).bind(projectId).first();}
async function material(db,itemId){return db.prepare(`SELECT i.site_item_inventory_id,i.item_name,i.source_type,i.on_hand_quantity,i.reserved_quantity,
 i.stock_unit_label,i.usage_unit_label,i.usage_units_per_stock_unit,i.unit_cost_cents,i.supplier_name,
 COALESCE(p.usage_tracking_mode,'exact') usage_tracking_mode,COALESCE(p.minimum_usage_increment,0.001) minimum_usage_increment
 FROM site_item_inventory i LEFT JOIN site_inventory_usage_profiles p ON p.site_item_inventory_id=i.site_item_inventory_id
 WHERE i.site_item_inventory_id=? AND COALESCE(i.is_active,1)=1 AND LOWER(TRIM(COALESCE(i.source_type,'')))='supply'`).bind(itemId).first();}
export function bomProgress(line,links=[],holds=[]){
 const per=normalizeUnitsPerPurchase(line.usage_units_per_stock_unit_snapshot,1);
 const planned=Number(line.planned_usage_quantity||0);
 let gross=0,scrap=0,returned=0;
 for(const p of links){if(Number(p.maker_project_bom_line_id)!==Number(line.maker_project_bom_line_id))continue;
  const units=Number(p.usage_quantity_consumed||0),waste=Number(p.scrap_usage_quantity||0);
  if(p.returned_at){returned+=units;continue;}
  gross+=units;scrap+=waste;
 }
 let reserved=0,released=0;
 for(const h of holds){if(Number(h.site_item_inventory_id)!==Number(line.site_item_inventory_id))continue;
  if(line.creative_project_operation_id&&h.creative_project_operation_id&&Number(h.creative_project_operation_id)!==Number(line.creative_project_operation_id))continue;
  reserved+=Number(h.original_stock_quantity||0);released+=Number(h.released_stock_quantity||0);
 }
 const used=roundInventoryQuantity(Math.max(0,gross-scrap));
 const state=line.line_status==='retired'?'retired':gross>=planned-1e-6?'consumed':gross>0?'partially_consumed':returned>0||released>0?'returned':reserved>released?'reserved':'planned';
 return {state,planned_usage_quantity:planned,posted_usage_quantity:roundInventoryQuantity(gross),
  usable_usage_quantity:used,scrap_usage_quantity:roundInventoryQuantity(scrap),
  reversed_usage_quantity:roundInventoryQuantity(returned),remaining_usage_quantity:roundInventoryQuantity(Math.max(0,planned-gross)),
  planned_stock_quantity:roundInventoryQuantity(planned/per),remaining_reserved_stock_quantity:roundInventoryQuantity(Math.max(0,reserved-released)),
  released_stock_quantity:roundInventoryQuantity(released)};
}
async function snapshot(db,projectId,q=''){
 const p=await project(db,projectId);if(!p)return null;
 const [lineRows,postRows,holdRows,operationRows]=await Promise.all([
  db.prepare(`SELECT l.*,i.item_name,i.on_hand_quantity,i.reserved_quantity,i.usage_unit_label,i.stock_unit_label,
   i.usage_units_per_stock_unit,i.unit_cost_cents,i.supplier_name,i.supplier_sku,
   o.operation_title,o.operation_order,pr.process_name,
   lot.lot_code,lot.quantity_remaining lot_quantity_remaining,lot.expiry_date lot_expiry_date,
   (SELECT GROUP_CONCAT(st.item_name,', ') FROM inventory_workstation_memberships wm
    JOIN site_item_inventory st ON st.site_item_inventory_id=wm.workstation_site_item_inventory_id
    WHERE wm.site_item_inventory_id=l.site_item_inventory_id) current_workstations
  FROM maker_project_bom_lines l JOIN site_item_inventory i ON i.site_item_inventory_id=l.site_item_inventory_id
  LEFT JOIN creative_project_operations o ON o.creative_project_operation_id=l.creative_project_operation_id
  LEFT JOIN inventory_processes pr ON pr.inventory_process_id=o.inventory_process_id
  LEFT JOIN inventory_purchase_lots lot ON lot.inventory_purchase_lot_id=l.inventory_purchase_lot_id
  WHERE l.creative_work_project_id=? ORDER BY l.maker_project_bom_line_id DESC LIMIT 151`).bind(projectId).all(),
  db.prepare(`SELECT p.creative_project_inventory_post_id,p.creative_work_project_id,p.site_item_inventory_id,p.posted_at,
   p.stock_quantity_consumed,p.posting_status,p.notes,i.item_name,
   COALESCE(u.usage_quantity_consumed,p.stock_quantity_consumed*COALESCE(i.usage_units_per_stock_unit,1)) usage_quantity_consumed,
   COALESCE(u.usage_unit_label,i.usage_unit_label,i.stock_unit_label) usage_unit_label,
   x.maker_project_bom_actual_link_id,x.maker_project_bom_line_id,x.scrap_usage_quantity,x.classification_note,x.linked_at,
   r.authorized_at returned_at,r.stock_quantity_restored
  FROM creative_project_inventory_posts p JOIN site_item_inventory i ON i.site_item_inventory_id=p.site_item_inventory_id
  LEFT JOIN creative_project_inventory_usage_details u ON u.creative_project_inventory_post_id=p.creative_project_inventory_post_id
  LEFT JOIN maker_project_bom_actual_links x ON x.creative_project_inventory_post_id=p.creative_project_inventory_post_id
  LEFT JOIN creative_project_inventory_reversals r ON r.creative_project_inventory_post_id=p.creative_project_inventory_post_id
  WHERE p.creative_work_project_id=? ORDER BY p.creative_project_inventory_post_id DESC LIMIT 251`).bind(projectId).all(),
  db.prepare(`SELECT creative_project_material_reservation_id,site_item_inventory_id,creative_project_operation_id,
   original_stock_quantity,released_stock_quantity,created_at FROM creative_project_material_reservations
   WHERE creative_work_project_id=? ORDER BY creative_project_material_reservation_id DESC LIMIT 251`).bind(projectId).all(),
  db.prepare(`SELECT o.creative_project_operation_id,o.operation_title,o.operation_order,pr.process_name
   FROM creative_project_operations o JOIN inventory_processes pr ON pr.inventory_process_id=o.inventory_process_id
   WHERE o.creative_work_project_id=? AND o.plan_status<>'retired' ORDER BY o.operation_order LIMIT 101`).bind(projectId).all()
 ]);
 const links=rows(postRows),holds=rows(holdRows);
 const lines=rows(lineRows).slice(0,150).map(l=>({...l,progress:bomProgress(l,links,holds),
  cost_estimate_cents:Number(l.unit_cost_cents)>0?Math.round(Number(l.unit_cost_cents)*Number(l.planned_usage_quantity)/Number(l.usage_units_per_stock_unit_snapshot)):null,
  available_stock_quantity:roundInventoryQuantity(Number(l.on_hand_quantity||0)-Number(l.reserved_quantity||0))}));
 const search=clean(q,90).replace(/[%_]/g,'').toLowerCase();let inventory=[];
 if(search.length>=2){const match='%'+search+'%';inventory=rows(await db.prepare(`SELECT i.site_item_inventory_id,i.item_name,i.on_hand_quantity,i.reserved_quantity,
  i.stock_unit_label,i.usage_unit_label,i.usage_units_per_stock_unit,i.unit_cost_cents,i.supplier_name,
  COALESCE(p.usage_tracking_mode,'exact') usage_tracking_mode,
  COALESCE(p.minimum_usage_increment,0.001) minimum_usage_increment
  FROM site_item_inventory i LEFT JOIN site_inventory_usage_profiles p ON p.site_item_inventory_id=i.site_item_inventory_id
  WHERE COALESCE(i.is_active,1)=1 AND LOWER(TRIM(COALESCE(i.source_type,'')))='supply'
  AND (LOWER(COALESCE(i.item_name,'')) LIKE ? OR LOWER(COALESCE(i.supplier_name,'')) LIKE ?)
  ORDER BY i.item_name LIMIT 31`).bind(match,match).all()).slice(0,30);}
 const lots=inventory.length?rows(await db.prepare(`SELECT inventory_purchase_lot_id,site_item_inventory_id,lot_code,quantity_remaining,lot_status,expiry_date,supplier_name
  FROM inventory_purchase_lots WHERE site_item_inventory_id IN (${inventory.map(()=>'?').join(',')}) ORDER BY inventory_purchase_lot_id DESC LIMIT 151`)
  .bind(...inventory.map(i=>i.site_item_inventory_id)).all()):[];
 return {project:p,lines,lines_truncated:rows(lineRows).length>150,actual_posts:links.slice(0,250),actual_posts_truncated:links.length>250,
  reservations:holds,operations:rows(operationRows),inventory_search_results:inventory,supplier_lots:lots,
  safety,notes:'Plan in usable units. Inventory stock deductions and reversals happen ONLY in Creative Process. Link existing posted receipts to this BOM; a reversed receipt is shown as returned, never as active consumption. Scrap is a classification of an actual posted quantity, not an additional stock deduction.'};
}
export async function onRequestGet(ctx){const a=await access(ctx);if(a.response)return a.response;
 const params=new URL(ctx.request.url).searchParams,projectId=id(params.get('project_id'));
 try{if(!projectId){const projects=rows(await a.db.prepare(`SELECT creative_work_project_id,project_title,project_key FROM creative_work_projects
  WHERE COALESCE(project_status,'active')<>'archived' ORDER BY creative_work_project_id DESC LIMIT 101`).all());return answer({ok:true,build:445,projects,safety});}
 const data=await snapshot(a.db,projectId,params.get('q'));return data?answer({ok:true,build:445,...data}):answer({ok:false,error:'Project not found.'},404);
 }catch(e){console.error('BOM_READ_FAILED',e?.name||'Error');return answer({ok:false,code:'READ_FAILED',error:'BOM records are unavailable; check Build 445 migration.'},503);}}
export async function onRequestPost(ctx){const a=await access(ctx);if(a.response)return a.response;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return answer({ok:false,error:'Same-origin administrator action required.'},403);
 let body;try{body=await ctx.request.json();}catch{return answer({ok:false,error:'Valid JSON required.'},400);}
 const action=clean(body.action,30),projectId=id(body.project_id),key=clean(body.request_key,80),note=clean(body.note,800),actor=id(a.admin.user_id);
 if(!projectId||!actor||!['plan','link_actual','retire'].includes(action)||!/^[-a-zA-Z0-9_]{16,80}$/.test(key)||note.length<12)
  return answer({ok:false,error:'Project, supported action, unique request key and reason of at least 12 characters required.'},400);
 try{
  if(!await project(a.db,projectId))return answer({ok:false,error:'Project is unavailable.'},404);
  let result;
  if(action==='plan'){
   const itemId=id(body.site_item_inventory_id),operationId=id(body.operation_id)||null,lotId=id(body.inventory_purchase_lot_id)||null;
   const amount=positive(body.planned_usage_quantity),item=await material(a.db,itemId);
   if(!item||!amount||!isUsageIncrementAligned(amount,item.minimum_usage_increment))return answer({ok:false,error:'Select an active Supply and a positive usable-unit quantity aligned with its Inventory increment.'},400);
   const prior=await a.db.prepare('SELECT * FROM maker_project_bom_lines WHERE request_key=?').bind(key).first();
   if(prior)return Number(prior.creative_work_project_id)===projectId&&Number(prior.site_item_inventory_id)===itemId&&Math.abs(prior.planned_usage_quantity-amount)<1e-9&&prior.line_note===note
    ?answer({ok:true,replayed:true,build:445,line_id:prior.maker_project_bom_line_id, ...(await snapshot(a.db,projectId))})
    :answer({ok:false,code:'REQUEST_KEY_CONFLICT',error:'That request key belongs to a different BOM plan.'},409);
   const insert=await a.db.prepare(`INSERT INTO maker_project_bom_lines(creative_work_project_id,creative_project_operation_id,
    site_item_inventory_id,inventory_purchase_lot_id,planned_usage_quantity,usage_unit_label_snapshot,
    usage_units_per_stock_unit_snapshot,stock_unit_label_snapshot,supplier_name_snapshot,workstation_note,
    line_note,created_by_user_id,request_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(projectId,operationId,itemId,lotId,
    roundInventoryQuantity(amount),clean(item.usage_unit_label||item.stock_unit_label,40),normalizeUnitsPerPurchase(item.usage_units_per_stock_unit,1),
    clean(item.stock_unit_label,40),clean(item.supplier_name,180)||null,clean(body.workstation_note,220)||null,note,actor,key).run();
   result={line_id:id(insert.meta?.last_row_id),stock_consumed:false};
  }else if(action==='link_actual'){
   const lineId=id(body.line_id),postId=id(body.creative_project_inventory_post_id),scrap=Number(body.scrap_usage_quantity||0);
   if(!lineId||!postId||!Number.isFinite(scrap)||scrap<0)return answer({ok:false,error:'Choose a BOM line, its existing actual Inventory post and nonnegative scrap quantity.'},400);
   const prior=await a.db.prepare('SELECT * FROM maker_project_bom_actual_links WHERE request_key=? OR creative_project_inventory_post_id=? LIMIT 1').bind(key,postId).first();
   if(prior)return Number(prior.maker_project_bom_line_id)===lineId&&Number(prior.creative_project_inventory_post_id)===postId&&Math.abs(Number(prior.scrap_usage_quantity)-scrap)<1e-9&&prior.classification_note===note
    ?answer({ok:true,replayed:true,build:445,link_id:prior.maker_project_bom_actual_link_id,...(await snapshot(a.db,projectId))})
    :answer({ok:false,code:'ALREADY_CLASSIFIED',error:'That actual movement or request key is already linked; stock will not be posted again.'},409);
   const line=await a.db.prepare('SELECT creative_work_project_id FROM maker_project_bom_lines WHERE maker_project_bom_line_id=?').bind(lineId).first();
   if(Number(line?.creative_work_project_id)!==projectId)return answer({ok:false,error:'That BOM line belongs to another project.'},404);
   const link=await a.db.prepare(`INSERT INTO maker_project_bom_actual_links(maker_project_bom_line_id,creative_project_inventory_post_id,
    scrap_usage_quantity,classification_note,linked_by_user_id,request_key) VALUES(?,?,?,?,?,?)`).bind(lineId,postId,roundInventoryQuantity(scrap),note,actor,key).run();
   result={link_id:id(link.meta?.last_row_id),stock_consumed:false,classification_only:true};
  }else{
   const lineId=id(body.line_id);const line=await a.db.prepare('SELECT * FROM maker_project_bom_lines WHERE maker_project_bom_line_id=?').bind(lineId).first();
   if(!line||Number(line.creative_work_project_id)!==projectId)return answer({ok:false,error:'BOM line not found.'},404);
   if(line.line_status==='retired')return answer({ok:true,replayed:true,build:445,line_id:lineId,...(await snapshot(a.db,projectId))});
   const changed=await a.db.prepare(`UPDATE maker_project_bom_lines SET line_status='retired'
    WHERE maker_project_bom_line_id=? AND creative_work_project_id=? AND line_status='planned'`).bind(lineId,projectId).run();
   if(Number(changed.meta?.changes)!==1)return answer({ok:false,error:'BOM changed during retirement; refresh.'},409);
   result={line_id:lineId,stock_consumed:false};
  }
  await auditAdminAction(ctx.env,ctx.request,a.admin,{action_type:'maker_project_bom_'+action,target_type:'creative_work_project',target_id:projectId,target_key:key,
   details:{note,actor_user_id:actor,...result,canonical_inventory_mutation:false,finance_posted:false}});
  return answer({ok:true,build:445,message:action==='plan'?'BOM planning line saved; physical stock unchanged.':action==='link_actual'?'Existing Inventory movement classified; no second stock posting.':'BOM line retired; original history preserved.',...result,...(await snapshot(a.db,projectId))});
 }catch(e){console.error('BOM_WRITE_FAILED',e?.name||'Error');return answer({ok:false,code:'WRITE_NOT_CONFIRMED',error:'The BOM action could not be confirmed. Refresh and inspect the receipt before retrying; Inventory has not been posted by this action.'},409);}
}
