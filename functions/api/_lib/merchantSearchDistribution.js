// Release 467 Build 298 — reviewed Merchant/Search distribution facts over existing Product authority.
// Read-only. No schema mutation and no external provider execution.
const ORIGIN='https://devilndove.com';
const clean=(v,n=0)=>{const s=String(v??'').trim();return n>0?s.slice(0,n):s;};
const rows=(r)=>Array.isArray(r?.results)?r.results:[];
const truthy=(v)=>['1','true','yes','on','confirmed'].includes(clean(v).toLowerCase());
export function absolutePublicUrl(value){
  const raw=clean(value);if(!raw)return '';
  try{const u=new URL(raw,ORIGIN);if(!['devilndove.com','www.devilndove.com'].includes(u.hostname))return raw;u.protocol='https:';u.hostname='devilndove.com';u.hash='';return u.toString();}catch{return raw.startsWith('/')?ORIGIN+raw:'';}
}
export function merchantConfiguration(env={}){
  // Build 760: absent env is NOT zero/free shipping. Checkout currently charges $15 CAD.
  // Reject a conflicting owner-supplied rate rather than advertise an untrue fee.
  const rawFlat=clean(env.MERCHANT_CA_SHIPPING_PRICE_CAD);
  const flatValid=rawFlat!==''&&/^(?:0|[1-9]\\d*)(?:\\.\\d{1,2})?$/.test(rawFlat);
  const flat=flatValid?Number(rawFlat):null;
  const shippingConfirmed=(rawFlat===''||(flatValid&&flat===15));
  const returnLabel=clean(env.MERCHANT_RETURN_POLICY_LABEL,100);
  const merchantAccountReturnConfirmed=truthy(env.MERCHANT_ACCOUNT_RETURN_POLICY_CONFIRMED);
  // The public Build 760 returns page establishes a site policy, NOT Google-account setup.
  const returnsConfirmed=true;
  return {
    target_country:'CA',
    currency:'CAD',
    language:'en',
    shipping_confirmed:shippingConfirmed,
    shipping_source:shippingConfirmed?'checkout_authoritative_15_cad':'blocked_rate_mismatch',
    shipping_price_cad:shippingConfirmed?15:null,
    shipping_rate_mismatch:!shippingConfirmed,
    handling_min_business_days:5,handling_max_business_days:10,
    transit_min_business_days:3,transit_max_business_days:15,
    shipping_service:clean(env.MERCHANT_CA_SHIPPING_SERVICE,80)||'Standard',
    returns_confirmed:returnsConfirmed,
    return_policy_source:'published_site_policy',
    merchant_account_returns_confirmed:merchantAccountReturnConfirmed,
    return_policy_label:returnLabel,
    return_policy_days:14,
    return_policy_url:ORIGIN+'/returns/',
    shipping_policy_url:ORIGIN+'/shipping/',
    terms_url:ORIGIN+'/terms/',
    us_sales_shipping_suspended:true
  };
}
// Never submit decorative workshop placeholders as original offer photographs.
export function merchantProductImage(value){
 const absolute=absolutePublicUrl(value);
 if(!absolute||!/\\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(absolute))return '';
 try{
  const url=new URL(absolute);
  if(url.protocol!=='https:')return '';
  if(/\\/(?:assets\\/placeholders|assets\\/images\\/brand-v3|assets\\/images\\/site)\\//i.test(url.pathname)||
    /(?:placeholder|no-image|coming-soon|stock-photo|logo)/i.test(url.pathname))return '';
  return absolute;
 }catch{return '';}
}
function productCondition(p){
  const note=clean(p.condition_summary).toLowerCase();
  if(note.includes('refurbish'))return 'refurbished';
  if(/\b(new|unused|unopened|new old stock|nos)\b/.test(note))return 'new';
  return clean(p.merchandise_origin).toLowerCase()==='handmade'?'new':'used';
}
export async function merchantCoverage(db,env={}){
  const config=merchantConfiguration(env);
  if(!db)return {config,eligible:[],blocked:[],summary:{total:0,eligible:0,blocked:0}};
  const result=await db.prepare(`SELECT p.product_id,p.slug,p.sku,p.name,p.short_description,p.description,p.product_category,p.product_type,
      p.status,p.review_status,p.price_cents,p.currency,p.requires_shipping,p.inventory_tracking,p.inventory_quantity,p.featured_image_url,
      p.merchandise_origin,p.sale_channel,p.condition_summary,p.updated_at,
      ps.meta_description,ps.og_image_url
    FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id
    WHERE lower(COALESCE(p.status,'active'))='active'
      AND lower(COALESCE(p.review_status,'published')) IN ('approved','published','')
    ORDER BY p.product_id LIMIT 750`).all().catch(()=>({results:[]}));
  // One bounded, read-only D1 gallery query; never invent item-specific photos.
  const gallery=await db.prepare('SELECT product_id,image_url,sort_order,product_image_id FROM product_images ORDER BY product_id,sort_order,product_image_id LIMIT 3000')
    .all().catch(()=>({results:[]}));
  const media=new Map();
  for(const im of rows(gallery)){
   const id=Number(im.product_id||0),url=merchantProductImage(im.image_url);
   if(!id||!url)continue;
   if(!media.has(id))media.set(id,[]);
   const list=media.get(id);
   if(list.length<12&&!list.includes(url))list.push(url);
  }
  const eligible=[],blocked=[];
  for(const p of rows(result)){
    const reasons=[];
    const slug=clean(p.slug);const name=clean(p.name);const description=clean(p.meta_description||p.short_description||p.description,5000);
    const price=Number(p.price_cents||0);const currency=clean(p.currency||'CAD').toUpperCase();
    const productMedia=[merchantProductImage(p.featured_image_url||p.og_image_url),
      ...(media.get(Number(p.product_id||0))||[])].filter(Boolean);
    const uniqueMedia=[...new Set(productMedia)];
    const image=uniqueMedia[0]||'';
    const type=clean(p.product_type||'physical').toLowerCase();
    const channel=clean(p.sale_channel||'onsite').toLowerCase();
    if(!slug)reasons.push('missing_slug');
    if(!name)reasons.push('missing_title');
    if(description.length<20)reasons.push('missing_or_thin_description');
    if(!(price>0))reasons.push('missing_price');
    if(currency!=='CAD')reasons.push('currency_not_cad');
    if(!image)reasons.push('missing_original_product_image');
    if(type==='digital')reasons.push('digital_not_in_build298_merchant_feed');
    if(channel==='external_only')reasons.push('external_only_sale_channel');
    if(Number(p.requires_shipping||0)!==1)reasons.push('online_canada_shipping_not_enabled');
    if(Number(p.requires_shipping||0)===1&&!config.shipping_confirmed)reasons.push('merchant_shipping_not_confirmed');
    if(!config.returns_confirmed)reasons.push('merchant_return_policy_not_confirmed');
    const canonical=slug?`${ORIGIN}/shop/product/?slug=${encodeURIComponent(slug)}`:'';
    const item={
      product_id:Number(p.product_id||0),id:`dd-${Number(p.product_id||0)}`,slug,sku:clean(p.sku),title:name,description,
      link:canonical,image_link:image,additional_image_links:uniqueMedia.slice(1,11),image_count:uniqueMedia.length,
      image_coverage_recommended:uniqueMedia.length>=2,price_cents:price,currency,availability:Number(p.inventory_tracking||0)===1&&Number(p.inventory_quantity||0)<=0?'out_of_stock':'in_stock',
      condition:productCondition(p),brand:clean(p.merchandise_origin).toLowerCase()==='handmade'?'Devil n Dove':'',
      identifier_exists:clean(p.merchandise_origin).toLowerCase()==='handmade'?'yes':'no',
      product_type:type,merchandise_origin:clean(p.merchandise_origin),sale_channel:channel,updated_at:clean(p.updated_at),requires_shipping:Number(p.requires_shipping||0)===1,
      shipping:config.shipping_confirmed?{country:'CA',service:config.shipping_service,
       price_cad:config.shipping_price_cad,handling_min_days:config.handling_min_business_days,
       handling_max_days:config.handling_max_business_days,transit_min_days:config.transit_min_business_days,
       transit_max_days:config.transit_max_business_days}:null,
      return_policy_label:config.return_policy_label,return_policy_reference:config.terms_url,blockers:reasons
    };
    (reasons.length?blocked:eligible).push(item);
  }
  const blocker_counts={};
  for(const item of blocked)for(const reason of item.blockers)blocker_counts[reason]=(blocker_counts[reason]||0)+1;
  return {config,eligible,blocked,summary:{total:eligible.length+blocked.length,eligible:eligible.length,blocked:blocked.length,blocker_counts}};
}
function xml(value){return String(value??'').replace(/[&<>"']/g,(ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
export function merchantRssXml(coverage){
  const config=coverage?.config||{};
  const items=(coverage?.eligible||[]).map((p)=>{
    const shipping=p.shipping&&p.shipping.price_cad!=null?`<g:shipping><g:country>CA</g:country><g:service>${xml(p.shipping.service)}</g:service><g:price>${Number(p.shipping.price_cad).toFixed(2)} CAD</g:price><g:min_handling_time>${p.shipping.handling_min_days}</g:min_handling_time><g:max_handling_time>${p.shipping.handling_max_days}</g:max_handling_time><g:min_transit_time>${p.shipping.transit_min_days}</g:min_transit_time><g:max_transit_time>${p.shipping.transit_max_days}</g:max_transit_time></g:shipping>`:'';
    const returns=p.return_policy_label?`<g:return_policy_label>${xml(p.return_policy_label)}</g:return_policy_label>`:'';
    const brand=p.brand?`<g:brand>${xml(p.brand)}</g:brand>`:'';
    const more=(p.additional_image_links||[]).map(url=>`<g:additional_image_link>${xml(url)}</g:additional_image_link>`).join('');
    return `<item><g:id>${xml(p.id)}</g:id><title>${xml(p.title)}</title><description>${xml(p.description)}</description><link>${xml(p.link)}</link><g:image_link>${xml(p.image_link)}</g:image_link>${more}<g:price>${(Number(p.price_cents)/100).toFixed(2)} CAD</g:price><g:availability>${xml(p.availability)}</g:availability><g:condition>${xml(p.condition)}</g:condition>${brand}<g:identifier_exists>${xml(p.identifier_exists)}</g:identifier_exists>${shipping}${returns}</item>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Devil n Dove — reviewed Canadian Product feed</title><link>${ORIGIN}/shop/</link><description>Reviewed active Devil n Dove Product listings eligible for Canadian merchant discovery.</description><g:target_country>${xml(config.target_country||'CA')}</g:target_country>${items}</channel></rss>`;
}
export function merchantTsv(coverage){
  const headers=['id','title','description','link','image_link','price','availability','condition','brand','identifier_exists'];
  const esc=(v)=>String(v??'').replace(/[\t\r\n]+/g,' ').trim();
  return [headers.join('\t'),...(coverage?.eligible||[]).map((p)=>[p.id,p.title,p.description,p.link,p.image_link,`${(Number(p.price_cents)/100).toFixed(2)} CAD`,p.availability,p.condition,p.brand,p.identifier_exists].map(esc).join('\t'))].join('\n');
}
