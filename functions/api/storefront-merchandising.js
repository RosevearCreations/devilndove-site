// Release 465 Build 1 — public Storefront merchandising projection using the shared evaluator.
import { CURRENT_RELEASE } from './_lib/releaseAuthority.js';
import { activeRuleAt, projectProduct, projectStorefrontMerchandising } from './_lib/storefrontMerchandising.js';

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const text=(v)=>String(v==null?'':v).trim();
async function tableExists(db,name){const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);return Boolean(r?.name);}

export async function onRequestGet({env}){
  const db=env.DB||env.DD_DB;
  if(!db)return Response.json({ok:false,release:CURRENT_RELEASE,error:'Database binding is not configured.'},{status:500});
  try{
    const productResult=await db.prepare(`SELECT product_id,slug,name,product_category,product_type,merchandise_origin,sale_channel,primary_material,material,making_process,process_notes,locality_label,price_cents,currency,featured_image_url,inventory_quantity,status FROM products WHERE status='active' ORDER BY sort_order,LOWER(name),product_id`).all();
    const products=rows(productResult);
    const ready=await Promise.all(['storefront_collections','storefront_collection_products','storefront_collage_presets'].map((n)=>tableExists(db,n)));
    if(ready.some((v)=>!v))return Response.json({ok:true,release:CURRENT_RELEASE,schema_ready:false,collections:[],collages:[],products:products.map(projectProduct),rules:[]},{headers:{'Cache-Control':'no-store'}});
    const [cr,mr,gr]=await Promise.all([
      db.prepare(`SELECT * FROM storefront_collections WHERE status='published' ORDER BY sort_order,LOWER(name),storefront_collection_id`).all(),
      db.prepare(`SELECT * FROM storefront_collection_products ORDER BY storefront_collection_id,sort_order,product_id`).all(),
      db.prepare(`SELECT * FROM storefront_collage_presets WHERE status='published' ORDER BY sort_order,LOWER(name),storefront_collage_preset_id`).all()
    ]);
    const rulesReady=await tableExists(db,'storefront_merchandising_rules');
    const rr=rulesReady?await db.prepare(`SELECT * FROM storefront_merchandising_rules WHERE rule_status='active' ORDER BY storefront_collection_id,priority DESC,storefront_merchandising_rule_id`).all():{results:[]};
    const projection=projectStorefrontMerchandising({products,collections:rows(cr),memberships:rows(mr),rules:rows(rr),nowMs:Date.now(),publishedOnly:true});
    const collages=rows(gr).map((g)=>({storefront_collage_preset_id:Number(g.storefront_collage_preset_id||0),slug:text(g.slug),name:text(g.name),storefront_collection_id:Number(g.storefront_collection_id||0)||null,layout_kind:text(g.layout_kind),max_items:Number(g.max_items||6),heading:text(g.heading),body_text:text(g.body_text)}));
    return Response.json({ok:true,release:CURRENT_RELEASE,schema_ready:true,merchandising_rules_ready:rulesReady,product_link_authority:projection.product_link_authority,evaluated_at:projection.evaluated_at,collections:projection.collections,collages,rules:rows(rr).filter((r)=>activeRuleAt(r,Date.now())).map((r)=>({storefront_merchandising_rule_id:Number(r.storefront_merchandising_rule_id||0),storefront_collection_id:Number(r.storefront_collection_id||0),rule_key:r.rule_key,operator:r.operator,effect:r.effect,priority:Number(r.priority||0),active_from:r.active_from,active_until:r.active_until}))},{headers:{'Cache-Control':'public, max-age=60'}});
  }catch(error){return Response.json({ok:false,release:CURRENT_RELEASE,error:error?.message||'Storefront merchandising could not load.'},{status:500,headers:{'Cache-Control':'no-store'}});}
}
