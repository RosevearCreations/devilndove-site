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
