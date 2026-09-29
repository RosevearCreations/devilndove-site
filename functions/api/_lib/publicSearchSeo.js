// Release 467 Build 297 — bounded initial Product/story SEO and dynamic sitemap facts.
import { publicContentPublications } from './contentPublications.js';

const PRODUCTION_ORIGIN='https://devilndove.com';
const clean=(v)=>String(v??'').trim();
const clip=(v,n=300)=>clean(v).replace(/\s+/g,' ').slice(0,n);
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function safeDate(value){
  const raw=clean(value); if(!raw)return '';
  const d=new Date(raw); return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):'';
}
export function canonicalProductUrl(slug){
  const s=clean(slug);return s?`${PRODUCTION_ORIGIN}/shop/product/?slug=${encodeURIComponent(s)}`:`${PRODUCTION_ORIGIN}/shop/product/`;
}
export function canonicalStoryUrl(item){
  const raw=clean(item?.canonical_path);
  if(!raw.startsWith('/workshop-journal/')||raw.startsWith('//'))return '';
  try{
    const u=new URL(raw,PRODUCTION_ORIGIN);
    if(u.origin!==PRODUCTION_ORIGIN||!u.pathname.startsWith('/workshop-journal/'))return '';
    return `${u.origin}${u.pathname}${u.search}`;
  }catch{return '';}
}
function publicPath(value){
  const raw=clean(value);if(!raw)return '';
  try{const u=new URL(raw,PRODUCTION_ORIGIN);if(u.origin!==PRODUCTION_ORIGIN)return '';return u.pathname+u.search;}catch{return '';}
}
async function loadProductDiscoveryLinks(db,product){
  const out=[];const id=Number(product?.product_id||0);const slug=clean(product?.slug);if(!db||!id||!slug)return out;
  const rel=`/shop/product/?slug=${encodeURIComponent(slug)}`,abs=PRODUCTION_ORIGIN+rel;
  try{
    const result=await db.prepare(`SELECT pub.publication_slug,pub.title,pub.canonical_path
      FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id
      WHERE pub.destination='workshop_journal' AND pub.content_status='published'
        AND (cp.product_id=? OR pub.product_path=? OR pub.product_path=?)
      ORDER BY datetime(pub.published_at) DESC,pub.content_publication_id DESC LIMIT 5`).bind(id,rel,abs).all();
    for(const row of rows(result)){
      const href=publicPath(row.canonical_path)||`/workshop-journal/story/?story=${encodeURIComponent(clean(row.publication_slug))}`;
      if(href)out.push({kind:'story',label:clean(row.title)||'Related workshop story',href});
    }
  }catch{}
  return out;
}
async function loadStoryDiscoveryLinks(db,item){
  const out=[];if(!db||!item)return out;
  const productPath=publicPath(item.product_path);
  if(productPath&&productPath!=='/shop/')out.push({kind:'product',label:'Related piece',href:productPath});
  try{
    const source=await db.prepare(`SELECT cp.source_type,cp.source_id,cp.product_id
      FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id
      WHERE pub.content_publication_id=? AND pub.content_status='published' LIMIT 1`).bind(Number(item.content_publication_id||0)).first();
    const projectId=clean(source?.source_type)==='creative_work_project'?Number(source?.source_id||0):0;
    if(projectId){
      const processes=rows(await db.prepare(`SELECT DISTINCT ip.process_key FROM creative_project_operations o
        JOIN inventory_processes ip ON ip.inventory_process_id=o.inventory_process_id
        WHERE o.creative_work_project_id=? AND COALESCE(o.plan_status,'planned')<>'retired' LIMIT 40`).bind(projectId).all().catch(()=>({results:[]})));
      const keys=new Set(processes.map((row)=>clean(row.process_key)).filter(Boolean));
      if(keys.size){
        const profiles=rows(await db.prepare(`SELECT capability_key,display_name,related_process_keys_json
          FROM workshop_capability_profiles WHERE is_public=1 AND review_status IN ('reviewed','published')
          ORDER BY display_name LIMIT 80`).all().catch(()=>({results:[]})));
        for(const p of profiles){
          let related=[];try{const x=JSON.parse(String(p.related_process_keys_json||'[]'));related=Array.isArray(x)?x:[];}catch{}
          if(related.some((key)=>keys.has(clean(key))))out.push({kind:'capability',label:clean(p.display_name)||clean(p.capability_key),href:`/capabilities/${encodeURIComponent(clean(p.capability_key))}/`});
        }
      }
    }
  }catch{}
  const seen=new Set();return out.filter((link)=>{const key=link.href;if(!key||seen.has(key))return false;seen.add(key);return true;}).slice(0,6);
}
export async function loadPublishedProductSeo(db,slug){
  const key=clean(slug).toLowerCase(); if(!db||!key)return null;
  const product=await db.prepare("SELECT * FROM products WHERE lower(slug)=? AND lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','') LIMIT 1").bind(key).first().catch(()=>null);
  if(!product)return null;
  let seo={};try{seo=await db.prepare("SELECT meta_title,meta_description,keywords,h1_override,canonical_url,schema_type,og_title,og_description,og_image_url FROM product_seo WHERE product_id=? LIMIT 1").bind(product.product_id).first()||{};}catch{}
  let images=[];try{
    const result=await db.prepare("SELECT product_image_id,product_id,image_url,alt_text,sort_order,created_at FROM product_images WHERE product_id=? AND trim(coalesce(image_url,''))<>'' ORDER BY coalesce(sort_order,0),product_image_id LIMIT 20").bind(product.product_id).all();
    images=rows(result);
  }catch{}
  const merged={...product,...seo};
  const featured=clean(merged.featured_image_url);
  if(featured&&!images.some((row)=>clean(row.image_url).toLowerCase()===featured.toLowerCase()))images.unshift({product_id:merged.product_id,image_url:featured,alt_text:clean(merged.name)||'Product image',sort_order:-1,source:'featured'});
  const canonical=canonicalProductUrl(merged.slug||key);
  const name=clean(merged.h1_override||merged.name)||'Devil n Dove product';
  const title=clean(merged.meta_title)||`${clean(merged.name)||'Product'} — Devil n Dove`;
  const description=clip(merged.meta_description||merged.short_description||merged.description||'View this Devil n Dove product.',300);
  const primary=clean(images[0]?.image_url||merged.og_image_url||merged.featured_image_url);
  const tracked=Number(merged.inventory_tracking||0)===1;
  const qty=Number(merged.inventory_quantity??merged.on_hand_quantity??0);
  const available=!tracked||qty>0;
  const offer={'@type':'Offer',url:canonical,priceCurrency:clean(merged.currency)||'CAD',price:(Math.max(0,Number(merged.price_cents||0))/100).toFixed(2),availability:available?'https://schema.org/InStock':'https://schema.org/OutOfStock'};
  if(Number(merged.requires_shipping||0)===1)offer.shippingDetails={'@type':'OfferShippingDetails',shippingDestination:{'@type':'DefinedRegion',addressCountry:'CA'}};
  const productNode={'@type':clean(merged.schema_type)||'Product','@id':`${canonical}#product`,name:clean(merged.name)||name,description,sku:clean(merged.sku)||undefined,image:images.map((row)=>clean(row.image_url)).filter(Boolean),category:clean(merged.product_category)||undefined,url:canonical,offers:offer};
  const breadcrumb={'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[
    {'@type':'ListItem',position:1,name:'Home',item:`${PRODUCTION_ORIGIN}/`},
    {'@type':'ListItem',position:2,name:'Shop',item:`${PRODUCTION_ORIGIN}/shop/`},
    {'@type':'ListItem',position:3,name:clean(merged.name)||'Product',item:canonical}
  ]};
  const discovery_links=await loadProductDiscoveryLinks(db,merged);
  return {kind:'product',canonical,title,description,h1:name,image:primary,product:merged,images,discovery_links,structured_data:{'@context':'https://schema.org','@graph':[productNode,breadcrumb]}};
}
export async function loadPublishedStorySeo(db,slug){
  if(!db||!clean(slug))return null;
  try{
    const item=await publicContentPublications(db,{destination:'workshop_journal',slug:clean(slug),limit:1});
    if(!item)return null;
    const canonical=canonicalStoryUrl(item);if(!canonical)return null;
    const title=clean(item.meta_title)||`${clean(item.title)||'Workshop story'} | Devil n Dove`;
    const description=clip(item.meta_description||item.summary||'A reviewed Devil n Dove workshop story.',300);
    const article={'@type':'BlogPosting','@id':`${canonical}#article`,headline:clean(item.title)||'Workshop story',description,url:canonical,mainEntityOfPage:canonical,isPartOf:{'@type':'Blog','name':'Devil n Dove Workshop Journal',url:`${PRODUCTION_ORIGIN}/workshop-journal/`}};
    if(clean(item.hero_media_url))article.image=[clean(item.hero_media_url)];
    if(clean(item.published_at))article.datePublished=clean(item.published_at);
    if(clean(item.updated_at))article.dateModified=clean(item.updated_at);
    const breadcrumb={'@type':'BreadcrumbList','@id':`${canonical}#breadcrumb`,itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:`${PRODUCTION_ORIGIN}/`},
      {'@type':'ListItem',position:2,name:'Workshop Journal',item:`${PRODUCTION_ORIGIN}/workshop-journal/`},
      {'@type':'ListItem',position:3,name:clean(item.title)||'Workshop story',item:canonical}
    ]};
    const discovery_links=await loadStoryDiscoveryLinks(db,item);
    return {kind:'story',canonical,title,description,h1:clean(item.title)||'Workshop story',image:clean(item.hero_media_url),item,discovery_links,structured_data:{'@context':'https://schema.org','@graph':[article,breadcrumb]}};
  }catch{return null;}
}
export async function loadDynamicSitemapEntries(db){
  const out=[];if(!db)return out;
  try{
    const products=await db.prepare("SELECT slug,updated_at FROM products WHERE lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','') AND trim(coalesce(slug,''))<>'' ORDER BY product_id LIMIT 1000").all();
    for(const row of rows(products))out.push({loc:canonicalProductUrl(row.slug),lastmod:safeDate(row.updated_at),kind:'product'});
  }catch{}
  try{
    const stories=await db.prepare("SELECT canonical_path,updated_at FROM content_publications WHERE destination='workshop_journal' AND content_status='published' AND trim(coalesce(canonical_path,''))<>'' ORDER BY content_publication_id LIMIT 500").all();
    for(const row of rows(stories)){
      const loc=canonicalStoryUrl(row);if(loc)out.push({loc,lastmod:safeDate(row.updated_at),kind:'story'});
    }
  }catch{}
  return out;
}
