/* Build 557 — canonical Product Entry 2.0 owner surface.
 * Keep existing proven save and provider handlers; never synthesize an Etsy POST.
 * Old support DOM remains behind explicit advanced disclosures. */
export function manualCaption557({name='',price='',description='',keywords=''}={}){
  const title=String(name||'').trim();
  if(!title)throw new Error('Add a Product name before preparing a handoff.');
  const money=String(price||'').trim();
  if(!/^\d+(?:\.\d{1,2})?$/.test(money))throw new Error('Enter a valid CAD price before preparing a handoff.');
  const text=String(description||'').trim();
  if(!text)throw new Error('Add a truthful Product description before preparing a handoff.');
  const tags=String(keywords||'').split(',').map(x=>x.trim()).filter(Boolean);
  return [title,`CAD $${Number(money).toFixed(2)}`,text,tags.length?`Search terms: ${tags.join(', ')}`:''].filter(Boolean).join('\n\n');
}

if(typeof document!=='undefined'){
  const byId=id=>document.getElementById(id);
  const form=byId('productEditorForm');
  const id=Number(new URLSearchParams(location.search).get('product_id')||0);
  const mainTabs=['details','ingredients','media','publishing'];
  const guide={
    details:'Enter Product details, CAD price, description and search tags. Additional fields are available under More fields.',
    ingredients:'For soap, select the real base, fragrance and additional oil. Check the actual formula and bar weight before saving.',
    media:'One shared original gallery. Review each photo, its alt description and public-use permission before choosing a destination.',
    publishing:'Saving this Product does not send anything elsewhere. Link the exact Etsy draft before any photo transfer or draft update.'
  };

  function organizeFields(){
    const visible={
      basics:new Set(['name','sku','product_category','product_type','status']),
      pricing:new Set(['price','inventory_quantity']),
      description:new Set(['short_description','description']),
      seo:new Set(['keywords'])
    };
    for(const [panelName,primary] of Object.entries(visible)){
      const panel=document.querySelector(`[data-editor-panel="${panelName}"]`);
      const grid=panel?.querySelector(':scope > .dd-editor-grid');
      if(!grid)continue;
      const extra=[...grid.children].filter(node=>node.matches('label')&&!primary.has(node.querySelector('[name]')?.name||''));
      if(!extra.length)continue;
      const disclosure=document.createElement('details');disclosure.className='dd557-extra-fields';
      const summary=document.createElement('summary');summary.textContent=panelName==='pricing'?'More price, tax and shipping fields':panelName==='seo'?'More search and preview settings':panelName==='description'?'More item information':'More Product fields';
      const inner=document.createElement('div');inner.className='dd-editor-grid cols-2';
      for(const node of extra)inner.append(node);
      disclosure.append(summary,inner);panel.append(disclosure);
    }
    const shipping=form.elements.namedItem('weight_grams')?.closest('label');
    const label=shipping?.querySelector('span.small');
    if(label)label.textContent='Packed parcel weight (grams) — not soap bar net weight';
  }

  function simplifyPhotos(){
    const panel=document.querySelector('[data-editor-panel="media"]');
    const distribution=byId('productDistribution406');
    if(!panel||!distribution)return;
    const note=document.createElement('p');note.className='dd557-photos-note';
    note.textContent='These are the same Product originals used by our store and in destination reviews. A photo is not on Etsy until that actual Etsy draft confirms its image ID.';
    panel.insertBefore(note,panel.firstElementChild?.nextSibling||null);
    const advanced=document.createElement('details');advanced.className='dd557-photos-settings';
    const summary=document.createElement('summary');summary.textContent='Photo destination mapping and shipping confirmations';
    advanced.append(summary);
    for(const node of [...distribution.children]){
      if(node.matches('label')||node.querySelector?.('#productDistribution406Save'))advanced.append(node);
    }
    distribution.append(advanced);
    const feature=panel.querySelector('.dd-editor-grid.cols-2');
    if(feature){const extras=document.createElement('details');extras.className='dd557-photos-settings';
      const caption=document.createElement('summary');caption.textContent='Featured image URL and preview (optional)';extras.append(caption,feature);panel.append(extras);}
  }

  function destinations(){
    const panel=document.querySelector('[data-editor-panel="publishing"]');
    if(!panel)return;
    const section=document.createElement('section');section.className='dd557-destinations';section.setAttribute('aria-labelledby','dd557DestinationsTitle');
    section.innerHTML=`
      <h3 id="dd557DestinationsTitle">Other places we can share this Product</h3>
      <p class="small">Each destination is independent. A Product Save does not create a social post or marketplace listing.</p>
      <article class="dd557-destination" aria-label="Etsy draft text update">
        <div><strong>Etsy — saved draft details</strong><span class="dd557-state" id="dd557EtsyState">Verify existing draft first</span></div>
        <p>After our Product is saved and the exact existing Etsy draft is confirmed, we can separately request an unpublished listing update. Photos have their own approval above.</p>
        <div class="dd-product-actions"><button class="btn primary" type="button" id="dd557UpdateEtsy" disabled>Update verified existing Etsy draft</button><button class="btn" type="button" id="dd557CreateEtsy">New Etsy draft? Open advanced checks</button></div>
        <p class="small" id="dd557EtsyActionStatus" role="status" aria-live="polite">No update requested.</p>
      </article>
      <article class="dd557-destination" aria-label="Facebook Marketplace manual handoff">
        <div><strong>Facebook Marketplace</strong><span class="dd557-state">Manual handoff</span></div>
        <p>Copy saved Product details and take the approved original photos to Marketplace ourselves. Automatic Marketplace posting is not connected.</p>
        <div class="dd-product-actions"><button class="btn" type="button" data-dd557-copy="marketplace">Prepare Marketplace text</button><a class="btn" href="https://www.facebook.com/marketplace/create/item" target="_blank" rel="noopener noreferrer">Open Marketplace</a></div>
      </article>
      <details class="dd557-destination" id="dd557SocialDestinations"><summary><strong>Instagram, TikTok, X, Pinterest and others</strong> — manual sharing</summary>
        <p>No approved automatic posting connection is assumed. Prepare an accurate caption from the saved Product and share manually on the chosen platform after reviewing its rules, photos and audience.</p>
        <div class="dd-product-actions"><button class="btn" type="button" data-dd557-copy="social">Prepare social caption</button>
          <a class="btn" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a class="btn" href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer">TikTok</a>
          <a class="btn" href="https://x.com/" target="_blank" rel="noopener noreferrer">X</a>
          <a class="btn" href="https://www.pinterest.com/" target="_blank" rel="noopener noreferrer">Pinterest</a>
        </div>
      </details>
      <div id="dd557Handoff" hidden><label for="dd557Caption">Prepared copy (review before using anywhere)</label><textarea id="dd557Caption" class="input" rows="5" readonly></textarea></div>
      <p id="dd557HandoffStatus" class="small" role="status" aria-live="polite">Prepare a handoff only after our Product is saved. No provider posting occurs here.</p>`;
    panel.append(section);
    const update=byId('dd557UpdateEtsy');
    const create=byId('dd557CreateEtsy');
    const state=byId('dd557EtsyState');
    const actionStatus=byId('dd557EtsyActionStatus');
    const ready=()=>id>0&&form.dataset.productAuthority==='ready'&&form.dataset.productDirty!=='1';
    function refreshEtsy(){
      const confirmed=/connected and confirmed by saved receipt|connected to existing Etsy draft/i.test(byId('dd544ConnectStatus')?.textContent||'');
      state.textContent=confirmed?'Existing draft verified':'Verify existing draft first';
      update.disabled=!ready()||!confirmed;
      if(create)create.hidden=id===54||confirmed;
    }
    update.addEventListener('click',()=>{
      refreshEtsy();if(update.disabled)return;
      const existing=byId('dd540UpdateDraft');
      if(!existing){actionStatus.textContent='Draft update is unavailable. No Etsy changes were made.';return;}
      actionStatus.textContent='Checking the saved draft update requirements. The existing Etsy workflow will request separate confirmation.';
      existing.click();
    });
    create.addEventListener('click',()=>{
      if(id===54){actionStatus.textContent='Sweet Orange already has a reported draft. Verify that exact ID; do not create another.';return;}
      document.querySelector('[data-editor-tab="etsy"]')?.click();
      actionStatus.textContent='Advanced Etsy has the new-draft review. A new draft requires explicit approval and no existing listing claim.';
    });
    const connection=byId('dd544ConnectStatus');
    if(connection)new MutationObserver(refreshEtsy).observe(connection,{subtree:true,childList:true,characterData:true});
    form.addEventListener('input',refreshEtsy);form.addEventListener('change',refreshEtsy);
    document.addEventListener('dd:product-loaded',refreshEtsy);
    document.addEventListener('dd:save-succeeded',refreshEtsy);
    document.addEventListener('dd:etsy-existing-draft-linked',refreshEtsy);
    refreshEtsy();
    for(const button of section.querySelectorAll('[data-dd557-copy]'))button.addEventListener('click',async()=>{
      const output=byId('dd557HandoffStatus');
      if(!ready()){
        output.textContent='Save Product first and wait for the confirmed saved version. Nothing was sent to any external service.';return;
      }
      try{
        const fields=name=>String(form.elements.namedItem(name)?.value||'');
        const copy=manualCaption557({name:fields('name'),price:fields('price'),description:fields('description')||fields('short_description'),keywords:fields('keywords')});
        const display=byId('dd557Caption');display.value=copy;byId('dd557Handoff').hidden=false;
        if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(copy);output.textContent='Prepared and copied. Review the caption and upload approved photos manually in the destination. Nothing was posted.';}
        else{display.focus();display.select();output.textContent='Prepared below. Select and copy the text manually. Nothing was posted.';}
      }catch(error){output.textContent=String(error?.message||'Clipboard unavailable. Select and copy the prepared text below.');}
    });
  }

  if(form){
    for(const [area,panel] of [['dd557DetailsArea','basics'],['dd557RecipeArea','ingredients'],['dd557PhotosArea','media'],['dd557DestinationArea','publishing']]){
      const section=document.querySelector(`[data-editor-panel="${panel}"]`);if(section)section.id=area;
    }
    organizeFields();simplifyPhotos();destinations();
    const deepFocus=new URLSearchParams(location.search).get('focus');
    if(deepFocus){const target=form.elements.namedItem(deepFocus);if(target?.closest('details'))target.closest('details').open=true;}
    const tabs=[...document.querySelectorAll('.dd557-steps [data-editor-tab]')];
    for(const tab of tabs)tab.addEventListener('keydown',event=>{
      const current=tabs.indexOf(tab);
      const destination=event.key==='ArrowRight'?(current+1)%tabs.length:
        event.key==='ArrowLeft'?(current+tabs.length-1)%tabs.length:
        event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
      if(destination<0)return;
      event.preventDefault();tabs[destination].click();tabs[destination].focus();
    });
    const guideLabel=byId('dd557PanelGuide');
    document.addEventListener('dd:editor-tab-opened',event=>{
      const current=event.detail?.tab;
      if(guideLabel)guideLabel.textContent=guide[current]||'These advanced checks are optional and do not automatically send or publish any listing.';
      for(const button of document.querySelectorAll('.dd557-steps [data-editor-tab]')){
        const selected=button.dataset.editorTab===current;
        button.setAttribute('aria-selected',selected?'true':'false');
      }
    });
    const note=byId('dd557NotSoap')||document.createElement('p');
    if(!note.id){note.id='dd557NotSoap';note.textContent='This Product is not marked as soap. Its normal details and photos can be saved without a soap formula. Recipe tools remain available for actual soap Products.';document.querySelector('[data-editor-panel="ingredients"]')?.prepend(note);}
    const showRecipe=()=>{note.hidden=!byId('dd540SoapComposer')?.hidden;};
    document.addEventListener('dd:product-loaded',showRecipe);
    document.addEventListener('dd:editor-tab-opened',showRecipe);
    showRecipe();
  }
}
