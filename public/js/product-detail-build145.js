// Release 467 Build 145 — Product Detail Trust, Story & Conversion.
// Read-only presentation enhancement. It consumes the existing rendered Product detail and adds no API authority.
(() => {
  'use strict';
  const BUILD=145;
  const text=id=>String(document.getElementById(id)?.textContent||'').replace(/\s+/g,' ').trim();
  const show=v=>v&&v!=='—'&&v!=='-';
  function facts(){
    const origin=text('productType')||'Devil n Dove listing';
    const inventory=text('productInventory');
    const shipping=text('productShipping');
    const quick=text('productQuickFacts');
    const trust=text('productTrustList');
    const policy=text('productPolicyList');
    const desc=text('productDescription');
    const one=/\b1\b|one available|only one/i.test(inventory);
    return [
      ['Origin & listing type',origin],
      ['Availability',one?'Only one appears available — live availability is confirmed before purchase.':inventory||'Live availability is confirmed before purchase.'],
      ['Materials / dimensions',quick||'See listing details and photography for scale, material and construction evidence.'],
      ['Fulfilment',shipping||policy||'Shipping or local-pickup eligibility is confirmed by the live checkout.'],
      ['Care & confidence',trust||(/care/i.test(desc)?'Care guidance is included in the listing description.':'Ask us about care, gifting or custom-work options before purchase.')]
    ].filter(([,v])=>show(v));
  }
  function mount(){
    if(location.pathname.replace(/\/+$/,'/')!=='/shop/product/'||document.getElementById('build145TrustPanel'))return;
    const detail=document.getElementById('productDetail');
    const purchase=document.getElementById('productPurchaseCard');
    const name=text('productName');
    if(!detail||detail.hidden||detail.style.display==='none'||!name)return;
    const panel=document.createElement('section');panel.id='build145TrustPanel';panel.className='card product-detail-card';panel.setAttribute('aria-labelledby','build145TrustHeading');
    panel.innerHTML=`<div class="product-detail-section-heading"><div><div class="eyebrow">BUYER CONFIDENCE</div><h2 id="build145TrustHeading">What to know before buying</h2><p class="small">A concise view of origin, scale, availability, fulfilment and care. Live price, stock and checkout eligibility remain server-authoritative.</p></div></div><div class="product-detail-facts">${facts().map(([k,v])=>`<div class="product-detail-fact"><strong>${k}</strong><span>${String(v).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</span></div>`).join('')}</div><p class="small" id="build145Connectivity" role="status" aria-live="polite"></p>`;
    (purchase||detail.firstElementChild)?.before?.(panel); syncConnectivity();
  }
  function syncConnectivity(){
    const status=document.getElementById('build145Connectivity'),btn=document.getElementById('addToCartButton');
    if(status)status.textContent=navigator.onLine?'Connected — availability will be revalidated before purchase.':'Disconnected — this Product page may be cached. Reconnect to confirm availability.';
    if(!btn)return;
    if(!navigator.onLine){if(!btn.disabled)btn.dataset.build145Disabled='1';btn.disabled=true;btn.setAttribute('aria-disabled','true');btn.title='Reconnect to confirm availability';}
    else if(btn.dataset.build145Disabled==='1'){btn.disabled=false;btn.removeAttribute('aria-disabled');btn.removeAttribute('title');delete btn.dataset.build145Disabled;}
  }
  function scan(){mount();syncConnectivity();}
  const observer=new MutationObserver(()=>scan());
  document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','hidden']});scan();},{once:true});
  addEventListener('online',syncConnectivity);addEventListener('offline',syncConnectivity);
  globalThis.DDProductDetailBuild145=Object.freeze({BUILD,scan});
})();
