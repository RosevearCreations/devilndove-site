// Build 262 - Active source templates, source-derived reusable content, printer inventory profiles and refined soap-label geometry.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '262';
const VALID_PROJECT_STATUSES = new Set(['draft','review','approved','archived']);
const VALID_COMPLIANCE = new Set(['needs_review','ready_for_review','approved','blocked']);
const VALID_VERSION_REVIEW = new Set(['needs_review','approved','changes_requested','blocked']);
const VALID_EXPORTS = new Set(['svg','png','jpg','webp','pdf_print']);
const VALID_PRINT_TEST = new Set(['needs_test','passed','failed']);
const VALID_PHYSICAL_REVIEW = new Set(['not_checked','passed','failed']);
const VALID_PACKAGE_TYPES = new Set(['soap_ribbon','product_label','candle_label','candle_top','engraved_round','jewelry_card','package_insert','shipping_label','gift_set']);
const VALID_SOURCE_MATERIAL_TYPES = new Set(['soap_base','fragrance_oil','colourant','additive']);
const VALID_SOURCE_VERIFICATION = new Set(['needs_review','supplier_verified','owner_verified','blocked']);
const VALID_FRAGRANCE_REVIEW = new Set(['not_applicable','needs_supplier_data','needs_review','reviewed']);

function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function text(value,max=2000){return normalizeText(value).slice(0,max);}
function id(value){const n=Number(value);return Number.isInteger(n)&&n>0?n:0;}
function number(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function safeJson(value,fallback){try{const parsed=JSON.parse(String(value||''));return parsed??fallback}catch{return fallback}}
function jsonText(value,fallback){return JSON.stringify(value&&typeof value==='object'?value:fallback);}
function bool(value){return Number(value)===1||value===true||value==='true';}
function boundedDimension(value,fallback=50.8){return Math.min(1200,Math.max(20,number(value,fallback)));}
function keyPart(value){return text(value,80).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'custom-template';}
async function syncSourceMaterialReusableContent(db,sourceId,materialName,materialType,materialSubtype,masterInci,verification,userId){
  if(!sourceId)return;
  const prefix=`source-material-${sourceId}-`;
  await db.prepare(`UPDATE packaging_content_library SET is_active=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE content_key LIKE ?`).bind(userId,`${prefix}%`).run().catch(()=>null);
  const seen=new Set();
  for(const row of (Array.isArray(masterInci)?masterInci:[]).slice(0,100)){
    const inci=text(row?.inci_name||row?.display_name_en||row?.display_name_fr,300);if(!inci)continue;const normalized=inci.toLowerCase();if(seen.has(normalized))continue;seen.add(normalized);
    const contentKey=`${prefix}ingredient-${keyPart(inci)}`;const itemName=text(row?.display_name_en||inci,180)||inci;const metadata={auto_generated:1,source_material_template_id:sourceId,source_material_name:materialName,source_material_type:materialType,source_material_subtype:materialSubtype,verification_status:verification,allergen_note:text(row?.allergen_note,500)||'',required_on_label:Number(row?.required_on_label)!==0?1:0};
    await db.prepare(`INSERT INTO packaging_content_library(content_key,content_type,item_name,text_en,text_fr,inci_name,icon_name,metadata_json,is_system,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,'ingredient',?,?,?,?,NULL,?,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(content_key) DO UPDATE SET item_name=excluded.item_name,text_en=excluded.text_en,text_fr=excluded.text_fr,inci_name=excluded.inci_name,metadata_json=excluded.metadata_json,is_active=1,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(contentKey,itemName,text(row?.display_name_en,500)||itemName,text(row?.display_name_fr,500)||null,inci,JSON.stringify(metadata),userId,userId).run().catch(()=>null);
  }
  const reusableType=materialType==='fragrance_oil'?'fragrance_oil':materialType==='colourant'?'colourant':'';
  if(reusableType){
    const contentKey=`${prefix}${reusableType}`;const metadata={auto_generated:1,source_material_template_id:sourceId,source_material_name:materialName,source_material_type:materialType,source_material_subtype:materialSubtype,verification_status:verification};
    await db.prepare(`INSERT INTO packaging_content_library(content_key,content_type,item_name,text_en,text_fr,inci_name,icon_name,metadata_json,is_system,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,NULL,NULL,?,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(content_key) DO UPDATE SET content_type=excluded.content_type,item_name=excluded.item_name,text_en=excluded.text_en,metadata_json=excluded.metadata_json,is_active=1,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(contentKey,reusableType,materialName,materialName,null,JSON.stringify(metadata),userId,userId).run().catch(()=>null);
  }
}
function productRosePreset(value){
  const source=text(value,240).toLowerCase();
  if(source.includes('glacial'))return{asset:'rose-lavender-v1',colour:'#A57BCB'};
  if(source.includes('shea')||source.includes('pumice'))return{asset:'rose-green-v1',colour:'#6D8757'};
  if(source.includes('oatmeal')||source.includes('goat'))return{asset:'rose-oatmeal-v1',colour:'#C9B18A'};
  if(source.includes('sea breeze'))return{asset:'rose-blue-green-v1',colour:'#4F9599'};
  if(source.includes('charcoal'))return{asset:'rose-charcoal-v1',colour:'#4A4A4A'};
  if(source.includes('honey'))return{asset:'rose-honey-v1',colour:'#C28A2E'};
  if(source.includes('rose'))return{asset:'rose-red-v1',colour:'#B23A48'};
  return{asset:'rose-purple-v1',colour:'#8E61AA'};
}

async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return{error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env);
  if(!db)return{error:json({ok:false,error:'Database binding is not configured.'},500)};
  return{adminUser,db};
}

function mapTemplate(row){return{...row,packaging_template_id:id(row.packaging_template_id),page_width_mm:number(row.page_width_mm),page_height_mm:number(row.page_height_mm),front_width_mm:number(row.front_width_mm),front_height_mm:number(row.front_height_mm),rear_width_mm:number(row.rear_width_mm),rear_height_mm:number(row.rear_height_mm),layout:safeJson(row.layout_json,{}),theme:safeJson(row.theme_json,{})};}
function mapProject(row){return{...row,packaging_project_id:id(row.packaging_project_id),product_id:id(row.product_id)||null,packaging_template_id:id(row.packaging_template_id),claims:safeJson(row.claims_json,[]),icons:safeJson(row.icons_json,[]),theme:safeJson(row.theme_json,{}),artwork:safeJson(row.artwork_json,{})};}
function mapVersion(row){return{...row,packaging_project_version_id:id(row.packaging_project_version_id),packaging_project_id:id(row.packaging_project_id),version_number:number(row.version_number),snapshot:safeJson(row.snapshot_json,{})};}
function mapReference(row){return{...row,packaging_reference_source_id:id(row.packaging_reference_source_id),dimensional_summary:safeJson(row.dimensional_summary_json,{})};}
function mapFormula(row){return{...row,packaging_formula_library_id:id(row.packaging_formula_library_id),ingredients:safeJson(row.ingredients_json,[])};}
function mapLibraryContent(row){return{...row,packaging_content_library_id:id(row.packaging_content_library_id),metadata:safeJson(row.metadata_json,{})};}
function mapSourceMaterial(row){return{...row,packaging_source_material_template_id:id(row.packaging_source_material_template_id),product_family:text(row.product_family||'general',80)||'general',material_subtype:text(row.material_subtype||row.material_type||'other',80)||'other',default_role:text(row.default_role||'',40)||null,colour_hex:text(row.colour_hex||'',20)||null,master_inci:safeJson(row.master_inci_json,[]),fragrance_allergens:safeJson(row.fragrance_allergens_json,[]),benefits:safeJson(row.benefits_json,[]),supplier_claims:safeJson(row.supplier_claims_json,[]),source_snapshot:safeJson(row.source_snapshot_json,{})};}

function metadataText(meta, keys=[]){
  if(!meta||typeof meta!=='object')return'';
  for(const key of keys){const value=meta[key];if(Array.isArray(value))return value.map((item)=>typeof item==='string'?item:(item?.name||item?.title||'')).filter(Boolean).join(', ');if(value&&typeof value==='object')continue;if(String(value||'').trim())return text(value,8000);}
  return'';
}
function mapPackagingInventory(row={}){
  const meta=safeJson(row.catalog_source_record_json,{});
  return{
    site_item_inventory_id:id(row.site_item_inventory_id),source_type:text(row.source_type,40),external_key:text(row.external_key,180),item_name:text(row.item_name,300),category:text(row.category,180),
    source_url:text(row.source_url,1000),amazon_url:text(row.amazon_url,1000),image_url:text(row.image_url,1000),on_hand_quantity:number(row.on_hand_quantity),reserved_quantity:number(row.reserved_quantity),unit_cost_cents:Math.max(0,Math.round(number(row.unit_cost_cents))),stock_unit_label:text(row.stock_unit_label,80)||'unit',usage_unit_label:text(row.usage_unit_label,80)||'unit',usage_units_per_stock_unit:Math.max(.001,number(row.usage_units_per_stock_unit,1)),supplier_name:text(row.supplier_name||row.catalog_brand,180),supplier_sku:text(row.supplier_sku,180),
    item_description:text(row.item_description||row.catalog_short_description||row.catalog_notes,1200),packaging_source_material_template_id:id(row.packaging_source_material_template_id)||null,source_material_link_role:text(row.source_material_link_role,40)||null,
    captured_ingredients:metadataText(meta,['ingredients','ingredient_list','ingredient_declaration','ingredient_declaration_raw','inci','master_inci']),captured_allergens:metadataText(meta,['allergens','allergen_statement','allergen_information']),captured_benefits:metadataText(meta,['benefits','features','key_features']),captured_claims:metadataText(meta,['claims','claim_suggestions'])
  };
}
function normalizeSourceInci(value=[]){
  if(!Array.isArray(value))return[];
  return value.slice(0,120).map((row,index)=>({
    sort_order:index+1,inci_name:text(row?.inci_name,300)||null,display_name_en:text(row?.display_name_en,500)||null,display_name_fr:text(row?.display_name_fr,500)||null,
    organic_flag:bool(row?.organic_flag)?1:0,allergen_note:text(row?.allergen_note,500)||null,required_on_label:row?.required_on_label===false||Number(row?.required_on_label)===0?0:1,
    verification_status:['needs_review','supplier_verified','owner_verified'].includes(text(row?.verification_status,40))?text(row?.verification_status,40):'needs_review'
  })).filter((row)=>row.inci_name||row.display_name_en||row.display_name_fr);
}
function normalizeBenefits(value=[]){
  if(!Array.isArray(value))return[];
  return value.slice(0,30).map((row,index)=>({sort_order:index+1,title:text(row?.title,180),body:text(row?.body,3000),label_candidate:bool(row?.label_candidate)?1:0})).filter((row)=>row.title||row.body);
}
function normalizeSourceClaims(value=[]){
  if(!Array.isArray(value))return[];
  return value.slice(0,30).map((row,index)=>({sort_order:index+1,claim_en:text(row?.claim_en,300),claim_fr:text(row?.claim_fr,300),icon_name:text(row?.icon_name,80)||'leaf',label_candidate:bool(row?.label_candidate)?1:0,compliance_note:text(row?.compliance_note,800)||null})).filter((row)=>row.claim_en||row.claim_fr);
}
function normalizeFragranceAllergens(value=[]){
  if(!Array.isArray(value))return[];
  return value.slice(0,100).map((row,index)=>({sort_order:index+1,inci_name:text(row?.inci_name||row?.name,300),concentration_percent:Number.isFinite(Number(row?.concentration_percent))?Number(row.concentration_percent):null,disclosure_required:bool(row?.disclosure_required)?1:0,notes:text(row?.notes,500)||null})).filter((row)=>row.inci_name);
}
function sourceRole(materialType,defaultRole=''){const role=String(defaultRole||'');if(['base','fragrance','colourant','additive'].includes(role))return role;return materialType==='soap_base'?'base':materialType==='fragrance_oil'?'fragrance':materialType==='colourant'?'colourant':'additive';}

function normalizeIngredients(value=[]){
  if(!Array.isArray(value))return[];
  return value.slice(0,80).map((row,index)=>({
    sort_order:index+1,
    inci_name:text(row?.inci_name,300)||null,
    display_name_en:text(row?.display_name_en,500)||null,
    display_name_fr:text(row?.display_name_fr,500)||null,
    organic_flag:bool(row?.organic_flag)?1:0,
    allergen_note:text(row?.allergen_note,500)||null,
    required_on_label:row?.required_on_label===false||Number(row?.required_on_label)===0?0:1
  })).filter((row)=>row.inci_name||row.display_name_en||row.display_name_fr);
}
function normalizeClaims(value=[]){
  if(!Array.isArray(value))return[];
  return value.slice(0,20).map((row,index)=>({
    sort_order:index+1,
    claim_en:text(row?.claim_en,300),
    claim_fr:text(row?.claim_fr,300),
    icon_name:text(row?.icon_name,80)||null,
    is_approved:bool(row?.is_approved)?1:0,
    compliance_note:text(row?.compliance_note,500)||null
  })).filter((row)=>row.claim_en||row.claim_fr);
}
function dimensionReview(template={}){
  const layout=template.layout||safeJson(template.layout_json,{});
  const blockers=[];const warnings=[];
  const near=(a,b,t=.08)=>Math.abs(number(a)-number(b))<=t;
  if(!near(template.page_width_mm,279.4,.2))blockers.push('Overall width must be 279.4 mm (11.00 in).');
  if(!near(layout.band_height_mm,19.05,.1))blockers.push('Band height must be 19.05 mm (0.75 in).');
  if(!near(template.front_width_mm,50.8,.1)||!near(template.front_height_mm,38.1,.1))blockers.push('Front oval must be 50.8 × 38.1 mm (2.00 × 1.50 in).');
  if(!near(template.page_height_mm,38.1,.1))warnings.push('This profile expands the artboard beyond 1.50 in so a 50 mm rear seal is not clipped.');
  if(!near(template.rear_width_mm,50,.1))warnings.push('The photo-fit profile uses a 38.1 mm rear seal because a 50 mm circle cannot physically fit inside a 38.1 mm-high artboard.');
  return{blockers,warnings,profile:layout.dimension_profile||'unspecified'};
}
function estimatedIngredientLines(values=[],maxChars=27){
  let lines=0;
  for(const raw of values){
    const words=String(raw||'').trim().split(/\s+/).filter(Boolean);
    if(!words.length)continue;
    let current='• ';
    for(const word of words){
      const next=current.trim()==='•'?`• ${word}`:`${current} ${word}`;
      if(next.length>maxChars&&current.trim()!=='•'){lines+=1;current=`  ${word}`;}
      else current=next;
    }
    if(current.trim())lines+=1;
  }
  return lines;
}
function packagingRequiredFields(project={},ingredients=[],claims=[],template={},sourceMaterials=[]){
  const isSoap=String(project.package_type||template.package_type||'')==='soap_ribbon';
  const isRound=['candle_top','engraved_round'].includes(String(project.package_type||template.package_type||''));
  const checks=isRound?[
    ['template',project.packaging_template_id||template.packaging_template_id],
    ['main candle-top wording',project.artwork?.candle_primary_text||template.layout?.default_primary_text],
    ['upper curved brand wording',project.artwork?.top_arc_text||template.layout?.default_top_arc_text],
    ['lower curved origin wording',project.artwork?.bottom_arc_text||template.layout?.default_bottom_arc_text]
  ]:[
    ['English product identity',project.product_identity_en],['French product identity',project.product_identity_fr],
    ['metric net quantity',project.net_quantity_text],
    ['dealer / business identity',project.dealer_name],['dealer principal address',project.dealer_address],
    ['consumer contact information',project.contact_text],['website',project.website_text]
  ];
  if(isSoap)checks.push(['INCI ingredient list',project.ingredients_inci],['Made in Canada wording',project.made_in_canada_text],['rose asset',project.artwork?.rose_asset_id||project.rose_asset_id]);
  if(String(project.warnings_en||project.warnings_fr||'').trim())checks.push(['English warning',project.warnings_en],['French warning',project.warnings_fr]);
  const missing=checks.filter(([,value])=>!String(value||'').trim()).map(([label])=>label);
  if(isSoap&&!ingredients.length)missing.push('structured INCI ingredient rows');
  if(isSoap){
    const baseSources=sourceMaterials.filter((row)=>String(row.material_role||'')==='base');
    const fragranceSources=sourceMaterials.filter((row)=>String(row.material_role||'')==='fragrance');
    for(const source of baseSources){
      if(!['supplier_verified','owner_verified'].includes(String(source.verification_status||'')))missing.push(`source soap-base verification: ${source.material_name||'selected base'}`);
      const inci=Array.isArray(source.master_inci)?source.master_inci:[];
      if(inci.some((row)=>String(row.verification_status||'needs_review')==='needs_review'))missing.push(`master INCI review for ${source.material_name||'selected base'}`);
    }
    for(const source of fragranceSources){
      if(String(source.fragrance_allergen_review_status||'needs_supplier_data')!=='reviewed')missing.push(`2026 fragrance-allergen review for ${source.material_name||'selected fragrance oil'}`);
    }
  }
  if(ingredients.some((row)=>Number(row.required_on_label)!==0&&!String(row.inci_name||'').trim()))missing.push('INCI name for each required ingredient row');
  if(claims.some((row)=>!String(row.claim_en||'').trim()||!String(row.claim_fr||'').trim()))missing.push('English and French text for each claim');
  const requiredIngredients=ingredients.filter((row)=>Number(row.required_on_label)!==0);
  const enLines=estimatedIngredientLines(requiredIngredients.map((row)=>row.display_name_en||row.inci_name),27);
  const frLines=estimatedIngredientLines(requiredIngredients.map((row)=>row.display_name_fr||row.inci_name),26);
  if(isSoap&&enLines>8)missing.push(`English ingredient panel exceeds the tested eight-line narrow-band capacity (${enLines} estimated lines)`);
  if(isSoap&&frLines>8)missing.push(`French ingredient panel exceeds the tested eight-line narrow-band capacity (${frLines} estimated lines)`);
  const dimensions=isSoap?dimensionReview(template):{blockers:[],warnings:[isRound?'Confirm the measured lid/blank diameter, safe margin, material settings and a physical proof before approval.':'Confirm the selected template against the physical container/card dieline before approval.'],profile:template.layout?.design_profile||template.layout?.dimension_profile||'general'};
  const designProfile=String(template.layout?.design_profile||safeJson(template.layout_json,{}).design_profile||'');
  if(isSoap&&!['soap_reference_v2','soap_reference_v3'].includes(designProfile))dimensions.blockers.push('Soap ribbon must use the approved soap_reference_v3 design profile before approval.');
  return{missing:[...new Set(missing)],dimension_blockers:[...new Set(dimensions.blockers)],dimension_warnings:dimensions.warnings,dimension_profile:dimensions.profile,design_profile:designProfile};
}

async function listData(db){
  const templates=rows(await db.prepare(`SELECT * FROM packaging_templates WHERE is_active=1 ORDER BY CASE WHEN template_key='soap-ribbon-glacial-approved-v1' THEN 0 WHEN template_key='soap-ribbon-spec-50mm-seal-v1' THEN 1 ELSE 2 END,is_system DESC,LOWER(template_name)`).all()).map(mapTemplate);
  const projects=rows(await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.featured_image_url,sp.print_status AS soap_print_status FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id LEFT JOIN soap_products sp ON sp.packaging_project_id=pp.packaging_project_id ORDER BY pp.updated_at DESC,pp.packaging_project_id DESC`).all()).map(mapProject);
  const products=rows(await db.prepare(`SELECT product_id,product_number,sku,name,slug,status,product_category,short_description,description,weight_grams,featured_image_url FROM products WHERE COALESCE(status,'draft')<>'archived' ORDER BY LOWER(name),product_id DESC LIMIT 500`).all().catch(()=>({results:[]})));
  let inventory=[];
  try{
    inventory=rows(await db.prepare(`SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,sii.source_url,sii.amazon_url,sii.image_url,sii.on_hand_quantity,sii.reserved_quantity,sii.unit_cost_cents,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit,sii.supplier_name,sii.supplier_sku,d.item_description,ci.brand AS catalog_brand,ci.short_description AS catalog_short_description,ci.notes AS catalog_notes,ci.source_record_json AS catalog_source_record_json,isml.packaging_source_material_template_id,isml.link_role AS source_material_link_role FROM site_item_inventory sii LEFT JOIN site_inventory_item_descriptions d ON d.site_item_inventory_id=sii.site_item_inventory_id LEFT JOIN catalog_items ci ON ci.item_kind=sii.source_type AND ci.source_key=sii.external_key LEFT JOIN inventory_source_material_links isml ON isml.inventory_source_material_link_id=(SELECT x.inventory_source_material_link_id FROM inventory_source_material_links x WHERE x.site_item_inventory_id=sii.site_item_inventory_id ORDER BY CASE x.link_role WHEN 'soap_base' THEN 1 WHEN 'fragrance' THEN 2 WHEN 'colourant' THEN 3 WHEN 'additive' THEN 4 ELSE 5 END,x.inventory_source_material_link_id LIMIT 1) WHERE COALESCE(sii.is_active,1)=1 AND LOWER(COALESCE(sii.source_type,''))<>'tool' ORDER BY LOWER(sii.item_name) LIMIT 1000`).all()).map(mapPackagingInventory);
  }catch{
    inventory=rows(await db.prepare(`SELECT site_item_inventory_id,source_type,external_key,item_name,category,source_url,amazon_url,image_url,on_hand_quantity,reserved_quantity,unit_cost_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,supplier_name,supplier_sku FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND LOWER(COALESCE(source_type,''))<>'tool' ORDER BY LOWER(item_name) LIMIT 1000`).all().catch(()=>({results:[]}))).map(mapPackagingInventory);
  }
  let printers=[];
  try{printers=rows(await db.prepare(`SELECT sii.site_item_inventory_id,sii.item_name,sii.category,sii.source_type,sii.supplier_name,sii.supplier_sku FROM site_item_inventory sii LEFT JOIN site_inventory_item_descriptions d ON d.site_item_inventory_id=sii.site_item_inventory_id WHERE COALESCE(sii.is_active,1)=1 AND (LOWER(COALESCE(sii.item_name,'')) LIKE '%printer%' OR LOWER(COALESCE(sii.category,'')) LIKE '%printer%' OR LOWER(COALESCE(d.item_description,'')) LIKE '%printer%') ORDER BY LOWER(sii.item_name) LIMIT 100`).all());}catch{}
  const reference_sources=rows(await db.prepare(`SELECT * FROM packaging_reference_sources WHERE is_active=1 ORDER BY CASE source_type WHEN 'design_specification' THEN 1 WHEN 'dimension_guide' THEN 2 WHEN 'svg_template' THEN 3 ELSE 4 END,source_key`).all()).map(mapReference);
  let formula_library=[];let content_library=[];let source_material_library=[];let library_schema_ready=true;let source_material_schema_ready=true;let source_material_metadata_ready=true;
  try{
    formula_library=rows(await db.prepare(`SELECT * FROM packaging_formula_library WHERE is_active=1 ORDER BY is_system DESC,LOWER(formula_name),packaging_formula_library_id`).all()).map(mapFormula);
    content_library=rows(await db.prepare(`SELECT * FROM packaging_content_library WHERE is_active=1 ORDER BY CASE content_type WHEN 'claim' THEN 1 WHEN 'ingredient' THEN 2 WHEN 'fragrance_oil' THEN 3 WHEN 'colourant' THEN 4 ELSE 5 END,is_system DESC,LOWER(item_name),packaging_content_library_id`).all()).map(mapLibraryContent);
  }catch{library_schema_ready=false;}
  try{
    try{
      source_material_library=rows(await db.prepare(`SELECT smt.*,smm.product_family,smm.material_subtype,smm.default_role,smm.colour_hex FROM packaging_source_material_templates smt LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE smt.is_active=1 ORDER BY CASE COALESCE(smm.default_role,'') WHEN 'base' THEN 1 WHEN 'fragrance' THEN 2 WHEN 'colourant' THEN 3 ELSE 4 END,smt.is_system DESC,LOWER(smt.material_name),smt.packaging_source_material_template_id`).all()).map(mapSourceMaterial);
    }catch{
      source_material_metadata_ready=false;
      source_material_library=rows(await db.prepare(`SELECT * FROM packaging_source_material_templates WHERE is_active=1 ORDER BY CASE material_type WHEN 'soap_base' THEN 1 WHEN 'fragrance_oil' THEN 2 WHEN 'colourant' THEN 3 ELSE 4 END,is_system DESC,LOWER(material_name),packaging_source_material_template_id`).all()).map(mapSourceMaterial);
    }
    const links=rows(await db.prepare(`SELECT packaging_formula_library_id,packaging_source_material_template_id,material_role FROM packaging_formula_source_material_links ORDER BY packaging_formula_source_material_link_id`).all());
    for(const formula of formula_library){const link=links.find((row)=>Number(row.packaging_formula_library_id)===Number(formula.packaging_formula_library_id)&&String(row.material_role)==='base');if(link)formula.source_material_template_id=Number(link.packaging_source_material_template_id);}
  }catch{source_material_schema_ready=false;}
  return{templates,projects,products,inventory,printers,reference_sources,formula_library,content_library,source_material_library,library_schema_ready,source_material_schema_ready,source_material_metadata_ready};
}

async function loadDetail(db,projectId){
  const row=await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.product_category,p.short_description,p.description,p.weight_grams,p.featured_image_url,t.template_key,t.template_name,t.package_type AS template_package_type,t.description AS template_description,t.is_system AS template_is_system,t.page_width_mm,t.page_height_mm,t.front_width_mm,t.front_height_mm,t.rear_width_mm,t.rear_height_mm,t.layout_json AS template_layout_json,t.theme_json AS template_theme_json FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id INNER JOIN packaging_templates t ON t.packaging_template_id=pp.packaging_template_id WHERE pp.packaging_project_id=?`).bind(projectId).first();
  if(!row)return null;
  const soapProduct=await db.prepare(`SELECT * FROM soap_products WHERE packaging_project_id=?`).bind(projectId).first();
  let ingredients=[];let claims=[];
  try{ingredients=rows(await db.prepare(`SELECT * FROM packaging_project_ingredients WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_ingredient_id`).bind(projectId).all());claims=rows(await db.prepare(`SELECT * FROM packaging_project_claims WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_claim_id`).bind(projectId).all());}catch{}
  if(!ingredients.length&&soapProduct)ingredients=rows(await db.prepare(`SELECT * FROM soap_ingredients WHERE soap_product_id=? ORDER BY sort_order,ingredient_id`).bind(soapProduct.soap_product_id).all());
  if(!claims.length&&soapProduct)claims=rows(await db.prepare(`SELECT * FROM soap_label_claims WHERE soap_product_id=? ORDER BY sort_order,claim_id`).bind(soapProduct.soap_product_id).all());
  const versions=rows(await db.prepare(`SELECT packaging_project_version_id,packaging_project_id,version_number,version_label,review_status,reviewed_by_user_id,reviewed_at,created_by_user_id,created_at,snapshot_json FROM packaging_project_versions WHERE packaging_project_id=? ORDER BY version_number DESC`).bind(projectId).all()).map(mapVersion);
  const exports=rows(await db.prepare(`SELECT * FROM packaging_export_history WHERE packaging_project_id=? ORDER BY created_at DESC,packaging_export_history_id DESC LIMIT 100`).bind(projectId).all());
  const printTests=rows(await db.prepare(`SELECT * FROM soap_label_print_tests WHERE packaging_project_id=? ORDER BY created_at DESC,print_test_id DESC LIMIT 50`).bind(projectId).all());
  const soapExports=soapProduct?rows(await db.prepare(`SELECT * FROM soap_label_exports WHERE soap_product_id=? ORDER BY generated_at DESC,export_id DESC LIMIT 100`).bind(soapProduct.soap_product_id).all()):[];
  const components=rows(await db.prepare(`SELECT pc.*,sii.item_name AS inventory_item_name,sii.on_hand_quantity,sii.reserved_quantity,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit FROM packaging_components pc LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=pc.site_item_inventory_id WHERE pc.packaging_project_id=? AND pc.is_active=1 ORDER BY pc.packaging_component_id`).bind(projectId).all());
  let sourceMaterials=[];
  try{sourceMaterials=rows(await db.prepare(`SELECT psm.packaging_project_source_material_id,psm.material_role,psm.sort_order,psm.source_snapshot_json,psm.review_status AS project_source_review_status,psm.notes AS project_source_notes,smt.*,smm.product_family,smm.material_subtype,smm.default_role,smm.colour_hex FROM packaging_project_source_materials psm JOIN packaging_source_material_templates smt ON smt.packaging_source_material_template_id=psm.packaging_source_material_template_id LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE psm.packaging_project_id=? ORDER BY psm.sort_order,psm.packaging_project_source_material_id`).bind(projectId).all()).map(mapSourceMaterial);}catch{try{sourceMaterials=rows(await db.prepare(`SELECT psm.packaging_project_source_material_id,psm.material_role,psm.sort_order,psm.source_snapshot_json,psm.review_status AS project_source_review_status,psm.notes AS project_source_notes,smt.* FROM packaging_project_source_materials psm JOIN packaging_source_material_templates smt ON smt.packaging_source_material_template_id=psm.packaging_source_material_template_id WHERE psm.packaging_project_id=? ORDER BY psm.sort_order,psm.packaging_project_source_material_id`).bind(projectId).all()).map(mapSourceMaterial);}catch{}}
  const template=mapTemplate({...row,packaging_template_id:row.packaging_template_id,package_type:row.template_package_type,description:row.template_description,is_system:row.template_is_system,layout_json:row.template_layout_json,theme_json:row.template_theme_json});
  const project=mapProject(row);
  if(soapProduct){project.rose_asset_id=soapProduct.rose_asset_id;project.net_weight_oz=soapProduct.net_weight_oz;project.net_weight_g=soapProduct.net_weight_g;}
  const componentCostCents=components.reduce((sum,row)=>sum+Math.round(number(row.unit_cost_cents)*number(row.quantity_per_finished_unit,1)*(1+number(row.wastage_percent)/100)),0);
  return{project,template,soap_product:soapProduct||null,ingredients,structured_claims:claims,source_materials:sourceMaterials,components,component_summary:{active_count:components.length,estimated_unit_cost_cents:componentCostCents,lot_tracked_count:components.filter((row)=>Number(row.lot_tracking_required)===1).length},versions,exports,soap_exports:soapExports,print_tests:printTests,preflight:packagingRequiredFields(project,ingredients,claims,template,sourceMaterials)};
}

function snapshotFromBody(body,existing={}){
  const claims=Array.isArray(body.claims)?body.claims.map((v)=>text(v,100)).filter(Boolean):safeJson(body.claims_json,existing.claims||[]);
  const icons=Array.isArray(body.icons)?body.icons.map((v)=>text(v,100)).filter(Boolean):safeJson(body.icons_json,existing.icons||[]);
  const theme=body.theme&&typeof body.theme==='object'?body.theme:safeJson(body.theme_json,existing.theme||{});
  const artwork=body.artwork&&typeof body.artwork==='object'?body.artwork:safeJson(body.artwork_json,existing.artwork||{});
  artwork.rose_asset_id=text(body.rose_asset_id||artwork.rose_asset_id||existing.rose_asset_id||'rose-purple-v1',120);
  const requestedPackageType=text(body.package_type||existing.package_type,80)||'soap_ribbon';
  if(requestedPackageType==='soap_ribbon'&&String(artwork.artwork_asset||'')==='/assets/packaging/artwork/soap-botanical-purple-rose-v1.png')artwork.artwork_asset='';
  return{
    packaging_template_id:id(body.packaging_template_id||existing.packaging_template_id),product_id:id(body.product_id)||null,
    project_name:text(body.project_name||existing.project_name,180),package_type:requestedPackageType,
    project_status:VALID_PROJECT_STATUSES.has(text(body.project_status,30))?text(body.project_status,30):'draft',
    collection_name:text(body.collection_name,160)||null,product_name:text(body.product_name,180),product_subtitle:text(body.product_subtitle,220)||null,
    product_identity_en:text(body.product_identity_en,180)||null,product_identity_fr:text(body.product_identity_fr,180)||null,
    ingredients_inci:text(body.ingredients_inci,8000)||null,ingredients_en:text(body.ingredients_en,8000)||null,ingredients_fr:text(body.ingredients_fr,8000)||null,
    net_quantity_text:text(body.net_quantity_text,80)||null,net_weight_oz:number(body.net_weight_oz,0)||null,net_weight_g:number(body.net_weight_g,0)||null,
    website_text:text(body.website_text,220)||null,dealer_name:text(body.dealer_name,220)||null,dealer_address:text(body.dealer_address,500)||null,contact_text:text(body.contact_text,300)||null,made_in_canada_text:text(body.made_in_canada_text,180)||null,
    claims,warnings_en:text(body.warnings_en,2000)||null,warnings_fr:text(body.warnings_fr,2000)||null,icons,theme,artwork,
    print_notes:text(body.print_notes,3000)||null,compliance_status:VALID_COMPLIANCE.has(text(body.compliance_status,40))?text(body.compliance_status,40):'needs_review',
    structured_ingredients:normalizeIngredients(body.structured_ingredients),structured_claims:normalizeClaims(body.structured_claims)
  };
}

async function syncPackagingStructuredData(db,projectId,data){
  try{
    if(Array.isArray(data.structured_ingredients)){
      await db.prepare(`DELETE FROM packaging_project_ingredients WHERE packaging_project_id=?`).bind(projectId).run();
      for(const row of data.structured_ingredients)await db.prepare(`INSERT INTO packaging_project_ingredients (packaging_project_id,sort_order,inci_name,display_name_en,display_name_fr,organic_flag,allergen_note,required_on_label,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(projectId,row.sort_order,row.inci_name,row.display_name_en,row.display_name_fr,row.organic_flag,row.allergen_note,row.required_on_label).run();
    }
    if(Array.isArray(data.structured_claims)){
      await db.prepare(`DELETE FROM packaging_project_claims WHERE packaging_project_id=?`).bind(projectId).run();
      for(const row of data.structured_claims)await db.prepare(`INSERT INTO packaging_project_claims (packaging_project_id,sort_order,claim_en,claim_fr,icon_name,is_approved,compliance_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(projectId,row.sort_order,row.claim_en,row.claim_fr,row.icon_name,row.is_approved,row.compliance_note).run();
    }
  }catch(error){throw new Error('Build 255 packaging structured-content migration is required before saving ingredients/claims for all label types.');}
}

async function syncSoapRecords(db,projectId,data){
  await syncPackagingStructuredData(db,projectId,data);
  if(data.package_type!=='soap_ribbon')return null;
  const madeParts=String(data.made_in_canada_text||'').split('/').map((value)=>text(value,120).trim()).filter(Boolean);
  await db.prepare(`INSERT INTO soap_products (packaging_project_id,product_id,product_name,product_family,soap_type,description_en,description_fr,net_weight_oz,net_weight_g,accent_colour,secondary_colour,rose_colour,rose_asset_id,website,made_in_text_en,made_in_text_fr,print_status,compliance_status,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(packaging_project_id) DO UPDATE SET product_id=excluded.product_id,product_name=excluded.product_name,product_family=excluded.product_family,soap_type=excluded.soap_type,description_en=excluded.description_en,description_fr=excluded.description_fr,net_weight_oz=excluded.net_weight_oz,net_weight_g=excluded.net_weight_g,accent_colour=excluded.accent_colour,secondary_colour=excluded.secondary_colour,rose_colour=excluded.rose_colour,rose_asset_id=excluded.rose_asset_id,website=excluded.website,made_in_text_en=excluded.made_in_text_en,made_in_text_fr=excluded.made_in_text_fr,print_status=excluded.print_status,compliance_status=excluded.compliance_status,active=1,updated_at=CURRENT_TIMESTAMP`).bind(projectId,data.product_id,data.product_name,data.collection_name,data.product_identity_en,data.ingredients_en,data.ingredients_fr,data.net_weight_oz,data.net_weight_g,text(data.theme?.border_colour,30)||null,text(data.theme?.secondary_colour||data.theme?.accent_gold,30)||null,text(data.theme?.rose_colour,30)||null,text(data.artwork?.rose_asset_id,120)||'rose-purple-v1',data.website_text||'devilndove.com',madeParts[0]||'Made in Canada',madeParts[1]||'Fabriqué au Canada',data.project_status==='approved'?'approved':'draft',data.compliance_status).run();
  const soap=await db.prepare(`SELECT soap_product_id FROM soap_products WHERE packaging_project_id=?`).bind(projectId).first();
  if(!soap)return null;
  if(Array.isArray(data.structured_ingredients)){
    await db.prepare(`DELETE FROM soap_ingredients WHERE soap_product_id=?`).bind(soap.soap_product_id).run();
    for(const row of data.structured_ingredients)await db.prepare(`INSERT INTO soap_ingredients (soap_product_id,sort_order,inci_name,display_name_en,display_name_fr,organic_flag,allergen_note,required_on_label,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(soap.soap_product_id,row.sort_order,row.inci_name,row.display_name_en,row.display_name_fr,row.organic_flag,row.allergen_note,row.required_on_label).run();
  }
  if(Array.isArray(data.structured_claims)){
    await db.prepare(`DELETE FROM soap_label_claims WHERE soap_product_id=?`).bind(soap.soap_product_id).run();
    for(const row of data.structured_claims)await db.prepare(`INSERT INTO soap_label_claims (soap_product_id,sort_order,claim_en,claim_fr,icon_name,is_approved,compliance_note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(soap.soap_product_id,row.sort_order,row.claim_en,row.claim_fr,row.icon_name,row.is_approved,row.compliance_note).run();
  }
  return soap;
}

export async function onRequestGet(context){
  const a=await access(context);if(a.error)return a.error;
  try{
    const projectId=id(new URL(context.request.url).searchParams.get('packaging_project_id'));
    return json({ok:true,build:BUILD,...await listData(a.db),detail:projectId?await loadDetail(a.db,projectId):null,mode:'material_library_all_packaging_structured_content_truth_reference_review_first'});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'packaging_studio',incident_code:'packaging_studio_get_failed',severity:'error',message:error?.message||'Packaging Studio failed to load.',related_user_id:a.adminUser.user_id,details:{error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,error:'Packaging Studio could not load. Your browser draft remains available.'},500);
  }
}

export async function onRequestPost(context){
  const a=await access(context);if(a.error)return a.error;
  let body={};try{body=await context.request.json()}catch{return json({ok:false,error:'Invalid JSON body.'},400)}
  const action=text(body.action,60).toLowerCase();
  try{
    let projectId=id(body.packaging_project_id);let message='Saved.';let deletedProjectKey='';let deletedProjectName='';let deletedProjectId=0;
    if(action==='record_translation_draft'){
      if(!projectId)throw new Error('Save the packaging project before recording a French draft review.');
      const project=await a.db.prepare(`SELECT packaging_project_id FROM packaging_projects WHERE packaging_project_id=? LIMIT 1`).bind(projectId).first();
      if(!project)throw new Error('Packaging project was not found.');
      const drafts=Array.isArray(body.drafts)?body.drafts.slice(0,30):[];
      for(const draft of drafts){
        const fieldKey=text(draft?.field_key,120);const sourceText=text(draft?.source_text,4000);const generatedText=text(draft?.generated_text,4000);
        if(!fieldKey||!generatedText)continue;
        await a.db.prepare(`INSERT OR IGNORE INTO packaging_translation_reviews(
          packaging_project_id,field_key,source_text,generated_text,generator_key,review_status,created_by_user_id,created_at,updated_at
        ) VALUES(?,?,?,?, 'curated_bilingual_v246','needs_review',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(projectId,fieldKey,sourceText,generatedText,a.adminUser.user_id).run();
      }
      message='French draft provenance recorded. Human review is still required before packaging approval.';
    }else if(action==='save_source_material_template'){
      try{await a.db.prepare(`SELECT packaging_source_material_template_id FROM packaging_source_material_metadata LIMIT 1`).first();}catch{throw new Error('Build 255 source-material metadata migration is required before saving Material Library categories.');}
      const sourceId=id(body.packaging_source_material_template_id);const materialType=text(body.material_type,40);if(!VALID_SOURCE_MATERIAL_TYPES.has(materialType))throw new Error('Choose soap base, fragrance oil, colourant, or additive.');
      const materialName=text(body.material_name,180);if(!materialName)throw new Error('A purchased/source material name is required.');
      const masterInci=normalizeSourceInci(body.master_inci);const benefits=normalizeBenefits(body.benefits);const supplierClaims=normalizeSourceClaims(body.supplier_claims);const allergens=normalizeFragranceAllergens(body.fragrance_allergens);
      const verification=VALID_SOURCE_VERIFICATION.has(text(body.verification_status,40))?text(body.verification_status,40):'needs_review';
      const productFamily=text(body.product_family,80)||'general';const materialSubtype=text(body.material_subtype,80)||materialType;const requestedRole=text(body.default_role,40);const defaultRole=['base','fragrance','colourant','additive'].includes(requestedRole)?requestedRole:sourceRole(materialType);const colourHex=/^#[0-9a-f]{6}$/i.test(text(body.colour_hex,20))?text(body.colour_hex,20).toUpperCase():null;let savedSourceId=sourceId;
      let fragranceReview=VALID_FRAGRANCE_REVIEW.has(text(body.fragrance_allergen_review_status,50))?text(body.fragrance_allergen_review_status,50):(materialType==='fragrance_oil'?'needs_supplier_data':'not_applicable');
      if(materialType!=='fragrance_oil'&&fragranceReview==='needs_supplier_data')fragranceReview='not_applicable';
      const intendedUse=['rinse_off','leave_on','both','not_applicable'].includes(text(body.intended_use,40))?text(body.intended_use,40):(materialType==='soap_base'?'rinse_off':'not_applicable');
      if(sourceId){
        const existingSource=await a.db.prepare(`SELECT is_system FROM packaging_source_material_templates WHERE packaging_source_material_template_id=?`).bind(sourceId).first();if(!existingSource)throw new Error('Source-material template was not found.');if(Number(existingSource.is_system)===1)throw new Error('Built-in source-material templates are protected. Save a new custom copy instead.');
        await a.db.prepare(`UPDATE packaging_source_material_templates SET material_name=?,material_type=?,supplier_name=?,supplier_sku=?,supplier_product_name=?,source_url=?,source_image_url=?,supplier_document_url=?,source_reference=?,intended_use=?,ingredient_declaration_raw=?,master_inci_json=?,allergen_statement=?,fragrance_allergens_json=?,fragrance_allergen_review_status=?,benefits_json=?,supplier_claims_json=?,usage_notes=?,compliance_notes=?,verification_status=?,verified_by_user_id=?,verified_at=CASE WHEN ? IN ('supplier_verified','owner_verified') THEN CURRENT_TIMESTAMP ELSE verified_at END,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_source_material_template_id=?`).bind(materialName,materialType,text(body.supplier_name,180)||null,text(body.supplier_sku,180)||null,text(body.supplier_product_name,220)||null,text(body.source_url,1000)||null,text(body.source_image_url,1000)||null,text(body.supplier_document_url,1000)||null,text(body.source_reference,500)||null,intendedUse,text(body.ingredient_declaration_raw,8000)||null,JSON.stringify(masterInci),text(body.allergen_statement,5000)||null,JSON.stringify(allergens),fragranceReview,JSON.stringify(benefits),JSON.stringify(supplierClaims),text(body.usage_notes,5000)||null,text(body.compliance_notes,5000)||null,verification,verification==='supplier_verified'||verification==='owner_verified'?a.adminUser.user_id:null,verification,a.adminUser.user_id,sourceId).run();
        message=`Source-material template “${materialName}” updated.`;
      }else{
        const materialKey=`custom-${materialType}-${keyPart(materialName)}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,4)}`;
        const insertedSource=await a.db.prepare(`INSERT INTO packaging_source_material_templates (material_key,material_name,material_type,supplier_name,supplier_sku,supplier_product_name,source_url,source_image_url,supplier_document_url,source_reference,intended_use,ingredient_declaration_raw,master_inci_json,allergen_statement,fragrance_allergens_json,fragrance_allergen_review_status,benefits_json,supplier_claims_json,usage_notes,compliance_notes,verification_status,verified_by_user_id,verified_at,is_system,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,CASE WHEN ? IN ('supplier_verified','owner_verified') THEN CURRENT_TIMESTAMP ELSE NULL END,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(materialKey,materialName,materialType,text(body.supplier_name,180)||null,text(body.supplier_sku,180)||null,text(body.supplier_product_name,220)||null,text(body.source_url,1000)||null,text(body.source_image_url,1000)||null,text(body.supplier_document_url,1000)||null,text(body.source_reference,500)||null,intendedUse,text(body.ingredient_declaration_raw,8000)||null,JSON.stringify(masterInci),text(body.allergen_statement,5000)||null,JSON.stringify(allergens),fragranceReview,JSON.stringify(benefits),JSON.stringify(supplierClaims),text(body.usage_notes,5000)||null,text(body.compliance_notes,5000)||null,verification,verification==='supplier_verified'||verification==='owner_verified'?a.adminUser.user_id:null,verification,a.adminUser.user_id,a.adminUser.user_id).run();
        savedSourceId=id(insertedSource.meta?.last_row_id);message=`Source-material template “${materialName}” saved for reuse.`;
      }
      if(savedSourceId){
        try{await a.db.prepare(`INSERT INTO packaging_source_material_metadata (packaging_source_material_template_id,product_family,material_subtype,default_role,colour_hex,created_at,updated_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(packaging_source_material_template_id) DO UPDATE SET product_family=excluded.product_family,material_subtype=excluded.material_subtype,default_role=excluded.default_role,colour_hex=excluded.colour_hex,updated_at=CURRENT_TIMESTAMP`).bind(savedSourceId,productFamily,materialSubtype,defaultRole,colourHex).run();}
        catch(error){throw new Error('Build 255 source-material metadata migration is required before saving material categories.');}
      
        const inventoryId=id(body.site_item_inventory_id);
        if(inventoryId){
          const inventoryRow=await a.db.prepare(`SELECT site_item_inventory_id,item_name FROM site_item_inventory WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1`).bind(inventoryId).first();
          if(!inventoryRow)throw new Error('The selected inventory item is no longer available.');
          const linkRole=materialSubtype==='soap_base'?'soap_base':defaultRole==='fragrance'?'fragrance':defaultRole==='colourant'?'colourant':defaultRole==='additive'?'additive':'source_material';
          await a.db.prepare(`DELETE FROM inventory_source_material_links WHERE site_item_inventory_id=? AND link_role=? AND packaging_source_material_template_id<>?`).bind(inventoryId,linkRole,savedSourceId).run().catch(()=>null);await a.db.prepare(`INSERT INTO inventory_source_material_links(site_item_inventory_id,packaging_source_material_template_id,link_role,notes,created_by_user_id,created_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id,packaging_source_material_template_id,link_role) DO UPDATE SET notes=excluded.notes`).bind(inventoryId,savedSourceId,linkRole,'Linked from Packaging Studio; reuse inventory source metadata before external re-import.',a.adminUser.user_id).run().catch(()=>null);
        }
        await syncSourceMaterialReusableContent(a.db,savedSourceId,materialName,materialType,materialSubtype,masterInci,verification,a.adminUser.user_id);
      }
    }else if(action==='delete_source_material_template'){
      const sourceId=id(body.packaging_source_material_template_id);if(!sourceId)throw new Error('Source-material template is required.');
      const source=await a.db.prepare(`SELECT material_name,is_system FROM packaging_source_material_templates WHERE packaging_source_material_template_id=?`).bind(sourceId).first();if(!source)throw new Error('Source-material template was not found.');if(Number(source.is_system)===1)throw new Error('Built-in source-material templates cannot be deleted.');
      await a.db.prepare(`UPDATE packaging_source_material_templates SET is_active=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_source_material_template_id=?`).bind(a.adminUser.user_id,sourceId).run();message=`Source-material template “${source.material_name}” removed from the active library.`;
    }else if(action==='apply_source_material_template'){
      if(!projectId)throw new Error('Save or open a packaging project before attaching a purchased/source material.');
      const sourceId=id(body.packaging_source_material_template_id);if(!sourceId)throw new Error('Choose a source-material template first.');
      let source=await a.db.prepare(`SELECT smt.*,smm.product_family,smm.material_subtype,smm.default_role,smm.colour_hex FROM packaging_source_material_templates smt LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE smt.packaging_source_material_template_id=? AND smt.is_active=1`).bind(sourceId).first().catch(()=>null);if(!source)source=await a.db.prepare(`SELECT * FROM packaging_source_material_templates WHERE packaging_source_material_template_id=? AND is_active=1`).bind(sourceId).first();if(!source)throw new Error('Source-material template was not found.');
      const role=sourceRole(String(source.material_type||''),String(source.default_role||''));const reviewStatus=String(source.verification_status||'needs_review')==='blocked'?'blocked':(['supplier_verified','owner_verified'].includes(String(source.verification_status||''))?'reviewed':'needs_review');
      if(role==='base')await a.db.prepare(`DELETE FROM packaging_project_source_materials WHERE packaging_project_id=? AND material_role='base'`).bind(projectId).run();
      await a.db.prepare(`INSERT INTO packaging_project_source_materials (packaging_project_id,packaging_source_material_template_id,material_role,sort_order,source_snapshot_json,review_status,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(packaging_project_id,packaging_source_material_template_id,material_role) DO UPDATE SET source_snapshot_json=excluded.source_snapshot_json,review_status=excluded.review_status,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(projectId,sourceId,role,role==='base'?1:10,JSON.stringify(mapSourceMaterial(source)),reviewStatus,a.adminUser.user_id,a.adminUser.user_id).run();
      message=`Source-material template “${source.material_name}” attached to this packaging project. Review inherited ingredients and supplier evidence before approval.`;
    }else if(action==='detach_source_material_template'){
      if(!projectId)throw new Error('Packaging project is required.');const sourceId=id(body.packaging_source_material_template_id);if(!sourceId)throw new Error('Source-material template is required.');
      await a.db.prepare(`DELETE FROM packaging_project_source_materials WHERE packaging_project_id=? AND packaging_source_material_template_id=?`).bind(projectId,sourceId).run();message='Source-material link removed from this project. Existing draft ingredient/claim rows were left unchanged for deliberate review.';
    }else if(action==='save_formula_library'){
      const formulaId=id(body.packaging_formula_library_id);
      const formulaName=text(body.formula_name,180);if(!formulaName)throw new Error('A formula-library name is required.');
      const ingredients=normalizeIngredients(body.structured_ingredients);if(!ingredients.length)throw new Error('Add at least one ingredient before saving a formula-library entry.');
      const sourceMaterialTemplateId=id(body.source_material_template_id);let savedFormulaId=formulaId;
      if(sourceMaterialTemplateId){
        let sourceBase=await a.db.prepare(`SELECT smt.material_type,smt.is_active,smm.default_role,smm.material_subtype FROM packaging_source_material_templates smt LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE smt.packaging_source_material_template_id=?`).bind(sourceMaterialTemplateId).first().catch(()=>null);if(!sourceBase)sourceBase=await a.db.prepare(`SELECT material_type,is_active FROM packaging_source_material_templates WHERE packaging_source_material_template_id=?`).bind(sourceMaterialTemplateId).first();
        if(!sourceBase||Number(sourceBase.is_active)!==1)throw new Error('The selected source-material template is unavailable.');
        if(sourceRole(String(sourceBase.material_type||''),String(sourceBase.default_role||''))!=='base')throw new Error('A finished formula can inherit only a source template classified as a base (for example soap base or candle wax). Attach fragrance oils, colourants and additives separately.');
      }
      const formulaKey=formulaId?'':`custom-formula-${keyPart(formulaName)}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,4)}`;
      if(formulaId){
        const existingFormula=await a.db.prepare(`SELECT is_system FROM packaging_formula_library WHERE packaging_formula_library_id=?`).bind(formulaId).first();
        if(!existingFormula)throw new Error('Formula-library entry was not found.');
        if(Number(existingFormula.is_system)===1)throw new Error('System formula presets cannot be overwritten. Save a new custom formula instead.');
        await a.db.prepare(`UPDATE packaging_formula_library SET formula_name=?,product_family=?,product_identity_en=?,product_identity_fr=?,default_rose_asset_id=?,default_rose_colour=?,ingredients_json=?,notes=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_formula_library_id=?`).bind(formulaName,text(body.product_family,180)||null,text(body.product_identity_en,180)||null,text(body.product_identity_fr,180)||null,text(body.default_rose_asset_id,120)||null,text(body.default_rose_colour,30)||null,JSON.stringify(ingredients),text(body.notes,2000)||null,a.adminUser.user_id,formulaId).run();
        message=`Formula library “${formulaName}” updated.`;
      }else{
        const insertedFormula=await a.db.prepare(`INSERT INTO packaging_formula_library (formula_key,formula_name,product_family,product_identity_en,product_identity_fr,default_rose_asset_id,default_rose_colour,ingredients_json,notes,is_system,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(formulaKey,formulaName,text(body.product_family,180)||null,text(body.product_identity_en,180)||null,text(body.product_identity_fr,180)||null,text(body.default_rose_asset_id,120)||null,text(body.default_rose_colour,30)||null,JSON.stringify(ingredients),text(body.notes,2000)||null,a.adminUser.user_id,a.adminUser.user_id).run();
        savedFormulaId=id(insertedFormula.meta?.last_row_id);message=`Formula library “${formulaName}” saved for reuse.`;
      }
      if(savedFormulaId){
        await a.db.prepare(`DELETE FROM packaging_formula_source_material_links WHERE packaging_formula_library_id=? AND material_role='base'`).bind(savedFormulaId).run().catch(()=>null);
        if(sourceMaterialTemplateId)await a.db.prepare(`INSERT OR IGNORE INTO packaging_formula_source_material_links (packaging_formula_library_id,packaging_source_material_template_id,material_role,created_at) VALUES (?,?,'base',CURRENT_TIMESTAMP)`).bind(savedFormulaId,sourceMaterialTemplateId).run().catch(()=>null);
      }
    }else if(action==='delete_formula_library'){
      const formulaId=id(body.packaging_formula_library_id);if(!formulaId)throw new Error('Formula-library entry is required.');
      const formula=await a.db.prepare(`SELECT formula_name,is_system FROM packaging_formula_library WHERE packaging_formula_library_id=?`).bind(formulaId).first();if(!formula)throw new Error('Formula-library entry was not found.');if(Number(formula.is_system)===1)throw new Error('System formula presets cannot be deleted.');
      await a.db.prepare(`UPDATE packaging_formula_library SET is_active=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_formula_library_id=?`).bind(a.adminUser.user_id,formulaId).run();
      message=`Formula library “${formula.formula_name}” removed from the active library.`;
    }else if(action==='save_content_library'){
      const contentId=id(body.packaging_content_library_id);const contentType=text(body.content_type,40);
      if(!new Set(['ingredient','fragrance_oil','colourant','claim']).has(contentType))throw new Error('Choose ingredient, fragrance oil, colourant, or claim.');
      const itemName=text(body.item_name,180);if(!itemName)throw new Error('A library item name is required.');
      const metadata=body.metadata&&typeof body.metadata==='object'?body.metadata:{};
      if(contentId){
        const existingContent=await a.db.prepare(`SELECT is_system FROM packaging_content_library WHERE packaging_content_library_id=?`).bind(contentId).first();if(!existingContent)throw new Error('Library item was not found.');if(Number(existingContent.is_system)===1)throw new Error('System library presets cannot be overwritten. Save a new custom item instead.');
        await a.db.prepare(`UPDATE packaging_content_library SET content_type=?,item_name=?,text_en=?,text_fr=?,inci_name=?,icon_name=?,metadata_json=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_content_library_id=?`).bind(contentType,itemName,text(body.text_en,500)||null,text(body.text_fr,500)||null,text(body.inci_name,300)||null,text(body.icon_name,80)||null,JSON.stringify(metadata),a.adminUser.user_id,contentId).run();
        message=`Library item “${itemName}” updated.`;
      }else{
        const contentKey=`custom-${contentType}-${keyPart(itemName)}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,4)}`;
        await a.db.prepare(`INSERT INTO packaging_content_library (content_key,content_type,item_name,text_en,text_fr,inci_name,icon_name,metadata_json,is_system,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(contentKey,contentType,itemName,text(body.text_en,500)||null,text(body.text_fr,500)||null,text(body.inci_name,300)||null,text(body.icon_name,80)||null,JSON.stringify(metadata),a.adminUser.user_id,a.adminUser.user_id).run();
        message=`Library item “${itemName}” saved for reuse.`;
      }
    }else if(action==='delete_content_library'){
      const contentId=id(body.packaging_content_library_id);if(!contentId)throw new Error('Library item is required.');
      const item=await a.db.prepare(`SELECT item_name,is_system FROM packaging_content_library WHERE packaging_content_library_id=?`).bind(contentId).first();if(!item)throw new Error('Library item was not found.');if(Number(item.is_system)===1)throw new Error('System library presets cannot be deleted.');
      await a.db.prepare(`UPDATE packaging_content_library SET is_active=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_content_library_id=?`).bind(a.adminUser.user_id,contentId).run();
      message=`Library item “${item.item_name}” removed from the active library.`;
    }else if(action==='save_as_template'){
      if(!projectId)throw new Error('Open a packaging project before saving a reusable template.');
      const current=await a.db.prepare('SELECT packaging_project_id FROM packaging_projects WHERE packaging_project_id=?1').bind(projectId).first();if(!current)throw new Error('Packaging project was not found.');
      const templateName=text(body.template_name,180);if(!templateName)throw new Error('A reusable template name is required.');
      const packageType=VALID_PACKAGE_TYPES.has(text(body.package_type,60))?text(body.package_type,60):'product_label';
      const width=boundedDimension(body.page_width_mm,88.9);const height=boundedDimension(body.page_height_mm,50.8);
      const frontWidth=boundedDimension(body.front_width_mm,width);const frontHeight=boundedDimension(body.front_height_mm,height);
      const rearWidth=Math.max(0,Math.min(1200,number(body.rear_width_mm,0)));const rearHeight=Math.max(0,Math.min(1200,number(body.rear_height_mm,0)));
      const allowedShapes=new Set(['rectangle','round','oval','soap_wrap']);const shape=allowedShapes.has(text(body.shape,30))?text(body.shape,30):(packageType==='candle_top'||packageType==='engraved_round'?'round':'rectangle');
      const allowedProfiles=new Set(['soap_reference_v2','soap_reference_v3','candle_top_wedding','candle_top_centered','round_maker_mark','general_centered','general_rectangle']);
      const requestedDesignProfile=allowedProfiles.has(text(body.design_profile,60))?text(body.design_profile,60):(shape==='round'?'candle_top_centered':'general_centered');const designProfile=packageType==='soap_ribbon'?'soap_reference_v3':requestedDesignProfile;
      const existingLayout=body.layout&&typeof body.layout==='object'?body.layout:{};
      const layout={...existingLayout,shape,design_profile:designProfile,bleed_mm:Math.max(0,Math.min(25,number(body.bleed_mm,2))),safe_margin_mm:Math.max(0,Math.min(50,number(body.safe_margin_mm,4)))};
      if(shape==='round')layout.diameter_mm=Math.min(width,height);
      const theme=body.theme&&typeof body.theme==='object'?body.theme:{};
      const templateKey=`custom-${keyPart(templateName)}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0,4)}`;
      const inserted=await a.db.prepare(`INSERT INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active,created_by_user_id,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,0,1,?13,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(templateKey,templateName,packageType,text(body.description,1000)||'Reusable owner-created Labeling & Packaging template.',width,height,frontWidth,frontHeight,rearWidth,rearHeight,JSON.stringify(layout),JSON.stringify(theme),a.adminUser.user_id).run();
      const templateId=id(inserted.meta?.last_row_id);if(!templateId)throw new Error('The reusable template could not be identified after saving.');
      await a.db.prepare(`UPDATE packaging_projects SET packaging_template_id=?1,package_type=?2,updated_by_user_id=?3,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?4`).bind(templateId,packageType,a.adminUser.user_id,projectId).run();
      message=`Reusable template “${templateName}” saved and attached to this project.`;
    }else if(action==='create_project'){
      const templateId=id(body.packaging_template_id)||(await a.db.prepare(`SELECT packaging_template_id FROM packaging_templates WHERE is_active=1 ORDER BY CASE WHEN template_key='soap-ribbon-glacial-approved-v1' THEN 0 ELSE 1 END,is_system DESC,packaging_template_id LIMIT 1`).first())?.packaging_template_id;
      const productId=id(body.product_id)||null;
      const product=productId?await a.db.prepare(`SELECT product_id,name,product_category,short_description,description,weight_grams FROM products WHERE product_id=?`).bind(productId).first():null;
      const productName=text(body.product_name||product?.name,180);if(!productName)throw new Error('A product or packaging project name is required.');
      const key=`PKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
      const template=await a.db.prepare(`SELECT * FROM packaging_templates WHERE packaging_template_id=? AND is_active=1`).bind(templateId).first();if(!template)throw new Error('Packaging template was not found.');
      const theme=safeJson(template.theme_json,{});const layout=safeJson(template.layout_json,{});const rosePreset=productRosePreset(body.collection_name||productName);if(template.package_type==='soap_ribbon'){theme.rose_colour=rosePreset.colour;theme.secondary_colour=rosePreset.colour;}const artwork={rose_asset_id:template.package_type==='soap_ribbon'?rosePreset.asset:'rose-purple-v1',badge_shape:layout.shape==='oval'?'oval':'oval',rose_style:'full_rose',top_arc_text:layout.default_top_arc_text||'',bottom_arc_text:layout.default_bottom_arc_text||'',candle_primary_text:layout.default_primary_text||'',candle_date_line_1:layout.default_date_line_1||'',candle_event_line:layout.default_event_line||'',candle_date_line_2:layout.default_date_line_2||'',artwork_asset:template.package_type==='soap_ribbon'?'':(layout.artwork_asset||'')};
      const result=await a.db.prepare(`INSERT INTO packaging_projects (project_key,product_id,packaging_template_id,project_name,package_type,project_status,collection_name,product_name,product_subtitle,product_identity_en,product_identity_fr,net_quantity_text,website_text,dealer_name,contact_text,made_in_canada_text,theme_json,artwork_json,compliance_status,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,'draft',?,?,?,?,?,?,?,?,?,?,?,?, 'needs_review',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(key,productId,templateId,text(body.project_name||`${productName} packaging`,180),template.package_type||'soap_ribbon',text(body.collection_name||productName,160),productName,text(body.product_subtitle||product?.short_description,220)||null,text(body.product_identity_en||productName,180),text(body.product_identity_fr,180)||null,text(body.net_quantity_text||(product?.weight_grams?`${product.weight_grams} g`:''),80)||null,text(body.website_text||'devilndove.com',220),text(body.dealer_name||'Rosevear Creations - Devil n Dove',220),text(body.contact_text||'devilndove.com/contact',300),text(body.made_in_canada_text||'Made in Canada / Fabriqué au Canada',180),JSON.stringify(theme),JSON.stringify(artwork),a.adminUser.user_id,a.adminUser.user_id).run();
      projectId=id(result.meta?.last_row_id);
      let seededIngredients=[];
      if(template.package_type==='soap_ribbon'&&productId){
        seededIngredients=rows(await a.db.prepare(`
          SELECT COALESCE(prip.inci_name,'') inci_name,
                 COALESCE(prip.ingredient_name_en,sii.item_name,prl.source_key,'') display_name_en,
                 COALESCE(prip.ingredient_name_fr,'') display_name_fr,
                 COALESCE(prip.label_sort_order,prl.sort_order,0) sort_order
          FROM product_resource_links prl
          INNER JOIN product_resource_ingredient_profiles prip
            ON prip.product_resource_link_id=prl.product_resource_link_id
           AND COALESCE(prip.is_label_ingredient,0)=1
          LEFT JOIN site_item_inventory sii
            ON LOWER(TRIM(COALESCE(sii.source_type,'')))=LOWER(TRIM(prl.resource_kind))
           AND sii.external_key=prl.source_key AND COALESCE(sii.is_active,1)=1
          WHERE prl.product_id=?
          ORDER BY COALESCE(prip.label_sort_order,prl.sort_order,0),prl.product_resource_link_id
        `).bind(productId).all().catch(()=>({results:[]}))).map((row,index)=>({
          sort_order:index+1,inci_name:text(row.inci_name,240),display_name_en:text(row.display_name_en,240),display_name_fr:text(row.display_name_fr,240),
          organic_flag:0,allergen_note:null,required_on_label:1
        }));
        if(seededIngredients.length){
          const inci=seededIngredients.map((row)=>row.inci_name).filter(Boolean).join(', ');
          const en=seededIngredients.map((row)=>row.display_name_en||row.inci_name).filter(Boolean).join(', ');
          const fr=seededIngredients.map((row)=>row.display_name_fr||row.inci_name).filter(Boolean).join(', ');
          await a.db.prepare(`UPDATE packaging_projects SET ingredients_inci=?,ingredients_en=?,ingredients_fr=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(inci||null,en||null,fr||null,projectId).run();
        }
      }
      const created=mapProject(await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first());
      await syncSoapRecords(a.db,projectId,{...created,net_weight_g:number(product?.weight_grams)||null,structured_ingredients:seededIngredients,structured_claims:[]});
      message=template.package_type==='soap_ribbon'?'Soap-label project created from the approved reference structure; marked product ingredients were carried into the review draft.':template.package_type==='candle_top'?'Editable candle-top project created from the selected round template.':'Labeling and packaging project created from the selected business-wide template.';
    }else if(action==='save_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      const existing=await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!existing)throw new Error('Packaging project was not found.');
      const data=snapshotFromBody(body,mapProject(existing));if(!data.packaging_template_id||!data.project_name||!data.product_name)throw new Error('Template, project name and product name are required.');
      const template=mapTemplate(await a.db.prepare(`SELECT * FROM packaging_templates WHERE packaging_template_id=? AND is_active=1`).bind(data.packaging_template_id).first()||{});
      if(!template.packaging_template_id)throw new Error('The selected packaging template was not found or is inactive.');
      data.package_type=template.package_type;
      const preflight=packagingRequiredFields(data,data.structured_ingredients,data.structured_claims,template);
      if((data.project_status==='approved'||data.compliance_status==='approved')&&(preflight.missing.length||preflight.dimension_blockers.length))throw new Error(`Packaging cannot be approved while blockers remain: ${[...preflight.missing,...preflight.dimension_blockers].join(', ')}.`);
      await a.db.prepare(`UPDATE packaging_projects SET product_id=?,packaging_template_id=?,project_name=?,package_type=?,project_status=?,collection_name=?,product_name=?,product_subtitle=?,product_identity_en=?,product_identity_fr=?,ingredients_inci=?,ingredients_en=?,ingredients_fr=?,net_quantity_text=?,website_text=?,dealer_name=?,dealer_address=?,contact_text=?,made_in_canada_text=?,claims_json=?,warnings_en=?,warnings_fr=?,icons_json=?,theme_json=?,artwork_json=?,print_notes=?,compliance_status=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(data.product_id,data.packaging_template_id,data.project_name,data.package_type,data.project_status,data.collection_name,data.product_name,data.product_subtitle,data.product_identity_en,data.product_identity_fr,data.ingredients_inci,data.ingredients_en,data.ingredients_fr,data.net_quantity_text,data.website_text,data.dealer_name,data.dealer_address,data.contact_text,data.made_in_canada_text,jsonText(data.claims,[]),data.warnings_en,data.warnings_fr,jsonText(data.icons,[]),jsonText(data.theme,{}),jsonText(data.artwork,{}),data.print_notes,data.compliance_status,a.adminUser.user_id,projectId).run();
      await syncSoapRecords(a.db,projectId,data);
      message='Labeling and packaging project, structured content, claims and artwork selection saved to D1.';
    }else if(action==='save_components'){
      if(!projectId)throw new Error('Packaging project is required.');
      const project=await a.db.prepare(`SELECT packaging_project_id FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!project)throw new Error('Packaging project was not found.');
      const components=Array.isArray(body.components)?body.components.slice(0,100):[];
      await a.db.prepare(`UPDATE packaging_components SET is_active=0,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(a.adminUser.user_id,projectId).run();
      for(const row of components){
        const componentName=text(row?.component_name,180);if(!componentName)continue;
        const componentType=text(row?.component_type,60)||'label';
        const quantity=Math.max(.0001,number(row?.quantity_per_finished_unit,1));
        const wastage=Math.min(1000,Math.max(0,number(row?.wastage_percent,0)));
        const cost=Math.max(0,Math.round(number(row?.unit_cost_cents,0)));
        await a.db.prepare(`INSERT INTO packaging_components (packaging_project_id,site_item_inventory_id,component_type,component_name,sku_reference,quantity_per_finished_unit,wastage_percent,unit_cost_cents,lot_tracking_required,supplier_name,notes,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(projectId,id(row?.site_item_inventory_id)||null,componentType,componentName,text(row?.sku_reference,160)||null,quantity,wastage,cost,bool(row?.lot_tracking_required)?1:0,text(row?.supplier_name,180)||null,text(row?.notes,1000)||null,a.adminUser.user_id,a.adminUser.user_id).run();
      }
      message='Packaging component bill of materials and per-unit cost controls saved.';
    }else if(action==='duplicate_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      const source=await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!source)throw new Error('Packaging project was not found.');
      const sourceDetail=await loadDetail(a.db,projectId);
      const key=`PKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
      const columns=['product_id','packaging_template_id','package_type','collection_name','product_name','product_subtitle','product_identity_en','product_identity_fr','ingredients_inci','ingredients_en','ingredients_fr','net_quantity_text','website_text','dealer_name','dealer_address','contact_text','made_in_canada_text','claims_json','warnings_en','warnings_fr','icons_json','theme_json','artwork_json','print_notes'];
      const values=columns.map((column)=>source[column]);
      const result=await a.db.prepare(`INSERT INTO packaging_projects (project_key,project_name,project_status,compliance_status,created_by_user_id,updated_by_user_id,created_at,updated_at,${columns.join(',')}) VALUES (?,?,'draft','needs_review',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,${columns.map(()=>'?').join(',')})`).bind(key,`${source.project_name} copy`,a.adminUser.user_id,a.adminUser.user_id,...values).run();
      projectId=id(result.meta?.last_row_id);
      const copied=snapshotFromBody({...mapProject(source),structured_ingredients:sourceDetail?.ingredients||[],structured_claims:sourceDetail?.structured_claims||[],rose_asset_id:sourceDetail?.soap_product?.rose_asset_id},mapProject(source));
      await syncSoapRecords(a.db,projectId,copied);
      for(const row of sourceDetail?.components||[])await a.db.prepare(`INSERT INTO packaging_components (packaging_project_id,site_item_inventory_id,component_type,component_name,sku_reference,quantity_per_finished_unit,wastage_percent,unit_cost_cents,lot_tracking_required,supplier_name,notes,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(projectId,id(row.site_item_inventory_id)||null,text(row.component_type,60)||'label',text(row.component_name,180),text(row.sku_reference,160)||null,number(row.quantity_per_finished_unit,1),number(row.wastage_percent,0),Math.max(0,Math.round(number(row.unit_cost_cents,0))),Number(row.lot_tracking_required)===1?1:0,text(row.supplier_name,180)||null,text(row.notes,1000)||null,a.adminUser.user_id,a.adminUser.user_id).run();
      message='Packaging project duplicated as a new review-first draft.';
    }else if(action==='save_version'){
      if(!projectId)throw new Error('Packaging project is required.');
      const project=await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!project)throw new Error('Packaging project was not found.');
      const detail=await loadDetail(a.db,projectId);const preflight=detail?.preflight||{};
      if((preflight.missing||[]).length||(preflight.dimension_blockers||[]).length)throw new Error(`Save the required label data before creating a review version: ${[...(preflight.missing||[]),...(preflight.dimension_blockers||[])].join(', ')}.`);
      const next=number((await a.db.prepare(`SELECT COALESCE(MAX(version_number),0)+1 AS next_version FROM packaging_project_versions WHERE packaging_project_id=?`).bind(projectId).first())?.next_version,1);
      const snapshot=body.snapshot&&typeof body.snapshot==='object'?body.snapshot:mapProject(project);
      await a.db.prepare(`INSERT INTO packaging_project_versions (packaging_project_id,version_number,version_label,snapshot_json,svg_markup,review_status,created_by_user_id,created_at) VALUES (?,?,?,?,?,'needs_review',?,CURRENT_TIMESTAMP)`).bind(projectId,next,text(body.version_label,160)||`Version ${next}`,JSON.stringify({...snapshot,checksum:text(body.checksum,128)||null}),text(body.svg_markup,180000)||null,a.adminUser.user_id).run();
      message=`Packaging version ${next} saved for print and compliance review.`;
    }else if(action==='save_print_test'){
      if(!projectId)throw new Error('Packaging project is required.');
      const versionId=id(body.packaging_project_version_id)||null;
      const status=VALID_PRINT_TEST.has(text(body.test_status,30))?text(body.test_status,30):'needs_test';
      const wrap=VALID_PHYSICAL_REVIEW.has(text(body.wrap_fit_status,30))?text(body.wrap_fit_status,30):'not_checked';
      const legibility=VALID_PHYSICAL_REVIEW.has(text(body.legibility_status,30))?text(body.legibility_status,30):'not_checked';
      const overlap=VALID_PHYSICAL_REVIEW.has(text(body.overlap_status,30))?text(body.overlap_status,30):'not_checked';
      if(status==='passed'&&(number(body.scale_percent)!==100||wrap!=='passed'||legibility!=='passed'||overlap!=='passed'))throw new Error('A passed print test requires 100% scale plus passed wrap fit, legibility and overlap checks.');
      await a.db.prepare(`INSERT INTO soap_label_print_tests (packaging_project_id,packaging_project_version_id,test_status,printed_at,printer_name,paper_stock,scale_percent,measured_strip_width_in,measured_band_height_in,measured_front_width_in,measured_front_height_in,measured_rear_circle_mm,wrap_fit_status,legibility_status,overlap_status,proof_image_url,notes,reviewed_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(projectId,versionId,status,text(body.printed_at,40)||null,text(body.printer_name,180)||null,text(body.paper_stock,180)||null,number(body.scale_percent,100),number(body.measured_strip_width_in)||null,number(body.measured_band_height_in)||null,number(body.measured_front_width_in)||null,number(body.measured_front_height_in)||null,number(body.measured_rear_circle_mm)||null,wrap,legibility,overlap,text(body.proof_image_url,1000)||null,text(body.notes,2000)||null,a.adminUser.user_id).run();
      message='Physical print-test evidence saved.';
    }else if(action==='review_version'){
      const versionId=id(body.packaging_project_version_id);const status=VALID_VERSION_REVIEW.has(text(body.review_status,40))?text(body.review_status,40):'needs_review';if(!projectId||!versionId)throw new Error('Packaging project and version are required.');
      if(status==='approved'){
        const detail=await loadDetail(a.db,projectId);const preflight=detail?.preflight||{};
        if((preflight.missing||[]).length||(preflight.dimension_blockers||[]).length)throw new Error(`Packaging version cannot be approved while blockers remain: ${[...(preflight.missing||[]),...(preflight.dimension_blockers||[])].join(', ')}.`);
        const passed=await a.db.prepare(`SELECT print_test_id FROM soap_label_print_tests WHERE packaging_project_id=? AND (packaging_project_version_id=? OR packaging_project_version_id IS NULL) AND test_status='passed' ORDER BY created_at DESC LIMIT 1`).bind(projectId,versionId).first();
        if(!passed)throw new Error('Record a passed 100%-scale physical print or production-material test before approving this packaging version.');
      }
      await a.db.prepare(`UPDATE packaging_project_versions SET review_status=?,reviewed_by_user_id=?,reviewed_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE packaging_project_version_id=? AND packaging_project_id=?`).bind(status,a.adminUser.user_id,status,versionId,projectId).run();
      if(status==='approved'){
        await a.db.batch([
          a.db.prepare(`UPDATE packaging_projects SET project_status='approved',compliance_status=CASE WHEN compliance_status='blocked' THEN 'blocked' ELSE 'approved' END,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(a.adminUser.user_id,projectId),
          a.db.prepare(`UPDATE soap_products SET print_status='approved',compliance_status='approved',updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(projectId)
        ]);
      }
      message='Packaging version review saved.';
    }else if(action==='record_export'){
      const format=text(body.export_format,30);if(!projectId||!VALID_EXPORTS.has(format))throw new Error('Packaging project and supported export format are required.');
      const versionId=id(body.packaging_project_version_id)||null;const fileName=text(body.file_name,240);if(!fileName)throw new Error('Export file name is required.');
      await a.db.prepare(`INSERT INTO packaging_export_history (packaging_project_id,packaging_project_version_id,export_format,file_name,export_status,source_snapshot_json,created_by_user_id,created_at) VALUES (?,?,?,?, 'prepared',?,?,CURRENT_TIMESTAMP)`).bind(projectId,versionId,format,fileName,JSON.stringify(body.snapshot&&typeof body.snapshot==='object'?body.snapshot:{}),a.adminUser.user_id).run();
      const soap=await a.db.prepare(`SELECT soap_product_id FROM soap_products WHERE packaging_project_id=?`).bind(projectId).first();
      const template=await a.db.prepare(`SELECT slt.template_id FROM packaging_projects pp JOIN soap_label_templates slt ON slt.packaging_template_id=pp.packaging_template_id WHERE pp.packaging_project_id=?`).bind(projectId).first();
      if(soap&&template)await a.db.prepare(`INSERT INTO soap_label_exports (soap_product_id,template_id,packaging_project_version_id,version,export_format,file_name,checksum,generated_by,approval_status,print_test_status,notes,generated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(soap.soap_product_id,template.template_id,versionId,text(body.version,40)||null,format,fileName,text(body.checksum,128)||null,a.adminUser.user_id,'prepared','not_tested',text(body.notes,500)||null).run();
      message='Packaging export and checksum evidence recorded.';
    }else if(action==='delete_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      const source=await a.db.prepare(`SELECT packaging_project_id,project_key,project_name,project_status FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!source)throw new Error('Packaging project was not found.');
      if(text(body.confirm_project_key,180)!==String(source.project_key||''))throw new Error('Permanent deletion requires the exact packaging project key.');
      const soap=await a.db.prepare(`SELECT soap_product_id FROM soap_products WHERE packaging_project_id=?`).bind(projectId).first();
      const statements=[];
      if(soap?.soap_product_id){
        statements.push(a.db.prepare(`DELETE FROM soap_label_exports WHERE soap_product_id=?`).bind(soap.soap_product_id));
        statements.push(a.db.prepare(`DELETE FROM soap_label_claims WHERE soap_product_id=?`).bind(soap.soap_product_id));
        statements.push(a.db.prepare(`DELETE FROM soap_ingredients WHERE soap_product_id=?`).bind(soap.soap_product_id));
        statements.push(a.db.prepare(`DELETE FROM soap_products WHERE soap_product_id=?`).bind(soap.soap_product_id));
      }
      for(const table of ['packaging_project_ingredients','packaging_project_claims','packaging_export_history','soap_label_print_tests','packaging_components','packaging_inventory_reservations','packaging_project_source_materials','packaging_formula_source_links','packaging_release_locks','packaging_prepress_checks','packaging_translation_reviews','packaging_project_versions'])statements.push(a.db.prepare(`DELETE FROM ${table} WHERE packaging_project_id=?`).bind(projectId));
      statements.push(a.db.prepare(`DELETE FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId));
      await a.db.batch(statements);
      deletedProjectKey=String(source.project_key||'');deletedProjectName=String(source.project_name||'');deletedProjectId=projectId;projectId=0;
      message=`Packaging label/project “${deletedProjectName||deletedProjectKey}” permanently deleted.`;
    }else if(action==='archive_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      await a.db.batch([
        a.db.prepare(`UPDATE packaging_projects SET project_status='archived',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(a.adminUser.user_id,projectId),
        a.db.prepare(`UPDATE soap_products SET active=0,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(projectId)
      ]);message='Packaging project archived; versions, exports and print evidence remain.';
    }else throw new Error('Unsupported Packaging Studio action.');
    const detail=projectId?await loadDetail(a.db,projectId):null;
    const auditTargetId=projectId||deletedProjectId;const auditTargetKey=detail?.project?.project_key||deletedProjectKey||String(auditTargetId||'');
    await auditAdminAction(context.env,context.request,a.adminUser,{action_type:`packaging_studio_${action}`,target_type:'packaging_project',target_id:auditTargetId,target_key:auditTargetKey,details:{review_first:true,automatic_publish:false,unified_labeling_packaging:true,component_count:detail?.component_summary?.active_count||0,permanent_delete:action==='delete_project',deleted_project_name:deletedProjectName||null}});
    return json({ok:true,message,build:BUILD,...await listData(a.db),detail});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'packaging_studio',incident_code:'packaging_studio_post_failed',severity:'warning',message:error?.message||'Packaging Studio save failed.',related_user_id:a.adminUser.user_id,details:{action,error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,error:error?.message||'Packaging Studio save failed.'},400);
  }
}
