// Release 467 Build 182 — zero-read local Product facts & buyer-readiness panel.
// Reads only the already-loaded Product Editor form. It performs no network/D1/R2 request.
(()=>{
  'use strict';
  const form=document.getElementById('productEditorForm');
  const mount=document.getElementById('productBuyerReadinessLocal');
  const refresh=document.getElementById('productBuyerReadinessRefresh');
  if(!form||!mount)return;
  const field=(name)=>form.elements.namedItem(name);
  const get=(name)=>String(field(name)?.value??'').trim();
  const num=(name)=>Number(get(name)||0);
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function problem(severity,label,help,tab,focus){return {severity,label,help,tab,focus};}
  function evaluate(){
    const issues=[];
    const productType=(get('product_type')||'physical').toLowerCase();
    const origin=(get('merchandise_origin')||'handmade').toLowerCase();
    const saleChannel=(get('sale_channel')||'onsite').toLowerCase();
    const status=(get('status')||'draft').toLowerCase();
    const review=(get('review_status')||'pending_review').toLowerCase();
    const requiresShipping=get('requires_shipping')==='1';
    const tracking=get('inventory_tracking')==='1';
    if(!get('name'))issues.push(problem('blocker','Product name','Add a clear buyer-facing Product name.','basics','name'));
    if(!get('slug'))issues.push(problem('blocker','Product slug','Add a stable public Product slug.','basics','slug'));
    if(!get('sku'))issues.push(problem('attention','SKU','Add an internal SKU so the Product stays traceable.','basics','sku'));
    if(!get('product_category'))issues.push(problem('blocker','Category','Assign the correct Product category.','basics','product_category'));
    if(!['physical','digital'].includes(productType))issues.push(problem('blocker','Product type','Choose physical or digital.','basics','product_type'));
    if(get('short_description').length<40)issues.push(problem('attention','Short description','Write at least 40 useful characters.','description','short_description'));
    if(get('description').length<120)issues.push(problem('attention','Long description','Write at least 120 useful characters explaining what the buyer receives.','description','description'));
    if(num('price')<=0)issues.push(problem('blocker','Selling price','Set a positive selling price.','pricing','price'));
    if(!get('currency'))issues.push(problem('blocker','Currency','Set the selling currency.','pricing','currency'));
    if(num('compare_at_price')>0&&num('compare_at_price')<num('price'))issues.push(problem('attention','Compare-at price','Compare-at price is lower than the selling price.','pricing','compare_at_price'));
    if(productType==='physical'&&requiresShipping&&num('weight_grams')<=0)issues.push(problem('blocker','Shipping weight','Add a positive weight for a shippable physical Product.','pricing','weight_grams'));
    if(productType==='physical'&&requiresShipping&&!get('shipping_code'))issues.push(problem('blocker','Shipping code','Assign the shipping code used by fulfilment.','pricing','shipping_code'));
    if(productType==='digital'&&!get('digital_file_url'))issues.push(problem('blocker','Digital file','Add the digital-file URL before buyer delivery.','pricing','digital_file_url'));
    if(productType==='digital'&&requiresShipping)issues.push(problem('attention','Digital shipping setting','Digital Products normally should not require physical shipping.','pricing','requires_shipping'));
    if(['vintage','collectible','antique','oddity','prebuilt'].includes(origin)&&!get('condition_summary'))issues.push(problem('attention','Condition summary','Describe condition clearly for found/vintage inventory.','description','condition_summary'));
    if(['vintage','antique'].includes(origin)&&!get('era_label'))issues.push(problem('attention','Era / period','Add an era or period when known.','description','era_label'));
    if(['hybrid','external_only'].includes(saleChannel)&&!get('external_listing_url'))issues.push(problem('blocker','External listing URL','Hybrid/external-only sale channels require a working external URL.','description','external_listing_url'));
    if(tracking&&num('inventory_quantity')<=0)issues.push(problem('attention','Tracked finished stock','Finished-product tracking is enabled but quantity is zero.','pricing','inventory_quantity'));
    if(status==='active'&&!['approved','published'].includes(review))issues.push(problem('blocker','Review status','Active buyer-facing Products should be approved or published.','basics','review_status'));
    return issues;
  }
  function openFix(tab,focus){
    document.querySelector(`[data-editor-tab="${CSS.escape(tab)}"]`)?.click();
    const target=field(focus);
    if(target){target.focus();target.scrollIntoView({block:'center',behavior:'smooth'});}
  }
  function render(){
    const params=new URLSearchParams(location.search);
    const productId=Number(params.get('product_id')||0);
    const status=String(document.getElementById('productEditorStatus')?.textContent||'');
    if(productId>0&&!/authority loaded|saved\./i.test(status)){
      mount.innerHTML='<div class="status-note warning"><strong>Waiting for authoritative Product facts.</strong><div class="small">This panel never performs its own D1 read. After the Product Editor reports that authority is loaded, press Refresh buyer readiness.</div></div>';
      return;
    }
    const issues=evaluate();
    const blockers=issues.filter(x=>x.severity==='blocker').length;
    const attention=issues.filter(x=>x.severity==='attention').length;
    const total=18,penalty=Math.min(total,blockers*2+attention),score=Math.max(0,Math.round(((total-penalty)/total)*100));
    mount.innerHTML=`
      <div class="buyer-readiness-summary">
        <div class="card"><span class="small">Buyer readiness</span><strong>${score}%</strong><span class="small">${blockers?'blocking facts remain':'no blocking facts'}</span></div>
        <div class="card"><span class="small">Blockers</span><strong>${blockers}</strong><span class="small">must review before buyer-facing release</span></div>
        <div class="card"><span class="small">Attention</span><strong>${attention}</strong><span class="small">quality/completeness follow-up</span></div>
      </div>
      <div class="buyer-readiness-list">${issues.length?issues.map((item,index)=>`
        <article class="status-note ${item.severity==='blocker'?'warning':''}">
          <div><strong>${item.severity==='blocker'?'Blocker':'Attention'}: ${esc(item.label)}</strong><div class="small">${esc(item.help)}</div></div>
          <button class="btn" type="button" data-buyer-fix="${index}">Fix</button>
        </article>`).join(''):'<div class="status-note success"><strong>Buyer facts are complete for this local draft.</strong><div class="small">Image, Inventory/Tool/Supply, SEO, packaging and publication checks remain separate specialist reviews.</div></div>'}</div>`;
    mount.querySelectorAll('[data-buyer-fix]').forEach((button)=>button.addEventListener('click',()=>{
      const item=issues[Number(button.dataset.buyerFix||0)];if(item)openFix(item.tab,item.focus);
    }));
  }
  document.querySelector('[data-editor-tab="buyer"]')?.addEventListener('click',render);
  refresh?.addEventListener('click',render);
  form.addEventListener('input',()=>{if(!document.querySelector('[data-editor-panel="buyer"]')?.hidden)render();});
  form.addEventListener('change',()=>{if(!document.querySelector('[data-editor-panel="buyer"]')?.hidden)render();});
  if(!document.querySelector('[data-editor-panel="buyer"]')?.hidden)render();
})();