import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {etsyStep503,etsyFailure503,etsyFixLocation503} from '../public/js/etsy-owner-diagnostics-503.mjs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('a failed read names the exact check and does not claim any Etsy write',()=>{
 const message=etsyFailure503('/api/admin/product-etsy-images?product_id=53',null,
   {httpStatus:503,cloudflareRay:'512d6501824ab39-YYZ'});
 assert.match(message,/Product photos and Etsy photo receipts/);
 assert.match(message,/HTTP 503/);
 assert.match(message,/512d6501824ab39-YYZ/);
 assert.match(message,/No Etsy changes were requested/);
 assert.doesNotMatch(message,/photo needs fixing|listing created/);
});

test('a failed link says recover saved ID first; a failed image write requires independent Etsy comparison',()=>{
 const link=etsyFailure503('/api/admin/product-etsy-existing-draft',
  {action:'link_existing',product_id:53,listing_id:'4603838854'}, {httpStatus:503});
 assert.match(link,/listing ID against Product #53/);
 assert.match(link,/might have saved/);
 assert.match(link,/Refresh the saved Etsy ID/);
 const image=etsyFailure503('/api/admin/product-etsy-images',
  {action:'transfer_one',product_image_id:344}, {httpStatus:503});
 assert.match(image,/photo #344/);
 assert.match(image,/might have happened/);
 assert.match(image,/before attempting another update/);
 assert.equal(etsyStep503('/api/admin/product-etsy-existing-draft',{action:'inspect_listing'}).kind,'read');
});

test('missing product requirements point to their specific owner editor tab',()=>{
 assert.deepEqual(etsyFixLocation503(['Photo #344: public-use approval missing']),{tab:'media',label:'Fix photographs'});
 assert.deepEqual(etsyFixLocation503(['Save Product search tags']),{tab:'seo',label:'Fix Product search tags'});
 assert.deepEqual(etsyFixLocation503(['Product description is only its title']),{tab:'description',label:'Fix Product description'});
 assert.equal(etsyFixLocation503(['HTTP 503 from Cloudflare']),null);
});

test('Product #53 cannot accidentally create another Etsy draft while its candidate ID is present',()=>{
 const editor=source('admin/product-editor/index.html');
 const ui=source('public/js/admin-product-etsy-package-v500.mjs');
 assert.match(editor,/id="dd503OwnerNote"/);
 assert.match(editor,/id="dd503Fix"/);
 assert.match(editor,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
 assert.match(ui,/hasCandidate\?`Step 1: Verify and link existing Etsy draft/);
 assert.match(ui,/if\(!state\.linked&&\/\^\[1-9\]\\d\{0,14\}\$\/.test\(candidate\)\)void linkExisting\(\)/);
 assert.match(ui,/Promise\.allSettled/);
 assert.match(ui,/await linkExisting\(\);\s*if\(!state\.linked\)/);
 assert.ok(ui.indexOf('await linkExisting();',ui.indexOf('async function syncAfterSave'))<
   ui.indexOf('if(!state.loaded||!state.assessment?.ready)',ui.indexOf('async function syncAfterSave')),
   'existing ID verification must precede photo/tag readiness on an opted-in Save');
 assert.match(ui,/state\.readIssues=Array\.isArray\(error\.issues\)/);
 assert.match(ui,/Etsy search tags: the saved override is “Soap bars”/);
 assert.match(ui,/Product description: the saved text appears to contain only the Product name/);
});

test('uncertain local Product save checks the server copy without repeating POST',()=>{
 const ui=source('public/js/admin-product-editor-v163.js');
 const api=source('functions/api/admin/product-editor-save.js');
 const link=source('functions/api/admin/product-etsy-existing-draft.js');
 assert.match(ui,/pendingSaveCheck/);
 assert.match(ui,/STEP 1 VERIFIED — Product/);
 assert.match(ui,/verdict\.fieldSnapshots/);
 assert.match(api,/no_product_write_started:true/);
 assert.match(link,/async function localLinkOnly/);
 assert.match(link,/localLinkOnly\(db,Number\(id\)\)/);
 assert.match(link,/g\.db\.withSession\('first-primary'\)/);
 assert.match(link,/connectionBlockers\(s\.conn,s\.shop,env\)/);
});
