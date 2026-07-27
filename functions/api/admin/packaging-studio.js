// Build 221 — database-driven Packaging Studio foundation.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '221';
const VALID_PROJECT_STATUSES = new Set(['draft','review','approved','archived']);
const VALID_COMPLIANCE = new Set(['needs_review','ready_for_review','approved','blocked']);
const VALID_VERSION_REVIEW = new Set(['needs_review','approved','changes_requested','blocked']);
const VALID_EXPORTS = new Set(['svg','png','jpg','pdf_print']);

function json(data,status=200){return jsonResponse(data,status,{'Cache-Control':'no-store'});}
function text(value,max=2000){return normalizeText(value).slice(0,max);}
function id(value){const n=Number(value);return Number.isInteger(n)&&n>0?n:0;}
function rows(result){return Array.isArray(result?.results)?result.results:[];}
function safeJson(value,fallback){try{const parsed=JSON.parse(String(value||''));return parsed??fallback}catch{return fallback}}
function jsonText(value,fallback){return JSON.stringify(value && typeof value==='object'?value:fallback);}

async function access(context){
  const adminUser=await getAdminUserFromRequest(context.request,context.env);
  if(!adminUser)return{error:json({ok:false,error:'Admin access required.'},401)};
  const db=getDb(context.env);
  if(!db)return{error:json({ok:false,error:'Database binding is not configured.'},500)};
  return{adminUser,db};
}

async function ensureSchema(db){
  const statements=[
    `CREATE TABLE IF NOT EXISTS packaging_templates (packaging_template_id INTEGER PRIMARY KEY AUTOINCREMENT,template_key TEXT NOT NULL UNIQUE,template_name TEXT NOT NULL,package_type TEXT NOT NULL DEFAULT 'soap_ribbon',description TEXT,page_width_mm REAL NOT NULL DEFAULT 279.4,page_height_mm REAL NOT NULL DEFAULT 19,front_width_mm REAL NOT NULL DEFAULT 50.8,front_height_mm REAL NOT NULL DEFAULT 38.1,rear_width_mm REAL NOT NULL DEFAULT 50,rear_height_mm REAL NOT NULL DEFAULT 50,layout_json TEXT NOT NULL DEFAULT '{}',theme_json TEXT NOT NULL DEFAULT '{}',is_system INTEGER NOT NULL DEFAULT 0,is_active INTEGER NOT NULL DEFAULT 1,created_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS packaging_projects (packaging_project_id INTEGER PRIMARY KEY AUTOINCREMENT,project_key TEXT NOT NULL UNIQUE,product_id INTEGER,packaging_template_id INTEGER NOT NULL,project_name TEXT NOT NULL,package_type TEXT NOT NULL DEFAULT 'soap_ribbon',project_status TEXT NOT NULL DEFAULT 'draft',collection_name TEXT,product_name TEXT NOT NULL,product_subtitle TEXT,product_identity_en TEXT,product_identity_fr TEXT,ingredients_inci TEXT,ingredients_en TEXT,ingredients_fr TEXT,net_quantity_text TEXT,website_text TEXT,dealer_name TEXT,dealer_address TEXT,contact_text TEXT,made_in_canada_text TEXT,claims_json TEXT NOT NULL DEFAULT '[]',warnings_en TEXT,warnings_fr TEXT,icons_json TEXT NOT NULL DEFAULT '[]',theme_json TEXT NOT NULL DEFAULT '{}',artwork_json TEXT NOT NULL DEFAULT '{}',print_notes TEXT,compliance_status TEXT NOT NULL DEFAULT 'needs_review',created_by_user_id INTEGER,updated_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL,FOREIGN KEY(packaging_template_id) REFERENCES packaging_templates(packaging_template_id) ON DELETE RESTRICT)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_projects_product ON packaging_projects(product_id,updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_projects_status ON packaging_projects(project_status,updated_at DESC)`,
    `CREATE TABLE IF NOT EXISTS packaging_project_versions (packaging_project_version_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_project_id INTEGER NOT NULL,version_number INTEGER NOT NULL,version_label TEXT,snapshot_json TEXT NOT NULL,svg_markup TEXT,review_status TEXT NOT NULL DEFAULT 'needs_review',reviewed_by_user_id INTEGER,reviewed_at TEXT,created_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(packaging_project_id,version_number),FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_project_versions_project ON packaging_project_versions(packaging_project_id,version_number DESC)`,
    `CREATE TABLE IF NOT EXISTS packaging_export_history (packaging_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,packaging_project_id INTEGER NOT NULL,packaging_project_version_id INTEGER,export_format TEXT NOT NULL,file_name TEXT,export_status TEXT NOT NULL DEFAULT 'prepared',source_snapshot_json TEXT,created_by_user_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_packaging_export_history_project ON packaging_export_history(packaging_project_id,created_at DESC)`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('soap-ribbon-scalloped-reference-v1','Soap ribbon — scalloped medallion reference','soap_ribbon','Recreates the supplied ribbon structure: narrow 19 mm band, scalloped front medallion, curved collection and scent text, bilingual centre title, side botanical ornaments, ingredients, rear medallion, claims and net quantity.',279.4,50,50.8,38.1,50,50,'{"sections":["front_scalloped_badge","ingredients_en","ingredients_fr","rear_medallion","claims"],"band_height_mm":19,"front_style":"scalloped_curved_text"}','{"rose_colour":"#9b8068","theme_colour":"#f2ead8","border_colour":"#2f2721","accent_gold":"#b69a61"}',1,1)`,
    `INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active) VALUES ('soap-ribbon-11x0.75-v1','Soap ribbon — standard 11 × 0.75 inch','soap_ribbon','Standard narrow ribbon with front oval, English ingredients, French ingredients, rear medallion, claims and net weight.',279.4,19,50.8,19,50,19,'{"sections":["front","ingredients_en","ingredients_fr","rear","claims"],"band_height_mm":19}','{"rose_colour":"#b74b63","theme_colour":"#f4eadb","border_colour":"#3b2c2f","accent_gold":"#b38a3b"}',1,1)`
  ];
  for(const sql of statements)await db.prepare(sql).run();
}

function mapTemplate(row){return{...row,packaging_template_id:id(row.packaging_template_id),page_width_mm:Number(row.page_width_mm||0),page_height_mm:Number(row.page_height_mm||0),front_width_mm:Number(row.front_width_mm||0),front_height_mm:Number(row.front_height_mm||0),rear_width_mm:Number(row.rear_width_mm||0),rear_height_mm:Number(row.rear_height_mm||0),layout:safeJson(row.layout_json,{}),theme:safeJson(row.theme_json,{})};}
function mapProject(row){return{...row,packaging_project_id:id(row.packaging_project_id),product_id:id(row.product_id)||null,packaging_template_id:id(row.packaging_template_id),claims:safeJson(row.claims_json,[]),icons:safeJson(row.icons_json,[]),theme:safeJson(row.theme_json,{}),artwork:safeJson(row.artwork_json,{})};}
function mapVersion(row){return{...row,packaging_project_version_id:id(row.packaging_project_version_id),packaging_project_id:id(row.packaging_project_id),version_number:Number(row.version_number||0),snapshot:safeJson(row.snapshot_json,{})};}

function packagingRequiredFields(project={}){
  const checks=[
    ['English product identity',project.product_identity_en],
    ['French product identity',project.product_identity_fr],
    ['metric net quantity',project.net_quantity_text],
    ['INCI ingredient list',project.ingredients_inci],
    ['dealer / business identity',project.dealer_name],
    ['dealer principal address',project.dealer_address],
    ['consumer contact information',project.contact_text]
  ];
  if(String(project.warnings_en||project.warnings_fr||'').trim()){
    checks.push(['English warning',project.warnings_en],['French warning',project.warnings_fr]);
  }
  return checks.filter(([,value])=>!String(value||'').trim()).map(([label])=>label);
}

async function listData(db){
  const templates=rows(await db.prepare(`SELECT * FROM packaging_templates WHERE is_active=1 ORDER BY CASE WHEN template_key='soap-ribbon-scalloped-reference-v1' THEN 0 ELSE 1 END,is_system DESC,LOWER(template_name)`).all()).map(mapTemplate);
  const projects=rows(await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.featured_image_url FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id ORDER BY pp.updated_at DESC,pp.packaging_project_id DESC`).all()).map(mapProject);
  const products=rows(await db.prepare(`SELECT product_id,product_number,sku,name,slug,status,product_category,short_description,description,weight_grams,featured_image_url FROM products WHERE COALESCE(status,'draft')<>'archived' ORDER BY LOWER(name),product_id DESC LIMIT 500`).all().catch(()=>({results:[]})));
  return{templates,projects,products};
}

async function loadDetail(db,projectId){
  const row=await db.prepare(`SELECT pp.*,p.sku,p.slug,p.status AS product_status,p.product_category,p.short_description,p.description,p.weight_grams,p.featured_image_url,t.template_key,t.template_name,t.page_width_mm,t.page_height_mm,t.front_width_mm,t.front_height_mm,t.rear_width_mm,t.rear_height_mm,t.layout_json AS template_layout_json,t.theme_json AS template_theme_json FROM packaging_projects pp LEFT JOIN products p ON p.product_id=pp.product_id INNER JOIN packaging_templates t ON t.packaging_template_id=pp.packaging_template_id WHERE pp.packaging_project_id=?`).bind(projectId).first();
  if(!row)return null;
  const versions=rows(await db.prepare(`SELECT packaging_project_version_id,packaging_project_id,version_number,version_label,review_status,reviewed_by_user_id,reviewed_at,created_by_user_id,created_at,snapshot_json FROM packaging_project_versions WHERE packaging_project_id=? ORDER BY version_number DESC`).bind(projectId).all()).map(mapVersion);
  const exports=rows(await db.prepare(`SELECT * FROM packaging_export_history WHERE packaging_project_id=? ORDER BY created_at DESC,packaging_export_history_id DESC LIMIT 100`).bind(projectId).all());
  return{project:mapProject(row),template:mapTemplate({...row,packaging_template_id:row.packaging_template_id,layout_json:row.template_layout_json,theme_json:row.template_theme_json}),versions,exports};
}

function snapshotFromBody(body,existing={}){
  const claims=Array.isArray(body.claims)?body.claims.map((v)=>text(v,100)).filter(Boolean):safeJson(body.claims_json,existing.claims||[]);
  const icons=Array.isArray(body.icons)?body.icons.map((v)=>text(v,100)).filter(Boolean):safeJson(body.icons_json,existing.icons||[]);
  const theme=body.theme&&typeof body.theme==='object'?body.theme:safeJson(body.theme_json,existing.theme||{});
  const artwork=body.artwork&&typeof body.artwork==='object'?body.artwork:safeJson(body.artwork_json,existing.artwork||{});
  return{
    packaging_template_id:id(body.packaging_template_id||existing.packaging_template_id),product_id:id(body.product_id)||null,
    project_name:text(body.project_name||existing.project_name,180),package_type:text(body.package_type||existing.package_type,80)||'soap_ribbon',
    project_status:VALID_PROJECT_STATUSES.has(text(body.project_status,30))?text(body.project_status,30):'draft',
    collection_name:text(body.collection_name,160)||null,product_name:text(body.product_name,180),product_subtitle:text(body.product_subtitle,220)||null,
    product_identity_en:text(body.product_identity_en,180)||null,product_identity_fr:text(body.product_identity_fr,180)||null,
    ingredients_inci:text(body.ingredients_inci,4000)||null,ingredients_en:text(body.ingredients_en,4000)||null,ingredients_fr:text(body.ingredients_fr,4000)||null,
    net_quantity_text:text(body.net_quantity_text,80)||null,website_text:text(body.website_text,220)||null,dealer_name:text(body.dealer_name,220)||null,
    dealer_address:text(body.dealer_address,500)||null,contact_text:text(body.contact_text,300)||null,made_in_canada_text:text(body.made_in_canada_text,180)||null,
    claims,warnings_en:text(body.warnings_en,2000)||null,warnings_fr:text(body.warnings_fr,2000)||null,icons,theme,artwork,
    print_notes:text(body.print_notes,2000)||null,compliance_status:VALID_COMPLIANCE.has(text(body.compliance_status,40))?text(body.compliance_status,40):'needs_review'
  };
}

export async function onRequestGet(context){
  const a=await access(context);if(a.error)return a.error;
  try{
    await ensureSchema(a.db);
    const projectId=id(new URL(context.request.url).searchParams.get('packaging_project_id'));
    return json({ok:true,build:BUILD,...await listData(a.db),detail:projectId?await loadDetail(a.db,projectId):null,mode:'structured_svg_review_first'});
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
      const templateId=id(body.packaging_template_id)||(await a.db.prepare(`SELECT packaging_template_id FROM packaging_templates WHERE is_active=1 ORDER BY CASE WHEN template_key='soap-ribbon-scalloped-reference-v1' THEN 0 ELSE 1 END,is_system DESC,packaging_template_id LIMIT 1`).first())?.packaging_template_id;
      const productId=id(body.product_id)||null;
      const product=productId?await a.db.prepare(`SELECT product_id,name,product_category,short_description,description,weight_grams FROM products WHERE product_id=?`).bind(productId).first():null;
      const productName=text(body.product_name||product?.name,180);if(!productName)throw new Error('A product or packaging project name is required.');
      const key=`PKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
      const template=await a.db.prepare(`SELECT * FROM packaging_templates WHERE packaging_template_id=? AND is_active=1`).bind(templateId).first();if(!template)throw new Error('Packaging template was not found.');
      const theme=safeJson(template.theme_json,{});
      const result=await a.db.prepare(`INSERT INTO packaging_projects (project_key,product_id,packaging_template_id,project_name,package_type,project_status,product_name,product_subtitle,product_identity_en,product_identity_fr,net_quantity_text,website_text,dealer_name,contact_text,made_in_canada_text,theme_json,compliance_status,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,'draft',?,?,?,?,?,?,?,?,?,?, 'needs_review',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(key,productId,templateId,text(body.project_name||`${productName} packaging`,180),template.package_type||'soap_ribbon',productName,text(body.product_subtitle||product?.short_description,220)||null,text(body.product_identity_en||(String(template.template_key||'').includes('scalloped')?'Luxury Soap':'Soap'),180),text(body.product_identity_fr||(String(template.template_key||'').includes('scalloped')?'Savon de luxe':'Savon'),180),text(body.net_quantity_text||(product?.weight_grams?`${product.weight_grams} g`:''),80)||null,text(body.website_text||'devilndove.com',220),text(body.dealer_name||'Devil n Dove',220),text(body.contact_text||'devilndove.com/contact',300),text(body.made_in_canada_text||'Made in Canada / Fabriqué au Canada',180),JSON.stringify(theme),a.adminUser.user_id,a.adminUser.user_id).run();
      projectId=id(result.meta?.last_row_id);message='Packaging project created from structured product data.';
    }else if(action==='save_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      const existing=await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!existing)throw new Error('Packaging project was not found.');
      const data=snapshotFromBody(body,mapProject(existing));if(!data.packaging_template_id||!data.project_name||!data.product_name)throw new Error('Template, project name and product name are required.');
      const missingRequired=packagingRequiredFields(data);
      if((data.project_status==='approved'||data.compliance_status==='approved')&&missingRequired.length)throw new Error(`Packaging cannot be approved while required fields are missing: ${missingRequired.join(', ')}.`);
      await a.db.prepare(`UPDATE packaging_projects SET product_id=?,packaging_template_id=?,project_name=?,package_type=?,project_status=?,collection_name=?,product_name=?,product_subtitle=?,product_identity_en=?,product_identity_fr=?,ingredients_inci=?,ingredients_en=?,ingredients_fr=?,net_quantity_text=?,website_text=?,dealer_name=?,dealer_address=?,contact_text=?,made_in_canada_text=?,claims_json=?,warnings_en=?,warnings_fr=?,icons_json=?,theme_json=?,artwork_json=?,print_notes=?,compliance_status=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(data.product_id,data.packaging_template_id,data.project_name,data.package_type,data.project_status,data.collection_name,data.product_name,data.product_subtitle,data.product_identity_en,data.product_identity_fr,data.ingredients_inci,data.ingredients_en,data.ingredients_fr,data.net_quantity_text,data.website_text,data.dealer_name,data.dealer_address,data.contact_text,data.made_in_canada_text,jsonText(data.claims,[]),data.warnings_en,data.warnings_fr,jsonText(data.icons,[]),jsonText(data.theme,{}),jsonText(data.artwork,{}),data.print_notes,data.compliance_status,a.adminUser.user_id,projectId).run();
      message='Packaging project saved.';
    }else if(action==='duplicate_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      const source=await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!source)throw new Error('Packaging project was not found.');
      const key=`PKG-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
      const columns=['product_id','packaging_template_id','package_type','collection_name','product_name','product_subtitle','product_identity_en','product_identity_fr','ingredients_inci','ingredients_en','ingredients_fr','net_quantity_text','website_text','dealer_name','dealer_address','contact_text','made_in_canada_text','claims_json','warnings_en','warnings_fr','icons_json','theme_json','artwork_json','print_notes'];
      const values=columns.map((column)=>source[column]);
      const result=await a.db.prepare(`INSERT INTO packaging_projects (project_key,project_name,project_status,compliance_status,created_by_user_id,updated_by_user_id,created_at,updated_at,${columns.join(',')}) VALUES (?,?,'draft','needs_review',?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,${columns.map(()=>'?').join(',')})`).bind(key,`${source.project_name} copy`,a.adminUser.user_id,a.adminUser.user_id,...values).run();
      projectId=id(result.meta?.last_row_id);message='Packaging project duplicated as a new draft.';
    }else if(action==='save_version'){
      if(!projectId)throw new Error('Packaging project is required.');
      const project=await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first();if(!project)throw new Error('Packaging project was not found.');
      const next=Number((await a.db.prepare(`SELECT COALESCE(MAX(version_number),0)+1 AS next_version FROM packaging_project_versions WHERE packaging_project_id=?`).bind(projectId).first())?.next_version||1);
      const snapshot=body.snapshot&&typeof body.snapshot==='object'?body.snapshot:mapProject(project);
      await a.db.prepare(`INSERT INTO packaging_project_versions (packaging_project_id,version_number,version_label,snapshot_json,svg_markup,review_status,created_by_user_id,created_at) VALUES (?,?,?,?,?,'needs_review',?,CURRENT_TIMESTAMP)`).bind(projectId,next,text(body.version_label,160)||`Version ${next}`,JSON.stringify(snapshot),text(body.svg_markup,100000)||null,a.adminUser.user_id).run();
      message=`Packaging version ${next} saved for review.`;
    }else if(action==='review_version'){
      const versionId=id(body.packaging_project_version_id);const status=VALID_VERSION_REVIEW.has(text(body.review_status,40))?text(body.review_status,40):'needs_review';if(!projectId||!versionId)throw new Error('Packaging project and version are required.');
      if(status==='approved'){
        const projectForApproval=mapProject(await a.db.prepare(`SELECT * FROM packaging_projects WHERE packaging_project_id=?`).bind(projectId).first()||{});
        const missingRequired=packagingRequiredFields(projectForApproval);
        if(missingRequired.length)throw new Error(`Packaging version cannot be approved while required fields are missing: ${missingRequired.join(', ')}.`);
      }
      await a.db.prepare(`UPDATE packaging_project_versions SET review_status=?,reviewed_by_user_id=?,reviewed_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE packaging_project_version_id=? AND packaging_project_id=?`).bind(status,a.adminUser.user_id,status,versionId,projectId).run();
      if(status==='approved')await a.db.prepare(`UPDATE packaging_projects SET project_status='approved',compliance_status=CASE WHEN compliance_status='blocked' THEN 'blocked' ELSE 'approved' END,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(a.adminUser.user_id,projectId).run();
      message='Packaging version review saved.';
    }else if(action==='record_export'){
      const format=text(body.export_format,30);if(!projectId||!VALID_EXPORTS.has(format))throw new Error('Packaging project and supported export format are required.');
      await a.db.prepare(`INSERT INTO packaging_export_history (packaging_project_id,packaging_project_version_id,export_format,file_name,export_status,source_snapshot_json,created_by_user_id,created_at) VALUES (?,?,?,?, 'prepared',?,?,CURRENT_TIMESTAMP)`).bind(projectId,id(body.packaging_project_version_id)||null,format,text(body.file_name,240)||null,JSON.stringify(body.snapshot&&typeof body.snapshot==='object'?body.snapshot:{}),a.adminUser.user_id).run();
      message='Packaging export recorded.';
    }else if(action==='archive_project'){
      if(!projectId)throw new Error('Packaging project is required.');
      await a.db.prepare(`UPDATE packaging_projects SET project_status='archived',updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_project_id=?`).bind(a.adminUser.user_id,projectId).run();message='Packaging project archived.';
    }else throw new Error('Unsupported Packaging Studio action.');
    const detail=projectId?await loadDetail(a.db,projectId):null;
    await auditAdminAction(context.env,context.request,a.adminUser,{action_type:`packaging_studio_${action}`,target_type:'packaging_project',target_id:projectId,target_key:detail?.project?.project_key||String(projectId||''),details:{review_first:true,automatic_publish:false}});
    return json({ok:true,message,build:BUILD,...await listData(a.db),detail});
  }catch(error){
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'packaging_studio',incident_code:'packaging_studio_post_failed',severity:'warning',message:error?.message||'Packaging Studio save failed.',related_user_id:a.adminUser.user_id,details:{action,error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,error:error?.message||'Packaging Studio save failed.'},400);
  }
}
