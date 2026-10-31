/* Finished soap Product recipe built ONLY from saved source-material INCI rows. */
export const SOAP_ROLES_540 = Object.freeze({
  base: ['soap_base'],
  scent: ['fragrance_oil','essential_oil_blend'],
  oil: ['carrier_oil_butter','additive','botanical']
});
const id = value => Number.isSafeInteger(Number(value)) && Number(value)>0 ? Number(value) : 0;
const clean = value => String(value ?? '').trim();

// Advisory only: never infer or overwrite a physical batch formula from the title.
export function scentNameConflict541(productName,selectedName){
  const product=clean(productName).toLowerCase(),scent=clean(selectedName).toLowerCase();
  return /sweet\s+orange/.test(product)&&!!scent&&!/\borange\b/.test(scent);
}

// Read-only owner evidence. It reports what is still unknown; it never accepts
// a Product title or an Etsy screenshot as proof of a physical formula/upload.
export function assessOwnerRecipePhotos542(recipe,photos,{productId=54,expectedListingId='4601705477'}={}){
  const issues=[];
  if(Number(recipe?.product_id)!==Number(productId))issues.push('Saved Product identity was not verified.');
  if(recipe?.ambiguous_projects||!recipe?.official_project)issues.push('One authoritative official soap label record was not found.');
  if(!Array.isArray(recipe?.saved_ingredients)||!recipe.saved_ingredients.length)issues.push('Saved official INCI ingredients are missing.');
  if(!Array.isArray(recipe?.saved_materials)||!recipe.saved_materials.some(x=>x.material_role==='base'))issues.push('The actual soap base source is not linked to the official recipe.');
  const scent=recipe?.saved_materials?.find(x=>x.material_role==='fragrance');
  const source=recipe?.source_materials?.find(x=>String(x.packaging_source_material_template_id)===String(scent?.packaging_source_material_template_id));
  if(scentNameConflict541(recipe?.product_name,source?.material_name))issues.push('Saved scent conflicts with Sweet Orange; owner must review the actual batch.');
  if(!(Number(recipe?.saved_weight_g)>0))issues.push('Finished unwrapped bar weight is not recorded.');
  if(String(photos?.listing_id||'')!==String(expectedListingId))issues.push('The linked Etsy draft is not the expected existing draft.');
  if(photos?.provider_contacted!==true)issues.push('Live Etsy photo inventory has not been verified.');
  if(photos?.remote_reconciliation?.ready!==true||photos?.photo_pair_readback_529?.ready!==true)issues.push('Original Product photographs do not all have verified Etsy photo pairs.');
  if(Number(photos?.gallery_photo_count||0)<1)issues.push('No approved original Product gallery photographs were found.');
  return {ready:issues.length===0,issues,ingredient_count:recipe?.saved_ingredients?.length||0,
    original_count:photos?.gallery_photo_count??null,remote_count:photos?.remote_reconciliation?.remote_count??null};
}

export function composeSoapFormula540(sources, choices) {
  const selected = [];
  const blockers = [];
  const warnings = [];
  const sourceMap = new Map((Array.isArray(sources)?sources:[]).map(source=>[id(source.packaging_source_material_template_id),source]));
  const used = new Set();
  for (const role of ['base','scent','oil']) {
    const chosenId = id(choices?.[role]);
    if (!chosenId) { if(role==='base')blockers.push('Choose a saved soap base.'); continue; }
    if(used.has(chosenId)){blockers.push('The same material cannot fill two different recipe choices.');continue;}
    used.add(chosenId);
    const source = sourceMap.get(chosenId);
    if(!source){blockers.push(`The selected ${role} was not found in the saved source library.`);continue;}
    const subtype = clean(source.material_subtype||source.material_type);
    if(!SOAP_ROLES_540[role].includes(subtype)){blockers.push(`The selected ${role} is not categorized as a ${role} source.`);continue;}
    const names = Array.isArray(source.master_inci) ? source.master_inci : [];
    if(!names.length){blockers.push(`${clean(source.material_name)||role} has no saved supplier/owner INCI composition.`);continue;}
    const normalized = names.filter(row=>row?.required_on_label==null||Number(row.required_on_label)!==0).map(row=>({
      inci_name:clean(row?.inci_name),
      display_name_en:clean(row?.display_name_en||row?.inci_name),
      display_name_fr:clean(row?.display_name_fr||row?.inci_name),
      organic_flag:Number(row?.organic_flag)===1?1:0,
      allergen_note:clean(row?.allergen_note),required_on_label:1
    }));
    if(!normalized.length||normalized.some(row=>!row.inci_name||row.inci_name.length>240||/required for cosmetic|enter inci|placeholder/i.test(row.inci_name))){
      blockers.push(`${clean(source.material_name)||role} has missing or placeholder INCI names. Complete its actual supplier record first.`);continue;
    }
    if(!['supplier_verified','owner_verified'].includes(clean(source.verification_status))){
      warnings.push(`${clean(source.material_name)} source ingredients still need supplier/owner verification.`);
    }
    selected.push({role,id:chosenId,material_name:clean(source.material_name),ingredients:normalized});
  }
  const merged=[]; const seen=new Set();
  for(const source of selected) for(const row of source.ingredients){
    const key=row.inci_name.toLocaleLowerCase('en');
    if(!seen.has(key)){seen.add(key);merged.push({...row,sort_order:merged.length+1});}
  }
  if(!merged.length)blockers.push('The selected materials do not provide an actual ingredient list.');
  if(merged.length>80)blockers.push('More than 80 label ingredients require manual review.');
  return {ready:blockers.length===0,blockers,warnings,selected,
    ingredients:merged,
    inci_text:merged.map(x=>x.inci_name).join(', '),
    required_owner_review:'Confirm physical formula, actual proportions, ingredient order and finished net weight before selling; no ingredient facts were inferred.'};
}
