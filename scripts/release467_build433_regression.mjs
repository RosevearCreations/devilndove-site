#!/usr/bin/env node
// Release 467 Build 433: strict repository-only customer image coverage / owner-media safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read=p=>fs.readFileSync(p,'utf8');
const selected=[
  {page:'tools/index.html',file:'44-workshop-tools.webp',key:'tools'},
  {page:'supplies/index.html',file:'45-materials-supplies.webp',key:'supplies'},
  {page:'toolshed/index.html',file:'09-vintage-finds-category.webp',key:'toolshed'},
  {page:'workshop-made-gifts-ontario/index.html',file:'293-custom-gifts-southern-ontario-content-visual.webp',key:'workshop-gifts-hero',slot:'workshop-made-gifts-ontario.hero.image'},
  {page:'workshop-made-gifts-ontario/index.html',file:'286-home-workshop-process-visual.webp',key:'workshop-gifts-process',slot:'workshop-made-gifts-ontario.image.1'}
];
const skip=new Set(['.git','.github','admin','assets','css','functions','js','public','scripts','node_modules','test','tests','docs','migrations','sql','.wrangler','dist']);
function publicHtml(directory=''){
  const pages=[];
  for(const entry of fs.readdirSync(directory||'.',{withFileTypes:true})){
    if(entry.isDirectory()&&!skip.has(entry.name))pages.push(...publicHtml(path.join(directory,entry.name)));
    if(entry.isFile()&&entry.name==='index.html')pages.push(path.join(directory,entry.name));
  }
  return pages;
}
test('five customer-facing generic SVG placeholders are replaced by existing valid WebP artwork',()=>{
 for(const item of selected){
   const markup=read(item.page);
   assert.ok(markup.includes('data-brand-v3-curated-default="'+item.key+'"'),item.page+': artwork key missing');
   assert.ok(markup.includes('/assets/images/brand-v3/'+item.file),item.page+': dedicated asset reference missing');
   const filepath='assets/images/brand-v3/'+item.file;
   assert.ok(fs.existsSync(filepath),filepath+' missing');
   const bytes=fs.readFileSync(filepath);
   assert.ok(bytes.length>1000,filepath+' unexpectedly small');
   assert.equal(bytes.toString('ascii',0,4),'RIFF',filepath+' has invalid RIFF header');
   assert.equal(bytes.toString('ascii',8,12),'WEBP',filepath+' is not a WebP');
   if(item.slot)assert.ok(markup.includes('data-media-slot="'+item.slot+'"'),item.slot+' lost owner Media Studio override hook');
 }
});
test('all public HTML routes have zero remaining generic visual-placeholder SVG asset references',()=>{
 const pages=publicHtml();
 assert.ok(pages.length>=70,'unexpected public route loss');
 for(const p of pages){
   const markup=read(p);
   assert.doesNotMatch(markup,/\/assets\/visual-placeholders\/[^"'<>\s]+\.svg/i,
     p+' still shows a generic SVG instead of an intentional customer image');
 }
});
test('catalog illustrations are placed once per page after area-group rendering, never once per group',()=>{
 for(const p of ['tools/index.html','supplies/index.html','toolshed/index.html']){
   const html=read(p);
   assert.equal((html.match(/class="card visual-placeholder-band dd-brand-v3-public-art/g)||[]).length,1,
      p+' must contain only one curated art block');
   assert.match(html,/\)\.join\(['"]{2}\) \+ `\s*<section class="card visual-placeholder-band dd-brand-v3-public-art/,
      p+' art should be outside the group loop');
   assert.doesNotMatch(html,/<h2>(Tool proof placeholder|Materials placeholder|Tool condition placeholder)<\/h2>/);
 }
});
test('workshop Media Studio ownership remains intact and catalog sizing is 1600x1000 for both assets',()=>{
 const markup=read('workshop-made-gifts-ontario/index.html');
 for(const key of ['workshop-made-gifts-ontario.hero.image','workshop-made-gifts-ontario.image.1']){
   assert.ok(markup.includes('data-media-slot="'+key+'"'));
   assert.ok(markup.includes('data-media-label='));
 }
 const catalog=JSON.parse(read('public/data/media-content-slot-catalog.json'));
 const slots=(catalog.groups||[]).flatMap(g=>(g.pages||[]).flatMap(p=>p.slots||[]));
 for(const key of ['workshop-made-gifts-ontario.hero.image','workshop-made-gifts-ontario.image.1']){
   const slot=slots.find(s=>s.slot_key===key);
   assert.ok(slot,key+' absent from Media Studio catalog');
   assert.equal(Number(slot.recommended_width_px),1600);
   assert.equal(Number(slot.recommended_height_px),1000);
 }
 const css=read('css/brand-v3-frontsite-recovery.css');
 assert.match(css,/\.dd-brand-v3-public-art img\{/);
 assert.match(css,/object-fit:contain/);
 assert.match(css,/@media\(max-width:640px\)/);
 const recovery=read('public/js/brand-v3-frontsite-recovery.js');
 assert.match(recovery,/data-media-placeholder/);
 assert.match(recovery,/current\.startsWith\('\/assets\/placeholders\/'\)/);
});
