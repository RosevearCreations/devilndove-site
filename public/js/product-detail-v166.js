// Release 467 Build 166 — lean, fail-fast public Product renderer.\n// Release 467 Build 179 successor: one fetched snapshot is shared with SEO/parity enhancers; no duplicate Product request.
// Release 467 Build 180 successor: start immediately from the body-end script so the Product read begins before optional storefront helpers.
// Uses the bounded Product core endpoint, converts legacy media references to same-origin R2 reads,
// and never retries automatically or leaves the browser waiting indefinitely.
(()=>{
  'use strict';
  const loading=document.getElementById('productLoading'),error=document.getElementById('productError'),detail=document.getElementById('productDetail');
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(cents,currency='CAD')=>{try{return new Intl.NumberFormat('en-CA',{style:'currency',currency:String(currency||'CAD')}).format(Number(cents||0)/100);}catch{return `$${(Number(cents||0)/100).toFixed(2)}`;}};
  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value??'';};
  const show=(el)=>{if(el)el.style.display='';},hide=(el)=>{if(el)el.style.display='none';};
  const placeholder='/assets/product-image-recovery-placeholder.svg';

  function publicMediaUrl(raw){
    const value=String(raw||'').trim();if(!value)return placeholder;
    try{
      const u=new URL(value,location.origin);
      if(u.pathname==='/api/product-media')return `${u.pathname}${u.search}`;
      if(u.pathname==='/media/product'){
        const key=String(u.searchParams.get('key')||'').trim();return key?`/api/product-media?key=${encodeURIComponent(key)}`:placeholder;
      }
      if(u.hostname==='assets.devilndove.com'||u.hostname.endsWith('.r2.dev')){
        const key=u.pathname.replace(/^\/+/, '');return key?`/api/product-media?key=${encodeURIComponent(key)}`:value;
      }
      return value;
    }catch{return placeholder;}
  }
  function imageTag(row,cls=''){
    const src=publicMediaUrl(row?.image_url||'');
    return `<img class="${cls}" src="${esc(src)}" alt="${esc(row?.alt_text||'Product image')}" loading="lazy" data-product-v166-image>`;
  }
  function armImages(){document.querySelectorAll('[data-product-v166-image]').forEach((img)=>{img.onerror=()=>{img.onerror=null;img.src=placeholder;};});}
  async function fetchJson(url,timeoutMs=8000){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{const response=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store',signal:controller.signal});const data=await response.json().catch(()=>null);if(!response.ok||!data?.ok)throw new Error(data?.error||`Request failed (${response.status}).`);return data;}
    catch(e){if(e?.name==='AbortError')throw new Error('Product details took too long to load. Please try again.');throw e;}
    finally{clearTimeout(timer);}
  }
  function render(product,rows){
    const images=[];const seen=new Set();
    const addImage=(row)=>{const raw=String(row?.image_url||row||'').trim();if(!raw)return;const key=raw.toLowerCase();if(seen.has(key))return;seen.add(key);images.push(typeof row==='string'?{image_url:row,alt_text:product.name||'Product image'}:row);};
    addImage({image_url:product.featured_image_url,alt_text:product.name||'Product image'});(Array.isArray(rows)?rows:[]).forEach(addImage);
    setText('pageH1',product.h1_override||product.name||'Product Details');
    setText('pageIntro',product.short_description||'View the full details for this Devil n Dove item.');
    setText('productBreadcrumbLabel',product.name||'Product');setText('productType',product.product_category||product.product_type||'');setText('productName',product.name||'Product');
    setText('productPrice',money(product.price_cents,product.currency));setText('productShortDescription',product.short_description||'');setText('productSku',product.sku||'—');
    setText('productShipping',Number(product.requires_shipping||0)===1?'Yes':'No');setText('productTaxClass',product.tax_class_name||product.tax_class_code||'Standard');
    setText('productInventory',Number(product.inventory_tracking||0)===1?String(Number(product.inventory_quantity||product.on_hand_quantity||0)):'Not tracked');
    const desc=document.getElementById('productDescription');if(desc)desc.innerHTML=esc(product.description||product.short_description||'').replace(/\n/g,'<br>');
    const main=document.getElementById('productMainImageWrap');if(main)main.innerHTML=images.length?`<div class="product-detail-main-image">${imageTag(images[0])}</div>`:'<div class="product-detail-main-image product-detail-no-image"><span class="small">No image available</span></div>';
    const gallery=document.getElementById('productGallery');if(gallery)gallery.innerHTML=images.length>1?`<div class="product-detail-thumbs">${images.map((row,i)=>`<button type="button" class="product-detail-thumb${i===0?' is-active':''}" data-v166-src="${esc(publicMediaUrl(row.image_url))}" data-v166-alt="${esc(row.alt_text||product.name||'Product image')}">${imageTag(row)}</button>`).join('')}</div>`:'';
    gallery?.querySelectorAll('[data-v166-src]').forEach((button)=>button.addEventListener('click',()=>{const img=main?.querySelector('img');if(img){img.src=button.dataset.v166Src||placeholder;img.alt=button.dataset.v166Alt||'Product image';}gallery.querySelectorAll('.product-detail-thumb').forEach((b)=>b.classList.remove('is-active'));button.classList.add('is-active');}));
    armImages();
    document.title=`${product.meta_title||product.name||'Product'} — Devil n Dove`;
    const description=product.meta_description||product.short_description||'View product details from Devil n Dove.';document.querySelector('meta[name="description"]')?.setAttribute('content',description);
    const canonical=product.canonical_url||location.href;document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical);
    const optional=['productQuickFactsCard','productVideoCard','productPublicStoryCard','productStoryCard','productReviewsCard','productCandleSoapSafetyCard','productRelatedProofCard'];optional.forEach((id)=>hide(document.getElementById(id)));
    const trust=document.getElementById('productTrustSummary');if(trust)trust.textContent='This Product page now loads from a bounded Product record and existing gallery references so shopping remains responsive.';
    show(detail);
    window.DDProductDetailSnapshot=Object.freeze({product,images});
    try{document.dispatchEvent(new CustomEvent('dd:product-detail-rendered',{detail:window.DDProductDetailSnapshot}));}catch{}
    const addButton=document.getElementById('addToCartButton');addButton?.addEventListener('click',()=>{const message=document.getElementById('addToCartMessage');try{if(!window.DDCart)throw new Error('Cart is not available right now.');const qty=Math.max(1,Number(document.getElementById('productQuantity')?.value||1));window.DDCart.addToCart(product,qty);if(message){message.textContent='Added to cart successfully.';message.style.display='block';}}catch(e){if(message){message.textContent=e.message||'Could not add to cart.';message.style.display='block';}}});
  }
  (async()=>{
    hide(error);hide(detail);show(loading);
    try{const slug=String(new URL(location.href).searchParams.get('slug')||'').trim();if(!slug)throw new Error('No product slug was provided.');const data=await fetchJson(`/api/product-detail-core?slug=${encodeURIComponent(slug)}`,8000);render(data.product||{},data.images||[]);}
    catch(e){if(error){error.textContent=e.message||'Failed to load product.';show(error);}}
    finally{hide(loading);}
  })();
})();
