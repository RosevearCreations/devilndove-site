// Release 465 Build 1 — reviewed SEO overrides, dynamic Product merchant markup, and Shop search-quality loader.
// Release 467 Build 15 preserves that authority and adds shared visible-fact/schema/fulfillment parity.
(function(){
  'use strict';
  const text=(v)=>String(v==null?'':v).trim();
  const esc=(v)=>text(v).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function meta(selector,attrs){let el=document.head.querySelector(selector);if(!el){el=document.createElement('meta');document.head.appendChild(el);}Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
  function description(value){if(value)meta('meta[name="description"]',{name:'description',content:value});}
  function canonical(url){let el=document.head.querySelector('link[rel="canonical"]');if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el);}el.href=url;}
  function property(name,value){if(value)meta(`meta[property="${name}"]`,{property:name,content:value});}
  function twitter(name,value){if(value)meta(`meta[name="${name}"]`,{name,content:value});}
  function insertInternalLinkNote(note){if(!note||document.getElementById('seoPageOverrideNote'))return;const container=document.querySelector('.container')||document.body,footer=container?.querySelector('footer.footer,.footer');if(!container||!footer)return;const section=document.createElement('section');section.id='seoPageOverrideNote';section.className='card seo-page-override-note';section.style.marginTop='18px';section.innerHTML=`<h2 style="margin-top:0">Helpful links and browsing notes</h2><p class="small">${esc(note)}</p>`;container.insertBefore(section,footer);}
  function findStaticOverride(data){const path=location.pathname.endsWith('/')?location.pathname:`${location.pathname}/`;return (Array.isArray(data?.overrides)?data.overrides:[]).find((row)=>{const rp=text(row.path||row.page_path),normalized=rp.endsWith('/')?rp:`${rp}/`,status=text(row.status||row.review_status||'approved').toLowerCase();return normalized===path&&['approved','applied','published'].includes(status);})||null;}
  function applyOverride(o){if(!o)return false;const title=o.title||o.approved_title||'',desc=o.meta_description||o.approved_meta_description||'',note=o.internal_link_note||o.approved_internal_link_note||'';if(title)document.title=title;if(desc)description(desc);if(note)insertInternalLinkNote(note);return Boolean(title||desc||note);}
  function setJsonLd(id,value){let el=document.getElementById(id);if(!el){el=document.createElement('script');el.type='application/ld+json';el.id=id;document.head.appendChild(el);}el.textContent=JSON.stringify(value);return el;}
  function productDescription(p){return text(p.seo_description||p.meta_description||p.short_description||p.description||`${p.name||'Handcrafted product'} from Devil n Dove.`).replace(/\s+/g,' ').slice(0,300);}
  function loadScript(src,id){return new Promise((resolve)=>{if(id&&document.getElementById(id)){resolve();return;}const s=document.createElement('script');s.src=src;if(id)s.id=id;s.onload=()=>resolve();s.onerror=()=>resolve();document.head.appendChild(s);});}
  function loadShopSearchQuality(){if(location.pathname!=='/shop/'&&!location.pathname.endsWith('/shop/index.html'))return;if(document.querySelector('script[data-release465-search-quality]'))return;const script=document.createElement('script');script.src='/public/js/storefront-search-quality.js?v=465';script.dataset.release465SearchQuality='true';script.defer=true;document.head.appendChild(script);}
  async function loadBuild15Parity(){
    await loadScript('/public/js/storefront-parity.js?v=467b15','release467Build15StorefrontParity');
    const path=location.pathname;
    if(path==='/shop/'||path.endsWith('/shop/index.html')) await loadScript('/public/js/shop-parity.js?v=467b15','release467Build15ShopParity');
    if(path==='/shop/product/'||path.endsWith('/shop/product/index.html')) await loadScript('/public/js/product-detail-parity.js?v=467b15','release467Build15ProductParity');
    if(path.startsWith('/shop/')||path.startsWith('/cart/')||path.startsWith('/checkout/')) await loadScript('/public/js/storefront-shipping-policy.js?v=467b15','release467Build15ShippingPolicy');
  }
  async function productSeo(){
    if(location.pathname!=='/shop/product/'&&!location.pathname.endsWith('/shop/product/index.html'))return;
    const slug=text(new URL(location.href).searchParams.get('slug'));if(!slug)return;
    const response=await fetch(`/api/product-detail?slug=${encodeURIComponent(slug)}`,{headers:{Accept:'application/json'},cache:'no-store'});const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok||!data.product)return;
    const p=data.product,parity=window.DDStorefrontParity,canonicalUrl=parity?.canonicalFor?.(p,location.href)||`https://devilndove.com/shop/product/?slug=${encodeURIComponent(p.slug||slug)}`,desc=productDescription(p);const image=text(p.featured_image_url||(data.storefront_images||data.images||[])[0]?.image_url||(data.images||[])[0]?.url);
    document.title=text(p.meta_title||p.seo_title)||`${text(p.name)} — Devil n Dove`;description(desc);canonical(canonicalUrl);property('og:type','product');property('og:title',document.title);property('og:description',desc);property('og:url',canonicalUrl);if(image)property('og:image',image);twitter('twitter:card','summary_large_image');twitter('twitter:title',document.title);twitter('twitter:description',desc);if(image)twitter('twitter:image',image);
    if(parity){
      const facts=parity.buyerFacts(p,data.listing_profile||{},data.story_notes||{});const images=(data.storefront_images||data.images||[]);const graph=parity.productSchema({product:p,facts,images,canonical:canonicalUrl});
      setJsonLd('update3ProductJsonLd',graph).setAttribute('data-storefront-parity','visible-facts');
      const oldBreadcrumb=document.getElementById('update3ProductBreadcrumbJsonLd');if(oldBreadcrumb)oldBreadcrumb.remove();
    } else {
      const offer={'@type':'Offer',url:canonicalUrl,priceCurrency:text(p.currency)||'CAD',price:(Number(p.price_cents||0)/100).toFixed(2),availability:Number(p.inventory_tracking||0)===1&&Number(p.inventory_quantity||0)<=0?'https://schema.org/OutOfStock':'https://schema.org/InStock'};
      const product={'@context':'https://schema.org','@type':'Product',name:text(p.name),description:desc,sku:text(p.sku)||undefined,image:image?[image]:undefined,category:text(p.product_category)||undefined,offers:offer};setJsonLd('update3ProductJsonLd',product);
      setJsonLd('update3ProductBreadcrumbJsonLd',{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:'https://devilndove.com/'},{'@type':'ListItem',position:2,name:'Shop',item:'https://devilndove.com/shop/'},{'@type':'ListItem',position:3,name:text(p.name),item:canonicalUrl}]});
    }
    try{const merch=await fetch('/api/storefront-merchandising',{headers:{Accept:'application/json'}}).then((r)=>r.ok?r.json():null);const collections=(merch?.collections||[]).filter((c)=>(c.products||[]).some((x)=>Number(x.product_id)===Number(p.product_id)));if(collections.length&&!document.getElementById('update3ProductCollections')){const target=document.getElementById('productRelatedProofCard')||document.getElementById('productRelated')||document.querySelector('.footer');if(target){const box=document.createElement('section');box.id='update3ProductCollections';box.className='card';box.style.marginTop='18px';box.innerHTML=`<h2 style="margin-top:0">Shop related collections</h2><p class="small">Continue browsing curated Devil n Dove collections connected to this item.</p><div class="dd-admin-responsive-actions">${collections.slice(0,6).map((c)=>`<a class="btn" href="/collections/?collection=${encodeURIComponent(c.slug)}">${esc(c.name)}</a>`).join('')}</div>`;target.parentNode?.insertBefore(box,target);}}}catch(_e){}
  }
  document.addEventListener('DOMContentLoaded',async()=>{loadShopSearchQuality();await loadBuild15Parity();try{const r=await fetch(`/api/seo-page-overrides?path=${encodeURIComponent(location.pathname)}`,{headers:{Accept:'application/json'}}),d=await r.json().catch(()=>null);if(r.ok&&d?.ok)applyOverride(d.override||null);}catch(_e){try{const f=await fetch('/data/site/seo-page-overrides.json',{cache:'no-store'}).then((r)=>r.ok?r.json():null);applyOverride(findStaticOverride(f));}catch(_ignore){}}productSeo().catch(()=>{});});
})();
