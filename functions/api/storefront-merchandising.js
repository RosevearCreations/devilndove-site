// Release 464 Update 3 — public Storefront merchandising projection.
// Product facts remain /api/products authority; this layer only curates published groupings.
import { CURRENT_RELEASE } from './_lib/releaseAuthority.js';

const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const text=(v)=>String(v==null?'':v).trim();
const keyText=(v)=>text(v).toLowerCase();

async function tableExists(db,name){
  const r=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(name).first().catch(()=>null);
  return Boolean(r?.name);
}
function productHref(product){
  const slug=text(product?.slug);
  return slug ? `/shop/product/?slug=${encodeURIComponent(slug)}` : '/shop/';
}
function productValue(product,key){
  if(key==='primary_material') return text(product.primary_material||product.material);
  if(key==='making_process') return text(product.making_process||product.process_notes);
  return text(product[key]);
}
function matchRule(product,rule){
  const actual=keyText(productValue(product,rule.rule_key));
  const wanted=keyText(rule.rule_value);
  if(!wanted) return false;
  const op=keyText(rule.operator||'equals');
  if(op==='not_equals') return actual!==wanted;
  if(op==='contains') return actual.includes(wanted);
  if(op==='in') return wanted.split('|').map(keyText).filter(Boolean).includes(actual);
  return actual===wanted;
}
function activeRule(rule,now=Date.now()){
  if(keyText(rule.rule_status)!=='active') return false;
  const start=Date.parse(rule.active_from||''); const end=Date.parse(rule.active_until||'');
  if(Number.isFinite(start)&&now<start) return false;
  if(Number.isFinite(end)&&now>end) return false;
  return true;
}
function legacyRuleMatch(product,collection){
  const k=text(collection.rule_key); const v=text(collection.rule_value);
  if(!k||!v) return true;
  return v.split('|').map(keyText).filter(Boolean).includes(keyText(productValue(product,k)));
}
function membershipMap(memberships){
  const out=new Map();
  for(const m of memberships) out.set(`${Number(m.storefront_collection_id)}:${Number(m.product_id)}`,keyText(m.membership_status));
  return out;
}
function projectProduct(product){
  return {
    product_id:Number(product.product_id||0),slug:text(product.slug),name:text(product.name),
    product_category:text(product.product_category),product_type:text(product.product_type),
    merchandise_origin:text(product.merchandise_origin),price_cents:Number(product.price_cents||0),
    currency:text(product.currency)||'CAD',featured_image_url:text(product.featured_image_url),
    inventory_quantity:Number(product.inventory_quantity||0),href:productHref(product)
  };
}

export async function onRequestGet({env}){
  const db=env.DB||env.DD_DB;
  if(!db) return Response.json({ok:false,release:CURRENT_RELEASE,error:'Database binding is not configured.'},{status:500});
  try{
    const productResult=await db.prepare(`SELECT product_id,slug,name,product_category,product_type,merchandise_origin,sale_channel,primary_material,material,making_process,process_notes,locality_label,price_cents,currency,featured_image_url,inventory_quantity,status FROM products WHERE status='active' ORDER BY sort_order,LOWER(name),product_id`).all();
    const products=rows(productResult);
    const ready=await Promise.all(['storefront_collections','storefront_collection_products','storefront_collage_presets'].map((n)=>tableExists(db,n)));
    if(ready.some((v)=>!v)){
      return Response.json({ok:true,release:CURRENT_RELEASE,schema_ready:false,collections:[],collages:[],products:products.map(projectProduct),rules:[]},{headers:{'Cache-Control':'no-store'}});
    }
    const [cr,mr,gr]=await Promise.all([
      db.prepare(`SELECT * FROM storefront_collections WHERE status='published' ORDER BY sort_order,LOWER(name),storefront_collection_id`).all(),
      db.prepare(`SELECT * FROM storefront_collection_products ORDER BY storefront_collection_id,sort_order,product_id`).all(),
      db.prepare(`SELECT * FROM storefront_collage_presets WHERE status='published' ORDER BY sort_order,LOWER(name),storefront_collage_preset_id`).all()
    ]);
    const rulesReady=await tableExists(db,'storefront_merchandising_rules');
    const rr=rulesReady?await db.prepare(`SELECT * FROM storefront_merchandising_rules WHERE rule_status='active' ORDER BY storefront_collection_id,priority DESC,storefront_merchandising_rule_id`).all():{results:[]};
    const collections=rows(cr),memberships=rows(mr),rules=rows(rr),overrides=membershipMap(memberships),now=Date.now();
    const projected=collections.map((c)=>{
      const collectionId=Number(c.storefront_collection_id||0);
      const active=rules.filter((r)=>Number(r.storefront_collection_id)===collectionId&&activeRule(r,now));
      const includeRules=active.filter((r)=>keyText(r.effect)==='include');
      const excludeRules=active.filter((r)=>keyText(r.effect)==='exclude');
      const selected=products.filter((p)=>{
        const override=overrides.get(`${collectionId}:${Number(p.product_id)}`);
        if(override==='included') return true;
        if(override==='excluded') return false;
        if(!legacyRuleMatch(p,c)) return false;
        if(excludeRules.some((r)=>matchRule(p,r))) return false;
        return !includeRules.length||includeRules.some((r)=>matchRule(p,r));
      }).map(projectProduct);
      return {
        storefront_collection_id:collectionId,slug:text(c.slug),name:text(c.name),
        short_description:text(c.short_description),public_heading:text(c.public_heading)||text(c.name),
        public_body:text(c.public_body),hero_image_url:text(c.hero_image_url),
        collection_kind:text(c.collection_kind),seo_title:text(c.seo_title),seo_description:text(c.seo_description),
        active_rule_count:active.length,products:selected
      };
    });
    const collages=rows(gr).map((g)=>({
      storefront_collage_preset_id:Number(g.storefront_collage_preset_id||0),slug:text(g.slug),name:text(g.name),
      storefront_collection_id:Number(g.storefront_collection_id||0)||null,layout_kind:text(g.layout_kind),
      max_items:Number(g.max_items||6),heading:text(g.heading),body_text:text(g.body_text)
    }));
    return Response.json({
      ok:true,release:CURRENT_RELEASE,schema_ready:true,merchandising_rules_ready:rulesReady,
      product_link_authority:'/shop/product/?slug=<product-slug>',
      collections:projected,collages,
      rules:rules.filter((r)=>activeRule(r,now)).map((r)=>({
        storefront_merchandising_rule_id:Number(r.storefront_merchandising_rule_id||0),
        storefront_collection_id:Number(r.storefront_collection_id||0),rule_key:r.rule_key,operator:r.operator,
        effect:r.effect,priority:Number(r.priority||0),active_from:r.active_from,active_until:r.active_until
      }))
    },{headers:{'Cache-Control':'public, max-age=60'}});
  }catch(error){
    return Response.json({ok:false,release:CURRENT_RELEASE,error:error?.message||'Storefront merchandising could not load.'},{status:500,headers:{'Cache-Control':'no-store'}});
  }
}
