import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const api=fs.readFileSync(new URL('../functions/api/admin/startup-readiness.js',import.meta.url),'utf8');
const itemsStart=api.indexOf('const STARTUP_ITEMS = ')+22;const itemsEnd=api.indexOf('\n];',itemsStart)+2;const items=JSON.parse(api.slice(itemsStart,itemsEnd));
assert.equal(items.length,46,'current authority must retain 46 gate definitions');
assert.equal(new Set(items.map((row)=>row.key)).size,46,'gate keys must be unique');
assert.match(api,/const BUILD = '241'/);assert.match(api,/const GATE_FIX_FOCUS/);assert.match(api,/correction_guidance/);assert.match(api,/evidence_guidance/);assert.match(api,/retest_guidance/);
for(const row of items){assert.ok(row.instructions.split('\n').length>=6,`${row.key} needs at least six numbered test steps`);assert.ok(row.pass.length>30,`${row.key} needs a substantive pass condition`);assert.ok(api.includes(`${row.key}:'`)||api.includes(`${row.key}:"`),`${row.key} needs gate-specific correction focus`);}

const source=fs.readFileSync(new URL('../public/js/admin-startup-readiness.js',import.meta.url),'utf8');
async function renderWithResponse(response){
  let readyHandler=null;const nodes={startupReadinessMount:{innerHTML:''},startupReadinessMessage:{hidden:true,textContent:'',className:''}};const storage=new Map();
  const context={console,Blob,FormData,Response,URL,setTimeout,clearTimeout,localStorage:{getItem:(key)=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},document:{addEventListener:(name,handler)=>{if(name==='DOMContentLoaded')readyHandler=handler;},getElementById:(name)=>nodes[name]??null,querySelectorAll:()=>[]},DDAuth:{apiFetch:async()=>response.clone()}};
  vm.runInNewContext(source,context,{filename:'admin-startup-readiness.js'});await readyHandler();return nodes;
}
for(const response of [new Response('<!doctype html><title>Fallback page</title>',{status:200,headers:{'Content-Type':'text/html'}}),Response.json({ok:true,build:'227',expected_total:37,items:[]})]){
  const nodes=await renderWithResponse(response);assert.equal((nodes.startupReadinessMount.innerHTML.match(/data-key=/g)||[]).length,46);assert.match(nodes.startupReadinessMount.innerHTML,/If any step fails: how to correct it/);assert.match(nodes.startupReadinessMount.innerHTML,/Evidence to save/);assert.match(nodes.startupReadinessMount.innerHTML,/Retest and reopen rule/);assert.doesNotMatch(nodes.startupReadinessMount.innerHTML,/No readiness items match these filters/);
}
console.log('Build 227 Startup Readiness gate authority and degraded UI: PASS');
