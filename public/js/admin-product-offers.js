// Build 220 — catalog controls for volume-price specials and component-reserved sets.
(() => {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (cents, currency='CAD') => { try { return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(Number(cents||0)/100); } catch { return `$${(Number(cents||0)/100).toFixed(2)}`; } };
  let currentProductId = 0;
  let state = null;

  function mount() {
    let node = document.getElementById('productOffersAdminMount');
    if (node) return node;
    const form = document.getElementById('createProductForm');
    if (!form) return null;
    node = document.createElement('section');
    node.id = 'productOffersAdminMount';
    node.className = 'card product-offers-admin';
    node.style.marginTop = '16px';
    form.parentNode?.insertBefore(node, form.nextSibling);
    return node;
  }
  function message(text='', error=false) {
    const el = document.getElementById('productOffersMessage');
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
    el.className = `small ${error ? 'is-error' : 'is-success'}`;
  }
  async function request(payload) {
    const response = await window.DDAuth.apiFetch('/api/admin/product-offers', { method:'POST', body:JSON.stringify(payload) });
    const data = await response.json().catch(()=>null);
    if (!response.ok || !data?.ok) throw new Error(data?.error || 'Product offer could not be saved.');
    return data;
  }
  async function load(productId) {
    currentProductId = Number(productId || 0);
    state = null;
    render();
    if (!currentProductId) return;
    try {
      const response = await window.DDAuth.apiFetch(`/api/admin/product-offers?product_id=${encodeURIComponent(currentProductId)}`);
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Product offers could not load.');
      state = data.detail || null;
      render();
    } catch (error) { message(error.message, true); }
  }
  function tierRow(row={}) {
    return `<div class="product-offer-tier-row" data-tier-row>
      <label><span class="small">Buy at least</span><input class="input" data-tier-min type="number" min="2" step="1" value="${Math.max(2,Number(row.min_quantity||2))}"/></label>
      <label><span class="small">Price per item (CAD)</span><input class="input" data-tier-price type="number" min="0.01" step="0.01" value="${(Number(row.unit_price_cents||0)/100).toFixed(2)}"/></label>
      <label><span class="small">Customer label</span><input class="input" data-tier-label maxlength="120" value="${esc(row.label||'')}" placeholder="3-pack saving"/></label>
      <button class="btn danger" type="button" data-remove-tier>Remove</button>
    </div>`;
  }
  function componentRow(row={}, options=[]) {
    const componentId = Number(row.component_product_id||0);
    const optionMarkup = options.map((p)=>`<option value="${p.product_id}" ${Number(p.product_id)===componentId?'selected':''}>${esc(p.name||`Product ${p.product_id}`)} · ${esc(p.sku||'no SKU')} · ${Number(p.inventory_quantity||0)} available</option>`).join('');
    return `<div class="product-offer-component-row" data-component-row>
      <label><span class="small">Component product</span><select class="input" data-component-id><option value="">Choose product</option>${optionMarkup}</select></label>
      <label><span class="small">Units in each set</span><input class="input" data-component-qty type="number" min="1" step="1" value="${Math.max(1,Number(row.quantity_per_bundle||1))}"/></label>
      <label><span class="small">Internal note</span><input class="input" data-component-note maxlength="500" value="${esc(row.notes||'')}"/></label>
      <button class="btn danger" type="button" data-remove-component>Remove</button>
    </div>`;
  }
  function render() {
    const node = mount(); if (!node) return;
    if (!currentProductId) {
      node.innerHTML = `<h3 style="margin-top:0">Special pricing & limited sets</h3><p class="small">Save or load a product first. Then add quantity price breaks or reserve component products for a limited set.</p>`;
      return;
    }
    if (!state) { node.innerHTML = `<h3 style="margin-top:0">Special pricing & limited sets</h3><p class="small">Loading offer controls…</p><div id="productOffersMessage" hidden></div>`; return; }
    const product = state.product || {};
    const tiers = state.quantity_tiers || [];
    const bundle = state.bundle || {is_bundle:0,components:[],settings:{}};
    const settings = bundle.settings || {};
    const shortage = settings.shortage_notes ? `<div class="product-offer-warning"><strong>Reservation warning:</strong> ${esc(settings.shortage_notes)}</div>` : '';
    const bundleStatus = bundle.is_bundle ? `${esc(settings.reservation_status||'draft')} · ${Number(bundle.available_quantity||0)} set(s) available` : 'Not configured as a set';
    node.innerHTML = `
      <div class="section-heading-row"><div><h3 style="margin:0">Special pricing & limited sets</h3><p class="small">Product ${esc(product.name||currentProductId)}. All prices are checked again by the checkout API. Set inventory is based on complete component reservations.</p></div><span class="status-pill">${esc(bundleStatus)}</span></div>
      <div class="product-offer-intro"><img src="/assets/product-set-pricing-placeholder.svg" alt="Volume pricing and limited product set workflow placeholder"/><p class="small">Use quantity specials for per-item savings. Use limited sets when one sellable product is made from finished component products that must be reserved.</p></div>
      <div id="productOffersMessage" class="small" hidden></div>
      <details open class="product-offer-section"><summary><strong>Quantity specials</strong> — for example, one soap at regular price and three at a lower per-bar price</summary>
        <p class="small">The regular product price applies until the first break. Each higher tier must be the same or lower per item.</p>
        <div id="productTierRows">${tiers.length ? tiers.map(tierRow).join('') : tierRow({min_quantity:3,unit_price_cents:Math.max(1,Math.round(Number(product.price_cents||0)*0.9)),label:'3 or more'})}</div>
        <div class="product-offer-actions"><button class="btn" type="button" id="addProductTier">Add price break</button><button class="btn primary" type="button" id="saveProductTiers">Save quantity specials</button><button class="btn" type="button" id="clearProductTiers">Remove all specials</button></div>
      </details>
      <details open class="product-offer-section"><summary><strong>Limited product set</strong> — reserve finished products as components</summary>
        <p class="small">Enter how many complete sets you want available. The system reserves only complete sets. If no complete set can be formed, this product’s storefront stock becomes zero.</p>
        ${shortage}
        <label class="product-offer-requested"><span class="small">Requested number of complete sets</span><input class="input" id="bundleRequestedQuantity" type="number" min="0" step="1" value="${Number(settings.requested_bundle_quantity||0)}"/></label>
        <div id="productBundleComponentRows">${(bundle.components||[]).length ? bundle.components.map((row)=>componentRow(row,state.product_options||[])).join('') : componentRow({},state.product_options||[])}</div>
        <div class="product-offer-actions"><button class="btn" type="button" id="addBundleComponent">Add component</button><button class="btn primary" type="button" id="saveProductBundle">Reserve and save set</button><button class="btn danger" type="button" id="releaseProductBundle">Release set reservations</button></div>
      </details>`;
    bind();
  }
  function collectTiers() {
    return Array.from(document.querySelectorAll('[data-tier-row]')).map((row)=>({
      min_quantity:Number(row.querySelector('[data-tier-min]')?.value||0),
      unit_price_cents:Math.round(Number(row.querySelector('[data-tier-price]')?.value||0)*100),
      label:String(row.querySelector('[data-tier-label]')?.value||'').trim()
    })).filter((row)=>row.min_quantity>=2&&row.unit_price_cents>0);
  }
  function collectComponents() {
    return Array.from(document.querySelectorAll('[data-component-row]')).map((row)=>({
      component_product_id:Number(row.querySelector('[data-component-id]')?.value||0),
      quantity_per_bundle:Number(row.querySelector('[data-component-qty]')?.value||1),
      notes:String(row.querySelector('[data-component-note]')?.value||'').trim()
    })).filter((row)=>row.component_product_id>0);
  }
  function bind() {
    document.querySelectorAll('[data-remove-tier]').forEach((btn)=>btn.onclick=()=>btn.closest('[data-tier-row]')?.remove());
    document.querySelectorAll('[data-remove-component]').forEach((btn)=>btn.onclick=()=>btn.closest('[data-component-row]')?.remove());
    document.getElementById('addProductTier')?.addEventListener('click',()=>{document.getElementById('productTierRows')?.insertAdjacentHTML('beforeend',tierRow({min_quantity:3,unit_price_cents:0}));bind();});
    document.getElementById('addBundleComponent')?.addEventListener('click',()=>{document.getElementById('productBundleComponentRows')?.insertAdjacentHTML('beforeend',componentRow({},state.product_options||[]));bind();});
    document.getElementById('saveProductTiers')?.addEventListener('click',async()=>{try{message('Saving quantity specials…');const data=await request({action:'save_quantity_tiers',product_id:currentProductId,tiers:collectTiers()});state=data.detail;render();message(data.message);}catch(error){message(error.message,true);}});
    document.getElementById('clearProductTiers')?.addEventListener('click',async()=>{if(!confirm('Remove every quantity special from this product?'))return;try{const data=await request({action:'save_quantity_tiers',product_id:currentProductId,tiers:[]});state=data.detail;render();message(data.message);}catch(error){message(error.message,true);}});
    document.getElementById('saveProductBundle')?.addEventListener('click',async()=>{try{message('Checking component stock and reserving complete sets…');const data=await request({action:'save_bundle',product_id:currentProductId,requested_bundle_quantity:Number(document.getElementById('bundleRequestedQuantity')?.value||0),components:collectComponents()});state=data.detail;render();message(data.message);document.dispatchEvent(new CustomEvent('dd:product-updated',{detail:{product_id:currentProductId}}));}catch(error){message(error.message,true);}});
    document.getElementById('releaseProductBundle')?.addEventListener('click',async()=>{if(!confirm('Release all component reservations for this set and set its availability to zero?'))return;try{const data=await request({action:'release_bundle',product_id:currentProductId,components:collectComponents()});state=data.detail;render();message(data.message);document.dispatchEvent(new CustomEvent('dd:product-updated',{detail:{product_id:currentProductId}}));}catch(error){message(error.message,true);}});
  }
  document.addEventListener('DOMContentLoaded',()=>{mount();render();});
  document.addEventListener('dd:product-editor-target',(event)=>load(Number(event?.detail?.product_id||event?.detail?.product?.product_id||0)));
  document.addEventListener('dd:product-editor-cleared',()=>load(0));
  document.addEventListener('dd:product-created',(event)=>load(Number(event?.detail?.product?.product_id||0)));
})();
