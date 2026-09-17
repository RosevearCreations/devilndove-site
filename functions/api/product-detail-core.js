// Release 467 Build 166 — bounded public Product detail core.
// One Product row + its bounded gallery + optional SEO row. No schema introspection, no R2 listing,
// no request-time DDL, no catalog scan, no offer/readiness/resource expansion.
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-DD-Product-Detail':'core-v166',...headers}});}
function rowsRead(result){const n=Number(result?.meta?.rows_read??result?.meta?.rowsRead);return Number.isFinite(n)&&n>=0?n:0;}
function clean(value){return String(value??'').trim();}

export async function onRequestGet({request,env}){
  const db=env.DB||env.DD_DB;
  if(!db)return json({ok:false,error:'Store data is temporarily unavailable.',code:'db_unavailable'},503);
  const slug=clean(new URL(request.url).searchParams.get('slug')).toLowerCase();
  if(!slug)return json({ok:false,error:'A valid product slug is required.'},400);
  let read=0;
  try{
    const result=await db.prepare("SELECT * FROM products WHERE lower(slug)=? AND lower(COALESCE(status,'active'))='active' LIMIT 1").bind(slug).all();
    read+=rowsRead(result);
    const product=Array.isArray(result?.results)?result.results[0]||null:null;
    if(!product)return json({ok:false,error:'Product not found.'},404,{'X-DD-D1-Rows-Read':String(read)});

    let images=[];
    try{
      const gallery=await db.prepare("SELECT product_image_id,product_id,image_url,alt_text,sort_order,created_at FROM product_images WHERE product_id=? AND trim(coalesce(image_url,''))<>'' ORDER BY coalesce(sort_order,0),product_image_id LIMIT 20").bind(product.product_id).all();
      read+=rowsRead(gallery);images=Array.isArray(gallery?.results)?gallery.results:[];
    }catch{}
    const featured=clean(product.featured_image_url);
    if(featured&&!images.some((row)=>clean(row.image_url).toLowerCase()===featured.toLowerCase()))images.unshift({product_id:product.product_id,image_url:featured,alt_text:clean(product.name)||'Product image',sort_order:-1,source:'featured'});

    let seo={};
    try{
      const seoResult=await db.prepare("SELECT meta_title,meta_description,keywords,h1_override,canonical_url,schema_type,og_title,og_description,og_image_url FROM product_seo WHERE product_id=? LIMIT 1").bind(product.product_id).all();
      read+=rowsRead(seoResult);seo=Array.isArray(seoResult?.results)?seoResult.results[0]||{}:{};
    }catch{}
    Object.assign(product,seo);

    return json({ok:true,product,images,storefront_images:images,delivery:'product-detail-core-v166',read_policy:'one_product_bounded_gallery_optional_seo',d1_rows_read:read},200,{'X-DD-D1-Rows-Read':String(read)});
  }catch(error){
    const message=String(error?.message||'Product detail failed.');
    const quota=/rows read|daily|limit|quota|7500/i.test(message);
    return json({ok:false,error:quota?'Store data has reached its temporary read limit. Please try again later.':'Product detail is temporarily unavailable.',code:quota?'d1_read_capacity_unavailable':'product_detail_core_failed',detail:message.slice(0,160)},quota?503:500,{'X-DD-D1-Rows-Read':String(read)});
  }
}
