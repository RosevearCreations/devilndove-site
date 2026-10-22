#!/usr/bin/env node
/* Full-site static Brand V3 visual audit. Strictly reads repository files.
   No API calls, secrets, screenshots, mutations, or fabricated live results. */
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const skip=new Set(['.git','.github','admin','assets','css','functions','js','public','scripts','node_modules','test','tests','docs','migrations','sql','.wrangler','dist']);
const pages=[];
function walk(dir=''){
 for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const rel=path.posix.join(dir,entry.name);
  if(entry.isDirectory()){
   if(!skip.has(entry.name))walk(rel);
  }else if(entry.isFile()&&entry.name==='index.html'){
   pages.push(rel);
  }
 }
}
walk();
pages.sort();
const files=new Set();
function walkAssets(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const abs=path.join(dir,entry.name);
  if(entry.isDirectory())walkAssets(abs);
  else if(entry.isFile())files.add('/'+path.relative(root,abs).replaceAll(path.sep,'/'));
 }
}
walkAssets(path.join(root,'assets'));
const summaries=pages.map(p=>{
 const html=fs.readFileSync(path.join(root,p),'utf8');
 const imgs=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
 const literalImgs=[...html.matchAll(/\b(?:src|data-src)=["'](\/assets\/(?:images|placeholders)\/[^"']+)["']/gi)].map(m=>m[1].split('?')[0]);
 const unresolved=literalImgs.filter(f=>!files.has(f));
 const labels=(html.match(/data-media-placeholder="1"/g)||[]).length;
 const genericArtworkSvgRefs=(html.match(/\/assets\/visual-placeholders\/[^"'<>\s]+\.svg/gi)||[]).length;
 const curatedBrandV3Defaults=(html.match(/data-brand-v3-curated-default="/g)||[]).length;
 const directTheme=html.includes('/css/brand-v3-theme.css');
 const mappedAuto=html.includes('/public/js/brand-v3-auto.js');
 const body=/<body\b/i.test(html);
 const sharedStyle=/\/css\/styles\.css/.test(html);
 const hasCards=/\bcard\b/.test(html);
 const hero=/\b(?:hero|page-hero|public-media-band)\b/.test(html);
 return {page:p,route:p==='index.html'?'/':'/'+p.replace(/index\.html$/,''),css:sharedStyle,directTheme,brandAuto:mappedAuto,body,cards:hasCards,hero,images:imgs.length,imagesMissingAlt:imgs.filter(img=>!/\balt\s*=/.test(img)).length,placeholderSlots:labels,genericArtworkSvgRefs,curatedBrandV3Defaults,missingStaticAssets:unresolved};
});
const middleware=fs.readFileSync(path.join(root,'functions/_middleware.js'),'utf8');
const reports={
 checkedAt:new Date().toISOString(),
 scannedPages:summaries.length,
 serverThemeInjection:{
   general:middleware.includes('withPlatformClient(')&&middleware.includes('data-dd-brand-v3-theme'),
   storefrontFast:middleware.includes('function storefrontFastPlatformMarkup()')&&middleware.includes('data-dd-brand-v3-theme'),
   productsFast:middleware.includes('function productsPlatformMarkup()')&&middleware.includes('data-dd-brand-v3-theme'),
   adminHomeIsSpecial:middleware.includes("normalizedPath === '/admin/'")
 },
 counts:{
  baseCss:summaries.filter(x=>x.css).length,
  explicitImageMapping:summaries.filter(x=>x.brandAuto).length,
  siteWideSharedTheme:middleware.includes('data-dd-brand-v3-theme'),
  pagesWithMediaPlaceholders:summaries.filter(x=>x.placeholderSlots).length,
  remainingMediaPlaceholders:summaries.reduce((sum,x)=>sum+x.placeholderSlots,0),
  // Editable Media Studio hooks use a runtime WebP recovery map; do not call them unfilled assets.
  mediaStudioEditablePlaceholderHooks:summaries.reduce((sum,x)=>sum+x.placeholderSlots,0),
  genericArtworkSvgReferences:summaries.reduce((sum,x)=>sum+x.genericArtworkSvgRefs,0),
  curatedBrandV3AuthoredDefaults:summaries.reduce((sum,x)=>sum+x.curatedBrandV3Defaults,0),
  imageElements:summaries.reduce((sum,x)=>sum+x.images,0),
  missingAlt:summaries.reduce((sum,x)=>sum+x.imagesMissingAlt,0),
  missingStaticImageReferences:summaries.reduce((sum,x)=>sum+x.missingStaticAssets.length,0),
 },
 flaggedPages:summaries.filter(x=>!x.css||x.placeholderSlots||x.imagesMissingAlt||x.missingStaticAssets.length||!x.brandAuto),
 pages:summaries
};
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/brand-v3-frontsite-audit.json'),JSON.stringify(reports,null,2));
console.log('FRONTSITE_VISUAL_AUDIT_SUMMARY='+JSON.stringify({...reports,flaggedPages:undefined,pages:undefined}));
console.log('NO_BASE_CSS='+JSON.stringify(summaries.filter(x=>!x.css).map(x=>x.page)));
console.log('NO_EXPLICIT_BRAND_MAP='+JSON.stringify(summaries.filter(x=>!x.brandAuto).map(x=>x.page)));
console.log('PLACEHOLDER_PAGES='+JSON.stringify(summaries.filter(x=>x.placeholderSlots).map(x=>({page:x.page,slots:x.placeholderSlots}))));
console.log('MISSING_STATIC_IMAGES='+JSON.stringify(summaries.filter(x=>x.missingStaticAssets.length).map(x=>({page:x.page,assets:x.missingStaticAssets}))));
console.log('GENERIC_SVG_ARTWORK='+JSON.stringify(summaries.filter(x=>x.genericArtworkSvgRefs).map(x=>({page:x.page,count:x.genericArtworkSvgRefs}))));
console.log('MISSING_ALTS='+JSON.stringify(summaries.filter(x=>x.imagesMissingAlt).map(x=>({page:x.page,count:x.imagesMissingAlt}))));
if(reports.counts.genericArtworkSvgReferences){
 console.error('BUILD_433_PLACEHOLDER_HOLD: Generic SVG illustrations remain on customer routes');
 process.exitCode=1;
}
if(pages.length<60 || !reports.serverThemeInjection.general || !reports.serverThemeInjection.storefrontFast || !reports.serverThemeInjection.productsFast){
 console.error('BASE_AUDIT_FAILED: missing pages or core Brand V3 stylesheet coverage');
 process.exitCode=1;
}
