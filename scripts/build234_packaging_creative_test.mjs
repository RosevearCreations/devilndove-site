import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const hash=(name)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
const migration=read('database_build234_packaging_templates_creative_cleanup.sql');
assert.equal(read('database_upgrade_current_pass.sql'),migration,'Current-pass migration must equal the numbered Build 234 migration.');
assert(!/^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b/im.test(migration),'Migration contains an explicit transaction statement.');
for(const key of ['candle-top-wedding-4in-v1','candle-top-wedding-3-5in-v1','candle-top-round-3in-v1','round-maker-mark-4in-v1','product-label-oval-2x1-5in-v1','build234_packaging_templates_creative_cleanup','candle_top_template_proof'])assert(migration.includes(key),`Migration is missing ${key}.`);
for(const aggregate of ['database_schema.sql','database_full_schema.sql','database_store_schema.sql']){
  const db=new DatabaseSync(':memory:');db.exec(read(aggregate));db.exec(migration);db.exec(migration);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM packaging_templates WHERE template_key IN ('candle-top-wedding-4in-v1','candle-top-wedding-3-5in-v1','candle-top-round-3in-v1','round-maker-mark-4in-v1','product-label-oval-2x1-5in-v1')").get().n,5,`${aggregate} does not retain five Build 234 templates.`);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM packaging_reference_sources WHERE is_active=1').get().n,5,`${aggregate} does not retain five adopted references.`);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM startup_readiness_items WHERE is_active=1').get().n,44,`${aggregate} does not retain 44 Startup gates.`);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM schema_migration_ledger WHERE migration_key='build234_packaging_templates_creative_cleanup'").get().n,1,`${aggregate} duplicates the Build 234 ledger row.`);
}

assert.equal(hash('assets/packaging/reference/wedding-candle-top-john-laurie-approved-reference.png'),'8abe415ff7fb472fd28697a18638a9b30a7e8f53cce737eb5bc87f13c8cfa056','Owner candle-top reference checksum changed.');
assert.equal(hash('assets/packaging/soap/reference/glacial-purple-aloe-soap-approved-reference.png'),'297d8a7e737447c307523ea50b04d4967892e86c948f19745e35c114dd0a382c','Owner soap-label visual reference checksum changed.');
for(const asset of ['assets/packaging/artwork/soap-botanical-purple-rose-v1.png','assets/packaging/artwork/soap-botanical-purple-rose-v1.webp','assets/packaging/artwork/candle-top-wedding-line-art-v1.png','assets/packaging/artwork/candle-top-wedding-line-art-v1.webp'])assert(fs.statSync(path.join(root,asset)).size>10000,`${asset} is missing or unexpectedly small.`);

const routeFiles=['functions/api/admin/packaging-studio.js','functions/api/admin/creative-automation.js','functions/api/admin/creative-process.js','functions/api/admin/startup-readiness.js'];
for(const file of routeFiles){const source=read(file);assert(!source.includes('CREATE TABLE'),`${file} still contains request-time CREATE TABLE work.`);assert(!source.includes('ensureSchema('),`${file} still invokes request-time schema initialization.`);}
const packagingApi=read('functions/api/admin/packaging-studio.js');
assert(packagingApi.includes("data.package_type=template.package_type"),'Server does not make the selected template package type authoritative.');
assert(packagingApi.includes("action==='save_as_template'"),'Reusable-template action is missing.');
const creativeApi=read('functions/api/admin/creative-automation.js');
for(const token of ["action==='delete_project_preview'","action==='delete_project'",'DELETE ${row.project_key}','modified_output_count','modified_product_link_count','creative_automation_delete_unused_project'])assert(creativeApi.includes(token),`Guarded Creative deletion is missing ${token}.`);
assert(creativeApi.includes("DELETE FROM creative_project_product_links WHERE creative_work_project_id=?1"),'Automatic project-to-product link is not cleaned without deleting the product.');

const nodes=new Map();
const node=(value='',extra={})=>({value,checked:false,type:'text',tagName:'INPUT',...extra});
const document={getElementById:(name)=>nodes.get(name)||null,querySelectorAll:()=>[],addEventListener:()=>{},body:{appendChild:()=>{}},createElement:()=>node()};
const clientSource=read('public/js/admin-packaging-studio.js').replace("  document.addEventListener('DOMContentLoaded', () => { bind(); load(); });","  globalThis.__DD_PKG_TEST__={state,svgMarkup,currentTemplate,projectPayload,compliance};\n  document.addEventListener('DOMContentLoaded', () => { bind(); load(); });");
const context={document,localStorage:{setItem:()=>{},getItem:()=>null},crypto:globalThis.crypto,TextEncoder,Blob,URL,Image:class{},console,setTimeout,clearTimeout,confirm:()=>false,prompt:()=>'',open:()=>null,DDAuth:{apiFetch:()=>{throw new Error('not used');}}};
vm.createContext(context);vm.runInContext(clientSource,context,{filename:'admin-packaging-studio.js'});
const pkg=context.__DD_PKG_TEST__;
const set=(name,value,extra={})=>nodes.set(name,node(String(value??''),extra));
const common={packagingProjectId:1,packagingTemplateId:1,packagingProductId:'',packagingProjectName:'Proof',packagingType:'product_label',packagingStatus:'draft',packagingCompliance:'needs_review',packagingCollection:'Glacial Purple',packagingProductName:'Aloe Soap',packagingSubtitle:'Handcrafted with Care',packagingIdentityEn:'Aloe Soap',packagingIdentityFr:'Savon à l’aloès',packagingInci:'Aloe Barbadensis',packagingIngredientsEn:'Aloe Soap Base',packagingIngredientsFr:"Base de savon à l’aloès",packagingNetQuantity:'NET WT. APPROX. 4.5 OZ / 127 G',packagingNetWeightOz:4.5,packagingNetWeightG:127,packagingWebsite:'devilndove.com',packagingDealerName:'Rosevear Creations - Devil n Dove',packagingDealerAddress:'Ontario, Canada',packagingContact:'devilndove.com/contact',packagingMadeInCanada:'Made in Canada / Fabriqué au Canada',packagingWarningsEn:'',packagingWarningsFr:'',packagingPrintNotes:'',packagingRoseColour:'#7B4DA6',packagingThemeColour:'#FBF5E8',packagingBorderColour:'#32105E',packagingAccentGold:'#B88A2F',packagingSecondaryColour:'#5A2A86',packagingRoseAsset:'rose-purple-v1',packagingRoseStyle:'full_rose',packagingBadgeShape:'oval',packagingTopArcText:'Rosevear Creations',packagingBottomArcText:'MADE IN CANADA',packagingCentreMark:'♥'};
for(const [name,value] of Object.entries(common))set(name,value);
pkg.state.templates=[{packaging_template_id:1,template_name:'Soap',package_type:'soap_ribbon',page_width_mm:279.4,page_height_mm:38.1,front_width_mm:50.8,front_height_mm:38.1,rear_width_mm:38.1,rear_height_mm:38.1,layout:{shape:'soap_wrap',design_profile:'soap_reference_v2',band_height_mm:19.05,artwork_asset:'/assets/packaging/artwork/soap-botanical-purple-rose-v1.png'},theme:{}}];
let svg=pkg.svgMarkup();
for(const token of ['soap-botanical-purple-rose-v1.png','Rosevear Creations','- Devil n Dove -','Handmade in Small Batches','MADE IN CANADA','INGREDIENTS:','INGRÉDIENTS :','text-anchor="middle"'])assert(svg.includes(token),`Soap renderer is missing ${token}.`);
assert.equal(pkg.projectPayload().package_type,'soap_ribbon','Stale project package type overrode the selected soap template.');
fs.writeFileSync('/tmp/build234-soap-preview.svg',svg.replaceAll('href="/assets/',`href="${path.join(root,'assets')}/`));

set('packagingTemplateId',2);set('packagingType','soap_ribbon');set('packagingTopArcText','devilndove.com');set('packagingBottomArcText','Hand Made in Canada');set('packagingCandlePrimaryText','John and Laurie');set('packagingCandleDateLine1','March 3rd 1990');set('packagingCandleEventLine','35 Year Anniversary');set('packagingCandleDateLine2','March 3rd 2025');set('packagingArtworkAsset','/assets/packaging/artwork/candle-top-wedding-line-art-v1.png');
pkg.state.templates.push({packaging_template_id:2,template_name:'Wedding candle top',package_type:'candle_top',page_width_mm:101.6,page_height_mm:101.6,front_width_mm:101.6,front_height_mm:101.6,rear_width_mm:0,rear_height_mm:0,layout:{shape:'round',design_profile:'candle_top_wedding',safe_margin_mm:5,artwork_asset:'/assets/packaging/artwork/candle-top-wedding-line-art-v1.png'},theme:{theme_colour:'#FFFFFF',border_colour:'#000000'}});
svg=pkg.svgMarkup();
for(const token of ['candle-top-wedding-line-art-v1.png','John and Laurie','March 3rd 1990','35 Year Anniversary','March 3rd 2025','candle-top-upper-arc','candle-top-lower-arc','startOffset="50%"','text-anchor="middle"'])assert(svg.includes(token),`Candle-top renderer is missing ${token}.`);
assert.equal(pkg.projectPayload().package_type,'candle_top','Stale project package type overrode the selected candle-top template.');
fs.writeFileSync('/tmp/build234-candle-top-preview.svg',svg.replaceAll('href="/assets/',`href="${path.join(root,'assets')}/`));

for(const page of ['admin/packaging-studio/index.html','admin/creative-automation/index.html'])assert.equal((read(page).match(/<h1\b/gi)||[]).length,1,`${page} must have exactly one H1.`);
assert(read('css/styles.css').includes('data-preview-shape="round"'),'Round responsive preview CSS is missing.');
assert(read('STARTUP_GO_LIVE_GUIDE.md').includes('This guide contains 44 gates.'),'Generated Startup guide gate count is stale.');
console.log('Build 234 packaging, candle-top, guarded deletion, bounded D1 and schema checks passed.');
