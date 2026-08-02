// Build 229 - unified Labeling & Packaging System with adopted source-reference authority.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '229';
const VALID_PROJECT_STATUSES = new Set(['draft','review','approved','archived']);
const VALID_COMPLIANCE = new Set(['needs_review','ready_for_review','approved','blocked']);
const VALID_VERSION_REVIEW = new Set(['needs_review','approved','changes_requested','blocked']);
const VALID_EXPORTS = new Set(['svg','png','jpg','webp','pdf_print']);
const VALID_PRINT_TEST = new Set(['needs_test','passed','failed']);
const VALID_PHYSICAL_REVIEW = new Set(['not_checked','passed','failed']);

function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function text(value,max=2000){return normalizeText(value).slice(0,max);}
function id(value){const n=Number(value);return Number.isInteger(n)&&n>0?n:0;}
function number(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function safeJson(value,fallback){try{const parsed=JSON.parse(String(value||''));return parsed??fallback}catch{return fallback}}
function jsonText(value,fallback){return JSON.stringify(value&&typeof value==='object'?value:fallback);}
function bool(value){return Number(value)===1||value===true||value==='true';}

async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return{error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env);
  if(!db)return{error:json({ok:false,error:'Database binding is not configured.'},500)};
  return{adminUser,db};
}

async function ensureSchema(db){
  const statements=[
    `CREATE TABLE IF NOT EXISTS packaging_templates (packaging_template_id INTEGER PRIMARY KEY AUTOINCREMENT,template_key TEXT NOT NULL UNIQUE,template_name TEXT NOT NULL,package_type TEXT NOT NULL DEFAULT 'soap_ribbon',description TEXT,page_width_mm REAL NOT NULL DEFAULT 279.4,page_height_mm REAL NOT NULL DEFAULT 38.1,front_width_mm REAL NOT NULL DEFAULT 50.8,front_height_mm REAL NOT NULL DEFAULT 38.1,rear_width_mm REAL NOT NULL DEFAULT 38.1,rear_height_mm REAL NOT NULL DEFAULT 38.1,layout_json TEXT NOT NULL DEFAULT '{}',theme_json TEXT NOT NULL DEFAULT '{}',is_system INTEGER NOT NULL DEFAULT 0,is_active INTEGER NOT NULL DEFAULT 1,created_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS packaging_projects (packaging_project_id INTEGER PRIMARY KEY AUTOINCREMENT,project_key TEXT NOT NULL UNIQUE,product_id INTEGER,packaging_template_id INTEGER NOT NULL,project_name TEXT NOT NULL,package_type TEXT NOT NULL DEFAULT 'soap_ribbon',project_status TEXT NOT NULL DEFAULT 'draft',collection_name TEXT,product_name TEXT NOT NULL,product_subtitle TEXT,product_identity_en TEXT,product_identity_fr TEXT,ingredients_inci TEXT,ingredients_en TEXT,ingredients_fr TEXT,net_quantity_text TEXT,website_text TEXT,dealer_name TEXT,dealer_address TEXT,contact_text TEXT,made_in_canada_text TEXT,claims_json TEXT NOT NULL DEFAULT '[]',warnings_en TEXT,warnings_fr TEXT,icons_json TEXT NOT NULL DEFAULT '[]',theme_json TEXT NOT NULL DEFAULT '{}',artwork_json TEXT NOT NULL DEFAULT '{}',print_notes TEXT,compliance_status TEXT NOT NULL DEFAULT 'needs_review',created_by_user_id INTEGER,updated_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL,FOREIGN KEY(packaging_template_id) REFERENCES packaging_templates(packaging_template_id) ON DELETE RESTRICT)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_projects_product ON packaging_projects(product_id,updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_projects_status ON packaging_projects(project_status,updated_at DESC)`,
    `CREATE TABLE IF NOT EXISTS packaging_project_versions (packaging_project_version_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_project_id INTEGER NOT NULL,version_number INTEGER NOT NULL,version_label TEXT,snapshot_json TEXT NOT NULL,svg_markup TEXT,review_status TEXT NOT NULL DEFAULT 'needs_review',reviewed_by_user_id INTEGER,reviewed_at TEXT,created_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(packaging_project_id,version_number),FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_project_versions_project ON packaging_project_versions(packaging_project_id,version_number DESC)`,
    `CREATE TABLE IF NOT EXISTS packaging_export_history (packaging_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_project_id INTEGER NOT NULL,packaging_project_version_id INTEGER,export_format TEXT NOT NULL,file_name TEXT,export_status TEXT NOT NULL DEFAULT 'prepared',source_snapshot_json TEXT,created_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_export_history_project ON packaging_export_history(packaging_project_id,created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS soap_label_templates (template_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_template_id INTEGER NOT NULL UNIQUE,template_name TEXT NOT NULL,version TEXT NOT NULL DEFAULT '1.0',artboard_width_in REAL NOT NULL DEFAULT 11.0,artboard_height_in REAL NOT NULL DEFAULT 1.5,band_height_in REAL NOT NULL DEFAULT 0.75,front_oval_width_in REAL NOT NULL DEFAULT 2.0,front_oval_height_in REAL NOT NULL DEFAULT 1.5,rear_circle_mm REAL NOT NULL DEFAULT 38.1,bleed_in REAL NOT NULL DEFAULT 0.125,safe_margin_in REAL NOT NULL DEFAULT 0.0625,dimension_profile TEXT NOT NULL DEFAULT 'photo_fit',background_style TEXT NOT NULL DEFAULT 'cream_damask',default_font_set TEXT NOT NULL DEFAULT 'devil_dove_vintage',default_gold_colour TEXT NOT NULL DEFAULT '#B88A2F',is_active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(packaging_template_id) REFERENCES packaging_templates(packaging_template_id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS soap_products (soap_product_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_project_id INTEGER NOT NULL UNIQUE,product_id INTEGER,product_name TEXT NOT NULL,product_family TEXT,soap_type TEXT,description_en TEXT,description_fr TEXT,net_weight_oz REAL,net_weight_g REAL,accent_colour TEXT,secondary_colour TEXT,rose_colour TEXT,rose_asset_id TEXT NOT NULL DEFAULT 'rose-purple-v1',website TEXT NOT NULL DEFAULT 'devilndove.com',made_in_text_en TEXT NOT NULL DEFAULT 'Made in Canada',made_in_text_fr TEXT NOT NULL DEFAULT 'Fabriqué au Canada',print_status TEXT NOT NULL DEFAULT 'draft',compliance_status TEXT NOT NULL DEFAULT 'needs_review',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_soap_products_product ON soap_products(product_id,active)`,
    `CREATE TABLE IF NOT EXISTS soap_ingredients (ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,soap_product_id INTEGER NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,inci_name TEXT,display_name_en TEXT,display_name_fr TEXT,organic_flag INTEGER NOT NULL DEFAULT 0,allergen_note TEXT,required_on_label INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS idx_soap_ingredients_product ON soap_ingredients(soap_product_id,sort_order,ingredient_id)`,
    `CREATE TABLE IF NOT EXISTS soap_label_claims (claim_id INTEGER PRIMARY KEY AUTOINCREMENT,soap_product_id INTEGER NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,claim_en TEXT NOT NULL,claim_fr TEXT NOT NULL,icon_name TEXT,is_approved INTEGER NOT NULL DEFAULT 0,compliance_note TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS idx_soap_label_claims_product ON soap_label_claims(soap_product_id,sort_order,claim_id)`,
    `CREATE TABLE IF NOT EXISTS soap_label_exports (export_id INTEGER PRIMARY KEY AUTOINCREMENT,soap_product_id INTEGER NOT NULL,template_id INTEGER NOT NULL,packaging_project_version_id INTEGER,version TEXT,export_format TEXT NOT NULL,file_name TEXT NOT NULL,svg_url TEXT,pdf_url TEXT,png_url TEXT,webp_url TEXT,checksum TEXT,generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,generated_by INTEGER,approval_status TEXT NOT NULL DEFAULT 'prepared',print_test_status TEXT NOT NULL DEFAULT 'not_tested',notes TEXT,FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE,FOREIGN KEY(template_id) REFERENCES soap_label_templates(template_id) ON DELETE RESTRICT,FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_soap_label_exports_product ON soap_label_exports(soap_product_id,generated_at DESC)`,
    `CREATE TABLE IF NOT EXISTS soap_label_print_tests (print_test_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_project_id INTEGER NOT NULL,packaging_project_version_id INTEGER,test_status TEXT NOT NULL DEFAULT 'needs_test',printed_at TEXT,printer_name TEXT,paper_stock TEXT,scale_percent REAL NOT NULL DEFAULT 100,measured_strip_width_in REAL,measured_band_height_in REAL,measured_front_width_in REAL,measured_front_height_in REAL,measured_rear_circle_mm REAL,wrap_fit_status TEXT NOT NULL DEFAULT 'not_checked',legibility_status TEXT NOT NULL DEFAULT 'not_checked',overlap_status TEXT NOT NULL DEFAULT 'not_checked',proof_image_url TEXT,notes TEXT,reviewed_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_soap_label_print_tests_project ON soap_label_print_tests(packaging_project_id,created_at DESC)`,
    `CREATE TABLE IF NOT EXISTS packaging_components (packaging_component_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_project_id INTEGER NOT NULL,site_item_inventory_id INTEGER,component_type TEXT NOT NULL DEFAULT 'label',component_name TEXT NOT NULL,sku_reference TEXT,quantity_per_finished_unit REAL NOT NULL DEFAULT 1,wastage_percent REAL NOT NULL DEFAULT 0,unit_cost_cents INTEGER NOT NULL DEFAULT 0,lot_tracking_required INTEGER NOT NULL DEFAULT 0,supplier_name TEXT,notes TEXT,is_active INTEGER NOT NULL DEFAULT 1,created_by_user_id INTEGER,updated_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_components_project ON packaging_components(packaging_project_id,is_active,packaging_component_id)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_components_inventory ON packaging_components(site_item_inventory_id,is_active)`,
    `CREATE TABLE IF NOT EXISTS packaging_reference_sources (packaging_reference_source_id INTEGER PRIMARY KEY AUTOINCREMENT,source_key TEXT NOT NULL UNIQUE,source_name TEXT NOT NULL,source_type TEXT NOT NULL,repository_path TEXT NOT NULL,sha256 TEXT NOT NULL,authority_scope TEXT NOT NULL,review_status TEXT NOT NULL DEFAULT 'adopted',dimensional_summary_json TEXT NOT NULL DEFAULT '{}',notes TEXT,is_active INTEGER NOT NULL DEFAULT 1,adopted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_reference_sources_active ON packaging_reference_sources(is_active,source_type,source_key)`,
    `INSERT INTO packaging_reference_sources (source_key,source_name,source_type,repository_path,sha256,authority_scope,review_status,dimensional_summary_json,notes,is_active,adopted_at,updated_at) VALUES
      ('soap-label-automation-spec-v1','DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md','design_specification','/docs/packaging/source-references/DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md','26fe76cff4943547739bbe68b328509ba916ed6c608b57e86a048ceb4f1611b7','Primary design and workflow direction. The full specification is reconciled into PACKAGING_STUDIO.md.','adopted','{"artboard_in":[11,1.5],"band_in":[11,0.75],"front_oval_in":[2,1.5],"rear_seal_mm":50,"bleed_in":0.125,"safe_margin_in":[0.0625,0.125],"preview_dpi_min":300}','Rose-only primary flower; bilingual English/French and INCI; deterministic SVG/PDF; fold, overlap, physical print, approval and archive controls.',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ('soap-label-template-guide-v1','Soap_Label_Template_Guide.pdf','dimension_guide','/docs/packaging/source-references/Soap_Label_Template_Guide.pdf','cc4940bcb31a244ee7bd9248f4830be986c5cb669d21273a23b373aa3b5bfe0e','Compact supplied dimension and print-output reference.','adopted','{"artboard_in":[11,1.5],"band_in":[11,0.75],"front_oval_in":[2,1.5],"rear_seal_mm":50,"bleed_in":0.125,"preview_dpi":300,"colour_mode":"CMYK where supported"}','The source PDF is a direction sheet, not a printer proof or compliance approval.',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
      ('soap-label-master-template-v1','Soap_Label_Master_Template.svg','svg_template','/assets/packaging/soap/reference/Soap_Label_Master_Template.svg','6e0a1653cdb85861544f06f5d1aa1897e1878cfcb5e62ebe86c6cfe003aacb5e','Supplied editable physical-size SVG baseline used for dimension comparison.','adopted','{"width_in":11,"height_in":1.5,"view_box_mm":[0,0,279.4,38.1],"band_height_mm":19.05,"front_oval_mm":[50.8,38.1],"rendered_rear_seal_mm":25}','The supplied SVG renders a 25 mm rear circle while the specification calls for 50 mm. Physical profile selection remains required.',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(source_key) DO UPDATE SET source_name=excluded.source_name,source_type=excluded.source_type,repository_path=excluded.repository_path,sha256=excluded.sha256,authority_scope=excluded.authority_scope,review_status=excluded.review_status,dimensional_summary_json=excluded.dimensional_summary_json,notes=excluded.notes,is_active=excluded.is_active,updated_at=CURRENT_TIMESTAMP`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('soap-ribbon-glacial-approved-v1','Soap ribbon — Glacial Purple approved photo layout','soap_ribbon','Photo-matched continuous ribbon with English ingredients, 2 × 1.5 inch front oval and rose, French ingredients, rear seal, bilingual claims and net weight.',279.4,38.1,50.8,38.1,38.1,38.1,'{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":38.1,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":38.1,"dimension_profile":"photo_fit","bleed_in":0.125,"safe_margin_in":0.0625}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1)`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('soap-ribbon-spec-50mm-seal-v1','Soap ribbon — 50 mm rear-seal specification profile','soap_ribbon','Uses a 50 mm-high artboard so the specified 50 mm rear circle is not clipped. Physical review is required because the supplied specification also states a 1.5 inch artboard.',279.4,50,50.8,38.1,50,50,'{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":50,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":50,"dimension_profile":"50mm_seal","bleed_in":0.125,"safe_margin_in":0.0625}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1)`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('product-label-rectangle-v1','General product label — rectangle','product_label','Structured bilingual general-purpose label for non-soap products. Confirm the physical dieline and category-specific legal fields before approval.',88.9,50.8,88.9,50.8,0,0,'{"sections":["identity","description","net_quantity","dealer_contact","batch_barcode"],"dimension_profile":"general_rectangle","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1)`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('candle-label-v1','Candle label — bilingual rectangle','candle_label','General candle-label working profile with review-first warnings and net quantity. Confirm vessel fit and current hazard requirements.',76.2,50.8,76.2,50.8,0,0,'{"sections":["identity","scent","net_quantity","warnings","dealer_contact","batch"],"dimension_profile":"candle_rectangle","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1)`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('jewelry-card-v1','Jewelry display card','jewelry_card','Display-card working profile with product identity, maker/contact, care and inventory references.',63.5,88.9,63.5,88.9,0,0,'{"sections":["brand","identity","care","maker_contact","sku_barcode"],"dimension_profile":"jewelry_card","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1)`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('package-insert-a6-v1','Package insert / care card — A6','package_insert','Customer-facing insert for care, thank-you, support, QR and reorder information.',105,148,105,148,0,0,'{"sections":["brand","message","care","support","qr"],"dimension_profile":"a6_insert","bleed_mm":3,"safe_margin_mm":5}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1)`,
    `INSERT OR IGNORE INTO soap_label_templates (packaging_template_id,template_name,version,artboard_width_in,artboard_height_in,band_height_in,front_oval_width_in,front_oval_height_in,rear_circle_mm,bleed_in,safe_margin_in,dimension_profile,background_style,default_font_set,default_gold_colour,is_active) SELECT packaging_template_id,template_name,'1.1',11,1.5,.75,2,1.5,38.1,.125,.0625,'photo_fit','cream_damask','devil_dove_vintage','#B88A2F',1 FROM packaging_templates WHERE template_key='soap-ribbon-glacial-approved-v1'`,
    `INSERT OR IGNORE INTO soap_label_templates (packaging_template_id,template_name,version,artboard_width_in,artboard_height_in,band_height_in,front_oval_width_in,front_oval_height_in,rear_circle_mm,bleed_in,safe_margin_in,dimension_profile,background_style,default_font_set,default_gold_colour,is_active) SELECT packaging_template_id,template_name,'1.1',11,1.96850394,.75,2,1.5,50,.125,.0625,'50mm_seal','cream_damask','devil_dove_vintage','#B88A2F',1 FROM packaging_templates WHERE template_key='soap-ribbon-spec-50mm-seal-v1'`
  ];
  for(const sql of statements)await db.prepare(sql).run();
}

function mapTemplate(row){return{...row,packaging_template_id:id(row.packaging_template_id),page_width_mm:number(row.page_width_mm),page_height_mm:number(row.page_height_mm),front_width_mm:number(row.front_width_mm),front_height_mm:number(row.front_height_mm),rear_width_mm:number(row.rear_width_mm),rear_height_mm:number(row.rear_height_mm),layout:safeJson(row.layout_json,{}),theme:safeJson(row.theme_json,{})};}
function mapProject(row){return{...row,packaging_project_id:id(row.packaging_project_id),product_id:id(row.product_id)||null,packaging_template_id:id(row.packaging_template_id),claims:safeJson(row.claims_json,[]),icons:safeJson(row.icons_json,[]),theme:safeJson(row.theme_json,{}),artwork:safeJson(row.artwork_json,{})};}
function mapVersion(row){return{...row,packaging_project_version_id:id(row.packaging_project_version_id),packaging_project_id:id(row.packaging_project_id),version_number:number(row.version_number),snapshot:safeJson(row.snapshot_json,{})};}
function mapReference(row){return{...row,packaging_reference_source_id:id(row.packaging_reference_source_id),dimensional_summary:safeJson(row.dimensional_summary_json,{})};}

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
function estimatedIngredientLines(values=[],maxChars=55){
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
function packagingRequiredFields(project={},ingredients=[],claims=[],template={}){
  const isSoap=String(project.package_type||template.package_type||'')==='soap_ribbon';
  const checks=[
    ['English product identity',project.product_identity_en],['French product identity',project.product_identity_fr],
    ['metric net quantity',project.net_quantity_text],
    ['dealer / business identity',project.dealer_name],['dealer principal address',project.dealer_address],
    ['consumer contact information',project.contact_text],['website',project.website_text]
  ];
  if(isSoap)checks.push(['INCI ingredient list',project.ingredients_inci],['Made in Canada wording',project.made_in_canada_text],['rose asset',project.artwork?.rose_asset_id||project.rose_asset_id]);
  if(String(project.warnings_en||project.warnings_fr||'').trim())checks.push(['English warning',project.warnings_en],['French warning',project.warnings_fr]);
  const missing=checks.filter(([,value])=>!String(value||'').trim()).map(([label])=>label);
  if(isSoap&&!ingredients.length)missing.push('structured bilingual ingredient rows');
  if(ingredients.some((row)=>Number(row.required_on_label)!==0&&(!String(row.inci_name||'').trim()||!String(row.display_name_en||'').trim()||!String(row.display_name_fr||'').trim())))missing.push('complete INCI/English/French text for each required ingredient row');
  if(claims.some((row)=>!String(row.claim_en||'').trim()||!String(row.claim_fr||'').trim()))missing.push('English and French text for each claim');
  const requiredIngredients=ingredients.filter((row)=>Number(row.required_on_label)!==0);
  const enLines=estimatedIngredientLines(requiredIngredients.map((row)=>row.display_name_en),55);
  const frLines=estimatedIngredientLines(requiredIngredients.map((row)=>row.display_name_fr),55);
  if(enLines>8)missing.push(`English ingredient panel exceeds the tested eight-line narrow-band capacity (${enLines} estimated lines)`);
  if(frLines>8)missing.push(`French ingredient panel exceeds the tested eight-line narrow-band capacity (${frLines} estimated lines)`);
  const dimensions=isSoap?dimensionReview(template):{blockers:[],warnings:['Confirm the selected template against the physical container/card dieline before approval.'],profile:template.layout?.dimension_profile||'general'};
  return{missing:[...new Set(missing)],dimension_blockers:dimensions.blockers,dimension_warnings:dimensions.warnings,dimension_profile:dimensions.profile};
}

async function listData(db){
  const templates=rows(await db.prepare(`SELECT * FROM packaging_templates WHERE is_active=1 ORDER BY CASE WHEN template_key='soap-ribbon-glacial-approved-v1' THEN 0 WHEN template_key='soap-ribbon-spec-50mm-seal-v1' THEN 1 ELSE 2 END,is_system DESC,LOWER(template_name)`).all()).map(mapTemplate);
  const projects=rows(await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.featured_image_url,sp.print_status AS soap_print_status FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id LEFT JOIN soap_products sp ON sp.packaging_project_id=pp.packaging_project_id ORDER BY pp.updated_at DESC,pp.packaging_project_id DESC`).all()).map(mapProject);
  const products=rows(await db.prepare(`SELECT product_id,product_number,sku,name,slug,status,product_category,short_description,description,weight_grams,featured_image_url FROM products WHERE COALESCE(status,'draft')<>'archived' ORDER BY LOWER(name),product_id DESC LIMIT 500`).all().catch(()=>({results:[]})));
  const inventory=rows(await db.prepare(`SELECT site_item_inventory_id,source_type,external_key,item_name,category,on_hand_quantity,reserved_quantity,unit_cost_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,supplier_name,supplier_sku FROM site_item_inventory WHERE COALESCE(is_active,1)=1 ORDER BY LOWER(item_name) LIMIT 1000`).all().catch(()=>({results:[]})));
  const reference_sources=rows(await db.prepare(`SELECT * FROM packaging_reference_sources WHERE is_active=1 ORDER BY CASE source_type WHEN 'design_specification' THEN 1 WHEN 'dimension_guide' THEN 2 WHEN 'svg_template' THEN 3 ELSE 4 END,source_key`).all()).map(mapReference);
  return{templates,projects,products,inventory,reference_sources};
}

async function loadDetail(db,projectId){
  const row=await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.product_category,p.short_description,p.description,p.weight_grams,p.featured_image_url,t.template_key,t.template_name,t.page_width_mm,t.page_height_mm,t.front_width_mm,t.front_height_mm,t.rear_width_mm,t.rear_height_mm,t.layout_json AS template_layout_json,t.theme_json AS template_theme_json FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id INNER JOIN packaging_templates t ON t.packaging_template_id=pp.packaging_template_id WHERE pp.packaging_project_id=?`).bind(projectId).first();
  if(!row)return null;
  const soapProduct=await db.prepare(`SELECT * FROM soap_products WHERE packaging_project_id=?`).bind(projectId).first();
  const ingredients=soapProduct?rows(await db.prepare(`SELECT * FROM soap_ingredients WHERE soap_product_id=? ORDER BY sort_order,ingredient_id`).bind(soapProduct.soap_product_id).all()):[];
  const claims=soapProduct?rows(await db.prepare(`SELECT * FROM soap_label_claims WHERE soap_product_id=? ORDER BY sort_order,claim_id`).bind(soapProduct.soap_product_id).all()):[];
  const versions=rows(await db.prepare(`SELECT packaging_project_version_id,packaging_project_id,version_number,version_label,review_status,reviewed_by_user_id,reviewed_at,created_by_user_id,created_at,snapshot_json FROM packaging_project_versions WHERE packaging_project_id=? ORDER BY version_number DESC`).bind(projectId).all()).map(mapVersion);
  const exports=rows(await db.prepare(`SELECT * FROM packaging_export_history WHERE packaging_project_id=? ORDER BY created_at DESC,packaging_export_history_id DESC LIMIT 100`).bind(projectId).all());
  const printTests=rows(await db.prepare(`SELECT * FROM soap_label_print_tests WHERE packaging_project_id=? ORDER BY created_at DESC,print_test_id DESC LIMIT 50`).bind(projectId).all());
  const soapExports=soapProduct?rows(await db.prepare(`SELECT * FROM soap_label_exports WHERE soap_product_id=? ORDER BY generated_at DESC,export_id DESC LIMIT 100`).bind(soapProduct.soap_product_id).all()):[];
  const components=rows(await db.prepare(`SELECT pc.*,sii.item_name AS inventory_item_name,sii.on_hand_quantity,sii.reserved_quantity,sii.stock_unit_label,sii.usage_unit_label,sii.usage_units_per_stock_unit FROM packaging_components pc LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=pc.site_item_inventory_id WHERE pc.packaging_project_id=? AND pc.is_active=1 ORDER BY pc.packaging_component_id`).bind(projectId).all());
  const template=mapTemplate({...row,packaging_template_id:row.packaging_template_id,layout_json:row.template_layout_json,theme_json:row.template_theme_json});
  const project=mapProject(row);
  if(soapProduct){project.rose_asset_id=soapProduct.rose_asset_id;project.net_weight_oz=soapProduct.net_weight_oz;project.net_weight_g=soapProduct.net_weight_g;}
  const componentCostCents=components.reduce((sum,row)=>sum+Math.round(number(row.unit_cost_cents)*number(row.quantity_per_finished_unit,1)*(1+number(row.wastage_percent)/100)),0);
  return{project,template,soap_product:soapProduct||null,ingredients,structured_claims:claims,components,component_summary:{active_count:components.length,estimated_unit_cost_cents:componentCostCents,lot_tracked_count:components.filter((row)=>Number(row.lot_tracking_required)===1).length},versions,exports,soap_exports:soapExports,print_tests:printTests,preflight:packagingRequiredFields(project,ingredients,claims,template)};
}

function snapshotFromBody(body,existing={}){
  const claims=Array.isArray(body.claims)?body.claims.map((v)=>text(v,100)).filter(Boolean):safeJson(body.claims_json,existing.claims||[]);
  const icons=Array.isArray(body.icons)?body.icons.map((v)=>text(v,100)).filter(Boolean):safeJson(body.icons_json,existing.icons||[]);
  const theme=body.theme&&typeof body.theme==='object'?body.theme:safeJson(body.theme_json,existing.theme||{});
  const artwork=body.artwork&&typeof body.artwork==='object'?body.artwork:safeJson(body.artwork_json,existing.artwork||{});
  artwork.rose_asset_id=text(body.rose_asset_id||artwork.rose_asset_id||existing.rose_asset_id||'rose-purple-v1',120);
  return{
    packaging_template_id:id(body.packaging_template_id||existing.packaging_template_id),product_id:id(body.product_id)||null,
    project_name:text(body.project_name||existing.project_name,180),package_type:text(body.package_type||existing.package_type,80)||'soap_ribbon',
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

async function syncSoapRecords(db,projectId,data){
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
    await ensureSchema(a.db);
    const projectId=id(new URL(context.request.url).searchParams.get('packaging_project_id'));
    return json({ok:true,build:BUILD,...await listData(a.db),detail:projectId?await loadDetail(a.db,projectId):null,mode:'three_adopted_sources_structured_svg_review_first_normalized_soap_labels'});
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
    await ensureSchema(a.db);
    let projectId=id(body.packaging_project_id);let message='Saved.';
    if(action==='create_project'){
      const templateId=id(body.packaging_template_id)||(await a.db.prepare(`SELECT packaging_template_id FROM packaging_templates WHERE is_active=1 ORDER BY CASE WHEN template_key='soap-ribbon-glacial-approved-v1' THEN 0 ELSE 1 END,is_system DESC,packaging_template_id LIMIT 1`).first())?.packaging_template_id;
      const productId=id(body.product_id)||null;
      const product=productId?await a.db.prepare(`SELECT product_id,name,product_category,short_description,description,weight_grams FROM products WHERE product_id=?`).bind(productId).first():null;
      const productName=text(body.product_name||product?.name,180);if(!productName)throw new Error('A product or packaging project name is required.');
      const key=`PKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
      const template=await a.db.prepare(`SELECT * FROM packaging_templates WHERE packaging_template_id=? AND is_active=1`).bind(templateId).first();if(!template)throw new Error('Packaging template was not found.');
      const theme=safeJson(template.theme_json,{});const artwork={rose_asset_id:'rose-purple-v1',badge_shape:'oval',rose_style:'full_rose'};
      const result=await a.db.prepare(`INSERT INTO packaging_projects (project_key,product_id,packaging_template_id,project_name,package_type,project_status,collection_name,product_name,product_subtitle,product_identity_en,product_identity_fr,net_quantity_text,website_text,dealer_name,contact_text,made_in_canada_text,theme_json,artwork_json,compliance_status,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,'draft',?,?,?,?,?,?,?,?,?,?,?,?, 'needs_review',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(key,productId,templateId,text(body.project_name||`${productName} packaging`,180),template.package_type||'soap_ribbon',text(body.collection_name||productName,160),productName,text(body.product_subtitle||product?.short_description,220)||null,text(body.product_identity_en||'Aloe Soap',180),text(body.product_identity_fr||'Savon à l’aloès',180),text(body.net_quantity_text||(product?.weight_grams?`${product.weight_grams} g`:''),80)||null,text(body.website_text||'devilndove.com',220),text(body.dealer_name||'Rosevear Creations - Devil n Dove',220),text(body.contact_text||'devilndove.com/contact',300),text(body.made_in_canada_text||'Made in Canada / Fabriqué au Canada',180),JSON.stringify(theme),JSON.stringify(artwork),a.adminUser.user_id,a.adminUser.user_id).run();
      projectId=id(result.meta?.last_row_id);
      const created=mapProject(await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first());
      await syncSoapRecords(a.db,projectId,{...created,net_weight_g:number(product?.weight_grams)||null,structured_ingredients:[],structured_claims:[]});
      message=template.package_type==='soap_ribbon'?'Soap-label project created from the approved photo-layout profile.':'Labeling and packaging project created from the selected business-wide template.';
    }else if(action==='save_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      const existing=await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!existing)throw new Error('Packaging project was not found.');
      const data=snapshotFromBody(body,mapProject(existing));if(!data.packaging_template_id||!data.project_name||!data.product_name)throw new Error('Template, project name and product name are required.');
      const template=mapTemplate(await a.db.prepare(`SELECT * FROM packaging_templates WHERE packaging_template_id=? AND is_active=1`).bind(data.packaging_template_id).first()||{});
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
        if(!passed)throw new Error('Record a passed 100%-scale physical print test before approving this soap-label version.');
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
    }else if(action==='archive_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      await a.db.batch([
        a.db.prepare(`UPDATE packaging_projects SET project_status='archived',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(a.adminUser.user_id,projectId),
        a.db.prepare(`UPDATE soap_products SET active=0,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(projectId)
      ]);message='Packaging project archived; versions, exports and print evidence remain.';
    }else throw new Error('Unsupported Packaging Studio action.');
    const detail=projectId?await loadDetail(a.db,projectId):null;
    await auditAdminAction(context.env,context.request,a.adminUser,{action_type:`packaging_studio_${action}`,target_type:'packaging_project',target_id:projectId,target_key:detail?.project?.project_key||String(projectId||''),details:{review_first:true,automatic_publish:false,unified_labeling_packaging:true,component_count:detail?.component_summary?.active_count||0}});
    return json({ok:true,message,build:BUILD,...await listData(a.db),detail});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'packaging_studio',incident_code:'packaging_studio_post_failed',severity:'warning',message:error?.message||'Packaging Studio save failed.',related_user_id:a.adminUser.user_id,details:{action,error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,error:error?.message||'Packaging Studio save failed.'},400);
  }
}
