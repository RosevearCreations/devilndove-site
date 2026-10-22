#!/usr/bin/env node
// Release 467 Build 436: verify real Admin artwork inventory, optional fallback and route integrity.
// Existing binaries are owner-owned; absent optional artwork is never fabricated.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const root=process.cwd();
const refs=[];
for(let set=13;set<=19;set++){
 const moduleFile=`public/js/admin-brand-v3-set${set}.js`;
 const source=fs.readFileSync(moduleFile,'utf8');
 assert.match(source,/new Image\(\)/,moduleFile+': requires probe-before-insert');
 assert.match(source,/\.onload\s*=/,moduleFile+': requires successful load handler');
 assert.match(source,/\.onerror\s*=/,moduleFile+': requires image-missing fallback');
 assert.doesNotMatch(source,/(?:fetch\(|XMLHttpRequest|\.post\(|\.delete\(|\.put\()/i,moduleFile+' cannot change business data');
 const pairs=[...source.matchAll(/["'](\/admin\/[^"']+\/?)["']\s*:\s*["']([^"']+\.webp)["']/g)];
 assert.equal(pairs.length,10,moduleFile+' must map ten distinct banners');
 for(const [,route,file] of pairs)refs.push({set,route,file,asset:path.join('assets/images/brand-v3',file)});
}
const nameSet=new Set(refs.map(r=>r.file));
assert.equal(refs.length,70);
assert.equal(nameSet.size,70,'70 Admin mapped assets must be distinct');
for(const row of refs){
 const adminDir=path.join(root,row.route.replace(/^\//,''),'index.html');
 assert.ok(fs.existsSync(adminDir),row.route+' Admin route missing');
}
const entries=refs.map(row=>{
 const present=fs.existsSync(path.join(root,row.asset));
 let valid=false,bytes=0;
 if(present){
   const file=fs.readFileSync(path.join(root,row.asset));
   bytes=file.length;
   valid=file.length>64&&file.toString('ascii',0,4)==='RIFF'&&file.toString('ascii',8,12)==='WEBP';
 }
 return {...row,status:!present?'MISSING_OPTIONAL_WEBP':valid?'VALID_WEBP':'INVALID_WEBP',bytes};
});
const missing=entries.filter(x=>x.status==='MISSING_OPTIONAL_WEBP');
const invalid=entries.filter(x=>x.status==='INVALID_WEBP');
const report={build:436,scope:'Admin Brand V3 Sets 13-19',mapped:entries.length,
  valid:entries.filter(x=>x.status==='VALID_WEBP').length,
  missing_optional:missing.length,invalid:invalid.length,
  policy:'Absent optional WebPs must leave existing Admin page intact; no replacement or overwrite of owner media.',
  assets:entries};
fs.writeFileSync('release436-admin-artwork-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('Build 436 Admin artwork:',report.mapped,'mapped;',report.valid,'valid WebPs;',report.missing_optional,'missing optional;',report.invalid,'invalid');
if(missing.length)console.log('Optional artwork still missing:',missing.map(x=>x.file).join(', '));
test('Admin artwork mappings keep correct routes and safe fallback behaviour',()=>{
 assert.equal(entries.length,70);
 assert.equal(invalid.length,0,'Committed Admin WebPs with invalid binary headers');
 assert.equal(entries.filter(x=>x.status==='VALID_WEBP').length+missing.length,70);
});
test('Media Studio preserves owner-controlled overrides and consent instead of faking or overwriting media',()=>{
 const page=fs.readFileSync('admin/media-content-studio/index.html','utf8');
 const script=fs.readFileSync('public/js/admin-media-content-studio.js','utf8');
 const manifest=fs.readFileSync('functions/api/public-media-content-manifest.js','utf8');
 assert.match(page,/Save details &amp; use in this location/);
 assert.match(page,/Save details only \(do not change page\)/);
 assert.match(page,/Use original\/default/);
 assert.match(script,/remove_assignment/);
 assert.match(manifest,/a\.active=1/);
 assert.match(manifest,/ma\.deleted_at IS NULL/);
 assert.match(manifest,/!row\.archived_at/);
});
