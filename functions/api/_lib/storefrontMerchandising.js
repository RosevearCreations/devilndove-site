// Release 465 Build 1 — shared read-only Storefront merchandising projection.
export const text=(v)=>String(v==null?'':v).trim();
export const keyText=(v)=>text(v).toLowerCase();
export function productHref(product){const slug=text(product?.slug);return slug?`/shop/product/?slug=${encodeURIComponent(slug)}`:'/shop/';}
export function productValue(product,key){if(key==='primary_material')return text(product.primary_material||product.material);if(key==='making_process')return text(product.making_process||product.process_notes);return text(product[key]);}
export function matchRule(product,rule){const actual=keyText(productValue(product,rule.rule_key));const wanted=keyText(rule.rule_value);if(!wanted)return false;const op=keyText(rule.operator||'equals');if(op==='not_equals')return actual!==wanted;if(op==='contains')return actual.includes(wanted);if(op==='in')return wanted.split('|').map(keyText).filter(Boolean).includes(actual);return actual===wanted;}
export function activeRuleAt(rule,nowMs=Date.now()){if(keyText(rule.rule_status)!=='active')return false;const start=Date.parse(rule.active_from||''),end=Date.parse(rule.active_until||'');if(Number.isFinite(start)&&nowMs<start)return false;if(Number.isFinite(end)&&nowMs>end)return false;return true;}
export function legacyRuleMatch(product,collection){const k=text(collection.rule_key),v=text(collection.rule_value);if(!k||!v)return true;return v.split('|').map(keyText).filter(Boolean).includes(keyText(productValue(product,k)));}
export function membershipMap(memberships=[]){const out=new Map();for(const m of memberships)out.set(`${Number(m.storefront_collection_id)}:${Number(m.product_id)}`,keyText(m.membership_status));return out;}
export function projectProduct(product){return{product_id:Number(product.product_id||0),slug:text(product.slug),name:text(product.name),product_category:text(product.product_category),product_type:text(product.product_type),merchandise_origin:text(product.merchandise_origin),sale_channel:text(product.sale_channel),primary_material:text(product.primary_material||product.material),making_process:text(product.making_process||product.process_notes),locality_label:text(product.locality_label),price_cents:Number(product.price_cents||0),currency:text(product.currency)||'CAD',featured_image_url:text(product.featured_image_url),inventory_quantity:Number(product.inventory_quantity||0),href:productHref(product)};}
export function projectStorefrontMerchandising({products=[],collections=[],memberships=[],rules=[],nowMs=Date.now(),publishedOnly=true}={}){
  const overrides=membershipMap(memberships);
  const sourceCollections=publishedOnly?collections.filter((c)=>keyText(c.status)==='published'):collections;
  const projected=sourceCollections.map((c)=>{
    const collectionId=Number(c.storefront_collection_id||0);
    const active=rules.filter((r)=>Number(r.storefront_collection_id)===collectionId&&activeRuleAt(r,nowMs));
    const includeRules=active.filter((r)=>keyText(r.effect)==='include');
    const excludeRules=active.filter((r)=>keyText(r.effect)==='exclude');
    const selected=products.filter((p)=>{
      const override=overrides.get(`${collectionId}:${Number(p.product_id)}`);
      if(override==='included')return true;if(override==='excluded')return false;
      if(!legacyRuleMatch(p,c))return false;if(excludeRules.some((r)=>matchRule(p,r)))return false;
      return !includeRules.length||includeRules.some((r)=>matchRule(p,r));
    }).map(projectProduct);
    return{storefront_collection_id:collectionId,slug:text(c.slug),name:text(c.name),status:text(c.status),short_description:text(c.short_description),public_heading:text(c.public_heading)||text(c.name),public_body:text(c.public_body),hero_image_url:text(c.hero_image_url),collection_kind:text(c.collection_kind),seo_title:text(c.seo_title),seo_description:text(c.seo_description),active_rule_count:active.length,active_rule_ids:active.map((r)=>Number(r.storefront_merchandising_rule_id||0)).filter(Boolean),products:selected};
  });
  return{evaluated_at:new Date(nowMs).toISOString(),product_link_authority:'/shop/product/?slug=<product-slug>',collections:projected,active_rules:rules.filter((r)=>activeRuleAt(r,nowMs)).map((r)=>({storefront_merchandising_rule_id:Number(r.storefront_merchandising_rule_id||0),storefront_collection_id:Number(r.storefront_collection_id||0),rule_key:r.rule_key,operator:r.operator,effect:r.effect,priority:Number(r.priority||0),active_from:r.active_from,active_until:r.active_until}))};
}
