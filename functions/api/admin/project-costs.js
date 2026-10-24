// Release 467 Build 449 — source-read-only project cost workbook + immutable pricing reviews.
import {getAdminUserFromRequest,getDb,jsonResponse,auditAdminAction} from '../_lib/adminAudit.js';
import {projectCostProjection} from './_lib/projectCosting.mjs';
const rows=x=>Array.isArray(x?.results)?x.results:[];
const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):0;
const clean=(x,n)=>String(x??'').trim().slice(0,n);
const out=(v,s=200)=>jsonResponse({release:467,build:449,...v},s,{'Cache-Control':'no-store'});
const kinds=['one_off','failed_batch','commission','private_learning'];
const amountFields=['labour_rate_cents_per_hour','machine_rate_cents_per_hour','machine_minutes','packaging_cents','consumables_cents',
 'rework_cents','finishing_cents','outside_service_cents','overhead_cents','proposed_price_cents'];
const safety=Object.freeze({currency:'CAD',source_inventory:'creative_project_inventory_posts',source_labour:'creative_work_order_events',
 source_direct_costs:'creative_project_production_cost_evidence',source_quality:'maker_quality_attempts',source_finance:'creative_project_profitability',
 no_finance_or_accounting_posting:true,no_sales_or_revenue_booked:true,no_stock_movement:true,no_payroll:true,
 no_etsy_or_marketplace_actions:true,no_product_price_change:true,unknown_is_not_zero:true,material_scrap_not_additive:true});
async function access(ctx){const user=await getAdminUserFromRequest(ctx.request,ctx.env);
 if(!user)return {error:out({ok:false,error:'Admin sign-in required.'},401)};
 const db=getDb(ctx.env);return db?{user,db}:{error:out({ok:false,error:'Canonical D1 database unavailable.'},503)};}
async function detail(db,projectId){
 const project=await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_type,project_status
  FROM creative_work_projects WHERE creative_work_project_id=?`).bind(projectId).first();
 if(!project)return null;
 const [history,planned,actual,time,production,quality,finance]=await Promise.all([
  db.prepare(`SELECT * FROM maker_project_cost_reviews WHERE creative_work_project_id=? ORDER BY maker_project_cost_review_id DESC LIMIT 31`).bind(projectId).all(),
  db.prepare(`SELECT COUNT(*) line_count,
   SUM(CASE WHEN i.unit_cost_cents>0 THEN 1 ELSE 0 END) valued_lines,
   SUM(CASE WHEN i.unit_cost_cents>0 THEN ROUND(l.planned_usage_quantity/iif(l.usage_units_per_stock_unit_snapshot>0,l.usage_units_per_stock_unit_snapshot,1)*i.unit_cost_cents) ELSE 0 END) estimated_cents
   FROM maker_project_bom_lines l JOIN site_item_inventory i ON i.site_item_inventory_id=l.site_item_inventory_id
   WHERE l.creative_work_project_id=? AND l.line_status='planned'`).bind(projectId).first(),
  db.prepare(`SELECT COUNT(*) post_count,
   SUM(CASE WHEN i.unit_cost_cents>0 THEN 1 ELSE 0 END) valued_posts,
   SUM(CASE WHEN i.unit_cost_cents>0 THEN ROUND(p.stock_quantity_consumed*i.unit_cost_cents) ELSE 0 END) actual_cents,
   SUM(CASE WHEN l.scrap_usage_quantity>0 AND i.unit_cost_cents>0 AND b.usage_units_per_stock_unit_snapshot>0 THEN
    ROUND(l.scrap_usage_quantity/b.usage_units_per_stock_unit_snapshot*i.unit_cost_cents) ELSE 0 END) scrap_cents
   FROM creative_project_inventory_posts p JOIN site_item_inventory i ON i.site_item_inventory_id=p.site_item_inventory_id
   LEFT JOIN maker_project_bom_actual_links l ON l.creative_project_inventory_post_id=p.creative_project_inventory_post_id
   LEFT JOIN maker_project_bom_lines b ON b.maker_project_bom_line_id=l.maker_project_bom_line_id
   WHERE p.creative_work_project_id=? AND COALESCE(p.posting_status,'posted')<>'reversed'
   AND NOT EXISTS(SELECT 1 FROM creative_project_inventory_reversals r WHERE r.creative_project_inventory_post_id=p.creative_project_inventory_post_id)`).bind(projectId).first(),
  db.prepare(`SELECT COUNT(*) time_rows,SUM(minutes_worked) actual_minutes FROM creative_work_order_events
   WHERE creative_work_project_id=? AND event_kind='time'`).bind(projectId).first(),
  db.prepare(`SELECT COUNT(*) evidence_rows,SUM(machine_minutes) machine_minutes,
   SUM(packaging_cost_cents) packaging_cents,SUM(consumables_cost_cents) consumables_cents,
   SUM(rework_cost_cents) rework_cents,SUM(finishing_cost_cents) finishing_cents,
   SUM(outside_service_cost_cents) outside_service_cents,SUM(prototype_waste_cost_cents) prototype_waste_cents
   FROM creative_project_production_cost_evidence WHERE creative_work_project_id=? AND evidence_status='active'`).bind(projectId).first(),
  db.prepare(`SELECT COUNT(*) attempts,SUM(CASE WHEN outcome IN ('reject','scrap','salvage','abandoned') THEN 1 ELSE 0 END) failed_attempts
   FROM maker_quality_attempts WHERE creative_work_project_id=?`).bind(projectId).first(),
  db.prepare(`SELECT labour_rate_cents,packaging_cost_cents,overhead_cost_cents,revenue_cents
   FROM creative_project_profitability WHERE creative_work_project_id=?`).bind(projectId).first()
 ]);
 const reviews=rows(history),latest=reviews[0]||null;
 return {project,reviews,reviews_truncated:reviews.length>30,current_review:latest,
  source_summary:{planned,actual,time,production,quality,finance_reference:finance},
  cost:projectCostProjection({review:latest||{},planned,actual,time,production,quality}),safety,
  note:'Actual Inventory costs use current item unit cost as an estimate. BOM planned values, Creative time and historical Finance views are comparisons, not additional expenses. The latest reviewed scenario is an estimate, never a sale or a ledger posting.'};
}
export async function onRequestGet(ctx){const a=await access(ctx);if(a.error)return a.error;
 const search=new URL(ctx.request.url).searchParams,lookupKey=search.get('lookup_key');
 if(lookupKey!==null){
  if(!/^[-A-Za-z0-9_]{16,80}$/.test(lookupKey))return out({ok:false,error:'Invalid cost receipt lookup key.'},400);
  const actor=validId(a.user.user_id);if(!actor)return out({ok:false,error:'Verified reviewer required.'},401);
  try{const receipt=await a.db.prepare(`SELECT maker_project_cost_review_id,creative_work_project_id,scenario_kind,created_at
   FROM maker_project_cost_reviews WHERE request_key=? AND reviewed_by_user_id=? LIMIT 1`).bind(lookupKey,actor).first();
   return out({ok:true,found:Boolean(receipt),receipt:receipt||null});
  }catch(e){console.error('BUILD458_COST_LOOKUP_FAILED',e?.name);return out({ok:false,error:'Cost receipt lookup unavailable; keep the same key.'},503)}
 }
 const projectId=validId(search.get('project_id'));
 try{if(!projectId){const projects=rows(await a.db.prepare(`SELECT creative_work_project_id,project_title,project_type,project_status FROM creative_work_projects
  WHERE COALESCE(project_status,'active')<>'archived' ORDER BY creative_work_project_id DESC LIMIT 101`).all());
  return out({ok:true,projects:projects.slice(0,100),projects_truncated:projects.length>100,kinds,safety});}
  const data=await detail(a.db,projectId);return data?out({ok:true,...data}):out({ok:false,error:'Project not found.'},404);
 }catch(e){console.error('BUILD449_COST_READ_FAILED',e?.name||'Error');return out({ok:false,error:'Cost sources unavailable. Check canonical migration 0045 and project evidence.'},503);}}
function parseAmounts(b){const output={};for(const field of amountFields){const v=b[field];
 if(v===null||v===undefined||v===''){output[field]=null;continue;}
 if(typeof v==='boolean'||!Number.isSafeInteger(Number(v))||Number(v)<0||Number(v)>1000000000)
  throw Error(field+' must be a nonnegative whole number of cents/minutes or blank (unknown).');
 output[field]=Number(v);}
 if(output.machine_minutes!==null&&output.machine_minutes>1000000)throw Error('Machine runtime exceeds limit.');
 for(const field of ['labour_rate_cents_per_hour','machine_rate_cents_per_hour'])if(output[field]!==null&&output[field]>10000000)throw Error('Rate exceeds safe limit.');
 return output;}
async function sha256(value){const buffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function onRequestPost(ctx){const a=await access(ctx);if(a.error)return a.error;
 if(ctx.request.headers.get('Origin')!==new URL(ctx.request.url).origin)return out({ok:false,error:'Same-origin admin action required.'},403);
 let b;try{b=await ctx.request.json();}catch{return out({ok:false,error:'Valid JSON required.'},400);}
 const projectId=validId(b.project_id),kind=clean(b.scenario_kind,30),label=clean(b.review_label,120),note=clean(b.review_note,1200),key=clean(b.request_key,80),actor=validId(a.user.user_id);
 if(!projectId||!actor||!kinds.includes(kind)||label.length<4||note.length<16||!/^[-A-Za-z0-9_]{16,80}$/.test(key))
  return out({ok:false,error:'Project, scenario type, 4+ character label, 16+ character review reason and unique key required.'},400);
 const flags={};for(const field of ['no_material_use_confirmed','no_labour_confirmed']){
  if(b[field]!==0&&b[field]!==1&&b[field]!==true&&b[field]!==false)return out({ok:false,error:field+' must be explicitly true or false.'},400);
  flags[field]=Number(b[field]===true||b[field]===1);}
 const quantity=Number(b.pricing_quantity);if(!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000)
  return out({ok:false,error:'Price quantity must be a whole number between 1 and 1,000,000.'},400);
 let amounts;try{amounts=parseAmounts(b);}catch(e){return out({ok:false,error:e.message},400);}
 const fields=Object.keys(amounts),payload={projectId,kind,label,note,quantity,flags,amounts},digest=await sha256(JSON.stringify(payload));
 try{
  const prior=await a.db.prepare(`SELECT maker_project_cost_review_id,creative_work_project_id,payload_sha256 FROM maker_project_cost_reviews WHERE request_key=?`).bind(key).first();
  if(prior)return Number(prior.creative_work_project_id)===projectId&&prior.payload_sha256===digest?
   out({ok:true,replayed:true,review_id:prior.maker_project_cost_review_id,...(await detail(a.db,projectId))}):
   out({ok:false,code:'REQUEST_KEY_CONFLICT',error:'This request key is already used for a different cost review.'},409);
  if(!(await a.db.prepare('SELECT 1 FROM creative_work_projects WHERE creative_work_project_id=?').bind(projectId).first()))return out({ok:false,error:'Project not found.'},404);
  const cols=['creative_work_project_id','scenario_kind','review_label',...fields,'no_material_use_confirmed','no_labour_confirmed','pricing_quantity','review_note','reviewed_by_user_id','request_key','payload_sha256'];
  const values=[projectId,kind,label,...fields.map(f=>amounts[f]),flags.no_material_use_confirmed,flags.no_labour_confirmed,quantity,note,actor,key,digest];
  const insert=await a.db.prepare(`INSERT INTO maker_project_cost_reviews(${cols.join(',')}) VALUES(${cols.map(()=>'?').join(',')})`).bind(...values).run();
  const reviewId=validId(insert.meta?.last_row_id);
  try{await auditAdminAction(ctx.env,ctx.request,a.user,{action_type:'maker_project_cost_review',target_type:'creative_work_project',target_id:projectId,target_key:String(reviewId),
   details:{scenario_kind:kind,request_key:key,currency:'CAD',finance_posted:false,stock_movement:false,product_updated:false,provider_published:false}});}
  catch(e){console.error('BUILD449_COST_AUDIT_WARNING',e?.name||'Error');}
  return out({ok:true,message:'Costing assumptions saved as a new immutable human review. No Inventory, ledger, price or sales action occurred.',review_id:reviewId,...(await detail(a.db,projectId))});
 }catch(e){console.error('BUILD449_COST_WRITE_FAILED',e?.name||'Error');return out({ok:false,code:'WRITE_UNCONFIRMED',error:'Review could not be confirmed. Refresh and inspect history before retrying; no accounting, stock or sales action is performed.'},409);}}
