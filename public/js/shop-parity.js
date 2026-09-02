// Release 467 Build 15 — enrich visible Shop cards with approved buyer facts and proof-based internal links.
(async function initShopParity(){
  const run=async()=>{
    const parity=window.DDStorefrontParity;if(!parity)return;
    const escapeHtml=(value)=>String(value==null?'':value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
    try{
      const params=new URLSearchParams(window.location.search);params.delete('focus');
      const productResponse=await fetch(`/api/products${params.toString()?`?${params.toString()}`:''}`,{headers:{Accept:'application/json'}});const productData=await productResponse.json().catch(()=>null);const products=Array.isArray(productData?.products)?productData.products:[];if(!productResponse.ok||!products.length)return;
      const ids=products.map((product)=>Number(product.product_id||0)).filter(Boolean).slice(0,100);let factsData={products:{}};
      if(ids.length){const factsResponse=await fetch(`/api/product-buyer-facts?ids=${encodeURIComponent(ids.join(','))}`,{headers:{Accept:'application/json'}});const parsed=await factsResponse.json().catch(()=>null);if(factsResponse.ok&&parsed?.ok)factsData=parsed;}
      const bySlug=new Map(products.map((product)=>[String(product.slug||'').toLowerCase(),product]));
      const apply=()=>{document.querySelectorAll('.shop-product-card').forEach((card)=>{if(card.dataset.storefrontParity==='1')return;const view=card.querySelector('a[href^="/shop/product/?slug="]');if(!view)return;const href=new URL(view.href,window.location.origin),slug=String(href.searchParams.get('slug')||'').toLowerCase(),product=bySlug.get(slug);if(!product)return;const approved=factsData.products?.[Number(product.product_id||0)]||{},mergedProduct={...product,...(approved.product||{})},facts=parity.buyerFacts(mergedProduct,approved.listing_profile||{},approved.story_notes||{});const factPairs=[['Materials',facts.materials],['Finish',facts.finish_condition],['Size',facts.dimensions],['Availability',facts.availability]].filter(([,value])=>String(value||'').trim()).slice(0,4),links=parity.relationshipLinks(mergedProduct).slice(0,3),content=card.querySelector('.shop-card-content')||card,block=document.createElement('div');block.className='small shop-card-parity';block.setAttribute('data-storefront-parity-facts','1');block.style.marginTop='9px';block.innerHTML=`${factPairs.length?`<div><strong>Buyer facts:</strong> ${factPairs.map(([label,value])=>`${escapeHtml(label)}: ${escapeHtml(value)}`).join(' • ')}</div>`:'<div><strong>Buyer facts:</strong> Complete details are available on the product page.</div>'}${links.length?`<div style="margin-top:6px"><strong>Explore:</strong> ${links.map((link)=>`<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join(' • ')}</div>`:''}`;const actions=content.querySelector('.shop-card-actions');if(actions)content.insertBefore(block,actions);else content.appendChild(block);card.dataset.storefrontParity='1';});};
      apply();let attempts=0;const timer=setInterval(()=>{apply();attempts+=1;if(attempts>=8)clearInterval(timer);},250);
    }catch{}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else await run();
})();
