/* Build 540 — bounded, authenticated soap source read and explicit official
 * formula save. Uses existing Packaging/soap tables, never makes Etsy calls. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {composeSoapFormula540} from '../../../public/js/soap-formula-540.mjs';

const json=(body,status=200)=>jsonResponse(body,status,{'Cache-Control':'no-store'});
const rows=result=>Array.isArray(result?.results)?result.results:[];
const positive=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
const safeJson=(value,fallback=[])=>{try{const parsed=JSON.parse(String(value||''));return Array.isArray(parsed)?parsed:fallback;}catch{return fallback;}};
const display=value=>String(value||'').trim().slice(0,240);

async function access({request,env}){
  const db=getDb(env);if(!db)return {error:json({ok:false,error:'Database unavailable.'},500)};
  const owner=await getAdminUserFromRequest(request,env);
  if(!owner)return {error:json({ok:false,error:'Unauthorized.'},401)};
  return {db,owner};
}
async function productRecord(db,productId){
  return db.prepare('SELECT product_id,name,status,weight_grams FROM products WHERE product_id=? LIMIT 1').bind(productId).first();
}
async function projectRecords(db,productId){
  return rows(await db.prepare("SELECT DISTINCT p.packaging_project_id,p.packaging_template_id,p.project_name,p.project_status,p.compliance_status,p.package_type FROM packaging_projects p LEFT JOIN soap_products s ON s.packaging_project_id=p.packaging_project_id AND s.product_id=? WHERE (p.product_id=? OR s.soap_product_id IS NOT NULL) AND p.package_type LIKE 'soap%' AND COALESCE(p.project_status,'draft')<>'archived' ORDER BY p.packaging_project_id DESC LIMIT 3").bind(productId,productId).all());
}
async function sourceLibrary(db){
  let materials;
  try{
    materials=rows(await db.prepare("SELECT smt.packaging_source_material_template_id,smt.material_name,smt.material_type,smt.master_inci_json,smt.verification_status,smt.supplier_name,smm.product_family,smm.material_subtype,smm.default_role FROM packaging_source_material_templates smt LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE smt.is_active=1 AND (COALESCE(smm.product_family,'soap') IN ('soap','general','bath_body','cosmetic') OR smt.material_type IN ('soap_base','fragrance_oil','additive')) ORDER BY LOWER(smt.material_name),smt.packaging_source_material_template_id LIMIT 120").all());
  }catch{
    materials=rows(await db.prepare('SELECT packaging_source_material_template_id,material_name,material_type,master_inci_json,verification_status,supplier_name FROM packaging_source_material_templates WHERE is_active=1 ORDER BY LOWER(material_name) LIMIT 120').all());
  }
  return materials.map(row=>({...row,master_inci:safeJson(row.master_inci_json),material_subtype:row.material_subtype||row.material_type}));
}
async function readSelections(db,projectId){
  if(!projectId)return [];
  return rows(await db.prepare("SELECT packaging_source_material_template_id,material_role FROM packaging_project_source_materials WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_source_material_id LIMIT 60").bind(projectId).all());
}
async function readIngredients(db,projectId){
  if(!projectId)return [];
  return rows(await db.prepare('SELECT inci_name,display_name_en,display_name_fr,sort_order,allergen_note,required_on_label FROM packaging_project_ingredients WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_ingredient_id LIMIT 80').bind(projectId).all());
}
export async function onRequestGet(context){
  const a=await access(context);if(a.error)return a.error;
  const productId=positive(new URL(context.request.url).searchParams.get('product_id'));
  if(!productId)return json({ok:false,error:'Choose a saved Product.'},400);
  try{
    const product=await productRecord(a.db,productId);
    if(!product)return json({ok:false,error:'Product not found.'},404);
    const projects=await projectRecords(a.db,productId);
    const project=projects.length===1?projects[0]:null;
    const [sources,selections,ingredients,spec,soapWeight]=await Promise.all([
      sourceLibrary(a.db),readSelections(a.db,project?.packaging_project_id),
      readIngredients(a.db,project?.packaging_project_id),
      a.db.prepare('SELECT scent_profile,wax_or_base,ingredient_notes FROM custom_candle_soap_product_specs WHERE product_id=? ORDER BY updated_at DESC LIMIT 1').bind(productId).first().catch(()=>null),
      project?.packaging_project_id?a.db.prepare('SELECT net_weight_g FROM soap_products WHERE packaging_project_id=? LIMIT 1').bind(project.packaging_project_id).first():Promise.resolve(null)
    ]);
    return json({ok:true,product_id:productId,product_name:product.name,
      source_materials:sources,official_project:project,ambiguous_projects:projects.length>1,
      saved_materials:selections,saved_ingredients:ingredients,
      saved_weight_g:Number(soapWeight?.net_weight_g||0),
      previous_spec:spec?{scent_profile:spec.scent_profile,wax_or_base:spec.wax_or_base,ingredient_notes:spec.ingredient_notes}:null,
      facts:'Only real saved source records; Product shipping weight is NOT finished soap net weight.',
      mode:'owner-selected-source-materials-no-automatic-write'});
  }catch(error){return json({ok:false,error:'Soap records could not be read safely. '+String(error?.message||'')},500);}
}
export async function onRequestPost(context){
  const a=await access(context);if(a.error)return a.error;
  let body;try{body=await context.request.json();}catch{return json({ok:false,error:'Invalid JSON.'},400);}
  const productId=positive(body?.product_id),weight=Number(body?.net_weight_g);
  if(!productId||body?.confirm_actual_formula!==true||!Number.isFinite(weight)||weight<=0||weight>10000)
    return json({ok:false,error:'The exact saved Product, measured soap net weight and physical formula confirmation are required.'},400);
  try{
    const product=await productRecord(a.db,productId);
    if(!product)return json({ok:false,error:'Product not found.'},404);
    const projects=await projectRecords(a.db,productId);
    if(projects.length>1)return json({ok:false,error:'Several active soap packaging records exist. Review which one is authoritative before changing any.'},409);
    const project=projects[0]||null;
    if(project&&['approved','published'].includes(String(project.project_status||'')))return json({ok:false,error:'The official soap label is approved. Reopen its formal review before changing the recipe.'},409);
    const library=await sourceLibrary(a.db);
    const recipe=composeSoapFormula540(library,body?.choices);
    if(!recipe.ready)return json({ok:false,error:recipe.blockers.join(' '),blockers:recipe.blockers},422);
    if(recipe.inci_text!==String(body?.expected_inci_text||''))return json({ok:false,error:'The reviewed ingredient text differs from current saved source records. Refresh before saving.'},409);
    // Existing official ingredient rows may only be replaced after the owner
    // explicitly reviewed the complete physical recipe and actual net weight.
    let projectId=positive(project?.packaging_project_id);
    if(!projectId){
      const template=await a.db.prepare("SELECT packaging_template_id,package_type FROM packaging_templates WHERE is_active=1 AND package_type LIKE 'soap%' ORDER BY CASE WHEN template_key='soap-ribbon-glacial-approved-v1' THEN 0 ELSE 1 END,is_system DESC,packaging_template_id LIMIT 1").first();
      if(!template)return json({ok:false,error:'A soap packaging template is not available. Configure one in Packaging Studio.'},409);
      const key=`PKG-SOAP-${productId}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
      const result=await a.db.prepare("INSERT INTO packaging_projects (project_key,product_id,packaging_template_id,project_name,package_type,project_status,collection_name,product_name,product_identity_en,net_quantity_text,website_text,dealer_name,contact_text,made_in_canada_text,theme_json,artwork_json,compliance_status,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,'draft',?,?,?,?,?,?,?,?,'{}','{}','needs_review',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(key,productId,template.packaging_template_id,`${product.name} label`,template.package_type,product.name,product.name,product.name,`${weight} g`,'devilndove.com','Rosevear Creations - Devil n Dove','devilndove.com/contact','Made in Canada / Fabriqué au Canada',a.owner.user_id,a.owner.user_id).run();
      projectId=positive(result?.meta?.last_row_id);
      if(!projectId)throw Error('Could not identify the new official soap label record. Stop before retrying.');
    }
    const existingSoap=await a.db.prepare('SELECT soap_product_id FROM soap_products WHERE packaging_project_id=? LIMIT 1').bind(projectId).first();
    if(!existingSoap)await a.db.prepare("INSERT INTO soap_products (packaging_project_id,product_id,product_name,product_family,soap_type,net_weight_g,website,print_status,compliance_status,active,created_at,updated_at) VALUES (?,?,?,?,?,?,'devilndove.com','draft','needs_review',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(projectId,productId,product.name,'soap',product.name,weight).run();
    const soap=await a.db.prepare('SELECT soap_product_id FROM soap_products WHERE packaging_project_id=? LIMIT 1').bind(projectId).first();
    if(!soap?.soap_product_id)throw Error('Official soap record missing after initialization; no ingredient rows were replaced.');
    const userId=positive(a.owner.user_id)||null;
    const statements=[
      a.db.prepare("DELETE FROM packaging_project_source_materials WHERE packaging_project_id=? AND material_role IN ('base','fragrance','additive')").bind(projectId),
      a.db.prepare('DELETE FROM packaging_project_ingredients WHERE packaging_project_id=?').bind(projectId),
      a.db.prepare('DELETE FROM soap_ingredients WHERE soap_product_id=?').bind(soap.soap_product_id)
    ];
    for(const source of recipe.selected){
      const role=source.role==='scent'?'fragrance':source.role==='oil'?'additive':'base';
      const record=library.find(row=>positive(row.packaging_source_material_template_id)===source.id);
      statements.push(a.db.prepare("INSERT INTO packaging_project_source_materials (packaging_project_id,packaging_source_material_template_id,material_role,sort_order,source_snapshot_json,review_status,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,'needs_review',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").bind(projectId,source.id,role,role==='base'?1:role==='additive'?2:3,JSON.stringify({material_name:record?.material_name,verification_status:record?.verification_status,master_inci:record?.master_inci}),userId,userId));
    }
    for(const row of recipe.ingredients){
      const fields=[row.sort_order,row.inci_name,row.display_name_en,row.display_name_fr,row.organic_flag,row.allergen_note||null,row.required_on_label];
      statements.push(a.db.prepare('INSERT INTO packaging_project_ingredients (packaging_project_id,sort_order,inci_name,display_name_en,display_name_fr,organic_flag,allergen_note,required_on_label,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)').bind(projectId,...fields));
      statements.push(a.db.prepare('INSERT INTO soap_ingredients (soap_product_id,sort_order,inci_name,display_name_en,display_name_fr,organic_flag,allergen_note,required_on_label,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)').bind(soap.soap_product_id,...fields));
    }
    statements.push(a.db.prepare("UPDATE packaging_projects SET ingredients_inci=?,ingredients_en=?,ingredients_fr=?,net_quantity_text=?,compliance_status='needs_review',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?").bind(recipe.inci_text,recipe.ingredients.map(x=>x.display_name_en).join(', '),recipe.ingredients.map(x=>x.display_name_fr).join(', '),`${weight} g`,userId,projectId));
    statements.push(a.db.prepare("UPDATE soap_products SET product_id=?,product_name=?,net_weight_g=?,print_status='draft',compliance_status='needs_review',updated_at=CURRENT_TIMESTAMP WHERE soap_product_id=?").bind(productId,product.name,weight,soap.soap_product_id));
    await a.db.batch(statements);
    return json({ok:true,product_id:productId,packaging_project_id:projectId,soap_product_id:soap.soap_product_id,
      selected_materials:recipe.selected.map(x=>({role:x.role,id:x.id,material_name:x.material_name})),
      saved_ingredient_count:recipe.ingredients.length,net_weight_g:weight,
      listing_published:false,compliance_status:'needs_review',message:'Saved genuine source-selected soap formula and bilingual INCI drafts. Label approval and Etsy update remain separate.'});
  }catch(error){return json({ok:false,error:'Soap formula was not confirmed. '+String(error?.message||'')},500);}
}
