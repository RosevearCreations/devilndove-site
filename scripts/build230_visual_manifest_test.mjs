import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const hash=(name)=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');

const startupApi=read('functions/api/admin/startup-readiness.js');
const startupStart=startupApi.indexOf('const STARTUP_ITEMS = ')+22;
const startupEnd=startupApi.indexOf('\n];',startupStart)+2;
const startupItems=JSON.parse(startupApi.slice(startupStart,startupEnd));
assert(startupItems.length===44,`Expected the current 44 Startup gates, found ${startupItems.length}.`);
assert(new Set(startupItems.map((item)=>item.key)).size===44,'Startup keys must remain unique.');
const imageGate=startupItems.find((item)=>item.key==='missing_launch_images');
assert(imageGate?.route==='/admin/image-manifest/','Missing-image gate must open the Visual Image Manifest.');
assert(String(imageGate?.instructions||'').includes('12. Reopen this gate'),'Missing-image gate must retain 12 detailed steps.');

const manifestClient=read('public/js/admin-image-manifest.js');
const fallbackStart=manifestClient.indexOf('const FALLBACK_ROWS=')+'const FALLBACK_ROWS='.length;
const fallbackEnd=manifestClient.indexOf(';\n  const FALLBACK=',fallbackStart);
const fallbackRows=Function(`"use strict";return (${manifestClient.slice(fallbackStart,fallbackEnd)});`)();
assert(fallbackRows.length===20,`Expected 20 fallback manifest rows, found ${fallbackRows.length}.`);
assert(new Set(fallbackRows.map((row)=>row[0])).size===20,'Fallback manifest keys must remain unique.');
assert(manifestClient.includes('Unsynced fallback — review only.'),'Manifest fallback must be visibly Unsynced.');
assert(manifestClient.includes("const locked=state.fallback?' disabled':''"),'Manifest fallback must disable saving controls.');

const migration=read('database_build230_visual_image_manifest.sql');
assert(!/^\s*(BEGIN(?:\s+TRANSACTION)?|COMMIT|SAVEPOINT|RELEASE(?:\s+SAVEPOINT)?|ROLLBACK)\b/im.test(migration),'Build 230 migration contains an explicit SQL transaction statement.');
const seedSection=migration.slice(migration.indexOf('INSERT INTO image_manifest_items'),migration.indexOf('\nON CONFLICT(manifest_key)'));
const seedKeys=[...seedSection.matchAll(/^\s*\('([^']+)'/gm)].map((match)=>match[1]);
assert(seedKeys.length===20,`Expected 20 migration manifest seeds, found ${seedKeys.length}.`);
assert(new Set(seedKeys).size===20,'Migration manifest keys must remain unique.');
assert(migration.includes('build230_visual_image_manifest'),'Build 230 ledger key is missing.');

const assets={
  'assets/generated/editorial/workshop-discovery-illustration.webp':'dfec6faef75127e75dd8d91a0b41ac6048186be8cbb8a7d7e41d42b72f92d03f',
  'assets/generated/editorial/workshop-discovery-illustration-768.webp':'2e1c2ac85f7934b5a211899bb32a345db5ef0b8fe82a2171488ec99249c6c5d6',
  'assets/generated/editorial/handmade-jewelry-techniques-illustration.webp':'4c99b7b054a7f0333d157b073725664a77becf11b29f9d83ed91bfc140b53267',
  'assets/generated/editorial/handmade-jewelry-techniques-illustration-768.webp':'8534956d09f15d5a79acc98c8e045a00d932abc19b1e793e5af4b5581019a13b',
  'assets/generated/editorial/gift-card-brand-illustration.webp':'4ae58aab03776005b5ab68b802e30e6a6150d4a5058633a20d9d5f785026a766',
  'assets/generated/editorial/gift-card-brand-illustration-768.webp':'3b13f341f9a960b63b93402c781c0f9b7e11d5317c02a7fe94666f1354fa8d58'
};
for(const [name,wanted] of Object.entries(assets))assert(hash(name)===wanted,`${name} checksum differs from the provenance register.`);

for(const page of ['index.html','handmade-jewelry-ontario/index.html','gift-cards/index.html','admin/image-manifest/index.html']){
  const html=read(page);
  assert((html.match(/<h1\b/gi)||[]).length===1,`${page} must contain exactly one H1.`);
  assert(/<meta\b[^>]*name=["']viewport["']/i.test(html),`${page} is missing its viewport meta tag.`);
}
assert(!/assets\/generated\/editorial/i.test(read('workshop-journal/index.html')),'Workshop Journal must keep its real-photo requirement rather than reuse a generated asset.');
assert(!/assets\/generated\/editorial/i.test(read('polymer-clay-earrings-ontario/index.html')),'Polymer-clay page must keep its real-photo requirement rather than reuse a generated asset.');

console.log('Build 230 visual manifest retained checks plus current Startup authority, generated provenance and one-H1 checks: PASS');
