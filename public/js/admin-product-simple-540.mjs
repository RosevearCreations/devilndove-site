/* Finished-product entry. Historical diagnostic DOM stays mounted for existing
 * handlers but only this simple surface is shown to the owner. */
import {composeSoapFormula540,SOAP_ROLES_540,scentNameConflict541,assessOwnerRecipePhotos542} from './soap-formula-540.mjs';
const byId=id=>document.getElementById(id);
const productId=Number(new URLSearchParams(location.search).get('product_id')||0);
const form=byId('productEditorForm'),save=byId('dd540SaveProduct'),toolbar=byId('dd540ToolbarStatus');
let isSoap=productId===54||/\bsoap\b/i.test(String(form?.elements.namedItem('name')?.value||''));
const recipeStatus=byId('dd540RecipeStatus');
const ownerReceipt=byId('dd558OwnerReceipt');
const recipeRoot=byId('dd540SoapComposer');
const preview=byId('dd540InciPreview'),weightInput=byId('dd540NetWeight'),verified=byId('dd540Verified');
const pickers={base:byId('dd540Base'),scent:byId('dd540Scent'),oil:byId('dd540Oil')};
let library=[],loaded=false,loading=false,formula=null,saveBusy=false;
const orangeSuggestion=byId('dd543OrangeSuggestion');
const say=(message,issue=false)=>{if(recipeStatus){recipeStatus.textContent=message;recipeStatus.dataset.tone=issue?'hold':'ok';}};
const api=async(path,method='GET',payload)=>{
  if(!window.DDAuth?.apiFetch)throw Error('Sign in as an authorized administrator first.');
  const response=await window.DDAuth.apiFetch(path,{method,cache:'no-store',...(payload?{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})});
  const data=await window.DDAuth.readApiJson(response,{fallbackMessage:'Could not read the saved Product.'});
  if(!response.ok||!data?.ok)throw Error(data?.error||`HTTP ${response.status}`);
  return data;
};
function choices(){return Object.fromEntries(Object.entries(pickers).map(([key,el])=>[key,Number(el?.value||0)]));}
function renderRecipe({changed=false}={}){
  if(!loaded)return;
  formula=composeSoapFormula540(library,choices());
  if(changed&&verified)verified.checked=false;
  if(preview)preview.value=formula.ready?formula.inci_text:'';
  const summary=formula.ready?`${formula.selected.length} selected materials · ${formula.ingredients.length} genuine INCI ingredients. Review their actual order and the measured net weight below before saving.`:
    formula.blockers.join(' ');
  const warnings=formula.warnings.length?` ${formula.warnings.join(' ')}`:'';
  const selectedScent=library.find(row=>String(row.packaging_source_material_template_id)===String(pickers.scent?.value||''));
  const conflict=scentNameConflict541(form?.elements.namedItem('name')?.value,selectedScent?.material_name);
  if(conflict&&verified)verified.checked=false;
  if((changed||conflict)&&ownerReceipt){ownerReceipt.textContent=conflict?
    'Owner acceptance HOLD — saved fragrance conflicts with Sweet Orange. Check the actual batch before saving a corrected official formula.':
    'Recipe edited locally. Owner acceptance will be recorded only after we verify the physical batch, check the box and Save Product.';
    ownerReceipt.dataset.ready='false';}
  const orange=library.filter(row=>SOAP_ROLES_540.scent.includes(String(row.material_subtype||row.material_type))&&/\borange\b/i.test(String(row.material_name||'')));
  if(orangeSuggestion){orangeSuggestion.hidden=!conflict||orange.length!==1;orangeSuggestion.dataset.sourceId=orange.length===1?String(orange[0].packaging_source_material_template_id):'';}
  say(conflict?'The saved Sea Breeze scent does not match Sweet Orange. We can still Save Product. Choose the real Orange fragrance if that is what we used; the official recipe stays unchanged until confirmed.':summary+warnings,!formula.ready||conflict);
  if(recipeRoot)recipeRoot.dataset.scentConflict=conflict?'1':'0';
}
async function loadSoap(){
  if(loaded||loading||!isSoap)return;
  loading=true;say('Loading the original saved base, scent and oil library…');
  try{
    const record=await api(`/api/admin/product-soap-formula-540?product_id=${productId}`);
    if(record.ambiguous_projects)throw Error('We found multiple official soap-label records. Nothing was overwritten; open Packaging Studio to choose the correct one.');
    library=Array.isArray(record.source_materials)?record.source_materials:[];
    const attached=new Map((record.saved_materials||[]).map(row=>[String(row.material_role),String(row.packaging_source_material_template_id)]));
    for(const [role,control] of Object.entries(pickers)){
      if(!control)continue;
      const placeholder=role==='base'?'Choose soap base':role==='scent'?'Unscented / choose scent':'None / choose additional oil';
      control.replaceChildren(new Option(placeholder,''));
      const matches=library.filter(row=>SOAP_ROLES_540[role].includes(String(row.material_subtype||row.material_type)));
      for(const row of matches)control.add(new Option(String(row.material_name||'Source material'),String(row.packaging_source_material_template_id)));
      const original=attached.get(role==='scent'?'fragrance':role==='oil'?'additive':'base');
      if(original&&matches.some(row=>String(row.packaging_source_material_template_id)===original))control.value=original;
      else if(!original&&record.previous_spec){
        const prior=role==='base'?record.previous_spec.wax_or_base:role==='scent'?record.previous_spec.scent_profile:'';
        const matching=matches.filter(row=>String(row.material_name||'').trim().toLowerCase()===String(prior||'').trim().toLowerCase());
        if(matching.length===1)control.value=String(matching[0].packaging_source_material_template_id);
      }
    }
    loaded=true;renderRecipe();
    if(ownerReceipt){
      const accepted=record.owner_acceptance_558?.current===true;
      ownerReceipt.textContent=accepted?`✓ Owner recipe acceptance is saved and matches this official formula (${record.owner_acceptance_558.accepted_at}). Check the physical label before external publishing.`:
        'Owner recipe acceptance is not verified. Check the actual Sweet Orange fragrance, complete supplier ingredients and unwrapped bar weight, then check the confirmation box and Save Product.';
      ownerReceipt.dataset.ready=accepted?'true':'false';
    }
    if(record.saved_weight_g>0&&weightInput&&!weightInput.value)weightInput.value=String(record.saved_weight_g);
    if(record.saved_ingredients?.length&&!choices().base){
      if(preview)preview.value=record.saved_ingredients.map(row=>String(row.inci_name||'').trim()).filter(Boolean).join(', ');
      say(`Recovered ${record.saved_ingredients.length} previously saved official ingredient rows. They are preserved. Choose their source base, scent and oil before replacing the formula.`,false);
    }
    if(!library.length)say('No saved supplier source materials are available yet. Existing Product and label data remain untouched. Add the actual soap base, scent or oil to our Source Material Library first.',true);
  }catch(error){say('Could not restore this saved soap formula: '+String(error?.message||error)+'. Our existing records have not been changed.',true);}
  finally{loading=false;}
}
if(form&&save){
  const destinationMount=byId('dd540DestinationMount'),destination=byId('productChannel405');
  if(destinationMount&&destination)destinationMount.append(destination);
  const nativeStatus=byId('productEditorStatus');
  if(nativeStatus)new MutationObserver(()=>{
    const tone=String(nativeStatus.dataset.tone||'');
    if(!['warn','error','hold'].includes(tone))return;
    const message=String(nativeStatus.textContent||'').trim();
    if(message)toolbar.textContent=message.replace(/\s*D1 rows read:\s*\d+\.?/gi,'').slice(0,320);
  }).observe(nativeStatus,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-tone']});
  for(const control of Object.values(pickers))control?.addEventListener('change',()=>renderRecipe({changed:true}));
  if(recipeRoot)recipeRoot.hidden=!isSoap;
  document.addEventListener('dd:product-loaded',()=>{
    const named=String(form.elements.namedItem('name')?.value||'');
    isSoap=productId===54||/\bsoap\b/i.test(named);
    if(recipeRoot)recipeRoot.hidden=!isSoap;
    if(isSoap&&weightInput&&!weightInput.value){
      const previous=String(form.elements.namedItem('description')?.value||'');
      const recorded=previous.match(/Net weight of soap \(without packaging\)\s*:\s*(\d+(?:\.\d+)?)\s*g\b/i);
      if(recorded)weightInput.value=recorded[1]; // previous owner-saved NET weight, never parcel weight
    }
    if(document.querySelector('[data-editor-panel="ingredients"]:not([hidden])'))loadSoap();
  });

  document.addEventListener('dd:editor-tab-opened',event=>{
    if(event.detail?.tab==='ingredients')loadSoap();
  });
  if(new URLSearchParams(location.search).get('tab')==='ingredients')loadSoap();

  document.addEventListener('dd:save-succeeded',event=>{
    if(Number(event.detail?.product_id)!==productId||saveBusy)return;
    if(isSoap&&recipeRoot?.dataset.scentConflict==='1'){
      toolbar.textContent='Product saved. Our existing official ingredient record was NOT changed. Choose the actual fragrance when ready; Etsy draft photos can be handled separately.';
    }else if(!event.detail?.newer_edits){toolbar.textContent='Product saved. The Etsy draft is unchanged until we explicitly update it.';}
  });

  save.addEventListener('click',async()=>{
    if(saveBusy)return;
    saveBusy=true;save.disabled=true;
    try{
      const actualSave=byId('productEditorSave');
      if(!actualSave||actualSave.disabled)throw Error('Wait until the saved Product finishes loading before saving. No change was sent.');
      const validRecipe=isSoap&&loaded&&formula?.ready&&Number(pickers.base?.value||0)>0;
      const scentConflict=recipeRoot?.dataset.scentConflict==='1';
      const net=Number(weightInput?.value||0);
      const confirmed=verified?.checked===true;
      if(validRecipe&&!scentConflict&&confirmed&&Number.isFinite(net)&&net>0){
        toolbar.textContent='Saving our Product, then its official source-selected soap formula…';
        const afterSave=async event=>{
          if(Number(event.detail?.product_id)!==productId)return;
          document.removeEventListener('dd:save-succeeded',afterSave);
          if(event.detail?.newer_edits){toolbar.textContent='Product saved, but there are newer unsaved edits. Save those before updating the official formula.';saveBusy=false;save.disabled=false;return;}
          try{
            const result=await api('/api/admin/product-soap-formula-540','POST',{
              product_id:productId,choices:choices(),net_weight_g:net,
              expected_inci_text:formula.inci_text,confirm_actual_formula:true
            });
            toolbar.textContent=`Saved Product and ${result.saved_ingredient_count} official ingredient rows. Etsy remains unchanged until we choose Update Draft.`;
            say('Saved our real source-selected formula and label ingredient record. Final label/packaging approval remains separate.');
            if(ownerReceipt){ownerReceipt.textContent=result.owner_acceptance_saved===true?
              '✓ Physical batch owner confirmation saved with this exact source formula and net weight. Final packaging and Etsy approval are still separate.':
              'Owner acceptance receipt was not confirmed. Review the saved official formula before external publishing.';
              ownerReceipt.dataset.ready=result.owner_acceptance_saved===true?'true':'false';}
          }catch(error){toolbar.textContent='Product saved, but official soap formula needs review: '+String(error?.message||error)+' Do not submit an Etsy update yet.';}
          finally{saveBusy=false;save.disabled=false;}
        };
        document.addEventListener('dd:save-succeeded',afterSave);
        actualSave.click();
        // A failed Product Save does not trigger the formula POST.
        setTimeout(()=>{if(saveBusy){document.removeEventListener('dd:save-succeeded',afterSave);saveBusy=false;save.disabled=false;toolbar.textContent='Product Save is not confirmed. Review the saved Product before trying again; no soap formula was automatically posted.';}},20000);
      }else{
        actualSave.click();
        toolbar.textContent=isSoap&&scentConflict?'Saving Product only. The conflicting soap formula is preserved for correction; it will not overwrite the official label.':isSoap?'Saving Product draft. The official soap formula is unchanged until we confirm real ingredients and net weight.':'Saving Product…';
        saveBusy=false;save.disabled=false;
      }
    }catch(error){toolbar.textContent=String(error?.message||error);saveBusy=false;save.disabled=false;}
  });

  const publishingStatus=byId('dd540PublishingStatus');
  orangeSuggestion?.addEventListener('click',()=>{
    const source=orangeSuggestion.dataset.sourceId;
    if(!source||!pickers.scent)return;
    pickers.scent.value=source;
    renderRecipe({changed:true});
    say('Orange fragrance selected from our saved library. Check that it is the real fragrance used, then confirm the formula and Save Product.');
  });
  // The Build 544 Etsy workflow owns its own stable controls. Legacy scripts may
  // hide their own panels, but cannot hide the new draft connection step.
  const sources=['dd535LiveStatus','dd523PostStatus','dd523Readiness'].map(byId).filter(Boolean);
  for(const source of sources)new MutationObserver(()=>{
    const current=sources.map(x=>String(x.textContent||'').trim()).filter(Boolean);
    if(publishingStatus&&current.length)publishingStatus.textContent=current.join(' · ').slice(0,850);
  }).observe(source,{subtree:true,childList:true,characterData:true});
  byId('dd540CheckDraft')?.addEventListener('click',()=>{
    const read=byId('dd535ReadLive');if(read)read.click();
    else publishingStatus.textContent='Live Etsy readback is unavailable; no Etsy write occurred.';
    byId('dd443EtsyImagesLoad')?.click();
  });
  document.addEventListener('dd:etsy-existing-draft-linked',event=>{
    if(Number(event.detail?.product_id)!==productId)return;
    publishingStatus.textContent='Existing draft connected. Loading our three Product photos now…';
    byId('dd443EtsyImagesLoad')?.click();
  });
  document.addEventListener('dd:editor-tab-opened',event=>{
    if(event.detail?.tab==='publishing'&&productId===54)byId('dd443EtsyImagesLoad')?.click();
  });
  if(byId('dd542OwnerVerify'))byId('dd542OwnerVerify').hidden=productId!==54;
  byId('dd542OwnerVerify')?.addEventListener('click',async()=>{
    const button=byId('dd542OwnerVerify'),status=byId('dd542OwnerStatus');
    if(!productId||form.dataset.productDirty==='1'){
      status.textContent='Save the Product first. No recipe or Etsy photo verification was attempted.';return;
    }
    button.disabled=true;status.textContent='Reading the saved official soap record and actual existing Etsy draft photos…';
    try{
      const [recipe,photos]=await Promise.all([
        api(`/api/admin/product-soap-formula-540?product_id=${productId}`),
        api(`/api/admin/product-etsy-images?product_id=${productId}&reconcile=1&candidate_listing_id=4601705477`)
      ]);
      const report=assessOwnerRecipePhotos542(recipe,photos,{productId});
      status.textContent=report.ready?
        `Readback complete: ${report.ingredient_count} saved INCI rows and ${report.remote_count}/${report.original_count} matched Etsy photos. The owner still needs to approve the physical recipe and photos.`:
        `HOLD — ${report.issues.join(' ')} No Etsy upload, publication or ingredient write occurred.`;
      status.dataset.tone=report.ready?'ok':'hold';
    }catch(error){status.textContent='HOLD — readback unavailable: '+String(error?.message||error)+'. No Etsy or ingredient write occurred.';status.dataset.tone='hold';}
    finally{button.disabled=false;}
  });
  byId('dd540UpdateDraft')?.addEventListener('click',()=>{
    const dispatch=byId('dd523EtsyPost');
    if(form.dataset.productDirty==='1'){publishingStatus.textContent='Save the Product first; the draft was not updated.';return;}
    if(!dispatch||dispatch.disabled){publishingStatus.textContent='The saved Product or photos need a current readiness check before this existing Etsy draft can be updated. Use Check Etsy draft first. No duplicate was created.';return;}
    if(productId===54&&!/update/i.test(String(dispatch.textContent||''))){publishingStatus.textContent='This is an existing Sweet Orange draft. Verify and link #4601705477 before an update; a second draft will not be created.';return;}
    dispatch.click(); // existing separately confirmed draft-only provider workflow
  });
}
