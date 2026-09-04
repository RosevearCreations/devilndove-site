// Release 467 Build 42 — Material Template Intelligence.
// Reuses existing Packaging JSON authorities; no schema creation or request-time DDL.
// Release 467 Build 43 compatibility: project-level label composition overrides survive inheritance normalization.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE=467;
const BUILD=42;
const POLICIES=new Set(['required','print_default','optional','internal_only']);
const PROVENANCE=new Set(['needs_review','supplier_declared','supplier_verified','owner_verified','internal_note']);
const POLICY_PRIORITY={internal_only:0,optional:1,print_default:2,required:3};
const rows=(result)=>Array.isArray(result?.results)?result.results:[];
const text=(value,max=1000)=>normalizeText(value).slice(0,max);
const id=(value)=>{const n=Number(value);return Number.isInteger(n)&&n>0?n:0;};
const safeJson=(value,fallback)=>{try{const parsed=JSON.parse(String(value||''));return parsed??fallback;}catch{return fallback;}};
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const canonical=(value)=>text(value,500).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const keyPart=(value)=>canonical(value).replace(/\s+/g,'-').slice(0,90)||'ingredient';

function defaultPolicy(row={}){
  if(POLICIES.has(String(row.print_policy||'')))return String(row.print_policy);
  return Number(row.required_on_label)===0?'optional':'required';
}
function defaultProvenance(row={},template={}){
  if(PROVENANCE.has(String(row.provenance_status||'')))return String(row.provenance_status);
  if(String(row.verification_status||'')==='owner_verified'||String(template.verification_status||'')==='owner_verified')return'owner_verified';
  if(String(row.verification_status||'')==='supplier_verified'||String(template.verification_status||'')==='supplier_verified')return'supplier_verified';
  return template.supplier_name?'supplier_declared':'needs_review';
}
function normalizeIntelligenceRows(value=[],template={}){
  if(!Array.isArray(value))return[];
  const seen=new Set();
  return value.slice(0,120).map((row,index)=>{
    const inci=text(row?.inci_name||row?.display_name_en||row?.display_name_fr,300);
    const key=canonical(inci);if(!key||seen.has(key))return null;seen.add(key);
    const policy=POLICIES.has(String(row?.print_policy||''))?String(row.print_policy):defaultPolicy(row);
    const provenance=PROVENANCE.has(String(row?.provenance_status||''))?String(row.provenance_status):defaultProvenance(row,template);
    return{...row,sort_order:index+1,inci_name:text(row?.inci_name,300)||inci,display_name_en:text(row?.display_name_en,500)||null,display_name_fr:text(row?.display_name_fr,500)||null,print_policy:policy,provenance_status:provenance,provenance_note:text(row?.provenance_note,1200)||null,required_on_label:['required','print_default'].includes(policy)?1:0,build42_intelligence:1};
  }).filter(Boolean);
}
async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);if(!adminUser)return{error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env);if(!db)return{error:json({ok:false,error:'Database binding is not configured.'},503)};
  return{adminUser,db};
}
async function loadTemplate(db,sourceId){
  return db.prepare(`SELECT smt.*,smm.product_family,smm.material_subtype,smm.default_role,smm.colour_hex FROM packaging_source_material_templates smt LEFT JOIN packaging_source_material_metadata smm ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id WHERE smt.packaging_source_material_template_id=? AND smt.is_active=1`).bind(sourceId).first();
}
async function templatePayload(db,sourceId){
  const template=await loadTemplate(db,sourceId);if(!template)return null;
  const master=normalizeIntelligenceRows(safeJson(template.master_inci_json,[]),template);
  return{packaging_source_material_template_id:sourceId,material_name:text(template.material_name,180),material_type:text(template.material_type,60),material_subtype:text(template.material_subtype||template.material_type,80),supplier_name:text(template.supplier_name,180)||null,supplier_sku:text(template.supplier_sku,180)||null,source_url:text(template.source_url,1000)||null,supplier_document_url:text(template.supplier_document_url,1000)||null,verification_status:text(template.verification_status,50)||'needs_review',ingredients:master};
}
async function saveTemplateIntelligence(db,adminUser,sourceId,inputRows){
  const template=await loadTemplate(db,sourceId);if(!template)throw new Error('Source-material template was not found.');
  const existing=safeJson(template.master_inci_json,[]);
  const incoming=new Map((Array.isArray(inputRows)?inputRows:[]).map((row)=>[canonical(row?.inci_name||row?.display_name_en||row?.display_name_fr),row]));
  const enriched=normalizeIntelligenceRows(existing.map((row)=>{
    const key=canonical(row?.inci_name||row?.display_name_en||row?.display_name_fr);const policy=incoming.get(key)||{};
    return{...row,print_policy:policy.print_policy||row.print_policy,provenance_status:policy.provenance_status||row.provenance_status,provenance_note:policy.provenance_note??row.provenance_note};
  }),template);
  if(!enriched.length)throw new Error('Material template has no structured ingredient rows to classify.');
  await db.prepare(`UPDATE packaging_source_material_templates SET master_inci_json=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_source_material_template_id=?`).bind(JSON.stringify(enriched),adminUser.user_id,sourceId).run();

  for(const row of enriched){
    const contentKey=`source-material-${sourceId}-ingredient-${keyPart(row.inci_name)}`;
    const existingContent=await db.prepare(`SELECT packaging_content_library_id,metadata_json FROM packaging_content_library WHERE content_key=? LIMIT 1`).bind(contentKey).first().catch(()=>null);
    const metadata={...safeJson(existingContent?.metadata_json,{}),auto_generated:1,source_material_template_id:sourceId,source_material_name:text(template.material_name,180),source_material_type:text(template.material_type,60),source_material_subtype:text(template.material_subtype||template.material_type,80),verification_status:text(template.verification_status,50)||'needs_review',print_policy:row.print_policy,provenance_status:row.provenance_status,provenance_note:row.provenance_note||'',build42_intelligence:1};
    if(existingContent?.packaging_content_library_id){
      await db.prepare(`UPDATE packaging_content_library SET item_name=?,text_en=?,text_fr=?,inci_name=?,metadata_json=?,is_active=1,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_content_library_id=?`).bind(row.display_name_en||row.inci_name,row.display_name_en||row.inci_name,row.display_name_fr||null,row.inci_name,JSON.stringify(metadata),adminUser.user_id,existingContent.packaging_content_library_id).run();
    }else{
      await db.prepare(`INSERT INTO packaging_content_library(content_key,content_type,item_name,text_en,text_fr,inci_name,metadata_json,is_system,is_active,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,'ingredient',?,?,?,?,?,0,1,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(contentKey,row.display_name_en||row.inci_name,row.display_name_en||row.inci_name,row.display_name_fr||null,row.inci_name,JSON.stringify(metadata),adminUser.user_id,adminUser.user_id).run();
    }
  }
  return enriched;
}
function choosePolicy(current,next){return POLICY_PRIORITY[next]>POLICY_PRIORITY[current]?next:current;}
function effectiveWithOverride(policy,current,decision){
  const inherited=policy?(['required','print_default'].includes(policy)?1:0):(Number(current)!==0?1:0);
  if(decision==='omit'&&policy!=='required')return 0;
  if(decision==='print'&&policy!=='internal_only')return 1;
  return inherited;
}
async function projectOverrideMap(db,projectId){
  const project=await db.prepare(`SELECT artwork_json FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();
  const artwork=safeJson(project?.artwork_json,{});const result=new Map();
  for(const row of (Array.isArray(artwork.label_composition_overrides)?artwork.label_composition_overrides:[])){
    const key=canonical(row?.key||row?.inci_name);const decision=String(row?.decision||'');if(key&&['print','omit'].includes(decision))result.set(key,decision);
  }
  return result;
}
async function normalizeProject(db,projectId,adminUserId=0){
  const attached=rows(await db.prepare(`SELECT smt.master_inci_json,smt.verification_status,smt.supplier_name FROM packaging_project_source_materials psm JOIN packaging_source_material_templates smt ON smt.packaging_source_material_template_id=psm.packaging_source_material_template_id WHERE psm.packaging_project_id=? ORDER BY psm.sort_order,psm.packaging_project_source_material_id`).bind(projectId).all());
  const policyByKey=new Map();
  for(const source of attached){
    for(const row of normalizeIntelligenceRows(safeJson(source.master_inci_json,[]),source)){
      const key=canonical(row.inci_name||row.display_name_en||row.display_name_fr);if(!key)continue;
      const current=policyByKey.get(key);policyByKey.set(key,current?choosePolicy(current,row.print_policy):row.print_policy);
    }
  }
  const overrideByKey=await projectOverrideMap(db,projectId);
  const projectRows=rows(await db.prepare(`SELECT packaging_project_ingredient_id,sort_order,site_item_inventory_id,inci_name,display_name_en,display_name_fr,organic_flag,allergen_note,required_on_label FROM packaging_project_ingredients WHERE packaging_project_id=? ORDER BY sort_order,packaging_project_ingredient_id`).bind(projectId).all());
  const keeperByKey=new Map();let duplicateCount=0;let policyCount=0;let overridesPreserved=0;
  for(const row of projectRows){
    const key=canonical(row.inci_name||row.display_name_en||row.display_name_fr);if(!key)continue;
    const keeper=keeperByKey.get(key);
    if(!keeper){keeperByKey.set(key,{...row});continue;}
    const merged={...keeper,site_item_inventory_id:keeper.site_item_inventory_id||row.site_item_inventory_id||null,inci_name:keeper.inci_name||row.inci_name||null,display_name_en:keeper.display_name_en||row.display_name_en||null,display_name_fr:keeper.display_name_fr||row.display_name_fr||null,organic_flag:Number(keeper.organic_flag)||Number(row.organic_flag)?1:0,allergen_note:keeper.allergen_note||row.allergen_note||null,required_on_label:Number(keeper.required_on_label)||Number(row.required_on_label)?1:0};
    keeperByKey.set(key,merged);duplicateCount+=1;
    await db.prepare(`DELETE FROM packaging_project_ingredients WHERE packaging_project_ingredient_id=?`).bind(row.packaging_project_ingredient_id).run();
  }
  let sort=0;const printable=[];
  for(const [key,row] of keeperByKey){
    sort+=1;const policy=policyByKey.get(key);const decision=overrideByKey.get(key)||'';const required=effectiveWithOverride(policy,row.required_on_label,decision);if(policy)policyCount+=1;if(decision)overridesPreserved+=1;
    await db.prepare(`UPDATE packaging_project_ingredients SET sort_order=?,site_item_inventory_id=?,inci_name=?,display_name_en=?,display_name_fr=?,organic_flag=?,allergen_note=?,required_on_label=? WHERE packaging_project_ingredient_id=?`).bind(sort,row.site_item_inventory_id||null,row.inci_name||null,row.display_name_en||null,row.display_name_fr||null,Number(row.organic_flag)!==0?1:0,row.allergen_note||null,required,row.packaging_project_ingredient_id).run();
    if(required)printable.push(row);
  }
  const inci=printable.map((row)=>text(row.inci_name,300)).filter(Boolean).join(', ');const en=printable.map((row)=>text(row.display_name_en||row.inci_name,500)).filter(Boolean).join(', ');const fr=printable.map((row)=>text(row.display_name_fr||row.inci_name,500)).filter(Boolean).join(', ');
  if(adminUserId)await db.prepare(`UPDATE packaging_projects SET ingredients_inci=?,ingredients_en=?,ingredients_fr=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(inci||null,en||null,fr||null,adminUserId,projectId).run();
  else await db.prepare(`UPDATE packaging_projects SET ingredients_inci=?,ingredients_en=?,ingredients_fr=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(inci||null,en||null,fr||null,projectId).run();
  return{ingredient_count:keeperByKey.size,duplicates_removed:duplicateCount,policies_applied:policyCount,overrides_preserved:overridesPreserved};
}

export async function onRequestGet(context){
  const a=await access(context);if(a.error)return a.error;const url=new URL(context.request.url);const sourceId=id(url.searchParams.get('source_id'));if(!sourceId)return json({ok:false,error:'source_id is required.'},400);
  const template=await templatePayload(a.db,sourceId);if(!template)return json({ok:false,error:'Source-material template was not found.'},404);
  return json({ok:true,release:RELEASE,build:BUILD,template,policies:[...POLICIES],provenance_states:[...PROVENANCE],schema_change:false,request_time_ddl:false});
}

export async function onRequestPost(context){
  const a=await access(context);if(a.error)return a.error;let body={};try{body=await context.request.json();}catch{return json({ok:false,error:'Valid JSON body is required.'},400);}const action=text(body.action,60);
  try{
    if(action==='save_template_intelligence'){
      const sourceId=id(body.packaging_source_material_template_id);if(!sourceId)return json({ok:false,error:'Source-material template is required.'},400);
      const ingredients=await saveTemplateIntelligence(a.db,a.adminUser,sourceId,body.ingredients);
      return json({ok:true,release:RELEASE,build:BUILD,message:'Material template intelligence saved.',template:await templatePayload(a.db,sourceId),ingredient_count:ingredients.length});
    }
    if(action==='normalize_project_inheritance'){
      const projectId=id(body.packaging_project_id);if(!projectId)return json({ok:false,error:'Packaging project is required.'},400);
      const project=await a.db.prepare(`SELECT packaging_project_id FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!project)return json({ok:false,error:'Packaging project was not found.'},404);
      const result=await normalizeProject(a.db,projectId,a.adminUser.user_id);
      return json({ok:true,release:RELEASE,build:BUILD,message:'Material inheritance normalized while preserving reviewed Build 43 label overrides.',...result});
    }
    return json({ok:false,error:'Unsupported Material Template Intelligence action.'},400);
  }catch(error){return json({ok:false,error:error?.message||'Material Template Intelligence failed.',release:RELEASE,build:BUILD},409);}
}
