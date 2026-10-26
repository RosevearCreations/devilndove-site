import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('Build 488 makes NEW and UPDATE draft workflows explicit without automatic publishing',()=>{
 const html=read('../admin/product-editor/index.html');const ui=read('../public/js/admin-product-etsy-guide-v488.js');
 for(const marker of ['dd488ChooseNew','dd488ChooseExisting','dd488NewWorkflow','dd486EtsyExisting','dd488CheckReadiness','dd488ReadinessList','dd488MediaLink'])assert.match(html,new RegExp(`id="${marker}"`));
 assert.match(ui,/mode!=='new'/);assert.match(ui,/mode!=='existing'/);
 assert.match(ui,/Promise\.all/);assert.match(ui,/approved_for_distribution/);
 assert.match(ui,/product-etsy-existing-draft\?product_id=/);
 assert.match(ui,/product-etsy-images\?product_id=/);
 assert.doesNotMatch(ui,/method:'POST'|method:'PATCH'|fetch\('https:\/\/api\.etsy/);
 assert.match(html,/future one-step send/);
});
