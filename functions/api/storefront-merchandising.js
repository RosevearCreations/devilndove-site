// Build 59 — public Storefront merchandising projection with schema-compatible Product reads.
import { CURRENT_RELEASE } from './_lib/releaseAuthority.js';
import { activeRuleAt, projectProduct, projectStorefrontMerchandising } from './_lib/storefrontMerchandising.js';

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const text=(v)=>String(v==null?'':v).trim();
const safeIdentifier=(v)=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(v||''))?String(v):'';
async function tableExists(db,name){const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);return Boolean(r?.name);}
async function tableColumns(db,name){
  const safe=safeIdentifier(name);if(!safe)return new Set();
  try{const r=await db.prepare(`PRAGMA table_info(${safe})`).all();return new Set(rows(r).map((x)=>text(x?.name)).filter(Boolean));}
  catch{return new Set();}
}
function selectColumn(columns,name,fallback='NULL',alias=name){return columns.has(name)?`${name} AS ${alias}`:`${fallback} AS ${alias}`;}
function productSelect(columns){
  const material=columns.has('primary_material')?'primary_material':columns.has('material')?'material':null;
  const process=columns.has('making_process')?'making_process':columns.has('process_notes')?'process_notes':null;
  const inventory=columns.has('inventory_quantity')?'inventory_quantity':columns.has('on_hand_quantity')?'on_hand_quantity':null;
  return [
    selectColumn(columns,'product_id','NULL'),
    selectColumn(columns,'slug',"''"),
    selectColumn(columns,'name',"''"),
    selectColumn(columns,'product_category',"''"),
    selectColumn(columns,'product_type',"'physical'"),
    selectColumn(columns,'merchandise_origin',"'handmade'"),
    selectColumn(columns,'sale_channel',"'onsite'"),
    material?`${material} AS primary_material`:"'' AS primary_material",
    material?`${material} AS material`:"'' AS material",
    process?`${process} AS making_process`:"'' AS making_process",
    process?`${process} AS process_notes`:"'' AS process_notes",
    selectColumn(columns,'locality_label',"''"),
    selectColumn(columns,'price_cents','0'),
    selectColumn(columns,'currency',"'CAD'"),
    selectColumn(columns,'featured_image_url',"''"),
    inventory?`${inventory} AS inventory_quantity`:'0 AS inventory_quantity',
    selectColumn(columns,'status',"'active'"),
    selectColumn(columns,'sort_order','0')
  ].join(', ');
}

export async function onRequestGet({env}){
  const db=env.DB||env.DD_DB;
  if(!db)return Response.json({ok:false,release:CURRENT_RELEASE,authority:'public_products_plus_storefront_merchandising',code:'DATABASE_BINDING_UNAVAILABLE',error:'Database binding is not configured.'},{status:500});
  try{
    const productColumns=await tableColumns(db,'products');
    const required=['product_id','slug','name'];
    const missing=required.filter((c)=>!productColumns.has(c));
    if(missing.length)return Response.json({ok:false,release:CURRENT_RELEASE,authority:'public_products_plus_storefront_merchandising',code:'PRODUCT_SCHEMA_UNAVAILABLE',error:'Required Product columns are unavailable.',missing_columns:missing},{status:503,headers:{'Cache-Control':'no-store'}});
    const where=productColumns.has('status')?"WHERE LOWER(COALESCE(status,''))='active'":'';
    const order=[productColumns.has('sort_order')?'COALESCE(sort_order,0)':null,productColumns.has('name')?'LOWER(name)':null,'product_id'].filter(Boolean).join(', ');
    const productResult=await db.prepare(`SELECT ${productSelect(productColumns)} FROM products ${where} ORDER BY ${order}`).all();
    const products=rows(productResult);
    const ready=await Promise.all(['storefront_collections','storefront_collection_products','storefront_collage_presets'].map((n)=>tableExists(db,n)));
    if(ready.some((v)=>!v))return Response.json({ok:true,release:CURRENT_RELEASE,authority:'public_products_plus_storefront_merchandising',schema_ready:false,collections:[],collages:[],products:products.map(projectProduct),rules:[]},{headers:{'Cache-Control':'no-store'}});
    const [cr,mr,gr]=await Promise.all([
      db.prepare(`SELECT * FROM storefront_collections WHERE status='published' ORDER BY sort_order,LOWER(name),storefront_collection_id`).all(),
      db.prepare(`SELECT * FROM storefront_collection_products ORDER BY storefront_collection_id,sort_order,product_id`).all(),
      db.prepare(`SELECT * FROM storefront_collage_presets WHERE status='published' ORDER BY sort_order,LOWER(name),storefront_collage_preset_id`).all()
    ]);
    const rulesReady=await tableExists(db,'storefront_merchandising_rules');
    const rr=rulesReady?await db.prepare(`SELECT * FROM storefront_merchandising_rules WHERE rule_status='active' ORDER BY storefront_collection_id,priority DESC,storefront_merchandising_rule_id`).all():{results:[]};
    const projection=projectStorefrontMerchandising({products,collections:rows(cr),memberships:rows(mr),rules:rows(rr),nowMs:Date.now(),publishedOnly:true});
    const collages=rows(gr).map((g)=>({storefront_collage_preset_id:Number(g.storefront_collage_preset_id||0),slug:text(g.slug),name:text(g.name),storefront_collection_id:Number(g.storefront_collection_id||0)||null,layout_kind:text(g.layout_kind),max_items:Number(g.max_items||6),heading:text(g.heading),body_text:text(g.body_text)}));
    return Response.json({ok:true,release:CURRENT_RELEASE,authority:'public_products_plus_storefront_merchandising',schema_ready:true,merchandising_rules_ready:rulesReady,product_link_authority:projection.product_link_authority,evaluated_at:projection.evaluated_at,collections:projection.collections,collages,rules:rows(rr).filter((r)=>activeRuleAt(r,Date.now())).map((r)=>({storefront_merchandising_rule_id:Number(r.storefront_merchandising_rule_id||0),storefront_collection_id:Number(r.storefront_collection_id||0),rule_key:r.rule_key,operator:r.operator,effect:r.effect,priority:Number(r.priority||0),active_from:r.active_from,active_until:r.active_until}))},{headers:{'Cache-Control':'public, max-age=60'}});
  }catch(error){return Response.json({ok:false,release:CURRENT_RELEASE,authority:'public_products_plus_storefront_merchandising',code:'STOREFRONT_MERCHANDISING_FAILED',error:'Storefront merchandising could not load.',detail:String(error?.message||'').slice(0,240)},{status:500,headers:{'Cache-Control':'no-store'}});}
}
