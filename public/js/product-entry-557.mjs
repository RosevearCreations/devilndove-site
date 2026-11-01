/* Build 557 — canonical Product Entry 2.0 owner surface.
 * Keep existing proven save and provider handlers; never synthesize an Etsy POST.
 * Old support DOM remains behind explicit advanced disclosures. */
import {renderUnifiedDestinations559} from './product-destinations-559.mjs';
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
    renderUnifiedDestinations559({form,productId:id,caption:manualCaption557});
  }

  if(form){
    for(const [area,panel] of [['dd557DetailsArea','basics'],['dd557RecipeArea','ingredients'],['dd557PhotosArea','media'],['dd557DestinationArea','publishing']]){
      const section=document.querySelector(`[data-editor-panel="${panel}"]`);if(section)section.id=area;
    }
    organizeFields();simplifyPhotos();destinations();
    const deepFocus=new URLSearchParams(location.search).get('focus');
    if(deepFocus){const target=form.elements.namedItem(deepFocus);if(target?.closest('details'))target.closest('details').open=true;}
    const tabs=[...document.querySelectorAll('.dd557-steps [data-editor-tab]')];
    for(const tab of tabs)tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;
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
        button.tabIndex=selected?0:-1;
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
