// Build 471: zero-read Product creation guidance. Authoritative saves and media reviews stay separate.
(()=>{'use strict';
 const $=id=>document.getElementById(id),root=$('productChannel471Mount'),status=$('dd471FlowStatus'),media=$('dd471MediaReview');
 if(!root||!status||!media)return;
 const savedId=Number(new URLSearchParams(location.search).get('product_id')||0);
 const etsy=$('productChannel405Etsy'),facebook=$('productChannel405Facebook'),consent=$('productChannel471Consent');
 function update(){
  const chosen=[...(etsy?.checked?['Etsy']:[]),...(facebook?.checked?['Facebook Marketplace']:[])];
  const destination=chosen.length?chosen.join(' + '):'No external channels';
  const waiting=chosen.length&&!consent?.checked;
  status.textContent=(savedId?'Saved Product #'+savedId:'New Product — not yet saved')+' • '+destination+
    (waiting?' • Confirm destination preferences before Save':etsy?.checked?' • Etsy draft requires the separate Review and send acknowledgement':facebook?.checked?' • Marketplace preparation only; posting remains manual':' • Devil n Dove source only')+
    ' • Nothing publishes automatically.';
  media.disabled=!savedId;
 }
 for(const el of [etsy,facebook,consent])el?.addEventListener('change',update);
 media.addEventListener('click',()=>{
  if(!savedId)return;
  const target=$('productDistribution406');
  target?.scrollIntoView({behavior:'smooth',block:'start'});
  $('productDistribution406Load')?.focus({preventScroll:true});
  status.textContent='Review the approved canonical gallery and Canada-only mapping below. Images transfer only after a separate provider-specific approval.';
 });
 update();
})();
