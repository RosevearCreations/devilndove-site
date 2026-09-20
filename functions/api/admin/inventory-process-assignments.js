// Release 467 Build 156 — Tool & Supply Process Assignment authority.
// One reviewed primary workshop process per active Tool/Supply item. No request-time DDL.
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 156;
const TAXONOMY_BUILD = 207;
const json = (data,status=200) => jsonResponse({ build:BUILD, ...data },status,{ 'Cache-Control':'no-store' });
const rows = result => Array.isArray(result?.results) ? result.results : [];
const keyFor = value => normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);

async function context(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin) return { error:json({ok:false,error:'Unauthorized.'},401) };
  const db=getDb(env);
  if(!db) return { error:json({ok:false,error:'Database binding is not configured.'},500) };
  return {admin,db};
}

async function schemaReady(db){
  const result=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('inventory_processes','inventory_process_assignments')").all();
  return new Set(rows(result).map(row=>row.name)).size===2;
}

async function snapshot(db){
  const processes=rows(await db.prepare(`SELECT inventory_process_id,process_key,process_name,description,sort_order
    FROM inventory_processes WHERE is_active=1 ORDER BY sort_order,process_name`).all());
  const items=rows(await db.prepare(`SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,
      ipa.inventory_process_id,ip.process_key,ip.process_name
    FROM site_item_inventory sii
    LEFT JOIN inventory_process_assignments ipa ON ipa.site_item_inventory_id=sii.site_item_inventory_id
    LEFT JOIN inventory_processes ip ON ip.inventory_process_id=ipa.inventory_process_id
    WHERE COALESCE(sii.is_active,1)=1 AND LOWER(TRIM(COALESCE(sii.source_type,''))) IN ('tool','supply')
    ORDER BY CASE LOWER(TRIM(sii.source_type)) WHEN 'tool' THEN 0 ELSE 1 END,LOWER(COALESCE(sii.item_name,'')),sii.site_item_inventory_id`).all());
  return {processes,items,counts:{tools:items.filter(x=>String(x.source_type).toLowerCase()==='tool').length,supplies:items.filter(x=>String(x.source_type).toLowerCase()==='supply').length,assigned:items.filter(x=>Number(x.inventory_process_id||0)>0).length,unassigned:items.filter(x=>!Number(x.inventory_process_id||0)).length}};
}

export async function onRequestGet({request,env}){
  const ready=await context(request,env);if(ready.error)return ready.error;
  if(!(await schemaReady(ready.db))) return json({ok:false,error:'Build 156 inventory process migration is required.',code:'inventory_process_schema_required'},503);
  return json({ok:true,...await snapshot(ready.db),authority:'inventory_process_assignments',taxonomy_authority:'inventory_processes',taxonomy_build:TAXONOMY_BUILD,assignment_cardinality:'one_primary_process_per_item'});
}

export async function onRequestPost({request,env}){
  const ready=await context(request,env);if(ready.error)return ready.error;
  if(!(await schemaReady(ready.db))) return json({ok:false,error:'Build 156 inventory process migration is required.',code:'inventory_process_schema_required'},503);
  let body={};try{body=await request.json();}catch{return json({ok:false,error:'Invalid JSON body.'},400);}
  const action=normalizeText(body.action).toLowerCase();
  if(action==='create_process'){
    const name=normalizeText(body.process_name).slice(0,120);const key=keyFor(body.process_key||name);const description=normalizeText(body.description).slice(0,400);
    if(!name||!key)return json({ok:false,error:'Process name is required.'},400);
    const existing=await ready.db.prepare('SELECT inventory_process_id FROM inventory_processes WHERE process_key=? LIMIT 1').bind(key).first();
    if(existing?.inventory_process_id)return json({ok:false,error:'That process already exists.'},409);
    const result=await ready.db.prepare(`INSERT INTO inventory_processes(process_key,process_name,description,sort_order,is_active,created_at,updated_at) VALUES(?,?,?,500,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(key,name,description||null).run();
    const id=Number(result?.meta?.last_row_id||0);
    await auditAdminAction(env,request,ready.admin,{action_type:'inventory_process_create',target_type:'inventory_process',target_id:id||null,target_key:key,details:{process_name:name}});
    return json({ok:true,message:`Process “${name}” created.`,taxonomy_build:TAXONOMY_BUILD,...await snapshot(ready.db)});
  }
  const itemId=Number(body.site_item_inventory_id||0);
  if(!itemId)return json({ok:false,error:'Inventory item is required.'},400);
  const item=await ready.db.prepare(`SELECT site_item_inventory_id,source_type,external_key,item_name FROM site_item_inventory WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply') LIMIT 1`).bind(itemId).first();
  if(!item)return json({ok:false,error:'Active Tool/Supply item not found.'},404);
  if(action==='clear'){
    await ready.db.prepare('DELETE FROM inventory_process_assignments WHERE site_item_inventory_id=?').bind(itemId).run();
    await auditAdminAction(env,request,ready.admin,{action_type:'inventory_process_assignment_clear',target_type:'inventory_item',target_id:itemId,target_key:`${item.source_type}:${item.external_key}`,details:{item_name:item.item_name}});
    return json({ok:true,message:`Process cleared for ${item.item_name}.`,taxonomy_build:TAXONOMY_BUILD,...await snapshot(ready.db)});
  }
  if(action!=='assign')return json({ok:false,error:'Unsupported action.'},400);
  const processId=Number(body.inventory_process_id||0);
  const process=await ready.db.prepare('SELECT inventory_process_id,process_key,process_name FROM inventory_processes WHERE inventory_process_id=? AND is_active=1 LIMIT 1').bind(processId).first();
  if(!process)return json({ok:false,error:'Active process not found.'},404);
  await ready.db.prepare(`INSERT INTO inventory_process_assignments(site_item_inventory_id,inventory_process_id,assigned_by_user_id,assigned_at,updated_at)
    VALUES(?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT(site_item_inventory_id) DO UPDATE SET inventory_process_id=excluded.inventory_process_id,assigned_by_user_id=excluded.assigned_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(itemId,processId,Number(ready.admin.user_id||0)||null).run();
  await auditAdminAction(env,request,ready.admin,{action_type:'inventory_process_assignment_set',target_type:'inventory_item',target_id:itemId,target_key:`${item.source_type}:${item.external_key}`,details:{item_name:item.item_name,process_key:process.process_key,process_name:process.process_name}});
  return json({ok:true,message:`${item.item_name} assigned to ${process.process_name}.`,taxonomy_build:TAXONOMY_BUILD,...await snapshot(ready.db)});
}
