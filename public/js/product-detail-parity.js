// Release 467 Build 15 — visible Product facts, schema, relationships, and shipping policy parity.
(async function initProductParity(){
  const run = async () => {
    const parity = window.DDStorefrontParity;
    if (!parity) return;
    const slug = String(new URL(window.location.href).searchParams.get('slug') || '').trim();
    if (!slug) return;
    const escapeHtml = (value) => String(value == null ? '' : value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
    try {
      const response = await fetch(`/api/product-detail?slug=${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok || !data.product) return;
      const product = data.product;
      const facts = parity.buyerFacts(product, data.listing_profile || {}, data.story_notes || {});
      const factRows = [['Best for',facts.best_for],['Materials',facts.materials],['Process',facts.process],['Finish / condition',facts.finish_condition],['Size / dimensions',facts.dimensions],['Care',facts.care],['Personalization limits',facts.personalization_limits],['Availability',facts.availability],['Shipping / pickup',facts.shipping_pickup],['Handmade note',facts.handmade_limitations]].filter(([,value])=>String(value||'').trim());
      const quickCard=document.getElementById('productQuickFactsCard'),quickFacts=document.getElementById('productQuickFacts');
      if(quickCard&&quickFacts&&factRows.length){quickFacts.innerHTML=factRows.map(([label,value])=>`<div class="product-quick-fact"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('');quickCard.style.display='';quickCard.setAttribute('data-storefront-parity','buyer-facts');}
      const canonical=parity.canonicalFor(product,window.location.href);const images=Array.isArray(data.storefront_images)&&data.storefront_images.length?data.storefront_images:(data.images||[]);
      let schema=document.getElementById('productStructuredData');if(!schema){schema=document.createElement('script');schema.type='application/ld+json';schema.id='productStructuredData';document.head.appendChild(schema);}schema.textContent=JSON.stringify(parity.productSchema({product,facts,images,canonical}));schema.setAttribute('data-storefront-parity','visible-facts');
      const canonicalEl=document.querySelector('link[rel="canonical"]');if(canonicalEl)canonicalEl.href=canonical;const ogUrl=document.querySelector('meta[property="og:url"]');if(ogUrl)ogUrl.content=canonical;
      const relationLinks=parity.relationshipLinks(product),relationHost=document.getElementById('productRelatedProofCard')||document.getElementById('productProcessCard');if(relationHost&&relationLinks.length){let block=document.getElementById('productRelationshipParity');if(!block){block=document.createElement('div');block.id='productRelationshipParity';block.className='small';block.style.marginTop='12px';relationHost.appendChild(block);}block.innerHTML=`<strong>Explore related shop paths:</strong> <span style="display:inline-flex;gap:7px;flex-wrap:wrap;margin-left:6px">${relationLinks.map((link)=>`<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</span>`;relationHost.style.display='';}
      const policyList=document.getElementById('productPolicyList');if(policyList&&Number(product.requires_shipping||0)===1&&!policyList.querySelector('[data-ca-shipping-policy]')){const li=document.createElement('li');li.dataset.caShippingPolicy='1';li.textContent=parity.SHIPPING_POLICY.public_message;policyList.prepend(li);}
    } catch {}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else await run();
})();
