// Release 465 Build 1 — admin-only read-only Storefront merchandising simulator.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { projectStorefrontMerchandising } from '../_lib/storefrontMerchandising.js';

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const json=(d,s=200)=>jsonResponse({release:465,build:1,...d},s,{'Cache-Control':'no-store'});
async function tableNames(db){const required=['products','storefront_collections','storefront_collection_products','storefront_merchandising_rules'];const placeholders=required.map(()=>'?').join(',');const found=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...required).all().catch(()=>({results:[]})));const set=new Set(found.map((r)=>String(r.name||'')));return{ready:required.every((n)=>set.has(n)),missing:required.filter((n)=>!set.has(n))};}

export async function onRequestGet({request,env}){
  const user=await getAdminUserFromRequest(request,env);if(!user)return json({ok:false,error:'Unauthorized.'},401);
  const db=getDb(env);if(!db)return json({ok:false,error:'Database binding is not configured.'},500);
  const schema=await tableNames(db);if(!schema.ready)return json({ok:false,code:'release465_merchandising_simulator_schema_not_ready',missing_tables:schema.missing,error:`Storefront simulation schema is not ready: ${schema.missing.join(', ')}`},409);
  const url=new URL(request.url),raw=String(url.searchParams.get('simulate_at')||'').trim();
  const requested=raw?Date.parse(raw):Date.now();if(!Number.isFinite(requested))return json({ok:false,error:'simulate_at must be a valid date/time.'},400);
  try{
    const [pr,cr,mr,rr]=await Promise.all([
      db.prepare(`SELECT product_id,slug,name,product_category,product_type,merchandise_origin,sale_channel,primary_material,material,making_process,process_notes,locality_label,price_cents,currency,featured_image_url,inventory_quantity,status FROM products WHERE status='active' ORDER BY sort_order,LOWER(name),product_id`).all(),
      db.prepare(`SELECT * FROM storefront_collections WHERE status='published' ORDER BY sort_order,LOWER(name),storefront_collection_id`).all(),
      db.prepare(`SELECT * FROM storefront_collection_products ORDER BY storefront_collection_id,sort_order,product_id`).all(),
      db.prepare(`SELECT * FROM storefront_merchandising_rules ORDER BY storefront_collection_id,priority DESC,storefront_merchandising_rule_id`).all()
    ]);
    const projection=projectStorefrontMerchandising({products:rows(pr),collections:rows(cr),memberships:rows(mr),rules:rows(rr),nowMs:requested,publishedOnly:true});
    return json({ok:true,mode:'read_only_simulation',mutation_capability:'none',requested_simulate_at:raw||null,...projection,summary:{collection_count:projection.collections.length,active_rule_count:projection.active_rules.length,projected_product_placements:projection.collections.reduce((n,c)=>n+(c.products?.length||0),0)},safety:{product_rows_rewritten:false,inventory_mutated:false,provider_execution:false,provider_publication:false}});
  }catch(error){return json({ok:false,error:error?.message||'Storefront simulation could not load.'},500);}
}
